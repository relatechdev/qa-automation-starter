---
name: new-project
description: Turns a repository created from the starter template into a project's own test suite. Asks for the project's name, environments, roles and rules, removes the demo, writes PROJECT.md and gets the first sign-in working.
argument-hint: '[project name]'
disable-model-invocation: true
---

# New project: $ARGUMENTS

## 1. Check this is the right repository

- `git remote get-url origin`. If it is the starter itself (it ends with `qa-automation-starter`), stop: a project lives in its own repository. The person creates it first, private, from the template:
  `gh repo create <owner>/<project>-test-automation --private --template relatechdev/qa-automation-starter --clone`, or "Use this template" on GitHub. Then they start Claude in that folder and run `/new-project` again.
- A client's tests, URLs and cases belong in a private repository. If `gh repo view --json visibility` says public, say so and ask before going on.
- `git status` must be clean.

## 2. Ask

Ask in two or three rounds, not one long form. Never ask for a password: accounts go into `.env`, typed by the person.

Needed now:

- The project's name, as its people say it.
- The environments tests may reach: a short name and the URL of each (`staging`, `dev`, `prod`…). The first is the default for a run.
- Which of them tests may change. Production is read-only whatever the answer.
- The roles tests sign in as (`user`, `admin`…), and whether an account exists for each on each environment.
- How people sign in: a form with email and password, single sign-on, a code from an app or an email.

Needed soon, and fine to leave open:

- What the application does, and its main areas.
- The API: its address when it differs, where it is documented, how a call is authorised.
- What tests may create, where it shows for other people, what must never be touched.
- The test id attribute the developers use (`data-testid` unless they say otherwise).
- Where the manual cases are, and who owns them.
- Who answers questions about the product, and where bugs are reported.

What the person does not know becomes a line under "Open questions" in `PROJECT.md`. `docs/03-project-intake.md` says who usually knows each one.

## 3. Set the repository up

```bash
node scripts/init-project.mjs --name "<name>" \
  --env <name>=<url> [--env <name>=<url> …] \
  [--api <name>=<api url>] [--roles user,admin] [--read-only <name>]
```

It removes the demo application with its tests, page objects and cases, writes the environments, `.env.example`, `README.md` and a `PROJECT.md` to complete, and removes itself.

## 4. Complete PROJECT.md

Replace every `<!-- … -->` with what the person said. Where they did not know, write "Not known yet" there and add the question under "Open questions". No `<!--` stays in the file.

If the test id attribute is not `data-testid`, change `testIdAttribute` in `playwright.config.ts`.

## 5. Connect to the application

1. `cp .env.example .env`, then ask the person to fill in the accounts in their editor and say when they are done.
2. `npm run doctor`, and fix what it shows.
3. Look at the real sign-in page: `npx playwright cli open <base URL>`, then `snapshot`. Adapt `src/pages/login-page.ts` to it: the path, the locators, the steps of `signIn`.
4. `npm run auth` until it passes. The run reads the account from `.env`; Claude never sees it.

If signing in needs single sign-on or a second factor, stop and show the person the options in `docs/04-how-it-works.md` (Signing in) before building anything.

## 6. Hand over

- `npm run check` passes.
- Say what is set up, what is still open in `PROJECT.md`, and the next step: `/triage-cases <sheet>` when manual cases exist, otherwise `/new-web-test` for a first smoke case ("a signed-in user sees the home page").
- Offer to commit the result on a branch. Do not commit without a yes.
