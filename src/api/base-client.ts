import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '@config/env';

/** What every API client shares: where the API lives, and how a failed call reads. */
export abstract class BaseClient {
  constructor(protected readonly request: APIRequestContext) {}

  protected url(path: string): string {
    return `${env.apiUrl}${path}`;
  }

  /** Passes a successful response through; a failed one throws with its status and body. */
  protected async ok(response: APIResponse): Promise<APIResponse> {
    if (!response.ok()) {
      throw new Error(`${response.status()} from ${response.url()}\n${await response.text()}`);
    }
    return response;
  }

  protected async json<T>(response: APIResponse): Promise<T> {
    return (await (await this.ok(response)).json()) as T;
  }
}
