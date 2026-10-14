import React, { useEffect, useRef, useState } from "react";
import { QUOTE_FIELDS } from "./quoteOptions";
import "./ChatAssistant.css";

const API = "https://divorce-insurance.onrender.com";
const WELCOME = "Hello! I can answer questions about Divorce Insurance or guide you through a quote. How can I help?";
const FAQS = [
  ["premium", "How is my premium calculated?"],
  ["inputs", "What information do you need?"],
  ["risk", "What does the risk score mean?"],
  ["payout", "What payout does the quote show?"],
  ["email", "Can you email my quote?"],
  ["purchase", "Can I purchase a policy?"],
  ["coverage", "When would coverage begin?"],
  ["exclusions", "What exclusions apply?"],
  ["claims", "How would I make a claim?"],
];
// Classify locally: only a public topic ID is sent to the FAQ API.
export function findTopic(text) {
  const q = text.toLowerCase();
  if (/start over|reset|clear chat/.test(q)) return "reset";
  if (/explain.*(my|this).*quote/.test(q)) return "explain";
  if (/email|inbox|spam/.test(q)) return "email";
  if (/claim/.test(q)) return "claims";
  if (/exclu/.test(q)) return "exclusions";
  if (/waiting|coverage|cover|begin/.test(q)) return "coverage";
  if (/buy|purchase|policy/.test(q)) return "purchase";
  if (/payout|pay out/.test(q)) return "payout";
  if (/risk|probability|score/.test(q)) return "risk";
  if (/premium|price|cost|payment/.test(q)) return "premium";
  if (/information|input|need|data/.test(q)) return "inputs";
  if (/quote/.test(q)) return "quote";
  return null;
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const launcher = useRef(null);
  function closePanel() {
    setOpen(false);
  }
  const [messages, setMessages] = useState([{ role: "assistant", text: WELCOME }]);
  const [text, setText] = useState("");
  const [step, setStep] = useState(null);
  const [selection, setSelection] = useState("");
  const [details, setDetails] = useState({});
  const [quote, setQuote] = useState(null);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const controller = useRef(null);
  const version = useRef(0);
  const bottom = useRef(null);
  const say = (role, message) => setMessages(old => [...old, { role, text: message }]);
  useEffect(() => { bottom.current?.scrollIntoView?.({ block: "nearest" }); }, [messages, step, busy]);
  const previouslyOpen = useRef(false);
  useEffect(() => {
    if (!open && previouslyOpen.current) launcher.current?.focus();
    previouslyOpen.current = open;
  }, [open]);
  useEffect(() => () => { controller.current?.abort(); }, []);
  function reset() {
    version.current += 1;
    controller.current?.abort();
    setMessages([{ role: "assistant", text: WELCOME }]);
    setText(""); setStep(null); setSelection(""); setDetails({});
    setQuote(null); setEmailMode(false); setEmail(""); setBusy(false);
  }
  async function callApi(path, payload) {
    controller.current = new AbortController();
    const timeout = setTimeout(() => controller.current?.abort(), 90000);
    try {
      const response = await fetch(API + path, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), signal: controller.current.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The service could not complete your request.");
      return data;
    } finally { clearTimeout(timeout); }
  }
  function beginQuote() {
    setDetails({}); setQuote(null); setStep(0); setSelection(""); setEmailMode(false); setEmail("");
    say("assistant", "Let's prepare your quote. First, select your age group below.");
  }
  function explain() {
    if (!quote) { say("assistant", "Get a quote first, then I can explain your calculated premium and payout."); return; }
    say("assistant", "Your single upfront premium is calculated as $500 plus the model's risk score multiplied by $1,000. The payout is $10,000 above a 50% score, otherwise $5,000. The displayed risk score is rounded, so calculating from it may differ slightly from your premium. The score comes from simulated data and is not a reliable prediction of your relationship.");
  }
  async function ask(topic, label) {
    if (busy) return;
    if (topic === "reset") { reset(); return; }
    say("user", label);
    if (topic === "quote") { beginQuote(); return; }
    if (topic === "explain") { explain(); return; }
    if (topic === "email" && quote && step === null) {
      setEmailMode(true);
      say("assistant", "Enter your email in the field below and select Send quote. It goes directly to the quote service, not Gemini.");
      return;
    }
    if (!topic) { say("assistant", "I can help with quotes, premiums, payouts, email, and product FAQs. Choose a suggested question below. Please use Get a quote for personal details."); return; }
    const ticket = version.current;
    setBusy(true);
    try {
      const data = await callApi("/chat", { topic });
      if (ticket === version.current) say("assistant", data.reply);
    } catch (err) {
      if (ticket === version.current) say("assistant", "I couldn't load that answer. You can still get a quote. Please try again.");
    } finally { if (ticket === version.current) setBusy(false); }
  }
  async function choose(event) {
    event.preventDefault();
    if (!selection || busy) return;
    const field = QUOTE_FIELDS[step];
    const next = { ...details, [field.key]: selection };
    say("user", field.options.find(option => option.value === selection).label);
    setDetails(next); setSelection("");
    if (step < 2) {
      setStep(step + 1);
      say("assistant", step === 0 ? "How many years have you been together?" : "Which province or territory do you live in?");
      return;
    }
    const ticket = version.current;
    setBusy(true);
    try {
      const data = await callApi("/predict", next);
      if (ticket === version.current) {
        setQuote(data); setStep(null);
        say("assistant", "Your quote is ready. Review the details below. You can ask for an explanation or request an email copy.");
      }
    } catch (err) {
      if (ticket === version.current) { setSelection(next.Province); say("assistant", err.message + " Select Get quote to retry."); }
    } finally { if (ticket === version.current) setBusy(false); }
  }
  async function sendEmail(event) {
    event.preventDefault();
    if (busy || !email || !quote) return;
    const ticket = version.current;
    setBusy(true);
    try {
      const data = await callApi("/predict", { ...details, email });
      if (ticket === version.current) {
        say("assistant", data.email_status === "accepted" ? "Your quote email has been submitted. Check your inbox and spam folder." : "We couldn't submit the email. Your quote is still available; you can retry.");
        if (data.email_status === "accepted") { setEmailMode(false); setEmail(""); }
      }
    } catch (err) { if (ticket === version.current) say("assistant", "Email submission failed. Your quote is still available. Please try again."); }
    finally { if (ticket === version.current) setBusy(false); }
  }
  return (
    <>
      <button ref={launcher} type="button" className="chat-launcher" aria-label="Open chat assistant"
        aria-expanded={open} aria-controls="insurance-chat-panel"
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(true)}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-8 8H5l-4 3v-11a8 8 0 0 1 8-8h3a8 8 0 0 1 8 8Z" transform="translate(1 -1)" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M7 9h9M7 13h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
      </button>
    <section id="insurance-chat-panel" className="insurance-chat" aria-labelledby="chat-title" hidden={!open}
      onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); closePanel(); } }}>
      <header className="chat-header">
        <div><span className="chat-eyebrow">YOUR QUOTE ASSISTANT</span><h2 id="chat-title">Let's talk protection</h2><span className="chat-demo">Demo insurance product</span></div>
        <div className="chat-header-actions"><button type="button" onClick={reset}>Start over</button>
        <button type="button" className="chat-close" aria-label="Close chat assistant" onClick={closePanel}><span aria-hidden="true">×</span></button></div>
      </header>
      <div className="chat-body">
      <p className="chat-privacy">FAQ messages are matched to public topics before Gemini answers. Quote selections and email go directly to our backend. Please keep personal details out of the question box.</p>
      <div className="chat-transcript" role="log" aria-label="Conversation" aria-live="polite">
        {messages.map((message, index) => <div key={index} className={"chat-message " + message.role}><span className="chat-speaker">{message.role === "user" ? "You" : "Assistant"}</span><p>{message.text}</p></div>)}
        {busy && <p role="status">Working on your request…</p>}
        <div ref={bottom} />
      </div>
      {step !== null && <form className="chat-input" onSubmit={choose}>
        <label htmlFor="chat-selection">{QUOTE_FIELDS[step].label}</label>
        <select id="chat-selection" value={selection} onChange={e => setSelection(e.target.value)} required disabled={busy}>
          <option value="">Select an option</option>
          {QUOTE_FIELDS[step].options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <button disabled={busy || !selection}>{step === 2 ? "Get quote" : "Continue"}</button>
      </form>}
      {quote && <div className="chat-quote">
        <h3>Your personalized quote</h3>
        <p className="chat-price">{Number(quote.premium).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}<span>Single upfront premium</span></p>
        <p>Estimated risk score: {(quote.divorce_risk * 100).toFixed(1)}%</p>
        <p>Payout: {Number(quote.payout).toLocaleString("en-CA", { style: "currency", currency: "CAD" })}</p>
        <p className="chat-note">Demo quote based on simulated data. Policy purchase and claims are unavailable.</p>
        <button type="button" disabled={busy} onClick={() => ask("explain", "Explain my quote")}>Explain my quote</button>
        <button type="button" disabled={busy} onClick={() => ask("email", "Email my quote")}>Email my quote</button>
      </div>}
      {emailMode && <form className="chat-input" onSubmit={sendEmail}>
        <label htmlFor="chat-email">Email for your quote</label>
        <input id="chat-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} />
        <button disabled={busy}>Send quote</button>
        <button type="button" disabled={busy} onClick={() => { setEmailMode(false); setEmail(""); }}>Cancel</button>
      </form>}
      <div className="chat-suggestions">
        <button type="button" disabled={busy} onClick={() => ask("quote", "Get a quote")}>Get a quote</button>
        {FAQS.map(([topic, label]) => <button key={topic} type="button" disabled={busy} onClick={() => ask(topic, label)}>{label}</button>)}
      </div>
      <form className="chat-input" onSubmit={e => { e.preventDefault(); if (!text.trim()) return; const question = text.trim(); setText(""); ask(findTopic(question), question); }}>
        <label htmlFor="chat-question">Ask a product question</label>
        <input id="chat-question" value={text} onChange={e => setText(e.target.value)} maxLength={500} placeholder="For example: How is the premium calculated?" disabled={busy || step !== null || emailMode} />
        <button disabled={busy || !text.trim() || step !== null || emailMode}>Send</button>
      </form>
      </div>
    </section>
    </>
  );
}
