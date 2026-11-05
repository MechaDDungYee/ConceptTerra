(async () => {
  const rig = await (await fetch('rig.json')).json();
  const image = new Image();
  image.src = rig.texture;
  await image.decode();
  const canvas = document.getElementById('avatar');
  const ctx = canvas.getContext('2d');
  const sliders = Object.fromEntries(['headX', 'headY', 'bodyX', 'hair'].map(key => [key, document.getElementById(key)]));
  let autoplay = true;
  let pointer = { x: 0, y: 0, inside: false };
  document.getElementById('autoplay').onclick = event => {
    autoplay = !autoplay;
    event.currentTarget.textContent = autoplay ? '자동 움직임 끄기' : '자동 움직임 켜기';
  };
  canvas.addEventListener('pointermove', event => {
    const box = canvas.getBoundingClientRect();
    pointer = { x: ((event.clientX - box.left) / box.width - 0.5) * 2,
      y: ((event.clientY - box.top) / box.height - 0.5) * 2, inside: true };
  });
  canvas.addEventListener('pointerleave', () => { pointer.inside = false; });

  const W = rig.canvas.width, H = rig.canvas.height;
  const nx = rig.mesh.columns, ny = rig.mesh.rows;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const rotate = (x, y, px, py, angle) => {
    const s = Math.sin(angle), c = Math.cos(angle);
    return [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c];
  };
  function vertex(x, y, p) {
    const torsoWeight = 1 - smooth(480, 1450, y);
    const neckWeight = 1 - smooth(225, 315, y);
    let [dx, dy] = rotate(x, y, 512, 530, p.bodyX * 0.055 * torsoWeight);
    [dx, dy] = rotate(dx, dy, 512, 238, p.headX * 0.13 * neckWeight);
    dx += p.headX * 14 * neckWeight;
    dy += p.headY * 10 * neckWeight;
    dy += (y - 238) * p.headY * 0.045 * neckWeight;
    const hairRegion = smooth(380, 475, Math.abs(x - 512)) * (1 - smooth(760, 1120, y)) * smooth(130, 350, y);
    dx += p.hair * 29 * hairRegion;
    dy += Math.sin((y / 130) + p.time * 2.5) * 4 * hairRegion;
    const chest = smooth(280, 410, y) * (1 - smooth(480, 670, y));
    dx += (x - 512) * chest * p.breath * 0.012;
    dy -= chest * p.breath * 3;
    return [dx, dy];
  }
  function triangle(src, dst) {
    const [a, b, c] = src, [d, e, f] = dst;
    const det = (b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);
    if (Math.abs(det) < 1e-6) return;
    const m00 = ((e[0]-d[0])*(c[1]-a[1])-(f[0]-d[0])*(b[1]-a[1]))/det;
    const m01 = ((f[0]-d[0])*(b[0]-a[0])-(e[0]-d[0])*(c[0]-a[0]))/det;
    const m10 = ((e[1]-d[1])*(c[1]-a[1])-(f[1]-d[1])*(b[1]-a[1]))/det;
    const m11 = ((f[1]-d[1])*(b[0]-a[0])-(e[1]-d[1])*(c[0]-a[0]))/det;
    const tx = d[0]-m00*a[0]-m01*a[1], ty = d[1]-m10*a[0]-m11*a[1];
    ctx.save();
    const cx = (d[0] + e[0] + f[0]) / 3, cy = (d[1] + e[1] + f[1]) / 3;
    const expand = point => {
      const vx = point[0] - cx, vy = point[1] - cy;
      const scale = 1 + 1.5 / Math.max(1, Math.hypot(vx, vy));
      return [cx + vx * scale, cy + vy * scale];
    };
    const [dd, ee, ff] = [d, e, f].map(expand);
    ctx.beginPath(); ctx.moveTo(dd[0], dd[1]); ctx.lineTo(ee[0], ee[1]); ctx.lineTo(ff[0], ff[1]); ctx.closePath(); ctx.clip();
    ctx.setTransform(m00, m10, m01, m11, tx, ty);
    const minX = Math.floor(Math.min(a[0], b[0], c[0]));
    const minY = Math.floor(Math.min(a[1], b[1], c[1]));
    const maxX = Math.ceil(Math.max(a[0], b[0], c[0]));
    const maxY = Math.ceil(Math.max(a[1], b[1], c[1]));
    ctx.drawImage(image, minX, minY, maxX - minX, maxY - minY,
      minX, minY, maxX - minX, maxY - minY);
    ctx.restore();
  }
  function frame(now) {
    const time = now / 1000;
    const input = key => Number(sliders[key].value);
    const follow = pointer.inside ? pointer.x : Math.sin(time * 0.65) * 0.4;
    const followY = pointer.inside ? pointer.y : Math.sin(time * 0.42) * 0.2;
    const p = { headX: clamp(input('headX') + (autoplay ? follow * 0.5 : 0), -1, 1),
      headY: clamp(input('headY') + (autoplay ? followY * 0.35 : 0), -1, 1),
      bodyX: clamp(input('bodyX') + (autoplay ? follow * 0.17 : 0), -1, 1),
      hair: clamp(input('hair') + (autoplay ? Math.sin(time * 1.2) * 0.35 : 0), -1, 1),
      breath: autoplay ? (Math.sin(time * 1.9) + 1) / 2 : 0, time };
    ctx.clearRect(0, 0, W, H);
    const points = Array.from({length: ny+1}, (_, j) => Array.from({length: nx+1}, (_, i) => {
      const x = i * W / nx, y = j * H / ny;
      return {src:[x,y],dst:vertex(x,y,p)};
    }));
    for (let j=0;j<ny;j++) for(let i=0;i<nx;i++) {
      const a=points[j][i], b=points[j][i+1], c=points[j+1][i], d=points[j+1][i+1];
      triangle([a.src,b.src,c.src],[a.dst,b.dst,c.dst]);
      triangle([b.src,d.src,c.src],[b.dst,d.dst,c.dst]);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})().catch(error => { document.body.insertAdjacentText('beforeend', '모델을 불러오지 못했습니다: ' + error.message); });
