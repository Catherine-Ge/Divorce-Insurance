// Decode across arbitrary network and UTF-8 boundaries; require a terminal event.
export async function readChatStream(response, onEvent, signal) {
  if (!response.ok || !response.body) throw new Error('Chat unavailable');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', done = false;
  const pause = () => new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(new Error('Reply stopped'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, 25);
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
  });
  const consume = async line => {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === 'error') throw new Error(event.message);
    if (event.type === 'done') done = true;
    else if (event.type !== 'delta' || typeof event.text !== 'string') throw new Error('Invalid stream');
    if (event.type === 'delta') {
      // Reveal three characters every 25 ms, even when a large chunk arrives.
      const characters = Array.from(event.text);
      for (let i = 0; i < characters.length; i += 3) {
        await pause();
        onEvent({ ...event, text: characters.slice(i, i + 3).join('') });
      }
    } else onEvent(event);
  };
  try {
    while (!done) {
      const part = await reader.read();
      buffer += decoder.decode(part.value, { stream: !part.done });
      let end;
      while ((end = buffer.indexOf('\n')) >= 0) {
        await consume(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
      }
      if (part.done) { if (buffer.trim()) await consume(buffer); break; }
    }
    if (!done) throw new Error('Reply interrupted');
  } finally { await reader.cancel(); reader.releaseLock(); }
}
