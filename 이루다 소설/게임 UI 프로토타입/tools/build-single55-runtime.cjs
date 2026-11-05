const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir = path.resolve(__dirname, '../assets/battle/motions/single55');
(async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json')));
  const library = {};
  for (const frame of manifest.frames) {
    const {data,info} = await sharp(path.join(dir,frame.src)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let left=info.width,right=-1;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
      if(data[(y*info.width+x)*4+3]>=128){left=Math.min(left,x);right=Math.max(right,x);}
    }
    (library[frame.name] ||= {frames:[]}).frames.push({
      key:frame.key,src:frame.src+(frame.revision?'?v='+frame.revision:''),skillName:frame.skillName,hit:frame.hit,
      canvas:[info.width,info.height],pivotY:frame.footPivotApprox[1],
      centerX:(left+right)/2
    });
  }
  fs.writeFileSync(path.join(dir,'runtime.js'),'window.battleSingleMotionLibrary='+JSON.stringify(library)+';\n');
  console.log('Saved single-image runtime: '+manifest.frames.length+' poses.');
})().catch(error=>{console.error(error);process.exitCode=1;});
