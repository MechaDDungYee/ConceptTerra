window.MP=(()=>{
 let session=null,snapshot=null,connected=false,pending=false,lastState='',polling=false;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const storage='hospital-room-session';
 const self=()=>snapshot?.room.members.find(m=>m.id===session?.id);
 const host=()=>snapshot?.room.host===session?.id;
 const controls=slot=>snapshot?.room.members.find(m=>m.slot===slot)?.id===session?.id||host()&&!snapshot.room.members.some(m=>m.slot===slot);
 function canAdvance(){if(!session||!snapshot?.room.started||pending||!connected)return false;const s=snapshot.room.state,c=RankCombat.current(s);if(!s.battle)return false;if(c?.side==='ally'){if(!controls(c.id))return false;return s.battle.started!==`${s.battle.round}:ally:${c.id}`||!HospitalEngine.active(s.party[c.id])||s.party[c.id].stun>0||!!s.battle.plans[c.id];}return host();}
async function api(body){const res=await fetch('/api/rooms',{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session.token}:{})},body:JSON.stringify(body)}),data=await res.json();if(data.room&&session&&!['create','join'].includes(body.type))receive(data);if(!res.ok){const error=Error(data.error||'요청을 처리하지 못했습니다.');error.status=res.status;throw error;}return data;}
function receive(data){if(snapshot&&data.code===snapshot.code&&data.revision<snapshot.revision)return;const started=!!snapshot?.room.started;connected=true;snapshot=data;const serialized=JSON.stringify(data.room.state);if(lastState!==serialized){lastState=serialized;window.PTRPG?.applyOnline(data.room.state);}update();if(!started&&data.room.started)document.querySelector('#room-dialog')?.close();}
async function send(action){if(pending)throw Error('앞선 요청을 처리 중입니다.');if(!connected)throw Error('재연결 후 다시 시도하세요.');pending=true;const requestId=crypto.randomUUID();try{for(let attempt=0;attempt<3;attempt++){try{const data=await api({code:session.code,revision:snapshot.revision,requestId,action});return data.result;}catch(err){const retry=action.type==='chat'||(action.type==='vote'||action.type==='roller-vote')&&snapshot.room.ballot===action.ballot&&snapshot.room.state.scene===action.scene;if(err.status!==409||!retry||attempt===2)throw err;}}}finally{pending=false;}}
 function voteAction(index){return {type:'vote',index,scene:snapshot?.room.state.scene,ballot:snapshot?.room.ballot};}
 function rollerAction(slot){return {type:'roller-vote',slot,scene:snapshot?.room.state.scene,ballot:snapshot?.room.ballot};}
 function resetRollAction(){return {type:'reset-roll',scene:snapshot?.room.state.scene,ballot:snapshot?.room.ballot};}
 function paintRollers(){
  const room=snapshot.room,choice=HospitalData.scenes[room.state.scene].choices[room.pendingRoll.index],stat=choice.search?'민첩':choice.stat,root=document.querySelector('#choices');
  const markup=`<div class="roller-heading"><strong>판정 담당자 선택</strong><span>${esc(choice.label)}</span><button data-reset-roll>선택지 다시 고르기</button></div><div class="roller-list">${room.state.party.map(p=>{
   const active=HospitalEngine.active(p),preview={...room.state,actor:p.id},chance=active?(choice.search?HospitalEngine.check(preview,'민첩',()=>0,1,'research').threshold:HospitalEngine.choiceCheck(preview,choice,()=>0).threshold):0,voters=room.members.filter(m=>room.rollerVotes[m.id]===p.id),mine=room.rollerVotes[session.id]===p.id;
   return `<button class="roller-card ${mine?'my-vote':''}" data-roller="${p.id}" ${active?'':'disabled'} aria-pressed="${mine}"><b>${esc(p.name)}</b><small>${active?`${stat} ${p.stats[stat]} · 성공 ${chance}%`:'행동 불가'}</small><div class="choice-votes"><span class="vote-count">${voters.length}/${room.members.length}</span><div class="vote-profiles">${voters.map(m=>`<span class="vote-profile" style="--profile:${room.state.party[m.slot].color}" title="${esc(m.name)}"><span>${esc(Array.from(m.name)[0])}</span></span>`).join('')}</div></div></button>`;
  }).join('')}</div>`;
  root.classList.add('roller-phase');if(!root.querySelector('.roller-list')||root.dataset.rollerMarkup!==markup){root.innerHTML=markup;root.dataset.rollerMarkup=markup;}
 }
 function paintVotes(){
  const active=!!session&&snapshot?.room.started&&!snapshot.room.state.battle&&!snapshot.room.state.ending;
  document.querySelector('#game')?.classList.toggle('multiplayer-exploration',!!active);
  const root=document.querySelector('#choices');if(!root)return;
  if(active&&snapshot.room.pendingRoll){paintRollers();return;}
  if(root.classList.contains('roller-phase')){root.classList.remove('roller-phase');if(snapshot)window.PTRPG?.applyOnline(snapshot.room.state);return;}
  document.querySelectorAll('#choices [data-choice]').forEach(button=>{
   button.classList.toggle('voting-choice',!!active);if(!active){button.querySelector('.choice-votes')?.remove();button.removeAttribute('aria-pressed');return;}
   const index=Number(button.dataset.choice),members=snapshot.room.members.filter(m=>snapshot.room.votes?.[m.id]===index),mine=snapshot.room.votes?.[session.id]===index;
   button.classList.toggle('my-vote',mine);button.setAttribute('aria-pressed',String(mine));
   let strip=button.querySelector('.choice-votes');if(!strip){strip=document.createElement('div');strip.className='choice-votes';button.appendChild(strip);}
   const markup=`<span class="vote-count" aria-label="${members.length}명 선택, 총 ${snapshot.room.members.length}명">${members.length}/${snapshot.room.members.length}</span><div class="vote-profiles">${members.map(m=>`<span class="vote-profile" style="--profile:${snapshot.room.state.party[m.slot].color}" title="${esc(m.name)}" aria-label="${esc(m.name)}"><span>${esc(Array.from(m.name)[0])}</span></span>`).join('')}</div>`;
   if(strip.innerHTML!==markup)strip.innerHTML=markup;
  });
 }
 async function poll(){if(!session||polling||pending)return;polling=true;try{const res=await fetch('/api/rooms?code='+encodeURIComponent(session.code),{headers:{Authorization:'Bearer '+session.token},cache:'no-store'}),data=await res.json();if(!res.ok){if([403,404].includes(res.status)){disconnect();window.PTRPG?.notice(data.error);return;}throw Error(data.error);}receive(data);}catch{connected=false;update();}finally{polling=false;}}
 function disconnect(){session=null;snapshot=null;lastState='';connected=false;sessionStorage.removeItem(storage);window.PTRPG?.endOnline();update();}
 async function connect(type,form){const data=await api({type,name:form.get('name'),code:String(form.get('code')||'').trim().toUpperCase()});session={code:data.code,token:data.token,id:data.id};sessionStorage.setItem(storage,JSON.stringify(session));lastState='';receive(data);open();}
