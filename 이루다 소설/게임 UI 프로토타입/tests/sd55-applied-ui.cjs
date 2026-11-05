const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{for(const width of [1440,844]){
  const page=await browser.newPage({viewport:{width,height:width===1440?900:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  const roster=await page.evaluate(()=>createBattleRoster().map(u=>({name:u.name,image:getBattleUnitImage(u,'ally')})));
  assert.equal(roster.length,9);assert.ok(roster.every(u=>u.image.includes('/sd-55/')));
  await page.evaluate(()=>{
   document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));
   startBattleLineup(createBattleRoster().map(u=>u.id));renderBattleDummy();
  });
  await page.locator('.battle-token.ally img').first().waitFor();
  await page.evaluate(async()=>Promise.all([...document.querySelectorAll('.battle-token.ally img')].map(img=>img.decode())));
  assert.ok(await page.locator('.battle-token.ally img').evaluateAll(imgs=>imgs.length===4&&imgs.every(img=>img.naturalWidth===1086&&img.naturalHeight===1448)));
  await page.screenshot({path:path.join(__dirname,'sd55-applied-'+width+'.png')});
  assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close();}
 console.log('PASS new SDs loaded in desktop/mobile battle.');
})().catch(e=>{console.error(e);process.exitCode=1;});
