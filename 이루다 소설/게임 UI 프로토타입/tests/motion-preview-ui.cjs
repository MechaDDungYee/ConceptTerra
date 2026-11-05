const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const dir=path.resolve(__dirname,'../assets/battle/motions'),m=require(path.join(dir,'motion-manifest.json'));
 assert.equal(m.characters.length,9);let count=0;
 for(const c of m.characters)for(const f of c.frames){const meta=await sharp(path.join(dir,f.src)).metadata();assert.equal(meta.width,768);assert.equal(meta.height,1024);assert.ok(meta.hasAlpha);count++;}
 assert.equal(count,143);
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{for(const width of [1440,844]){
  const page=await browser.newPage({viewport:{width,height:width===1440?900:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(dir,'preview.html')).href);
  for(const c of m.characters){await page.selectOption('#character',c.id);await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));assert.equal(await page.locator('#poses img').count(),c.frames.length);}
  await page.selectOption('#character','eodo');await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  await page.screenshot({path:path.join(dir,`preview-${width}.png`)});assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close();}
 console.log('PASS 143 transparent PNG canvases, 9 character previews and desktop/mobile image loading.');
})().catch(e=>{console.error(e);process.exitCode=1;});
