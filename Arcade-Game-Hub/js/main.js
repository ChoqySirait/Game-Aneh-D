// =================================================================
// 🚀 NEON PULSE ENGINE (Delta Time, Audio Synth, FX, & Scene State)
// =================================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameInfo = document.getElementById("gameInfo");

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

// --- AUDIO SYNTHESIZER ---
const AudioEngine = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  play(type) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (type) {
      case 'jump':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      case 'score':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      case 'hit':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      case 'shield':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.2);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'tile':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
    }
  }
};

// --- FX SYSTEM: SHAKE, PARTICLES & FLOATING TEXTS ---
const FX = {
  shakeTimer: 0,
  shakeIntensity: 0,
  particles: [],
  floatTexts: [],

  triggerShake(intensity = 15, duration = 12) {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  },

  spawnParticles(x, y, color, count = 15, speed = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * speed;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        size: Math.random() * 5 + 2,
        color,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  },

  spawnText(x, y, text, color = "#00f2fe") {
    this.floatTexts.push({ x, y, text, color, alpha: 1.0, vy: -1.5 });
  },

  update() {
    if (this.shakeTimer > 0) this.shakeTimer--;

    // Update Partikel
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update Floating Text
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.025;
      if (ft.alpha <= 0) this.floatTexts.splice(i, 1);
    }
  },

  render(ctx) {
    // Render partikel
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render floating text
    this.floatTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = "bold 24px sans-serif";
      ctx.fillStyle = ft.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
};

// --- SCENE MANAGER ---
const scenes = {};
let currentSceneName = 'flappy';

function registerScene(name, sceneObj) {
  scenes[name] = sceneObj;
}

function switchGame(name, evt) {
  AudioEngine.init();
  if (!scenes[name]) return;
  currentSceneName = name;
  FX.particles = [];
  FX.floatTexts = [];

  document.querySelectorAll('.game-btn').forEach(btn => btn.classList.remove('active'));
  if (evt && evt.target) evt.target.classList.add('active');

  scenes[name].init();
  gameInfo.innerHTML = scenes[name].instruction || "";
}

// --- ENGINE LOOP (DENGAN SCREEN SHAKE & DELTA TIME) ---
let lastTime = performance.now();

function mainLoop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1); // Detik
  lastTime = now;

  ctx.save();
  // Terapkan Screen Shake jika aktif
  if (FX.shakeTimer > 0) {
    const rx = (Math.random() - 0.5) * FX.shakeIntensity;
    const ry = (Math.random() - 0.5) * FX.shakeIntensity;
    ctx.translate(rx, ry);
  }

  const activeScene = scenes[currentSceneName];
  if (activeScene) {
    activeScene.update(dt);
    activeScene.render(ctx);
  }

  FX.update();
  FX.render(ctx);
  ctx.restore();

  requestAnimationFrame(mainLoop);
}

// --- GLOBAL EVENT LISTENERS DENGAN DUKUNGAN TOUCH & KEYBOARD ---
window.addEventListener("keydown", (e) => {
  AudioEngine.init();
  if (scenes[currentSceneName]?.onKeyDown) {
    scenes[currentSceneName].onKeyDown(e);
  }
});

function handleCanvasPointer(clientX, clientY) {
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

canvas.addEventListener("mousedown", (e) => handleCanvasPointer(e.clientX, e.clientY));
canvas.addEventListener("touchstart", (e) => {
  if (e.touches.length > 0) {
    handleCanvasPointer(e.touches[0].clientX, e.touches[0].clientY);
  }
  e.preventDefault();
}, { passive: false });

// Start Engine
window.addEventListener("DOMContentLoaded", () => {
  switchGame('flappy');
  requestAnimationFrame(mainLoop);
});