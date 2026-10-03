// =================================================================
// 🚀 NEON PULSE PLATFORM CORE ENGINE & ROUTER (v4.6 JUICE & BGM)
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
let audioMuted = false;

// --- PROCEDURAL AUDIO & BGM SYNTHESIZER ---
const AudioEngine = {
  ctx: null,
  pentatonicScale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33],
  bgmInterval: null,
  bgmStep: 0,

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  // Generator Musik Synthwave 128 BPM Prosedural (Murni Web Audio API, 0 KB File)
  startBGM() {
    this.init();
    if (this.bgmInterval) return;

    // Bassline Synthwave (Progresi E minor: E2, G2, A2, B2)
    const bassline = [82.41, 82.41, 98.00, 82.41, 110.00, 82.41, 123.47, 98.00];
    this.bgmStep = 0;

    // 128 BPM (1/8 note = ~234ms)
    this.bgmInterval = setInterval(() => {
      if (audioMuted || !this.ctx || this.ctx.state !== 'running') return;

      const note = bassline[this.bgmStep % bassline.length];
      // Synth Bass Pump
      this.playTone(note, 'sawtooth', 0.12, 0.035);

      // Kick Drum Synthesizer di setiap ketukan ganjil
      if (this.bgmStep % 2 === 0) {
        this.playTone(55, 'sine', 0.09, 0.07);
      }
      this.bgmStep++;
    }, 234);
  },

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  },

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
    if (audioMuted || !this.ctx) return;
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
    if (audioMuted || !this.ctx) return;
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
    }
  }
};

function toggleAudio() {
  audioMuted = !audioMuted;
  const btn = document.getElementById("btnAudioToggle");
  if (btn) btn.innerText = audioMuted ? "🔇" : "🔊";
  AudioEngine.playTone(500, 'sine', 0.05, 0.1);
}

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
      ctx.shadowBlur = 8; ctx.shadowColor = p.color; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    this.floatTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = "bold 20px 'Rajdhani', sans-serif";
      ctx.fillStyle = ft.color; ctx.shadowBlur = 8; ctx.shadowColor = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
};

function registerScene(name, sceneObj) {
  scenes[name] = sceneObj;
}

