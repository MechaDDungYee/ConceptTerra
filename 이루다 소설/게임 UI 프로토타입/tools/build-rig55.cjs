const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const definitions = require('./rig55-definitions.cjs');
const root = path.resolve(__dirname, '..');
const motionRoot = path.join(root, 'assets/battle/motions');
const sourceRoot = path.join(root, 'assets/battle/sd/sd-55');
const plan = JSON.parse(fs.readFileSync(path.join(motionRoot, 'motion-plan.json')));
const selection = JSON.parse(fs.readFileSync(path.join(sourceRoot, 'selection-records.json'))).selection;
const W = 1086, H = 1448, CW = 1800, CH = 1800, OX = 357, OY = 200;
const identity = [1, 0, 0, 1, 0, 0];
const mul = (a,b) => [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const point = (m,p) => [m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
const rotate = (p,d) => {const a=d*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [c,s,-s,c,p[0]-c*p[0]+s*p[1],p[1]-s*p[0]-c*p[1]];};
const angle = (a,b) => Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
function inside(x,y,poly) {
  let hit=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
  }
  return hit;
}
const imageTag = (png,m,width=W,height=H) => `<image width="${width}" height="${height}" transform="matrix(${m.join(' ')})" href="data:image/png;base64,${png.toString('base64')}"/>`;
const svg = content => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}">${content}</svg>`);

function pose(frame, def, id) {
  const p={body:0,arms:[[0,0],[0,0]],legs:[[0,0],[0,0]]};
  const aim=(i,absolute,elbow=0) => {
    if(def.arms[i].locked)return;
    p.arms[i]=[absolute-angle(...def.arms[i].joints.slice(0,2))-p.body,elbow];
  };
  if(frame.key==='idle')return p;
  if(frame.key==='move'){
    p.body=5;p.legs=[[-12,17],[12,-19]];p.arms=[[15,-8],[-10,8]];
  }else if(frame.key==='hurt'){
    p.body=-7;p.legs=[[4,-5],[-3,5]];aim(0,57,-16);
  }else if(frame.key==='clash-loss'){
    p.body=-5;p.legs=[[7,-9],[-5,8]];p.arms=[[12,-8],[-7,8]];
  }else if(frame.key==='clash'){
    p.body=2;p.legs=[[-5,6],[5,-6]];aim(0,22,-12);
  }else if(frame.key==='clash-win'){
    p.body=4;p.legs=[[-7,9],[5,-7]];aim(0,5,4);
  }else if(frame.key==='defense'){
    p.body=id==='eodo'?0:-5;p.legs=[[7,-10],[-7,9]];aim(0,-30,24);
  }else {
    const hit=frame.hit||1,skill=Number(frame.key.match(/skill-(\d)/)?.[1]||5);
    p.body=(hit===2?-2:3)+(skill===4?2:0);
    p.legs=hit===2?[[4,-6],[-5,7]]:[[-6,8],[6,-8]];
    const target=hit===1?10-skill*5:hit===2?48-skill*7:-22;
    aim(0,target,hit===2?-12:7);
    if(id==='eodo'&&!def.arms[1].locked)aim(1,hit===2?150:105,hit===2?15:-9);
    // Held two-handed props remain intact; these frames use torso/leg key poses.
    if(id==='eojyeo')p.body+=hit===2?3:-2;
    if(frame.key.startsWith('overdrive'))p.body+=2;
  }
  def.arms.forEach((arm,i)=>{if(arm.locked)p.arms[i]=[0,0];});
  return p;
}

