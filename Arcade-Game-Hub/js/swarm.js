// =================================================================
// 👾 CYBER SWARM: CODE BREAKER (Reverse Tower Defense / Swarm)
// Controls: Pointer (Follow), F (Switch Formation), Space (EMP)
// =================================================================

const SwarmGame = {
  instruction: "Gerakkan: <b>Kursor / Sentuh Layar</b> | Formasi: <b>F / Tap Bawah</b> | EMP: <b>SPASI</b>",
  state: {},

  init() {
    const savedHighScore = localStorage.getItem("swarm_high_score") || 0;
    this.state = {
      // Core Virus Position
      coreX: canvas.width / 2,
      coreY: canvas.height - 200,
      targetX: canvas.width / 2,
      targetY: canvas.height - 200,

      // Kawanan Nano-Bots (Boids)
      bots: [],
      maxBots: 40,
      formation: 'NEEDLE', // 'NEEDLE' (Fokus Serang) atau 'ORBIT' (Perisai Melingkar)
      orbitAngle: 0,

      // Mainframe Nodes & Antivirus Lasers
      nodes: [],
      turrets: [],
      lasers: [],
      
      score: 0,
      highScore: parseInt(savedHighScore),
      dataHarvested: 0,
      layer: 1,
      empCooldown: 0,
      isStarted: false,
      isGameOver: false
    };

    // Inisialisasi kawanan awal (15 nano-bot)
    for (let i = 0; i < 15; i++) {
      this.state.bots.push({
        x: this.state.coreX + (Math.random() - 0.5) * 60,
        y: this.state.coreY + (Math.random() - 0.5) * 60,
        vx: 0,
        vy: 0
      });
    }

    this.spawnMainframeLayer();
  },

  spawnMainframeLayer() {
    const s = this.state;
    s.nodes = [];
    s.turrets = [];
    s.lasers = [];

    // Spawn 3-5 Data Nodes yang harus diretas
    const nodeCount = 3 + s.layer;
    for (let i = 0; i < nodeCount; i++) {
      s.nodes.push({
        x: 100 + Math.random() * (canvas.width - 200),
        y: 120 + Math.random() * 320,
        radius: 26,
        hp: 100,
        maxHp: 100,
        dataValue: 50 * s.layer
      });
    }

    // Spawn Antivirus Firewall Turrets
    const turretCount = Math.min(4, s.layer + 1);
    for (let i = 0; i < turretCount; i++) {
      s.turrets.push({
        x: (canvas.width / (turretCount + 1)) * (i + 1),
        y: 80,
        shootTimer: Math.random() * 1.5,
        shootInterval: Math.max(1.0, 2.2 - s.layer * 0.15)
      });
    }
  },

  update(dt) {
    const s = this.state;
    if (!s.isStarted || s.isGameOver) return;

    if (s.empCooldown > 0) s.empCooldown -= dt;

    // Gerakkan Core mendekati Target Mouse/Touch
    s.coreX += (s.targetX - s.coreX) * 8 * dt;
    s.coreY += (s.targetY - s.coreY) * 8 * dt;

    // Logika Formasi Kawanan Nano-Bots
    s.orbitAngle += 4 * dt;
    const botCount = s.bots.length;

    for (let i = 0; i < botCount; i++) {
      const b = s.bots[i];
      let targetX, targetY;

      if (s.formation === 'ORBIT') {
        // Formasi Cincin Perisai Berputar
        const angle = s.orbitAngle + (i * (Math.PI * 2 / botCount));
        const radius = 55;
        targetX = s.coreX + Math.cos(angle) * radius;
        targetY = s.coreY + Math.sin(angle) * radius;
      } else {
        // Formasi Jarum Menusuk (Needle Strike)
        const spread = (i - botCount / 2) * 6;
        targetX = s.coreX + spread;
        targetY = s.coreY - 40 - (i % 4) * 15;
      }

      // Fisika Spring Attraction
      b.vx += (targetX - b.x) * 18 * dt;
      b.vy += (targetY - b.y) * 18 * dt;
      b.vx *= 0.85;
      b.vy *= 0.85;
      b.x += b.vx;
      b.y += b.vy;
    }

    // Turret Menembakkan Laser Antivirus
    for (let t of s.turrets) {
      t.shootTimer += dt;
      if (t.shootTimer >= t.shootInterval) {
        t.shootTimer = 0;
        const angle = Math.atan2(s.coreY - t.y, s.coreX - t.x);
        s.lasers.push({
          x: t.x,
          y: t.y,
          vx: Math.cos(angle) * 320,
          vy: Math.sin(angle) * 320
        });
        AudioEngine.playTone(600, 'sawtooth', 0.08, 0.1);
      }
    }

    // Update Laser & Deteksi Tabrakan
    for (let i = s.lasers.length - 1; i >= 0; i--) {
      const l = s.lasers[i];
      l.x += l.vx * dt;
      l.y += l.vy * dt;

      // Cek apakah laser dihadang oleh formasi ORBIT kawanan
      let blocked = false;
      if (s.formation === 'ORBIT') {
        for (let b of s.bots) {
          if (Math.hypot(l.x - b.x, l.y - b.y) < 18) {
            blocked = true;
            FX.spawnParticles(b.x, b.y, "#00ff66", 8, 4);
            AudioEngine.playTone(400, 'triangle', 0.05, 0.1);
            break;
          }
        }
      }

      if (blocked) {
        s.lasers.splice(i, 1);
        continue;
      }

      // Laser Menusuk Inti Virus (Damage Core)
      if (Math.hypot(l.x - s.coreX, l.y - s.coreY) < 22) {
        s.lasers.splice(i, 1);
        if (s.bots.length > 3) {
          // Kurangi 2 bot kawanan
          s.bots.splice(0, 2);
          AudioEngine.play('hit');
          FX.triggerShake(12, 8);
          FX.spawnParticles(s.coreX, s.coreY, "#ff0055", 15, 6);
        } else {
          this.gameOver();
          return;
        }
        continue;
      }

      if (l.y > canvas.height || l.x < 0 || l.x > canvas.width) {
        s.lasers.splice(i, 1);
      }
    }

    // Retas Data Nodes Menggunakan Kawanan Bot
    let allHacked = true;
    for (let n of s.nodes) {
      if (n.hp > 0) {
        allHacked = false;
        // Hitung berapa banyak bot yang menyentuh node
        for (let b of s.bots) {
          if (Math.hypot(b.x - n.x, b.y - n.y) < n.radius + 10) {
            const damage = (s.formation === 'NEEDLE' ? 45 : 15) * dt;
            n.hp -= damage;

            if (Math.random() < 0.2) {
              FX.spawnParticles(b.x, b.y, "#00f2fe", 2, 2);
            }

            if (n.hp <= 0) {
              n.hp = 0;
              s.score += n.dataValue;
              s.dataHarvested += n.dataValue;
              AudioEngine.playArpeggio(s.layer);
              FX.triggerShake(8, 8);
              FX.spawnParticles(n.x, n.y, "#00ff66", 25, 7);
              FX.spawnText(n.x, n.y, `+${n.dataValue} KB`, "#00ff66");

              // Duplikasi bot virus (Reward peretasan)
              if (s.bots.length < s.maxBots) {
                s.bots.push({ x: n.x, y: n.y, vx: 0, vy: 0 });
                s.bots.push({ x: n.x, y: n.y, vx: 0, vy: 0 });
              }

              if (s.score > s.highScore) {
                s.highScore = s.score;
                localStorage.setItem("swarm_high_score", s.highScore);
              }
              break;
            }
          }
        }
      }
    }

    // Jika seluruh node lapisan ini jebol, masuki layer berikutnya
    if (allHacked && s.nodes.length > 0) {
      s.layer++;
      AudioEngine.playTone(523.25, 'triangle', 0.4, 0.25);
      FX.triggerShake(16, 12);
      FX.spawnText(canvas.width / 2 - 120, canvas.height / 2, `LAYER ${s.layer} BREACHED!`, "#00f2fe");
      setTimeout(() => this.spawnMainframeLayer(), 600);
    }
  },

  triggerEMP() {
    const s = this.state;
    if (s.empCooldown <= 0 && s.isStarted && !s.isGameOver) {
      s.empCooldown = 5.0; // Cooldown 5 detik
      s.lasers = []; // Bersihkan semua laser musuh di layar
      AudioEngine.playTone(180, 'sawtooth', 0.5, 0.3);
      FX.triggerShake(20, 15);
      FX.spawnText(s.coreX - 40, s.coreY - 40, "EMP BURST!", "#00f2fe");
      FX.spawnParticles(s.coreX, s.coreY, "#00f2fe", 40, 10);
    }
  },

  switchFormation() {
    const s = this.state;
    s.formation = s.formation === 'NEEDLE' ? 'ORBIT' : 'NEEDLE';
    AudioEngine.playTone(s.formation === 'NEEDLE' ? 700 : 350, 'sine', 0.1, 0.15);
    FX.spawnText(s.coreX - 40, s.coreY - 30, s.formation, s.formation === 'NEEDLE' ? "#ffea00" : "#00ff66");
  },

  gameOver() {
    this.state.isGameOver = true;
    AudioEngine.play('hit');
    FX.triggerShake(24, 16);
    FX.spawnParticles(this.state.coreX, this.state.coreY, "#ff0055", 40, 10);
  },

  onKeyDown(e) {
    if (e.code === "Space") {
      if (!this.state.isStarted) this.state.isStarted = true;
      else if (this.state.isGameOver) this.init();
      else this.triggerEMP();
      e.preventDefault();
    }
    if (e.code === "KeyF") {
      this.switchFormation();
    }
  },

  onPointerDown(x, y) {
    const s = this.state;
    if (!s.isStarted) {
      s.isStarted = true;
      return;
    }
    if (s.isGameOver) {
      this.init();
      return;
    }

    // Jika tap di area bawah layar: ganti formasi
    if (y > canvas.height - 120) {
      this.switchFormation();
    } else {
      s.targetX = x;
      s.targetY = y;
    }
  },

  render(ctx) {
    const s = this.state;

    // Latar Belakang Mainframe Server Matrix
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, "#01080e");
    bgGrad.addColorStop(1, "#03141f");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid Server Sirkuit
    ctx.strokeStyle = "rgba(0, 242, 254, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 45) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 45) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Render Data Nodes
    for (let n of s.nodes) {
      ctx.save();
      const pct = n.hp / n.maxHp;
      ctx.shadowBlur = n.hp > 0 ? 20 : 0;
      ctx.shadowColor = "#00f2fe";

      // Lingkaran Node
      ctx.strokeStyle = n.hp > 0 ? "#00f2fe" : "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (n.hp > 0) {
        ctx.fillStyle = `rgba(0, 242, 254, ${pct * 0.4 + 0.1})`;
        ctx.fill();
        // Sisa HP Data Ring
        ctx.strokeStyle = "#00ff66";
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render Turret Antivirus
    for (let t of s.turrets) {
      ctx.save();
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ff0055";
      ctx.fillStyle = "#ff0055";
      ctx.fillRect(t.x - 18, t.y - 10, 36, 20);
      ctx.strokeStyle = "#ffffff";
      ctx.strokeRect(t.x - 18, t.y - 10, 36, 20);
      ctx.restore();
    }

    // Render Laser Antivirus Merah
    ctx.save();
    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff0055";
    for (let l of s.lasers) {
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x - l.vx * 0.05, l.y - l.vy * 0.05);
      ctx.stroke();
    }
    ctx.restore();

    // Render Kawanan Nano-Bots (Boids Virus)
    for (let b of s.bots) {
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = s.formation === 'NEEDLE' ? "#ffea00" : "#00ff66";
      ctx.fillStyle = s.formation === 'NEEDLE' ? "#ffea00" : "#00ff66";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Core Virus Utama
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#00f2fe";
    ctx.fillStyle = "#00f2fe";
    ctx.beginPath();
    ctx.arc(s.coreX, s.coreY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // UI Status
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px 'Orbitron', monospace";
    ctx.fillText("Skor: " + s.score, 35, 65);

    ctx.fillStyle = "#00ff66";
    ctx.font = "bold 20px 'Rajdhani', sans-serif";
    ctx.fillText(`SWARM: ${s.bots.length} UNITS | FORMASI: ${s.formation}`, 35, 100);

    if (s.empCooldown > 0) {
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText(`⏳ EMP Cooldown: ${s.empCooldown.toFixed(1)}s`, 35, 135);
    } else {
      ctx.fillStyle = "#00f2fe";
      ctx.fillText("💥 EMP READY (Spasi)", 35, 135);
    }

    if (!s.isStarted) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff66";
      ctx.font = "bold 44px 'Orbitron', monospace";
      ctx.fillText("CYBER SWARM", 165, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText("Tekan SPASI / Sentuh untuk Mulai", 185, 540);
    } else if (s.isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff0055";
      ctx.font = "bold 56px 'Orbitron', monospace";
      ctx.fillText("SYSTEM PURGED", 130, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px 'Rajdhani', sans-serif";
      ctx.fillText("Data Harvested: " + s.score + " KB", 215, 540);
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText("Tekan SPASI untuk Reboot", 215, 600);
    }
  }
};

registerScene('swarm', SwarmGame);