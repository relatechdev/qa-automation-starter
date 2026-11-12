# 03 Project intake

What to ask for before automating a project. Most of it is not yours to decide, and waiting for it is normal. Ask for everything at once, start with the minimum, and keep the open items in `PROJECT.md` under "Open questions".

## The minimum to write the first test

1. **Permission.** The application and its data belong to the company. Ask, in writing: may the tests be written with an AI assistant, with which account, and what must never be shown to it? May automated tests run against the test environment?
2. **A test environment's address** that stays up and gets every new version.
3. **One test account** on it.

## Everything to ask for

| What | Why it matters | Who usually has it |
|---|---|---|
| Permission to use Claude on this project, and the rules for it | The code, the screens and the cases are the company's. Use the account the company approves, never a private one. | project or engineering lead |
| Where the tests live: a repository and write access | Tests are code and are reviewed like code. A repository of their own is fine to begin with; later they should run in the same pipeline as deployments. | engineering lead |
| The framework the developers already use, if any | Use theirs when it exists. Otherwise Playwright with TypeScript, as here. | developers |
| The environments: addresses, which one gets which version, when they are reset | A test is only as stable as its environment. | DevOps, developers |
| A tenant, organisation or workspace only for automation | Tests create and delete data. Sharing a space with manual testers makes both unreliable. | product owner, developers |
| A way to create and reset data: an API, a seed script | Cases that need special data (a year of history, an overdue invoice) are blocked without it. | developers |
| Test accounts for each role, without a second factor on test environments, or with a way around it | A machine cannot read a code from a phone. | DevOps, security |
| The API's documentation (OpenAPI, a Postman collection) | Rules and calculations are checked faster and more reliably against the API. It also prepares data for browser tests. | developers |
| Test ids on the elements that have no name or label (`data-testid`) | Without stable handles, tests break with every redesign. | front-end developers |
| A pipeline runner and a place for secrets | Tests that only run on your machine are forgotten. | DevOps |
| The rule for production: read-only smoke tests, or nothing | Production holds real customers' data. | product owner, engineering lead |
| Whether a VPN, an allow-listed address or a captcha stands in the way | The pipeline's machines are outside the office network. | DevOps, security |
| How email, SMS and payments behave on test environments | A sign-up test needs to read the email; a payment test needs a sandbox. | developers |
| Feature flags, time zones, scheduled jobs that change what a page shows | A number that is recalculated every night needs a test that knows it. | developers, product owner |
| The manual cases and who owns them | They are the source of the inventory. | QA lead |
| The bug tracker, and how a defect found by a test is reported | A failing test is a bug report waiting to be written. | QA lead |
| Browsers and screen sizes that count | Chromium on a desktop is the default; add others only when someone needs them. | product owner |
| Someone who reviews the test code | Especially in the first weeks. | a developer |

## A message to send

> To automate the sanity cases of <project>, I need a few things. Can you tell me who can help with each?
>
> 1. Confirmation that I may write the tests with Claude (an AI assistant), with a company-approved account, and that automated tests may run against <environment>.
> 2. A repository for the tests, or access to the existing one.
> 3. A workspace or tenant on <environment> used only by automation, and one account per role in it, without a second factor.
> 4. The API documentation, and a way to create test data through it.
> 5. `data-testid` attributes on elements without a visible name. I will send a list as I meet them.
> 6. Where the tests should run in the pipeline, and who sets up its secrets.
>
> I can begin with the address and one account while the rest is arranged.
