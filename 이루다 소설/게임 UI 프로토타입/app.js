const chapters = [
  {
    id: "ch0",
    label: "프롤로그",
    title: "빛을 이루다",
    region: "제4국 국제 타워",
    virtue: "책임",
    filament: "빛과 개념",
    status: "개방",
    x: 29,
    y: 61,
    image: "../이루다 1획 삽화/01_이루리_쓰레기장_각성_삽화.png",
    summary: "쓰레기장에 버려진 전구 머리의 팀장이 깨어난다. 자신의 이름과 과거를 잃은 이루리는 가장 기초적인 빛과 개념의 필라멘트만으로 첫 의뢰와 첫 책임을 마주한다."
  },
  {
    id: "ch1",
    label: "1장",
    title: "헌신을 이루다",
    region: "제5국 가푸라",
    virtue: "헌신",
    filament: "힘",
    status: "진행 가능",
    x: 25,
    y: 44,
    image: "../이루다 2획 삽화/01_이루리_도깨비_국제타워를뒤로_삽화.png",
    summary: "도깨비는 국제 타워를 떠나 초원으로 향한다. 셀타 마르틴의 오래된 소원은 별을 찾는 여정이자, 누군가를 위해 끝까지 움직이는 헌신의 시험이다."
  },
  {
    id: "ch2",
    label: "2장",
    title: "신뢰를 이루다",
    region: "제3국 마카노스",
    virtue: "신뢰",
    filament: "집합",
    status: "잠김",
    x: 48,
    y: 74,
    image: "../이루다 1획 삽화/25_이루어질_치안유지부_도깨비검문_삽화.png",
    summary: "실패자의 낙인이 찍힌 도시와 시련의 탑. 남의 힘으로 오르는 계단과 스스로 디디는 계단 사이에서 팀의 신뢰가 시험받는다."
  },
  {
    id: "ch3",
    label: "3장",
    title: "의지를 이루다",
    region: "제7국 카예트",
    virtue: "의지",
    filament: "규칙",
    status: "미공개",
    x: 50,
    y: 21,
    image: "../이루다 1팀 컨셉 아트/이루다_1팀_문양_패치_컨셉아트.png",
    summary: "안개와 규격화의 도시. 누군가가 정해준 편한 규칙을 벗어나, 자신만의 의지로 걸어가는 장이다."
  }
];

const chapterStages = {
  ch0: {
    progress: "0장 진행률 01 / 04",
    background: "assets/story/backgrounds/stage01_junkyard_wake_bg.png",
    stages: [
      {
        id: "ch0-1",
        number: "0-1",
        title: "쓰레기장에서 깨어난 빛",
        x: 34,
        y: 62,
        background: "assets/story/backgrounds/stage01_junkyard_wake_bg.png"
      },
      {
        id: "ch0-2",
        number: "0-2",
        title: "펜타R 컴퍼니의 회수 작전",
        x: 48,
        y: 48,
        background: "assets/story/backgrounds/stage02_pentar_airship_bg.png"
      },
      {
        id: "ch0-3",
        number: "0-3",
        title: "비행정에 오르는 전구",
        x: 64,
        y: 40,
        background: "../이루다 1획 삽화/03_이루리_펜타R비행선_도착_삽화.png"
      }
    ]
  },
  ch1: {
    progress: "1장 진행률 00 / 02",
    background: "../이루다 2획 삽화/01_이루리_도깨비_국제타워를뒤로_삽화.png",
    stages: [
      { id: "ch1-1", number: "1-1", title: "국제 타워를 뒤로", x: 28, y: 58, background: "../이루다 2획 삽화/01_이루리_도깨비_국제타워를뒤로_삽화.png" },
      { id: "ch1-2", number: "1-2", title: "닫힌 기억의 용병단", x: 52, y: 46, background: "assets/story/backgrounds/ch1_residence.jpg" }
    ]
  },
  ch2: {
    progress: "2장 진행률 00 / 05",
    background: "../이루다 1획 삽화/25_이루어질_치안유지부_도깨비검문_삽화.png",
    stages: [
      { id: "ch2-1", number: "2-1", title: "검문선", x: 42, y: 62, background: "../이루다 1획 삽화/25_이루어질_치안유지부_도깨비검문_삽화.png" }
    ]
  },
  ch3: {
    progress: "3장 진행률 00 / 05",
    background: "assets/backgrounds/00_이루어질_배경.png",
    stages: [
      { id: "ch3-1", number: "3-1", title: "안개 낀 규격", x: 52, y: 42, background: "assets/backgrounds/00_이루어질_배경.png" }
    ]
  }
};

const identities = [
  {
    name: "이루어질",
    identity: "북 마스크",
    role: "support",
    move: 3,
    keywords: ["계약", "예측", "지원"],
    image: "assets/standing/00_이루어질_스탠딩.png",
    background: "assets/backgrounds/00_이루어질_배경.png",
    logo: "assets/logos/00_이루어질_로고_v3.png",
    description: "모든 기록을 계산하려 했던 설계자의 가능성. 전투보다 판을 읽고 아군의 실패를 줄이는 지원형 이격.",
    skills: ["서명된 예측", "기록 검산", "계약 보정", "오류 삭제", "방어 전환"]
  },
  {
    name: "이루어져",
    identity: "비관의 침구",
    role: "support",
    move: 3,
    keywords: ["수면", "회복", "진정"],
    image: "assets/standing/01_이루어져_스탠딩.png",
    background: "assets/backgrounds/01_이루어져_배경.png",
    logo: "assets/logos/01_이루어져_로고_v3.png",
    description: "어려 보이는 아이의 가능성. 아군의 붕괴를 재우고 정신력을 천천히 되돌린다.",
    skills: ["꾸벅꾸벅", "담요 방벽", "비관 눌러재우기", "수면 공명", "방어 전환"]
  },
  {
    name: "이루어라",
    identity: "낡은 연구복",
    role: "control",
    move: 3,
    keywords: ["기계", "중력", "분석"],
    image: "assets/standing/02_이루어라_스탠딩.png",
    background: "assets/backgrounds/02_이루어라_배경.png",
    logo: "assets/logos/02_이루어라_로고_v3.png",
    description: "병약한 연구자의 가능성. 기계 장치와 중력 제어로 전장의 위험물을 움직인다.",
    skills: ["중력 핀", "부품 재배열", "기계어 해석", "중력 붕괴", "회피 전환"]
  },
  {
    name: "이루소서",
    identity: "눌의 잔향",
    role: "front",
    move: 3,
    keywords: ["상처", "충돌취소", "제압"],
    image: "assets/standing/03_이루소서_스탠딩.png",
    background: "assets/backgrounds/03_이루소서_배경.png",
    logo: "assets/logos/03_이루소서_로고_v3.png",
    description: "전쟁의 끝에서 남은 노병의 가능성. 적의 행동을 끊고 전열을 고정하는 단일 제압형 이격.",
    skills: ["눌 엣지", "늙은 병사의 호흡", "참호 돌파", "출혈 공명", "반격 전환"]
  },
  {
    name: "이루리",
    identity: "빛과 개념",
    role: "support",
    move: 0,
    keywords: ["관측", "추출", "필라멘트"],
    image: "assets/standing/04_이루리_스탠딩.png",
    background: "assets/backgrounds/04_이루리_배경.png",
    logo: "assets/logos/04_이루리_로고_v3.png",
    description: "직접 전투에 나서지 않는 팀장. 편성 화면에서는 필라멘트와 이격 파편을 유지하는 관측 슬롯으로 표시된다.",
    skills: ["빛 관측", "추출", "이식", "개념 폭주", "출전 불가"]
  },
  {
    name: "이루어도",
    identity: "브래드 마스크",
    role: "front",
    move: 2,
    keywords: ["초중량", "저지", "파괴"],
    image: "assets/standing/05_이루어도_스탠딩.png",
    background: "assets/backgrounds/05_이루어도_배경.png",
    logo: "assets/logos/05_이루어도_로고_v3.png",
    description: "거대한 힘으로 전선을 멈추는 가능성. 느리지만 적의 돌진과 대형 개념물을 정면에서 받아낸다.",
    skills: ["중량 압박", "궤도 저지", "철벽 자세", "초중량 공명", "방어 전환"]
  },
  {
    name: "이루게나",
    identity: "월정커의 어머니",
    role: "front",
    move: 4,
    keywords: ["상처", "광전", "추격"],
    image: "assets/standing/06_이루게나_스탠딩.png",
    background: "assets/backgrounds/06_이루게나_배경.png",
    logo: "assets/logos/06_이루게나_로고_v3.png",
    description: "가족을 지키기 위해 괴물이 되었던 가능성. 빠르게 파고들어 상처 키워드를 쌓는다.",
    skills: ["도끼 이빨", "피 냄새 추적", "짐승의 보폭", "광전사의 피", "회피 전환"]
  },
  {
    name: "이루도록",
    identity: "백화파 참모",
    role: "control",
    move: 2,
    keywords: ["충격", "대칭", "제어"],
    image: "assets/standing/07_이루도록_스탠딩.png",
    background: "assets/backgrounds/07_이루도록_배경.png",
    logo: "assets/logos/07_이루도록_로고_v3.png",
    description: "모든 구성을 대칭으로 정리하는 참모의 가능성. 적의 이동과 충돌값을 통제한다.",
    skills: ["대칭 배치", "충격 계산", "참모의 지시", "충격 공명", "반격 전환"]
  },
  {
    name: "이루려나",
    identity: "폭심지의 분석가",
    role: "control",
    move: 4,
    keywords: ["분석", "폭발", "약점"],
    image: "assets/standing/08_이루려나_스탠딩.png",
    background: "assets/backgrounds/08_이루려나_배경.png",
    logo: "assets/logos/08_이루려나_로고_v3.png",
    description: "장난기와 테러의 경계에서 탄생한 가능성. 약점을 드러내고 연쇄 폭발로 전장을 흔든다.",
    skills: ["장난 섞인 조준", "약점 낙인", "도화선 연결", "분석 공명", "회피 전환"]
  },
  {
    name: "이루겠네",
    identity: "대성당의 성자",
    role: "support",
    move: 3,
    keywords: ["천신", "정화", "보호"],
    image: "assets/standing/09_이루겠네_스탠딩.png",
    background: "assets/backgrounds/09_이루겠네_배경.png",
    logo: "assets/logos/09_이루겠네_로고_v3.png",
    description: "신앙을 강요받던 아이가 스스로 선택한 구원의 가능성. 보호와 회복, 정화 공명에 특화된다.",
    skills: ["상쾌한 축복", "성흔의 빛", "천신 보호막", "구원 공명", "방어 전환"]
  }
];

const filaments = [
  ["빛과 개념", "책임", "획득", "#f1d789", "rgba(241, 215, 137, .36)"],
  ["힘", "헌신", "진행 중", "#c96e60", "rgba(201, 110, 96, .34)"],
  ["집합", "신뢰", "미획득", "#83c58a", "rgba(131, 197, 138, .3)"],
  ["규칙", "의지", "미획득", "#74a8ff", "rgba(116, 168, 255, .3)"],
  ["시간", "협력", "미획득", "#b8a2ff", "rgba(184, 162, 255, .3)"],
  ["혼돈", "정의", "미획득", "#f08f56", "rgba(240, 143, 86, .3)"],
  ["생성", "희망", "미획득", "#72d1bb", "rgba(114, 209, 187, .3)"],
  ["소멸", "공정", "미획득", "#d66e6e", "rgba(214, 110, 110, .3)"],
  ["지식", "자비", "미획득", "#e0e6ed", "rgba(224, 230, 237, .3)"],
  ["공간", "진실", "미획득", "#9bbcff", "rgba(155, 188, 255, .3)"]
];

const battleDummy = {
  turn: 1,
  phase: "이동/행동 예약",
  selected: "sosuh",
  rotation: 0,
  tilt: 30,
  cameraMode: 'rotate',
  zoom: 1,
  cameraX: 0,
  cameraY: 0,
  aiming: null,
  inspectedUnitId: null,
  infoTab: "status",
  egoInfoTab: "action",
  previewAction: null,
  previewSource: null,
  previewHandIndex: null,
  filament: 0,
  waveIndex: 3,
  decisionSequence: 0,
  enemyPreparedTurn: null,
  log: [
    "전투 더미 개시. 적 선이동 완료.",
    "플레이어 이동 턴. 유닛을 선택하고 이동 또는 행동을 예약하세요."
  ],
  allies: [
    {
      id: "sosuh",
      name: "이루소서",
      identity: "인과 억제 단검수",
      image: "assets/standing/03_이루소서_스탠딩.png",
      logo: "assets/logos/03_이루소서_로고_v3.png",
      x: 2,
      y: 3,
      startX: 2,
      startY: 3,
      hp: 86,
      maxHp: 86,
      sp: 50,
      move: 3,
      moveLeft: 3,
      acted: false,
      reserved: null,
      reservedSource: null,
      targetId: null,
      guard: { name: "참호 반격", type: "반격", keyword: "상처", range: 1, scope: "단일", hits: 1, power: 7, wave: 1, effect: "[피격 시] 반격" },
      skills: [
        { name: "낡은 단검술", type: "참격", keyword: "상처", range: 1, scope: "단일", hits: 2, power: 8, wave: 1, effect: "1~2타 [상처 2 / 1]" },
        { name: "눌 엣지", type: "참격", keyword: "상처", range: 1, scope: "단일", hits: 2, power: 8, wave: 1, effect: "[충돌 시] 기본 위력 +1" },
        { name: "베테랑의 급소", type: "참격", keyword: "상처", range: 1, scope: "단일", hits: 3, power: 11, wave: 1, effect: "3타 위력 +2" },
        { name: "실패자의 낙인", type: "참격", keyword: "상처", range: 1, scope: "단일", hits: 1, power: 13, wave: 2, effect: "[상처 공명]" }
      ],
      ego: { name: "인과 절단", cost: 30, type: "참격", keyword: "상처", range: 1, scope: "단일", hits: 4, power: 26, wave: 2, effect: "4타 [상처 공명]" }
    },
    {
      id: "eodo",
      name: "이루어도",
      identity: "거구 방벽",
      image: "assets/standing/05_이루어도_스탠딩.png",
      logo: "assets/logos/05_이루어도_로고_v3.png",
      x: 1,
      y: 2,
      startX: 1,
      startY: 2,
      hp: 124,
      maxHp: 124,
      sp: 50,
      move: 2,
      moveLeft: 2,
      acted: false,
      reserved: null,
      reservedSource: null,
      targetId: null,
      guard: { name: "거구 방어", type: "방어", keyword: "충격", range: 0, scope: "자신", hits: 0, power: 8, wave: 0, effect: "[보호 10 / 1]" },
      skills: [
        { name: "묵직한 손등", type: "타격", keyword: "충격", range: 1, scope: "단일", hits: 1, power: 8, wave: 1, effect: "[충격 3 / 1]" },
        { name: "길막기", type: "타격", keyword: "충격", range: 1, scope: "단일", hits: 1, power: 7, wave: 1, effect: "자신 [보호 4 / 1]" },
        { name: "거구 압박", type: "타격", keyword: "충격", range: 1, scope: "전방 3칸", hits: 2, power: 8, wave: 1, effect: "[충격 3 / 1]" },
        { name: "무너지는 벽", type: "타격", keyword: "충격", range: 1, scope: "직선 2칸", hits: 1, power: 14, wave: 2, effect: "[충격 공명]" }
      ],
      ego: { name: "종이봉투 아래 산맥", cost: 25, type: "타격", keyword: "충격", range: 1, scope: "자신 중심 십자", hits: 1, power: 15, wave: 2, effect: "[충격 공명], 자신 [보호 12 / 1]" }
    },
    {
      id: "ryeona",
      name: "이루려나",
      identity: "폭발 장난 기술자",
      image: "assets/standing/08_이루려나_스탠딩.png",
      logo: "assets/logos/08_이루려나_로고_v3.png",
      x: 2,
      y: 1,
      startX: 2,
      startY: 1,
      hp: 74,
      maxHp: 74,
      sp: 50,
      move: 4,
      moveLeft: 4,
      acted: false,
      reserved: null,
      reservedSource: null,
      targetId: null,
      guard: { name: "점멸 회피", type: "회피", keyword: "충격", range: 0, scope: "자신", hits: 0, power: 9, wave: 0, effect: "[회피] 다음 피격 피해 감소" },
      skills: [
        { name: "스패너 튕기기", type: "타격", keyword: "충격", range: 2, scope: "단일", hits: 2, power: 8, wave: 1, effect: "[충격 2 / 1]" },
        { name: "깜짝 폭죽", type: "타격", keyword: "충격", range: 3, scope: "십자 1칸", hits: 1, power: 8, wave: 2, effect: "[충격 4 / 1]" },
        { name: "불량품 대폭발", type: "타격", keyword: "충격", range: 3, scope: "마름모 1칸", hits: 3, power: 11, wave: 1, effect: "주변 1칸 절반 피해" },
        { name: "하룬식 기계장난", type: "타격", keyword: "충격", range: 4, scope: "십자 1칸", hits: 1, power: 12, wave: 2, effect: "[충격 공명]" }
      ],
      ego: { name: "주황색 불량품 축제", cost: 30, type: "타격", keyword: "충격", range: 4, scope: "마름모 1칸", hits: 3, power: 20, wave: 2, effect: "3타 [충격 공명]" }
    },
    {
      id: "getne",
      name: "이루겠네",
      identity: "성문양 회복 지원",
      image: "assets/standing/09_이루겠네_스탠딩.png",
      logo: "assets/logos/09_이루겠네_로고_v3.png",
      x: 1,
      y: 4,
      startX: 1,
      startY: 4,
      hp: 78,
      maxHp: 78,
      sp: 50,
      move: 4,
      moveLeft: 4,
      acted: false,
      reserved: null,
      reservedSource: null,
      targetId: null,
      guard: { name: "성문양 방어", type: "방어", keyword: "격려", range: 0, scope: "자신", hits: 0, power: 7, wave: 0, effect: "[보호 8 / 1]" },
      skills: [
        { name: "하얀 손짓", type: "타격", keyword: "격려", range: 3, scope: "단일", hits: 1, power: 5, wave: 1, effect: "정신력 최저 아군 [격려 2 / 1]" },
        { name: "성스러운 문양", type: "타격", keyword: "격려", range: 3, scope: "단일", hits: 1, power: 5, wave: 1, effect: "정신력 최저 아군 [격려 4 / 1]" },
        { name: "히어로처럼!", type: "타격", keyword: "격려", range: 3, scope: "단일", hits: 2, power: 8, wave: 1, effect: "아군 1명 [격려 5 / 1]" },
        { name: "괜찮아요, 제가 할게요", type: "타격", keyword: "격려", range: "전장", scope: "아군 전체", hits: 1, power: 8, wave: 2, effect: "아군 전체 [격려 4 / 1]" }
      ],
      ego: { name: "하얀 성문양의 약속", cost: 25, type: "지원", keyword: "격려", range: "전장", scope: "아군 전체", hits: 0, power: 0, wave: 0, effect: "아군 전체 [격려 6 / 1], [보호 4 / 1]" }
    }
  ],
  enemies: [
    { id: "e1", name: "불안정 개념물", x: 8, y: 2, startX: 8, startY: 2, hp: 96, maxHp: 96, sp: 50, intent: "직선 돌진", keyword: "충격 2 / 1", targetId: "eodo" },
    { id: "e2", name: "연기 파편", x: 8, y: 4, startX: 8, startY: 4, hp: 62, maxHp: 62, sp: 50, intent: "잠식 확산", keyword: "잠식 3 / 1", targetId: "getne" },
    { id: "e3", name: "철근 잔해", x: 8, y: 1, startX: 8, startY: 1, hp: 74, maxHp: 74, sp: 50, intent: "방어", keyword: "보호 5 / 1", targetId: "ryeona" }
  ]
};

const waveTable = [
  { name: "붕괴", value: -3, color: "#d66e6e" },
  { name: "균열", value: -2, color: "#e78b6c" },
  { name: "불안정", value: -1, color: "#d6b26e" },
  { name: "안정", value: 0, color: "#e0e6ed" },
  { name: "상승", value: 1, color: "#83c58a" },
  { name: "증폭", value: 2, color: "#7eafff" },
  { name: "공명", value: 3, color: "#f0d48a" }
];

function makeSkillBag() {
  return [0, 0, 0, 0, 1, 1, 1, 2, 2, 3];
}

