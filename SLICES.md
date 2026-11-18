# Slices for Tally v0.1.0

This list is fixed. `PLAN.md` uses exactly these slices, in this order, and
adds each slice's "done when", levels and owner. Nothing outside this list
is built. Tally is finished when every slice is done.

| # | Slice | What the person can do afterwards |
|---|---|---|
| 0 | Scaffold | Nothing yet: the `electron-web` scaffold is green on every Tier 1 platform. |
| 1 | Record transactions | Add, edit and delete a transaction (date, payee, amount, optional category, optional note). The list shows newest first. Amounts are whole minor units in the one currency set in settings. The ledger is saved to a versioned local file with crash-safe writes and is unchanged after a restart. |
| 2 | Import a bank CSV | Pick a CSV file. Tally detects the delimiter and the header row, and the person maps columns to date, payee and amount (one signed amount column, or separate debit and credit columns) and picks the date order. A preview shows the first rows as they will be imported. Rows that cannot be read are listed with line number and reason. Rows identical to an existing transaction in date, amount and payee are skipped and counted. Confirming imports all accepted rows together or none. |
| 3 | Categories and rules | Create, rename, delete and merge categories. Deleting a category leaves its transactions uncategorised. A rule says "payee contains this text, use this category"; rules apply to imported rows and, on request, to every uncategorised transaction. |
| 4 | Monthly summary and budgets | For a chosen month: total per category, income against spending, and a monthly budget per category with the amount left or over. Move to the previous and next month. |
| 5 | Find, export, undo | Search payee and note text; filter by category, date range and amount range. Export the transactions currently shown to a CSV that Tally's own import reads back unchanged. Undo the most recent delete, category merge or import, once. |
| 6 | Release readiness | Version 0.1.0 is ready to tag: everything the Keel release checklist requires before the tag is done and recorded. The tag itself and the GitHub release are not created. |
