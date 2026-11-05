const path = require('node:path');
const {pathToFileURL} = require('node:url');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.locator('[data-view="squad"]').click();
    for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 844, 390]]) {
      await page.setViewportSize({width, height});
      await page.waitForFunction(() => [...document.querySelectorAll('.slot-logo')].every(img => img.complete && img.naturalWidth === 512));
      const logos = await page.locator('.slot-logo').evaluateAll(images => images.map(img => ({src: img.getAttribute('src'), box: img.getBoundingClientRect().toJSON()})));
      assert.equal(logos.length, 10);
      for (const logo of logos) {
        assert.ok(logo.src.endsWith('_v3.png'));
        assert.ok(logo.box.width > 15 && logo.box.height > 15);
      }
      await page.screenshot({path: path.join(__dirname, 'simple-logos-' + label + '.png')});
    }
    assert.deepEqual(errors, []);
    console.log('10 v3 logos loaded at desktop and landscape mobile sizes; no page errors.');
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
