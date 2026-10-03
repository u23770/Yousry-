import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from './sanitize.js';

test('escapes HTML metacharacters before rendering user-controlled text', () => {
  assert.equal(
    escapeHtml('<tag attr="quoted"> & text'),
    '&lt;tag attr=&quot;quoted&quot;&gt; &amp; text'
  );
});
