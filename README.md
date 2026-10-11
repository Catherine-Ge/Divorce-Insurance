
# Divorce Insurance

**Live Site**: [https://catherine-ge.github.io/Divorce-Insurance/](https://catherine-ge.github.io/Divorce-Insurance/)

## 📝 Introduction

Divorce Insurance is a conceptual web application that simulates a personalized insurance product designed to protect against the financial risk of divorce. The idea is to let users input their relationship information and receive a premium quote based on their likelihood of divorcing — predicted using a logistic regression model trained on simulated demographic and relationship data.

This project combines web development with actuarial and machine learning principles, illustrating how data can be used to create dynamic pricing models for a hypothetical insurance product.

## 🔍 How the Insurance Was Designed

### 🧠 Model and Data

- **Dataset**: A simulated dataset (`simulated_divorce_final.csv`) was created to represent Canadian adults with the following fields:
  - Age Group
  - Province
  - Years Together
  - Binary Divorce Outcome (1 = divorced, 0 = not divorced)

- **Model Choice**: We used **Logistic Regression** due to its interpretability and suitability for binary classification. The model estimates the probability that a user will get divorced based on their input.

- **Encoding**: Categorical variables like Age Group and Province were one-hot encoded before modeling.

- **Handling Imbalance**: An optional `SMOTE` step was included to oversample minority classes and improve prediction balance.

- **Output**: The model predicts a probability of divorce. This prediction is then translated into a premium using a formula (e.g., base rate + margin × predicted risk), simulating how insurers price policies based on perceived risk.

### Deployment and repository layout

This repository contains the frontend, deployable backend, and model research.
The backend was consolidated from `Catherine-Ge/divorce-insurance-backend`.
The frontend calls the backend over HTTP; the two deployments remain separate.

```text
Divorce-Insurance/
├── frontend/           React source and GitHub Pages deployment
├── backend/            Flask API, saved model/encoder, bundled legacy frontend
├── insurance_design/   Dataset generation, training, and analysis
├── Models (not chosen)/ Alternative model experiments
├── render.yaml         Render configuration (rootDir: backend)
└── README.md
```

The model and encoder in `backend/` are byte-for-byte copies of the existing
deployed backend artifacts. Training scripts in `insurance_design/` are for
research; retraining does not automatically update the deployed copies.

## Request flow

1. GitHub Pages serves the React frontend.
2. `frontend/src/App.js` posts age group, years together, province, and email to
   `https://divorce-insurance-backend.onrender.com/predict`.
3. `backend/app.py` loads its local model and encoder, predicts divorce risk,
   calculates the quote, sends it through Gmail SMTP, and returns JSON.
4. The frontend displays the risk, premium, and payout.

The preserved quote formula is `500 + probability * 1000`.
Payout is $10,000 when probability exceeds 0.5, otherwise $5,000.
This is a conceptual project using simulated data.

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Set `EMAIL_USER` and `EMAIL_PASS` in your shell before starting the backend.
Use the Gmail credentials already configured for the existing service;
do not commit credentials. Quote requests currently send email synchronously,
so working SMTP credentials are needed to complete a quote request.

### Frontend

```bash
cd frontend
npm install
npm start
```

The frontend currently calls the hosted Render API even when running locally.
To use the local Flask server, temporarily change the fetch URL in
`frontend/src/App.js` to `http://127.0.0.1:5000/predict`; restore the hosted
URL before publishing.

## Deploy

### GitHub Pages

```bash
cd frontend
npm install
npm run deploy
```

This builds and publishes to the `gh-pages` branch. Merging a source change
into `main` does not itself rebuild GitHub Pages.

### Migrate the existing Render service

Merge the consolidation pull request before switching the service.

1. Open the existing `divorce-insurance-backend` service in Render.
2. Change its connected repository to `Catherine-Ge/Divorce-Insurance` and use
   branch `main`. If the repo is unavailable, grant the Render GitHub integration
   access to it.
3. Set Root Directory to `backend`.
4. Set Build Command to `pip install -r requirements.txt`.
5. Set Start Command to `python app.py`.
6. Keep the existing `EMAIL_USER` and `EMAIL_PASS` environment variables.
7. Deploy the latest commit and inspect the logs.
8. Submit a quote from the GitHub Pages website with an email address you control.
   Verify the displayed risk, premium, payout, and receipt of the quote email.

Reuse the existing service to preserve its URL. If Render requires a replacement
service, keep the old service running while you create and test the replacement,
then update `frontend/src/App.js` to the new URL and run `npm run deploy`.
Keep the old repository available until the service switch and quote checks pass.
Then archive it before considering deletion.

The root `render.yaml` describes the backend service for Blueprint deployments.
Committing it does not automatically reconnect an existing manually configured
Render service. Do not create a second service merely to apply this migration.

### Legacy bundled frontend

`backend/build/` is preserved from the old backend repository so the migration
does not change Flask's existing static routes. Its JavaScript calls
`127.0.0.1:5000` and is not the GitHub Pages frontend. Use `frontend/` for UI
development. Removing those legacy static routes/build files can be a separate
cleanup after the Render migration succeeds.

## Migration validation and rollback

The consolidation preserves the backend application and dependency list from the
separate repo, including existing email and pricing behavior. Existing limitations
(such as synchronous SMTP and limited request validation) are unchanged.

If the new deployment fails, reconnect the existing Render service to
`Catherine-Ge/divorce-insurance-backend`, reset Root Directory to the repository
root (blank), and redeploy. No frontend endpoint change is required when the
existing service URL is retained.
