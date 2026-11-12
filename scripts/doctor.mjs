// Checks that this machine and this checkout are ready to run tests, and says how to fix
// what is not. It names the keys of .env and never prints their values.
// Usage: npm run doctor
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const at = (...parts) => path.join(root, ...parts);
const results = [];

const pass = (text) => results.push({ mark: '✓', text });
const note = (text, fix) => results.push({ mark: '!', text, fix });
const fail = (text, fix) => results.push({ mark: '✗', text, fix });

const envKey = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

function checkNode() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major > 22 || (major === 22 && minor >= 12)) pass(`Node.js ${process.versions.node}`);
  else
    fail(
      `Node.js ${process.versions.node} is too old`,
      'Install the current LTS from https://nodejs.org',
    );
}

function checkDependencies() {
  const wanted = JSON.parse(fs.readFileSync(at('package.json'), 'utf8')).devDependencies[
    '@playwright/test'
  ];
  const installed = at('node_modules', '@playwright', 'test', 'package.json');
  if (!fs.existsSync(installed)) {
    fail('Dependencies are not installed', 'npm ci');
    return false;
  }
  const version = JSON.parse(fs.readFileSync(installed, 'utf8')).version;
  if (version === wanted) pass(`Playwright ${version}`);
  else fail(`Playwright ${version} is installed, package.json asks for ${wanted}`, 'npm ci');
  return version === wanted;
}

async function checkBrowser() {
  try {
    const { chromium } = await import('@playwright/test');
    const browser = await chromium.launch();
    await browser.close();
    pass('Chromium starts');
  } catch {
    fail(
      'Chromium is not installed for this Playwright version',
      'npx playwright install chromium',
    );
  }
}

function checkEnvFile() {
  if (!fs.existsSync(at('.env'))) {
    fail('.env does not exist', 'Copy .env.example to .env, then fill it in');
    return;
  }
  process.loadEnvFile(at('.env'));
  pass('.env exists');
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '.env'], { cwd: root, stdio: 'ignore' });
    fail('.env is tracked by git', 'git rm --cached .env, then change every password it held');
  } catch {
    // Not tracked, as it should be.
  }
}

function checkEnvironment() {
  const name = process.env.TEST_ENV;
  if (!name) {
    fail(
      'TEST_ENV is not set',
      'Set TEST_ENV in .env to the name of a file in config/environments/',
    );
    return null;
  }
  const file = at('config', 'environments', `${name}.json`);
  if (!fs.existsSync(file)) {
    const known = fs.readdirSync(path.dirname(file)).map((entry) => path.basename(entry, '.json'));
    fail(
      `TEST_ENV is "${name}" but config/environments/${name}.json does not exist`,
      `Use one of: ${known.join(', ')}`,
    );
    return null;
  }
  const environment = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!environment.baseUrl) {
    fail(`config/environments/${name}.json has no baseUrl`, 'Fill it in, or run /new-project');
    return null;
  }
  pass(
    `Environment "${name}" → ${environment.baseUrl}${environment.readOnly ? ' (read-only)' : ''}`,
  );
  return { name, roles: environment.roles?.length ? environment.roles : ['user'], ...environment };
}

function checkAccounts(environment) {
  for (const role of environment.roles) {
    const key = `${envKey(environment.name)}_${envKey(role)}`;
    const missing = [`${key}_EMAIL`, `${key}_PASSWORD`].filter((name) => !process.env[name]);
    if (missing.length === 0) pass(`Account for role "${role}" is set`);
    else fail(`Account for role "${role}" is incomplete`, `Add ${missing.join(' and ')} to .env`);
  }
}

async function checkReachable(environment) {
  try {
    await fetch(environment.baseUrl, { signal: AbortSignal.timeout(8000), redirect: 'manual' });
    pass('The application answers');
  } catch {
    const onThisMachine = /^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/.test(environment.baseUrl);
    if (onThisMachine) {
      note(
        `${environment.baseUrl} does not answer`,
        'Start the application, unless the test run starts it by itself',
      );
    } else {
      fail(
        `${environment.baseUrl} does not answer`,
        'Check the URL, your network and whether a VPN is needed',
      );
    }
  }
}

function checkSignedIn(environment) {
  for (const role of environment.roles) {
    const file = at('.auth', `${environment.name}-${role}.json`);
    if (fs.existsSync(file)) pass(`Signed-in state for "${role}" exists`);
    else
      note(`No signed-in state for "${role}" yet`, 'npm run auth (every test run also creates it)');
  }
}

checkNode();
if (checkDependencies()) await checkBrowser();
checkEnvFile();
const environment = checkEnvironment();
if (environment) {
  checkAccounts(environment);
  await checkReachable(environment);
  checkSignedIn(environment);
}

for (const { mark, text, fix } of results) {
  console.log(`${mark} ${text}${fix ? `\n    → ${fix}` : ''}`);
}
const failures = results.filter((result) => result.mark === '✗').length;
console.log(failures === 0 ? '\nReady.' : `\n${failures} to fix.`);
process.exit(failures === 0 ? 0 : 1);
