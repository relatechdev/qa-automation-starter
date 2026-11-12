// Prints what it reads, without passwords, tokens, cookies or keys. For the output of the
// commands that can show them, such as a trace's requests or the browser's cookies:
//   npx playwright trace request 12 2>&1 | node scripts/redact.mjs
import fs from 'node:fs';
import path from 'node:path';
import { redact, secretsOfDotenv } from './lib/redact.mjs';

const dotenv = path.join(path.resolve(import.meta.dirname, '..'), '.env');
const known = fs.existsSync(dotenv) ? secretsOfDotenv(fs.readFileSync(dotenv, 'utf8')) : [];

let input = '';
for await (const chunk of process.stdin) input += chunk;
process.stdout.write(redact(input, known));
