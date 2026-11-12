---
name: fix-test
description: Finds out why a test fails and fixes the real cause. Runs the one test, reads the error and the trace, decides whether the application, the test, the data or the environment is wrong, and repairs only what is. Use when a test fails, is flaky, or a run in CI went red.
argument-hint: '<spec file, test title or @TC-id>'
---

# Fix a failing test: $ARGUMENTS

A red test is information. The goal is to learn what it says, not to make it green.

## 1. See it fail

- Run only that test: `npx playwright test <file> --project=<web|api> --grep "<title or @TC-id>"`.
- If it passes now, it is flaky: run it with `--repeat-each=10` and work with the runs that fail.
- For a failure in CI, download the report artifact of the run and open its trace instead.

## 2. Read before changing anything

- The error message and the line it points at.
- The trace of the failed run (`test-results/<test>/trace.zip`): `npx playwright trace open <file>`, then `trace actions`, `trace action <id>`, `trace requests`, `trace console` (the `playwright-trace` skill), each piped through `node scripts/redact.mjs`. Look at the snapshot of the step before the failure: what was on the screen?
- The application as it is now: `npx playwright cli`, the same steps by hand.

## 3. Decide what is wrong

| The cause | Signs | What to do |
|---|---|---|
| **The application has a defect** | The steps by hand give the wrong result too. The case and the screen disagree. | Do not touch the expectation. Show the person the step, what the case says and what happens. When they confirm, they report it; mark the test `test.fail(true, '<bug id>: <what is wrong>')`. |
| **The application changed on purpose** | A new text, a moved button, a new step, and the team knows. | Update the page object or the spec, and the case's title in the inventory when its meaning changed. |
| **The test is wrong** | A locator that matches two elements or the wrong one, an assertion on shared data, a missing `await`, an order dependency. | Fix the test at its cause. Take the locator from a fresh snapshot. |
| **Timing** | Passes alone, fails in parallel or one run in several. An action fires before the page is ready, or a result is read before it arrives. | Find the event the test must wait for (an element, a response, a state) and wait for that. Never a fixed wait, a longer timeout or a retry. |
| **Data** | A record the test expects is gone or changed; a leftover of an earlier run is in the way. | Make the test own its data (`uniqueName`, `cleanup`). Never repair shared data by hand without asking. |
| **Environment or account** | Nothing answers, every test fails at sign-in, a `401` everywhere. | `npm run doctor`, `npm run auth`. If the environment is down, say so and stop: no test change fixes that. |

Say which cause it is, and the evidence, before editing.

## 4. Fix the smallest thing that is wrong

One cause, one change. No rewrite of the spec, no new helper, no clean-up of neighbours on the way.

## 5. Prove the fix

1. The test passes.
2. It passes ten times: `--repeat-each=10`.
3. The specs of the same area still pass: a changed page object can break its other users.
4. `npx tsc --noEmit`.

After two attempts that did not fix it, stop and tell the person what was tried, what the evidence shows and what is still unknown.

## 6. Report

The cause with its evidence, the change, the proof, and what the person should do when the application is at fault. A behaviour of the application that caused the failure and will meet other tests goes into `.claude/rules/app-<area>.md`.
