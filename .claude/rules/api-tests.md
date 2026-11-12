---
paths:
  - 'tests/api/**/*.ts'
  - 'src/api/**/*.ts'
---

# API tests and clients

## A client per resource

```ts
import type { APIResponse } from '@playwright/test';
import { BaseClient } from './base-client';

export interface NewInvoice {
  customer: string;
  amount: number;
}

export interface Invoice extends NewInvoice {
  id: string;
  status: 'draft' | 'sent' | 'paid';
}

export class InvoicesClient extends BaseClient {
  createResponse(invoice: unknown): Promise<APIResponse> {
    return this.request.post(this.url('/invoices'), { data: invoice });
  }

  async create(invoice: NewInvoice): Promise<Invoice> {
    return this.json<Invoice>(await this.createResponse(invoice));
  }
}
```

- `src/api/<resource>-client.ts`, class `<Resource>Client` extending `BaseClient`, registered in `Api` (`src/api/api.ts`) so tests reach it as `api.<resource>`.
- Each call exists twice. `<verb>Response()` returns the raw response, for a test that asserts on a status or an error body, and takes `unknown` so it can send a wrong body. `<verb>()` is for preparing data: it takes a typed body, returns the typed result and throws when the call fails.
- The types of a body come from the API's documentation or from a real response, never from a guess. Before writing a client, look: the OpenAPI document named in `PROJECT.md`, or `npx playwright cli` and its `requests` command while doing the action in the UI.
- Calls ride on the signed-in session of the test's role. If the API wants a token in a header, add it once in `BaseClient`, not in each client.
- A client that creates records has `deleteTestData(createdBefore)` and is listed in `Api.sweepable`, so the cleanup after a run finds what a broken run left behind.

## What an endpoint's tests cover

| Kind | Example |
|---|---|
| It works | a created record is returned and can be read back |
| Each validation rule, once | a missing required field, a value outside the allowed set, a too-long text: the status and the message |
| Who may call it | `401` signed out (`test.use({ role: 'anonymous' })`), `403` with a role that may not |
| What is not there | `404` for an unknown id |
| Rules of the product | a duplicate, a state that does not allow the action |

Skip a kind only when the endpoint has no such behaviour.

## Asserting

```ts
const response = await api.invoices.createResponse({ amount: 120 });

expect(response.status()).toBe(400);
expect(await response.json()).toMatchObject({ error: 'Customer is required.' });
```

- Assert the status first, then the fields the case is about. `toMatchObject` for a part of a body, `toEqual` only when every field is known and stable.
- Never assert on a whole body that carries ids, timestamps or counters of a shared environment.
- A test owns its data and removes it: `uniqueName()` for names, `cleanup.add(() => api.invoices.deleteResponse(id))` right after the create.
- Tests that share one case and differ only in input are a loop over a table of inputs, each with its own title.
