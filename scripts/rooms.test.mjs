import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
import {localDb} from './local-db.mjs';

test('separate sessions, host-only assignments, four players plus one GM', async () => {
  const DB = localDb();
  async function call(path, input, cookie) {
    const headers = cookie ? {Cookie:cookie} : {};
    const init = input === undefined ? {headers} : {method:'POST',headers,body:JSON.stringify(input)};
    const r = await worker.fetch(new Request('https://table.test'+path,init),{DB});
    return {status:r.status, data:await r.json(), cookie:r.headers.get('Set-Cookie')?.split(';')[0]};
  }
  const host = await call('/api/rooms',{name:'방장',title:'안개 도시'});
  assert.equal(host.status,200);
  const room = '/api/rooms/'+host.data.code;
  assert.equal((await call(room)).data.invitation,true);
  const guests = await Promise.all(Array.from({length:5},(_,i)=>call(room+'/join',{name:'손님 '+i,seat:0,owner:true})));
  assert.equal(guests.every(g=>g.data.members.find(m=>m.id===g.data.me).seat===null),true);
  assert.equal((await call(room+'/seat',{id:guests[0].data.me,seat:1},guests[0].cookie)).status,403);
  const claim = await Promise.all(guests.slice(0,2).map(g=>call(room+'/seat',{id:g.data.me,seat:1},host.cookie)));
  assert.deepEqual(claim.map(x=>x.status).sort(),[200,409]);
  const winner = guests[claim.findIndex(result => result.status === 200)];
  await call(room+"/seat",{id:winner.data.me,seat:null},host.cookie);
  for (const [i,g] of guests.entries()) {
    if (i < 4) assert.equal((await call(room+'/seat',{id:g.data.me,seat:i+1},host.cookie)).status,200);
  }
  assert.equal((await call(room+'/seat',{id:guests[4].data.me,seat:0},host.cookie)).status,409);
  await call(room+'/seat',{id:host.data.me,seat:null},host.cookie);
  await call(room+'/seat',{id:guests[4].data.me,seat:0},host.cookie);
  const state = await call(room,undefined,guests[1].cookie);
  assert.equal(state.status,200, JSON.stringify(state));
  assert.ok(state.data.members, JSON.stringify(state));
  assert.equal(state.data.members.filter(m=>m.seat>0).length,4);
  assert.equal(state.data.members.find(m=>m.seat===0).id,guests[4].data.me);
  assert.equal((await call(room+'/seat',{id:host.data.me,seat:0},guests[4].cookie)).status,403);
  assert.equal((await call(room+'/leave',{},guests[1].cookie)).status,200);
  assert.equal((await call(room,undefined,guests[1].cookie)).data.invitation,true);
  assert.equal((await call(room,undefined,host.cookie)).data.ownerId,host.data.me);
});
