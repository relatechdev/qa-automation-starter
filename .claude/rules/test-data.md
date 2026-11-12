---
paths:
  - 'tests/**/*.ts'
  - 'src/**/*.ts'
---

# Test data

Test environments are shared: colleagues test by hand there, and other runs go on at the same time. A test leaves the environment as it found it and never depends on what others do.

- **Every record a test creates has a name from `uniqueName('<label>')`**: `qa-auto-<label>-<random>`. The prefix tells people the record is a test's, and lets the cleanup find it. Where a record has no name, put the prefix in the field people see first.
- **Register the undo right after the create:** `cleanup.add(() => api.items.delete(item.id))`. The `cleanup` fixture runs the undos after the test, newest first, also when the test failed. Use the `…Response()` call when the test may have deleted the record already.
- **A record created through the UI** is undone by looking it up by its unique name: register `cleanup.add(...)` before the action that creates it.
- **Never change or delete a record the test did not create,** with the prefix or without. Another run may own it.
- **Never link a test's record to a real one** in a way that changes the real one (adding a test user to a real team, a test invoice to a real customer). If a case needs that, stop and ask.
- **The sweep after a run** (`tests/setup/cleanup.teardown.ts`) deletes prefixed records older than two hours, for the runs that crashed before their undo. A client joins it through `deleteTestData` and `Api.sweepable`.
- **Data that cannot be created by a test** (a report that takes a night to build, a tenant with a year of history) is described in `PROJECT.md` under Test data, with who maintains it. A case that needs it and does not have it is `blocked` in the inventory, with the reason.
- **On a read-only environment nothing is created.** `uniqueName()` throws there on purpose.