// --- DATABASE PANDUAN GAME & MODAL ---
const gameData = {
  brawl: {
    title: "CYBERBRAWL 2D: WARZONE",
    icon: "⚔️",
    badge: "OPERASI MILITER TAKTIKAL",
    difficulty: "TINGKAT KESULITAN: ⭐⭐⭐⭐☆ (MENANTANG)",
    desc: "Misi pembersihan sektor 2.5D. Selamatkan regu Spec-Ops AI dari Kapsul Cryo, ganti 3 modul senjata secara instan, dan gunakan pedang Katana untuk memantulkan peluru musuh!",
    controls: "KEYBOARD + MOUSE (DUAL-STICK)",
    engine: "2.5D EXTRUDED SHADOW + LASER SIGHT",
    controlsList: [
      { key: "W - A - S - D", desc: "Berlari navigasi 8-arah taktis" },
      { key: "KURSOR MOUSE", desc: "Mengarahkan laser sight & senter taktis" },
      { key: "KLIK KIRI", desc: "Menembak senjata aktif (Recoil & damage floating)" },
      { key: "KLIK KANAN", desc: "Tebasan Katana (Memantulkan peluru musuh)" },
      { key: "ANGKA 1, 2, 3 / Q", desc: "Ganti senjata: 1=M4 Karbin, 2=Shotgun, 3=Railgun" },
      { key: "SPASI", desc: "Tactical Dash (Melesat cepat menembus rintangan)" }
    ],
    tips: [
      "Dekati Kapsul RESCUE bertuliskan hijau untuk merekrut teman AI Medic & Gunner.",
      "Tembak Tong Merah untuk ledakan berantai, atau Tong Biru untuk membekukan sekelompok musuh.",
      "Gunakan Klik Kanan saat peluru musuh mendekat untuk memantulkannya kembali!"
    ],
    scoreKey: "brawl_high_kills"
  },
  rhythm: {
    title: "BEAT DASH // RHYTHM HIGHWAY",
    icon: "⚡",
    badge: "MUSIK & REFLEKS TEMPO",
    difficulty: "TINGKAT KESULITAN: ⭐⭐⭐☆☆ (SEDANG)",
    desc: "Meluncur di jalan tol siber 3D! Ketuk not tepat saat menyentuh garis bawah untuk harmoni synthesizer yang dinamis.",
    controls: "D - F - J - K / SENTUH JALUR",
    engine: "PERSPEKTIF 3D SYNTHWAVE (128 BPM)",
    controlsList: [
      { key: "D - F - J - K", desc: "Ketuk 4 jalur nada sesuai warna" },
      { key: "LAYAR SENTUH", desc: "Sentuh langsung jalur di bawah layar" },
      { key: "SPASI", desc: "Memulai atau restart lagu" }
    ],
    tips: [
      "Kombo beruntun melipatgandakan multiplier skor hingga 5x!",
      "Fokuskan pandangan Anda tepat pada garis putih bawah lintasan."
    ],
    scoreKey: "rhythm_high_score"
  },
  swarm: {
    title: "CYBER SWARM // ARENA SURVIVOR",
    icon: "👾",
    badge: "AKSI BERTAHAN HIDUP",
    difficulty: "TINGKAT KESULITAN: ⭐⭐⭐☆☆ (SEDANG)",
    desc: "Inti energi virus siber dikelilingi kawanan nano-drone pertahanan. Hindari kepungan antivirus dan hancurkan mereka dengan tembakan otomatis.",
    controls: "KURSOR MOUSE / GESER LAYAR",
    engine: "AUTO-AIM VECTOR PHYSICS",
    controlsList: [
      { key: "MOUSE / SENTUH", desc: "Arahkan pergerakan inti drone" },
      { key: "SPASI / KLIK", desc: "Melepaskan Nova Burst EMP (gelombang kejut)" }
    ],
    tips: [
      "Kumpulkan Data Orb kuning untuk menambah jumlah drone pelindung.",
      "Gunakan Nova EMP saat musuh mengepung rapat!"
    ],
    scoreKey: "swarm_high_score"
  },
  snake: {
    title: "CYBER DRAGON // EVOLUTION",
    icon: "🐉",
    badge: "KLASIK REVOLUSI",
    difficulty: "TINGKAT KESULITAN: ⭐⭐☆☆☆ (SANTAI)",
    desc: "Ular siber yang berevolusi melalui 8 tingkatan naga bertanduk emas dengan fitur Slow-Motion Bullet Time.",
    controls: "WASD / PANAH KEYBOARD",
    engine: "INPUT QUEUE ANTI-LAG",
    controlsList: [
      { key: "WASD / PANAH", desc: "Navigasi arah kemudi" },
      { key: "TOMBOL B", desc: "Bullet Time (Gerak lambat)" }
    ],
    tips: ["Gunakan tombol B saat tubuh naga sudah sangat panjang untuk belokan sempit."],
    scoreKey: "snake_high_score"
  },
  flappy: {
    title: "FLAPPY EAGLE // WARP DRIVE",
    icon: "🦅",
    badge: "REFLEKS TERBANG",
    difficulty: "TINGKAT KESULITAN: ⭐⭐⭐⭐☆ (REFLEKS TINGGI)",
    desc: "Terbangkan elang siber melewati pilar energi neon dengan akselerasi Warp Drive di skor 500.",
    controls: "SPASI / KLIK / SENTUH",
    engine: "DYNAMIC BIOME FLYER",
    controlsList: [
      { key: "SPASI / KLIK", desc: "Mengepakkan sayap lompat" },
      { key: "TOMBOL SHIFT", desc: "Perisai darurat menembus 1 pilar" }
    ],
    tips: ["Menyerempet pipa tanpa menabrak (Graze) memberi skor ekstra ganda."],
    scoreKey: "flappy_high_score"
  },
  memory: {
    title: "MEMORY MATRIX // ASAH OTAK",
    icon: "🧠",
    badge: "UJI MEMORI SPASIAL",
    difficulty: "TINGKAT KESULITAN: ⭐⭐⭐☆☆ (FOKUS)",
    desc: "Hafalkan ubin neon yang berkedip kilat sebelum padam dan tebak urutannya di papan yang membesar dari 3x3 ke 6x6.",
    controls: "KLIK KIRI / SENTUH",
    engine: "MATRIKS GRID ADAPTIF",
    controlsList: [{ key: "KLIK UBIN", desc: "Pilih ubin neon yang tadi menyala" }],
    tips: ["Bentuk pola visual imajiner di pikiran Anda untuk mempermudah mengingat."],
    scoreKey: "memory_high_score"
  }
};

