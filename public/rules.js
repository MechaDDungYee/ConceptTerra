export const statuses = ['비시민권자','월정커','하위층 시민','중산층 시민','고위층 시민'];
// Each entry defines the name, default timing, default recipient, and card text.
export const baseActions = 1;
export const maxActions = 10;
export const hitTargetModes={all:'전부',primary:'주 대상',secondary:'부 대상',random:'무작위 1명',randomDistinct:'무작위 1명 · 연속 중복 금지'};
export const cardReferenceFields=['copyId','replacementId','givenCardId','conditionCardId'];
export const newEffects = {
  giveCard:['지정 카드 지급','use','self','지정 카드를 손패에 {n}장 지급'],
  replaceCard:['다른 카드로 발동','replace','self','지정한 카드로 발동'],
  blockAction:['행동 불가 부여','hit','target','다음 {n}라운드 동안 이동과 행동 불가'],
  unblockAction:['행동 불가 제거','use','self','현재 행동 불가와 예약된 행동 불가를 해제'],
  reduceActions:['다음 턴 행동량 감소','hit','target','다음 턴에 사용할 수 있는 카드 수 −{n}'],
  extraAction:['다음 턴 행동량 증가','use','self','다음 턴에 사용할 수 있는 카드 수 +{n}'],
  dodge:['타격 회피','use','self','이번 라운드 적 공격의 다음 {n}타를 회피 · 해당 타격의 적중 효과도 막음'],
  trueStrike:['회피 무효화','use','self','이번 라운드 적이 회피할 때 최대 {n}회 무효화'],
  healCut:['받는 회복량 감소','hit','target','지정 기간 동안 받는 체력 회복량 {n}% 감소'],
  stackWard:['지정 중첩 저항','use','self','이번 라운드에 새로 부여될 지정 중첩을 최대 {n} 막음'],
  rerollLow:['낮은 주사위 재굴림','use','self','다음 주사위 판정에서 낮은 눈부터 {n}개를 1회씩 다시 굴려 더 높은 눈을 사용'],
  hitLeech:['실제 피해 비례 회복','damage','self','이 공격으로 깎은 체력의 {n}%만큼 회복'],
  bossDamage:['강적 추가 피해','hit','target','강적에게 추가 피해 {n}'],
  bossOutgoingDamage:['강적에게 입히는 피해 증감','use','self','이번 라운드 강적에게 입히는 피해 {n}'],
  bossIncomingDamage:['강적에게 받는 피해 증감','use','self','이번 라운드 강적에게 받는 피해 {n}'],
  pierce:['보호막 관통 피해','hit','target','보호막을 관통하는 피해 {n}'],
  stripShield:['보호막 파괴','hit','target','보호막 {n} 제거'],
  drainLife:['생명력 흡수','damage','target','추가 피해 {n}. 실제로 가한 만큼 사용자의 체력 회복'],
  healPercent:['최대 체력 비례 회복','use','self','최대 체력의 {n}% 회복'],
  healMissing:['잃은 체력 비례 회복','use','self','잃은 체력의 {n}% 회복'],
  recoil:['반동 피해','end','self','보호막을 관통하는 반동 피해 {n}'],
  fortify:['다음 라운드 보호막','use','self','다음 라운드 시작에 보호막 {n} 획득'],
  focus:['다음 판정 위력 증가','use','self','다음 공격 또는 합 판정 위력 +{n}'],
  weaken:['다음 판정 위력 감소','hit','target','다음 공격 또는 합 판정 위력 −{n}'],
  nextSlow:['다음 라운드 이동 감소','hit','target','다음 라운드 이동 수 −{n}'],
  retreat:['후퇴','end','self','상대에게서 최대 {n}칸 멀어짐'],
  swapPosition:['자리 교환','hit','target','상대와 위치 교환 · 최대 {n}칸 이내'],
  doubleStack:['중첩 증폭','hit','target','지정 중첩만큼 추가 부여 · 최대 {n}'],
  stealStack:['중첩 탈취','hit','target','대상의 지정 중첩을 자신에게 이전 · 최대 {n}'],
  consumeHeal:['중첩 소모 연계 회복','consume','self','소모한 중첩의 총 위력 1당 체력 {n} 회복'],
  stackDamage:['중첩 비례 피해','hit','target','지정 중첩의 총 위력 1당 피해 {n}'],
  poison:['지속 피해','hit','target','라운드 종료마다 피해 {n}'],
  regen:['지속 회복','use','self','라운드 종료에 보유량만큼 회복하고 1 감소 · {n} 부여'],
  clearStatus:['지속 효과 해제','use','self','지속 피해와 지속 회복을 모두 해제'],
  mindTransfer:['정신력 흡수','hit','target','정신력을 최대 {n} 빼앗아 자신에게 이전'],
  cycle:['손패 순환','use','self','손패 앞에서 최대 {n}장을 버리고 같은 수만큼 드로우'],
  mill:['덱 갈아내기','hit','target','덱 위에서 최대 {n}장을 묘지로 보냄'],
  recoverDeck:['묘지에서 덱 위로','use','self','묘지의 최근 카드 최대 {n}장을 덱 위로 이동'],
  reclaim:['제외 카드 회수','use','self','최근 제외 카드 최대 {n}장을 손으로 가져옴'],
  topdeck:['사용한 카드를 덱 위로','end','self','이 카드를 덱 위로 돌려보냄'],
  discardAllCost:['손패 전부 버리기 · 대가','use','self','이 카드를 낸 뒤 남은 손패를 전부 버림 · 최소 1장'],
  discardExactCost:['손패 일정 수 버리기 · 대가','use','self','손패 앞에서 정확히 {n}장을 버림'],
  copySelf:['이 카드 복제','end','self','이 카드 사본 {n}장을 손패에 추가'],
  copyFixed:['지정 카드 복제','end','self','제작할 때 지정한 카드 사본 {n}장을 손패에 추가'],
  copyChosen:['선택 카드 복제','end','self','행동을 확정할 때 손패에서 고른 카드 사본 {n}장을 손패에 추가'],
  expose:['취약 부여','hit','target','다음 공격의 기본 피해가 1 이상이면 받는 피해 +{n}'],
  thorns:['반격 태세','use','self','다음 적 공격으로 체력 피해를 받으면 공격자에게 피해 {n}'],
  temporaryShield:['이번 라운드 보호막','use','self','이번 라운드 동안 보호막 {n} 획득'],
  stealShield:['보호막 탈취','hit','target','보호막을 최대 {n} 빼앗아 자신에게 이전'],
  guardBreak:['원호 방어 해제','hit','target','원호 방어 중첩을 최대 {n} 제거'],
  rootNext:['다음 라운드 속박','hit','target','다음 라운드 이동 수를 0으로 고정'],
  provoke:['다음 라운드 도발','end','self','다음 라운드 적의 예고 공격을 자신에게 유도'],
  evadeStep:['측면 이동','end','self','공격 대상과 같은 거리의 칸으로 최대 {n}칸 이동'],
  cleanseStacks:['지정 중첩 전부 제거','use','self','지정 중첩을 전부 제거'],
  shieldPerStack:['중첩 소모 연계 보호막','consume','self','소모한 중첩의 총 위력 1당 보호막 {n} 획득'],
  shuffleDeck:['덱 셔플','use','self','남은 덱을 섞음'],
  buryHand:['손패를 덱 밑으로','use','self','손패 앞에서 최대 {n}장을 덱 밑으로 이동'],
  exileGrave:['묘지 카드 제외','use','self','묘지에서 최근 카드 최대 {n}장을 전투에서 제외'],
  drawTo:['손패 보충','use','self','손패가 {n}장이 될 때까지 드로우'],
  riposte:['합 동점 반격','tie','target','동점인 상대에게 반격 피해 {n}'],
  shieldPower:['보호막 비례 위력','use','self','보유 보호막의 {n}%만큼 이번 판정 위력 증가'],
  gravePower:['묘지 비례 위력','use','self','묘지 카드 1장당 이번 판정 위력 +{n}'],
  shieldGift:['보호막 나눠주기','use','nearestAlly','사용자의 보호막을 최대 {n}만큼 아군에게 이전'],
  allyHeal:['부상 아군 응급처치','use','woundedAlly','가장 많이 다친 아군의 체력 {n} 회복'],
  lethalGuard:['치명상 방지','use','self','이번 라운드에 공격으로 쓰러질 때 체력 {n}을 남김 · 1회'],
  recoverMindFloor:['정신력 하한 회복','use','self','정신력이 {n}보다 낮으면 {n}까지 회복'],
  purgePoison:['지속 피해 정화','use','self','지속 피해를 최대 {n} 제거'],
  detonatePoison:['지속 피해 폭발','hit','target','지속 피해를 최대 {n} 소모해 설정한 비율만큼 즉시 피해'],
  lateDraw:['다음 라운드 추가 드로우','use','self','다음 라운드 기본 드로우 이후 카드 {n}장 추가 드로우'],
  recycleExile:['제외 카드를 덱 밑으로','use','self','최근 제외 카드 최대 {n}장을 덱 밑으로 회수'],
  graveToShield:['묘지 카드로 보호막','use','self','묘지의 최근 카드 최대 {n}장을 제외하고 장당 설정한 보호막 획득'],
  outgoingDamage:['입히는 피해 증감','use','self','이번 라운드 적에게 입히는 피해 {n}'],
  incomingDamage:['받는 피해 증감','use','self','이번 라운드 적에게 받는 피해 {n}'],
  damageDebt:['피해 유예','use','self','다음 적 공격의 체력 피해 일부를 다음 라운드부터 나눠 받음'],
  eraseDebt:['유예 피해 상쇄','use','self','아직 받지 않은 유예 피해를 최대 {n} 상쇄'],
  barrierBurst:['보호막 파열 반격','use','self','이번 라운드 적 공격이 보호막을 모두 없애면 공격자에게 피해 {n} · 1회'],
  shieldBreakDraw:['보호막 파괴 연계 드로우','hit','self','이 공격으로 대상의 보호막을 모두 없앴으면 카드 {n}장 드로우'],
  doubleEdge:['양날의 계약','use','self','이번 라운드 입히는 피해와 받는 피해 각각 +{n}'],
  delayedStrike:['지연 타격','hit','target','대상에게 지정 라운드 종료에 피해 {n} 예약 · 대상이 이동해도 유지'],
  positionAnchor:['귀환 좌표','use','self','현재 칸을 기록. 지정 라운드 시작에 그 칸이 비어 있으면 돌아감'],
  debtShield:['유예 피해 전환','use','self','유예 피해를 최대 {n} 상쇄하고 상쇄량에 비례한 보호막 획득'],
  clashMemory:['합 위력 기록','lose','self','이번 합에서 난 위력 차이만큼 다음 합의 위력 증가 · 최대 {n}'],
  afterimage:['잔상 방어','use','self','이번 라운드에 체력 피해를 주는 첫 적 공격을 최대 {n}만큼 막음 · 최소 이동 칸 수를 충족하면 발동'],
  overloadEcho:['혹사 잔향','use','self','직전 라운드에 혹사 카드를 처리했다면 이 카드의 위력 +{n}'],
  emptyHandReload:['빈 손패 역전','end','self','손패가 비어 있으면 묘지의 최근 카드 최대 {n}장을 손으로 되돌림'],
  clashStreak:['연승 가속','clash','self','연속 합 승리 1회당 이번 합 위력 +{n} · 설정한 횟수까지 반영'],
  shareCopy:['아군에게 카드 사본 전달','end','nearestAlly','이 카드의 사본 {n}장을 아군 손패에 추가'],
  hastenStrike:['지연 타격 앞당기기','hit','target','대상에게 예약된 지연 타격을 최대 {n}라운드 앞당김 · 가장 빠르면 이번 라운드 종료'],
  preserveMove:['이동력 이월','end','self','이번 라운드에 남은 이동력을 최대 {n}만큼 다음 라운드에 추가'],
  spareShield:['보호막으로 정신력 회복','end','self','보호막을 최대 {n} 소모해 설정한 비율만큼 정신력 회복'],
  revealDistance:['이동 거리 연계 위력','use','self','이번 행동에서 실제로 이동한 칸당 이번 판정 위력 +{n}'],
  lastStand:['마지막 한 장','use','self','이 카드를 내고 손패가 비었다면 이번 라운드 받는 피해 {n} 감소'],
  healthCost:['체력 지불','use','self','자신의 체력 {n} 지불 · 체력이 최소 1 남을 때 성공'],
  mindCost:['정신력 지불','use','self','자신의 정신력 {n} 지불 · 0에 도달하면 폭주 위기'],
  rallyHeal:['동료 전원 회복','use','self','살아 있는 다른 아군 전원의 체력 {n} 회복'],
  rallyShield:['동료 전원 보호막','use','self','살아 있는 다른 아군 전원에게 보호막 {n} 부여'],
  focusClash:['다음 합 위력 저장','end','self','다음 합에만 위력 +{n} · 일반 공격으로 소모되지 않음'],
  critChance:['치명타 확률 증감','use','self','전투 중 치명타 확률 {n}%p 조정'],
  critCharges:['확정 치명타 횟수 부여','use','self','다음 공격 {n}타를 확정 치명타로 처리'],
  critStacks:['치명타 중첩 부여','use','self','치명타 중첩 {n} 부여 · 1중첩당 확률 +5%p'],
  critSpend:['치명타 중첩 소모','use','self','치명타 중첩을 최대 {n} 소모하고 소모량을 이번 카드에 기록'],
  critRemove:['치명타 중첩 제거','hit','target','대상의 치명타 중첩을 최대 {n} 제거'],
  critMultiplier:['치명타 피해 배율 증감','use','self','기본 치명타 피해 배율 150%에 {n}%p 적용'],
  critPerSpent:['치명타 중첩 소모 연계 피해','critical','target','이 카드에서 소모한 치명타 중첩 1당 추가 피해 {n}'],
  hearDemon:['심마의 제안','use','self','유혹 {n} 획득 · 이 카드의 판정 위력 증가'],
  refuseDemon:['심마 거절','end','self','유혹을 최대 {n} 덜어내고, 덜어낸 양에 비례해 정신력 회복'],
  shedShell:['탈피','win','self','붕괴 직전 합을 이기면 탈피 성공 시 회복할 정신력 +{n}'],
  awakenBody:['새 몸 재구축','use','self','각성 상태라면 체력 {n} 회복'],
  inscribeMeaning:['의미 새기기','end','self','각성 상태라면 다음 합 위력 +{n} 저장'],
  bottomdeck:['사용한 카드를 덱 밑으로','end','self','이 카드를 덱 밑으로 돌려보냄']
};
// A sign describes the effect's direction. Zero allows either direction.
export const maxDeferralRounds = 10;
export const maxStatusRounds = 10;
export const effectRatioBases = {
  hpMax:'적용 대상의 최대 체력',hpCurrent:'적용 대상의 현재 체력',hpLost:'적용 대상의 잃은 체력',
  ownHpMax:'사용자의 최대 체력',ownHpCurrent:'사용자의 현재 체력',ownHpLost:'사용자의 잃은 체력',
  mindCurrent:'적용 대상의 현재 정신력',mindMax:'적용 대상의 최대 정신력',mindLost:'적용 대상의 잃은 정신력',
  ownMind:'사용자의 현재 정신력',shield:'적용 대상의 현재 보호막',
  cardTotal:'카드 총 위력 (판정값)',cardMin:'카드 최소 피해량 (기본 위력)',cardMax:'카드 최대 피해량 (기본 위력)',
  damageDealt:'이번 타격·대상에 실제 입힌 체력 피해',totalDamage:'카드로 모든 대상에게 입힌 총 체력 피해'
};
export const configurableRatioEffects = [
  'damage','pierce','heal','allyHeal','shield','temporaryShield','fortify','mind','drain','bossDamage','poison',
  'afterimage','delayedStrike','power','basePower','finalPower','focus','weaken','outgoingDamage','incomingDamage',
  'bossOutgoingDamage','bossIncomingDamage','stripShield','stealShield','shieldGift'
];
export const ratioBasisAvailable = (basis,when) =>
  basis==='totalDamage'?when==='attackEnd':
  basis==='damageDealt'?['hit','damage','critical','noncritical','attackEnd','struck','hurt'].includes(when):
  basis==='cardTotal'?['roll','hit','damage','critical','noncritical','attackEnd','struck','hurt'].includes(when):true;

