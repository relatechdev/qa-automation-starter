import type { Page } from '@playwright/test';

/** What every page object shares. Page objects hold locators and actions; specs hold the assertions. */
export abstract class BasePage {
  /** Path of the page, relative to the environment's base URL. */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }
}
