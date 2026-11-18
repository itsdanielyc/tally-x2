import type { Ledger, LedgerCommand } from "../contracts/ledger";
import { applyCategoryCommand } from "../domain/categories";
import { importCsv } from "../domain/csv";
import { applyRuleCommand } from "../domain/rules";
import { applyTransactionCommand } from "../domain/transactions";

/** One command orchestrator selects pure transformations; persistence stays in service. */
export function deriveLedger(ledger: Ledger, command: LedgerCommand, createId: () => string): Ledger {
  if (command.type === "csv.import") return importCsv(ledger, command, createId);
  const next = applyTransactionCommand(ledger, command, createId)
    ?? applyCategoryCommand(ledger, command) ?? applyRuleCommand(ledger, command, createId);
  if (!next) throw new Error("Unknown ledger command");
  return next;
}
