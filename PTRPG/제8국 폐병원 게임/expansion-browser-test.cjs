const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file:///'+path.join(__dirname,'web/index.html').replaceAll('\\','/'));
  await page.locator('#character-form button[type=submit]').click();
  async function fixture(scene,notes=[]){await page.evaluate(({scene,notes})=>{const s=PTRPG.snapshot();s.scene=scene;s.battle=null;s.ending=null;s.notes=notes;localStorage.setItem('ptrpg-hospital-eight-v1',JSON.stringify(s));},{scene,notes});await page.reload();await page.waitForFunction(()=>window.PTRPG);}
  for(const v of [{width:1440,height:900},{width:844,height:390},{width:390,height:844}]){
   await page.setViewportSize(v);for(const scene of ['lobby','second','office_records','rooftop']){
    await fixture(scene);const over=await page.evaluate(()=>[...document.querySelectorAll('.choice,.member,header,footer,.story')].map(el=>({class:el.className,r:el.getBoundingClientRect().toJSON()})).filter(x=>x.r.right>innerWidth+2||x.r.left<0||(innerWidth>innerHeight&&x.r.bottom>innerHeight+2)));assert.deepEqual(over,[],`${scene} ${v.width}x${v.height}`);
   }
   await fixture('office_records',['father','girl','experiment','office']);await page.locator('[data-open="inventory"]').click();
   assert.equal(await page.locator('.document-entry').count(),4);await page.locator('[data-read="experiment"]').click();
   assert.ok((await page.locator('.document-paper').innerText()).includes('몹시 기대가 된다.'));
   assert.ok((await page.locator('.document-paper').innerText()).length>1000);
   assert.equal(await page.locator('#modal').evaluate(el=>el.scrollWidth>el.clientWidth+2),false);
   await page.screenshot({path:path.join(__dirname,`qa-document-${v.width}.png`)});
   await page.locator('#document-back').click();assert.equal(await page.locator('.document-entry').count(),4);await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:1440,height:900});await fixture('office_records');await page.locator('[data-choice="0"]').click();
  await page.locator('[data-read="office"]').click();assert.ok((await page.locator('.document-paper').innerText()).includes('나 신의현이다'));
  await page.locator('#document-back').click();await page.locator('#loot-next').click();
  await page.locator('[data-open="journal"]').click();await page.locator('[data-read="office"]').click();
  await page.reload();assert.ok((await page.evaluate(()=>PTRPG.snapshot())).readNotes.includes('office'));
  await fixture('radio_entry');await page.locator('[data-choice="0"]').click();await page.locator('#loot-next').click();assert.equal((await page.evaluate(()=>PTRPG.snapshot())).scene,'radio');
  await page.locator('[data-open="map"]').click();assert.equal(await page.locator('.floor').count(),10);
  assert.deepEqual(errors,[]);console.log('Expanded UI passed: long scenes, acquired/inventory/journal readers, full text, read-state persistence, 10 floors, three viewports.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