function shuffleCards(cards) {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

const battlePassiveInfo = {
  sosuh: { passives: [{ name: "실패자의 감각", effect: "반격 적중 시 정신력 +4" }], supportPassives: [{ name: "인과 억제 엄호", effect: "치명타 피격 시 전투당 1회 피해 -35%" }] },
  eodo: { passives: [{ name: "거대한 침묵", effect: "전열 배치 시 후방 아군 받는 피해 -10%" }], supportPassives: [{ name: "긴급 방패 구출", effect: "후퇴 구역에 도달한 아군 [보호 8 / 1]" }] },
  ryeona: { passives: [{ name: "주황빛 조준경", effect: "이동 후 공격 시 행동 위력 +1" }], supportPassives: [{ name: "원거리 지원 포격", effect: "턴 시작 시 무작위 적 1명 소범위 피해, [충격 2 / 1]" }] },
  getne: { passives: [{ name: "빛나는 성문양", effect: "아군 [격려] 부여 시 정신력 +3" }], supportPassives: [{ name: "성자의 수호 결계", effect: "후퇴 구역 진입 아군 [보호 6 / 1], [격려 4 / 1]" }] }
};

const battleInitialAllies = JSON.parse(JSON.stringify(battleDummy.allies));
const extraBattleProfiles = [
  { id: 'eojil', name: '이루어질', hp: 82, move: 3, keyword: '집중', type: '관통', guard: '회피', range: 4, names: ['결말 예측', '확신의 일격', '계획 수정', '결말 주석'] },
  { id: 'eojyeo', name: '이루어져', hp: 80, move: 2, keyword: '잠식', type: '타격', guard: '방어', range: 3, names: ['꾸벅꾸벅', '비관의 잔향', '수면 유도', '비관의 침수'] },
  { id: 'eora', name: '이루어라', hp: 68, move: 3, keyword: '자원', type: '타격', guard: '회피', range: 3, names: ['중력 핀', '부품 재배열', '가설 검증', '가설 해체식'] },
  { id: 'gena', name: '이루게나', hp: 100, move: 4, keyword: '상처', type: '참격', guard: '반격', range: 1, names: ['도끼 이빨', '피 냄새', '짐승의 보폭', '피 묻은 황무지'] },
  { id: 'dorok', name: '이루도록', hp: 88, move: 2, keyword: '자원', type: '관통', guard: '반격', range: 3, names: ['대칭 배치', '좌표 계산', '참모의 지시', '완전 대칭'] }
];

function createBattleRoster() {
  const units = JSON.parse(JSON.stringify(battleInitialAllies));
  extraBattleProfiles.forEach((profile) => {
    const identity = identities.find((entry) => entry.name === profile.name);
    const selfKeyword = ['집중', '자원'].includes(profile.keyword);
    const skills = profile.names.map((name, index) => ({ name, type: profile.type, keyword: profile.keyword,
      range: profile.range, scope: '단일', hits: [2, 2, 3, 1][index], wave: index === 3 ? 2 : 1,
      power: [8, 9, 11, 14][index], effect: `${selfKeyword ? '자신 ' : ''}[${profile.keyword} ${index + 2} / 1]` }));
    units.push({ id: profile.id, name: profile.name, identity: identity.identity, image: identity.image,
      hp: profile.hp, maxHp: profile.hp, sp: 50, move: profile.move, skills,
      guard: { name: `${profile.name} · ${profile.guard}`, type: profile.guard, keyword: profile.keyword,
        range: profile.guard === '반격' ? profile.range : 0, scope: profile.guard === '반격' ? '단일' : '자신',
        hits: profile.guard === '반격' ? 1 : 0, power: 8, wave: profile.guard === '반격' ? 1 : 0,
        effect: profile.guard === '방어' ? '[보호 8 / 1]' : profile.guard === '반격' ? `[${profile.keyword} 2 / 1]` : '' },
      ego: { ...skills[3], name: `${profile.names[3]} · 개념 폭주`, cost: 25, hits: 3, power: 20, wave: 2 },
      x: 1, y: 1, startX: 1, startY: 1 });
  });
  return identities.filter((entry) => entry.name !== '이루리').map((identity) => configureSequenceUnit(units.find((unit) => unit.name === identity.name)));
}

function configureSequenceUnit(unit) {
  if (unit.skills[0].sequence) return unit;
  // Keep approved hit counts and asset names as motion keys, not destructible combat resources.
  const profiles = {
    eojil: [['펜촉으로 적을 찔러', '자신 [집중 10 / 2]'], ['적의 빈틈을 정확히 관통해', '자신 [집중 15 / 2]'], ['예측한 궤도를 따라 적을 찔러', '자신 [집중 20 / 2]'], ['적에게 결말의 주석을 새겨', '자신 [집중 공명]']],
    eojyeo: [['담요를 휘둘러 적을 내리쳐', '[잠식 3 / 1]'], ['비관의 잔향을 적에게 흘려보내', '[잠식 5 / 1]'], ['적을 졸음으로 짓눌러', '[잠식 6 / 2]'], ['적을 깊은 비관에 잠기게 해', '[잠식 공명]']],
    eora: [['중력 핀을 적에게 발사해', '자신 [자원 3 / 1]'], ['재배열한 부품을 적에게 날려', '자신 [자원 5 / 1]'], ['중력의 방향을 바꾸어 적을 압박해', '자신 [자원 7 / 1]'], ['중력을 해체하며 폭발을 일으켜', '자신 [자원 공명]']],
    sosuh: [['낡은 단검으로 적을 베어', '[상처 3 / 1]'], ['검날을 깊이 밀어 넣어', '[상처 5 / 1]'], ['적의 급소를 정확히 찔러', '[상처 6 / 2]'], ['적에게 새겨진 낙인을 도려내어', '[상처 공명]']],
    eodo: [['묵직한 손등으로 적을 후려쳐', '[충격 3 / 1]'], ['길목을 막으며 적을 몸으로 들이받아', '자신 [보호 6 / 1]'], ['거대한 몸으로 적을 짓눌러', '[충격 5 / 2]'], ['벽을 무너뜨릴 듯한 주먹으로 적을 때려', '[충격 공명]']],
    gena: [['도끼로 적을 힘껏 베어', '[상처 3 / 1]'], ['피 냄새를 따라 적의 상처를 베어', '[상처 5 / 1]'], ['짐승처럼 파고들어 도끼를 휘둘러', '[상처 6 / 2]'], ['황무지에 피를 새기듯 적을 베어', '[상처 공명]']],
    dorok: [['대칭 궤도를 따라 적을 찔러', '자신 [자원 3 / 1]'], ['계산한 좌표를 정확히 찔러', '자신 [자원 5 / 1]'], ['전술 지시에 맞춰 적을 찔러', '자신 [자원 7 / 1]'], ['완벽한 대칭 궤도로 적을 관통해', '자신 [자원 공명]']],
    ryeona: [['스패너를 튕겨 적에게 맞혀', '[충격 3 / 1]'], ['적 주변에서 폭죽을 터뜨려', '[충격 5 / 1]'], ['불량품을 연쇄적으로 폭발시켜', '[충격 6 / 2]'], ['장난스럽게 설치한 기계장치를 폭파해', '[충격 공명]']],
    getne: [['빛나는 손짓으로 적을 밀어붙여', '정신력 최저 아군 [격려 3 / 1]'], ['성문양의 빛을 적에게 쏘아', '정신력 최저 아군 [격려 5 / 1]'], ['히어로처럼 힘껏 적을 때려', '아군 1명 [격려 6 / 1]'], ['모두에게 용기를 전합니다', '아군 전체 [격려 6 / 1]']]
  };
  const followups = {
    eojil: ['펜촉의 궤도를 틀어 다시 찔러', '박힌 펜촉을 거칠게 뽑아'],
    eojyeo: ['담요로 적을 다시 감싸 압박해', '담요에 실린 비관을 한꺼번에 터뜨려'],
    eora: ['중력에 붙잡힌 부품들을 다시 날려', '모아 둔 부품들을 한꺼번에 부딪치게 해'],
    sosuh: ['검날의 방향을 바꾸어 다시 베어', '단검을 비틀어 뽑아'],
    eodo: ['적을 팔로 밀어붙여', '육중한 주먹으로 다시 후려쳐'],
    gena: ['도끼의 궤도를 바꾸어 다시 베어', '도끼를 힘껏 당겨 적을 베어내어'],
    dorok: ['반대편 궤도를 따라 다시 찔러', '계산한 마지막 궤도로 적을 관통해'],
    ryeona: ['남아 있는 장치를 연달아 터뜨려', '마지막 장치로 큰 폭발을 일으켜'],
    getne: ['빛을 모아 적에게 다시 쏘아', '모아 둔 빛을 한꺼번에 터뜨려']
  };
  const descriptions = profiles[unit.id];
  if (!descriptions) return unit;
  const build = (action, index, special = false) => {
    const original = { ...action };
    const [verb, basicEffect] = descriptions[index];
    const effect = special && unit.id === 'getne' ? '아군 전체 [격려 10 / 2], 아군 전체 [보호 4 / 1]' : basicEffect;
    const support = action.scope.includes('아군') || action.type === '지원';
    const resonance = !support && effect.includes('공명');
    const count = Math.max(resonance ? 2 : 1, original.hits || 1);
    const resonanceKeyword = resonance ? effect.match(/\[(\S+) 공명\]/)?.[1] : null;
    const selfResonance = effect.includes('자신');
    const seedEffect = resonance ? `${selfResonance ? '자신 ' : ''}[${resonanceKeyword} ${special ? 10 : resonanceKeyword === '집중' ? 20 : resonanceKeyword === '자원' ? 8 : 6} / ${special ? 3 : 2}]` : '';
    const push = !support && ['eodo', 'eora', 'ryeona'].includes(unit.id) ? (index >= 2 ? 2 : 1) : 0;
    const retreat = !support && ['eojil', 'sosuh'].includes(unit.id) && index === 1 ? 1 : 0;
    action.legacy = original;
    action.power = special ? 40 : [18, 22, 26, 30][index];
    action.wave = special ? 8 : [3, 4, 5, 6][index];
    action.sequence = Array.from({ length: count }, (_, n) => ({
      ratio: support ? 0 : (resonance ? 1 / count : count === 1 ? 1 : n === count - 1 ? .25 : .5 / (count - 1)),
      effect: resonance ? (n === count - 1 ? effect : n === 0 ? seedEffect : `${selfResonance ? '자신 ' : ''}[${resonanceKeyword} 2 / 1]`) : n === 0 ? effect : '',
      effectTiming: resonanceKeyword === '집중' && n === count - 1 ? 'before' : 'after',
      motionHit: Math.min(n + 1, Math.max(1, original.hits || 1)),
      push: n === count - 1 ? push : 0,
      wallRatio: n === count - 1 && push ? .5 : 0,
      retreat: n === count - 1 ? retreat : 0,
      nextMove: n === count - 1 && ['gena', 'dorok'].includes(unit.id) && index === 2 ? 2 : 0
    }));
    action.descriptionBlocks = support ? [`성문양의 빛으로 아군을 감싸며 용기를 전합니다. ${describeSequenceKeywords(effect)}`]
      : action.sequence.map((step, n) => {
        const motion = n === 0 ? verb : followups[unit.id][n === count - 1 ? 1 : 0];
        return `${n ? '이후 ' : ''}${step.effectTiming === 'before' ? `${describeSequenceKeywords(step.effect)} ` : ''}${motion} (위력 ${Number((step.ratio * 100).toFixed(2))}%)의 피해를 입힙니다.${step.effect && step.effectTiming !== 'before' ? ` ${describeSequenceKeywords(step.effect)}` : ''}${step.push ? ` 적을 ${step.push}칸 밀쳐냅니다.` : ''}${step.retreat ? ` 자신은 ${step.retreat}칸 뒤로 물러납니다.` : ''}${step.nextMove ? ` 다음 턴에 추가 이동 수 ${step.nextMove}칸을 얻습니다.` : ''}`;
      });
    if (push) action.descriptionBlocks.push('만약 적이 벽에 부딪히면, 이 행동으로 적에게 입힌 총 직접 피해의 50%만큼 추가 피해를 입힙니다.');
    action.effect = action.descriptionBlocks.join('\n');
    return action;
  };
  unit.skills.forEach((action, i) => build(action, i));
  build(unit.ego, 3, true);
  unit.guard.legacy = { ...unit.guard };
  unit.guard.power = 15;
  unit.guard.wave = 4;
  unit.guard.effect = unit.guard.type === '방어' ? '방어 자세를 유지하며 들어오는 공격의 피해를 판정 위력만큼 줄입니다.' : unit.guard.type === '회피' ? '몸을 피하며 공격을 흘려냅니다. 회피 판정에 성공하면 피해를 받지 않습니다.' : '공격을 받은 뒤 적에게 반격하여 (위력 75%)의 피해를 입힙니다. 한 번 대응하면 반격 자세가 해제됩니다.';
  if (unit.guard.type === '반격') unit.guard.sequence = [{ ratio: .75, effect: '' }];
  return unit;
}

function describeSequenceKeywords(text) {
  return String(text).split(',').map(part => {
    const recipient = part.includes('정신력 최저 아군') ? '정신력이 가장 낮은 아군에게 ' : part.includes('아군 전체') ? '모든 아군에게 ' : part.includes('아군 1명') ? '정신력이 가장 낮은 아군 한 명에게 ' : part.includes('자신') ? '자신에게 ' : '';
    const keywords = part.match(/\[[^\]]+\]/g) || [];
    return keywords.map(keyword => keyword.includes('공명') ? `${part.includes('자신') ? '자신의 ' : ''}${keyword}을 발동합니다.` : `${recipient}${keyword.replaceAll(' / ', ' | ')} 부여합니다.`).join(' ');
  }).join(' ');
}

function updateBattleActionCapacity() {
  const allies = battleDummy.allies.filter((unit) => unit.hp > 0).sort((a, b) => (a.formationOrder || 0) - (b.formationOrder || 0));
  const enemyTotal = battleDummy.enemies.filter((unit) => unit.hp > 0).reduce((sum, unit) => sum + Math.max(1, unit.actionsPerTurn || 1), 0);
  allies.forEach((unit) => { unit.actionCapacity = Math.max(1, unit.actionsPerTurn || 1); });
  const allyTotal = allies.reduce((sum, unit) => sum + unit.actionCapacity, 0);
  for (let bonus = 0; allies.length && bonus < enemyTotal - allyTotal; bonus += 1) allies[bonus % allies.length].actionCapacity += 1;
}

function ensureBattleState() {
  battleDummy.allies.forEach((unit) => {
    const passiveInfo = battlePassiveInfo[unit.id];
    if (!unit.passives) unit.passives = passiveInfo?.passives || [];
    if (!unit.supportPassives) unit.supportPassives = passiveInfo?.supportPassives || [];
    if (!unit.maxHp) unit.maxHp = unit.hp;
    if (unit.sp == null) unit.sp = 50;
    if (unit.moveLeft == null) unit.moveLeft = unit.move;
    if (!Array.isArray(unit.drawPile)) unit.drawPile = shuffleCards(makeSkillBag());
    if (!Array.isArray(unit.discardPile)) unit.discardPile = [];
    if (!Array.isArray(unit.hand)) drawBattleHand(unit);
  });
  battleDummy.enemies.forEach((unit) => {
    if (!unit.maxHp) unit.maxHp = unit.hp;
    if (unit.sp == null) unit.sp = 50;
    if (unit.move == null) unit.move = unit.id === "e3" ? 1 : 3;
  });
  [...battleDummy.allies, ...battleDummy.enemies].forEach((unit) => {
    if (!Array.isArray(unit.buffs)) unit.buffs = [];
    if (!Array.isArray(unit.debuffs)) unit.debuffs = [];
  });
  prepareEnemyActions();
  if (battleDummy.capacityTurn !== battleDummy.turn) {
    updateBattleActionCapacity();
    battleDummy.capacityTurn = battleDummy.turn;
  }
}

function resetBattleDummy() {
  lastBattleExecution = null;
  battleDummy.lineupReady = false;
  battleDummy.lineupOrder = [];
  battleDummy.bench = [];
  battleDummy.swapPickerId = null;
  battleDummy.selectedActionSlot = null;
  battleDummy.focusedPlanId = null;
  battleDummy.capacityTurn = null;
  battleDummy.turn = 1;
  battleDummy.phase = "이동/행동 예약";
  battleDummy.selected = "sosuh";
  battleDummy.focusedActionUnitId = "sosuh";
  battleDummy.rotation = 0;
  battleDummy.tilt = 30;
  battleDummy.cameraMode = 'rotate';
  battleDummy.zoom = 1;
  battleDummy.cameraX = 0;
  battleDummy.cameraY = 0;
  battleDummy.aiming = null;
  battleDummy.inspectedUnitId = null;
  battleDummy.lastUnitClick = null;
  battleDummy.suppressedPreview = null;
  battleDummy.previewAction = null;
  battleDummy.previewSource = null;
  battleDummy.previewHandIndex = null;
  battleDummy.filament = 0;
  battleDummy.waveIndex = 3;
  battleDummy.decisionSequence = 0;
  battleDummy.enemyPreparedTurn = null;
  battleDummy.log = [
    "전투 더미 개시. 적 선이동 완료.",
    "플레이어 이동 턴. 유닛을 선택하고 이동 또는 행동을 예약하세요."
  ];
  battleDummy.allies.forEach((unit) => {
    configureSequenceUnit(unit);
    unit.x = unit.startX;
    unit.y = unit.startY;
    unit.hp = unit.maxHp;
    unit.sp = 50;
    unit.moveLeft = unit.move;
    unit.nextMoveBonus = 0;
    unit.movedThisTurn = false;
    unit.acted = false;
    unit.reserved = null;
    unit.queuedActions = [];
    unit.swapTargetId = null;
    unit.actionCapacity = 1;
    unit.consumedHandIndexes = [];
    unit.reservedSource = null;
    unit.reservedHandIndex = null;
    unit.targetId = null;
    unit.decisionOrder = 0;
    unit.buffs = [];
    unit.debuffs = [];
    unit.actionCanceled = false;
    unit.guardReady = false;
    unit.drawPile = shuffleCards(makeSkillBag());
    unit.discardPile = [];
    unit.hand = [];
    unit.bagNumber = 1;
    drawBattleHand(unit);
  });
  battleDummy.enemies.forEach((unit) => {
    unit.x = unit.startX;
    unit.y = unit.startY;
    unit.hp = unit.maxHp;
    unit.sp = 50;
    unit.buffs = [];
    unit.debuffs = [];
    unit.actionCanceled = false;
    unit.guardReady = false;
    unit.targetId = unit.id === "e1" ? "eodo" : unit.id === "e2" ? "getne" : "ryeona";
  });
  prepareEnemyActions();
  updateBattleActionCapacity();
  battleDummy.capacityTurn = battleDummy.turn;
}

function drawBattleHand(unit) {
  if (!Array.isArray(unit.hand)) unit.hand = [];
  while (unit.hand.length < 4) {
    if (!unit.drawPile.length) {
      unit.drawPile = shuffleCards(makeSkillBag());
      unit.discardPile = [];
      unit.bagNumber = (unit.bagNumber || 1) + 1;
    }
    const next = unit.drawPile.shift();
    if (next == null) break;
    unit.hand.push(next);
  }
}

function prepareEnemyActions() {
  if (battleDummy.enemyPreparedTurn === battleDummy.turn) return;
  const occupied = () => [...battleDummy.allies, ...battleDummy.enemies].filter((unit) => unit.hp > 0);
  battleDummy.enemies.filter((unit) => unit.hp > 0).forEach((enemy) => {
    const action = getEnemyAction(enemy);
    const target = battleDummy.allies.filter((unit) => unit.hp > 0)
      .sort((a, b) => Math.abs(enemy.x - a.x) + Math.abs(enemy.y - a.y) - Math.abs(enemy.x - b.x) - Math.abs(enemy.y - b.y) || a.id.localeCompare(b.id))[0];
    enemy.moveLeft = enemy.move ?? (enemy.id === "e3" ? 1 : 3);
    enemy.targetId = action.scope === "자신" ? enemy.id : target?.id || null;
    for (let step = 0; battleDummy.turn > 1 && target && action.scope !== "자신" && step < enemy.moveLeft; step += 1) {
      if (isBattleTargetInRange(enemy, action, target)) break;
      const candidates = [[enemy.x - 1, enemy.y], [enemy.x, enemy.y - 1], [enemy.x, enemy.y + 1], [enemy.x + 1, enemy.y]]
        .filter(([x, y]) => x >= 1 && x <= 8 && y >= 1 && y <= 5 && !occupied().some((other) => other.id !== enemy.id && other.x === x && other.y === y))
        .sort(([ax, ay], [bx, by]) => Math.abs(ax - target.x) + Math.abs(ay - target.y) - Math.abs(bx - target.x) - Math.abs(by - target.y));
      const next = candidates[0];
      if (!next || Math.abs(next[0] - target.x) + Math.abs(next[1] - target.y) >= Math.abs(enemy.x - target.x) + Math.abs(enemy.y - target.y)) break;
      [enemy.x, enemy.y] = next;
    }
    enemy.decisionOrder = ++battleDummy.decisionSequence;
    enemy.preparedAction = action;
  });
  battleDummy.enemyPreparedTurn = battleDummy.turn;
}

const prologueScenes = window.prologueScenes || [];
const stageStories = {
  "ch0-1": prologueScenes,
  "ch0-2": window.stage2Scenes || [],
  "ch0-3": window.stage3Scenes || [],
  "ch1-1": window.chapter1Stage1Scenes || [],
  "ch1-2": window.chapter1Stage2Scenes || []
};

const vnStandingBySpeaker = {
  "나": "assets/standing/04_이루리_초반_스탠딩.png",
  "누님?": "assets/story/standing/월정커_누님_스탠딩.png",
  "아우?": "assets/story/standing/월정커_아우_스탠딩.png",
  "이루어질?": "assets/standing/00_이루어질_스탠딩.png"
};

function getSceneCharacterEntries(scene) {
  if (Array.isArray(scene.characters)) {
    return scene.characters;
  }

  const entries = [];
  const speakerImage = vnStandingBySpeaker[scene.name];
  if (speakerImage) {
    entries.push({ src: speakerImage, alt: scene.name, side: "center", active: true });
  }

  const line = scene.line || "";
  if (scene.name === "???" && (line.includes("여자의 목소리") || line.includes("남자의 목소리"))) {
    entries.push({
      src: "assets/story/standing/월정커_누님_스탠딩.png",
      alt: "???",
      side: "left",
      active: line.includes("여자의 목소리")
    });
    entries.push({
      src: "assets/story/standing/월정커_아우_스탠딩.png",
      alt: "???",
      side: "right",
      active: line.includes("남자의 목소리")
    });
  }
  const isConfrontation = line.includes("서로에 대한 욕")
    || line.includes("월정커들이 밀리더니")
    || line.includes("아우가 울부짖으며 덤벼들")
    || line.includes("하체가 비잖냐")
    || line.includes("방망이를 휘둘러")
    || line.includes("방망이에 머리가")
    || line.includes("교전을 시작")
    || line.includes("하자드를 향해 도약")
    || line.includes("월정커들이")
    || line.includes("공방이 오고가더니")
    || scene.name === "누님?"
    || scene.name === "아우?";

  if (isConfrontation) {
    entries.forEach((entry) => {
      if (entry.src === "assets/story/standing/월정커_누님_스탠딩.png") entry.side = "left";
      if (entry.src === "assets/story/standing/월정커_아우_스탠딩.png") entry.side = "right";
    });
    const known = new Set(entries.map((entry) => entry.src));
    const confrontationEntries = [
      { src: "assets/story/standing/월정커_누님_스탠딩.png", alt: "누님?", side: "left", active: false },
      { src: "assets/story/standing/월정커_아우_스탠딩.png", alt: "아우?", side: "right", active: false }
    ];
    confrontationEntries.forEach((entry) => {
      if (!known.has(entry.src)) entries.push(entry);
    });
  }

  return entries;
}

function getSpeakerLabel(scene) {
  if (scene.kind) return `${scene.affiliation || "???"} - ${scene.name || "???"}`;
  if (scene.name === "나") return "";

  let affiliation = scene.affiliation || "???";
  if (activeStageId === "ch0-2") {
    const revealedAffiliations = {
      "시가렛?": "펜타R 컴퍼니",
      "하자드?": "펜타R 컴퍼니",
      "이루어질?": "이루다",
      "누님?": "월정커?",
      "아우?": "월정커?"
    };
    affiliation = revealedAffiliations[scene.name] || affiliation;
  }

  return `${affiliation} - ${scene.name}`;
}

function getStandingPlacements(entries) {
  const layout = window.vnStandingLayout || {};
  // Iruri is the fixed presentation reference; the cast never changes camera scale.
  const referenceCm = 180;
  const referenceHeight = 110;
  const feetBaseline = 140;
  return entries.map(entry => {
    const profile = layout[entry.src] || {heightCm:180,visibleFraction:1,bottomPadding:0};
    const canvasHeight = referenceHeight * (profile.heightCm / referenceCm) / profile.visibleFraction;
    const heightOffset = entry.alt === '이루어져' ? 7 : 0;
    return {...entry,heightCm:profile.heightCm,canvasHeight,bottom:100 - feetBaseline - canvasHeight * profile.bottomPadding + heightOffset};
  });
}

const viewTitles = {
  home: "메인 화면",
  story: "도깨비",
  identity: "이격 선택",
  filament: "필라멘트",
  squad: "편성 확인",
  archive: "기록실",
  extract: "상 추출",
  shop: "상점"
};

const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");
let prologueSceneIndex = 0;
let activeChapterId = chapters[0].id;
let activeStageId = chapterStages.ch0.stages[0].id;
let autoAdvance = false;
let autoTimer = null;
let typeTimer = null;
let typedText = "";
let isTyping = false;

navItems.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.view;
    navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === target));
    views.forEach((view) => view.classList.toggle("active", view.id === `${target}-view`));
    if (target !== "story") document.body.classList.remove("story-focus");
  });
});

