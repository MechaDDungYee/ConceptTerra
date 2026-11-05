const fs = require('node:fs');
const path = require('node:path');
const sharp = require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'assets/battle/motions');
const recordDir = path.join(dir, 'v3-records');
const out = path.join(dir, 'review-v3');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  fs.mkdirSync(path.join(dir, 'sheets/v3'), { recursive: true });
  const records = fs.readdirSync(recordDir).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(path.join(recordDir,f),'utf8')));
  const lines = ['# 모션 v3 재작화 검수', '', '기본 SD는 수정하지 않았다. 아래 파일은 후보이며 아직 게임에 적용하지 않았다.', '',
    'AI 재작화는 원본과 해부학적 비율이 완전히 동일함을 보장하지 못한다. 정확한 동일성이 필수라면 원본 파츠 기반 관절 방식이 필요하다.', '',
    '검수 비교 이미지는 공통 셀 크기로 보여주며, 개별 모션 외곽 높이를 맞춰 비율 차이를 숨기지 않는다.', ''];
  for (const record of records) {
    const file = `${record.id}-${record.batch}.png`;
    const dest = path.join(dir, 'sheets/v3', file);
    if (!fs.existsSync(dest)) fs.copyFileSync(record.source, dest);
    const meta = await sharp(dest).metadata();
    if (!meta.hasAlpha) throw new Error(`No transparent alpha: ${file}`);
    const w = Math.floor(meta.width / 2), h = Math.floor(meta.height / 2);
    const reference = await sharp(record.reference).resize(w,h,{fit:'contain',background:'#30343a'}).png().toBuffer();
    const cells = [];
    for (let i=0; i<record.frames.length; i++) {
      const input = await sharp(dest).extract({left:(i%2)*w,top:Math.floor(i/2)*h,width:w,height:h}).png().toBuffer();
      cells.push({input,left:(i+1)*w,top:0});
    }
    await sharp({create:{width:w*(record.frames.length+1),height:h,channels:4,background:'#30343a'}})
      .composite([{input:reference,left:0,top:0},...cells]).png().toFile(path.join(out,file));
    lines.push(`## ${record.name} / ${record.batch}`, '', `- 원본 크기: ${meta.width} x ${meta.height}. 요청 크기와 다를 수 있으며 패딩이나 확대를 원본 해상도로 주장하지 않는다.`,
      `- 셀 순서: ${record.frames.map(f=>f.key).join(', ')}`, `- 비교: review-v3/${file}`, `- 원본: sheets/v3/${file}`,
      '- 상태: 비율·해부·안전 여백 검수 대기. 배치 2~4의 이루어질은 과한 광원 효과 및 셀 가장자리 침범 때문에 적용 보류.', '', '### 생성 프롬프트', '', record.prompt, '');
  }
  fs.writeFileSync(path.join(dir,'재작화_검수_v3.md'),lines.join('\n')+'\n');
  console.log(`Saved ${records.length} candidate sheets and proportion comparisons; runtime unchanged.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
