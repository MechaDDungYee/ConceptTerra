const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.resolve(root, '../이루다 1획 - 빛을 이루다.md'), 'utf8');
const excerpt = source.slice(source.indexOf('투하가 뭔지 몰라도')).split(/\n\s*-----/)[0];
const paragraphs = excerpt.split(/\r?\n\s*\r?\n/).map(line => line.replace(/&#x20;/g, '').trim()).filter(Boolean);
const sprites = {
  iruri: 'assets/standing/04_이루리_초반_스탠딩.png',
  eojil: 'assets/standing/00_이루어질_스탠딩.png', eojyeo: 'assets/standing/01_이루어져_스탠딩.png',
  eora: 'assets/standing/02_이루어라_스탠딩.png', sosuh: 'assets/standing/03_이루소서_스탠딩.png',
  eodo: 'assets/standing/05_이루어도_스탠딩.png', gena: 'assets/standing/06_이루게나_스탠딩.png',
  dorok: 'assets/standing/07_이루도록_스탠딩.png', ryeona: 'assets/standing/08_이루려나_스탠딩.png',
  getne: 'assets/standing/09_이루겠네_스탠딩.png',
  hazard: 'assets/story/standing/pentar_hazard.png', bio: 'assets/story/standing/pentar_bio.png',
  drink: 'assets/story/standing/pentar_drink.png', cigarette: 'assets/story/standing/pentar_cigarette.png',
  sister: 'assets/story/standing/월정커_누님_스탠딩.png', brother: 'assets/story/standing/월정커_아우_스탠딩.png'
};
const names = { iruri:'이루리', eojil:'이루어질', eojyeo:'이루어져', eora:'이루어라', sosuh:'이루소서', eodo:'이루어도', gena:'이루게나', dorok:'이루도록', ryeona:'이루려나', getne:'이루겠네', hazard:'하자드', bio:'바이오', drink:'드링크', cigarette:'시가렛', sister:'누님?', brother:'아우?' };
function characters(ids, speaker) {
  return [...new Set(ids)].filter(id => sprites[id]).map((id, i, array) => ({ src:sprites[id], alt:names[id], side:array.length === 1 ? 'center' : array.length === 2 ? ['left','right'][i] : ['left','center','right'][i], active:id === speaker }));
}
function splitDialogue(line) {
  if (!/^["“]/.test(line)) return [null, line];
  const end = Math.max(line.lastIndexOf('"'), line.lastIndexOf('”'));
  if (end < 1) throw new Error(`Unclosed dialogue: ${line}`);
  return [line.slice(0,end+1), line.slice(end+1).trim()];
}
const stage3Speakers = {
  1:'iruri',3:'bio',5:'drink',8:'iruri',11:'iruri',12:'dorok',14:'gena',16:'iruri',17:'sosuh',19:'iruri',20:'getne',22:'iruri',23:'eojyeo',25:'getne',26:'eojyeo',27:'sosuh',28:'iruri',30:'iruri',31:'eojil',32:'bio',34:'drink',35:'hazard',36:'cigarette',38:'eojil',39:'iruri',41:'eojil',42:'iruri',43:'eojil',45:'eojil',46:'bio',52:'sosuh',54:'cigarette',56:'hazard',58:'bio',60:'drink',62:'drink',63:'bio',65:'iruri',66:'eojil',67:'iruri',68:'eojil',70:'iruri',71:'eojil',72:'iruri',73:'eojil',75:'hazard',76:'bio',77:'cigarette',79:'drink',81:'getne',83:'iruri',85:'cigarette',87:'gena',88:'dorok',90:'eojil',91:'cigarette',93:'iruri',95:'eojil',97:'getne',98:'iruri',99:'eora',101:'ryeona',103:'ryeona',105:'iruri',106:'ryeona',108:'iruri',109:'sosuh',110:'ryeona',111:'eora',113:'iruri',114:'eora',116:'eojil',120:'eodo',121:'iruri',123:'iruri',125:'eojil',127:'eojil',129:'eojil',131:'iruri',133:'eojil'
};
const reveals = {bio:7,drink:7,dorok:13,gena:15,sosuh:18,getne:21,eojyeo:24,iruri:70,eora:100,ryeona:100,eodo:122};
const known = new Set(['eojil','hazard','cigarette']);
let cast = ['iruri','eojil'];
const stage3 = [];
const conversationGroups = {
  1:['iruri'],8:['iruri'],11:['iruri','dorok'],12:['iruri','dorok'],
  14:['iruri','gena'],16:['iruri','gena'],17:['iruri','sosuh'],19:['iruri','sosuh'],
  20:['iruri','getne'],22:['iruri','getne'],23:['iruri','eojyeo'],28:['sosuh','iruri','eojyeo'],
  25:['getne','iruri','eojyeo'],26:['getne','iruri','eojyeo'],27:['sosuh','iruri','eojyeo'],
  30:['iruri','eojil'],
  31:['eojil','bio'],32:['eojil','bio'],35:['hazard','cigarette'],36:['hazard','cigarette'],
  54:['hazard','cigarette','bio'],56:['hazard','cigarette','bio'],58:['hazard','cigarette','bio'],
  65:['iruri','eojil'],93:['iruri','eojil'],
  87:['gena','dorok'],88:['gena','dorok'],90:['eojil','cigarette'],91:['eojil','cigarette']
};
paragraphs.forEach((paragraph,index) => {
  const background = `assets/story/backgrounds/${index < 86 ? 'stage03_airship_interior' : index < 107 ? 'stage03_hangar_v2' : 'stage03_dokkaebi_interior_v2'}.jpg`;
  const [dialogue, narration] = splitDialogue(paragraph);
  if (dialogue) {
    const speaker = stage3Speakers[index];
    if (!speaker) throw new Error(`Missing speaker: ${index}`);
    const offscreen = speaker === 'drink' && index >= 60 && index <= 62;
    // Keep the current conversation partner when the protagonist replies.
    cast = conversationGroups[index] || (offscreen ? cast : speaker === 'iruri' ? (cast.includes('iruri') ? cast : ['iruri', ...cast.slice(-1)]) : ['iruri',speaker]);
    stage3.push({background,kind:'dialogue',speakerId:speaker, affiliation:speaker === 'iruri' ? known.has(speaker) ? '이루다 1팀' : '???' : known.has(speaker) ? ['hazard','bio','drink','cigarette'].includes(speaker) ? '펜타R 컴퍼니' : '이루다 1팀' : '???', name: speaker === 'iruri' && !known.has(speaker) ? '나' : known.has(speaker) ? names[speaker] : '???',line:dialogue,characters:characters(cast,offscreen ? null : speaker),sourceParagraph:index});
  }
  if(index === 9) cast = ['iruri','dorok'];
  if(index === 29 || index === 37) cast = ['iruri','eojil'];
  if(index === 92) cast = ['iruri','eojil'];
  if(index === 100) cast = ['eora','iruri','ryeona'];
  if(index === 118) cast = ['iruri','eodo'];
  if (narration) stage3.push({background,kind:'narration',speakerId:'iruri',affiliation:'',name:'',line:narration,characters:characters(cast,null),sourceParagraph:index});
  Object.entries(reveals).forEach(([id, at]) => {if(index === at) known.add(id);});
});
fs.writeFileSync(path.join(root,'story-stage3-data.js'), `// Adapted from the supplied novel; speaker assignments are curated above.\nwindow.stage3Scenes = ${JSON.stringify(stage3,null,2)};\n`);

const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'story-stage2-data.js'),'utf8'), context);
const fixes = {19:'brother',20:'hazard',24:'eojil',26:'brother',51:'hazard',53:'hazard',61:'hazard',69:'iruri'};
const aliases = Object.fromEntries(Object.entries(names).map(([id,name]) => [name.endsWith('?') ? name : `${name}?`,id]));
aliases['나'] = 'iruri';
const revealed = new Set(['sister','brother']);
let previous = 'cigarette';
const stage2 = [];
context.window.stage2Scenes.forEach((scene,index) => {
  const [dialogue,narration] = splitDialogue(scene.line);
  const speaker = fixes[index] || aliases[scene.name] || 'iruri';
  const dead = index >= 47 ? ['sister','brother'] : index >= 35 ? ['sister'] : [];
  const fighting = index >= 5 && index <= 47;
  const actor = dialogue ? speaker : previous;
  const cast = (fighting ? ['hazard', ...(dead.includes('sister') ? [] : ['sister']), ...(dead.includes('brother') ? [] : ['brother'])] : ['iruri',actor === 'iruri' ? 'eojil' : actor]);
  if([24,28].includes(index)) cast.splice(0,cast.length,'iruri','eojil','brother');
  if([49,51,53,58,61].includes(index)) cast.splice(0,cast.length,'iruri','hazard');
  if([71,72,73,74,76,78].includes(index)) cast.splice(0,cast.length,'iruri','eojil','cigarette');
  if (dialogue && !cast.includes(speaker)) cast.splice(1, 1, speaker);
  const labels = { affiliation: speaker === 'iruri' ? '???' : ['sister','brother'].includes(speaker) ? '월정커' : revealed.has(speaker) ? ['hazard','cigarette'].includes(speaker) ? '펜타R 컴퍼니' : '이루다' : '???', name: speaker === 'iruri' ? '나' : revealed.has(speaker) ? names[speaker] : '???' };
  if(dialogue) stage2.push({...scene,...labels,kind:'dialogue',speakerId:speaker,line:dialogue,characters:characters(cast,speaker),sourceParagraph:index});
  if(narration) stage2.push({...scene,kind:'narration',speakerId:'iruri',affiliation:'',name:'',line:narration,characters:characters(cast,null),sourceParagraph:index});
  if(index === 0) revealed.add('cigarette');
  if(index === 1) revealed.add('eojil');
  if(index === 2) revealed.add('hazard');
  if(dialogue) previous = speaker;
});
fs.writeFileSync(path.join(root,'story-stage2-presentation.js'), `// Preserve original text while separating dialogue and narration.\nwindow.stage2Scenes = ${JSON.stringify(stage2,null,2)};\n`);
console.log(`Stage 2: ${stage2.length} scenes; stage 3: ${stage3.length} scenes, ${paragraphs.length} source paragraphs.`);
