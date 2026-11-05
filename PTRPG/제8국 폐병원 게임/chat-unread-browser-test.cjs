const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const ac=await browser.newContext({viewport:{width:1440,height:900}}),bc=await browser.newContext({viewport:{width:844,height:390}}),a=await ac.newPage(),b=await bc.newPage(),errors=[];
 for(const p of [a,b])p.on('pageerror',e=>errors.push(e.message));
 await a.goto('http://127.0.0.1:5189/game/');await a.getByRole('button',{name:'함께 플레이'}).click();await a.locator('#room-connect [name=name]').fill('동일 이름');await a.getByRole('button',{name:'방 만들기',exact:true}).click();await a.waitForSelector('#room-ready');const code=await a.locator('#room-body h2 span').innerText();
 await b.goto('http://127.0.0.1:5189/game/?room='+code);await b.locator('#room-connect [name=name]').fill('동일 이름');await b.getByRole('button',{name:'참가하기',exact:true}).click();await b.waitForSelector('#room-ready');for(const p of [a,b])await p.locator('#room-close').click();
 const send=async(p,text)=>{await p.waitForTimeout(850);await p.evaluate(text=>MP.send({type:'chat',text}),text);};
 await send(a,'첫 메시지');await b.waitForFunction(()=>!document.querySelector('#table-unread').hidden&&document.querySelector('#table-unread').textContent==='1');assert.equal(await a.locator('#table-unread').isVisible(),false);
 await send(a,'둘째 메시지');await b.waitForFunction(()=>document.querySelector('#table-unread').textContent==='2');
 await b.reload();await b.waitForFunction(()=>!document.querySelector('#table-unread').hidden&&document.querySelector('#table-unread').textContent==='2');
 for(const v of [{width:1440,height:900},{width:844,height:390},{width:390,height:844}]){await b.setViewportSize(v);const r=await b.locator('#table-unread').boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=v.width);await b.screenshot({path:__dirname+`/qa-chat-unread-${v.width}.png`});}
 await b.locator('#table-toggle').click();assert.equal(await b.locator('#table-unread').isVisible(),false);
 await send(a,'열린 창의 메시지');await b.waitForFunction(()=>document.querySelector('#table-messages').textContent.includes('열린 창의 메시지'));assert.equal(await b.locator('#table-unread').isVisible(),false);
 await b.locator('#table-hide').click();await send(b,'내가 쓴 메시지');assert.equal(await b.locator('#table-unread').isVisible(),false);await a.waitForFunction(()=>document.querySelector('#table-unread').textContent==='1');
 await send(a,'다시 미확인');await b.waitForFunction(()=>!document.querySelector('#table-unread').hidden&&document.querySelector('#table-unread').textContent==='1');await b.locator('#table-toggle').click();assert.equal(await b.locator('#table-unread').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('Unread chat passed: accurate count, same-name senders distinguished, self exclusion, open-chat reading, reload preservation and three viewport badge placement.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
