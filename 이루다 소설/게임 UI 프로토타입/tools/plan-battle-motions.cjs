const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const existingPlan=path.join(root,'assets/battle/motions/motion-plan.json');
if(fs.existsSync(existingPlan)&&JSON.parse(fs.readFileSync(existingPlan,'utf8')).jobs.some(job=>job.status!=='planned')){
  throw new Error('Generated motion plan exists. Preserve completed jobs; write a versioned plan instead.');
}
const context=vm.createContext({window:{},document:{querySelectorAll:()=>[]},console});
vm.runInContext(fs.readFileSync(path.join(root,'battle-tutorial.js'),'utf8'),context);
const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
vm.runInContext(source.slice(0,source.indexOf('renderChapters();',source.lastIndexOf('function renderSquad'))),context);
vm.runInContext(fs.readFileSync(path.join(root,'battle-sprites.js'),'utf8'),context);
const roster=JSON.parse(vm.runInContext('JSON.stringify(createBattleRoster())',context));
const motifs={
  eojil:['Tablet retained in left hand; deliberate precise pointing thrusts with right hand, sharply controlled geometric blue prediction marks.','forward fingertip thrust','cross-body palm thrust','decisive two-finger pointing thrust'],
  eojyeo:['Rabbit plush stays with her; sleepy movements release violet dream ribbons, never give her a sword.','low sleepy palm wave','swaying shoulder and plush outward','forward dream-projecting hand'],
  eora:['Keep cylinder and scientific utility silhouette; blue gravity control through hand gestures, no invented gun.','low gravity-pinning palm','upturned rearranging hand','strong outward releasing palm'],
  sosuh:['Keep brown ponytail, beard and right-hand short dagger, experienced compact knife technique.','horizontal dagger slash','reverse diagonal dagger cut','precise forward dagger thrust'],
  eodo:['Keep two-eye-hole paper bag head and enormous broad body; bare gloved fists and shoulders, no added face or weapon.','heavy backhand punch','shoulder shove','downward hammer fist'],
  gena:['Keep black/crimson hair, fangs and a BROAD axe, not a pickaxe; athletic fierce adult woman.','low axe sweep','diagonal axe chop','overhead axe smash'],
  dorok:['Keep brown-haired tactical man and symmetric harness; controlled coordinates and paired precise hand gestures, no new oversized weapon.','forward coordinate-pointing hand','cross-body symmetric gesture','two-handed force release'],
  ryeona:['Keep brown hair goggles orange right eye detonator; wrench and small handheld pyrotechnic charges only.','wrench flick from wrist','throw compact pyrotechnic charge','press detonator while bracing'],
  getne:['Keep white hair red ribbon red eyes; reassuring gloved hand and clean white/gold sacred marks.','open-palm white light strike','draw short sacred mark with fingertip','protective outstretched palm']
};
const jobs=roster.map(unit=>{
  const sprite=context.window.battleSpriteAssets[unit.name];
  const frames=[
    {key:'move',label:'충돌 접근',pose:'forward running stride, torso leaned toward right, one leading foot near ground, coat trailing left'},
    {key:'clash',label:'충돌',pose:'firm forward interception pose, braced front leg, tool or forearm raised to meet an incoming strike from the right'},
    {key:'clash-loss',label:'충돌 패배',pose:'stagger backward toward left, torso recoiling, bent knees, equipment retained, pained but alive'},
    {key:'clash-win',label:'충돌 승리',pose:'confident forward follow-through, stable stance, tool or fist directed right, not a victory dance'},
    {key:'hurt',label:'피격',pose:'distinct hit reaction: chest recoils, face winces, arms instinctively protect abdomen, no wounds or gore'},
    {key:'defense',label:unit.guard.name,pose:unit.guard.type==='회피'?'low lateral dodge, bent knees, torso pulled backward, preserve balance':unit.guard.type==='반격'?'compact ready-to-counter posture, tool or striking hand near hip, lead forearm guarding':'broad braced guard, both forearms protect head and chest'}
  ];
  unit.skills.forEach((skill,i)=>{
    for(let hit=1;hit<=Math.max(1,skill.hits);hit++)frames.push({key:`skill-${i+1}-hit-${hit}`,label:`${skill.name} · ${hit}타`,skillName:skill.name,hit,pose:`Skill ${i+1} named ${skill.name}, ${skill.type}, hit ${hit} of ${Math.max(1,skill.hits)}: ${motifs[unit.id][1+(hit-1)%3]}. ${hit===1?'Initiating committed motion':hit===skill.hits?'Decisive finishing follow-through':'Reverse-direction linking strike'}, visibly different silhouette from adjacent attacks. ${i===3?'Strongest normal skill, wider stable stance and forceful extension.':''}`});
  });
  for(let hit=1;hit<=Math.max(1,unit.ego.hits);hit++)frames.push({key:`overdrive-hit-${hit}`,label:`${unit.ego.name} · ${hit}타`,skillName:unit.ego.name,hit,pose:`Special concept overdrive ${unit.ego.name}, hit ${hit}: ${motifs[unit.id][1+(hit-1)%3]}, dramatic but anatomically grounded extension, small character-specific concept accent only; keep the same outfit and body proportions`});
  const prompt=`Use case: identity-preserve. Asset type: transparent game combat KEY-POSE sprite sheet (not continuous animation). Reference image 1 is the immutable approved small-head SD character and body proportions. Reference image 2 is the original standing illustration for identity and costume only; do NOT adopt its more detailed rendering.\nDraw ONLY ${unit.name}, the same person in every cell. ${motifs[unit.id][0]}\nExactly FOUR columns and FIVE rows of equal rectangular cells, row-major order. Requested canvas 2048x2560, cell 512x512. No drawn grids, text, numbers, labels, backdrop, ground plane or shadow. Genuine transparent alpha background. Each pose centered inside its own cell with 8% safety padding; no limb, weapon or effect crosses a cell boundary. Feet at local y=480, body uses consistent drawing scale in all cells: neutral standing body about 400px tall, consistent small anatomical head about 70px, 5-6-head-tall impression, maintain the APPROVED reference skull size and limb lengths. Bent and running poses become lower naturally: never resize individual poses to fill cells. Facing SCREEN RIGHT in a consistent shallow three-quarter side view. Keep simplified chunky dark contours and flat cel shadow planes of reference1, original Iruda style, no imitation of other game characters. Preserve facial traits, hair, gender, costume colors, glove/boot details and weapon scale/handedness. Entire body and tools visible. Use a distinct genuine redrawn articulated pose per cell, not rotated copies of the idle image.\nCell order:\n${frames.map((frame,index)=>`${index+1}: ${frame.pose}`).join('\n')}\n${frames.length+1} through 20: leave those remaining cells COMPLETELY TRANSPARENT and empty. No extra characters. PNG with alpha, no checkerboard painted into pixels.`;
  return {id:unit.id,name:unit.name,reference:path.join(root,sprite.src),standing:path.join(root,unit.image),grid:[4,5],frames,prompt,status:'planned',sheet:null};
});
const out=path.join(root,'assets/battle/motions');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'motion-plan.json'),JSON.stringify({version:1,kind:'key-poses',jobs},null,2)+'\n');
fs.writeFileSync(path.join(out,'제작_프롬프트.md'), '# 전투 모션 핵심 포즈 제작\n\n기존 SD를 외형 기준으로 하고 스탠딩 일러를 보조 참조한다. 연속 프레임 애니메이션이 아닌 상태/타수별 핵심 포즈이며 이루리는 제외한다.\n\n'+jobs.map(j=>`## ${j.name}\n\n${j.prompt}\n`).join('\n'));
console.log(JSON.stringify(jobs.map(({id,name,reference,standing,frames})=>({id,name,reference,standing,count:frames.length}))));
