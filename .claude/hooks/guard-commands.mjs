// PreToolUse (Bash): puts two kinds of command in front of the person before they run:
// a test run against a read-only environment, and a push that skips the pull request.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { decide, isMain, readEvent, root, segments } from './lib.mjs';

const TEST_RUN = /\b(playwright\s+test|npm\s+(run\s+)?(test|auth)\b)/;

function environmentOf(command, cwd) {
  const inline = /\bTEST_ENV=["']?([\w-]+)/.exec(command)?.[1];
  if (inline) return inline;
  if (process.env.TEST_ENV) return process.env.TEST_ENV;
  try {
    const dotenv = fs.readFileSync(path.join(cwd, '.env'), 'utf8');
    return /^\s*TEST_ENV\s*=\s*["']?([\w-]+)/m.exec(dotenv)?.[1] ?? null;
  } catch {
    return null;
  }
}

function isReadOnly(name, cwd) {
  try {
    const file = path.join(cwd, 'config', 'environments', `${name}.json`);
    return JSON.parse(fs.readFileSync(file, 'utf8')).readOnly === true;
  } catch {
    return false;
  }
}

function currentBranch(cwd) {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

/** Why a command needs the person's confirmation, or null when it does not. */
export function question(command, { cwd = root, branch = currentBranch } = {}) {
  for (const segment of segments(command)) {
    if (TEST_RUN.test(segment)) {
      const name = environmentOf(segment, cwd);
      if (name && isReadOnly(name, cwd)) {
        return (
          `This runs tests against "${name}", a read-only environment. Only tests tagged @readonly ` +
          'run there and nothing is recorded. Confirm that this run is meant.'
        );
      }
    }

    const push = /^git\s+push\b(.*)$/.exec(segment);
    if (!push) continue;
    const args = push[1].split(/\s+/).filter(Boolean);
    if (args.some((arg) => arg === '-f' || arg.startsWith('--force'))) {
      return 'A forced push rewrites the branch on the server and can drop a colleague’s commits.';
    }
    const targets = args.filter((arg) => !arg.startsWith('-')).slice(1);
    const toMain =
      targets.length > 0
        ? targets.some((target) => /^(.*:)?(refs\/heads\/)?(main|master)$/.test(target))
        : /^(main|master)$/.test(branch(cwd));
    if (toMain) {
      return 'This pushes straight to the main branch. The usual way is a branch and a pull request.';
    }
  }
  return null;
}

if (isMain(import.meta)) {
  const event = await readEvent();
  const reason = question(event.tool_input?.command ?? '', { cwd: event.cwd ?? root });
  if (reason) decide('ask', reason);
}
