# QA test automation

End-to-end and API tests, written with Playwright and TypeScript. What they run against, its environments and its accounts: @PROJECT.md.

Answer in the language the person writes in. Code, comments, test titles, commits and docs are in English.

<!-- demo:start -->

**This checkout is the starter, not a project yet.** Its tests run against the bundled demo application (`TEST_ENV=local`). A real project gets its own private repository, created from this template, and `/new-project` sets it up there. Someone who is learning stays here: the exercise is in `docs/02-getting-started.md`.

<!-- demo:end -->

## Commands

| Task | Command |
|---|---|
| Is this machine ready? | `npm run doctor` |
| Every test | `npm test` |
| Browser tests, or API tests | `npm run test:web`, `npm run test:api` |
| One file, one case, the smoke set | `npx playwright test <file>`, `--grep @TC-012`, `npm run test:smoke` |
| Another environment for one run | `TEST_ENV=<name> npx playwright test …` |
| Check a test for flakiness | `npx playwright test <file> --repeat-each=5` |
| Sign in again (renew `.auth/`) | `npm run auth` |
| The last report | `npm run report` |
| Look at the live application | `npx playwright cli …` (the `playwright-cli` skill) |
| Read a failed run's trace | `npx playwright trace … 2>&1 \| node scripts/redact.mjs` (the `playwright-trace` skill) |
| Automated and remaining cases | `npm run cases` |
| The gate before a pull request | `npm run check` |

## Layout

| Path | What lives there |
|---|---|
| `cases/inventory.csv` | every case: what it checks, how it is verified (`web`, `api`, `manual`, `blocked`), its priority |
| `tests/web/`, `tests/api/` | specs, grouped by area of the application |
| `tests/setup/` | signing in before a run, sweeping old test data after it |
| `src/pages/` | page objects (locators and actions), gathered in `App` |
| `src/api/` | API clients, gathered in `Api` |
| `src/fixtures/test.ts` | `test` and `expect` with `app`, `api`, `cleanup` and `role` |
| `src/helpers/test-data.ts` | `uniqueName()` and the prefix of everything tests create |
| `config/environments/` | one file per environment; `config/env.ts` reads it and the accounts |
| `scripts/` | `doctor`, `cases`, `sheet` |
| `docs/` | the guide for people, in reading order; `/guide` answers from it |

## How a test gets written

1. **Start from a case.** Every test covers a case of the inventory and carries its tag (`@TC-012`). No case yet: add the row first.
2. **Look before writing.** Open the live application with `npx playwright cli`, walk through the case by hand and take the locators from what is really there. Never guess a locator, a text, a route or a response field.
3. **Reuse before adding.** Search `src/pages/`, `src/api/` and the neighbouring specs for what already exists.
4. **Prepare through the API, act through the UI, assert what the case states.** The test creates its own data with `uniqueName()` and registers the undo with `cleanup`.
5. **Run it until it passes for the right reason,** then **make it fail once**: break the expectation or the precondition, see red, restore. A test that has never failed proves nothing.
6. **Run it five times** (`--repeat-each=5`). A test that fails once in five is not done.
7. **Report** what the test covers, what was looked at in the application, the failing run, and every open question.

## Always

- Import `test` and `expect` from `@/fixtures/test`.
- Wait for the thing itself: `await expect(locator)…`. Never a fixed wait, never `force: true`, never a retry that hides the cause.
- Keep locators and actions in page objects, assertions in specs.
- When the application disagrees with the case, stop and say so. The test is not bent until it passes: a real defect is reported, and its test is marked with `test.fail(true, '<bug id>: <what is wrong>')`.
- One question when a case is ambiguous, before writing code.

## Never

- Open `.env` or `.auth/`, or write a password, a token or a real person's data anywhere.
- Create, change or delete anything on a read-only environment.
- Commit, push or open a pull request unless asked. Never push to `main`.
- Leave `test.only`, a skipped test without a reason, or a commented-out test behind.
- Rename a test without a reason: its history in the reports starts again.

## Where knowledge goes

| What was learned | Where it is written |
|---|---|
| A fact about the application, an environment, an account or a contact | `PROJECT.md` |
| How one area of the application behaves, when the next test there needs it too (a slow widget, a text that changes, a route) | `.claude/rules/app-<area>.md`, with `paths:` naming that area's specs and page objects |
| A convention for all tests | the matching file in `.claude/rules/`, and `docs/05-writing-tests.md` when people need it too |
| What only explains one line | a comment on that line, or nothing |

## Rules and skills

Rules load by themselves when a matching file is touched: `security.md` always, `web-tests.md`, `page-objects.md`, `api-tests.md`, `test-data.md` and `cases.md` by path.

| Skill | Use |
|---|---|
| `/guide [question]` | how this setup works, what is needed, what to do next |
| `/check-setup` | find and fix what is missing on this machine |
| `/triage-cases <sheet>` | turn manual cases into the inventory, and pick what to automate first |
| `/new-web-test <case…>` | write the browser test of one or more cases |
| `/new-api-test <case…>` | write the API test of one or more cases |
| `/fix-test <spec or title>` | find out why a test fails and fix the real cause |
| `/review-tests` | review the tests of this branch before a pull request |

<!-- demo:start -->

`/new-project` turns a repository created from this template into a project's own. It exists only until it has run.

<!-- demo:end -->
