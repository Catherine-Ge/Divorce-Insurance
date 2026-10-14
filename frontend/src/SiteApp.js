import React, { useEffect, useRef, useState } from "react";
import ChatAssistant from "./ChatAssistant";
import QuotePage from "./QuotePage";
import { PRODUCT_FAQS } from "./productFaqs";
import "./Site.css";

const routes = { home: "Home", quote: "Get a Quote", faq: "FAQ" };
const readRoute = () => {
  const path = window.location.hash.replace(/^#\/?/, "");
  return Object.prototype.hasOwnProperty.call(routes, path) ? path : "home";
};
const openChat = () => window.dispatchEvent(new Event("open-insurance-chat"));

function HomePage() {
  return <>
    <section className="site-hero">
      <div className="hero-copy">
        <span className="eyebrow">A DIFFERENT APPROACH TO FINANCIAL PLANNING</span>
        <h1>A little clarity for life's uncertainties.</h1>
        <p>Meet Divorce Insurance: a concept that explores financial support when a relationship changes. Understand the idea, discover how a quote works, and get answers your way.</p>
        <div className="site-actions"><a className="primary-button" href="#/quote">Get your quote</a><a className="secondary-button" href="#/faq">Explore the FAQs</a></div>
        <p className="demo-note">Demo insurance product. Policy purchase and claims are not available.</p>
      </div>
      <aside className="hero-card">
        <span className="eyebrow">DESIGNED AROUND YOU</span>
        <h2>Simple to understand.<br />Easy to explore.</h2>
        <ul><li>Three details to prepare your quote</li><li>One upfront premium</li><li>A clear premium and payout summary</li><li>An email copy when you request it</li></ul>
        <span className="hero-card-note">Your questions. Your pace.</span>
      </aside>
    </section>
    <section className="site-section" aria-labelledby="initiative-title">
      <div className="section-heading"><span className="eyebrow">THE INITIATIVE</span><h2 id="initiative-title">Planning for change, with more clarity.</h2></div>
      <p className="section-copy">A relationship change can bring questions about finances and the future. This project explores how an insurance concept could make that conversation more approachable, combining a personalized quote with clear explanations.</p>
      <div className="feature-grid">
        <article><span className="feature-number">01</span><h3>Understand the concept</h3><p>Explore how a premium and payout could fit into planning for life's changes.</p></article>
        <article><span className="feature-number">02</span><h3>Know your numbers</h3><p>See a model-generated quote using your age group, province, and years together.</p></article>
        <article><span className="feature-number">03</span><h3>Choose how to get help</h3><p>Read the FAQs yourself or use the assistant for questions and guided quoting.</p></article>
      </div>
    </section>
    <section className="site-section how-section"><span className="eyebrow">HOW IT WORKS</span><h2>Your quote, in three steps.</h2>
      <ol className="steps"><li><strong>Share the basics</strong><span>Select three details about your situation.</span></li><li><strong>Review your quote</strong><span>See the upfront premium, risk score, and payout.</span></li><li><strong>Keep a copy</strong><span>Request an email when you are ready.</span></li></ol>
      <a className="primary-button" href="#/quote">Start your quote</a>
    </section>
    <section className="help-banner"><div><h2>Prefer to talk it through?</h2><p>Ask the assistant about the product or get a guided quote.</p></div><button className="secondary-button" onClick={openChat}>Ask the AI assistant</button></section>
  </>;
}

function FaqPage() {
  return <section className="faq-page">
    <div className="page-heading"><span className="eyebrow">ANSWERS AT YOUR PACE</span><h1>Frequently asked questions</h1><p>Read the product guide below, or ask the assistant for help.</p><button className="primary-button" onClick={openChat}>Ask the AI assistant</button></div>
    <div className="faq-list">{PRODUCT_FAQS.map(item => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>
    <div className="help-banner"><div><h2>Ready for your quote?</h2><p>Use the form or open the chat for guided help.</p></div><a className="primary-button" href="#/quote">Get a quote</a></div>
  </section>;
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const main = useRef(null);
  const initial = useRef(true);
  useEffect(() => {
    const change = () => setRoute(readRoute());
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    document.title = routes[route] + " | Divorce Insurance";
    if (initial.current) { initial.current = false; return; }
    main.current?.focus();
    window.scrollTo?.(0, 0);
  }, [route]);
  return <div className="site-shell">
    <a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); main.current?.focus(); }}>Skip to content</a>
    <header className="site-header"><a className="site-brand" href="#/home"><span className="brand-mark" aria-hidden="true">DI</span><span>Divorce Insurance<small>Demo product</small></span></a>
      <nav aria-label="Main navigation">{Object.entries(routes).map(([key, label]) => <a key={key} href={"#/" + key} aria-current={route === key ? "page" : undefined}>{label}</a>)}</nav>
    </header>
    <main id="main-content" ref={main} tabIndex={-1}>
      {route === "home" && <HomePage />}
      {route === "quote" && <QuotePage />}
      {route === "faq" && <FaqPage />}
    </main>
    <footer className="site-footer"><span>Divorce Insurance · Demo project</span><p>Quotes use a model trained on simulated data. Risk scores are not reliable predictions of individual relationships.</p><a href="#/faq">Product FAQs</a></footer>
    <ChatAssistant />
  </div>;
}
