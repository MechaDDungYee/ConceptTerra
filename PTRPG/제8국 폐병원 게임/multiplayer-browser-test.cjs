const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const ac=await browser.newContext({viewport:{width:1440,height:900}}),bc=await browser.newContext({viewport:{width:844,height:390}}),a=await ac.newPage(),b=await bc.newPage(),errors=[];
 for(const p of [a,b])p.on('pageerror',e=>errors.push(e.message));
 await a.goto('http://127.0.0.1:5189/game/index.html');await a.getByRole('button',{name:'함께 플레이'}).click();await a.locator('#room-connect [name=name]').fill('테스트 방장');await a.getByRole('button',{name:'방 만들기',exact:true}).click();await a.waitForSelector('#room-ready');
 const code=(await a.locator('#room-body h2 span').innerText());
 await b.goto('http://127.0.0.1:5189/game/index.html?room='+code);await b.locator('#room-connect [name=name]').fill('테스트 참가자');await b.getByRole('button',{name:'참가하기',exact:true}).click();await b.waitForSelector('#room-ready');
 for(const p of [a,b]){await p.locator('#room-character button[type=submit]').click();await p.waitForTimeout(150);await p.locator('#room-ready').click();}
 await a.waitForFunction(()=>document.querySelectorAll('#room-members b').length===2&&[...document.querySelectorAll('#room-members b')].every(el=>el.textContent==='준비 완료'));
 await a.locator('#room-start').click();await b.waitForFunction(()=>!document.querySelector('#room-dialog').open);
 await b.locator('[data-choice="1"]').click();await a.waitForFunction(()=>document.querySelector('[data-choice="1"] .vote-count')?.textContent==='1/2');assert.equal((await b.evaluate(()=>PTRPG.snapshot())).scene,'ward');assert.equal(await a.locator('[data-choice="1"] .vote-profile').count(),1);await a.screenshot({path:__dirname+'/qa-votes-desktop.png'});await b.screenshot({path:__dirname+'/qa-votes-mobile.png'});
 await b.locator('[data-choice="2"]').click();await a.waitForFunction(()=>document.querySelector('[data-choice="2"] .vote-count')?.textContent==='1/2');assert.equal(await a.locator('[data-choice="1"] .vote-profile').count(),0);await b.locator('[data-choice="1"]').click();await a.waitForFunction(()=>document.querySelector('[data-choice="1"] .vote-count')?.textContent==='1/2');
 await a.locator('[data-choice="1"]').click();await a.waitForFunction(()=>PTRPG.snapshot().scene==='introduce');await b.waitForFunction(()=>PTRPG.snapshot().scene==='introduce');assert.equal((await b.evaluate(()=>PTRPG.snapshot())).actor,0);
 await a.locator('#table-toggle').click();await a.locator('#table-form input').fill('문을 열기 전에 같이 확인하자');await a.locator('#table-form button').click();await b.waitForFunction(()=>document.querySelector('#table-messages').textContent.includes('문을 열기 전에'));
 await b.locator('#table-toggle').click();assert.ok((await b.locator('#table-messages').innerText()).includes('테스트 방장'));await b.screenshot({path:__dirname+'/qa-multiplayer-mobile.png'});
 await b.reload();await b.waitForFunction(()=>PTRPG.snapshot().scene==='introduce');assert.equal(await b.evaluate(()=>MP.active),true);
 for(const next of ['knock','lobby']){await a.evaluate(()=>MP.send(MP.voteAction(0)));await b.evaluate(()=>MP.send(MP.voteAction(0)));await a.waitForFunction(next=>PTRPG.snapshot().scene===next,next);await b.waitForFunction(next=>PTRPG.snapshot().scene===next,next);}
 await b.screenshot({path:__dirname+'/qa-votes-lobby-mobile.png'});const overflow=await b.evaluate(()=>[...document.querySelectorAll('#choices .choice')].some(el=>el.getBoundingClientRect().bottom>innerHeight));assert.equal(overflow,false);
 await a.getByRole('button',{name:'함께',exact:true}).click();assert.equal(await a.locator('#room-dialog').evaluate(el=>el.open),true);await a.locator('#room-close').click();await a.screenshot({path:__dirname+'/qa-multiplayer-desktop.png'});
 assert.deepEqual(errors,[]);console.log('Two independent browsers passed: invite, lobby, ready, shared choices, chat, reconnect and desktop/mobile UI.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
