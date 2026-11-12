# 06 From manual cases to automated tests

Most projects start with a sheet: the sanity or regression list people go through by hand on every release. This page is about turning that list into tests in an order that pays off early.

## The inventory

`cases/inventory.csv` is the one list of everything that must be checked, automated or not. A row per check:

```csv
id,area,title,automation,priority,source,notes
TC-031,Invoices,Searching shows only the invoices of the customer typed,web,P1,Sanity row 44,
TC-032,Invoices,The PDF of an invoice follows the brand guide,manual,P3,Sanity row 51,A person judges the look
TC-033,Invoices,An overdue invoice shows the red badge,blocked,P2,Sanity row 52,Needs an invoice older than 30 days: ask for seed data
```

A test says which case it covers with a tag, `@TC-031`. That is the only link, and `npm run cases` reads it:

```
Cases: 86   automated: 14 of 58 (24%)   manual: 17   blocked: 11

Area      To automate  Automated  Manual  Blocked
Invoices           16          6       3        2
…
Next to automate:
  TC-035  P1  web  Invoices: A new invoice appears in the list with its total
```

The original sheet stays out of git, in `cases/source/` (ignored): sheets tend to name customers, tenants and bugs. The inventory keeps the checks only.

## Triage: decide for every case

`/triage-cases cases/source/<sheet>.xlsx` does this with you. The decisions are yours:

| `automation` | The case is… | Examples |
|---|---|---|
| `web` | something a person does in the browser, with a result that is a fact on the screen | a filter shows only matching rows; a saved change is still there after a reload; a report downloads |
| `api` | a rule, a calculation or data that the screen only displays | a total is the sum of its lines; a value outside the range is refused; a role may not delete |
| `manual` | a judgement | the design looks right; a chart "makes sense"; exploring a new feature |
| `blocked` | automatable, but something is missing | data no test can create; a state that occurs once a week; an element with no stable handle |

A `blocked` case always says what it waits for. The list of blocked cases is what you take to the team: it is the most useful thing a triage produces.

## Rewrite before you automate

A person can run a vague case. A machine cannot.

| In the sheet | In the inventory |
|---|---|
| Verify the filters work correctly | Filtering by category shows only the rows of that category |
| Verify the page loads correctly | The invoices page opens and lists the invoices of the current month |
| Verify the user can change the value | A changed value is shown after saving and after reloading the page |
| Verify the design is correct | `manual`: the page follows the design |

One row per check. A case that verifies five things becomes five rows, so a failure says which one broke. When the sheet does not say what must be true, do not invent it: note the question and ask.

## The order

Do not automate the sheet from the top. Ten to fifteen tests that run every day are worth more than a hundred half-finished ones.

1. **Signing in, and a smoke test per main page:** it opens and shows its main parts. This proves the setup and catches "the environment is down".
2. **The central flows, where no special data is needed:** create, change, delete the things the product is about.
3. **Checks with exact expected values:** calculations, validation messages, permissions. Many of them through the API.
4. **Downloads, exports, emails:** worth it, but each needs some groundwork.
5. **What is blocked,** as the team unblocks it.

Leave for people: looks, feel, and everything that changes every week.

## Keeping it honest

- A new feature gets its rows first, then its tests.
- A case is never deleted and an id never reused. A retired case stays, marked `manual` with the note `retired: <why>`.
- `npm run cases -- --check` is part of `npm run check`: it fails when a tag has no row, or a row says `manual` or `blocked` and a test exists.
- The sheet people still run by hand shrinks as tests arrive: tell the team which rows the nightly run now covers, with the `npm run cases` numbers.
