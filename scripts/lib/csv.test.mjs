import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsv, toCsv } from './csv.mjs';

test('reads quoted fields, doubled quotes and line breaks inside quotes', () => {
  const text =
    'id,title\r\nTC-001,"Shows ""No items"", then stops"\nTC-002,"first line\nsecond line"\n\n';

  assert.deepEqual(parseCsv(text), [
    ['id', 'title'],
    ['TC-001', 'Shows "No items", then stops'],
    ['TC-002', 'first line\nsecond line'],
  ]);
});

test('ignores the byte order mark Excel puts first', () => {
  assert.deepEqual(parseCsv(`${String.fromCharCode(0xfeff)}id,area\n`), [['id', 'area']]);
});

test('what it writes, it reads back', () => {
  const rows = [
    ['id', 'title'],
    ['TC-001', 'a, b and "c"'],
    ['TC-002', 'two\nlines'],
  ];

  assert.deepEqual(parseCsv(toCsv(rows)), rows);
});
