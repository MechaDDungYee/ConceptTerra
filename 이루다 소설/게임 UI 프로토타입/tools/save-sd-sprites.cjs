const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');
const jobs = require('./sd-sprite-assets.json');
(async () => {
  const tiles = [];
  const assets = {};
  for (const [i, job] of jobs.entries()) {
    const target = path.join(root, job.target);
    fs.mkdirSync(path.dirname(target), {recursive:true});
    fs.mkdirSync(path.join(path.dirname(target), 'jpg'), {recursive:true});
    const resized = await sharp(job.source).trim().resize(460,700,{fit:'inside'}).png().toBuffer({resolveWithObject:true});
    const left = Math.floor((512-resized.info.width)/2);
    await sharp(resized.data).extend({left,right:512-resized.info.width-left,top:738-resized.info.height,bottom:30,background:'#00000000'}).png().toFile(target);
    const meta = await sharp(target).metadata();
    const stats = await sharp(target).stats();
    if (meta.width!==512 || meta.height!==768 || !meta.hasAlpha || stats.channels[3].min!==0) throw new Error('Invalid sprite: '+target);
    const jpg = path.join(path.dirname(target),'jpg',path.basename(target,'.png')+'.jpg');
    await sharp(target).flatten({background:'#292b31'}).jpeg({quality:85}).toFile(jpg);
    if(fs.statSync(jpg).size>1000000) throw new Error('JPG too large: '+jpg);
    tiles.push({input:await sharp(target).resize(256,384).toBuffer(),left:(i%5)*256,top:Math.floor(i/5)*414});
    const label = Buffer.from(`<svg width="256" height="30"><text x="128" y="21" text-anchor="middle" font-family="Malgun Gothic" font-size="17" fill="#eee">${job.id}</text></svg>`);
    tiles.push({input:label,left:(i%5)*256,top:Math.floor(i/5)*414+384});
    assets[job.id]={src:job.target,scale:job.scale,combat:job.id!=='이루리'};
    console.log(job.id+': transparent 512x768, JPG '+fs.statSync(jpg).size+' bytes');
  }
  await sharp({create:{width:1280,height:828,channels:4,background:'#34363d'}}).composite(tiles).png().toFile(path.join(root,'assets/battle/sd/이루다_1팀_SD_모음.png'));
  fs.writeFileSync(path.join(root,'battle-sprites.js'),'window.battleSpriteAssets = '+JSON.stringify(assets,null,2)+';\n');
})().catch(error=>{console.error(error);process.exitCode=1;});
