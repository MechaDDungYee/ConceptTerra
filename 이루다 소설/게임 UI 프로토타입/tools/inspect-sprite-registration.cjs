const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..'), folder = path.join(root, 'assets/battle/motions');
const manifest = require(path.join(folder, 'motion-manifest-v2.json'));
const context = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(root, 'battle-sprites.js'), 'utf8'), context);
async function bounds(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let top = info.height, bottom = 0;
  for (let y = 0; y < info.height; y++) for (let x = Math.floor(info.width * .35); x < info.width * .65; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 24) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
  }
  return { top, bottom, width: info.width, height: info.height };
}
(async () => {
  const tiles = [], results = [];
  for (const [row, character] of manifest.characters.entries()) {
    const idle = path.join(root, context.window.battleSpriteAssets[character.name].src);
    const frames = [idle, path.join(folder, character.frames.find(f => f.key === 'clash-win').src), path.join(folder, character.frames.find(f => f.key === 'skill-1-hit-1').src)];
    results.push({ name: character.name, bounds: await Promise.all(frames.map(bounds)) });
    for (let column = 0; column < frames.length; column++) {
      tiles.push({ input: await sharp(frames[column]).resize(160, 210, { fit: 'contain', background: '#192027' }).png().toBuffer(), left: column * 160, top: row * 210 });
    }
  }
  await sharp({ create: { width: 480, height: manifest.characters.length * 210, channels: 4, background: '#192027' } }).composite(tiles).png().toFile(path.join(root, 'tests/sprite-registration-before.png'));
  console.log(JSON.stringify(results));
})().catch(error=>{console.error(error);process.exitCode=1;});
