import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.', testMatch: 'browser-quiz-restauration-v495.spec.mjs', timeout: 75_000, workers: 1,
  outputDir: '../test-results/quiz-restauration-v495',
  use: { baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'block', trace: 'retain-on-failure',
    launchOptions: { ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) } },
  webServer: { command: 'node server-v302.mjs', port: 4173, reuseExistingServer: true, timeout: 15_000 }
});
