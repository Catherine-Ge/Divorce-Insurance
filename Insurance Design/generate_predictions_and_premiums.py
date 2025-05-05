import pandas as pd
import numpy as np
import joblib

from sklearn.preprocessing import OneHotEncoder

# === Step 1: Load data and model ===
df = pd.read_csv("simulated_divorce_final.csv")

# Save the true labels separately before replacing
true_labels = df["Divorced"].copy()

# Drop the target column for prediction
df_features = df.drop(columns=["Divorced"])

# Load the trained model and encoder
model = joblib.load("logistic_model.pkl")
encoder = joblib.load("onehot_encoder.pkl")  # Adjust path if needed

# === Step 2: Predict divorce probability ===
X_encoded = encoder.transform(df_features)
probs = model.predict_proba(X_encoded)[:, 1]

# === Step 3: Calculate premium for each row ===
claim_amount = 15000
margin = 1.2
df_features["Predicted_Prob"] = probs
df_features["Premium"] = df_features["Predicted_Prob"] * claim_amount * margin

# Save true label and premium prediction for evaluation in next step
df_features["Actual_Divorced"] = true_labels

# Optional: Save to CSV for record
df_features.to_csv("predicted_premiums.csv", index=False)

print("✅ Predictions and premiums generated successfully.")
