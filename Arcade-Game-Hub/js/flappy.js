const FlappyGame = {
  instruction: "Lompat: <b>SPASI / Klik</b> | Perisai: <b>SHIFT / Tap Atas</b> | Warp: <b>Tiap 500 Skor</b>",
  eagleImg: null,
  state: {},

  biomes: [
    { 
      name: "CYBER NIGHT", 
      top: "#050b14", mid: "#0f1c30", bot: "#182c4c", 
      pipeColor: "#003b46", stroke: "#00f2fe", capColor: "#007991",
      particleColor: "#00f2fe", style: "grid"
    },
    { 
      name: "NEON SUNSET", 
      top: "#20002c", mid: "#5b0e2d", bot: "#8a1c3d", 
      pipeColor: "#4a0e17", stroke: "#ff007f", capColor: "#ff7700",
      particleColor: "#ffaa00", style: "stars"
    },
    { 
      name: "TOXIC MATRIX", 
      top: "#021307", mid: "#053014", bot: "#0a471c", 
      pipeColor: "#003314", stroke: "#00ff66", capColor: "#38b000",
      particleColor: "#39ff14", style: "matrix"
    }
  ],

  init() {
    this.loadAssets();
    const savedHighScore = localStorage.getItem("flappy_high_score") || 0;
    this.state = {
      birdX: 130, birdY: 420, birdWidth: 72, birdHeight: 56,
      gravity: 1250, velocity: 0, jump: -460,
      isShieldActive: false, shieldDuration: 4.0, shieldTimeLeft: 0,
      shieldCooldown: 7, shieldCooldownLeft: 0,
      pipes: [], pipeWidth: 105, baseGap: 280, baseSpeed: 230,
      score: 0, highScore: parseInt(savedHighScore),
      isGameOver: false, isStarted: false,
      spawnTimer: 0,
      
      // SISTEM SKOR STABIL (Tidak gila-gilaan)
      multiplier: 1,
      pipeStreak: 0,

      // WARP MAP
      biomeIndex: 0,
      isWarping: false,
      warpTimer: 0,
      warpDuration: 2.2,
      speedLines: [],
      nextWarpScore: 500,

      // Visual Background Partikel Biome
      ambientParticles: [],
      gridOffset: 0
    };

    // Bikin partikel atmosfer
    for (let i = 0; i < 30; i++) {
      this.state.ambientParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 40 + 20
      });
    }
  },

  loadAssets() {
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
  },

  update(dt) {
    const s = this.state;
    if (!s.isStarted || s.isGameOver) return;

    // Gerakan lantai grid & partikel debu
    s.gridOffset = (s.gridOffset + 150 * dt) % 60;
    s.ambientParticles.forEach(p => {
      p.x -= p.speed * dt;
      if (p.x < 0) { p.x = canvas.width; p.y = Math.random() * canvas.height; }
    });

    // FASE WARP ENGINE (Tiap kelipatan 500)
    if (s.isWarping) {
      s.warpTimer -= dt;
      s.velocity = 0;
      s.birdY += (canvas.height / 2 - s.birdY) * 5 * dt;

      if (Math.random() < 0.8) {
        s.speedLines.push({
          x: canvas.width,
          y: Math.random() * canvas.height,
          len: Math.random() * 90 + 60,
          speed: Math.random() * 1600 + 1300
        });
      }

      for (let i = s.speedLines.length - 1; i >= 0; i--) {
        let line = s.speedLines[i];
        line.x -= line.speed * dt;
        if (line.x + line.len < 0) s.speedLines.splice(i, 1);
      }

      if (s.warpTimer <= 0) {
        s.isWarping = false;
        s.speedLines = [];
        s.biomeIndex = (s.biomeIndex + 1) % this.biomes.length;
        s.nextWarpScore += 500;
        FX.triggerShake(14, 10);
        FX.spawnText(canvas.width / 2 - 120, canvas.height / 2, "NEW BIOME REACHED!", "#00e676");
      }
      return;
    }

    if (s.score >= s.nextWarpScore) {
      s.isWarping = true;
      s.warpTimer = s.warpDuration;
      s.pipes = [];
      AudioEngine.playTone(320, 'sawtooth', 0.6, 0.3);
      FX.triggerShake(18, 14);
      FX.spawnText(canvas.width / 2 - 110, canvas.height / 2 - 50, "HYPER DRIVE!!", "#00f2fe");
      return;
    }

    const diff = Math.min(1.7, 1 + Math.floor(s.score / 100) * 0.08);
    const speed = s.baseSpeed * diff;
    const currentGap = Math.max(215, s.baseGap - Math.floor(s.score / 80) * 8);

    s.velocity += s.gravity * dt;
    s.birdY += s.velocity * dt;

    if (s.isShieldActive) {
      s.shieldTimeLeft -= dt;
      if (s.shieldTimeLeft <= 0) s.isShieldActive = false;
    } else if (s.shieldCooldownLeft > 0) {
      s.shieldCooldownLeft -= dt;
    }

    s.spawnTimer += dt;
    if (s.spawnTimer >= (1.8 / diff)) {
      s.spawnTimer = 0;
      const topPipe = Math.floor(Math.random() * (canvas.height - currentGap - 260)) + 120;
      s.pipes.push({ x: canvas.width, top: topPipe, gap: currentGap, passed: false, grazed: false });
    }

    const hitM = 10;
    const bBox = {
      l: s.birdX + hitM,
      r: s.birdX + s.birdWidth - hitM,
      t: s.birdY + hitM,
      b: s.birdY + s.birdHeight - hitM
    };

    for (let i = s.pipes.length - 1; i >= 0; i--) {
      const p = s.pipes[i];
      p.x -= speed * dt;

      // SKOR TERUKUR (1 Poin Dasar + Multiplier Berjenjang Maks 5x)
      if (!p.passed && p.x + s.pipeWidth < s.birdX) {
        p.passed = true;
        s.pipeStreak++;

        // Naikkan pengali tiap 5 pipa bersih berturut-turut
        if (s.pipeStreak % 5 === 0 && s.multiplier < 5) {
          s.multiplier++;
          FX.spawnText(s.birdX, s.birdY - 45, `${s.multiplier}x COMBO!`, "#ffeb3b");
        }

        const pointGain = 1 * s.multiplier;
        s.score += pointGain;

        AudioEngine.playArpeggio(s.multiplier);
        FX.spawnText(s.birdX, s.birdY - 15, `+${pointGain}`, "#00e676");

        if (s.score > s.highScore) {
          s.highScore = s.score;
          localStorage.setItem("flappy_high_score", s.highScore);
        }
      }

      // Near-miss / Graze (Bonus flat 5 poin)
      const grazeZone = 18;
      const inX = bBox.r > p.x - grazeZone && bBox.l < p.x + s.pipeWidth + grazeZone;
      const nearTop = Math.abs(bBox.t - p.top) < grazeZone;
      const nearBottom = Math.abs(bBox.b - (p.top + p.gap)) < grazeZone;

      if (!p.grazed && inX && (nearTop || nearBottom)) {
        p.grazed = true;
        const grazeBonus = 5 * s.multiplier;
        s.score += grazeBonus;
        AudioEngine.play('graze');
        FX.spawnText(s.birdX + 15, s.birdY, `GRAZE! +${grazeBonus}`, "#ff007f");
        FX.spawnParticles(s.birdX + s.birdWidth / 2, s.birdY + s.birdHeight / 2, "#ffeb3b", 12, 5);
      }

      // Tabrakan
      const colX = bBox.r > p.x && bBox.l < p.x + s.pipeWidth;
      const colY = bBox.t < p.top || bBox.b > p.top + p.gap;

      if (colX && colY) {
        if (s.isShieldActive) {
          FX.triggerShake(10, 8);
          FX.spawnParticles(p.x + s.pipeWidth / 2, p.top, "#ff1744", 25, 8);
          p.x = -999;
        } else {
          this.gameOver();
        }
      }

      if (p.x < -s.pipeWidth) s.pipes.splice(i, 1);
    }

    if (s.birdY + s.birdHeight > canvas.height || s.birdY < -30) {
      this.gameOver();
    }
  },

  gameOver() {
    if (this.state.isGameOver) return;
    this.state.isGameOver = true;
    this.state.multiplier = 1;
    this.state.pipeStreak = 0;
    AudioEngine.play('hit');
    FX.triggerShake(20, 14);
    FX.spawnParticles(this.state.birdX, this.state.birdY, "#ff1744", 30, 8);
  },

  jump() {
    const s = this.state;
    if (s.isWarping) return;
    if (!s.isStarted) {
      s.isStarted = true;
      s.velocity = s.jump;
      AudioEngine.playArpeggio(0);
    } else if (s.isGameOver) {
      this.init();
    } else {
      s.velocity = s.jump;
      AudioEngine.playArpeggio(s.multiplier);
      FX.spawnParticles(s.birdX, s.birdY + s.birdHeight, "#00f2fe", 4, 3);
    }
  },

  useShield() {
    const s = this.state;
    if (s.isStarted && !s.isGameOver && !s.isShieldActive && s.shieldCooldownLeft <= 0 && !s.isWarping) {
      s.isShieldActive = true;
      s.shieldTimeLeft = s.shieldDuration;
      s.shieldCooldownLeft = s.shieldCooldown;
      AudioEngine.playTone(550, 'sawtooth', 0.25, 0.2);
      FX.spawnParticles(s.birdX, s.birdY, "#ff007f", 20, 5);
    }
  },

  onKeyDown(e) {
    if (e.code === "Space") {
      this.jump();
      e.preventDefault();
    }
    if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
      this.useShield();
    }
  },

  onPointerDown(x, y) {
    if (y < 220 && this.state.isStarted && !this.state.isGameOver) {
      this.useShield();
    } else {
      this.jump();
    }
  },

  render(ctx) {
    const s = this.state;
    const currentBiome = this.biomes[s.biomeIndex];

    // Background Gradient Sesuai Biome
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, currentBiome.top);
    bgGrad.addColorStop(0.6, currentBiome.mid);
    bgGrad.addColorStop(1, currentBiome.bot);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Visual Lingkungan Biome: Bintang & Debu Kosmik
    ctx.save();
    ctx.fillStyle = currentBiome.particleColor;
    s.ambientParticles.forEach(p => {
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Visual Lingkungan: Grid Lantai Cyber Bergerak
    ctx.save();
    ctx.strokeStyle = currentBiome.stroke;
    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 1;
    for (let x = -s.gridOffset; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, canvas.height - 80);
      ctx.lineTo(x - 40, canvas.height);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 80);
    ctx.lineTo(canvas.width, canvas.height - 80);
    ctx.stroke();
    ctx.restore();

    // Efek Warp Lines
    if (s.isWarping) {
      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00f2fe";
      for (let line of s.speedLines) {
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x + line.len, line.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render Pipa Berornamen
    for (let p of s.pipes) {
      ctx.save();
      ctx.fillStyle = currentBiome.pipeColor;
      ctx.strokeStyle = currentBiome.stroke;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = currentBiome.stroke;

      // Badan Pipa
      ctx.fillRect(p.x, 0, s.pipeWidth, p.top);
      ctx.strokeRect(p.x, 0, s.pipeWidth, p.top);
      ctx.fillRect(p.x, p.top + p.gap, s.pipeWidth, canvas.height - (p.top + p.gap));
      ctx.strokeRect(p.x, p.top + p.gap, s.pipeWidth, canvas.height - (p.top + p.gap));

      // Ornamen Kepala Pipa (Neon Caps)
      ctx.fillStyle = currentBiome.capColor;
      ctx.fillRect(p.x - 4, p.top - 24, s.pipeWidth + 8, 24);
      ctx.strokeRect(p.x - 4, p.top - 24, s.pipeWidth + 8, 24);

      ctx.fillRect(p.x - 4, p.top + p.gap, s.pipeWidth + 8, 24);
      ctx.strokeRect(p.x - 4, p.top + p.gap, s.pipeWidth + 8, 24);

      // Neon Core Strip di tengah pipa
      ctx.fillStyle = currentBiome.stroke;
      ctx.fillRect(p.x + s.pipeWidth / 2 - 3, 0, 6, p.top - 24);
      ctx.fillRect(p.x + s.pipeWidth / 2 - 3, p.top + p.gap + 24, 6, canvas.height);

      ctx.restore();
    }

    // Burung Elang
    ctx.save();
    ctx.translate(s.birdX + s.birdWidth / 2, s.birdY + s.birdHeight / 2);
    const targetAngle = s.isWarping ? 0 : Math.min(Math.PI / 4, Math.max(-Math.PI / 4, s.velocity / 650));
    ctx.rotate(targetAngle);

    if (s.isWarping) {
      ctx.shadowBlur = 40;
      ctx.shadowColor = "#00f2fe";
      ctx.fillStyle = "#ff007f";
      ctx.beginPath();
      ctx.moveTo(-s.birdWidth / 2, -10);
      ctx.lineTo(-s.birdWidth / 2 - 35, 0);
      ctx.lineTo(-s.birdWidth / 2, 10);
      ctx.fill();
    }

    if (s.isShieldActive) {
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#ff007f";
      ctx.strokeStyle = "#ff007f";
      ctx.lineWidth = 4;
      ctx.strokeRect(-s.birdWidth / 2 - 6, -s.birdHeight / 2 - 6, s.birdWidth + 12, s.birdHeight + 12);
    }
    ctx.drawImage(this.eagleImg, -s.birdWidth / 2, -s.birdHeight / 2, s.birdWidth, s.birdHeight);
    ctx.restore();

    // UI
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px 'Orbitron', monospace";
    ctx.fillText("Skor: " + s.score, 35, 65);

    ctx.fillStyle = s.multiplier > 1 ? "#ffeb3b" : currentBiome.stroke;
    ctx.font = "bold 20px 'Rajdhani', sans-serif";
    ctx.fillText(`BIOME: ${currentBiome.name} | MULTIPLIER: ${s.multiplier}x`, 35, 100);

    if (s.isShieldActive) {
      ctx.fillStyle = "#ff007f";
      ctx.fillText(`⚡ PERISAI: ${s.shieldTimeLeft.toFixed(1)}s`, 35, 135);
    } else if (s.shieldCooldownLeft > 0) {
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText(`⏳ Cooldown: ${Math.ceil(s.shieldCooldownLeft)}s`, 35, 135);
    } else {
      ctx.fillStyle = "#00e676";
      ctx.fillText("🛡️ Perisai READY (Shift)", 35, 135);
    }

    if (!s.isStarted) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00f2fe";
      ctx.font = "bold 46px 'Orbitron', monospace";
      ctx.fillText("FLAPPY EAGLE", 160, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText("Ketuk Layar / SPASI untuk Mulai", 190, 540);
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

registerScene('flappy', FlappyGame);