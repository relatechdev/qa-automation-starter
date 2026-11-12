import { test as setup } from '@playwright/test';
import { env } from '@config/env';
import { signIn } from '@/helpers/sign-in';

// Signs in once per role and keeps the browser state, so tests start signed in. With
// signInPerWorker the tests sign in for themselves; this still stops a run with a wrong
// account at once, and its state serves "npx playwright cli state-load".
for (const role of env.roles) {
  setup(`sign in as ${role}`, async ({ page }) => {
    await signIn(page, role);
    await page.context().storageState({ path: env.authFile(role) });
  });
}
