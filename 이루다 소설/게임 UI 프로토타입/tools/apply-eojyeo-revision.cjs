const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir=path.resolve(__dirname,'../assets/battle/motions/single55');
(async()=>{
  const changes=JSON.parse(fs.readFileSync(path.join(dir,'eojyeo-revision-20261009.json')));
  const promptFile=path.join(dir,'additional-prompts.json');
  const prompts=JSON.parse(fs.readFileSync(promptFile));
  Object.assign(prompts,changes.prompts);
  for(const [key,revision] of Object.entries(changes.frames)){
    const target=path.join(dir,'eojyeo',key+'.png');
    const backup=path.join(dir,'eojyeo',key+'-before-head-revision.png');
    assert.ok(!fs.existsSync(backup),'Already applied');
    const {data,info}=await sharp(revision.source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(info.width,1086);assert.equal(info.height,1448);
    let minX=info.width,minY=info.height,maxX=-1,maxY=-1,clear=0;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
      const a=data[(y*info.width+x)*4+3];if(!a)clear++;
      if(a>=128){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    }
    assert.ok(clear>info.width*info.height*.1);
    fs.copyFileSync(target,backup);fs.copyFileSync(revision.source,target);
    const file=path.join(dir,'eojyeo',key+'.json'),record=JSON.parse(fs.readFileSync(file));
    Object.assign(record,{source:revision.source,prompt:revision.prompt,revision:'20261009-eojyeo-v2',
      visibleBounds:[minX,minY,maxX,maxY],footPivotApprox:[record.footPivotApprox[0],maxY]});
    fs.writeFileSync(file,JSON.stringify(record,null,2));
    prompts['eojyeo/'+key]=revision.prompt;
  }
  fs.writeFileSync(promptFile,JSON.stringify(prompts,null,2));
  console.log('Applied eojyeo head/leg/badge revisions and saved all prompts.');
})().catch(error=>{console.error(error);process.exitCode=1;});
