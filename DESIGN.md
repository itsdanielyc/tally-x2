# Tally design decisions

<!-- keel:start -->
- A quiet ledger workspace: warm neutral background, dark ink, teal primary
  actions, readable numeric columns and visible labels. No decorative charts.
- Navigation separates transactions, import, categories, and monthly summary.
- Forms use native inputs and explicit errors; keyboard focus remains visible.
- Money is right aligned; spending and income are distinguished with words/signs.
- The browser test surface always displays a Mock badge; desktop displays Native.
- Empty states explain the next useful action. Destructive actions are explicit;
  undo feedback remains available immediately after eligible operations.
- Search/filter controls collapse under Find transactions and keep their values
  across list refreshes; export always uses the currently applied query.
- Notes use a multiline editor. DOM newline normalization must preserve untouched
  imported payee/category/note strings when another field is edited.
<!-- keel:end -->
