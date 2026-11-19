import {blockWorkspace,describeFlow,describeValue} from './blocks.js';
import {bindBattleBoardControls} from './battle-camera.js';
import {accountPanel} from './account.js';
import {gridSize,gridValid,gridTileGroups,gridPoint,gridPaths,gridCardInRange,gridCardRangeLabel,gridTargetLimit,gridSplashTargets,gridShapeAt,rangeShapes,maxRangeX,maxRangeY,customRangeRadius,maxRangeRadius,gridRangeAt,collapseTargets} from './grid.js';
import {conceptStacks,basicStacks,planningTimings,cardZoneTimings,legacyCriticalStackEffects,heldStackEffectKinds,hitTargetModes,legacyHitEvents,maxStackNameLength,effectStackNames,effectCardReferences,replacementConditions,maxPassives,maxPassiveEffects,passiveRoundTimings,passiveEffectKinds,passiveTimingsFor,baseActions,maxActions,statuses,effects,newEffects,effectSettings,temptationLimit,temptationStrain,mentalCrisisThreshold,awakeningPower,crisisRecovery,signedEffects,percentageDefaults,ratioEffects,effectRatioBases,configurableRatioEffects,ratioBasisAvailable,maxStatusRounds,healthBases,healthRatioEffects,maxDeferralRounds,applyPowerRatio,effectRecipients,diceConditions,diceConditionTimings,maxDiceTotal,effectConditions,flagConditions,maxStatusStacks,maxStackPotency,stackPotency,maxCollectiveStackConsume,stackGrantEffects,stackConsumeAmounts,stackConsumeScopes,stackConsumePriorities,taggedEffects,unnumberedEffects,discardCosts,resourceCosts,resourceScales,teamEffects,copyEffects,stagedPowerEffects,stagedPowerTimings,amplifyHitTargets,effectLimitPeriods,maxEffectActivations,timings,maxCardHits,maxCardEffects,hitEffectTimings,cardHitPowers,roles,cardStates,crisisRounds,crisisVows,crisisVowRules,artForms,artPoses,artPoseLabel,cardUsable,deckSize,deckCopyLimit,cardFileFormat,passiveFileFormat,characterFileFormat,maxCardFileBytes,mentalPower,parsePower} from './rules.js';
const panel=document.querySelector('#panel'), errors=document.querySelector('#error'), feedback=document.querySelector('#feedback');
const studio=location.pathname==='/studio';
const code=location.pathname.split('/')[2], endpoint=studio?'/api/studio':'/api/rooms/'+code+'/game';
document.querySelector('#back').href=studio?'/':'/room/'+code;
if(studio){
  document.querySelector('#back').textContent='← 로비로';
  document.querySelector('[data-tab="battle"]').remove();
  document.querySelector('.game-title h1').textContent='개인 제작실';
  document.querySelector('.game-title .tag').textContent='CONCEPTTERRA / STUDIO';
  document.title='개인 제작실 · 콘셉트테라 TRPG';
}
const countryNames=['중앙국',...Array.from({length:9},(_,i)=>'제'+(i+1)+'국')];
const counterHelp='이번 라운드에 적의 공격을 맞고 살아남으면, 사거리 안의 공격자에게 1회 반격해요.';
const coverHelp='사용 시 원호 방어 +1. 맵에서 아군 한 명을 지정하거나, 대상을 비워 자동 엄호로 확정할 수 있어요.';
const statNames=['근력','민첩','체력','지능','감각','의지'];
let state,tab=studio?'character':'battle', busy=false, edit=null, passiveEdit=null, draftDirty=false, battleDraft=null;
const libraryFilters={values:{},effects:new Set(),stacks:new Set()};

