const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.setDefaultTimeout(8000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.evaluate(()=>{
   document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));
   startBattleLineup(['sosuh','eodo','ryeona','getne','eojil','eojyeo','eora','gena','dorok']);
  });
  assert.equal(await page.locator('.ally-action-badge').count(),4);
  assert.equal(await page.locator('.floating-log').count(),0);
  assert.equal(await page.locator('[data-skill-index="swap"]').count(),0);
  await page.locator('[data-battle-unit="eodo"]').dispatchEvent('click');
  assert.equal(await page.locator('[data-skill-index="swap"]').count(),1);
  await page.evaluate(()=>{const u=getSelectedBattleUnit();u.queuedActions=[{action:u.skills[0],targetId:battleDummy.enemies[0].id,decisionOrder:1,source:'hand',handIndex:0}];syncBattleReservation(u);renderBattleDummy();});
  assert.ok(await page.locator('[data-battle-unit="eodo"] .action-slot strong').first().textContent());
  await page.locator('#battle-menu-button').click();
  assert.equal(await page.locator('#battle-menu-panel').isVisible(),true);
  await page.locator('#battle-log-open').click();
  assert.equal(await page.locator('#battle-log-modal').isVisible(),true);
  await page.locator('#battle-log-close').click();
  await page.screenshot({path:path.join(root,'tests/battle-menu-slots-desktop.png')});
  await page.setViewportSize({width:844,height:390});
  await page.screenshot({path:path.join(root,'tests/battle-menu-slots-mobile.png')});
  const showScene=async(stage,sourceParagraph)=>{
   await page.evaluate(({stage,sourceParagraph})=>{
    activeStageId=stage;document.body.classList.add('story-focus');enterStage();
    prologueSceneIndex=getActiveStoryScenes().findIndex(s=>s.sourceParagraph===sourceParagraph&&s.kind==='dialogue');renderPrologueScene();completeTyping(getActiveStoryScenes()[prologueSceneIndex].line);
   },{stage,sourceParagraph});
   await page.locator('.vn-character').first().waitFor({state:'visible'});
   await page.waitForFunction(()=>[...document.querySelectorAll('.vn-character')].every(img=>img.complete&&img.naturalWidth>0));
  };
  await page.setViewportSize({width:1440,height:900});
  await showScene('ch0-3',11);
  const iruriHeight=await page.locator('.vn-character[alt="이루리"]').evaluate(img=>img.getBoundingClientRect().height);
  assert.deepEqual(await page.locator('.vn-character').evaluateAll(images=>images.map(img=>img.alt)),['이루리','이루도록']);
  await page.screenshot({path:path.join(root,'tests/stage3-catch-height-desktop.png')});
  for(let paragraph=9;paragraph<=13;paragraph++) {
   await page.evaluate(paragraph=>{prologueSceneIndex=getActiveStoryScenes().findIndex(s=>s.sourceParagraph===paragraph);renderPrologueScene();},paragraph);
   assert.equal(await page.locator('.vn-character[alt="이루어질"]').count(),0);
  }
  const verifyHeights=async()=>{
   const body=await page.locator('.vn-character').evaluateAll(images=>images.map(img=>{const rect=img.getBoundingClientRect(),profile=window.vnStandingLayout[img.getAttribute('src')];return {height:rect.height*profile.visibleFraction,cm:profile.heightCm,feet:rect.bottom-rect.height*profile.bottomPadding+(img.alt==='이루어져'?document.querySelector('.visual-novel').clientHeight*.07:0),head:rect.top+rect.height*(1-profile.visibleFraction-profile.bottomPadding)};}));
   for(const item of body){assert.ok(Math.abs(item.height/item.cm-body[0].height/body[0].cm)<.02);assert.ok(Math.abs(item.feet-body[0].feet)<1);assert.ok(item.head>=-1);}
  };
  await showScene('ch0-3',26);await verifyHeights();
  assert.ok(Math.abs(await page.locator('.vn-character[alt="이루리"]').evaluate(img=>img.getBoundingClientRect().height)-iruriHeight)<1);
  await page.screenshot({path:path.join(root,'tests/stage3-small-height-desktop.png')});
  await showScene('ch0-3',121);await verifyHeights();
  assert.ok(Math.abs(await page.locator('.vn-character[alt="이루리"]').evaluate(img=>img.getBoundingClientRect().height)-iruriHeight)<1);
  assert.equal(await page.locator('.vn-character[alt="이루어도"]').getAttribute('data-height-cm'),'200');
  await page.screenshot({path:path.join(root,'tests/stage3-tall-height-desktop.png')});
  await page.setViewportSize({width:844,height:390});await verifyHeights();
  await page.screenshot({path:path.join(root,'tests/stage3-tall-height-mobile.png')});
  await page.setViewportSize({width:1440,height:900});
  await showScene('ch0-2',20);
  assert.equal(await page.locator('.speaker-block').textContent(),'펜타R 컴퍼니 - 하자드');
  assert.ok((await page.locator('.vn-character.is-speaking').getAttribute('src')).endsWith('pentar_hazard.png'));
  await page.screenshot({path:path.join(root,'tests/stage2-pentar-desktop.png')});
  await showScene('ch0-3',32);
  assert.equal(await page.locator('.speaker-block').textContent(),'펜타R 컴퍼니 - 바이오');
  assert.ok((await page.locator('.vn-character.is-speaking').getAttribute('src')).endsWith('pentar_bio.png'));
  await page.screenshot({path:path.join(root,'tests/stage3-airship-desktop.png')});
  await showScene('ch0-3',90);
  await page.screenshot({path:path.join(root,'tests/stage3-hangar-desktop.png')});
  await showScene('ch0-3',114);
  assert.equal(await page.locator('.speaker-block').textContent(),'이루다 1팀 - 이루어라');
  await page.screenshot({path:path.join(root,'tests/stage3-bus-desktop.png')});
  await page.setViewportSize({width:844,height:390});
  await page.screenshot({path:path.join(root,'tests/stage3-bus-mobile.png')});
  await page.evaluate(()=>{prologueSceneIndex=getActiveStoryScenes().findIndex(s=>s.kind==='narration');renderPrologueScene();});
  assert.equal(await page.locator('.speaker-block').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS rear-only swap, allied slots, menu log, stage 2/3 speakers and desktop/mobile rendering');
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
