"""Stateless multi-turn chat; relay Gemini SSE as newline-delimited JSON."""
import json
import os
import re
from pathlib import Path
from urllib.request import Request, urlopen
from flask import Response, jsonify, request, stream_with_context


def register_stream_chat(app):
    folder = Path(__file__).resolve().parent
    guide = (folder / 'product_guide.md').read_text(encoding='utf-8')
    instructions = (folder / 'chatbot_instructions.txt').read_text(encoding='utf-8')

    def line(data):
        return json.dumps(data, ensure_ascii=False) + '\n'

    @app.post('/chat/stream')
    def stream_chat():
        if request.content_length and request.content_length > 40000:
            return jsonify(error='Conversation is too long. Start over.'), 413
        data = request.get_json(silent=True)
        messages = data.get('messages') if isinstance(data, dict) else None
        if (not isinstance(messages, list) or not 1 <= len(messages) <= 12
                or any(not isinstance(m, dict) or set(m) != {'role', 'content'}
                       or m.get('role') not in ('user', 'assistant')
                       or not isinstance(m.get('content'), str)
                       or not 1 <= len(m['content'].strip()) <= 2000 for m in messages)
                or messages[0]['role'] != 'user' or messages[-1]['role'] != 'user'
                or sum(len(m['content']) for m in messages) > 16000):
            return jsonify(error='Send up to 12 recent conversation messages.'), 400
        contents = [{'role': 'model' if m['role'] == 'assistant' else 'user',
                     'parts': [{'text': m['content']}]} for m in messages]
        key = os.environ.get('GEMINI_API_KEY')
        model = os.environ.get('GEMINI_MODEL', 'gemini-3.5-flash-lite')

        def generate():
            emitted = False
            complete = False
            total = 0
            try:
                if not key or not re.fullmatch(r'[a-zA-Z0-9._-]+', model):
                    raise ValueError('AI is not configured')
                payload = {'systemInstruction': {'parts': [{'text': instructions + '\nApproved guide:\n' + guide}]},
                           'contents': contents,
                           'generationConfig': {'temperature': 0.2, 'maxOutputTokens': 768}}
                upstream = Request(
                    'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':streamGenerateContent?alt=sse',
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json', 'x-goog-api-key': key}, method='POST')
                with urlopen(upstream, timeout=30) as response:
                    event = []
                    for raw in response:
                        value = raw.decode('utf-8').rstrip('\r\n')
                        if value.startswith('data:'):
                            event.append(value[5:].lstrip())
                        if value or not event:
                            continue
                        result = json.loads('\n'.join(event))
                        event = []
                        if result.get('error'):
                            raise ValueError('Provider error')
                        candidates = result.get('candidates', [])
                        if not candidates:
                            if result.get('promptFeedback', {}).get('blockReason'):
                                raise ValueError('Blocked')
                            continue
                        candidate = candidates[0]
                        reason = candidate.get('finishReason')
                        if reason and reason != 'STOP':
                            raise ValueError('Incomplete generation')
                        for part in candidate.get('content', {}).get('parts', []):
                            chunk = part.get('text', '') if not part.get('thought') else ''
                            if chunk:
                                total += len(chunk)
                                if total > 6000:
                                    raise ValueError('Response too long')
                                emitted = True
                                yield line({'type': 'delta', 'text': chunk})
                        complete = complete or reason == 'STOP'
                    if event or not complete or not emitted:
                        raise ValueError('Interrupted response')
                yield line({'type': 'done', 'source': 'gemini'})
            except (OSError, ValueError, TypeError, KeyError, IndexError):
                app.logger.warning('Gemini conversation unavailable or interrupted')
                if emitted:
                    yield line({'type': 'error', 'message': 'Reply interrupted. Please try your question again.'})
                else:
                    yield line({'type': 'delta', 'text': "AI chat is temporarily unavailable. You can still use Get a quote or read the FAQ page. Please try again shortly."})
                    yield line({'type': 'done', 'source': 'fallback'})

        return Response(stream_with_context(generate()), mimetype='application/x-ndjson',
                        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})
