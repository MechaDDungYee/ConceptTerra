const root = document.querySelector('#app');
const code = location.pathname.match(/^\/room\/([a-f0-9]{16})\/?$/)?.[1];
const endpoint = '/api/rooms' + (code ? '/' + code : '');
const names = ['GM', '플레이어 1', '플레이어 2', '플레이어 3', '플레이어 4'];
let current, polling, pending = false;

async function api(path, body) {
  const response = await fetch(path, body === undefined ? {} : {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || '연결을 확인하고 다시 시도해 주세요.');
  return data;
}

function connectForm(form, handler) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    const error = form.querySelector('.error');
    button.disabled = true;
    error.textContent = '';
    try { await handler(Object.fromEntries(new FormData(form))); }
    catch (e) { error.textContent = e.message; }
    finally { button.disabled = false; }
  });
}

function showLobby() {
  root.replaceChildren(document.querySelector('#lobby').content.cloneNode(true));
  connectForm(root.querySelector('#create'), async input => {
    const room = await api('/api/rooms', input);
    location.assign('/room/' + room.code);
  });
  connectForm(root.querySelector('#find'), ({code: value}) => {
    const match = value.trim().match(/^(?:https?:\/\/[^/]+\/room\/)?([a-f0-9]{16})\/?$/i);
    if (!match) throw new Error('초대 링크 또는 16자리 방 코드를 입력해 주세요.');
    location.assign('/room/' + match[1].toLowerCase());
  });
}

function showInvitation(room) {
  clearInterval(polling);
  root.innerHTML = '<section class="card single"><p class="tag">세션 초대</p><h2></h2><p>닉네임으로 대기실에 들어오면 방장이 자리를 배정합니다.</p><form><label>내 닉네임<input name="name" required maxlength="24" placeholder="닉네임 입력" autocomplete="nickname"></label><button class="primary">대기실 입장 <span aria-hidden="true">→</span></button><p class="error" role="alert"></p></form></section>';
  root.querySelector('h2').textContent = room.title;
  connectForm(root.querySelector('form'), async input => startRoom(await api(endpoint + '/join', input)));
}

function make(tag, value, className) {
  const node = document.createElement(tag);
  if (value !== undefined) node.textContent = value;
  if (className) node.className = className;
  return node;
}

function showRoom(room) {
  current = room;
  const owner = room.ownerId === room.me;
  const self = room.members.find(member => member.id === room.me);
  root.innerHTML = '<section class="room-head"><div><p class="tag">온라인 세션 · <code></code></p><h1></h1><p class="notice" id="role"></p></div><div class="actions"><a class="primary game-entry" id="game">캐릭터 · 전투</a><button id="invite" class="primary">초대 링크 복사</button><button id="exit"></button></div></section><p id="invite-status" class="notice" role="status"></p><p id="room-error" class="error" role="alert"></p><div class="room-grid"><section class="card"><h2>세션 자리</h2><p id="count"></p><div id="seats"></div></section><section class="card"><h2>참가자</h2><p id="permission"></p><div id="members"></div></section></div>';
  root.querySelector('code').textContent = room.code;
  root.querySelector('h1').textContent = room.title;
  root.querySelector('#role').textContent = self.name + ' · ' + (owner ? '방장 · ' : '') + (names[self.seat] || '대기 중');
  root.querySelector('#count').textContent = '플레이어 ' + room.members.filter(member => member.seat > 0).length + ' / 4 · GM 별도';
  root.querySelector('#permission').textContent = owner ? '방장만 참가자를 대기실, 플레이어, GM 자리로 옮길 수 있습니다.' : '자리 배정은 방장이 합니다.';
  const seats = root.querySelector('#seats');
  names.forEach((label, seat) => {
    const row = make('div', undefined, seat === 0 ? 'seat gm' : 'seat');
    const detail = make('div');
    detail.append(make('small',label), make('strong',room.members.find(member => member.seat === seat)?.name || '빈 자리'));
    row.append(detail);
    seats.append(row);
  });
  const list = root.querySelector('#members');
  room.members.forEach(member => {
    const row = make('div', undefined, 'member');
    const label = make('span', member.name);
    if (member.id === room.ownerId) label.append(make('small',' · 방장'));
    if (member.id === room.me) label.append(make('small',' · 나'));
    row.append(label);
    if (owner) {
      const select = make('select');
      select.setAttribute('aria-label',member.name+' 자리 배정');
      [[null,'대기실'], ...names.map((name, index) => [index,name])].forEach(([seat, name]) => {
        const option = make('option', name);
        option.value = seat === null ? '' : String(seat);
        option.selected = seat === member.seat;
        option.disabled = seat !== null && room.members.some(other => other.id !== member.id && other.seat === seat);
        select.append(option);
      });
      select.onchange = async () => {
        const seat = select.value === '' ? null : Number(select.value);
        await change('seat', {id:member.id, seat});
        select.value = member.seat === null ? '' : String(member.seat);
      };
      row.append(select);
      if (member.id !== room.ownerId) {
        const remove = make('button','내보내기');
        remove.setAttribute('aria-label',member.name+' 내보내기');
        remove.onclick = () => change('remove', {id:member.id});
        row.append(remove);
      }
    } else row.append(make('small',names[member.seat] || '대기실'));
    list.append(row);
  });
  root.querySelector('#exit').textContent = owner ? '로비로' : '방 나가기';
  root.querySelector('#exit').onclick = async () => {
    try {
      if (!owner) await api(endpoint + '/leave', {});
      location.assign('/');
    } catch (e) { root.querySelector('#room-error').textContent = e.message; }
  };
  root.querySelector('#game').href = '/room/' + room.code + '/game';
  root.querySelector('#invite').onclick = async () => {
    const status = root.querySelector('#invite-status');
    const link = new URL('/room/' + room.code, location.origin).href;
    try { await navigator.clipboard.writeText(link); status.textContent = '초대 링크를 복사했습니다.'; }
    catch {
      const field = make('input');
      field.readOnly = true;
      field.value = link;
      field.setAttribute('aria-label', '초대 링크');
      status.replaceChildren(field);
      field.select();
    }
  };
}

async function change(action, body) {
  if (pending) return;
  pending = true;
  try { showRoom(await api(endpoint + '/' + action, body)); }
  catch (e) { root.querySelector('#room-error').textContent = e.message; }
  finally { pending = false; }
}

function startRoom(room) {
  showRoom(room);
  clearInterval(polling);
  polling = setInterval(async () => {
    if (pending || document.activeElement?.tagName === 'SELECT' || document.hidden) return;
    const before = current;
    try {
      const next = await api(endpoint);
      if (pending || current !== before) return;
      if (next.invitation) showInvitation(next);
      else if (JSON.stringify(next) !== JSON.stringify(current)) showRoom(next);
    } catch { root.querySelector('#room-error').textContent = '연결이 끊겼습니다. 다시 연결하는 중입니다.'; }
  }, 2000);
}

if (!code) showLobby();
else {
  try {
    const room = await api(endpoint);
    if (room.invitation) showInvitation(room);
    else startRoom(room);
  } catch (e) {
    const section = make('section', undefined, 'card single');
    section.append(make('h2','입장할 수 없습니다'), make('p',e.message,'error'));
    const back = make('a','세션 로비로 돌아가기');
    back.href = '/';
    section.append(back);
    root.replaceChildren(section);
  }
}
