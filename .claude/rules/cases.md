---
paths:
  - 'cases/**'
---

# The case inventory

`cases/inventory.csv` lists every case of the project, automated or not. It is the link between what people test by hand and what the specs cover; `npm run cases` compares the two.

```csv
id,area,title,automation,priority,source,notes
TC-031,Invoices,Searching shows only the invoices of the customer typed,web,P1,Sanity row 44,
TC-032,Invoices,The PDF of an invoice follows the brand guide,manual,P3,Sanity row 51,A person judges the look
TC-033,Invoices,An overdue invoice shows the red badge,blocked,P2,Sanity row 52,Needs an invoice older than 30 days: ask for seed data
```

| Column | Meaning |
|---|---|
| `id` | `TC-` and at least three digits. Given once, never reused, never renumbered: specs carry it as a tag. |
| `area` | The part of the application, as its people call it. Specs are grouped the same way. |
| `title` | One checkable statement: what is done and what must be true after. Not `verify filters work`. |
| `automation` | `web` (through the browser), `api` (against the API), `manual` (a person must judge), `blocked` (cannot be automated yet). |
| `priority` | `P1` the application is unusable without it, `P2` a main feature, `P3` an edge or a detail. |
| `source` | Where the case came from: the sheet and row, a ticket, a requirement. |
| `notes` | For `blocked`, what it waits for. For `manual`, why. Open questions start with `?`. |

- A field with a comma or a quote is wrapped in double quotes, and a quote inside it is doubled.
- Whether a case is automated is not written here: a spec tagged `@TC-031` says so. `npm run cases -- --check` fails when a tag has no row, or a `manual` or `blocked` row has a test.
- One row per check. A manual case that verifies five things becomes five rows.
- A case is never deleted when the feature goes away: mark it `manual` with the note `retired: <why>`, so its id is not used again.
- No customer's or tenant's name, no person's data, no password in any column.
