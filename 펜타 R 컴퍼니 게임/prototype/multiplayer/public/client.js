'use strict';
let session=null, stream=null, packet=null, others=[], phase=null, goal=null;
let selected=0, pending=[], busy=false, lobbyBusy=false, disconnected=false;
const set=(id,value)=>{$(id).textContent=value;};
const allowed=new Set(['w','a','s','d','shift','arrowup','arrowdown','arrowleft','arrowright']);
const actions=new Set(['e','f','q','g','r']);
async function post(path,body) {
  const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(4000)});
  const data=await res.json();
  if(!res.ok) throw Error(data.error||'서버 요청에 실패했습니다.');
  return data;
}
async function request(kind,data={}) {
  if(!session) return;
  try {return await post('/action',{token:session.token,kind,...data});}
  catch(e) {set('lobbyStatus',e.message);connection(e.message);}
}
function connection(text) {set('connection',text);$('connection').hidden=!text;}
function choiceUI() {
  [...$('crew').children].forEach((b,i)=>b.setAttribute('aria-pressed',selected===i));
  set('ability',crew[selected][2]+' · '+crew[selected][3]);
}
function lobbyUI() {
  const inRoom=!!session;
  $('entry').hidden=inRoom;$('roomPanel').hidden=!inRoom;
  set('roomCode',inRoom?'방 '+session.code:'YOUCAN');
  if(!inRoom||!packet) {choiceUI();return;}
  const me=packet.crew.find(p=>p.id===session.id);
  if(me) selected=me.choice;
  choiceUI();
  $('roster').replaceChildren(...packet.crew.map(p=>{
    const li=document.createElement('li');
    li.textContent=p.name+' · '+crew[p.choice][1]+' · '+(p.ready?'준비 완료':'대기')+(p.id===packet.host?' · 방장':'');
    return li;
  }));
  set('ready',me?.ready?'준비 취소':'준비');
  $('start').hidden=packet.host!==session.id;
  $('start').disabled=!packet.crew.every(p=>p.ready);
}
async function enter(create) {
  if(lobbyBusy||session) return;
  const code=create?'':$('joinCode').value.trim();
  if(!create&&!code) {set('lobbyStatus','방 코드를 입력하세요.');return;}
  lobbyBusy=true;
  $('create').disabled=$('join').disabled=true;
  try {
    session=await post('/join',{code,name:$('nickname').value,choice:selected});
    lobbyUI();set('lobbyStatus','');
    stream=new EventSource('/stream?token='+session.token);
    stream.onmessage=e=>{disconnected=false;connection('');accept(JSON.parse(e.data));};
    stream.onerror=()=>{disconnected=true;keys.clear();pending.length=0;connection('서버 연결을 다시 시도하고 있습니다.');};
  } catch(e) {set('lobbyStatus',e.message);}
  finally {lobbyBusy=false;$('create').disabled=$('join').disabled=false;}
}
function leave() {
  if(session) request('leave');
  if(stream) stream.close();
  session=null;stream=null;packet=null;phase=null;goal=null;others=[];
  state.mode='brief';keys.clear();pending=[];connection('');set('lobbyStatus','');
  $('lobby').hidden=false;$('hud').hidden=$('report').hidden=true;
  lobbyUI();
}
function accept(next) {
  const prev=state.mode;
  packet=next;
  state.mode=next.mode;
  $('lobby').hidden=next.mode!=='brief';
  $('hud').hidden=next.mode!=='active';
  $('report').hidden=next.mode!=='report';
  if(next.mode==='brief') {lobbyUI();return;}
  state.day=next.day;state.choice=next.crew.find(p=>p.id===next.id).choice;
  elapsed=next.elapsed;
  if(phase!==next.phase) {
    phase=next.phase;
    site=makeSite(next.seed^Math.imul(state.day,0x9e3779b1));
    player=next.player;pointer.active=false;keys.clear();pending=[];
    cam={x:player.x-W/2,y:player.y-H*.58};
    canvas.focus();
  }
  goal={x:next.player.x,y:next.player.y};
  const position={x:player.x,y:player.y};
  const aim=pointer.active?{ax:player.ax,ay:player.ay,sx:player.sx,sy:player.sy}:{};
  Object.assign(player,next.player,position,aim);
  const oldPeers=new Map(others.map(o=>[o.id,o]));
  others=next.others.map(o=>({...o,renderX:oldPeers.get(o.id)?.renderX??o.x,renderY:oldPeers.get(o.id)?.renderY??o.y}));
  site.cargo=next.cargo;site.enemies=next.enemies;site.decoy=next.decoy;
  for(const d of next.doors) Object.assign(site.doors.get(cell(d.x,d.y)),d);
  if(next.mode==='report') {
    set('result',next.result+(session.id===next.host?'':' · 방장이 다음 출격을 준비합니다.'));
    const settlement=next.shipInfo;
    $('shipReport').hidden=!settlement;
    if(settlement) set('shipReport','함선 정산 · 보유 금액 '+settlement.balance+' C · 할당량 '+settlement.total+' / '+settlement.quota);
    $('next').hidden=session.id!==next.host;
    $('ship').hidden=true;
    if(prev!=='report') {keys.clear();pending.length=0;}
  } else updateHUD(next);
}
function updateHUD(next) {
  $('ship').hidden=!next.shipInfo;
  if(next.shipInfo) {
    const info=next.shipInfo, mins=Math.floor(420+elapsed*900/SHIFT);
    set('clock','DAY '+next.day+' · '+format(Math.floor(mins/60))+':'+format(mins%60));
    set('money','보유 금액 '+info.balance+' C');
    set('quota','할당량 '+info.total+' / '+info.quota);
    set('loaded','적재 화물 '+info.loaded+'개');
  }
  for(let i=0;i<2;i++) {
    const node=$('slot'+i), item=player.carry.find(x=>x.slot===i);
    node.textContent=(i+1)+' · '+(item?item.name:heavy()?'양손 사용 중':'빈 칸');
    node.classList.toggle('selected',i===player.slot);
  }
  const charge=$('charge');
  charge.hidden=!player.grip;
  charge.value=player.grip?bounded((elapsed-player.grip.start)/.9,0,1):0;
  set('message',player.stun>0?'경직 '+player.stun.toFixed(1)+'초':player.down?'현장 이탈 · 다음 브리핑 대기':next.notice);
}
function resize() {
  const ratio=window.innerWidth/Math.max(window.innerHeight,1);
  H=300;W=Math.max(166,Math.round(H*ratio));
  canvas.width=W;canvas.height=H;
  ctx.imageSmoothingEnabled=false;
}
function point(e) {
  const r=canvas.getBoundingClientRect();
  pointer.x=(e.clientX-r.left)*W/r.width;
  pointer.y=(e.clientY-r.top)*H/r.height;pointer.active=true;
  if(player&&cam) aimAt(pointer.x+cam.x,pointer.y+cam.y);
}
function queue(event) {if(state.mode==='active'&&pending.length<24) pending.push(event);}
function keyName(e) {return /^Key[A-Z]$/.test(e.code)?e.code[3].toLowerCase():e.key.toLowerCase();}
window.addEventListener('keydown',e=>{
  const k=keyName(e);
  if(state.mode!=='active'||(!allowed.has(k)&&!actions.has(k))) return;
  e.preventDefault();
  if(e.repeat) return;
  if(allowed.has(k)) keys.add(k);else queue(k);
});
window.addEventListener('keyup',e=>{const k=keyName(e);keys.delete(k);if(k==='f')queue('release');});
window.addEventListener('blur',()=>{keys.clear();pending.length=0;queue('cancel');});
canvas.addEventListener('pointermove',point);
canvas.addEventListener('pointerdown',e=>{point(e);if(e.button===0)queue('attack');if(e.button===2)queue('guard');});
window.addEventListener('pointerup',e=>{if(e.button===2)queue('unguard');});
window.addEventListener('pointercancel',()=>queue('cancel'));
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{if(state.mode==='active'&&e.deltaY){e.preventDefault();queue('slot');}},{passive:false});
setInterval(async()=>{
  if(!session||!packet||busy||state.mode!=='active'||disconnected) return;
  busy=true;
  try {await request('input',{keys:[...keys],ax:player.ax,ay:player.ay,events:pending.splice(0)});}
  finally {busy=false;}
},45);
setInterval(()=>{if(session&&state.mode!=='active')request('ping');},4000);
window.addEventListener('pagehide',()=>{
  if(session) navigator.sendBeacon('/action',JSON.stringify({token:session.token,kind:'leave'}));
});
$('fullscreen').onclick=async()=>{
  try {if(document.fullscreenElement) await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch {connection('브라우저에서 전체 화면을 허용하세요.');}
};
document.addEventListener('fullscreenchange',()=>{set('fullscreen',document.fullscreenElement?'전체 화면 해제':'전체 화면');resize();});
window.addEventListener('resize',resize);
$('create').onclick=()=>enter(true);$('join').onclick=()=>enter(false);
$('leave').onclick=$('reportLeave').onclick=leave;
$('ready').onclick=()=>{const me=packet?.crew.find(p=>p.id===session?.id);if(me)request('ready',{ready:!me.ready});};
$('start').onclick=()=>request('start');$('next').onclick=()=>request('next');
for(let i=0;i<crew.length;i++) {
  const button=document.createElement('button'), portrait=document.createElement('canvas');
  button.className='choice';portrait.width=44;portrait.height=48;
  const label=document.createElement('span');label.textContent=crew[i][1];button.append(portrait,label);
  const paint=()=>portrait.getContext('2d').drawImage(atlas,88,i*48,44,48,0,0,44,48);
  if(atlas.complete&&atlas.naturalWidth) paint();else atlas.addEventListener('load',paint,{once:true});
  button.onclick=()=>{selected=i;choiceUI();if(session)request('select',{choice:i});};
  $('crew').append(button);
}
function frame(now) {
  const dt=timeLast?Math.min(.05,(now-timeLast)/1000):0;timeLast=now;
  if(goal&&state.mode!=='brief') {
    const blend=1-Math.exp(-dt*23);
    player.x+=(goal.x-player.x)*blend;player.y+=(goal.y-player.y)*blend;
    for(const o of others) {o.renderX+=(o.x-o.renderX)*blend;o.renderY+=(o.y-o.renderY)*blend;}
    const follow=1-Math.exp(-dt*9);
    cam.x+=(player.x-W/2-cam.x)*follow;cam.y+=(player.y-H*.58-cam.y)*follow;
    if(pointer.active) aimAt(pointer.x+cam.x,pointer.y+cam.y);
    draw(now);
  }
  requestAnimationFrame(frame);
}
choiceUI();resize();requestAnimationFrame(frame);
