import type { LedgerCommand } from "./ledger";
import { textValue } from "./primitives";

/** Shape validation stays at the seam; category existence belongs to the domain. */
export function categoryCommand(command: Record<string, unknown>): LedgerCommand {
  switch (command.type) {
    case "category.create": return { type: command.type, name: textValue(command.name, "Category") };
    case "category.rename": return { type: command.type, name: textValue(command.name, "Category"), to: textValue(command.to, "New category") };
    case "category.delete": return { type: command.type, name: textValue(command.name, "Category") };
    case "category.merge": return { type: command.type, source: textValue(command.source, "Source category"), target: textValue(command.target, "Target category") };
    case "rule.save": return { type: command.type, contains: textValue(command.contains, "Rule text"), category: textValue(command.category, "Rule category"),
      ...(command.id === undefined ? {} : { id: textValue(command.id, "Rule ID") }) };
    case "rule.delete": return { type: command.type, id: textValue(command.id, "Rule ID") };
    case "rule.apply": return { type: command.type };
    default: throw new Error("Unknown ledger command");
  }
}
