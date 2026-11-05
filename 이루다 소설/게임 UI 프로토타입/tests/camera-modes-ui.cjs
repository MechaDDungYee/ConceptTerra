const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless:true, channel:'msedge' });
  try {
    const page = await browser.newPage({ viewport:{width:1440,height:900} });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    for (const viewport of [{width:1440,height:900},{width:844,height:390}]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => {
        document.querySelectorAll('.view').forEach(v => v.classList.toggle('active',v.id === 'story-view'));
        startBattleLineup(['sosuh','eodo','ryeona','getne','eojil','eojyeo','eora','gena','dorok']);
      });
      const drag = async (dx,dy) => {
        const field = await page.locator('#battle-field').boundingBox();
        const start = {x:field.x+field.width-40,y:field.y+55};
        await page.mouse.move(start.x,start.y);
        await page.mouse.down();
        await page.mouse.move(start.x+dx,start.y+dy,{steps:8});
        await page.mouse.up();
      };
      await page.locator('button[data-camera-mode="move"]').click();
      assert.equal(await page.locator('button[data-camera-mode="move"]').getAttribute('aria-pressed'),'true');
      const tile = page.locator('[data-cell-x="5"][data-cell-y="3"]');
      const before = await tile.boundingBox();
      await drag(-60,40);
      const after = await tile.boundingBox();
      assert.ok(Math.abs(after.x-before.x+60)<1);
      assert.ok(Math.abs(after.y-before.y-40)<1);
      assert.equal(await page.evaluate(() => battleDummy.rotation),0);
      assert.equal(await page.evaluate(() => battleDummy.tilt),30);
      assert.equal(await page.locator('#battle-field').evaluate(el => el.style.getPropertyValue('--battle-tilt')),'60deg');
      await page.locator('button[data-camera-mode="rotate"]').click();
      await drag(-60,40);
      const state = await page.evaluate(() => ({rotation:battleDummy.rotation,tilt:battleDummy.tilt,x:battleDummy.cameraX,y:battleDummy.cameraY}));
      assert.ok(Math.abs(state.rotation-13.2)<.001);
      assert.ok(Math.abs(state.tilt-37.2)<.001);
      assert.ok(Math.abs(await page.locator('#battle-field').evaluate(el => parseFloat(el.style.getPropertyValue('--battle-tilt')))-52.8)<.001);
      assert.deepEqual([state.x,state.y],[-60,40]);
      await page.evaluate(() => {battleDummy.tilt=74;renderBattleDummy();});
      await drag(0,40);
      assert.equal(await page.evaluate(() => battleDummy.tilt),75);
      await page.screenshot({path:path.join(__dirname,`camera-modes-${viewport.width}.png`)});
      await page.locator('#battle-camera-reset').click();
      assert.deepEqual(await page.evaluate(() => [battleDummy.rotation,battleDummy.tilt,battleDummy.zoom,battleDummy.cameraX,battleDummy.cameraY]),[0,30,1,0,0]);
      await page.screenshot({path:path.join(__dirname,`camera-side-default-${viewport.width}.png`)});
      assert.ok(await page.locator('.battle-camera-tools img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth>0)));
    }
    assert.deepEqual(errors,[]);
    console.log('PASS move/rotate toggle, horizontal/vertical pan and rotation, tilt limit, reset and icons on desktop/mobile.');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
