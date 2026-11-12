import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findSecrets, isSecretFile } from './secrets.mjs';

// Built from parts, so this file holds nothing the scan would flag.
const join = (...parts) => parts.join('');

test('finds secrets by their shape, and says only what they look like', () => {
  const text = [
    'url: https://example.test',
    join('webhook: https://hooks.slack', '.com/services/T0AAA/B0BBB/', 'abcdefGHIJ123'),
    join('key: AKIA', 'ABCDEFGHIJKLMNOP'),
    join('-----BEGIN RSA ', 'PRIVATE KEY-----'),
    join('token: eyJ', 'hbGciOiJSUzI1NiJ9.eyJ', 'zdWIiOiIxMjM0NSJ9.c2lnbmF0dXJl'),
  ].join('\n');

  assert.deepEqual(findSecrets(text), [
    { line: 2, kind: 'a Slack webhook' },
    { line: 3, kind: 'an AWS access key' },
    { line: 4, kind: 'a private key' },
    { line: 5, kind: 'a JSON Web Token' },
  ]);
});

test('leaves ordinary code and test data alone', () => {
  const text = [
    "await app.login.signIn(env.account('user').email, 'not-the-password');",
    'STAGING_USER_PASSWORD=',
    'const name = uniqueName("invoice");',
    '"integrity": "sha512-Zm9vYmFyYmF6cXV4"',
  ].join('\n');

  assert.deepEqual(findSecrets(text), []);
});

test('knows the files that hold secrets by their name', () => {
  for (const file of [
    '.env',
    'config/.env.staging',
    '.auth/staging-user.json',
    'certs/client.pem',
  ]) {
    assert.ok(isSecretFile(file), file);
  }
  for (const file of ['.env.example', 'config/env.ts', 'docs/auth.md', 'src/api/api-auth.ts']) {
    assert.equal(isSecretFile(file), false, file);
  }
});
