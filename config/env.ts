import fs from 'node:fs';
import path from 'node:path';

/**
 * The environment a run targets. `TEST_ENV` names a file in `config/environments/`;
 * accounts come from `.env` on a machine and from the pipeline's secret in CI.
 */

export interface Account {
  email: string;
  password: string;
}

interface EnvironmentFile {
  /** Where the application lives. Tests navigate with paths relative to it. */
  baseUrl: string;
  /** Root of the API, when it differs from `baseUrl`. */
  apiUrl: string;
  /** The roles tests sign in as. Each needs an account in `.env`. */
  roles: string[];
  /** Tests may only look, never create, change or delete. Production is always read-only. */
  readOnly: boolean;
}

const root = path.resolve(__dirname, '..');

const dotenv = path.join(root, '.env');
if (fs.existsSync(dotenv)) process.loadEnvFile(dotenv);

function fail(message: string): never {
  throw new Error(`${message}\nRun "npm run doctor" to see everything that is missing.`);
}

function envKey(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function readEnvironment(name: string): EnvironmentFile {
  const directory = path.join(root, 'config', 'environments');
  const file = path.join(directory, `${name}.json`);
  if (!fs.existsSync(file)) {
    const known = fs
      .readdirSync(directory)
      .map((entry) => path.basename(entry, '.json'))
      .join(', ');
    fail(
      `TEST_ENV is "${name}", but config/environments/${name}.json does not exist. Known: ${known}.`,
    );
  }
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<EnvironmentFile>;
  if (!parsed.baseUrl) fail(`config/environments/${name}.json has no baseUrl.`);
  const baseUrl = parsed.baseUrl.replace(/\/+$/, '');
  return {
    baseUrl,
    apiUrl: parsed.apiUrl ? parsed.apiUrl.replace(/\/+$/, '') : baseUrl,
    roles: parsed.roles?.length ? parsed.roles : ['user'],
    readOnly: parsed.readOnly ?? false,
  };
}

const name =
  process.env.TEST_ENV ||
  fail('TEST_ENV is not set. Copy .env.example to .env and choose an environment.');

export const env = {
  name,
  ...readEnvironment(name),

  /** The account of a role, from `<ENV>_<ROLE>_EMAIL` and `<ENV>_<ROLE>_PASSWORD`. */
  account(role: string): Account {
    const key = `${envKey(name)}_${envKey(role)}`;
    const email = process.env[`${key}_EMAIL`];
    const password = process.env[`${key}_PASSWORD`];
    if (!email || !password) fail(`${key}_EMAIL or ${key}_PASSWORD is missing in .env.`);
    return { email, password };
  },

  /** Where a role's signed-in browser state is kept between runs. */
  authFile(role: string): string {
    return path.join(root, '.auth', `${name}-${role}.json`);
  },
};
