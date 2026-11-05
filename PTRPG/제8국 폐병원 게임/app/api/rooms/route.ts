import {env} from 'cloudflare:workers';
import {createRoom,joinRoom,command,view,RoomError} from '../../../lib/room.js';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('');}
const key=()=>Array.from(crypto.getRandomValues(new Uint8Array(24))).map(n=>n.toString(16).padStart(2,'0')).join('');
async function load(code:string){if(!/^[A-F0-9]{12}$/.test(code))throw new RoomError('방 코드를 확인하세요.');const row=await env.DB!.prepare('SELECT body, revision FROM rooms WHERE code = ? AND expires > ?').bind(code,Date.now()).first<{body:string,revision:number}>();if(!row)throw new RoomError('없거나 만료된 방입니다.',404);return {room:JSON.parse(row.body),revision:row.revision};}
function authorize(room:any,id:string){if(!room.members.some((m:any)=>m.id===id))throw new RoomError('방에서 나왔거나 참가 권한이 없습니다.',403);}
export async function GET(req:Request){try{const code=new URL(req.url).searchParams.get('code')||'',token=req.headers.get('Authorization')?.replace(/^Bearer /,'')||'';if(!/^[a-f0-9]{48}$/.test(token))throw new RoomError('방에 참가하세요.',401);const id=await digest(token),{room,revision}=await load(code);authorize(room,id);return json({code,revision,room:view(room),id});}catch(e){return error(e);}}
export async function POST(req:Request){try{
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)throw new RoomError('허용되지 않은 출처입니다.',403);
 if(Number(req.headers.get('content-length'))>10000)throw new RoomError('요청이 너무 큽니다.',413);
 const raw=await req.text();if(raw.length>10000)throw new RoomError('요청이 너무 큽니다.',413);const body=JSON.parse(raw);
 if(['create','join'].includes(body.type)){
  await env.DB!.batch([env.DB!.prepare('DELETE FROM rooms WHERE expires < ?').bind(Date.now()),env.DB!.prepare('DELETE FROM room_limits WHERE expires < ?').bind(Date.now())]);
  const ip=await digest((req.headers.get('cf-connecting-ip')||'local')+':'+Math.floor(Date.now()/3600000));
  const quota=await env.DB!.prepare('INSERT INTO room_limits (id, count, expires) VALUES (?, 1, ?) ON CONFLICT(id) DO UPDATE SET count = count + 1 RETURNING count').bind(ip,Date.now()+3600000).first<{count:number}>();if(!quota||quota.count>30)throw new RoomError('방 생성·참가 요청이 너무 많습니다. 잠시 후 시도하세요.',429);
 }
 if(body.type==='create'){
  const token=key(),id=await digest(token),room=createRoom(id,body.name),code=key().slice(0,12).toUpperCase();
  await env.DB!.prepare('INSERT INTO rooms(code,body,revision,expires) VALUES(?,?,0,?)').bind(code,JSON.stringify(room),Date.now()+86400000).run();
  return json({code,token,id,revision:0,room:view(room)});
 }
 const {room,revision}=await load(body.code);
 if(body.type==='join'){
  const token=key(),id=await digest(token);joinRoom(room,id,body.name);
  const result=await env.DB!.prepare('UPDATE rooms SET body=?, revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(room),body.code,revision).run();if(!result.meta.changes)throw new RoomError('다른 참가자가 먼저 들어왔습니다. 다시 참가하세요.',409);
  return json({code:body.code,token,id,revision:revision+1,room:view(room)});
 }
 const token=req.headers.get('Authorization')?.replace(/^Bearer /,'')||'';if(!/^[a-f0-9]{48}$/.test(token))throw new RoomError('방 참가 권한이 없습니다.',401);const id=await digest(token);authorize(room,id);
 if(typeof body.requestId!=='string'||body.requestId.length>80)throw new RoomError('요청 번호가 없습니다.');
 if(room.receipts.some((r:any)=>r.id===id&&r.request===body.requestId))return json({code:body.code,id,revision,room:view(room),duplicate:true});
 if(body.revision!==revision)return json({error:'다른 참가자의 선택이 먼저 처리되었습니다. 최신 상태를 확인하세요.',code:body.code,id,revision,room:view(room)},409);
 const result=command(room,id,body.action);room.receipts.push({id,request:body.requestId});room.receipts=room.receipts.slice(-60);
 const update=await env.DB!.prepare('UPDATE rooms SET body=?, revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(room),body.code,revision).run();if(!update.meta.changes)throw new RoomError('다른 선택이 먼저 처리되었습니다. 다시 확인하세요.',409);
 return json({code:body.code,id,revision:revision+1,room:view(room),result});
 }catch(e){return error(e);}}
function error(e:unknown){if(e instanceof RoomError)return json({error:e.message},e.status);if(e instanceof SyntaxError)return json({error:'요청 형식을 확인하세요.'},400);console.error('Room operation failed',e instanceof Error?e.message:'unknown');return json({error:'서버 연결을 확인하고 다시 시도하세요.'},503);}
