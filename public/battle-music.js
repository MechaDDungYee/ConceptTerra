import {battleMusicTracks as tracks,battleMusicForEncounter} from './rules.js';
const musicSource='https://raw.githubusercontent.com/MechaDDungYee/ConceptTerra/69a631b64d5854ee18cfe71f3dd9233def649a28/';
const storageKey='conceptterra.battleMusic';
const musicSettings={volume:35,muted:false,repeat:'one',shuffle:false,rate:1};
try{
  const saved=JSON.parse(localStorage.getItem(storageKey));
  if(Number.isFinite(saved?.volume))musicSettings.volume=Math.max(0,Math.min(100,saved.volume));
  if(typeof saved?.muted==='boolean')musicSettings.muted=saved.muted;
  if(['one','all','off'].includes(saved?.repeat))musicSettings.repeat=saved.repeat;
  else if(saved?.loop===false)musicSettings.repeat='off';
  if(typeof saved?.shuffle==='boolean')musicSettings.shuffle=saved.shuffle;
  if(Number.isFinite(saved?.rate))musicSettings.rate=Math.max(0.5,Math.min(2,saved.rate));
}catch{}

export function battleMusicTrack(battle,selection='auto'){
  if(battle?.phase!=='planning')return null;
  if(Object.hasOwn(tracks,selection))return selection;
  const {id,name,stage}=battle.encounter??{};
  const encounterTracks=battleMusicForEncounter({id});
  if(encounterTracks.length)return encounterTracks[stage===3?2:stage===2?1:0]||encounterTracks[0];
  return Object.keys(tracks).find(key=>name===tracks[key]||battle.units?.some(unit=>unit.enemy&&unit.name===tracks[key]))??null;
}

const repeatModes=['one','all','off'];
const repeatLabels={one:'한 곡',all:'전체',off:'끄기'};
let audio,currentTrack,currentPlayback,statusField,previewTrack,held,cycle,contextTrack;
function updateStatus(message){
  if(statusField?.isConnected)statusField.textContent=message;
}

function prepareCycle(keys,first,includeFirst=false){
  const available=[...new Set(keys)].filter(key=>Object.hasOwn(tracks,key));
  if(!available.length)return [];
  if(!musicSettings.shuffle){
    const index=available.indexOf(first);
    return [...available.slice(index+1),...available.slice(0,index+(includeFirst?1:0))];
  }
  const order=available.filter(key=>includeFirst||key!==first);
  for(let index=order.length-1;index>0;index--){
    const other=Math.floor(Math.random()*(index+1));
    [order[index],order[other]]=[order[other],order[index]];
  }
  if(order.length>1&&order[0]===first)order.push(order.shift());
  return order;
}

function ensureAudio(){
  if(audio)return;
  audio=new Audio();
  audio.addEventListener('ended',()=>{
    currentPlayback=null;
    if(!held&&musicSettings.repeat==='all'&&cycle){
      if(!cycle.queue.length)cycle.queue=prepareCycle(cycle.keys,currentTrack,true);
      const next=cycle.queue.shift();
      if(next){
        previewTrack=next;
        const {battle,battleMusic}=cycle.getState();
        syncBattleMusic(battle,battleMusic,true);
        return;
      }
    }
    updateStatus(tracks[currentTrack]+' · 재생 완료');
  });
}

function holdPlayback(mode){
  held=mode;
  currentPlayback=null;
  if(audio){
    audio.pause();
    if(mode==='stopped')audio.currentTime=0;
  }
  updateStatus(currentTrack?tracks[currentTrack]+(mode==='stopped'?' · 정지':' · 일시정지'):'현재 재생 중인 곡이 없어요.');
}

