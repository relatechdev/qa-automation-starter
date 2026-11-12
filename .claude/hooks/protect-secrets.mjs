// PreToolUse: keeps Claude away from the files that hold passwords and signed-in sessions.
// .env and .auth/ are for the person and for the test run. A hook is a guard, not a vault:
// the real protection is that these files never leave the machine.
import { decide, isMain, readEvent, segments } from './lib.mjs';

const ENV_FILE = /(^|[\s"'=/(<>:])\.env(\.[\w.-]+)?(?=$|[\s"';)|&<>:])/g;
const AUTH_FOLDER = /(^|[\s"'=/(<>:])\.auth(?=$|[\s"'/;)|&<>:])/;

const REASON_ENV =
  '.env holds passwords, so Claude does not open it. Ask the person to edit it themselves; ' +
  '"npm run doctor" shows which keys are missing without showing their values.';
const REASON_AUTH =
  '.auth/ holds signed-in sessions, so Claude does not open it. Pass a file of it to Playwright ' +
  '(for example "npx playwright cli state-load <file>"), or run "npm run auth" to renew it.';

function mentionsEnvFile(text) {
  return [...text.matchAll(ENV_FILE)].some((match) => match[2] !== '.example');
}

function isSecretPath(file) {
  const normalized = file.replaceAll('\\', '/');
  if (mentionsEnvFile(` ${normalized.split('/').pop()} `)) return REASON_ENV;
  return /(^|\/)\.auth(\/|$)/.test(normalized) ? REASON_AUTH : null;
}

// What a command may do with these files without showing what is in them.
const ENV_ALLOWED =
  /^(ls|test|\[|git (check-ignore|ls-files|status)|cp (-n )?\.env\.example \.env$)/;
const AUTH_ALLOWED =
  /^(ls|test|\[|mkdir|rm|npx (--no-install )?playwright|playwright-cli|npm run)\b/;

function checkCommand(command) {
  for (const segment of segments(command)) {
    if (mentionsEnvFile(segment) && !ENV_ALLOWED.test(segment)) return REASON_ENV;
    if (AUTH_FOLDER.test(segment) && !AUTH_ALLOWED.test(segment)) return REASON_AUTH;
  }
  return null;
}

/** Why a tool call is refused, or null when it may go ahead. */
export function refusal(event) {
  const input = event.tool_input ?? {};
  if (event.tool_name === 'Bash') return checkCommand(input.command ?? '');
  if (event.tool_name === 'Grep')
    return isSecretPath(input.path ?? '') ?? isSecretPath(input.glob ?? '');
  return isSecretPath(input.file_path ?? input.notebook_path ?? '');
}

if (isMain(import.meta)) {
  const reason = refusal(await readEvent());
  if (reason) decide('deny', reason);
}