export const signedEffects = ['critChance','critMultiplier'];
export const temptationLimit = 6;
export const temptationStrain = 15;
export const mentalCrisisThreshold = 25;
export const awakeningPower = 2;
export const crisisRecovery = 25;
export const effectSettings = {
  healCut:{duration:['지속 라운드 (이번 라운드 포함)',2,1,10]},
  hearDemon:{powerGain:['이번 판정 위력 증가량',4,1,100]},
  refuseDemon:{perStack:['유혹 1당 정신력 회복',3,1,100]},
  detonatePoison:{conversion:['소모량 대비 피해 (%)',200,1,1000]},
  graveToShield:{perCard:['카드 1장당 보호막',2,1,100]},
  clashStreak:{winLimit:['반영할 최대 연승 횟수',5,1,100]},
  delayedStrike:{delayRounds:['발동까지 라운드',1,1,10]},
  positionAnchor:{delayRounds:['귀환까지 라운드',1,1,10]},
  afterimage:{minMove:['최소 이동 칸 수',1,0,12]},
  debtShield:{conversion:['상쇄량 대비 보호막 (%)',100,1,1000]},
  spareShield:{conversion:['보호막 소모량 대비 정신력 회복 (%)',100,1,1000]}
};
export const percentageDefaults = ['doubleEdge','lastStand'];
export const ratioEffects = {
  doubleEdge:['이번 라운드 입히는 피해와 받는 피해',1,'피해 판정',true],
  lastStand:['손패가 비었을 때 받는 피해',-1,'피해 판정',true],
  critSpend:['치명타 중첩 소모',1,'현재 치명타 중첩'],
  critRemove:['치명타 중첩 제거',1,'현재 치명타 중첩'],
  detonatePoison:['지속 피해 소모',1,'현재 지속 피해'],
  graveToShield:['묘지 카드 제외',1,'현재 묘지 장수'],
  debtShield:['유예 피해 상쇄',1,'남은 유예 피해'],
  eraseDebt:['유예 피해 상쇄',1,'남은 유예 피해'],
  spareShield:['보호막 소모 한도',1,'현재 보호막'],
  stealShield:['보호막 탈취',1,'현재 보호막'],
  shieldGift:['보호막 이전',1,'사용자의 현재 보호막'],
  afterimage:['잔상 피해 방어',1,'최대 체력'],
  delayedStrike:['지연 타격 피해',1,'최대 체력'],
  rallyHeal:['동료별 체력 회복',1,'각 동료의 최대 체력'],
  rallyShield:['동료별 보호막 부여',1,'각 동료의 최대 체력'],
  healthCost:['체력 지불',-1,'최대 체력'],mindCost:['정신력 지불',-1,'최대 정신력'],
  damageDebt:['피해 유예',1,'보호막 적용 후 체력 피해'],
  bossDamage:['강적 추가 피해',1,'최대 체력'],
  bossOutgoingDamage:['강적에게 입히는 피해',0,'피해 판정',true],
  bossIncomingDamage:['강적에게 받는 피해',0,'피해 판정',true],
  outgoingDamage:['이번 라운드 입히는 피해',0,'피해 판정',true],
  incomingDamage:['이번 라운드 받는 피해',0,'피해 판정',true],
  basePower:['기본 위력',1],finalPower:['최종 위력',1],power:['판정 위력',0],focus:['다음 판정 위력',1],weaken:['다음 판정 위력',-1],
  poison:['라운드당 지속 피해',1,'최대 체력'],
  damage:['추가 피해',1,'최대 체력'],pierce:['관통 피해',1,'최대 체력'],
  heal:['체력',1,'최대 체력'],allyHeal:['체력',1,'최대 체력'],
  shield:['보호막',1,'최대 체력'],temporaryShield:['이번 라운드 보호막',1,'최대 체력'],
  fortify:['다음 라운드 보호막',1,'최대 체력'],stripShield:['보호막',-1,'현재 보호막'],
  mind:['정신력',1,'최대 정신력'],drain:['정신력',-1,'최대 정신력']
};
export function applyPowerRatio(power,percent){
  return Math.max(0,Math.trunc(power*(100+percent)/100));
}
export const effectRecipients = {
  target:'카드 대상',primary:'주 대상',secondary:'부 대상 전원',self:'자신',
  allAllies:'아군 전원 (자신 제외)',party:'자신과 아군 전원',
  allBosses:'강적 전원',nearestBoss:'가장 가까운 강적',lowestHpBoss:'현재 체력이 가장 적은 강적',
  allEnemies:'적 전원',allOthers:'자신을 제외한 전원',everyone:'자신을 포함한 전원',
  nearestAlly:'가장 가까운 아군',farthestAlly:'가장 먼 아군',
  nearestEnemy:'가장 가까운 적',farthestEnemy:'가장 먼 적',
  woundedAlly:'체력 비율이 가장 낮은 부상 아군',highestAlly:'체력 비율이 가장 높은 아군',
  lowestEnemy:'체력 비율이 가장 낮은 적',highestEnemy:'체력 비율이 가장 높은 적',
  lowMindAlly:'정신력이 가장 낮은 아군',highMindAlly:'정신력이 가장 높은 아군'

};
export const diceConditions = {diceEqual:'같음',diceAtLeast:'이상',diceAtMost:'이하'};
export const diceConditionTimings = ['roll','win','lose','tie','hit','critical','noncritical','damage','wall','consume','attackEnd','end'];
export const maxDiceTotal = 12*100*8;
export const replacementConditions = [
  '','bossTarget','bossPresent','stack','lowHp','highHp','lowMind','highMind','moved','noMove','allyHit',
  'round','handLow','graveHigh','graveLow','near','far','targeted','notTargeted','hasDebt','clashStreak',
  'queuedStrike','priorOverload','priorGuard','criticalStacks','temptationAtLeast','awakeningAtLeast',
  'collapseCrisis','poisoned','shielded','unshielded'
];
export const effectConditions = {
  diceEqual:'주사위 눈의 합 · 같음',diceAtLeast:'주사위 눈의 합 · 이상',diceAtMost:'주사위 눈의 합 · 이하',
  '':'없음',primaryTarget:'대상이 주 대상',secondaryTarget:'대상이 부 대상',cardUsed:'지정 카드 사용 시',bossTarget:'대상이 강적',bossPresent:'전장에 살아 있는 적 강적이 있음',stack:'지정 중첩 이상',lowHp:'체력 % 이하',moved:'이번 행동 이동 칸 이상',allyHit:'아군 적중 이후',
  highHp:'체력 % 이상',lowMind:'정신력 이하',highMind:'정신력 이상',round:'라운드 이상',
  handLow:'손패 장수 이하',graveHigh:'묘지 장수 이상',near:'상대와의 거리 이하',far:'상대와의 거리 이상',
  healthPaid:'체력 지불 성공',mindPaid:'정신력 지불 성공',bothPaid:'체력과 정신력 모두 지불 성공',
  discardPaid:'손패 버리기 대가 지불 성공',discardCount:'대가로 버린 카드 수 이상',
  targeted:'적의 예고 공격 대상',notTargeted:'적의 예고 공격 대상 아님',
  clashMargin:'합 승리 위력 차이 이상',clashDeficit:'합 패배 위력 차이 이상',
  brokeShield:'이 공격으로 보호막 파괴',hasDebt:'유예 피해 보유',
  clashStreak:'연속 합 승리 횟수 이상',queuedStrike:'지연 타격 예약 보유',
  priorOverload:'직전 라운드 혹사 카드 처리',priorGuard:'직전 라운드 원호 방어 카드 처리',
  criticalHit:'이번 공격이 치명타',criticalStacks:'치명타 중첩 이상',criticalSpent:'치명타 중첩 소모량 이상',
  temptationAtLeast:'유혹 압력 이상',awakeningAtLeast:'각성 상태',collapseCrisis:'붕괴 직전',
  foeDown:'현재 대상 전투 불능',graveLow:'묘지 장수 이하',poisoned:'지속 피해 보유',
  shielded:'보호막 보유',unshielded:'보호막 없음',noMove:'이동하지 않음'
};
export const flagConditions = ['primaryTarget','secondaryTarget','cardUsed','bossTarget','bossPresent','allyHit','criticalHit','healthPaid','mindPaid','bothPaid','discardPaid','targeted','notTargeted','priorOverload','priorGuard','awakeningAtLeast','collapseCrisis','queuedStrike','foeDown','poisoned','brokeShield','hasDebt','shielded','unshielded','noMove'];
export const maxStatusStacks = 999;
export const maxStackPotency = 999;
export function stackPotency(unit,tag){
  return unit.stackRuns?.[tag]?.reduce((total,{count,power})=>total+count*power,0)??(unit.stacks[tag]||0);
}
export const maxCollectiveStackConsume = 39960;
export const bossDamageModifiers = ['bossOutgoingDamage','bossIncomingDamage'];
export const stackGrantEffects = ['stack','doubleStack','stealStack'];
export const stackConsumeAmounts = {fixed:'수량 지정',all:'전부'};
export const stackConsumeScopes = {each:'적마다 따로',total:'적 전원 합산'};
export const stackConsumePriorities = {
  lowestHp:'현재 체력이 가장 적은 적',highestHp:'현재 체력이 가장 많은 적',
  mostStacks:'해당 중첩이 가장 많은 적',leastStacks:'해당 중첩이 가장 적은 적',
  nearest:'가장 가까운 적',farthest:'가장 먼 적'
};
export const taggedEffects = ['stackWard','stack','consume','remove','doubleStack','stealStack','stackDamage','cleanseStacks'];
export const discardCosts = ['discardAllCost','discardExactCost'];
export const resourceCosts = ['healthCost','mindCost'];
export const resourceScales = {health:'지불한 체력',mind:'지불한 정신력'};
export const teamEffects = ['rallyHeal','rallyShield'];
export const copyEffects = ['copySelf','copyFixed','copyChosen'];
export const stagedPowerEffects = ['basePower','finalPower'];
export const stagedPowerTimings = ['base','battleStart','turnStart','turnEnd','use','clash','unopposed','counter','roll'];
export const amplifyHitTargets = {next:'다음 타격',last:'마지막 타격',number:'지정 타격',remaining:'이후 모든 타격'};
export const unnumberedEffects = ['replaceCard','discardAllCost','return','exile','replay','replayHit','unblockAction','clearStatus','topdeck','bottomdeck','rootNext','provoke','cleanseStacks','shuffleDeck','positionAnchor'];
export const effects = {
  draw:'드로우', discard:'손패 버리기', recover:'묘지에서 회수', return:'이 카드 손으로 복귀', exile:'이 카드 전투에서 제외', replay:'즉시 재사용', replayHit:'이 타격 재사용', amplifyHit:'다른 타격 효과 증폭',
  damage:'추가 피해', percent:'기본 피해 비율 추가', heal:'체력 회복', shield:'보호막', reduce:'피해 경감', power:'이번 판정 위력',basePower:'기본 위력 증가',finalPower:'최종 위력 증가',
  move:'즉시 이동', movement:'이번 라운드 이동 수', nextMove:'다음 라운드 이동 수', push:'넉백', pull:'끌어오기',
  ...Object.fromEntries(Object.entries(newEffects).map(([kind,[name]])=>[kind,name])),
  stack:'중첩 부여', consume:'중첩 소모', remove:'중첩 제거', perStack:'소모한 중첩당 피해', mind:'정신력 회복', drain:'정신력 감소'
};
export const healthBases = {max:'최대 체력',current:'현재 체력',missing:'잃은 체력'};
export const healthRatioEffects = Object.keys(ratioEffects).filter(kind=>ratioEffects[kind][2]?.endsWith('최대 체력'));
export const effectLimitPeriods = {none:'제한 없음',turn:'턴당',battle:'전투당'};
export const maxEffectActivations = 99;
export const timings = {base:'기본 적용 효과',battleStart:'전투 시작 시',turnStart:'턴 시작 시',turnEnd:'턴 종료 시',replace:'카드 발동 시',use:'사용 시', clash:'합 진행 시', roll:'주사위 판정 시', win:'합 승리 시', lose:'합 패배 시', tie:'합 동점 시', unopposed:'일방공격 시', counter:'반격 발동 시', hit:'적중 시',critical:'치명타 적중 시',noncritical:'치명타 미적중 시', damage:'피해 발생 시', wall:'벽 충돌 시', consume:'중첩 소모 시', attackEnd:'공격 종료 시', struck:'피격 시', hurt:'피격으로 체력 피해를 받을 때', end:'처리 후'};
export const roles = {normal:'일반', chain:'연계', assist:'원호 공격', guard:'원호 방어', counter:'반격', overload:'혹사'};
export const maxCardHits = 8;
export const maxCardEffects = 24;
export const maxPassives = 8;
export const maxPassiveEffects = 8;
export const passiveRoundTimings = ['battleStart','turnStart','turnEnd'];
export const passiveTimings = [...passiveRoundTimings,'use','clash','win','lose','tie','hit','damage','critical','noncritical','attackEnd','struck','hurt'];
export const passiveEffectKinds = [
  'replaceCard','giveCard',
  'power','basePower','finalPower','focus','weaken','shield','reduce','fortify','heal','healPercent','healMissing','regen',
  'clearStatus','temporaryShield','stealShield','shieldGift','allyHeal','lethalGuard','healCut','dodge','trueStrike','stackWard',
  'rerollLow','hitLeech','damage','bossDamage','pierce','drainLife','stack','consume','remove','doubleStack','stealStack',
  'stackDamage','poison','mind','drain','mindTransfer','cleanseStacks','purgePoison','recoverMindFloor','focusClash',
  'bossOutgoingDamage','bossIncomingDamage','outgoingDamage','incomingDamage','damageDebt','eraseDebt','barrierBurst','thorns',
  'critChance','critCharges','critStacks','critRemove','critMultiplier','draw','recover','lateDraw','extraAction','blockAction','unblockAction','reduceActions','nextMove','nextSlow'
];
export function passiveTimingsFor(kind){
  if(kind==='replaceCard')return ['replace'];
  if(['power',...stagedPowerEffects].includes(kind))return passiveRoundTimings;
  if(kind==='hitLeech')return ['hit','damage','attackEnd'];
  return passiveTimings;
}
export const legacyHitEvents=['critical','noncritical','wall','damage'];
export const hitResultTests = {
  critical:'치명타 적중 시',noncritical:'치명타 미적중 시',wall:'벽 충돌 시',
  damage:'체력 피해 발생 시',shieldBreak:'보호막 파괴 시'
};
export const hitEffectTimings = ['roll','hit','damage','critical','noncritical','wall','consume'];
export const cardHitPowers = card => card.hitPowers??[card.power];
const powerPattern = /^(?:(\d{1,2})d(\d{0,3})([+-]\d{1,3})?|(\d{1,3}))$/i;
export function parsePower(value){
  if(typeof value!=='string'||value.length>18)return null;
  const formula=value.replace(/\s/g,'').toLowerCase();
  const match=formula.match(powerPattern);
  if(!match)return null;
  const [,dice,faces,offset,fixed]=match;
  const count=Number(dice||0),sides=Number(faces||6);
  if(dice&&(count<1||count>12||sides<2||sides>100))return null;
  return {formula,count,sides,bonus:Number(fixed??offset??0)};
}
export const mentalPower = n => Math.sign(n-50)*Math.floor((Math.abs(n-50)+5)/10);

