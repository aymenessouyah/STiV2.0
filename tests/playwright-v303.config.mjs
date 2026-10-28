import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'browser-v303-device.spec.mjs',
  timeout: 30_000,
  fullyParallel: false,
  use: {
    // Éviter le mode portable activé sur localhost et tester le vrai contrôle machine.
    baseURL: 'http://127.0.0.2:4173',
    serviceWorkers: 'block',
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
