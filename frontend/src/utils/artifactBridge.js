const BRIDGE_SCRIPT = `
<script>
(function () {
  const pending = new Map();

  window.Sculptor = {
    chat(prompt) {
      return new Promise((resolve, reject) => {
        const requestId = 'artifact-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        pending.set(requestId, { resolve, reject });
        window.parent.postMessage({
          type: 'sculptor-artifact-chat',
          requestId,
          prompt: String(prompt || '')
        }, '*');
      });
    }
  };

  window.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type !== 'sculptor-artifact-chat-result' || !data.requestId) return;

    const handlers = pending.get(data.requestId);
    if (!handlers) return;
    pending.delete(data.requestId);

    if (data.ok) {
      handlers.resolve(data.content || '');
    } else {
      handlers.reject(new Error(data.error || 'Artifact chat failed'));
    }
  });
})();
</script>`;

export const buildArtifactDocument = (html = '') => {
  const source = String(html || '');

  if (source.includes('</body>')) {
    return source.replace(/<\/body>/i, `${BRIDGE_SCRIPT}</body>`);
  }

  if (source.includes('</html>')) {
    return source.replace(/<\/html>/i, `${BRIDGE_SCRIPT}</html>`);
  }

  return `${source}${BRIDGE_SCRIPT}`;
};

export const postArtifactChatResult = (frameWindow, requestId, payload) => {
  if (!frameWindow || !requestId) return;

  frameWindow.postMessage({
    type: 'sculptor-artifact-chat-result',
    requestId,
    ...payload
  }, '*');
};
