const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');
(async () => {
 const window = {};
 vm.runInNewContext(fs.readFileSync(path.join(root,'battle-sprites.js'),'utf8'),{window});
 const roster = Object.entries(window.battleSpriteAssets).filter(([,s])=>s.combat);
 assert.equal(roster.length,9);
 for(const [name,s] of roster){
  assert.ok(s.src.includes('/sd-55/'));
  const m=await sharp(path.join(root,s.src)).metadata();
  assert.deepEqual([m.width,m.height],Array.from(s.canvas));assert.ok(m.hasAlpha);
  const r=window.battleSpriteRegistration(name);
  assert.ok(Math.abs(r.renderScale*s.bodyHeight/m.height-1)<1e-12);
  assert.ok(Math.abs(r.bottomOffset-(m.height-s.footPivot[1])/s.bodyHeight)<1e-12);
  assert.equal(r.motionRenderScale,1024/900);
 }
 assert.equal(window.battleSpriteAssets['이루리'].combat,false);
 assert.ok(window.battleSpriteAssets['이루리'].src.endsWith('_SD_v2.png'));
 console.log('PASS nine new PNGs, native dimensions, idle height/foot registration, preserved observer and legacy motion scale.');
})().catch(e=>{console.error(e);process.exitCode=1;});
