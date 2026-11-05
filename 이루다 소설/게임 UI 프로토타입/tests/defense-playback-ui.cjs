const path = require('node:path');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const {chromium} = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({headless:true,channel:'msedge'});
  try {
    for (const width of [1440,844]) for (const type of ['회피','반격','방어']) {
      const page = await browser.newPage({viewport:{width,height:width===1440?900:390}});
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
      await page.evaluate(type => {
        document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));
        const roster=createBattleRoster(); startBattleLineup(roster.map(u=>u.id));
        const a=roster[0],e=battleDummy.enemies[0];
        battleDummy.allies=[a]; battleDummy.enemies=[e]; battleDummy.bench=[];
        a.x=3;a.y=3;e.x=4;e.y=3;a.hp=a.maxHp=100;e.hp=e.maxHp=100;
        a.buffs=[];a.debuffs=[];e.buffs=[];e.debuffs=[];
        const guard={name:'대응 검증',type,scope:type==='반격'?'단일':'자신',range:1,hits:type==='반격'?1:0,power:8,wave:0,effect:''};
        a.guard=guard;
        const attack={name:'연속 공격 검증',type:'타격',scope:'단일',range:1,hits:3,power:4,wave:0,effect:''};
        const plans=[{id:e.id+':0',unit:e,action:attack,target:a,slot:0},
          {id:'wait',unit:e,action:{name:'wait',type:'지원',scope:'자신',range:0,hits:0,power:0,wave:0,effect:''},target:e,slot:1},
          {id:a.id+':0',unit:a,action:guard,target:a,slot:0}];
        getBattleSchedule=()=>({events:plans.map(plan=>({plans:[plan]})),plans,ranks:new Map()});
        rollWaveValue=()=>0; window.battlePlaybackTimingScale=.2;renderBattleDummy();
        window.firstAttackFrames=[];
        new MutationObserver(records=>records.forEach(record=>{
          if(record.attributeName!=='data-step')return;
          const overlay=record.target;
          if(overlay.querySelector('.playback-order')?.textContent!=='순서 1')return;
          firstAttackFrames.push({step:overlay.dataset.step,focus:Number(overlay.dataset.focusCount),
            camera:overlay.querySelector('.playback-world').style.transform,
            positions:[...overlay.querySelectorAll('.playback-actor.active')].map(el=>({id:el.dataset.unit,x:el.style.left,y:el.style.top}))});
        })).observe(document.querySelector('#node-stage'),{subtree:true,attributes:true,attributeFilter:['data-step']});
      },type);
      await page.locator('#battle-resolve').click();
      await page.waitForFunction(()=>document.querySelector('.battle-playback')?.dataset.step==='attack-roll');
      assert.equal(await page.locator('.playback-actor[data-unit="eojil"] .playback-action h3').textContent(),'대응 검증');
      assert.ok(await page.locator('.playback-actor.active').evaluateAll(els=>{
        const defender=els.find(el=>el.dataset.unit==='eojil'),attacker=els.find(el=>el.dataset.unit!=='eojil');
        return defender.dataset.positionRole==='anchor'&&attacker.dataset.positionRole==='moving'
          &&Math.abs(parseFloat(defender.style.left)-Number(defender.dataset.originX))<.01
          &&Math.abs(parseFloat(defender.style.top)-Number(defender.dataset.originY))<.01;
      }));
      if(type==='반격') {
        await page.waitForFunction(()=>document.querySelector('.battle-playback')?.dataset.step==='counter-start');
        await page.waitForFunction(()=>document.querySelector('.playback-verdict')?.textContent.includes('1회'));
      } else {
        await page.waitForFunction(()=>document.querySelector('.battle-playback')?.dataset.step==='defense-roll');
        await page.waitForFunction(()=>document.querySelector('.playback-verdict')?.textContent.includes('회피 성공') || document.querySelector('.playback-verdict')?.textContent.includes('피해 4 감소'));
        assert.ok(await page.locator('.playback-actor.active').count()===2);
      }
      await page.screenshot({path:path.join(__dirname,`defense-${type}-${width}.png`)});
      await page.waitForFunction(()=>!battlePresentationActive,{},{timeout:30000});
      const result=await page.evaluate(()=>({hp:battleDummy.allies[0].hp,enemyHp:battleDummy.enemies[0].hp,steps:getLastBattleExecution().steps,frames:firstAttackFrames}));
      const firstRoll=result.frames.find(f=>f.step==='attack-roll');
      for(const frame of result.frames.filter(f=>['defense-ready','defense-roll','hit-evaded','counter-start','damage-applied'].includes(f.step))){
        assert.equal(frame.focus,1,'Unexpected repeat approach at '+frame.step);
        assert.deepEqual(frame.positions,firstRoll.positions,'Participants moved during '+frame.step);
        assert.equal(frame.camera,firstRoll.camera,'Camera restarted during '+frame.step);
      }
      assert.equal(result.steps.filter(s=>s.type==='defense-ready').length,1);
      assert.equal(result.steps.find(s=>s.type==='defense-ready').order,1);
      if(type==='반격') {
        assert.equal(result.hp,88);assert.equal(result.enemyHp,92);
        assert.equal(result.steps.filter(s=>s.type==='counter-start').length,1);
      } else {
        assert.equal(result.hp,100);
        assert.equal(result.steps.filter(s=>s.type==='defense-roll').length,3);
        if(type==='회피') assert.equal(result.steps.filter(s=>s.type==='hit-evaded').length,3);
        const firstDefense=result.steps.findIndex(s=>s.type==='defense-roll');
        const firstContact=result.steps.findIndex(s=>s.type===(type==='회피'?'hit-evaded':'damage-applied'));
        assert.ok(firstDefense>=0&&firstDefense<firstContact,'First hit must be defended before contact');
      }
      assert.deepEqual(errors,[]);await page.close();
    }
    console.log('PASS persistent dodge/block, single counter, reaction playback and desktop/mobile.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
