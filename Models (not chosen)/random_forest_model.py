import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import SMOTE

def train_random_forest(csv_path="simulated_divorce_final.csv", use_smote=True):
    # Load data
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

    # Optional: Apply SMOTE
    if use_smote:
        sm = SMOTE(random_state=42)
        X_train, y_train = sm.fit_resample(X_train, y_train)

    # Train Random Forest
    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        class_weight='balanced'
    )
    model.fit(X_train, y_train)

    return model, encoder, X_test, y_test
