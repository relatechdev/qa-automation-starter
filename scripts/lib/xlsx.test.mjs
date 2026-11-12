import assert from 'node:assert/strict';
import { test } from 'node:test';
import zlib from 'node:zlib';
import { readXlsx } from './xlsx.mjs';

/** A zip archive of the given files; `deflate` chooses which are compressed. */
function zip(files, deflate = () => true) {
  const locals = [];
  const directory = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const raw = Buffer.from(text);
    const data = deflate(name) ? zlib.deflateRawSync(raw) : raw;
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(deflate(name) ? 8 : 0, 8);
    header.writeUInt32LE(zlib.crc32(raw), 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(raw.length, 22);
    header.writeUInt16LE(Buffer.byteLength(name), 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    header.copy(entry, 10, 8, 30);
    entry.writeUInt32LE(offset, 42);
    locals.push(header, Buffer.from(name), data);
    directory.push(entry, Buffer.from(name));
    offset += 30 + Buffer.byteLength(name) + data.length;
  }
  const directorySize = directory.reduce((size, part) => size + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(directorySize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...directory, end]);
}

const WORKBOOK = {
  'xl/workbook.xml':
    '<workbook><sheets><sheet name="Smoke &amp; sanity" sheetId="1" r:id="rId1"/><sheet name="Notes" sheetId="2" r:id="rId2"/></sheets></workbook>',
  'xl/_rels/workbook.xml.rels':
    '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="/xl/worksheets/sheet2.xml"/></Relationships>',
  'xl/sharedStrings.xml':
    '<sst><si><t>Page</t></si><si><t>Test case</t></si><si><r><t>Verify </t></r><r><t xml:space="preserve">the &lt;total&gt;</t></r></si></sst>',
  'xl/worksheets/sheet1.xml':
    '<worksheet><sheetData>' +
    '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>' +
    '<row r="2"><c r="A2" s="3"/><c r="B2" t="s"><v>2</v></c><c r="C2"><v>4710</v></c><c r="D2" t="b"><v>1</v></c></row>' +
    '<row r="3"><c r="A3" s="3"/></row>' +
    '</sheetData></worksheet>',
  'xl/worksheets/sheet2.xml':
    '<worksheet><sheetData><row r="5"><c r="B5" t="inlineStr"><is><t>Typed in place</t></is></c></row></sheetData></worksheet>',
};

const EXPECTED = [
  {
    name: 'Smoke & sanity',
    rows: [
      { number: 1, cells: { A: 'Page', B: 'Test case' } },
      { number: 2, cells: { B: 'Verify the <total>', C: '4710', D: 'TRUE' } },
    ],
  },
  { name: 'Notes', rows: [{ number: 5, cells: { B: 'Typed in place' } }] },
];

test('reads the sheets of a compressed workbook, leaving out empty cells and rows', () => {
  assert.deepEqual(readXlsx(zip(WORKBOOK)), EXPECTED);
});

test('reads a workbook whose files are stored without compression', () => {
  assert.deepEqual(readXlsx(zip(WORKBOOK, () => false)), EXPECTED);
});

test('says so when the file is not a workbook', () => {
  assert.throws(
    () => readXlsx(Buffer.from('not a zip file at all, just some text')),
    /Not an \.xlsx file/,
  );
});
