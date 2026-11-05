let battleTutorial = null;
const completedTutorials = new Set();
const tutorialLessons = [
 {title:'심상 세계의 전투',text:'이루리와 이루어도는 출전하지 않습니다. 이루리는 이격을 지휘하고, 이루어도는 현실에서 일행을 지킵니다. 나머지 8명의 순서를 정하세요. 1~4번은 선발, 5~8번은 대기 인원입니다.',task:'lineup'},
 {title:'적의 준비 행동',text:'적은 턴 시작에 먼저 이동하고 행동과 주 대상을 정합니다. 머리 위 칼·방패와 숫자로 종류와 실행 순서를 확인하세요. 숫자가 작을수록 먼저 행동합니다. 붉은 곡선은 적의 공격 예고입니다.'},
 {title:'체력과 정신력',text:'붉은 막대는 체력, 파란 원은 정신력입니다. 정신력은 0~100이며 50에서 시작합니다. 패링 성공 시 10, 적에게 직접 피해를 적중시킬 때마다 5 회복하고 아군 사망 시 10 감소합니다.'},
 {title:'아군 선택',text:'전장에 있는 아군을 한 번 누르세요. 아래에 그 아군의 손패가 펼쳐지고 인접한 이동 가능 타일이 초록색으로 표시됩니다. 더블 클릭하면 상태·패시브·행동·개념 폭주 정보를 확인할 수 있습니다.',task:'select'},
 {title:'한 칸 이동',text:'선택한 아군 옆의 초록 타일 하나를 누르세요. 상하좌우로 한 칸씩 이동하며 대각선이나 점유된 칸은 갈 수 없습니다. 이동 수는 이동할 때마다 1 소모되고 다음 턴에 회복됩니다.',task:'move'},
 {title:'공격 카드 선택',text:'손패에서 공격 카드 하나를 누르세요. 왼쪽에서 기본 위력, 파형값, 사거리, 대상 수와 연속 효과를 확인하세요. 빛나는 타일은 사거리입니다. 피해 비율과 이동 효과는 적힌 순서대로 실행됩니다.',task:'card'},
 {title:'주 대상 지정',text:'사거리 안의 적을 누르거나 카드에서 적에게 드래그해 놓으세요. 닿지 않으면 먼저 이동해야 합니다. 카드 없이 적을 누르면 공격은 지정되지 않습니다. 성공하면 아군에서 적으로 파란 곡선이 이어집니다.',task:'target'},
 {title:'예약과 취소',text:'아직 공격한 것은 아닙니다. 진행 전에는 이동과 행동을 예약합니다. 허공을 눌러도 확정한 예약은 유지됩니다. 같은 활성 카드를 다시 누르면 그 예약을 취소합니다. 미확정 조준만 허공이나 우클릭으로 취소할 수 있습니다.'},
 {title:'주 대상과 부 대상',text:'주 대상은 직접 선택한 한 명입니다. 범위 행동은 주 대상 주변에 표시되는 타일에 있는 다른 대상도 함께 맞히며, 이들은 부 대상입니다. 전체 공격도 주 대상을 먼저 정합니다. 범위와 대상 수는 다른 정보입니다.'},
 {title:'충돌 가져오기',text:'서로 사거리 안에 있는 두 행동이 맞서거나, 아군이 아군을 향한 적 행동을 유효하게 가로채면 충돌합니다. 마지막으로 유효하게 지정한 아군이 그 충돌을 가져옵니다. 금색 양방향 화살표가 확정된 충돌이며, 빨강·파랑이 그대로면 일방 공격입니다.'},
 {title:'위력과 7단계 파형',text:'행동마다 파형을 한 번 판정합니다. 기본 위력 + 파형값 × (-3~+3)이 행동 위력이며 최소 1입니다. 기본 18, 파형값 3, 증폭 +2라면 위력은 24입니다. 그 행동의 모든 피해 비율이 이 위력을 공유합니다. 정신력은 확률에 영향을 주며 음수 파형값도 가능합니다.'},
 {title:'패링과 행동 취소',text:'맞서는 두 행동은 파형을 각각 한 번 판정해 위력을 비교합니다. 승자는 상대 행동을 통째로 취소합니다. 별도 패링 성공 효과가 없다면 공격이나 반격은 이어지지 않습니다. 동률은 양쪽 행동 상쇄이며 타수를 파괴하거나 재판정하지 않습니다.'},
 {title:'다른 아군의 수비',text:'아직 행동을 예약하지 않은 다른 아군을 고르고 손패 왼쪽의 수비 카드를 누르세요. 방어·회피는 자신을 지키고, 반격은 사거리 안의 적을 지정합니다. 수비는 가방 수량과 무관하게 항상 제공되지만 행동 슬롯은 사용합니다.',task:'guard'},
 {title:'행동 순서와 추가 슬롯',text:'전열에 있을수록 먼저, 같은 전열이면 이동 수가 높은 쪽이 먼저입니다. 그다음 스킬·수비 우선도 등의 보정이 적용됩니다. 충돌은 두 행동 중 더 이른 순위를 사용합니다. 적의 행동 총합이 더 많으면 그 차이만큼 아군 편성 순서대로 추가 슬롯을 나눕니다.'},
 {title:'첫 턴 진행',text:'이제 오른쪽 아래 진행을 누르세요. 예약한 행동이 순서대로 실행됩니다. 수비만 예약한 인원을 제외한 나머지 아군에게도 행동을 지정해도 됩니다. 실행 뒤 턴이 넘어가며 이동 수가 회복되고 적이 다시 준비합니다.',task:'resolve'},
 {title:'효과와 공명',text:'상처는 피격·턴 종료에 체력 피해, 잠식은 같은 때 정신 피해를 줍니다. 집중은 치명타 확률, 강타는 치명타 피해율, 충격은 위력 감소, 자원은 기술 비용에 사용합니다. 위력/횟수는 각각 최대 100입니다. 두 번 쌓인다고 공명하지 않으며 [키워드 공명] 효과가 있어야 발동합니다.'},
 {title:'손패 가방',text:'한 가방은 1스킬 4장, 2스킬 3장, 3스킬 2장, 4스킬 1장입니다. 사용한 카드는 이번 가방에서 다시 뽑히지 않습니다. 남긴 손패는 유지되고 가방을 다 소모한 뒤 다음 가방을 섞습니다. 그래서 4스킬은 귀하며 사용 시점을 골라야 합니다.'},
 {title:'필라멘트와 개념 폭주',text:'필라멘트는 0에서 시작합니다. 턴 경과, 유효 피해, 회피 등 실제 전투를 통해 쌓이며 이동만으로 무한 충전되지 않습니다. 손패 오른쪽의 개념 폭주는 강력하지만 필라멘트와 정신력이 필요합니다. 비활성 카드의 비용을 먼저 확인하세요.'},
 {title:'대기 인원과 교체',text:'아군이 쓰러지면 대기 순서대로 같은 가로 줄의 맨 뒤에서 합류합니다. 맨 뒷열 아군에게만 수비 왼쪽 교체 카드가 보입니다. 대기 인원을 선택하면 자기의 다른 예약이 모두 취소되고 그 턴의 추가 행동은 불가합니다. 턴 종료 후 그 자리로 교체됩니다. 이번 전투에서 이루어도는 대기에도 없습니다.'},
 {title:'용병단 돌파',text:'이제 배운 방법으로 남은 용병들을 모두 물리치세요. 턴마다 사거리와 적의 예고를 확인하고 이동 → 카드 → 주 대상 → 진행을 반복하세요. 화면 빈 곳을 드래그하면 회전, 휠은 확대·축소입니다. 오른쪽 위 메뉴의 로그에서 실제 판정을 확인할 수 있습니다.',task:'win'},
 {title:'길이 열렸습니다',text:'무의식의 용병단을 돌파했습니다. 전투 결과를 정리하고 의뢰인이 기다리는 야영장으로 나아갑니다.',task:'finish'}
];

