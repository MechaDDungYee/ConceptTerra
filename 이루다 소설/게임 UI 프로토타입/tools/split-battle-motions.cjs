const fs=require('node:fs');
const path=require('node:path');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/battle/motions');
const plan=JSON.parse(fs.readFileSync(path.join(out,'motion-plan.json'),'utf8'));
const sources=require('./motion-generated-sources.json');
const transparent={r:0,g:0,b:0,alpha:0};
function bounds(data,w,h){
 let left=w,right=-1,top=h,bottom=-1,empty=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  if(data[(y*w+x)*4+3]>24){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}else empty++;
 }
 return {left,right,top,bottom,emptyFraction:empty/(w*h)};
}
(async()=>{
 fs.mkdirSync(path.join(out,'sheets'),{recursive:true});
 const manifest={kind:'key-poses',canvas:[768,1024],footPivot:[384,964],review:'draft-needs-visual-approval',characters:[]},montage=[];
 for(const [index,job] of plan.jobs.entries()){
  const source=sources.find(s=>s.id===job.id);if(!source)continue;
  const sheet=path.join(out,'sheets',job.id+'-v1.png');
  if(!fs.existsSync(sheet))fs.copyFileSync(source.source,sheet);
  const meta=await sharp(sheet).metadata();if(!meta.hasAlpha)throw Error('Missing alpha: '+job.id);
  const [cols,rows]=job.grid,cells=[];
  const sheetRaw=await sharp(sheet).ensureAlpha().raw().toBuffer(),bands=[];
  let start=-1,gap=0;
  for(let y=0;y<meta.height;y++){
   let occupied=0;for(let x=0;x<meta.width;x++)if(sheetRaw[(y*meta.width+x)*4+3]>24)occupied++;
   if(occupied>3){if(start<0)start=y;gap=0;}else if(start>=0&&++gap>=6){bands.push({start,end:y-gap});start=-1;gap=0;}
  }
  if(start>=0)bands.push({start,end:meta.height-1});
  const expectedRows=Math.ceil(job.frames.length/cols),useBands=bands.length===expectedRows;
  const rowEdges=useBands?[0,...bands.slice(1).map((b,i)=>Math.floor((bands[i].end+b.start)/2)),meta.height]:Array.from({length:rows+1},(_,i)=>Math.round(i*meta.height/rows));
  for(let i=0;i<job.frames.length;i++){
   const row=Math.floor(i/cols),left=Math.round(i%cols*meta.width/cols),top=rowEdges[row];
   const width=Math.round((i%cols+1)*meta.width/cols)-left,height=rowEdges[row+1]-top;
   const image=await sharp(sheet).extract({left,top,width,height}).png().toBuffer();
   const raw=await sharp(image).ensureAlpha().raw().toBuffer();const b=bounds(raw,width,height);
   if(b.right<0)throw Error('Empty requested pose: '+job.id+'/'+i);
   cells.push({image,width,height,b});
  }
  // One scale for the whole identity; never stretch crouches to standing height.
  const scale=Math.min(900/(meta.height/rows*.78),...cells.map(c=>Math.min(748/(c.b.right-c.b.left+1),900/(c.b.bottom-c.b.top+1))));
  const folder=path.join(out,job.id);fs.mkdirSync(folder,{recursive:true});
  const entry={id:job.id,name:job.name,reference:path.relative(out,job.reference).replaceAll('\\','/'),sheet:'sheets/'+job.id+'-v1.png',scale,rowDetection:useBands?'alpha-gaps':'equal-grid-fallback',frames:[]};
  for(const [i,cell]of cells.entries()){
   const frame=job.frames[i],b=cell.b,width=Math.round((b.right-b.left+1)*scale),height=Math.round((b.bottom-b.top+1)*scale);
   const pose=await sharp(cell.image).extract({left:b.left,top:b.top,width:b.right-b.left+1,height:b.bottom-b.top+1}).resize(width,height).png().toBuffer();
   // The generated sheets have varying foot baselines. Align the silhouette bottom,
   // record this approximation rather than claiming a hand-verified sole landmark.
   const target=path.join(folder,frame.key+'-v1.png');
   await sharp({create:{width:768,height:1024,channels:4,background:transparent}}).composite([{input:pose,left:Math.floor((768-width)/2),top:964-height}]).png().toFile(target);
   const edge=b.left<3||b.right>cell.width-4||b.top<3||b.bottom>cell.height-4;
   entry.frames.push({...frame,src:job.id+'/'+frame.key+'-v1.png',review:edge?'check-cell-edge':'pending-visual-approval',bounds:b,pivotMethod:'silhouette-bottom approximation'});
  }
  manifest.characters.push(entry);job.sheet=entry.sheet;job.status='generated-draft';job.source=source.source;
  montage.push({input:await sharp(sheet).resize(360,450,{fit:'contain',background:transparent}).toBuffer(),left:index%3*380+10,top:Math.floor(index/3)*490+30});
  montage.push({input:Buffer.from(`<svg width="380" height="30"><text x="190" y="22" text-anchor="middle" fill="white" font-family="Malgun Gothic" font-size="18">${job.name}</text></svg>`),left:index%3*380,top:Math.floor(index/3)*490});
 }
 await sharp({create:{width:1140,height:1470,channels:4,background:'#30343b'}}).composite(montage).png().toFile(path.join(out,'overview.png'));
 fs.writeFileSync(path.join(out,'motion-assets.js'),'window.irudaMotionAssets='+JSON.stringify(manifest,null,2)+';\n');
 fs.writeFileSync(path.join(out,'motion-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(out,'motion-plan.json'),JSON.stringify(plan,null,2)+'\n');
 console.log(JSON.stringify({characters:manifest.characters.length,poses:manifest.characters.reduce((n,c)=>n+c.frames.length,0),edgeChecks:manifest.characters.flatMap(c=>c.frames).filter(f=>f.review==='check-cell-edge').length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
