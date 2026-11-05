const fs = require('node:fs');
const path = require('node:path');
const root = 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/lucide';
const lucide = require(root);
for (const [file, name] of [['users','UsersRound'],['map','Map'],['backpack','Backpack'],['book-open','BookOpen'],['menu','Menu'],['sparkles','Sparkles'],['swords','Swords'],['shield','Shield'],['heart-pulse','HeartPulse'],['crosshair','Crosshair'],['arrow-down','ArrowDown'],['arrow-up','ArrowUp'],['arrow-right','ArrowRight'],['arrow-left','ArrowLeft'],['ear','Ear'],['pause','Pause']]) {
 const children = lucide[name].map(([tag, props]) => `<${tag} ${Object.entries(props).map(([key, value])=>`${key}="${value}"`).join(' ')}/>`).join('');
 fs.writeFileSync(path.join(__dirname,'web/assets',`${file}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#d9dfd3" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${children}</svg>`);
}
fs.copyFileSync(path.join(root,'LICENSE'), path.join(__dirname,'web/assets/lucide-license.txt'));
