Divorce Insurance
Live Site: https://catherine-ge.github.io/Divorce-Insurance/

📝 Introduction
Divorce Insurance is a conceptual web application that simulates a personalized insurance product designed to protect against the financial risk of divorce. The idea is to let users input their relationship information and receive a premium quote based on their likelihood of divorcing — predicted using a logistic regression model trained on simulated demographic and relationship data.

This project combines web development with actuarial and machine learning principles, illustrating how data can be used to create dynamic pricing models for a hypothetical insurance product.

🔍 How the Insurance Was Designed
🧠 Model and Data
Dataset: A simulated dataset (simulated_divorce_final.csv) was created to represent Canadian adults with the following fields:

Age Group

Province

Years Together

Binary Divorce Outcome (1 = divorced, 0 = not divorced)

Model Choice: We used Logistic Regression due to its interpretability and suitability for binary classification. The model estimates the probability that a user will get divorced based on their input.

Encoding: Categorical variables like Age Group and Province were one-hot encoded before modeling.

Handling Imbalance: An optional SMOTE step was included to oversample minority classes and improve prediction balance.

Output: The model predicts a probability of divorce. This prediction is then translated into a premium using a formula (e.g., base rate + margin × predicted risk), simulating how insurers price policies based on perceived risk.

💾 Deployment Strategy
The trained model and encoder are saved as .pkl files using joblib and loaded by the backend during quote generation.

🧪 Features
Predicts the likelihood of divorce based on user inputs

Dynamically generates insurance premium quotes

Clean, responsive React frontend

Lightweight Python backend to handle model logic and API requests

🛠 Tech Stack
Frontend: React 19, hosted via GitHub Pages

Backend: Flask (locally), with model logic in Python

ML/DS Libraries: pandas, scikit-learn, joblib, imblearn

Deployment: Frontend live via GitHub Pages, backend run locally or deployable via Render or similar services
