import { TextDecoder, TextEncoder } from 'util';
import { readChatStream } from './chatStream';
global.TextDecoder = TextDecoder;

export function streamResponse(events) {
  const bytes = new TextEncoder().encode(events.map(e => JSON.stringify(e) + '\n').join(''));
  // One byte per read exercises split JSON and multi-byte characters.
  let i = 0;
  return { ok: true, body: { getReader: () => ({
    read: async () => i < bytes.length ? { value: bytes.slice(i, ++i), done: false } : { done: true },
    cancel: async () => {}, releaseLock: () => {},
  }) } };
}

test('decodes fragmented UTF-8 and detects truncated replies', async () => {
  const chunks = [];
  await readChatStream(streamResponse([{ type: 'delta', text: '你好 🌊' }, { type: 'done', source: 'gemini' }]), e => chunks.push(e));
  expect(chunks[0].text).toBe('你好 🌊');
  await expect(readChatStream(streamResponse([{ type: 'delta', text: 'Partial' }]), () => {})).rejects.toThrow('interrupted');
});
