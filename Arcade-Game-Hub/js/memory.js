const MemoryGame = {
  instruction: "Perhatikan ubin bercahaya, lalu <b>Ketuk/Klik</b> ubin yang sama persis!",
  state: {},

  init() {
    this.state = {
      gridSize: 4, activeTiles: [], selectedTiles: [],
      phase: 'SHOW', showTimer: 1.5, level: 1, lives: 3, score: 0
    };
    this.startLevel();
  },

  startLevel() {
    const s = this.state;
    s.phase = 'SHOW';
    s.showTimer = Math.max(0.8, 1.6 - s.level * 0.05); // Semakin tinggi level, semakin cepat
    s.activeTiles = [];
    s.selectedTiles = [];

    const totalTiles = s.gridSize * s.gridSize;
    const targetCount = Math.min(3 + s.level, 11);

    while (s.activeTiles.length < targetCount) {
      const rand = Math.floor(Math.random() * totalTiles);
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

    const padding = 40;
    const boardSize = canvas.width - (padding * 2);
    const tileSize = boardSize / s.gridSize;
    const startY = (canvas.height - boardSize) / 2;

    const col = Math.floor((x - padding) / tileSize);
    const row = Math.floor((y - startY) / tileSize);

    if (col >= 0 && col < s.gridSize && row >= 0 && row < s.gridSize) {
      const index = row * s.gridSize + col;
      if (!s.selectedTiles.includes(index)) {
        s.selectedTiles.push(index);
        AudioEngine.play('tile');
        FX.spawnParticles(x, y, "#00f2fe", 12, 5);

        if (!s.activeTiles.includes(index)) {
          // Pilihan Salah
          s.lives--;
          AudioEngine.play('hit');
          FX.triggerShake(10, 8);
          FX.spawnText(x, y, "MISS!", "#ff1744");

          if (s.lives <= 0) {
            s.phase = 'GAMEOVER';
          }
        } else {
          // Pilihan Benar
          const correctCount = s.selectedTiles.filter(t => s.activeTiles.includes(t)).length;
          if (correctCount === s.activeTiles.length) {
            const bonus = 50 * s.level;
            s.score += bonus;
            s.level++;
            AudioEngine.play('score');
            FX.spawnText(canvas.width / 2 - 60, canvas.height / 2, `PERFECT! +${bonus}`, "#00e676");
            setTimeout(() => this.startLevel(), 600);
          }
        }
      }
    }
  },

  render(ctx) {
    const s = this.state;
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, "#100028");
    bgGrad.addColorStop(1, "#26004d");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const padding = 40;
    const boardSize = canvas.width - (padding * 2);
    const tileSize = boardSize / s.gridSize;
    const startY = (canvas.height - boardSize) / 2;

    for (let r = 0; r < s.gridSize; r++) {
      for (let c = 0; c < s.gridSize; c++) {
        const index = r * s.gridSize + c;
        const x = padding + c * tileSize;
        const y = startY + r * tileSize;

        const isActive = s.activeTiles.includes(index);
        const isSelected = s.selectedTiles.includes(index);

        ctx.save();
        if (s.phase === 'SHOW' && isActive) {
          ctx.shadowBlur = 35;
          ctx.shadowColor = "#00f2fe";
          ctx.fillStyle = "#00f2fe";
        } else if (s.phase === 'GUESS' && isSelected) {
          if (isActive) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#00e676";
            ctx.fillStyle = "#00e676";
          } else {
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#ff1744";
            ctx.fillStyle = "#ff1744";
          }
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        }

        ctx.fillRect(x + 6, y + 6, tileSize - 12, tileSize - 12);
        ctx.restore();
      }
    }

    // Skor, Level, & Nyawa
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText("Level: " + s.level, 40, 80);
    ctx.fillText("Skor: " + s.score, 40, 130);

    ctx.fillStyle = "#ff1744";
    ctx.fillText("❤️ ".repeat(Math.max(0, s.lives)), canvas.width - 190, 80);

    ctx.fillStyle = s.phase === 'SHOW' ? "#00f2fe" : "#ffeb3b";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(s.phase === 'SHOW' ? "HAFALKAN POLANYA!" : "KETUK UBIN KEMBALI!", 40, startY - 30);

    if (s.phase === 'GAMEOVER') {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff1744";
      ctx.font = "bold 58px sans-serif";
      ctx.fillText("GAME OVER", 185, 500);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px sans-serif";
      ctx.fillText("Tekan SPASI / Ketuk untuk restart", 170, 570);
    }
  }
};

registerScene('memory', MemoryGame);