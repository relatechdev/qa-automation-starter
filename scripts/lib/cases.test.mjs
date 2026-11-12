import assert from 'node:assert/strict';
import { test } from 'node:test';
import { caseTags, coverage, readInventory } from './cases.mjs';

const HEADER = 'id,area,title,automation,priority,source,notes';

test('reads a well-formed inventory without problems', () => {
  const { cases, problems } = readInventory(
    `${HEADER}\nTC-001,Sign-in,A wrong password is refused,web,P1,Sanity row 4,\nTC-002,Reports,The PDF looks right,manual,P3,,\n`,
  );

  assert.deepEqual(problems, []);
  assert.equal(cases.length, 2);
  assert.deepEqual(cases[0], {
    id: 'TC-001',
    area: 'Sign-in',
    title: 'A wrong password is refused',
    automation: 'web',
    priority: 'P1',
    source: 'Sanity row 4',
    notes: '',
  });
});

test('names everything wrong with an inventory', () => {
  const { problems } = readInventory(
    [
      HEADER,
      'TC-001,Sign-in,First,web,P1,,',
      'TC-001,Sign-in,Same id again,web,P1,,',
      'CASE-2,Sign-in,Odd id,web,P1,,',
      'TC-003,,No area,web,P1,,',
      'TC-004,Sign-in,,web,P1,,',
      'TC-005,Sign-in,Odd values,ui,high,,',
      'TC-006,Sign-in,Blocked without a reason,blocked,P2,,',
    ].join('\n'),
  );

  for (const expected of [
    /TC-001 appears twice/,
    /"CASE-2" is not an id/,
    /TC-003 has no area/,
    /TC-004 has no title/,
    /automation is "ui"/,
    /priority is "high"/,
    /TC-006 is blocked/,
  ]) {
    assert.ok(
      problems.some((problem) => expected.test(problem)),
      String(expected),
    );
  }
  assert.match(readInventory('id,title\nTC-001,x\n').problems[0], /first line must be exactly/);
});

test('finds the case tags of a spec', () => {
  const spec = `test('a', { tag: ['@TC-001', '@smoke'] }, async () => {});\ntest('b', { tag: '@TC-014' }, async () => {});\n// TC-999 without the @ is not a tag`;

  assert.deepEqual(caseTags(spec), ['TC-001', 'TC-014']);
});

test('reports what is automated, what remains and what disagrees', () => {
  const { cases } = readInventory(
    [
      HEADER,
      'TC-001,Sign-in,Automated,web,P2,,',
      'TC-002,Sign-in,Later,web,P3,,',
      'TC-003,Sign-in,Sooner,api,P1,,',
      'TC-004,Reports,By hand,manual,P3,,',
      'TC-005,Reports,Waiting,blocked,P2,,Needs a seeded report',
    ].join('\n'),
  );
  const tagged = new Map([
    ['TC-001', ['tests/web/sign-in.spec.ts']],
    ['TC-004', ['tests/web/reports.spec.ts']],
    ['TC-404', ['tests/web/reports.spec.ts']],
  ]);

  const result = coverage(cases, tagged);

  assert.deepEqual(
    {
      total: result.total,
      toAutomate: result.toAutomate,
      automated: result.automated,
      manual: result.manual,
      blocked: result.blocked,
    },
    { total: 5, toAutomate: 3, automated: 1, manual: 1, blocked: 1 },
  );
  assert.deepEqual(
    result.remaining.map((entry) => entry.id),
    ['TC-003', 'TC-002'],
  );
  assert.deepEqual(result.areas, [
    { area: 'Sign-in', toAutomate: 3, automated: 1, manual: 0, blocked: 0 },
    { area: 'Reports', toAutomate: 0, automated: 0, manual: 1, blocked: 1 },
  ]);
  assert.equal(result.problems.length, 2);
  assert.match(result.problems.join('\n'), /TC-004 has a test .* but the inventory says "manual"/);
  assert.match(result.problems.join('\n'), /TC-404 is tagged .* but is not in the inventory/);
});
