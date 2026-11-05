const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/battle/motions');
const plan=JSON.parse(fs.readFileSync(path.join(dir,'motion-plan.json'),'utf8'));
(async()=>{for(const job of plan.jobs){
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="768" height="1024">'+Array.from({length:16},(_,i)=>`<path d="M${i*50} 0V1024" stroke="#ffdf8855"/><text x="${i*50+2}" y="20" font-size="13" fill="#ffe5a0">${i*50}</text>`).join('')+Array.from({length:21},(_,i)=>`<path d="M0 ${i*50}H768" stroke="#ffdf8855"/><text x="2" y="${i*50+15}" font-size="13" fill="#ffe5a0">${i*50}</text>`).join('')+'</svg>';
 await sharp({create:{width:768,height:1024,channels:4,background:'#30343a'}}).composite([{input:job.reference},{input:Buffer.from(svg)}]).png().toFile(path.join(dir,'review-v3',job.id+'-landmarks.png'));
}})().catch(e=>{console.error(e);process.exitCode=1;});
