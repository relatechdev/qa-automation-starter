// Reads the text of an .xlsx workbook without any dependency: enough to turn a sheet of
// manual test cases into rows. Numbers come back as stored, so dates show as serial numbers.
import zlib from 'node:zlib';

const END_OF_DIRECTORY = 0x06054b50;
const DIRECTORY_ENTRY = 0x02014b50;

/** The files inside a zip archive, by name. */
function unzip(buffer) {
  let end = buffer.length - 22;
  while (end >= 0 && buffer.readUInt32LE(end) !== END_OF_DIRECTORY) end--;
  if (end < 0) throw new Error('Not an .xlsx file: no zip directory found.');

  const files = new Map();
  let offset = buffer.readUInt32LE(end + 16);
  for (let i = 0; i < buffer.readUInt16LE(end + 10); i++) {
    if (buffer.readUInt32LE(offset) !== DIRECTORY_ENTRY)
      throw new Error('The zip directory is damaged.');
    const method = buffer.readUInt16LE(offset + 10);
    const size = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const header = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);

    const start = header + 30 + buffer.readUInt16LE(header + 26) + buffer.readUInt16LE(header + 28);
    const data = buffer.subarray(start, start + size);
    files.set(name, method === 0 ? data : zlib.inflateRawSync(data));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(xml) {
  return xml.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, code) => {
    if (code[0] !== '#') return ENTITIES[code] ?? whole;
    const point =
      code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return String.fromCodePoint(point);
  });
}

function attribute(tag, name) {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];
}

/** The text of a string item: every run of it, without the phonetic hints. */
function textOf(xml) {
  const runs = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '').matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g);
  return decode([...runs].map((run) => run[1]).join(''));
}

/** The text a cell shows, from its type and what the sheet stores for it. */
function cellText(type, body, stored, strings) {
  if (type === 'inlineStr') return textOf(body);
  if (stored === undefined) return '';
  if (type === 's') return strings[Number(stored)] ?? '';
  if (type === 'b') return stored === '1' ? 'TRUE' : 'FALSE';
  return decode(stored);
}

/**
 * The sheets of a workbook, in order: `{ name, rows }`, where a row is
 * `{ number, cells }` and `cells` maps a column letter to its text. Empty cells are left out.
 */
export function readXlsx(buffer) {
  const files = unzip(buffer);
  const xml = (name) => files.get(name)?.toString('utf8') ?? '';

  const strings = [...xml('xl/sharedStrings.xml').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map(
    (item) => textOf(item[1]),
  );
  const targets = new Map(
    [...xml('xl/_rels/workbook.xml.rels').matchAll(/<Relationship\b[^>]*>/g)].map((tag) => [
      attribute(tag[0], 'Id'),
      attribute(tag[0], 'Target'),
    ]),
  );

  return [...xml('xl/workbook.xml').matchAll(/<sheet\b[^>]*>/g)].map((tag) => {
    const target = targets.get(attribute(tag[0], 'r:id')) ?? '';
    const sheet = xml(target.startsWith('/') ? target.slice(1) : `xl/${target}`);

    const rows = [];
    for (const row of sheet.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
      const cells = {};
      for (const cell of row[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const column = (attribute(cell[1], 'r') ?? '').replace(/\d+/g, '');
        const type = attribute(cell[1], 't');
        const stored = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(cell[2] ?? '')?.[1];
        const value = cellText(type, cell[2] ?? '', stored, strings);
        if (value.trim() !== '') cells[column] = value;
      }
      if (Object.keys(cells).length > 0)
        rows.push({ number: Number(attribute(row[1], 'r')), cells });
    }
    return { name: decode(attribute(tag[0], 'name') ?? ''), rows };
  });
}
