import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from imblearn.over_sampling import SMOTE

from threshold_tuner import find_best_threshold  # import from other file

# === STEP 1: Load and prepare data ===
df = pd.read_csv("simulated_divorce_final.csv")
X = df[["AgeGroup", "YearsTogether", "Province"]]
y = df["Divorced"]

# One-hot encode
encoder = OneHotEncoder(drop='first', sparse_output=False)
X_encoded = encoder.fit_transform(X)

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X_encoded, y, test_size=0.2, random_state=42
)

# Apply SMOTE
sm = SMOTE(random_state=42)
X_train_res, y_train_res = sm.fit_resample(X_train, y_train)

# Train model
model = LogisticRegression(max_iter=1000, class_weight='balanced')
model.fit(X_train_res, y_train_res)

# === STEP 2: Get best threshold from threshold_tuner ===
best_threshold = find_best_threshold(model, X_test, y_test)

# === STEP 3: Predict and evaluate ===
probs = model.predict_proba(X_test)[:, 1]
y_pred = (probs >= best_threshold).astype(int)

accuracy = accuracy_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
report = classification_report(y_test, y_pred)

# === STEP 4: Print results ===
print("\n=== Model Evaluation ===")
print(f"Best Threshold (F1-optimized): {round(best_threshold, 3)}")
print(f"Accuracy: {round(accuracy * 100, 2)}%")
print(f"F1-Score (Divorced=1): {round(f1, 3)}")
print("\nClassification Report:")
print(report)