const path=require('node:path');
const {pathToFileURL}=require('node:url');
const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.evaluate(()=>{document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));showFederationMap();});
  assert.equal(await page.locator('#map-board .route-lines path').count(),3);
  await page.screenshot({path:path.join(root,'tests/routes-federation.png')});
  await page.evaluate(()=>showChapterMap('ch1'));
  assert.equal(await page.locator('.chapter-stage-map .route-lines path').count(),1);
  await page.screenshot({path:path.join(root,'tests/routes-chapter1.png')});
  const show=async(p,stage='ch1-2')=>{
   await page.evaluate(({p,stage})=>{activeStageId=stage;enterStage();prologueSceneIndex=getActiveStoryScenes().findIndex(s=>s.sourceParagraph===p&&s.kind==='dialogue');renderPrologueScene();completeTyping(getActiveStoryScenes()[prologueSceneIndex].line);},{p,stage});
   await page.waitForFunction(()=>[...document.querySelectorAll('.vn-character')].every(i=>i.complete&&i.naturalWidth>0));
  };
  await show(89);
  assert.equal(await page.locator('.vn-character.is-speaking').getAttribute('alt'),'제이크 설리번');
  await page.screenshot({path:path.join(root,'tests/chapter1-jake.png')});
  await show(171);
  assert.equal(await page.locator('.vn-character.is-speaking').getAttribute('alt'),'셀타 마르틴');
  await page.screenshot({path:path.join(root,'tests/chapter1-selta.png')});
  await page.setViewportSize({width:844,height:390});
  await show(117);
  await page.screenshot({path:path.join(root,'tests/chapter1-small-mobile.png')});
  await page.evaluate(()=>{activeStageId='ch1-1';enterStage();prologueSceneIndex=getActiveStoryScenes().length-1;renderPrologueScene();advanceToNextStage();});
  assert.equal(await page.evaluate(()=>activeStageId),'ch1-2');
  assert.deepEqual(errors,[]);
  console.log('PASS map routes, chapter 1 speakers, mobile rendering and next-stage transition');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
