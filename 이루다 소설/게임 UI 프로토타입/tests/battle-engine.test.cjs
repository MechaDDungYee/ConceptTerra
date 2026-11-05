const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const cutoff = source.indexOf("renderChapters();", source.lastIndexOf("function renderSquad"));
run("evade compares rolled action power, not sequence ratios or critical damage", `
  const attacker=battleDummy.enemies[0],target=battleDummy.allies[0];
  battleDummy.allies=[target];battleDummy.enemies=[attacker];battleDummy.bench=[];
  attacker.x=4;attacker.y=2;target.x=3;target.y=2;
  attacker.buffs=[];attacker.debuffs=[];target.buffs=[];target.debuffs=[];
  rollWaveValue=()=>0;
  const guard={name:'회피 검증',type:'회피',power:8,wave:0,hits:0,range:0,scope:'자신',effect:''};
  const arm=()=>{target.hp=target.maxHp=200;target.guardReady=true;target.activeGuard={...guard};target.defenseWaveRoll=null;};
  const action={name:'비율 검증',type:'타격',scope:'단일',range:1,power:20,wave:0,hits:2,effect:'',
    sequence:[{ratio:.25,effect:''},{ratio:.5,effect:''}]};
  battleExecution={turn:1,order:1,status:'running',steps:[]};
  arm();resolveSequenceAction(attacker,action,target);
  assert.equal(target.hp,185);
  assert.equal(target.guardReady,false);
  const failed=battleExecution.steps.find(s=>s.type==='defense-roll');
  assert.equal(failed.incomingPower,20);assert.equal(failed.success,false);
  arm();attacker.criticalReady=true;
  resolveSequenceAction(attacker,{...action,power:6,sequence:[{ratio:1,effect:''}]},target);
  assert.equal(target.hp,200);assert.equal(target.lastHitEvaded,true);
  arm();attacker.criticalReady=true;
  resolveRemainingHits(attacker,{name:'legacy 검증',type:'타격',scope:'단일',range:1,power:6,wave:0,hits:1,effect:''},target,1);
  assert.equal(target.hp,200);assert.equal(target.lastHitEvaded,true);
  arm();applyBattleDamage(attacker,target,5,{statusDamage:true,attackPower:20});
  assert.equal(target.hp,195);assert.equal(target.guardReady,true);
  battleExecution=null;
`);
run("whole-area, self-centered and friendly support actions execute against the correct team", `
  const a=battleDummy.allies[0],friend=battleDummy.allies[1],e=battleDummy.enemies[0];
  a.x=1;a.y=1;friend.x=8;friend.y=5;
  const whole={name:'전체 공격',type:'타격',scope:'전 구역',range:'전장',hits:1,power:8,wave:0,effect:''};
  assert.equal(getActionTargets(a,whole,e).length,3);
  assert.ok(isBattleTargetInRange(a,whole,e));assert.ok(!isBattleTargetInRange(a,whole,friend));
  const center={...whole,scope:'자신 중심 십자',range:1};
  assert.ok(isBattleTargetInRange(a,center,a));
  e.x=2;e.y=1;assert.ok(getActionTargets(a,center,a).includes(e));
  const support={...whole,type:'지원',scope:'아군 전체',effect:'[격려 4 / 1]'};
  battleExecution={turn:1,order:1,status:'running',steps:[]};
  resolveUnitAction(a,{id:a.id+':0',action:support,target:friend});
  assert.ok(battleDummy.allies.every(unit=>unit.sp===54));
  assert.ok(battleDummy.enemies.every(unit=>!getBattleStatus(unit,'격려')));
  assert.ok(battleExecution.steps.some(s=>s.type==='support-start'));
  assert.ok(battleExecution.steps.some(s=>s.type==='support-roll'));
  assert.equal(battleExecution.steps.find(s=>s.type==='support-applied').targetIds.length,4);
  assert.ok(!battleExecution.steps.some(s=>s.type==='damage-applied'));
  battleExecution=null;
`);
run("global actions recover a missing primary and support per-hit effects do not multiply whole-team applications", `
  const a=battleDummy.allies[0],e=battleDummy.enemies[0];
  const whole={name:'전장 공격',type:'타격',scope:'적 전체',range:'전장',hits:1,power:8,wave:0,effect:''};
  e.hp=0;const before=battleDummy.enemies[1].hp;
  resolveUnitAction(a,{action:whole,target:e});assert.equal(battleDummy.enemies[1].hp,before-8);
  const support={...whole,type:'지원',scope:'아군 전체',hits:2,effect:'아군 전체 [보호 2 / 1]'};
  resolveUnitAction(a,{action:support,target:a});
  assert.ok(battleDummy.allies.every(unit=>getBattleStatus(unit,'보호').count===2));
  const typed={...support,scope:'단일',range:2};
  assert.ok(!isBattleTargetInRange(a,typed,battleDummy.enemies[1]));
`);
run("turn execution records clash rounds, destroyed hits, cancellation and surviving attacks", `
  const a=battleDummy.allies[0], b=battleDummy.enemies[0];
  battleDummy.allies=[a]; battleDummy.enemies=[b]; battleDummy.bench=[];
  a.x=3; a.y=2; b.x=4; b.y=2; b.hp=b.maxHp=200;
  const attack={name:'테스트 공격',type:'타격',scope:'단일',range:1,power:10,wave:1,hits:2,effect:''};
  const defense={...attack,name:'테스트 적 공격',power:5};
  a.queuedActions=[{action:attack,targetId:b.id,decisionOrder:99}];
  b.preparedAction=defense; b.targetId=a.id;
  rollWaveValue=()=>0;
  resolveBattleTurn();
  const execution=getLastBattleExecution();
  assert.equal(execution.status,'completed'); assert.equal(execution.turn,1);
  const steps=execution.steps;
  assert.deepEqual(steps.filter(s=>s.type==='hit-destroyed').map(s=>s.hit),[2,1]);
  const rounds=steps.filter(s=>s.type==='clash-roll');
  assert.equal(rounds.length,2);
  assert.equal(rounds[0].attackerRoll.waves.length,2);
  assert.ok(rounds[1].attackerRoll.waves.length===1||rounds[1].defenderRoll.waves.length===1);
  assert.equal(steps.filter(s=>s.type==='action-canceled')[0].planId,b.id+':0');
  assert.equal(steps.filter(s=>s.type==='attack-roll').length,2);
  assert.equal(steps.filter(s=>s.type==='damage-applied').reduce((sum,s)=>sum+s.damage,0),20);
  assert.ok(steps.findIndex(s=>s.type==='action-canceled')<steps.findIndex(s=>s.type==='attack-start'));
  assert.equal(steps[0].type,'turn-start'); assert.equal(steps.at(-1).type,'turn-complete');
  assert.ok(steps.every((s,index)=>s.sequence===index+1));
  assert.equal(steps[0].units.find(u=>u.id===b.id).hp,200);
  execution.steps[0].units[0].hp=-1;
  assert.notEqual(getLastBattleExecution().steps[0].units[0].hp,-1);
  assert.equal(battleExecution,null);
`);
run("ties reroll without destroying hits and surviving hit damage starts a fresh waveform chain", `
  const a=battleDummy.allies[0], b=battleDummy.enemies[0];
  const skill={name:'공방',type:'타격',scope:'단일',range:1,power:10,wave:1,hits:1,effect:''};
  battleExecution={turn:1,order:1,status:'running',steps:[]};
  const waves=[0,0,3,-3,2]; rollWaveValue=()=>waves.shift()??0;
  const result=resolveClash(a,skill,b,skill);
  assert.equal(result.attackerHits,1); assert.equal(result.defenderHits,0);
  assert.equal(battleExecution.steps.filter(s=>s.type==='clash-compare').length,2);
  assert.equal(battleExecution.steps.filter(s=>s.type==='hit-destroyed').length,1);
  b.hp=100; resolveRemainingHits(a,skill,b,1);
  assert.equal(battleExecution.steps.find(s=>s.type==='attack-roll').roll.total,12);
  battleExecution=null;
`);
run("enemies remain in their rear column during first-turn preparation", `
  resetBattleDummy();
  assert.ok(battleDummy.enemies.every(unit=>unit.x===8&&unit.startX===8));
  assert.equal(new Set(battleDummy.enemies.map(unit=>unit.x+':'+unit.y)).size,3);
  assert.ok(battleDummy.enemies.every(unit=>unit.preparedAction));
  battleDummy.turn=2;
  prepareEnemyActions();
  assert.ok(battleDummy.enemies.some(unit=>unit.x<8));
`);
run("swap card is visible only in rear column and ally slots show scheduled rank", `
  const unit=battleDummy.allies[0];
  unit.x=2; assert.equal(renderBattleSwapCard(unit),'');
  unit.x=1; assert.ok(renderBattleSwapCard(unit).includes('data-skill-index="swap"'));
  unit.actionCapacity=2;
  let markup=renderBattleToken(unit,'ally');
  assert.ok(markup.includes('ally-action-badge'));
  assert.equal((markup.match(/class="action-slot"/g)||[]).length,2);
  unit.queuedActions=[{action:unit.skills[0],targetId:battleDummy.enemies[0].id,decisionOrder:1}];
  markup=renderBattleToken(unit,'ally');
  const rank=getBattleSchedule().ranks.get(unit.id+':0');
  assert.ok(markup.includes('<strong>'+rank+'</strong>'));
`);
run("power preview shares modifiers and handles negative waves", `
  const unit = battleDummy.allies[0];
  const action = {...unit.skills[0], hits:1, power:10, wave:-2, effect:'[충돌 시] 기본 위력 +1'};
  addBattleStatus(unit, '충격', 2, 1);
  assert.equal(getPowerBounds(unit,action).min,2);
  assert.equal(getPowerBounds(unit,action).max,14);
  assert.equal(getPowerBounds(unit,action,{clash:true}).min,3);
  assert.equal(getPowerBounds(unit,action,{clash:true}).max,15);
  const original = Math.random; Math.random = () => 0;
  assert.equal(rollHitPower(unit,action,{clash:true}).total,15); Math.random = original;
`);

