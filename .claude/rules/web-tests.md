---
paths:
  - 'tests/web/**/*.ts'
---

# Browser tests

## Shape of a spec

```ts
import { expect, test } from '@/fixtures/test';
import { uniqueName } from '@/helpers/test-data';

test.describe('Invoices: search', () => {
  test(
    'search narrows the list to the invoices that match',
    { tag: ['@TC-031'] },
    async ({ app, api, cleanup }) => {
      const customer = uniqueName('customer');

      await test.step('an invoice exists for a customer only this test uses', async () => {
        const invoice = await api.invoices.create({ customer, amount: 120 });
        cleanup.add(() => api.invoices.delete(invoice.id));
      });

      await app.invoices.open();
      await app.invoices.search(customer);

      await expect(app.invoices.rows).toHaveCount(1);
      await expect(app.invoices.row(customer)).toContainText('120.00');
    },
  );
});
```

- A file per feature of an area: `tests/web/<area>/<area>-<feature>.spec.ts`. One `test.describe` per file, named `<Area>: <feature>`.
- `test` and `expect` come from `@/fixtures/test`, never from `@playwright/test`.
- A test reads as prepare, act, assert, with a blank line between the parts. `test.step` names the stages of a longer flow, in words a report reader understands.

## Titles and tags

- The title states the behaviour in plain words: `a wrong password is refused with a message`. Not `test login 2`, not `verify that…`.
- A title stays as it is once merged. A renamed test starts a new history in the reports.
- Every test carries the tag of its case, `@TC-031`; a test that covers two cases carries both.
- `@smoke` marks the few tests that show the application is up and its main paths work. Keep the set under a few minutes.
- `@readonly` marks a test that changes nothing, so it may run on production (`.claude/rules/security.md`).

## What a test may rely on

- Only on what it creates itself. Not on another test, not on the order of tests, not on data a person or another run can change.
- Never on a total of a shared list (`toHaveCount(12)` on all invoices). Narrow the list to the test's own data first, then count.
- Prepare through the API when a client exists: faster and steadier than clicking. Use the UI for preparation only when it is the thing under test or no API exists.
- The default role is `user`. `test.use({ role: 'admin' })` changes it for a file or a describe; `role: 'anonymous'` starts signed out.
- A test that ends or changes its session (signs out, changes a password, switches a tenant) signs in for itself as `anonymous` first. Ending the shared session breaks every test running next to it.

## Asserting and waiting

- Assert on locators with web-first assertions: `await expect(locator).toBeVisible()`, `toHaveText`, `toHaveCount`, `toHaveURL`. They wait by themselves.
- Never a fixed wait, never `networkidle`, never `isVisible()` turned into a boolean. When an action finishes without a visible sign, wait for its response: `page.waitForResponse(...)` started before the click.
- Assert what the case states, with the exact text when the text is the point. An assertion that cannot fail (`toBeTruthy()` on a locator, a count `>= 0`) is not one.
- No `if` around an action to make a test pass both ways, no `try`/`catch` around a step, no `force: true`.

## When the application is wrong

A test that fails because the application has a defect stays as the case states it. Report the defect, then mark the test so the run stays green and tells when the fix arrives:

```ts
test.fail(true, 'BUG-482: the total stays 0 after the first invoice');
```

## Before a test counts as written

1. It passes: `npx playwright test <file> --project=web`.
2. It has failed once on purpose: break the expectation or the precondition, see red, restore.
3. It passes five times in a row: `--repeat-each=5`.
4. `npm run cases -- --check` agrees with its tag.
