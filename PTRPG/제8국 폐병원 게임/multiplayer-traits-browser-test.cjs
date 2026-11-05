const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5189/game/');await page.getByRole('button',{name:'함께 플레이'}).click();await page.locator('#room-connect [name=name]').fill('특성 확인');await page.getByRole('button',{name:'방 만들기',exact:true}).click();await page.waitForSelector('#room-character');
 const form=page.locator('#room-character');assert.equal(await form.locator('.trait-option small').count(),10);assert.ok((await form.locator('.trait-option').first().innerText()).includes('지능 +2'));
 await form.locator('[value=brain]').check();assert.equal(await form.locator('[value=muscle]').isDisabled(),true);
 await form.locator('[value=cautious]').check();await form.locator('[value=emotional]').check();assert.equal(await page.locator('#room-trait-count').innerText(),'시작 특성 · 3 / 3');assert.equal(await form.locator('[value=physical]').isDisabled(),true);
 await form.locator('[name=unique]').selectOption('assassin');assert.ok((await page.locator('#room-unique-description').innerText()).includes('시작 호감도 -3'));assert.ok((await page.locator('#room-trait-preview').innerText()).includes('체력 347'));
 await form.locator('[name=stat-0]').fill('51');assert.equal(await form.locator('[type=submit]').isDisabled(),true);assert.ok((await page.locator('#room-budget').innerText()).includes('151'));
 await form.locator('[name=stat-0]').fill('50');await form.locator('[type=submit]').click();await page.waitForFunction(()=>PTRPG.snapshot().party[0].traits.includes('assassin'));
 const member=await page.evaluate(()=>PTRPG.snapshot().party[0]);assert.equal(member.stats['근력'],48);assert.equal(member.max,347);
 await page.locator('#room-close').click();await page.getByRole('button',{name:'함께',exact:true}).click();assert.equal(await form.locator('[value=brain]').isChecked(),true);assert.equal(await form.locator('[name=unique]').inputValue(),'assassin');
 for(const v of [{width:1440,height:900},{width:844,height:390},{width:390,height:844}]){await page.setViewportSize(v);assert.equal(await page.locator('#room-dialog').evaluate(el=>el.scrollWidth>el.clientWidth+2),false);assert.equal(await page.locator('#room-character').evaluate(el=>el.scrollWidth>el.clientWidth+2),false);await page.screenshot({path:__dirname+`/qa-room-traits-${v.width}.png`});}
 await page.reload();await page.waitForFunction(()=>MP.active&&PTRPG.snapshot().party[0].traits.includes('assassin'));await page.getByRole('button',{name:'함께',exact:true}).click();assert.equal(await form.locator('[value=brain]').isChecked(),true);assert.equal(await form.locator('[name=unique]').inputValue(),'assassin');
 assert.deepEqual(errors,[]);console.log('Multiplayer traits passed: visible effects, exclusions, selection cap, reactive HP/stats/mental preview, server configuration, reopen/reload preservation and three viewports.');
 await page.locator('#room-leave').click();
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
