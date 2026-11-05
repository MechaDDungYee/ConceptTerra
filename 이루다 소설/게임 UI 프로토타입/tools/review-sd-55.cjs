const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir = path.resolve(__dirname, '../assets/battle/sd/sd-55');
(async () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(dir, 'selection-records.json'), 'utf8'));
  const items = [];
  for (const entry of catalog.selection) {
    const file = path.join(dir, entry.file);
    const meta = await sharp(file).metadata();
    const stats = await sharp(file).stats();
    if (!meta.hasAlpha || stats.channels[3].min !== 0 || stats.channels[3].max === 0) throw Error(entry.name + ': invalid alpha');
    items.push({...entry, width: meta.width, height: meta.height, hasAlpha: meta.hasAlpha});
  }
  fs.writeFileSync(path.join(dir, 'review-data.js'), 'window.sd55Review = ' + JSON.stringify(items, null, 2) + ';\n');
  fs.writeFileSync(path.join(dir, 'validation.json'), JSON.stringify({target:5.5, measurement:'manual visible hair-cap crown, chin, sole estimates; not an anatomical guarantee', images:items}, null, 2));
  console.log(JSON.stringify(items, null, 2));
})().catch(error => {console.error(error); process.exitCode = 1;});
