import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.', testMatch: 'browser-reconnexion-maj.spec.mjs', timeout: 90_000, workers: 1,
  outputDir: '../test-results/reconnexion-maj',
  use: {
    serviceWorkers: 'allow', trace: 'retain-on-failure',
    launchOptions: { ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) }
  }
});