function matrices(def,p,sole) {
  const out={body:rotate(def.pelvis,p.body)};
  def.arms.forEach((arm,i)=>{
    out['upper'+i]=mul(out.body,rotate(arm.joints[0],p.arms[i][0]));
    out['lower'+i]=mul(out['upper'+i],rotate(arm.joints[1],p.arms[i][1]));
  });
  def.legs.forEach((leg,i)=>{
    out['thigh'+i]=rotate(leg.joints[0],p.legs[i][0]);
    out['shin'+i]=mul(out['thigh'+i],rotate(leg.joints[1],p.legs[i][1]));
  });
  const feet=def.legs.map((l,i)=>point(out['shin'+i],l.sole));
  const dx=543-(feet[0][0]+feet[1][0])/2;
  const dy=sole-Math.max(...feet.map(f=>f[1]));
  const registration=[1,0,0,1,OX+dx,OY+dy];
  Object.keys(out).forEach(k=>{out[k]=mul(registration,out[k]);});
  return out;
}

async function badgeAsset() {
  const file=path.resolve(root,'../이루다 1팀 컨셉 아트/이루다_1팀_문양_패치_컨셉아트.png');
  const badge=await sharp(file).extract({left:32,top:43,width:530,height:522}).png().toBuffer();
  const mask=Buffer.from('<svg width="530" height="522"><ellipse cx="265" cy="261" rx="258" ry="259" fill="white"/></svg>');
  const isolated=await sharp(badge).composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
  const out=path.join(motionRoot,'rig55');fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'team-1-patch.png'),isolated);
  return isolated;
}

