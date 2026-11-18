import { LEDGER_VERSION, type Ledger, type LedgerCommand, type Transaction } from "./ledger";
import { calendarDate, currencyValue, minorUnits, objectValue, textValue, transactionDraft } from "./primitives";

/** Parse each element, failing the entire file rather than silently dropping rows. */
function arrayValue<T>(value: unknown, parse: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) throw new Error("Expected a collection");
  return value.map(parse);
}

function transactionValue(value: unknown): Transaction {
  const fields = objectValue(value);
  return { ...transactionDraft(fields), id: textValue(fields.id, "Transaction ID") };
}

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}`);
}

/** Time O(n), space O(n): validate collections with indexed referential checks. */
function validateReferences(ledger: Ledger): Ledger {
  assertUnique(ledger.transactions.map((item) => item.id), "transaction ID");
  assertUnique(ledger.categories, "category");
  assertUnique(ledger.rules.map((item) => item.id), "rule ID");
  assertUnique(ledger.budgets.map((item) => JSON.stringify([item.category, item.month])), "budget");
  const categories = new Set(ledger.categories);
  const references = [...ledger.transactions.map((item) => item.category), ...ledger.rules.map((item) => item.category), ...ledger.budgets.map((item) => item.category)];
  if (references.some((name) => name !== null && !categories.has(name))) throw new Error("Unknown category reference");
  return ledger;
}

/** Decode version 1 or migrate the original version-zero integer schema. */
export function decodeLedger(value: unknown): Ledger {
  const fields = objectValue(value);
  if (fields.version !== 0 && fields.version !== LEDGER_VERSION) throw new Error("Unsupported ledger version; use a compatible Tally version");
  const transactions = arrayValue(fields.transactions, transactionValue);
  const oldCategories = [...new Set(transactions.flatMap((item) => item.category === null ? [] : [item.category]))];
  const categories = fields.version === 0 && fields.categories === undefined
    ? oldCategories : arrayValue(fields.categories, (item) => textValue(item, "Category"));
  const rules = arrayValue(fields.rules ?? [], (item) => {
    const rule = objectValue(item);
    return { id: textValue(rule.id, "Rule ID"), contains: textValue(rule.contains, "Rule text"), category: textValue(rule.category, "Rule category") };
  });
  const budgets = arrayValue(fields.budgets ?? [], (item) => {
    const budget = objectValue(item);
    const month = textValue(budget.month, "Month");
    calendarDate(`${month}-01`);
    const amount = minorUnits(budget.amount);
    if (amount < 0) throw new Error("Budget cannot be negative");
    return { month, amount, category: textValue(budget.category, "Budget category") };
  });
  return validateReferences({ version: LEDGER_VERSION, currency: currencyValue(fields.currency), transactions, categories, rules, budgets });
}

/** Runtime IPC validation is independent of the caller's TypeScript types. */
export function validateCommand(value: unknown): LedgerCommand {
  const command = objectValue(value);
  switch (command.type) {
    case "transaction.save": return {
      type: command.type, transaction: transactionDraft(command.transaction),
      ...(command.id === undefined ? {} : { id: textValue(command.id, "Transaction ID") }),
    };
    case "transaction.delete": return { type: command.type, id: textValue(command.id, "Transaction ID") };
    case "settings.currency": return { type: command.type, currency: currencyValue(command.currency) };
    default: throw new Error("Unknown ledger command");
  }
}
