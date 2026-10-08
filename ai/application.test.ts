import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  applicationConfig,
  allowedAddress,
  canonicalUrl,
  inspectApplication,
  permittedNavigation,
  resolveApplication,
} from './application';
const config = applicationConfig({ name: 'Sample', url: 'https://example.com', allowLocal: false });
test('configurable application and explicit page scope', () => {
  assert.equal(config.url, 'https://example.com/');
  assert.equal(permittedNavigation(config, 'https://example.com/elsewhere'), false);
  assert.equal(
    permittedNavigation(
      { ...config, approvedPages: ['https://example.com/elsewhere'] },
      'https://example.com/elsewhere',
    ),
    true,
  );
  assert.throws(
    () => applicationConfig({ name: 'x', url: config.url, approvedPages: ['https://other.com'] }),
    /origin/,
  );
  for (const url of [
    'file:///etc/passwd',
    'http://user:pass@example.com',
    'https://example.com/?token=secret',
  ])
    assert.throws(() => canonicalUrl(url));
});
test('DNS/IP restrictions reject mixed records, private and mapped addresses', async () => {
  for (const ip of [
    '0.0.0.0',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.1.1',
    '::ffff:127.0.0.1',
    '::1',
    '224.0.0.1',
  ])
    assert.equal(allowedAddress(ip, true), false, ip);
  assert.equal(allowedAddress('127.0.0.1', false), false);
  assert.equal(allowedAddress('127.0.0.1', true), true);
  await assert.rejects(
    resolveApplication(config, async () => [
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ]),
    /restricted/,
  );
});
test('browser inspection observes forms and duplicate locators without submitting; redirects blocked', async () => {
  let submits = 0;
  const server = createServer((req, res) => {
    if (req.url === '/redirect') {
      res.writeHead(302, { Location: '/unapproved' }).end();
      return;
    }
    if (req.method === 'POST') submits++;
    res.end(
      '<title>Inspection fixture</title><form id="signin"><label for="user">User name</label><input id="user"><button>Save</button><button>Duplicate</button><button>Duplicate</button></form>',
    );
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const local = applicationConfig({
    name: 'Local',
    url: 'http://127.0.0.1:' + address.port,
    allowLocal: true,
  });
  try {
    const inventory = await inspectApplication(local, process.cwd());
    assert.equal(inventory.title, 'Inspection fixture');
    assert.ok(inventory.elements.some((e) => e.label === 'User name' && e.count === 1));
    assert.ok(
      inventory.elements.filter((e) => e.name === 'Duplicate').every((e) => e.locator === ''),
    );
    assert.equal(submits, 0);
    await assert.rejects(
      inspectApplication({ ...local, url: local.url + 'redirect' }, process.cwd()),
    );
    const approvedRedirect = await inspectApplication(
      { ...local, url: local.url + 'redirect', approvedPages: [local.url + 'unapproved'] },
      process.cwd(),
    );
    assert.equal(approvedRedirect.url, local.url + 'unapproved');
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});