run("clash forecast considers mental state, hit counts and ties", `
  const a = battleDummy.allies[0], b = battleDummy.enemies[0];
  const skill={power:8,wave:1,hits:2,effect:''};
  const ap={unit:a,action:skill}, bp={unit:b,action:skill};
  a.sp=b.sp=50;
  assert.ok(Math.abs(getClashForecast(ap,bp).probability-.5)<1e-10);
  a.sp=100; b.sp=0; assert.ok(getClashForecast(ap,bp).probability>.5);
  ap.action={...skill,wave:-1}; assert.ok(getClashForecast(ap,bp).probability<.51);
  a.sp=b.sp=50; ap.action={...skill,hits:4}; assert.ok(getClashForecast(ap,bp).probability>.5);
  ap.action={...skill,power:100}; assert.ok(getClashForecast(ap,bp).probability>.999);
  ap.action={...skill,power:1,wave:0}; assert.equal(getClashForecast(ap,bp).probability,0);
  ap.action=bp.action={...skill,wave:0};
  assert.equal(getClashForecast(ap,bp).label,'균형');
  assert.ok(getClashForecast(ap,bp).draw>.999);
`);

run("either clash participant shows ally left and enemy right", `
  const a=battleDummy.allies[0], e=battleDummy.enemies[0];
  a.x=3; a.y=3; e.x=4; e.y=3;
  a.reserved=a.skills[1]; a.targetId=e.id; a.decisionOrder=99;
  e.preparedAction=getEnemyAction(e); e.targetId=a.id;
  for (const id of [a.id,e.id]) {
    battleDummy.focusedActionUnitId=id;
    const view=getBattleActionComparison();
    assert.equal(view.left.unit.id,a.id); assert.equal(view.right.unit.id,e.id); assert.ok(view.clash);
  }
  a.reserved=null; const view=getBattleActionComparison();
  assert.equal(view.left,undefined); assert.equal(view.right.unit.id,e.id);
  assert.ok(renderBattleActionPanel(view.right,'right',false).includes('피해량'));
`);
function run(name, test) {
  const context = vm.createContext({ window: {}, document: { querySelectorAll: () => [] }, console, assert });
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../battle-tutorial.js'),'utf8'),context);
  vm.runInContext(source.slice(0, cutoff), context);
  vm.runInContext("renderBattleDummy = () => {}; ensureBattleState(); resetBattleDummy();", context);
  vm.runInContext(test, context);
  console.log(`PASS ${name}`);
}

