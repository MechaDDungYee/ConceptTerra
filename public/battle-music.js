const tracks={
  dark:'어두운 곳에서 더욱 빛나는',
  bright1:'밝은 곳에서 더더욱 빛나는 1차전',
  bright2:'밝은 곳에서 더더욱 빛나는 2차전',
  bright3:'밝은 곳에서 더더욱 빛나는 3차전',
  decomposer:'세계의 분해자',
  contempt:'수억 가지의 시선과 단 하나의 경멸',
  invitee:'언제나 초대받는 사람',
  artist:'예술가',
  attendance:'출근 확인반'
};
const musicSource='https://raw.githubusercontent.com/MechaDDungYee/ConceptTerra/69a631b64d5854ee18cfe71f3dd9233def649a28/';
const storageKey='conceptterra.battleMusic';
const musicSettings={volume:35,muted:false,loop:true,track:'auto'};
try{
  const saved=JSON.parse(localStorage.getItem(storageKey));
  if(Number.isFinite(saved?.volume))musicSettings.volume=Math.max(0,Math.min(100,saved.volume));
  if(typeof saved?.muted==='boolean')musicSettings.muted=saved.muted;
  if(typeof saved?.loop==='boolean')musicSettings.loop=saved.loop;
  if(saved?.track==='auto'||Object.hasOwn(tracks,saved?.track))musicSettings.track=saved.track;
}catch{}

export function battleMusicTrack(battle,selection='auto'){
  if(battle?.phase!=='planning')return null;
  if(Object.hasOwn(tracks,selection))return selection;
  const {id,name,stage}=battle.encounter??{};
  if(id==='blight01')return stage===3?'bright3':stage===2?'bright2':'bright1';
  if(id==='stop01')return 'dark';
  return Object.keys(tracks).find(key=>name===tracks[key]||battle.units?.some(unit=>unit.enemy&&unit.name===tracks[key]))??null;
}

const defaultPreview=Object.keys(tracks)[0];
let audio,currentTrack,currentPlayback,statusField,previewTrack;
function updateStatus(message){
  if(statusField?.isConnected)statusField.textContent=message;
}

export function syncBattleMusic(battle,playRequested=false){
  const track=battleMusicTrack(battle,musicSettings.track)||previewTrack;
  if(!track){
    if(currentTrack){
      currentTrack=null;
      currentPlayback=null;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    updateStatus('자동 배정된 곡이 없어요. 곡을 고르거나 재생을 눌러 첫 곡을 들어보세요.');
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

export function closeBattleMusicSettings(battle){
  previewTrack=null;
  statusField=null;
  syncBattleMusic(battle);
}

export function battleMusicSettings(getBattle,ui){
  const {el,button,field,input,select}=ui;
  const content=el('div',undefined,{class:'stack'});
  const volume=input('battle-volume',musicSettings.volume,'range',{min:0,max:100});
  const level=el('output',musicSettings.volume+'%');
  const mute=input('battle-muted','1','checkbox',{checked:musicSettings.muted});
  const loop=input('battle-loop','1','checkbox',{checked:musicSettings.loop});
  const track=select('battle-track',[['auto','전투에 맞춰 자동 선택'],...Object.entries(tracks)],musicSettings.track);
  statusField=el('p',undefined,{'aria-live':'polite'});
  const save=()=>{
    try{localStorage.setItem(storageKey,JSON.stringify(musicSettings));}catch{}
    syncBattleMusic(getBattle());
  };
  volume.oninput=()=>{
    musicSettings.volume=Number(volume.value);
    level.textContent=volume.value+'%';
    save();
  };
  mute.onchange=()=>{musicSettings.muted=mute.checked;save();};
  loop.onchange=()=>{musicSettings.loop=loop.checked;save();};
  track.onchange=()=>{
    musicSettings.track=track.value;
    previewTrack=null;
    save();
    if(Object.hasOwn(tracks,track.value)&&!battleMusicTrack(getBattle(),track.value))
      updateStatus(tracks[track.value]+' · 재생 버튼으로 미리 들을 수 있어요.');
  };
  const selected=battleMusicTrack(getBattle(),musicSettings.track);
  const manual=Object.hasOwn(tracks,musicSettings.track)?tracks[musicSettings.track]:null;
  statusField.textContent=selected?tracks[selected]:manual?manual+' · 재생 버튼으로 미리 들을 수 있어요.':
    '자동 배정된 곡이 없어요. 곡을 고르거나 재생을 눌러 첫 곡을 들어보세요.';
  const play=button('전투 BGM 재생',()=>{
    const battle=getBattle();
    previewTrack=battleMusicTrack(battle,musicSettings.track)?null:
      Object.hasOwn(tracks,musicSettings.track)?musicSettings.track:defaultPreview;
    syncBattleMusic(battle,true);
  });
  content.append(field('전투 BGM',track),field('음악 음량',volume),level,field('음소거',mute),field('반복 재생',loop),play,statusField);
  return content;
}

