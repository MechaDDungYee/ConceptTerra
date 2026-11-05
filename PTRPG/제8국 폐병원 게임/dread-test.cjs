const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({console});
vm.runInContext(['data','documents','expansion','engine','combat-data','combat'].map(f=>fs.readFileSync(__dirname+'/web/'+f+'.js','utf8')).join('\n')+'\nglobalThis.E=HospitalEngine;globalThis.D=HospitalData;',ctx);
const {E,D}=ctx;let count=0;
const test=(name,fn)=>{fn();count++;console.log('PASS',name);};
function choose(s,part,rng=()=>.01){const i=D.scenes[s.scene].choices.findIndex(c=>c.label.includes(part));assert.ok(i>=0,part);return E.choose(s,i,rng);}
test('every branch, failure destination and evidence document resolves',()=>{
 for(const sc of Object.values(D.scenes))for(const c of sc.choices){assert.ok(D.scenes[c.next]);if(c.failureNext)assert.ok(D.scenes[c.failureNext]);if(c.note)assert.ok(D.notes[c.note]);}
});
test('all seven corporate records are acquired, readable and non-farmable',()=>{
 for(const [scene,part,id] of [['consent','정산 봉투','settlement'],['medical_store','투여표','dosing'],['withdrawal_archive','철회 요청','withdrawal'],['office_records','본사 사고','disposal'],['number_archive','대조표','conversion'],['isolation_office','점검도','isolation'],['rooftop','회수 통지','suppression']]){
  const s=E.create();s.scene=scene;const r=choose(s,part);assert.ok(s.notes.includes(id));assert.ok(r.rewards.some(x=>x.id===id&&x.kind==='note'));assert.equal(E.readNote(s,id),true);assert.ok(D.notes[id].text.length>100);s.scene=scene;assert.equal(choose(s,part).message,'지금은 선택할 수 없습니다.');assert.equal(s.notes.filter(n=>n===id).length,1);
 }
});
test('three costly hazards spend items once per traversal and never go negative',()=>{
 for(const [scene,part,id,cost,next] of [['broken_stairs','붕대 2개','bandage',2,'dragon_hall'],['contaminated_passage','치료 가방 1개','medkit',1,'bright_hall'],['roof_lock','식량 2개','food',2,'rooftop']]){
  const s=E.create();s.scene=scene;s.inventory[id]=cost;choose(s,part);assert.equal(s.scene,next);assert.equal(s.inventory[id],0);s.scene=scene;assert.equal(choose(s,part).message,'지금은 선택할 수 없습니다.');assert.equal(s.inventory[id],0);
 }
});
test('failed traversal injures party and cannot silently advance',()=>{
 const s=E.create();s.scene='broken_stairs';s.notes.push('isolation');const hp=s.party.map(p=>p.hp);const r=choose(s,'고정한다',()=>.999);assert.equal(r.roll.result,'fail');assert.equal(s.scene,'broken_stairs');s.party.forEach((p,i)=>assert.equal(p.hp,hp[i]-10));
 choose(s,'배터리');assert.equal(s.scene,'sixth');
});
test('blueprint improves displayed and actual threshold, but is not guaranteed',()=>{
 const s=E.create();const c=D.scenes.broken_stairs.choices[0];assert.equal(E.disabled(s,c),true);s.notes.push('isolation');const expected=E.choiceCheck(s,c,()=>.999).threshold;s.scene='broken_stairs';assert.equal(choose(s,'고정한다',()=>.999).roll.threshold,expected);assert.ok(expected<100);
});
test('no supplies still allows an injurious passage or retreat at each gate',()=>{
 for(const [scene,part,next] of [['broken_stairs','맨손','dragon_hall'],['contaminated_passage','숨을 참으며','bright_hall'],['roof_lock','다친 손','rooftop']]){const s=E.create();s.scene=scene;s.inventory={food:0,medkit:0,bandage:0};const before=s.party[0].hp;choose(s,part);assert.equal(s.scene,next);assert.ok(s.party[0].hp<before);}
});
test('lethal hazards preserve defeat instead of moving into another scene',()=>{
 const s=E.create();s.scene='roof_lock';s.party.forEach(p=>{p.hp=1;});choose(s,'다친 손',()=>.01);assert.equal(s.ending,'lost');assert.equal(s.scene,'roof_lock');
});
test('upper enemies are tougher in actual rank battles',()=>{
 const s=E.create();s.scene='dragon_hall';choose(s,' 용과 싸운'.trim());assert.equal(s.battle.system,'ranks');assert.ok(s.battle.enemies.some(e=>e.max>=372));
});
test('old serialized saves still open new branches and acquired records',()=>{
 const s=JSON.parse(JSON.stringify(E.create()));s.scene='fourth';E.upgrade(s);choose(s,'점검실');assert.equal(s.scene,'isolation_office');choose(s,'점검도');assert.equal(E.readNote(s,'isolation'),true);
});
console.log(`${count} dread tests passed.`);
