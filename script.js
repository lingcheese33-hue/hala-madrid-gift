function initRevealHover(element) {
    const overlay = element.querySelector(".reveal-hover__image--overlay");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  
    const secretTextEl = document.getElementById('secret-text');
    const phase1El = document.getElementById('phase-1');
    const phase2El = document.getElementById('phase-2');
    const headerTextEl = document.querySelector('.header-text');
    const resetBtn = document.getElementById('reset-btn');
  
    let hasTriggeredSecret = false;
    let resetTimeout;
  
    const state = {
      x: 0, y: 0,
      targetX: 0, targetY: 0,
      radius: 0, targetRadius: 0,
      clientX: 0, clientY: 0,
      inside: false, frame: 0,
    };
  
    const getRadius = () => {
      const requested = Number.parseFloat(element.dataset.revealRadius);
      if (Number.isFinite(requested)) return requested;
      return Math.min(260, Math.max(140, element.clientWidth * 0.22));
    };
  
    const updateTarget = (clientX, clientY) => {
      const rect = element.getBoundingClientRect();
      state.clientX = clientX;
      state.clientY = clientY;
      state.targetX = clientX - rect.left;
      state.targetY = clientY - rect.top;
    };
  
    const schedule = () => {
      if (!state.frame) state.frame = requestAnimationFrame(tick);
    };
  
    const tick = () => {
      state.frame = 0;
      const positionEase = reduceMotion.matches ? 1 : 0.1;
      const radiusEase = reduceMotion.matches ? 1 : 0.14;
  
      state.x += (state.targetX - state.x) * positionEase;
      state.y += (state.targetY - state.y) * positionEase;
      state.radius += (state.targetRadius - state.radius) * radiusEase;
  
      element.style.setProperty("--reveal-x", `${state.x.toFixed(2)}px`);
      element.style.setProperty("--reveal-y", `${state.y.toFixed(2)}px`);
      element.style.setProperty("--reveal-radius", `${state.radius.toFixed(2)}px`);
  
      const unsettled =
        Math.abs(state.targetX - state.x) > 0.1 ||
        Math.abs(state.targetY - state.y) > 0.1 ||
        Math.abs(state.targetRadius - state.radius) > 0.1;
  
      if (unsettled) schedule();
    };
  
    // 🌟 重置邏輯
    const resetExperience = () => {
      hasTriggeredSecret = false;
      clearTimeout(resetTimeout);
      
      if (phase1El) phase1El.classList.remove('show', 'hide');
      if (phase2El) phase2El.classList.remove('show');
      if (headerTextEl) headerTextEl.classList.remove('fade-out');
      if (resetBtn) resetBtn.classList.remove('show');
      
      state.x = 0; state.y = 0;
      state.targetX = 0; state.targetY = 0;
      state.radius = 0; state.targetRadius = 0;
      element.style.setProperty("--reveal-radius", "0px");
      element.style.setProperty("--reveal-x", "50%");
      element.style.setProperty("--reveal-y", "50%");
    };
  
    // 🌟 解鎖函數 (包含延遲顯示按鈕)
    const unlockSecretText = () => {
      if (hasTriggeredSecret || !secretTextEl) return;
      hasTriggeredSecret = true;
  
      if (phase1El) phase1El.classList.add('show');
  
      resetTimeout = setTimeout(() => {
        if (phase1El) {
          phase1El.classList.remove('show');
          phase1El.classList.add('hide');
        }
        
        if (phase2El) phase2El.classList.add('show');
        if (headerTextEl) headerTextEl.classList.add('fade-out');
  
        // 🌟 字幕浮現後，延遲 2 秒再顯示重置按鈕
        setTimeout(() => {
          if (resetBtn) resetBtn.classList.add('show');
        }, 2000); 
      }, 5000);
    };
  
    if (resetBtn) {
      resetBtn.addEventListener('click', resetExperience);
    }
  
    // 手機端綁定
    if (!overlay || !finePointer.matches) {
      element.addEventListener('click', unlockSecretText);
      return () => {
        element.removeEventListener('click', unlockSecretText);
        if (resetBtn) resetBtn.removeEventListener('click', resetExperience);
      };
    }
  
    const onPointerEnter = (event) => {
      state.inside = true;
      updateTarget(event.clientX, event.clientY);
      if (state.radius < 0.5) {
        state.x = state.targetX;
        state.y = state.targetY;
      }
      state.targetRadius = getRadius();
      schedule();
      unlockSecretText(); 
    };
  
    const onPointerMove = (event) => {
      updateTarget(event.clientX, event.clientY);
      if (!state.inside) {
        state.inside = true;
        if (state.radius < 0.5) {
          state.x = state.targetX;
          state.y = state.targetY;
        }
        state.targetRadius = getRadius();
      }
      schedule();
      if (!hasTriggeredSecret) {
        unlockSecretText();
      }
    };
  
    const hideReveal = () => {
      state.inside = false;
      state.targetRadius = 0;
      schedule();
    };
  
    const onViewportChange = () => {
      if (!state.inside) return;
      updateTarget(state.clientX, state.clientY);
      state.targetRadius = getRadius();
      schedule();
    };
  
    element.addEventListener("pointerenter", onPointerEnter);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerleave", hideReveal);
    element.addEventListener("pointercancel", hideReveal);
    window.addEventListener("blur", hideReveal);
    window.addEventListener("scroll", onViewportChange, { passive: true });
  
    const resizeObserver = new ResizeObserver(onViewportChange);
    resizeObserver.observe(element);
  
    return () => {
      if (state.frame) cancelAnimationFrame(state.frame);
      resizeObserver.disconnect();
      element.removeEventListener("pointerenter", onPointerEnter);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerleave", hideReveal);
      element.removeEventListener("pointercancel", hideReveal);
      window.removeEventListener("blur", hideReveal);
      window.removeEventListener("scroll", onViewportChange);
      if (resetBtn) resetBtn.removeEventListener('click', resetExperience);
    };
  }
  
  const revealHoverCleanups = Array.from(
    document.querySelectorAll("[data-reveal-hover]")
  ).map(initRevealHover);