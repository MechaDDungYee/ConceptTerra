const HospitalEngine = (() => {
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 const alive=p=>p.status!=='collapsed';
 const active=p=>p.status==='normal'||p.status==='resist';
 const stats=['근력','지능','민첩'];
 function member(id,name,values,role,color){
  const max=5*values[0]+values[1]+values[2];
  return {id,name,stats:Object.fromEntries(stats.map((s,i)=>[s,values[i]])),max,hp:max,near:100,status:'normal',mental:2,xp:0,level:1,row:id%2===0?'front':'rear',color,role,stun:0,bleed:0,buffs:[],guarded:false};
 }
 function create(name='참가자',values=[50,50,50],traitIds=['unemployed']){
  if(values.length!==3||values.some(n=>!Number.isInteger(n)||n<1||n>100)||values.reduce((a,b)=>a+b,0)!==150)throw Error('주 능력치 합계는 150이어야 합니다.');
  const chosen=validateTraits(traitIds),adjusted=values.map((n,i)=>clamp(n+chosen.reduce((sum,t)=>sum+(t.stats?.[i]||0),0),1,100));
  const s={version:1,scene:'ward',turn:0,party:[member(0,name,adjusted,'임상시험 참가자','#d8be81'),member(1,'윤서린',[35,70,45],'기록을 남기는 참가자','#83b6b0'),member(2,'강태석',[70,35,45],'문을 지키는 참가자','#bfa292'),member(3,'리하경',[40,45,65],'소리에 민감한 참가자','#a3a3ce')],inventory:{food:2,medkit:3,bandage:2},notes:[],searched:[],once:[],rests:[],flags:{},visited:['ward'],log:[],battle:null,ending:null,actor:0,last:null};
  s.party[0].traits=[...traitIds];s.party[0].mental=clamp(2+chosen.reduce((sum,t)=>sum+(t.mental||0),0),-30,30);upgrade(s);
  const affinity=clamp(chosen.reduce((sum,t)=>sum+(t.affinity||0),0),-10,10);
  for(const id of [1,2,3,'jin']){s.affinity[0][id]=affinity;s.affinity[id][0]=affinity;}
  return s;
 }
 function validateTraits(ids){
  if(!Array.isArray(ids)||new Set(ids).size!==ids.length)throw Error('특성 목록을 확인해 주세요.');
  const chosen=ids.map(id=>HospitalData.traits.find(t=>t.id===id));
  if(chosen.some(t=>!t)||chosen.filter(t=>t.kind==='start').length>3||chosen.filter(t=>t.kind==='unique').length!==1)throw Error('시작 특성 최대 3개와 고유 특성 1개를 선택해 주세요.');
  if(chosen.some(t=>ids.includes(t.opposite)))throw Error('서로 반대되는 특성은 함께 선택할 수 없습니다.');return chosen;
 }
 const hasTrait=(p,id)=>p.traits?.includes(id)||false;
 function log(s,text){s.log.push({turn:s.turn,text});if(s.log.length>160)s.log.shift();}
 function upgrade(s){
  s.camp??={trust:s.flags.trust?1:0,stock:{food:0,medkit:1,bandage:0},people:7,status:'waiting',waits:0,secured:false};
  s.jin??={state:'unknown',accompanies:false};s.decisions??=[];s.pendingLoot??={};
  const ids=[0,1,2,3,'jin'];s.affinity??={};
  for(const from of ids){s.affinity[from]??={};for(const to of ids)if(from!==to)s.affinity[from][to]??=from==='jin'||to==='jin'?(s.jin.state==='friendly'?2:s.jin.state==='hostile'?-4:0):0;}
  for(const p of s.party){p.traits??=['unemployed'];p.socialMental??=0;p.traitState??={};const x=p.traitState;x.used??={};x.prediction??=null;x.stacks??=1;x.reroll??=false;x.invert??=false;x.delegate??=null;x.debt??=null;x.protect??=true;for(const field of ['debt','delegate'])if(x[field]!==null&&(!s.party[x[field]]||!active(s.party[x[field]])))x[field]=null;}
  s.relationshipLog??=[];s.readNotes??=[];if(typeof RankCombat!=='undefined')RankCombat.upgrade(s);return s;
 }
 function relationship(s,from,to){return clamp(s.affinity?.[from]?.[to]||0,-10,10);}
 function relationshipLevel(n){return n<=-10?'적대':n<=-5?'불신':n<0?'의심':n===0?'중립':n<5?'안정':n<10?'신뢰':'결의';}
 function affinityChange(s,from,to,amount,reason){
  if(from===to||!amount)return;upgrade(s);const before=relationship(s,from,to),after=clamp(before+amount,-10,10);if(before===after)return;
  s.affinity[from][to]=after;const name=id=>id==='jin'?'진사준':s.party[id]?.name||'동행자';
  const text=`${name(from)} → ${name(to)} 호감도 ${after-before>0?'+':''}${after-before} (${after} · ${reason})`;log(s,text);s.relationshipLog.push({turn:s.turn,text});if(s.relationshipLog.length>100)s.relationshipLog.shift();
 }
 function bond(s,from,to,amount,reason){affinityChange(s,from,to,amount,reason);affinityChange(s,to,from,amount,reason);}
 function partyBond(s,amount,reason){for(let i=0;i<s.party.length;i++)for(let j=i+1;j<s.party.length;j++)if(alive(s.party[i])&&alive(s.party[j]))bond(s,i,j,amount,reason);}
 function supportScale(s,provider,recipient,rng=Math.random){
  if(provider===recipient)return 1;const n=relationship(s,recipient,provider);
  return n===-10?0:n<=-5?(rng()<.5?0:.5):n<0?.75:n===0?1:n<5?1.1:n<10?1.25:1.5;
 }
 function changeMental(s,p,amount,rng=Math.random){const signed=hasTrait(p,'inverted')?-amount:amount,value=hasTrait(p,'veteran')&&rng()<.5?Math.trunc(signed/2):signed;p.mental=clamp(p.mental+value,-30,30);}
 function traitAbility(s,id,mode,arg=null,rng=Math.random){
  upgrade(s);const p=s.party[id],t=HospitalData.traits.find(t=>p?.traits.includes(t.id)&&t.ability===mode);if(!t||!active(p)||s.ending)return false;const x=p.traitState;
  if(mode==='protect'){x.protect=!x.protect;log(s,`${p.name} 자경단 보호 ${x.protect?'활성':'비활성'}`);return true;}
  if(mode==='delegate'){if(x.debt)return false;if(arg==='cancel'){x.delegate=null;return true;}if(!Number.isInteger(arg)||arg===id||!active(s.party[arg]))return false;x.delegate=arg;log(s,`${p.name} 다음 판정을 ${s.party[arg].name}에게 부탁합니다.`);return true;}
  if(['reroll','invert'].includes(mode)&&x[mode]){x[mode]=false;return true;}
  if(x.used[mode]===s.turn)return false;
  if(mode==='predict'){if(x.prediction||!['success','fail'].includes(arg))return false;x.prediction=arg;x.used[mode]=s.turn;}
  else if(mode==='encourage'){x.used[mode]=s.turn;const amount=rng()<.5?2:-2;mental(s,amount,rng);log(s,`${p.name} 언변: 전원 정신 상태 ${amount>0?'+':''}${amount}`);}
  else if(['reroll','invert'].includes(mode))x[mode]=true;
  else return false;
  log(s,`${p.name} 고유 특성: ${t.name}${mode==='encourage'?' 사용':' 예약'}`);return true;
 }
 function performCheck(s,id,stat,ratio=1,rng=Math.random,context='action',bonus=0){
  upgrade(s);let p=s.party[id],roller=p;const meddler=s.party.find(q=>hasTrait(q,'meddler')&&active(q));
  if(meddler){const x=meddler.traitState;if(x.debt===id){roller=meddler;x.debt=null;log(s,`${meddler.name}이 약속대로 ${p.name}의 판정을 대신합니다.`);}else if(id===meddler.id&&x.delegate!==null){const other=s.party[x.delegate];if(active(other)){roller=other;x.debt=other.id;log(s,`${other.name}이 ${p.name}의 판정을 대신합니다.`);}x.delegate=null;}}
  const preview=testMember(roller,stat,ratio,()=>0,context);const value=context==='combat'?clamp(preview.threshold+bonus,5,95):preview.threshold+bonus;
  let r={...roll(value,rng),rolledBy:roller.id};const x=p.traitState;
  if(hasTrait(p,'gambler')&&x.reroll&&r.result==='fail'&&x.used.reroll!==s.turn){const first=r.die;r={...roll(value,rng),rolledBy:roller.id,rerolled:first};x.reroll=false;x.used.reroll=s.turn;log(s,`${p.name} 재시도: ${first} → ${r.die}`);}
  if(hasTrait(p,'deceiver')&&x.invert&&x.used.invert!==s.turn){r.originalResult=r.result;r.result=r.result==='fail'?'success':'fail';x.invert=false;x.used.invert=s.turn;log(s,`${p.name} 판정 뒤집기: ${r.originalResult} → ${r.result}`);}
  if(hasTrait(p,'prophet')&&x.prediction){const correct=(r.result!=='fail')===(x.prediction==='success'),amount=x.stacks*(correct?1:-1);mental(s,amount,rng);x.stacks=clamp(x.stacks+(correct?1:-1),1,10);x.prediction=null;log(s,`${p.name} 예측 ${correct?'성공':'실패'}: 전원 정신 상태 ${amount>0?'+':''}${amount} · 예언 중첩 ${x.stacks}`);r.predictionCorrect=correct;}
  return r;
 }
 function earnedExp(s,p,r){exp(s.party[r.rolledBy]||p,r);}
 function socialTick(s){
  for(const p of s.party.filter(alive)){const others=s.party.filter(q=>q.id!==p.id&&alive(q));const total=others.reduce((sum,q)=>sum+relationship(s,p.id,q.id),0);const value=Math.sign(total);if(value!==p.socialMental){changeMental(s,p,value-p.socialMental);p.socialMental=value;}}
 }
 function decisionRelations(s,event,r,before){
  const jinChanges={trust:1,distance:-1,threat:-1,apologize:1,fight:-3,spare:2,reject:-1,kill:-10};
  if(jinChanges[event])bond(s,0,'jin',jinChanges[event],'생존자에 대한 선택');
  const amounts=event==='donate'?[2,0,1]:event==='half'?[1,1,1]:event==='keep'?[-1,1,0]:event==='hide'?[-1,0,-1]:event==='kill'||event==='camp_fight'?[-3,-3,-3]:event==='gift'?[1,1,1]:event==='secure'&&r?.result!=='fail'?[1,1,1]:null;
  const distributed=['donate','half','keep','hide'].includes(event);
  if(amounts&&(!distributed||Object.values(before.pending).some(n=>n>0)))amounts.forEach((n,i)=>bond(s,0,i+1,n,'선택에 대한 평가'));
 }
 function record(s,label,effect){s.decisions.push({turn:s.turn,label,effect});log(s,`${label}: ${effect}`);return effect;}
 function disabled(s,c){upgrade(s);return !!(c.once&&s.once.includes(c.once)||c.effectsOnce&&c.stat&&s.once.includes(c.effectsOnce)||c.requiresNote&&!s.notes.includes(c.requiresNote)||c.requires==='experiment'&&!s.notes.includes('experiment')||['food','medkit'].includes(c.requires)&&!s.inventory[c.requires]||Object.entries(c.cost||{}).some(([id,n])=>(s.inventory[id]||0)<n)||['warn','gift','aid'].includes(c.event)&&s.camp.status==='dead');}
 function readNote(s,id){upgrade(s);if(!s.notes.includes(id)||!HospitalData.notes[id])return false;if(!s.readNotes.includes(id)){s.readNotes.push(id);log(s,`기록 열람: ${HospitalData.notes[id].title}`);}return true;}
 function sceneEffects(s,c,r,rng){
  if(!c.effects)return;const key=c.effectsOnce;if(key&&s.once.includes(key))return;if(key)s.once.push(key);
  const fx=c.effects,ok=r?.result!=='fail';
  if(fx.flag)s.flags[fx.flag]=true;if(fx.successFlag&&ok)s.flags[fx.successFlag]=true;
  if(fx.flag==='password')s.flags.signalPrepared=true;
  if(fx.mental)mental(s,fx.mental,rng);if(fx.heal)s.party.filter(active).forEach(p=>heal(p,fx.heal));
  if(fx.damage)s.party.filter(active).forEach(p=>health(s,p,fx.damage,rng));
  if(!ok&&fx.failDamage)s.party.filter(active).forEach(p=>health(s,p,fx.failDamage,rng));
  if(!ok&&fx.failMental)mental(s,fx.failMental,rng);
  if(fx.bond)bond(s,0,fx.bond[0],fx.bond[1],'함께한 탐색');
  for(const [id,n] of Object.entries(fx.items||{}))s.inventory[id]=(s.inventory[id]||0)+n;
  if(['shelter','campDuty'].includes(fx.flag)&&ok)s.camp.secured=true;
  log(s,`탐색 선택: ${c.label}`);
 }
 function routeBonus(s,c){return (c.checkBonus||0)+(c.requiresNote&&s.notes.includes(c.requiresNote)?(c.noteBonus||0):0)+(c.stat==='민첩'&&c.combat&&s.flags.quietPlan?10:0)+(c.combat==='tiger'&&s.flags.tigerRoute?15:0)+(c.combat&&s.flags.listened?5:0)+(s.scene==='generator_panel'&&s.flags.cleanContacts?10:0);}
 function choiceCheck(s,c,rng=Math.random){return check(s,c.stat,rng,1,c.loot||c.note?'research':'action',routeBonus(s,c));}
 function decision(s,event,r){
  const camp=s.camp,jin=s.jin,ok=r?.result!=='fail';
  const trust=n=>camp.trust=clamp(camp.trust+n,-5,5);
  switch(event){
   case 'trust':jin.state='friendly';trust(1);return '진사준이 우리를 기억합니다. 동행을 제안할 수 있습니다.';
   case 'distance':jin.state=jin.state==='dead'?'dead':'guarded';jin.accompanies=false;return '진사준과 거리를 둡니다. 탐색 중 그의 지원을 받지 않습니다.';
   case 'threat':jin.state='guarded';trust(-1);return '진사준과 생존자들의 경계가 높아졌습니다.';
   case 'apologize':jin.state='friendly';return '진사준은 사과를 받아들입니다. 로비의 불신은 아직 남아 있습니다.';
   case 'fight':jin.state='hostile';jin.accompanies=false;trust(-2);return '진사준이 자신을 지키기 위해 맞섭니다.';
   case 'spare':s.inventory.medkit--;jin.state='friendly';trust(1);return '치료 가방 1개를 건넸습니다. 진사준이 다시 대화할 마음을 엽니다.';
   case 'reject':jin.state='guarded';return '진사준을 살려 두었지만 관계는 멀어졌습니다.';
   case 'kill':jin.state='dead';jin.accompanies=false;trust(-5);mental(s,-8);return '진사준이 사망했습니다. 생존자들은 우리를 적으로 여깁니다.';
   case 'camp_fight':trust(-5);return '생존자들이 저항합니다. 이 싸움은 로비의 지원을 잃게 합니다.';
   case 'exile':camp.status='hostile';jin.accompanies=false;return '로비에서 떨어져 나왔습니다. 공동 물품을 받을 수 없습니다.';
   case 'reconcile':trust(1);return '일을 도왔지만 신뢰는 조금씩 회복해야 합니다.';
   case 'donate':case 'half':case 'keep':case 'hide':{
    let shared=0,kept=0;
    for(const [id,n] of Object.entries(s.pendingLoot)){const give=event==='donate'?n:event==='half'?Math.floor(n/2):0;camp.stock[id]+=give;s.inventory[id]+=n-give;shared+=give;kept+=n-give;}
    s.pendingLoot={};if(event==='donate')trust(2);if(event==='half'&&shared)trust(1);if(event==='keep')trust(-1);if(event==='hide')s.flags.hiddenSupplies=kept>0;
    if(shared)mental(s,2);return `공동 비축분 +${shared} · 우리 소지품 +${kept}${event==='hide'?' · 숨긴 사실은 아직 알려지지 않았습니다.':''}`;
   }
   case 'together':jin.accompanies=jin.state==='friendly'&&camp.trust>=0&&relationship(s,'jin',0)>=0;if(jin.accompanies&&s.flags.hiddenSupplies){trust(-2);s.flags.hiddenSupplies=false;jin.accompanies=false;return '짐 속 물품이 드러났습니다. 진사준이 동행을 거절합니다.';}return jin.accompanies?'진사준이 동행합니다. 전투마다 처음 받는 피해를 15 줄여 줍니다.':'진사준이 동행을 거절했습니다. 우리끼리 올라갑니다.';
   case 'alone':jin.accompanies=false;return '우리끼리 탐색합니다. 진사준은 로비에 남습니다.';
   case 'secure':camp.secured=ok;return ok?'로비의 방벽을 보강했습니다. 나중의 습격에서 생존자가 몸을 피할 시간을 벌어 줍니다.':'방벽이 제대로 고정되지 않았습니다.';
   case 'watch':if(ok){camp.secured=true;s.flags.warned=true;}return ok?'정병헌의 이상 징후를 알아챘습니다. 생존자들을 떨어뜨려 놓고 피할 곳을 마련합니다.':'불안해 보이지만 원인을 알아내지 못했습니다.';
   case 'wait':camp.waits++;if(s.inventory.food){s.inventory.food--;mental(s,1);}else{mental(s,-3);s.party.filter(active).forEach(p=>health(s,p,8));}if(camp.waits===3){camp.people=Math.max(0,camp.people-2);trust(-1);}return `로비에서 계속 기다립니다. ${s.inventory.food?'식량이 줄어듭니다.':'식량이 바닥나 피로가 쌓입니다.'}${camp.waits===3?' 기다림을 견디지 못한 두 사람이 먼저 떠났습니다.':''}`;
   case 'back':s.flags.returnScene=s.scene;if(s.flags.hiddenSupplies){trust(-2);s.flags.hiddenSupplies=false;}return '로비로 돌아갑니다. 숨긴 물품이 있었다면 다른 생존자들이 알아챕니다.';
   case 'warn':camp.secured=true;s.flags.warned=true;trust(1);return '실험 기록을 전했습니다. 생존자들이 위험한 사람과 떨어져 몸을 숨깁니다.';
   case 'gift':s.inventory.food--;camp.stock.food++;trust(1);return '식량 1개를 건넸습니다. 생존자들의 신뢰가 조금 회복됩니다.';
   case 'aid':if(camp.trust>=1&&camp.status!=='hostile'&&camp.stock.medkit>0){camp.stock.medkit--;s.inventory.medkit++;return '공동 비축분에서 치료 가방 1개를 받았습니다.';}return '신뢰나 비축 물품이 부족해 도움을 받지 못했습니다.';
   case 'return':return '탐색하던 층으로 돌아갑니다.';
  }
  return '';
 }
 function sceneContext(s){
  upgrade(s);const scene={...HospitalData.scenes[s.scene]};
  if(scene.speaker==='진사준'&&(s.jin.state==='dead'||!s.jin.accompanies&&scene.floor>1)){scene.speaker='나';scene.text=scene.text.replace(/진사준/g,'동행자');}
  if(s.scene==='supplies')scene.text+=`\n찾아온 물품: ${Object.entries(s.pendingLoot).map(([k,n])=>`${HospitalData.items[k].name} ${n}`).join(' · ')||'없음. 배치도 정보만 확보했습니다.'}`;
  if(s.scene==='lobby'&&s.jin.state==='dead'){scene.speaker='생존자';scene.text='로비의 생존자들은 우리가 오자 말을 멈춘다. 정문은 잠겼고 두꺼운 셔터가 내려와 있다.\n각자 물품을 모으지만 우리를 향한 경계는 아직 풀리지 않았다.';}
  if(s.scene==='camp_return'&&s.camp.status==='dead'){scene.speaker='나';scene.text='너무 늦었다. 로비의 사람들은 돌아오지 못했다. 건넸던 물품도 더는 누군가를 지켜 주지 못한다.';}
  if(s.scene==='generator'&&s.camp.status!=='dead')scene.text='정병헌이 발전기를 막고 있다. 생존자들은 우리가 보강한 방벽 뒤에 몸을 숨겼다.\n그들이 빠져나오려면 이곳을 통과해야 한다. 발전기의 전원도 필요하다.';
  if(scene.floor>1&&s.jin.accompanies)scene.text+='\n진사준이 뒤를 지키며 함께 움직인다.';
  if(['second','fourth','camp_wait'].includes(s.scene)){
   const friend=s.party.filter(p=>p.id!==0&&alive(p)&&relationship(s,p.id,0)>=5)[0];
   const skeptic=s.party.filter(p=>p.id!==0&&alive(p)&&relationship(s,p.id,0)<=-5)[0];
   if(friend)scene.text+='\n동행자와의 신뢰가 높습니다. 떨어진 사람을 지원할 가능성이 높습니다.';
   else if(skeptic)scene.text+='\n동행자와의 불신이 높습니다. 지원을 거절할 가능성이 있습니다.';
  }
  if(['rescue_reply','rescue_watch','rescue_wave','rescue_arrival'].includes(s.scene)&&s.flags.route==='ground'){scene.floor=1;scene.chapter='08 / 로비에서의 구조';}
  if(s.scene==='ending')scene.text+='\n'+epilogue(s);
  return scene;
 }
function epilogue(s){upgrade(s);return `${s.camp.status==='dead'?'로비의 생존자들은 구조받지 못했습니다.':`로비에서 ${s.camp.people}명이 살아남았습니다.${s.flags.warned?' 전해 준 경고가 피신을 도왔습니다.':s.camp.secured?' 보강한 방벽이 피신할 시간을 벌었습니다.':''}`} ${s.jin.state==='dead'?'진사준은 돌아오지 못했습니다.':s.jin.accompanies?'진사준은 우리와 함께 끝까지 버텼습니다.':'진사준은 우리와 떨어져 자신의 길을 택했습니다.'}${s.flags.roofSeen?'\n옥상까지 올랐지만 황야에서 살아남으려면 다른 사람의 도움이 필요했습니다. 옥상에 출구는 없었고, 다시 내려오는 동안에도 노출은 계속됐습니다.':''}${s.flags.evidenceHanded?`\n확보한 기록 ${s.notes.length}건을 조사 담당자에게 전달했습니다. 접수 담당자는 자료를 받아 갔지만 조사나 보상을 약속하지 않았습니다.`:''}`;}
 function roll(value,rng=Math.random){const die=1+Math.floor(rng()*100),threshold=clamp(Math.floor(value),0,100);return {die,threshold,result:die<=threshold*.25?'critical':die<=threshold?'success':'fail'};}
 function effective(p,stat){return p.stats[stat]*(p.status==='near'?.5:1)*(p.status==='resist'?1.25:1);}
 function testMember(p,stat,ratio,rng=Math.random,context='action'){const bonus=(hasTrait(p,'boxer')?2:0)+(context==='research'&&hasTrait(p,'cleaner')?Math.sign(p.mental)*2:0);return roll(effective(p,stat)*ratio+bonus,rng);}
 function previewMember(s,id){const meddler=s.party.find(q=>hasTrait(q,'meddler')&&active(q));if(meddler){const x=meddler.traitState;if(x?.debt===id)return meddler;if(id===meddler.id&&x?.delegate!==null&&active(s.party[x?.delegate]))return s.party[x.delegate];}return s.party[id];}
 function check(s,stat,rng=Math.random,ratio=1,context='action',bonus=0){const p=previewMember(s,s.actor),result=testMember(p,stat,ratio,()=>0,context);return roll(result.threshold+bonus,rng);}
 function health(s,p,damage,rng=Math.random){
  damage=Math.max(0,Math.floor(damage));if(!alive(p))return;
  if(p.status==='near'){
   p.near=Math.max(0,p.near-damage);log(s,`${p.name} 빈사 체력 -${damage}`);
   if(p.near===0){
    if(rng()<.75){p.status='collapsed';log(s,`${p.name} 붕괴 — 제어권 상실`);s.party.filter(q=>q.id!==p.id&&alive(q)).forEach(q=>health(s,q,Math.floor(p.max*.1),rng));}
    else{p.status='resist';p.hp=Math.floor(p.max*.5);changeMental(s,p,5,rng);s.party.filter(q=>q.id!==p.id&&active(q)).forEach(q=>q.hp=Math.min(q.max,q.hp+Math.floor(q.max*.25)));log(s,`${p.name} 저항 — 동행자를 일으킵니다`);}
   }
  }else{p.hp=Math.max(0,p.hp-damage);log(s,`${p.name} 체력 -${damage}`);if(!p.hp){p.status='near';p.near=p.near||100;log(s,`${p.name} 빈사 상태 진입`);}}
  if(!s.party.some(active))s.ending='lost';
 }
 function heal(p,value){if(active(p))p.hp=Math.min(p.max,p.hp+Math.floor(value));}
 function mental(s,amount,rng=Math.random){s.party.filter(alive).forEach(p=>changeMental(s,p,amount,rng));}
 function exp(p,r){if(r.result!=='fail')p.xp+=r.result==='critical'?2:1;}
 function addNote(s,id){if(!s.notes.includes(id)){s.notes.push(id);log(s,`기록 획득: ${HospitalData.notes[id].title}`);}}
 function goto(s,id){upgrade(s);s.scene=id;if(!s.visited.includes(id))s.visited.push(id);if(id==='hope'&&!s.flags.campResolved){s.flags.campResolved=true;if(!s.camp.secured){s.camp.people=0;s.camp.status='dead';if(!s.jin.accompanies)s.jin.state='dead';record(s,'남겨진 로비','보호받지 못한 생존자들이 정병헌의 공격을 견디지 못했습니다.');}else record(s,'남겨진 로비','생존자들이 마련해 둔 피신처로 도망쳤습니다.');}if(id==='ending'){s.ending=s.flags.roofSeen?'roof':s.flags.route==='ground'?'ground':'rescue';}log(s,`이동: ${HospitalData.scenes[id].title}`);}
 function startBattle(s,type,next,rng=Math.random){
  if(typeof RankCombat!=='undefined'){RankCombat.create(s,type,next,rng);return;}
  const model=HospitalData.enemies[type];
  s.battle={type,next,round:1,enemies:Array.from({length:type==='wave'&&!s.flags.roofBeacon?2:1},(_,i)=>({...model,id:i,hp:Math.floor(model.max*((type==='wave'&&s.flags.signalPrepared)?0.75:1)),stun:0})),plans:{},intents:[],fleeBlocked:0};
  intent(s,rng);log(s,`${model.name} 조우`);
 }
 function intent(s,rng=Math.random){
  const b=s.battle,targets=s.party.filter(active);if(!targets.length)return;
  const front=targets.filter(p=>p.row==='front');
  b.intents=b.enemies.filter(e=>e.hp>0).map(e=>({enemy:e.id,target:(front.length?front:targets)[Math.floor(rng()*(front.length?front.length:targets.length))].id,attack:b.round%3===0?'special':'attack'}));
 }
 function choose(s,index,rng=Math.random){
  upgrade(s);if(s.battle||s.ending)return null;
  const scene=HospitalData.scenes[s.scene],c=scene.choices[index];if(!c)return null;
  const before=lootSnapshot(s);
  if(disabled(s,c))return {message:'지금은 선택할 수 없습니다.'};
  for(const [id,n] of Object.entries(c.cost||{}))s.inventory[id]-=n;
  if(c.rest){
   if(s.rests.includes(scene.floor))return {message:'이 층에서는 이미 충분히 정비했습니다.'};
   if(!s.inventory.food)return {message:'정비할 식량이 없습니다.'};
   s.inventory.food--;s.rests.push(scene.floor);s.party.forEach(p=>{heal(p,(p.max*.12+(hasTrait(s.party[0],'religious')?1:0))*supportScale(s,0,p.id,rng));if(p.stress!==undefined)p.stress=Math.max(0,p.stress-15);});partyBond(s,1,'함께 정비');socialTick(s);mental(s,3,rng);s.turn++;log(s,'식량을 나누고 정비했습니다.');return {message:'기본 체력 12% 회복 · 정신 상태 +3 · 공포 15 감소 · 호감도에 따라 회복량 변동'};
  }
  if(c.search){
   const key=c.searchKey||`${scene.floor}`;if(s.searched.includes(key))return {message:'이미 수색한 장소입니다.'};
   s.searched.push(key);const r=performCheck(s,s.actor,'민첩',1,rng,'research');earnedExp(s,s.party[s.actor],r);s.turn++;
   if(c.searchLoot){for(const [item,amount] of Object.entries(c.searchLoot))s.pendingLoot[item]=(s.pendingLoot[item]||0)+amount+(r.result==='critical'?1:0);}
   else{s.inventory.food+=r.result==='fail'?1:2;s.inventory.medkit+=r.result==='critical'?2:1;}
   if(r.result==='fail')mental(s,-2,rng);s.last=r;log(s,`${scene.title} 수색: ${r.result}`);if(c.searchKey&&c.next!==s.scene)goto(s,c.next);return {roll:r,message:c.searchLoot?'물품을 발견했습니다. 로비에서 배분을 결정합니다.':'식량과 치료 가방을 챙겼습니다.',rewards:acquired(s,before)};
  }
  const group=!!(c.stat&&scene.floor>=3&&c.next!==s.scene&&!c.battle);
  let extra=routeBonus(s,c);const repentant=s.party.find(p=>active(p)&&hasTrait(p,'repentant'));
  if(group&&repentant&&rng()<.5){extra+=13;log(s,'회개한 악인: 단체 이동 판정값 +13');}
  let r=c.stat?performCheck(s,s.actor,c.stat,1,rng,c.loot||c.note?'research':'action',extra):null;
  if(r)earnedExp(s,s.party[s.actor],r);
  if(group&&repentant&&r.result!=='fail'){mental(s,1,rng);log(s,'회개한 악인: 단체 이동 성공 · 전원 정신 상태 +1');}
  s.turn++;s.last=r;
  if(c.once)s.once.push(c.once);
  sceneEffects(s,c,r,rng);
  if(s.ending)return {roll:r,message:'더 이상 통로를 건널 수 있는 동행자가 없습니다.',rewards:[]};
  if(c.note)addNote(s,c.note);
  if(c.loot)s.pendingLoot[c.loot]=(s.pendingLoot[c.loot]||0)+(r?.result==='critical'?3:r?.result==='success'?2:1);
  if(c.share){mental(s,3);s.inventory.medkit++;s.flags.trust=true;}
  if(c.trust)s.flags.trust=true;
  if(c.stress)mental(s,c.stress,rng);
  if(c.blessing){const p=[...s.party].filter(active).sort((a,b)=>a.mental-b.mental)[0];if(p){p.hp=p.max;p.mental=Math.max(5,p.mental);p.buffs.push({kind:'구원',value:1,duration:999});}}
  if(c.route)s.flags.route=c.route;
  const effect=c.event?record(s,c.label,decision(s,c.event,r)):'';
  if(c.event)decisionRelations(s,c.event,r,before);
  if(r&&scene.floor>=3&&c.next!==s.scene&&!c.battle)partyBond(s,r.result==='fail'?-1:1,'단체 이동 판정');
  if(r?.result==='fail'&&c.combat&&s.flags.safetyLine){mental(s,1,rng);s.flags.safetyLine=false;log(s,'연결한 줄로 동행자가 뒤처지는 것을 막았습니다. 정신 상태 +1');}
  if(c.note&&!before.notes.includes(c.note))bond(s,s.actor,1,1,'기록을 함께 확인');socialTick(s);
  const message=effect||(r?(r.result==='fail'?(c.fail||'판정에 실패했지만 다른 길을 찾아 나아갑니다.'):(c.success||'필요한 것을 확인했습니다.')):'');
  if(r)log(s,`${c.stat} ${r.die}/${r.threshold} ${r.result}`);
  if(c.next==='barricade'&&!s.rests.includes(2))mental(s,-4);
  const next=r?.result==='fail'&&c.failureNext?c.failureNext:c.next;
  if(c.battle||(r?.result==='fail'&&c.combat)){startBattle(s,c.battle||c.combat,next,rng);s.battle.rewardBattery=!!c.battery;}
  else {if(c.battery)s.flags.battery=true;goto(s,c.event==='return'?(s.flags.returnScene||'second'):next);}
  return {roll:r,message,rewards:acquired(s,before)};
 }
 function plan(s,id,action,target=0){
  if(s.battle?.system==='ranks')return RankCombat.plan(s,id,action,target);
  if(!s.battle||!active(s.party[id]))return false;
  const a=HospitalData.actions.find(a=>a.id===action),p=s.party[id];if(!a||p.hp<=a.cost)return false;
  if(action==='meaning'&&p.mental<=0)return false;
  if(action==='heal'&&hasTrait(p,'boxer'))return false;
  if(action==='heal'&&s.inventory.medkit<=Object.values(s.battle.plans).filter(x=>x.action==='heal').length)return false;
  if(['attack','break'].includes(action)&&!s.battle.enemies.some(e=>e.id===target&&e.hp>0))return false;
  s.battle.plans[id]={action,target};return true;
 }
 function lootSnapshot(s){return {inventory:{...s.inventory},pending:{...s.pendingLoot},notes:[...s.notes],battery:!!s.flags.battery};}
 function acquired(s,before){
  const rewards=[];
  for(const [id,n] of Object.entries(s.inventory)){const quantity=n-(before.inventory[id]||0);if(quantity>0)rewards.push({id,quantity,kind:'item',source:'inventory'});}
  for(const [id,n] of Object.entries(s.pendingLoot)){const quantity=n-(before.pending[id]||0);if(quantity>0)rewards.push({id,quantity,kind:'item',source:'found'});}
  for(const id of s.notes)if(!before.notes.includes(id))rewards.push({id,quantity:1,kind:'note',source:'record'});
  if(s.flags.battery&&!before.battery)rewards.push({id:'battery',quantity:1,kind:'battery',source:'inventory'});
  return rewards;
 }
 function resolve(s,rng=Math.random){
  if(s.battle?.system==='ranks')return RankCombat.resolveRound(s,rng);
  upgrade(s);
  const b=s.battle;if(!b)return [];const before=lootSnapshot(s);
  const events=[];const push=(type,text,extra={})=>{events.push({type,text,...extra});log(s,text);};
  const combatants=s.party.filter(alive);combatants.forEach(p=>{p.guarded=false;p.guard=0;});
  const queue=[...s.party.filter(active).map(p=>({side:'ally',id:p.id,row:p.row,agi:effective(p,'민첩')})),...b.enemies.filter(e=>e.hp>0).map(e=>({side:'enemy',id:e.id,row:'front',agi:e.agi}))].sort((a,b)=>(a.row===b.row?b.agi-a.agi:a.row==='front'?-1:1)|| (a.side==='ally'?-1:1));
  for(const unit of queue){
   if(s.ending)break;
   if(unit.side==='ally'){
    const p=s.party[unit.id];if(!active(p))continue;
    if(p.stun>0){p.stun--;push('skip',`${p.name} 행동 불가`);continue;}
    const pl=b.plans[p.id]||{action:'attack',target:b.enemies.find(e=>e.hp>0)?.id};
    const a=HospitalData.actions.find(a=>a.id===pl.action);
    if(p.hp<=a.cost){push('skip',`${p.name} 체력이 부족합니다.`);continue;}
    p.hp-=a.cost;
    if(pl.action==='heal'){if(s.inventory.medkit>0&&!hasTrait(p,'boxer')){s.inventory.medkit--;const amount=25+(hasTrait(p,'religious')?1:0);heal(p,amount);push('heal',`${p.name} 체력 +${amount}`,{actor:p.id});}continue;}
    if(pl.action==='move'){p.row=p.row==='front'?'rear':'front';push('move',`${p.name} ${p.row==='front'?'전열':'후열'} 이동`);continue;}
    if(pl.action==='meaning'&&p.mental<=0){push('skip',`${p.name} 의미 부여 조건 불충족`);continue;}
    const r=performCheck(s,p.id,a.stat,a.ratio,rng);earnedExp(s,p,r);push('roll',`${p.name} ${a.name}: ${r.die} / ${r.threshold}`,{roll:r,actor:p.id});
    if(pl.action==='firm'){if(r.result!=='fail')p.guard=r.result==='critical'?.45:.2;continue;}
    if(pl.action==='meaning'){if(r.result!=='fail'){const value=Math.floor(effective(p,'지능')*.5);s.party.filter(alive).forEach(q=>{const scale=supportScale(s,p.id,q.id,rng);if(!scale){push('skip',`${q.name} 지원 거절`);return;}q.buffs.push({kind:'의미 부여',value:Math.floor(value*scale),duration:r.result==='critical'?6:3});b.socialAwards??=[];const key=`support:${p.id}:${q.id}`;if(!b.socialAwards.includes(key)){bond(s,p.id,q.id,1,'정신적 지원');b.socialAwards.push(key);}});push('buff','호감도에 따라 의미 부여 효과가 적용됩니다.');}continue;}
    const enemy=b.enemies.find(e=>e.id===pl.target&&e.hp>0)||b.enemies.find(e=>e.hp>0);if(!enemy)continue;
    if(r.result==='fail'){push('miss',`${p.name} 공격 실패`);continue;}
    let damage=effective(p,'근력')*(pl.action==='break'?1.5:1);
    if(r.result==='critical'&&pl.action==='attack')damage*=1+effective(p,'지능')*.025;
    damage=Math.max(1,Math.floor(damage*(1-enemy.reduce)));enemy.hp=Math.max(0,enemy.hp-damage);
    if(pl.action==='break'&&r.result==='critical')enemy.stun=2;
    push('hit',`${enemy.name} 피해 ${damage}`,{damage,target:enemy.id,actor:p.id});
   }else{
    const e=b.enemies.find(e=>e.id===unit.id);if(e.hp<=0)continue;
    if(e.stun>0){e.stun--;push('skip',`${e.name} 행동 불가`);continue;}
    const it=b.intents.find(i=>i.enemy===e.id);if(!it)continue;
    const candidates=s.party.filter(active);if(!candidates.length)break;
    const target=s.party[it.target];const p=active(target)?target:candidates[0];
    const r=roll(e.str*1.5,rng);push('roll',`${e.name} 공격: ${r.die} / ${r.threshold}`,{roll:r,enemy:e.id});
    if(r.result==='fail'){push('miss',`${e.name} 공격 실패`);continue;}
    let raw=e.damage*(r.result==='critical'?1+e.int*.025:1);let reduction=0;
    // Defense reacts to the first incoming attack, not the defender's initiative.
    if(!p.guarded&&p.stun===0){p.guarded=true;let defender=p;
     const protector=s.party.find(q=>q.id!==p.id&&active(q)&&q.stun===0&&hasTrait(q,'vigilante'));
     if(protector&&p.hp<=p.max*.5&&!b.vigilanteUsed){b.vigilanteUsed=true;if(protector.traitState.protect){defender=protector;push('defense',`${protector.name}이 ${p.name}의 방어를 대신합니다.`);}else changeMental(s,protector,-1,rng);}
     const dr=performCheck(s,defender.id,'민첩',1,rng,'action',defender!==p?1:0);earnedExp(s,defender,dr);const rolled=s.party[dr.rolledBy]||defender;
     if(dr.result!=='fail')reduction=effective(rolled,'민첩')*(dr.result==='critical'?1+effective(rolled,'지능')*.025:1);
     push('defense',`${p.name} 기초 방어: ${dr.die} / ${dr.threshold}`,{roll:dr,actor:p.id});
     if(dr.result==='critical'&&raw<reduction){push('cancel',`${e.name} 공격 취소`);continue;}
    }
    if(s.jin.accompanies&&!b.jinGuard){raw=Math.max(0,raw-15);b.jinGuard=true;bond(s,0,'jin',1,'전투 지원');push('defense','진사준이 공격을 막아 피해 15를 줄였습니다.');}
    const damage=Math.max(0,Math.floor((raw-reduction)*(1-(p.guard||0))));
    health(s,p,damage,rng);push('hit',`${p.name} 피해 ${damage}`,{damage,ally:p.id});
    if(damage>0){changeMental(s,p,b.type==='nail'?-3:-2,rng);if(['tiger','wolf'].includes(b.type))p.bleed=2;}
   }
  }
  s.turn++;socialTick(s);
  s.party.filter(alive).forEach(p=>{
   if(p.bleed>0){health(s,p,6,rng);p.bleed--;push('bleed',`${p.name} 출혈 6`);}
   if(p.status==='near'){s.party.filter(q=>q.id!==p.id&&active(q)).forEach(q=>health(s,q,Math.floor(p.max*.02),rng));}
   if(active(p)){const state=p.mental+p.buffs.reduce((sum,x)=>sum+x.value,0);if(state<0)health(s,p,-state,rng);else heal(p,state);}
   p.buffs=p.buffs.map(x=>({...x,duration:x.duration-1})).filter(x=>x.duration>0);
  });
  if(s.ending&&['jin','survivors'].includes(b.type)){s.ending=null;s.party.forEach(p=>{p.status='normal';p.hp=Math.max(1,Math.floor(p.max*.25));p.near=100;p.bleed=0;});s.battle=null;s.camp.trust=-3;s.jin.accompanies=false;goto(s,b.type==='jin'?'bound':'second');if(b.type==='survivors')s.camp.status='hostile';push('defeat','제압당했습니다. 생존자들은 더 공격하지 않았습니다.');return events;}
  if(s.ending)return events;
  if(b.enemies.every(e=>e.hp<=0)){const next=b.next;s.battle=null;if(b.type==='survivors'){s.camp.people=0;s.camp.status='dead';mental(s,-8);record(s,'로비에서의 싸움','생존자들이 목숨을 잃었습니다. 앞으로 로비의 지원은 없습니다.');}if(!['jin','survivors'].includes(b.type))partyBond(s,1,'전투에서 생존');socialTick(s);mental(s,s.party.filter(active).length,rng);s.party.filter(p=>p.status==='resist').forEach(p=>p.status='normal');push('victory','전투 종료');goto(s,next);}
  else {b.round++;b.plans={};b.vigilanteUsed=false;intent(s,rng);}
  if(!s.battle&&b.rewardBattery){s.flags.battery=true;for(const reward of acquired(s,before))events.push({type:'acquired',reward});}
  return events;
 }
 function flee(s,rng=Math.random){
  upgrade(s);
  if(!s.battle)return false;
  const members=s.party.filter(active),r=roll(members.reduce((sum,p)=>sum+effective(p,'민첩'),0)/members.length*.75,rng);
  log(s,`도주 ${r.die} / ${r.threshold}`);const before=lootSnapshot(s),rewardBattery=s.battle.rewardBattery;
  if(r.result!=='fail'&&!['wave','human','falseLight'].includes(s.battle.type)){const type=s.battle.type,next=type==='jin'?'lobby':type==='tiger'&&s.battle.next==='wolf_after'?'power_ready':s.battle.next;s.battle=null;if(['jin','survivors'].includes(type)){s.jin.accompanies=false;s.camp.trust=-3;if(type==='survivors')s.camp.status='hostile';record(s,'싸움에서 도주','생존자들과의 관계가 악화되었습니다.');}mental(s,-3);if(rewardBattery)s.flags.battery=true;goto(s,next);return {roll:r,escaped:true,rewards:acquired(s,before)};}
  return {roll:r,escaped:false};
 }
 function useItem(s,id,memberId,rng=Math.random){
  upgrade(s);s.lastSocial='';
  if(s.battle||!s.inventory[id]||!HospitalData.items[id])return false;
  const p=s.party[memberId];if(!active(p)||id==='food'||(id==='bandage'&&p.hp<p.max*.5)||p.hp===p.max)return false;
  const provider=s.party[s.actor];if(!active(provider)){s.lastSocial='활동 가능한 동행자를 치료 담당으로 선택해 주세요.';return false;}
  if(hasTrait(provider,'boxer')){s.lastSocial='권투가는 치료 가방과 붕대를 사용할 수 없습니다.';return false;}
  const scale=supportScale(s,provider.id,p.id,rng);if(!scale){s.lastSocial=`${p.name}이 불신하여 치료를 거절했습니다. 물품은 소모되지 않습니다.`;log(s,s.lastSocial);return false;}
  s.inventory[id]--;heal(p,((id==='medkit'?25:10)+(hasTrait(provider,'religious')?1:0))*scale);p.bleed=0;bond(s,provider.id,p.id,1,'치료');socialTick(s);log(s,`${provider.name} → ${p.name} ${HospitalData.items[id].name} 사용`);return true;
 }
 function grow(s,id,stat){const p=s.party[id],cost=p.level*5;if(p.xp<cost||!stats.includes(stat)||p.stats[stat]>=100)return false;p.xp-=cost;p.level++;p.stats[stat]++;p.max=5*p.stats['근력']+p.stats['지능']+p.stats['민첩'];return true;}
 const combatTools={effective,roll,log,changeMental,mental,heal,earnedExp,goto,partyBond,socialTick,record,lootSnapshot,acquired};
 return {create,roll,choose,resolve,plan,flee,useItem,grow,alive,active,health,stats,check,choiceCheck,readNote,upgrade,disabled,sceneContext,epilogue,validateTraits,relationship,relationshipLevel,affinityChange,bond,supportScale,traitAbility,performCheck,combatTools};
})();
