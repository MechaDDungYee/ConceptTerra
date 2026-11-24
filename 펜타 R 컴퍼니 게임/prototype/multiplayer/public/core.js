
'use strict';

const $ = id => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d', {alpha:false});
ctx.imageSmoothingEnabled = false;

const TILE = 20, COLS = 43, ROWS = 31;
let W = canvas.width, H = canvas.height;
const SHIFT = 480, QUOTA = 60;
const crew = [
  ['ram','램','예비 호흡','최대 스태미나 +20%'],
  ['lux','룩스','광각 렌즈','조명 도달 거리 +50%'],
  ['relay','릴레이','원격 해제','조사한 보안문을 원격으로 열기'],
  ['tick','틱','소리 미끼','바라보는 방향에 6초간 작업 소리 발생'],
  ['volt','볼트','2단 달리기','달리는 중 4초간 30% 추가 가속'],
  ['harness','하네스','하중 분산','이동 계산에 적용하는 화물 무게 −25%'],
  ['clamp','클램프','자세 고정','4초 안에 첫 경직과 화물 낙하 방어'],
  ['tag','태그','일괄 감정','멈춘 상태로 주변 화물 최대 3개 감정']
];
const atlas = new Image();
atlas.src = '/atlas.png';
const keys = new Set();
const pointer={x:0,y:0,active:false};
const dirKeys = {w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],arrowup:[0,-1],arrowdown:[0,1],arrowleft:[-1,0],arrowright:[1,0]};
const zones = ['폐쇄 구획','착륙장','출입 로비','생산 구역','물류 구역','설비 구역','정비 통로','코어실'];
const colors = ['#171b1a','#353b37','#323833','#3f3931','#363930','#303938','#363735','#3b3233'];
const stock = [
  ['통조림 상자',4,8,8,'#c98c54'],['퓨즈 묶음',6,14,14,'#d5af61'],['모터 케이스',9,10,12,'#91a3a1'],
  ['광학 렌즈',3,9,12,'#86a7a0'],['제어 기판',5,11,13,'#a6a26a'],['코어 파편',20,35,50,'#d88a76']
];
const state = {mode:'brief',seed:new Uint32Array(1),day:1,total:0,choice:0,sound:false};
crypto.getRandomValues(state.seed);
let site, player, cam, elapsed, warning, timeLast = 0, uiTime = 0, messageUntil = 0;
let audio, standByMessage = 'YouCan 통조림 공장 · 22:00 섹터 봉쇄';

