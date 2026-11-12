---
name: new-api-test
description: Writes the API test of one or more cases of the inventory. Learns the endpoint from its documentation or from the calls the application makes, adds or extends the client, covers the kinds of behaviour the endpoint has, runs the test and proves it can fail. Use when the person asks to automate a case against the API.
argument-hint: '<TC-id> [TC-id …]'
---

# New API test: $ARGUMENTS

Read `.claude/rules/api-tests.md` and `test-data.md` before writing.

## 1. Understand the case

- Find the row of each id in `cases/inventory.csv`; add the row first when it is missing. No id given: take the top `api` case of `npm run cases` and confirm it.
- Say back what is called and what must come back. Ask one question when the expected status or message is not stated.

## 2. Learn the endpoint from the source

In this order, and never from a guess:

1. The API's documentation named in `PROJECT.md` (an OpenAPI document, a collection).
2. The client in `src/api/`, when the endpoint is already there.
3. The application itself: `npx playwright cli open <base URL>`, `state-load .auth/<environment>-<role>.json`, do the action in the UI, then `requests` and `request <number>` show the method, the URL, the body sent and the body returned.

Write down the method and path, the body's fields with their types, the success status, each error status with its message, and how the call is authorised. What neither source shows is asked, not assumed.

## 3. Client

Add the endpoint to its client, or create `src/api/<resource>-client.ts` and register it in `Api`. Each call twice: `<verb>Response()` raw and taking `unknown`, `<verb>()` typed and throwing. A client that creates records gets `deleteTestData` and joins `Api.sweepable`.

## 4. Tests

`tests/api/<resource>.spec.ts`, each test tagged with its case id. Cover what the endpoint really has, from the table in `api-tests.md`: it works, each validation rule once, who may call it, what is not there, the product's own rules. Inputs that differ only in value are one loop over a table.

Assert the status, then the fields the case is about. Create with `uniqueName()`, undo with `cleanup.add(...)` right after.

Writes never run against a read-only environment. A test that only reads may carry `@readonly`.

## 5. Run, then prove

1. `npx playwright test <file> --project=api`.
2. **Make it fail once:** change an expected status or message, see red, restore.
3. `--repeat-each=5`, then `npm run cases -- --check` and `npx tsc --noEmit`.

If the API answers differently from the documentation or the case, stop and show the person the request and the response. A confirmed defect is reported by them; the test keeps the documented expectation, marked `test.fail(true, '<bug id>: <what is wrong>')`.

## 6. Report

The cases covered and the file, where the endpoint's facts came from, the proof it can fail, and every open question. No commit unless the person asks.
