const fs=require('node:fs'),path=require('node:path');
const root=__dirname;
fs.mkdirSync(path.join(root,'lib'),{recursive:true});
const files=['data','documents','expansion','narrator','engine','combat-data','combat'];
fs.writeFileSync(path.join(root,'lib/game.js'),files.map(n=>fs.readFileSync(path.join(root,'web',n+'.js'),'utf8')).join('\n')+'\nexport {HospitalData as D,HospitalEngine as E,RankCombat as C};\n');
fs.mkdirSync(path.join(root,'public/game'),{recursive:true});
fs.cpSync(path.join(root,'web'),path.join(root,'public/game'),{recursive:true});
console.log('Prepared authoritative rules and browser assets.');
