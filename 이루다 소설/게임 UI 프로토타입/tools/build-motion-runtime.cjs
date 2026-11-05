const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir=path.resolve(__dirname,'../assets/battle/motions');
async function visibleHeight(file){
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let top=info.height,bottom=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>24){top=Math.min(top,y);bottom=Math.max(bottom,y);}
 return (bottom-top+1)/info.height;
}
(async()=>{
 const m=require(path.join(dir,'motion-manifest-v2.json')),result={};
 for(const c of m.characters){
  const upright=c.frames.find(f=>f.key==='clash-win');
  const renderScale=await visibleHeight(path.resolve(dir,c.reference))/await visibleHeight(path.join(dir,upright.src));
  result[c.name]={renderScale,canvas:m.canvas,pivot:m.footPivot,frames:c.frames};
 }
 fs.writeFileSync(path.join(dir,'motion-runtime-v2.js'),'window.battleMotionLibrary='+JSON.stringify(result)+';\n');
 console.log('Prepared runtime motion catalog for '+Object.keys(result).length+' identities.');
})().catch(e=>{console.error(e);process.exitCode=1;});
