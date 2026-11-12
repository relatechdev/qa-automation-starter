---
paths:
  - 'src/pages/**/*.ts'
---

# Page objects

A page object says where things are on a page and what a person can do there. It holds no assertions and prepares no data.

## Shape

```ts
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base-page';

export class InvoicesPage extends BasePage {
  protected readonly path = '/invoices';

  readonly searchInput: Locator;
  readonly rows: Locator;
  readonly newInvoiceButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByRole('searchbox', { name: 'Search invoices' });
    this.rows = page.getByRole('row').filter({ has: page.getByRole('cell') });
    this.newInvoiceButton = page.getByRole('button', { name: 'New invoice' });
  }

  /** The row of one customer, by the exact name. */
  row(customer: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('cell', { name: customer, exact: true }) });
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }
}
```

- One class per page: `src/pages/<name>-page.ts`, class `<Name>Page`, extending `BasePage` with its `path`. What repeats across pages (a navigation bar, a dialog, a date picker) is a class in `src/pages/components/`.
- Every page object is registered in `App` (`src/pages/app.ts`), so a test reaches it as `app.<name>`.
- Locators are `readonly` fields set in the constructor. A locator that depends on a value is a method returning a `Locator`.
- Names say what the element is: `emailInput`, `saveButton`, `rows`, `emptyMessage`, `deleteDialog`.
- Actions are methods named as a person would say it: `signIn`, `addItem`, `search`. An action that only finishes later waits for its own end (`await this.dialog.waitFor({ state: 'hidden' })`), so the next line of the test can rely on it.
- No `expect` in a page object (ESLint refuses it), no API calls, no test data.

## Locators

Take every locator from the live application (`npx playwright cli`, then `snapshot`), never from memory or from how the page probably looks. In this order:

1. **Role and name:** `getByRole('button', { name: 'Save' })`. What a person and a screen reader see.
2. **Label, placeholder or text:** `getByLabel('Email')`, `getByPlaceholder('Search')`, `getByText('No results')`.
3. **Test id:** `getByTestId('total-items')`, for what has no role or text of its own, such as a number in a tile or a chart.
4. **CSS, as the last resort:** short, inside a locator of the kinds above, with a comment saying why nothing better exists. Ask the developers for a test id and note the request in `PROJECT.md`.

Never XPath, never a chain of `nth-child`, never a generated class name (`.css-1x2y3z`), never a locator that depends on the order of unrelated elements. `first()` and `nth()` are for lists where the position is the meaning.

Narrow instead of guessing: `rows.filter({ hasText: name })`, `dialog.getByRole('button', { name: 'Delete' })`. `exact: true` when one name is the start of another.
