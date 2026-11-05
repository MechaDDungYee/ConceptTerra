const path=require('node:path');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.setDefaultTimeout(8000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.evaluate(()=>{
   document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));
   activeChapterId='ch1';activeStageId='ch1-2';document.body.classList.add('story-focus');enterStage();
   prologueSceneIndex=getActiveStoryScenes().findIndex(s=>s.kind==='battle');renderPrologueScene();
  });
  assert.equal(await page.locator('[data-lineup-unit]').count(),8);
  assert.equal(await page.locator('[data-lineup-unit="eodo"]').count(),0);
  assert.equal(await page.locator('#tutorial-next').isDisabled(),true);
  for(const id of ['eojil','eojyeo','sosuh','gena','eora','dorok','ryeona','getne'])await page.locator(`[data-lineup-unit="${id}"]`).click();
  await page.screenshot({path:path.join(root,'tests/tutorial-lineup-desktop.png')});
  await page.locator('#lineup-enter').click();
  assert.equal(await page.evaluate(()=>battleDummy.allies.length),4);
  assert.equal(await page.evaluate(()=>battleDummy.bench.length),4);
  assert.equal(await page.evaluate(()=>[...battleDummy.allies,...battleDummy.bench].some(u=>u.id==='eodo')),false);
  await page.locator('#tutorial-next').click();
  await page.locator('#tutorial-next').click();
  await page.locator('#tutorial-next').click();
  assert.equal(await page.evaluate(()=>battleTutorial.step),3);
  await page.locator('#tutorial-next').click();
  assert.equal(await page.locator('#tutorial-next').isDisabled(),true);
  await page.locator('[data-battle-unit="eojil"]').click();
  await page.locator('#tutorial-next').click();
  await page.locator('#tutorial-next').click();
  await page.locator('[data-move-x]').first().click();
  await page.locator('#tutorial-next').click();
  await page.locator('#tutorial-next').click();
  await page.locator('.battle-skill.hand').first().dispatchEvent('pointerdown',{button:0,clientX:400,clientY:800});
  await page.locator('#tutorial-next').click();
  await page.locator('#tutorial-next').click();
  const target=await page.evaluate(()=>battleDummy.enemies.find(e=>isBattleTargetInRange(getSelectedBattleUnit(),getSelectedBattleUnit().reserved,e))?.id);
  assert.ok(target,'tutorial move must leave a reachable enemy');
  await page.locator(`[data-battle-target="${target}"]`).click();
  await page.locator('#tutorial-next').click();
  for(let i=7;i<=11;i++)await page.locator('#tutorial-next').click();
  assert.equal(await page.evaluate(()=>battleTutorial.step),12);
  await page.locator('#tutorial-next').click();
  await page.locator('[data-battle-unit="eojyeo"]').click();
  await page.locator('.battle-skill.guard').dispatchEvent('pointerdown',{button:0,clientX:400,clientY:800});
  await page.locator('#tutorial-next').click();await page.locator('#tutorial-next').click();
  assert.equal(await page.evaluate(()=>battleTutorial.step),14);
  await page.locator('#tutorial-next').click();
  await page.screenshot({path:path.join(root,'tests/tutorial-resolve-desktop.png')});
  await page.setViewportSize({width:844,height:390});
  await page.screenshot({path:path.join(root,'tests/tutorial-resolve-mobile.png')});
  assert.equal(await page.locator('#battle-resolve').isDisabled(),false);
  await page.locator('#battle-resolve').click();
  await page.locator('#tutorial-next').click();
  for(let i=15;i<=18;i++)await page.locator('#tutorial-next').click();
  assert.equal(await page.evaluate(()=>battleTutorial.step),19);
  await page.locator('#tutorial-next').click();
  await page.evaluate(()=>{
   // Resolve actual attacks/movement repeatedly, rather than forcing enemy HP to zero.
   Math.random=()=>.5;
   for(let turn=0;turn<30&&!battleDummy.enemies.every(e=>e.hp<=0);turn++){
    for(const unit of battleDummy.allies.filter(u=>u.hp>0)){
     battleDummy.selected=unit.id;cancelPendingBattleAction();
     for(let count=0;count<(unit.actionCapacity||1);count++){
      const enemy=battleDummy.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.abs(a.x-unit.x)+Math.abs(a.y-unit.y)-Math.abs(b.x-unit.x)-Math.abs(b.y-unit.y))[0];if(!enemy)break;
      let hand=unit.hand.findIndex((s,i)=>!unit.queuedActions.some(a=>a.handIndex===i)&&isBattleTargetInRange(unit,unit.skills[s],enemy));
      while(hand<0&&unit.moveLeft>0){
       const moves=[[unit.x+1,unit.y],[unit.x-1,unit.y],[unit.x,unit.y+1],[unit.x,unit.y-1]].filter(([x,y])=>canMoveSelectedUnitTo(x,y)).sort((a,b)=>Math.abs(a[0]-enemy.x)+Math.abs(a[1]-enemy.y)-Math.abs(b[0]-enemy.x)-Math.abs(b[1]-enemy.y));
       if(!moves.length)break;moveBattleUnitTo(...moves[0]);
       hand=unit.hand.findIndex((s,i)=>!unit.queuedActions.some(a=>a.handIndex===i)&&isBattleTargetInRange(unit,unit.skills[s],enemy));
      }
      if(hand>=0){reserveBattleSkill(String(hand));assignBattleTarget(enemy.id);}
     }
    }
    resolveBattleTurn();
   }
  });
  assert.equal(await page.evaluate(()=>battleDummy.enemies.every(e=>e.hp<=0)),true,JSON.stringify(await page.evaluate(()=>({allies:battleDummy.allies.map(u=>[u.id,u.hp,u.x,u.y]),enemies:battleDummy.enemies.map(u=>[u.hp,u.x,u.y]),log:battleDummy.log.slice(-10)}))));
  await page.locator('#tutorial-next').click();await page.locator('#tutorial-next').click();
  assert.equal(await page.locator('.visual-novel').count(),1);
  assert.equal(await page.evaluate(()=>battleTutorial),null);
  assert.ok((await page.locator('#dialogue-line').count())===1);
  assert.equal(await page.evaluate(()=>getActiveStoryScenes()[prologueSceneIndex].speakerId),'이루어질');
  assert.deepEqual(errors,[]);
  console.log('PASS gated hands-on tutorial, Eodo exclusion, actual battle victory and story resume');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