run('all nine base identities retain motion keys and use sequence descriptions', `
  const roster=createBattleRoster(); assert.equal(roster.length,9);
  for(const unit of roster) for(const action of [...unit.skills,unit.ego]) {
    assert.ok(action.sequence); assert.equal(action.hits,action.legacy.hits);
    assert.equal(action.name,action.legacy.name); assert.ok(action.wave>=3);
    assert.ok(!/\\d+타/.test(renderHitRows(action)));
    assert.ok(!renderHitRows(action).includes('hit-badge'));
    assert.ok(getPowerBounds(unit,action).min>1);
  }
  const text=roster.find(unit=>unit.id==='eojil').skills[0].effect;
  assert.ok(text.includes('펜촉으로 적을 찔러 (위력 50%)의 피해를 입힙니다.'));
  assert.ok(text.includes('자신에게 [집중 10 | 2] 부여합니다.'));
  assert.ok(text.includes('이후 박힌 펜촉을 거칠게 뽑아 (위력 25%)의 피해를 입힙니다.'));
`);
run('a whole sequence shares one wave and does not accumulate', `
  const a=battleDummy.allies[0],e=battleDummy.enemies[0];a.x=3;a.y=2;e.x=4;e.y=2;
  const action={name:'sequence',type:'타격',scope:'단일',range:1,hits:2,power:20,wave:3,effect:'',sequence:[{ratio:.5,effect:''},{ratio:.25,effect:''}]};
  let draws=0;rollWaveValue=()=>{draws++;return 2};
  const hp=e.hp; resolveRemainingHits(a,action,e,2);
  assert.equal(draws,1);assert.equal(e.hp,hp-19);
  assert.equal(getPowerBounds(a,{...action,power:4,wave:1}).max,7);
  assert.equal(getPowerBounds(a,{...action,wave:-3}).max,29);
`);
run('parry cancels the loser then executes the winner with the same wave', `
  const a=battleDummy.allies[0],e=battleDummy.enemies[0];a.x=3;a.y=2;e.x=4;e.y=2;
  const ah=a.hp,eh=e.hp;let draws=0;rollWaveValue=()=>{draws++;return 0};
  const action={...a.skills[0],power:30};
  battleExecution={turn:1,order:1,steps:[]};
  const ap={id:'a',unit:a,action,target:e},ep={id:'b',unit:e,action:{...getEnemyAction(e),power:10},target:a};
  resolveBattleClashEvent(ap,ep);assert.equal(ep.canceled,true);
  assert.equal(draws,2);assert.equal(a.hp,ah);assert.ok(e.hp<eh);
  assert.equal(battleExecution.steps.filter(s=>s.type==='clash-roll').length,1);
  assert.ok(!battleExecution.steps.some(s=>s.type==='hit-destroyed'));
  const types=battleExecution.steps.map(s=>s.type);
  assert.ok(types.indexOf('action-canceled')<types.indexOf('clash-followup'));
  assert.ok(types.indexOf('clash-followup')<types.indexOf('attack-start'));
  assert.equal(battleExecution.steps.find(s=>s.type==='attack-roll').reused,true);
  assert.ok(battleExecution.steps.some(s=>s.type==='status-added'));
`);
run('wall impact uses total direct damage once and occupied tiles are not walls', `
  const a=battleDummy.allies[0],e=battleDummy.enemies[0];a.x=7;a.y=2;e.x=8;e.y=2;
  const action={name:'push',type:'타격',scope:'단일',range:1,hits:2,power:20,wave:0,effect:'',sequence:[{ratio:.5,effect:''},{ratio:.25,effect:'',push:2,wallRatio:.5}]};
  rollWaveValue=()=>0;const hp=e.hp;resolveRemainingHits(a,action,e,2);
  assert.equal(e.hp,hp-22);assert.equal(e.x,8);
  a.x=5;e.x=6;const blocker=battleDummy.allies[1];blocker.x=7;blocker.y=2;
  const before=e.hp;resolveRemainingHits(a,action,e,2);
  assert.equal(e.hp,before-15);assert.equal(e.x,6);
`);
run('enemy winners attack, ties do not attack, and new shock survives the follow-up', `
  const a=battleDummy.allies[0],e=battleDummy.enemies[0];a.x=3;a.y=2;e.x=4;e.y=2;
  const simple={name:'test',type:'타격',scope:'단일',range:1,hits:1,power:30,wave:0,effect:'',sequence:[{ratio:1,effect:'[충격 2 / 2]'}]};
  let draws=0;rollWaveValue=()=>{draws++;return 0};
  battleExecution={turn:1,order:1,steps:[]};const hp=a.hp;
  resolveBattleClashEvent({id:'a',unit:a,action:{...simple,power:5},target:e},{id:'e',unit:e,action:simple,target:a});
  assert.ok(a.hp<hp);assert.equal(draws,2);assert.equal(getBattleStatus(a,'충격').count,2);
  battleExecution.steps=[];const before=a.hp;const enemyHp=e.hp;
  a.debuffs=[];e.debuffs=[];
  resolveBattleClashEvent({id:'a2',unit:a,action:simple,target:e},{id:'e2',unit:e,action:simple,target:a});
  assert.equal(a.hp,before);assert.equal(e.hp,enemyHp);
  assert.ok(!battleExecution.steps.some(s=>s.type==='attack-start'));
`);
run('keyword notifications report actual capped grants including immediate recovery', `
  const a=battleDummy.allies[0];a.buffs=[];a.debuffs=[];
  battleExecution={turn:1,order:1,steps:[]};
  addBattleStatus(a,'집중',99,99);addBattleStatus(a,'집중',10,10);
  const grants=battleExecution.steps.filter(s=>s.type==='status-added');
  assert.equal(grants[1].power,1);assert.equal(grants[1].count,1);
  addBattleStatus(a,'집중',10,10);
  assert.equal(battleExecution.steps.filter(s=>s.type==='status-added').length,2);
  a.hp-=10;addBattleStatus(a,'회복',4,1);
  assert.ok(battleExecution.steps.some(s=>s.type==='status-added'&&s.keyword==='회복'));
`);
run('next-turn movement bonus applies once and does not change base priority', `
  const a=battleDummy.allies[0];a.nextMoveBonus=2;
  getBattleSchedule=()=>({events:[],plans:[]});rollWaveValue=()=>0;
  resolveBattleTurn();assert.equal(a.moveLeft,a.move+2);assert.equal(a.nextMoveBonus,0);
  resolveBattleTurn();assert.equal(a.moveLeft,a.move);
`);
run('resonance skills seed their own keyword and resonate on the final effect', `
  const roster=createBattleRoster();
  rollWaveValue=()=>0;
  for(const unit of roster) for(const action of [...unit.skills,unit.ego].filter(action=>action.effect.includes('공명'))) {
    unit.hp=unit.maxHp=10000;unit.sp=50;unit.x=3;unit.y=2;unit.buffs=[];unit.debuffs=[];unit.actionCanceled=false;unit.criticalReady=false;
    const enemy={...battleDummy.enemies[0],hp:10000,maxHp:10000,x:4,y:2,buffs:[],debuffs:[],guardReady:false};
    battleDummy.allies=[unit];battleDummy.enemies=[enemy];battleDummy.log=[];
    battleExecution={turn:1,order:1,steps:[]};
    const steps=action.sequence;
    assert.ok(steps.length>=2,action.name);
    assert.ok(!steps[0].effect.includes('공명'),action.name);
    assert.ok(steps.at(-1).effect.includes('공명'),action.name);
    assert.equal(action.hits,action.legacy.hits);
    resolveRemainingHits(unit,action,enemy,action.hits);
    assert.ok(battleDummy.log.some(line=>/공명\\] [1-9]/.test(line)),action.name);
    assert.equal(battleExecution.steps.filter(step=>step.type==='attack-roll').length,1);
  }
`);

