import test from 'node:test';
import assert from 'node:assert/strict';
import {battleMusicSettings,closeBattleMusicSettings,syncBattleMusic} from '../public/battle-music.js';

test('battle music transport, speed, repeat and shuffle respect the unlocked playlist',()=>{
  let audio;
  globalThis.Audio=class extends EventTarget {
    constructor(){super();audio=this;this.currentTime=0;this.paused=true;}
    play(){this.paused=false;return Promise.resolve();}
    pause(){this.paused=true;}
    load(){}
    removeAttribute(){this.src='';}
  };
  const elements=[];
  const element=(text='',attrs={})=>({textContent:text,attrs,isConnected:true,append(){},
    setAttribute(name,value){this.attrs[name]=value;}});
  const ui={
    el:(_tag,text,attrs)=>element(text,attrs),
    button:(text,click)=>{const button={...element(text),click};elements.push(button);return button;},
    input:(name,value)=>{const input={...element(),name,value};elements.push(input);return input;},
    select:(name,options,value)=>{const select={...element(),name,options,value};elements.push(select);return select;},
    field:(_label,control)=>control
  };
  const room={battle:{phase:'planning',encounter:{id:'stop01'}},battleMusic:'auto',canSetBattleMusic:false,
    unlockedBattleMusic:['census','flesh','maze']};
  syncBattleMusic(room.battle,room.battleMusic);
  battleMusicSettings(()=>room,()=>{},ui);
  const button=text=>elements.find(node=>node.textContent===text);
  assert.equal(audio.loop,true);
  button('일시정지').click();
  audio.currentTime=14;
  syncBattleMusic(room.battle,room.battleMusic);
  assert.equal(audio.paused,true);
  button('전투 BGM 재생').click();
  assert.equal(audio.paused,false);
  assert.equal(audio.currentTime,14);
  button('정지').click();
  assert.equal(audio.paused,true);
  assert.equal(audio.currentTime,0);
  const rate=elements.find(node=>node.name==='battle-rate');
  rate.value='1.5';
  rate.oninput();
  assert.equal(audio.playbackRate,1.5);
  button('반복 · 한 곡').click();
  assert.equal(audio.loop,false);
  button('셔플 · 꺼짐').click();
  assert.equal(button('셔플 · 켜짐').attrs['aria-pressed'],'true');
  button('해금한 곡 듣기').click();
  const visited=[audio.src];
  for(let i=0;i<2;i++){
    audio.dispatchEvent(new Event('ended'));
    visited.push(audio.src);
  }
  assert.equal(new Set(visited).size,3);
  assert.ok(visited.every(src=>/\/(census|flesh|maze)\.mp3$/.test(src)));
  audio.dispatchEvent(new Event('ended'));
  assert.notEqual(audio.src,visited.at(-1));
  button('반복 · 전체').click();
  const stoppedAt=audio.src;
  audio.dispatchEvent(new Event('ended'));
  assert.equal(audio.src,stoppedAt);
  button('반복 · 끄기').click();
  assert.equal(audio.loop,true);
  closeBattleMusicSettings(room.battle,room.battleMusic);
});
