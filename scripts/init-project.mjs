// Turns a repository created from the starter into a project's own: removes the demo
// application and its examples, and writes the project's name and environments.
// It runs once, and removes itself. The /new-project skill calls it.
//
// Usage:
//   node scripts/init-project.mjs --name "Acme Portal" \
//     --env staging=https://staging.acme.test --env prod=https://app.acme.test \
//     [--api staging=https://api.staging.acme.test] [--roles user,admin] [--read-only prod]
//
// The first --env is the default for a run. An environment named prod or production is
// always read-only; --read-only adds others.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const at = (...parts) => path.join(root, ...parts);
const templates = at('scripts', 'templates', 'project');

function stop(message) {
  console.error(`${message}\n\nSee the usage at the top of scripts/init-project.mjs.`);
  process.exit(1);
}

function parseArguments(args) {
  const options = { name: '', environments: new Map(), roles: ['user'], readOnly: new Set() };
  const pair = (flag, value) => {
    const [key, ...rest] = (value ?? '').split('=');
    if (!key || rest.length === 0 || !rest.join('=')) stop(`${flag} needs <environment>=<url>.`);
    return [key.trim().toLowerCase(), rest.join('=').trim().replace(/\/+$/, '')];
  };
  for (let i = 0; i < args.length; i++) {
    const [flag, value] = [args[i], args[i + 1]];
    if (flag === '--name') options.name = (value ?? '').trim();
    else if (flag === '--env') {
      const [name, baseUrl] = pair(flag, value);
      options.environments.set(name, { baseUrl, ...options.environments.get(name) });
    } else if (flag === '--api') {
      const [name, apiUrl] = pair(flag, value);
      options.environments.set(name, { ...options.environments.get(name), apiUrl });
    } else if (flag === '--roles') {
      options.roles = (value ?? '')
        .split(',')
        .map((role) => role.trim().toLowerCase())
        .filter(Boolean);
    } else if (flag === '--read-only') options.readOnly.add((value ?? '').trim().toLowerCase());
    else stop(`Unknown argument: ${flag}`);
    i++;
  }

  if (!options.name) stop('--name is required.');
  if (options.environments.size === 0) stop('At least one --env <name>=<url> is required.');
  if (options.roles.length === 0) stop('--roles needs at least one role.');
  for (const [name, environment] of options.environments) {
    if (!/^[a-z][a-z0-9-]*$/.test(name))
      stop(`"${name}" is not a usable environment name (letters, digits, dashes).`);
    if (!environment.baseUrl) stop(`--api names "${name}", which has no --env.`);
    for (const url of [environment.baseUrl, environment.apiUrl].filter(Boolean)) {
      if (!URL.canParse(url)) stop(`"${url}" is not a URL.`);
    }
    environment.readOnly = options.readOnly.has(name) || name === 'prod' || name === 'production';
  }
  for (const name of options.readOnly) {
    if (!options.environments.has(name)) stop(`--read-only names "${name}", which has no --env.`);
  }
  return options;
}

const envKey = (value) => value.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

function remove(...parts) {
  fs.rmSync(at(...parts), { recursive: true, force: true });
}

function write(relative, content) {
  fs.mkdirSync(path.dirname(at(relative)), { recursive: true });
  fs.writeFileSync(at(relative), content);
}

function template(name, values = {}) {
  let text = fs.readFileSync(path.join(templates, name), 'utf8');
  for (const [key, value] of Object.entries(values)) text = text.replaceAll(`{{${key}}}`, value);
  return text;
}

/** Replaces one exact passage of a file, and fails loudly when the file no longer has it. */
function replaceIn(relative, from, to) {
  const text = fs.readFileSync(at(relative), 'utf8');
  if (!text.includes(from)) throw new Error(`${relative} no longer contains:\n${from}`);
  fs.writeFileSync(at(relative), text.replace(from, to));
}

function markdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory())
      return entry.name === 'node_modules' || entry.name === '.git' ? [] : markdownFiles(full);
    return entry.name.endsWith('.md') ? [full] : [];
  });
}

if (!fs.existsSync(templates))
  stop('This repository is already a project: the starter templates are gone.');
const options = parseArguments(process.argv.slice(2));
const [defaultEnvironment] = options.environments.keys();
const slug = options.name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

