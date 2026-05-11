import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchWithProviderRetries } from './providerFetch.js';

test('fetchWithProviderRetries retries transient provider 500 responses', async () => {
  const responses = [
    new Response('temporary overload', { status: 500 }),
    new Response('ok', { status: 200 })
  ];
  let attempts = 0;

  const response = await fetchWithProviderRetries('https://provider.test/chat', {}, {
    fetchImpl: async () => responses[attempts++],
    retryDelayMs: 0
  });

  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'ok');
  assert.equal(attempts, 2);
});

test('fetchWithProviderRetries does not retry caller-correctable 400 responses', async () => {
  let attempts = 0;

  const response = await fetchWithProviderRetries('https://provider.test/chat', {}, {
    fetchImpl: async () => {
      attempts += 1;
      return new Response('bad request', { status: 400 });
    },
    retryDelayMs: 0
  });

  assert.equal(response.status, 400);
  assert.equal(attempts, 1);
});
