const RankCombatData=(()=>{
 const all=[1,2,3,4];
 const skills=[
  {id:'attack',name:'맞서기',icon:'swords',users:[0,2],from:[1,2],to:[1,2],stat:'근력',damage:1,kind:'enemy',description:'근력만큼 피해. 가장 가까운 두 열의 적을 공격합니다.'},
  {id:'thrust',name:'길을 열다',icon:'swords',users:[0],from:[2,3],to:[1,2,3],stat:'근력',damage:.75,advance:1,kind:'enemy',description:'근력의 75% 피해를 입히고 앞으로 1열 이동합니다.'},
  {id:'firm',name:'굳건',icon:'shield',users:[0],from:[1,2],to:all,kind:'self',description:'다음 자신의 차례까지 받는 피해 50% 감소. 위치를 유지하며 버팁니다.'},
  {id:'heal',name:'응급 처치',icon:'heart-pulse',users:[0,1],from:all,to:all,kind:'ally',item:'medkit',description:'치료 가방 1개로 동행자 체력 25 회복. 빈사라면 체력 15%로 일으킵니다. 호감도와 종교인 특성 적용.'},
  {id:'aim',name:'비추어 쏘다',icon:'crosshair',users:[1],from:[3,4],to:[2,3,4],stat:'지능',damage:.8,kind:'enemy',description:'지능의 80% 피해. 손전등으로 뒤쪽의 적을 찾아 공격합니다.'},
  {id:'pull',name:'통로로 유인',icon:'arrow-down',users:[1],from:[3,4],to:[3,4],stat:'지능',damage:.4,pull:2,kind:'enemy',description:'지능의 40% 피해를 입히고 적을 앞으로 2열 끌어옵니다. 적의 위치별 기술을 방해합니다.'},
  {id:'meaning',name:'아직 끝이 아니야',icon:'sparkles',users:[1],from:[2,3,4],to:all,kind:'ally',stress:-15,mental:3,description:'동행자 한 명의 공포 15 감소, 정신 상태 +3. 호감도에 따른 지원 배율과 거절 적용.'},
  {id:'break',name:'방벽 밀어내기',icon:'arrow-up',users:[2],from:[1,2],to:[1,2],stat:'근력',damage:.8,push:2,stunCritical:1,kind:'enemy',description:'근력의 80% 피해를 입히고 뒤로 2열 밀칩니다. 치명타면 행동 불가 1회.'},
  {id:'sweep',name:'통로 쓸어내기',icon:'swords',users:[2],from:[1],to:[1,2],stat:'근력',damage:.55,area:true,kind:'enemy',description:'앞쪽 1·2열의 적에게 각각 근력의 55% 피해. 대상별로 명중을 판정합니다.'},
  {id:'guard',name:'내 뒤로 와',icon:'shield',users:[2],from:[1,2],to:all,kind:'ally',description:'다음 자신의 차례까지 지정 동행자의 공격을 대신 맞습니다. 기본 피해 50% 감소, 호감도에 따라 변동. 본인에게 사용하면 방어 자세.'},
  {id:'throw',name:'소리보다 빠르게',icon:'crosshair',users:[3],from:[2,3,4],to:all,stat:'민첩',damage:.8,bleed:6,bleedTurns:3,kind:'enemy',description:'민첩의 80% 피해. 출혈 6을 3차례 부여합니다. 출혈은 대상의 차례가 시작될 때 발생합니다.'},
  {id:'lunge',name:'틈새로 파고들기',icon:'swords',users:[3],from:[3,4],to:[1,2],stat:'민첩',damage:1,advance:2,kind:'enemy',description:'민첩만큼 피해를 입히고 앞으로 2열 이동합니다. 흐트러진 편성을 적극적으로 바꿉니다.'},
  {id:'silence',name:'시선을 돌려',icon:'ear',users:[3],from:[2,3,4],to:[3,4],stat:'민첩',damage:.3,stun:1,kind:'enemy',description:'민첩의 30% 피해. 후열의 적을 방해하여 다음 행동을 1회 취소합니다.'},
  {id:'calm',name:'호흡을 맞춰',icon:'heart-pulse',users:[3],from:[3,4],to:all,kind:'ally',stress:-10,dodge:15,description:'동행자 공포 10 감소, 다음 라운드의 대상 차례까지 회피율 +15%. 호감도에 따른 지원 배율 적용.'},
  {id:'move-front',name:'앞으로',icon:'arrow-right',users:all.map(n=>n-1),from:[2,3,4],to:all,kind:'move',move:-1,description:'앞쪽 동행자와 위치를 바꿉니다. 이번 차례의 행동을 소비합니다.'},
  {id:'move-back',name:'뒤로',icon:'arrow-left',users:all.map(n=>n-1),from:[1,2,3],to:all,kind:'move',move:1,description:'뒤쪽 동행자와 위치를 바꿉니다. 이번 차례의 행동을 소비합니다.'},
  {id:'wait',name:'숨 고르기',icon:'pause',users:all.map(n=>n-1),from:all,to:all,kind:'self',description:'행동을 넘기고 자신의 공포 3 감소. 어느 위치에서도 사용 가능합니다.'}
 ];
 const enemySkills={
  strike:{name:'덮치기',from:[1,2],to:[1,2],damage:1,stress:6},
  shove:{name:'짓눌러 밀기',from:[1,2],to:[1,2],damage:.8,stress:8,push:1},
  fear:{name:'기이한 울음',from:[3,4],to:[2,3,4],damage:.35,stress:16},
  reach:{name:'길게 뻗은 손',from:[2,3,4],to:all,damage:.65,stress:8,pull:1},
  scramble:{name:'흐트러뜨리기',from:all,to:all,damage:.5,stress:10,push:1}
 };
 return {skills,enemySkills};
})();
