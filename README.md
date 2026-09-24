# ⚡ NeonPulse Arcade // Web Micro-Games Engine

[![HTML5 Canvas](https://img.shields.io/badge/Render-HTML5%20Canvas%202D-00f2fe?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Vanilla JS](https://img.shields.io/badge/Language-Vanilla%20ES6+-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)
[![Web Audio API](https://img.shields.io/badge/Audio-Procedural%20Synth%20(No%20MP3)-ff007f?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Zero Dependency](https://img.shields.io/badge/Dependencies-ZERO%20(Lightweight)-00e676?style=for-the-badge)](https://github.com/)

> **NeonPulse Arcade** adalah micro-game engine 2D berbasis peramban web (*browser-native*) yang dibangun menggunakan **HTML5 Canvas**, **CSS3 Glassmorphism**, dan **Vanilla JavaScript**. Proyek ini merekayasa ulang sensasi mesin dingdong retro dengan estetika visual *Cyberpunk Neon*, audio sintetis algoritmik, serta manajemen loop fisika deterministik tanpa bergantung pada pustaka (*framework/library*) pihak ketiga mana pun.

---

## 🕹️ 5 Mode Game Terintegrasi

| Game | Genre | Sorotan Mekanik Kunci | Kontrol |
| :--- | :--- | :--- | :--- |
| **🦅 Flappy Eagle** | *Endless Flyer* | • **Warp Drive** & Pergantian Bioma tiap kelipatan 500 skor<br>• Mekanik **Graze / Near-Miss** bonus menyerempet pipa<br>• Energy Shield pertahanan | `SPASI` / Klik Layar (Lompat)<br>`SHIFT` (Perisai) |
| **🐉 Cyber Dragon** | *Snake Arena* | • **8-Tier Dragon Evolution** (hingga Ouroboros God di skor 5000)<br>• **Input Queue Buffer** (bebas jeda belok ganda / anti-lag)<br>• Time Dilation (Bullet Time / Slow-Motion) | `WASD` / `IJKL` / `Panah`<br>`B` (Slow-Mo) |
| **🧠 Memory Matrix** | *Spatial Reflex* | • **Dynamic Adaptive Grid** (membesar otomatis dari $3\times3$ hingga $6\times6$)<br>• Skema palet warna neon beradaptasi sesuai level<br>• Waktu hafalan kilat dinamis (turun hingga 0.35s) | `Klik Kiri Mouse` / `Sentuh Ubin` |
| **⚡ Beat Dash** | *3D Rhythm Highway* | • Lintasan perspektif miring **Pseudo-3D Highway**<br>• Mesin ketukan terkalibrasi **128 BPM Synthwave**<br>• Deteksi akurasi *PERFECT (+60)* dan *GREAT (+30)* | `D` - `F` - `J` - `K`<br>atau Sentuh Jalur di Layar |
| **👾 Cyber Swarm** | *Arena Survivor* | • **Auto-Aim Plasma Cannons** mengincar musuh terdekat<br>• Formasi drone pengawal yang berkembang dinamis<br>• Gelombang musuh adaptif & gelombang kejut Nova EMP | `Arahkan Mouse/Kursor`<br>`SPASI` (Nova EMP Burst) |

---

## 🛠️ Keunggulan Arsitektur Teknis (*Engineering Highlights*)

1. **Zero Asset Overhead (< 100 KB Total Size):**
   * **Tidak ada gambar raster eksternal (JPG/PNG):** Karakter elang, tanduk naga, partikel energi, hingga jalur 3D dirender murni secara prosedural menggunakan kalkulasi vektor Canvas API.
   * **Tidak ada file audio eksternal (MP3/WAV):** Seluruh efek suara—loncatan, tangga nada pentatonik arpeggio, suara desingan graze, hingga ledakan—dihasilkan secara real-time via osilator **Web Audio API**.

2. **Loop Fisika Berbasis Delta Time ($dt$):**
   * Menggunakan interpolasi delta-time (`performance.now()`) untuk memastikan kecepatan gerak karakter dan perhitungan fisika tetap identik di berbagai refresh rate layar (60Hz, 120Hz, 144Hz, hingga 240Hz).

3. **Game Feel & Visual Feedback ("Game Juice"):**
   * **Screen Shake Engine:** Layar bergetar proporsional berdasarkan intensitas benturan.
   * **Sistem Partikel Neon:** Emisi partikel dinamis dengan peluruhan transparansi (*alpha decay*).
   * **CRT Scanline & Glass Glare Filter:** Lapisan CSS murni untuk mereplikasi monitor tabung retro arcade 80-an tanpa memblokir pointer event pengguna.

4. **HUD Profiler Pengembang Bawaan:**
   * Tekan tombol **`D`** atau **`~`** saat berada di game mana pun untuk memunculkan diagnostic overlay: *FPS Counter*, *Delta Time Meter*, dan *Active Particle Counter*.

---

## 📁 Struktur Repositori

```text
NeonPulse-Arcade/
│
├── index.html          # Struktur viewport kanvas, navigasi 5 game, & terminal HUD
├── style.css           # Styling Dark Mode, efek layar CRT, & ambient glow
├── README.md           # Dokumentasi teknis proyek
│
└── js/
    ├── main.js         # Core Engine (Loop, Delta-Time, Scene Router, Web Audio, Debug HUD)
    ├── flappy.js       # Logika Flappy Eagle, biome transition, & graze detection
    ├── snake.js        # Logika Cyber Dragon, input buffer queue, & 8-tier evolution
    ├── memory.js       # Logika Memory Matrix & dynamic grid matrix expansion
    ├── rhythm.js       # Logika Beat Dash, pseudo-3D perspective projection, & BPM engine
    └── swarm.js        # Logika Cyber Swarm, drone orbit flocking, & auto-targeting arena
