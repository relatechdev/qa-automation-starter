/** Reads CSV text into rows of strings: quoted fields, doubled quotes and line breaks inside quotes. */
export function parseCsv(text) {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char !== '"') field += char;
      else if (source[i + 1] === '"') field += source[++i];
      else quoted = false;
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

/** Writes rows of strings as CSV text, quoting only the fields that need it. */
export function toCsv(rows) {
  const quote = (value) => (/[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value);
  return (
    rows.map((row) => row.map((cell) => quote(String(cell ?? ''))).join(',')).join('\n') + '\n'
  );
}
