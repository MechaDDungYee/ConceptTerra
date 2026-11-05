const path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const dir=path.resolve(__dirname,'../assets/battle/motions'),m=require(path.join(dir,'motion-manifest-v2.json'));
 assert.equal(m.characters.length,9);assert.equal(m.characters.flatMap(c=>c.frames).length,143);
 assert.equal(m.characters.flatMap(c=>c.frames).filter(f=>f.review==='check-source-edge').length,0);
 for(const c of m.characters)for(const f of c.frames){
  const file=path.join(dir,f.src),meta=await sharp(file).metadata();
  assert.equal(meta.width,1536);assert.equal(meta.height,2048);assert.ok(meta.hasAlpha);
  const native=await sharp(path.join(dir,f.nativeSrc)).metadata();assert.deepEqual([native.width,native.height],f.nativeSize);
  const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let left=info.width,top=info.height,right=-1,bottom=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>24){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  assert.ok(left>=230&&right<=1306&&top>=307&&bottom<=1741,f.src+' exceeds safe cell');
 }
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{for(const width of [1440,844]){
  const page=await browser.newPage({viewport:{width,height:width===1440?900:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(dir,'preview.html')).href);
  for(const c of m.characters){await page.selectOption('#character',c.id);await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));assert.equal(await page.locator('#poses img').count(),c.frames.length);assert.equal(await page.locator('#poses a').count(),c.frames.length);}
  await page.selectOption('#character','eojil');await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  await page.screenshot({path:path.join(dir,`preview-v2-${width}.png`)});assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close();}
 console.log('PASS 143 revised transparent canvases, fixed safe rectangles, native dimensions and desktop/mobile preview. Anatomy remains a separate visual review.');
})().catch(e=>{console.error(e);process.exitCode=1;});
