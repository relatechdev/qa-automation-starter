---
name: review-tests
description: Reviews the tests changed on this branch before a pull request, against this repository's rules, and reports findings by severity with the file, the line and the fix. Use when the person asks for a review of tests, or before opening a pull request.
argument-hint: '[files, or nothing for the whole branch]'
---

# Review tests: $ARGUMENTS

Review, do not fix. The person decides what to change; `/fix-test` or a direct request does the changing.

## 1. What changed

- `git fetch origin`, then `git diff origin/main...HEAD --stat` plus `git status` for what is not committed. With arguments, review only those files.
- Read each changed spec, page object and client in full, not only the changed lines, and the rule files they fall under.

## 2. Run the checks that need no judgement

`npm run check`, and the changed specs once: `npx playwright test <files>`. A failure here is the first finding.

## 3. Read with these questions

**High: the test can mislead**

- Can it fail? An assertion that is always true, no assertion at all, an `if` that skips the check, a `try`/`catch` that swallows the failure.
- Does it check what its case states? Compare the assertions with the row of its tag in `cases/inventory.csv`.
- Does it depend on something it does not own: another test, the order, a total of shared data, a record with a fixed name?
- A password, a token, a real person's or a customer's data, or a full URL of an environment in the code.
- A write on a read-only environment, or `@readonly` on a test that changes something.
- A fixed wait, `networkidle`, `force: true`, a raised timeout or retries used to get past a failure.

**Medium: it will break or cost time**

- A locator that is not role, label, text or test id, or that is not narrowed enough to match one element.
- Data without `uniqueName()` or without a registered undo.
- A page object with assertions, API calls or test data; a spec with raw locators that belong in a page object.
- A test covering several behaviours, so one failure hides the others.
- Something written again that `src/pages/`, `src/api/` or a neighbouring spec already has.
- A missing case tag, a tag without a row, a renamed test.
- `test.fail`, `test.fixme` or `test.skip` without a bug id or a reason.

**Low: it reads badly**

- A title that does not state the behaviour; steps that do not read as prepare, act, assert.
- Names that do not say what the element is; comments that repeat the code.

## 4. Report

For each finding: severity, `file:line`, what is wrong in one sentence, and the fix. Highest first. Leave out what is only taste.

End with a verdict: ready for a pull request, or the findings that must be fixed first. If nothing is wrong, say so in one line.
