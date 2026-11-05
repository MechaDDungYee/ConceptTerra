const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'story-ch1-stage1-data.js'),'utf8'),context);
const stage1=context.window.chapter1Stage1Scenes,stage2=context.window.chapter1Stage2Scenes;
const scenes=[...stage1,...stage2];
assert.ok(stage1.every(s=>s.sourceParagraph<81));
assert.equal(stage2[0].sourceParagraph,81);
assert.equal(stage2.filter(s=>s.kind==='battle').length,1);
assert.ok(stage2.findIndex(s=>s.kind==='battle')<stage2.findIndex(s=>s.sourceParagraph===169));
const source=fs.readFileSync(path.resolve(root,'../이루다 2획 - 헌신을 이루다.md'),'utf8').split(/\n\s*-----/)[0];
const paragraphs=source.split(/\r?\n\s*\r?\n/).map(p=>p.replace(/&#x20;/g,'').trim()).filter(Boolean);
const norm=s=>s.replace(/\s+/g,'');
paragraphs.forEach((p,i)=>assert.equal(norm(scenes.filter(s=>s.sourceParagraph===i).map(s=>s.line).join('')),norm(p)));
for(const scene of scenes){
 assert.ok(fs.existsSync(path.join(root,scene.background)),scene.background);
 for(const sprite of scene.characters) assert.ok(fs.existsSync(path.join(root,sprite.src)),sprite.src);
 if(scene.sourceParagraph>=134) assert.ok(!scene.characters.some(s=>s.alt==='이루어도'));
 if(scene.kind==='dialogue' && !scene.cinematic && ![83,85].includes(scene.sourceParagraph)){
  assert.deepEqual(Array.from(scene.characters.filter(s=>s.active),s=>s.alt),[scene.speakerId]);
 }
 if(scene.kind==='narration') assert.equal(scene.characters.filter(s=>s.active).length,0);
}
for(const p of [83,85,87]) assert.equal(scenes.find(s=>s.sourceParagraph===p&&s.kind==='dialogue').name,'???');
assert.equal(scenes.find(s=>s.sourceParagraph===89&&s.kind==='dialogue').name,'제이크 설리번');
console.log(`PASS chapter 1 preserves ${paragraphs.length} paragraphs, speaker reveals, assets and mind-world restrictions`);
