import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatAssistant from "./ChatAssistant";

const quote = { divorce_risk: 0.625, premium: 1124.7, payout: 10000, email_status: "not_requested" };
const respond = data => Promise.resolve({ ok: true, json: async () => data });
beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { jest.restoreAllMocks(); });

test("FAQ classification sends only the public topic, never the typed personal text", async () => {
  fetch.mockImplementation(() => respond({ reply: "A single upfront payment.", source: "gemini" }));
  render(<ChatAssistant />);
  fireEvent.change(screen.getByLabelText("Ask a product question"), { target: { value: "How is my premium calculated? My email is private@example.invalid" } });
  fireEvent.click(screen.getByRole("button", { name: "Send", exact: true }));
  await screen.findByText("A single upfront payment.");
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ topic: "email" });
  expect(fetch.mock.calls[0][1].body).not.toContain("private@example.invalid");
});

async function completeQuote() {
  fireEvent.click(screen.getByRole("button", { name: "Get a quote", exact: true }));
  fireEvent.change(screen.getByLabelText("Age group"), { target: { value: "30 to 34 years" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.change(screen.getByLabelText("Years together"), { target: { value: "5 years" } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.change(screen.getByLabelText("Province or territory"), { target: { value: "Ont." } });
  fireEvent.click(screen.getByRole("button", { name: "Get quote", exact: true }));
  await screen.findByText("Your personalized quote");
}

test("guided quote uses pricing backend, explains locally, and emails only after confirmation", async () => {
  fetch.mockImplementation(() => respond(quote));
  render(<ChatAssistant />);
  await completeQuote();
  expect(fetch.mock.calls[0][0]).toMatch(/\/predict$/);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ AgeGroup: "30 to 34 years", YearsTogether: "5 years", Province: "Ont." });
  expect(screen.getByText("$1,124.70")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Explain my quote" }));
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Email my quote" }));
  expect(fetch).toHaveBeenCalledTimes(1);
  fireEvent.change(screen.getByLabelText("Email for your quote"), { target: { value: "test@example.invalid" } });
  fetch.mockImplementation(() => respond({ ...quote, email_status: "accepted" }));
  fireEvent.click(screen.getByRole("button", { name: "Send quote" }));
  await screen.findByText("Your quote email has been submitted. Check your inbox and spam folder.");
  expect(JSON.parse(fetch.mock.calls[1][1].body).email).toBe("test@example.invalid");
  fireEvent.click(screen.getByRole("button", { name: "Start over" }));
  expect(screen.queryByText("Your personalized quote")).not.toBeInTheDocument();
  expect(screen.queryByText("30 to 34 years")).not.toBeInTheDocument();
});

test("reset prevents a late response from repopulating the cleared chat", async () => {
  let finish;
  fetch.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<ChatAssistant />);
  fireEvent.click(screen.getByRole("button", { name: "How is my premium calculated?" }));
  fireEvent.click(screen.getByRole("button", { name: "Start over" }));
  finish({ ok: true, json: async () => ({ reply: "Old response" }) });
  await waitFor(() => expect(screen.queryByText("Old response")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Get a quote", exact: true })).toBeEnabled();
});

test("unknown questions stay local and show suggested topics", () => {
  render(<ChatAssistant />);
  fireEvent.change(screen.getByLabelText("Ask a product question"), { target: { value: "My name is Private" } });
  fireEvent.click(screen.getByRole("button", { name: "Send", exact: true }));
  expect(fetch).not.toHaveBeenCalled();
  expect(screen.getByText(/Choose a suggested question below/)).toBeInTheDocument();
});
