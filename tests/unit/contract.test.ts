// Label and platform metadata remain visible in the browser test surface.
// Ledger parity lives in ledger-contract.test.ts and feature contract suites.
import { describe, expect, it } from "vitest";
import { mock } from "../../src/api";

describe("mock backend conformance", () => {
  it("labels itself as a mock", () => {
    expect(mock.kind).toBe("mock");
  });

  it("reports a platform shape the UI can render", async () => {
    const info = await mock.platformInfo();
    expect(info).toMatchObject({ os: expect.any(String), arch: expect.any(String) });
  });
});
