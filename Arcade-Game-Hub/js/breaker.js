// =================================================================
// 🧱 NEON BRICK BREAKER (Arkanoid / Breakout HD)
// Features: Dynamic Vector Reflection, Destructible Bricks, Laser Paddle
// =================================================================

const BreakerGame = {
  instruction: "Geser Paddle: <b>Panah / Mouse / Geser Jari</b> | Luncurkan Bola: <b>SPASI</b>",
  state: {},

  init() {
    const savedHighScore = localStorage.getItem("breaker_high_score") || 0;
    this.state = {
      paddleWidth: 150, paddleHeight: 22,
      paddleX: canvas.width / 2 - 75,
      paddleSpeed: 700,
      
      ballRadius: 12,
      ballX: canvas.width / 2,
      ballY: canvas.height - 180,
      ballVx: 350,
      ballVy: -450,
      baseSpeed: 550,
      
      bricks: [],
      rows: 6,
      cols: 7,
      brickWidth: 88,
      brickHeight: 32,
      brickPadding: 12,
      offsetTop: 150,
      offsetLeft: 16,

      score: 0,
      highScore: parseInt(savedHighScore),
      combo: 1,
      isStarted: false,
      isGameOver: false,
      isCleared: false
    };

    this.buildBricks();
  },

  buildBricks() {
    const s = this.state;
    s.bricks = [];
    const colors = ["#ff0055", "#ff7700", "#ffea00", "#00e676", "#00f2fe", "#7928ca"];

    for (let r = 0; r < s.rows; r++) {
      for (let c = 0; c < s.cols; c++) {
        s.bricks.push({
          x: s.offsetLeft + c * (s.brickWidth + s.brickPadding),
          y: s.offsetTop + r * (s.brickHeight + s.brickPadding),
          color: colors[r % colors.length],
          status: 1
        });
      }
    }
  },

  update(dt) {
    const s = this.state;
    if (!s.isStarted || s.isGameOver || s.isCleared) return;

    // Pergerakan Bola
    s.ballX += s.ballVx * dt;
    s.ballY += s.ballVy * dt;

    // Pantulan Dinding Kiri & Kanan
    if (s.ballX - s.ballRadius <= 0) {
      s.ballX = s.ballRadius;
      s.ballVx = Math.abs(s.ballVx);
      AudioEngine.playTone(380, 'sine', 0.05, 0.1);
    } else if (s.ballX + s.ballRadius >= canvas.width) {
      s.ballX = canvas.width - s.ballRadius;
      s.ballVx = -Math.abs(s.ballVx);
      AudioEngine.playTone(380, 'sine', 0.05, 0.1);
    }

    // Pantulan Dinding Atas
    if (s.ballY - s.ballRadius <= 0) {
      s.ballY = s.ballRadius;
      s.ballVy = Math.abs(s.ballVy);
      AudioEngine.playTone(420, 'sine', 0.05, 0.1);
    }

    // Pantulan Pada Paddle (Kalkulasi Sudut Dinamis Berdasarkan Titik Benturan)
    const paddleY = canvas.height - 100;
    if (
      s.ballY + s.ballRadius >= paddleY &&
      s.ballY - s.ballRadius <= paddleY + s.paddleHeight &&
      s.ballX >= s.paddleX &&
      s.ballX <= s.paddleX + s.paddleWidth
    ) {
      // Hit point: -1 (ujung kiri) sampai +1 (ujung kanan)
      const hitPoint = (s.ballX - (s.paddleX + s.paddleWidth / 2)) / (s.paddleWidth / 2);
      const angle = hitPoint * (Math.PI / 3); // Maksimal 60 derajat

      const speed = Math.hypot(s.ballVx, s.ballVy);
      s.ballVx = speed * Math.sin(angle);
      s.ballVy = -Math.abs(speed * Math.cos(angle));

      s.combo = 1; // Reset kombo balok berturut-turut
      AudioEngine.playTone(300, 'triangle', 0.08, 0.15);
      FX.spawnParticles(s.ballX, paddleY, "#00f2fe", 8, 4);
    }

    // Tabrakan Dengan Balok (AABB Collision)
    let allDestroyed = true;
    for (let b of s.bricks) {
      if (b.status === 1) {
        allDestroyed = false;
        if (
          s.ballX + s.ballRadius > b.x &&
          s.ballX - s.ballRadius < b.x + s.brickWidth &&
          s.ballY + s.ballRadius > b.y &&
          s.ballY - s.ballRadius < b.y + s.brickHeight
        ) {
          b.status = 0;
          s.ballVy = -s.ballVy;

          const earned = 20 * s.combo;
          s.score += earned;
          AudioEngine.playArpeggio(s.combo);
          FX.triggerShake(5, 6);
          FX.spawnParticles(b.x + s.brickWidth / 2, b.y + s.brickHeight / 2, b.color, 16, 6);
          FX.spawnText(b.x, b.y, `+${earned}`, b.color);

          s.combo = Math.min(10, s.combo + 1);

          if (s.score > s.highScore) {
            s.highScore = s.score;
            localStorage.setItem("breaker_high_score", s.highScore);
          }
          break;
        }
      }
    }

    if (allDestroyed) {
      s.isCleared = true;
      AudioEngine.playTone(587.33, 'triangle', 0.5, 0.3);
      FX.spawnText(canvas.width / 2 - 100, canvas.height / 2, "BOARD CLEARED!", "#00e676");
    }

    // Bola Jatuh Ke Bawah (Game Over)
    if (s.ballY - s.ballRadius > canvas.height) {
      s.isGameOver = true;
      AudioEngine.play('hit');
      FX.triggerShake(20, 15);
      FX.spawnParticles(s.ballX, canvas.height - 20, "#ff1744", 25, 8);
    }
  },

  onKeyDown(e) {
    const s = this.state;
    if (e.code === "Space") {
      if (!s.isStarted) s.isStarted = true;
      else if (s.isGameOver || s.isCleared) this.init();
      return;
    }
    if (e.code === "ArrowLeft") {
      s.paddleX = Math.max(0, s.paddleX - 45);
      if (!s.isStarted) s.ballX = s.paddleX + s.paddleWidth / 2;
    }
    if (e.code === "ArrowRight") {
      s.paddleX = Math.min(canvas.width - s.paddleWidth, s.paddleX + 45);
      if (!s.isStarted) s.ballX = s.paddleX + s.paddleWidth / 2;
    }
  },

  onPointerDown(x, y) {
    const s = this.state;
    if (!s.isStarted) {
      s.isStarted = true;
      return;
    }
    if (s.isGameOver || s.isCleared) {
      this.init();
      return;
    }
    // Gerakkan paddle langsung ke titik sentuh jari / klik mouse
    s.paddleX = Math.max(0, Math.min(canvas.width - s.paddleWidth, x - s.paddleWidth / 2));
  },

  render(ctx) {
    const s = this.state;

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, "#080314");
    bgGrad.addColorStop(1, "#120826");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render Balok Neon
    for (let b of s.bricks) {
      if (b.status === 1) {
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, s.brickWidth, s.brickHeight);
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, s.brickWidth, s.brickHeight);
        ctx.restore();
      }
    }

    // Render Paddle Konsol
    const paddleY = canvas.height - 100;
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00f2fe";
    ctx.fillStyle = "#00f2fe";
    ctx.fillRect(s.paddleX, paddleY, s.paddleWidth, s.paddleHeight);
    // Striping Lampu Paddle
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(s.paddleX + s.paddleWidth / 2 - 15, paddleY + 6, 30, s.paddleHeight - 12);
    ctx.restore();

    // Render Bola Energi
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ffeb3b";
    ctx.fillStyle = "#ffeb3b";
    ctx.beginPath();
    ctx.arc(s.ballX, s.ballY, s.ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // HUD Text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px 'Orbitron', monospace";
    ctx.fillText("Skor: " + s.score, 35, 65);

    ctx.fillStyle = "#ffc107";
    ctx.font = "bold 20px 'Rajdhani', sans-serif";
    ctx.fillText(`COMBO: ${s.combo}x | REKOR: ${s.highScore}`, 35, 100);

    if (!s.isStarted) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00f2fe";
      ctx.font = "bold 48px 'Orbitron', monospace";
      ctx.fillText("NEON BREAKER", 155, 520);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText("Sentuh / Tekan SPASI untuk Luncurkan", 175, 580);
    } else if (s.isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff1744";
      ctx.font = "bold 56px 'Orbitron', monospace";
      ctx.fillText("GAME OVER", 175, 520);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px 'Rajdhani', sans-serif";
      ctx.fillText("Skor Akhir: " + s.score, 260, 580);
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText("Tekan SPASI / Ketuk untuk Restart", 190, 640);
    } else if (s.isCleared) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00e676";
      ctx.font = "bold 52px 'Orbitron', monospace";
      ctx.fillText("VICTORY!", 220, 520);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px 'Rajdhani', sans-serif";
      ctx.fillText("Skor Total: " + s.score, 255, 580);
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText("Tekan SPASI untuk Main Lagi", 210, 640);
    }
  },

  renderDebug(ctx) {
    const s = this.state;
    ctx.save();
    ctx.strokeStyle = "#ffff00";
    ctx.strokeRect(s.paddleX, canvas.height - 100, s.paddleWidth, s.paddleHeight);
    ctx.restore();
  }
};

registerScene('breaker', BreakerGame);