run("late defensive slots react to earlier attacks and never rearm at their scheduled order", `
 for(const type of ['회피','방어','반격','실패회피']){
  const a=battleDummy.allies[0],e=battleDummy.enemies[0];
  battleDummy.allies=[a];battleDummy.enemies=[e];battleDummy.bench=[];
  a.hp=a.maxHp=100;e.hp=e.maxHp=100;a.x=3;a.y=2;e.x=4;e.y=2;
  a.guardReady=false;a.activeGuard=null;a.buffs=[];a.debuffs=[];e.buffs=[];e.debuffs=[];
  const guard={name:'guard',type:type==='실패회피'?'회피':type,range:1,scope:type==='반격'?'단일':'자신',hits:type==='반격'?1:0,power:type==='실패회피'?2:8,wave:0,effect:''};
  a.guard=guard;
  const attack={name:'attack',type:'타격',range:1,scope:'단일',hits:3,power:4,wave:0,effect:''};
  const plans=[{id:'early',unit:e,action:attack,target:a},{id:'pause',unit:e,action:{name:'wait',type:'지원',scope:'자신',range:0,hits:0,power:0,wave:0,effect:''},target:e},
   {id:'late-guard',unit:a,action:guard,target:a},{id:'after',unit:e,action:{...attack,hits:1},target:a}];
  getBattleSchedule=()=>({events:plans.map(plan=>({plans:[plan]})),plans,ranks:new Map()});
  rollWaveValue=()=>0;resolveBattleTurn();
  const steps=getLastBattleExecution().steps;
  assert.equal(steps.filter(s=>s.type==='defense-ready').length,1);
  assert.equal(steps.find(s=>s.type==='defense-ready').order,1);
  assert.equal(steps.find(s=>s.type==='defense-ready').respondingToId,e.id);
  assert.equal(steps.filter(s=>s.type==='action-used'&&s.planId==='late-guard').length,1);
  if(type==='반격'){assert.equal(a.hp,84);assert.equal(e.hp,92);assert.equal(steps.filter(s=>s.type==='counter-start').length,1);}
  else if(type==='실패회피'){assert.equal(a.hp,84);assert.equal(steps.filter(s=>s.type==='defense-roll').length,1);}
  else {assert.equal(a.hp,100);assert.equal(steps.filter(s=>s.type==='defense-roll').length,4);}
 }
`);

