import { chromium } from 'playwright';

async function main() {
  console.log('Launching headless browser to audit production https://matany.one ...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const consoleLogs: string[] = [];
  page.on('console', msg => consoleLogs.push([] ));

  const response = await page.goto('https://matany.one', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Status code:', response?.status());

  const title = await page.title();
  console.log('Page Title:', title);

  const screenshotPath = 'tests/e2e/playwright-deepseek-production-audit.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot saved to:', screenshotPath);

  await browser.close();
  console.log('Playwright Live Production Audit complete!');
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
