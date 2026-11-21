import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../dist/server/index.js';
import {localDb} from './local-db.mjs';

async function fixture(){
  const DB=localDb();
  async function send(path,body,cookie){
    const headers=cookie?{Cookie:cookie}:{};
    const r=await worker.fetch(new Request('https://game.test'+path,{headers,...(body?{method:'POST',body:JSON.stringify(body)}:{})}),{DB});
    return {status:r.status,body:await r.json(),cookie:r.headers.getSetCookie().map(header=>header.split(';')[0]).join('; ')||undefined};
  }
  const host=await send('/api/rooms',{title:'빈 객차',name:'방장'});
  const room='/api/rooms/'+host.body.code;
  const endpoint=room+'/game';
  let state=(await send(endpoint,undefined,host.cookie)).body;
  return {room,host,endpoint,send,DB, get state(){return state;},async act(action,payload={}){
    const r=await send(endpoint,{action,revision:state.revision,collectionRevision:state.collectionRevision,...payload},host.cookie);
    assert.equal(r.status,200,JSON.stringify(r.body));
    state=r.body;
    return state;
  }};
}

test('a saved collection follows the browser into a new room and the exact deck starts battle',async()=>{
  const f=await fixture();
  const card={name:'여행자 표식',power:'0',target:'self',range:'0',role:'normal',effects:[]};
  await f.act('card',{card});
  const id=f.state.profile.cards[0].id;
  const deck=[id,id,id,'strike','strike','guard','guard','hold','shot','rush'];
  const save=cards=>f.send(f.endpoint,{action:'deck',cards,collectionRevision:f.state.collectionRevision},f.host.cookie);
  assert.equal((await save(deck.slice(1))).status,400);
  assert.equal((await save([id,...deck.slice(0,9)])).status,400);
  await f.act('deck',{cards:deck});
  assert.equal(f.state.profile.deckSaved,true);
  const reloaded=await f.send(f.endpoint,undefined,f.host.cookie);
  assert.deepEqual(reloaded.body.profile.deck,deck);
  const created=await f.send('/api/rooms',{title:'다음 방',name:'방장'},f.host.cookie);
  const nextRoom='/api/rooms/'+created.body.code+'/game';
  const next=await f.send(nextRoom,undefined,created.cookie);
  assert.deepEqual(next.body.profile.deck,deck);
  assert.equal(next.body.profile.cards[0].name,card.name);
  const start=await f.send(nextRoom,{action:'start',revision:next.body.revision,solo:true,bots:0},created.cookie);
  assert.equal(start.status,200);
  const saved=f.DB.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(created.body.code).first();
  const unit=JSON.parse(saved.state).battle.units[next.body.me];
  assert.deepEqual([...unit.hand,...unit.deck].sort(),[...deck].sort());
  const unrelated=await f.send('/api/rooms',{title:'다른 브라우저',name:'방장'});
  const other=await f.send('/api/rooms/'+unrelated.body.code+'/game',undefined,unrelated.cookie);
  assert.deepEqual(other.body.profile.cards,[]);
  assert.equal(other.body.profile.deck.length,10);
});

test('planning events apply once at resolution and a marked card spends its mark on use',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'표식 카드',power:'0',role:'normal',range:'0',target:'self',effects:[
    {kind:'markCard',when:'decide',to:'self',amount:5},
    {kind:'shield',when:'confirm',to:'self',amount:2}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{self.hand=[id];b.units.enemy.blockedRounds=1;});
  await f.act('plan',{card:id,targets:[]});
  await f.act('unplan');
  assert.equal(livingForm(f).hp,100);
  await f.act('plan',{card:id,targets:[]});
  await f.act('round');
  assert.equal(livingForm(f).hp,97);
  assert.equal(livingForm(f).cardMarks[id],undefined);
});

test('cards trigger their own destination and draw events on real zone entry',async()=>{
  for(const [effect,zone] of [[null,'toGrave'],['topdeck','toDeck'],['exile','toExile'],['return','toHand']]){
    const f=await fixture();
    const effects=[{kind:'mind',when:zone,to:'self',amount:5},{kind:'mind',when:'cardDrawn',to:'self',amount:3}];
    if(effect)effects.push({kind:effect,when:'end',to:'self',amount:1});
    await f.act('card',{card:{name:'더미 이동 카드',power:'0',role:'normal',range:'0',target:'self',effects}});
    const id=f.state.profile.cards[0].id;
    await f.act('start',{solo:true,bots:0});
    configureBattle(f,(b,self)=>{
      Object.assign(self,{hand:[id],deck:['strike','strike','strike',id],mind:50});
      b.units.enemy.blockedRounds=1;
    });
    await f.act('plan',{card:id,targets:[]});
    await f.act('round');
    assert.equal(livingForm(f).mind,zone==='toDeck'?61:58,zone);
  }
});

test('passive and character files round-trip artwork and remap referenced cards',async()=>{
  const f=await fixture();
  await f.act('profile',{name:'승객',country:'제4국',status:'하위층 시민',stats:[50,50,50,50,50,50]});
  await f.act('art',{slot:'normal.idle',image:'data:image/png;base64,AAAA'});
  await f.act('card',{card:{name:'참조 카드',power:'0',role:'normal',range:'0',target:'self',effects:[]}});
  const id=f.state.profile.cards[0].id;
  await f.act('passive',{passive:{name:'카드 지급',effects:[{kind:'giveCard',when:'turnStart',to:'self',amount:1,givenCardId:id}]}});
  const portable=(await f.send(f.endpoint,{action:'passiveExport'},f.host.cookie)).body;
  const character=(await f.send(f.endpoint,{action:'characterExport'},f.host.cookie)).body;
  assert.equal(portable.cards[0].id,id);
  assert.equal(character.character.art['normal.idle'],'data:image/png;base64,AAAA');
  await f.act('passiveImport',{file:portable});
  assert.equal(f.state.profile.passives[1].enabled,false);
  assert.equal(f.state.profile.passives[1].effects[0].givenCardId,f.state.profile.passiveCards[0].id);
  assert.notEqual(f.state.profile.passiveCards[0].id,id);
  await f.act('characterImport',{file:character});
  assert.equal(f.state.profile.name,'승객');
  assert.deepEqual(f.state.profile.artSlots,['normal.idle']);
  assert.equal(f.state.profile.passives.length,1);
  assert.equal(f.state.profile.passives[0].enabled,true);
});

test('local accounts make characters and cards in a private studio for use in another room',async()=>{
  const f=await fixture();
  const account='/api/account/characters',password='test-only-password';
  const alice=(await f.send('/api/account/register',{username:'alice',password})).cookie;
  const bob=(await f.send('/api/account/register',{username:'bob',password})).cookie;
  assert.ok(alice&&bob);
  assert.equal((await f.send('/api/account/login',{username:'alice',password:'test-wrong-password'})).status,401);
  const login=await f.send('/api/account/login',{username:'alice',password});
  assert.equal(login.status,200);
  const studio='/api/studio';
  assert.equal((await f.send(studio)).status,401);
  assert.equal((await f.send(studio,{action:'start',revision:0},alice)).status,400);
  let draft=(await f.send(studio,undefined,alice)).body;
  const edit=async(action,payload={})=>{
    const r=await f.send(studio,{action,revision:draft.revision,collectionRevision:draft.collectionRevision,...payload},alice);
    assert.equal(r.status,200,JSON.stringify(r.body));
    draft=r.body;
  };
  const save=(id,characterRevision,cookie=alice)=>f.send(studio,{
    action:'characterAccountSave',revision:draft.revision,id,characterRevision
  },cookie);
  const sheet=name=>edit('profile',{name,country:'제4국',status:'하위층 시민',stats:[50,50,50,50,50,50]});
  assert.equal((await f.send(account)).body.signedIn,false);
  await sheet('첫 번째 승객');
  assert.equal((await save()).status,200);
  await sheet('두 번째 승객');
  assert.equal((await save()).status,200);
  await edit('card',{card:{name:'제작실 카드',power:'0',role:'normal',target:'self',range:'0',effects:[]}});
  const {characters}= (await f.send(account,undefined,alice)).body;
  assert.equal(characters.length,2);
  assert.deepEqual((await f.send(account,undefined,bob)).body.characters,[]);
  const first=characters.find(character=>character.name==='첫 번째 승객');
  const created=await f.send('/api/rooms',{name:'여행자',title:'다른 방'});
  const endpoint='/api/rooms/'+created.body.code+'/game';
  const selection={action:'characterAccountSelect',id:first.id,revision:0};
  assert.equal((await f.send(endpoint,selection,created.cookie+'; '+bob)).status,404);
  const selected=await f.send(endpoint,selection,created.cookie+'; '+alice);
  assert.equal(selected.status,200);
  assert.equal(selected.body.profile.name,'첫 번째 승객');
  assert.equal(selected.body.profile.accountCharacterId,first.id);
  assert.equal(selected.body.profile.cards[0].name,'제작실 카드');
  const privateRoom=f.DB.prepare('SELECT studio_code FROM local_accounts WHERE username = ?').bind('alice').first().studio_code;
  assert.equal((await f.send('/api/rooms/'+privateRoom,undefined,bob)).status,404);
  assert.equal((await f.send('/api/account/logout',{},login.cookie)).status,200);
  assert.equal((await f.send(studio,undefined,login.cookie)).status,401);
});

test('mid-battle edits only enter live combat after GM approval',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'승객'},null);
  await f.send(f.room+'/seat',{id:guest.body.me,seat:1},f.host.cookie);
  await f.act('start',{solo:false,bots:0});
  const old=(await f.send(f.endpoint,undefined,guest.cookie)).body;
  const profile=await f.send(f.endpoint,{action:'profile',revision:old.revision,name:'승인된 이름',country:'제4국',
    status:'하위층 시민',stats:[50,50,50,50,50,50]},guest.cookie);
  assert.equal(profile.status,200);
  assert.equal(profile.body.battle.units.find(unit=>unit.id===guest.body.me).name,'승객');
  const card=await f.send(f.endpoint,{action:'card',collectionRevision:profile.body.collectionRevision,
    card:{name:'전투 중 제작',power:'1',range:'0',role:'normal',target:'self',effects:[]}},guest.cookie);
  assert.equal(card.status,200);
  const cardId=card.body.profile.cards[0].id;
  const savedDeck=await f.send(f.endpoint,{action:'deck',collectionRevision:card.body.collectionRevision,
    cards:[cardId,'strike','strike','guard','guard','hold','hold','shot','shot','rush']},guest.cookie);
  assert.equal(savedDeck.status,200);
  const request=await f.send(f.endpoint,{action:'requestEdit',revision:profile.body.revision},guest.cookie);
  assert.equal(request.status,200);
  const id=request.body.pendingEdits[0].id;
  const approval={action:'reviewEdit',revision:request.body.revision,id,approve:true};
  assert.equal((await f.send(f.endpoint,approval,guest.cookie)).status,403);
  const approved=await f.send(f.endpoint,approval,f.host.cookie);
  assert.equal(approved.status,200);
  assert.equal(approved.body.battle.units.find(unit=>unit.id===guest.body.me).name,'승인된 이름');
  const battle=JSON.parse(f.DB.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(f.host.body.code).first().state).battle;
  assert.equal(battle.units[guest.body.me].library[cardId].name,'전투 중 제작');
  assert.ok(battle.units[guest.body.me].deck.includes(cardId));
  assert.deepEqual(approved.body.pendingEdits,[]);
});

test('card start effects trigger once per card type and base effects spend their own cost',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'체력 계산',power:'0',role:'normal',target:'self',range:'0',effects:[
    {kind:'shield',when:'battleStart',to:'self',amount:2},
    {kind:'shield',when:'turnStart',to:'self',amount:3},
    {kind:'shield',when:'base',to:'self',amount:50,amountMode:'percent',healthBasis:'missing'},
    {kind:'mind',when:'use',to:'self',amount:2,scaleResource:'health',scaleCost:{mode:'percent',amount:25,healthBasis:'current'}},
    {kind:'shield',when:'use',to:'self',amount:1,scaleResource:'health',scaleCost:{mode:'fixed',amount:2}}
  ]}});
  const id=f.state.profile.cards[0].id;
  assert.deepEqual(f.state.profile.cards[0].effects[3].scaleCost,{mode:'percent',amount:25,healthBasis:'current'});
  await f.act('deck',{cards:[id,id,id,'strike','hold','trace','shot','guard','draw','rush']});
  await f.act('start',{solo:true,bots:0});
  assert.equal(livingForm(f).shield,5);
  configureBattle(f,(b,self)=>{
    self.hp=24;
    self.hand=[id,'hold','guard','strike'];
    b.intent={...b.intent,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{card:id});
  await f.act('round');
  const self=livingForm(f);
  assert.equal(self.hp,16);
  assert.equal(self.shield,48); // 5 start + 38 lost-HP base + 2 paid-health bonus + 3 next turn.
  assert.equal(self.mind,62);
});

test('attack end follows the replay only once, and turn end also fires on a turn without an attack',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'공격 종료 시험',power:'4',role:'normal',target:1,range:'1~4',clash:true,effects:[
    {kind:'replay',when:'hit',to:'self',amount:1},
    {kind:'mind',when:'attackEnd',to:'self',amount:3},
    {kind:'percent',when:'attackEnd',to:'target',amount:50},
    {kind:'shield',when:'turnEnd',to:'self',amount:2}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('deck',{cards:[id,id,id,'strike','hold','trace','shot','guard','draw','rush']});
  await f.act('start',{solo:true,bots:0});
  const planRound=clash=>configureBattle(f,(b,self)=>{
    self.pos=16;
    self.hand=[id,'hold','guard','strike'];
    b.units.enemy.pos=20;
    b.intent={...b.intent,reachable:true,target:self.id,card:{...b.intent.card,power:clash?'5':'0'}};
  });
  planRound(false);
  await f.act('plan',{card:id,targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,42); // Two hits for 4 and one attack-end effect for 4.
  assert.equal(livingForm(f).mind,53);
  assert.equal(livingForm(f).shield,2);
  planRound(true);
  await f.act('plan',{card:id,targets:['enemy'],clash:true});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,42);
  assert.equal(livingForm(f).mind,53);
  assert.equal(livingForm(f).shield,2); // Enemy spent the old shield. Turn-end reapplied it.
  planRound(false);
  await f.act('plan',{});
  await f.act('round');
  assert.equal(livingForm(f).shield,4);
});

test('scoped effects reach living units outside attack range and consume their cost once',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'범위 효과 시험',power:'0',role:'normal',target:'self',range:'0',effects:[
    {kind:'shield',when:'use',to:'allAllies',amount:2,scaleResource:'health',scaleCost:{mode:'fixed',amount:2}},
    {kind:'heal',when:'use',to:'farthestAlly',amount:3},
    {kind:'mind',when:'use',to:'lowMindAlly',amount:4}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:3});
  configureBattle(f,(b,self)=>{
    self.pos=16;self.hand=[id];
    Object.assign(b.units.bot0,{pos:17,hand:[],move:0,hp:27,mind:35});
    Object.assign(b.units.bot1,{pos:33,hand:[],move:0,hp:27,mind:45});
    Object.assign(b.units.bot2,{pos:25,hand:[],move:0,hp:0});
    b.units.enemy.pos=20;
    b.intent={...b.intent,reachable:true,target:self.id,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{card:id});
  await f.act('round');
  assert.equal(livingForm(f).hp,98);
  assert.equal(livingForm(f).shield,0);
  assert.equal(livingForm(f,'bot0').shield,4);
  assert.equal(livingForm(f,'bot1').shield,4);
  assert.equal(livingForm(f,'bot2').shield,0);
  assert.equal(livingForm(f,'bot0').hp,27);
  assert.equal(livingForm(f,'bot1').hp,30);
  assert.equal(livingForm(f,'bot0').mind,39);
  assert.equal(livingForm(f,'bot1').mind,45);
});

test('effect limits are saved per effect, reset at their period, and skip unmet conditions',async()=>{
  const f=await fixture();
  const effect=(amount,period,extra={})=>({kind:'shield',when:'use',to:'self',amount,limit:{period,count:1},...extra});
  const card={name:'발동 횟수 시험',power:'0',role:'normal',target:'self',range:'0',effects:[
    effect(2,'turn'),
    effect(3,'battle',{condition:'lowHp',threshold:50}),
    effect(5,'battle')
  ]};
  await f.act('card',{card});
  const id=f.state.profile.cards[0].id;
  const bad=await f.send(f.endpoint,{action:'card',collectionRevision:f.state.collectionRevision,card:{...card,effects:[{...effect(1,'turn'),limit:{period:'turn',count:0}}]}},f.host.cookie);
  assert.equal(bad.status,400);
  assert.deepEqual((await f.send(f.endpoint,undefined,f.host.cookie)).body.profile.cards[0].effects[1].limit,{period:'battle',count:1});
  async function turn(hp){
    configureBattle(f,(b,self)=>{
      self.hp=hp;
      self.hand=[id,id];
      b.intent={...b.intent,card:{...b.intent.card,power:'0'}};
    });
    await f.act('plan',{card:id});
    await f.act('round');
    return livingForm(f).shield;
  }
  await f.act('start',{solo:true,bots:0});
  assert.equal(await turn(100),7);
  assert.equal(await turn(20),12);
  assert.equal(await turn(20),14);
  await f.act('reset');
  await f.act('start',{solo:true,bots:0});
  assert.equal(await turn(100),7);
});

test('a group spends one activation and a turn limit blocks repeated applications in the same turn',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'광역 제한 시험',power:'0',role:'normal',target:'area',range:'1~5',requiredState:'collapsed',effects:[
    {kind:'shield',when:'use',to:'self',amount:2,limit:{period:'turn',count:1}},
    {kind:'shield',when:'use',to:'allAllies',amount:3,limit:{period:'battle',count:1}}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:2});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],collapsed:true});
    Object.assign(b.units.bot0,{pos:17,hand:[],move:0});
    Object.assign(b.units.bot1,{pos:18,hand:[],move:0});
    b.units.enemy.pos=20;
    b.intent={...b.intent,reachable:true,target:self.id,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{card:id});
  await f.act('round');
  assert.equal(livingForm(f).shield,2);
  assert.equal(livingForm(f,'bot0').shield,3);
  assert.equal(livingForm(f,'bot1').shield,3);
});

test('dice formulas use six sides by default and allow explicit face counts for each hit',async()=>{
  const {parsePower}=await import('../public/rules.js');
  assert.deepEqual(parsePower('2D + 5'),{formula:'2d+5',count:2,sides:6,bonus:5});
  assert.deepEqual(parsePower('2d8+5'),{formula:'2d8+5',count:2,sides:8,bonus:5});
  assert.equal(parsePower('2d1+5'),null);
  const f=await fixture();
  await f.act('card',{card:{name:'주사위 연타',hitPowers:['2D + 5','2d2+5'],role:'normal',target:1,range:'1~4',effects:[]}});
  const card=f.state.profile.cards[0];
  assert.deepEqual(card.hitPowers,['2d+5','2d2+5']);
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    self.pos=16;self.hand=[card.id];
    b.units.enemy.pos=20;
    b.intent={...b.intent,reachable:true,target:self.id,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{card:card.id,targets:['enemy']});
  await f.act('round');
  const logs=f.state.battle.log;
  const [first,second]=logs.filter(line=>/타 위력 /.test(line)).map(line=>Number(line.match(/타 위력 (\d+)/)[1]));
  assert.ok(first>=7&&first<=17);
  assert.ok(second>=7&&second<=9);
  assert.equal(livingForm(f,'enemy').hp,54-first-second);
});

test('critical and noncritical timings dispatch to the selected hit and the whole attack',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'치명타 분기',hitPowers:['2','4'],role:'normal',target:1,range:'1~4',effects:[
    {kind:'shield',when:'critical',hitIndex:1,to:'self',amount:3},
    {kind:'shield',when:'noncritical',hitIndex:2,to:'self',amount:5},
    {kind:'mind',when:'critical',to:'self',amount:2},
    {kind:'mind',when:'noncritical',to:'self',amount:4}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  async function attack(charges){
    configureBattle(f,(b,self)=>{
      Object.assign(self,{pos:16,hand:[id],mind:50,shield:0,critCharges:charges});
      b.units.enemy.pos=20;
      b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'0'}};
    });
    await f.act('plan',{card:id,targets:['enemy']});
    await f.act('round');
  }
  await attack(1);
  assert.equal(livingForm(f).shield,8);
  assert.equal(livingForm(f).mind,52);
  await attack(0);
  assert.equal(livingForm(f).shield,5);
  assert.equal(livingForm(f).mind,54);
});

test('unopposed effects precede power and damage and only fire if the attack has no clash',async()=>{
  for(const scenario of [
    {target:1,clash:false,foe:0,damage:16},
    {target:1,clash:true,foe:9,damage:10},
    {target:1,clash:true,foe:10,damage:0},
    {target:1,clash:true,foe:11,damage:10},
    {target:'self',clash:false,foe:0,damage:0}
  ]){
    const f=await fixture();
    const {target,clash,foe,damage}=scenario;
    await f.act('card',{card:{name:'일방공격 효과 시험',power:'10',role:'normal',target,range:target===1?'1~4':'0',clash:true,unstoppable:true,effects:[
      {kind:'power',when:'unopposed',to:'self',amount:2},
      {kind:'outgoingDamage',when:'unopposed',to:'self',amount:4},
      {kind:'shield',when:'unopposed',to:'self',amount:3}
    ]}});
    const card=f.state.profile.cards[0];
    assert.equal(card.effects[1].when,'unopposed');
    await f.act('start',{solo:true,bots:0});
    configureBattle(f,(b,self)=>{
      Object.assign(self,{pos:16,hand:[card.id],mind:50});
      b.units.enemy.pos=20;
      b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:String(foe)}};
    });
    await f.act('plan',{card:card.id,targets:target===1?['enemy']:[],clash});
    await f.act('round');
    assert.equal(livingForm(f,'enemy').hp,54-damage,JSON.stringify(scenario));
    assert.equal(f.state.battle.poses.filter(p=>p.pose==='clash').length,clash?2:0);
    assert.equal(livingForm(f).shield,!clash&&target===1?3:0,JSON.stringify(scenario));
  }
});

test('clash and card hit reactions run once per event and expire after the selected rounds',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'객차의 반응',power:'1',role:'normal',target:1,range:'1~4',clash:true,effects:[
    {kind:'damage',when:'clash',to:'target',amount:2},
    {kind:'mind',when:'struck',to:'self',amount:3},
    {kind:'mind',when:'hurt',to:'self',amount:4,reactionRounds:2}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  const setup=()=>configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50,hp:50,shield:0});
    b.units.enemy.pos=20;
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'8'}};
  });
  setup();
  await f.act('plan',{card:id,targets:['enemy'],clash:true});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,52);
  assert.equal(livingForm(f).mind,57);
  setup();
  await f.act('plan',{pos:16});
  await f.act('round');
  assert.equal(livingForm(f).mind,54);
  setup();
  await f.act('plan',{pos:16});
  await f.act('round');
  assert.equal(livingForm(f).mind,50);
});

test('custom stack effects follow the holder, scale by count, and grant held critical chance',async()=>{
  const f=await fixture();
  await f.act('stackCreate',{name:'잔류'});
  await f.act('stackEdit',{name:'잔류',flavor:'문턱에 남은 기록',effects:[
    {kind:'damage',when:'turnEnd',to:'self',amount:1,scaleStack:'count'},
    {kind:'shield',when:'struck',to:'self',amount:3},
    {kind:'critChance',when:'held',to:'self',amount:50,scaleStack:'count'},
    {kind:'outgoingDamage',when:'held',to:'self',amount:1,amountMode:'fixed'}
  ]});
  await f.act('card',{card:{name:'잔류 부여',power:'4',role:'normal',target:1,range:'1~4',effects:[
    {kind:'stack',when:'use',to:'self',tag:'잔류',amount:2}
  ]}});
  assert.equal(f.state.profile.stackTraits[0].effects[0].scaleStack,'count');
  assert.equal((await f.send(f.endpoint,undefined,f.host.cookie)).body.profile.stackTraits[0].flavor,'문턱에 남은 기록');
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50,hp:50,shield:0});
    b.units.enemy.pos=20;
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'4'}};
  });
  await f.act('plan',{card:id,targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,47);
  assert.equal(livingForm(f).hp,46);
  assert.equal(livingForm(f).shield,1);
});

test('built-in stacks cap focus, boost critical damage, and resolve fixed and mental damage',async()=>{
  const f=await fixture();
  const grant=(tag,amount)=>({kind:'stack',when:'use',to:'self',tag,amount});
  await f.act('card',{card:{name:'기본 중첩 시험',power:'10',role:'normal',target:1,range:'1~4',effects:[
    grant('집중',100),grant('집중',20),grant('강타',50),grant('충격 균열',3),
    grant('잔류 손상',2),grant('신경 과민',4),grant('심상 균열',5)
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50,shield:20});
    b.units.enemy.pos=20;
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'1'}};
  });
  await f.act('plan',{card:id,targets:['enemy']});
  await f.act('round');
  const self=livingForm(f);
  assert.equal(self.stacks.집중,99);
  assert.equal(self.stacks['잔류 손상'],1);
  assert.equal(livingForm(f,'enemy').hp,34);
  assert.equal(self.hp,100);
  assert.equal(self.shield,14);
  assert.equal(self.mind,41);
});

test('fixed and shield piercing damage bypass independent defenses',async()=>{
  for(const [kind,hp,shield] of [['fixedDamage',50,0],['pierce',53,6],['piercingFixedDamage',44,6]]){
    const f=await fixture();
    await f.act('card',{card:{name:kind,power:'0',role:'normal',target:1,range:'1~4',effects:[
      {kind,when:'use',to:'target',amount:10}
    ]}});
    const id=f.state.profile.cards[0].id;
    await f.act('start',{solo:true,bots:0});
    configureBattle(f,(b,self)=>{
      Object.assign(self,{pos:16,hand:[id],mind:50});
      Object.assign(b.units.enemy,{pos:20,shield:6,reduce:8,incomingDamagePercent:-50});
    });
    await f.act('plan',{card:id,targets:['enemy']});
    await f.act('round');
    assert.equal(livingForm(f,'enemy').hp,hp,kind);
    assert.equal(livingForm(f,'enemy').shield,shield,kind);
  }
});

