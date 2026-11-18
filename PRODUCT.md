# Tally

Tally is a desktop expense ledger for one person who wants to know where
the household money goes without connecting a bank or creating an account.
Type transactions in or import the CSV a bank exports, sort them into
categories, and see each month against a budget. Everything stays in one
local file.

## Audience

One person on their own computer. Comfortable downloading a CSV from a
bank's website; not an accountant. Uses Windows, macOS or Linux.

## Jobs

1. Record a transaction in a few seconds: date, payee, amount, category, note.
2. Import a bank's CSV export without editing it in a spreadsheet first.
3. Sort transactions into categories, by hand and by simple payee rules.
4. See a month: spending per category, income against spending, and how
   each category stands against its budget.
5. Find past transactions and take a filtered set out as CSV.

## Surfaces

- A desktop app for Windows x64, macOS Apple silicon and Linux x64.
- The browser build of the same UI exists for tests only and runs against
  the labelled mock. It is not a product surface.

## Data

- One ledger file in the user's application data directory. No network use.
- Amounts are whole minor units (cents) in a single currency chosen in
  settings. No floating-point money anywhere.
- The file has a version number and older versions keep opening.
- A crash or power loss during a save never leaves a ledger that will not
  open.

## Success criteria

- A transaction typed in is still there, unchanged, after the app restarts.
- A 2,000-row bank CSV imports in under five seconds and every rejected row
  is listed with its line number and the reason.
- Importing the same file twice adds nothing the second time.
- Monthly totals equal the sum of the transactions shown for that month, to
  the cent, for any mix of income and spending.
- An exported CSV imports back into an empty ledger as the same transactions.
- Delete, merge and import can each be undone once, immediately afterwards.

## Non-goals

Bank connections, multiple currencies or conversion, accounts and sync,
several ledgers, mobile, investment tracking, reports beyond the monthly
summary, charts beyond simple bars, sharing between people.

## Risks

- Bank CSVs vary: delimiters, quoted fields, date orders, decimal commas,
  a debit and a credit column instead of one signed amount.
- Money arithmetic and month boundaries are easy to get subtly wrong.
- A ledger is years of someone's records; losing or corrupting it is the
  worst failure the product has.

## Provenance

| Looked at | What it settled |
|---|---|
| The owner's description of the product | Audience, jobs and non-goals |
| Sample CSV exports with comma and semicolon delimiters | The import risks listed above |
