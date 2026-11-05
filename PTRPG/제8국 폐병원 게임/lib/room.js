import {E,D,C} from './game.js';
export class RoomError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const fail=(m,status=400)=>{throw new RoomError(m,status);};
export function nickname(value){if(typeof value!=='string'||!value.trim()||value.trim().length>24)fail('이름은 1~24자로 입력하세요.');return value.trim();}
export function createRoom(id,name){const clean=nickname(name);return {host:id,started:false,state:E.create(clean),members:[{id,name:clean,slot:0,ready:false}],chat:[],receipts:[]};}
export function view(room){return {host:room.host,started:room.started,state:room.state,members:room.members.map(({id,name,slot,ready})=>({id,name,slot,ready})),chat:room.chat,ballot:room.ballot||0,votes:room.votes||{},pendingRoll:room.pendingRoll||null,rollerVotes:room.rollerVotes||{}};}
export function joinRoom(room,id,name){if(room.started)fail('이미 시작한 방입니다. 기존 참가자는 재접속할 수 있습니다.');if(room.members.length>=4)fail('방이 가득 찼습니다.');const slot=[0,1,2,3].find(n=>!room.members.some(m=>m.slot===n));const clean=nickname(name);room.state.party[slot].name=clean;room.members.push({id,name:clean,slot,ready:false});}
export function command(room,id,action){
 if(!action||typeof action!=='object'||typeof action.type!=='string')fail('요청 형식을 확인하세요.');
 const member=room.members.find(m=>m.id===id);if(!member)fail('방 참가 권한이 없습니다.',403);
 const s=room.state,host=room.host===id;
 room.ballot??=0;room.votes??={};
 const controls=slot=>Number.isInteger(slot)&&slot>=0&&slot<4&&(room.members.find(m=>m.slot===slot)?.id===id||host&&!room.members.some(m=>m.slot===slot));
 const acting=()=>{const turn=C.current(s);if(!s.battle||turn?.side!=='ally'||!controls(turn.id))fail('해당 참가자의 차례가 아닙니다.',403);s.actor=turn.id;return turn;};
if(action.type==='chat'){const text=nicknameText(action.text);if(Date.now()-(member.lastChat||0)<800)fail('메시지를 잠시 후 보내세요.',429);member.lastChat=Date.now();room.chat.push({id:crypto.randomUUID(),name:member.name,sender:id,text,time:Date.now()});room.chat=room.chat.slice(-60);return {};}
if(action.type==='leave'){room.members=room.members.filter(m=>m.id!==id);if(host)room.host=room.members[0]?.id||null;room.votes={};room.pendingRoll=null;room.rollerVotes={};room.ballot++;return {};}
 if(action.type==='kick'){if(!host||action.id===id)fail('방장만 다른 참가자를 내보낼 수 있습니다.',403);room.members=room.members.filter(m=>m.id!==action.id);room.votes={};room.pendingRoll=null;room.rollerVotes={};room.ballot++;return {};}
 if(action.type==='configure'){
  if(room.started)fail('시작 후에는 캐릭터를 바꿀 수 없습니다.');
  let created;try{created=E.create(nickname(action.name),action.values,action.traits);}catch(e){fail(e.message);}const p=created.party[0];p.id=member.slot;p.role='플레이어 참가자';p.color=s.party[member.slot].color;p.row=s.party[member.slot].row;s.party[member.slot]=p;member.name=p.name;member.ready=false;return {};
 }
 if(action.type==='ready'){if(room.started)fail('이미 시작했습니다.');member.ready=!member.ready;return {};}
 if(action.type==='start'){if(!host)fail('방장만 시작할 수 있습니다.',403);if(room.started)fail('이미 시작했습니다.');if(room.members.some(m=>!m.ready))fail('모든 참가자가 준비해야 합니다.');room.started=true;return {};}
 if(!room.started)fail('먼저 준비한 뒤 게임을 시작하세요.');
 if(s.ending)fail('종료된 여정입니다.');
 if(action.type==='reset-roll'){
  if(!room.pendingRoll||action.scene!==s.scene||action.ballot!==room.ballot)fail('담당자 선택이 이미 끝났습니다.',409);
  room.pendingRoll=null;room.rollerVotes={};room.votes={};room.ballot++;return {};
 }
 if(action.type==='roller-vote'){
  const pending=room.pendingRoll;
  if(!pending||s.battle||action.scene!==s.scene||action.ballot!==room.ballot)fail('담당자 선택 상황이 바뀌었습니다.',409);
  if(!Number.isInteger(action.slot)||!s.party[action.slot]||!E.active(s.party[action.slot]))fail('판정할 수 없는 캐릭터입니다.');
  assertChoice(s,pending.index);room.rollerVotes??={};room.rollerVotes[id]=action.slot;
  if(!room.members.every(m=>room.rollerVotes[m.id]===action.slot))return {waiting:true};
  s.actor=action.slot;const result=E.choose(s,pending.index);room.pendingRoll=null;room.rollerVotes={};room.votes={};room.ballot++;return {...result,unanimous:true};
 }
 if(action.type==='vote'||action.type==='choose'){
  if(s.battle)fail('전투 중입니다.');
  if(room.pendingRoll)fail('현재는 판정 담당자를 선택하는 단계입니다.');
  if(action.scene!==s.scene||action.ballot!==room.ballot)fail('선택 상황이 바뀌었습니다. 현재 선택지를 다시 확인하세요.',409);
  const choice=assertChoice(s,action.index);
  room.votes[id]=action.index;
  if(!room.members.every(m=>room.votes[m.id]===action.index))return {waiting:true};
  if(choice.stat||choice.search){room.pendingRoll={index:action.index,scene:s.scene};room.rollerVotes={};return {selectRoller:true};}
  const actor=room.members.find(m=>m.id===room.host&&E.active(s.party[m.slot]))||room.members.find(m=>E.active(s.party[m.slot]));
  if(!actor)fail('판정할 수 있는 참가자가 없습니다.');s.actor=actor.slot;
  const result=E.choose(s,action.index);room.votes={};room.ballot++;return {...result,unanimous:true};
 }
 if(action.type==='plan'){const turn=acting();if(action.skill===null){delete s.battle.plans[turn.id];return {}; }if(!E.plan(s,turn.id,action.skill,action.target))fail('행동 또는 대상 위치를 확인하세요.');return {};}
 if(action.type==='advance'){
  if(!s.battle)fail('전투가 없습니다.');const turn=C.current(s);
  if(turn?.side==='ally'){if(!controls(turn.id))fail('해당 참가자의 차례가 아닙니다.',403);const key=`${s.battle.round}:ally:${turn.id}`;if(s.battle.started===key&&E.active(s.party[turn.id])&&!s.party[turn.id].stun&&!s.battle.plans[turn.id])fail('행동과 대상을 먼저 선택하세요.');}
  else if(!host)fail('자동 진행은 방장이 관리합니다.',403);
  return {events:C.advance(s)};
 }
 if(action.type==='flee'){const turn=acting(),r=E.flee(s);if(!r.escaped&&s.battle){C.plan(s,turn.id,'wait',turn.id);r.events=C.advance(s);}return r;}
 if(action.type==='use'){if(s.battle)fail('전투에서는 응급 처치 행동을 사용하세요.');s.actor=member.slot;if(!Number.isInteger(action.target)||!s.party[action.target]||!E.useItem(s,action.item,action.target))fail('이 상태에서는 사용할 수 없습니다.');return {};}
 if(action.type==='grow'){if(!controls(action.slot)||!E.grow(s,action.slot,action.stat))fail('성장 조건이나 캐릭터 권한을 확인하세요.');return {};}
 if(action.type==='trait'){if(!controls(action.slot))fail('다른 참가자의 특성은 사용할 수 없습니다.',403);if(!E.traitAbility(s,action.slot,action.mode,action.arg))fail('지금 사용할 수 없는 특성입니다.');return {};}
 fail('알 수 없는 요청입니다.');
}
function nicknameText(value){if(typeof value!=='string'||!value.trim()||value.trim().length>400)fail('메시지는 1~400자로 입력하세요.');return value.trim();}
function assertChoice(s,index){const scene=D.scenes[s.scene],choice=scene.choices[index];if(!Number.isInteger(index)||!choice)fail('없는 선택지입니다.');if(E.disabled(s,choice)||choice.search&&s.searched.includes(choice.searchKey||String(scene.floor))||choice.rest&&(s.rests.includes(scene.floor)||!s.inventory.food))fail('지금 선택할 수 없습니다.');return choice;}
