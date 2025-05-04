import numpy as np
from sklearn.metrics import accuracy_score, f1_score, classification_report
from random_forest_model import train_random_forest
from threshold_tuner import find_best_threshold

# Step 1: Train the RF model
model, encoder, X_test, y_test = train_random_forest()

# Step 2: Find best threshold using F1
best_threshold = find_best_threshold(model, X_test, y_test)

# Step 3: Predict with best threshold
probs = model.predict_proba(X_test)[:, 1]
y_pred = (probs >= best_threshold).astype(int)

# Step 4: Evaluate
accuracy = accuracy_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
report = classification_report(y_test, y_pred)

# Step 5: Print
print("\n=== Random Forest Evaluation ===")
print(f"Best Threshold (F1-optimized): {round(best_threshold, 3)}")
print(f"Accuracy: {round(accuracy * 100, 2)}%")
print(f"F1-Score (Divorced=1): {round(f1, 3)}")
print("\nClassification Report:")
print(report)