function shell(){if(document.querySelector('#room-dialog'))return;document.body.insertAdjacentHTML('beforeend','<dialog id="room-dialog"><button id="room-close" aria-label="닫기">×</button><div id="room-body"></div></dialog><button id="table-toggle" title="공용 테이블 채팅" hidden><span>테이블</span><span id="table-unread" class="chat-unread" hidden aria-live="polite"></span></button><aside id="table-chat" hidden><header><strong id="table-title"></strong><button id="table-hide" aria-label="채팅 닫기">×</button></header><div id="table-messages" aria-live="polite"></div><form id="table-form"><input name="message" maxlength="400" required placeholder="함께할 행동을 이야기하세요" aria-label="메시지"><button type="submit">전송</button></form></aside>');
 document.querySelector('#room-close').onclick=()=>document.querySelector('#room-dialog').close();document.querySelector('#table-hide').onclick=()=>document.querySelector('#table-chat').hidden=true;document.querySelector('#table-toggle').onclick=()=>{document.querySelector('#table-chat').hidden=!document.querySelector('#table-chat').hidden;update();};
 document.querySelector('#table-form').onsubmit=async e=>{e.preventDefault();const input=e.target.elements.message;try{await send({type:'chat',text:input.value});input.value='';}catch(err){PTRPG.notice(err.message);}};
 }
 function syncChatBadge(){
  const badge=document.querySelector('#table-unread'),button=document.querySelector('#table-toggle');if(!badge||!button)return;
  if(!session||!snapshot){badge.hidden=true;button.setAttribute('aria-label','테이블 채팅');return;}
  const chat=snapshot.room.chat;
  // The first snapshot is existing history, not a new-message notification.
  if(!Array.isArray(session.readChatIds)){session.readChatIds=chat.map(m=>m.id);sessionStorage.setItem(storage,JSON.stringify(session));}
  const seen=new Set(session.readChatIds),visible=!document.querySelector('#table-chat').hidden&&!document.hidden&&!document.querySelector('dialog[open]');
  if(visible&&chat.some(m=>!seen.has(m.id))){session.readChatIds=chat.map(m=>m.id);sessionStorage.setItem(storage,JSON.stringify(session));chat.forEach(m=>seen.add(m.id));}
  const count=chat.filter(m=>m.sender!==session.id&&!seen.has(m.id)).length;
  badge.hidden=count===0;const label=String(count);if(badge.textContent!==label)badge.textContent=label;
  button.setAttribute('aria-label',count?`테이블 채팅, 읽지 않은 메시지 ${count}개`:'테이블 채팅');
 }
 document.addEventListener('visibilitychange',syncChatBadge);
 function open(){shell();const dialog=document.querySelector('#room-dialog');draw();if(!dialog.open)dialog.showModal();}
 function draw(){const target=document.querySelector('#room-body');if(!target)return;
 if(!session){target.innerHTML='<h2>공용 테이블</h2><form id="room-connect"><label>참가자 이름<input name="name" maxlength="24" required autocomplete="nickname"></label><label>방 코드<input name="code" maxlength="12" autocomplete="off"></label><div class="room-actions"><button name="mode" value="create" type="submit">방 만들기</button><button name="mode" value="join" type="submit">참가하기</button></div></form><p id="room-error" role="status"></p>';target.querySelector('form').onsubmit=async e=>{e.preventDefault();const mode=e.submitter.value;try{await connect(mode,new FormData(e.target));}catch(err){document.querySelector('#room-error').textContent=err.message;}};return;}
const me=self();target.innerHTML=`<h2>테이블 <span>${esc(session.code)}</span></h2><div class="room-actions"><button id="room-copy">초대 링크 복사</button><button id="room-refresh">연결 확인</button></div><div id="room-members"></div>${snapshot?.room.started?'':`<form id="room-character"><label>캐릭터 이름<input name="name" maxlength="24" value="${esc(me?.name||'')}" required></label><div class="room-stats">${HospitalEngine.stats.map((s,i)=>`<label>${s}<input type="number" name="stat-${i}" min="1" max="100" value="50" required></label>`).join('')}</div><div class="budget" id="room-budget">주 능력치 150 / 150</div><fieldset class="trait-field"><legend id="room-trait-count">시작 특성 · 0 / 3</legend><div class="trait-options">${HospitalData.traits.filter(t=>t.kind==='start').map(t=>`<label class="trait-option"><input type="checkbox" name="trait" value="${t.id}"><span><b>${esc(t.name)}</b><small>${esc(t.description)}</small></span></label>`).join('')}</div></fieldset><label class="unique-label">고유 특성<select name="unique" id="room-unique-trait">${HospitalData.traits.filter(t=>t.kind==='unique').map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label><p class="trait-description" id="room-unique-description"></p><div class="trait-preview" id="room-trait-preview"></div><button type="submit">캐릭터 확정</button></form><div class="room-actions"><button id="room-ready">준비 상태 전환</button>${host()?'<button id="room-start">탐색 시작</button>':''}</div>`}<button id="room-leave">방에서 나가기</button><p id="room-error" role="status"></p>`;
 document.querySelector('#room-copy').onclick=async()=>{try{const url=new URL(location.href);url.searchParams.set('room',session.code);await navigator.clipboard.writeText(url.href);PTRPG.notice('초대 링크를 복사했습니다.');}catch{PTRPG.notice('방 코드: '+session.code);}};
 document.querySelector('#room-refresh').onclick=poll;
 const perform=async action=>{try{await send(action);document.querySelector('#room-error').textContent='';return true;}catch(err){document.querySelector('#room-error').textContent=err.message;return false;}};
 const form=document.querySelector('#room-character');
 if(form){
  const draft=session.characterDraft;
  if(draft){form.elements.name.value=draft.name;draft.values.forEach((n,i)=>form.elements['stat-'+i].value=n);form.querySelectorAll('[name=trait]').forEach(input=>input.checked=draft.traits.includes(input.value));form.elements.unique.value=draft.traits.find(id=>HospitalData.traits.some(t=>t.id===id&&t.kind==='unique'))||'unemployed';}
  const refresh=()=>{
   const f=new FormData(form),chosen=f.getAll('trait'),unique=HospitalData.traits.find(t=>t.id===f.get('unique')),values=[0,1,2].map(i=>Number(f.get('stat-'+i))),total=values.reduce((a,b)=>a+b,0);
   document.querySelector('#room-budget').textContent=`주 능력치 ${total} / 150`;document.querySelector('#room-budget').classList.toggle('negative',total!==150);
   document.querySelector('#room-trait-count').textContent=`시작 특성 · ${chosen.length} / 3`;
   form.querySelectorAll('[name=trait]').forEach(input=>{const trait=HospitalData.traits.find(t=>t.id===input.value);input.disabled=!input.checked&&(chosen.length>=3||chosen.includes(trait.opposite));input.closest('label').classList.toggle('unavailable',input.disabled);});
   document.querySelector('#room-unique-description').textContent=unique.description;
   try{const p=HospitalEngine.create('미리보기',values,[...chosen,unique.id]).party[0];document.querySelector('#room-trait-preview').innerHTML=`<span>최종 근력 <b>${p.stats['근력']}</b></span><span>지능 <b>${p.stats['지능']}</b></span><span>민첩 <b>${p.stats['민첩']}</b></span><span>체력 <b>${p.max}</b></span><span>정신 <b>${p.mental>=0?'+':''}${p.mental}</b></span>`;form.querySelector('[type=submit]').disabled=false;}
   catch(err){document.querySelector('#room-trait-preview').textContent=err.message;form.querySelector('[type=submit]').disabled=true;}
  };
  form.oninput=refresh;refresh();
  form.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(form),draft={name:f.get('name'),values:[0,1,2].map(i=>Number(f.get('stat-'+i))),traits:[...f.getAll('trait'),f.get('unique')]};if(await perform({type:'configure',...draft})){session.characterDraft=draft;sessionStorage.setItem(storage,JSON.stringify(session));PTRPG.notice('캐릭터와 특성을 확정했습니다.');}});
 }
 document.querySelector('#room-ready')?.addEventListener('click',()=>perform({type:'ready'}));
 document.querySelector('#room-start')?.addEventListener('click',async()=>{await perform({type:'start'});if(snapshot.room.started)document.querySelector('#room-dialog').close();});
 document.querySelector('#room-leave').onclick=async()=>{try{await send({type:'leave'});}catch(err){PTRPG.notice(err.message);}disconnect();draw();};update();
 }
 function update(){paintVotes();if(!document.querySelector('#room-dialog'))return;document.querySelector('#table-toggle').hidden=!session;const members=document.querySelector('#room-members');if(members&&session&&snapshot){members.innerHTML=snapshot.room.members.map(m=>`<div class="room-member"><span>${m.slot+1}. ${esc(m.name)} ${m.id===snapshot.room.host?'· 방장':''}</span><b>${m.ready?'준비 완료':'준비 중'}</b>${host()&&m.id!==session.id?`<button data-kick="${m.id}">내보내기</button>`:''}</div>`).join('');members.querySelectorAll('[data-kick]').forEach(b=>b.onclick=()=>send({type:'kick',id:b.dataset.kick}).catch(e=>PTRPG.notice(e.message)));}
 const button=document.querySelector('#room-ready');if(button)button.textContent=self()?.ready?'준비 취소':'준비 완료';
 if(session&&snapshot){document.querySelector('#table-title').textContent='테이블 '+session.code+(connected?'':' · 재연결 중');const msgs=document.querySelector('#table-messages'),content=snapshot.room.chat.map(m=>`<p><b>${esc(m.name)}</b><span>${esc(m.text)}</span></p>`).join('');if(msgs.innerHTML!==content){msgs.innerHTML=content;msgs.scrollTop=msgs.scrollHeight;} }
 else document.querySelector('#table-chat').hidden=true;
 syncChatBadge();
 }
document.addEventListener('DOMContentLoaded',()=>{shell();const b=document.createElement('button');b.innerHTML='<img src="assets/users.svg" alt="">';b.setAttribute('aria-label','함께');b.title='공용 테이블';b.onclick=()=>PTRPG.openMultiplayer();document.querySelector('header nav').prepend(b);try{session=JSON.parse(sessionStorage.getItem(storage));}catch{}if(session)poll();else{const code=new URL(location.href).searchParams.get('room');if(code){PTRPG.openMultiplayer();document.querySelector('[name=code]').value=code.toUpperCase();}}setInterval(poll,1800);});
 return {get active(){return !!session;},get connected(){return connected;},controls,canAdvance,send,open,voteAction,paintVotes,rollerAction,resetRollAction};
})();
