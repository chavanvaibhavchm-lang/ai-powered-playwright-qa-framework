const fs = require('node:fs');
const { chromium, expect } = require('@playwright/test');

(async () => {
  const url = new URL(process.argv[2] ?? 'http://localhost:5057');
  if (!['localhost', '127.0.0.1'].includes(url.hostname))
    throw new Error('Use the local report server.');
  const summary = JSON.parse(fs.readFileSync('allure-report/summary.json', 'utf8'));
  const statistics = JSON.parse(fs.readFileSync('allure-report/widgets/statistic.json', 'utf8'));
  expect(summary.stats.total).toBeGreaterThan(0);
  expect(statistics.total).toBe(summary.stats.total);
  expect(statistics.passed).toBe(summary.stats.passed);
  const browser = await chromium.launch(process.platform === 'win32' ? { channel: 'chrome' } : {});
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    const response = await page.goto(url.href);
    expect(response?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(summary.name);
    await expect(page.locator('body')).toContainText(String(summary.stats.total));
    expect(errors).toEqual([]);
    fs.mkdirSync('docs/evidence', { recursive: true });
    await page.screenshot({ path: 'docs/evidence/allure-report.png', fullPage: true });
    const evidence = {
      verifiedAt: new Date().toISOString(),
      stats: summary.stats,
      pageErrors: errors,
      aria: await page.locator('body').ariaSnapshot(),
      nativePortfolioHtml: fs.existsSync('.local/reports/portfolio/playwright-report/index.html'),
      historyEntries: fs
        .readFileSync('test-history/allure-history.jsonl', 'utf8')
        .trim()
        .split('\n').length,
      environmentMetadata: fs.existsSync('allure-results/environment.properties'),
      executorMetadata: fs.existsSync('allure-results/executor.json'),
    };
    fs.writeFileSync('docs/evidence/report-verification.json', JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify(evidence, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
