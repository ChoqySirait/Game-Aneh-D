const SnakeGame = {
  instruction: "Arah: <b>Tombol Panah / Geser (Swipe)</b> | Mulai: <b>SPASI</b>",
  gridSize: 40,
  touchStartX: 0,
  touchStartY: 0,
  state: {},

  init() {
    const savedHighScore = localStorage.getItem("snake_high_score") || 0;
    this.state = {
      snake: [{ x: 8, y: 12 }, { x: 7, y: 12 }, { x: 6, y: 12 }],
      dx: 1, dy: 0, nextDx: 1, nextDy: 0,
      food: { x: 12, y: 12 },
      score: 0, highScore: parseInt(savedHighScore),
      isGameOver: false, isStarted: false,
      moveTimer: 0, baseStepInterval: 0.12,
      combo: 1, comboTimer: 0
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

    if (s.comboTimer > 0) {
      s.comboTimer -= dt;
      if (s.comboTimer <= 0) s.combo = 1;
    }

    const currentInterval = Math.max(0.06, s.baseStepInterval - Math.floor(s.score / 50) * 0.01);
    s.moveTimer += dt;
    if (s.moveTimer < currentInterval) return;
    s.moveTimer = 0;

    s.dx = s.nextDx;
    s.dy = s.nextDy;
    const head = { x: s.snake[0].x + s.dx, y: s.snake[0].y + s.dy };
    const cols = Math.floor(canvas.width / this.gridSize);
    const rows = Math.floor(canvas.height / this.gridSize);

    // Tabrak Tembok
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
      this.triggerGameOver();
      return;
    }

    // Tabrak Badan Sendiri
    if (s.snake.some(part => part.x === head.x && part.y === head.y)) {
      this.triggerGameOver();
      return;
    }

    s.snake.unshift(head);

    // Makan Makanan
    if (head.x === s.food.x && head.y === s.food.y) {
      const earned = 10 * s.combo;
      s.score += earned;
      s.combo = Math.min(4, s.combo + 1);
      s.comboTimer = 3.0; // Reset timer combo 3 detik

      AudioEngine.play('score');
      FX.triggerShake(4, 5);
      FX.spawnParticles(
        s.food.x * this.gridSize + this.gridSize / 2,
        s.food.y * this.gridSize + this.gridSize / 2,
        "#ff007f", 20, 7
      );
      FX.spawnText(
        s.food.x * this.gridSize,
        s.food.y * this.gridSize,
        s.combo > 1 ? `+${earned} (${s.combo}x)` : `+${earned}`,
        "#00f2fe"
      );

      if (s.score > s.highScore) {
        s.highScore = s.score;
        localStorage.setItem("snake_high_score", s.highScore);
      }
      this.spawnFood();
    } else {
      s.snake.pop();
    }
  },

  triggerGameOver() {
    this.state.isGameOver = true;
    AudioEngine.play('hit');
    FX.triggerShake(16, 12);
  },

  onKeyDown(e) {
    const s = this.state;
    if (e.code === "Space") {
      if (!s.isStarted) s.isStarted = true;
      else if (s.isGameOver) this.init();
      return;
    }
    if (e.code === "ArrowUp" && s.dy === 0) { s.nextDx = 0; s.nextDy = -1; s.isStarted = true; }
    if (e.code === "ArrowDown" && s.dy === 0) { s.nextDx = 0; s.nextDy = 1; s.isStarted = true; }
    if (e.code === "ArrowLeft" && s.dx === 0) { s.nextDx = -1; s.nextDy = 0; s.isStarted = true; }
    if (e.code === "ArrowRight" && s.dx === 0) { s.nextDx = 1; s.nextDy = 0; s.isStarted = true; }
  },

  onPointerDown(x, y) {
    if (!this.state.isStarted) this.state.isStarted = true;
    else if (this.state.isGameOver) this.init();
  },

  render(ctx) {
    const s = this.state;
    ctx.fillStyle = "#040711";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Garis Grid Sci-Fi Neon
    ctx.strokeStyle = "rgba(0, 242, 254, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += this.gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += this.gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Render Food Orb
    const foodX = s.food.x * this.gridSize + this.gridSize / 2;
    const foodY = s.food.y * this.gridSize + this.gridSize / 2;
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#ff007f";
    ctx.fillStyle = "#ff007f";
    ctx.beginPath();
    ctx.arc(foodX, foodY, this.gridSize / 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Render Ular dengan Gradient Kepala & Ekor
    for (let i = 0; i < s.snake.length; i++) {
      const part = s.snake[i];
      ctx.save();
      if (i === 0) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00f2fe";
        ctx.fillStyle = "#00f2fe";
      } else {
        ctx.fillStyle = "#0072ff";
      }
      ctx.fillRect(part.x * this.gridSize + 2, part.y * this.gridSize + 2, this.gridSize - 4, this.gridSize - 4);
      ctx.restore();
    }

    // Skor & Combo Bar
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText("Skor: " + s.score, 35, 65);

    ctx.fillStyle = "#ffc107";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("Rekor: " + s.highScore, 35, 105);

    if (s.combo > 1) {
      ctx.fillStyle = "#00f2fe";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(`⚡ COMBO ${s.combo}x (${s.comboTimer.toFixed(1)}s)`, 35, 145);
    }

    if (!s.isStarted) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00f2fe";
      ctx.font = "bold 50px sans-serif";
      ctx.fillText("CYBER SNAKE", 185, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "26px sans-serif";
      ctx.fillText("Tekan SPASI / Ketuk Layar", 200, 540);
    } else if (s.isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff1744";
      ctx.font = "bold 58px sans-serif";
      ctx.fillText("GAME OVER", 185, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px sans-serif";
      ctx.fillText("Skor Akhir: " + s.score, 260, 540);
      ctx.fillStyle = "#ffeb3b";
      ctx.font = "24px sans-serif";
      ctx.fillText("Tekan SPASI / Ketuk untuk restart", 175, 600);
    }
  }
};

registerScene('snake', SnakeGame);