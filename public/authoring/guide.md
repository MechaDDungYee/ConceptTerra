# 콘셉트테라 TRPG 파일 제작 가이드

카드, 패시브, 중첩을 외부에서 작성한 뒤 게임에 가져오는 방법입니다. 함께 제공되는 **규칙 목록 JSON**은 현재 배포 코드에서 생성됩니다. 효과의 영문 키, 한국어 이름, 선택값과 한도는 `ruleOptions`에서, 기본 카드 ID는 `builtInCards`에서 확인하세요. `passiveEventsByEffect`는 패시브의 기본 이벤트 목록이며, 예외와 세부 조건은 `serverValidation`에 있는 실제 검증 코드를 따릅니다.

## 처음 만들기

1. 원하는 품목의 예제 JSON을 다운로드합니다.
2. 가이드와 규칙 목록 JSON을 AI에 제공하고, 예제 구조를 유지한 채 내용을 바꾸도록 요청합니다.
3. 결과를 UTF-8 `.json` 파일로 저장합니다. 주석, 코드 펜스, 끝 쉼표, 설명 문장 없이 JSON 객체 하나만 넣습니다.
4. 개인 제작실 또는 세션에서 아래 메뉴로 파일을 가져옵니다.
5. 가져온 내용을 편집기에서 확인하고, 테스트 전투에서 발동 시점·대상·수치를 검증합니다.

| 품목 | 최상위 `format` | 최상위 목록 | 업로드 위치 |
| --- | --- | --- | --- |
| 카드 | `conceptterra-card-library` | `cards` | 카드 · 덱 → 카드 보관함 · 전투 덱 |
| 패시브 | `conceptterra-passives` | `passives`, `cards` | 캐릭터 → 패시브 |
| 중첩 | `conceptterra-stacks` | `stacks`, `cards` | 카드 · 덱 → 중첩 관리 |

모든 파일의 `version`은 정수 `1`입니다. 패시브·중첩에 참조 제작 카드가 없으면 `"cards": []`를 넣습니다. 업로드 파일 크기는 최대 1,200,000바이트입니다. 카드 보관함·중첩 보관함의 전체 용량 제한도 따로 적용됩니다.

## 카드

- `id`는 파일 안에서 유일한 문자열입니다. 최대 70자이며 기본 카드 ID와 겹치면 안 됩니다. 예를 들어 `my-pack-signal-01`을 사용합니다. 업로드 시 서버가 새 ID를 만들고 파일 내부의 카드 참조도 함께 바꿉니다.
- `name`은 최대 36자입니다. `role`은 `normal`, `chain`, `assist`, `guard`, `counter`, `overload` 중 하나입니다. `overload`의 `cost`는 0~100 사이의 정수이며 생략 시 20입니다. 0을 입력하면 정신력을 소모하지 않습니다.
- `target`은 정수 `1`~`4` 또는 `"self"`, `"area"`, `"splash"`, `"tile"`입니다. 원호 방어와 반격은 `self`를 사용합니다. `splash`와 `tile`에는 `splash` 객체가 필요합니다.
- 단타는 `"power":"2d8+3"`, 다타는 `"hitPowers":["2d8+3","5"]`처럼 씁니다. 둘을 함께 쓰면 `hitPowers`가 우선합니다. 최대 8타이며, 각 식은 문자열입니다. 주사위는 1~12개, 면은 2~100이고 `2d+5`처럼 면을 생략하면 d6입니다. 고정 위력은 `"0"`~`"999"`입니다.
- 거리 `range`는 `"0"`, `"1, 3"`, `"1~4"`처럼 0~12를 사용한 문자열입니다. 쉼표로 최대 8개 구간을 연결할 수 있습니다. 기하 사거리는 `rangeShape`에 `{"kind":"rectangle","x":3,"y":1}`, `{"kind":"circle","radius":2}`, `{"kind":"cross","radius":2}`, `{"kind":"custom","cells":[[1,0],[2,0],[1,-1]]}`처럼 씁니다. `splash`에도 같은 `range` 또는 `rangeShape` 형식을 사용합니다. 양의 x는 동쪽, 양의 y는 남쪽입니다. 커스텀 좌표에서 중심 `[0,0]`은 제외합니다.
- `effects`는 배열입니다. 카드 전체와 모든 타격의 효과를 합쳐 최대 24개입니다. 카드 전체 효과는 `hitIndex`를 생략하고, 타격 효과는 1부터 시작하는 `hitIndex`를 지정합니다. `hitTargets`를 쓴다면 타수와 정확히 같은 길이여야 합니다.
- 선택 필드로 `clash`, `unstoppable`, `unredirectable` 불리언, `requiredState` 값 `any`·`collapsed`·`awakened`, `notes`, `flavor`, 타격 순서대로 적는 `hitFlavors`가 있습니다. `image`는 최대 32,000자의 JPEG·PNG·WebP Base64 데이터 URL입니다.
- 가져오기는 보관함 추가입니다. 기존 파일의 ID를 다시 써도 기존 카드를 수정하지 않습니다. 제작 카드 한도는 24장이고, 전투 덱은 보관함과 별도로 10장을 고릅니다. 같은 카드는 덱에 최대 3장입니다.