function openGameModal(gameKey) {
  AudioEngine.init();
  AudioEngine.playTone(850, 'sine', 0.05, 0.1);
  const data = gameData[gameKey];
  if (!data) return;

  document.getElementById("modalBadge").innerText = data.badge;
  document.getElementById("modalIcon").innerText = data.icon;
  document.getElementById("modalTitle").innerText = data.title;
  document.getElementById("modalDifficulty").innerText = data.difficulty;
  document.getElementById("modalDesc").innerText = data.desc;
  document.getElementById("modalControls").innerText = data.controls;
  document.getElementById("modalEngine").innerText = data.engine;

  const savedScore = localStorage.getItem(data.scoreKey) || 0;
  document.getElementById("modalHighScore").innerText = savedScore + " POIN";

  const tableContainer = document.getElementById("modalControlsTable");
  tableContainer.innerHTML = data.controlsList.map(item => `
    <div class="control-row">
      <span class="control-key">${item.key}</span>
      <span class="control-desc">${item.desc}</span>
    </div>
  `).join("");

  const tipsContainer = document.getElementById("modalTipsBox");
  tipsContainer.innerHTML = `<ul>${data.tips.map(t => `<li>${t}</li>`).join("")}</ul>`;

  document.getElementById("modalDeployBtn").onclick = () => launchGame(gameKey);
  document.getElementById("gameModal").classList.add("active");
}

function closeGameModal() {
  const modal = document.getElementById("gameModal");
  if (modal) modal.classList.remove("active");
}