async function patchedSource(file,def,badge) {
  const source=fs.readFileSync(file);
  const inserts=def.badges.map(([x,y,w,h,d])=>{
    const base=[w/530,0,0,h/522,x-w/2,y-h/2];
    return imageTag(badge,mul(rotate([x,y],d),base),530,522);
  });
  const overlay=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${inserts.join('')}</svg>`);
  return sharp(source).composite([{input:overlay}]).png().toBuffer();
}

async function partition(png,def,backingFile) {
  const {data}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const keys=['body','upper0','lower0','upper1','lower1','thigh0','shin0','thigh1','shin1'];
  const buffers=Object.fromEntries(keys.map(k=>[k,Buffer.alloc(data.length)]));
  const owners=new Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const index=(y*W+x)*4;if(!data[index+3])continue;
    let key='body';
    def.legs.forEach((leg,i)=>{if(inside(x,y,leg.poly))key=y<leg.joints[1][1]?'thigh'+i:'shin'+i;});
    def.arms.forEach((arm,i)=>{
      if(inside(x,y,arm.poly)){
        const [s,e,w]=arm.joints;
        const v=[e[0]-s[0],e[1]-s[1]],projection=(x-e[0])*v[0]+(y-e[1])*v[1];
        key=arm.locked||projection<0?'upper'+i:'lower'+i;
      }
    });
    data.copy(buffers[key],index,index,index+4);owners[y*W+x]=key;
  }
  const clean=Object.fromEntries(keys.map(k=>[k,Buffer.from(buffers[k])]));
  const backing=Buffer.alloc(data.length);
  if(fs.existsSync(backingFile)){
    const plate=await sharp(backingFile).resize(W,H,{fit:'fill'}).ensureAlpha().raw().toBuffer();
    for(let p=0;p<W*H;p++){
      if(owners[p]&&owners[p]!=='body')plate.copy(backing,p*4,p*4,p*4+4);
    }
  }
  // Hidden backing uses sampled coat pixels, never a replacement head or limb.
  for(let y=300;y<960;y++)for(let x=250;x<850;x++){
    const index=(y*W+x)*4;
    if(buffers.body[index+3]||!inside(x,y,def.body))continue;
    let nearest=-1;
    for(let d=1;d<180&&nearest<0;d++)for(const sx of [x-d,x+d]){
      if(sx<0||sx>=W)continue;
      const at=(y*W+sx)*4;
      if(clean.body[at+3]===255&&clean.body[at]<90&&clean.body[at+1]<90&&clean.body[at+2]<100){nearest=at;break;}
    }
    if(nearest>=0){clean.body.copy(buffers.body,index,nearest,nearest+4);}
  }
  const joints=[];
  def.arms.forEach((arm,i)=>{
    joints.push([arm.joints[0],'body','upper'+i,35]);
    if(!arm.locked)joints.push([arm.joints[1],'upper'+i,'lower'+i,45]);
  });
  def.legs.forEach((leg,i)=>joints.push([leg.joints[1],'thigh'+i,'shin'+i,75]));
  for(const [p,a,b,r]of joints){
    for(let y=Math.max(0,Math.floor(p[1]-r));y<Math.min(H,p[1]+r);y++)for(let x=Math.max(0,Math.floor(p[0]-r));x<Math.min(W,p[0]+r);x++){
      const at=(y*W+x)*4;
      if(Math.hypot(x-p[0],y-p[1])>r||![a,b].includes(owners[y*W+x])||data[at+3]<255)continue;
      data.copy(buffers[a],at,at,at+4);data.copy(buffers[b],at,at,at+4);
    }
  }
  const parts={backing:await sharp(backing,{raw:{width:W,height:H,channels:4}}).png().toBuffer()};
  for(const k of keys)parts[k]=await sharp(buffers[k],{raw:{width:W,height:H,channels:4}}).png().toBuffer();
  return parts;
}

(async()=>{
  const badge=await badgeAsset();
  const manifest={revision:'sd55-original-parts',kind:'rigid-cutout-key-poses',canvas:[CW,CH],characters:[],review:'draft-joint-and-occlusion-review-required'};
  const runtime={};
  for(const job of plan.jobs.filter(j=>!process.argv[2]||j.id===process.argv[2])){
    const item=selection.find(x=>x.name===job.name),def=definitions[job.id];
    const source=path.join(sourceRoot,item.file),folder=path.join(motionRoot,'rig55',job.id);
    fs.mkdirSync(path.join(folder,'parts'),{recursive:true});
    const patched=await patchedSource(source,def,badge);
    fs.mkdirSync(path.join(sourceRoot,'team-logo'),{recursive:true});
    fs.writeFileSync(path.join(sourceRoot,'team-logo',item.file),patched);
    const parts=await partition(patched,def,path.join(folder,'backing-source.png'));
    for(const [key,png]of Object.entries(parts))fs.writeFileSync(path.join(folder,'parts',key+'.png'),png);
    const frames=[],transforms={};
    const order=['thigh0','shin0','thigh1','shin1','body','upper1','lower1','upper0','lower0'];
    for(const frame of [{key:'idle',label:'원본 SD'},...job.frames]){
      const m=matrices(def,pose(frame,def,job.id),item.sole);transforms[frame.key]=m;
      const content=frame.key==='idle'?imageTag(patched,[1,0,0,1,OX,OY]):imageTag(parts.backing,m.body)+order.map(k=>imageTag(parts[k],m[k])).join('');
      const file=path.join(folder,frame.key+'.png');
      await sharp(svg(content)).png().toFile(file);
      frames.push({...frame,src:`rig55/${job.id}/${frame.key}.png`,review:'joint-review-required'});
    }
    const bodyHeight=item.sole-item.crown;
    const entry={id:job.id,name:job.name,source:`../../sd/sd-55/${item.file}`,canvas:[CW,CH],pivot:[900,item.sole+OY],bodyHeight,frames};
    manifest.characters.push(entry);
    runtime[job.name]={registration:'native-body-height',renderScale:CH/bodyHeight,canvas:[CW,CH],pivot:entry.pivot,frames:frames.filter(f=>f.key!=='idle')};
    fs.writeFileSync(path.join(folder,'rig.json'),JSON.stringify({source,anatomy:'original pixels; unit-length rigid matrices; no pose-height normalization',definition:def,transforms},null,2));
    console.log(`${job.name}: ${job.frames.length} cutout poses, original head and bone lengths.`);
  }
  const suffix=process.argv[2]?'-'+process.argv[2]:'';
  fs.writeFileSync(path.join(motionRoot,'motion-manifest-rig55'+suffix+'.json'),JSON.stringify(manifest,null,2));
  fs.writeFileSync(path.join(motionRoot,'motion-runtime-rig55'+suffix+'.js'),'window.battleRig55MotionLibrary='+JSON.stringify(runtime)+';\n');
})();
