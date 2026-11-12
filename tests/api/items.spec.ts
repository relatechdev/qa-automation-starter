import type { Item } from '@/api/items-client';
import { expect, test } from '@/fixtures/test';
import { uniqueName } from '@/helpers/test-data';

test.describe('Items API', () => {
  test(
    'a created item is listed, and gone after its delete',
    { tag: '@TC-010' },
    async ({ api, cleanup }) => {
      const name = uniqueName('api');

      const created = await api.items.createResponse({ name, priority: 'high' });
      expect(created.status()).toBe(201);
      const item = (await created.json()) as Item;
      cleanup.add(() => api.items.deleteResponse(item.id));
      expect(item).toMatchObject({ name, priority: 'high' });

      expect(await api.items.list(name)).toEqual([item]);

      expect((await api.items.deleteResponse(item.id)).status()).toBe(204);
      expect(await api.items.list(name)).toEqual([]);
    },
  );

  const refused = [
    { title: 'no name', body: { priority: 'low' }, error: 'Name is required.' },
    {
      title: 'an unknown priority',
      body: { name: 'anything', priority: 'urgent' },
      error: 'Priority must be low, medium or high.',
    },
  ];

  for (const { title, body, error } of refused) {
    test(`an item with ${title} is refused`, { tag: '@TC-011' }, async ({ api }) => {
      const response = await api.items.createResponse(body);

      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error });
    });
  }

  test('deleting an item that does not exist answers 404', { tag: '@TC-012' }, async ({ api }) => {
    const response = await api.items.deleteResponse('no-such-id');

    expect(response.status()).toBe(404);
  });

  test.describe('without signing in', () => {
    test.use({ role: 'anonymous' });

    test('the API answers 401', { tag: ['@TC-013', '@readonly'] }, async ({ api }) => {
      const response = await api.items.listResponse();

      expect(response.status()).toBe(401);
    });
  });
});
