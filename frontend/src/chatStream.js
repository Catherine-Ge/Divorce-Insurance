// Decode across arbitrary network and UTF-8 boundaries; require a terminal event.
export async function readChatStream(response, onEvent) {
  if (!response.ok || !response.body) throw new Error('Chat unavailable');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', done = false;
  const consume = line => {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (event.type === 'error') throw new Error(event.message);
    if (event.type === 'done') done = true;
    else if (event.type !== 'delta' || typeof event.text !== 'string') throw new Error('Invalid stream');
    onEvent(event);
  };
  try {
    while (!done) {
      const part = await reader.read();
      buffer += decoder.decode(part.value, { stream: !part.done });
      let end;
      while ((end = buffer.indexOf('\n')) >= 0) {
        consume(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
      }
      if (part.done) { if (buffer.trim()) consume(buffer); break; }
    }
    if (!done) throw new Error('Reply interrupted');
  } finally { await reader.cancel(); reader.releaseLock(); }
}
