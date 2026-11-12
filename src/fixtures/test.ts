import { test as base } from '@playwright/test';
import { env } from '@config/env';
import { Api } from '../api/api';
import { App } from '../pages/app';

/** Collects what a test must undo, and undoes it after the test, newest first. */
export interface Cleanup {
  add(undo: () => Promise<unknown>): void;
}

interface Fixtures {
  /** Who the test is signed in as: a role of the environment, or `anonymous` for nobody. */
  role: string;
  /** The application's page objects. */
  app: App;
  /** The API clients, signed in as the same role. */
  api: Api;
  cleanup: Cleanup;
  readOnlyGuard: void;
}

export const test = base.extend<Fixtures>({
  role: ['user', { option: true }],

  storageState: async ({ role }, use) => {
    await use(role === 'anonymous' ? { cookies: [], origins: [] } : env.authFile(role));
  },

  app: async ({ page }, use) => {
    await use(new App(page));
  },

  api: async ({ request }, use) => {
    await use(new Api(request));
  },

  cleanup: async ({}, use, testInfo) => {
    const undos: Array<() => Promise<unknown>> = [];
    await use({ add: (undo) => undos.push(undo) });
    for (const undo of undos.reverse()) {
      try {
        await undo();
      } catch (error) {
        testInfo.annotations.push({ type: 'cleanup failed', description: String(error) });
      }
    }
  },

  readOnlyGuard: [
    async ({}, use, testInfo) => {
      testInfo.skip(
        env.readOnly && !testInfo.tags.includes('@readonly'),
        `"${env.name}" is read-only and this test is not tagged @readonly`,
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
