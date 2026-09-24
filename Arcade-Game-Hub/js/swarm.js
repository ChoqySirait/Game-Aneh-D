// =================================================================
// 👾 CYBER SWARM: ASSAULT PROTOCOL (Arena Survivor Engine)
// Features: Auto-Aim Plasma Bolts, Orbiting Drones, Wave Waves
// =================================================================

const SwarmGame = {
  instruction: "Kendali Inti: <b>Arahkan Pointer / Sentuh</b> | Nova Burst: <b>SPASI</b>",
  state: {},

  init() {
    const savedHighScore = localStorage.getItem("swarm_high_score") || 0;
    this.state = {
      coreX: canvas.width / 2,
      coreY: canvas.height / 2 + 100,
      targetX: canvas.width / 2,
      targetY: canvas.height / 2 + 100,
      hp: 100,
      maxHp: 100,

      // Swarm Weaponry
      orbitDrones: 4,
      droneAngle: 0,
      plasmaBolts: [],
      shootTimer: 0,

      // Wave & Enemy Assault
      enemies: [],
      spawnTimer: 0,
      wave: 1,
      waveKills: 0,

      // Drop Orbs
      expOrbs: [],
      score: 0,
      highScore: parseInt(savedHighScore),
      empCooldown: 0,

      isStarted: false,
      isGameOver: false
    };
  },

  update(dt) {
    const s = this.state;
    if (!s.isStarted || s.isGameOver) return;

    if (s.empCooldown > 0) s.empCooldown -= dt;

    // Gerakan Inti Halus
    s.coreX += (s.targetX - s.coreX) * 9 * dt;
    s.coreY += (s.targetY - s.coreY) * 9 * dt;
    s.coreX = Math.max(25, Math.min(canvas.width - 25, s.coreX));
    s.coreY = Math.max(25, Math.min(canvas.height - 25, s.coreY));

    // Rotasi Drone Pengawal
    s.droneAngle += 3.5 * dt;

    // Tembakan Otomatis Plasma Bolts dari Drone ke Musuh Terdekat
    s.shootTimer += dt;
    if (s.shootTimer >= 0.16 && s.enemies.length > 0) {
      s.shootTimer = 0;

      // Cari Musuh Terdekat
      let nearest = null;
      let minD = 550;
      for (let e of s.enemies) {
        const d = Math.hypot(e.x - s.coreX, e.y - s.coreY);
        if (d < minD) { minD = d; nearest = e; }
      }

      if (nearest) {
        const angle = Math.atan2(nearest.y - s.coreY, nearest.x - s.coreX);
        s.plasmaBolts.push({
          x: s.coreX,
          y: s.coreY,
          vx: Math.cos(angle) * 750,
          vy: Math.sin(angle) * 750
        });
        AudioEngine.playTone(650, 'sine', 0.04, 0.06);
      }
    }

    // Update Proyektil Plasma
    for (let i = s.plasmaBolts.length - 1; i >= 0; i--) {
      const p = s.plasmaBolts[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Tabrakan Plasma dengan Musuh
      let hit = false;
      for (let j = s.enemies.length - 1; j >= 0; j--) {
        const e = s.enemies[j];
        if (Math.hypot(p.x - e.x, p.y - e.y) < e.radius + 6) {
          e.hp -= 35;
          hit = true;
          FX.spawnParticles(e.x, e.y, "#00ff66", 6, 3);

          if (e.hp <= 0) {
            s.score += 20;
            s.waveKills++;
            FX.triggerShake(4, 4);
            FX.spawnParticles(e.x, e.y, "#ff0055", 14, 5);
            s.expOrbs.push({ x: e.x, y: e.y });
            s.enemies.splice(j, 1);

            // Peningkatan Drone / Wave Progression
            if (s.waveKills % 12 === 0) {
              s.wave++;
              if (s.orbitDrones < 8) s.orbitDrones++;
              AudioEngine.playArpeggio(s.wave);
              FX.spawnText(s.coreX - 50, s.coreY - 40, `WAVE ${s.wave}! +DRONE`, "#00f2fe");
            }

            if (s.score > s.highScore) {
              s.highScore = s.score;
              localStorage.setItem("swarm_high_score", s.highScore);
            }
          }
          break;
        }
      }

      if (hit || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
        s.plasmaBolts.splice(i, 1);
      }
    }

    // Spawn Musuh Bergelombang
    s.spawnTimer += dt;
    const spawnRate = Math.max(0.35, 1.2 - s.wave * 0.08);
    if (s.spawnTimer >= spawnRate) {
      s.spawnTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 380;
      s.enemies.push({
        x: s.coreX + Math.cos(angle) * dist,
        y: s.coreY + Math.sin(angle) * dist,
        speed: 130 + s.wave * 12,
        hp: 40 + s.wave * 15,
        radius: 16
      });
    }

    // Update Gerakan Musuh Mengepung Inti
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const e = s.enemies[i];
      const angle = Math.atan2(s.coreY - e.y, s.coreX - e.x);
      e.x += Math.cos(angle) * e.speed * dt;
      e.y += Math.sin(angle) * e.speed * dt;

      // Musuh Menghantam Inti Pemain
      if (Math.hypot(e.x - s.coreX, e.y - s.coreY) < e.radius + 18) {
        s.hp -= 20;
        AudioEngine.play('hit');
        FX.triggerShake(14, 10);
        FX.spawnParticles(s.coreX, s.coreY, "#ff0055", 16, 6);
        s.enemies.splice(i, 1);

        if (s.hp <= 0) {
          this.gameOver();
          return;
        }
      }
    }

    // Magnet Penarik Data Orbs (XP / Score)
    for (let i = s.expOrbs.length - 1; i >= 0; i--) {
      const orb = s.expOrbs[i];
      const d = Math.hypot(s.coreX - orb.x, s.coreY - orb.y);
      if (d < 180) {
        orb.x += (s.coreX - orb.x) * 12 * dt;
        orb.y += (s.coreY - orb.y) * 12 * dt;
      }
      if (d < 25) {
        s.score += 10;
        s.hp = Math.min(s.maxHp, s.hp + 2);
        s.expOrbs.splice(i, 1);
        AudioEngine.playTone(900, 'sine', 0.03, 0.04);
      }
    }
  },

  triggerEMP() {
    const s = this.state;
    if (s.empCooldown <= 0 && s.isStarted && !s.isGameOver) {
      s.empCooldown = 5.0;
      for (let e of s.enemies) e.hp -= 120;
      AudioEngine.playTone(150, 'sawtooth', 0.5, 0.3);
      FX.triggerShake(20, 16);
      FX.spawnText(s.coreX - 50, s.coreY - 50, "NOVA BURST!", "#00f2fe");
      FX.spawnParticles(s.coreX, s.coreY, "#00f2fe", 45, 12);
    }
  },

  gameOver() {
    this.state.isGameOver = true;
    AudioEngine.play('hit');
    FX.triggerShake(24, 18);
    FX.spawnParticles(this.state.coreX, this.state.coreY, "#ff0055", 40, 10);
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
    if (!this.state.isStarted) { this.state.isStarted = true; return; }
    if (this.state.isGameOver) { this.init(); return; }
    this.triggerEMP();
  },

  render(ctx) {
    const s = this.state;

    // Arena Canvas Dark Background
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#01070e");
    bg.addColorStop(1, "#031521");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Tactical Radar Rings
    ctx.strokeStyle = "rgba(0, 242, 254, 0.06)";
    ctx.lineWidth = 1;
    for (let r = 80; r < 400; r += 80) {
      ctx.beginPath();
      ctx.arc(s.coreX, s.coreY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Render Data Orbs
    for (let o of s.expOrbs) {
      ctx.save();
      ctx.fillStyle = "#ffea00";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#ffea00";
      ctx.beginPath();
      ctx.arc(o.x, o.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Plasma Bolts
    for (let p of s.plasmaBolts) {
      ctx.save();
      ctx.fillStyle = "#00ff66";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#00ff66";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Enemies
    for (let e of s.enemies) {
      ctx.save();
      ctx.fillStyle = "#ff0055";
      ctx.shadowBlur = 14;
      ctx.shadowColor = "#ff0055";
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Swarm Orbit Drones
    for (let i = 0; i < s.orbitDrones; i++) {
      const angle = s.droneAngle + (i * (Math.PI * 2 / s.orbitDrones));
      const dx = s.coreX + Math.cos(angle) * 48;
      const dy = s.coreY + Math.sin(angle) * 48;

      ctx.save();
      ctx.fillStyle = "#00f2fe";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00f2fe";
      ctx.beginPath();
      ctx.arc(dx, dy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Main Core
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 22;
    ctx.shadowColor = "#00ff66";
    ctx.beginPath();
    ctx.arc(s.coreX, s.coreY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#00ff66";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // UI Status
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px 'Orbitron', monospace";
    ctx.fillText("Skor: " + s.score, 35, 65);

    ctx.fillStyle = "#00ff66";
    ctx.font = "bold 20px 'Rajdhani', sans-serif";
    ctx.fillText(`WAVE: ${s.wave} | DRONES: ${s.orbitDrones}x | REKOR: ${s.highScore}`, 35, 95);

    // HP Bar
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(35, 115, 200, 10);
    ctx.fillStyle = s.hp > 30 ? "#00ff66" : "#ff0055";
    ctx.fillRect(35, 115, 200 * (Math.max(0, s.hp) / s.maxHp), 10);

    // EMP Status
    if (s.empCooldown > 0) {
      ctx.fillStyle = "#ffeb3b";
      ctx.font = "bold 18px 'Rajdhani', sans-serif";
      ctx.fillText(`⏳ Nova Cooldown: ${s.empCooldown.toFixed(1)}s`, canvas.width - 220, 65);
    } else {
      ctx.fillStyle = "#00f2fe";
      ctx.font = "bold 18px 'Rajdhani', sans-serif";
      ctx.fillText("💥 NOVA READY (Spasi)", canvas.width - 220, 65);
    }

    if (!s.isStarted) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff66";
      ctx.font = "bold 44px 'Orbitron', monospace";
      ctx.fillText("CYBER SWARM", 160, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText("Sentuh / Tekan SPASI untuk Mulai", 180, 540);
    } else if (s.isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff0055";
      ctx.font = "bold 54px 'Orbitron', monospace";
      ctx.fillText("CORE BREACHED", 140, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px 'Rajdhani', sans-serif";
      ctx.fillText("Skor Akhir: " + s.score, 250, 540);
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText("Tekan SPASI untuk Restart", 210, 600);
    }
  }
};

registerScene('swarm', SwarmGame);