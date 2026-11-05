(() => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms * (window.battlePlaybackTimingScale ?? 1)));
  const signed = n => n > 0 ? `+${n}` : String(n);
  const colors = ['#ab4048', '#bb674c', '#ad915c', '#9ca7a7', '#629a9a', '#5f9ec7', '#dac16c'];
  function pairLayout(points, anchorIndex, height) {
    const positions = points.map(point => ({ ...point }));
    if (points.length !== 2) return { positions, mode: 'unchanged' };
    const dx = points[1].x - points[0].x, dy = Math.abs(points[1].y - points[0].y);
    const vertical = dy > Math.max(10, Math.abs(dx) * .65);
    const close = Math.abs(dx) < height * .85;
    const far = Math.hypot(dx, dy) > height * 2.4;
    if (!vertical && !close && !far) return { positions, mode: 'unchanged' };
    const gap = close || far ? height * 1.15 : Math.max(height * .95, Math.min(height * 1.8, Math.abs(dx)));
    const other = 1 - anchorIndex;
    const direction = Math.sign(points[other].x - points[anchorIndex].x) || (other === 0 ? -1 : 1);
    positions[other] = { x: points[anchorIndex].x + direction * gap, y: points[anchorIndex].y };
    return { positions, mode: far ? 'approach' : vertical ? 'align' : 'separate' };
  }
  window.battlePlaybackPairLayout = pairLayout;
  let audio;
  function chime() {
    if (!audio || audio.state !== 'running') return;
    const tone = audio.createOscillator(), volume = audio.createGain();
    tone.frequency.value = 1046;
    volume.gain.setValueAtTime(.025, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .12);
    tone.connect(volume); volume.connect(audio.destination);
    tone.start(); tone.stop(audio.currentTime + .12);
  }

  function drawGauge(canvas, angle, selected = -1) {
    const width = 220, height = 128, ratio = window.devicePixelRatio || 1;
    if (canvas.width !== width * ratio) { canvas.width = width * ratio; canvas.height = height * ratio; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height);
    const x = 110, y = 111;
    for (let i = 0; i < 7; i++) {
      const start = -Math.PI + i * Math.PI / 7 + .014, end = start + Math.PI / 7 - .028;
      ctx.beginPath(); ctx.arc(x, y, 99, start, end); ctx.arc(x, y, 61, end, start, true); ctx.closePath();
      ctx.fillStyle = colors[i]; ctx.globalAlpha = selected < 0 || selected === i ? 1 : .4; ctx.fill();
      if (selected === i) { ctx.strokeStyle = '#fff5c7'; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.globalAlpha = 1;
      const mid = (start + end) / 2;
      ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff'; ctx.fillText(signed(i - 3), x + Math.cos(mid) * 80, y + Math.sin(mid) * 80);
    }
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(91, 0); ctx.lineTo(-9, -5); ctx.lineTo(-9, 5); ctx.closePath();
    ctx.fillStyle = '#fff5c7'; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fillStyle = '#f6e4a2'; ctx.fill();
  }

  async function spinGauge(canvas, wave) {
    const first = canvas.dataset.hasSpun !== 'true';
    canvas.dataset.hasSpun = 'true';
    canvas.dataset.spinMode = first ? 'rotate' : 'snap';
    if (!first) {
      drawGauge(canvas, -Math.PI + (wave + 3.5) * Math.PI / 7, wave + 3);
      canvas.dataset.wave = wave;
      canvas.setAttribute('aria-label', `파형 판정 ${signed(wave)}`);
      chime(); await wait(180); return;
    }
    const start = -Math.PI / 2;
    let finish = -Math.PI + (wave + 3.5) * Math.PI / 7 + Math.PI * 2;
    while (finish - start < Math.PI * 2) finish += Math.PI * 2;
    const duration = 720 * (window.battlePlaybackTimingScale ?? 1);
    await new Promise(resolve => {
      let began;
      const frame = time => {
        began ??= time;
        const progress = duration <= 0 ? 1 : Math.min(1, (time - began) / duration);
        drawGauge(canvas, start + (finish - start) * (1 - (1 - progress) ** 3), progress === 1 ? wave + 3 : -1);
        if (progress < 1) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
    canvas.dataset.wave = wave;
    canvas.setAttribute('aria-label', `파형 판정 ${signed(wave)}`);
    chime();
    canvas.classList.add('settled'); await wait(150); canvas.classList.remove('settled');
  }

  window.playBattleExecution = async execution => {
    const root = document.querySelector('#battle-dummy');
    if (!root || !execution || battlePresentationActive) return;
    battlePresentationActive = true;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio) { audio ||= new Audio(); audio.resume().catch(() => {}); }
    } catch { /* Audio is optional when the browser blocks it. */ }
    const overlay = document.createElement('section');
    overlay.className = 'battle-playback'; overlay.setAttribute('aria-label', '전투 행동 재생');
    overlay.innerHTML = `<div class="playback-world"><div class="playback-actors"></div></div><header class="playback-header"><span>턴 ${execution.turn} · 행동 실행</span><strong class="playback-order"></strong></header><div class="playback-verdict" role="status"></div><div class="playback-damage-layer" aria-live="polite"></div>`;
    root.append(overlay); root.classList.add('is-playing');
    const effects = window.createBattleEffects?.(overlay);
    const controls = [...root.children].filter(el => el !== overlay);
    controls.forEach(el => el.inert = true);
    const units = new Map(execution.steps.flatMap(step => step.units).map(unit => [unit.id, unit]));
    const plans = new Map(execution.steps[0].schedule.flatMap(event => event.plans).map(plan => [plan.id, plan]));
    const actors = new Map();
    const actorActions = new Map();
    const usedActions = new Map();
    const decodedMotions = new Map();
    const world = overlay.querySelector('.playback-world');
    const field = root.querySelector('.battle-field');
    const fieldBounds = field.getBoundingClientRect();
    const backdrop = document.createElement('div');
    backdrop.className = 'playback-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    const fieldAppearance = getComputedStyle(field);
    backdrop.style.background = fieldAppearance.background;
    overlay.prepend(backdrop);
    field.querySelectorAll('.battle-unit-layer, .battle-arrow-overlay').forEach(el => el.remove());
    field.classList.add('playback-field');
    field.style.left = `${fieldBounds.left}px`; field.style.top = `${fieldBounds.top}px`;
    field.style.width = `${fieldBounds.width}px`; field.style.height = `${fieldBounds.height}px`;
    field.style.setProperty('--battle-rot', '0deg');
    field.style.setProperty('--battle-tilt', '60deg');
    field.style.setProperty('--counter-rot', '0deg');
    field.querySelector('.battle-camera').style.transform = 'none';
    field.querySelectorAll('.battle-cell').forEach(cell => cell.className = 'battle-cell');
    world.prepend(field);
    const actorLayer = overlay.querySelector('.playback-actors');
    const origins = new Map();
    const allActors = new Map();
    function emitEffect(kind, unitId, targetId, action, hit = 1) {
      return effects?.emit({kind,unit:units.get(unitId),action,hit,
        source:allActors.get(unitId),target:allActors.get(targetId)});
    }
    function idlePose(id) {
      const actor = allActors.get(id), unit = units.get(id), img = actor?.querySelector('.playback-sprite');
      if (!img || !unit.image) return;
      if (img.getAttribute('src') !== unit.image) img.src = unit.image;
      const registration = window.battleSpriteRegistration?.(unit.name);
      img.classList.toggle('registered-sprite', !!registration);
      if (registration) {
        img.style.setProperty('--motion-scale', registration.renderScale);
        img.style.setProperty('--motion-bottom', registration.bottomOffset);
      }
      img.classList.remove('motion-sprite'); actor.dataset.motion = 'idle';
      img.style.setProperty('--motion-center', .5);
    }
    async function pose(id, key, action, hit = 1) {
      const actor = allActors.get(id), unit = units.get(id), img = actor?.querySelector('.playback-sprite');
      if (!img || unit?.side !== 'ally') return;
      const motion = window.battleMotionFrame?.(unit.name, key, action, hit);
      if (!motion) { idlePose(id); return; }
      if (!decodedMotions.has(motion.src)) {
        const source = new Image(); source.src = motion.src;
        decodedMotions.set(motion.src, source.decode().then(() => source).catch(() => null));
      }
      if (!await decodedMotions.get(motion.src)) { idlePose(id); return; }
      img.src = motion.src; img.classList.add('motion-sprite');
      img.style.setProperty('--motion-scale', motion.renderScale);
      img.style.setProperty('--motion-bottom', motion.bottomOffset);
      img.style.setProperty('--motion-center', motion.centerX ?? .5);
      actor.dataset.motion = motion.key;
    }
    function tilePoint(unit) {
      const cell = field.querySelector(`[data-cell-x="${unit.x}"][data-cell-y="${unit.y}"]`);
      const bounds = cell?.getBoundingClientRect(), frame = overlay.getBoundingClientRect();
      if (!bounds) return { x: frame.width * (unit.side === 'ally' ? .3 : .7), y: frame.height * .65 };
      // Grid positions belong to world space, even after the camera has moved.
      const transform = getComputedStyle(world).transform;
      const inverse = new DOMMatrix(transform === 'none' ? undefined : transform).inverse();
      const point = inverse.transformPoint({ x: bounds.left + bounds.width / 2 - frame.left,
        y: bounds.top + bounds.height / 2 - frame.top });
      return { x: point.x, y: point.y };
    }
    function createActor(unit) {
      const actor = document.createElement('article');
      actor.className = 'playback-actor'; actor.dataset.unit = unit.id;
      actor.innerHTML = `<div class="playback-action"></div><div class="playback-figure">${unit.image
        ? `<img class="playback-sprite" src="${escapeHtml(unit.image)}" alt="${escapeHtml(unit.name)}" draggable="false">`
        : '<div class="playback-concept-body"><span class="enemy-core"></span></div>'}</div>
        <div class="playback-vitals"><div class="playback-hp"><span class="playback-hp-fill"></span><b class="playback-hp-number"></b></div><b class="playback-sp"></b></div>`;
      actorLayer.append(actor); allActors.set(unit.id, actor); idlePose(unit.id); return actor;
    }
    execution.steps[0].units.forEach(unit => {
      const actor = createActor(unit), point = tilePoint(unit);
      origins.set(unit.id, point);
      actor.dataset.originX = point.x; actor.dataset.originY = point.y;
      actor.style.left = `${point.x}px`; actor.style.top = `${point.y}px`;
      if (unit.hp <= 0) actor.hidden = true;
    });
    let pairKey = '';
    const attackStack = [];
    const presentedHits = new WeakMap();
    async function presentStrike(unitId, hit) {
      const attack = attackStack.at(-1);
      if (!attack || attack.unitId !== unitId) return;
      const seen = presentedHits.get(attack) || new Set();
      if (seen.has(hit)) return;
      seen.add(hit); presentedHits.set(attack,seen);
      await pose(unitId,'attack',attack.action,hit);
      if (emitEffect('cast',unitId,attack.targetId,attack.action,hit)) await wait(140);
      const figure = actors.get(unitId)?.querySelector('.playback-figure');
      if (figure) { figure.classList.remove('attack-contact'); void figure.offsetWidth; figure.classList.add('attack-contact'); }
    }
    const verdict = overlay.querySelector('.playback-verdict');
    const state = snapshot => {
      snapshot.forEach(unit => {
        const actor = allActors.get(unit.id); if (!actor) return;
        actor.querySelector('.playback-hp-fill').style.width = `${unit.hp / unit.maxHp * 100}%`;
        actor.querySelector('.playback-hp-number').textContent = `${unit.hp} / ${unit.maxHp}`;
        actor.querySelector('.playback-sp').textContent = unit.sp;
      });
    };
    function floatingText(actor, text, effect = false) {
      if (!actor) return;
      const number = document.createElement('strong');
      number.className = `playback-damage${effect ? ' playback-effect' : ''}`;
      number.textContent = text;
      const body = actor.querySelector('.playback-figure').getBoundingClientRect();
      const frame = overlay.getBoundingClientRect();
      number.style.left = `${Math.max(25, Math.min(frame.width - 25, body.left + body.width / 2 - frame.left))}px`;
      number.style.top = `${Math.max(25, Math.min(frame.height - 55, body.top + body.height * .38 - frame.top))}px`;
      overlay.querySelector('.playback-damage-layer').append(number);
      setTimeout(() => number.remove(), 1250);
      return number;
    }
    function highlightAffected(ids = []) {
      const affected = new Set(ids);
      allActors.forEach((actor, id) => actor.classList.toggle('affected', affected.has(id)));
    }
    async function showPair(leftId, rightId, leftAction, rightAction, snapshot, approach = false, affectedIds = []) {
      let entries = [{ id: leftId, action: leftAction }, { id: rightId, action: rightAction }].filter(entry => entry.id);
      entries = entries.filter((entry, index) => entries.findIndex(other => other.id === entry.id) === index);
      entries.sort((a, b) => origins.get(a.id).x - origins.get(b.id).x || origins.get(a.id).y - origins.get(b.id).y);
      const key = entries.map(entry => `${entry.id}:${entry.action?.name}`).join('|');
      if (pairKey === key) return;
      const samePair = entries.length === actors.size && entries.every(entry=>actors.has(entry.id));
      pairKey = key; actors.clear(); verdict.textContent = '';
      overlay.dataset.camera = 'side';
      if (!samePair) {
      overlay.dataset.phase = 'focus';
      overlay.dataset.focusCount = Number(overlay.dataset.focusCount || 0) + 1;
      // Reset presentation positions only, never the combat grid coordinates.
      allActors.forEach((actor, id) => {
        idlePose(id);
        actor.classList.remove('active', 'left', 'right', 'affected'); actor.style.transition = 'none';
        const point = origins.get(id);
        actor.style.left = `${point.x}px`; actor.style.top = `${point.y}px`;
      });
      }
      entries.forEach((entry, index) => {
        const unit = units.get(entry.id), action = entry.action;
        if (!unit) return;
        const actor = allActors.get(unit.id) || createActor(unit);
        actor.hidden = false; actor.classList.add('active', index === 0 ? 'left' : 'right');
        const changed = !samePair || JSON.stringify(actorActions.get(unit.id)) !== JSON.stringify(action);
        if (changed) {
        actor.querySelector('.playback-action').className = `playback-action${action ? '' : ' no-action'}`;
        actor.querySelector('.playback-action').innerHTML = `<small>${escapeHtml(unit.name)}</small><h3>${escapeHtml(action?.name || (isBattleSupportAction(leftAction) ? '지원 대상' : '피격'))}</h3>
            <div class="playback-power"><strong>${action?.power ?? '—'}</strong><span>${action ? signed(action.wave || 0) : ''}</span><b class="playback-total">${action?.power ?? '—'}</b></div>
            <div class="playback-hits">${action?.sequence || action?.legacy ? '' : Array.from({ length: Math.max(0, action?.hits || 0) }, (_, hit) => `<span class="playback-hit" data-hit="${hit + 1}"><img src="assets/icons/hit-sword.png" alt=""><b>${hit + 1}</b></span>`).join('')}</div>
            <div class="playback-wave"><canvas aria-label="파형 판정 게이지"></canvas><span class="playback-roll-label"></span></div>
          `;
        drawGauge(actor.querySelector('canvas'), -Math.PI / 2);
        }
        actors.set(actor.dataset.unit, actor);
        actorActions.set(unit.id, action);
      });
      highlightAffected(affectedIds);
      state(snapshot);
      // A response changes the HUD, not the participants' positions or camera.
      if (samePair) { overlay.dataset.phase = 'judgment'; return; }
      const small = overlay.clientHeight <= 540;
      const unitHeight = small ? 82 : 150;
      const anchorIndex = Math.max(0, entries.findIndex(entry=>entry.id===(approach ? rightId : leftId)));
      const originalPoints = entries.map(entry => origins.get(entry.id));
      const layout = pairLayout(originalPoints, anchorIndex, unitHeight);
      if (approach && originalPoints.length === 2) {
        const moving = 1 - anchorIndex;
        const direction = Math.sign(originalPoints[moving].x - originalPoints[anchorIndex].x) || (moving === 0 ? -1 : 1);
        layout.positions[moving] = { x: originalPoints[anchorIndex].x + direction * unitHeight * 1.15, y: originalPoints[anchorIndex].y };
        layout.mode = 'approach';
      }
      const points = layout.positions;
      // Swap only artwork: the approach never changes simulation coordinates.
      for (let index = 0; index < entries.length; index++) {
        if (Math.hypot(points[index].x-originalPoints[index].x, points[index].y-originalPoints[index].y) > 1)
          await pose(entries[index].id, 'move');
      }
      overlay.dataset.layout = layout.mode;
      const center = { x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
        y: points.reduce((sum, p) => sum + p.y, 0) / points.length };
      const spanX = Math.max(...points.map(p=>p.x)) - Math.min(...points.map(p=>p.x));
      const spanY = Math.max(...points.map(p=>p.y)) - Math.min(...points.map(p=>p.y));
      const scale = Math.max(.35, Math.min(small ? 1.15 : 1.35,
        (overlay.clientWidth - (small ? 320 : 460)) / (spanX + unitHeight),
        (overlay.clientHeight * .89 - (small ? 190 : 290)) / (spanY + unitHeight)));
      world.style.setProperty('--hud-scale', 1 / scale);
      world.style.setProperty('--playback-unit-height', `${unitHeight}px`);
      world.getBoundingClientRect();
      const duration = 550 * (window.battlePlaybackTimingScale ?? 1);
      const hudOffset = Math.max(0, (small ? 80 : 115) / scale - spanX / 2);
      world.style.transition = `transform ${duration}ms ease-out`;
      const lastFoot = Math.max(...points.map(p=>p.y));
      world.style.transform = `translate(${overlay.clientWidth * .5 - center.x * scale}px, ${overlay.clientHeight * (small ? .89 : .83) - lastFoot * scale}px) scale(${scale})`;
      entries.forEach((entry, index) => {
        const direction = index === 0 ? -1 : 1;
        const actor = actors.get(entry.id);
        actor.dataset.positionRole = index === anchorIndex ? 'anchor' : 'moving';
        actor.style.transition = `left ${duration}ms ease-in-out, top ${duration}ms ease-in-out`;
        actor.style.left = `${points[index].x}px`; actor.style.top = `${points[index].y}px`;
        actor.style.setProperty('--hud-offset', `${entries.length === 1 ? 0 : direction * hudOffset}px`);
      });
      await wait(550);
      for (const entry of entries) idlePose(entry.id);
      overlay.dataset.phase = 'judgment'; await wait(150);
    }
    async function showRolls(entries) {
      entries.forEach(({ id, roll }) => {
        const actor = actors.get(id);
        if (actor) actor.querySelector('.playback-total').textContent = roll.startingPower;
      });
      const count = Math.max(...entries.map(entry => entry.roll.waves.length));
      for (let i = 0; i < count; i++) {
        await Promise.all(entries.map(async ({ id, roll }) => {
          const actor = actors.get(id), wave = roll.waves[i]; if (!actor || !wave) return;
          actor.querySelector('.playback-roll-label').textContent = `${wave.hit}번째 파형 판정`;
          await spinGauge(actor.querySelector('canvas'), wave.wave);
          actor.querySelector('.playback-total').textContent = wave.power;
          actor.querySelector('.playback-roll-label').textContent = `${roll.basePower} ${signed(roll.waveValue)} × (${signed(wave.waveSum)}) → ${wave.power}`;
        }));
      }
    }
    try {
      for (const step of execution.steps) {
        overlay.dataset.step = step.type;
        overlay.dataset.sequence = step.sequence;
        overlay.querySelector('.playback-order').textContent = `순서 ${step.order || '—'}`;
        if (step.type === 'action-start') {
          pairKey = '';
        } else if (step.type === 'action-used') {
          usedActions.set(step.unitId, step.action);
        } else if (step.type === 'clash-start') {
          const a = plans.get(step.attackerPlanId), b = plans.get(step.defenderPlanId);
          await showPair(step.attackerId, step.defenderId, a?.action, b?.action, step.units,
            isBattleWholeAreaAction(a?.action) || isBattleWholeAreaAction(b?.action), step.targetIds);
          await pose(step.attackerId, 'clash'); await pose(step.defenderId, 'clash');
        } else if (step.type === 'clash-roll') {
          await pose(step.attackerId, 'clash'); await pose(step.defenderId, 'clash');
          verdict.textContent = '패링 판정';
          await showRolls([{ id: step.attackerId, roll: step.attackerRoll }, { id: step.defenderId, roll: step.defenderRoll }]);
        } else if (step.type === 'clash-compare') {
          const sourceId = [...actors.keys()].find(id=>units.get(id)?.name==='이루어질');
          if (sourceId) emitEffect('clash',sourceId,[...actors.keys()].find(id=>id!==sourceId),actorActions.get(sourceId));
          actors.forEach(actor => {
            actor.querySelector('.playback-figure').classList.remove('clash-contact');
            void actor.offsetWidth;
            actor.querySelector('.playback-figure').classList.add('clash-contact');
          });
          verdict.textContent = `${step.attackerPower} ${step.winnerId ? '≠' : '='} ${step.defenderPower} · ${step.winnerId ? `${units.get(step.winnerId).name} 패링 성공` : step.parry ? '동률 · 상쇄' : '동률 · 재판정'}`;
          await wait(380);
        } else if (step.type === 'hit-destroyed') {
          await pose(step.unitId, 'clash-loss');
          for (const id of actors.keys()) if (id !== step.unitId) await pose(id, 'clash-win');
          const hit = actors.get(step.unitId)?.querySelector(`[data-hit="${step.hit}"]`);
          hit?.classList.add('destroyed');
          hit?.setAttribute('aria-label', `${step.hit}타 파괴`);
          await wait(450);
        } else if (step.type === 'clash-end') {
          if (step.winnerId) await pose(step.winnerId, 'clash-win');
        } else if (step.type === 'action-canceled') {
          if (step.reason === 'parried') await pose(step.unitId, 'clash-loss');
          const actor = actors.get(step.unitId);
          actor?.querySelector('.playback-action').classList.add('canceled');
          if (step.reason === 'parried' || step.reason === 'hits-destroyed') {
            const hud = actor?.querySelector('.playback-action');
            if (hud) {
              hud.classList.add('action-shattered');
              const burst = document.createElement('span');
              burst.className = 'playback-action-break';
              burst.textContent = '행동 파괴';
              hud.append(burst);
            }
          }
          verdict.textContent = `${units.get(step.unitId).name} · 행동 ${step.reason === 'parry-tie' ? '상쇄' : '파괴'}`; await wait(450);
        } else if (step.type === 'clash-followup') {
          verdict.textContent = `${units.get(step.unitId).name} · 공격 연결`;
          await wait(400);
        } else if (step.type === 'attack-start') {
          attackStack.push(step);
          // Retain the clash framing and broken hit icons for its surviving attack.
          if (!actors.has(step.unitId) || !actors.has(step.targetId)) {
            const action = step.action || plans.get(step.planId)?.action;
            const response = execution.steps.find(s=>s.sequence>step.sequence && s.order===step.order &&
              (s.type==='defense-roll'||s.type==='counter-start') && s.unitId===step.targetId && s.targetId===step.unitId);
            await showPair(step.unitId, step.targetId, action, response?.action, step.units, true, step.targetIds);
          }
          highlightAffected(step.targetIds);
          verdict.textContent = step.isCounter ? '반격' : '공격'; await wait(250);
        } else if (step.type === 'support-start') {
          await showPair(step.unitId, step.targetId, step.action, null, step.units, true, step.targetIds);
          verdict.textContent = '지원'; await wait(250);
        } else if (step.type === 'defense-ready') {
          if (!step.respondingToId) await showPair(step.unitId, step.unitId, plans.get(step.planId)?.action, null, step.units);
          await pose(step.unitId, 'clash');
          verdict.textContent = `${step.defense} · 대응 대기`; await wait(350);
        } else if (step.type === 'defense-roll') {
          const attack = attackStack.at(-1);
          await showPair(step.targetId, step.unitId, attack?.action, step.action, step.units, true, attack?.targetIds);
          await showRolls([{ id: step.unitId, roll: step.roll }]);
          if (step.defense === '방어' || step.success) await pose(step.unitId, 'defense');
          if (step.success || step.defense === '방어') emitEffect('response',step.unitId,step.unitId,step.action);
          verdict.textContent = step.defense === '회피' ? (step.success ? '회피 성공' : '회피 실패 · 해제') : `방어 · 피해 ${step.blocked} 감소`;
          await wait(350);
        } else if (step.type === 'counter-start') {
          await showPair(step.unitId, step.targetId, step.action, null, step.units, true);
          verdict.textContent = '반격 · 1회 대응'; await wait(250);
        } else if (step.type === 'attack-roll' || step.type === 'support-roll') {
          verdict.textContent = step.reused ? '공격 · 승리 파형 유지' : actorActions.get(step.unitId)?.sequence ? '행동 위력 판정' : `${step.type === 'support-roll' ? '지원 · ' : ''}${step.hit}타`;
          if (!step.reused) await showRolls([{ id: step.unitId, roll: step.roll }]);
          else {
            const actor = actors.get(step.unitId);
            if (actor) {
              actor.querySelector('.playback-total').textContent = step.roll.total;
              actor.querySelector('.playback-roll-label').textContent = `${step.roll.basePower} ${signed(step.roll.waveValue)} × (${signed(step.roll.wave)}) → ${step.roll.total}`;
            }
          }
          if (step.type === 'support-roll') {
            const action = actorActions.get(step.unitId) || usedActions.get(step.unitId);
            await pose(step.unitId,'attack',action,step.hit);
            const targetId=execution.steps.find(s=>s.type==='support-start'&&s.planId===step.planId)?.targetId;
            if (emitEffect('cast',step.unitId,targetId,action,step.hit)) await wait(140);
          }
          actors.get(step.unitId)?.querySelector(`[data-hit="${step.hit}"]`)?.classList.add('striking');
        } else if (step.type === 'damage-applied') {
          if (!step.statusDamage) await presentStrike(step.unitId,step.hit);
          if (!step.statusDamage && step.damage > 0) await pose(step.targetId, 'hurt');
          if (!step.statusDamage && step.damage > 0) emitEffect('impact',step.unitId,step.targetId,
            attackStack.at(-1)?.action || usedActions.get(step.unitId),step.hit);
          const actor = allActors.get(step.targetId);
          if (actor) {
            const number = floatingText(actor, step.damage);
            if (step.critical) number.classList.add('critical');
            number.setAttribute('aria-label', `피해 ${step.damage}`);
          }
          state(step.units); await wait(650);
          idlePose(step.targetId);
        } else if (step.type === 'unit-displaced') {
          const unit = step.units.find(entry=>entry.id === step.unitId);
          const actor = allActors.get(step.unitId);
          if (unit && actor) {
            const previous = origins.get(step.unitId), next = tilePoint(unit);
            actor.style.left = `${parseFloat(actor.style.left) + next.x - previous.x}px`;
            actor.style.top = `${parseFloat(actor.style.top) + next.y - previous.y}px`;
            origins.set(step.unitId, next);
            if (step.wall) floatingText(actor, '벽 충돌', true);
            await wait(300);
          }
        } else if (step.type === 'support-applied') {
          await pose(step.unitId, 'attack', actorActions.get(step.unitId) || usedActions.get(step.unitId), step.hit);
          step.targetIds.forEach(id => allActors.get(id)?.classList.add('affected'));
          step.targetIds.forEach(id => emitEffect('impact',step.unitId,id,
            actorActions.get(step.unitId) || usedActions.get(step.unitId),step.hit));
          state(step.units); await wait(650);
        } else if (step.type === 'status-added') {
          const icons = { '상처':'wound', '잠식':'erosion', '강타':'impact', '집중':'focus', '자원':'resource', '충격':'shock', '보호':'protection', '평정':'composure', '회복':'recovery', '격려':'encouragement' };
          const popup = floatingText(allActors.get(step.unitId), `${step.keyword} +${step.power} | +${step.count}`, true);
          if (popup) {
            popup.classList.add('playback-keyword');
            popup.style.top = `${parseFloat(popup.style.top) + 42}px`;
            popup.dataset.keyword = step.keyword;
            const icon = document.createElement('img');
            icon.src = `assets/icons/keywords/${icons[step.keyword]}.svg`;
            icon.alt = '';
            popup.prepend(icon);
            popup.setAttribute('aria-label', `${step.keyword} 부여: 위력 ${step.power}, 횟수 ${step.count}`);
          }
          state(step.units); await wait(250);
        } else if (step.type === 'support-end') {
          await wait(300);
        } else if (step.type === 'hit-evaded') {
          await presentStrike(step.unitId,step.hit);
          await pose(step.targetId, 'defense');
          floatingText(allActors.get(step.targetId), '회피', true);
          verdict.textContent = '회피 성공 · 피해 없음'; await wait(500);
        } else if (step.type === 'unit-defeated') {
          const actor = allActors.get(step.unitId); if (actor) actor.hidden = true;
        } else if (step.type === 'attack-end') {
          attackStack.pop();
          const attack = attackStack.at(-1);
          if (attack) await showPair(attack.unitId, attack.targetId, attack.action, null, step.units, true, attack.targetIds);
          overlay.querySelectorAll('.striking').forEach(hit => hit.classList.remove('striking'));
          await wait(300);
        } else if (step.type === 'action-skipped') {
          verdict.textContent = step.reason === 'out-of-range' ? '사거리 밖 · 행동 건너뜀' : '행동 불가'; await wait(250);
        } else if (step.type === 'clash-stalemate') {
          verdict.textContent = '장기 동률 · 행동 상쇄'; await wait(600);
        } else if (step.type === 'action-end') {
          allActors.forEach((actor,id)=>{ actor.classList.remove('affected', 'active'); idlePose(id); });
          actors.clear();
        }
        state(step.units);
      }
      await wait(400);
    } finally {
      effects?.dispose();
      overlay.remove(); controls.forEach(el => el.inert = false);
      root.classList.remove('is-playing'); battlePresentationActive = false;
      renderBattleDummy();
    }
  };
})();
