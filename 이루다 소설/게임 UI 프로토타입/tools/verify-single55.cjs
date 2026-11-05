const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '../assets/battle/motions/single55');
(async () => {
  const records = [];
  for (const file of ['eojil/skill-1-hit-1.png', 'eojil/hurt.png']) {
    const {data, info} = await sharp(path.join(root, file)).ensureAlpha().raw().toBuffer({resolveWithObject: true});
    let clear = 0, visible = 0, minX = info.width, minY = info.height, maxX = -1, maxY = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * 4 + 3];
      if (!alpha) clear++;
      if (alpha >= 128) {visible++; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);}
    }
    assert.equal(info.width, 1086); assert.equal(info.height, 1448);
    assert.ok(clear > info.width * info.height * .1); assert.ok(visible > 100000);
    records.push({file, nativeSize: [info.width, info.height], transparentPixels: clear, visibleBounds: [minX, minY, maxX, maxY], anatomyVerifiedByThisTest: false});
  }
  fs.writeFileSync(path.join(root, 'validation.json'), JSON.stringify({kind: 'native PNG and alpha checks only', records}, null, 2) + '\n');
  console.log('PASS: two native transparent PNGs. Anatomy requires visual review.');
})();
