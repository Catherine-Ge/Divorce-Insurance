import importlib.util
import json
import os
import sys
import unittest
from unittest.mock import patch, MagicMock
from urllib.error import HTTPError

sys.path.insert(0, os.path.dirname(__file__))
spec = importlib.util.spec_from_file_location("quote_app", os.path.join(os.path.dirname(__file__), "app.py"))
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)
import chatbot
from flask import Flask

class ChatTests(unittest.TestCase):
    def setup_client(self):
        app = Flask("test")
        chatbot.register_chat_routes(app)
        return app.test_client()

    def test_missing_key_uses_approved_guide(self):
        with patch.dict(os.environ, {}, clear=True), patch("chatbot.urlopen") as call:
            r = self.setup_client().post("/chat", json={"topic": "premium"})
            self.assertEqual(r.status_code, 200)
            self.assertIn("single upfront", r.json["reply"])
            self.assertEqual(r.json["source"], "guide")
            call.assert_not_called()

    def test_rejects_private_data_and_invalid_topics(self):
        client = self.setup_client()
        with patch("chatbot.urlopen") as call:
            for payload in ({}, [], {"topic": "unknown"}, {"topic": "premium", "email": "private@example.invalid"}, {"topic": "premium", "message": "private details"}, {"topic": []}):
                self.assertEqual(client.post("/chat", json=payload).status_code, 400)
            call.assert_not_called()

    def test_gemini_context_and_cache(self):
        response = MagicMock()
        response.__enter__.return_value = response
        response.read.return_value = json.dumps({"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": "A single upfront premium."}]}}]}).encode()
        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), patch("chatbot.urlopen", return_value=response) as call:
            client = self.setup_client()
            r = client.post("/chat", json={"topic": "premium"})
            self.assertEqual(r.json["source"], "gemini")
            req = call.call_args.args[0]
            payload = json.loads(req.data)
            self.assertEqual(payload["contents"][0]["parts"][0]["text"], chatbot.TOPICS["premium"])
            self.assertIn("demo", payload["systemInstruction"]["parts"][0]["text"])
            self.assertNotIn("test-key", req.full_url)
            self.assertEqual(call.call_args.kwargs["timeout"], 12)
            self.assertEqual(client.post("/chat", json={"topic": "premium"}).json["source"], "gemini")
            self.assertEqual(call.call_count, 1)
            self.assertEqual(client.post("/chat", json={"topic": "risk"}).json["source"], "guide")
            self.assertEqual(call.call_count, 1)

    def test_provider_failures_fall_back(self):
        for failure in (HTTPError("https://example.invalid", 429, "Limit", {}, None), TimeoutError()):
            with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), patch("chatbot.urlopen", side_effect=failure):
                r = self.setup_client().post("/chat", json={"topic": "claims"})
                self.assertEqual(r.status_code, 200)
                self.assertEqual(r.json["source"], "guide")
                self.assertIn("demo", r.json["reply"])

    def test_blocked_or_empty_response_falls_back(self):
        for payload in ({}, {"candidates": [{"finishReason": "SAFETY"}]}, {"candidates": [{"finishReason": "STOP", "content": {"parts": []}}]}):
            response = MagicMock()
            response.__enter__.return_value = response
            response.read.return_value = json.dumps(payload).encode()
            with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}), patch("chatbot.urlopen", return_value=response):
                self.assertEqual(self.setup_client().post("/chat", json={"topic": "payout"}).json["source"], "guide")

    def test_quotes_and_email_remain_separate(self):
        client = app_module.app.test_client()
        details = {"AgeGroup": "30 to 34 years", "YearsTogether": "5 years", "Province": "Ont."}
        with patch("chatbot.urlopen") as ai:
            r = client.post("/predict", json=details)
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.json["email_status"], "not_requested")
            quote = r.json
            with patch.object(app_module, "send_email") as email:
                emailed = client.post("/predict", json={**details, "email": "test@example.invalid"})
                self.assertEqual(emailed.json["premium"], quote["premium"])
                self.assertEqual(emailed.json["email_status"], "accepted")
                email.assert_called_once()
            ai.assert_not_called()

if __name__ == "__main__":
    unittest.main()
