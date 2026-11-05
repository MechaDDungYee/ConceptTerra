const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file:///'+path.join(__dirname,'web/index.html').replaceAll('\\','/'));
  await page.locator('[name="traits"][value="brain"]').check();
  assert.equal(await page.locator('[name="traits"][value="muscle"]').isDisabled(),true);
  await page.locator('[name="traits"][value="dependent"]').check();
  await page.locator('[name="traits"][value="cautious"]').check();
  assert.equal(await page.locator('[name="traits"][value="physical"]').isDisabled(),true);
  assert.equal(await page.locator('[name="traits"][value="brain"]').isDisabled(),false);
  await page.locator('[value="cautious"]').uncheck();
  await page.locator('#unique-trait').selectOption('religious');
  assert.ok((await page.locator('#unique-description').innerText()).includes('회복량 +1'));
  assert.ok((await page.locator('#trait-preview').innerText()).includes('337'));
  for(const v of [{width:1440,height:900},{width:844,height:390},{width:390,height:844}]){
   await page.setViewportSize(v);
   assert.equal(await page.evaluate(()=>{const m=document.querySelector('#modal');return m.scrollWidth>m.clientWidth+2;}),false);
  }
  await page.setViewportSize({width:1440,height:900});
  await page.screenshot({path:path.join(__dirname,'qa-traits.png')});
  await page.locator('#character-form button[type=submit]').click();
  const s=await page.evaluate(()=>PTRPG.snapshot());
  assert.deepEqual(s.party[0].traits,['brain','dependent','religious']);assert.equal(s.party[0].max,337);assert.equal(s.affinity[0][1],2);
  await page.locator('[data-open="journal"]').click();await page.locator('[data-jtab="affinity"]').click();
  assert.equal(await page.locator('.relation-entry').count(),3);
  assert.ok((await page.locator('#journal-body').innerText()).includes('+10%'));
  await page.screenshot({path:path.join(__dirname,'qa-affinity.png')});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.querySelector('#modal').scrollWidth>document.querySelector('#modal').clientWidth+2),false);
  await page.screenshot({path:path.join(__dirname,'qa-affinity-mobile.png')});
  await page.locator('.close').click();
  await page.setViewportSize({width:1440,height:900});
  await page.locator('[data-actor="0"]').dblclick();
  assert.ok((await page.locator('#modal-content').innerText()).includes('종교인'));
  await page.locator('.close').click();await page.reload();await page.waitForFunction(()=>window.PTRPG);
  assert.equal((await page.evaluate(()=>PTRPG.snapshot())).party[0].max,337);
  assert.deepEqual((await page.evaluate(()=>PTRPG.snapshot())).party[0].traits,s.party[0].traits);
  assert.deepEqual(errors,[]);
  console.log('Social UI passed: trait limits, conflicts, live preview, start effects, affinity, profiles, reload and mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
