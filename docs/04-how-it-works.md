# 04 How it works

## The pieces

```
cases/inventory.csv          what must be checked (one row per case)
        │  each test carries its case's tag: @TC-012
        ▼
tests/web/*.spec.ts          what a test does and asserts
tests/api/*.spec.ts
        │  every test gets: app, api, cleanup, role
        ▼
src/fixtures/test.ts         hands those to the test, signed in
        │
        ├── src/pages/       page objects: where things are, what one can do   ──▶ the browser
        └── src/api/         API clients: one per resource                     ──▶ the API
                                                                                    │
config/environments/<name>.json + .env   which application, which accounts  ◀──────┘
```

A spec never contains a URL, an account or a raw locator. It says what happens in the product's words; the layers below know how.

## A run, step by step

1. **Configuration.** `config/env.ts` reads `TEST_ENV`, loads `config/environments/<name>.json` and the accounts from `.env`. Something missing stops the run with a message that says what.
2. **Setup** (`tests/setup/auth.setup.ts`). Signs in once per role through the real sign-in page and saves the browser's state to `.auth/<environment>-<role>.json`.
3. **Tests.** The `web` project runs `tests/web/` in Chromium, the `api` project runs `tests/api/` without a browser. Both start signed in from the saved state (or from their worker's own session, see [Signing in](#signing-in)), and run in parallel, so no test may depend on another.
4. **Cleanup** (`tests/setup/cleanup.teardown.ts`). Deletes the test data that earlier, broken runs left behind.
5. **Report.** `playwright-report/` holds the result; `test-results/` holds a trace and a screenshot of every failure.

## Environments and accounts

One file per environment:

```json
{
  "baseUrl": "https://staging.example.test",
  "apiUrl": "https://staging.example.test/api",
  "roles": ["user", "admin"],
  "readOnly": false
}
```

The accounts are in `.env`, one pair per role and environment, named `<ENV>_<ROLE>_EMAIL` and `<ENV>_<ROLE>_PASSWORD`:

```
TEST_ENV=staging
STAGING_USER_EMAIL=…
STAGING_USER_PASSWORD=…
STAGING_ADMIN_EMAIL=…
STAGING_ADMIN_PASSWORD=…
```

- **Another environment for one run:** `TEST_ENV=dev npm test`.
- **A new environment:** add its file, add its keys to `.env.example` (without values) and to your `.env`.
- **A new role:** add it to `roles` in each environment file and add its keys. The setup signs it in; a test asks for it with `test.use({ role: 'admin' })`.
- **Two keys for the applications that need them:** `"signInPerWorker": true` ([Signing in](#signing-in)) and `"apiAuth": "bearer"` ([Calling the API](#calling-the-api)). Both are off when left out.

## Signing in

Tests do not sign in. The setup does it once, and every test starts from the saved state: faster, and the sign-in page is exercised by its own tests only.

- `test.use({ role: 'admin' })` at the top of a file or inside a `describe` changes who the tests are.
- `test.use({ role: 'anonymous' })` starts signed out, for the sign-in tests themselves and for "what does a visitor see".
- A test that signs out or changes its session signs in for itself first, as `anonymous`. Ending the shared session would sign out the tests running next to it.

When the application signs people in through another company's page (single sign-on) or asks for a code, a script cannot simply type a password. The options, best first:

1. A test account that signs in with a plain form on test environments. Ask for this.
2. Signing in through the API, when it has an endpoint that returns a session.
3. A second factor based on an authenticator secret: the setup can compute the code from the secret, kept in `.env`.
4. Signing in by hand once with `npx playwright codegen --save-storage=.auth/<environment>-<role>.json <address>`, and reusing that state until it expires. A stopgap: it does not work in the pipeline.

**When the saved session stops working a minute into a run.** Some sign-in services (Auth0, Cognito, Frontegg and others, with "refresh token rotation") replace the session's token every time it is used, and the saved one stops working shortly after. The first tests pass and the later ones land on the sign-in page. Set `"signInPerWorker": true` in the environment's file: each worker then signs in once on its own, about one sign-in per parallel worker, and hands the renewed session from one test to the next. The setup still signs in first, so a wrong account stops the run at once. To check whether an application needs it, run the same test with `--repeat-each=15 --workers=1`: without it, the runs after the first minute fail.

## Calling the API

The `api` fixture calls the API as the test's role, in one of two ways, set by `apiAuth` in the environment's file:

- **`"cookies"`** (the default): the signed-in session's cookies go with every call. Right when the API and the application share a session.
- **`"bearer"`**: the call carries `Authorization: Bearer <token>`. Right when the application sends a token to its API, as most single-page applications do: open the browser's developer tools, Network, and look at a call to the API. The token is taken from the application's own first call to `apiUrl` (`src/api/api-auth.ts`), kept for the worker, and taken again before it expires. When the API has a sign-in endpoint that returns a token, call it in `captureApiToken` instead.

Tests and clients do not change between the two: they use `api` as before.

## Test data

Test environments are shared, so tests clean up after themselves and never rely on what others do:

- Everything a test creates is named with `uniqueName('<label>')`: `qa-auto-<label>-<random>`. Anyone who meets such a record knows what it is.
- Right after creating, the test registers the undo: `cleanup.add(() => api.items.delete(item.id))`. It runs after the test, passed or failed.
- The cleanup after the run sweeps `qa-auto-` records older than two hours, for the runs that crashed.

## Read-only environments

An environment with `"readOnly": true` is only looked at. Production always is.

- Only tests tagged `@readonly` run there; all others are left out.
- Nothing is recorded: no trace, no screenshot, because they would show real data.
- `uniqueName()` refuses to work, so a test cannot create by accident.
- Claude asks for a yes before starting such a run.

## Reports and traces

- `npm run report` opens the last report. A failed test shows the error, the step, a screenshot and a link to its trace.
- The trace is a recording: every action, the page before and after it, the network calls and the console. `npx playwright show-trace test-results/<test>/trace.zip` opens it; in the report it opens with a click.
- Both folders are ignored by git. They show whatever was on the screen: do not share them outside the team.
- A trace also holds what signed the test in: the typed password, cookies, tokens in request headers. When Claude reads one, it pipes the output through `node scripts/redact.mjs`, which hides them; a guard refuses the command otherwise. Do the same when you paste trace output anywhere.

## The quality gate

`npm run check` runs what a machine can judge:

- **Types** (`tsc`): a misspelt page object or a wrong argument.
- **Lint** (`eslint`): a forgotten `await`, a fixed wait, `test.only`, `force: true`, an assertion inside a page object, `test` imported from the wrong place.
- **Formatting** (`prettier`).
- **The scripts' own tests**, and **the inventory agreeing with the specs** (`npm run cases -- --check`).
- **Secrets** (`npm run secrets`): no file git would commit holds a token, a key, a webhook address or a `.env`. It names the file and the line, never the value.

The pipeline runs the same on every pull request.

## What is there for Claude

| Piece | What it does |
|---|---|
| `CLAUDE.md` | The short brief Claude reads at the start of every session: commands, layout, how a test gets written, what is never done. |
| `PROJECT.md` | The facts of this project: the application, environments, roles, data rules, people, open questions. |
| `.claude/rules/` | The conventions in detail, each loaded when Claude touches a matching file: `web-tests.md` for `tests/web/`, `page-objects.md` for `src/pages/`, and so on. `security.md` is always loaded. What is learned about one area of the application goes into `app-<area>.md`. |
| `.claude/skills/` | The procedures, typed as commands: `/guide`, `/check-setup`, `/triage-cases`, `/new-web-test`, `/new-api-test`, `/fix-test`, `/review-tests`. `playwright-cli` and `playwright-trace` come from Playwright itself: how Claude drives a browser and reads a trace. |
| `.claude/hooks/` | Guards that run by themselves: Claude cannot open `.env` or `.auth/`; output that can show a token or a cookie (a trace's requests, the browser's cookies) goes through `scripts/redact.mjs`; a run against a read-only environment, a forced push and a push to `main` need your yes; every file Claude edits is formatted and linted at once. |
| `.claude/settings.json` | Wires the hooks, and lists the commands Claude may run without asking. |

All of it loads when Claude is started in this folder.

## Keeping it current

- **A newer Playwright:** `npm install --save-dev @playwright/test@<version>`, `npx playwright install chromium`, then `npx playwright init-skills` to refresh the two Playwright skills, and delete `.claude/skills/playwright-component-testing/` again. Run everything before merging.
- **A convention that changes** is changed in its rule file and in [05 Writing tests](05-writing-tests.md) together.
- **When Claude gets the same thing wrong twice,** the missing rule is added to `CLAUDE.md` or to the matching rule file.
