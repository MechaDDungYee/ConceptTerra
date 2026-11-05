const RankCombat=(()=>{
 const E=()=>HospitalEngine,T=()=>E().combatTools,clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const skill=id=>RankCombatData.skills.find(a=>a.id===id);
 const onField=e=>e.hp>0||e.corpseHp>0;
 const allies=s=>s.party.filter(E().alive).sort((a,b)=>a.rank-b.rank);
 const enemies=s=>s.battle.enemies.filter(onField).sort((a,b)=>a.rank-b.rank);
 function normalize(s){
  allies(s).forEach((p,i)=>{p.rank=i+1;p.row=i<2?'front':'rear';});
  let rank=1;enemies(s).forEach(e=>{e.rank=rank;rank+=e.size||1;});
 }
 function upgrade(s){
  const defaults=[2,3,1,4];s.party.forEach((p,i)=>{p.rank??=defaults[i];p.stress??=clamp(20-p.mental*2,0,100);p.dodgeBuff??=0;p.dodgeUntilRound??=0;});
  if(!s.battle)return;
  const b=s.battle;
  if(b.system!=='ranks'){
   b.system='ranks';b.guards={};b.pointer=0;b.queue=[];b.started=null;b.plans={};b.enemies.forEach((e,i)=>{e.rank=i+1;e.size=['tiger','dragon'].includes(b.type)&&b.enemies.length===1?2:1;e.corpseHp=0;e.bleed=0;e.bleedDamage=0;e.role=i<2?'front':'rear';});
   normalize(s);newRound(s,()=>.5);T().log(s,'이전 전투를 4열 편성으로 전환했습니다. 기존 체력과 전투 목적지는 유지합니다.');
  }
 }
 function create(s,type,next,rng=Math.random){
  s.party.forEach(p=>{p.guard=0;p.dodgeBuff=0;p.dodgeUntilRound=0;});
  const model=HospitalData.enemies[type],count={fate:2,wave:s.flags.roofBeacon?2:3,survivors:3,wolf:2,nail:2,falseLight:2}[type]||1;
  const boss=['tiger','dragon'].includes(type);
  s.battle={system:'ranks',type,next,round:1,plans:{},guards:{},queue:[],pointer:0,started:null,intents:[],enemies:Array.from({length:count},(_,i)=>{
   const scale=count===1?1:type==='falseLight'?(i===0?.8:.32):i===count-1?.55:.65,max=Math.round(model.max*scale);
   return {...model,id:i,max,hp:Math.round(max*((type==='wave'&&s.flags.signalPrepared)?.75:1)),rank:boss?1:i+1,size:boss?2:1,stun:0,bleed:0,bleedDamage:0,corpseHp:0,role:i>=2||count>1&&i===count-1?'rear':'front',name:count>1&&i===count-1?`${model.name} · 후열`:model.name};
  })};
  upgrade(s);normalize(s);newRound(s,rng);T().log(s,`${model.name} 조우 · 4열 편성`);
 }
 function newRound(s,rng){
  const b=s.battle;b.pointer=0;b.started=null;b.plans={};b.vigilanteUsed=false;
  b.queue=[...allies(s).map(p=>({side:'ally',id:p.id,speed:Math.floor(T().effective(p,'민첩')/10)+1+Math.floor(rng()*8)})),...b.enemies.filter(e=>e.hp>0).map(e=>({side:'enemy',id:e.id,speed:Math.floor(e.agi/10)+1+Math.floor(rng()*8)}))].sort((a,b)=>b.speed-a.speed||(a.side===b.side?a.id-b.id:a.side==='ally'?-1:1));
  updateIntents(s);
 }
 function current(s){const b=s.battle;return b?.queue[b.pointer]||null;}
 function position(e,allowed){return Array.from({length:e.size||1},(_,i)=>e.rank+i).some(r=>allowed.includes(r));}
 function updateIntents(s){
  const b=s.battle;if(!b)return;b.intents=b.enemies.filter(e=>e.hp>0).map(e=>{
   const candidates=e.role==='rear'?['fear','reach','strike','scramble']:b.round%3===0?['shove','scramble','strike','reach']:['strike','reach','scramble'];
   const id=candidates.find(id=>position(e,RankCombatData.enemySkills[id].from)),a=RankCombatData.enemySkills[id];
   const targets=allies(s).filter(p=>E().active(p)&&a.to.includes(p.rank)),target=(e.role==='rear'?[...targets].sort((a,b)=>b.stress-a.stress):targets)[e.id%Math.max(1,targets.length)];
   return {enemy:e.id,target:target?.id,action:id,attack:id==='strike'?'attack':'special'};
  });
 }
 function skillsFor(id){return RankCombatData.skills.filter(a=>a.users.includes(id));}
 function validTargets(s,id,a){
  if(!a||!s.battle)return [];const p=s.party[id];if(!p||!E().active(p)||!a.from.includes(p.rank))return [];
  if(a.kind==='enemy')return enemies(s).filter(e=>position(e,a.to));
  if(a.kind==='ally')return allies(s).filter(q=>a.to.includes(q.rank)&&(a.id==='heal'?E().alive(q)&&(q.status==='near'||q.hp<q.max||q.bleed>0):E().active(q)));
  return [p];
 }
 function available(s,id,a){
  const p=s.party[id];if(!p||!E().active(p)||!a?.users.includes(id)||!a.from.includes(p.rank)||p.stun>0)return false;
  if(a.item&&(!s.inventory[a.item]||p.traits.includes('boxer')))return false;
  if(a.id==='meaning'&&p.mental<=0)return false;
  if(a.kind==='move'){const n=allies(s).length;return p.rank+a.move>=1&&p.rank+a.move<=n;}
  return validTargets(s,id,a).length>0;
 }
 function plan(s,id,action,target=id){
  const b=s.battle,c=current(s),a=skill(action);
  if(!b||c?.side!=='ally'||c.id!==id||!available(s,id,a))return false;
  if(['enemy','ally'].includes(a.kind)&&!validTargets(s,id,a).some(e=>e.id===target))return false;
  b.plans[id]={action,target};return true;
 }
 function chance(s,id,a,target){
  if(!a.stat)return 100;const saved=s.actor;s.actor=id;const e=s.battle.enemies.find(e=>e.id===target),bonus=75-(e?.agi||20)*.2;const threshold=E().check(s,a.stat,()=>0,.3,'action',bonus).threshold;s.actor=saved;return clamp(threshold,5,95);
 }
 function stress(s,p,amount,rng,push){
  if(!E().alive(p))return;p.stress=clamp(p.stress+Math.round(amount),0,100);if(amount)push?.('stress',`${p.name} 공포 ${amount>0?'+':''}${Math.round(amount)}`,{ally:p.id,amount});
  if(p.stress>=100){p.stress=60;T().changeMental(s,p,-5,rng);E().health(s,p,Math.round(p.max*.15),rng);normalize(s);push?.('panic',`${p.name} 공포 한계 · 체력 15% 피해 · 정신 상태 -5`,{ally:p.id});}
 }
 function move(s,side,id,delta,push){
  const list=side==='ally'?allies(s):enemies(s),index=list.findIndex(e=>e.id===id);if(index<0)return;const to=clamp(index+delta,0,list.length-1);if(index===to)return;
  const [unit]=list.splice(index,1);list.splice(to,0,unit);let rank=1;for(const e of list){e.rank=rank;rank+=side==='enemy'?e.size||1:1;}normalize(s);updateIntents(s);push?.('move',`${unit.name} ${delta<0?'앞':'뒤'}으로 이동`,{side,unit:id});
 }
 function kill(s,e,dot=false){e.hp=0;e.stun=0;e.corpseHp=dot||s.battle.type==='falseLight'?0:Math.max(12,Math.round(e.max*.15));normalize(s);updateIntents(s);}
 function finish(s,rng,push){
  const b=s.battle;if(!b)return true;
  if(s.ending==='lost'){
   if(['jin','survivors'].includes(b.type)){s.ending=null;s.party.forEach(p=>{p.status='normal';p.hp=Math.max(1,Math.round(p.max*.25));p.near=100;p.bleed=0;});s.battle=null;s.camp.trust=-3;s.jin.accompanies=false;if(b.type==='survivors')s.camp.status='hostile';T().goto(s,b.type==='jin'?'bound':'second');push('defeat','제압당했습니다. 생존자들은 더 공격하지 않았습니다.');}
   return true;
  }
  if(b.enemies.some(e=>e.hp>0))return false;
  const before=T().lootSnapshot(s);s.battle=null;
  if(b.type==='survivors'){s.camp.people=0;s.camp.status='dead';T().mental(s,-8,rng);T().record(s,'로비에서의 싸움','생존자들이 목숨을 잃었습니다.');}
  else if(b.type!=='jin')T().partyBond(s,1,'전투에서 생존');
  T().socialTick(s);T().mental(s,s.party.filter(E().active).length,rng);s.party.forEach(p=>{if(p.status==='resist')p.status='normal';p.guard=0;p.dodgeBuff=0;p.dodgeUntilRound=0;p.stun=0;});T().goto(s,b.next);push('victory','전투 종료');
  if(b.rewardBattery){s.flags.battery=true;for(const reward of T().acquired(s,before))push('acquired','물품 획득',{reward});}
  return true;
 }
 function startTurn(s,c,rng,push){
  const b=s.battle,key=`${b.round}:${c.side}:${c.id}`;if(b.started===key)return;b.started=key;
  if(c.side==='ally'){
   const p=s.party[c.id];if(!E().alive(p))return;
   p.guard=0;if(b.round>=p.dodgeUntilRound)p.dodgeBuff=0;for(const [id,guard]of Object.entries(b.guards))if(guard===p.id)delete b.guards[id];
   if(p.bleed>0){p.bleed--;E().health(s,p,6,rng);normalize(s);push('bleed',`${p.name} 출혈 6`,{ally:p.id,damage:6});}
  }else{
   const e=b.enemies.find(e=>e.id===c.id);if(e?.hp>0&&e.bleed>0){e.bleed--;e.hp=Math.max(0,e.hp-e.bleedDamage);push('bleed',`${e.name} 출혈 ${e.bleedDamage}`,{target:e.id,damage:e.bleedDamage});if(!e.hp)kill(s,e,true);}
  }
 }
 function applyAlly(s,c,rng,push){
  const b=s.battle,p=s.party[c.id],pl=b.plans[p.id],a=skill(pl.action);
  if(!available(s,p.id,a)){push('skip',`${p.name} 위치가 바뀌어 ${a.name} 사용 불가`);return;}
  let targets=validTargets(s,p.id,a);if(['ally','enemy'].includes(a.kind)){const primary=targets.find(q=>q.id===pl.target);if(!primary){push('skip',`${p.name} 대상이 사거리에서 벗어났습니다.`);return;}targets=a.area?targets:[primary];}
  push('action',`${p.name} · ${a.name}`,{actor:p.id,target:a.kind==='enemy'?pl.target:undefined,allyTarget:a.kind==='ally'?pl.target:undefined});
  if(a.kind==='move'){move(s,'ally',p.id,a.move,push);return;}
  if(a.kind==='self'){if(a.id==='firm'){p.guard=.5;push('buff',`${p.name} 방어 50%`,{ally:p.id});}else stress(s,p,-3,rng,push);return;}
  if(a.kind==='ally'){
   const q=targets[0],scale=E().supportScale(s,p.id,q.id,rng);if(!scale){push('skip',`${q.name} 지원 거절 · 물품 소모 없음`);return;}
   if(a.id==='heal'){
    s.inventory.medkit--;const amount=Math.floor((q.status==='near'?q.max*.15:25)+(p.traits.includes('religious')?1:0));const was=q.hp;
    if(q.status==='near'){q.status='normal';q.hp=Math.max(1,Math.floor(amount*scale));q.near=100;}else T().heal(q,amount*scale);
    q.bleed=0;push('heal',`${q.name} 체력 +${q.hp-was} · 출혈 제거`,{ally:q.id,amount:q.hp-was});E().bond(s,p.id,q.id,1,'치료');
   }
   if(a.id==='guard'){p.guard=clamp(.5*scale,0,.75);if(q.id!==p.id)b.guards[q.id]=p.id;push('buff',`${p.name}이 ${q.name} 보호`,{ally:q.id});}
   if(a.stress)stress(s,q,a.stress*scale,rng,push);if(a.mental)T().changeMental(s,q,Math.round(a.mental*scale),rng);if(a.dodge){q.dodgeBuff=Math.round(a.dodge*scale);q.dodgeUntilRound=b.round+1;}
   if(a.stress){b.socialAwards??=[];const key=`support:${p.id}:${q.id}`;if(!b.socialAwards.includes(key)){E().bond(s,p.id,q.id,1,'정신적 지원');b.socialAwards.push(key);}}
   return;
  }
  for(const e of targets){
   const bonus=75-e.agi*.2,r=E().performCheck(s,p.id,a.stat,.3,rng,'combat',bonus);T().earnedExp(s,p,r);push('roll',`${p.name} 명중 ${r.die}/${r.threshold}`,{roll:r,actor:p.id});
   if(r.result==='fail'){push('miss',`${e.name} 빗나감`,{target:e.id});continue;}
   const crit=r.result==='critical',damage=Math.max(1,Math.floor(T().effective(p,a.stat)*a.damage*(.85+rng()*.3)*(crit?1.5:1)*(1-e.reduce)));
   if(e.hp<=0){e.corpseHp=Math.max(0,e.corpseHp-damage);push('hit',`잔해 피해 ${damage}`,{target:e.id,damage});normalize(s);updateIntents(s);continue;}
   e.hp=Math.max(0,e.hp-damage);push(crit?'critical':'hit',`${e.name} ${crit?'치명타 ':''}${damage}`,{target:e.id,damage});
   if(crit){stress(s,p,-4,rng,push);T().changeMental(s,p,1,rng);}
   if(!e.hp){kill(s,e);push('death',`${e.name} 쓰러짐`,{target:e.id});}
   else{if(a.bleed){e.bleed=a.bleedTurns;e.bleedDamage=a.bleed;push('buff',`출혈 ${a.bleed} · ${a.bleedTurns}차례`,{target:e.id});}if(a.stun||crit&&a.stunCritical){e.stun=a.stun||a.stunCritical;push('buff','행동 불가 1회',{target:e.id});}if(a.push)move(s,'enemy',e.id,a.push,push);if(a.pull)move(s,'enemy',e.id,-a.pull,push);}
  }
  if(a.advance)move(s,'ally',p.id,-a.advance,push);
 }
 function applyEnemy(s,c,rng,push){
  const b=s.battle,e=b.enemies.find(e=>e.id===c.id);updateIntents(s);const intent=b.intents.find(i=>i.enemy===c.id),a=RankCombatData.enemySkills[intent?.action];if(!a)return;
  let p=s.party[intent.target],vigilanteBonus=0;if(!p||!E().active(p))return;
  const guard=s.party[b.guards[p.id]];if(guard&&E().active(guard)&&guard.stun===0){push('guard',`${guard.name}이 ${p.name} 대신 공격을 받습니다.`,{ally:guard.id});p=guard;}
  const vigilante=s.party.find(q=>q.id!==p.id&&E().active(q)&&q.stun===0&&q.traits.includes('vigilante'));
  if(vigilante&&p.hp<=p.max*.5&&!b.vigilanteUsed){b.vigilanteUsed=true;if(vigilante.traitState.protect){push('guard',`${vigilante.name}이 ${p.name} 보호 · 회피 보정 +1`);p=vigilante;vigilanteBonus=1;}else T().changeMental(s,vigilante,-1,rng);}
  push('action',`${e.name} · ${a.name}`,{enemy:e.id,allyTarget:p.id});
  const threshold=clamp(85-T().effective(p,'민첩')*.25-p.dodgeBuff-vigilanteBonus,5,95),r=T().roll(threshold,rng);push('roll',`${e.name} 명중 ${r.die}/${r.threshold}`,{roll:r,enemy:e.id});
  if(r.result==='fail'){push('miss',`${p.name} 회피`,{ally:p.id});stress(s,p,-1,rng,push);return;}
  let raw=e.damage*a.damage*(.85+rng()*.3)*(r.result==='critical'?1.5:1)*(e.role==='rear'&&intent.action==='strike'?.65:1);
  if(s.jin.accompanies&&!b.jinGuard){raw=Math.max(0,raw-15);b.jinGuard=true;E().bond(s,0,'jin',1,'전투 지원');push('guard','진사준이 피해 15를 막았습니다.');}
  const damage=Math.max(0,Math.floor(raw*(1-(p.guard||0)))),was=p.status;E().health(s,p,damage,rng);push('hit',`${p.name} 피해 ${damage}`,{ally:p.id,damage});
  if(damage>0){if(b.type==='tiger'||b.type==='wolf')p.bleed=2;T().changeMental(s,p,-1,rng);stress(s,p,a.stress+(r.result==='critical'?6:0),rng,push);if(a.push&&E().alive(p))move(s,'ally',p.id,a.push,push);if(a.pull&&E().alive(p))move(s,'ally',p.id,-a.pull,push);}
  normalize(s);if(was!=='collapsed'&&p.status==='collapsed'){for(const q of allies(s))stress(s,q,20,rng,push);push('death',`${p.name} 붕괴`,{ally:p.id});}
 }
 function advance(s,rng=Math.random){
  upgrade(s);const events=[],push=(type,text,extra={})=>{T().log(s,text);events.push({type,text,...extra,view:s.battle?{party:s.party.map(p=>({...p,traits:[...p.traits]})),enemies:s.battle.enemies.map(e=>({...e})),current:current(s)?{...current(s)}:null,round:s.battle.round}:null});};
  if(!s.battle)return events;
  let acted=false;
  for(let limit=0;limit<16&&s.battle;limit++){
   const b=s.battle,c=current(s);
   if(!c){s.turn++;T().socialTick(s);s.party.filter(E().alive).forEach(p=>{if(E().active(p)){const amount=p.mental+p.buffs.reduce((sum,x)=>sum+x.value,0);if(amount<0)E().health(s,p,-amount,rng);else T().heal(p,amount);}p.buffs=p.buffs.map(x=>({...x,duration:x.duration-1})).filter(x=>x.duration>0);});normalize(s);if(finish(s,rng,push))break;b.round++;newRound(s,rng);push('round',`라운드 ${b.round}`);break;}
   startTurn(s,c,rng,push);if(finish(s,rng,push))break;
   const unit=c.side==='ally'?s.party[c.id]:b.enemies.find(e=>e.id===c.id);
   if(c.side==='ally'&&!E().active(unit)||c.side==='enemy'&&unit.hp<=0){b.pointer++;continue;}
   if(unit.stun>0){unit.stun--;push('skip',`${unit.name} 행동 불가`);b.pointer++;continue;}
   if(c.side==='ally'){
    s.actor=c.id;if(acted||!b.plans[c.id]){push('ready',`${unit.name}의 차례`,{actor:c.id});break;}
    applyAlly(s,c,rng,push);delete b.plans[c.id];acted=true;
   }else applyEnemy(s,c,rng,push);
   b.pointer++;if(finish(s,rng,push))break;
  }
  return events;
 }
 function resolveRound(s,rng=Math.random){
  const round=s.battle?.round,events=[];
  for(let limit=0;limit<20&&s.battle?.round===round&&!s.ending;limit++){
   const c=current(s);if(c?.side==='ally'&&E().active(s.party[c.id])){const a=skillsFor(c.id).find(a=>a.kind==='enemy'&&available(s,c.id,a))||(available(s,c.id,skill('move-front'))?skill('move-front'):skill('wait')),target=validTargets(s,c.id,a)[0]?.id||0;plan(s,c.id,a.id,target);}
   events.push(...advance(s,rng));
  }return events;
 }
 return {create,upgrade,current,advance,resolveRound,plan,skill,skillsFor,available,validTargets,chance,allies,enemies,move};
})();
