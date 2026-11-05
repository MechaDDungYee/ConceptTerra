const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file:///'+path.join(__dirname,'web/index.html').replaceAll('\\','/'));
  await page.locator('#character-form button[type=submit]').click();
  await page.evaluate(()=>{const s=PTRPG.snapshot();s.scene='second';localStorage.setItem('ptrpg-hospital-eight-v1',JSON.stringify(s));});
  await page.reload();await page.waitForFunction(()=>window.PTRPG);
  await page.locator('[data-choice="0"]').click();
  // Escape dismisses the check, but still opens the pending acquisition window.
  await page.keyboard.press('Escape');await page.locator('#loot-next').waitFor();
  assert.equal(await page.locator('.loot-entry').count(),2);
  for(const img of await page.locator('.loot-image').all())assert.ok(await img.evaluate(el=>el.complete&&el.naturalWidth>0));
  await page.screenshot({path:path.join(__dirname,'qa-item-acquired.png')});
  const inventory=await page.evaluate(()=>PTRPG.snapshot().inventory);
  for(const v of [{width:1440,height:900},{width:844,height:390},{width:390,height:844}]){
   await page.setViewportSize(v);
   assert.equal(await page.evaluate(()=>{const m=document.querySelector('#modal');return m.scrollWidth>m.clientWidth+2;}),false);
  }
  await page.screenshot({path:path.join(__dirname,'qa-item-mobile.png')});
  await page.locator('#loot-next').click();await page.reload();await page.waitForFunction(()=>window.PTRPG);
  assert.deepEqual(await page.evaluate(()=>PTRPG.snapshot().inventory),inventory);
  assert.equal(await page.locator('#modal').evaluate(el=>el.open),false);
  await page.locator('[data-open="inventory"]').click();
  await page.locator('[data-item="bandage"]').click();
  assert.ok((await page.locator('.loot-copy').innerText()).includes('50%'));
  assert.ok(await page.locator('.loot-image').evaluate(el=>el.naturalWidth>0));
  await page.locator('#inventory-back').click();await page.locator('.close').click();
  await page.evaluate(()=>{const s=PTRPG.snapshot();s.scene='sixth';localStorage.setItem('ptrpg-hospital-eight-v1',JSON.stringify(s));});
  await page.reload();await page.waitForFunction(()=>window.PTRPG);
  await page.locator('[data-choice="1"]').click();
  assert.equal((await page.evaluate(()=>PTRPG.snapshot())).flags.battery,undefined);
  await page.evaluate(()=>{const s=PTRPG.snapshot();s.battle.enemies[0].hp=1;s.party.forEach(p=>{p.stats['근력']=100;p.stats['민첩']=100;});s.battle.queue=[{side:'ally',id:0,speed:20}];s.battle.pointer=0;s.battle.started=null;s.battle.plans={};localStorage.setItem('ptrpg-hospital-eight-v1',JSON.stringify(s));});
  await page.reload();await page.waitForFunction(()=>window.PTRPG);
  await page.setViewportSize({width:1440,height:900});
  await page.waitForFunction(()=>document.querySelector('[data-action="attack"]')&&!document.querySelector('[data-action="attack"]').disabled);
  await page.locator('[data-action="attack"]').click();await page.locator('[data-target="0"]').click();
  await page.locator('#resolve').click();await page.locator('#loot-next').waitFor({timeout:30000});
  assert.ok((await page.locator('.loot-copy').innerText()).includes('무전기 전원'));
  assert.ok((await page.evaluate(()=>PTRPG.snapshot())).flags.battery);
  assert.deepEqual(errors,[]);
  console.log('Item UI passed: multiple rewards, illustrations, mobile, Escape, inventory details, persistence, battle reward.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
