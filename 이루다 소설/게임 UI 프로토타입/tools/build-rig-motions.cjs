const fs=require('node:fs'),path=require('node:path');
const sharp=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const definitions=require('./rig-motion-definitions.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/battle/motions');
const plan=JSON.parse(fs.readFileSync(path.join(dir,'motion-plan.json'),'utf8'));
const W=768,H=1024,CW=1152,CH=1280,offset=[192,200];
const inside=(x,y,poly)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
 const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
}return hit;};
const distance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
const I=[1,0,0,1,0,0];
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const point=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
const rotate=(p,degrees)=>{const r=degrees*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return [c,s,-s,c,p[0]-c*p[0]+s*p[1],p[1]-s*p[0]-c*p[1]];};
const angle=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
function poseFor(frame,def,id){
 const hit=frame.hit||1;
 const p={torso:0,arms:[[0,0],[0,0]],legs:[[0,0],[0,0]]};
 const aim=(side,upper,lower)=>{const [a,b,c]=def.arms[side];const u=upper-angle(a,b)-p.torso;p.arms[side]=[u,lower-angle(b,c)-p.torso-u];};
 if(frame.key==='idle')return p;
 if(frame.key==='move'){p.torso=9;p.arms=[[-24,22],[18,-26]];p.legs=[[-23,35],[22,-42]];}
 else if(frame.key==='hurt'||frame.key==='clash-loss'){p.torso=-8;p.arms=[[15,-18],[-12,18]];p.legs=[[9,-14],[-8,13]];}
 else if(frame.key==='defense'){
   p.torso=id==='eodo'?0:-5;p.legs=[[9,-17],[-10,17]];
   aim(0,-25,-55);if(!['eojil','eojyeo'].includes(id))aim(1,-155,-110);
 }else if(frame.key==='clash'){p.torso=4;aim(0,5,-18);p.legs=[[-9,10],[7,-8]];}
 else if(frame.key==='clash-win'){p.torso=3;aim(0,-6,-3);p.legs=[[-8,10],[7,-7]];}
 else {
   p.torso=hit===2?-4:hit===3?6:3;p.legs=hit===2?[[10,-13],[-10,14]]:[[-8,10],[7,-7]];
   if(id==='sosuh'||id==='gena')aim(0,hit===1?-45:hit===2?15:-12,hit===1?-75:hit===2?30:-5);
   else if(id==='eodo'){aim(0,hit===1?-8:12,hit===1?-5:20);if(hit===2)aim(1,-170,-160);}
   else if(id==='ryeona'){aim(0,hit===1?-30:hit===2?8:-15,hit===1?-15:hit===2?-25:-40);}
   else aim(0,hit===1?-5:hit===2?-25:12,hit===1?-3:hit===2?-35:0);
   if(frame.key.startsWith('overdrive')){p.torso+=3;p.legs[0][0]-=4;p.legs[1][0]+=4;}
 }
 return p;
}
function matrices(def,pose){
 const torso=rotate(def.pelvis,pose.torso),result={torso,head:mul(torso,rotate(def.neck,-pose.torso))};
 def.arms.forEach(([shoulder,elbow],i)=>{result['arm'+i]=mul(torso,rotate(shoulder,pose.arms[i][0]));result['forearm'+i]=mul(result['arm'+i],rotate(elbow,pose.arms[i][1]));});
 def.legs.forEach(([hip,knee],i)=>{result['thigh'+i]=mul(I,rotate(hip,pose.legs[i][0]));result['shin'+i]=mul(result['thigh'+i],rotate(knee,pose.legs[i][1]));});
 const soles=def.legs.map((leg,i)=>point(result['shin'+i],leg[3]));
 const baseY=Math.max(...def.legs.map(leg=>leg[3][1])),y=baseY-Math.max(...soles.map(p=>p[1]));
 const baseX=def.legs.reduce((s,l)=>s+l[3][0],0)/2,x=baseX-soles.reduce((s,p)=>s+p[0],0)/2;
 const registration=[1,0,0,1,x+offset[0],y+offset[1]];
 for(const k of Object.keys(result))result[k]=mul(registration,result[k]);
 if(def.weapon)result.weapon=result['forearm'+def.weapon.arm];
 if(def.prop)result.prop=result['forearm'+def.prop.arm];
 return result;
}
(async()=>{
 const manifest={kind:'original-SD-cutout-key-poses',revision:'rig-1',canvas:[CW*2,CH*2],footPivot:[(384+offset[0])*2,(964+offset[1])*2],characters:[]},runtime={};
 const only=process.argv[2];
 for(const job of plan.jobs.filter(j=>!only||j.id===only)){
   const def=definitions[job.id],folder=path.join(dir,'rig',job.id),partsDir=path.join(folder,'parts');fs.mkdirSync(partsDir,{recursive:true});
   const {data,info}=await sharp(job.reference).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   if(info.width!==W||info.height!==H)throw Error('Unexpected SD canvas '+job.id);
   const keys=['torso','head','arm0','forearm0','arm1','forearm1','thigh0','shin0','thigh1','shin1',...(def.weapon?['weapon']:[]),...(def.prop?['prop']:[])];
   const pixels=Object.fromEntries(keys.map(k=>[k,Buffer.alloc(data.length)]));
   const owners=new Array(W*H);
   for(let y=0;y<H;y++)for(let x=0;x<W;x++){
     const index=(y*W+x)*4;if(!data[index+3])continue;
     let key='torso';
     def.legPolys.forEach((poly,i)=>{if(inside(x,y,poly)){const [a,b,c]=def.legs[i];key=distance([x,y],a,b)<distance([x,y],b,c)?'thigh'+i:'shin'+i;}});
     def.armPolys.forEach((poly,i)=>{if(inside(x,y,poly)){const [a,b,c]=def.arms[i];key=distance([x,y],a,b)<distance([x,y],b,c)?'arm'+i:'forearm'+i;}});
     if(y<def.headY)key='head';
     if(def.weapon&&inside(x,y,def.weapon.poly))key='weapon';
     if(def.prop&&inside(x,y,def.prop.poly))key='prop';
     data.copy(pixels[key],index,index,index+4);owners[y*W+x]=key;
   }
   // Retain overlapping original joint pixels so rotating pieces do not expose holes.
   const joints=def.arms.flatMap(([s,e],i)=>[[s,'torso','arm'+i,18],[e,'arm'+i,'forearm'+i,20]])
     .concat(def.legs.flatMap(([h,k],i)=>[[h,'torso','thigh'+i,22],[k,'thigh'+i,'shin'+i,24]]));
   const overlays=Object.fromEntries(keys.map(k=>[k,Buffer.from(pixels[k])]));
   for(const [p,a,b,r]of joints)for(let y=Math.max(0,Math.floor(p[1]-r));y<Math.min(H,p[1]+r);y++)for(let x=Math.max(0,Math.floor(p[0]-r));x<Math.min(W,p[0]+r);x++){
     const owner=owners[y*W+x],index=(y*W+x)*4;if(Math.hypot(x-p[0],y-p[1])>r||![a,b].includes(owner)||data[index+3]<255)continue;
     data.copy(overlays[a],index,index,index+4);data.copy(overlays[b],index,index,index+4);
   }
   const sources={};for(const k of keys){const png=await sharp(overlays[k],{raw:{width:W,height:H,channels:4}}).png().toBuffer();fs.writeFileSync(path.join(partsDir,k+'.png'),png);sources[k]=png.toString('base64');}
   const frames=[],transforms={};
   for(const frame of [{key:'idle',label:'원본 파츠 검증'},...job.frames]){
     const m=matrices(def,poseFor(frame,def,job.id));transforms[frame.key]=m;
     const order=['thigh0','shin0','thigh1','shin1','torso','arm1','forearm1','prop','head','arm0','forearm0','weapon'];
     const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}">${order.filter(k=>sources[k]).map(k=>`<image width="${W}" height="${H}" transform="matrix(${m[k].join(' ')})" xlink:href="data:image/png;base64,${sources[k]}"/>`).join('')}</svg>`;
     const native=await sharp(Buffer.from(svg)).png().toBuffer();fs.writeFileSync(path.join(folder,frame.key+'-native.png'),native);
     await sharp(native).resize(CW*2,CH*2).png().toFile(path.join(folder,frame.key+'.png'));
     const entry={...frame,src:`rig/${job.id}/${frame.key}.png`,nativeSrc:`rig/${job.id}/${frame.key}-native.png`,nativeSize:[CW,CH],review:'cutout-joints-review-required'};
     frames.push(entry);
   }
   fs.writeFileSync(path.join(folder,'rig.json'),JSON.stringify({reference:job.reference,definition:def,canvas:[CW,CH],pixelOwnership:'original only',transforms},null,2)+'\n');
   const entry={id:job.id,name:job.name,reference:path.relative(dir,job.reference).replaceAll('\\','/'),frames};manifest.characters.push(entry);
   runtime[job.name]={renderScale:CH/H,canvas:manifest.canvas,pivot:manifest.footPivot,frames:frames.filter(f=>f.key!=='idle')};
   console.log(job.name+': '+job.frames.length+' fixed-proportion cutout poses.');
 }
 const suffix=only?'-'+only:'';
 fs.writeFileSync(path.join(dir,'motion-manifest-rig'+suffix+'.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'motion-assets-rig'+suffix+'.js'),'window.irudaRigMotionAssets='+JSON.stringify(manifest)+';\n');
 fs.writeFileSync(path.join(dir,'motion-runtime-rig'+suffix+'.js'),'window.battleRigMotionLibrary='+JSON.stringify(runtime)+';\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
