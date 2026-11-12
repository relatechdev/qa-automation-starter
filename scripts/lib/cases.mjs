import { parseCsv } from './csv.mjs';

export const COLUMNS = ['id', 'area', 'title', 'automation', 'priority', 'source', 'notes'];
export const AUTOMATION = ['web', 'api', 'manual', 'blocked'];
export const PRIORITIES = ['P1', 'P2', 'P3'];

const CASE_ID = /^TC-\d{3,}$/;
const CASE_TAG = /@(TC-\d{3,})\b/g;

/** Reads the inventory. Returns its cases and everything wrong with the file. */
export function readInventory(text) {
  const [header = [], ...rows] = parseCsv(text);
  const problems = [];
  if (header.join(',') !== COLUMNS.join(',')) {
    problems.push(`The first line must be exactly: ${COLUMNS.join(',')}`);
    return { cases: [], problems };
  }

  const cases = [];
  const seen = new Set();
  rows.forEach((cells, index) => {
    const line = index + 2;
    const entry = Object.fromEntries(COLUMNS.map((column, i) => [column, (cells[i] ?? '').trim()]));
    if (!CASE_ID.test(entry.id))
      problems.push(`Line ${line}: "${entry.id}" is not an id like TC-001.`);
    else if (seen.has(entry.id)) problems.push(`Line ${line}: ${entry.id} appears twice.`);
    seen.add(entry.id);
    if (!entry.area) problems.push(`Line ${line}: ${entry.id} has no area.`);
    if (!entry.title) problems.push(`Line ${line}: ${entry.id} has no title.`);
    if (!AUTOMATION.includes(entry.automation)) {
      problems.push(
        `Line ${line}: ${entry.id} automation is "${entry.automation}"; use ${AUTOMATION.join(', ')}.`,
      );
    }
    if (!PRIORITIES.includes(entry.priority)) {
      problems.push(
        `Line ${line}: ${entry.id} priority is "${entry.priority}"; use ${PRIORITIES.join(', ')}.`,
      );
    }
    if (entry.automation === 'blocked' && !entry.notes) {
      problems.push(`Line ${line}: ${entry.id} is blocked; say in notes what it waits for.`);
    }
    cases.push(entry);
  });
  return { cases, problems };
}

/** The case ids a spec file is tagged with. */
export function caseTags(source) {
  return [...new Set([...source.matchAll(CASE_TAG)].map((match) => match[1]))];
}

/**
 * Compares the inventory with the tags found in the specs.
 * `tagged` maps a case id to the spec files that carry its tag.
 */
export function coverage(cases, tagged) {
  const known = new Map(cases.map((entry) => [entry.id, entry]));
  const problems = [];
  for (const [id, files] of tagged) {
    const entry = known.get(id);
    if (!entry)
      problems.push(`${id} is tagged in ${files.join(', ')} but is not in the inventory.`);
    else if (entry.automation === 'manual' || entry.automation === 'blocked') {
      problems.push(
        `${id} has a test in ${files.join(', ')} but the inventory says "${entry.automation}".`,
      );
    }
  }

  const toAutomate = cases.filter(
    (entry) => entry.automation === 'web' || entry.automation === 'api',
  );
  const automated = toAutomate.filter((entry) => tagged.has(entry.id));
  const remaining = toAutomate
    .filter((entry) => !tagged.has(entry.id))
    .sort((a, b) => a.priority.localeCompare(b.priority) || a.id.localeCompare(b.id));

  const areas = new Map();
  for (const entry of cases) {
    const area = areas.get(entry.area) ?? {
      area: entry.area,
      toAutomate: 0,
      automated: 0,
      manual: 0,
      blocked: 0,
    };
    if (entry.automation === 'manual') area.manual++;
    else if (entry.automation === 'blocked') area.blocked++;
    else {
      area.toAutomate++;
      if (tagged.has(entry.id)) area.automated++;
    }
    areas.set(entry.area, area);
  }

  return {
    problems,
    total: cases.length,
    toAutomate: toAutomate.length,
    automated: automated.length,
    manual: cases.filter((entry) => entry.automation === 'manual').length,
    blocked: cases.filter((entry) => entry.automation === 'blocked').length,
    remaining,
    areas: [...areas.values()],
  };
}
