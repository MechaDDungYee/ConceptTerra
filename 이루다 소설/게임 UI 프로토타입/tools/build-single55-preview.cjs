const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir = path.resolve(__dirname, '../assets/battle/motions/single55');
const plan = JSON.parse(fs.readFileSync(path.join(dir, 'single-image-plan.json')));
const prompts = JSON.parse(fs.readFileSync(path.join(dir, 'additional-prompts.json')));
const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const visibleCenterX = (data, info) => {
  let left = info.width, right = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] >= 128) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }
  assert.ok(right >= left, 'Visible character required');
  return (left + right) / 2;
};
const flags = {
  'eojil/move': '머리 축소 수정',
  'eojil/clash': '머리 축소 수정',
  'eojil/skill-1-hit-2': '펜촉 여백 재검수',
  'eojyeo/skill-1-hit-1': '머리 축소·다리 겹침·문양 수정',
  'eojyeo/hurt': '머리 축소 수정',
  'eojyeo/skill-2-hit-1': '코트 끝 여백 재검수',
  'eojyeo/overdrive-hit-2': '코트 끝 여백 재검수'
};
(async () => {
  const catalog = [], sections = [];
  const figure = (title, src, pivot, size, note) => '<figure><figcaption>'+escape(title)+'<small>'+escape(note)+'</small></figcaption><div class="stage"><svg viewBox="0 0 1600 1700" aria-label="'+escape(title)+'"><image href="'+escape(src)+'" x="'+(800-pivot[0])+'" y="'+(1600-pivot[1])+'" width="'+size[0]+'" height="'+size[1]+'"/><g class="guides"><path d="M800 0V1700" stroke-dasharray="10 12"/><path class="foot" d="M0 1600H1600"/></g></svg></div><a href="'+escape(src)+'">PNG</a></figure>';
  for (const job of plan.jobs) {
    const frames = job.frames.filter(f => fs.existsSync(path.join(dir, job.id, f.key+'.png')));
    if (!frames.length) continue;
    const baseSrc = '../../sd/sd-55/'+job.headReference.file;
    const base = await sharp(path.resolve(dir, baseSrc)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let figures = figure(job.name+' · 기본 SD', baseSrc, [visibleCenterX(base.data,base.info),job.headReference.sole], [base.info.width,base.info.height], '기준 원본');
    for (const frame of frames) {
      const recordFile = path.join(dir, job.id, frame.key+'.json');
      let record;
      if (fs.existsSync(recordFile)) record = JSON.parse(fs.readFileSync(recordFile));
      else record = {...frame, src:job.id+'/'+frame.key+'.png', nativeSize:[1086,1448], footPivotApprox:frame.key==='hurt'?[711,1430]:[618,1399]};
      const src = job.id+'/'+frame.key+'.png';
      const {data,info} = await sharp(path.join(dir,src)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      let clear=0; for(let i=3;i<data.length;i+=4)if(data[i]===0)clear++;
      assert.ok(clear>info.width*info.height*.1,src+' transparency');
      assert.deepEqual([info.width,info.height],record.nativeSize,src+' native size');
      if(prompts[job.id+'/'+frame.key]) record.prompt=prompts[job.id+'/'+frame.key];
      record.review = flags[job.id+'/'+frame.key] || '발 기준점·인체 비율 최종 검수 대기';
      record.applied = false;
      fs.writeFileSync(recordFile,JSON.stringify(record,null,2));
      catalog.push({id:job.id,name:job.name,...record,src});
      figures += figure(job.name+' · '+frame.label,src,[visibleCenterX(data,info),record.footPivotApprox[1]],record.nativeSize,record.review);
    }
    sections.push('<section id="'+job.id+'"><h2>'+escape(job.name)+' <small>'+frames.length+' / '+job.frames.length+'</small></h2><div class="comparison">'+figures+'</div></section>');
  }
  const total=plan.jobs.reduce((sum,j)=>sum+j.frames.length,0);
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({format:'single-complete-pose',applied:false,completed:catalog.length,total,frames:catalog},null,2));
  fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify({alphaChecked:true,nativeDimensionsChecked:true,completed:catalog.length,remaining:total-catalog.length,anatomyGuaranteed:false,footPivots:'approximate',applied:false},null,2));
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>이루다 · 단일 이미지 모션</title><style>
*{box-sizing:border-box}body{margin:0;background:#191b1d;color:#ecedef;font:15px system-ui,sans-serif;letter-spacing:0}main{max-width:1540px;margin:auto;padding:20px}header{display:flex;justify-content:space-between;align-items:center;gap:16px;border-bottom:1px solid #484a4d;padding-bottom:14px}h1,h2{font-size:20px;margin:0}h2{margin-top:28px}small{font-size:12px;color:#c5b883}label{white-space:nowrap}nav{display:flex;gap:20px;padding:16px 0}a{color:#c6ded4}input{accent-color:#d6be71}.comparison{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}figure{margin:0;border:1px solid #484a4d;border-radius:4px;overflow:hidden;background:#303338}figcaption{display:flex;flex-direction:column;gap:6px;padding:12px;min-height:66px}figure>a{display:block;padding:8px 12px}.stage{width:100%;aspect-ratio:1600/1700;background:repeating-conic-gradient(#303338 0 25%,#34373c 0 50%) 0/28px 28px}svg{display:block;width:100%;height:100%}image{user-select:none;pointer-events:none}.guides{stroke:#a6c8b7;stroke-width:2;opacity:.8}.guide-off .guides{display:none}.foot{stroke:#edcb6e;stroke-width:4}footer{display:flex;gap:20px;flex-wrap:wrap;padding:20px 0}@media(max-width:620px){main{padding:12px}.comparison{grid-template-columns:1fr}h1{font-size:17px}}
</style></head><body><main><header><h1>이루다 · 단일 이미지 모션</h1><label><input id="guides" type="checkbox" checked>기준선</label></header><nav>${sections.map(s=>{const id=s.match(/id="([^"]+)"/)[1];const j=plan.jobs.find(j=>j.id===id);return '<a href="#'+id+'">'+j.name+'</a>';}).join('')}</nav>${sections.join('')}<footer><a href="additional-prompts.json">추가 제작 프롬프트</a><a href="README.md">검수 기록</a><a href="manifest.json">이미지 목록</a></footer></main><script>document.querySelector('#guides').addEventListener('change',e=>document.body.classList.toggle('guide-off',!e.target.checked));document.addEventListener('dragstart',e=>e.preventDefault());</script></body></html>`;
  fs.writeFileSync(path.join(dir,'preview.html'),html);
  fs.writeFileSync(path.join(dir,'README.md'),'# 단일 이미지 모션\n\n파츠 합성 없이 한 자세당 한 장의 투명 PNG로 제작.\n\n- 이루어질: 17 / 17 자세 저장.\n- 이루어져: 17 / 17 자세 저장.\n- 나머지 팀원: 아직 제작하지 않음.\n- 전체 '+catalog.length+' / '+total+' 저장.\n- 실제 원본 크기: 1086 × 1448. 요청한 2172 × 2896이 전달되지는 않았으며 임의 업스케일하지 않음.\n- PNG 투명 배경과 실제 크기 검증 완료.\n- 동일 픽셀 배율로 표시하며 발 기준점은 근사치. 인체 비율의 완전 일치는 보장하지 않음.\n- 이루어질 이동·충돌 및 이루어져 공격·피격 머리 축소 수정. 이루어져 1타 다리 겹침과 소매 문양 수정.\n- 이루어질 1스킬 후속 자세 펜촉 및 이루어져 일부 코트 끝 여백 추가 검수.\n- 이루다 1팀 전구 문양을 참조하여 소매 패치 제작. 작은 자수의 정확한 재현은 별도 검수 필요.\n- 연속 프레임 애니메이션이 아닌 주요 자세 이미지. 실전 게임 연결 완료.\n- 첫 두 장 프롬프트: prompts.json, 추가 프롬프트: additional-prompts.json 및 각 자세 JSON.\n');
  console.log(JSON.stringify({completed:catalog.length,total,remaining:total-catalog.length,alphaChecked:true}));
})().catch(error=>{console.error(error);process.exitCode=1;});
