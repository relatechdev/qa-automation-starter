import { test as teardown } from '@playwright/test';
import { env } from '@config/env';
import { Api } from '@/api/api';

// Younger records may belong to a run that is still going, here or on a colleague's machine.
const KEEP_FOR_HOURS = 2;

teardown.use({ storageState: env.readOnly ? undefined : env.authFile(env.roles[0]) });

teardown('remove what earlier runs left behind', async ({ request }) => {
  teardown.skip(env.readOnly, 'a read-only environment holds no test data');

  const createdBefore = new Date(Date.now() - KEEP_FOR_HOURS * 60 * 60 * 1000);
  const removed = await new Api(request).deleteTestData(createdBefore);

  teardown.info().annotations.push({ type: 'removed records', description: String(removed) });
});