## 패시브와 중첩

| 항목 | 패시브 항목 | 중첩 항목 |
| --- | --- | --- |
| 필수 필드 | `name`, `effects` | `name`, `effects` |
| 이름 | 최대 36자 | 최대 22자, 기본·개념물 중첩 및 기존 제작 중첩과 이름 중복 금지 |
| 효과 수 | 1~8개 | 0~9개 |
| 선택 설정 | `notes`, `flavor`, `enabled` | `flavor`, `stackAxesMode`, `holdPower`, `holdCount`, `gainLimits` |
| 가져오기 | 최대 8개, 가져온 패시브는 비활성 상태에서 시작 | 제작 중첩 최대 100개, 다음 전투부터 적용 |

- 패시브는 가져온 뒤 캐릭터에서 직접 활성화합니다. 전투에 참여 중인 캐릭터의 패시브 업로드는 전투 후에 가능합니다.
- 중첩의 `stackAxesMode`는 `both`·`power`·`count` 중 하나입니다. `holdPower`·`holdCount`는 현재 보유 상한입니다. `gainLimits`는 획득 이력을 기준으로 적용하는 별도 상한입니다. 1회·턴·전투 기준 키는 규칙 목록의 `stackGainLimits`에서 확인합니다. 제한이 필요 없으면 필드를 생략합니다.
- 보유 중에도 유지되는 중첩 효과에는 `when:"held"`, `to:"self"`를 사용합니다. 지원 효과는 `heldStackEffectKinds`에 있습니다. 피해나 회복처럼 반복해서 처리할 효과는 `turnStart`, `turnEnd`, `struck` 등 실제 사건을 선택합니다.
- 패시브와 중첩은 `passiveEffectKinds` 및 해당 효과가 허용하는 이벤트를 사용합니다. `hitIndex`와 대가 배율 필드를 넣지 않습니다. 턴 시작·종료 등 라운드 이벤트에는 `self` 또는 자동 대상만 사용합니다. 중첩에는 `replaceCard`, `giveCard`를 넣을 수 없습니다.
- 플레이버 텍스트는 카드·패시브·중첩 본문에서 최대 300자, 개별 타격·효과에서 최대 180자입니다. 대사·기록을 적고, 전투에서 적용될 동작은 효과로 정의합니다.

## 공통 효과 작성법

`{"kind":"shield","when":"turnStart","to":"self","amount":3}`은 턴 시작에 자신에게 보호막 3을 부여합니다. 효과 한 항목에는 `kind`(효과), `when`(발동), `to`(대상), `amount`(수치)를 기본으로 적습니다. 무수치 효과에는 `amount:1`을 적습니다. 등록된 키와 옵션은 **규칙 목록 JSON**에서 조회합니다. 보통 수치는 정수이며, 부호·범위·비율 지원 여부는 효과별로 다릅니다.

