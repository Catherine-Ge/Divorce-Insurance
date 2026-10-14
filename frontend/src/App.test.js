import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

test("original quote form remains available and quotes without requiring email", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ divorce_risk: 0.625, premium: 1124.7, payout: 10000, email_status: "not_requested" }),
  });
  render(<App />);
  fireEvent.click(screen.getByRole("button", { name: "Open chat assistant" }));
  expect(screen.getByRole("heading", { name: "Let's talk protection" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Age Group:"), { target: { value: "30 to 34 years" } });
  fireEvent.change(screen.getByLabelText("Years Together:"), { target: { value: "5 years" } });
  fireEvent.change(screen.getByLabelText("Province:"), { target: { value: "Ont." } });
  expect(screen.getByLabelText("Email:")).not.toBeRequired();
  fireEvent.click(screen.getByRole("button", { name: "Get My Quote" }));
  await screen.findByText("Quote Details:");
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ AgeGroup: "30 to 34 years", YearsTogether: "5 years", Province: "Ont." });
});
