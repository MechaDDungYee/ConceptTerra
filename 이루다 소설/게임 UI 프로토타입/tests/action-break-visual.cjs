const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const [width, height] of [[1440,900],[844,390]]) {
      const page = await browser.newPage({viewport:{width,height}});
      await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
      await page.evaluate(() => {
        document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));
        startBattleLineup(createBattleRoster().map(u=>u.id));
        const a=battleDummy.allies[0],e=battleDummy.enemies[0];a.x=3;a.y=2;e.x=4;e.y=2;
        a.skills[0]={...a.skills[0],power:30};
        const ap={id:`${a.id}:0`,unit:a,action:a.skills[0],target:e,handIndex:0};
        const ep={id:`${e.id}:0`,unit:e,action:{...getEnemyAction(e),power:5},target:a};
        getBattleSchedule=()=>({events:[{plans:[ap,ep]}],plans:[ap,ep],ranks:new Map()});
        rollWaveValue=()=>0;window.battlePlaybackTimingScale=1;
        renderBattleDummy();window.visualPlayback=resolveBattleTurn();
      });
      await page.locator('.playback-action-break').waitFor({state:'attached'});
      await page.waitForTimeout(150);
      await page.screenshot({path:path.resolve(__dirname,`action-break-${width}.png`)});
      await page.locator('.playback-keyword').first().waitFor({state:'attached'});
      await page.waitForTimeout(100);
      await page.screenshot({path:path.resolve(__dirname,`keyword-grant-${width}.png`)});
      await page.evaluate(()=>window.visualPlayback);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
