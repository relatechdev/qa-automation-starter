# 05 Writing tests

## A whole test

```ts
import { expect, test } from '@/fixtures/test';
import { uniqueName } from '@/helpers/test-data';

test.describe('Invoices: search', () => {
  test(
    'search narrows the list to the invoices that match',
    { tag: ['@TC-031'] },
    async ({ app, api, cleanup }) => {
      // prepare: data that only this test uses, created through the API
      const customer = uniqueName('customer');
      const invoice = await api.invoices.create({ customer, amount: 120 });
      cleanup.add(() => api.invoices.delete(invoice.id));

      // act: what a person does
      await app.invoices.open();
      await app.invoices.search(customer);

      // assert: what the case says must be true
      await expect(app.invoices.rows).toHaveCount(1);
      await expect(app.invoices.row(customer)).toContainText('120.00');
    },
  );
});
```

What to notice:

- `test` and `expect` come from `@/fixtures/test`. That is where `app` (the page objects), `api` (the API clients) and `cleanup` come from.
- The title says the behaviour in plain words. Someone reading only the report must understand what broke.
- The tag is the case's id from `cases/inventory.csv`.
- The test creates its own invoice. It would pass on an empty environment and on one with a million invoices.
- No locator, no URL, no account in the spec.

## Finding elements

A locator describes an element the way a person would: "the button named Save". Take it from the real page, never from a guess. In order of preference:

| Use | Example | When |
|---|---|---|
| Role and name | `page.getByRole('button', { name: 'Save' })` | almost always: buttons, links, headings, fields, rows |
| Label, placeholder, text | `page.getByLabel('Email')`, `page.getByText('No results')` | form fields, messages |
| Test id | `page.getByTestId('total-items')` | what has no name of its own: a number in a tile, a chart, an icon |
| CSS | `page.locator('.legend-item')` | last resort, with a comment why, and a request to the developers for a test id |

Never XPath, never `div > div:nth-child(3)`, never a generated class like `.css-1x2y3z`: they break with every change of the page.

Three ways to see what a page offers:

- **Pick locator** in UI mode (`npm run test:ui`) or in the VS Code extension: click an element, get its best locator.
- **Record:** `npx playwright codegen --load-storage=.auth/<environment>-<role>.json <address>` opens a signed-in browser and writes code as you click. Use the locators; do not keep the recorded script as a test.
- **Ask Claude to look:** it opens the page with `npx playwright cli` and reads the page's structure.

Locators belong in a page object (`src/pages/`), so a changed button is fixed in one place:

```ts
export class InvoicesPage extends BasePage {
  protected readonly path = '/invoices';

  readonly searchInput: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByRole('searchbox', { name: 'Search invoices' });
    this.rows = page.getByRole('row').filter({ has: page.getByRole('cell') });
  }

  row(customer: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('cell', { name: customer, exact: true }) });
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }
}
```

A page object has locators and actions. It has no assertions: what is checked stays visible in the test.

## Waiting

Playwright waits by itself. `click` waits until the element is there and can be clicked; `expect(locator).toHaveText(…)` keeps looking until the text is right or the time is up. So:

```ts
// wrong: guesses how long the search takes; too short on a slow day, wasted time on a fast one
await page.waitForTimeout(3000);
expect(await app.invoices.rows.count()).toBe(1);

// right: waits exactly as long as needed
await expect(app.invoices.rows).toHaveCount(1);
```

- Never `waitForTimeout`, never `networkidle`. Lint refuses both.
- Never read a value first and assert on it after (`isVisible()`, `count()`, `textContent()`): that reads once, without waiting. Assert on the locator.
- Every action and every assertion needs `await`. A missing one is the most common cause of a flaky test, and lint catches it.
- When an action ends without any sign on the screen, wait for its network call: start `page.waitForResponse(…)` before the click and await it after.

## Asserting

- Assert what the case states, exactly: `toHaveText('Wrong email or password.')`, not "some error is visible".
- One behaviour per test. Several assertions are fine when together they describe that one behaviour.
- An assertion must be able to fail. `toBeTruthy()` on a locator, or a count that is "at least zero", checks nothing.
- No `if` around a step so the test passes both ways, no `try`/`catch` to step over a failure.

## Data

- Name everything with `uniqueName('<label>')`, and register the undo on the next line with `cleanup.add(...)`.
- Prepare through the API when there is a client: it is faster and does not break when a form changes. Click through the UI only for what the test is about.
- Never assert on a total of shared data ("the list has 12 rows"). Narrow to your own data, then count.
- Never rely on a record someone else can change, even one that "is always there".
- Tests run in parallel and in any order. A test that needs another to run first is two tests that are both wrong.

## Tags

| Tag | Meaning |
|---|---|
| `@TC-031` | the case this test covers; every test has one |
| `@smoke` | part of the short set that proves the application is up |
| `@readonly` | changes nothing, so it may run on production |

## Longer flows

`test.step` names the stages, and the report shows them:

```ts
await test.step('an invoice is sent to the customer', async () => {
  await app.invoice.send();
  await expect(app.invoice.status).toHaveText('Sent');
});
```

The same check with different inputs is a loop over a table, each with its own title:

```ts
for (const { title, body, error } of [
  { title: 'no customer', body: { amount: 120 }, error: 'Customer is required.' },
  {
    title: 'a negative amount',
    body: { customer: 'x', amount: -1 },
    error: 'Amount must be positive.',
  },
]) {
  test(`an invoice with ${title} is refused`, { tag: '@TC-034' }, async ({ api }) => {
    const response = await api.invoices.createResponse(body);
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ error });
  });
}
```

## When the application is wrong

A test that fails because the product has a defect has done its job. Do not change the expectation to match the defect. Report the bug, then mark the test:

```ts
test.fail(true, 'BUG-482: the total stays 0 after the first invoice');
```

The run stays green while the bug is open, and turns red the day it is fixed, which tells you to remove the line.

## Before a test is done

1. It passes.
2. You have seen it fail: change the expected value, run, read the failure, change it back. A test nobody has seen fail may be checking nothing.
3. It passes five times in a row: `npx playwright test <file> --repeat-each=5`.
4. `npm run check` passes.

## Debugging

| Tool | Command | Good for |
|---|---|---|
| UI mode | `npm run test:ui` | watching a test step by step, with the page at every step |
| The trace of a failure | `npm run report`, then click the trace | what was on the screen when it failed, which call returned what |
| Headed | `npm run test:headed` | seeing it happen |
| The inspector | `npm run test:debug` | stopping before each step and trying locators |
| Claude | `/fix-test <file>` | finding the cause and saying whose fault it is: the test, the data, the environment or the application |