| 원하는 동작 | 필드 조합 |
| --- | --- |
| 라운드 시작·끝, 카드 사용, 합, 피격 | `turnStart`, `turnEnd`, `use`, `clash`, `struck`를 `when`에 사용합니다. `hurt`는 피격으로 체력 피해를 받을 때입니다. |
| 특정 타격에서만 적용 | `hitIndex:2`처럼 지정합니다. `hitEffectTimings` 중 해당 효과에서 허용하는 이벤트를 선택합니다. |
| 정해진 카드가 손패에 들어올 때 | `when:"handEntered", zoneCard:"specific", zoneCardId:"my-card", zoneOwner:"self"`를 씁니다. 뽑기만 감지하려면 `cardDrawn`을 사용합니다. |
| 이름으로 이동 카드나 카드 주인 감지 | `zoneCard:"named", zoneCardName:"카드명"` / `zoneOwner:"named", zoneOwnerName:"캐릭터명"`를 사용합니다. 패시브·중첩에는 `zoneCard:"same"`과 `"other"`를 사용할 수 없습니다. |
| 턴마다 최대 한 번 | `"limit":{"period":"turn","count":1}`. 전투당은 `battle`입니다. 제한을 쓰지 않으면 `limit`을 생략합니다. |
| 중첩 위력 25, 횟수 2 부여 | `{"kind":"stack","when":"use","to":"self","amount":1,"tag":"집중","stackAxes":true,"axisPower":25,"axisCount":2}` |
| 중첩 위력만 5 소모 | `{"kind":"consume","when":"use","to":"self","amount":1,"tag":"집중","stackAxes":true,"axisPower":5}`. 변경할 축만 적습니다. 두 축을 쓰는 중첩을 처음 부여할 때 빠진 축은 1로 시작합니다. |
| 특정 중첩 횟수의 30%를 부여 | `stackAxes:true, axisCount:30, axisCountMode:"percent", axisCountBasis:"ownStackCurrent", axisCountTag:"집중"`처럼 적습니다. 위력 축은 `axisPower` 접두어를 씁니다. |
| 보호막 중첩 방식과 유지 | `shieldDuration`, `stackMode`, `shieldCap`, `shieldSource`, `refreshDuration`을 사용합니다. `shieldDuration:0`은 라운드 만료를 두지 않습니다. `durationPolicy`, `durationCap`은 지원 효과에서 사용합니다. |
| 흡혈·보호막 변환 | `lifeSteal` 또는 `shieldConversion` 및 `leechResource`, `leechBasis`, `leechShield`, `leechRecovery`, `leechFormula`를 사용합니다. 수치·유지 라운드·상한 필드는 `effectSettings`에서 확인합니다. |
| 팔방 이동 또는 칸 선택 | `kind:"move"`에 `moveMode:"direction",moveDirection:"ne"` 또는 `moveMode:"choose"`를 사용합니다. 직접 고를 이동력은 다음 행동을 확정하기 전에 사용합니다. |
| 조건에 맞는 적의 왼쪽으로 이동 | `moveMode:"relative",moveAnchor:"enemy",moveOrder:"lowestHp",moveOffset:"left",moveTest:"inside",moveTag:"집중",moveMetric:"count",moveMin:2,moveMax:5`를 사용합니다. |

`amountMode:"percent"`에서 `amount:30`은 30%입니다. `ratioBasis`는 해당 효과와 이벤트에서 지원할 때만 넣습니다. 비율을 적용할 중첩 이름은 `ratioStackTag`이며, 독립 축에서는 각각의 `axisPowerTag` 또는 `axisCountTag`입니다.

`condition` 및 `threshold`로 단순 조건을 붙일 수 있습니다. `condition:"stack"`에는 `conditionStackTag`를, `condition:"cardUsed"`에는 `conditionCardId`를 적습니다. 키워드 카드 보유자를 효과 대상으로 삼으려면 `to:"keywordHolders"`와 `recipientKeyword:{"tag":"집중","scope":"party","zone":"configured","mode":"any","minimum":1}`를 사용합니다.

## 연산 파츠와 조건 블록

JSON은 블록의 화면 배치와 달리 각 효과에 자신의 조건·반복 경로를 기록합니다.

```json
{
  "kind": "shield",
  "when": "turnStart",
  "to": "self",
  "amount": 1,
  "amountExpr": {
    "type": "math",
    "op": "add",
    "terms": [{"type": "number", "value": 2}, {"type": "number", "value": 3}]
  },
  "flow": [{
    "kind": "if",
    "id": 1,
    "branch": "then",
    "test": {
      "type": "condition",
      "condition": "keywordOwnedCount",
      "tag": "집중",
      "scope": "party",
      "zone": "configured",
      "minimum": 1,
      "op": "gte",
      "threshold": 2
    }
  }]
}
```

