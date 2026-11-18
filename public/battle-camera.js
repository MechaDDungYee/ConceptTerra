// Camera controls from the Iruda 1 Team prototype, adapted to the online board.
const battleDummy = {cameraMode:'rotate',rotation:0,tilt:30,zoom:1,cameraX:0,cameraY:0};

export function bindBattleBoardControls(field, camera, tools) {
  const updateBattleArrowPositions = () => {
    const x = battleDummy.cameraX || 0;
    const y = battleDummy.cameraY || 0;
    camera.style.transform = battleDummy.zoom === 1 && !x && !y ? 'none' : `translate(${x}px, ${y}px) scale(${battleDummy.zoom})`;
    field.style.setProperty('--battle-rot', `${battleDummy.rotation}deg`);
    field.style.setProperty('--counter-rot', `${-battleDummy.rotation}deg`);
    field.style.setProperty('--battle-tilt', `${90 - battleDummy.tilt}deg`);
    field.style.setProperty('--counter-tilt', `${battleDummy.tilt - 90}deg`);
  };
  field.dataset.cameraMode = battleDummy.cameraMode;
  const modes = tools.querySelectorAll('[data-camera-mode]');
  modes.forEach(entry => entry.setAttribute('aria-pressed', String(entry.dataset.cameraMode === battleDummy.cameraMode)));
  updateBattleArrowPositions();
  let activePointer = null;
  let startX = 0;
  let startY = 0;
  let startRotation = battleDummy.rotation;
  let startTilt = battleDummy.tilt ?? 30;
  let startCameraX = 0;
  let startCameraY = 0;
  let moved = false;

  modes.forEach(button => {
    button.addEventListener('click', () => {
      battleDummy.cameraMode = button.dataset.cameraMode;
      field.dataset.cameraMode = battleDummy.cameraMode;
      modes.forEach(entry => entry.setAttribute('aria-pressed', String(entry.dataset.cameraMode === battleDummy.cameraMode)));
    });
  });
  tools.querySelector('[data-camera-reset]').addEventListener('click', () => {
    Object.assign(battleDummy, {rotation:0, tilt:30, zoom:1, cameraX:0, cameraY:0});
    field.style.setProperty('--battle-rot', '0deg');
    field.style.setProperty('--counter-rot', '0deg');
    field.style.setProperty('--battle-tilt', '60deg');
    updateBattleArrowPositions();
  });

  field.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || activePointer !== null) return;
    activePointer = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startRotation = battleDummy.rotation;
    startTilt = battleDummy.tilt ?? 30;
    startCameraX = battleDummy.cameraX || 0;
    startCameraY = battleDummy.cameraY || 0;
    moved = false;
  });

  field.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activePointer) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (!moved && Math.hypot(deltaX, deltaY) <= 4) return;
    if (!moved) {
      moved = true;
      field.setPointerCapture(event.pointerId);
      field.classList.add('rotating');
    }
    if (battleDummy.cameraMode === 'move') {
      battleDummy.cameraX = startCameraX + deltaX;
      battleDummy.cameraY = startCameraY + deltaY;
    } else {
      battleDummy.rotation = startRotation - deltaX * .22;
      battleDummy.tilt = Math.max(25, Math.min(75, startTilt + deltaY * .18));
      field.style.setProperty("--battle-rot", `${battleDummy.rotation}deg`);
      field.style.setProperty("--counter-rot", `${-battleDummy.rotation}deg`);
      // Elevation above the ground is the complement of the board's CSS tilt.
      field.style.setProperty('--battle-tilt', `${90 - battleDummy.tilt}deg`);
    }
    updateBattleArrowPositions();
  });

  const endCameraDrag = (event) => {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    if (field.hasPointerCapture(event.pointerId)) field.releasePointerCapture(event.pointerId);
    field.classList.remove("rotating");
  };
  field.addEventListener('pointerup', endCameraDrag);
  field.addEventListener('pointercancel', endCameraDrag);
  field.addEventListener('lostpointercapture', endCameraDrag);
  field.addEventListener('pointerleave', event => { if (!moved) endCameraDrag(event); });

  field.addEventListener('click', event => {
    if (!moved || event.detail === 0) return;
    event.preventDefault();
    event.stopPropagation();
    moved = false;
  }, true);

  const zoomAt = (change, x, y) => {
    const nextZoom = battleDummy.zoom + change;
    const zoom = Math.round(Math.max(.72, Math.min(1.38, nextZoom)) * 100) / 100;
    const ratio = zoom / battleDummy.zoom;
    battleDummy.cameraX = x - (x - (battleDummy.cameraX || 0)) * ratio;
    battleDummy.cameraY = y - (y - (battleDummy.cameraY || 0)) * ratio;
    battleDummy.zoom = zoom;
    updateBattleArrowPositions();
  };
  field.addEventListener('wheel', event => {
    if (!event.deltaY) return;
    event.preventDefault();
    const origin = field.getBoundingClientRect();
    zoomAt(event.deltaY < 0 ? .08 : -.08, event.clientX - origin.left, event.clientY - origin.top);
  }, {passive:false});

  for (const control of tools.querySelectorAll('[data-camera-zoom]')) {
    control.addEventListener('click', () => zoomAt(Number(control.dataset.cameraZoom), field.clientWidth / 2, field.clientHeight / 2));
  }
}

