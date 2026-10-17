import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatAssistant from "./ChatAssistant";
import { TextDecoder, TextEncoder } from 'util';
global.TextDecoder = TextDecoder;
const streamed = text => {
  const bytes = new TextEncoder().encode(JSON.stringify({type: 'delta', text}) + '\n' + JSON.stringify({type: 'done', source: 'gemini'}) + '\n');
  let read = false;
  return Promise.resolve({ok: true, body: {getReader: () => ({
    read: async () => { if (read) return {done: true}; read = true; return {done: false, value: bytes}; },
    cancel: async () => {}, releaseLock: () => {},
  })}});
};

const quote = { divorce_risk: 0.625, premium: 1124.7, payout: 10000, email_status: "not_requested" };
const respond = data => Promise.resolve({ ok: true, json: async () => data });
beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { jest.restoreAllMocks(); });

test("free-form questions include recent turns for follow-ups", async () => {
  fetch.mockImplementationOnce(() => streamed("A single upfront payment."))
    .mockImplementationOnce(() => streamed("That means you pay once."));
  render(<ChatAssistant />);
  fireEvent.click(screen.getByRole("button", { name: "Open chat assistant" }));
  const send = question => {
    fireEvent.change(screen.getByLabelText("Ask a product question"), { target: { value: question } });
    fireEvent.click(screen.getByRole("button", { name: "Send", exact: true }));
  };
  send("How is my premium calculated?");
  await screen.findByText("A single upfront payment.");
  await waitFor(() => expect(screen.getByLabelText("Ask a product question")).toBeEnabled());
  send("Can you explain that more simply?");
  await screen.findByText("That means you pay once.");
  expect(fetch.mock.calls[0][0]).toMatch(/\/chat\/stream$/);
  expect(JSON.parse(fetch.mock.calls[1][1].body).messages).toEqual([
    {role: "user", content: "How is my premium calculated?"},
    {role: "assistant", content: "A single upfront payment."},
    {role: "user", content: "Can you explain that more simply?"},
  ]);
  fireEvent.click(screen.getByRole("button", {name: "Start over"}));
  fetch.mockImplementationOnce(() => streamed("Fresh conversation."));
  send("Hello again");
  await screen.findByText("Fresh conversation.");
  expect(JSON.parse(fetch.mock.calls[2][1].body).messages).toEqual([{role: "user", content: "Hello again"}]);
});

test("launcher opens on hover, close keeps the panel closed, and click reopens preserved chat", () => {
  render(<ChatAssistant />);
  const launcher = screen.getByRole("button", { name: "Open chat assistant" });
  expect(screen.queryByRole("heading", { name: "Let's talk protection" })).not.toBeInTheDocument();
  fireEvent.mouseEnter(launcher);
  expect(screen.getByRole("heading", { name: "Let's talk protection" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Get a quote", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Close chat assistant" }));
  expect(launcher).toHaveAttribute("aria-expanded", "false");
  expect(launcher).toHaveFocus();
  fireEvent.mouseLeave(launcher);
  fireEvent.click(launcher);
  expect(screen.getByLabelText("Age group")).toBeInTheDocument();
  fireEvent.keyDown(screen.getByLabelText("Age group"), { key: "Escape" });
  expect(launcher).toHaveAttribute("aria-expanded", "false");
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
  fireEvent.click(screen.getByRole("button", { name: "Open chat assistant" }));
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
  fireEvent.click(screen.getByRole("button", { name: "Open chat assistant" }));
  fireEvent.change(screen.getByLabelText("Ask a product question"), {target: {value: "How is my premium calculated?"}});
  fireEvent.click(screen.getByRole("button", {name: "Send", exact: true}));
  fireEvent.click(screen.getByRole("button", { name: "Start over" }));
  finish(await streamed("Old response"));
  await waitFor(() => expect(screen.queryByText("Old response")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Get a quote", exact: true })).toBeEnabled();
});

test("network failure leaves quote actions usable", async () => {
  fetch.mockRejectedValue(new Error("offline"));
  render(<ChatAssistant />);
  fireEvent.click(screen.getByRole("button", {name: "Open chat assistant"}));
  fireEvent.change(screen.getByLabelText("Ask a product question"), {target: {value: "How is my premium calculated?"}});
  fireEvent.click(screen.getByRole("button", {name: "Send", exact: true}));
  await screen.findByText(/Reply unavailable or interrupted/);
  expect(screen.getByRole("button", {name: "Get a quote", exact: true})).toBeEnabled();
});

test("shows partial text before completion and stops an in-flight reply", async () => {
  let signal;
  let pending;
  fetch.mockImplementation((url, options) => {
    signal = options.signal;
    let first = true;
    return Promise.resolve({ok: true, body: {getReader: () => ({
      read: () => {
        if (first) {
          first = false;
          return Promise.resolve({done: false, value: new TextEncoder().encode(JSON.stringify({type: 'delta', text: 'Partial text'}) + '\n')});
        }
        return new Promise((resolve, reject) => {
          pending = true;
          signal.addEventListener('abort', () => reject(new Error('aborted')), {once: true});
        });
      },
      cancel: async () => {}, releaseLock: () => {},
    })}});
  });
  render(<ChatAssistant />);
  fireEvent.click(screen.getByRole('button', {name: 'Open chat assistant'}));
  fireEvent.change(screen.getByLabelText("Ask a product question"), {target: {value: "How is my premium calculated?"}});
  fireEvent.click(screen.getByRole("button", {name: "Send", exact: true}));
  await screen.findByText('Partial text');
  expect(pending).toBe(true);
  fireEvent.click(screen.getByRole('button', {name: 'Stop reply'}));
  await screen.findByText(/Reply stopped/);
  expect(signal.aborted).toBe(true);
  expect(screen.getByLabelText('Ask a product question')).toBeEnabled();
});