function startMindBattleTutorial() {
 if(battleTutorial) return;
 clearTimeout(autoTimer);clearTimeout(typeTimer);
 battleTutorial={step:0,backup:JSON.parse(JSON.stringify(battleDummy)),resumeIndex:prologueSceneIndex+1,selectedAt:Date.now()};
 const actions=[
  {name:'기억의 총검',type:'관통',keyword:'충격',range:1,scope:'단일',hits:1,power:6,wave:1,effect:'[충격 1 / 1]'},
  {name:'희미한 총성',type:'관통',keyword:'충격',range:3,scope:'단일',hits:1,power:7,wave:1,effect:'[충격 1 / 1]'},
  {name:'기억의 방패',type:'방어',keyword:'보호',range:0,scope:'자신',hits:0,power:5,wave:0,effect:'[보호 4 / 1]'}
 ];
 battleDummy.enemies=JSON.parse(JSON.stringify(battleTutorial.backup.enemies)).map((unit,index)=>({...unit,name:['상상 속 돌격병','상상 속 사수','상상 속 방패병'][index],image:'assets/story/standing/imagined_mercenary.png',hp:70,maxHp:70,tutorialAction:actions[index],actionsPerTurn:index<2?2:1}));
 resetBattleDummy();
 showBattleDummy();
}