export function syncBattleMusic(battle,selection,playRequested=false){
  const automatic=battleMusicTrack(battle,selection);
  if(!playRequested&&contextTrack!==undefined&&automatic!==contextTrack){
    previewTrack=null;
    cycle=null;
  }
  contextTrack=automatic;
  const track=previewTrack||automatic;
  if(!track){
    if(currentTrack){
      currentTrack=null;
      currentPlayback=null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    updateStatus('현재 재생할 전투 BGM이 없어요.');
    return;
  }
  ensureAudio();
  audio.volume=musicSettings.volume/100;
  audio.muted=musicSettings.muted;
  audio.loop=musicSettings.repeat==='one';
  audio.playbackRate=musicSettings.rate;
  if(playRequested)held=null;
  if(track!==currentTrack){
    currentTrack=track;
    currentPlayback=null;
    audio.src=['census','maze','flesh','scribe'].includes(track)?'/battle-music/'+track+'.mp3':
      musicSource+encodeURIComponent('잡다한 것들')+'/'+encodeURIComponent(tracks[track]+'.m4a');
    playRequested=true;
    updateStatus(tracks[track]);
  }
  if(held||!playRequested)return;
  if(audio.error)audio.load();
  const playback=audio.play();
  currentPlayback=playback;
  updateStatus(tracks[track]);
  playback.catch(error=>{
    if(currentPlayback!==playback)return;
    if(error.name==='NotAllowedError'){
      updateStatus('브라우저가 자동 재생을 막았습니다. 재생 버튼을 눌러 주세요.');
    }else if(error.name!=='AbortError'){
      updateStatus('BGM을 불러올 수 없습니다. 재생 버튼으로 다시 시도해 주세요.');
    }
  });
}

export function closeBattleMusicSettings(battle,selection){
  if(!cycle?.persist||musicSettings.repeat!=='all'){
    previewTrack=null;
    cycle=null;
  }
  statusField=null;
  syncBattleMusic(battle,selection);
}

export function battleMusicSettings(getState,chooseTrack,ui){
  const {el,button,field,input,select}=ui;
  const content=el('div',undefined,{class:'stack'});
  const volume=input('battle-volume',musicSettings.volume,'range',{min:0,max:100});
  const level=el('output',musicSettings.volume+'%');
  const mute=input('battle-muted','1','checkbox',{checked:musicSettings.muted});
  const rate=input('battle-rate',musicSettings.rate,'range',{min:0.5,max:2,step:0.05});
  const rateLabel=el('output',musicSettings.rate.toFixed(2)+'×');
  const room=getState();
  statusField=el('p',undefined,{'aria-live':'polite'});
  const save=()=>{
    try{localStorage.setItem(storageKey,JSON.stringify(musicSettings));}catch{}
    const {battle,battleMusic}=getState();
    syncBattleMusic(battle,battleMusic);
  };
  volume.oninput=()=>{
    musicSettings.volume=Number(volume.value);
    level.textContent=volume.value+'%';
    save();
  };
  mute.onchange=()=>{musicSettings.muted=mute.checked;save();};
  rate.oninput=()=>{
    musicSettings.rate=Number(rate.value);
    rateLabel.textContent=musicSettings.rate.toFixed(2)+'×';
    save();
  };
  const repeat=button('',()=>{
    musicSettings.repeat=repeatModes[(repeatModes.indexOf(musicSettings.repeat)+1)%repeatModes.length];
    if(cycle)cycle.queue=prepareCycle(cycle.keys,currentTrack);
    else if(musicSettings.repeat==='all'&&currentTrack){
      const {canSetBattleMusic,unlockedBattleMusic=[]}=getState();
      setCycle(canSetBattleMusic?Object.keys(tracks):unlockedBattleMusic,currentTrack,true);
    }
    showControls();
    save();
  });
  const shuffle=button('',()=>{
    musicSettings.shuffle=!musicSettings.shuffle;
    if(cycle)cycle.queue=prepareCycle(cycle.keys,currentTrack);
    else if(musicSettings.repeat==='all'&&currentTrack){
      const {canSetBattleMusic,unlockedBattleMusic=[]}=getState();
      setCycle(canSetBattleMusic?Object.keys(tracks):unlockedBattleMusic,currentTrack,true);
    }
    showControls();
    save();
  });
  const showControls=()=>{
    repeat.textContent='반복 · '+repeatLabels[musicSettings.repeat];
    shuffle.textContent='셔플 · '+(musicSettings.shuffle?'켜짐':'꺼짐');
    shuffle.setAttribute('aria-pressed',String(musicSettings.shuffle));
    shuffle.title='전체 반복 모드에서 재생 순서를 섞어요.';
  };
  showControls();
  const setCycle=(keys,first,persist=false)=>{
    cycle={keys,queue:prepareCycle(keys,first),getState,persist};
  };
  if(room.canSetBattleMusic){
    const track=select('battle-track',[['auto','전투에 맞춰 자동 선택'],...Object.entries(tracks)],room.battleMusic);
    track.onchange=async()=>{
      previewTrack=null;
      cycle=null;
      track.disabled=true;
      try{
        const saved=await chooseTrack(track.value);
        track.value=getState().battleMusic;
        if(!saved)updateStatus('곡을 변경하지 못했어요. 다시 시도해 주세요.');
        else if(!battleMusicTrack(getState().battle,track.value)&&Object.hasOwn(tracks,track.value))
          updateStatus(tracks[track.value]+' · 재생 버튼으로 미리 들을 수 있어요.');
      }finally{track.disabled=!getState().canSetBattleMusic;}
    };
    content.append(field('전투 BGM · 세션 공통',track));
  }
  const unlocked=room.unlockedBattleMusic||[];
  if(unlocked.length){
    const personal=select('unlocked-battle-track',Object.entries(tracks).filter(([key])=>unlocked.includes(key)),unlocked[0]);
    const listen=button('해금한 곡 듣기',()=>{
      const {battle,battleMusic,unlockedBattleMusic=[]}=getState();
      if(!unlockedBattleMusic.includes(personal.value))return;
      previewTrack=personal.value;
      setCycle(unlockedBattleMusic,personal.value);
      syncBattleMusic(battle,battleMusic,true);
    });
    const stop=button('감상 종료',()=>{
      previewTrack=null;
      cycle=null;
      const {battle,battleMusic}=getState();
      syncBattleMusic(battle,battleMusic);
    });
    const controls=el('div',undefined,{class:'row'});
    controls.append(listen,stop);
    content.append(field('내가 해금한 BGM',personal),controls);
  }else content.append(el('p','조우를 클리어하면 해당 BGM을 여기서 감상할 수 있어요.',{class:'notice minor'}));
  const selected=battleMusicTrack(room.battle,room.battleMusic);
  statusField.textContent=selected?tracks[selected]:'현재 재생할 전투 BGM이 없어요.';
  const play=button('전투 BGM 재생',()=>{
    const {battle,battleMusic,canSetBattleMusic,unlockedBattleMusic=[]}=getState();
    const track=battleMusicTrack(battle,battleMusic);
    if(!held||!currentTrack){
      previewTrack=canSetBattleMusic&&!track&&Object.hasOwn(tracks,battleMusic)?battleMusic:null;
      const first=previewTrack||track;
      setCycle(canSetBattleMusic?Object.keys(tracks):unlockedBattleMusic,first,true);
    }
    syncBattleMusic(battle,battleMusic,true);
  });
  const controls=el('div',undefined,{class:'row'});
  controls.append(play,button('일시정지',()=>holdPlayback('paused')),button('정지',()=>holdPlayback('stopped')),repeat,shuffle);
  content.append(field('음악 음량',volume),level,field('음소거',mute),field('재생 배속',rate),rateLabel,controls,statusField);
  return content;
}
