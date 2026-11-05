const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/battle/motions');
const plan=require(path.join(out,'motion-plan.json'));
const seeds=require('./motion-generated-v2.json');
const recordDir=path.join(out,'v2-records');
const allRecords=[...seeds,...(fs.existsSync(recordDir)?fs.readdirSync(recordDir).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(recordDir,f),'utf8'))):[])];
const records=allRecords.filter(r=>r.replacement||!allRecords.some(p=>p.replacement&&p.id===r.id&&p.batch===r.batch));
const clear={r:0,g:0,b:0,alpha:0};
function components(data,w,h){
 const visited=new Uint8Array(w*h),queue=new Int32Array(w*h),parts=[];
 for(let p=0;p<w*h;p++){
  if(visited[p]||data[p*4+3]<25)continue;
  let head=0,tail=1,left=w,right=-1,top=h,bottom=-1;queue[0]=p;visited[p]=1;
  while(head<tail){const v=queue[head++],x=v%w,y=Math.floor(v/w);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   for(const n of [x?v-1:-1,x<w-1?v+1:-1,y?v-w:-1,y<h-1?v+w:-1])if(n>=0&&!visited[n]&&data[n*4+3]>=25){visited[n]=1;queue[tail++]=n;}
  }
  if(tail>80)parts.push({left,right,top,bottom,area:tail,pixels:queue.slice(0,tail)});
 }
 return parts;
}
(async()=>{
 fs.mkdirSync(path.join(out,'sheets/v2'),{recursive:true});
 const manifest={kind:'key-poses',revision:2,canvas:[1536,2048],footPivot:[768,1740],review:'visual-review-required',characters:[]};
 const only=process.argv[2];
 for(const job of plan.jobs.filter(job=>!only||job.id===only)){
  const batches=records.filter(r=>r.id===job.id).sort((a,b)=>a.batch-b.batch),frames=[];
  for(const batch of batches){
   const filename=job.id+'-'+batch.batch+(batch.variant?'-'+batch.variant:'')+'.png',dest=path.join(out,'sheets/v2',filename);if(!fs.existsSync(dest))fs.copyFileSync(batch.source,dest);
   const meta=await sharp(dest).metadata(),{data,info}=await sharp(dest).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   if(!meta.hasAlpha)throw Error('No alpha: '+filename);
   const [cols,rows]=batch.grid||[2,2];
   const parts=components(data,info.width,info.height).sort((a,b)=>b.area-a.area),major=parts.filter(p=>p.area>parts[0].area*.12).slice(0,cols*rows),cells=[];
   for(const [i,frame]of batch.frames.entries()){
    const cellIndex=batch.cellIndexes?.[i]??i;
    const col=cellIndex%cols,row=Math.floor(cellIndex/cols);
    const candidates=major.filter(p=>Math.floor(((p.left+p.right)/2)/(info.width/cols))===col&&Math.floor(((p.top+p.bottom)/2)/(info.height/rows))===row);
    if(candidates.length!==1)throw Error('Ambiguous pose cell: '+job.id+' '+batch.batch+' '+i);
    const body=candidates[0],owned=[body,...parts.filter(p=>!major.includes(p)).filter(p=>{
      const x=(p.left+p.right)/2,y=(p.top+p.bottom)/2;
      const nearest=major.reduce((a,b)=>Math.hypot(x-(a.left+a.right)/2,y-(a.top+a.bottom)/2)<Math.hypot(x-(b.left+b.right)/2,y-(b.top+b.bottom)/2)?a:b);
      return nearest===body;
    })];
    const left=Math.min(...owned.map(p=>p.left)),top=Math.min(...owned.map(p=>p.top)),right=Math.max(...owned.map(p=>p.right)),bottom=Math.max(...owned.map(p=>p.bottom));
    const width=right-left+1,height=bottom-top+1,isolated=Buffer.alloc(width*height*4);
    for(const part of owned)for(const p of part.pixels){const x=p%info.width-left,y=Math.floor(p/info.width)-top;if(x>=0&&y>=0&&x<width&&y<height)data.copy(isolated,(y*width+x)*4,p*4,p*4+4);}
    const png=await sharp(isolated,{raw:{width,height,channels:4}}).png().toBuffer();
    cells.push({frame,png,width,height,originalCell:[info.width/cols,info.height/rows],border:left<2||top<2||right>info.width-3||bottom>info.height-3,source:'sheets/v2/'+filename});
   }
   frames.push(...cells);
  }
  if(frames.length!==job.frames.length)throw Error('Missing poses: '+job.id+' '+frames.length+'/'+job.frames.length);
  frames.sort((a,b)=>job.frames.findIndex(f=>f.key===a.frame.key)-job.frames.findIndex(f=>f.key===b.frame.key));
  const folder=path.join(out,job.id),native=path.join(folder,'native-v2');fs.mkdirSync(native,{recursive:true});
  // A single-pose source has a larger cell than a 2x2 sheet; keep their logical pixel scales equal.
  for(const f of frames)f.cellScale=Math.min(540/f.originalCell[0],720/f.originalCell[1]);
  const scale=Math.min(...frames.map(f=>Math.min(1074/(f.width*f.cellScale),1432/(f.height*f.cellScale))));
  const entry={id:job.id,name:job.name,reference:path.relative(out,job.reference).replaceAll('\\','/'),scale,frames:[]};
  for(const f of frames){
   const key=f.frame.key;fs.writeFileSync(path.join(native,key+'.png'),f.png);
   const w=Math.round(f.width*scale*f.cellScale),h=Math.round(f.height*scale*f.cellScale),top=1740-h;
   await sharp({create:{width:1536,height:2048,channels:4,background:clear}}).composite([{input:await sharp(f.png).resize(w,h).toBuffer(),left:Math.floor((1536-w)/2),top}]).png().toFile(path.join(folder,key+'-v2.png'));
   entry.frames.push({...f.frame,src:job.id+'/'+key+'-v2.png',nativeSrc:job.id+'/native-v2/'+key+'.png',nativeSize:[f.width,f.height],sourceCellSize:f.originalCell,cellScale:f.cellScale,sheet:f.source,review:f.border?'check-source-edge':'pending-anatomy-review',pivotMethod:'silhouette bottom; sole review required'});
  }
  manifest.characters.push(entry);
 }
 fs.writeFileSync(path.join(out,only?'inspection-'+only+'.json':'motion-manifest-v2.json'),JSON.stringify(manifest,null,2)+'\n');
 if(!only)fs.writeFileSync(path.join(out,'motion-assets-v2.js'),'window.irudaMotionAssets='+JSON.stringify(manifest,null,2)+';\n');
 fs.writeFileSync(path.join(out,'제작_프롬프트_v2.md'),records.map(r=>'## '+r.name+' / '+r.batch+'\n\n'+r.prompt+'\n').join('\n'));
 console.log(JSON.stringify({characters:manifest.characters.length,frames:manifest.characters.flatMap(c=>c.frames).length,sourceEdgeChecks:manifest.characters.flatMap(c=>c.frames).filter(f=>f.review==='check-source-edge').length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
