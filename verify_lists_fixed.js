const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8000';
(async () => {
  const browser = await chromium.launch();
  const tab = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  await tab.goto(`${BASE}/react.html`, { waitUntil: 'networkidle' });
  await tab.waitForTimeout(1000);
  await tab.locator('#r-lists').scrollIntoViewIfNeeded();

  const inputs = tab.locator('#rListsMount input');
  await inputs.nth(1).fill('TYPED-TEXT'); // Banana's row, key=1
  const rowsBefore = await tab.locator('#rListsMount li').allTextContents();
  console.log('rows BEFORE:', rowsBefore);

  await tab.locator('#rListsMount button', { hasText: 'Remove first item' }).click();
  await tab.waitForTimeout(300);

  const rowsAfter = await tab.locator('#rListsMount li').allTextContents();
  const row0val = await inputs.nth(0).inputValue();
  const row1val = await inputs.nth(1).inputValue();
  console.log('rows AFTER:', rowsAfter);
  console.log('row0 ("Banana") input value:', JSON.stringify(row0val));
  console.log('row1 ("Cherry") input value:', JSON.stringify(row1val));
  console.log(row1val === 'TYPED-TEXT' && row0val === ''
    ? '=> CONFIRMED: text stuck to the reused key=1 DOM node, now mislabeled "Cherry" — real reconciliation bug'
    : '=> STILL NOT MATCHING — investigate further');

  await browser.close();
})();