export const cardStates = {any:'일반 사용',collapsed:'붕괴 전용',awakened:'각성 전용'};
export const cardState = state => state==='crisis'?'collapsed':state??'any';
export const crisisRounds = 3;
export const crisisVows = {face:'맞선다',protect:'지킨다',give:'내어준다',endure:'버틴다',advance:'돌파한다',precision:'꿰뚫는다'};
export const crisisVowRules = {
  face:'직접 건 합에서 이기거나 비기기',
  protect:'원호 방어로 아군 대신 합을 하고 살아남기',
  give:'한 행동 안에서 내 체력을 지불하고 다른 아군의 체력 실제로 회복시키기',
  endure:'한 칸도 움직이지 않고 적의 공격으로 체력 피해를 입은 뒤 살아남기',
  advance:'직접 2칸 이상 이동하고 공격으로 적의 체력 깎기',
  precision:'치명타로 적의 체력 깎기'
};
export const artForms = {normal:'기본',crisis:'붕괴 직전',awakened:'각성',concept:'개념화'};
export const artPoses = {idle:'기본 스탠딩',ready:'공격 준비',attack:'공격',hurt:'피격',guard:'방어·원호',down:'전투 불능',shift:'변화 연출'};
export function cardUsable(unit,card){
  if(!card)return false;
  if(card.trial)return unit.zero==='crisis'&&!unit.collapsed;
  const state=cardState(card.requiredState);
  if(unit.collapsed)return state==='collapsed';
  if(unit.zero&&unit.zero!=='crisis')return false;
  return state!=='collapsed'&&(state!=='awakened'||!!unit.awakening);
}

