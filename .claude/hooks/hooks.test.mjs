import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { question } from './guard-commands.mjs';
import { refusal } from './protect-secrets.mjs';
import { status } from './session-status.mjs';

const bash = (command) => refusal({ tool_name: 'Bash', tool_input: { command } });
const read = (file_path) => refusal({ tool_name: 'Read', tool_input: { file_path } });

test('files with passwords or sessions are closed to Claude', () => {
  for (const file of [
    '.env',
    '/repo/.env',
    '.env.staging',
    'C:\\repo\\.env',
    '.auth/staging-user.json',
    '/repo/.auth/x.json',
  ]) {
    assert.ok(read(file), file);
  }
  for (const file of [
    '.env.example',
    'config/env.ts',
    'docs/environment.md',
    'src/authentication.ts',
  ]) {
    assert.equal(read(file), null, file);
  }
  assert.ok(refusal({ tool_name: 'Grep', tool_input: { pattern: 'PASSWORD', path: '.env' } }));
  assert.equal(
    refusal({ tool_name: 'Grep', tool_input: { pattern: 'PASSWORD', path: 'src' } }),
    null,
  );
});

test('commands that would show those files are refused', () => {
  for (const command of [
    'cat .env',
    'grep PASSWORD .env',
    'cd /repo && cat ./.env',
    'head -n 3 .env.staging',
    'cp .env /tmp/copy',
    'npm test; cat .env',
    'cat .auth/staging-user.json',
    'npx playwright cli state-load .auth/staging-user.json && cat .auth/staging-user.json',
  ]) {
    assert.ok(bash(command), command);
  }
});

test('commands that only use those files go ahead', () => {
  for (const command of [
    'cp .env.example .env',
    'cat .env.example',
    'ls -la .env',
    'git check-ignore .env',
    'npm test',
    'npx playwright test --grep @TC-001',
    'npx playwright cli state-load .auth/staging-user.json',
    'npx playwright codegen --load-storage=.auth/staging-user.json https://example.test',
    'rm -rf .auth',
    'node scripts/doctor.mjs',
    'echo process.env.TEST_ENV',
  ]) {
    assert.equal(bash(command), null, command);
  }
});

function checkout(files) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hooks-'));
  for (const [name, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(directory, name)), { recursive: true });
    fs.writeFileSync(path.join(directory, name), content);
  }
  return directory;
}

test('a test run against a read-only environment asks first', () => {
  const cwd = checkout({
    'config/environments/prod.json': '{"baseUrl":"https://app.example.test","readOnly":true}',
    'config/environments/staging.json':
      '{"baseUrl":"https://staging.example.test","readOnly":false}',
    '.env': 'TEST_ENV=staging\n',
  });
  const ask = (command) => question(command, { cwd, branch: () => 'feature' });

  assert.match(ask('TEST_ENV=prod npx playwright test'), /read-only/);
  assert.match(ask('TEST_ENV=prod npm run test:smoke'), /read-only/);
  assert.equal(ask('npx playwright test'), null);
  assert.equal(ask('TEST_ENV=staging npm test'), null);
  assert.equal(ask('TEST_ENV=prod npm run doctor'), null);

  fs.writeFileSync(path.join(cwd, '.env'), 'TEST_ENV=prod\n');
  assert.match(ask('npm test'), /read-only/);
});

test('a push that skips the pull request asks first', () => {
  const on = (branch) => (command) => question(command, { cwd: os.tmpdir(), branch: () => branch });

  assert.match(on('feature')('git push --force'), /forced push/);
  assert.match(on('feature')('git push -f origin feature'), /forced push/);
  assert.match(on('feature')('git push --force-with-lease'), /forced push/);
  assert.match(on('feature')('git push origin main'), /main branch/);
  assert.match(on('feature')('git push origin HEAD:main'), /main branch/);
  assert.match(on('main')('git push'), /main branch/);
  assert.match(on('main')('git add . && git commit -m x && git push -u origin'), /main branch/);
  assert.equal(on('feature')('git push'), null);
  assert.equal(on('feature')('git push -u origin feature'), null);
  assert.equal(on('main')('git status'), null);
});

test('the status names the next step of a checkout', () => {
  const noted = checkout({
    '.claude/session-note.md': 'Staging is rebuilt on Fridays.\n',
    'PROJECT.md': '# Project\n',
    'cases/inventory.csv': 'id,area\nTC-001,Sign-in\n',
    '.env': '',
    'node_modules/x': '',
  });
  assert.deepEqual(status(noted), ['Staging is rebuilt on Fridays.']);

  const fresh = checkout({
    'PROJECT.md': '# Project\n<!-- what it does -->\n',
    'cases/inventory.csv': 'id,area\n',
  });
  const lines = status(fresh).join('\n');
  for (const expected of [
    /PROJECT\.md/,
    /inventory is empty/,
    /not installed/,
    /\.env does not exist/,
  ]) {
    assert.match(lines, expected);
  }

  const ready = checkout({
    'PROJECT.md': '# Project\nAll answered.\n',
    'cases/inventory.csv': 'id,area\nTC-001,Sign-in\n',
    '.env': '',
    'node_modules/x': '',
  });
  assert.deepEqual(status(ready), []);
});
