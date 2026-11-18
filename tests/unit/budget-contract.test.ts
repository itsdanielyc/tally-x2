import { expect, it } from "vitest";
import { validateCommand } from "../../contracts/validation";

it("accepts a monthly budget, explicit zero and removal", () => {
  for (const amount of [1234, 0, null]) {
    const command = { type: "budget.save", category: "Food", month: "2026-02", amount };
    expect(validateCommand(command)).toEqual(command);
  }
});

it("rejects invalid months and negative or fractional budgets", () => {
  for (const fields of [{ month: "2026-13", amount: 100 }, { month: "2026-01", amount: -1 }, { month: "2026-01", amount: 1.1 }]) {
    expect(() => validateCommand({ type: "budget.save", category: "Food", ...fields })).toThrow();
  }
});
