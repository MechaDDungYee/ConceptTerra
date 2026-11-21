import {gridCanAimTile,gridIndex,gridValid, gridSize, gridTileGroups, gridDistance, gridPoint, gridLineOfSight, gridPaths, gridDisplacement, gridCardInRange,gridCardHasReach, gridTargetLimit, gridSplashTargets, maxRangeX, maxRangeY, customRangeRadius, maxRangeRadius, collapseTargets} from '../public/grid.js';
import {instantMoveModes,instantMoveDirections,instantMoveOffsets,instantMoveAnchors,instantMoveOrders,instantMoveStackTests,instantMoveStackMetrics,maxInstantMove,maxPortraitDataLength,maxConceptTools,keywordOwnedZones,keywordScanModes,keywordScanPeriods,stackScanScopes,stackScanMetrics,stackGainLimits,stackGainLimitMax,durationPolicies,durationPolicyKinds,maxDurationCap,shieldGrantEffects,shieldStackModes,locationTags,locationTagAliases,revealThresholds,trainReturnMind,baseHp,characterCombatStats,lifeStealDamageTypes,lifeStealVictims,lifeStealHealers,lifeStealDamageResources,lifeStealBases,lifeStealShieldModes,lifeStealRecoveryResources,shieldConversionOutputs,damageConversionFormulaModes,damageConversionUnits,stackRatioBases,stackRatioEffects,effectNumberBounds,conceptStacks,basicStacks,planningTimings,cardZoneTimings,zoneCardFilters,zoneOwnerFilters,heldStackEffectKinds,hitTargetModes, hitResultTests, flowGates, maxGateInputs, maxGateTests, maxCustomStacks, maxStackNameLength, effectStackNames, effectCardReferences, mapEffectCardReferences, maxFlowDepth, maxFlowRepeat, maxFlowActivations, maxExpressionDepth, maxMathTerms, maxMathParts, flowMathTerms, flowArithmetic, flowComparisons, flowStats, flagConditions, replacementConditions, maxPassives, maxPassiveEffects, passiveRoundTimings, passiveEffectKinds, passiveTimingsFor, baseActions, maxActions, statuses, effects, effectSettings, temptationLimit, temptationStrain, mentalCrisisThreshold, awakeningPower, crisisRecovery, signedEffects, percentageDefaults, ratioEffects, effectRatioBases, configurableRatioEffects, ratioBasisAvailable, maxStatusRounds, healthBases, healthRatioEffects, maxDeferralRounds, applyPowerRatio, effectRecipients, diceConditions, diceConditionTimings, maxDiceTotal, effectConditions, maxStatusStacks, maxStackPotency, stackPotency, maxCollectiveStackConsume, bossDamageModifiers, stackGrantEffects, stackConsumeAmounts, stackConsumeScopes, stackConsumePriorities, taggedEffects, discardCosts, resourceCosts, resourceScales, teamEffects, copyEffects, unnumberedEffects, stagedPowerEffects, stagedPowerTimings, amplifyHitTargets, effectLimitPeriods, maxEffectActivations, timings, maxCardHits, maxCardEffects, hitEffectTimings, cardHitPowers, maxOverloadCost, defaultOverloadCost, roles, cardStates, cardState, crisisRounds, crisisVows, artForms, artPoses, effectiveCardCost, applauseAttack, cardUsable, deckSize, deckCopyLimit, cardFileFormat, passiveFileFormat, characterFileFormat, parsePower, mentalPower} from '../public/rules.js';

const gameFail = message => { throw new GameInputError(message); };
class GameInputError extends Error {}
const bounded = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const gameInt = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
const gameText = (x, n) => typeof x === 'string' ? x.trim().slice(0,n) : '';
const gameId = () => crypto.randomUUID();
const gameEmpty = () => ({profiles:{},battle:null});
const gameRoll = (sides) => Math.floor(Math.random()*sides)+1;
function gameShuffle(cards) {
  const result = [...cards];
  for (let i=result.length-1;i>0;i--) {
    const j=gameRoll(i+1)-1;
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
function gameRollPower(formula){
  const {count,sides,bonus}=parsePower(formula);
  return {sides,bonus,faces:Array.from({length:count},()=>gameRoll(sides))};
}
const gameRanges = value => {
  const parts = typeof value === 'string' ? value.split(',').map(p=>p.trim()) : [];
  if (!parts.length || parts.length>8) gameFail('사거리를 확인해 주세요.');
  return parts.map(part=>{
    const m=part.match(/^(\d{1,2})(?:\s*[~–-]\s*(\d{1,2}))?$/);
    if (!m || Number(m[1])>Number(m[2]??m[1]) || Number(m[2]??m[1])>12) gameFail('사거리는 0~12칸에서 1, 3 또는 1~3처럼 입력하세요.');
    return [Number(m[1]),Number(m[2]??m[1])];
  });
};
function gameRangeShape(shape){
  if(shape==null)return;
  if(shape.kind==='rectangle'&&gameInt(shape.x,0,maxRangeX)&&gameInt(shape.y,0,maxRangeY)){
    return {kind:shape.kind,x:shape.x,y:shape.y};
  }
  if(['circle','cross'].includes(shape.kind)&&gameInt(shape.radius,1,maxRangeRadius))return {kind:shape.kind,radius:shape.radius};
  if(shape.kind==='custom'&&Array.isArray(shape.cells)&&shape.cells.length<=(customRangeRadius*2+1)**2-1&&
    shape.cells.every(cell=>Array.isArray(cell)&&cell.length===2&&cell.every(offset=>gameInt(offset,-customRangeRadius,customRangeRadius))&&(cell[0]||cell[1]))){
    return {kind:shape.kind,cells:[...new Map(shape.cells.map(cell=>[cell.join(','),cell])).values()]};
  }
  gameFail('격자 범위의 모양과 칸을 확인하세요.');
}
function gameExpression(raw,depth=0,budget={left:maxMathParts}){
  if(--budget.left<0)gameFail('수식 하나에 연결하는 파츠는 최대 '+maxMathParts+'개예요.');
  if(!raw||depth>maxExpressionDepth)gameFail('수치 블록의 연결이 너무 깊거나 비어 있어요.');
  const {type}=raw;
  if(['number','percent'].includes(type)&&gameInt(raw.value,-10000,10000))return {type,value:raw.value};
  if(type==='stat'&&Object.hasOwn(flowStats,raw.stat))return {type,stat:raw.stat};
  if(type==='math'&&Object.hasOwn(flowArithmetic,raw.op)){
    if(raw.terms!==undefined){
      if(!Array.isArray(raw.terms)||!gameInt(raw.terms.length,2,maxMathTerms))gameFail('연산 블록에는 항을 2~'+maxMathTerms+'개 연결할 수 있어요.');
      return {type,op:raw.op,terms:raw.terms.map(term=>gameExpression(term,depth+1,budget))};
    }
    return {type,op:raw.op,left:gameExpression(raw.left,depth+1,budget),right:gameExpression(raw.right,depth+1,budget)};
  }
  gameFail('수치 블록을 확인하세요.');
}
function gameFlowTest(raw,row,id,owned,depth=0,budget={left:maxGateTests}){
  if(--budget.left<0)gameFail('조건 하나에 연결하는 파츠는 최대 '+maxGateTests+'개예요.');
  if(!raw||depth>maxExpressionDepth)gameFail('조건 블록의 연결이 너무 깊거나 비어 있어요.');
  const {type}=raw;
  if(type==='hitResult'){
    if(row.when!=='hit'||!Object.hasOwn(hitResultTests,raw.result))gameFail('적중 결과 조건은 적중 시 이벤트 안에 연결하세요.');
    return {type,result:raw.result};
  }
  if(type==='compare'&&Object.hasOwn(flowComparisons,raw.op)){
    return {type,op:raw.op,left:gameExpression(raw.left),right:gameExpression(raw.right)};
  }
  if(type==='gate'){
    if(!Object.hasOwn(flowGates,raw.gate)||!Array.isArray(raw.inputs)||!gameInt(raw.inputs.length,2,maxGateInputs))
      gameFail('논리 게이트와 입력 개수를 확인하세요. 입력은 2~'+maxGateInputs+'개까지 가능해요.');
    return {type,gate:raw.gate,inputs:raw.inputs.map(input=>gameFlowTest(input,row,id,owned,depth+1,budget))};
  }
  if(type==='and'||type==='or'){
    return {type,left:gameFlowTest(raw.left,row,id,owned,depth+1,budget),right:gameFlowTest(raw.right,row,id,owned,depth+1,budget)};
  }
  if(type==='not')return {type,test:gameFlowTest(raw.test,row,id,owned,depth+1,budget)};
  if(type==='condition'&&['stackScan','keywordScan','keywordOwned','keywordOwnedCount'].includes(raw.condition)){
    const holding=raw.condition.startsWith('keywordOwned');
    const keyword=holding||raw.condition==='keywordScan',period=raw.period??'round',mode=raw.mode??'any',zone=raw.zone??'active';
    const tag=gameText(raw.tag,maxStackNameLength),scope=raw.scope??'allies',metric=raw.metric??'count',op=raw.op??'gte';
    const minimum=raw.minimum??1,threshold=raw.condition==='keywordOwned'?1:raw.threshold??1;
    const names=typeof raw.names==='string'?[...new Set(raw.names.split(/[,\n]/).map(name=>name.trim().normalize('NFKC')).filter(Boolean))]:[];
    if(!tag||Object.hasOwn(Object.prototype,tag)||!Object.hasOwn(stackScanScopes,scope)||(!keyword&&!Object.hasOwn(stackScanMetrics,metric)||keyword&&(!Object.hasOwn(keywordScanPeriods,period)||!Object.hasOwn(keywordScanModes,mode)))||
      holding&&!Object.hasOwn(keywordOwnedZones,zone)||!Object.hasOwn(flowComparisons,op)||!gameInt(minimum,1,9999)||!gameInt(threshold,0,100)||
      scope==='named'&&(!names.length||names.length>12||names.some(name=>name.length>50)))gameFail('중첩 대상 감지 조건을 확인하세요.');
    return {type,condition:raw.condition,subject:'self',tag,scope,metric,op,minimum,threshold,...(keyword?{period,mode}:{}),...(holding?{zone}:{}),
      ...(scope==='named'?{names:names.join(', ')}:{}),...(raw.thresholdExpr?{thresholdExpr:gameExpression(raw.thresholdExpr)}:{})};
  }
  if(type==='condition'&&raw.condition&&Object.hasOwn(effectConditions,raw.condition)&&['self','target'].includes(raw.subject)){
    const {condition,subject}=raw;
    if(row.when==='replace'&&condition!=='cardUsed'&&!replacementConditions.includes(condition))
      gameFail('카드 교체 전에 확인할 수 있는 조건을 사용하세요.');
    const dice=Object.hasOwn(diceConditions,condition);
    if(dice&&!diceConditionTimings.includes(row.when))gameFail('주사위 조건은 위력 판정 이후 이벤트에서 사용하세요.');
    const threshold=flagConditions.includes(condition)?1:raw.threshold;
    if(!gameInt(threshold,dice?1:0,dice?maxDiceTotal:100))gameFail('조건 블록의 수치를 확인하세요.');
    const tag=condition==='stack'?gameText(raw.tag,22):'';
    if(condition==='stack'&&(!tag||Object.hasOwn(Object.prototype,tag)))gameFail('조건 블록에 중첩 이름을 입력하세요.');
    const conditionCardId=condition==='cardUsed'?raw.conditionCardId:undefined;
    if(condition==='cardUsed'&&(!conditionCardId||!owned.some(card=>card.id===conditionCardId)&&conditionCardId!==id||
      passiveRoundTimings.includes(row.when)))gameFail('조건 블록에서 사용할 카드를 확인하세요.');
    return {type,condition,subject,threshold,...(!flagConditions.includes(condition)&&raw.thresholdExpr?{thresholdExpr:gameExpression(raw.thresholdExpr)}:{}),...(tag?{tag}:{}),...(conditionCardId?{conditionCardId}:{})};
  }
  gameFail('조건 블록을 확인하세요.');
}
function gameNormalizeFlow(row,id,owned){
  if(row.flow==null)return [];
  if(!Array.isArray(row.flow)||row.flow.length>maxFlowDepth)gameFail('제어 블록은 '+maxFlowDepth+'단까지 연결할 수 있어요.');
  const seen=new Set();
  return row.flow.map(step=>{
    if(!step||!gameInt(step.id,1,10000)||seen.has(step.id))gameFail('연결된 제어 블록을 확인하세요.');
    seen.add(step.id);
    if(step.kind==='repeat'&&gameInt(step.count,1,maxFlowRepeat)&&row.kind!=='replaceCard'&&
      !discardCosts.includes(row.kind)&&!resourceCosts.includes(row.kind))
      return {kind:'repeat',id:step.id,count:step.count,...(step.countExpr?{countExpr:gameExpression(step.countExpr)}:{})};
    if(step.kind==='if'&&['then','else'].includes(step.branch)){
      return {kind:'if',id:step.id,branch:step.branch,test:gameFlowTest(step.test,row,id,owned)};
    }
    gameFail('반복 횟수 또는 제어 블록에 넣은 효과를 확인하세요. 카드 교체와 대가 지불은 반복할 수 없어요.');
  });
}
function gameValidateFlow(rows){
  let activations=0;
  const shapes=new Map();
  for(const row of rows){
    let path=row.when+':'+(row.hitIndex||0), iterations=1;
    for(const step of row.flow||[]){
      const key=path+'/'+step.id;
      const shape=JSON.stringify(step.kind==='if'?[step.kind,step.test]:[step.kind,step.count,step.countExpr]);
      if(shapes.has(key)&&shapes.get(key)!==shape)gameFail('같은 제어 블록에 서로 다른 설정이 연결됐어요.');
      shapes.set(key,shape);
      path=key+(step.branch||'');
      if(step.kind==='repeat')iterations*=step.countExpr?maxFlowRepeat:step.count;
    }
    activations+=iterations;
  }
  if(activations>maxFlowActivations)gameFail('반복을 포함해 효과 블록은 최대 '+maxFlowActivations+'회 실행할 수 있어요.');
}
function gameCard(input,id=gameId(),owned=[],passive=false,stack=false) {
  const name=gameText(input.name,36);
  const formulas=input.hitPowers??[input.power];
  if(!Array.isArray(formulas)||!gameInt(formulas.length,1,maxCardHits))gameFail('타수는 1~'+maxCardHits+'타로 설정하세요.');
  const hitTargets=input.hitTargets;
  if(hitTargets!=null&&(!Array.isArray(hitTargets)||hitTargets.length!==formulas.length||
    hitTargets.some(mode=>!Object.hasOwn(hitTargetModes,mode))))gameFail('타격별 대상을 확인하세요.');
  const hitPowers=formulas.map((value,index)=>{
    const power=parsePower(value);
    if(!power)gameFail((index+1)+'타 위력값을 확인하세요. 예: 2d+5, 2d8+3, 7.');
    return power.formula;
  });
  if(!name)gameFail('카드명을 입력하세요.');
  const rangeShape=gameRangeShape(input.rangeShape);
  const range=rangeShape?'0':gameText(input.range,36);
  gameRanges(range);
  const counter=input.role==='counter';
  const cost=input.role==='overload'?(input.cost??defaultOverloadCost):0;
  if(!gameInt(cost,0,maxOverloadCost))gameFail('혹사 정신력 소모는 0~'+maxOverloadCost+' 사이의 정수로 입력하세요.');
  const target=counter?'self':input.target;
  if (!['area','splash','tile','self',1,2,3,4].includes(target) || !Object.hasOwn(roles,input.role)) gameFail('대상과 카드 유형을 확인하세요.');
  let splash;
  if(['splash','tile'].includes(target)){
    if(input.role==='guard')gameFail('원호 방어 카드의 대상은 자신으로 설정하세요.');
    const shape=gameRangeShape(input.splash?.rangeShape);
    const range=shape?'0':gameText(input.splash?.range,36);
    gameRanges(range);
    if(shape?.kind==='custom'&&!shape.cells.length)gameFail('주 대상 주변의 광역 칸을 하나 이상 선택하세요.');
    splash={range,...(shape?{rangeShape:shape}:{})};
  }
  const image=typeof input.image==='string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(input.image) && input.image.length<=32000 ? input.image : '';
  if (input.image && !image) gameFail('이미지 크기 또는 형식을 확인하세요.');
  const requiredState=cardState(input.requiredState);
  if(!Object.hasOwn(cardStates,requiredState))gameFail('카드 사용 상태를 확인하세요.');
  const rows=Array.isArray(input.effects)?input.effects:[];
  if(rows.length>maxCardEffects)gameFail('카드당 효과는 '+maxCardEffects+'개까지 넣을 수 있어요.');
  if(rows.filter(row=>discardCosts.includes(row?.kind)).length>1)gameFail('손패 버리기 대가는 카드당 하나만 넣을 수 있어요.');
  for(const kind of resourceCosts){
    if(rows.filter(row=>row?.kind===kind).length>1)gameFail('체력과 정신력 지불은 각각 카드당 하나만 넣을 수 있어요.');
  }
  const entries=rows.map(row=>{
    if (!row || !Object.hasOwn(effects,row.kind) || !Object.hasOwn(timings,row.when) || !Object.hasOwn(effectRecipients,row.to)) gameFail('효과 항목을 확인하세요.');
    if(row?.when==='held'&&(!stack||!heldStackEffectKinds.includes(row.kind)||row.to!=='self'||
      row.limit||row.ratioBasis||row.condition==='cardUsed'))gameFail('보유 시 효과는 중첩 보유자에게 지속되는 보정만 설정할 수 있어요.');
    if((planningTimings.includes(row?.when)||cardZoneTimings.includes(row?.when))&&(row.kind==='power'||row.scaleDiscard||row.scaleResource||row.scaleCost||
      typeof row.ratioBasis==='string'&&row.ratioBasis.startsWith('card')))gameFail('이 이벤트에서는 사용 대가와 판정 위력을 참조할 수 없어요.');
    if(cardZoneTimings.includes(row?.when)&&['primary','secondary'].includes(row.to))
      gameFail('카드 이동 이벤트의 효과 대상을 확인하세요.');
    const grantsShield=shieldGrantEffects.includes(row.kind);
    const shieldDuration=grantsShield?(row.shieldDuration??row.duration??0):0;
    const shieldCap=grantsShield?(row.shieldCap??row.cap??null):null;
    const shieldSource=grantsShield?gameText(row.shieldSource,40):'';
    const stackMode=grantsShield?(row.stackMode??'add'):'add';
    if(grantsShield&&(!gameInt(shieldDuration,0,maxStatusRounds)||shieldCap!==null&&!gameInt(shieldCap,1,999)||
      !Object.hasOwn(shieldStackModes,stackMode)||row.refreshDuration!=null&&typeof row.refreshDuration!=='boolean'))
      gameFail('보호막 옵션을 확인하세요.');
    const timed=grantsShield||durationPolicyKinds.includes(row.kind)||!passive&&['struck','hurt'].includes(row.when);
    const durationPolicy=timed?(row.durationPolicy??'default'):'default';
    const durationCap=timed?(row.durationCap??0):0;
    if(timed&&(!Object.hasOwn(durationPolicies,durationPolicy)||!gameInt(durationCap,0,maxDurationCap)))
      gameFail('유지 라운드의 갱신 방식과 최대치를 확인하세요.');
    const reactionRounds=!passive&&['struck','hurt'].includes(row?.when)?row.reactionRounds??0:0;
    if(!gameInt(reactionRounds,0,maxStatusRounds))gameFail('피격 효과의 지속 라운드를 확인하세요.');
    if(row?.when==='counter'&&!counter)gameFail('반격 발동 시 효과는 반격 카드에만 사용할 수 있어요.');
    const zone=cardZoneTimings.includes(row.when);
    const zoneCard=zone?(row.zoneCard||(passive?'any':'same')):undefined;
    const zoneOwner=zone?(row.zoneOwner||'self'):undefined;
    if(zone&&(!Object.hasOwn(zoneCardFilters,zoneCard)||!Object.hasOwn(zoneOwnerFilters,zoneOwner)||
      passive&&['same','other'].includes(zoneCard)))gameFail('카드 이동 조건을 확인하세요.');
    const zoneCardId=zoneCard==='specific'?row.zoneCardId:undefined;
    if(zoneCard==='specific'&&(!zoneCardId||zoneCardId!==id&&!owned.some(card=>card.id===zoneCardId)))
      gameFail('이동을 감지할 카드를 지정하세요.');
    const zoneCardName=zoneCard==='named'?gameText(row.zoneCardName,80):'';
    const zoneOwnerName=zoneOwner==='named'?gameText(row.zoneOwnerName,80):'';
    if(zoneCard==='named'&&!zoneCardName||zoneOwner==='named'&&!zoneOwnerName)gameFail('카드 또는 캐릭터 이름을 입력하세요.');
    const hitIndex=row.hitIndex??0;
    if(!gameInt(hitIndex,0,hitPowers.length)||hitIndex&&!hitEffectTimings.includes(row.when)){
      gameFail('타격 번호와 효과의 발동 시점을 확인하세요.');
    }
    if(row.kind==='replayHit'&&(row.when==='roll'||!hitIndex||row.to!=='self'||row.scaleDiscard||row.scaleCost||row.scaleResource))gameFail('이 타격 재사용은 타격 효과에서만 설정해 주세요.');
    if(stagedPowerEffects.includes(row.kind)&&(hitIndex||row.to!=='self'||!stagedPowerTimings.includes(row.when))){
      gameFail('위력 증가는 판정 전에 자신에게 적용되는 카드 효과로 설정하세요.');
    }
    const amplify=row.kind==='amplifyHit';
    const amplifyTarget=row.amplifyTarget??'next';
    const amplifyIndex=row.numberExprs?.amplifyIndex?hitIndex+1:row.amplifyIndex;
    if(amplify&&(row.when==='roll'||!hitIndex||hitIndex>=hitPowers.length||row.to!=='self'||row.scaleDiscard||row.scaleCost||row.scaleResource||
      !Object.hasOwn(amplifyHitTargets,amplifyTarget)||amplifyTarget==='number'&&!gameInt(amplifyIndex,hitIndex+1,hitPowers.length))){
      gameFail('증폭할 타격은 이 효과를 발동하는 타격보다 뒤에 있어야 해요.');
    }
    const shieldConversion=row.kind==='shieldConversion';
    const leech=shieldConversion||row.kind==='lifeSteal';
    const leechFormula=row.leechFormula??'shared',capMode=row.capMode??'fixed',
      mindMode=row.mindMode??'percent',mindCapMode=row.mindCapMode??'fixed';
    const victimName=gameText(row.leechVictimName,80);
    if(leech&&(!Object.hasOwn(damageConversionFormulaModes,leechFormula)||
      [capMode,mindMode,mindCapMode].some(mode=>!Object.hasOwn(damageConversionUnits,mode))||
      row.leechVictim==='named'&&!victimName))gameFail('변환 계산식과 피해 대상 설정을 확인하세요.');
    const leechDamage=row.leechDamage??'any',leechVictim=row.leechVictim??'enemy',leechHeal=row.leechHeal??'dealer';
    const leechResource=row.leechResource??'hp',leechBasis=row.leechBasis??'actual',
      leechShield=row.leechShield??'exclude',leechRecovery=row.leechRecovery??'hp';
    if(leech&&(!Object.hasOwn(lifeStealDamageResources,leechResource)||!Object.hasOwn(lifeStealBases,leechBasis)||
      !Object.hasOwn(lifeStealShieldModes,leechShield)||!Object.hasOwn(shieldConversion?shieldConversionOutputs:lifeStealRecoveryResources,leechRecovery)||
      !Object.hasOwn(lifeStealDamageTypes,leechDamage)||!Object.hasOwn(lifeStealVictims,leechVictim)||
      !Object.hasOwn(lifeStealHealers,leechHeal)&&(!Object.hasOwn(effectRecipients,leechHeal)||['target','primary','secondary','self','keywordHolders'].includes(leechHeal))))
      gameFail('생명력 흡수의 피해 종류와 대상을 확인하세요.');
    const deferral=row.kind==='damageDebt';
    const defaultPercent=deferral||percentageDefaults.includes(row.kind);
    const ratio=row.amountMode==='percent'||defaultPercent&&row.amountMode==null;
    const deferRounds=row.deferRounds??1;
    if(deferral&&!gameInt(deferRounds,1,maxDeferralRounds))gameFail('분할 라운드 수는 1~'+maxDeferralRounds+'로 설정하세요.');
    if(row.amountMode!=null&&!['fixed','percent'].includes(row.amountMode))gameFail('수치 단위를 확인하세요.');
    const ratioBasis=ratio&&row.ratioBasis?row.ratioBasis:undefined;
    if(ratio&&stackRatioEffects.includes(row.kind)&&!Object.hasOwn(stackRatioBases,ratioBasis))gameFail('중첩 비율의 기준을 선택하세요.');
    if(ratioBasis&&(!configurableRatioEffects.includes(row.kind)||!Object.hasOwn(effectRatioBases,ratioBasis)||
      Object.hasOwn(stackRatioBases,ratioBasis)!==stackRatioEffects.includes(row.kind)||
      !ratioBasisAvailable(ratioBasis,row.when)||passive&&passiveRoundTimings.includes(row.when)&&ratioBasis.startsWith('card')))
      gameFail('이 발동 시점에 사용할 수 있는 비율 기준을 선택하세요.');
    const dotRounds=row.kind==='poison'?row.dotRounds:undefined;
    if(dotRounds!=null&&!gameInt(dotRounds,1,maxStatusRounds))gameFail('지속 피해는 1~'+maxStatusRounds+'라운드로 설정하세요.');
    const compatible=amplify||Object.hasOwn(ratioEffects,row.kind);
    if(ratio&&!compatible)gameFail('이 효과는 비율값을 지원하지 않아요.');
    const signed=signedEffects.includes(row.kind)||ratioEffects[row.kind]?.[1]===0;
    const consuming=row.kind==='consume';
    const consumeAmount=row.consumeAmount??'fixed';
    const consumeScope=row.to==='allEnemies'?(row.consumeScope??'each'):'each';
    const consumePriority=row.consumePriority??'lowestHp';
    if(consuming&&(!Object.hasOwn(stackConsumeAmounts,consumeAmount)||!Object.hasOwn(stackConsumeScopes,consumeScope)||
      consumeScope==='total'&&!Object.hasOwn(stackConsumePriorities,consumePriority))){
      gameFail('중첩 소모 방식과 우선 대상을 확인하세요.');
    }
    const consumeAll=consuming&&consumeAmount==='all';
    const independent=row.stackAxes===true&&['stack','consume','remove'].includes(row.kind)&&!consumeAll;
    const axisOptions={};
    const ratioStackTag=gameText(row.ratioStackTag,maxStackNameLength);
    if(independent)for(const key of ['axisPower','axisCount']){
      if(row[key+'Mode']!=='percent')continue;
      const basis=row[key+'Basis'];
      if(!Object.hasOwn(stackRatioBases,basis))gameFail('중첩 비율 기준을 확인하세요.');
      axisOptions[key+'Mode']='percent';axisOptions[key+'Basis']=basis;
      axisOptions[key+'Tag']=gameText(row[key+'Tag'],maxStackNameLength);
    }
    const axisPower=independent?row.axisPower:undefined,axisCount=independent?row.axisCount:undefined;
    if(independent&&([axisPower,axisCount].every(value=>value==null)&&!row.numberExprs?.axisPower&&!row.numberExprs?.axisCount||axisPower!=null&&!gameInt(axisPower,1,maxStackPotency)||axisCount!=null&&!gameInt(axisCount,1,maxStatusStacks)))gameFail('중첩 위력 또는 횟수를 입력하세요.');
    const amount=consumeAll||independent?1:row.amount;
    const maxAmount=consuming?(consumeScope==='total'?maxCollectiveStackConsume:maxStatusStacks):
      ['awakenBody','inscribeMeaning'].includes(row.kind)?10000:row.kind==='blockAction'?maxStatusRounds:row.kind==='reduceActions'?maxActions:amplify&&ratio?300:100;
    if(!gameInt(amount,signed?-100:1,maxAmount)||amount===0)gameFail('효과 수치를 확인하세요.');
    const grantsStacks=stackGrantEffects.includes(row.kind);
    const stackCap=grantsStacks?row.stackCap:undefined;
    const stackPower=grantsStacks?row.stackPower:undefined;
    const stackPowerCap=grantsStacks?row.stackPowerCap:undefined;
    const gainLimits=grantsStacks?gameStackGainLimits(row):{};
    if(stackCap!=null&&!gameInt(stackCap,1,maxStatusStacks))gameFail('중첩 최대 횟수를 확인하세요.');
    if([stackPower,stackPowerCap].some(power=>power!=null&&!gameInt(power,1,maxStackPotency))){
      gameFail('중첩 위력과 위력 한도를 확인하세요.');
    }
    if(consumeAll&&(row.scaleCost||row.scaleDiscard||row.scaleResource))gameFail('전부 소모에는 수치에 곱할 대가를 적용할 수 없어요.');
    const tag=gameText(row.tag,22);
    if (Object.hasOwn(Object.prototype,tag)) gameFail('다른 중첩 이름을 입력하세요.');
    if (taggedEffects.includes(row.kind)&&!tag) gameFail('중첩 이름을 입력하세요.');
    const condition=row.condition||'';
    if(!Object.hasOwn(effectConditions,condition)) gameFail('효과 조건을 확인하세요.');
    const conditionCardId=condition==='cardUsed'?row.conditionCardId:undefined;
    if(condition==='cardUsed'&&(!conditionCardId||(!owned.some(card=>card.id===conditionCardId)&&conditionCardId!==id)||
      ['battleStart','turnStart','turnEnd'].includes(row.when)))gameFail('사용 조건에 해당하는 카드를 지정하세요.');
    const givenCardId=row.kind==='giveCard'?row.givenCardId:undefined;
    if(row.kind==='giveCard'&&(!givenCardId||(!owned.some(card=>card.id===givenCardId)&&givenCardId!==id))){
      gameFail('지급할 카드를 지정하세요.');
    }
    const replace=row.kind==='replaceCard';
    const replacementId=replace?row.replacementId:undefined;
    const fromCardId=replace&&passive?row.fromCardId:undefined;
    if(replace){
      if(row.when!=='replace'||hitIndex||!['self','target'].includes(row.to)||!replacementConditions.includes(condition)||
        row.scaleCost||row.scaleDiscard||row.scaleResource)gameFail('카드가 발동하기 전에 확인할 교체 조건을 골라 주세요.');
      if(!replacementId||replacementId===id||!owned.some(card=>card.id===replacementId)){
        gameFail('발동할 다른 카드를 지정하세요.');
      }
      if(fromCardId&&(!owned.some(card=>card.id===fromCardId)||fromCardId===replacementId))gameFail('교체할 원래 카드를 확인하세요.');
    }
    const diceCondition=Object.hasOwn(diceConditions,condition);
    if(diceCondition&&(!diceConditionTimings.includes(row.when)||!gameInt(row.threshold,1,maxDiceTotal))){
      gameFail('주사위 조건은 판정 시점 이후에 설정하고 눈의 합을 1~'+maxDiceTotal+' 사이로 입력하세요.');
    }
    const conditionStackTag=condition==='stack'?gameText(row.conditionStackTag,maxStackNameLength)||tag:'';
    if(condition==='stack'&&(!conditionStackTag||Object.hasOwn(Object.prototype,conditionStackTag)))gameFail('중첩 조건에 이름을 입력하세요.');
    const isCost=discardCosts.includes(row.kind)||resourceCosts.includes(row.kind);
    const scaleResource=row.scaleResource||'';
    if(scaleResource&&(!Object.hasOwn(resourceScales,scaleResource)||row.scaleDiscard===true))gameFail('수치 배율은 한 가지 대가를 선택하세요.');
    if(teamEffects.includes(row.kind)&&row.to!=='self')gameFail('동료 전원 효과의 기준은 자신이에요.');
    if(copyEffects.includes(row.kind)&&row.to!=='self')gameFail('사본은 자신의 손패에 추가돼요.');
    if(isCost&&(scaleResource||row.scaleDiscard===true||row.to!=='self'||hitIndex))gameFail('대가는 카드 전체의 자신의 자원에 적용돼요.');
    const limit=row.limit;
    if(limit!=null&&(!Object.hasOwn(effectLimitPeriods,limit.period)||limit.period==='none'||!gameInt(limit.count,1,maxEffectActivations))){
      gameFail('발동 제한의 기간과 횟수를 확인하세요.');
    }
    const healthBasis=row.healthBasis||'max';
    if(!Object.hasOwn(healthBases,healthBasis))gameFail('체력 기준을 확인하세요.');
    const scaleCost=row.scaleCost;
    if(scaleCost&&(!(scaleResource||row.scaleDiscard===true)||!gameInt(scaleCost.amount,1,100)||!['fixed','percent'].includes(scaleCost.mode)||!Object.hasOwn(healthBases,scaleCost.healthBasis||'max')))gameFail('대가의 소비량과 수치 단위를 확인하세요.');
    const copyId=row.kind==='copyFixed'?row.copyId:undefined;
    if(row.kind==='copyFixed'&&!owned.some(card=>card.id===copyId))gameFail('복제할 카드를 지정하세요.');
    const settings={};
    for(const [key,[label,defaultValue,min,max]] of Object.entries(effectSettings[row.kind]||{})){
      const value=row[key]??defaultValue;
      if(!gameInt(value,min,max))gameFail(label+' 값은 '+min+'~'+max+'로 설정하세요.');
      settings[key]=value;
    }
    if(row.kind==='move'){
      const choices={moveMode:instantMoveModes,moveDirection:instantMoveDirections,moveOffset:instantMoveOffsets,
        moveAnchor:instantMoveAnchors,moveOrder:instantMoveOrders,moveTest:instantMoveStackTests,moveMetric:instantMoveStackMetrics};
      for(const [key,options] of Object.entries(choices)){
        if(row[key]==null)continue;
        if(!Object.hasOwn(options,row[key]))gameFail('즉시 이동 옵션을 확인하세요.');
        settings[key]=row[key];
      }
      if(settings.moveMode==='relative'){
        const tag=gameText(row.moveTag,maxStackNameLength);
        if((settings.moveTest&&settings.moveTest!=='any'||['mostStacks','fewestStacks'].includes(settings.moveOrder))&&
          (!tag||Object.hasOwn(Object.prototype,tag)))gameFail('즉시 이동의 기준 중첩을 선택하세요.');
        if(tag)settings.moveTag=tag;
        const minimum=row.moveMin??1,maximum=row.moveMax??maxStatusStacks;
        if(!gameInt(minimum,0,9999)||!gameInt(maximum,minimum,9999))gameFail('중첩 수치의 최소값과 최대값을 확인하세요.');
        settings.moveMin=minimum;settings.moveMax=maximum;
      }
    }
    const flow=gameNormalizeFlow(row,id,owned);
    const amountExpr=row.amountExpr!=null&&!unnumberedEffects.includes(row.kind)?gameExpression(row.amountExpr):undefined;
    const numberExprs={};
    if(row.numberExprs!=null&&(typeof row.numberExprs!=='object'||Array.isArray(row.numberExprs)))gameFail('숫자 설정의 연산을 확인하세요.');
    for(const [key,expr] of Object.entries(row.numberExprs||{})){
      if(!effectNumberBounds(row.kind,key,hitIndex,hitPowers.length,diceCondition))gameFail('연산을 연결할 수 없는 숫자 설정이에요.');
      if(['shieldDuration','shieldCap'].includes(key)&&!grantsShield)gameFail('보호막 효과에만 연결할 수 있어요.');
      if(key==='durationCap'&&!timed)gameFail('이 효과에는 유지 라운드 상한을 연결할 수 없어요.');
      numberExprs[key]=gameExpression(expr);
    }
    const recipientKeyword=row.to==='keywordHolders'?gameFlowTest({...row.recipientKeyword,type:'condition',condition:'keywordOwned'},row,id,owned):null;
    return {...axisOptions,...(ratioStackTag?{ratioStackTag}:{}),...(independent?{stackAxes:true,...(axisPower!=null?{axisPower}:{}),...(axisCount!=null?{axisCount}:{})}:{}),...(recipientKeyword?{recipientKeyword}:{}),...settings,...gainLimits,...gameVisibility(row),...(Object.keys(numberExprs).length?{numberExprs}:{}),...(gameText(row.flavor,180)?{flavor:gameText(row.flavor,180)}:{}),...(flow.length?{flow}:{}),...(amountExpr?{amountExpr}:{}),...(ratioBasis?{ratioBasis}:{}),...(dotRounds!=null?{dotRounds}:{}),kind:row.kind,when:row.when,amount,to:row.to,tag,condition,threshold:gameInt(row.threshold,1,diceCondition?maxDiceTotal:100)?row.threshold:1,
      ...(grantsShield?{shieldDuration,shieldCap,stackMode,...(shieldSource?{shieldSource}:{}),
        ...(row.refreshDuration===false?{refreshDuration:false}:{})}:{}),
      ...(durationPolicy!=='default'?{durationPolicy}:{}),...(durationCap?{durationCap}:{}),
      ...(conditionStackTag?{conditionStackTag}:{}),...(hitIndex?{hitIndex}:{}),...(reactionRounds?{reactionRounds}:{}),
      ...(givenCardId?{givenCardId}:{}),...(conditionCardId?{conditionCardId}:{}),
      ...(leech?{leechDamage,leechVictim,leechHeal,leechResource,leechBasis,leechShield,leechRecovery,leechFormula,
        capMode,mindMode,mindCapMode,...(leechVictim==='named'?{leechVictimName:victimName}:{})}:{}),
      ...(zone?{zoneCard,zoneOwner}:{}),...(zoneCardId?{zoneCardId}:{}),
      ...(zoneCardName?{zoneCardName}:{}),...(zoneOwnerName?{zoneOwnerName}:{}),
      ...(replace?{replacementId,...(fromCardId?{fromCardId}:{})}:{}),
      ...(consumeAll?{consumeAmount}:{}),
      ...(consuming&&consumeScope==='total'?{consumeScope,consumePriority}:{}),
      ...(stackCap!=null?{stackCap}:{}),
      ...(stackPower!=null?{stackPower}:{}),
      ...(stackPowerCap!=null?{stackPowerCap}:{}),
      ...(amplify?{amplifyTarget,...(amplifyTarget==='number'?{amplifyIndex}:{}),amountMode:ratio?'percent':'fixed'}:{}),
      ...(limit?{limit:{period:limit.period,count:limit.count}}:{}),
      ...(ratio||defaultPercent?{amountMode:ratio?'percent':'fixed'}:{}),
      ...(ratio&&healthRatioEffects.includes(row.kind)?{healthBasis}:{}),
      ...(scaleCost?{scaleCost:{amount:scaleCost.amount,mode:scaleCost.mode,healthBasis:scaleCost.healthBasis||'max'}}:{}),...(deferral?{deferRounds}:{}),...(copyId?{copyId}:{}),...(scaleResource?{scaleResource}:{}),...(row.scaleDiscard===true?{scaleDiscard:true}:{})};
  });
  gameValidateFlow(entries);
  const hitFlavors=Array.isArray(input.hitFlavors)?hitPowers.map((_,index)=>gameText(input.hitFlavors[index],180)):[];
  const flavor=gameText(input.flavor,300);
  return {id,name,...gameVisibility(input,true),unredirectable:input.unredirectable===true,power:hitPowers[0],...(flavor?{flavor}:{}),...(hitFlavors.some(Boolean)?{hitFlavors}:{}),...(hitPowers.length>1?{hitPowers}:{}),...(hitTargets?{hitTargets}:{}),range,...(rangeShape?{rangeShape}:{}),target,...(splash?{splash}:{}),requiredState,clash:!counter&&target!=='tile'&&input.clash===true,unstoppable:!counter&&target!=='tile'&&input.unstoppable===true&&!['guard','assist'].includes(input.role)&&target!=='self',role:input.role,cost,notes:gameText(input.notes,300),effects:entries,image};
}
function gamePassive(input,id=gameId(),owned=[],stack=false){
  const limit=maxPassiveEffects+Number(stack);
  if(!input||!Array.isArray(input.effects)||!gameInt(input.effects.length,1,limit)){
    gameFail('패시브에는 효과를 1~'+maxPassiveEffects+'개 넣어 주세요.');
  }
  for(const effect of input.effects){
    if(!effect||!passiveEffectKinds.includes(effect.kind)||!(stack&&effect.when==='held'||passiveTimingsFor(effect.kind).includes(effect.when))||
      effect.hitIndex||effect.scaleCost||effect.scaleDiscard||effect.scaleResource){
      gameFail('패시브에서 사용할 수 있는 효과와 발동 시점을 확인하세요.');
    }
    if(passiveRoundTimings.includes(effect.when)&&['target','primary','secondary'].includes(effect.to)){
      gameFail('이 발동 시점에는 자신이나 자동 대상 옵션을 선택하세요.');
    }
  }
  const card=gameCard({name:input.name,role:'normal',target:'self',range:'0',power:'0',effects:input.effects},'passive:'+id,owned,true,stack);
  return {id,name:card.name,notes:gameText(input.notes,300),...(gameText(input.flavor,300)?{flavor:gameText(input.flavor,300)}:{}),enabled:input.enabled!==false,effects:card.effects};
}
const gameEquippedEffects=profile=>[...(profile?.passives||[]),...(profile?.conceptTools||[])].filter(entry=>entry.enabled);
const gamePassiveSource=passive=>({id:'passive:'+passive.id,name:passive.name,effects:passive.effects,passive:true});
function gamePassives(b,actor,when,target,source){
  if(!gameAlive(actor))return;
  const sources=[...(actor.passives||[]).map(gamePassiveSource),...gameHeldStackSources(actor)];
  for(const card of sources){
    if(!gameAlive(actor))break;
    if(card.stackCount&&!gameStackActive(actor,card.name))continue;
    if(!card.effects.some(effect=>effect.when===when))continue;
    const ctx=gameContext(actor,card,[target],source.moved);
    Object.assign(ctx,{base:source.base,critical:source.critical,anyCritical:source.anyCritical,
      brokeShield:source.brokeShield,diceRolls:source.diceRolls,clashDifference:source.clashDifference,
      actionCard:source.actionCard||source.card,zoneEvent:source.zoneEvent,hitIndex:source.hitIndex,hitRolls:source.hitRolls,rawHitRolls:source.rawHitRolls,totalDamage:source.totalDamage,
      paidHealth:source.paidHealth,paidMind:source.paidMind,discarded:source.discarded,
      totalDamageUsed:(source.totalDamageUsed??=new Set()),actionGroups:source.actionGroups||gameActionGroups(b,source)});
    if(when==='hit')gameTriggerHit(b,ctx,target);
    else gameTriggers(b,ctx,when,target);
  }
}
const gameStackActive=(unit,name)=>!!(unit.stacks[name]||unit.stackTraits?.[name]?.stackAxesMode==='power'&&stackPotency(unit,name));
function gameHeldStackSources(unit){
  return Object.entries(unit.stackTraits||{}).filter(([name])=>gameStackActive(unit,name)).map(([name,trait])=>({
    id:'stack:'+name,name,effects:trait.effects,passive:true,stackCount:unit.stacks[name]||stackPotency(unit,name),...gameVisibility(trait)
  }));
}
function gameStackGainLimits(input){
  const result={};
  for(const key of Object.keys(stackGainLimits)){
    const value=input?.[key];
    if(value==null||value==='')continue;
    if(!gameInt(value,1,stackGainLimitMax(key)))gameFail('중첩 획득 한도를 확인하세요.');
    result[key]=value;
  }
  return result;
}
function gameStackName(value){
  const name=typeof value==='string'?value.trim():'';
  if(!name||name.length>maxStackNameLength||Object.hasOwn(Object.prototype,name))
    gameFail('중첩 이름을 '+maxStackNameLength+'자 이내로 입력해 주세요.');
  return name;
}
function gameStackTrait(input,owned){
  const effects=input.effects??[];
  if(!Array.isArray(effects)||effects.length>maxPassiveEffects+1||
    effects.some(effect=>!effect||effect.kind==='replaceCard'||effect.kind==='giveCard')){
    gameFail('중첩 효과를 확인하세요.');
  }
  const normalized=effects.length?gamePassive({name:input.name,effects},'stack',owned,true).effects:[];
  const flavor=gameText(input.flavor,300);
  const holdLimits={};
  for(const [key,max] of [['holdCount',maxStatusStacks],['holdPower',maxStatusStacks*maxStackPotency]]){
    if(input[key]==null)continue;
    if(!gameInt(input[key],1,max))gameFail('중첩 보유 한도를 확인하세요.');
    holdLimits[key]=input[key];
  }
  const stackAxesMode=['both','power','count'].includes(input.stackAxesMode)?input.stackAxesMode:'both';
  return {name:input.name,stackAxesMode,...gameVisibility(input),...(flavor?{flavor}:{}),...holdLimits,gainLimits:gameStackGainLimits(input.gainLimits),effects:normalized.map((effect,index)=>({...effect,
    ...(effects[index].scaleStack==='count'?{scaleStack:'count'}:{})
  }))};
}
function gameUpgradeStackTrait({name,effects,critical,flavor,gainLimits,holdCount,holdPower,stackAxesMode,...visibility}){
  const entry={name,effects,...(stackAxesMode?{stackAxesMode}:{}),...gameVisibility(visibility),...(flavor?{flavor}:{}),...(gainLimits?{gainLimits}:{}),
    ...(holdCount?{holdCount}:{}),...(holdPower?{holdPower}:{})};
  if(!critical)return entry;
  return {...entry,effects:[...effects,{when:'held',kind:'critChance',amount:critical,to:'self',scaleStack:'count'}]};
}
const gameForcedMoveBlocked=(b,unit)=>unit.immovable||!!gameHeldModifiers(b,unit,null).forcedMoveImmune;
function gameHeldModifiers(b,unit,opponent){
  const modifiers={};
  for(const [name,trait] of Object.entries(unit.stackTraits||{})){
    const count=unit.stacks[name]||(trait.stackAxesMode==='power'?stackPotency(unit,name):0);
    if(!count)continue;
    const entries=gameUpgradeStackTrait(trait).effects.filter(effect=>effect.when==='held'&&heldStackEffectKinds.includes(effect.kind));
    if(!entries.length)continue;
    const ctx=gameContext(unit,{name,effects:entries},opponent?[opponent]:[]);
    for(const effect of gameRunBlocks(b,ctx,opponent,entries)){
      if(!gameEffectCondition(b,ctx,unit,effect,opponent,'held'))continue;
      const raw=effect.amountExpr?Math.trunc(effect.amountMode==='percent'&&effect.amountExpr.type==='percent'?effect.amountExpr.value:gameFlowValue(b,ctx,unit,effect.amountExpr)):effect.amount;
      const signed=signedEffects.includes(effect.kind)||ratioEffects[effect.kind]?.[1]===0;
      const amount=bounded(raw,signed?-999:0,999)*(effect.scaleStack==='count'?count:1);
      const key=effect.kind+(effect.amountMode==='percent'?'Percent':'');
      modifiers[key]=(modifiers[key]||0)+amount;
    }
  }
  return modifiers;
}
const gamePreset = (id,name,power,range,role='normal',target=1,rows=[],cost=0,clash=true) =>
  ({id,name,power,range,role,target,clash,cost,notes:'',image:'',effects:rows});
const gameEffect = (when,kind,amount,to='target',tag='') => ({when,kind,amount,to,tag,condition:'',threshold:1});
const gameGuard=gamePreset('guard','뒤를 맡겨','2d+3','1~4','guard','self',[],0,false);
const gameDefaults = [
  gamePreset('strike','충격 방출','2d+3','1~3','normal',1,[gameEffect('hit','push',1),gameEffect('wall','percent',50),gameEffect('hit','stack',2,'target','상처')]),
  gamePreset('hold','맞받아치기','2d+4','1~2'),
  gamePreset('shot','엄호 사격','2d+2','2~5','assist'),
  gameGuard,
  gamePreset('trace','틈을 벌려','2d+2','1~3','chain',1,[gameEffect('hit','consume',2,'target','상처'),gameEffect('consume','perStack',2)]),
  gamePreset('draw','잉여 기록','0','0','normal','self',[gameEffect('use','draw',2,'self')],0,false),
  gamePreset('rush','파고들기','2d+1','1~3','normal',1,[gameEffect('hit','move',1,'self')]),
  gamePreset('burn','그릇 밖의 힘','3d+6','1~4','overload',1,[gameEffect('hit','push',2),gameEffect('end','exile',1,'self')],20),
];
const gameCopyPreset={...gamePreset('handCopy','거울 기록','0','0','normal','self',[
  gameEffect('end','copyChosen',1,'self')
],0,false),optional:true};
const gameResourcePresets=[
  gamePreset('bloodResolve','피로 다잡은 정신','0','0','normal','self',[
    gameEffect('use','healthCost',5,'self'),
    {...gameEffect('use','mind',2,'self'),scaleResource:'health'}
  ],0,false),
  gamePreset('mindBlade','정신을 벼린 칼','2d+2','1~3','normal',1,[
    gameEffect('use','mindCost',10,'self'),
    {...gameEffect('use','power',1,'self'),scaleResource:'mind'}
  ]),
  gamePreset('lifeline','생명의 나눔','0','0','normal','self',[
    gameEffect('use','healthCost',6,'self'),
    {...gameEffect('use','allyHeal',2,'woundedAlly'),scaleResource:'health'}
  ],0,false)
].map(card=>({...card,optional:true}));
const gameAwakeningPresets=[
  gamePreset('demonOffer','삼킨 말','2d+2','1~3','normal',1,[
    {...gameEffect('use','hearDemon',3,'self'),powerGain:4}
  ]),
  gamePreset('selfMeaning','내가 새긴 뜻','2d+4','1~3','normal',1,[
    gameEffect('win','shedShell',5,'self')
  ]),
  gamePreset('rebuildShell','벗어낸 자리','0','0','normal','self',[
    gameEffect('use','awakenBody',8,'self'),
    gameEffect('end','inscribeMeaning',3,'self')
  ],0,false)
].map((card,index)=>({...card,optional:true,requiredState:['any','collapsed','awakened'][index]}));
const gameCrisisCards=[
  gamePreset('crisisFace','맞서는 의지','2d+5','1~5','normal',1,[]),
  gamePreset('crisisGuard','지키는 의지','2d+5','1~5','guard','self',[],0,false),
  gamePreset('crisisGive','내어주는 의지','0','0','normal','self',[
    gameEffect('use','healthCost',4,'self'),
    {...gameEffect('use','allyHeal',8,'woundedAlly'),condition:'healthPaid'}
  ],0,false),
  gamePreset('crisisEndure','버티는 의지','0','0','normal','self',[gameEffect('use','shield',3,'self')],0,false),
  gamePreset('crisisAdvance','돌파하는 의지','2d+6','1~4'),
  gamePreset('crisisPrecision','꿰뚫는 의지','2d+6','1~4','normal',1,[gameEffect('use','critCharges',1,'self')])
].map(card=>({...card,trial:true,temporary:true}));
const gameCollapseCard={...gamePreset('collapseStrike','무차별 격발','3d+6','1~5','normal',1,[],0,false),requiredState:'collapsed',temporary:true};
const gameStarterDeck=[...gameDefaults,gameDefaults[0],gameGuard];
const gameCounterPreset={...gamePreset('rebound','빈틈을 되돌려','2d+3','1~3','counter','self',[
  gameEffect('hit','stack',1,'target','상처')
],0,false),optional:true};
const gameConceptStack=(name,to='self',amount=1)=>({
  ...gameEffect(to==='self'?'use':'hit','stack',amount,to,name),stackCap:conceptStacks[name].cap
});
const gameConceptPresets=[
  {...gamePreset('conceptGourmet','미식가 · 대가 지불','3d+8','1~3','normal',1,[
    gameConceptStack('미식가의 식탁'),gameEffect('damage','drainLife',4)
  ],18),notes:'미식가의 식탁을 자신에게 부여. 생명력을 섭취해 치유하며 중첩이 있는 동안 흡수 효과가 지속됩니다.'},
  {...gamePreset('conceptReturn','귀로 · 마지막 귀환','3d+7','1~4','normal',1,[
    gameConceptStack('귀환의 문턱'),gameEffect('use','positionAnchor',1,'self'),gameEffect('end','retreat',2,'self')
  ],16),notes:'공격한 칸에 귀환 좌표를 기록하고 처리 후 후퇴. 다음 라운드 시작에 빈 좌표로 복귀합니다. 귀환의 문턱은 전투 중 지속됩니다.'},
  {...gamePreset('conceptSuture','봉합공 · 백색 수선','3d+7','1~3','normal',1,[
    gameConceptStack('백색 봉합'),gameEffect('use','rallyShield',4,'self')
  ],14),notes:'자신에게 백색 봉합을 부여하고 다른 아군 전원에게 보호막 4. 봉합이 남아 있는 동안 매 턴 보호막과 회복을 얻습니다.'},
  {...gamePreset('conceptClock','정각의 세입자 · 점검 시각','3d+8','1~4','normal',1,[
    gameConceptStack('정각의 거주'),gameEffect('hit','nextSlow',2),gameEffect('hit','weaken',3)
  ],16),notes:'대상의 다음 이동과 판정 위력을 낮춥니다. 정각의 거주가 있는 동안 이동 없이 사용하는 카드에 보호막 보너스를 얻습니다.'},
  {...gamePreset('conceptCoffin','빈 관을 끄는 것 · 만조의 종','3d+8','1~4','normal',1,[
    gameEffect('hit','pull',2),gameConceptStack('인양의 명패','target')
  ],18),notes:'인양의 명패를 적에게 부여. 보유 중 받는 피해가 증가하고 턴 종료마다 고정 피해를 받습니다. 최대 3중첩.'},
  {...gamePreset('conceptDebris','잔해의 대리인 · 파단 증언','3d+7','1~4','normal',1,[
    gameEffect('hit','stripShield',8),gameConceptStack('파단 증언','target',2)
  ],15),notes:'보호막을 깎고 파단 증언 2 부여. 이후 동료의 공격도 중첩당 추가 피해를 줍니다. 최대 3중첩.'},
  {...gamePreset('conceptRespite','말미 장수 · 십 분의 숙고','3d+7','1~4','normal',1,[
    gameConceptStack('숙고의 말미'),gameEffect('use','draw',1,'self')
  ],16),notes:'카드 1장을 뽑고 숙고의 말미를 부여. 이후 턴 시작마다 추가 드로우와 다음 판정 위력 보너스를 얻습니다.'},
  {...gamePreset('conceptMeteor','거슬러 오르는 별똥별 · 역행','3d+9','2~5','normal',1,[
    gameConceptStack('역행하는 별빛'),gameEffect('hit','push',1)
  ],20),notes:'역행하는 별빛이 있는 동안 치명타 확률과 치명타 피해가 증가합니다. 적을 밀어내며 사거리를 유지합니다.'},
  {...gamePreset('conceptPerforate','절취선 사냥개 · 점선 물어뜯기','1d+4','1~3','normal',1,[
    {...gameConceptStack('절취선','target'),hitIndex:1},
    {...gameConceptStack('절취선','target'),hitIndex:2}
  ],14),hitPowers:['1d+4','1d+4'],notes:'2회 타격. 각 타격 적중 시 절취선 1 부여. 중첩당 받는 피해가 5% 증가하며 최대 6중첩까지 전투 중 지속됩니다.'},
  {...gamePreset('conceptTearOpen','절취선 사냥개 · 접힌 상처를 펼쳐라','3d+8','1~3','normal',1,[
    {...gameEffect('hit','consume',1,'target','절취선'),consumeAmount:'all'},
    gameEffect('consume','perStack',4)
  ],20),notes:'기본 공격 뒤 대상의 절취선을 전부 소모하고 총 중첩 위력당 추가 피해 4. 절취선이 없으면 기본 공격만 실행합니다. 남겨서 동료의 공격을 강화할지, 지금 소모할지 선택하세요.'}
].map((card,index)=>({...card,optional:true,concept:true,requiredState:'any',flavor:[
  '조우 기록 · 식탁에는 네 사람 몫의 식기가 있었다. 접시를 뒤집자 각자의 처분 번호가 새겨져 있었다. “빈 접시로 돌아가실 수는 없습니다.”',
  '“문이 닫혀도 문턱을 기억해. 네가 두고 온 한 걸음은 아직 거기 있어.”',
  '조우 기록 · 봉합공은 찢어진 방벽을 꿰매고 있었다. 백색 실은 바늘귀를 지나 대원의 소매 안으로 이어졌다.',
  '“정각입니다. 발을 떼지 마세요. 이 방은 세입자가 움직이는 동안만 무너집니다.”',
  '조우 기록 · 만조의 종이 울리자 빈 관이 물 위로 떠올랐다. 뚜껑 위의 명패에는 아직 살아 있는 승객의 이름이 적혀 있었다.',
  '“누가 먼저 벽을 쳤는지는 몰라. 다만 여기 남은 파편들은 전부 같은 쪽을 향하고 있어.”',
  '“십 분을 더 드리지요. 값을 치르는 건 어렵지 않습니다. 돌아가서 그 십 분을 잊지 마세요.”',
  '조우 기록 · 창밖 별빛이 철로를 거슬러 올라왔다. 곧이어 아직 발사하지 않은 탄환이 손바닥 위로 떨어졌다.',
  '조우 기록 · 금속 이빨이 두 번 닫혔다. 갑옷에는 작은 구멍들만 남았다. 팔을 들자 구멍 사이로 점선이 이어졌다.',
  '“점선을 따라 뜯으시오.” 포장지에 적힌 문장을 읽는 동안, 사냥개는 이미 그 선의 끝을 물고 있었다.'
][index]}));

const defenseEffect=(when,kind,publicLabel,to='target')=>({...gameEffect(when,'defense:'+kind,1,to),publicLabel});
const defenseGenerate=id=>({...gameEffect('use','giveCard',1,'self'),givenCardId:id});
const defenseStarts=[
  {...gamePreset('conceptVaultStart','빗장 잠그기','1d6+4','1~2','normal',1,[
    gameEffect('hit','shield',14),gameConceptStack('철벽 빗장','target',2),
    defenseEffect('hit','coverCut','대상 주변 1칸에서 단일 공격 대리 방어 · 대상에게 들어오는 광역 공격 차단'),
    defenseGenerate('conceptVaultReflect')
  ],11,false),targetSide:'ally'},
  {...gamePreset('conceptSnailStart','단단해지기','1d6+2','1~2','normal',1,[
    gameEffect('hit','shield',16),gameConceptStack('바위 껍질','target',2),
    defenseEffect('hit','cover','대상 주변 1칸에서 단일 공격 대리 방어'),defenseGenerate('conceptSnailRoll')
  ],10,false),targetSide:'ally'},
  gamePreset('conceptSafeStart','돈으로 막기','2d6+3','1~2','normal',1,[
    gameEffect('use','shield',10,'self'),gameConceptStack('비축 금화','self',3),defenseGenerate('conceptSafeStrike')
  ],11)
].map((card,index)=>({...card,concept:true,optional:true,flavor:[
  '“문은 내가 잠글 테니 당신은 뒤에 서요.”',
  '조우 기록 · 돌팽이가 지나간 자리에 젖은 진흙 줄이 남았다.',
  '“금화 한 닢이면 한 대쯤은 막아 드리지요.”'
][index]}));
const defenseGenerated=[
  gamePreset('conceptVaultReflect','충격 반사','2d6+4','1~2','normal',1,[
    defenseEffect('hit','reflect','자신의 보호막 잔량만큼 고정 피해 · 예고 광역 삭제'),
    gameEffect('hit','push',2)
  ],14),
  gamePreset('conceptSnailRoll','구르기','0','1~3','normal',1,[
    gameEffect('hit','push',2),
    defenseEffect('hit','roll','다음 라운드 입히는 피해 −50% · 바위 껍질 4중첩이면 행동 1회 봉쇄')
  ],14,false),
  gamePreset('conceptSafeStrike','돈으로 때리기','2d6+5','1~2','normal',1,[
    defenseEffect('hit','spend','비축 금화 전부 소모 · 개당 고정 피해 5 · 처치 시 절반 올림 환급'),
    gameEffect('hit','weaken',3)
  ],15)
].map((card,index)=>({...card,concept:true,generated:true,flavor:[
  '조우 기록 · 빗장이 울리자 충격이 들어온 길을 되짚었다.',
  '돌이 굴러간 뒤에도 땅은 한동안 흔들렸다.',
  '“이제 계산서를 돌려드릴 차례군요.”'
][index]}));
function gameDefenseEffect(b,ctx,unit,kind){
  const actor=ctx.actor;
  if(kind==='cover'||kind==='coverCut'){
    unit.defenseCover=b.round;
    if(kind==='coverCut')unit.defenseSplashCut=b.round;
  }else if(kind==='reflect'){
    gameDamage(b,unit,actor.shield,actor,false,false,true,{kind:'card'});
    if(b.intent?.attacker===unit.id||unit===b.units.enemy)b.intent.noSplash=true;
    if(actor.stacks['철벽 빗장']>=4)actor.nextShield=(actor.nextShield||0)+10;
  }else if(kind==='roll'){
    unit.defenseWeakenRound=b.round+1;
    if(actor.stacks['바위 껍질']>=4)unit.defenseSkip=(unit.defenseSkip||0)+1;
  }else if(kind==='spend'){
    const tag='비축 금화',count=actor.stacks[tag]||0;
    gameTakeStacks(actor,tag,count);
    gameDamage(b,unit,count*5,actor,false,false,true,{kind:'card'});
    if(!gameAlive(unit)&&count)gameGrantStacks(b,actor,{tag,stackCap:6},Math.ceil(count/2),gameConceptTraits[tag],undefined,actor.id);
  }
}
function gameDefenseRedirect(b,ctx,target){
  if(ctx.card.unredirectable||ctx.card.splash||ctx.card.target!==1||ctx.card.targetSide==='ally'||ctx.actor.enemy===target.enemy)return target;
  const guard=Object.values(b.units).find(unit=>unit!==target&&unit.enemy===target.enemy&&
    gameAlive(unit)&&!unit.blockedRounds&&unit.defenseCover===b.round&&gameDistance(unit,target)<=1);
  if(!guard)return target;
  delete guard.defenseCover;
  gameLog(b,guard.name+' · '+target.name+' 대신 대리 방어');
  return guard;
}

const fieldEffect=(when,kind,publicLabel,to='target')=>({...gameEffect(when,'field:'+kind,1,to),publicLabel});
const fieldStarts=[
  gamePreset('conceptPlummetStart','조준 고정','1d6+4','2~4','normal',1,[
    gameConceptStack('충전 과압','self',3),fieldEffect('use','dropShield','자신의 보호막 전부 제거','self'),
    defenseGenerate('conceptPlummetDrop')
  ],9),
  gamePreset('conceptTrifaceStart','면 모으기','2d6+4','1~3','normal',1,[
    fieldEffect('hit','gather','삼면점 부여 · 주변 유닛 밀기 · 벽 충돌 시 임시 벽'),defenseGenerate('conceptTrifaceBloom')
  ],11),
  gamePreset('conceptStitchSeam','바늘땀 꿰매기','1d4+2','1~2','normal',1,[
    fieldEffect('hit','stitch','대상의 바늘땀만큼 연타 · 7타째 방어막 관통 고정 피해 14')
  ],11),
  {...gamePreset('conceptHeronSpring','마르지 않는 만조','0','0~4','normal','tile',[
    fieldEffect('use','spring','반경 2칸 아군 회복 및 정화 · 맑은 물결 부여 · 물웅덩이 생성','self')
  ],12,false),targetSide:'ally'}
].map((card,index)=>({...card,concept:true,optional:true,
  flavor:['“세 걸음이면 충분해.”','빈 면이 하나씩 닫힐 때마다 가운데 점이 밝아졌다.',
    '“실이 끊어진 자리는 다시 꿰매면 돼.”','조우 기록 · 마른 바닥 아래에서 맑은 물이 솟았다.'][index]}));
const fieldGenerated=[
  gamePreset('conceptPlummetDrop','수직 낙하','6d6+15','1~4','normal',1,[
    fieldEffect('use','drop','충전 과압 전부 소모 · 위력과 치명타 배율 상승 · 방어막 및 경감 관통','self'),
    fieldEffect('attackEnd','recoil','처치하지 못하면 현재 체력 15% 피해 및 다음 라운드 행동 불가','self')
  ],22),
  gamePreset('conceptTrifaceBloom','개화','3d6+6','1~4','normal',1,[
    fieldEffect('hit','bloom','막힌 면에 따라 피해 상승 · 삼면점 소모 및 이동 불가')
  ],16)
].map((card,index)=>({...card,concept:true,generated:true,
  flavor:['쇠추가 떨어질 때 바닥은 아직 그 그림자를 보지 못했다.','마지막 면이 닫히자 점이 꽃처럼 벌어졌다.'][index]}));
function gameFieldGrant(b,unit,tag,count,actor,power=1){
  return gameGrantStacks(b,unit,{tag,stackCap:conceptStacks[tag].cap,stackPower:power},count,gameConceptTraits[tag],undefined,actor.id);
}
function gameClosedFaces(b,unit){
  const {x,y}=gridPoint(unit.pos);
  const blocked=gameBlocked(b,unit);
  return [[-1,0],[1,0],[0,-1],[0,1]].filter(([dx,dy])=>{
    const pos=gridIndex(x+dx,y+dy);
    return !gridValid(pos)||blocked.has(pos);
  }).length;
}
function gameFieldCleanse(unit){
  if(unit.rooted||unit.rootNext){unit.rooted=false;unit.rootNext=false;}
  else if(unit.blockedRounds||unit.nextBlockedRounds){unit.blockedRounds=0;unit.nextBlockedRounds=0;}
  else if(unit.mindStatuses?.mindRecoveryCut)delete unit.mindStatuses.mindRecoveryCut;
  else if(unit.mindStatuses?.mindBurn)delete unit.mindStatuses.mindBurn;
  else if(unit.poison||unit.damageOverTime?.length){
    unit.poison=0;delete unit.poisonSources;delete unit.damageOverTime;
  }else return false;
  return true;
}
function gameFieldEffect(b,ctx,unit,kind){
  const actor=ctx.actor;
  switch(kind){
    case 'dropShield':gameRemoveShield(actor,actor.shield);break;
    case 'drop': {
      const count=actor.stacks['충전 과압']||0;
      gameTakeStacks(actor,'충전 과압',count);
      ctx.mod+=count*5;
      ctx.fieldCrit=count*25;
      const path=b.fieldPaths?.get(actor.id)||[];
      const first=gridPoint(path[0]),last=gridPoint(path.at(-1));
      ctx.fieldStraight=path.length>=4&&(first.x===last.x||first.y===last.y)&&gridDistance(path[0],path.at(-1))===path.length-1;
      break;
    }
    case 'recoil':
      if(ctx.targets.some(gameAlive)){
        gameDamage(b,actor,Math.floor(actor.hp*0.15),actor,false,false,false,{kind:'card'});
        actor.nextBlockedRounds=Math.max(actor.nextBlockedRounds||0,1);
      }
      break;
    case 'gather': {
      gameFieldGrant(b,unit,'삼면점',gameClosedFaces(b,unit)===4?3:1,actor);
      const adjacent=Object.values(b.units).filter(other=>other!==unit&&other!==actor&&gameAlive(other)&&gameDistance(other,unit)<=2)
        .sort((left,right)=>gameDistance(unit,left)-gameDistance(unit,right))[0];
      if(!adjacent||gameForcedMoveBlocked(b,adjacent))break;
      const pos=gridDisplacement(unit.pos,adjacent.pos,false);
      const walls=gameBattleWalls(b,adjacent);
      if(gridValid(pos)&&!walls.includes(pos)){gamePosition(b,adjacent,pos);break;}
      const {x,y}=gridPoint(adjacent.pos),blocked=gameBlocked(b,adjacent);
      const index=[gridIndex(x+1,y),gridIndex(x-1,y),gridIndex(x,y+1),gridIndex(x,y-1)]
        .find(tile=>gridValid(tile)&&!blocked.has(tile));
      if(index!==undefined)(b.extraWalls??=[]).push({index,through:b.round+1,ownerSide:actor.enemy});
      break;
    }
    case 'bloom':
      gameTakeStacks(unit,'삼면점',unit.stacks['삼면점']||0);
      unit.rootNext=true;
      break;
    case 'stitch':
      if(!unit.stacks['바늘땀'])gameFieldGrant(b,unit,'바늘땀',1,actor);
      break;
    case 'spring':
      if(!gridValid(ctx.targetTile)||ctx.fieldSpring)return;
      ctx.fieldSpring=true;
      for(const ally of Object.values(b.units).filter(value=>value.enemy===actor.enemy&&gameAlive(value)&&gridDistance(value.pos,ctx.targetTile)<=2)){
        const scale=ally.hp*2<=ally.maxHp||ally.mind<=5?1.5:1;
        gameHeal(b,ally,Math.floor(18*scale));
        gameMental(b,ally,Math.floor(12*scale));
        gameFieldCleanse(ally);
        gameFieldGrant(b,ally,'맑은 물결',2,actor,4);
      }
      b.tiles??={};
      for(let pos=0;pos<gridSize;pos++)if(!b.walls.includes(pos)&&gridDistance(pos,ctx.targetTile)<=2)
        b.tiles[pos]={kind:'spring',side:actor.enemy,through:b.round+2};
      break;
  }
}
function gameFieldRound(b,when){
  for(const unit of Object.values(b.units).filter(gameAlive)){
    const water=unit.stacks['맑은 물결']||0;
    if(when==='turnStart'){
      if(unit.inkBuff?.includes('cyan'))gameGainShield(b,unit,8,{},'cyanInk');
      if(water&&gameFieldCleanse(unit)){
        gameTakeStacks(unit,'맑은 물결',1);
        gameGainShield(b,unit,4,{},'clearWater');
      }
      continue;
    }
    if(unit.inkBuff?.includes('yellow')){gameHeal(b,unit,8);gameMental(b,unit,5);}
    if(unit.stacks['충전 과압']&&unit.fieldAttackRound!==b.round)gameFieldGrant(b,unit,'충전 과압',1,unit);
    if(unit.stacks['삼면점']&&gameClosedFaces(b,unit)>=3){
      gameFieldGrant(b,unit,'삼면점',1,unit);
      gameDamage(b,unit,unit.stacks['삼면점']*3,unit,false,false,true,{kind:'stack'});
    }
    if(water&&gameAlive(unit)){
      const potency=stackPotency(unit,'맑은 물결');
      gameHeal(b,unit,potency);
      gameMental(b,unit,potency);
      gameTakeStacks(unit,'맑은 물결',1);
    }
    const tile=b.tiles?.[unit.pos];
    if(tile?.kind==='spring'&&tile.side===unit.enemy&&gameAlive(unit))gameMental(b,unit,3);
  }
}

const guestEffect=(when,kind,publicLabel,to='target')=>({...gameEffect(when,'guest:'+kind,1,to),publicLabel});
const redItch='붉은 소양감';
const guestStarts=[
  gamePreset('conceptFleshNails','살덩이 · 붉은 소양감','0','0','normal','self',[
    guestEffect('use','itch','붉은 소양감 1 획득 또는 현재 중첩 2배','self')
  ],10,false),
  gamePreset('conceptBlindJudge','심판 · 눈 먼 천칭의 일격','5d10+18','1~2','normal',1,[
    guestEffect('hit','verdict','치명타 차단 · 주는 쪽 감소 무시 · 부정 상태당 위력 +4, 최대 +16 · 홀수 주사위 합이면 인접 여파')
  ],16),
  gamePreset('conceptGuestStart','이방인 · 소매 안쪽의 필기','2d6+4','1~3','normal',1,[
    guestEffect('use','rim','인접 아군이 없으면 다음 피격 주사위 상한 절반','self'),
    guestEffect('hit','replay','직전에 다른 유닛이 적용한 카드 부가 효과 재발동'),
    defenseGenerate('conceptGuestAgain')
  ],10)
].map((card,index)=>({...card,concept:true,optional:true,
  flavor:['“긁지 말라고 했지. 손톱이 자라지 않는다고는 안 했어.”','천칭 한쪽에 피고의 죄목이 하나씩 올랐다.',
    '손님은 이름 대신 앞 사람이 쓴 문장을 적어 냈다.'][index]}));
const guestGenerated={...gamePreset('conceptGuestAgain','이방인 · 이번에는 무엇이 다릅니까','2d6+6','1~3','normal',1,[
  guestEffect('hit','penalty','대상의 최다 사용 카드에 불리한 재굴림 및 행동 순서 지연'),
  guestEffect('hit','isolate','아군에게서 멀어지고 다음 라운드까지 근접 지정 면역','self')
],14),concept:true,generated:true,flavor:'“이번에는 무엇이 다릅니까?”'};
const replayableGuestEffects=new Set(['shield','heal','mind','drain','poison','weaken','nextSlow','push','pull','stack']);
function gameItchRound(b,unit,when){
  const itch=unit.stacks[redItch]||0;
  if(when==='turnStart'){
    if(itch){
      unit.redBleed={power:itch*4,count:Math.max(2,unit.redBleed?.count||0)};
      unit.stacks[redItch]++;
    }
    return;
  }
  const bleed=unit.redBleed;
  if(!bleed)return;
  gameDamage(b,unit,itch?Math.min(bleed.power,unit.hp-1):bleed.power,b.units[bleed.dealer]||unit,true,false,true,{kind:'stack'});
  bleed.count=Math.max(itch?1:0,bleed.count-1);
  if(!bleed.count)delete unit.redBleed;
}
function gameItchHit(b,actor,target){
  const itch=actor.stacks[redItch]||0;
  if(!itch||!actor.redBleed||actor===target||actor.enemy===target.enemy||!gameAlive(target))return;
  const amount=Math.ceil(actor.redBleed.power/2);
  actor.redBleed.power-=amount;
  target.redBleed={power:(target.redBleed?.power||0)+amount,count:Math.max(itch,target.redBleed?.count||0),dealer:actor.id};
  gameHeal(b,actor,Math.max(3,amount));
}
function gameGuestEffect(b,ctx,unit,kind){
  const actor=ctx.actor;
  switch(kind){
    case 'itch':
      actor.stackTraits??={};
      actor.stackTraits[redItch]=gameConceptTraits[redItch];
      actor.stacks[redItch]=Math.max(1,(actor.stacks[redItch]||0)*2);
      break;
    case 'rim':
      if(!Object.values(b.units).some(other=>other!==actor&&gameAlive(other)&&other.enemy===actor.enemy&&gameDistance(other,actor)<=1))
        actor.guestRim=b.round+1;
      break;
    case 'replay': {
      if(ctx.guestReplayed)return;
      const record=b.guestActions?.findLast(entry=>entry.actor!==actor.id&&entry.card!==ctx.card.id);
      if(!record)return;
      ctx.guestReplayed=true;
      for(const effect of record.effects)gameApplyVisibleEffect(b,ctx,'hit',unit,0,{...effect,to:'target'},unit,new Set());
      gameLog(b,actor.name+' · '+record.effects.length+'개 부가 효과 받아 적음');
      break;
    }
    case 'penalty': {
      const counts=Object.entries(unit.cardUseCounts||{}).sort((left,right)=>right[1]-left[1]);
      if(counts.length)unit.guestPenalty={card:counts[0][0],through:b.round+1};
      break;
    }
    case 'isolate': {
      const allies=Object.values(b.units).filter(other=>other!==actor&&other.enemy===actor.enemy&&gameAlive(other));
      if(allies.length&&!gameForcedMoveBlocked(b,actor)){
        const distance=pos=>Math.min(...allies.map(ally=>gridDistance(ally.pos,pos)));
        const tile=[...gridPaths(actor.pos,1,gameBlocked(b,actor)).keys()].sort((a,c)=>distance(c)-distance(a))[0];
        gamePosition(b,actor,tile);
      }
      actor.guestMelee=b.round+1;
      break;
    }
  }
}
function gameRecordGuestAction(b,ctx){
  if(ctx.guestRecorded||!b.guestActions)return;
  ctx.guestRecorded=true;
  b.guestActions.push({actor:ctx.actor.id,card:ctx.card.id,effects:ctx.guestEffects||[]});
}
function gameCountCardUse(b,ctx){
  if(ctx.card.target!=='self'&&(ctx.card.role==='normal'||cardHitPowers(ctx.card).some(power=>power!=='0')))ctx.actor.ruleUsedAttack=b.round;
  const counts=ctx.actor.cardUseCounts??={};
  if(typeof counts[ctx.card.id]!=='number')counts[ctx.card.id]=0;
  counts[ctx.card.id]++;
}

const ruleCardEffect=(when,kind,publicLabel,to='target')=>({...gameEffect(when,'rulecard:'+kind,1,to),publicLabel});
const ruleCards=[
  gamePreset('conceptCommuteStart','확인반 · 출근 중이십니까?','1d6+3','1~3','normal',1,[
    ruleCardEffect('use','attendance','다음 라운드 공격 여부 판정 · 근무 시 정신력 환급 및 드로우 · 지연 시 회중시계 생성')
  ],9),
  gamePreset('conceptDread','괴담 · 눈을 마주친 그림자','2d6+4','1~3','normal',1,[
    ruleCardEffect('hit','dread','정신력 50 이하 4d6+8 · 25 이하 6d6+12 및 밀기 · 80 이상 1d4+2 및 은신')
  ],11),
  gamePreset('conceptMaze','미로 · 끝없는 하얀 복도','1d6+4','1~4','normal',1,[
    ruleCardEffect('hit','maze','2라운드 동안 이동 시 입구로 되돌리고 정신력 −4 · 시전자 +3')
  ],12),
  {...gamePreset('conceptApproach','신비 · 등 뒤의 발소리','3d6+6','1~12','normal',1,[
    ruleCardEffect('use','behind','가장 먼 인접 빈 칸으로 순간이동'),
    ruleCardEffect('hit','confuse','유개념자에게만 다음 라운드까지 지정 제한 · 사거리 1 · 빗나감 50%')
  ],13,false),boardReach:true}
  ,{...gamePreset('conceptScribeStart','속기 · 녹음 시작','0','0~4','normal',1,[
    ruleCardEffect('use','record','체력·정신력·좌표 기록 · 아군 소모 감소 및 이동 증가 · 적 위력과 이동 감소'),
    defenseGenerate('conceptScribeRewind')
  ],10,false),targetSide:'any'}
].map((card,index)=>({...card,concept:true,optional:true,
  flavor:['“오늘도 출근하셨습니까?”','고개를 돌렸을 때 그림자는 벌써 앞에 있었다.',
    '벽에 그은 표식이 몇 걸음 뒤에 다시 나타났다.','발소리가 멎은 뒤에야 바로 뒤에 누군가 있음을 알았다.','“지금부터 기록을 시작합니다.”'][index]}));
const commuteSeize={...gamePreset('conceptCommuteSeize','확인반 · 회중시계 닫기','1d6+3','1~2','normal',1,[
  ruleCardEffect('hit','seize','다음 라운드 이동력 0 · 대상 1칸 끌기')
],0,false),concept:true,generated:true,firstStrike:true,hitPowers:['1d6+3','1d6+3','1d6+3'],
  flavor:'뚜껑이 닫히는 소리와 함께 초침이 멈췄다.'};
const scribeRewind={...gamePreset('conceptScribeRewind','속기 · 되감기 버튼','1d6+2','0~12','normal',1,[
  ruleCardEffect('hit','rewind','기록한 체력·정신력·좌표 복원 · 수치별 최대 40 · 적에게만 피해')
],15,false),concept:true,generated:true,boardReach:true,targetSide:'any',flavor:'목소리는 테이프를 거슬러 올라가도 기억은 그 자리에 남았다.'};
function gameRuleCost(b,unit,card){
  return effectiveCardCost(unit,card,b.round);
}
function gameBeyondTarget(b,actor,target){
  const {x,y}=gridPoint(target.pos),blocked=gameBlocked(b,actor);
  return [[-1,0],[1,0],[0,-1],[0,1]].map(([dx,dy])=>gridIndex(x+dx,y+dy))
    .filter(tile=>gridValid(tile)&&!blocked.has(tile)&&tile!==actor.pos)
    .sort((a,c)=>gridDistance(actor.pos,c)-gridDistance(actor.pos,a))[0];
}
function gameDreadPower(target){
  const mind=target?.mind??50;
  return mind<=25?'6d6+12':mind<=50?'4d6+8':mind>=80?'1d4+2':'2d6+4';
}
function gameRuleCardEffect(b,ctx,unit,kind){
  const actor=ctx.actor;
  switch(kind){
    case 'applause': {
      const id=applauseCards[1].id;
      const generate=actor.hand.length<12&&!actor.hand.includes(id);
      gameAddApplause(actor,generate?3:4);
      if(generate)gamePlaceCards(b,actor,'hand',[id]);
      break;
    }
    case 'release': {
      const count=actor.stacks[applause]||0;
      if(!count)break;
      gameWriteStacks(actor,applause,[]);
      ctx.applauseSpent=count;
      actor.applauseRelease={round:b.round+1,power:count*5,crit:count*10};
      actor.move=Math.min(7,actor.move+3);
      actor.applauseMoveStart=Math.min(7,(actor.applauseMoveStart||0)+3);
      gameMental(b,actor,8);
      gameDraw(actor,1,b);
      break;
    }
    case 'contempt':
      if(ctx.applauseSpent){
        actor.contemptThrough=b.round+1;
        gameRemoveShield(actor,Math.floor(actor.shield/2));
        if(ctx.applauseSpent>=3)unit.applauseShieldCut=b.round+1;
      }
      break;
    case 'attendance':
      (unit.attendance??={})[actor.id]={round:b.round,cost:ctx.rulePaid??ctx.card.cost};
      break;
    case 'seize': {
      unit.rootNext=true;
      const dest=gridDisplacement(actor.pos,unit.pos,true);
      if(!gameForcedMoveBlocked(b,unit))gamePosition(b,unit,dest);
      break;
    }
    case 'dread':
      if(ctx.ruleDreadPower==='6d6+12'&&!gameForcedMoveBlocked(b,unit))gamePosition(b,unit,gridDisplacement(actor.pos,unit.pos,false));
      if(ctx.ruleDreadPower==='1d4+2')actor.ruleStealth={through:b.round+1};
      break;
    case 'record':
      unit.scribeRecord={hp:unit.hp,mind:unit.mind,pos:unit.pos,issuer:actor.id,through:b.round+2};
      if(unit.enemy===actor.enemy){unit.scribeDiscount=b.round+2;unit.nextMove++;}
      else{unit.nextPower=(unit.nextPower||0)-3;unit.nextMove--;}
      break;
    case 'rewind': {
      const saved=unit.scribeRecord;
      if(!saved||saved.issuer!==actor.id||saved.through<b.round||!gameAlive(unit))break;
      unit.hp=bounded(unit.hp+bounded(saved.hp-unit.hp,-40,40),1,unit.maxHp);
      unit.mind=bounded(unit.mind+bounded(saved.mind-unit.mind,-40,40),0,100);
      gamePosition(b,unit,saved.pos);
      delete unit.scribeRecord;
      gameLog(b,unit.name+' · 기록으로 되감기');
      break;
    }
    case 'maze':unit.whiteMaze={pos:unit.pos,caster:actor.id,through:b.round+2};break;
    case 'behind': {
      const tile=gameBeyondTarget(b,actor,unit);
      if(tile!==undefined)gamePosition(b,actor,tile);
      else ctx.ruleNoTarget=true;
      break;
    }
    case 'confuse':
      if(unit.conceptEntity||Object.entries(unit.stackTraits||{}).some(([tag,trait])=>trait.concept&&unit.stacks[tag]>0)){
        actor.ruleStealth={through:b.round+1,from:unit.id};
        unit.ruleConfusion=b.round+1;
      }
      break;
  }
}
function gameAttendanceEnd(b){
  for(const unit of Object.values(b.units)){
    for(const [issuer,mark] of Object.entries(unit.attendance||{})){
      if(mark.round>=b.round)continue;
      delete unit.attendance[issuer];
      const caster=b.units[issuer];
      if(!gameAlive(caster)||!gameAlive(unit))continue;
      if(unit.ruleUsedAttack===b.round){
        gameMental(b,caster,mark.cost);
        gameDraw(caster,1,b);
        gameLog(b,unit.name+' · 근무 확인');
      }else{
        if(caster.hand.includes(commuteSeize.id))gameDamage(b,unit,4,caster,false,false,true,{kind:'card'});
        else if(caster.hand.length<12)gamePlaceCards(b,caster,'hand',[commuteSeize.id]);
        gameLog(b,unit.name+' · 지연');
      }
    }
  }
}
function gameWhiteMazeMove(b,unit){
  const maze=unit.whiteMaze;
  if(!maze||maze.through<b.round)return;
  gamePosition(b,unit,maze.pos);
  gameMental(b,unit,-4);
  const caster=b.units[maze.caster];
  if(gameAlive(caster))gameMental(b,caster,3);
  gameLog(b,unit.name+' · 같은 복도로 돌아옴');
}

const inkColors=['magenta','cyan','yellow','black'];
const emptyInk=()=>Object.fromEntries(inkColors.map(color=>[color,0]));
const artistCards=[
  {...gamePreset('conceptArtistStart','예술가 · 큰 그림을 그리자','2d8+4','1~3','normal','tile',[
    ruleCardEffect('hit','artistStart','반경 2칸 피아 광역 · 아군 피해 절반 · 영감과 미완의 걸작 획득','self')
  ],18,false),optional:true,flavor:'“한 명씩은 아무래도 모자랍니다. 큰 그림을 그리죠.”'},
  {...gamePreset('conceptArtistFinish','예술가 · 미완의 걸작','2d10+6','0~4','normal','tile',[
    ruleCardEffect('hit','artistFinish','영감 전부 소모 · 반경 3칸 체력·정신 피해 · 최다 색 전투 버프','self')
  ],24,false),generated:true,flavor:'마지막 붓질 직전, 네 가지 색 모두가 서로를 비추고 있었다.'}
].map(card=>({...card,concept:true}));
function gameInk(b,color,amount){
  if(amount<=0)return;
  for(const unit of Object.values(b.units).filter(unit=>gameAlive(unit)&&unit.inks)){
    unit.inks[color]+=amount;
    unit.stacks['영감']=Object.values(unit.inks).reduce((total,value)=>total+value,0);
  }
}
function gameArtistAttack(b,ctx){
  const actor=ctx.actor,opening=ctx.card.id==='conceptArtistStart';
  if(!gridValid(ctx.targetTile)||!gridCardInRange(ctx.card,actor.pos,ctx.targetTile)||b.walls.includes(ctx.targetTile))return;
  let amount=0;
  if(opening){
    actor.inks??=emptyInk();
    actor.stackTraits??={};
    actor.stackTraits['영감']=gameConceptTraits['영감'];
    if(actor.hand.length<12&&!actor.hand.includes(artistCards[1].id))gamePlaceCards(b,actor,'hand',[artistCards[1].id]);
  }else if(actor.inks){
    const values=inkColors.map(color=>actor.inks[color]);
    amount=values.reduce((total,value)=>total+value,0);
    if(amount){
      const average=amount/4,tolerance=Math.max(4,average*0.2);
      const best=inkColors[values.indexOf(Math.max(...values))];
      actor.inkBuff=values.every(value=>Math.abs(value-average)<=tolerance)?[...inkColors]:[best];
      gameLog(b,actor.name+' · 걸작 영감 '+amount+' 소모');
    }
    delete actor.inks;
    gameWriteStacks(actor,'영감',[]);
  }
  const power=gameActionPower(b,ctx);
  const radius=opening?2:3;
  for(const unit of Object.values(b.units).filter(unit=>unit!==actor&&gameAlive(unit)&&gridDistance(unit.pos,ctx.targetTile)<=radius)){
    const ratio=actor.enemy===unit.enemy?0.5:1;
    gameStrike(b,ctx,unit,Math.floor(power*ratio));
    if(amount){
      gameDamage(b,unit,Math.floor(amount*0.6*ratio),actor,false,false,true,{kind:'card'});
      if(gameAlive(unit))gameMentalDamage(b,unit,Math.floor(amount*0.3*ratio),actor,{kind:'card'});
    }
  }
}

const applause='수억의 박수';
const applauseCards=[
  {...gamePreset('conceptApplauseStart','관객 · 수억 개의 시선','2d6+4','1~3','normal',1,[
    ruleCardEffect('hit','applause','박수 3 획득 · 경멸 생성 · 생성할 수 없으면 박수 1 추가','self')
  ],11),optional:true,flavor:'셀 수 없는 시선이 한 사람의 발목에 모였다.'},
  {...gamePreset('conceptApplauseScorn','관객 · 단 하나의 경멸','3d6+5','1~4','normal',1,[
    ruleCardEffect('hit','release','박수를 전부 소모하고 이동력 3, 정신력 8과 1장 드로우 · 다음 턴 첫 공격 강화','self'),
    ruleCardEffect('hit','contempt','자신이 받는 피해 +15% · 자신의 보호막 절반 · 3중첩 이상 소모 시 대상의 보호막 획득 절반')
  ],13),generated:true,flavor:'“다들 박수치는데, 당신은 왜 웃지 않습니까?”'}
].map(card=>({...card,concept:true}));
function gameAddApplause(unit,count){
  unit.stackTraits??={};
  unit.stackTraits[applause]=gameConceptTraits[applause];
  unit.stacks[applause]=(unit.stacks[applause]||0)+count;
}
function gameApplauseRound(b,when){
  for(const unit of Object.values(b.units).filter(gameAlive)){
    const count=unit.stacks[applause]||0;
    if(when==='turnStart'){
      if(unit.applauseRelease?.round<b.round)delete unit.applauseRelease;
      if(unit.contemptThrough<b.round)delete unit.contemptThrough;
      if(count)gameGainShield(b,unit,3);
    }else if(count){
      const cost=(unit.applauseMoveStart??unit.move)<=0?count*2:2;
      gameMental(b,unit,-cost,true);
    }
  }
}
const gameConceptTraits=Object.fromEntries(Object.entries(conceptStacks).map(([name,trait])=>
  [name,{...trait,name,concept:true,effects:trait.effects.map(effect=>({...gameEffect(effect.when,effect.kind,effect.amount,effect.to),...effect}))}]));
const gameCatalogue=[...gameDefaults,gameCounterPreset,gameCopyPreset,...gameResourcePresets,...gameAwakeningPresets,...gameConceptPresets,...defenseStarts,...fieldStarts,...guestStarts,...ruleCards,artistCards[0],applauseCards[0]];
const darkForgive={...gamePreset('conceptForgive','사면 · 어둠 속의 광배','0','0~3','normal',1,[
  {...gameEffect('hit','shield',14),shieldCap:30,shieldSource:'forgiveHalo'},
  gameEffect('hit','mind',6),gameConceptStack('죄 사함의 광배','target'),
  gameEffect('hit','transferDebuff',1)
],12,false),concept:true,optional:true,targetSide:'ally',includeSelf:true};
const gameUnlockedCards=profile=>profile?.orbs?.includes('orbDarkHalo')?[darkForgive]:[];
const firstStop={
  id:'stop01',name:'불 꺼진 제6국 외곽 막다른 골목',foe:'어두운 곳에서 더욱 빛나는',hp:225,start:22,
  walls:[2,12,18,27,7,15,23,31,39],zones:[13,22,14,21,29,30],tags:['제6국 외곽','제8국 외곽'],
  deck:['stopEye','stopEye','stopHand','stopHand','stopSilence','stopSilence','stopTeleport','stopRattle'],
  orb:'orbDarkHalo'
};
const collectorStop={
  id:'collector01',name:'야간 전당포 거리 · 잿빛 세관 창고',foe:'외상 장부의 수금원',hp:340,start:22,
  walls:[11,13,27,29],zones:[],tags:['제6국 외곽'],
  deck:['collectReceipt','collectReceipt','collectAbacus','collectOverdue','collectAbacus','collectOverdue','collectCollateral','collectLump'],
  orb:'orbCollectorSeal'
};
const judgeStop={
  id:'judge01',name:'법원 지하 보관고 · 수평을 찾지 못한 천칭',foe:'눈 먼 심판자',hp:560,start:22,
  walls:[10,14,26,30],zones:[],tags:['제4국 아이젠베르크'],
  deck:['judgeRead','judgeAxe','judgeScales','judgeRead','judgeAxe','judgeNail','judgeScales','judgeVerdict'],
  orb:'orbJudgeWeight'
};
const railStop={
  id:'railguard01',name:'선로변 검문소 · 신호가 끊긴 폐선로',foe:'선로 보안반 지휘관',hp:220,start:20,
  walls:[9,13,27],zones:[],tags:['제6국 외곽'],deck:[],
  squad:[
    {id:'enemy',key:'leader',name:'선로 보안반 지휘관',hp:220,pos:20,deck:['railBlock','railReturn','railBlock','railSignal']},
    {id:'railShield',key:'shield',name:'선로 보안반 방패병',hp:200,pos:12,deck:['railWall','railBash','railBash']},
    {id:'railSniper',key:'sniper',name:'선로 보안반 저격수',hp:150,pos:30,deck:['railScope','railPierce','railPierce']}
  ]
};

const brightStop={
  id:'blight01',name:'제8국 외곽 · 빛이 남은 광장',foe:'밝은 곳에서 더더욱 빛나는',
  hp:666,start:22,walls:[10,14,26,30],zones:[],tags:['제8국 외곽'],
  deck:['blissBless','blissPalm','blissHug','blissWhisper','blissPalm','blissHug','blissBless','blissSun']
};
const brightLight='황홀한 빛';
const gameIsBright=b=>b.encounter?.id===brightStop.id;
const brightPassengers=b=>Object.values(b.units).filter(unit=>!unit.enemy&&gameAlive(unit));
const brightScripted=new Set(['blissBless','blissWhisper','blissSun','blissHymn']);
const brightCards=Object.fromEntries([
  ['blissBless','축복 · 거짓된 행복감','0','0~3','세뇌된 승객의 체력 20 회복 및 보호막 15'],
  ['blissPalm','눈부신 손바닥','2d8+7','1~3','대상 보호막 10 제거. 자신의 보호막 10 획득'],
  ['blissHug','유리 같은 포옹','3d6+6','1','보호막이 있는 대상에게 위력 +5. 적중 시 보호막 파괴'],
  ['blissWhisper','가려진 어둠의 속삭임','0','0','세뇌되지 않은 승객 전원에게 황홀한 빛 +1'],
  ['blissSun','거짓 태양의 강림','3d10+10','0','전장 전체 공격. 세뇌된 승객마다 체력 15 회복'],
  ['blissVerdict','거짓 광휘의 심판','4d10+14','1~3','정신 피해 18. 최대 체력의 25% 고정 피해'],
  ['blissCondemn','파멸자의 규탄','3d10+12','1~4','보호막 파괴. 정신 피해 15. 대상 변경 불가'],
  ['blissCrush','부서진 후광의 압살','4d8+12','1~2','타격마다 현재 체력의 15% 고정 피해'],
  ['blissHymn','절망의 찬가','3d12+10','0','전장 전체 공격. 정신 피해 20 및 다음 이동력 −2'],
  ['blissRush','황홀한 돌진','3d8+10','1~2','정신 피해 8. 자신의 보호막 10 획득'],
  ['blissBarrage','빛에 물든 맹공','3d6+8','1~2','같은 대상에 두 번 적중. 대상 변경 불가'],
  ['blissWall','찬란한 방벽','2d8+6','1~2','자신의 보호막 18 획득 및 체력 12 회복'],
  ['blissCall','구원자의 부름','2d10+8','2~4','대상을 1칸 끌어당김']
].map(([id,name,power,range,publicLabel])=>[id,{
  ...gamePreset(id,name,power,range,'normal',1,[{...gameEffect('hit','bright:'+id,1),publicLabel}]),
  ...(['blissBarrage','blissCrush'].includes(id)?{hitPowers:[power,power]}:{}),
  unredirectable:['blissBless','blissBarrage','blissCondemn'].includes(id)
}]));

const brightSecond=['blissVerdict','blissCondemn','blissCrush','blissVerdict','blissCondemn','blissHymn'];
function gameBrightReturnPardon(b,holder){
  if(holder.hand.includes(darkForgive.id))return;
  for(const zone of ['deck','grave','exile']){
    const index=holder[zone].indexOf(darkForgive.id);
    if(index!==-1){holder[zone].splice(index,1);break;}
  }
  gamePlaceCards(b,holder,'hand',[darkForgive.id]);
}
function gameBrightTransition(b){
  const e=b.encounter,holder=b.units[e.holder],enemy=b.units.enemy;
  const free=brightPassengers(b).filter(unit=>unit.id!=='conceptDawn'&&!unit.collapsed);
  if(e.stage===1&&free.length===1&&free[0]===holder){
    const {x,y}=gridPoint(holder.pos);
    const dx=Math.sign(gridPoint(enemy.pos).x-x)||1;
    const pos=[[x-dx,y],[x,y-1],[x,y+1],[x+dx,y]].map(([col,row])=>gridIndex(col,row))
      .find(tile=>gridValid(tile)&&!b.walls.includes(tile)&&!Object.values(b.units).some(unit=>gameAlive(unit)&&unit.pos===tile));
    if(pos===undefined)return;
    const dawn=gameUnit('conceptDawn','어두운 곳에서 더욱 빛나는',pos,[],true);
    Object.assign(dawn,{hp:1225,maxHp:1225,conceptEntity:true});
    b.units[dawn.id]=dawn;
    e.stage=2;
    e.stageRound=b.round;
    b.foeDeck={cards:[...brightSecond],index:0};
    holder.library.conceptForgive={...darkForgive,cost:0,freeAction:true,
      effects:[...darkForgive.effects,{...gameEffect('hit','bright:absolve',1),publicLabel:'세뇌 해제 · 정신력 25 회복'}]};
    gameBrightReturnPardon(b,holder);
    gameLog(b,dawn.name+' · 승객의 뒤에 강림');
  }
  if(e.stage===2&&b.round>e.stageRound&&gameAlive(b.units.conceptDawn)&&
      !brightPassengers(b).some(unit=>unit.brainwashed)){
    const dawn=b.units.conceptDawn;
    dawn.hp=0;
    e.stage=3;
    holder.library.conceptForgive={...darkForgive,cost:0,freeAction:true,name:'사면 · 거짓을 삼키는 밤',power:'666',
      range:'0~4',targetSide:'any',effects:[...darkForgive.effects,
        {...gameEffect('hit','bright:final',1),publicLabel:'거짓된 빛을 지정하면 모든 적에게 방어막 관통 고정 피해 666'}]};
    gameBrightReturnPardon(b,holder);
    gameLog(b,'최후의 광휘 · 어둠이 공격을 대신 맞고 사면이 변했습니다.');
  }
}
const attackerIsBrightFoe=(b,unit)=>unit===b.units.enemy||!!unit.brainwashed;
function gameBrightSafe(b,unit){
  return gameIsBright(b)&&(unit.id==='conceptDawn'||b.encounter.holder===unit.id&&
    (b.encounter.stage===1||gameAlive(b.units.conceptDawn)));
}
function gameBrightLight(b,unit){
  if(gameBrightSafe(b,unit)||unit.collapsed||!gameAlive(unit))return;
  unit.stacks[brightLight]=Math.min(5,(unit.stacks[brightLight]||0)+1);
  if(unit.stacks[brightLight]!==5)return;
  unit.brainwashed=true;
  unit.collapsed=true;
  unit.mind=0;
  unit.controlledIndex=0;
  delete b.plans?.[unit.id];
  gameLog(b,unit.name+' · 황홀한 빛 5 · 세뇌');
}
function gameBrightIntent(b,enemy,victim){
  const deck=b.foeDeck,controlled=brightPassengers(b).filter(unit=>unit.brainwashed);
  for(let i=0;i<deck.cards.length;i++){
    const card=brightCards[deck.cards[deck.index]];
    deck.index=(deck.index+1)%deck.cards.length;
    const target=card.id==='blissBless'?controlled.find(unit=>gameReach(b,card,enemy,unit)):victim;
    if(!target||card.id==='blissSun'&&controlled.length<2)continue;
    return {target:target.id,card,reachable:!brightScripted.has(card.id)};
  }
  return {target:victim.id,card:firstStopCards.stopWait,reachable:false};
}
function gameBrightShieldBreak(b,unit,actor){
  if(gameIsBright(b)&&actor===b.units.enemy&&unit.stacks[brightLight])
    gameMentalDamage(b,unit,unit.stacks[brightLight]*6,actor,{kind:'other'});
}
function gameBrightHit(b,ctx,unit,id){
  const actor=ctx.actor;
  const shield=(amount,cap)=>gameGainShield(b,actor,amount,{shieldCap:cap,shieldDuration:1},id);
  const strip=amount=>{
    if(gameRemoveShield(unit,amount)&&!unit.shield)gameBrightShieldBreak(b,unit,actor);
  };
  switch(id){
    case 'absolve':
      if(!unit.brainwashed)break;
      delete unit.brainwashed;
      unit.collapsed=false;
      unit.blockedRounds=1;
      gameClearCrisis(b,unit);
      gameMental(b,unit,25,true);
      if(unit!==actor)gameMental(b,actor,25,true);
      const dawn=b.units.conceptDawn;
      const light=unit.stacks[brightLight]||0;
      if(gameAlive(dawn)&&light){
        dawn.stacks[brightLight]=(dawn.stacks[brightLight]||0)+light;
        gameLog(b,dawn.name+' · '+unit.name+'의 황홀한 빛 '+light+' 대속');
      }
      gameWriteStacks(unit,brightLight,[]);
      for(const ally of brightPassengers(b))if(!ally.brainwashed&&ally.stacks[brightLight]>0)ally.stacks[brightLight]--;
      b.units.enemy.blockedRounds=Math.max(b.units.enemy.blockedRounds||0,1);
      b.units.enemy.nextBlockedRounds=Math.max(b.units.enemy.nextBlockedRounds||0,1);
      gameLog(b,unit.name+' · 사면으로 세뇌 해제');
      break;
    case 'final':
      if(unit!==b.units.enemy)break;
      for(const foe of Object.values(b.units).filter(target=>target.enemy&&gameAlive(target))){
        while(gameAlive(foe))gameDamage(b,foe,666,actor,true,false,true,{kind:'card'});
      }
      b.outcome={kind:'swallowed',orb:'orbColdLamp'};
      break;
    case 'blissVerdict':
      gameMentalDamage(b,unit,18,actor,{kind:'card'});
      gameDamage(b,unit,Math.floor(unit.maxHp/4),actor,false,false,true,{kind:'card'});
      break;
    case 'blissCondemn':strip(unit.shield);gameMentalDamage(b,unit,15,actor,{kind:'card'});break;
    case 'blissPalm':strip(10);shield(10,30);break;
    case 'blissHug':strip(unit.shield);break;
    case 'blissRush':gameMentalDamage(b,unit,8,actor,{kind:'card'});shield(10,30);break;
    case 'blissWall':shield(18,30);actor.hp=Math.min(actor.maxHp,actor.hp+12);break;
    case 'blissCall':gameMove(b,unit,actor.pos,1,true);break;
  }
}
function gameBrightResolve(b){
  const enemy=b.units.enemy,card=b.intent.card,party=brightPassengers(b);
  const controlled=party.filter(unit=>unit.brainwashed);
  if(gameAlive(enemy)&&gameActionLimit(enemy)>0&&brightScripted.has(card.id)){
    if(card.id==='blissBless'){
      const target=b.units[b.intent.target];
      if(gameAlive(target)&&gameReach(b,card,enemy,target)){
        target.hp=Math.min(target.maxHp,target.hp+20);
        gameGainShield(b,target,15,{shieldCap:30,shieldDuration:1},'brightBlessing');
        target.controlledPower=(target.controlledPower||0)+3;
        gameLog(b,card.name+' → '+target.name);
      }
    }else if(card.id==='blissWhisper'){
      gameLog(b,card.name);
      for(const unit of party)gameBrightLight(b,unit);
    }else if(card.id==='blissSun'||card.id==='blissHymn'){
      const roll=gameRollPower(card.power);
      const power=roll.faces.reduce((total,value)=>total+value,roll.bonus);
      gameLog(b,card.name);
      for(const unit of party){
        gameDamage(b,unit,power,enemy,false,true,false,{kind:'strike'});
        if(card.id==='blissHymn'&&gameAlive(unit)){
          gameMentalDamage(b,unit,20,enemy,{kind:'card'});
          unit.nextMove-=2;
        }
      }
      if(card.id==='blissSun')enemy.hp=Math.min(enemy.maxHp,enemy.hp+15*controlled.length);
    }
  }
  const deck=['blissRush','blissBarrage','blissWall','blissCall','blissRush','blissBarrage'];
  for(const actor of controlled){
    const target=party.filter(unit=>gameAlive(unit)&&!unit.collapsed)
      .sort((left,right)=>gameDistance(actor,left)-gameDistance(actor,right))[0];
    if(!target)break;
    const move=brightCards[deck[actor.controlledIndex++%deck.length]];
    if(!gameReach(b,move,actor,target))gameMove(b,actor,target.pos,b.encounter.stage===1?4:2,true);
    if(!gameReach(b,move,actor,target))continue;
    const buff=b.encounter.stage===1;
    for(let i=0;i<(buff?2:1)&&gameAlive(target)&&gameAlive(actor);i++){
      const ctx=gameEnemyAction(b,actor,target,move);
      ctx.mod=(buff?5:0)+(actor.controlledPower||0);
      gameUnopposedAttack(b,ctx);
    }
  }
}
const encounterPresets={stop01:firstStop,collector01:collectorStop,judge01:judgeStop,railguard01:railStop,blight01:brightStop};
const railCards=Object.fromEntries([
  ['railBlock','차단 명령','2d6+6','1~4','hit','다음 라운드 이동 수 −2. 방패병이 대상 쪽으로 전진'],
  ['railReturn','선로 복귀 강제','2d8+6','1~3','hit','대상 변경 불가. 2칸 밀기, 벽 충돌 시 고정 피해 6'],
  ['railSignal','일제 사격 신호','0','0','use','방패병과 저격수가 즉시 추가 행동'],
  ['railWall','철제 방패 전개','0','0','use','이번 라운드 보호막 18. 진형 방벽 범위 2칸'],
  ['railBash','방패 밀치기','2d6+8','1','hit','1칸 밀기. 벽에 막히면 고정 피해 5'],
  ['railScope','조준경 고정','0','2~5','use','다음 라운드 최우선 대상 지정. 조준선을 다시 그림'],
  ['railPierce','관통 실탄','3d8+6','2~5','hit','대상 변경 불가 및 방어막 관통. 조준선 위의 대상은 2타']
].map(([id,name,power,range,when,publicLabel])=>[id,{...gamePreset(id,name,power,range,'normal',1,
  [{...gameEffect(when,'rail:'+id,1,id==='railWall'?'self':'target'),publicLabel}]),
  unredirectable:['railReturn','railPierce'].includes(id),support:['railSignal','railWall','railScope'].includes(id)}]));
const gameIsRail=b=>b.encounter?.id===railStop.id;
function gameRailAim(b,target){
  const sniper=b.units.railSniper;
  return !!b.aimLine&&gameAlive(sniper)&&gridPoint(target.pos).y===b.aimLine.index&&
    gridLineOfSight(sniper.pos,target.pos,gameBattleWalls(b));
}
function gameRailIntent(b,foe,party){
  const deck=b.foeDecks[foe.id];
  let card=railCards[deck.cards[deck.index]];
  deck.index=(deck.index+1)%deck.cards.length;
  if(b.encounter.leaderDownRound<b.round&&foe.id!=='enemy'&&!['railSignal','railWall'].includes(card.id)){
    const [min,max=min]=card.range.split('~').map(Number);
    card={...card,range:Math.max(1,min-1)+'~'+Math.max(1,max-1)};
  }
  const focus=foe.scope?.round===b.round&&party.find(unit=>unit.id===foe.scope.target);
  const target=focus||[...party].sort((a,c)=>gameDistance(foe,a)-gameDistance(foe,c))[0];
  if(!target)return null;
  const stationary=['railSignal','railWall'].includes(card.id);
  return {attacker:foe.id,id:foe.id,target:target.id,card,
    reachable:!stationary&&gameReach(b,card,foe,target)&&!foe.blockedRounds};
}
function gameRailRound(b,party){
  const sniper=b.units.railSniper;
  const picked=[...party].sort((a,c)=>(c.movedLast||0)-(a.movedLast||0)||gridPoint(a.pos).y-gridPoint(c.pos).y)[0];
  b.aimLine=gameAlive(sniper)&&picked?{round:b.round,index:gridPoint(picked.pos).y,sourceId:sniper.id}:null;
  b.encounter.coverUsed=false;
  b.intentQueue=b.foeOrder.filter(id=>gameAlive(b.units[id])).map(id=>gameRailIntent(b,b.units[id],party)).filter(Boolean);
}
function gameRailSubdue(b,unit){
  if(unit.subdued)return;
  unit.subdued=true;
  b.encounter.subdueOrder.push(unit.railRole);
  if(unit.railRole==='leader')b.encounter.leaderDownRound=b.round;
  if(unit.railRole==='sniper')b.aimLine=null;
  gameLog(b,unit.name+' · 제압');
}
function gameRailOutcome(b,foes,party){
  if(!gameIsRail(b))return false;
  if(!party.length){b.outcome={kind:'wipe',tier:'none'};return false;}
  if(!foes.length){
    const first=b.encounter.subdueOrder[0];
    b.outcome={kind:first==='shield'?'clearLine':first==='leader'?'cutCommand':'railSubdued',
      tier:'none',reward:first==='shield'?'railSupply':first==='leader'?'railIntel':null};
    return false;
  }
  if(b.encounter.inspection>=2){
    b.outcome={kind:'inspect',tier:'none'};
    for(const unit of party)gameMental(b,unit,-5);
    return true;
  }
  return false;
}
function gameRailEffect(b,ctx,target){
  const actor=ctx.actor;
  switch(ctx.card.id){
    case 'railBlock': {
      target.nextMove=Math.max(-7,(target.nextMove||0)-2);
      const shield=b.units.railShield;
      if(gameAlive(shield))gameMove(b,shield,target.pos,1,true);
      break;
    }
    case 'railReturn':
    case 'railBash': {
      const distance=ctx.card.id==='railReturn'?2:1;
      for(let i=0;i<distance;i++){
        if(gamePosition(b,target,gridDisplacement(actor.pos,target.pos))){
          if(gameRailAim(b,target))target.railAimBonus=ctx.card.id==='railBash'?6:4;
          continue;
        }
        gameDamage(b,target,ctx.card.id==='railBash'?5:6,actor,false,false,true,{kind:'card'});
        break;
      }
      break;
    }
    case 'railWall':
      gameGainShield(b,actor,18,{shieldDuration:1,shieldCap:18,stackMode:'replace'},'railWall');
      actor.wideWallRound=b.round;
      break;
    case 'railScope':
      actor.scope={round:b.round+1,target:target.id};
      b.aimLine={round:b.round,index:gridPoint(target.pos).y,sourceId:actor.id};
      break;
  }
}
const judgeCards=Object.fromEntries([
  ['judgeRead','천칭의 서류 낭독','2d6+6','2~4','무작위 상태 이상 1종. 표식 대상에게 위력 +4 및 상태 이상 1종 추가'],
  ['judgeAxe','무딘 처형도 내리치기','3d10+8','1~2','위력 감소 무시. 홀수 주사위 합이면 인접 여파. 표식 대상은 2타'],
  ['judgeScales','연좌의 저울질','2d8+6','1~3','대상 주변 2×2 범위 공격. 상태 이상을 복사. 표식 대상은 피해 절반이 고정 피해'],
  ['judgeNail','쇠못 박힌 침묵','2d6+5','1~3','대상 변경 불가. 방어 무시와 상태 이상 2종. 표식 대상의 보호막 제거 및 이동 수 −2'],
  ['judgeVerdict','최후의 선고 · 눈 먼 천칭','5d10+12','1~2','상태 이상 종류당 +3 (최대 +12). 홀수 여파 및 표식 대상 추가 피해']
].map(([id,name,power,range,publicLabel])=>[id,{...gamePreset(id,name,power,range,'normal',1,
  [{...gameEffect('hit','judge:'+id,1),publicLabel}]),unredirectable:id==='judgeNail'}]));
const gameIsJudge=b=>b.encounter?.id===judgeStop.id;
function gameJudgeRank(b,party){
  const hits=b.encounter.hits||{};
  const foe=b.units.enemy;
  return party.filter(unit=>hits[unit.id]>0).sort((a,c)=>hits[c.id]-hits[a.id]||gameDistance(a,foe)-gameDistance(c,foe)||a.hand.length-c.hand.length);
}
function gameJudgeRound(b,party){
  for(const unit of party)delete unit.judgmentMark;
  const order=gameJudgeRank(b,party);
  b.encounter.rank=order.map(unit=>({id:unit.id,name:unit.name,damage:b.encounter.hits[unit.id]}));
  b.encounter.hits={};
  if(!order.length)return null;
  const mark=order[0];
  mark.judgmentMark=true;
  b.encounter.marks=(b.encounter.marks||0)+1;
  gameLog(b,mark.name+' · 죄인의 표식');
  return mark;
}
const judgeDebuffs={
  이동감소:{test:unit=>unit.nextMove<0,apply:unit=>{unit.nextMove=Math.min(-2,unit.nextMove||0);}},
  위력감소:{test:unit=>unit.nextPower<0,apply:unit=>{unit.nextPower=Math.min(-3,unit.nextPower||0);}},
  행동제한:{test:unit=>unit.blockedRounds||unit.nextBlockedRounds,apply:unit=>{unit.nextBlockedRounds=Math.max(unit.nextBlockedRounds||0,1);}},
  정신피해:{test:unit=>!!unit.mindStatuses?.mindBurn,apply:(unit,b)=>{(unit.mindStatuses??={}).mindBurn={amount:3,through:b.round+1};}}
};
function gameJudgeDebuffKinds(unit){
  return Object.entries(judgeDebuffs).filter(([,rule])=>rule.test(unit)).map(([name])=>name);
}
function gameJudgeDebuffs(b,target,count){
  const options=gameShuffle(Object.keys(judgeDebuffs));
  for(const name of options.slice(0,count)){
    judgeDebuffs[name].apply(target,b);
    gameLog(b,target.name+' · 심판자의 '+name);
  }
}
function gameJudgeEffect(b,ctx,target,kind){
  if(target===ctx.actor||ctx.judgeSplash)return;
  if(kind==='judge:judgeRead')gameJudgeDebuffs(b,target,target.judgmentMark?2:1);
  if(kind==='judge:judgeNail'){
    gameJudgeDebuffs(b,target,2);
    if(target.judgmentMark)target.nextMove=Math.min(0,target.nextMove||0)-2;
  }
  if(kind==='judge:judgeScales'){
    const {x,y}=gridPoint(target.pos);
    const left=Math.min(x,6),top=Math.min(y,3);
    const area=Object.values(b.units).filter(unit=>{
      const tile=gridPoint(unit.pos);
      return gameAlive(unit)&&tile.x>=left&&tile.x<=left+1&&tile.y>=top&&tile.y<=top+1;
    });
    const source=[...area].sort((a,c)=>gameJudgeDebuffKinds(c).length-gameJudgeDebuffKinds(a).length)[0];
    const state=source&&gameJudgeDebuffKinds(source)[0];
    for(const unit of area){
      if(unit!==target&&unit!==ctx.actor)gameDamage(b,unit,ctx.judgeLastRoll||0,ctx.actor,false,false,false,{kind:'card',judgeIndirect:true});
      if(state&&unit!==source)judgeDebuffs[state].apply(unit,b);
    }
  }
}
function gameJudgeOutcome(b,foe,party){
  if(!gameIsJudge(b))return false;
  if(!party.length){b.outcome={kind:'wipe',tier:'none'};return false;}
  if(!gameAlive(foe)){
    if(b.encounter.marks>=3&&!b.encounter.chained&&party.some(unit=>unit.judgmentMark))
      b.outcome={kind:'balance',tier:'puzzleSolved',orb:judgeStop.orb};
    else{
      const rolls=[gameRoll(6),gameRoll(6)],total=rolls[0]+rolls[1];
      b.outcome={kind:'blunt',tier:'bruteKill',extract:{rolls,total,need:10},orb:total>=10?judgeStop.orb:null};
    }
    return false;
  }
  if(b.encounter.level){b.outcome={kind:'level',tier:'none'};return true;}
  return false;
}
const collectorCards=Object.fromEntries([
  ['collectReceipt','선지급 영수증 발행','2d6+5','1~3','hit','대상에게 미수금 2 부여. 미수금 4 이상이면 인접한 아군과 나누어 부여'],
  ['collectAbacus','주판알 튕기기','1d8+4','2~4','hit','승객 전원에게 미수금 1 부여. 대상에게 정신 피해 3'],
  ['collectOverdue','연체 가산','2d8+6','1~3','hit','미수금 3 이상이면 다음 라운드에 대상의 기대 위력 최고 카드 사본 1장 봉인'],
  ['collectCollateral','담보물 확인','2d6+6','1~2','use','1라운드 보호막 12. 보호막이 남아 있는 동안 타격한 승객에게 미수금 1 부여'],
  ['collectLump','외상 장부 · 일괄 청구','3d8+6','1~3','hit','대상의 미수금을 전부 소모. 소모당 고정 피해 5 및 수금원 체력 10 회복']
].map(([id,name,power,range,when,publicLabel])=>[id,{...gamePreset(id,name,power,range,'normal',1,
  [{...gameEffect(when,'collector:'+id,1,when==='use'?'self':'target'),publicLabel}]),unredirectable:id==='collectLump'}]));
const gameIsCollector=b=>b.encounter?.id===collectorStop.id;
const gameIsFirstStop=b=>b.encounter?.id===firstStop.id;
function gameCollectorGrant(b,unit,amount){
  gameGrantStacks(b,unit,{tag:'미수금',stackCap:5},amount);
}
function gameCollectorUse(b,unit){
  if(unit.enemy||!gameIsCollector(b))return;
  const used=b.encounter.used??={};
  const count=used[unit.id]=(used[unit.id]||0)+1;
  if(count<=2)gameCollectorGrant(b,unit,1);
}
function gameExpectedPower(card,unit){
  if(!card||card.target==='self'||card.targetSide==='ally')return 0;
  const rolls=cardHitPowers(card).map(formula=>{
    const data=parsePower(formula);
    return data?Math.floor(data.count*(data.sides+1)/2)+data.bonus:0;
  });
  if(!rolls.some(value=>value>0))return 0;
  const stages={basePower:0,basePowerPercent:0,finalPower:0,finalPowerPercent:0,...unit.nextPowerStages};
  const modifier=mentalPower(unit.mind)+(unit.nextPower||0)+(unit.awakening?awakeningPower:0);
  return gamePowerShares(rolls,modifier,unit.nextPowerPercent||0,stages).reduce((sum,value)=>sum+value,0);
}
function gameCollectorSeal(b,unit){
  const best=unit.hand.map((id,index)=>({id,index,power:gameExpectedPower(unit.library[id],unit)}))
    .filter(card=>card.power>0).sort((a,c)=>c.power-a.power||a.index-c.index)[0];
  if(!best)return;
  unit.sealedHighest={...best,round:b.round+1};
  gameLog(b,unit.name+' · 압류 표식 · 다음 라운드 카드 한 장 봉인');
}
function gameCollectorEffect(b,actor,target,kind){
  const debt=target.stacks['미수금']||0;
  const party=Object.values(b.units).filter(unit=>!unit.enemy&&gameAlive(unit));
  switch(kind){
    case 'collector:collectReceipt': {
      const neighbor=debt>=4&&party.find(unit=>unit!==target&&gameDistance(unit,target)===1);
      gameCollectorGrant(b,target,neighbor?1:2);
      if(neighbor)gameCollectorGrant(b,neighbor,1);
      break;
    }
    case 'collector:collectAbacus':
      for(const unit of party)gameCollectorGrant(b,unit,1);
      gameMentalDamage(b,target,3,actor,{kind:'card'});
      break;
    case 'collector:collectOverdue':
      if(debt>=3)gameCollectorSeal(b,target);
      break;
    case 'collector:collectCollateral':
      gameGainShield(b,actor,12,{shieldDuration:1,shieldCap:12,stackMode:'replace'},'collectorCollateral');
      break;
    case 'collector:collectLump':
      gameTakeStacks(target,'미수금',debt);
      if(debt)gameDamage(b,target,5*debt,actor,false,false,true,{kind:'card'});
      gameHeal(b,actor,10);
      break;
  }
}
function gameCollectorEndRound(b,party){
  const encounter=b.encounter;
  for(const unit of party.filter(gameAlive)){
    const used=encounter.used?.[unit.id]||0;
    if(used<=1)gameTakeStacks(unit,'미수금',1);
    if(used>=3)gameCollectorGrant(b,unit,1);
    const debt=unit.stacks['미수금']||0;
    if(debt)gameDamage(b,unit,debt,b.units.enemy,false,false,true,{kind:'stack',ongoing:true});
  }
  const alive=party.filter(gameAlive);
  const clear=alive.length>0&&alive.every(unit=>!(unit.stacks['미수금']>0));
  encounter.clearRounds=clear?(encounter.clearRounds||0)+1:0;
  if(clear&&!encounter.breakRound&&gameAlive(b.units.enemy)){
    encounter.breakRound=b.round+1;
    gameLog(b,'수금원 · 협상 파훼 · 다음 라운드 공격 정지 및 받는 피해 +25%');
  }
  delete encounter.used;
  delete encounter.collateralHit;
}
function gameCollectorOutcome(b,foe,party){
  if(!gameIsCollector(b))return false;
  const encounter=b.encounter;
  if(!party.length){b.outcome={kind:'wipe',tier:'none'};return false;}
  if(!gameAlive(foe)){
    if(encounter.breakRound===b.round-1){
      b.outcome={kind:'paid',tier:'puzzleSolved',orb:collectorStop.orb};
    }else{
      const rolls=[gameRoll(6),gameRoll(6)],total=rolls[0]+rolls[1]+Number(!!encounter.breakRound);
      b.outcome={kind:'seized',tier:'bruteKill',extract:{rolls,total,need:10},orb:total>=10?collectorStop.orb:null};
    }
    return false;
  }
  if(encounter.clearRounds>=2){
    b.outcome={kind:'installment',tier:'none'};
    return true;
  }
  return false;
}
const firstStopCards=Object.fromEntries([
  ['stopEye','지긋이 바라보는 빛나는 눈','0','0~12'],
  ['stopHand','머리 위에 내려앉은 손','0','1'],
  ['stopSilence','붉은 얼룩이 번지는 침묵','2d+4','1~2'],
  ['stopTeleport','검은 천 너머의 순간이동','0','0~12'],
  ['stopRattle','구멍 뚫린 두개골의 진동','0','0~12'],
  ['stopWait','골목에서 대기','0','0']
].map(([id,name,power,range])=>[id,gamePreset(id,name,power,range,'normal',1,[],0,false)]));
function gameStopFarthest(b,foe){
  const party=Object.values(b.units).filter(unit=>!unit.enemy&&gameAlive(unit));
  const occupied=gameBlocked(b,foe);
  const distance=pos=>Math.min(...party.map(unit=>gridDistance(unit.pos,pos)));
  const options=Array.from({length:gridSize},(_,pos)=>pos).filter(pos=>pos!==foe.pos&&!occupied.has(pos));
  if(options.length)gamePosition(b,foe,options.sort((a,c)=>distance(c)-distance(a)||c-a)[0]);
}
function gameStopIntent(b,foe,party){
  const stop=b.encounter;
  const marked=party.find(unit=>unit.id===stop.marked);
  const deck=b.foeDeck;
  let card=firstStopCards.stopWait;
  for(let i=0;i<deck.cards.length;i++){
    const id=deck.cards[deck.index];
    deck.index=(deck.index+1)%deck.cards.length;
    if(id==='stopHand'&&(!marked||gameDistance(foe,marked)>1)||
      id==='stopSilence'&&(stop.lastDamage||0)<20||id==='stopRattle'&&b.round<4)continue;
    card=firstStopCards[id];break;
  }
  const target=card.id==='stopHand'?marked:card.id==='stopEye'?
    [...party].sort((a,c)=>a.mind-c.mind||gameDistance(foe,a)-gameDistance(foe,c))[0]:
    [...party].sort((a,c)=>gameDistance(foe,a)-gameDistance(foe,c))[0];
  return {card,target:target.id,reachable:false};
}
function gameStopCleanup(b,unit){
  for(const key of ['actionPenalty','nextActionPenalty','blockedRounds','nextBlockedRounds','rooted','rootNext','poison','poisonSources','damageOverTime','healCuts','expose'])delete unit[key];
  unit.move=unit.move||0;
  for(const [name,stack] of Object.entries(basicStacks))if(stack.damage)gameWriteStacks(unit,name,[]);
  for(const kind of ['mindBurn','mindRecoveryCut'])if(unit.mindStatuses)delete unit.mindStatuses[kind];
}
function gameStopAction(b,foe,party){
  if(!gameAlive(foe)||foe.blockedRounds)return;
  const {card,target}=b.intent;
  const unit=b.units[target],stop=b.encounter;
  const zone=pos=>b.zones.includes(pos);
  gameLog(b,foe.name+' · '+card.name);
  switch(card.id){
    case 'stopEye':
      if(gameAlive(unit)){stop.marked=unit.id;stop.markRound=b.round;gameLog(b,unit.name+' · 고백의 시선');}
      break;
    case 'stopHand':
      if(gameAlive(unit)&&stop.marked===unit.id&&stop.markRound>=b.round-1&&gameDistance(foe,unit)<=1&&!stop.attackers.includes(unit.id)){
        gameStopCleanup(b,unit);
        gameHeal(b,unit,15);gameMental(b,unit,10);
        gameGrantStacks(b,unit,{tag:'죄 사함의 광배'},1,gameConceptTraits['죄 사함의 광배']);
        if(stop.peaceOpen)stop.peace++;
      }
      break;
    case 'stopSilence':
      for(const victim of party.filter(allied=>gameAlive(allied)&&gameDistance(foe,allied)<=2)){
        const power=gameRoll(6)+gameRoll(6)+4;
        if(gameMentalDamage(b,victim,Math.max(1,power-Number(zone(victim.pos))),foe,{kind:'card'}))
          gameGrantStacks(b,victim,{tag:'죄책감',stackCap:3},1,undefined,undefined,foe.id);
      }
      break;
    case 'stopTeleport':
      gameStopFarthest(b,foe);
      gameGainShield(b,foe,12,{shieldDuration:1},card.id);
      break;
    case 'stopRattle':
      stop.peaceOpen=true;
      for(const victim of party.filter(gameAlive)){
        gameGainShield(b,victim,10,{shieldDuration:2},card.id);
        gameTakeStacks(victim,'죄책감',1);
      }
      break;
  }
  if(stop.peaceOpen&&card.id!=='stopRattle'&&card.id!=='stopHand'&&
    party.some(victim=>gameAlive(victim)&&gridDistance(victim.pos,firstStop.start)<=1&&!stop.attackers.includes(victim.id)))stop.peace++;
}
function gameStopOutcome(b,foe,party){
  if(!gameIsFirstStop(b))return false;
  if(b.encounter.peace>=2){
    b.outcome={kind:'peace',tier:'puzzleSolved',orb:firstStop.orb};
    for(const unit of party)if(!unit.collapsed)gameMental(b,unit,100,true);
    return true;
  }
  if(!gameAlive(foe)){
    const rolls=[gameRoll(6),gameRoll(6)];
    const total=rolls[0]+rolls[1]+b.encounter.peace;
    b.outcome={kind:'break',tier:'bruteKill',extract:{rolls,total,need:10},orb:total>=10?firstStop.orb:null};
    gameLog(b,'개념구 추출 · '+total+'/10');
  }else if(!party.length)b.outcome={kind:'wipe',tier:'none'};
  return false;
}
const gameFoe={...gamePreset('reap','징수의 손','2d+2','1~4','normal',1),locationTags:['전 구역']};
const gameRampage=gamePreset('rampage','피아 식별 상실','3d+4','1~7','normal',1,[],0,false);
const gameBots=['서린 · 회수원','가온 · 호송병','유담 · 기록원','해온 · 해결사'];
const gameActive=b=>b?.phase==='planning';
const gameAlive=u=>u&&u.hp>0;
const gameCanPlan=u=>gameAlive(u)&&!u.brainwashed&&!u.blockedRounds&&(u.collapsed||!u.zero||u.zero==='crisis');
const gameDistance=(a,b)=>gridDistance(a.pos,b.pos);
const gameBattleWalls=(b,unit)=>[...(b.walls||[]),...(b.extraWalls||[]).filter(wall=>!unit||wall.ownerSide!==unit.enemy).map(wall=>wall.index)];
const gameReach=(b,card,from,to)=>{
  const hostile=from.enemy!==to.enemy;
  const stealth=to.ruleStealth;
  if(hostile&&card.target===1&&!card.splash&&stealth?.through>=b.round&&(!stealth.from||stealth.from===from.id))return false;
  if(hostile&&from.ruleConfusion>=b.round&&gridDistance(from.pos,to.pos)>1)return false;
  if(card.boardReach)return from.id!==to.id||card.targetSide==='any';
  if(hostile&&to.guestMelee>=b.round&&gridDistance(from.pos,to.pos)<=1)return false;
  if(gameIsRail(b)&&card.id==='railPierce'&&gameRailAim(b,to))
    return gridCardHasReach({...card,range:'1~'+card.range.split('~').at(-1)},from.pos,to.pos,gameBattleWalls(b,from));
  return gridCardHasReach(card,from.pos,to.pos,gameBattleWalls(b,from));
};
function gameVisibility(value,card=false){
  if(value.gmOnly!==true&&value.visibility!=='gm')return {};
  const publicHint=gameText(value.publicHint,120);
  const publicName=card?gameText(value.publicName,40):'';
  return {gmOnly:true,...(publicHint?{publicHint}:{}),...(publicName?{publicName}:{})};
}
function gameLog(b,message){
  const hidden=b.hiddenEffectLog;
  if(hidden){
    b.log.push({text:message,gmOnly:true,publicHint:hidden.reported?null:hidden.hint,round:b.round});
    hidden.reported=true;
  }else b.log.push(message);
  b.log=b.log.slice(-65);
}
function gameVisibleLog(log,manager){
  return log.flatMap(entry=>typeof entry==='string'?[entry]:
    manager?[entry.gmOnly?'[GM 전용] '+entry.text:entry.text]:entry.gmOnly?(entry.publicHint?[entry.publicHint]:[]):[entry.text]);
}
function gamePublicView(value){
  if(Array.isArray(value))return value.map(gamePublicView);
  if(!value||typeof value!=='object')return value;
  if(value.gmOnly){
    const fields=['id','name','power','range','rangeShape','target','role','cost','requiredState','clash','unstoppable','unredirectable','splash','cap'];
    const result=Object.fromEntries(fields.filter(key=>Object.hasOwn(value,key)).map(key=>[key,value[key]]));
    if(value.publicName)result.name=value.publicName;
    if(value.publicHint)result.publicHints=[value.publicHint];
    if(Array.isArray(value.effects))result.effects=[];
    return result;
  }
  const result=Object.fromEntries(Object.entries(value).filter(([key])=>key!=='effects').map(([key,item])=>[key,gamePublicView(item)]));
  if(Array.isArray(value.effects)){
    result.effects=value.effects.filter(effect=>!effect?.gmOnly).map(gamePublicView);
    const hints=value.effects.flatMap(effect=>effect?.gmOnly&&effect.publicHint?[effect.publicHint]:[]);
    if(hints.length)result.publicHints=hints;
  }
  return result;
}

const handTarget=4, handLimit=12;
function gameSpliceHand(unit,start,count){
  const seal=unit.sealedHighest;
  if(seal){
    if(seal.index>=start&&seal.index<start+count)delete unit.sealedHighest;
    else if(seal.index>=start+count)seal.index-=count;
  }
  return unit.hand.splice(start,count);
}
function gameHandCardIndex(unit,id,round){
  return unit.hand.findIndex((card,index)=>card===id&&
    !(unit.sealedHighest?.round===round&&unit.sealedHighest.index===index&&unit.sealedHighest.id===id));
}
function gameDiscardSelection(hand,input,ai){
  if(ai||input==null)return [];
  const ids=typeof input==='string'?[input]:input;
  if(!Array.isArray(ids)||ids.length>handLimit||ids.some(id=>typeof id!=='string'))gameFail('버릴 손패를 확인하세요.');
  const available=[...hand];
  for(const id of ids){
    const index=available.indexOf(id);
    if(index<0)gameFail('사용할 카드와 버릴 카드가 겹치거나 손패에 없어요.');
    available.splice(index,1);
  }
  return ids;
}
function gameHandCleanup(b,unit,discard){
  const ids=typeof discard==='string'?[discard]:discard||[];
  const removed=[];
  for(const id of ids){
    const index=unit.hand.indexOf(id);
    if(index>=0)removed.push(...gameSpliceHand(unit,index,1));
  }
  if(removed.length)gamePlaceCards(b,unit,'grave',removed);
  const excess=unit.hand.length-handLimit;
  if(excess>0){
    if(!unit.bot&&!unit.enemy)gameFail('라운드를 진행하려면 '+excess+'장을 더 버려야 합니다.');
    const lowest=[...unit.hand].sort((a,c)=>(parsePower(unit.library[a]?.power)?.bonus||0)-(parsePower(unit.library[c]?.power)?.bonus||0));
    for(const id of lowest.slice(0,excess))gameSpliceHand(unit,unit.hand.indexOf(id),1);
    gamePlaceCards(b,unit,'grave',lowest.slice(0,excess));
  }
}
const gameZoneEvents={hand:'toHand',deck:'toDeck',grave:'toGrave',exile:'toExile'};
function gameCardZoneEvents(b,unit,ids,when){
  if(!b||!ids.length)return;
  const entries=ids.map(id=>({unit,card:unit.library[id],when}));
  if(b.zoneEvents){b.zoneEvents.push(...entries);return;}
  const queue=b.zoneEvents=entries;
  try{
    for(let index=0;index<queue.length&&index<128;index++){
      const {unit,card,when}=queue[index];
      if(!card)continue;
      const timings=[when,...(['cardDrawn','toHand'].includes(when)?['handEntered']:[]),'zoneEntered'];
      for(const actor of [unit,...Object.values(b.units).filter(actor=>actor!==unit)]){
        if(!gameAlive(actor))continue;
        const ids=new Set([...(actor===unit?[card.id]:[]),...(actor.startingCards||[]),
          ...actor.hand,...actor.deck,...actor.grave,...actor.exile]);
        const sources=[...ids].map(id=>actor===unit&&id===card.id?card:actor.library[id])
          .filter(source=>source?.effects.some(effect=>timings.includes(effect.when)));
        const zoneEvent={unit,card};
        for(const timing of timings){
          if(!gameAlive(actor))break;
          for(const source of sources){
            if(!gameAlive(actor))break;
            const ctx=Object.assign(gameContext(actor,source,[unit]),{zoneEvent,actionCard:card});
            gameTriggers(b,ctx,timing,unit);
          }
          const ctx=Object.assign(gameContext(actor,card,[unit]),{zoneEvent});
          gamePassives(b,actor,timing,unit,ctx);
        }
      }
    }
    if(queue.length>128)gameLog(b,'카드 이동 효과의 연쇄를 128회에서 멈췄습니다.');
  }finally{delete b.zoneEvents;}
}
function gamePlaceCards(b,unit,zone,ids,bottom=false,when=gameZoneEvents[zone]){
  if(bottom)unit[zone].unshift(...ids);
  else unit[zone].push(...ids);
  gameCardZoneEvents(b,unit,ids,when);
}
function gameDraw(unit,count,b) {
  while (count-->0 && unit.hand.length<12) {
    if (!unit.deck.length) {
      const ids=gameShuffle(unit.grave);
      unit.grave=[];
      gamePlaceCards(b,unit,'deck',ids);
    }
    if (!unit.deck.length) return;
    if(unit.hand.length>=12)return;
    gamePlaceCards(b,unit,'hand',[unit.deck.pop()],false,'cardDrawn');
  }
}
function gameUnit(id,name,pos,cards,bot=false,enemy=false,owned=cards,stats) {
  const library=Object.fromEntries(owned.map(({image,...card})=>[card.id,card]));
  const unit={id,name,pos,startingCards:[...new Set(cards.map(card=>card.id))],hp:enemy?54:baseHp,maxHp:enemy?54:baseHp,mind:50,shield:0,reduce:0,move:2,nextMove:0,stacks:{},hand:[],deck:gameShuffle(cards.map(c=>c.id)),grave:[],exile:[],library,bot,enemy,zero:null,collapsed:false};
  unit.configuredDeck=cards.map(card=>card.id).sort();
  if(stats){
    const combat=characterCombatStats(stats);
    Object.assign(unit,{combat,hp:combat.maxHp,maxHp:combat.maxHp,move:combat.movement,baseActions:combat.actions});
  }
  if(!enemy)gameDraw(unit,unit.combat?.handSize??handTarget);
  return unit;
}
function gameRenewThrough(round,previous,duration,effect,fallback='refresh'){
  const active=previous===null||previous>=round;
  const policy=effect.durationPolicy&&effect.durationPolicy!=='default'?effect.durationPolicy:fallback;
  if(active&&policy==='ignore')return undefined;
  const remaining=active?(previous===null?Infinity:previous-round+1):0;
  const incoming=duration===0?Infinity:duration;
  const total=policy==='extend'?remaining+incoming:policy==='longest'?Math.max(remaining,incoming):incoming;
  const capped=Math.min(total,effect.durationCap||Infinity);
  return Number.isFinite(capped)?round+capped-1:null;
}
const gameMindStatus=(b,u,kind)=>u.mindStatuses?.[kind]?.through>=b.round?u.mindStatuses[kind].amount:0;
const gameMentalPurges={
  clearMindBuffs:['collapseImmune','mindGuard','mindRegen'],
  clearMindDebuffs:['mindRecoveryCut','mindBurn'],
  purgeRegen:['mindRegen']
};
const gameBuffPurges={
  clearActionPenalty:['actionPenalty','nextActionPenalty'],
  clearActionBonus:['bonusActions','nextActions'],
  purgeDefense:['dodge','cover','nextShield','temporaryShield','lethalGuard','afterimage','barrierBurst','stackWard','deferrals'],
  purgeOffense:['critChance','critMultiplier','critCharges','critStacks','nextPower','nextPowerPercent','nextPowerStages',
    'clashMemory','outgoingDamage','outgoingDamagePercent','bossOutgoingDamage','bossOutgoingDamagePercent','lowRerolls','trueStrike','lifeSteal']
};
function gameClearCrisis(b,u){
  if(u.zero&&!b.resolving)delete b.plans?.[u.id];
  u.zero=null;
  for(const key of ['zeroRound','collapseRound','crisisVow','crisisProofs','crisisRecoveryBonus','crisisRulesVersion'])delete u[key];
}
function gamePreventCollapse(b,u){
  const immune=gameMindStatus(b,u,'collapseImmune');
  if(!immune&&!u.collapseResist)return false;
  if(!immune)u.collapseResist--;
  u.mind=Math.max(1,u.mind);
  gameClearCrisis(b,u);
  gameLog(b,u.name+' · '+(immune?'붕괴 불가':'붕괴 저항')+'로 위기 방지');
  return true;
}
function gameMental(b,u,delta,unmodified=false) {
  if(u.enemy||u.collapsed||!delta)return 0;
  const old=u.mind;
  if(!unmodified){
    const resist=bounded(gameMindStatus(b,u,delta<0?'mindGuard':'mindRecoveryCut')+(delta<0?u.combat?.mindGuard||0:0),0,100);
    delta=Math.sign(delta)*Math.floor(Math.abs(delta)*(100-resist)/100);
    if(!delta)return 0;
  }
  u.mind=bounded(old+delta,gameBrightSafe(b,u)?1:0,100);
  if(u.mind===0){
    if(!gamePreventCollapse(b,u)){
      if(u.temptation&&!u.awakening)gameStartCollapse(b,u);
      else if(!u.zero){u.zero='pending';gameLog(b,u.name+'의 정신력이 0이 되어 폭주 위기에 놓였습니다.');}
    }
  }else{
    if(u.zero==='crisis'){
      if(!b.resolving)delete b.plans[u.id];
      gameLog(b,u.name+' · 정신력을 되찾아 붕괴를 피함');
    }
    u.zero=null;delete u.zeroRound;delete u.collapseRound;delete u.crisisVow;delete u.crisisProofs;delete u.crisisRecoveryBonus;
  }
  gameInk(b,'black',Math.abs(u.mind-old));
  return u.mind-old;
}
function gameStartCollapse(b,u){
  if(u.zero==='crisis'||u.collapsed||u.awakening||gamePreventCollapse(b,u))return;
  if(!b.resolving)delete b.plans[u.id];
  u.zero='crisis';
  u.collapseRound=b.round+crisisRounds-(b.resolving?0:1);
  u.crisisProofs=0;
  u.crisisRulesVersion=1;
  gameLog(b,u.name+' · 붕괴 직전. '+u.collapseRound+'라운드 종료 전 탈피하거나 정신력을 회복해야 합니다.');
}
function gameConceptualize(b,u){
  if(gamePreventCollapse(b,u))return;
  gamePose(b,u,'idle');
  u.collapsed=true;
  u.awakening=false;
  u.zero=null;
  u.cover=[];
  delete u.collapseRound;
  delete u.crisisProofs;
  delete u.crisisVow;
  delete u.crisisRecoveryBonus;
  gamePose(b,u,'shift');
  gamePose(b,u,'idle');
  gameLog(b,u.name+' · 붕괴해 개념화. 붕괴 카드의 표적을 자동 지정합니다.');
}
function gameAwaken(b,u,recovery){
  gamePose(b,u,'idle');
  u.awakening=true;
  u.temptation=0;
  u.zero=null;
  delete u.collapseRound;
  delete u.zeroRound;
  gameMental(b,u,recovery+(u.crisisRecoveryBonus||0));
  gamePose(b,u,'shift');
  gamePose(b,u,'idle');
  delete u.crisisVow;delete u.crisisProofs;delete u.crisisRecoveryBonus;
  gameLog(b,u.name+' · 탈피해 각성 (전투 중 판정 위력 +'+awakeningPower+')');
}
function gameShieldSlots(unit){
  if(unit.shieldSlots?.reduce((total,slot)=>total+slot.amount,0)===unit.shield)return unit.shieldSlots;
  const temporary=Math.min(unit.shield,unit.temporaryShield||0);
  return unit.shieldSlots=[
    ...(temporary?[{key:'legacy:temporary',amount:temporary,through:null,temporary:true}]:[]),
    ...(unit.shield>temporary?[{key:'legacy',amount:unit.shield-temporary,through:null,temporary:false}]:[])
  ];
}
function gameSyncShield(unit){
  unit.shieldSlots=unit.shieldSlots.filter(slot=>slot.amount>0);
  unit.shield=unit.shieldSlots.reduce((sum,slot)=>sum+slot.amount,0);
  unit.temporaryShield=unit.shieldSlots.reduce((sum,slot)=>sum+(slot.temporary?slot.amount:0),0);
}
const gameShieldExpiry=slot=>slot.temporary?-1:slot.through??Infinity;
function gameGainShield(b,unit,amount,effect={},key='legacy',temporary=false){
  if(!gameAlive(unit)||amount<=0)return 0;
  if(unit.applauseShieldCut>=b.round)amount=Math.floor(amount/2);
  if(unit.inkBuff?.includes('yellow'))amount=Math.floor(amount*1.3);
  const slots=gameShieldSlots(unit);
  const source=effect.shieldSource||key;
  let slot=slots.find(entry=>entry.key===source&&entry.temporary===temporary);
  const previous=slot?.amount??0;
  const mode=effect.stackMode||'add';
  const desired=mode==='max'?Math.max(previous,amount):mode==='replace'?amount:previous+amount;
  const next=Math.min(effect.shieldCap??999,desired,999-unit.shield+previous);
  const through=gameRenewThrough(b.round,slot?.through,effect.shieldDuration??0,effect,effect.refreshDuration===false?'ignore':'refresh');
  if(!slot){
    slot={key:source,amount:0,through:null,temporary};
    slots.push(slot);
  }
  slot.amount=next;
  slot.cap=effect.shieldCap??null;
  if(through!==undefined)slot.through=through;
  if(slots.length>16){
    slots.sort((left,right)=>gameShieldExpiry(left)===gameShieldExpiry(right)?0:gameShieldExpiry(left)-gameShieldExpiry(right));
    const merged=slots.pop();
    slots.at(-1).amount+=merged.amount;
    slots.at(-1).cap=null;
  }
  gameSyncShield(unit);
  return Math.max(0,next-previous);
}
function gameExpireShields(unit,expired){
  unit.shieldSlots=gameShieldSlots(unit).filter(slot=>!expired(slot));
  gameSyncShield(unit);
}
function gameRemoveShield(u,n){
  if(n<=0||!u.shield)return 0;
  const slots=[...gameShieldSlots(u)].sort((left,right)=>
    gameShieldExpiry(left)===gameShieldExpiry(right)?0:gameShieldExpiry(left)-gameShieldExpiry(right));
  const removed=Math.min(u.shield,n);
  let remaining=removed;
  for(const slot of slots){
    const cut=Math.min(remaining,slot.amount);
    slot.amount-=cut;
    remaining-=cut;
    if(!remaining)break;
  }
  gameSyncShield(u);
  return removed;
}
const gameBoss=unit=>!!(unit?.boss??(unit?.enemy&&unit.id==='enemy'));
function gameDamage(b,u,amount,actor,piercing=false,attack=false,fixedDamage=false,origin={kind:'other'}) {
  if(!gameAlive(u))return 0;
  const bonus=attack&&amount>0?u.expose||0:0;
  if(bonus){
    u.expose=0;
    gameLog(b,u.name+' · 취약으로 피해 +'+bonus);
  }
  const hostile=actor.enemy!==u.enemy||actor.collapsed&&actor!==u;
  const vaultReflect=attack&&amount>0&&hostile&&u.stacks['철벽 빗장']>0&&gameDistance(u,actor)<=1;
  const goldMitigation=attack&&amount>0&&hostile&&!fixedDamage&&u.stacks['비축 금화']>0;
  if(goldMitigation)gameTakeStacks(u,'비축 금화',1);
  const bossOutgoing=gameBoss(u),bossIncoming=gameBoss(actor);
  const modified=hostile&&!fixedDamage&&!origin.ignoreReduction;
  const outgoing=modified?gameHeldModifiers(b,actor,u):{};
  const incoming=modified?gameHeldModifiers(b,u,actor):{};
  const outgoingValue=value=>origin.ignoreOutgoingCuts?Math.max(0,value||0):value;
  const bonuses=modified&&amount>0?[outgoingValue(actor.outgoingDamage),u.incomingDamage,outgoingValue(outgoing.outgoingDamage),incoming.incomingDamage,
    bossOutgoing?outgoingValue(actor.bossOutgoingDamage):0,bossIncoming?u.bossIncomingDamage:0]:[];
  const ratios=modified?[u.contemptThrough>=b.round?15:0,outgoingValue(actor.outgoingDamagePercent),u.incomingDamagePercent,outgoingValue(outgoing.outgoingDamagePercent),incoming.incomingDamagePercent,
    bossOutgoing?outgoingValue(actor.bossOutgoingDamagePercent):0,bossIncoming?u.bossIncomingDamagePercent:0,actor.conceptEntity?-(incoming.conceptIncomingCut||0):0,
    u.enemy&&gameIsCollector(b)&&b.encounter.breakRound===b.round?25:0]:[];
  const sum=values=>values.reduce((total,value)=>total+(value||0),0);
  const base=Math.floor(amount)+bonus;
  let adjusted=fixedDamage?Math.max(0,Math.floor(amount)):
    applyPowerRatio(Math.max(0,base+sum(bonuses)-u.reduce),sum(ratios));
  if(gameIsJudge(b)&&actor.enemy&&u.judgmentMark&&!origin.judgeIndirect){
    if(!fixedDamage&&u.guardRound===b.round)adjusted=Math.ceil(adjusted/2);
    adjusted=Math.floor(adjusted*1.35);
  }
  if(!fixedDamage)u.reduce=0;
  if(gameIsRail(b)&&u.enemy&&!actor.enemy&&!fixedDamage){
    const shield=b.units.railShield;
    if(gameAlive(shield)&&gameDistance(shield,u)<=(shield.wideWallRound===b.round?2:1))adjusted=Math.ceil(adjusted*0.7);
  }
  const collateral=gameIsCollector(b)&&u.enemy&&!actor.enemy&&adjusted>0&&
    u.shieldSlots?.some(slot=>slot.key==='collectorCollateral');
  if(attack&&gameIsBright(b)&&attackerIsBrightFoe(b,actor)&&u.id===b.encounter.holder&&gameAlive(b.units.conceptDawn)&&adjusted>0){
    const dawn=b.units.conceptDawn;
    if(b.encounter.coverRound!==b.round){
      b.encounter.coverRound=b.round;
      const defense=Array.from({length:5},()=>gameRoll(10)).reduce((sum,face)=>sum+face,20);
      gameLog(b,dawn.name+' · 절대 원호 방어 '+defense);
      adjusted=defense>=adjusted?0:Math.floor(adjusted/2);
    }else return gameDamage(b,dawn,amount,actor,piercing,attack,fixedDamage,origin);
  }
  if(modified&&u.inkBuff?.includes('cyan'))adjusted=Math.floor(adjusted*0.75);
  if(goldMitigation)adjusted=Math.floor(adjusted*0.6);
  if(modified&&!origin.ignoreOutgoingCuts&&actor.defenseWeakenRound===b.round)adjusted=Math.floor(adjusted/2);
  const absorbed=piercing?0:gameRemoveShield(u,adjusted*(origin.doubleShield?2:1));
  if(collateral){
    const seen=b.encounter.collateralHit??={};
    if(!seen[actor.id])gameCollectorGrant(b,actor,1);
    seen[actor.id]=true;
  }
  const shieldBroken=absorbed>0&&u.shield===0;
  if(origin.kind==='strike')origin.shieldBroken=shieldBroken;
  if(shieldBroken)gameBrightShieldBreak(b,u,actor);
  let healthDamage=adjusted-Math.min(adjusted,absorbed);
  if(attack&&modified&&healthDamage>0&&u.afterimage){
    const blocked=Math.min(healthDamage,u.afterimage);
    healthDamage-=blocked;
    delete u.afterimage;
    gameLog(b,u.name+' · 잔상으로 피해 '+blocked+' 방어');
  }
  if(attack&&modified&&healthDamage>0&&u.deferrals?.length){
    const originalDamage=healthDamage;
    for(const {amount,mode,rounds} of u.deferrals){
      const delayed=Math.min(healthDamage,mode==='fixed'?amount:Math.floor(originalDamage*amount/100));
      if(!delayed)continue;
      const share=Math.floor(delayed/rounds), remainder=delayed%rounds;
      for(let i=0;i<Math.min(rounds,delayed);i++){
        (u.damageDebt??=[]).push({round:b.round+i+1,amount:share+Number(i<remainder),dealer:actor.id,kind:origin.kind});
      }
      healthDamage-=delayed;
    }
    delete u.deferrals;
    if(healthDamage<originalDamage){
      u.damageDebt.sort((a,c)=>a.round-c.round);
      gameLog(b,u.name+' · 피해 '+(originalDamage-healthDamage)+' 유예');
    }
  }
  let actual=Math.min(u.hp,healthDamage);
  if(attack&&modified&&actual===u.hp&&u.lethalGuard){
    actual=u.hp-Math.min(u.hp,u.lethalGuard);
    u.lethalGuard=0;
    gameLog(b,u.name+' · 치명상 방지');
  }
  if(gameBrightSafe(b,u)&&u.id!=='conceptDawn'||gameIsBright(b)&&u.enemy&&b.encounter.stage<3&&b.encounter.holder&&gameAlive(b.units[b.encounter.holder]))
    actual=Math.min(actual,u.hp-1);
  u.hp-=actual;
  if(actual||absorbed)u.applauseHurt=(u.applauseHurt||0)+1;
  gameInk(b,'cyan',Math.floor(actual/2));
  if(vaultReflect||goldMitigation)gameDamage(b,actor,3,u,false,false,true,{kind:'stack'});
  if(actual&&gameIsJudge(b)&&u.enemy&&!actor.enemy&&!origin.judgeIndirect){
    const hits=b.encounter.hits??={};
    hits[actor.id]=(hits[actor.id]||0)+actual;
  }
  if(gameIsFirstStop(b)&&u.enemy&&actual){
    b.encounter.damage+=actual;
    if(gameAlive(u)&&!b.encounter.phaseFired&&u.hp/u.maxHp<=0.7){
      b.encounter.phaseFired=true;
      gameStopFarthest(b,u);
      gameLog(b,u.name+' · 어둠 끝으로 옮겨 섰다');
    }
  }
  if(actual)gamePose(b,u,u.hp?'hurt':'down');
  if(attack&&actor.enemy&&!u.enemy&&actual>0&&u.hp>0)b.exposedToAttack?.add(u.id);
  if(actual)gameLog(b,u.name+' 피해 '+actual+(absorbed?' · 보호막 '+absorbed:''));
  if(gameIsRail(b)&&u.enemy&&!gameAlive(u))gameRailSubdue(b,u);
  if(actor.enemy!==u.enemy&&(actual||absorbed)){
    if(actor.enemy)gameObserve(b,actor,5);
    else if(attack)gameObserve(b,u,5);
  }
  if(!u.enemy&&actual>=u.maxHp/4)gameMental(b,u,-10);
  if (!u.enemy&&(actual>=u.maxHp/4||u.hp===0)) {
    for(const ally of Object.values(b.units))if(ally!==u&&!ally.enemy&&gameAlive(ally)){
      const penalty=u.hp===0?10:5;
      const last=b.shock?.[ally.id]||0;
      if(penalty>last){gameMental(b,ally,last-penalty);if(b.shock)b.shock[ally.id]=penalty;}
    }
  }
  if(u.hp===0)gameLog(b,u.name+' 전투 불능');
  const raw=fixedDamage?adjusted:applyPowerRatio(Math.max(0,base+sum(bonuses.filter(value=>value>0))),
    sum(ratios.filter(value=>value>0)));
  if(raw||actual||absorbed)gameTriggerLifeSteal(b,u,{actual,raw,absorbed,blocked:adjusted>0&&absorbed===adjusted},actor,origin);
  if(attack&&hostile&&shieldBroken&&u.barrierBurst){
    const burst=u.barrierBurst;
    u.barrierBurst=0;
    gameLog(b,u.name+' · 보호막 파열 반격');
    gameDamage(b,actor,burst,u,false,false,false,{kind:'counter'});
  }
  if(attack&&actual&&u.thorns&&hostile){
    const counter=u.thorns;
    u.thorns=0;
    gameLog(b,u.name+' · 반격 → '+actor.name);
    gameDamage(b,actor,counter,u,false,false,false,{kind:'counter'});
  }
  return actual;
}
function gameMentalDamage(b,victim,amount,actor,origin){
  if(victim.enemy||victim.collapsed||!gameAlive(victim)||amount<=0)return 0;
  const actual=Math.max(0,-gameMental(b,victim,-amount));
  gameTriggerLifeSteal(b,victim,{actual,raw:amount,resource:'mind'},actor,origin);
  return actual;
}
function gameBuiltInConversions(dealer,shieldOnly=false){
  return Object.entries(dealer.stackTraits||{}).flatMap(([name,trait])=>{
    const count=dealer.stacks[name]||0;
    if(!count||!trait.sub)return [];
    return trait.effects.filter(effect=>effect.when==='held'&&effect.kind===(shieldOnly?'shieldConversion':'lifeSteal')).map(effect=>{
      const shieldConversion=effect.kind==='shieldConversion';
      return {dealer:dealer.id,owner:dealer.id,heal:shieldConversion?'victim':'dealer',victim:shieldConversion?'owner':effect.leechVictim,
        damage:effect.leechDamage,recovery:effect.leechRecovery,shieldConversion,amount:effect.amount*count,mode:'percent'};
    });
  });
}
function gameTriggerLifeSteal(b,victim,{actual,raw,absorbed=0,blocked=false,resource='hp'},actor,{kind,ongoing,sources}){
  const shieldRules=absorbed?gameBuiltInConversions(victim,true):[];
  const hasConversion=unit=>unit.lifeSteal||Object.entries(unit.stackTraits||{}).some(([name,trait])=>
    unit.stacks[name]>0&&trait.sub&&trait.effects.some(effect=>effect.kind==='lifeSteal'));
  if(!shieldRules.length&&(sources?!sources.some(source=>hasConversion(b.units[source.dealer]||actor)):!hasConversion(actor)))return;
  const shares=new Map();
  for(const entry of sources||[{dealer:actor.id,amount:1}]){
    const dealer=b.units[entry.dealer]||actor;
    const type=entry.kind||kind;
    const key=dealer.id+':'+type;
    const previous=shares.get(key);
    if(previous)previous.amount+=entry.amount;
    else shares.set(key,{dealer,type,amount:entry.amount});
  }
  const total=[...shares.values()].reduce((sum,entry)=>sum+entry.amount,0);
  if(!total)return;
  const credits=new Map(),builtIns=new Map([...shares.values()].map(({dealer})=>[dealer,gameBuiltInConversions(dealer)]));
  let weight=0;
  for(const {dealer,type,amount} of shares.values()){
    const previous=weight;
    weight+=amount;
    for(const rule of [...Object.values(dealer.lifeSteal||{}),...(builtIns.get(dealer)||[]),...shieldRules]){
      const input=rule.shieldConversion?'hp':rule.resource||'hp';
      if(rule.through!=null&&rule.through<b.round||input!=='any'&&input!==resource||rule.damage!=='any'&&rule.damage!==type&&
        !(rule.damage==='card'&&type==='strike')&&!(rule.damage==='ongoing'&&ongoing))continue;
      const hostile=dealer.enemy!==victim.enemy||dealer.collapsed&&dealer!==victim;
      const owner=b.units[rule.owner];
      if(rule.victim==='enemy'&&!hostile||rule.victim==='ally'&&(hostile||dealer===victim)||
        rule.victim==='self'&&dealer!==victim||rule.victim==='owner'&&victim!==owner||
        rule.victim==='ownerParty'&&victim.enemy!==owner?.enemy||rule.victim==='ownerEnemy'&&victim.enemy===owner?.enemy||
        rule.victim==='named'&&victim.name!==rule.victimName||rule.victim==='selected'&&!rule.victimIds?.includes(victim.id))continue;
      const include=rule.shield==='include';
      const basis=rule.shieldConversion?absorbed:
        rule.basis==='raw'?Math.max(0,raw-(include?0:absorbed)):actual+(include?absorbed:0);
      if(!basis||!rule.shieldConversion&&blocked&&!include)continue;
      const share=Math.floor(basis*weight/total)-Math.floor(basis*previous/total);
      if(share)credits.set(rule,(credits.get(rule)||0)+share);
    }
  }
  for(const [rule,damage] of credits){
    const dealer=b.units[rule.dealer],owner=b.units[rule.owner];
    const receivers=rule.heal==='dealer'?[dealer]:rule.heal==='victim'?[victim]:
      rule.heal==='owner'?[owner]:gameEffectRecipients(b,owner,rule.heal);
    const outputs=rule.recovery==='both'?['hp','mind']:[rule.recovery||'hp'];
    for(const output of outputs){
      const separate=output==='mind'&&rule.recovery==='both'&&rule.formula==='split';
      const value=separate?rule.mindAmount:rule.amount, mode=separate?rule.mindMode:rule.mode;
      const cap=separate?rule.mindCap:rule.cap, capMode=separate?rule.mindCapMode:rule.capMode;
      const ceiling=!cap?Infinity:capMode==='percent'?Math.floor(damage*cap/100):cap;
      const amount=Math.min(ceiling,mode==='percent'?Math.floor(damage*value/100):Math.min(damage,value));
      if(amount<=0)continue;
      for(const receiver of receivers)if(gameAlive(receiver))gameApplyConversion(b,receiver,output,amount);
    }
  }
}
function gameApplyConversion(b,receiver,output,amount){
  if(output==='hp')gameHeal(b,receiver,amount);
  else if(output==='mind'){
    const restored=gameMental(b,receiver,amount);
    if(restored>0)gameLog(b,receiver.name+' · 정신력 '+restored+' 회복');
  }else{
    const gained=gameGainShield(b,receiver,amount,{},'conversion:'+output,output==='temporaryShield');
    if(gained)gameLog(b,receiver.name+' · '+(output==='temporaryShield'?'임시 방어막 ':'방어막 ')+gained+' 획득');
  }
}
function gameHeal(b,u,n){
  if(!gameAlive(u)||n<=0)return 0;
  const old=u.hp;
  if(u.inkBuff?.includes('yellow'))n=Math.floor(n*1.3);
  const penalty=Math.max(0,...(u.healCuts||[]).map(entry=>entry.amount));
  const healed=Math.floor(n*(100-penalty)/100);
  if(healed<n&&old<u.maxHp)gameLog(b,u.name+' · 회복량 '+penalty+'% 감소');
  u.hp=Math.min(u.maxHp,u.hp+healed);
  if(u.hp>old)gameLog(b,u.name+' 체력 회복 '+(u.hp-old));
  if(old<=u.maxHp/4&&u.hp>u.maxHp/4&&!u.rallied){u.rallied=true;gameMental(b,u,5);}
  gameInk(b,'yellow',u.hp-old);
  return u.hp-old;
}
function gamePose(b,unit,pose){
  unit.pose=pose;
  if(b.resolving&&b.poses.length<48)b.poses.push({id:unit.id,pose,
    form:unit.collapsed?'concept':unit.zero==='crisis'?'crisis':unit.awakening?'awakened':'normal'});
}
function gameProof(b,unit,vow){
  if(unit.zero==='crisis'&&unit.crisisVow===vow)b.proofs?.add(unit.id);
}
function gameSupportHeal(b,ctx,unit,amount){
  const restored=gameHeal(b,unit,amount);
  if(restored&&ctx.paidHealth>0&&unit!==ctx.actor&&unit.enemy===ctx.actor.enemy)gameProof(b,ctx.actor,'give');
}
function gameRerollLow(b,unit,rolls){
  if(!unit.lowRerolls)return;
  const candidates=rolls.flatMap(roll=>roll.faces.map((face,index)=>({roll,index,face})));
  if(!candidates.length)return;
  const rerolls=candidates.sort((a,c)=>a.face-c.face).slice(0,unit.lowRerolls);
  delete unit.lowRerolls;
  for(const {roll,index,face} of rerolls){
    roll.faces[index]=Math.max(face,gameRoll(roll.sides));
  }
  gameLog(b,unit.name+' · 주사위 재굴림 '+rerolls.map(({roll,index,face})=>face+'→'+roll.faces[index]).join(', '));
}
function gameActionPower(b,ctx,opponent){
  const unit=ctx.actor,clash=!!opponent;
  const target=opponent||ctx.targets[0];
  if(ctx.card.id==='conceptDread')ctx.ruleDreadPower=gameDreadPower(target);
  const powers=ctx.ruleDreadPower?[ctx.ruleDreadPower]:ctx.card.id==='conceptStitchSeam'?Array(Math.max(1,Math.min(7,target?.stacks['바늘땀']||0))).fill(ctx.card.power):[...cardHitPowers(ctx.card)];
  const rim=target&&target.guestRim>=b.round;
  if(rim)delete target.guestRim;
  if(unit.inkBuff?.includes('magenta')&&ctx.card.target!=='self'&&ctx.card.target!=='tile')powers.push(powers.at(-1));
  const rolls=powers.map(gameRollPower);
  gameRerollLow(b,unit,rolls);
  for(const roll of rolls){
    if(rim)roll.faces=roll.faces.map(face=>Math.min(face,Math.max(1,Math.floor(roll.sides/2))));
    if(unit.guestPenalty?.card===ctx.card.id&&unit.guestPenalty.through>=b.round)
      roll.faces=roll.faces.map(face=>Math.min(face,gameRoll(roll.sides)));
  }
  ctx.diceRolls=rolls.map(roll=>roll.faces.length?roll.faces.reduce((sum,face)=>sum+face,0):null);
  ctx.rawHitRolls=rolls.map((result,index)=>result.bonus+(ctx.diceRolls[index]??0));
  if(ctx.card.effects.some(effect=>effect.when==='roll'||Object.hasOwn(diceConditions,effect.condition))){
    const results=ctx.diceRolls.map((value,index)=>value===null?null:(index+1)+'타 '+value).filter(Boolean);
    if(results.length)gameLog(b,unit.name+' · 주사위 눈 '+results.join(' / '));
  }
  if(ctx.diceRolls.some(value=>value!==null)&&ctx.card.effects.some(effect=>effect.when==='roll')){
    const targets=opponent?[opponent]:ctx.targets.length?ctx.targets:[null];
    for(const target of targets){
      gameTriggers(b,ctx,'roll',target);
      for(const [index,value] of ctx.diceRolls.entries()){
        if(value===null)continue;
        // "판정 시" happens before any strike resolves.
        gameTriggers(b,ctx,'roll',target,0,index+1);
      }
    }
  }
  const awakening=unit.awakening?awakeningPower:0;
  const memory=clash?(unit.clashMemory||0):0;
  if(clash)delete unit.clashMemory;
  const formulas=powers;
  const judgeAxe=gameIsJudge(b)&&ctx.card.id==='judgeAxe';
  const blind=ctx.card.id==='conceptBlindJudge';
  const pending=unit.nextPower||0;
  const modifier=ctx.mod+(applauseAttack(ctx.card)?unit.combat?.attackPower||0:0)+(judgeAxe||blind?Math.max(0,pending):pending)+memory+awakening+(unit.stacks[redItch]||0)+(applauseAttack(ctx.card)?(unit.stacks[applause]||0)*2:0)+
    (blind&&target?Math.min(16,4*(gameJudgeDebuffKinds(target).length+Number(!!target.redBleed))):0);
  const nextPercent=unit.nextPowerPercent||0;
  const percent=(ctx.powerPercent||0)+(blind?Math.max(0,nextPercent):nextPercent);
  const stages={};
  for(const key of stagedPowerEffects.flatMap(kind=>[kind,kind+'Percent'])){
    stages[key]=(ctx[key]||0)+(unit.nextPowerStages?.[key]||0);
  }
  delete unit.nextPowerStages;
  unit.nextPower=0;
  unit.nextPowerPercent=0;
  ctx.hitRolls=gamePowerShares(ctx.rawHitRolls,modifier,percent,stages);
  if(clash&&ctx.card.unstoppable){
    const minimum=formulas.map(formula=>{
      const {count,bonus}=parsePower(formula);
      return count+bonus;
    });
    ctx.minimumHitRolls=gamePowerShares(minimum,modifier,percent,stages);
  }
  const total=ctx.hitRolls.reduce((sum,value)=>sum+value,0);
  return clash&&opponent.enemy&&gameIsJudge(b)&&unit.judgmentMark&&!ctx.intercept?Math.max(0,total-6):total;
}
function gamePowerShares(rolled,modifier,percent,stages){
  const rolls=rolled.map(value=>Math.max(0,value));
  const raw=rolls.reduce((sum,value)=>sum+value,0);
  const base=rolled.length===1?rolled[0]:raw;
  const boostedBase=Math.trunc((base+stages.basePower)*(100+stages.basePowerPercent)/100);
  const adjusted=applyPowerRatio(Math.max(0,boostedBase+modifier),percent);
  const total=applyPowerRatio(adjusted+stages.finalPower,stages.finalPowerPercent);
  if(rolls.length===1)return [total];
  // Apply card-wide modifiers once. Round cumulative shares to preserve their exact sum.
  let boundary=0,weight=0;
  return rolls.map(value=>{
    weight+=raw?value:1;
    const next=Math.round(total*weight/(raw||rolls.length));
    const hit=next-boundary;
    boundary=next;
    return hit;
  });
}
const gameWalls=[11,27];
const gameSpawns=[0,8,16,24];
function gameSpawn(seat,units,walls=gameWalls){
  const start=gameSpawns[seat];
  const options=[start,start+1,start+2,...Array.from({length:gridSize},(_,index)=>index)];
  return options.find(pos=>!walls.includes(pos)&&!Object.values(units).some(unit=>unit.pos===pos));
}
function gameBlocked(b,u) {
  return new Set([...gameBattleWalls(b,u),...Object.values(b.units).filter(v=>v.id!==u.id&&gameAlive(v)).map(v=>v.pos)]);
}
function gamePosition(b,u,pos) {
  if(!gridValid(pos)||gameBlocked(b,u).has(pos))return false;
  if(u.pos!==pos)b.moved?.add(u.id);
  u.pos=pos;
  return true;
}
function gameMove(b,u,goal,limit,approach=false) {
  const paths=gridPaths(u.pos,limit,gameBlocked(b,u));
  const closest=[...paths.keys()].sort((a,c)=>gridDistance(a,goal)-gridDistance(c,goal)||paths.get(a).length-paths.get(c).length)[0];
  const path=paths.get(goal)??(approach?paths.get(closest):[]);
  return gameFollowPath(b,u,path);
}
function gameFollowPath(b,u,path) {
  const origin=u.pos;
  if(path.length){
    u.pos=path.at(-1);
    b.moved?.add(u.id);
  }
  if(path.length){
    b.fieldPaths?.set(u.id,[origin,...path]);
    const penalty=path.filter(pos=>b.tiles?.[pos]&&!b.tiles[pos].kind&&b.tiles[pos].through>=b.round&&b.tiles[pos].source!==u.id).length;
    if(penalty)u.nextMove=Math.max(-7,u.nextMove-penalty);
    if(gameHeldModifiers(b,u,null).leaveTrail){
      b.tiles??={};
      for(const pos of [origin,...path.slice(0,-1)])b.tiles[pos]={source:u.id,through:b.round+1};
    }
  }
  if(path.length&&gameIsRail(b)&&!u.enemy&&b.aimLine&&u.railCrossRound!==b.round){
    const line=b.aimLine.index;
    if((gridPoint(origin).y-line)*(gridPoint(u.pos).y-line)<0&&path.some(pos=>gameRailAim(b,{pos}))){
      u.railCrossRound=b.round;
      gameDamage(b,u,5,b.units.railSniper,false,false,true,{kind:'other'});
    }
  }
  if(path.length)gameWhiteMazeMove(b,u);
  return path.length;
}
const instantMoveVectors={n:[0,-1],ne:[1,-1],e:[1,0],se:[1,1],s:[0,1],sw:[-1,1],w:[-1,0],nw:[-1,-1]};
function gameInstantMoveAnchor(b,actor,u,target,effect){
  const {moveAnchor,moveOrder,moveTest,moveTag,moveMetric,moveMin,moveMax}=effect;
  const value=unit=>moveMetric==='power'?stackPotency(unit,moveTag):unit.stacks?.[moveTag]||0;
  const eligible=unit=>{
    if(!gameAlive(unit)||unit===u)return false;
    if(moveTest==='present')return gameStackActive(unit,moveTag);
    if(moveTest==='absent')return !gameStackActive(unit,moveTag);
    if(moveTest==='inside'||moveTest==='outside'){
      const count=value(unit),inside=count>=moveMin&&count<=moveMax;
      return moveTest==='inside'?inside:!inside;
    }
    return true;
  };
  if(moveAnchor==='target'||moveAnchor==='source'){
    const anchor=moveAnchor==='source'?actor:target;
    return anchor&&eligible(anchor)?anchor:null;
  }
  const candidates=Object.values(b.units).filter(unit=>eligible(unit)&&
    (moveAnchor==='all'||(moveAnchor==='ally')===(unit.enemy===u.enemy)));
  const distance=unit=>gridDistance(u.pos,unit.pos);
  const score={
    nearest:distance,farthest:unit=>-distance(unit),lowestHp:unit=>unit.hp,highestHp:unit=>-unit.hp,
    lowestRatio:unit=>unit.hp/unit.maxHp,highestRatio:unit=>-unit.hp/unit.maxHp,
    mostStacks:unit=>-value(unit),fewestStacks:value
  }[moveOrder]??distance;
  return candidates.sort((a,c)=>score(a)-score(c)||distance(a)-distance(c)||a.pos-c.pos)[0];
}
function gameInstantMove(b,actor,u,target,effect,amount){
  if(!gameAlive(u)||u.rooted||(u!==actor&&gameForcedMoveBlocked(b,u)))return;
  const limit=bounded(Math.floor(amount),0,maxInstantMove);
  if(!limit)return;
  if(effect.moveMode==='choose'&&!u.bot&&!u.enemy){
    u.instantMove=bounded((u.instantMove||0)+limit,0,maxInstantMove);
    return;
  }
  if(effect.moveMode==='direction'){
    const [dx,dy]=instantMoveVectors[effect.moveDirection]??instantMoveVectors.e;
    const blocked=gameBlocked(b,u),path=[];
    let {x,y}=gridPoint(u.pos);
    for(let step=0;step<limit;step++){
      const next=gridIndex(x+dx,y+dy);
      if(!gridValid(next)||blocked.has(next)||
        dx&&dy&&(blocked.has(gridIndex(x+dx,y))||blocked.has(gridIndex(x,y+dy))))break;
      path.push(next);x+=dx;y+=dy;
    }
    gameFollowPath(b,u,path);
    return;
  }
  const anchor=effect.moveMode==='relative'?gameInstantMoveAnchor(b,actor,u,target,effect):
    (target&&target!==u?target:b.units.enemy);
  if(!anchor||anchor===u)return;
  if(effect.moveMode!=='relative'){
    gameMove(b,u,anchor.pos,bounded(Math.floor(amount),0,gridSize),true);
    return;
  }
  const {x,y}=gridPoint(anchor.pos),origin=gridPoint(u.pos);
  const dx=Math.sign(x-origin.x),dy=Math.sign(y-origin.y);
  const offset=effect.moveOffset;
  const [ox,oy]=instantMoveVectors[offset]??{
    behind:[dx,dy],front:[-dx,-dy],left:[dy,-dx],right:[-dy,dx]
  }[offset]??[-1,0];
  const blocked=gameBlocked(b,u);
  const paths=gridPaths(u.pos,gridSize,blocked);
  for(let step=limit;step>=1;step--){
    const destination=gridIndex(x+ox*step,y+oy*step);
    if(paths.has(destination)){gameFollowPath(b,u,paths.get(destination));return;}
  }
}
function gameDeckEffects(b,when){
  for(const actor of Object.values(b.units)){
    if(!gameAlive(actor))continue;
    const sources=(actor.startingCards||[]).map(id=>actor.library[id]);
    sources.push(...(actor.passives||[]).map(gamePassiveSource),...gameHeldStackSources(actor));
    for(const card of sources){
      if(!gameAlive(actor)||!card||(!card.passive&&!cardUsable(actor,card))||!card.effects.some(effect=>effect.when===when))continue;
      if(card.stackCount&&!gameStackActive(actor,card.name))continue;
      const targets=card.passive||card.target==='tile'?[]:actor.collapsed?collapseTargets(card,actor,Object.values(b.units),gameBattleWalls(b)):gameAllowedTargets(b,actor,card);
      const ctx=gameContext(actor,card,targets);
      const base=ctx.mod;
      b.shock={};
      for(const target of targets.length?targets:[null])gameTriggers(b,ctx,when,target);
      actor.nextPower=bounded((actor.nextPower||0)+ctx.mod-base,-999,999);
      actor.nextPowerPercent=bounded((actor.nextPowerPercent||0)+(ctx.powerPercent||0),-999,999);
      for(const key of stagedPowerEffects.flatMap(kind=>[kind,kind+'Percent'])){
        if(ctx[key]){
          const stages=actor.nextPowerStages??={};
          stages[key]=bounded((stages[key]||0)+ctx[key],0,999);
        }
      }
    }
  }
  delete b.shock;
}
function gameNext(b) {
  const enemy=b.units.enemy, party=Object.values(b.units).filter(u=>!u.enemy&&gameAlive(u));
  const foes=Object.values(b.units).filter(unit=>unit.enemy&&gameAlive(unit));
  if(gameIsBright(b))gameBrightTransition(b);
  const brightWipe=gameIsBright(b)&&!party.some(unit=>unit.id!=='conceptDawn'&&!unit.brainwashed&&!unit.collapsed);
  if(brightWipe)b.outcome={kind:b.encounter.stage>1?'sanctuaryBreak':'brainwashed',orb:null};
  const peaceful=gameStopOutcome(b,enemy,party)||gameCollectorOutcome(b,enemy,party)||gameJudgeOutcome(b,enemy,party)||
    gameRailOutcome(b,foes,party);
  if (peaceful||!foes.length||!party.length||brightWipe) {
    b.phase='finished';
    b.result=!peaceful&&foes.length?'패배':'승리';
    for(const unit of Object.values(b.units)){
      delete unit.lifeSteal;
      delete unit.redBleed;
      delete unit.inks;
      delete unit.inkBuff;
      delete unit.applauseRelease;
      delete unit.contemptThrough;
      delete unit.applauseShieldCut;
      if(gameIsBright(b))delete unit.stacks[brightLight];
      delete unit.queuedShields;delete unit.nextShield;
      if(unit.shield)gameExpireShields(unit,()=>true);
      for(const [name,trait] of Object.entries(unit.stackTraits||{})){
        if(trait.concept)gameWriteStacks(unit,name,[]);
      }
    }
    if(b.result==='승리')for(const unit of party)gameMental(b,unit,10);
    gameLog(b,'전투 '+b.result);
    return;
  }
  for(const unit of [enemy,...party]){
    if(unit.positionAnchor==null||(unit.anchorRound||0)>b.round)continue;
    const anchor=unit.positionAnchor;
    delete unit.positionAnchor;
    delete unit.anchorRound;
    if(unit.pos!==anchor){
      gameLog(b,unit.name+(gamePosition(b,unit,anchor)?' · 귀환 좌표로 복귀':' · 귀환 좌표가 막힘'));
    }
  }
  const available=party.filter(unit=>!unit.brainwashed&&unit.id!=='conceptDawn');
  const victim=available.find(u=>u.provoked)||available.slice().sort((a,c)=>gameDistance(a,enemy)-gameDistance(c,enemy))[0];
  if(victim.provoked)gameLog(b,victim.name+' · 도발로 예고 공격 유도');
  for(const unit of party)unit.provoked=false;
  const distance=gameDistance(victim,enemy);
  if(distance>4&&!gameIsRail(b)&&!enemy.immovable&&!enemy.rootNext&&!enemy.blockedRounds)gameMove(b,enemy,victim.pos,Math.min(bounded(2+enemy.nextMove,0,7),distance-4),true);
  enemy.rooted=!!enemy.rootNext;
  enemy.rootNext=false;enemy.nextMove=0;
  if(gameIsRail(b)){
    gameRailRound(b,party);
    b.intent=b.intentQueue[0]||{card:firstStopCards.stopWait,target:victim.id,reachable:false};
  }else if(gameIsFirstStop(b))b.intent=gameStopIntent(b,enemy,party);
  else if(gameIsCollector(b)){
    const deck=b.foeDeck;
    const paused=b.encounter.breakRound===b.round;
    const card=paused?firstStopCards.stopWait:collectorCards[deck.cards[deck.index]];
    if(!paused)deck.index=(deck.index+1)%deck.cards.length;
    const target=card.unredirectable?[...party].sort((a,c)=>(c.stacks['미수금']||0)-(a.stacks['미수금']||0)||a.hand.length-c.hand.length)[0]:victim;
    b.intent={target:target.id,card,reachable:!paused};
  }else if(gameIsJudge(b)){
    const deck=b.foeDeck;
    const card=judgeCards[deck.cards[deck.index]];
    deck.index=(deck.index+1)%deck.cards.length;
    const marked=gameJudgeRound(b,party);
    const attack=card.id==='judgeAxe'&&marked?{...card,hitPowers:[card.power,card.power]}:card;
    b.intent={target:(marked||victim).id,card:attack,reachable:true};
  }else if(gameIsBright(b)){
    if(b.encounter.stage===1)for(const unit of party.filter(unit=>unit.brainwashed)){
      unit.hp=Math.min(unit.maxHp,unit.hp+10);
      gameGainShield(b,unit,15,{shieldCap:45,shieldDuration:1},'brightRound');
    }
    b.intent=gameBrightIntent(b,enemy,victim);
  }else b.intent={target:victim.id,card:gameFoe,reachable:true};
  b.plans={};
  b.phase='planning';
  if(b.round===1){
    const opening=party.map(unit=>[unit,[...unit.hand]]);
    gameDeckEffects(b,'battleStart');
    for(const [unit,ids] of opening)gameCardZoneEvents(b,unit,ids,'cardDrawn');
  }else for(const unit of party){
    for(const queued of unit.queuedShields||[]){
      const gained=gameGainShield(b,unit,queued.amount,queued.effect,queued.key);
      if(gained)gameLog(b,unit.name+' · 보호막 '+gained+' 획득');
    }
    if(unit.nextShield)gameGainShield(b,unit,unit.nextShield);
    delete unit.queuedShields;delete unit.nextShield;
    if(gameAlive(unit))gameDraw(unit,Math.max(0,(unit.combat?.handSize??handTarget)-unit.hand.length)+(unit.lateDraw||0),b);
    delete unit.lateDraw;
  }
  gameDeckEffects(b,'turnStart');
  for(const unit of Object.values(b.units))unit.applauseMoveStart=unit.move;
  gameApplauseRound(b,'turnStart');
  gameFieldRound(b,'turnStart');
  for(const unit of Object.values(b.units).filter(gameAlive))gameItchRound(b,unit,'turnStart');
  if(!gameIsFirstStop(b)&&!gameIsRail(b))b.intent.reachable=b.intent.reachable&&gameActionLimit(enemy)>0&&
    gameReach(b,b.intent.card,enemy,b.units[b.intent.target]);
  if(!foes.some(gameAlive)||!party.some(gameAlive))gameNext(b);
}
function gameCollection(profile,row){
  const cards=new Map((profile?.cards||[]).map(card=>[card.id,card]));
  if(row)for(const card of JSON.parse(row.cards))cards.set(card.id,card);
  const deck=row?JSON.parse(row.deck):[];
  const entries=[...cards.values()];
  const stacks=row?.stack_names?JSON.parse(row.stack_names):[];
  return {cards:entries.filter(card=>!card.deleted),deleted:entries.filter(card=>card.deleted),
    deck:deck.length?deck:profile?.deck||[],stackNames:stacks.map(stack=>typeof stack==='string'?stack:stack.name),
    stackTraits:stacks.filter(stack=>typeof stack==='object').map(gameUpgradeStackTrait),revision:row?.revision||0};
}
function gameShareBundle(card,cards){
  const builtIns=new Set(gameCatalogue.map(entry=>entry.id));
  const owned=new Map(cards.map(entry=>[entry.id,entry]));
  const bundle=new Map();
  const collect=entry=>{
    if(!entry||bundle.has(entry.id))return;
    bundle.set(entry.id,entry);
    for(const effect of entry.effects||[]){
      for(const id of effectCardReferences(effect)){
        if(!id||builtIns.has(id))continue;
        const dependency=owned.get(id);
        if(!dependency)gameFail('효과에서 참조하는 카드를 확인하세요.');
        collect(dependency);
      }
    }
  };
  collect(card);
  return [...bundle.values()];
}
function gameImportCards(source,owned,shared=false,ids=null,limit=24){
  if(!Array.isArray(source)||!source.length||source.length>limit||source.some(card=>
    !card||typeof card!=='object'||typeof card.id!=='string'||!card.id||card.id.length>70||
    gameCatalogue.some(builtIn=>builtIn.id===card.id)||!Array.isArray(card.effects)
  ))gameFail('가져올 카드의 형식을 확인하세요.');
  ids??=new Map(source.map(card=>[card.id,gameId()]));
  if(ids.size!==source.length)gameFail('파일에 같은 카드 ID가 여러 번 나와요.');
  if(owned.length+source.length>limit)gameFail('참조 카드를 포함해 최대 '+limit+'장까지 가져올 수 있어요.');
  const known=[...gameCatalogue,...owned,...[...ids.values()].map(id=>({id}))];
  return source.map(card=>{
    const effects=card.effects.map(effect=>{
      const remapped=mapEffectCardReferences(effect,id=>ids.get(id)||id);
      if(['awakenBody','inscribeMeaning'].includes(effect?.kind)&&effect.perStack){
        return {...remapped,amount:effect.amount*effect.perStack};
      }
      return remapped;
    });
    const imported=gameCard({...card,effects},ids.get(card.id),known);
    if(shared)imported.shareOrigin=card.shareOrigin||card.id;
    return imported;
  });
}
function gameActivityLocations(input){
  if(input==null)return [];
  if(!Array.isArray(input)||input.some(tag=>typeof tag!=='string'))gameFail('활동지를 확인하세요.');
  const tags=[...new Set(input.map(tag=>locationTagAliases[tag]||tag))];
  if(tags.some(tag=>!locationTags.includes(tag)))gameFail('유효한 활동지를 선택하세요.');
  return tags;
}
const gameRevealTier=progress=>revealThresholds.filter(threshold=>progress>=threshold).length;
function gameObserve(b,entity,increase){
  if(!entity?.enemy)return;
  const tags=entity.locationTags||[];
  const intel=b.intel??={};
  const overlap=()=>Object.values(b.units).filter(unit=>!unit.enemy&&!unit.bot&&gameAlive(unit)&&tags.length&&
    (unit.activityLocations||[]).some(tag=>tag==='전 구역'||tags.includes('전 구역')||tags.includes(tag))).length;
  const entry=intel[entity.id]??={overlap:overlap(),progress:0,tier:0};
  entry.progress=Math.min(100,Math.max(entry.progress,entry.overlap*25)+increase);
  const tier=gameRevealTier(entry.progress);
  if(increase)for(let level=entry.tier+1;level<=tier;level++)gameLog(b,entity.name+' · 관찰 '+level+'단계 해금');
  entry.tier=tier;
}
function gameRevealCard(card,tier){
  if(!card||tier===3)return card;
  const hidden=[...(tier<1?['power','hitPowers','hitTargets','cost']:[]),
    ...(tier<2?['effects']:[]),'notes','flavor','hitFlavors','locationTags'];
  const result={...card,revealTier:tier,revealHidden:hidden};
  for(const key of hidden)delete result[key];
  if(tier<2)result.effects=[];
  else result.effects=card.effects.map(({condition,conditionCardId,conditionStackTag,threshold,flow,...effect})=>effect);
  return result;
}
function gameProfileFields(input,mind){
  const name=gameText(input.name,36),country=gameText(input.country,8),status=input.status;
  if(!name||!statuses.includes(status)||!/^제[1-9]국$|^중앙국$/.test(country))gameFail('이름, 출신국, 시작 신분을 확인하세요.');
  if(status==='월정커'&&!/^제[4-8]국$/.test(input.wall))gameFail('월정커의 생활 장벽은 제4~제8국에서 선택하세요.');
  const stats=input.stats;
  if(!Array.isArray(stats)||stats.length!==6||!stats.every(n=>gameInt(n,0,100))||stats.reduce((a,n)=>a+n,0)!==300)gameFail('능력치는 각 0~100, 합계 300이어야 해요.');
  if(!gameInt(mind,0,100))gameFail('정신력은 0~100으로 설정하세요.');
  return {name,country,status,activityLocations:gameActivityLocations(input.activityLocations),wall:status==='월정커'?input.wall:'',job:gameText(input.job,36),
    goal:gameText(input.goal,180),concept:gameText(input.concept,180),stats,mind};
}
function gameValidateArt(slot,image){
  const [form,pose,extra]=slot.split('.');
  if(extra!==undefined||!Object.hasOwn(artForms,form)||!Object.hasOwn(artPoses,pose))gameFail('일러스트 종류를 확인하세요.');
  if(typeof image!=='string'||image.length>maxPortraitDataLength||image&&(image.split(',').at(-1).length%4!==0||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)))gameFail('일러스트 형식이나 크기를 확인하세요.');
}
function gameExportPassives(passives,owned){
  const cards=new Map();
  for(const passive of passives){
    for(const card of gameShareBundle(passive,owned).slice(1))cards.set(card.id,card);
  }
  return {passives,cards:[...cards.values()]};
}
function gameImportPassives(file,existing,cards,enabled,includeTools=false){
  const tools=includeTools?(file.conceptTools===undefined?[]:file.conceptTools):[];
  if(!Array.isArray(tools)||tools.length>maxConceptTools)gameFail('개념 도구 수를 확인하세요.');
  if(!Array.isArray(file.passives)||existing.length+file.passives.length>maxPassives||
    !Array.isArray(file.cards)||cards.length+file.cards.length>48||
    file.cards.some(card=>!card||typeof card.id!=='string'))gameFail('패시브 또는 참조 카드 수를 확인하세요.');
  const ids=new Map(file.cards.map(card=>[card.id,gameId()]));
  const imported=file.cards.length?gameImportCards(file.cards,cards,false,ids,48):[];
  const owned=[...gameCatalogue,...cards,...imported];
  const read=passive=>{
    if(!passive||!Array.isArray(passive.effects))gameFail('패시브 파일의 효과를 확인하세요.');
    return gamePassive({...passive,enabled:enabled&&passive.enabled!==false,
      effects:passive.effects.map(effect=>mapEffectCardReferences(effect,id=>ids.get(id)||id))},undefined,owned);
  };
  return {passives:[...existing,...file.passives.map(read)],passiveCards:[...cards,...imported],
    ...(includeTools?{conceptTools:tools.map(read)}:{})};
}
function gameLoadCharacter(profile,file){
  const fields=file.character;
  if(!fields||!fields.art||typeof fields.art!=='object'||Array.isArray(fields.art))gameFail('캐릭터 파일 형식을 확인하세요.');
  for(const [slot,image] of Object.entries(fields.art))gameValidateArt(slot,image);
  Object.assign(profile,gameProfileFields(fields,fields.mind),gameImportPassives(file,[],[],true,true),
    {art:fields.art,artVersion:(profile.artVersion||0)+1});
}
function gameDeck(owned,ids){
  if(!ids?.length)return gameStarterDeck;
  const catalogue=new Map(owned.map(card=>[card.id,card]));
  const deck=ids.map(id=>catalogue.get(id)).filter(Boolean);
  for(const card of gameStarterDeck){
    if(deck.length>=deckSize)break;
    if(deck.filter(entry=>entry.id===card.id).length<deckCopyLimit)deck.push(card);
  }
  return deck;
}
const gameCardNameKey=name=>name.normalize('NFKC').toLowerCase().replace(/[\s·ㆍ'‘’"“”]/g,'');
const gameNormalCard=card=>card&&!card.concept&&cardState(card.requiredState)==='any'&&!card.temporary&&!card.generated;
function gameCampaignDeck(state,id,collection){
  const campaign=state.campaign;
  const party=campaign?.loopCount?campaign.party.find(unit=>unit.id===id):null;
  const owned=[...gameCatalogue,...defenseGenerated,...fieldGenerated,guestGenerated,commuteSeize,scribeRewind,artistCards[1],applauseCards[1],...gameUnlockedCards(state.profiles[id]),...collection.cards,...Object.values(campaign?.definitions||{})];
  if(!party)return {owned,cards:gameDeck(owned,collection.deck)};
  const cards=party.deck.map(cardId=>owned.find(card=>card.id===cardId));
  if(cards.length!==deckSize||cards.some(card=>!card))gameFail('소실된 덱의 빈자리를 새 카드로 채운 뒤 출발하세요.');
  return {owned,cards};
}
function gameCheckpoint(state,b,kind='auto',label=''){
  const campaign=state.campaign??={saveVersion:2,sequence:0,station:0,party:[],checkpoints:[],loopCount:0,residue:0,
    memory:{intel:{}},lostCards:[],definitions:{}};
  if(b&&!Object.values(b.units).some(unit=>!unit.enemy&&!unit.bot))return;
  if(b){
    campaign.station++;
    campaign.party=Object.values(b.units).filter(unit=>!unit.enemy&&!unit.bot).map(unit=>{
      for(const id of unit.configuredDeck){
        if(!gameCatalogue.some(card=>card.id===id)&&unit.library[id])campaign.definitions[id]=unit.library[id];
      }
      return {id:unit.id,name:unit.name,mind:unit.mind,orbs:[...(state.profiles[unit.id]?.orbs||[])],deck:[...unit.configuredDeck]};
    });
    for(const [id,{progress}] of Object.entries(b.intel||{})){
      const key=b.encounter?b.encounter.id+':'+id:id;
      campaign.memory.intel[key]=Math.max(progress,campaign.memory.intel[key]||0);
    }
  }
  if(!campaign.party.length)gameFail('열차 복귀 기록이 있어야 저장할 수 있어요.');
  if(kind==='manual'&&campaign.checkpoints.filter(entry=>entry.kind==='manual').length>=4)gameFail('수동 저장은 네 개까지 만들 수 있어요.');
  const checkpoint={id:'ck_'+(++campaign.sequence),kind,label:label||'열차 복귀 '+campaign.station,
    station:campaign.station,party:structuredClone(campaign.party),lossCount:campaign.lostCards.length,
    refilled:campaign.lostCards.flatMap(loss=>loss.replacedBy?[loss.replacedBy]:[])};
  campaign.checkpoints.push(checkpoint);
  while(campaign.checkpoints.length>12)campaign.checkpoints.splice(campaign.checkpoints.findIndex(entry=>entry.kind==='auto'),1);
}
function gameRestoreParty(campaign,checkpoint){
  const party=structuredClone(checkpoint.party);
  for(const [index,loss] of campaign.lostCards.entries()){
    const unit=party.find(unit=>unit.id===loss.actor);
    if(!unit)continue;
    if(index>=checkpoint.lossCount){
      const position=unit.deck.indexOf(loss.cardId);
      if(position>=0)unit.deck.splice(position,1);
    }
    if(loss.replacedBy&&!checkpoint.refilled.includes(loss.replacedBy))unit.deck.push(loss.replacedBy);
  }
  return party;
}
function gameLoopRevert(state,input){
  const campaign=state.campaign;
  const checkpoint=campaign?.checkpoints.find(entry=>entry.id===input.checkpointId);
  if(!checkpoint||campaign.loopCount>=12)gameFail('회귀할 수 있는 책갈피가 없어요.');
  const party=gameRestoreParty(campaign,checkpoint);
  const lookup=id=>gameCatalogue.find(card=>card.id===id)||campaign.definitions[id]||(id===darkForgive.id?darkForgive:null);
  const selected=party.find(unit=>unit.id===input.target)||[...party].sort((a,c)=>c.mind-a.mind)[0];
  const payer=[selected,...party.filter(unit=>unit!==selected)].find(unit=>unit.deck.some(id=>gameNormalCard(lookup(id))));
  if(payer){
    const id=input.cardId||payer.deck.find(id=>gameNormalCard(lookup(id)));
    if(!payer.deck.includes(id)||!gameNormalCard(lookup(id)))gameFail('회귀의 대가로 낼 일반 카드를 선택하세요.');
    payer.deck.splice(payer.deck.indexOf(id),1);
    campaign.lostCards.push({actor:payer.id,cardId:id,name:lookup(id).name,checkpointId:checkpoint.id,replacedBy:null});
  }
  campaign.loopCount++;
  campaign.residue++;
  campaign.station=checkpoint.station;
  campaign.party=party;
  campaign.checkpoints=campaign.checkpoints.slice(0,campaign.checkpoints.indexOf(checkpoint)+1);
  for(const unit of party)Object.assign(state.profiles[unit.id]??={cards:[],deck:[]},{mind:unit.mind,orbs:unit.orbs});
  state.battle=null;
}
function gameLoopRefill(state,actor,input){
  const campaign=state.campaign;
  const unit=campaign?.party.find(unit=>unit.id===actor);
  const loss=campaign?.lostCards.find(entry=>entry.actor===actor&&!entry.replacedBy);
  if(!unit||!loss||unit.deck.length>=deckSize)gameFail('작성할 빈 카드 자리가 없어요.');
  const name=gameText(input.name,21), power=parsePower(input.power), range=Number(input.range),cost=Number(input.cost);
  const ceiling=Math.max(...gameCatalogue.filter(gameNormalCard).map(card=>cardHitPowers(card).reduce((sum,formula)=>{
    const parsed=parsePower(formula);
    return sum+parsed.bonus+parsed.count*parsed.sides;
  },0)));
  if(!name||name.length>20||!power||power.bonus+power.count*power.sides>ceiling||!gameInt(range,1,5)||!gameInt(cost,0,5))
    gameFail('새 카드의 이름, 위력, 사거리와 정신력 소모를 확인하세요.');
  const key=gameCardNameKey(name);
  if(!key||campaign.lostCards.some(entry=>gameCardNameKey(entry.name)===key))gameFail('그 이름은 이미 지워졌습니다.');
  if(unit.deck.some(id=>gameCardNameKey((campaign.definitions[id]||gameCatalogue.find(card=>card.id===id))?.name||'')===key))
    gameFail('그 이름은 이미 이 덱에 있습니다.');
  const id=gameId();
  campaign.definitions[id]={...gameCard({name,power:power.formula,range:String(range),target:1,role:'normal',effects:[],
    notes:gameText(input.text,120)},id),cost,refill:true};
  unit.deck.push(id);
  loss.replacedBy=id;
}
function gameCampaignView(state,actor,manager){
  const campaign=state.campaign;
  if(!campaign)return undefined;
  return {station:campaign.station,loopCount:campaign.loopCount,residue:campaign.residue,
    checkpoints:campaign.checkpoints.map(checkpoint=>{
      const {id,label,kind}=checkpoint;
      const candidates=manager?gameRestoreParty(campaign,checkpoint).map(({id,name,deck})=>({id,name,
        cards:deck.map(cardId=>campaign.definitions[cardId]||gameCatalogue.find(card=>card.id===cardId))
          .filter(gameNormalCard).map(({id,name})=>({id,name}))})):undefined;
      return {id,label,kind,candidates};
    }),
    lostCards:campaign.lostCards.filter(loss=>manager||loss.actor===actor),
    ownDeck:campaign.party.find(unit=>unit.id===actor)?.deck.map(id=>({id,name:(campaign.definitions[id]||gameCatalogue.find(card=>card.id===id))?.name||id})),
    ...(manager?{party:campaign.party.map(({id,name})=>({id,name}))}:{})};
}
function gameBegin(state,members,settings,actor,collections) {
  const encounter=Object.hasOwn(encounterPresets,settings.encounter)?encounterPresets[settings.encounter]:null;
  const walls=encounter?.walls||gameWalls;
  const selected=members.filter(m=>m.seat>0);
  const solo=settings.solo===true;
  if(solo&&selected.length)gameFail('혼자 연습은 플레이어 자리를 비운 뒤 시작하세요.');
  const units={};
  for(const m of selected) {
    const p=state.profiles[m.id];
    const collection=collections.get(m.id);
    const {owned,cards}=gameCampaignDeck(state,m.id,collection);
    units[m.id]=gameUnit(m.id,p?.name||m.name,gameSpawn(m.seat-1,units,walls),cards,false,false,[...owned,...(p?.passiveCards||[])],p?.stats);
    units[m.id].activityLocations=gameActivityLocations(p?.activityLocations);
    units[m.id].passives=gameEquippedEffects(p);
    units[m.id].stackDefinitions=Object.fromEntries(collection.stackTraits.map(trait=>[trait.name,trait]));
    if(p?.mind!==undefined)units[m.id].mind=p.mind;
    if(p?.guilt)units[m.id].stacks['죄책감']=p.guilt;
    if(p?.debt){units[m.id].stacks['미수금']=p.debt;p.debt=0;}
    if(units[m.id].mind===0)units[m.id].zero='pending';
  }
  if(solo) {
    const p=state.profiles[actor.id];
    const collection=collections.get(actor.id);
    const {owned,cards}=gameCampaignDeck(state,actor.id,collection);
    units[actor.id]=gameUnit(actor.id,p?.name||actor.name,gameSpawn(0,units,walls),cards,false,false,[...owned,...(p?.passiveCards||[])],p?.stats);
    units[actor.id].activityLocations=gameActivityLocations(p?.activityLocations);
    units[actor.id].passives=gameEquippedEffects(p);
    units[actor.id].stackDefinitions=Object.fromEntries(collection.stackTraits.map(trait=>[trait.name,trait]));
    if(p?.mind!==undefined)units[actor.id].mind=p.mind;
    if(p?.guilt)units[actor.id].stacks['죄책감']=p.guilt;
    if(p?.debt){units[actor.id].stacks['미수금']=p.debt;p.debt=0;}
    if(units[actor.id].mind===0)units[actor.id].zero='pending';
  }
  const free=gameSpawns.filter(pos=>!walls.includes(pos)&&!Object.values(units).some(u=>u.pos===pos));
  const count=Number(settings.bots);
  if(!gameInt(count,0,free.length))gameFail('봇은 비어 있는 플레이어 자리에만 넣을 수 있어요.');
  for(let i=0;i<count;i++)units['bot'+i]=gameUnit('bot'+i,gameBots[i],free[i],gameStarterDeck,true);
  if(!Object.keys(units).length)gameFail('플레이어 또는 봇을 한 명 이상 배치하세요.');
  units.enemy=gameUnit('enemy','존속의 집행체',22,[gameFoe],true,true);
  units.enemy.boss=true;
  units.enemy.locationTags=[...gameFoe.locationTags];
  const battle={round:1,units,walls:[...walls],log:['빈 객차. 존속의 집행체가 남은 승객을 찾아 들어왔습니다.'],result:null};
  if(encounter){
    const foe=units.enemy;
    Object.assign(foe,{conceptEntity:true,name:encounter.foe,pos:encounter.start,hp:encounter.hp,maxHp:encounter.hp,move:0,
      immovable:encounter===firstStop,locationTags:[...encounter.tags],
      passives:(encounter===firstStop?['부동의 사신','선공하지 않는 구원자','성역의 정적']:encounter===collectorStop?['이자가 붙는 장부','원금 회수']:['죄인의 표식','죄업','무차별 여파'])
        .map((name,index)=>({id:'stopPassive'+index,name,effects:[]}))});
    battle.encounter={id:encounter.id,name:encounter.name,peace:0,peaceOpen:false,damage:0,lastDamage:0,attackers:[]};
    if(encounter===brightStop){
      foe.passives=[];
      battle.encounter.difficulty='전설급';
      battle.encounter.stage=1;
      battle.encounter.holder=Object.keys(units).find(id=>state.profiles[id]?.orbs?.includes('orbDarkHalo'));
    }
    battle.foeDeck={cards:[...encounter.deck],index:0};
    battle.zones=[...encounter.zones];
    if(encounter.squad){
      battle.foeOrder=encounter.squad.map(unit=>unit.id);
      battle.foeDecks=Object.fromEntries(encounter.squad.map(unit=>[unit.id,{cards:[...unit.deck],index:0}]));
      battle.encounter.subdueOrder=[];
      for(const member of encounter.squad){
        const unit=gameUnit(member.id,member.name,member.pos,Object.values(railCards),true,true);
        Object.assign(unit,{hp:member.hp,maxHp:member.hp,railRole:member.key,locationTags:encounter.tags});
        units[member.id]=unit;
      }
    }
    battle.log=[encounter.name];
  }
  for(const entity of Object.values(units).filter(unit=>unit.enemy)){
    gameObserve(battle,entity,0);
    const key=encounter?encounter.id+':'+entity.id:entity.id;
    const remembered=state.campaign?.memory.intel[key]||0;
    if(remembered>battle.intel[entity.id].progress)gameObserve(battle,entity,remembered-battle.intel[entity.id].progress);
  }
  gameNext(battle);
  return battle;
}

const gameActionLimit=u=>u.blockedRounds?0:bounded((u.baseActions??baseActions)+(u.bonusActions||0)-(u.actionPenalty||0),0,maxActions);
const gamePlannedCards=plan=>plan?.cards??(plan?.card?[plan]:[]);
const gamePaidActions=(unit,cards)=>cards.filter(plan=>plan.card&&!unit.library[plan.card]?.freeAction).length;
const gameHasClash=plan=>gamePlannedCards(plan).some(card=>card.clash);
function gameAllowedTargets(b,u,card) {
  if(card.role==='counter')return [u];
  if(card.target==='self')return gameAlive(u)&&gameReach(b,card,u,u)?[u]:[];
  return Object.values(b.units).filter(v=>gameAlive(v)&&
    (card.id!=='conceptApproach'||gameBeyondTarget(b,u,v)!==undefined)&&
    (card.id!=='conceptScribeRewind'||v.scribeRecord?.issuer===u.id&&v.scribeRecord.through>=b.round)&&
    (card.targetSide==='any'||(card.targetSide==='ally'?v.enemy===u.enemy&&(card.includeSelf||v!==u):v.enemy!==u.enemy))&&gameReach(b,card,u,v));
}
function gameSelect(b,u,input,ai=false) {
  const cardId=input.card||null;
  if(cardId&&!gameActionLimit(u)&&!u.library[cardId]?.freeAction)gameFail('이번 턴에 사용할 수 있는 카드가 없어요.');
  const crisis=u.zero==='crisis';
  const vow=u.crisisVow||input.vow;
  if(crisis&&!Object.hasOwn(crisisVows,vow))gameFail('붕괴 직전 지킬 뜻을 선택하세요.');
  const card=cardId&&Object.hasOwn(u.library,cardId)?u.library[cardId]:null;
  const granted=card?.temporary&&cardUsable(u,card);
  if(cardId&&!u.hand.includes(cardId)&&!granted)gameFail('손패에 있는 카드를 선택하세요.');
  if((card?.concept||card?.refill)&&u.mind<gameRuleCost(b,u,card))gameFail('이 개념물 카드는 정신력 '+gameRuleCost(b,u,card)+'이 필요합니다.');
  if(card&&u.sealedHighest?.round===b.round&&u.hand.includes(cardId)&&gameHandCardIndex(u,cardId,b.round)<0)
    gameFail('압류 표식으로 이 카드 사본은 이번 라운드에 사용이 금지돼요.');
  if(card&&!cardUsable(u,card,b.round))gameFail('현재 상태에서 사용할 수 없는 카드입니다.');
  const goal=input.pos??u.pos;
  if(!gridValid(goal)||!gridPaths(u.pos,u.move,gameBlocked(b,u)).has(goal))gameFail('이동 가능 거리를 확인하세요.');
  const copyId=card?.effects.some(e=>e.kind==='copyChosen')?input.copyId:null;
  if(card?.effects.some(e=>e.kind==='copyChosen')&&!u.hand.some((id,index)=>id===copyId&&index!==u.hand.indexOf(cardId))){
    gameFail('손패에서 복제할 카드를 선택하세요.');
  }
  const discard=gameDiscardSelection(u.hand.filter((_,index)=>index!==u.hand.indexOf(cardId)),input.discard,ai);
  if(card?.target==='tile'||input.targetTile!=null&&gridCanAimTile(card)&&!u.collapsed){
    if(!gridValid(input.targetTile)||b.walls.includes(input.targetTile)||!gridCardInRange(card,goal,input.targetTile))
      gameFail('기본 사거리 안에서 광역 중심 칸을 선택하세요.');
    if(input.clash||['clash','intercept'].includes(input.stance))gameFail('칸을 지정한 행동은 합을 걸 수 없어요.');
    return {card:cardId,pos:goal,targetTile:input.targetTile,targets:[],clash:false,...(typeof input.actionLink==='string'&&input.actionLink.length<=100?{actionLink:input.actionLink}:{}),...(crisis?{vow}:{}),...(copyId?{copyId}:{}),discard};
  }
  // Collapse targets are calculated after movement. Ignore submitted target and clash choices.
  if(u.collapsed){
    if(card&&!['guard','counter'].includes(card.role)&&!collapseTargets(card,{...u,pos:goal},Object.values(b.units),gameBattleWalls(b)).length)gameFail('선택한 위치에서 사거리 안에 자동 표적이 없어요.');
    return {card:cardId,pos:goal,targets:[],clash:false,...(copyId?{copyId}:{}),discard};
  }
  if(input.stance!=null&&!['clash','unopposed','intercept'].includes(input.stance))gameFail('공격 방식을 확인하세요.');
  const intercept=input.stance==='intercept'||input.intercept===true;
  const clash=intercept||input.stance==='clash'||input.stance==null&&input.clash===true;
  const intent=gameIsRail(b)&&clash?b.intentQueue.find(entry=>entry.id===input.foeIntent):b.intent;
  if(clash&&!intent)gameFail('합을 걸 적의 예고를 선택하세요.');
  const foe=b.units[intent.attacker||'enemy'];
  if(intercept&&(intent.target===u.id||!gameReach(b,intent.card,foe,{...u,pos:goal})))
    gameFail('양쪽 공격 사거리 안에서 아군을 향한 예고만 가로챌 수 있어요.');
  if(clash&&intent.card.unredirectable&&intent.target!==u.id)gameFail('대상 변경 불가 공격은 가로챌 수 없어요.');
  if(clash&&(['assist','guard','counter'].includes(card?.role)||!card?.clash||intent.card.support||!intent.reachable||!gameAlive(b.units[intent.target])))gameFail('이 행동으로는 현재 합을 걸 수 없어요.');
  const guarding=card?.role==='guard';
  const targetLimit=gridTargetLimit(card);
  const targets=(guarding||targetLimit)&&Array.isArray(input.targets)?[...new Set(input.targets)]:[];
  if(targets.length>5||targets.some(t=>typeof t!=='string'||!Object.hasOwn(b.units,t)))gameFail('대상을 확인하세요.');
  const preview={...u,pos:goal};
  const available=guarding?Object.values(b.units).filter(v=>v!==u&&v.enemy===u.enemy&&gameAlive(v)&&gameReach(b,card,preview,v)):
    card?gameAllowedTargets(b,preview,card):[];
  if(card&&!guarding&&!available.length)gameFail('선택한 위치에서 사거리 안에 대상이 없어요.');
  if(guarding?targets.length>1:targetLimit&&(!targets.length||targets.length>targetLimit))gameFail('카드의 대상 수를 확인하세요.');
  if(!targets.every(id=>available.some(v=>v.id===id)))gameFail('선택한 위치에서 대상이 사거리 밖에 있어요.');
  if(clash&&intent.target===u.id&&!gameReach(b,intent.card,foe,{...u,pos:goal}))gameFail('이동할 위치가 적의 예고 공격 사거리 밖이에요.');
  if(clash&&!(card.target==='area'?available.includes(foe):targets.includes(foe.id)))gameFail('합을 걸려면 예고 공격을 하는 적을 대상으로 선택하세요.');

  return {card:cardId,...(crisis?{vow}:{}),pos:goal,targets,clash,stance:intercept?'intercept':clash?'clash':'unopposed',...(intercept?{intercept:true}:{}),...(clash&&intent.id?{foeIntent:intent.id}:{}),...(typeof input.actionLink==='string'&&input.actionLink.length<=100?{actionLink:input.actionLink}:{}),...(copyId?{copyId}:{}),discard};
}
function gameSelectTurn(b,u,input,ai=false){
  if(!Object.hasOwn(input,'cards'))return gameSelect(b,u,input,ai);
  const {cards,pos,vow,discard}=input;
  if(!Array.isArray(cards)||cards.length>maxActions+1||gamePaidActions(u,cards.filter(Boolean))>gameActionLimit(u))gameFail('이번 턴 행동량까지만 카드를 예약할 수 있어요.');
  if(cards.some(card=>!card||typeof card.card!=='string'||!card.card))gameFail('예약할 카드를 확인하세요.');
  const clashes=cards.filter(card=>card.clash===true||['clash','intercept'].includes(card.stance));
  const clashTargets=new Set(clashes.map(card=>gameIsRail(b)?card.foeIntent:'enemy'));
  if(clashes.length!==clashTargets.size)gameFail('예고 공격 하나에는 카드 한 장만 합을 걸 수 있어요.');
  if(!cards.length)return gameSelect(b,u,{pos,vow,discard},ai);
  const hand=[...u.hand], temporary=new Set();
  const draft={...u,hand,sealedHighest:u.sealedHighest?{...u.sealedHighest}:undefined};
  const chosen=cards.map(choice=>{
    const plan=gameSelect(b,draft,{...choice,pos,vow,discard:null},ai);
    const index=gameHandCardIndex(draft,plan.card,b.round);
    if(index>=0)gameSpliceHand(draft,index,1);
    else {
      if(temporary.has(plan.card))gameFail('임시 카드는 한 턴에 한 번만 사용할 수 있어요.');
      temporary.add(plan.card);
    }
    return plan;
  });
  return {...chosen[0],cards:chosen,discard:gameDiscardSelection(hand,discard,ai)};
}
function gameBotPlan(b,u,allowClash=true) {
  const enemy=b.units.enemy;
  const crisis=u.zero==='crisis';
  const vow=crisis?'face':undefined;
  const cards=crisis?['crisisFace']:u.hand;
  if(u.collapsed){
    const card=gameCollapseCard;
    const paths=gridPaths(u.pos,u.move,gameBlocked(b,u));
    const units=Object.values(b.units);
    for(const pos of paths.keys())if(collapseTargets(card,{...u,pos},units,gameBattleWalls(b)).length)return gameSelect(b,u,{card:card.id,pos},true);
    const pos=[...paths.keys()].sort((a,c)=>gridDistance(a,enemy.pos)-gridDistance(c,enemy.pos))[0];
    return gameSelect(b,u,{pos},true);
  }
  const open=[];
  const paths=gridPaths(u.pos,u.move,gameBlocked(b,u));
  for(const [goal,path] of paths){
    for(const id of cards){
      const card=u.library[id];
      if(!cardUsable(u,card))continue;
      const copyId=card.effects.some(e=>e.kind==='copyChosen')?u.hand.find((_,i)=>i!==u.hand.indexOf(id)):null;
      if(card.effects.some(e=>e.kind==='copyChosen')&&!copyId)continue;
      if(card.role==='overload'&&card.cost>0&&u.mind<gameRuleCost(b,u,card)+25)continue;
      const danger=b.units[b.intent.target];
      const preview={...u,pos:goal};
      const targetTile=card.target==='tile'?gameChooseTile(b,card,preview):null;
      const targets=card.target==='tile'?(targetTile==null?[]:[enemy]):card.role==='guard'?[u]:gameAllowedTargets(b,preview,card);
      if(!targets.length)continue;
      if(card.role==='guard'&&(!b.intent.reachable||danger===u||!gameReach(b,card,{...u,pos:goal},danger)||Object.values(b.plans).some(gameHasClash)))continue;
      if(card.role==='counter'&&(danger!==u||!gameReach(b,b.intent.card,enemy,{...u,pos:goal})||
        !gameReach(b,card,{...u,pos:goal},enemy)||Object.values(b.plans).some(gameHasClash)))continue;
      const clash=allowClash&&b.intent.reachable&&(danger.id!==u.id||gameReach(b,b.intent.card,enemy,{...u,pos:goal}))&&!['assist','guard','counter'].includes(card.role)&&card.clash&&gameReach(b,card,{...u,pos:goal},enemy)&&!Object.values(b.plans).some(gameHasClash);
      if(crisis&&!clash)continue;
      const score=(clash?10:0)+(['guard','counter'].includes(card.role)?6:card.target==='self'?1:4)+cardHitPowers(card).reduce((sum,power)=>sum+Number(power.match(/\+(\d+)$/)?.[1]||0),0)*.4-path.length*.25;
      open.push({score,card:id,copyId,pos:goal,vow,targetTile,targets:card.role==='guard'?[]:[targets[0].id],clash});
    }
  }
  const best=open.sort((a,c)=>c.score-a.score)[0];
  if(best)return gameSelect(b,u,best,true);
  const goal=[...paths.keys()].sort((a,c)=>gridDistance(a,enemy.pos)-gridDistance(c,enemy.pos))[0];
  return gameSelect(b,u,{pos:goal,vow},true);
}

function gameBotTurn(b,u){
  if(!gameActionLimit(u))return gameSelect(b,u,{pos:u.pos,vow:u.crisisVow||'face'},true);
  const first=gameBotPlan(b,u);
  if(!first.card||gameActionLimit(u)===1||u.zero==='crisis'||u.collapsed)return first;
  const cards=[first],hand=[...u.hand];
  hand.splice(hand.indexOf(first.card),1);
  // Additional cards use the same position and the first card's clash choice.
  for(let slot=1;slot<gameActionLimit(u)&&hand.length;slot++){
    const extra=gameBotPlan(b,{...u,pos:first.pos,move:0,hand},false);
    if(!extra.card)break;
    cards.push(extra);
    hand.splice(hand.indexOf(extra.card),1);
  }
  return gameSelectTurn(b,u,{pos:first.pos,cards},true);
}

const gameCardMatches=(card,id)=>card?.id===id||card?.shareOrigin===id;
const gameGroupUnits=({primary,secondary})=>primary?[primary,...secondary]:secondary;
function gameTileGroups(b,card,actor,tile){
  return gridTileGroups(card,actor,tile,Object.values(b.units),b.walls);
}
function gameChooseTile(b,card,actor){
  return Array.from({length:gridSize},(_,index)=>index)
    .map(tile=>({tile,score:gameGroupUnits(gameTileGroups(b,card,actor,tile)).length}))
    .filter(candidate=>candidate.score)
    .sort((a,c)=>c.score-a.score||gridDistance(a.tile,b.units.enemy.pos)-gridDistance(c.tile,b.units.enemy.pos))[0]?.tile??null;
}
function gameActionGroups(b,ctx){
  if(ctx.card?.target==='tile')return gameTileGroups(b,ctx.card,ctx.actor,ctx.targetTile);
  const primary=ctx.targets?.[0]||null;
  if(!ctx.card)return {primary,secondary:[]};
  const secondary=ctx.card.splash?gridSplashTargets(ctx.card,ctx.actor,ctx.splashOrigin||primary,Object.values(b.units)):ctx.targets?.slice(1)||[];
  return {primary,secondary};
}
function gameEffectCondition(b,ctx,u,e,target,when){
  const n=e.thresholdExpr?bounded(Math.trunc(gameFlowValue(b,ctx,u,e.thresholdExpr)),0,maxDiceTotal):e.threshold,other=u===ctx.actor?target:ctx.actor;
  if(Object.hasOwn(diceConditions,e.condition)){
    const rolls=e.hitIndex?[ctx.diceRolls?.[e.hitIndex-1]]:ctx.diceRolls;
    if(!rolls?.some(Number.isInteger))return false;
    const total=rolls.reduce((sum,value)=>sum+(value??0),0);
    if(e.condition==='diceEqual')return total===n;
    if(e.condition==='diceAtLeast')return total>=n;
    return total<=n;
  }
  switch(e.condition){
    case 'cardUsed': return gameCardMatches(ctx.actionCard||ctx.card,e.conditionCardId);
    case 'primaryTarget':
    case 'secondaryTarget': {
      const groups=ctx.actionGroups||gameActionGroups(b,ctx);
      const subject=u===ctx.actor?target:u;
      return e.condition==='primaryTarget'?!!subject&&subject===groups.primary:groups.secondary.includes(subject);
    }
    case 'bossTarget': return gameBoss(u===ctx.actor?target:u);
    case 'bossPresent': return Object.values(b.units).some(unit=>unit.enemy!==ctx.actor.enemy&&gameAlive(unit)&&gameBoss(unit));
    case 'criticalHit': return when==='end'?!!ctx.anyCritical:!!ctx.critical;
    case 'criticalStacks': return (u.critStacks||0)>=n;
    case 'criticalSpent': return (ctx.critSpent||0)>=n;
    case 'temptationAtLeast': return (u.temptation||0)>=n;
    case 'awakeningAtLeast': return !!u.awakening;
    case 'collapseCrisis': return u.zero==='crisis';
    case 'healthPaid': return ctx.paidHealth>0;
    case 'mindPaid': return ctx.paidMind>0;
    case 'bothPaid': return ctx.paidHealth>0&&ctx.paidMind>0;
    case 'discardPaid': return ctx.discarded>0;
    case 'discardCount': return ctx.discarded>=n;
    case 'targeted': return b.intent.target===u.id;
    case 'notTargeted': return b.intent.target!==u.id;
    case 'clashMargin': return ctx.clashDifference>=n;
    case 'clashDeficit': return ctx.clashDifference<=-n;
    case 'stack': return (u.stacks[e.conditionStackTag||e.tag]||0)>=n;
    case 'lowHp': return u.hp*100<=u.maxHp*n;
    case 'highHp': return u.hp*100>=u.maxHp*n;
    case 'lowMind': return u.mind<=n;
    case 'highMind': return u.mind>=n;
    case 'moved': return ctx.moved>=n;
    case 'noMove': return !ctx.moved;
    case 'allyHit': return b.allyHit;
    case 'round': return b.round>=n;
    case 'handLow': return u.hand.length<=n;
    case 'graveHigh': return u.grave.length>=n;
    case 'brokeShield': return ctx.brokeShield;
    case 'hasDebt': return u.damageDebt?.length>0;
    case 'clashStreak': return (u.clashStreak||0)>=n;
    case 'queuedStrike': return u.delayedStrike?.length>0;
    case 'priorOverload': return u.lastCardRound===b.round-1&&u.lastCardRole==='overload';
    case 'priorGuard': return u.lastCardRound===b.round-1&&u.lastCardRole==='guard';
    case 'graveLow': return u.grave.length<=n;
    case 'poisoned': return gamePoisonAmount(u)>0;
    case 'foeDown': return target&&target.enemy!==ctx.actor.enemy&&!gameAlive(target);
    case 'near': return other&&u!==other&&gameDistance(u,other)<=n;
    case 'far': return other&&u!==other&&gameDistance(u,other)>=n;
    case 'shielded': return u.shield>0;
    case 'unshielded': return !u.shield;
    default: return true;
  }
}
function gameEffectRecipients(b,actor,to){
  const living=Object.values(b.units).filter(gameAlive);
  const allies=living.filter(u=>u!==actor&&u.enemy===actor.enemy);
  const enemies=living.filter(u=>u.enemy!==actor.enemy);
  const distance=u=>gameDistance(u,actor);
  const hpRatio=u=>u.hp/u.maxHp;
  const best=(units,score)=>units.sort((a,c)=>score(a)-score(c)||distance(a)-distance(c)||a.pos-c.pos).slice(0,1);
  switch(to){
    case 'allAllies': return allies;
    case 'party': return living.filter(u=>u.enemy===actor.enemy);
    case 'allEnemies': return enemies;
    case 'allBosses': return enemies.filter(gameBoss);
    case 'nearestBoss': return best(enemies.filter(gameBoss),distance);
    case 'lowestHpBoss': return best(enemies.filter(gameBoss),u=>u.hp);
    case 'allOthers': return living.filter(u=>u!==actor);
    case 'everyone': return living;
    case 'nearestAlly': return best(allies,distance);
    case 'farthestAlly': return best(allies,u=>-distance(u));
    case 'nearestEnemy': return best(enemies,distance);
    case 'farthestEnemy': return best(enemies,u=>-distance(u));
    case 'woundedAlly': return best(allies.filter(u=>u.hp<u.maxHp),hpRatio);
    case 'highestAlly': return best(allies,u=>-hpRatio(u));
    case 'lowestEnemy': return best(enemies,hpRatio);
    case 'highestEnemy': return best(enemies,u=>-hpRatio(u));
    case 'lowMindAlly': return best(allies,u=>u.mind);
    case 'highMindAlly': return best(allies,u=>-u.mind);
    default: return [];
  }
}
function gameStackRuns(unit,tag){
  const count=unit.stacks[tag]||0;
  return unit.stackRuns?.[tag]??(count?[{count,power:1}]:[]);
}
function gameSplitStacks(runs,count){
  const taken=[],remaining=[];
  for(const run of runs){
    if(!run.count){remaining.push(run);continue;}
    const portion=Math.min(count,run.count);
    if(portion)taken.push({...run,count:portion});
    if(portion<run.count)remaining.push({...run,count:run.count-portion});
    count-=portion;
  }
  return {taken,remaining};
}
function gameWriteStacks(unit,tag,runs){
  unit.stacks[tag]=runs.reduce((total,run)=>total+run.count,0);
  if(!runs.length&&unit.stackTraits)delete unit.stackTraits[tag];
  if(!runs.length||runs.every(run=>run.count>0&&run.power===1&&!run.dealer)){
    if(unit.stackRuns)delete unit.stackRuns[tag];
    return;
  }
  const merged=[];
  for(const run of runs){
    const previous=merged.at(-1);
    if(previous?.power===run.power&&previous.dealer===run.dealer)previous.count+=run.count;
    else merged.push({...run});
  }
  (unit.stackRuns??={})[tag]=merged;
}

function gameSetStackAxes(unit,tag,count,power,dealer){
  if(!count){
    gameWriteStacks(unit,tag,power?[{count:0,power,dealer}]:[]);
    return;
  }
  const base=Math.floor(power/count), extra=power%count;
  gameWriteStacks(unit,tag,[
    ...(extra?[{count:extra,power:base+1,dealer}]:[]),
    ...(count>extra?[{count:count-extra,power:base,dealer}]:[])
  ]);
}
function gameSpendStackAxes(unit,tag,count,power){
  const beforeCount=unit.stacks[tag]||0,beforePower=stackPotency(unit,tag);
  const used=Math.min(beforeCount,count||0),potency=Math.min(beforePower,power||0);
  if(used||potency)gameSetStackAxes(unit,tag,beforeCount-used,beforePower-potency,gameStackRuns(unit,tag)[0]?.dealer);
  return {used,potency};
}
function gameTakeStacks(unit,tag,count){
  const {taken,remaining}=gameSplitStacks(gameStackRuns(unit,tag),count);
  if(taken.length)gameWriteStacks(unit,tag,remaining);
  return taken.reduce((total,run)=>total+run.count*run.power,0);
}
function gameGrantStacks(b,unit,effect,amount,trait,sourceRuns,dealer){
  const tag=effect.tag;
  const independent=effect.stackAxes;
  const definitions=[trait,unit.stackTraits?.[tag],unit.stackDefinitions?.[tag]];
  const cap=Math.min(effect.stackCap??maxStatusStacks,(!basicStacks[tag]?.sub?basicStacks[tag]?.cap:trait?.cap)??maxStatusStacks,
    ...definitions.map(entry=>Math.min(entry?.cap??maxStatusStacks,entry?.holdCount??maxStatusStacks)));
  const holdPower=Math.min(...definitions.map(entry=>entry?.holdPower??Infinity));
  const room=Math.max(0,cap-(unit.stacks[tag]||0));
  const ledger=unit.stackAcquisitions?.[tag];
  const usage=ledger?.round===b.round?ledger:{round:b.round,turnCount:0,turnPower:0,
    battleCount:ledger?.battleCount||0,battlePower:ledger?.battlePower||0};
  const policies=[effect,...definitions.map(entry=>entry?.gainLimits)];
  const oldPower=stackPotency(unit,tag),oldCount=unit.stacks[tag]||0;
  const axesMode=definitions.find(entry=>entry?.stackAxesMode)?.stackAxesMode||'both';
  const requestedCount=independent?(axesMode==='power'?0:effect.axisCount??(effect.axisPower&&!oldCount?1:0)):amount;
  let countBudget=Math.min(requestedCount,room),powerBudget=holdPower-oldPower;
  for(const [key,[,metric,period]] of Object.entries(stackGainLimits)){
    const bound=Math.min(...policies.map(policy=>policy?.[key]??Infinity));
    const used=period==='gain'?0:usage[period+(metric==='count'?'Count':'Power')];
    if(metric==='count')countBudget=Math.min(countBudget,bound-used);
    else powerBudget=Math.min(powerBudget,bound-used);
  }
  if(independent){
    const count=Math.max(0,countBudget), power=axesMode==='count'?0:Math.max(0,Math.min(powerBudget,effect.axisPower??(count&&!oldPower?1:0)));
    if(!count&&!power||axesMode!=='power'&&!oldCount&&!count)return 0;
    const ward=unit.stackWard?.[tag]||0;
    if(ward>0){unit.stackWard[tag]=ward-1;return 0;}
    if(trait&&!unit.stackTraits?.[tag])(unit.stackTraits??={})[tag]=trait;
    gameSetStackAxes(unit,tag,oldCount+count,oldPower+power,gameStackRuns(unit,tag)[0]?.dealer||dealer);
    (unit.stackCaps??={})[tag]=cap;
    (unit.stackAcquisitions??={})[tag]={round:b.round,turnCount:usage.turnCount+count,turnPower:usage.turnPower+power,
      battleCount:usage.battleCount+count,battlePower:usage.battlePower+power};
    return count||power;
  }
  if(countBudget<=0||powerBudget<=0)return 0;
  const runs=sourceRuns?gameSplitStacks(sourceRuns,countBudget).taken:[{count:countBudget,power:1}];
  const eligible=[];
  for(const run of runs){
    const power=Math.min(effect.stackPower??run.power,effect.stackPowerCap??maxStackPotency);
    const count=power===0?run.count:Math.min(run.count,Math.floor(powerBudget/power));
    if(count)eligible.push({count,power,...(run.dealer||dealer?{dealer:run.dealer||dealer}:{})});
    powerBudget-=count*power;
    if(count<run.count)break;
  }
  const gained=eligible.reduce((sum,run)=>sum+run.count,0);
  if(!gained)return 0;
  const blocked=Math.min(unit.stackWard?.[tag]||0,gained);
  if(blocked){
    unit.stackWard[tag]-=blocked;
    if(!unit.stackWard[tag])delete unit.stackWard[tag];
    gameLog(b,unit.name+' · '+tag+' '+blocked+' 저항');
  }
  const count=gained-blocked;
  if(!count)return 0;
  const added=gameSplitStacks(eligible,count).taken;
  const power=added.reduce((sum,run)=>sum+run.count*run.power,0);
  (unit.stackAcquisitions??={})[tag]={round:b.round,turnCount:usage.turnCount+count,turnPower:usage.turnPower+power,
    battleCount:usage.battleCount+count,battlePower:usage.battlePower+power};
  if(trait&&!unit.stackTraits?.[tag])(unit.stackTraits??={})[tag]=trait;
  gameWriteStacks(unit,tag,[...gameStackRuns(unit,tag),...added]);
  (unit.stackCaps??={})[tag]=cap;
  return count;
}
function gameBasicStackDamage(b,unit,when){
  const labels={physical:'물리 피해',mental:'정신 피해',fixed:'고정 피해',
    piercing:'방어막 관통 피해',piercingFixed:'방어막 관통 고정 피해'};
  for(const [name,stack] of Object.entries(basicStacks)){
    if(stack.when!==when||!gameAlive(unit)||!unit.stacks[name]||stack.damage==='mental'&&(unit.enemy||unit.collapsed))continue;
    const amount=stackPotency(unit,name);
    gameLog(b,unit.name+' · '+name+' '+amount+' '+labels[stack.damage]);
    const sources=gameStackRuns(unit,name).map(run=>({dealer:run.dealer,amount:run.count*run.power}));
    const origin={kind:'stack',ongoing:when==='turnEnd',sources};
    if(stack.damage==='mental')gameMentalDamage(b,unit,amount,unit,origin);
    else {
      const pierce=stack.damage==='piercing'||stack.damage==='piercingFixed';
      const fixed=stack.damage==='fixed'||stack.damage==='piercingFixed';
      gameDamage(b,unit,amount,unit,pierce,false,fixed,origin);
    }
  }
}
function gameHealthBase(unit,basis){
  if(basis==='current')return unit.hp;
  if(basis==='missing')return unit.maxHp-unit.hp;
  return unit.maxHp;
}
const gamePoisonAmount=unit=>(unit.poison||0)+(unit.damageOverTime||[]).reduce((sum,dot)=>sum+dot.amount,0);
function gameRemoveLegacyPoison(unit,amount){
  const removed=Math.min(unit.poison||0,amount);
  let remaining=removed;
  const attributed=(unit.poisonSources||[]).reduce((sum,entry)=>sum+entry.amount,0);
  remaining-=Math.min(remaining,(unit.poison||0)-attributed);
  unit.poison=(unit.poison||0)-removed;
  for(const entry of unit.poisonSources||[]){
    const taken=Math.min(remaining,entry.amount);
    entry.amount-=taken;
    remaining-=taken;
  }
  if(unit.poisonSources)unit.poisonSources=unit.poisonSources.filter(entry=>entry.amount);
  return removed;
}
function gameRemovePoison(unit,amount){
  const legacy=gameRemoveLegacyPoison(unit,amount);
  let removed=legacy;
  for(const dot of unit.damageOverTime||[]){
    const consumed=Math.min(dot.amount,amount-removed);
    dot.amount-=consumed;
    removed+=consumed;
  }
  if(unit.damageOverTime)unit.damageOverTime=unit.damageOverTime.filter(dot=>dot.amount);
  return removed;
}
function gameEffectBasis(ctx,unit,basis,effect){
  if(effect&&Object.hasOwn(stackRatioBases,basis)){
    const subject=basis.startsWith('own')?ctx.actor:unit;
    const tag=effect.ratioStackTag||effect.tag;
    const current=effect.ratioPower?stackPotency(subject,tag):subject.stacks[tag]||0;
    if(effect.ratioPower){
      const cap=subject.stackTraits?.[tag]?.holdPower??subject.stackDefinitions?.[tag]?.holdPower??conceptStacks[tag]?.holdPower??maxStackPotency;
      return /Current$/.test(basis)?current:/Missing$/.test(basis)?Math.max(0,cap-current):cap;
    }
    const cap=Math.min(effect.stackCap??subject.stackCaps?.[tag]??maxStatusStacks,
      (!basicStacks[tag]?.sub?basicStacks[tag]?.cap:subject.stackDefinitions?.[tag]?undefined:basicStacks[tag]?.cap)??maxStatusStacks,subject.stackTraits?.[tag]?.cap??conceptStacks[tag]?.cap??maxStatusStacks,
      subject.stackTraits?.[tag]?.holdCount??maxStatusStacks,subject.stackDefinitions?.[tag]?.holdCount??maxStatusStacks);
    return /Current$/.test(basis)?current:/Missing$/.test(basis)?Math.max(0,cap-current):cap;
  }
  const mind=subject=>subject.enemy?0:subject.mind??0;
  const action=ctx.actionCard||ctx.card;
  switch(basis){
    case 'hpMax': return unit.maxHp;
    case 'hpCurrent': return unit.hp;
    case 'hpLost': return unit.maxHp-unit.hp;
    case 'ownHpMax': return ctx.actor.maxHp;
    case 'ownHpCurrent': return ctx.actor.hp;
    case 'ownHpLost': return ctx.actor.maxHp-ctx.actor.hp;
    case 'mindCurrent': return mind(unit);
    case 'mindMax': return unit.enemy?0:100;
    case 'mindLost': return unit.enemy?0:100-mind(unit);
    case 'ownMind': return mind(ctx.actor);
    case 'shield': return unit.shield;
    case 'damageDealt': return ctx.base??0;
    case 'totalDamage': return ctx.totalDamage??0;
    case 'cardTotal': return (ctx.hitRolls??ctx.rawHitRolls??[]).reduce((sum,roll)=>sum+roll,0);
    case 'cardMin':
    case 'cardMax': return action?.power?cardHitPowers(action).reduce((sum,formula)=>{
      const {count,sides,bonus}=parsePower(formula);
      return sum+Math.max(0,bonus+count*(basis==='cardMax'?sides:1));
    },0):0;
    default: return 0;
  }
}
function gameRatioAmount(ctx,effect,unit,amount){
  if(effect.amountMode!=='percent')return amount;
  if(effect.ratioBasis)return Math.trunc(gameEffectBasis(ctx,unit,effect.ratioBasis,effect)*amount/100);
  switch(effect.kind){
    case 'outgoingDamage':
    case 'incomingDamage':
      unit[effect.kind+'Percent']=(unit[effect.kind+'Percent']||0)+amount;
      return 0;
    case 'damageDebt':
    case 'doubleEdge':
    case 'bossOutgoingDamage':
    case 'bossIncomingDamage':
    case 'lastStand':
    case 'mindCost': return amount;
    case 'power':
      ctx.powerPercent=(ctx.powerPercent||0)+amount;
      return 0;
    case 'focus':
    case 'weaken':
      unit.nextPowerPercent=(unit.nextPowerPercent||0)+amount*ratioEffects[effect.kind][1];
      return 0;
    case 'stripShield':
    case 'stealShield':
    case 'spareShield': return Math.floor(unit.shield*amount/100);
    case 'shieldGift': return Math.floor(ctx.actor.shield*amount/100);
    case 'critSpend':
    case 'critRemove': return Math.floor((unit.critStacks||0)*amount/100);
    case 'detonatePoison': return Math.floor(gamePoisonAmount(unit)*amount/100);
    case 'graveToShield': return Math.floor(unit.grave.length*amount/100);
    case 'debtShield':
    case 'eraseDebt': return Math.floor((unit.damageDebt||[]).reduce((total,entry)=>total+entry.amount,0)*amount/100);
    case 'rallyHeal':
    case 'lifeSteal':
    case 'shieldConversion':
    case 'rallyShield': return amount;
    case 'mind':
    case 'drain': return amount; // The maximum is 100.
    default: return Math.floor(gameHealthBase(unit,effect.healthBasis)*amount/100);
  }
}
function gamePayScaleCost(b,ctx,effect,sourceEffect=effect){
  if(ctx.scalePayments.has(sourceEffect))return ctx.scalePayments.get(sourceEffect);
  const actor=ctx.actor;
  const {amount,mode,healthBasis}=effect.scaleCost;
  const resource=effect.scaleDiscard?'discard':effect.scaleResource;
  const base=resource==='discard'?actor.hand.length:resource==='health'?gameHealthBase(actor,healthBasis):100;
  const cost=mode==='percent'?Math.floor(base*amount/100):amount;
  let paid=0;
  if(gameAlive(actor)&&cost>0){
    if(resource==='discard'&&actor.hand.length>=cost){
      gamePlaceCards(b,actor,'grave',gameSpliceHand(actor,0,cost));
      ctx.discarded+=cost;
      paid=cost;
    }else if(resource==='health'&&actor.hp>cost){
      actor.hp-=cost;
      ctx.paidHealth+=cost;
      paid=cost;
    }else if(resource==='mind'&&!actor.enemy&&actor.mind>=cost){
      gameMental(b,actor,-cost,true);
      ctx.paidMind+=cost;
      paid=cost;
    }
  }
  const label=resource==='discard'?'손패':resource==='health'?'체력':'정신력';
  gameLog(b,actor.name+' · '+label+(paid?' '+paid+' 소비':' 대가 미지불'));
  ctx.scalePayments.set(sourceEffect,paid);
  return paid;
}
function gameConsumeGroup(b,ctx,effect,target){
  const actor=ctx.actor, stacks=u=>u.stacks[effect.tag]||0;
  const distance=u=>gameDistance(u,actor);
  const scores={lowestHp:u=>u.hp,highestHp:u=>-u.hp,mostStacks:u=>-stacks(u),leastStacks:stacks,nearest:distance,farthest:u=>-distance(u)};
  const score=scores[effect.consumePriority||'lowestHp'];
  return gameEffectRecipients(b,actor,'allEnemies')
    .filter(unit=>stacks(unit)>0&&gameEffectCondition(b,ctx,unit,effect,target,effect.when))
    .sort((a,c)=>score(a)-score(c)||distance(a)-distance(c)||a.pos-c.pos);
}
function gameFlowValue(b,ctx,unit,node,hitIndex=ctx.hitIndex||0){
  if(node.type==='number')return node.value;
  if(node.type==='percent')return node.value/100;
  if(node.type==='stat'){
    const actor=ctx.actor;
    switch(node.stat){
      case 'selfHp': return actor.hp;
      case 'selfMaxHp': return actor.maxHp;
      case 'selfLostHp': return actor.maxHp-actor.hp;
      case 'selfMind': return actor.mind??0;
      case 'selfShield': return actor.shield;
      case 'selfHand': return actor.hand.length;
      case 'targetHp': return unit?.hp??0;
      case 'targetMaxHp': return unit?.maxHp??0;
      case 'targetLostHp': return unit?unit.maxHp-unit.hp:0;
      case 'targetMind': return unit?.mind??0;
      case 'targetShield': return unit?.shield??0;
      case 'targetHand': return unit?.hand.length??0;
      case 'round': return b.round;
      case 'moved': return ctx.moved??0;
      case 'rank': return hitIndex;
      case 'rolled': return hitIndex?ctx.diceRolls?.[hitIndex-1]??0:(ctx.diceRolls||[]).reduce((sum,roll)=>sum+(roll??0),0);
      case 'dealt': return ctx.base??0;
      case 'discarded': return ctx.discarded??0;
      case 'paidHealth': return ctx.paidHealth??0;
      case 'paidMind': return ctx.paidMind??0;
      default: return gameEffectBasis(ctx,unit||actor,node.stat);
    }
  }
  const [first,...rest]=flowMathTerms(node);
  return rest.reduce((result,term)=>{
    const value=gameFlowValue(b,ctx,unit,term,hitIndex);
    switch(node.op){
      case 'add': return result+value;
      case 'subtract': return result-value;
      case 'multiply': return result*value;
      case 'divide': return value===0?0:result/value;
      case 'min': return Math.min(result,value);
      case 'max': return Math.max(result,value);
    }
  },gameFlowValue(b,ctx,unit,first,hitIndex));
}
const gameKeywordMode=effect=>stackGrantEffects.includes(effect.kind)?'grant':effect.kind==='consume'?'consume':effect.kind==='remove'?'remove':'other';
function gameRecordKeywordUse(b,ctx){
  if(ctx.keywordRecorded||ctx.card.passive)return;
  ctx.keywordRecorded=true;
  const tags=new Set();
  for(const effect of ctx.card.effects){
    if(effect.gmOnly||!effect.tag)continue;
    const mode=gameKeywordMode(effect);
    tags.add('any:'+effect.tag);
    tags.add(mode+':'+effect.tag);
  }
  if(!tags.size)return;
  const history=ctx.actor.keywordUses??={};
  for(const tag of tags){
    const record=history['keyword:'+tag]??={total:0,round:0,count:0};
    record.total++;
    if(record.round!==b.round){
      record.previous=record.round===b.round-1?record.count:0;
      record.round=b.round;
      record.count=0;
    }
    record.count++;
  }
}
function gameKeywordUses(unit,test,round){
  const record=unit.keywordUses?.['keyword:'+(test.mode||'any')+':'+test.tag];
  if(!record)return 0;
  if(test.period==='battle')return record.total;
  if(test.period==='previous')return record.round===round?record.previous||0:record.round===round-1?record.count:0;
  return record.round===round?record.count:0;
}
function gameKeywordOwned(b,unit,test){
  const foeDeck=unit.enemy?(b.foeDecks?.[unit.id]||(unit.id==='enemy'?b.foeDeck:null)):null;
  const foeCards=gameIsBright(b)?brightCards:gameIsJudge(b)?judgeCards:gameIsCollector(b)?collectorCards:gameIsRail(b)?railCards:firstStopCards;
  const zones=test.zone==='all'?['hand','deck','grave','exile']:
    test.zone==='active'?['hand','deck','grave']:test.zone==='configured'?['configuredDeck']:[test.zone];
  return zones.flatMap(zone=>foeDeck&&['deck','configuredDeck'].includes(zone)?foeDeck.cards:unit[zone]||[]).filter(id=>{
    const card=unit.library[id]||(foeDeck?foeCards[id]:null);
    return card&&!card.gmOnly&&card.effects.some(effect=>!effect.gmOnly&&effect.tag===test.tag&&
      (test.mode==='any'||gameKeywordMode(effect)===test.mode));
  }).length;
}
function gameScanCandidates(b,ctx,test){
  const names=test.names?.split(', ');
  const targets=new Set(ctx.targets?.map(unit=>unit.id)||[]);
  const match=unit=>{
    const ally=unit.enemy===ctx.actor.enemy&&!unit.brainwashed;
    switch(test.scope){
      case 'allies':return ally&&unit.id!==ctx.actor.id;
      case 'party':return ally;
      case 'enemies':return !ally;
      case 'targets':return targets.has(unit.id);
      case 'named':return names.includes(unit.name.trim().normalize('NFKC'));
      default:return true;
    }
  };
  return Object.values(b.units).filter(unit=>gameAlive(unit)&&match(unit));
}
function gameKeywordHolders(b,ctx,test){
  return test?gameScanCandidates(b,ctx,test).filter(unit=>gameKeywordOwned(b,unit,test)>=test.minimum):[];
}
function gameStackScan(b,ctx,test){
  const count=gameScanCandidates(b,ctx,test).filter(unit=>
    (test.condition.startsWith('keywordOwned')?gameKeywordOwned(b,unit,test):test.condition==='keywordScan'?gameKeywordUses(unit,test,b.round):test.metric==='power'?stackPotency(unit,test.tag):unit.stacks[test.tag]||0)>=test.minimum).length;
  if(test.condition==='keywordOwned')return count>0;
  const threshold=test.thresholdExpr?Math.trunc(gameFlowValue(b,ctx,ctx.actor,test.thresholdExpr)):test.threshold;
  switch(test.op){
    case 'gt':return count>threshold;
    case 'lt':return count<threshold;
    case 'lte':return count<=threshold;
    case 'eq':return count===threshold;
    case 'ne':return count!==threshold;
    default:return count>=threshold;
  }
}
function gameFlowTestValue(b,ctx,target,test,effect){
  if(test.type==='condition'&&['stackScan','keywordScan','keywordOwned','keywordOwnedCount'].includes(test.condition))return gameStackScan(b,ctx,test);
  if(test.type==='hitResult')return !!ctx.hitResult&&ctx.hitResult.target===target&&ctx.hitResult[test.result]===true;
  if(test.type==='condition'){
    const subject=test.subject==='self'?ctx.actor:target;
    return !!subject&&!!gameEffectCondition(b,ctx,subject,{...test,hitIndex:effect.hitIndex},target,effect.when);
  }
  if(test.type==='not')return !gameFlowTestValue(b,ctx,target,test.test,effect);
  if(test.type==='gate'){
    const evaluate=input=>gameFlowTestValue(b,ctx,target,input,effect);
    switch(test.gate){
      case 'and': return test.inputs.every(evaluate);
      case 'or': return test.inputs.some(evaluate);
      case 'nand': return !test.inputs.every(evaluate);
      case 'nor': return !test.inputs.some(evaluate);
      case 'xor':
      case 'xnor': {
        const odd=test.inputs.reduce((count,input)=>count+Number(evaluate(input)),0)%2===1;
        return test.gate==='xor'?odd:!odd;
      }
    }
  }
  if(test.type==='and')return gameFlowTestValue(b,ctx,target,test.left,effect)&&gameFlowTestValue(b,ctx,target,test.right,effect);
  if(test.type==='or')return gameFlowTestValue(b,ctx,target,test.left,effect)||gameFlowTestValue(b,ctx,target,test.right,effect);
  const a=gameFlowValue(b,ctx,target,test.left,effect.hitIndex), c=gameFlowValue(b,ctx,target,test.right,effect.hitIndex);
  switch(test.op){
    case 'lt': return a<c;
    case 'lte': return a<=c;
    case 'eq': return a===c;
    case 'gte': return a>=c;
    case 'gt': return a>c;
    case 'ne': return a!==c;
  }
}
// The flat saved rows retain their IDs and references. Rebuild the connected stacks at the event boundary.
function* gameRunBlocks(b,ctx,target,entries){
  if(!entries.some(effect=>effect.flow?.length)){yield* entries;return;}
  const root={nodes:[],children:new Map()};
  for(const effect of entries){
    let parent=root;
    for(const step of effect.flow||[]){
      const key=effect.when+':'+(effect.hitIndex||0)+':'+step.id;
      let node=parent.children.get(key);
      if(!node){
        node={step,effect,then:{nodes:[],children:new Map()},else:{nodes:[],children:new Map()}};
        parent.children.set(key,node);
        parent.nodes.push(node);
      }
      parent=node[step.branch||'then'];
    }
    parent.nodes.push({effect});
  }
  function* run(stack,iterations=''){
    for(const node of stack.nodes){
      const {step,effect}=node;
      if(!step){
        if(!iterations){yield effect;continue;}
        const slots=ctx.flowIterations??=new Map();
        const key=ctx.card.effects.indexOf(effect)+iterations;
        if(!slots.has(key))slots.set(key,{...effect,flowSource:effect});
        yield slots.get(key);
      }else if(step.kind==='if'){
        yield* run(gameFlowTestValue(b,ctx,target,step.test,effect)?node.then:node.else,iterations);
      }else{
        const count=step.countExpr?bounded(Math.trunc(gameFlowValue(b,ctx,target,step.countExpr)),0,maxFlowRepeat):step.count;
        for(let i=0;i<count;i++)yield* run(node.then,iterations+'/'+i);
      }
    }
  }
  yield* run(root);
}
function gameTriggerHit(b,ctx,target,hitIndex=0,landed=true){
  const previous=ctx.hitResult;
  ctx.hitResult=landed?{
    target,critical:!!ctx.critical,noncritical:!ctx.critical,damage:ctx.base>0,shieldBreak:!!ctx.brokeShield,wall:false
  }:null;
  try{
    gameTriggers(b,ctx,'hit',target,0,hitIndex);
  }finally{
    ctx.hitResult=previous;
  }
}
function gameZoneMatches(ctx,effect){
  const {unit,card}=ctx.zoneEvent;
  const {actor,card:source}=ctx;
  const owner=effect.zoneOwner||'self';
  if(owner==='named'&&unit.name!==effect.zoneOwnerName||
    owner==='self'&&unit!==actor||
    owner==='other'&&unit===actor||
    owner==='ally'&&(unit===actor||unit.enemy!==actor.enemy)||
    owner==='party'&&unit.enemy!==actor.enemy||
    owner==='enemy'&&unit.enemy===actor.enemy)return false;
  const match=effect.zoneCard||(source.passive?'any':'same');
  const same=card.id===source.id;
  if(match==='same')return same;
  if(match==='other')return !same;
  if(match==='specific')return gameCardMatches(card,effect.zoneCardId);
  if(match==='named')return card.name===effect.zoneCardName;
  return true;
}
function gameTriggers(b,ctx,when,target,depth=0,hitIndex=0) {
  if(depth>3)return;
  const {actor,card}=ctx;
  const entries=card.effects.filter(effect=>{
    if(effect.kind==='replaceCard'||effect.when!==when&&!(when==='use'&&effect.when==='base'))return false;
    if(ctx.zoneEvent&&cardZoneTimings.includes(when)&&!gameZoneMatches(ctx,effect))return false;
    if(ctx.reactionWindows&&!(ctx.reactionWindows[card.effects.indexOf(effect)]>=b.round))return false;
    if(ctx.reactionRound!=null){
      const duration=effect.numberExprs?.reactionRounds?
        bounded(Math.trunc(gameFlowValue(b,ctx,ctx.actor,effect.numberExprs.reactionRounds)),0,maxStatusRounds):effect.reactionRounds||0;
      if(!duration||ctx.reactionRound+duration<=b.round)return false;
    }
    if(hitIndex)return effect.hitIndex===hitIndex;
    return !effect.hitIndex||(['wall','consume'].includes(when)&&effect.hitIndex===ctx.hitIndex);
  });
  if(when==='use'){
    gameRecordKeywordUse(b,ctx);
    const priority=e=>!e.flow?.length&&(discardCosts.includes(e.kind)||resourceCosts.includes(e.kind))?0:e.when==='base'?1:2;
    entries.sort((a,c)=>priority(a)-priority(c));
  }
  for(const effect of gameRunBlocks(b,ctx,target,entries)){
    if(effect.kind==='consume'&&effect.consumeScope==='total'){
      if(ctx.effectRecipients.has(effect))continue;
      const units=gameConsumeGroup(b,ctx,effect,target);
      if(!units.length)continue;
      const applied=new Set();
      ctx.effectRecipients.set(effect,{units,applied});
      gameApplyEffect(b,ctx,when,target,depth,effect,units[0],applied,units);
      if(!applied.size)ctx.effectRecipients.delete(effect);
      continue;
    }
    if(['primary','secondary'].includes(effect.to)){
      const groups=ctx.actionGroups||gameActionGroups(b,ctx);
      const group=effect.to==='primary'?[groups.primary]:groups.secondary;
      if(['hit','damage','critical','noncritical','attackEnd','wall','consume'].includes(when)){
        if(target&&group.includes(target))gameApplyEffect(b,ctx,when,target,depth,effect,target);
      }else{
        let selection=ctx.effectRecipients.get(effect);
        if(!selection){selection={applied:new Set()};ctx.effectRecipients.set(effect,selection);}
        for(const unit of group){
          if(gameAlive(unit)&&!selection.applied.has(unit.id))gameApplyEffect(b,ctx,when,target,depth,effect,unit,selection.applied);
        }
      }
      continue;
    }
    if(effect.to==='target'||effect.to==='self'){
      const unit=effect.to==='self'?actor:target;
      if(unit)gameApplyEffect(b,ctx,when,target,depth,effect,unit);
      continue;
    }
    let selection=ctx.effectRecipients.get(effect);
    if(!selection){
      selection={units:effect.to==='keywordHolders'?gameKeywordHolders(b,ctx,effect.recipientKeyword):gameEffectRecipients(b,actor,effect.to),applied:new Set()};
      ctx.effectRecipients.set(effect,selection);
    }
    for(const unit of selection.units){
      if(gameAlive(unit)&&!selection.applied.has(unit.id))gameApplyEffect(b,ctx,when,target,depth,effect,unit,selection.applied);
    }
  }
}
function gameUpdateCardMark(b,ctx,unit,amount,effect){
  const clear=effect.kind==='clearCardMark';
  const key=effect;
  const applied=(ctx.cardMarkTargets??=new Map());
  const units=applied.get(key)??new Set();
  // A self effect may be reached through several attack targets. Distinct blocks still stack.
  if(units.has(unit.id))return;
  applied.set(key,units);
  units.add(unit.id);
  const selected=ctx.zoneEvent
    ?unit===ctx.zoneEvent.unit&&ctx.zoneEvent.card.id
    :unit===ctx.actor&&(ctx.actionCard||ctx.card)?.id;
  const ids=selected?[selected]:unit.enemy?[b.intent.card.id]:gamePlannedCards(b.plans[unit.id]).map(plan=>plan.card);
  for(const id of new Set(ids.filter(Boolean))){
    const card=unit.library[id]||(unit.enemy&&b.intent.card.id===id?b.intent.card:null);
    if(!card)continue;
    const marks=unit.cardMarks??={};
    if(clear){
      if(!marks[id])continue;
      delete marks[id];
    }else marks[id]=Math.min(999,(marks[id]||0)+amount);
    gameLog(b,unit.name+' · 「'+card.name+'」 피해 표식 '+(clear?'해제':marks[id]));
  }
}
function gameTriggerCardMark(b,unit,card){
  const amount=unit.cardMarks?.[card.id];
  if(!amount)return;
  delete unit.cardMarks[card.id];
  gameLog(b,unit.name+' · 「'+card.name+'」 피해 표식 발동 '+amount);
  gameDamage(b,unit,amount,unit);
}
function gameTeachCard(actor,recipient,card){
  const pending=[card],visited=new Set();
  for(const shared of pending){
    if(visited.has(shared.id))continue;
    visited.add(shared.id);
    recipient.library[shared.id]??=shared;
    for(const row of shared.effects){
      for(const id of effectCardReferences(row)){
        if(Object.hasOwn(actor.library,id))pending.push(actor.library[id]);
      }
    }
  }
}
function gameApplyEffect(b,ctx,when,target,depth,effect,u,applied,consumeGroup){
  const previous=b.hiddenEffectLog;
  const hidden=effect.gmOnly?effect:ctx.card.gmOnly?ctx.card:null;
  if(!previous&&hidden)b.hiddenEffectLog={hint:hidden.publicHint,reported:false};
  try{
    return gameApplyVisibleEffect(b,ctx,when,target,depth,effect,u,applied,consumeGroup);
  }finally{
    if(!previous)delete b.hiddenEffectLog;
  }
}
function gameTransferDebuff(b,from,to){
  const rounds=(through)=>Math.max(0,through-b.round+1);
  const entries=[
    ...(from.poison?[{type:'poison',amount:from.poison}]:[]),
    ...(from.damageOverTime||[]).map(dot=>({type:'dot',amount:dot.amount,rounds:rounds(dot.through),original:dot})),
    ...Object.entries(from.stacks).filter(([name,count])=>count>0&&(basicStacks[name]?.damage||name==='죄책감'))
      .map(([name,count])=>({type:'stack',name,amount:count})),
    ...(from.nextPower<0?[{type:'power',amount:-from.nextPower}]:[]),
    ...(from.blockedRounds?[{type:'blocked',amount:from.blockedRounds,rounds:from.blockedRounds}]:[]),
    ...(from.rooted?[{type:'root',amount:1,rounds:1}]:[]),
    ...['mindBurn','mindRecoveryCut'].flatMap(name=>{
      const status=from.mindStatuses?.[name];
      return status?[{type:'mindStatus',name,amount:status.amount,rounds:rounds(status.through),original:status}]:[];
    })
  ];
  const selected=entries.sort((a,c)=>c.amount*(c.rounds||1)-a.amount*(a.rounds||1))[0];
  if(!selected)return;
  const amount=Math.floor(selected.amount/2),duration=Math.floor((selected.rounds||0)/2);
  const transfer=from!==to&&amount>0&&(!selected.rounds||duration>0);
  switch(selected.type){
    case 'poison':
      gameRemoveLegacyPoison(from,selected.amount);
      if(transfer)to.poison=Math.min(999,(to.poison||0)+amount);
      break;
    case 'dot':
      from.damageOverTime=from.damageOverTime.filter(dot=>dot!==selected.original);
      if(transfer)(to.damageOverTime??=[]).push({...selected.original,amount,through:b.round+duration-1});
      break;
    case 'stack': {
      const taken=gameStackRuns(from,selected.name);
      if(transfer)gameGrantStacks(b,to,{tag:selected.name},amount,from.stackTraits?.[selected.name],taken);
      gameWriteStacks(from,selected.name,[]);
      break;
    }
    case 'power':
      from.nextPower=0;
      if(transfer)to.nextPower=(to.nextPower||0)-amount;
      break;
    case 'blocked':
      delete from.blockedRounds;
      if(transfer)to.nextBlockedRounds=Math.max(to.nextBlockedRounds||0,duration);
      break;
    case 'root':
      from.rooted=false;
      from.move=Math.max(from.move,2);
      break;
    case 'mindStatus':
      delete from.mindStatuses[selected.name];
      if(transfer)(to.mindStatuses??={})[selected.name]={...selected.original,amount,through:b.round+duration-1};
      break;
  }
  gameLog(b,from.name+' · 상태 이상 해제'+(transfer?' · '+to.name+'이 절반을 떠안음':''));
}
function gameApplyVisibleEffect(b,ctx,when,target,depth,effect,u,applied,consumeGroup){
  const sourceEffect=effect;
  if(effect.numberExprs){
    effect={...effect};
    for(const [key,expr] of Object.entries(effect.numberExprs)){
      const bounds=effectNumberBounds(effect.kind,key,effect.hitIndex,cardHitPowers(ctx.card).length,Object.hasOwn(diceConditions,effect.condition));
      const percentMode={healCap:effect.capMode,mindAmount:effect.mindMode,mindCap:effect.mindCapMode,axisPower:effect.axisPowerMode,axisCount:effect.axisCountMode}[key]==='percent';
      const evaluated=percentMode&&expr.type==='percent'?expr.value:gameFlowValue(b,ctx,u,expr,effect.hitIndex);
      const value=bounded(Math.trunc(evaluated),...bounds);
      if(key==='limitCount'){if(effect.limit)effect.limit={...effect.limit,count:value};}
      else if(key==='scaleCostAmount'){if(effect.scaleCost)effect.scaleCost={...effect.scaleCost,amount:value};}
      else effect[key]=value;
    }
  }
  if(effect.stackAxes){
    effect={...effect};
    for(const key of ['axisPower','axisCount'])if(effect[key]!=null&&effect[key+'Mode']==='percent'){
      const basis=gameEffectBasis(ctx,u,effect[key+'Basis'],{tag:effect.tag,ratioStackTag:effect[key+'Tag'],ratioPower:key==='axisPower'});
      effect[key]=Math.floor(basis*effect[key]/100);
    }
  }
  const {actor,card}=ctx;
  if(b.guestActions&&!ctx.guestReplayed&&!card.passive&&!effect.gmOnly&&['hit','use'].includes(when)&&replayableGuestEffects.has(effect.kind)){
    (ctx.guestEffects??=[]).push({...effect,condition:'',amountExpr:undefined,numberExprs:undefined});
  }
  if(effect.kind.startsWith('rulecard:')){gameRuleCardEffect(b,ctx,u,effect.kind.slice(9));return;}
  if(effect.kind.startsWith('guest:')){gameGuestEffect(b,ctx,u,effect.kind.slice(6));return;}
  if(effect.kind.startsWith('field:')){gameFieldEffect(b,ctx,u,effect.kind.slice(6));return;}
  if(effect.kind.startsWith('defense:')){gameDefenseEffect(b,ctx,u,effect.kind.slice(8));return;}
  if(effect.kind.startsWith('bright:')){gameBrightHit(b,ctx,u,effect.kind.slice(7));return;}
  if(effect.kind==='giveCard'&&(u.enemy||!gameAlive(u)||!actor.library[effect.givenCardId]||u.hand.length>=12))return;
  if(stagedPowerEffects.includes(effect.kind)&&ctx.once.has(sourceEffect))return;
  if(effect.kind==='consume'&&!(u.stacks[effect.tag]>0)&&!((effect.stackAxes||effect.consumeAmount==='all')&&stackPotency(u,effect.tag)>0))return;
  if(effect.kind==='hitLeech'&&!ctx.base)return;
  const singleTotal=effect.ratioBasis==='totalDamage'&&effect.to==='self';
  if(singleTotal&&ctx.totalDamageUsed?.has(sourceEffect))return;
  if(effect.kind==='bossDamage'&&(!gameBoss(u)||u.enemy===actor.enemy))return;
  if(effect.kind==='replayHit'&&(ctx.replayingHit||ctx.hitRepeat))return;
  if(effect.kind==='amplifyHit'&&(!ctx.hitAmplifiers||ctx.replayingHit))return;
  if(!gameEffectCondition(b,ctx,u,effect,target,effect.when))return;
  const limit=effect.limit;
  const key=limit?card.id+':'+card.effects.indexOf(sourceEffect.flowSource||sourceEffect):null;
  const period=limit?.period==='turn'?b.round:0;
  const usage=key?actor.effectUsage?.[key]:null;
  const count=usage?.period===period?usage.count:0;
  // A group activation spends one use while its effect is applied to each eligible recipient.
  const charge=key&&!applied?.size;
  if(charge&&count>=limit.count)return;
  if((['battleStart','turnStart','turnEnd','attackEnd','unopposed','roll'].includes(when)&&effect.to==='self'&&effect.kind!=='hitLeech')||effect.to==='self'&&['extraAction','dodge','trueStrike','stackWard','rerollLow',...bossDamageModifiers].includes(effect.kind)||copyEffects.includes(effect.kind)||discardCosts.includes(effect.kind)||resourceCosts.includes(effect.kind)||teamEffects.includes(effect.kind)||
    effect.to==='self'&&['hearDemon','refuseDemon','shedShell','awakenBody','inscribeMeaning'].includes(effect.kind)||effect.kind==='critSpend'&&effect.to==='self'&&when==='use'||effect.scaleResource&&effect.to==='self'||!['amplifyHit','hitLeech'].includes(effect.kind)&&effect.to==='self'&&(['hit','damage','wall'].includes(when)||when==='consume'&&!['perStack','consumeHeal','shieldPerStack'].includes(effect.kind))){
    if(ctx.once.has(sourceEffect))return;
    ctx.once.add(sourceEffect);
  }
  // Only numerical effects belonging to this hit use the bonuses accumulated earlier in this sequence.
  const amplifier=effect.hitIndex===ctx.hitIndex&&ctx.hitAmplifiers?.get(ctx.hitIndex);
  const amplifiable=effect.kind!=='amplifyHit'&&!unnumberedEffects.includes(effect.kind);
  const raw=effect.amountExpr?Math.trunc(effect.amountMode==='percent'&&effect.amountExpr.type==='percent'?
    effect.amountExpr.value:gameFlowValue(b,ctx,u,effect.amountExpr,effect.hitIndex)):effect.amount;
  const signed=signedEffects.includes(effect.kind)||ratioEffects[effect.kind]?.[1]===0;
  const maximum=effect.kind==='blockAction'?maxStatusRounds:effect.kind==='reduceActions'?maxActions:
    effect.kind==='consume'?maxCollectiveStackConsume:effect.kind==='amplifyHit'?300:effect.amountExpr?999:Infinity;
  const value=bounded(raw,signed?-maximum:0,maximum);
  if(!value)return;
  const magnitude=amplifier&&amplifiable?
    Math.sign(value)*(Math.floor(Math.abs(value)*(100+amplifier.percent)/100)+amplifier.fixed):value;
  const multiplier=effect.scaleCost?gamePayScaleCost(b,ctx,effect,sourceEffect):effect.scaleDiscard?ctx.discarded:
    effect.scaleResource==='health'?ctx.paidHealth:effect.scaleResource==='mind'?ctx.paidMind:1;
  const stackScale=effect.scaleStack==='count'?(actor.stacks[card.name]||0):1;
  const amount=magnitude*multiplier*stackScale,tag=effect.tag;
  if(!amount)return;
  const converted=(effect.kind==='amplifyHit'||stagedPowerEffects.includes(effect.kind)&&!effect.ratioBasis)?amount:gameRatioAmount(ctx,effect,u,amount);
  const n=effect.kind==='healthCost'&&gameHealthBase(u,effect.healthBasis)>0?Math.max(1,converted):converted;
  const ratioModifier=effect.amountMode==='percent'&&!effect.ratioBasis&&['power','focus','weaken','outgoingDamage','incomingDamage'].includes(effect.kind);
  if(!n&&!ratioModifier)return;
  if(charge){
    if(effect.kind==='healthCost'&&(!gameAlive(u)||u.hp<=n))return;
    if(effect.kind==='mindCost'&&(u.enemy||!gameAlive(u)||u.mind<n))return;
    if(discardCosts.includes(effect.kind)&&(!u.hand.length||effect.kind==='discardExactCost'&&u.hand.length<n))return;
    (actor.effectUsage??={})[key]={period,count:count+1};
  }
  if(card.passive&&!ctx.passiveLogged){
    gameLog(b,actor.name+' · '+(card.stackCount?'중첩':'패시브')+' 「'+card.name+'」 발동');
    ctx.passiveLogged=true;
  }
  applied?.add(u.id);
  if(!n)return;
  if(singleTotal)(ctx.totalDamageUsed??=new Set()).add(sourceEffect);
    if(stagedPowerEffects.includes(effect.kind)){
      ctx.once.add(sourceEffect);
      const key=effect.kind+(effect.amountMode==='percent'&&!effect.ratioBasis?'Percent':'');
      ctx[key]=(ctx[key]||0)+n;
      return;
    }
    const origin=card.stackCount?{kind:'stack',ongoing:['turnStart','turnEnd'].includes(when),
      sources:gameStackRuns(actor,card.name).map(run=>({dealer:run.dealer,amount:run.count*run.power}))}:
      {kind:card.passive?'passive':'card'};
    const shieldKey=actor.id+':'+card.id+'#'+card.effects.indexOf(sourceEffect.flowSource||sourceEffect);
    const gainShield=(unit,amount,temporary=false)=>gameGainShield(b,unit,amount,effect,shieldKey,temporary);
    const damage=(amount,piercing=false,fixed=false)=>gameDamage(b,u,amount,actor,piercing,false,fixed,origin);
    if(effect.kind.startsWith('rail:')){
      gameRailEffect(b,ctx,u);
      return;
    }
    if(effect.kind.startsWith('judge:')){
      gameJudgeEffect(b,ctx,u,effect.kind);
      return;
    }
    if(effect.kind.startsWith('collector:')){
      gameCollectorEffect(b,actor,u,effect.kind);
      return;
    }
    switch(effect.kind) {
      case 'shieldConversion':
      case 'lifeSteal': {
        const key=actor.id+':'+card.id+':'+card.effects.indexOf(sourceEffect.flowSource||sourceEffect);
        const through=gameRenewThrough(b.round,u.lifeSteal?.[key]?.through,effect.duration,effect);
        if(through===undefined)break;
        (u.lifeSteal??={})[key]={dealer:u.id,owner:actor.id,damage:effect.leechDamage,
          heal:effect.leechHeal,victim:effect.leechVictim,amount:n,mode:effect.amountMode,
          resource:effect.leechResource,basis:effect.leechBasis,shield:effect.leechShield,recovery:effect.leechRecovery,
          shieldConversion:effect.kind==='shieldConversion',victimName:effect.leechVictimName,
          ...(effect.leechVictim==='selected'?{victimIds:[...new Set([...ctx.targets,target].filter(Boolean).map(unit=>unit.id))]}:{}),
          formula:effect.leechFormula,cap:effect.healCap,capMode:effect.capMode,mindAmount:effect.mindAmount,
          mindMode:effect.mindMode,mindCap:effect.mindCap,mindCapMode:effect.mindCapMode,
          through};
        break;
      }
      case 'replaceCard': ctx.replaced=true; break;
      case 'markCard':
      case 'clearCardMark': gameUpdateCardMark(b,ctx,u,n,effect);break;
      case 'blockAction':
        {
          if(effect.durationPolicy==='ignore'&&(u.blockedRounds||u.nextBlockedRounds))break;
          const remaining=u.nextBlockedRounds??Math.max(0,(u.blockedRounds||0)-1);
          const start=b.round+1;
          const through=gameRenewThrough(start,remaining?start+remaining-1:undefined,n,effect,'longest');
          if(through===undefined)break;
          u.nextBlockedRounds=through-start+1;
          gameLog(b,u.name+' · 다음 '+u.nextBlockedRounds+'라운드 행동 불가');
        }
        break;
      case 'unblockAction':
        if(u.blockedRounds||u.nextBlockedRounds){
          delete u.blockedRounds;delete u.nextBlockedRounds;
          gameLog(b,u.name+' · 행동 불가 해제');
        }
        break;
      case 'clearActionPenalty':
      case 'clearActionBonus':
      case 'purgeDefense':
      case 'purgeOffense':
        for(const key of gameBuffPurges[effect.kind])delete u[key];
        if(effect.kind==='purgeDefense'){u.shield=u.reduce=0;u.shieldSlots=[];delete u.queuedShields;}
        if(effect.kind==='purgeOffense')for(const name of ['집중','강타'])gameWriteStacks(u,name,[]);
        gameLog(b,u.name+' · '+effects[effect.kind]);
        break;
      case 'clearRoot':
        if(u.rooted)u.move=bounded((u.combat?.movement??2)+u.nextMove+(gameHeldModifiers(b,u,null).moveMod||0),0,7);
        u.rooted=false;u.rootNext=false;
        break;
      case 'collapseResist':
        if(!u.enemy)u.collapseResist=Math.min(99,(u.collapseResist||0)+n);
        break;
      case 'clearCollapse':
        if(u.collapsed&&gameActive(b)){
          gameLog(b,u.name+' · 붕괴는 열차 복귀 전에는 풀리지 않습니다.');
          break;
        }
        if(!u.enemy&&(u.collapsed||u.zero)){
          u.collapsed=false;
          u.mind=Math.max(u.mind,Math.min(n,100));
          gameClearCrisis(b,u);
          gamePose(b,u,'shift');
          gameLog(b,u.name+' · 붕괴 해제');
        }
        break;
      case 'clearAwakening':
        if(u.awakening){
          u.awakening=false;
          gamePose(b,u,'shift');
          gameLog(b,u.name+' · 각성 해제');
        }
        break;
      case 'clearTemptation':
        u.temptation=Math.max(0,(u.temptation||0)-n);
        break;
      case 'collapseImmune':
      case 'mindGuard':
      case 'mindRecoveryCut':
      case 'mindRegen':
      case 'mindBurn':
        if(!u.enemy){
          const statuses=u.mindStatuses??={};
          const through=gameRenewThrough(b.round,statuses[effect.kind]?.through,effect.duration,effect);
          if(through===undefined)break;
          statuses[effect.kind]={amount:Math.min(n,100),through,
            ...(effect.kind==='mindBurn'?{dealer:actor.id,origin}: {})};
        }
        break;
      case 'clearMindBuffs':
      case 'clearMindDebuffs':
      case 'purgeRegen':
        for(const key of gameMentalPurges[effect.kind])if(u.mindStatuses)delete u.mindStatuses[key];
        if(effect.kind==='clearMindBuffs')delete u.collapseResist;
        if(effect.kind==='purgeRegen')u.regen=0;
        gameLog(b,u.name+' · '+effects[effect.kind]);
        break;
      case 'reduceActions':
        u.nextActionPenalty=Math.min(maxActions,(u.nextActionPenalty||0)+n);
        gameLog(b,u.name+' · 다음 턴 행동량 −'+n);
        break;
      case 'extraAction': if(!u.enemy)u.nextActions=Math.min(maxActions-1,(u.nextActions||0)+n); break;
      case 'dodge': u.dodge=Math.min(99,(u.dodge||0)+n); break;
      case 'trueStrike': u.trueStrike=Math.min(99,(u.trueStrike||0)+n); break;
      case 'healCut': {
        const amount=Math.min(100,n);
        const cuts=u.healCuts??=[];
        const explicit=effect.durationPolicy&&effect.durationPolicy!=='default';
        const active=explicit?cuts.reduce((longest,entry)=>!longest||entry.through>longest.through?entry:longest,null):
          cuts.find(entry=>entry.amount===amount);
        const through=gameRenewThrough(b.round,active?.through,effect.duration??2,effect,'longest');
        if(through===undefined)break;
        if(active)Object.assign(active,{amount,through});
        else cuts.push({amount,through});
        break;
      }
      case 'stackWard': {
        const ward=u.stackWard??={};
        ward[tag]=Math.min(maxStatusStacks,(ward[tag]||0)+n);
        break;
      }
      case 'rerollLow': u.lowRerolls=Math.min(96,(u.lowRerolls||0)+n); break;
      case 'hitLeech': gameSupportHeal(b,ctx,u,Math.floor(ctx.base*n/100)); break;
      case 'hearDemon':
        if(u!==actor||u.enemy||!gameAlive(u)||u.awakening)break;
        u.temptation=Math.min(999,(u.temptation||0)+n);
        if(!u.mind)gameStartCollapse(b,u);
        ctx.mod+=effect.powerGain??4;
        gameLog(b,u.name+' · 심마의 제안 수락 (유혹 '+u.temptation+')');
        break;
      case 'refuseDemon': {
        const cleared=Math.min(u.temptation||0,n);
        if(!cleared||u.enemy||!gameAlive(u))break;
        u.temptation-=cleared;
        gameMental(b,u,cleared*(effect.perStack??3));
        gameLog(b,u.name+' · 심마 거절 (유혹 '+cleared+' 감소)');
        break;
      }
      case 'shedShell':
        if(u===actor&&u.zero==='crisis'&&ctx.clashDifference>0)u.crisisRecoveryBonus=Math.min(75,(u.crisisRecoveryBonus||0)+n);
        break;
      case 'awakenBody':
      case 'inscribeMeaning': {
        if(u.enemy||!gameAlive(u)||!u.awakening)break;
        const benefit=effect.perStack?effect.amount*effect.perStack:n;
        if(effect.kind==='awakenBody')gameHeal(b,u,benefit);
        else u.clashMemory=Math.min(999,(u.clashMemory||0)+benefit);
        break;
      }
      case 'critChance': u.critChance=bounded((u.critChance||0)+n,-100,100);break;
      case 'critCharges': u.critCharges=Math.min(999,(u.critCharges||0)+n);break;
      case 'critStacks': u.critStacks=Math.min(999,(u.critStacks||0)+n);break;
      case 'critSpend':
      case 'critRemove': {
        const spent=Math.min(u.critStacks||0,n);
        u.critStacks=(u.critStacks||0)-spent;
        if(effect.kind==='critSpend')ctx.critSpent=(ctx.critSpent||0)+spent;
        if(spent)gameLog(b,u.name+' · 치명타 중첩 '+spent+(effect.kind==='critSpend'?' 소모':' 제거'));
        break;
      }
      case 'critMultiplier': u.critMultiplier=bounded((u.critMultiplier||0)+n,-50,850);break;
      case 'critPerSpent':
        if(ctx.critical&&ctx.critSpent)damage(n*ctx.critSpent);
        break;
      case 'healthCost':
        if(gameAlive(u)&&u.hp>n){
          u.hp-=n;
          ctx.paidHealth=n;
          gameLog(b,u.name+' · 대가로 체력 '+n+' 지불');
        }else gameLog(b,u.name+' · 체력 대가 미지불');
        break;
      case 'mindCost':
        if(!u.enemy&&gameAlive(u)&&u.mind>=n){
          gameMental(b,u,-n,true);
          ctx.paidMind=n;
          gameLog(b,u.name+' · 대가로 정신력 '+n+' 지불');
        }else gameLog(b,u.name+' · 정신력 대가 미지불');
        break;
      case 'rallyHeal':
      case 'rallyShield':
        for(const ally of Object.values(b.units)){
          if(ally===actor||ally.enemy!==actor.enemy||!gameAlive(ally))continue;
          const benefit=effect.amountMode==='percent'?Math.floor(gameHealthBase(ally,effect.healthBasis)*n/100):n;
          if(effect.kind==='rallyHeal')gameSupportHeal(b,ctx,ally,benefit);
          else gainShield(ally,benefit);
        }
        break;
      case 'focusClash': u.clashMemory=Math.min(999,(u.clashMemory||0)+n);break;
      case 'clashStreak':
        if(when==='clash')ctx.mod+=Math.min(effect.winLimit??5,u.clashStreak||0)*n;
        break;
      case 'shareCopy': {
        if(u===actor||u.enemy!==actor.enemy||u.enemy||!gameAlive(u))break;
        const count=Math.min(n,12-u.hand.length);
        if(count<=0)break;
        gameTeachCard(actor,u,card);
        gamePlaceCards(b,u,'hand',Array(count).fill(card.id));
        gameLog(b,u.name+' · '+card.name+' 사본 '+count+'장 받음');
        break;
      }
      case 'hastenStrike':
        for(const strike of u.delayedStrike||[])strike.round=Math.max(b.round,strike.round-n);
        break;
      case 'preserveMove': u.nextMove=Math.min(7,u.nextMove+Math.min(n,u.move));break;
      case 'spareShield': {
        if(u.enemy||!gameAlive(u))break;
        const rate=effect.conversion??100;
        const spend=Math.min(u.shield,n,Math.ceil((100-u.mind)*100/rate));
        if(Math.floor(spend*rate/100)>0)gameMental(b,u,Math.floor(gameRemoveShield(u,spend)*rate/100));
        break;
      }
      case 'revealDistance': ctx.mod+=ctx.moved*n;break;
      case 'lastStand': {
        const key=effect.amountMode==='fixed'?'incomingDamage':'incomingDamagePercent';
        if(!u.hand.length)u[key]=(u[key]||0)-n;
        break;
      }
      case 'bossOutgoingDamage':
      case 'bossIncomingDamage': {
        const key=effect.kind+(effect.amountMode==='percent'&&!effect.ratioBasis?'Percent':'');
        u[key]=(u[key]||0)+n;
        break;
      }
      case 'outgoingDamage':
      case 'incomingDamage': u[effect.kind]=(u[effect.kind]||0)+n;break;
      case 'doubleEdge': {
        const suffix=effect.amountMode==='fixed'?'':'Percent';
        for(const key of ['outgoingDamage'+suffix,'incomingDamage'+suffix])u[key]=(u[key]||0)+n;
        break;
      }
      case 'damageDebt':
        (u.deferrals??=[]).push({amount:n,mode:effect.amountMode||'percent',rounds:effect.deferRounds||1});
        break;
      case 'eraseDebt':
      case 'debtShield': {
        let remaining=n;
        for(const entry of u.damageDebt||[]){
          const amount=Math.min(remaining,entry.amount);
          entry.amount-=amount;
          remaining-=amount;
          if(!remaining)break;
        }
        if(u.damageDebt)u.damageDebt=u.damageDebt.filter(entry=>entry.amount>0);
        if(effect.kind==='debtShield')gainShield(u,Math.floor((n-remaining)*(effect.conversion??100)/100));
        break;
      }
      case 'delayedStrike':
        if(u!==actor&&u.enemy!==actor.enemy&&gameAlive(u)){
          (u.delayedStrike??=[]).push({round:b.round+(effect.delayRounds??1),amount:n,source:actor.id,kind:origin.kind});
          gameLog(b,u.name+' · 지연 타격 '+n+' 예약');
        }
        break;
      case 'positionAnchor':
        if(gameAlive(u)){u.positionAnchor=u.pos;u.anchorRound=b.round+(effect.delayRounds??1);}
        break;
      case 'clashMemory':
        if(ctx.clashDifference)u.clashMemory=Math.min(999,(u.clashMemory||0)+Math.min(n,Math.abs(ctx.clashDifference)));
        break;
      case 'afterimage':
        if(ctx.moved>=(effect.minMove??1))u.afterimage=Math.min(999,(u.afterimage||0)+n);
        break;
      case 'overloadEcho':
        if(u.lastCardRound===b.round-1&&u.lastCardRole==='overload')ctx.mod+=n;
        break;
      case 'emptyHandReload':
        if(!u.enemy&&!u.hand.length)gamePlaceCards(b,u,'hand',u.grave.splice(-Math.min(n,12)));
        break;
      case 'barrierBurst': u.barrierBurst=Math.min(999,(u.barrierBurst||0)+n);break;
      case 'shieldBreakDraw': if(ctx.brokeShield&&!u.enemy)gameDraw(u,n,b);break;
      case 'riposte': if(ctx.clashDifference===0&&u.enemy!==actor.enemy)damage(n);break;
      case 'shieldPower': ctx.mod+=Math.floor(u.shield*n/100);break;
      case 'gravePower': ctx.mod+=u.grave.length*n;break;
      case 'shieldGift': if(u!==actor)gainShield(u,gameRemoveShield(actor,Math.min(n,999-u.shield)));break;
      case 'allyHeal': gameSupportHeal(b,ctx,u,n);break;
      case 'lethalGuard': u.lethalGuard=Math.max(u.lethalGuard||0,n);break;
      case 'recoverMindFloor': gameMental(b,u,Math.max(0,n-u.mind));break;
      case 'purgePoison': gameRemovePoison(u,n);break;
      case 'detonatePoison': {
        const consumed=gameRemovePoison(u,n);
        if(consumed){damage(Math.floor(consumed*(effect.conversion??200)/100));}
        break;
      }
      case 'lateDraw': u.lateDraw=Math.min(12,(u.lateDraw||0)+n);break;
      case 'recycleExile': gamePlaceCards(b,u,'deck',u.exile.splice(-n),true);break;
      case 'graveToShield': {
        const cards=u.grave.splice(-n);
        gamePlaceCards(b,u,'exile',cards);
        gainShield(u,(effect.perCard??2)*cards.length);
        break;
      }
      case 'draw': if(!u.enemy)gameDraw(u,n,b); break;
      case 'discardAllCost':
      case 'discardExactCost': {
        const count=effect.kind==='discardAllCost'?u.hand.length:n;
        if(count&&count<=u.hand.length){
          gamePlaceCards(b,u,'grave',gameSpliceHand(u,0,count));
          ctx.discarded=count;
          gameLog(b,u.name+' · 대가로 손패 '+count+'장 버림');
        }else gameLog(b,u.name+' · 손패 버리기 대가 미지불');
        break;
      }
      case 'giveCard': {
        if(u.enemy||!gameAlive(u))break;
        const given=actor.library[effect.givenCardId];
        const count=Math.min(n,12-u.hand.length);
        if(!given||count<=0)break;
        gameTeachCard(actor,u,given);
        gamePlaceCards(b,u,'hand',Array(count).fill(given.id));
        gameLog(b,u.name+' · '+given.name+' '+count+'장 획득');
        break;
      }
      case 'copySelf':
      case 'copyFixed':
      case 'copyChosen': {
        const id=effect.kind==='copySelf'?card.id:effect.kind==='copyFixed'?effect.copyId:ctx.copyId;
        const count=Math.min(n,12-u.hand.length);
        if(!u.enemy&&count>0&&Object.hasOwn(u.library,id)){
          gamePlaceCards(b,u,'hand',Array(count).fill(id));
          gameLog(b,u.name+' · '+u.library[id].name+' 복제 '+count+'장');
        }
        break;
      }
      case 'discard': gamePlaceCards(b,u,'grave',gameSpliceHand(u,0,n)); break;
      case 'recover': {const count=Math.min(n,12-u.hand.length,u.grave.length);if(count>0)gamePlaceCards(b,u,'hand',u.grave.splice(-count));break;}
      case 'return': ctx.destination='hand'; break;
      case 'exile': ctx.destination='exile'; break;
      case 'replay': ctx.replay=true; break;
      case 'replayHit': ctx.hitRepeat=true; break;
      case 'amplifyHit': {
        const last=cardHitPowers(card).length;
        const next=ctx.hitIndex+1;
        const first=effect.amplifyTarget==='last'?last:effect.amplifyTarget==='number'?effect.amplifyIndex:next;
        const end=effect.amplifyTarget==='remaining'?last:first;
        const unit=effect.amountMode==='percent'?'percent':'fixed';
        for(let hit=first;hit<=end;hit++){
          const bonus=ctx.hitAmplifiers.get(hit)??{fixed:0,percent:0};
          bonus[unit]+=n;
          ctx.hitAmplifiers.set(hit,bonus);
        }
        gameLog(b,actor.name+' · '+first+(first===end?'':'~'+end)+'타 효과 +'+n+(unit==='percent'?'%':''));
        break;
      }
      case 'bossDamage':
      case 'damage': damage(n); break;
      case 'percent': damage((ctx.base||0)*n/100); break;
      case 'heal': gameSupportHeal(b,ctx,u,n); break;
      case 'shield': gainShield(u,n); break;
      case 'reduce': u.reduce=Math.min(999,u.reduce+n); break;
      case 'power': ctx.mod+=n; break;
      case 'movement': if(u.rooted)break;u.move=Math.min(7,u.move+n); if(u===actor&&ctx.goal!==undefined)u.move-=gameMove(b,u,ctx.goal,u.move); break;
      case 'nextMove': u.nextMove=Math.min(7,u.nextMove+n); break;
      case 'move': gameInstantMove(b,actor,u,target,effect,n); break;
      case 'push':
      case 'pull': {
        if(actor.id===u.id||!gameAlive(u))break;
        for(let i=0;i<n;i++){
          if(gameForcedMoveBlocked(b,u))break;
          const dest=gridDisplacement(actor.pos,u.pos,effect.kind==='pull');
          if(!gridValid(dest)||b.walls.includes(dest)){
            if(ctx.hitResult?.target===u)ctx.hitResult.wall=true;
            gameLog(b,u.name+' 벽 충돌');
            gameTriggers(b,ctx,'wall',u,depth+1);
            break;
          }
          if(!gamePosition(b,u,dest))break;
        }
        break;
      }
      case 'stack': gameGrantStacks(b,u,effect,n,card.concept?gameConceptTraits[tag]:actor.stackDefinitions?.[tag]??gameConceptTraits[tag]??(basicStacks[tag]?.effects?{...basicStacks[tag],name:tag}:undefined),undefined,actor.id); break;
      case 'remove':
        if(effect.stackAxes)gameSpendStackAxes(u,tag,effect.axisCount,effect.axisPower);
        else gameTakeStacks(u,tag,n);
        break;
      case 'consume': {
        if(effect.stackAxes){
          const {used,potency}=gameSpendStackAxes(u,tag,effect.axisCount,effect.axisPower);
          if(used||potency){
            const previous=ctx.usedPotency;
            ctx.usedPotency=potency;
            gameTriggers(b,ctx,'consume',u,depth+1);
            ctx.usedPotency=previous;
          }
          break;
        }
        const budget=effect.consumeAmount==='all'?Infinity:n;
        let used=0,potency=0;
        for(const source of consumeGroup||[u]){
          const spend=Math.min(budget-used,source.stacks[tag]||0);
          if(effect.consumeAmount==='all'){
            potency+=stackPotency(source,tag);
            gameWriteStacks(source,tag,[]);
          }else potency+=gameTakeStacks(source,tag,spend);
          used+=spend;
          if(used>=budget)break;
        }
        if(used||potency){
          const previous=ctx.usedPotency;
          ctx.usedPotency=potency;
          if(consumeGroup||effect.consumeAmount==='all')gameLog(b,actor.name+' · '+tag+' '+used+' 소모 → '+u.name);
          gameTriggers(b,ctx,'consume',u,depth+1);
          ctx.usedPotency=previous;
        }
        break;
      }
      case 'perStack': if(ctx.usedPotency)damage(ctx.usedPotency*n);break;
      case 'transferDebuff': gameTransferDebuff(b,u,actor);break;
      case 'mind': gameMental(b,u,n);break;
      case 'drain': gameMentalDamage(b,u,n,actor,origin);break;
      case 'pierce':
      case 'recoil': damage(n,true);break;
      case 'fixedDamage':
      case 'piercingFixedDamage': damage(n,effect.kind==='piercingFixedDamage',true);break;
      case 'stripShield': gameRemoveShield(u,n);break;
      case 'drainLife': if(u!==actor)gameHeal(b,actor,damage(n));break;
      case 'healPercent': gameHeal(b,u,Math.floor(u.maxHp*n/100));break;
      case 'healMissing': gameHeal(b,u,Math.floor((u.maxHp-u.hp)*n/100));break;
      case 'fortify':
        (u.queuedShields??=[]).push({amount:n,key:shieldKey,effect:{shieldDuration:effect.shieldDuration,durationCap:effect.durationCap,
          shieldSource:effect.shieldSource,shieldCap:effect.shieldCap,stackMode:effect.stackMode,durationPolicy:effect.durationPolicy,refreshDuration:effect.refreshDuration}});
        break;
      case 'focus': u.nextPower=bounded((u.nextPower||0)+n,-999,999);break;
      case 'weaken': u.nextPower=bounded((u.nextPower||0)-n,-999,999);break;
      case 'nextSlow': u.nextMove=Math.max(-7,u.nextMove-n);break;
      case 'retreat': {
        if(gameForcedMoveBlocked(b,u))break;
        const other=u===actor?(target&&target!==actor?target:b.units.enemy):actor;
        if(other===u)break;
        const paths=gridPaths(u.pos,Math.min(12,n),gameBlocked(b,u));
        const farthest=[...paths.keys()].sort((a,c)=>gridDistance(c,other.pos)-gridDistance(a,other.pos)||paths.get(a).length-paths.get(c).length)[0];
        const distance=paths.get(farthest).length;
        if(distance){u.pos=farthest;gameLog(b,u.name+' 후퇴 '+distance+'칸');}
        break;
      }
      case 'swapPosition': {
        const other=u===actor?target:actor;
        if(other&&u!==other&&!gameForcedMoveBlocked(b,u)&&!gameForcedMoveBlocked(b,other)&&gameAlive(u)&&gameAlive(other)&&gameDistance(u,other)<=n){
          [u.pos,other.pos]=[other.pos,u.pos];
          gameLog(b,u.name+' ↔ '+other.name+' 자리 교환');
        }
        break;
      }
      case 'doubleStack': gameGrantStacks(b,u,effect,Math.min(n,u.stacks[tag]||0),u.stackTraits?.[tag],gameStackRuns(u,tag)); break;
      case 'stealStack': {
        if(u===actor)break;
        const count=gameGrantStacks(b,actor,effect,Math.min(n,u.stacks[tag]||0),u.stackTraits?.[tag],gameStackRuns(u,tag));
        if(count)gameTakeStacks(u,tag,count);
        break;
      }
      case 'consumeHeal': if(ctx.usedPotency)gameHeal(b,u,ctx.usedPotency*n);break;
      case 'stackDamage': if(u.stacks[tag])damage(stackPotency(u,tag)*n);break;
      case 'poison':
        if(effect.dotRounds){
          const effects=u.damageOverTime??=[];
          const explicit=effect.durationPolicy&&effect.durationPolicy!=='default';
          const sameSource=dot=>dot.dealer===actor.id&&dot.kind===origin.kind&&dot.through>=b.round;
          const active=explicit?effects.filter(sameSource).sort((a,c)=>c.through-a.through)[0]:null;
          const through=gameRenewThrough(b.round,active?.through,effect.dotRounds,effect);
          if(through===undefined)break;
          const amount=Math.min(n,999-gamePoisonAmount(u)+(active?.amount||0));
          if(amount>0){
            if(active){
              Object.assign(active,{amount,through});
              break;
            }
            const existing=effects.find(dot=>dot.through===through&&sameSource(dot));
            if(existing)existing.amount+=amount;
            else {
              const last=effects.findLastIndex(dot=>dot.through===through);
              effects.splice(last<0?effects.length:last+1,0,{amount,through,dealer:actor.id,kind:origin.kind});
            }
            gameLog(b,u.name+' · 지속 피해 '+amount+' · '+effect.dotRounds+'라운드');
          }
        }else{
          const amount=Math.min(n,999-(u.poison||0));
          if(amount>0){
            u.poison=(u.poison||0)+amount;
            const entries=u.poisonSources??=[];
            const previous=entries.at(-1);
            if(previous?.dealer===actor.id&&previous.kind===origin.kind)previous.amount+=amount;
            else entries.push({amount,dealer:actor.id,kind:origin.kind});
          }
        }
        break;
      case 'regen': u.regen=Math.min(999,(u.regen||0)+n);break;
      case 'clearStatus': u.poison=0;delete u.poisonSources;delete u.damageOverTime;u.regen=0;break;
      case 'mindTransfer': {
        if(u===actor||u.enemy)break;
        const taken=Math.min(n,u.mind,100-actor.mind);
        gameMental(b,actor,gameMentalDamage(b,u,taken,actor,origin));
        break;
      }
      case 'cycle': {
        if(u.enemy)break;
        const discarded=gameSpliceHand(u,0,n);
        gamePlaceCards(b,u,'grave',discarded);gameDraw(u,discarded.length,b);
        break;
      }
      case 'mill': gamePlaceCards(b,u,'grave',u.deck.splice(-n));break;
      case 'recoverDeck': gamePlaceCards(b,u,'deck',u.grave.splice(-n));break;
      case 'reclaim': {
        const count=Math.min(n,12-u.hand.length,u.exile.length);
        if(count>0)gamePlaceCards(b,u,'hand',u.exile.splice(-count));
        break;
      }
      case 'topdeck': ctx.destination='deckTop';break;
      case 'bottomdeck': ctx.destination='deckBottom';break;
      case 'expose': u.expose=Math.min(999,(u.expose||0)+n);break;
      case 'thorns': u.thorns=Math.min(999,(u.thorns||0)+n);break;
      case 'temporaryShield': gainShield(u,n,true);break;
      case 'stealShield': {
        if(u!==actor)gainShield(actor,gameRemoveShield(u,Math.min(n,999-actor.shield)));
        break;
      }
      case 'guardBreak': u.cover?.splice(0,n);break;
      case 'rootNext': u.rootNext=true;break;
      case 'provoke': if(!u.enemy)u.provoked=true;break;
      case 'evadeStep': {
        const other=u===actor?(target&&target!==actor?target:b.units.enemy):actor;
        if(other===u)break;
        const paths=gridPaths(u.pos,Math.min(n,12),gameBlocked(b,u));
        const distance=gameDistance(u,other);
        const options=[...paths].filter(([pos])=>gridDistance(pos,other.pos)===distance);
        const [position,path]=options.sort((a,c)=>c[1].length-a[1].length)[0];
        if(path.length){u.pos=position;gameLog(b,u.name+' · 측면 이동 '+path.length+'칸');}
        break;
      }
      case 'cleanseStacks': gameWriteStacks(u,tag,[]);delete u.stacks[tag];break;
      case 'shieldPerStack': if(ctx.usedPotency)gainShield(u,ctx.usedPotency*n);break;
      case 'shuffleDeck': u.deck=gameShuffle(u.deck);break;
      case 'buryHand': gamePlaceCards(b,u,'deck',gameSpliceHand(u,0,n).reverse(),true);break;
      case 'exileGrave': gamePlaceCards(b,u,'exile',u.grave.splice(-n));break;
      case 'drawTo': if(!u.enemy)gameDraw(u,Math.max(0,Math.min(n,12)-u.hand.length),b);break;
    }
}
function gameContext(actor,card,targets,moved=0){
  return {actor,card,targets,moved,mod:actor.enemy?0:mentalPower(actor.mind),destination:'grave',replay:false,discarded:0,paidHealth:0,paidMind:0,once:new Set(),effectRecipients:new Map(),scalePayments:new Map()};
}
function gameEnemyAction(b,actor,target,card=b.intent.card){
  const intent=b.intentQueue?.find(entry=>entry.attacker===actor.id)||b.intent;
  const effective=card.splash&&(intent?.noSplash||target.defenseSplashCut===b.round)?{...card,splash:null}:card;
  const ctx=gameContext(actor,effective,[target]);
  gameCountCardUse(b,ctx);
  if(gameIsRail(b)){
    if(actor.id!=='enemy'&&b.encounter.leaderDownRound<b.round)ctx.mod-=3;
    if(actor.scope?.round===b.round&&actor.scope.target===target.id)ctx.mod+=3;
    if(card.id==='railPierce'&&gameRailAim(b,target)){
      ctx.mod+=target.railAimBonus||4;
      ctx.card={...card,hitPowers:[card.power,card.power]};
    }
  }
  if(card.id==='blissHug'&&target.shield)ctx.mod+=5;
  gameTriggerCardMark(b,actor,ctx.card);
  if(!gameAlive(actor))return ctx;
  gameTriggers(b,ctx,'use',target);
  return ctx;
}
function gameFinishCard(b,ctx){
  gameRecordGuestAction(b,ctx);
  gameTriggers(b,ctx,'end',ctx.targets[0]||ctx.actor);
  gamePassives(b,ctx.actor,'end',ctx.targets[0]||ctx.actor,ctx);
  const u=ctx.actor,id=ctx.originId||ctx.card.id;
  if(u.enemy||ctx.temporary||u.library[id]?.generated)return;
  if(gameIsBright(b)&&id===darkForgive.id&&b.encounter.stage>=2){
    gamePlaceCards(b,u,'hand',[id]);
    return;
  }
  if(ctx.destination==='hand'&&u.hand.length<12)gamePlaceCards(b,u,'hand',[id]);
  else if(ctx.destination==='deckTop')gamePlaceCards(b,u,'deck',[id]);
  else if(ctx.destination==='deckBottom')gamePlaceCards(b,u,'deck',[id],true);
  else if(ctx.destination==='exile')gamePlaceCards(b,u,'exile',[id]);
  else gamePlaceCards(b,u,'grave',[id]);
}
function gameCardReactions(b,unit,when,attacker,event){
  if(!gameAlive(unit))return;
  const pending=[...(b.waitingCards?.get(unit.id)?.values()||[])];
  const queuedCovers=new Set(pending.map(source=>source.coverCharge));
  for(const charge of unit.cover||[]){
    const card=unit.library[charge.card??charge];
    if(card&&!queuedCovers.has(charge)&&cardUsable(unit,card))pending.push({...charge,card});
  }
  const pendingIds=new Set(pending.map(({card})=>card.id));
  const active=Object.entries(unit.cardReactions||{}).flatMap(([id,state])=>
    !pendingIds.has(id)&&unit.library[id]?[{card:unit.library[id],...(typeof state==='number'?{reactionRound:state}:{reactionWindows:state})}]:[]);
  for(const source of [...pending,...active]){
    if(!gameAlive(unit))break;
    if(!source.card.effects.some(effect=>effect.when===when))continue;
    const ctx=gameContext(unit,source.card,[attacker],source.moved);
    Object.assign(ctx,{base:event.base,critical:event.critical,brokeShield:event.brokeShield,
      discarded:source.discarded||0,paidHealth:source.paidHealth||0,paidMind:source.paidMind||0,
      reactionRound:source.reactionRound,reactionWindows:source.reactionWindows});
    gameTriggers(b,ctx,when,attacker);
  }
}
function gameClashEffects(b,left,right){
  if(left.actor.enemy!==right.actor.enemy)gameObserve(b,left.actor.enemy?left.actor:right.actor,8);
  gamePose(b,left.actor,'clash');
  gamePose(b,right.actor,'clash');
  for(const [ctx,opponent] of [[left,right.actor],[right,left.actor]]){
    gameTriggers(b,ctx,'clash',opponent);
    gamePassives(b,ctx.actor,'clash',opponent,ctx);
  }
}
function gameStrike(b,ctx,target,roll){
  gamePose(b,ctx.actor,'attack');
  const actor=ctx.actor;
  const blind=ctx.card.id==='conceptBlindJudge';
  if(actor.enemy!==target.enemy)actor.fieldAttackRound=b.round;
  if(ctx.card.id==='conceptSnailRoll')roll=0;
  if(ctx.card.id===darkForgive.id&&ctx.card.targetSide==='any'&&target===b.units.enemy)return 0;
  if(actor.ruleConfusion>=b.round&&actor.enemy!==target.enemy&&gameRoll(100)<=50){
    gameLog(b,actor.name+' · 등 뒤의 발소리에 빗나감');
    return null;
  }
  if(target.dodge>0){
    target.dodge--;
    if(!actor.trueStrike){
      gameLog(b,target.name+' · 타격 회피');
      return null;
    }
    actor.trueStrike--;
    gameLog(b,actor.name+' · '+target.name+'의 회피 무효화');
  }
  if(b.encounter&&b.zones.includes(actor.pos))roll=Math.max(0,roll-3);
  const held=gameHeldModifiers(b,actor,target);
  const rawChance=(actor.combat?.critChance||0)+(actor.critChance||0)+(actor.critStacks||0)*5+(held.critChance||0)+Math.min(100,stackPotency(actor,'집중'))+(ctx.applauseCrit||0);
  const chance=bounded(rawChance,0,100);
  ctx.critical=!blind&&roll>0&&(ctx.fieldCrit!==undefined||actor.critCharges>0||chance>0&&gameRoll(100)<=chance);
  if(ctx.critical){
    if(actor.critCharges>0&&ctx.fieldCrit===undefined)actor.critCharges--;
    ctx.anyCritical=true;
    const multiplier=150+bounded((actor.critMultiplier||0)+(held.critMultiplier||0)+(actor.stacks.강타||0)+(ctx.fieldCrit||0)+(ctx.applauseCrit?Math.max(0,rawChance-100):0),-50,850);
    roll=Math.floor(roll*multiplier/100);
    gameLog(b,actor.name+' · 치명타 ('+multiplier+'%) → '+target.name);
  }
  const plummet=ctx.card.id==='conceptPlummetDrop';
  const faces=ctx.card.id==='conceptTrifaceBloom'?gameClosedFaces(b,target):0;
  if(ctx.fieldStraight)roll=Math.floor(roll*1.5);
  if(faces>=3)roll*=faces===4?8:4;
  gameInk(b,'magenta',3);
  if(actor.inkBuff?.includes('magenta'))roll+=3;
  const priorMind=target.mind;
  const origin={kind:'strike',ignoreReduction:plummet||faces>=3,doubleShield:ctx.card.id==='conceptStitchSeam',ignoreOutgoingCuts:blind};
  let dealt;
  if(gameIsJudge(b)&&actor.enemy){
    const id=ctx.card.id;
    if(id==='judgeRead'&&target.judgmentMark)roll+=4;
    if(id==='judgeVerdict')roll+=Math.min(12,gameJudgeDebuffKinds(target).length*3);
    ctx.judgeLastRoll=roll;
    if(id==='judgeNail'&&target.judgmentMark)gameRemoveShield(target,target.shield);
    if(id==='judgeScales'&&target.judgmentMark){
      const half=Math.floor(roll/2);
      dealt=gameDamage(b,target,roll-half,actor,false,true,false,origin);
      dealt+=gameDamage(b,target,half,actor,false,false,true,origin);
    }else dealt=gameDamage(b,target,roll,actor,false,true,id==='judgeNail',origin);
    const dice=ctx.diceRolls?.[(ctx.hitIndex||1)-1];
    if((id==='judgeAxe'||id==='judgeVerdict')&&dice%2===1){
      for(const near of Object.values(b.units).filter(unit=>unit!==target&&gameAlive(unit)&&gameDistance(unit,target)===1))
        gameDamage(b,near,Math.floor(roll*0.3),actor,false,false,false,{kind:'card',judgeIndirect:true});
    }
    if(id==='judgeVerdict'&&target.judgmentMark&&gameAlive(target))
      dealt+=gameDamage(b,target,Math.floor(roll/2),actor,false,false,true,origin);
    if(target.judgmentMark&&!gameAlive(target)&&!target.collapsed&&gameAlive(actor)){
      const next=b.encounter.rank?.map(entry=>b.units[entry.id]).find(unit=>unit!==target&&gameAlive(unit));
      if(next){
        delete target.judgmentMark;
        next.judgmentMark=true;
        b.encounter.chained=true;
        gameLog(b,'죄인의 표식 이전 → '+next.name+' · 연쇄 일방공격');
        gameDamage(b,next,roll+6,actor,false,false,false,{kind:'card',judgeIndirect:true});
      }
    }
  }else dealt=gameDamage(b,target,roll,actor,ctx.card.id==='railPierce'||plummet||faces>=3,true,false,origin);
  if(blind&&ctx.diceRolls?.[(ctx.hitIndex||1)-1]%2===1){
    for(const near of Object.values(b.units).filter(unit=>unit!==target&&gameAlive(unit)&&gameDistance(unit,target)===1)){
      gameDamage(b,near,Math.floor(roll*0.3),actor,false,false,false,{kind:'card',ignoreOutgoingCuts:true});
    }
  }
  if(ctx.card.id==='conceptDread'&&priorMind>0&&target.mind===0)actor.ruleHalfCost=b.round+1;
  if(actor.whiteMaze?.caster===target.id&&actor.mind>=70&&dealt>=15)delete actor.whiteMaze;
  if(actor.inkBuff?.includes('black')&&actor!==target&&gameAlive(target))gameMentalDamage(b,target,5,actor,{kind:'card'});
  if(actor.enemy!==target.enemy&&actor.stacks[applause]&&
      (actor.applauseHurt||0)===(ctx.applauseHurt||0)){
    gameAddApplause(actor,1);
  }
  gameItchHit(b,actor,target);
  const stitches=target.stacks['바늘땀']||0;
  if(stitches&&gameAlive(target)&&actor.enemy!==target.enemy){
    if(ctx.card.id==='conceptStitchSeam'){
      dealt+=gameDamage(b,target,stitches,actor,false,false,true,{kind:'card'});
      if(ctx.hitIndex===7)dealt+=gameDamage(b,target,14,actor,true,false,true,{kind:'card'});
    }
    if((ctx.fieldStitches||0)<3&&gameAlive(target)){
      ctx.fieldStitches=(ctx.fieldStitches||0)+1;
      gameFieldGrant(b,target,'바늘땀',1,actor);
      gameGrantStacks(b,actor,{tag:'집중',stackPower:2},1,undefined,undefined,actor.id);
    }
  }
  if(ctx.card.id==='blissCrush'&&gameAlive(target)){
    dealt+=gameDamage(b,target,Math.floor(target.hp*0.15),actor,false,false,true,{kind:'card'});
  }
  if(actor.enemy!==target.enemy||actor.collapsed&&actor!==target){
    const event={...ctx,base:dealt,brokeShield:!!origin.shieldBroken};
    gameBasicStackDamage(b,target,'struck');
    gamePassives(b,actor,'hit',target,event);
    if(dealt)gamePassives(b,actor,'damage',target,event);
    gamePassives(b,actor,event.critical?'critical':'noncritical',target,event);
    if(dealt){
      gamePassives(b,target,'hurt',actor,event);
      gameCardReactions(b,target,'hurt',actor,event);
    }
    gamePassives(b,target,'struck',actor,event);
    gameCardReactions(b,target,'struck',actor,event);
  }
  ctx.brokeShield=!!origin.shieldBroken;
  return dealt;
}
function gameHitSequence(b,ctx,target,rolls,intercepted,replay,indexOnly=null){
  let base=0,critical=false,brokeShield=false,struck=false;
  if(indexOnly===null)ctx.hitAmplifiers=new Map();
  const canStrike=()=>gameAlive(ctx.actor)&&gameAlive(target)&&(intercepted||gameReach(b,ctx.card,ctx.actor,target));
  const strike=roll=>{
    const dealt=gameStrike(b,ctx,target,roll);
    if(dealt===null)return;
    struck=true;
    ctx.base=dealt;
    const isCritical=ctx.critical;
    base+=dealt;
    critical||=isCritical;
    brokeShield||=ctx.brokeShield;
    if(!replay&&dealt&&target.enemy&&!ctx.actor.enemy){
      if(ctx.moved>=2)gameProof(b,ctx.actor,'advance');
      if(isCritical)gameProof(b,ctx.actor,'precision');
    }
    gameTriggerHit(b,ctx,target,ctx.hitIndex);
    if(dealt)gameTriggers(b,ctx,'damage',target,0,ctx.hitIndex);
    gameTriggers(b,ctx,isCritical?'critical':'noncritical',target,0,ctx.hitIndex);
  };
  for(const [index,roll] of rolls.entries()){
    if(indexOnly!==null&&index!==indexOnly)continue;
    if(!canStrike())break;
    ctx.hitIndex=index+1;
    if(rolls.length>1)gameLog(b,ctx.actor.name+' · '+ctx.hitIndex+'타 위력 '+roll+' → '+target.name);
    strike(roll);
    if(index===0&&ctx.card.id==='conceptStitchSeam'&&!struck)break;
    if(ctx.hitRepeat&&canStrike()){
      gameLog(b,ctx.actor.name+' · '+ctx.hitIndex+'타 재사용 → '+target.name);
      // Re-run scoped effects with fresh per-strike bookkeeping. Persistent effect limits still apply.
      const {once,effectRecipients,scalePayments}=ctx;
      const scoped=new Set(ctx.card.effects.filter(effect=>effect.hitIndex===ctx.hitIndex));
      ctx.once=new Set([...once].filter(effect=>!scoped.has(effect.flowSource||effect)));
      ctx.effectRecipients=new Map([...effectRecipients].filter(([effect])=>!scoped.has(effect.flowSource||effect)));
      ctx.scalePayments=new Map([...scalePayments].filter(([effect])=>!scoped.has(effect.flowSource||effect)));
      ctx.replayingHit=true;
      strike(roll);
      Object.assign(ctx,{once,effectRecipients,scalePayments});
      delete ctx.replayingHit;
    }
    delete ctx.hitRepeat;
  }
  delete ctx.hitIndex;
  if(indexOnly===null)delete ctx.hitAmplifiers;
  if(!struck)return false;
  Object.assign(ctx,{base,critical,brokeShield});
  return true;
}
function gameHitByTargetMode(b,ctx,rolls,intercepted,replay,recordAttack){
  const {actor,card}=ctx;
  const tile=card.target==='tile';
  const selected=ctx.targets[0];
  if(!tile&&(!selected||card.splash&&(!gameAlive(selected)||!intercepted&&!gameReach(b,card,actor,selected))))return;
  ctx.splashOrigin=!tile&&card.splash?{id:selected.id,pos:selected.pos}:null;
  ctx.actionGroups=gameActionGroups(b,ctx);
  const {primary,secondary}=ctx.actionGroups;
  const landed=new Map();
  let previous=new Set();
  ctx.hitAmplifiers=new Map();
  const eligible=unit=>gameAlive(unit)&&unit!==actor&&(actor.collapsed||unit.enemy!==actor.enemy)&&
    (tile||intercepted||card.splash&&unit!==primary||gameReach(b,card,actor,unit));
  for(const [index,mode] of (card.hitTargets||rolls.map(()=> 'all')).entries()){
    const active=gameGroupUnits({primary,secondary}).filter(eligible);
    let targets=mode==='primary'?active.filter(unit=>unit===primary):mode==='secondary'?active.filter(unit=>unit!==primary):active;
    if(mode==='randomDistinct')targets=targets.filter(unit=>!previous.has(unit.id));
    if((mode==='random'||mode==='randomDistinct')&&targets.length)targets=[targets[gameRoll(targets.length)-1]];
    if(!targets.length)continue;
    previous=new Set(targets.map(unit=>unit.id));
    for(const unit of targets){
      if(!eligible(unit)||!gameHitSequence(b,ctx,unit,rolls,tile||intercepted||!!card.splash&&unit!==primary,replay,index))continue;
      recordAttack(unit);
      const earlier=landed.get(unit);
      landed.set(unit,{base:(earlier?.base||0)+ctx.base,critical:!!earlier?.critical||ctx.critical,brokeShield:!!earlier?.brokeShield||ctx.brokeShield});
    }
  }
  delete ctx.hitAmplifiers;
  for(const [target,result] of landed){
    Object.assign(ctx,result);
    if(!replay){
      gameTriggerHit(b,ctx,target);
      if(ctx.base)gameTriggers(b,ctx,'damage',target);
      if(!actor.enemy&&target.enemy)b.allyHit=true;
    }
    gameTriggers(b,ctx,ctx.critical?'critical':'noncritical',target);
  }
}
function gameHit(b,ctx,roll,intercepted=false){
  const rolls=ctx.hitRolls??[roll];
  const sequence=rolls.length>1||ctx.card.effects.some(effect=>effect.hitIndex);
  const attacks=(ctx.card.effects.some(effect=>effect.when==='attackEnd')||ctx.actor.passives?.some(passive=>passive.effects.some(effect=>effect.when==='attackEnd')))?new Map():null;
  const counters=ctx.card.role!=='counter'&&b.counterPlans?.size?new Set():null;
  const recordAttack=target=>{
    if(counters&&target.enemy!==ctx.actor.enemy&&b.counterPlans.has(target.id))counters.add(target);
    if(!attacks)return;
    const previous=attacks.get(target);
    attacks.set(target,{
      base:(previous?.base||0)+ctx.base,
      critical:!!previous?.critical||ctx.critical,
      brokeShield:!!previous?.brokeShield||ctx.brokeShield
    });
  };
  const resolveHit=(target,skipReach,replay)=>{
    if(!gameAlive(target)||(!skipReach&&!gameReach(b,ctx.card,ctx.actor,target)))return false;
    const original=target;
    if(!replay)target=gameDefenseRedirect(b,ctx,target);
    skipReach||=target!==original;
    ctx.brokeShield=false;
    ctx.critical=false;
    if(target===ctx.actor||(!ctx.actor.collapsed&&target.enemy===ctx.actor.enemy)){
      if(!replay)gameTriggerHit(b,ctx,target,0,['ally','any'].includes(ctx.card.targetSide));
      return false;
    }
    if(sequence){
      if(!gameHitSequence(b,ctx,target,rolls,skipReach,replay))return false;
    }else{
      const dealt=gameStrike(b,ctx,target,roll);
      if(dealt===null)return false;
      ctx.base=dealt;
      if(!replay&&ctx.base&&target.enemy&&!ctx.actor.enemy){
        if(ctx.moved>=2)gameProof(b,ctx.actor,'advance');
        if(ctx.critical)gameProof(b,ctx.actor,'precision');
      }
    }
    recordAttack(target);
    if(!replay){
      gameTriggerHit(b,ctx,target);
      if(ctx.base)gameTriggers(b,ctx,'damage',target);
      if(!ctx.actor.enemy&&target.enemy)b.allyHit=true;
    }
    gameTriggers(b,ctx,ctx.critical?'critical':'noncritical',target);
    return true;
  };
  const resolveAttack=replay=>{
    if(ctx.card.target==='tile'||ctx.card.hitTargets&&ctx.card.target!=='self'){
      gameHitByTargetMode(b,ctx,rolls,intercepted,replay,recordAttack);
      return;
    }
    for(const selected of ctx.targets){
      let target=selected;
      if(gameIsRail(b)&&!replay&&!ctx.actor.enemy&&selected.enemy&&ctx.targets.length===1&&
        ctx.card.target===1&&!ctx.card.unredirectable&&!ctx.clash&&!b.encounter.coverUsed){
        const shield=b.units.railShield;
        if(selected!==shield&&gameAlive(shield)&&gameAlive(selected)&&gameDistance(shield,selected)===1){
          b.encounter.coverUsed=true;
          target=shield;
          gameLog(b,shield.name+' · 진형 방벽 · '+selected.name+' 원호');
        }
      }
      const origin=ctx.card.splash?{id:target.id,pos:target.pos}:null;
      ctx.splashOrigin=origin;
      ctx.actionGroups=gameActionGroups(b,ctx);
      const landed=resolveHit(target,intercepted||target!==selected,replay);
      if(!landed||!origin||!gameAlive(ctx.actor))continue;
      const secondary=gridSplashTargets(ctx.card,ctx.actor,origin,Object.values(b.units));
      ctx.actionGroups.secondary=secondary;
      if(secondary.length)gameLog(b,ctx.actor.name+' · 광역 확산 → '+secondary.map(unit=>unit.name).join(', '));
      for(const unit of secondary){
        if(!gameAlive(ctx.actor))break;
        resolveHit(unit,true,replay);
      }
    }
  };
  resolveAttack(false);
  if(ctx.replay){
    ctx.replay=false;
    gameLog(b,ctx.actor.name+' · '+ctx.card.name+' 재사용');
    resolveAttack(true);
  }
  if(attacks?.size){
    ctx.totalDamage=[...attacks.values()].reduce((sum,attack)=>sum+attack.base,0);
    for(const [target,result] of attacks){
      Object.assign(ctx,result);
      gameTriggers(b,ctx,'attackEnd',target);
      gamePassives(b,ctx.actor,'attackEnd',target,ctx);
    }
  }
  for(const defender of counters||[]){
    const queue=b.counterPlans.get(defender.id);
    const reaction=queue?.find(candidate=>gameReach(b,candidate.card,defender,ctx.actor));
    if(!reaction||!gameAlive(defender)||!gameAlive(ctx.actor))continue;
    queue.splice(queue.indexOf(reaction),1);
    if(!queue.length)b.counterPlans.delete(defender.id);
    reaction.targets=[ctx.actor];
    gameLog(b,defender.name+' · 반격 → '+ctx.actor.name+' ('+reaction.card.name+')');
    gameTriggers(b,reaction,'counter',ctx.actor);
    gamePassives(b,defender,'counter',ctx.actor,reaction);
    gameUnopposedAttack(b,reaction);
  }
}
function gameUnopposedAttack(b,ctx){
  b.waitingCards?.get(ctx.actor.id)?.delete(ctx.waitingPlan);
  const tile=ctx.card.target==='tile';
  if(tile){
    if(b.walls.includes(ctx.targetTile)||!gridValid(ctx.targetTile)||!gridCardInRange(ctx.card,ctx.actor.pos,ctx.targetTile)){
      gameLog(b,ctx.actor.name+' · 광역 중심이 사거리 밖으로 벗어났습니다.');
      return;
    }
    ctx.actionGroups=gameActionGroups(b,ctx);
    ctx.targets=gameGroupUnits(ctx.actionGroups);
  }
  if(ctx.card.effects.some(effect=>effect.when==='unopposed')){
    const {actor,card}=ctx;
    const targets=ctx.targets.filter(target=>gameAlive(target)&&target!==actor&&
      (actor.collapsed||target.enemy!==actor.enemy)&&(tile||gameReach(b,card,actor,target)));
    for(const target of tile&&!targets.length?[null]:targets){
      gameTriggers(b,ctx,'unopposed',target);
      gamePassives(b,ctx.actor,'unopposed',target,ctx);
    }
  }
  if(ctx.ruleNoTarget)return;
  if(ctx.card.id==='conceptArtistStart'||ctx.card.id==='conceptArtistFinish'){gameArtistAttack(b,ctx);return;}
  gameHit(b,ctx,gameActionPower(b,ctx));
  gameRecordGuestAction(b,ctx);
}
function gameCover(b,attacker,target,attackCard=b.intent.card){
  if(attackCard.unredirectable)return false;
  const options=[];
  for(const unit of Object.values(b.units)){
    if(unit===target||unit.enemy!==target.enemy||!gameAlive(unit)||unit.blockedRounds||(unit.zero&&unit.zero!=='crisis'))continue;
    for(const [index,charge] of (unit.cover||[]).entries()){
      const card=unit.library[charge.card??charge];
      if(cardUsable(unit,card)&&!card.unredirectable&&(!charge.target||charge.target===target.id)&&gameReach(b,card,unit,target)){
        options.push({unit,index,card,charge,designated:!!charge.target});
      }
    }
  }
  options.sort((a,c)=>Number(c.designated)-Number(a.designated)||gameDistance(a.unit,target)-gameDistance(c.unit,target));
  const choice=options[0];
  if(!choice)return false;
  const {unit,index,card,charge}=choice;
  unit.cover.splice(index,1);
  gamePose(b,unit,'guard');
  const ctx=gameContext(unit,card,[target]);
  ctx.discarded=charge.discarded||0;
  ctx.paidHealth=charge.paidHealth||0;
  ctx.paidMind=charge.paidMind||0;
  ctx.mod+=charge.powerBonus||0;
  ctx.powerPercent=charge.powerPercent||0;
  Object.assign(ctx,charge.powerStages);
  ctx.copyId=charge.copyId;
  gameLog(b,unit.name+' · 원호 방어 1 소모 → '+target.name+' 대신 합');
  const incoming=gameEnemyAction(b,attacker,unit,attackCard);
  if(!gameAlive(attacker))return true;
  gameClashEffects(b,ctx,incoming);
  const defense=gameActionPower(b,ctx,attacker),attack=gameActionPower(b,incoming,unit);
  gameLog(b,'합 '+unit.name+' '+defense+' : '+attack+' '+attacker.name+' (원호 방어)');
  ctx.clashDifference=defense-attack;
  unit.clashStreak=defense>attack?(unit.clashStreak||0)+1:0;
  const outcome=defense>attack?'win':defense===attack?'tie':'lose';
  gameTriggers(b,ctx,outcome,attacker);
  gamePassives(b,ctx.actor,outcome,attacker,ctx);
  if(defense<attack)gameHit(b,incoming,attack,true);
  for(const [plan,waiting] of b.waitingCards?.get(unit.id)||[]){
    if(waiting.coverCharge===charge)b.waitingCards.get(unit.id).delete(plan);
  }
  if(gameAlive(unit))gameProof(b,unit,'protect');
  return true;
}
function gameReplacement(b,u,original,plan,moved,originalTargets){
  const before=gameContext(u,original,originalTargets,moved);
  before.targetTile=plan.targetTile;
  for(const target of originalTargets.length?originalTargets:[null])gameTriggers(b,before,'replace',target);
  gamePassives(b,u,'replace',originalTargets[0]||null,before);
  if(!gameAlive(u))return;
  const sources=[original,...(u.passives||[]).map(gamePassiveSource)];
  for(const source of sources){
    const rules=source.effects.filter(effect=>effect.kind==='replaceCard'&&(!effect.fromCardId||gameCardMatches(original,effect.fromCardId)));
    if(!rules.length)continue;
    const ctx=gameContext(u,source,originalTargets,moved);
    ctx.actionCard=original;
    ctx.actionGroups=original.target==='tile'?gameTileGroups(b,original,u,plan.targetTile):null;
    const target=originalTargets.find(unit=>unit.id!==u.id)||
      plan.targets?.map(id=>b.units[id]).find(unit=>gameAlive(unit)&&unit.id!==u.id);
    for(const effect of gameRunBlocks(b,ctx,target,rules)){
      const card=u.library[effect.replacementId];
      if(!card||card.id===original.id||!cardUsable(u,card))continue;
      const nearest=gameAllowedTargets(b,u,card).sort((a,c)=>gameDistance(u,a)-gameDistance(u,c)||a.pos-c.pos);
      const limit=gridTargetLimit(card);
      const guard=card.role==='guard';
      const targetTile=card.target==='tile'?
        [plan.targetTile,...originalTargets.map(unit=>unit.pos),gameChooseTile(b,card,u)]
          .find(tile=>gridValid(tile)&&!b.walls.includes(tile)&&gameReach(b,card,u,{pos:tile})):undefined;
      if(card.target==='tile'&&targetTile==null)continue;
      const targets=card.target==='tile'?gameGroupUnits(gameTileGroups(b,card,u,targetTile)):guard?[u]:u.collapsed&&card.role!=='counter'?collapseTargets(card,u,Object.values(b.units),gameBattleWalls(b)):
        limit?[...new Set([...originalTargets.filter(unit=>nearest.includes(unit)),...nearest])].slice(0,limit):nearest;
      if(!targets.length&&card.target!=='tile')continue;
      const copyId=card.effects.some(row=>row.kind==='copyChosen')?(u.hand.includes(plan.copyId)?plan.copyId:u.hand[0]):null;
      if(card.effects.some(row=>row.kind==='copyChosen')&&!copyId)continue;
      const subject=effect.to==='self'?u:target;
      if(subject)gameApplyEffect(b,ctx,'replace',target,0,effect,subject);
      if(ctx.replaced){
        gameLog(b,u.name+' · '+original.name+' → '+card.name+'으로 발동');
        return {card,targets,copyId,targetTile,protectedId:guard&&original.role==='guard'?plan.targets?.[0]:null};
      }
    }
  }
}
function gamePrepareAction(b,u,plan,moved){
  const waiting=b.waitingCards?.get(u.id);
  waiting?.delete(plan);
  if(!plan?.card||!gameCanPlan(u))return;
  const baseCard=u.library[plan.card];
  const original=plan.targetTile!=null&&gridCanAimTile(baseCard)&&baseCard.target!=='tile'?{...baseCard,target:'tile',clash:false}:baseCard;
  if(!cardUsable(u,original,b.round))return;
  if(u.defenseSkip>0&&!original.freeAction){u.defenseSkip--;gameLog(b,u.name+' · 구르기로 행동 1회 봉쇄');return;}
  const handIndex=gameHandCardIndex(u,original.id,b.round);
  const temporary=handIndex<0;
  if(temporary&&!original.temporary){
    gameLog(b,u.name+' · '+original.name+'이 손패에 없어 행동을 건너뜁니다.');
    return;
  }
  if(!temporary)gameSpliceHand(u,handIndex,1);
  const originalTargets=original.target==='tile'?gameGroupUnits(gameTileGroups(b,original,u,plan.targetTile)):['guard','counter'].includes(original.role)?[u]:u.collapsed?[]:!gridTargetLimit(original)?gameAllowedTargets(b,u,original):plan.targets.map(id=>b.units[id]).filter(v=>gameAlive(v)&&gameReach(b,original,u,v));
  const replacement=original.unredirectable?null:gameReplacement(b,u,original,plan,moved,originalTargets);
  const card=replacement?.card||original;
  const targets=replacement?.targets||originalTargets;
  if(!gameAlive(u)){
    if(!temporary)gamePlaceCards(b,u,'grave',[original.id]);
    return;
  }
  if(card.role!=='assist'){
    gameTriggerCardMark(b,u,card);
    if(!gameAlive(u)){
      if(!temporary)gamePlaceCards(b,u,'grave',[original.id]);
      return;
    }
  }
  gameCollectorUse(b,u);
  const release=applauseAttack(card)&&u.applauseRelease?.round===b.round?u.applauseRelease:null;
  const paid=gameRuleCost(b,u,card);
  if(release)delete u.applauseRelease;
  if(card.cost&&u.ruleHalfCost>=b.round)delete u.ruleHalfCost;
  if(card.cost&&u.scribeDiscount>=b.round)delete u.scribeDiscount;
  if(paid){gameMental(b,u,-paid,true);gameLog(b,u.name+(card.concept?' 개념구':card.refill?' 재작성 카드':' 혹사')+' · 정신력 -'+paid);}
  const ctx=gameContext(u,card,targets,moved);
  ctx.rulePaid=paid;
  ctx.applauseHurt=u.applauseHurt||0;
  if(release){ctx.mod+=release.power;ctx.applauseCrit=release.crit;}
  gameCountCardUse(b,ctx);
  ctx.waitingPlan=plan;
  waiting?.set(plan,ctx);
  if(card.effects.some(effect=>effect.reactionRounds||effect.numberExprs?.reactionRounds)&&u.library[card.id]===card){
    const reactions=u.cardReactions??={};
    if(!card.effects.some(effect=>effect.durationPolicy||effect.durationCap||effect.numberExprs?.durationCap))reactions[card.id]=b.round;
    else{
      const previous=reactions[card.id];
      const windows=typeof previous==='object'?previous:{};
      for(const [index,effect] of card.effects.entries()){
        if(!['struck','hurt'].includes(effect.when))continue;
        const rounds=effect.numberExprs?.reactionRounds?
          bounded(Math.trunc(gameFlowValue(b,ctx,u,effect.numberExprs.reactionRounds)),0,maxStatusRounds):effect.reactionRounds||0;
        if(!rounds)continue;
        const cap=effect.numberExprs?.durationCap?
          bounded(Math.trunc(gameFlowValue(b,ctx,u,effect.numberExprs.durationCap)),0,maxDurationCap):effect.durationCap;
        const old=typeof previous==='number'?previous+rounds-1:windows[index];
        const through=gameRenewThrough(b.round,old,rounds,{...effect,durationCap:cap});
        if(through!==undefined)windows[index]=through;
      }
      reactions[card.id]=windows;
    }
  }
  ctx.originId=original.id;
  if(card.target==='tile'){
    ctx.targetTile=replacement?replacement.targetTile:plan.targetTile;
    ctx.actionGroups=gameActionGroups(b,ctx);
  }
  const baseMod=ctx.mod;
  ctx.temporary=temporary;
  ctx.copyId=replacement?replacement.copyId:plan.copyId;
  ctx.goal=plan.pos;
  ctx.intercept=plan.intercept===true;
  ctx.foeIntent=plan.foeIntent;
  const clashFoe=b.units[plan.foeIntent||'enemy'];
  ctx.clash=plan.clash&&gameAlive(clashFoe)&&(!replacement||card.clash&&targets.includes(clashFoe))&&gameReach(b,card,u,clashFoe);
  gameLog(b,u.name+' · '+(card.gmOnly?(card.publicName||'숨겨진 카드'):card.name));
  if(card.role!=='assist')gamePassives(b,u,'use',targets[0]||null,ctx);
  if(card.role==='guard'){
    u.guardRound=b.round;
    const protectedId=(replacement?replacement.protectedId:plan.targets?.[0])||null;
    ctx.coverCharge={card:card.id,target:protectedId,copyId:ctx.copyId};
    (u.cover??=[]).push(ctx.coverCharge);
    gameLog(b,u.name+' · 원호 방어 1 획득 (보유 '+u.cover.length+') · '+(protectedId?b.units[protectedId].name+' 지정':'자동'));
  }
  if(card.role==='counter'){
    const planned=b.counterPlans.get(u.id)??[];
    planned.push(ctx);
    b.counterPlans.set(u.id,planned);
    gameLog(b,u.name+' · 반격 준비');
  }
  if((!u.collapsed&&card.role!=='assist')||['guard','counter'].includes(card.role)){
    if(card.role==='counter')gameTriggers(b,ctx,'use',u);
    else if(targets.length){for(const target of targets)gameTriggers(b,ctx,'use',target);}
    else gameTriggers(b,ctx,'use',null);
  }
  if(card.role==='guard'){
    const charge=u.cover.at(-1);
    charge.discarded=ctx.discarded;
    charge.paidHealth=ctx.paidHealth;
    charge.paidMind=ctx.paidMind;
    charge.powerBonus=ctx.mod-baseMod;
    charge.powerPercent=ctx.powerPercent||0;
    charge.powerStages=Object.fromEntries(stagedPowerEffects.flatMap(kind=>[kind,kind+'Percent']).filter(key=>ctx[key]).map(key=>[key,ctx[key]]));
  }
  return ctx;
}
function gameEnemyReady(b){
  if(b.units.enemy.defenseSkip>0)return false;
  if(gameIsBright(b)&&brightScripted.has(b.intent.card.id))return false;
  if(gameIsRail(b)||gameIsFirstStop(b)||gameIsCollector(b)&&b.encounter.breakRound===b.round)return false;
  const enemy=b.units.enemy,target=b.units[b.intent.target];
  return gameAlive(enemy)&&gameActionLimit(enemy)>0&&gameAlive(target)&&gameReach(b,b.intent.card,enemy,target);
}
function gameResolveClash(b,duelist,enemy,target,attackCard){
  b.shock={};
  if(duelist.intercept)gameLog(b,duelist.actor.name+' · '+target.name+'의 예고 공격 가로채기');
  const incoming=gameEnemyAction(b,enemy,duelist.intercept?duelist.actor:target,attackCard);
  if(!gameAlive(enemy))return true;
  gameClashEffects(b,duelist,incoming);
  const ours=gameActionPower(b,duelist,enemy),theirs=gameActionPower(b,incoming,duelist.actor);
  gameLog(b,'합 '+duelist.actor.name+' '+ours+' : '+theirs+' '+enemy.name.replace(/^존속의 /,''));
  duelist.clashDifference=ours-theirs;
  const win=ours>theirs, tie=ours===theirs;
  if(win||tie)gameProof(b,duelist.actor,'face');
  duelist.actor.clashStreak=win?(duelist.actor.clashStreak||0)+1:0;
  const outcome=win?'win':tie?'tie':'lose';
  gameTriggers(b,duelist,outcome,enemy);
  gamePassives(b,duelist.actor,outcome,enemy,duelist);
  if(win){gameHit(b,duelist,ours);if(target!==duelist.actor&&duelist.actor.zero!=='crisis')gameMental(b,duelist.actor,5);}
  if(!win&&!tie){
    gameHit(b,incoming,theirs);
    if(duelist.minimumHitRolls&&gameAlive(duelist.actor)){
      duelist.hitRolls=duelist.minimumHitRolls;
      const minimum=duelist.hitRolls.reduce((sum,value)=>sum+value,0);
      gameLog(b,duelist.actor.name+' · 저지불가 발동 · 최소 위력 '+minimum);
      b.shock={};
      gameHit(b,duelist,minimum);
    }
  }
  duelist.done=true;
  b.waitingCards?.get(duelist.actor.id)?.delete(duelist.waitingPlan);
}
function gameRailResolve(b,contexts){
  const pending=b.intentQueue;
  const order=Object.keys(b.plans);
  const party=()=>Object.values(b.units).filter(unit=>!unit.enemy&&gameAlive(unit));
  const run=(intent,extra=false)=>{
    const foe=b.units[intent.attacker], target=b.units[intent.target], card=intent.card;
    if(!gameAlive(foe)||foe.blockedRounds||!party().length)return;
    b.shock={};
    gameLog(b,foe.name+' · '+card.name+(extra?' · 추가 행동':''));
    if(card.id==='railSignal'){
      for(const ally of b.foeOrder.slice(1)){
        if(gameAlive(b.units[ally]))run(gameRailIntent(b,b.units[ally],party()),true);
      }
      return;
    }
    if(card.id==='railWall'){
      gameEnemyAction(b,foe,foe,card);
      return;
    }
    if(!gameAlive(target))return;
    if(!gameReach(b,card,foe,target)){
      if(!foe.rooted)gameMove(b,foe,target.pos,b.encounter.leaderDownRound<b.round&&foe.id!=='enemy'?1:2,true);
      if(!gameReach(b,card,foe,target))return;
    }
    const duelist=card.support||extra?null:contexts.filter(ctx=>ctx.clash&&!ctx.done&&gameAlive(ctx.actor)&&
      ctx.foeIntent===intent.id&&gameReach(b,ctx.card,ctx.actor,foe)&&
      (ctx.actor===target||!card.unredirectable)&&gameReach(b,card,foe,ctx.actor))
      .sort((a,c)=>order.indexOf(a.actor.id)-order.indexOf(c.actor.id))[0];
    if(duelist){gameResolveClash(b,duelist,foe,target,card);return;}
    if(card.id==='railScope'){gameEnemyAction(b,foe,target,card);return;}
    if(!extra&&gameCover(b,foe,target,card))return;
    const incoming=gameEnemyAction(b,foe,target,card);
    if(gameAlive(foe))gameUnopposedAttack(b,incoming);
  };
  for(const intent of pending)run(intent);
  for(const ctx of contexts.filter(ctx=>ctx.clash&&!ctx.done&&gameAlive(ctx.actor)))gameUnopposedAttack(b,ctx);
}
function gameResolveWave(b,contexts,countered){
  const resolveCollapseCard=ctx=>{
    const {actor,card}=ctx;
    ctx.targets=collapseTargets(card,actor,Object.values(b.units),gameBattleWalls(b));
    if(ctx.targets.length)gameLog(b,actor.name+' · 붕괴 자동 표적 → '+ctx.targets.map(v=>v.name).join(', '));
    else gameLog(b,actor.name+' · 사거리 안에 붕괴 표적이 없습니다.');
    for(const victim of ctx.targets)gameTriggers(b,ctx,'use',victim);
  };
  const enemy=b.units.enemy,target=b.units[b.intent.target];
  const confirmed=Object.keys(b.plans);
  const duelist=contexts.filter(ctx=>ctx.clash&&gameAlive(ctx.actor)&&!['guard','assist','counter'].includes(ctx.card.role)&&
    (!ctx.intercept||!b.intent.card.unredirectable&&gameReach(b,b.intent.card,enemy,ctx.actor)))
    .sort((a,c)=>confirmed.indexOf(a.actor.id)-confirmed.indexOf(c.actor.id))[0];
  if(!countered&&duelist&&gameEnemyReady(b)){
    gameResolveClash(b,duelist,enemy,target,b.intent.card);
    countered=true;
  }
  const penalized=ctx=>Number(ctx.actor.guestPenalty?.card===ctx.card.id&&ctx.actor.guestPenalty.through>=b.round);
  for(const ctx of contexts.filter(c=>!c.done&&!(gameIsRail(b)&&c.clash)&&!['guard','assist','counter'].includes(c.card.role)).sort((a,c)=>Number(!!c.card.firstStrike)-Number(!!a.card.firstStrike)||penalized(a)-penalized(c))){
    if(!gameAlive(ctx.actor))continue;
    if(ctx.actor.collapsed&&ctx.card.target!=='tile')resolveCollapseCard(ctx);
    b.shock={};gameUnopposedAttack(b,ctx);
  }
  const alliedHit=b.allyHit;
  for(const ctx of contexts.filter(c=>c.card.role==='assist')){
    if(!alliedHit||!gameAlive(ctx.actor))continue;
    if(ctx.actor.collapsed&&ctx.card.target!=='tile')resolveCollapseCard(ctx);
    const tile=ctx.card.target==='tile';
    if(tile){
      ctx.actionGroups=gameActionGroups(b,ctx);
      ctx.targets=gameGroupUnits(ctx.actionGroups);
    }
    ctx.triggered=ctx.targets.some(v=>gameAlive(v)&&(tile||gameReach(b,ctx.card,ctx.actor,v)));
    if(ctx.triggered){
      b.shock={};gameLog(b,ctx.actor.name+' 원호 공격');
      gameTriggerCardMark(b,ctx.actor,ctx.card);
      if(!gameAlive(ctx.actor))continue;
      gamePassives(b,ctx.actor,'use',ctx.targets[0],ctx);
      if(!ctx.actor.collapsed)gameTriggers(b,ctx,'use',ctx.targets[0]);
      gameUnopposedAttack(b,ctx);
    }
  }
  return countered;
}
function gamePlanningEffects(b,party){
  const candidates=party.filter(unit=>gameCanPlan(unit)&&b.plans[unit.id]).map(unit=>{
    const choices=gamePlannedCards(b.plans[unit.id]).flatMap(plan=>{
      const card=unit.library[plan.card];
      if(!cardUsable(unit,card))return [];
      const targets=card.target==='tile'||plan.targetTile!=null&&gridCanAimTile(card)?gameGroupUnits(gameTileGroups(b,card,unit,plan.targetTile)):
        card.target==='self'?[unit]:(plan.targets||[]).map(id=>b.units[id]).filter(gameAlive);
      return [{card,targets,targetTile:plan.targetTile}];
    });
    return {unit,choices};
  });
  for(const when of planningTimings){
    for(const {unit,choices} of candidates){
      if(!gameAlive(unit))continue;
      for(const {card,targets,targetTile} of choices){
        if(!gameAlive(unit))break;
        const ctx=gameContext(unit,card,targets);
        ctx.targetTile=targetTile;
        for(const target of targets.length?targets:[null])gameTriggers(b,ctx,when,target);
        if(when==='decide')gamePassives(b,unit,when,targets[0]||null,ctx);
      }
      if(when==='confirm'){
        const first=choices[0];
        const ctx=gameContext(unit,first?.card,first?.targets||[]);
        ctx.targetTile=first?.targetTile;
        gamePassives(b,unit,when,first?.targets[0]||null,ctx);
      }
    }
  }
}
function gameResolve(b) {
  const enemy=b.units.enemy;
  const party=Object.values(b.units).filter(u=>!u.enemy&&gameAlive(u));
  b.allyHit=false;
  b.resolving=true;
  b.proofs=new Set();
  b.moved=new Set();
  b.fieldPaths=new Map();
  b.guestActions=[];
  b.exposedToAttack=new Set();
  b.poses=[];
  for(const unit of Object.values(b.units))unit.pose=unit.hp?'idle':'down';
  gameLog(b,'라운드 '+b.round+' 처리');
  for(const u of party)if(u.bot&&!b.plans[u.id]){
    if(gameCanPlan(u))b.plans[u.id]=gameBotTurn(b,u);
  }
  b.shock={};
  gamePlanningEffects(b,party);
  b.waitingCards=new Map(party.map(u=>[u.id,new Map(gamePlannedCards(b.plans[u.id])
    .filter(plan=>plan.card&&u.library[plan.card])
    .map(plan=>[plan,{card:u.library[plan.card]}]))]));
  const contexts=[],movedThisTurn=new Map();
  b.counterPlans=new Map();
  for(const u of party) {
    const plan=b.plans[u.id];
    if(!gameAlive(u))continue;
    if(u.blockedRounds)continue;
    if(u.zero==='pending'){
      const candidates=Object.values(b.units).filter(v=>v!==u&&gameAlive(v));
      if(candidates.length){
        const near=Math.min(...candidates.map(v=>gameDistance(v,u)));
        const nearest=candidates.filter(v=>gameDistance(v,u)===near);
        const victim=nearest[gameRoll(nearest.length)-1];
        b.shock={};gameLog(b,u.name+' 폭주 → '+victim.name);
        const {bonus,faces}=gameRollPower(gameRampage.power);
        gameDamage(b,victim,Math.max(0,faces.reduce((sum,face)=>sum+face,bonus)-5),u,false,false,false,{kind:'strike'});
      }
      u.zero='spent';
      continue;
    }
    if(!gameCanPlan(u)||!plan)continue;
    if(u.zero==='crisis'){
      if(!plan.vow)continue;
      u.crisisVow??=plan.vow;
    }
    const moved=gameMove(b,u,plan.pos,u.move,true);
    if(moved)gameLog(b,u.name+' 이동 ' + moved + '칸');
    if(u.pos!==plan.pos)gameLog(b,u.name+' · 이동 경로가 막혀 예정 위치에 도착하지 못했습니다.');
    u.move-=moved;
    movedThisTurn.set(u.id,moved);
    u.movedLast=moved;
    const ctx=gamePrepareAction(b,u,gamePlannedCards(plan)[0],moved);
    if(ctx)contexts.push(ctx);
  }
  let countered=gameResolveWave(b,contexts,false);
  const slots=Math.max(0,...party.map(u=>gamePlannedCards(b.plans[u.id]).length));
  for(let slot=1;slot<slots;slot++){
    const wave=[];
    for(const u of party){
      if(!movedThisTurn.has(u.id))continue;
      const ctx=gamePrepareAction(b,u,gamePlannedCards(b.plans[u.id])[slot],movedThisTurn.get(u.id));
      if(ctx)wave.push(ctx);
    }
    contexts.push(...wave);
    countered=gameResolveWave(b,wave,countered);
  }
  const target=b.units[b.intent.target];
  if(gameIsRail(b))gameRailResolve(b,contexts);
  else if(!countered&&gameEnemyReady(b)){
    b.shock={};
    if(!gameCover(b,enemy,target)){
      const incoming=gameEnemyAction(b,enemy,target);
      if(gameAlive(enemy))gameUnopposedAttack(b,incoming);
    }
  } else if(!countered&&gameAlive(enemy)&&!gameIsBright(b))gameLog(b,'집행체의 공격이 사거리 또는 대상 조건을 잃었습니다.');
  if(gameIsBright(b))gameBrightResolve(b);
  for(const reaction of [...b.counterPlans.values()].flat()){
    if(gameAlive(reaction.actor))gameLog(b,reaction.actor.name+' · 반격 조건 미충족');
  }
  delete b.counterPlans;
  delete b.waitingCards;
  for(const ctx of contexts){
    if(ctx.card.role==='assist'&&!ctx.triggered){if(!ctx.temporary)gamePlaceCards(b,ctx.actor,'hand',[ctx.originId||ctx.card.id]);}
    else gameFinishCard(b,ctx);
  }
  for(const ctx of contexts){
    if(ctx.card.role==='assist'&&!ctx.triggered)continue;
    ctx.actor.lastCardRound=b.round;
    ctx.actor.lastCardRole=ctx.card.role;
  }
  if(gameIsFirstStop(b)){
    b.encounter.attackers=contexts.filter(ctx=>!ctx.actor.enemy&&!['assist','guard','counter'].includes(ctx.card.role)&&
      ctx.card.target!=='self'&&ctx.card.targetSide!=='ally').map(ctx=>ctx.actor.id);
    gameStopAction(b,enemy,party);
    b.encounter.lastDamage=b.encounter.damage;
    b.encounter.damage=0;
  }
  gameDeckEffects(b,'turnEnd');
  gameFieldRound(b,'turnEnd');
  for(const unit of Object.values(b.units).filter(gameAlive))gameItchRound(b,unit,'turnEnd');
  gameAttendanceEnd(b);
  gameApplauseRound(b,'turnEnd');
  if(enemy.defenseSkip>0)enemy.defenseSkip--;
  if(gameIsRail(b)){
    const alive=party.filter(gameAlive);
    const inspection=alive.length>0&&alive.every(unit=>gridPoint(unit.pos).x===2)&&
      !contexts.some(ctx=>ctx.card.target!=='self'&&ctx.card.targetSide!=='ally'&&!['assist','guard','counter'].includes(ctx.card.role));
    b.encounter.inspection=inspection?(b.encounter.inspection||0)+1:0;
  }
  if(gameIsJudge(b))b.encounter.level=party.some(unit=>gameAlive(unit)&&unit.judgmentMark)&&
    !contexts.some(ctx=>ctx.card.target!=='self'&&ctx.card.targetSide!=='ally'&&!['assist','guard','counter'].includes(ctx.card.role));
  if(gameIsCollector(b))gameCollectorEndRound(b,party);
  else for(const unit of party)if(unit.stacks['미수금']>0){
    gameDamage(b,unit,unit.stacks['미수금'],unit,false,false,true,{kind:'stack',ongoing:true});
    gameWriteStacks(unit,'미수금',[]);
  }
  for(const u of Object.values(b.units).filter(gameAlive)){
    b.shock={};
    gameBasicStackDamage(b,u,'turnEnd');
    if(!gameAlive(u))continue;
    for(const [id,state] of Object.entries(u.cardReactions||{})){
      if(typeof state==='object'){
        for(const [index,through] of Object.entries(state))if(through<=b.round)delete state[index];
        if(!Object.keys(state).length)delete u.cardReactions[id];
      }else if(!u.library[id]?.effects.some(effect=>state+(effect.numberExprs?.reactionRounds?maxStatusRounds:effect.reactionRounds||0)>b.round+1)){
        delete u.cardReactions[id];
      }
    }
    for(const strike of u.delayedStrike||[]){
      if(strike.round>b.round||!gameAlive(u))continue;
      b.shock={};
      gameLog(b,u.name+' · 지연 타격 '+strike.amount+' 발동');
      gameDamage(b,u,strike.amount,b.units[strike.source]||u,false,false,false,{kind:strike.kind||'other',ongoing:true});
    }
    if(u.delayedStrike)u.delayedStrike=u.delayedStrike.filter(strike=>strike.round>b.round);
    if(!gameAlive(u))continue;
    if(u.lethalGuard)u.lethalGuard=0;
    for(const key of ['outgoingDamage','incomingDamage','outgoingDamagePercent','incomingDamagePercent','barrierBurst','deferrals','afterimage'])delete u[key];
    for(const kind of bossDamageModifiers){delete u[kind];delete u[kind+'Percent'];}
    if(u.damageDebt?.length){
      const sources=u.damageDebt.filter(entry=>entry.round<=b.round);
      const amount=sources.reduce((total,entry)=>total+entry.amount,0);
      u.damageDebt=u.damageDebt.filter(entry=>entry.round>b.round);
      if(amount){
        b.shock={};
        gameLog(b,u.name+' · 유예 피해 '+amount+' 정산');
        gameDamage(b,u,amount,u,true,false,true,{kind:'other',ongoing:true,sources});
      }
    }
    if(u.temporaryShield)gameExpireShields(u,slot=>slot.temporary);
    const poison=gamePoisonAmount(u);
    if(poison){
      b.shock={};
      gameLog(b,u.name+' · 지속 피해 '+poison);
      const legacy=u.poisonSources||[];
      const untracked=(u.poison||0)-legacy.reduce((sum,entry)=>sum+entry.amount,0);
      const sources=[...legacy,...(u.damageOverTime||[]),{amount:untracked}].filter(entry=>entry.amount>0);
      gameDamage(b,u,poison,u,true,false,false,{kind:'other',ongoing:true,sources});
      if(u.poison)gameRemoveLegacyPoison(u,1);
      if(u.damageOverTime)u.damageOverTime=u.damageOverTime.filter(dot=>dot.through>b.round);
    }
    if(b.encounter&&b.zones.includes(u.pos)&&gameAlive(u))gameMental(b,u,2);
    if(u.stacks['죄책감']>0&&gameAlive(u))gameMentalDamage(b,u,3,u,{kind:'stack',ongoing:true});
    if(u.regen&&gameAlive(u)){gameHeal(b,u,u.regen);u.regen--;}
    delete u.dodge;delete u.trueStrike;delete u.stackWard;
    if(u.healCuts)u.healCuts=u.healCuts.filter(entry=>entry.through>b.round);

  }
  for(const u of party){
    if(gameAlive(u)){
      gameMental(b,u,gameMindStatus(b,u,'mindRegen'));
      const burn=u.mindStatuses?.mindBurn;
      if(burn?.through>=b.round)gameMentalDamage(b,u,burn.amount,b.units[burn.dealer]||u,
        {...(burn.origin||{kind:'other'}),ongoing:true});
    }
    if(gameAlive(u)&&!u.awakening&&u.mind>0&&u.mind<=mentalCrisisThreshold&&(u.temptation||0)>=temptationLimit){
      gameMental(b,u,-temptationStrain);
      gameLog(b,u.name+' · 심마의 압박 (정신력 −'+temptationStrain+')');
    }
    if(gameAlive(u)&&u.zero==='crisis'){
      if(b.exposedToAttack.has(u.id)&&!b.moved.has(u.id))gameProof(b,u,'endure');
      if(b.proofs.has(u.id)){
        u.crisisProofs=(u.crisisProofs||0)+1;
        gameLog(b,u.name+' · 뜻을 지킴 ('+u.crisisProofs+'/'+crisisRounds+')');
      }else if(u.crisisVow){
        u.crisisProofs=0;
        gameLog(b,u.name+' · 이번 라운드에 지킬 뜻을 증명하지 못했습니다.');
      }
      if(u.crisisProofs>=crisisRounds)gameAwaken(b,u,crisisRecovery);
      else if(b.round>=u.collapseRound)gameConceptualize(b,u);
    }
    gameHandCleanup(b,u,b.plans[u.id]?.discard);
    if(u.zero==='spent'){
      if(u.zeroRound!==undefined&&u.zeroRound<b.round&&gameAlive(u))gameConceptualize(b,u);
      else u.zeroRound=b.round;
    } else delete u.zeroRound;
    u.rooted=!!u.rootNext;
    u.move=u.rooted?0:bounded((u.combat?.movement??2)+u.nextMove+(gameHeldModifiers(b,u,null).moveMod||0),0,7);
    u.rootNext=false;u.nextMove=0;

  }
  for(const unit of Object.values(b.units)){
    if(unit.shieldSlots?.some(slot=>slot.through!=null&&slot.through<=b.round))
      gameExpireShields(unit,slot=>slot.through!=null&&slot.through<=b.round);
    for(const [kind,status] of Object.entries(unit.mindStatuses||{})){
      if(status.through<=b.round)delete unit.mindStatuses[kind];
    }
    unit.bonusActions=unit.nextActions||0;
    unit.actionPenalty=unit.nextActionPenalty||0;
    if(unit.sealedHighest?.round<=b.round)delete unit.sealedHighest;
    unit.blockedRounds=unit.nextBlockedRounds??Math.max(0,(unit.blockedRounds||0)-1);
    delete unit.nextActions;
    delete unit.nextActionPenalty;
    delete unit.nextBlockedRounds;
  }
  delete b.shock;
  delete b.resolving;
  delete b.proofs;
  delete b.moved;
  delete b.fieldPaths;
  delete b.guestActions;
  delete b.exposedToAttack;
  for(const unit of Object.values(b.units))if(unit.lifeSteal){
    for(const [key,rule] of Object.entries(unit.lifeSteal))if(rule.through!=null&&rule.through<=b.round)delete unit.lifeSteal[key];
    if(!Object.keys(unit.lifeSteal).length)delete unit.lifeSteal;
  }
  for(const unit of Object.values(b.units)){
    for(const name of Object.keys(unit.stacks)){
      const trait=basicStacks[name];
      if(!trait?.endDecay||trait.sub&&!unit.stackTraits?.[name]?.sub)continue;
      gameTakeStacks(unit,name,trait.endDecay);
    }
  }
  if(b.extraWalls)b.extraWalls=b.extraWalls.filter(wall=>wall.through>b.round);
  if(b.tiles)for(const [pos,tile] of Object.entries(b.tiles))if(tile.through<=b.round)delete b.tiles[pos];
  for(const entity of Object.values(b.units))if(entity.enemy)gameObserve(b,entity,10);
  b.round++;
  gameNext(b);
}
function gameReturnToTrain(b,state){
  for(const unit of Object.values(b.units)){
    if(unit.enemy)continue;
    if(unit.collapsed){
      delete unit.brainwashed;
      unit.collapsed=false;
      unit.mind=trainReturnMind;
      gameClearCrisis(b,unit);
      gameLog(b,unit.name+' · 열차 복귀 · 정신력 '+trainReturnMind+'로 회복');
    }
    const returning=gameContext(unit,{id:'trainReturn',effects:[]},[]);
    gamePassives(b,unit,'trainReturn',null,returning);
    if(unit.bot)continue;
    const profile=state.profiles[unit.id]??={cards:[],deck:[]};
    profile.mind=unit.mind;
    profile.collapsed=false;
    if(b.outcome?.kind==='seized')profile.debt=1;
    if(b.outcome?.kind==='break')profile.guilt=unit.stacks['죄책감']||0;
    if(b.outcome?.kind==='peace')profile.guilt=0;
    if(b.outcome?.orb)profile.orbs=[...new Set([...(profile.orbs||[]),b.outcome.orb])];
  }
  gameCheckpoint(state,b);
}
function gameAwaiting(b,members){
  return Object.values(b.units).filter(u=>!u.bot&&gameCanPlan(u)&&!b.plans[u.id]&&members.some(m=>m.id===u.id));
}

function gameUnitIntelDetail(b,unit,tier,manager,passives){
  const detail={};
  if(tier>=1)detail.stats={hp:unit.hp,maxHp:unit.maxHp,move:unit.move,actions:gameActionLimit(unit)};
  if(tier>=2){
    const deck=unit.enemy?(b.foeDecks?.[unit.id]||(unit.id==='enemy'?b.foeDeck:null)):null;
    const catalog=gameIsBright(b)?brightCards:gameIsJudge(b)?judgeCards:gameIsCollector(b)?collectorCards:gameIsRail(b)?railCards:firstStopCards;
    const current=(b.intentQueue||[b.intent]).filter(intent=>(intent?.attacker||'enemy')===unit.id).map(intent=>intent?.card).filter(Boolean);
    const cards=deck?deck.cards.map(id=>unit.library[id]||catalog[id]).filter(Boolean):
      [...(unit.configuredDeck||[]),...(unit.hand||[]),...(unit.grave||[])].map(id=>unit.library[id]).filter(Boolean);
    const unique=new Map([...cards,...current].map(card=>[card.id,card]));
    detail.actions=[...unique.values()].filter(card=>manager||!card.gmOnly).map(card=>gameRevealCard(card,tier));
  }
  if(tier>=3){
    detail.passives=(passives||[]).filter(passive=>manager||!passive.gmOnly);
    // The combat engine currently does not apply mental resource changes to enemy units.
    detail.mind={managed:!unit.enemy,...(!unit.enemy?{value:unit.mind}: {})};
  }
  return detail;
}
function gameView(state,revision,actor,manager,members) {
  const b=state.battle;
  const revealIntent=entry=>({...entry,card:gameRevealCard(entry.card,manager?3:b.intel?.[entry.attacker||'enemy']?.tier??0)});
  const intent=b?.intent&&revealIntent(b.intent);
  const battle=b?{round:b.round,phase:b.phase,result:b.result,intent,
    ...(b.intentQueue?{intentQueue:b.intentQueue.map(revealIntent),aimLine:b.aimLine}:{}),
    allyActions:Object.entries(b.plans||{}).flatMap(([id,plan])=>gamePlannedCards(plan).flatMap((action,index)=>{
      const unit=b.units[id],card=unit?.library[action.card];
      return card&&!unit.enemy?[{id:'ally:'+id+':'+index,attacker:id,card:gameRevealCard(card,3),
        targets:action.targets||[],target:action.targets?.[0],targetTile:action.targetTile,clash:action.clash,actionLink:action.actionLink,foeIntent:action.foeIntent}]:[];
    })),
    ...(b.encounter?{encounter:{id:b.encounter.id,name:b.encounter.name,peace:b.encounter.peace,peaceOpen:b.encounter.peaceOpen,
      deckSize:b.foeDeck.cards.length,subdueOrder:b.encounter.subdueOrder,rank:Array.isArray(b.encounter.rank)?b.encounter.rank:undefined,difficulty:b.encounter.difficulty??(typeof b.encounter.rank==='string'?b.encounter.rank:undefined),negotiating:b.encounter.breakRound===b.round,...(gameIsBright(b)&&(manager||b.encounter.stage>1)?{stage:b.encounter.stage}:{})},zones:b.zones,outcome:b.outcome}:{}),log:gameVisibleLog(b.log,manager),walls:b.walls,extraWalls:b.extraWalls,tiles:b.tiles,poses:b.poses||[],
    awaiting:gameActive(b)?gameAwaiting(b,members).map(u=>u.name):[],clashActor:Object.keys(b.plans||{}).find(id=>gameHasClash(b.plans[id])),
    units:Object.values(b.units).map(({library,hand,deck,grave,exile,cover,effectUsage,passives,cardMarks,configuredDeck,lifeSteal,poisonSources,shieldSlots,queuedShields,activityLocations,locationTags,stackTraits,stackDefinitions,sealedHighest,stackRuns,damageDebt,damageOverTime,delayedStrike,controlledIndex,controlledPower,cardUseCounts,keywordUses,...unit})=>({
      ...unit,
      ...(!unit.enemy||manager||b.intel?.[unit.id]?.tier===3?{stackTraits,stackDefinitions}:{}),
      ...(unit.enemy?{
        enemyIntel:gameUnitIntelDetail(b,{...unit,library,configuredDeck},manager?3:b.intel?.[unit.id]?.tier??0,manager,passives),
        intelProgress:b.intel?.[unit.id]?.progress??0,overlapCount:b.intel?.[unit.id]?.overlap??0,
        revealTier:gameRevealTier(b.intel?.[unit.id]?.progress??0),locationTagCount:locationTags?.length??0,
        revealNext:revealThresholds[b.intel?.[unit.id]?.tier??0]??100,
        ...(manager||b.intel?.[unit.id]?.tier>=1?{locationTags}:{})
      }:{}),
      ...(!unit.enemy?{allyIntel:gameUnitIntelDetail(b,{...unit,library,configuredDeck,hand,grave},3,manager,passives)}:{}),
      ...(shieldSlots?.length?{shieldSlots:shieldSlots.map(({amount,through,temporary,cap})=>({amount,through,temporary,cap}))}:{}),
      ...(stackRuns?{stackRuns:Object.fromEntries(Object.entries(stackRuns).filter(([,runs])=>runs.some(run=>run.power!==1||run.count===0)).map(([tag,runs])=>[tag,runs.map(({count,power})=>({count,power}))]))}:{}),
      ...(damageDebt?{damageDebt:damageDebt.map(({round,amount})=>({round,amount}))}:{}),
      ...(damageOverTime?{damageOverTime:damageOverTime.map(({through,amount})=>({through,amount}))}:{}),
      ...(delayedStrike?{delayedStrike:delayedStrike.map(({round,amount,source})=>({round,amount,source}))}:{}),
      ...(lifeSteal?{damageConversions:Object.values(lifeSteal).map(rule=>({shield:!!rule.shieldConversion,through:rule.through})),
        lifeStealThrough:Math.max(...Object.values(lifeSteal).map(rule=>rule.through??0))}:{}),
      passiveNames:!unit.enemy||manager||b.intel?.[unit.id]?.tier===3?(passives||[]).map(passive=>passive.name):[],actionLimit:gameActionLimit(unit),coverCount:cover?.length||0,handCount:hand.length,deckCount:deck.length,graveCount:grave.length,exileCount:exile.length,ready:!!b.plans?.[unit.id],artVersion:state.profiles[unit.id]?.artVersion||0,artSlots:Object.keys(state.profiles[unit.id]?.art||{}),...(unit.id===actor?{cardMarks,sealedHighest,combatRound:b.round,hand:[...hand.map(id=>({...library[id],requiredState:cardState(library[id].requiredState)})),...(unit.collapsed?[gameCollapseCard]:unit.zero==='crisis'?gameCrisisCards:[])],plan:b.plans?.[actor]}:{})}))
  }:null;
  return {revision,manager,me:actor,roster:members.filter(m=>m.seat>0),profile:{name:'',country:'제4국',status:'하위층 시민',wall:'',job:'',goal:'',concept:'',stats:[50,50,50,50,50,50],mind:50,cards:[],deck:[],...state.profiles[actor]},defaults:gameCatalogue,battle};
}
const gameSaveFormat='conceptterra-campaign-save';
const gameSaveVersion=2;
function gameSaveSnapshot(state){
  const battle=state.battle?structuredClone(state.battle):null;
  if(battle?.resolving)gameFail('라운드 판정이 끝난 뒤 저장하세요.');
  if(battle)delete battle.pendingEdits;
  const party=Object.fromEntries(Object.entries(state.profiles).map(([id,profile])=>[
    id,{mind:profile.mind,orbs:profile.orbs,guilt:profile.guilt,debt:profile.debt,collapsed:profile.collapsed}
  ]));
  return {saveVersion:gameSaveVersion,battle,campaign:state.campaign??null,party};
}
function gameLoadSnapshot(state,snapshot,members){
  if(!snapshot||snapshot.saveVersion!==gameSaveVersion||!snapshot.party)
    gameFail('이 버전에서는 해당 저장 파일을 열 수 없어요.');
  const memberIds=new Set(members.map(member=>member.id));
  if(snapshot.battle&&Object.values(snapshot.battle.units).some(unit=>!unit.bot&&!unit.enemy&&!memberIds.has(unit.id)))
    gameFail('저장 당시 승객이 이 방에 있어야 전투를 이어갈 수 있어요.');
  const live=state.campaign, saved=snapshot.campaign;
  const liveLosses=live?.lostCards||[], savedLosses=saved?.lostCards||[];
  const mismatch=liveLosses.length!==savedLosses.length||liveLosses.some((entry,index)=>
    entry.cardId!==savedLosses[index]?.cardId||entry.actor!==savedLosses[index]?.actor||entry.replacedBy!==savedLosses[index]?.replacedBy);
  if(mismatch&&(liveLosses.length||savedLosses.length))
    gameFail('이 저장은 현재 소실 장부와 달라 불러올 수 없어요. 열차 책갈피에서 회귀를 사용하세요.');
  state.battle=snapshot.battle;
  state.campaign=saved;
  if(live&&saved){
    saved.memory??={intel:{}};
    saved.memory.intel??={};
    for(const [key,value] of Object.entries(live.memory?.intel||{}))
      saved.memory.intel[key]=Math.max(saved.memory.intel[key]||0,value);
  }
  for(const [id,details] of Object.entries(snapshot.party)){
    if(!memberIds.has(id))continue;
    const profile=state.profiles[id]??={cards:[],deck:[]};
    for(const key of ['mind','orbs','guilt','debt','collapsed']){
      if(Object.hasOwn(details,key))profile[key]=details[key];
      else delete profile[key];
    }
  }
}
function gameSaveBase64(bytes){
  let value='';
  for(let offset=0;offset<bytes.length;offset+=8192)value+=String.fromCharCode(...bytes.subarray(offset,offset+8192));
  return btoa(value);
}
const gameSaveBytes=value=>Uint8Array.from(atob(value),character=>character.charCodeAt(0));
async function gameSaveKey(db,roomCode){
  let row=await query(db,'SELECT secret FROM campaign_save_keys WHERE room_code = ?',roomCode).first();
  if(!row){
    await query(db,'INSERT OR IGNORE INTO campaign_save_keys(room_code,secret) VALUES (?,?)',roomCode,
      gameSaveBase64(crypto.getRandomValues(new Uint8Array(32)))).run();
    row=await query(db,'SELECT secret FROM campaign_save_keys WHERE room_code = ?',roomCode).first();
  }
  return crypto.subtle.importKey('raw',gameSaveBytes(row.secret),'AES-GCM',false,['encrypt','decrypt']);
}
async function gameExportSave(db,roomCode,snapshot){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await gameSaveKey(db,roomCode);
  const buffer=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(snapshot)));
  return {format:gameSaveFormat,saveVersion:gameSaveVersion,room:roomCode,iv:gameSaveBase64(iv),data:gameSaveBase64(new Uint8Array(buffer))};
}
async function gameImportSave(db,roomCode,file){
  if(file?.format!==gameSaveFormat||file.saveVersion!==gameSaveVersion||file.room!==roomCode||
    typeof file.iv!=='string'||typeof file.data!=='string')gameFail('이 방에서 만든 현재 버전의 저장 파일을 선택하세요.');
  try{
    const key=await gameSaveKey(db,roomCode);
    const decoded=await crypto.subtle.decrypt({name:'AES-GCM',iv:gameSaveBytes(file.iv)},key,gameSaveBytes(file.data));
    return JSON.parse(new TextDecoder().decode(decoded));
  }catch{gameFail('저장 파일을 인증할 수 없어요. 내보낸 파일을 다시 선택하세요.');}
}
const gameDialogueFoeKey=(battle,unit)=>[battle.encounter?.id||'practice',unit.id].join(':');
async function gameApi(db,room,actor,input,artQuery,account=null,collectionId=null,studio=false){
  const {results:members}=await query(db,'SELECT id, name, seat, collection_id, account_collection_id FROM members WHERE room_code = ? ORDER BY seat, joined_at',room.code).all();
  const self=members.find(m=>m.id===actor);
  if(collectionId)self.collection_id=collectionId;
  if(!self)return error('먼저 방에 참가해 주세요.',401);
  const manager=actor===room.owner_id||self.seat===0;
  const current=await query(db,'SELECT revision, state FROM game_states WHERE room_code = ?',room.code).first();
  const revision=current?.revision||0;
  const state=current?JSON.parse(current.state):gameEmpty();
  const b=state.battle;
  if(b)for(const unit of Object.values(b.units)){
    if(typeof unit.awakening==='number')unit.awakening=unit.awakening>0;
    if(!unit.enemy&&gameAlive(unit)&&!unit.collapsed&&!unit.mind&&unit.temptation&&unit.zero!=='crisis')gameStartCollapse(b,unit);
    if(unit.library.guard?.power==='0')unit.library.guard=gameGuard;
    if(!unit.enemy){
      for(const card of gameCatalogue)unit.library[card.id]??=card;
      for(const card of gameCrisisCards)unit.library[card.id]=card;
      unit.library[gameCollapseCard.id]=gameCollapseCard;
      if(unit.collapsed)unit.zero=null;
      if(unit.zero==='crisis'&&!unit.crisisRulesVersion){
        unit.crisisProofs=0;
        unit.collapseRound=b.round+crisisRounds-1;
        unit.crisisRulesVersion=1;
        delete b.plans[unit.id];
      }
      for(const card of gameAwakeningPresets)unit.library[card.id]=card;
    }
  }
  if(b&&!b.walls){
    b.walls=gameWalls;
    for(const unit of Object.values(b.units))unit.pos+=16;
    for(const plan of Object.values(b.plans||{}))plan.pos+=16;
  }
  if(artQuery){
    const id=artQuery.get('unit'),slot=artQuery.get('art');
    const portrait=slot==='dialogue.enemy'&&!studio&&(manager||state.dialogue?.some(entry=>entry.portraitKey===id))?state.enemyDialogueArt?.[id]:null;
    const data=portrait?.image||(Object.hasOwn(state.profiles,id)?state.profiles[id].art?.[slot]:null);
    const dialogueArt=!studio&&slot==='normal.idle'&&members.some(member=>member.id===id)&&state.dialogue?.some(entry=>entry.actor===id);
    if(!data||(!portrait&&!b?.units[id]&&id!==actor&&!dialogueArt))return error('일러스트를 찾을 수 없어요.',404);
    const [header,body]=data.split(',');
    return new Response(Uint8Array.from(atob(body),char=>char.charCodeAt(0)),{headers:{
      ...baseHeaders,'Content-Type':header.slice(5,header.indexOf(';')),'Cache-Control':'private, max-age=86400'
    }});
  }
  const readCollection=()=>query(db,'SELECT revision, cards, deck, stack_names FROM player_collections WHERE id = ?',self.collection_id).first();
  let ownRow=await readCollection();
  const legacy=state.profiles[actor];
  if(self.collection_id&&(legacy?.cards?.length||legacy?.deck?.length)){
    const merged=gameCollection(legacy,ownRow);
    const cards=JSON.stringify([...merged.cards,...merged.deleted]),deck=JSON.stringify(merged.deck);
    if(!ownRow){
      await query(db,'INSERT OR IGNORE INTO player_collections(id, cards, deck, revision) VALUES (?, ?, ?, 1)',self.collection_id,cards,deck).run();
      ownRow=await readCollection();
    }else if(JSON.stringify([...merged.cards,...merged.deleted].map(card=>card.id).sort())!==JSON.stringify(JSON.parse(ownRow.cards).map(card=>card.id).sort())||deck!==ownRow.deck){
      await query(db,'UPDATE player_collections SET cards = ?, deck = ?, revision = revision+1 WHERE id = ? AND revision = ?',cards,deck,self.collection_id,ownRow.revision).run();
      ownRow=await readCollection();
    }
  }
  const ownCollection=gameCollection(legacy,ownRow);
  const characterSnapshot=()=>{
    const saved=gameView(state,revision,actor,manager,members).profile;
    const conceptTools=saved.conceptTools||[];
    const passives=saved.passives||[];
    const {cards}=gameExportPassives([...passives,...conceptTools],[...ownCollection.cards,...(saved.passiveCards||[])]);
    return {character:{...gameProfileFields({...saved,name:saved.name||self.name},saved.mind),art:saved.art||{}},
      passives,conceptTools,cards};
  };
  if(input?.action==='stackExport'){
    try{
      const names=input.name?ownCollection.stackNames.filter(name=>name===input.name):ownCollection.stackNames;
      if(!names.length)gameFail('다운로드할 중첩이 없어요.');
      const stacks=names.map(name=>ownCollection.stackTraits.find(trait=>trait.name===name)||{name,effects:[]});
      const visible=manager?stacks:gamePublicView(stacks);
      const owned=[...gameUnlockedCards(state.profiles[actor]||{}),...ownCollection.cards];
      const cards=gameExportPassives(visible.map((trait,index)=>({...trait,id:'stack-export:'+index})),owned).cards;
      const data={format:stackFileFormat,version:1,stacks:visible,cards};
      return json(manager?data:gamePublicView(data));
    }catch(e){if(e instanceof GameInputError)return error(e.message);throw e;}
  }
  if(['passiveExport','characterExport'].includes(input?.action)){
    try{
      const saved=gameView(state,revision,actor,manager,members).profile;
      const owned=[...ownCollection.cards,...(saved.passiveCards||[])];
      let passives=saved.passives||[];
      if(input.action==='passiveExport'){
        if(input.id)passives=passives.filter(passive=>passive.id===input.id);
        if(!passives.length)gameFail('다운로드할 패시브가 없어요.');
        const data={format:passiveFileFormat,version:1,...gameExportPassives(passives,owned)};
        return json(manager?data:gamePublicView(data));
      }
      const data={format:characterFileFormat,version:1,...characterSnapshot()};
      return json(manager?data:gamePublicView(data));
    }catch(e){if(e instanceof GameInputError)return error(e.message);throw e;}
  }
  const shares=()=>Object.values(state.cardShares||{}).filter(share=>members.some(member=>member.id===share.owner));
  const passiveShares=()=>Object.values(state.passiveShares||{}).filter(post=>members.some(member=>member.id===post.owner));
  const readSlots=async()=>manager&&!studio?(await query(db,
    'SELECT slot,label,updated_at,round FROM campaign_saves WHERE room_code = ? ORDER BY slot',room.code).all()).results:[];
  let savedSlots=await readSlots();
  const view=(version=revision,collection=ownCollection,editedCardId)=>{
    const data=gameView(state,version,actor,manager,members);
    data.roster=data.roster.map(({id,name,seat})=>({id,name,seat}));
    data.collectionRevision=collection.revision;
    data.campaign=gameCampaignView(state,actor,manager);
    if(manager&&!studio)data.saveSlots=savedSlots;
    data.savedAt=state.lastSavedAt;
    data.sharedCards=shares().map(({id,owner,bundle})=>({
      id,owner,author:members.find(member=>member.id===owner).name,card:bundle[0],included:bundle.slice(1).map(card=>card.name)
    }));
    data.sharedPassives=passiveShares().map(({id,owner,passive,cards})=>({
      id,owner,author:members.find(member=>member.id===owner).name,passive,included:cards.map(({id,name})=>({id,name}))
    }));
    if(editedCardId)data.editedCardId=editedCardId;
    data.profile.cards=collection.cards.map(({shareOrigin,...card})=>({...card,requiredState:cardState(card.requiredState)}));
    data.profile.deck=gameDeck([...gameCatalogue,...gameUnlockedCards(state.profiles[actor]),...collection.cards],collection.deck).map(card=>card.id);
    data.profile.deckSaved=collection.deck.length===deckSize;
    data.profile.customStacks=collection.stackNames;
    data.profile.stackTraits=collection.stackTraits;
    data.profile.conceptStackTraits=Object.values(gameConceptTraits);
    data.defaults=[...gameCatalogue,...gameUnlockedCards(state.profiles[actor])];
    const known=[...data.defaults,...collection.cards,...(data.profile.passives||[]),...(data.profile.conceptTools||[]),...(data.profile.passiveCards||[])];
    data.profile.stackNames=[...new Set([...collection.stackNames,...known.flatMap(source=>
      (source.effects||[]).flatMap(effectStackNames))])];
    if(!studio){
      data.dialogue=state.dialogue||[];
      if(manager&&state.battle)data.dialogueFoes=Object.values(state.battle.units).filter(unit=>unit.enemy).map(unit=>{
        const key=gameDialogueFoeKey(state.battle,unit);
        return {id:unit.id,name:unit.name,portrait:!!state.enemyDialogueArt?.[key]};
      });
    }
    data.profile.artSlots=Object.keys(data.profile.art||{});
    delete data.profile.art;
    if(!studio&&gameActive(state.battle)){
      data.pendingEdits=Object.values(state.battle.pendingEdits||{}).filter(edit=>manager||edit.actor===actor)
        .map(({id,actor,name,cardNames,passiveNames})=>({id,actor,name,cardNames,passiveNames}));
    }
    return json(manager?data:gamePublicView(data));
  };
  if(!input)return view();
  if(['saveSlot','loadSlot','deleteSlot','exportSave','importSave'].includes(input.action)){
    if(!manager||studio)return error('세션의 GM 또는 방장만 저장 파일을 관리할 수 있어요.',403);
    if(input.action!=='importSave'&&!gameInt(input.slot,1,3))return error('저장 슬롯을 확인하세요.');
    if(input.action==='exportSave'){
      const record=await query(db,'SELECT data FROM campaign_saves WHERE room_code = ? AND slot = ?',room.code,input.slot).first();
      if(!record)return error('이 슬롯에 저장이 없어요.',404);
      return json(await gameExportSave(db,room.code,JSON.parse(record.data)));
    }
    if(input.revision!==revision)return error('다른 창에서 변경되었습니다. 다시 시도하세요.',409);
    if(input.action==='saveSlot'){
      if(!state.battle&&!state.campaign)return error('저장할 전투나 열차 기록이 없어요.');
      const label=gameText(input.label,40)||state.battle?.encounter?.name||'열차 기록';
      await query(db,'INSERT INTO campaign_saves(room_code,slot,data,label,updated_at,round) VALUES (?,?,?,?,?,?) ON CONFLICT(room_code,slot) DO UPDATE SET data=excluded.data,label=excluded.label,updated_at=excluded.updated_at,round=excluded.round',
        room.code,input.slot,JSON.stringify(gameSaveSnapshot(state)),label,new Date().toISOString(),state.battle?.round??null).run();
      savedSlots=await readSlots();
      return view();
    }
    if(input.action==='deleteSlot'){
      await query(db,'DELETE FROM campaign_saves WHERE room_code = ? AND slot = ?',room.code,input.slot).run();
      savedSlots=await readSlots();
      return view();
    }
  }
  const collectionEdit=['card','deck','cardClone','cardDelete','cardImport','cardTake','stackCreate','stackEdit','stackImport'].includes(input.action);
  if(['characterAccountSave','characterAccountSelect'].includes(input.action)&&!account)
    return error('캐릭터 보관함을 사용하려면 ChatGPT로 로그인하세요.',401);
  if(collectionEdit?input.collectionRevision!==ownCollection.revision:input.revision!==revision){
    return error('저장 데이터가 먼저 변경됐어요. 다시 시도해 주세요.',409);
  }
  const profile=state.profiles[actor]??={cards:[],deck:[]};
  try{
    switch(input.action){
      case 'dialogueEnemyArt': {
        if(studio||!manager)return error('GM만 적 스탠딩을 등록할 수 있어요.',403);
        const unit=b?.units[input.speaker];
        if(!unit?.enemy)gameFail('현재 세션의 적을 선택하세요.');
        gameValidateArt('normal.idle',input.image);
        const key=gameDialogueFoeKey(b,unit);
        const portraits=state.enemyDialogueArt??={};
        portraits[key]={image:input.image,version:(portraits[key]?.version||0)+1};
        break;
      }
      case 'dialogue': {
        if(studio)gameFail('세션 안에서 대사를 보낼 수 있어요.');
        const message=gameText(input.message,500);
        if(!message)gameFail('대사를 입력하세요.');
        const previous=state.dialogue||[];
        const at=Math.max(Date.now(),previous.at(-1)?.at||0);
        let speaker={actor,name:profile.name||self.name,...(profile.art?.['normal.idle']?{artVersion:profile.artVersion||0}:{})};
        if(input.speaker){
          if(!manager)return error('GM만 적으로 대화할 수 있어요.',403);
          const unit=b?.units[input.speaker];
          if(!unit?.enemy)gameFail('현재 세션의 적을 선택하세요.');
          const key=gameDialogueFoeKey(b,unit),portrait=state.enemyDialogueArt?.[key];
          speaker={actor:'foe:'+key,name:unit.name,enemy:true,...(portrait?.image?{portraitKey:key,artVersion:portrait.version}:{})};
        }
        state.dialogue=[...previous.slice(-99),{id:gameId(),...speaker,message,at}];
        break;
      }
      case 'art': {
        if(!studio&&gameActive(b)&&b.units[actor])gameFail('전투 중에는 일러스트를 변경할 수 없어요.');
        const image=input.image;
        gameValidateArt(String(input.slot||''),image);
        profile.art??={};
        if(image)profile.art[input.slot]=image;
        else delete profile.art[input.slot];
        profile.artVersion=(profile.artVersion||0)+1;
        break;
      }
      case 'profile': {
        Object.assign(profile,gameProfileFields(input,profile.mind??50));
        break;
      }
      case 'characterAccountSave': {
        if(gameActive(b)&&b.units[actor])gameFail('전투가 끝난 후 캐릭터를 저장할 수 있어요.');
        const snapshot=characterSnapshot();
        if(!state.profiles[actor]?.name)gameFail('캐릭터 시트를 먼저 저장하세요.');
        const data=JSON.stringify(snapshot);
        if(data.length>850000)gameFail('캐릭터 데이터가 너무 커요. 일러스트 용량을 줄여 주세요.');
        const {name,country}=snapshot.character;
        if(input.id){
          if(typeof input.id!=='string'||!gameInt(input.characterRevision,1,Number.MAX_SAFE_INTEGER))gameFail('저장할 캐릭터를 확인하세요.');
          const saved=await query(db,'UPDATE account_characters SET name = ?, country = ?, data = ?, updated_at = ?, revision = revision+1 WHERE id = ? AND owner_id = ? AND revision = ?',
            name,country,data,Date.now(),input.id,account,input.characterRevision).run();
          if(!saved.meta.changes)return error('캐릭터가 이미 변경됐거나 이 계정에 없어요.',409);
        }else{
          const saved=await query(db,`INSERT INTO account_characters (id,owner_id,name,country,data,updated_at)
            SELECT ?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM account_characters WHERE owner_id = ?) < ?`,
            gameId(),account,name,country,data,Date.now(),account,maxAccountCharacters).run();
          if(!saved.meta.changes)gameFail('계정에 캐릭터는 '+maxAccountCharacters+'명까지 저장할 수 있어요.');
        }
        return view();
      }
      case 'characterAccountSelect': {
        if(gameActive(b)&&b.units[actor])gameFail('전투가 끝난 후 캐릭터를 선택할 수 있어요.');
        if(typeof input.id!=='string')gameFail('불러올 캐릭터를 선택하세요.');
        const saved=await query(db,'SELECT data FROM account_characters WHERE id = ? AND owner_id = ?',input.id,account).first();
        if(!saved)return error('이 계정에 저장된 캐릭터를 찾을 수 없어요.',404);
        gameLoadCharacter(profile,JSON.parse(saved.data));
        profile.accountCharacterId=input.id;
        break;
      }
      case 'passiveImport':
      case 'characterImport': {
        if(gameActive(b)&&b.units[actor])gameFail('전투가 끝난 후 파일을 가져올 수 있어요.');
        const file=input.file,character=input.action==='characterImport';
        if(file?.format!==(character?characterFileFormat:passiveFileFormat)||file.version!==1)gameFail('파일 종류 또는 버전을 확인하세요.');
        if(character){
          gameLoadCharacter(profile,file);
          delete profile.accountCharacterId;
        }else{
          if(!file.passives?.length)gameFail('가져올 패시브가 없어요.');
          Object.assign(profile,gameImportPassives(file,profile.passives||[],profile.passiveCards||[],false));
        }
        break;
      }
      case 'conceptTool':
      case 'conceptToolToggle':
      case 'conceptToolDelete': {
        const list=profile.conceptTools??=[];
        const creating=input.action==='conceptTool';
        const id=creating?input.tool?.id:input.id;
        const index=list.findIndex(tool=>tool.id===id);
        if(index<0&&(id||!creating))gameFail('변경할 개념 도구를 찾을 수 없어요.');
        if(creating){
          if(index<0&&list.length>=maxConceptTools)gameFail('개념 도구는 '+maxConceptTools+'개까지 저장할 수 있어요.');
          const owned=[...gameCatalogue,...ownCollection.cards,...(profile.passiveCards||[])];
          const tool=gamePassive({...input.tool,enabled:input.tool?.enabled===true},id||undefined,owned);
          if(index<0)list.push(tool);
          else list[index]=tool;
        }else if(input.action==='conceptToolToggle')list[index].enabled=!list[index].enabled;
        else list.splice(index,1);
        break;
      }
      case 'passive':
      case 'passiveToggle':
      case 'passiveDelete':
      case 'passiveClone':
      case 'passiveTake': {
        const list=profile.passives??=[];
        const owned=[...gameCatalogue,...ownCollection.cards,...(profile.passiveCards||[])];
        if(input.action==='passiveTake'){
          const post=passiveShares().find(share=>share.id===input.id&&share.owner!==actor);
          if(!post)gameFail('공유 패시브가 없거나 공유가 해제됐어요.');
          if(list.length>=maxPassives)gameFail('패시브는 '+maxPassives+'개까지 저장할 수 있어요.');
          if(list.some(passive=>passive.sharedFrom===post.id))gameFail('이미 가져온 패시브예요.');
          const dependencies=[...new Map([...(profile.passiveCards||[]),...post.cards].map(card=>[card.id,card])).values()];
          if(dependencies.length>48)gameFail('패시브의 참조 카드가 너무 많아요.');
          const passive=gamePassive({...post.passive,enabled:false},undefined,[...owned,...dependencies]);
          profile.passiveCards=dependencies;
          list.push({...passive,sharedFrom:post.id});
          break;
        }
        const id=input.action==='passive'?input.passive?.id:input.id;
        const index=list.findIndex(passive=>passive.id===id);
        if(id&&index<0||input.action!=='passive'&&index<0)gameFail('변경할 패시브를 찾을 수 없어요.');
        if(input.action==='passiveDelete')list.splice(index,1);
        else if(input.action==='passiveToggle')list[index].enabled=!list[index].enabled;
        else if(input.action==='passiveClone'){
          if(list.length>=maxPassives)gameFail('패시브는 '+maxPassives+'개까지 저장할 수 있어요.');
          const {sharedFrom,...original}=list[index];
          list.push({...original,id:gameId(),name:original.name.slice(0,31)+' 사본',enabled:false});
        }else if(index>=0)list[index]={...list[index],...gamePassive(input.passive,id,owned)};
        else{
          if(list.length>=maxPassives)gameFail('패시브는 '+maxPassives+'개까지 저장할 수 있어요.');
          list.push(gamePassive(input.passive,undefined,owned));
        }
        if(profile.passiveCards?.length&&['passive','passiveDelete'].includes(input.action)){
          const needed=new Set([...list,...(profile.conceptTools||[])].flatMap(passive=>gameShareBundle(passive,[...ownCollection.cards,...profile.passiveCards]).slice(1).map(card=>card.id)));
          profile.passiveCards=profile.passiveCards.filter(card=>needed.has(card.id));
        }
        break;
      }
      case 'passiveShare': {
        const passive=profile.passives?.find(item=>item.id===input.id);
        if(!passive)gameFail('공유할 패시브를 찾을 수 없어요.');
        const cards=gameShareBundle(passive,[...ownCollection.cards,...(profile.passiveCards||[])]).slice(1)
          .map(({image,...card})=>card);
        const existing=passiveShares().find(post=>post.owner===actor&&post.passive.id===passive.id);
        const id=existing?.id??gameId();
        if(!existing&&passiveShares().filter(post=>post.owner===actor).length>=maxPassives)gameFail('패시브는 '+maxPassives+'개까지 공유할 수 있어요.');
        (state.passiveShares??={})[id]={id,owner:actor,passive,cards};
        break;
      }
      case 'passiveUnshare': {
        const post=passiveShares().find(share=>share.id===input.id&&share.owner===actor);
        if(!post)gameFail('내가 공유한 패시브만 공유를 해제할 수 있어요.');
        delete state.passiveShares[post.id];
        break;
      }
      case 'cardShare': {
        const card=ownCollection.cards.find(entry=>entry.id===input.id);
        if(!card)gameFail('보관함에서 공유할 카드를 찾을 수 없어요.');
        const bundle=gameShareBundle(card,ownCollection.cards);
        const posts=state.cardShares??={};
        const existing=shares().find(share=>share.owner===actor&&share.bundle[0].id===card.id);
        const id=existing?.id??gameId();
        posts[id]={id,owner:actor,bundle};
        break;
      }
      case 'cardUnshare': {
        const post=Object.hasOwn(state.cardShares||{},input.id)&&state.cardShares[input.id];
        if(!post||post.owner!==actor)gameFail('내가 공유한 카드만 공유를 해제할 수 있어요.');
        delete state.cardShares[input.id];
        break;
      }
      case 'card':
      case 'deck':
      case 'cardClone':
      case 'cardDelete':
      case 'cardImport':
      case 'stackCreate':
      case 'stackEdit':
      case 'stackImport':
      case 'cardTake': {
        const {cards,deleted,stackNames,stackTraits}=ownCollection;
        let {deck}=ownCollection,editedCardId;
        const owned=[...gameCatalogue,...gameUnlockedCards(profile),...cards];
        switch(input.action){
          case 'stackCreate': {
            const name=gameStackName(input.name);
            if(stackNames.includes(name)||Object.hasOwn(basicStacks,name)||Object.hasOwn(conceptStacks,name))gameFail('이미 등록한 중첩이에요.');
            if(stackNames.length>=maxCustomStacks)gameFail('중첩은 '+maxCustomStacks+'개까지 등록할 수 있어요.');
            stackNames.push(name);
            break;
          }
          case 'stackEdit': {
            if(!stackNames.includes(input.name))gameFail('편집할 중첩을 먼저 등록하세요.');
            const trait=gameStackTrait(input,owned);
            const index=stackTraits.findIndex(item=>item.name===trait.name);
            if(index<0)stackTraits.push(trait);else stackTraits[index]=trait;
            break;
          }
          case 'stackImport': {
            const file=input.file;
            if(file?.format!==stackFileFormat||file.version!==1||!Array.isArray(file.stacks)||!file.stacks.length||
              file.stacks.length+stackNames.length>maxCustomStacks||!Array.isArray(file.cards))
              gameFail('중첩 파일 형식 또는 보관 한도('+maxCustomStacks+'개)를 확인하세요.');
            const names=new Set(stackNames);
            const incoming=file.stacks.map(trait=>{
              const name=gameStackName(trait?.name);
              if(names.has(name)||Object.hasOwn(basicStacks,name)||Object.hasOwn(conceptStacks,name))
                gameFail('이미 등록된 중첩이 있어요. '+name);
              names.add(name);
              if(!Array.isArray(trait.effects))gameFail('중첩 효과를 확인하세요.');
              return {...trait,name};
            });
            if(file.cards.some(card=>!card||typeof card.id!=='string'))gameFail('참조 카드 파일 형식을 확인하세요.');
            if(cards.length+file.cards.length>24)gameFail('참조 카드를 포함해 제작 카드는 최대 24장까지 보관할 수 있어요.');
            const ids=new Map(file.cards.map(card=>[card.id,gameId()]));
            const unlocked=gameUnlockedCards(profile);
            const imported=file.cards.length?gameImportCards(file.cards,[...unlocked,...cards],false,ids,
              24+unlocked.length):[];
            const known=[...owned,...imported];
            const traits=incoming.map(trait=>gameStackTrait({...trait,
              effects:trait.effects.map(effect=>mapEffectCardReferences(effect,id=>ids.get(id)||id))},known));
            cards.push(...imported);
            stackNames.push(...traits.map(trait=>trait.name));
            stackTraits.push(...traits);
            break;
          }
          case 'card': {
            if(!input.card||typeof input.card!=='object')gameFail('카드 입력을 확인하세요.');
            const index=cards.findIndex(c=>c.id===input.card.id);
            if(index<0&&cards.length>=24)gameFail('제작 카드는 최대 24장까지 보관할 수 있어요.');
            const card=gameCard(input.card,index<0?undefined:cards[index].id,owned);
            if(index<0)cards.push(card);else cards[index]={...card,...(cards[index].shareOrigin?{shareOrigin:cards[index].shareOrigin}:{})};
            break;
          }
          case 'deck': {
            const ids=input.cards;
            if(!Array.isArray(ids)||ids.length!==deckSize||ids.some(id=>!owned.some(card=>card.id===id))){
              gameFail('보관함에서 카드 '+deckSize+'장을 선택하세요.');
            }
            const counts=new Map();
            for(const id of ids)counts.set(id,(counts.get(id)||0)+1);
            if([...counts.values()].some(count=>count>deckCopyLimit))gameFail('같은 카드는 최대 '+deckCopyLimit+'장까지 넣을 수 있어요.');
            deck=ids;
            break;
          }
          case 'cardClone': {
            const original=cards.find(card=>card.id===input.id);
            if(!original)gameFail('복제할 카드를 찾을 수 없어요.');
            if(cards.length>=24)gameFail('제작 카드는 최대 24장까지 보관할 수 있어요.');
            const id=gameId();
            const name=original.name.slice(0,31)+' 사본';
            const copyEffects=original.effects.map(effect=>mapEffectCardReferences(effect,ref=>ref===original.id?id:ref));
            cards.push({...original,id,name,effects:copyEffects});
            editedCardId=id;
            break;
          }
          case 'cardDelete': {
            const index=cards.findIndex(card=>card.id===input.id);
            if(index<0)gameFail('삭제할 카드를 찾을 수 없어요.');
            const dependent=cards.find(card=>card.id!==input.id&&card.effects.some(effect=>effectCardReferences(effect).includes(input.id)));
            if(dependent)gameFail('「'+dependent.name+'」에서 참조하는 카드를 먼저 바꿔 주세요.');
            const passive=profile.passives?.find(item=>item.effects.some(effect=>effectCardReferences(effect).includes(input.id)));
            if(passive)gameFail('「'+passive.name+'」 패시브의 지정 카드를 먼저 바꿔 주세요.');
            cards.splice(index,1);
            deleted.push({id:input.id,deleted:true});
            if(deck.includes(input.id))deck=gameDeck([...gameCatalogue,...cards],deck.filter(id=>id!==input.id)).map(card=>card.id);
            break;
          }
          case 'cardImport': {
            if(input.file?.format!==cardFileFormat||input.file.version!==1)gameFail('콘셉트테라 카드 목록 JSON 파일을 선택하세요.');
            cards.push(...gameImportCards(input.file.cards,cards));
            break;
          }
          case 'cardTake': {
            const shared=shares().find(share=>share.id===input.id&&share.owner!==actor);
            if(!shared)gameFail('공유 카드가 없거나 공유가 해제됐어요.');
            const imported=gameImportCards(shared.bundle,cards,true);
            cards.push(...imported);
            break;
          }
        }
        const serializedCards=JSON.stringify([...cards,...deleted]);
        if(serializedCards.length>900000)gameFail('카드 보관함 용량을 초과했어요.');
        const serializedStacks=JSON.stringify(stackNames.map(name=>stackTraits.find(trait=>trait.name===name)||name));
        if(serializedStacks.length>150000)gameFail('중첩 효과 보관함 용량을 초과했어요.');
        const saved=ownRow?
          await query(db,'UPDATE player_collections SET cards = ?, deck = ?, stack_names = ?, revision = revision+1 WHERE id = ? AND revision = ?',serializedCards,JSON.stringify(deck),serializedStacks,self.collection_id,ownCollection.revision).run():
          await query(db,'INSERT OR IGNORE INTO player_collections(id, cards, deck, stack_names, revision) VALUES (?, ?, ?, ?, 1)',self.collection_id,serializedCards,JSON.stringify(deck),serializedStacks).run();
        if(!saved.meta.changes)return error('보관함이 다른 화면에서 먼저 변경됐어요. 다시 시도해 주세요.',409);
        return view(revision,{cards,deck,stackNames,stackTraits,revision:ownCollection.revision+1},editedCardId);
      }
      case 'loadSlot': {
        const record=await query(db,'SELECT data FROM campaign_saves WHERE room_code = ? AND slot = ?',room.code,input.slot).first();
        if(!record)gameFail('이 슬롯에 저장이 없어요.');
        gameLoadSnapshot(state,JSON.parse(record.data),members);
        break;
      }
      case 'importSave':
        gameLoadSnapshot(state,await gameImportSave(db,room.code,input.file),members);
        break;
      case 'loopCheckpoint':
        if(!manager||gameActive(b))gameFail('GM만 열차에서 책갈피를 남길 수 있어요.');
        gameCheckpoint(state,null,'manual',gameText(input.label,40));
        break;
      case 'loopRevert':
        if(!manager||gameActive(b))gameFail('GM만 열차에서 회귀할 수 있어요.');
        gameLoopRevert(state,input);
        break;
      case 'loopRefill':
        if(gameActive(b))gameFail('열차에서만 빈 카드 자리를 작성할 수 있어요.');
        gameLoopRefill(state,actor,input);
        break;
      case 'start': {
        if(!manager)return error('GM 또는 방장만 시작할 수 있어요.',403);
        if(gameActive(b))gameFail('이미 전투 중이에요.');
        const players=members.filter(member=>member.seat>0&&member.id!==actor);
        const collections=new Map(await Promise.all(players.map(async member=>{
          const row=await query(db,'SELECT cards, deck, stack_names, revision FROM player_collections WHERE id = ?',member.account_collection_id||member.collection_id).first();
          return [member.id,gameCollection(state.profiles[member.id],row)];
        })));
        collections.set(actor,ownCollection);
        state.battle=gameBegin(state,members,input,self,collections);
        break;
      }
      case 'requestEdit': {
        if(!gameActive(b)||!gameAlive(b.units[actor]))gameFail('전투에 참여 중일 때 변경을 요청할 수 있어요.');
        const cards=[...gameCatalogue,...ownCollection.cards];
        if(state.campaign?.loopCount&&state.campaign.party.some(unit=>unit.id===actor))
          gameFail('회귀로 작성된 덱은 이번 여정 동안 전투 중에 바꿀 수 없어요.');
        const deck=gameDeck(cards,ownCollection.deck);
        const passives=gameEquippedEffects(profile);
        const library=Object.fromEntries([...cards,...(profile.passiveCards||[])].map(({image,...card})=>[card.id,card]));
        const name=profile.name||self.name;
        (b.pendingEdits??={})[actor]={id:gameId(),actor,name,deck:deck.map(card=>card.id),library,passives,
          stackDefinitions:Object.fromEntries(ownCollection.stackTraits.map(trait=>[trait.name,trait])),
          cardNames:[...new Set(deck.map(card=>card.name))],passiveNames:passives.map(passive=>passive.name)};
        break;
      }
      case 'reviewEdit': {
        if(!manager)return error('GM 또는 방장만 변경을 승인할 수 있어요.',403);
        if(!gameActive(b))gameFail('진행 중인 전투가 없어요.');
        const edit=Object.values(b.pendingEdits||{}).find(item=>item.id===input.id);
        if(!edit||typeof input.approve!=='boolean')gameFail('대기 중인 요청을 선택하세요.');
        const unit=b.units[edit.actor];
        if(input.approve){
          if(!gameAlive(unit))gameFail('전투 중인 참가자에게만 적용할 수 있어요.');
          Object.assign(unit.library,edit.library);
          const configured=edit.deck.slice().sort();
          const previous=unit.configuredDeck||[...unit.hand,...unit.grave,...unit.exile,...unit.deck].sort();
          if(configured.join(',')!==previous.join(',')){
            const used=new Map();
            for(const id of [...unit.hand,...unit.grave,...unit.exile])used.set(id,(used.get(id)||0)+1);
            unit.deck=gameShuffle(edit.deck.filter(id=>{
              const count=used.get(id)||0;
              if(!count)return true;
              used.set(id,count-1);
              return false;
            }));
          }
          unit.configuredDeck=configured;
          unit.name=edit.name;
          unit.passives=edit.passives;
          unit.stackDefinitions=edit.stackDefinitions;
          unit.startingCards=[...new Set(edit.deck)];
          delete b.plans[unit.id];
        }
        gameLog(b,edit.name+' · 편집 변경 '+(input.approve?'GM 승인':'GM 반려'));
        delete b.pendingEdits[edit.actor];
        break;
      }
      case 'instantMove': {
        const unit=b?.units[actor];
        if(!gameActive(b)||!gameAlive(unit)||!unit.instantMove)gameFail('사용할 즉시 이동력이 없어요.');
        if(input.skip===true){delete unit.instantMove;break;}
        if(unit.rooted||unit.blockedRounds)gameFail('현재 상태에서는 이동할 수 없어요.');
        const path=gridPaths(unit.pos,unit.instantMove,gameBlocked(b,unit)).get(input.pos);
        if(!path?.length)gameFail('즉시 이동할 수 있는 칸을 선택하세요.');
        unit.instantMove-=path.length;
        if(!unit.instantMove)delete unit.instantMove;
        gameFollowPath(b,unit,path);
        delete b.plans[actor];
        gameLog(b,unit.name+' · 즉시 이동 '+path.length+'칸');
        break;
      }
      case 'plan':
        if(!gameActive(b)||!gameCanPlan(b.units[actor]))gameFail('지금은 행동을 예약할 수 없어요.');
        if(b.units[actor].instantMove)gameFail('즉시 이동력을 사용하거나 넘긴 후 행동을 확정하세요.');
        b.plans[actor]=gameSelectTurn(b,b.units[actor],input);
        break;
      case 'unplan':
        if(!gameActive(b)||!gameCanPlan(b.units[actor]))gameFail('지금은 행동을 수정할 수 없어요.');
        delete b.plans[actor];
        break;
      case 'intent': {
        if(!manager)return error('GM 또는 방장만 적 행동을 바꿀 수 있어요.',403);
        if(!gameActive(b)||Object.keys(b.plans).length)gameFail('플레이어가 행동을 확정하기 전에 바꿀 수 있어요.');
        const target=Object.hasOwn(b.units,input.target)?b.units[input.target]:null;
        if(!gameAlive(target)||target.enemy)gameFail('살아 있는 대상을 선택하세요.');
        const intent=b.intentQueue?.find(entry=>entry.id===input.foeIntent)??b.intent;
        if(intent.card.unredirectable||gameIsFirstStop(b))gameFail('이 조우의 예고 대상은 정해진 규칙으로 결정돼요.');
        const foe=b.units[intent.attacker||'enemy'];
        if(!gameAlive(foe))gameFail('행동할 수 있는 적을 선택하세요.');
        intent.target=target.id;
        intent.reachable=!intent.card.support&&gameActionLimit(foe)>0&&gameReach(b,intent.card,foe,target);
        break;
      }
      case 'adjustActions': {
        if(!manager)return error('GM 또는 방장만 전투 상태를 조정할 수 있어요.',403);
        const target=b&&Object.hasOwn(b.units,input.target)?b.units[input.target]:null;
        if(!gameActive(b)||!gameAlive(target)||target.enemy||!gameInt(input.baseActions,baseActions,maxActions))gameFail('기본 행동량을 확인하세요.');
        target.baseActions=input.baseActions;
        if(gamePaidActions(target,gamePlannedCards(b.plans[target.id]))>gameActionLimit(target))delete b.plans[target.id];
        gameLog(b,target.name+' · 기본 행동량 '+target.baseActions);
        break;
      }
      case 'adjust': {
        if(!manager)return error('GM 또는 방장만 전투 상태를 조정할 수 있어요.',403);
        const target=b&&Object.hasOwn(b.units,input.target)?b.units[input.target]:null;
        if(!gameActive(b)||!target||target.enemy||target.collapsed||!gameInt(input.mind,-100,100)||!input.mind)gameFail('정신력 조정 값을 확인하세요.');
        gameMental(b,target,input.mind,true);
        gameLog(b,target.name+' · GM 정신력 조정 '+(input.mind>0?'+':'')+input.mind);
        break;
      }
      case 'round':
        if(!manager)return error('GM 또는 방장만 라운드를 진행할 수 있어요.',403);
        if(!gameActive(b))gameFail('진행 중인 전투가 없어요.');
        if(gameAwaiting(b,members).length)gameFail('플레이어가 행동을 확정할 때까지 기다려 주세요.');
        gameResolve(b);
        if(b.phase==='finished')gameReturnToTrain(b,state);
        break;
      case 'reset':
        if(!manager)return error('GM 또는 방장만 전투를 정리할 수 있어요.',403);
        if(b&&b.phase!=='finished')gameReturnToTrain(b,state);
        state.battle=null;break;
      case 'rest':
        if(gameActive(b))gameFail('전투를 마친 후 휴식할 수 있어요.');
        profile.mind=Math.min(100,(profile.mind??50)+20);break;
      default:gameFail('알 수 없는 작업이에요.');
    }
  }catch(e){if(e instanceof GameInputError)return error(e.message);throw e;}
  state.lastSavedAt=new Date().toISOString();
  const serialized=JSON.stringify(state);
  if(['art','dialogueEnemyArt','characterImport','characterAccountSelect'].includes(input.action)&&new TextEncoder().encode(serialized).length>1500000)
    return error('세션 일러스트 저장 공간이 부족해요. 사용하지 않는 자세를 정리해 주세요.');
  if(serialized.length>900000)return error('방 저장 공간이 가득 찼어요. 이미지 크기를 줄여 주세요.',413);
  const saved=current?
    await query(db,'UPDATE game_states SET revision = revision+1, state = ? WHERE room_code = ? AND revision = ?',serialized,room.code,revision).run():
    await query(db,'INSERT OR IGNORE INTO game_states(room_code,revision,state) VALUES (?,1,?)',room.code,serialized).run();
  if(!saved.meta.changes)return error('동시에 변경이 들어왔어요. 다시 시도해 주세요.',409);
  return view(revision+1);
}