function renderChapters() {
  document.querySelectorAll("[data-dokkaebi-mode]").forEach((button) => {
    button.addEventListener("click", () => selectDokkaebiMode(button.dataset.dokkaebiMode));
  });
  document.querySelector("[data-story-back='hub']").addEventListener("click", showDokkaebiHub);
  renderFederationNodes();
  showDokkaebiHub();
}

function renderFederationNodes() {
  const nodes = document.querySelector("#chapter-nodes");
  const rail = document.querySelector("#node-rail");
  const routeLayer = document.querySelector('#map-board .route-lines');
  routeLayer.outerHTML = renderStoryRoutes(chapters);
  nodes.innerHTML = chapters.map((chapter, index) => `
    <button class="map-node ${index === 0 ? "active" : ""} ${chapter.status === "잠김" || chapter.status === "미공개" ? "locked" : ""}"
      type="button"
      data-chapter="${chapter.id}"
      style="--x:${chapter.x}%;--y:${chapter.y}%">
      <span class="node-core" aria-hidden="true"></span>
      <span class="node-pop">
        <strong>${chapter.label} ${chapter.title}</strong>
        <small>${chapter.region} · ${chapter.status}</small>
      </span>
    </button>
  `).join("");

  rail.innerHTML = chapters.map((chapter, index) => `
    <button class="rail-node ${index === 0 ? "active" : ""}" type="button" data-chapter="${chapter.id}">
      <span>${chapter.label}</span>
      <strong>${chapter.title}</strong>
      <small>${chapter.region}</small>
    </button>
  `).join("");

  document.querySelectorAll(".map-node, .rail-node").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      showChapterMap(button.dataset.chapter);
    });
  });

  document.querySelectorAll(".map-node").forEach((button) => {
    button.addEventListener("mouseenter", () => moveMarker("#map-board", chapters.find((item) => item.id === button.dataset.chapter)));
    button.addEventListener("focus", () => moveMarker("#map-board", chapters.find((item) => item.id === button.dataset.chapter)));
    button.addEventListener("mouseleave", () => moveMarker("#map-board", chapters.find((item) => item.id === activeChapterId)));
    button.addEventListener("blur", () => moveMarker("#map-board", chapters.find((item) => item.id === activeChapterId)));
  });

  document.querySelectorAll(".rail-node").forEach((button) => {
    button.addEventListener("mouseenter", () => moveMarker("#map-board", chapters.find((item) => item.id === button.dataset.chapter)));
    button.addEventListener("focus", () => moveMarker("#map-board", chapters.find((item) => item.id === button.dataset.chapter)));
    button.addEventListener("mouseleave", () => moveMarker("#map-board", chapters.find((item) => item.id === activeChapterId)));
    button.addEventListener("blur", () => moveMarker("#map-board", chapters.find((item) => item.id === activeChapterId)));
  });

  moveMarker("#map-board", chapters.find((item) => item.id === activeChapterId));
}

function renderStoryRoutes(points) {
  const paths = points.slice(1).map((point,index) => {
    const previous = points[index];
    const middleY = (previous.y + point.y) / 2;
    const locked = ['잠김','미공개'].includes(point.status);
    return `<path class="${locked ? 'route-locked' : 'route-open'}" data-route-from="${previous.id}" data-route-to="${point.id}" d="M ${previous.x} ${previous.y} C ${previous.x} ${middleY}, ${point.x} ${middleY}, ${point.x} ${point.y}" />`;
  }).join('');
  return `<svg class="route-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>`;
}

function moveMarker(selector, point) {
  const board = document.querySelector(selector);
  if (!board || !point) return;
  board.style.setProperty("--marker-x", `${point.x}%`);
  board.style.setProperty("--marker-y", `${point.y}%`);
}

function showChapterMap(id) {
  const chapter = chapters.find((item) => item.id === id);
  const chapterData = chapterStages[id] || chapterStages.ch0;
  activeChapterId = id;
  activeStageId = chapterData.stages[0].id;
  document.querySelectorAll(".map-node, .rail-node").forEach((card) => {
    card.classList.toggle("active", card.dataset.chapter === id);
  });
  moveMarker("#map-board", chapter);
  document.querySelector("#federation-map").classList.remove("active");
  const stage = document.querySelector("#node-stage");
  stage.classList.add("active");
  const firstStage = chapterData.stages[0];
  stage.innerHTML = `
    <section class="chapter-stage-map" id="chapter-stage-map" style="--stage-bg:url('${chapterData.background}')">
      <button class="story-back-button" type="button" id="chapter-back">전으로</button>
      <div class="chapter-progress">${chapterData.progress}</div>
      ${renderStoryRoutes(chapterData.stages)}
      <span class="dokkaebi-marker stage-marker" aria-hidden="true">
        <img src="assets/logos/도깨비_로고.svg" alt="">
      </span>
      <div class="stage-node-layer">
        ${chapterData.stages.map((item, index) => `
          <button class="stage-node ${index === 0 ? "active" : ""}" type="button" data-stage="${item.id}" style="--x:${item.x}%;--y:${item.y}%">
            <span class="node-core" aria-hidden="true"></span>
          </button>
        `).join("")}
      </div>
      <aside class="stage-card" id="stage-card">
        <span>${firstStage.number}</span>
        <strong>${firstStage.title}</strong>
        <button class="primary-button" type="button" id="stage-enter">입장</button>
      </aside>
    </section>
  `;

  document.querySelector("#chapter-back").addEventListener("click", showFederationMap);
  document.querySelectorAll(".stage-node").forEach((button) => {
    const activate = () => selectStage(button.dataset.stage);
    button.addEventListener("click", activate);
    button.addEventListener("mouseenter", activate);
    button.addEventListener("focus", activate);
  });
  document.querySelector("#stage-enter").addEventListener("click", enterStage);
  selectStage(activeStageId);
}

function selectStage(id) {
  const chapterData = chapterStages[activeChapterId] || chapterStages.ch0;
  const stage = chapterData.stages.find((item) => item.id === id) || chapterData.stages[0];
  activeStageId = stage.id;
  document.querySelectorAll(".stage-node").forEach((button) => {
    button.classList.toggle("active", button.dataset.stage === id);
  });
  moveMarker("#chapter-stage-map", stage);
  const card = document.querySelector("#stage-card");
  if (!card) return;
  card.innerHTML = `
    <span>${stage.number}</span>
    <strong>${stage.title}</strong>
    <button class="primary-button" type="button" id="stage-enter">입장</button>
  `;
  document.querySelector("#stage-enter").addEventListener("click", enterStage);
}

function enterStage() {
  prologueSceneIndex = 0;
  typedText = "";
  isTyping = false;
  const stageShell = document.querySelector("#node-stage");
  stageShell.classList.add("active");
  document.querySelector("#federation-map").classList.remove("active");
  if (!getActiveStoryScenes().length) {
    stageShell.innerHTML = `<section class="mode-placeholder"><button class="story-back-button" type="button" id="unwritten-stage-back">전으로</button><h3>준비 중</h3></section>`;
    const unwrittenStageId = activeStageId;
    document.querySelector('#unwritten-stage-back').addEventListener('click', () => { showChapterMap(activeChapterId); selectStage(unwrittenStageId); });
    return;
  }
  stageShell.innerHTML = `
    <section class="story-player fullscreen" id="prologue-player" aria-live="polite"></section>
  `;
  renderPrologueScene();
}

function getActiveStoryScenes() {
  return stageStories[activeStageId] && stageStories[activeStageId].length
    ? stageStories[activeStageId]
    : [];
}

function selectDokkaebiMode(mode) {
  if (mode === "story") {
    showFederationMap();
    return;
  }

  if (mode === "battle") {
    resetBattleDummy();
    showBattleDummy();
    return;
  }

  document.body.classList.add("story-focus");
  document.querySelector("#dokkaebi-hub").classList.add("hidden");
  document.querySelector("#federation-map").classList.remove("active");
  const stage = document.querySelector("#node-stage");
  stage.classList.add("active");
  const modeText = mode === "event"
    ? ["이벤트", "기간 한정 의뢰와 회상 구간은 이곳에서 개방될 예정이다."]
    : ["시련의 탑", "3장 이후 집합의 필라멘트로 개방되는 반복 전투 컨텐츠다."];
  stage.innerHTML = `
    <section class="mode-placeholder">
      <button class="story-back-button" type="button" id="mode-back">전으로</button>
      <div>
        <p class="eyebrow">Dokkaebi ${mode.toUpperCase()}</p>
        <h3>${modeText[0]}</h3>
        <p>${modeText[1]}</p>
      </div>
    </section>
  `;
  document.querySelector("#mode-back").addEventListener("click", showDokkaebiHub);
}

function showFederationMap() {
  document.body.classList.add("story-focus");
  document.querySelector("#dokkaebi-hub").classList.add("hidden");
  document.querySelector("#federation-map").classList.add("active");
  const stage = document.querySelector("#node-stage");
  stage.classList.remove("active");
  stage.innerHTML = "";
  renderFederationNodes();
}

function showDokkaebiHub() {
  document.body.classList.remove("story-focus");
  document.querySelector("#dokkaebi-hub").classList.remove("hidden");
  document.querySelector("#federation-map").classList.remove("active");
  const stage = document.querySelector("#node-stage");
  stage.classList.remove("active");
  stage.innerHTML = "";
  clearTimeout(autoTimer);
  clearTimeout(typeTimer);
}

function showBattleDummy() {
  document.body.classList.add("story-focus");
  document.querySelector("#dokkaebi-hub").classList.add("hidden");
  document.querySelector("#federation-map").classList.remove("active");
  const stage = document.querySelector("#node-stage");
  stage.classList.add("active");
  if (!battleDummy.lineupReady) { renderBattleLineup(); return; }
  ensureBattleState();
  renderBattleDummy();
}

function renderBattleLineup() {
  const allUnits = createBattleRoster();
  const roster = allUnits.filter(unit => !battleTutorial || unit.id !== 'eodo');
  const order = (battleDummy.lineupOrder || []).filter(id => roster.some(unit => unit.id === id));
  battleDummy.lineupOrder = order;
  const slots = (start, end) => Array.from({ length: end - start }, (_, index) => {
    const rank = start + index;
    const unit = roster.find((entry) => entry.id === order[rank]);
    return `<button type="button" data-lineup-remove="${rank}" ${unit ? '' : 'disabled'}><b>${rank + 1}</b>${unit ? `<img src="${unit.image}" alt=""><span>${unit.name}</span>` : '<span>—</span>'}</button>`;
  }).join('');
  document.querySelector('#node-stage').innerHTML = `<section class="battle-lineup">
    <header><button type="button" id="lineup-back">전으로</button><h2>출전 순서</h2><button type="button" id="lineup-reset">초기화</button></header>
    <div class="squad-layout battle-formation-layout">
      <aside class="formation-presets lineup-orders" aria-label="출전 및 대기 순서"><h3>출전 <small>4명</small></h3><div class="lineup-slots">${slots(0,4)}</div><h3>대기 <small>${roster.length-4}명</small></h3><div class="lineup-slots bench-slots">${slots(4,roster.length)}</div></aside>
      <div class="squad-slots lineup-roster">${identities.map(item => {
        const unit = allUnits.find(entry => entry.name === item.name);
        const available = unit && roster.some(entry => entry.id === unit.id);
        const chosen = available && order.includes(unit.id);
        return `<button type="button" data-lineup-unit="${unit?.id || 'iruri'}" style="--slot-bg:url('${item.background}')" class="slot-card ${chosen ? 'chosen' : ''} ${available ? '' : 'unavailable'}" ${available ? '' : 'disabled aria-disabled="true"'} aria-label="${item.name}${available ? '' : ' · 출전 불가'}">${renderFormationArtwork(item)}${chosen ? `<span class="lineup-rank">${order.indexOf(unit.id)+1}</span>` : ''}${available ? '' : `<span class="lineup-state">${unit ? '출전 불가' : '지휘 전용'}</span>`}</button>`;
      }).join('')}</div>
    </div>
    <footer><span>${order.length} / ${roster.length}</span><button type="button" class="primary-button" id="lineup-enter" ${order.length === roster.length ? '' : 'disabled'}>입장</button></footer>
  </section>`;
  document.querySelector('#lineup-back').addEventListener('click', () => battleTutorial ? finishMindBattleTutorial(false) : showDokkaebiHub());
  document.querySelector('#lineup-reset').addEventListener('click', () => { battleDummy.lineupOrder = []; renderBattleLineup(); });
  document.querySelectorAll('[data-lineup-unit]').forEach((button) => button.addEventListener('click', () => {
    if (button.disabled) return;
    const id = button.dataset.lineupUnit, index = order.indexOf(id);
    if (index >= 0) order.splice(index,1); else if (order.length < roster.length) order.push(id);
    battleDummy.lineupOrder = order; renderBattleLineup();
  }));
  document.querySelectorAll('[data-lineup-remove]').forEach((button) => button.addEventListener('click', () => {
    order.splice(Number(button.dataset.lineupRemove),1); renderBattleLineup();
  }));
  document.querySelector('#lineup-enter').addEventListener('click', () => startBattleLineup(order));
  renderBattleTutorial();
}

function startBattleLineup(order) {
  const roster = createBattleRoster().filter(unit => !battleTutorial || unit.id !== 'eodo');
  if (order.length !== roster.length || new Set(order).size !== roster.length || order.some((id) => !roster.some((unit) => unit.id === id))) return false;
  const units = order.map((id,index) => ({ ...roster.find((unit) => unit.id === id), formationOrder: index + 1 }));
  battleDummy.allies = units.slice(0,4);
  const positions = [[2,3],[1,2],[2,1],[1,4]];
  battleDummy.allies.forEach((unit,index) => { [unit.startX,unit.startY] = positions[index]; });
  resetBattleDummy();
  battleDummy.bench = units.slice(4);
  battleDummy.bench.forEach((unit) => {
    unit.x = null; unit.y = null; unit.queuedActions = []; unit.buffs = []; unit.debuffs = [];
    unit.drawPile = shuffleCards(makeSkillBag()); unit.discardPile = []; unit.hand = []; drawBattleHand(unit);
  });
  battleDummy.lineupOrder = [...order]; battleDummy.lineupReady = true;
  battleDummy.selected = units[0].id; battleDummy.focusedActionUnitId = units[0].id;
  battleDummy.selectedActionSlot = null;
  showBattleDummy();
  return true;
}

function renderBattleDummy() {
  ensureBattleState();
  const stage = document.querySelector("#node-stage");
  const selected = getSelectedBattleUnit();
  const selectedAction = getBattleRangeAction(selected);
  const comparison = getBattleActionComparison();
  stage.innerHTML = `
    <section class="battle-dummy ${comparison.right ? 'has-right-action' : ''}" id="battle-dummy">
      <button class="story-back-button" type="button" id="battle-back">전으로</button>
      <header class="battle-topbar">
        <div>
          <p class="eyebrow">${battleTutorial ? '심상 세계 · 전투 튜토리얼' : 'Dummy Battle Stage'}</p>
          <h3>${battleTutorial ? '의뢰인의 무의식 / 상상 속 용병단' : '제4국 국제 타워 쓰레기장 / 개념물 접근 테스트'}</h3>
        </div>
        <div class="battle-meters">
          <span>턴 ${battleDummy.turn}</span>
          <span>${battleDummy.phase}</span>
          <span>필라멘트 ${battleDummy.filament} / 100</span>
          <span>${selected.name} 이동 ${selected.moveLeft} / ${selected.move}</span>
          <span>행동 ${(selected.queuedActions || []).length} / ${selected.actionCapacity || 1}</span>
        </div>
      </header>
      <div class="battle-layout">
        <main class="battle-field-wrap">
          <nav class="battle-camera-tools" aria-label="카메라 조작">
            <div role="group" aria-label="드래그 모드">
              <button type="button" data-camera-mode="move" aria-pressed="${battleDummy.cameraMode === 'move'}" title="카메라 이동"><img src="assets/icons/camera-move.svg" alt="">이동</button>
              <button type="button" data-camera-mode="rotate" aria-pressed="${battleDummy.cameraMode !== 'move'}" title="카메라 회전"><img src="assets/icons/camera-rotate.svg" alt="">회전</button>
            </div>
            <button type="button" id="battle-camera-reset" aria-label="카메라 초기화" title="카메라 초기화"><img src="assets/icons/camera-reset.svg" alt=""></button>
          </nav>
          <div class="battle-field" id="battle-field" data-camera-mode="${battleDummy.cameraMode || 'rotate'}" style="--battle-rot:${battleDummy.rotation}deg;--battle-tilt:${90 - (battleDummy.tilt ?? 30)}deg;--counter-rot:${-battleDummy.rotation}deg;--battle-zoom:1;">
            <div class="battle-camera" id="battle-camera">
            <div class="battle-board-3d" id="battle-board-3d">
              ${renderBattleCells(selectedAction)}
            </div>
            <div class="battle-unit-layer" id="battle-unit-layer">${battleDummy.allies.filter(unit => unit.hp > 0).map(unit => renderBattleToken(unit, 'ally')).join('')}${battleDummy.enemies.filter(unit => unit.hp > 0).map(unit => renderBattleToken(unit, 'enemy')).join('')}</div>
            <div class="battle-arrow-overlay" id="battle-arrow-overlay">${renderBattleBoardArrows()}</div>
            </div>
          </div>
        </main>
      </div>
      ${renderBattleActionPanel(comparison.left, 'left', !!comparison.clash)}
      ${renderBattleActionPanel(comparison.right, 'right', !!comparison.clash)}
      ${comparison.clash ? renderClashForecast(comparison.left, comparison.right) : ''}
      <button class="battle-menu-button" type="button" id="battle-menu-button" aria-label="전투 메뉴">☰</button>
      <aside class="battle-menu-panel" id="battle-menu-panel" hidden><button type="button" id="battle-log-open">로그</button></aside>
      <aside class="vn-log-modal" id="battle-log-modal" aria-hidden="true">
        <div class="vn-log-window"><button class="vn-log-close" type="button" id="battle-log-close" aria-label="로그 닫기">×</button><h3>전투 로그</h3><div class="log-list">${battleDummy.log.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div></div>
      </aside>
      <div class="cursor-aim-line" id="cursor-aim-line"></div>
      <nav class="battle-action-queue" aria-label="예약 행동">${(selected.queuedActions || []).map((entry,index) => `<button type="button" data-queued-action="${index}">${index+1} · ${escapeHtml(entry.action.name)}</button>`).join('')}</nav>
      <section class="battle-card-fan" aria-label="${selected.name} 손패">
        ${renderBattleSwapCard(selected)}
        ${renderGuardCard(selected)}
        ${renderBattleHand(selected)}
        ${renderEgoCard(selected)}
      </section>
      <button class="primary-button battle-resolve floating-resolve" type="button" id="battle-resolve">진행</button>
      ${renderBattleUnitInfo()}
      ${renderBattleSwapPicker()}
    </section>
  `;

  document.querySelector("#battle-dummy").addEventListener("contextmenu", (event) => {
    event.preventDefault();
    cancelBattleSelection();
  });
  document.querySelector("#battle-back").addEventListener("click", () => battleTutorial ? finishMindBattleTutorial(false) : showDokkaebiHub());
  document.querySelector('#battle-menu-button').addEventListener('click', () => {
    const panel = document.querySelector('#battle-menu-panel'); panel.hidden = !panel.hidden;
  });
  document.querySelector('#battle-log-open').addEventListener('click', () => {
    document.querySelector('#battle-menu-panel').hidden = true;
    const modal = document.querySelector('#battle-log-modal'); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    const list = modal.querySelector('.log-list'); list.scrollTop = list.scrollHeight;
  });
  const closeBattleLog = () => { const modal = document.querySelector('#battle-log-modal'); modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); };
  document.querySelector('#battle-log-close').addEventListener('click', closeBattleLog);
  document.querySelector('#battle-log-modal').addEventListener('click', (event) => { if (event.target.id === 'battle-log-modal') closeBattleLog(); });
  bindBattleBoardControls();
  bindCardAimPreview();
  bindBattleActionSlots();
  document.querySelectorAll("[data-battle-unit], [data-battle-target]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const id = button.dataset.battleUnit || button.dataset.battleTarget;
      const now = Date.now();
      const previousClick = battleDummy.lastUnitClick;
      const doubleClick = event.detail > 1 || (previousClick?.id === id && now - previousClick.time < 350);
      battleDummy.lastUnitClick = doubleClick ? null : { id, time: now };
      if (doubleClick) {
        battleDummy.inspectedUnitId = id;
        battleDummy.infoTab = "status";
        renderBattleDummy();
        return;
      }
      if (battleDummy.aiming) {
        assignBattleTarget(id);
        return;
      }
      battleDummy.focusedActionUnitId = id;
      battleDummy.focusedPlanId = null;
      battleDummy.selectedActionSlot = null;
      cancelPendingBattleAction();
      if (button.dataset.battleUnit) battleDummy.selected = id;
      battleDummy.aiming = null;
      battleDummy.previewAction = null;
      battleDummy.previewSource = null;
      battleDummy.previewHandIndex = null;
      renderBattleDummy();
    });
    button.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      battleDummy.inspectedUnitId = button.dataset.battleUnit || button.dataset.battleTarget;
      battleDummy.infoTab = "status";
      renderBattleDummy();
    });
  });
  document.querySelectorAll("[data-move-x]").forEach((cell) => {
    cell.addEventListener("click", (event) => {
      event.stopPropagation();
      moveBattleUnitTo(Number(cell.dataset.moveX), Number(cell.dataset.moveY));
    });
  });
  document.querySelectorAll("[data-skill-index]").forEach((button) => {
    button.addEventListener("pointerenter", () => previewBattleSkill(button.dataset.skillIndex));
    button.addEventListener("pointerleave", () => {
      if (battleDummy.suppressedPreview?.index === button.dataset.skillIndex) battleDummy.suppressedPreview = null;
    });
    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      reserveBattleSkill(button.dataset.skillIndex, event);
    });
  });
  document.querySelector("#battle-resolve").addEventListener("click", resolveBattleTurn);
  bindBattleUnitInfo();
  bindBattleSwapPicker();
  document.querySelectorAll('[data-queued-action]').forEach((button) => button.addEventListener('click', () => {
    battleDummy.focusedActionUnitId = selected.id;
    battleDummy.focusedPlanId = `${selected.id}:${button.dataset.queuedAction}`;
    battleDummy.previewAction = null; renderBattleDummy();
  }));
  updateBattleArrowPositions();
  requestAnimationFrame(updateBattleArrowPositions);
  renderBattleTutorial();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function renderBattleUnitInfo() {
  const unit = [...battleDummy.allies, ...battleDummy.enemies].find((entry) => entry.id === battleDummy.inspectedUnitId);
  if (!unit) return "";
  const isAlly = battleDummy.allies.includes(unit);
  const tabs = [["status", "상태"], ["passive", "패시브"], ["actions", "행동 목록"], ["ego", "개념 폭주"]];
  const renderPassives = (entries) => entries?.length
    ? entries.map((entry) => `<article class="unit-info-entry"><strong>${escapeHtml(entry.name || "패시브")}</strong><p>${escapeHtml(entry.effect || entry.description || entry)}</p></article>`).join("")
    : '<p class="unit-info-empty">등록된 패시브 없음</p>';
  let content = "";
  if (battleDummy.infoTab === "status") {
    const renderStatuses = (entries) => entries?.length
      ? entries.map((entry) => `<li><strong>${escapeHtml(entry.name)}</strong><span>위력 ${entry.power ?? 0} / 횟수 ${entry.count ?? 0}</span>${entry.effect ? `<p>${escapeHtml(entry.effect)}</p>` : ""}</li>`).join("")
      : '<li class="unit-info-empty">없음</li>';
    content = `<div class="unit-info-stats">
      <div><span>체력</span><strong>${unit.hp} / ${unit.maxHp}</strong><meter min="0" max="${unit.maxHp}" value="${unit.hp}"></meter></div>
      <div><span>정신력</span><strong>${unit.sp} / 100</strong><meter min="0" max="100" value="${unit.sp}"></meter></div>
      <div><span>이동 수</span><strong>${unit.moveLeft ?? unit.move ?? 0} / ${unit.move ?? 0}</strong></div>
      <div><span>턴 당 행동 수</span><strong>${isAlly ? unit.actionCapacity || 1 : unit.actionsPerTurn || 1}</strong></div>
    </div><h4>버프 · 디버프</h4><ul class="unit-info-statuses">${renderStatuses([
      ...(unit.buffs || []).map((entry) => ({ ...entry, name: `버프 · ${entry.name}` })),
      ...(unit.debuffs || []).map((entry) => ({ ...entry, name: `디버프 · ${entry.name}` }))
    ])}</ul><h4>정신력 회복 조건</h4><p>패링 성공 시 정신력 10 회복<br>적 적중 시마다 정신력 5 회복</p>
    <h4>정신력 감소 조건</h4><p>아군 사망 시 정신력 10 감소</p>`;
  } else if (battleDummy.infoTab === "passive") {
    content = `<h4>전투 패시브</h4>${renderPassives(unit.passives)}<h4>대기 패시브</h4>${renderPassives(unit.supportPassives)}`;
  } else if (battleDummy.infoTab === "actions") {
    const skills = unit.skills || [getEnemyAction(unit)];
    content = [0, 1, 2, 3].map((index) => {
      const skill = skills[index];
      const inHand = (unit.hand || []).filter((value) => value === index).length;
      const remaining = [...(unit.hand || []), ...(unit.drawPile || [])].filter((value) => value === index).length;
      const count = isAlly ? `남은 수 ${remaining} · 손패 ${inHand} · 가방 ${(unit.drawPile || []).filter((value) => value === index).length}` : `행동 수 ${skill && !unit.actionCanceled ? unit.actionsPerTurn || 1 : 0}`;
      return `<article class="unit-info-entry"><h4>${index + 1}스킬 <small>${skill ? count : ""}</small></h4>${skill ? renderCardSummary(skill, skill.type) : '<p class="unit-info-empty">등록된 행동 없음</p>'}</article>`;
    }).join("") + `<article class="unit-info-entry"><h4>수비 스킬</h4>${unit.guard ? renderCardSummary(unit.guard, unit.guard.type) : '<p class="unit-info-empty">등록된 행동 없음</p>'}</article>`;
  } else {
    content = `<div class="unit-ego-tabs" role="tablist" aria-label="개념 폭주 정보">${[["passive", "패시브"], ["action", "행동"]].map(([id, label]) => `<button type="button" role="tab" aria-selected="${battleDummy.egoInfoTab === id}" data-ego-info-tab="${id}">${label}</button>`).join("")}</div>`;
    content += battleDummy.egoInfoTab === "passive" ? renderPassives(unit.ego?.passives)
      : unit.ego ? `<article class="unit-info-entry">${renderCardSummary(unit.ego, `정신력 소모 ${unit.ego.cost}`)}</article>` : '<p class="unit-info-empty">등록된 개념 폭주 없음</p>';
  }
  return `<div class="unit-info-backdrop"><section class="battle-inspection" role="dialog" aria-modal="true" aria-label="${escapeHtml(unit.name)} 정보">
    <section class="battle-unit-info">
    <header><div><small>${isAlly ? "아군" : "적군"} · ${escapeHtml(unit.identity || "개념물")}</small><h3>${escapeHtml(unit.name)}</h3></div><button type="button" data-close-unit-info aria-label="정보 닫기">×</button></header>
    <nav class="unit-info-tabs" role="tablist" aria-label="유닛 정보">${tabs.map(([id, label]) => `<button type="button" role="tab" aria-selected="${battleDummy.infoTab === id}" data-unit-info-tab="${id}">${label}</button>`).join("")}</nav>
    <div class="unit-info-content" role="tabpanel">${content}</div>
  </section></section></div>`;
}

