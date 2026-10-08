import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { test as base, expect } from './test';
import { startCompanion } from '../companion/server';

export const test = base.extend<{
  service: Awaited<ReturnType<typeof startCompanion>>;
  databasePath: string;
}>({
  databasePath: async ({}, use, info) => {
    const filename = info.outputPath('isolated.sqlite');
    await mkdir(dirname(filename), { recursive: true });
    await use(filename);
  },
  service: async ({ databasePath }, use) => {
    const service = await startCompanion(databasePath);
    try {
      await use(service);
    } finally {
      await service.close();
    }
  },
});
export { expect };
