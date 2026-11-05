const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file:///'+path.join(__dirname,'web/index.html').replaceAll('\\','/'));
 await page.locator('#character-form').waitFor();
 await page.screenshot({path:path.join(__dirname,'qa-creation.png')});
 await page.locator('#character-form button[type=submit]').click();
 await page.screenshot({path:path.join(__dirname,'qa-desktop.png')});
 await page.locator('[data-choice="1"]').click();
 await page.locator('[data-choice="0"]').click();
 await page.locator('[data-choice="0"]').click();
 if((await page.evaluate(()=>PTRPG.snapshot())).scene!=='lobby')throw Error('Story navigation failed');
 await page.locator('[data-open="inventory"]').click();
 await page.screenshot({path:path.join(__dirname,'qa-inventory.png')});
 await page.locator('.close').click();
 await page.setViewportSize({width:932,height:430});
 await page.screenshot({path:path.join(__dirname,'qa-mobile.png')});
 for(const v of [{width:1440,height:900},{width:932,height:430},{width:844,height:390},{width:390,height:844}]){
  await page.setViewportSize(v);
  const issues=await page.evaluate(()=>{
   const game=document.querySelector('#game').getBoundingClientRect();
   return [...document.querySelectorAll('.choice,.member,header,footer,.story')].map(el=>({name:el.className||el.tagName,r:el.getBoundingClientRect().toJSON()})).filter(x=>x.r.right>innerWidth+2||x.r.left<0||(innerWidth>innerHeight&&x.r.bottom>game.bottom+2));
  });if(issues.length)throw Error('Overflow '+JSON.stringify({v,issues}));
 }
 // Browser-local save path, reload restores the same scene.
 await page.reload();await page.waitForFunction(()=>window.PTRPG);
 if((await page.evaluate(()=>PTRPG.snapshot())).scene!=='lobby')throw Error('Save reload failed');
 // Exercise the new choices through the same UI used by players.
 await page.setViewportSize({width:1440,height:900});
 await page.locator('[data-choice="0"]').click();
 await page.locator('#roll-next').click();
 await page.locator('#loot-next').waitFor();
 if(!(await page.locator('.loot-copy').innerText()).includes('배분'))throw Error('Discovery should not claim personal ownership');
 await page.screenshot({path:path.join(__dirname,'qa-item-discovery.png')});
 await page.locator('#loot-next').click();
 if((await page.evaluate(()=>PTRPG.snapshot())).scene!=='pantry')throw Error('Missing pantry exploration');
 await page.locator('[data-choice="0"]').click();
 if((await page.evaluate(()=>PTRPG.snapshot())).scene!=='supplies')throw Error('Missing allocation scene');
 for(const v of [{width:1440,height:900},{width:932,height:430},{width:844,height:390},{width:390,height:844}]){
  await page.setViewportSize(v);
  const bad=await page.evaluate(()=>[...document.querySelectorAll('.choice,.member,.story')].some(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+2||r.left<0||(innerWidth>innerHeight&&r.bottom>innerHeight+2);}));
  if(bad)throw Error('Branch overflow '+JSON.stringify(v));
 }
 await page.setViewportSize({width:1440,height:900});
 await page.screenshot({path:path.join(__dirname,'qa-choices.png')});
 await page.locator('[data-choice="0"]').click();
 await page.locator('[data-choice="2"]').click();
 if((await page.evaluate(()=>PTRPG.snapshot())).scene!=='camp_wait')throw Error('Waiting forced an upstairs exit');
 await page.reload();await page.waitForFunction(()=>window.PTRPG);
 if((await page.evaluate(()=>PTRPG.snapshot())).camp.waits!==1)throw Error('Choice consequence was not saved');
 await page.locator('[data-open="journal"]').click();
 await page.locator('[data-jtab="decisions"]').click();
 if(!(await page.locator('#journal-body').innerText()).includes('공동 비축분'))throw Error('Relationship ledger missing');
 await page.screenshot({path:path.join(__dirname,'qa-relations.png')});
 await page.locator('.close').click();
 const saved=await page.evaluate(()=>{const s=PTRPG.snapshot();s.scene='sixth';s.battle=null;s.ending=null;localStorage.setItem('ptrpg-hospital-eight-v1',JSON.stringify(s));return s;});
 await page.reload();await page.waitForFunction(()=>window.PTRPG);
 await page.setViewportSize({width:1440,height:900});
 await page.locator('[data-choice="1"]').click();
 await page.evaluate(()=>{const s=PTRPG.snapshot();s.party[0].rank=2;s.battle.queue=[{side:'ally',id:0,speed:10},{side:'enemy',id:0,speed:9}];s.battle.pointer=0;s.battle.started=null;s.battle.plans={};localStorage.setItem('ptrpg-hospital-eight-v1',JSON.stringify(s));});
 await page.reload();await page.waitForFunction(()=>document.querySelector('[data-action="attack"]')&&!document.querySelector('[data-action="attack"]').disabled);
 await page.locator('[data-action="attack"]').click();
 await page.locator('[data-target="0"]').click();
 await page.screenshot({path:path.join(__dirname,'qa-battle.png')});
 if((await page.locator('.enemy img').evaluate(el=>el.naturalWidth))===0)throw Error('Missing enemy asset');
 for(const v of [{width:932,height:430},{width:844,height:390},{width:1440,height:900}]){
  await page.setViewportSize(v);
  const overflow=await page.evaluate(()=>[...document.querySelectorAll('.action,.member,.story,footer')].some(el=>{const r=el.getBoundingClientRect();return r.bottom>innerHeight+2||r.right>innerWidth+2;}));
  if(overflow)throw Error('Battle overflow '+JSON.stringify(v));
 }
 await page.locator('#resolve').click();await page.waitForFunction(()=>!PTRPG.snapshot().battle||PTRPG.snapshot().battle.round>1,{timeout:30000});
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Browser checks passed: story, save, inventory, combat, desktop and mobile layouts');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
