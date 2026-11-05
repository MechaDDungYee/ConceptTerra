const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const c={window:{}};
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
vm.runInNewContext(read('story-stage2-data.js'),c);
const raw=c.window.stage2Scenes;
vm.runInNewContext(read('story-stage2-presentation.js'),c);
vm.runInNewContext(read('story-stage3-data.js'),c);
const {stage2Scenes:stage2,stage3Scenes:stage3}=c.window;
const norm=text=>text.replace(/\s+/g,'');
raw.forEach((s,i)=>assert.equal(norm(stage2.filter(x=>x.sourceParagraph===i).map(x=>x.line).join('')),norm(s.line)));
console.log('PASS stage 2 preserves every original line');
const novel=fs.readFileSync(path.resolve(root,'../이루다 1획 - 빛을 이루다.md'),'utf8');
const paragraphs=novel.slice(novel.indexOf('투하가 뭔지 몰라도')).split(/\n\s*-----/)[0].split(/\r?\n\s*\r?\n/).map(x=>x.replace(/&#x20;/g,'').trim()).filter(Boolean);
paragraphs.forEach((p,i)=>assert.equal(norm(stage3.filter(x=>x.sourceParagraph===i).map(x=>x.line).join('')),norm(p)));
console.log('PASS stage 3 preserves all 137 source paragraphs');
for(const s of [...stage2,...stage3]) {
  assert.ok(fs.existsSync(path.join(root,s.background)),s.background);
  for(const sprite of s.characters) assert.ok(fs.existsSync(path.join(root,sprite.src)),sprite.src);
  if(s.kind==='dialogue' && !(s.speakerId==='drink' && s.sourceParagraph>=60 && s.sourceParagraph<=62)) assert.equal(s.characters.filter(x=>x.active).length,1,s.line);
  if(s.kind==='narration') assert.equal(s.characters.filter(x=>x.active).length,0,s.line);
}
console.log('PASS all backgrounds/sprites exist and dialogue highlights one actual speaker');
const speakerAt=i=>stage2.find(s=>s.sourceParagraph===i&&s.kind==='dialogue').speakerId;
for(const [i,id] of Object.entries({19:'brother',20:'hazard',24:'eojil',26:'brother',51:'hazard',53:'hazard',61:'hazard',69:'iruri'})) assert.equal(speakerAt(+i),id);
for(const s of stage2.filter(x=>x.sourceParagraph>=47)) assert.ok(!s.characters.some(x=>/월정커/.test(x.src)));
assert.ok(stage2.every(s=>!s.characters.some(x=>x.src.endsWith('pentar_bio.png'))));
assert.equal(stage2.find(s=>s.sourceParagraph===0&&s.kind==='dialogue').name,'???');
assert.equal(stage2.find(s=>s.sourceParagraph===72&&s.kind==='dialogue').name,'시가렛');
assert.equal(stage3.find(s=>s.sourceParagraph===12&&s.kind==='dialogue').name,'???');
assert.equal(stage3.find(s=>s.sourceParagraph===88&&s.kind==='dialogue').name,'이루도록');
assert.equal(stage3.find(s=>s.sourceParagraph===70&&s.kind==='dialogue').name,'나');
assert.equal(stage3.find(s=>s.sourceParagraph===72&&s.kind==='dialogue').name,'이루리');
console.log('PASS speaker corrections, reveal timing, cockpit restriction and no deceased sprites');
for(const s of stage3.filter(s=>s.sourceParagraph>=9&&s.sourceParagraph<=13)) {
 assert.deepEqual(Array.from(s.characters,x=>x.alt),['이루리','이루도록']);
}
for(const [paragraph,partner] of [[16,'이루게나'],[19,'이루소서'],[22,'이루겠네'],[30,'이루어질'],[65,'이루어질'],[93,'이루어질'],[121,'이루어도']]) {
 assert.ok(stage3.find(s=>s.sourceParagraph===paragraph&&s.kind==='dialogue').characters.some(x=>x.alt===partner));
}
console.log('PASS catching sequence and protagonist replies retain correct scene partners');
