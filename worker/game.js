import {gridValid, gridSize, gridTileGroups, gridDistance, gridPaths, gridDisplacement, gridCardInRange, gridTargetLimit, gridSplashTargets, maxRangeX, maxRangeY, customRangeRadius, maxRangeRadius, collapseTargets} from '../public/grid.js';
import {heldStackEffectKinds,hitTargetModes, hitResultTests, flowGates, maxGateInputs, maxGateTests, maxCustomStacks, maxStackNameLength, effectStackNames, effectCardReferences, mapEffectCardReferences, maxFlowDepth, maxFlowRepeat, maxFlowActivations, maxExpressionDepth, maxMathTerms, maxMathParts, flowMathTerms, flowArithmetic, flowComparisons, flowStats, flagConditions, replacementConditions, maxPassives, maxPassiveEffects, passiveRoundTimings, passiveEffectKinds, passiveTimingsFor, baseActions, maxActions, statuses, effects, effectSettings, temptationLimit, temptationStrain, mentalCrisisThreshold, awakeningPower, crisisRecovery, signedEffects, percentageDefaults, ratioEffects, effectRatioBases, configurableRatioEffects, ratioBasisAvailable, maxStatusRounds, healthBases, healthRatioEffects, maxDeferralRounds, applyPowerRatio, effectRecipients, diceConditions, diceConditionTimings, maxDiceTotal, effectConditions, maxStatusStacks, maxStackPotency, stackPotency, maxCollectiveStackConsume, bossDamageModifiers, stackGrantEffects, stackConsumeAmounts, stackConsumeScopes, stackConsumePriorities, taggedEffects, discardCosts, resourceCosts, resourceScales, teamEffects, copyEffects, unnumberedEffects, stagedPowerEffects, stagedPowerTimings, amplifyHitTargets, effectLimitPeriods, maxEffectActivations, timings, maxCardHits, maxCardEffects, hitEffectTimings, cardHitPowers, roles, cardStates, cardState, crisisRounds, crisisVows, artForms, artPoses, cardUsable, deckSize, deckCopyLimit, cardFileFormat, parsePower, mentalPower} from '../public/rules.js';

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
  if(type==='number'&&gameInt(raw.value,-10000,10000))return {type,value:raw.value};
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
    return {type,condition,subject,threshold,...(tag?{tag}:{}),...(conditionCardId?{conditionCardId}:{})};
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
      return {kind:'repeat',id:step.id,count:step.count};
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
      const shape=JSON.stringify(step.kind==='if'?[step.kind,step.test]:[step.kind,step.count]);
      if(shapes.has(key)&&shapes.get(key)!==shape)gameFail('같은 제어 블록에 서로 다른 설정이 연결됐어요.');
      shapes.set(key,shape);
      path=key+(step.branch||'');
      if(step.kind==='repeat')iterations*=step.count;
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
    if(row?.when==='held'&&(!stack||!heldStackEffectKinds.includes(row.kind)||row.to!=='self'||
      row.limit||row.ratioBasis||row.condition==='cardUsed'))gameFail('보유 시 효과는 중첩 보유자에게 지속되는 보정만 설정할 수 있어요.');
    const reactionRounds=!passive&&['struck','hurt'].includes(row?.when)?row.reactionRounds??0:0;
    if(!gameInt(reactionRounds,0,maxStatusRounds))gameFail('피격 효과의 지속 라운드를 확인하세요.');
    if(row?.when==='counter'&&!counter)gameFail('반격 발동 시 효과는 반격 카드에만 사용할 수 있어요.');
    if (!row || !Object.hasOwn(effects,row.kind) || !Object.hasOwn(timings,row.when) || !Object.hasOwn(effectRecipients,row.to)) gameFail('효과 항목을 확인하세요.');
    const hitIndex=row.hitIndex??0;
    if(!gameInt(hitIndex,0,hitPowers.length)||hitIndex&&!hitEffectTimings.includes(row.when)){
      gameFail('타격 번호와 효과의 발동 시점을 확인하세요.');
    }
    if(row.kind==='hitLeech'&&!['hit','damage','attackEnd'].includes(row.when))gameFail('피해 비례 회복의 발동 시점을 확인하세요.');
    if(row.kind==='replayHit'&&(row.when==='roll'||!hitIndex||row.to!=='self'||row.scaleDiscard||row.scaleCost||row.scaleResource))gameFail('이 타격 재사용은 타격 효과에서만 설정해 주세요.');
    if(stagedPowerEffects.includes(row.kind)&&(hitIndex||row.to!=='self'||!stagedPowerTimings.includes(row.when))){
      gameFail('위력 증가는 판정 전에 자신에게 적용되는 카드 효과로 설정하세요.');
    }
    const amplify=row.kind==='amplifyHit';
    const amplifyTarget=row.amplifyTarget??'next';
    const amplifyIndex=row.amplifyIndex;
    if(amplify&&(row.when==='roll'||!hitIndex||hitIndex>=hitPowers.length||row.to!=='self'||row.scaleDiscard||row.scaleCost||row.scaleResource||
      !Object.hasOwn(amplifyHitTargets,amplifyTarget)||amplifyTarget==='number'&&!gameInt(amplifyIndex,hitIndex+1,hitPowers.length))){
      gameFail('증폭할 타격은 이 효과를 발동하는 타격보다 뒤에 있어야 해요.');
    }
    const deferral=row.kind==='damageDebt';
    const defaultPercent=deferral||percentageDefaults.includes(row.kind);
    const ratio=row.amountMode==='percent'||defaultPercent&&row.amountMode==null;
    const deferRounds=row.deferRounds??1;
    if(deferral&&!gameInt(deferRounds,1,maxDeferralRounds))gameFail('분할 라운드 수는 1~'+maxDeferralRounds+'로 설정하세요.');
    if(row.amountMode!=null&&!['fixed','percent'].includes(row.amountMode))gameFail('수치 단위를 확인하세요.');
    const ratioBasis=ratio&&row.ratioBasis?row.ratioBasis:undefined;
    if(ratioBasis&&(!configurableRatioEffects.includes(row.kind)||!Object.hasOwn(effectRatioBases,ratioBasis)||
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
    const amount=consumeAll?1:row.amount;
    const maxAmount=consuming?(consumeScope==='total'?maxCollectiveStackConsume:maxStatusStacks):
      ['awakenBody','inscribeMeaning'].includes(row.kind)?10000:row.kind==='blockAction'?maxStatusRounds:row.kind==='reduceActions'?maxActions:amplify&&ratio?300:100;
    if(!gameInt(amount,signed?-100:1,maxAmount)||amount===0)gameFail('효과 수치를 확인하세요.');
    const grantsStacks=stackGrantEffects.includes(row.kind);
    const stackCap=grantsStacks?row.stackCap:undefined;
    const stackPower=grantsStacks?row.stackPower:undefined;
    const stackPowerCap=grantsStacks?row.stackPowerCap:undefined;
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
    }else if(row.when==='replace')gameFail('카드 발동 시점에는 다른 카드로 발동 효과를 사용하세요.');
    const diceCondition=Object.hasOwn(diceConditions,condition);
    if(diceCondition&&(!diceConditionTimings.includes(row.when)||!gameInt(row.threshold,1,maxDiceTotal))){
      gameFail('주사위 조건은 판정 시점 이후에 설정하고 눈의 합을 1~'+maxDiceTotal+' 사이로 입력하세요.');
    }
    if(condition==='stack'&&!tag) gameFail('중첩 조건에 이름을 입력하세요.');
    const isCost=discardCosts.includes(row.kind)||resourceCosts.includes(row.kind);
    const scaleResource=row.scaleResource||'';
    if(scaleResource&&(!Object.hasOwn(resourceScales,scaleResource)||row.scaleDiscard===true))gameFail('수치 배율은 한 가지 대가를 선택하세요.');
    if(teamEffects.includes(row.kind)&&row.to!=='self')gameFail('동료 전원 효과의 기준은 자신이에요.');
    if(copyEffects.includes(row.kind)&&row.to!=='self')gameFail('사본은 자신의 손패에 추가돼요.');
    if(isCost&&(condition||scaleResource||row.scaleDiscard===true||row.when!=='use'||row.to!=='self'))gameFail('대가는 사용 시 자신의 자원에 적용돼요.');
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
    const flow=gameNormalizeFlow(row,id,owned);
    const amountExpr=row.amountExpr!=null&&!unnumberedEffects.includes(row.kind)?gameExpression(row.amountExpr):undefined;
    return {...settings,...(flow.length?{flow}:{}),...(amountExpr?{amountExpr}:{}),...(ratioBasis?{ratioBasis}:{}),...(dotRounds!=null?{dotRounds}:{}),kind:row.kind,when:row.when,amount,to:row.to,tag,condition,threshold:gameInt(row.threshold,1,diceCondition?maxDiceTotal:100)?row.threshold:1,
      ...(hitIndex?{hitIndex}:{}),...(reactionRounds?{reactionRounds}:{}),
      ...(givenCardId?{givenCardId}:{}),...(conditionCardId?{conditionCardId}:{}),
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
  return {id,name,power:hitPowers[0],...(hitPowers.length>1?{hitPowers}:{}),...(hitTargets?{hitTargets}:{}),range,...(rangeShape?{rangeShape}:{}),target,...(splash?{splash}:{}),requiredState,clash:!counter&&target!=='tile'&&input.clash===true,unstoppable:!counter&&target!=='tile'&&input.unstoppable===true&&input.clash===true&&!['guard','assist'].includes(input.role)&&target!=='self',role:input.role,cost:input.role==='overload'?bounded(Number(input.cost)||20,10,30):0,notes:gameText(input.notes,300),effects:entries,image};
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
  return {id,name:card.name,notes:gameText(input.notes,300),enabled:input.enabled!==false,effects:card.effects};
}
const gamePassiveSource=passive=>({id:'passive:'+passive.id,name:passive.name,effects:passive.effects,passive:true});
function gamePassives(b,actor,when,target,source){
  if(!gameAlive(actor))return;
  const sources=[...(actor.passives||[]).map(gamePassiveSource),...gameHeldStackSources(actor)];
  for(const card of sources){
    if(!gameAlive(actor))break;
    if(card.stackCount&&!actor.stacks[card.name])continue;
    if(!card.effects.some(effect=>effect.when===when))continue;
    const ctx=gameContext(actor,card,[target],source.moved);
    Object.assign(ctx,{base:source.base,critical:source.critical,anyCritical:source.anyCritical,
      brokeShield:source.brokeShield,diceRolls:source.diceRolls,clashDifference:source.clashDifference,
      actionCard:source.card,hitIndex:source.hitIndex,hitRolls:source.hitRolls,rawHitRolls:source.rawHitRolls,totalDamage:source.totalDamage,
      paidHealth:source.paidHealth,paidMind:source.paidMind,discarded:source.discarded,
      totalDamageUsed:(source.totalDamageUsed??=new Set()),actionGroups:source.actionGroups||gameActionGroups(b,source)});
    if(when==='hit')gameTriggerHit(b,ctx,target);
    else gameTriggers(b,ctx,when,target);
  }
}
function gameHeldStackSources(unit){
  return Object.entries(unit.stackTraits||{}).filter(([name])=>unit.stacks[name]>0).map(([name,trait])=>({
    id:'stack:'+name,name,effects:trait.effects,passive:true,stackCount:unit.stacks[name]
  }));
}
function gameStackTrait(input,owned){
  const effects=input.effects??[];
  if(!Array.isArray(effects)||effects.length>maxPassiveEffects+1||
    effects.some(effect=>!effect||effect.kind==='replaceCard'||effect.kind==='giveCard')){
    gameFail('중첩 효과를 확인하세요.');
  }
  const normalized=effects.length?gamePassive({name:input.name,effects},'stack',owned,true).effects:[];
  return {name:input.name,effects:normalized.map((effect,index)=>({...effect,
    ...(effects[index].scaleStack==='count'?{scaleStack:'count'}:{})
  }))};
}
function gameUpgradeStackTrait({name,effects,critical}){
  if(!critical)return {name,effects};
  return {name,effects:[...effects,{when:'held',kind:'critChance',amount:critical,to:'self',scaleStack:'count'}]};
}
function gameHeldModifiers(b,unit,opponent){
  const modifiers={};
  for(const [name,trait] of Object.entries(unit.stackTraits||{})){
    const count=unit.stacks[name]||0;
    if(!count)continue;
    const entries=gameUpgradeStackTrait(trait).effects.filter(effect=>effect.when==='held');
    if(!entries.length)continue;
    const ctx=gameContext(unit,{name,effects:entries},opponent?[opponent]:[]);
    for(const effect of gameRunBlocks(b,ctx,opponent,entries)){
      if(!gameEffectCondition(b,ctx,unit,effect,opponent,'held'))continue;
      const raw=effect.amountExpr?Math.trunc(gameFlowValue(b,ctx,unit,effect.amountExpr)):effect.amount;
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
const gameCatalogue=[...gameDefaults,gameCounterPreset,gameCopyPreset,...gameResourcePresets,...gameAwakeningPresets];
const gameFoe=gamePreset('reap','징수의 손','2d+2','1~4','normal',1);
const gameRampage=gamePreset('rampage','피아 식별 상실','3d+4','1~7','normal',1,[],0,false);
const gameBots=['서린 · 회수원','가온 · 호송병','유담 · 기록원','해온 · 해결사'];
const gameActive=b=>b?.phase==='planning';
const gameAlive=u=>u&&u.hp>0;
const gameCanPlan=u=>gameAlive(u)&&!u.blockedRounds&&(u.collapsed||!u.zero||u.zero==='crisis');
const gameDistance=(a,b)=>gridDistance(a.pos,b.pos);
const gameReach=(card,a,b)=>gridCardInRange(card,a.pos,b.pos);
const gameLog=(b,message)=>{b.log.push(message);b.log=b.log.slice(-65);};

function gameDraw(unit,count) {
  while (count-->0 && unit.hand.length<12) {
    if (!unit.deck.length) {
      unit.deck=gameShuffle(unit.grave);
      unit.grave=[];
    }
    if (!unit.deck.length) return;
    unit.hand.push(unit.deck.pop());
  }
}
function gameUnit(id,name,pos,cards,bot=false,enemy=false,owned=cards) {
  const library=Object.fromEntries(owned.map(({image,...card})=>[card.id,card]));
  const unit={id,name,pos,startingCards:[...new Set(cards.map(card=>card.id))],hp:enemy?54:40,maxHp:enemy?54:40,mind:50,shield:0,reduce:0,move:2,nextMove:0,stacks:{},hand:[],deck:gameShuffle(cards.map(c=>c.id)),grave:[],exile:[],library,bot,enemy,zero:null,collapsed:false};
  if(!enemy)gameDraw(unit,4);
  return unit;
}
function gameMental(b,u,delta) {
  if(u.enemy||u.collapsed||!delta)return;
  const old=u.mind;
  u.mind=bounded(old+delta,0,100);
  if(u.mind===0){
    if(u.temptation&&!u.awakening)gameStartCollapse(b,u);
    else if(!u.zero){u.zero='pending';gameLog(b,u.name+'의 정신력이 0이 되어 폭주 위기에 놓였습니다.');}
  }else{
    if(u.zero==='crisis'){
      if(!b.resolving)delete b.plans[u.id];
      gameLog(b,u.name+' · 정신력을 되찾아 붕괴를 피함');
    }
    u.zero=null;delete u.zeroRound;delete u.collapseRound;delete u.crisisVow;delete u.crisisProofs;delete u.crisisRecoveryBonus;
  }
}
function gameStartCollapse(b,u){
  if(u.zero==='crisis'||u.collapsed)return;
  if(!b.resolving)delete b.plans[u.id];
  u.zero='crisis';
  u.collapseRound=b.round+crisisRounds-(b.resolving?0:1);
  u.crisisProofs=0;
  u.crisisRulesVersion=1;
  gameLog(b,u.name+' · 붕괴 직전. '+u.collapseRound+'라운드 종료 전 탈피하거나 정신력을 회복해야 합니다.');
}
function gameConceptualize(b,u){
  u.collapsed=true;
  u.awakening=false;
  u.zero=null;
  u.cover=[];
  delete u.collapseRound;
  delete u.crisisProofs;
  delete u.crisisVow;
  delete u.crisisRecoveryBonus;
  gamePose(b,u,'shift');
  gameLog(b,u.name+' · 붕괴해 개념화. 붕괴 카드의 표적을 자동 지정합니다.');
}
function gameAwaken(b,u,recovery){
  u.awakening=true;
  u.temptation=0;
  u.zero=null;
  delete u.collapseRound;
  delete u.zeroRound;
  gameMental(b,u,recovery+(u.crisisRecoveryBonus||0));
  gamePose(b,u,'shift');
  delete u.crisisVow;delete u.crisisProofs;delete u.crisisRecoveryBonus;
  gameLog(b,u.name+' · 탈피해 각성 (전투 중 판정 위력 +'+awakeningPower+')');
}
function gameRemoveShield(u,n){
  const removed=Math.min(u.shield,n);
  u.shield-=removed;
  u.temporaryShield=Math.max(0,(u.temporaryShield||0)-removed);
  return removed;
}
const gameBoss=unit=>!!(unit?.boss??(unit?.enemy&&unit.id==='enemy'));
function gameDamage(b,u,amount,actor,piercing=false,attack=false,settled=false) {
  if(!gameAlive(u))return 0;
  const bonus=attack&&amount>0?u.expose||0:0;
  if(bonus){
    u.expose=0;
    gameLog(b,u.name+' · 취약으로 피해 +'+bonus);
  }
  const hostile=actor.enemy!==u.enemy||actor.collapsed&&actor!==u;
  const bossOutgoing=gameBoss(u),bossIncoming=gameBoss(actor);
  const outgoing=hostile?gameHeldModifiers(b,actor,u):{};
  const incoming=hostile?gameHeldModifiers(b,u,actor):{};
  const fixed=hostile&&amount>0?(actor.outgoingDamage||0)+(u.incomingDamage||0)+
    (outgoing.outgoingDamage||0)+(incoming.incomingDamage||0)+
    (bossOutgoing?(actor.bossOutgoingDamage||0):0)+(bossIncoming?(u.bossIncomingDamage||0):0):0;
  const percent=hostile?(actor.outgoingDamagePercent||0)+(u.incomingDamagePercent||0)+
    (outgoing.outgoingDamagePercent||0)+(incoming.incomingDamagePercent||0)+
    (bossOutgoing?(actor.bossOutgoingDamagePercent||0):0)+(bossIncoming?(u.bossIncomingDamagePercent||0):0):0;
  const adjusted=applyPowerRatio(Math.max(0,Math.floor(amount)+bonus+fixed-(settled?0:u.reduce)),percent);
  if(!settled)u.reduce=0;
  const absorbed=piercing?0:gameRemoveShield(u,adjusted);
  let healthDamage=adjusted-absorbed;
  if(attack&&hostile&&healthDamage>0&&u.afterimage){
    const blocked=Math.min(healthDamage,u.afterimage);
    healthDamage-=blocked;
    delete u.afterimage;
    gameLog(b,u.name+' · 잔상으로 피해 '+blocked+' 방어');
  }
  if(attack&&hostile&&healthDamage>0&&u.deferrals?.length){
    const originalDamage=healthDamage;
    for(const {amount,mode,rounds} of u.deferrals){
      const delayed=Math.min(healthDamage,mode==='fixed'?amount:Math.floor(originalDamage*amount/100));
      if(!delayed)continue;
      const share=Math.floor(delayed/rounds), remainder=delayed%rounds;
      for(let i=0;i<Math.min(rounds,delayed);i++){
        (u.damageDebt??=[]).push({round:b.round+i+1,amount:share+Number(i<remainder)});
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
  if(attack&&hostile&&actual===u.hp&&u.lethalGuard){
    actual=u.hp-Math.min(u.hp,u.lethalGuard);
    u.lethalGuard=0;
    gameLog(b,u.name+' · 치명상 방지');
  }
  u.hp-=actual;
  if(actual)gamePose(b,u,u.hp?'hurt':'down');
  if(attack&&actor.enemy&&!u.enemy&&actual>0&&u.hp>0)b.exposedToAttack?.add(u.id);
  if(actual)gameLog(b,u.name+' 피해 '+actual+(absorbed?' · 보호막 '+absorbed:''));
  if(!u.enemy&&actual>=u.maxHp/4)gameMental(b,u,-10);
  if (!u.enemy&&(actual>=u.maxHp/4||u.hp===0)) {
    for(const ally of Object.values(b.units))if(ally!==u&&!ally.enemy&&gameAlive(ally)){
      const penalty=u.hp===0?10:5;
      const last=b.shock?.[ally.id]||0;
      if(penalty>last){gameMental(b,ally,last-penalty);if(b.shock)b.shock[ally.id]=penalty;}
    }
  }
  if(u.hp===0)gameLog(b,u.name+' 전투 불능');
  if(attack&&hostile&&absorbed&&!u.shield&&u.barrierBurst){
    const burst=u.barrierBurst;
    u.barrierBurst=0;
    gameLog(b,u.name+' · 보호막 파열 반격');
    gameDamage(b,actor,burst,u);
  }
  if(attack&&actual&&u.thorns&&hostile){
    const counter=u.thorns;
    u.thorns=0;
    gameLog(b,u.name+' · 반격 → '+actor.name);
    gameDamage(b,actor,counter,u);
  }
  return actual;
}
function gameHeal(b,u,n){
  if(!gameAlive(u)||n<=0)return 0;
  const old=u.hp;
  const penalty=Math.max(0,...(u.healCuts||[]).map(entry=>entry.amount));
  const healed=Math.floor(n*(100-penalty)/100);
  if(healed<n&&old<u.maxHp)gameLog(b,u.name+' · 회복량 '+penalty+'% 감소');
  u.hp=Math.min(u.maxHp,u.hp+healed);
  if(u.hp>old)gameLog(b,u.name+' 체력 회복 '+(u.hp-old));
  if(old<=u.maxHp/4&&u.hp>u.maxHp/4&&!u.rallied){u.rallied=true;gameMental(b,u,5);}
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
  const rolls=cardHitPowers(ctx.card).map(gameRollPower);
  gameRerollLow(b,unit,rolls);
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
  const formulas=cardHitPowers(ctx.card);
  const modifier=ctx.mod+(unit.nextPower||0)+memory+awakening;
  const percent=(ctx.powerPercent||0)+(unit.nextPowerPercent||0);
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
  return ctx.hitRolls.reduce((sum,value)=>sum+value,0);
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
const gameSpawns=[16,9,25,33];
function gameBlocked(b,u) {
  return new Set([...b.walls,...Object.values(b.units).filter(v=>v.id!==u.id&&gameAlive(v)).map(v=>v.pos)]);
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
  if(path.length){
    u.pos=path.at(-1);
    b.moved?.add(u.id);
  }
  return path.length;
}
function gameDeckEffects(b,when){
  for(const actor of Object.values(b.units)){
    if(!gameAlive(actor))continue;
    const sources=(actor.startingCards||[]).map(id=>actor.library[id]);
    sources.push(...(actor.passives||[]).map(gamePassiveSource),...gameHeldStackSources(actor));
    for(const card of sources){
      if(!gameAlive(actor)||!card||(!card.passive&&!cardUsable(actor,card))||!card.effects.some(effect=>effect.when===when))continue;
      if(card.stackCount&&!actor.stacks[card.name])continue;
      const targets=card.passive||card.target==='tile'?[]:actor.collapsed?collapseTargets(card,actor,Object.values(b.units)):gameAllowedTargets(b,actor,card);
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
  if (!gameAlive(enemy)||!party.length) {
    b.phase='finished';
    b.result=gameAlive(enemy)?'패배':'승리';
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
  const victim=party.find(u=>u.provoked)||party.slice().sort((a,c)=>gameDistance(a,enemy)-gameDistance(c,enemy))[0];
  if(victim.provoked)gameLog(b,victim.name+' · 도발로 예고 공격 유도');
  for(const unit of party)unit.provoked=false;
  const distance=gameDistance(victim,enemy);
  if(distance>4&&!enemy.rootNext&&!enemy.blockedRounds)gameMove(b,enemy,victim.pos,Math.min(bounded(2+enemy.nextMove,0,7),distance-4),true);
  enemy.rooted=!!enemy.rootNext;
  enemy.rootNext=false;enemy.nextMove=0;
  b.intent={target:victim.id,card:gameFoe,reachable:gameActionLimit(enemy)>0&&gameReach(gameFoe,enemy,victim)};
  b.plans={};
  b.phase='planning';
  if(b.round===1)gameDeckEffects(b,'battleStart');
  gameDeckEffects(b,'turnStart');
  b.intent.reachable=gameActionLimit(enemy)>0&&gameReach(gameFoe,enemy,victim);
  if(!gameAlive(enemy)||!party.some(gameAlive))gameNext(b);
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
function gameImportCards(source,owned,shared=false){
  if(!Array.isArray(source)||!source.length||source.length>24||source.some(card=>
    !card||typeof card!=='object'||typeof card.id!=='string'||!card.id||card.id.length>70||
    gameCatalogue.some(builtIn=>builtIn.id===card.id)||!Array.isArray(card.effects)
  ))gameFail('가져올 카드의 형식을 확인하세요.');
  const ids=new Map(source.map(card=>[card.id,gameId()]));
  if(ids.size!==source.length)gameFail('파일에 같은 카드 ID가 여러 번 나와요.');
  if(owned.length+source.length>24)gameFail('가져올 카드를 포함해 보관함에는 최대 24장까지 저장할 수 있어요.');
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
function gameBegin(state,members,settings,actor,collections) {
  const selected=members.filter(m=>m.seat>0);
  const solo=settings.solo===true;
  if(solo&&selected.length)gameFail('혼자 연습은 플레이어 자리를 비운 뒤 시작하세요.');
  const units={};
  for(const m of selected) {
    const p=state.profiles[m.id];
    const collection=collections.get(m.id);
    const owned=[...gameCatalogue,...collection.cards];
    const cards=gameDeck(owned,collection.deck);
    units[m.id]=gameUnit(m.id,p?.name||m.name,gameSpawns[m.seat-1],cards,false,false,[...owned,...(p?.passiveCards||[])]);
    units[m.id].passives=(p?.passives||[]).filter(passive=>passive.enabled);
    units[m.id].stackDefinitions=Object.fromEntries(collection.stackTraits.map(trait=>[trait.name,trait]));
    if(p?.mind!==undefined)units[m.id].mind=p.mind;
    if(units[m.id].mind===0)units[m.id].zero='pending';
  }
  if(solo) {
    const p=state.profiles[actor.id];
    const collection=collections.get(actor.id);
    const owned=[...gameCatalogue,...collection.cards];
    const cards=gameDeck(owned,collection.deck);
    units[actor.id]=gameUnit(actor.id,p?.name||actor.name,gameSpawns[0],cards,false,false,[...owned,...(p?.passiveCards||[])]);
    units[actor.id].passives=(p?.passives||[]).filter(passive=>passive.enabled);
    units[actor.id].stackDefinitions=Object.fromEntries(collection.stackTraits.map(trait=>[trait.name,trait]));
    if(p?.mind!==undefined)units[actor.id].mind=p.mind;
    if(units[actor.id].mind===0)units[actor.id].zero='pending';
  }
  const free=gameSpawns.filter(pos=>!Object.values(units).some(u=>u.pos===pos));
  const count=Number(settings.bots);
  if(!gameInt(count,0,free.length))gameFail('봇은 비어 있는 플레이어 자리에만 넣을 수 있어요.');
  for(let i=0;i<count;i++)units['bot'+i]=gameUnit('bot'+i,gameBots[i],free[i],gameStarterDeck,true);
  if(!Object.keys(units).length)gameFail('플레이어 또는 봇을 한 명 이상 배치하세요.');
  units.enemy=gameUnit('enemy','존속의 집행체',22,[gameFoe],true,true);
  units.enemy.boss=true;
  const battle={round:1,units,walls:gameWalls,log:['빈 객차. 존속의 집행체가 남은 승객을 찾아 들어왔습니다.'],result:null};
  gameNext(battle);
  return battle;
}

const gameActionLimit=u=>u.blockedRounds?0:bounded((u.baseActions??baseActions)+(u.bonusActions||0)-(u.actionPenalty||0),0,maxActions);
const gamePlannedCards=plan=>plan?.cards??(plan?.card?[plan]:[]);
const gameHasClash=plan=>gamePlannedCards(plan).some(card=>card.clash);
function gameAllowedTargets(b,u,card) {
  if(card.role==='counter')return [u];
  if(card.target==='self')return gameAlive(u)&&gameReach(card,u,u)?[u]:[];
  return Object.values(b.units).filter(v=>gameAlive(v)&&v.enemy!==u.enemy&&gameReach(card,u,v));
}
function gameSelect(b,u,input,ai=false) {
  const cardId=input.card||null;
  if(cardId&&!gameActionLimit(u))gameFail('이번 턴에 사용할 수 있는 카드가 없어요.');
  const crisis=u.zero==='crisis';
  const vow=u.crisisVow||input.vow;
  if(crisis&&!Object.hasOwn(crisisVows,vow))gameFail('붕괴 직전 지킬 뜻을 선택하세요.');
  const card=cardId&&Object.hasOwn(u.library,cardId)?u.library[cardId]:null;
  const granted=card?.temporary&&cardUsable(u,card);
  if(cardId&&!u.hand.includes(cardId)&&!granted)gameFail('손패에 있는 카드를 선택하세요.');
  if(card&&!cardUsable(u,card))gameFail('현재 상태에서 사용할 수 없는 카드입니다.');
  const goal=input.pos??u.pos;
  if(!gridValid(goal)||!gridPaths(u.pos,u.move,gameBlocked(b,u)).has(goal))gameFail('이동 가능 거리를 확인하세요.');
  const copyId=card?.effects.some(e=>e.kind==='copyChosen')?input.copyId:null;
  if(card?.effects.some(e=>e.kind==='copyChosen')&&!u.hand.some((id,index)=>id===copyId&&index!==u.hand.indexOf(cardId))){
    gameFail('손패에서 복제할 카드를 선택하세요.');
  }
  const discard=!ai&&u.hand.some((id,index)=>id===input.discard&&index!==u.hand.indexOf(cardId))?input.discard:null;
  if(card?.target==='tile'){
    if(!gridValid(input.targetTile)||b.walls.includes(input.targetTile)||!gridCardInRange(card,goal,input.targetTile))
      gameFail('기본 사거리 안에서 광역 중심 칸을 선택하세요.');
    if(input.clash)gameFail('타일 지정 광역은 합을 걸 수 없어요.');
    return {card:cardId,pos:goal,targetTile:input.targetTile,targets:[],clash:false,...(crisis?{vow}:{}),...(copyId?{copyId}:{}),discard};
  }
  // Collapse targets are calculated after movement. Ignore submitted target and clash choices.
  if(u.collapsed){
    if(card&&!['guard','counter'].includes(card.role)&&!collapseTargets(card,{...u,pos:goal},Object.values(b.units)).length)gameFail('선택한 위치에서 사거리 안에 자동 표적이 없어요.');
    return {card:cardId,pos:goal,targets:[],clash:false,...(copyId?{copyId}:{}),discard};
  }
  const clash=input.clash===true;
  if(clash&&(['assist','guard','counter'].includes(card?.role)||!card?.clash||!b.intent.reachable||!gameAlive(b.units[b.intent.target])))gameFail('이 행동으로는 현재 합을 걸 수 없어요.');
  const guarding=card?.role==='guard';
  const targetLimit=gridTargetLimit(card);
  const targets=(guarding||targetLimit)&&Array.isArray(input.targets)?[...new Set(input.targets)]:[];
  if(targets.length>5||targets.some(t=>typeof t!=='string'||!Object.hasOwn(b.units,t)))gameFail('대상을 확인하세요.');
  const preview={...u,pos:goal};
  const available=guarding?Object.values(b.units).filter(v=>v!==u&&v.enemy===u.enemy&&gameAlive(v)&&gameReach(card,preview,v)):
    card?gameAllowedTargets(b,preview,card):[];
  if(card&&!guarding&&!available.length)gameFail('선택한 위치에서 사거리 안에 대상이 없어요.');
  if(guarding?targets.length>1:targetLimit&&(!targets.length||targets.length>targetLimit))gameFail('카드의 대상 수를 확인하세요.');
  if(!targets.every(id=>available.some(v=>v.id===id)))gameFail('선택한 위치에서 대상이 사거리 밖에 있어요.');
  if(clash&&b.intent.target===u.id&&!gameReach(b.intent.card,b.units.enemy,{...u,pos:goal}))gameFail('이동할 위치가 적의 예고 공격 사거리 밖이에요.');
  if(clash&&!(card.target==='area'?available.some(v=>v.enemy):targets.includes('enemy')))gameFail('합을 걸려면 예고 공격을 하는 적을 대상으로 선택하세요.');
  if(clash&&Object.entries(b.plans).some(([id,plan])=>id!==u.id&&gameHasClash(plan)))gameFail('이미 다른 참가자가 합을 확정했어요.');
  return {card:cardId,...(crisis?{vow}:{}),pos:goal,targets,clash,...(copyId?{copyId}:{}),discard};
}
function gameSelectTurn(b,u,input,ai=false){
  if(!Object.hasOwn(input,'cards'))return gameSelect(b,u,input,ai);
  const {cards,pos,vow,discard}=input;
  if(!Array.isArray(cards)||cards.length>gameActionLimit(u))gameFail('이번 턴 행동량까지만 카드를 예약할 수 있어요.');
  if(cards.some(card=>!card||typeof card.card!=='string'||!card.card))gameFail('예약할 카드를 확인하세요.');
  if(cards.filter(card=>card.clash===true).length>1)gameFail('예고 공격 하나에는 카드 한 장만 합을 걸 수 있어요.');
  if(!cards.length)return gameSelect(b,u,{pos,vow,discard},ai);
  const hand=[...u.hand], temporary=new Set();
  const chosen=cards.map(choice=>{
    const plan=gameSelect(b,{...u,hand},{...choice,pos,vow,discard:null},ai);
    const index=hand.indexOf(plan.card);
    if(index>=0)hand.splice(index,1);
    else {
      if(temporary.has(plan.card))gameFail('임시 카드는 한 턴에 한 번만 사용할 수 있어요.');
      temporary.add(plan.card);
    }
    return plan;
  });
  return {...chosen[0],cards:chosen,discard:hand.includes(discard)&&!ai?discard:null};
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
    for(const pos of paths.keys())if(collapseTargets(card,{...u,pos},units).length)return gameSelect(b,u,{card:card.id,pos},true);
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
      if(card.role==='overload'&&u.mind<45)continue;
      const danger=b.units[b.intent.target];
      const preview={...u,pos:goal};
      const targetTile=card.target==='tile'?gameChooseTile(b,card,preview):null;
      const targets=card.target==='tile'?(targetTile==null?[]:[enemy]):card.role==='guard'?[u]:gameAllowedTargets(b,preview,card);
      if(!targets.length)continue;
      if(card.role==='guard'&&(!b.intent.reachable||danger===u||!gameReach(card,{...u,pos:goal},danger)||Object.values(b.plans).some(gameHasClash)))continue;
      if(card.role==='counter'&&(danger!==u||!gameReach(b.intent.card,enemy,{...u,pos:goal})||
        !gameReach(card,{...u,pos:goal},enemy)||Object.values(b.plans).some(gameHasClash)))continue;
      const clash=allowClash&&b.intent.reachable&&(danger.id!==u.id||gameReach(b.intent.card,enemy,{...u,pos:goal}))&&!['assist','guard','counter'].includes(card.role)&&card.clash&&gameReach(card,{...u,pos:goal},enemy)&&!Object.values(b.plans).some(gameHasClash);
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
  const n=e.threshold,other=u===ctx.actor?target:ctx.actor;
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
    case 'stack': return (u.stacks[e.tag]||0)>=n;
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
    const portion=Math.min(count,run.count);
    if(portion)taken.push({count:portion,power:run.power});
    if(portion<run.count)remaining.push({count:run.count-portion,power:run.power});
    count-=portion;
  }
  return {taken,remaining};
}
function gameWriteStacks(unit,tag,runs){
  unit.stacks[tag]=runs.reduce((total,run)=>total+run.count,0);
  if(!unit.stacks[tag]&&unit.stackTraits)delete unit.stackTraits[tag];
  if(runs.every(run=>run.power===1)){
    if(unit.stackRuns)delete unit.stackRuns[tag];
    return;
  }
  const merged=[];
  for(const run of runs){
    const previous=merged.at(-1);
    if(previous?.power===run.power)previous.count+=run.count;
    else merged.push({...run});
  }
  (unit.stackRuns??={})[tag]=merged;
}
function gameTakeStacks(unit,tag,count){
  const {taken,remaining}=gameSplitStacks(gameStackRuns(unit,tag),count);
  if(taken.length)gameWriteStacks(unit,tag,remaining);
  return taken.reduce((total,run)=>total+run.count*run.power,0);
}
function gameGrantStacks(b,unit,effect,amount,trait,sourceRuns){
  const tag=effect.tag;
  const room=Math.max(0,(effect.stackCap??maxStatusStacks)-(unit.stacks[tag]||0));
  const gained=Math.min(amount,room);
  if(gained<=0)return 0;
  const blocked=Math.min(unit.stackWard?.[tag]||0,gained);
  if(blocked){
    unit.stackWard[tag]-=blocked;
    if(!unit.stackWard[tag])delete unit.stackWard[tag];
    gameLog(b,unit.name+' · '+tag+' '+blocked+' 저항');
  }
  const count=gained-blocked;
  if(!count)return 0;
  const runs=sourceRuns?gameSplitStacks(sourceRuns,count).taken:[{count,power:1}];
  const added=runs.map(run=>({...run,power:Math.min(effect.stackPower??run.power,effect.stackPowerCap??maxStackPotency)}));
  if(trait&&!unit.stackTraits?.[tag])(unit.stackTraits??={})[tag]=trait;
  gameWriteStacks(unit,tag,[...gameStackRuns(unit,tag),...added]);
  return count;
}
function gameHealthBase(unit,basis){
  if(basis==='current')return unit.hp;
  if(basis==='missing')return unit.maxHp-unit.hp;
  return unit.maxHp;
}
const gamePoisonAmount=unit=>(unit.poison||0)+(unit.damageOverTime||[]).reduce((sum,dot)=>sum+dot.amount,0);
function gameRemovePoison(unit,amount){
  const legacy=Math.min(unit.poison||0,amount);
  unit.poison=(unit.poison||0)-legacy;
  let removed=legacy;
  for(const dot of unit.damageOverTime||[]){
    const consumed=Math.min(dot.amount,amount-removed);
    dot.amount-=consumed;
    removed+=consumed;
  }
  if(unit.damageOverTime)unit.damageOverTime=unit.damageOverTime.filter(dot=>dot.amount);
  return removed;
}
function gameEffectBasis(ctx,unit,basis){
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
  if(effect.ratioBasis)return Math.trunc(gameEffectBasis(ctx,unit,effect.ratioBasis)*amount/100);
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
    case 'rallyShield': return amount;
    case 'mind':
    case 'drain': return amount; // The maximum is 100.
    default: return Math.floor(gameHealthBase(unit,effect.healthBasis)*amount/100);
  }
}
function gamePayScaleCost(b,ctx,effect){
  if(ctx.scalePayments.has(effect))return ctx.scalePayments.get(effect);
  const actor=ctx.actor;
  const {amount,mode,healthBasis}=effect.scaleCost;
  const resource=effect.scaleDiscard?'discard':effect.scaleResource;
  const base=resource==='discard'?actor.hand.length:resource==='health'?gameHealthBase(actor,healthBasis):100;
  const cost=mode==='percent'?Math.floor(base*amount/100):amount;
  let paid=0;
  if(gameAlive(actor)&&cost>0){
    if(resource==='discard'&&actor.hand.length>=cost){
      actor.grave.push(...actor.hand.splice(0,cost));
      ctx.discarded+=cost;
      paid=cost;
    }else if(resource==='health'&&actor.hp>cost){
      actor.hp-=cost;
      ctx.paidHealth+=cost;
      paid=cost;
    }else if(resource==='mind'&&!actor.enemy&&actor.mind>=cost){
      gameMental(b,actor,-cost);
      ctx.paidMind+=cost;
      paid=cost;
    }
  }
  const label=resource==='discard'?'손패':resource==='health'?'체력':'정신력';
  gameLog(b,actor.name+' · '+label+(paid?' '+paid+' 소비':' 대가 미지불'));
  ctx.scalePayments.set(effect,paid);
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
function gameFlowTestValue(b,ctx,target,test,effect){
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
        for(let i=0;i<step.count;i++)yield* run(node.then,iterations+'/'+i);
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
function gameTriggers(b,ctx,when,target,depth=0,hitIndex=0) {
  if(depth>3)return;
  const {actor,card}=ctx;
  const entries=card.effects.filter(effect=>{
    if(effect.when!==when&&!(when==='use'&&effect.when==='base'))return false;
    if(ctx.reactionRound!=null&&(!effect.reactionRounds||ctx.reactionRound+effect.reactionRounds<=b.round))return false;
    if(hitIndex)return effect.hitIndex===hitIndex;
    return !effect.hitIndex||(['wall','consume'].includes(when)&&effect.hitIndex===ctx.hitIndex);
  });
  if(when==='use'){
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
      selection={units:gameEffectRecipients(b,actor,effect.to),applied:new Set()};
      ctx.effectRecipients.set(effect,selection);
    }
    for(const unit of selection.units){
      if(gameAlive(unit)&&!selection.applied.has(unit.id))gameApplyEffect(b,ctx,when,target,depth,effect,unit,selection.applied);
    }
  }
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
  const {actor,card}=ctx;
  if(effect.kind==='giveCard'&&(u.enemy||!gameAlive(u)||!actor.library[effect.givenCardId]||u.hand.length>=12))return;
  if(stagedPowerEffects.includes(effect.kind)&&ctx.once.has(effect))return;
  if(effect.kind==='consume'&&!(u.stacks[effect.tag]>0))return;
  if(effect.kind==='hitLeech'&&!ctx.base)return;
  const singleTotal=effect.ratioBasis==='totalDamage'&&effect.to==='self';
  if(singleTotal&&ctx.totalDamageUsed?.has(effect))return;
  if(effect.kind==='bossDamage'&&(!gameBoss(u)||u.enemy===actor.enemy))return;
  if(effect.kind==='replayHit'&&(ctx.replayingHit||ctx.hitRepeat))return;
  if(effect.kind==='amplifyHit'&&(!ctx.hitAmplifiers||ctx.replayingHit))return;
  if(!gameEffectCondition(b,ctx,u,effect,target,effect.when))return;
  const limit=effect.limit;
  const key=limit?card.id+':'+card.effects.indexOf(effect.flowSource||effect):null;
  const period=limit?.period==='turn'?b.round:0;
  const usage=key?actor.effectUsage?.[key]:null;
  const count=usage?.period===period?usage.count:0;
  // A group activation spends one use while its effect is applied to each eligible recipient.
  const charge=key&&!applied?.size;
  if(charge&&count>=limit.count)return;
  if((['battleStart','turnStart','turnEnd','attackEnd','unopposed','roll'].includes(when)&&effect.to==='self'&&effect.kind!=='hitLeech')||effect.to==='self'&&['extraAction','dodge','trueStrike','stackWard','rerollLow',...bossDamageModifiers].includes(effect.kind)||copyEffects.includes(effect.kind)||discardCosts.includes(effect.kind)||resourceCosts.includes(effect.kind)||teamEffects.includes(effect.kind)||
    effect.to==='self'&&['hearDemon','refuseDemon','shedShell','awakenBody','inscribeMeaning'].includes(effect.kind)||effect.kind==='critSpend'&&effect.to==='self'&&when==='use'||effect.scaleResource&&effect.to==='self'||!['amplifyHit','hitLeech'].includes(effect.kind)&&effect.to==='self'&&(['hit','damage','wall'].includes(when)||when==='consume'&&!['perStack','consumeHeal','shieldPerStack'].includes(effect.kind))){
    if(ctx.once.has(effect))return;
    ctx.once.add(effect);
  }
  // Only numerical effects belonging to this hit use the bonuses accumulated earlier in this sequence.
  const amplifier=effect.hitIndex===ctx.hitIndex&&ctx.hitAmplifiers?.get(ctx.hitIndex);
  const amplifiable=effect.kind!=='amplifyHit'&&!unnumberedEffects.includes(effect.kind);
  const raw=effect.amountExpr?Math.trunc(gameFlowValue(b,ctx,u,effect.amountExpr,effect.hitIndex)):effect.amount;
  const signed=signedEffects.includes(effect.kind)||ratioEffects[effect.kind]?.[1]===0;
  const maximum=effect.kind==='blockAction'?maxStatusRounds:effect.kind==='reduceActions'?maxActions:
    effect.kind==='consume'?maxCollectiveStackConsume:effect.kind==='amplifyHit'?300:effect.amountExpr?999:Infinity;
  const value=bounded(raw,signed?-maximum:0,maximum);
  if(!value)return;
  const magnitude=amplifier&&amplifiable?
    Math.sign(value)*(Math.floor(Math.abs(value)*(100+amplifier.percent)/100)+amplifier.fixed):value;
  const multiplier=effect.scaleCost?gamePayScaleCost(b,ctx,effect):effect.scaleDiscard?ctx.discarded:
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
  if(singleTotal)(ctx.totalDamageUsed??=new Set()).add(effect);
    if(stagedPowerEffects.includes(effect.kind)){
      ctx.once.add(effect);
      const key=effect.kind+(effect.amountMode==='percent'&&!effect.ratioBasis?'Percent':'');
      ctx[key]=(ctx[key]||0)+n;
      return;
    }
    switch(effect.kind) {
      case 'replaceCard': ctx.replaced=true; break;
      case 'blockAction':
        u.nextBlockedRounds=Math.max(u.nextBlockedRounds||0,n);
        gameLog(b,u.name+' · 다음 '+n+'라운드 행동 불가');
        break;
      case 'unblockAction':
        if(u.blockedRounds||u.nextBlockedRounds){
          delete u.blockedRounds;delete u.nextBlockedRounds;
          gameLog(b,u.name+' · 행동 불가 해제');
        }
        break;
      case 'reduceActions':
        u.nextActionPenalty=Math.min(maxActions,(u.nextActionPenalty||0)+n);
        gameLog(b,u.name+' · 다음 턴 행동량 −'+n);
        break;
      case 'extraAction': if(!u.enemy)u.nextActions=Math.min(maxActions-1,(u.nextActions||0)+n); break;
      case 'dodge': u.dodge=Math.min(99,(u.dodge||0)+n); break;
      case 'trueStrike': u.trueStrike=Math.min(99,(u.trueStrike||0)+n); break;
      case 'healCut': {
        const amount=Math.min(100,n), through=b.round+(effect.duration??2)-1;
        const cuts=u.healCuts??=[];
        const active=cuts.find(entry=>entry.amount===amount);
        if(active)active.through=Math.max(active.through,through);
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
        if(ctx.critical&&ctx.critSpent)gameDamage(b,u,n*ctx.critSpent,actor);
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
          gameMental(b,u,-n);
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
          else ally.shield=Math.min(999,ally.shield+benefit);
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
        u.hand.push(...Array(count).fill(card.id));
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
        if(effect.kind==='debtShield')u.shield=Math.min(999,u.shield+Math.floor((n-remaining)*(effect.conversion??100)/100));
        break;
      }
      case 'delayedStrike':
        if(u!==actor&&u.enemy!==actor.enemy&&gameAlive(u)){
          (u.delayedStrike??=[]).push({round:b.round+(effect.delayRounds??1),amount:n,source:actor.id});
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
        if(!u.enemy&&!u.hand.length)u.hand.push(...u.grave.splice(-Math.min(n,12)));
        break;
      case 'barrierBurst': u.barrierBurst=Math.min(999,(u.barrierBurst||0)+n);break;
      case 'shieldBreakDraw': if(ctx.brokeShield&&!u.enemy)gameDraw(u,n);break;
      case 'riposte': if(ctx.clashDifference===0&&u.enemy!==actor.enemy)gameDamage(b,u,n,actor);break;
      case 'shieldPower': ctx.mod+=Math.floor(u.shield*n/100);break;
      case 'gravePower': ctx.mod+=u.grave.length*n;break;
      case 'shieldGift': if(u!==actor)u.shield+=gameRemoveShield(actor,Math.min(n,999-u.shield));break;
      case 'allyHeal': gameSupportHeal(b,ctx,u,n);break;
      case 'lethalGuard': u.lethalGuard=Math.max(u.lethalGuard||0,n);break;
      case 'recoverMindFloor': gameMental(b,u,Math.max(0,n-u.mind));break;
      case 'purgePoison': gameRemovePoison(u,n);break;
      case 'detonatePoison': {
        const consumed=gameRemovePoison(u,n);
        if(consumed){gameDamage(b,u,Math.floor(consumed*(effect.conversion??200)/100),actor);}
        break;
      }
      case 'lateDraw': u.lateDraw=Math.min(12,(u.lateDraw||0)+n);break;
      case 'recycleExile': u.deck.unshift(...u.exile.splice(-n));break;
      case 'graveToShield': {
        const cards=u.grave.splice(-n);
        u.exile.push(...cards);
        u.shield=Math.min(999,u.shield+(effect.perCard??2)*cards.length);
        break;
      }
      case 'draw': if(!u.enemy)gameDraw(u,n); break;
      case 'discardAllCost':
      case 'discardExactCost': {
        const count=effect.kind==='discardAllCost'?u.hand.length:n;
        if(count&&count<=u.hand.length){
          u.grave.push(...u.hand.splice(0,count));
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
        u.hand.push(...Array(count).fill(given.id));
        gameLog(b,u.name+' · '+given.name+' '+count+'장 획득');
        break;
      }
      case 'copySelf':
      case 'copyFixed':
      case 'copyChosen': {
        const id=effect.kind==='copySelf'?card.id:effect.kind==='copyFixed'?effect.copyId:ctx.copyId;
        const count=Math.min(n,12-u.hand.length);
        if(!u.enemy&&count>0&&Object.hasOwn(u.library,id)){
          u.hand.push(...Array(count).fill(id));
          gameLog(b,u.name+' · '+u.library[id].name+' 복제 '+count+'장');
        }
        break;
      }
      case 'discard': u.grave.push(...u.hand.splice(0,n)); break;
      case 'recover': {const count=Math.min(n,12-u.hand.length,u.grave.length);if(count>0)u.hand.push(...u.grave.splice(-count));break;}
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
      case 'damage': gameDamage(b,u,n,actor); break;
      case 'percent': gameDamage(b,u,(ctx.base||0)*n/100,actor); break;
      case 'heal': gameSupportHeal(b,ctx,u,n); break;
      case 'shield': u.shield=Math.min(999,u.shield+n); break;
      case 'reduce': u.reduce=Math.min(999,u.reduce+n); break;
      case 'power': ctx.mod+=n; break;
      case 'movement': if(u.rooted)break;u.move=Math.min(7,u.move+n); if(u===actor&&ctx.goal!==undefined)u.move-=gameMove(b,u,ctx.goal,u.move); break;
      case 'nextMove': u.nextMove=Math.min(7,u.nextMove+n); break;
      case 'move': {
        const goal=target&&target!==u?target.pos: b.units.enemy.pos;
        gameMove(b,u,goal,n,true);
        break;
      }
      case 'push':
      case 'pull': {
        if(actor.id===u.id||!gameAlive(u))break;
        for(let i=0;i<n;i++){
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
      case 'stack': gameGrantStacks(b,u,effect,n,actor.stackDefinitions?.[tag]); break;
      case 'remove': gameTakeStacks(u,tag,n); break;
      case 'consume': {
        const budget=effect.consumeAmount==='all'?Infinity:n;
        let used=0,potency=0;
        for(const source of consumeGroup||[u]){
          const spend=Math.min(budget-used,source.stacks[tag]||0);
          potency+=gameTakeStacks(source,tag,spend);
          used+=spend;
          if(used>=budget)break;
        }
        if(used){
          const previous=ctx.usedPotency;
          ctx.usedPotency=potency;
          if(consumeGroup||effect.consumeAmount==='all')gameLog(b,actor.name+' · '+tag+' '+used+' 소모 → '+u.name);
          gameTriggers(b,ctx,'consume',u,depth+1);
          ctx.usedPotency=previous;
        }
        break;
      }
      case 'perStack': if(ctx.usedPotency)gameDamage(b,u,ctx.usedPotency*n,actor);break;
      case 'mind': gameMental(b,u,n);break;
      case 'drain': gameMental(b,u,-n);break;
      case 'pierce':
      case 'recoil': gameDamage(b,u,n,actor,true);break;
      case 'stripShield': gameRemoveShield(u,n);break;
      case 'drainLife': if(u!==actor)gameHeal(b,actor,gameDamage(b,u,n,actor));break;
      case 'healPercent': gameHeal(b,u,Math.floor(u.maxHp*n/100));break;
      case 'healMissing': gameHeal(b,u,Math.floor((u.maxHp-u.hp)*n/100));break;
      case 'fortify': u.nextShield=Math.min(999,(u.nextShield||0)+n);break;
      case 'focus': u.nextPower=bounded((u.nextPower||0)+n,-999,999);break;
      case 'weaken': u.nextPower=bounded((u.nextPower||0)-n,-999,999);break;
      case 'nextSlow': u.nextMove=Math.max(-7,u.nextMove-n);break;
      case 'retreat': {
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
        if(other&&u!==other&&gameAlive(u)&&gameAlive(other)&&gameDistance(u,other)<=n){
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
      case 'stackDamage': if(u.stacks[tag])gameDamage(b,u,stackPotency(u,tag)*n,actor);break;
      case 'poison':
        if(effect.dotRounds){
          const amount=Math.min(n,999-gamePoisonAmount(u));
          const through=b.round+effect.dotRounds-1;
          if(amount>0){
            const effects=u.damageOverTime??=[];
            const existing=effects.find(dot=>dot.through===through);
            if(existing)existing.amount+=amount;
            else effects.push({amount,through});
            gameLog(b,u.name+' · 지속 피해 '+amount+' · '+effect.dotRounds+'라운드');
          }
        }else u.poison=Math.min(999,(u.poison||0)+n);
        break;
      case 'regen': u.regen=Math.min(999,(u.regen||0)+n);break;
      case 'clearStatus': u.poison=0;delete u.damageOverTime;u.regen=0;break;
      case 'mindTransfer': {
        if(u===actor||u.enemy)break;
        const taken=Math.min(n,u.mind,100-actor.mind);
        gameMental(b,u,-taken);gameMental(b,actor,taken);
        break;
      }
      case 'cycle': {
        if(u.enemy)break;
        const discarded=u.hand.splice(0,n);
        u.grave.push(...discarded);gameDraw(u,discarded.length);
        break;
      }
      case 'mill': u.grave.push(...u.deck.splice(-n));break;
      case 'recoverDeck': u.deck.push(...u.grave.splice(-n));break;
      case 'reclaim': {
        const count=Math.min(n,12-u.hand.length,u.exile.length);
        if(count>0)u.hand.push(...u.exile.splice(-count));
        break;
      }
      case 'topdeck': ctx.destination='deckTop';break;
      case 'bottomdeck': ctx.destination='deckBottom';break;
      case 'expose': u.expose=Math.min(999,(u.expose||0)+n);break;
      case 'thorns': u.thorns=Math.min(999,(u.thorns||0)+n);break;
      case 'temporaryShield': {
        const amount=Math.min(n,999-u.shield);
        u.shield+=amount;u.temporaryShield=(u.temporaryShield||0)+amount;
        break;
      }
      case 'stealShield': {
        if(u!==actor)actor.shield+=gameRemoveShield(u,Math.min(n,999-actor.shield));
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
      case 'shieldPerStack': if(ctx.usedPotency)u.shield=Math.min(999,u.shield+ctx.usedPotency*n);break;
      case 'shuffleDeck': u.deck=gameShuffle(u.deck);break;
      case 'buryHand': u.deck.unshift(...u.hand.splice(0,n).reverse());break;
      case 'exileGrave': u.exile.push(...u.grave.splice(-n));break;
      case 'drawTo': if(!u.enemy)gameDraw(u,Math.max(0,Math.min(n,12)-u.hand.length));break;
    }
}
function gameContext(actor,card,targets,moved=0){
  return {actor,card,targets,moved,mod:actor.enemy?0:mentalPower(actor.mind),destination:'grave',replay:false,discarded:0,paidHealth:0,paidMind:0,once:new Set(),effectRecipients:new Map(),scalePayments:new Map()};
}
function gameFinishCard(b,ctx){
  gameTriggers(b,ctx,'end',ctx.targets[0]||ctx.actor);
  const u=ctx.actor,id=ctx.originId||ctx.card.id;
  if(u.enemy||ctx.temporary)return;
  if(ctx.destination==='hand'&&u.hand.length<12)u.hand.push(id);
  else if(ctx.destination==='deckTop')u.deck.push(id);
  else if(ctx.destination==='deckBottom')u.deck.unshift(id);
  else if(ctx.destination==='exile')u.exile.push(id);
  else u.grave.push(id);
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
  const active=Object.entries(unit.cardReactions||{}).flatMap(([id,round])=>
    !pendingIds.has(id)&&unit.library[id]?[{card:unit.library[id],reactionRound:round}]:[]);
  for(const source of [...pending,...active]){
    if(!gameAlive(unit))break;
    if(!source.card.effects.some(effect=>effect.when===when))continue;
    const ctx=gameContext(unit,source.card,[attacker],source.moved);
    Object.assign(ctx,{base:event.base,critical:event.critical,brokeShield:event.brokeShield,
      discarded:source.discarded||0,paidHealth:source.paidHealth||0,paidMind:source.paidMind||0,
      reactionRound:source.reactionRound});
    gameTriggers(b,ctx,when,attacker);
  }
}
function gameClashEffects(b,left,right){
  for(const [ctx,opponent] of [[left,right.actor],[right,left.actor]]){
    gameTriggers(b,ctx,'clash',opponent);
    gamePassives(b,ctx.actor,'clash',opponent,ctx);
  }
}
function gameStrike(b,ctx,target,roll){
  gamePose(b,ctx.actor,'attack');
  const actor=ctx.actor;
  if(target.dodge>0){
    target.dodge--;
    if(!actor.trueStrike){
      gameLog(b,target.name+' · 타격 회피');
      return null;
    }
    actor.trueStrike--;
    gameLog(b,actor.name+' · '+target.name+'의 회피 무효화');
  }
  const held=gameHeldModifiers(b,actor,target);
  const chance=bounded((actor.critChance||0)+(actor.critStacks||0)*5+(held.critChance||0),0,100);
  ctx.critical=roll>0&&(actor.critCharges>0||chance>0&&gameRoll(100)<=chance);
  if(ctx.critical){
    if(actor.critCharges>0)actor.critCharges--;
    ctx.anyCritical=true;
    const multiplier=150+bounded((actor.critMultiplier||0)+(held.critMultiplier||0),-50,850);
    roll=Math.floor(roll*multiplier/100);
    gameLog(b,actor.name+' · 치명타 ('+multiplier+'%) → '+target.name);
  }
  const shield=target.shield;
  const dealt=gameDamage(b,target,roll,actor,false,true);
  if(actor.enemy!==target.enemy||actor.collapsed&&actor!==target){
    const event={...ctx,base:dealt,brokeShield:shield>0&&target.shield===0};
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
  return dealt;
}
function gameHitSequence(b,ctx,target,rolls,intercepted,replay,indexOnly=null){
  let base=0,critical=false,brokeShield=false,struck=false;
  if(indexOnly===null)ctx.hitAmplifiers=new Map();
  const canStrike=()=>gameAlive(ctx.actor)&&gameAlive(target)&&(intercepted||gameReach(ctx.card,ctx.actor,target));
  const strike=roll=>{
    const shield=target.shield;
    const dealt=gameStrike(b,ctx,target,roll);
    if(dealt===null)return;
    struck=true;
    ctx.base=dealt;
    ctx.brokeShield=shield>0&&target.shield===0;
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
  if(!tile&&(!selected||card.splash&&(!gameAlive(selected)||!intercepted&&!gameReach(card,actor,selected))))return;
  ctx.splashOrigin=!tile&&card.splash?{id:selected.id,pos:selected.pos}:null;
  ctx.actionGroups=gameActionGroups(b,ctx);
  const {primary,secondary}=ctx.actionGroups;
  const landed=new Map();
  let previous=new Set();
  ctx.hitAmplifiers=new Map();
  const eligible=unit=>gameAlive(unit)&&unit!==actor&&(actor.collapsed||unit.enemy!==actor.enemy)&&
    (tile||intercepted||card.splash&&unit!==primary||gameReach(card,actor,unit));
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
    if(!gameAlive(target)||(!skipReach&&!gameReach(ctx.card,ctx.actor,target)))return false;
    ctx.brokeShield=false;
    ctx.critical=false;
    if(target===ctx.actor||(!ctx.actor.collapsed&&target.enemy===ctx.actor.enemy)){
      if(!replay)gameTriggerHit(b,ctx,target,0,false);
      return false;
    }
    if(sequence){
      if(!gameHitSequence(b,ctx,target,rolls,skipReach,replay))return false;
    }else{
      const shield=target.shield;
      const dealt=gameStrike(b,ctx,target,roll);
      if(dealt===null)return false;
      ctx.base=dealt;
      ctx.brokeShield=shield>0&&target.shield===0;
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
    for(const target of ctx.targets){
      const origin=ctx.card.splash?{id:target.id,pos:target.pos}:null;
      ctx.splashOrigin=origin;
      ctx.actionGroups=gameActionGroups(b,ctx);
      const landed=resolveHit(target,intercepted,replay);
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
    const reaction=queue?.find(candidate=>gameReach(candidate.card,defender,ctx.actor));
    if(!reaction||!gameAlive(defender)||!gameAlive(ctx.actor))continue;
    queue.splice(queue.indexOf(reaction),1);
    if(!queue.length)b.counterPlans.delete(defender.id);
    reaction.targets=[ctx.actor];
    gameLog(b,defender.name+' · 반격 → '+ctx.actor.name+' ('+reaction.card.name+')');
    gameTriggers(b,reaction,'counter',ctx.actor);
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
      (actor.collapsed||target.enemy!==actor.enemy)&&(tile||gameReach(card,actor,target)));
    for(const target of tile&&!targets.length?[null]:targets)gameTriggers(b,ctx,'unopposed',target);
  }
  gameHit(b,ctx,gameActionPower(b,ctx));
}
function gameCover(b,attacker,target){
  const options=[];
  for(const unit of Object.values(b.units)){
    if(unit===target||unit.enemy!==target.enemy||!gameAlive(unit)||unit.blockedRounds||(unit.zero&&unit.zero!=='crisis'))continue;
    for(const [index,charge] of (unit.cover||[]).entries()){
      const card=unit.library[charge.card??charge];
      if(cardUsable(unit,card)&&(!charge.target||charge.target===target.id)&&gameReach(card,unit,target)){
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
  const incoming=gameContext(attacker,b.intent.card,[unit]);
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
          .find(tile=>gridValid(tile)&&!b.walls.includes(tile)&&gameReach(card,u,{pos:tile})):undefined;
      if(card.target==='tile'&&targetTile==null)continue;
      const targets=card.target==='tile'?gameGroupUnits(gameTileGroups(b,card,u,targetTile)):guard?[u]:u.collapsed&&card.role!=='counter'?collapseTargets(card,u,Object.values(b.units)):
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
  const original=u.library[plan.card];
  if(!cardUsable(u,original))return;
  const handIndex=u.hand.indexOf(original.id);
  const temporary=handIndex<0;
  if(temporary&&!original.temporary){
    gameLog(b,u.name+' · '+original.name+'이 손패에 없어 행동을 건너뜁니다.');
    return;
  }
  if(!temporary)u.hand.splice(handIndex,1);
  const originalTargets=original.target==='tile'?gameGroupUnits(gameTileGroups(b,original,u,plan.targetTile)):['guard','counter'].includes(original.role)?[u]:u.collapsed?[]:!gridTargetLimit(original)?gameAllowedTargets(b,u,original):plan.targets.map(id=>b.units[id]).filter(v=>gameAlive(v)&&gameReach(original,u,v));
  const replacement=gameReplacement(b,u,original,plan,moved,originalTargets);
  const card=replacement?.card||original;
  const targets=replacement?.targets||originalTargets;
  if(card.cost){gameMental(b,u,-card.cost);gameLog(b,u.name+' 혹사 · 정신력 -'+card.cost);}
  const ctx=gameContext(u,card,targets,moved);
  ctx.waitingPlan=plan;
  waiting?.set(plan,ctx);
  if(card.effects.some(effect=>effect.reactionRounds)&&(u.library[card.id]===card)){
    (u.cardReactions??={})[card.id]=b.round;
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
  ctx.clash=plan.clash&&(!replacement||card.clash&&targets.includes(b.units.enemy))&&gameReach(card,u,b.units.enemy);
  gameLog(b,u.name+' · '+card.name);
  if(card.role!=='assist')gamePassives(b,u,'use',targets[0]||null,ctx);
  if(card.role==='guard'){
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
  const enemy=b.units.enemy,target=b.units[b.intent.target];
  return gameAlive(enemy)&&gameActionLimit(enemy)>0&&gameAlive(target)&&gameReach(b.intent.card,enemy,target);
}
function gameResolveWave(b,contexts,countered){
  const resolveCollapseCard=ctx=>{
    const {actor,card}=ctx;
    ctx.targets=collapseTargets(card,actor,Object.values(b.units));
    if(ctx.targets.length)gameLog(b,actor.name+' · 붕괴 자동 표적 → '+ctx.targets.map(v=>v.name).join(', '));
    else gameLog(b,actor.name+' · 사거리 안에 붕괴 표적이 없습니다.');
    for(const victim of ctx.targets)gameTriggers(b,ctx,'use',victim);
  };
  const enemy=b.units.enemy,target=b.units[b.intent.target];
  const duelist=contexts.find(c=>c.clash&&gameAlive(c.actor)&&!['guard','assist','counter'].includes(c.card.role));
  if(!countered&&duelist&&gameEnemyReady(b)){
    b.shock={};
    const incoming=gameContext(enemy,b.intent.card,[target]);
    gameClashEffects(b,duelist,incoming);
    const ours=gameActionPower(b,duelist,enemy),theirs=gameActionPower(b,incoming,duelist.actor);
    gameLog(b,'합 '+duelist.actor.name+' '+ours+' : '+theirs+' 집행체');
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
    duelist.done=true;countered=true;
    b.waitingCards?.get(duelist.actor.id)?.delete(duelist.waitingPlan);
  }
  for(const ctx of contexts.filter(c=>!c.done&&!['guard','assist','counter'].includes(c.card.role))){
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
    ctx.triggered=ctx.targets.some(v=>gameAlive(v)&&(tile||gameReach(ctx.card,ctx.actor,v)));
    if(ctx.triggered){
      b.shock={};gameLog(b,ctx.actor.name+' 원호 공격');
      gamePassives(b,ctx.actor,'use',ctx.targets[0],ctx);
      if(!ctx.actor.collapsed)gameTriggers(b,ctx,'use',ctx.targets[0]);
      gameUnopposedAttack(b,ctx);
    }
  }
  return countered;
}
function gameResolve(b) {
  const enemy=b.units.enemy;
  const party=Object.values(b.units).filter(u=>!u.enemy&&gameAlive(u));
  b.allyHit=false;
  b.resolving=true;
  b.proofs=new Set();
  b.moved=new Set();
  b.exposedToAttack=new Set();
  b.poses=[];
  for(const unit of Object.values(b.units))unit.pose=unit.hp?'idle':'down';
  gameLog(b,'라운드 '+b.round+' 처리');
  for(const u of party)if(u.bot&&!b.plans[u.id]){
    if(gameCanPlan(u))b.plans[u.id]=gameBotTurn(b,u);
  }
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
        gameDamage(b,victim,Math.max(0,faces.reduce((sum,face)=>sum+face,bonus)-5),u);
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
  if(!countered&&gameEnemyReady(b)){
    b.shock={};
    if(!gameCover(b,enemy,target)){
      const incoming=gameContext(enemy,b.intent.card,[target]);
      gameUnopposedAttack(b,incoming);
    }
  } else if(!countered&&gameAlive(enemy))gameLog(b,'집행체의 공격이 사거리 또는 대상 조건을 잃었습니다.');
  for(const reaction of [...b.counterPlans.values()].flat()){
    if(gameAlive(reaction.actor))gameLog(b,reaction.actor.name+' · 반격 조건 미충족');
  }
  delete b.counterPlans;
  delete b.waitingCards;
  for(const ctx of contexts){
    if(ctx.card.role==='assist'&&!ctx.triggered){if(!ctx.temporary)ctx.actor.hand.push(ctx.originId||ctx.card.id);}
    else gameFinishCard(b,ctx);
  }
  for(const ctx of contexts){
    if(ctx.card.role==='assist'&&!ctx.triggered)continue;
    ctx.actor.lastCardRound=b.round;
    ctx.actor.lastCardRole=ctx.card.role;
  }
  gameDeckEffects(b,'turnEnd');
  for(const u of Object.values(b.units).filter(gameAlive)){
    for(const [id,round] of Object.entries(u.cardReactions||{})){
      if(!u.library[id]?.effects.some(effect=>round+(effect.reactionRounds||0)>b.round+1))delete u.cardReactions[id];
    }
    for(const strike of u.delayedStrike||[]){
      if(strike.round>b.round||!gameAlive(u))continue;
      b.shock={};
      gameLog(b,u.name+' · 지연 타격 '+strike.amount+' 발동');
      gameDamage(b,u,strike.amount,b.units[strike.source]||u);
    }
    if(u.delayedStrike)u.delayedStrike=u.delayedStrike.filter(strike=>strike.round>b.round);
    if(!gameAlive(u))continue;
    if(u.lethalGuard)u.lethalGuard=0;
    for(const key of ['outgoingDamage','incomingDamage','outgoingDamagePercent','incomingDamagePercent','barrierBurst','deferrals','afterimage'])delete u[key];
    for(const kind of bossDamageModifiers){delete u[kind];delete u[kind+'Percent'];}
    if(u.damageDebt?.length){
      const amount=u.damageDebt.filter(entry=>entry.round<=b.round).reduce((total,entry)=>total+entry.amount,0);
      u.damageDebt=u.damageDebt.filter(entry=>entry.round>b.round);
      if(amount){
        b.shock={};
        gameLog(b,u.name+' · 유예 피해 '+amount+' 정산');
        gameDamage(b,u,amount,u,true,false,true);
      }
    }
    if(u.temporaryShield)gameRemoveShield(u,u.temporaryShield);
    const poison=gamePoisonAmount(u);
    if(poison){
      b.shock={};
      gameLog(b,u.name+' · 지속 피해 '+poison);
      gameDamage(b,u,poison,u,true);
      if(u.poison)u.poison--;
      if(u.damageOverTime)u.damageOverTime=u.damageOverTime.filter(dot=>dot.through>b.round);
    }
    if(u.regen&&gameAlive(u)){gameHeal(b,u,u.regen);u.regen--;}
    delete u.dodge;delete u.trueStrike;delete u.stackWard;
    if(u.healCuts)u.healCuts=u.healCuts.filter(entry=>entry.through>b.round);
    if(u.nextShield&&gameAlive(u)){
      u.shield=Math.min(999,u.shield+u.nextShield);
      gameLog(b,u.name+' · 보호막 '+u.nextShield+' 획득');u.nextShield=0;
    }
  }
  for(const u of party){
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
    const discard=b.plans[u.id]?.discard;
    if(discard&&u.hand.includes(discard)){u.hand.splice(u.hand.indexOf(discard),1);u.grave.push(discard);}
    if(u.zero==='spent'){
      if(u.zeroRound!==undefined&&u.zeroRound<b.round&&gameAlive(u))gameConceptualize(b,u);
      else u.zeroRound=b.round;
    } else delete u.zeroRound;
    u.rooted=!!u.rootNext;
    u.move=u.rooted?0:bounded(2+u.nextMove,0,7);
    u.rootNext=false;u.nextMove=0;
    if(gameAlive(u))gameDraw(u,Math.max(0,4-u.hand.length)+(u.lateDraw||0));
    if(u.lateDraw)u.lateDraw=0;
  }
  for(const unit of Object.values(b.units)){
    unit.bonusActions=unit.nextActions||0;
    unit.actionPenalty=unit.nextActionPenalty||0;
    unit.blockedRounds=Math.max(0,(unit.blockedRounds||0)-1,unit.nextBlockedRounds||0);
    delete unit.nextActions;
    delete unit.nextActionPenalty;
    delete unit.nextBlockedRounds;
  }
  delete b.shock;
  delete b.resolving;
  delete b.proofs;
  delete b.moved;
  delete b.exposedToAttack;
  b.round++;
  gameNext(b);
}
function gameAwaiting(b,members){
  return Object.values(b.units).filter(u=>!u.bot&&gameCanPlan(u)&&!b.plans[u.id]&&members.some(m=>m.id===u.id));
}
function gameView(state,revision,actor,manager,members) {
  const b=state.battle;
  const battle=b?{round:b.round,phase:b.phase,result:b.result,intent:b.intent,log:b.log,walls:b.walls,poses:b.poses||[],
    awaiting:gameActive(b)?gameAwaiting(b,members).map(u=>u.name):[],clashActor:Object.keys(b.plans||{}).find(id=>gameHasClash(b.plans[id])),
    units:Object.values(b.units).map(({library,hand,deck,grave,exile,cover,effectUsage,passives,...unit})=>({...unit,passiveNames:(passives||[]).map(passive=>passive.name),actionLimit:gameActionLimit(unit),coverCount:cover?.length||0,handCount:hand.length,deckCount:deck.length,graveCount:grave.length,exileCount:exile.length,ready:!!b.plans?.[unit.id],artVersion:state.profiles[unit.id]?.artVersion||0,artSlots:Object.keys(state.profiles[unit.id]?.art||{}),...(unit.id===actor?{hand:[...hand.map(id=>({...library[id],requiredState:cardState(library[id].requiredState)})),...(unit.collapsed?[gameCollapseCard]:unit.zero==='crisis'?gameCrisisCards:[])],plan:b.plans?.[actor]}:{})}))
  }:null;
  return {revision,manager,me:actor,roster:members.filter(m=>m.seat>0),profile:{name:'',country:'제4국',status:'하위층 시민',wall:'',job:'',goal:'',concept:'',stats:[50,50,50,50,50,50],mind:50,cards:[],deck:[],...state.profiles[actor]},defaults:gameCatalogue,battle};
}
async function gameApi(db,room,actor,input,artQuery){
  const {results:members}=await query(db,'SELECT id, name, seat, collection_id FROM members WHERE room_code = ? ORDER BY seat, joined_at',room.code).all();
  const self=members.find(m=>m.id===actor);
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
    const data=Object.hasOwn(state.profiles,id)?state.profiles[id].art?.[slot]:null;
    if(!data||(!b?.units[id]&&id!==actor))return error('일러스트를 찾을 수 없어요.',404);
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
  const shares=()=>Object.values(state.cardShares||{}).filter(share=>members.some(member=>member.id===share.owner));
  const passiveShares=()=>Object.values(state.passiveShares||{}).filter(post=>members.some(member=>member.id===post.owner));
  const view=(version=revision,collection=ownCollection,editedCardId)=>{
    const data=gameView(state,version,actor,manager,members);
    data.roster=data.roster.map(({id,name,seat})=>({id,name,seat}));
    data.collectionRevision=collection.revision;
    data.sharedCards=shares().map(({id,owner,bundle})=>({
      id,owner,author:members.find(member=>member.id===owner).name,card:bundle[0],included:bundle.slice(1).map(card=>card.name)
    }));
    data.sharedPassives=passiveShares().map(({id,owner,passive,cards})=>({
      id,owner,author:members.find(member=>member.id===owner).name,passive,included:cards.map(({id,name})=>({id,name}))
    }));
    if(editedCardId)data.editedCardId=editedCardId;
    data.profile.cards=collection.cards.map(({shareOrigin,...card})=>({...card,requiredState:cardState(card.requiredState)}));
    data.profile.deck=gameDeck([...gameCatalogue,...collection.cards],collection.deck).map(card=>card.id);
    data.profile.deckSaved=collection.deck.length===deckSize;
    data.profile.customStacks=collection.stackNames;
    data.profile.stackTraits=collection.stackTraits;
    const known=[...gameCatalogue,...collection.cards,...(data.profile.passives||[]),...(data.profile.passiveCards||[])];
    data.profile.stackNames=[...new Set([...collection.stackNames,...known.flatMap(source=>
      (source.effects||[]).flatMap(effectStackNames))])];
    data.profile.artSlots=Object.keys(data.profile.art||{});
    delete data.profile.art;
    return json(data);
  };
  if(!input)return view();
  const collectionEdit=['card','deck','cardClone','cardDelete','cardImport','cardTake','stackCreate','stackEdit'].includes(input.action);
  if(collectionEdit?input.collectionRevision!==ownCollection.revision:input.revision!==revision){
    return error('저장 데이터가 먼저 변경됐어요. 다시 시도해 주세요.',409);
  }
  const profile=state.profiles[actor]??={cards:[],deck:[]};
  try{
    switch(input.action){
      case 'art': {
        const [form,pose,extra]=String(input.slot||'').split('.');
        if(extra!==undefined||!Object.hasOwn(artForms,form)||!Object.hasOwn(artPoses,pose))gameFail('일러스트 종류를 확인하세요.');
        const image=input.image;
        if(typeof image!=='string'||image.length>16000||image&&(image.split(',').at(-1).length%4!==0||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image)))gameFail('일러스트 형식이나 크기를 확인하세요.');
        profile.art??={};
        if(image)profile.art[input.slot]=image;
        else delete profile.art[input.slot];
        profile.artVersion=(profile.artVersion||0)+1;
        break;
      }
      case 'profile': {
        if(gameActive(b)&&b.units[actor])gameFail('전투 중에는 캐릭터를 변경할 수 없어요.');
        const name=gameText(input.name,36), country=gameText(input.country,8), status=input.status;
        if(!name||!statuses.includes(status)||!/^제[1-9]국$|^중앙국$/.test(country))gameFail('이름, 출신국, 시작 신분을 확인하세요.');
        if(status==='월정커'&&!/^제[4-8]국$/.test(input.wall))gameFail('월정커의 생활 장벽은 제4~제8국에서 선택하세요.');
        const stats=input.stats;
        if(!Array.isArray(stats)||stats.length!==6||!stats.every(n=>gameInt(n,0,100))||stats.reduce((a,n)=>a+n,0)!==300)gameFail('능력치는 각 0~100, 합계 300이어야 해요.');
        Object.assign(profile,{name,country,status,wall:status==='월정커'?input.wall:'',job:gameText(input.job,36),goal:gameText(input.goal,180),concept:gameText(input.concept,180),stats,mind:profile.mind??50});
        break;
      }
      case 'passive':
      case 'passiveToggle':
      case 'passiveDelete':
      case 'passiveClone':
      case 'passiveTake': {
        if(gameActive(b)&&b.units[actor])gameFail('전투가 끝난 후 패시브를 변경할 수 있어요.');
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
          const needed=new Set(list.flatMap(passive=>gameShareBundle(passive,[...ownCollection.cards,...profile.passiveCards]).slice(1).map(card=>card.id)));
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
      case 'cardTake': {
        const {cards,deleted,stackNames,stackTraits}=ownCollection;
        let {deck}=ownCollection,editedCardId;
        const owned=[...gameCatalogue,...cards];
        switch(input.action){
          case 'stackCreate': {
            const name=typeof input.name==='string'?input.name.trim():'';
            if(!name||name.length>maxStackNameLength||Object.hasOwn(Object.prototype,name))
              gameFail('중첩 이름을 '+maxStackNameLength+'자 이내로 입력해 주세요.');
            if(stackNames.includes(name))gameFail('이미 등록한 중첩이에요.');
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
      case 'start': {
        if(!manager)return error('GM 또는 방장만 시작할 수 있어요.',403);
        if(gameActive(b))gameFail('이미 전투 중이에요.');
        const players=members.filter(member=>member.seat>0&&member.id!==actor);
        const collections=new Map(await Promise.all(players.map(async member=>{
          const row=await query(db,'SELECT cards, deck, stack_names, revision FROM player_collections WHERE id = ?',member.collection_id).first();
          return [member.id,gameCollection(state.profiles[member.id],row)];
        })));
        collections.set(actor,ownCollection);
        state.battle=gameBegin(state,members,input,self,collections);
        break;
      }
      case 'plan':
        if(!gameActive(b)||!gameCanPlan(b.units[actor]))gameFail('지금은 행동을 예약할 수 없어요.');
        b.plans[actor]=gameSelectTurn(b,b.units[actor],input);
        break;
      case 'unplan':
        if(!gameActive(b)||!gameCanPlan(b.units[actor]))gameFail('지금은 행동을 수정할 수 없어요.');
        delete b.plans[actor];
        break;
      case 'intent': {
        if(!manager)return error('GM 또는 방장만 적 행동을 바꿀 수 있어요.',403);
        if(!gameActive(b)||Object.keys(b.plans).length)gameFail('플레이어가 행동을 확정하기 전에 바꿀 수 있어요.');
        const target=Object.hasOwn(b.units,input.target)?b.units[input.target]:null, foe=b.units.enemy;
        if(!gameAlive(target)||target.enemy)gameFail('살아 있는 대상을 선택하세요.');
        b.intent={target:target.id,card:gameFoe,reachable:gameActionLimit(foe)>0&&gameReach(gameFoe,foe,target)};
        break;
      }
      case 'adjustActions': {
        if(!manager)return error('GM 또는 방장만 전투 상태를 조정할 수 있어요.',403);
        const target=b&&Object.hasOwn(b.units,input.target)?b.units[input.target]:null;
        if(!gameActive(b)||!gameAlive(target)||target.enemy||!gameInt(input.baseActions,baseActions,maxActions))gameFail('기본 행동량을 확인하세요.');
        target.baseActions=input.baseActions;
        if(gamePlannedCards(b.plans[target.id]).length>gameActionLimit(target))delete b.plans[target.id];
        gameLog(b,target.name+' · 기본 행동량 '+target.baseActions);
        break;
      }
      case 'adjust': {
        if(!manager)return error('GM 또는 방장만 전투 상태를 조정할 수 있어요.',403);
        const target=b&&Object.hasOwn(b.units,input.target)?b.units[input.target]:null;
        if(!gameActive(b)||!target||target.enemy||target.collapsed||!gameInt(input.mind,-100,100)||!input.mind)gameFail('정신력 조정 값을 확인하세요.');
        gameMental(b,target,input.mind);
        gameLog(b,target.name+' · GM 정신력 조정 '+(input.mind>0?'+':'')+input.mind);
        break;
      }
      case 'round':
        if(!manager)return error('GM 또는 방장만 라운드를 진행할 수 있어요.',403);
        if(!gameActive(b))gameFail('진행 중인 전투가 없어요.');
        if(gameAwaiting(b,members).length)gameFail('플레이어가 행동을 확정할 때까지 기다려 주세요.');
        gameResolve(b);
        if(b.phase==='finished')for(const unit of Object.values(b.units)){
          if(!unit.bot&&!unit.enemy){state.profiles[unit.id]??={cards:[],deck:[]};state.profiles[unit.id].mind=unit.mind;}
        }
        break;
      case 'reset':
        if(!manager)return error('GM 또는 방장만 전투를 정리할 수 있어요.',403);
        if(b)for(const unit of Object.values(b.units)){
          if(!unit.bot&&!unit.enemy){state.profiles[unit.id]??={cards:[],deck:[]};state.profiles[unit.id].mind=unit.mind;}
        }
        state.battle=null;break;
      case 'rest':
        if(gameActive(b))gameFail('전투를 마친 후 휴식할 수 있어요.');
        profile.mind=Math.min(100,(profile.mind??50)+20);break;
      default:gameFail('알 수 없는 작업이에요.');
    }
  }catch(e){if(e instanceof GameInputError)return error(e.message);throw e;}
  const serialized=JSON.stringify(state);
  if(serialized.length>900000)return error('방 저장 공간이 가득 찼어요. 이미지 크기를 줄여 주세요.',413);
  const saved=current?
    await query(db,'UPDATE game_states SET revision = revision+1, state = ? WHERE room_code = ? AND revision = ?',serialized,room.code,revision).run():
    await query(db,'INSERT OR IGNORE INTO game_states(room_code,revision,state) VALUES (?,1,?)',room.code,serialized).run();
  if(!saved.meta.changes)return error('동시에 변경이 들어왔어요. 다시 시도해 주세요.',409);
  return view(revision+1);
}
