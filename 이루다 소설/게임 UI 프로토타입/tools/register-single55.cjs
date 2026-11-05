const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'assets/battle/motions/single55');
const [source, id, key] = process.argv.slice(2);
(async () => {
  const planFile = path.join(dir, 'single-image-plan.json');
  const plan = JSON.parse(fs.readFileSync(planFile));
  const job = plan.jobs.find(j=>j.id===id), frame = job?.frames.find(f=>f.key===key);
  assert.ok(frame, 'Known frame required');
  const target = path.join(dir, id, key+'.png');
  assert.ok(!fs.existsSync(target), 'Never replace a selected image without review');
  const {data, info} = await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  let clear=0,minX=info.width,minY=info.height,maxX=-1,maxY=-1;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
    const a=data[(y*info.width+x)*4+3];if(!a)clear++;
    if(a>=128){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  }
  assert.ok(clear>info.width*info.height*.1, 'Real transparent background required');
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);
  const lowY=Math.max(0,maxY-45),columns=[];
  for(let x=0;x<info.width;x++){let count=0;for(let y=lowY;y<=maxY;y++)if(data[(y*info.width+x)*4+3]>=128)count++;if(count>=3)columns.push(x);}
  const pivotX=columns.length?Math.round((columns[0]+columns.at(-1))/2):Math.round(info.width/2);
  const record={...frame,src:`${id}/${key}.png`,nativeSize:[info.width,info.height],visibleBounds:[minX,minY,maxX,maxY],footPivotApprox:[pivotX,maxY],source,review:'needs anatomy and equipment review',alphaChecked:true};
  Object.assign(frame,{status:'saved',source});fs.writeFileSync(planFile,JSON.stringify(plan,null,2));
  fs.writeFileSync(path.join(dir,id,key+'.json'),JSON.stringify(record,null,2));
  console.log(JSON.stringify({id,key,nativeSize:record.nativeSize,bounds:record.visibleBounds,saved:target}));
})().catch(error=>{console.error(error);process.exitCode=1;});
