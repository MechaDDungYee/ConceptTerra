import {battleMusicTracks as tracks} from './rules.js';
const musicSource='https://raw.githubusercontent.com/MechaDDungYee/ConceptTerra/69a631b64d5854ee18cfe71f3dd9233def649a28/';
const storageKey='conceptterra.battleMusic';
const musicSettings={volume:35,muted:false,loop:true};
try{
  const saved=JSON.parse(localStorage.getItem(storageKey));
  if(Number.isFinite(saved?.volume))musicSettings.volume=Math.max(0,Math.min(100,saved.volume));
  if(typeof saved?.muted==='boolean')musicSettings.muted=saved.muted;
  if(typeof saved?.loop==='boolean')musicSettings.loop=saved.loop;
}catch{}

export function battleMusicTrack(battle,selection='auto'){
  if(battle?.phase!=='planning')return null;
  if(Object.hasOwn(tracks,selection))return selection;
  const {id,name,stage}=battle.encounter??{};
  if(id==='blight01')return stage===3?'bright3':stage===2?'bright2':'bright1';
  if(id==='stop01')return 'dark';
  return Object.keys(tracks).find(key=>name===tracks[key]||battle.units?.some(unit=>unit.enemy&&unit.name===tracks[key]))??null;
}

let audio,currentTrack,currentPlayback,statusField,previewTrack;
function updateStatus(message){
  if(statusField?.isConnected)statusField.textContent=message;
}

export function syncBattleMusic(battle,selection,playRequested=false){
  const track=battleMusicTrack(battle,selection)||previewTrack;
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
  audio??=new Audio();
  audio.volume=musicSettings.volume/100;
  audio.muted=musicSettings.muted;
  audio.loop=musicSettings.loop;
  if(track!==currentTrack){
    currentTrack=track;
    currentPlayback=null;
    audio.src=musicSource+encodeURIComponent('잡다한 것들')+'/'+encodeURIComponent(tracks[track]+'.m4a');
    playRequested=true;
    updateStatus(tracks[track]);
  }
  if(playRequested){
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
}

export function closeBattleMusicSettings(battle,selection){
  previewTrack=null;
  statusField=null;
  syncBattleMusic(battle,selection);
}

export function battleMusicSettings(getState,chooseTrack,ui){
  const {el,button,field,input,select}=ui;
  const content=el('div',undefined,{class:'stack'});
  const volume=input('battle-volume',musicSettings.volume,'range',{min:0,max:100});
  const level=el('output',musicSettings.volume+'%');
  const mute=input('battle-muted','1','checkbox',{checked:musicSettings.muted});
  const loop=input('battle-loop','1','checkbox',{checked:musicSettings.loop});
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
  loop.onchange=()=>{musicSettings.loop=loop.checked;save();};
  if(room.canSetBattleMusic){
    const track=select('battle-track',[['auto','전투에 맞춰 자동 선택'],...Object.entries(tracks)],room.battleMusic);
    track.onchange=async()=>{
      previewTrack=null;
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
  const selected=battleMusicTrack(room.battle,room.battleMusic);
  statusField.textContent=selected?tracks[selected]:'현재 재생할 전투 BGM이 없어요.';
  const play=button('전투 BGM 재생',()=>{
    const {battle,battleMusic,canSetBattleMusic}=getState();
    previewTrack=canSetBattleMusic&&!battleMusicTrack(battle,battleMusic)&&Object.hasOwn(tracks,battleMusic)?battleMusic:null;
    syncBattleMusic(battle,battleMusic,true);
  });
  content.append(field('음악 음량',volume),level,field('음소거',mute),field('반복 재생',loop),play,statusField);
  return content;
}