test('mental ward effects protect resolve and enemies can strip the protection and combat buffs',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'정신 방벽',power:'0',role:'normal',target:'self',range:'0',effects:[
    {kind:'collapseResist',when:'use',to:'self',amount:1},
    {kind:'collapseImmune',when:'use',to:'self',amount:1,duration:2},
    {kind:'mindGuard',when:'use',to:'self',amount:50,duration:2},
    {kind:'mindRegen',when:'use',to:'self',amount:3,duration:2},
    {kind:'drain',when:'use',to:'self',amount:40},
    {kind:'shield',when:'use',to:'self',amount:4},
    {kind:'critCharges',when:'use',to:'self',amount:1}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:10});
    b.units.enemy.pos=20;
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'1'}};
  });
  await f.act('plan',{card:id,targets:[]});
  await f.act('round');
  assert.equal(livingForm(f).mind,4);
  assert.equal(livingForm(f).collapseResist,1);
  assert.equal(livingForm(f).zero,null);
  configureBattle(f,(b,self)=>{
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'1',effects:
      ['clearMindBuffs','purgeDefense','purgeOffense'].map(kind=>({kind,when:'use',to:'target',amount:1}))}};
  });
  await f.act('plan',{pos:16});
  await f.act('round');
  assert.equal(livingForm(f).mind,4);
  assert.equal(livingForm(f).shield,0);
  assert.equal(livingForm(f).critCharges,undefined);
  assert.equal(livingForm(f).collapseResist,undefined);
});

test('round effects can remove existing collapse, awakening, and current or queued action locks',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'상태 해제',power:'0',role:'normal',target:'self',range:'0',effects:[
    {kind:'clearCollapse',when:'turnEnd',to:'self',amount:25},
    {kind:'clearAwakening',when:'turnEnd',to:'self',amount:1},
    {kind:'unblockAction',when:'turnEnd',to:'self',amount:1}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('deck',{cards:[id,'strike','strike','guard','guard','hold','hold','shot','shot','rush']});
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{mind:0,zero:'crisis',crisisRulesVersion:1,collapseRound:b.round,blockedRounds:2,nextBlockedRounds:2});
    b.intent.reachable=false;
  });
  await f.act('round');
  assert.equal(livingForm(f).mind,25);
  assert.equal(livingForm(f).zero,null);
  assert.equal(livingForm(f).actionLimit,1);
  configureBattle(f,(b,self)=>{
    self.awakening=true;
    b.intent.reachable=false;
  });
  await f.act('plan',{pos:livingForm(f).pos});
  await f.act('round');
  assert.equal(livingForm(f).awakening,false);
});

test('unstoppable uses the modified minimum for each hit after losing a clash',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'저지불가 시험',hitPowers:['1d+2','2d+1'],role:'normal',target:1,range:'1~4',clash:true,unstoppable:true,effects:[
    {kind:'power',when:'clash',to:'self',amount:2},
    {kind:'shield',when:'hit',hitIndex:2,to:'self',amount:3}
  ]}});
  const card=f.state.profile.cards[0];
  assert.equal(card.unstoppable,true);
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[card.id],mind:50,shield:20});
    b.units.enemy.pos=20;
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'24'}};
  });
  await f.act('plan',{card:card.id,targets:['enemy'],clash:true});
  await f.act('round');
  assert.ok(f.state.battle.log.some(line=>line.includes('저지불가 발동 · 최소 위력 8')));
  assert.deepEqual(f.state.battle.log.filter(line=>/타 위력 /.test(line)).map(line=>Number(line.match(/타 위력 (\d+)/)[1])),[4,4]);
  assert.equal(livingForm(f,'enemy').hp,46);
  assert.equal(livingForm(f).shield,3);
});

test('replayHit repeats only its own hit and effects before proceeding to the next hit',async()=>{
  const f=await fixture();
  const card={name:'타격 반복 시험',hitPowers:['2','4','7'],role:'normal',target:1,range:'1~4',effects:[
    {kind:'shield',when:'use',to:'self',amount:3},
    {kind:'replayHit',when:'hit',hitIndex:2,to:'self',amount:1},
    {kind:'shield',when:'hit',hitIndex:2,to:'self',amount:1},
    {kind:'shield',when:'hit',hitIndex:2,to:'self',amount:5,limit:{period:'turn',count:1}},
    {kind:'mind',when:'attackEnd',to:'self',amount:2}
  ]};
  const invalid=await f.send(f.endpoint,{action:'card',collectionRevision:f.state.collectionRevision,card:{
    ...card,effects:[{kind:'replayHit',when:'hit',to:'self',amount:1}]
  }},f.host.cookie);
  assert.equal(invalid.status,400);
  await f.act('card',{card});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  async function run(enemyHp){
    configureBattle(f,(b,self)=>{
      Object.assign(self,{pos:16,hand:[id],mind:50,shield:0});
      Object.assign(b.units.enemy,{pos:20,hp:enemyHp});
      b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'0'}};
    });
    await f.act('plan',{card:id,targets:['enemy']});
    await f.act('round');
  }
  await run(54);
  const logs=f.state.battle.log;
  const second=logs.findIndex(line=>line.includes('2타 재사용'));
  assert.ok(second>0&&second<logs.findIndex(line=>line.includes('3타 위력')));
  assert.equal(logs.filter(line=>line.includes('타 재사용')).length,1);
  assert.equal(livingForm(f,'enemy').hp,37);
  assert.equal(livingForm(f).shield,10);
  assert.equal(livingForm(f).mind,52);

  await run(5);
  const last=f.state.battle.log.lastIndexOf('라운드 2 처리');
  assert.ok(!f.state.battle.log.slice(last).some(line=>line.includes('타 재사용')));
  assert.equal(livingForm(f,'enemy').hp,0);
});

test('a multi-hit card sums its rolls for clashing and resolves scoped effects and critical charges in order',async()=>{
  const f=await fixture();
  const card={name:'점층격',hitPowers:['2','4','7'],role:'normal',target:1,range:'1~4',clash:true,effects:[
    {kind:'critCharges',when:'hit',hitIndex:1,to:'self',amount:1},
    {kind:'damage',when:'hit',hitIndex:3,to:'target',amount:3},
    {kind:'shield',when:'hit',to:'self',amount:2},
    {kind:'mind',when:'attackEnd',to:'self',amount:3}
  ]};
  await f.act('card',{card});
  const id=f.state.profile.cards[0].id;
  assert.deepEqual(f.state.profile.cards[0].hitPowers,['2','4','7']);
  const bad=await f.send(f.endpoint,{action:'card',collectionRevision:f.state.collectionRevision,card:{...card,effects:[{...card.effects[0],hitIndex:4}]}},f.host.cookie);
  assert.equal(bad.status,400);
  await f.act('start',{solo:true,bots:0});
  const prepare=(hp,shield,power)=>configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50,critCharges:1});
    Object.assign(b.units.enemy,{pos:20,hp,shield});
    b.intent={...b.intent,reachable:true,target:self.id,card:{...b.intent.card,power}};
  });
  prepare(54,2,'12');
  await f.act('plan',{card:id,targets:['enemy'],clash:true});
  await f.act('round');
  assert.ok(f.state.battle.log.some(line=>line.includes('13 : 12')));
  assert.deepEqual(f.state.battle.log.filter(line=>line.includes('타 위력')).map(line=>line.match(/타 위력 (\d+)/)[1]),['2','4','7']);
  assert.equal(livingForm(f,'enemy').hp,37);
  assert.equal(livingForm(f).critCharges,0);
  assert.equal(livingForm(f).shield,2);
  assert.equal(livingForm(f).mind,53);

  prepare(4,0,'0');
  await f.act('plan',{card:id,targets:['enemy']});
  await f.act('round');
  const last=f.state.battle.log.lastIndexOf('라운드 2 처리');
  assert.equal(f.state.battle.log.slice(last).filter(line=>line.includes('타 위력')).length,2);
  assert.equal(livingForm(f,'enemy').hp,0);
});

test('solo session saves profile, custom card and deck, resolves bot rounds and overload',async()=>{
  const f=await fixture();
  const p={name:'서린',country:'제2국',status:'월정커',wall:'제6국',stats:[50,50,50,50,50,50]};
  await f.act('profile',p);
  await f.act('card',{card:{name:'잉여 기록 II',power:'0',target:'self',range:'0',clash:false,role:'normal',effects:[{kind:'draw',when:'use',to:'self',amount:2}]}});
  const custom=f.state.profile.cards[0];
  await f.act('deck',{cards:[custom.id,...f.state.defaults.filter(c=>!c.optional).slice(1).map(c=>c.id),'strike','guard']});
  await f.act('start',{solo:true,bots:3});
  assert.equal(f.state.battle.units.filter(u=>u.bot&&!u.enemy).length,3);
  const me=f.state.battle.units.find(u=>u.id===f.state.me);
  assert.equal(me.name,'서린');
  assert.equal(me.hand.length,4);
  assert.ok(f.state.battle.units.filter(u=>u.id!==me.id).every(u=>u.hand===undefined));
  await f.act('plan',{pos:2});
  await f.act('round');
  assert.equal(f.state.battle.round,2);
  assert.ok(f.state.battle.log.some(line=>/회수원|호송병|기록원/.test(line)));
  if(f.state.battle.phase==='planning'){
    await f.act('adjust',{target:me.id,mind:-100});
    await f.act('round');
    assert.ok(f.state.battle.log.some(line=>line.includes('서린 폭주')));
  }
  await f.act('reset');
  assert.equal(f.state.battle,null);
});

test('players see the same battle, cannot advance it, and stale requests are rejected',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'손님'});
  await f.send(f.room+'/seat',{id:guest.body.me,seat:1},f.host.cookie);
  const joined=await f.send(f.endpoint,undefined,guest.cookie);
  assert.equal(joined.body.roster.length,1);
  await f.act('start',{bots:3});
  const g=await f.send(f.endpoint,undefined,guest.cookie);
  assert.equal(g.body.battle.round,1);
  assert.equal((await f.send(f.endpoint,{action:'round',revision:g.body.revision},guest.cookie)).status,403);
  assert.equal((await f.send(f.endpoint,{action:'plan',revision:0,pos:0},guest.cookie)).status,409);
  const submitted=await f.send(f.endpoint,{action:'plan',revision:g.body.revision,pos:0},guest.cookie);
  assert.equal(submitted.status,200);
  const h=await f.send(f.endpoint,undefined,f.host.cookie);
  const r=await f.send(f.endpoint,{action:'round',revision:h.body.revision},f.host.cookie);
  assert.equal(r.status,200);
  assert.equal((await f.send(f.endpoint,undefined,guest.cookie)).body.battle.round,2);
});

test('the prototype grid measures orthogonal distance and routes around walls', async()=>{
  const {gridDistance,gridPaths,gridDisplacement,gridInRange}=await import('../public/grid.js');
  assert.equal(gridDistance(9,18),2);
  assert.equal(gridDistance(7,8),8);
  assert.equal(gridInRange('2, 4',9,18),true);
  assert.equal(gridInRange('2, 4',9,19),false);
  assert.equal(gridPaths(10,2,new Set([11])).has(12),false);
  assert.equal(gridPaths(10,4,new Set([11])).get(12).length,4);
  assert.equal(gridDisplacement(6,7),-1);
});

test('a targeted action must be valid before it can lock the round and can be reopened',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{self.pos=16;b.units.enemy.pos=20;b.intent.reachable=true;});
  const {me,battle}=f.state;
  const unit=battle.units.find(u=>u.id===me);
  const card=unit.hand.find(c=>c.target===1&&c.role!=='guard');
  assert.ok(card);
  const attempt=async(action,payload={})=>f.send(f.endpoint,{action,revision:f.state.revision,...payload},f.host.cookie);
  assert.equal((await attempt('round')).status,400);
  assert.equal((await attempt('plan',{card:card.id,pos:18})).status,400);
  const plan={card:card.id,pos:18,targets:['enemy'],clash:card.clash&&card.role!=='assist'};
  await f.act('plan',plan);
  assert.deepEqual(f.state.battle.awaiting,[]);
  assert.deepEqual(f.state.battle.units.find(u=>u.id===me).plan.targets,['enemy']);
  await f.act('unplan');
  assert.deepEqual(f.state.battle.awaiting,[unit.name]);
  assert.equal((await attempt('round')).status,400);
  await f.act('plan',plan);
  await f.act('round');
  assert.equal(f.state.battle.round,2);
  assert.ok(f.state.battle.log.some(line=>line.includes(card.name)));
});

test('cover persists out of range and replaces only an unopposed attack',async()=>{
  for(const {power,manual,remaining,designate} of [
    {power:'4',manual:false,remaining:0},
    {power:'8',manual:false,remaining:0},
    {power:'9',manual:false,remaining:0},
    {power:'9',manual:true,remaining:1},
    {power:'9',manual:false,remaining:0,designate:'ally'},
    {power:'9',manual:false,remaining:1,designate:'other'}
  ]){
    const f=await fixture();
    const guest=await f.send(f.room+'/join',{name:'보호 대상'});
    await f.send(f.room+'/seat',{id:guest.body.me,seat:2},f.host.cookie);
    await f.send(f.room+'/seat',{id:f.state.me,seat:1},f.host.cookie);
    await f.act('start',{bots:0});
    const row=f.DB.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(f.host.body.code).first();
    const saved=JSON.parse(row.state);
    const {units,intent}=saved.battle;
    const guard=units[f.state.me], ally=units[guest.body.me];
    guard.pos=16;ally.pos=19;units.enemy.pos=22;
    if(designate==='other')units.other={...structuredClone(ally),id:'other',name:'다른 아군',pos:8,bot:true,zero:'spent'};
    intent.target=ally.id;intent.reachable=true;intent.card.power='8';
    guard.library.guard={...guard.library.guard,power,range:designate==='ally'?'1~3':'1'};
    guard.hand=['guard','strike','draw','trace'];
    guard.deck=['hold','shot','rush','burn'];
    ally.hand=['strike','hold','shot','draw'];
    ally.deck=ally.deck.filter(id=>!ally.hand.includes(id));
    f.DB.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),f.host.body.code).run();
    const guestPlan=async(payload)=>{
      const {body}=await f.send(f.endpoint,undefined,guest.cookie);
      const r=await f.send(f.endpoint,{action:'plan',revision:body.revision,...payload},guest.cookie);
      assert.equal(r.status,200,JSON.stringify(r.body));
      return r.body;
    };
    await guestPlan({pos:19});
    // Update the host fixture's revision using the same persisted state the UI polls.
    const hostAct=async(action,payload={})=>{
      const {body}=await f.send(f.endpoint,undefined,f.host.cookie);
      const r=await f.send(f.endpoint,{action,revision:body.revision,...payload},f.host.cookie);
      assert.equal(r.status,200,JSON.stringify(r.body));
      return r.body;
    };
    const targetId=designate==='ally'?ally.id:designate==='other'?'other':null;
    const {body:current}=await f.send(f.endpoint,undefined,f.host.cookie);
    const invalid=await f.send(f.endpoint,{action:'plan',revision:current.revision,card:'guard',pos:16,targets:['enemy']},f.host.cookie);
    assert.equal(invalid.status,400);
    await hostAct('plan',{card:'guard',pos:16,targets:targetId?[targetId]:[]});
    const first=await hostAct('round');
    assert.equal(first.battle.units.find(u=>u.id===guard.id).coverCount,designate==='ally'?0:1);
    assert.equal(first.battle.units.find(u=>u.id===guard.id).graveCount,1);
    assert.equal(first.battle.units.find(u=>u.id===ally.id).hp,designate==='ally'?100:92);
    if(designate==='ally'){
      assert.ok(first.battle.log.some(line=>line.includes('보호 대상 대신 합')));
      continue;
    }
    await guestPlan(manual?{card:'strike',pos:19,targets:['enemy'],clash:true}:{pos:19});
    await hostAct('plan',{pos:18});
    const second=await hostAct('round');
    assert.equal(second.battle.units.find(u=>u.id===guard.id).coverCount,remaining);
    const coverLog=second.battle.log.find(line=>line.includes('원호 방어 1 소모'));
    if(manual||designate==='other')assert.equal(coverLog,undefined);
    else{
      assert.ok(coverLog?.includes('보호 대상 대신 합'));
      assert.equal(second.battle.units.find(u=>u.id===ally.id).hp,92);
      const roll=Number(second.battle.log.find(line=>line.endsWith('(원호 방어)')).match(/ : (\d+)/)[1]);
      assert.equal(second.battle.units.find(u=>u.id===guard.id).hp,roll>power?100-roll:100);
    }
  }
});

test('new card effects save and resolve in sequence with conditions and card destinations',async()=>{
  const f=await fixture();
  const effect=(kind,when,to,amount,extra={})=>({kind,when,to,amount,...extra});
  await f.act('card',{card:{
    name:'시험 카드',power:'0',range:'1~4',role:'normal',target:1,clash:false,
    effects:[
      effect('focus','use','self',5,{condition:'highMind',threshold:50}),
      effect('pierce','hit','target',4),
      effect('poison','hit','target',3),
      effect('fortify','end','self',8),
      effect('topdeck','end','self',1)
    ]
  }});
  const custom=f.state.profile.cards[0];
  await f.act('deck',{cards:[custom.id,...f.state.defaults.filter(c=>!c.optional).slice(1).map(c=>c.id),'strike','guard']});
  await f.act('start',{solo:true,bots:0});
  const {code}=f.host.body;
  const db=f.DB;
  const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
  const {units}=saved.battle;
  const me=units[f.state.me];
  me.hand=[custom.id,'hold','shot','guard','draw'];
  me.deck=['trace','rush','burn'];
  units.enemy.shield=10;
  db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
  await f.act('plan',{card:custom.id,pos:16,targets:['enemy']});
  await f.act('round');
  const foe=f.state.battle.units.find(u=>u.enemy);
  const self=f.state.battle.units.find(u=>u.id===me.id);
  assert.equal(foe.hp,47);
  assert.equal(foe.shield,5);
  assert.equal(foe.poison,2);
  assert.equal(self.nextPower,0);
  assert.equal(self.shield,8);
  assert.equal(self.deckCount,4);
  assert.equal(self.graveCount,0);
  assert.equal(self.hand.some(c=>c.id===custom.id),false);
});

test('discard costs gate bonuses and all three copy modes add playable cards',async()=>{
  const f=await fixture();
  const effect=(kind,when,amount,extra={})=>({kind,when,amount,to:'self',...extra});
  for(const [name,rows] of [
    ['전부 버리기',[
      effect('power','use',10,{condition:'discardPaid'}),
      effect('power','use',2,{scaleDiscard:true}),
      effect('discardAllCost','use',1),
      effect('copySelf','end',1),
      effect('copyFixed','end',1,{copyId:'burn'})
    ]],
    ['대가 실패',[
      effect('discardExactCost','use',4),
      effect('power','use',10,{condition:'discardPaid'})
    ]]
  ]){
    await f.act('card',{card:{name,effects:rows,power:'0',role:'normal',target:1,range:'1~4',clash:false}});
  }
  const [paid,unpaid]=f.state.profile.cards;
  const presets=f.state.defaults.filter(c=>!c.optional).slice(0,5).map(c=>c.id);
  await f.act('deck',{cards:[paid.id,unpaid.id,'handCopy',...presets,'strike','guard']});
  await f.act('start',{solo:true,bots:0});
  const code=f.host.body.code;
  const db=f.DB;
  const writeHand=(hand)=>{
    const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
    const {units,intent}=saved.battle;
    const u=units[f.state.me];
    u.hand=hand;u.grave=[];u.deck=['draw','trace','rush','guard'];
    u.mind=50;u.pos=16;units.enemy.pos=20;units.enemy.hp=54;
    intent.card={...intent.card,power:'0'};intent.reachable=true;
    db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
  };
  const self=()=>f.state.battle.units.find(u=>u.id===f.state.me);
  const foe=()=>f.state.battle.units.find(u=>u.enemy);
  writeHand([paid.id,'hold','shot','strike']);
  await f.act('plan',{card:paid.id,pos:16,targets:['enemy']});
  await f.act('round');
  assert.equal(foe().hp,38);
  assert.ok(self().hand.some(c=>c.id===paid.id));
  assert.ok(self().hand.some(c=>c.id==='burn'));
  assert.ok(f.state.battle.log.some(line=>line.includes('대가로 손패 3장 버림')));

  writeHand([unpaid.id,'hold']);
  await f.act('plan',{card:unpaid.id,pos:16,targets:['enemy']});
  await f.act('round');
  assert.equal(foe().hp,54);
  assert.ok(self().hand.some(c=>c.id==='hold'));
  assert.ok(f.state.battle.log.some(line=>line.includes('대가 미지불')));

  writeHand(['handCopy','hold','shot','strike']);
  const action={action:'plan',revision:f.state.revision,card:'handCopy',pos:16};
  const invalid=await f.send(f.endpoint,{...action,copyId:'burn'},f.host.cookie);
  assert.equal(invalid.status,400);
  await f.act('plan',{card:'handCopy',pos:16,copyId:'hold'});
  await f.act('round');
  assert.equal(self().hand.filter(c=>c.id==='hold').length,2);
});

test('tactical effects resolve clash margins, temporary shields, retaliation, and next-round control',async()=>{
  const f=await fixture();
  const effect=(kind,when,to,amount,condition='',threshold=1)=>({kind,when,to,amount,condition,threshold});
  await f.act('card',{card:{name:'유인 작전',power:'12',role:'normal',target:1,range:'1~4',clash:true,effects:[
    effect('temporaryShield','use','self',3),
    effect('thorns','use','self',2),
    effect('expose','win','target',4,'clashMargin',3),
    effect('rootNext','hit','target',1),
    effect('provoke','end','self',1)
  ]}});
  const card=f.state.profile.cards[0];
  const others=f.state.defaults.filter(c=>!c.optional).slice(1).map(c=>c.id);
  await f.act('deck',{cards:[card.id,...others,'strike','guard']});
  await f.act('start',{solo:true,bots:0});
  const code=f.host.body.code;
  const db=f.DB;
  const configure=(round,hand)=>{
    const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
    const {units,intent}=saved.battle;
    const u=units[f.state.me];
    u.hand=hand;u.shield=5;u.pos=16;
    units.enemy.pos=20;
    intent.card={...intent.card,power:'8'};intent.reachable=true;
    db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
    assert.equal(saved.battle.round,round);
  };
  const me=()=>f.state.battle.units.find(u=>u.id===f.state.me);
  const foe=()=>f.state.battle.units.find(u=>u.enemy);
  configure(1,[card.id,'draw','guard','trace']);
  await f.act('plan',{card:card.id,pos:16,targets:['enemy'],clash:true});
  await f.act('round');
  assert.equal(foe().hp,38);
  assert.equal(foe().rooted,true);
  assert.equal(me().shield,5);
  assert.equal(me().temporaryShield,0);
  assert.equal(me().thorns,2);
  assert.equal(f.state.battle.intent.target,me().id);
  assert.ok(f.state.battle.log.some(line=>line.includes('도발로 예고 공격 유도')));
  configure(2,['draw','guard','trace','hold']);
  await f.act('plan',{pos:16});
  await f.act('round');
  assert.equal(me().hp,97);
  assert.equal(me().thorns,0);
  assert.equal(foe().hp,36);
  assert.equal(foe().rooted,false);
});

test('clash ties can trigger counter damage and support effects can protect an ally',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'부상 아군'});
  await f.send(f.room+'/seat',{id:guest.body.me,seat:2},f.host.cookie);
  await f.send(f.room+'/seat',{id:f.state.me,seat:1},f.host.cookie);
  const effect=(kind,when,to,amount)=>({kind,when,to,amount});
  await f.act('card',{card:{name:'엄호 전술',power:'8',role:'normal',target:1,range:'1~4',clash:true,effects:[
    effect('shieldGift','use','nearestAlly',3),
    effect('allyHeal','use','woundedAlly',5),
    effect('lethalGuard','use','woundedAlly',2),
    effect('riposte','tie','target',4),
    effect('lateDraw','end','self',2)
  ]}});
  const card=f.state.profile.cards[0];
  const base=f.state.defaults.filter(c=>!c.optional).slice(1).map(c=>c.id);
  await f.act('deck',{cards:[card.id,...base,'strike','guard']});
  await f.act('start',{bots:0});
  const code=f.host.body.code,db=f.DB;
  const configure=(power)=>{
    const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
    const {units,intent}=saved.battle;
    const u=units[f.state.me], ally=units[guest.body.me];
    u.hand=[card.id,'draw','guard','trace'];u.deck=['hold','shot','rush','burn'];u.grave=[];
    u.pos=16;u.shield=5;u.mind=50;
    ally.pos=17;ally.hp=3;ally.shield=0;
    units.enemy.pos=20;
    intent.card={...intent.card,power};intent.target=ally.id;intent.reachable=true;
    db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
  };
  const submit=async(cookie,payload)=>{
    const {body}=await f.send(f.endpoint,undefined,cookie);
    const result=await f.send(f.endpoint,{revision:body.revision,...payload},cookie);
    assert.equal(result.status,200,JSON.stringify(result.body));
    return result.body.battle.units;
  };
  configure('8');
  await submit(f.host.cookie,{action:'plan',card:card.id,pos:16,targets:['enemy'],clash:true});
  await submit(guest.cookie,{action:'plan',pos:17});
  const tie=await submit(f.host.cookie,{action:'round'});
  assert.equal(tie.find(u=>u.enemy).hp,50);
  assert.equal(tie.find(u=>u.id===guest.body.me).hp,8);
  assert.equal(tie.find(u=>u.id===guest.body.me).shield,3);
  assert.equal(tie.find(u=>u.id===f.state.me).handCount,6);
  configure('20');
  await submit(f.host.cookie,{action:'plan',card:card.id,pos:16,targets:['enemy']});
  await submit(guest.cookie,{action:'plan',pos:17});
  const covered=await submit(f.host.cookie,{action:'round'});
  assert.equal(covered.find(u=>u.id===guest.body.me).hp,2);
  assert.equal(covered.find(u=>u.id===guest.body.me).lethalGuard,0);
});

