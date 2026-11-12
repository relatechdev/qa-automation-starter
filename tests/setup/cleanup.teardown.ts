import { env } from '@config/env';
import { test as teardown } from '@/fixtures/test';

// Younger records may belong to a run that is still going, here or on a colleague's machine.
const KEEP_FOR_HOURS = 2;

// The test fixtures, so the sweep calls the API the way the tests do (cookies or a token).
teardown.use({ role: env.roles[0] });

teardown('remove what earlier runs left behind', async ({ api }) => {
  teardown.skip(env.readOnly, 'a read-only environment holds no test data');

  const createdBefore = new Date(Date.now() - KEEP_FOR_HOURS * 60 * 60 * 1000);
  const removed = await api.deleteTestData(createdBefore);

  teardown.info().annotations.push({ type: 'removed records', description: String(removed) });
});
