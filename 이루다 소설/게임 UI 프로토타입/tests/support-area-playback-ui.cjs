const path=require('node:path');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  for(const width of [1440,844]){
   for(const mode of ['support','support-right','whole','center']){
    const page=await browser.newPage({viewport:{width,height:width===1440?900:390}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    await page.evaluate(mode=>{
     document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));
     const roster=createBattleRoster();startBattleLineup(roster.map(u=>u.id));
     const a=roster.find(u=>u.id==='getne'),friend=roster.find(u=>u.id==='eojil'),third=roster.find(u=>u.id==='dorok');
     a.x=mode==='support-right'?8:1;a.y=2;friend.x=mode==='support-right'?1:8;friend.y=4;
     third.x=4;third.y=2;third.sp=50;third.buffs=[];third.debuffs=[];
     a.hp=a.maxHp;a.sp=50;a.buffs=[];a.debuffs=[];
     friend.hp=friend.maxHp;friend.sp=50;friend.buffs=[];friend.debuffs=[];
     battleDummy.allies=[a,friend,third];battleDummy.bench=[];battleDummy.selected=a.id;
     battleDummy.enemies=battleDummy.enemies.slice(0,2);
     battleDummy.enemies.forEach((e,i)=>{
      e.hp=e.maxHp=100;e.x=i?1:2;e.y=i?3:2;
      e.preparedAction={name:'대기 방어',type:'방어',scope:'자신',range:0,hits:0,power:1,wave:0,effect:''};e.targetId=e.id;
     });
     const action=mode.startsWith('support')?a.skills[3]:{name:'광역 행동 검증',type:'타격',scope:mode==='whole'?'전 구역':'자신 중심 십자',range:mode==='whole'?'전장':1,hits:1,power:10,wave:1,effect:''};
     a.queuedActions=[{action,targetId:mode.startsWith('support')?friend.id:mode==='center'?a.id:battleDummy.enemies[0].id,decisionOrder:99}];
     rollWaveValue=()=>3;window.battlePlaybackTimingScale=.25;renderBattleDummy();
    },mode);
    await page.locator('#battle-resolve').click();
    await page.waitForFunction(mode=>document.querySelector('.battle-playback')?.dataset.step===(mode.startsWith('support')?'support-roll':'attack-roll'),mode);
    const secondary=page.locator('.playback-actor.affected:not(.active):not([hidden])');
    assert.ok(await secondary.count()>0);
    assert.ok(await secondary.evaluateAll(els=>els.every(el=>getComputedStyle(el).filter==='none'&&getComputedStyle(el).opacity==='1')));
    if(mode==='support-right'){
     assert.ok(await page.locator('.playback-actor[data-unit="getne"]').evaluate(el=>el.classList.contains('right')));
     assert.ok(await page.locator('.playback-actor[data-unit="eojil"]').evaluate(el=>el.classList.contains('left')));
    }
    if(mode.startsWith('support')){
     assert.equal(await page.locator('.battle-playback').getAttribute('data-layout'),'approach');
     await page.waitForFunction(()=>!!document.querySelector('.playback-effect'));
     assert.ok(await page.locator('.playback-effect').count()>=2);
    } else {
     await page.waitForFunction(()=>!!document.querySelector('.playback-damage'));
    }
    await page.screenshot({path:path.join(__dirname,`${mode}-playback-${width}.png`)});
    await page.waitForFunction(()=>!battlePresentationActive,{},{timeout:30000});
    const result=await page.evaluate(()=>({steps:getLastBattleExecution().steps.map(s=>s.type),sp:battleDummy.allies.map(u=>u.sp),hp:battleDummy.enemies.map(u=>u.hp)}));
    assert.ok(!result.steps.includes('clash-start'));
    if(mode.startsWith('support')){assert.ok(result.steps.includes('support-end'));assert.deepEqual(result.sp,[54,54,54]);assert.deepEqual(result.hp,[100,100]);}
    else assert.deepEqual(result.hp,[88,88]); // Each prepared block reduces the incoming hit by 1.
    assert.deepEqual(errors,[]);await page.close();
   }
  }
  console.log('PASS real whole-team support, whole-area attacks, self-centered attacks, effect presentation and desktop/mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