test('signed power ratios combine with fixed modifiers and health effects use maximum health',async()=>{
  const f=await fixture();
  const effect=(kind,when,to,amount,amountMode)=>({kind,when,to,amount,amountMode});
  await f.act('card',{card:{name:'비율 판정',power:'20',role:'normal',target:1,range:'1~4',clash:false,effects:[
    effect('power','use','self',4,'fixed'),
    effect('power','use','self',10,'percent'),
    effect('power','use','self',-25,'percent'),
    effect('heal','use','self',10,'percent'),
    effect('pierce','hit','target',10,'percent'),
    effect('focus','end','self',25,'percent')
  ]}});
  const card=f.state.profile.cards[0];
  const base=f.state.defaults.filter(c=>!c.optional).slice(1).map(c=>c.id);
  await f.act('deck',{cards:[card.id,...base,'strike','guard']});
  await f.act('start',{solo:true,bots:0});
  const code=f.host.body.code,db=f.DB;
  const configure=()=>{
    const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
    const {units,intent}=saved.battle;
    const u=units[f.state.me];
    u.hand=[card.id,'guard','hold','draw'];u.pos=16;u.mind=50;u.hp=20;
    units.enemy.pos=20;
    intent.card={...intent.card,power:'0'};intent.reachable=true;
    db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
  };
  const me=()=>f.state.battle.units.find(u=>u.id===f.state.me);
  const foe=()=>f.state.battle.units.find(u=>u.enemy);
  configure();
  await f.act('plan',{card:card.id,pos:16,targets:['enemy']});
  await f.act('round');
  assert.equal(me().hp,30);
  assert.equal(foe().hp,29);
  assert.equal(me().nextPowerPercent,25);
  configure();
  await f.act('plan',{card:card.id,pos:16,targets:['enemy']});
  await f.act('round');
  assert.equal(foe().hp,0);
  assert.ok(f.state.battle.log.some(line=>line.includes('피해 26')));
});

test('damage modifiers stack before shields and deferred damage settles once next round',async()=>{
  const f=await fixture();
  const effect=(kind,when,to,amount,amountMode)=>({kind,when,to,amount,amountMode});
  await f.act('card',{card:{name:'유예 계약',power:'10',role:'normal',target:1,range:'1~4',clash:false,effects:[
    effect('outgoingDamage','use','self',2,'fixed'),
    effect('outgoingDamage','use','self',25,'percent'),
    effect('incomingDamage','use','self',-25,'percent'),
    effect('damageDebt','use','self',50),
    effect('shield','use','self',2),
    effect('barrierBurst','use','self',2),
    effect('shieldBreakDraw','hit','self',1)
  ]}});
  await f.act('card',{card:{name:'유예 상쇄',power:'0',role:'normal',target:'self',range:'0',clash:false,effects:[
    effect('eraseDebt','use','self',1)
  ]}});
  const [card,erase]=f.state.profile.cards;
  const deck=f.state.defaults.filter(c=>!c.optional).slice(2).map(c=>c.id);
  await f.act('deck',{cards:[card.id,erase.id,...deck,'strike','guard']});
  await f.act('start',{solo:true,bots:0});
  const code=f.host.body.code,db=f.DB;
  const configure=(power,setHand)=>{
    const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
    const {units,intent}=saved.battle, self=units[f.state.me];
    self.pos=16;units.enemy.pos=20;
    if(setHand){
      self.hand=[card.id,erase.id,'guard','draw'];
      self.deck=['hold','shot','rush','burn'];
      units.enemy.shield=4;
    }else self.shield=10;
    intent.card={...intent.card,power};intent.reachable=true;
    db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
  };
  const me=()=>f.state.battle.units.find(u=>u.id===f.state.me);
  const foe=()=>f.state.battle.units.find(u=>u.enemy);
  configure('12',true);
  await f.act('plan',{card:card.id,pos:16,targets:['enemy']});
  await f.act('round');
  assert.equal(foe().hp,38);
  assert.equal(me().hp,96);
  assert.deepEqual(me().damageDebt,[{round:2,amount:3}]);
  assert.equal(me().handCount,4);
  assert.equal(me().incomingDamagePercent,undefined);
  assert.ok(f.state.battle.log.some(line=>line.includes('보호막 파열 반격')));
  configure('0',false);
  await f.act('plan',{card:erase.id,pos:16});
  await f.act('round');
  assert.equal(me().hp,94);
  assert.equal(me().shield,10);
  assert.deepEqual(me().damageDebt,[]);
});

test('fixed and percentage deferral split damage across rounds without losing remainders',async()=>{
  for(const [mode,amount,rounds,installments] of [
    ['fixed',5,2,[3,2]],
    ['percent',50,3,[2,2,1]],
    ['fixed',100,3,[4,3,3]]
  ]){
    const f=await fixture();
    await f.act('card',{card:{name:'분할 유예',power:'0',role:'normal',target:'self',range:'0',clash:false,effects:[
      {kind:'damageDebt',when:'use',to:'self',amount,amountMode:mode,deferRounds:rounds}
    ]}});
    const card=f.state.profile.cards[0];
    const base=f.state.defaults.filter(c=>!c.optional).slice(1).map(c=>c.id);
    await f.act('deck',{cards:[card.id,...base,'strike','guard']});
    await f.act('start',{solo:true,bots:0});
    const code=f.host.body.code,db=f.DB;
    const configure=power=>{
      const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
      const {units,intent}=saved.battle, self=units[f.state.me];
      self.pos=16;units.enemy.pos=20;
      if(saved.battle.round===1)self.hand=[card.id,'guard','draw','hold'];
      intent.card={...intent.card,power};intent.reachable=true;
      db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
    };
    const me=()=>f.state.battle.units.find(u=>u.id===f.state.me);
    configure('10');
    await f.act('plan',{card:card.id,pos:16});
    await f.act('round');
    assert.deepEqual(me().damageDebt,installments.map((damage,i)=>({round:i+2,amount:damage})));
    let hp=90+installments.reduce((a,b)=>a+b,0);
    assert.equal(me().hp,hp);
    for(const installment of installments){
      configure('0');
      await f.act('plan',{pos:16});
      await f.act('round');
      hp-=installment;
      assert.equal(me().hp,hp);
    }
    assert.deepEqual(me().damageDebt,[]);
  }
});

test('special effects survive the round boundary and clash memory waits for a clash',async()=>{
  const f=await fixture();
  const fx=(kind,when,to,amount)=>({kind,when,to,amount});
  await f.act('card',{card:{name:'좌표 기록',power:'8',role:'normal',target:1,range:'1~4',clash:true,effects:[
    fx('positionAnchor','use','self',1),fx('afterimage','use','self',3),
    fx('clashMemory','lose','self',10),fx('delayedStrike','hit','target',5),
    fx('debtShield','use','self',2)
  ]}});
  const card=f.state.profile.cards[0];
  await f.act('deck',{cards:[card.id,...f.state.defaults.filter(c=>!c.optional).slice(1).map(c=>c.id),'strike','guard']});
  await f.act('start',{solo:true,bots:0});
  const code=f.host.body.code,db=f.DB;
  const configure=(power,initial=false)=>{
    const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
    const {units,intent}=saved.battle, self=units[f.state.me];
    self.pos=16;self.hand=[card.id,'guard','draw','hold'];self.mind=50;
    units.enemy.pos=20;
    if(initial)self.damageDebt=[{round:2,amount:2}];
    intent.card={...intent.card,power};intent.reachable=true;
    db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
  };
  const me=()=>f.state.battle.units.find(u=>u.id===f.state.me);
  const foe=()=>f.state.battle.units.find(u=>u.enemy);
  configure('12',true);
  await f.act('plan',{card:card.id,pos:17,targets:['enemy'],clash:true});
  await f.act('round');
  assert.equal(me().hp,93);
  assert.equal(me().clashMemory,4);
  assert.deepEqual(me().damageDebt,[]);
  configure('0');
  await f.act('plan',{card:card.id,pos:17,targets:['enemy']});
  await f.act('round');
  assert.equal(me().clashMemory,4);
  assert.equal(foe().hp,46);
  assert.equal(foe().delayedStrike[0].amount,5);
  configure('10');
  await f.act('plan',{card:card.id,pos:17,targets:['enemy'],clash:true});
  await f.act('round');
  assert.equal(me().clashMemory,undefined);
  assert.equal(foe().hp,29);
  assert.ok(f.state.battle.log.some(line=>line.includes('지연 타격 5 발동')));
});

test('a clash streak boosts the next clash and shared cards are playable by an ally',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'아군'});
  await f.send(f.room+'/seat',{id:guest.body.me,seat:2},f.host.cookie);
  await f.send(f.room+'/seat',{id:f.state.me,seat:1},f.host.cookie);
  const effect=(kind,when,to,amount)=>({kind,when,to,amount});
  await f.act('card',{card:{name:'릴레이',power:'8',role:'normal',target:1,range:'1~4',clash:true,effects:[
    effect('clashStreak','clash','self',2),effect('hastenStrike','hit','target',1),
    effect('shareCopy','end','nearestAlly',1)
  ]}});
  const card=f.state.profile.cards[0];
  await f.act('deck',{cards:[card.id,...f.state.defaults.filter(c=>!c.optional).slice(1).map(c=>c.id),'strike','guard']});
  await f.act('start',{bots:0});
  const code=f.host.body.code,db=f.DB;
  const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
  const {units,intent}=saved.battle;
  const host=units[f.state.me],ally=units[guest.body.me];
  host.pos=16;host.clashStreak=2;host.hand=[card.id,'draw','guard','hold'];
  ally.pos=17;units.enemy.pos=20;
  units.enemy.delayedStrike=[{round:2,amount:3,source:host.id}];
  intent.target=ally.id;intent.card={...intent.card,power:'10'};intent.reachable=true;
  db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
  const submit=async(cookie,payload)=>{
    const {body}=await f.send(f.endpoint,undefined,cookie);
    const result=await f.send(f.endpoint,{revision:body.revision,...payload},cookie);
    assert.equal(result.status,200,JSON.stringify(result.body));
    return result.body.battle;
  };
  await submit(f.host.cookie,{action:'plan',card:card.id,pos:16,targets:['enemy'],clash:true});
  await submit(guest.cookie,{action:'plan',pos:17});
  const battle=await submit(f.host.cookie,{action:'round'});
  assert.equal(battle.units.find(u=>u.id===host.id).clashStreak,3);
  assert.equal(battle.units.find(u=>u.enemy).hp,39);
  const planned=await submit(guest.cookie,{action:'plan',card:card.id,pos:17,targets:['enemy']});
  assert.ok(planned.units.find(u=>u.id===ally.id).hand.some(c=>c.id===card.id));
});

test('health and mind costs fund scaled rewards only after payment',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'아군'});
  await f.send(f.room+'/seat',{id:guest.body.me,seat:2},f.host.cookie);
  await f.send(f.room+'/seat',{id:f.state.me,seat:1},f.host.cookie);
  const fx=(kind,amount,extra={})=>({kind,when:'use',to:'self',amount,...extra});
  await f.act('card',{card:{name:'대가 검증',power:'8',role:'normal',target:1,range:'1~4',clash:false,effects:[
    fx('power',1,{scaleResource:'mind'}),
    fx('rallyHeal',2,{scaleResource:'health'}),
    fx('rallyShield',3,{condition:'bothPaid'}),
    fx('healthCost',10,{amountMode:'percent'}),
    fx('mindCost',10)
  ]}});
  const card=f.state.profile.cards[0];
  await f.act('deck',{cards:[card.id,...f.state.defaults.filter(c=>!c.optional).slice(1).map(c=>c.id),'strike','guard']});
  await f.act('start',{bots:0});
  const code=f.host.body.code,db=f.DB;
  const configure=(hp,mind)=>{
    const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
    const {units,intent}=saved.battle;
    const host=units[f.state.me],ally=units[guest.body.me];
    host.pos=16;host.hp=hp;host.mind=mind;host.shield=8;host.hand=[card.id,'draw','guard','hold'];
    ally.pos=17;ally.hp=20;ally.shield=0;units.enemy.pos=20;
    intent.card={...intent.card,power:'0'};intent.target=ally.id;intent.reachable=true;
    db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
  };
  const submit=async(cookie,payload)=>{
    const {body}=await f.send(f.endpoint,undefined,cookie);
    const result=await f.send(f.endpoint,{revision:body.revision,...payload},cookie);
    assert.equal(result.status,200,JSON.stringify(result.body));
    return result.body.battle.units;
  };
  for(const [hp,mind,expected] of [[40,50,[30,40,40,3,36]],[4,9,[4,9,20,0,32]]]){
    configure(hp,mind);
    await submit(f.host.cookie,{action:'plan',card:card.id,pos:16,targets:['enemy']});
    await submit(guest.cookie,{action:'plan',pos:17});
    const units=await submit(f.host.cookie,{action:'round'});
    const self=units.find(u=>u.id===f.state.me),ally=units.find(u=>u.id===guest.body.me);
    assert.deepEqual([self.hp,self.mind,ally.hp,ally.shield,units.find(u=>u.enemy).hp],expected);
    assert.equal(self.shield,8);
  }
});

test('custom effect ratios, conversions, and delays resolve using their saved settings',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'맞춤 전환',power:'1',role:'normal',target:1,range:'1~4',clash:false,effects:[
    {kind:'detonatePoison',when:'hit',to:'target',amount:50,amountMode:'percent',conversion:300},
    {kind:'graveToShield',when:'use',to:'self',amount:50,amountMode:'percent',perCard:7},
    {kind:'delayedStrike',when:'hit',to:'target',amount:10,amountMode:'percent',delayRounds:3},
    {kind:'doubleEdge',when:'use',to:'self',amount:2,amountMode:'fixed'}
  ]}});
  const card=f.state.profile.cards[0];
  await f.act('deck',{cards:[card.id,...f.state.defaults.filter(c=>!c.optional).slice(1).map(c=>c.id),'strike','guard']});
  await f.act('start',{solo:true,bots:0});
  const code=f.host.body.code,db=f.DB;
  const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
  const {units,intent}=saved.battle;
  const self=units[f.state.me];
  self.pos=16;self.hand=[card.id,'guard','draw','hold'];self.grave=['shot','burn'];
  units.enemy.pos=20;units.enemy.poison=8;
  intent.card={...intent.card,power:'0'};intent.reachable=true;
  db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
  await f.act('plan',{card:card.id,pos:16,targets:['enemy']});
  await f.act('round');
  const foe=f.state.battle.units.find(u=>u.enemy);
  assert.equal(foe.hp,33); // 3 from the attack, 14 from the explosion, 4 from remaining poison.
  assert.equal(foe.poison,3);
  assert.equal(foe.delayedStrike[0].round,4);
  assert.equal(foe.delayedStrike[0].amount,5);
  assert.equal(f.state.battle.units.find(u=>u.id===self.id).shield,7);
});

test('critical charges, stack spending and on-critical effects resolve without consuming charges on zero damage rolls',async()=>{
  const f=await fixture();
  const fx=(kind,when,to,amount,extra={})=>({kind,when,to,amount,...extra});
  await f.act('card',{card:{name:'치명타 시험',power:'8',role:'normal',target:1,range:'1~4',clash:false,effects:[
    fx('critStacks','use','self',6),
    fx('critSpend','use','self',50,{amountMode:'percent'}),
    fx('critChance','use','self',-15),
    fx('critCharges','use','self',1),
    fx('critMultiplier','use','self',25),
    fx('critPerSpent','critical','target',2),
    fx('replay','hit','self',1),
    fx('mind','end','self',4,{condition:'criticalHit'})
  ]}});
  const card=f.state.profile.cards[0];
  await f.act('deck',{cards:[card.id,...f.state.defaults.filter(c=>!c.optional).slice(1).map(c=>c.id),'strike','guard']});
  await f.act('start',{solo:true,bots:0});
  const code=f.host.body.code,db=f.DB;
  const configure=(power,charges)=>{
    const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
    const {units,intent}=saved.battle;
    const self=units[f.state.me];
    self.pos=16;self.hand=[card.id,'draw','hold','guard'];self.mind=50;
    self.library[card.id].power=power;
    units.enemy.pos=20;units.enemy.critCharges=charges;
    intent.card={...intent.card,power:'0'};intent.reachable=true;
    db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
  };
  configure('8',1);
  await f.act('plan',{card:card.id,pos:16,targets:['enemy']});
  await f.act('round');
  const self=f.state.battle.units.find(u=>u.id===f.state.me);
  const foe=f.state.battle.units.find(u=>u.enemy);
  assert.equal(foe.hp,26); // Critical 14, spent-stack damage 6, uncritical replay 8.
  assert.equal(self.critStacks,3);
  assert.equal(self.critCharges,0);
  assert.equal(self.mind,54);
  assert.equal(foe.critCharges,1);
  assert.equal(f.state.battle.log.filter(line=>line.includes('치명타 (175%)')).length,1);
});

test('100 percent critical chance triggers critical effects without requiring charges',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'확률 시험',power:'10',role:'normal',target:1,range:'1~4',clash:false,effects:[
    {kind:'critChance',when:'use',to:'self',amount:100},
    {kind:'mind',when:'critical',to:'self',amount:5}
  ]}});
  const card=f.state.profile.cards[0];
  await f.act('deck',{cards:[card.id,...f.state.defaults.filter(c=>!c.optional).slice(1).map(c=>c.id),'strike','guard']});
  await f.act('start',{solo:true,bots:0});
  const code=f.host.body.code,db=f.DB;
  const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
  const {units,intent}=saved.battle;
  units[f.state.me].hand=[card.id,'draw','hold','guard'];
  units.enemy.pos=20;intent.reachable=true;intent.card={...intent.card,power:'0'};
  db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
  await f.act('plan',{card:card.id,pos:16,targets:['enemy']});
  await f.act('round');
  assert.equal(f.state.battle.units.find(u=>u.enemy).hp,39);
  assert.equal(f.state.battle.units.find(u=>u.id===f.state.me).mind,55);
});

function configureBattle(f,apply){
  const code=f.host.body.code,db=f.DB;
  const saved=JSON.parse(db.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(code).first().state);
  apply(saved.battle,saved.battle.units[f.state.me]);
  db.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(saved),code).run();
}
const livingForm=(f,id=f.state.me)=>f.state.battle.units.find(u=>u.id===id);

test('awakening requires three consecutive rounds of the same vow and rejects form-locked cards',async()=>{
  const f=await fixture();
  for(const requiredState of ['crisis','awakened','any']){
    await f.act('card',{card:{name:requiredState,power:'15',role:'normal',target:1,range:'1~4',clash:true,effects:[],requiredState}});
  }
  const [collapsed,awakened,normal]=['collapsed','awakened','any'].map(form=>f.state.profile.cards.find(c=>c.requiredState===form));
  await f.act('deck',{cards:[collapsed.id,awakened.id,normal.id,...f.state.defaults.slice(0,5).map(c=>c.id),'strike','guard']});
  await f.act('start',{solo:true,bots:0});
  const configure=()=>configureBattle(f,(b,self)=>{
    self.pos=16;
    self.temptation=3;
    self.hand=[collapsed.id,awakened.id,normal.id,'guard'];
    b.units.enemy.pos=20;
    b.intent={...b.intent,reachable:true,target:self.id,card:{...b.intent.card,power:'8'}};
  });
  const attempt=card=>f.send(f.endpoint,{action:'plan',revision:f.state.revision,card,pos:16,targets:['enemy'],vow:'face'},f.host.cookie);
  configure();
  assert.equal((await attempt(collapsed.id)).status,400);
  await f.act('adjust',{target:f.state.me,mind:-100});
  assert.equal(livingForm(f).collapseRound,3);
  assert.equal(livingForm(f).hand.filter(card=>card.trial).length,6);
  assert.equal((await attempt(awakened.id)).status,400);
  assert.equal((await attempt(collapsed.id)).status,400);
  for(let i=0;i<3;i++){
    configure();
    await f.act('plan',{card:normal.id,pos:16,targets:['enemy'],clash:true,vow:i?'give':'face'});
    assert.equal(livingForm(f).plan.vow,'face');
    await f.act('round');
    if(i<2){
      assert.equal(livingForm(f).zero,'crisis');
      assert.equal(livingForm(f).crisisProofs,i+1);
    }
  }
  assert.equal(livingForm(f).awakening,true);
  assert.equal(livingForm(f).mind,25);
  assert.equal(livingForm(f).zero,null);
  assert.ok(f.state.battle.poses.some(p=>p.pose==='shift'&&p.form==='awakened'));
  configure();
  assert.equal((await attempt(collapsed.id)).status,400);
  await f.act('plan',{card:awakened.id,pos:16,targets:['enemy']});
});

test('collapsed players remain active and closest allies can be struck despite a submitted enemy target',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'균열',power:'12',role:'normal',target:1,range:'1~4',clash:true,effects:[],requiredState:'collapsed'}});
  const card=f.state.profile.cards[0];
  await f.act('start',{solo:true,bots:1});
  const configure=()=>configureBattle(f,(b,self)=>{
    self.pos=16;
    self.temptation=3;
    self.hand=[card.id,'hold'];
    const ally=b.units.bot0;
    ally.pos=17;ally.move=0;ally.hand=[];
    b.units.enemy.pos=20;
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'0'}};
  });
  configure();
  await f.act('adjust',{target:f.state.me,mind:-100});
  for(let i=0;i<3;i++){
    configure();
    await f.act('plan',{vow:'face'});
    await f.act('round');
  }
  assert.equal(livingForm(f).collapsed,true);
  assert.equal(f.state.battle.phase,'planning');
  assert.ok(f.state.battle.awaiting.includes(livingForm(f).name));
  assert.ok(livingForm(f).hand.some(card=>card.id==='collapseStrike'));
  const allyHp=livingForm(f,'bot0').hp;
  configure();
  const invalid=await f.send(f.endpoint,{action:'plan',revision:f.state.revision,card:'hold',pos:16},f.host.cookie);
  assert.equal(invalid.status,400);
  await f.act('plan',{card:card.id,pos:16,targets:['enemy'],clash:true});
  assert.deepEqual(livingForm(f).plan.targets,[]);
  assert.equal(livingForm(f).plan.clash,false);
  await f.act('round');
  assert.equal(livingForm(f,'bot0').hp,allyHp-7);
  assert.equal(livingForm(f,'enemy').hp,54);
  assert.ok(f.state.battle.poses.some(p=>p.form==='concept'&&p.pose==='attack'));
});

test('endure proves taking enemy damage in place and a moved round breaks the streak',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  const configure=()=>configureBattle(f,(b,self)=>{
    self.pos=16;
    self.temptation=3;
    b.units.enemy.pos=20;
    b.intent={...b.intent,reachable:true,target:self.id,card:{...b.intent.card,power:'5'}};
  });
  configure();
  await f.act('adjust',{target:f.state.me,mind:-100});
  for(const [pos,proofs] of [[16,1],[17,0],[16,undefined]]){
    configure();
    await f.act('plan',{pos,vow:'endure'});
    await f.act('round');
    assert.equal(livingForm(f).crisisProofs,proofs);
  }
  assert.equal(livingForm(f).collapsed,true);
});

test('advance and precision require actual enemy health damage',async()=>{
  for(const [vow,card,pos] of [['advance','crisisAdvance',18],['precision','crisisPrecision',16]]){
    const f=await fixture();
    await f.act('start',{solo:true,bots:0});
    const configure=shield=>configureBattle(f,(b,self)=>{
      self.pos=16;
      self.temptation=3;
      b.units.enemy.pos=20;
      b.units.enemy.shield=shield;
      b.intent={...b.intent,reachable:true,target:self.id,card:{...b.intent.card,power:'0'}};
    });
    configure(0);
    await f.act('adjust',{target:f.state.me,mind:-100});
    for(const shield of [0,999]){
      configure(shield);
      await f.act('plan',{card,pos,vow,targets:['enemy']});
      await f.act('round');
      assert.equal(livingForm(f).crisisProofs,shield?0:1);
    }
  }
});

test('character pose art is saved separately from the game view and requires room membership',async()=>{
  const f=await fixture();
  const slot='awakened.attack';
  const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO1sAAAAASUVORK5CYII=';
  await f.act('art',{slot,image});
  assert.deepEqual(f.state.profile.artSlots,[slot]);
  assert.equal(f.state.profile.art,undefined);
  const url=new URL('https://game.test'+f.endpoint);
  url.searchParams.set('unit',f.state.me);
  url.searchParams.set('art',slot);
  const read=cookie=>worker.fetch(new Request(url,{headers:cookie?{Cookie:cookie}:{}}),{DB:f.DB});
  const r=await read(f.host.cookie);
  assert.equal(r.status,200);
  assert.equal(r.headers.get('Content-Type'),'image/png');
  assert.equal(Buffer.from(await r.arrayBuffer()).toString('base64'),image.split(',')[1]);
  assert.equal((await read()).status,401);
  await f.act('art',{slot,image:''});
  assert.deepEqual(f.state.profile.artSlots,[]);
  assert.equal((await read(f.host.cookie)).status,404);
  const variants=['concept.clash','awakened.clash','concept.shift','awakened.shift'];
  for(const slot of variants)await f.act('art',{slot,image});
  assert.deepEqual(f.state.profile.artSlots,variants);
});

test('custom grid offsets gate targeting and hit effects use the saved power and amplification stages',async()=>{
  const f=await fixture();
  const card={name:'연격',hitPowers:['4','4','4'],role:'normal',target:1,
    rangeShape:{kind:'custom',cells:[[2,0]]},effects:[
      {kind:'basePower',when:'use',to:'self',amount:50,amountMode:'percent'},
      {kind:'power',when:'use',to:'self',amount:2},
      {kind:'finalPower',when:'use',to:'self',amount:25,amountMode:'percent'},
      {kind:'amplifyHit',hitIndex:1,when:'hit',to:'self',amount:50,amountMode:'percent',amplifyTarget:'remaining'},
      {kind:'amplifyHit',hitIndex:2,when:'hit',to:'self',amount:2,amplifyTarget:'last'},
      {kind:'stack',hitIndex:2,when:'hit',to:'target',tag:'2타 상처',amount:4},
      {kind:'stack',hitIndex:3,when:'hit',to:'target',tag:'3타 상처',amount:4},
      {kind:'stack',when:'hit',to:'target',tag:'카드 상처',amount:4}
    ]};
  await f.act('card',{card});
  const id=f.state.profile.cards[0].id;
  assert.deepEqual(f.state.profile.cards[0].rangeShape,card.rangeShape);
  const save=card=>f.send(f.endpoint,{action:'card',collectionRevision:f.state.collectionRevision,card},f.host.cookie);
  assert.equal((await save({...card,rangeShape:{kind:'custom',cells:[[9,0]]}})).status,400);
  assert.equal((await save({...card,effects:[{...card.effects[3],hitIndex:3}]})).status,400);
  assert.equal((await save({...card,effects:[{...card.effects[0],when:'hit'}]})).status,400);
  await f.act('start',{solo:true,bots:0});
  const position=pos=>configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50});
    Object.assign(b.units.enemy,{pos,hp:54,shield:0});
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'0'}};
  });
  position(25);
  assert.equal((await f.send(f.endpoint,{action:'plan',revision:f.state.revision,card:id,targets:['enemy']},f.host.cookie)).status,400);
  position(18);
  await f.act('plan',{card:id,targets:['enemy']});
  await f.act('round');
  const enemy=livingForm(f,'enemy');
  assert.equal(enemy.hp,29); // (12 × 150% + 2) × 125%
  assert.deepEqual(enemy.stacks,{'2타 상처':6,'3타 상처':8,'카드 상처':4});
});

