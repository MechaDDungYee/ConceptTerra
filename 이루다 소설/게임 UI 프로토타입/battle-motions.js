(() => {
  const root = 'assets/battle/motions/single55/';
  function frameFor(name, pose, action, hit = 1) {
    const entry = window.battleSingleMotionLibrary?.[name];
    if (!entry) return null;
    let key = pose;
    if (pose === 'attack') {
      hit = action?.sequence?.[hit - 1]?.motionHit || hit;
      if (action?.type === '반격') key = 'defense';
      else {
        const frame = entry.frames.find(f => f.hit === hit && f.skillName &&
          (f.skillName === action?.name || f.skillName === `${action?.name} · 개념 폭주`));
        if (!frame) return null;
        key = frame.key;
      }
    }
    const frame = entry.frames.find(f => f.key === key);
    const registration = window.battleSpriteRegistration?.(name);
    const renderScale = registration?.renderScale || 1;
    return frame ? { ...frame, src: root + frame.src, renderScale,
      centerX: frame.centerX / frame.canvas[0],
      bottomOffset: (1 - frame.pivotY / frame.canvas[1]) * renderScale } : null;
  }
  window.battleMotionFrame = frameFor;
})();