function noise(x,y) {
  let t = Math.imul(x + 1111, 0x45d9f3b) ^ Math.imul(y + 925, 0x9e3779b1);
  t ^= t >>> 16;
  return (t >>> 0) / 4294967296;
}
function prng(seed) {
  let x = seed >>> 0;
  return () => {
    x = (x + 0x6d2b79f5) | 0;
    let t = Math.imul(x ^ x >>> 15, x | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const center = n => n * TILE + TILE / 2;
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const square = (x,y) => x >= 0 && x < COLS && y >= 0 && y < ROWS ? y*COLS+x : -1;
const cell = (x,y) => square(Math.floor(x/TILE),Math.floor(y/TILE));
const format = n => String(n).padStart(2,'0');
const bounded = (v,min,max) => Math.max(min,Math.min(max,v));

function makeSite(seed) {
  const rng = prng(seed), loot = prng(seed ^ 0xd1bbf141);
  const flip = rng() < .5, tX = x => flip ? COLS - 1 - x : x;
  const floor = new Uint8Array(COLS*ROWS), fixture = new Map(), doors = new Map();
  const cargo = [], loaded = [], enemies = [], decals = [];
  const pos = (x,y) => ({x:center(tX(x)), y:center(y)});
  function rect(x1,y1,x2,y2,id) {
    for(let y=y1;y<=y2;y++) for(let x=x1;x<=x2;x++) floor[square(tX(x),y)]=id;
  }
  function prop(x,y,type) { fixture.set(square(tX(x),y),type); }
  function door(x,y,security=false) {
    const d={...pos(x,y),security,open:false,registered:false};
    doors.set(square(tX(x),y),d);
  }
  function item(type,spots) {
    const p=spots.splice(Math.floor(loot()*spots.length),1)[0];
    const [name,weight,lo,hi,color]=stock[type];
    cargo.push({...pos(...p),type,name,weight,lo,hi,color,value:lo+Math.floor(loot()*(hi-lo+1)),known:false,where:'floor'});
  }
  rect(16,22,26,28,1); rect(20,20,22,23,1);
  rect(16,16,26,20,2); rect(19,13,23,15,6);
  rect(2,11,14,19,3); rect(15,17,15,17,6);
  rect(28,11,40,19,4); rect(27,17,27,17,6);
  rect(15,4,27,12,5); rect(6,7,8,10,6); rect(9,7,14,8,6);
  rect(29,7,37,8,6); rect(35,9,37,10,6); rect(28,8,28,8,6);
  rect(18,1,24,2,7); rect(21,3,21,3,7);
  door(15,17); door(27,17); door(28,8); door(21,3,true);
  [4,7,10,12].forEach(x=>{prop(x,13,'line');prop(x,14,'line');});
  [30,32,37,39].forEach(x=>{prop(x,12,'shelf');prop(x,14,'shelf');prop(x,15,'shelf');});
  [17,19,23,25].forEach(x=>{prop(x,6,'machine');prop(x,10,'machine');});
  prop(20,1,'reactor');prop(22,1,'reactor');
  prop(17,28,'console');prop(25,28,'crate');
  const inbound = [[17,18],[25,18],[18,17],[24,17]];
  const production = [[4,16],[6,17],[9,16],[12,17],[10,18]];
  const storage = [[31,16],[33,18],[36,16],[39,17],[34,13]];
  item(0,inbound); item(1,inbound); item(2,production);
  item(3,production); item(4,storage); item(0,storage);
  item(5,[[20,2],[22,2],[24,2]]);
  const manager = {...pos(35,12),kind:'manager',mode:'patrol',route:[[35,12],[36,15],[35,18],[33,16]].map(p=>pos(...p)),stop:0,wait:0,step:0,path:[]};
  const statue = {...pos(24,7),kind:'statue',mode:'dormant',route:[[24,7],[23,11],[20,10],[19,8]].map(p=>pos(...p)),stop:0,wait:0,step:0,path:[]};
  enemies.push(manager,statue);
  [[21,24,'SHIP'],[20,19,'C3'],[9,18,'LINE'],[35,18,'STOCK'],[21,5,'HIGH V']].forEach(([x,y,text])=>decals.push({...pos(x,y),text}));
  return {floor,fixture,doors,cargo,loaded,enemies,decals,dock:pos(21,26),decoy:null};
}
function isSolid(index) {
  return index === -1 || !site.floor[index] || site.fixture.has(index) || site.doors.get(index)?.open === false;
}
function collide(x,y,r) {
  for (const ox of [-r,r]) for(const oy of [-r,r]) if(isSolid(cell(x+ox,y+oy))) return true;
  return false;
}
function slide(entity,dx,dy,r) {
  if(!collide(entity.x+dx,entity.y,r)) entity.x+=dx;
  if(!collide(entity.x,entity.y+dy,r)) entity.y+=dy;
}
function line(a,b,allowTarget=false) {
  const samples = Math.ceil(dist(a,b)/5);
  const target=allowTarget?cell(b.x,b.y):-2;
  for(let j=1;j<samples;j++) {
    const i=cell(a.x+(b.x-a.x)*j/samples,a.y+(b.y-a.y)*j/samples);
    if(i!==target && isSolid(i)) return false;
  }
  return true;
}
function findPath(a,b) {
  const start=cell(a.x,a.y), end=cell(b.x,b.y);
  if(start<0 || isSolid(end) || start===end) return [];
  const seen=new Int16Array(COLS*ROWS).fill(-1), todo=[start];
  seen[start]=start;
  for(let q=0;q<todo.length && seen[end]===-1;q++) {
    const at=todo[q], x=at%COLS,y=Math.floor(at/COLS);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nxt=square(x+dx,y+dy);
      if(isSolid(nxt)||seen[nxt]!==-1) continue;
      seen[nxt]=at;todo.push(nxt);
    }
  }
  if(seen[end]===-1) return [];
  const path=[];
  for(let at=end;at!==start;at=seen[at]) path.push({x:center(at%COLS),y:center(Math.floor(at/COLS))});
  return path.reverse();
}
function boot() {
  const seed=state.seed[0]^Math.imul(state.day,0x9e3779b1);
  site=makeSite(seed);
  player=createPlayer(state.choice);
  cam={x:player.x-W/2,y:player.y-H*.58};
  elapsed=0;warning=0;uiTime=0;messageUntil=0;
}
function createPlayer(choice) {
  const stamina=choice===0?120:100;
  return {...site.dock,sx:-1,sy:-1,vx:0,vy:0,phase:0,moved:false,running:false,stamina,max:stamina,carry:[],cooldown:0,boost:0,brace:0,scan:0,stun:0,petrify:0,sprintLocked:false,ax:0,ay:-1,slot:0,grip:null,detectorCooldown:0,recover:0,swing:null,guarding:false,down:false};
}
function playTone(freq=425,duration=.08,vol=.03) {
  if(!state.sound || !audio || audio.state!=='running') return;
  const wave=audio.createOscillator(), amp=audio.createGain(), t=audio.currentTime;
  wave.type='square';wave.frequency.value=freq;
  amp.gain.setValueAtTime(vol,t);amp.gain.exponentialRampToValueAtTime(.001,t+duration);
  wave.connect(amp).connect(audio.destination);wave.start();wave.stop(t+duration);
}
function say(msg,level=false,seconds=3.4) {
  $('message').textContent=msg;
  $('message').classList.toggle('danger',level);
  messageUntil=elapsed+seconds;
}
function docking() { return site.floor[cell(player.x,player.y)]===1 && player.y>=site.dock.y-39; }
function heavy() { return player.carry.some(obj=>obj.type===5); }
function nearby(list,radius=31,allowTarget=false) {
  return [...list].filter(o=>dist(player,o)<=radius && line(player,o,allowTarget)).sort((a,b)=>dist(player,a)-dist(player,b))[0];
}
function nearCargo() { return nearby(site.cargo.filter(o=>o.where==='floor'&&shown(o))); }
function nearDoor() { return nearby(site.doors.values(),31,true); }
function loadCargo() {
  for(const item of player.carry) {item.where='loaded';site.loaded.push(item);}
  const n=player.carry.length;player.carry.length=0;player.grip=null;
  say(n+'개를 적재했습니다. 확정 수율은 정산에서 공개됩니다.');
  playTone(590);
}
function interact() {
  if(player.stun>0) return;
  if(docking()&&player.carry.length) {loadCargo();return;}
  const d=nearDoor();
  if(d) {
    if(heavy()) {say('양손 화물을 내려놓아야 문을 조작할 수 있습니다.');return;}
    if(d.open && [player,...site.enemies].some(actor=>dist(actor,d)<17)) {say('문턱이 비어야 닫을 수 있습니다.');return;}
    d.open=!d.open;
    if(d.security) d.registered=true;
    say(d.open?'문을 열었습니다.':'문을 닫았습니다.');playTone(d.open?300:190);return;
  }
  say('조작할 대상이 가까이 없습니다.');
}
function heldCargo() {
  return player.carry.find(item=>item.slot===player.slot || item.type===5);
}
function aimAt(x,y) {
  const dx=x-player.x,dy=y-player.y,n=Math.hypot(dx,dy);
  if(n<3) return;
  player.ax=dx/n;player.ay=dy/n;
  if(Math.abs(dx)>2) player.sx=Math.sign(dx);
  if(Math.abs(dy)>2) player.sy=Math.sign(dy);
}
function changeSlot(step) {
  if(state.mode!=='active' || heavy() || player.grip) return;
  player.slot=(player.slot+step+2)%2;
  refresh();
}
function detection() {
  if(player.stun || player.detectorCooldown>0) return;
  const signals=site.cargo.filter(o=>o.where==='floor' && dist(player,o)<=120 && line(player,o));
  for(const item of signals) {item.signalUntil=elapsed+3;item.known=true;}
  player.detectorCooldown=2;
  say('방호복 콘세타닐 감지기 · 주변 반응 '+signals.length+'개');
  playTone(signals.length?720:370,.12);
}
function gripStart() {
  if(state.mode!=='active'||player.stun||player.grip||player.guarding) return;
  const held=heldCargo();
  if(held) {player.grip={held,start:elapsed};return;}
  const item=nearCargo();
  if(!item) {say('주울 화물이 가까이 없습니다.');return;}
  if(item.type===5 && player.carry.length) {say('양손 화물을 들려면 두 칸을 비우세요.');return;}
  item.where='carry';
  item.slot=player.slot;
  player.carry.push(item);
  say(item.name+' 회수 · '+item.weight+'kg');playTone(495);
}
function drop(byEnemy=false, strength=0) {
  const item=heldCargo()??(byEnemy?player.carry[0]:null);
  if(!item) return;
  player.carry.splice(player.carry.indexOf(item),1);
  item.x=player.x;item.y=player.y;
  item.where=strength>0?'air':'floor';
  if(strength>0) {
    const speed=(86+strength*135)/(item.type===5?1.6:1);
    item.flight={vx:player.ax*speed,vy:player.ay*speed,time:.48};
  }
  if(!byEnemy) {say(item.name+(strength>0?' 던짐':' 내려놓음'));playTone(185);}
}
function gripEnd() {
  const grip=player.grip;
  player.grip=null;
  if(state.mode!=='active'||!grip||player.stun||heldCargo()!==grip.held) return;
  const time=elapsed-grip.start;
  drop(false,time>=.24?bounded((time-.24)/.66,.01,1):0);
}
function moveCargo(dt) {
  for(const item of site.cargo) {
    if(item.where!=='air') continue;
    const {vx,vy}=item.flight;
    const step=Math.min(dt,item.flight.time);
    const slices=Math.max(1,Math.ceil(Math.hypot(vx,vy)*step/2));
    for(let i=0;i<slices;i++) {
      const x=item.x+vx*step/slices,y=item.y+vy*step/slices;
      if(collide(x,y,3)) {item.flight.time=0;break;}
      item.x=x;item.y=y;
    }
    item.flight.time-=step;
    if(item.flight.time<=0) {
      item.where='floor';item.flight=null;
      if(!site.decoy || site.decoy.time<2) site.decoy={x:item.x,y:item.y,time:2};
    }
  }
}
function inFront(target,threshold) {
  const dx=target.x-player.x,dy=target.y-player.y,n=Math.hypot(dx,dy);
  return n===0||(dx*player.ax+dy*player.ay)/n>=threshold;
}
function attack() {
  if(state.mode!=='active'||player.stun||player.swing||player.guarding) return;
  const tired=player.stamina<12;
  player.stamina=Math.max(0,player.stamina-12);
  const duration=tired?.84:.42;
  player.recover=elapsed+.65;
  player.swing={time:duration,duration,hit:false,ax:player.ax,ay:player.ay};
  playTone(tired?154:235,.06);
}
function progressAttack(dt) {
  const swing=player.swing;
  if(!swing) return;
  swing.time-=dt;
  if(!swing.hit&&swing.time<=swing.duration*.55) {
    swing.hit=true;
    const target=site.enemies.filter(o=>{
      const n=dist(player,o);
      return n>0&&n<=34&&((o.x-player.x)*swing.ax+(o.y-player.y)*swing.ay)/n>=.52&&line(player,o);
    }).sort((a,b)=>dist(player,a)-dist(player,b))[0];
    if(target) {
      target.recoil=target.kind==='statue'?.45:.65;
      slide(target,swing.ax*7,swing.ay*7,4);
      playTone(135,.1);
    }
  }
  if(swing.time<=0) player.swing=null;
}
function guardBreak() {
  player.guarding=false;
  player.stun=.5;
  player.grip=null;
  player.recover=elapsed+.65;
  say('방어 성공 · 스태미나 고갈로 0.5초 경직',true);
}
function startGuard() {
  if(state.mode!=='active'||player.stun||player.swing||player.guarding) return;
  player.stamina=Math.max(0,player.stamina-6);
  player.guarding=true;
  player.grip=null;
}
function tryBlock(enemy) {
  if(!player.guarding||!inFront(enemy,.25)) return false;
  if(player.stamina===0) guardBreak();
  return true;
}
function updateActions(dt) {
  progressAttack(dt);
  player.detectorCooldown=Math.max(0,player.detectorCooldown-dt);
  if(player.stun) player.grip=null;
  if(player.guarding) {
    player.recover=elapsed+.65;
    player.stamina=Math.max(0,player.stamina-17*dt);
  }
}
function ability() {
  if(player.stun>0 || player.scan>0) return;
  const c=state.choice;
  if(player.cooldown>0) {say('재사용 대기 '+Math.ceil(player.cooldown)+'초');return;}
  if(c===0||c===1||c===5) {say(crew[c][2]+' · 출격 내내 적용됩니다.');return;}
  if(c===2) {
    if(heavy()) {say('양손 화물을 먼저 내려놓으세요.');return;}
    const d=[...site.doors.values()].find(o=>o.security&&o.registered&&!o.open);
    if(!d) {say('등록한 닫힌 보안문이 없습니다.');return;}
    d.open=true;player.cooldown=60;say('등록된 코어실 보안문을 해제했습니다.');
  } else if(c===3) {
    const marker={x:player.x+player.ax*32,y:player.y+player.ay*32,time:6};
    site.decoy=!isSolid(cell(marker.x,marker.y))&&line(player,marker)?marker:{x:player.x,y:player.y,time:6};
    player.cooldown=45;say('소리 미끼 가동 · 6초');
  } else if(c===4) {
    if(player.boost>0) return;
    if(!player.running||heavy()) {say('일반 달리기 중에만 가속할 수 있습니다.');return;}
    player.boost=4;say('2단 달리기 가동 · 최대 4초');
  } else if(c===6) {
    player.brace=4;player.cooldown=45;say('자세 고정 · 4초');
  } else if(c===7) {
    if(heavy()) {say('양손 화물을 먼저 내려놓으세요.');return;}
    player.scan=2;say('일괄 감정 중 · 이동하면 취소');
  }
  playTone(760,.12);
}
function input() {
  for(const k of [...keys].reverse()) if(dirKeys[k]) return dirKeys[k];
  return [0,0];
}
function updatePlayer(dt) {
  player.stun=Math.max(0,player.stun-dt);
  player.cooldown=Math.max(0,player.cooldown-dt);player.brace=Math.max(0,player.brace-dt);
  let [dx,dy]=input();
  if(player.stun) dx=dy=0;
  const moved=dx!==0 || dy!==0, weight=player.carry.reduce((sum,o)=>sum+o.weight,0)*(state.choice===5?.75:1);
  if(player.stamina<=1) player.sprintLocked=true;
  if(!keys.has('shift')&&player.stamina>=12) player.sprintLocked=false;
  const sprint=moved&&keys.has('shift')&&!player.sprintLocked&&!player.guarding;
  if(player.boost>0) {
    player.boost-=dt;
    if(player.boost<=0||!sprint||heavy()) {player.boost=0;player.cooldown=8;}
  }
  const pace=(sprint?107:65)*(player.boost>0?1.3:1)*Math.max(.51,1-weight*.022)*(1-.28*bounded(player.petrify/2.2,0,1))*(player.guarding?.55:1);
  const blend=1-Math.exp(-dt*(moved?20:30));
  player.vx+=(dx*pace-player.vx)*blend; player.vy+=(dy*pace-player.vy)*blend;
  if(player.stun) player.vx=player.vy=0;
  if(!moved&&Math.hypot(player.vx,player.vy)<.15) player.vx=player.vy=0;
  const beforeX=player.x,beforeY=player.y;
  const sub=Math.max(1,Math.ceil(Math.hypot(player.vx,player.vy)*dt/3));
  for(let i=0;i<sub;i++) slide(player,player.vx*dt/sub,player.vy*dt/sub,5);
  const delta=Math.hypot(player.x-beforeX,player.y-beforeY);
  player.moved=delta>.045;player.running=player.moved&&sprint;
  player.phase+=delta;
  player.stamina=bounded(player.stamina+(player.running?-(16+weight*.6)*(player.boost>0?2:1):elapsed>=player.recover&&!player.guarding?14:0)*dt,0,player.max);
  updateActions(dt);
  if(player.scan>0) {
    if(moved||player.stun>0) {player.scan=0;say('일괄 감정이 취소되었습니다.');}
    else {
      player.scan-=dt;
      if(player.scan<=0) {
        const scan=site.cargo.filter(o=>o.where==='floor'&&dist(player,o)<=100&&line(player,o)).sort((a,b)=>dist(player,a)-dist(player,b)).slice(0,3);
        scan.forEach(o=>{o.known=true;});player.cooldown=35;say('일괄 감정 완료 · '+scan.length+'개');playTone(680);
      }
    }
  }
}
function runEnemy(enemy,dt) {
  if(enemy.recoil>0) {enemy.recoil-=dt;return;}
  const manager=enemy.kind==='manager', range=dist(player,enemy), seen=range<(manager?136:107)&&line(enemy,player)&&!docking();
  enemy.wait=Math.max(0,enemy.wait-dt);
  let aim;
  if(manager) {
    if(seen&&player.carry.length&&enemy.wait===0) enemy.mode='chase';
    if(enemy.mode==='chase'&&(!player.carry.length||docking()||range>210)) enemy.mode='patrol';
    if(enemy.mode==='chase'&&range<15&&line(enemy,player)) {
      if(tryBlock(enemy)) {if(player.guarding) say('화물 잡아당기기를 막았습니다.');playTone(320);}
      else if(player.brace>0) {player.brace=0;say('자세 고정으로 화물을 지켰습니다.');}
      else {drop(true);player.stun=1.15;say('창고 관리자가 화물을 떨어뜨렸습니다.',true);playTone(120,.26);}
      enemy.mode='patrol';enemy.wait=4;
    }
    if(enemy.mode==='chase') aim=player;
    else if(site.decoy&&dist(enemy,site.decoy)<175) aim=site.decoy;
  } else {
    if(enemy.mode==='dormant' && seen) {enemy.mode='carving';enemy.wait=3.8;say('바닥을 긁는 소리. 조각상이 움직이기 시작합니다.',true,4.2);playTone(115,.28);}
    if(enemy.mode==='carving'&&enemy.wait===0) enemy.mode='chase';
    if(enemy.mode==='dormant'||enemy.mode==='carving') return;
    if(seen || (enemy.mode==='chase'&&range<165&&!docking())) {enemy.mode='chase';aim=player;} else enemy.mode='patrol';
    if(range<14&&!docking()&&line(enemy,player)&&!tryBlock(enemy)) {
      if(player.petrify===0) say('석화 진행. 조각상과 거리를 벌리세요.',true);
      player.petrify+=dt;
      if(player.petrify>=2.2) {player.down=true;player.guarding=false;player.grip=null;while(player.carry.length) drop(true);say('석화 · 현장 이탈',true,60);return;}
    } else player.petrify=Math.max(0,player.petrify-dt*.38);
  }
  if(!aim) {
    aim=enemy.route[enemy.stop];
    if(dist(enemy,aim)<3) {enemy.stop=(enemy.stop+1)%enemy.route.length;aim=enemy.route[enemy.stop];}
  }
  if(dist(enemy,aim)<1) return;
  let next=aim;
  if(!line(enemy,aim)) {
    if((enemy.step-=dt)<=0) {enemy.path=findPath(enemy,aim);enemy.step=.45;}
    if(enemy.path.length&&dist(enemy,enemy.path[0])<3) enemy.path.shift();
    next=enemy.path[0];
    if(!next) return;
  } else {enemy.path=[];enemy.step=0;}
  const length=dist(enemy,next), pace=manager?(enemy.mode==='chase'?76:34):(enemy.mode==='chase'?62:23);
  if(length>0) slide(enemy,(next.x-enemy.x)*Math.min(pace*dt,length)/length,(next.y-enemy.y)*Math.min(pace*dt,length)/length,4);
}
