const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    for (const width of [1440, 844]) {
      const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 900 : 390 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
      await page.evaluate(() => {
        document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'story-view'));
        startBattleLineup(createBattleRoster().map(u => u.id));
        const a = battleDummy.allies[0], e = battleDummy.enemies[0];
        a.x = 3; a.y = 2; e.x = 4; e.y = 2;
        battleDummy.selected = a.id;
        battleDummy.previewAction = a.skills[0]; renderBattleDummy();
      });
      assert.equal(await page.locator('.battle-card-detail .hit-badge').count(), 0);
      assert.equal(await page.locator('.battle-card-fan .skill-effects, .battle-card-fan .sequence-description').count(), 0);
      assert.equal(await page.locator('.battle-card-detail .sequence-step').count(), 2);
      assert.ok(await page.locator('.battle-card-fan .compact-card-power').count() >= 5);
      const registration = await page.evaluate(async () => {
        const images = [...document.querySelectorAll('.sd-token > img')];
        await Promise.all(images.map(img=>img.decode()));
        const errors = images.map(img=>{
          const token = img.closest('.battle-token');
          const unit = [...battleDummy.allies,...battleDummy.enemies].find(unit=>unit.id === token.dataset.battleUnit);
          const sprite = battleSpriteAssets[unit.name];
          const cell = document.querySelector(`[data-cell-x="${unit.x}"][data-cell-y="${unit.y}"]`).getBoundingClientRect();
          const box = img.getBoundingClientRect();
          return Math.abs(box.top + box.height * sprite.footPivot[1] / sprite.canvas[1] - cell.top - cell.height / 2);
        });
        return errors;
      });
      assert.ok(registration.every(error=>error<2), `idle foot alignment ${registration}`);
      assert.ok((await page.locator('.sequence-description').first().textContent()).includes('50%'));
      await page.screenshot({ path: path.resolve(__dirname, `sequence-actions-${width}.png`) });
      for (const parry of [false, true]) {
        await page.evaluate(async parry => {
          const a = battleDummy.allies[0], e = battleDummy.enemies[0];
          a.hp = a.maxHp; e.hp = e.maxHp; a.buffs = []; a.debuffs = []; e.buffs = []; e.debuffs = [];
          a.x = 3; a.y = 2; e.x = 4; e.y = 2;
          const ap = { id: `${a.id}:0`, unit: a, action: a.skills[0], target: e, handIndex: 0 };
          const ep = { id: `${e.id}:0`, unit: e, action: { ...getEnemyAction(e), power: 5 }, target: a };
          getBattleSchedule = () => ({ events: [{ plans: parry ? [ap, ep] : [ap] }], plans: parry ? [ap, ep] : [ap], ranks: new Map() });
          rollWaveValue = () => 0; window.battlePlaybackTimingScale = .03;
          renderBattleDummy();
          window.registrationSamples=[];
          window.presentationChecks={broken:false,keyword:false,icons:[],maxScale:0};
          const observer=new MutationObserver(records=>records.forEach(record=>{
            presentationChecks.broken ||= !!document.querySelector('.playback-action-break');
            presentationChecks.keyword ||= !!document.querySelector('.playback-keyword');
            document.querySelectorAll('.playback-keyword img').forEach(img=>{if(!presentationChecks.icons.includes(img.src))presentationChecks.icons.push(img.src);});
            const world=document.querySelector('.playback-world');
            if(world)presentationChecks.maxScale=Math.max(presentationChecks.maxScale,new DOMMatrix(getComputedStyle(world).transform).a);
            if(record.attributeName!=='data-motion')return;
            const actor=record.target,img=actor.querySelector('.playback-sprite');
            if(!img?.classList.contains('registered-sprite'))return;
            const unitName=actor.querySelector('img').alt;
            const pivot=img.classList.contains('motion-sprite') ? battleMotionLibrary[unitName].pivot[1]/battleMotionLibrary[unitName].canvas[1] : battleSpriteAssets[unitName].footPivot[1]/battleSpriteAssets[unitName].canvas[1];
            const box=img.getBoundingClientRect(),body=actor.getBoundingClientRect();
            registrationSamples.push(Math.abs(box.top+box.height*pivot-body.bottom));
          }));
          observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-motion','class','style']});
          try{await resolveBattleTurn();}finally{observer.disconnect();}
        }, parry);
        const result = await page.evaluate(() => getLastBattleExecution());
        assert.equal(result.status, 'completed');
        assert.equal(result.steps.filter(s => s.type === (parry ? 'clash-roll' : 'attack-roll')).length, 1);
        if (parry) {
          assert.ok(result.steps.some(s => s.type === 'damage-applied'));
          assert.ok(result.steps.some(s => s.type === 'clash-followup'));
          assert.ok(!result.steps.some(s => s.type === 'hit-destroyed'));
        }
        assert.equal(await page.locator('.battle-playback').count(), 0);
        const presentation=await page.evaluate(()=>presentationChecks);
        assert.ok(presentation.keyword);
        if(parry)assert.ok(presentation.broken);
        assert.ok(presentation.maxScale <= (width===1440?1.35:1.15)+.001);
        for(const src of presentation.icons)assert.equal(await page.evaluate(async src=>{const img=new Image();img.src=src;try{await img.decode();return true;}catch{return false;}},src),true);
        const samples=await page.evaluate(()=>registrationSamples);
        assert.ok(samples.length>0);
        assert.ok(samples.every(error=>error<2), `motion foot alignment ${samples}`);
      }
      assert.deepEqual(errors, []);
      console.log(`PASS sequence and parry UI ${width}`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
