import fs from 'node:fs';
import { test as base, type Browser, type BrowserContext } from '@playwright/test';
import { env } from '@config/env';
import { Api } from '../api/api';
import { captureApiToken, isFresh } from '../api/api-auth';
import { signIn } from '../helpers/sign-in';
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

interface WorkerFixtures {
  /** A browser for signing in and taking tokens, launched only when one of them is needed. */
  authBrowser: () => Promise<Browser>;
  /** With `signInPerWorker`: the file of a role's session in this worker, signed in on first use. */
  workerSession: (role: string) => Promise<string>;
  /** With `apiAuth: "bearer"`: a role's access token in this worker, taken again before it expires. */
  apiToken: (role: string) => Promise<string>;
}

const signedOut = { cookies: [], origins: [] };

async function signedInContext(browser: Browser, role: string): Promise<BrowserContext> {
  const context = await browser.newContext({ baseURL: env.baseUrl, storageState: signedOut });
  const page = await context.newPage();
  await signIn(page, role);
  await page.close();
  return context;
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  authBrowser: [
    async ({ playwright }, use) => {
      let browser: Promise<Browser> | undefined;
      await use(() => (browser ??= playwright.chromium.launch()));
      if (browser) await (await browser).close();
    },
    { scope: 'worker' },
  ],

  workerSession: [
    async ({ authBrowser }, use, workerInfo) => {
      const files = new Map<string, Promise<string>>();
      await use((role) => {
        let file = files.get(role);
        if (!file) {
          file = authBrowser()
            .then((browser) => signedInContext(browser, role))
            .then(async (context) => {
              const path = env.authFile(`${role}-worker-${workerInfo.workerIndex}`);
              await context.storageState({ path });
              await context.close();
              return path;
            });
          files.set(role, file);
        }
        return file;
      });
      for (const file of files.values()) {
        const path = await file.catch(() => undefined);
        if (path) fs.rmSync(path, { force: true });
      }
    },
    { scope: 'worker' },
  ],

  apiToken: [
    async ({ authBrowser }, use) => {
      // A session of its own per role, so taking a token never uses up a test's session.
      const contexts = new Map<string, Promise<BrowserContext>>();
      const tokens = new Map<string, string>();
      await use(async (role) => {
        const cached = tokens.get(role);
        if (cached && isFresh(cached)) return cached;
        let context = contexts.get(role);
        if (!context) {
          context = authBrowser().then((browser) =>
            env.signInPerWorker
              ? signedInContext(browser, role)
              : browser.newContext({ baseURL: env.baseUrl, storageState: env.authFile(role) }),
          );
          contexts.set(role, context);
        }
        const token = await captureApiToken(await context);
        tokens.set(role, token);
        return token;
      });
      for (const context of contexts.values()) {
        await (await context.catch(() => undefined))?.close();
      }
    },
    { scope: 'worker' },
  ],

  role: ['user', { option: true }],

  storageState: async ({ role, workerSession }, use) => {
    if (role === 'anonymous') await use(signedOut);
    else if (env.signInPerWorker) await use(await workerSession(role));
    else await use(env.authFile(role));
  },

  context: async ({ context, role, workerSession }, use) => {
    await use(context);
    // An application that renews its session on use retires the saved one: keep the new one.
    if (env.signInPerWorker && role !== 'anonymous') {
      await context.storageState({ path: await workerSession(role) });
    }
  },

  app: async ({ page }, use) => {
    await use(new App(page));
  },

  api: async ({ request, playwright, role, apiToken }, use) => {
    if (env.apiAuth === 'cookies' || role === 'anonymous') {
      await use(new Api(request));
      return;
    }
    const authorised = await playwright.request.newContext({
      // Only the token authorises the calls: no cookie rides along to hide a token that fails.
      storageState: signedOut,
      extraHTTPHeaders: { Authorization: `Bearer ${await apiToken(role)}` },
    });
    await use(new Api(authorised));
    await authorised.dispose();
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
