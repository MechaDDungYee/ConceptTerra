/* Episode text is adapted from the author's hospital manuscript. */
const HospitalData = (() => {
 const c=(label,next,stat=null,opts={})=>({label,next,stat,...opts});
 const scenes={
  ward:{floor:1,title:'낯선 천장',chapter:'01 / 깨어난 사람들',speaker:'나',objective:'병실 밖의 소리를 확인하기',text:'마지막 기억은 청량 제약회사의 임상시험 동의서였다. 보수가 좋다는 말에 서명을 했고, 그 뒤는 비어 있다.\n눈을 뜨자 얼룩진 천장과 멈춘 링겔이 보인다. 다른 침대에서도 사람들이 몸을 일으킨다. 창문 밖은 거대한 벽. 문 너머에서 낮은 소리가 들린다.',choices:[c('문 너머에 귀를 기울인다','knock','민첩',{success:'노크다. 그 뒤로 떨리는 목소리가 들린다. “저기요… 안에 누구 있어요?”',fail:'소리가 작아 알아듣기 어렵다. 잠시 뒤 문을 두드리는 소리가 커진다.'}),c('함께 깨어난 사람들을 확인한다','introduce')]},
  introduce:{floor:1,title:'같은 동의서',chapter:'01 / 깨어난 사람들',speaker:'동행자',objective:'병실 밖으로 나가기',text:'“저도 계약서를 쓰고 나서는 기억이 없어요.”\n서로 이름을 확인한다. 모두 생활비가 필요했고, 모두 청량에 지원했다. 누군가 침대 난간을 잡는다. 적어도 이 방에 혼자는 아니다.\n쿵, 쿵. 문밖에서 목소리가 들려온다. “여기 사람 있나요?”',choices:[c('문을 열어 본다','knock')]},
  knock:{floor:1,title:'문밖의 생존자',chapter:'01 / 깨어난 사람들',speaker:'진사준',objective:'로비의 생존자들과 합류하기',text:'회색 곱슬머리의 다부진 남자가 문 앞에 서 있다. 손에는 무기가 없다.\n“진사준입니다. 청랑도 낭주시에서 왔어요. 저도 여기서 깨어났어요. 아래에 다른 사람들이 있어요. 해칠 생각 없습니다.”\n그의 목소리는 당황스럽지만, 길을 알려 주려는 말에는 망설임이 없다.',choices:[c('진사준을 따라 로비로 간다','lobby',{},{trust:true}),c('거리를 두고 로비로 향한다','lobby')]},
  lobby:{floor:1,title:'내려간 셔터',chapter:'01 / 병원 로비',speaker:'진사준',objective:'식량과 의료품, 병원의 정보를 확보하기',text:'로비에는 진사준을 포함해 여덟 명이 모여 있다. 정문은 잠겼고 두꺼운 셔터가 내려와 있다. 창문 너머로 이어지는 높은 벽 때문에 밖으로 나갈 수도 없다.\n“약과 병상은 있어요. 우선 쓸 수 있는 것부터 모읍시다. 먹을 것, 의료품, 건물 배치도요.”',choices:[c('탕비실에서 식량을 모은다','supplies','민첩',{loot:'food'}),c('의료 창고를 수색한다','supplies','민첩',{loot:'medkit'}),c('계단의 배치도를 조사한다','supplies','지능',{note:'map'})]},
  supplies:{floor:1,title:'돌아가기 위해',chapter:'01 / 첫 번째 정비',speaker:'진사준',objective:'2층으로 올라가기',text:'찾아온 물품을 생존자들과 나눈다. 각자 다른 방에서 가져온 물건들이 로비 탁자에 쌓인다.\n출구는 보이지 않는다. 위쪽에 더 나은 길이 있을까. 누군가는 버티자고 하고, 누군가는 여기서 굶을 수는 없다고 말한다.',choices:[c('물품을 나누고 함께 올라간다','second',null,{share:true}),c('우선 이곳에서 버텨 보자고 한다','second',null,{stress:-5})]},
  second:{floor:2,title:'텅 빈 층',chapter:'02 / 윗층으로',speaker:'나',objective:'휴식과 식량을 확보한 뒤 3층으로 이동하기',text:'2층에는 사람들이 사라진 흔적만 남아 있다. 빈 침대와 열린 서랍. 바닥에는 한쪽 신발이 떨어져 있다.\n배고픔과 피로가 몰려온다. 위로 올라가기 전, 짧게라도 눈을 붙일 곳과 먹을 것을 찾아야 한다.',choices:[c('이 층을 수색한다','second',null,{search:true}),c('식량 1개로 함께 정비한다','second',null,{rest:true}),c('3층 계단을 오른다','barricade')]},
  barricade:{floor:3,title:'철제 의자의 방벽',chapter:'03 / 더 위로',speaker:'나',objective:'막힌 복도를 통과하기',text:'계단에 의자가 엉켜 있다. 방벽 너머로 익숙한 옷차림의 사람이 쓰러져 있다. 로비에서 먼저 올라갔던 생존자다.\n피에 엉긴 옷 가까이 흩어진 이상한 가루와 메모 한 장이 보인다. 위쪽에서 쿵, 쿵, 무언가 두드리는 소리가 난다.',choices:[c('남겨진 메모를 조사한다','barricade','지능',{note:'father',once:'father'}),c('의자를 치우고 길을 연다','whispers','근력',{combat:'fate',fail:'의자가 넘어지며 큰 소리가 난다. 복도 끝의 그림자가 돌아본다.',success:'의자를 조심스럽게 치웠다. 좁은 길이 드러난다.'}),c('우회할 통로를 찾아간다','whispers','민첩',{stress:-3})]},
  whispers:{floor:3,title:'기이한 울음소리',chapter:'04 / 미지와의 조우',speaker:'나',objective:'소리를 내지 않고 위층으로 이동하기',text:'어둠 속에서 누군가 웅크린 채 울고 있다. 사람이라고 부르기에는 움직임이 이상하다.\n바닥에서 아이의 낙서가 붙은 노트를 발견한다. 뒤쪽에는 어른이 서툰 글씨로 남긴 말이 있다. “집에 혼자 있는 딸이 생각난다.”',choices:[c('숨을 죽이고 복도를 지난다','fourth','민첩',{note:'girl',combat:'fate'}),c('계단의 방벽을 뚫는다','fourth','근력',{combat:'fate'}),c('이 층의 남은 물품을 찾는다','whispers',null,{search:true})]},
  fourth:{floor:4,title:'알고 싶지 않은 사실',chapter:'05 / 실험의 흔적',speaker:'나',objective:'청량의 실험 기록을 조사하기',text:'썩은 악취. 부서진 무기. 복도에는 돌아오지 못한 사람들이 남아 있다.\n푸른 꽃 사무소가 남긴 기록에는 사람들을 보호하라는 의뢰가 통제로 바뀌었다고 적혀 있다. 실험 참가자는 하나씩 사라졌고, 개념체는 하나씩 늘어났다.\n조금 떨어진 곳에서 무거운 짐승의 숨소리가 들린다.',choices:[c('사무소의 기록과 실험 일기를 읽는다','fourth','지능',{note:'experiment',once:'experiment',stress:-5}),c('숨소리를 피해 5층으로 향한다','radio','민첩',{combat:'tiger'}),c('의료 창고를 조심스럽게 찾는다','fourth',null,{search:true})]},
  radio:{floor:5,title:'깨진 무전기',chapter:'07 / 이걸 작동하게만 한다면',speaker:'진사준',objective:'방전된 무전기의 전원 확보하기',text:'화면에 금이 간 무전기를 찾았다. 외관은 아직 쓸 만하다. 문제는 완전히 방전된 배터리다.\n계단에서 늑대의 울음이 터지더니 갑자기 뚝 멎는다. 복도 끝에 밝은 눈이 떠 있다. 검은 천에 싸인 거대한 해골이, 어느새 우리 뒤에 서 있다.',choices:[c('움직이지 않고 그를 지켜본다','hope',null,{blessing:true}),c('동행자의 손을 잡고 거리를 둔다','hope',null,{stress:5})]},
  hope:{floor:5,title:'어두운 곳에서 더욱 빛나는',chapter:'07 / 희망의 실마리',speaker:'나',objective:'배터리 또는 비상 전력망 찾기',text:'그 존재는 가장 지친 동행자를 오래 바라보았다. 공격하지는 않는다. 잠시 뒤, 마지막까지 남아 있던 안광도 사라진다.\n이제 선택해야 한다. 6층에서 무전기 배터리를 찾을 것인가. 1층으로 내려가 비상 전력을 연결할 것인가. 옥상으로 계속 오르는 길은 너무 위험하다.',choices:[c('6층에서 충전된 배터리를 찾는다','sixth'),c('1층으로 내려가 비상 전력을 찾는다','generator'),c('무전기를 수리한 뒤 6층으로 간다','sixth','지능',{stress:5})]},
  sixth:{floor:6,title:'눈 다친 산군의 영역',chapter:'07 / 배터리를 찾아서',speaker:'나',objective:'산군에게 들키지 않고 배터리 확보하기',text:'바닥을 긁는 큰 발톱 자국. 창고에는 망가진 무전기가 있다. 그 배터리는 아직 충전되어 있다.\n두 눈을 잃은 산군은 청각과 후각으로 이 층을 배회한다. 죄 없는 사람을 공격하며 이야기 속 산군과 달라진 존재. 싸우는 것보다 지나가는 편이 나을지도 모른다.',choices:[c('조용히 배터리를 빼낸다','signal','민첩',{combat:'tiger',battery:true}),c('산군을 막으며 배터리를 확보한다','signal',null,{battle:'tiger',battery:true})]},
  generator:{floor:1,title:'남겨진 전력',chapter:'07 / 다시 로비로',speaker:'나',objective:'정병헌을 무력화하고 전력망 연결하기',text:'돌아온 로비는 더 이상 사람들이 기다리던 장소가 아니다. 냉장고만 비상 전력을 끌어다 쓰고 있다.\n정병헌이 길을 가로막는다. 다른 사람들의 희생으로 버텨 온 그의 말에는 더 이상 함께 살아남겠다는 뜻이 없다. 전력망을 쓰려면 그를 지나야 한다.',choices:[c('그를 막고 전력망을 확보한다','signal',null,{battle:'human',battery:true,route:'ground'})]},
  signal:{floor:6,title:'응답',chapter:'08 / 구조 신호',speaker:'무전기 너머',objective:'구조대가 합류할 때까지 버티기',text:'배터리를 연결하자 잡음 사이로 여러 목소리가 들린다.\n“거기, 들립니까? 정확한 위치와 생존자 수를 알려 주세요.”\n상황을 설명하자 상대의 말투가 바뀐다. 밖에서 진입해 우리와 합류하겠다고 한다. 그런데 복도 너머의 개념체도 소리에 반응하기 시작했다.',choices:[c('문을 막고 구조대가 올 때까지 버틴다','ending',null,{battle:'wave'})]},
  ending:{floor:6,title:'노력의 결실',chapter:'EPILOGUE / 살아남은 사람들',speaker:'나',objective:'탈출 완료',text:'구조대가 닫힌 문을 열었다. 우리는 무기를 내려놓았다. 몸에 힘이 빠져, 이번에는 정말로 쓰러지고 말았다.\n다시 눈을 뜨자 낯선 천장이다. 하지만 코끝에 썩은 악취가 없다. 곁에는 함께 버텨 온 사람들이 있다.\n버텨 낸 시간은 헛되지 않았다. 우리는 살아남았다.',choices:[]}
 };
 // A stray empty object would otherwise be mistaken for a stat name.
 scenes.knock.choices[0].stat=null;
 const notes={
  map:{title:'훼손된 병원 배치도',text:'정문 셔터는 1층. 병실과 탕비실은 각 층에 있다. 계단은 위로 이어지지만 여러 구간에 방벽이 세워져 있다. 옥상 밖도 외곽 황야다. 출구보다 먼저 연락 수단이 필요하다.'},
  father:{title:'난 올라갈거다',text:'“집에 혼자 있는 딸이 생각난다. 돈 벌려고 이런 일을 겪을 줄이야. 좀 귀찮게 여기지 말고 놀아주기라도 할걸 그랬다.”\n남자는 함께 올라온 두 사람을 지키며 불침번을 섰다. 마지막 글씨는 일그러져 있다. “여자애 이름 물어볼걸.”'},
  girl:{title:'아저씨 이거 봐요',text:'서툰 낙서와 꾹 눌러 쓴 글씨. 사람들을 흉내 낸 그림 옆에, 집으로 돌아갈 때 하고 싶은 것들이 적혀 있다. 이 병원에서 서로를 지키려 했던 사람들이 있었다.'},
  experiment:{title:'개념체 증폭 실험 일기',text:'치릴사력 1705년 3월 18일 / 연구 담당자 차독진\n정제되지 않은 콘세타닐을 대량 주입하여 정신 그릇을 붕괴시킨다. 제4국 국제 타워 대공장 27-1 섹터 대참사를 참고했다. 인간뿐 아니라 소문과 민속신앙도 실험 대상으로 삼고 있다.\n실종된 참가자와 늘어나는 개념체. 두 가지는 하나의 실험이었다.'}
 };
 const actions=[
  {id:'attack',name:'기초 공격',stat:'근력',ratio:1.5,cost:0,description:'근력의 150%로 판정합니다. 성공 시 근력만큼 피해. 대성공 시 근력 × (1 + 지능 × 2.5%)만큼 피해.'},
  {id:'break',name:'부수기',stat:'근력',ratio:.75,cost:25,description:'체력 25 소모. 성공 시 근력의 150%만큼 피해. 대성공 시 추가로 행동 불가 2턴. 실패 시 이번 턴 피해량 25% 감소.'},
  {id:'firm',name:'굳건',stat:'근력',ratio:.75,cost:10,description:'체력 10 소모. 성공 시 이번 턴 받는 피해 20% 감소. 대성공 시 45% 감소.'},
  {id:'meaning',name:'의미 부여',stat:'지능',ratio:.75,cost:5,description:'체력 5 소모. 정신 상태가 양수일 때 사용 가능. 성공 시 3턴, 대성공 시 6턴 동안 모든 동행자의 정신 상태를 지능의 50%만큼 높입니다.'},
  {id:'heal',name:'치료 가방',cost:0,description:'소지품 1개를 소비하여 자신의 체력 25 회복.'},
  {id:'move',name:'전후방 이동',cost:0,description:'이번 행동을 사용하여 전열 또는 후열로 이동합니다.'}
 ];
 const items={food:{name:'식량',description:'정비할 때 1개 소비. 생존자 전원의 체력 12% 회복, 정신 상태 +3, 공포 15 감소.'},medkit:{name:'치료 가방',description:'체력 25 회복, 출혈 제거. 전투에서는 응급 처치로 동행자에게 사용.'},bandage:{name:'붕대',description:'체력 50% 이상일 때 체력 10 회복, 출혈 제거.'}};
 const enemies={fate:{name:'운명에서 도망치려는 자',str:28,int:22,agi:25,max:155,damage:28,reduce:.28,special:'정신을 갉아먹는 손길'},tiger:{name:'눈 다친 산군',str:45,int:25,agi:40,max:260,damage:45,reduce:.3,special:'날카로운 이빨'},human:{name:'정병헌',str:38,int:28,agi:32,max:220,damage:38,reduce:.25,special:'무차별 공격'},wave:{name:'운명을 거스르지 못한 자',str:32,int:25,agi:30,max:190,damage:32,reduce:.32,special:'불안한 공격'}};
 // Branches retain the episode's main route, but decisions no longer force an exit.
 scenes.knock.choices=[c('진사준을 믿고 따라간다','lobby',null,{event:'trust'}),c('정체와 상황을 더 묻는다','jin_talk'),c('거리를 두고 로비로 간다','lobby',null,{event:'distance'}),c('진사준에게 무기를 겨눈다','jin_warning',null,{event:'threat'})];
 scenes.jin_talk={floor:1,title:'믿을 수 있는 사람인가',chapter:'01 / 문밖의 생존자',speaker:'진사준',objective:'진사준에 대한 태도를 결정하기',text:'“나도 피해자예요. 셔터를 열려고 했지만 안 됐어요. 로비에 사람들이 있습니다.”\n남자는 양손을 보여 준다. 함께 움직일지, 모르는 사람을 믿지 않을지는 우리의 결정이다.',choices:[c('설명을 받아들이고 함께 간다','lobby',null,{event:'trust'}),c('동행은 거절하고 따로 간다','lobby',null,{event:'distance'}),c('거짓말이라며 공격을 준비한다','jin_warning',null,{event:'threat'})]};
 scenes.jin_warning={floor:1,title:'물러설 기회',chapter:'01 / 문밖의 생존자',speaker:'진사준',objective:'싸울지 물러설지 결정하기',text:'진사준은 뒤로 물러나 공격을 피한다. “싸우러 온 게 아닙니다. 지금 멈추면 없던 일로 하죠.”\n그는 출구를 막지 않는다. 하지만 더 공격한다면 자신도 가만히 있지는 않을 것이다.',choices:[c('무기를 내리고 사과한다','lobby',null,{event:'apologize'}),c('말없이 지나간다','lobby',null,{event:'distance'}),c('끝까지 공격한다','jin_result',null,{event:'fight',battle:'jin'})]};
 scenes.jin_result={floor:1,title:'쓰러진 생존자',chapter:'01 / 돌이킬 수 있는 선택',speaker:'나',objective:'진사준을 어떻게 대할지 결정하기',text:'진사준은 쓰러졌지만 살아 있다. 떨리는 손으로 일어나려 한다.\n그는 더 싸울 생각이 없다. 로비 쪽에서 사람들이 이쪽을 바라본다.',choices:[c('살려 두고 치료 가방 1개를 건넨다','lobby',null,{event:'spare',requires:'medkit'}),c('살려 두지만 동행은 거절한다','lobby',null,{event:'reject'}),c('끝내 목숨을 빼앗는다','camp_confrontation',null,{event:'kill'})]};
 scenes.camp_confrontation={floor:1,title:'로비의 적대',chapter:'01 / 선택의 대가',speaker:'생존자',objective:'생존자들의 반응에 대응하기',text:'“우리를 도우려던 사람을 죽였어?”\n생존자들이 물품을 끌어안고 길을 막는다. 이제 우리를 향한 시선에는 공포와 적의가 섞여 있다.',choices:[c('무기를 내려놓는다','bound'),c('로비를 버리고 위층으로 달아난다','second',null,{event:'exile'}),c('생존자들과도 싸운다','second',null,{battle:'survivors',event:'camp_fight'})]};
 scenes.bound={floor:1,title:'불신의 거리',chapter:'01 / 선택의 대가',speaker:'생존자',objective:'관계를 수습하거나 떠나기',text:'우리는 무장을 내려놓고 떨어져 앉는다. 생존자들은 우리를 감시하지만, 더 공격하지 않는다.\n“물품 정리부터 도와요. 다시 믿을 수 있을지는 모르겠지만.”',choices:[c('물품 정리를 돕는다','lobby',null,{event:'reconcile'}),c('도움을 거절하고 혼자 올라간다','second',null,{event:'exile'})]};
 scenes.supplies={floor:1,title:'누구의 물품인가',chapter:'01 / 첫 번째 정비',speaker:'나',objective:'찾아온 물품의 배분을 결정하기',text:'찾아온 물품을 탁자 앞에 내려놓는다. 아직 누구에게도 건네지 않았다.\n생존자들도 자신의 물품을 모으고 있다. 우리 몫을 챙길 수도, 함께 버틸 자원을 보탤 수도 있다.',choices:[c('찾아온 물품을 전부 나눈다','camp_plan',null,{event:'donate'}),c('절반은 챙기고 절반은 나눈다','camp_plan',null,{event:'half'}),c('우리에게 필요하다며 전부 챙긴다','camp_plan',null,{event:'keep'}),c('물품을 찾지 못했다고 숨긴다','camp_plan',null,{event:'hide'})]};
 scenes.camp_plan={floor:1,title:'남을까, 올라갈까',chapter:'01 / 출발의 결정',speaker:'생존자',objective:'다음 행동을 결정하기',text:'“밖으로 나가는 길이 위에 있을지도 몰라요.”\n다른 이는 셔터 앞에 앉아 고개를 젓는다. “구조대가 올 수도 있잖아요.”\n계단도 로비도 안전을 보장하지 않는다.',choices:[c('진사준에게 동행을 제안하고 올라간다','second',null,{event:'together'}),c('우리끼리 올라간다','second',null,{event:'alone'}),c('로비에 남아 기다린다','camp_wait',null,{event:'wait'}),c('로비의 방벽을 보강한다','camp_plan','근력',{event:'secure',once:'secure'})]};
 scenes.camp_wait={floor:1,title:'기다리는 사람들',chapter:'01 / 로비에 머물기',speaker:'나',objective:'계속 기다리거나 탐색을 시작하기',text:'셔터 밖에서는 아무런 응답이 없다. 계단 위에서 희미한 소리가 흘러내린다.\n식량은 줄어들고, 기다림이 길어질수록 사람들이 흔들린다. 그래도 아직 올라가지 않기로 선택할 수 있다.',choices:[c('조금 더 기다린다','camp_wait',null,{event:'wait'}),c('불안정해 보이는 생존자를 살핀다','camp_wait','지능',{event:'watch',once:'watch'}),c('동행을 제안하고 올라간다','second',null,{event:'together'}),c('우리끼리 올라간다','second',null,{event:'alone'})]};
 scenes.camp_return={floor:1,title:'다시 만난 로비',chapter:'01 / 남겨 둔 사람들',speaker:'생존자',objective:'소식과 물품을 전하거나 탐색으로 돌아가기',text:'로비로 돌아왔다. 남겨 둔 사람들에게 무엇을 전할 것인가.\n위에서 확인한 위험을 알리거나, 물품을 보태거나, 도움을 요청할 수 있다.',choices:[c('실험 기록을 보여 주고 위험을 경고한다','camp_return',null,{event:'warn',requires:'experiment',once:'warn'}),c('식량 1개를 건넨다','camp_return',null,{event:'gift',requires:'food',once:'gift'}),c('치료 가방을 요청한다','camp_return',null,{event:'aid',once:'aid'}),c('탐색하던 층으로 돌아간다','second',null,{event:'return'})]};
 scenes.second.choices.push(c('로비로 돌아간다','camp_return',null,{event:'back'}));
 scenes.fourth.choices.push(c('확인한 사실을 로비에 전하러 간다','camp_return',null,{event:'back'}));
 enemies.jin={name:'진사준',str:55,int:40,agi:65,max:420,damage:42,reduce:.25,special:'제압',person:true};
 enemies.survivors={name:'로비의 생존자들',str:35,int:30,agi:35,max:300,damage:35,reduce:.15,special:'필사적인 저항',person:true};
 for(const [id,item] of Object.entries(items))item.image=`assets/items/${id}.png`;
 const discoveries={battery:{name:'무전기 전원',image:'assets/items/battery.png',description:'무전기에 전력을 공급합니다. 배터리 또는 발전기 연결을 확보하면 구조 신호를 보낼 수 있습니다. 탐색 진행에 자동으로 사용되는 중요한 물품입니다.'}};
 const traits=[
  {id:'brain',name:'두뇌파',kind:'start',opposite:'muscle',stats:[-1,2,0],description:'지능 +2 · 근력 -1'},
  {id:'muscle',name:'육체파',kind:'start',opposite:'brain',stats:[2,-1,0],description:'근력 +2 · 지능 -1'},
  {id:'cautious',name:'피해망상',kind:'start',opposite:'reckless',stats:[0,0,3],mental:-3,description:'민첩 +3 · 시작 정신 상태 -3'},
  {id:'reckless',name:'안전불감증',kind:'start',opposite:'cautious',stats:[0,0,-3],mental:3,description:'민첩 -3 · 시작 정신 상태 +3'},
  {id:'selfish',name:'자기중심적',kind:'start',opposite:'dependent',mental:3,affinity:-2,description:'시작 정신 상태 +3 · 동행자와 시작 호감도 -2'},
  {id:'dependent',name:'타인의존적',kind:'start',opposite:'selfish',mental:-3,affinity:2,description:'시작 정신 상태 -3 · 동행자와 시작 호감도 +2'},
  {id:'emotional',name:'감정적',kind:'start',opposite:'rational',stats:[0,-3,3],description:'지능 -3 · 민첩 +3'},
  {id:'rational',name:'이성적',kind:'start',opposite:'emotional',stats:[0,3,-3],description:'지능 +3 · 민첩 -3'},
  {id:'physical',name:'육체노동자',kind:'start',stats:[3,0,-1],mental:-2,description:'근력 +3 · 민첩 -1 · 시작 정신 상태 -2'},
  {id:'emotional-labor',name:'감정노동자',kind:'start',stats:[0,3,-1],mental:-2,description:'지능 +3 · 민첩 -1 · 시작 정신 상태 -2'},
  {id:'unemployed',name:'백수',kind:'unique',description:'추가 효과 없음. 기존 능력치 그대로 시작'},
  {id:'cleaner',name:'청소부',kind:'unique',description:'조사·수색 판정 시 정신 상태가 양수면 판정값 +2, 음수면 -2'},
  {id:'veteran',name:'전직 군인',kind:'unique',description:'정신 상태가 변할 때 50% 확률로 변동량이 절반. 소수점 버림'},
  {id:'religious',name:'종교인',kind:'unique',stats:[-2,0,0],description:'근력 -2 · 자신이 제공하는 회복량 +1'},
  {id:'boxer',name:'권투가',kind:'unique',description:'자신의 모든 판정값 +2 · 자신은 치료 가방·붕대 사용 불가'},
  {id:'inverted',name:'정신이상자',kind:'unique',description:'정신 상태 증가·감소 효과의 방향 반전. 시작 정신 상태는 그대로'},
  {id:'meddler',name:'참견자',kind:'unique',ability:'delegate',description:'다음 자신의 판정을 지정한 동행자가 대신합니다. 이후 그 동행자의 다음 판정은 자신이 대신합니다. 두 사람 모두 활동 가능할 때 적용'},
  {id:'repentant',name:'회개한 악인',kind:'unique',affinity:-3,description:'시작 호감도 -3 · 단체 이동 판정 시 50% 확률로 판정값 +13 · 성공하면 살아 있는 동행자 전원의 정신 상태 +1'},
  {id:'assassin',name:'암살자',kind:'unique',affinity:-3,stats:[-1,-1,3],description:'시작 호감도 -3 · 민첩 +3 · 근력·지능 -1'},
  {id:'prophet',name:'예언자',kind:'unique',ability:'predict',description:'턴당 1회, 다음 자신의 판정 성공·실패 예측. 맞으면 전원 정신 상태 +예언 중첩, 틀리면 -예언 중첩. 중첩 1~10, 정답 +1·오답 -1'},
  {id:'gambler',name:'도박사',kind:'unique',affinity:-3,ability:'reroll',description:'시작 호감도 -3 · 턴당 1회, 재시도를 예약하면 다음 자신의 실패 판정을 다시 굴립니다. 두 번째 결과를 반드시 사용'},
  {id:'speaker',name:'언변가',kind:'unique',ability:'encourage',description:'턴당 1회, 50% 확률로 살아 있는 동행자 전원의 정신 상태 +2 또는 -2'},
  {id:'deceiver',name:'사기꾼',kind:'unique',affinity:-3,stats:[-2,-2,-2],ability:'invert',description:'시작 호감도 -3 · 모든 능력치 -2 · 턴당 1회, 다음 자신의 판정 결과를 성공↔실패로 뒤집기. 대성공도 실패로 전환'},
  {id:'vigilante',name:'자경단',kind:'unique',ability:'protect',description:'체력이 절반 이하인 아군의 첫 방어를 대신하고 판정값 +1. 전투 턴당 1회. 보호를 꺼 두면 해당 상황에서 정신 상태 -1'}
 ];
 return {scenes,notes,actions,items,enemies,discoveries,traits};
})();
