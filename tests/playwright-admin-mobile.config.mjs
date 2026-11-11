import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['browser-admin-mobile.spec.mjs', 'browser-admin-labo3-mobile.spec.mjs'],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    serviceWorkers: 'block',
    launchOptions: {
      ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {})
    }
  },
  webServer: {
    command: 'node server-v302.mjs',
    port: 4173,
    reuseExistingServer: true,
    timeout: 15_000
  }
});
