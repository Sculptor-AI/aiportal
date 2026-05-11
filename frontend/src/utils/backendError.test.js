import test from 'node:test';
import assert from 'node:assert/strict';

import { readBackendErrorMessage } from './backendError.js';

test('readBackendErrorMessage preserves non-JSON backend error bodies', async () => {
  const response = new Response('<html><body>worker failed before route handler</body></html>', {
    status: 500,
    statusText: ''
  });

  const message = await readBackendErrorMessage(response);

  assert.equal(message, 'worker failed before route handler');
});

test('readBackendErrorMessage extracts JSON error messages from backend responses', async () => {
  const response = new Response(JSON.stringify({ error: { message: 'Gemini overloaded' } }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });

  const message = await readBackendErrorMessage(response);

  assert.equal(message, 'Gemini overloaded');
});

test('readBackendErrorMessage falls back to status when the body is empty', async () => {
  const response = new Response('', {
    status: 500,
    statusText: ''
  });

  const message = await readBackendErrorMessage(response);

  assert.equal(message, 'Backend returned status 500');
});
