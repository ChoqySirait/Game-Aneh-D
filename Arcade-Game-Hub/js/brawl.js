// =================================================================
// ⚔️ CYBERBRAWL 2D: MILITARY STICKMAN WARZONE
// =================================================================

const BrawlGame = {
  instruction: "Gerak: <b>WASD</b> | Bidik: <b>Kursor Mouse</b> | Tembak: <b>Klik Kiri</b> | Sprint: <b>SPASI</b>",
  state: {},

  init() {
    this.state = {
      worldWidth: 2400,
      worldHeight: 2400,
      camX: 1200,
      camY: 1200,

      // --- KARAKTER UTAMA (SPEC-OPS STICKMAN) ---
      player: {
        x: 1200, y: 1200, radius: 18, speed: 320, angle: 0,
        hp: 100, maxHp: 100, level: 1, exp: 0, expNeeded: 100,
        dashCooldown: 0, shootCooldown: 0, kills: 0, isDead: false,
        walkCycle: 0, isMoving: false
      },

      // --- 9 BOT TENTARA MUSUH (MERCENARY STICKMEN) ---
      bots: [],
      botNames: ["KAPTEN_REZA", "SNIPER_BAYU", "SERSAN_DIMAS", "COMMANDO_EKO", "GHOST_RIDER", "COBRA_ONE", "BRAVO_LEADER", "ALPHA_STRIKE", "DELTA_FORCE"],

      bullets: [],
      shells: [], // Selongsong peluru yang terlempar

      // Rintangan Karung Pasir Militer (Sandbags)
      sandbags: [
        { x: 900, y: 900, w: 120, h: 35 },
        { x: 1380, y: 900, w: 120, h: 35 },
        { x: 900, y: 1460, w: 120, h: 35 },
        { x: 1380, y: 1460, w: 120, h: 35 },
        { x: 600, y: 1200, w: 35, h: 120 },
        { x: 1760, y: 1200, w: 35, h: 120 }
      ],

      // Peti Amunisi Kayu
      crates: [
        { x: 800, y: 800, hp: 50, maxHp: 50, size: 40 },
        { x: 1600, y: 800, hp: 50, maxHp: 50, size: 40 },
        { x: 800, y: 1600, hp: 50, maxHp: 50, size: 40 },
        { x: 1600, y: 1600, hp: 50, maxHp: 50, size: 40 },
        { x: 1200, y: 1050, hp: 70, maxHp: 70, size: 45 },
        { x: 1200, y: 1350, hp: 70, maxHp: 70, size: 45 }
      ],

      // Semak Kamuflase Hutan
      bushes: [
        { x: 700, y: 700, radius: 95 },
        { x: 1700, y: 700, radius: 95 },
        { x: 700, y: 1700, radius: 95 },
        { x: 1700, y: 1700, radius: 95 },
        { x: 1200, y: 1200, radius: 125 }
      ],

      // Firewall Gas Beracun (Zone)
      zoneX: 1200, zoneY: 1200, zoneRadius: 1350, targetRadius: 1350,
      zoneTimer: 25, isShrinking: false,

      keys: {},
      mouseWorldX: 1200, mouseWorldY: 1200,
      aliveCount: 10
    };

    // Spawn 9 Bot Tentara di Sekitar Arena
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const dist = 650 + Math.random() * 400;
      this.state.bots.push({
        id: `bot_${i}`,
        name: this.state.botNames[i],
        x: 1200 + Math.cos(angle) * dist,
        y: 1200 + Math.sin(angle) * dist,
        radius: 18,
        speed: 240 + Math.random() * 50,
        angle: Math.random() * Math.PI * 2,
        hp: 80, maxHp: 80,
        shootCooldown: Math.random() * 1.5,
        walkCycle: 0,
        isDead: false,
        target: null
      });
    }
  },

  onKeyDown(e) {
    this.state.keys[e.code] = true;
    if (e.code === "Space") this.triggerDash();
  },

  onKeyUp(e) {
    this.state.keys[e.code] = false;
  },

  onMouseMove(mouseX, mouseY) {
    const s = this.state;
    s.mouseWorldX = mouseX - canvas.width / 2 + s.camX;
    s.mouseWorldY = mouseY - canvas.height / 2 + s.camY;
  },

  onPointerDown(x, y) {
    this.playerShoot();
  },

  triggerDash() {
    const p = this.state.player;
    if (p.dashCooldown > 0 || p.isDead) return;
    p.dashCooldown = 3.0;
    p.x += Math.cos(p.angle) * 140;
    p.y += Math.sin(p.angle) * 140;
    AudioEngine.playTone(300, 'triangle', 0.1, 0.15);
    FX.spawnParticles(p.x, p.y, "#ffffff", 15, 4);
  },

  playerShoot() {
    const p = this.state.player;
    if (p.isDead || p.shootCooldown > 0) return;
    p.shootCooldown = 0.16; // Kecepatan tembak senapan serbu

    const muzzleX = p.x + Math.cos(p.angle) * 28;
    const muzzleY = p.y + Math.sin(p.angle) * 28;

    this.state.bullets.push({
      x: muzzleX, y: muzzleY,
      vx: Math.cos(p.angle) * 950,
      vy: Math.sin(p.angle) * 950,
      owner: 'player', damage: 25, life: 1.1, color: "#ffeb3b"
    });

    // Selongsong peluru terlempar ke kanan badan
    this.state.shells.push({
      x: p.x, y: p.y,
      vx: Math.cos(p.angle + Math.PI / 2) * (Math.random() * 60 + 30),
      vy: Math.sin(p.angle + Math.PI / 2) * (Math.random() * 60 + 30),
      life: 0.6
    });

    AudioEngine.playTone(180, 'sawtooth', 0.05, 0.12);
    FX.triggerShake(3, 3);
    FX.spawnParticles(muzzleX, muzzleY, "#ff9800", 4, 3); // Muzzle flash api
  },

  update(dt) {
    const s = this.state;
    const p = s.player;

    if (!p.isDead) {
      if (p.dashCooldown > 0) p.dashCooldown -= dt;
      if (p.shootCooldown > 0) p.shootCooldown -= dt;

      // Gerak WASD
      let mx = 0, my = 0;
      if (s.keys["KeyW"] || s.keys["ArrowUp"]) my -= 1;
      if (s.keys["KeyS"] || s.keys["ArrowDown"]) my += 1;
      if (s.keys["KeyA"] || s.keys["ArrowLeft"]) mx -= 1;
      if (s.keys["KeyD"] || s.keys["ArrowRight"]) mx += 1;

      p.isMoving = mx !== 0 || my !== 0;
      if (p.isMoving) {
        p.walkCycle += 14 * dt;
        if (mx !== 0 && my !== 0) { mx *= 0.7071; my *= 0.7071; }
        p.x += mx * p.speed * dt;
        p.y += my * p.speed * dt;
      }

      p.x = Math.max(p.radius, Math.min(s.worldWidth - p.radius, p.x));
      p.y = Math.max(p.radius, Math.min(s.worldHeight - p.radius, p.y));
      p.angle = Math.atan2(s.mouseWorldY - p.y, s.mouseWorldX - p.x);

      s.camX += (p.x - s.camX) * 8 * dt;
      s.camY += (p.y - s.camY) * 8 * dt;
    }

    // Update Penyusutan Zona
    s.zoneTimer -= dt;
    if (s.zoneTimer <= 0) {
      s.isShrinking = true;
      s.targetRadius = Math.max(120, s.targetRadius - 280);
      s.zoneTimer = 22;
      FX.triggerShake(8, 6);
    }
    if (s.isShrinking && s.zoneRadius > s.targetRadius) {
      s.zoneRadius -= 40 * dt;
    }

    // Damage Luar Zona untuk Pemain
    if (Math.hypot(p.x - s.zoneX, p.y - s.zoneY) > s.zoneRadius && !p.isDead) {
      p.hp -= 8 * dt;
      FX.spawnParticles(p.x, p.y, "#ff0055", 1, 1);
      if (p.hp <= 0) p.isDead = true;
    }

    // Update AI Bot Tentara Musuh
    for (let b of s.bots) {
      if (b.isDead) continue;
      b.shootCooldown -= dt;

      // Cari Target Terdekat (Bisa Player atau Bot Lain)
      let target = null;
      let minD = 480;

      if (!p.isDead) {
        const dp = Math.hypot(p.x - b.x, p.y - b.y);
        if (dp < minD) { minD = dp; target = p; }
      }
      for (let other of s.bots) {
        if (other !== b && !other.isDead) {
          const d = Math.hypot(other.x - b.x, other.y - b.y);
          if (d < minD) { minD = d; target = other; }
        }
      }

      if (target) {
        b.angle = Math.atan2(target.y - b.y, target.x - b.x);
        // Menembak Target
        if (b.shootCooldown <= 0) {
          b.shootCooldown = 0.45;
          const spread = (Math.random() - 0.5) * 0.18; // Akurasi realistis
          s.bullets.push({
            x: b.x + Math.cos(b.angle) * 26,
            y: b.y + Math.sin(b.angle) * 26,
            vx: Math.cos(b.angle + spread) * 780,
            vy: Math.sin(b.angle + spread) * 780,
            owner: b.id, damage: 16, life: 1.0, color: "#ff5722"
          });
          AudioEngine.playTone(160, 'sawtooth', 0.04, 0.08);
        }

        // Strafing / Gerak Taktis mendekat
        if (minD > 200) {
          b.walkCycle += 10 * dt;
          b.x += Math.cos(b.angle) * b.speed * dt;
          b.y += Math.sin(b.angle) * b.speed * dt;
        }
      } else {
        // Patroli menuju ke arah pusat lingkaran
        const centerAngle = Math.atan2(s.zoneY - b.y, s.zoneX - b.x);
        b.angle = centerAngle;
        b.walkCycle += 8 * dt;
        b.x += Math.cos(centerAngle) * (b.speed * 0.6) * dt;
        b.y += Math.sin(centerAngle) * (b.speed * 0.6) * dt;
      }

      // Damage Luar Zona untuk Bot
      if (Math.hypot(b.x - s.zoneX, b.y - s.zoneY) > s.zoneRadius) {
        b.hp -= 10 * dt;
        if (b.hp <= 0) b.isDead = true;
      }
    }

    // Update Peluru & Tabrakan
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const bl = s.bullets[i];
      bl.x += bl.vx * dt;
      bl.y += bl.vy * dt;
      bl.life -= dt;

      // Tabrak Karung Pasir
      for (let sb of s.sandbags) {
        if (bl.x > sb.x && bl.x < sb.x + sb.w && bl.y > sb.y && bl.y < sb.y + sb.h) {
          bl.life = 0;
          FX.spawnParticles(bl.x, bl.y, "#d7ccc8", 4, 2);
          break;
        }
      }

      // Tabrak Pemain
      if (bl.owner !== 'player' && !p.isDead) {
        if (Math.hypot(bl.x - p.x, bl.y - p.y) < p.radius + 4) {
          p.hp -= bl.damage;
          bl.life = 0;
          AudioEngine.play('hit');
          FX.triggerShake(7, 5);
          FX.spawnParticles(p.x, p.y, "#d50000", 8, 4); // Darah
          if (p.hp <= 0) p.isDead = true;
        }
      }

      // Tabrak Bot
      for (let b of s.bots) {
        if (!b.isDead && bl.owner !== b.id) {
          if (Math.hypot(bl.x - b.x, bl.y - b.y) < b.radius + 4) {
            b.hp -= bl.damage;
            bl.life = 0;
            FX.spawnParticles(b.x, b.y, "#d50000", 8, 4); // Darah
            if (b.hp <= 0) {
              b.isDead = true;
              if (bl.owner === 'player') {
                p.kills++;
                p.hp = Math.min(p.maxHp, p.hp + 25); // Bonus darah saat kill
                FX.spawnText(b.x, b.y, "KILL CONFIRMED!", "#00e676");
              }
            }
            break;
          }
        }
      }

      if (bl.life <= 0) s.bullets.splice(i, 1);
    }

    // Update Selongsong Peluru
    for (let i = s.shells.length - 1; i >= 0; i--) {
      const sh = s.shells[i];
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
      sh.life -= dt;
      if (sh.life <= 0) s.shells.splice(i, 1);
    }

    // Update Status HUD
    s.aliveCount = (p.isDead ? 0 : 1) + s.bots.filter(b => !b.isDead).length;
    const hpBar = document.getElementById("brawlHpBar");
    const hpText = document.getElementById("brawlHpText");
    const aliveEl = document.getElementById("brawlAlive");
    const killsEl = document.getElementById("brawlKills");

    if (hpBar) hpBar.style.width = Math.max(0, p.hp / p.maxHp * 100) + "%";
    if (hpText) hpText.innerText = `${Math.ceil(Math.max(0, p.hp))} / ${p.maxHp}`;
    if (aliveEl) aliveEl.innerText = s.aliveCount;
    if (killsEl) killsEl.innerText = p.kills;
  },

  // --- MENGGAMBAR STICKMAN PRAJURIT MILITER TAKTIS ---
  drawStickmanSoldier(ctx, x, y, angle, isMoving, walkCycle, vestColor, helmColor, isPlayer, inBush) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (inBush) ctx.globalAlpha = 0.45;

    // 1. Kaki Melangkah (Animasi Bergerak)
    const legOffset = isMoving ? Math.sin(walkCycle) * 7 : 0;
    ctx.fillStyle = "#1e1e1e"; // Sepatu lars hitam
    ctx.fillRect(-12 + legOffset, -14, 9, 6);
    ctx.fillRect(-12 - legOffset, 8, 9, 6);

    // 2. Rompi Taktis Militer (Body Armor)
    ctx.fillStyle = vestColor; // Hijau tentara (Player) / Loreng cokelat (Musuh)
    ctx.fillRect(-10, -10, 20, 20);
    ctx.fillStyle = "#1b2e1b";
    ctx.fillRect(-6, -8, 12, 16);

    // 3. Lengan Memegang Senapan Serbu (M4 Style)
    ctx.strokeStyle = "#d7ccc8"; // Warna kulit tangan
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    // Tangan kiri memegang laras
    ctx.beginPath();
    ctx.moveTo(-2, -9);
    ctx.lineTo(14, -7);
    ctx.lineTo(24, -2);
    ctx.stroke();

    // Tangan kanan memegang pelatuk
    ctx.beginPath();
    ctx.moveTo(-2, 9);
    ctx.lineTo(10, 7);
    ctx.lineTo(16, 2);
    ctx.stroke();

    // 4. Senapan Serbu Militer (Assault Rifle)
    ctx.fillStyle = "#212121";
    ctx.fillRect(8, -2.5, 24, 5); // Laras & Badan senapan
    ctx.fillStyle = "#000000";
    ctx.fillRect(14, 2, 6, 4);   // Magasin peluru
    ctx.fillStyle = "#424242";
    ctx.fillRect(30, -2, 3, 4);   // Ujung laras

    // 5. Kepala & Helm Tempur Militer (Kevlar)
    ctx.fillStyle = "#d7ccc8";
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    // Helm Tentara
    ctx.fillStyle = helmColor;
    ctx.beginPath();
    ctx.arc(-1, 0, 9, -Math.PI / 2, Math.PI / 2, true);
    ctx.fill();

    // Kacamata Taktis Goggles
    ctx.fillStyle = isPlayer ? "#00f2fe" : "#ffeb3b";
    ctx.fillRect(4, -5, 3, 10);

    ctx.restore();
  },

  render(ctx) {
    const s = this.state;
    const p = s.player;

    // Latar Tanah Medan Tempur (Dark Combat Zone)
    ctx.fillStyle = "#0c1017";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 - s.camX, canvas.height / 2 - s.camY);

    // 1. Grid Garis Medan Tempur
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= s.worldWidth; x += 100) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s.worldHeight); ctx.stroke();
    }
    for (let y = 0; y <= s.worldHeight; y += 100) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s.worldWidth, y); ctx.stroke();
    }

    // 2. Barikade Karung Pasir (Sandbags)
    for (let sb of s.sandbags) {
      ctx.save();
      ctx.fillStyle = "#5d4037";
      ctx.strokeStyle = "#8d6e63";
      ctx.lineWidth = 2;
      ctx.fillRect(sb.x, sb.y, sb.w, sb.h);
      ctx.strokeRect(sb.x, sb.y, sb.w, sb.h);
      ctx.restore();
    }

    // 3. Selongsong Peluru Jatuh
    for (let sh of s.shells) {
      ctx.fillStyle = "#ffd54f";
      ctx.fillRect(sh.x, sh.y, 3, 2);
    }

    // 4. Peluru Tracer Menembus Udara
    for (let bl of s.bullets) {
      ctx.save();
      ctx.strokeStyle = bl.color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 8;
      ctx.shadowColor = bl.color;
      ctx.beginPath();
      ctx.moveTo(bl.x, bl.y);
      ctx.lineTo(bl.x - bl.vx * 0.03, bl.y - bl.vy * 0.03);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Render Bot Tentara Musuh (Stickmen)
    for (let b of s.bots) {
      if (b.isDead) continue;
      const inBush = s.bushes.some(bush => Math.hypot(b.x - bush.x, b.y - bush.y) < bush.radius);
      this.drawStickmanSoldier(
        ctx, b.x, b.y, b.angle, true, b.walkCycle,
        "#4e342e", "#b71c1c", false, inBush
      );

      // HP Bar Bot
      const sPos = { x: b.x, y: b.y };
      const pct = Math.max(0, b.hp / b.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(sPos.x - 18, sPos.y - 24, 36, 4);
      ctx.fillStyle = "#ff1744";
      ctx.fillRect(sPos.x - 18, sPos.y - 24, 36 * pct, 4);
    }

    // 6. Render Karakter Pemain (Spec-Ops Stickman)
    if (!p.isDead) {
      const inBush = s.bushes.some(bush => Math.hypot(p.x - bush.x, p.y - bush.y) < bush.radius);
      this.drawStickmanSoldier(
        ctx, p.x, p.y, p.angle, p.isMoving, p.walkCycle,
        "#2e7d32", "#1b5e20", true, inBush
      );
    }

    // 7. Semak Kamuflase
    for (let bush of s.bushes) {
      ctx.save();
      ctx.fillStyle = "rgba(46, 125, 50, 0.22)";
      ctx.strokeStyle = "rgba(76, 175, 80, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bush.x, bush.y, bush.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 8. Zona Laser Merah (Firewall)
    ctx.save();
    ctx.strokeStyle = "#ff1744";
    ctx.lineWidth = 6;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff1744";
    ctx.beginPath();
    ctx.arc(s.zoneX, s.zoneY, s.zoneRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // Radar Minimap
    const mini = document.getElementById("minimapCanvas");
    if (mini) {
      const mctx = mini.getContext("2d");
      mctx.clearRect(0, 0, 140, 140);
      const sc = 140 / s.worldWidth;

      // Lingkaran Zona di Minimap
      mctx.strokeStyle = "#ff1744";
      mctx.beginPath();
      mctx.arc(s.zoneX * sc, s.zoneY * sc, s.zoneRadius * sc, 0, Math.PI * 2);
      mctx.stroke();

      // Titik Bot Musuh di Minimap
      mctx.fillStyle = "#ff1744";
      for (let b of s.bots) {
        if (!b.isDead) {
          mctx.beginPath();
          mctx.arc(b.x * sc, b.y * sc, 2.5, 0, Math.PI * 2);
          mctx.fill();
        }
      }

      // Titik Pemain di Minimap
      if (!p.isDead) {
        mctx.fillStyle = "#00e676";
        mctx.beginPath();
        mctx.arc(p.x * sc, p.y * sc, 3.5, 0, Math.PI * 2);
        mctx.fill();
      }
    }

    // Layar Game Over / Kemenangan
    if (p.isDead) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff1744";
      ctx.font = "bold 52px 'Orbitron', monospace";
      ctx.fillText("OPERATOR ELIMINATED", canvas.width / 2 - 270, canvas.height / 2 - 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText("Tekan ESC untuk kembali ke Lobby", canvas.width / 2 - 160, canvas.height / 2 + 35);
    } else if (s.aliveCount === 1) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00e676";
      ctx.font = "bold 56px 'Orbitron', monospace";
      ctx.fillText("CHICKEN DINNER! #1", canvas.width / 2 - 250, canvas.height / 2 - 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText(`Kills: ${p.kills} | Tekan ESC untuk kembali`, canvas.width / 2 - 140, canvas.height / 2 + 35);
    }
  }
};

registerScene('brawl', BrawlGame);