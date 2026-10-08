const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  const evidence = { capturedAt: new Date().toISOString() };
  try {
    await page.goto('https://www.saucedemo.com/');
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.getByRole('button', { name: 'Open Menu' }).click();
    await page.getByRole('button', { name: 'Dynamic Catalog' }).click();
    await page.waitForLoadState('domcontentloaded');
    evidence.dynamic = {
      url: page.url(),
      aria: await page.locator('body').ariaSnapshot(),
      controls: await page.locator('input,select,button,a,[data-test]').evaluateAll((elements) =>
        elements.map((element) => ({
          tag: element.tagName,
          test: element.getAttribute('data-test'),
          text: element.textContent?.trim(),
          placeholder: element.getAttribute('placeholder'),
          type: element.getAttribute('type'),
        })),
      ),
    };
    evidence.dynamicScreens = [];
    for (const name of ['Lazy Load', 'Spinner', 'Slider']) {
      if (evidence.dynamicScreens.length > 0) {
        await page.goto('https://www.saucedemo.com/inventory.html');
        await page.getByRole('button', { name: 'Open Menu' }).click();
        await page.getByRole('button', { name: 'Dynamic Catalog' }).click();
      }
      await page.getByRole('button', { name, exact: true }).click();
      await page.waitForLoadState('domcontentloaded');
      if (name === 'Spinner')
        await page
          .locator('[data-test="dynamic-catalog-spinner"]')
          .waitFor({ state: 'hidden', timeout: 20000 });
      evidence.dynamicScreens.push({
        name,
        url: page.url(),
        aria: await page.locator('body').ariaSnapshot(),
        controls: await page.locator('input,button,select,[data-test]').evaluateAll((elements) =>
          elements.map((element) => ({
            tag: element.tagName,
            test: element.getAttribute('data-test'),
            text: element.textContent?.trim(),
            placeholder: element.getAttribute('placeholder'),
          })),
        ),
      });
    }
    fs.writeFileSync(
      'docs/evidence/additional-reconnaissance.json',
      JSON.stringify(evidence, null, 2),
    );
    console.log(
      JSON.stringify(
        evidence.dynamicScreens.map((screen) => ({
          name: screen.name,
          url: screen.url,
          aria: screen.aria,
        })),
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
