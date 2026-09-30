// =================================================================
// 🚀 NEON PULSE PLATFORM CORE ENGINE & ROUTER (v4.5 INTEL & GUIDES)
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

// =================================================================
// 📖 DATABASE BUKU PANDUAN LENGKAP (6 GAME DETAIL CARA MAIN)
// =================================================================
const gameData = {
  brawl: {
    title: "CYBERBRAWL 2D: WARZONE",
    icon: "⚔️",
    badge: "OPERASI MILITER TAKTIKAL",
    difficulty: "TINGKAT KESULITAN: ⭐⭐⭐⭐☆ (MENANTANG)",
    desc: "Misi Anda adalah memimpin operasi pembersihan markas musuh. Bergerak di medan perang 2.5D, selamatkan rekan tim dari Kapsul Cryo, ganti senjata sesuai jarak musuh, dan gunakan pedang Katana untuk memantulkan proyektil lawan kembali ke arah mereka.",
    controls: "KEYBOARD + MOUSE (DUAL-STICK)",
    engine: "2.5D SHADOW + TACTICAL FLASHLIGHT",
    controlsList: [
      { key: "W - A - S - D", desc: "Berlari navigasi ke 8 arah di medan tempur" },
      { key: "KURSOR MOUSE", desc: "Mengarahkan sorot lampu senter & bidikan laser senjata" },
      { key: "KLIK KIRI", desc: "Menembakkan senjata aktif (recoil & akurasi tinggi)" },
      { key: "KLIK KANAN", desc: "Tebasan Katana (memotong musuh & memantulkan peluru)" },
      { key: "ANGKA 1, 2, 3 / Q", desc: "Ganti senjata: 1=M4 Karbin, 2=Shotgun, 3=Railgun Sniper" },
      { key: "SPASI", desc: "Tactical Dash (melesat cepat & menabrak musuh)" }
    ],
    tips: [
      "Dekati Kapsul RESCUE bertuliskan hijau untuk merekrut teman AI Medic & Gunner.",
      "Tembak Tong Merah saat musuh berkerumun untuk ledakan berantai, atau Tong Biru untuk membekukan mereka.",
      "Gunakan Klik Kanan tepat saat peluru musuh mendekat untuk memantulkannya kembali!"
    ],
    scoreKey: "brawl_high_kills"
  },
  rhythm: {
    title: "BEAT DASH // RHYTHM HIGHWAY",
    icon: "⚡",
    badge: "MUSIK & REFLEKS TEMPO",
    difficulty: "TINGKAT KESULITAN: ⭐⭐⭐☆☆ (SEDANG)",
    desc: "Meluncur di jalan tol siber 3D berkecepatan tinggi! Ketuk tombol jalur tepat saat balok nada menyentuh garis eksekusi di bagian bawah untuk menghasilkan harmoni musik synthesizer yang memukau.",
    controls: "TOMBOL D - F - J - K / SENTUH JALUR",
    engine: "PERSPEKTIF 3D SYNTHWAVE (128 BPM)",
    controlsList: [
      { key: "TOMBOL D", desc: "Ketuk jalur 1 (Warna Cyan / Biru Muda)" },
      { key: "TOMBOL F", desc: "Ketuk jalur 2 (Warna Pink / Magenta)" },
      { key: "TOMBOL J", desc: "Ketuk jalur 3 (Warna Kuning / Amber)" },
      { key: "TOMBOL K", desc: "Ketuk jalur 4 (Warna Hijau Neon)" },
      { key: "LAYAR SENTUH", desc: "Sentuh langsung salah satu dari 4 kotak tombol di bagian bawah" },
      { key: "SPASI", desc: "Memulai lagu atau restart setelah permainan selesai" }
    ],
    tips: [
      "Setiap 6 kali kombo berturut-turut akan melipatgandakan multiplier skor hingga 5x lipat!",
      "Jika sering miss (terlewat), bar darah hijau di atas akan berkurang drastis.",
      "Fokuskan pandangan Anda tepat pada garis putih bercahaya di bawah lintasan."
    ],
    scoreKey: "rhythm_high_score"
  },
  swarm: {
    title: "CYBER SWARM // ARENA SURVIVOR",
    icon: "👾",
    badge: "AKSI BERTAHAN HIDUP",
    difficulty: "TINGKAT KESULITAN: ⭐⭐⭐☆☆ (SEDANG)",
    desc: "Karakter Anda adalah inti energi virus siber yang dikelilingi kawanan nano-drone pertahanan. Hindari kepungan antivirus dan hancurkan musuh dengan tembakan laser otomatis.",
    controls: "KURSOR MOUSE / GESER LAYAR",
    engine: "FISIKA VEKTOR BIDIK OTOMATIS",
    controlsList: [
      { key: "GERAKAN MOUSE", desc: "Inti drone akan mengikuti posisi kursor secara halus" },
      { key: "SENTUH LAYAR", desc: "Geser jari di layar ponsel untuk mengarahkan posisi drone" },
      { key: "SPASI / KLIK", desc: "Melepaskan Nova Burst EMP (gelombang kejut penghancur layar)" }
    ],
    tips: [
      "Nano-drone akan menembak musuh terdekat secara otomatis tanpa perlu Anda klik.",
      "Kumpulkan Data Orb kuning yang dijatuhkan musuh untuk menambah jumlah drone pelindung Anda.",
      "Simpan gelombang Nova EMP untuk situasi genting saat musuh mengepung dari segala arah!"
    ],
    scoreKey: "swarm_high_score"
  },
  snake: {
    title: "CYBER DRAGON // EVOLUTION",
    icon: "🐉",
    badge: "KLASIK DENGAN SENTUHAN MODERN",
    difficulty: "TINGKAT KESULITAN: ⭐⭐☆☆☆ (SANTAI)",
    desc: "Revolusi game Snake klasik legendaris! Kendalikan ular siber yang memakan data core bercahaya untuk berevolusi melalui 8 tingkatan wujud mitologi naga bertanduk emas.",
    controls: "TOMBOL WASD / PANAH KEYBOARD",
    engine: "INPUT QUEUE ANTI-LAG",
    controlsList: [
      { key: "W / PANAH ATAS", desc: "Belok ke arah atas" },
      { key: "S / PANAH BAWAH", desc: "Belok ke arah bawah" },
      { key: "A / PANAH KIRI", desc: "Belok ke arah kiri" },
      { key: "D / PANAH KANAN", desc: "Belok ke arah kanan" },
      { key: "TOMBOL B", desc: "Mengaktifkan Bullet Time (gerak lambat untuk tikungan sulit)" },
      { key: "SPASI", desc: "Mulai permainan / restart" }
    ],
    tips: [
      "Game ini menggunakan sistem antrean input (*input buffer*), sehingga Anda bisa menekan tombol belok ganda tanpa khawatir menabrak diri sendiri.",
      "Gunakan tombol B (Slow-Mo) saat ekor naga sudah sangat panjang dan ruang gerak menyempit."
    ],
    scoreKey: "snake_high_score"
  },
  flappy: {
    title: "FLAPPY EAGLE // WARP DRIVE",
    icon: "🦅",
    badge: "REFLEKS TERBANG TANPA BATAS",
    difficulty: "TINGKAT KESULITAN: ⭐⭐⭐⭐☆ (REFLEKS TINGGI)",
    desc: "Kepakkan sayap elang siber Anda melewati celah pilar-pilar energi neon. Semakin lama Anda bertahan, kecepatan gravitasi akan semakin menantang refleks Anda!",
    controls: "SPASI / KLIK MOUSE / SENTUH LAYAR",
    engine: "DYNAMIC BIOME FLYER",
    controlsList: [
      { key: "SPASI / KLIK", desc: "Mengepakkan sayap untuk melompat ke atas" },
      { key: "TOMBOL SHIFT", desc: "Mengaktifkan Energy Shield darurat (menembus 1 pilar)" },
      { key: "SENTUH LAYAR", desc: "Ketuk layar ponsel untuk melompat" }
    ],
    tips: [
      "Mekanik GRAZE: Sengaja menyerempet pilar tipis-tipis tanpa menabrak akan memberi skor bonus ganda!",
      "Saat mencapai skor 500, Anda akan melompat ke Warp Speed dengan perubahan warna latar bioma."
    ],
    scoreKey: "flappy_high_score"
  },
  memory: {
    title: "MEMORY MATRIX // ASAH OTAK",
    icon: "🧠",
    badge: "UJI MEMORI SPASIAL",
    difficulty: "TINGKAT KESULITAN: ⭐⭐⭐☆☆ (ASAH DAYA INGAT)",
    desc: "Latih daya konsentrasi dan ketajaman memori Anda. Perhatikan baik-baik kotak ubin neon yang berkedip menyala selama 1 detik, lalu klik kembali ubin-ubin tersebut sebelum batas waktu habis!",
    controls: "KLIK KIRI MOUSE / SENTUH UBIN",
    engine: "MATRIKS GRID ADAPTIF (3x3 - 6x6)",
    controlsList: [
      { key: "KLIK / SENTUH", desc: "Memilih ubin neon yang tadi berkedip" },
      { key: "SPASI", desc: "Memulai ronde atau mencoba kembali" }
    ],
    tips: [
      "Papan grid akan membesar secara otomatis dari 3x3, 4x4, 5x5, hingga 6x6 seiring naiknya level Anda.",
      "Durasi waktu hafalan akan semakin singkat di level tinggi; buat pola bentuk imajiner di pikiran Anda untuk mempermudah mengingat."
    ],
    scoreKey: "memory_high_score"
  }
};

