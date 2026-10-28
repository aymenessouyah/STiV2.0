import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'browser-v302.spec.mjs',
  timeout: 30_000,
  fullyParallel: false,
  use: {
    // 127.0.0.1 active le mode portable local dans les scripts historiques.
    // Cette autre adresse de loopback exerce le parcours réseau sans serveur externe.
    baseURL: 'http://127.0.0.2:4173',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
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
