"""Train the demo classifier with a shared 10+ years category."""
from pathlib import Path
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LogisticRegression


def prepare_features(df):
    X = df[['AgeGroup', 'YearsTogether', 'Province']].copy()
    years = pd.to_numeric(X['YearsTogether'].str.extract(r'^(\d+) years?$')[0], errors='coerce')
    X.loc[years >= 10, 'YearsTogether'] = '10 years or more'
    return X


def train_logistic(csv_path=None, use_smote=False):
    csv_path = csv_path or Path(__file__).with_name('simulated_divorce_final.csv')
    df = pd.read_csv(csv_path)
    X = prepare_features(df)
    y = df['Divorced']
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)
    encoder = OneHotEncoder(drop='first', sparse_output=False)
    X_train = encoder.fit_transform(X_train)
    X_test = encoder.transform(X_test)
    if use_smote:
        from imblearn.over_sampling import SMOTE
        X_train, y_train = SMOTE(random_state=42).fit_resample(X_train, y_train)
    model = LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42)
    model.fit(X_train, y_train)
    return model, encoder, X_test, y_test


if __name__ == '__main__':
    model, encoder, X_test, y_test = train_logistic(use_smote=True)
    print('Held-out accuracy:', model.score(X_test, y_test))
