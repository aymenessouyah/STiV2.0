import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.', testMatch: /browser-stories(?:-offline|-qr)?\.spec\.mjs/,
  timeout: 60_000, workers: 1, outputDir: '../test-results/stories',
  use: {
    baseURL: 'http://127.0.0.1:4185', trace: 'retain-on-failure',
    launchOptions: { ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) }
  },
  webServer: { command: 'node server-controle-v495.mjs', port: 4185, reuseExistingServer: false, timeout: 15_000 }
});
