const cleanTextBody = (text) => (
  text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
);

const getPayloadMessage = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if (typeof payload.error === 'string') {
    return payload.error;
  }

  if (typeof payload.error?.message === 'string') {
    return payload.error.message;
  }

  if (typeof payload.message === 'string') {
    return payload.message;
  }

  return '';
};

export async function readBackendErrorMessage(response) {
  const statusLabel = response.statusText || `status ${response.status}`;
  const fallback = `Backend returned ${statusLabel}`;
  const bodyText = await response.text().catch(() => '');

  if (!bodyText) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(bodyText);
    return getPayloadMessage(parsed) || fallback;
  } catch (_) {
    return cleanTextBody(bodyText) || fallback;
  }
}
