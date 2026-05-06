const ARTIFACT_CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline'",
  "img-src data: blob:",
  "font-src data:",
  "media-src data: blob:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'"
].join('; ');

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${ARTIFACT_CSP}">`;

const BRIDGE_SCRIPT = `
<script>
(function () {
  const pending = new Map();
  let resizeTimer = null;

  const postResize = () => {
    const doc = document.documentElement;
    const body = document.body;
    const height = Math.max(
      doc ? doc.scrollHeight : 0,
      body ? body.scrollHeight : 0,
      doc ? doc.offsetHeight : 0,
      body ? body.offsetHeight : 0,
      220
    );

    window.parent.postMessage({
      type: 'sculptor-artifact-resize',
      height
    }, '*');
  };

  const scheduleResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(postResize, 40);
  };

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

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleResize);
    observer.observe(document.documentElement);
    if (document.body) observer.observe(document.body);
  }

  window.addEventListener('load', scheduleResize);
  window.addEventListener('resize', scheduleResize);
  scheduleResize();
  window.setTimeout(scheduleResize, 250);
})();
</script>`;

export const artifactUsesModelChat = (html = '') => {
  const source = String(html || '');
  return /\b(?:window\.)?Sculptor\s*\.\s*chat\s*\(/.test(source);
};

export const buildArtifactDocument = (html = '') => {
  let source = String(html || '');

  if (!/<meta\b[^>]*http-equiv=["']?Content-Security-Policy/i.test(source)) {
    if (/<head\b[^>]*>/i.test(source)) {
      source = source.replace(/<head\b[^>]*>/i, (match) => `${match}${CSP_META}`);
    } else if (/<html\b[^>]*>/i.test(source)) {
      source = source.replace(/<html\b[^>]*>/i, (match) => `${match}<head>${CSP_META}</head>`);
    } else {
      source = `<!doctype html><html><head>${CSP_META}</head><body>${source}</body></html>`;
    }
  }

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
