const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir = path.resolve(__dirname,'../assets/battle/motions/single55');
(async()=>{
  const revisions=JSON.parse(fs.readFileSync(path.join(dir,'head-revision-20261009.json')));
  const promptsFile=path.join(dir,'additional-prompts.json');
  const prompts=JSON.parse(fs.readFileSync(promptsFile));
  for(const [key,revision] of Object.entries(revisions)){
    const target=path.join(dir,'eojil',key+'.png');
    const backup=path.join(dir,'eojil',key+'-before-head-revision.png');
    assert.ok(!fs.existsSync(backup),'Revision already applied');
    const {data,info}=await sharp(revision.source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(info.width,1086);assert.equal(info.height,1448);
    let minX=info.width,minY=info.height,maxX=-1,maxY=-1,clear=0;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
      const alpha=data[(y*info.width+x)*4+3];
      if(!alpha)clear++;
      if(alpha>=128){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    }
    assert.ok(clear>info.width*info.height*.1);
    fs.copyFileSync(target,backup);fs.copyFileSync(revision.source,target);
    const recordFile=path.join(dir,'eojil',key+'.json');
    const record=JSON.parse(fs.readFileSync(recordFile));
    // Keep the existing horizontal foot anchor; only the visible sole height is refreshed.
    Object.assign(record,{source:revision.source,prompt:revision.prompt,revision:'20261009-head-small',
      visibleBounds:[minX,minY,maxX,maxY],footPivotApprox:[record.footPivotApprox[0],maxY]});
    fs.writeFileSync(recordFile,JSON.stringify(record,null,2));
    prompts['eojil/'+key]=revision.prompt;
    console.log(key+': '+info.width+'x'+info.height+', alpha verified');
  }
  fs.writeFileSync(promptsFile,JSON.stringify(prompts,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
