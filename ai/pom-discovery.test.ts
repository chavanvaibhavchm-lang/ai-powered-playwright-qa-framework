import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { discoverPoms } from './pom-discovery';
import type { Inspection } from './application';
const inspection: Inspection = {
  url: 'https://example.com/',
  title: 'x',
  inspectedAt: 'now',
  truncated: false,
  elements: [
    {
      id: 'UI-1',
      tag: 'button',
      name: 'Save',
      role: 'button',
      label: '',
      placeholder: '',
      testId: 'save',
      form: '',
      href: '',
      count: 1,
      visible: true,
      locator: 'page.getByTestId("save")',
      verifiedLocators: ['page.getByTestId("save")'],
    },
  ],
};
test('discovers signatures without executing source; reuse needs verified locators and passive source', async () => {
  const dir = join(process.cwd(), '.local', 'pom-fixture');
  await mkdir(dir, { recursive: true });
  try {
    await writeFile(
      join(dir, 'Page.ts'),
      "import {type Page,type Locator} from '@playwright/test'; export class SavePage {readonly save: Locator;constructor(private readonly page:Page){this.save=this.page.getByTestId('save');}async saveChanges(){await this.save.click();}}",
    );
    const methods = await discoverPoms(process.cwd(), '.local/pom-fixture', inspection);
    assert.equal(methods[0]?.reusable, true);
    assert.equal(methods[0]?.name, 'saveChanges');
    const source = await import('node:fs/promises').then((fs) =>
      fs.readFile(join(dir, 'Page.ts'), 'utf8'),
    );
    await writeFile(
      join(dir, 'Page.ts'),
      source.replace('this.page.getByTestId', 'page.getByTestId'),
    );
    assert.equal(
      (await discoverPoms(process.cwd(), '.local/pom-fixture', inspection))[0]?.reusable,
      true,
      'Constructor Page parameter locators should be discovered',
    );
    assert.equal(
      (await discoverPoms(process.cwd(), '.local/pom-fixture', { ...inspection, elements: [] }))[0]
        ?.reusable,
      false,
    );
    await writeFile(
      join(dir, 'Unsafe.ts'),
      "throw new Error('MUST NOT EXECUTE'); export class Unsafe { async run(){await fetch('http://evil');} }",
    );
    const rows = await discoverPoms(process.cwd(), '.local/pom-fixture', inspection);
    assert.ok(rows.some((r) => r.className === 'Unsafe' && !r.reusable));
    await assert.rejects(discoverPoms(process.cwd(), '../outside', inspection), /relative/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
