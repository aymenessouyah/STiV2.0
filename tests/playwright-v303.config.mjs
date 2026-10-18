import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'browser-v303-device.spec.mjs',
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    serviceWorkers: 'block',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node server-v302.mjs',
    port: 4173,
    reuseExistingServer: true,
    timeout: 15_000
  }
});