function filterCategory(category, buttonElement) {
  AudioEngine.init();
  AudioEngine.playTone(900, 'sine', 0.02, 0.05);

  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  if (buttonElement) buttonElement.classList.add("active");

  const cards = document.querySelectorAll(".card-3d-wrapper");
  cards.forEach(card => {
    const cardCat = card.getAttribute("data-category");
    if (category === "all" || cardCat === category) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

function handleSearch(query) {
  const q = query.toLowerCase().trim();
  const clearBtn = document.getElementById("searchClearBtn");
  if (clearBtn) clearBtn.classList.toggle("active", q.length > 0);

  const cards = document.querySelectorAll(".card-3d-wrapper");
  cards.forEach(card => {
    const title = card.getAttribute("data-title") || "";
    if (title.includes(q)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

function clearSearch() {
  const searchInput = document.getElementById("gameSearchInput");
  if (searchInput) {
    searchInput.value = "";
    handleSearch("");
  }
}

// --- PLATFORM LAUNCHER & ROUTER ---
function launchGame(gameName) {
  AudioEngine.init();
  if (!scenes[gameName]) return;

  closeGameModal();
  currentSceneName = gameName;
  FX.particles = [];
  FX.floatTexts = [];

  lobbyScreen.classList.remove("active");
  gameScreen.classList.add("active");

  const titles = {
    brawl: "⚔️ CYBERBRAWL 2D (WARZONE OVERDRIVE)",
    rhythm: "⚡ BEAT DASH (RHYTHM HIGHWAY)",
    swarm: "👾 CYBER SWARM (ARENA SURVIVOR)",
    snake: "🐉 CYBER DRAGON (EVOLUTION)",
    flappy: "🦅 FLAPPY EAGLE (WARP DRIVE)",
    memory: "🧠 MEMORY MATRIX"
  };
  activeGameTitle.innerText = titles[gameName] || "SEDANG BERMAIN";

  if (gameName === 'brawl') {
    viewportContainer.className = "fullscreen-mode";
    brawlHud.classList.remove("hidden");
    arcadeHudPanel.style.display = "none";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Mainkan BGM Synthwave Otomatis saat Deploy ke Warzone
    AudioEngine.startBGM();
  } else {
    viewportContainer.className = "arcade-mode";
    brawlHud.classList.add("hidden");
    arcadeHudPanel.style.display = "block";
    canvas.width = 720;
    canvas.height = 1080;
    AudioEngine.stopBGM();
  }

  scenes[gameName].init();
  gameInfo.innerHTML = scenes[gameName].instruction || "";
}

function exitToLobby() {
  AudioEngine.stopBGM();
  currentSceneName = null;
  gameScreen.classList.remove("active");
  lobbyScreen.classList.add("active");
}

function initializeLobbySystem() {
  setInterval(() => {
    const now = new Date();
    const clockEl = document.getElementById("hudClock");
    if (clockEl) {
      clockEl.innerText = now.toLocaleTimeString('id-ID') + " WIB";
    }
  }, 1000);

  const cards = document.querySelectorAll(".card-3d-wrapper");
  cards.forEach(wrapper => {
    const card = wrapper.querySelector(".card-3d");
    const glare = wrapper.querySelector(".card-glare");

    wrapper.addEventListener("mousemove", (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -10;
      const rotateY = ((x - centerX) / centerX) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      if (glare) {
        glare.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 60%)`;
      }
    });

    wrapper.addEventListener("mouseenter", () => {
      AudioEngine.init();
      AudioEngine.playTone(1100, 'sine', 0.015, 0.02);
    });

    wrapper.addEventListener("mouseleave", () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeLobbySystem);
} else {
  initializeLobbySystem();
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

    try {
      scenes[currentSceneName].update(dt);
      scenes[currentSceneName].render(ctx);
    } catch (err) {
      console.error("Runtime error di scene:", currentSceneName, err);
    }

    FX.update(dt);
    FX.render(ctx);
    ctx.restore();
  }

  requestAnimationFrame(mainLoop);
}

// --- GLOBAL EVENT LISTENERS ---
window.addEventListener("keydown", (e) => {
  AudioEngine.init();
  if (e.code === "Escape") {
    if (document.getElementById("gameModal")?.classList.contains("active")) {
      closeGameModal();
    } else {
      exitToLobby();
    }
    return;
  }
  if (currentSceneName && scenes[currentSceneName]?.onKeyDown) {
    scenes[currentSceneName].onKeyDown(e);
  }
});

window.addEventListener("keyup", (e) => {
  if (currentSceneName && scenes[currentSceneName]?.onKeyUp) {
    scenes[currentSceneName].onKeyUp(e);
  }
});

window.addEventListener("contextmenu", (e) => {
  if (currentSceneName === 'brawl') e.preventDefault();
});

function getCanvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

canvas.addEventListener("mousedown", (e) => {
  AudioEngine.init();
  if (!currentSceneName || !scenes[currentSceneName]) return;
  const pos = getCanvasCoords(e.clientX, e.clientY);
  if (scenes[currentSceneName].onMouseDown) {
    scenes[currentSceneName].onMouseDown(e.button, pos.x, pos.y);
  } else if (scenes[currentSceneName].onPointerDown) {
    scenes[currentSceneName].onPointerDown(pos.x, pos.y);
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!currentSceneName || !scenes[currentSceneName]) return;
  const pos = getCanvasCoords(e.clientX, e.clientY);
  if (scenes[currentSceneName].onMouseMove) {
    scenes[currentSceneName].onMouseMove(pos.x, pos.y);
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