function bindBattleUnitInfo() {
  if (window.battleInfoKeyHandler) window.removeEventListener('keydown', window.battleInfoKeyHandler);
  const backdrop = document.querySelector(".unit-info-backdrop");
  if (!backdrop) return;
  const close = () => {
    battleDummy.inspectedUnitId = null;
    renderBattleDummy();
  };
  window.battleInfoKeyHandler = (event) => { if (event.key === 'Escape') { event.preventDefault(); close(); } };
  window.addEventListener('keydown', window.battleInfoKeyHandler);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop || event.target.closest('[data-close-unit-info]')) {
      close();
      return;
    }
    const tab = event.target.closest('[data-unit-info-tab], [data-ego-info-tab]');
    if (!tab) return;
    if (tab.dataset.unitInfoTab) {
      if (battleDummy.infoTab === tab.dataset.unitInfoTab) return;
      battleDummy.infoTab = tab.dataset.unitInfoTab;
    } else {
      if (battleDummy.egoInfoTab === tab.dataset.egoInfoTab) return;
      battleDummy.egoInfoTab = tab.dataset.egoInfoTab;
    }
    const template = document.createElement('template');
    template.innerHTML = renderBattleUnitInfo();
    const content = backdrop.querySelector('.unit-info-content');
    content.replaceChildren(...template.content.querySelector('.unit-info-content').childNodes);
    content.scrollTop = 0;
    backdrop.querySelectorAll('[data-unit-info-tab]').forEach(button => button.setAttribute('aria-selected', String(button.dataset.unitInfoTab === battleDummy.infoTab)));
  });
  backdrop.addEventListener("contextmenu", (event) => { event.preventDefault(); event.stopPropagation(); });
}

function bindBattleBoardControls() {
  const field = document.querySelector("#battle-field");
  if (!field) return;
  let rotating = false;
  let startX = 0;
  let startY = 0;
  let startRotation = battleDummy.rotation;
  let startTilt = battleDummy.tilt ?? 30;
  let startCameraX = 0;
  let startCameraY = 0;
  let moved = false;

  document.querySelectorAll('[data-camera-mode]').forEach(button => {
    if (button === field) return;
    button.addEventListener('click', () => {
      battleDummy.cameraMode = button.dataset.cameraMode;
      field.dataset.cameraMode = battleDummy.cameraMode;
      document.querySelectorAll('.battle-camera-tools [data-camera-mode]').forEach(entry => entry.setAttribute('aria-pressed', String(entry.dataset.cameraMode === battleDummy.cameraMode)));
    });
  });
  document.querySelector('#battle-camera-reset').addEventListener('click', () => {
    Object.assign(battleDummy, {rotation:0, tilt:30, zoom:1, cameraX:0, cameraY:0});
    field.style.setProperty('--battle-rot', '0deg');
    field.style.setProperty('--counter-rot', '0deg');
    field.style.setProperty('--battle-tilt', '60deg');
    updateBattleArrowPositions();
  });

  field.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || battleDummy.aiming || battleDummy.inspectedUnitId) return;
    if (event.target.closest("button, [data-move-x], .battle-card-fan, .battle-card-detail, .battle-log")) return;
    rotating = true;
    startX = event.clientX;
    startY = event.clientY;
    startRotation = battleDummy.rotation;
    startTilt = battleDummy.tilt ?? 30;
    startCameraX = battleDummy.cameraX || 0;
    startCameraY = battleDummy.cameraY || 0;
    moved = false;
    field.setPointerCapture(event.pointerId);
    field.classList.add("rotating");
  });

  field.addEventListener("pointermove", (event) => {
    if (!rotating) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (Math.hypot(deltaX, deltaY) > 4) moved = true;
    if (battleDummy.cameraMode === 'move') {
      battleDummy.cameraX = startCameraX + deltaX;
      battleDummy.cameraY = startCameraY + deltaY;
    } else {
      battleDummy.rotation = startRotation - deltaX * .22;
      battleDummy.tilt = Math.max(25, Math.min(75, startTilt + deltaY * .18));
      field.style.setProperty("--battle-rot", `${battleDummy.rotation}deg`);
      field.style.setProperty("--counter-rot", `${-battleDummy.rotation}deg`);
      // Elevation above the ground is the complement of the board's CSS tilt.
      field.style.setProperty('--battle-tilt', `${90 - battleDummy.tilt}deg`);
    }
    updateBattleArrowPositions();
  });

  const endCameraDrag = (event) => {
    if (!rotating) return;
    rotating = false;
    if (field.hasPointerCapture(event.pointerId)) field.releasePointerCapture(event.pointerId);
    field.classList.remove("rotating");
  };
  field.addEventListener('pointerup', endCameraDrag);
  field.addEventListener('pointercancel', endCameraDrag);

  field.addEventListener("click", (event) => {
    if (moved) return;
    if (event.target.closest("button, [data-move-x], .battle-card-fan, .battle-card-detail, .battle-log")) return;
    cancelBattleSelection();
  });

  field.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    cancelBattleSelection();
  });

  field.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (battleDummy.inspectedUnitId || !event.deltaY) return;
    const nextZoom = battleDummy.zoom + (event.deltaY < 0 ? .08 : -.08);
    const zoom = Math.round(Math.max(.72, Math.min(1.38, nextZoom)) * 100) / 100;
    const ratio = zoom / battleDummy.zoom;
    const origin = field.getBoundingClientRect();
    const x = event.clientX - origin.left - field.clientLeft;
    const y = event.clientY - origin.top - field.clientTop;
    battleDummy.cameraX = x - (x - (battleDummy.cameraX || 0)) * ratio;
    battleDummy.cameraY = y - (y - (battleDummy.cameraY || 0)) * ratio;
    battleDummy.zoom = zoom;
    updateBattleArrowPositions();
  }, { passive: false });
}

function bindCardAimPreview() {
  const line = document.querySelector("#cursor-aim-line");
  if (!line) return;
  if (window.battleAimMoveHandler) {
    document.removeEventListener("pointermove", window.battleAimMoveHandler);
  }
  if (window.battleAimUpHandler) {
    document.removeEventListener("pointerup", window.battleAimUpHandler);
  }
  const update = (event) => {
    const aiming = battleDummy.aiming;
    const active = aiming?.fromSlot
      ? document.querySelector(`[data-slot-unit="${aiming.unitId}"][data-action-slot="${aiming.editIndex}"]`)
      : aiming ? document.querySelector(`.battle-card-fan [data-skill-index="${aiming.source}"]`) : null;
    if (!active || !battleDummy.aiming) {
      line.classList.remove("active");
      return;
    }
    const rect = active.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height * .25;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    line.classList.add("active");
    line.style.left = `${startX}px`;
    line.style.top = `${startY}px`;
    line.style.width = `${length}px`;
    line.style.transform = `rotate(${angle}deg)`;
  };
  const end = (event) => {
    if (event.button !== 0) return;
    const aiming = battleDummy.aiming;
    if (!aiming || Math.hypot(event.clientX - aiming.startX, event.clientY - aiming.startY) < 6) return;
    const slot = event.target.closest('[data-action-slot]');
    if (slot && slot.dataset.slotUnit === aiming.unitId) {
      event.preventDefault();
      const source = aiming.source;
      selectBattleActionSlot(aiming.unitId, Number(slot.dataset.actionSlot));
      reserveBattleSkill(source, event);
      return;
    }
    const target = event.target.closest("[data-battle-target], [data-battle-unit]");
    if (target && battleDummy.aiming) {
      // Consume the release before rerendering so its click cannot inspect the target.
      event.preventDefault();
      assignBattleTarget(target.dataset.battleTarget || target.dataset.battleUnit, slot ? Number(slot.dataset.actionSlot) : null);
    }
    line.classList.remove("active");
  };
  window.battleAimMoveHandler = update;
  window.battleAimUpHandler = end;
  if (battleDummy.aiming) {
    document.addEventListener("pointermove", window.battleAimMoveHandler);
    document.addEventListener("pointerup", window.battleAimUpHandler);
  }
}

function selectBattleActionSlot(unitId, index) {
  cancelPendingBattleAction();
  const unit = [...battleDummy.allies, ...battleDummy.enemies].find(entry => entry.id === unitId && entry.hp > 0);
  if (!unit) return;
  const ally = battleDummy.allies.includes(unit);
  battleDummy.selectedActionSlot = {unitId, index};
  battleDummy.focusedActionUnitId = unitId;
  battleDummy.focusedPlanId = `${unitId}:${index}`;
  if (ally) battleDummy.selected = unitId;
  battleDummy.lastUnitClick = null;
  battleDummy.previewAction = null;
  battleDummy.previewSource = null;
  battleDummy.previewHandIndex = null;
  renderBattleDummy();
}

function aimBattleActionSlot(unitId, index, pointer) {
  const unit = battleDummy.allies.find(entry => entry.id === unitId);
  const entry = unit?.queuedActions?.[index];
  if (!entry || unit.swapTargetId) return;
  const previous = {reserved: unit.reserved, reservedSource: unit.reservedSource, reservedHandIndex: unit.reservedHandIndex, targetId: unit.targetId, decisionOrder: unit.decisionOrder};
  Object.assign(unit, {reserved: entry.action, reservedSource: entry.source, reservedHandIndex: entry.handIndex, targetId: null});
  battleDummy.aiming = {unitId, source: entry.source === 'hand' ? String(entry.handIndex) : entry.source, previous, editIndex: index, fromSlot:true, startX: pointer.clientX, startY: pointer.clientY};
  renderBattleDummy();
}

function bindBattleActionSlots() {
  document.querySelectorAll('[data-action-slot]').forEach(slot => {
    slot.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.stopPropagation();
      const unitId = slot.dataset.slotUnit;
      const index = Number(slot.dataset.actionSlot);
      if (battleDummy.aiming) return;
      // Keep the DOM alive until release so clicks and slot drags remain distinguishable.
      const start = {x: event.clientX, y: event.clientY};
      const move = e => {
        if (Math.hypot(e.clientX-start.x, e.clientY-start.y) < 6) return;
        cleanup();
        selectBattleActionSlot(unitId, index);
        aimBattleActionSlot(unitId, index, event);
      };
      const cleanup = () => {document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', cleanup);};
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', cleanup, {once: true});
    });
    slot.addEventListener('click', event => {
      event.stopPropagation();
      const unitId = slot.dataset.slotUnit;
      const index = Number(slot.dataset.actionSlot);
      if (battleDummy.aiming) {
        if (unitId === battleDummy.aiming.unitId) {
          const source = battleDummy.aiming.source;
          selectBattleActionSlot(unitId, index);
          reserveBattleSkill(source, event);
        } else assignBattleTarget(unitId, index);
      } else selectBattleActionSlot(unitId, index);
    });
    slot.addEventListener('dblclick', event => event.stopPropagation());
    slot.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); event.stopPropagation(); slot.click();}
    });
  });
}

function getSelectedBattleUnit() {
  return battleDummy.allies.find((unit) => unit.id === battleDummy.selected && unit.hp > 0)
    || battleDummy.allies.find((unit) => unit.hp > 0) || battleDummy.allies[0];
}

function getBattleRangeAction(unit = getSelectedBattleUnit()) {
  return battleDummy.aiming ? unit.reserved : battleDummy.previewAction || unit.reserved || null;
}

function previewBattleSkill(index) {
  const unit = getSelectedBattleUnit();
  if (index === 'swap' || unit.swapTargetId) return;
  if (battleDummy.previewSource === index || (battleDummy.previewSource === 'hand' && battleDummy.previewHandIndex === Number(index))) return;
  battleDummy.focusedActionUnitId = unit.id;
  if (battleDummy.suppressedPreview?.unitId === unit.id && battleDummy.suppressedPreview.index === index) return;
  if (index === "ego") {
    battleDummy.previewAction = unit.ego;
    battleDummy.previewSource = "ego";
    battleDummy.previewHandIndex = null;
  } else if (index === "guard") {
    battleDummy.previewAction = unit.guard;
    battleDummy.previewSource = "guard";
    battleDummy.previewHandIndex = null;
  } else {
    const handIndex = Number(index);
    const skillIndex = unit.hand[handIndex];
    battleDummy.previewAction = unit.skills[skillIndex];
    battleDummy.previewSource = "hand";
    battleDummy.previewHandIndex = handIndex;
  }
  renderBattleDummy();
}

function renderBattleCells(action) {
  const selected = getSelectedBattleUnit();
  const shouldShowRange = Boolean(action);
  const primary = [...battleDummy.allies, ...battleDummy.enemies].find((unit) => unit.id === selected.targetId && unit.hp > 0);
  const area = action && primary && !battleDummy.aiming ? getActionAreaCells(selected, action, primary) : [];
  const cells = [];
  for (let y = 1; y <= 5; y += 1) {
    for (let x = 1; x <= 8; x += 1) {
      const distance = Math.abs(selected.x - x) + Math.abs(selected.y - y);
      const numericRange = action && typeof action.range === "number" ? action.range : action ? 99 : 0;
      const inRange = shouldShowRange && !primary && distance > 0 && distance <= numericRange;
      const inArea = area.some((cell) => cell.x === x && cell.y === y);
      const canMove = !battleDummy.aiming && canMoveSelectedUnitTo(x, y);
      cells.push(`
        <div data-cell-x="${x}" data-cell-y="${y}" class="battle-cell ${inRange ? "in-range" : ""} ${inArea ? "effect-area" : ""} ${canMove ? "move-cell" : ""}" ${canMove ? `data-move-x="${x}" data-move-y="${y}"` : ""}>
        </div>
      `);
    }
  }
  return cells.join("");
}

function isBattleSupportAction(action) {
  return String(action?.scope || '').includes('아군') || action?.type === '지원';
}

function isBattleWholeAreaAction(action) {
  return /전체|전장|전\s*구역/.test(String(action?.scope || ''));
}

function isBattleTargetInRange(unit, action, target) {
  if (!action || !target || target.hp <= 0) return false;
  if (action.scope === "자신") return unit.id === target.id;
  if (isBattleSupportAction(action) && !getBattleTeam(unit).includes(target)) return false;
  if (isBattleWholeAreaAction(action) && !isBattleSupportAction(action) && getBattleTeam(unit).includes(target)) return false;
  if (target.id === unit.id && !isBattleSupportAction(action) && !action.scope.includes('자신 중심')) return false;
  return typeof action.range !== "number" || Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y) <= action.range;
}

function getActionAreaCells(unit, action, target) {
  const scope = String(action.scope || "단일");
  if (isBattleWholeAreaAction(action)) {
    const units = isBattleSupportAction(action) ? getBattleTeam(unit) : [...battleDummy.allies, ...battleDummy.enemies].filter((entry) => !getBattleTeam(unit).includes(entry));
    return units.filter((entry) => entry.hp > 0).map(({ x, y }) => ({ x, y }));
  }
  const center = scope.includes("자신 중심") ? unit : target;
  const cells = [{ x: center.x, y: center.y }];
  if (scope.includes("십자") || scope.includes("마름모")) {
    cells.push({ x: center.x - 1, y: center.y }, { x: center.x + 1, y: center.y }, { x: center.x, y: center.y - 1 }, { x: center.x, y: center.y + 1 });
  } else if (scope.includes("직선") || scope.includes("전방")) {
    const horizontal = Math.abs(target.x - unit.x) >= Math.abs(target.y - unit.y);
    const dx = horizontal ? Math.sign(target.x - unit.x) || 1 : 0;
    const dy = horizontal ? 0 : Math.sign(target.y - unit.y) || 1;
    if (scope.includes("직선")) cells.push({ x: target.x + dx, y: target.y + dy });
    else cells.push({ x: target.x - dy, y: target.y + dx }, { x: target.x + dy, y: target.y - dx });
  }
  return cells.filter(({ x, y }) => x >= 1 && x <= 8 && y >= 1 && y <= 5);
}

function getBattleTeam(unit) {
  return battleDummy.allies.includes(unit) ? battleDummy.allies : battleDummy.enemies;
}

function getActionTargets(unit, action, primary) {
  const area = getActionAreaCells(unit, action, primary);
  return [...battleDummy.allies, ...battleDummy.enemies].filter((entry) => entry.hp > 0
    && (isBattleSupportAction(action) ? getBattleTeam(unit).includes(entry) : !getBattleTeam(unit).includes(entry))
    && area.some((cell) => cell.x === entry.x && cell.y === entry.y));
}

function canMoveSelectedUnitTo(x, y) {
  const unit = getSelectedBattleUnit();
  if (unit.swapTargetId || unit.hp <= 0) return false;
  if (unit.moveLeft <= 0) return false;
  const distance = Math.abs(unit.x - x) + Math.abs(unit.y - y);
  if (distance !== 1) return false;
  return ![...battleDummy.allies, ...battleDummy.enemies].some((other) => (
    other.id !== unit.id
    && other.hp > 0
    && other.x === x
    && other.y === y
  ));
}

function getBattleSchedule() {
  const units = [...battleDummy.allies, ...battleDummy.enemies].filter((unit) => unit.hp > 0);
  const plans = units.flatMap((unit) => {
    if (unit.swapTargetId) return [];
    const ally = battleDummy.allies.includes(unit);
    let entries = ally ? unit.queuedActions || [] : Array.from({ length: Math.max(1, unit.actionsPerTurn || 1) }, (_, slot) => ({
      action: unit.preparedAction || getEnemyAction(unit), targetId: unit.targetId, decisionOrder: (unit.decisionOrder || 0) + slot / 100
    }));
    if (ally && !entries.length && unit.reserved && battleDummy.aiming?.unitId !== unit.id) entries = [{
      action: unit.reserved, targetId: unit.targetId, decisionOrder: unit.decisionOrder || 0, source: unit.reservedSource, handIndex: unit.reservedHandIndex
    }];
    return entries.map((entry, slot) => ({ ...entry, unit, action: entry.action,
      id: `${unit.id}:${slot}`, slot, target: units.find((target) => target.id === entry.targetId) }));
  }).filter((plan) => plan.action);
  const canClash = (a, b) => a.action.hits > 0 && b.action.hits > 0
    && !["방어", "회피", "반격"].includes(a.action.type) && !["방어", "회피", "반격"].includes(b.action.type)
    && !isBattleSupportAction(a.action) && !isBattleSupportAction(b.action)
    && !getBattleTeam(a.unit).includes(b.unit)
    && isBattleTargetInRange(a.unit, a.action, b.unit) && isBattleTargetInRange(b.unit, b.action, a.unit);
  const paired = new Map();
  plans.filter((plan) => battleDummy.enemies.includes(plan.unit)).forEach((enemyPlan) => {
    const interceptor = plans.filter((plan) => battleDummy.allies.includes(plan.unit)
      && !paired.has(plan.id) && plan.target?.id === enemyPlan.unit.id
      && (plan.targetSlot == null || plan.targetSlot === enemyPlan.slot) && canClash(plan, enemyPlan))
      .sort((a, b) => b.decisionOrder - a.decisionOrder)[0];
    if (interceptor) {
      enemyPlan.target = interceptor.unit;
      paired.set(interceptor.id, enemyPlan.id); paired.set(enemyPlan.id, interceptor.id);
    }
  });
  const front = (unit) => battleDummy.allies.includes(unit) ? unit.x : 9 - unit.x;
  plans.sort((a, b) => front(b.unit) - front(a.unit) || (b.unit.move || 0) - (a.unit.move || 0)
    || (b.action.priority || 0) - (a.action.priority || 0)
    || Number(b.action.scope === "자신") - Number(a.action.scope === "자신") || a.unit.id.localeCompare(b.unit.id) || a.decisionOrder - b.decisionOrder);
  const processed = new Set();
  const events = [];
  plans.forEach((plan, index) => {
    if (processed.has(plan.id)) return;
    const opponent = plans.find((other) => other.id === paired.get(plan.id));
    processed.add(plan.id);
    if (opponent) processed.add(opponent.id);
    events.push({ plans: opponent ? [plan, opponent] : [plan], baseOrder: index + 1 });
  });
  const ranks = new Map();
  events.forEach((event, index) => event.plans.forEach((plan) => {
    ranks.set(plan.id, index + 1);
    if (!ranks.has(plan.unit.id)) ranks.set(plan.unit.id, index + 1);
  }));
  return { plans, events, ranks };
}

