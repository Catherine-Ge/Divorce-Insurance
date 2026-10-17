"""Rebuild both artifact copies and record evaluation on simulated data."""
import hashlib
import json
from pathlib import Path
import joblib
import pandas as pd
import sklearn
from sklearn.metrics import accuracy_score, recall_score, precision_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from logistic_model import train_logistic


def metrics(y, probabilities):
    predicted = probabilities >= 0.5
    return {'accuracy': accuracy_score(y, predicted),
            'precision': precision_score(y, predicted, zero_division=0),
            'recall': recall_score(y, predicted, zero_division=0),
            'f1': f1_score(y, predicted, zero_division=0),
            'roc_auc': roc_auc_score(y, probabilities)}


if __name__ == '__main__':
    folder = Path(__file__).resolve().parent
    backend = folder.parent / 'backend'
    if not backend.exists():
        backend = folder.parent / 'Quote Website' / 'Backend'
    dataset = folder / 'simulated_divorce_final.csv'
    df = pd.read_csv(dataset)
    _, raw_test, _, y_test = train_test_split(df[['AgeGroup', 'YearsTogether', 'Province']],
        df['Divorced'], test_size=0.2, random_state=42, stratify=df['Divorced'])
    baseline_model = joblib.load(backend / 'logistic_model.pkl')
    baseline_encoder = joblib.load(backend / 'onehot_encoder.pkl')
    baseline_features = raw_test.copy()
    if '10 years or more' in baseline_encoder.categories_[1]:
        years = pd.to_numeric(baseline_features['YearsTogether'].str.extract(r'^(\d+) years?$')[0], errors='coerce')
        baseline_features.loc[years >= 10, 'YearsTogether'] = '10 years or more'
    baseline = metrics(y_test, baseline_model.predict_proba(baseline_encoder.transform(baseline_features))[:, 1])
    model, encoder, X_test, y_test = train_logistic(dataset, use_smote=True)
    report = {
        'dataset_sha256': hashlib.sha256(dataset.read_bytes()).hexdigest(),
        'rows': len(df), 'held_out_rows': len(y_test), 'random_state': 42,
        'sklearn_version': sklearn.__version__, 'threshold': 0.5,
        'note': 'Synthetic demo data. Baseline is the previous saved artifact on these rows, not a guaranteed independent holdout. Grouped-model metrics use a stratified held-out split before fitting the encoder or SMOTE. These results are not real-world predictive validation.',
        'previous_artifact_reference': baseline,
        'grouped_model_holdout': metrics(y_test, model.predict_proba(X_test)[:, 1]),
        'categories': {name: list(values) for name, values in zip(encoder.feature_names_in_, encoder.categories_)},
    }
    for destination in (folder, backend):
        joblib.dump(model, destination / 'logistic_model.pkl')
        joblib.dump(encoder, destination / 'onehot_encoder.pkl')
    (folder / 'quote_model_evaluation.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))
