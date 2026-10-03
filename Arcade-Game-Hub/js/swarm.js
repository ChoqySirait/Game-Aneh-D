// =================================================================
// 👾 CYBER SWARM: ROGUE SURVIVOR PROTOCOL (ACTION OVERHAUL)
// Features: Tesla Chain Lightning, Micro Seeking Missiles,
//           Trojan Virus Boss, Dynamic Swarm Wings & Level Upgrades
// =================================================================

const SwarmGame = {
  instruction: "Kendali Inti: <b>Arahkan Pointer / Sentuh</b> | Ledakan Nova EMP: <b>SPASI / Klik Layar</b>",
  state: {},

  init() {
    const savedHighScore = localStorage.getItem("swarm_high_score") || 0;
    this.state = {
      // Inti Komando Nano
      coreX: canvas.width / 2,
      coreY: canvas.height / 2 + 150,
      targetX: canvas.width / 2,
      targetY: canvas.height / 2 + 150,
      hp: 120, maxHp: 120,
      level: 1, exp: 0, expNeeded: 60,

      // Drone Pengawal & Senjata Tesla
      drones: 4,
      droneAngle: 0,
      teslaTimer: 0,
      missileTimer: 0,
      lightningArcs: [],
      missiles: [],

      // Musuh Beragam (Antivirus & Trojan)
      enemies: [],
      spawnTimer: 0,
      wave: 1,

      // Drops & Skor
      dataOrbs: [],
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

    // Gerakan Inti Mengikuti Kursor Secara Halus
    s.coreX += (s.targetX - s.coreX) * 9 * dt;
    s.coreY += (s.targetY - s.coreY) * 9 * dt;
    s.coreX = Math.max(30, Math.min(canvas.width - 30, s.coreX));
    s.coreY = Math.max(30, Math.min(canvas.height - 30, s.coreY));

    // Rotasi Drone Pengawal
    s.droneAngle += 3.2 * dt;

    // 1. SENJATA TESLA CHAIN LIGHTNING (Sengatan Petir Otomatis)
    s.teslaTimer += dt;
    if (s.teslaTimer >= 0.22 && s.enemies.length > 0) {
      s.teslaTimer = 0;

      // Cari musuh terdekat dalam jangkauan 420px
      let target = null;
      let minD = 420;
      for (let e of s.enemies) {
        const d = Math.hypot(e.x - s.coreX, e.y - s.coreY);
        if (d < minD) { minD = d; target = e; }
      }

      if (target) {
        target.hp -= 28 + s.level * 4;
        AudioEngine.playTone(750, 'sawtooth', 0.04, 0.07);
        s.lightningArcs.push({
          x1: s.coreX, y1: s.coreY, x2: target.x, y2: target.y,
          color: "#00f2fe", life: 0.1
        });
        FX.spawnParticles(target.x, target.y, "#00f2fe", 4, 3);

        // Petir Melompat ke Musuh Kedua (Chain Effect)
        for (let other of s.enemies) {
          if (other !== target && Math.hypot(other.x - target.x, other.y - target.y) < 180) {
            other.hp -= 18;
            s.lightningArcs.push({
              x1: target.x, y1: target.y, x2: other.x, y2: other.y,
              color: "#00ff66", life: 0.1
            });
            break;
          }
        }
      }
    }

    // 2. PELUNCUR ROKET MIKRO (Setiap 1.4 Detik)
    s.missileTimer += dt;
    if (s.missileTimer >= 1.4 && s.enemies.length > 0) {
      s.missileTimer = 0;
      for (let i = 0; i < Math.min(6, 2 + Math.floor(s.level / 2)); i++) {
        const ang = (i / 4) * Math.PI * 2;
        s.missiles.push({
          x: s.coreX, y: s.coreY,
          vx: Math.cos(ang) * 180, vy: Math.sin(ang) * 180,
          target: s.enemies[Math.floor(Math.random() * s.enemies.length)],
          life: 2.0
        });
      }
      AudioEngine.playTone(320, 'triangle', 0.08, 0.12);
    }

    // Update Roket Mikro Kendali
    for (let i = s.missiles.length - 1; i >= 0; i--) {
      const m = s.missiles[i];
      m.life -= dt;

      if (m.target && !m.target.isDead) {
        const toTarget = Math.atan2(m.target.y - m.y, m.target.x - m.x);
        m.vx += Math.cos(toTarget) * 750 * dt;
        m.vy += Math.sin(toTarget) * 750 * dt;
      }
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      // Jejak Asap Roket
      if (Math.random() < 0.3) FX.spawnParticles(m.x, m.y, "#ff9800", 1, 1);

      // Tabrakan Roket dengan Musuh
      let hit = false;
      for (let e of s.enemies) {
        if (Math.hypot(m.x - e.x, m.y - e.y) < e.radius + 8) {
          e.hp -= 55;
          hit = true;
          AudioEngine.playTone(180, 'sawtooth', 0.08, 0.15);
          FX.triggerShake(5, 4);
          FX.spawnParticles(m.x, m.y, "#ff3d00", 12, 5);
          break;
        }
      }

      if (hit || m.life <= 0) s.missiles.splice(i, 1);
    }

    // Update Lightning Arc Life
    for (let i = s.lightningArcs.length - 1; i >= 0; i--) {
      s.lightningArcs[i].life -= dt;
      if (s.lightningArcs[i].life <= 0) s.lightningArcs.splice(i, 1);
    }

    // 3. SPAWNING MUSUH BERAGAM & GELOMBANG TROJAN
    s.spawnTimer += dt;
    const interval = Math.max(0.35, 1.3 - s.wave * 0.08);
    if (s.spawnTimer >= interval) {
      s.spawnTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 420;
      const isTrojan = Math.random() < 0.18; // Musuh Tanker Raksasa

      s.enemies.push({
        x: s.coreX + Math.cos(angle) * dist,
        y: s.coreY + Math.sin(angle) * dist,
        radius: isTrojan ? 28 : 16,
        hp: isTrojan ? 160 : 45,
        maxHp: isTrojan ? 160 : 45,
        speed: isTrojan ? 90 : 160 + s.wave * 10,
        type: isTrojan ? 'TROJAN' : 'VIRUS',
        isDead: false
      });
    }

    // Update Gerakan Musuh
    for (let i = s.enemies.length - 1; i >= 0; i--) {
      const e = s.enemies[i];
      const toCore = Math.atan2(s.coreY - e.y, s.coreX - e.x);
      e.x += Math.cos(toCore) * e.speed * dt;
      e.y += Math.sin(toCore) * e.speed * dt;

      // Tabrak Inti Pemain
      if (Math.hypot(e.x - s.coreX, e.y - s.coreY) < e.radius + 18) {
        s.hp -= 18;
        AudioEngine.play('hit');
        FX.triggerShake(12, 8);
        FX.spawnParticles(s.coreX, s.coreY, "#ff0055", 14, 5);
        s.enemies.splice(i, 1);

        if (s.hp <= 0) {
          this.gameOver();
          return;
        }
        continue;
      }

      // Musuh Hancur
      if (e.hp <= 0) {
        e.isDead = true;
        s.score += e.type === 'TROJAN' ? 60 : 20;
        s.dataOrbs.push({ x: e.x, y: e.y, value: e.type === 'TROJAN' ? 40 : 15 });
        FX.triggerShake(5, 4);
        FX.spawnParticles(e.x, e.y, "#ff0055", 16, 5);
        s.enemies.splice(i, 1);

        if (s.score > s.highScore) {
          s.highScore = s.score;
          localStorage.setItem("swarm_high_score", s.highScore);
        }
      }
    }

    // Magnet Penarik Data Orbs (EXP)
    for (let i = s.dataOrbs.length - 1; i >= 0; i--) {
      const orb = s.dataOrbs[i];
      const d = Math.hypot(s.coreX - orb.x, s.coreY - orb.y);
      if (d < 180) {
        orb.x += (s.coreX - orb.x) * 11 * dt;
        orb.y += (s.coreY - orb.y) * 11 * dt;
      }
      if (d < 24) {
        s.exp += orb.value;
        s.dataOrbs.splice(i, 1);
        AudioEngine.playTone(900, 'sine', 0.03, 0.04);

        // NAIK LEVEL & UPGRADE DRONE
        if (s.exp >= s.expNeeded) {
          s.exp -= s.expNeeded;
          s.level++;
          s.expNeeded = Math.floor(s.expNeeded * 1.45);
          s.wave = Math.floor(s.level / 2) + 1;
          if (s.drones < 10) s.drones++; // Tambah 1 drone pengawal tiap naik level!
          s.hp = Math.min(s.maxHp, s.hp + 20);

          AudioEngine.playArpeggio(s.level);
          FX.triggerShake(10, 8);
          FX.spawnText(s.coreX - 60, s.coreY - 45, `LEVEL UP! +DRONE (LV.${s.level})`, "#00ff66");
        }
      }
    }
  },

  triggerEMP() {
    const s = this.state;
    if (s.empCooldown <= 0 && s.isStarted && !s.isGameOver) {
      s.empCooldown = 5.0;
      for (let e of s.enemies) e.hp -= 150;
      AudioEngine.playTone(160, 'sawtooth', 0.5, 0.3);
      FX.triggerShake(22, 16);
      FX.spawnText(s.coreX - 55, s.coreY - 50, "NOVA EMP BLAST!", "#00f2fe");
      FX.spawnParticles(s.coreX, s.coreY, "#00f2fe", 45, 10);
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
      else if (this.state.isGameOver) { this.init(); this.state.isStarted = true; }
      else this.triggerEMP();
      e.preventDefault();
    }
  },

  onPointerDown(x, y) {
    if (!this.state.isStarted) { this.state.isStarted = true; return; }
    if (this.state.isGameOver) { this.init(); this.state.isStarted = true; return; }
    this.triggerEMP();
  },

  render(ctx) {
    const s = this.state;

    // Background Gelap Sirkuit Siber
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#010811");
    bg.addColorStop(1, "#041424");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dynamic Radar Pulse Rings
    ctx.strokeStyle = "rgba(0, 242, 254, 0.05)";
    ctx.lineWidth = 1;
    for (let r = 80; r < 480; r += 80) {
      ctx.beginPath();
      ctx.arc(s.coreX, s.coreY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Render Lightning Arcs (Petir Tesla)
    for (let arc of s.lightningArcs) {
      ctx.save();
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 15;
      ctx.shadowColor = arc.color;
      ctx.beginPath();
      ctx.moveTo(arc.x1, arc.y1);
      // Zigzag petir
      const midX = (arc.x1 + arc.x2) / 2 + (Math.random() - 0.5) * 20;
      const midY = (arc.y1 + arc.y2) / 2 + (Math.random() - 0.5) * 20;
      ctx.lineTo(midX, midY);
      ctx.lineTo(arc.x2, arc.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Render Roket Mikro
    for (let m of s.missiles) {
      ctx.save();
      ctx.fillStyle = "#ff9800";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ff9800";
      ctx.beginPath();
      ctx.arc(m.x, m.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Data Orbs
    for (let o of s.dataOrbs) {
      ctx.save();
      ctx.fillStyle = "#ffea00";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#ffea00";
      ctx.beginPath();
      ctx.arc(o.x, o.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Musuh
    for (let e of s.enemies) {
      ctx.save();
      if (e.type === 'TROJAN') {
        // Musuh Tanker Trojan
        ctx.fillStyle = "#ff0055";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 16;
        ctx.shadowColor = "#ff0055";
        ctx.strokeRect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
        ctx.fillRect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
      } else {
        // Virus Swarm Biasa
        ctx.fillStyle = "#ff1744";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ff1744";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Render Drone Pengawal Berotasi Mengitari Inti
    for (let i = 0; i < s.drones; i++) {
      const angle = s.droneAngle + (i * (Math.PI * 2 / s.drones));
      const dx = s.coreX + Math.cos(angle) * 52;
      const dy = s.coreY + Math.sin(angle) * 52;

      ctx.save();
      ctx.fillStyle = "#00f2fe";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#00f2fe";
      ctx.beginPath();
      ctx.arc(dx, dy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Garis Koneksi Energi ke Inti
      ctx.strokeStyle = "rgba(0, 242, 254, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.coreX, s.coreY);
      ctx.lineTo(dx, dy);
      ctx.stroke();
      ctx.restore();
    }

    // Render Inti Komando Pemain
    ctx.save();
    ctx.fillStyle = "#00ff66";
    ctx.shadowBlur = 24;
    ctx.shadowColor = "#00ff66";
    ctx.beginPath();
    ctx.arc(s.coreX, s.coreY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // UI Status Atas
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px 'Orbitron', monospace";
    ctx.fillText("Skor: " + s.score, 35, 65);

    ctx.fillStyle = "#00ff66";
    ctx.font = "bold 20px 'Rajdhani', sans-serif";
    ctx.fillText(`LEVEL: ${s.level} | DRONE: ${s.drones}x | GELOMBANG: ${s.wave}`, 35, 95);

    // HP Bar
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(35, 115, 200, 10);
    ctx.fillStyle = s.hp > 30 ? "#00ff66" : "#ff0055";
    ctx.fillRect(35, 115, 200 * (Math.max(0, s.hp) / s.maxHp), 10);

    // EXP Bar Bawah
    ctx.fillStyle = "rgba(0, 242, 254, 0.15)";
    ctx.fillRect(0, canvas.height - 8, canvas.width, 8);
    ctx.fillStyle = "#00f2fe";
    ctx.fillRect(0, canvas.height - 8, canvas.width * (s.exp / s.expNeeded), 8);

    // Status Cooldown EMP
    if (s.empCooldown > 0) {
      ctx.fillStyle = "#ffeb3b";
      ctx.font = "bold 18px 'Rajdhani', sans-serif";
      ctx.fillText(`⏳ Nova Cooldown: ${s.empCooldown.toFixed(1)}s`, canvas.width - 230, 65);
    } else {
      ctx.fillStyle = "#00f2fe";
      ctx.font = "bold 18px 'Rajdhani', sans-serif";
      ctx.fillText("💥 NOVA SIAP (SPASI)", canvas.width - 230, 65);
    }

    // Layar Mulai / Game Over
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
      ctx.font = "bold 52px 'Orbitron', monospace";
      ctx.fillText("SYSTEM PURGED", 140, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px 'Rajdhani', sans-serif";
      ctx.fillText("Skor Akhir: " + s.score, 250, 540);
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText("Tekan SPASI untuk Reboot", 210, 600);
    }
  }
};

registerScene('swarm', SwarmGame);