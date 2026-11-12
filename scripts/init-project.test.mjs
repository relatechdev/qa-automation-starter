import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const SKIP = new Set([
  'node_modules',
  '.git',
  '.auth',
  '.env',
  'test-results',
  'playwright-report',
]);

function copyOfStarter() {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'starter-'));
  fs.cpSync(root, copy, { recursive: true, filter: (source) => !SKIP.has(path.basename(source)) });
  return copy;
}

function init(copy, ...args) {
  return execFileSync(process.execPath, ['scripts/init-project.mjs', ...args], {
    cwd: copy,
    encoding: 'utf8',
  });
}

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(full) : [full];
  });
}

test('a project made from the starter has its own name and environments, and no demo', () => {
  const copy = copyOfStarter();
  const read = (...parts) => fs.readFileSync(path.join(copy, ...parts), 'utf8');
  const exists = (...parts) => fs.existsSync(path.join(copy, ...parts));

  init(
    copy,
    '--name',
    'Acme Portal',
    '--env',
    'staging=https://staging.acme.test/',
    '--env',
    'prod=https://app.acme.test',
    '--api',
    'staging=https://api.staging.acme.test',
    '--roles',
    'user,admin',
  );

  assert.deepEqual(fs.readdirSync(path.join(copy, 'config', 'environments')).sort(), [
    'prod.json',
    'staging.json',
  ]);
  assert.deepEqual(JSON.parse(read('config', 'environments', 'staging.json')), {
    baseUrl: 'https://staging.acme.test',
    apiUrl: 'https://api.staging.acme.test',
    roles: ['user', 'admin'],
    readOnly: false,
  });
  assert.equal(JSON.parse(read('config', 'environments', 'prod.json')).readOnly, true);

  const example = read('.env.example');
  assert.match(example, /^TEST_ENV=staging$/m);
  for (const key of [
    'STAGING_USER_EMAIL',
    'STAGING_ADMIN_PASSWORD',
    'PROD_USER_EMAIL',
    'PROD_ADMIN_PASSWORD',
  ]) {
    assert.match(example, new RegExp(`^${key}=$`, 'm'));
  }

  assert.equal(JSON.parse(read('package.json')).name, 'acme-portal-test-automation');
  assert.equal(
    JSON.parse(read('package-lock.json')).packages[''].name,
    'acme-portal-test-automation',
  );
  assert.match(read('README.md'), /^# Acme Portal test automation$/m);
  assert.match(
    read('PROJECT.md'),
    /\| `prod` \| https:\/\/app\.acme\.test \| https:\/\/app\.acme\.test \| no: read-only \|/,
  );
  assert.match(read('.github', 'workflows', 'run-tests.yml'), /default: staging/);

  for (const gone of [
    'demo-app',
    'tests/web',
    'tests/api',
    'scripts/templates',
    'scripts/init-project.mjs',
    '.claude/skills/new-project',
  ]) {
    assert.equal(exists(gone), false, `${gone} should be gone`);
  }
  for (const kept of [
    'tests/setup/auth.setup.ts',
    'src/pages/login-page.ts',
    'src/fixtures/test.ts',
    'cases/inventory.csv',
  ]) {
    assert.equal(exists(kept), true, `${kept} should stay`);
  }

  const leftovers =
    /demo-app|demo:start|demo:end|items-page|ItemsClient|LOCAL_USER|init-project|new-project|\{\{\w+\}\}/;
  for (const file of filesIn(copy)) {
    if (file.includes(`${path.sep}playwright-`)) continue;
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), leftovers, path.relative(copy, file));
  }

  fs.rmSync(copy, { recursive: true, force: true });
});

test('it refuses arguments it cannot use', () => {
  const copy = copyOfStarter();
  const refused = (...args) =>
    assert.throws(() =>
      execFileSync(process.execPath, ['scripts/init-project.mjs', ...args], {
        cwd: copy,
        stdio: 'pipe',
      }),
    );

  refused('--env', 'staging=https://staging.acme.test');
  refused('--name', 'Acme');
  refused('--name', 'Acme', '--env', 'staging=not a url');
  refused('--name', 'Acme', '--env', 'staging=https://a.test', '--read-only', 'dev');
  assert.equal(fs.existsSync(path.join(copy, 'demo-app')), true, 'a refused run changes nothing');

  fs.rmSync(copy, { recursive: true, force: true });
});
