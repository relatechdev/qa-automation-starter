// Prints a spreadsheet of manual test cases as plain rows, ready to be read and triaged.
// Usage: npm run sheet -- <file.xlsx|file.csv> [--sheet "<name>"] [--columns A,B,C]
import fs from 'node:fs';
import path from 'node:path';
import { parseCsv } from './lib/csv.mjs';
import { readXlsx } from './lib/xlsx.mjs';

const USAGE = 'Usage: npm run sheet -- <file.xlsx|file.csv> [--sheet "<name>"] [--columns A,B,C]';

const options = {};
const positional = [];
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--sheet' || args[i] === '--columns') options[args[i].slice(2)] = args[++i];
  else positional.push(args[i]);
}
const [file] = positional;
const only = options.sheet ?? null;
const columns = options.columns?.split(',').map((column) => column.trim().toUpperCase()) ?? null;

if (!file) {
  console.error(USAGE);
  process.exit(1);
}

function columnLetter(index) {
  let letters = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  }
  return letters;
}

function csvSheet(text) {
  const rows = parseCsv(text).map((cells, index) => ({
    number: index + 1,
    cells: Object.fromEntries(
      cells.map((cell, i) => [columnLetter(i), cell]).filter(([, cell]) => cell.trim() !== ''),
    ),
  }));
  return [{ name: path.basename(file), rows }];
}

const sheets = file.toLowerCase().endsWith('.csv')
  ? csvSheet(fs.readFileSync(file, 'utf8'))
  : readXlsx(fs.readFileSync(file));

const chosen = only ? sheets.filter((sheet) => sheet.name === only) : sheets;
if (chosen.length === 0) {
  console.error(
    `No sheet named "${only}". Sheets: ${sheets.map((sheet) => sheet.name).join(', ')}`,
  );
  process.exit(1);
}

for (const sheet of chosen) {
  console.log(`\n# Sheet: ${sheet.name} (${sheet.rows.length} rows)`);
  for (const row of sheet.rows) {
    const cells = Object.entries(row.cells)
      .filter(([column]) => !columns || columns.includes(column))
      .map(([column, value]) => `${column}: ${value.trim().replace(/\s*\r?\n\s*/g, ' ⏎ ')}`);
    if (cells.length > 0) console.log(`${row.number} | ${cells.join(' | ')}`);
  }
}
