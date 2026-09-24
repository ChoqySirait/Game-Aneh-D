// =================================================================
// 👾 CYBER SWARM: ROGUE SURVIVOR (Intense Action / Wave Defense)
// =================================================================

const SwarmGame = {
  instruction: "Gerak: <b>Kursor / Geser Jari</b> | EMP Blast: <b>SPASI / Klik Layar</b>",
  state: {},

  init() {
    const savedHighScore = localStorage.getItem("swarm_high_score") || 0;
    this.state = {
      // Inti Virus
      playerX: canvas.width / 2,
      playerY: canvas.height / 2 + 150,
      targetX: canvas.width / 2,
      targetY: canvas.height / 2 + 150,
      hp: 100,
      maxHp: 100,

      // Kawanan Nano-Bots Penyerang
      bots: [],
      maxBots: 25,
      autoAttackTimer: 0,

      // Musuh Aktif (Antivirus Drones & Hunters)
      enemies: [],
      spawnTimer: 0,
      wave: 1,

      // Exp & Drops
      dataGems: [],
      exp: 0,
      expNeeded: 50,
      level: 1,

      // Efek Proyektil Laser Pemain
      beams: [],

      score: 0,
      highScore: parseInt(savedHighScore),
      empCooldown: 0,
      isStarted: false,
      isGameOver: false
    };

    // Spawn 6 Bot Awal Mengitari Inti
    for (let i = 0; i < 6; i++) {
      this.state.bots.push({
        angle: (i / 6) * Math.PI * 2,
        dist: 45,
        orbitSpeed: 3
      });
    }
  },

  update(dt) {
    const s = this.state;
    if (!s.isStarted || s.isGameOver) return;

    if (s.empCooldown > 0) s.empCooldown -= dt;

    // Gerakan Halus Mengikuti Kursor
    s.playerX += (s.targetX - s.playerX) * 10 * dt;
    s.playerY += (s.targetY - s.playerY) * 10 * dt;

    // Batasi di dalam Canvas
    s.playerX = Math.max(30, Math.min(canvas.width - 30, s.playerX));
    s.playerY = Math.max(50, Math.min(canvas.height - 50, s.playerY));

    // Update Posisi Bot Mengorbit
    for (let b of s.bots) {
      b.angle += b.orbitSpeed * dt;
    }

    // Auto-Attack: Bot Menembakkan Laser ke Musuh Terdekat
    s.autoAttackTimer += dt;
    if (s.autoAttackTimer >= 0.28 && s.enemies.length > 0) {
      s.autoAttackTimer = 0;
      
      // Cari musuh terdekat
      let closestEnemy = null;
      let minDist = 380;
      for (let e of s.enemies) {
        const d = Math.hypot(e.x - s.playerX, e.y - s.playerY);
        if (d < minDist) {
          minDist = d;
          closestEnemy = e;
        }
      }

      if (closestEnemy) {
        // Tembak laser petir
        closestEnemy.hp -= 25 + s.level * 5;
        AudioEngine.playTone(500, 'sine', 0.05, 0.08);

        s.beams.push({
          x1: s.playerX,
          y1: s.playerY,
          x2: closestEnemy.x,
          y2: closestEnemy.y,
          life: 0.1
        });

        FX.spawnParticles(closestEnemy.x, closestEnemy.y, "#00ff66", 4, 3);
      }
    }

    // Update Visual Laser Beam
    for (let i = s.beams.length - 1; i >= 0; i--) {
      s.beams[i].life -= dt;
      if (s.beams[i].life <= 0) s.beams.splice(i, 1);
    }

    // Spawning Musuh Berdasarkan Wave
    s.spawnTimer += dt;
    const interval = Math.max(0.4, 1.4 - s.wave * 0.1);
    if (s.spawnTimer >= interval) {
      s.spawnTimer = 0;
      const side = Math.floor(Math.random() * 3); // Dari atas, kiri, atau kanan
      let ex = Math.random() * canvas.width;
      let ey = -20;
      if (side === 1) { ex = -20; ey = Math.random() * (canvas.height / 2); }
      if (side === 2) { ex = canvas.width + 20; ey = Math.random() * (canvas.height / 2); }

      const isFast = Math.random() < 0.25;
      s.enemies.push({
        x: ex,
        y: ey,
        speed: isFast ? 190 : 110 + s.wave * 10,
        hp: isFast ? 30 : 60 + s.wave * 15,
        maxHp: isFast ? 30 : 60 + s.wave * 15,
        radius: isFast ? 14 : 20,
        type: isFast ? 'FAST' : 'NORMAL'
      });
    }

    // Update Musuh: Bergerak Mengejar Inti Virus
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const e = s.enemies[i];
      const angle = Math.atan2(s.playerY - e.y, s.playerX - e.x);
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;

      // Tabrakan Musuh dengan Inti Pemain
      if (Math.hypot(e.x - s.playerX, e.y - s.playerY) < e.radius + 18) {
        s.hp -= 20;
        AudioEngine.play('hit');
        FX.triggerShake(14, 10);
        FX.spawnParticles(s.playerX, s.playerY, "#ff0055", 15, 6);
        s.enemies.splice(i, 1);

        if (s.hp <= 0) {
          this.gameOver();
          return;
        }
        continue;
      }

      // Musuh Mati
      if (e.hp <= 0) {
        s.score += e.type === 'FAST' ? 25 : 15;
        // Jatuhkan Data Gem (XP)
        s.dataGems.push({ x: e.x, y: e.y });
        FX.triggerShake(4, 4);
        FX.spawnParticles(e.x, e.y, "#ff0055", 14, 5);
        s.enemies.splice(i, 1);

        if (s.score > s.highScore) {
          s.highScore = s.score;
          localStorage.setItem("swarm_high_score", s.highScore);
        }
      }
    }

    // Magnet Penarik Data Gem (XP)
    for (let i = s.dataGems.length - 1; i >= 0; i--) {
      const g = s.dataGems[i];
      const dist = Math.hypot(s.playerX - g.x, s.playerY - g.y);

      // Terhisap jika dekat
      if (dist < 150) {
        g.x += (s.playerX - g.x) * 12 * dt;
        g.y += (s.playerY - g.y) * 12 * dt;
      }

      if (dist < 26) {
        s.exp += 15;
        s.dataGems.splice(i, 1);
        AudioEngine.playTone(800, 'sine', 0.04, 0.05);

        // Level Up
        if (s.exp >= s.expNeeded) {
          s.exp -= s.expNeeded;
          s.level++;
          s.expNeeded = Math.floor(s.expNeeded * 1.5);
          s.wave = Math.min(10, Math.floor(s.level / 2) + 1);

          // Tambah Bot Baru Setiap Naik Level
          if (s.bots.length < s.maxBots) {
            s.bots.push({
              angle: Math.random() * Math.PI * 2,
              dist: 40 + Math.random() * 30,
              orbitSpeed: 2.5 + Math.random()
            });
          }

          AudioEngine.playTone(600, 'triangle', 0.3, 0.2);
          FX.triggerShake(12, 10);
          FX.spawnText(s.playerX - 60, s.playerY - 50, `LEVEL UP! +BOT`, "#00ff66");
        }
      }
    }
  },

  triggerEMP() {
    const s = this.state;
    if (s.empCooldown <= 0 && s.isStarted && !s.isGameOver) {
      s.empCooldown = 6.0;
      // Ledakkan seluruh musuh di layar
      for (let e of s.enemies) {
        e.hp -= 150;
      }
      AudioEngine.playTone(140, 'sawtooth', 0.6, 0.3);
      FX.triggerShake(24, 18);
      FX.spawnText(s.playerX - 60, s.playerY - 60, "NOVA EMP BLAST!", "#00f2fe");
      FX.spawnParticles(s.playerX, s.playerY, "#00f2fe", 50, 12);
    }
  },

  gameOver() {
    this.state.isGameOver = true;
    AudioEngine.play('hit');
    FX.triggerShake(25, 20);
    FX.spawnParticles(this.state.playerX, this.state.playerY, "#ff0055", 40, 10);
  },

  onKeyDown(e) {
    if (e.code === "Space") {
      if (!this.state.isStarted) this.state.isStarted = true;
      else if (this.state.isGameOver) this.init();
      else this.triggerEMP();
      e.preventDefault();
    }
  },

  onPointerDown(x, y) {
    if (!this.state.isStarted) {
      this.state.isStarted = true;
      return;
    }
    if (this.state.isGameOver) {
      this.init();
      return;
    }
    this.triggerEMP();
  },

  render(ctx) {
    const s = this.state;

    // Dark Arena Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, "#02070d");
    bgGrad.addColorStop(1, "#071320");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dynamic Grid Lines
    ctx.strokeStyle = "rgba(0, 255, 102, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 45) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 45) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Render Laser Beams
    for (let b of s.beams) {
      ctx.save();
      ctx.strokeStyle = "#00ff66";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00ff66";
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Render Data Gems (XP Drops)
    for (let g of s.dataGems) {
      ctx.save();
      ctx.fillStyle = "#ffea00";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ffea00";
      ctx.fillRect(g.x - 4, g.y - 4, 8, 8);
      ctx.restore();
    }

    // Render Musuh (Antivirus Patrols)
    for (let e of s.enemies) {
      ctx.save();
      const col = e.type === 'FAST' ? "#ff0055" : "#ff5500";
      ctx.fillStyle = col;
      ctx.shadowBlur = 15;
      ctx.shadowColor = col;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();

      // HP Bar Mini di atas musuh
      const pct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(e.x - 16, e.y - e.radius - 8, 32, 4);
      ctx.fillStyle = "#00ff66";
      ctx.fillRect(e.x - 16, e.y - e.radius - 8, 32 * pct, 4);
      ctx.restore();
    }

    // Render Swarm Nano-Bots Mengitari Inti
    for (let b of s.bots) {
      const bx = s.playerX + Math.cos(b.angle) * b.dist;
      const by = s.playerY + Math.sin(b.angle) * b.dist;

      ctx.save();
      ctx.fillStyle = "#00f2fe";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#00f2fe";
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();

      // Garis Koneksi Antar-Bot ke Inti
      ctx.strokeStyle = "rgba(0, 242, 254, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.playerX, s.playerY);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.restore();
    }

    // Render Inti Virus Pemain (Core)
    ctx.save();
    ctx.fillStyle = "#00ff66";
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#00ff66";
    ctx.beginPath();
    ctx.arc(s.playerX, s.playerY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // HUD Header & Player HP
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px 'Orbitron', monospace";
    ctx.fillText("Skor: " + s.score, 35, 65);

    ctx.fillStyle = "#00ff66";
    ctx.font = "bold 20px 'Rajdhani', sans-serif";
    ctx.fillText(`LEVEL ${s.level} | SWARM: ${s.bots.length} BOTS | WAVE ${s.wave}`, 35, 100);

    // HP Bar Pemain
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(35, 125, 220, 12);
    ctx.fillStyle = s.hp > 30 ? "#00ff66" : "#ff0055";
    ctx.fillRect(35, 125, 220 * (Math.max(0, s.hp) / s.maxHp), 12);

    // EXP Bar (Bawah Layar)
    ctx.fillStyle = "rgba(0, 242, 254, 0.15)";
    ctx.fillRect(0, canvas.height - 8, canvas.width, 8);
    ctx.fillStyle = "#00f2fe";
    ctx.fillRect(0, canvas.height - 8, canvas.width * (s.exp / s.expNeeded), 8);

    // Status EMP
    if (s.empCooldown > 0) {
      ctx.fillStyle = "#ffeb3b";
      ctx.font = "bold 18px 'Rajdhani', sans-serif";
      ctx.fillText(`⏳ EMP Cooldown: ${s.empCooldown.toFixed(1)}s`, canvas.width - 200, 65);
    } else {
      ctx.fillStyle = "#00f2fe";
      ctx.font = "bold 18px 'Rajdhani', sans-serif";
      ctx.fillText("💥 EMP READY (Spasi)", canvas.width - 200, 65);
    }

    if (!s.isStarted) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff66";
      ctx.font = "bold 44px 'Orbitron', monospace";
      ctx.fillText("CYBER SWARM", 165, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText("Sentuh / Tekan SPASI untuk Mulai", 185, 540);
    } else if (s.isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff0055";
      ctx.font = "bold 54px 'Orbitron', monospace";
      ctx.fillText("SYSTEM PURGED", 130, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px 'Rajdhani', sans-serif";
      ctx.fillText("Skor Akhir: " + s.score, 250, 540);
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText("Tekan SPASI untuk Restart", 215, 600);
    }
  }
};

registerScene('swarm', SwarmGame);