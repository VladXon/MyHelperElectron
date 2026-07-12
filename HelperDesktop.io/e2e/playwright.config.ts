import { defineConfig } from '@playwright/test';
import path from 'node:path';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  retries: 1,
  use: {
    headless: true,
  },
  projects: [
    {
      name: 'electron',
      use: {
        browserName: 'chromium',
        launchOptions: {
          executablePath: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
        },
      },
    },
  ],
});
