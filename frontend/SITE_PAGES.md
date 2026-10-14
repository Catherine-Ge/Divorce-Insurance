# Site pages

Top navigation links to:
- #/home: product introduction, initiative, benefits of exploring the concept,
  how quoting works, and links to quote/FAQ/chat.
- #/quote: the existing model-backed quote form with optional email.
- #/faq: readable approved FAQ answers and an Ask the AI assistant button.

Hash routes keep GitHub Pages refreshes and direct links working without server
rewrites or additional dependencies. Browser back/forward updates the active page.
The floating chatbot is mounted outside page content so its conversation survives
navigation. Page buttons open it without sending an AI request.

FAQ copy lives in src/productFaqs.js, derived from the backend product_guide.md.
Keep these two sources aligned when changing product answers. No new policy
terms or promises of real coverage are introduced.

After merge, publish GitHub Pages from frontend:

```powershell
git pull origin main
npm run deploy
```

No backend or Render settings change is required. Test Home, Quote, FAQ, direct
links/refresh, back/forward, Ask the AI assistant, and the existing quote/email flow.
