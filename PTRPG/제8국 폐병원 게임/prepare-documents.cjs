const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'PTRPG EP. 제8국 병원.md'), 'utf8');
const sections = [...source.matchAll(/^### (.+)\r?\n([\s\S]*?)(?=^#{2,3} |$(?![\s\S]))/gm)];
const entries = {
  father: ['난 올라갈거다', '찢어진 메모'], girl: ['아저씨 이거 봐요', '낙서 노트'],
  office: ['내가 왜 여기서 이래야 하나', '사무소 직원의 메모'],
  orders: ['위에서 까라면 까야지', '호위 임무 기록'],
  director: ['어제 우리가 봐버린 것', '푸른 꽃 소장의 기록'],
  experiment: ['개념체 증폭 실험 일기', '연구 일기']
};
const documents = {};
for (const [id, [title, type]] of Object.entries(entries)) {
  const section = sections.find(s => s[1].includes(title));
  if (!section) throw Error(`Missing original document: ${title}`);
  documents[id] = {title, type, text: section[2].trim().replace(/\r\n/g, '\n')};
}
fs.writeFileSync(path.join(__dirname, 'web', 'documents.js'),
  '/* Readable documents extracted from the author\'s manuscript. */\nObject.assign(HospitalData.notes, ' + JSON.stringify(documents, null, 2) + ');\n');
console.log(`Prepared ${Object.keys(documents).length} complete in-game documents.`);