export const deckSize = 10;
export const deckCopyLimit = 3;

export const cardFileFormat='conceptterra-card-library';
export const maxCardFileBytes=1_200_000;

export const maxFlowDepth=4;
export const maxFlowRepeat=5;
export const maxFlowActivations=64;
export const maxExpressionDepth=4;
export const maxMathTerms=12;
export const maxMathParts=64;
export const flowMathTerms=node=>node.terms??[node.left,node.right];
export const maxGateInputs=12;
export const maxGateTests=48;
export const flowGates={
  and:'AND · 전부 참',or:'OR · 하나 이상 참',xor:'XOR · 홀수 개 참',
  nand:'NAND · 전부 참이면 거짓',nor:'NOR · 전부 거짓',xnor:'XNOR · 짝수 개 참'
};
export const maxCustomStacks=100;
export const maxStackNameLength=22;

export const flowArithmetic={add:'+',subtract:'−',multiply:'×',divide:'÷',min:'최솟값',max:'최댓값'};
export const flowComparisons={lt:'<',lte:'≤',eq:'=',gte:'≥',gt:'>',ne:'≠'};
export const flowStats={
  selfHp:'자신의 현재 체력',selfMaxHp:'자신의 최대 체력',selfLostHp:'자신의 잃은 체력',
  selfMind:'자신의 정신력',selfShield:'자신의 보호막',selfHand:'자신의 손패 수',
  targetHp:'대상의 현재 체력',targetMaxHp:'대상의 최대 체력',targetLostHp:'대상의 잃은 체력',
  targetMind:'대상의 정신력',targetShield:'대상의 보호막',targetHand:'대상의 손패 수',
  round:'현재 라운드',moved:'이동한 칸 수',rank:'현재 타격 번호',
  rolled:'주사위 눈 합계',dealt:'대상에게 입힌 체력 피해',totalDamage:'카드 총 체력 피해',
  cardTotal:'카드 판정 위력',cardMin:'카드 최소 위력',cardMax:'카드 최대 위력',
  discarded:'대가로 버린 카드 수',paidHealth:'지불한 체력',paidMind:'지불한 정신력'
};

