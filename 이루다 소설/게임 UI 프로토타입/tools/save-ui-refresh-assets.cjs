const fs=require('node:fs');
const path=require('node:path');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..');
const jobs=require('./ui-refresh-assets.json');
(async()=>{
 for(const job of jobs){
  const target=path.join(root,job.target);fs.mkdirSync(path.dirname(target),{recursive:true});
  if(job.kind==='logo')await sharp(job.source).trim().resize(512,512,{fit:'contain',background:'#00000000'}).png().toFile(target);
  else if(job.kind==='background'){
   await sharp(job.source).resize(1920,1080,{fit:'cover'}).png().toFile(target);
   await sharp(target).jpeg({quality:86}).toFile(target.replace(/\.png$/,'.jpg'));
  }else fs.copyFileSync(job.source,target);
  console.log(job.target);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
