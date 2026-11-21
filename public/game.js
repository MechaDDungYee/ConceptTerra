import {battleMusicSettings,closeBattleMusicSettings,syncBattleMusic} from './battle-music.js';
import {blockWorkspace,describeFlow,describeValue} from './blocks.js';
import {bindBattleBoardControls} from './battle-camera.js';
import {accountPanel} from './account.js';
import {gridCanAimTile,gridSize,gridValid,gridTileGroups,gridPoint,gridPaths,gridLineOfSight,gridCardInRange,gridCardHasReach,gridCardRangeLabel,gridTargetLimit,gridSplashTargets,gridShapeAt,rangeShapes,maxRangeX,maxRangeY,customRangeRadius,maxRangeRadius,gridRangeAt,collapseTargets} from './grid.js';
import {instantMoveModes,instantMoveDirections,instantMoveOffsets,instantMoveAnchors,instantMoveOrders,instantMoveStackTests,instantMoveStackMetrics,maxPortraitDataLength,maxPortraitSide,keywordOwnedZones,keywordScanModes,stackScanScopes,maxConceptTools,stackGainLimits,stackGainLimitMax,durationPolicies,durationPolicyKinds,maxDurationCap,shieldGrantEffects,shieldStackModes,locationTagGroups,characterCombatStats,lifeStealDamageTypes,lifeStealVictims,lifeStealHealers,lifeStealDamageResources,lifeStealBases,lifeStealShieldModes,lifeStealRecoveryResources,shieldConversionOutputs,damageConversionFormulaModes,damageConversionUnits,stackRatioBases,stackRatioEffects,conceptStacks,basicStacks,planningTimings,cardZoneTimings,zoneCardFilters,zoneOwnerFilters,legacyCriticalStackEffects,heldStackEffectKinds,hitTargetModes,legacyHitEvents,maxStackNameLength,effectStackNames,effectCardReferences,replacementConditions,maxPassives,maxPassiveEffects,passiveRoundTimings,passiveEffectKinds,passiveTimingsFor,baseActions,maxActions,statuses,effects,newEffects,effectSettings,temptationLimit,temptationStrain,mentalCrisisThreshold,awakeningPower,crisisRecovery,signedEffects,percentageDefaults,ratioEffects,effectRatioBases,configurableRatioEffects,ratioBasisAvailable,maxStatusRounds,healthBases,healthRatioEffects,maxDeferralRounds,applyPowerRatio,effectRecipients,diceConditions,diceConditionTimings,maxDiceTotal,effectConditions,flagConditions,maxStatusStacks,maxStackPotency,stackPotency,maxCollectiveStackConsume,stackGrantEffects,stackConsumeAmounts,stackConsumeScopes,stackConsumePriorities,taggedEffects,unnumberedEffects,discardCosts,resourceCosts,resourceScales,teamEffects,copyEffects,stagedPowerEffects,stagedPowerTimings,amplifyHitTargets,effectLimitPeriods,maxEffectActivations,timings,maxCardHits,maxCardEffects,hitEffectTimings,cardHitPowers,maxOverloadCost,defaultOverloadCost,roles,cardStates,crisisRounds,crisisVows,crisisVowRules,artForms,artPoses,artPoseLabel,cardUsable,deckSize,deckCopyLimit,cardFileFormat,passiveFileFormat,stackFileFormat,characterFileFormat,maxCardFileBytes,mentalPower,parsePower} from './rules.js';
const panel=document.querySelector('#panel'), errors=document.querySelector('#error'), feedback=document.querySelector('#feedback');
const studio=location.pathname==='/studio';
const code=location.pathname.split('/')[2], endpoint=studio?'/api/studio':'/api/rooms/'+code+'/game';
document.querySelector('#back').href=studio?'/':'/room/'+code;
if(studio){
  document.querySelector('#back').textContent='← 로비로';
  document.querySelector('[data-tab="battle"]').remove();
  document.querySelector('[data-tab="dialogue"]').remove();
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
  form.onsubmit=async e=>{if(e.defaultPrevented)return;e.preventDefault();try{await send(action,await read(form,new FormData(form)));}catch(err){errors.textContent=err.message;}};
  form.addEventListener('input',()=>{draftDirty=true;});
  return form;
}
function submit(text){return el('button',text,{class:'primary'});}
async function request(body){
  const large=['art','dialogueEnemyArt','cardImport','stackImport','passiveImport','characterImport','importSave'].includes(body?.action);
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
    const submitAction=()=>request({action,revision:state.revision,collectionRevision:state.collectionRevision,...payload});
    try{state=await submitAction();}
    catch(error){
      if(action!=='dialogue'||error.status!==409)throw error;
      state=await request();
      state=await submitAction();
    }
    if(['stackCreate','stackEdit','stackImport'].includes(action)){
      updateStackControls();
      feedback.textContent=action==='stackCreate'?'중첩을 만들었어요.':action==='stackImport'?'파일의 중첩을 보관함에 가져왔어요.':'중첩 효과를 저장했어요.';
      return true;
    }
    if(action==='card'||action==='cardDelete'&&payload.id===edit)edit=null;
    if(action==='cardClone')edit=state.editedCardId;
    if(['conceptTool','conceptToolDelete','characterImport','characterAccountSelect'].includes(action))conceptToolEdit=null;
    if(['passive','passiveDelete','passiveTake','passiveClone','passiveImport','characterImport','characterAccountSelect'].includes(action))passiveEdit=null;

    if(['plan','start','round','reset','loadSlot','importSave','loopRevert'].includes(action))battleDraft=null;
    if(released)battleDraft={...released,key:state.battle.round+':'+state.me+(releasedUnit.collapsed?':collapsed':releasedUnit.zero==='crisis'?':crisis':''),card:released.card||'',discard:released.discard||''};
    if(action==='dialogue'&&tab==='battle'&&battleDialogue?.root.isConnected)battleDialoguePanel();
    else{
      if(action!=='dialogue')draftDirty=false;
      render();
    }
    if(action==='cardClone')panel.querySelector('input[name="name"]')?.focus();
    feedback.textContent=action==='round'?'':({plan:'행동을 확정했어요.',unplan:'행동을 수정할 수 있어요.',card:'카드 보관함에 저장했어요.',deck:'전투 덱을 저장했어요.',cardClone:'카드 사본을 만들었어요.',cardDelete:'카드를 삭제했어요.',cardShare:'이 방에 카드를 공유했어요.',cardUnshare:'공유를 해제했어요.',cardTake:'공유 카드를 보관함에 가져왔어요.',cardImport:'파일의 카드를 보관함에 가져왔어요.',passive:'패시브를 저장했어요.',passiveClone:'패시브 사본을 만들었어요.',passiveShare:'이 방에 패시브를 공유했어요.',passiveUnshare:'패시브 공유를 해제했어요.',passiveTake:'패시브를 가져왔어요. 장착하면 전투에서 발동해요.',
      characterAccountSave:'계정에 캐릭터를 저장했어요.',characterAccountSelect:'캐릭터를 불러왔어요.',requestEdit:'GM에게 변경 적용을 요청했어요.'}[action]||'반영했어요.');
    return true;
  }catch(err){
    errors.textContent=err.message;
    if(err.status===409){state=await request().catch(()=>state);if(['stackCreate','stackEdit','stackImport'].includes(action))updateStackControls();else if(!draftDirty||tab==='battle')render();}
  }finally{busy=false;}
}
const selectSearches=new WeakMap();
function searchableSelect(label,control){
  const box=el('div',undefined,{class:'stack searchable-effect-select'});
  const search=input(undefined,'','search',{placeholder:label+' 검색','aria-label':label+' 검색'});
  const key=text=>text.normalize('NFKC').toLocaleLowerCase().replace(/\s/g,'');
  let options=[...control.options];
  const filter=()=>{
    const selected=control.value;
    const query=key(search.value);
    control.replaceChildren(...options.filter(option=>!option.value||option.value===selected||key(option.textContent).includes(query)));
    control.value=selected;
  };
  search.addEventListener('input',event=>{event.stopPropagation();filter();});
  search.onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();control.focus();}};
  selectSearches.set(control,()=>{options=[...control.options];filter();});
  box.append(search,field(label,control));
  return box;
}
function fillStackSelect(control,value){
  const names=new Set([...Object.keys(basicStacks),...Object.keys(conceptStacks),...(state.profile.customStacks||[]),...(state.profile.stackNames||[])]);
  if(value)names.add(value);
  control.replaceChildren(el('option','중첩 선택',{value:''}),
    ...[...names].map(name=>el('option',Object.hasOwn(basicStacks,name)?name+(basicStacks[name].sub?' · 기본 부 키워드':' · 기본'):Object.hasOwn(conceptStacks,name)?name+' · 개념물':name,{value:name})));
  control.value=value||'';
  selectSearches.get(control)?.();
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
  for(const control of panel.querySelectorAll('[data-download-stacks]'))control.disabled=!state.profile.customStacks?.length;
}
function fillStackTraitSelect(control){
  const value=control.value;
  control.replaceChildren(el('option','효과를 편집할 중첩 선택',{value:''}),
    ...(state.profile.customStacks||[]).map(name=>el('option',name,{value:name})));
  control.value=value;
}
function stackGainFields(values={}){
  const limits=el('details',undefined,{class:'stack-gain-limits'});
  limits.append(el('summary','중첩 획득 한도'),note('총 위력과 횟수를 따로 제한해요. 빈 칸은 제한 없음을 뜻해요.'));
  for(const [key,[label]] of Object.entries(stackGainLimits)){
    limits.append(field(label,input(key,values[key]??'','number',{min:1,max:stackGainLimitMax(key),placeholder:'제한 없음'})));
  }
  return limits;
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
    const limits=stackGainFields(trait?.gainLimits);
    const axesMode=select('stackAxesMode',[['both','위력과 횟수'],['power','위력만'],['count','횟수만']],trait?.stackAxesMode||'both');
    const holdCount=input('holdCount',trait?.holdCount??'','number',{min:1,max:maxStatusStacks,placeholder:'기본 한도'});
    const holdPower=input('holdPower',trait?.holdPower??'','number',{min:1,max:maxStatusStacks*maxStackPotency,placeholder:'제한 없음'});
    const flavor=area('stackFlavor',trait?.flavor||'',300);
    flavor.oninput=()=>{draftDirty=true;};
    traitForm.append(
      note('‘보유 시’ 효과는 중첩이 있는 동안 적용되고, 중첩이 사라지면 해제돼요. 설정은 다음 전투부터 반영돼요.'),
      field('중첩 플레이버 텍스트',flavor),
      field('사용할 중첩 수치',axesMode),field('최대 보유 위력 합계',holdPower),field('최대 보유 횟수',holdCount),
      note('보유 중인 중첩의 위력 합계와 횟수를 제한해요. 소모하면 보유 한도에 다시 여유가 생겨요.'),
      limits,workspace.node,submit('중첩 저장'));
    traitForm.onsubmit=async event=>{
      event.preventDefault();
      if(await send('stackEdit',{name:chosen,flavor:flavor.value,
        stackAxesMode:axesMode.value,holdCount:holdCount.value===''?null:Number(holdCount.value),holdPower:holdPower.value===''?null:Number(holdPower.value),
        gainLimits:Object.fromEntries(
        [...limits.querySelectorAll('input')].filter(control=>control.value!=='').map(control=>[control.name,Number(control.value)])),effects:workspace.rows()}))draftDirty=false;
    };
    editor.append(button('선택한 중첩 다운로드',()=>downloadCharacterFile('stack',chosen)),traitForm);
  };
  const catalogue=el('details',undefined,{class:'stack'});
  catalogue.append(el('summary','기본 키워드와 부 키워드'));
  for(const [name,trait] of Object.entries(basicStacks)){
    const entry=el('details');
    entry.append(el('summary',name+(trait.sub?' · 부 키워드':'')),...basicStackInfo(trait).map(note));
    catalogue.append(entry);
  }
  root.append(el('summary','중첩 관리'),form,characterFileControls('stack',false,!names.length),list,picker,editor,catalogue);
  return root;
}
function character(){
  const p=state.profile;
  const form=formFor('profile',(_,data)=>({...Object.fromEntries(data),activityLocations:data.getAll('activityLocations'),stats:statNames.map((_,i)=>Number(data.get('stat'+i)))}));
  const status=select('status',opts(statuses),p.status);
  const wall=field('살아온 장벽',select('wall',opts(countryNames.slice(4,9)),p.wall||'제4국'));
  const check=()=>{wall.hidden=status.value!=='월정커';wall.style.display=wall.hidden?'none':'';};
  status.onchange=check;check();
  form.append(field('캐릭터 이름',input('name',p.name,'text',{required:true,maxlength:36})),field('출신국',select('country',opts(countryNames),p.country)),field('시작 신분',status),wall,
    field('직업 / 소속',input('job',p.job,'text',{maxlength:36,placeholder:'회수원, 군인, 해결사…'})),
    field('개념 능력 / 의체',area('concept',p.concept,180),'full'),field('개인 목적',area('goal',p.goal,180),'full'));
  const stats=el('fieldset',undefined,{class:'full'}), list=el('div',undefined,{class:'stats'});
  const legend=el('legend'),hp=el('output');
  const total=()=>{
    const values=[...list.querySelectorAll('input')].map(x=>Number(x.value));
    legend.textContent='능력치 '+values.reduce((sum,value)=>sum+value,0)+' / 300';
    const combat=characterCombatStats(values);
    hp.textContent='최대 체력 '+combat.maxHp+' · 이동력 '+combat.movement+' · 턴당 행동 '+combat.actions+
      ' · 공격 위력 '+signed(combat.attackPower)+' · 손패 보충 목표 '+combat.handSize+
      ' · 치명타 확률 +'+combat.critChance+'%p · 정신 피해 저항 '+combat.mindGuard+'%';
  };
  statNames.forEach((name,i)=>list.append(field(name,input('stat'+i,p.stats[i],'number',{min:0,max:100,required:true}))));
  list.addEventListener('input',total);total();

  const locations=el('fieldset',undefined,{class:'full activity-locations'});
  const locationCount=el('legend','활동지');
  locations.append(locationCount);
  for(const [label,tags] of Object.entries(locationTagGroups)){
    const group=el('fieldset');
    group.append(el('legend',label));
    for(const tag of tags){
      group.append(field(tag,input('activityLocations',tag,'checkbox',{checked:(p.activityLocations||[]).includes(tag)}),'inline'));
    }
    locations.append(group);
  }
  const updateLocations=()=>{
    const selected=locations.querySelectorAll('input:checked');
    locationCount.textContent='활동지 · '+selected.length+'곳 선택';
  };
  locations.addEventListener('change',updateLocations);
  updateLocations();
  stats.append(legend,list,hp);form.append(locations,stats,submit('캐릭터 저장'));
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
  sheet.append(files,characterPassives(p),characterConceptTools(p),art);
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

let conceptToolEdit=null;
function characterConceptTools(profile){
  const list=profile.conceptTools||[];
  const existing=list.find(tool=>tool.id===conceptToolEdit);
  const open=id=>{conceptToolEdit=id;draftDirty=false;render();};
  const root=section('개념 도구',note('아이템과 장신구의 효과를 블록으로 만들고 장착하세요. 장착한 도구는 전투 중 해당 이벤트에서 자동으로 발동합니다.'));
  root.classList.add('full','character-passives');
  if(state.battle?.phase==='planning'&&state.battle.units.some(unit=>unit.id===state.me))
    root.append(note('전투 중 장착이나 해제를 적용하려면 GM에게 변경을 요청하세요.'));
  if(!list.length)root.append(note('아직 만든 개념 도구가 없어요.'));
  for(const tool of list){
    const card=el('article',undefined,{class:'passive-entry stack'});
    const title=el('div',undefined,{class:'row'});
    title.append(el('strong',tool.name),el('span',tool.enabled?'장착 중':'미장착',{class:'tag'}));
    card.append(title);
    if(tool.notes)card.append(note(tool.notes));
    if(tool.flavor)card.append(flavorText(tool.flavor));
    for(const effect of tool.effects)card.append(note(effectConditionText(effect)+effectTiming(effect)+' · '+effectSentence(effect)));
    const actions=el('div',undefined,{class:'row'});
    actions.append(button('편집',()=>open(tool.id)),button(tool.enabled?'해제':'장착',()=>send('conceptToolToggle',{id:tool.id})),
      button('삭제',()=>{if(confirm('「'+tool.name+'」 도구를 삭제할까요?'))send('conceptToolDelete',{id:tool.id});}));
    card.append(actions);
    root.append(card);
  }
  if(list.length>=maxConceptTools&&!existing)return root;
  const save=submit(existing?'도구 변경 저장':'개념 도구 만들기');
  const workspace=effectWorkspace(existing?.effects||[],{passive:true,onChange:()=>{
    save.disabled=!workspace.rows().length;
    draftDirty=true;
  }});
  const form=formFor('conceptTool',(_,data)=>({tool:{
    id:existing?.id,name:data.get('name'),notes:data.get('notes'),flavor:data.get('flavor'),enabled:data.has('enabled'),effects:workspace.rows()
  }}));
  form.append(el('h3',existing?'개념 도구 편집':'새 개념 도구',{class:'full'}),
    field('도구 이름',input('name',existing?.name||'','text',{required:true,maxlength:36})),
    field('저장하고 장착',input('enabled','1','checkbox',{checked:existing?.enabled??false}),'inline'),
    field('도구 설명',area('notes',existing?.notes||'',300),'full'),
    field('플레이버 텍스트',area('flavor',existing?.flavor||'',300),'full'),
    workspace.node,save);
  if(existing)form.append(button('편집 취소',()=>open(null)));
  save.disabled=!workspace.rows().length;
  root.append(form);
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
    try{await send('art',{slot:form.value+'.'+pose.value,image:await imageData(file.files[0],maxPortraitDataLength,maxPortraitSide,.86)});}
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
  return Object.entries(unit.stacks).filter(([tag,count])=>count>0||stackPotency(unit,tag)>0).map(([tag,count])=>{
    const power=stackPotency(unit,tag);
    const mode=unit.stackTraits?.[tag]?.stackAxesMode;
    return tag+(mode==='count'?'':' · 총 위력 '+power)+(mode==='power'?'':' · '+count+'회');
  });
}
function combatStatusLabels(unit){
  const labels=[];
  for(const rule of unit.damageConversions||[]){
    labels.push((rule.shield?'방어막 흡수량 변환':'생명력 흡수')+' · '+(rule.through?rule.through+'라운드까지':'전투 종료까지'));
  }
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
  '공격과 합':['basePower','finalPower','damage','percent','fixedDamage','pierce','piercingFixedDamage','stripShield','drainLife','lifeSteal','shieldConversion','recoil','power','focus','weaken','expose','thorns','guardBreak','riposte','shieldPower','gravePower'],
  '방어와 회복':['dodge','stackWard','healCut','hitLeech','shield','reduce','fortify','heal','healPercent','healMissing','regen','clearStatus','temporaryShield','stealShield','shieldGift','allyHeal','lethalGuard','graveToShield'],
  '이동과 위치':['push','pull','move','movement','nextMove','nextSlow','retreat','swapPosition','rootNext','provoke','evadeStep'],
  '중첩과 정신력':['stack','consume','remove','perStack','doubleStack','stealStack','consumeHeal','stackDamage','poison','mind','drain','mindTransfer','cleanseStacks','shieldPerStack','recoverMindFloor','purgePoison','detonatePoison'],
  '손패 대가와 복제':['giveCard','replaceCard','discardAllCost','discardExactCost','copySelf','copyFixed','copyChosen'],
  '카드와 덱':['draw','discard','recover','return','exile','replay','cycle','mill','recoverDeck','reclaim','topdeck','bottomdeck','shuffleDeck','buryHand','exileGrave','drawTo','lateDraw','recycleExile']
};
const suggestedTiming={draw:'use',discard:'use',recover:'use',power:'clash',percent:'wall',perStack:'consume',exile:'end',return:'end'};
const selfEffects=new Set(['draw','discard','recover','return','exile','replay','power','move','movement','nextMove','mind','lifeSteal','shieldConversion']);
function effectCards(extra=[]){
  return [...state.defaults,...state.profile.cards,...(state.profile.passiveCards||[]),...extra];
}
function basicStackInfo(trait){
  return [
    ...(trait.description?[trait.description]:[]),
    ...(trait.effects||[]).map(stackEffectText),
    ...(trait.cap&&!trait.description?.includes('최대')?['최대 '+trait.cap+'회 보유']:[]),
    ...(trait.endDecay?['턴 종료 효과 처리 후 · 보유 횟수 '+trait.endDecay+' 감소']:[])
  ];
}
function stackEffectText(effect){
  if(effect.when==='held'&&effect.kind==='shieldConversion'){
    return '보유 시 · 자신의 방어막이 막은 피해의 중첩당 '+effect.amount+'%를 '+shieldConversionOutputs[effect.leechRecovery]+'으로 변환';
  }
  if(effect.when==='held'&&effect.kind==='lifeSteal'){
    return '보유 시 · 자신이 입힌 '+lifeStealDamageTypes[effect.leechDamage]+'의 중첩당 '+effect.amount+'%만큼 '+lifeStealRecoveryResources[effect.leechRecovery]+' 회복';
  }
  return effectTiming(effect)+' · '+effectSentence(effect)+(effect.scaleStack==='count'?' · 보유 중첩 수를 곱함':'');
}
function effectSentence(e,extra=[]){
  if(e.publicLabel)return e.publicLabel;
  if(e.kind==='replaceCard'){
    const cards=effectCards(extra);
    const replacement=cards.find(card=>card.id===e.replacementId);
    const source=cards.find(card=>card.id===e.fromCardId);
    return (source?'「'+source.name+'」 사용 시 ':'')+'「'+(replacement?.name||'지정 카드')+'」로 발동'+
      (e.to==='target'?' · 원래 대상 기준':'')+(e.limit?' · '+effectLimitPeriods[e.limit.period]+' '+e.limit.count+'회':'');
  }
  const expression=e.amountExpr?describeValue(e.amountExpr):null;
  if(e.kind==='move'&&e.moveMode&&e.moveMode!=='approach'){
    const amount=expression||e.amount;
    if(e.moveMode==='choose')return '즉시 이동력 '+amount+' 획득 · 칸 직접 선택';
    if(e.moveMode==='direction')return instantMoveDirections[e.moveDirection]+'쪽으로 최대 '+amount+'칸 즉시 이동';
    const filter=e.moveTest&&e.moveTest!=='any'
      ?' · '+e.moveTag+' '+(['inside','outside'].includes(e.moveTest)
        ?(instantMoveStackMetrics[e.moveMetric]||'횟수')+' '+e.moveMin+'~'+e.moveMax+' '+instantMoveStackTests[e.moveTest]
        :instantMoveStackTests[e.moveTest]):'';
    return (instantMoveAnchors[e.moveAnchor]||'적')+' · '+(instantMoveOrders[e.moveOrder]||'가장 가까운 대상')+filter+
      ' · '+(instantMoveOffsets[e.moveOffset]||'대상 뒤')+' '+amount+'칸으로 이동';
  }
  if(e.kind==='giveCard'){
    const card=effectCards(extra).find(card=>card.id===e.givenCardId);
    return (effectRecipients[e.to]||'자신')+'에게 「'+(card?.name||'지정 카드')+'」 '+(expression||e.amount)+'장 지급'+(e.limit?' · '+effectLimitPeriods[e.limit.period]+' '+e.limit.count+'회':'');
  }
  const target=e.to==='keywordHolders'?(e.recipientKeyword?.scope==='named'?e.recipientKeyword.names:stackScanScopes[e.recipientKeyword?.scope||'allies'])+' 중 '+(e.recipientKeyword?.tag||'키워드')+' 카드 보유자':e.to==='target'?(cardZoneTimings.includes(e.when)?'이동한 카드의 주인':'대상'):effectRecipients[e.to];
  const number=expression||(['awakenBody','inscribeMeaning'].includes(e.kind)&&e.perStack?e.amount*e.perStack:e.amount||1);
  if(['lifeSteal','shieldConversion'].includes(e.kind)){
    const shield=e.kind==='shieldConversion';
    const heal=lifeStealHealers[e.leechHeal]||effectRecipients[e.leechHeal]||lifeStealHealers.dealer;
    const victim=e.leechVictim==='named'?e.leechVictimName:lifeStealVictims[e.leechVictim||'enemy'];
    const value=(key,fallback)=>e.numberExprs?.[key]?describeValue(e.numberExprs[key]):e[key]??fallback;
    const units=(amount,mode)=>amount+(mode==='percent'&&!String(amount).endsWith('%')?'%':'');
    const cap=(key,mode)=>value(key,0)?' (최대 '+units(value(key,0),mode)+')':'';
    const duration=value('duration',1);
    const basis=shield?'방어막이 막은 피해량':lifeStealDamageResources[e.leechResource||'hp']+' · '+
      lifeStealBases[e.leechBasis||'actual']+(e.leechResource==='mind'?'':' · '+lifeStealShieldModes[e.leechShield||'exclude']);
    const output=e.leechRecovery||'hp';
    const main=units(number,e.amountMode??'percent')+cap('healCap',e.capMode);
    const conversion=output==='both'&&e.leechFormula==='split'?
      '체력 '+main+' / 정신력 '+units(value('mindAmount',50),e.mindMode??'percent')+cap('mindCap',e.mindCapMode):
      shieldConversionOutputs[output]+' '+main;
    return '공격자 '+target+' · 방어자 '+victim+' · '+(lifeStealDamageTypes[e.leechDamage]||lifeStealDamageTypes.any)+
      ' · '+basis+' → '+heal+'에게 '+conversion+' · '+(duration===0?'전투 종료까지':duration+'라운드')+
      (e.limit?' · '+effectLimitPeriods[e.limit.period]+' '+e.limit.count+'회':'');
  }
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
  const consumed=e.consumeAmount==='all'?'전부':e.amountMode==='percent'&&e.ratioBasis?
    effectRatioBases[e.ratioBasis]+'의 '+number+'%':'최대 '+number;
  const consumeText=e.kind==='consume'
    ?target+(e.to==='allEnemies'?(e.consumeScope==='total'?'에게서 합산':' 각각에게서'):'에게서')+
      ' '+(e.tag||'지정 중첩')+' '+consumed+' 소모'+
      (e.to==='allEnemies'&&e.consumeScope==='total'?' · '+stackConsumePriorities[e.consumePriority||'lowestHp']+' 우선':'')
    :null;
  const stackAxisText=e.stackAxes&&['stack','consume','remove'].includes(e.kind)?(()=>{
    const numbers=[['axisPower','위력'],['axisCount','횟수']].flatMap(([key,label])=>{
      const expr=e.numberExprs?.[key];
      const value=expr?describeValue(expr):e[key];
      if(value==null)return [];
      if(e[key+'Mode']!=='percent')return [label+' '+value];
      const basis=stackRatioBases[e[key+'Basis']]||'중첩';
      return [label+' '+(e[key+'Tag']||e.tag||'지정 중첩')+' · '+basis+' 기준 '+value+'%'];
    });
    const action={stack:'부여',consume:'소모',remove:'제거'}[e.kind];
    return target+(e.kind==='stack'?'에게':'에게서')+' '+(e.tag||'지정 중첩')+
      (numbers.length?' '+numbers.join(' · '):'')+' '+action;
  })():null;
  const text=(stackAxisText||amplifyText||consumeText||ratioText||(added?target+' · '+added:phrases[e.kind]||effects[e.kind]+' '+(ratio?.[1]===0?signedAmount(number):number)))+(fixed?' · '+fixed:'')+(e.scaleDiscard?' · 수치 × 대가로 버린 카드 수':e.scaleResource?' · 수치 × '+resourceScales[e.scaleResource]:'');
  const payment=e.scaleCost;
  const paymentBase=e.scaleDiscard?'현재 손패':e.scaleResource==='mind'?'최대 정신력':healthBases[payment?.healthBasis||'max'];
  const resource=e.scaleDiscard?'손패':e.scaleResource==='mind'?'정신력':'체력';
  const paymentText=payment?' · '+(payment.mode==='percent'?paymentBase+'의 '+payment.amount+'%':resource+' '+payment.amount+(e.scaleDiscard?'장':''))+' 소비':'';
  const tuning=Object.entries(effectSettings[e.kind]||{})
    .map(([key,[label,defaultValue]])=>label+' '+(e[key]??defaultValue)).join(' · ');
  let summary=(tuning?text+' · '+tuning:text)+paymentText;
  if(stackGrantEffects.includes(e.kind)){
    if(!e.stackAxes&&(e.stackPower||e.kind==='stack'))summary+=' · 1회당 위력 '+(e.stackPower||1);
    if(e.stackPowerCap)summary+=' · 1회당 위력 최대 '+e.stackPowerCap;
    if(e.stackCap)summary+=' · 최대 '+e.stackCap+'회';
    for(const [key,[label]] of Object.entries(stackGainLimits)){
      const value=e.numberExprs?.[key]?describeValue(e.numberExprs[key]):e[key];
      if(value!=null)summary+=' · '+label+' '+value;
    }
  }
  if(e.kind==='hearDemon')summary+=' · 종료 시 정신력 '+mentalCrisisThreshold+' 이하이고 유혹 '+temptationLimit+' 이상이면 정신력 −'+temptationStrain;
  return summary+(e.limit?' · '+effectLimitPeriods[e.limit.period]+' '+e.limit.count+'회':'');
}
function effectConditionText(e,extra=[]){
  let flow=describeFlow(e.flow);
  if(cardZoneTimings.includes(e.when)){
    const card=e.zoneCard==='specific'?effectCards(extra).find(item=>item.id===e.zoneCardId)?.name||'지정 카드':
      e.zoneCard==='named'?e.zoneCardName:zoneCardFilters[e.zoneCard];
    const owner=e.zoneOwner==='named'?e.zoneOwnerName:zoneOwnerFilters[e.zoneOwner];
    if(card&&owner)flow+='['+owner+' · '+card+'] ';
  }
  if(!e.condition)return flow;
  if(e.condition==='cardUsed'){
    const card=effectCards(extra).find(card=>card.id===e.conditionCardId);
    return flow+'[「'+(card?.name||'지정 카드')+'」 사용 시] ';
  }
  if(Object.hasOwn(diceConditions,e.condition))return flow+'[주사위 눈의 합 '+e.threshold+' '+diceConditions[e.condition]+'] ';
  const condition=e.condition==='stack'?(e.conditionStackTag||e.tag||'중첩')+' '+e.threshold+' 이상':effectConditions[e.condition];
  const threshold=e.condition==='stack'||flagConditions.includes(e.condition)?'':' '+e.threshold;
  return flow+'['+condition+threshold+'] ';
}
function readEffect(row){
  const controls=[...row.querySelectorAll('[name]'),...(row.amountPart?.querySelectorAll('[name]')||[])];
  const {scaleBy,scaleCostMode,scaleCostAmount,scaleHealthBasis,limitPeriod,limitCount,...effect}=Object.fromEntries(controls.map(x=>[x.name,x.type==='number'?Number(x.value):x.value]));
  if(effect.to==='keywordHolders')effect.recipientKeyword={tag:effect.recipientKeywordTag,scope:effect.recipientKeywordScope,zone:effect.recipientKeywordZone,mode:effect.recipientKeywordMode,minimum:effect.recipientKeywordMinimum,names:effect.recipientKeywordNames};
  for(const key of Object.keys(effect))if(key.startsWith('recipientKeyword')&&key!=='recipientKeyword')delete effect[key];
  effect.stackAxes=!!row.axesEdited&&effect.consumeAmount!=='all';
  for(const axis of ['axisPower','axisCount'])if(!effect.stackAxes||effect[axis+'Mode']!=='percent'){
    delete effect[axis+'Mode'];delete effect[axis+'Basis'];delete effect[axis+'Tag'];
  }
  if(!effect.ratioBasis?.includes('Stack'))delete effect.ratioStackTag;
  for(const key of ['axisPower','axisCount'])if(!effect.stackAxes||!effect[key])delete effect[key];
  const all=effect.kind==='consume'&&effect.consumeAmount==='all';
  if(all||unnumberedEffects.includes(effect.kind))effect.amount=1;
  if(!effect.ratioBasis||effect.amountMode!=='percent')delete effect.ratioBasis;
  effect.gmOnly=row.querySelector('[name=gmOnly]')?.checked===true;
  if(!effect.gmOnly)delete effect.publicHint;
  if(!effect.dotRounds)delete effect.dotRounds;
  if(!effect.shieldCap)delete effect.shieldCap;
  if(effect.durationPolicy==='default'||row.querySelector('[name=durationPolicy]')?.closest('label')?.hidden){
    delete effect.durationPolicy;
    delete effect.durationCap;
  }
  if(!effect.durationCap)delete effect.durationCap;
  if(!cardZoneTimings.includes(effect.when)){
    delete effect.zoneCard;
    delete effect.zoneOwner;
  }
  if(effect.zoneCard!=='specific')delete effect.zoneCardId;
  if(effect.zoneCard!=='named')delete effect.zoneCardName;
  if(effect.zoneOwner!=='named')delete effect.zoneOwnerName;
  for(const key of ['stackCap','stackPower','stackPowerCap',...Object.keys(stackGainLimits)])if(!effect[key])delete effect[key];
  if(!all&&scaleBy==='discard')effect.scaleDiscard=true;
  else if(!all&&scaleBy)effect.scaleResource=scaleBy;
  if(!all&&scaleBy&&scaleCostMode)effect.scaleCost={mode:scaleCostMode,amount:scaleCostAmount,healthBasis:scaleHealthBasis};
  if(limitPeriod&&limitPeriod!=='none')effect.limit={period:limitPeriod,count:limitCount};
  return effect;
}
function effectTiming(effect){
  const cap=effect.numberExprs?.durationCap?describeValue(effect.numberExprs.durationCap):effect.durationCap;
  return (effect.hitIndex?effect.hitIndex+'타 · ':'')+timings[effect.when]+
    (effect.reactionRounds?' · 사용 라운드부터 '+effect.reactionRounds+'라운드':'')+
    (effect.durationPolicy?' · '+durationPolicies[effect.durationPolicy]:'')+(cap?' · 유지 상한 '+cap+'라운드':'');
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
    events,effects,families,initial,available,readEffect,
    stackSelect:(value,onChange)=>searchableSelect('조건 중첩',stackSelect(value,onChange)),
    cardChoices:Object.fromEntries((passive?effectCards():[...state.defaults,...state.profile.cards]).map(card=>[card.id,card.name])),
    defaultEffect(kind,when){
      const config=newEffects[kind];
      const preferred=config?.[1]||suggestedTiming[kind]||'hit';
      return {kind,when:when||(legacyHitEvents.includes(preferred)?'hit':preferred),
        to:cardZoneTimings.includes(when)||['replayHit','amplifyHit',...stagedPowerEffects].includes(kind)?'self':config?.[2]||(selfEffects.has(kind)?'self':'target'),
        amount:['amplifyHit','healCut','hitLeech','lifeSteal','shieldConversion'].includes(kind)?50:1,...(kind==='poison'?{dotRounds:2}:{}),
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
  const moveFields=[];
  let syncMoveFields=()=>{};
  if(row.kind==='move'){
    const menu=(name,options,fallback)=>select(name,Object.entries(options),row[name]||fallback);
    const moveMode=menu('moveMode',instantMoveModes,'approach');
    const direction=field('전장 기준 이동 방향',menu('moveDirection',instantMoveDirections,'e'));
    const order=menu('moveOrder',instantMoveOrders,'nearest');
    const test=menu('moveTest',instantMoveStackTests,'any');
    const tag=stackSelect(row.moveTag||'',undefined,'moveTag');
    const tagField=searchableSelect('기준 중첩',tag);
    const metric=field('중첩 수치 기준',menu('moveMetric',instantMoveStackMetrics,'count'));
    const minimum=field('중첩 최소값',input('moveMin',row.moveMin??1,'number',{min:0,max:9999}));
    const maximum=field('중첩 최대값',input('moveMax',row.moveMax??999,'number',{min:0,max:9999}));
    const relative=group(field('어떤 유닛을 기준으로?',menu('moveAnchor',instantMoveAnchors,'enemy')),
      field('후보 중 우선순위',order),field('기준 유닛의 어느 쪽?',menu('moveOffset',instantMoveOffsets,'behind')),
      field('중첩 필터',test),tagField,metric,minimum,maximum,
      note('앞·뒤·왼쪽·오른쪽은 이동 유닛에서 기준 유닛을 향하는 방향 기준이에요. 수치는 기준 유닛과 떨어질 칸 수예요.'));
    const choosing=note('라운드 처리 중 얻은 이동력은 다음 행동 입력 전에 사용해요. 칸을 누를 때마다 걸은 거리만큼 차감돼요.');
    syncMoveFields=()=>{
      direction.hidden=moveMode.value!=='direction';
      relative.hidden=moveMode.value!=='relative';
      const range=['inside','outside'].includes(test.value);
      const stackOrder=['mostStacks','fewestStacks'].includes(order.value);
      tagField.hidden=test.value==='any'&&!stackOrder;
      tag.required=!relative.hidden&&!tagField.hidden;
      metric.hidden=!range&&!stackOrder;
      minimum.hidden=maximum.hidden=!range;
      choosing.hidden=moveMode.value!=='choose';
    };
    moveFields.push(field('즉시 이동 방식',moveMode),direction,relative,choosing);
  }
  const shieldConversion=row.kind==='shieldConversion';
  const leech=shieldConversion||row.kind==='lifeSteal';
  const leechResource=leech&&!shieldConversion?select('leechResource',Object.entries(lifeStealDamageResources),row.leechResource||'hp'):null;
  const leechShield=leechResource?field('방어막에 막힌 피해',select('leechShield',Object.entries(lifeStealShieldModes),row.leechShield||'exclude')):null;
  const output=leech?select('leechRecovery',Object.entries(shieldConversion?shieldConversionOutputs:lifeStealRecoveryResources),row.leechRecovery||'hp'):null;
  const formula=leech?select('leechFormula',Object.entries(damageConversionFormulaModes),row.leechFormula||'shared'):null;
  const formulaField=leech?field('두 자원의 계산 방식',formula):null;
  const victim=leech?select('leechVictim',Object.entries(lifeStealVictims),row.leechVictim||'enemy'):null;
  const victimName=leech?input('leechVictimName',row.leechVictimName||'','text',{maxlength:80}):null;
  const victimNameField=leech?field('피해를 입는 캐릭터 이름',victimName):null;
  const unitField=(label,key,fallback)=>field(label,select(key,Object.entries(damageConversionUnits),row[key]||fallback));
  const mentalFields=leech?[
    unitField('정신력 변환 단위','mindMode','percent'),unitField('정신력 상한 단위','mindCapMode','fixed')
  ]:[];
  const leechFields=leech?[
    ...(leechResource?[field('입힌 피해 유형',leechResource),
      field('흡수량을 계산할 기준',select('leechBasis',Object.entries(lifeStealBases),row.leechBasis||'actual')),leechShield]:[]),
    field('피해 출처',select('leechDamage',Object.entries(lifeStealDamageTypes),row.leechDamage||'any')),
    field(shieldConversion?'누구의 방어막이 막을 때?':'누가 피해를 입을 때?',victim),victimNameField,
    field('누구에게 적용할까?',select('leechHeal',[...Object.entries(lifeStealHealers),
      ...Object.entries(effectRecipients).filter(([key])=>!['target','primary','secondary','self','keywordHolders'].includes(key))],row.leechHeal||'dealer')),
    field(shieldConversion?'변환할 자원':'회복할 자원',output),formulaField,
    unitField('피해 1회당 상한 단위','capMode','fixed'),...mentalFields,
    note(shieldConversion?'방어막이 실제로 막은 피해량을 변환해요.':
      '피해 감소 적용 후는 줄어든 체력·정신력을 기준으로 해요. 상한을 비율로 지정하면 선택한 기준 피해량에 적용해요.')
  ]:[];
  const grantsShield=shieldGrantEffects.includes(row.kind);
  const shieldFields=grantsShield?[
    field('보호막 유지 라운드 (0은 만료 없음)',input('shieldDuration',row.shieldDuration??0,'number',{min:0,max:maxStatusRounds,required:true})),
    field('보호막 합산 방식',select('stackMode',Object.entries(shieldStackModes),row.stackMode||'add')),
    field('출처별 보호막 상한',input('shieldCap',row.shieldCap??'','number',{min:1,max:999,placeholder:'제한 없음'})),
    field('같은 슬롯으로 합칠 출처 이름',input('shieldSource',row.shieldSource||'','text',{maxlength:40}))
  ]:[];
  const durationPolicy=select('durationPolicy',Object.entries(durationPolicies),row.durationPolicy||'default');
  const durationCap=input('durationCap',row.durationCap??0,'number',{min:0,max:maxDurationCap,required:true});
  const durationPolicyField=field('재적용 시 유지 라운드',durationPolicy);
  const durationCapField=field('최대 유지 라운드 (0은 제한 없음)',durationCap);
  const consuming=row.kind==='consume';
  const consumeAmount=select('consumeAmount',Object.entries(stackConsumeAmounts),row.consumeAmount||'fixed');
  const consumeScope=select('consumeScope',Object.entries(stackConsumeScopes),row.consumeScope||'each');
  const consumePriority=select('consumePriority',Object.entries(stackConsumePriorities),row.consumePriority||'lowestHp');
  const scopeField=field('적 전원 소모 기준',consumeScope);
  const priorityField=field('어느 적을 우선할까?',consumePriority);
  const totalHelp=note('우선 대상부터 중첩을 소모해요. ‘중첩 소모 시 → 카드 대상’ 효과는 소모한 총량을 기준으로 우선 대상에게 한 번 적용돼요.');
  const consumeFields=consuming?[field('얼마나?',consumeAmount),scopeField,priorityField,totalHelp]:[];
  const dualAxes=['stack','consume','remove'].includes(row.kind);
  x.axesEdited=row.stackAxes===true;
  const axesPower=input('axisPower',row.axisPower??(row.kind==='stack'&&row.amountMode!=='percent'?(row.amount??1)*(row.stackPower??1):''),'number',{min:1,max:maxStackPotency,placeholder:'비워두면 유지'});
  const axesCount=input('axisCount',row.axisCount??(!row.stackAxes?row.amount??1:''),'number',{min:1,max:maxStatusStacks,placeholder:'비워두면 유지'});
  const axisFields=el('div',undefined,{class:'stack'});
  const axisParts=[];
  for(const [control,label] of [[axesPower,'중첩 위력 합계'],[axesCount,'중첩 횟수']]){
    const key=control.name;
    const unit=select(key+'Mode',[['fixed','고정값'],['percent','비율 (%)']],row[key+'Mode']||(key==='axisCount'?row.amountMode:'')||'fixed');
    const basis=select(key+'Basis',Object.entries(stackRatioBases),row[key+'Basis']||row.ratioBasis||'ownStackCurrent');
    const basisTag=stackSelect(row[key+'Tag']||row.ratioStackTag||'',undefined,key+'Tag');
    basisTag.required=false;
    const ratioOptions=el('div',undefined,{class:'stack'});
    ratioOptions.append(field('비율 계산 기준',basis),searchableSelect('비율 기준 중첩',basisTag));
    const part=el('fieldset',undefined,{class:'effect-block effect-amount-part','data-part':'amount'});
    const legend=el('legend',label);
    part.append(legend,field('수치 단위',unit),field(label,control),ratioOptions);
    axisParts.push({part,legend,label,unit,ratioOptions,basisTag});
    axisFields.append(part);
  }
  const capFields=stackGrantEffects.includes(row.kind)
    ?[
      ...(!dualAxes?[field('중첩 위력',input('stackPower',row.stackPower??'','number',{min:1,max:maxStackPotency}))]:[]),
      field('중첩 위력 한도 (1회당)',input('stackPowerCap',row.stackPowerCap??'','number',{min:1,max:maxStackPotency,placeholder:'기본 '+maxStackPotency})),
      field('중첩 횟수 한도',input('stackCap',row.stackCap??'','number',{min:1,max:maxStatusStacks,placeholder:'기본 '+maxStatusStacks})),
      stackGainFields(row),
      note('중첩 비례 효과는 보유하거나 소모한 중첩의 위력을 합산해 계산해요.')
    ]:[];
  const amountLabel=field(leech?'회복 수치':consuming?'소모 수량':row.kind==='stack'?'부여 횟수':row.kind==='blockAction'?'행동 불가 라운드 수':row.kind==='reduceActions'?'줄일 행동량':['healCut','hitLeech'].includes(row.kind)?'비율 (%)':'얼마나?',amount);
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
  const stackRatio=stackRatioEffects.includes(row.kind);
  const bases=Object.entries(effectRatioBases).filter(([key])=>Object.hasOwn(stackRatioBases,key)===stackRatio);
  const ratioBasis=select('ratioBasis',[...(stackRatio?[]:[['','기본 계산 방식']]),...bases],row.ratioBasis||(stackRatio?'ownStackCurrent':''));
  const ratioStackTag=stackSelect(row.ratioStackTag||'',undefined,'ratioStackTag');
  ratioStackTag.required=false;
  const ratioStackField=searchableSelect('비율 기준 중첩',ratioStackTag);
  const ratioBasisField=field('비율 계산 기준',ratioBasis);
  const basis=el('small','',{class:'minor'});
  basis.hidden=true;
  const tagControl=stackSelect(row.tag,undefined,'tag');
  const tag=searchableSelect(row.kind==='stack'?'부여할 중첩':'효과에 사용할 중첩',tagControl);
  const conditionStackControl=stackSelect(row.conditionStackTag||(row.condition==='stack'?row.tag:''),undefined,'conditionStackTag');
  const conditionStack=searchableSelect('조건에서 확인할 중첩',conditionStackControl);
  const tagHelp=el('small','',{class:'minor'});
  tag.append(tagHelp);
  const toOptions=replace?[['self','자신'],['target','원래 대상']]:
    Object.entries(effectRecipients).map(([id,label])=>[id,(passive||['struck','hurt','clash'].includes(row.when))&&id==='target'?'전투 상대':label]);
  const to=select('to',toOptions,row.to||'target');
  const recipient=row.recipientKeyword||{};
  const recipientTag=stackSelect(recipient.tag||'',undefined,'recipientKeywordTag');
  const recipientScope=select('recipientKeywordScope',Object.entries(stackScanScopes),recipient.scope||'allies');
  const recipientNames=input('recipientKeywordNames',recipient.names||'','text',{placeholder:'이름을 쉼표로 구분'});
  const recipientNamesField=field('감지할 유닛 이름',recipientNames);
  const recipientFields=el('div',undefined,{class:'stack'});
  recipientFields.append(searchableSelect('카드 키워드',recipientTag),field('감지 범위',recipientScope),recipientNamesField,
    field('카드 위치',select('recipientKeywordZone',Object.entries(keywordOwnedZones),recipient.zone||'active')),
    field('키워드 처리 방식',select('recipientKeywordMode',Object.entries(keywordScanModes),recipient.mode||'any')),
    field('유닛당 최소 보유 카드 수',input('recipientKeywordMinimum',recipient.minimum??1,'number',{min:1,max:9999})));
  const targetOption=[...to.options].find(option=>option.value==='target');
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
  const zoneCard=select('zoneCard',Object.entries(zoneCardFilters).filter(([key])=>!passive||!['same','other'].includes(key)),row.zoneCard||(passive?'any':'same'));
  const zoneOwner=select('zoneOwner',Object.entries(zoneOwnerFilters),row.zoneOwner||'self');
  const zoneId=select('zoneCardId',cardOptions,row.zoneCardId||'');
  const zoneName=input('zoneCardName',row.zoneCardName||'','text',{maxlength:80});
  const ownerName=input('zoneOwnerName',row.zoneOwnerName||'','text',{maxlength:80});
  const zoneIdField=searchableSelect('어떤 카드?',zoneId);
  const zoneNameField=field('이동한 카드의 정확한 이름',zoneName);
  const ownerNameField=field('카드 주인의 정확한 이름',ownerName);
  const zoneFields=el('fieldset',undefined,{class:'effect-block','data-part':'condition'});
  zoneFields.append(el('legend','카드 이동 조건'),field('어떤 카드가 이동하면?',zoneCard),zoneIdField,zoneNameField,
    field('누구의 카드가 이동하면?',zoneOwner),ownerNameField);
  if(!passive)zoneFields.append(note('다른 카드의 이동을 감지하는 효과는 전투 덱에 등록되었거나 전투 중 얻은 카드에서 작동해요. 같은 카드가 여러 장 있어도 효과는 이동한 카드 한 장당 한 번씩 발동해요.'));
  const give=select('givenCardId',cardOptions,row.givenCardId||'');
  const conditionCard=select('conditionCardId',cardOptions,row.conditionCardId||'');
  give.required=row.kind==='giveCard';
  const giveField=searchableSelect('손패에 지급할 카드',give);
  const conditionCardField=searchableSelect('사용 조건 카드',conditionCard);
  const original=select('fromCardId',[['','모든 카드'],...availableCards.map(card=>[card.id,card.name])],row.fromCardId||'');
  replacement.required=replace;
  const replacementFields=replace?[
    ...(passive?[searchableSelect('교체할 원래 카드',original)]:[]),searchableSelect('대신 발동할 카드',replacement),
    note('조건은 위력 판정 전에 확인해요. 원래 대상이 사거리 안에 있으면 우선하고, 필요하면 가장 가까운 대상을 골라요.')
  ]:[];
  const fixedField=searchableSelect('복제할 카드',fixed);
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
    syncMoveFields();
    const timed=grantsShield||durationPolicyKinds.includes(row.kind)||!passive&&!scoped&&['struck','hurt'].includes(when.value);
    durationPolicyField.hidden=durationCapField.hidden=!timed;
    if(leech){
      if(leechShield)leechShield.hidden=leechResource.value==='mind';
      formulaField.hidden=output.value!=='both';
      victimNameField.hidden=victimName.disabled=victim.value!=='named';
      victimName.required=!victimName.disabled;
      const split=output.value==='both'&&formula.value==='split';
      for(const field of [...mentalFields,...settings.filter(field=>field.querySelector('[name=mindAmount],[name=mindCap]'))])field.hidden=!split;
    }
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
      amountLabel.hidden=all;
      amount.disabled=dualAxes||all;
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
    recipientFields.hidden=to.value!=='keywordHolders';
    recipientNamesField.hidden=recipientFields.hidden||recipientScope.value!=='named';
    recipientNames.required=!recipientNamesField.hidden;
    recipientTag.required=!recipientFields.hidden;
    const zone=cardZoneTimings.includes(when.value);
    zoneFields.hidden=!zone;
    zoneIdField.hidden=zoneId.disabled=!zone||zoneCard.value!=='specific';
    zoneNameField.hidden=zoneName.disabled=!zone||zoneCard.value!=='named';
    ownerNameField.hidden=ownerName.disabled=!zone||zoneOwner.value!=='named';
    for(const control of [zoneId,zoneName,ownerName])control.required=!control.disabled;
    if(targetOption)targetOption.textContent=zone?'이동한 카드의 주인':
      (passive||['struck','hurt','clash'].includes(when.value))&&!replace?'전투 상대':
      replace?'원래 대상':effectRecipients.target;
    if(!replace){
      for(const option of to.options)option.disabled=when.value==='held'?option.value!=='self':
        zone?['primary','secondary'].includes(option.value):
        passive&&passiveRoundTimings.includes(when.value)&&['target','primary','secondary'].includes(option.value);
      if(to.selectedOptions[0]?.disabled)to.value='self';
    }
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
    if(ratioBasis.selectedOptions[0]?.disabled)ratioBasis.value=stackRatio?'ownStackCurrent':'';
    const e=readEffect(x);
    healthField.hidden=!healthRatioEffects.includes(e.kind)||e.amountMode!=='percent'||!!e.ratioBasis;
    basis.hidden=leech||!ratio||e.amountMode!=='percent'||!healthField.hidden||!!e.ratioBasis;
    scaleModeField.hidden=!showScale;
    scaleAmountField.hidden=!showScale||!scaleCostMode.value;
    scaleCostAmount.disabled=scaleAmountField.hidden;
    scaleBasisField.hidden=!showScale||scale.value!=='health'||scaleCostMode.value!=='percent';
    basis.textContent=e.kind==='basePower'?'주사위 합과 카드 고정값 기준':e.kind==='finalPower'?'정신력과 다른 위력 보정을 적용한 결과 기준':ratio?.[3]?'고정 피해 보정을 적용한 뒤, 보호막 적용 전 피해 기준':ratio?.[2] ? ratio[2]+' 기준' :'주사위와 고정 보정을 합친 판정 위력 기준';
    amount.setCustomValidity(canSign&&amount.value==='0'?'0이 아닌 수치를 입력하세요.':'');
    tag.hidden=tagControl.disabled=!taggedEffects.includes(e.kind);
    conditionStack.hidden=conditionStackControl.disabled=e.condition!=='stack';
    tagHelp.textContent=basicStacks[e.tag]?basicStackInfo(basicStacks[e.tag]).join(" · "):conceptStacks[e.tag]?.description||'';
    threshold.style.display=e.condition&&!flagConditions.includes(e.condition)?'':'none';
    axisFields.hidden=all;
    ratioStackField.hidden=ratioStackTag.disabled=ratioBasis.disabled||!Object.hasOwn(stackRatioBases,ratioBasis.value);
    for(const {part,legend,label,unit,ratioOptions,basisTag} of axisParts){
      const percent=unit.value==='percent';
      part.dataset.unit=percent?'percent':'fixed';
      legend.textContent=label+' · '+(percent?'비율값 파츠':'고정값 파츠');
      ratioOptions.hidden=basisTag.disabled=!percent||all;
    }
    if(x.amountPart&&!dualAxes){
      x.amountPart.hidden=all;
      const isPercent=mode.value==='percent'||['percent','healPercent','healMissing','healCut','hitLeech'].includes(e.kind);
      x.amountPart.dataset.unit=isPercent?'percent':'fixed';
      x.amountPart.firstElementChild.textContent=isPercent?'비율값 파츠':'고정값 파츠';
    }
    title.textContent=(e.gmOnly?'[GM 전용] ':'')+effectConditionText(e)+effectTiming(e)+' · '+effectSentence(e);
    if(x.isConnected)refresh();
  };
  const part=(label,color,...controls)=>{
    const block=el('fieldset',undefined,{class:'effect-block','data-part':color});
    block.append(el('legend',label),...controls);
    return block;
  };
  if(unnumberedEffects.includes(row.kind))amount.type='hidden';
  else{
    const partNode=dualAxes?axisFields:part('수치 파츠','amount',modeLabel,amountLabel,ratioBasisField,ratioStackField,healthField,basis);
    if(dualAxes){
      const legacy=el('div',undefined,{hidden:true});
      amount.disabled=true;
      legacy.append(modeLabel,amountLabel,ratioBasisField,ratioStackField,healthField,basis);
      partNode.append(legacy);
      x.dualAxes=true;
      partNode.addEventListener('input',()=>{x.axesEdited=true;});
      partNode.addEventListener('change',()=>{x.axesEdited=true;});
    }
    if(!dualAxes)partNode.classList.add('effect-amount-part');
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
    zoneFields,part('대상','target',field(leech?'누가 피해를 줄 때?':replace?'조건을 확인할 대상':'누구에게?',to),recipientFields),
    ...(row.kind==='stack'?[part('중첩 부여','effect',tag)]:[]),
    part('효과 옵션','effect',...replacementFields,...consumeFields,...(row.kind==='giveCard'?[giveField]:[]),
      ...(dualAxes&&stackGrantEffects.includes(row.kind)?[input('stackPower',row.stackPower??'','hidden')]:[]),...capFields,...ampFields,...shieldFields,...leechFields,...duration,...settings,...moveFields,durationPolicyField,durationCapField,...stackScale,reactionField,...(row.kind==='stack'?[]:[tag]),fixedField),
    field('효과 플레이버 텍스트',area('flavor',row.flavor||'',180),'full'),
    part('대가와 발동 제한','limit',field('발동 제한',limit),limitCountField,scaleField,scaleModeField,scaleAmountField,scaleBasisField));
  if(state.manager){
    const secret=input('gmOnly','1','checkbox');
    secret.checked=row.gmOnly===true;
    fields.append(field('GM 전용 효과',secret,'inline'),field('참가자에게 보일 힌트',input('publicHint',row.publicHint||'','text',{maxlength:120})));
  }
  fields.append(part('효과 자체 조건','condition',field('어떤 조건에서?',condition),conditionCardField,conditionStack,threshold,diceHelp));
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
async function imageData(file,maxSize=32000,maxSide=280,quality=.66){
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
    result=canvas.toDataURL('image/webp',quality);
    if(quality>.66&&result.length>maxSize){
      for(const reduced of [.77,.68,.59]){
        result=canvas.toDataURL('image/webp',reduced);
        if(result.length<=maxSize)break;
      }
    }
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
  if(card.unredirectable)body.append(note('대상 변경 불가'));
  if(unstoppable)body.append(note('저지불가 · 합 패배 시 최소 위력으로 공격'));
  if(role==='guard')body.append(note(coverHelp));
  if(role==='counter')body.append(note(counterHelp));
  if(role==='overload'||cost&&card.concept)body.append(note('정신력 −'+cost+(card.concept?' · 부족하면 사용 불가':'')));
  const {popup,keyword}=cardKeywordHelp(preview);
  const description=el('div',undefined,{class:'forge-description',tabindex:0,role:'region','aria-label':'카드 설명'});
  const stackNames=new Set(rows.flatMap(effectStackNames));
  if(stackNames.size){
    const stacks=el('div',undefined,{class:'row forge-keywords','aria-label':'중첩'});
    for(const name of stackNames){
      const trait=(card.concept?conceptStacks[name]:null)||state.profile?.stackTraits?.find(item=>item.name===name)||conceptStacks[name]||basicStacks[name];
      const lines=trait===basicStacks[name]&&trait?basicStackInfo(trait):(trait?.effects||[]).map(stackEffectText);
      stacks.append(keyword(name,[...new Set(lines)],'stack-tag',trait?.flavor));
    }
    description.append(stacks);
  }
  for(const hint of card.publicHints||[])description.append(note(hint));
  for(const effect of rows){
    const line=el('p',undefined,{class:'forge-effect'});
    const phase=effectConditionText(effect)+effectTiming(effect);
    const name=effects[effect.kind]||(effect.publicLabel?'고유 효과':effect.kind);
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
    const data=await request({action:kind+'Export',...(kind==='stack'?{name:id}:{id})});
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const name=data.character?.name||data.passives?.[0]?.name||(data.stacks?.length===1?data.stacks[0].name:null)||'콘셉트테라';
    const anchor=el('a',undefined,{href:url,download:name.replace(/[<>:"/\\|?*]/g,'_')+'-'+kind+'.json'});
    document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(err){errors.textContent=err.message;}
}
function characterFileControls(kind,locked,empty=false){
  const label=kind==='character'?'캐릭터 전체':kind==='stack'?'중첩':'패시브';
  const actions=el('div',undefined,{class:'row library-file-actions'});
  const download=button((kind==='stack'?'전체 중첩':label)+' 다운로드',()=>downloadCharacterFile(kind));
  download.disabled=empty;
  if(kind==='stack')download.dataset.downloadStacks='';
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
      if(data?.format!==(kind==='character'?characterFileFormat:kind==='stack'?stackFileFormat:passiveFileFormat)||data.version!==1)
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
        !effect.numberExprs?.amplifyIndex&&(effect.amplifyIndex<=effect.hitIndex||effect.amplifyIndex>hitPowers.length)){
        throw new Error(effect.hitIndex+'타: 증폭할 타격은 이 타격보다 뒤에 있어야 해요.');
      }
    }
    const image=await imageData(data.get('image'));
    const splash=['splash','tile'].includes(chosen)?{range:splashForm.range.value,rangeShape:splashForm.value()}:undefined;
    return {card:{id:c.id,name:data.get('name'),gmOnly:data.has('gmOnly'),publicName:data.get('publicName'),publicHint:data.get('publicHint'),hitPowers,hitTargets,hitFlavors:hits.map(hit=>hit.flavor.value),flavor:data.get('flavor'),target:['guard','counter'].includes(role.value)?'self':/^\d$/.test(chosen)?Number(chosen):chosen,range:rangeForm.range.value,rangeShape:rangeForm.value(),splash,clash:data.has('clash'),unstoppable:data.has('unstoppable'),unredirectable:data.has('unredirectable'),role:data.get('role'),requiredState:data.get('requiredState'),cost:Number(data.get('cost')),notes:data.get('notes'),effects,image:image||(!data.has('clearImage')?c.image:'')}};
  });
  const costInput=input('cost',c.role==='overload'?(c.cost??defaultOverloadCost):defaultOverloadCost,'number',{min:0,max:maxOverloadCost,step:1,required:true});
  const cost=field('혹사 정신력 소모',costInput);
  const sync=()=>{
    cost.hidden=costInput.disabled=role.value!=='overload';
    const form=makeCard.elements;
    form.target.disabled=['guard','counter'].includes(role.value);
    form.clash.disabled=form.target.disabled||form.target.value==='tile';
    splashSettings.hidden=splashSettings.disabled=form.target.disabled||!['splash','tile'].includes(form.target.value);
    for(const hit of hits){
      hit.targetModeField.hidden=hit.targetModeControl.disabled=form.target.disabled||form.target.value==='self';
    }
    for(const control of [form.target,form.clash,form.unstoppable])control.parentElement.hidden=role.value==='counter';
    form.unstoppable.disabled=['guard','assist','counter'].includes(role.value)||form.target.value==='self'||form.target.value==='tile';
  };
  role.onchange=()=>{
    sync();
    for(const ws of [workspace,...hits.map(hit=>hit.workspace)])ws.refreshTools();
  };
  makeCard.append(field('카드명',input('name',c.name,'text',{required:true,maxlength:36})),
    field('대상',select('target',[[1,'1명'],[2,'최대 2명'],[3,'최대 3명'],[4,'최대 4명'],['area','시전자 기준 광역'],['splash','적 지정 광역'],['tile','타일 지정 광역'],['self','자신']],c.target||1)),
    rangeForm.node,splashSettings,
    field('카드 유형',role),field('사용 가능 상태',select('requiredState',Object.entries(cardStates),c.requiredState||'any')),cost,field('합 가능',input('clash','1','checkbox',{checked:c.clash??true}),'inline'),
    field('대상 변경 불가',input('unredirectable','1','checkbox',{checked:!!c.unredirectable}),'inline'),
    field('저지불가',input('unstoppable','1','checkbox',{checked:!!c.unstoppable,'aria-describedby':'unstoppable-guide'}),'inline'),
    el('p','합에서 패배해도 전투를 계속할 수 있으면 최소 위력으로 공격해요.',{id:'unstoppable-guide',class:'notice minor full'}),
    field('카드 이미지',input('image','','file',{accept:'image/png,image/jpeg,image/webp'})),
    field('카드 플레이버 텍스트',area('flavor',c.flavor||'',300),'full'),field('GM 판정 메모',area('notes',c.notes||'',300),'full'));
  if(state.manager){
    const secret=input('gmOnly','1','checkbox');
    secret.checked=c.gmOnly===true;
    makeCard.append(field('카드 전체를 GM 전용으로 표시',secret,'inline'),
      field('참가자에게 보일 카드 이름',input('publicName',c.publicName||'','text',{maxlength:40})),
      field('참가자에게 보일 카드 힌트',input('publicHint',c.publicHint||'','text',{maxlength:120})));
  }
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
      clash:!form.clash.disabled&&form.clash.checked,unstoppable:!form.unstoppable.disabled&&form.unstoppable.checked,unredirectable:form.unredirectable.checked,
      requiredState:form.requiredState.value,cost:role.value==='overload'?Number(form.cost.value):0,
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
  const saveCard=submit(c.id?'변경한 카드 저장':'카드 완성');
  const saveError=el('p','',{class:'error full',role:'alert',hidden:true});
  const showSaveError=message=>{
    saveError.textContent=message;
    saveError.hidden=!message;
  };
  makeCard.addEventListener('invalid',event=>{
    const control=event.target;
    if(makeCard.querySelector(':invalid:not(form):not(fieldset)')!==control)return;
    const label=control.labels?.[0]?.firstChild?.textContent.trim()||control.getAttribute('aria-label');
    showSaveError((label?label+' · ':'')+control.validationMessage);
    for(let parent=control.parentElement;parent&&parent!==makeCard;parent=parent.parentElement){
      if(parent.tagName==='DETAILS')parent.open=true;
    }
  },true);
  const save=makeCard.onsubmit;
  makeCard.onsubmit=async event=>{
    if(busy){event.preventDefault();return;}
    showSaveError('');
    errors.textContent='';
    saveCard.disabled=true;
    try{
      await save(event);
      if(makeCard.isConnected)showSaveError(errors.textContent);
    }finally{saveCard.disabled=false;}
  };
  makeCard.append(globalEditor,hitEditor,saveCard,saveError);
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
function saveSlotsPanel(){
  if(!state.manager||studio)return null;
  const panel=el('details',undefined,{class:'stack campaign-saves'});
  panel.append(el('summary','캠페인 저장 · 불러오기'));
  if(state.savedAt)panel.append(note('자동 저장됨 · '+new Date(state.savedAt).toLocaleString()));
  for(let slot=1;slot<=3;slot++){
    const saved=state.saveSlots?.find(item=>item.slot===slot);
    const entry=section(slot+'번 슬롯',note(saved?saved.label+(saved.round?' · '+saved.round+'라운드':'')+
      ' · '+new Date(saved.updated_at).toLocaleString():'빈 슬롯'));
    const actions=el('div',undefined,{class:'row'});
    const write=button('현재 진행 저장',()=>{
      if(saved&&!window.confirm(slot+'번 저장을 덮어쓸까요?'))return;
      return send('saveSlot',{slot});
    });
    write.disabled=!state.battle&&!state.campaign;
    actions.append(write);
    if(saved)actions.append(
      button('이어하기',()=>{if(window.confirm('현재 진행을 이 저장으로 바꿀까요?'))return send('loadSlot',{slot});}),
      button('JSON 내보내기',async()=>{
        try{
          const file=await request({action:'exportSave',slot});
          const blob=new Blob([JSON.stringify(file)],{type:'application/json'});
          const url=URL.createObjectURL(blob);
          const link=el('a',undefined,{href:url,download:'conceptterra-save-'+code+'-'+slot+'.json'});
          document.body.append(link);link.click();link.remove();
          setTimeout(()=>URL.revokeObjectURL(url),1000);
        }catch(error){errors.textContent=error.message;}
      }),
      button('슬롯 삭제',()=>{if(window.confirm(slot+'번 저장을 삭제할까요?'))return send('deleteSlot',{slot});})
    );
    entry.append(actions);
    panel.append(entry);
  }
  const inputFile=input(undefined,'','file',{accept:'.json,application/json'});
  inputFile.hidden=true;
  inputFile.onchange=async()=>{
    try{
      const file=inputFile.files[0];
      if(!file)return;
      if(file.size>1250000)throw new Error('저장 파일이 너무 커요.');
      const data=JSON.parse(await file.text());
      if(window.confirm('이 파일의 진행으로 현재 진행을 바꿀까요?'))await send('importSave',{file:data});
    }catch(error){errors.textContent=error.message;}
    finally{inputFile.value='';}
  };
  panel.append(note('JSON 파일은 이 세션의 GM 또는 방장이 같은 방에서 다시 열 수 있어요.'),
    button('JSON 불러오기',()=>inputFile.click()),inputFile);
  return panel;
}
function trainCheckpoints(){
  const campaign=state.campaign;
  if(!campaign?.checkpoints.length)return null;
  const box=section('열차 책갈피',note('복귀 '+campaign.station+'회 기록 · 회귀 '+campaign.loopCount+'/12 · 잔재 '+campaign.residue));
  if(state.manager){
    const mark=formFor('loopCheckpoint',(_,data)=>({label:data.get('label')}));
    mark.append(field('책갈피 이름',input('label','','text',{maxlength:40})),submit('수동 책갈피 남기기'));
    box.append(mark);
    if(campaign.loopCount<12){
      const form=formFor('loopRevert',(_,data)=>({checkpointId:data.get('checkpointId'),target:data.get('target'),cardId:data.get('cardId')}));
      const bookmark=select('checkpointId',campaign.checkpoints.map(item=>[item.id,item.label]),campaign.checkpoints.at(-1).id);
      const target=select('target',[],'');
      const card=select('cardId',[],'');
      const populate=()=>{
        const entry=campaign.checkpoints.find(item=>item.id===bookmark.value);
        const candidates=entry?.candidates||[];
        target.replaceChildren(el('option','자동 선택',{value:''}),...candidates.map(item=>el('option',item.name,{value:item.id})));
        updateCards();
      };
      const updateCards=()=>{
        const candidates=campaign.checkpoints.find(item=>item.id===bookmark.value)?.candidates||[];
        const cards=candidates.find(item=>item.id===target.value)?.cards||[];
        card.replaceChildren(el('option','덱에서 자동 선택',{value:''}),...[...new Map(cards.map(item=>[item.id,item.name]))].map(([id,name])=>el('option',name,{value:id})));
      };
      target.onchange=updateCards;
      bookmark.onchange=populate;
      populate();
      form.append(field('돌아갈 책갈피',bookmark),field('대가를 낼 승객',target),field('영구히 소실될 카드 1장',card),
        note('관찰 기록을 유지하고 저장점으로 돌아갑니다. 덱에서 일반 카드 한 장이 영구히 사라집니다.'),submit('카드를 지불하고 회귀'));
      form.addEventListener('submit',event=>{
        if(!window.confirm('선택한 책갈피로 돌아가고 일반 카드 한 장을 영구 소실할까요?'))event.preventDefault();
      },true);
      box.append(form);
    }else box.append(note('회귀가 봉인되었습니다.'));
  }
  const loss=campaign.lostCards.find(entry=>entry.actor===state.me&&!entry.replacedBy);
  if(loss){
    box.append(note('「'+loss.name+'」 소실 · 새 일반 카드를 작성해야 출발할 수 있습니다.'));
    const refill=formFor('loopRefill',(_,data)=>Object.fromEntries(data));
    refill.append(field('새 카드 이름',input('name','','text',{maxlength:20,required:true})),
      field('위력',input('power','1d6+2','text',{maxlength:18,required:true})),
      field('사거리',input('range',1,'number',{min:1,max:5,required:true})),
      field('정신력 대가',input('cost',0,'number',{min:0,max:5,required:true})),
      field('카드 문구',area('text','',120)),submit('빈자리에 새 카드 작성'));
    box.append(refill);
  }
  return box;
}
function startPanel(){
  const root=section('빈 객차',note('눈을 뜨자 객차에는 남은 승객들뿐입니다. 존속의 집행체가 열차에 들어옵니다.'));
  const saves=saveSlotsPanel();
  if(saves)root.append(saves);
  root.append(battleSettingsButton());
  const train=trainCheckpoints();
  if(train)root.append(train);
  if(!state.manager){root.append(note('GM 또는 방장이 전투를 시작할 때까지 기다려 주세요.'));return root;}
  const form=formFor('start',(_,data)=>({solo:data.has('solo'),bots:Number(data.get('bots')),encounter:data.get('encounter')}));
  const solo=input('solo','1','checkbox',{checked:!state.roster.length,disabled:!!state.roster.length});
  const bots=select('bots',[],0);
  const refresh=()=>{
    const max=4-state.roster.length-Number(solo.checked);
    const old=Number(bots.value);
    bots.replaceChildren(...Array.from({length:max+1},(_,i)=>el('option',i+'명',{value:i})));
    bots.value=String(Math.min(old,max));
  };
  solo.onchange=refresh;refresh();bots.value=String(4-state.roster.length-Number(solo.checked));
  const encounter=select('encounter',[['','객차 연습 전투'],['stop01','첫 정류장 · 불 꺼진 제6국 외곽 막다른 골목'],['collector01','외상 장부의 수금원 · 잿빛 세관 창고'],['judge01','눈 먼 심판자 · 법원 지하 보관고'],['railguard01','선로 보안반 · 신호가 끊긴 폐선로'],['blight01','밝은 곳에서 더더욱 빛나는 · 빛이 남은 광장']],'');
  form.append(field('조우 선택',encounter),field('내 캐릭터로 혼자 연습',solo,'inline'),field('자동 행동 봇 동료',bots),submit('전투 시작'));
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
  const hidden=card.revealHidden||[];
  if(unit.enemy&&unit.revealTier!=null){
    side.dataset.revealTier=unit.revealTier;
    side.append(note('관찰 '+unit.revealTier+'단계 · '+unit.intelProgress+'/100'+(state.manager?' · GM 전체 열람':'')));
  }
  const [min,max]=hidden.includes('power')?['???','???']:powerBounds(card,(unit.enemy?0:mentalPower(Math.max(0,unit.mind-card.cost)))+(unit.nextPower||0)+(unit.awakening?awakeningPower:0)).map(value=>applyPowerRatio(value,unit.nextPowerPercent||0));
  const values=el('div',undefined,{class:'battle-power-preview'});
  for(const [key,value] of [['최소 위력',min],['최대 위력',max]]){
    const item=el('span',key);item.append(el('b',value));values.append(item);
  }
  side.append(values,el('strong',card.name),note(unit.name+' · 사거리 '+gridCardRangeLabel(card)));
  if(cardHitPowers(card).length>1)side.append(note(cardHitPowers(card).map((power,i)=>(i+1)+'타 '+power).join(' · ')));
  if(card.unredirectable)side.append(note('대상 변경 불가'));
  if(card.unstoppable)side.append(note('저지불가 · 합 패배 시 최소 위력으로 공격'));
  if(card.role==='guard')side.append(note(coverHelp));
  if(card.role==='counter')side.append(note(counterHelp));
  if(card.splash)side.append(note((card.target==='tile'?'선택한 칸 주변 · ':card.hitTargets?'부 대상 범위 · ':'주 대상 적중 시 · 주변 ')+gridCardRangeLabel(card.splash)));
  if(art)side.append(el('img',undefined,{src:art,alt:'',class:'battle-action-art'}));
  for(const hint of card.publicHints||[])side.append(note(hint));
  if(hidden.includes('effects'))side.append(note('효과는 관찰이 쌓이면 열립니다.'));
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
  if(slot)return artUrl(unit.id,slot,unit.artVersion);
  if(unit.name==='어두운 곳에서 더욱 빛나는')return '/battle-art/dark-halo-standing.png?v=2';
  return sprite?'/battle-art/unit-'+sprite+'.png':null;
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
  const tiles=[],tokens=new Map(),nodes=[];
  const intents=b.phase==='planning'?[...(b.intentQueue||[b.intent].filter(Boolean)),...(b.allyActions||[])]:[];
  for(let i=0;i<gridSize;i++){
    const {x,y}=gridPoint(i), temporaryWall=b.extraWalls?.find(item=>item.index===i);
    const wall=b.walls.includes(i)||!!temporaryWall&&(!self||temporaryWall.ownerSide!==self.enemy);
    const unit=b.units.find(u=>u.pos===i&&u.hp>0)||b.units.find(u=>u.pos===i&&!u.hp);
    const tile=el('div',undefined,{role:'button',tabindex:0});
    tile.dataset.tile=String(i);
    tile.onkeydown=event=>{if(event.target===tile&&['Enter',' '].includes(event.key)){event.preventDefault();tile.click();}};
    const sniper=b.units.find(unit=>unit.id===b.aimLine?.sourceId);
    const aim=sniper&&b.aimLine.index===y&&!wall&&gridLineOfSight(sniper.pos,i,b.walls);
    tile.className='battle-cell'+(wall?' wall':'')+(aim?' rail-aim':'')+(b.zones?.includes(i)?' sanctuary-zone':'')+(b.tiles?.[i]?.kind==='spring'?' spring-tile':b.tiles?.[i]?' slime-trail':'');
    if(b.tiles?.[i]?.kind==='spring')tile.title='물웅덩이 · '+(b.tiles[i].through-b.round+1)+'라운드 남음';
    else if(b.tiles?.[i])tile.title='점액 흙길 · 통과 시 다음 라운드 이동력 감소';
    if(temporaryWall){tile.classList.add('temporary-wall');tile.title='임시 벽 · '+(temporaryWall.through-b.round+1)+'라운드 남음';}
    if(b.zones?.includes(i))tile.title=i===22?'성역':'포근한 광배';
    tile.setAttribute('aria-label',`${x+1}열 ${y+1}행${wall?' · 벽':unit?' · '+unit.name:''}`);
    tile.append(el('small',String.fromCharCode(65+x)+(y+1),{class:'coordinate'}));
    if(unit){
      const title=unit.enemy?'적':unit.id===self?.id?'나':unit.bot?'봇':'아군';
      const token=el('span',undefined,{class:'battle-token'+(unit.enemy?' enemy':'')+(unit.id===self?.id?' self':'')});
      const art=battleArt(unit,unit.ready?'ready':unit.pose||'idle');
      if(art)token.append(el('img',undefined,{src:art,alt:'',class:'battle-unit-sprite'+(art.startsWith('/battle-art/unit-')?' pixel-sprite':'')+(art.includes('/dark-halo-standing.png')?' dark-halo-sprite':''),draggable:'false'}));
      else token.append(el('b',unit.collapsed?'개념화':unit.hp?title:'전투 불능',{class:unit.enemy?'enemy-core':''}));
      tokens.set(unit.id,token);
      token.dataset.unitId=unit.id;
      token.append(el('span',unit.name.split(' · ')[0]),el('progress',undefined,{value:unit.hp,max:unit.maxHp,'aria-label':unit.name+' 체력'}));
      if(unit.enemy)token.append(el('small','관찰 '+(unit.intelProgress??0)+'% · '+(unit.revealTier??0)+'단계',{class:'battle-intel-token',title:'정보 해금도 '+(unit.intelProgress??0)+'/100'}));
      if(!unit.enemy)token.append(el('small',unit.mind,{class:'unit-sp',title:'정신력'}));
      const actions=intents.filter(intent=>(intent.attacker||'enemy')===unit.id);
      if(unit.hp&&actions.length){
        const row=el('div',undefined,{class:'battle-intent-nodes'});
        for(const [index,intent] of actions.entries()){
          const node=el('button',String(index+1),{type:'button',class:'battle-intent-node'+(unit.enemy?'':' allied'),'aria-label':unit.name+' 예고 '+(index+1)+' · '+intent.card.name});
          node.onpointerdown=event=>event.stopPropagation();
          node.dataset.intentId=intent.id||'enemy';
          nodes.push({node,intent,unit});
          row.append(node);
        }
        token.append(row);
      }
      tile.append(token);
    }
    grid.append(tile);tiles.push(tile);
  }
  grid.append(overlay);
  camera.append(grid);field.append(camera);frame.append(field);
  bindBattleBoardControls(field,camera,tools);
  return {frame,tools,tiles,overlay,tokens,nodes};
}

function enemyIntelGauge(unit){
  const box=el('div',undefined,{class:'enemy-intel-gauge'});
  const progress=unit.intelProgress??0;
  box.append(el('span','관찰 '+progress+'/100 · '+(unit.revealTier??0)+'단계'),
    el('progress',undefined,{max:100,value:progress,'aria-label':unit.name+' 정보 해금도'}));
  if(state.manager)box.append(el('small','GM 전체 열람'));
  return box;
}
function unitIntelInspection(unit){
  const info=(unit.enemy?unit.enemyIntel:unit.allyIntel)||{};
  const content=el('div',undefined,{class:'stack'});
  if(unit.enemy)content.append(enemyIntelGauge(unit));
  const group=(title,unlock)=>section(title,note('관찰도 '+unlock+'에서 해금'));
  if(info.stats){
    const {hp,maxHp,move,actions}=info.stats;
    content.append(section('능력치',note('체력 '+hp+'/'+maxHp+' · 이동력 '+move+' · 행동력 '+actions),
      ...(!unit.enemy?[note('정신력 '+unit.mind+'/100 · 위력 '+signed(mentalPower(unit.mind))),note('보호막 '+unit.shield)]:[])));
  }else content.append(group('능력치',25));
  if(info.actions){
    const cards=el('div',undefined,{class:'enemy-intel-cards'});
    for(const card of info.actions){
      const face=el('article',undefined,{class:'forge-preview'});
      renderCardFace(face,card);
      cards.append(face);
    }
    content.append(section('행동 목록',info.actions.length?cards:note('공개된 행동이 없어요.')));
  }else content.append(group('행동 목록',50));
  if(info.passives){
    const passives=section('패시브');
    for(const passive of info.passives){
      const detail=el('div',undefined,{class:'stack'});
      detail.append(el('strong',passive.name));
      if(passive.notes)detail.append(note(passive.notes));
      for(const effect of passive.effects||[])detail.append(note(effectConditionText(effect)+effectTiming(effect)+' · '+effectSentence(effect)));
      passives.append(detail);
    }
    if(!info.passives.length)passives.append(note('공개된 패시브가 없어요.'));
    const mindText=info.mind?.managed===false?'이 적은 정신력 변동이 적용되지 않아요.':'공개된 조건이 없어요.';
    const recover=info.mind?.managed?[
      '전투 승리 시 +10',
      '체력 25% 이하에서 25%를 넘겨 회복하면 전투당 한 번 +5',
      '아군을 향한 공격을 가로채 합에서 이기면 +5',
      '정신력 회복 효과와 지속 회복 적용'
    ]:[mindText];
    const loss=info.mind?.managed?[
      '한 번에 최대 체력의 25% 이상 체력 피해를 받으면 −10',
      '카드의 정신력 소모, 정신 피해, 지속 정신 피해 적용'
    ]:[mindText];
    content.append(passives,section('정신력 회복 조건',...recover.map(note)),section('정신력 감소 조건',...loss.map(note)));
  }else content.append(group('패시브',100),group('정신력 회복 조건',100),group('정신력 감소 조건',100));
  return content;
}
function battleSettingsButton(){
  return button('⚙ 설정',()=>{
    const dialog=battleDialog('전투 설정',battleMusicSettings(()=>state.battle,{el,button,field,input,select}));
    dialog.addEventListener('close',()=>{closeBattleMusicSettings(state.battle);dialog.remove();},{once:true});
    document.body.append(dialog);
    dialog.showModal();
  });
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
  if(self?.sealedHighest?.round===b.round){
    const locked=self.hand?.[self.sealedHighest.index];
    if(locked)controls.append(note('압류 표식 · '+locked.name+' 사본 1장 봉인 · 기대 위력 '+self.sealedHighest.power));
  }
  if(state.manager&&b.phase==='planning'){
    const advance=button('라운드 진행',()=>send('round'),true);
    advance.disabled=awaiting.length>0;
    controls.append(advance);
  }
  if(state.manager&&b.phase==='finished')controls.append(button('다음 전투 준비',()=>send('reset'),true));
  if(b.encounter?.subdueOrder?.length)controls.append(note('제압 순서 · '+b.encounter.subdueOrder.map(key=>({leader:'지휘관',shield:'방패병',sniper:'저격수'})[key]).join(' → ')));
  if(self?.judgmentMark)controls.append(note('죄인의 표식 · 심판자에게 받는 피해 +35% · 직접 합 위력 −6'));
  if(Array.isArray(b.encounter?.rank)&&b.encounter.rank.length)controls.append(note('직전 라운드 피해 순위 · '+b.encounter.rank.map(item=>item.name+' '+item.damage).join(' / ')));
  if(b.encounter?.negotiating)controls.append(note('협상 파훼 · 수금원 공격 정지 · 받는 피해 +25%'));
  if(b.outcome){
    const result=({peace:'평화 해소',break:'강제 격파',paid:'완납',seized:'강제 회수',installment:'분할 납부',balance:'균형 회복',blunt:'강제 판결',level:'수평의 정적',clearLine:'조준선 해제',cutCommand:'지휘 차단',railSubdued:'보안반 제압',inspect:'검문 응답'})[b.outcome.kind]||'조우 실패';
    controls.append(note(result+(b.outcome.extract?' · 추출 '+b.outcome.extract.total+'/'+b.outcome.extract.need:'')+
      (b.outcome.orb?' · 개념구 획득':'')));
  }
  const menu=el('details',undefined,{class:'battle-menu'});
  const menuItems=el('div');
  menu.append(el('summary','☰ 전투 메뉴'),menuItems);
  const saves=saveSlotsPanel();
  if(saves)menuItems.append(saves);
  if(state.manager&&b.phase==='planning'){
    const choices=b.units.filter(u=>!u.enemy&&u.hp>0);
    const settings=formFor('intent',(_,data)=>({target:data.get('target'),foeIntent:data.get('foeIntent')}));
    if(b.intentQueue?.length)settings.append(field('대상을 바꿀 예고',select('foeIntent',
      b.intentQueue.map(intent=>[intent.id,intent.card.name]),b.intentQueue[0].id)));
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
  heading.append(el('p',b.encounter?.name||'빈 객차',{class:'tag'}),el('h2',b.phase==='finished'?'전투 '+b.result:'라운드 '+b.round));
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
  const links=document.createElementNS('http://www.w3.org/2000/svg','svg');
  links.setAttribute('class','battle-action-links');links.setAttribute('aria-hidden','true');board.append(links);
  const allyPanel=el('div',undefined,{class:'battle-side left'});
  const intentPreview=el('div',undefined,{class:'battle-intent-preview',hidden:true});
  const forecast=el('div',undefined,{class:'clash-forecast','aria-live':'polite'});
  const recentClash=b.log.slice().reverse().find(line=>line.startsWith('합 '));
  if(recentClash)forecast.textContent='직전 '+recentClash;

  for(const {node,intent,unit} of fieldView.nodes){
    const show=()=>{
      const victim=b.units.find(value=>value.id===intent.target);
      intentPreview.replaceChildren(actionPanel(unit.name+(victim?' → '+victim.name:''),intent.card,unit));
      intentPreview.hidden=false;
      const rect=node.getBoundingClientRect();
      const width=intentPreview.offsetWidth;
      intentPreview.style.left=Math.max(8,Math.min(innerWidth-width-8,rect.left+rect.width/2-width/2))+'px';
      intentPreview.style.top=Math.max(8,Math.min(innerHeight-intentPreview.offsetHeight-8,rect.bottom+9))+'px';
    };
    node.onpointerenter=show;
    node.onfocus=show;
    node.onpointerleave=()=>{intentPreview.hidden=true;};
    node.onblur=()=>{intentPreview.hidden=true;};
    node.onclick=event=>{event.stopPropagation();show();};
  }
  const nav=el('nav',undefined,{class:'battle-session-nav','aria-label':'전투 중 세션 메뉴'});
  nav.append(el('a','← 방으로',{href:'/room/'+code}));
  for(const [key,label] of [['character','캐릭터'],['cards','카드 · 덱'],['dialogue','대화창 열기']]){
    nav.append(button(label,()=>document.querySelector('#tabs [data-tab="'+key+'"]').click()));
  }
  nav.append(battleSettingsButton());
  board.append(fieldView.frame,topbar,nav,fieldView.tools,allyPanel,intentPreview,forecast,battleDialoguePanel());
  const poisonAmount=u=>(u.poison||0)+(u.damageOverTime||[]).reduce((sum,dot)=>sum+dot.amount,0);
  const unitStats=el('div',undefined,{class:'stack'});
  for(const u of b.units){
    const chips=el('div',undefined,{class:'chips'});
    const tags=u.enemy&&!u.enemyIntel?.stats?['관찰 '+u.intelProgress+'/100']:['체력 '+u.hp+'/'+u.maxHp];
    if(u.inks)tags.push('영감 · 마젠타 '+u.inks.magenta+' · 시안 '+u.inks.cyan+' · 옐로우 '+u.inks.yellow+' · 블랙 '+u.inks.black);
    if(u.scribeRecord?.through>=b.round)tags.push('녹음 중 · 체력 '+u.scribeRecord.hp+' · 정신력 '+u.scribeRecord.mind);
    if(u.whiteMaze?.through>=b.round)tags.push('하얀 복도 · '+(u.whiteMaze.through-b.round)+'라운드');
    if(u.redBleed)tags.push('출혈 · 위력 '+u.redBleed.power+' · 횟수 '+u.redBleed.count);
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
    const detail=unitIntelInspection(u);
    const portrait=battleArt(u,u.pose||'idle');
    if(portrait)detail.prepend(el('img',undefined,{src:portrait,alt:u.name,class:'character-art-preview-image'}));
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
    for(const slot of u.shieldSlots||[]){
      detail.append(note('보호막 '+slot.amount+(slot.cap?'/'+slot.cap:'')+
        (slot.temporary?' · 이번 라운드':slot.through!=null?' · '+(slot.through-b.round+1)+'라운드':'')));
    }
    detail.append(...stackLabels(u).map(note));
    for(const [name,count] of Object.entries(u.stacks)){
      const basic=basicStacks[name];
      if(count>0&&basic?.endDecay&&(!basic.sub||u.stackTraits?.[name]?.sub)){
        detail.append(note(name+' · 턴 종료 후 보유 횟수 '+basic.endDecay+' 감소'));
      }
    }
    for(const [name,trait] of Object.entries(u.stackTraits||{})){
      if(!u.stacks[name]&&!stackPotency(u,name))continue;
      if(trait.flavor)detail.append(flavorText(name+' · '+trait.flavor));
      for(const effect of trait.effects||[]){
        detail.append(note(name+' · '+stackEffectText(effect)));
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
  let linkFrame=0;
  function drawActionLinks(){
    linkFrame=0;
    if(!board.isConnected)return;
    links.replaceChildren();
    const bounds=board.getBoundingClientRect();
    const centerOf=element=>{
      if(!element)return null;
      const rect=element.getBoundingClientRect();
      return [rect.left+rect.width/2-bounds.left,rect.top+rect.height/2-bounds.top];
    };
    const arrow=(from,to,tone)=>{
      if(!from||!to)return;
      const [x,y]=from,[u,v]=to,angle=Math.atan2(v-y,u-x);
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      const wing=offset=>[u-9*Math.cos(angle+offset),v-9*Math.sin(angle+offset)].join(' ');
      path.setAttribute('d',`M ${x} ${y} L ${u} ${v} M ${wing(-.5)} L ${u} ${v} L ${wing(.5)}`);
      path.setAttribute('class',tone);
      links.append(path);
    };
    const nodes=new Map(fieldView.nodes.map(entry=>[entry.intent.id||'enemy',entry]));
    for(const entry of localNodes)nodes.set(entry.intent.id,entry);
    const positionOf=id=>id===self?.id?linkPosition:b.units.find(unit=>unit.id===id)?.pos;
    const anchored=new Set();
    const replies=new Map();
    for(const entry of nodes.values()){
      if(entry.unit.enemy)continue;
      const action=entry.intent,from=centerOf(entry.node);
      const opposing=nodes.get(action.actionLink||(action.clash?(action.foeIntent||'enemy'):''));
      if(opposing){
        const other=centerOf(opposing.node);
        if(opposing.unit.enemy&&(action.clash||action.card.role==='guard')){
          const mid=from.map((value,index)=>(value+other[index])/2);
          arrow(from,mid,action.clash?'clashing':'outgoing');
          arrow(other,mid,action.clash?'clashing':'incoming');
          anchored.add(opposing.intent.id||'enemy');
        }else{
          arrow(from,other,'outgoing');
          if(opposing.unit.enemy&&opposing.intent.target===entry.unit.id)replies.set(opposing.intent.id||'enemy',from);
        }
      }else if(action.targetTile!=null)arrow(from,centerOf(fieldView.tiles[action.targetTile]),'outgoing');
      else for(const id of action.targets||[])arrow(from,centerOf(fieldView.tiles[positionOf(id)]),'outgoing');
    }
    for(const [id,entry] of nodes)if(entry.unit.enemy&&!anchored.has(id)&&entry.intent.reachable)
      arrow(centerOf(entry.node),replies.get(id)||centerOf(fieldView.tiles[positionOf(entry.intent.target)]),'incoming');
  }
  const scheduleLinks=()=>{if(!linkFrame)linkFrame=requestAnimationFrame(drawActionLinks);};
  let localNodes=[];
  let linkPosition=self?.pos;
  board.addEventListener('pointermove',scheduleLinks);
  board.addEventListener('wheel',scheduleLinks);
  fieldView.tools.addEventListener('click',scheduleLinks);
  if(b.phase==='planning'&&self?.hp&&self.instantMove>0){
    const barriers=new Set([...occupied,...(b.extraWalls||[]).filter(wall=>wall.ownerSide!==self.enemy).map(wall=>wall.index)]);
    const routes=self.rooted||self.blockedRounds?new Map():gridPaths(self.pos,self.instantMove,barriers);
    status.textContent='즉시 이동력 '+self.instantMove+' · 이동할 칸을 누르거나 남은 이동력을 넘기세요.';
    controls.append(button('남은 즉시 이동력 넘기기',()=>send('instantMove',{skip:true})));
    for(const [pos,path] of routes){
      if(!path.length)continue;
      const tile=fieldView.tiles[pos];
      tile.classList.add('instant-move-tile');
      tile.setAttribute('aria-label','즉시 이동 · 이동력 '+path.length+' 사용');
      tile.onclick=()=>{battleDraft=null;send('instantMove',{pos});};
    }
    scheduleLinks();
    return board;
  }
  if(!active){
    fieldView.overlay.replaceChildren();scheduleLinks();
    fieldView.tiles.forEach((tile,i)=>{const u=unitAt(i);tile.setAttribute('aria-disabled',String(!u));if(u)tile.onclick=()=>inspect(u);});
    status.textContent=b.phase==='finished'?'전투 '+b.result:self?.blockedRounds?'행동 불가 · 이번 라운드에는 이동하거나 행동할 수 없어요.':awaiting.length?'행동 확정 대기 · '+awaiting.join(', '):state.manager?'라운드를 진행할 수 있어요.':'GM이 라운드를 진행할 때까지 기다려 주세요.';
    return board;
  }
  const planned=self.plan;
  const draftKey=b.round+':'+self.id+(collapsed?':collapsed':crisis?':crisis':'');
  if(!battleDraft||battleDraft.key!==draftKey){
    battleDraft={key:draftKey,card:planned?.card??(planned?'':null),targetTile:planned?.targetTile??null,pos:planned?.pos??self.pos,targets:planned?.targets??[],clash:!!planned?.clash,stance:planned?.stance||(planned?.clash?'clash':'unopposed'),discard:planned?.discard||'',copyId:planned?.copyId||'',vow:planned?.vow||self.crisisVow||''};
  }
  const editable=!self.ready;
  const actionLimit=self.actionLimit??baseActions;
  const freeActions=Number(self.hand.some(card=>card.freeAction));
  const slotCount=Math.max(1,actionLimit+freeActions);
  const actionFields=({card=null,targets=[],clash=false,stance,foeIntent='',copyId='',targetTile=null,actionLink=''}={})=>({card,targets,clash,foeIntent,actionLink,stance:stance||(clash?'clash':'unopposed'),copyId,targetTile});
  const draft=editable?battleDraft:{...planned};
  draft.slots??=(draft.cards||[draft]).map(actionFields);
  draft.slots.length=Math.min(draft.slots.length,slotCount);
  while(draft.slots.length<slotCount)draft.slots.push(actionFields());
  if(!actionLimit&&!freeActions)Object.assign(draft,actionFields({card:''}));
  if(draft.slot==null||draft.slot>=slotCount){
    draft.slot=0;
    Object.assign(draft,actionLimit||freeActions?draft.slots[0]:actionFields({card:''}));
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
  queue.hidden=slotCount<=1;
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
    label.draggable=editable&&!!card.id;
    label.ondragstart=event=>{
      if(label.disabled||!card.id){event.preventDefault();return;}
      if(draft.card!==card.id){Object.assign(draft,actionFields({card:card.id}));moveMode=false;refresh();}
      event.dataTransfer.setData('application/x-conceptterra-action',card.id);
      event.dataTransfer.effectAllowed='link';
    };
    const art=state.profile.cards.find(entry=>entry.id===card.id)?.image;
    label.onclick=()=>{
      const next=draft.card===card.id?null:card.id;
      Object.assign(draft,actionFields({card:next}));
      moveMode=false;

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
  const clash=select('stance',[['unopposed','일방행동'],['clash','합'],['intercept','가로채기']],draft.stance||'unopposed');
  const clashLabel=field('공격 방식',clash,'inline');
  const foeIntent=select('foeIntent',(b.intentQueue||[]).map(intent=>[intent.id,
    (b.units.find(unit=>unit.id===intent.attacker)?.name||'적')+' · '+intent.card.name]),draft.foeIntent||'');
  const foeIntentLabel=field('합을 걸 예고',foeIntent,'inline');
  foeIntentLabel.hidden=!b.intentQueue;
  foeIntent.disabled=!editable;
  foeIntent.onchange=()=>{draft.foeIntent=foeIntent.value;refresh();};
  if(!Array.isArray(draft.discard))draft.discard=draft.discard?[draft.discard]:[];
  const discarded=new Map();
  const discardLabel=el('details',undefined,{class:'battle-discard'});
  discardLabel.append(el('summary','라운드 종료에 버릴 카드 선택'));
  const counts=new Map();
  for(const card of realHand){
    const index=counts.get(card.id)||0;
    counts.set(card.id,index+1);
    const control=input(undefined,'1','checkbox',{});
    control.checked=draft.discard.filter(id=>id===card.id).length>index;
    discardLabel.append(field(card.name,control,'inline'));
    const copies=discarded.get(card.id)||[];
    copies.push(control);
    discarded.set(card.id,copies);
    control.onchange=()=>{
      draft.discard=[...discarded].flatMap(([id,choices])=>choices.filter(choice=>choice.checked).map(()=>id));
      refresh();
    };
  }
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
    if(commit.disabled||realHand.length-slotChoices().filter(slot=>slot.card&&realHand.some(card=>card.id===slot.card)).length-draft.discard.length>12)return;
    send('plan',{vow:draft.vow,cards:slotChoices().filter(slot=>slot.card),pos:draft.pos,discard:draft.discard});
  },true);
  const cancel=button('선택 초기화',()=>{
    draft.slots=Array.from({length:slotCount},()=>actionFields());
    Object.assign(draft,actionFields({card:actionLimit||freeActions?null:''}),{slot:0,pos:self.pos,discard:[]});
    moveMode=false;
    refresh();
  });
  setup.append(moveInfo,tileMode,clashLabel,foeIntentLabel,discardLabel,copyLabel);
  if(crisis)setup.prepend(vowLabel);
  dock.insertBefore(hand,controls);
  dock.insertBefore(setup,hand);
  dock.insertBefore(queue,setup);
  if(editable)controls.prepend(cancel,commit);
  else controls.prepend(button('확정 취소 · 수정',()=>send('unplan')));
  clash.onchange=()=>{draft.stance=clash.value;draft.clash=draft.stance!=='unopposed';refresh();};
  copy.onchange=()=>{draft.copyId=copy.value;refresh();};


  let localSignature='';
  function updateActionLinks(slots){
    const signature=JSON.stringify(slots);
    if(editable&&signature!==localSignature){
      localSignature=signature;
      for(const entry of localNodes)entry.node.remove();
      localNodes=[];
      const token=fieldView.tokens.get(self.id);
      if(token){
        token.querySelector('.battle-draft-nodes')?.remove();
        const row=el('div',undefined,{class:'battle-intent-nodes battle-draft-nodes'});
        for(const [index,slot] of slots.entries()){
          const card=self.hand.find(value=>value.id===slot.card);
          if(!card)continue;
          const node=el('button',String(index+1),{type:'button',class:'battle-intent-node allied','aria-label':'내 행동 '+(index+1)+' · '+card.name,draggable:'true'});
          node.onpointerdown=event=>event.stopPropagation();
          const chooseSlot=()=>{draft.slots[draft.slot]=actionFields(draft);draft.slot=index;Object.assign(draft,slot);};
          node.onclick=event=>{event.stopPropagation();chooseSlot();refresh();};
          node.ondragstart=event=>{event.stopPropagation();chooseSlot();event.dataTransfer.setData('application/x-conceptterra-action',card.id);event.dataTransfer.effectAllowed='link';};
          row.append(node);
          localNodes.push({unit:self,node,intent:{...slot,id:'draft:'+index,card}});
        }
        if(row.childElementCount)token.append(row);
      }
    }
    scheduleLinks();
  }
  const dropTargets=new WeakMap();
  let lastDrop=null;
  board.addEventListener('click',event=>{
    const target=event.target.closest('[data-intent-id],[data-unit-id],[data-tile]');
    if(lastDrop&&target===lastDrop.target&&performance.now()-lastDrop.at<150){
      event.preventDefault();event.stopImmediatePropagation();
    }
    lastDrop=null;
  },true);
  board.addEventListener('dragover',event=>{
    if(event.dataTransfer.types.includes('application/x-conceptterra-action')&&event.target.closest('[data-tile]')){
      event.preventDefault();event.dataTransfer.dropEffect='link';
    }
  });
  board.addEventListener('drop',event=>{
    if(!event.dataTransfer.getData('application/x-conceptterra-action'))return;
    const target=event.target.closest('[data-intent-id],[data-unit-id],[data-tile]');
    if(target){
      event.preventDefault();
      lastDrop={target,at:performance.now()};
      dropTargets.get(target)?.();
    }
  });

  function refresh(){
    const slots=slotChoices();
    const others=otherCards();
    const reserved=id=>others.filter(slot=>slot.card===id).length;
    const handCount=id=>self.hand.filter(card=>card.id===id).length;
    const playableCount=id=>handCount(id)-Number(self.sealedHighest?.round===b.round&&self.sealedHighest.id===id);
    for(const control of handRows.children){
      const id=control.dataset.card,choice=self.hand.find(card=>card.id===id);
      control.setAttribute('aria-pressed',String(id===(editable?draft.card:draft.card||'')));
      const paid=others.filter(slot=>slot.card&&!self.hand.find(card=>card.id===slot.card)?.freeAction).length;
      control.disabled=!editable||!!id&&(!choice?.freeAction&&paid>=actionLimit||!cardUsable(self,choice)||reserved(id)>=playableCount(id));
    }
    queueSlots.forEach((button,index)=>{
      const name=self.hand.find(card=>card.id===slots[index].card)?.name;
      button.textContent=(index+1)+'번 · '+(name||'비어 있음');
      button.setAttribute('aria-pressed',String(index===draft.slot));
    });
    const card=self.hand.find(c=>c.id===draft.card);
    const tileCapable=gridCanAimTile(card)&&(!collapsed||card?.target==='tile');
    const targetingTile=card?.target==='tile'||tileCapable&&draft.targetTile!=null;
    tileMode.hidden=true;
    tileMode.textContent=moveMode?'대상 칸 선택':'이동 칸 선택';
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
      if(collapsed&&choice.role!=='guard')return collapseTargets(choice,{...self,pos},b.units,b.walls);
      return b.units.filter(u=>u.hp>0&&gridCardHasReach(choice,pos,targetPos(u),b.walls)&&
        (choice.role==='guard'?!u.enemy&&u.id!==self.id:choice.target==='self'?u.id===self.id:
          choice.targetSide==='any'?true:choice.targetSide==='ally'?u.enemy===self.enemy&&(choice.includeSelf||u.id!==self.id):u.enemy));
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
    const intentQueue=b.intentQueue||[];
    const intent=intentQueue.find(item=>item.id===draft.foeIntent)||intentQueue[0]||b.intent;
    const foe=b.units.find(unit=>unit.id===(intent?.attacker||'enemy'));
    const target=b.units.find(unit=>unit.id===intent?.target);
    if(intent?.id){draft.foeIntent=intent.id;foeIntent.value=intent.id;}
    const clashTaken=others.some(slot=>slot.clash&&(!intent?.id||slot.foeIntent===intent.id));
    const incoming=intent?.reachable&&!intent.card.support&&target&&foe&&gridCardHasReach(intent.card,foe.pos,targetPos(target),b.walls);
    const canClash=!targetingTile&&!collapsed&&card?.clash&&!['guard','assist','counter'].includes(card.role)&&incoming&&chosen.has(foe?.id)&&!clashTaken&&(!intent.card.unredirectable||intent.target===self.id);
    if(editable){
      draft.targets=manual?[...chosen]:[];
      const canIntercept=canClash&&intent.target!==self.id&&
        gridCardHasReach(intent.card,foe.pos,pos,b.walls);
      clash.options[1].disabled=!canClash;
      clash.options[2].disabled=!canIntercept;
      if(!canClash||draft.stance==='intercept'&&!canIntercept){
        draft.clash=false;
        draft.stance='unopposed';
      }
    }
    clashLabel.hidden=true;
    foeIntentLabel.hidden=true;
    clashLabel.title=clashTaken?'이 예고에 이미 다른 행동을 예약했어요.':'합을 걸려면 적을 선택하세요.';
    clash.value=draft.stance||'unopposed';
    clash.disabled=!editable;
    const selected=slotChoices().filter(slot=>slot.card);
    for(const [id,choices] of discarded){
      const remaining=handCount(id)-selected.filter(slot=>slot.card===id).length;
      for(const [index,choice] of choices.entries()){
        choice.disabled=!editable||index>=remaining;
        choice.checked=index<remaining&&draft.discard.filter(cardId=>cardId===id).length>index;
      }
    }
    draft.discard=[...discarded].flatMap(([id,choices])=>choices.filter(choice=>choice.checked).map(()=>id));
    const overflow=Math.max(0,realHand.length-selected.length-draft.discard.length-12);
    discardLabel.firstElementChild.textContent=overflow?'라운드 종료에 '+overflow+'장을 더 버려야 합니다':
      '라운드 종료에 버릴 카드 · '+draft.discard.length+'장';
    fieldView.overlay.replaceChildren();
    linkPosition=pos;
    updateActionLinks(slotChoices());
    allyPanel.replaceChildren(...(card?[actionPanel(draft.clash?'내 합 카드':'내 행동',card,self,card.image)]:[]));
    forecast.textContent=draft.clash?'합 예고 · '+card.name+' ↔ '+intent.card.name:recentClash?'직전 '+recentClash:'';
    const path=paths.get(pos)||[],point=gridPoint(pos);
    if(path.length)fieldView.tiles[pos].append(marker);
    else marker.remove();
    moveInfo.textContent='이동 '+path.length+'/'+self.move+' · '+String.fromCharCode(65+point.x)+(point.y+1);
    const invalidSlot=slotChoices().findIndex((slot,index,choices)=>{
      if(!slot.card)return false;
      const choice=self.hand.find(card=>card.id===slot.card);
      if(!cardUsable(self,choice))return true;
      if(choices.filter(other=>other.card===slot.card).length>playableCount(slot.card))return true;
      if(choice.effects.some(effect=>effect.kind==='copyChosen')&&
        (!slot.copyId||handCount(slot.copyId)<=choices.slice(0,index+1).filter(other=>other.card===slot.copyId).length))return true;
      if(choice.target==='tile'||gridCanAimTile(choice)&&slot.targetTile!=null)return !legalTile(choice,slot.targetTile);
      if(choice.role==='counter')return false;
      const legal=candidatesFor(choice);
      if(choice.role==='guard')return slot.targets.some(id=>!legal.some(u=>u.id===id));
      if(!legal.length)return true;
      if(!collapsed&&gridTargetLimit(choice)){
        if(!slot.targets.length||slot.targets.some(id=>!legal.some(u=>u.id===id)))return true;
      }
      if(!slot.clash)return false;
      if(b.intentQueue){
        const scheduled=b.intentQueue.find(item=>item.id===slot.foeIntent);
        return !scheduled?.reachable||scheduled.card.support||!slot.targets.includes(scheduled.attacker);
      }
      return !incoming||clashTaken&&index===draft.slot;
    });
    const paid=selected.filter(slot=>!self.hand.find(card=>card.id===slot.card)?.freeAction).length;
    const ready=paid<=actionLimit&&invalidSlot<0&&(!actionLimit||selected.length>0||slotChoices().some(slot=>slot.card===''));
    commit.disabled=!ready||crisis&&!draft.vow;
    if(crisis)vowInfo.textContent='붕괴 직전 · 연속 '+(self.crisisProofs||0)+'/'+crisisRounds+' · '+self.collapseRound+'라운드 종료까지 · '+(crisisVowRules[draft.vow]||'세 라운드 연속 같은 뜻을 지키세요.');
    const names=countering?'반격 대기':guarding?(designated?.name||'자동 엄호'):candidates.filter(u=>chosen.has(u.id)).map(u=>u.name).join(', ');
    if(!editable)status.textContent='행동 확정 · '+(selected.map(slot=>self.hand.find(card=>card.id===slot.card)?.name).filter(Boolean).join(' → ')||'이동만 / 대기')+(awaiting.length?' · 대기 '+awaiting.length+'명':' · 라운드 진행 대기');
    else if(invalidSlot>=0&&invalidSlot!==draft.slot)status.textContent=(invalidSlot+1)+'번 카드의 대상 또는 선택을 확인하세요.';
    else if(draft.card===null)status.textContent='손패에서 카드를 고르세요. 이동할 칸도 선택할 수 있어요.';
    else if(!actionLimit&&!freeActions)status.textContent='행동량 0 · 카드를 사용할 수 없어요. 이동하거나 대기하세요.';
    else if(!card)status.textContent='이동할 칸을 선택하거나 현재 위치에서 대기하세요.';
    else if(requiresCopy&&!copy.value)status.textContent=copy.options.length>1?'손패에서 복제할 카드를 고르세요.':'복제할 다른 카드가 손패에 없어요.';
    else if(guarding)status.textContent=designated
      ?'지정 엄호 · '+designated.name+(coverInRange?' · 다시 누르면 자동 엄호':' · 사거리 밖 · 이동하거나 대상을 다시 눌러 해제하세요.')
      :'자동 엄호 · 아군을 눌러 지정하거나 그대로 확정하세요.';
    else if(countering)status.textContent=counterHelp;
    else if(targetingTile)status.textContent=moveMode?'이동할 칸을 누르세요.':
      center==null?'카드나 행동 노드를 광역 중심 칸으로 끌어다 놓으세요. 빈 칸도 지정할 수 있어요.':
        '광역 중심 '+(primary?.name||'빈 칸')+(secondary.length?' · 예상 부 대상 '+secondary.map(unit=>unit.name).join(', '):' · 예상 부 대상 없음');
    else if(card.splash)status.textContent=primary
      ?'주 대상 '+primary.name+(secondary.length?' · 예상 부 대상 '+secondary.map(unit=>unit.name).join(', '):' · 범위 안에 부 대상 없음')
      :candidates.length?'카드나 행동 노드를 주 대상에게 끌어다 놓으세요.':'사거리 안에 주 대상이 없어요.';
    else if(automatic&&candidates.length)status.textContent=card.target==='self'?'자신에게 사용':'예상 자동 표적 · '+names+' · 행동 시 다시 계산';
    else if(!candidates.length)status.textContent=tileCapable?'사거리 안의 칸을 지정할 수 있어요.':'사거리 안에 대상이 없어요. 이동할 칸이나 카드를 바꿔 보세요.';
    else if(manual)status.textContent=chosen.size?'대상 '+chosen.size+'/'+card.target+' · '+names:'카드나 행동 노드를 대상에게 끌어다 놓으세요. 최대 '+card.target+'명';
    else status.textContent=(card.target==='area'?'광역 대상 · ':'자신에게 사용 · ')+names;

    const pickUnit=(unit,intentNode)=>{
      const choice=candidates.find(candidate=>candidate.id===unit.id);
      if(!editable||!card)return false;
      if(intentNode&&guarding){
        const protectedUnit=b.units.find(value=>value.id===intentNode.target);
        if(protectedUnit&&!protectedUnit.enemy&&(protectedUnit.id===self.id||candidates.includes(protectedUnit))){
          draft.targets=protectedUnit.id===self.id?[]:[protectedUnit.id];draft.actionLink=intentNode.id||'enemy';draft.clash=false;draft.stance='unopposed';refresh();return true;
        }
      }
      if(!choice||!(guarding||targetLimit))return false;
      const ids=new Set(draft.targets.filter(id=>candidates.some(candidate=>candidate.id===id)));
      if(!intentNode&&ids.has(unit.id)&&draft.targetTile==null&&draft.stance==='unopposed')ids.delete(unit.id);
      else if(guarding||targetLimit===1){ids.clear();ids.add(unit.id);}
      else if(ids.size<targetLimit||ids.has(unit.id))ids.add(unit.id);
      else return false;
      draft.targets=[...ids];
      draft.targetTile=null;
      draft.stance='unopposed';draft.clash=false;draft.foeIntent='';draft.actionLink=intentNode?(intentNode.id||'enemy'):'';
      if(intentNode){
        const victim=b.units.find(value=>value.id===intentNode.target);
        const already=others.some(slot=>slot.clash&&(!intentNode.id||slot.foeIntent===intentNode.id));
        if(unit.enemy&&!already&&card.clash&&!['guard','assist','counter'].includes(card.role)&&intentNode.reachable&&!intentNode.card.support&&
            victim?.hp&&(!intentNode.card.unredirectable||victim.id===self.id)&&gridCardHasReach(intentNode.card,unit.pos,pos,b.walls)){
          draft.stance=victim.id===self.id?'clash':'intercept';
          draft.clash=true;
          draft.foeIntent=intentNode.id||'';
        }
      }
      refresh();
      return true;
    };
    for(const {node,intent:scheduled,unit} of fieldView.nodes){
      node.setAttribute('aria-pressed',String(draft.clash&&(scheduled.id?scheduled.id===draft.foeIntent:unit.id==='enemy')));
      node.onclick=event=>{event.stopPropagation();node.onfocus();};
      dropTargets.set(node,()=>{
        if(!pickUnit(unit,scheduled)){
          if(editable&&card?.target==='tile'&&legalTile(card,unit.pos)){draft.targetTile=unit.pos;refresh();}
          else node.onfocus();
        }
      });
    }
    for(const [id,token] of fieldView.tokens){
      const unit=b.units.find(value=>value.id===id);
      token.onclick=event=>{event.stopPropagation();inspect(unit);};
      dropTargets.set(token,()=>{
        if(!pickUnit(unit)){
          if(editable&&card?.target==='tile'&&legalTile(card,unit.pos)){draft.targetTile=unit.pos;refresh();}
        }
      });
    }
    fieldView.tiles.forEach((tile,i)=>{
      const targetUnit=manual?(candidates.find(u=>targetPos(u)===i)||(designated?.pos===i?designated:null)):null;
      const canAimTile=editable&&tileCapable&&legalTile(card,i);
      const isChosen=targetingTile?center===i:guarding?designated?.pos===i:candidates.some(u=>targetPos(u)===i&&chosen.has(u.id));
      const inspected=unitAt(i);
      tile.classList.toggle('reachable',editable&&canMove(i));
      tile.classList.toggle('in-range',!!card&&gridCardHasReach(card,pos,i,b.walls)&&!b.walls.includes(i));
      tile.classList.toggle('path-cell',path.includes(i));
      tile.classList.toggle('picked',i===pos);
      tile.classList.toggle('targetable',canAimTile||editable&&!!targetUnit);
      tile.classList.toggle('tile-center',targetingTile&&isChosen);
      tile.classList.toggle('aimed',isChosen);
      const splashTile=!!card?.splash&&splashCenter!=null&&i!==splashCenter&&gridCardInRange(card.splash,splashCenter,i)&&!b.walls.includes(i);
      const secondaryTarget=secondary.some(u=>u.pos===i);
      tile.classList.toggle('splash-range',splashTile);
      tile.classList.toggle('splash-target',secondaryTarget);
      tile.setAttribute('aria-disabled',String(!inspected&&(!editable||(!canAimTile&&!canMove(i)&&!targetUnit))));
      const position=gridPoint(i),coord=String.fromCharCode(65+position.x)+(position.y+1);
      const occupant=targetUnit||inspected;
      tile.setAttribute('aria-label',coord+(occupant?' · '+occupant.name:'')+(isChosen?(targetingTile?' · 광역 중심':primary?' · 주 대상':automatic?' · 예상 자동 표적':' · 선택된 대상'):secondaryTarget?' · 예상 부 대상':canAimTile?' · 광역 중심 지정 가능':targetUnit?' · 대상 지정 가능':editable&&canMove(i)?' · 이동 가능':''));
      dropTargets.set(tile,()=>{
        if(canAimTile){
          draft.targetTile=center===i?null:i;draft.targets=[];draft.stance='unopposed';draft.clash=false;draft.foeIntent='';draft.actionLink='';refresh();return;
        }
        if(editable&&targetUnit&&!tileCapable)pickUnit(targetUnit);
      });
      tile.onclick=()=>{
        if(editable&&canMove(i)){draft.pos=i;refresh();return;}
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


function dialogueForm(label,placeholder,speaker){
  const message=area('message','',500);
  message.required=true;
  message.setAttribute('aria-label',label);
  message.placeholder=placeholder;
  const post=submit('보내기');
  const form=el('form',undefined,{class:'dialogue-input'});
  form.append(message,post);
  form.onsubmit=async event=>{
    event.preventDefault();
    const draft=message.value;
    if(busy||post.disabled||!draft.trim())return;
    post.disabled=true;
    try{
      if(await send('dialogue',{message:draft,...(speaker?.value?{speaker:speaker.value}:{})})&&message.value===draft)message.value='';
    }finally{post.disabled=false;if(form.isConnected)message.focus();}
  };
  return form;
}
let battleDialogue;
function battleDialoguePanel(){
  if(!battleDialogue){
    const root=el('details',undefined,{class:'battle-dialogue'});
    const history=el('ol',undefined,{class:'battle-dialogue-log','aria-label':'최근 세션 대화','aria-live':'polite'});
    root.append(el('summary','전투 채팅'),history,dialogueForm('전투 채팅 대사','전투 중 대사 입력'));
    battleDialogue={root,history,lastId:null};
  }
  const {root,history}=battleDialogue;
  const entries=(state.dialogue||[]).slice(-12);
  const lastId=entries.at(-1)?.id||'';
  if(battleDialogue.lastId!==lastId){
    const follow=history.scrollHeight-history.clientHeight-history.scrollTop<18;
    const top=history.scrollTop;
    history.replaceChildren(...entries.map(entry=>{
      const row=el('li');
      row.append(el('strong',entry.name),document.createTextNode(' · '+entry.message));
      return row;
    }));
    if(!entries.length)history.append(el('li','아직 대사가 없어요.'));
    history.scrollTop=follow?history.scrollHeight:top;
    battleDialogue.lastId=lastId;
  }
  return root;
}
let dialogue;
function dialoguePanel(){
  if(!dialogue){
    const stage=el('div',undefined,{class:'dialogue-stage'});
    const portraits=el('div',undefined,{class:'dialogue-portraits','aria-hidden':'true'});
    const speaker=el('strong','대화');
    const words=el('p','첫 대사를 입력해 이야기를 시작하세요.');
    const line=el('div',undefined,{class:'dialogue-line','aria-live':'polite'});
    line.append(speaker,words);
    stage.append(portraits,line);
    const speakerSelect=select('dialogueSpeaker',[],'');
    const controls=el('div',undefined,{class:'dialogue-gm-controls'});
    controls.append(searchableSelect('말하는 적',speakerSelect));
    const portrait=input('dialoguePortrait','','file',{accept:'image/png,image/jpeg,image/webp'});
    const register=button('적 스탠딩 저장',async()=>{
      if(!speakerSelect.value||!portrait.files.length)return;
      const selected=speakerSelect.value;
      try{
        const image=await imageData(portrait.files[0],maxPortraitDataLength,maxPortraitSide,.86);
        if(await send('dialogueEnemyArt',{speaker:selected,image}))portrait.value='';
      }catch(error){errors.textContent=error.message;}
    });
    const portraitControl=el('div',undefined,{class:'row'});
    portraitControl.append(field('선택한 적의 스탠딩',portrait),register);
    controls.append(portraitControl);
    speakerSelect.onchange=()=>{portraitControl.hidden=!speakerSelect.value;};
    const form=dialogueForm('대사','대사를 입력하세요',speakerSelect);
    const compose=el('div',undefined,{class:'dialogue-compose'});
    compose.append(form,controls);
    const transcript=el('details',undefined,{class:'dialogue-history'});
    const history=el('ol',undefined,{class:'log'});
    transcript.append(el('summary','대화 기록'),history);
    const root=section('세션 대화',stage,compose,transcript);
    dialogue={root,portraits,speaker,words,history,controls,speakerSelect,portraitControl,actors:new Map(),latest:null};
  }
  const {root,portraits,speaker,words,history,actors}=dialogue;
  const {controls,speakerSelect,portraitControl}=dialogue;
  controls.hidden=!state.manager;
  const foes=state.manager?state.dialogueFoes||[]:[];
  const menu=JSON.stringify(foes);
  if(dialogue.foeMenu!==menu){
    dialogue.foeMenu=menu;
    const previous=speakerSelect.value;
    speakerSelect.replaceChildren(el('option','내 캐릭터 / GM',{value:''}),...foes.map(foe=>el('option',foe.name+(foe.portrait?' · 스탠딩 등록됨':''),{value:foe.id})));
    speakerSelect.value=foes.some(foe=>foe.id===previous)?previous:'';
    selectSearches.get(speakerSelect)?.();
  }
  portraitControl.hidden=!speakerSelect.value;
  const messages=state.dialogue||[];
  const latest=messages.at(-1);
  if(!latest||latest.id===dialogue.latest)return root;
  dialogue.latest=latest.id;
  const cast=new Map();
  for(const entry of messages){
    for(const [id,other] of cast)if(id!==entry.actor&&entry.at-other.at>=10000)cast.delete(id);
    cast.set(entry.actor,entry);
  }
  const previous=new Map([...actors].map(([id,node])=>[id,node.getBoundingClientRect().left]));
  for(const [id,node] of actors)if(!cast.has(id)){node.remove();actors.delete(id);}
  const animate=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const [id,entry] of cast){
    let node=actors.get(id);
    if(!node){node=el('div',undefined,{class:'dialogue-actor'});actors.set(id,node);portraits.append(node);}
    const art=entry.portraitKey?artUrl(entry.portraitKey,'dialogue.enemy',entry.artVersion):
      entry.enemy?battleArt({id,name:entry.name},'idle'):entry.artVersion!=null?artUrl(id,'normal.idle',entry.artVersion):null;
    if(!node.firstChild||node.dataset.art!==(art||'')||node.dataset.name!==entry.name){
      const fallback=el('span',Array.from(entry.name)[0]||'?',{class:'dialogue-placeholder'});
      if(art){
        const image=el('img',undefined,{src:art,alt:'',class:art.includes('/dark-halo-standing.png')?'dark-halo-portrait':undefined});
        image.onerror=()=>image.replaceWith(fallback);
        node.replaceChildren(image);
      }else node.replaceChildren(fallback);
      node.dataset.art=art||'';
      node.dataset.name=entry.name;
    }
    node.classList.toggle('speaking',id===latest.actor);
  }
  speaker.textContent=latest.name;
  words.textContent=latest.message;
  history.replaceChildren(...messages.map(entry=>{
    const row=el('li');
    row.append(el('strong',entry.name),document.createTextNode(' · '+entry.message));
    return row;
  }));
  if(root.isConnected&&animate){
    for(const [id,node] of actors){
      const shift=previous.get(id)-node.getBoundingClientRect().left;
      if(Number.isFinite(shift)&&Math.abs(shift)>1)node.animate([{transform:'translateX('+shift+'px)'},{transform:'translateX(0)'}],{duration:500,easing:'ease'});
    }
    actors.get(latest.actor)?.firstElementChild?.animate([{transform:'translateY(0)'},{transform:'translateY(-14px)',offset:0.38},{transform:'translateY(0)'}],{duration:360,easing:'ease-out'});
  }
  return root;
}
function render(){
  syncBattleMusic(state?.battle);
  if(!state)return;
  for(const list of panel.querySelectorAll('.card-list-scroll'))cardListPositions.set(list.ariaLabel,list.scrollTop);
  panel.closest('main').classList.toggle('card-studio-page',tab==='cards');
  for(const x of document.querySelectorAll('#tabs button'))x.setAttribute('aria-pressed',String(x.dataset.tab===tab));
  if(tab==='dialogue'){
    const root=dialoguePanel();
    if(root.parentNode!==panel)panel.replaceChildren(root);
    return;
  }
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
      if(next.revision!==state.revision||next.collectionRevision!==state.collectionRevision||next.manager!==state.manager||JSON.stringify(next.roster)!==JSON.stringify(state.roster)||JSON.stringify(next.saveSlots)!==JSON.stringify(state.saveSlots)){
        const chatChanged=next.dialogue?.at(-1)?.id!==state.dialogue?.at(-1)?.id;
        const sameBattle=chatChanged&&['battle','roster','pendingEdits','saveSlots','profile','manager'].every(key=>JSON.stringify(next[key])===JSON.stringify(state[key]));
        const newRound=next.battle?.round!==state.battle?.round||next.battle?.phase!==state.battle?.phase;
        state=next;
        syncBattleMusic(state.battle);
        if(newRound)battleDraft=null;
        if(tab==='battle'&&sameBattle&&battleDialogue?.root.isConnected)battleDialoguePanel();
        else if(tab==='battle'||!draftDirty){draftDirty=false;render();}
      }
    }catch{}
  },2300);
}catch(err){
  errors.textContent=err.message;
  panel.replaceChildren(studio?accountPanel():el('a','방으로 돌아가기',{href:'/room/'+code}));
}
