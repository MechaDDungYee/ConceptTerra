(() => {
  const actions = {
    '결말 예측': { key: 'prediction', color: '#83d9ff', accent: '#e4f5ff' },
    '확신의 일격': { key: 'certainty', color: '#f6d17d', accent: '#fff6dc' },
    '계획 수정': { key: 'revision', color: '#66b8ee', accent: '#bbecff' },
    '결말 주석': { key: 'annotation', color: '#e8bd63', accent: '#fff0c4' },
    '결말 주석 · 개념 폭주': { key: 'overdrive', color: '#80ccff', accent: '#ffe1a2' },
    '이루어질 · 회피': { key: 'evade', color: '#94d9ff', accent: '#effbff' }
  };
  const dreamActions = {
    '꾸벅꾸벅': { key: 'dream-blanket', color: '#ac9de9', accent: '#e8e1ff' },
    '비관의 잔향': { key: 'dream-echo', color: '#8a82c3', accent: '#d1bcf2' },
    '수면 유도': { key: 'dream-sleep', color: '#9aa8df', accent: '#e2e9ff' },
    '비관의 침수': { key: 'dream-sink', color: '#7974bb', accent: '#bfb4ee' },
    '비관의 침수 · 개념 폭주': { key: 'dream-flood', color: '#aaa0ec', accent: '#f2e7ff' },
    '이루어져 · 방어': { key: 'dream-guard', color: '#b0a2de', accent: '#e6ddfc' }
  };
  function effectFor(unit, action) {
    if (unit?.side !== 'ally') return null;
    if (unit.name === '이루어질') return actions[action?.name] || null;
    return unit.name === '이루어져' ? dreamActions[action?.name] || null : null;
  }
  window.battleEffectFor = effectFor;
  window.createBattleEffects = root => {
    const canvas = document.createElement('canvas');
    canvas.className = 'playback-fx-layer'; canvas.setAttribute('aria-hidden', 'true');
    root.append(canvas);
    const ctx = canvas.getContext('2d'), effects = [];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, disposed = false, width = 0, height = 0;
    function resize() {
      const rect = root.getBoundingClientRect(), ratio = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width; height = rect.height;
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    resize();
    const observer = new ResizeObserver(resize); observer.observe(root);
    function point(actor, hand = false) {
      const rect = actor?.querySelector('.playback-figure')?.getBoundingClientRect();
      if (!rect) return null;
      const frame = root.getBoundingClientRect(), facing = actor.classList.contains('right') ? -1 : 1;
      return { x: rect.left + rect.width / 2 - frame.left + (hand ? facing * rect.height * .3 : 0),
        y: rect.top + rect.height * .48 - frame.top, size: rect.height, facing };
    }
    function path(points, color, thickness, alpha = 1) {
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = thickness;
      ctx.beginPath(); points.forEach((p,i)=>i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y)); ctx.stroke();
    }
    function arc(p, radius, start, end, color, thickness, alpha) {
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = thickness;
      ctx.beginPath(); ctx.arc(p.x,p.y,radius,start,end);ctx.stroke();
    }
    // Procedural particles never consume the combat engine's random-number stream.
    function sparks(p, progress, color, count, size, rotation = 0) {
      for(let i=0;i<count;i++){
        const angle=rotation+i*2.399963, distance=(.2+progress*.8)*size*(.65+(i%4)*.12);
        const tip={x:p.x+Math.cos(angle)*distance,y:p.y+Math.sin(angle)*distance*.65};
        path([{x:tip.x-Math.cos(angle)*size*.12,y:tip.y-Math.sin(angle)*size*.08},tip],color,i%3===0?3:1.5,1-progress);
      }
    }
    function brackets(p, r, color, alpha, tilt=0) {
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(tilt);
      for(const side of [-1,1])path([{x:side*r*.55,y:-r},{x:side*r,y:-r},{x:side*r,y:r},{x:side*r*.55,y:r}],color,2,alpha);
      ctx.restore();
    }
    function drawDream(e, t, s, fade) {
      const {a,b,spec,kind,hit}=e;
      const flood=spec.key==='dream-flood', sleep=spec.key==='dream-sleep';
      const sink=spec.key==='dream-sink'||flood, echo=spec.key==='dream-echo';
      ctx.globalCompositeOperation='source-over';
      ctx.shadowBlur=3;
      const ellipse=(p,rx,ry,alpha,angle=0)=>{
        ctx.globalAlpha=alpha;ctx.strokeStyle=spec.accent;ctx.lineWidth=1.8;
        ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,angle,0,Math.PI*2);ctx.stroke();
      };
      const cloth=(start,end,bend,alpha,width)=>{
        ctx.globalAlpha=alpha;ctx.strokeStyle=spec.color;ctx.lineWidth=width;
        ctx.beginPath();ctx.moveTo(start.x,start.y);
        ctx.bezierCurveTo(start.x+(end.x-start.x)*.3,start.y+bend,
          start.x+(end.x-start.x)*.7,end.y-bend,end.x,end.y);ctx.stroke();
        ctx.globalAlpha=alpha*.8;ctx.strokeStyle=spec.accent;ctx.lineWidth=1.6;
        ctx.setLineDash([4,7]);ctx.stroke();ctx.setLineDash([]);
      };
      const petals=(p,count,radius)=>{
        for(let i=0;i<count;i++){
          const angle=i*2.399963+hit*.4;
          const x=p.x+Math.cos(angle)*radius*(.4+t*.6);
          const y=p.y+Math.sin(angle)*radius*.45+t*s*.35;
          ctx.save();ctx.translate(x,y);ctx.rotate(angle+t*.6);
          ctx.globalAlpha=fade*.7;ctx.fillStyle=i%2?spec.accent:spec.color;
          ctx.beginPath();ctx.moveTo(0,-5);ctx.quadraticCurveTo(7,0,0,5);
          ctx.quadraticCurveTo(-4,0,0,-5);ctx.fill();ctx.restore();
        }
      };
      if(spec.key==='dream-guard'){
        for(let i=0;i<2;i++){
          ctx.globalAlpha=fade*(.55-i*.15);ctx.strokeStyle=i?spec.accent:spec.color;
          ctx.lineWidth=i?2:8;ctx.beginPath();
          ctx.moveTo(a.x-s*.65,a.y+s*.65);
          ctx.bezierCurveTo(a.x-s,a.y-s*.95,a.x+s,a.y-s*.95,a.x+s*.65,a.y+s*.65);ctx.stroke();
        }
        ellipse({x:a.x,y:a.y+s*.55},s*.65,s*.14,fade*.5);
        return;
      }
      if(kind==='cast'){
        const advance=reduced?1:Math.min(1,t*2.6);
        const tip={x:a.x+(b.x-a.x)*advance,y:a.y+(b.y-a.y)*advance};
        const ribbons=flood?3:echo?2:1;
        for(let i=0;i<ribbons;i++){
          const bend=s*(hit%2?-.65:.65)*(1+i*.22);
          cloth(a,tip,bend,fade*(.65-i*.1),flood?13:9);
        }
        if(sleep||sink)ellipse(b,s*.35,s*.13,fade*.65);
        petals(tip,flood?7:4,s*.4);
        return;
      }
      if(kind==='impact'){
        if(sleep){
          const closing=1-Math.min(1,t*2);
          ctx.globalAlpha=fade;ctx.strokeStyle=spec.accent;ctx.lineWidth=2.5;
          ctx.beginPath();ctx.moveTo(b.x-s*.5,b.y);
          ctx.quadraticCurveTo(b.x,b.y+s*.35*closing,b.x+s*.5,b.y);ctx.stroke();
          for(let i=-1;i<=1;i++)path([{x:b.x+i*s*.28,y:b.y+s*.03},
            {x:b.x+i*s*.31,y:b.y+s*.14}],spec.color,2,fade);
          ellipse({x:b.x,y:b.y+s*.25},s*(.3+t*.3),s*.12,fade*.55);
        } else {
          const r=s*(sink?.7:.5)*(1+t*.25);
          const fold=Math.sin(Math.PI*t);
          for(const direction of [-1,1]){
            cloth({x:b.x-direction*r,y:b.y-r*.4},
              {x:b.x+direction*r*.4,y:b.y+r*.45},direction*r*fold,fade*.65,flood?15:10);
          }
          const rings=sink?(flood?4:3):echo?2:1;
          for(let i=0;i<rings;i++)ellipse({x:b.x,y:b.y+s*(t*.5+i*.15)},
            r*(.65+i*.18+t*.2),r*.18,fade*(.65-i*.1),echo?(i%2?.15:-.15):0);
        }
        petals(b,flood?12:echo?7:5,s*(.6+hit*.08));
        if(flood&&hit>=3){
          for(let i=0;i<3;i++)cloth({x:b.x-s,y:b.y+s*(i*.25-.2)},
            {x:b.x+s,y:b.y+s*(i*.25+.1)},s*.3,fade*.4,7);
        }
      }
    }
    function draw(e, t) {
      const {a,b,spec,kind,hit}=e, s=Math.min(120,a.size*.38), fade=Math.pow(1-t,1.1);
      ctx.save(); ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.lineJoin='round';
      ctx.shadowColor=spec.color;ctx.shadowBlur=7;
      if(kind==='clash'){
        sparks(b,t,'#ffe6ac',13,s*.7);arc(b,s*(.2+t*.5),-.8,1.8,'#e4f4ff',2,fade);ctx.restore();return;
      }
      if(spec.key.startsWith('dream-')){
        drawDream(e,t,s,fade);ctx.restore();return;
      }
      if(spec.key==='evade'){
        for(let i=0;i<3;i++){
          const x=a.x-a.facing*s*(t*.9+i*.2);
          path([{x:x-a.facing*s*.55,y:a.y+s*.6},{x,y:a.y},{x:x+a.facing*s*.25,y:a.y-s*.55}],spec.color,2.5,fade*(1-i*.2));
        }
        brackets(a,s*.65,spec.accent,fade*.55,t*.1);ctx.restore();return;
      }
      if(kind==='cast'){
        const end=reduced?1:Math.min(1,t*2.8), dx=b.x-a.x,dy=b.y-a.y;
        const tip={x:a.x+dx*end,y:a.y+dy*end};
        if(spec.key==='prediction'){
          for(const offset of [-.22,.22]){
            path([{x:a.x,y:a.y+offset*s},{x:a.x+dx*.45,y:a.y+dy*.45-offset*s*.5},tip],spec.color,hit===2?3:1.7,fade);
          }
          brackets(b,s*.32,spec.accent,fade*.7);
        }else if(spec.key==='certainty'){
          path([a,tip],spec.color,hit===2?7:4,fade);
          path([{x:a.x,y:a.y-3},{x:tip.x,y:tip.y-3}],spec.accent,1.5,fade);
          path([{x:tip.x-a.facing*s*.3,y:tip.y-s*.12},tip,{x:tip.x-a.facing*s*.3,y:tip.y+s*.12}],spec.accent,2,fade);
        }else if(spec.key==='revision'){
          for(let i=0;i<Math.min(3,hit);i++){
            const shift=(i-(hit-1)/2)*s*.25;
            path([{x:a.x,y:a.y+shift},{x:a.x+dx*.38,y:a.y+dy*.38-shift},{x:a.x+dx*.65,y:a.y+dy*.65+shift},tip],spec.color,2.2,fade);
          }
          brackets(b,s*.36,spec.accent,fade,hit%2?.25:-.25);
        }else{
          const strips=spec.key==='overdrive'?hit+2:2;
          for(let i=0;i<strips;i++){
            const shift=(i-(strips-1)/2)*s*.18;
            ctx.globalAlpha=fade;ctx.strokeStyle=i%2?spec.accent:spec.color;ctx.lineWidth=i%2?2:3;
            ctx.beginPath();ctx.moveTo(a.x,a.y+shift);ctx.bezierCurveTo(a.x+dx*.25,a.y-s*.45+shift,a.x+dx*.7,b.y+s*.45-shift,tip.x,tip.y);ctx.stroke();
          }
          brackets(b,s*(spec.key==='overdrive'?.62:.44),spec.accent,fade);
        }
      }else if(kind==='impact'){
        if(spec.key==='prediction'){
          brackets(b,s*(.25+t*.18),spec.accent,fade);
          path([{x:b.x-s*.5,y:b.y},{x:b.x+s*.5,y:b.y}],spec.color,2.4,fade);
          sparks(b,t,spec.color,7,s*.6,hit);
        }else if(spec.key==='certainty'){
          path([{x:b.x-a.facing*s*.65,y:b.y},{x:b.x+a.facing*s*.8,y:b.y}],spec.accent,5*fade+.5,fade);
          sparks(b,t,spec.color,hit===2?14:9,s*.9);
        }else if(spec.key==='revision'){
          for(let i=0;i<3;i++){
            const angle=(hit%2?1:-1)*.55+i*.7;
            path([{x:b.x-Math.cos(angle)*s*.5,y:b.y-Math.sin(angle)*s*.5},{x:b.x+Math.cos(angle)*s*.5,y:b.y+Math.sin(angle)*s*.5}],spec.accent,2,fade);
          }
          sparks(b,t,spec.color,8+hit*2,s*(.6+hit*.1));
        }else{
          const over=spec.key==='overdrive',r=s*(over?.65:.45);
          arc(b,r*(.65+t*.5),0,Math.PI*2,spec.color,2,fade);
          brackets(b,r,spec.accent,fade,over?hit*.3:0);
          for(let i=0;i<(over?8:5);i++){
            const angle=i*Math.PI*2/(over?8:5),x=b.x+Math.cos(angle)*r*(1+t),y=b.y+Math.sin(angle)*r*(1+t);
            path([{x:x-4,y:y-7},{x:x+5,y:y-5},{x:x+2,y:y+5}],spec.accent,1.5,fade);
          }
          sparks(b,t,spec.accent,over?12+hit*3:10,r*1.4);
          if(over&&hit===3){
            path([{x:b.x-r*1.2,y:b.y-r*.65},{x:b.x+r*1.2,y:b.y+r*.65}],spec.accent,4,fade);
            path([{x:b.x-r*1.2,y:b.y+r*.65},{x:b.x+r*1.2,y:b.y-r*.65}],spec.color,3,fade);
          }
        }
      }
      ctx.restore();
    }
    function tick(time) {
      raf=0;ctx.clearRect(0,0,width,height);
      for(let i=effects.length-1;i>=0;i--){
        const e=effects[i],t=Math.min(1,(time-e.start)/e.duration);
        if(t>=1)effects.splice(i,1);else draw(e,t);
      }
      if(effects.length&&!disposed)raf=requestAnimationFrame(tick);
    }
    return {
      emit({unit,action,source,target,kind='cast',hit=1}) {
        const spec=effectFor(unit,action);if(!spec||disposed)return false;
        const a=point(source,kind==='cast'),b=point(target||source);if(!a||!b)return false;
        const duration=Math.max(150,(kind==='cast'?400:kind==='clash'?330:540)*(window.battlePlaybackTimingScale??1));
        effects.push({a,b,spec,kind,hit,start:performance.now(),duration:reduced?Math.min(220,duration):duration});
        canvas.dataset.effect=spec.key;canvas.dataset.kind=kind;canvas.dataset.hit=hit;
        if(!raf)raf=requestAnimationFrame(tick);return true;
      },
      dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();effects.length=0;canvas.remove();}
    };
  };
})();
