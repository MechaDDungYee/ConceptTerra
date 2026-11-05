const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');
(async () => {
  const records = JSON.parse(fs.readFileSync(path.join(root, 'assets/battle/sd/sd-55/selection-records.json')));
  const overlays = [];
  for (let i = 0; i < records.selection.length; i++) {
    const item = records.selection[i];
    const png = await sharp(path.join(root, 'assets/battle/sd/sd-55', item.file)).resize(362, 483).png().toBuffer();
    overlays.push({input: png, left: (i % 3) * 362, top: Math.floor(i / 3) * 483});
  }
  await sharp({create: {width: 1086, height: 1449, channels: 4, background: '#777777'}}).composite(overlays).png().toFile(path.join(root, 'assets/battle/motions/rig55-sources.png'));
})();
