---
name: check-setup
description: Checks that this machine can run the tests and walks through fixing what is missing (Node.js, dependencies, the browser, .env, the environment, the accounts). Use after cloning, when tests do not start, or when the person asks what to install.
---

# Check the setup

1. Run `npm run doctor`. If `npm` itself is not found, Node.js is missing: tell the person to install the current LTS from https://nodejs.org, open a new terminal and come back. Stop there.
2. Go through the lines marked ✗ from the top. Each one names its fix:

   | Line | Fix |
   |---|---|
   | Dependencies are not installed, or the Playwright version differs | `npm ci` |
   | Chromium is not installed | `npx playwright install chromium` |
   | `.env` does not exist | `cp .env.example .env`, then the person fills it in |
   | `TEST_ENV` is not set or names no environment | the person sets it in `.env` to a file name of `config/environments/` |
   | An account is incomplete | name the missing keys; the person adds them to `.env` |
   | The application does not answer | check the URL in `config/environments/<name>.json` with the person; ask whether a VPN or an allow-listed address is needed |
   | `.env` is tracked by git | `git rm --cached .env`, and every password in it must be changed |

3. Values of `.env` are typed by the person, in their editor. Never ask for a password in the chat, and never open `.env`: `npm run doctor` shows which keys are still missing.
4. Run `npm run doctor` again until it ends with `Ready.` Lines marked `!` are notes, not problems.
5. Prove it with a run: `npm run test:smoke`. Report what passed. If signing in fails, the account or the sign-in page object is wrong: say which the error points at.
