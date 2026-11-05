const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');
// Unspecified heights are presentation references, not new worldbuilding facts.
const heights = {
 '00_이루어질_스탠딩.png': [171,true], '01_이루어져_스탠딩.png': [135,true],
 '02_이루어라_스탠딩.png': [175,true], '03_이루소서_스탠딩.png': [177,true],
 '04_이루리_초반_스탠딩.png': [180,false], '04_이루리_스탠딩.png': [180,false],
 '05_이루어도_스탠딩.png': [200,true], '06_이루게나_스탠딩.png': [181,true],
 '07_이루도록_스탠딩.png': [192,true], '08_이루려나_스탠딩.png': [168,true],
 '09_이루겠네_스탠딩.png': [165,true],
 'pentar_hazard.png': [185,false], 'pentar_bio.png': [155,false],
 'pentar_drink.png': [170,false], 'pentar_cigarette.png': [190,false],
 '월정커_누님_스탠딩.png': [175,false], '월정커_아우_스탠딩.png': [180,false]
};
(async () => {
 const layout = {};
 for (const directory of ['assets/standing','assets/story/standing']) {
  for (const file of fs.readdirSync(path.join(root,directory)).filter(file => file.endsWith('.png'))) {
   const src = `${directory}/${file}`;
   const {data,info} = await sharp(path.join(root,src)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   let top=info.height,bottom=-1;
   for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
    if(data[(y*info.width+x)*4+3]>32) { top=Math.min(top,y);bottom=Math.max(bottom,y); }
   }
   if(bottom<top) throw new Error(`Empty sprite: ${src}`);
   const [heightCm,confirmed] = heights[file] || [180,false];
   layout[src] = {heightCm,confirmed,visibleFraction:(bottom-top+1)/info.height,bottomPadding:(info.height-1-bottom)/info.height};
  }
 }
 fs.writeFileSync(path.join(root,'standing-layout.js'), `// Generated image bounds and character height references.\nwindow.vnStandingLayout = ${JSON.stringify(layout,null,2)};\n`);
 console.log(`Measured ${Object.keys(layout).length} standing sprites.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
