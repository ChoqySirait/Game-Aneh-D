const SnakeGame = {
  instruction: "Kendali: <b>WASD / IJKL / Panah</b> | Slow-Motion: <b>B / Tap 2x</b>",
  gridSize: 40,
  state: {},

  dragonTiers: [
    { scoreReq: 0, name: "CYBER SNAKE", head: "#00f2fe", body1: "#0072ff", body2: "#0051b3", horn: null },
    { scoreReq: 200, name: "BRONZE WYRM (TIER 1)", head: "#ff7700", body1: "#cc5500", body2: "#993d00", horn: "#ffaa00" },
    { scoreReq: 500, name: "CRIMSON DRAKE (TIER 2)", head: "#ff1744", body1: "#d50000", body2: "#9b0000", horn: "#ffeb3b" },
    { scoreReq: 1000, name: "JADE SERPENT (TIER 3)", head: "#00e676", body1: "#00b248", body2: "#007e33", horn: "#69f0ae" },
    { scoreReq: 1800, name: "GOLDEN IMPERIAL (TIER 4)", head: "#ffd700", body1: "#ffaa00", body2: "#cc8800", horn: "#ffffff" },
    { scoreReq: 2600, name: "AMETHYST WYVERN (TIER 5)", head: "#d500f9", body1: "#aa00ff", body2: "#7200ca", horn: "#00f2fe" },
    { scoreReq: 3400, name: "SOLAR FLARE (TIER 6)", head: "#ffea00", body1: "#ff9100", body2: "#ff3d00", horn: "#ffffff" },
    { scoreReq: 4200, name: "VOID LEVIATHAN (TIER 7)", head: "#ff007f", body1: "#240046", body2: "#10002b", horn: "#ff0055" },
    { scoreReq: 5000, name: "OUROBOROS GOD (TIER 8)", head: "#ffffff", body1: "#00f2fe", body2: "#ff007f", horn: "#ffeb3b" }
  ],

  init() {
    const savedHighScore = localStorage.getItem("snake_high_score") || 0;
    this.state = {
      snake: [{ x: 8, y: 12 }, { x: 7, y: 12 }, { x: 6, y: 12 }],
      dx: 1, dy: 0,
      inputQueue: [],
      food: { x: 12, y: 12 },
      score: 0, highScore: parseInt(savedHighScore),
      isGameOver: false, isStarted: false,
      stepTimer: 0, baseSpeed: 0.11,
      bulletTimeActive: false, bulletTimeLeft: 0, bulletTimeCooldown: 0,
      currentTier: 0
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

    for (let i = this.dragonTiers.length - 1; i >= 0; i--) {
      if (s.score >= this.dragonTiers[i].scoreReq) {
        if (s.currentTier !== i) {
          s.currentTier = i;
          AudioEngine.playTone(200 + i * 50, 'sawtooth', 0.5, 0.25);
          FX.triggerShake(16, 12);
          FX.spawnText(canvas.width / 2 - 130, canvas.height / 2, `EVOLVED: ${this.dragonTiers[i].name}!`, this.dragonTiers[i].head);
        }
        break;
      }
    }

    if (s.bulletTimeActive) {
      s.bulletTimeLeft -= dt;
      if (s.bulletTimeLeft <= 0) s.bulletTimeActive = false;
    } else if (s.bulletTimeCooldown > 0) {
      s.bulletTimeCooldown -= dt;
    }

    let interval = Math.max(0.06, s.baseSpeed - Math.floor(s.score / 200) * 0.005);
    if (s.bulletTimeActive) interval *= 2.4;

    s.stepTimer += dt;
    if (s.stepTimer < interval) return;
    s.stepTimer = 0;

    if (s.inputQueue.length > 0) {
      const nextDir = s.inputQueue.shift();
      if (!(nextDir.x === -s.dx && nextDir.y === 0) && !(nextDir.y === -s.dy && nextDir.x === 0)) {
        s.dx = nextDir.x;
        s.dy = nextDir.y;
      }
    }

    const head = { x: s.snake[0].x + s.dx, y: s.snake[0].y + s.dy };
    const cols = Math.floor(canvas.width / this.gridSize);
    const rows = Math.floor(canvas.height / this.gridSize);

    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows ||
        s.snake.some(p => p.x === head.x && p.y === head.y)) {
      this.gameOver();
      return;
    }

    s.snake.unshift(head);

    if (s.currentTier > 0) {
      FX.spawnParticles(head.x * this.gridSize + 20, head.y * this.gridSize + 20, this.dragonTiers[s.currentTier].head, 1, 1.5);
    }

    if (head.x === s.food.x && head.y === s.food.y) {
      const pointEarned = 10 + s.currentTier * 5;
      s.score += pointEarned;

      AudioEngine.playArpeggio(s.currentTier + 1);
      FX.triggerShake(4, 4);
      FX.spawnParticles(
        s.food.x * this.gridSize + this.gridSize / 2,
        s.food.y * this.gridSize + this.gridSize / 2,
        this.dragonTiers[s.currentTier].head, 16, 6
      );
      FX.spawnText(s.food.x * this.gridSize, s.food.y * this.gridSize, `+${pointEarned}`, this.dragonTiers[s.currentTier].head);

      if (s.score > s.highScore) {
        s.highScore = s.score;
        localStorage.setItem("snake_high_score", s.highScore);
      }
      this.spawnFood();
    } else {
      s.snake.pop();
    }
  },

  queueMove(x, y) {
    if (!this.state.isStarted) this.state.isStarted = true;
    if (this.state.inputQueue.length < 2) {
      this.state.inputQueue.push({ x, y });
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
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === "Space") {
      if (!s.isStarted) s.isStarted = true;
      else if (s.isGameOver) this.init();
      return;
    }

    if (e.code === "KeyB") this.triggerBulletTime();

    if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "KeyI") this.queueMove(0, -1);
    if (e.code === "ArrowDown" || e.code === "KeyS" || e.code === "KeyK") this.queueMove(0, 1);
    if (e.code === "ArrowLeft" || e.code === "KeyA" || e.code === "KeyJ") this.queueMove(-1, 0);
    if (e.code === "ArrowRight" || e.code === "KeyD" || e.code === "KeyL") this.queueMove(1, 0);
  },

  onPointerDown(x, y) {
    if (!this.state.isStarted) this.state.isStarted = true;
    else if (this.state.isGameOver) this.init();
    else this.triggerBulletTime();
  },

  render(ctx) {
    const s = this.state;
    const tier = this.dragonTiers[s.currentTier];

    ctx.fillStyle = s.bulletTimeActive ? "#020713" : "#04060d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(0, 242, 254, 0.04)";
    for (let x = 0; x < canvas.width; x += this.gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += this.gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const fx = s.food.x * this.gridSize + this.gridSize / 2;
    const fy = s.food.y * this.gridSize + this.gridSize / 2;
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = tier.head;
    ctx.fillStyle = tier.head;
    ctx.beginPath();
    ctx.arc(fx, fy, this.gridSize / 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (let i = 0; i < s.snake.length; i++) {
      const p = s.snake[i];
      const px = p.x * this.gridSize;
      const py = p.y * this.gridSize;

      ctx.save();
      if (i === 0) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = tier.head;
        ctx.fillStyle = tier.head;
        ctx.fillRect(px + 2, py + 2, this.gridSize - 4, this.gridSize - 4);

        if (tier.horn) {
          ctx.fillStyle = tier.horn;
          ctx.beginPath();
          ctx.moveTo(px + 6, py + 4);
          ctx.lineTo(px - 6, py - 10);
          ctx.lineTo(px + 14, py + 2);
          ctx.moveTo(px + this.gridSize - 6, py + 4);
          ctx.lineTo(px + this.gridSize + 6, py - 10);
          ctx.lineTo(px + this.gridSize - 14, py + 2);
          ctx.fill();
        }

        ctx.fillStyle = s.currentTier >= 7 ? "#ffffff" : "#ffff00";
        ctx.fillRect(px + 8, py + 12, 6, 6);
        ctx.fillRect(px + this.gridSize - 14, py + 12, 6, 6);
      } else {
        ctx.shadowBlur = 8;
        ctx.shadowColor = tier.body1;
        ctx.fillStyle = (i % 2 === 0) ? tier.body1 : tier.body2;
        ctx.fillRect(px + 3, py + 3, this.gridSize - 6, this.gridSize - 6);
      }
      ctx.restore();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px 'Orbitron', monospace";
    ctx.fillText("Skor: " + s.score, 35, 65);

    ctx.fillStyle = tier.head;
    ctx.font = "bold 20px 'Rajdhani', sans-serif";
    ctx.fillText(tier.name, 35, 100);

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
      ctx.fillText("Tekan WASD / Panah / Spasi", 185, 540);
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