- `amountExpr`는 효과의 기본 수치에, `numberExprs`는 지원되는 개별 수치 필드에 연결합니다. 예를 들어 `"numberExprs":{"axisCount":{"type":"number","value":2}}`입니다. `amount` 등 기본 입력값도 유효하게 적어 두세요.
- 수식의 노드는 `number`, `percent`, `stat`, `math`입니다. 정수 리터럴 범위는 −10000~10000입니다. `stat`은 `stat` 키에 규칙 목록의 식별자를 씁니다. `math`는 `op`와 `terms` 또는 `left`·`right`를 씁니다.
- 조건 노드는 `condition`, `compare`, `gate`, `and`, `or`, `not`, `hitResult`입니다. `compare`에는 `op`, `left`, `right`를, `gate`에는 `gate`, `inputs`를 사용합니다. `hitResult`는 `hit` 이벤트에서만 사용합니다. 키워드·중첩 감지의 `minimum`은 유닛 한 명당 필요한 수, `threshold`는 조건에 맞는 유닛 수입니다.
- 반복은 `{"kind":"repeat","id":2,"count":3}`입니다. 조건 단계는 `branch:"then"` 또는 `"else"`를 사용합니다. 단계 ID는 1~10000 정수이며 한 효과 경로 안에서 유일해야 합니다. 여러 효과가 같은 분기나 반복을 공유하면 동일한 단계 ID와 동일한 설정을 쓰세요.
- 효과당 제어 경로 최대 4단계, 반복 1~5회, 수식과 조건 깊이 최대 4, 수식 항 2~12개입니다. 반복을 포함한 전체 실행 상한은 64회입니다. 카드 교체와 대가 효과에는 반복을 연결할 수 없습니다.

## 카드·중첩 참조를 함께 전달하기

- 카드 참조 필드의 값은 **카드 이름이 아니라 ID**입니다. 예를 들어 `copyId`, `zoneCardId`, `conditionCardId`, `givenCardId`, `replacementId`, `fromCardId`가 해당합니다. 이름을 받는 `zoneCardName`과 구분하세요.
- 참조하는 제작 카드와 그 카드가 참조하는 다른 제작 카드까지 같은 파일의 `cards`에 포함하세요. 두 카드를 따로 업로드하면 가져올 때 발급된 ID가 달라질 수 있습니다. 규칙 목록의 `builtInCards`는 그대로 참조할 수 있습니다.
- 중첩 참조는 **이름**으로 연결합니다. 같은 이름을 카드·패시브·중첩 파일에서 일관되게 사용하고, 필요한 사용자 제작 중첩은 중첩 파일로 먼저 가져오세요. 다른 중첩의 정의가 필요하다면 그 중첩도 파일의 `stacks`에 넣습니다.
- 중첩 파일에 중복 이름이 있으면 파일 전체가 거절됩니다. 카드·패시브·중첩 중첩 참조를 수정할 때는 연결된 파일들도 함께 갱신하세요.
- 공개용 파일에는 GM 전용 정보나 공개하면 안 되는 플레이버·메모를 넣지 마세요. `gmOnly`, `publicName`, `publicHint`는 공개 표시를 제어하는 필드이므로 파일을 공유하기 전에 실제 JSON 내용을 확인하세요.

## AI에 전달할 요청 예시

> 첨부한 콘셉트테라 제작 가이드, 규칙 목록 JSON, 품목별 예제를 기준으로 작성해 줘. 원하는 동작은 [여기에 요청]이야. 실제 업로드 형식 버전 1의 JSON을 파일별로 출력해 줘. 사람이 읽는 명칭 대신 규칙 목록의 키를 사용하고, 효과마다 발동 시점·대상·수치·참조가 맞는지 확인해 줘. 카드 참조는 같은 파일에 정의된 ID나 기본 카드 ID로 연결하고, 별도의 제작 중첩이 필요하면 중첩 파일도 출력해 줘. 각 파일은 JSON 객체 하나만 포함해야 해.

가져오기에 실패하면 화면의 오류를 AI에 그대로 전달하고, 문제를 일으킨 항목 하나만 고쳐 다시 시도하세요. 편집기에서 원하는 효과를 한 번 만든 뒤 내려받은 파일을 함께 주면 해당 효과 조합을 가장 정확하게 재현할 수 있습니다.