// The demo application, its page objects, clients, tests and cases.
remove('demo-app');
remove('src', 'pages', 'dashboard-page.ts');
remove('src', 'pages', 'items-page.ts');
remove('src', 'pages', 'components');
remove('src', 'api', 'items-client.ts');
remove('tests', 'web');
remove('tests', 'api');
remove('config', 'environments');
remove('.github', 'workflows', 'starter-self-test.yml');

write('src/pages/app.ts', template('app.ts'));
write('src/api/api.ts', template('api.ts'));
write('cases/inventory.csv', template('inventory.csv'));
replaceIn(
  'playwright.config.ts',
  `
  webServer:
    env.name === 'local'
      ? {
          command: 'node demo-app/server.mjs',
          url: \`\${env.baseUrl}/health\`,
          reuseExistingServer: !isCI,
        }
      : undefined,
`,
  '',
);

// The project's environments and accounts.
for (const [name, environment] of options.environments) {
  // Written the way Prettier formats it, so the project passes its own gate from the start.
  write(
    `config/environments/${name}.json`,
    `{
  "baseUrl": ${JSON.stringify(environment.baseUrl)},
  "apiUrl": ${JSON.stringify(environment.apiUrl ?? environment.baseUrl)},
  "roles": [${options.roles.map((role) => JSON.stringify(role)).join(', ')}],
  "readOnly": ${environment.readOnly}
}
`,
  );
}

const accounts = [...options.environments.keys()]
  .map((name) =>
    options.roles
      .map(
        (role) =>
          `${envKey(name)}_${envKey(role)}_EMAIL=\n${envKey(name)}_${envKey(role)}_PASSWORD=\n`,
      )
      .join(''),
  )
  .join('\n');
write(
  '.env.example',
  `# Copy this file to .env and fill it in. .env stays on your machine: it is ignored by git,
# and Claude is blocked from reading it.

# The environment the tests run against: the name of a file in config/environments/.
TEST_ENV=${defaultEnvironment}

# One account per role of each environment: <ENV>_<ROLE>_EMAIL and <ENV>_<ROLE>_PASSWORD.
${accounts}`,
);

// Names and descriptions.
const environmentRows = [...options.environments]
  .map(([name, environment]) => {
    const api = environment.apiUrl ?? environment.baseUrl;
    return `| \`${name}\` | ${environment.baseUrl} | ${api} | ${environment.readOnly ? 'no: read-only' : 'yes'} |`;
  })
  .join('\n');
write(
  'PROJECT.md',
  template('PROJECT.md', {
    name: options.name,
    environments: environmentRows,
    defaultEnvironment,
    roles: options.roles.map((role) => `\`${role}\``).join(', '),
  }),
);
write('README.md', template('README.md', { name: options.name }));

const manifest = JSON.parse(fs.readFileSync(at('package.json'), 'utf8'));
manifest.name = `${slug}-test-automation`;
manifest.description = `End-to-end and API tests for ${options.name}.`;
delete manifest.scripts.demo;
write('package.json', `${JSON.stringify(manifest, null, 2)}\n`);

const lock = JSON.parse(fs.readFileSync(at('package-lock.json'), 'utf8'));
lock.name = manifest.name;
lock.packages[''].name = manifest.name;
write('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);

replaceIn('.github/workflows/run-tests.yml', 'default: local', `default: ${defaultEnvironment}`);
replaceIn('eslint.config.mjs', "      'scripts/templates/',\n", '');
replaceIn('scripts/doctor.mjs', "'Fill it in, or run /new-project'", "'Fill it in'");

// What the docs say only about the starter and its demo.
for (const file of markdownFiles(root)) {
  const text = fs.readFileSync(file, 'utf8');
  const stripped = text.replace(/[ \t]*<!-- demo:start -->[\s\S]*?<!-- demo:end -->[ \t]*\n?/g, '');
  if (stripped !== text) fs.writeFileSync(file, stripped.replace(/\n{3,}/g, '\n\n'));
}

// This script and what only it needs.
remove('.claude', 'skills', 'new-project');
remove('.claude', 'session-note.md');
remove('scripts', 'templates');
remove('scripts', 'init-project.test.mjs');
remove('scripts', 'init-project.mjs');

console.log(`${options.name} is set up.

Environments: ${[...options.environments.keys()].join(', ')} (default: ${defaultEnvironment})
Roles:        ${options.roles.join(', ')}

Next:
  1. Copy .env.example to .env and fill in the accounts.
  2. npm run doctor
  3. Complete PROJECT.md.`);
