# 02 Getting started

## Install once

| Tool | Why | Where |
|---|---|---|
| Node.js, the current LTS | runs Playwright and the scripts | https://nodejs.org |
| Git | versions the tests | https://git-scm.com (on Windows it also brings the shell Claude Code uses) |
| VS Code | the editor, with the "Playwright Test", "ESLint" and "Prettier" extensions it will suggest | https://code.visualstudio.com |
| Claude Code | writes and fixes tests with you | https://claude.com/claude-code |

## Get the code running

```bash
git clone <the repository's address>
cd <its folder>
npm ci                              # the exact dependencies of package-lock.json
npx playwright install chromium     # the browser Playwright drives
```

Copy `.env.example` to `.env` and fill in the accounts. You get them from your team lead; they are typed into this file by you and go nowhere else. `.env` is ignored by git, and Claude is blocked from reading it.

```bash
npm run doctor
```

`doctor` checks everything above and says how to fix what is missing. When it ends with `Ready.`, run the tests.

## Run tests

| Command | What happens |
|---|---|
| `npm test` | every test, without showing the browser |
| `npm run report` | opens the report of the last run: each test, its steps, and for a failure the screenshot and the trace |
| `npm run test:ui` | UI mode: pick tests, watch them run step by step, see the page at every step. The best way to learn what a test does. |
| `npm run test:headed` | the browser is visible while tests run |
| `npm run test:debug` | stops before each step, with Playwright's inspector |
| `npx playwright test tests/web/<file>.spec.ts` | one file |
| `npx playwright test --grep @TC-012` | the test of one case |
| `npm run test:smoke` | the smoke set |
| `TEST_ENV=staging npm test` | another environment for this run (on Windows PowerShell: `$env:TEST_ENV='staging'; npm test`) |

## Start Claude in this folder

Open a terminal in the repository's folder and run `claude`. Started here, Claude loads this repository's rules, skills and guards; started in a parent folder, it does not load the guards. The first time, it asks whether you trust this folder: answer yes, or the allowed commands of `.claude/settings.json` are ignored. Then type `/guide`: it tells you where you stand and what to do next, and answers any question about the setup.

<!-- demo:start -->

## Practise on the demo

The starter comes with a small application, so everything above works before you have a real project. `.env.example` already holds its only account.

1. `npm test`, then `npm run report`. Sixteen tests pass.
2. `npm run demo` and open http://localhost:3210. Sign in with the account of `.env.example` and click around: a dashboard, a list of items with a search, a form.
3. Read one test with its page object side by side: `tests/web/items/items-search.spec.ts` and `src/pages/items-page.ts`. Then run it in UI mode (`npm run test:ui`) and step through it.
4. Break it on purpose: change the expected count from `2` to `3`, run it, read the failure in the report, change it back.

**Exercise 1, with Claude.** `npm run cases` shows one case without a test: TC-014, a name longer than 60 characters is refused. In Claude, type `/new-api-test TC-014` and watch what it does: it reads the case, looks at the API, writes the test, runs it, and makes it fail once to prove it checks something. Read the test it wrote.

**Exercise 2, by hand.** Add a row to `cases/inventory.csv`: `TC-016,Items,The search ignores upper and lower case,web,P3,,`. Write its test yourself in `tests/web/items/items-search.spec.ts`, using the test above it as the model. Then ask Claude for `/review-tests`.

<!-- demo:end -->

## The everyday loop

1. `git switch -c <a-branch-name>`: a branch for the work.
2. Pick a case: `npm run cases` lists what is next.
3. Write its test with `/new-web-test TC-…` or `/new-api-test TC-…`, or by hand.
4. `npm run check` before a pull request: types, lint, formatting, no secrets in the files, and the inventory agreeing with the specs.
5. Commit, push the branch, open a pull request. A colleague reviews it.

## When something does not work

| What you see | What to do |
|---|---|
| `TEST_ENV is not set` or another message from the configuration | `npm run doctor` |
| `Executable doesn't exist` | `npx playwright install chromium` |
| Every test fails at signing in | the account in `.env` is wrong or expired, or the sign-in page changed: `npm run auth` shows the error |
| A test passes alone and fails with the others | it depends on data it does not own, or does not wait for the right thing: `/fix-test <file>` |
| A test fails only in the pipeline | open the report artifact of that run and its trace ([08 CI](08-ci.md)) |
| Nothing above | `/guide <your question>` |
