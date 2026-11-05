const path=require('node:path');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 for(const job of require('../tools/sd-proportion-assets.json')){
  const target=path.join(root,job.target),meta=await sharp(target).metadata(),stats=await sharp(target).stats();
  assert.equal(meta.width,768);assert.equal(meta.height,1024);assert.ok(meta.hasAlpha);assert.equal(stats.channels[3].min,0);assert.equal(stats.channels[3].max,255);
  const jpg=path.join(path.dirname(target),'jpg',path.basename(target,'.png')+'.jpg');assert.ok(fs.statSync(jpg).size<1000000);
 }
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  const orders=[['sosuh','eodo','ryeona','getne','eojil','eojyeo','eora','gena','dorok'],['eojil','eojyeo','eora','gena','sosuh','eodo','ryeona','getne','dorok'],['dorok','sosuh','eodo','ryeona','getne','eojil','eojyeo','eora','gena']];
  const seen=new Set();
  for(const [index,order] of orders.entries()){
   await page.evaluate(order=>{document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));startBattleLineup(order);},order);
   await page.waitForFunction(()=>[...document.querySelectorAll('.battle-token.ally img')].every(img=>img.complete&&img.naturalWidth===768));
   const sources=await page.locator('.battle-token.ally img').evaluateAll(images=>images.map(img=>({src:img.getAttribute('src'),height:img.getBoundingClientRect().height})));
   for(const image of sources){assert.ok(image.src.startsWith('assets/battle/sd/'));assert.ok(/_SD_v[23]\.png$/.test(image.src));assert.ok(image.height>50);seen.add(image.src);}
   assert.equal(await page.evaluate(()=>window.battleSpriteAssets['이루게나'].src),'assets/battle/sd/06_이루게나_SD_v3.png');
   assert.ok(await page.evaluate(()=>Object.values(window.battleSpriteAssets).every(asset=>asset.scale===1 && asset.footPivot[1]===964)));
   assert.equal(await page.locator('.battle-token.sd-token').count(),4);
   assert.equal(await page.locator('.battle-token[title="이루리"]').count(),0);
   await page.screenshot({path:path.join(__dirname,`sd-battle-desktop-${index}.png`)});
  }
  assert.equal(seen.size,9);
  await page.setViewportSize({width:844,height:390});
  await page.screenshot({path:path.join(__dirname,'sd-battle-mobile.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS 10 transparent sprites and JPG sizes; all 9 combat SDs load; observer excluded; desktop/mobile rendering.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
