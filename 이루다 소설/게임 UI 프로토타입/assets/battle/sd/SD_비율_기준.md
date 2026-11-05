# 전투 SD 비율 및 모션 기준 v2

## 2026-10-08: 단일 이미지 재작화로 전환
- 최신 사용자 지시: 파츠 및 관절 리그 방식은 사용하지 않는다. 동작마다 한 명의 완성된 전신 이미지를 따로 그린다.
- 새 기본 SD를 매번 직접 참조하고, 머리 크기와 어깨 너비, 팔다리 길이를 비교한다. 여러 동작을 한 장에 묶는 시트는 이번 재작화에 사용하지 않는다.
- 최초 검수분은 이루어질의 결말 예측 첫 공격과 피격 2개다. `../motions/single55/preview.html`에서 원본과 같은 배율 및 발 기준선으로 비교할 수 있다.
- 두 후보는 1086x1448 투명 PNG이며 아직 게임에 연결하지 않았다. 단일 이미지 생성만으로 모든 인체 비율이 완전히 같다고 검증한 것은 아니다.
- 원형 팔 패치는 기존 이루다 1팀 원본의 전구 및 별로 끝나는 열 갈래 실선 문양을 참조한다. 개인 캐릭터 로고나 물음표 문양으로 대체하지 않는다.

## 2026-10-08: 5.5등신 기본 SD 재작화
- 새 작화 목표는 5.5등신이다. 이전 이루겠네 원본의 큰 머리를 비율 기준으로 재사용하지 않는다.
- 머리 1단위 대비 전체 키 5.5단위, 900px 전신 기준 머리 약 163.64px이다.
- 전투 캐릭터 9명의 별도 PNG와 검수 화면을 `sd-55/preview.html`에 저장했다. 이루리는 비전투 인물이므로 이번 전투 SD 대상에서 제외했다.
- 5.5등신 수치 골격을 참조해 생성했지만, 실제 결과의 머리 외곽 기준 수동 근사치는 약 5.2~5.7등신이다. 모두 정확히 5.5라는 검증은 아니며 기존 승인본을 자동 대체하지 않는다.
- 새 후보는 모두 실제 1086x1448 투명 PNG이다. 기존 원본과 모션은 보존했다. 새 후보가 승인되면 그 후보의 머리 크기와 뼈 길이를 모션의 새 기준으로 사용해야 한다.
- 캐릭터별 선택 파일, 정수리/턱/발바닥 근사 좌표, 생성 프롬프트는 `sd-55/selection-records.json`에 보관한다.

## 2026-10-08: 게임 적용
- 사용자 요청에 따라 검수 화면에서 선택한 9명의 후보를 실제 전투 기본 SD로 적용했다.
- 캐릭터별 실제 원본 전신 높이와 발바닥선으로 표시 크기를 맞춘다. 파일 자체를 늘이거나 머리만 화면에서 축소하지 않는다.
- 기존 공격/피격 모션은 원본 파일과 기존 크기 기준을 유지한다. 새 기본 SD와 완전히 같은 비율로 수정된 모션이라는 뜻은 아니다.
- 이루리의 비전투 설정과 기존 SD는 변경하지 않는다.

## 이전 기준 캐릭터 (보존 기록)
- 이루게나만 후속 머리 축소본 `06_이루게나_SD_v3.png`를 사용한다. 몸 높이 900px, 발 피벗 (384,964), 표시 배율 1 및 도끼 위치를 유지한다. 다른 팀원은 v2를 유지한다.
- 이루겠네는 공통 높이와 발선의 기준으로 보존한다. 다른 9명은 첫 번째 비율 수정에서 나온 작은 머리 버전(`*_SD_v2.png`)을 최종 사용한다. 이후 머리를 다시 확대하려고 만든 보정본은 적용하지 않는다.
- 최신 사용자 기준: 앞으로 모션 및 SD 제작은 약 5~6등신을 목표로 한다. 이전 3.5등신 지시와 머리를 확대해 이루겠네 외곽에 강제로 맞추는 지시는 폐기한다. 머리카락과 가면의 부피는 해부학적 머리 크기와 구분한다.
- 다른 9명은 내장 이미지 생성 도구로 머리와 신체 비율을 수정한다. 얼굴, 머리 색, 복장, 대표 소품은 유지한다.
- 동일 SD 높이는 전투용 작화 표준이다. 소설의 실제 키나 대화 스탠딩 키 설정은 변경하지 않는다. 이루어도의 체격은 넓은 어깨와 팔로 표현한다.

