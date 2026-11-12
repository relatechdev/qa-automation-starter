// Fails when a file git would commit holds a secret: a token, a key, a webhook, a .env.
// Part of "npm run check". It names the file, the line and the kind, never the value.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { findSecrets, isSecretFile } from './lib/secrets.mjs';

const root = path.resolve(import.meta.dirname, '..');

let files;
try {
  files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean);
} catch {
  console.error('The secret scan needs git: run it inside the repository.');
  process.exit(1);
}

const problems = [];
for (const file of files) {
  if (isSecretFile(file)) {
    problems.push(`${file}: holds secrets by its name, and must stay out of git`);
    continue;
  }
  const full = path.join(root, file);
  const stat = fs.lstatSync(full, { throwIfNoEntry: false });
  if (!stat?.isFile() || stat.size > 2_000_000) continue;
  const content = fs.readFileSync(full);
  if (content.subarray(0, 8000).includes(0)) continue;
  for (const { line, kind } of findSecrets(content.toString('utf8'))) {
    problems.push(`${file}:${line}: looks like ${kind}`);
  }
}

if (problems.length > 0) {
  console.error(`Secrets found in files git would commit:\n  ${problems.join('\n  ')}`);
  console.error(
    '\nMove each into .env (or the pipeline secret), and change it if it was ever pushed.',
  );
  process.exit(1);
}
console.log(`No secrets found in ${files.length} files.`);