test('rectangles, circles and custom ranges use caster-relative offsets and legacy ranges still use grid distance',async()=>{
  const {gridCardInRange}=await import('../public/grid.js');
  assert.equal(gridCardInRange({rangeShape:{kind:'rectangle',x:2,y:1}},18,12),true);
  assert.equal(gridCardInRange({rangeShape:{kind:'rectangle',x:2,y:1}},18,4),false);
  assert.equal(gridCardInRange({rangeShape:{kind:'circle',radius:3}},18,36),true);
  assert.equal(gridCardInRange({rangeShape:{kind:'circle',radius:2}},18,36),false);
  assert.equal(gridCardInRange({rangeShape:{kind:'custom',cells:[[-2,1]]}},18,24),true);
  assert.equal(gridCardInRange({rangeShape:{kind:'custom',cells:[[-2,1]]}},18,28),false);
  assert.equal(gridCardInRange({range:'3'},18,24),true);
});

test('shared cards enter a different collection as independent copies and file imports round-trip card data',async()=>{
  const f=await fixture();
  const join=await f.send(f.room+'/join',{name:'동료'});
  assert.equal(join.status,200);
  const card={name:'카드 파일 시험',hitPowers:['1','2'],role:'normal',target:1,
    rangeShape:{kind:'circle',radius:2},image:'data:image/png;base64,'+'AAAA'.repeat(7000),
    effects:[{kind:'amplifyHit',when:'hit',hitIndex:1,to:'self',amount:50,amountMode:'percent',amplifyTarget:'last'}]};
  await f.act('card',{card});
  const original=f.state.profile.cards[0];
  await f.act('cardClone',{id:original.id});
  const clone=f.state.profile.cards.find(c=>c.id===f.state.editedCardId);
  assert.equal(clone.name,card.name+' 사본');
  await f.act('cardShare',{id:original.id});
  const post=f.state.sharedCards[0];
  let guest=(await f.send(f.endpoint,undefined,join.cookie)).body;
  assert.equal(guest.sharedCards[0].author,'방장');
  assert.equal((await f.send(f.endpoint,{action:'cardUnshare',revision:guest.revision,id:post.id},join.cookie)).status,400);
  const take=await f.send(f.endpoint,{action:'cardTake',collectionRevision:guest.collectionRevision,id:post.id},join.cookie);
  assert.equal(take.status,200);
  guest=take.body;
  const copy=guest.profile.cards[0];
  assert.notEqual(copy.id,original.id);
  assert.deepEqual({...copy,id:original.id},original);
  await f.act('cardUnshare',{id:post.id});
  assert.equal((await f.send(f.endpoint,undefined,join.cookie)).body.profile.cards[0].id,copy.id);
  const upload=cards=>f.send(f.endpoint+'?import=1',{action:'cardImport',collectionRevision:guest.collectionRevision,
    file:{format:'conceptterra-card-library',version:1,cards}},join.cookie);
  assert.equal((await upload([original,original])).status,400);
  const imported=await upload([original,clone]);
  assert.equal(imported.status,200,JSON.stringify(imported.body.error));
  assert.deepEqual(imported.body.profile.cards.map(entry=>entry.name),[card.name,card.name,clone.name]);
  assert.deepEqual(imported.body.profile.cards[2].effects,card.effects.map(row=>({...row,tag:'',condition:'',threshold:1})));
  await f.act('deck',{cards:[clone.id,...f.state.profile.deck.slice(1)]});
  await f.act('cardDelete',{id:clone.id});
  assert.equal(f.state.profile.deck.length,10);
  assert.ok(!f.state.profile.deck.includes(clone.id));
});

test('the 15 by 15 custom range saves all 224 selectable offsets',async()=>{
  const f=await fixture();
  const cells=[];
  for(let y=-7;y<=7;y++){
    for(let x=-7;x<=7;x++){
      if(x||y)cells.push([x,y]);
    }
  }
  const card={name:'15칸 격자',power:'4',role:'normal',target:1,
    rangeShape:{kind:'custom',cells},effects:[]};
  await f.act('card',{card});
  const saved=await f.send(f.endpoint,undefined,f.host.cookie);
  assert.deepEqual(saved.body.profile.cards[0].rangeShape,card.rangeShape);
  const invalid=await f.send(f.endpoint,{action:'card',collectionRevision:f.state.collectionRevision,
    card:{...card,rangeShape:{kind:'custom',cells:[[0,8]]}}},f.host.cookie);
  assert.equal(invalid.status,400);
});

test('dice conditions use only rolled faces and distinguish a card from an individual hit',async t=>{
  const f=await fixture();
  const card={name:'주사위 검증',hitPowers:['1d2+20','1d2','2'],role:'normal',target:1,range:'1~4',effects:[
    {kind:'basePower',when:'roll',to:'self',amount:1,condition:'diceEqual',threshold:4},
    {kind:'shield',when:'roll',to:'self',amount:2,condition:'diceAtLeast',threshold:4},
    {kind:'shield',when:'roll',to:'self',amount:30,condition:'diceEqual',threshold:26},
    {kind:'shield',when:'hit',hitIndex:1,to:'self',amount:4,condition:'diceAtMost',threshold:2},
    {kind:'shield',when:'hit',hitIndex:2,to:'self',amount:8,condition:'diceEqual',threshold:2},
    {kind:'shield',when:'hit',hitIndex:3,to:'self',amount:30,condition:'diceAtMost',threshold:2}
  ]};
  await f.act('card',{card});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50,shield:0});
    Object.assign(b.units.enemy,{pos:18,hp:54});
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{card:id,targets:['enemy']});
  t.mock.method(Math,'random',()=>0.99);
  await f.act('round');
  assert.equal(livingForm(f).shield,14);
  assert.equal(livingForm(f,'enemy').hp,27);
  assert.ok(f.state.battle.log.some(line=>line.includes('주사위 눈 1타 2 / 2타 2')));
  const save=effect=>f.send(f.endpoint,{action:'card',collectionRevision:f.state.collectionRevision,
    card:{...card,effects:[effect]}},f.host.cookie);
  assert.equal((await save({...card.effects[1],when:'use'})).status,400);
  assert.equal((await save({...card.effects[1],threshold:0})).status,400);
});

test('stack consumption supports all, a budget per enemy, and a shared budget with a prioritized follow-up',async()=>{
  async function run(consume,expected){
    const f=await fixture();
    const card={name:'상처 회수',power:'0',target:'self',range:'0',role:'normal',effects:[
      {kind:'consume',when:'use',to:'allEnemies',amount:3,tag:'상처',...consume},
      {kind:'perStack',when:'consume',to:'target',amount:1}
    ]};
    await f.act('card',{card});
    const id=f.state.profile.cards[0].id;
    await f.act('start',{solo:true,bots:0});
    configureBattle(f,(b,self)=>{
      Object.assign(self,{pos:16,hand:[id],mind:50});
      Object.assign(b.units.enemy,{pos:18,hp:30,stacks:{상처:5}});
      b.units.extra={...b.units.enemy,id:'extra',name:'잔존체',pos:19,hp:20,stacks:{상처:2}};
      b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'0'}};
    });
    await f.act('plan',{card:id});
    await f.act('round');
    assert.deepEqual([livingForm(f,'enemy'),livingForm(f,'extra')].map(u=>[u.hp,u.stacks.상처]),expected);
  }
  await run({},[[27,2],[18,0]]);
  await run({consumeAmount:'all'},[[25,0],[18,0]]);
  await run({consumeScope:'total',consumePriority:'lowestHp'},[[30,4],[17,0]]);
  await run({consumeScope:'total',consumePriority:'mostStacks',consumeAmount:'all'},[[23,0],[20,0]]);
});

test('stack grants stop at their configured cap and preserve a higher stack count already in play',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'상처 한도',power:'0',target:'self',range:'0',role:'normal',effects:[
    {kind:'stack',when:'use',to:'self',tag:'상처',amount:8,stackCap:6},
    {kind:'doubleStack',when:'use',to:'self',tag:'상처',amount:8,stackCap:7}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  async function run(count){
    configureBattle(f,(b,self)=>{
      self.hand=[id];self.stacks={상처:count};
      b.intent={...b.intent,target:self.id,card:{...b.intent.card,power:'0'}};
    });
    await f.act('plan',{card:id});
    await f.act('round');
    return livingForm(f).stacks.상처;
  }
  assert.equal(await run(2),7);
  assert.equal(await run(10),10);
});

test('boss targeting, damage bonuses and mitigation distinguish boss enemies from ordinary enemies',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'강적 전술',power:'4',target:'area',range:'1~4',role:'normal',effects:[
    {kind:'bossOutgoingDamage',when:'use',to:'self',amount:50,amountMode:'percent'},
    {kind:'bossIncomingDamage',when:'use',to:'self',amount:-2},
    {kind:'stack',when:'use',to:'nearestBoss',tag:'징표',amount:1},
    {kind:'bossDamage',when:'hit',to:'target',amount:2},
    {kind:'stack',when:'hit',to:'target',condition:'bossTarget',tag:'약화',amount:1}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  const configure=boss=>configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50,hp:40,shield:0});
    Object.assign(b.units.enemy,{pos:18,hp:54,boss,stacks:{}});
    b.units.extra={...b.units.enemy,id:'extra',name:'잔존체',pos:19,boss:false,stacks:{}};
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'6'}};
  });
  configure(true);
  await f.act('plan',{card:id});
  await f.act('round');
  assert.deepEqual(livingForm(f,'enemy').stacks,{징표:1,약화:1});
  assert.deepEqual(livingForm(f,'extra').stacks,{});
  assert.equal(livingForm(f,'enemy').hp,45);
  assert.equal(livingForm(f,'extra').hp,50);
  assert.equal(livingForm(f).hp,36);
  configure(false);
  await f.act('plan',{card:id});
  await f.act('round');
  assert.deepEqual(livingForm(f,'enemy').stacks,{});
  assert.equal(livingForm(f,'enemy').hp,50);
  assert.equal(livingForm(f).hp,34);
});

test('dodge prevents damage and hit effects on individual hits while precision counters one dodge',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'회피 대응 연격',hitPowers:['4','5','6'],target:1,range:'1~4',role:'normal',effects:[
    {kind:'trueStrike',when:'use',to:'self',amount:1},
    {kind:'stack',when:'hit',hitIndex:1,to:'target',amount:1,tag:'첫 타'},
    {kind:'stack',when:'hit',hitIndex:2,to:'target',amount:1,tag:'둘째 타'},
    {kind:'stack',when:'hit',hitIndex:3,to:'target',amount:1,tag:'셋째 타'},
    {kind:'dodge',when:'use',to:'self',amount:1}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50,hp:40});
    Object.assign(b.units.enemy,{pos:18,hp:54,dodge:2});
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'10'}};
  });
  await f.act('plan',{card:id,targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,44);
  assert.deepEqual(livingForm(f,'enemy').stacks,{'첫 타':1,'셋째 타':1});
  assert.equal(livingForm(f).hp,40);
  assert.ok(!livingForm(f).dodge);
  assert.ok(f.state.battle.log.some(line=>line.includes('회피 무효화')));
});

test('named stack ward blocks only new stacks and healing cuts expire independently',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'저항과 회복',power:'0',target:'self',range:'0',role:'normal',effects:[
    {kind:'healCut',when:'use',to:'self',amount:50,duration:2},
    {kind:'healCut',when:'use',to:'self',amount:100,duration:1},
    {kind:'stackWard',when:'use',to:'self',tag:'상처',amount:3},
    {kind:'stack',when:'use',to:'self',tag:'상처',amount:5},
    {kind:'stack',when:'use',to:'self',tag:'징표',amount:2},
    {kind:'regen',when:'use',to:'self',amount:10}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],hp:20,stacks:{상처:2}});
    b.units.enemy.pos=39;
    b.intent={...b.intent,target:self.id,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{card:id});
  await f.act('round');
  assert.deepEqual(livingForm(f).stacks,{상처:4,징표:2});
  assert.equal(livingForm(f).hp,20);
  assert.deepEqual(livingForm(f).healCuts,[{amount:50,through:2}]);
  await f.act('plan',{});
  await f.act('round');
  assert.equal(livingForm(f).hp,24);
  assert.deepEqual(livingForm(f).healCuts,[]);
});

test('a lowest-die reroll updates dice conditions and recovery uses damage after shields',async t=>{
  const f=await fixture();
  await f.act('card',{card:{name:'생명 돌림',power:'2d+1',target:1,range:'1~4',role:'normal',effects:[
    {kind:'rerollLow',when:'use',to:'self',amount:1},
    {kind:'hitLeech',when:'damage',to:'self',amount:50,condition:'diceEqual',threshold:10}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50,hp:20});
    Object.assign(b.units.enemy,{pos:18,hp:54,shield:5});
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{card:id,targets:['enemy']});
  const samples=[0,0.51,0.99];
  t.mock.method(Math,'random',()=>samples.shift()??0);
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,48);
  assert.equal(livingForm(f).hp,23);
  assert.ok(f.state.battle.log.some(line=>line.includes('주사위 재굴림 1→6')));
});

test('counter cards arm without manual targeting and repay a landed attack once only within reach',async()=>{
  const f=await fixture();
  assert.equal(f.state.defaults.find(card=>card.id==='rebound').role,'counter');
  const card={name:'받아 되돌리기',hitPowers:['3','3'],role:'counter',target:1,clash:true,range:'1~3',effects:[
    {kind:'basePower',when:'counter',to:'self',amount:2},
    {kind:'stack',when:'hit',to:'target',amount:1,tag:'반격 상처'}
  ]};
  await f.act('card',{card});
  const saved=f.state.profile.cards[0];
  assert.equal(saved.clash,false);
  assert.equal(saved.target,'self');
  const rejected=await f.send(f.endpoint,{action:'card',collectionRevision:f.state.collectionRevision,
    card:{...card,role:'normal'}},f.host.cookie);
  assert.equal(rejected.status,400);
  await f.act('deck',{cards:[saved.id,...f.state.profile.deck.slice(1)]});
  await f.act('start',{solo:true,bots:0});
  async function run(pos,dodge){
    configureBattle(f,(b,self)=>{
      Object.assign(self,{pos:16,hand:[saved.id],mind:50,hp:40,shield:20,dodge});
      Object.assign(b.units.enemy,{pos,hp:54,stacks:{}});
      b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'6'}};
    });
    await f.act('plan',{card:saved.id});
    await f.act('round');
  }
  await run(18,0);
  assert.equal(livingForm(f).shield,14);
  assert.equal(livingForm(f,'enemy').hp,46);
  assert.equal(livingForm(f,'enemy').stacks['반격 상처'],1);
  const hitLog=f.state.battle.log.filter(line=>line.includes(' · 반격 → '));
  assert.equal(hitLog.length,1);
  await run(20,0);
  assert.equal(livingForm(f,'enemy').hp,54);
  await run(18,1);
  assert.equal(livingForm(f,'enemy').hp,54);
  assert.equal(f.state.battle.log.filter(line=>line.includes(' · 반격 → ')).length,1);
});

test('one card is the default, extra action allows two ordered cards on the following turn only',async()=>{
  const f=await fixture();
  const card=(name,effects)=>({name,role:'normal',target:'self',range:'0',power:'0',effects});
  await f.act('card',{card:card('행동량 증가',[{kind:'extraAction',when:'use',to:'self',amount:1}])});
  await f.act('card',{card:card('보호막 카드',[{kind:'shield',when:'use',to:'self',amount:4}])});
  await f.act('card',{card:card('보호막 위력 카드',[{kind:'shield',when:'use',to:'self',amount:2,condition:'shielded'}])});
  const [grant,first,second]=f.state.profile.cards.map(card=>card.id);
  await f.act('start',{solo:true,bots:0});
  const stage=(cards)=>configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:cards,mind:50,shield:0});
    b.units.enemy.pos=20;
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'0'}};
  });
  const choice=id=>({card:id});
  const attempt=cards=>f.send(f.endpoint,{action:'plan',revision:f.state.revision,cards},f.host.cookie);
  assert.equal(livingForm(f).actionLimit,1);
  stage([grant,first,second]);
  assert.equal((await attempt([choice(grant),choice(first)])).status,400);
  await f.act('plan',{cards:[choice(grant)]});
  await f.act('round');
  assert.equal(livingForm(f).actionLimit,2);
  stage([first,second]);
  assert.equal((await attempt([choice(first),choice(first)])).status,400);
  await f.act('plan',{pos:17,cards:[choice(first),choice(second)]});
  assert.deepEqual(livingForm(f).plan.cards.map(slot=>slot.card),[first,second]);
  await f.act('unplan');
  assert.equal(livingForm(f).ready,false);
  await f.act('plan',{pos:17,cards:[choice(first),choice(second)]});
  await f.act('round');
  assert.equal(livingForm(f).shield,6);
  assert.equal(livingForm(f).pos,17);
  assert.equal(f.state.battle.log.filter(line=>line.includes('방장 이동 1칸')).length,1);
  assert.equal(livingForm(f).actionLimit,1);
});

test('GM adjusts the base limit and a later slot may be the only action to clash',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'두 번째 합',role:'normal',target:1,range:'1~4',power:'10',clash:true,effects:[]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  await f.act('adjustActions',{target:f.state.me,baseActions:2});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id,id],mind:50});
    b.units.enemy.pos=18;
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'4'}};
  });
  const strike={card:id,targets:['enemy']};
  const clash={...strike,clash:true};
  const invalid=await f.send(f.endpoint,{action:'plan',revision:f.state.revision,cards:[clash,clash]},f.host.cookie);
  assert.equal(invalid.status,400);
  await f.act('plan',{cards:[strike,clash]});
  assert.equal(f.state.battle.clashActor,f.state.me);
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,34);
  assert.equal(livingForm(f).hp,100);
  assert.equal(livingForm(f).actionLimit,2);
});

test('selected-target splashes use the impact tile and hit only nearby enemies after a successful primary hit',async()=>{
  const f=await fixture();
  const card={name:'하방 폭발',role:'normal',target:'splash',range:'2',power:'4',
    splash:{rangeShape:{kind:'custom',cells:[[0,1]]}},effects:[
      {kind:'push',when:'hit',to:'target',amount:1},
      {kind:'stack',when:'hit',to:'target',tag:'폭발',amount:1}
    ]};
  await f.act('card',{card});
  const saved=f.state.profile.cards[0];
  assert.deepEqual(saved.splash.rangeShape,card.splash.rangeShape);
  await f.act('start',{solo:true,bots:0});
  const stage=dodge=>configureBattle(f,(b,self)=>{
    self.pos=16;self.hand=[saved.id];self.mind=50;
    Object.assign(b.units.enemy,{pos:18,hp:54,dodge,stacks:{}});
    b.units.secondary={...b.units.enemy,id:'secondary',name:'인접한 적',pos:26,dodge:0,stacks:{}};
    b.units.distant={...b.units.enemy,id:'distant',name:'범위 밖 적',pos:34,dodge:0,stacks:{}};
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'0'}};
  });
  const select=targets=>f.send(f.endpoint,{action:'plan',revision:f.state.revision,card:saved.id,targets},f.host.cookie);
  stage(1);
  assert.equal((await select(['secondary'])).status,400);
  assert.equal((await select(['enemy','secondary'])).status,400);
  await f.act('plan',{card:saved.id,targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'secondary').hp,54);
  assert.equal(livingForm(f,'enemy').hp,54);
  stage(0);
  await f.act('plan',{card:saved.id,targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').pos,19);
  assert.equal(livingForm(f,'enemy').hp,50);
  assert.equal(livingForm(f,'secondary').hp,50);
  assert.deepEqual(livingForm(f,'secondary').stacks,{폭발:1});
  assert.equal(livingForm(f,'distant').hp,54);
});

test('cross-shaped splash affects axial enemy tiles and excludes allies and diagonals',async()=>{
  const {gridSplashTargets}=await import('../public/grid.js');
  const actor={id:'self',pos:16,hp:4,enemy:false};
  const primary={id:'primary',pos:18,hp:4,enemy:true};
  const other=(id,pos,enemy=true)=>({id,pos,hp:4,enemy});
  const units=[actor,primary,other('axial',20),other('diagonal',27),other('ally',17,false)];
  const card={splash:{rangeShape:{kind:'cross',radius:2}}};
  assert.deepEqual(gridSplashTargets(card,actor,primary,units).map(unit=>unit.id),['axial']);
});

test('saved and equipped character passives trigger at the start, on hit, and on receiving health damage',async()=>{
  const f=await fixture();
  const {me}=f.state;
  await f.act('passive',{passive:{name:'회수원의 버팀목',notes:'자동 보호막',effects:[
    {kind:'shield',when:'battleStart',to:'self',amount:4},
    {kind:'stack',when:'hit',to:'target',tag:'표식',amount:1,limit:{period:'turn',count:1}},
    {kind:'heal',when:'hurt',to:'self',amount:2}
  ]}});
  await f.act('passive',{passive:{name:'장착 해제 시험',effects:[{kind:'shield',when:'battleStart',to:'self',amount:30}]}});
  await f.act('passiveToggle',{id:f.state.profile.passives[1].id});
  const passives=(await f.send(f.endpoint,undefined,f.host.cookie)).body.profile.passives;
  assert.equal(passives[0].notes,'자동 보호막');
  assert.equal(passives[1].enabled,false);
  await f.act('card',{card:{name:'표식 시험',hitPowers:['2','2'],role:'normal',target:1,range:'1~4',effects:[]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  assert.deepEqual(livingForm(f).passiveNames,['회수원의 버팀목']);
  assert.equal(livingForm(f).shield,4);
  await f.act('passiveToggle',{id:passives[0].id});
  assert.equal(f.state.profile.passives[0].enabled,false);
  assert.deepEqual(livingForm(f).passiveNames,['회수원의 버팀목']);
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50});
    b.units.enemy.pos=18;
    b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'8'}};
  });
  await f.act('plan',{card:id,targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').stacks.표식,1);
  assert.equal(livingForm(f,me).hp,98);
  assert.ok(f.state.battle.log.some(line=>line.includes('패시브 「회수원의 버팀목」 발동')));
  await f.act('reset');
  await f.act('passive',{passive:{...passives[0],name:'이름 수정'}});
  await f.act('passiveDelete',{id:passives[1].id});
  assert.deepEqual(f.state.profile.passives.map(passive=>passive.name),['이름 수정']);
});

test('a conditional replacement spends only the original card and executes the replacement once',async()=>{
  const f=await fixture();
  const replace=(replacementId,extra={})=>({kind:'replaceCard',when:'replace',to:'self',amount:1,replacementId,...extra});
  const card=(name,power,effects)=>({name,power,range:'1~4',target:1,role:'normal',effects});
  await f.act('card',{card:card('교체 공격','8',[
    replace('strike'),{kind:'stack',when:'hit',to:'target',amount:1,tag:'교체'}
  ])});
  const replacement=f.state.profile.cards[0].id;
  await f.act('card',{card:card('원래 공격','2',[
    replace(replacement,{condition:'lowHp',threshold:50}),{kind:'stack',when:'hit',to:'target',amount:1,tag:'원본'}
  ])});
  const id=f.state.profile.cards[1].id;
  await f.act('start',{solo:true,bots:0});
  async function run(hp){
    configureBattle(f,(b,self)=>{
      Object.assign(self,{pos:16,hand:[id],hp,mind:50,deck:['guard','guard','hold','hold'],grave:[]});
      Object.assign(b.units.enemy,{pos:18,hp:54,stacks:{}});
      b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'0'}};
    });
    await f.act('plan',{cards:[{card:id,targets:['enemy']}]});
    await f.act('round');
    assert.equal(livingForm(f).graveCount,1);
  }
  await run(20);
  assert.equal(livingForm(f,'enemy').hp,46);
  assert.deepEqual(livingForm(f,'enemy').stacks,{교체:1});
  assert.ok(f.state.battle.log.some(line=>line.includes('원래 공격 → 교체 공격으로 발동')));
  await run(100);
  assert.equal(livingForm(f,'enemy').hp,52);
  assert.deepEqual(livingForm(f,'enemy').stacks,{원본:1});
});

test('a passive replacement can match a particular card and use separate pre-activation conditions',async()=>{
  const f=await fixture();
  await f.act('passive',{passive:{name:'마지막 수단',effects:[
    {kind:'replaceCard',when:'replace',to:'self',amount:1,fromCardId:'guard',
      replacementId:'draw',condition:'lowMind',threshold:45,limit:{period:'battle',count:1}}
  ]}});
  await f.act('start',{solo:true,bots:0});
  async function useGuard(){
    configureBattle(f,(b,self)=>{
      Object.assign(self,{pos:16,hand:['guard'],mind:40});
      b.units.enemy.pos=18;
      b.intent={...b.intent,target:self.id,reachable:true,card:{...b.intent.card,power:'0'}};
    });
    await f.act('plan',{card:'guard'});
    await f.act('round');
  }
  await useGuard();
  assert.equal(livingForm(f).coverCount,0);
  assert.ok(f.state.battle.log.some(line=>line.includes('패시브 「마지막 수단」 발동')));
  await useGuard();
  assert.equal(livingForm(f).coverCount,1);
});

test('stack potency is separate from count and count caps, and consumption uses the oldest grants first',async()=>{
  const f=await fixture();
  const card={name:'중첩 시험',power:'0',role:'normal',range:'0',target:'self',effects:[
    {kind:'stack',when:'use',amount:2,to:'self',tag:'표식',stackPower:4,stackPowerCap:3,stackCap:5},
    {kind:'stack',when:'use',amount:5,to:'self',tag:'표식',stackPower:2,stackCap:5},
    {kind:'consume',when:'use',amount:3,to:'self',tag:'표식'},
    {kind:'shieldPerStack',when:'consume',amount:2,to:'self'}
  ]};
  await f.act('card',{card});
  const saved=f.state.profile.cards[0];
  assert.equal(saved.effects[0].stackPower,4);
  assert.equal(saved.effects[0].stackPowerCap,3);
  assert.equal(saved.effects[0].stackCap,5);
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{hand:[saved.id],stacks:{표식:1},shield:0});
    b.intent={...b.intent,target:self.id,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{card:saved.id});
  await f.act('round');
  const unit=livingForm(f);
  assert.equal(unit.stacks.표식,2);
  assert.deepEqual(unit.stackRuns.표식,[{count:2,power:2}]);
  assert.equal(unit.shield,14); // Legacy stack 1 + two capped stacks of 3, doubled by the effect.
});

