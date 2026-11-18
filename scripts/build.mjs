import {mkdir, readFile, writeFile, copyFile, readdir} from 'node:fs/promises';
const assets = {};
for (const [name, type] of [['index.html','text/html'],['style.css','text/css'],['app.js','text/javascript'],['game.html','text/html'],['game.js','text/javascript'],['blocks.js','text/javascript'],['game.css','text/css'],['rules.js','text/javascript'],['grid.js','text/javascript'],['battle-camera.js','text/javascript']]) {
  assets['/'+name] = {type: type+'; charset=utf-8', body: await readFile('public/'+name,'utf8')};
}
for (const name of await readdir('public/battle-art')) {
  const art = await readFile('public/battle-art/'+name);
  if (!art.length) throw new Error('Empty battle asset: '+name);
  assets['/battle-art/'+name] = {type:'image/png', base64:art.toString('base64')};
}
const worker = await readFile('worker/index.js','utf8');
await mkdir('dist/server', {recursive:true});
await mkdir('dist/.openai', {recursive:true});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
const game = (await readFile('worker/game.js','utf8')).replace(/^import .*;\r?\n/gm,'');
const rules = assets['/rules.js'].body + '\n' + assets['/grid.js'].body;
await writeFile('dist/server/index.js', rules + '\n' + game + '\n' + worker.replace("import { assets } from './assets.js';", 'const assets = '+JSON.stringify(assets)+';'));
