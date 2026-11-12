import assert from 'node:assert/strict';
import { test } from 'node:test';
import { redact, secretsOfDotenv } from './redact.mjs';

// Built from parts, so this file holds nothing a secret scan would flag.
const jwt = ['eyJhbGciOiJSUzI1NiJ9', 'eyJzdWIiOiIxMjM0NSJ9', 'c2lnbmF0dXJlLXZhbHVl'].join('.');

test('takes the passwords, keys and accounts of a .env file, not the rest', () => {
  const dotenv = [
    '# accounts',
    'TEST_ENV=staging',
    'STAGING_USER_EMAIL=qa.user@example.test',
    'STAGING_USER_PASSWORD="s3cret pass"',
    'API_KEY=abc',
    'BROWSER_TOKEN=tok-123456',
  ].join('\n');

  assert.deepEqual(secretsOfDotenv(dotenv), [
    { name: 'STAGING_USER_EMAIL', value: 'qa.user@example.test' },
    { name: 'STAGING_USER_PASSWORD', value: 's3cret pass' },
    { name: 'BROWSER_TOKEN', value: 'tok-123456' },
  ]);
});

test('hides the known values, also when they are URL-encoded', () => {
  const known = [{ name: 'STAGING_USER_PASSWORD', value: 's3cret pass' }];

  assert.equal(
    redact('fill "s3cret pass" then body password=s3cret%20pass', known),
    'fill "<STAGING_USER_PASSWORD>" then body password=<STAGING_USER_PASSWORD>',
  );
});

test('hides credential headers, as a trace prints them and as JSON', () => {
  const trace = [
    '  Request headers',
    `    authorization: Bearer ${jwt}`,
    '    cookie: session=abc; theme=dark',
    '    accept: application/json',
    '  Response headers',
    '    set-cookie: session=def; HttpOnly',
  ].join('\n');

  assert.equal(
    redact(trace),
    [
      '  Request headers',
      '    authorization: <redacted>',
      '    cookie: <redacted>',
      '    accept: application/json',
      '  Response headers',
      '    set-cookie: <redacted>',
    ].join('\n'),
  );
  assert.equal(
    redact('{"Authorization":"Basic dXNlcjpwYXNz","name":"x"}'),
    '{"Authorization":"<redacted>","name":"x"}',
  );
});

test('hides tokens in bodies, URLs and free text', () => {
  assert.equal(
    redact('{"access_token":"abc","refresh_token":"def","expires_in":3600}'),
    '{"access_token":"<redacted>","refresh_token":"<redacted>","expires_in":3600}',
  );
  assert.equal(
    redact('GET /oauth/callback?code=xyz123&state=ok'),
    'GET /oauth/callback?code=<redacted>&state=ok',
  );
  assert.equal(redact(`token ${jwt} seen`), 'token <jwt> seen');
  assert.equal(redact('send Bearer abcdefgh12345678'), 'send Bearer <redacted>');
});

test('leaves ordinary output alone', () => {
  const text = '  ✓ 3 [web] › items › search narrows the list (1.2s)\nGET 200 /api/items?q=qa-auto';
  assert.equal(redact(text), text);
});
