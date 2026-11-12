import { defineConfig, devices } from '@playwright/test';
import { env } from './config/env';

const isCI = !!process.env.CI;

/** On a read-only environment only tests tagged @readonly run, and nothing is recorded. */
const readOnlyOnly = env.readOnly ? /@readonly/ : undefined;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI
    ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: env.baseUrl,
    testIdAttribute: 'data-testid',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // Traces and screenshots show whatever is on the screen, so production keeps none.
    trace: env.readOnly ? 'off' : 'retain-on-failure',
    screenshot: env.readOnly ? 'off' : 'only-on-failure',
  },

  projects: [
    { name: 'setup', testMatch: /setup\/.*\.setup\.ts/, teardown: 'cleanup' },
    { name: 'cleanup', testMatch: /setup\/.*\.teardown\.ts/ },
    {
      name: 'web',
      testDir: './tests/web',
      grep: readOnlyOnly,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'api',
      testDir: './tests/api',
      grep: readOnlyOnly,
      dependencies: ['setup'],
    },
  ],

  webServer:
    env.name === 'local'
      ? {
          command: 'node demo-app/server.mjs',
          url: `${env.baseUrl}/health`,
          reuseExistingServer: !isCI,
        }
      : undefined,
});