run("waves accumulate per hit in display, damage and remaining-hit clashes", `
  const unit = battleDummy.allies[0], target = battleDummy.enemies[0];
  const skill = {...unit.skills[0], sequence:undefined, power:4,wave:1,hits:2,effect:''};
  assert.equal(getPowerBounds(unit,skill).max,10);
  assert.equal(getPowerBounds(unit,skill,{hit:1}).max,7);
  assert.equal(getPowerBounds(unit,skill,{hit:2}).max,10);
  assert.equal(getDirectDamageBounds(unit,skill,target).max,17);
  rollWaveValue = () => 3;
  assert.equal(rollHitPower(unit,skill,{clash:true,remainingHits:2}).total,10);
  assert.equal(rollHitPower(unit,skill,{clash:true,remainingHits:1}).total,7);
  let hp=target.hp; resolveRemainingHits(unit,skill,target,2);
  assert.equal(target.hp,hp-17);
  let sequence=[3,-3]; rollWaveValue=()=>sequence.shift();
  hp=target.hp; resolveRemainingHits(unit,skill,target,2); assert.equal(target.hp,hp-11);
  sequence=[-3,-3]; rollWaveValue=()=>sequence.shift();
  hp=target.hp; resolveRemainingHits(unit,{...skill,power:8},target,2); assert.equal(target.hp,hp-7);
  sequence=[3,3]; rollWaveValue=()=>sequence.shift();
  const first=rollHitPower(unit,{...skill,power:10,wave:-1},{hit:1});
  assert.equal(first.total,7);
  assert.equal(rollHitPower(unit,{...skill,power:10,wave:-1},{hit:2,previousWaveSum:first.waveSum}).total,4);
`);

run("dummy bases survive worst single waves without other debuffs", `
  for (const unit of battleDummy.allies) for (const action of [...unit.skills,unit.guard,unit.ego]) {
    if (action.hits>0) assert.ok(action.power-3*Math.abs(action.wave)>1,action.name);
  }
  for (const enemy of battleDummy.enemies) {
    const action=getEnemyAction(enemy);
    if(action.hits>0) assert.ok(action.power-3*Math.abs(action.wave)>1,enemy.name);
  }
`);

run("every bag contains 4/3/2/1 and unplayed hand persists", `
  const unit = battleDummy.allies[0];
  const first = [...unit.hand]; drawBattleHand(unit);
  assert.deepEqual(unit.hand, first);
  const draws = [];
  for (let i = 0; i < 5000; i++) {
    draws.push(unit.hand.shift()); drawBattleHand(unit);
  }
  for (let i = 0; i < draws.length; i += 10) {
    assert.deepEqual([0,1,2,3].map(skill => draws.slice(i,i+10).filter(card => card === skill).length), [4,3,2,1]);
  }
  assert.equal(draws.filter(card => card === 3).length, 500);
`);

