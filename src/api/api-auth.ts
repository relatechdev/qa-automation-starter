import type { BrowserContext } from '@playwright/test';
import { env } from '@config/env';

/**
 * The access token the application sends to its API, taken from its own first call.
 * `context` is signed in as the role whose token is wanted. Works for applications that
 * keep the token in the browser (most single-page applications). When the API has a
 * sign-in endpoint that returns a token, call that here instead.
 */
export async function captureApiToken(context: BrowserContext): Promise<string> {
  const page = await context.newPage();
  try {
    const call = page.waitForRequest(
      async (request) =>
        request.url().startsWith(env.apiUrl) &&
        /^Bearer /i.test((await request.allHeaders()).authorization ?? ''),
    );
    await page.goto(env.baseUrl);
    return (await (await call).allHeaders()).authorization.replace(/^Bearer /i, '');
  } finally {
    await page.close();
  }
}

/** True while a token is good for at least another minute. A token that is not a JWT counts as good. */
export function isFresh(token: string): boolean {
  const [, payload] = token.split('.');
  if (!payload) return true;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp?: number };
    return exp === undefined || exp * 1000 - Date.now() > 60_000;
  } catch {
    return true;
  }
}
