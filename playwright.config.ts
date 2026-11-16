import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./playwright",
  testMatch: "**/*.pw.ts",
  timeout: 60_000,
  expect: {
    timeout: 30_000,
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 800 },
    baseURL: "http://127.0.0.1:5177",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "bun run build:site && bun run preview:cosmos",
    url: "http://127.0.0.1:5177/renderer.html",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
