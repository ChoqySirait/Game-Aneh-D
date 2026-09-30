// =================================================================
// ⚔️ CYBERBRAWL 2D: ENDLESS WARZONE OVERDRIVE
// Features: Laser Sight, Bullet Deflect Blade, Decals, Unlimited Waves
// =================================================================

const BrawlGame = {
  instruction: "Gerak: <b>WASD</b> | Laser Blaster: <b>Klik Kiri</b> | Katana Parry: <b>Klik Kanan</b> | Dash: <b>SPASI</b>",
  state: {},

  init() {
    this.state = {
      worldWidth: 2600,
      worldHeight: 2600,
      camX: 1300,
      camY: 1300,

      // Prajurit Utama Spec-Ops Stickman
      player: {
        x: 1300, y: 1300, vx: 0, vy: 0, radius: 20, speed: 380, angle: 0,
        hp: 150, maxHp: 150,
        level: 1, exp: 0, expNeeded: 60,
        shootCooldown: 0, swordCooldown: 0, dashCooldown: 0,
        isDashing: false, dashTimer: 0, kills: 0, isDead: false,
        walkCycle: 0,
        // Upgrade Senjata
        multiShot: 1,
        bulletDamage: 28,
        katanaRadius: 95
      },

      mouseWorld: { x: 1300, y: 1300 },
      keys: {},

      // Dynamic Entities (Tanpa Limit Kaku)
      enemies: [],
      bullets: [],
      slashEffects: [],
      dataCores: [],
      decals: [], // Jejak darah/oli di tanah medan tempur
      barrels: [],

      // Spawner Escalation
      spawnTimer: 0,
      waveTimer: 0,
      dangerLevel: 1,

      // Barikade Medan Tempur
      bunkers: [
        { x: 950, y: 950, w: 140, h: 40 },
        { x: 1510, y: 950, w: 140, h: 40 },
        { x: 950, y: 1610, w: 140, h: 40 },
        { x: 1510, y: 1610, w: 140, h: 40 },
        { x: 650, y: 1280, w: 40, h: 140 },
        { x: 1910, y: 1280, w: 40, h: 140 }
      ]
    };

    this.spawnBarrels();
  },

  spawnBarrels() {
    const coords = [
      { x: 1100, y: 1100 }, { x: 1500, y: 1100 },
      { x: 1100, y: 1500 }, { x: 1500, y: 1500 },
      { x: 850, y: 1300 }, { x: 1750, y: 1300 }
    ];
    for (let c of coords) {
      this.state.barrels.push({
        x: c.x, y: c.y, radius: 24, hp: 35,
        type: Math.random() < 0.4 ? 'CRYO' : 'EXPLOSIVE',
        isDead: false
      });
    }
  },

  onResize(w, h) {},

  onKeyDown(e) {
    this.state.keys[e.code] = true;
    if (e.code === "Space") this.triggerDash();
  },

  onKeyUp(e) {
    this.state.keys[e.code] = false;
  },

  onMouseMove(mouseX, mouseY) {
    const s = this.state;
    s.mouseWorld.x = mouseX - canvas.width / 2 + s.camX;
    s.mouseWorld.y = mouseY - canvas.height / 2 + s.camY;
  },

  onMouseDown(button, mouseX, mouseY) {
    if (button === 0) {
      this.shootBlaster();
    } else if (button === 2) {
      this.triggerKatanaParry();
    }
  },

  triggerDash() {
    const p = this.state.player;
    if (p.dashCooldown > 0 || p.isDead) return;
    p.dashCooldown = 2.2;
    p.isDashing = true;
    p.dashTimer = 0.22;

    const ang = Math.atan2(this.state.mouseWorld.y - p.y, this.state.mouseWorld.x - p.x);
    p.vx = Math.cos(ang) * p.speed * 2.8;
    p.vy = Math.sin(ang) * p.speed * 2.8;

    AudioEngine.playTone(480, 'sawtooth', 0.1, 0.2);
    FX.triggerShake(7, 5);
    FX.spawnParticles(p.x, p.y, "#00f2fe", 18, 6);
  },

  // Katana Parry (Klik Kanan)
  triggerKatanaParry() {
    const s = this.state;
    const p = s.player;
    if (p.swordCooldown > 0 || p.isDead) return;
    p.swordCooldown = 0.35;

    AudioEngine.playTone(900, 'triangle', 0.1, 0.25);
    FX.triggerShake(8, 6);

    const arc = { x: p.x, y: p.y, angle: p.angle, radius: p.katanaRadius, life: 0.12 };
    s.slashEffects.push(arc);

    // Pantulkan Peluru Musuh
    for (let b of s.bullets) {
      if (b.owner !== 'player' && Math.hypot(b.x - p.x, b.y - p.y) < arc.radius + 15) {
        b.owner = 'player';
        b.color = "#00f2fe";
        b.vx = Math.cos(p.angle) * 1100;
        b.vy = Math.sin(p.angle) * 1100;
        b.damage *= 2;
        AudioEngine.playTone(1300, 'sine', 0.08, 0.2);
        FX.spawnText(b.x, b.y, "DEFLECT!", "#00e676");
      }
    }

    // Tebas Musuh Jarak Dekat
    for (let e of s.enemies) {
      if (!e.isDead && Math.hypot(e.x - p.x, e.y - p.y) < arc.radius + e.radius) {
        e.hp -= 95;
        e.x += Math.cos(p.angle) * 50;
        e.y += Math.sin(p.angle) * 50;
        FX.spawnParticles(e.x, e.y, "#ff0055", 15, 6);
        if (e.hp <= 0) this.killEnemy(e, "SLICED!");
      }
    }
  },

  shootBlaster() {
    const s = this.state;
    const p = s.player;
    if (p.isDead || p.shootCooldown > 0) return;
    p.shootCooldown = 0.13;

    const baseAngle = p.angle;
    const count = p.multiShot;
    const spreadAngle = 0.12;

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * spreadAngle;
      const finalAngle = baseAngle + offset;
      const muzzleX = p.x + Math.cos(baseAngle) * 32;
      const muzzleY = p.y + Math.sin(baseAngle) * 32;

      s.bullets.push({
        x: muzzleX, y: muzzleY,
        vx: Math.cos(finalAngle) * 1150,
        vy: Math.sin(finalAngle) * 1150,
        owner: 'player', damage: p.bulletDamage, life: 1.0, color: "#00f2fe"
      });
    }

    AudioEngine.playTone(320, 'sawtooth', 0.04, 0.1);
    FX.triggerShake(2, 2);
  },

  killEnemy(enemy, text = "DESTROYED!") {
    enemy.isDead = true;
    const p = this.state.player;
    p.kills++;

    // Jatuhkan Data Core (EXP/Upgrade)
    this.state.dataCores.push({ x: enemy.x, y: enemy.y, value: 25 });

    // Tambah Jejak Oli/Darah Permanen di Tanah
    this.state.decals.push({
      x: enemy.x, y: enemy.y,
      radius: Math.random() * 14 + 10,
      color: enemy.type === 'MECH' ? "rgba(0, 242, 254, 0.2)" : "rgba(180, 0, 50, 0.28)"
    });

    AudioEngine.playArpeggio(p.kills);
    FX.triggerShake(6, 6);
    FX.spawnParticles(enemy.x, enemy.y, "#ff0055", 22, 6);
    FX.spawnText(enemy.x, enemy.y, text, "#ffea00");
  },

  update(dt) {
    const s = this.state;
    const p = s.player;

    if (!p.isDead) {
      if (p.shootCooldown > 0) p.shootCooldown -= dt;
      if (p.swordCooldown > 0) p.swordCooldown -= dt;
      if (p.dashCooldown > 0) p.dashCooldown -= dt;

      // Gerak WASD
      let mx = 0, my = 0;
      if (s.keys["KeyW"]) my -= 1;
      if (s.keys["KeyS"]) my += 1;
      if (s.keys["KeyA"]) mx -= 1;
      if (s.keys["KeyD"]) mx += 1;

      if (p.dashTimer > 0) {
        p.dashTimer -= dt;
      } else {
        p.isDashing = false;
        if (mx !== 0 && my !== 0) { mx *= 0.7071; my *= 0.7071; }
        p.vx = mx * p.speed;
        p.vy = my * p.speed;
      }

      if (mx !== 0 || my !== 0) p.walkCycle += 14 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Batasi di dalam dunia
      p.x = Math.max(p.radius, Math.min(s.worldWidth - p.radius, p.x));
      p.y = Math.max(p.radius, Math.min(s.worldHeight - p.radius, p.y));
      p.angle = Math.atan2(s.mouseWorld.y - p.y, s.mouseWorld.x - p.x);

      // Smooth Follow Camera
      s.camX += (p.x - s.camX) * 9 * dt;
      s.camY += (p.y - s.camY) * 9 * dt;
    }

    // SPANW SYSTEM TANPA LIMIT KAKU (Skala Dinamis Sesuai Kill & Waktu)
    s.spawnTimer += dt;
    s.waveTimer += dt;
    const spawnInterval = Math.max(0.4, 1.6 - (p.kills * 0.02));

    if (s.spawnTimer >= spawnInterval && !p.isDead) {
      s.spawnTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 750 + Math.random() * 200;

      // Tipe Musuh: GRUNT, SHIELD, MECH
      let type = 'GRUNT';
      const rand = Math.random();
      if (rand < 0.25) type = 'SHIELD';
      else if (rand < 0.38) type = 'MECH';

      s.enemies.push({
        x: p.x + Math.cos(angle) * dist,
        y: p.y + Math.sin(angle) * dist,
        type: type,
        radius: type === 'MECH' ? 32 : (type === 'SHIELD' ? 22 : 18),
        hp: type === 'MECH' ? 220 : (type === 'SHIELD' ? 120 : 60),
        maxHp: type === 'MECH' ? 220 : (type === 'SHIELD' ? 120 : 60),
        speed: type === 'MECH' ? 170 : (type === 'SHIELD' ? 210 : 270),
        angle: 0,
        shootTimer: Math.random() * 1.5,
        isFrozen: 0,
        isDead: false
      });
    }

    // Update Gerakan & AI Musuh
    for (let e of s.enemies) {
      if (e.isDead) continue;
      if (e.isFrozen > 0) { e.isFrozen -= dt; continue; }

      const toPlayer = Math.atan2(p.y - e.y, p.x - e.x);
      e.angle = toPlayer;
      const dist = Math.hypot(p.x - e.x, p.y - e.y);

      // Gerak Mengepung Pemain
      e.x += Math.cos(toPlayer) * e.speed * dt;
      e.y += Math.sin(toPlayer) * e.speed * dt;

      // Tembakan AI Musuh
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && dist < 550 && !p.isDead) {
        e.shootTimer = e.type === 'MECH' ? 1.1 : 1.8;
        const spread = (Math.random() - 0.5) * 0.15;
        s.bullets.push({
          x: e.x + Math.cos(e.angle) * 24,
          y: e.y + Math.sin(e.angle) * 24,
          vx: Math.cos(e.angle + spread) * 780,
          vy: Math.sin(e.angle + spread) * 780,
          owner: 'enemy',
          damage: e.type === 'MECH' ? 30 : 16,
          life: 1.2,
          color: "#ff1744"
        });
      }

      // Ramming Damage saat Dash
      if (p.isDashing && dist < p.radius + e.radius + 12) {
        e.hp -= 110;
        FX.triggerShake(12, 8);
        FX.spawnParticles(e.x, e.y, "#00f2fe", 20, 6);
        if (e.hp <= 0) this.killEnemy(e, "RAMMED!!");
      }
    }

    // Update Peluru
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Tabrak Tong
      for (let br of s.barrels) {
        if (!br.isDead && Math.hypot(b.x - br.x, b.y - br.y) < br.radius + 5) {
          b.life = 0;
          br.hp -= b.damage;
          if (br.hp <= 0) {
            br.isDead = true;
            this.explodeBarrel(br);
          }
          break;
        }
      }

      // Tabrak Musuh
      if (b.owner === 'player') {
        for (let e of s.enemies) {
          if (!e.isDead && Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 6) {
            // Perisai Depan Shield Bot
            const hitAng = Math.atan2(b.y - e.y, b.x - e.x);
            const diff = Math.abs(hitAng - e.angle);
            if (e.type === 'SHIELD' && diff > Math.PI * 0.45) {
              b.life = 0;
              AudioEngine.playTone(800, 'square', 0.04, 0.1);
              FX.spawnParticles(b.x, b.y, "#ffffff", 6, 3);
            } else {
              e.hp -= b.damage;
              b.life = 0;
              FX.spawnParticles(e.x, e.y, "#00f2fe", 6, 3);
              if (e.hp <= 0) this.killEnemy(e);
            }
            break;
          }
        }
      }

      // Tabrak Pemain
      if (b.owner !== 'player' && !p.isDead) {
        if (Math.hypot(b.x - p.x, b.y - p.y) < p.radius + 5) {
          b.life = 0;
          p.hp -= b.damage;
          AudioEngine.play('hit');
          FX.triggerShake(10, 8);
          FX.spawnParticles(p.x, p.y, "#ff0055", 14, 5);
          if (p.hp <= 0) p.isDead = true;
        }
      }

      if (b.life <= 0) s.bullets.splice(i, 1);
    }

    // Magnet Penarik Data Core (EXP/Upgrade)
    for (let i = s.dataCores.length - 1; i >= 0; i--) {
      const core = s.dataCores[i];
      const d = Math.hypot(p.x - core.x, p.y - core.y);
      if (d < 180) {
        core.x += (p.x - core.x) * 12 * dt;
        core.y += (p.y - core.y) * 12 * dt;
      }
      if (d < 24) {
        p.exp += core.value;
        s.dataCores.splice(i, 1);
        AudioEngine.playTone(880, 'sine', 0.04, 0.05);

        // Kenaikan Level & Mutasi Senjata Otomatis
        if (p.exp >= p.expNeeded) {
          p.exp -= p.expNeeded;
          p.level++;
          p.expNeeded = Math.floor(p.expNeeded * 1.5);
          p.maxHp += 20;
          p.hp = p.maxHp;

          // Mutasi Senjata
          if (p.level === 2) p.multiShot = 2; // Tembak ganda
          else if (p.level === 3) p.bulletDamage = 40; // Peluru plasma berat
          else if (p.level === 4) p.multiShot = 3; // Triple spread shot
          else if (p.level >= 5) p.katanaRadius = 130; // Jangkauan pedang raksasa

          AudioEngine.playTone(660, 'triangle', 0.3, 0.2);
          FX.triggerShake(12, 10);
          FX.spawnText(p.x, p.y - 45, `LEVEL UP! WEAPON OVERCLOCKED (LV.${p.level})`, "#00ff66");
        }
      }
    }

    // Slash Arc Lifetime
    for (let i = s.slashEffects.length - 1; i >= 0; i--) {
      s.slashEffects[i].life -= dt;
      if (s.slashEffects[i].life <= 0) s.slashEffects.splice(i, 1);
    }

    // Update DOM HUD
    const hpBar = document.getElementById("brawlHpBar");
    const hpText = document.getElementById("brawlHpText");
    const lvlText = document.getElementById("brawlLevel");
    const killsEl = document.getElementById("brawlKills");
    const aliveEl = document.getElementById("brawlAlive");

    if (hpBar) hpBar.style.width = Math.max(0, p.hp / p.maxHp * 100) + "%";
    if (hpText) hpText.innerText = `${Math.ceil(Math.max(0, p.hp))} / ${p.maxHp}`;
    if (lvlText) lvlText.innerText = `LV. ${p.level} TACTICAL`;
    if (killsEl) killsEl.innerText = p.kills;
    if (aliveEl) aliveEl.innerText = s.enemies.filter(e => !e.isDead).length + (p.isDead ? 0 : 1);
  },

  explodeBarrel(br) {
    AudioEngine.playTone(130, 'sawtooth', 0.35, 0.3);
    FX.triggerShake(16, 12);
    const col = br.type === 'CRYO' ? "#00f2fe" : "#ff3d00";
    FX.spawnParticles(br.x, br.y, col, 35, 9);
    FX.spawnText(br.x, br.y, br.type === 'CRYO' ? "CRYO BLAST!" : "EXPLOSION!", col);

    for (let e of this.state.enemies) {
      if (!e.isDead && Math.hypot(e.x - br.x, e.y - br.y) < 190) {
        if (br.type === 'CRYO') e.isFrozen = 3.5;
        else {
          e.hp -= 130;
          if (e.hp <= 0) this.killEnemy(e, "BLOWN UP!");
        }
      }
    }
  },

  // Menggambar Stickman Prajurit Militer Lengkap
  drawSoldier(ctx, x, y, angle, isMoving, walkCycle, vestCol, helmCol, isPlayer, laserSight) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Garis Laser Sight Merah dari Laras Senjata ke Arah Kursor (Khusus Player)
    if (isPlayer && laserSight) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 0, 50, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(800, 0);
      ctx.stroke();
      ctx.restore();
    }

    // Kaki Bergerak
    const leg = isMoving ? Math.sin(walkCycle) * 7 : 0;
    ctx.fillStyle = "#111111";
    ctx.fillRect(-12 + leg, -14, 9, 6);
    ctx.fillRect(-12 - leg, 8, 9, 6);

    // Rompi Tempur Taktis (Armor Vest)
    ctx.fillStyle = vestCol;
    ctx.fillRect(-11, -11, 22, 22);

    // Lengan Tangan Memegang Senjata
    ctx.strokeStyle = "#e0d6c8";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2, -9); ctx.lineTo(14, -7); ctx.lineTo(24, -2);
    ctx.moveTo(-2, 9); ctx.lineTo(10, 7); ctx.lineTo(16, 2);
    ctx.stroke();

    // Senjata Serbu M4 Modern
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(8, -2.5, 24, 5);
    ctx.fillStyle = "#000000";
    ctx.fillRect(14, 2, 6, 4);

    // Kepala & Helm Kevlar Militer
    ctx.fillStyle = "#e0d6c8";
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = helmCol;
    ctx.beginPath();
    ctx.arc(-1, 0, 9.5, -Math.PI / 2, Math.PI / 2, true);
    ctx.fill();

    // Kacamata Goggles Neon
    ctx.fillStyle = isPlayer ? "#00f2fe" : "#ffea00";
    ctx.fillRect(4, -5, 3, 10);

    ctx.restore();
  },

  render(ctx) {
    const s = this.state;
    const p = s.player;

    // Latar Belakang Gelap Warzone
    ctx.fillStyle = "#04070d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 - s.camX, canvas.height / 2 - s.camY);

    // 1. Grid Sirkuit Medan Tempur
    ctx.strokeStyle = "rgba(0, 242, 254, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= s.worldWidth; x += 120) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s.worldHeight); ctx.stroke();
    }
    for (let y = 0; y <= s.worldHeight; y += 120) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s.worldWidth, y); ctx.stroke();
    }

    // 2. Jejak Decals Darah & Oli Permanen di Lantai
    for (let d of s.decals) {
      ctx.save();
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Batas Medan Tempur
    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 8;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff0055";
    ctx.strokeRect(0, 0, s.worldWidth, s.worldHeight);
    ctx.shadowBlur = 0;

    // 4. Barikade Bunker Militer
    for (let bk of s.bunkers) {
      ctx.save();
      ctx.fillStyle = "#15202e";
      ctx.strokeStyle = "#00f2fe";
      ctx.lineWidth = 2.5;
      ctx.fillRect(bk.x, bk.y, bk.w, bk.h);
      ctx.strokeRect(bk.x, bk.y, bk.w, bk.h);
      ctx.restore();
    }

    // 5. Tong Reaktif (Explosive Barrels)
    for (let br of s.barrels) {
      if (br.isDead) continue;
      ctx.save();
      const col = br.type === 'CRYO' ? "#00f2fe" : "#ff3d00";
      ctx.fillStyle = "#101622";
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(br.x, br.y, br.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.fillRect(br.x - 5, br.y - 5, 10, 10);
      ctx.restore();
    }

    // 6. Data Core Orbs (EXP)
    for (let core of s.dataCores) {
      ctx.save();
      ctx.fillStyle = "#00ff66";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00ff66";
      ctx.beginPath();
      ctx.arc(core.x, core.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Katana Slash Arc Visual
    for (let sl of s.slashEffects) {
      ctx.save();
      ctx.strokeStyle = "#00f2fe";
      ctx.lineWidth = 9;
      ctx.shadowBlur = 25;
      ctx.shadowColor = "#00f2fe";
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, sl.radius, sl.angle - Math.PI * 0.45, sl.angle + Math.PI * 0.45);
      ctx.stroke();
      ctx.restore();
    }

    // 8. Peluru Tracer Menembus Udara
    for (let b of s.bullets) {
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.color;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.035, b.y - b.vy * 0.035);
      ctx.stroke();
      ctx.restore();
    }

    // 9. Render Musuh (Stickmen Militer & Mech)
    for (let e of s.enemies) {
      if (e.isDead) continue;
      if (e.type === 'MECH') {
        // Robot Mech Raksasa
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle);
        ctx.fillStyle = "#263238";
        ctx.strokeStyle = "#ff0055";
        ctx.lineWidth = 4;
        ctx.strokeRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
        ctx.fillRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
        ctx.fillStyle = "#ff0055";
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else {
        // Tentara Stickman Musuh
        const vestCol = e.type === 'SHIELD' ? "#37474f" : "#4e342e";
        const helmCol = e.type === 'SHIELD' ? "#263238" : "#b71c1c";
        this.drawSoldier(ctx, e.x, e.y, e.angle, true, 0, vestCol, helmCol, false, false);
      }

      // HP Bar Musuh
      const pct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(e.x - 18, e.y - e.radius - 12, 36, 4);
      ctx.fillStyle = "#ff1744";
      ctx.fillRect(e.x - 18, e.y - e.radius - 12, 36 * pct, 4);
    }

    // 10. Render Pemain (Spec-Ops Stickman)
    if (!p.isDead) {
      this.drawSoldier(
        ctx, p.x, p.y, p.angle, (p.vx !== 0 || p.vy !== 0), p.walkCycle,
        "#2e7d32", "#1b5e20", true, true
      );
    }

    ctx.restore();

    // Layar Game Over
    if (p.isDead) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff1744";
      ctx.font = "bold 52px 'Orbitron', monospace";
      ctx.fillText("OPERATOR KIA", canvas.width / 2 - 200, canvas.height / 2 - 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText(`Total Kills: ${p.kills} | Tekan ESC untuk kembali`, canvas.width / 2 - 160, canvas.height / 2 + 40);
    }
  }
};

registerScene('brawl', BrawlGame);