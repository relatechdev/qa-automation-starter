import type { Page } from '@playwright/test';
import { env } from '@config/env';
import { LoginPage } from '@/pages/login-page';

/** Signs a role in through the sign-in page, and returns once the page has left it. */
export async function signIn(page: Page, role: string): Promise<void> {
  const account = env.account(role);
  const login = new LoginPage(page);

  await login.open();
  await login.signIn(account.email, account.password);
  await login.signInButton.waitFor({ state: 'hidden' });
}
