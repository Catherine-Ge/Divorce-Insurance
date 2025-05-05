from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)  # allow frontend to connect

# Load model and encoder
model = joblib.load("Insurance Design/logistic_model.pkl")
encoder = joblib.load("Insurance Design/onehot_encoder.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    df = pd.DataFrame([data])
    X = encoder.transform(df)
    proba = model.predict_proba(X)[0][1]

    base_premium = 500
    premium = base_premium + proba * 1000
    payout = 10000 if proba > 0.5 else 5000

    return jsonify({
        "divorce_risk": round(proba, 3),
        "premium": round(premium, 2),
        "payout": payout
    })

if __name__ == "__main__":
    app.run(debug=True)
