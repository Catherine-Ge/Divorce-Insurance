import numpy as np
from sklearn.metrics import precision_recall_fscore_support

def find_best_threshold(model, X_test, y_test, step=0.05):
    thresholds = np.arange(0.1, 0.91, step)
    best_threshold = 0.5
    best_f1 = 0

    print(f"{'Threshold':>10} | {'Precision':>10} | {'Recall':>10} | {'F1-Score':>10}")
    print("-" * 50)

    for t in thresholds:
        probs = model.predict_proba(X_test)[:, 1]
        preds = (probs >= t).astype(int)

        precision, recall, f1, _ = precision_recall_fscore_support(
            y_test, preds, average='binary', zero_division=0
        )

        print(f"{t:>10.2f} | {precision:>10.3f} | {recall:>10.3f} | {f1:>10.3f}")

        if f1 > best_f1:
            best_f1 = f1
            best_threshold = t

    print("\n📌 Best Threshold:", best_threshold, "with F1-Score:", round(best_f1, 3))
    return best_threshold