## 캔버스와 피벗
- 모든 PNG: 768x1024, 투명 배경. 캐릭터의 전체 세로 외곽 높이 900px, 상단 64px, 발 바닥선 y=964, 하단 여백 60px.
- 기본 발 피벗: (384, 964). 좌우 이동·공격 프레임을 만들 때도 동일한 캔버스와 피벗을 유지한다.
- 가로로 넓은 무기나 코트 때문에 인물 전체를 작게 축소하지 않는다. 안전 영역 안에서 소품의 위치를 조정한다. 캐릭터별 화면 배율은 모두 1이다.
- 이후 새로 그릴 모션의 해부학적 머리 높이는 900px 몸 높이 기준 약 150~180px(5~6등신)을 목표로 한다. 이는 다음 작화의 목표이며 현재 파일들이 정확히 그 수치라는 자동 측정 결과가 아니다. 현재 모션은 각자의 승인된 작은 머리 대기 버전에서 출발하며 프레임마다 머리를 다시 키우지 않는다.

## 모션 제작 기준
- 기본 카메라는 오른쪽을 바라보는 3/4 시점. 머리만 정면으로 돌리거나 팔·다리를 과하게 원근 축소하지 않는다.
- 기존의 큰 머리 기준 고정 턱·관절 좌표는 사용하지 않는다. 각자의 승인된 대기 그림에서 턱·어깨·팔꿈치·허리·고관절·무릎·발목 기준을 추출해 포즈를 옮긴다. 공통 발 바닥 y=964와 피벗 (384,964)은 고정한다.
- 다음 모션에서도 머리 크기, 목 길이, 상·하완 및 허벅지·종아리 길이를 유지한다. 공격 시 키가 변해 보이지 않게 몸의 기울기와 무릎 굽힘으로 높이 변화를 표현한다.
- 주먹·도끼·단검·태블릿 등 소품의 크기와 잡는 손을 프레임마다 유지한다. 이루게나의 도끼를 수납하면 허벅지 바깥쪽으로 배치한다.
- 대기→예비 동작→공격→복귀, 피격→회복, 이동, 방어 등은 각각 별도 제작한다. 이번 파일은 대기 포즈 기준 이미지이며 아직 분리 파츠나 애니메이션 리그는 아니다.
- 출력 PNG와 동일한 이름의 JPG는 `jpg` 하위 폴더에 1MB 이하로 저장한다. 게임에는 투명 PNG만 사용한다.

## 수정 프롬프트

아래는 작은 머리 버전을 생성한 당시의 기록이다. 여기에 남은 3.7~4등신 표현은 재생성 시 사용할 최신 지시가 아니며, 앞으로는 위의 5~6등신 목표 및 승인된 작은 머리 이미지를 따른다.

### 이루어질

EDIT reference1, do NOT change reference2. Reference1 is Irueojil SD; reference2 is Irugetne, the immutable proportion master. Redraw only character1 so its anatomical crown-to-sole height, actual skull/face SIZE, neck, torso length, limb lengths and boot size match reference2. Head must become visibly SMALLER than in reference1 (about 15-20% smaller relative to total height). Do not merely resize the whole sprite. Same approximately 3.7-to-4-head-tall impression as reference2, no giant baby head, no short squat legs. Keep black long hair, gray-blue eyes, black team1 long coat blue lining blue tie, tablet and calm expression. NOT white hair or red ribbon. Preserve simple dark outline and flat cel shading. Animation-ready grounded idle: three-quarter face/body towards SCREEN RIGHT, clear elbows and knees, left arm holds tablet near torso, right open hand near waist, arms separable from body silhouette, balanced boots on one horizontal ground line. Same camera angle as reference2. Full body within 8% padding, no weapon raised above head, no foreshortening, transparent background. No text, backdrop, floor, glow or shadow. Keep simplified detail, coherent hands and joints.