function renderBattleBoardArrows(screenPoints = null) {
  const { plans, events } = getBattleSchedule();
  const clashIds = new Set(events.filter((event) => event.plans.length === 2).flatMap((event) => event.plans.map((plan) => plan.id)));
  const drawn = new Set();
  const paths = [];
  const point = (p) => `${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
  const color = (plan) => clashIds.has(plan.id) ? "gold" : battleDummy.allies.includes(plan.unit) ? "blue" : "red";
  const path = (a, c, b, tone, from, to) => `<path class="action-arc ${tone}" data-from-slot="${from}" data-to-slot="${to}" d="M ${point(a)} Q ${point(c)} ${point(b)}" marker-end="url(#battle-arrow-${tone})" />`;
  plans.forEach((plan) => {
    if (!plan.target || plan.target.id === plan.unit.id || drawn.has(plan.id)) return;
    const pairedEvent = events.find((event) => event.plans.length === 2 && event.plans.some((entry) => entry.id === plan.id));
    const opposite = pairedEvent?.plans.find((entry) => entry.id !== plan.id)
      || plans.find((other) => !drawn.has(other.id) && !clashIds.has(other.id) && !clashIds.has(plan.id) && other.unit.id === plan.target.id && other.target?.id === plan.unit.id
        && (plan.targetSlot == null || plan.targetSlot === other.slot) && (other.targetSlot == null || other.targetSlot === plan.slot));
    const targetSlotId = opposite?.id || `${plan.target.id}:${plan.targetSlot ?? 0}`;
    const a = screenPoints?.get(plan.id) || getBoardPoint(plan.unit);
    const b = screenPoints?.get(targetSlotId) || getBoardPoint(plan.target);
    const distance = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const c = screenPoints
      ? { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - Math.min(1.25, Math.max(.45, distance * .45)) }
      : { x: (a.x + b.x) / 2 - (b.y - a.y) / distance * .65, y: (a.y + b.y) / 2 + (b.x - a.x) / distance * .65 };
    if (opposite) {
      const mid = { x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4 };
      paths.push(path(a, { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 }, mid, color(plan), plan.id, opposite.id));
      paths.push(path(b, { x: (b.x + c.x) / 2, y: (b.y + c.y) / 2 }, mid, color(opposite), opposite.id, plan.id));
      drawn.add(opposite.id);
    } else paths.push(path(a, c, b, color(plan), plan.id, targetSlotId));
    drawn.add(plan.id);
  });
  return `<svg class="battle-action-lines" viewBox="0 0 8 5" preserveAspectRatio="none" aria-hidden="true"><defs>
    ${["red", "blue", "gold"].map((tone) => `<marker id="battle-arrow-${tone}" class="${tone}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth=".14" markerHeight=".14" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z" /></marker>`).join("")}
    </defs>${paths.join("")}</svg>`;
}

function updateBattleArrowPositions() {
  const camera = document.querySelector('#battle-camera');
  if (camera) camera.style.transform = 'none';
  updateBattleSpritePositions();
  const overlay = document.querySelector("#battle-arrow-overlay");
  if (!overlay) return;
  const rect = overlay.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const points = new Map();
  document.querySelectorAll('[data-action-slot]').forEach((slot) => {
    const bounds = slot.getBoundingClientRect();
    points.set(`${slot.dataset.slotUnit}:${slot.dataset.actionSlot}`, {
      x: (bounds.left + bounds.width / 2 - rect.left) / rect.width * 8,
      y: (bounds.top + bounds.height / 2 - rect.top) / rect.height * 5
    });
  });
  overlay.innerHTML = renderBattleBoardArrows(points);
  if (battleDummy.inspectedUnitId) focusInspectedBattleUnit();
  else if (camera) {
    const x = battleDummy.cameraX || 0;
    const y = battleDummy.cameraY || 0;
    camera.style.transform = battleDummy.zoom === 1 && !x && !y ? 'none' : `translate(${x}px, ${y}px) scale(${battleDummy.zoom})`;
  }
}

function focusInspectedBattleUnit() {
  const camera = document.querySelector('#battle-camera');
  if (!camera || !battleDummy.inspectedUnitId) return;
  const token = [...camera.querySelectorAll('.battle-token')].find(entry => (entry.dataset.battleUnit || entry.dataset.battleTarget) === battleDummy.inspectedUnitId);
  if (!token) return;
  token.classList.add('inspection-focus');
  const frame = camera.getBoundingClientRect();
  const body = token.querySelector(':scope > img, .enemy-core').getBoundingClientRect();
  // Zoom the existing battlefield, not a duplicate portrait.
  const scale = Math.max(1.8, Math.min(4, frame.height * .48 / body.height));
  const x = body.left + body.width / 2 - frame.left;
  const y = body.top + body.height * .92 - frame.top;
  camera.style.transform = `translate(${frame.width * .25 - x * scale}px, ${frame.height * .73 - y * scale}px) scale(${scale})`;
}

window.addEventListener?.("resize", () => requestAnimationFrame(updateBattleArrowPositions));

function updateBattleSpritePositions() {
  const layer = document.querySelector('#battle-unit-layer');
  if (!layer) return;
  const frame = layer.getBoundingClientRect();
  if (!frame.width || !frame.height) return;
  layer.querySelectorAll('.battle-token').forEach(token => {
    const unit = [...battleDummy.allies, ...battleDummy.enemies].find(entry => entry.id === (token.dataset.battleUnit || token.dataset.battleTarget));
    if (!unit) return;
    const cell = document.querySelector(`[data-cell-x="${unit.x}"][data-cell-y="${unit.y}"]`);
    if (!cell) return;
    const bounds = cell.getBoundingClientRect();
    const y = (bounds.top + bounds.height / 2 - frame.top) / frame.height * 100;
    token.style.left = `${(bounds.left + bounds.width / 2 - frame.left) / frame.width * 100}%`;
    token.style.top = `${y}%`;
    token.style.setProperty('--sprite-zoom', 1);
    token.style.zIndex = String(Math.round(y * 10));
  });
}

function getBattleUnitImage(unit, side) {
  const sprite = side === 'ally' ? window.battleSpriteAssets?.[unit.name] : null;
  return sprite?.combat ? sprite.src : unit.image;
}

function getBoardPoint(unit) {
  return { x: unit.x - .5, y: unit.y - .5 };
}

function renderBattleToken(unit, side) {
  const hpPercent = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));
  const sprite = side === 'ally' ? window.battleSpriteAssets?.[unit.name] : null;
  const image = getBattleUnitImage(unit, side);
  const registration = sprite?.combat ? window.battleSpriteRegistration?.(unit.name) : null;
  const img = image ? `<img src="${image}" alt="${unit.name}" draggable="false">` : `<span class="enemy-core"></span>`;
  const selected = getSelectedBattleUnit();
  const primary = [...battleDummy.allies, ...battleDummy.enemies].find((entry) => entry.id === selected.targetId);
  const secondary = selected.reserved && primary && !battleDummy.aiming && getActionTargets(selected, selected.reserved, primary).includes(unit);
  const targetClass = selected.targetId === unit.id ? "primary-targeted" : secondary ? "secondary-targeted" : "";
  const schedule = getBattleSchedule();
  return `
    <button class="battle-token ${side} ${sprite?.combat ? 'sd-token' : ''} ${targetClass} ${unit.id === battleDummy.selected ? "selected" : ""}" style="--sd-scale:${sprite?.scale || 1};--sd-render-scale:${registration?.renderScale || 1};--sd-foot-offset:${registration?.bottomOffset || 0}" type="button" title="${unit.name}" ${side === "ally" ? `data-battle-unit="${unit.id}"` : `data-battle-target="${unit.id}"`}>
      ${img}
      <span class="enemy-action-badge ${side === 'ally' ? 'ally-action-badge' : ''}" title="턴 당 행동 ${side === 'ally' ? unit.actionCapacity || 1 : unit.actionsPerTurn || 1}">${Array.from({length: side === 'ally' ? unit.actionCapacity || 1 : unit.actionsPerTurn || 1}, (_, index) => { const plan = schedule.plans.find(entry => entry.id === `${unit.id}:${index}`); const active = battleDummy.selectedActionSlot?.unitId === unit.id && battleDummy.selectedActionSlot.index === index; return `<span class="action-slot" role="button" tabindex="0" data-slot-unit="${unit.id}" data-action-slot="${index}" aria-pressed="${active}" aria-label="${escapeHtml(unit.name)} 행동 슬롯 ${index+1}${plan ? ': '+escapeHtml(plan.action.name) : ': 비어 있음'}"><span class="mini-action-icon ${plan ? getHitIconType(plan.action) : 'sword'}"></span><strong>${plan ? schedule.ranks.get(plan.id) || '—' : '—'}</strong></span>`; }).join('')}</span>
      ${renderUnitStatusBadges(unit)}
      <b>${unit.name}</b>
      <i class="unit-hp" style="--hp:${hpPercent}%"><span>${unit.hp}/${unit.maxHp}</span></i>
      <em class="unit-sp">${unit.sp}</em>
    </button>
  `;
}

function renderBattleHand(unit) {
  return unit.hand.map((skillIndex, handIndex) => {
    const skill = unit.skills[skillIndex];
    const active = (unit.queuedActions || []).some((entry) => entry.source === 'hand' && entry.handIndex === handIndex)
      || (unit.reservedSource === "hand" && unit.reservedHandIndex === handIndex);
    const preview = battleDummy.previewSource === "hand" && battleDummy.previewHandIndex === handIndex;
    return renderSkillCard(skill, `${skillIndex + 1}스킬`, handIndex, active || preview, "hand");
  }).join("");
}

function renderSkillCard(skill, label, handIndex, active, source) {
  return `
    <button class="battle-skill ${source} ${active ? "active" : ""}" type="button" data-skill-index="${source === "hand" ? handIndex : source}" style="--card-index:${handIndex};--fan-position:${source === 'guard' ? -2 : handIndex-1};--fan-bend:${source === 'guard' ? 2 : Math.abs(handIndex-1)};" ${getSelectedBattleUnit().swapTargetId ? 'disabled' : ''}>
      ${renderCardSummary(skill, label, false, true)}
    </button>
  `;
}

function renderGuardCard(unit) {
  return renderSkillCard(unit.guard, "수비", -1, (unit.queuedActions || []).some((entry) => entry.source === 'guard') || unit.reservedSource === "guard" || battleDummy.previewSource === "guard", "guard");
}

function renderBattleSwapCard(unit) {
  if (unit.x !== 1 || unit.hp <= 0) return '';
  const available = unit.hp > 0 && unit.x === 1 && (battleDummy.bench || []).some((entry) => entry.hp > 0);
  const target = (battleDummy.bench || []).find((entry) => entry.id === unit.swapTargetId);
  return `<button type="button" class="battle-skill swap ${unit.swapTargetId ? 'active' : ''}" data-skill-index="swap" style="--card-index:-2;--fan-position:-3;--fan-bend:3" ${!available && !target ? 'disabled' : ''}><span class="skill-label">교체</span><strong>⇄</strong><span>${target ? escapeHtml(target.name) : '도깨비 대기'}</span></button>`;
}

function toggleBattleSwap(unit) {
  if (unit.swapTargetId) { unit.swapTargetId = null; battleDummy.swapPickerId = null; renderBattleDummy(); return; }
  if (unit.x !== 1 || unit.hp <= 0) return;
  cancelPendingBattleAction(); battleDummy.swapPickerId = unit.id; renderBattleDummy();
}

function renderBattleSwapPicker() {
  if (!battleDummy.swapPickerId) return '';
  const claimed = battleDummy.allies.map((unit) => unit.swapTargetId).filter(Boolean);
  return `<div class="battle-swap-backdrop"><section class="battle-swap-picker" role="dialog" aria-modal="true" aria-label="교체 대기 인원"><header><h3>도깨비 대기 인원</h3><button type="button" id="swap-picker-close" aria-label="닫기">×</button></header><div>${(battleDummy.bench || []).filter((unit) => unit.hp > 0).map((unit,index) => `<button type="button" data-swap-unit="${unit.id}" ${claimed.includes(unit.id) ? 'disabled' : ''}><img src="${unit.image}" alt=""><b>${index+1}. ${unit.name}</b><span>체력 ${unit.hp} / ${unit.maxHp} · 정신력 ${unit.sp}</span></button>`).join('')}</div></section></div>`;
}

function bindBattleSwapPicker() {
  const close = () => { battleDummy.swapPickerId = null; renderBattleDummy(); };
  document.querySelector('#swap-picker-close')?.addEventListener('click', close);
  document.querySelector('.battle-swap-backdrop')?.addEventListener('click', (event) => { if (event.target.classList.contains('battle-swap-backdrop')) close(); });
  document.querySelectorAll('[data-swap-unit]').forEach((button) => button.addEventListener('click', () => {
    reserveBattleSwap(battleDummy.swapPickerId,button.dataset.swapUnit); close();
  }));
}

function reserveBattleSwap(unitId, targetId) {
  const unit = battleDummy.allies.find((entry) => entry.id === unitId);
  const target = (battleDummy.bench || []).find((entry) => entry.id === targetId && entry.hp > 0);
  if (!unit || unit.hp <= 0 || unit.x !== 1 || !target || battleDummy.allies.some((entry) => entry.swapTargetId === targetId)) return false;
  cancelPendingBattleAction();
  unit.queuedActions = []; syncBattleReservation(unit); unit.swapTargetId = targetId;
  battleDummy.previewAction = null; battleDummy.previewSource = null; battleDummy.previewHandIndex = null;
  pushBattleLog(`${unit.name}: 다음 턴 ${target.name} 교체 예약.`);
  return true;
}

function processBattleReplacements(onlyDeaths = false) {
  const bench = battleDummy.bench ||= [];
  [...battleDummy.allies].sort((a,b) => (a.formationOrder || 0) - (b.formationOrder || 0)).forEach((outgoing) => {
    const dead = outgoing.hp <= 0;
    if (onlyDeaths && !dead) return;
    if (!dead && !outgoing.swapTargetId) return;
    const reservedIds = battleDummy.allies.filter((unit) => unit.hp > 0).map((unit) => unit.swapTargetId).filter(Boolean);
    const index = dead ? bench.findIndex((unit) => unit.hp > 0 && !reservedIds.includes(unit.id)) : bench.findIndex((unit) => unit.id === outgoing.swapTargetId && unit.hp > 0);
    if (index < 0) return;
    const x = dead ? 1 : outgoing.x, y = outgoing.y;
    if ([...battleDummy.allies,...battleDummy.enemies].some((unit) => unit !== outgoing && unit.hp > 0 && unit.x === x && unit.y === y)) return;
    const incoming = bench.splice(index,1)[0];
    Object.assign(incoming,{x,y,formationOrder:outgoing.formationOrder,queuedActions:[],swapTargetId:null,actionCanceled:false,guardReady:false,moveLeft:incoming.move});
    syncBattleReservation(incoming);
    battleDummy.allies[battleDummy.allies.indexOf(outgoing)] = incoming;
    if (!dead) { outgoing.x = null; outgoing.y = null; outgoing.swapTargetId = null; outgoing.queuedActions = []; syncBattleReservation(outgoing); bench.push(outgoing); }
    if (battleDummy.selected === outgoing.id) battleDummy.selected = incoming.id;
    if (battleDummy.focusedActionUnitId === outgoing.id) battleDummy.focusedActionUnitId = incoming.id;
    pushBattleLog(`${incoming.name}: (${x}, ${y}) ${dead ? '전사 인원 후속 투입' : '교체 투입'}.`);
  });
}

function renderEgoCard(unit) {
  const active = unit.reservedSource === "ego" || battleDummy.previewSource === "ego";
  const disabled = unit.sp < unit.ego.cost || unit.swapTargetId;
  return `
    <button class="battle-skill ego ${active ? "active" : ""}" type="button" data-skill-index="ego" style="--card-index:5;--fan-position:3;--fan-bend:3" ${disabled ? "disabled" : ""}>
      ${renderCardSummary(unit.ego, '개념 폭주', false, true)}
    </button>
  `;
}

function getBattleActionComparison() {
  const focusedId = battleDummy.focusedActionUnitId || battleDummy.selected;
  const schedule = getBattleSchedule();
  const aimingUnit = battleDummy.allies.find(unit => unit.id === battleDummy.aiming?.unitId);
  if (aimingUnit && aimingUnit.id === focusedId) return {left: {unit: aimingUnit, action: aimingUnit.reserved, target: null}};
  const focusedPlan = schedule.plans.find((plan) => plan.id === battleDummy.focusedPlanId)
    || (battleDummy.selectedActionSlot?.unitId === focusedId ? null : schedule.plans.filter((plan) => plan.unit.id === focusedId).at(-1));
  if (battleDummy.selectedActionSlot?.unitId === focusedId && !focusedPlan && !battleDummy.aiming && !battleDummy.previewAction) return {};
  const clash = schedule.events.find((event) => event.plans.length === 2 && event.plans.some((plan) => plan.id === focusedPlan?.id));
  if (clash) return {
    clash: true,
    left: clash.plans.find((plan) => battleDummy.allies.includes(plan.unit)),
    right: clash.plans.find((plan) => battleDummy.enemies.includes(plan.unit))
  };
  const unit = [...battleDummy.allies, ...battleDummy.enemies].find((entry) => entry.id === focusedId && entry.hp > 0);
  if (!unit) return {};
  const ally = battleDummy.allies.includes(unit);
  const plan = focusedPlan;
  const action = ally ? unit.reserved || (unit.id === battleDummy.selected ? battleDummy.previewAction : null) : unit.preparedAction || getEnemyAction(unit);
  return action ? { [ally ? 'left' : 'right']: plan || { unit, action, target: findActionTarget(unit, action) } } : {};
}

function getPowerBounds(unit, action, context = {}) {
  if (action.sequence) {
    const values = [-3, 3].map(wave=>getPowerAtWave(unit, action, wave, context));
    return { min: Math.min(...values), max: Math.max(...values) };
  }
  const count = context.hit ?? context.remainingHits ?? Math.max(1, action.hits || 1);
  const counts = context.clash || context.hit ? [count] : Array.from({ length: count }, (_, index) => index + 1);
  const values = counts.flatMap((hit) => [-3 * hit, 3 * hit].map((sum) =>
    getPowerAtWave(unit, action, sum, context.clash ? context : { ...context, hit })));
  return { min: Math.min(...values), max: Math.max(...values) };
}

function getCumulativePowerDistribution(unit, action, count) {
  let sums = new Map([[0, 1]]);
  for (let hit = 0; hit < count; hit += 1) {
    const next = new Map();
    for (const [sum, probability] of sums) for (const wave of getWaveDistribution(unit.sp)) {
      const value = sum + wave.value;
      next.set(value, (next.get(value) || 0) + probability * wave.probability);
    }
    sums = next;
  }
  const powers = new Map();
  for (const [sum, probability] of sums) {
    const power = getPowerAtWave(unit, action, sum, { clash: true });
    powers.set(power, (powers.get(power) || 0) + probability);
  }
  return powers;
}

function getDirectDamageBounds(unit, action, target) {
  if (!target || action.hits <= 0 || action.scope.includes('아군') || action.scope === '자신') return null;
  let min = 0, max = 0;
  const protection = getBattleStatus(target, '보호');
  const focus = getBattleStatus(unit, '집중');
  const strong = getBattleStatus(unit, '강타');
  for (let hit = 1; hit <= (action.sequence?.length || action.hits); hit += 1) {
    const bounds = getPowerBounds(unit, action, { hit });
    const canCrit = (hit === 1 && unit.criticalReady) || (focus && hit <= focus.count && focus.power > 0);
    const guaranteedCrit = (hit === 1 && unit.criticalReady) || (focus && hit <= focus.count && focus.power >= 100);
    const multiplier = 1.5 + ((strong && hit <= strong.count ? strong.power : 0) + (hit === 1 ? unit.criticalBonus || 0 : 0)) / 100;
    const shield = protection && hit <= protection.count ? protection.power : 0;
    const ratio = action.sequence?.[hit - 1]?.ratio ?? 1;
    min += Math.max(0, Math.floor(bounds.min * ratio * (guaranteedCrit ? multiplier : 1)) - shield);
    max += Math.max(0, Math.floor(bounds.max * ratio * (canCrit ? multiplier : 1)) - shield);
  }
  return { min, max };
}

function getClashForecast(ally, enemy) {
  if (ally.action.sequence || enemy.action.sequence) {
    let probability = 0, draw = 0;
    for (const a of getWaveDistribution(ally.unit.sp)) for (const b of getWaveDistribution(enemy.unit.sp)) {
      const ap = getPowerAtWave(ally.unit, ally.action, a.value, { clash: true });
      const bp = getPowerAtWave(enemy.unit, enemy.action, b.value, { clash: true });
      if (ap > bp) probability += a.probability * b.probability;
      if (ap === bp) draw += a.probability * b.probability;
    }
    const score = probability + draw / 2;
    return { probability, draw, label: score < .1 ? '매우 불리' : score < .3 ? '불리' : score < .45 ? '다소 불리' : score <= .55 ? '균형' : score <= .7 ? '다소 유리' : score <= .9 ? '유리' : '매우 유리' };
  }
  const ah = Math.max(1, ally.action.hits || 1), bh = Math.max(1, enemy.action.hits || 1);
  const allyPowers = Array.from({ length: ah + 1 }, (_, count) => getCumulativePowerDistribution(ally.unit, ally.action, count));
  const enemyPowers = Array.from({ length: bh + 1 }, (_, count) => getCumulativePowerDistribution(enemy.unit, enemy.action, count));
  const rounds = Array.from({ length: ah + 1 }, () => []);
  for (let a = 1; a <= ah; a += 1) for (let b = 1; b <= bh; b += 1) {
    const odds = { win: 0, lose: 0, tie: 0 };
    for (const [ap, av] of allyPowers[a]) for (const [bp, bv] of enemyPowers[b]) {
      odds[ap > bp ? 'win' : ap < bp ? 'lose' : 'tie'] += av * bv;
    }
    rounds[a][b] = odds;
  }
  // Match the resolver's 128-round limit, including repeated ties and hit destruction.
  let previous = Array.from({ length: ah + 1 }, (_, a) => Array.from({ length: bh + 1 }, (_, b) => a > 0 && b === 0 ? 1 : 0));
  let lossPrevious = Array.from({ length: ah + 1 }, (_, a) => Array.from({ length: bh + 1 }, (_, b) => a === 0 && b > 0 ? 1 : 0));
  for (let round = 0; round < 128; round += 1) {
    const next = previous.map((row) => row.slice()), lossNext = lossPrevious.map((row) => row.slice());
    for (let a = 1; a <= ah; a += 1) for (let b = 1; b <= bh; b += 1) {
      const { win, lose, tie } = rounds[a][b];
      next[a][b] = win * previous[a][b - 1] + lose * previous[a - 1][b] + tie * previous[a][b];
      lossNext[a][b] = win * lossPrevious[a][b - 1] + lose * lossPrevious[a - 1][b] + tie * lossPrevious[a][b];
    }
    previous = next; lossPrevious = lossNext;
  }
  const probability = Math.max(0, Math.min(1, previous[ah][bh]));
  const draw = Math.max(0, 1 - probability - lossPrevious[ah][bh]);
  const advantage = probability + draw / 2;
  const label = advantage < .1 ? '매우 불리' : advantage < .3 ? '불리' : advantage < .45 ? '다소 불리'
    : advantage <= .55 ? '균형' : advantage <= .7 ? '다소 유리' : advantage <= .9 ? '유리' : '매우 유리';
  return { probability, draw, label };
}

function renderClashForecast(ally, enemy) {
  const forecast = getClashForecast(ally, enemy);
  return `<aside class="battle-clash-forecast" aria-label="아군 예상 충돌 승률"><small>아군 예상 승률</small><strong>${(forecast.probability * 100).toFixed(1)}%</strong><b>${forecast.label}</b><span>정신력 ${ally.unit.sp} / ${enemy.unit.sp}${forecast.draw > .001 ? ` · 상쇄 ${(forecast.draw * 100).toFixed(1)}%` : ''}</span></aside>`;
}

function renderBattleActionPanel(plan, side, clash) {
  if (!plan) return '';
  const { unit, action, target } = plan;
  const bounds = getPowerBounds(unit, action, { clash });
  const damage = !clash && getDirectDamageBounds(unit, action, target);
  return `<section class="battle-card-detail battle-card-detail-${side}" aria-label="${side === 'left' ? '아군' : '적군'} 행동 카드">
    <header class="battle-power-preview"><span>최소 위력<b>${bounds.min}</b></span><span>최대 위력<b>${bounds.max}</b></span>${damage ? `<span title="연속 효과의 직접 피해 예상치. 벽 충돌·후속 상태 효과·회피·반격 제외">피해량<b>${damage.min}~${damage.max}</b></span>` : ''}</header>
    <p class="eyebrow">${escapeHtml(unit.name)}</p><h3>${clash ? '패링 예정' : '예정 행동'}${target ? ` · ${escapeHtml(target.name)}` : ''}</h3>
    ${renderCardSummary(action, action.type)}
  </section>`;
}

function renderSelectedCardDetail(unit) {
  const action = unit.reserved || battleDummy.previewAction || unit.skills[unit.hand[0]] || unit.guard;
  const sourceLabel = unit.reservedSource === "ego" ? "기본 개념 폭주"
    : unit.reservedSource === "guard" ? "수비 카드"
      : unit.reserved ? "선택 카드"
        : battleDummy.previewAction ? "미리보기" : "카드 선택";
  return `
    <p class="eyebrow">${unit.name}</p>
    <h3>${sourceLabel}</h3>
    ${renderCardSummary(action, action.type, true)}
  `;
}

function renderCardSummary(skill, label, detail = false, compact = false) {
  const waveText = `${Number(skill.wave) >= 0 ? "+" : ""}${skill.wave || 0}`;
  const targetCount = getTargetCount(skill);
  if (compact) return `
    <span class="compact-card-header"><span class="skill-label">${escapeHtml(label)}</span><img src="assets/icons/hit-${getHitIconType(skill)}.png" alt="${escapeHtml(skill.type)}" draggable="false"></span>
    <strong class="compact-card-name">${escapeHtml(skill.name)}</strong>
    <div class="compact-card-power"><span><small>기본 위력</small><b class="skill-power">${skill.power}</b></span><span><small>파형값</small><b class="skill-wave">${waveText}</b></span></div>
    <div class="compact-card-meta"><span>${escapeHtml(skill.keyword)} · ${escapeHtml(skill.type)}</span><span>사거리 ${skill.range} · 대상 ${targetCount}${skill.cost ? ` · SP −${skill.cost}` : ''}</span></div>`;
  const hitRows = renderHitRows(skill);
  return `
    <span class="skill-label">${label}</span>
    <strong>${skill.name}</strong>
    <div class="skill-statline">
      <b class="skill-power">${skill.power}</b>
      <span class="skill-wave">${waveText}</span>
      <span class="target-count">대상 수 ${targetCount}</span>
    </div>
    <small>${skill.keyword} / 사거리 ${skill.range} / ${skill.scope}</small>
    <div class="skill-effects">${hitRows}</div>
    ${detail ? `
    <dl>
      <div><dt>사거리</dt><dd>${skill.range}</dd></div>
      <div><dt>범위</dt><dd>${skill.scope}</dd></div>
      <div><dt>대상 수</dt><dd>${targetCount}</dd></div>
      <div><dt>기본</dt><dd>${skill.power}</dd></div>
      <div><dt>파형값</dt><dd>${skill.wave || "-"}</dd></div>
    </dl>
    ` : ""}
  `;
}

function getTargetCount(skill) {
  const scope = String(skill.scope || "");
  if (scope.includes("단일") || scope.includes("자신")) return 1;
  if (scope.includes("전방 3칸")) return 3;
  if (scope.includes("직선 2칸")) return 2;
  if (scope.includes("십자")) return 5;
  if (scope.includes("마름모")) return 5;
  if (isBattleWholeAreaAction(skill)) return "전체";
  return 1;
}

function renderHitRows(skill) {
  if (skill.sequence || skill.legacy) {
    const blocks = skill.descriptionBlocks || [skill.effect];
    return `<div class="sequence-description">${blocks.map(text=>`<p class="sequence-step">${escapeHtml(text).replace(/\(위력 ([\d.]+)%\)/g, '<strong class="effect-damage">(위력 $1%)</strong>').replace(/\[[^\]]+\]/g, '<span class="effect-keyword">$&</span>')}</p>`).join('')}</div>`;
  }
  const hitCount = Math.max(0, Number(skill.hits) || 0);
  const iconType = getHitIconType(skill);
  if (!hitCount) {
    return `<div class="hit-effect-row support"><span class="hit-badge ${iconType}">-</span><p>${skill.effect}</p></div>`;
  }
  const effects = getHitEffects(skill);
  return Array.from({ length: hitCount }, (_, index) => {
    const hitNumber = index + 1;
    const text = effects[hitNumber] || effects.default || "[적중 시] 효과 없음";
    return `
      <div class="hit-effect-row">
        <span class="hit-badge ${iconType}" aria-label="${hitNumber}타">${hitNumber}</span>
        <p>${text}</p>
      </div>
    `;
  }).join("");
}

function getHitIconType(skill) {
  const type = String(skill.type || "");
  if (type.includes("방어") || type.includes("회피") || type.includes("지원")) return "shield";
  return "sword";
}

function getHitEffects(skill) {
  const effect = String(skill.effect || "").trim();
  const hitCount = Math.max(0, Number(skill.hits) || 0);
  const effects = {};
  const rangeRegex = /(\d+)\s*~\s*(\d+)타\s*([^,]+)/g;
  let matched = false;
  let match;
  while ((match = rangeRegex.exec(effect))) {
    matched = true;
    const start = Number(match[1]);
    const end = Number(match[2]);
    const text = normalizeHitEffect(match[3]);
    for (let i = start; i <= end; i += 1) effects[i] = text;
  }
  const singleRegex = /(\d+)타\s*([^,]+)/g;
  while ((match = singleRegex.exec(effect))) {
    matched = true;
    effects[Number(match[1])] = normalizeHitEffect(match[2]);
  }
  if (!matched && effect) {
    effects.default = normalizeHitEffect(effect);
  }
  for (let i = 1; i <= hitCount; i += 1) {
    if (!effects[i] && effects.default) effects[i] = effects.default;
  }
  return effects;
}

function normalizeHitEffect(text) {
  const clean = String(text || "").replace(/^\s*,\s*/, "").trim();
  if (!clean) return "[적중 시] 효과 없음";
  if (clean.includes("[적중 시]") || clean.includes("[사용 시]") || clean.includes("[충돌 시]")) return clean;
  if (clean.includes("위력")) return clean;
  return `[적중 시] ${clean}`;
}

function moveBattleUnitTo(nextX, nextY) {
  const unit = getSelectedBattleUnit();
  if (unit.swapTargetId || unit.hp <= 0) return;
  if (unit.moveLeft <= 0) {
    pushBattleLog(`${unit.name}: 이동 가능 수 없음.`);
    renderBattleDummy();
    return;
  }
  if (Math.abs(unit.x - nextX) + Math.abs(unit.y - nextY) !== 1) {
    pushBattleLog(`${unit.name}: 가까운 1칸만 이동 가능.`);
    renderBattleDummy();
    return;
  }
  if (nextX < 1 || nextX > 8 || nextY < 1 || nextY > 5) {
    pushBattleLog(`${unit.name}: 전장 밖으로 이동 불가.`);
    renderBattleDummy();
    return;
  }
  const blocked = [...battleDummy.allies, ...battleDummy.enemies].some((other) => other.id !== unit.id && other.x === nextX && other.y === nextY && other.hp > 0);
  if (blocked) {
    pushBattleLog(`${unit.name}: 해당 칸 점유 중.`);
    renderBattleDummy();
    return;
  }
  unit.x = nextX;
  unit.y = nextY;
  unit.moveLeft -= 1;
  unit.movedThisTurn = true;
  pushBattleLog(`${unit.name}: (${nextX}, ${nextY})로 이동. 이동 ${unit.moveLeft} / ${unit.move}`);
  renderBattleDummy();
}

function cancelPendingBattleAction() {
  const pending = battleDummy.aiming;
  if (!pending) return;
  const unit = battleDummy.allies.find((entry) => entry.id === pending.unitId);
  if (unit) Object.assign(unit, pending.previous);
  battleDummy.aiming = null;
}

function cancelBattleSelection() {
  cancelPendingBattleAction();
  battleDummy.aiming = null;
  battleDummy.previewAction = null;
  battleDummy.previewSource = null;
  battleDummy.previewHandIndex = null;
  renderBattleDummy();
}

function reserveBattleSkill(index, pointer = {}) {
  battleDummy.focusedPlanId = null;
  battleDummy.focusedActionUnitId = battleDummy.selected;
  const unit = getSelectedBattleUnit();
  if (index === 'swap') { toggleBattleSwap(unit); return; }
  if (unit.swapTargetId || unit.hp <= 0) return;
  battleDummy.lastUnitClick = null;
  if (battleDummy.aiming?.unitId === unit.id && battleDummy.aiming.source === index) {
    battleDummy.suppressedPreview = { unitId: unit.id, index };
    cancelBattleSelection(); return;
  }
  cancelPendingBattleAction();
  const queue = unit.queuedActions ||= [];
  const selectedSlot = battleDummy.selectedActionSlot?.unitId === unit.id ? battleDummy.selectedActionSlot.index : null;
  const editIndex = selectedSlot != null && selectedSlot < queue.length ? selectedSlot : null;
  const existingIndex = queue.findIndex((entry) => index === entry.source || (entry.source === 'hand' && Number(index) === entry.handIndex));
  if (selectedSlot != null && existingIndex >= 0 && existingIndex !== editIndex) {
    pushBattleLog(`${unit.name}: 이 카드는 다른 슬롯에서 사용 중.`); renderBattleDummy(); return;
  }
  if (existingIndex >= 0 && editIndex !== existingIndex) {
    battleDummy.suppressedPreview = { unitId: unit.id, index };
    queue.splice(existingIndex, 1);
    syncBattleReservation(unit);
    battleDummy.aiming = null;
    battleDummy.previewAction = null;
    battleDummy.previewSource = null;
    battleDummy.previewHandIndex = null;
    pushBattleLog(`${unit.name}: 행동 취소.`);
    renderBattleDummy();
    return;
  }
  if (editIndex == null && queue.length >= (unit.actionCapacity || 1)) {
    pushBattleLog(`${unit.name}: 이번 턴 행동 수를 모두 예약함.`); renderBattleDummy(); return;
  }
  battleDummy.suppressedPreview = null;
  const previous = { reserved: unit.reserved, reservedSource: unit.reservedSource, reservedHandIndex: unit.reservedHandIndex, targetId: unit.targetId, decisionOrder: unit.decisionOrder };
  unit.targetId = null;
  if (index === "ego") {
    unit.reserved = unit.ego;
    unit.reservedSource = "ego";
    unit.reservedHandIndex = null;
  } else if (index === "guard") {
    unit.reserved = unit.guard;
    unit.reservedSource = "guard";
    unit.reservedHandIndex = null;
  } else {
    const handIndex = Number(index);
    const skillIndex = unit.hand[handIndex];
    unit.reserved = unit.skills[skillIndex];
    unit.reservedSource = "hand";
    unit.reservedHandIndex = handIndex;
  }
  battleDummy.aiming = { unitId: unit.id, source: index, previous, editIndex, startX: pointer.clientX, startY: pointer.clientY };
  if (unit.reserved.scope === "자신" || unit.reserved.scope.includes('자신 중심')) {
    unit.targetId = unit.id;
    unit.decisionOrder = ++battleDummy.decisionSequence;
    commitBattleReservation(unit);
    battleDummy.aiming = null;
  }
  battleDummy.previewAction = null;
  battleDummy.previewSource = null;
  battleDummy.previewHandIndex = null;
  pushBattleLog(`${unit.name}: ${unit.reserved.name} 예약.`);
  renderBattleDummy();
}

function assignBattleTarget(targetId, targetSlot = null) {
  const unit = getSelectedBattleUnit();
  if (!unit.reserved || battleDummy.aiming?.unitId !== unit.id) return;
  const target = [...battleDummy.allies, ...battleDummy.enemies].find((entry) => entry.id === targetId);
  if (!isBattleTargetInRange(unit, unit.reserved, target)) {
    pushBattleLog(`${unit.name}: 사거리 또는 대상 조건 불일치.`);
    renderBattleDummy();
    return;
  }
  unit.targetId = targetId;
  battleDummy.aiming.targetSlot = targetSlot;
  unit.decisionOrder = ++battleDummy.decisionSequence;
  commitBattleReservation(unit);
  battleDummy.aiming = null;
  pushBattleLog(`${unit.name}: 주 대상 ${target?.name || targetId} 지정.`);
  renderBattleDummy();
}

function commitBattleReservation(unit) {
  const queue = unit.queuedActions ||= [];
  const entry = {action: unit.reserved, source: unit.reservedSource, handIndex: unit.reservedHandIndex, targetId: unit.targetId, targetSlot: battleDummy.aiming?.targetSlot ?? null, decisionOrder: unit.decisionOrder};
  const index = battleDummy.aiming?.editIndex;
  const slot = index != null ? index : queue.length;
  if (index != null) queue[index] = entry;
  else queue.push(entry);
  if (battleDummy.selectedActionSlot?.unitId === unit.id) {
    battleDummy.selectedActionSlot = {unitId: unit.id, index: slot};
    battleDummy.focusedPlanId = `${unit.id}:${slot}`;
  }
  syncBattleReservation(unit);
}

function syncBattleReservation(unit) {
  const last = unit.queuedActions?.at(-1);
  unit.reserved = last?.action || null; unit.reservedSource = last?.source || null;
  unit.reservedHandIndex = last?.handIndex ?? null; unit.targetId = last?.targetId || null;
  unit.decisionOrder = last?.decisionOrder || 0;
}

const battleStatusRules = {
  상처: { debuff: true, effect: "피격 시 및 턴 종료 시 위력만큼 체력 피해, 횟수 1 소모" },
  잠식: { debuff: true, effect: "피격 시 및 턴 종료 시 위력만큼 정신 피해, 횟수 1 소모" },
  충격: { debuff: true, effect: "행동 위력 감소, 행동 또는 충돌 후 횟수 1 소모" },
  보호: { effect: "체력 피해를 위력만큼 감소, 피격 시 횟수 1 소모" },
  평정: { effect: "정신 피해를 위력만큼 감소, 정신 피해 시 횟수 1 소모" },
  회복: { effect: "부여 시 및 다음 턴 시작 시 위력만큼 체력 회복, 횟수 1 소모" },
  격려: { effect: "부여 시 및 다음 턴 시작 시 위력만큼 정신력 회복, 횟수 1 소모" },
  집중: { effect: "위력%의 치명타 확률, 치명타 발동 시 횟수 1 소모" },
  강타: { effect: "치명타 피해율에 위력% 추가, 치명타 피해 동작마다 횟수 1 소모" },
  자원: { effect: "자원 사용 효과의 비용 또는 공명에 사용" }
};

function getBattleStatus(unit, name) {
  return [...(unit.buffs || []), ...(unit.debuffs || [])].find((entry) => entry.name === name && entry.count > 0 && entry.power > 0);
}

function consumeBattleStatus(unit, name, count = 1) {
  const status = getBattleStatus(unit, name);
  if (!status) return;
  status.count = Math.max(0, status.count - count);
  unit.buffs = (unit.buffs || []).filter((entry) => entry.count > 0 && entry.power > 0);
  unit.debuffs = (unit.debuffs || []).filter((entry) => entry.count > 0 && entry.power > 0);
}

function addBattleStatus(unit, name, power, count = 1) {
  const rule = battleStatusRules[name];
  if (!rule || unit.hp <= 0) return;
  unit.buffs ||= [];
  unit.debuffs ||= [];
  const list = rule.debuff ? unit.debuffs : unit.buffs;
  let status = list.find((entry) => entry.name === name);
  if (!status) { status = { name, power: 0, count: 0, effect: rule.effect }; list.push(status); }
  const previousPower = status.power, previousCount = status.count;
  status.power = Math.min(100, Math.max(0, status.power + Number(power)));
  status.count = Math.min(100, Math.max(0, status.count + Number(count)));
  if (status.power > previousPower || status.count > previousCount) {
    recordBattleExecution('status-added', { unitId: unit.id, keyword: name,
      power: status.power - previousPower, count: status.count - previousCount,
      totalPower: status.power, totalCount: status.count });
  }
  pushBattleLog(`${unit.name}: [${name} ${status.power} / ${status.count}].`);
  if (name === "회복" || name === "격려") triggerBattleStatus(unit, name);
}

function triggerBattleStatus(unit, name) {
  const status = getBattleStatus(unit, name);
  if (!status || unit.hp <= 0) return;
  const power = status.power;
  consumeBattleStatus(unit, name);
  if (name === "잠식") changeBattleMentality(unit, -power, "잠식");
  else if (name === "상처") {
    applyBattleDamage(unit, unit, power, { statusDamage: true });
    pushBattleLog(`${unit.name}: 상처 피해 ${power}.`);
  } else if (name === "격려") changeBattleMentality(unit, power, "격려");
  else if (name === "회복") {
    const amount = Math.min(power, unit.maxHp - unit.hp);
    unit.hp += amount;
    pushBattleLog(`${unit.name}: 체력 ${amount} 회복.`);
  }
}

function resonateBattleStatus(unit, name) {
  const status = getBattleStatus(unit, name);
  if (!status || unit.hp <= 0) return;
  const value = status.power * status.count;
  consumeBattleStatus(unit, name, status.count);
  if (name === "잠식") changeBattleMentality(unit, -value, "잠식 공명");
  else if (name === "상처" || name === "충격") {
    applyBattleDamage(unit, unit, value, { statusDamage: true, ignoreProtection: true });
    if (name === "충격") unit.actionCanceled = true;
  } else if (name === "자원") addBattleStatus(unit, "보호", value, 1);
  else if (name === "집중") unit.criticalReady = true;
  else if (name === "강타") unit.criticalBonus = Math.min(100, value);
  pushBattleLog(`${unit.name}: [${name} 공명] ${value}.`);
  battleDummy.filament = Math.min(100, battleDummy.filament + 8);
}

function applyBattleEffectText(unit, target, text, defaultRecipients = [target]) {
  const affected = new Set();
  const parts = String(text || "").split(",");
  parts.forEach((part) => {
    let recipients = defaultRecipients;
    if (part.includes("아군 전체")) recipients = getBattleTeam(unit).filter((entry) => entry.hp > 0);
    else if (part.includes("정신력 최저 아군") || part.includes("아군 1명")) recipients = getBattleTeam(unit).filter((entry) => entry.hp > 0).sort((a, b) => a.sp - b.sp || a.id.localeCompare(b.id)).slice(0, 1);
    else if (part.includes("자신")) recipients = [unit];
    for (const match of part.matchAll(/\[(상처|잠식|충격|보호|평정|회복|격려|집중|강타|자원)(?:\s+(\d+)(?:\s*\/\s*(\d+))?|\s+(공명))\]/g)) {
      recipients.filter(Boolean).forEach((recipient) => {
        affected.add(recipient.id);
        if (match[4]) resonateBattleStatus(recipient, match[1]);
        else addBattleStatus(recipient, match[1], Number(match[2]), Number(match[3] || 1));
      });
    }
  });
  return [...affected];
}

function renderUnitStatusBadges(unit) {
  const statuses = [...(unit.buffs || []), ...(unit.debuffs || [])].filter((entry) => entry.count > 0 && entry.power > 0);
  if (!statuses.length) return "";
  return `<span class="unit-status-badges">${statuses.map((entry) => `<span class="${battleStatusRules[entry.name]?.debuff ? "debuff" : "buff"}" title="${escapeHtml(entry.effect)}">${escapeHtml(entry.name)} ${entry.power}/${entry.count}</span>`).join("")}</span>`;
}

let battleExecution = null;
let lastBattleExecution = null;
let battlePresentationActive = false;
let battleDefensePlans = new Map();

function snapshotBattleExecutionState() {
  return [...battleDummy.allies, ...battleDummy.enemies].map(unit => ({
    id: unit.id, name: unit.name, image: getBattleUnitImage(unit, battleDummy.allies.includes(unit) ? 'ally' : 'enemy'),
    side: battleDummy.allies.includes(unit) ? 'ally' : 'enemy',
    hp: unit.hp, maxHp: unit.maxHp, sp: unit.sp, x: unit.x, y: unit.y,
    statuses: [...(unit.buffs || []), ...(unit.debuffs || [])].map(status => ({ ...status }))
  }));
}

// Plain data only: a future motion player can consume these steps without rerolling combat.
function recordBattleExecution(type, details = {}) {
  if (!battleExecution) return;
  battleExecution.steps.push({
    sequence: battleExecution.steps.length + 1, order: battleExecution.order,
    type, ...JSON.parse(JSON.stringify(details)),
    units: snapshotBattleExecutionState(), filament: battleDummy.filament
  });
}

function getLastBattleExecution() {
  return lastBattleExecution ? JSON.parse(JSON.stringify(lastBattleExecution)) : null;
}

function resolveBattleTurn() {
  if (battleExecution || battlePresentationActive) return;
  battleExecution = { turn: battleDummy.turn, order: 0, status: 'running', steps: [] };
  try {
    executeBattleTurn();
    battleExecution.status = 'completed';
  } catch (error) {
    battleExecution.status = 'failed';
    recordBattleExecution('execution-error', { message: error.message });
    throw error;
  } finally {
    lastBattleExecution = battleExecution;
    battleExecution = null;
    battleDefensePlans.clear();
  }
  if (typeof window.playBattleExecution === 'function') return window.playBattleExecution(getLastBattleExecution());
}

function executeBattleTurn() {
  cancelPendingBattleAction();
  const schedule = getBattleSchedule();
  battleDefensePlans = new Map();
  schedule.events.flatMap(event=>event.plans).forEach(plan=>{
    if (!["방어", "회피", "반격"].includes(plan.action?.type)) return;
    plan.defenseHandled = false;
    const pending = battleDefensePlans.get(plan.unit.id) || [];
    pending.push(plan); battleDefensePlans.set(plan.unit.id,pending);
  });
  recordBattleExecution('turn-start', { schedule: schedule.events.map((event, index) => ({
    order: index + 1, plans: event.plans.map(plan => ({
      id: plan.id, unitId: plan.unit.id, targetId: plan.target?.id,
      slot: plan.slot, action: { ...plan.action }
    }))
  })) });
  battleDummy.phase = '행동 실행';
  schedule.events.forEach((event, index) => {
    battleExecution.order = index + 1;
    recordBattleExecution('action-start', { planIds: event.plans.map(plan => plan.id) });
    pushBattleLog(`행동 순번 ${index + 1}.`);
    if (event.plans.length === 2) resolveBattleClashEvent(event.plans[0], event.plans[1]);
    else resolveUnitAction(event.plans[0].unit, event.plans[0]);
    processBattleReplacements(true);
    recordBattleExecution('action-end', { planIds: event.plans.map(plan => plan.id) });
  });
  recordBattleExecution('turn-end-effects');
  [...battleDummy.allies, ...battleDummy.enemies].forEach((unit) => {
    triggerBattleStatus(unit, "상처");
    triggerBattleStatus(unit, "잠식");
    unit.guardReady = false;
    unit.activeGuard = null;
  });
  battleDummy.allies.forEach((unit) => {
    [...new Set(unit.consumedHandIndexes || [])].sort((a,b) => b-a).forEach((index) => {
      const [skill] = unit.hand.splice(index,1); if (skill != null) unit.discardPile.push(skill);
    });
    unit.consumedHandIndexes = [];
  });
  processBattleReplacements();
  battleDummy.turn += 1;
  battleDummy.selectedActionSlot = null;
  battleDummy.focusedPlanId = null;
  battleDummy.phase = "이동/행동 예약";
  battleDummy.waveIndex = Math.min(6, Math.max(0, battleDummy.waveIndex + (Math.random() > .42 ? 1 : -1)));
  battleDummy.allies.forEach((unit) => {
    unit.acted = false;
    unit.reserved = null;
    unit.queuedActions = [];
    unit.reservedSource = null;
    unit.reservedHandIndex = null;
    unit.targetId = null;
    unit.moveLeft = unit.move + (unit.nextMoveBonus || 0);
    unit.nextMoveBonus = 0;
    unit.movedThisTurn = false;
    unit.actionCanceled = false;
    unit.decisionOrder = 0;
    drawBattleHand(unit);
  });
  battleDummy.enemies.forEach((enemy) => {
    enemy.actionCanceled = false;
  });
  battleDummy.aiming = null;
  battleDummy.previewAction = null;
  battleDummy.previewSource = null;
  battleDummy.previewHandIndex = null;
  [...battleDummy.allies, ...battleDummy.enemies].forEach((unit) => {
    triggerBattleStatus(unit, "회복");
    triggerBattleStatus(unit, "격려");
  });
  prepareEnemyActions();
  updateBattleActionCapacity();
  battleDummy.capacityTurn = battleDummy.turn;
  if (battleDummy.enemies.every((enemy) => enemy.hp <= 0)) pushBattleLog("전투 승리. 모든 개념물 소멸.");
  else if (battleDummy.allies.every((unit) => unit.hp <= 0)) {
    pushBattleLog((battleDummy.bench || []).some((unit) => unit.hp > 0) ? '대기 인원 투입 대기. 뒷줄 점유 중.' : '전투 패배. 아군 전원 전투 불능.');
  }
  pushBattleLog(`턴 ${battleDummy.turn} 시작. 적 선이동 완료.`);
  recordBattleExecution('turn-complete', { nextTurn: battleDummy.turn });
  battleDefensePlans.clear();
  if (typeof window.playBattleExecution !== 'function') renderBattleDummy();
}

function beginBattleAction(unit, action, target, plan = null) {
  const skip = reason => {
    recordBattleExecution('action-skipped', { unitId: unit.id, planId: plan?.id, reason });
    return false;
  };
  if (unit.hp <= 0 || unit.actionCanceled || unit.swapTargetId || plan?.canceled) return skip('unavailable');
  if (!action) {
    pushBattleLog(`${unit.name}: 행동 대기.`);
    return skip('no-action');
  }
  const defensive = ["방어", "회피", "반격"].includes(action.type);
  if (!defensive && !isBattleTargetInRange(unit, action, target)) {
    pushBattleLog(`${unit.name}: ${action.name} 지정 대상 사거리 밖 또는 전투 불능.`);
    return skip('out-of-range');
  }
  if (action === unit.ego) {
    if (unit.sp < action.cost) {
      pushBattleLog(`${unit.name}: 개념 폭주 정신력 부족.`);
      return skip('insufficient-mentality');
    }
    unit.sp = Math.max(0, unit.sp - action.cost);
    battleDummy.filament = Math.min(100, battleDummy.filament + 12);
    pushBattleLog(`${unit.name}: 기본 개념 폭주 [${action.name}] 발동. 정신력 -${action.cost}.`);
  } else if (battleDummy.allies.includes(unit) && action !== unit.guard) {
    const index = plan?.handIndex ?? unit.reservedHandIndex;
    if (index != null) (unit.consumedHandIndexes ||= []).push(index);
  }
  if (action.effect.includes("[사용 시]") && !isBattleSupportAction(action)) applyBattleEffectText(unit, target || unit, action.effect);
  recordBattleExecution('action-used', { unitId: unit.id, targetId: target?.id,
    planId: plan?.id, action: { ...action } });
  return true;
}

function activateBattleDefense(unit, action, plan, attacker = null) {
  if (plan?.defenseHandled) return false;
  if (plan) plan.defenseHandled = true;
  if (!beginBattleAction(unit, action, unit, plan)) return false;
  unit.guardReady = true;
  unit.activeGuard = action;
  unit.defenseWaveRoll = null;
  pushBattleLog(`${unit.name}: ${action.name}.`);
  recordBattleExecution('defense-ready', { unitId: unit.id, planId: plan?.id,
    defense: action.type, respondingToId: attacker?.id });
  return true;
}

function prepareIncomingDefense(unit, attacker) {
  // Reserved defenses can respond before their schedule slot, but each slot activates only once.
  if (unit.guardReady && unit.activeGuard) return;
  for (const plan of battleDefensePlans.get(unit.id) || []) {
    if (!plan.defenseHandled && activateBattleDefense(unit, plan.action, plan, attacker)) return;
  }
}

function resolveUnitAction(unit, plan = null) {
  const action = plan?.action || unit.reserved || unit.preparedAction;
  if (["방어", "회피", "반격"].includes(action?.type)) {
    activateBattleDefense(unit, action, plan);
    return;
  }
  const requested = plan?.target || findActionTarget(unit, action || {});
  const target = isBattleWholeAreaAction(action) && !isBattleTargetInRange(unit, action, requested)
    ? (isBattleSupportAction(action) ? getBattleTeam(unit) : [...battleDummy.enemies, ...battleDummy.allies].filter(entry=>!getBattleTeam(unit).includes(entry)))
      .find(entry=>isBattleTargetInRange(unit, action, entry))
    : requested;
  if (!beginBattleAction(unit, action, target, plan)) return;
  if (isBattleSupportAction(action)) {
    if (action.sequence) {
      const targets = getActionTargets(unit, action, target);
      recordBattleExecution('support-start', { unitId: unit.id, targetId: target.id, targetIds: targets.map(entry=>entry.id), planId: plan?.id, action: { ...action } });
      const roll = rollHitPower(unit, action);
      recordBattleExecution('support-roll', { unitId: unit.id, planId: plan?.id, hit: 1, roll });
      action.sequence.forEach((step, i) => {
        const affected = applyBattleEffectText(unit, target, step.effect, targets);
        recordBattleExecution('support-applied', { unitId: unit.id, targetId: target.id, targetIds: affected, planId: plan?.id, hit: i + 1, effect: step.effect });
      });
      recordBattleExecution('support-end', { unitId: unit.id, planId: plan?.id });
      battleDummy.filament = Math.min(100, battleDummy.filament + 6);
      return;
    }
    const targets = getActionTargets(unit, action, target);
    const effects = getHitEffects(action);
    const count = Math.max(1, action.hits || 0);
    let waveSum = 0;
    recordBattleExecution('support-start', { unitId: unit.id, targetId: target.id,
      targetIds: targets.map(entry=>entry.id), planId: plan?.id, action: { ...action }, hits: count });
    for (let hit = 1; hit <= count; hit++) {
      if (action.hits > 0) {
        const roll = rollHitPower(unit, action, { hit, previousWaveSum: waveSum });
        waveSum = roll.waveSum;
        recordBattleExecution('support-roll', { unitId: unit.id, planId: plan?.id, hit, roll });
      }
      const effect = effects[hit] || effects.default || action.effect;
      const affected = effect.includes('[사용 시]') && hit > 1 ? []
        : applyBattleEffectText(unit, target, effect, targets);
      recordBattleExecution('support-applied', { unitId: unit.id, targetId: target.id,
        targetIds: affected, planId: plan?.id, hit, effect });
    }
    battleDummy.filament = Math.min(100, battleDummy.filament + 6);
    pushBattleLog(`${unit.name}: ${action.name}. ${action.effect}`);
    recordBattleExecution('support-end', { unitId: unit.id, planId: plan?.id });
    return;
  }
  const remainingHits = Math.max(1, action.hits || 1);
  const damage = resolveRemainingHits(unit, action, target, remainingHits, { planId: plan?.id });
  consumeBattleStatus(unit, "충격");
  battleDummy.filament = Math.min(100, battleDummy.filament + 6);
  pushBattleLog(`${unit.name}: ${action.name} → ${target.name}. 피해 ${damage}.`);
  if (target.hp <= 0) {
    pushBattleLog(`${target.name} 소멸.`);
  }
}

function resolveBattleClashEvent(a, b) {
  if (!beginBattleAction(a.unit, a.action, b.unit, a)) { resolveUnitAction(b.unit, b); return; }
  if (!beginBattleAction(b.unit, b.action, a.unit, b)) {
    resolveRemainingHits(a.unit, a.action, b.unit, a.action.hits, { planId: a.id });
    consumeBattleStatus(a.unit, "충격");
    return;
  }
  if (a.action.sequence || b.action.sequence) {
    recordBattleExecution('clash-start', { attackerId: a.unit.id, defenderId: b.unit.id, attackerPlanId: a.id, defenderPlanId: b.id, attackerHits: 0, defenderHits: 0 });
    const attackerRoll = rollHitPower(a.unit, a.action, { clash: true });
    const defenderRoll = rollHitPower(b.unit, b.action, { clash: true });
    const winner = attackerRoll.total === defenderRoll.total ? null : attackerRoll.total > defenderRoll.total ? a : b;
    const loser = winner === a ? b : a;
    recordBattleExecution('clash-roll', { round: 1, attackerId: a.unit.id, defenderId: b.unit.id, attackerRoll, defenderRoll });
    recordBattleExecution('clash-compare', { round: 1, attackerPower: attackerRoll.total, defenderPower: defenderRoll.total, winnerId: winner?.unit.id, parry: true });
    recordBattleExecution('clash-end', { attackerId: a.unit.id, defenderId: b.unit.id, winnerId: winner?.unit.id });
    const winningRoll = winner === a ? attackerRoll : defenderRoll;
    const followupRoll = winner ? { ...winningRoll,
      total: getPowerAtWave(winner.unit, winner.action, winningRoll.wave) } : null;
    // Consume clash debuffs before the follow-up can apply new statuses.
    consumeBattleStatus(a.unit, '충격'); consumeBattleStatus(b.unit, '충격');
    if (winner) {
      loser.canceled = true;
      recordBattleExecution('action-canceled', { planId: loser.id, unitId: loser.unit.id, reason: 'parried' });
      changeBattleMentality(winner.unit, 10, '패링 성공');
      if (winner.action.parryEffect) applyBattleEffectText(winner.unit, loser.unit, winner.action.parryEffect);
      pushBattleLog(`${winner.unit.name}: 패링 성공. ${loser.unit.name} 행동 취소.`);
      recordBattleExecution('clash-followup', { unitId: winner.unit.id, targetId: loser.unit.id, planId: winner.id });
      resolveRemainingHits(winner.unit, winner.action, loser.unit, winner.action.hits,
        { planId: winner.id, actionRoll: followupRoll });
    } else {
      a.canceled = b.canceled = true;
      recordBattleExecution('action-canceled', { planId: a.id, unitId: a.unit.id, reason: 'parry-tie' });
      recordBattleExecution('action-canceled', { planId: b.id, unitId: b.unit.id, reason: 'parry-tie' });
    }
    return;
  }
  const result = resolveClash(a.unit, a.action, b.unit, b.action, { attackerPlanId: a.id, defenderPlanId: b.id,
    targetIds: [...new Set([...getActionTargets(a.unit,a.action,b.unit), ...getActionTargets(b.unit,b.action,a.unit)].map(unit=>unit.id))] });
  consumeBattleStatus(a.unit, "충격");
  consumeBattleStatus(b.unit, "충격");
  if (result.defenderHits <= 0) {
    b.canceled = true;
    recordBattleExecution('action-canceled', { planId: b.id, unitId: b.unit.id, reason: 'hits-destroyed' });
    resolveRemainingHits(a.unit, a.action, b.unit, result.attackerHits, { planId: a.id });
  } else if (result.attackerHits <= 0) {
    a.canceled = true;
    recordBattleExecution('action-canceled', { planId: a.id, unitId: a.unit.id, reason: 'hits-destroyed' });
    resolveRemainingHits(b.unit, b.action, a.unit, result.defenderHits, { planId: b.id });
  } else {
    a.canceled = b.canceled = true;
    recordBattleExecution('clash-stalemate', { planIds: [a.id, b.id], limit: 128 });
    pushBattleLog("장기 동률 충돌. 양쪽 행동 상쇄.");
  }
  battleDummy.filament = Math.min(100, battleDummy.filament + 6);
}

function resolveClash(attacker, attackerAction, defender, defenderAction, options = {}) {
  let attackerHits = Math.max(1, attackerAction.hits || 1);
  let defenderHits = Math.max(1, defenderAction.hits || 1);
  let round = 1;
  recordBattleExecution('clash-start', { attackerId: attacker.id, defenderId: defender.id,
    attackerHits, defenderHits, ...options });
  while (attackerHits > 0 && defenderHits > 0 && round <= 128) {
    const attackerRoll = rollHitPower(attacker, attackerAction, { clash: true, remainingHits: attackerHits });
    const defenderRoll = rollHitPower(defender, defenderAction, { clash: true, remainingHits: defenderHits });
    recordBattleExecution('clash-roll', { round, attackerId: attacker.id, defenderId: defender.id,
      attackerHits, defenderHits, attackerRoll, defenderRoll, ...options });
    recordBattleExecution('clash-compare', { round, attackerPower: attackerRoll.total,
      defenderPower: defenderRoll.total, winnerId: attackerRoll.total === defenderRoll.total ? null
        : attackerRoll.total > defenderRoll.total ? attacker.id : defender.id });
    if (attackerRoll.total === defenderRoll.total) {
      pushBattleLog(`충돌 ${round}: ${attacker.name} ${attackerRoll.total} / ${defender.name} ${defenderRoll.total}. 동률 재판정.`);
      round += 1;
      continue;
    }
    if (attackerRoll.total > defenderRoll.total) {
      const destroyedHit = defenderHits;
      defenderHits -= 1;
      recordBattleExecution('hit-destroyed', { round, unitId: defender.id,
        planId: options.defenderPlanId, hit: destroyedHit, remainingHits: defenderHits });
      pushBattleLog(`충돌 ${round}: ${attacker.name} ${attackerRoll.total} > ${defender.name} ${defenderRoll.total}. 적 타수 파괴.`);
    } else {
      const destroyedHit = attackerHits;
      attackerHits -= 1;
      recordBattleExecution('hit-destroyed', { round, unitId: attacker.id,
        planId: options.attackerPlanId, hit: destroyedHit, remainingHits: attackerHits });
      pushBattleLog(`충돌 ${round}: ${attacker.name} ${attackerRoll.total} < ${defender.name} ${defenderRoll.total}. 아군 타수 파괴.`);
    }
    round += 1;
  }
  if (defenderHits <= 0) changeBattleMentality(attacker, 10, "충돌 승리");
  else if (attackerHits <= 0) changeBattleMentality(defender, 10, "충돌 승리");
  recordBattleExecution('clash-end', { attackerId: attacker.id, defenderId: defender.id,
    attackerHits, defenderHits, winnerId: defenderHits <= 0 ? attacker.id : attackerHits <= 0 ? defender.id : null });
  return {
    attackerHits,
    defenderHits,
    defenderCanceled: defenderHits <= 0
  };
}

function resolveRemainingHits(unit, action, target, hitCount, options = {}) {
  if (action.sequence) return resolveSequenceAction(unit, action, target, options);
  let damage = 0;
  let waveSum = 0;
  const targets = getActionTargets(unit, action, target);
  // A deliberately selected ally remains a primary target for a single-target action.
  if (action.scope === "단일" && !targets.includes(target)) targets.push(target);
  recordBattleExecution('attack-start', { unitId: unit.id, targetId: target?.id,
    targetIds: targets.map(entry=>entry.id), planId: options.planId, action: { ...action }, hits: hitCount, isCounter: !!options.isCounter });
  for (let hit = 1; hit <= hitCount; hit += 1) {
    if (unit.hp <= 0) break;
    const livingTargets = targets.filter((entry) => entry.hp > 0);
    if (!livingTargets.length) break;
    const roll = rollHitPower(unit, action, { hit, previousWaveSum: waveSum });
    waveSum = roll.waveSum;
    recordBattleExecution('attack-roll', { unitId: unit.id, planId: options.planId, hit, roll });
    const focus = getBattleStatus(unit, "집중");
    const strong = getBattleStatus(unit, "강타");
    const critical = unit.criticalReady || (focus && Math.random() * 100 < focus.power);
    const multiplier = critical ? 1.5 + ((strong?.power || 0) + (unit.criticalBonus || 0)) / 100 : 1;
    const effects = getHitEffects(action);
    const effect = effects[hit] || effects.default || "";
    livingTargets.forEach((entry) => {
      const total = Math.max(1, Math.floor(roll.total * multiplier));
      const amount = entry !== target && action.effect.includes("절반 피해") ? Math.max(1, Math.floor(total / 2)) : total;
      damage += applyBattleDamage(unit, entry, amount, { allowCounter: !options.isCounter,
        planId: options.planId, hit, critical: !!critical, attackPower: roll.total });
      if (!entry.lastHitEvaded && !effect.includes("[사용 시]") && !effect.includes("[충돌 시]")) applyBattleEffectText(unit, entry, effect);
      recordBattleExecution('hit-effects-applied', { unitId: unit.id, targetId: entry.id,
        planId: options.planId, hit, effect, evaded: entry.lastHitEvaded });
    });
    if (critical) consumeBattleStatus(unit, "집중");
    if (critical) consumeBattleStatus(unit, "강타");
    unit.criticalReady = false;
    unit.criticalBonus = 0;
    pushBattleLog(`${action.name} ${hit}타: 파형 ${formatSigned(roll.wave)} / 누적 ${formatSigned(waveSum)}, 위력 ${roll.total}.`);
  }
  recordBattleExecution('attack-end', { unitId: unit.id, planId: options.planId, damage });
  return damage;
}

function displaceSequenceUnit(source, target, distance, retreat = false) {
  const dx = target.x - source.x, dy = target.y - source.y;
  const sx = Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx) || 1 : 0;
  const sy = sx ? 0 : Math.sign(dy) || 1;
  const moving = retreat ? source : target;
  const sign = retreat ? -1 : 1;
  let wall = false;
  for (let n = 0; n < distance; n++) {
    const x = moving.x + sx * sign, y = moving.y + sy * sign;
    if (x < 1 || x > 8 || y < 1 || y > 5 || (battleDummy.walls || []).some(tile=>tile.x === x && tile.y === y)) { wall = true; break; }
    if ([...battleDummy.allies, ...battleDummy.enemies].some(unit=>unit !== moving && unit.hp > 0 && unit.x === x && unit.y === y)) break;
    moving.x = x; moving.y = y;
  }
  recordBattleExecution('unit-displaced', { unitId: moving.id, x: moving.x, y: moving.y, wall });
  return wall;
}

function resolveSequenceAction(unit, action, target, options = {}) {
  const targets = getActionTargets(unit, action, target);
  const roll = options.actionRoll || rollHitPower(unit, action);
  const totals = new Map();
  let damage = 0;
  recordBattleExecution('attack-start', { unitId: unit.id, targetId: target.id, targetIds: targets.map(entry=>entry.id), planId: options.planId, action: { ...action }, isCounter: !!options.isCounter });
  recordBattleExecution('attack-roll', { unitId: unit.id, planId: options.planId, hit: 1, roll, reused: !!options.actionRoll });
  action.sequence.forEach((step, index) => {
    if (unit.hp <= 0 || unit.actionCanceled) return;
    if (step.effectTiming === 'before') applyBattleEffectText(unit, target, step.effect);
    const focus = getBattleStatus(unit, '집중'), strong = getBattleStatus(unit, '강타');
    const critical = !!unit.criticalReady || !!(focus && Math.random() * 100 < focus.power);
    const multiplier = critical ? 1.5 + ((strong?.power || 0) + (unit.criticalBonus || 0)) / 100 : 1;
    if (step.ratio > 0 && critical) consumeBattleStatus(unit, '집중');
    if (critical) consumeBattleStatus(unit, '강타');
    unit.criticalReady = false; unit.criticalBonus = 0;
    targets.filter(entry=>entry.hp > 0).forEach(entry=>{
      const amount = Math.max(0, Math.floor(roll.total * step.ratio * multiplier));
      const dealt = applyBattleDamage(unit, entry, amount, { planId: options.planId, hit: index + 1, allowCounter: !options.isCounter, critical, attackPower: roll.total });
      damage += dealt; totals.set(entry.id, (totals.get(entry.id) || 0) + dealt);
      if (entry.lastHitEvaded) return;
      if (step.effectTiming !== 'before') applyBattleEffectText(unit, entry, step.effect);
      if (entry.hp > 0 && step.push && displaceSequenceUnit(unit, entry, step.push) && step.wallRatio) {
        damage += applyBattleDamage(unit, entry, Math.floor(totals.get(entry.id) * step.wallRatio), { statusDamage: true, planId: options.planId, hit: index + 1 });
      }
      recordBattleExecution('hit-effects-applied', { unitId: unit.id, targetId: entry.id, planId: options.planId, hit: index + 1, effect: step.effect });
    });
    if (step.retreat && unit.hp > 0) displaceSequenceUnit(unit, target, step.retreat, true);
    if (step.nextMove && unit.hp > 0) unit.nextMoveBonus = (unit.nextMoveBonus || 0) + step.nextMove;
  });
  recordBattleExecution('attack-end', { unitId: unit.id, planId: options.planId, damage });
  return damage;
}

function changeBattleMentality(unit, amount, reason) {
  const composure = amount < 0 ? getBattleStatus(unit, "평정") : null;
  if (composure) {
    amount = -Math.max(0, -amount - composure.power);
    consumeBattleStatus(unit, "평정");
  }
  const previous = unit.sp;
  unit.sp = Math.max(0, Math.min(100, unit.sp + amount));
  recordBattleExecution('mentality-changed', { unitId: unit.id, before: previous, after: unit.sp, reason });
  pushBattleLog(`${unit.name}: ${reason}, 정신력 ${formatSigned(unit.sp - previous)} (${unit.sp}).`);
}

function applyBattleDamage(attacker, target, amount, options = {}) {
  if (target.hp <= 0) return 0;
  target.lastHitEvaded = false;
  if (!options.statusDamage) prepareIncomingDefense(target, attacker);
  if (!options.statusDamage && target.guardReady && target.activeGuard?.type === "회피") {
    const defenseRoll = target.activeGuard.legacy ? (target.defenseWaveRoll ||= rollHitPower(target, target.activeGuard)) : rollHitPower(target, target.activeGuard);
    const incomingPower = options.attackPower ?? amount;
    recordBattleExecution('defense-roll', { unitId: target.id, targetId: attacker.id, action: { ...target.activeGuard }, defense: '회피', roll: defenseRoll, incomingPower, success: defenseRoll.total >= incomingPower });
    if (defenseRoll.total >= incomingPower) {
      target.lastHitEvaded = true;
      pushBattleLog(`${target.name}: 회피 성공.`);
      battleDummy.filament = Math.min(100, battleDummy.filament + 3);
      recordBattleExecution('hit-evaded', { unitId: attacker.id, targetId: target.id, planId: options.planId, hit: options.hit });
      return 0;
    }
    target.guardReady = false;
    target.activeGuard = null;
  }
  if (!options.statusDamage && target.guardReady && target.activeGuard?.type === "방어") {
    const defenseRoll = target.activeGuard.legacy ? (target.defenseWaveRoll ||= rollHitPower(target, target.activeGuard)) : rollHitPower(target, target.activeGuard);
    const incomingPower = amount;
    amount = Math.max(0, amount - defenseRoll.total);
    recordBattleExecution('defense-roll', { unitId: target.id, targetId: attacker.id, action: { ...target.activeGuard }, defense: '방어', roll: defenseRoll, incomingPower, blocked: incomingPower - amount });
  }
  const protection = !options.ignoreProtection ? getBattleStatus(target, "보호") : null;
  const rawAmount = amount;
  if (protection) {
    amount = Math.max(0, amount - protection.power);
    consumeBattleStatus(target, "보호");
  }
  const previousHp = target.hp;
  target.hp = Math.max(0, target.hp - amount);
  recordBattleExecution('damage-applied', { unitId: attacker.id, targetId: target.id,
    planId: options.planId, hit: options.hit, requestedDamage: rawAmount,
    damage: previousHp - target.hp, beforeHp: previousHp, afterHp: target.hp,
    statusDamage: !!options.statusDamage, critical: !!options.critical });
  if (!options.statusDamage && rawAmount > 0 && !getBattleTeam(attacker).includes(target)) changeBattleMentality(attacker, 5, "적 적중");
  if (previousHp > 0 && target.hp === 0) {
    recordBattleExecution('unit-defeated', { unitId: target.id });
    getBattleTeam(target).filter((entry) => entry.id !== target.id && entry.hp > 0)
      .forEach((entry) => changeBattleMentality(entry, -10, "아군 사망"));
  }
  if (!options.statusDamage && target.hp > 0) {
    triggerBattleStatus(target, "상처");
    triggerBattleStatus(target, "잠식");
    if (options.allowCounter !== false && target.hp > 0 && target.guardReady && target.activeGuard?.type === "반격"
      && isBattleTargetInRange(target, target.activeGuard, attacker)) {
      target.guardReady = false;
      const counter = target.activeGuard;
      target.activeGuard = null;
      pushBattleLog(`${target.name}: 반격.`);
      recordBattleExecution('counter-start', { unitId: target.id, targetId: attacker.id, action: { ...counter } });
      resolveRemainingHits(target, counter, attacker, Math.max(1, counter.hits || 1), { isCounter: true });
    }
  }
  return previousHp - target.hp;
}

function rollHitPower(unit, action, context = {}) {
  let wave = 0;
  let waveSum = action.sequence ? 0 : context.previousWaveSum || 0;
  const waves = [];
  const count = action.sequence ? 1 : context.clash ? context.remainingHits ?? Math.max(1, action.hits || 1) : 1;
  for (let hit = 0; hit < count; hit += 1) {
    wave = rollWaveValue(unit.sp);
    waveSum += wave;
    waves.push({ hit: context.clash ? hit + 1 : context.hit || 1, wave, waveSum,
      power: getPowerAtWave(unit, action, waveSum, context) });
  }
  return { wave, waveSum, waves, basePower: action.power,
    startingPower: getPowerAtWave(unit, action, context.previousWaveSum || 0, context), waveValue: action.wave || 0,
    sp: unit.sp, total: getPowerAtWave(unit, action, waveSum, context) };
}

function getPowerAtWave(unit, action, wave, context = {}) {
  const clashBonus = context.clash ? Number(action.effect?.match(/\[충돌 시\]\s*기본 위력\s*\+(\d+)/)?.[1] || 0) : 0;
  const hitBonus = context.hit ? Number(action.effect?.match(new RegExp(`${context.hit}타 위력\\s*\\+(\\d+)`))?.[1] || 0) : 0;
  const movementBonus = action.sequence && unit.id === 'ryeona' && unit.movedThisTurn ? 1 : 0;
  const total = Math.max(1, action.power + (action.wave || 0) * wave + clashBonus + hitBonus + movementBonus - (getBattleStatus(unit, "충격")?.power || 0));
  return total;
}

function getWaveDistribution(sp = 50) {
  const focus = (Math.max(0, Math.min(100, sp)) - 50) / 50;
  const candidates = [-3, -2, -1, 0, 1, 2, 3].map((value) => ({
    value,
    weight: Math.max(.12, 1 + focus * value)
  }));
  const totalWeight = candidates.reduce((sum, entry) => sum + entry.weight, 0);
  return candidates.map((entry) => ({ value: entry.value, probability: entry.weight / totalWeight }));
}

function rollWaveValue(sp = 50) {
  let cursor = Math.random();
  for (const entry of getWaveDistribution(sp)) {
    cursor -= entry.probability;
    if (cursor <= 0) return entry.value;
  }
  return 0;
}

function formatSigned(value) {
  return `${Number(value) >= 0 ? "+" : ""}${value}`;
}

function getEnemyAction(enemy) {
  if (enemy.tutorialAction) {
    const action = enemy.tutorialAction;
    if (!action.sequence && action.hits > 0) {
      action.legacy = { ...action };
      action.sequence = [{ ratio: 1, effect: action.effect }];
      action.power = 18; action.wave = 3;
      action.effect = `무기로 적을 공격해 (위력 100%)의 피해를 입힙니다. ${describeSequenceKeywords(action.sequence[0].effect)}`;
    }
    return action;
  }
  const isSmoke = enemy.id === "e2";
  const isHeavy = enemy.id === "e3";
  return {
    name: enemy.intent || "개념물 공격",
    type: isHeavy ? "방어" : "개념",
    keyword: enemy.keyword || "충격",
    range: isHeavy ? 0 : isSmoke ? 3 : 1,
    scope: isHeavy ? "자신" : "단일",
    hits: isHeavy ? 0 : 2,
    power: isHeavy ? 15 : isSmoke ? 22 : 18,
    wave: isHeavy ? 4 : isSmoke ? 4 : 3,
    legacy: { hits: isHeavy ? 0 : 2, power: isHeavy ? 8 : isSmoke ? 14 : 8, wave: isSmoke ? 2 : 1, effect: `[${enemy.keyword || "충격 2 / 1"}]` },
    sequence: isHeavy ? undefined : [{ ratio: .5, effect: `[${enemy.keyword || "충격 2 / 1"}]` }, { ratio: .25, effect: '' }],
    effect: isHeavy ? '몸을 단단히 굳혀 들어오는 공격의 피해를 판정 위력만큼 줄입니다.' : `적에게 힘을 실어 부딪쳐 (위력 50%)의 피해를 입힙니다. ${describeSequenceKeywords(`[${enemy.keyword || '충격 2 / 1'}]`)} 이후 다시 적을 덮쳐 (위력 25%)의 피해를 입힙니다.`
  };
}

function consumeReservedCard(unit) {
  if (unit.reservedHandIndex == null) return;
  const [skillIndex] = unit.hand.splice(unit.reservedHandIndex, 1);
  if (skillIndex != null) unit.discardPile.push(skillIndex);
}

function findNearestEnemy(unit, action) {
  const range = typeof action.range === "number" ? action.range : 99;
  return battleDummy.enemies
    .filter((enemy) => enemy.hp > 0)
    .map((enemy) => ({ enemy, distance: Math.abs(unit.x - enemy.x) + Math.abs(unit.y - enemy.y) }))
    .filter((entry) => entry.distance <= range)
    .sort((a, b) => a.distance - b.distance)[0]?.enemy;
}

function findActionTarget(unit, action) {
  const allTargets = [...battleDummy.enemies, ...battleDummy.allies];
  const requested = allTargets.find((entry) => entry.id === unit.targetId);
  return isBattleTargetInRange(unit, action, requested) ? requested : null;
}

function pushBattleLog(line) {
  battleDummy.log.push(line);
}

function renderPrologueScene() {
  const player = document.querySelector("#prologue-player");
  if (!player) return;
  const scenes = getActiveStoryScenes();
  const scene = scenes[prologueSceneIndex];
  if (!scene) {
    advanceToNextStage();
    return;
  }
  if(scene.kind === 'battle') { startMindBattleTutorial(); return; }
  const lineText = scene.line || "";
  const awakeIndex = scenes.findIndex((item) => item.line === "‘음…’");
  const isCenterText = lineText === "목적을 잃고 떠도는 이들이여, 소원을 다시 떠올려 나아가라."
    || lineText === "[버려진 자들의 어둠 속에서 스스로 빛을 밝히고, 타인의 소원을 기꺼이 책임져라.]";
  const isMonologue = scene.kind === 'narration' || (!scene.kind && scene.name === "나");
  const isSpeakerlessNarration = !scene.kind && (scene.name === ""
    || (scene.name === "???"
      && scene.affiliation === "???"
      && !/[\"“”]/.test(lineText)));
  const showSpeakerBlock = !isMonologue && !isSpeakerlessNarration;
  const isPreAwake = awakeIndex !== -1 && prologueSceneIndex < awakeIndex;
  const visualClass = [
    "visual-novel",
    isCenterText ? "center-message" : "",
    isPreAwake && !isCenterText ? "system-boot" : ""
  ].filter(Boolean).join(" ");
  const characterMarkup = !isPreAwake && !isCenterText
    ? getStandingPlacements(getSceneCharacterEntries(scene)).map((entry) => {
        const isSpeaking = entry.active ?? entry.alt === scene.name;
        return `
          <img class="vn-character vn-character-${entry.side || "center"} ${isSpeaking ? "is-speaking" : "is-muted"}"
            src="${entry.src}" alt="${entry.alt || ""}" data-height-cm="${entry.heightCm}"
            style="--standing-height:${entry.canvasHeight}%;--standing-bottom:${entry.bottom}%" draggable="false">
        `;
      }).join("")
    : "";
  const bootMarkup = isPreAwake && !isCenterText
    ? `
      <div class="eisenberg-screen" aria-hidden="true">
        <div class="eisenberg-logo">
          <span class="eisenberg-mark">E</span>
          <strong>EISENBERG</strong>
          <small>prosthetic cranial interface</small>
        </div>
        <div class="boot-columns">
          <pre>root://eisenberg.cranium.boot
neural_bridge.init()
body_owner.transfer = forced
memory.fetch(last_breath)
permission.override = denied
fallback.common_sense = damaged
visual_sensor.relink()
...
status: unstable</pre>
          <pre>00101100 10111001 11101011
module_call: nerve / success
module_call: body / success
module_call: central / failed
access_key: expired
network: disconnected
life_support: converted
identity: unreadable
signal: searching</pre>
        </div>
      </div>
    `
    : "";
  const storyMarkup = isCenterText
    ? `
      <div class="center-line" id="dialogue-line" role="button" tabindex="0"></div>
    `
    : `
      <div class="vn-character-layer" aria-hidden="true">${characterMarkup}</div>
      <div class="dialogue-box ${isMonologue ? "monologue" : ""}" id="dialogue-box" role="button" tabindex="0">
        ${showSpeakerBlock ? `<div class="speaker-block"><strong>${getSpeakerLabel(scene)}</strong></div>` : ""}
        <p id="dialogue-line"></p>
      </div>
    `;
  typedText = "";
  isTyping = true;
  clearTimeout(autoTimer);
  clearTimeout(typeTimer);
  player.innerHTML = `
    <div class="${visualClass}" style="--scene-bg: url('${scene.background}')" tabindex="0">
      <button class="vn-menu-button" type="button" id="vn-menu-button" aria-label="메뉴">☰</button>
      ${bootMarkup}
      ${storyMarkup}
      <aside class="vn-menu-panel" id="vn-menu-panel">
        <div class="vn-menu-actions">
          <button class="ghost-button" type="button" id="log-open">로그</button>
          <button class="ghost-button" type="button" id="auto-toggle">AUTO ${autoAdvance ? "ON" : "OFF"}</button>
          <button class="ghost-button" type="button">설정</button>
          <button class="ghost-button" type="button" id="vn-exit">나가기</button>
          <button class="ghost-button" type="button" id="vn-skip">스킵</button>
        </div>
      </aside>
      <aside class="vn-log-modal" id="vn-log-modal" aria-hidden="true">
        <div class="vn-log-window">
          <button class="vn-log-close" type="button" id="log-close" aria-label="로그 닫기">×</button>
          <h3>대화 로그</h3>
          <div class="log-list">
            ${scenes.slice(0, prologueSceneIndex + 1).map((item) => `
              <p>${item.kind === 'narration' || (!item.kind && item.name === '나') ? '' : `<strong>${escapeHtml(getSpeakerLabel(item))}</strong>`}${escapeHtml(item.line)}</p>
            `).join("")}
          </div>
        </div>
      </aside>
    </div>
  `;

  const visualNovel = document.querySelector(".visual-novel");
  visualNovel.addEventListener("click", (event) => {
    if (event.target.closest(".vn-menu-button, .vn-menu-panel, .vn-log-modal")) return;
    advanceDialogue();
  });
  visualNovel.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      advanceDialogue();
    }
  });
  visualNovel.focus();
  document.querySelector("#vn-menu-button").addEventListener("click", (event) => {
    event.stopPropagation();
    document.querySelector("#vn-menu-panel").classList.toggle("open");
  });
  document.querySelector("#vn-menu-panel").addEventListener("click", (event) => {
    event.stopPropagation();
  });
  document.querySelector("#log-open").addEventListener("click", (event) => {
    event.stopPropagation();
    const logModal = document.querySelector("#vn-log-modal");
    logModal.classList.add("open");
    logModal.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      const logList = logModal.querySelector(".log-list");
      if (logList) logList.scrollTop = logList.scrollHeight;
    });
  });
  document.querySelector("#log-close").addEventListener("click", (event) => {
    event.stopPropagation();
    document.querySelector("#vn-log-modal").classList.remove("open");
    document.querySelector("#vn-log-modal").setAttribute("aria-hidden", "true");
  });
  document.querySelector("#vn-log-modal").addEventListener("click", (event) => {
    event.stopPropagation();
    if (event.target.id === "vn-log-modal") {
      event.currentTarget.classList.remove("open");
      event.currentTarget.setAttribute("aria-hidden", "true");
    }
  });
  document.querySelector("#auto-toggle").addEventListener("click", (event) => {
    event.stopPropagation();
    autoAdvance = !autoAdvance;
    renderPrologueScene();
  });
  document.querySelector("#vn-exit").addEventListener("click", (event) => {
    event.stopPropagation();
    showChapterMap(activeChapterId);
  });
  document.querySelector("#vn-skip").addEventListener("click", (event) => {
    event.stopPropagation();
    const nextBattle = scenes.findIndex((item,index) => index > prologueSceneIndex && item.kind === 'battle');
    prologueSceneIndex = nextBattle >= 0 && !completedTutorials.has(activeStageId) ? nextBattle : scenes.length - 1;
    renderPrologueScene();
  });
  typeDialogue(lineText);
}

function typeDialogue(text) {
  const line = document.querySelector("#dialogue-line");
  if (!line) return;
  let index = 0;
  const tick = () => {
    index += 1;
    typedText = text.slice(0, index);
    line.textContent = typedText;
    if (index < text.length) {
      typeTimer = setTimeout(tick, 45);
      return;
    }
    completeTyping(text);
  };
  tick();
}

function completeTyping(text) {
  const line = document.querySelector("#dialogue-line");
  if (line) line.textContent = text;
  typedText = text;
  isTyping = false;
  clearTimeout(typeTimer);
  clearTimeout(autoTimer);
  const scenes = getActiveStoryScenes();
  if (autoAdvance && prologueSceneIndex < scenes.length - 1) {
    autoTimer = setTimeout(() => {
      prologueSceneIndex += 1;
      renderPrologueScene();
    }, 1500);
  } else if (autoAdvance && prologueSceneIndex >= scenes.length - 1) {
    autoTimer = setTimeout(advanceToNextStage, 1500);
  }
}

function advanceDialogue() {
  const scenes = getActiveStoryScenes();
  const scene = scenes[prologueSceneIndex];
  if (!scene) return;
  if (isTyping) {
    completeTyping(scene.line || "");
    return;
  }
  if (prologueSceneIndex < scenes.length - 1) {
    prologueSceneIndex += 1;
    renderPrologueScene();
    return;
  }
  advanceToNextStage();
}

function advanceToNextStage() {
  clearTimeout(autoTimer);
  clearTimeout(typeTimer);
  const chapterData = chapterStages[activeChapterId] || chapterStages.ch0;
  const currentIndex = chapterData.stages.findIndex((item) => item.id === activeStageId);
  const nextStage = chapterData.stages[currentIndex + 1];
  if (!nextStage) {
    showChapterMap(activeChapterId);
    return;
  }
  showChapterMap(activeChapterId);
  selectStage(nextStage.id);
}

function renderIdentities() {
  const grid = document.querySelector("#identity-grid");
  const roleFilter = document.querySelector("#role-filter");

  function draw() {
    const role = roleFilter.value;
    const filtered = identities.filter((item) => role === "all" || item.role === role);
    grid.innerHTML = filtered.map((item, index) => `
      <button class="identity-card ${index === 0 ? "active" : ""}" data-identity="${item.name}" style="--roster-bg:url('${item.background}')">
        <img src="${item.image}" alt="${item.name} ${item.identity}">
        <span class="identity-info">
          <span class="eyebrow">이동 ${item.move}칸 · ${roleLabel(item.role)}</span>
          <h4>${item.name}</h4>
          <p>${item.identity}</p>
          <span class="tag-row">${item.keywords.map((tag, tagIndex) => `<span class="tag ${tagIndex === 1 ? "blue" : tagIndex === 2 ? "green" : ""}">${tag}</span>`).join("")}</span>
        </span>
      </button>
    `).join("");

    grid.querySelectorAll(".identity-card").forEach((card) => {
      card.addEventListener("click", () => selectIdentity(card.dataset.identity));
    });

    if (filtered[0]) selectIdentity(filtered[0].name);
  }

  roleFilter.addEventListener("change", draw);
  draw();
}

function roleLabel(role) {
  return { front: "전열", support: "지원", control: "제어" }[role] || "전체";
}

function selectIdentity(name) {
  const item = identities.find((identity) => identity.name === name);
  document.querySelectorAll(".identity-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.identity === name);
  });

  document.querySelector("#identity-detail").innerHTML = `
    <img src="${item.image}" alt="${item.name} 선택 이미지">
    <div>
      <p class="eyebrow">${roleLabel(item.role)} · 이동 ${item.move}칸</p>
      <h3>${item.name} / ${item.identity}</h3>
      <p class="summary">${item.description}</p>
      <div class="skill-list">
        ${item.skills.map((skill, index) => `
          <div class="skill">
            <span>${index < 4 ? `${index + 1}스킬` : "수비"}</span>
            <strong>${skill}</strong>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderFilaments() {
  const board = document.querySelector("#filament-board");
  board.innerHTML = filaments.map(([name, virtue, status, color, glow]) => `
    <article class="filament-card ${status === "미획득" ? "locked" : ""}" style="--orb:${color};--glow:${glow}">
      <div class="filament-orb" aria-hidden="true"></div>
      <h4>${name}</h4>
      <p>${virtue}의 미덕</p>
      <span class="tag ${status === "획득" ? "green" : status === "진행 중" ? "blue" : ""}">${status}</span>
    </article>
  `).join("");
}

function renderFormationArtwork(item) {
  return `<img class="slot-character" src="${item.image}" alt="${item.name}" draggable="false">
    <img class="slot-logo" src="${item.logo}" alt="${item.name} 로고" draggable="false">
    <strong class="slot-name">${item.name}</strong>`;
}

function renderSquad() {
  const slots = document.querySelector("#squad-slots");
  const squad = identities;
  slots.innerHTML = squad.map((item, index) => `
    <article class="slot-card" data-slot="${String(index + 1).padStart(2, "0")}" style="--slot-bg: url('${item.background}')">
      ${renderFormationArtwork(item)}
      <div>
        <h4>${item.name}</h4>
        <p>${item.identity}</p>
        <span class="tag-row">${item.keywords.slice(0, 2).map((tag) => `<span class="tag">${tag}</span>`).join("")}</span>
      </div>
    </article>
  `).join("");
}

renderChapters();
renderIdentities();
renderFilaments();
renderSquad();