function tutorialTaskDone(lesson) {
 const units=battleDummy.allies;
 switch(lesson.task){
  case 'lineup':return !!battleDummy.lineupReady;
  case 'select':return battleDummy.lastUnitClick?.time>=battleTutorial.selectedAt && units.some(u=>u.id===battleDummy.lastUnitClick.id);
  case 'move':return units.some(u=>u.moveLeft<u.move);
  case 'card':return battleDummy.aiming?.source==='hand' || !!battleDummy.aiming && getSelectedBattleUnit().reservedSource==='hand';
  case 'target':return units.some(u=>u.queuedActions?.some(a=>a.source==='hand'));
  case 'guard':return units.some(u=>u.queuedActions?.some(a=>a.source==='guard'));
  case 'resolve':return battleDummy.turn>1;
  case 'win':return battleDummy.enemies.every(e=>e.hp<=0);
  default:return true;
 }
}

function renderBattleTutorial() {
 if(!battleTutorial) return;
 const shell=document.querySelector('.battle-dummy, .battle-lineup');if(!shell)return;
 shell.classList.add('tutorial-battle');
 const lesson=tutorialLessons[battleTutorial.step];
 const ready=tutorialTaskDone(lesson);
 const needsPractice=!!lesson.task&&!['lineup','finish'].includes(lesson.task)&&!ready&&!battleTutorial.practicing;
 const defeated=battleDummy.lineupReady&&battleDummy.allies.every(u=>u.hp<=0)&&!battleDummy.bench.some(u=>u.hp>0);
 document.querySelector('#battle-tutorial-guide')?.remove();
 const panel=document.createElement('aside');panel.id='battle-tutorial-guide';panel.className=`battle-tutorial-guide ${battleTutorial.folded?'folded':''}`;
 panel.innerHTML=`<header><strong>이루어질 · ${lesson.title}</strong><button type="button" id="tutorial-fold" aria-label="안내 펼치기 또는 접기">${battleTutorial.folded?'+':'−'}</button></header><div class="tutorial-copy"><h3>${lesson.title}</h3><p>${lesson.text}</p></div><footer><span>${lesson.task&& !ready?'직접 실행해 주세요':'확인했습니다'}</span><button type="button" id="tutorial-next" ${ready||needsPractice?'':'disabled'}>${needsPractice?'실습 시작':lesson.task==='finish'?'스토리 계속':'다음'}</button></footer>`;
 if(shell.classList.contains('battle-lineup')) shell.querySelector('header').after(panel);else shell.append(panel);
 panel.addEventListener('pointerdown',e=>e.stopPropagation());
 panel.querySelector('#tutorial-fold').onclick=()=>{battleTutorial.folded=!battleTutorial.folded;renderBattleTutorial();};
 if(defeated){const button=panel.querySelector('#tutorial-next');button.disabled=false;button.textContent='재도전';panel.querySelector('footer span').textContent='전투 불능 · 다시 준비하세요';}
 panel.querySelector('#tutorial-next').onclick=()=>{
  if(defeated){const {backup,resumeIndex}=battleTutorial;Object.assign(battleDummy,backup);battleTutorial=null;prologueSceneIndex=resumeIndex-1;startMindBattleTutorial();return;}
  if(needsPractice){battleTutorial.practicing=true;battleTutorial.folded=true;renderBattleTutorial();return;}
  if(!tutorialTaskDone(lesson))return;
  if(lesson.task==='finish'){finishMindBattleTutorial(true);return;}
  battleTutorial.step++;battleTutorial.practicing=false;battleTutorial.folded=false;battleTutorial.selectedAt=Date.now();renderBattleTutorial();
 };
 document.querySelectorAll('.tutorial-focus').forEach(el=>el.classList.remove('tutorial-focus'));
 const selector={move:'.move-cell',card:'.battle-skill.hand',target:'[data-battle-target]',guard:'.battle-skill.guard',resolve:'#battle-resolve'}[lesson.task];
 if(selector)document.querySelectorAll(selector).forEach(el=>el.classList.add('tutorial-focus'));
 const resolve=document.querySelector('#battle-resolve');if(resolve)resolve.disabled=battleTutorial.step<14;
}

function finishMindBattleTutorial(resume) {
 if(!battleTutorial)return;
 const {backup,resumeIndex}=battleTutorial;
 Object.assign(battleDummy,backup);battleTutorial=null;
 if(resume){completedTutorials.add(activeStageId);prologueSceneIndex=resumeIndex;document.querySelector('#node-stage').innerHTML='<section class="story-player fullscreen" id="prologue-player" aria-live="polite"></section>';renderPrologueScene();}
 else showChapterMap(activeChapterId);
}
