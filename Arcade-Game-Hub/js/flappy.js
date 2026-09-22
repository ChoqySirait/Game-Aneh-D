const FlappyGame = {
  instruction: "Lompat: <b>SPASI / Klik Layar</b> | Perisai: <b>SHIFT / Double Tap</b>",
  eagleImg: null,
  pipeImg: null,

  state: {},

  init() {
    this.preloadAssets();
    const savedHighScore = localStorage.getItem("flappy_high_score") || 0;
    this.state = {
      birdX: 120, birdY: 400, birdWidth: 75, birdHeight: 60,
      gravity: 1200, velocity: 0, jumpStrength: -480,
      isShieldActive: false, shieldDuration: 4.5, shieldTimeLeft: 0,
      shieldCooldown: 8, shieldCooldownLeft: 0,
      pipes: [], pipeWidth: 105, baseGap: 290, baseSpeed: 230,
      score: 0, highScore: parseInt(savedHighScore),
      isGameOver: false, isStarted: false,
      spawnTimer: 0, spawnInterval: 1.8,
      trailTimer: 0
    };
  },

  preloadAssets() {
    if (!this.eagleImg) {
      this.eagleImg = new Image();
      this.eagleImg.src = "data:image/svg+xml;utf8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
          <path d="M 40 40 Q 20 10 5 25 Q 25 45 45 45 Z" fill="#5d4037" />
          <ellipse cx="45" cy="45" rx="25" ry="18" fill="#795548" />
          <polygon points="15,45 5,40 5,50" fill="#ffffff" />
          <path d="M 55 32 C 55 22, 75 22, 80 35 C 80 48, 60 52, 55 45 Z" fill="#ffffff" />
          <path d="M 78 33 Q 95 35 90 45 Q 80 43 78 38 Z" fill="#ffc107" />
          <circle cx="70" cy="33" r="3" fill="#000000" />
          <path d="M 45 42 Q 30 5 10 12 Q 25 38 50 48 Z" fill="#8d6e63" />
        </svg>
      `);
    }
    if (!this.pipeImg) {
      this.pipeImg = new Image();
      this.pipeImg.src = "data:image/svg+xml;utf8," + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 500" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#004d40" />
              <stop offset="40%" stop-color="#00bfa5" />
              <stop offset="100%" stop-color="#004d40" />
            </linearGradient>
          </defs>
          <rect x="5" y="0" width="90" height="500" fill="url(#pGrad)" stroke="#00f2fe" stroke-width="2"/>
          <rect x="0" y="0" width="100" height="32" fill="url(#pGrad)" stroke="#00f2fe" stroke-width="2" rx="6"/>
        </svg>
      `);
    }
  },

  update(dt) {
    const s = this.state;
    if (!s.isStarted || s.isGameOver) return;

    // Perhitungan Kecepatan & Gap Berbasis Skor
    const difficultyMultiplier = Math.min(1.8, 1 + Math.floor(s.score / 5) * 0.08);
    const speed = s.baseSpeed * difficultyMultiplier;
    const currentGap = Math.max(210, s.baseGap - Math.floor(s.score / 5) * 10);

    // Fisika Gravitasi Menggunakan Delta Time
    s.velocity += s.gravity * dt;
    s.birdY += s.velocity * dt;

    // Jejak Partikel Bulu Burung
    s.trailTimer += dt;
    if (s.trailTimer > 0.08) {
      s.trailTimer = 0;
      FX.spawnParticles(s.birdX, s.birdY + s.birdHeight / 2, s.isShieldActive ? "#ff0055" : "#00f2fe", 1, 1);
    }

    // Cooldown & Durasi Shield
    if (s.isShieldActive) {
      s.shieldTimeLeft -= dt;
      if (s.shieldTimeLeft <= 0) s.isShieldActive = false;
    } else if (s.shieldCooldownLeft > 0) {
      s.shieldCooldownLeft -= dt;
    }

    // Spawning Pipes
    s.spawnTimer += dt;
    if (s.spawnTimer >= (s.spawnInterval / difficultyMultiplier)) {
      s.spawnTimer = 0;
      const topPipe = Math.floor(Math.random() * (canvas.height - currentGap - 280)) + 120;
      s.pipes.push({ x: canvas.width, top: topPipe, gap: currentGap, passed: false });
    }

    // Update Pipa & Tabrakan
    for (let i = s.pipes.length - 1; i >= 0; i--) {
      const p = s.pipes[i];
      p.x -= speed * dt;

      // Skor Lewat Pipa
      if (!p.passed && p.x + s.pipeWidth < s.birdX) {
        s.score++;
        p.passed = true;
        AudioEngine.play('score');
        FX.spawnText(s.birdX, s.birdY - 20, "+1", "#00e676");
        if (s.score > s.highScore) {
          s.highScore = s.score;
          localStorage.setItem("flappy_high_score", s.highScore);
        }
      }

      // Deteksi Tabrakan Presisi
      const hitMargin = 12;
      const collideX = s.birdX + s.birdWidth - hitMargin > p.x && s.birdX + hitMargin < p.x + s.pipeWidth;
      const collideY = s.birdY + hitMargin < p.top || s.birdY + s.birdHeight - hitMargin > p.top + p.gap;

      if (collideX && collideY) {
        if (s.isShieldActive) {
          FX.triggerShake(8, 8);
          FX.spawnParticles(p.x + s.pipeWidth / 2, p.top, "#ff1744", 25, 10);
          p.x = -999; // Hancurkan pipa seketika
        } else {
          this.triggerGameOver();
        }
      }

      if (p.x < -s.pipeWidth) s.pipes.splice(i, 1);
    }

    // Tabrak Batas Atas / Bawah
    if (s.birdY + s.birdHeight > canvas.height || s.birdY < -20) {
      this.triggerGameOver();
    }
  },

  triggerGameOver() {
    if (this.state.isGameOver) return;
    this.state.isGameOver = true;
    AudioEngine.play('hit');
    FX.triggerShake(20, 15);
    FX.spawnParticles(this.state.birdX, this.state.birdY, "#ff1744", 30, 8);
  },

  jump() {
    const s = this.state;
    if (!s.isStarted) {
      s.isStarted = true;
      s.velocity = s.jumpStrength;
      AudioEngine.play('jump');
    } else if (s.isGameOver) {
      this.init();
    } else {
      s.velocity = s.jumpStrength;
      AudioEngine.play('jump');
      FX.spawnParticles(s.birdX, s.birdY + s.birdHeight, "#ffffff", 4, 3);
    }
  },

  activateShield() {
    const s = this.state;
    if (s.isStarted && !s.isGameOver && !s.isShieldActive && s.shieldCooldownLeft <= 0) {
      s.isShieldActive = true;
      s.shieldTimeLeft = s.shieldDuration;
      s.shieldCooldownLeft = s.shieldCooldown;
      AudioEngine.play('shield');
      FX.spawnParticles(s.birdX, s.birdY, "#ff007f", 20, 6);
    }
  },

  onKeyDown(e) {
    if (e.code === "Space") {
      this.jump();
      e.preventDefault();
    }
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
      this.activateShield();
    }
  },

  onPointerDown(x, y) {
    // Tap biasa = jump, jika klik bagian atas = shield
    if (y < 200 && this.state.isStarted && !this.state.isGameOver) {
      this.activateShield();
    } else {
      this.jump();
    }
  },

  render(ctx) {
    const s = this.state;

    // Latar Belakang Gradasi Cyber Night
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, "#050b14");
    bgGrad.addColorStop(0.6, "#0e1e38");
    bgGrad.addColorStop(1, "#1b3358");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render Rintangan Pipa
    for (let p of s.pipes) {
      // Pipa Atas (Dibalik Vertikal)
      ctx.save();
      ctx.translate(p.x + s.pipeWidth / 2, p.top / 2);
      ctx.scale(1, -1);
      ctx.drawImage(this.pipeImg, -s.pipeWidth / 2, -p.top / 2, s.pipeWidth, p.top);
      ctx.restore();

      // Pipa Bawah
      ctx.drawImage(this.pipeImg, p.x, p.top + p.gap, s.pipeWidth, canvas.height - (p.top + p.gap));
    }

    // Render Burung Elang
    ctx.save();
    ctx.translate(s.birdX + s.birdWidth / 2, s.birdY + s.birdHeight / 2);
    const targetAngle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, s.velocity / 600));
    ctx.rotate(targetAngle);

    if (s.isShieldActive) {
      ctx.shadowBlur = 40;
      ctx.shadowColor = "#ff0055";
      ctx.strokeStyle = "#ff0055";
      ctx.lineWidth = 4;
      ctx.strokeRect(-s.birdWidth / 2 - 8, -s.birdHeight / 2 - 8, s.birdWidth + 16, s.birdHeight + 16);
    }
    ctx.drawImage(this.eagleImg, -s.birdWidth / 2, -s.birdHeight / 2, s.birdWidth, s.birdHeight);
    ctx.restore();

    // UI Skor & High Score
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText("Skor: " + s.score, 35, 65);

    ctx.fillStyle = "#ffc107";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText("Rekor: " + s.highScore, 35, 105);

    // Status Perisai
    ctx.font = "bold 22px sans-serif";
    if (s.isShieldActive) {
      ctx.fillStyle = "#ff1744";
      ctx.fillText(`⚡ PERISAI: ${s.shieldTimeLeft.toFixed(1)}s`, 35, 145);
    } else if (s.shieldCooldownLeft > 0) {
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText(`⏳ Cooldown: ${Math.ceil(s.shieldCooldownLeft)}s`, 35, 145);
    } else {
      ctx.fillStyle = "#00e676";
      ctx.fillText("🛡️ Perisai SIAP (Shift)", 35, 145);
    }

    // Layar Mulai & Game Over
    if (!s.isStarted) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00f2fe";
      ctx.font = "bold 52px sans-serif";
      ctx.fillText("FLAPPY EAGLE", 175, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "26px sans-serif";
      ctx.fillText("Ketuk Layar / SPASI untuk Mulai", 175, 540);
    } else if (s.isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff1744";
      ctx.font = "bold 58px sans-serif";
      ctx.fillText("GAME OVER", 185, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "30px sans-serif";
      ctx.fillText("Skor Akhir: " + s.score, 260, 540);
      ctx.fillStyle = "#ffeb3b";
      ctx.font = "24px sans-serif";
      ctx.fillText("Tekan SPASI / Ketuk untuk restart", 180, 600);
    }
  }
};

registerScene('flappy', FlappyGame);