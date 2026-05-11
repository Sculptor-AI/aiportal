import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldIncludeMessageInModelHistory } from './chatHistory.js';

test('shouldIncludeMessageInModelHistory excludes failed assistant messages', () => {
  assert.equal(
    shouldIncludeMessageInModelHistory({
      role: 'assistant',
      content: 'Error with gemini-3.1-pro: Backend returned status 500',
      isError: true
    }),
    false
  );
});

test('shouldIncludeMessageInModelHistory excludes still-loading messages', () => {
  assert.equal(
    shouldIncludeMessageInModelHistory({
      role: 'assistant',
      content: '',
      isLoading: true
    }),
    false
  );
});

test('shouldIncludeMessageInModelHistory keeps normal user and assistant messages', () => {
  assert.equal(
    shouldIncludeMessageInModelHistory({ role: 'user', content: 'What is dy/du?' }),
    true
  );
  assert.equal(
    shouldIncludeMessageInModelHistory({ role: 'assistant', content: 'dy/du = x.' }),
    true
  );
});
