// =================================================================
// 🚀 NEON PULSE CORE ENGINE
// =================================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameInfo = document.getElementById("gameInfo");

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

// --- PENTATONIC AUDIO SYNTHESIZER ---
const AudioEngine = {
  ctx: null,
  pentatonicScale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33], // C4, D4, E4, G4, A4, C5, D5

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  },

  playArpeggio(step = 0) {
    const note = this.pentatonicScale[step % this.pentatonicScale.length];
    this.playTone(note, 'triangle', 0.15, 0.18);
  },

  play(type) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (type === 'hit') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'graze') {
      this.playTone(880, 'sine', 0.06, 0.08);
    } else if (type === 'slowmo') {
      this.playTone(150, 'sawtooth', 0.4, 0.2);
    }
  }
};

// --- FX & PARTICLES SYSTEM ---
const FX = {
  shakeTimer: 0,
  shakeIntensity: 0,
  particles: [],
  floatTexts: [],

  triggerShake(intensity = 12, duration = 10) {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  },

  spawnParticles(x, y, color, count = 15, speed = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * speed;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        size: Math.random() * 4 + 2,
        color,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  },

  spawnText(x, y, text, color = "#00f2fe") {
    this.floatTexts.push({ x, y, text, color, alpha: 1.0, vy: -1.2 });
  },

  update(dt) {
    if (this.shakeTimer > 0) this.shakeTimer--;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;
      if (ft.alpha <= 0) this.floatTexts.splice(i, 1);
    }
  },

  render(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    this.floatTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = "bold 22px 'Rajdhani', sans-serif";
      ctx.fillStyle = ft.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
};

// --- SCENE MANAGER & DEBUG TOOLKIT ---
const scenes = {};
let currentSceneName = 'flappy';
let debugMode = false;
let fps = 0, frameCount = 0, fpsTimer = 0;

function registerScene(name, sceneObj) {
  scenes[name] = sceneObj;
}

function switchGame(name, evt) {
  AudioEngine.init();
  if (!scenes[name]) return;
  currentSceneName = name;
  FX.particles = [];
  FX.floatTexts = [];

  document.querySelectorAll('.game-tab').forEach(btn => btn.classList.remove('active'));
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');

  scenes[name].init();
  gameInfo.innerHTML = scenes[name].instruction || "";
}

// --- MAIN LOOP ---
let lastTime = performance.now();

function mainLoop(now) {
  const rawDt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  frameCount++;
  fpsTimer += rawDt;
  if (fpsTimer >= 0.5) {
    fps = Math.round((frameCount / fpsTimer));
    frameCount = 0;
    fpsTimer = 0;
  }

  ctx.save();
  if (FX.shakeTimer > 0) {
    const rx = (Math.random() - 0.5) * FX.shakeIntensity;
    const ry = (Math.random() - 0.5) * FX.shakeIntensity;
    ctx.translate(rx, ry);
  }

  const activeScene = scenes[currentSceneName];
  if (activeScene) {
    activeScene.update(rawDt);
    activeScene.render(ctx);

    if (debugMode && activeScene.renderDebug) {
      activeScene.renderDebug(ctx);
    }
  }

  FX.update(rawDt);
  FX.render(ctx);
  ctx.restore();

  if (debugMode) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(canvas.width - 240, 10, 230, 90);
    ctx.strokeStyle = "#00f2fe";
    ctx.strokeRect(canvas.width - 240, 10, 230, 90);
    ctx.fillStyle = "#00f2fe";
    ctx.font = "14px monospace";
    ctx.fillText(`PROFILER ACTIVE (D / ~)`, canvas.width - 230, 30);
    ctx.fillStyle = fps >= 55 ? "#00e676" : "#ff1744";
    ctx.fillText(`ENGINE FPS   : ${fps}`, canvas.width - 230, 50);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`DELTA TIME   : ${(rawDt * 1000).toFixed(2)} ms`, canvas.width - 230, 70);
    ctx.fillText(`PARTICLES    : ${FX.particles.length}`, canvas.width - 230, 90);
    ctx.restore();
  }

  requestAnimationFrame(mainLoop);
}

// --- EVENT INPUT HANDLING ---
window.addEventListener("keydown", (e) => {
  AudioEngine.init();
  if (e.code === "KeyD" || e.code === "Backquote") {
    debugMode = !debugMode;
    return;
  }
  if (scenes[currentSceneName]?.onKeyDown) {
    scenes[currentSceneName].onKeyDown(e);
  }
});

function handlePointer(clientX, clientY) {
  AudioEngine.init();
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (clientX - rect.left) * scaleX;
  const y = (clientY - rect.top) * scaleY;

  if (scenes[currentSceneName]?.onPointerDown) {
    scenes[currentSceneName].onPointerDown(x, y);
  }
}

canvas.addEventListener("mousedown", (e) => handlePointer(e.clientX, e.clientY));
canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length > 0) {
    handlePointer(e.touches[0].clientX, e.touches[0].clientY);
  }
  e.preventDefault();
}, { passive: false });

// Mouse Move Tracking untuk Swarm Game
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const active = scenes[currentSceneName];
  if (active && active.state) {
    active.state.targetX = (e.clientX - rect.left) * scaleX;
    active.state.targetY = (e.clientY - rect.top) * scaleY;
  }
});

window.addEventListener("DOMContentLoaded", () => {
  if (scenes[currentSceneName]) {
    switchGame(currentSceneName);
  }
  requestAnimationFrame(mainLoop);
});