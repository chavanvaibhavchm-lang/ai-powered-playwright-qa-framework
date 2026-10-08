const { chromium } = require('playwright');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext();
  const page = await context.newPage();
  const evidence = { capturedAt: new Date().toISOString(), screens: [], personas: [] };
  async function capture(name) {
    evidence.screens.push({
      name,
      url: page.url(),
      accessibility: await page.locator('body').ariaSnapshot(),
      controls: await page
        .locator('input, button, select, a, [data-test]')
        .evaluateAll((elements) =>
          elements.map((element) => ({
            tag: element.tagName,
            test: element.getAttribute('data-test'),
            id: element.id,
            type: element.getAttribute('type'),
            text: element.textContent?.trim(),
            href: element.getAttribute('href'),
            placeholder: element.getAttribute('placeholder'),
          })),
        ),
    });
  }
  try {
    await page.goto('https://www.saucedemo.com/');
    await capture('login');
    evidence.credentials = await page
      .locator('.login_credentials, .login_password')
      .allTextContents();
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');
    await page.locator('[data-test="login-button"]').click();
    await page.locator('[data-test="inventory-item"]').first().waitFor();
    await capture('inventory');
    evidence.products = await page.locator('[data-test="inventory-item"]').evaluateAll((items) =>
      items.map((item) => ({
        name: item.querySelector('[data-test="inventory-item-name"]')?.textContent,
        description: item.querySelector('[data-test="inventory-item-desc"]')?.textContent,
        price: item.querySelector('[data-test="inventory-item-price"]')?.textContent,
        image: item.querySelector('img')?.getAttribute('src'),
      })),
    );
    evidence.sortOptions = await page
      .locator('select')
      .locator('option')
      .evaluateAll((options) =>
        options.map((option) => ({ value: option.value, text: option.textContent })),
      );
    await page
      .locator('[data-test="inventory-item-name"]')
      .filter({ hasText: 'Sauce Labs Backpack' })
      .click();
    await capture('details');
    await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await capture('cart');
    await page.getByRole('button', { name: 'Checkout', exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await capture('checkout-validation');
    await page.locator('[data-test="firstName"]').fill('QA');
    await page.locator('[data-test="lastName"]').fill('Engineer');
    await page.locator('[data-test="postalCode"]').fill('560001');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await capture('overview');
    await page.getByRole('button', { name: 'Finish', exact: true }).click();
    await capture('complete');
    await page.getByRole('button', { name: 'Open Menu' }).click();
    await page.getByText('All Items', { exact: true }).waitFor();
    await capture('menu');
    for (const user of [
      'locked_out_user',
      'performance_glitch_user',
      'problem_user',
      'error_user',
      'visual_user',
    ]) {
      await context.clearCookies();
      await page.goto('https://www.saucedemo.com/');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.locator('[data-test="username"]').fill(user);
      await page.locator('[data-test="password"]').fill('secret_sauce');
      const started = Date.now();
      await page.locator('[data-test="login-button"]').click();
      await page.locator('[data-test="inventory-item"], [data-test="error"]').first().waitFor();
      const persona = {
        user,
        elapsedMs: Date.now() - started,
        url: page.url(),
        error: await page.locator('[data-test="error"]').allTextContents(),
      };
      if (user !== 'locked_out_user') {
        persona.images = await page
          .locator('[data-test="inventory-item"] img')
          .evaluateAll((images) => images.map((image) => image.getAttribute('src')));
        await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
        persona.backpackButton = await page
          .locator('[data-test="remove-sauce-labs-backpack"]')
          .count();
        await page.locator('[data-test="shopping-cart-link"]').click();
        await page.getByRole('button', { name: 'Checkout', exact: true }).click();
        await page.locator('[data-test="firstName"]').fill('Ada');
        await page.locator('[data-test="lastName"]').fill('Lovelace');
        persona.lastNameValue = await page.locator('[data-test="lastName"]').inputValue();
        await page.locator('[data-test="postalCode"]').fill('12345');
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
        persona.checkoutUrl = page.url();
        persona.checkoutError = await page.locator('[data-test="error"]').allTextContents();
      }
      evidence.personas.push(persona);
    }
    fs.mkdirSync('docs/evidence', { recursive: true });
    fs.writeFileSync('docs/evidence/reconnaissance.json', JSON.stringify(evidence, null, 2));
    console.log(
      JSON.stringify(
        {
          screens: evidence.screens.map((screen) => ({ name: screen.name, url: screen.url })),
          credentials: evidence.credentials,
          products: evidence.products,
          sortOptions: evidence.sortOptions,
          personas: evidence.personas,
        },
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
