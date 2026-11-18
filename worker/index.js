import { assets } from './assets.js';

const encoder = new TextEncoder();
const random = () => crypto.randomUUID().replaceAll('-', '');
const hex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const hash = async token => hex(await crypto.subtle.digest('SHA-256', encoder.encode(token)));
const baseHeaders = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com"
};
const json = (body, status = 200, headers) => {
  const response = Response.json(body, {status, headers:baseHeaders});
  if (headers) for (const [name,value] of new Headers(headers)) response.headers.append(name,value);
  return response;
};
const error = (message, status = 400) => json({error: message}, status);
const query = (db, sql, ...values) => db.prepare(sql).bind(...values);
const cookieName = code => 'ct_' + code;
const cookieValue = (request, name) => request.headers.get('Cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(name + '='))?.split('=')[1];
const credential = (request, code) => cookieValue(request, cookieName(code));
const collectionCookie = 'ct_collection';
function collectionToken(request) {
  const token = cookieValue(request, collectionCookie);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
function setCollectionCookie(headers, url, token) {
  headers.append('Set-Cookie', collectionCookie + '=' + token + '; Path=/api/rooms; HttpOnly; SameSite=Lax; Max-Age=31536000' + (url.protocol === 'https:' ? '; Secure' : ''));
}
async function memberCookies(request, url, code, token) {
  const headers = new Headers({'Set-Cookie': sessionCookie(url, code, token)});
  const existing = collectionToken(request);
  const playerToken = existing || random() + random();
  if (!existing) setCollectionCookie(headers, url, playerToken);
  return {headers, collectionId:await hash(playerToken)};
}
const sessionCookie = (url, code, token) => cookieName(code) + '=' + token + '; Path=/api/rooms/' + code + '; HttpOnly; SameSite=Lax; Max-Age=2592000' + (url.protocol === 'https:' ? '; Secure' : '');

async function memberFor(request, db, code) {
  const token = credential(request, code);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return query(db, 'SELECT id, collection_id FROM members WHERE room_code = ? AND token_hash = ?', code, await hash(token)).first();
}

async function roomState(db, room, memberId, headers) {
  const {results} = await query(db, 'SELECT id, name, seat FROM members WHERE room_code = ? ORDER BY joined_at, id', room.code).all();
  return json({code: room.code, title: room.title, ownerId: room.owner_id, me: memberId, members: results}, 200, headers);
}

async function readInput(request,large=false) {
  const body = await request.text();
  if (body.length > (large ? maxCardFileBytes+500 : 48000)) throw new Error('too large');
  const value = JSON.parse(body);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid body');
  if(body.length>48000&&value.action!=='cardImport')throw new Error('too large');
  return value;
}

const clean = (value, limit) => typeof value === 'string' && value.trim().length <= limit && !/[\x00-\x1f\x7f]/.test(value) ? value.trim() : '';

async function api(request, env, url) {
  const db = env.DB;
  if (!db) return error('방 서버에 연결할 수 없습니다.', 503);
  let input = {};
  if (request.method === 'POST') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return error('이 요청을 허용할 수 없습니다.', 403);
    try { input = await readInput(request,/^\/api\/rooms\/[a-f0-9]{16}\/game$/.test(url.pathname)&&url.searchParams.get('import')==='1'); } catch { return error('입력 형식을 확인해 주세요.'); }
  }

  if (url.pathname === '/api/rooms' && request.method === 'POST') {
    const title = clean(input.title, 48), name = clean(input.name, 24);
    if (!title || !name) return error('세션 이름과 닉네임을 확인해 주세요.');
    const code = random().slice(0, 16), id = random(), token = random() + random();
    const {headers, collectionId} = await memberCookies(request, url, code, token);
    await db.batch([
      query(db, 'INSERT INTO rooms(code, title, owner_id) VALUES (?, ?, ?)', code, title, id),
      query(db, 'INSERT INTO members(id, room_code, token_hash, name, seat, joined_at, collection_id) VALUES (?, ?, ?, ?, 0, ?, ?)', id, code, await hash(token), name, Date.now(), collectionId)
    ]);
    return roomState(db, {code, title, owner_id: id}, id, headers);
  }

  const match = url.pathname.match(/^\/api\/rooms\/([a-f0-9]{16})(?:\/(join|seat|leave|remove|game))?$/);
  if (!match) return error('방을 찾을 수 없습니다.', 404);
  const [, code, action] = match;
  const room = await query(db, 'SELECT code, title, owner_id FROM rooms WHERE code = ?', code).first();
  if (!room) return error('방을 찾을 수 없습니다. 초대 링크를 확인해 주세요.', 404);
  const member = await memberFor(request, db, code);

  if (request.method === 'GET' && !action) {
    if (!member) return json({code, title: room.title, invitation: true});
    return roomState(db, room, member.id);
  }
  if (action === 'game' && ['GET','POST'].includes(request.method)) {
    if (!member) return error('먼저 방에 참가해 주세요.', 401);
    const art = request.method === 'GET' && url.searchParams.has('art') ? url.searchParams : null;
    let issuedToken;
    if (!art && !member.collection_id) {
      const existing = collectionToken(request);
      const token = existing || random() + random();
      const id = await hash(token);
      const linked = await query(db, 'UPDATE members SET collection_id = ? WHERE id = ? AND collection_id IS NULL', id, member.id).run();
      if (linked.meta.changes && !existing) issuedToken = token;
    }
    const response = await gameApi(db, room, member.id, request.method === 'GET' ? null : input, art);
    if (issuedToken) setCollectionCookie(response.headers, url, issuedToken);
    return response;
  }
  if (request.method !== 'POST') return error('요청을 확인해 주세요.', 405);
  if (action === 'join') {
    if (member) return roomState(db, room, member.id);
    const name = clean(input.name, 24);
    if (!name) return error('닉네임을 확인해 주세요.');
    const id = random(), token = random() + random();
    const {headers, collectionId} = await memberCookies(request, url, code, token);
    const added = await query(db, `INSERT INTO members(id, room_code, token_hash, name, seat, joined_at, collection_id)
      SELECT ?, ?, ?, ?, NULL, ?, ? WHERE (SELECT COUNT(*) FROM members WHERE room_code = ?) < 24`,
      id, code, await hash(token), name, Date.now(), collectionId, code).run();
    if (!added.meta.changes) return error('대기 인원이 가득 찼습니다.', 409);
    return roomState(db, room, id, headers);
  }
  if (!member) return error('먼저 방에 참가해 주세요.', 401);
  if (action === 'leave') {
    if (member.id === room.owner_id) return error('방장은 로비로 돌아가도 방장 권한이 유지됩니다.', 409);
    await query(db, 'DELETE FROM members WHERE id = ? AND room_code = ?', member.id, code).run();
    return json({ok: true}, 200, {'Set-Cookie': sessionCookie(url, code, '').replace('Max-Age=2592000','Max-Age=0')});
  }
  if (member.id !== room.owner_id) return error('방장만 참가자 역할을 배정할 수 있습니다.', 403);
  if (typeof input.id !== 'string') return error('참가자를 선택해 주세요.');
  if (action === 'remove') {
    if (input.id === room.owner_id) return error('방장은 내보낼 수 없습니다.', 409);
    await query(db, 'DELETE FROM members WHERE id = ? AND room_code = ?', input.id, code).run();
    return roomState(db, room, member.id);
  }
  if (action !== 'seat' || (input.seat !== null && !(Number.isInteger(input.seat) && input.seat >= 0 && input.seat <= 4))) return error('유효한 자리를 선택해 주세요.');
  try {
    const changed = await query(db, 'UPDATE members SET seat = ? WHERE id = ? AND room_code = ?', input.seat, input.id, code).run();
    if (!changed.meta.changes) return error('참가자가 방에 없습니다.', 404);
  } catch (e) {
    if (/UNIQUE constraint/i.test(String(e))) return error('이미 사용 중인 자리입니다.', 409);
    throw e;
  }
  return roomState(db, room, member.id);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith('/api/')) return await api(request, env, url);
      const route = /^\/room\/[a-f0-9]{16}\/game\/?$/.test(url.pathname) ? '/game.html' : url.pathname === '/' || /^\/room\/[a-f0-9]{16}\/?$/.test(url.pathname) ? '/index.html' : url.pathname;
      const asset = Object.hasOwn(assets, route) ? assets[route] : null;
      if (!asset) return new Response('페이지를 찾을 수 없습니다.', {status: 404, headers: baseHeaders});
      return new Response(asset.base64 ? Uint8Array.from(atob(asset.base64), byte=>byte.charCodeAt(0)) : asset.body, {headers: {...baseHeaders, 'Content-Type': asset.type}});
    } catch (e) {
      console.error('Room operation failed', e);
      return error('방 서버에서 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.', 500);
    }
  }
};
