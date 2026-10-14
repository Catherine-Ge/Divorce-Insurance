# Chat assistant

The assistant supports approved product FAQs, guided quotes, local quote
explanations, explicit email requests, suggested questions, and Start over.
There is no scenario comparison feature.

## Context and privacy

product_guide.md stores the approved FAQ content. chatbot_instructions.txt
controls Gemini's role and tone. Both are read at backend startup and included
with each uncached FAQ request. Redeploy after editing either file.

The FAQ endpoint accepts only one allowlisted topic ID. The browser matches
typed questions to those topics locally; unmatched questions show suggestions.
This is a constrained FAQ assistant, not unrestricted multi-turn AI chat.
Neither typed messages nor conversation history, quote inputs, results, or
email addresses are forwarded to Gemini. Provider requests contain only the
approved guide/instructions and canonical public FAQ question.

Guided selections call the existing /predict endpoint without email. Quote
explanations use the returned numbers and known pricing formula locally.
Email is sent only after entering an address and pressing Send quote.
Start over aborts pending requests and clears local chat/quote state. It cannot
undo emails already submitted or remove provider records.

## Configuration

Set GEMINI_API_KEY privately in the existing Divorce-Insurance Render service.
The default model is gemini-3.5-flash-lite. Optionally set GEMINI_MODEL to a model
available to your account; check its current pricing before changing models.
Keep the Google project on its free tier if you want no paid API usage.
Keep BREVO_API_KEY and verified EMAIL_USER for email delivery.

Gemini responses for fixed topics are cached in process until restart, and calls
are spaced by at least six seconds per process. Rate limits, missing credentials,
timeouts, blocked or incomplete responses fall back to approved FAQ text.
These limits are a demo quota safeguard, not a distributed rate limiter.
Model replies are generated text and should be reviewed for accuracy.

## Deploy and test

Merge the PR, deploy latest main on Render, then publish the React frontend:

```powershell
git pull origin main
cd frontend
npm install
npm run deploy
```

If already in frontend, omit cd frontend. The dependency typo is corrected in
package.json; retain or resolve your earlier local fix before pulling if needed.

Verify FAQs, all three quote selections, premium/payout display, Explain my
quote, explicit email sending, Start over during a pending response, and the
original quote form. A guide fallback is working behavior; source=gemini in the
/chat JSON response verifies real model access. No keys appear in frontend code.

Backend tests: run python test_chatbot.py from this directory.
Frontend tests: npm test -- --watchAll=false --runInBand.

The historical backend/build folder remains an outdated frontend copy. Use
GitHub Pages as the user-facing site; this feature is published from frontend/.
