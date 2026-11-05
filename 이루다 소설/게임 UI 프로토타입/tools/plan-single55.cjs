const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'assets/battle/motions/single55');
const old = JSON.parse(fs.readFileSync(path.join(root, 'assets/battle/motions/motion-plan.json')));
const chosen = JSON.parse(fs.readFileSync(path.join(root, 'assets/battle/sd/sd-55/selection-records.json'))).selection;
const locks = {
  eojil: 'Adult woman, long black hair, gold flower hairpin, blue diamond earrings, gray-blue eyes, black/gold long coat with royal-blue lining and tie, two gold waist buckles, black/gold gloves and boots. Tablet in anatomical LEFT hand; small nibbed writing pen in anatomical RIGHT hand for attacks.',
  eojyeo: 'Sleepy adult woman, purple-black long hair, lavender bow and flower, violet eyes, padded black/lavender coat, white rabbit plush retained. No sword; coat/blanket and pessimistic dream gestures.',
  eora: 'Young man, messy black short hair, tired gray eyes, black/gold utility long coat blue tie and lining, rolled sleeves, cylindrical tool in anatomical LEFT hand. Gravity pins and rearranged parts, no invented firearm.',
  sosuh: 'Mature man, brown ponytail and beard, black tactical coat blue tie, knee armor. Short dagger held in anatomical RIGHT hand. Experienced compact knife technique.',
  eodo: 'Broad muscular man, paper-bag head with exactly two black eye holes; NO visible human face. Wide black tactical coat blue lining and tie, gloved fists. No weapon.',
  gena: 'Adult woman, long black hair with red streaks, red eyes, scars, rolled sleeves and gloves, black utility coat blue lining. BROAD AXE held in anatomical RIGHT hand, never a pickaxe.',
  dorok: 'Young man, short brown hair blue eyes, black tailored coat silver buckles, blue tie. Precise symmetric coordinate hand gestures; no invented oversized weapon.',
  ryeona: 'Adult woman, long brown hair, goggles on head, anatomical RIGHT eye orange and left eye gray. Black utility coat blue tie, rolled sleeves. Detonator in anatomical LEFT hand; spanner or compact pyrotechnic charge in RIGHT for attacks.',
  getne: 'MALE young beautiful feminine/androgynous man, long white hair red ribbons and red eyes, lean male body. Black utility long coat blue tie and hero charms, holy white/gold light hand gestures. Preserve approved face/body, do not reinterpret as a woman.'
};
const eojilPoses = {
  move: 'Controlled forward running stride toward RIGHT. Right pen hand held ready at waist, left tablet tucked near chest, coat and hair trail LEFT. Moderate lean and one bent knee; grounded leading foot.',
  clash: 'Braced interception toward RIGHT: right hand grips pen raised diagonally before chest as if redirecting an incoming weapon. Left hand retains tablet safely. Two feet firm, knees slightly bent; not an attack follow-through.',
  'clash-loss': 'Stagger backward toward LEFT, torso recoils and right pen hand is pushed aside downward; left tablet retained. Pained but alive expression, bent knees, no falling onto floor.',
  'clash-win': 'Successful parry follow-through: sweep right pen hand outward toward RIGHT to deflect a strike, confident focused expression. Left tablet retained, torso upright and feet firm. No victory dance.',
  defense: 'Lateral evasive lean away toward LEFT with knees moderately bent, torso pulls back from an imagined right-side strike. Right pen hand drawn close, left tablet retained. Feet grounded, head same size; no shrinking limb lengths.',
  'skill-1-hit-2': 'Second strike of 결말 예측: right pen hand redirects the nib along a rising diagonal toward RIGHT. Left hand holds tablet at hip. Wrist and nib clearly point right, different arm path from straight first thrust.',
  'skill-2-hit-1': 'First strike of 확신의 일격: precise low forward pen-nib thrust toward RIGHT aimed at an opening, right elbow extended below chest, left tablet held near chest, firm grounded stance.',
  'skill-2-hit-2': 'Finishing strike of 확신의 일격: sharply retract the RIGHT pen hand toward right hip after pulling the nib free, elbow flexed, tablet in left hand, torso twists slightly back. Not another forward thrust.',
  'skill-3-hit-1': 'First strike of 계획 수정: measured RIGHT pen thrust high toward RIGHT at chest level along a predicted trajectory. Left tablet slightly angled as she reads it, eyes focused forward.',
  'skill-3-hit-2': 'Second strike of 계획 수정: change pen trajectory across body diagonally downward toward RIGHT, nib leading, right elbow partly bent, left tablet stays low out of the stroke.',
  'skill-3-hit-3': 'Final strike of 계획 수정: compact decisive forward RIGHT pen extension on a new lower trajectory, feet braced and shoulders square; left tablet tucked close. Distinct from high first strike.',
  'skill-4-hit-1': 'Strong 결말 주석 strike: deliberate emphatic RIGHT pen-nib thrust toward RIGHT, left tablet held upright at chest as if confirming the ending, forceful but restrained stable stance. No extra objects or effects.',
  'overdrive-hit-1': 'Concept overdrive opening: raise RIGHT pen beside head angled toward RIGHT, LEFT tablet upright near sternum as if finding the ending. Upright same-size body and head, no outfit transformation, no giant effect.',
  'overdrive-hit-2': 'Concept overdrive linking stroke: sweep RIGHT pen in broad horizontal arc toward RIGHT at chest height, LEFT tablet retained near hip, mild torso turn. Full pen and both hands visible, no effect covering anatomy.',
  'overdrive-hit-3': 'Concept overdrive conclusion: forceful short downward-diagonal RIGHT pen-nib finishing stroke toward RIGHT, left tablet held close, knees lightly braced. Same body proportions and clothing, no giant effect.'
};
const motifs = {
  eojil: ['right pen-nib forward thrust with left tablet retained', 'right pen reverse trajectory and withdrawal with left tablet retained', 'right pen finishing stroke with left tablet retained'],
  eojyeo: ['strike outward with coat hem/blanket while retaining bunny', 'wrap imaginary opponent in blanket gesture, bunny retained', 'release pessimistic dream with free hand while hugging bunny'],
  eora: ['launch a compact gravity pin with right-hand gesture', 'redirect rearranged mechanical parts with palm', 'release a forceful gravity pressure gesture'],
  sosuh: ['right-hand dagger slash horizontally toward right', 'reverse right dagger cut across body', 'precise right dagger forward thrust'],
  eodo: ['heavy gloved backhand toward right', 'drive right shoulder and forearm forward in shove', 'heavy gloved finishing punch toward right'],
  gena: ['broad right-hand axe sweep toward right', 'reverse diagonal axe chop toward right', 'decisive downward axe cut toward right'],
  dorok: ['precise right fingertip coordinate thrust toward right', 'opposite-direction symmetric coordinate gesture', 'two-handed precise final coordinate release toward right'],
  ryeona: ['flick a small spanner toward right with right hand', 'throw a compact pyrotechnic charge toward right, left detonator retained', 'press left-hand detonator while right hand braced forward'],
  getne: ['push luminous right palm toward right', 'draw a sacred light glyph with right fingertip', 'protective outstretched right palm toward right']
};
const jobs = old.jobs.map(job => {
  const sel = chosen.find(item => item.name === job.name);
  const reference = path.join(root, 'assets/battle/sd/sd-55', sel.file);
  const frames = job.frames.map(frame => {
    let pose = frame.pose;
    if (job.id === 'eojil' && eojilPoses[frame.key]) pose = eojilPoses[frame.key];
    else if (frame.skillName) pose = `${frame.skillName}, animation phase ${frame.hit}: ${motifs[job.id][(frame.hit-1)%3]}. Distinct complete pose, all equipment retained.`;
    const prompt = `Use case: identity-preserve. ONE single whole-character combat KEY-POSE PNG, not a sheet, not body parts, not a collage. Reference1 approved BASE SD is SOLE anatomy, pixel-scale and simplified cel-shaded style authority. Reference2 only correct Team1 sleeve badge. Draw only ${job.name}. ${locks[job.id]}\nPOSE: ${pose}\nHead must NOT grow during action. Retain the EXACT skull/face size, shoulder width, neck, torso, upper/lower arm segment lengths, hands, pelvis, thigh/shin lengths and boots of approved BASE. Its head crown-to-chin is about ${sel.chin-sel.crown}px, upright crown-to-sole ${sel.sole-sel.crown}px (${sel.approxHeads}heads), in1086x1448 reference coordinates. Head should remain ${(100*(sel.chin-sel.crown)/1448).toFixed(2)}% canvas height. Bent pose naturally shorter, DO NOT upscale to fill image. Portrait 3:4 canvas same framing and pixel scale as BASE; foot support near x543 y${sel.sole}; entire hair, tools and boots within 5% safe margin. Face screen RIGHT in shallow three-quarter orthographic camera, no foreshortening. Virtual construction grid, NOT drawn.\nExactly TWO arms TWO hands TWO legs, connected shoulders/elbows/wrists, correct thumb directions and equipment handedness. No duplicated hands or weapons. Preserve actual approved face/gender/hair/costume details; do not add ornate elements. On visible outer upper sleeve: reference2 midnight-blue circular badge with gold border, upright vintage LIGHTBULB outline with FILAMENT and SCREW BASE, TEN thin gold rays each ending pointed star. NOT a question mark, sun or random symbol, do not inherit incorrect base badge.\nTransparent RGBA background, no scenery, floor, ground shadow, text, labels, watermarks or giant effects. Full figure at large native resolution, request2172x2896 retaining same subject proportions. Genuine complete redrawn articulated pose, not warped idle.`;
    return {...frame, pose, prompt, status: fs.existsSync(path.join(out, job.id, frame.key+'.png')) ? 'saved' : 'pending'};
  });
  return {id: job.id, name: job.name, reference, standing: job.standing, headReference: sel, identityLock: locks[job.id], frames};
});
const file = path.join(out, 'single-image-plan.json');
if (fs.existsSync(file)) throw new Error('Preserve existing single-image plan; do not regenerate blindly.');
fs.writeFileSync(file, JSON.stringify({kind: 'one complete character per generated image', appliedToGame: false, jobs}, null, 2));
console.log(JSON.stringify({characters: jobs.length, total: jobs.reduce((n,j)=>n+j.frames.length,0), pending: jobs.reduce((n,j)=>n+j.frames.filter(f=>f.status==='pending').length,0)}));
