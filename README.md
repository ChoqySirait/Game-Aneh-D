# 🎮 Arcade Hub HD - Web Mini Games Portal

Proyek portal web mini-game interaktif berbasis **HTML5 Canvas**, **CSS3**, dan **Vanilla JavaScript (ES6)**. Proyek ini dirancang tanpa memerlukan *framework* atau *library* luar, menyajikan grafik bergaya HD/Neon, serta pemisahan struktur kode modular yang bersih.

![Arcade Hub Banner](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

---

## 🕹️ Game yang Tersedia

### 1. 🦅 Flappy Eagle HD
Pengembangan ulang game klasik Flappy Bird dengan aset karakter Elang HD beranimasi.
* **Fitur Utama:** Mekanik gravitasi, penambahan rintangan pipa dinamis, serta kekuatan khusus **Energy Shield** (Shift) untuk menembus rintangan.
* **Kontrol:** `SPASI` untuk melompat, `SHIFT` untuk mengaktifkan perisai.

### 2. 🐍 Cyber Snake
Game Ular klasik yang dikemas dengan nuansa *Cyberpunk Neon*.
* **Fitur Utama:** Efek pencahayaan *neon glow*, *glowing food orb*, serta grid Sci-Fi.
* **Kontrol:** `Tombol Panah` (Up, Down, Left, Right) untuk mengendalikan arah ular.

### 3. 🧠 Memory Matrix (Brain Gym)
Game pengasah memori spasial dan fokus otak.
* **Fitur Utama:** Fase hafalan pola ubin menyala, peningkatan level dinamis, serta sistem nyawa (*lives*).
* **Kontrol:** `Klik Kiri Mouse` untuk memilih ubin.

---

## 📁 Struktur Proyek

```text
Arcade-Game-Hub/
│
├── index.html         # Struktur UI Utama Portal
├── style.css          # Styling Visual, Layout Glassmorphism & Neon
├── README.md          # Dokumentasi Proyek
│
└── js/
    ├── main.js        # Engine Switcher & Promise Asset Loader
    ├── flappy.js      # Logika & Rendering Flappy Eagle
    ├── snake.js       # Logika & Rendering Cyber Snake
    └── memory.js     # Logika & Rendering Memory Matrix