function el(tag,value,attrs={}){
  const node=document.createElement(tag);
  if(value!==undefined)node.textContent=value;
  for(const [k,v] of Object.entries(attrs)){if(v!==undefined&&v!==false)node.setAttribute(k,v===true?'':v);}
  return node;
}
function group(...children){const x=el('div',undefined,{class:'grid'});x.append(...children);return x;}
function section(title,...items){const x=el('section',undefined,{class:'card stack'});x.append(el('h2',title),...items);return x;}
const flavorText=t=>el('p',t,{class:'flavor-text'});
const note=t=>el('p',t,{class:'notice minor'});
const button=(text,action,primary=false)=>{const x=el('button',text,{type:'button',class:primary?'primary':''});x.onclick=action;return x;};
function input(name,value='',type='text',attrs={}){return el('input',undefined,{name,value,type,...attrs});}
function select(name,options,value){const x=el('select',undefined,{name});for(const [id,label] of options)x.append(el('option',label,{value:id}));x.value=String(value??'');return x;}
const opts=items=>items.map(x=>[x,x]);
function field(label,control,cls){const x=el('label',label,{class:cls});x.append(control);return x;}
function area(name,value,max){const x=el('textarea',value,{name,rows:2,maxlength:max});return x;}
function formFor(action,read){
  const form=el('form',undefined,{class:'game-form'});
  form.onsubmit=async e=>{e.preventDefault();try{await send(action,await read(form,new FormData(form)));}catch(err){errors.textContent=err.message;}};
  form.addEventListener('input',()=>{draftDirty=true;});
  return form;
}
function submit(text){return el('button',text,{class:'primary'});}
async function request(body){
  const large=['cardImport','passiveImport','characterImport'].includes(body?.action);
  const r=await fetch(endpoint+(large?'?import=1':''),body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw Object.assign(new Error(data.error||'세션 연결을 확인하세요.'),{status:r.status});
  return data;
}
async function send(action,payload={}){
  if(busy)return;
  busy=true;errors.textContent='';feedback.textContent='';
  try{
    const releasedUnit=action==='unplan'?state.battle?.units.find(u=>u.id===state.me):null;
    const released=releasedUnit?.plan;
    state=await request({action,revision:state.revision,collectionRevision:state.collectionRevision,...payload});
    if(action==='stackCreate'||action==='stackEdit'){
      updateStackControls();
      feedback.textContent=action==='stackCreate'?'중첩을 만들었어요.':'중첩 효과를 저장했어요.';
      return true;
    }
    if(action==='card'||action==='cardDelete'&&payload.id===edit)edit=null;
    if(action==='cardClone')edit=state.editedCardId;
    if(['passive','passiveDelete','passiveTake','passiveClone','passiveImport','characterImport','characterAccountSelect'].includes(action))passiveEdit=null;

    if(['plan','start','round','reset'].includes(action))battleDraft=null;
    if(released)battleDraft={...released,key:state.battle.round+':'+state.me+(releasedUnit.collapsed?':collapsed':releasedUnit.zero==='crisis'?':crisis':''),card:released.card||'',discard:released.discard||''};
    draftDirty=false;render();
    if(action==='cardClone')panel.querySelector('input[name="name"]')?.focus();
    feedback.textContent={plan:'행동을 확정했어요.',unplan:'행동을 수정할 수 있어요.',round:'라운드 처리를 마쳤어요.',card:'카드 보관함에 저장했어요.',deck:'전투 덱을 저장했어요.',cardClone:'카드 사본을 만들었어요.',cardDelete:'카드를 삭제했어요.',cardShare:'이 방에 카드를 공유했어요.',cardUnshare:'공유를 해제했어요.',cardTake:'공유 카드를 보관함에 가져왔어요.',cardImport:'파일의 카드를 보관함에 가져왔어요.',passive:'패시브를 저장했어요.',passiveClone:'패시브 사본을 만들었어요.',passiveShare:'이 방에 패시브를 공유했어요.',passiveUnshare:'패시브 공유를 해제했어요.',passiveTake:'패시브를 가져왔어요. 장착하면 전투에서 발동해요.',
      characterAccountSave:'계정에 캐릭터를 저장했어요.',characterAccountSelect:'캐릭터를 불러왔어요.',requestEdit:'GM에게 변경 적용을 요청했어요.'}[action]||'반영했어요.';
  }catch(err){
    errors.textContent=err.message;
    if(err.status===409){state=await request().catch(()=>state);if(action==='stackCreate'||action==='stackEdit')updateStackControls();else if(!draftDirty||tab==='battle')render();}
  }finally{busy=false;}
}
function fillStackSelect(control,value){
  const names=new Set([...Object.keys(basicStacks),...(state.profile.stackNames||[])]);
  if(value)names.add(value);
  control.replaceChildren(el('option','중첩 선택',{value:''}),
    ...[...names].map(name=>el('option',Object.hasOwn(basicStacks,name)?name+' · 기본':Object.hasOwn(conceptStacks,name)?name+' · 개념물':name,{value:name})));
  control.value=value||'';
}
function stackSelect(value,onChange,name){
  const control=el('select',undefined,{name,'data-stack-selector':true,'aria-label':'중첩 이름'});
  fillStackSelect(control,value);
  control.required=true;
  if(onChange)control.onchange=()=>onChange(control.value);
  return control;
}
function updateStackControls(){
  for(const control of panel.querySelectorAll('[data-stack-selector]'))fillStackSelect(control,control.value);
  for(const list of panel.querySelectorAll('[data-custom-stack-list]')){
    const names=state.profile.customStacks||[];
    list.replaceChildren(...(names.length?names.map(name=>el('span',name)):[el('small','등록한 중첩이 없어요.')]));
  }
  for(const control of panel.querySelectorAll('[data-stack-trait-select]'))fillStackTraitSelect(control);
}
function fillStackTraitSelect(control){
  const value=control.value;
  control.replaceChildren(el('option','효과를 편집할 중첩 선택',{value:''}),
    ...(state.profile.customStacks||[]).map(name=>el('option',name,{value:name})));
  control.value=value;
}
function stackManager(){
  const root=el('details',undefined,{class:'stack-manager'});
  const form=el('form',undefined,{class:'stack'});
  const name=input('stackName','','text',{required:true,maxlength:maxStackNameLength,placeholder:'예: 균열'});
  const list=el('div',undefined,{class:'chips','data-custom-stack-list':true});
  const names=state.profile.customStacks||[];
  list.append(...(names.length?names.map(name=>el('span',name)):[el('small','등록한 중첩이 없어요.')]));
  const save=submit('중첩 만들기');
  form.append(field('새 중첩 이름',name),save);
  form.onsubmit=async event=>{
    event.preventDefault();
    if(await send('stackCreate',{name:name.value}))name.value='';
  };
  const picker=el('select',undefined,{'data-stack-trait-select':true,'aria-label':'효과를 편집할 중첩'});
  const editor=el('div',undefined,{class:'stack'});
  fillStackTraitSelect(picker);
  picker.onchange=()=>{
    editor.replaceChildren();
    const chosen=picker.value;
    if(!chosen)return;
    const trait=state.profile.stackTraits?.find(item=>item.name===chosen);
    const workspace=effectWorkspace(trait?.effects||[],{passive:true,stack:true,onChange:()=>{draftDirty=true;}});
    const traitForm=el('form',undefined,{class:'stack'});
    const flavor=area('stackFlavor',trait?.flavor||'',300);
    flavor.oninput=()=>{draftDirty=true;};
    traitForm.append(
      note('‘보유 시’ 효과는 중첩이 있는 동안 적용되고, 중첩이 사라지면 해제돼요. 설정은 다음 전투부터 반영돼요.'),
      field('중첩 플레이버 텍스트',flavor),workspace.node,submit('중첩 저장'));
    traitForm.onsubmit=async event=>{
      event.preventDefault();
      if(await send('stackEdit',{name:chosen,flavor:flavor.value,effects:workspace.rows()}))draftDirty=false;
    };
    editor.append(traitForm);
  };
  root.append(el('summary','중첩 관리'),form,list,picker,editor);
  return root;
}
function character(){
  const p=state.profile;
  const form=formFor('profile',(_,data)=>({...Object.fromEntries(data),stats:statNames.map((_,i)=>Number(data.get('stat'+i)))}));
  const status=select('status',opts(statuses),p.status);
  const wall=field('살아온 장벽',select('wall',opts(countryNames.slice(4,9)),p.wall||'제4국'));
  const check=()=>{wall.hidden=status.value!=='월정커';wall.style.display=wall.hidden?'none':'';};
  status.onchange=check;check();
  form.append(field('캐릭터 이름',input('name',p.name,'text',{required:true,maxlength:36})),field('출신국',select('country',opts(countryNames),p.country)),field('시작 신분',status),wall,
    field('직업 / 소속',input('job',p.job,'text',{maxlength:36,placeholder:'회수원, 군인, 해결사…'})),
    field('개념 능력 / 의체',area('concept',p.concept,180),'full'),field('개인 목적',area('goal',p.goal,180),'full'));
  const stats=el('fieldset',undefined,{class:'full'}), list=el('div',undefined,{class:'stats'});
  const legend=el('legend');const total=()=>{legend.textContent='능력치 '+[...list.querySelectorAll('input')].reduce((sum,x)=>sum+Number(x.value),0)+' / 300';};
  statNames.forEach((name,i)=>list.append(field(name,input('stat'+i,p.stats[i],'number',{min:0,max:100,required:true}))));
  list.addEventListener('input',total);total();
  stats.append(legend,list);form.append(stats,submit('캐릭터 저장'));
  const editor=section('캐릭터 시트',form);
  editor.classList.add('full');
  const sheet=group(editor);
  const art=characterArt(p);
  art.classList.add('full');
  const locked=state.battle?.phase==='planning'&&state.battle.units.some(unit=>unit.id===state.me);
  const files=section('캐릭터 파일',note('캐릭터 시트, 정신력, 일러스트, 패시브와 참조 카드를 한 파일로 옮길 수 있어요.'),characterFileControls('character',locked));
  files.classList.add('full');
  const account=accountPanel({
    locked,selected:p.accountCharacterId,
    save:character=>send('characterAccountSave',character?{id:character.id,characterRevision:character.revision}:{}),
    select:character=>send('characterAccountSelect',{id:character.id})
  });
  account.classList.add('full');
  sheet.prepend(account);
  sheet.append(files,characterPassives(p),art);
  return sheet;
}
function characterPassives(profile){
  const list=profile.passives||[];
  const existing=list.find(passive=>passive.id===passiveEdit);
  const shared=state.sharedPassives||[];
  const locked=state.battle?.phase==='planning'&&state.battle.units.some(unit=>unit.id===state.me);
  const saved=el('div',undefined,{class:'stack'});
  const open=id=>{passiveEdit=id;draftDirty=false;render();};
  for(const passive of list){
    const card=el('article',undefined,{class:'passive-entry stack'});
    const title=el('div',undefined,{class:'row'});
    title.append(el('strong',passive.name),el('span',passive.enabled?'장착 중':'해제됨',{class:'tag'}));
    card.append(title);
    if(passive.notes)card.append(note(passive.notes));
    if(passive.flavor)card.append(flavorText(passive.flavor));
    for(const effect of passive.effects){
      card.append(note(effectConditionText(effect)+effectTiming(effect)+' · '+effectSentence(effect)));
      if(effect.flavor)card.append(flavorText(effect.flavor));
    }
    const actions=el('div',undefined,{class:'row'});
    actions.append(button('편집',()=>open(passive.id)),button(passive.enabled?'해제':'장착',()=>send('passiveToggle',{id:passive.id})),
      button('복제',()=>send('passiveClone',{id:passive.id})),
      button('삭제',()=>{if(confirm('「'+passive.name+'」 패시브를 삭제할까요?'))send('passiveDelete',{id:passive.id});}));
    card.append(actions);
    const post=shared.find(entry=>entry.owner===state.me&&entry.passive.id===passive.id);
    if(!studio)card.append(button(post?'공유본 갱신':'이 방에 공유',()=>send('passiveShare',{id:passive.id})));
    card.append(button('이 패시브 다운로드',()=>downloadCharacterFile('passive',passive.id)));
    saved.append(card);
  }
  if(!list.length)saved.append(note('아직 저장한 패시브가 없어요.'));
  const root=section('캐릭터 패시브',note('장착한 패시브는 이 방의 전투에서 조건을 충족하면 자동으로 발동해요.'),
    characterFileControls('passive',locked,!list.length),saved);
  root.classList.add('full','character-passives');
  const gallery=el('div',undefined,{class:'stack'});
  gallery.append(el('h3','방에서 공유한 패시브'));
  if(!shared.length)gallery.append(note('공유된 패시브가 없어요.'));
  for(const entry of shared){
    const item=el('article',undefined,{class:'passive-entry stack'});
    item.append(el('strong',entry.passive.name),note(entry.author+' 공유'));
    if(entry.passive.notes)item.append(note(entry.passive.notes));
    if(entry.passive.flavor)item.append(flavorText(entry.passive.flavor));
    if(entry.included.length)item.append(note('참조 카드 · '+entry.included.map(card=>card.name).join(', ')));
    for(const effect of entry.passive.effects){
      item.append(note(effectConditionText(effect,entry.included)+effectTiming(effect)+' · '+effectSentence(effect,entry.included)));
      if(effect.flavor)item.append(flavorText(effect.flavor));
    }
    const imported=list.some(passive=>passive.sharedFrom===entry.id);
    const action=entry.owner===state.me
      ?button('공유 해제',()=>send('passiveUnshare',{id:entry.id}))
      :button(imported?'가져옴':'내 패시브로 가져오기',()=>send('passiveTake',{id:entry.id}));
    if(entry.owner!==state.me)action.disabled=imported||locked||list.length>=maxPassives;
    item.append(action);gallery.append(item);
  }
  if(!studio)root.append(gallery);
  if(locked)root.append(note('저장한 패시브는 GM에게 적용을 요청할 수 있어요.'));
  if(list.length>=maxPassives&&!existing)return root;
  const save=submit(existing?'패시브 변경 저장':'패시브 만들기');
  const workspace=effectWorkspace(existing?.effects||[],{passive:true,onChange:()=>{
    save.disabled=!workspace.rows().length;
    draftDirty=true;
  }});
  const form=formFor('passive',(_,data)=>({passive:{
    id:existing?.id,name:data.get('name'),notes:data.get('notes'),flavor:data.get('flavor'),enabled:data.has('enabled'),effects:workspace.rows()
  }}));
  form.append(el('h3',existing?'패시브 편집':'새 패시브',{class:'full'}),
    field('패시브 이름',input('name',existing?.name||'','text',{required:true,maxlength:36})),
    field('전투에 장착',input('enabled','1','checkbox',{checked:existing?.enabled??true}),'inline'),
    field('패시브 설명',area('notes',existing?.notes||'',300),'full'),
    field('패시브 플레이버 텍스트',area('flavor',existing?.flavor||'',300),'full'),
    note('이벤트 아래에 실행할 블록을 연결하세요. 모바일에서는 연결 칸을 먼저 누른 뒤 도구함에서 블록을 누르면 돼요.'),workspace.node,save);
  if(existing)form.append(button('편집 취소',()=>open(null)));
  save.disabled=!workspace.rows().length;
  root.append(stackManager(),form);
  return root;
}
let artForm='normal',artPose='idle';
function artUrl(unitId,slot,version){
  return endpoint+'?'+new URLSearchParams({unit:unitId,art:slot,v:String(version||0)});
}
function characterArt(profile){
  const locked=state.battle?.phase==='planning'&&state.battle.units.some(unit=>unit.id===state.me);
  const form=select('artForm',Object.entries(artForms),artForm);
  const pose=select('artPose',Object.keys(artPoses).map(key=>[key,artPoseLabel(artForm,key)]),artPose);
  const file=input('artImage','','file',{accept:'image/png,image/jpeg,image/webp',disabled:locked});
  const preview=el('div',undefined,{class:'character-art-preview'});
  const registered=el('p');
  const save=button('이 슬롯에 저장',async()=>{
    try{await send('art',{slot:form.value+'.'+pose.value,image:await imageData(file.files[0],16000,480)});}
    catch(err){errors.textContent=err.message;}
  },true);
  const remove=button('이 슬롯 삭제',()=>send('art',{slot:form.value+'.'+pose.value,image:''}));
  const update=()=>{
    artForm=form.value;artPose=pose.value;
    for(const option of pose.options)option.textContent=artPoseLabel(artForm,option.value);
    const slot=artForm+'.'+artPose,present=profile.artSlots?.includes(slot);
    const poseLabel=artPoseLabel(artForm,artPose);
    registered.textContent=artForms[artForm]+' · '+poseLabel+(present?' 등록됨':' 미등록');
    preview.replaceChildren(present?el('img',undefined,{src:artUrl(state.me,slot,profile.artVersion),alt:poseLabel}):note('일러스트를 등록하면 여기에 표시돼요.'));
    remove.disabled=locked||!present;
    save.disabled=locked||!file.files.length;
  };
  form.onchange=pose.onchange=()=>{file.value='';update();};
  file.onchange=()=>{save.disabled=!file.files.length;};
  update();
  const actions=el('div',undefined,{class:'row'});actions.append(save,remove);
  return section('캐릭터 일러스트',note('형태별로 자세를 등록하세요. 붕괴·각성 변화 연출은 전환되는 형태의 변화 연출 칸에 등록해요. 미등록 자세는 같은 형태의 스탠딩이나 기본 일러스트를 사용해요.'),
    field('형태',form),field('자세',pose),registered,preview,field('PNG, JPEG, WebP',file),actions,
    ...(locked?[note('일러스트는 전투가 끝난 후에 변경할 수 있어요.')]:[]));
}
function signed(n){return n>=0?'+'+n:String(n);}
function stackLabels(unit){
  return Object.entries(unit.stacks).filter(([,count])=>count>0).map(([tag,count])=>{
    const power=stackPotency(unit,tag);
    return tag+' '+count+'회 · 총 위력 '+power;
  });
}
function combatStatusLabels(unit){
  const labels=[];
  if(unit.collapseResist)labels.push('붕괴 저항 '+unit.collapseResist+'회');
  for(const [kind,{amount,through}] of Object.entries(unit.mindStatuses||{})){
    const suffix=kind==='collapseImmune'?'':kind==='mindGuard'||kind==='mindRecoveryCut'?' '+amount+'%':' '+amount;
    labels.push(effects[kind]+suffix+' · '+through+'라운드까지');
  }
  const chance=(unit.critChance||0)+(unit.critStacks||0)*5+(unit.stacks?.집중||0);
  if(chance)labels.push('치명타 확률 '+Math.max(0,Math.min(100,chance))+'%');
  if(unit.critCharges)labels.push('확정 치명타 '+unit.critCharges+'타');
  const criticalDamage=(unit.critMultiplier||0)+(unit.stacks?.강타||0);
  if(criticalDamage)labels.push('치명타 피해 '+(150+Math.max(-50,Math.min(850,criticalDamage)))+'%');
  if(unit.dodge)labels.push('타격 회피 '+unit.dodge+'타');
  if(unit.trueStrike)labels.push('회피 무효화 '+unit.trueStrike+'회');
  if(unit.healCuts?.length)labels.push('받는 회복량 −'+Math.max(...unit.healCuts.map(entry=>entry.amount))+'%');
  if(unit.lowRerolls)labels.push('주사위 재굴림 '+unit.lowRerolls+'개');
  for(const [tag,amount] of Object.entries(unit.stackWard||{}))labels.push(tag+' 저항 '+amount);
  return labels;
}
const effectFamilies = {
  '카드 표식':['markCard','clearCardMark'],
  '행동 제어':['extraAction','reduceActions','blockAction','unblockAction','clearActionPenalty','clearActionBonus','clearRoot'],
  '정신력과 붕괴':['mind','drain','mindTransfer','recoverMindFloor','mindRegen','mindBurn','mindGuard','mindRecoveryCut','collapseResist','collapseImmune','clearTemptation'],
  '상태 해제':['clearCollapse','clearAwakening','unblockAction','clearMindBuffs','clearMindDebuffs','purgeDefense','purgeOffense','purgeRegen','clearStatus','cleanseStacks'],
  '강적':['bossDamage','bossOutgoingDamage','bossIncomingDamage'],
  '타격':['amplifyHit','replayHit','trueStrike','rerollLow'],
  '심마와 탈피':['hearDemon','refuseDemon','shedShell','awakenBody','inscribeMeaning'],
  '치명타':['critChance','critCharges','critMultiplier'],
  '체력과 정신력 대가':['healthCost','mindCost','mind','power','allyHeal','rallyHeal','rallyShield','focusClash'],
  '특수 기믹':['delayedStrike','positionAnchor','debtShield','clashMemory','afterimage','overloadEcho','emptyHandReload','clashStreak','shareCopy','hastenStrike','preserveMove','spareShield','revealDistance','lastStand'],
  '피해 증감과 조건부 효과':['outgoingDamage','incomingDamage','doubleEdge','damageDebt','eraseDebt','barrierBurst','shieldBreakDraw'],
  '공격과 합':['basePower','finalPower','damage','percent','fixedDamage','pierce','piercingFixedDamage','stripShield','drainLife','recoil','power','focus','weaken','expose','thorns','guardBreak','riposte','shieldPower','gravePower'],
  '방어와 회복':['dodge','stackWard','healCut','hitLeech','shield','reduce','fortify','heal','healPercent','healMissing','regen','clearStatus','temporaryShield','stealShield','shieldGift','allyHeal','lethalGuard','graveToShield'],
  '이동과 위치':['push','pull','move','movement','nextMove','nextSlow','retreat','swapPosition','rootNext','provoke','evadeStep'],
  '중첩과 정신력':['stack','consume','remove','perStack','doubleStack','stealStack','consumeHeal','stackDamage','poison','mind','drain','mindTransfer','cleanseStacks','shieldPerStack','recoverMindFloor','purgePoison','detonatePoison'],
  '손패 대가와 복제':['giveCard','replaceCard','discardAllCost','discardExactCost','copySelf','copyFixed','copyChosen'],
  '카드와 덱':['draw','discard','recover','return','exile','replay','cycle','mill','recoverDeck','reclaim','topdeck','bottomdeck','shuffleDeck','buryHand','exileGrave','drawTo','lateDraw','recycleExile']
};
const suggestedTiming={draw:'use',discard:'use',recover:'use',power:'clash',percent:'wall',perStack:'consume',exile:'end',return:'end'};
const selfEffects=new Set(['draw','discard','recover','return','exile','replay','power','move','movement','nextMove','mind']);
function effectCards(extra=[]){
  return [...state.defaults,...state.profile.cards,...(state.profile.passiveCards||[]),...extra];
}
function effectSentence(e,extra=[]){
  if(e.kind==='replaceCard'){
    const cards=effectCards(extra);
    const replacement=cards.find(card=>card.id===e.replacementId);
    const source=cards.find(card=>card.id===e.fromCardId);
    return (source?'「'+source.name+'」 사용 시 ':'')+'「'+(replacement?.name||'지정 카드')+'」로 발동'+
      (e.to==='target'?' · 원래 대상 기준':'')+(e.limit?' · '+effectLimitPeriods[e.limit.period]+' '+e.limit.count+'회':'');
  }
  const expression=e.amountExpr?describeValue(e.amountExpr):null;
  if(e.kind==='giveCard'){
    const card=effectCards(extra).find(card=>card.id===e.givenCardId);
    return (effectRecipients[e.to]||'자신')+'에게 「'+(card?.name||'지정 카드')+'」 '+(expression||e.amount)+'장 지급'+(e.limit?' · '+effectLimitPeriods[e.limit.period]+' '+e.limit.count+'회':'');
  }
  const target=e.to==='target'?'대상':effectRecipients[e.to];
  const number=expression||(['awakenBody','inscribeMeaning'].includes(e.kind)&&e.perStack?e.amount*e.perStack:e.amount||1);
  const signedAmount=value=>expression?value:signed(value);
  const phrases={
    push:`${target}을 ${number}칸 밀쳐낸다`,pull:`${target}을 ${number}칸 끌어온다`,
    stack:e.tag?`${target}에게 ${e.tag} ${number} 부여`:'부여할 중첩을 선택하세요.',
    remove:`${target}의 ${e.tag||'상태'} ${number} 제거`,draw:`${target}이 카드 ${number}장 뽑기`,
    damage:`${target}에게 추가 피해 ${number}`,percent:`기본 피해의 ${number}%를 추가로 가한다`,
    perStack:`소모한 중첩의 총 위력 1당 피해 ${number}`,heal:`${target}의 체력 ${number} 회복`,
    shield:`${target}에게 보호막 ${number}`,mind:`${target}의 정신력 ${number} 회복`,
    drain:`${target}에게 정신 피해 ${number}`,return:'이 카드를 손으로 가져온다',exile:'이 카드를 전투에서 제외',replay:'이 카드를 한 번 더 사용',replayHit:'이 타격만 한 번 더 사용'
  };
  const added=newEffects[e.kind]?.[3].replace('{n}',String((signedEffects.includes(e.kind)||ratioEffects[e.kind]?.[1]===0)?signedAmount(number):number)).replace('지정 중첩',e.tag||'지정 중첩');
  const fixed=e.kind==='copyFixed'?effectCards(extra).find(c=>c.id===e.copyId)?.name:null;
  const ratio=ratioEffects[e.kind];
  const ratioText=e.kind==='healthCost'&&e.amountMode==='percent'
    ?healthBases[e.healthBasis||'max']+'의 '+number+'% 지불 · 최소 1 소모, 체력이 1 이상 남을 때 성공'
    :e.kind==='mindCost'&&e.amountMode==='percent'
    ?'최대 정신력의 '+number+'% 지불 · 0에 도달하면 폭주 위기'
    :e.kind==='damageDebt'
    ?target+' · 다음 적 공격의 체력 피해 '+number+(e.amountMode==='fixed'?'':'%')+'를 다음 '+(e.deferRounds||1)+'라운드에 걸쳐 종료 시 정산'
    :e.kind==='poison'
    ?target+' · '+(e.amountMode==='percent'?(effectRatioBases[e.ratioBasis]||healthBases[e.healthBasis||'max'])+'의 '+number+'%':number)+' 지속 피해'+
      (e.dotRounds?' · '+e.dotRounds+'라운드 동안 라운드 종료마다':' · 라운드 종료마다 피해 1 감소')
    :e.amountMode==='percent'&&e.ratioBasis&&ratio
    ?target+' · '+effectRatioBases[e.ratioBasis]+'의 '+number+'%를 '+ratio[0]+' 수치로 적용'
    :(e.amountMode==='percent'||e.amountMode==null&&percentageDefaults.includes(e.kind))&&ratio
    ?(ratio[2]?target+' · '+(healthRatioEffects.includes(e.kind)?healthBases[e.healthBasis||'max']:ratio[2])+' 기준 ': '')+ratio[0]+' '+(expression||signed(ratio[1]?ratio[1]*number:number))+'%'
    :null;
  const amplifyText=e.kind==='amplifyHit'
    ?(e.amplifyTarget==='number'?e.amplifyIndex+'타':amplifyHitTargets[e.amplifyTarget||'next'])+'의 효과 수치 +'+number+(e.amountMode==='percent'?'%':'')
    :null;
  const consumed=e.consumeAmount==='all'?'전부':'최대 '+number;
  const consumeText=e.kind==='consume'
    ?target+(e.to==='allEnemies'?(e.consumeScope==='total'?'에게서 합산':' 각각에게서'):'에게서')+
      ' '+(e.tag||'지정 중첩')+' '+consumed+' 소모'+
      (e.to==='allEnemies'&&e.consumeScope==='total'?' · '+stackConsumePriorities[e.consumePriority||'lowestHp']+' 우선':'')
    :null;
  const text=(amplifyText||consumeText||ratioText||(added?target+' · '+added:phrases[e.kind]||effects[e.kind]+' '+(ratio?.[1]===0?signedAmount(number):number)))+(fixed?' · '+fixed:'')+(e.scaleDiscard?' · 수치 × 대가로 버린 카드 수':e.scaleResource?' · 수치 × '+resourceScales[e.scaleResource]:'');
  const payment=e.scaleCost;
  const paymentBase=e.scaleDiscard?'현재 손패':e.scaleResource==='mind'?'최대 정신력':healthBases[payment?.healthBasis||'max'];
  const resource=e.scaleDiscard?'손패':e.scaleResource==='mind'?'정신력':'체력';
  const paymentText=payment?' · '+(payment.mode==='percent'?paymentBase+'의 '+payment.amount+'%':resource+' '+payment.amount+(e.scaleDiscard?'장':''))+' 소비':'';
  const tuning=Object.entries(effectSettings[e.kind]||{})
    .map(([key,[label,defaultValue]])=>label+' '+(e[key]??defaultValue)).join(' · ');
  let summary=(tuning?text+' · '+tuning:text)+paymentText;
  if(stackGrantEffects.includes(e.kind)){
    if(e.stackPower||e.kind==='stack')summary+=' · 1회당 위력 '+(e.stackPower||1);
    if(e.stackPowerCap)summary+=' · 1회당 위력 최대 '+e.stackPowerCap;
    if(e.stackCap)summary+=' · 최대 '+e.stackCap+'회';
  }
  if(e.kind==='hearDemon')summary+=' · 종료 시 정신력 '+mentalCrisisThreshold+' 이하이고 유혹 '+temptationLimit+' 이상이면 정신력 −'+temptationStrain;
  return summary+(e.limit?' · '+effectLimitPeriods[e.limit.period]+' '+e.limit.count+'회':'');
}
function effectConditionText(e,extra=[]){
  const flow=describeFlow(e.flow);
  if(!e.condition)return flow;
  if(e.condition==='cardUsed'){
    const card=effectCards(extra).find(card=>card.id===e.conditionCardId);
    return flow+'[「'+(card?.name||'지정 카드')+'」 사용 시] ';
  }
  if(Object.hasOwn(diceConditions,e.condition))return flow+'[주사위 눈의 합 '+e.threshold+' '+diceConditions[e.condition]+'] ';
  const condition=e.condition==='stack'?(e.tag||'중첩')+' '+e.threshold+' 이상':effectConditions[e.condition];
  const threshold=e.condition==='stack'||flagConditions.includes(e.condition)?'':' '+e.threshold;
  return flow+'['+condition+threshold+'] ';
}
function readEffect(row){
  const controls=[...row.querySelectorAll('[name]'),...(row.amountPart?.querySelectorAll('[name]')||[])];
  const {scaleBy,scaleCostMode,scaleCostAmount,scaleHealthBasis,limitPeriod,limitCount,...effect}=Object.fromEntries(controls.map(x=>[x.name,x.type==='number'?Number(x.value):x.value]));
  const all=effect.kind==='consume'&&effect.consumeAmount==='all';
  if(all||unnumberedEffects.includes(effect.kind))effect.amount=1;
  if(!effect.ratioBasis||effect.amountMode!=='percent')delete effect.ratioBasis;
  if(!effect.dotRounds)delete effect.dotRounds;
  for(const key of ['stackCap','stackPower','stackPowerCap'])if(!effect[key])delete effect[key];
  if(!all&&scaleBy==='discard')effect.scaleDiscard=true;
  else if(!all&&scaleBy)effect.scaleResource=scaleBy;
  if(!all&&scaleBy&&scaleCostMode)effect.scaleCost={mode:scaleCostMode,amount:scaleCostAmount,healthBasis:scaleHealthBasis};
  if(limitPeriod&&limitPeriod!=='none')effect.limit={period:limitPeriod,count:limitCount};
  return effect;
}
function effectTiming(effect){
  return (effect.hitIndex?effect.hitIndex+'타 · ':'')+timings[effect.when]+
    (effect.reactionRounds?' · 사용 라운드부터 '+effect.reactionRounds+'라운드':'');
}
function effectTimingAllowed(kind,when,scoped,passive,role){
  if(kind==='replaceCard')return when==='replace'&&!scoped;
  if(kind==='power'&&(planningTimings.includes(when)||cardZoneTimings.includes(when)))return false;
  if(passive)return passiveEffectKinds.includes(kind)&&passiveTimingsFor(kind).includes(when);
  if(when==='counter'&&role!=='counter')return false;
  if(discardCosts.includes(kind)||resourceCosts.includes(kind))return !scoped;
  if(scoped)return hitEffectTimings.includes(when)&&!stagedPowerEffects.includes(kind)&&kind!=='replay'&&
    (when!=='roll'||!['amplifyHit','replayHit'].includes(kind));
  return !['amplifyHit','replayHit'].includes(kind)&&(!stagedPowerEffects.includes(kind)||stagedPowerTimings.includes(when));
}
function effectWorkspace(initial,{scoped=false,passive=false,stack=false,role,onChange}){
  const kinds=stack?passiveEffectKinds.filter(kind=>!['replaceCard','giveCard'].includes(kind)):passiveEffectKinds;
  const allows=(kind,when)=>when==='held'?stack&&heldStackEffectKinds.includes(kind):
    (!stack||kinds.includes(kind))&&effectTimingAllowed(kind,when,scoped,passive,role?.value);
  const events=Object.fromEntries(Object.entries(timings).filter(([when])=>(passive?
    kinds.some(kind=>allows(kind,when)):
    when!=='held'&&(!scoped||hitEffectTimings.includes(when)))));
  const families={...effectFamilies};
  const listed=new Set(Object.values(families).flat());
  families['기타 효과']=Object.keys(effects).filter(kind=>!listed.has(kind)&&!legacyCriticalStackEffects.includes(kind));
  const available=(kind,when,row)=>allows(kind,when)&&
    (!Object.hasOwn(diceConditions,row?.condition)||diceConditionTimings.includes(when))&&
    (row?.condition!=='cardUsed'||when!=='held'&&!passiveRoundTimings.includes(when));
  return blockWorkspace({
    events,effects,families,initial,available,readEffect,stackSelect,
    cardChoices:Object.fromEntries((passive?effectCards():[...state.defaults,...state.profile.cards]).map(card=>[card.id,card.name])),
    defaultEffect(kind,when){
      const config=newEffects[kind];
      const preferred=config?.[1]||suggestedTiming[kind]||'hit';
      return {kind,when:when||(legacyHitEvents.includes(preferred)?'hit':preferred),
        to:['replayHit','amplifyHit',...stagedPowerEffects].includes(kind)?'self':config?.[2]||(selfEffects.has(kind)?'self':'target'),
        amount:['amplifyHit','healCut','hitLeech'].includes(kind)?50:1,...(kind==='poison'?{dotRounds:2}:{}),
        ...(kind==='amplifyHit'?{amountMode:'percent'}:{})};
    },
    makeEffect:(row,when)=>effectRow({...row,when},onChange,scoped,passive,stack),onChange
  });
}
function effectRow(row,refresh,scoped,passive,stack){
  const x=el('details',undefined,{class:'effect-tile'});
  const title=el('summary');
  const fields=el('div',undefined,{class:'effect'});
  const staged=stagedPowerEffects.includes(row.kind);
  const replace=row.kind==='replaceCard';
  const when=input('when',row.when,'hidden');
  const reactionRounds=input('reactionRounds',row.reactionRounds??0,'number',{min:0,max:maxStatusRounds,required:true});
  const reactionField=field('카드 발동 후 지속 라운드 (0이면 예약·대기 중만)',reactionRounds);
  const stackScale=stack?[field('효과 수치',select('scaleStack',[['fixed','입력한 수치'],['count','입력한 수치 × 보유 중첩 수']],row.scaleStack||'fixed'))]:[];
  const ratio=ratioEffects[row.kind];
  const amplify=row.kind==='amplifyHit';
  const canSign=signedEffects.includes(row.kind)||ratio?.[1]===0;
  const legacyAwakening=['awakenBody','inscribeMeaning'].includes(row.kind);
  const amount=input('amount',(row.amount??1)*(legacyAwakening?(row.perStack??1):1),'number',
    {min:canSign?-100:1,max:legacyAwakening?10000:amplify?300:row.kind==='blockAction'?maxStatusRounds:row.kind==='reduceActions'?maxActions:100,required:true});
  const mode=select('amountMode',[['fixed','고정값'],['percent','비율 (%)']],row.amountMode||(row.kind==='damageDebt'||percentageDefaults.includes(row.kind)?'percent':'fixed'));
  const duration=row.kind==='damageDebt'
    ?[field('분할 라운드 수',input('deferRounds',row.deferRounds??1,'number',{min:1,max:maxDeferralRounds,required:true}))]
    :row.kind==='poison'
    ?[field('지속 라운드 (이번 라운드 포함)',input('dotRounds',row.dotRounds??'','number',{min:1,max:maxStatusRounds,placeholder:'비우면 매 라운드 피해 1 감소'}))]
    :[];
  const settings=Object.entries(effectSettings[row.kind]||{}).map(([key,[label,defaultValue,min,max]])=>
    field(label,input(key,row[key]??defaultValue,'number',{min,max,required:true})));
  const consuming=row.kind==='consume';
  const consumeAmount=select('consumeAmount',Object.entries(stackConsumeAmounts),row.consumeAmount||'fixed');
  const consumeScope=select('consumeScope',Object.entries(stackConsumeScopes),row.consumeScope||'each');
  const consumePriority=select('consumePriority',Object.entries(stackConsumePriorities),row.consumePriority||'lowestHp');
  const scopeField=field('적 전원 소모 기준',consumeScope);
  const priorityField=field('어느 적을 우선할까?',consumePriority);
  const totalHelp=note('우선 대상부터 중첩을 소모해요. ‘중첩 소모 시 → 카드 대상’ 효과는 소모한 총량을 기준으로 우선 대상에게 한 번 적용돼요.');
  const consumeFields=consuming?[field('얼마나?',consumeAmount),scopeField,priorityField,totalHelp]:[];
  const capFields=stackGrantEffects.includes(row.kind)
    ?[
      field('중첩 위력 (1회당)',input('stackPower',row.stackPower??'','number',{
        min:1,max:maxStackPotency,placeholder:row.kind==='stack'?'기본 1':'원래 위력 유지'
      })),
      field('중첩 위력 한도 (1회당)',input('stackPowerCap',row.stackPowerCap??'','number',{min:1,max:maxStackPotency,placeholder:'기본 '+maxStackPotency})),
      field('중첩 횟수 한도',input('stackCap',row.stackCap??'','number',{min:1,max:maxStatusStacks,placeholder:'기본 '+maxStatusStacks})),
      note('중첩 비례 효과는 보유하거나 소모한 중첩의 위력을 합산해 계산해요.')
    ]:[];
  const amountLabel=field(consuming?'소모 수량':row.kind==='stack'?'부여 횟수':row.kind==='blockAction'?'행동 불가 라운드 수':row.kind==='reduceActions'?'줄일 행동량':['healCut','hitLeech'].includes(row.kind)?'비율 (%)':'얼마나?',amount);
  const modeLabel=field('수치 단위',mode);
  modeLabel.hidden=!ratio&&!amplify;
  const ampTarget=select('amplifyTarget',Object.entries(amplifyHitTargets),row.amplifyTarget||'next');
  const ampNumber=input('amplifyIndex',row.amplifyIndex??2,'number',{min:2,max:maxCardHits,required:true});
  const ampNumberField=field('증폭할 타수',ampNumber);
  const ampFields=amplify?[field('증폭할 타격',ampTarget),ampNumberField,
    note('지정한 타격에 붙은 효과 수치를 높여요. 예를 들어 상처 4에 +50%를 적용하면 상처 6이 돼요.')]:[];
  const healthBasis=select('healthBasis',Object.entries(healthBases),row.healthBasis||'max');
  const healthField=field('체력 기준',healthBasis);
  const customizable=configurableRatioEffects.includes(row.kind);
  const ratioBasis=select('ratioBasis',[['','기본 계산 방식'],...Object.entries(effectRatioBases)],row.ratioBasis||'');
  const ratioBasisField=field('비율 계산 기준',ratioBasis);
  const basis=el('small','',{class:'minor'});
  basis.hidden=true;
  const tagControl=stackSelect(row.tag,undefined,'tag');
  const tag=field(row.kind==='stack'?'부여할 중첩':'중첩 이름',tagControl);
  const tagHelp=el('small','',{class:'minor'});
  tag.append(tagHelp);
  const toOptions=replace?[['self','자신'],['target','원래 대상']]:
    Object.entries(effectRecipients).map(([id,label])=>[id,(passive||['struck','hurt','clash'].includes(row.when))&&id==='target'?'전투 상대':label]);
  const to=select('to',toOptions,row.to||'target');
  to.title='카드 대상 이외의 자동 대상은 효과 발동 시 전장 전체에서 정해요.';
  const condition=select('condition',Object.entries(effectConditions).filter(([key])=>
    (!replace||replacementConditions.includes(key))&&(!['criticalStacks','criticalSpent'].includes(key)||row.condition===key)),row.condition||'');
  const thresholdValue=input('threshold',row.threshold??1,'number',{min:1,max:100,required:true});
  const threshold=field('조건 수치',thresholdValue);
  const diceHelp=note((scoped?'이 타격의 주사위 눈만 더해요.':'카드의 모든 타격에서 굴린 주사위 눈을 더해요.')+' 고정 위력이나 +5 같은 보정값은 빠져요.');
  const limit=select('limitPeriod',Object.entries(effectLimitPeriods),row.limit?.period||'none');
  const limitCount=input('limitCount',row.limit?.count??1,'number',{min:1,max:maxEffectActivations,required:true});
  const limitCountField=field('최대 발동 횟수',limitCount);
  const isCost=discardCosts.includes(row.kind)||resourceCosts.includes(row.kind);
  const fixed=select('copyId',[['','카드를 골라 주세요'],...[...state.defaults,...state.profile.cards].map(c=>[c.id,c.name])],row.copyId||'');
  fixed.required=row.kind==='copyFixed';
  const availableCards=passive?effectCards():[...state.defaults,...state.profile.cards];
  const replacement=select('replacementId',[
    ['', '카드를 골라 주세요'],
    ...availableCards.filter(card=>passive||card.id!==edit).map(card=>[card.id,card.name])
  ],row.replacementId||'');
  const cardOptions=[['','카드를 골라 주세요'],...availableCards.map(card=>[card.id,card.name])];
  const give=select('givenCardId',cardOptions,row.givenCardId||'');
  const conditionCard=select('conditionCardId',cardOptions,row.conditionCardId||'');
  give.required=row.kind==='giveCard';
  const giveField=field('손패에 지급할 카드',give);
  const conditionCardField=field('사용 조건 카드',conditionCard);
  const original=select('fromCardId',[['','모든 카드'],...availableCards.map(card=>[card.id,card.name])],row.fromCardId||'');
  replacement.required=replace;
  const replacementFields=replace?[
    ...(passive?[field('교체할 원래 카드',original)]:[]),field('대신 발동할 카드',replacement),
    note('조건은 위력 판정 전에 확인해요. 원래 대상이 사거리 안에 있으면 우선하고, 필요하면 가장 가까운 대상을 골라요.')
  ]:[];
  const fixedField=field('복제할 카드',fixed);
  fixedField.hidden=row.kind!=='copyFixed';
  const scale=select('scaleBy',[['','없음'],['discard','대가로 버린 카드 수'],...Object.entries(resourceScales)],row.scaleResource||(row.scaleDiscard?'discard':''));
  const scaleField=field('수치에 곱할 대가',scale);
  scaleField.hidden=amplify||isCost||unnumberedEffects.includes(row.kind);
  const scaleCostMode=select('scaleCostMode',[['fixed','고정값'],['percent','비율 (%)'],['','같은 카드의 별도 대가']],row.scaleCost?.mode??(scale.value?'':'fixed'));
  const scaleCostAmount=input('scaleCostAmount',row.scaleCost?.amount??1,'number',{min:1,max:100,required:true});
  const scaleHealthBasis=select('scaleHealthBasis',Object.entries(healthBases),row.scaleCost?.healthBasis||'max');
  const scaleModeField=field('소비량 단위',scaleCostMode);
  const scaleAmountField=field('소비량',scaleCostAmount);
  const scaleBasisField=field('대가 체력 기준',scaleHealthBasis);
  if(isCost){when.disabled=true;condition.disabled=true;}
  if(staged||amplify||isCost||row.kind==='replayHit'||copyEffects.includes(row.kind)||teamEffects.includes(row.kind))to.disabled=true;
  const show=()=>{
    limitCountField.hidden=limit.value==='none';
    limitCount.disabled=limitCountField.hidden;
    when.title=when.value==='unopposed'?'합 없이 공격하기 직전에 발동해요.':'';
    if(amplify){
      ampNumberField.hidden=ampNumber.disabled=ampTarget.value!=='number';
      amount.max=mode.value==='percent'?300:100;
    }
    const all=consuming&&consumeAmount.value==='all';
    const group=consuming&&to.value==='allEnemies';
    const total=group&&consumeScope.value==='total';
    scopeField.hidden=!group;
    priorityField.hidden=totalHelp.hidden=!total;
    if(consuming){
      amount.max=total?maxCollectiveStackConsume:maxStatusStacks;
      amountLabel.hidden=amount.disabled=all;
      if(!total&&Number(amount.value)>maxStatusStacks)amount.value=maxStatusStacks;
    }
    const beforeUse=planningTimings.includes(when.value)||cardZoneTimings.includes(when.value);
    if(beforeUse)scale.value='';
    const showScale=!all&&!!scale.value;
    scaleField.hidden=beforeUse||passive||all||amplify||isCost||unnumberedEffects.includes(row.kind);
    reactionField.hidden=reactionRounds.disabled=passive||scoped||!['struck','hurt'].includes(when.value);
    const dice=Object.hasOwn(diceConditions,condition.value);
    thresholdValue.max=dice?maxDiceTotal:100;
    if(!dice&&Number(thresholdValue.value)>100)thresholdValue.value=100;
    diceHelp.hidden=!dice;
    if(passive&&!replace){
      const automatic=passiveRoundTimings.includes(when.value)||cardZoneTimings.includes(when.value);
      for(const option of to.options)option.disabled=when.value==='held'?option.value!=='self':automatic&&['target','primary','secondary'].includes(option.value);
      if(to.selectedOptions[0]?.disabled)to.value='self';
    }
    if(!passive&&cardZoneTimings.includes(when.value)&&['target','primary','secondary'].includes(to.value))to.value='self';
    if(!passive)for(const option of to.options)option.disabled=cardZoneTimings.includes(when.value)&&['target','primary','secondary'].includes(option.value);
    const held=when.value==='held';
    limit.disabled=held;
    if(held){limit.value='none';if(condition.value==='cardUsed')condition.value='';}
    for(const option of condition.options)if(option.value==='cardUsed')option.disabled=held;
    conditionCardField.hidden=conditionCard.disabled=condition.value!=='cardUsed';
    conditionCard.required=!conditionCard.disabled;
    ratioBasisField.hidden=ratioBasis.disabled=!customizable||mode.value!=='percent';
    for(const option of ratioBasis.options){
      option.disabled=!!option.value&&(held||!ratioBasisAvailable(option.value,when.value)||
        beforeUse&&option.value.startsWith('card')||
        passive&&passiveRoundTimings.includes(when.value)&&option.value.startsWith('card'));
    }
    if(ratioBasis.selectedOptions[0]?.disabled)ratioBasis.value='';
    const e=readEffect(x);
    healthField.hidden=!healthRatioEffects.includes(e.kind)||e.amountMode!=='percent'||!!e.ratioBasis;
    basis.hidden=!ratio||e.amountMode!=='percent'||!healthField.hidden||!!e.ratioBasis;
    scaleModeField.hidden=!showScale;
    scaleAmountField.hidden=!showScale||!scaleCostMode.value;
    scaleCostAmount.disabled=scaleAmountField.hidden;
    scaleBasisField.hidden=!showScale||scale.value!=='health'||scaleCostMode.value!=='percent';
    basis.textContent=e.kind==='basePower'?'주사위 합과 카드 고정값 기준':e.kind==='finalPower'?'정신력과 다른 위력 보정을 적용한 결과 기준':ratio?.[3]?'고정 피해 보정을 적용한 뒤, 보호막 적용 전 피해 기준':ratio?.[2] ? ratio[2]+' 기준' :'주사위와 고정 보정을 합친 판정 위력 기준';
    amount.setCustomValidity(canSign&&amount.value==='0'?'0이 아닌 수치를 입력하세요.':'');
    tag.hidden=tagControl.disabled=!(taggedEffects.includes(e.kind)||e.condition==='stack');
    tagHelp.textContent=basicStacks[e.tag]?.description||conceptStacks[e.tag]?.description||'';
    threshold.style.display=e.condition&&!flagConditions.includes(e.condition)?'':'none';
    if(x.amountPart){
      x.amountPart.hidden=all;
      const isPercent=mode.value==='percent'||['percent','healPercent','healMissing','healCut','hitLeech'].includes(e.kind);
      x.amountPart.dataset.unit=isPercent?'percent':'fixed';
      x.amountPart.firstElementChild.textContent=isPercent?'비율값 파츠':'고정값 파츠';
    }
    title.textContent=effectConditionText(e)+effectTiming(e)+' · '+effectSentence(e);
    if(x.isConnected)refresh();
  };
  const part=(label,color,...controls)=>{
    const block=el('fieldset',undefined,{class:'effect-block','data-part':color});
    block.append(el('legend',label),...controls);
    return block;
  };
  if(unnumberedEffects.includes(row.kind))amount.type='hidden';
  else{
    const partNode=part('수치 파츠','amount',modeLabel,amountLabel,ratioBasisField,healthField,basis);
    partNode.classList.add('effect-amount-part');
    partNode.expressionSlot=el('div');
    partNode.append(partNode.expressionSlot);
    partNode.setUnit=unit=>{
      if(!ratio&&!amplify)return unit===partNode.dataset.unit;
      if(unit===mode.value)return true;
      mode.value=unit;show();draftDirty=true;return true;
    };
    partNode.setExpression=active=>{
      if(active&&!amount.checkValidity()){amount.value=1;amount.setCustomValidity('');}
      partNode.classList.toggle('has-block-value',active);
    };
    partNode.addEventListener('input',show);
    partNode.addEventListener('change',show);
    x.amountPart=partNode;
  }
  fields.append(input('kind',row.kind,'hidden'),when,...(x.amountPart?[]:[amount]),
    part('대상','target',field(replace?'조건을 확인할 대상':'누구에게?',to)),
    ...(row.kind==='stack'?[part('중첩 부여','effect',tag)]:[]),
    part('효과 옵션','effect',...replacementFields,...consumeFields,...(row.kind==='giveCard'?[giveField]:[]),
      ...capFields,...ampFields,...duration,...settings,...stackScale,reactionField,...(row.kind==='stack'?[]:[tag]),fixedField),
    field('효과 플레이버 텍스트',area('flavor',row.flavor||'',180),'full'),
    part('대가와 발동 제한','limit',field('발동 제한',limit),limitCountField,scaleField,scaleModeField,scaleAmountField,scaleBasisField));
  if(row.condition||passive){
    fields.append(part('효과 자체 조건','condition',field('어떤 조건에서?',condition),conditionCardField,threshold,diceHelp));
  }else fields.append(condition,thresholdValue,conditionCard);
  if(!row.condition&&!passive){
    condition.hidden=true;
    thresholdValue.hidden=true;
    conditionCard.hidden=true;
  }
  x.append(title,fields);
  x.addEventListener('input',show);
  x.addEventListener('change',show);
  x.addEventListener('block-phase-change',event=>{
    when.value=event.detail;
    show();
  });
  show();
  return x;
}
async function imageData(file,maxSize=32000,maxSide=280){
  if(!file?.size)return '';
  if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>10*1024*1024)throw new Error('10MB 이하의 PNG, JPEG 또는 WebP를 선택하세요.');
  const bitmap=await createImageBitmap(file);
  const canvas=document.createElement('canvas');
  let result='';
  let scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
  for(let attempt=0;attempt<6;attempt++){
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    result=canvas.toDataURL('image/webp',.66);
    if(result.length<=maxSize)break;
    scale*=.8;
  }
  bitmap.close();
  if(result.length>maxSize)throw new Error('좀 더 단순하거나 작은 이미지를 선택하세요.');
  return result;
}
function rangeEditor(card,changed,{origin='시전자',prefix='range',label='사거리',shapeLabel='범위 모양'}={}){
  const shape=card.rangeShape;
  const kind=select(prefix+'Kind',Object.entries(rangeShapes),shape?.kind||'distance');
  const range=input(prefix,shape?'2, 4':card.range||'2, 4','text',{required:true,maxlength:36});
  const x=input(prefix+'X',shape?.x??2,'number',{min:0,max:maxRangeX,required:true});
  const y=input(prefix+'Y',shape?.y??1,'number',{min:0,max:maxRangeY,required:true});
  const radius=input(prefix+'Radius',shape?.radius??2,'number',{min:1,max:maxRangeRadius,required:true});
  const cells=new Map((shape?.cells||[]).map(cell=>[cell.join(','),cell]));
  const numberField=field(label,range);
  const rectangle=group(field('좌우로 몇 칸',x),field('상하로 몇 칸',y));
  const radiusField=field('중심에서 몇 칸',radius);
  const map=el('div',undefined,{class:'range-map',role:'group','aria-label':origin+' 기준 범위 격자'});
  const guide=note('가운데 표시는 '+origin+' 위치예요. 전투 지도의 방향을 기준으로 범위를 정해요.');
  const clear=button('선택한 칸 지우기',()=>{cells.clear();update();changed();});
  const tiles=[];
  function value(){
    switch(kind.value){
      case 'rectangle': return {kind:kind.value,x:Number(x.value),y:Number(y.value)};
      case 'circle':
      case 'cross': return {kind:kind.value,radius:Number(radius.value)};
      case 'custom': return {kind:kind.value,cells:[...cells.values()]};
    }
  }
  function update(){
    const current=value(), custom=current?.kind==='custom';
    numberField.hidden=range.disabled=!!current;
    rectangle.hidden=x.disabled=y.disabled=current?.kind!=='rectangle';
    radiusField.hidden=radius.disabled=!['circle','cross'].includes(current?.kind);
    map.hidden=guide.hidden=!current;
    clear.hidden=!custom;
    for(const [dx,dy,tile] of tiles){
      tile.hidden=!custom&&(Math.abs(dx)>maxRangeX||Math.abs(dy)>maxRangeY);
      const lit=!!current&&gridShapeAt(current,dx,dy);
      tile.classList.toggle('lit',lit);
      tile.disabled=!custom;
      if(custom)tile.setAttribute('aria-pressed',String(lit));
      else tile.removeAttribute('aria-pressed');
    }
  }
  for(let dy=-customRangeRadius;dy<=customRangeRadius;dy++){
    for(let dx=-customRangeRadius;dx<=customRangeRadius;dx++){
      if(!dx&&!dy){map.append(el('span','◆',{class:'range-map-origin',title:origin,'aria-label':origin}));continue;}
      const key=[dx,dy].join(',');
      const tile=button('',()=>{
        if(cells.has(key))cells.delete(key);
        else cells.set(key,[dx,dy]);
        update();changed();
      });
      tile.setAttribute('aria-label',[(dx?((dx>0?'오른쪽 ':'왼쪽 ')+Math.abs(dx)+'칸'):''),(dy?((dy>0?'아래 ':'위 ')+Math.abs(dy)+'칸'):'')].filter(Boolean).join(', '));
      tiles.push([dx,dy,tile]);
      map.append(tile);
    }
  }
  const node=el('section',undefined,{class:'stack full range-editor'});
  node.append(field(shapeLabel,kind),numberField,rectangle,radiusField,guide,map,clear);
  node.addEventListener('input',update);
  node.addEventListener('change',update);
  update();
  return {node,value,range};
}
function cardKeywordHelp(preview){
  const popup=el('aside',undefined,{class:'card-keyword-help',popover:'auto','aria-label':'키워드 설명'});
  const title=el('strong');
  const description=el('div',undefined,{class:'card-keyword-description',tabindex:0});
  let active;
  const close=button('닫기',()=>{
    popup.hidePopover();
    active?.focus({preventScroll:true});
  });
  const header=el('div',undefined,{class:'row'});
  header.append(title,close);
  popup.append(header,description);
  popup.addEventListener('toggle',()=>{
    if(!popup.matches(':popover-open'))active?.setAttribute('aria-expanded','false');
  });
  const keyword=(name,lines,kind='effect',flavor='')=>{
    const trigger=button(name,()=>{
      if(active===trigger&&popup.matches(':popover-open')){
        popup.hidePopover();
        return;
      }
      active?.setAttribute('aria-expanded','false');
      active=trigger;
      title.textContent=name;
      description.replaceChildren(...(flavor?[flavorText(flavor)]:[]),...lines.map(line=>el('p',line)));
      description.scrollTop=0;
      if(!popup.matches(':popover-open'))popup.showPopover({source:trigger});
      trigger.setAttribute('aria-expanded','true');
      const anchor=trigger.getBoundingClientRect();
      const gap=6,margin=8,above=anchor.top-gap-margin;
      popup.style.maxHeight=Math.max(72,above>=96?above:innerHeight-anchor.bottom-gap-margin)+'px';
      const {offsetWidth:width,offsetHeight:height}=popup;
      popup.style.left=Math.max(margin,Math.min(anchor.left,innerWidth-width-margin))+'px';
      popup.style.top=(above>=96?anchor.top-height-gap:Math.max(margin,Math.min(anchor.bottom+gap,innerHeight-height-margin)))+'px';
    });
    trigger.className='card-keyword '+kind;
    trigger.setAttribute('aria-expanded','false');
    return trigger;
  };
  preview.keywordHelpController?.abort();
  preview.keywordHelpController=new AbortController();
  preview.addEventListener('scroll',event=>{
    if(event.target.matches('.forge-description')&&popup.matches(':popover-open'))popup.hidePopover();
  },{capture:true,signal:preview.keywordHelpController.signal});
  return {popup,keyword};
}
function renderCardFace(preview,card){
  const rows=card.effects||[];
  const {role,target,clash,unstoppable,splash,requiredState,image,notes,cost}=card;
  const powers=cardHitPowers(card);
  preview.dataset.kind=role;
  const art=el('div',undefined,{class:'forge-art'});
  if(image)art.append(el('img',undefined,{src:image,alt:''}));
  else art.append(el('span',role==='overload'?'✹':role==='guard'?'◇':'✦',{'aria-hidden':'true'}));
  const body=el('div',undefined,{class:'forge-face'});
  const strip=el('div',undefined,{class:'forge-strip'});
  strip.append(el('span',card.concept?'개념물 · '+roles[role]:roles[role]),el('strong',powers.map(power=>power||'—').join(' + ')),
    el('span',role==='guard'?'자동 합':role==='counter'?'자동 반격':clash?'합 가능':'합 불가'));
  const rangeLabel=role==='guard'?'원호 범위':role==='counter'?'반격 범위':target==='area'?'시전자 기준 광역':
    target==='tile'?'광역 중심 사거리':target==='splash'?'주 대상 사거리':target==='self'?'자신':target+'명';
  body.append(strip,el('h3',card.name||'이름 없는 카드'),note(rangeLabel+' · '+gridCardRangeLabel(card)));
  if(requiredState&&requiredState!=='any')body.append(note(cardStates[requiredState]));
  if(splash)body.append(note('부 대상 범위 · '+gridCardRangeLabel(splash)));
  if(card.hitTargets?.some(Boolean)){
    body.append(note(card.hitTargets.map((mode,index)=>(index+1)+'타 '+hitTargetModes[mode||'all']).join(' · ')));
  }
  if(powers.every(power=>parsePower(power)))body.append(note('보정 전 총 위력 '+formatPowerRange(powerBounds(card))));
  if(powers.length>1)body.append(note(powers.map((power,index)=>(index+1)+'타 '+(power||'—')).join(' · ')));
  if(unstoppable)body.append(note('저지불가 · 합 패배 시 최소 위력으로 공격'));
  if(role==='guard')body.append(note(coverHelp));
  if(role==='counter')body.append(note(counterHelp));
  if(cost&&(role==='overload'||card.concept))body.append(note('정신력 −'+cost+(card.concept?' · 부족하면 사용 불가':'')));
  const {popup,keyword}=cardKeywordHelp(preview);
  const description=el('div',undefined,{class:'forge-description',tabindex:0,role:'region','aria-label':'카드 설명'});
  const byStack=new Map();
  for(const effect of rows){
    for(const name of effectStackNames(effect)){
      if(!byStack.has(name))byStack.set(name,[]);
      byStack.get(name).push(effect);
    }
  }
  if(byStack.size){
    const stacks=el('div',undefined,{class:'row forge-keywords','aria-label':'중첩'});
    for(const [name,references] of byStack){
      const trait=(card.concept?conceptStacks[name]:null)||state.profile?.stackTraits?.find(item=>item.name===name)||conceptStacks[name];
      const lines=(trait?.effects||[]).map(effect=>effectTiming(effect)+' · '+effectSentence(effect)+
        (effect.scaleStack==='count'?' · 보유 중첩 수를 곱함':''));
      if(Object.hasOwn(basicStacks,name))lines.unshift(basicStacks[name].description);
      lines.push(...references.map(effect=>effectTiming(effect)+' · '+effectSentence(effect)));
      stacks.append(keyword(name,[...new Set(lines)],'stack-tag',trait?.flavor));
    }
    description.append(stacks);
  }
  for(const effect of rows){
    const line=el('p',undefined,{class:'forge-effect'});
    const phase=effectConditionText(effect)+effectTiming(effect);
    const name=effects[effect.kind]||effect.kind;
    const text=effectSentence(effect);
    line.append(el('b',phase),keyword(name,[phase+' · '+text]),el('span',text));
    if(effect.flavor)line.append(flavorText(effect.flavor));
    description.append(line);
  }
  if(card.flavor)description.prepend(flavorText(card.flavor));
  for(const [index,text] of (card.hitFlavors||[]).entries()){
    if(text)description.append(flavorText((index+1)+'타 · '+text));
  }
  if(notes)description.append(el('p',notes,{class:'notice minor forge-notes'}));
  if(description.childElementCount)body.append(description);
  preview.replaceChildren(art,body,popup);
}

