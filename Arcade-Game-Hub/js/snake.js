const SnakeGame = {
  instruction: "Kendali: <b>Panah</b> | Slow-Motion: <b>B / Klik 2x</b> | Evolusi Naga: <b>100 Skor</b>",
  gridSize: 40,
  state: {},

  init() {
    const savedHighScore = localStorage.getItem("snake_high_score") || 0;
    this.state = {
      snake: [{ x: 8, y: 12 }, { x: 7, y: 12 }, { x: 6, y: 12 }],
      dx: 1, dy: 0, nextDx: 1, nextDy: 0,
      food: { x: 12, y: 12 },
      score: 0, highScore: parseInt(savedHighScore),
      isGameOver: false, isStarted: false,
      stepTimer: 0, baseSpeed: 0.12,
      bulletTimeActive: false, bulletTimeLeft: 0, bulletTimeCooldown: 0,
      combo: 0,
      hasEvolved: false
    };
    this.spawnFood();
  },

  spawnFood() {
    const cols = Math.floor(canvas.width / this.gridSize);
    const rows = Math.floor(canvas.height / this.gridSize);
    let valid = false;
    while (!valid) {
      this.state.food = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
      };
      valid = !this.state.snake.some(p => p.x === this.state.food.x && p.y === this.state.food.y);
    }
  },

  update(dt) {
    const s = this.state;
    if (!s.isStarted || s.isGameOver) return;

    // Cek Transformasi Naga
    if (s.score >= 100 && !s.hasEvolved) {
      s.hasEvolved = true;
      AudioEngine.playTone(180, 'sawtooth', 0.8, 0.3);
      FX.triggerShake(20, 15);
      FX.spawnText(canvas.width / 2 - 140, canvas.height / 2, "DRAGON AWAKENED!", "#ff1744");
      FX.spawnParticles(canvas.width / 2, canvas.height / 2, "#ff1744", 40, 10);
    }

    if (s.bulletTimeActive) {
      s.bulletTimeLeft -= dt;
      if (s.bulletTimeLeft <= 0) s.bulletTimeActive = false;
    } else if (s.bulletTimeCooldown > 0) {
      s.bulletTimeCooldown -= dt;
    }

    let interval = Math.max(0.06, s.baseSpeed - Math.floor(s.score / 50) * 0.01);
    if (s.bulletTimeActive) interval *= 2.5;

    s.stepTimer += dt;
    if (s.stepTimer < interval) return;
    s.stepTimer = 0;

    s.dx = s.nextDx;
    s.dy = s.nextDy;
    const head = { x: s.snake[0].x + s.dx, y: s.snake[0].y + s.dy };
    const cols = Math.floor(canvas.width / this.gridSize);
    const rows = Math.floor(canvas.height / this.gridSize);

    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows ||
        s.snake.some(p => p.x === head.x && p.y === head.y)) {
      this.gameOver();
      return;
    }

    s.snake.unshift(head);

    // Efek Jejak Naga
    if (s.hasEvolved) {
      FX.spawnParticles(head.x * this.gridSize + 20, head.y * this.gridSize + 20, "#ff1744", 2, 2);
    }

    if (head.x === s.food.x && head.y === s.food.y) {
      s.score += 10;
      s.combo++;
      AudioEngine.playArpeggio(s.combo);
      FX.triggerShake(4, 4);
      FX.spawnParticles(
        s.food.x * this.gridSize + this.gridSize / 2,
        s.food.y * this.gridSize + this.gridSize / 2,
        s.hasEvolved ? "#ff1744" : "#ff007f", 18, 6
      );
      FX.spawnText(s.food.x * this.gridSize, s.food.y * this.gridSize, "+10", s.hasEvolved ? "#ff1744" : "#00f2fe");

      if (s.score > s.highScore) {
        s.highScore = s.score;
        localStorage.setItem("snake_high_score", s.highScore);
      }
      this.spawnFood();
    } else {
      s.snake.pop();
    }
  },

  triggerBulletTime() {
    const s = this.state;
    if (s.isStarted && !s.isGameOver && !s.bulletTimeActive && s.bulletTimeCooldown <= 0) {
      s.bulletTimeActive = true;
      s.bulletTimeLeft = 2.5;
      s.bulletTimeCooldown = 6.0;
      AudioEngine.play('slowmo');
      FX.triggerShake(6, 6);
    }
  },

  gameOver() {
    this.state.isGameOver = true;
    AudioEngine.play('hit');
    FX.triggerShake(18, 12);
  },

  onKeyDown(e) {
    const s = this.state;
    if (e.code === "Space") {
      if (!s.isStarted) s.isStarted = true;
      else if (s.isGameOver) this.init();
      return;
    }
    if (e.code === "KeyB") this.triggerBulletTime();
    if (e.code === "ArrowUp" && s.dy === 0) { s.nextDx = 0; s.nextDy = -1; s.isStarted = true; }
    if (e.code === "ArrowDown" && s.dy === 0) { s.nextDx = 0; s.nextDy = 1; s.isStarted = true; }
    if (e.code === "ArrowLeft" && s.dx === 0) { s.nextDx = -1; s.nextDy = 0; s.isStarted = true; }
    if (e.code === "ArrowRight" && s.dx === 0) { s.nextDx = 1; s.nextDy = 0; s.isStarted = true; }
  },

  onPointerDown(x, y) {
    if (!this.state.isStarted) this.state.isStarted = true;
    else if (this.state.isGameOver) this.init();
    else this.triggerBulletTime();
  },

  render(ctx) {
    const s = this.state;
    ctx.fillStyle = s.hasEvolved ? "#140205" : (s.bulletTimeActive ? "#020713" : "#04060d");
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid Cyber
    ctx.strokeStyle = s.hasEvolved ? "rgba(255, 23, 68, 0.08)" : "rgba(0, 242, 254, 0.05)";
    for (let x = 0; x < canvas.width; x += this.gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += this.gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Makanan / Dragon Pearl
    const fx = s.food.x * this.gridSize + this.gridSize / 2;
    const fy = s.food.y * this.gridSize + this.gridSize / 2;
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = s.hasEvolved ? "#ffeb3b" : "#ff007f";
    ctx.fillStyle = s.hasEvolved ? "#ffeb3b" : "#ff007f";
    ctx.beginPath();
    ctx.arc(fx, fy, this.gridSize / 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // RENDER BADAN & KEPALA NAGA
    for (let i = 0; i < s.snake.length; i++) {
      const p = s.snake[i];
      const px = p.x * this.gridSize;
      const py = p.y * this.gridSize;

      ctx.save();
      if (i === 0) {
        if (s.hasEvolved) {
          // --- KEPALA NAGA BERTANDUK EMAS ---
          ctx.shadowBlur = 30;
          ctx.shadowColor = "#ff1744";
          ctx.fillStyle = "#ff1744";
          ctx.fillRect(px + 2, py + 2, this.gridSize - 4, this.gridSize - 4);

          // Tanduk Naga Emas
          ctx.fillStyle = "#ffc107";
          ctx.beginPath();
          ctx.moveTo(px + 8, py + 4);
          ctx.lineTo(px - 4, py - 8);
          ctx.lineTo(px + 14, py + 2);
          ctx.moveTo(px + this.gridSize - 8, py + 4);
          ctx.lineTo(px + this.gridSize + 4, py - 8);
          ctx.lineTo(px + this.gridSize - 14, py + 2);
          ctx.fill();

          // Mata Naga Menyala
          ctx.fillStyle = "#ffff00";
          ctx.fillRect(px + 8, py + 12, 6, 6);
          ctx.fillRect(px + this.gridSize - 14, py + 12, 6, 6);
        } else {
          // Ular Biasa Cyan
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#00f2fe";
          ctx.fillStyle = "#00f2fe";
          ctx.fillRect(px + 2, py + 2, this.gridSize - 4, this.gridSize - 4);
        }
      } else {
        // Badan Ular / Sisik Naga
        if (s.hasEvolved) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#ff1744";
          ctx.fillStyle = (i % 2 === 0) ? "#b71c1c" : "#d50000"; // Sisik api belang
        } else {
          ctx.fillStyle = "#0072ff";
        }
        ctx.fillRect(px + 3, py + 3, this.gridSize - 6, this.gridSize - 6);
      }
      ctx.restore();
    }

    // HUD Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px 'Orbitron', monospace";
    ctx.fillText("Skor: " + s.score, 35, 65);

    ctx.fillStyle = s.hasEvolved ? "#ff1744" : "#ffc107";
    ctx.font = "bold 20px 'Rajdhani', sans-serif";
    ctx.fillText(s.hasEvolved ? "🔥 WUJUD: NAGA CRIMSON" : "BENTUK: CYBER SNAKE", 35, 100);

    if (s.bulletTimeActive) {
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText(`⌛ SLOW-MO: ${s.bulletTimeLeft.toFixed(1)}s`, 35, 135);
    } else if (s.bulletTimeCooldown > 0) {
      ctx.fillStyle = "#798da3";
      ctx.fillText(`Slow-Mo Cooldown: ${Math.ceil(s.bulletTimeCooldown)}s`, 35, 135);
    } else {
      ctx.fillStyle = "#00e676";
      ctx.fillText("⚡ Slow-Mo READY (B)", 35, 135);
    }

    if (!s.isStarted) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00f2fe";
      ctx.font = "bold 48px 'Orbitron', monospace";
      ctx.fillText("CYBER SNAKE", 160, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText("Tekan SPASI / Ketuk Layar", 200, 540);
    } else if (s.isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff1744";
      ctx.font = "bold 56px 'Orbitron', monospace";
      ctx.fillText("GAME OVER", 175, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px 'Rajdhani', sans-serif";
      ctx.fillText("Skor Akhir: " + s.score, 260, 540);
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText("Tekan SPASI untuk Restart", 210, 600);
    }
  }
};

registerScene('snake', SnakeGame);