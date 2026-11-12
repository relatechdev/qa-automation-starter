---
name: new-web-test
description: Writes the browser test of one or more cases of the inventory. Looks at the live application for the real locators, reuses the page objects and clients that exist, runs the test until it passes, proves it can fail and checks it for flakiness. Use when the person asks to automate a case in the browser.
argument-hint: '<TC-id> [TC-id …]'
---

# New browser test: $ARGUMENTS

Read `.claude/rules/web-tests.md`, `page-objects.md` and `test-data.md` before writing, and the `app-<area>.md` rule of the area when one exists.

## 1. Understand the case

- Find the row of each id in `cases/inventory.csv`. No id given: take the top of "Next to automate" in `npm run cases` and confirm it with the person. No row yet: add it first (`.claude/rules/cases.md`).
- Say back in one or two lines what will be done and what must be true after. If the expected result is not stated, or two readings give different tests, ask one question now.
- A case marked `manual` or `blocked` is not automated here: say why it is marked so, and what would change that.

## 2. Check the ground

- `npm run doctor` ends with `Ready.`, and `.auth/` holds a signed-in state (`npm run auth` renews it).
- The environment is not read-only, unless the test will only look and carry `@readonly`.

## 3. Look at the application

Walk through the case by hand in a browser Claude drives, signed in with the saved state:

```bash
npx playwright cli open <base URL>
npx playwright cli state-load .auth/<environment>-<role>.json
npx playwright cli goto <base URL><path>
npx playwright cli snapshot
```

Then `click`, `fill`, `select` with the refs of the snapshot, and `snapshot` again after each step (the `playwright-cli` skill has every command). Collect, for every element the test needs: its role and name, or its label, or its test id (`eval "el => el.getAttribute('data-testid')" <ref>`). Note what appears only after a moment, what text changes, and what `requests` shows the page calling: an API call found here is the way to prepare data.

`npx playwright cli close` when done. Nothing is guessed: a locator not seen in a snapshot is not written.

## 4. Reuse

Search before adding: `src/pages/` for a page object or a locator of this page, `src/api/` for a client that creates the data, the specs of the same area for a step done before. Extend what exists; add a class only for a page or a resource that has none.

## 5. Write

- **Page object:** the new locators and actions, in the order of `page-objects.md`. Register a new page in `App`.
- **Data:** created by the test through the API when a client exists, named with `uniqueName()`, undone with `cleanup.add(...)` on the next line.
- **Spec:** `tests/web/<area>/<area>-<feature>.spec.ts`, tagged with the case id. The assertions are the "must be true after" of the case, nothing weaker and nothing extra.

## 6. Run, then prove

1. `npx playwright test <file> --project=web`. When it fails, read the error and look at the application again; fix the cause. Never add a wait, a `force` or a retry to get past it.
2. **Make it fail once.** Change the expected value, or skip the step that should produce it, run, see the test go red at the assertion, and restore. If it still passes, the test checks nothing: rewrite the assertion.
3. `npx playwright test <file> --project=web --repeat-each=5`. Every run passes.
4. `npm run cases -- --check` and `npx tsc --noEmit`.

If the application does not do what the case says, stop. Show the person what happens instead, with the step and the screen. A confirmed defect is reported by them, and the test keeps the case's expectation, marked `test.fail(true, '<bug id>: <what is wrong>')`.

## 7. Keep what was learned

A behaviour of this area that the next test will also meet (a list that loads in two steps, a toast that hides a button, a route with an id) goes into `.claude/rules/app-<area>.md` with `paths:` for that area's specs and page objects. A fact about the project goes into `PROJECT.md`.

## 8. Report

- The cases covered, and the file.
- What was looked at in the application, and which page objects or clients were added or reused.
- The proof: the change that made it fail, and the five green runs.
- Open questions, and anything in the application that looked wrong.

No commit unless the person asks.
