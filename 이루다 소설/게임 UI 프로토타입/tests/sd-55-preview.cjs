const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
(async () => {
 const browser = await chromium.launch({headless:true,channel:'msedge'});
 try {
  for(const width of [1440,844]) {
   const page = await browser.newPage({viewport:{width,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.resolve(__dirname,'../assets/battle/sd/sd-55/preview.html')).href);
   await page.locator('.item').last().waitFor();
   await page.evaluate(async()=>Promise.all([...document.images].map(img=>img.decode())));
   const state=await page.evaluate(()=>({images:[...document.images].every(img=>img.naturalWidth===1086),count:document.querySelectorAll('.item').length,overflow:document.documentElement.scrollWidth>innerWidth}));
   if(errors.length||!state.images||state.count!==9||state.overflow)throw Error(JSON.stringify({errors,state}));
   await page.screenshot({path:path.resolve(__dirname,'../assets/battle/sd/sd-55/preview-'+width+'.png'),fullPage:true});
   await page.locator('#grid').uncheck();
   if(!await page.locator('body.hide').count())throw Error('Guide toggle failed');
   console.log(width+': nine native images, no overflow, guide toggle OK');
   await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