test('stack theft preserves potency and named removal clears potency together with count',async()=>{
  const f=await fixture();
  const card={name:'이전 시험',power:'0',role:'normal',range:'1~4',target:1,effects:[
    {kind:'stealStack',when:'hit',amount:2,to:'target',tag:'표식'},
    {kind:'cleanseStacks',when:'hit',amount:1,to:'target',tag:'표식'},
    {kind:'stack',when:'hit',amount:1,to:'target',tag:'표식'}
  ]};
  await f.act('card',{card});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50});
    Object.assign(b.units.enemy,{pos:18,stacks:{표식:3},stackRuns:{표식:[{count:1,power:4},{count:2,power:2}]}});
    b.intent={...b.intent,target:self.id,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{card:id,targets:['enemy']});
  await f.act('round');
  assert.deepEqual(livingForm(f).stackRuns.표식,[{count:1,power:4},{count:1,power:2}]);
  assert.equal(livingForm(f,'enemy').stacks.표식,1);
  assert.equal(livingForm(f,'enemy').stackRuns.표식,undefined);
});

test('numbered hits can choose primary, splash targets beyond cast range, and alternate random targets',async t=>{
  const f=await fixture();
  const card={name:'교차 사격',hitPowers:['1','2','3','4','5'],hitTargets:['primary','secondary','randomDistinct','randomDistinct','all'],
    role:'normal',target:'splash',range:'3',splash:{range:'1~2'},effects:[
      {kind:'stack',when:'hit',hitIndex:1,to:'primary',amount:1,tag:'주 표시'},
      {kind:'stack',when:'hit',hitIndex:2,to:'secondary',condition:'secondaryTarget',amount:1,tag:'부 표시'},
      {kind:'stack',when:'hit',hitIndex:5,to:'target',condition:'primaryTarget',amount:1,tag:'본체 표시'}
    ]};
  await f.act('card',{card});
  const saved=f.state.profile.cards[0];
  assert.deepEqual(saved.hitTargets,card.hitTargets);
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[saved.id],mind:50});
    Object.assign(b.units.enemy,{pos:19,hp:50});
    b.units.first={...b.units.enemy,id:'first',name:'부 대상 A',pos:20,stacks:{}};
    b.units.second={...b.units.enemy,id:'second',name:'부 대상 B',pos:27,stacks:{}};
    b.intent={...b.intent,target:self.id,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{card:saved.id,targets:['enemy']});
  t.mock.method(Math,'random',()=>0);
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,41);
  assert.equal(livingForm(f,'first').hp,39);
  assert.equal(livingForm(f,'second').hp,43);
  assert.deepEqual(livingForm(f,'enemy').stacks,{'주 표시':1,'본체 표시':1});
  assert.deepEqual(livingForm(f,'first').stacks,{'부 표시':1});
  assert.deepEqual(livingForm(f,'second').stacks,{'부 표시':1});
});

test('a passive can react to a specific card use and grant a collection card to an ally',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'보급 기록',power:'0',role:'normal',target:'self',range:'0',effects:[]}});
  const supplied=f.state.profile.cards[0].id;
  await f.act('passive',{passive:{name:'카드 보급',effects:[
    {kind:'giveCard',when:'use',to:'nearestAlly',condition:'cardUsed',conditionCardId:'guard',givenCardId:supplied,amount:1}
  ]}});
  await f.act('start',{solo:true,bots:1});
  const stage=(card)=>configureBattle(f,(b,self)=>{
    self.hand=[card];
    const bot=Object.values(b.units).find(u=>u.bot&&!u.enemy);
    bot.hand=[];bot.deck=[];
    b.intent={...b.intent,target:self.id,card:{...b.intent.card,power:'0'}};
  });
  stage('draw');
  await f.act('plan',{card:'draw'});
  await f.act('round');
  const loot=[];
  configureBattle(f,b=>loot.push(...Object.values(b.units).find(u=>u.bot&&!u.enemy).hand));
  assert.deepEqual(loot,[]);
  stage('guard');
  await f.act('plan',{card:'guard'});
  await f.act('round');
  configureBattle(f,b=>{
    const bot=Object.values(b.units).find(u=>u.bot&&!u.enemy);
    assert.ok(bot.hand.includes(supplied));
    assert.equal(bot.library[supplied].name,'보급 기록');
  });
});

test('tile casts hit enemies around empty centers beyond primary range and validate the centered tile',async()=>{
  const f=await fixture();
  const card={name:'빈 칸 폭발',hitPowers:['8','6'],hitTargets:['primary','secondary'],target:'tile',
    role:'normal',clash:true,range:'1',splash:{range:'1'},effects:[
      {kind:'stack',when:'hit',to:'primary',amount:1,tag:'중심'},
      {kind:'stack',when:'hit',to:'secondary',amount:1,tag:'폭발'}
    ]};
  await f.act('card',{card});
  const saved=f.state.profile.cards[0];
  assert.equal(saved.clash,false);
  await f.act('start',{solo:true,bots:0});
  const stage=(enemyPos,allyPos=16,wall=false)=>configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:allyPos,mind:50,hand:[saved.id]});
    Object.assign(b.units.enemy,{pos:enemyPos,hp:54,stacks:{}});
    b.units.side={...b.units.enemy,id:'side',name:'주변 적',pos:9,stacks:{}};
    b.units.outside={...b.units.enemy,id:'outside',name:'범위 밖 적',pos:19,stacks:{}};
    b.walls=wall?[17]:[];
    b.intent={...b.intent,card:{...b.intent.card,power:'0'}};
  });
  const invalid=tile=>f.send(f.endpoint,{action:'plan',revision:f.state.revision,cards:[{card:saved.id,targetTile:tile}]},f.host.cookie);
  stage(18,16,true);
  assert.equal((await invalid(17)).status,400);
  stage(18);
  assert.equal((await invalid(null)).status,400);
  assert.equal((await invalid(18)).status,400);
  await f.act('plan',{cards:[{card:saved.id,targetTile:17}]});
  assert.equal(livingForm(f).plan.cards[0].targetTile,17);
  await f.act('unplan');
  await f.act('plan',{cards:[{card:saved.id,targetTile:17}]});
  await f.act('round');
  assert.deepEqual([livingForm(f,'enemy').hp,livingForm(f,'side').hp,livingForm(f,'outside').hp],[48,48,54]);
  assert.deepEqual(livingForm(f,'enemy').stacks,{폭발:1});
  stage(17);
  await f.act('plan',{card:saved.id,targetTile:17});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,46);
  assert.deepEqual(livingForm(f,'enemy').stacks,{중심:1});
  stage(8,1);
  await f.act('plan',{card:saved.id,targetTile:0});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,48);
});

test('duration poison snapshots real HP damage, and ratio effects support mental and card bases',async()=>{
  const f=await fixture();
  const ratio=(kind,when,to,amount,ratioBasis,extra={})=>({kind,when,to,amount,amountMode:'percent',ratioBasis,...extra});
  await f.act('card',{card:{name:'기준과 지속 턴',hitPowers:['8','4'],role:'normal',target:1,range:'1~4',effects:[
    ratio('shield','use','self',10,'mindCurrent'),
    ratio('shield','use','self',50,'cardMin'),
    ratio('shield','use','self',25,'cardMax'),
    ratio('shield','attackEnd','self',25,'cardTotal'),
    ratio('shield','attackEnd','self',50,'totalDamage'),
    ratio('poison','attackEnd','target',50,'damageDealt',{dotRounds:3}),
    {kind:'poison',to:'target',when:'attackEnd',amount:2,dotRounds:2}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50});
    Object.assign(b.units.enemy,{pos:18,shield:4});
    b.intent={...b.intent,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{card:id,targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f).shield,21);
  assert.equal(livingForm(f,'enemy').hp,40);
  assert.deepEqual(livingForm(f,'enemy').damageOverTime,[{amount:4,through:3},{amount:2,through:2}]);
  await f.act('plan',{cards:[]});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,34);
  await f.act('plan',{cards:[]});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,30);
  assert.deepEqual(livingForm(f,'enemy').damageOverTime,[]);
});

test('action disable and reduction apply next turn, and removing disable allows planning again',async()=>{
  const f=await fixture();
  const control=(kind,amount,to)=>({kind,amount,to,when:'use'});
  for(const [name,effects] of [
    ['행동 감소',[control('reduceActions',1,'self')]],
    ['행동 봉쇄',[control('blockAction',2,'nearestEnemy')]],
    ['봉쇄 해제',[control('unblockAction',1,'nearestEnemy'),control('blockAction',1,'self')]]
  ])await f.act('card',{card:{name,role:'normal',power:'0',range:'0',target:'self',effects}});
  const [reduce,block,cleanse]=f.state.profile.cards.map(card=>card.id);
  await f.act('start',{solo:true,bots:0});
  const hand=id=>configureBattle(f,(b,self)=>{
    self.hand=[id];self.pos=16;b.units.enemy.pos=18;
    b.intent={...b.intent,card:{...b.intent.card,power:'0'}};
  });
  hand(reduce);
  await f.act('plan',{card:reduce});
  await f.act('round');
  assert.equal(livingForm(f).actionLimit,0);
  for(const plan of [{card:block},{cards:[{card:block}]}]){
    assert.equal((await f.send(f.endpoint,{action:'plan',revision:f.state.revision,...plan},f.host.cookie)).status,400);
  }
  await f.act('plan',{cards:[],pos:17});
  await f.act('round');
  assert.equal(livingForm(f).pos,17);
  assert.equal(livingForm(f).actionLimit,1);
  hand(block);
  await f.act('plan',{card:block});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').blockedRounds,2);
  assert.equal(f.state.battle.intent.reachable,false);
  hand(cleanse);
  await f.act('plan',{card:cleanse});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').blockedRounds,0);
  assert.equal(livingForm(f).blockedRounds,1);
  assert.deepEqual(f.state.battle.awaiting,[]);
  assert.equal((await f.send(f.endpoint,{action:'plan',revision:f.state.revision},f.host.cookie)).status,400);
  await f.act('round');
  assert.equal(livingForm(f).actionLimit,1);
});

test('a player can take a shared passive with a custom card, edit it, and equip it independently',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'동료'});
  const member=id=>f.send(f.room+'/seat',{id,seat:2},f.host.cookie);
  await member(guest.body.me);
  await f.act('card',{card:{name:'공유되는 보급품',role:'normal',power:'0',range:'0',target:'self',effects:[]}});
  const id=f.state.profile.cards[0].id;
  await f.act('passive',{passive:{name:'보급 담당',effects:[
    {kind:'giveCard',when:'battleStart',to:'self',amount:1,givenCardId:id}
  ]}});
  const original=f.state.profile.passives[0];
  await f.act('passiveShare',{id:original.id});
  let shared=f.state.sharedPassives[0];
  assert.deepEqual(shared.included,[{id,name:'공유되는 보급품'}]);
  const guestAct=async(action,payload)=>{
    const {body}=await f.send(f.endpoint,undefined,guest.cookie);
    const response=await f.send(f.endpoint,{action,revision:body.revision,...payload},guest.cookie);
    assert.equal(response.status,200,JSON.stringify(response.body));
    return response.body;
  };
  assert.equal((await f.send(f.endpoint,{action:'passiveUnshare',revision:f.state.revision,id:shared.id},guest.cookie)).status,400);
  const received=(await guestAct('passiveTake',{id:shared.id})).profile.passives[0];
  assert.notEqual(received.id,original.id);
  assert.equal(received.enabled,false);
  await guestAct('passive',{passive:{...received,name:'동료의 보급 담당',enabled:true}});
  let updated=await f.send(f.endpoint,undefined,f.host.cookie);
  const release=await f.send(f.endpoint,{action:'passiveUnshare',revision:updated.body.revision,id:shared.id},f.host.cookie);
  assert.equal(release.status,200);
  const started=await f.send(f.endpoint,{action:'start',revision:release.body.revision,bots:0},f.host.cookie);
  assert.equal(started.status,200);
  updated=await f.send(f.endpoint,undefined,guest.cookie);
  const unit=updated.body.battle.units.find(unit=>unit.id===guest.body.me);
  assert.deepEqual(unit.passiveNames,['동료의 보급 담당']);
  assert.ok(unit.hand.some(card=>card.id===id));
});

test('a block script runs a nested branch in order, re-reads live values, and shares limits across repeats',async()=>{
  const f=await fixture();
  const number=value=>({type:'number',value});
  const stat=stat=>({type:'stat',stat});
  const compare=(op,left,right)=>({type:'compare',op,left,right});
  const decide=(id,branch,test)=>({kind:'if',id,branch,test});
  const repeat={kind:'repeat',id:2,count:3};
  const outer={type:'and',
    left:compare('lt',stat('selfHp'),number(30)),
    right:{type:'not',test:compare('lt',stat('selfMind'),number(20))}
  };
  const inner=compare('lt',stat('selfShield'),number(8));
  const then=decide(1,'then',outer),otherwise=decide(1,'else',outer);
  const fx=(kind,amount,flow,rest={})=>({kind,amount,flow,when:'use',to:'self',...rest});
  const effects=[
    fx('heal',25,[then]),
    fx('shield',1,[then,repeat,decide(3,'then',inner)],{
      amountExpr:{type:'math',op:'divide',left:stat('selfMind'),right:number(10)}
    }),
    fx('shield',2,[then,repeat,decide(3,'else',inner)],{limit:{period:'turn',count:1}}),
    fx('shield',60,[otherwise]),
    fx('mind',1,[])
  ];
  const card={name:'저체력 방어 스크립트',power:'0',role:'normal',target:'self',range:'0',effects};
  await f.act('card',{card});
  const saved=f.state.profile.cards[0];
  assert.deepEqual(saved.effects[1].flow,effects[1].flow);
  assert.deepEqual(saved.effects[1].amountExpr,effects[1].amountExpr);
  await f.act('start',{solo:true,bots:0});
  const play=async(hp,mind)=>{
    configureBattle(f,(b,self)=>{
      Object.assign(self,{hp,mind,shield:0,hand:[saved.id]});
      b.intent={...b.intent,card:{...b.intent.card,power:'0'}};
    });
    await f.act('plan',{cards:[{card:saved.id}]});
    await f.act('round');
  };
  await play(10,80);
  assert.equal(livingForm(f).hp,35);
  assert.equal(livingForm(f).shield,10); // 8 from the first iteration, 2 from the second, limit stops the third.
  assert.equal(livingForm(f).mind,86); // Healing restores 5 mental power, then the last block adds 1.
  await play(39,80);
  assert.equal(livingForm(f).hp,39);
  assert.equal(livingForm(f).shield,60);
});

test('block reference cards are remapped on import and invalid control trees are rejected',async()=>{
  const f=await fixture();
  const base={power:'0',role:'normal',target:'self',range:'0'};
  const referenced={...base,id:'old-card',name:'참조 원본',effects:[]};
  const step={kind:'if',id:1,branch:'then',test:{type:'not',test:{
    type:'condition',subject:'self',condition:'cardUsed',conditionCardId:referenced.id
  }}};
  const row={kind:'shield',when:'use',to:'self',amount:2,flow:[step]};
  const conditional={...base,id:'script',name:'공유 스크립트',effects:[row]};
  await f.act('cardImport',{file:{format:'conceptterra-card-library',version:1,cards:[referenced,conditional]}});
  const [imported,script]=f.state.profile.cards;
  assert.equal(script.effects[0].flow[0].test.test.conditionCardId,imported.id);
  const invalid=effects=>f.send(f.endpoint,{action:'card',collectionRevision:f.state.collectionRevision,card:{...base,name:'잘못된 스크립트',effects}},f.host.cookie);
  const repeat=id=>({kind:'repeat',id,count:5});
  assert.equal((await invalid([{...row,flow:[repeat(1),repeat(2),repeat(3)]}])).status,400);
  const good={...row,flow:[{...step,test:{type:'condition',subject:'self',condition:'cardUsed',conditionCardId:imported.id}}]};
  assert.equal((await invalid([good,{...good,flow:[{...good.flow[0],test:{...good.flow[0].test,condition:'criticalHit'}}]}])).status,400);
});

test('a passive block script can choose a branch at the use event and resolve an expression',async()=>{
  const f=await fixture();
  await f.act('passive',{passive:{name:'정신력 연산 패시브',effects:[
    {kind:'shield',when:'use',to:'self',amount:1,flow:[{
      kind:'if',id:1,branch:'then',test:{type:'condition',subject:'self',condition:'cardUsed',conditionCardId:'draw'}
    }],amountExpr:{type:'math',op:'divide',left:{type:'stat',stat:'selfMind'},right:{type:'number',value:5}}}
  ]}});
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{mind:55,hand:['draw'],shield:0});
    b.intent={...b.intent,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{cards:[{card:'draw'}]});
  await f.act('round');
  assert.equal(livingForm(f).shield,11);
});

test('nested hit outcomes distinguish the critical, collision, and damage of each strike',async()=>{
  const f=await fixture();
  const branch=(id,result)=>({kind:'if',id,branch:'then',test:{type:'hitResult',result}});
  const row=(hitIndex,kind,tag,flow)=>({kind,hitIndex,when:'hit',to:'target',amount:1,tag,flow});
  const crit=branch(1,'critical'),wall=branch(2,'wall');
  const card={name:'충돌 분기',role:'normal',target:1,range:'1~4',hitPowers:['6','6'],effects:[
    row(1,'push','',[crit]),
    row(1,'stack','치명타벽',[crit,wall]),
    row(1,'stack','보호막파괴',[branch(3,'shieldBreak')]),
    row(1,'stack','체력피해',[branch(4,'damage')]),
    row(2,'stack','일반적중',[branch(1,'noncritical')]),
    row(2,'stack','오래된충돌',[branch(1,'noncritical'),wall])
  ]};
  await f.act('card',{card});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  async function play(wall,dodge){
    configureBattle(f,(b,self)=>{
      Object.assign(self,{pos:16,hand:[id],mind:50,critCharges:1});
      Object.assign(b.units.enemy,{pos:18,hp:54,shield:9,stacks:{},dodge});
      delete b.units.enemy.stackRuns;
      b.walls=wall?[19]:[];
      b.intent={...b.intent,card:{...b.intent.card,power:'0'}};
    });
    await f.act('plan',{cards:[{card:id,targets:['enemy']}]});
    await f.act('round');
    return livingForm(f,'enemy').stacks;
  }
  assert.deepEqual(await play(true,0),{치명타벽:1,보호막파괴:1,일반적중:1});
  assert.deepEqual(await play(false,0),{보호막파괴:1,일반적중:1});
  assert.deepEqual(await play(true,1),{});
});

test('whole-card hit conditions can react to their own push and reject using hit results outside hit',async()=>{
  const f=await fixture();
  const flow=[{kind:'if',id:1,branch:'then',test:{type:'hitResult',result:'wall'}}];
  const stack={kind:'stack',when:'hit',to:'target',amount:1,tag:'벽표식',flow};
  const card={name:'카드 충돌',power:'1',role:'normal',target:1,range:'1~4',effects:[
    {kind:'push',when:'hit',to:'target',amount:1},stack
  ]};
  assert.equal((await f.send(f.endpoint,{action:'card',collectionRevision:f.state.collectionRevision,
    card:{...card,effects:[{...stack,when:'use'}]}},f.host.cookie)).status,400);
  await f.act('card',{card});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50});
    b.units.enemy.pos=18;b.walls=[19];
    b.intent={...b.intent,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{cards:[{card:id,targets:['enemy']}]});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').stacks.벽표식,1);
});

test('variadic logic gates distinguish AND, OR, and parity and reject too many inputs',async()=>{
  const f=await fixture();
  const gates=['and','or','xor','nand','nor','xnor'];
  const yes={type:'hitResult',result:'noncritical'}, no={type:'hitResult',result:'critical'};
  const make=(inputs)=>gates.map((gate,index)=>({kind:'stack',when:'hit',to:'target',amount:1,tag:gate,
    flow:[{kind:'if',id:index+1,branch:'then',test:{type:'gate',gate,inputs}}]}));
  const card={name:'논리 게이트 검증',power:'1',role:'normal',range:'1~4',target:1,effects:make([yes,yes,no])};
  const invalid=await f.send(f.endpoint,{action:'card',collectionRevision:f.state.collectionRevision,
    card:{...card,effects:make(Array(13).fill(yes)).slice(0,1)}},f.host.cookie);
  assert.equal(invalid.status,400);
  await f.act('card',{card});
  await f.act('card',{card:{...card,name:'홀수 게이트',effects:make([yes,yes,yes])}});
  const [even,odd]=f.state.profile.cards;
  assert.equal(even.effects[0].flow[0].test.inputs.length,3);
  await f.act('start',{solo:true,bots:0});
  async function play(id){
    configureBattle(f,(b,self)=>{
      Object.assign(self,{pos:16,hand:[id],mind:50});
      Object.assign(b.units.enemy,{pos:18,stacks:{}});
      delete b.units.enemy.stackRuns;
      b.intent={...b.intent,card:{...b.intent.card,power:'0'}};
    });
    await f.act('plan',{cards:[{card:id,targets:['enemy']}]});
    await f.act('round');
    return Object.keys(livingForm(f,'enemy').stacks);
  }
  assert.deepEqual(await play(even.id),['or','nand','xnor']);
  assert.deepEqual(await play(odd.id),['and','or','xor']);
});

test('custom stack names follow the collection, alongside names used in legacy cards and condition blocks',async()=>{
  const f=await fixture();
  const untouched=f.state.collectionRevision;
  await f.act('stackCreate',{name:'  균열  '});
  assert.equal(f.state.collectionRevision,untouched+1);
  assert.deepEqual(f.state.profile.customStacks,['균열']);
  assert.ok(f.state.profile.stackNames.includes('상처'));
  const duplicate=await f.send(f.endpoint,{action:'stackCreate',collectionRevision:f.state.collectionRevision,name:'균열'},f.host.cookie);
  assert.equal(duplicate.status,400);
  await f.act('card',{card:{name:'중첩 파츠 카드',role:'normal',power:'1',range:'1~4',target:1,effects:[
    {kind:'stack',when:'hit',amount:2,to:'target',tag:'균열'},
    {kind:'damage',when:'hit',amount:10,amountMode:'percent',ratioBasis:'hpMax',to:'target',
      flow:[{kind:'if',id:1,branch:'then',test:{type:'gate',gate:'and',inputs:[
        {type:'condition',subject:'target',condition:'stack',tag:'균열',threshold:2},
        {type:'not',test:{type:'condition',subject:'target',condition:'stack',tag:'유예 표식',threshold:1}}
      ]}}]}
  ]}});
  const saved=f.state.profile.cards[0];
  assert.ok(f.state.profile.stackNames.includes('유예 표식'));
  const other=await f.send('/api/rooms',{title:'다른 객차',name:'방장'},f.host.cookie);
  const otherRoom=await f.send('/api/rooms/'+other.body.code+'/game',undefined,other.cookie);
  assert.deepEqual(otherRoom.body.profile.customStacks,['균열']);
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[saved.id],mind:50});
    b.units.enemy.pos=18;
    b.intent={...b.intent,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{cards:[{card:saved.id,targets:['enemy']}]});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').stacks.균열,2);
  assert.equal(livingForm(f,'enemy').hp,48);
});

test('arithmetic supports extra terms in effects and comparison operands',async()=>{
  const f=await fixture();
  const literal=value=>({type:'number',value});
  const math=(op,...terms)=>({type:'math',op,terms:terms.map(term=>typeof term==='number'?literal(term):term)});
  const condition={type:'compare',op:'eq',left:math('min',8,2,5),right:literal(2)};
  const effect=(op,...terms)=>({kind:'shield',when:'use',to:'self',amount:1,amountExpr:math(op,...terms),
    flow:[{kind:'if',id:1,branch:'then',test:condition}]});
  const card={name:'여러 항 연산',power:'0',role:'normal',target:'self',range:'0',effects:[
    effect('subtract',12,3,2),
    effect('divide',48,4,2),
    effect('add',2,3,math('multiply',2,3,4)),
    effect('max',2,9,4)
  ]};
  const invalid=await f.send(f.endpoint,{action:'card',collectionRevision:f.state.collectionRevision,
    card:{...card,effects:[effect('add',...Array(13).fill(1))]}},f.host.cookie);
  assert.equal(invalid.status,400);
  await f.act('card',{card});
  const saved=f.state.profile.cards[0];
  assert.deepEqual(saved.effects[2].amountExpr,card.effects[2].amountExpr);
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{hand:[saved.id],mind:50,shield:0});
    b.intent={...b.intent,card:{...b.intent.card,power:'0'}};
  });
  await f.act('plan',{cards:[{card:saved.id}]});
  await f.act('round');
  assert.equal(livingForm(f).shield,51); // 7 + 6 + 29 + 9
});

test('concept cards are stronger catalogue choices and pay mental cost once on use',async()=>{
  const f=await fixture();
  const allConcepts=f.state.defaults.filter(card=>card.concept);
  assert.equal(allConcepts.length,27);
  const concepts=allConcepts.filter(card=>!['conceptVaultStart','conceptSnailStart','conceptSafeStart','conceptPlummetStart','conceptTrifaceStart','conceptStitchSeam','conceptHeronSpring','conceptFleshNails','conceptBlindJudge','conceptGuestStart','conceptCommuteStart','conceptDread','conceptMaze','conceptApproach','conceptScribeStart','conceptArtistStart','conceptApplauseStart'].includes(card.id));
  assert.equal(f.state.profile.conceptStackTraits.length,20);
  const {parsePower}=await import('../public/rules.js');
  const average=card=>(card.hitPowers??[card.power]).reduce((sum,value)=>{const power=parsePower(value);return sum+power.bonus+power.count*(power.sides+1)/2;},0);
  const baseline=Math.max(...f.state.defaults.filter(card=>['strike','hold','shot','rush','trace'].includes(card.id)).map(average));
  for(const card of concepts){
    assert.ok(average(card)>baseline);
    assert.ok(card.cost>=14);
    assert.ok(card.effects.some(effect=>['stack','consume'].includes(effect.kind)));
  }
  await f.act('deck',{cards:concepts.map(card=>card.id)});
  await f.act('start',{solo:true,bots:0});
  for(const card of concepts){
    configureBattle(f,(b,self)=>{
      Object.assign(self,{pos:16,hand:[card.id],mind:80,hp:40,maxHp:40,stacks:{},stackTraits:{}});
      Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,stacks:{},stackTraits:{},blockedRounds:1});
      b.walls=[];
    });
    await f.act('plan',{card:card.id,targets:['enemy']});
    await f.act('round');
    assert.equal(livingForm(f).mind,80-card.cost,card.name);
    const grant=card.effects.find(effect=>effect.kind==='stack');
    if(grant){
      const holder=livingForm(f,grant.to==='self'?f.state.me:'enemy');
      const granted=card.effects.filter(effect=>effect.kind==='stack'&&effect.tag===grant.tag).reduce((sum,effect)=>sum+effect.amount,0);
      assert.equal(holder.stacks[grant.tag],granted,card.name);
      assert.equal(holder.stackTraits[grant.tag].concept,true);
    }
  }
});

