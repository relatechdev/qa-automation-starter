# 07 Working with Claude

Claude Code writes, runs and repairs tests in this repository with you. It works well here because the repository tells it how the team works. Your part is to give it the case, answer its questions and check what it hands back.

## Start in this folder

Open a terminal in the repository's folder and run `claude`, and accept the question about trusting the folder the first time. Only then do the rules, the skills and the guards of `.claude/` all load. A line at the start of the session says where the checkout stands: what is missing, what comes next.

## The commands

Type them in Claude. Each is a procedure Claude follows step by step (`.claude/skills/<name>/SKILL.md`).

| Command | What Claude does |
|---|---|
| `/guide` | Says where you stand and what the next step is. |
| `/guide how do I run one test?` | Answers a question from these docs, in your language. |
| `/check-setup` | Runs `npm run doctor` and walks through every fix. |
| `/triage-cases cases/source/sanity.xlsx` | Reads the sheet, writes the inventory, proposes what to automate first and lists the questions for the team. |
| `/new-web-test TC-012` | Reads the case, looks at the live page, writes the page object and the spec, runs it, makes it fail once, runs it five times. |
| `/new-api-test TC-030` | The same for an API case: learns the endpoint from its documentation or from the calls the page makes. |
| `/fix-test tests/web/invoices/invoices-search.spec.ts` | Finds why it fails and says whose fault it is, before changing anything. |
| `/review-tests` | Reviews the tests of your branch and lists findings by severity. |

You can also just ask in your own words: "why does the search test fail only in the pipeline?", "add a test for an empty search to the invoices spec".

## A normal session

```
You:     /new-web-test TC-031
Claude:  TC-031: searching shows only the invoices of the customer typed.
         One question: should the match be on the whole name or on a part of it?
You:     a part of it
Claude:  (opens the invoices page signed in, reads its structure, finds the search box and the rows,
          sees the page call GET /api/invoices?q=…)
         (adds search() and row() to InvoicesPage, writes the spec, runs it: passes)
         (changes the expected count to 2: fails at the assertion; restores it)
         (runs it five times: 5 passed)
         Done: tests/web/invoices/invoices-search.spec.ts covers TC-031.
         Proof it can fail: expecting 2 rows failed with "expected 2, received 1".
         One thing looked odd: the search is case-sensitive. Is that intended?
```

## What Claude does by itself, and what it asks

- **By itself:** reading files, running tests and checks, driving a browser against the test environment, editing specs, page objects and clients.
- **With your yes:** installing a package, committing, pushing, opening a pull request, running against a read-only environment.
- **Never:** opening `.env` or `.auth/`, pushing to `main`, writing a password anywhere.

The guards in `.claude/hooks/` enforce part of this: they refuse the read, or put the command in front of you.

## Check its work

Claude is fast and usually right. "Usually" is why you check. A test that passes proves little: a test that checks nothing also passes.

1. **Read the test.** Does it do what the case says? Is the assertion the case's expected result, exactly?
2. **Look for the proof.** Claude reports the change that made the test fail. If the report has none, ask for it, or do it yourself: change the expected value and run.
3. **Run it yourself once in UI mode** (`npm run test:ui`) and watch. You will see at once if it clicks the wrong thing.
4. **Read the diff before committing.** Only the files of this task should have changed.
5. **`/review-tests`** gives a second opinion from a fresh look.

When Claude is wrong, say what you see ("the test clicks the first row, the case is about the row I created") and it corrects course. When it is wrong the same way twice, the rule is missing: ask it to add the rule to `.claude/rules/`.

## Passwords and data

- Accounts are typed into `.env` by you. Never paste a password, a token or a customer's data into the chat. If it happens, change the password.
- Claude sees the test environment through the browser it drives. On an environment with real data, do not ask it to open pages that show personal data unless your project allows it ([03 Project intake](03-project-intake.md)).
- Reports and traces stay on your machine or in the pipeline's artifacts.

## What Claude knows, and how it learns

| It knows | From |
|---|---|
| how this team writes tests | `CLAUDE.md` and `.claude/rules/` |
| this project: addresses, roles, data rules | `PROJECT.md` |
| how one area of the application behaves | `.claude/rules/app-<area>.md`, written as tests in that area are added |
| what must be tested | `cases/inventory.csv` |

It does not remember yesterday's conversation. What should last is written into one of those files, by Claude or by you, and reviewed like code.

## Good requests

- Name the case: `/new-web-test TC-031`, not "write some tests for invoices".
- One thing at a time. A case, then the next.
- Say what you already know: "the list loads in two steps, the totals arrive later".
- Ask for the reason: "why this locator?", "why through the API?". The answers are how you learn the craft.