run("protection, composure, hit and periodic debuffs consume counts", `
  const unit = battleDummy.allies[0], enemy = battleDummy.enemies[0];
  addBattleStatus(unit, '보호', 3, 2);
  const hp = unit.hp; applyBattleDamage(enemy, unit, 7);
  assert.equal(unit.hp, hp - 4); assert.equal(getBattleStatus(unit, '보호').count, 1);
  applyBattleDamage(enemy, unit, 7); assert.equal(getBattleStatus(unit, '보호'), undefined);
  addBattleStatus(unit, '평정', 5, 1); unit.sp = 50;
  changeBattleMentality(unit, -10, 'test'); assert.equal(unit.sp, 45);
  addBattleStatus(unit, '상처', 3, 2); const before = unit.hp;
  applyBattleDamage(enemy, unit, 5); assert.equal(unit.hp, before - 8);
  triggerBattleStatus(unit, '상처'); assert.equal(unit.hp, before - 11);
  assert.equal(getBattleStatus(unit, '상처'), undefined);
  addBattleStatus(unit, '잠식', 4, 2); unit.sp = 50;
  applyBattleDamage(enemy, unit, 1); assert.equal(unit.sp, 46);
  triggerBattleStatus(unit, '잠식'); assert.equal(unit.sp, 42);
  assert.equal(getBattleStatus(unit, '잠식'), undefined);
`);

run("support effects heal, resonance consumes stacks, values cap at 100", `
  const unit = battleDummy.allies[0], enemy = battleDummy.enemies[0];
  unit.sp = 50; unit.hp -= 10;
  applyBattleEffectText(unit, unit, '[격려 6 / 1], [회복 8 / 1], [보호 4 / 1]');
  assert.equal(unit.sp, 56); assert.equal(unit.hp, unit.maxHp - 2);
  assert.equal(getBattleStatus(unit, '보호').power, 4);
  addBattleStatus(enemy, '상처', 3, 2); const hp = enemy.hp;
  resonateBattleStatus(enemy, '상처'); assert.equal(enemy.hp, hp - 6);
  assert.equal(getBattleStatus(enemy, '상처'), undefined);
  addBattleStatus(enemy, '충격', 2, 3); resonateBattleStatus(enemy, '충격');
  assert.equal(enemy.actionCanceled, true);
  addBattleStatus(unit, '자원', 99, 99); addBattleStatus(unit, '자원', 10, 10);
  assert.equal(getBattleStatus(unit, '자원').power, 100);
  assert.equal(getBattleStatus(unit, '자원').count, 100);
`);

run("actual skills apply hit effects and support across targets", `
  const unit = battleDummy.allies[0], enemy = battleDummy.enemies[0];
  rollHitPower = () => ({total: 4, wave: 0});
  const hp = enemy.hp;
  resolveRemainingHits(unit, unit.skills[0], enemy, 2);
  assert.equal(enemy.hp, hp - 6);
  assert.equal(getBattleStatus(enemy, '상처'), undefined);
  const support = battleDummy.allies[3]; support.sp = 60; unit.sp = 20;
  applyBattleEffectText(support, enemy, '정신력 최저 아군 [격려 2 / 1]');
  assert.equal(unit.sp, 22);
  support.reserved = support.ego; support.targetId = unit.id;
  resolveUnitAction(support);
  assert.equal(getBattleStatus(unit, '보호').power, 4);
`);

run('focus counts decrease only on critical damage steps in sequence and legacy attacks', `
  const a=battleDummy.allies[0],e=battleDummy.enemies[0];a.x=3;a.y=2;e.x=4;e.y=2;
  e.hp=e.maxHp=10000;rollWaveValue=()=>0;
  for(const sequence of [false,true]) {
    a.buffs=[];a.debuffs=[];a.criticalReady=false;
    const action={name:'focus test',type:'타격',scope:'단일',range:1,hits:2,power:10,wave:0,effect:'',
      ...(sequence?{sequence:[{ratio:.5,effect:''},{ratio:.5,effect:''}]}:{})};
    addBattleStatus(a,'집중',50,5);
    Math.random=()=>.99;resolveRemainingHits(a,action,e,2);
    assert.equal(getBattleStatus(a,'집중').count,5);
    Math.random=()=>0;resolveRemainingHits(a,action,e,2);
    assert.equal(getBattleStatus(a,'집중').count,3);
    a.criticalReady=true;Math.random=()=>.99;resolveRemainingHits(a,action,e,2);
    assert.equal(getBattleStatus(a,'집중').count,2);
  }
`);
run("critical and shock affect power, dodge and counter execute", `
  const unit = battleDummy.allies[0], enemy = battleDummy.enemies[0];
  rollWaveValue = () => 0;
  addBattleStatus(unit, '충격', 2, 1);
  assert.equal(rollHitPower(unit, unit.skills[1], {clash:true}).total, 20);
  consumeBattleStatus(unit, '충격');
  addBattleStatus(unit, '집중', 100, 1); addBattleStatus(unit, '강타', 50, 1);
  const hp = enemy.hp; resolveRemainingHits(unit, {...unit.skills[0], effect:''}, enemy, 1);
  assert.equal(enemy.hp, hp - 25);
  assert.equal(getBattleStatus(unit, '집중'), undefined);
  const dodger = battleDummy.allies[2]; dodger.guardReady = true; dodger.activeGuard = dodger.guard;
  const dodgeHp = dodger.hp; applyBattleDamage(enemy, dodger, 2);
  assert.equal(dodger.hp, dodgeHp); assert.equal(dodger.lastHitEvaded, true);
  enemy.x = unit.x + 1; enemy.y = unit.y;
  unit.guardReady = true; unit.activeGuard = unit.guard;
  const counterHp = enemy.hp; applyBattleDamage(enemy, unit, 2);
  assert.ok(enemy.hp < counterHp); assert.equal(unit.guardReady, false);
`);

