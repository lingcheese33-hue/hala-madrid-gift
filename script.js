function initRevealHover(element) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const secretTextEl = document.getElementById('secret-text');
  const phase1El = document.getElementById('phase-1');
  const headerTextEl = document.querySelector('.header-text');
  const resetBtn = document.getElementById('reset-btn');

  let hasTriggeredSecret = false;
  let resetTimeout;

  const state = { x: 0, y: 0, targetX: 0, targetY: 0, radius: 0, targetRadius: 0, inside: false, frame: 0 };

  const getRadius = () => Math.min(260, Math.max(140, element.clientWidth * 0.22));

  const updateTarget = (clientX, clientY) => {
    const rect = element.getBoundingClientRect();
    state.targetX = clientX - rect.left;
    state.targetY = clientY - rect.top;
  };

  const schedule = () => {
    if (!state.frame) state.frame = requestAnimationFrame(tick);
  };

  const tick = () => {
    state.frame = 0;
    state.x += (state.targetX - state.x) * 0.1;
    state.y += (state.targetY - state.y) * 0.1;
    state.radius += (state.targetRadius - state.radius) * 0.14;
    element.style.setProperty("--reveal-x", `${state.x.toFixed(2)}px`);
    element.style.setProperty("--reveal-y", `${state.y.toFixed(2)}px`);
    element.style.setProperty("--reveal-radius", `${state.radius.toFixed(2)}px`);
    const unsettled = Math.abs(state.targetX - state.x) > 0.1 || Math.abs(state.targetY - state.y) > 0.1 || Math.abs(state.targetRadius - state.radius) > 0.1;
    if (unsettled) schedule();
  };

  const resetExperience = () => {
    hasTriggeredSecret = false;
    clearTimeout(resetTimeout);
    if (phase1El) phase1El.classList.remove('show');
    if (headerTextEl) headerTextEl.classList.remove('fade-out');
    if (resetBtn) resetBtn.classList.remove('show');
    state.x = 0; state.y = 0; state.targetX = 0; state.targetY = 0; state.radius = 0; state.targetRadius = 0;
    element.style.setProperty("--reveal-radius", "0px");
    element.style.setProperty("--reveal-x", "50%");
    element.style.setProperty("--reveal-y", "50%");
  };

  const unlockSecretText = () => {
    if (hasTriggeredSecret || !secretTextEl) return;
    hasTriggeredSecret = true;
    if (phase1El) phase1El.classList.add('show');
    resetTimeout = setTimeout(() => {
      if (headerTextEl) headerTextEl.classList.add('fade-out');
      if (resetBtn) resetBtn.classList.add('show');
    }, 2000);
  };

  if (resetBtn) resetBtn.addEventListener('click', resetExperience);

  // 滑鼠事件
  element.addEventListener("pointerenter", (e) => {
    state.inside = true; updateTarget(e.clientX, e.clientY);
    if (state.radius < 0.5) { state.x = state.targetX; state.y = state.targetY; }
    state.targetRadius = getRadius(); schedule(); unlockSecretText();
  });

  element.addEventListener("pointermove", (e) => {
    updateTarget(e.clientX, e.clientY);
    if (!state.inside) {
      state.inside = true;
      if (state.radius < 0.5) { state.x = state.targetX; state.y = state.targetY; }
      state.targetRadius = getRadius();
    }
    schedule(); if (!hasTriggeredSecret) unlockSecretText();
  });

  element.addEventListener("pointerleave", () => { state.inside = false; state.targetRadius = 0; schedule(); });
  
  // 手機觸控事件
  element.addEventListener("touchstart", (e) => {
    if (e.cancelable) e.preventDefault(); const touch = e.touches[0];
    state.inside = true; updateTarget(touch.clientX, touch.clientY);
    if (state.radius < 0.5) { state.x = state.targetX; state.y = state.targetY; }
    state.targetRadius = getRadius(); schedule(); unlockSecretText();
  }, { passive: false });

  element.addEventListener("touchmove", (e) => {
    if (e.cancelable) e.preventDefault(); const touch = e.touches[0];
    updateTarget(touch.clientX, touch.clientY);
    if (!state.inside) { state.inside = true; if (state.radius < 0.5) { state.x = state.targetX; state.y = state.targetY; } state.targetRadius = getRadius(); }
    schedule(); if (!hasTriggeredSecret) unlockSecretText();
  }, { passive: false });

  element.addEventListener("touchend", () => { state.inside = false; state.targetRadius = 0; schedule(); });
}

// 初始化手電筒
Array.from(document.querySelectorAll("[data-reveal-hover]")).map(initRevealHover);
