// =================================================================
// 🚀 NEON PULSE PLATFORM CORE ENGINE & ROUTER
// =================================================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const viewportContainer = document.getElementById("viewportContainer");
const lobbyScreen = document.getElementById("lobbyScreen");
const gameScreen = document.getElementById("gameScreen");
const activeGameTitle = document.getElementById("activeGameTitle");
const gameInfo = document.getElementById("gameInfo");
const brawlHud = document.getElementById("brawlHud");
const arcadeHudPanel = document.getElementById("arcadeHudPanel");

let currentSceneName = null;
const scenes = {};

// --- AUDIO SYNTHESIZER ---
const AudioEngine = {
  ctx: null,
  pentatonicScale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33],
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
    this.playTone(note, 'triangle', 0.12, 0.15);
  },
  play(type) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (type === 'hit') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'graze') {
      this.playTone(880, 'sine', 0.05, 0.08);
    } else if (type === 'slowmo') {
      this.playTone(150, 'sawtooth', 0.3, 0.2);
    }
  }
};

// --- FX PARTICLES & FLOATING TEXTS ---
const FX = {
  shakeTimer: 0,
  shakeIntensity: 0,
  particles: [],
  floatTexts: [],
  triggerShake(intensity = 12, duration = 10) {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
  },
  spawnParticles(x, y, color, count = 12, speed = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * speed;
      this.particles.push({
        x, y, vx: Math.cos(angle) * vel, vy: Math.sin(angle) * vel,
        size: Math.random() * 4 + 2, color, life: 1.0, decay: Math.random() * 0.03 + 0.02
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
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.y += ft.vy; ft.alpha -= 0.02;
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
      ctx.font = "bold 20px 'Rajdhani', sans-serif";
      ctx.fillStyle = ft.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
};

function registerScene(name, sceneObj) {
  scenes[name] = sceneObj;
}

// --- PLATFORM LAUNCHER & ROUTER ---
function launchGame(gameName) {
  AudioEngine.init();
  if (!scenes[gameName]) return;

  currentSceneName = gameName;
  FX.particles = [];
  FX.floatTexts = [];

  lobbyScreen.classList.remove("active");
  gameScreen.classList.add("active");

  const titles = {
    brawl: "⚔️ CYBERBRAWL 2D (BATTLEGROUND)",
    rhythm: "⚡ BEAT DASH (RHYTHM HIGHWAY)",
    swarm: "👾 CYBER SWARM (SURVIVOR)",
    snake: "🐉 CYBER DRAGON (EVOLUTION)",
    flappy: "🦅 FLAPPY EAGLE (WARP RUN)",
    memory: "🧠 MEMORY MATRIX"
  };
  activeGameTitle.innerText = titles[gameName] || "PLAYING";

  if (gameName === 'brawl') {
    // Mode Fullscreen untuk CyberBrawl
    viewportContainer.className = "fullscreen-mode";
    brawlHud.classList.remove("hidden");
    arcadeHudPanel.style.display = "none";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  } else {
    // Mode Arcade Vertikal untuk game klasik
    viewportContainer.className = "arcade-mode";
    brawlHud.classList.add("hidden");
    arcadeHudPanel.style.display = "block";
    canvas.width = 720;
    canvas.height = 1080;
  }

  scenes[gameName].init();
  gameInfo.innerHTML = scenes[gameName].instruction || "";
}

function exitToLobby() {
  currentSceneName = null;
  gameScreen.classList.remove("active");
  lobbyScreen.classList.add("active");
}

// --- MAIN LOOP ---
let lastTime = performance.now();
function mainLoop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (currentSceneName && scenes[currentSceneName]) {
    ctx.save();
    if (FX.shakeTimer > 0) {
      const rx = (Math.random() - 0.5) * FX.shakeIntensity;
      const ry = (Math.random() - 0.5) * FX.shakeIntensity;
      ctx.translate(rx, ry);
    }

    scenes[currentSceneName].update(dt);
    scenes[currentSceneName].render(ctx);

    FX.update(dt);
    FX.render(ctx);
    ctx.restore();
  }

  requestAnimationFrame(mainLoop);
}

// --- GLOBAL EVENT LISTENERS (TAMBAHKAN KEYUP AGAR BISA GERAK) ---
window.addEventListener("keydown", (e) => {
  AudioEngine.init();
  if (e.code === "Escape") {
    exitToLobby();
    return;
  }
  if (currentSceneName && scenes[currentSceneName]?.onKeyDown) {
    scenes[currentSceneName].onKeyDown(e);
  }
});

// WAJIB ADA: Mengembalikan status tombol saat dilepas
window.addEventListener("keyup", (e) => {
  if (currentSceneName && scenes[currentSceneName]?.onKeyUp) {
    scenes[currentSceneName].onKeyUp(e);
  }
});

function handleCanvasPointer(clientX, clientY) {
  AudioEngine.init();
  if (!currentSceneName || !scenes[currentSceneName]) return;
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
  if (e.touches.length > 0) handleCanvasPointer(e.touches[0].clientX, e.touches[0].clientY);
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("mousemove", (e) => {
  if (!currentSceneName || !scenes[currentSceneName]) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

  if (scenes[currentSceneName].onMouseMove) {
    scenes[currentSceneName].onMouseMove(mouseX, mouseY);
  }
});

window.addEventListener("resize", () => {
  if (currentSceneName === 'brawl') {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (scenes.brawl?.onResize) scenes.brawl.onResize(canvas.width, canvas.height);
  }
});

requestAnimationFrame(mainLoop);