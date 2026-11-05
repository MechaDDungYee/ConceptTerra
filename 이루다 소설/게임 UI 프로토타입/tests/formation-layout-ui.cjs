const path=require('node:path');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.addInitScript(()=>{window.battlePlaybackTimingScale=.01;});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  for(const viewport of [{width:1440,height:900},{width:844,height:390}]){
   await page.setViewportSize(viewport);
   await page.evaluate(()=>{
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));
    activeStageId='ch1-2';startMindBattleTutorial();
   });
   assert.equal(await page.locator('.lineup-roster .slot-card').count(),10);
   const eodo=page.locator('[data-lineup-unit="eodo"]');
   assert.equal(await eodo.count(),1);assert.ok(await eodo.isDisabled());
   assert.equal(await eodo.locator('.lineup-state').innerText(),'출전 불가');
   await eodo.dispatchEvent('click');
   assert.ok(await page.evaluate(()=>!battleDummy.lineupOrder.includes('eodo')));
   assert.ok(await page.locator('[data-lineup-unit="iruri"]').isDisabled());
   const columns=await page.locator('.lineup-roster').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
   assert.equal(columns,5);
   assert.ok(await page.locator('.battle-formation-layout').evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom<=innerHeight&&r.right<=innerWidth;}));
   assert.ok(await page.locator('.lineup-roster .slot-logo').first().evaluate(el=>{const s=getComputedStyle(el);return s.borderTopWidth==='0px'&&s.maskImage!=='none'&&parseFloat(s.width)>39;}));
   await page.waitForFunction(()=>[...document.querySelectorAll('.lineup-roster img')].every(img=>img.complete&&img.naturalWidth>0));
   await page.screenshot({path:path.join(__dirname,`formation-tutorial-${viewport.width}.png`)});
   const ids=await page.locator('[data-lineup-unit]:not(:disabled)').evaluateAll(buttons=>buttons.map(button=>button.dataset.lineupUnit));
   assert.equal(ids.length,8);
   for(const id of ids) await page.locator(`[data-lineup-unit="${id}"]`).click();
   assert.ok(await page.locator('#lineup-enter').isEnabled());
   assert.equal(await page.locator('.lineup-rank').count(),8);
   await page.locator('#lineup-enter').click();
   assert.equal(await page.locator('.battle-token.ally').count(),4);
   assert.ok(await page.evaluate(()=>battleDummy.enemies.every(unit=>unit.x===8)));
   assert.ok(await page.evaluate(()=>![...battleDummy.allies,...battleDummy.bench].some(u=>u.id==='eodo')));
   await page.evaluate(()=>{battleTutorial.step=14;renderBattleDummy();});
   await page.locator('#battle-resolve').click();
   await page.waitForFunction(()=>!battlePresentationActive);
   assert.ok(await page.evaluate(()=>getLastBattleExecution()?.status==='completed'&&battleDummy.turn===2));
   await page.evaluate(()=>{finishMindBattleTutorial(false);resetBattleDummy();showBattleDummy();});
   assert.ok(await page.locator('[data-lineup-unit="eodo"]').isEnabled());
   assert.equal(await page.locator('[data-lineup-unit]:not(:disabled)').count(),9);
   assert.ok(await page.evaluate(()=>battleDummy.enemies.every(unit=>unit.x===8)));
   await page.screenshot({path:path.join(__dirname,`formation-dummy-${viewport.width}.png`)});
  }
  await page.evaluate(()=>showDokkaebiHub());
  await page.locator('.main-nav [data-view="squad"]').click();
  assert.ok(await page.locator('#squad-slots .slot-logo').first().evaluate(el=>{const s=getComputedStyle(el);return s.borderTopWidth==='0px'&&s.backgroundColor==='rgba(0, 0, 0, 0)'&&s.maskImage!=='none';}));
  assert.deepEqual(errors,[]);
  console.log('PASS shared 5x2 roster, visible disabled Eodo/Iruri, 8 tutorial selections, 9 dummy selections, logo fade and desktop/mobile layout.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
