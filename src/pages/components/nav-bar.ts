import type { Locator, Page } from '@playwright/test';

/** The navigation every signed-in page shows. */
export class NavBar {
  readonly dashboardLink: Locator;
  readonly itemsLink: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    const nav = page.getByRole('navigation', { name: 'Main' });
    this.dashboardLink = nav.getByRole('link', { name: 'Dashboard' });
    this.itemsLink = nav.getByRole('link', { name: 'Items' });
    this.signOutButton = page.getByRole('button', { name: 'Sign out' });
  }
}
