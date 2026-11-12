import { expect, test } from '@/fixtures/test';

test.describe('Navigation', () => {
  test(
    'the dashboard opens with its totals',
    { tag: ['@TC-001', '@smoke', '@readonly'] },
    async ({ app }) => {
      await app.dashboard.open();

      await expect(app.dashboard.heading).toBeVisible();
      await expect(app.dashboard.totalItems).toHaveText(/^\d+$/);
      await expect(app.dashboard.highPriorityItems).toHaveText(/^\d+$/);
    },
  );

  test(
    'the main navigation leads to Items and back',
    { tag: ['@TC-002', '@smoke', '@readonly'] },
    async ({ app, page }) => {
      await app.dashboard.open();

      await app.nav.itemsLink.click();
      await expect(page).toHaveURL(/\/items$/);
      await expect(app.items.heading).toBeVisible();

      await app.nav.dashboardLink.click();
      await expect(app.dashboard.heading).toBeVisible();
    },
  );
});
