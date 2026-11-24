'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const os=require('node:os');

const root=__dirname;
const core=fs.readFileSync(path.join(root,'public/core.js'),'utf8');
const assets=new Map(Object.entries({
  '/':['public/index.html','text/html; charset=utf-8'],
  '/core.js':['public/core.js','text/javascript; charset=utf-8'],
  '/view.js':['public/view.js','text/javascript; charset=utf-8'],
  '/client.js':['public/client.js','text/javascript; charset=utf-8'],
  '/atlas.png':['public/atlas.png','image/png']
}).map(([url,[file,type]])=>[url,{body:fs.readFileSync(path.join(root,file)),type}]));
const rooms=new Map(), sessions=new Map();
const token=()=>crypto.randomBytes(24).toString('hex');
const roomCode=()=>crypto.randomBytes(4).toString('hex').toUpperCase();
const bridge=new vm.Script(core+`
  const HALF_VIEW=Math.PI*55/180;
  function shown(o) {
    return dist(player,o)<=(state.choice===1?222:148)&&inFront(o,Math.cos(HALF_VIEW))&&line(player,o);
  }
  function refresh() {}
  const peers=new Map();
  let balance=0,result='';
  function select(peer) {player=peer.player;state.choice=peer.choice;}
  function start() {
    boot();
    state.mode='active';result='';
    let offset=-18;
    for(const peer of peers.values()) {
      peer.player=createPlayer(peer.choice);
      peer.player.x+=offset;offset+=12;
      peer.input={keys:[],ax:0,ay:-1};peer.events.length=0;
      peer.notice='Q 감지 · F 줍기 · E 함선 적재';
      peer.until=12;
    }
  }
  function end(reason) {
    if(state.mode!=='active') return;
    const value=site.loaded.reduce((sum,item)=>sum+item.value,0);
    state.total+=value;balance+=value;result=reason;
    state.mode='report';
    for(const peer of peers.values()) {
      peer.ready=false;peer.events.length=0;
      peer.player.grip=null;peer.player.guarding=false;
    }
  }
  function next() {
    if(state.mode!=='report') return;
    if(state.day===3) {state.day=1;state.total=0;crypto.getRandomValues(state.seed);}
    else state.day++;
    state.mode='brief';
  }
  function execute(name) {
    if(name==='cancel') {player.grip=null;player.guarding=false;return;}
    if(player.down) return;
    if(name==='r') return;
    if(name==='e') interact();
    if(name==='f') gripStart();
    if(name==='release') gripEnd();
    if(name==='q') detection();
    if(name==='g') ability();
    if(name==='attack') attack();
    if(name==='guard') startGuard();
    if(name==='unguard') player.guarding=false;
    if(name==='slot') changeSlot(1);
  }
  function withPeer(peer,action) {
    select(peer);el.textContent=peer.notice;messageUntil=peer.until;
    action();
    peer.notice=el.textContent;peer.until=messageUntil;
  }
  function tick(dt,host) {
    if(state.mode!=='active') return;
    elapsed+=dt;
    if(elapsed>=SHIFT) {end('22:00 함선 자동 이륙');return;}
    const mins=420+Math.floor(elapsed*900/SHIFT);
    const alarm=mins>=1290?2:mins>=1200?1:0;
    if(alarm>warning) {
      warning=alarm;
      for(const peer of peers.values()) {peer.notice=warning===2?'21:30 · 최종 철수 경보':'20:00 · 함선으로 철수하세요.';peer.until=elapsed+8;}
    }
    if(site.decoy&&(site.decoy.time-=dt)<=0) site.decoy=null;
    moveCargo(dt);
    for(const peer of peers.values()) {
      withPeer(peer,()=>{
        if(elapsed>=messageUntil) el.textContent='Q 감지 · F 줍기 · E 상호작용';
        keys.clear();
        if(player.down) return;
        for(const k of peer.input.keys) keys.add(k);
        aimAt(player.x+peer.input.ax*100,player.y+peer.input.ay*100);
        for(const event of peer.events.splice(0)) {
          if(event==='r'&&peer.id===host) {
            if(docking()&&!player.stun) {end('함선 귀환');return;}
            say('함선 적재선에 들어가면 이륙할 수 있습니다.');
          } else execute(event);
        }
        updatePlayer(dt);
      });
      if(state.mode!=='active') return;
    }
    for(const enemy of site.enemies) {
      const targets=[...peers.values()].filter(p=>!p.player.down);
      if(!targets.length) {end('전원 현장 이탈');return;}
      const target=targets.sort((a,b)=>{
        const cost=p=>dist(enemy,p.player)+(line(enemy,p.player)?0:180)+(enemy.kind==='manager'&&!p.player.carry.length?110:0);
        return cost(a)-cost(b);
      })[0];
      withPeer(target,()=>runEnemy(enemy,dt));
    }
    if([...peers.values()].every(p=>p.player.down)) end('전원 현장 이탈');
  }
  function snapshot(id,host,code) {
    const peer=peers.get(id);
    const packet={mode:state.mode,day:state.day,host,code,id,result,crew:[...peers.values()].map(p=>({id:p.id,name:p.name,choice:p.choice,ready:p.ready}))};
    if(state.mode==='brief') return packet;
    select(peer);
    const ship=docking()&&!player.down;
    const phase=state.seed[0]+'-'+state.day;
    return {...packet,phase,seed:state.seed[0],elapsed,notice:peer.notice,ship,
      shipInfo:ship?{balance,total:state.total,quota:QUOTA,loaded:site.loaded.length}:null,
      player,doors:[...site.doors.values()],cargo:site.cargo.filter(o=>o.where==='floor'||o.where==='air'),
      enemies:site.enemies.map(({kind,x,y,mode})=>({kind,x,y,mode})),decoy:site.decoy,
      others:[...peers.values()].filter(p=>p.id!==id).map(p=>{
        const {x,y,sx,sy,phase,moved,down}=p.player;
        return {id:p.id,name:p.name,choice:p.choice,x,y,sx,sy,phase,moved,down,peer:true};
      })};
  }
  function remove(id) {
    const peer=peers.get(id);
    if(state.mode==='active'&&peer.player) {
      select(peer);
      while(player.carry.length) drop(true);
    }
    peers.delete(id);
  }
  ({peers,state,start,next,tick,snapshot,remove});
`);

