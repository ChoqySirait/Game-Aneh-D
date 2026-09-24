const MemoryGame = {
  instruction: "Hafalkan ubin menyala, lalu <b>Ketuk</b> sebelum waktu habis!",
  state: {},

  themes: [
    { minScore: 0, size: 3, glow: "#00f2fe", bg: ["#050e1a", "#0d223a"] },
    { minScore: 150, size: 4, glow: "#ffea00", bg: ["#141000", "#332600"] },
    { minScore: 400, size: 5, glow: "#00ff66", bg: ["#021408", "#083a17"] },
    { minScore: 800, size: 6, glow: "#ff007f", bg: ["#1a0010", "#3d0027"] }
  ],

  init() {
    this.state = {
      activeTiles: [], selectedTiles: [],
      phase: 'SHOW', showTimer: 1.4, level: 1, lives: 3, score: 0
    };
    this.startLevel();
  },

  getCurrentTheme() {
    for (let i = this.themes.length - 1; i >= 0; i--) {
      if (this.state.score >= this.themes[i].minScore) return this.themes[i];
    }
    return this.themes[0];
  },

  startLevel() {
    const s = this.state;
    const theme = this.getCurrentTheme();
    s.phase = 'SHOW';
    
    s.showTimer = Math.max(0.35, 1.4 - (s.level - 1) * 0.08);
    s.activeTiles = [];
    s.selectedTiles = [];

    const total = theme.size * theme.size;
    const target = Math.min(3 + s.level, Math.floor(total * 0.55));
    while (s.activeTiles.length < target) {
      const rand = Math.floor(Math.random() * total);
      if (!s.activeTiles.includes(rand)) s.activeTiles.push(rand);
    }
  },

  update(dt) {
    const s = this.state;
    if (s.phase === 'SHOW') {
      s.showTimer -= dt;
      if (s.showTimer <= 0) s.phase = 'GUESS';
    }
  },

  onKeyDown(e) {
    if (e.code === "Space" && this.state.phase === 'GAMEOVER') {
      this.init();
    }
  },

  onPointerDown(x, y) {
    const s = this.state;
    const theme = this.getCurrentTheme();
    if (s.phase === 'GAMEOVER') {
      this.init();
      return;
    }
    if (s.phase !== 'GUESS') return;

    const pad = 36;
    const boardSize = canvas.width - (pad * 2);
    const tileSize = boardSize / theme.size;
    const startY = (canvas.height - boardSize) / 2;

    const c = Math.floor((x - pad) / tileSize);
    const r = Math.floor((y - startY) / tileSize);

    if (c >= 0 && c < theme.size && r >= 0 && r < theme.size) {
      const idx = r * theme.size + c;
      if (!s.selectedTiles.includes(idx)) {
        s.selectedTiles.push(idx);

        if (!s.activeTiles.includes(idx)) {
          s.lives--;
          AudioEngine.play('hit');
          FX.triggerShake(14, 8);
          FX.spawnText(x, y, "MISS!", "#ff0055");
          if (s.lives <= 0) s.phase = 'GAMEOVER';
        } else {
          const hitIdx = s.selectedTiles.filter(t => s.activeTiles.includes(t)).length;
          AudioEngine.playArpeggio(hitIdx);
          FX.spawnParticles(x, y, theme.glow, 14, 5);

          if (hitIdx === s.activeTiles.length) {
            const reward = 30 + s.level * 10;
            s.score += reward;
            s.level++;
            FX.spawnText(canvas.width / 2 - 80, canvas.height / 2, `GRID CLEAR! +${reward}`, theme.glow);
            setTimeout(() => this.startLevel(), 500);
          }
        }
      }
    }
  },

  render(ctx) {
    const s = this.state;
    const theme = this.getCurrentTheme();

    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, theme.bg[0]);
    bgGrad.addColorStop(1, theme.bg[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pad = 36;
    const boardSize = canvas.width - (pad * 2);
    const tileSize = boardSize / theme.size;
    const startY = (canvas.height - boardSize) / 2;

    for (let r = 0; r < theme.size; r++) {
      for (let c = 0; c < theme.size; c++) {
        const idx = r * theme.size + c;
        const x = pad + c * tileSize;
        const y = startY + r * tileSize;
        const isActive = s.activeTiles.includes(idx);
        const isSelected = s.selectedTiles.includes(idx);

        ctx.save();
        if (s.phase === 'SHOW' && isActive) {
          ctx.shadowBlur = 30;
          ctx.shadowColor = theme.glow;
          ctx.fillStyle = theme.glow;
        } else if (s.phase === 'GUESS' && isSelected) {
          const ok = isActive;
          ctx.shadowBlur = 25;
          ctx.shadowColor = ok ? "#00e676" : "#ff0055";
          ctx.fillStyle = ok ? "#00e676" : "#ff0055";
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
        }
        ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);
        ctx.restore();
      }
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px 'Orbitron', monospace";
    ctx.fillText("Skor: " + s.score, 40, 80);

    ctx.fillStyle = theme.glow;
    ctx.font = "bold 20px 'Rajdhani', sans-serif";
    ctx.fillText(`GRID: ${theme.size}x${theme.size} | LEVEL: ${s.level}`, 40, 115);

    ctx.fillStyle = "#ff0055";
    ctx.fillText("❤️ ".repeat(Math.max(0, s.lives)), canvas.width - 200, 80);

    ctx.fillStyle = s.phase === 'SHOW' ? theme.glow : "#ffffff";
    ctx.font = "bold 24px 'Rajdhani', sans-serif";
    ctx.fillText(s.phase === 'SHOW' ? `HAFALKAN KILAT (${s.showTimer.toFixed(2)}s)` : "TEBAK POLA SEKARANG!", 40, startY - 20);

    if (s.phase === 'GAMEOVER') {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff0055";
      ctx.font = "bold 56px 'Orbitron', monospace";
      ctx.fillText("GAME OVER", 175, 500);
      ctx.fillStyle = "#ffffff";
      ctx.font = "26px 'Rajdhani', sans-serif";
      ctx.fillText("Tekan SPASI / Ketuk untuk Restart", 170, 560);
    }
  }
};

registerScene('memory', MemoryGame);