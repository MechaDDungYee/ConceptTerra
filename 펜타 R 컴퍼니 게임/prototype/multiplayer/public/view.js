const mapCanvas=document.createElement('canvas');
mapCanvas.width=COLS*TILE;mapCanvas.height=ROWS*TILE;
const mx=mapCanvas.getContext('2d');
let paintedSite;
const px=(g,c,x,y,w,h)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);};
function tilePaint() {
  const dark='#202421', light='#54574b';
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) {
    const i=square(x,y), id=site.floor[i], X=x*TILE,Y=y*TILE, rnd=noise(x,y);
    px(mx,colors[id],X,Y,20,20);
    if(id) {
      px(mx,'#222721',X,Y,20,1);px(mx,'#252a25',X,Y,1,20);
      px(mx,id===3?'#494235':'#444942',X+2,Y+2,17,1);
      if(rnd>.43) px(mx,rnd>.79?'#605744':'#292d28',X+3+Math.floor(rnd*10),Y+7+Math.floor(rnd*8),rnd>.78?3:2,1);
      if(rnd>.82) px(mx,'#242824',X+3,Y+5,3,3);
      if(site.floor[square(x,y-1)]===0) px(mx,'#1e2220',X,Y+1,20,3);
      if(id===1 && (x===17||x===25)) for(let c=0;c<18;c+=6) px(mx,'#807048',X+c,Y+16,3,2);
    } else if([square(x,y+1),square(x,y-1),square(x-1,y),square(x+1,y)].some(j=>site.floor[j])) {
      px(mx,dark,X,Y,20,20);px(mx,'#3a3e36',X,Y+3,20,12);
      px(mx,light,X,Y+2,20,2);px(mx,'#282c27',X,Y+12,20,5);
      px(mx,'#262b26',X,Y+4,1,11);
      if(rnd>.7) px(mx,'#76634a',X+4,Y+6,3,2);
    }
  }
  for(const rune of site.decals) {
    mx.font='bold 9px monospace';mx.textAlign='center';mx.fillStyle='#8a8068';mx.fillText(rune.text,rune.x,rune.y+2);
  }
  const d=site.dock;
  px(mx,'#514733',d.x-46,d.y-26,92,52);
  px(mx,'#42473b',d.x-43,d.y-23,86,46);
  for(let i=-38;i<40;i+=8) {
    px(mx,'#c49252',d.x+i,d.y-26,4,2);px(mx,'#c49252',d.x+i,d.y+24,4,2);
  }
  for(let y=-19;y<22;y+=6) px(mx,'#3a4138',d.x-40,d.y+y,80,1);
  px(mx,'#628270',d.x-2,d.y-2,4,4);
  for(const [i,t] of site.fixture) {
    const X=(i%COLS)*TILE,Y=Math.floor(i/COLS)*TILE;
    px(mx,'#1b1f1c',X+1,Y+3,19,17);
    px(mx,t==='reactor'?'#5d4a40':t==='shelf'?'#6b4e35':'#56594f',X+1,Y+1,17,15);
    px(mx,'#292f2a',X+2,Y+11,15,4);
    px(mx,'#818171',X+2,Y+1,15,2);
    if(t==='line') {
      px(mx,'#222a28',X+5,Y+4,9,9);
      for(let z=0;z<8;z+=3) px(mx,'#656d63',X+5,Y+4+z,9,1);
      px(mx,'#b9854d',X+2,Y+5,2,2);
    } else if(t==='shelf'||t==='crate') {
      px(mx,'#a2794c',X+3,Y+4,12,4);px(mx,'#7d5b3e',X+5,Y+8,9,3);
    } else {
      px(mx,'#252d2a',X+4,Y+4,10,5);px(mx,t==='reactor'?'#d27e5c':'#849c78',X+7,Y+5,4,2);
    }
  }
  site.explored=new Uint8Array(COLS*ROWS);
  paintedSite=site;
}
function sprite(a,index,row,pose) {
  const aX=Math.round(a.x),aY=Math.round(a.y);
  if(!atlas.complete||!atlas.naturalWidth) {
    px(ctx,'#702f2b',aX-6,aY-16,12,13);px(ctx,'#d2a56f',aX-3,aY-15,6,3);return;
  }
  const bob=a.moved?Math.floor(a.phase/5)%2:0;
  ctx.drawImage(atlas,(index+pose*4)*44,row*48,44,48,aX-16,aY-33-bob,32,35);
}
const HALF_VIEW=Math.PI*55/180;
const getRange=()=>state.choice===1?222:148;
function shown(o) {
  return state.mode==='brief'||(dist(player,o)<=getRange()&&inFront(o,Math.cos(HALF_VIEW))&&line(player,o));
}
function clipVision(x,y) {
  const angle=Math.atan2(player.ay,player.ax), range=getRange();
  ctx.beginPath();ctx.moveTo(player.x-x,player.y-y);
  for(let i=0;i<=88;i++) {
    const a=angle-HALF_VIEW+i*HALF_VIEW/44, vx=Math.cos(a), vy=Math.sin(a);
    let length=range;
    for(let d=2;d<=range;d+=2) {
      if(isSolid(cell(player.x+vx*d,player.y+vy*d))) {length=Math.min(range,d+4);break;}
    }
    ctx.lineTo(player.x+vx*length-x,player.y+vy*length-y);
  }
  ctx.closePath();ctx.clip();
}
function drawDoor(d,dx,dy) {
  const x=d.x-dx,y=d.y-dy;
  px(ctx,'#101715',x-10,y-10,20,20);
  if(d.open) {
    px(ctx,'#687267',x-10,y-10,3,20);px(ctx,'#687267',x+7,y-10,3,20);
    px(ctx,'#454d42',x-7,y+6,14,3);
  } else {
    px(ctx,d.security?'#715049':'#596258',x-9,y-8,18,15);
    px(ctx,'#889085',x-8,y-7,16,2);
    px(ctx,'#303632',x-1,y-6,2,12);
  }
  px(ctx,d.open?'#8db78c':'#e09b5a',x+5,y-6,2,2);
}
function drawItem(o,dx,dy,time) {
  const x=Math.round(o.x-dx),y=Math.round(o.y-dy);
  px(ctx,'#141714',x-7,y+2,14,3);
  const c=o.known?o.color:'#aaa38a';
  if(o.type===5) {
    px(ctx,'#784a42',x-7,y-7,14,10);
    px(ctx,'#db8b6e',x-3,y-9,6,11);px(ctx,'#f5c5a0',x-1,y-8,2,7);
  } else {
    px(ctx,'#62533d',x-6,y-5,12,8);
    px(ctx,c,x-6,y-7,12,4);px(ctx,'#d8c7a0',x-1,y-6,2,6);
  }
  if(Math.floor(time/240)%5===0) px(ctx,'#fae2a7',x+5,y-8,2,2);
}
function drawEnemy(o,dx,dy,time) {
  const x=o.x-dx,y=o.y-dy, pulse=Math.floor(time/220)%2;
  px(ctx,'#151917',x-9,y-1,18,3);
  if(o.kind==='manager') {
    px(ctx,'#615d47',x-6,y-21,12,11);
    px(ctx,'#858267',x-5,y-21,10,3);
    px(ctx,'#504d39',x-8,y-12,16,12);
    px(ctx,'#b29a63',x-4,y-10,3,3);
    px(ctx,o.mode==='chase'?'#ef7961':'#25291e',x-4,y-16,8,2);
  } else {
    px(ctx,'#626d65',x-6,y-20,12,20);
    px(ctx,'#9a9f89',x-4,y-25,8,8);
    px(ctx,'#424a43',x-4,y-21,8,2);
    if(o.mode!=='dormant') px(ctx,pulse?'#8b9688':'#a3ad95',x-10,y-16,20,4);
  }
}
function drawMap() {
  const map=$('minimap').getContext('2d');
  px(map,'#141916',0,0,172,124);
  for(let i=0;i<site.floor.length;i++) {
    const id=site.floor[i];
    if(id && (id===1||site.explored?.[i])) {
      px(map,id===1?'#537560':colors[id],i%COLS*4,Math.floor(i/COLS)*4,4,4);
    }
  }
  for(const [i,d] of site.doors) {
    if(site.explored?.[i] && (state.mode==='brief'||shown(d))) px(map,d.open?'#90aa95':'#bf875d',i%COLS*4+1,Math.floor(i/COLS)*4+1,2,2);
  }
  px(map,'#a7cca5',site.dock.x/TILE*4-2,site.dock.y/TILE*4-2,4,4);
  px(map,'#f8ce88',player.x/TILE*4-1,player.y/TILE*4-1,3,3);
}
function draw(time) {
  if(paintedSite!==site) tilePaint();
  const x=Math.round(cam.x),y=Math.round(cam.y);
  px(ctx,'#121513',0,0,W,H);
  ctx.save();
  clipVision(x,y);
  ctx.drawImage(mapCanvas,-x,-y);
  for(const d of site.doors.values()) drawDoor(d,x,y);
  const objects=[...others.filter(o=>shown(o)),...site.cargo.filter(o=>(o.where==='floor'||o.where==='air')&&shown(o)),...site.enemies.filter(shown)];
  objects.sort((a,b)=>a.y-b.y);
  for(const o of objects) {
    if(o.peer) {
      const mate={...o,x:o.renderX-x,y:o.renderY-y};
      sprite(mate,o.sy<0?(o.sx<0?0:1):(o.sx<0?2:3),o.choice,o.moved?1:0);
      if(o.down) px(ctx,'#ad715b',mate.x-4,mate.y-39,8,2);
      else px(ctx,'#9ec6ab',mate.x-3,mate.y-39,6,2);
    } else if(o.kind) drawEnemy(o,x,y,time);
    else {
      const height=o.where==='air'?Math.sin(o.flight.time/.48*Math.PI)*13:0;
      drawItem({...o,y:o.y-height},x,y,time);
      if(o.where==='floor'&&o.signalUntil>elapsed) {
        ctx.strokeStyle='#a1dbb1';ctx.strokeRect(Math.round(o.x-x-9),Math.round(o.y-y-11),18,16);
      }
    }
  }
  if(state.mode!=='brief') {
    const range=getRange(), ax=player.x-x, ay=player.y-y;
    const falloff=ctx.createRadialGradient(ax,ay,24,ax,ay,range);
    falloff.addColorStop(0,'#11191500');falloff.addColorStop(1,'#111915d9');
    ctx.fillStyle=falloff;ctx.fillRect(0,0,W,H);
    for(let row=Math.max(0,Math.floor(y/TILE));row<Math.min(ROWS,Math.ceil((y+H)/TILE));row++) {
      for(let col=Math.max(0,Math.floor(x/TILE));col<Math.min(COLS,Math.ceil((x+W)/TILE));col++) {
        const i=square(col,row);
        if(site.floor[i]&&!site.explored[i]&&shown({x:center(col),y:center(row)})) site.explored[i]=1;
      }
    }
  }
  if(site.decoy&&shown(site.decoy)) {
    const d=site.decoy,r=4+Math.floor(time/80)%8;
    ctx.strokeStyle='#e0b167';ctx.strokeRect(Math.round(d.x-x-r),Math.round(d.y-y-r),2*r,2*r);
  }
  const a={...player,x:player.x-x,y:player.y-y};
  if(player.swing) {
    const swing=player.swing, angle=Math.atan2(swing.ay,swing.ax);
    ctx.beginPath();ctx.arc(a.x,a.y,25,angle-.65,angle+.65);
    ctx.strokeStyle=swing.hit?'#f2b977':'#a87d59';ctx.lineWidth=swing.hit?3:1;ctx.stroke();
  }
  if(player.guarding) {
    const angle=Math.atan2(player.ay,player.ax);
    ctx.beginPath();ctx.arc(a.x,a.y,17,angle-.9,angle+.9);
    ctx.strokeStyle='#9bcfae';ctx.lineWidth=2;ctx.stroke();
  }
  ctx.restore();
  const turn=player.sy<0?(player.sx<0?0:1):(player.sx<0?2:3);
  px(ctx,'#151814',a.x-8,a.y-2,16,4);
  sprite(a,turn,state.choice,a.moved&&(a.running||Math.floor(a.phase/8)%2)?1:0);
  const held=heldCargo();
  if(held) {
    const width=heavy()?16:8;
    px(ctx,'#5d4537',a.x-width/2+player.ax*5,a.y-13+player.ay*3,width,7);
    px(ctx,held.color,a.x-width/2+player.ax*5,a.y-13+player.ay*3,width,2);
  }
  if(state.mode==='active') drawStamina(a.x+20,a.y-16);
}
function drawStamina(x,y) {
  // The fill stays anchored at the gap's counterclockwise edge.
  // Its depletion edge moves clockwise toward the anchor.
  const start=-Math.PI/2+.32,end=3*Math.PI/2-.32;
  const fraction=bounded(player.stamina/player.max,0,1);
  ctx.lineWidth=3.5;ctx.strokeStyle='#101713';
  ctx.beginPath();ctx.arc(x,y,7,start,end);ctx.stroke();
  ctx.lineWidth=1.8;ctx.strokeStyle='#55635a';
  ctx.beginPath();ctx.arc(x,y,7,start,end);ctx.stroke();
  if(fraction>0) {
    ctx.strokeStyle=fraction<.2?'#ee926e':'#a9d8a9';
    ctx.beginPath();ctx.arc(x,y,7,end-fraction*(end-start),end);ctx.stroke();
  }
}