function createRoom(){
  const el={textContent:'',width:480,height:300,getContext:()=>({}),classList:{toggle(){}}};
  const game=bridge.runInNewContext({
    document:{getElementById:()=>el},
    crypto:{getRandomValues:a=>{a[0]=crypto.randomBytes(4).readUInt32LE();return a;}},
    el, Image:class {}
  });
  const code=roomCode(), room={code,game,host:null};
  rooms.set(code,room);
  return room;
}
function send(res,code,data) {
  res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}
async function read(req) {
  let size=0;const chunks=[];
  for await(const chunk of req) {
    size+=chunk.length;
    if(size>4096) throw Error('요청이 너무 큽니다.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}
function publish(room) {
  for(const peer of room.game.peers.values()) {
    if(peer.stream&&!peer.stream.writableEnded) {
      if(peer.stream.writableLength>131072) {peer.stream.end();continue;}
      peer.stream.write('data: '+JSON.stringify(room.game.snapshot(peer.id,room.host,room.code))+'\n\n');
    }
  }
}
function eject(room,peer) {
  if(peer.stream) peer.stream.end();
  room.game.remove(peer.id);sessions.delete(peer.secret);
  if(!room.game.peers.size) rooms.delete(room.code);
  else if(room.host===peer.id) room.host=room.game.peers.keys().next().value;
}
const directionKeys=new Set(['w','a','s','d','shift','arrowup','arrowdown','arrowleft','arrowright']);
const commands=new Set(['e','f','release','q','g','r','attack','guard','unguard','slot','cancel']);
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(req.method==='GET'&&assets.has(url.pathname)) {
      const a=assets.get(url.pathname);
      res.writeHead(200,{'Content-Type':a.type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(a.body);return;
    }
    if(req.method==='GET'&&url.pathname==='/stream') {
      const session=sessions.get(url.searchParams.get('token'));
      if(!session) {send(res,404,{error:'방에 다시 참가하세요.'});return;}
      const {peer,room}=session;
      if(peer.stream) peer.stream.end();
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','X-Accel-Buffering':'no'});
      res.flushHeaders();peer.stream=res;peer.seen=Date.now();
      res.on('close',()=>{if(peer.stream===res) {peer.stream=null;peer.input.keys=[];peer.events=['cancel'];}});
      publish(room);return;
    }
    if(req.method!=='POST'||!['/join','/action'].includes(url.pathname)) {send(res,404,{error:'찾을 수 없습니다.'});return;}
    const body=await read(req);
    if(!body||typeof body!=='object') {send(res,400,{error:'잘못된 요청입니다.'});return;}
    if(url.pathname==='/join') {
      const code=String(body.code??'').trim().toUpperCase();
      const room=code?rooms.get(code):rooms.size<30?createRoom():null;
      if(!room||room.game.state.mode!=='brief'||room.game.peers.size>=4) {
        send(res,409,{error:'참가할 수 없는 방입니다. 방 코드와 준비 상태를 확인하세요.'});return;
      }
      const peer={id:crypto.randomBytes(6).toString('hex'),secret:token(),name:String(body.name??'').trim().slice(0,18)||'수거원',choice:Number.isInteger(body.choice)&&body.choice>=0&&body.choice<8?body.choice:0,ready:false,seen:Date.now(),input:{keys:[],ax:0,ay:-1},events:[]};
      room.game.peers.set(peer.id,peer);room.host??=peer.id;
      sessions.set(peer.secret,{peer,room});
      send(res,200,{token:peer.secret,code:room.code,id:peer.id});return;
    }
    const session=sessions.get(body.token);
    if(!session) {send(res,404,{error:'방에 다시 참가하세요.'});return;}
    const {peer,room}=session, game=room.game;
    peer.seen=Date.now();
    if(body.kind==='leave') eject(room,peer);
    if(body.kind==='select'&&game.state.mode==='brief'&&Number.isInteger(body.choice)&&body.choice>=0&&body.choice<8) {
      peer.choice=body.choice;peer.ready=false;
    }
    if(body.kind==='ready'&&game.state.mode==='brief') peer.ready=body.ready===true;
    if(body.kind==='start'&&peer.id===room.host&&game.state.mode==='brief'&&[...game.peers.values()].every(p=>p.ready)) game.start();
    if(body.kind==='next'&&peer.id===room.host) game.next();
    if(body.kind==='input'&&game.state.mode==='active') {
      if(Array.isArray(body.keys)) peer.input.keys=body.keys.slice(0,10).filter(k=>directionKeys.has(k));
      if(Number.isFinite(body.ax)&&Number.isFinite(body.ay)) {
        const length=Math.hypot(body.ax,body.ay);
        if(length>.1&&Number.isFinite(length)) {peer.input.ax=body.ax/length;peer.input.ay=body.ay/length;}
      }
      if(Array.isArray(body.events)) peer.events.push(...body.events.slice(0,Math.max(0,32-peer.events.length)).filter(k=>commands.has(k)));
    }
    send(res,200,{ok:true});
  } catch(err) {if(!res.headersSent) send(res,400,{error:'요청을 처리할 수 없습니다.'});else res.end();}
});
let last=Date.now(), frames=0;
setInterval(()=>{
  const now=Date.now(),dt=Math.min(.075,(now-last)/1000);last=now;
  for(const room of rooms.values()) {
    for(const peer of room.game.peers.values()) {
      if(now-peer.seen>20000) eject(room,peer);
      else if(now-peer.seen>1500) {peer.input.keys=[];if(peer.player&&(peer.player.guarding||peer.player.grip))peer.events=['cancel'];}
    }
    if(!room.game.peers.size) continue;
    room.game.tick(dt,room.host);
    if(room.game.state.mode==='active'||frames%4===0) publish(room);
  }
  frames++;
},50).unref();
const port=Number(process.env.PORT||8080), host=process.env.HOST||'0.0.0.0';
server.on('error',e=>{console.error('서버를 시작할 수 없습니다: '+e.message);process.exitCode=1;});
server.listen(port,host,()=>{
  const actual=server.address().port;
  console.log('PENTA R / YouCan · http://localhost:'+actual);
  try {
    for(const list of Object.values(os.networkInterfaces())) for(const net of list??[]) {
      if(net.family==='IPv4'&&!net.internal) console.log('LAN · http://'+net.address+':'+actual);
    }
  } catch {
    console.log('LAN: 컴퓨터의 IPv4 주소에 포트 '+actual+'을 붙여 접속하세요.');
  }
});
