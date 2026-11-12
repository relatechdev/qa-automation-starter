import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const root = path.resolve(import.meta.dirname, '..', '..');

/** The event Claude Code sends a hook, read from standard input. */
export async function readEvent() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Answers a PreToolUse event: `deny` stops the call, `ask` puts it in front of the person. */
export function decide(decision, reason) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    }),
  );
}

/** The parts of a shell command line that run one after another. */
export function segments(command) {
  return command
    .split(/&&|\|\||[;|\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** True when the file is run as a script, false when a test imports it. */
export function isMain(meta) {
  return process.argv[1] !== undefined && meta.url === pathToFileURL(process.argv[1]).href;
}
