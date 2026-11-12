// Shows how much of the case inventory is automated, and what to automate next.
// Usage: npm run cases            the report
//        npm run cases -- --check also fail when the inventory and the specs disagree
import fs from 'node:fs';
import path from 'node:path';
import { caseTags, coverage, readInventory } from './lib/cases.mjs';

const root = path.resolve(import.meta.dirname, '..');
const inventoryFile = path.join(root, 'cases', 'inventory.csv');
const check = process.argv.includes('--check');

function specFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return specFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

if (!fs.existsSync(inventoryFile)) {
  console.error('cases/inventory.csv does not exist. Create it with /triage-cases.');
  process.exit(1);
}

const { cases, problems } = readInventory(fs.readFileSync(inventoryFile, 'utf8'));

const tagged = new Map();
for (const file of specFiles(path.join(root, 'tests'))) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  for (const id of caseTags(fs.readFileSync(file, 'utf8'))) {
    tagged.set(id, [...(tagged.get(id) ?? []), relative]);
  }
}

const result = coverage(cases, tagged);
const allProblems = [...problems, ...result.problems];
const percent = result.toAutomate ? Math.round((result.automated / result.toAutomate) * 100) : 0;

console.log(
  `Cases: ${result.total}   automated: ${result.automated} of ${result.toAutomate} (${percent}%)` +
    `   manual: ${result.manual}   blocked: ${result.blocked}\n`,
);

if (result.areas.length > 0) {
  const width = Math.max(4, ...result.areas.map((area) => area.area.length));
  console.log(`${'Area'.padEnd(width)}  To automate  Automated  Manual  Blocked`);
  for (const area of result.areas) {
    console.log(
      `${area.area.padEnd(width)}  ${String(area.toAutomate).padStart(11)}  ${String(area.automated).padStart(9)}` +
        `  ${String(area.manual).padStart(6)}  ${String(area.blocked).padStart(7)}`,
    );
  }
}

if (result.remaining.length > 0) {
  console.log('\nNext to automate:');
  for (const entry of result.remaining.slice(0, 15)) {
    console.log(
      `  ${entry.id}  ${entry.priority}  ${entry.automation.padEnd(3)}  ${entry.area}: ${entry.title}`,
    );
  }
  if (result.remaining.length > 15) console.log(`  … and ${result.remaining.length - 15} more`);
}

if (allProblems.length > 0) {
  console.log('\nProblems:');
  for (const problem of allProblems) console.log(`  ✗ ${problem}`);
  if (check) process.exit(1);
}