test('concept costs block insufficient mental power in planning and at execution',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{self.hand=['conceptSuture'];self.mind=13;});
  const denied=await f.send(f.endpoint,{action:'plan',revision:f.state.revision,card:'conceptSuture',targets:['enemy']},f.host.cookie);
  assert.equal(denied.status,400);
  assert.match(denied.body.error,/정신력 14/);
  configureBattle(f,(b,self)=>{
    Object.assign(self,{hand:['conceptSuture'],mind:30,pos:16});
    b.units.enemy.pos=18;b.units.enemy.blockedRounds=1;
  });
  await f.act('plan',{card:'conceptSuture',targets:['enemy']});
  configureBattle(f,(b,self)=>{self.mind=13;});
  await f.act('round');
  assert.equal(livingForm(f).mind,13);
  assert.ok(livingForm(f).hand.some(card=>card.id==='conceptSuture'));
  assert.equal(livingForm(f).stacks['백색 봉합'],undefined);
});

test('concept card stacks persist across rounds, cap reapplications, and clear at battle end',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:['conceptSuture'],mind:80,hp:20});
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:1});
  });
  await f.act('plan',{card:'conceptSuture',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f).hp,23);
  assert.equal(livingForm(f).shield,4);
  configureBattle(f,(b,self)=>{self.hand=['conceptSuture'];b.units.enemy.blockedRounds=1;});
  await f.act('plan',{card:'conceptSuture',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f).hp,26);
  assert.equal(livingForm(f).shield,8);
  assert.equal(livingForm(f).stacks['백색 봉합'],1);
  configureBattle(f,(b)=>{b.units.enemy.blockedRounds=1;});
  await f.act('plan',{});
  await f.act('round');
  assert.equal(livingForm(f).hp,29);
  assert.equal(livingForm(f).shield,12);
  configureBattle(f,(b)=>{b.units.enemy.hp=0;});
  await f.act('plan',{});
  await f.act('round');
  assert.equal(f.state.battle.phase,'finished');
  assert.equal(livingForm(f).stacks['백색 봉합'],0);
  assert.equal(livingForm(f).stackTraits['백색 봉합'],undefined);
  await f.act('start',{solo:true,bots:0});
  assert.equal(livingForm(f).stacks['백색 봉합'],undefined);
});

test('removing a concept debuff immediately removes its held damage modifier and periodic damage',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'명패 제거',power:'0',role:'normal',target:1,range:'1~4',effects:[
    {kind:'cleanseStacks',when:'hit',to:'target',tag:'인양의 명패',amount:1}
  ]}});
  const cleanup=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:['conceptCoffin'],mind:80});
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:1});b.walls=[];
  });
  await f.act('plan',{card:'conceptCoffin',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').stacks['인양의 명패'],1);
  const before=livingForm(f,'enemy').hp;
  configureBattle(f,(b,self)=>{
    self.hand=[cleanup];self.mind=50;b.units.enemy.pos=18;b.units.enemy.blockedRounds=1;
  });
  await f.act('plan',{card:cleanup,targets:['enemy']});
  await f.act('round');
  const enemy=livingForm(f,'enemy');
  assert.equal(enemy.hp,before);
  assert.equal(enemy.stacks['인양의 명패'],undefined);
  assert.equal(enemy.stackTraits['인양의 명패'],undefined);
});

test('card, strike, effect and passive flavor text survive save and passive export',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'목격 기록',power:'0',target:'self',range:'0',role:'normal',
    flavor:'객차의 기록',hitFlavors:['첫 타의 기록'],effects:[{kind:'mind',when:'use',to:'self',amount:1,flavor:'효과 기록'}]}});
  const card=f.state.profile.cards[0];
  assert.equal(card.flavor,'객차의 기록');
  assert.deepEqual(card.hitFlavors,['첫 타의 기록']);
  assert.equal(card.effects[0].flavor,'효과 기록');
  assert.ok(f.state.defaults.filter(item=>item.concept).every(item=>item.flavor));
  await f.act('passive',{passive:{name:'기록자',flavor:'패시브 기록',effects:[{kind:'shield',when:'turnStart',to:'self',amount:1,flavor:'방벽 기록'}]}});
  const file=(await f.send(f.endpoint,{action:'passiveExport'},f.host.cookie)).body;
  assert.equal(file.passives[0].flavor,'패시브 기록');
  assert.equal(file.passives[0].effects[0].flavor,'방벽 기록');
});

test('ordinary effects can resolve before replacement and costs can run at card decision',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'행동 순서 시험',power:'0',role:'normal',target:'self',range:'0',effects:[
    {kind:'healthCost',when:'decide',to:'self',amount:3},
    {kind:'shield',when:'replace',to:'self',amount:4}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('passive',{passive:{name:'마무리 자세',effects:[{kind:'shield',when:'end',to:'self',amount:2}]}});
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{self.hand=[id];b.units.enemy.blockedRounds=1;});
  await f.act('plan',{card:id,targets:[]});
  await f.act('round');
  assert.equal(livingForm(f).hp,97);
  assert.equal(livingForm(f).shield,6);
});

test('an effect can grant a different stack from the one checked by its condition',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'중첩 교차 조건',power:'0',role:'normal',target:'self',range:'0',effects:[
    {kind:'stack',when:'use',to:'self',tag:'집중',amount:2},
    {kind:'stack',when:'use',to:'self',tag:'강타',condition:'stack',conditionStackTag:'집중',threshold:2,amount:3}
  ]}});
  const card=f.state.profile.cards[0];
  assert.equal(card.effects[1].conditionStackTag,'집중');
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{self.hand=[card.id];b.units.enemy.blockedRounds=1;});
  await f.act('plan',{card:card.id,targets:[]});
  await f.act('round');
  assert.equal(livingForm(f).stacks.강타,2);
});

test('stack percentages use current, missing or maximum counts and accept a calculated cap',async()=>{
  for(const [ratioBasis,expected] of [['ownStackCurrent',6],['ownStackMissing',12],['ownStackMax',14]]){
    const f=await fixture();
    await f.act('card',{card:{name:'비율 계산',power:'0',role:'normal',range:'0',target:'self',effects:[
      {kind:'stack',when:'use',to:'self',tag:'시험',amount:4},
      {kind:'stack',when:'use',to:'self',tag:'시험',amount:50,amountMode:'percent',ratioBasis,stackCap:50,
        numberExprs:{stackCap:{type:'math',op:'add',terms:[{type:'number',value:10},{type:'number',value:10}]}}}
    ]}});
    const id=f.state.profile.cards[0].id;
    await f.act('start',{solo:true,bots:0});
    configureBattle(f,(b,self)=>{self.hand=[id];b.units.enemy.blockedRounds=1;});
    await f.act('plan',{card:id,targets:[]});
    await f.act('round');
    assert.equal(livingForm(f).stacks.시험,expected,ratioBasis);
  }
});
test('repeat counts and condition thresholds can be calculated during combat',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'연산 반복',power:'0',role:'normal',range:'0',target:'self',effects:[
    {kind:'mind',when:'use',to:'self',amount:1,flow:[
      {kind:'repeat',id:1,count:1,countExpr:{type:'number',value:3}},
      {kind:'if',id:2,branch:'then',test:{type:'condition',condition:'highMind',subject:'self',threshold:99,thresholdExpr:{type:'number',value:40}}}
    ]}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{self.hand=[id];b.units.enemy.blockedRounds=1;});
  await f.act('plan',{card:id,targets:[]});
  await f.act('round');
  assert.equal(livingForm(f).mind,53);
});

test('percent parts act as fractions when nested in arithmetic',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'비율 파츠',power:'0',role:'normal',range:'0',target:'self',effects:[
    {kind:'shield',when:'use',to:'self',amount:1,amountExpr:{type:'math',op:'multiply',terms:[{type:'number',value:10},{type:'percent',value:50}]}}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{self.hand=[id];b.units.enemy.blockedRounds=1;});
  await f.act('plan',{card:id,targets:[]});
  await f.act('round');
  assert.equal(livingForm(f).shield,5);
});
test('stack acquisition limits are shared across effects, reset per turn and persist per battle',async()=>{
  const f=await fixture();
  await f.act('stackCreate',{name:'회수 한도'});
  await f.act('stackEdit',{name:'회수 한도',gainLimits:{stackTurnCount:3,stackTurnPower:6,stackBattleCount:5,stackBattlePower:8},effects:[]});
  const effect={kind:'stack',when:'use',to:'self',tag:'회수 한도',amount:5,stackPower:2,stackGainCount:2,stackGainPower:4};
  await f.act('card',{card:{name:'획득 제한',power:'0',role:'normal',range:'0',target:'self',effects:[effect,effect]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  for(const expected of [3,4,4]){
    configureBattle(f,(b,self)=>{self.hand=[id];b.units.enemy.blockedRounds=1;});
    await f.act('plan',{card:id,targets:[]});
    await f.act('round');
    assert.equal(livingForm(f).stacks['회수 한도'],expected);
  }
});

test('stack holdings obey count and total power caps and can be replenished',async()=>{
  const f=await fixture();
  await f.act('stackCreate',{name:'보유 횟수'});
  await f.act('stackEdit',{name:'보유 횟수',holdCount:2,holdPower:20,effects:[]});
  await f.act('stackCreate',{name:'보유 위력'});
  await f.act('stackEdit',{name:'보유 위력',holdCount:8,holdPower:7,effects:[]});
  const tags=['보유 횟수','보유 위력'];
  const use={when:'use',to:'self'};
  const grants=tags.map(tag=>({...use,kind:'stack',tag,amount:5,stackPower:3}));
  await f.act('card',{card:{name:'보유 제한',power:'0',role:'normal',range:'0',target:'self',effects:grants}});
  const grantId=f.state.profile.cards.find(card=>card.name==='보유 제한').id;
  const consumes=tags.map(tag=>({...use,kind:'consume',tag,amount:1}));
  await f.act('card',{card:{name:'보유 소모',power:'0',role:'normal',range:'0',target:'self',effects:consumes}});
  const consumeId=f.state.profile.cards.find(card=>card.name==='보유 소모').id;
  await f.act('start',{solo:true,bots:0});
  for(const [id,expected] of [[grantId,2],[grantId,2],[consumeId,1],[grantId,2]]){
    configureBattle(f,(b,self)=>{self.hand=[id];b.units.enemy.blockedRounds=1;});
    await f.act('plan',{card:id,targets:[]});
    await f.act('round');
    for(const tag of tags)assert.equal(livingForm(f).stacks[tag],expected);
  }
});

test('card movement filters work across combatants for cards, passives and held stacks',async()=>{
  const f=await fixture();
  const source={power:'0',role:'normal',range:'0',target:'self'};
  const allyDraw={kind:'shield',when:'cardDrawn',zoneOwner:'ally',to:'self'};
  await f.act('card',{card:{...source,name:'이동 감시',effects:[
    {...allyDraw,zoneCard:'other',amount:2},
    {...allyDraw,zoneCard:'same',amount:20},
    {...allyDraw,zoneCard:'specific',zoneCardId:'guard',amount:20}
  ]}});
  const watcher=f.state.profile.cards[0].id;
  await f.act('stackCreate',{name:'이동 감지'});
  await f.act('stackEdit',{name:'이동 감지',effects:[
    {...allyDraw,when:'handEntered',zoneOwner:'named',zoneOwnerName:'감시 대상',zoneCard:'any',amount:5}
  ]});
  await f.act('passive',{passive:{name:'지정 카드 감지',effects:[
    {...allyDraw,zoneCard:'specific',zoneCardId:'strike',to:'target',amount:7},
    {...allyDraw,when:'zoneEntered',zoneOwner:'enemy',zoneCard:'any',amount:20}
  ]}});
  await f.act('card',{card:{...source,name:'아군에게 뽑기',effects:[
    {kind:'stack',when:'use',to:'self',tag:'이동 감지',amount:1},
    {kind:'draw',when:'use',to:'allAllies',amount:1}
  ]}});
  const trigger=f.state.profile.cards.find(card=>card.name==='아군에게 뽑기').id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    b.units.enemy.blockedRounds=1;
    b.units.ally={...structuredClone(self),id:'ally',name:'감시 대상',bot:true,pos:1,zero:'spent',
      passives:[],stackTraits:{},stackDefinitions:{},startingCards:['strike'],hand:['guard','guard','guard','guard'],
      deck:['strike'],grave:[],exile:[]};
    Object.assign(self,{startingCards:[watcher,trigger],hand:[trigger,'guard','guard','guard','guard'],shield:0});
  });
  await f.act('plan',{card:trigger,targets:[]});
  await f.act('round');
  assert.equal(livingForm(f).shield,7);
  assert.equal(livingForm(f,'ally').shield,7);
});

test('life steal filters actual card, passive and keyword damage and expires after its duration',async()=>{
  const f=await fixture();
  const rule={kind:'lifeSteal',when:'use',to:'self',leechHeal:'dealer',leechVictim:'enemy',duration:2};
  await f.act('card',{card:{name:'흡혈 부여',power:'0',role:'normal',range:'0',target:'self',effects:[
    {...rule,leechDamage:'card',amount:50,healCap:3},
    {...rule,leechDamage:'stack',amountMode:'fixed',amount:20},
    {...rule,leechDamage:'passive',amount:100,leechHeal:'victim'}
  ]}});
  await f.act('card',{card:{name:'흡혈 판정',power:'0',role:'normal',range:'1~4',target:1,effects:[
    {kind:'damage',when:'hit',to:'target',amount:8},
    {kind:'stack',when:'hit',to:'target',tag:'침식',amount:3}
  ]}});
  await f.act('passive',{passive:{name:'패시브 피해',effects:[{kind:'damage',when:'hit',to:'target',amount:5}]}});
  const activation=f.state.profile.cards.find(c=>c.name==='흡혈 부여').id;
  const attack=f.state.profile.cards.find(c=>c.name==='흡혈 판정').id;
  await f.act('start',{solo:true,bots:0});
  async function play(id,targets,setup){
    configureBattle(f,(b,self)=>{
      Object.assign(self,{hand:[id],pos:16,mind:50});
      Object.assign(b.units.enemy,{blockedRounds:1,pos:18});
      setup?.(self,b.units.enemy);
    });
    await f.act('plan',{card:id,targets});
    await f.act('round');
  }
  await play(activation,[],self=>{self.hp=20;});
  assert.equal(livingForm(f).lifeStealThrough,2);
  await play(attack,['enemy'],(_self,enemy)=>{enemy.shield=2;});
  assert.equal(livingForm(f).hp,26);
  assert.equal(livingForm(f,'enemy').hp,43);
  assert.equal(livingForm(f).lifeStealThrough,undefined);
  await play(attack,['enemy']);
  assert.equal(livingForm(f).hp,26);
});

test('life steal can use pre-reduction damage and count or exclude fully blocked shield damage',async()=>{
  for(const [basis,shield,barrier,expected] of [
    ['actual','exclude',0,4],['raw','exclude',0,10],
    ['actual','exclude',4,0],['actual','include',4,4],
    ['raw','exclude',4,0],['raw','include',4,10],['raw','exclude',2,8]
  ]){
    const f=await fixture();
    await f.act('card',{card:{name:'흡수 기준',role:'normal',power:'0',range:'1~4',target:1,effects:[
      {kind:'lifeSteal',when:'use',to:'self',amount:100,leechBasis:basis,leechShield:shield,leechRecovery:'mind'},
      {kind:'damage',when:'use',to:'target',amount:10}
    ]}});
    const id=f.state.profile.cards[0].id;
    await f.act('start',{solo:true,bots:0});
    configureBattle(f,(b,self)=>{
      Object.assign(self,{hand:[id],pos:16,mind:50});
      Object.assign(b.units.enemy,{blockedRounds:1,pos:18,reduce:6,shield:barrier});
    });
    await f.act('plan',{card:id,targets:['enemy']});
    await f.act('round');
    assert.equal(livingForm(f).mind,50+expected,[basis,shield,barrier].join('/'));
  }
});

test('life steal converts mental damage to health using the selected resistance basis',async()=>{
  for(const [basis,expected] of [['actual',4],['raw',8]]){
    const f=await fixture();
    await f.act('card',{card:{name:'정신 피해 흡수',role:'normal',power:'0',range:'0',target:'self',effects:[
      {kind:'lifeSteal',when:'use',to:'self',amount:100,leechResource:'mind',leechBasis:basis,leechVictim:'self'},
      {kind:'drain',when:'use',to:'self',amount:8}
    ]}});
    const id=f.state.profile.cards[0].id;
    await f.act('start',{solo:true,bots:0});
    configureBattle(f,(b,self)=>{
      Object.assign(self,{hand:[id],hp:30,mind:50,mindStatuses:{mindGuard:{amount:50,through:1}}});
      b.units.enemy.blockedRounds=1;
    });
    await f.act('plan',{card:id,targets:[]});
    await f.act('round');
    assert.equal(livingForm(f).mind,46);
    assert.equal(livingForm(f).hp,30+expected);
  }
});

test('battle-long life steal supports shared or split formulas with percentage caps',async()=>{
  for(const [formula,mind] of [['shared',54],['split',53]]){
    const f=await fixture();
    const base={role:'normal',power:'0'};
    await f.act('card',{card:{...base,name:'전투 흡수',range:'0',target:'self',effects:[
      {kind:'lifeSteal',when:'use',to:'self',amount:100,leechRecovery:'both',leechFormula:formula,
        duration:0,healCap:50,capMode:'percent',mindAmount:3,mindMode:'fixed',mindCap:50,mindCapMode:'percent'}
    ]}});
    await f.act('card',{card:{...base,name:'후속 공격',range:'1~4',target:1,effects:[
      {kind:'damage',when:'use',to:'target',amount:8}
    ]}});
    const use=f.state.profile.cards.find(c=>c.name==='전투 흡수').id;
    const strike=f.state.profile.cards.find(c=>c.name==='후속 공격').id;
    await f.act('start',{solo:true,bots:0});
    for(const [id,targets] of [[use,[]],[strike,['enemy']]]){
      configureBattle(f,(b,self)=>{
        Object.assign(self,{hand:[id],pos:16,hp:20,mind:50});
        Object.assign(b.units.enemy,{blockedRounds:1,pos:18,shield:0});
      });
      await f.act('plan',{card:id,targets});
      await f.act('round');
    }
    assert.deepEqual(livingForm(f).damageConversions,[{shield:false,through:null}]);
    assert.equal(livingForm(f).hp,24);
    assert.equal(livingForm(f).mind,mind);
  }
});

test('shield conversion can replenish the selected victim using only absorbed damage without masking shield break',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'방어막 환류',role:'normal',power:'8',range:'1~4',target:1,effects:[
    {kind:'shieldConversion',when:'use',to:'self',leechVictim:'selected',leechHeal:'victim',
      leechDamage:'strike',leechRecovery:'shield',amount:50},
    {kind:'shieldBreakDraw',when:'hit',to:'self',amount:1}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{hand:[id,'guard','guard','guard','guard'],deck:['strike'],pos:16,mind:50});
    Object.assign(b.units.enemy,{blockedRounds:1,pos:18,shield:6});
  });
  await f.act('plan',{card:id,targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,52);
  assert.equal(livingForm(f,'enemy').shield,3);
  assert.ok(livingForm(f).hand.some(card=>card.id==='strike'));
});

test('timed effects can ignore, refresh or extend and respect a calculated duration cap',async()=>{
  for(const [policy,through] of [['ignore',3],['refresh',4],['extend',5]]){
    const f=await fixture();
    await f.act('card',{card:{name:'지속 재적용',role:'normal',power:'0',range:'0',target:'self',effects:[
      {kind:'mindGuard',when:'use',to:'self',amount:25,duration:3,durationPolicy:policy,
        numberExprs:{durationCap:{type:'math',op:'add',terms:[{type:'number',value:2},{type:'number',value:2}]}}}
    ]}});
    const id=f.state.profile.cards[0].id;
    await f.act('start',{solo:true,bots:0});
    for(let round=1;round<=2;round++){
      configureBattle(f,(b,self)=>{self.hand=[id];b.units.enemy.blockedRounds=1;});
      await f.act('plan',{card:id,targets:[]});
      await f.act('round');
    }
    assert.equal(livingForm(f).mindStatuses.mindGuard.through,through,policy);
  }
});

test('built-in stack keywords grant next-round movement and heal from card or shield damage',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'부 키워드 얻기',role:'normal',power:'0',range:'0',target:'self',effects:
    ['신속','흡혈','방벽 회생'].map(tag=>({kind:'stack',when:'use',tag,to:'self',amount:2}))
  }});
  await f.act('card',{card:{name:'피해 넣기',role:'normal',power:'0',range:'1~4',target:1,effects:[
    {kind:'damage',when:'use',to:'target',amount:20}
  ]}});
  const get=f.state.profile.cards.find(c=>c.name==='부 키워드 얻기').id;
  const attack=f.state.profile.cards.find(c=>c.name==='피해 넣기').id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{hand:[get],pos:16,hp:20});
    Object.assign(b.units.enemy,{blockedRounds:1,pos:18});
  });
  await f.act('plan',{card:get,targets:[]});
  await f.act('round');
  assert.equal(livingForm(f).move,4);
  assert.equal(livingForm(f).stacks.흡혈,1);
  configureBattle(f,(b,self)=>{
    Object.assign(self,{hand:[attack],shield:10,mind:50});
    b.intent={...b.intent,card:{...b.intent.card,power:'10',range:'1~4',effects:[]},target:self.id,reachable:true};
    b.units.enemy.blockedRounds=0;
  });
  await f.act('plan',{card:attack,targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f).hp,22);
  assert.equal(livingForm(f).stacks.흡혈,0);
  assert.equal(livingForm(f).stackTraits.흡혈,undefined);
});

test('perforation strikes build capped persistent marks and the finisher spends them after its base hit',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:['conceptPerforate'],mind:64});
    self.library.conceptPerforate={...self.library.conceptPerforate,power:'10',hitPowers:['10','10']};
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:1});b.walls=[];
  });
  await f.act('plan',{card:'conceptPerforate',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f).mind,50);
  assert.equal(livingForm(f,'enemy').stacks['절취선'],2);
  assert.equal(livingForm(f,'enemy').hp,979);
  // Leaving the marks for a teammate keeps the 10% vulnerability active.
  configureBattle(f,(b,self)=>{
    Object.assign(self,{hand:['hold'],mind:50});self.library.hold={...self.library.hold,power:'20'};
    b.units.enemy.blockedRounds=1;
  });
  await f.act('plan',{card:'hold',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,957);
  assert.equal(livingForm(f,'enemy').stacks['절취선'],2);
  configureBattle(f,(b,self)=>{
    Object.assign(self,{hand:['conceptTearOpen'],mind:70});
    self.library.conceptTearOpen={...self.library.conceptTearOpen,power:'10'};
    b.units.enemy.blockedRounds=1;
  });
  await f.act('plan',{card:'conceptTearOpen',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f).mind,50);
  assert.equal(livingForm(f,'enemy').hp,938); // Base 11, then 2 consumed marks × 4.
  assert.equal(livingForm(f,'enemy').stacks['절취선'],0);
  assert.equal(livingForm(f,'enemy').stackTraits['절취선'],undefined);
  // Another finisher cannot spend marks that have already been removed.
  configureBattle(f,(b,self)=>{self.hand=['conceptTearOpen'];self.mind=70;b.units.enemy.blockedRounds=1;});
  await f.act('plan',{card:'conceptTearOpen',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,928);
  for(let turn=0;turn<4;turn++){
    configureBattle(f,(b,self)=>{self.hand=['conceptPerforate'];self.mind=64;b.units.enemy.blockedRounds=1;});
    await f.act('plan',{card:'conceptPerforate',targets:['enemy']});
    await f.act('round');
  }
  assert.equal(livingForm(f,'enemy').stacks['절취선'],6);
});

test('round cleanup discards multiple copies and only tops up the remaining hand',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{hand:['strike','strike','guard','hold','shot'],deck:['rush'],grave:[]});
    b.units.enemy.blockedRounds=1;
  });
  await f.act('plan',{cards:[],discard:['strike','strike']});
  await f.act('round');
  assert.deepEqual(livingForm(f).hand.map(c=>c.id),['guard','hold','shot','rush']);
  assert.equal(livingForm(f).graveCount,2);
});

test('shield slots honor caps and keep their original expiry when duration refresh is disabled',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'지속 보호막',power:'0',role:'normal',range:'0',target:'self',effects:[
    {when:'use',kind:'shield',to:'self',amount:5,duration:2,cap:8,shieldSource:'ward',refreshDuration:false}
  ]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0});
  for(const expected of [5,0]){
    configureBattle(f,(b,self)=>{self.hand=[id];b.units.enemy.blockedRounds=1;});
    await f.act('plan',{card:id});
    await f.act('round');
    assert.equal(livingForm(f).shield,expected);
  }
  assert.equal(livingForm(f).shieldSlots,undefined);
});

test('GM-only effect contents are removed from shared cards and only the public hint reaches guests',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'관찰자'});
  await f.act('card',{card:{name:'감춘 카드',role:'normal',power:'0',range:'0',target:'self',effects:[
    {kind:'shield',when:'use',to:'self',amount:3},
    {kind:'mind',when:'end',to:'self',amount:87,gmOnly:true,flavor:'숨겨진 원문',publicHint:'기묘한 잔향'}
  ]}});
  await f.act('cardShare',{id:f.state.profile.cards[0].id});
  const gm=f.state.sharedCards[0].card;
  const publicResponse=await f.send(f.endpoint,undefined,guest.cookie);
  const card=publicResponse.body.sharedCards[0].card;
  assert.equal(gm.effects[1].amount,87);
  assert.deepEqual(card.effects.map(effect=>effect.kind),['shield']);
  assert.deepEqual(card.publicHints,['기묘한 잔향']);
  assert.ok(!JSON.stringify(publicResponse.body).includes('숨겨진 원문'));
});