function libraryPreview(){
  const popup=el('aside',undefined,{class:'library-card-preview',popover:'auto',id:'library-card-preview','aria-label':'카드 목록 미리보기'});
  const close=button('닫기',()=>dismiss(true));
  close.className='library-preview-close';
  const face=el('article',undefined,{class:'forge-preview'});
  popup.append(close,face);
  let current,locked=false,hideTimer;
  const isOpen=()=>popup.matches(':popover-open');
  function dismiss(restoreFocus=false){
    clearTimeout(hideTimer);
    const trigger=current;
    if(isOpen())popup.hidePopover();
    if(restoreFocus)trigger?.focus({preventScroll:true});
  }
  function show(card,control){
    clearTimeout(hideTimer);
    if(current!==control)current?.setAttribute('aria-expanded','false');
    current=control;
    renderCardFace(face,card);
    if(!isOpen())popup.showPopover();
    control.setAttribute('aria-expanded','true');
    const rect=control.getBoundingClientRect();
    const {offsetWidth:width,offsetHeight:height}=popup;
    const margin=8;
    if(matchMedia('(max-width: 690px)').matches){
      popup.style.left=(innerWidth-width)/2+'px';
      popup.style.top=Math.max(margin,(innerHeight-height)/2)+'px';
      return;
    }
    const left=rect.left>=width+margin*2?rect.left-width-6:rect.right+6;
    popup.style.left=Math.max(margin,Math.min(left,innerWidth-width-margin))+'px';
    popup.style.top=Math.max(margin,Math.min(rect.top,innerHeight-height-margin))+'px';
  }
  function scheduleHide(){
    if(!locked&&isOpen())hideTimer=setTimeout(()=>dismiss(),180);
  }
  function trigger(card,hoverArea){
    const control=button('미리보기',()=>{
      if(current===control&&locked&&isOpen()){dismiss();return;}
      locked=true;
      show(card,control);
    });
    control.setAttribute('aria-label',card.name+' 미리보기');
    control.setAttribute('aria-controls',popup.id);
    control.setAttribute('aria-expanded','false');
    for(const area of [hoverArea,control]){
      area?.addEventListener('pointerenter',event=>{
        if(event.pointerType==='mouse'&&(!locked||!isOpen())){
          if(current===control&&isOpen())clearTimeout(hideTimer);
          else show(card,control);
        }
      });
      area?.addEventListener('pointerleave',scheduleHide);
    }
    return control;
  }
  popup.addEventListener('pointerenter',()=>clearTimeout(hideTimer));
  popup.addEventListener('pointerleave',scheduleHide);
  popup.addEventListener('toggle',()=>{
    if(isOpen())return;
    current?.setAttribute('aria-expanded','false');
    current=null;
    locked=false;
  });
  return {popup,trigger,dismiss};
}
function cardList(label,preview){
  const list=el('div',undefined,{class:'card-list-scroll',role:'region','aria-label':label,tabindex:'0'});
  list.addEventListener('scroll',()=>preview.dismiss());
  return list;
}
async function downloadCharacterFile(kind,id){
  try{
    const data=await request({action:kind+'Export',id});
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const name=data.character?.name||data.passives?.[0]?.name||'콘셉트테라';
    const anchor=el('a',undefined,{href:url,download:name.replace(/[<>:"/\\|?*]/g,'_')+'-'+kind+'.json'});
    document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(err){errors.textContent=err.message;}
}
function characterFileControls(kind,locked,empty=false){
  const label=kind==='character'?'캐릭터 전체':'패시브';
  const actions=el('div',undefined,{class:'row library-file-actions'});
  const download=button(label+' 다운로드',()=>downloadCharacterFile(kind));
  download.disabled=empty;
  const file=input(undefined,'','file',{accept:'.json,application/json',hidden:true});
  const upload=button(label+' 업로드',()=>file.click());
  upload.disabled=locked;
  file.onchange=async()=>{
    const selected=file.files?.[0];
    file.value='';
    if(!selected)return;
    try{
      if(selected.size>maxCardFileBytes)throw new Error('파일 크기가 너무 커요.');
      const data=JSON.parse(await selected.text());
      if(data?.format!==(kind==='character'?characterFileFormat:passiveFileFormat)||data.version!==1)
        throw new Error('콘셉트테라 '+label+' JSON 파일을 선택하세요.');
      if(kind==='character'&&!confirm('이 방의 캐릭터 시트, 일러스트, 패시브를 파일 내용으로 교체할까요?'))return;
      await send(kind+'Import',{file:data});
    }catch(err){errors.textContent=err instanceof SyntaxError?'JSON 파일 형식을 확인하세요.':err.message;}
  };
  actions.append(file,download,upload);
  return actions;
}
function cardFileControls(cards){
  const actions=el('div',undefined,{class:'row library-file-actions'});
  const download=button('카드 목록 다운로드',()=>{
    const file=new Blob([JSON.stringify({format:cardFileFormat,version:1,cards})],{type:'application/json'});
    const url=URL.createObjectURL(file);
    const link=el('a',undefined,{href:url,download:'conceptterra-cards.json'});
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  download.disabled=!cards.length;
  const file=input('cardFile','','file',{accept:'.json,application/json','aria-label':'카드 목록 JSON 파일'});
  file.hidden=true;
  file.onchange=async()=>{
    const source=file.files[0];
    file.value='';
    if(!source)return;
    try{
      if(source.size>maxCardFileBytes)throw new Error('카드 목록 파일은 1.2MB 이하여야 해요.');
      const imported=JSON.parse(await source.text());
      if(imported?.format!==cardFileFormat||imported.version!==1||!Array.isArray(imported.cards)){
        throw new Error('콘셉트테라 카드 목록 JSON 파일을 선택하세요.');
      }
      await send('cardImport',{file:imported});
    }catch(err){errors.textContent=err instanceof SyntaxError?'JSON 파일을 읽을 수 없어요.':err.message;}
  };
  actions.append(download,button('카드 목록 업로드',()=>file.click()),file);
  return actions;
}
let previewFolded=matchMedia('(max-width: 690px)').matches;
function cardLibraryFilter(entries){
  const {values,effects:effectTags,stacks:stackTags}=libraryFilters;
  const index=entries.map(({card,line})=>{
    const powers=cardHitPowers(card).map(parsePower);
    const rows=card.effects||[];
    const stacks=new Set(rows.flatMap(effectStackNames));
    const kinds=new Set(rows.map(effect=>effect.kind));
    return {line,card,powers,range:powers.every(Boolean)?powerBounds(card):null,stacks,kinds,
      text:[card.name,card.notes,card.flavor,...(card.hitFlavors||[]),...rows.map(effect=>effect.flavor),card.concept?'개념물 개념구':'',...stacks,...[...kinds].map(kind=>effects[kind])].join(' ').normalize('NFKC').toLocaleLowerCase()};
  });
  const controls=[];
  const search=input(undefined,values.search||'','search',{placeholder:'카드 이름, 설명, 중첩, 효과 검색'});
  const result=el('output','',{class:'minor','aria-live':'polite'});
  const root=el('div',undefined,{class:'stack card-library-search'});
  const advanced=el('details',undefined,{class:'card-library-filters'});
  advanced.open=!!libraryFilters.open;
  advanced.ontoggle=()=>{libraryFilters.open=advanced.open;};
  const grid=el('div',undefined,{class:'card-filter-grid'});
  const query=key=>values[key]===''||values[key]==null?null:Number(values[key]);
  const update=()=>{
    const terms=(values.search||'').normalize('NFKC').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    const min=query('min'),max=query('max'),base=query('base'),dice=query('dice'),faces=query('faces'),offset=query('offset');
    const reversed=min!=null&&max!=null&&min>max;
    let visible=0;
    for(const item of index){
      const {line,card,powers,range,stacks,kinds,text}=item;
      const matchesPower=min===null&&max===null||range&&!reversed&&(min===null||range[1]>=min)&&(max===null||range[0]<=max);
      const matchesDice=dice===null&&faces===null&&offset===null||powers.some(power=>power?.count&&
        (dice===null||power.count===dice)&&(faces===null||power.sides===faces)&&(offset===null||power.bonus===offset));
      const match=terms.every(term=>text.includes(term))&&(!values.hits||powers.length===Number(values.hits))&&
        (!values.category||(values.category==='concept')===!!card.concept)&&
        (!values.role||card.role===values.role)&&matchesPower&&matchesDice&&
        (base===null||powers.every(Boolean)&&powers.reduce((sum,power)=>sum+power.bonus,0)===base)&&
        [...effectTags].every(tag=>kinds.has(tag))&&[...stackTags].every(tag=>stacks.has(tag));
      line.hidden=!match;
      if(match)visible++;
    }
    result.textContent=reversed?'총 위력의 최솟값은 최댓값 이하여야 해요.':visible?
      visible+' / '+index.length+'장 표시':'조건에 맞는 카드가 없어요.';
  };
  const bind=(key,control)=>{
    controls.push([key,control]);
    control.addEventListener('input',()=>{values[key]=control.value;update();});
    return control;
  };
  const number=(key,label,min)=>field(label,bind(key,input(undefined,values[key]??'','number',{min,step:1,placeholder:'전체'})));
  grid.append(
    field('카드 분류',bind('category',select(undefined,[['','전체'],['basic','일반 카드'],['concept','개념물 카드']],values.category||''))),
    field('타수',bind('hits',select(undefined,[['','전체'],...Array.from({length:maxCardHits},(_,i)=>[i+1,(i+1)+'타'])],values.hits||''))),
    field('카드 종류',bind('role',select(undefined,[['','전체'],...Object.entries(roles)],values.role||''))),
    number('min','총 위력 범위 · 최솟값',0),number('max','총 위력 범위 · 최댓값',0),
    number('base','기본 고정 위력 합'),
    number('dice','한 타격의 주사위 개수',1),number('faces','한 타격의 주사위 면수',2),
    number('offset','한 타격의 주사위 증감값'));
  const refreshTags=[];
  const tags=(label,options,selected)=>{
    const wrap=el('details',undefined,{class:'card-tag-picker'});
    const picker=input(undefined,'','search',{placeholder:label+' 검색'});
    const choices=el('div',undefined,{class:'card-tag-options',role:'group','aria-label':label+' 검색 결과'});
    const chips=el('div',undefined,{class:'row'});
    const refreshChoices=()=>{
      const query=picker.value.normalize('NFKC').toLocaleLowerCase().trim();
      const matches=options.filter(([id,name])=>!selected.has(id)&&name.normalize('NFKC').toLocaleLowerCase().includes(query));
      choices.replaceChildren(...(matches.length?matches.map(([id,name])=>button(name,()=>{
        selected.add(id);refresh();update();picker.focus();
      })):[el('small',query?'일치하는 태그가 없어요.':'추가할 태그가 없어요.')]));
    };
    const refresh=()=>{
      chips.replaceChildren(...[...selected].map(id=>{
        const name=options.find(option=>option[0]===id)?.[1]||id;
        const remove=button(name+' ×',()=>{selected.delete(id);refresh();update();picker.focus();});
        remove.setAttribute('aria-label',name+' 태그 제거');
        return remove;
      }));
      refreshChoices();
    };
    picker.addEventListener('input',refreshChoices);
    refreshTags.push(refresh);refresh();
    wrap.append(el('summary',label+' 추가'),field(label+' 검색',picker),choices);
    const group=el('div',undefined,{class:'stack'});
    group.append(wrap,chips);
    return group;
  };
  const sharedStacks=(state.sharedCards||[]).flatMap(({card})=>(card.effects||[]).flatMap(effectStackNames));
  const stackNames=[...new Set([...Object.keys(basicStacks),...(state.profile.customStacks||[]),...sharedStacks,
    ...index.flatMap(item=>[...item.stacks])])].sort((a,b)=>a.localeCompare(b,'ko'));
  const effectOptions=Object.entries(effects).filter(([kind])=>!legacyCriticalStackEffects.includes(kind)).sort(([,a],[,b])=>a.localeCompare(b,'ko'));
  advanced.append(el('summary','상세 필터'),grid,
    note('총 위력은 전투 보정 전 범위와 겹치는 카드를 찾아요. 기본 고정 위력은 모든 타격의 고정값과 주사위 뒤 증감값을 더한 값이에요.'),
    tags('중첩 태그',opts(stackNames),stackTags),tags('효과 태그',effectOptions,effectTags));
  root.append(field('카드 검색',bind('search',search)),advanced,
    el('div',undefined,{class:'row card-filter-status'}));
  root.lastChild.append(result,button('검색·필터 초기화',()=>{
    for(const [key,control] of controls){delete values[key];control.value='';}
    effectTags.clear();stackTags.clear();refreshTags.forEach(refresh=>refresh());update();
  }));
  update();
  return root;
}

function cards(){
  const p=state.profile, c=p.cards.find(x=>x.id===edit)||{};
  const role=select('role',Object.entries(roles),c.role||'normal');
  const hitList=el('div',undefined,{class:'stack full'});
  const hits=[];
  let nextHitId=0;
  let refresh=()=>{};
  const changed=()=>{draftDirty=true;refresh();};
  const workspace=effectWorkspace((c.effects||[]).filter(effect=>!effect.hitIndex),{role,onChange:changed});
  const powers=()=>hits.map(hit=>hit.power.value);
  const allEffects=()=>[...workspace.rows(),...hits.flatMap((hit,index)=>hit.workspace.rows().map(effect=>({...effect,hitIndex:index+1})))];
  const syncHits=()=>{
    hits.forEach(({legend,label,power,up,down,remove},i)=>{
      const number=i+1;
      legend.textContent=number+'타';
      label.firstChild.textContent=number+'타 위력';
      power.setAttribute('aria-label',number+'타 위력');
      up.setAttribute('aria-label',number+'타 위로');
      down.setAttribute('aria-label',number+'타 아래로');
      remove.setAttribute('aria-label',number+'타 삭제');
      up.disabled=i===0;
      down.disabled=i===hits.length-1;
      remove.disabled=hits.length===1;
    });
    addHit.disabled=hits.length>=maxCardHits;
  };
  function addHitRow(formula,effects=[],targetMode='',text=''){
    const id='hit-power-'+(++nextHitId);
    const node=el('fieldset',undefined,{class:'hit-editor stack'});
    const legend=el('legend');
    const power=input(id,formula,'text',{
      required:true,maxlength:18,placeholder:'예: 2d+5',spellcheck:'false',autocapitalize:'off',
      'aria-describedby':'power-formula-guide '+id+'-feedback'
    });
    const feedback=el('small','',{id:id+'-feedback',class:'power-formula-feedback'});
    const label=field('타격 위력',power);
    const targetModeControl=select(id+'-target',[['','기본 처리'],...Object.entries(hitTargetModes)],targetMode);
    const targetModeField=field('타격 대상',targetModeControl);
    label.append(feedback);
    const update=()=>{
      const valid=parsePower(power.value);
      power.setCustomValidity(power.value&&!valid?'주사위식(예: 2d+5)이나 고정값(예: 7)을 입력하세요.':'');
      feedback.textContent=valid?'기본 위력 '+formatPowerRange(powerBounds({power:power.value})):
        power.value?'주사위식을 확인하세요.':'';
    };
    power.addEventListener('input',update);
    power.addEventListener('change',update);
    update();
    const workspace=effectWorkspace(effects,{scoped:true,role,onChange:changed});
    const effectRows=el('details',undefined,{class:'hit-workspace full'});
    effectRows.open=effects.length>0;
    effectRows.append(el('summary','이 타격의 스크립트'),workspace.node);
    const move=direction=>{
      const index=hits.indexOf(hit), next=index+direction;
      if(next<0||next>=hits.length)return;
      const other=hits[next];
      [hits[index],hits[next]]=[other,hit];
      if(direction<0)hitList.insertBefore(node,other.node);
      else hitList.insertBefore(other.node,node);
      syncHits();
      (direction<0&&!up.disabled?up:direction>0&&!down.disabled?down:power).focus();
      changed();
    };
    const actions=el('div',undefined,{class:'row hit-editor-actions'});
    const up=button('↑',()=>move(-1));
    const down=button('↓',()=>move(1));
    const remove=button('삭제',()=>{
      const index=hits.indexOf(hit);
      if(hits.length===1)return;
      hits.splice(index,1);
      node.remove();
      syncHits();
      hits[Math.min(index,hits.length-1)].power.focus();
      changed();
    });
    const flavor=area(undefined,text,180);
    const hit={node,legend,label,power,flavor,targetModeControl,targetModeField,up,down,remove,workspace};
    actions.append(up,down,remove);
    node.append(legend,actions,label,targetModeField,field('타격 플레이버 텍스트',flavor),effectRows);
    hits.push(hit);
    hitList.append(node);
    return hit;
  }
  const addHit=button('＋ 타수 추가',()=>{
    if(hits.length>=maxCardHits)return;
    const hit=addHitRow('1d');
    sync();syncHits();
    hit.power.focus();
    changed();
  });
  cardHitPowers(c).forEach((formula,index)=>addHitRow(formula??'2d+5',(c.effects||[]).filter(effect=>effect.hitIndex===index+1),c.hitTargets?.[index],c.hitFlavors?.[index]));
  syncHits();
  const rangeForm=rangeEditor(c,changed,{label:'기본 사거리'});
  const splashForm=rangeEditor(c.splash||{range:'1'},changed,{
    origin:'광역 중심',prefix:'splashRange',label:'광역 중심 기준 거리',shapeLabel:'주변 광역 모양'
  });
  const splashSettings=el('fieldset',undefined,{class:'stack full splash-settings'});
  splashSettings.append(el('legend','주 대상 주변 광역'),
    note('타일 지정은 빈 칸도 고를 수 있어요. 선택한 칸의 적은 주 대상, 주변 범위 안의 적은 부 대상이에요.'),splashForm.node);
  const makeCard=formFor('card',async(form,data)=>{
    const chosen=data.get('target');
    const effects=allEffects();
    const hitPowers=powers();
    const modes=hits.map(hit=>hit.targetModeControl.disabled?'':hit.targetModeControl.value);
    const hitTargets=modes.some(Boolean)?modes.map(mode=>mode||'all'):undefined;
    for(const effect of effects){
      if(effect.kind!=='amplifyHit')continue;
      if(effect.hitIndex>=hitPowers.length||effect.amplifyTarget==='number'&&
        (effect.amplifyIndex<=effect.hitIndex||effect.amplifyIndex>hitPowers.length)){
        throw new Error(effect.hitIndex+'타: 증폭할 타격은 이 타격보다 뒤에 있어야 해요.');
      }
    }
    const image=await imageData(data.get('image'));
    const splash=['splash','tile'].includes(chosen)?{range:splashForm.range.value,rangeShape:splashForm.value()}:undefined;
    return {card:{id:c.id,name:data.get('name'),hitPowers,hitTargets,hitFlavors:hits.map(hit=>hit.flavor.value),flavor:data.get('flavor'),target:['guard','counter'].includes(role.value)?'self':/^\d$/.test(chosen)?Number(chosen):chosen,range:rangeForm.range.value,rangeShape:rangeForm.value(),splash,clash:data.has('clash'),unstoppable:data.has('unstoppable'),role:data.get('role'),requiredState:data.get('requiredState'),cost:Number(data.get('cost')),notes:data.get('notes'),effects,image:image||(!data.has('clearImage')?c.image:'')}};
  });
  const cost=field('혹사 정신력 소모',select('cost',[[10,'10'],[20,'20'],[30,'30']],c.cost||20));
  const sync=()=>{
    cost.style.display=role.value==='overload'?'':'none';
    const form=makeCard.elements;
    form.target.disabled=['guard','counter'].includes(role.value);
    form.clash.disabled=form.target.disabled||form.target.value==='tile';
    splashSettings.hidden=splashSettings.disabled=form.target.disabled||!['splash','tile'].includes(form.target.value);
    for(const hit of hits){
      hit.targetModeField.hidden=hit.targetModeControl.disabled=form.target.disabled||form.target.value==='self';
    }
    for(const control of [form.target,form.clash,form.unstoppable])control.parentElement.hidden=role.value==='counter';
    form.unstoppable.disabled=['guard','assist','counter'].includes(role.value)||form.target.value==='self'||form.clash.disabled||!form.clash.checked;
  };
  role.onchange=()=>{
    sync();
    for(const ws of [workspace,...hits.map(hit=>hit.workspace)])ws.refreshTools();
  };
  makeCard.append(field('카드명',input('name',c.name,'text',{required:true,maxlength:36})),
    field('대상',select('target',[[1,'1명'],[2,'최대 2명'],[3,'최대 3명'],[4,'최대 4명'],['area','시전자 기준 광역'],['splash','적 지정 광역'],['tile','타일 지정 광역'],['self','자신']],c.target||1)),
    rangeForm.node,splashSettings,
    field('카드 유형',role),field('사용 가능 상태',select('requiredState',Object.entries(cardStates),c.requiredState||'any')),cost,field('합 가능',input('clash','1','checkbox',{checked:c.clash??true}),'inline'),
    field('저지불가',input('unstoppable','1','checkbox',{checked:!!c.unstoppable,'aria-describedby':'unstoppable-guide'}),'inline'),
    el('p','합에서 패배해도 전투를 계속할 수 있으면 최소 위력으로 공격해요.',{id:'unstoppable-guide',class:'notice minor full'}),
    field('카드 이미지',input('image','','file',{accept:'image/png,image/jpeg,image/webp'})),
    field('카드 플레이버 텍스트',area('flavor',c.flavor||'',300),'full'),field('GM 판정 메모',area('notes',c.notes||'',300),'full'));
  makeCard.elements.target.addEventListener('change',sync);
  makeCard.elements.clash.addEventListener('change',sync);
  sync();
  if(c.image)makeCard.append(el('img',undefined,{src:c.image,alt:'현재 카드 이미지',class:'picture'}),field('현재 이미지 제거',input('clearImage','1','checkbox'),'inline'));
  let artwork=c.image||'';
  const live=el('article',undefined,{class:'forge-preview','aria-label':'완성 카드 미리보기'});
  const rangeGuide=el('div',undefined,{class:'range-guide'});
  const rangeHint=note('빛난 숫자가 닿는 거리예요. 2, 4는 두 거리만, 2~4는 사이 거리까지 포함해요.');
  refresh=()=>{
    const form=makeCard.elements;
    if(!form.name)return;
    const {range, value:shape}=rangeForm;
    const rangeShape=shape();
    const modes=hits.map(hit=>hit.targetModeControl.disabled?'':hit.targetModeControl.value);
    renderCardFace(live,{
      name:form.name.value,role:form.role.value,target:form.target.value,
      range:range.value,rangeShape,hitPowers:powers(),hitTargets:modes,hitFlavors:hits.map(hit=>hit.flavor.value),flavor:form.flavor.value,
      splash:splashSettings.hidden?undefined:{range:splashForm.range.value,rangeShape:splashForm.value()},
      clash:!form.clash.disabled&&form.clash.checked,unstoppable:!form.unstoppable.disabled&&form.unstoppable.checked,
      requiredState:form.requiredState.value,cost:form.cost.value,
      image:form.clearImage?.checked?'':artwork,effects:allEffects(),notes:form.notes.value
    });
    rangeGuide.hidden=rangeHint.hidden=!!rangeShape;
    rangeGuide.replaceChildren(...(rangeShape?[]:Array.from({length:13},(_,i)=>el('span',String(i),{class:gridRangeAt(range.value,i)?'lit':''}))));
  };
  const file=makeCard.elements.image;
  let imageVersion=0;
  file.onchange=async()=>{
    const version=++imageVersion;
    try{const next=await imageData(file.files[0]);if(version===imageVersion){artwork=next||c.image||'';refresh();}}
    catch(err){if(version===imageVersion){file.value='';errors.textContent=err.message;}}
  };
  const globalEditor=el('section',undefined,{class:'stack full'});
  globalEditor.append(el('h3','카드 스크립트'),
    note('이벤트 아래에 효과와 제어 블록을 끼워 넣으세요. 모바일에서는 연결 칸을 누른 뒤 도구함의 블록을 누르면 돼요.'),
    note('카드 결정 시와 행동 확정 시 효과는 라운드 처리 시작에 실행돼요. 그 전에 예약을 취소하면 발동하지 않아요.'),workspace.node);
  const hitEditor=el('section',undefined,{class:'stack full'});
  hitEditor.append(el('h3','타격'),el('p','각 타격의 위력을 더해 합을 판정해요. 2d+5는 6면체 주사위 2개에 5를 더한다는 뜻이에요.',{id:'power-formula-guide',class:'notice minor'}),hitList,addHit);
  makeCard.append(globalEditor,hitEditor,submit(c.id?'변경한 카드 저장':'카드 완성'));
  makeCard.addEventListener('input',refresh);makeCard.addEventListener('change',refresh);refresh();
  const deck=formFor('deck',(_,data)=>({
    cards:[...data].flatMap(([id,count])=>Array(Number(count)).fill(id))
  }));
  deck.className='stack';
  const selected=new Map();
  for(const id of p.deck)selected.set(id,(selected.get(id)||0)+1);
  const count=el('output','',{class:'deck-count','aria-live':'polite'});
  const saveDeck=submit('덱 저장');
  const quantities=[];
  const update=()=>{
    const total=quantities.reduce((sum,control)=>sum+Number(control.value),0);
    count.textContent=total+' / '+deckSize+'장';
    saveDeck.disabled=total!==deckSize;
  };
  deck.append(el('div',undefined,{class:'row deck-summary'}));
  deck.firstChild.append(count,note('카드 한 종류당 최대 '+deckCopyLimit+'장'));
  const cataloguePreview=libraryPreview();
  const ownedList=cardList('보관함 카드 목록',cataloguePreview);
  deck.append(ownedList);
  const shares=state.sharedCards||[];
  const libraryEntries=[];
  for(const card of [...state.defaults,...p.cards]){
    const line=el('div',undefined,{class:'deck-row'});
    const stateLabel=card.requiredState&&card.requiredState!=='any'?' · '+cardStates[card.requiredState]:'';
    const details=el('div',undefined,{class:'deck-card-text'});
    details.append(el('strong',card.name),el('small',cardHitPowers(card).join(' + ')+stateLabel+
      (card.concept?' · 개념물 · 정신력 −'+card.cost:'')));
    const quantity=select(card.id,Array.from({length:deckCopyLimit+1},(_,i)=>[i,i+'장']),selected.get(card.id)||0);
    quantity.setAttribute('aria-label',card.name+' 수량');
    quantities.push(quantity);
    const controls=el('div',undefined,{class:'row deck-card-controls'});
    controls.append(cataloguePreview.trigger(card,details),quantity);
    if(p.cards.includes(card)){
      const posted=shares.some(share=>share.owner===state.me&&share.card.id===card.id);
      controls.append(button('편집',()=>{
        edit=card.id;draftDirty=false;render();
        panel.querySelector('input[name="name"]')?.focus();
      }),
        button('복제',()=>send('cardClone',{id:card.id})),
        button('삭제',()=>{
          const detail=selected.has(card.id)?' 덱에 든 장수는 기본 카드로 채워요.':'';
          if(confirm('「'+card.name+'」 카드를 삭제할까요?'+detail))send('cardDelete',{id:card.id});
        }));
      if(!studio)controls.append(button(posted?'공유 갱신':'이 방에 공유',()=>{
          if(card.effects.some(effect=>p.cards.some(owned=>owned.id!==card.id&&effectCardReferences(effect).includes(owned.id)))&&
            !confirm('이 카드의 효과가 참조하는 제작 카드도 함께 공유할까요?'))return;
          send('cardShare',{id:card.id});
        }));
    }
    if(card.image)line.append(el('img',undefined,{src:card.image,alt:'',class:'picture'}));
    line.append(details,controls);
    ownedList.append(line);
    libraryEntries.push({card,line});
  }
  deck.addEventListener('change',update);update();deck.append(saveDeck);
  const preview=section('카드 미리보기',live,rangeGuide,rangeHint);
  preview.classList.add('forge-display');
  const syncPreview=()=>{
    preview.classList.toggle('folded',previewFolded);
    previewToggle.textContent=previewFolded?'미리보기 펼치기':'미리보기 접기';
    previewToggle.setAttribute('aria-expanded',String(!previewFolded));
  };
  const previewToggle=button('미리보기 접기',()=>{
    previewFolded=!previewFolded;
    syncPreview();
  });
  syncPreview();
  preview.insertBefore(previewToggle,live);
  const editor=section(c.id?'카드 다듬기':'새 카드 만들기',stackManager(),makeCard,...(c.id?[button('새 카드 제작',()=>{edit=null;render();})]:[]));
  const library=section('카드 보관함 · 전투 덱',note('카드 목록 파일에는 제작 카드와 이미지가 들어가요. 가져온 카드는 보관함에 추가돼요.'),cardFileControls(p.cards),cardLibraryFilter(libraryEntries),deck);library.classList.add('full');
  library.insertBefore(note('개념물 카드는 정신력을 소모하고 전용 중첩을 부여해요. 카드 미리보기에서 중첩 이름을 누르면 지속 효과를 확인할 수 있어요. 중첩은 제거되거나 전투가 끝날 때 해제돼요.'),library.children[1]);
  const shared=section('이 방의 공유 카드');
  shared.classList.add('full');
  if(!shares.length)shared.append(note('아직 공유된 카드가 없어요.'));
  const sharedList=shares.length?cardList('공유 카드 목록',cataloguePreview):null;
  for(const share of shares){
    const line=el('div',undefined,{class:'deck-row'});
    const details=el('div',undefined,{class:'deck-card-text'});
    details.append(el('strong',share.card.name),el('small',share.author+(share.included.length?' · 함께 가져오는 카드: '+share.included.join(', '):'')));
    const actions=el('div',undefined,{class:'row deck-card-controls'});
    actions.append(cataloguePreview.trigger(share.card,details),share.owner===state.me
      ?button('공유 해제',()=>send('cardUnshare',{id:share.id}))
      :button('내 보관함에 가져오기',()=>send('cardTake',{id:share.id})));
    line.append(details,actions);
    sharedList.append(line);
  }
  if(sharedList)shared.append(sharedList);
  const layout=group(preview,editor,library,...(studio?[]:[shared]));
  layout.append(cataloguePreview.popup);layout.classList.add('forge');return layout;
}
function startPanel(){
  const root=section('빈 객차',note('눈을 뜨자 객차에는 남은 승객들뿐입니다. 존속의 집행체가 열차에 들어옵니다.'));
  if(!state.manager){root.append(note('GM 또는 방장이 전투를 시작할 때까지 기다려 주세요.'));return root;}
  const form=formFor('start',(_,data)=>({solo:data.has('solo'),bots:Number(data.get('bots'))}));
  const solo=input('solo','1','checkbox',{checked:!state.roster.length,disabled:!!state.roster.length});
  const bots=select('bots',[],0);
  const refresh=()=>{
    const max=4-state.roster.length-Number(solo.checked);
    const old=Number(bots.value);
    bots.replaceChildren(...Array.from({length:max+1},(_,i)=>el('option',i+'명',{value:i})));
    bots.value=String(Math.min(old,max));
  };
  solo.onchange=refresh;refresh();bots.value=String(4-state.roster.length-Number(solo.checked));
  form.append(field('내 캐릭터로 혼자 연습',solo,'inline'),field('자동 행동 봇 동료',bots),submit('연습 전투 시작'));
  root.append(form,note('봇은 빈 플레이어 자리를 채우고 라운드 처리 시 이동·공격·합·원호를 자동 선택합니다.'));
  return root;
}
function boardArrow(overlay,from,to,tone){
  if(from===to)return;
  const a=gridPoint(from), b=gridPoint(to);
  const x=a.x+.5,y=a.y+.5,u=b.x+.5,v=b.y+.5;
  const distance=Math.hypot(u-x,v-y)||1;
  const cx=(x+u)/2-(v-y)/distance*.55, cy=(y+v)/2+(u-x)/distance*.55;
  const svg=(tag,attrs)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,val] of Object.entries(attrs))n.setAttribute(k,val);return n;};
  const tipX=u+(cx-u)*.18,tipY=v+(cy-v)*.18;
  const angle=Math.atan2(tipY-cy,tipX-cx)*180/Math.PI;
  overlay.append(svg('path',{d:`M ${x} ${y} Q ${cx} ${cy} ${tipX} ${tipY}`,class:tone}),svg('path',{d:'M -.15 -.11 L 0 0 L -.15 .11',transform:`translate(${tipX} ${tipY}) rotate(${angle})`,class:tone}));
}
const battleSprites = {'이루어질':'00','이루어져':'01','이루어라':'02','이루소서':'03','이루어도':'05','이루게나':'06','이루도록':'07','이루려나':'08','이루겠네':'09'};
function battleIcon(card){
  return '/battle-art/hit-'+(card.role==='guard'?'shield':'sword')+'.png';
}
function formatPowerRange([min,max]){
  return min===max?String(min):min+'~'+max;
}
function powerBounds(card, modifier=0) {
  const formulas=cardHitPowers(card);
  const [min,max]=formulas.reduce(([min,max],formula)=>{
    const {count,sides,bonus}=parsePower(formula);
    const floor=formulas.length>1?0:-Infinity;
    return [min+Math.max(floor,bonus+count),max+Math.max(floor,bonus+count*sides)];
  },[0,0]);
  return [Math.max(0,min+modifier),Math.max(0,max+modifier)];
}
function actionPanel(title,card,unit,art){
  const side=el('aside',undefined,{class:'battle-card-detail stack','aria-label':title});
  side.append(el('h3',title));
  if(!card){side.append(note('손패에서 행동 카드를 선택하세요.'));return side;}
  const [min,max]=powerBounds(card,(unit.enemy?0:mentalPower(Math.max(0,unit.mind-card.cost)))+(unit.nextPower||0)+(unit.awakening?awakeningPower:0)).map(value=>applyPowerRatio(value,unit.nextPowerPercent||0));
  const values=el('div',undefined,{class:'battle-power-preview'});
  for(const [key,value] of [['최소 위력',min],['최대 위력',max]]){
    const item=el('span',key);item.append(el('b',value));values.append(item);
  }
  side.append(values,el('strong',card.name),note(unit.name+' · 사거리 '+gridCardRangeLabel(card)));
  if(cardHitPowers(card).length>1)side.append(note(cardHitPowers(card).map((power,i)=>(i+1)+'타 '+power).join(' · ')));
  if(card.unstoppable)side.append(note('저지불가 · 합 패배 시 최소 위력으로 공격'));
  if(card.role==='guard')side.append(note(coverHelp));
  if(card.role==='counter')side.append(note(counterHelp));
  if(card.splash)side.append(note((card.target==='tile'?'선택한 칸 주변 · ':card.hitTargets?'부 대상 범위 · ':'주 대상 적중 시 · 주변 ')+gridCardRangeLabel(card.splash)));
  if(art)side.append(el('img',undefined,{src:art,alt:'',class:'battle-action-art'}));
  for(const effect of card.effects)side.append(note(effectConditionText(effect)+effectTiming(effect)+' · '+effectSentence(effect)));
  if(card.cost)side.append(note('정신력 −'+card.cost));
  if(card.notes)side.append(note(card.notes));
  return side;
}
function battleDialog(title,content){
  const dialog=el('dialog',undefined,{class:'vn-log-modal','aria-label':title});
  const window=el('div',undefined,{class:'vn-log-window'});
  const close=button('닫기',()=>dialog.close());
  close.className='vn-log-close';
  window.append(close,el('h3',title),content);
  dialog.append(window);
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  return dialog;
}
function battleArt(unit,pose,form=unit.collapsed?'concept':unit.zero==='crisis'?'crisis':unit.awakening?'awakened':'normal'){
  const fallback=pose==='shift'?[]:pose==='clash'?[form+'.ready',form+'.idle','normal.clash','normal.ready']:
    [form+'.idle','normal.'+pose];
  const slot=[form+'.'+pose,...fallback,form+'.idle','normal.idle'].find(key=>unit.artSlots?.includes(key));
  const sprite=Object.hasOwn(battleSprites,unit.name)?battleSprites[unit.name]:null;
  return slot?artUrl(unit.id,slot,unit.artVersion):sprite?'/battle-art/unit-'+sprite+'.png':null;
}
function battleGrid(b,self){
  const frame=el('div',undefined,{class:'field-frame'});
  const tools=el('nav',undefined,{class:'battle-camera-tools','aria-label':'카메라 조작'});
  const modes=el('div',undefined,{role:'group','aria-label':'드래그 모드'});
  const cameraButton=(label,attrs)=>el('button',label,{type:'button',...attrs});
  modes.append(cameraButton('회전',{'data-camera-mode':'rotate'}),cameraButton('이동',{'data-camera-mode':'move'}));
  tools.append(modes,cameraButton('＋',{'data-camera-zoom':'.08','aria-label':'카메라 확대'}),cameraButton('−',{'data-camera-zoom':'-.08','aria-label':'카메라 축소'}),cameraButton('초기화',{'data-camera-reset':true,'aria-label':'카메라 초기화'}));
  const field=el('div',undefined,{class:'battle-field'});
  const camera=el('div',undefined,{class:'battle-camera'});
  const grid=el('div',undefined,{class:'battle-grid battle-board-3d','aria-label':'객차 전장 8열 5행'});
  const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');
  overlay.setAttribute('viewBox','0 0 8 5');overlay.setAttribute('class','battle-lines');overlay.setAttribute('aria-hidden','true');
  const tiles=[];
  for(let i=0;i<gridSize;i++){
    const {x,y}=gridPoint(i), wall=b.walls.includes(i);
    const unit=b.units.find(u=>u.pos===i&&u.hp>0)||b.units.find(u=>u.pos===i&&!u.hp);
    const tile=el('button',undefined,{type:'button'});
    tile.className='battle-cell'+(wall?' wall':'');
    tile.setAttribute('aria-label',`${x+1}열 ${y+1}행${wall?' · 벽':unit?' · '+unit.name:''}`);
    tile.append(el('small',String.fromCharCode(65+x)+(y+1),{class:'coordinate'}));
    if(unit){
      const title=unit.enemy?'적':unit.id===self?.id?'나':unit.bot?'봇':'아군';
      const token=el('span',undefined,{class:'battle-token'+(unit.enemy?' enemy':'')+(unit.id===self?.id?' self':'')});
      const art=battleArt(unit,unit.ready?'ready':unit.pose||'idle');
      if(art)token.append(el('img',undefined,{src:art,alt:'',class:'battle-unit-sprite',draggable:'false'}));
      else token.append(el('b',unit.collapsed?'개념화':unit.hp?title:'전투 불능',{class:unit.enemy?'enemy-core':''}));
      const badge=el('span',unit.enemy?'1':unit.ready?'✓':'—',{class:'action-slot',title:unit.enemy?'예고 행동':unit.ready?'행동 예약 완료':'행동 대기'});
      token.append(badge,el('span',unit.name.split(' · ')[0]),el('progress',undefined,{value:unit.hp,max:unit.maxHp,'aria-label':unit.name+' 체력'}));
      if(!unit.enemy)token.append(el('small',unit.mind,{class:'unit-sp',title:'정신력'}));
      tile.append(token);
    }
    grid.append(tile);tiles.push(tile);
  }
  grid.append(overlay);
  camera.append(grid);field.append(camera);frame.append(field);
  bindBattleBoardControls(field,camera,tools);
  return {frame,tools,tiles,overlay};
}
function battlePanel(){
  const b=state.battle;
  if(!b)return startPanel();
  const self=b.units.find(u=>u.id===state.me), foe=b.units.find(u=>u.enemy), target=b.units.find(u=>u.id===b.intent?.target);
  const crisis=self?.zero==='crisis', collapsed=!!self?.collapsed;
  const active=self&&b.phase==='planning'&&self.hp>0&&!self.blockedRounds&&(!self.zero||crisis||collapsed);
  const occupied=new Set([...b.walls,...b.units.filter(u=>u.id!==self?.id&&u.hp>0).map(u=>u.pos)]);
  const paths=active?gridPaths(self.pos,self.move,occupied):new Map();
  const awaiting=b.awaiting||[];
  const fieldView=battleGrid(b,self);
  if(b.phase==='planning'&&target&&foe&&b.intent.reachable)boardArrow(fieldView.overlay,foe.pos,target.pos,'incoming');
  const controls=el('div',undefined,{class:'battle-footer-controls row'});
  if(state.manager&&b.phase==='planning'){
    const advance=button('라운드 진행',()=>send('round'),true);
    advance.disabled=awaiting.length>0;
    controls.append(advance);
  }
  if(state.manager&&b.phase==='finished')controls.append(button('다음 전투 준비',()=>send('reset'),true));
  const menu=el('details',undefined,{class:'battle-menu'});
  const menuItems=el('div');
  menu.append(el('summary','☰ 전투 메뉴'),menuItems);
  if(state.manager&&b.phase==='planning'){
    const choices=b.units.filter(u=>!u.enemy&&u.hp>0);
    const settings=formFor('intent',(_,data)=>({target:data.get('target')}));
    settings.append(field('적의 공격 대상',select('target',choices.map(u=>[u.id,u.name]),target?.id)),submit('예고 변경'));
    const adjust=formFor('adjust',(_,data)=>({target:data.get('target'),mind:Number(data.get('mind'))}));
    adjust.append(field('정신력 조정 대상',select('target',choices.filter(u=>!u.collapsed).map(u=>[u.id,u.name]),choices.find(u=>!u.collapsed)?.id)),field('변화량',input('mind',5,'number',{min:-100,max:100,required:true})),submit('정신력 반영'));
    const actions=formFor('adjustActions',(_,data)=>({target:data.get('target'),baseActions:Number(data.get('baseActions'))}));
    const actionTarget=select('target',choices.map(u=>[u.id,u.name]),self?.id||choices[0]?.id);
    const actionAmount=input('baseActions',choices.find(u=>u.id===actionTarget.value)?.baseActions??baseActions,'number',{min:baseActions,max:maxActions,required:true});
    actionTarget.onchange=()=>{actionAmount.value=choices.find(u=>u.id===actionTarget.value)?.baseActions??baseActions;};
    actions.append(field('행동량 조정 대상',actionTarget),field('기본 행동량',actionAmount),submit('행동량 반영'));
    const gm=el('details');gm.append(el('summary','GM 조정'),settings,adjust,actions,button('전투 중단',()=>{if(confirm('현재 전투를 정리할까요?'))send('reset');}));menuItems.append(gm);
  }
  const board=el('section',undefined,{class:'battle-dummy'});
  const topbar=el('div',undefined,{class:'battle-topbar'});
  const heading=el('div');
  heading.append(el('p','빈 객차',{class:'tag'}),el('h2',b.phase==='finished'?'전투 '+b.result:'라운드 '+b.round));
  const meters=el('div',undefined,{class:'battle-meters'});
  if(self)meters.append(el('span','체력 '+self.hp+'/'+self.maxHp),el('span','정신력 '+self.mind+'/100'),el('span','위력 '+signed(mentalPower(self.mind)+(self.awakening?awakeningPower:0))));
  if(self)meters.append(el('span','행동량 '+(self.actionLimit??baseActions)));
  if(self?.zero==='crisis')meters.append(el('span','붕괴 직전 · '+self.collapseRound+'라운드 종료'));
  if(collapsed)meters.append(el('span','붕괴 · 자동 표적'));
  if(self?.awakening)meters.append(el('span','각성'));
  if(self?.temptation)meters.append(el('span','유혹 '+self.temptation));
  if(self?.coverCount)meters.append(el('span','원호 방어 '+self.coverCount));
  if(awaiting.length&&b.phase==='planning')meters.append(el('span','행동 대기 '+awaiting.length,{title:awaiting.join(', ')}));
  topbar.append(heading,meters,menu);
  const allyPanel=el('div',undefined,{class:'battle-side left'});
  const enemyPanel=el('div',undefined,{class:'battle-side right'});
  const forecast=el('div',undefined,{class:'clash-forecast','aria-live':'polite'});
  const recentClash=b.log.slice().reverse().find(line=>line.startsWith('합 '));
  if(recentClash)forecast.textContent='직전 '+recentClash;

  if(b.phase==='planning'&&target){
    enemyPanel.append(actionPanel('적 예고 · '+target.name,b.intent.card,foe));
    if(!b.intent.reachable)enemyPanel.append(note('현재 사거리 밖'));
  }
  const nav=el('nav',undefined,{class:'battle-session-nav','aria-label':'전투 중 세션 메뉴'});
  nav.append(el('a','← 방으로',{href:'/room/'+code}));
  for(const [key,label] of [['character','캐릭터'],['cards','카드 · 덱']]){
    nav.append(button(label,()=>document.querySelector('#tabs [data-tab="'+key+'"]').click()));
  }
  board.append(fieldView.frame,topbar,nav,fieldView.tools,allyPanel,enemyPanel,forecast);
  const poisonAmount=u=>(u.poison||0)+(u.damageOverTime||[]).reduce((sum,dot)=>sum+dot.amount,0);
  const unitStats=el('div',undefined,{class:'stack'});
  for(const u of b.units){
    const chips=el('div',undefined,{class:'chips'});
    const tags=['체력 '+u.hp+'/'+u.maxHp];
    if(!u.enemy)tags.push('정신력 '+u.mind+' · 위력 '+signed(mentalPower(u.mind)),'행동량 '+(u.actionLimit??baseActions));
    if(u.coverCount)tags.push('원호 방어 '+u.coverCount);
    for(const name of u.passiveNames||[])tags.push('패시브 · '+name);
    if(u.lethalGuard)tags.push('치명상 방지 '+u.lethalGuard);
    if(u.lateDraw)tags.push('다음 라운드 추가 드로우 '+u.lateDraw);
    if(u.expose)tags.push('취약 '+u.expose);
    if(u.thorns)tags.push('반격 태세 '+u.thorns);
    if(u.rooted)tags.push('속박');
    if(u.temporaryShield)tags.push('이번 라운드 보호막 '+u.temporaryShield);
    if(poisonAmount(u))tags.push('지속 피해 '+poisonAmount(u));
    if(u.blockedRounds)tags.push('행동 불가 · '+u.blockedRounds+'라운드');
    if(u.actionPenalty)tags.push('행동량 −'+u.actionPenalty);
    if(u.regen)tags.push('지속 회복 '+u.regen);
    for(const [label,value,unit] of [
      ['입히는 피해',u.outgoingDamage,''],['입히는 피해',u.outgoingDamagePercent,'%'],
      ['받는 피해',u.incomingDamage,''],['받는 피해',u.incomingDamagePercent,'%']
    ])if(value)tags.push(label+' '+signed(value)+unit);
    tags.push(...combatStatusLabels(u));
    if(u.temptation)tags.push('유혹 '+u.temptation);
    if(u.awakening)tags.push('각성 · 위력 +'+awakeningPower);
    if(u.clashStreak)tags.push('합 연승 '+u.clashStreak);
    if(u.clashMemory)tags.push('다음 합 '+signed(u.clashMemory));
    if(u.delayedStrike?.length)tags.push('지연 타격 예약 '+u.delayedStrike.reduce((sum,entry)=>sum+entry.amount,0));
    if(u.damageDebt?.length)tags.push('유예 피해 '+u.damageDebt.reduce((total,entry)=>total+entry.amount,0));
    if(u.nextPowerPercent)tags.push('다음 판정 '+signed(u.nextPowerPercent)+'%');
    if(u.nextPower)tags.push('다음 판정 '+signed(u.nextPower));
    if(u.shield)tags.push('보호막 '+u.shield);
    if(u.collapsed||u.zero)tags.push(u.collapsed?'붕괴 · 개념화':u.zero==='crisis'?'붕괴 직전 · '+u.collapseRound+'라운드 종료':'폭주 위기');
    tags.push(...stackLabels(u));
    chips.append(...tags.map(t=>el('span',t)));
    unitStats.append(el('strong',u.name+(u.bot&&!u.enemy?' · 봇':'')),chips);
  }
  const log=el('ol',undefined,{class:'log'});
  log.append(...b.log.slice().reverse().map(t=>el('li',t)));
  const activity=battleDialog('전투 기록',log), participants=battleDialog('참가자 상태',unitStats);
  menuItems.append(button('전투 기록',()=>activity.showModal()),button('참가자 상태',()=>participants.showModal()));
  board.append(activity,participants);
  const inspect=u=>{
    const detail=el('div',undefined,{class:'stack'});
    const portrait=battleArt(u,u.pose||'idle');
    if(portrait)detail.append(el('img',undefined,{src:portrait,alt:u.name,class:'character-art-preview-image'}));
    detail.append(note('체력 '+u.hp+'/'+u.maxHp),...(!u.enemy?[note('정신력 '+u.mind+'/100 · 위력 '+signed(mentalPower(u.mind)))]:[]),note('보호막 '+u.shield));
    if(u.lethalGuard)detail.append(note('치명상 방지 '+u.lethalGuard));
    if(u.lateDraw)detail.append(note('다음 라운드 추가 드로우 '+u.lateDraw));
    if(u.expose)detail.append(note('취약 '+u.expose));
    if(u.thorns)detail.append(note('반격 태세 '+u.thorns));
    if(u.rooted)detail.append(note('속박'));
    if(u.temporaryShield)detail.append(note('이번 라운드 보호막 '+u.temporaryShield));
    if(poisonAmount(u))detail.append(note('지속 피해 '+poisonAmount(u)));
    if(u.blockedRounds)detail.append(note('행동 불가 · '+u.blockedRounds+'라운드'));
    if(u.actionPenalty)detail.append(note('행동량 −'+u.actionPenalty));
    if(u.regen)detail.append(note('지속 회복 '+u.regen));
    detail.append(...combatStatusLabels(u).map(note));
    if(u.temptation)detail.append(note('유혹 '+u.temptation+' · 종료 시 정신력 '+mentalCrisisThreshold+' 이하이고 유혹 '+temptationLimit+' 이상이면 정신력 −'+temptationStrain));
    if(u.awakening)detail.append(note('각성 · 판정 위력 +'+awakeningPower));
    if(u.clashStreak)detail.append(note('합 연승 '+u.clashStreak));
    if(u.clashMemory)detail.append(note('다음 합 '+signed(u.clashMemory)));
    if(u.delayedStrike?.length)detail.append(note('지연 타격 · '+u.delayedStrike.map(({round,amount})=>round+'라운드 종료 '+amount).join(' / ')));
    if(u.damageDebt?.length){
      const installments=new Map();
      for(const {round,amount} of u.damageDebt)installments.set(round,(installments.get(round)||0)+amount);
      detail.append(note('유예 피해 · '+[...installments].map(([round,amount])=>round+'라운드 종료 '+amount).join(' / ')));
    }
    if(u.nextPowerPercent)detail.append(note('다음 판정 '+signed(u.nextPowerPercent)+'%'));
    if(u.nextPower)detail.append(note('다음 판정 '+signed(u.nextPower)));
    if(u.coverCount)detail.append(note('원호 방어 '+u.coverCount));
    detail.append(...stackLabels(u).map(note));
    for(const [name,trait] of Object.entries(u.stackTraits||{})){
      if(!u.stacks[name])continue;
      if(trait.flavor)detail.append(flavorText(name+' · '+trait.flavor));
      for(const effect of trait.effects||[]){
        detail.append(note(name+' · '+effectTiming(effect)+' · '+effectSentence(effect)));
      }
    }
    const old=board.querySelector('.unit-inspection');
    old?.remove();
    const dialog=battleDialog(u.name,detail);
    dialog.classList.add('unit-inspection');
    board.append(dialog);dialog.showModal();
  };
  const unitAt=i=>b.units.find(u=>u.pos===i&&u.hp>0)||b.units.find(u=>u.pos===i);
  const dock=el('div',undefined,{class:'battle-dock'});
  const status=el('p','',{class:'battle-turn-status','aria-live':'polite'});
  dock.append(status,controls);
  board.append(dock);
  const lastRound=b.log.findLastIndex(line=>/^라운드 \d+ 처리$/.test(line));
  if(lastRound>=0){
    const latest=b.log.slice(lastRound);
    const result=el('div',undefined,{class:'battle-result-strip'});
    result.append(el('span',latest.at(-1)),button('전투 기록',()=>activity.showModal()));
    board.append(result);
  }
  if(b.poses?.length){
    const frames=b.poses.map(event=>{
      const unit=b.units.find(entry=>entry.id===event.id);
      return {unit,event,src:unit&&battleArt(unit,event.pose,event.form)};
    }).filter(frame=>frame.src);
    if(frames.length){
      const content=el('div',undefined,{class:'stack'}), visual=el('div',undefined,{class:'character-art-preview'});
      const caption=el('p',undefined,{'aria-live':'polite'});
      let index=0;
      const show=()=>{
        const {src,unit,event}=frames[index];
        const label=artPoseLabel(event.form,event.pose);
        visual.replaceChildren(el('img',undefined,{src,alt:unit.name+' '+label}));
        caption.textContent=(index+1)+'/'+frames.length+' · '+unit.name+' · '+artForms[event.form]+' · '+label;
      };
      content.append(visual,caption,button('다음 자세',()=>{index=(index+1)%frames.length;show();}));
      const replay=battleDialog('지난 라운드 연출',content);
      board.append(replay);
      menuItems.append(button('지난 라운드 연출',()=>{index=0;show();replay.showModal();}));
    }
  }
  if(!active){
    fieldView.tiles.forEach((tile,i)=>{const u=unitAt(i);tile.setAttribute('aria-disabled',String(!u));if(u)tile.onclick=()=>inspect(u);});
    status.textContent=b.phase==='finished'?'전투 '+b.result:self?.blockedRounds?'행동 불가 · 이번 라운드에는 이동하거나 행동할 수 없어요.':awaiting.length?'행동 확정 대기 · '+awaiting.join(', '):state.manager?'라운드를 진행할 수 있어요.':'GM이 라운드를 진행할 때까지 기다려 주세요.';
    return board;
  }
  const planned=self.plan;
  const draftKey=b.round+':'+self.id+(collapsed?':collapsed':crisis?':crisis':'');
  if(!battleDraft||battleDraft.key!==draftKey){
    battleDraft={key:draftKey,card:planned?.card??(planned?'':null),targetTile:planned?.targetTile??null,pos:planned?.pos??self.pos,targets:planned?.targets??[],clash:!!planned?.clash,discard:planned?.discard||'',copyId:planned?.copyId||'',vow:planned?.vow||self.crisisVow||''};
  }
  const editable=!self.ready;
  const actionLimit=self.actionLimit??baseActions;
  const slotCount=Math.max(1,actionLimit);
  const actionFields=({card=null,targets=[],clash=false,copyId='',targetTile=null}={})=>({card,targets,clash,copyId,targetTile});
  const draft=editable?battleDraft:{...planned};
  draft.slots??=(draft.cards||[draft]).map(actionFields);
  draft.slots.length=Math.min(draft.slots.length,slotCount);
  while(draft.slots.length<slotCount)draft.slots.push(actionFields());
  if(!actionLimit)Object.assign(draft,actionFields({card:''}));
  if(draft.slot==null||draft.slot>=slotCount){
    draft.slot=0;
    Object.assign(draft,actionLimit?draft.slots[0]:actionFields({card:''}));
  }
  const slotChoices=()=>draft.slots.map((slot,index)=>index===draft.slot?actionFields(draft):slot);
  const otherCards=()=>slotChoices().filter((_,i)=>i!==draft.slot);
  const queue=el('div',undefined,{class:'battle-action-queue','aria-label':'예약한 카드 순서'});
  const queueSlots=draft.slots.map((_,index)=>button('',()=>{
    draft.slots[draft.slot]=actionFields(draft);
    draft.slot=index;
    Object.assign(draft,draft.slots[index]);
    refresh();
  }));
  queue.append(...queueSlots);
  queue.hidden=actionLimit<=1;
  const canMove=pos=>paths.has(pos);
  let moveMode=false;
  const hand=el('fieldset',undefined,{class:'battle-hand'}), handRows=el('div',undefined,{class:'battle-card-fan'});
  hand.append(el('legend','손패 '+self.handCount+' · 덱 '+self.deckCount+' · 묘지 '+self.graveCount+' · 제외 '+self.exileCount),handRows);
  const realHand=self.hand.filter(card=>!card.temporary);
  const selection=[{id:'',name:'이동만 / 대기'},...self.hand.filter(card=>cardUsable(self,card)),...self.hand.filter(card=>!cardUsable(self,card))];
  for(const [index,card] of selection.entries()){
    const label=el('button',undefined,{type:'button',class:'battle-skill',disabled:!editable||!!card.id&&!cardUsable(self,card)});
    label.dataset.kind=card.role||'pass';
    label.dataset.card=card.id;
    const art=state.profile.cards.find(entry=>entry.id===card.id)?.image;
    label.onclick=()=>{
      const next=draft.card===card.id?null:card.id;
      Object.assign(draft,{card:next,targets:[],targetTile:null,clash:false,copyId:''});
      moveMode=false;
      if(draft.discard===next&&realHand.filter(c=>c.id===next).length<2)draft.discard='';
      refresh();
    };
    const head=el('span',card.role?roles[card.role]:'기본 행동',{class:'compact-card-header'});
    if(card.role)head.append(el('img',undefined,{src:battleIcon(card),alt:''}));
    label.append(head);
    if(card.requiredState&&card.requiredState!=='any')label.append(el('small',cardStates[card.requiredState]));
    if(art)label.append(el('img',undefined,{src:art,alt:'',class:'hand-art'}));
    label.append(el('strong',card.name,{class:'compact-card-name'}));
    if(self.cardMarks?.[card.id])label.append(el('small','피해 표식 '+self.cardMarks[card.id],{class:'tag'}));
    if(card.power)label.append(el('strong',cardHitPowers(card).length>1?cardHitPowers(card).length+'타':card.power,{class:'compact-card-power'}),el('span','사거리 '+gridCardRangeLabel(card)+' · '+(card.role==='guard'?'자동 합':card.role==='counter'?'자동 반격':card.clash&&card.role!=='assist'?'합 가능':'합 불가'),{class:'compact-card-meta'}));
    const direction=index-(selection.length-1)/2;
    label.style.setProperty('--fan-position',String(Math.max(-3,Math.min(3,direction))));
    label.style.setProperty('--fan-bend',String(Math.min(3,Math.abs(direction))));
    handRows.append(label);
  }
  const marker=el('span','이동 예정',{class:'battle-move-marker','aria-hidden':'true'});
  const setup=el('div',undefined,{class:'battle-selection'});
  const moveInfo=el('span');
  const tileMode=button('이동 칸 선택',()=>{moveMode=!moveMode;refresh();});
  const clash=input('clash','1','checkbox',{disabled:!editable});
  const clashLabel=field('예고 공격과 합',clash,'inline');
  const discard=select('discard',[['','없음'],...new Map(realHand.map(c=>[c.id,c.name]))],draft.discard||'');
  discard.disabled=!editable;
  const discardLabel=field('라운드 종료에 버릴 카드',discard,'battle-discard');
  const copy=select('copyId',[['','선택']],draft.copyId||'');
  copy.disabled=!editable;
  const copyLabel=field('복제할 손패 카드',copy,'battle-discard');
  const vow=select('crisisVow',[['','지킬 뜻을 선택하세요'],...Object.entries(crisisVows)],draft.vow||'');
  vow.disabled=!editable||!!self.crisisVow;
  const vowLabel=field('지킬 뜻',vow,'battle-discard');
  const vowInfo=el('p',undefined,{class:'battle-turn-status'});
  if(crisis||collapsed)dock.prepend(vowInfo);
  if(collapsed)vowInfo.textContent='붕괴 · 카드와 이동 위치를 선택할 수 있어요. 공격 표적은 피아 구분 없이 사거리 내에서 가까운 순서로 결정돼요.';
  vow.onchange=()=>{draft.vow=vow.value;refresh();};
  const commit=button('행동 확정',()=>{
    if(commit.disabled)return;
    send('plan',{vow:draft.vow,cards:slotChoices().filter(slot=>slot.card),pos:draft.pos,discard:draft.discard||null});
  },true);
  const cancel=button('선택 초기화',()=>{
    draft.slots=Array.from({length:slotCount},()=>actionFields());
    Object.assign(draft,actionFields({card:actionLimit?null:''}),{slot:0,pos:self.pos,discard:''});
    moveMode=false;
    refresh();
  });
  setup.append(moveInfo,tileMode,clashLabel,discardLabel,copyLabel);
  if(crisis)setup.prepend(vowLabel);
  dock.insertBefore(hand,controls);
  dock.insertBefore(setup,hand);
  dock.insertBefore(queue,setup);
  if(editable)controls.prepend(cancel,commit);
  else controls.prepend(button('확정 취소 · 수정',()=>send('unplan')));
  clash.onchange=()=>{draft.clash=clash.checked;refresh();};
  discard.onchange=()=>{draft.discard=discard.value;};
  copy.onchange=()=>{draft.copyId=copy.value;refresh();};

  function refresh(){
    const slots=slotChoices();
    const others=otherCards();
    const reserved=id=>others.filter(slot=>slot.card===id).length;
    const handCount=id=>self.hand.filter(card=>card.id===id).length;
    for(const control of handRows.children){
      const id=control.dataset.card,choice=self.hand.find(card=>card.id===id);
      control.setAttribute('aria-pressed',String(id===(editable?draft.card:draft.card||'')));
      control.disabled=!editable||!!id&&(!actionLimit||!cardUsable(self,choice)||reserved(id)>=handCount(id));
    }
    queueSlots.forEach((button,index)=>{
      const name=self.hand.find(card=>card.id===slots[index].card)?.name;
      button.textContent=(index+1)+'번 · '+(name||'비어 있음');
      button.setAttribute('aria-pressed',String(index===draft.slot));
    });
    const card=self.hand.find(c=>c.id===draft.card);
    const targetingTile=card?.target==='tile';
    tileMode.hidden=!editable||!targetingTile;
    tileMode.textContent=moveMode?'광역 중심 선택':'이동 칸 선택';
    const guarding=card?.role==='guard';
    const countering=card?.role==='counter';
    const requiresCopy=card?.effects.some(e=>e.kind==='copyChosen');
    copyLabel.hidden=!requiresCopy;
    if(requiresCopy){
      const spent=slots.slice(0,draft.slot+1);
      const choices=new Map(realHand.filter(c=>handCount(c.id)>spent.filter(slot=>slot.card===c.id).length).map(c=>[c.id,c.name]));
      copy.replaceChildren(el('option','선택',{value:''}),...[...choices].map(([id,name])=>el('option',name,{value:id})));
      copy.value=draft.copyId||'';
    }
    const pos=canMove(draft.pos)?draft.pos:self.pos;
    if(editable)draft.pos=pos;
    const targetPos=u=>u.id===self.id?pos:u.pos;
    const automatic=collapsed&&card&&!guarding&&!countering&&!targetingTile;
    const legalTile=(choice,tile)=>gridValid(tile)&&!b.walls.includes(tile)&&gridCardInRange(choice,pos,tile);
    const center=targetingTile&&legalTile(card,draft.targetTile)?draft.targetTile:null;
    const tileGroups=targetingTile?gridTileGroups(card,{...self,pos},center,b.units,b.walls):null;
    const candidatesFor=choice=>{
      if(!choice||choice.target==='tile'||choice.role==='counter')return [];
      if(collapsed&&choice.role!=='guard')return collapseTargets(choice,{...self,pos},b.units);
      return b.units.filter(u=>u.hp>0&&gridCardInRange(choice,pos,targetPos(u))&&
        (choice.role==='guard'?!u.enemy&&u.id!==self.id:choice.target==='self'?u.id===self.id:u.enemy));
    };
    const candidates=candidatesFor(card);
    const targetLimit=gridTargetLimit(card);
    const manual=!collapsed&&!targetingTile&&(guarding||targetLimit);
    const chosen=new Set(manual?draft.targets.filter(id=>guarding||candidates.some(u=>u.id===id)):collapsed&&guarding?[]:candidates.map(u=>u.id));
    const primary=targetingTile?tileGroups.primary:card?.splash&&candidates.find(u=>chosen.has(u.id));
    const secondary=targetingTile?tileGroups.secondary:gridSplashTargets(card,self,primary,b.units);
    const splashCenter=targetingTile?center:primary?.pos;
    const designated=guarding&&b.units.find(u=>chosen.has(u.id));
    const coverInRange=designated&&candidates.includes(designated);
    const clashTaken=others.some(slot=>slot.clash)||!!b.clashActor&&b.clashActor!==self.id;
    const incoming=b.intent?.reachable&&target&&foe&&gridCardInRange(b.intent.card,foe.pos,targetPos(target));
    const canClash=!collapsed&&card?.clash&&!['guard','assist','counter'].includes(card.role)&&incoming&&chosen.has(foe?.id)&&!clashTaken;
    if(editable){
      draft.targets=manual?[...chosen]:[];
      if(!canClash)draft.clash=false;
    }
    clashLabel.hidden=collapsed||!card?.clash||['guard','assist','counter'].includes(card.role);
    clashLabel.title=clashTaken?'다른 참가자가 이미 합을 확정했어요.':'합을 걸려면 적을 선택하세요.';
    clash.checked=!!draft.clash;
    clash.disabled=!editable||!canClash;
    const selected=slotChoices().filter(slot=>slot.card);
    for(const option of discard.options)option.disabled=!!option.value&&
      selected.filter(slot=>slot.card===option.value).length>=handCount(option.value);
    if([...discard.options].some(option=>option.value===draft.discard&&option.disabled))draft.discard='';
    discard.value=draft.discard||'';
    fieldView.overlay.replaceChildren();
    if(target&&foe&&gridCardInRange(b.intent.card,foe.pos,targetPos(target)))boardArrow(fieldView.overlay,foe.pos,targetPos(target),draft.clash?'clashing':'incoming');
    if(center!=null)boardArrow(fieldView.overlay,pos,center,'outgoing');
    for(const u of candidates)if(chosen.has(u.id))boardArrow(fieldView.overlay,pos,targetPos(u),draft.clash?'clashing':'outgoing');
    allyPanel.replaceChildren(...(card?[actionPanel(draft.clash?'내 합 카드':'내 행동',card,self,card.image)]:[]));
    forecast.textContent=draft.clash?'합 예고 · '+card.name+' ↔ '+b.intent.card.name:recentClash?'직전 '+recentClash:'';
    const path=paths.get(pos)||[],point=gridPoint(pos);
    if(path.length)fieldView.tiles[pos].append(marker);
    else marker.remove();
    moveInfo.textContent='이동 '+path.length+'/'+self.move+' · '+String.fromCharCode(65+point.x)+(point.y+1);
    const invalidSlot=slotChoices().findIndex((slot,index,choices)=>{
      if(!slot.card)return false;
      const choice=self.hand.find(card=>card.id===slot.card);
      if(!cardUsable(self,choice))return true;
      if(choices.filter(other=>other.card===slot.card).length>handCount(slot.card))return true;
      if(choice.effects.some(effect=>effect.kind==='copyChosen')&&
        (!slot.copyId||handCount(slot.copyId)<=choices.slice(0,index+1).filter(other=>other.card===slot.copyId).length))return true;
      if(choice.target==='tile')return !legalTile(choice,slot.targetTile);
      if(choice.role==='counter')return false;
      const legal=candidatesFor(choice);
      if(choice.role==='guard')return slot.targets.some(id=>!legal.some(u=>u.id===id));
      if(!legal.length)return true;
      if(!collapsed&&gridTargetLimit(choice)){
        if(!slot.targets.length||slot.targets.some(id=>!legal.some(u=>u.id===id)))return true;
      }
      return slot.clash&&(!incoming||clashTaken&&index===draft.slot);
    });
    const ready=invalidSlot<0&&(!actionLimit||selected.length>0||slotChoices().some(slot=>slot.card===''));
    commit.disabled=!ready||crisis&&!draft.vow;
    if(crisis)vowInfo.textContent='붕괴 직전 · 연속 '+(self.crisisProofs||0)+'/'+crisisRounds+' · '+self.collapseRound+'라운드 종료까지 · '+(crisisVowRules[draft.vow]||'세 라운드 연속 같은 뜻을 지키세요.');
    const names=countering?'반격 대기':guarding?(designated?.name||'자동 엄호'):candidates.filter(u=>chosen.has(u.id)).map(u=>u.name).join(', ');
    if(!editable)status.textContent='행동 확정 · '+(selected.map(slot=>self.hand.find(card=>card.id===slot.card)?.name).filter(Boolean).join(' → ')||'이동만 / 대기')+(awaiting.length?' · 대기 '+awaiting.length+'명':' · 라운드 진행 대기');
    else if(invalidSlot>=0&&invalidSlot!==draft.slot)status.textContent=(invalidSlot+1)+'번 카드의 대상 또는 선택을 확인하세요.';
    else if(draft.card===null)status.textContent='손패에서 카드를 고르세요. 이동할 칸도 선택할 수 있어요.';
    else if(!actionLimit)status.textContent='행동량 0 · 카드를 사용할 수 없어요. 이동하거나 대기하세요.';
    else if(!card)status.textContent='이동할 칸을 선택하거나 현재 위치에서 대기하세요.';
    else if(requiresCopy&&!copy.value)status.textContent=copy.options.length>1?'손패에서 복제할 카드를 고르세요.':'복제할 다른 카드가 손패에 없어요.';
    else if(guarding)status.textContent=designated
      ?'지정 엄호 · '+designated.name+(coverInRange?' · 다시 누르면 자동 엄호':' · 사거리 밖 · 이동하거나 대상을 다시 눌러 해제하세요.')
      :'자동 엄호 · 아군을 눌러 지정하거나 그대로 확정하세요.';
    else if(countering)status.textContent=counterHelp;
    else if(targetingTile)status.textContent=moveMode?'이동할 칸을 누르세요.':
      center==null?'기본 사거리 안에서 광역 중심 칸을 선택하세요. 빈 칸도 선택할 수 있어요.':
        '광역 중심 '+(primary?.name||'빈 칸')+(secondary.length?' · 예상 부 대상 '+secondary.map(unit=>unit.name).join(', '):' · 예상 부 대상 없음');
    else if(card.splash)status.textContent=primary
      ?'주 대상 '+primary.name+(secondary.length?' · 예상 부 대상 '+secondary.map(unit=>unit.name).join(', '):' · 범위 안에 부 대상 없음')
      :candidates.length?'맵에서 주 대상을 한 명 선택하세요.':'사거리 안에 주 대상이 없어요.';
    else if(automatic&&candidates.length)status.textContent=card.target==='self'?'자신에게 사용':'예상 자동 표적 · '+names+' · 행동 시 다시 계산';
    else if(!candidates.length)status.textContent='사거리 안에 대상이 없어요. 이동할 칸이나 카드를 바꿔 보세요.';
    else if(manual)status.textContent=chosen.size?'대상 '+chosen.size+'/'+card.target+' · '+names:'맵에서 대상을 선택하세요. 최대 '+card.target+'명';
    else status.textContent=(card.target==='area'?'광역 대상 · ':'자신에게 사용 · ')+names;

    fieldView.tiles.forEach((tile,i)=>{
      const targetUnit=manual?(candidates.find(u=>targetPos(u)===i)||(designated?.pos===i?designated:null)):null;
      const canAimTile=editable&&targetingTile&&!moveMode&&legalTile(card,i);
      const isChosen=targetingTile?center===i:guarding?designated?.pos===i:candidates.some(u=>targetPos(u)===i&&chosen.has(u.id));
      const inspected=unitAt(i);
      tile.classList.toggle('reachable',editable&&canMove(i));
      tile.classList.toggle('in-range',!!card&&gridCardInRange(card,pos,i)&&!b.walls.includes(i));
      tile.classList.toggle('path-cell',path.includes(i));
      tile.classList.toggle('picked',i===pos);
      tile.classList.toggle('targetable',canAimTile||editable&&!!targetUnit);
      tile.classList.toggle('tile-center',targetingTile&&isChosen);
      tile.classList.toggle('aimed',isChosen);
      const splashTile=splashCenter!=null&&i!==splashCenter&&gridCardInRange(card.splash,splashCenter,i)&&!b.walls.includes(i);
      const secondaryTarget=secondary.some(u=>u.pos===i);
      tile.classList.toggle('splash-range',splashTile);
      tile.classList.toggle('splash-target',secondaryTarget);
      tile.setAttribute('aria-disabled',String(!inspected&&(!editable||(!(targetingTile&&!moveMode?canAimTile:canMove(i))&&!targetUnit))));
      const position=gridPoint(i),coord=String.fromCharCode(65+position.x)+(position.y+1);
      const occupant=targetUnit||inspected;
      tile.setAttribute('aria-label',coord+(occupant?' · '+occupant.name:'')+(isChosen?(targetingTile?' · 광역 중심':primary?' · 주 대상':automatic?' · 예상 자동 표적':' · 선택된 대상'):secondaryTarget?' · 예상 부 대상':canAimTile?' · 광역 중심 지정 가능':targetUnit?' · 대상 지정 가능':editable&&canMove(i)?' · 이동 가능':''));
      tile.onclick=()=>{
        if(canAimTile){
          draft.targetTile=center===i?null:i;refresh();return;
        }
        if(editable&&targetUnit){
          if(chosen.has(targetUnit.id))chosen.delete(targetUnit.id);
          else if(guarding||targetLimit===1){chosen.clear();chosen.add(targetUnit.id);}
          else if(chosen.size<targetLimit)chosen.add(targetUnit.id);
          else {status.textContent='최대 '+targetLimit+'명까지 선택할 수 있어요. 선택한 대상을 다시 누르면 해제돼요.';return;}
          draft.targets=[...chosen];refresh();return;
        }
        if(editable&&(!targetingTile||moveMode)&&canMove(i)){draft.pos=i;moveMode=false;refresh();return;}
        if(inspected)inspect(inspected);
      };
    });
  }
  refresh();
  return board;
}
const cardListPositions=new Map();
function battleEditControls(){
  const pending=state.pendingEdits||[];
  const own=state.battle.units.find(unit=>unit.id===state.me);
  if(!own?.hp&&(!state.manager||!pending.length))return null;
  const box=section('전투 중 변경',note('캐릭터·카드·덱을 저장한 뒤 적용을 요청하세요. GM이 승인하면 현재 전투에 반영돼요.'));
  box.classList.add('battle-edits');
  if(own?.hp&&tab!=='battle')box.append(button(pending.some(edit=>edit.actor===state.me)?
    '변경 적용 요청 갱신':'GM에게 변경 적용 요청',()=>send('requestEdit')));
  if(state.manager)for(const edit of pending){
    const row=el('div',undefined,{class:'stack'});
    row.append(el('strong',edit.name+'의 적용 요청'),note('덱 '+edit.cardNames.join(', ')+' · 패시브 '+(edit.passiveNames.join(', ')||'없음')));
    const actions=el('div',undefined,{class:'row'});
    actions.append(button('승인하고 즉시 적용',()=>send('reviewEdit',{id:edit.id,approve:true}),true),
      button('반려',()=>send('reviewEdit',{id:edit.id,approve:false})));
    row.append(actions);box.append(row);
  }
  return tab==='battle'&&(!state.manager||!pending.length)?null:box;
}
function render(){
  if(!state)return;
  for(const list of panel.querySelectorAll('.card-list-scroll'))cardListPositions.set(list.ariaLabel,list.scrollTop);
  panel.closest('main').classList.toggle('card-studio-page',tab==='cards');
  for(const x of document.querySelectorAll('#tabs button'))x.setAttribute('aria-pressed',String(x.dataset.tab===tab));
  panel.replaceChildren(tab==='battle'?battlePanel():tab==='character'?character():cards());
  if(!studio&&state.battle?.phase==='planning'){
    const editControls=battleEditControls();
    if(editControls)panel.prepend(editControls);
  }
  for(const list of panel.querySelectorAll('.card-list-scroll'))list.scrollTop=cardListPositions.get(list.ariaLabel)||0;
}
for(const x of document.querySelectorAll('#tabs button'))x.onclick=()=>{tab=x.dataset.tab;draftDirty=false;errors.textContent='';feedback.textContent='';render();};
try{
  state=await request();render();
  setInterval(async()=>{
    if(busy||document.hidden)return;
    const before=state;
    try{
      const next=await request();
      if(busy||state!==before)return;
      if(next.revision!==state.revision||next.collectionRevision!==state.collectionRevision||next.manager!==state.manager||JSON.stringify(next.roster)!==JSON.stringify(state.roster)){
        const newRound=next.battle?.round!==state.battle?.round||next.battle?.phase!==state.battle?.phase;
        state=next;
        if(newRound)battleDraft=null;
        if(tab==='battle'||!draftDirty){draftDirty=false;render();}
      }
    }catch{}
  },2300);
}catch(err){
  errors.textContent=err.message;
  panel.replaceChildren(studio?accountPanel():el('a','방으로 돌아가기',{href:'/room/'+code}));
}
