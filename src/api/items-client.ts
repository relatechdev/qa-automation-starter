import type { APIResponse } from '@playwright/test';
import { TEST_DATA_PREFIX } from '../helpers/test-data';
import { BaseClient } from './base-client';

export type Priority = 'low' | 'medium' | 'high';

export interface NewItem {
  name: string;
  priority: Priority;
}

export interface Item extends NewItem {
  id: string;
  createdAt: string;
}

export class ItemsClient extends BaseClient {
  /** The raw calls, for tests that assert on a status or an error body. */

  createResponse(item: unknown): Promise<APIResponse> {
    return this.request.post(this.url('/items'), { data: item });
  }

  listResponse(query = ''): Promise<APIResponse> {
    return this.request.get(this.url('/items'), { params: { q: query } });
  }

  deleteResponse(id: string): Promise<APIResponse> {
    return this.request.delete(this.url(`/items/${id}`));
  }

  /** The same calls for preparing data: they return the body, and throw when the call fails. */

  async create(item: NewItem): Promise<Item> {
    return this.json<Item>(await this.createResponse(item));
  }

  async list(query = ''): Promise<Item[]> {
    return (await this.json<{ items: Item[] }>(await this.listResponse(query))).items;
  }

  async delete(id: string): Promise<void> {
    await this.ok(await this.deleteResponse(id));
  }

  /** Deletes the items earlier runs left behind. Returns how many. */
  async deleteTestData(createdBefore: Date): Promise<number> {
    const leftovers = (await this.list(TEST_DATA_PREFIX)).filter(
      (item) => item.name.startsWith(TEST_DATA_PREFIX) && new Date(item.createdAt) < createdBefore,
    );
    for (const item of leftovers) await this.delete(item.id);
    return leftovers.length;
  }
}
