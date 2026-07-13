import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  testMatch: ['server-api.spec.ts'],
  use: {
    headless: true,
  },
  projects: [
    {
      name: 'electron',
      use: {
        browserName: 'chromium',
        launchOptions: {
          executablePath: path.join(__dirname, 'node_modules', '.bin', 'electron'),
        },
      },
    },
  ],
});
