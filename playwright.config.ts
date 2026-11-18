// L4/L5: UI tests in a real browser against the Vite dev server, where the
// labelled mock backend answers. Electron renders with Chromium, so chromium
// is the one engine; CI runs it on all three OS runners.
import { defineConfig, devices } from "@playwright/test";

const TEST_SERVER_PORT = 21427;
const TEST_SERVER_URL = `http://localhost:${TEST_SERVER_PORT}`;

export default defineConfig({
  testDir: "tests/ui",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  // One template for every snapshot kind. Pixel snapshots put the engine and
  // OS into their own name; ARIA and geometry snapshots are shared by design.
  snapshotPathTemplate: "{testDir}/__snapshots__/{testFileName}/{arg}{ext}",
  expect: {
    toHaveScreenshot: {
      // Per-OS baselines still see antialiasing noise; allow a little.
      maxDiffPixelRatio: 0.002,
      animations: "disabled",
      caret: "hide",
    },
  },
  use: {
    baseURL: TEST_SERVER_URL,
    viewport: { width: 1024, height: 700 },
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 700 } } },
  ],
  webServer: {
    command: `npm run dev:web -- --strictPort --port ${TEST_SERVER_PORT}`,
    url: TEST_SERVER_URL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