test('activity locations seed enemy intel and server keeps unknown enemy power out of guest state',async()=>{
  for(const [activityLocations,progress] of [[[],0],[['제6국','제6국','제6국 외곽'],25]]){
    const f=await fixture();
    const guest=await f.send(f.room+'/join',{name:'정보 수집가'});
    await f.send(f.room+'/seat',{id:f.state.me,seat:1},f.host.cookie);
    await f.send(f.room+'/seat',{id:guest.body.me,seat:2},f.host.cookie);
    await f.act('profile',{name:'카이',country:'제6국',status:'하위층 시민',stats:[50,50,50,50,50,50],activityLocations});
    await f.act('start',{bots:0});
    const view=(await f.send(f.endpoint,undefined,guest.cookie)).body;
    const foe=view.battle.units.find(unit=>unit.enemy);
    assert.equal(foe.intelProgress,progress);
    assert.equal(foe.overlapCount,progress?1:0);
    assert.equal(view.battle.intent.card.power,progress?'2d+2':undefined);
    assert.equal(f.state.battle.intent.card.power,'2d+2');
    assert.ok(!view.battle.units.some(unit=>Object.hasOwn(unit,'activityLocations')));
  }
});

test('direct attacks cannot target through a wall, while tile targeting is exempt from LOS',async()=>{
  const {gridCardHasReach}=await import('../public/grid.js');
  const direct={range:'1~4',target:1};
  assert.equal(gridCardHasReach(direct,16,20,[18]),false);
  assert.equal(gridCardHasReach(direct,0,18,[9]),false);
  assert.equal(gridCardHasReach({...direct,target:'tile'},16,20,[18]),true);
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:['shot']});
    b.units.enemy.pos=20;
    b.walls=[18];
  });
  const result=await f.send(f.endpoint,{action:'plan',revision:f.state.revision,card:'shot',targets:['enemy']},f.host.cookie);
  assert.equal(result.status,400);
});

test('a fully collapsed passenger only recovers at train return',async()=>{
  const f=await fixture();
  await f.act('passive',{passive:{name:'정신 구조',effects:[{kind:'clearCollapse',when:'turnEnd',to:'self',amount:90}]}});
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{collapsed:true,mind:0,zero:null,blockedRounds:1});
    b.units.enemy.blockedRounds=1;
  });
  await f.act('round');
  assert.equal(livingForm(f).collapsed,true);
  assert.equal(livingForm(f).mind,0);
  await f.act('reset');
  assert.equal(f.state.profile.mind,25);
});

test('player stamina determines starting HP and left-wall seats stay distinct',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'동료'});
  await f.send(f.room+'/seat',{id:f.state.me,seat:1},f.host.cookie);
  await f.send(f.room+'/seat',{id:guest.body.me,seat:2},f.host.cookie);
  await f.act('profile',{name:'체력 시험',country:'제6국',status:'하위층 시민',stats:[38,50,62,50,50,50]});
  await f.act('start',{bots:0});
  assert.equal(livingForm(f).hp,112);
  assert.equal(livingForm(f).maxHp,112);
  assert.equal(livingForm(f).pos,0);
  assert.equal(livingForm(f,guest.body.me).hp,100);
  assert.equal(livingForm(f,guest.body.me).pos,8);
});

test('train rewind keeps observation, permanently removes a copy, and requires a newly named replacement',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    self.mind=45;
    b.intel.enemy={progress:58,overlap:0,tier:2};
  });
  await f.act('reset');
  const checkpointId=f.state.campaign.checkpoints[0].id;
  const source=f.state.campaign.checkpoints[0].candidates[0].cards[0];
  await f.act('loopRevert',{checkpointId,cardId:source.id});
  assert.equal(f.state.campaign.loopCount,1);
  assert.equal(f.state.campaign.ownDeck.length,9);
  const send=(action,payload)=>f.send(f.endpoint,{action,revision:f.state.revision,...payload},f.host.cookie);
  assert.equal((await send('start',{solo:true,bots:0})).status,400);
  const replacement={name:'새로 쓴 객차 기록',power:'1d6',range:1,cost:0};
  assert.equal((await send('loopRefill',{...replacement,name:[...source.name].join(' ')})).status,400);
  await f.act('loopRefill',replacement);
  const authored=f.state.campaign.lostCards[0].replacedBy;
  assert.equal(f.state.campaign.ownDeck.length,10);
  await f.act('start',{solo:true,bots:0});
  assert.equal(livingForm(f).mind,45);
  assert.equal(livingForm(f,'enemy').intelProgress,58);
  await f.act('reset');
  const next=f.state.campaign.checkpoints[0].candidates[0].cards.find(card=>card.id!==authored&&card.id!==source.id);
  await f.act('loopRevert',{checkpointId,cardId:next.id});
  assert.equal(f.state.campaign.ownDeck.length,9);
  assert.ok(f.state.campaign.ownDeck.some(card=>card.id===authored));
  assert.equal(f.state.campaign.lostCards.length,2);
});

test('first stop loads a 225 HP foe and resolves peaceful and brute-force extraction separately',async()=>{
  for(const peaceful of [true,false]){
    const f=await fixture();
    await f.act('start',{solo:true,bots:0,encounter:'stop01'});
    const {battle}=f.state;
    assert.equal(livingForm(f,'enemy').hp,225);
    assert.equal(battle.encounter.deckSize,8);
    assert.ok([7,15,23,31,39].every(index=>battle.walls.includes(index)));
    assert.equal(battle.intent.card.id,'stopEye');
    configureBattle(f,(b,self)=>{
      self.pos=21;
      self.mind=40;
      b.encounter.peaceOpen=peaceful;
      b.encounter.peace=peaceful?1:0;
      if(!peaceful)b.units.enemy.hp=0;
    });
    await f.act('plan',{pos:21});
    await f.act('round');
    assert.equal(f.state.battle.phase,'finished');
    if(peaceful){
      assert.equal(f.state.battle.outcome.tier,'puzzleSolved');
      assert.equal(f.state.battle.outcome.extract,undefined);
      assert.equal(f.state.profile.mind,100);
      assert.deepEqual(f.state.profile.orbs,['orbDarkHalo']);
      assert.ok(f.state.defaults.some(card=>card.id==='conceptForgive'));
      await f.act('deck',{cards:['conceptForgive','strike','strike','guard','guard','hold','hold','shot','shot','rush']});
      await f.act('reset');
      await f.act('start',{solo:true,bots:0});
      configureBattle(f,(b,self)=>{
        Object.assign(self,{hand:['conceptForgive'],poison:6,mind:70});
        b.units.enemy.blockedRounds=1;
      });
      await f.act('plan',{card:'conceptForgive',targets:[f.state.me]});
      await f.act('round');
      assert.equal(livingForm(f).shield,14);
      assert.equal(livingForm(f).poison,0);
      assert.equal(livingForm(f).stacks['죄 사함의 광배'],1);
    }else{
      assert.equal(f.state.battle.outcome.tier,'bruteKill');
      assert.equal(f.state.battle.outcome.extract.rolls.length,2);
      assert.equal(f.state.battle.outcome.extract.need,10);
    }
  }
});

test('an explicit interceptor becomes the enemy target on losing the clash',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'예고 대상'});
  await f.send(f.room+'/seat',{id:f.state.me,seat:1},f.host.cookie);
  await f.send(f.room+'/seat',{id:guest.body.me,seat:2},f.host.cookie);
  await f.act('card',{card:{name:'가로채기 시험',power:'1',role:'normal',range:'1~4',target:1,clash:true,effects:[]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id],mind:50});
    b.units[guest.body.me].pos=18;
    b.units.enemy.pos=20;
    b.intent={target:guest.body.me,reachable:true,card:{...b.intent.card,power:'8',unredirectable:true}};
  });
  const payload={card:id,targets:['enemy'],stance:'intercept'};
  const rejected=await f.send(f.endpoint,{action:'plan',revision:f.state.revision,...payload},f.host.cookie);
  assert.equal(rejected.status,400);
  configureBattle(f,b=>{b.intent.card.unredirectable=false;});
  await f.act('plan',payload);
  const guestState=(await f.send(f.endpoint,undefined,guest.cookie)).body;
  const guestPlan=await f.send(f.endpoint,{action:'plan',revision:guestState.revision,cards:[]},guest.cookie);
  assert.equal(guestPlan.status,200);
  const result=await f.send(f.endpoint,{action:'round',revision:guestPlan.body.revision},f.host.cookie);
  assert.equal(result.status,200);
  assert.equal(result.body.battle.units.find(unit=>unit.id===f.state.me).hp,92);
  assert.equal(result.body.battle.units.find(unit=>unit.id===guest.body.me).hp,100);
});

test('collector counts actual card uses, applies compound interest, and pauses its fixed deck on negotiation',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0,encounter:'collector01'});
  assert.equal(livingForm(f,'enemy').hp,340);
  assert.equal(f.state.battle.intent.card.id,'collectReceipt');
  configureBattle(f,(b,self)=>{
    Object.assign(self,{baseActions:3,hand:['guard','guard','guard'],shield:0});
    b.units.enemy.blockedRounds=1;
  });
  await f.act('plan',{cards:[{card:'guard'},{card:'guard'},{card:'guard'}]});
  await f.act('round');
  assert.equal(livingForm(f).stacks['미수금'],3);
  configureBattle(f,(b,self)=>{
    self.stacks['미수금']=1;
    delete self.stackRuns?.['미수금'];
    b.units.enemy.blockedRounds=1;
  });
  await f.act('plan',{cards:[]});
  await f.act('round');
  assert.equal(livingForm(f).stacks['미수금'],0);
  assert.equal(f.state.battle.encounter.negotiating,true);
  assert.equal(f.state.battle.intent.reachable,false);
});

test('collector seizes the highest expected power copy and leaves the duplicate available',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0,encounter:'collector01'});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:['shot','strike','shot','hold'],baseActions:2,stacks:{미수금:4},mind:50});
    self.library.shot={...self.library.shot,power:'16'};
    b.units.enemy.pos=18;
    b.intent={target:self.id,reachable:true,card:{...b.intent.card,id:'collectOverdue',power:'1',range:'1~3',
      effects:[{when:'hit',kind:'collector:collectOverdue',amount:1,to:'target',condition:''}]}};
  });
  await f.act('plan',{cards:[]});
  await f.act('round');
  assert.equal(livingForm(f).sealedHighest?.id,'shot',JSON.stringify(f.state.battle.log));
  assert.equal(livingForm(f).sealedHighest.index,0);
  const rejected=await f.send(f.endpoint,{action:'plan',revision:f.state.revision,
    cards:[{card:'shot',targets:['enemy']},{card:'shot',targets:['enemy']}]},f.host.cookie);
  assert.equal(rejected.status,400);
  await f.act('plan',{card:'shot',targets:['enemy']});
});

test('blind judge marks the actual damage leader and permits a nonattacking resolution',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'기여 계산',role:'normal',power:'0',range:'1~4',target:1,
    effects:[{kind:'damage',when:'hit',to:'target',amount:12}]}});
  const id=f.state.profile.cards[0].id;
  await f.act('start',{solo:true,bots:0,encounter:'judge01'});
  assert.equal(livingForm(f,'enemy').hp,560);
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,hand:[id]});
    Object.assign(b.units.enemy,{pos:18,blockedRounds:1,shield:3});
  });
  await f.act('plan',{card:id,targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f).judgmentMark,true);
  assert.equal(f.state.battle.encounter.rank[0].damage,9);
  assert.equal(f.state.battle.intent.card.id,'judgeAxe');
  assert.equal(f.state.battle.intent.card.hitPowers.length,2);
  configureBattle(f,b=>{b.units.enemy.blockedRounds=1;});
  await f.act('plan',{cards:[]});
  await f.act('round');
  assert.equal(f.state.battle.phase,'finished');
  assert.equal(f.state.battle.outcome.kind,'level');
});

test('rail squad rotates independent decks, keeps fighting after a member falls and resolves each intent once',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0,encounter:'railguard01'});
  const first=f.state.battle;
  assert.deepEqual(first.units.filter(unit=>unit.enemy).map(unit=>unit.hp),[220,200,150]);
  assert.deepEqual(first.intentQueue.map(intent=>intent.card.id),['railBlock','railWall','railScope']);
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:18,baseActions:2,hand:['strike','strike']});
    self.library.strike={...self.library.strike,power:'60',range:'1~4',effects:[],clash:true};
    b.units.enemy.hp=12;
    b.units.railShield.pos=12;
    b.units.railSniper.pos=22;
    b.walls=[];
    b.intentQueue[0].reachable=true;
    b.intentQueue[2].reachable=true;
    b.intentQueue[2].card={...b.intentQueue[2].card,id:'railPierce',range:'1~5',power:'1',
      unredirectable:false,support:false,effects:[]};
  });
  const same={card:'strike',targets:['enemy'],stance:'clash',foeIntent:'enemy'};
  const rejected=await f.send(f.endpoint,{action:'plan',revision:f.state.revision,cards:[same,same]},f.host.cookie);
  assert.equal(rejected.status,400);
  await f.act('plan',{cards:[same,{card:'strike',targets:['railSniper'],stance:'clash',foeIntent:'railSniper'}]});
  await f.act('round');
  assert.equal(f.state.battle.phase,'planning');
  assert.equal(livingForm(f,'enemy').subdued,true);
  assert.equal(f.state.battle.encounter.subdueOrder[0],'leader');
  assert.equal(f.state.battle.log.filter(line=>line.startsWith('합 방장')).length,2);
  assert.deepEqual(f.state.battle.intentQueue.map(intent=>intent.card.id),['railBash','railPierce']);
});

test('campaign slots and authenticated files restore a saved round for the room GM',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'참가 승객'});
  await f.act('start',{solo:true,bots:0,encounter:'collector01'});
  await f.act('saveSlot',{slot:1,label:'수금원 직전'});
  assert.equal(f.state.saveSlots[0].label,'수금원 직전');
  const file=(await f.send(f.endpoint,{action:'exportSave',slot:1},f.host.cookie)).body;
  assert.equal(file.format,'conceptterra-campaign-save');
  assert.equal(file.saveVersion,2);
  const hidden=await f.send(f.endpoint,{action:'exportSave',slot:1},guest.cookie);
  assert.equal(hidden.status,403);
  await f.act('plan',{cards:[]});
  await f.act('round');
  assert.equal(f.state.battle.round,2);
  const revision=f.state.revision;
  const bad=await f.send(f.endpoint+'?import=1',{action:'importSave',revision,file:{...file,iv:'AAAA'}},f.host.cookie);
  assert.equal(bad.status,400);
  await f.act('loadSlot',{slot:1});
  assert.equal(f.state.battle.round,1);
  await f.act('deleteSlot',{slot:1});
  assert.deepEqual(f.state.saveSlots,[]);
  await f.act('reset');
  const imported=await f.send(f.endpoint+'?import=1',{action:'importSave',revision:f.state.revision,file},f.host.cookie);
  assert.equal(imported.status,200,JSON.stringify(imported.body));
  assert.equal(imported.body.battle.round,1);
  assert.equal(imported.body.battle.intent.card.id,'collectReceipt');
});

test('bright plaza keeps phase one concealed and washes a full party back to the train',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'관찰자'});
  await f.act('start',{solo:true,bots:0,encounter:'blight01'});
  assert.equal(livingForm(f,'enemy').hp,666);
  assert.equal(f.state.battle.encounter.stage,1);
  const view=await f.send(f.endpoint,undefined,guest.cookie);
  assert.equal(view.body.battle.encounter.stage,undefined);
  assert.equal(view.body.battle.encounter.holder,undefined);
  configureBattle(f,(b,self)=>{
    self.stacks['황홀한 빛']=4;
    b.intent.card={...b.intent.card,id:'blissWhisper'};
  });
  await f.act('plan',{cards:[]});
  await f.act('round');
  assert.equal(f.state.battle.result,'패배');
  assert.equal(f.state.battle.outcome.kind,'brainwashed');
  assert.ok(f.state.battle.log.some(line=>line.includes('황홀한 빛 5 · 세뇌')));

  assert.equal(f.state.profile.mind,25);
});

test('bright plaza changes decks, absolves a controlled passenger, and transforms the existing card',async()=>{
  const f=await fixture();
  const row=f.DB.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(f.host.body.code).first();
  const saved=JSON.parse(row?.state||'{"profiles":{}}');
  saved.profiles[f.state.me]={cards:[],deck:[],orbs:['orbDarkHalo']};
  await f.act('profile',{name:'광배 승객',country:'제6국',status:'하위층 시민',stats:[50,50,50,50,50,50]});
  const state=JSON.parse(f.DB.prepare('SELECT state FROM game_states WHERE room_code = ?').bind(f.host.body.code).first().state);
  state.profiles[f.state.me]={...state.profiles[f.state.me],...saved.profiles[f.state.me]};
  f.DB.prepare('UPDATE game_states SET state = ? WHERE room_code = ?').bind(JSON.stringify(state),f.host.body.code).run();
  await f.act('start',{solo:true,bots:1,encounter:'blight01'});
  configureBattle(f,(b,self)=>{
    const bot=b.units.bot0;
    Object.assign(self,{pos:18,mind:1});
    Object.assign(bot,{pos:17,mind:0,brainwashed:true,collapsed:true,controlledIndex:0});
    bot.stacks['황홀한 빛']=5;
    b.units.enemy.pos=21;
    b.units.enemy.blockedRounds=1;
    b.walls=[];
  });
  await f.act('plan',{cards:[]});
  await f.act('round');
  assert.equal(f.state.battle.encounter.stage,2);
  assert.equal(f.state.battle.encounter.deckSize,6);
  assert.equal(livingForm(f,'conceptDawn').hp,1225);
  assert.equal(livingForm(f).hand.find(card=>card.id==='conceptForgive').cost,0);
  assert.equal(livingForm(f).hand.find(card=>card.id==='conceptForgive').freeAction,true);
  configureBattle(f,(b,self)=>{self.actionPenalty=self.baseActions||1;});
  await f.act('plan',{cards:[{card:'conceptForgive',targets:['bot0']}]});
  await f.act('round');
  assert.equal(f.state.battle.encounter.stage,3);
  assert.equal(livingForm(f,'conceptDawn').hp,0);
  assert.equal(livingForm(f,'bot0').collapsed,false);
  assert.ok(f.state.battle.log.some(line=>line.includes('황홀한 빛 5 대속')));
  assert.ok(livingForm(f,'bot0').mind>=25);
  assert.equal(livingForm(f).hand.find(card=>card.id==='conceptForgive').name,'사면 · 거짓을 삼키는 밤');
  await f.act('plan',{card:'conceptForgive',targets:['enemy']});
  await f.act('round');
  assert.equal(f.state.battle.outcome.kind,'swallowed');
  assert.ok(f.state.profile.orbs.includes('orbColdLamp'));
  assert.equal(f.state.battle.result,'승리');
});

test('vault guardian generates an attack, consumes coins, and removes the generated card after use',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    self.pos=18; self.mind=80; self.hand=['conceptSafeStart']; self.deck=[]; self.grave=[];
    Object.assign(b.units.enemy,{pos:19,hp:999,maxHp:999,blockedRounds:2});
    b.walls=[];
  });
  await f.act('plan',{card:'conceptSafeStart',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f).stacks['비축 금화'],3);
  assert.equal(livingForm(f).shield,10);
  assert.ok(livingForm(f).hand.some(card=>card.id==='conceptSafeStrike'));
  const before=livingForm(f,'enemy').hp;
  await f.act('plan',{card:'conceptSafeStrike',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f).stacks['비축 금화']||0,0);
  assert.ok(before-livingForm(f,'enemy').hp>=15);
  assert.ok(!livingForm(f).hand.some(card=>card.id==='conceptSafeStrike'));
});

test('snail shell leaves a trail and its generated zero-power roll shoves the enemy',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:1});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:80,hand:['conceptSnailStart']});
    Object.assign(b.units.bot0,{pos:18,blockedRounds:2});
    Object.assign(b.units.enemy,{pos:19,hp:999,maxHp:999,blockedRounds:2});
    b.walls=[];
  });
  await f.act('plan',{card:'conceptSnailStart',targets:['bot0']});
  await f.act('round');
  assert.equal(livingForm(f,'bot0').stacks['바위 껍질'],2);
  assert.equal(livingForm(f,'bot0').shield,16);
  assert.ok(livingForm(f).hand.some(card=>card.id==='conceptSnailRoll'));
  configureBattle(f,(b,self)=>{
    const bot=b.units.bot0;
    self.pos=18;
    bot.pos=10;
    bot.blockedRounds=0;
    b.plans.bot0={cards:[],pos:11,discard:[]};
  });
  await f.act('plan',{card:'conceptSnailRoll',targets:['enemy']});
  await f.act('round');
  assert.equal(f.state.battle.tiles[10].source,'bot0');
  assert.equal(livingForm(f,'enemy').hp,999);
  assert.equal(livingForm(f,'enemy').pos,21);
});

test('plummet clears its shield, consumes overpressure, and pierces defenses',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:80,shield:14,hand:['conceptPlummetStart']});
    Object.assign(b.units.enemy,{pos:20,hp:999,maxHp:999,blockedRounds:2,shield:100});
    b.walls=[];
  });
  await f.act('plan',{card:'conceptPlummetStart',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f).shield,0);
  assert.equal(livingForm(f).stacks['충전 과압'],3);
  assert.ok(livingForm(f).hand.some(card=>card.id==='conceptPlummetDrop'));
  const before=livingForm(f,'enemy');
  await f.act('plan',{card:'conceptPlummetDrop',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f).stacks['충전 과압']||0,0);
  assert.equal(livingForm(f).blockedRounds,1);
  assert.equal(livingForm(f,'enemy').shield,before.shield);
  assert.ok(livingForm(f,'enemy').hp<before.hp);
});
test('heron tile rescues a low-health passenger and leaves a spring',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:80,hp:40,maxHp:100,hand:['conceptHeronSpring']});
    b.units.enemy.blockedRounds=2;
    b.walls=[];
  });
  await f.act('plan',{card:'conceptHeronSpring',targetTile:17});
  await f.act('round');
  assert.equal(livingForm(f).hp,75);
  assert.equal(livingForm(f).stacks['맑은 물결'],1);
  assert.equal(f.state.battle.tiles[17].kind,'spring');
});

test('stitch attacks seven times at seven stacks and bounds reactions per action',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:80,hand:['conceptStitchSeam']});
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:2});
    b.units.enemy.stacks['바늘땀']=7;
    b.walls=[];
  });
  await f.act('plan',{card:'conceptStitchSeam',targets:['enemy']});
  await f.act('round');
  assert.ok(f.state.battle.log.some(line=>line.includes('7타 위력')));
  assert.ok(livingForm(f,'enemy').hp<=999-(7*7+14));
  assert.equal(livingForm(f).stacks['집중'],2);
});
test('triface gathers a stack and consumes it with the generated bloom',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:80,hand:['conceptTrifaceStart']});
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:2});
    b.walls=[10,26];
  });
  await f.act('plan',{card:'conceptTrifaceStart',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').stacks['삼면점'],2);
  assert.ok(livingForm(f).hand.some(card=>card.id==='conceptTrifaceBloom'));
  await f.act('plan',{card:'conceptTrifaceBloom',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').stacks['삼면점']||0,0);
  assert.equal(livingForm(f,'enemy').rooted,true);
});

test('red itch grows, supports bleed survival, and transfers bleed on hit',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:80,hp:2,hand:['conceptFleshNails']});
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:3});
    b.walls=[];
  });
  await f.act('plan',{card:'conceptFleshNails'});
  await f.act('round');
  assert.equal(livingForm(f).stacks['붉은 소양감'],2);
  assert.deepEqual(livingForm(f).redBleed,{power:4,count:2});
  await f.act('plan',{cards:[]});
  await f.act('round');
  assert.equal(livingForm(f).hp,1);
  configureBattle(f,(b,self)=>{self.hand=['strike'];});
  await f.act('plan',{card:'strike',targets:['enemy']});
  await f.act('round');
  assert.ok(livingForm(f,'enemy').redBleed.power>=4);
});
test('blind scales preserve a guaranteed crit charge and ignore outgoing damage cuts',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:80,nextPower:-99,outgoingDamagePercent:-100,critCharges:1,hand:['conceptBlindJudge']});
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:2});
    b.walls=[];
  });
  await f.act('plan',{card:'conceptBlindJudge',targets:['enemy']});
  await f.act('round');
  assert.ok(livingForm(f,'enemy').hp<980);
  assert.equal(livingForm(f).critCharges,1);
  assert.ok(!f.state.battle.log.some(line=>line.includes('치명타 (')));
});
test('guest prepares a generated follow-up and protects its isolated caster',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:80,hand:['conceptGuestStart']});
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:2,cardUseCounts:{execute:3}});
    b.walls=[];
  });
  await f.act('plan',{card:'conceptGuestStart',targets:['enemy']});
  await f.act('round');
  assert.ok(livingForm(f).hand.some(card=>card.id==='conceptGuestAgain'));
  assert.ok(livingForm(f).guestRim>=f.state.battle.round);
  await f.act('plan',{card:'conceptGuestAgain',targets:['enemy']});
  await f.act('round');
  assert.equal(livingForm(f,'enemy').guestPenalty.card,'execute');
  assert.ok(livingForm(f).guestMelee>=f.state.battle.round);
  assert.ok(!livingForm(f).hand.some(card=>card.id==='conceptGuestAgain'));
});

test('guest replays the previous other unit card effect onto its own target',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:1});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:80,baseActions:2,hand:['strike','conceptGuestStart']});
    const bot=b.units.bot0;
    bot.pos=9;
    bot.hand=['hold'];
    bot.library.hold={...bot.library.hold,role:'normal',target:'self',range:'0',effects:[
      {when:'use',kind:'shield',amount:12,to:'self'}
    ]};
    b.plans.bot0={pos:9,card:'hold',targets:[],discard:[]};
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:2});
    b.walls=[];
  });
  await f.act('plan',{cards:[{card:'strike',targets:['enemy']},{card:'conceptGuestStart',targets:['enemy']}]});
  await f.act('round');
  assert.ok(f.state.battle.log.some(line=>line.includes('1개 부가 효과 받아 적음')));
  assert.equal(livingForm(f,'enemy').shield,12);
});

