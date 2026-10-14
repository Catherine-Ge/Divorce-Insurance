"""FAQ-only Gemini integration. No user messages or quote data reach the model."""
import json
import os
import re
import time
from pathlib import Path
from threading import Lock
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from flask import request, jsonify

TOPICS = {
    "quote": "How do I get a quote?",
    "inputs": "What information do you need?",
    "premium": "How is my premium calculated?",
    "risk": "What does the risk score mean?",
    "payout": "What payout does the quote show?",
    "explain": "Can you explain my quote?",
    "email": "Can I receive my quote by email?",
    "purchase": "Can I purchase a policy?",
    "coverage": "When would coverage begin?",
    "exclusions": "What exclusions apply?",
    "claims": "How would I make a claim?",
    "reset": "How do I start again?",
}

def register_chat_routes(app):
    folder = Path(__file__).resolve().parent
    guide = (folder / "product_guide.md").read_text(encoding="utf-8")
    instructions = (folder / "chatbot_instructions.txt").read_text(encoding="utf-8")
    sections = {}
    for part in guide.split("### ")[1:]:
        heading, answer = part.split("\n", 1)
        sections[heading.strip()] = answer.strip()
    cache = {}
    lock = Lock()
    last_call = [float("-inf")]

    @app.route("/chat", methods=["POST"])
    def chat():
        data = request.get_json(silent=True)
        # Reject extra fields rather than accidentally forwarding private data.
        if not isinstance(data, dict) or set(data) != {"topic"} or not isinstance(data.get("topic"), str) or data["topic"] not in TOPICS:
            return jsonify({"error": "Choose a supported FAQ topic."}), 400
        topic = data["topic"]
        question = TOPICS[topic]
        fallback = sections[question]
        key = os.environ.get("GEMINI_API_KEY")
        model = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
        if not key or not re.fullmatch(r"[a-zA-Z0-9._-]+", model):
            return jsonify({"reply": fallback, "source": "guide"})
        # Cache fixed public topics and space calls to protect the free quota.
        with lock:
            if topic in cache:
                return jsonify({"reply": cache[topic], "source": "gemini"})
            if time.monotonic() - last_call[0] < 6:
                return jsonify({"reply": fallback, "source": "guide"})
            last_call[0] = time.monotonic()
        payload = {
            "systemInstruction": {"parts": [{"text": instructions + "\nApproved product guide:\n" + guide}]},
            "contents": [{"role": "user", "parts": [{"text": question}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 512},
        }
        api_request = Request(
            "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "x-goog-api-key": key},
            method="POST",
        )
        try:
            with urlopen(api_request, timeout=12) as response:
                result = json.loads(response.read())
            candidate = result.get("candidates", [{}])[0]
            if candidate.get("finishReason") != "STOP":
                raise ValueError("Incomplete model response")
            reply = "\n".join(p.get("text", "") for p in candidate.get("content", {}).get("parts", []) if not p.get("thought")).strip()
            if not reply or len(reply) > 3000:
                raise ValueError("Invalid model response")
            with lock:
                cache[topic] = reply
            return jsonify({"reply": reply, "source": "gemini"})
        except HTTPError as error:
            app.logger.warning("Gemini FAQ unavailable (HTTP %s)", error.code)
        except (URLError, TimeoutError, OSError, ValueError, TypeError, KeyError, IndexError):
            app.logger.warning("Gemini FAQ unavailable; using approved guide")
        return jsonify({"reply": fallback, "source": "guide"})
