const MemoryGame = {
  instruction: "Hafalkan ubin menyala, lalu <b>Ketuk</b> urutannya sebelum waktu habis!",
  state: {},

  init() {
    this.state = {
      gridSize: 4, activeTiles: [], selectedTiles: [],
      phase: 'SHOW', showTimer: 1.4, level: 1, lives: 3, score: 0
    };
    this.startLevel();
  },

  startLevel() {
    const s = this.state;
    s.phase = 'SHOW';
    
    // Waktu memori berkurang drastis seiring naiknya level (semakin cepat)
    s.showTimer = Math.max(0.35, 1.4 - (s.level - 1) * 0.1);
    s.activeTiles = [];
    s.selectedTiles = [];

    const total = s.gridSize * s.gridSize;
    // Jumlah ubin bertambah banyak tiap level
    const target = Math.min(3 + s.level, 13);
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
    if (s.phase === 'GAMEOVER') {
      this.init();
      return;
    }
    if (s.phase !== 'GUESS') return;

    const pad = 40;
    const boardSize = canvas.width - (pad * 2);
    const tileSize = boardSize / s.gridSize;
    const startY = (canvas.height - boardSize) / 2;

    const c = Math.floor((x - pad) / tileSize);
    const r = Math.floor((y - startY) / tileSize);

    if (c >= 0 && c < s.gridSize && r >= 0 && r < s.gridSize) {
      const idx = r * s.gridSize + c;
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
          FX.spawnParticles(x, y, "#ffaa00", 14, 6);

          if (hitIdx === s.activeTiles.length) {
            const reward = 50 * s.level;
            s.score += reward;
            s.level++;
            FX.spawnText(canvas.width / 2 - 80, canvas.height / 2, `SPEED UP! +${reward}`, "#ffea00");
            setTimeout(() => this.startLevel(), 500);
          }
        }
      }
    }
  },

  render(ctx) {
    const s = this.state;
    
    // Background Dark Violet Cyber
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, "#080014");
    bgGrad.addColorStop(1, "#190033");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pad = 40;
    const boardSize = canvas.width - (pad * 2);
    const tileSize = boardSize / s.gridSize;
    const startY = (canvas.height - boardSize) / 2;

    for (let r = 0; r < s.gridSize; r++) {
      for (let c = 0; c < s.gridSize; c++) {
        const idx = r * s.gridSize + c;
        const x = pad + c * tileSize;
        const y = startY + r * tileSize;
        const isActive = s.activeTiles.includes(idx);
        const isSelected = s.selectedTiles.includes(idx);

        ctx.save();
        if (s.phase === 'SHOW' && isActive) {
          // Warna Flash Baru: Amber Gold Glow
          ctx.shadowBlur = 35;
          ctx.shadowColor = "#ffea00";
          ctx.fillStyle = "#ffea00";
        } else if (s.phase === 'GUESS' && isSelected) {
          const ok = isActive;
          ctx.shadowBlur = 25;
          ctx.shadowColor = ok ? "#00e676" : "#ff0055";
          ctx.fillStyle = ok ? "#00e676" : "#ff0055";
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
        }
        ctx.fillRect(x + 5, y + 5, tileSize - 10, tileSize - 10);
        ctx.restore();
      }
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px 'Orbitron', monospace";
    ctx.fillText("Level: " + s.level, 40, 80);
    ctx.fillText("Skor: " + s.score, 40, 130);

    ctx.fillStyle = "#ff0055";
    ctx.fillText("❤️ ".repeat(Math.max(0, s.lives)), canvas.width - 200, 80);

    ctx.fillStyle = s.phase === 'SHOW' ? "#ffea00" : "#00f2fe";
    ctx.font = "bold 24px 'Rajdhani', sans-serif";
    ctx.fillText(s.phase === 'SHOW' ? `KILAT MEMORI (${s.showTimer.toFixed(2)}s)` : "KETUK POLANYA!", 40, startY - 25);

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