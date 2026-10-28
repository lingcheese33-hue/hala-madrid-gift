import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

// ---- 1. 創建隱藏的攝像頭 ----
const video = document.createElement("video");
video.setAttribute("playsinline", "");
video.style.display = "none";
document.body.appendChild(video);

// ---- 2. 金色煙花與彈窗邏輯 ----
const oathModal = document.getElementById('oath-modal');
const heartTrigger = document.getElementById('click-heart');
let isCooldown = false;
let fireworks = null;

function ensureFireworks() {
  if (fireworks) return;
  
  // 創建煙花容器
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed; 
    top: 0; left: 0; 
    width: 100vw; height: 100vh;
    pointer-events: none; 
    z-index: 99999; /* 🌟 設在文字卡片 (100000) 的下面 */
    mix-blend-mode: screen; /* 🌟 讓金色發光，在暗背景下超亮 */
  `;
  document.body.appendChild(container);
  
  if (typeof Fireworks !== 'undefined') {
    fireworks = new Fireworks.default(container, {
      autoresize: true, 
      opacity: 1,              // 最亮
      acceleration: 1.01, 
      friction: 0.985, 
      gravity: 0.6,
      particles: 400,          // 粒子超多，超華麗
      explosion: 15, 
      intensity: 30, 
      flickering: 50,
      
      // 🌟 純正金色
      hue: { min: 35, max: 55 }, 
      brightness: { min: 80, max: 100 },
      saturation: { min: 90, max: 100 },
      
      decay: { min: 0.008, max: 0.015 },
      traceLength: 8, 
      traceSpeed: 18, 
      lineWidth: { explosion: 5, trace: 3 }, 
      rocketsPoint: { min: 50, max: 50 },
    });
  } else {
    console.warn("找不到 Fireworks 庫！請檢查 index.html 是否有引入 CDN。");
  }
}

function triggerUltimateFireworks() {
  if (isCooldown) return;
  isCooldown = true;

  // 1. 顯示彈窗 (卡片會浮在煙花上面)
  if (oathModal) oathModal.classList.add('show');

  // 2. 發射連續 3 發煙花
  ensureFireworks();
  if (fireworks) {
    fireworks.launch(1);
    setTimeout(() => fireworks.launch(1), 300);
    setTimeout(() => fireworks.launch(1), 600);
  }

  // 3. 3 秒後關閉彈窗
  setTimeout(() => {
    if (oathModal) oathModal.classList.remove('show');
    isCooldown = false;
  }, 3000);
}

// 點擊愛心觸發
if (heartTrigger) {
  heartTrigger.addEventListener('click', triggerUltimateFireworks);
}

// ---- 3. 手勢偵測 ----
function isFingerExtended(landmarks, tipIndex, pipIndex) {
  return landmarks[tipIndex].y < landmarks[pipIndex].y;
}
function isThumbExtended(landmarks, handedness) {
  return handedness === "Right" ? landmarks[4].x > landmarks[3].x : landmarks[4].x < landmarks[3].x;
}
function isFiveFingersOpen(landmarks, handedness) {
  return isFingerExtended(landmarks, 8, 6) && isFingerExtended(landmarks, 12, 10) && 
         isFingerExtended(landmarks, 16, 14) && isFingerExtended(landmarks, 20, 18) && 
         isThumbExtended(landmarks, handedness);
}

async function init() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    video.srcObject = stream;
    await new Promise((resolve) => { video.onloadedmetadata = () => { video.play(); resolve(); }; });

    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
    const handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
    });

    let lastVideoTime = -1;

    function loop() {
      const now = performance.now();
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = handLandmarker.detectForVideo(video, now);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const handedness = results.handedness[0][0].categoryName;

          if (isFiveFingersOpen(landmarks, handedness)) {
            triggerUltimateFireworks();
          }
        }
      }
      requestAnimationFrame(loop);
    }
    loop();
  } catch (err) {
    console.warn("手勢特效未啟動：", err);
  }
}

init();