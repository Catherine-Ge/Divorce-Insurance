
from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd

app = Flask(__name__)

# Load model and encoder
model = joblib.load("logistic_model.pkl")
encoder = joblib.load("encoder.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    input_df = pd.DataFrame([data])
    input_encoded = encoder.transform(input_df)
    prob = model.predict_proba(input_encoded)[0][1]
    premium = 100 + prob * 500  # Example pricing formula
    return jsonify({"predicted_divorce_risk": prob, "quote": round(premium, 2)})

if __name__ == "__main__":
    app.run(debug=True)
