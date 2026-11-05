const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const cutoff = source.indexOf('renderChapters();', source.lastIndexOf('function renderSquad'));
const context = vm.createContext({ window: {}, document: { querySelectorAll: () => [] }, console });
vm.runInContext(fs.readFileSync(path.join(root, 'battle-tutorial.js'), 'utf8'), context);
vm.runInContext(source.slice(0, cutoff), context);
const roster = JSON.parse(vm.runInContext('JSON.stringify(createBattleRoster())', context));
const lines = ['# 기본 이격 연속 행동 개편', '', '2026-10-08. 종전 타수 누적·타수 파괴 규칙보다 이 문서가 우선한다.', '',
  '- 행동 위력 = 기본 위력 + 파형값 × 파형 단계(-3~+3). 최소 1. 행동당 한 번 판정하며 모든 연속 효과가 공유한다.',
  '- 패링은 양쪽 위력을 한 번 비교한다. 승자는 상대 행동을 파괴한 뒤 짧은 간격을 두고 자신의 행동을 수행한다. 공격은 승리한 파형을 재사용하며 충돌 전용 보정은 제외한다. 동률은 양쪽 상쇄.',
  '- 기본 위력: 1~4스킬 18 / 22 / 26 / 30. 파형값: +3 / +4 / +5 / +6. 기본 개념 폭주 40 +8, 수비 15 +4.',
  '- 기존 hits와 이름, 이미지 및 모션 파일은 보존한다. hits는 과거 모션 조회용이며 파괴·누적 판정 수가 아니다. 원본 수치는 legacy에 보관한다.',
  '- 공명 행동은 앞 동작에서 해당 키워드를 스스로 부여하고 마지막 연속 효과에서 공명한다. 원본 이미지가 하나인 공명 행동도 효과를 둘로 나누되 같은 승인된 모션을 재사용한다. 집중 공명은 마지막 피해 직전에 발동하여 그 피해를 치명타로 만든다.',
  '- 벽 추가 피해는 해당 대상에게 이 행동으로 실제 입힌 직접 피해 합계 기준. 상태 피해와 벽 추가 피해 자체는 제외. 점유된 타일은 벽이 아니다. 현재 더미의 전장 경계는 벽으로 간주한다.',
  '- 각 피해 효과마다 버림 처리. 다음 턴 이동 증가분은 한 턴만 적용하며 기본 이동 수 및 행동 우선도는 바꾸지 않는다.',
  '- 집중: 위력%의 치명타 확률. 치명타가 발동한 직접 피해 동작마다 횟수 1 소모하며, 일반 공격에서는 횟수를 소모하지 않는다.',
  '- 정신력 시작 50. 패링 성공 +10, 적 직접 피해 적중마다 +5, 아군 사망 -10. 개념 폭주 비용과 사거리·범위·가방 구성은 유지.', '',
  '## 캐릭터별 행동', ''];
for (const unit of roster) {
  lines.push(`### ${unit.name}`, '', `체력 ${unit.maxHp} / 기본 이동 ${unit.move}`, '');
  const actions = [...unit.skills, unit.guard, unit.ego];
  actions.forEach((action, index) => {
    const label = index < 4 ? `${index + 1}스킬` : index === 4 ? '수비' : '기본 개념 폭주';
    lines.push(`#### ${label}: ${action.name}`, '', `기본 위력 ${action.power} / 파형값 ${action.wave >= 0 ? '+' : ''}${action.wave} / 사거리 ${action.range} / ${action.scope}${action.cost ? ` / 정신력 소모 ${action.cost}` : ''}`, '', action.effect, '');
  });
}
const output = path.resolve(root, '../../잡다한 것들/이루다_기본이격_연속행동_개편.md');
fs.writeFileSync(output, lines.join('\n') + '\n', 'utf8');
console.log(`Exported ${roster.length} identities and ${roster.length * 6} actions.`);
