import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base-page';

export class DashboardPage extends BasePage {
  protected readonly path = '/';

  readonly heading: Locator;
  readonly totalItems: Locator;
  readonly highPriorityItems: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Dashboard' });
    this.totalItems = page.getByTestId('total-items');
    this.highPriorityItems = page.getByTestId('high-priority-items');
  }
}
