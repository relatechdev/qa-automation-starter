# QA automation starter

A starting point for end-to-end and API test automation with [Playwright](https://playwright.dev), TypeScript and [Claude Code](https://claude.com/claude-code). It is a template: every project gets its own repository made from it.

It is for QA engineers who test by hand today and are asked to automate. It brings:

- **A working framework:** environments, signing in once per role, page objects, API clients, test data that cleans up after itself, a guard for production.
- **A way of working:** a case inventory that links manual cases to tests, conventions that lint enforces, a gate for pull requests, pipelines.
- **A setup for Claude Code:** the rules it follows, commands for each step (`/guide`, `/triage-cases`, `/new-web-test`…), and guards that keep passwords and production out of its reach.
- **A demo application and example tests,** so all of it runs before a real project exists.
- **A guide** in [`docs/`](docs/README.md), written for people who are new to automation.

## Try it

You need [Node.js](https://nodejs.org) (the current LTS) and git.

```bash
git clone https://github.com/relatechdev/qa-automation-starter.git
cd qa-automation-starter
npm ci
npx playwright install chromium
cp .env.example .env        # the demo's account; nothing secret
npm run doctor              # is everything ready?
npm test                    # the example tests, against the demo application
npm run report              # what happened
```

Then start `claude` in the folder and type `/guide`. The exercises are in [Getting started](docs/02-getting-started.md).

## Start a project

1. Create the project's repository from this template, **private**: "Use this template" on GitHub, or

   ```bash
   gh repo create <owner>/<project>-test-automation --private --clone \
     --template relatechdev/qa-automation-starter
   ```

2. In its folder: `npm ci`, `npx playwright install chromium`, then start `claude`.
3. Type `/new-project`. Claude asks for the project's name, its environments and roles, removes the demo, writes `PROJECT.md`, and gets the first sign-in working. Accounts go into `.env`, typed by you.
4. Bring the manual cases: `/triage-cases <sheet>`. Then automate them one by one: `/new-web-test TC-001`.

What to ask the company for before all this: [Project intake](docs/03-project-intake.md).

## Commands

| Command | What it does |
|---|---|
| `npm run doctor` | is this machine ready to run tests? |
| `npm test` | every test, on the environment `TEST_ENV` names |
| `npm run test:web` / `npm run test:api` | only the browser tests, or only the API tests |
| `npm run test:smoke` | the tests tagged `@smoke` |
| `npx playwright test --grep @TC-012` | the test of one case |
| `npm run test:ui` | Playwright's UI mode: watch, step through and re-run tests |
| `npm run report` | the report of the last run |
| `npm run cases` | how much of the case inventory is automated, and what comes next |
| `npm run check` | types, lint, formatting, the scripts' own tests, a scan for secrets: the gate before a pull request |
| `npm run demo` | the demo application on http://localhost:3210 |

In Claude Code: `/guide`, `/check-setup`, `/new-project`, `/triage-cases`, `/new-web-test`, `/new-api-test`, `/fix-test`, `/review-tests`.

## Layout

```
cases/inventory.csv       every case: what it checks, how it is verified, its priority
tests/web/, tests/api/    the tests
tests/setup/              signing in before a run, sweeping old test data after it
src/pages/                page objects: where things are on a page, what one can do there
src/api/                  API clients
src/fixtures/test.ts      what every test gets: app, api, cleanup, role
config/environments/      one file per environment
scripts/                  doctor, cases, sheet reader, project setup
demo-app/                 the application the examples run against
docs/                     the guide, in reading order
.claude/                  Claude Code's rules, skills (commands) and hooks (guards)
.github/workflows/        the pull-request gate, test runs, the starter's self-test
```

## The ideas behind it

- **A test covers a case.** Every test carries the id of a row in the inventory, so anyone can see what is automated and what is not.
- **Look, do not guess.** Locators come from the live page; API fields from the documentation or a real response.
- **A test owns its data.** It creates what it needs under a unique name and removes it. It never depends on another test or on shared data.
- **Wait for the thing, not for time.** No fixed waits, no forced clicks, no retries that hide a cause.
- **A test must be seen failing.** One that has never failed proves nothing.
- **A failing test is information.** When the application is wrong, the test stays as the case states it and the bug is reported.
- **Passwords stay with people.** They live in `.env` and in the pipeline's secret, and nowhere else.
- **Production is looked at, never changed.**
