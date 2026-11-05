const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out=path.resolve(__dirname,'../assets/battle/motions');
const ids=process.argv.slice(2);
(async()=>{
 for(const id of ids){
  const full=path.join(out,'motion-manifest-v2.json');
  const manifest=JSON.parse(fs.readFileSync(fs.existsSync(full)?full:path.join(out,'inspection-'+id+'.json'),'utf8'));
  const c=manifest.characters.find(c=>c.id===id),items=[{src:c.reference,label:'BASE SD'},...c.frames.map(f=>({src:f.nativeSrc,label:f.key}))];
  const cols=5,cw=260,ch=340,rows=Math.ceil(items.length/cols),layers=[];
  for(const [i,f] of items.entries()){
   const x=(i%cols)*cw,y=Math.floor(i/cols)*ch;
   const img=await sharp(path.resolve(out,f.src)).resize({width:240,height:292,fit:'inside'}).png().toBuffer(),m=await sharp(img).metadata();
   layers.push({input:img,left:x+Math.floor((cw-m.width)/2),top:y+20+292-m.height});
   const label=Buffer.from(`<svg width="260" height="28"><text x="130" y="20" text-anchor="middle" font-family="Arial" font-size="13" fill="white">${f.label}</text></svg>`);
   layers.push({input:label,left:x,top:y+312});
  }
  await sharp({create:{width:cw*cols,height:ch*rows,channels:4,background:'#30343a'}}).composite(layers).png().toFile(path.join(out,'review-'+id+'-v2.png'));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
