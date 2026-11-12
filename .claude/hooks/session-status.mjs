// SessionStart: tells Claude where this checkout stands, so it can point at the next step.
import fs from 'node:fs';
import path from 'node:path';
import { isMain, root } from './lib.mjs';

/** What is worth knowing about a checkout before any work starts. */
export function status(directory) {
  const has = (...parts) => fs.existsSync(path.join(directory, ...parts));
  const read = (...parts) =>
    has(...parts) ? fs.readFileSync(path.join(directory, ...parts), 'utf8') : '';
  const lines = [];

  // A note the team leaves for every session, when there is something to say.
  const note = read('.claude', 'session-note.md').trim();
  if (note) lines.push(note);

  if (read('PROJECT.md').includes('<!--')) {
    lines.push(
      'PROJECT.md still has unanswered sections: ask for the missing facts before writing tests.',
    );
  }
  if (read('cases', 'inventory.csv').trim().split('\n').length <= 1) {
    lines.push('The case inventory is empty: /triage-cases turns the manual cases into it.');
  }
  if (!has('node_modules'))
    lines.push('Dependencies are not installed: /check-setup walks through it.');
  if (!has('.env')) {
    lines.push(
      '.env does not exist: the person copies .env.example to .env and fills it in themselves.',
    );
  }
  return lines;
}

if (isMain(import.meta)) {
  const lines = status(root);
  if (lines.length > 0) console.log(`Status of this checkout:\n- ${lines.join('\n- ')}`);
}
