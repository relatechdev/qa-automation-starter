import { expect, test } from '@/fixtures/test';
import { uniqueName } from '@/helpers/test-data';

test.describe('Items: add and delete', () => {
  test(
    'a new item appears in the list with its priority',
    { tag: '@TC-007' },
    async ({ app, api, cleanup }) => {
      const name = uniqueName('item');
      cleanup.add(async () => {
        for (const item of await api.items.list(name)) await api.items.delete(item.id);
      });

      await app.items.open();
      await app.items.addItem(name, 'high');

      await expect(app.items.row(name)).toContainText('high');
      await expect(app.items.nameInput).toBeEmpty();
    },
  );

  test('an item without a name is refused', { tag: '@TC-008' }, async ({ app }) => {
    await app.items.open();
    await app.items.addItem('', 'low');

    await expect(app.items.formError).toHaveText('Name is required.');
  });

  test('a deleted item leaves the list', { tag: '@TC-009' }, async ({ app, api, cleanup }) => {
    const item = await api.items.create({ name: uniqueName('delete'), priority: 'medium' });
    cleanup.add(() => api.items.deleteResponse(item.id));

    await app.items.open();
    await app.items.deleteItem(item.name);

    await expect(app.items.row(item.name)).toHaveCount(0);
    expect(await api.items.list(item.name)).toEqual([]);
  });
});
