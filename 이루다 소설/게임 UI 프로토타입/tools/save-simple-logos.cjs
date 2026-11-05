const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');
const jobs = require('./simple-logo-assets.json');
(async () => {
  const tiles = [];
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const target = path.join(root, job.target);
    await sharp(job.source).trim().resize(512, 512, {fit: 'contain', background: '#00000000'}).png().toFile(target);
    const stats = await sharp(target).stats();
    const meta = await sharp(target).metadata();
    if (!meta.hasAlpha || stats.channels[3].min !== 0 || stats.channels[3].max !== 255) throw new Error('Invalid alpha: ' + target);
    tiles.push({input: await sharp(target).resize(180, 180).toBuffer(), left: (i % 5) * 200 + 10, top: Math.floor(i / 5) * 200 + 10});
    console.log(job.name + ': 512x512 transparent PNG');
  }
  await sharp({create: {width: 1000, height: 400, channels: 4, background: '#26282b'}}).composite(tiles).png().toFile(path.join(root, 'assets/logos/팀원_로고_v3_모음.png'));
})().catch(error => {console.error(error); process.exitCode = 1;});
