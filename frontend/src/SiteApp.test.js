import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  window.scrollTo = jest.fn();
});
afterEach(() => { window.history.replaceState(null, "", "/"); });

function navigate(path) {
  window.location.hash = "#/" + path;
  fireEvent(window, new Event("hashchange"));
}

test("home introduces the initiative and top navigation opens separate pages", async () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: "A little clarity for life's uncertainties." })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Planning for change, with more clarity." })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Get a Quote", exact: true })).toHaveAttribute("href", "#/quote");
  navigate("faq");
  await screen.findByRole("heading", { name: "Frequently asked questions" });
  expect(screen.queryByRole("heading", { name: "A little clarity for life's uncertainties." })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "FAQ", exact: true })).toHaveAttribute("aria-current", "page");
  expect(within(screen.getByRole("main")).getByText("How is my premium calculated?")).toBeInTheDocument();
  navigate("quote");
  await screen.findByRole("heading", { name: "Divorce Insurance Quote" });
  expect(screen.getByLabelText("Age Group:")).toBeInTheDocument();
  navigate("home");
  await screen.findByRole("heading", { name: "A little clarity for life's uncertainties." });
});

test("direct FAQ link works and Ask AI opens the persistent chatbot", async () => {
  window.history.replaceState(null, "", "/#/faq");
  render(<App />);
  expect(screen.getByRole("heading", { name: "Frequently asked questions" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ask the AI assistant" }));
  expect(screen.getByRole("heading", { name: "Let's talk protection" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Get a quote", exact: true }));
  navigate("home");
  await waitFor(() => expect(screen.getByLabelText("Age group")).toBeInTheDocument());
  expect(screen.getByRole("heading", { name: "Let's talk protection" })).toBeInTheDocument();
});

test("unknown hash routes fall back to Home", () => {
  window.history.replaceState(null, "", "/#/missing");
  render(<App />);
  expect(screen.getByRole("heading", { name: "A little clarity for life's uncertainties." })).toBeInTheDocument();
});
