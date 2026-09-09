import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: 'https://localhost:4173',
    ignoreHTTPSErrors: true, // Ephemeral localhost certificate, not a production trust claim.
    browserName: 'chromium',
    locale: 'id-ID',
    trace: 'off', // Never persist credential-bearing network traces or storageState.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {},
  },
  projects: [
    { name: 'tablet', use: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true }, testMatch: 'session.spec.ts' },
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } }, testMatch: 'responsive.spec.ts' },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, testMatch: 'responsive.spec.ts' },
  ],
})
