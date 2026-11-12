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
3. **Tests.** The `web` project runs `tests/web/` in Chromium, the `api` project runs `tests/api/` without a browser. Both start signed in from the saved state, and run in parallel, so no test may depend on another.
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

## The quality gate

`npm run check` runs what a machine can judge:

- **Types** (`tsc`): a misspelt page object or a wrong argument.
- **Lint** (`eslint`): a forgotten `await`, a fixed wait, `test.only`, `force: true`, an assertion inside a page object, `test` imported from the wrong place.
- **Formatting** (`prettier`).
- **The scripts' own tests**, and **the inventory agreeing with the specs** (`npm run cases -- --check`).

The pipeline runs the same on every pull request.

## What is there for Claude

| Piece | What it does |
|---|---|
| `CLAUDE.md` | The short brief Claude reads at the start of every session: commands, layout, how a test gets written, what is never done. |
| `PROJECT.md` | The facts of this project: the application, environments, roles, data rules, people, open questions. |
| `.claude/rules/` | The conventions in detail, each loaded when Claude touches a matching file: `web-tests.md` for `tests/web/`, `page-objects.md` for `src/pages/`, and so on. `security.md` is always loaded. What is learned about one area of the application goes into `app-<area>.md`. |
| `.claude/skills/` | The procedures, typed as commands: `/guide`, `/check-setup`, `/triage-cases`, `/new-web-test`, `/new-api-test`, `/fix-test`, `/review-tests`. `playwright-cli` and `playwright-trace` come from Playwright itself: how Claude drives a browser and reads a trace. |
| `.claude/hooks/` | Guards that run by themselves: Claude cannot open `.env` or `.auth/`; a run against a read-only environment, a forced push and a push to `main` need your yes; every file Claude edits is formatted and linted at once. |
| `.claude/settings.json` | Wires the hooks, and lists the commands Claude may run without asking. |

All of it loads when Claude is started in this folder.

## Keeping it current

- **A newer Playwright:** `npm install --save-dev @playwright/test@<version>`, `npx playwright install chromium`, then `npx playwright init-skills` to refresh the two Playwright skills, and delete `.claude/skills/playwright-component-testing/` again. Run everything before merging.
- **A convention that changes** is changed in its rule file and in [05 Writing tests](05-writing-tests.md) together.
- **When Claude gets the same thing wrong twice,** the missing rule is added to `CLAUDE.md` or to the matching rule file.
