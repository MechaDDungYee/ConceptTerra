import {execFileSync} from 'node:child_process';
import {mkdir, readFile, writeFile, copyFile, readdir} from 'node:fs/promises';
import * as rulesModule from '../public/rules.js';
import * as gridModule from '../public/grid.js';
const assets = {};
for(const name of ['guide.md','character-guide.md','example-cards.json','example-passives.json','example-stacks.json','example-character.json']){
  const path='authoring/'+name;
  assets['/'+path]={type:(name.endsWith('.md')?'text/markdown':'application/json')+'; charset=utf-8',
    body:await readFile('public/'+path,'utf8')};
}
for (const [name, type] of [['index.html','text/html'],['style.css','text/css'],['app.js','text/javascript'],['account.js','text/javascript'],['game.html','text/html'],['game.js','text/javascript'],['blocks.js','text/javascript'],['game.css','text/css'],['rules.js','text/javascript'],['grid.js','text/javascript'],['battle-camera.js','text/javascript'],['battle-music.js','text/javascript']]) {
  if(type==='text/javascript')execFileSync(process.execPath,['--check','public/'+name],{stdio:'inherit'});
  assets['/'+name] = {type: type+'; charset=utf-8', body: await readFile('public/'+name,'utf8')};
}
for (const name of await readdir('public/battle-art')) {
  const art = await readFile('public/battle-art/'+name);
  if (!art.length) throw new Error('Empty battle asset: '+name);
  assets['/battle-art/'+name] = {type:'image/png', base64:art.toString('base64')};
}
for(const name of ['census','maze','flesh','scribe']){
  const path='battle-music/'+name+'.mp3';
  const track=await readFile('public/'+path);
  assets['/'+path]={type:'audio/mpeg',base64:track.toString('base64')};
}
const worker = await readFile('worker/index.js','utf8');
await mkdir('dist/server', {recursive:true});
await mkdir('dist/.openai', {recursive:true});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
const game = (await readFile('worker/game.js','utf8')).replace(/^import .*;\r?\n/gm,'');
const story = (await readFile('worker/last-passenger-script.md','utf8')).replace(/\r\n/g,'\n');
const storySections=story.split(/(?=^#{1,4} )/m).filter(part=>part.trim()).map(part=>{
  const [heading,...lines]=part.trim().split('\n');
  return {heading:heading.replace(/^#+ /,''),text:lines.join('\n').trim()};
});
const sessionStory=(await readFile('worker/session-story.md','utf8')).replace(/\r\n/g,'\n');
const sessionScenes=sessionStory.split(/^## /m).slice(1).map(chapter=>{
  const [heading,...lines]=chapter.trim().split('\n');
  const reference=lines[0]?.match(/^@scene ([\d.]+)$/)?.[1];
  if(reference)lines.shift();
  const scene=reference===undefined?null:storySections.findIndex(section=>section.heading.split(' ')[0]===reference);
  if(scene===-1)throw new Error('Unknown rulebook scene: '+reference);
  const blocks=lines.join('\n').trim().split(/(?=^\[)/m).filter(Boolean).map(block=>{
    const [label,...body]=block.trim().split('\n');
    return {label:label.slice(1,-1),text:body.join('\n').trim()};
  });
  return {heading,scene,blocks};
});
const storySource='const gameStorySections='+JSON.stringify(storySections)+';\n'+
  'const gameSessionScenes='+JSON.stringify(sessionScenes)+';\n';
const rules = assets['/rules.js'].body + '\n' + assets['/grid.js'].body;
const ruleOptions = Object.fromEntries(Object.entries({...rulesModule,...gridModule})
  .filter(([,value])=>typeof value!=='function').sort(([a],[b])=>a.localeCompare(b)));
const builtInCards = (await import('data:text/javascript;base64,'+
  Buffer.from(rules+'\n'+game+'\nexport const authoringCatalogue=gameCatalogue.map(({id,name})=>({id,name}));').toString('base64'))).authoringCatalogue;
const validationSection = (start,end) => {
  const first=game.indexOf(start),last=game.indexOf(end,first);
  if(first<0||last<0)throw new Error('Missing authoring validation section: '+start);
  return game.slice(first,last).trim();
};
const reference={
  version:1,
  description:'콘셉트테라 업로드용 규칙 참조 자료입니다. 이 JSON 자체는 가져오기 파일이 아닙니다.',
  ruleOptions,
  builtInCards,
  passiveEventsByEffect:Object.fromEntries(ruleOptions.passiveEffectKinds.map(kind=>[kind,rulesModule.passiveTimingsFor(kind)])),
  serverValidation:{
    rangesAndBlocks:validationSection('const gameRanges =','function gameCard('),
    cardsAndPassives:validationSection('function gameCard(','const gameEquippedEffects='),
    characterMindRules:validationSection('const gameMindSources=','const gamePassiveSource='),
    stackDefinitions:validationSection('function gameStackName(','function gameUpgradeStackTrait('),
    stackImport:validationSection("          case 'stackImport':","          case 'card':"),
    cardImport:validationSection('function gameImportCards(','function gameActivityLocations('),
    characterFields:validationSection('function gameProfileFields(','function gameExportPassives('),
    passiveImport:validationSection('function gameImportPassives(','function gameLoadCharacter('),
    characterImport:validationSection('function gameLoadCharacter(','function gameDeck(')
  }
};
assets['/authoring/reference.json']={type:'application/json; charset=utf-8',body:JSON.stringify(reference,null,2)};
await writeFile('dist/server/index.js', storySource + rules + '\n' + game + '\n' + worker.replace("import { assets } from './assets.js';", 'const assets = '+JSON.stringify(assets)+';'));
