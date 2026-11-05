const path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{for(const width of [1440,844]){
  const page=await browser.newPage({viewport:{width,height:width===1440?900:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  assert.ok(await page.evaluate(()=>createBattleRoster().every(u=>{
   if(!['이루어질','이루어져'].includes(u.name))return !battleMotionFrame(u.name,'move',u.skills[0],1);
   return u.skills.every(s=>Array.from({length:Math.max(1,s.hits)},(_,i)=>battleMotionFrame(u.name,'attack',s,i+1)).every(Boolean))
    &&Array.from({length:Math.max(1,u.ego.hits)},(_,i)=>battleMotionFrame(u.name,'attack',u.ego,i+1)).every(Boolean)
    &&(u.guard.type!=='반격'||battleMotionFrame(u.name,'attack',u.guard,1)?.key==='defense')
    &&!battleMotionFrame(u.name,'attack',{name:'unknown'},1);
  })));
  for(const scenario of ['clash','hurt','clash-eojyeo','hurt-eojyeo']){
   await page.evaluate(scenario=>{
    window.originalMotionSchedule ||= getBattleSchedule;
    getBattleSchedule = window.originalMotionSchedule;
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));
    const roster=createBattleRoster();startBattleLineup(roster.map(u=>u.id));
    const a=scenario.endsWith('eojyeo')?roster.find(u=>u.name==='이루어져'):roster[0],e=battleDummy.enemies[0];
    battleDummy.allies=[a];battleDummy.enemies=[e];battleDummy.bench=[];
    a.x=3;a.y=2;e.x=4;e.y=2;a.hp=a.maxHp=200;e.hp=e.maxHp=200;
    a.buffs=[];a.debuffs=[];e.buffs=[];e.debuffs=[];
    const action={...a.skills[0],range:2,power:12,wave:0};
    const enemy={...action,name:'enemy',power:3,wave:0,hits:1};
    let events;
    if(scenario.startsWith('clash'))events=[{plans:[{id:'a',unit:a,action,target:e},{id:'e',unit:e,action:enemy,target:a}]}];
    if(scenario==='support')events=[{plans:[{id:'a',unit:a,action:a.ego,target:a}]}];
    if(scenario.startsWith('hurt'))events=[{plans:[{id:'e',unit:e,action:enemy,target:a}]}];
    getBattleSchedule=()=>({events,plans:events.flatMap(e=>e.plans),ranks:new Map()});
    rollWaveValue=()=>0;window.battlePlaybackTimingScale=.35;window.seenMotions=[];
    window.motionObserver?.disconnect();
    window.motionObserver=new MutationObserver(records=>records.forEach(r=>{
     if(r.attributeName==='data-motion')seenMotions.push(r.target.dataset.motion);
    }));
    motionObserver.observe(document.querySelector('#node-stage'),{subtree:true,attributes:true,attributeFilter:['data-motion']});
    renderBattleDummy();
   },scenario);
   await page.locator('#battle-resolve').click();
   const wanted=scenario.startsWith('clash')?'skill-1-hit-1':'hurt';
   await page.waitForFunction(wanted=>!!document.querySelector(`.playback-actor[data-motion="${wanted}"]`),wanted,{timeout:30000});
   const actor=page.locator(`.playback-actor[data-motion="${wanted}"]`);
   assert.ok(await actor.locator('img.motion-sprite').evaluate(img=>img.complete&&img.naturalWidth===1086&&img.getAttribute('src').includes('/single55/')));
   await page.screenshot({path:path.join(__dirname,`motion-${scenario}-${width}.png`)});
   await page.waitForFunction(()=>!battlePresentationActive,{},{timeout:30000});
   if(scenario.startsWith('clash')){
    const seen=await page.evaluate(()=>seenMotions);
    assert.ok(seen.includes('clash')&&seen.includes('clash-win')&&seen.includes('skill-1-hit-2'),JSON.stringify(seen));
   }
   assert.equal(await page.locator('.battle-playback').count(),0);
  }
  assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close();}
 console.log('PASS single55 skill mappings, idle fallback, and real clash/hurt playback on desktop/mobile.');
})().catch(e=>{console.error(e);process.exitCode=1;});
