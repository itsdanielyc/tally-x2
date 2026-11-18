import { expect, it } from "vitest";
import { defaultFilter, validateFilter } from "../../contracts/find";
import { validateCommand } from "../../contracts/validation";

it("accepts all filters and the single undo command", () => {
  const filter = { ...defaultFilter(), search: "Shop", category: "Food", dateFrom: "2026-01-01", dateTo: "2026-02-01", minimumAmount: -1234, maximumAmount: 0 };
  expect(validateFilter(filter)).toEqual(filter);
  expect(validateCommand({ type: "undo" })).toEqual({ type: "undo" });
});

it("rejects reversed bounds, invalid dates and fractional minor units", () => {
  expect(() => validateFilter({ ...defaultFilter(), dateFrom: "2026-02-01", dateTo: "2026-01-01" })).toThrow();
  expect(() => validateFilter({ ...defaultFilter(), minimumAmount: 1, maximumAmount: 0 })).toThrow();
  expect(() => validateFilter({ ...defaultFilter(), dateFrom: "2025-02-29" })).toThrow();
  expect(() => validateFilter({ ...defaultFilter(), minimumAmount: 1.1 })).toThrow();
});
