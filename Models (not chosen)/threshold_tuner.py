import numpy as np
from sklearn.metrics import precision_recall_fscore_support

def find_best_threshold(model, X_test, y_test, step=0.05):
    thresholds = np.arange(0.1, 0.91, step)
    best_threshold = 0.5
    best_f1 = 0

    for t in thresholds:
        probs = model.predict_proba(X_test)[:, 1]
        preds = (probs >= t).astype(int)

        precision, recall, f1, _ = precision_recall_fscore_support(
            y_test, preds, average='binary', zero_division=0
        )

        if f1 > best_f1:
            best_f1 = f1
            best_threshold = t

    return best_threshold