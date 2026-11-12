# 01 Basics

## What an automated test is

Code that checks other code. Instead of opening the application and clicking through a case by hand, you write the case once as a small program. The program does the steps, compares what happened with what should happen, and says pass or fail. It runs in seconds, as often as you like, the same way every time.

Every test has three parts:

```ts
test('a wrong password is refused with a message', async ({ app }) => {
  // prepare: get to the starting point
  await app.login.open();

  // act: do what the case is about
  await app.login.signIn('someone@example.test', 'not-the-password');

  // assert: compare what is there with what should be there
  await expect(app.login.error).toHaveText('Wrong email or password.');
});
```

If the message is missing or different, the test fails and shows where.

## Why bother

- **Regression.** The value of a test is not the day it is written. It is the day, months later, when a change somewhere else breaks this feature and the test says so within minutes.
- **Repetition.** A sanity list that takes a person half a day per environment takes a run a few minutes, on every environment, after every deployment.
- **Time for real testing.** What a machine can repeat, it repeats. People explore, judge and think of the cases nobody wrote down.

## The kinds of tests

| Kind | What it checks | Speed | Who writes it | Where it lives |
|---|---|---|---|---|
| Unit | one function or class, alone | milliseconds | developers | in the application's repository |
| Integration | code together with real parts: database, storage | seconds | developers | in the application's repository |
| API | the application's interface for programs: a request and its answer | fast | QA and developers | here, `tests/api/` |
| End-to-end (E2E) | the application as a person uses it, in a real browser | slow | QA | here, `tests/web/` |
| Smoke | a handful of E2E or API tests: is it up, do the main paths work? | minutes | QA | here, tagged `@smoke` |
| Performance, security, visual | speed under load, weaknesses, pixels | varies | specialists, later | their own tools |

Picture a pyramid: many unit tests at the bottom, fewer integration and API tests in the middle, a few end-to-end tests on top. The higher a test sits, the more it covers at once, and the slower, costlier and more fragile it is. So a check goes to the lowest level that can prove it: a calculation is checked against the API, and only one browser test shows that the screen displays the number.

## What QA automates here

- **End-to-end tests** for the flows people really use: signing in, the main pages, creating and changing the things the product is about.
- **API tests** for rules, calculations, validation and permissions.
- **A smoke set** that runs after every deployment.

What stays with people: whether a design looks right, whether a flow feels right, and exploring for what no case describes. Automation does not replace testing. A test checks exactly what its assertions say and nothing else.

## Words you will meet

| Word | Meaning |
|---|---|
| Spec | a file of tests, `something.spec.ts` |
| Assertion | the comparison a test makes: `expect(…).toHaveText(…)` |
| Locator | how a test finds an element: "the button named Save" |
| Page object | a class that knows one page: where its elements are and what one can do there |
| Fixture | something a test gets ready-made: a signed-in browser, the page objects, the API clients |
| Environment | a running copy of the application: dev, staging, production |
| Flaky | a test that sometimes passes and sometimes fails without any change. A flaky test is a broken test. |
| Regression | something that worked and no longer does |
| CI | the pipeline: a server that runs checks and tests by itself |
| Trace | a recording of a test run: every step, screen and network call, to see why it failed |
