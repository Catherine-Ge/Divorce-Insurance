import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import LogisticRegression

def train_logistic(csv_path="simulated_divorce_final.csv", use_smote=False):
    from imblearn.over_sampling import SMOTE

    # Load and prepare data
    df = pd.read_csv(csv_path)
    X = df[["AgeGroup", "YearsTogether", "Province"]]
    y = df["Divorced"]

    encoder = OneHotEncoder(drop='first', sparse_output=False)
    X_encoded = encoder.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y, test_size=0.2, random_state=42
    )

    if use_smote:
        sm = SMOTE(random_state=42)
        X_train, y_train = sm.fit_resample(X_train, y_train)

    model = LogisticRegression(max_iter=1000, class_weight='balanced')
    model.fit(X_train, y_train)

    return model, encoder, X_test, y_test

model, encoder, X_test, y_test = train_logistic(csv_path="simulated_divorce_final.csv", use_smote=True)
