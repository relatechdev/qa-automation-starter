import { randomBytes } from 'node:crypto';
import { env } from '@config/env';

/** Every record a test creates carries this prefix, so anyone can tell it apart and the sweep can find it. */
export const TEST_DATA_PREFIX = 'qa-auto';

/** A name no other test or run uses: `qa-auto-<label>-<random>`. */
export function uniqueName(label: string): string {
  if (env.readOnly) {
    throw new Error(`"${env.name}" is read-only: tests must not create data there.`);
  }
  return `${TEST_DATA_PREFIX}-${label}-${randomBytes(4).toString('hex')}`;
}
