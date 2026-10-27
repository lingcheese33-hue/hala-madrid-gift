function initRevealHover(element) {
    const overlay = element.querySelector(".reveal-hover__image--overlay");
    const canvas = document.getElementById("mobile-scratch-canvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    
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
      x: 0, y: 0, targetX: 0, targetY: 0,
      radius: 0, targetRadius: 0,
      clientX: 0, clientY: 0, inside: false, frame: 0,
    };
  
    // 🌟 手機端專用：Canvas 解析度修正與手電筒
    const initMobileFlashlight = () => {
      if (!canvas || !ctx) return;
      const rect = element.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1; // 解決 Retina 螢幕模糊
      
      // 設定真實像素寬高
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // 用 CSS 限制顯示大小
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      // 縮放 Context 確保繪製比例正確
      ctx.scale(dpr, dpr);
      
      const width = rect.width;
      const height = rect.height;
  
      const img = new Image();
      img.src = 'barca-bear.png';
      
      const drawMobileFlashlight = (x, y) => {
        ctx.clearRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
        
        // 畫上巴薩熊 (用 cover 邏輯填滿)
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;
        let drawWidth = width;
        let drawHeight = height;
        
        if (imgRatio > canvasRatio) {
          drawHeight = height;
          drawWidth = height * imgRatio;
        } else {
          drawWidth = width;
          drawHeight = width / imgRatio;
        }
        
        const offsetX = (width - drawWidth) / 2;
        const offsetY = (height - drawHeight) / 2;
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // 擦除手電筒區域
        ctx.globalCompositeOperation = 'destination-out';
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
        gradient.addColorStop(0, 'rgba(0,0,0,1)');
        gradient.addColorStop(0.7, 'rgba(0,0,0,0.8)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.beginPath();
        ctx.arc(x, y, 80, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      };
  
      img.onload = () => {
        drawMobileFlashlight(width / 2, height / 2);
      };
  
      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        drawMobileFlashlight(x, y);
        unlockSecretText();
      }, { passive: false });
  
      canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        drawMobileFlashlight(x, y);
      }, { passive: false });
    };
  
    const resetExperience = () => {
      hasTriggeredSecret = false;
      clearTimeout(resetTimeout);
      
      if (phase1El) phase1El.classList.remove('show', 'hide');
      if (phase2El) phase2El.classList.remove('show');
      if (headerTextEl) headerTextEl.classList.remove('fade-out');
      if (resetBtn) resetBtn.classList.remove('show');
      
      state.x = 0; state.y = 0; state.targetX = 0; state.targetY = 0;
      state.radius = 0; state.targetRadius = 0;
      element.style.setProperty("--reveal-radius", "0px");
      element.style.setProperty("--reveal-x", "50%");
      element.style.setProperty("--reveal-y", "50%");
  
      // 手機端重置
      if (!finePointer.matches) {
        if (ctx && canvas) {
          const rect = element.getBoundingClientRect();
          ctx.clearRect(0, 0, rect.width, rect.height);
          const img = new Image();
          img.src = 'barca-bear.png';
          img.onload = () => {
            ctx.globalCompositeOperation = 'source-over';
            // 重新畫一次填滿的巴薩熊
            const imgRatio = img.width / img.height;
            const canvasRatio = rect.width / rect.height;
            let drawWidth = rect.width;
            let drawHeight = rect.height;
            if (imgRatio > canvasRatio) {
              drawHeight = rect.height;
              drawWidth = rect.height * imgRatio;
            } else {
              drawWidth = rect.width;
              drawHeight = rect.width / imgRatio;
            }
            const offsetX = (rect.width - drawWidth) / 2;
            const offsetY = (rect.height - drawHeight) / 2;
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          };
        }
      }
    };
  
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
  
        setTimeout(() => {
          if (resetBtn) resetBtn.classList.add('show');
        }, 2000); 
      }, 5000);
    };
  
    if (resetBtn) {
      resetBtn.addEventListener('click', resetExperience);
    }
  
    // 🌟 如果是手機端
    if (!finePointer.matches) {
      initMobileFlashlight();
      return () => {
        if (resetBtn) resetBtn.removeEventListener('click', resetExperience);
      };
    }
  
    // === 以下是電腦端的平滑手電筒特效 ===
    const getRadius = () => {
      const requested = Number.parseFloat(element.dataset.revealRadius);
      if (Number.isFinite(requested)) return requested;
      return Math.min(260, Math.max(140, element.clientWidth * 0.22));
    };
  
    const updateTarget = (clientX, clientY) => {
      const rect = element.getBoundingClientRect();
      state.clientX = clientX; state.clientY = clientY;
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
  
    const onPointerEnter = (event) => {
      state.inside = true;
      updateTarget(event.clientX, event.clientY);
      if (state.radius < 0.5) {
        state.x = state.targetX; state.y = state.targetY;
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
          state.x = state.targetX; state.y = state.targetY;
        }
        state.targetRadius = getRadius();
      }
      schedule();
      if (!hasTriggeredSecret) unlockSecretText();
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
