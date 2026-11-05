const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file:///'+path.join(__dirname,'web/index.html').replaceAll('\\','/'));
  await page.locator('#character-form button[type=submit]').click();
  const baseline=await page.evaluate(()=>PTRPG.snapshot());
  async function fixture(scene,notes=[]){await page.evaluate(({scene,notes,baseline})=>{const s=baseline;s.scene=scene;s.notes=notes;s.battle=null;s.ending=null;localStorage.setItem('ptrpg-hospital-eight-v1',JSON.stringify(s));},{scene,notes,baseline});await page.reload();await page.waitForFunction(()=>window.PTRPG);}
  for(const v of [{width:1440,height:900},{width:844,height:390},{width:390,height:844}]){
   await page.setViewportSize(v);
   for(const scene of ['fourth','broken_stairs','contaminated_passage','roof_lock','number_archive']){
    await fixture(scene,['isolation']);assert.ok(await page.locator('.choice').count());
    const overflow=await page.evaluate(()=>[...document.querySelectorAll('.choice,.member,header,footer')].filter(el=>el.getBoundingClientRect().right>innerWidth+2).length);assert.equal(overflow,0,scene);
   }
   await fixture('consent');await page.getByRole('button',{name:/정산 봉투/}).click();await page.locator('[data-read="settlement"]').click();assert.ok((await page.locator('.document-paper').innerText()).includes('사망 여부를 기록하는 칸은 없다'));
   assert.equal(await page.locator('#modal').evaluate(el=>el.scrollWidth>el.clientWidth+2),false);
   await page.screenshot({path:path.join(__dirname,`qa-dread-record-${v.width}.png`)});
   await page.locator('#document-back').click();await page.locator('#loot-next').click();
   assert.ok((await page.evaluate(()=>PTRPG.snapshot())).readNotes.includes('settlement'));
   await fixture('broken_stairs');await page.getByRole('button',{name:/붕대 2개/}).click();assert.equal((await page.evaluate(()=>PTRPG.snapshot())).scene,'dragon_hall');assert.equal((await page.evaluate(()=>PTRPG.snapshot())).inventory.bandage,0);
  }
  await page.setViewportSize({width:1440,height:900});await fixture('roof_lock',['isolation']);await page.screenshot({path:path.join(__dirname,'qa-dread-roof.png')});assert.deepEqual(errors,[]);
  console.log('Dread UI passed: seven-record reader integration, acquisition, persistence, hazardous traversal and three viewports.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
