import type { APIRequestContext } from '@playwright/test';
import { ItemsClient } from './items-client';

interface Sweepable {
  /** Deletes the records earlier runs left behind. Returns how many. */
  deleteTestData(createdBefore: Date): Promise<number>;
}

/** Every API client, reached in a test as `api.<client>`. */
export class Api {
  readonly items: ItemsClient;

  /** The clients whose records the cleanup after a run sweeps. */
  private readonly sweepable: Sweepable[];

  constructor(protected readonly request: APIRequestContext) {
    this.items = new ItemsClient(request);
    this.sweepable = [this.items];
  }

  async deleteTestData(createdBefore: Date): Promise<number> {
    let removed = 0;
    for (const client of this.sweepable) removed += await client.deleteTestData(createdBefore);
    return removed;
  }
}
