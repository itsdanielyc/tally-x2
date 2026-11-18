import { expect, it } from "vitest";
import { validateCommand } from "../../contracts/validation";

it("the shared contract accepts category and rule commands", () => {
  for (const command of [
    { type: "category.create", name: "Food" }, { type: "category.rename", name: "Food", to: "Groceries" },
    { type: "category.delete", name: "Food" }, { type: "category.merge", source: "Food", target: "Home" },
    { type: "rule.save", contains: "shop", category: "Food" }, { type: "rule.delete", id: "rule-1" }, { type: "rule.apply" },
  ]) expect(validateCommand(command)).toEqual(command);
});

it("category commands reject blank names and rules reject empty matches", () => {
  expect(() => validateCommand({ type: "category.create", name: "" })).toThrow();
  expect(() => validateCommand({ type: "rule.save", contains: " ", category: "Food" })).toThrow();
});