function mapFlowTestCards(test,map){
  if(!test||typeof test!=='object')return test;
  if(test.type==='condition'&&test.conditionCardId)return {...test,conditionCardId:map(test.conditionCardId)};
  if(test.type==='and'||test.type==='or')return {...test,left:mapFlowTestCards(test.left,map),right:mapFlowTestCards(test.right,map)};
  if(test.type==='not')return {...test,test:mapFlowTestCards(test.test,map)};
  if(test.type==='gate'&&Array.isArray(test.inputs))return {...test,inputs:test.inputs.map(input=>mapFlowTestCards(input,map))};
  return test;
}
export function mapEffectCardReferences(effect,map){
  if(!effect||typeof effect!=='object')return effect;
  const result={...effect};
  for(const key of [...cardReferenceFields,'fromCardId'])if(effect[key])result[key]=map(effect[key]);
  if(Array.isArray(effect.flow))result.flow=effect.flow.map(step=>step?.kind==='if'&&step.test?
    {...step,test:mapFlowTestCards(step.test,map)}:step);
  return result;
}
export function effectCardReferences(effect){
  const ids=new Set();
  mapEffectCardReferences(effect,id=>{ids.add(id);return id;});
  return [...ids];
}

export function effectStackNames(effect){
  const names=new Set(effect.tag?[effect.tag]:[]);
  const read=test=>{
    if(test.type==='condition'&&test.condition==='stack'&&test.tag)names.add(test.tag);
    else if(test.type==='gate')test.inputs.forEach(read);
    else if(test.type==='and'||test.type==='or'){read(test.left);read(test.right);}
    else if(test.type==='not')read(test.test);
  };
  for(const step of effect.flow||[])if(step.kind==='if')read(step.test);
  return [...names];
}
