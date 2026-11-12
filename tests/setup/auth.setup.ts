import { expect, test as setup } from '@playwright/test';
import { env } from '@config/env';
import { LoginPage } from '@/pages/login-page';

// Signs in once per role and keeps the browser state, so tests start signed in.
for (const role of env.roles) {
  setup(`sign in as ${role}`, async ({ page }) => {
    const account = env.account(role);
    const login = new LoginPage(page);

    await login.open();
    await login.signIn(account.email, account.password);
    await expect(login.signInButton).toBeHidden();

    await page.context().storageState({ path: env.authFile(role) });
  });
}
