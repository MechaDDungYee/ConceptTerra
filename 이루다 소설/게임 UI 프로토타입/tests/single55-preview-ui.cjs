const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({headless: true, channel: 'msedge'});
  try {
    for (const [width, height] of [[1440, 900], [844, 390]]) {
      const page = await browser.newPage({viewport: {width, height}});
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(pathToFileURL(path.resolve(__dirname, '../assets/battle/motions/single55/preview.html')).href);
      await page.evaluate(async () => {
        await Promise.all([...document.querySelectorAll('svg image')].map(node => new Promise((resolve, reject) => {
          const img = new Image(); img.onload = resolve; img.onerror = reject; img.src = node.getAttribute('href');
        })));
      });
      assert.equal(await page.locator('svg image').count(), 36);
      const alignment = await page.locator('svg image').evaluateAll(nodes => nodes.map(node => ({
        src:node.getAttribute('href'), x:Number(node.getAttribute('x')),
        width:Number(node.getAttribute('width'))
      })));
      for (const result of alignment) {
        const file = path.resolve(__dirname, '../assets/battle/motions/single55',result.src);
        const {data,info} = await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
        let left=info.width,right=-1;
        for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
          if(data[(y*info.width+x)*4+3]>=128){left=Math.min(left,x);right=Math.max(right,x);}
        }
        assert.equal(result.x+(left+right)/2, 800, 'Visible silhouette horizontally centered');
        assert.equal(result.width, info.width, 'Original scale preserved');
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.locator('#guides').uncheck();
      assert.ok(await page.locator('body').evaluate(node => node.classList.contains('guide-off')));
      await page.locator('#guides').check();
      await page.screenshot({path: path.join(__dirname, `single55-preview-${width}.png`)});
      await page.locator('#eojyeo').scrollIntoViewIfNeeded();
      await page.screenshot({path: path.join(__dirname, `single55-eojyeo-${width}.png`)});
      assert.deepEqual(errors, []); await page.close();
    }
  } finally { await browser.close(); }
  console.log('PASS single-image comparison preview: desktop and landscape phone.');
})().catch(error => { console.error(error); process.exitCode = 1; });
