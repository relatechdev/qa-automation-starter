import { expect, test } from '@/fixtures/test';
import { uniqueName } from '@/helpers/test-data';

test.describe('Items: search', () => {
  test(
    'search narrows the list to the items that match',
    { tag: '@TC-005' },
    async ({ app, api, cleanup }) => {
      const shared = uniqueName('search');
      const names = [`${shared}-first`, `${shared}-second`];

      await test.step('two items exist whose names only this test uses', async () => {
        for (const name of names) {
          const item = await api.items.create({ name, priority: 'low' });
          cleanup.add(() => api.items.delete(item.id));
        }
      });

      await app.items.open();
      await app.items.search(shared);

      await expect(app.items.rows).toHaveCount(2);
      for (const name of names) await expect(app.items.row(name)).toBeVisible();
    },
  );

  test('a search without a match says so', { tag: '@TC-006' }, async ({ app }) => {
    await app.items.open();
    await app.items.search(uniqueName('no-such-item'));

    await expect(app.items.emptyMessage).toBeVisible();
    await expect(app.items.rows).toHaveCount(0);
  });
});