test('attendance waits one round and produces a three-hit capture for an idle target',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:90,hand:['conceptCommuteStart'],deck:[]});
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:3});b.walls=[];
  });
  await f.act('plan',{card:'conceptCommuteStart',targets:['enemy']});await f.act('round');
  assert.ok(!livingForm(f).hand.some(card=>card.id==='conceptCommuteSeize'));
  await f.act('plan',{cards:[]});await f.act('round');
  const capture=livingForm(f).hand.find(card=>card.id==='conceptCommuteSeize');
  assert.equal(capture.hitPowers.length,3);
  await f.act('plan',{card:capture.id,targets:['enemy']});await f.act('round');
  assert.equal(livingForm(f,'enemy').rooted,true);
});
test('scribe rewinds health, mind, and position within the cap without changing stacks',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:90,hand:['conceptScribeStart'],deck:[]});
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:3});b.walls=[];
  });
  await f.act('plan',{card:'conceptScribeStart',targets:[f.state.me]});await f.act('round');
  assert.equal(livingForm(f).scribeRecord.pos,17);
  configureBattle(f,(b,self)=>{self.hp=30;self.mind=70;self.pos=16;self.stacks['시험']=2;});
  await f.act('plan',{card:'conceptScribeRewind',targets:[f.state.me]});await f.act('round');
  assert.equal(livingForm(f).hp,70);
  assert.equal(livingForm(f).pos,17);
  assert.equal(livingForm(f).stacks['시험'],2);
  assert.equal(livingForm(f).scribeRecord,undefined);
});
test('artist collects colors and consumes them for a balanced masterpiece',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:95,hand:['conceptArtistStart'],deck:[]});
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:3});b.walls=[];
  });
  await f.act('plan',{card:'conceptArtistStart',targetTile:18});await f.act('round');
  assert.ok(livingForm(f).inks.magenta>0);
  assert.ok(livingForm(f).inks.cyan>0);
  configureBattle(f,(b,self)=>{self.inks={magenta:100,cyan:100,yellow:100,black:100};self.stacks['영감']=400;});
  const hp=livingForm(f,'enemy').hp;
  await f.act('plan',{card:'conceptArtistFinish',targetTile:18});await f.act('round');
  assert.ok(livingForm(f,'enemy').hp<hp-200);
  assert.deepEqual(livingForm(f).inkBuff,['magenta','cyan','yellow','black']);
  assert.equal(livingForm(f).inks,undefined);
});
test('approach can flank across walls and disrupts a conceptual enemy',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,mind:95,hand:['conceptApproach']});
    Object.assign(b.units.enemy,{pos:21,hp:999,maxHp:999,conceptEntity:true,blockedRounds:3});b.walls=[18,20];
  });
  await f.act('plan',{card:'conceptApproach',targets:['enemy']});await f.act('round');
  assert.equal(livingForm(f).pos,22);
  assert.ok(livingForm(f,'enemy').ruleConfusion>=f.state.battle.round);
});

test('dread rolls the weakest tier against a high-mind target and grants stealth',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:95,hand:['conceptDread']});
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,mind:90,blockedRounds:2});b.walls=[];
  });
  await f.act('plan',{card:'conceptDread',targets:['enemy']});await f.act('round');
  assert.ok(livingForm(f).ruleStealth.through>=f.state.battle.round);
  assert.ok(livingForm(f,'enemy').hp>=988);
});
test('maze rewinds a moving ally of the target side after movement',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:16,mind:95,hand:['conceptMaze']});
    Object.assign(b.units.enemy,{pos:19,hp:999,maxHp:999,blockedRounds:2});b.walls=[];
  });
  await f.act('plan',{card:'conceptMaze',targets:['enemy']});await f.act('round');
  assert.equal(livingForm(f,'enemy').whiteMaze.pos,19);
  configureBattle(f,(b,self)=>{self.pos=8;b.units.enemy.blockedRounds=0;});
  await f.act('plan',{cards:[],pos:0});await f.act('round');
  assert.ok(f.state.battle.log.some(line=>line.includes('같은 복도로 돌아옴')));
  assert.equal(livingForm(f,'enemy').pos,19);
});

test('applause roots its holder and release empowers exactly the next first attack',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:17,mind:95,shield:20,hand:['conceptApplauseStart','conceptBlindJudge'],deck:[]});
    Object.assign(b.units.enemy,{pos:18,hp:999,maxHp:999,blockedRounds:5});
    b.walls=[];
  });
  await f.act('plan',{card:'conceptApplauseStart',targets:['enemy']});await f.act('round');
  assert.equal(livingForm(f).stacks['수억의 박수'],3);
  assert.equal(livingForm(f).move,0);
  assert.ok(livingForm(f).hand.some(card=>card.id==='conceptApplauseScorn'));
  const mind=livingForm(f).mind;
  await f.act('plan',{cards:[]});await f.act('round');
  assert.equal(livingForm(f).mind,mind-6);
  configureBattle(f,(b,self)=>{self.stacks['수억의 박수']=12;});
  await f.act('plan',{card:'conceptApplauseScorn',targets:['enemy']});await f.act('round');
  assert.equal(livingForm(f).stacks['수억의 박수']||0,0);
  assert.ok(livingForm(f).contemptThrough>=f.state.battle.round);
  assert.ok(livingForm(f,'enemy').applauseShieldCut>=f.state.battle.round);
  assert.ok(livingForm(f).applauseRelease.crit>=120);
  configureBattle(f,(b,self)=>{self.mind=5;self.hand=['conceptVaultReflect'];});
  await f.act('plan',{card:'conceptVaultReflect',targets:['enemy']});await f.act('round');
  assert.equal(livingForm(f).applauseRelease,undefined);
  assert.ok(f.state.battle.log.some(line=>line.includes('치명타 (180%)')));
});

test('concept tools equip independently, activate in battle, and survive character export and import',async()=>{
  const f=await fixture();
  await f.act('profile',{name:'도구 제작자',country:'제4국',status:'하위층 시민',stats:[50,50,50,50,50,50]});
  await f.act('conceptTool',{tool:{name:'객차의 호신 부적',effects:[{when:'turnStart',kind:'shield',amount:7,to:'self'}]}});
  const tool=f.state.profile.conceptTools[0];
  assert.equal(tool.enabled,false);
  assert.equal(f.state.profile.passives?.length||0,0);
  await f.act('conceptToolToggle',{id:tool.id});
  await f.act('start',{solo:true,bots:0});
  assert.equal(livingForm(f).shield,7);
  await f.act('conceptToolToggle',{id:tool.id});
  assert.ok(livingForm(f).passiveNames.includes(tool.name));
  await f.act('requestEdit');
  await f.act('reviewEdit',{id:f.state.pendingEdits[0].id,approve:true});
  assert.ok(!livingForm(f).passiveNames.includes(tool.name));
  await f.act('reset');
  await f.act('conceptToolToggle',{id:tool.id});
  const exported=(await f.send(f.endpoint,{action:'characterExport'},f.host.cookie)).body;
  assert.equal(exported.conceptTools[0].enabled,true);
  await f.act('conceptToolDelete',{id:tool.id});
  await f.act('characterImport',{file:exported});
  assert.equal(f.state.profile.conceptTools[0].name,tool.name);
  assert.equal(f.state.profile.conceptTools[0].enabled,true);
});

test('equipment accepts ten items and a stack scan counts qualified allies rather than stacks',async()=>{
  const f=await fixture();
  const condition={type:'condition',condition:'stackScan',tag:'집중',scope:'allies',metric:'count',minimum:1,threshold:2,op:'gte'};
  const tool={name:'두 사람의 호흡',enabled:true,effects:[{when:'turnStart',kind:'shield',amount:9,to:'self',
    flow:[{kind:'if',id:1,branch:'then',test:condition}]}]};
  await f.act('conceptTool',{tool});
  for(let index=1;index<10;index++)await f.act('conceptTool',{tool:{...tool,name:'장신구 '+index,enabled:false}});
  const overflow=await f.send(f.endpoint,{action:'conceptTool',tool,revision:f.state.revision},f.host.cookie);
  assert.equal(overflow.status,400);
  await f.act('start',{solo:true,bots:2});
  assert.equal(livingForm(f).shield,0);
  configureBattle(f,(b,self)=>{
    b.units.bot0.stacks['집중']=9;
    b.units.bot1.stacks['집중']=1;
    self.stacks['집중']=10;
    for(const unit of [b.units.bot0,b.units.bot1,b.units.enemy])unit.blockedRounds=3;
  });
  await f.act('plan',{cards:[]});await f.act('round');
  assert.equal(livingForm(f).shield,0);
  configureBattle(f,b=>{b.units.bot1.stacks['집중']=4;});
  await f.act('plan',{cards:[]});await f.act('round');
  assert.equal(livingForm(f).shield,9);
});

test('keyword scans use card history and count individual users even without the stack',async()=>{
  const f=await fixture();
  await f.act('conceptTool',{tool:{name:'집중 사용 기록',enabled:true,effects:[{
    when:'turnStart',kind:'shield',to:'self',amount:8,flow:[{kind:'if',id:1,branch:'then',test:{
      type:'condition',condition:'keywordScan',tag:'집중',scope:'allies',mode:'consume',period:'previous',threshold:2
    }}]
  }]}});
  await f.act('start',{solo:true,bots:2});
  configureBattle(f,b=>{
    for(const bot of [b.units.bot0,b.units.bot1]){
      bot.library.hold={...bot.library.hold,role:'normal',target:'self',range:'0',effects:[
        {when:'use',kind:'consume',to:'self',amount:1,tag:'집중'}
      ]};
      bot.hand=['hold'];
      b.plans[bot.id]={card:'hold',pos:bot.pos,targets:[]};
    }
    b.units.enemy.blockedRounds=2;
  });
  await f.act('plan',{cards:[]});await f.act('round');
  assert.equal(livingForm(f).shield,8);
  assert.ok(!livingForm(f,'bot0').stacks['집중']);
  assert.ok(!livingForm(f,'bot1').stacks['집중']);
  configureBattle(f,b=>{for(const id of ['bot0','bot1'])b.units[id].blockedRounds=2;});
  await f.act('plan',{cards:[]});await f.act('round');
  assert.equal(livingForm(f).shield,8);
});

test('keyword possession detects one holder and counts two distinct holders by zone',async()=>{
  const f=await fixture();
  const scan={type:'condition',tag:'집중',scope:'allies',zone:'deck',mode:'consume'};
  await f.act('conceptTool',{tool:{name:'집중 카드 감지',enabled:true,effects:[
    {when:'turnStart',kind:'shield',to:'self',amount:3,flow:[{kind:'if',id:1,branch:'then',test:{...scan,condition:'keywordOwned'}}]},
    {when:'turnStart',kind:'shield',to:'self',amount:7,flow:[{kind:'if',id:2,branch:'then',test:{...scan,condition:'keywordOwnedCount',threshold:2}}]}
  ]}});
  await f.act('start',{solo:true,bots:2});
  const fill=bot=>{bot.library.hold={...bot.library.hold,effects:[{when:'use',kind:'consume',to:'self',amount:1,tag:'집중'}]};
    bot.deck=Array(8).fill('hold');};
  configureBattle(f,b=>{fill(b.units.bot0);for(const id of ['bot0','bot1','enemy'])b.units[id].blockedRounds=3;});
  await f.act('plan',{cards:[]});await f.act('round');
  assert.equal(livingForm(f).shield,3);
  configureBattle(f,b=>fill(b.units.bot1));
  await f.act('plan',{cards:[]});await f.act('round');
  assert.equal(livingForm(f).shield,13);
});

test('keyword-holder effects apply only to qualifying units in the chosen card zone',async()=>{
  const f=await fixture();
  await f.act('conceptTool',{tool:{name:'집중 카드 소지자 보호',enabled:true,effects:[
    {when:'turnStart',kind:'shield',amount:7,to:'keywordHolders',
      recipientKeyword:{tag:'집중',scope:'allies',zone:'hand',mode:'consume',minimum:1}}
  ]}});
  await f.act('start',{solo:true,bots:2});
  configureBattle(f,b=>{
    for(const id of ['bot0','bot1']){
      const bot=b.units[id];
      bot.library.hold={...bot.library.hold,effects:[{when:'use',kind:'consume',to:'self',amount:1,tag:'집중'}]};
      bot.blockedRounds=3;
    }
    b.units.bot0.hand=['hold','hold','hold','hold'];
    b.units.bot1.hand=['strike','strike','strike','strike'];
    b.units.bot1.deck=['hold'];b.units.enemy.blockedRounds=3;
  });
  await f.act('plan',{cards:[]});await f.act('round');
  assert.equal(livingForm(f,'bot0').shield,7);
  assert.equal(livingForm(f,'bot1').shield,0);
  assert.equal(livingForm(f).shield,0);
});

test('all activity locations persist and allocations set combat attributes',async()=>{
  const f=await fixture();
  const {locationTags,characterCombatStats}=await import('../public/rules.js');
  const stats=[60,95,40,75,10,20];
  await f.act('profile',{name:'기동 승객',country:'제4국',status:'하위층 시민',stats,activityLocations:locationTags});
  assert.deepEqual(f.state.profile.activityLocations,locationTags);
  await f.act('start',{solo:true,bots:0});
  let unit=livingForm(f);
  assert.deepEqual(unit.combat,characterCombatStats(stats));
  assert.equal(unit.hp,90);
  assert.equal(unit.move,4);
  assert.equal(unit.actionLimit,3);
  assert.equal(unit.handCount,5);
  configureBattle(f,b=>{b.units.enemy.blockedRounds=2;});
  await f.act('plan',{cards:[],pos:unit.pos});await f.act('round');
  unit=livingForm(f);
  assert.equal(unit.move,4);
  assert.equal(unit.handCount,5);
  const guarded=characterCombatStats([5,5,50,40,100,100]);
  assert.equal(guarded.critChance,25);
  assert.equal(guarded.mindGuard,25);
});

test('independent stack effects grant and spend one axis without changing the other',async()=>{
  const f=await fixture();
  const rows=[['stack',{axisPower:8}],['stack',{axisCount:2}],['consume',{axisPower:3}],['remove',{axisCount:1}]];
  const ids=[];
  for(const [kind,axes] of rows){
    await f.act('card',{card:{name:'독립 중첩 '+ids.length,power:'0',target:'self',range:'0',role:'normal',
      effects:[{when:'use',kind,to:'self',tag:'시험 축',stackAxes:true,...axes}]}});
    ids.push(f.state.profile.cards.at(-1).id);
  }
  await f.act('start',{solo:true,bots:0});
  for(const [index,[count,power]] of [[1,8],[3,8],[3,5],[2,5]].entries()){
    configureBattle(f,(b,self)=>{self.hand=[ids[index]];b.units.enemy.blockedRounds=2;});
    await f.act('plan',{card:ids[index]});await f.act('round');
    const unit=livingForm(f);
    assert.equal(unit.stacks['시험 축'],count);
    assert.equal(unit.stackRuns['시험 축'].reduce((sum,run)=>sum+run.count*run.power,0),power);
  }
});

test('dialogue is shared in order before battle and standing art is available to room members',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'동료'});
  await f.act('profile',{name:'승객',country:'제4국',status:'하위층 시민',stats:[50,50,50,50,50,50]});
  await f.act('art',{slot:'normal.idle',image:'data:image/png;base64,iVBORw0KGgo='});
  await f.act('dialogue',{message:'첫 대사\n두 번째 줄'});
  assert.equal(f.state.battle,null);
  assert.equal(f.state.dialogue[0].name,'승객');
  assert.equal(f.state.dialogue[0].artVersion,1);
  const view=await f.send(f.endpoint,undefined,guest.cookie);
  assert.equal(view.body.dialogue[0].message,'첫 대사\n두 번째 줄');
  const reply=await f.send(f.endpoint,{action:'dialogue',revision:view.body.revision,message:'응답'},guest.cookie);
  assert.equal(reply.status,200);
  assert.equal(reply.body.dialogue.length,2);
  assert.ok(reply.body.dialogue[0].at<=reply.body.dialogue[1].at);
  const art=await worker.fetch(new Request('https://game.test'+f.endpoint+'?unit='+f.state.me+'&art=normal.idle',{headers:{Cookie:guest.cookie}}),{DB:f.DB});
  assert.equal(art.status,200);
  assert.equal(art.headers.get('content-type'),'image/png');
});

test('stack axes can take percentages from another named stack',async()=>{
  const f=await fixture();
  const name='비율 시험';
  await f.act('card',{card:{name,power:'0',target:'self',range:'0',role:'normal',effects:[
    {when:'use',kind:'stack',to:'self',tag:'원본',amount:4,stackPower:5},
    {when:'use',kind:'stack',to:'self',tag:'결과',stackAxes:true,
      axisPower:50,axisPowerMode:'percent',axisPowerBasis:'ownStackCurrent',axisPowerTag:'원본',
      axisCount:50,axisCountMode:'percent',axisCountBasis:'ownStackCurrent',axisCountTag:'원본'}
  ]}});
  const id=f.state.profile.cards.at(-1).id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{self.hand=[id];b.units.enemy.blockedRounds=2;});
  await f.act('plan',{card:id});await f.act('round');
  const unit=livingForm(f);
  assert.equal(unit.stacks['결과'],2);
  assert.equal(unit.stackRuns['결과'].reduce((sum,run)=>sum+run.count*run.power,0),10);
});

test('a unit-centered splash card can instead strike an empty tile without a clash',async()=>{
  const f=await fixture();
  await f.act('card',{card:{name:'빈 칸 포격',power:'12',range:'1~4',role:'normal',target:'splash',
    splash:{range:'1'},clash:true,effects:[]}});
  const id=f.state.profile.cards.at(-1).id;
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    self.pos=16;self.mind=50;self.hand=[id];
    Object.assign(b.units.enemy,{pos:19,hp:99,maxHp:99,blockedRounds:2});b.walls=[];
  });
  await f.act('plan',{card:id,targetTile:18});
  assert.equal(livingForm(f).plan.targetTile,18);
  assert.equal(livingForm(f).plan.clash,false);
  await f.act('round');
  assert.equal(livingForm(f,'enemy').hp,87);
});

test('confirmed ally action nodes expose the selected enemy intent and clash',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'관전자'});
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    self.pos=18;self.hand=['strike'];b.units.enemy.pos=19;b.walls=[];
    b.intent={...b.intent,target:self.id,reachable:true};
  });
  await f.act('plan',{card:'strike',targets:['enemy'],stance:'clash',actionLink:'enemy'});
  const view=await f.send(f.endpoint,undefined,guest.cookie);
  assert.equal(view.status,200);
  const action=view.body.battle.allyActions[0];
  assert.equal(action.attacker,f.state.me);
  assert.equal(action.card.id,'strike');
  assert.equal(action.actionLink,'enemy');
  assert.equal(action.clash,true);
});

test('enemy dossiers unlock stats, actions and passive details at observation thresholds',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'관찰 승객'});
  await f.act('start',{solo:true,bots:0,encounter:'collector01'});
  assert.ok(livingForm(f,'enemy').enemyIntel.passives.length);
  assert.equal(livingForm(f,'enemy').intelProgress,0);
  assert.equal(livingForm(f,'enemy').revealTier,0);
  for(const [progress,tier] of [[0,0],[25,1],[50,2],[100,3]]){
    configureBattle(f,b=>{b.intel.enemy={progress,tier,overlap:0};});
    const view=await f.send(f.endpoint,undefined,guest.cookie);
    const enemy=view.body.battle.units.find(unit=>unit.enemy);
    assert.equal(enemy.intelProgress,progress);
    assert.equal(Boolean(enemy.enemyIntel.stats),tier>=1);
    assert.equal(Boolean(enemy.enemyIntel.actions),tier>=2);
    assert.equal(Boolean(enemy.enemyIntel.passives),tier>=3);
    if(tier>=2){
      assert.ok(enemy.enemyIntel.actions.length>1);
      assert.ok(enemy.enemyIntel.actions.some(card=>card.id==='collectReceipt'));
    }
    if(tier===3)assert.equal(enemy.enemyIntel.mind.managed,false);
  }
});

test('an attack without a splash shape has no secondary tile range',async()=>{
  const {gridCardInRange,gridCardHasReach}=await import('../public/grid.js');
  assert.equal(gridCardInRange(undefined,18,19),false);
  assert.equal(gridCardHasReach(undefined,18,19),false);
  assert.equal(gridCardInRange({range:'1'},18,19),true);
});

test('portrait uploads accept a larger payload through the artwork route',async()=>{
  const f=await fixture();
  const image='data:image/png;base64,'+'AQID'.repeat(60000);
  const saved=await f.send(f.endpoint+'?import=1',{action:'art',slot:'normal.idle',image,revision:f.state.revision},f.host.cookie);
  assert.equal(saved.status,200);
  assert.ok(saved.body.profile.artSlots.includes('normal.idle'));
  const response=await worker.fetch(new Request('https://game.test'+f.endpoint+'?unit='+f.state.me+'&art=normal.idle',{headers:{Cookie:f.host.cookie}}),{DB:f.DB});
  assert.equal(response.status,200);
  assert.equal((await response.arrayBuffer()).byteLength,180000);
});

test('bright plaza exposes a difficulty label separately from damage rankings',async()=>{
  const f=await fixture();
  await f.act('start',{solo:true,bots:0,encounter:'blight01'});
  assert.equal(f.state.battle.encounter.difficulty,'전설급');
  assert.equal(f.state.battle.encounter.rank,undefined);
  configureBattle(f,b=>{delete b.encounter.difficulty;b.encounter.rank='전설급';});
  const view=await f.send(f.endpoint,undefined,f.host.cookie);
  assert.equal(view.body.battle.encounter.difficulty,'전설급');
  assert.equal(view.body.battle.encounter.rank,undefined);
});

test('allies expose the full dossier without an observation requirement',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'동료'});
  await f.act('passive',{passive:{name:'회복 기질',enabled:true,effects:[{when:'turnStart',kind:'mind',amount:2,to:'self'}]}});
  await f.act('start',{solo:true,bots:0});
  const view=await f.send(f.endpoint,undefined,guest.cookie);
  const ally=view.body.battle.units.find(unit=>unit.id===f.state.me);
  assert.equal(ally.revealTier,undefined);
  assert.equal(ally.allyIntel.stats.maxHp,100);
  assert.ok(ally.allyIntel.actions.length>0);
  assert.equal(ally.allyIntel.passives[0].name,'회복 기질');
  assert.equal(ally.allyIntel.mind.managed,true);
});

test('only a GM can speak as an enemy and participants receive the selected portrait',async()=>{
  const f=await fixture();
  const guest=await f.send(f.room+'/join',{name:'동료'});
  await f.act('start',{solo:true,bots:0,encounter:'railguard01'});
  assert.ok(f.state.dialogueFoes.some(unit=>unit.id==='railSniper'));
  const payload={revision:f.state.revision,speaker:'railSniper',message:'사격 중지'};
  assert.equal((await f.send(f.endpoint,{action:'dialogue',...payload},guest.cookie)).status,403);
  const image='data:image/png;base64,iVBORw0KGgo=';
  assert.equal((await f.send(f.endpoint,{action:'dialogueEnemyArt',...payload,image},guest.cookie)).status,403);
  await f.act('dialogueEnemyArt',{speaker:'railSniper',image});
  await f.act('dialogue',{speaker:'railSniper',message:'사격 중지'});
  await f.act('dialogue',{speaker:'railShield',message:'방벽을 유지하라'});
  const view=await f.send(f.endpoint,undefined,guest.cookie);
  assert.equal(view.body.dialogueFoes,undefined);
  assert.deepEqual(view.body.dialogue.map(entry=>entry.name),['선로 보안반 저격수','선로 보안반 방패병']);
  assert.notEqual(view.body.dialogue[0].actor,view.body.dialogue[1].actor);
  const first=view.body.dialogue[0];
  const response=await worker.fetch(new Request('https://game.test'+f.endpoint+'?'+new URLSearchParams({unit:first.portraitKey,art:'dialogue.enemy'}),{headers:{Cookie:guest.cookie}}),{DB:f.DB});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('content-type'),'image/png');
});

test('instant movement walks in eight directions and spends its own clicked movement points',async()=>{
  const f=await fixture();
  const move=(amount,options)=>({kind:'move',when:'use',to:'self',amount,...options});
  await f.act('card',{card:{name:'방향과 이동력',power:'0',target:'self',range:'0',role:'normal',effects:[
    move(2,{moveMode:'direction',moveDirection:'ne'}),
    move(3,{moveMode:'choose'})
  ]}});
  const {id}=f.state.profile.cards[0];
  await f.act('start',{solo:true,bots:0});
  configureBattle(f,(b,self)=>{
    Object.assign(self,{pos:26,hand:[id]});
    b.walls=[12];b.units.enemy.pos=39;b.units.enemy.blockedRounds=1;
  });
  await f.act('plan',{card:id,targets:[]});
  await f.act('round');
  assert.equal(livingForm(f).pos,19,'diagonal stops at a wall after its first step');
  assert.equal(livingForm(f).instantMove,3);
  const rejected=await f.send(f.endpoint,{action:'instantMove',revision:f.state.revision,pos:12},f.host.cookie);
  assert.equal(rejected.status,400);
  const normalMove=livingForm(f).move;
  await f.act('instantMove',{pos:17});
  assert.equal(livingForm(f).pos,17);
  assert.equal(livingForm(f).instantMove,1);
  assert.equal(livingForm(f).move,normalMove);
  await f.act('instantMove',{skip:true});
  assert.equal(livingForm(f).instantMove,undefined);
});

test('target-relative instant movement ranks the enemies matching the stack range',async()=>{
  for(const [moveTest,destination] of [['inside',5],['outside',13]]){
    const f=await fixture();
    await f.act('card',{card:{name:'기준 대상 이동',power:'0',target:'self',range:'0',role:'normal',effects:[
      {kind:'move',when:'use',to:'self',amount:1,moveMode:'relative',moveAnchor:'enemy',moveOrder:'lowestHp',
        moveOffset:'left',moveTest,moveTag:'집중',moveMetric:'count',moveMin:2,moveMax:5}
    ]}});
    const {id}=f.state.profile.cards[0];
    await f.act('start',{solo:true,bots:0,encounter:'railguard01'});
    configureBattle(f,(b,self)=>{
      Object.assign(self,{pos:17,hand:[id]});
      b.walls=[];b.aimLine=null;
      Object.assign(b.units.enemy,{pos:21,hp:10,blockedRounds:1,stacks:{'집중':1}});
      Object.assign(b.units.railShield,{pos:14,hp:20,blockedRounds:1,stacks:{'집중':3}});
      Object.assign(b.units.railSniper,{pos:23,hp:30,blockedRounds:1,stacks:{'집중':4}});
    });
    await f.act('plan',{card:id,targets:[]});
    await f.act('round');
    assert.equal(livingForm(f).pos,destination,moveTest);
  }
});
