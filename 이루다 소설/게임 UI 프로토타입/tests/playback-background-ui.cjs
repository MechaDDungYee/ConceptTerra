const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless:true, channel:'msedge' });
  try {
    for (const [width,height] of [[1440,900],[844,390]]) {
      const page = await browser.newPage({viewport:{width,height}});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
      await page.evaluate(() => {
        document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));
        startBattleLineup(createBattleRoster().map(u=>u.id));
        const [a,b]=battleDummy.allies,[e,f]=battleDummy.enemies;
        a.x=3;a.y=2;e.x=5;e.y=2;b.x=2;b.y=4;f.x=6;f.y=4;
        const action={name:'이동 검증',type:'타격',scope:'단일',range:8,hits:1,power:10,wave:0,effect:'',sequence:[{ratio:1,effect:'',push:1}]};
        const plans=[{id:a.id+':0',unit:a,action,target:e,slot:0},{id:b.id+':0',unit:b,action,target:f,slot:0}];
        getBattleSchedule=()=>({events:plans.map(p=>({plans:[p]})),plans,ranks:new Map()});
        rollWaveValue=()=>0;window.battlePlaybackTimingScale=.4;renderBattleDummy();
        window.backgroundSamples=[];window.displacementErrors=[];window.cameraResets=0;
        const observer=new MutationObserver(records=>{
          const overlay=document.querySelector('.battle-playback');if(!overlay)return;
          const bg=overlay.querySelector('.playback-backdrop'),world=overlay.querySelector('.playback-world');
          if(bg){const r=bg.getBoundingClientRect();backgroundSamples.push([r.x,r.y,r.width,r.height]);}
          if(Number(overlay.dataset.focusCount)>1 && world.style.transform==='none')cameraResets++;
          if(!records.some(r=>r.attributeName==='data-step')||overlay.dataset.step!=='unit-displaced')return;
          const step=getLastBattleExecution().steps.find(s=>s.sequence===Number(overlay.dataset.sequence));
          const actor=overlay.querySelector(`[data-unit="${step.unitId}"]`),unit=step.units.find(u=>u.id===step.unitId);
          const matrix=new DOMMatrix(getComputedStyle(world).transform).inverse();
          const point=(x,y)=>{const r=overlay.querySelector(`[data-cell-x="${x}"][data-cell-y="${y}"]`).getBoundingClientRect();return matrix.transformPoint({x:r.x+r.width/2,y:r.y+r.height/2});};
          const initial=getLastBattleExecution().steps[0].units.find(u=>u.id===unit.id);
          const from=point(initial.x,initial.y),to=point(unit.x,unit.y);
          displacementErrors.push(Math.abs(parseFloat(actor.style.left)-Number(actor.dataset.originX)-(to.x-from.x)),Math.abs(parseFloat(actor.style.top)-Number(actor.dataset.originY)-(to.y-from.y)));
        });
        observer.observe(document.body,{subtree:true,attributes:true,childList:true,attributeFilter:['data-step','style','data-focus-count']});
        window.backgroundPlayback=resolveBattleTurn().finally(()=>observer.disconnect());
      });
      await page.locator('.battle-playback[data-phase="judgment"]').waitFor();
      await page.screenshot({path:path.resolve(__dirname,`stable-background-${width}.png`)});
      await page.evaluate(()=>window.backgroundPlayback);
      const result=await page.evaluate(()=>({samples:backgroundSamples,displacement:displacementErrors,resets:cameraResets}));
      assert.ok(result.samples.length>10);
      assert.ok(result.samples.every(([x,y,w,h])=>Math.abs(x)<1&&Math.abs(y)<1&&Math.abs(w-width)<1&&Math.abs(h-height)<1));
      assert.equal(result.resets,0);
      assert.ok(result.displacement.length>=4);
      assert.ok(result.displacement.every(e=>e<2),JSON.stringify(result.displacement));
      assert.deepEqual(errors,[]);
      console.log(`PASS stable backdrop, continuous camera and world-space displacement ${width}`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