let activeModalKey = 'brawl';

// Fungsi Pembuka Modal Panduan Lengkap
function openGameModal(gameKey) {
  AudioEngine.init();
  AudioEngine.playTone(850, 'sine', 0.05, 0.1);
  const data = gameData[gameKey];
  if (!data) return;

  activeModalKey = gameKey;
  document.getElementById("modalBadge").innerText = data.badge;
  document.getElementById("modalIcon").innerText = data.icon;
  document.getElementById("modalTitle").innerText = data.title;
  document.getElementById("modalDifficulty").innerText = data.difficulty;
  document.getElementById("modalDesc").innerText = data.desc;
  document.getElementById("modalControls").innerText = data.controls;
  document.getElementById("modalEngine").innerText = data.engine;

  const savedScore = localStorage.getItem(data.scoreKey) || 0;
  document.getElementById("modalHighScore").innerText = savedScore + " POIN";

  // Render Tabel Kontrol
  const tableContainer = document.getElementById("modalControlsTable");
  tableContainer.innerHTML = data.controlsList.map(item => `
    <div class="control-row">
      <span class="control-key">${item.key}</span>
      <span class="control-desc">${item.desc}</span>
    </div>
  `).join("");

  // Render Tips
  const tipsContainer = document.getElementById("modalTipsBox");
  tipsContainer.innerHTML = `<ul>${data.tips.map(t => `<li>${t}</li>`).join("")}</ul>`;

  // Tombol Main di Modal
  document.getElementById("modalDeployBtn").onclick = () => launchGame(gameKey);

  document.getElementById("gameModal").classList.add("active");
}

function closeGameModal() {
  const modal = document.getElementById("gameModal");
  if (modal) modal.classList.remove("active");
}

// Fungsi Filter Kategori
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

// Fungsi Pencarian Game
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

// Peluncuran Game
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
    brawl: "⚔️ CYBERBRAWL 2D (TACTICAL SPEC-OPS)",
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
  } else {
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

// Inisialisasi Jam & Efek 3D Card Hover Langsung
function initializeLobbySystem() {
  // Update Jam WIB Realtime
  setInterval(() => {
    const now = new Date();
    const clockEl = document.getElementById("hudClock");
    if (clockEl) {
      clockEl.innerText = now.toLocaleTimeString('id-ID') + " WIB";
    }
  }, 1000);

  // 3D Tilt Effect pada Kartu
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

// Jalankan Inisialisasi Tanpa Menunggu
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