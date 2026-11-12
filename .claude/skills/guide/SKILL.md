---
name: guide
description: Explains this test-automation setup and what to do next. Use when the person asks what to install, what is needed from the project or the company, how the folders, fixtures, rules, skills or hooks work, how to write, run or debug a test, what the good practices are, or says they are new here.
argument-hint: '[question]'
---

# Guide

The question: $ARGUMENTS

Answer from this repository's own docs, in the language the person writes in. They may be new to test automation: use plain words, give the exact command or file, and explain a term the first time it appears.

## Without a question: say where they stand and the one next step

Run `npm run doctor` and `npm run cases`, read `PROJECT.md`, then name the first step of this list that is not done:

1. The machine is not ready (`doctor` shows ✗): `/check-setup`.
2. `PROJECT.md` has unanswered sections or open questions: say what is missing and who usually knows it (`docs/03-project-intake.md`).
3. The case inventory is empty: `/triage-cases <sheet>`.
4. No test signs in and opens the application yet: `/new-web-test` for the first smoke case.
5. Cases remain: the top of "Next to automate" in `npm run cases`, with `/new-web-test` or `/new-api-test`.
6. Work is ready for others: `/review-tests`, `npm run check`, then a pull request.

<!-- demo:start -->

**While this is still the starter with its demo,** the next step depends on why the person is here. Learning: run `npm test`, open `npm run report`, then do the exercise in `docs/02-getting-started.md`. Starting a real project: create a private repository from the template (`README.md`) and run `/new-project` there.

<!-- demo:end -->

## With a question: read the doc, then answer

| The question is about | Read first |
|---|---|
| What automated tests are, the kinds of tests, what QA automates | `docs/01-basics.md` |
| Installing, the first run, reports, the editor, the first exercise | `docs/02-getting-started.md` |
| What to ask the company or the project for before starting | `docs/03-project-intake.md` |
| Folders, fixtures, environments, signing in, test data, where Claude's rules, skills and hooks fit | `docs/04-how-it-works.md` |
| How to write a test: locators, waiting, assertions, data, do and don't | `docs/05-writing-tests.md` |
| Manual cases, the inventory, what to automate first, coverage | `docs/06-from-manual-cases.md` |
| Working with Claude: the skills, a normal session, checking its work, what it must not see | `docs/07-working-with-claude.md` |
| Pipelines, secrets, scheduled runs, reading a failed run | `docs/08-ci.md` |
| This project: URLs, roles, data rules, people | `PROJECT.md` |

Read the file before answering. Do not answer from memory what a doc covers: the docs are how this team works.

## The answer

- The answer first, in a few lines. Then the command or the file. Then where to read more.
- One topic at a time; offer the next one instead of adding it.
- If the docs do not cover it, say so, answer from general Playwright knowledge and mark it as general, and offer to add it to the docs.
- If the question shows a plan that goes against a rule here (a fixed wait, a password in a file, a test on production data), say it plainly and give the way that works.
