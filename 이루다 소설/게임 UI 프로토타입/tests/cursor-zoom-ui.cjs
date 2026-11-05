const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    for (const viewport of [{ width: 1440, height: 900 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => {
        document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'story-view'));
        startBattleLineup(['sosuh', 'eodo', 'ryeona', 'getne', 'eojil', 'eojyeo', 'eora', 'gena', 'dorok']);
      });
      const tile = page.locator('[data-cell-x="5"][data-cell-y="3"]');
      const before = await tile.boundingBox();
      const anchor = { x: before.x + before.width / 2, y: before.y + before.height / 2 };
      await page.mouse.move(anchor.x, anchor.y);
      for (const deltaY of [-100, -100, 100, 100]) {
        await page.mouse.wheel(0, deltaY);
        await page.waitForTimeout(60);
        const after = await tile.boundingBox();
        assert.ok(Math.abs(after.x + after.width / 2 - anchor.x) < 1);
        assert.ok(Math.abs(after.y + after.height / 2 - anchor.y) < 1);
      }
      await page.evaluate(() => { battleDummy.rotation = -30; renderBattleDummy(); });
      const rotated = await tile.boundingBox();
      const otherAnchor = { x: rotated.x + rotated.width / 2, y: rotated.y + rotated.height / 2 };
      await page.mouse.move(otherAnchor.x, otherAnchor.y);
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(70);
      const after = await tile.boundingBox();
      assert.ok(Math.abs(after.x + after.width / 2 - otherAnchor.x) < 1);
      assert.ok(Math.abs(after.y + after.height / 2 - otherAnchor.y) < 1);
      const saved = await page.evaluate(() => ({ x: battleDummy.cameraX, y: battleDummy.cameraY, zoom: battleDummy.zoom, transform: document.querySelector('#battle-camera').style.transform }));
      await page.evaluate(() => { battleDummy.inspectedUnitId = battleDummy.allies[0].id; renderBattleDummy(); });
      await page.locator('[data-close-unit-info]').click();
      assert.deepEqual(await page.evaluate(() => ({ x: battleDummy.cameraX, y: battleDummy.cameraY, zoom: battleDummy.zoom, transform: document.querySelector('#battle-camera').style.transform })), saved);
      for (let i = 0; i < 12; i++) await page.mouse.wheel(0, -100);
      await page.waitForTimeout(100);
      assert.ok(await page.evaluate(() => battleDummy.zoom <= 1.38));
      await page.screenshot({ path: path.join(__dirname, `cursor-zoom-${viewport.width}.png`) });
    }
    assert.deepEqual(errors, []);
    console.log('PASS cursor stays on the same map point during zoom in/out and rotation; inspection restores view; zoom limits; desktop/mobile.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
