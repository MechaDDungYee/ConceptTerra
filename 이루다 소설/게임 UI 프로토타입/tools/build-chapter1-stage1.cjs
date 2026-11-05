const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.resolve(root,'../이루다 2획 - 헌신을 이루다.md'),'utf8').split(/\n\s*-----/)[0];
const paragraphs=source.split(/\r?\n\s*\r?\n/).map(line=>line.replace(/&#x20;/g,'').trim()).filter(Boolean);
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'story-stage3-data.js'),'utf8'),context);
const people={};
for(const scene of context.window.stage3Scenes) for(const entry of scene.characters) people[entry.alt]=entry.src;
people['제이크 설리번']='assets/story/standing/jake_sullivan.png';
people['셀타 마르틴']='assets/story/standing/selta_martin.png';
const speakers={
 1:'이루리',2:'이루어질',3:'이루리',4:'이루게나',5:'이루소서',7:'이루소서',9:'이루소서',10:'이루도록',11:'이루리',12:'이루게나',14:'이루리',16:'이루리',19:'이루리',21:'이루겠네',22:'이루리',23:'이루겠네',25:'이루소서',27:'이루소서',29:'이루어도',30:'이루소서',32:'이루어질',35:'이루소서',36:'이루리',37:'이루겠네',38:'이루어질',40:'이루어질',42:'이루게나',43:'이루도록',44:'이루겠네',46:'이루리',47:'이루어도',49:'이루리',50:'이루어도',52:'이루리',54:'이루어라',56:'이루리',57:'이루어라',59:'이루어라',60:'이루리',62:'이루어질',63:'이루어라',65:'이루어질',66:'이루게나',67:'이루어져',68:'이루어도',71:'이루려나',72:'이루어라',74:'이루리',75:'이루소서',77:'이루도록',79:'이루도록',81:'이루리',83:'제이크 설리번',84:'이루리',85:'제이크 설리번',87:'제이크 설리번',89:'제이크 설리번',90:'이루리',91:'제이크 설리번',92:'이루어도',94:'제이크 설리번',96:'이루어라',98:'이루어라',100:'이루도록',101:'이루게나',102:'이루려나',103:'이루어라',104:'이루소서',105:'이루겠네',107:'제이크 설리번',109:'이루소서',110:'이루도록',112:'제이크 설리번',114:'이루리',115:'이루어질',117:'이루어져',118:'이루어질',119:'이루어져',121:'이루겠네',122:'이루소서',123:'이루어져',125:'이루어질',127:'이루어져',128:'이루어질',129:'이루어도',131:'이루어져',136:'이루리',138:'이루리',140:'이루리',142:'이루리',143:'이루겠네',145:'이루리',147:'이루겠네',148:'이루리',149:'이루겠네',151:'이루리',153:'이루겠네',155:'이루겠네',157:'이루리',159:'이루리',161:'이루소서',162:'이루게나',163:'이루어질',164:'이루어라',166:'이루리',167:'이루어져',169:'이루리',171:'셀타 마르틴',173:'이루도록',174:'셀타 마르틴',175:'이루소서',176:'셀타 마르틴',179:'셀타 마르틴',182:'이루리',183:'이루어져'
};
const groups={
 19:['이루리'],29:['이루소서','이루리','이루어도'],30:['이루소서','이루어질'],32:['이루소서','이루어질'],
 33:['이루어질','이루리','이루어도'],38:['이루겠네','이루리','이루어질'],40:['이루리','이루어질'],
 46:['이루리','이루어도'],49:['이루리','이루어도'],52:['이루리','이루어라'],
 62:['이루어질','이루어라'],63:['이루어질','이루어라'],66:['이루게나','이루어져'],67:['이루게나','이루어져'],68:['이루어도','이루어져'],
 74:['이루리','이루소서'],77:['이루리','이루도록'],81:['이루리','이루어질'],83:['이루리'],84:['이루리'],85:['이루리'],
 86:['이루리','제이크 설리번'],87:['이루리','제이크 설리번'],92:['이루리','제이크 설리번','이루어도'],
 96:['이루리','이루어라'],98:['이루리','이루어라'],109:['이루소서','이루도록'],110:['이루소서','이루도록'],
 114:['이루리','이루어질'],115:['이루어질','이루리','이루어져'],117:['이루어질','이루어져'],118:['이루어질','이루어져'],119:['이루어질','이루어져'],
 123:['이루어질','이루리','이루어져'],125:['이루어질','이루리','이루어져'],127:['이루어질','이루어져','이루어도'],128:['이루어질','이루어져','이루어도'],129:['이루어질','이루어져','이루어도'],
 131:['이루리','이루어져'],134:['이루리'],143:['이루리','이루겠네'],166:['이루리','이루어져'],169:['이루리','셀타 마르틴'],173:['이루리','이루도록','셀타 마르틴'],
 176:['이루리','셀타 마르틴'],179:['이루리','셀타 마르틴'],182:['이루리','셀타 마르틴'],183:['이루리','이루어져','셀타 마르틴']
};
let cast=['이루리','이루어질'];
function entries(speaker){return cast.map((name,index)=>({src:people[name],alt:name,side:cast.length===1?'center':cast.length===2?['left','right'][index]:['left','center','right'][index],active:name===speaker}));}
const scenes=[];
paragraphs.forEach((paragraph,index)=>{
 if(groups[index]) cast=groups[index];
 const cinematic=index>=180;
 const background=cinematic?'../이루다 2획 삽화/jpg/06_셀타마르틴_심상세계_모닥불기억_삽화.jpg':index<73?'assets/story/backgrounds/stage03_dokkaebi_interior_v2.jpg':index<134?'assets/story/backgrounds/ch1_residence.jpg':'assets/story/backgrounds/ch1_mind_camp.jpg';
 const dialogue=/^["“]/.test(paragraph);
 const end=dialogue?Math.max(paragraph.lastIndexOf('"'),paragraph.lastIndexOf('”')):-1;
 if(dialogue){
  const speaker=speakers[index];if(!speaker)throw new Error(`Missing speaker at ${index}`);
  const offscreen=index===83||index===85;
  if(!groups[index]&&!cast.includes(speaker))cast=speaker==='이루리'?['이루리',cast[cast.length-1]]:['이루리',speaker];
  const unknownJake=speaker==='제이크 설리번'&&index<=87;
  scenes.push({background,kind:'dialogue',speakerId:speaker,affiliation:unknownJake?'???':speaker==='제이크 설리번'?'셀타 마르틴의 비서':speaker==='셀타 마르틴'?'의뢰인':'이루다 1팀',name:unknownJake?'???':speaker,line:paragraph.slice(0,end+1),characters:cinematic?[]:entries(offscreen?null:speaker),cinematic,sourceParagraph:index});
 }
 const narration=dialogue?paragraph.slice(end+1).trim():paragraph;
 if(narration)scenes.push({background,kind:'narration',speakerId:'이루리',affiliation:'',name:'',line:narration,characters:cinematic?[]:entries(null),cinematic,sourceParagraph:index});
});
const splitAt=81;
const battleAt=168;
const sprite=(name,side,active)=>({src:people[name],alt:name,side,active});
const camp='assets/story/backgrounds/ch1_mind_camp.jpg';
const additions=[
 {background:camp,kind:'narration',speakerId:'이루리',name:'',affiliation:'',line:'이루어져가 가리킨 방향으로 향하려던 순간, 어둠 속에서 군화 소리가 겹쳐 울렸다. 얼굴도 계급도 흐릿한 용병들이 길을 막아섰다. 총구는 우리를 향했지만, 눈빛에는 누구를 겨누고 있는지조차 모르는 공허함이 서려 있었다.',characters:[sprite('이루리','left',false),{src:'assets/story/standing/imagined_mercenary.png',alt:'상상 속 용병','side':'right',active:false}],addedScene:true},
 {background:camp,kind:'dialogue',speakerId:'이루리',name:'이루리',affiliation:'이루다 1팀',line:'“잠깐, 우린 의뢰를 받고 왔는데… 저 사람들은 대체 누구야?”',characters:[sprite('이루리','left',true),sprite('이루어질','right',false)],addedScene:true},
 {background:camp,kind:'dialogue',speakerId:'이루어질',name:'이루어질',affiliation:'이루다 1팀',line:'“의뢰인의 무의식이 만들어낸 용병단입니다. 이곳에서 우리는 상상하는 데 방해되는 불순물들이나 다름없어요. 제대로 만나기도 전에 배제하려는 겁니다.”',characters:[sprite('이루리','left',false),sprite('이루어질','right',true)],addedScene:true},
 {background:camp,kind:'dialogue',speakerId:'이루어질',name:'이루어질',affiliation:'이루다 1팀',line:'“무찌르고 나아갑시다. 이루어도는 현실에 남아 있으니 이번에는 부를 수 없습니다. 팀장, 제가 하나씩 안내하겠습니다. 먼저 이격들의 출전 순서부터 정해 주세요.”',characters:[sprite('이루리','left',false),sprite('이루어질','right',true)],addedScene:true},
 {background:camp,kind:'battle',tutorial:'mind-mercenaries',line:'',characters:[],addedScene:true},
 {background:camp,kind:'dialogue',speakerId:'이루어질',name:'이루어질',affiliation:'이루다 1팀',line:'“길이 열렸습니다. 지금 마주친 것은 의뢰인의 기억을 지키려는 상상일 뿐입니다. 이제 소원을 듣기 위해 나아가죠.”',characters:[sprite('이루리','left',false),sprite('이루어질','right',true)],addedScene:true}
];
const stage1=scenes.filter(s=>s.sourceParagraph<splitAt);
const stage2=[...scenes.filter(s=>s.sourceParagraph>=splitAt&&s.sourceParagraph<battleAt),...additions,...scenes.filter(s=>s.sourceParagraph>=battleAt)];
fs.writeFileSync(path.join(root,'story-ch1-stage1-data.js'),`// Chapter 1: source-preserving stage split at the residence entrance.\nwindow.chapter1Stage1Scenes = ${JSON.stringify(stage1,null,2)};\nwindow.chapter1Stage2Scenes = ${JSON.stringify(stage2,null,2)};\n`);
console.log(`${paragraphs.length} source paragraphs; stage 1 ${stage1.length}, stage 2 ${stage2.length} scenes including tutorial.`);
