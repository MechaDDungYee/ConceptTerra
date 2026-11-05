const path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{for(const width of [1440,844]){
  const page=await browser.newPage({viewport:{width,height:width===1440?900:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const [index,key] of ['prediction','certainty','revision','annotation','overdrive','evade'].entries()){
   await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
   await page.evaluate(index=>{
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));
    const roster=createBattleRoster();startBattleLineup(roster.map(u=>u.id));
    const a=roster.find(u=>u.name==='이루어질'),e=battleDummy.enemies[0];
    battleDummy.allies=[a];battleDummy.enemies=[e];battleDummy.bench=[];
    a.x=3;a.y=2;e.x=4;e.y=2;a.hp=a.maxHp=999;e.hp=e.maxHp=999;
    a.buffs=[];a.debuffs=[];e.buffs=[];e.debuffs=[];
    const action=index<4?a.skills[index]:index===4?a.ego:a.guard;
    let plans=[{id:'a',unit:a,action,target:index===5?a:e,slot:0}];
    if(index===5)plans.push({id:'e',unit:e,action:{name:'enemy',type:'타격',scope:'단일',range:1,power:4,wave:0,hits:1,effect:''},target:a,slot:0});
    getBattleSchedule=()=>({events:plans.map(plan=>({plans:[plan]})),plans,ranks:new Map()});
    rollWaveValue=()=>0;window.battlePlaybackTimingScale=.8;window.effectHits=[];
    new MutationObserver(records=>records.forEach(r=>{
     if(r.attributeName==='data-hit')effectHits.push(Number(r.target.dataset.hit));
    })).observe(document.querySelector('#node-stage'),{subtree:true,attributes:true,attributeFilter:['data-hit']});
    renderBattleDummy();
    if(battleEffectFor({...a,name:'이루소서',side:'ally'},action)!==null)throw Error('Effects leaked to another identity');
    if(battleEffectFor({...a,side:'enemy'},action)!==null)throw Error('Effects leaked to enemy');
   },index);
   await page.locator('#battle-resolve').click();
   const kind=index===5?'response':'impact';
   await page.waitForFunction(({key,kind})=>{
    const c=document.querySelector('.playback-fx-layer');if(c?.dataset.effect!==key||c.dataset.kind!==kind)return false;
    const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    let filled=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>15)filled++;
    return filled>80;
   },{key,kind},{timeout:30000});
   assert.ok(await page.locator('.playback-fx-layer').evaluate(c=>getComputedStyle(c).pointerEvents==='none'&&getComputedStyle(c).zIndex==='12'));
   if(index===2||index===4||index===5)await page.screenshot({path:path.join(__dirname,`eojil-fx-${key}-${width}.png`)});
   await page.waitForFunction(()=>!battlePresentationActive,{},{timeout:30000});
   assert.equal(await page.locator('.playback-fx-layer').count(),0);
   const result=await page.evaluate(()=>({steps:getLastBattleExecution().steps,hp:battleDummy.allies[0].hp,hits:effectHits}));
   if(index===5){assert.equal(result.hp,999);assert.ok(result.steps.some(s=>s.type==='hit-evaded'));}
   else for(let i=1;i<=[2,2,3,1,3][index];i++)assert.ok(result.hits.includes(i),key+' hit '+i);
  }
  assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close();}
 console.log('PASS 4 skills, all hit indexes, overdrive, successful evade, visible canvas pixels, identity isolation and cleanup on desktop/mobile.');
})().catch(e=>{console.error(e);process.exitCode=1;});
