import test from 'node:test';
import assert from 'node:assert/strict';

import { formatModelSlugName } from './modelNames.js';

test('formatModelSlugName formats dash-delimited Claude model slugs', () => {
  assert.equal(formatModelSlugName('claude-opus-4.7'), 'Claude Opus 4.7');
  assert.equal(formatModelSlugName('claude-sonnet-4.6'), 'Claude Sonnet 4.6');
});

test('formatModelSlugName formats slugs consistently across model families', () => {
  assert.equal(formatModelSlugName('gpt-5.4-mini'), 'GPT 5.4 Mini');
  assert.equal(formatModelSlugName('gemini-3.1-flash-lite'), 'Gemini 3.1 Flash Lite');
});

test('formatModelSlugName treats consecutive numeric dash segments as dotted versions', () => {
  assert.equal(formatModelSlugName('claude-opus-4-7'), 'Claude Opus 4.7');
  assert.equal(formatModelSlugName('gpt-5-4-mini'), 'GPT 5.4 Mini');
});