### 이루어져

EDIT reference1 only; reference2 Irugetne is immutable proportion master. Keep sleepy dark-purple-haired girl, violet eyes, hair bow/flower, padded black cloak lavender trim and rabbit plush. Same head size and body height as reference2, do NOT exaggerate child proportions; mood conveyed by half-closed eyes, not giant head or tiny legs. Both arms embrace rabbit low at belly, show elbows and boot silhouettes. REDRAW head about 15-20% smaller relative to body than current reference1; match reference2 actual skull size and full body height, neck, torso and limb lengths. Do not just shrink entire sprite. Approximately 3.7-4 heads tall impression, normal neck, clear shoulders elbows wrists hips knees ankles. Reusable grounded neutral combat idle three-quarter toward SCREEN RIGHT; both boots rest on a single horizontal baseline. Arms separated enough for future pose drawing. Preserve character identity costume colors and simple flat cel shading, dark outline. No foreshortening, no giant head, no short squat legs, no detail increase. Full body with equipment inside 8% safe padding, portrait transparent alpha background. No scenery, ground shadow, effects, text or guides.

### 이루어라

EDIT reference1 only; reference2 Irugetne is immutable proportion master. Keep pale young man messy black hair tired gray eyes black utility coat blue lining loosened blue tie rolled sleeves and small cylinder held low. Same lean leg and torso length as reference2. Shoulders slightly tired but spine upright for reusable rig, not hunched foreshortening. REDRAW head about 15-20% smaller relative to body than current reference1; match reference2 actual skull size and full body height, neck, torso and limb lengths. Do not just shrink entire sprite. Approximately 3.7-4 heads tall impression, normal neck, clear shoulders elbows wrists hips knees ankles. Reusable grounded neutral combat idle three-quarter toward SCREEN RIGHT; both boots rest on a single horizontal baseline. Arms separated enough for future pose drawing. Preserve character identity costume colors and simple flat cel shading, dark outline. No foreshortening, no giant head, no short squat legs, no detail increase. Full body with equipment inside 8% safe padding, portrait transparent alpha background. No scenery, ground shadow, effects, text or guides.

### 이루소서

EDIT reference1 only; reference2 Irugetne is immutable proportion master. Keep middle-aged man brown low ponytail, beard, stern eyes, black tactical coat blue tie knee guards, knife down next to hip. Same skull size and crown-to-sole height as reference2, broaden shoulders not height. Hands not covering joints. REDRAW head about 15-20% smaller relative to body than current reference1; match reference2 actual head size and full body height, neck, torso and limb lengths. Do not just shrink entire sprite. Approximately 3.7-4 heads tall impression, normal neck, clear shoulders elbows wrists hips knees ankles. Reusable grounded neutral combat idle three-quarter toward SCREEN RIGHT; both boots rest on a single horizontal baseline. Arms separated enough for future pose drawing. Preserve character identity costume colors and simple flat cel shading, dark outline. No foreshortening, no giant head, no short squat legs, no detail increase. Full body with equipment inside 8% safe padding, portrait transparent alpha background. No scenery, ground shadow, effects, text or guides.

### 이루리

EDIT reference1 only; reference2 Irugetne is immutable proportion master. Keep glass LIGHTBULB head, no human face, exactly ONE golden angular filament. Bulb outside diameter should match reference2's HEAD envelope, not oversized orb. Black coat blue lining blue tie, two papers against chest, no weapon. Observer, same body height as reference2. REDRAW head about 15-20% smaller relative to body than current reference1; match reference2 actual head size and full body height, neck, torso and limb lengths. Do not just shrink entire sprite. Approximately 3.7-4 heads tall impression, normal neck, clear shoulders elbows wrists hips knees ankles. Reusable grounded neutral combat idle three-quarter toward SCREEN RIGHT; both boots rest on a single horizontal baseline. Arms separated enough for future pose drawing. Preserve character identity costume colors and simple flat cel shading, dark outline. No foreshortening, no giant head, no short squat legs, no detail increase. Full body with equipment inside 8% safe padding, portrait transparent alpha background. No scenery, ground shadow, effects, text or guides.