run("defenses persist on incoming hits and counters respond only once", `
  const enemy = battleDummy.enemies[0], dodger = battleDummy.allies[2], counter = battleDummy.allies[0];
  rollWaveValue = () => 0;
  dodger.reserved = dodger.guard; resolveUnitAction(dodger);
  const hp = dodger.hp, sp = enemy.sp;
  for (let i=0;i<3;i++) assert.equal(applyBattleDamage(enemy,dodger,2),0);
  assert.equal(dodger.hp,hp); assert.equal(enemy.sp,sp); assert.equal(dodger.guardReady,true);
  applyBattleDamage(enemy,dodger,99);
  assert.equal(dodger.guardReady,false); assert.equal(dodger.activeGuard,null);
  const blocker = battleDummy.allies[1]; blocker.reserved=blocker.guard; resolveUnitAction(blocker);
  const blockHp=blocker.hp;
  applyBattleDamage(enemy,blocker,2); applyBattleDamage(enemy,blocker,2);
  assert.equal(blocker.hp,blockHp); assert.equal(blocker.guardReady,true);
  enemy.x=counter.x+1; enemy.y=counter.y; enemy.hp=enemy.maxHp=1000;
  counter.reserved=counter.guard; resolveUnitAction(counter);
  applyBattleDamage(enemy,counter,1);
  const afterCounter=enemy.hp;
  assert.ok(afterCounter<1000); assert.equal(counter.activeGuard,null);
  applyBattleDamage(enemy,counter,1);
  assert.equal(enemy.hp,afterCounter); assert.equal(counter.guardReady,false);
`);

run("latest valid interceptor owns clash and uses earlier order", `
  const a = battleDummy.allies[0], b = battleDummy.allies[2], e = battleDummy.enemies[0];
  a.x=3; a.y=3; b.x=4; b.y=2; e.x=4; e.y=3;
  a.reserved=a.skills[0]; a.targetId=e.id; a.decisionOrder=10;
  b.reserved=b.skills[0]; b.targetId=e.id; b.decisionOrder=11;
  e.targetId=a.id; e.preparedAction={...getEnemyAction(e), range:2};
  const schedule=getBattleSchedule();
  assert.equal(schedule.plans.find(p=>p.unit.id===e.id).target.id,b.id);
  assert.equal(schedule.ranks.get(b.id),schedule.ranks.get(e.id));
  assert.ok(renderBattleBoardArrows().includes('action-arc gold'));
  b.x=7; b.y=5; a.x=1; a.y=3;
  const arcs=renderBattleBoardArrows();
  assert.ok(arcs.includes('action-arc red')); assert.ok(arcs.includes('action-arc blue'));
  assert.ok(!arcs.includes('action-arc gold'));
`);

run("enemy prepared actions and visible order match execution", `
  const attacker=battleDummy.enemies[0];
  const target=battleDummy.allies.find(unit=>unit.id===attacker.targetId);
  attacker.x=target.x+1; attacker.y=target.y;
  const schedule=getBattleSchedule();
  assert.ok(schedule.events.length >= 3);
  for (const enemy of battleDummy.enemies) {
    assert.ok(schedule.ranks.has(enemy.id));
    assert.ok(enemy.preparedAction);
    assert.ok(renderBattleToken(enemy,'enemy').includes('enemy-action-badge'));
  }
  const targets=battleDummy.allies.map(unit=>unit.hp);
  resolveBattleTurn();
  assert.ok(battleDummy.allies.some((unit,index)=>unit.hp < targets[index]));
  assert.equal(battleDummy.turn,2);
  assert.equal(battleDummy.enemyPreparedTurn,2);
`);

run("lineup deploys four, queues five, excludes Iruri and assigns formation order", `
  showBattleDummy=()=>{};
  const roster=createBattleRoster();
  assert.equal(roster.length,9); assert.ok(roster.every(unit=>unit.name!=='이루리'));
  assert.equal(startBattleLineup(roster.slice(0,8).map(unit=>unit.id)),false);
  const order=roster.map(unit=>unit.id).reverse();
  assert.equal(startBattleLineup(order),true);
  assert.deepEqual(battleDummy.allies.map(unit=>unit.id),order.slice(0,4));
  assert.deepEqual(battleDummy.bench.map(unit=>unit.id),order.slice(4));
  assert.deepEqual(battleDummy.allies.map(unit=>unit.formationOrder),[1,2,3,4]);
  assert.equal(battleDummy.selected,order[0]); assert.ok(battleDummy.lineupReady);
`);

run("extra actions distributed round-robin by formation order without inflation", `
  battleDummy.allies[3].hp=0;
  battleDummy.allies.forEach((unit,index)=>unit.formationOrder=index+1);
  battleDummy.enemies[0].actionsPerTurn=3;
  updateBattleActionCapacity();
  assert.deepEqual(battleDummy.allies.slice(0,3).map(unit=>unit.actionCapacity),[2,2,1]);
  updateBattleActionCapacity();
  assert.deepEqual(battleDummy.allies.slice(0,3).map(unit=>unit.actionCapacity),[2,2,1]);
  assert.equal(getBattleSchedule().plans.filter(plan=>battleDummy.enemies.includes(plan.unit)).length,5);
  battleDummy.enemies[0].actionsPerTurn=8; updateBattleActionCapacity();
  assert.deepEqual(battleDummy.allies.slice(0,3).map(unit=>unit.actionCapacity),[4,3,3]);
`);

