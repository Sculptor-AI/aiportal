const DEFAULT_TRANSIENT_STATUSES = new Set([500, 502, 503, 504]);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryStatus = (status, transientStatuses) => transientStatuses.has(status);

export async function fetchWithProviderRetries(url, init = {}, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const maxAttempts = Math.max(1, options.maxAttempts || 2);
  const retryDelayMs = Math.max(0, options.retryDelayMs ?? 250);
  const transientStatuses = options.transientStatuses || DEFAULT_TRANSIENT_STATUSES;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, init);
      const shouldRetry =
        attempt < maxAttempts &&
        shouldRetryStatus(response.status, transientStatuses);

      if (!shouldRetry) {
        return response;
      }

      await response.body?.cancel?.();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) {
        throw error;
      }
    }

    if (retryDelayMs > 0) {
      await wait(retryDelayMs);
    }
  }

  throw lastError || new Error('Provider request failed');
}
