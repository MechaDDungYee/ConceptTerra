const path=require('node:path');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try {
  for(const width of [1440,844]){
   const page=await browser.newPage({viewport:{width,height:width===1440?900:390}});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
   assert.ok(await page.evaluate(()=>{
    for(const anchor of [0,1]){
     for(const points of [[{x:0,y:0},{x:10,y:0}],[{x:0,y:0},{x:0,y:120}],[{x:0,y:0},{x:900,y:0}]]){
      const before=JSON.stringify(points),result=battlePlaybackPairLayout(points,anchor,100);
      if(JSON.stringify(points)!==before||JSON.stringify(result.positions[anchor])!==JSON.stringify(points[anchor]))return false;
      if(result.positions[0].x>=result.positions[1].x||result.positions[0].y!==result.positions[1].y)return false;
     }
    }
    const reversed=battlePlaybackPairLayout([{x:900,y:0},{x:0,y:0}],0,100);
    return reversed.positions[1].x<reversed.positions[0].x
     &&battlePlaybackPairLayout([{x:150,y:0},{x:0,y:0}],0,100).mode==='unchanged'
     &&battlePlaybackPairLayout([{x:0,y:0},{x:150,y:0}],0,100).mode==='unchanged';
   }));
   await page.evaluate(()=>{
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id==='story-view'));
    const roster=createBattleRoster(); startBattleLineup(roster.map(u=>u.id));
    const a=battleDummy.allies[0],b=battleDummy.enemies[0];
    battleDummy.enemies.slice(1).forEach(unit=>unit.hp=0);battleDummy.bench=[];
    a.x=3;a.y=2;b.x=4;b.y=2;b.hp=b.maxHp=200;
    b.image='assets/story/standing/imagined_mercenary.png';
    const action={name:'충돌 연출 시험',type:'타격',scope:'단일',range:1,power:10,wave:1,hits:2,effect:''};
    a.queuedActions=[{action,targetId:b.id,decisionOrder:99}];
    b.preparedAction={...action,power:5};b.targetId=a.id;
    rollWaveValue=()=>3;window.battlePlaybackTimingScale=.35;
    window.seenPlaybackSteps=[];
    window.gaugeSpinCount=0;
    new MutationObserver(records=>records.forEach(record=>{
     if(record.attributeName==='data-step')window.seenPlaybackSteps.push(record.target.dataset.step);
     if(record.attributeName==='data-spin-mode'&&record.target.dataset.spinMode==='rotate')window.gaugeSpinCount++;
    })).observe(document.querySelector('#node-stage'),{subtree:true,attributes:true,attributeFilter:['data-step','data-spin-mode']});
    renderBattleDummy();
   });
   await page.locator('#battle-resolve').click();
   await page.waitForFunction(()=>document.querySelector('.battle-playback')?.dataset.step==='clash-roll');
   assert.equal(await page.locator('.playback-actor.active').count(),2);
   assert.ok(await page.locator('.playback-actor:not(.active):not([hidden])').count()>0);
   assert.ok(await page.locator('.playback-actor:not(.active):not([hidden])').first().evaluate(el=>getComputedStyle(el).filter==='brightness(0.23)'&&getComputedStyle(el).opacity==='1'));
   assert.equal(await page.locator('.battle-playback').getAttribute('data-camera'),'side');
   assert.equal(await page.locator('.battle-playback').getAttribute('data-phase'),'judgment');
   const hudTops=await page.locator('.playback-actor.active .playback-action').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().top));
   assert.ok(hudTops.every(top=>top>=25),JSON.stringify({width,hudTops}));
   assert.ok(await page.locator('.playback-actor:not(.active):not([hidden]) .playback-vitals').first().evaluate(el=>getComputedStyle(el).display==='none'));
   assert.ok(await page.locator('.playback-field .battle-board-3d').count());
   assert.ok(await page.locator('.playback-actor.active').evaluateAll(els=>{
    const anchor=els.find(el=>el.dataset.positionRole==='anchor');
    return Math.abs(parseFloat(anchor.style.left)-Number(anchor.dataset.originX))<.01
     &&Math.abs(parseFloat(anchor.style.top)-Number(anchor.dataset.originY))<.01
     &&Math.abs(parseFloat(els[0].style.top)-parseFloat(els[1].style.top))<.01;
   }));
   assert.equal(await page.locator('.playback-hit').count(),4);
   assert.ok(await page.locator('.playback-wave canvas').first().evaluate(canvas=>{
    const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let painted=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])painted++;
    return painted>5000;
   }));
   assert.ok(await page.locator('#battle-resolve').evaluate(el=>el.inert||!!el.closest('[inert]')));
   await page.screenshot({path:path.join(__dirname,`clash-playback-${width}.png`)});
   await page.waitForFunction(()=>!!document.querySelector('.playback-hit.destroyed'));
   await page.waitForFunction(()=>!!document.querySelector('canvas[data-spin-mode="snap"]'));
   await page.waitForFunction(()=>!!document.querySelector('.playback-damage'));
   assert.ok(await page.locator('.playback-damage').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=36));
   assert.ok(await page.locator('.playback-damage').first().evaluate(el=>el.parentElement.classList.contains('playback-damage-layer')&&getComputedStyle(el.parentElement).zIndex==='100'&&!el.closest('.playback-actor')));
   await page.screenshot({path:path.join(__dirname,`clash-damage-${width}.png`)});
   await page.waitForFunction(()=>!battlePresentationActive,{},{timeout:30000});
   assert.equal(await page.locator('.battle-playback').count(),0);
   assert.ok(await page.evaluate(()=>getLastBattleExecution().status==='completed'&&battleDummy.turn===2));
   assert.ok(await page.evaluate(()=>seenPlaybackSteps.includes('clash-roll')&&seenPlaybackSteps.includes('hit-destroyed')&&seenPlaybackSteps.includes('attack-roll')));
   assert.equal(await page.evaluate(()=>battleDummy.enemies[0].hp),171);
   assert.equal(await page.evaluate(()=>gaugeSpinCount),2);
   for(const validAttack of [false,true]){
    await page.evaluate(valid=>{
     const a=battleDummy.allies[0],b=battleDummy.enemies[0];
     a.x=1;a.y=2;b.x=valid?3:8;b.y=2;
     a.hp=a.maxHp;b.hp=b.maxHp=200;
     const action={name:'사거리 검증',type:'타격',scope:'단일',range:valid?3:1,power:10,wave:1,hits:2,effect:''};
     a.queuedActions=[{action,targetId:b.id,decisionOrder:99}];
     b.preparedAction={...action,range:1,power:5};b.targetId=a.id;
     window.gaugeSpinCount=0;renderBattleDummy();
     window.originalField=document.querySelector('#battle-field');
    },validAttack);
    await page.locator('#battle-resolve').click();
    assert.ok(await page.evaluate(()=>document.querySelector('.playback-field')===window.originalField));
    if(!validAttack){
     assert.equal(await page.locator('.playback-actor.active').count(),0);
     assert.equal(await page.locator('.playback-wave canvas').count(),0);
    }
    await page.waitForFunction(()=>!battlePresentationActive,{},{timeout:30000});
    const types=await page.evaluate(()=>getLastBattleExecution().steps.map(s=>s.type));
    assert.ok(!types.includes('clash-start'));
    assert.equal(types.includes('attack-start'),validAttack);
    assert.equal(await page.evaluate(()=>battleDummy.enemies[0].hp),validAttack?171:200);
   }
   for(const position of [{ax:3,ay:1,bx:3,by:4},{ax:1,ay:2,bx:8,by:2}]){
    await page.evaluate(pos=>{
     const a=battleDummy.allies[0],b=battleDummy.enemies[0];
     a.x=pos.ax;a.y=pos.ay;b.x=pos.bx;b.y=pos.by;
     a.hp=a.maxHp;b.hp=b.maxHp=200;
     const action={name:'배치 보정 검증',type:'타격',scope:'단일',range:'전장',power:10,wave:1,hits:2,effect:''};
     a.queuedActions=[{action,targetId:b.id,decisionOrder:99}];
     b.preparedAction={...action,power:5};b.targetId=a.id;renderBattleDummy();
    },position);
    await page.locator('#battle-resolve').click();
    await page.waitForFunction(()=>document.querySelector('.battle-playback')?.dataset.step==='clash-roll');
    assert.ok(await page.locator('.playback-actor.active').evaluateAll(els=>{
     const a=els.find(el=>el.classList.contains('left')),b=els.find(el=>el.classList.contains('right')),anchor=els.find(el=>el.dataset.positionRole==='anchor');
     return parseFloat(a.style.left)<parseFloat(b.style.left)&&Math.abs(parseFloat(a.style.top)-parseFloat(b.style.top))<.01
      &&Math.abs(parseFloat(anchor.style.left)-Number(anchor.dataset.originX))<.01;
    }));
    assert.ok(await page.locator('.playback-actor.active .playback-action').evaluateAll(els=>els.every(el=>el.getBoundingClientRect().top>=25)));
    await page.waitForFunction(()=>!battlePresentationActive,{},{timeout:30000});
    assert.ok(await page.evaluate(pos=>getLastBattleExecution().steps.filter(s=>s.type==='damage-applied').every(s=>{
     const a=s.units.find(u=>u.side==='ally'),b=s.units.find(u=>u.id==='e1');
     return a.x===pos.ax&&a.y===pos.ay&&b.x===pos.bx&&b.y===pos.by;
    }),position));
   }
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('PASS in-place clash, original battlefield reuse, out-of-range skips, unilateral attacks, gauge rolls, timed damage and desktop/mobile.');
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
