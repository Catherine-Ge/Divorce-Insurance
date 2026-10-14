import os
import joblib
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd

app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)

from chatbot import register_chat_routes
register_chat_routes(app)

# Load the deployed artifacts bundled with this backend directory.
model_dir = os.path.abspath(os.path.dirname(__file__))

# Load model and encoder
model = joblib.load(os.path.join(model_dir, "logistic_model.pkl"))
encoder = joblib.load(os.path.join(model_dir, "onehot_encoder.pkl"))

import json
import socket
from html import escape
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

def send_email(to_address, subject, body):
    api_key = os.environ.get("BREVO_API_KEY")
    from_address = os.environ.get("EMAIL_USER")
    if not api_key or not from_address:
        raise RuntimeError("Email configuration is missing")
    payload = {
        "sender": {"name": "Divorce Insurance", "email": from_address},
        "to": [{"email": to_address}],
        "subject": subject,
        "textContent": body,
        "htmlContent": "<pre>" + escape(body) + "</pre>",
    }
    email_request = Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        headers={"api-key": api_key, "Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    with urlopen(email_request, timeout=10) as response:
        if response.status != 201:
            raise RuntimeError("Unexpected email provider response")

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    if not isinstance(data, dict):
        return jsonify({"error": "Please submit a JSON object."}), 400
    fields = ["AgeGroup", "YearsTogether", "Province"]
    if any(not isinstance(data.get(field), str) or not data[field].strip() for field in fields):
        return jsonify({"error": "Please complete all quote fields."}), 400
    df = pd.DataFrame([{field: data[field] for field in fields}])
    if "email" in df.columns:
        df = df.drop(columns=["email"])  #remove the email before encoding
    try:
        X = encoder.transform(df)
        proba = model.predict_proba(X)[0][1]
    except ValueError:
        return jsonify({"error": "Please select valid values for all quote fields."}), 400

    base_premium = 500
    premium = base_premium + proba * 1000
    payout = 10000 if proba > 0.5 else 5000

    if "email" in data:
         quote_text = f"""Thank you for using Divorce Insurance!
        Estimated Divorce Risk: {round(proba * 100, 1)}%
        Premium: ${round(premium, 2)}
        Payout on Divorce: ${payout}
    """
    email_status = "not_requested"
    if data.get("email"):
        try:
            send_email(data["email"], "Your Divorce Insurance Quote", quote_text)
            email_status = "accepted"
        except HTTPError as error:
            # Log the status only, never credentials, quote content, or recipient data.
            app.logger.warning("Brevo rejected email request (HTTP %s)", error.code)
            email_status = "failed"
        except (URLError, TimeoutError, socket.timeout, RuntimeError, OSError):
            app.logger.warning("Quote email could not be submitted to Brevo")
            email_status = "failed"

    return jsonify({
        "divorce_risk": round(proba, 3),
        "premium": round(premium, 2),
        "payout": payout,
        "email_status": email_status
    })

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)