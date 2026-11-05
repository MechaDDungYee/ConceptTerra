import assert from 'node:assert/strict';
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:5189';
async function post(body,token){const r=await fetch(origin+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
let a=(await post({type:'create',name:'호스트'}));assert.equal(a.status,200);a=a.data;
let b=(await post({type:'join',code:a.code,name:'친구'}));assert.equal(b.status,200);b=b.data;
async function get(token){const r=await fetch(origin+'/api/rooms?code='+a.code,{headers:{Authorization:'Bearer '+token}});return {status:r.status,data:await r.json()};}
let snapshot=(await get(a.token)).data;assert.equal(snapshot.room.members.length,2);
const command=(who,action,revision=snapshot.revision,id=crypto.randomUUID())=>post({code:a.code,revision,requestId:id,action},who.token);
assert.equal((await get('0'.repeat(48))).status,403);
assert.equal((await post({code:a.code,revision:snapshot.revision,requestId:'bad',action:{type:'ready'}})).status,401);
const requestId=crypto.randomUUID();let r=await command(a,{type:'ready'},snapshot.revision,requestId);assert.equal(r.status,200);snapshot=r.data;
r=await command(a,{type:'ready'},snapshot.revision,requestId);assert.equal(r.data.duplicate,true);assert.equal(r.data.room.members[0].ready,true);
r=await command(b,{type:'ready'});assert.equal(r.status,200);snapshot=r.data;
r=await command(a,{type:'start'});assert.equal(r.status,200);snapshot=r.data;
const rev=snapshot.revision,vote={type:'vote',scene:snapshot.room.state.scene,ballot:snapshot.room.ballot,index:1};const responses=await Promise.all([command(a,vote,rev),command(b,vote,rev)]);assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);snapshot=(await get(a.token)).data;assert.equal(snapshot.room.state.scene,'ward');assert.equal(snapshot.room.state.turn,0);assert.equal(Object.keys(snapshot.room.votes).length,1);const late=responses[0].status===409?a:b;r=await command(late,vote);assert.equal(r.status,200);snapshot=r.data;assert.equal(snapshot.room.state.scene,'introduce');assert.equal(snapshot.room.state.turn,1);
r=await command(b,{type:'chat',text:'우선 문을 확인하자'});assert.equal(r.status,200);snapshot=r.data;assert.equal((await get(a.token)).data.room.chat.at(-1).text,'우선 문을 확인하자');
console.log('API passed: actual D1 room join, protected reads, replay idempotency, concurrent choices, shared state and chat.');
