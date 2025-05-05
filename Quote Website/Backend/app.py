import os
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)
CORS(app)  # allow frontend to connect

# Get project root
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
model_dir = os.path.join(root_dir, "insurance_design")

# Load model and encoder
model = joblib.load(os.path.join(model_dir, "logistic_model.pkl"))
encoder = joblib.load(os.path.join(model_dir, "onehot_encoder.pkl"))

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
