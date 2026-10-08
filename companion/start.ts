import { mkdir } from 'node:fs/promises';
import { startCompanion } from './server';

async function main() {
  await mkdir('.local', { recursive: true });
  const port = Number(process.env.COMPANION_PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('Invalid COMPANION_PORT');
  const service = await startCompanion('.local/orders.sqlite', port);
  console.log(`Independent companion API: ${service.url} (not SauceDemo's backend)`);
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.once(signal, () => {
      void service.close().catch((error) => {
        console.error(error);
        process.exitCode = 1;
      });
    });
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
