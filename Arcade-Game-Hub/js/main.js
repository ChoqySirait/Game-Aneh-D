const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameInfo = document.getElementById("gameInfo");

let currentGame = 'flappy';

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

// ==========================================
// 🔊 WEB AUDIO API (SFX SINTETIS)
// ==========================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'jump') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'eat') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } else if (type === 'shield') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(450, now + 0.25);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (type === 'hit') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'tile') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  }
}

// ==========================================
// ✨ SISTEM PARTIKEL NEON
// ==========================================
let particles = [];

function createParticles(x, y, color, count = 15) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      size: Math.random() * 6 + 2,
      color: color,
      life: 1.0,
      decay: Math.random() * 0.03 + 0.01
    });
  }
}

function updateAndRenderParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.shadowBlur = 10;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ==========================================
// 🔁 GAME ENGINE LOOP & SWITCHER
// ==========================================
function mainLoop() {
  if (currentGame === 'flappy') {
    updateFlappy();
    renderFlappy();
  } else if (currentGame === 'snake') {
    updateSnake();
    renderSnake();
  } else if (currentGame === 'memory') {
    updateMemory();
    renderMemory();
  }

  updateAndRenderParticles();
  requestAnimationFrame(mainLoop);
}

function switchGame(gameName, evt) {
  initAudio();
  currentGame = gameName;
  particles = [];

  document.querySelectorAll('.game-btn').forEach(btn => btn.classList.remove('active'));
  if (evt && evt.target) evt.target.classList.add('active');

  if (gameName === 'flappy') {
    initFlappy();
    gameInfo.innerHTML = "Gunakan <b>SPASI</b> untuk melompat & <b>SHIFT</b> untuk Perisai.";
  } else if (gameName === 'snake') {
    initSnake();
    gameInfo.innerHTML = "Gunakan <b>Tombol Panah</b> untuk mengontrol arah Ular.";
  } else if (gameName === 'memory') {
    initMemory();
    gameInfo.innerHTML = "Klik ubin yang menyala menggunakan <b>Klik Mouse</b>!";
  }
}

canvas.addEventListener("click", function(e) {
  initAudio();
  let rect = canvas.getBoundingClientRect();
  let scaleX = canvas.width / rect.width;
  let scaleY = canvas.height / rect.height;
  let clickX = (e.clientX - rect.left) * scaleX;
  let clickY = (e.clientY - rect.top) * scaleY;

  if (currentGame === 'memory') handleMemoryClick(clickX, clickY);
});

document.addEventListener("keydown", function(e) {
  initAudio();
  if (currentGame === 'flappy') {
    if (e.code === "Space") {
      if (!flappyState.isStarted) {
        flappyState.isStarted = true;
        flappyState.velocity = flappyState.jump;
        playSound('jump');
      } else if (flappyState.isGameOver) {
        initFlappy();
      } else {
        flappyState.velocity = flappyState.jump;
        playSound('jump');
      }
    }
    if ((e.code === "ShiftLeft" || e.code === "ShiftRight") && flappyState.isStarted && !flappyState.isGameOver && !flappyState.isShieldActive && flappyState.shieldCooldownLeft <= 0) {
      flappyState.isShieldActive = true;
      flappyState.shieldTimeLeft = flappyState.shieldDuration;
      flappyState.shieldCooldownLeft = flappyState.shieldCooldown;
      playSound('shield');
    }
  } else if (currentGame === 'snake') {
    let s = snakeState;
    if (e.code === "Space") {
      if (!s.isStarted) s.isStarted = true;
      else if (s.isGameOver) initSnake();
    }
    if (e.code === "ArrowUp" && s.dy === 0) { s.nextDx = 0; s.nextDy = -1; if (!s.isStarted) s.isStarted = true; }
    if (e.code === "ArrowDown" && s.dy === 0) { s.nextDx = 0; s.nextDy = 1; if (!s.isStarted) s.isStarted = true; }
    if (e.code === "ArrowLeft" && s.dx === 0) { s.nextDx = -1; s.nextDy = 0; if (!s.isStarted) s.isStarted = true; }
    if (e.code === "ArrowRight" && s.dx === 0) { s.nextDx = 1; s.nextDy = 0; if (!s.isStarted) s.isStarted = true; }
  } else if (currentGame === 'memory') {
    if (e.code === "Space" && memoryState.phase === 'GAMEOVER') initMemory();
  }
});

initFlappy();
mainLoop();