run("new card preserves existing reservation, pending cancellation and capacity limit", `
  const a=battleDummy.allies[0], e=battleDummy.enemies[0];
  a.actionCapacity=2; a.hand=[0,1,2,3]; a.x=3;a.y=3;e.x=4;e.y=3;
  reserveBattleSkill('0');assignBattleTarget(e.id);
  const original=a.queuedActions[0];
  reserveBattleSkill('1');
  assert.equal(a.queuedActions.length,1); assert.equal(a.queuedActions[0],original);
  cancelBattleSelection(); assert.equal(a.reserved,original.action);
  reserveBattleSkill('1'); assignBattleTarget(e.id);
  assert.equal(a.queuedActions.length,2);
  reserveBattleSkill('2'); assert.equal(a.queuedActions.length,2); assert.equal(battleDummy.aiming,null);
  reserveBattleSkill('0'); assert.equal(a.queuedActions.length,1); assert.equal(a.queuedActions[0].handIndex,1);
`);

run("multiple actions execute and consume their own hand indexes", `
  const a=battleDummy.allies[0],e=battleDummy.enemies[0];
  a.actionCapacity=2;a.hand=[0,1,2,3];a.x=3;a.y=3;e.x=4;e.y=3;e.hp=e.maxHp=200;
  battleDummy.enemies.slice(1).forEach(unit=>unit.hp=0);
  e.preparedAction={...getEnemyAction(e),range:0};
  reserveBattleSkill('0');assignBattleTarget(e.id);reserveBattleSkill('1');assignBattleTarget(e.id);
  const schedule=getBattleSchedule(); assert.equal(schedule.plans.filter(plan=>plan.unit===a).length,2);
  rollWaveValue=()=>0; resolveBattleTurn();
  assert.equal(e.hp,163); assert.deepEqual(a.discardPile,[1,0]);
  assert.equal(a.hand[0],2);assert.equal(a.hand[1],3);assert.equal(a.queuedActions.length,0);
`);

run("death reinforcement follows queue, same row and rear-column occupancy", `
  showBattleDummy=()=>{};startBattleLineup(createBattleRoster().map(unit=>unit.id));
  const dead=battleDummy.allies[0], next=battleDummy.bench[0];dead.hp=0;
  const blocker=battleDummy.allies[1];blocker.x=1;blocker.y=dead.y;
  processBattleReplacements(true);assert.ok(battleDummy.allies.includes(dead));
  blocker.y=5;processBattleReplacements(true);
  assert.equal(battleDummy.allies[0],next);assert.equal(next.x,1);assert.equal(next.y,dead.y);
  assert.equal(battleDummy.bench.length,4);assert.equal(next.formationOrder,1);
`);

run("swap clears actions, locks actions and movement, cancels, preserves health on return", `
  showBattleDummy=()=>{};startBattleLineup(createBattleRoster().map(unit=>unit.id));
  const a=battleDummy.allies[0],other=battleDummy.allies[1],next=battleDummy.bench[0];
  a.x=1;a.y=1;other.x=1;other.y=2;battleDummy.selected=a.id;
  reserveBattleSkill('guard');assert.equal(a.queuedActions.length,1);
  a.hp=40; assert.equal(reserveBattleSwap(a.id,next.id),true);
  assert.equal(a.queuedActions.length,0);assert.equal(a.reserved,null);
  reserveBattleSkill('0');assert.equal(a.reserved,null);assert.equal(battleDummy.aiming,null);
  assert.equal(canMoveSelectedUnitTo(2,1),false);
  assert.equal(reserveBattleSwap(other.id,next.id),false);
  toggleBattleSwap(a);assert.equal(a.swapTargetId,null);reserveBattleSkill('guard');assert.equal(a.queuedActions.length,1);
  reserveBattleSwap(a.id,next.id);processBattleReplacements(true);assert.ok(battleDummy.allies.includes(a));
  processBattleReplacements();assert.equal(battleDummy.allies[0],next);assert.equal(next.x,1);assert.equal(next.y,1);
  assert.equal(battleDummy.bench.at(-1),a);assert.equal(a.hp,40);assert.equal(a.swapTargetId,null);
`);

run("one lost clash cancels only its own action slot", `
  const a=battleDummy.allies[0],e=battleDummy.enemies[0];a.x=3;a.y=3;e.x=4;e.y=3;
  const ap={unit:a,action:{...a.skills[0],sequence:undefined},target:e,handIndex:0}, ep={unit:e,action:{...getEnemyAction(e),sequence:undefined},target:a};
  resolveClash=()=>({attackerHits:0,defenderHits:1});rollWaveValue=()=>0;
  resolveBattleClashEvent(ap,ep);
  assert.equal(ap.canceled,true);assert.equal(a.actionCanceled,false);
  const before=e.hp;
  resolveUnitAction(a,{unit:a,action:{...a.skills[1],effect:''},target:e,handIndex:1});
  assert.ok(e.hp<before);
`);
