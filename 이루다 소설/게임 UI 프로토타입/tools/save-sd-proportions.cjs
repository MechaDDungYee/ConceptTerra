const fs=require('node:fs');
const path=require('node:path');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..');
const jobs=require('./sd-proportion-assets.json');
(async()=>{
 const tiles=[],assets={},report=[];
 for(const [i,job] of jobs.entries()){
  const target=path.join(root,job.target);
  const trimmed=await sharp(job.source).trim().png().toBuffer();
  const resized=await sharp(trimmed).resize({height:900}).png().toBuffer({resolveWithObject:true});
  if(resized.info.width>748)throw new Error('Sprite exceeds horizontal safe area: '+job.id+' '+resized.info.width);
  const left=Math.floor((768-resized.info.width)/2);
  await sharp(resized.data).extend({left,right:768-resized.info.width-left,top:64,bottom:60,background:'#00000000'}).png().toFile(target);
  const jpg=path.join(path.dirname(target),'jpg',path.basename(target,'.png')+'.jpg');
  await sharp(target).flatten({background:'#34363d'}).jpeg({quality:85}).toFile(jpg);
  const {data,info}=await sharp(target).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let minY=info.height,maxY=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  if(Math.abs(minY-64)>4||Math.abs(maxY-963)>4)throw new Error('Baseline mismatch: '+job.id);
  if(fs.statSync(jpg).size>1000000)throw new Error('JPG exceeds 1MB');
  report.push({name:job.id,visibleTop:minY,visibleBottom:maxY,canvas:[768,1024],height:900});
  tiles.push({input:await sharp(target).resize(230,307).toBuffer(),left:(i%5)*240+5,top:Math.floor(i/5)*345});
  tiles.push({input:Buffer.from(`<svg width="240" height="30"><text x="120" y="22" font-family="Malgun Gothic" font-size="16" text-anchor="middle" fill="#fff">${job.id}${i===9?' · 기준':''}</text></svg>`),left:(i%5)*240,top:Math.floor(i/5)*345+307});
  assets[job.id]={src:job.target,scale:1,combat:job.id!=='이루리',canvas:[768,1024],footPivot:[384,964]};
  console.log(job.id+': body 900px, baseline '+maxY+', scale 1');
 }
 await sharp({create:{width:1200,height:690,channels:4,background:'#34363d'}}).composite(tiles).png().toFile(path.join(root,'assets/battle/sd/이루다_1팀_SD_비율수정_모음.png'));
 fs.writeFileSync(path.join(root,'battle-sprites.js'),'window.battleSpriteAssets = '+JSON.stringify(assets,null,2)+';\n');
 fs.writeFileSync(path.join(root,'assets/battle/sd/SD_비율_검증.json'),JSON.stringify(report,null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1;});
