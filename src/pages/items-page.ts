import type { Locator, Page } from '@playwright/test';
import type { Priority } from '../api/items-client';
import { BasePage } from './base-page';

export class ItemsPage extends BasePage {
  protected readonly path = '/items';

  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly prioritySelect: Locator;
  readonly addButton: Locator;
  readonly formError: Locator;
  readonly searchInput: Locator;
  readonly rows: Locator;
  readonly emptyMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Items' });
    this.nameInput = page.getByLabel('Name');
    this.prioritySelect = page.getByLabel('Priority');
    this.addButton = page.getByRole('button', { name: 'Add item' });
    this.formError = page.getByRole('alert');
    this.searchInput = page.getByRole('searchbox', { name: 'Search items' });
    this.rows = page.getByRole('row').filter({ has: page.getByRole('cell') });
    this.emptyMessage = page.getByText('No items match.');
  }

  /** The row of one item, by its exact name. */
  row(name: string): Locator {
    return this.rows.filter({ has: this.page.getByRole('cell', { name, exact: true }) });
  }

  async addItem(name: string, priority: Priority): Promise<void> {
    await this.nameInput.fill(name);
    await this.prioritySelect.selectOption(priority);
    await this.addButton.click();
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }

  async deleteItem(name: string): Promise<void> {
    await this.row(name)
      .getByRole('button', { name: `Delete ${name}` })
      .click();
  }
}
