const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file:///'+path.join(__dirname,'web/index.html').replaceAll('\\','/'));await page.locator('#character-form button[type=submit]').click();
 async function fixture(type='wave'){
  await page.evaluate(type=>{const s=PTRPG.snapshot();s.scene='rescue_wave';s.battle=null;s.ending=null;RankCombat.create(s,type,'rescue_arrival',()=>.1);s.battle.queue.sort((a,b)=>a.side===b.side?a.id-b.id:a.side==='ally'?-1:1);localStorage.setItem('ptrpg-hospital-eight-v1',JSON.stringify(s));},type);
  await page.reload();await page.waitForFunction(()=>document.querySelector('[data-action="attack"]')&&!document.querySelector('[data-action="attack"]').disabled);
 }
 await fixture();assert.equal(await page.locator('.survivor.rank-unit').count(),4);assert.equal(await page.locator('.enemy.rank-unit').count(),3);
 await page.locator('[data-action="attack"]').click();assert.ok(await page.locator('#resolve').isDisabled());
 assert.equal(await page.locator('.enemy.targetable').count(),2);await page.locator('[data-target="2"]').click();assert.ok(await page.locator('#resolve').isDisabled());
 await page.locator('[data-target="0"]').click();assert.equal(await page.locator('#resolve').isDisabled(),false);await page.waitForTimeout(2800);await page.screenshot({path:path.join(__dirname,'qa-rank-desktop.png')});
 for(const v of [{width:1440,height:900},{width:844,height:390},{width:932,height:430},{width:390,height:844}]){
  await page.setViewportSize(v);const overflow=await page.evaluate(()=>[...document.querySelectorAll('.rank-unit,.rank-action,header,footer,#story,#choices')].map(el=>({name:el.className,r:el.getBoundingClientRect().toJSON()})).filter(x=>x.r.left<0||x.r.right>innerWidth+2||x.r.bottom>innerHeight+2));assert.deepEqual(overflow,[],JSON.stringify(v));await page.screenshot({path:path.join(__dirname,'qa-rank-'+v.width+'.png')});
 }
 await page.setViewportSize({width:1440,height:900});await page.locator('#resolve').click();await page.waitForFunction(()=>PTRPG.snapshot().battle?.pointer>0);
 await page.waitForFunction(()=>document.querySelector('[data-action="meaning"]')&&!document.querySelector('[data-action="meaning"]').disabled,{timeout:20000});
 await page.locator('[data-action="meaning"]').click();await page.locator('.rank-arena [data-actor="0"]').click();assert.equal(await page.locator('#resolve').isDisabled(),false);await page.locator('#resolve').click();
  await page.waitForFunction(()=>document.querySelector('[data-action="wait"]')&&!document.querySelector('[data-action="wait"]').disabled,{timeout:20000});
 await page.reload();assert.equal((await page.evaluate(()=>PTRPG.snapshot())).battle.system,'ranks');
 assert.deepEqual(errors,[]);console.log('Rank combat UI passed: 4-vs-ranks, targeting, position restrictions, actions, support, save and desktop/mobile.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
