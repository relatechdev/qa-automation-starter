# {{name}} test automation

End-to-end and API tests for {{name}}, written with Playwright and TypeScript. Built on [qa-automation-starter](https://github.com/relatechdev/qa-automation-starter).

## Start

1. Install [Node.js](https://nodejs.org) (the current LTS) and git, then clone this repository.
2. `npm ci`, then `npx playwright install chromium`.
3. Copy `.env.example` to `.env` and fill in the accounts. Ask the team lead for them; they never go into git or into a chat.
4. `npm run doctor` says whether everything is ready.
5. `npm test` runs the tests; `npm run report` opens the result.

## Commands

| Command | What it does |
|---|---|
| `npm test` | every test, on the environment `TEST_ENV` names |
| `npm run test:web` / `npm run test:api` | only the browser tests, or only the API tests |
| `npm run test:smoke` | the tests tagged `@smoke` |
| `npx playwright test --grep @TC-012` | the test of one case |
| `npm run test:ui` | Playwright's UI mode: watch, step through and re-run tests |
| `npm run test:headed` / `npm run test:debug` | see the browser, or step through with the inspector |
| `npm run report` | the report of the last run |
| `npm run cases` | how much of the case inventory is automated, and what comes next |
| `npm run check` | types, lint, formatting, the scripts' own tests and a scan for secrets: run it before a pull request |
| `npm run doctor` | is this machine ready to run tests? |

## Working with Claude

Start Claude Code in this folder, so the rules, skills and guards of `.claude/` load. Then:

| Type | To |
|---|---|
| `/guide` | ask how anything here works, or what to do next |
| `/check-setup` | find out what is missing on this machine |
| `/triage-cases <sheet>` | turn a sheet of manual cases into the inventory |
| `/new-web-test TC-012` | write the browser test of a case |
| `/new-api-test TC-030` | write the API test of a case |
| `/fix-test <spec>` | find out why a test fails, and fix what is really wrong |
| `/review-tests` | review the tests of this branch before a pull request |

## Where things are

| Path | What lives there |
|---|---|
| `PROJECT.md` | the application, its environments and accounts, the rules for test data |
| `cases/inventory.csv` | every case, and whether it is automated |
| `tests/web/`, `tests/api/` | the tests |
| `src/pages/`, `src/api/` | page objects and API clients the tests use |
| `config/environments/` | one file per environment |
| `docs/` | how everything works, in reading order |
