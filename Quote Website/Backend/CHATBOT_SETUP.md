# Chat assistant

Free-form Gemini chat supports follow-up questions and streamed replies, alongside
the existing guided quote and explicit email flows. No database is required.

## How it works

The browser POSTs recent conversation messages to `/chat/stream` (up to 12 messages,
2,000 characters each and 16,000 characters total). The backend includes
`chatbot_instructions.txt` and `product_guide.md` on every request, maps assistant
messages to Gemini's `model` role, and calls `streamGenerateContent?alt=sse`.
Gemini SSE chunks are relayed immediately as newline-delimited JSON events:
`delta` contains text; `done` confirms completion and source; `error` marks an
interrupted answer. The browser decodes across network/UTF-8 boundaries.

History lives in React memory, survives closing/reopening the panel and page
navigation, and disappears on refresh or Start over. Start over also aborts
pending work; late responses cannot restore the cleared conversation. Stop reply
cancels a generation. Incomplete and unavailable replies are excluded from later
AI context. No chat history is persisted by this application.

This is a demo: use fictitious relationship information. Typed chat and recent
messages, including guided selections and displayed quote numbers when still in
the recent history, are sent to Gemini. Dedicated email field contents are sent
only to the existing quote/email backend; emails require pressing Send quote.

Quotes still come from `/predict` and the Python statistical model. The assistant
cannot issue policies, send emails itself, or invent policy terms. Get a quote
opens the guided form inside chat; arbitrary typed questions now go directly to
Gemini without keyword classification. Explain my quote remains a local formula
explanation; free-form follow-ups can reference the quote in recent history.

The legacy `/chat` topic endpoint remains compatible with older deployments and
retains its cached approved FAQ fallback. Streaming conversations are not cached
and do not use that endpoint's six-second topic cooldown. Provider quota errors,
missing keys and timeouts show an explicit unavailable message; partial replies
are marked interrupted. FAQ and quote flows remain available. Review AI accuracy.

## Configuration and deployment

Keep `GEMINI_API_KEY`, `BREVO_API_KEY`, and verified `EMAIL_USER` in Render.
The Gemini model defaults to `gemini-3.5-flash-lite`; `GEMINI_MODEL` can override it
with a model available to your account. No new environment variables or packages
are needed. Free-tier quota still applies to every conversation request.

After merging, deploy latest main on the Divorce-Insurance Render service first,
then publish GitHub Pages from your local frontend directory:

```powershell
git pull origin main
npm install
npm run deploy
```

Verify a question followed by “Can you explain that more simply?”, progressive
text, Stop reply, Start over, guided quotes and an explicit email request.
In browser Network, `/chat/stream` ending with `{"type":"done","source":"gemini"}`
confirms a real successful Gemini response. Local tests mock Gemini; a live test
requires the configured Render service. Backend checks:
`python -m unittest discover -p "test_*.py"`; frontend:
`npm test -- --watchAll=false --runInBand` and `npm run build`.

The historical backend/build folder is an outdated frontend copy. Publish the
frontend/ app to GitHub Pages; Render serves the API.
