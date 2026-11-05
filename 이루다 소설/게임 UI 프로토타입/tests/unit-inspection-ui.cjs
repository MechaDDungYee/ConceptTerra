const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.evaluate(() => {
      document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'story-view'));
      startBattleLineup(['eojil', 'eojyeo', 'eora', 'gena', 'sosuh', 'eodo', 'ryeona', 'getne', 'dorok']);
    });
    await page.waitForFunction(() => [...document.querySelectorAll('.battle-token.ally img')].every(img => img.complete && img.naturalWidth === 768));
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.battle-board-3d .battle-token').count(), 0);
    assert.equal(await page.locator('.battle-unit-layer .battle-token.ally').count(), 4);
    const checkOriginalProjection = () => page.evaluate(() => {
      const field = document.querySelector('#battle-field');
      const current = document.querySelector('#battle-board-3d');
      const referenceFrame = document.createElement('div');
      referenceFrame.style.cssText = 'position:absolute;inset:0;perspective:1100px;visibility:hidden;pointer-events:none';
      referenceFrame.style.transformOrigin = '0 0';
      referenceFrame.style.transform = document.querySelector('#battle-camera').style.transform;
      const reference = current.cloneNode(true);
      reference.removeAttribute('id');
      reference.style.transform = `translate(-50%, -50%) scale(var(--battle-zoom)) rotateX(${90 - battleDummy.tilt}deg) rotateZ(var(--battle-rot))`;
      reference.style.transformStyle = 'preserve-3d';
      reference.style.top = matchMedia('(max-height:540px) and (orientation:landscape)').matches ? '63%' : '51%';
      reference.style.width = matchMedia('(max-height:540px) and (orientation:landscape)').matches ? 'min(54vw, 27rem)' : 'calc(var(--tile-w) * 8)';
      referenceFrame.append(reference);
      field.append(referenceFrame);
      try {
        const original = [...reference.querySelectorAll('.battle-cell')].map(cell => cell.getBoundingClientRect());
        return [...current.querySelectorAll('.battle-cell')].every((cell, index) => {
          const actual = cell.getBoundingClientRect();
          return ['left', 'top', 'width', 'height'].every(key => Math.abs(actual[key] - original[index][key]) < 1);
        });
      } finally { referenceFrame.remove(); }
    });
    for (const rotation of [45, 90, -25]) {
      await page.evaluate(rotation => {
        battleDummy.rotation = rotation;
        battleDummy.zoom = 1.2;
        renderBattleDummy();
      }, rotation);
      await page.waitForTimeout(80);
      const aligned = await page.evaluate(() => battleDummy.allies.every(unit => {
        const cell = document.querySelector(`[data-cell-x="${unit.x}"][data-cell-y="${unit.y}"]`).getBoundingClientRect();
        const token = document.querySelector(`[data-battle-unit="${unit.id}"]`).getBoundingClientRect();
        return Math.abs(cell.left + cell.width / 2 - token.left - token.width / 2) < 1;
      }));
      assert.ok(aligned);
      assert.ok(await checkOriginalProjection());
    }
    await page.evaluate(() => { battleDummy.rotation = 45; battleDummy.zoom = 1; renderBattleDummy(); });
    await page.waitForTimeout(80);
    await page.screenshot({ path: path.join(__dirname, 'crisp-sd-battle-desktop.png') });
    await page.locator('.battle-token.ally').first().dblclick({ position: { x: 50, y: 50 } });
    await page.waitForSelector('.battle-inspection');
    await page.waitForTimeout(220);
    assert.equal(await page.locator('.unit-inspection-art').count(), 0);
    const imageBox = await page.locator('.battle-token.inspection-focus img').boundingBox();
    const infoBox = await page.locator('.battle-unit-info').boundingBox();
    assert.ok(imageBox.x + imageBox.width <= infoBox.x);
    assert.ok(imageBox.height > 350);
    assert.ok(await page.locator('#battle-camera').evaluate(el => getComputedStyle(el).transform !== 'none'));
    await page.evaluate(() => { window.inspectionPanel = document.querySelector('.battle-inspection'); window.inspectionCamera = document.querySelector('#battle-camera'); });
    for (const tab of ['passive', 'actions', 'ego', 'status']) {
      await page.locator(`[data-unit-info-tab="${tab}"]`).click();
      assert.equal(await page.locator(`[data-unit-info-tab="${tab}"]`).getAttribute('aria-selected'), 'true');
      assert.ok(await page.evaluate(() => window.inspectionPanel === document.querySelector('.battle-inspection') && window.inspectionCamera === document.querySelector('#battle-camera')));
    }
    await page.locator('[data-unit-info-tab="ego"]').click();
    for (const tab of ['action', 'passive']) {
      await page.locator(`[data-ego-info-tab="${tab}"]`).click();
      assert.equal(await page.locator(`[data-ego-info-tab="${tab}"]`).getAttribute('aria-selected'), 'true');
    }
    await page.locator('[data-unit-info-tab="status"]').click();
    assert.equal(await page.locator('#battle-camera').evaluate(el => getComputedStyle(el).perspective), '1100px');
    await page.waitForTimeout(220);
    await page.screenshot({ path: path.join(__dirname, 'unit-inspection-desktop.png') });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(250);
    const fits = await page.locator('.battle-unit-info').evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.right <= innerWidth && rect.bottom <= innerHeight;
    });
    assert.ok(fits);
    await page.screenshot({ path: path.join(__dirname, 'unit-inspection-mobile.png') });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.battle-inspection').count(), 0);
    assert.equal(await page.locator('#battle-camera').evaluate(el => getComputedStyle(el).transform), 'none');
    assert.ok(await checkOriginalProjection());
    await page.screenshot({ path: path.join(__dirname, 'restored-board-mobile.png') });
    await page.locator('.battle-token.enemy').first().dblclick({ position: { x: 35, y: 40 } });
    assert.equal(await page.locator('.inspection-focus .enemy-core').count(), 1);
    await page.locator('[data-close-unit-info]').click();
    assert.deepEqual(errors, []);
    console.log('PASS original board reference: all 40 tiles match before-change projection at 3 angles and mobile; inspection tabs, slots and Escape.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
