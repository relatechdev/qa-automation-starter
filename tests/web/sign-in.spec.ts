import { env } from '@config/env';
import { expect, test } from '@/fixtures/test';

// These tests start signed out. The one that signs out uses a session of its own:
// ending the shared session would sign out every test running next to it.
test.use({ role: 'anonymous' });

test.describe('Sign-in', () => {
  test('a wrong password is refused with a message', { tag: '@TC-003' }, async ({ app, page }) => {
    await app.login.open();
    await app.login.signIn(env.account('user').email, 'not-the-password');

    await expect(app.login.error).toHaveText('Wrong email or password.');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('signing out returns to the sign-in page', { tag: '@TC-004' }, async ({ app, page }) => {
    const account = env.account('user');

    await test.step('sign in with a session only this test uses', async () => {
      await app.login.open();
      await app.login.signIn(account.email, account.password);
      await expect(app.dashboard.heading).toBeVisible();
    });

    await app.nav.signOutButton.click();
    await expect(page).toHaveURL(/\/login$/);

    await test.step('the session is over: the dashboard asks to sign in again', async () => {
      await app.dashboard.open();
      await expect(app.login.signInButton).toBeVisible();
    });
  });
});
