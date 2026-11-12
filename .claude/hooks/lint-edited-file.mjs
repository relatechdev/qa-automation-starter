// PostToolUse (Edit, Write): formats the file Claude just changed and lints it, so a
// forbidden pattern (a fixed wait, a focused test, a missing await) is fixed at once.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { isMain, readEvent, root } from './lib.mjs';

const FORMATTED = /\.(ts|mjs|js|json|ya?ml)$/;
const LINTED = /\.(ts|mjs|js)$/;
const SKIPPED =
  /^(node_modules|test-results|playwright-report|\.auth|\.claude\/skills\/playwright-)|package-lock\.json$/;

function run(script, args) {
  return spawnSync(process.execPath, [path.join(root, 'node_modules', script), ...args], {
    cwd: root,
    encoding: 'utf8',
  });
}

if (isMain(import.meta)) {
  const event = await readEvent();
  const file = event.tool_input?.file_path ?? '';
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const outside = !file || relative.startsWith('..') || path.isAbsolute(relative);

  if (
    !outside &&
    !SKIPPED.test(relative) &&
    fs.existsSync(file) &&
    fs.existsSync(path.join(root, 'node_modules', 'eslint'))
  ) {
    if (FORMATTED.test(relative))
      run('prettier/bin/prettier.cjs', ['--write', '--log-level', 'silent', file]);
    if (LINTED.test(relative)) {
      const lint = run('eslint/bin/eslint.js', ['--no-warn-ignored', '--max-warnings', '0', file]);
      if (lint.status !== 0) {
        console.error(
          `ESLint found problems in ${relative}. Fix them before going on:\n${lint.stdout}${lint.stderr}`,
        );
        process.exit(2);
      }
    }
  }
}