### 이루어도

EDIT reference1 only; reference2 Irugetne is immutable proportion master. Keep paper bag mask two holes, broad muscular man black coat blue tie harness closed locket, ready gloved fists. Bag head has same height as reference2's head, modest extra width ONLY. Body same crown-to-sole height as reference2; massive impression from shoulders chest forearms, NOT oversized whole sprite. Match reference2 actual skull envelope, crown-to-sole height, neck, torso and limb lengths, not merely scale entire sprite. No enlarged baby head. Approximately 3.7-4-head-tall impression, clear shoulders elbows wrists hips knees ankles. Grounded neutral combat idle three-quarter toward SCREEN RIGHT, both boots on one horizontal baseline. Arms separated enough for future animation poses. Preserve identity costume colors and simplified flat cel shading with dark outline. No foreshortening or crouching. Keep character and low equipment inside 8% safe padding; weapon must not determine body size. Transparent alpha, no scenery shadow effect text or guides.

### 이루게나

EDIT reference1 only; reference2 Irugetne is immutable proportion master. Keep fierce adult woman black hair crimson streaks red eyes scars fangs, black team1 tactical coat blue tie rolled sleeves and BROAD AXE not pickaxe. Axe held low OUTSIDE her right hip, short oblique handle, blade stays beside calves. Do NOT raise weapon above head or sprawl it across whole canvas. Anatomical body must be same height/head size as reference2 even with axe. Show neutral hips knees ankles, only slight bent knees no crouch. Match reference2 actual skull envelope, crown-to-sole height, neck, torso and limb lengths, not merely scale entire sprite. No enlarged baby head. Approximately 3.7-4-head-tall impression, clear shoulders elbows wrists hips knees ankles. Grounded neutral combat idle three-quarter toward SCREEN RIGHT, both boots on one horizontal baseline. Arms separated enough for future animation poses. Preserve identity costume colors and simplified flat cel shading with dark outline. No foreshortening or crouching. Keep character and low equipment inside 8% safe padding; weapon must not determine body size. Transparent alpha, no scenery shadow effect text or guides.

### 이루도록

EDIT reference1 only; reference2 Irugetne is immutable proportion master. Keep serious brown-haired blue-eyed man, black tailored tactical coat blue tie symmetric harness. Same head size, neck, torso, limbs and total height as reference2. Right hand slightly forward at waist, left relaxed at hip. Do not enlarge male head. REDRAW head smaller relative to body than reference1, match reference2 actual skull size and total body height neck torso and limbs. Do not merely resize whole image. Approximately 3.7-4-head-tall impression, no giant head or squat legs. Animation-ready grounded neutral idle, three-quarter toward SCREEN RIGHT, boots aligned on one baseline. Clear shoulders elbows wrists hips knees ankles, arms distinguishable from torso. Same simple flat cel shading and dark outlines. Preserve own character identity, not reference2 white hair. All hair and equipment inside 8% safe padding. Transparent alpha. No scenery shadows effects text or guides.

### 이루려나

EDIT reference1 only; reference2 Irugetne is immutable proportion master. Keep adult mischievous woman brown long hair goggles above brow, anatomical right orange eye, other eye dark, black utility shirt blue tie rolled sleeves cargo trousers, small handheld detonator near waist. Match reference2's head/height/limbs; don't count stray hair antenna as skull height. Relaxed knee bend only. No explosive effects. REDRAW head smaller relative to body than reference1, match reference2 actual skull size and total body height neck torso and limbs. Do not merely resize whole image. Approximately 3.7-4-head-tall impression, no giant head or squat legs. Animation-ready grounded neutral idle, three-quarter toward SCREEN RIGHT, boots aligned on one baseline. Clear shoulders elbows wrists hips knees ankles, arms distinguishable from torso. Same simple flat cel shading and dark outlines. Preserve own character identity, not reference2 white hair. All hair and equipment inside 8% safe padding. Transparent alpha. No scenery shadows effects text or guides.

### 이루겠네

원본 이루겠네 SD 디자인 유지. 크기와 여백만 공통 캔버스에 맞춘 비례 리샘플링.

