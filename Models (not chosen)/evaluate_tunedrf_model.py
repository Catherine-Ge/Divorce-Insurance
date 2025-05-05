import numpy as np
from sklearn.metrics import accuracy_score, f1_score, classification_report
from tuned_rf_model import train_tuned_random_forest
from threshold_tuner import find_best_threshold

def evaluate_tuned_random_forest():
    # Step 1: Train the tuned RF model
    model, encoder, X_test, y_test = train_tuned_random_forest()

    # Step 2: Find the best F1-optimized threshold
    best_threshold = find_best_threshold(model, X_test, y_test)

    # Step 3: Predict probabilities and convert to binary
    probs = model.predict_proba(X_test)[:, 1]
    y_pred = (probs >= best_threshold).astype(int)

    # Step 4: Evaluate
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    report = classification_report(y_test, y_pred)

    return best_threshold, accuracy, f1, report

# Only run this if directly executed (NOT on import)
if __name__ == "__main__":
    best_threshold, accuracy, f1, report = evaluate_tuned_random_forest()

    print("\n=== Tuned Random Forest Evaluation ===")
    print(f"Best Threshold (F1-optimized): {round(best_threshold, 3)}")
    print(f"Accuracy: {round(accuracy * 100, 2)}%")
    print(f"F1-Score (Divorced=1): {round(f1, 3)}")
    print("\nClassification Report:")
    print(report)
