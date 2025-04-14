import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  reporter: [["html", { open: "never" }]],
});
