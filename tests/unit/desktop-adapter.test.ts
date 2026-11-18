import { expect, it, vi } from "vitest";

it("a desktop page without its preload bridge cannot silently save into the mock", async () => {
  vi.stubGlobal("window", { location: { protocol: "file:" } });
  vi.resetModules();
  try {
    const { backend } = await import("../../src/api");
    await expect(backend.snapshot()).rejects.toThrow(/connection.*unavailable/i);
    expect(backend.kind).toBe("native");
  } finally { vi.unstubAllGlobals(); vi.resetModules(); }
});
