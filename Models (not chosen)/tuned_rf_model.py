import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import SMOTE
from sklearn.metrics import make_scorer, f1_score

def train_tuned_random_forest(csv_path="simulated_divorce_final.csv", use_smote=True):
    # Load and prepare data
    df = pd.read_csv(csv_path)
    X = df[["AgeGroup", "YearsTogether", "Province"]]
    y = df["Divorced"]

    # One-hot encode
    encoder = OneHotEncoder(drop='first', sparse_output=False)
    X_encoded = encoder.fit_transform(X)

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y, test_size=0.2, random_state=42
    )

    # Apply SMOTE
    if use_smote:
        sm = SMOTE(random_state=42)
        X_train, y_train = sm.fit_resample(X_train, y_train)

    # Define parameter grid
    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [None, 10, 20],
        'min_samples_split': [2, 5],
        'min_samples_leaf': [1, 2],
        'class_weight': ['balanced']
    }

    # Grid search with F1 as the scoring metric
    rf = RandomForestClassifier(random_state=42)
    scorer = make_scorer(f1_score, average='binary')
    grid = GridSearchCV(rf, param_grid, scoring=scorer, cv=3, n_jobs=-1, verbose=1)

    grid.fit(X_train, y_train)
    best_model = grid.best_estimator_

    print("\n✅ Best Hyperparameters:")
    print(grid.best_params_)

    return best_model, encoder, X_test, y_test
