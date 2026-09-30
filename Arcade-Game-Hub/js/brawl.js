// =================================================================
// ⚡ NEON OVERDRIVE: CYBER TITAN (Kinetic Action Arena)
// Mechanics: Grappling Hook, Blade Parry, Explosive Barrels, Titan Boss
// =================================================================

const BrawlGame = {
  instruction: "Gerak: <b>WASD</b> | Tembak: <b>Klik Kiri</b> | Katana Parry: <b>Klik Kanan</b> | Grapple/Dash: <b>SPASI</b>",
  state: {},

  init() {
    this.state = {
      worldWidth: 2600,
      worldHeight: 2600,
      camX: 1300,
      camY: 1300,

      // --- PEMAIN CYBER COMMANDO ---
      player: {
        x: 1300, y: 1300, vx: 0, vy: 0, radius: 20, speed: 420, angle: 0,
        hp: 150, maxHp: 150, energy: 100, maxEnergy: 100,
        shootCooldown: 0, swordCooldown: 0, grappleCooldown: 0,
        isDashing: false, dashTimer: 0, isDead: false,
        combo: 0, comboTimer: 0, kills: 0,
        walkCycle: 0
      },

      // Efek Grapple Cable
      grapple: { active: false, targetX: 0, targetY: 0, pullSpeed: 1600 },

      // Entitas Dunia
      bullets: [],
      slashEffects: [],
      particles: [],
      barrels: [],
      enemies: [],
      boss: null,

      // Hazard & Props Lingkungan
      pillars: [
        { x: 900, y: 900, r: 60 }, { x: 1700, y: 900, r: 60 },
        { x: 900, y: 1700, r: 60 }, { x: 1700, y: 1700, r: 60 },
        { x: 1300, y: 700, r: 80 }, { x: 1300, y: 1900, r: 80 }
      ],

      wave: 1,
      spawnTimer: 0,
      keys: {},
      mouseWorld: { x: 1300, y: 1300 },
      isVictory: false
    };

    this.spawnBarrels();
  },

  spawnBarrels() {
    this.state.barrels = [];
    const positions = [
      { x: 1100, y: 1100 }, { x: 1500, y: 1100 },
      { x: 1100, y: 1500 }, { x: 1500, y: 1500 },
      { x: 800, y: 1300 }, { x: 1800, y: 1300 },
      { x: 1300, y: 800 }, { x: 1300, y: 1800 }
    ];
    for (let pos of positions) {
      this.state.barrels.push({
        x: pos.x, y: pos.y, radius: 24, hp: 30,
        type: Math.random() < 0.35 ? 'CRYO' : 'EXPLOSIVE', // Merah = Bom, Biru = Es
        isDead: false
      });
    }
  },

  onKeyDown(e) {
    this.state.keys[e.code] = true;
    if (e.code === "Space") this.triggerGrapple();
  },

  onKeyUp(e) {
    this.state.keys[e.code] = false;
  },

  onMouseMove(mouseX, mouseY) {
    const s = this.state;
    s.mouseWorld.x = mouseX - canvas.width / 2 + s.camX;
    s.mouseWorld.y = mouseY - canvas.height / 2 + s.camY;
  },

  onPointerDown(x, y) {
    // Klik Kiri: Senapan Plasma | Klik Kanan: Katana Slash
    this.shootPlasma();
  },

  // --- MEKANIK 1: KINETIC GRAPPLE SLINGSHOT ---
  triggerGrapple() {
    const s = this.state;
    const p = s.player;
    if (p.grappleCooldown > 0 || p.isDead || p.energy < 25) return;

    p.energy -= 25;
    p.grappleCooldown = 1.2;
    p.isDashing = true;
    p.dashTimer = 0.28;

    // Arahkan luncuran ke titik kursor
    const angle = Math.atan2(s.mouseWorld.y - p.y, s.mouseWorld.x - p.x);
    p.vx = Math.cos(angle) * p.speed * 2.8;
    p.vy = Math.sin(angle) * p.speed * 2.8;

    s.grapple.active = true;
    s.grapple.targetX = s.mouseWorld.x;
    s.grapple.targetY = s.mouseWorld.y;

    AudioEngine.playTone(600, 'sawtooth', 0.12, 0.2);
    FX.triggerShake(10, 8);
    FX.spawnParticles(p.x, p.y, "#00f2fe", 25, 8);
  },

  // --- MEKANIK 2: CYBER KATANA PARRY (KLIK KANAN) ---
  triggerKatanaSlash() {
    const s = this.state;
    const p = s.player;
    if (p.swordCooldown > 0 || p.isDead) return;

    p.swordCooldown = 0.35;
    AudioEngine.playTone(850, 'triangle', 0.12, 0.25);
    FX.triggerShake(7, 6);

    const slashArc = {
      x: p.x, y: p.y, angle: p.angle, radius: 95, life: 0.12
    };
    s.slashEffects.push(slashArc);

    // 1. Tangkal & Pantulkan Peluru Musuh (Bullet Parry)
    for (let b of s.bullets) {
      if (b.owner !== 'player' && Math.hypot(b.x - p.x, b.y - p.y) < slashArc.radius) {
        b.owner = 'player';
        b.color = "#00f2fe";
        b.vx = Math.cos(p.angle) * 1100;
        b.vy = Math.sin(p.angle) * 1100;
        b.damage *= 2; // Damage pantulan 2x lipat
        AudioEngine.playTone(1200, 'sine', 0.08, 0.2);
        FX.spawnText(b.x, b.y, "PARRY!", "#00ff66");
      }
    }

    // 2. Tebas Musuh Jarak Dekat (High Damage Melee)
    for (let e of s.enemies) {
      if (!e.isDead && Math.hypot(e.x - p.x, e.y - p.y) < slashArc.radius + e.radius) {
        e.hp -= 80;
        e.vx = Math.cos(p.angle) * 600;
        e.vy = Math.sin(p.angle) * 600;
        FX.spawnParticles(e.x, e.y, "#ff0055", 20, 7);
        if (e.hp <= 0) this.killEnemy(e, "SLICED!");
      }
    }

    // 3. Tebas Boss
    if (s.boss && Math.hypot(s.boss.x - p.x, s.boss.y - p.y) < slashArc.radius + s.boss.radius) {
      s.boss.hp -= 70;
      FX.triggerShake(12, 8);
      FX.spawnParticles(p.x + Math.cos(p.angle) * 60, p.y + Math.sin(p.angle) * 60, "#00f2fe", 25, 8);
    }
  },

  // --- MEKANIK 3: PLASMA GATLING BLASTER ---
  shootPlasma() {
    const s = this.state;
    const p = s.player;
    if (p.isDead || p.shootCooldown > 0) return;

    p.shootCooldown = 0.11; // Sangat cepat dan bertenaga
    const spread = (Math.random() - 0.5) * 0.1;
    const bulletAngle = p.angle + spread;
    const muzzleX = p.x + Math.cos(p.angle) * 32;
    const muzzleY = p.y + Math.sin(p.angle) * 32;

    s.bullets.push({
      x: muzzleX, y: muzzleY,
      vx: Math.cos(bulletAngle) * 1200,
      vy: Math.sin(bulletAngle) * 1200,
      owner: 'player', damage: 24, life: 0.9, color: "#00f2fe"
    });

    AudioEngine.playTone(320, 'sawtooth', 0.04, 0.08);
    FX.triggerShake(2, 2);
    FX.spawnParticles(muzzleX, muzzleY, "#00f2fe", 4, 3);
  },

  killEnemy(enemy, text = "DESTROYED!") {
    enemy.isDead = true;
    const p = this.state.player;
    p.kills++;
    p.combo++;
    p.comboTimer = 3.5;
    p.energy = Math.min(p.maxEnergy, p.energy + 20); // Isi ulang stamina dash
    AudioEngine.playArpeggio(p.combo);
    FX.triggerShake(12, 8);
    FX.spawnParticles(enemy.x, enemy.y, "#ff0055", 25, 8);
    FX.spawnText(enemy.x, enemy.y, text, "#ffea00");
  },

  // --- LOGIKA UPDATE LOOP ---
  update(dt) {
    const s = this.state;
    const p = s.player;

    // Klik Kanan untuk Katana
    if (engine.mouse?.rightDown) {
      this.triggerKatanaSlash();
    }

    if (!p.isDead) {
      if (p.shootCooldown > 0) p.shootCooldown -= dt;
      if (p.swordCooldown > 0) p.swordCooldown -= dt;
      if (p.grappleCooldown > 0) p.grappleCooldown -= dt;
      p.energy = Math.min(p.maxEnergy, p.energy + 15 * dt); // Regenerasi energi pasif

      // Combo Decay
      if (p.comboTimer > 0) {
        p.comboTimer -= dt;
        if (p.comboTimer <= 0) p.combo = 0;
      }

      // Input Gerak WASD
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

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Tabrakan Pilar
      for (let pil of s.pillars) {
        const dist = Math.hypot(p.x - pil.x, p.y - pil.y);
        if (dist < p.radius + pil.r) {
          const ang = Math.atan2(p.y - pil.y, p.x - pil.x);
          p.x = pil.x + Math.cos(ang) * (p.radius + pil.r);
          p.y = pil.y + Math.sin(ang) * (p.radius + pil.r);
        }
      }

      p.x = Math.max(p.radius, Math.min(s.worldWidth - p.radius, p.x));
      p.y = Math.max(p.radius, Math.min(s.worldHeight - p.radius, p.y));
      p.angle = Math.atan2(s.mouseWorld.y - p.y, s.mouseWorld.x - p.x);

      // Kamera Dinamis Mengikuti Pemain + Efek Lead Mouse
      const targetCamX = p.x + (s.mouseWorld.x - p.x) * 0.2;
      const targetCamY = p.y + (s.mouseWorld.y - p.y) * 0.2;
      s.camX += (targetCamX - s.camX) * 10 * dt;
      s.camY += (targetCamY - s.camY) * 10 * dt;
    }

    // Spawning Musuh Bergelombang / Spawn Boss
    s.spawnTimer += dt;
    if (s.spawnTimer > 1.8 && s.enemies.filter(e => !e.isDead).length < 12 && !s.boss) {
      s.spawnTimer = 0;
      const types = ['SWARMER', 'ENFORCER', 'SNIPER'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist = 750;

      s.enemies.push({
        x: p.x + Math.cos(angle) * dist,
        y: p.y + Math.sin(angle) * dist,
        vx: 0, vy: 0,
        type: chosenType,
        radius: chosenType === 'ENFORCER' ? 28 : (chosenType === 'SWARMER' ? 14 : 20),
        hp: chosenType === 'ENFORCER' ? 140 : (chosenType === 'SWARMER' ? 40 : 70),
        maxHp: chosenType === 'ENFORCER' ? 140 : (chosenType === 'SWARMER' ? 40 : 70),
        speed: chosenType === 'SWARMER' ? 360 : (chosenType === 'ENFORCER' ? 180 : 220),
        angle: 0,
        shootCooldown: Math.random() * 2,
        isFrozen: 0,
        isDead: false
      });
    }

    // Pemicu Munculnya Boss Titan di Kill ke-12
    if (p.kills >= 12 && !s.boss && !s.isVictory) {
      s.boss = {
        x: 1300, y: 1300, radius: 85,
        hp: 1200, maxHp: 1200,
        laserAngle: 0,
        attackTimer: 0,
        phase: 1
      };
      AudioEngine.playTone(100, 'sawtooth', 0.8, 0.4);
      FX.triggerShake(25, 20);
      FX.spawnText(p.x - 140, p.y - 80, "⚠️ TITAN REACTOR OVERLORD ACTIVE! ⚠️", "#ff0055");
    }

    // Update Boss Titan
    if (s.boss) {
      const b = s.boss;
      b.attackTimer += dt;
      b.laserAngle += 1.2 * dt; // Bilah laser berputar mematikan

      // Tembakan Rudal Plasma Beruntun
      if (b.attackTimer > 0.8) {
        b.attackTimer = 0;
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + b.laserAngle;
          s.bullets.push({
            x: b.x + Math.cos(ang) * b.radius,
            y: b.y + Math.sin(ang) * b.radius,
            vx: Math.cos(ang) * 450,
            vy: Math.sin(ang) * 450,
            owner: 'boss', damage: 25, life: 2.2, color: "#ff0055"
          });
        }
        AudioEngine.playTone(180, 'sawtooth', 0.08, 0.15);
      }

      if (b.hp <= 0) {
        s.isVictory = true;
        s.boss = null;
        AudioEngine.playTone(880, 'triangle', 0.8, 0.4);
        FX.triggerShake(30, 25);
        FX.spawnParticles(b.x, b.y, "#00ff66", 80, 15);
      }
    }

    // Update Musuh
    for (let e of s.enemies) {
      if (e.isDead) continue;
      if (e.isFrozen > 0) { e.isFrozen -= dt; continue; }

      const toPlayer = Math.atan2(p.y - e.y, p.x - e.x);
      e.angle = toPlayer;
      const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);

      // AI Sesuai Tipe
      if (e.type === 'SWARMER') {
        // Melaju kencang meledakkan diri
        e.x += Math.cos(toPlayer) * e.speed * dt;
        e.y += Math.sin(toPlayer) * e.speed * dt;
        if (distToPlayer < p.radius + e.radius + 8) {
          p.hp -= 35;
          this.killEnemy(e, "DETONATED!");
          FX.triggerShake(14, 10);
        }
      } else if (e.type === 'ENFORCER') {
        // Tanker perisai maju perlahan
        e.x += Math.cos(toPlayer) * e.speed * dt;
        e.y += Math.sin(toPlayer) * e.speed * dt;
      } else if (e.type === 'SNIPER') {
        // Menjaga jarak dan menembak peluru akurat
        if (distToPlayer > 380) {
          e.x += Math.cos(toPlayer) * e.speed * dt;
          e.y += Math.sin(toPlayer) * e.speed * dt;
        }
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = 1.6;
          s.bullets.push({
            x: e.x + Math.cos(toPlayer) * 25,
            y: e.y + Math.sin(toPlayer) * 25,
            vx: Math.cos(toPlayer) * 900,
            vy: Math.sin(toPlayer) * 900,
            owner: 'enemy', damage: 30, life: 1.2, color: "#ff1744"
          });
          AudioEngine.playTone(220, 'sawtooth', 0.05, 0.1);
        }
      }

      // Ramming Damage saat Pemain Dash
      if (p.isDashing && distToPlayer < p.radius + e.radius + 15) {
        e.hp -= 90;
        FX.triggerShake(14, 10);
        FX.spawnParticles(e.x, e.y, "#00f2fe", 25, 8);
        if (e.hp <= 0) this.killEnemy(e, "RAMMED!!");
      }
    }

    // Update Peluru & Tabrakan Tong Peledak
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Tabrak Tong Hazard
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
            // Cek Perisai Depan Enforcer
            const hitAngle = Math.atan2(b.y - e.y, b.x - e.x);
            const angleDiff = Math.abs(hitAngle - e.angle);
            if (e.type === 'ENFORCER' && angleDiff > Math.PI * 0.5) {
              b.life = 0;
              AudioEngine.playTone(900, 'square', 0.05, 0.1);
              FX.spawnParticles(b.x, b.y, "#ffffff", 6, 4); // Deflect shield
            } else {
              e.hp -= b.damage;
              b.life = 0;
              FX.spawnParticles(e.x, e.y, "#00f2fe", 6, 3);
              if (e.hp <= 0) this.killEnemy(e);
            }
            break;
          }
        }

        // Tabrak Boss Titan
        if (s.boss && Math.hypot(b.x - s.boss.x, b.y - s.boss.y) < s.boss.radius + 6) {
          s.boss.hp -= b.damage;
          b.life = 0;
          FX.spawnParticles(b.x, b.y, "#ff0055", 6, 4);
        }
      }

      // Tabrak Pemain
      if (b.owner !== 'player' && !p.isDead) {
        if (Math.hypot(b.x - p.x, b.y - p.y) < p.radius + 6) {
          b.life = 0;
          p.hp -= b.damage;
          AudioEngine.play('hit');
          FX.triggerShake(10, 8);
          FX.spawnParticles(p.x, p.y, "#ff0055", 15, 6);
          if (p.hp <= 0) p.isDead = true;
        }
      }

      if (b.life <= 0) s.bullets.splice(i, 1);
    }

    // Update Slash Arc Life
    for (let i = s.slashEffects.length - 1; i >= 0; i--) {
      s.slashEffects[i].life -= dt;
      if (s.slashEffects[i].life <= 0) s.slashEffects.splice(i, 1);
    }

    // Update DOM HUD
    const hpBar = document.getElementById("brawlHpBar");
    const hpText = document.getElementById("brawlHpText");
    const lvlText = document.getElementById("brawlLevel");
    const killsEl = document.getElementById("brawlKills");

    if (hpBar) hpBar.style.width = Math.max(0, p.hp / p.maxHp * 100) + "%";
    if (hpText) hpText.innerText = `${Math.ceil(Math.max(0, p.hp))} / ${p.maxHp}`;
    if (lvlText) lvlText.innerText = p.combo > 1 ? `COMBO x${p.combo}` : `KINETIC CORE`;
    if (killsEl) killsEl.innerText = p.kills;
  },

  explodeBarrel(br) {
    AudioEngine.playTone(120, 'sawtooth', 0.4, 0.3);
    FX.triggerShake(18, 14);
    const col = br.type === 'CRYO' ? "#00f2fe" : "#ff3d00";
    FX.spawnParticles(br.x, br.y, col, 40, 10);
    FX.spawnText(br.x, br.y, br.type === 'CRYO' ? "FREEZE NOVA!" : "EXPLOSION!", col);

    // Kena Musuh Sekitar
    for (let e of this.state.enemies) {
      if (!e.isDead && Math.hypot(e.x - br.x, e.y - br.y) < 180) {
        if (br.type === 'CRYO') {
          e.isFrozen = 3.5; // Beku 3.5 detik
        } else {
          e.hp -= 120;
          if (e.hp <= 0) this.killEnemy(e, "BLOWN UP!");
        }
      }
    }
  },

  // --- RENDER ARENA & VISUAL EFECTS ---
  render(ctx) {
    const s = this.state;
    const p = s.player;

    // Latar Arena Reaktor
    ctx.fillStyle = "#04070f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 - s.camX, canvas.height / 2 - s.camY);

    // 1. Grid Sirkuit Bersinar
    ctx.strokeStyle = "rgba(0, 242, 254, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= s.worldWidth; x += 120) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s.worldHeight); ctx.stroke();
    }
    for (let y = 0; y <= s.worldHeight; y += 120) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s.worldWidth, y); ctx.stroke();
    }

    // 2. Dinding Batas Dunia Bertegangan Tinggi
    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 8;
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#ff0055";
    ctx.strokeRect(0, 0, s.worldWidth, s.worldHeight);
    ctx.shadowBlur = 0;

    // 3. Render Pilar Penutup
    for (let pil of s.pillars) {
      ctx.save();
      ctx.fillStyle = "#0c1524";
      ctx.strokeStyle = "#00f2fe";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00f2fe";
      ctx.beginPath();
      ctx.arc(pil.x, pil.y, pil.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Render Tong Reaktif (Barrels)
    for (let br of s.barrels) {
      if (br.isDead) continue;
      ctx.save();
      const col = br.type === 'CRYO' ? "#00f2fe" : "#ff3d00";
      ctx.fillStyle = "#121b29";
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = col;
      ctx.beginPath();
      ctx.arc(br.x, br.y, br.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.fillRect(br.x - 6, br.y - 6, 12, 12);
      ctx.restore();
    }

    // 5. Render Slash Arc Katana
    for (let sl of s.slashEffects) {
      ctx.save();
      ctx.strokeStyle = "#00f2fe";
      ctx.lineWidth = 8;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#00f2fe";
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, sl.radius, sl.angle - Math.PI * 0.45, sl.angle + Math.PI * 0.45);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Render Peluru Tracer
    for (let b of s.bullets) {
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 3.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = b.color;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03);
      ctx.stroke();
      ctx.restore();
    }

    // 7. Render Musuh
    for (let e of s.enemies) {
      if (e.isDead) continue;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle);

      if (e.isFrozen > 0) {
        ctx.fillStyle = "#00f2fe"; // Status Beku
      } else if (e.type === 'ENFORCER') {
        ctx.fillStyle = "#78909c";
        // Perisai Baja Depan
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(10, 0, e.radius + 6, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.stroke();
      } else if (e.type === 'SWARMER') {
        ctx.fillStyle = "#ff007f";
      } else {
        ctx.fillStyle = "#ff1744";
      }

      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 8. Render Boss Titan Mech
    if (s.boss) {
      const b = s.boss;
      ctx.save();
      ctx.translate(b.x, b.y);

      // Bilah Laser Putar
      ctx.strokeStyle = "rgba(255, 0, 85, 0.75)";
      ctx.lineWidth = 6;
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ff0055";
      for (let i = 0; i < 4; i++) {
        const ang = b.laserAngle + (i * Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * 550, Math.sin(ang) * 550);
        ctx.stroke();
      }

      // Inti Tubuh Boss
      ctx.fillStyle = "#090d16";
      ctx.strokeStyle = "#ff0055";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#ffea00";
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 9. Render Pemain (Cyber Commando)
    if (!p.isDead) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Dash After-Image Trail
      if (p.isDashing) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = "#00f2fe";
      }

      // Laras Senapan & Katana Holster
      ctx.fillStyle = "#00f2fe";
      ctx.fillRect(12, -4, 20, 8); // Senjata
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-18, -12, 6, 24); // Katana di punggung

      // Tubuh Commando
      ctx.fillStyle = "#00ff66";
      ctx.beginPath();
      ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // --- HUD ATAS: BOSS HP BAR JIKA AKTIF ---
    if (s.boss) {
      const b = s.boss;
      const bw = canvas.width - 240;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(120, 20, bw, 22);
      ctx.fillStyle = "#ff0055";
      ctx.fillRect(120, 20, bw * Math.max(0, b.hp / b.maxHp), 22);
      ctx.strokeStyle = "#ffffff";
      ctx.strokeRect(120, 20, bw, 22);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Orbitron', monospace";
      ctx.fillText("TITAN REACTOR OVERLORD", 130, 36);
    }

    // Overlay Game Over / Kemenangan
    if (p.isDead) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff0055";
      ctx.font = "bold 52px 'Orbitron', monospace";
      ctx.fillText("OPERATOR OVERLOADED", canvas.width / 2 - 290, canvas.height / 2 - 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText("Tekan ESC untuk kembali ke Lobby", canvas.width / 2 - 160, canvas.height / 2 + 40);
    } else if (s.isVictory) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00ff66";
      ctx.font = "bold 56px 'Orbitron', monospace";
      ctx.fillText("TITAN CORE PURGED!", canvas.width / 2 - 270, canvas.height / 2 - 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText(`Kills: ${p.kills} | Tekan ESC untuk kembali ke Lobby`, canvas.width / 2 - 180, canvas.height / 2 + 40);
    }
  }
};

registerScene('brawl', BrawlGame);