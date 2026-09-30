// =================================================================
// ⚔️ CYBERBRAWL 2D: TACTICAL SPEC-OPS (Pseudo-3D & Squad Edition)
// Features: 2.5D Extruded Shadows, Tactical Flashlight, 3 Weapon Arsenal,
//           Recruitable AI Squad, Bullet Deflection & Dynamic Decals
// =================================================================

const BrawlGame = {
  instruction: "Gerak: <b>WASD</b> | Tembak: <b>Klik Kiri</b> | Katana: <b>Klik Kanan</b> | Ganti Senjata: <b>1 - 2 - 3 / Q</b> | Dash: <b>SPASI</b>",
  state: {},

  init() {
    this.state = {
      worldWidth: 2800,
      worldHeight: 2800,
      camX: 1400,
      camY: 1400,

      // --- PLAYER COMMANDEUR ---
      player: {
        x: 1400, y: 1400, vx: 0, vy: 0, radius: 20, speed: 380, angle: 0,
        hp: 180, maxHp: 180,
        level: 1, exp: 0, expNeeded: 80,
        shootCooldown: 0, swordCooldown: 0, dashCooldown: 0,
        isDashing: false, dashTimer: 0, kills: 0, isDead: false,
        walkCycle: 0,
        // Sistem Senjata (0: Carbine, 1: Shotgun, 2: Railgun)
        activeWeaponIdx: 0,
        weapons: [
          { name: "M4-CARBINE", rate: 0.12, damage: 28, speed: 1200, count: 1, spread: 0.08, color: "#00f2fe" },
          { name: "SPAS-SHOTGUN", rate: 0.55, damage: 22, speed: 1050, count: 6, spread: 0.32, color: "#ffea00" },
          { name: "RAILGUN-SNIPER", rate: 0.85, damage: 160, speed: 2200, count: 1, spread: 0.01, color: "#e040fb", pierce: true }
        ]
      },

      // --- SQUAD SYSTEM (TEMAN SATU TIM) ---
      squad: [],
      rescuePods: [
        { x: 1050, y: 1100, rescued: false, label: "MEDIC_OPERATOR" },
        { x: 1750, y: 1100, rescued: false, label: "GUNNER_OPERATOR" },
        { x: 1400, y: 1750, rescued: false, label: "SCOUT_SNIPER" }
      ],

      // Entitas Pertempuran
      enemies: [],
      bullets: [],
      slashEffects: [],
      dataCores: [],
      decals: [],
      barrels: [],

      // 2.5D Extruded Bunkers (Memiliki Tinggi/Tebal Perspektif)
      bunkers: [
        { x: 1000, y: 1000, w: 180, h: 50, depth: 30 },
        { x: 1620, y: 1000, w: 180, h: 50, depth: 30 },
        { x: 1000, y: 1750, w: 180, h: 50, depth: 30 },
        { x: 1620, y: 1750, w: 180, h: 50, depth: 30 },
        { x: 750, y: 1375, w: 50, h: 180, depth: 30 },
        { x: 2000, y: 1375, w: 50, h: 180, depth: 30 }
      ],

      keys: {},
      mouseWorld: { x: 1400, y: 1400 },
      spawnTimer: 0
    };

    this.spawnBarrels();
  },

  spawnBarrels() {
    const coords = [
      { x: 1200, y: 1200 }, { x: 1600, y: 1200 },
      { x: 1200, y: 1600 }, { x: 1600, y: 1600 },
      { x: 900, y: 1400 }, { x: 1900, y: 1400 }
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

    // Hotkey Ganti Senjata
    if (e.code === "Digit1") this.setWeapon(0);
    if (e.code === "Digit2") this.setWeapon(1);
    if (e.code === "Digit3") this.setWeapon(2);
    if (e.code === "KeyQ") {
      const nextIdx = (this.state.player.activeWeaponIdx + 1) % this.state.player.weapons.length;
      this.setWeapon(nextIdx);
    }
  },

  onKeyUp(e) {
    this.state.keys[e.code] = false;
  },

  setWeapon(idx) {
    const p = this.state.player;
    p.activeWeaponIdx = idx;
    AudioEngine.playTone(600 + idx * 150, 'sine', 0.08, 0.2);
    FX.spawnText(p.x, p.y - 45, p.weapons[idx].name, p.weapons[idx].color);
  },

  onMouseMove(mouseX, mouseY) {
    const s = this.state;
    s.mouseWorld.x = mouseX - canvas.width / 2 + s.camX;
    s.mouseWorld.y = mouseY - canvas.height / 2 + s.camY;
  },

  onMouseDown(button, mouseX, mouseY) {
    if (button === 0) this.shootActiveWeapon();
    else if (button === 2) this.triggerKatanaParry();
  },

  triggerDash() {
    const p = this.state.player;
    if (p.dashCooldown > 0 || p.isDead) return;
    p.dashCooldown = 2.0;
    p.isDashing = true;
    p.dashTimer = 0.22;

    const ang = Math.atan2(this.state.mouseWorld.y - p.y, this.state.mouseWorld.x - p.x);
    p.vx = Math.cos(ang) * p.speed * 2.8;
    p.vy = Math.sin(ang) * p.speed * 2.8;

    AudioEngine.playTone(450, 'sawtooth', 0.1, 0.2);
    FX.triggerShake(7, 5);
    FX.spawnParticles(p.x, p.y, "#00f2fe", 20, 6);
  },

  triggerKatanaParry() {
    const s = this.state;
    const p = s.player;
    if (p.swordCooldown > 0 || p.isDead) return;
    p.swordCooldown = 0.35;

    AudioEngine.playTone(950, 'triangle', 0.12, 0.25);
    FX.triggerShake(9, 6);

    const arc = { x: p.x, y: p.y, angle: p.angle, radius: 105, life: 0.12 };
    s.slashEffects.push(arc);

    // Pantulkan Proyektil Musuh
    for (let b of s.bullets) {
      if (b.owner !== 'player' && b.owner !== 'squad' && Math.hypot(b.x - p.x, b.y - p.y) < arc.radius + 15) {
        b.owner = 'player';
        b.color = "#00f2fe";
        b.vx = Math.cos(p.angle) * 1300;
        b.vy = Math.sin(p.angle) * 1300;
        b.damage *= 2.5;
        AudioEngine.playTone(1350, 'sine', 0.08, 0.2);
        FX.spawnText(b.x, b.y, "DEFLECT!", "#00e676");
      }
    }

    // Tebas Musuh Jarak Dekat
    for (let e of s.enemies) {
      if (!e.isDead && Math.hypot(e.x - p.x, e.y - p.y) < arc.radius + e.radius) {
        e.hp -= 110;
        e.x += Math.cos(p.angle) * 60;
        e.y += Math.sin(p.angle) * 60;
        FX.spawnParticles(e.x, e.y, "#ff0055", 18, 6);
        if (e.hp <= 0) this.killEnemy(e, "SLICED!");
      }
    }
  },

  shootActiveWeapon() {
    const s = this.state;
    const p = s.player;
    if (p.isDead || p.shootCooldown > 0) return;

    const curWep = p.weapons[p.activeWeaponIdx];
    p.shootCooldown = curWep.rate;

    for (let i = 0; i < curWep.count; i++) {
      const spread = (Math.random() - 0.5) * curWep.spread;
      const finalAngle = p.angle + spread;
      const muzzleX = p.x + Math.cos(p.angle) * 34;
      const muzzleY = p.y + Math.sin(p.angle) * 34;

      s.bullets.push({
        x: muzzleX, y: muzzleY,
        vx: Math.cos(finalAngle) * curWep.speed,
        vy: Math.sin(finalAngle) * curWep.speed,
        owner: 'player', damage: curWep.damage, life: 1.0,
        color: curWep.color, pierce: curWep.pierce || false
      });
    }

    // Recoil Kamera & Suara Khas Senjata
    if (p.activeWeaponIdx === 1) {
      AudioEngine.playTone(180, 'sawtooth', 0.12, 0.25);
      FX.triggerShake(6, 4);
    } else if (p.activeWeaponIdx === 2) {
      AudioEngine.playTone(850, 'sawtooth', 0.2, 0.3);
      FX.triggerShake(12, 8);
    } else {
      AudioEngine.playTone(320, 'sawtooth', 0.04, 0.1);
      FX.triggerShake(2, 2);
    }
  },

  killEnemy(enemy, text = "HOSTILE DOWN") {
    enemy.isDead = true;
    const p = this.state.player;
    p.kills++;

    this.state.dataCores.push({ x: enemy.x, y: enemy.y, value: 30 });
    this.state.decals.push({
      x: enemy.x, y: enemy.y,
      radius: Math.random() * 16 + 12,
      color: "rgba(160, 0, 45, 0.26)"
    });

    AudioEngine.playArpeggio(p.kills);
    FX.triggerShake(6, 5);
    FX.spawnParticles(enemy.x, enemy.y, "#ff0055", 20, 6);
    FX.spawnText(enemy.x, enemy.y, text, "#ffea00");
  },

  update(dt) {
    const s = this.state;
    const p = s.player;

    if (!p.isDead) {
      if (p.shootCooldown > 0) p.shootCooldown -= dt;
      if (p.swordCooldown > 0) p.swordCooldown -= dt;
      if (p.dashCooldown > 0) p.dashCooldown -= dt;

      // Navigasi WASD
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

      p.x = Math.max(p.radius, Math.min(s.worldWidth - p.radius, p.x));
      p.y = Math.max(p.radius, Math.min(s.worldHeight - p.radius, p.y));
      p.angle = Math.atan2(s.mouseWorld.y - p.y, s.mouseWorld.x - p.x);

      // Smooth Follow Camera
      s.camX += (p.x - s.camX) * 9 * dt;
      s.camY += (p.y - s.camY) * 9 * dt;

      // Cek Penyelamatan Kapsul Pasukan (Rescue Pods)
      for (let pod of s.rescuePods) {
        if (!pod.rescued && Math.hypot(p.x - pod.x, p.y - pod.y) < 60) {
          pod.rescued = true;
          // Spawn Teman Satu Tim (Squad Mate)
          s.squad.push({
            id: `squad_${s.squad.length}`,
            name: pod.label,
            x: pod.x, y: pod.y,
            vx: 0, vy: 0, radius: 19, speed: 340, angle: 0,
            hp: 120, maxHp: 120,
            shootTimer: 0, walkCycle: 0,
            isDead: false
          });
          AudioEngine.playTone(700, 'triangle', 0.4, 0.25);
          FX.triggerShake(10, 8);
          FX.spawnText(pod.x, pod.y - 50, `SQUAD JOINED: ${pod.label}!`, "#00f2fe");
          FX.spawnParticles(pod.x, pod.y, "#00f2fe", 35, 8);
        }
      }
    }

    // UPDATE LOGIKA SQUAD TEMAN SATU TIM (AI COMPANIONS)
    for (let i = 0; i < s.squad.length; i++) {
      const sq = s.squad[i];
      if (sq.isDead) continue;

      // Mengikuti Komandan (Player) dalam Formasi Segitiga
      const angleOffset = (i === 0 ? 0.75 : -0.75) * Math.PI;
      const targetFollowX = p.x + Math.cos(p.angle + angleOffset) * 65;
      const targetFollowY = p.y + Math.sin(p.angle + angleOffset) * 65;

      const distToPlayer = Math.hypot(targetFollowX - sq.x, targetFollowY - sq.y);
      if (distToPlayer > 30) {
        const moveAng = Math.atan2(targetFollowY - sq.y, targetFollowX - sq.x);
        sq.x += Math.cos(moveAng) * sq.speed * dt;
        sq.y += Math.sin(moveAng) * sq.speed * dt;
        sq.walkCycle += 12 * dt;
      }

      // Deteksi & Tembak Musuh Otomatis oleh Squad Mate
      let closestEnemy = null;
      let minEnemyDist = 480;
      for (let e of s.enemies) {
        if (!e.isDead) {
          const ed = Math.hypot(e.x - sq.x, e.y - sq.y);
          if (ed < minEnemyDist) { minEnemyDist = ed; closestEnemy = e; }
        }
      }

      if (closestEnemy) {
        sq.angle = Math.atan2(closestEnemy.y - sq.y, closestEnemy.x - sq.x);
        sq.shootTimer -= dt;
        if (sq.shootTimer <= 0) {
          sq.shootTimer = 0.25;
          s.bullets.push({
            x: sq.x + Math.cos(sq.angle) * 26,
            y: sq.y + Math.sin(sq.angle) * 26,
            vx: Math.cos(sq.angle) * 1100,
            vy: Math.sin(sq.angle) * 1100,
            owner: 'squad', damage: 20, life: 1.0, color: "#00e676"
          });
          AudioEngine.playTone(400, 'sine', 0.04, 0.08);
        }
      } else {
        sq.angle = p.angle;
      }

      // Pasukan Medic Memberi Heal Pasif Jika Dekat
      if (sq.name.includes("MEDIC") && distToPlayer < 90 && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + 6 * dt);
      }
    }

    // SPANW SYSTEM MUSUH BERESKALASI
    s.spawnTimer += dt;
    const interval = Math.max(0.4, 1.5 - (p.kills * 0.02));
    if (s.spawnTimer >= interval && !p.isDead) {
      s.spawnTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 800;
      const isBrute = Math.random() < 0.3;

      s.enemies.push({
        x: p.x + Math.cos(angle) * dist,
        y: p.y + Math.sin(angle) * dist,
        type: isBrute ? 'BRUTE' : 'SOLDIER',
        radius: isBrute ? 26 : 18,
        hp: isBrute ? 160 : 60,
        maxHp: isBrute ? 160 : 60,
        speed: isBrute ? 190 : 260,
        angle: 0, shootTimer: Math.random() * 1.5,
        isFrozen: 0, isDead: false
      });
    }

    // Update Musuh
    for (let e of s.enemies) {
      if (e.isDead) continue;
      if (e.isFrozen > 0) { e.isFrozen -= dt; continue; }

      // Targetkan Pemain atau Squad Terdekat
      let targetEntity = p;
      let minD = Math.hypot(p.x - e.x, p.y - e.y);
      for (let sq of s.squad) {
        if (!sq.isDead) {
          const d = Math.hypot(sq.x - e.x, sq.y - e.y);
          if (d < minD) { minD = d; targetEntity = sq; }
        }
      }

      const toTarget = Math.atan2(targetEntity.y - e.y, targetEntity.x - e.x);
      e.angle = toTarget;
      e.x += Math.cos(toTarget) * e.speed * dt;
      e.y += Math.sin(toTarget) * e.speed * dt;

      // Menembak Target
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && minD < 500) {
        e.shootTimer = 1.4;
        s.bullets.push({
          x: e.x + Math.cos(e.angle) * 24,
          y: e.y + Math.sin(e.angle) * 24,
          vx: Math.cos(e.angle) * 750,
          vy: Math.sin(e.angle) * 750,
          owner: 'enemy', damage: 16, life: 1.1, color: "#ff1744"
        });
      }
    }

    // Update Peluru & Collision
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Tabrak Tong Hazard
      for (let br of s.barrels) {
        if (!br.isDead && Math.hypot(b.x - br.x, b.y - br.y) < br.radius + 6) {
          if (!b.pierce) b.life = 0;
          br.hp -= b.damage;
          if (br.hp <= 0) { br.isDead = true; this.explodeBarrel(br); }
          break;
        }
      }

      // Tabrak Musuh
      if (b.owner === 'player' || b.owner === 'squad') {
        for (let e of s.enemies) {
          if (!e.isDead && Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 6) {
            e.hp -= b.damage;
            FX.spawnParticles(e.x, e.y, b.color, 5, 3);
            if (!b.pierce) b.life = 0;
            if (e.hp <= 0) this.killEnemy(e);
            break;
          }
        }
      }

      // Tabrak Pemain & Squad
      if (b.owner === 'enemy') {
        if (!p.isDead && Math.hypot(b.x - p.x, b.y - p.y) < p.radius + 5) {
          b.life = 0;
          p.hp -= b.damage;
          AudioEngine.play('hit');
          FX.triggerShake(9, 7);
          FX.spawnParticles(p.x, p.y, "#ff0055", 14, 5);
          if (p.hp <= 0) p.isDead = true;
        }
        for (let sq of s.squad) {
          if (!sq.isDead && Math.hypot(b.x - sq.x, b.y - sq.y) < sq.radius + 5) {
            b.life = 0;
            sq.hp -= b.damage;
            FX.spawnParticles(sq.x, sq.y, "#ff0055", 8, 4);
            if (sq.hp <= 0) { sq.isDead = true; FX.spawnText(sq.x, sq.y, "TEAMMATE DOWN!", "#ff0055"); }
            break;
          }
        }
      }

      if (b.life <= 0) s.bullets.splice(i, 1);
    }

    // Magnet EXP Data Cores
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

        if (p.exp >= p.expNeeded) {
          p.exp -= p.expNeeded;
          p.level++;
          p.expNeeded = Math.floor(p.expNeeded * 1.45);
          p.maxHp += 25;
          p.hp = p.maxHp;
          AudioEngine.playTone(660, 'triangle', 0.3, 0.2);
          FX.triggerShake(10, 8);
          FX.spawnText(p.x, p.y - 45, `TACTICAL PROMOTION! (LV.${p.level})`, "#00ff66");
        }
      }
    }

    // Slash Arc Lifetime
    for (let i = s.slashEffects.length - 1; i >= 0; i--) {
      s.slashEffects[i].life -= dt;
      if (s.slashEffects[i].life <= 0) s.slashEffects.splice(i, 1);
    }

    // Update Elemen DOM HUD
    const hpBar = document.getElementById("brawlHpBar");
    const hpText = document.getElementById("brawlHpText");
    const lvlText = document.getElementById("brawlLevel");
    const killsEl = document.getElementById("brawlKills");
    const aliveEl = document.getElementById("brawlAlive");

    if (hpBar) hpBar.style.width = Math.max(0, p.hp / p.maxHp * 100) + "%";
    if (hpText) hpText.innerText = `${Math.ceil(Math.max(0, p.hp))} / ${p.maxHp}`;
    if (lvlText) lvlText.innerText = `[${p.weapons[p.activeWeaponIdx].name}] SQUAD: ${s.squad.filter(m => !m.isDead).length}`;
    if (killsEl) killsEl.innerText = p.kills;
    if (aliveEl) aliveEl.innerText = s.enemies.filter(e => !e.isDead).length + 1;
  },

  explodeBarrel(br) {
    AudioEngine.playTone(130, 'sawtooth', 0.35, 0.3);
    FX.triggerShake(16, 12);
    const col = br.type === 'CRYO' ? "#00f2fe" : "#ff3d00";
    FX.spawnParticles(br.x, br.y, col, 35, 9);
    FX.spawnText(br.x, br.y, br.type === 'CRYO' ? "CRYO NOVA!" : "EXPLOSION!", col);

    for (let e of this.state.enemies) {
      if (!e.isDead && Math.hypot(e.x - br.x, e.y - br.y) < 200) {
        if (br.type === 'CRYO') e.isFrozen = 3.5;
        else {
          e.hp -= 140;
          if (e.hp <= 0) this.killEnemy(e, "BLOWN UP!");
        }
      }
    }
  },

  // --- RENDERING 2.5D SPEC-OPS STICKMAN (DENGAN DETAIL REALISTIS & BAYANGAN) ---
  drawStickmanSoldier(ctx, x, y, angle, isMoving, walkCycle, vestCol, helmCol, isPlayer, role = 'OPERATOR') {
    ctx.save();

    // 1. Dynamic Drop Shadow (Bayangan Jatuh Arah Bawah)
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 9, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y);
    ctx.rotate(angle);

    // 2. Kaki Melangkah Realistis (Sepatu Tempur Bertekstur)
    const leg = isMoving ? Math.sin(walkCycle) * 8 : 0;
    ctx.fillStyle = "#121417";
    ctx.fillRect(-13 + leg, -14, 10, 7);
    ctx.fillRect(-13 - leg, 8, 10, 7);

    // 3. Rompi Taktis Bergradasi (Body Armor Plate Carrier)
    const vestGrad = ctx.createLinearGradient(-12, -12, 12, 12);
    vestGrad.addColorStop(0, vestCol);
    vestGrad.addColorStop(1, "#0a1017");
    ctx.fillStyle = vestGrad;
    ctx.fillRect(-12, -12, 24, 24);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-12, -12, 24, 24);

    // Mag Pouch di Depan Rompi
    ctx.fillStyle = "#1b2533";
    ctx.fillRect(-6, -9, 4, 18);
    ctx.fillRect(-1, -9, 4, 18);

    // 4. Lengan Tangan Menggenggam Senjata
    ctx.strokeStyle = "#e8dcd0";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2, -9); ctx.lineTo(14, -7); ctx.lineTo(26, -2);
    ctx.moveTo(-2, 9); ctx.lineTo(12, 7); ctx.lineTo(18, 2);
    ctx.stroke();

    // 5. Model Senjata Spesifik Sesuai Slot
    const wepIdx = isPlayer ? this.state.player.activeWeaponIdx : 0;
    if (wepIdx === 1 && isPlayer) {
      // Breacher Shotgun
      ctx.fillStyle = "#212121";
      ctx.fillRect(8, -4, 22, 8);
      ctx.fillStyle = "#ffea00";
      ctx.fillRect(16, 4, 5, 3);
    } else if (wepIdx === 2 && isPlayer) {
      // Hyper Railgun
      ctx.fillStyle = "#1a0033";
      ctx.fillRect(8, -3, 34, 6);
      ctx.fillStyle = "#e040fb";
      ctx.fillRect(20, -1.5, 18, 3);
    } else {
      // Assault Rifle Standar
      ctx.fillStyle = "#1e1e1e";
      ctx.fillRect(8, -2.5, 26, 5);
      ctx.fillStyle = "#000000";
      ctx.fillRect(15, 2.5, 6, 4);
    }

    // 6. Kepala, Helm Kevlar, & Night Vision / Goggles
    ctx.fillStyle = "#e8dcd0";
    ctx.beginPath();
    ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = helmCol;
    ctx.beginPath();
    ctx.arc(-1, 0, 10, -Math.PI / 2, Math.PI / 2, true);
    ctx.fill();

    // Kacamata Taktis / NVG
    ctx.fillStyle = isPlayer ? "#00f2fe" : (role === 'SQUAD' ? "#00e676" : "#ff1744");
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.fillStyle;
    ctx.fillRect(5, -5, 3.5, 10);
    ctx.shadowBlur = 0;

    ctx.restore();
  },

  render(ctx) {
    const s = this.state;
    const p = s.player;

    // Background Gelap Warzone
    ctx.fillStyle = "#03060c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 - s.camX, canvas.height / 2 - s.camY);

    // 1. Grid Sirkuit Lantai
    ctx.strokeStyle = "rgba(0, 242, 254, 0.035)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= s.worldWidth; x += 120) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s.worldHeight); ctx.stroke();
    }
    for (let y = 0; y <= s.worldHeight; y += 120) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s.worldWidth, y); ctx.stroke();
    }

    // 2. Jejak Decals Darah & Oli
    for (let d of s.decals) {
      ctx.save();
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Batas Luar Peta
    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 8;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff0055";
    ctx.strokeRect(0, 0, s.worldWidth, s.worldHeight);
    ctx.shadowBlur = 0;

    // 4. Render Dinding Bunker 2.5D (Extruded Depth)
    for (let bk of s.bunkers) {
      ctx.save();
      // Bayangan Bawah Dinding
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(bk.x + 8, bk.y + bk.h, bk.w, bk.depth);

      // Sisi Tebal Dinding Samping (Dark Shading)
      ctx.fillStyle = "#0c1524";
      ctx.fillRect(bk.x, bk.y + bk.h, bk.w, bk.depth);

      // Muka Atas Dinding (Light Facing)
      ctx.fillStyle = "#1b2c45";
      ctx.strokeStyle = "#00f2fe";
      ctx.lineWidth = 2;
      ctx.fillRect(bk.x, bk.y, bk.w, bk.h);
      ctx.strokeRect(bk.x, bk.y, bk.w, bk.h);
      ctx.restore();
    }

    // 5. Render Kapsul Penyelamatan Pasukan (Rescue Pods)
    for (let pod of s.rescuePods) {
      ctx.save();
      if (!pod.rescued) {
        ctx.fillStyle = "rgba(0, 242, 254, 0.15)";
        ctx.strokeStyle = "#00f2fe";
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00f2fe";
        ctx.strokeRect(pod.x - 25, pod.y - 25, 50, 50);
        ctx.fillRect(pod.x - 25, pod.y - 25, 50, 50);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px 'Orbitron', monospace";
        ctx.fillText("RESCUE", pod.x - 20, pod.y + 4);
      }
      ctx.restore();
    }

    // 6. Tong Reaktif (Barrels)
    for (let br of s.barrels) {
      if (br.isDead) continue;
      ctx.save();
      const col = br.type === 'CRYO' ? "#00f2fe" : "#ff3d00";
      // Drop Shadow
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath(); ctx.ellipse(br.x + 3, br.y + 6, br.radius, br.radius * 0.6, 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = "#101622";
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(br.x, br.y, br.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col; ctx.fillRect(br.x - 5, br.y - 5, 10, 10);
      ctx.restore();
    }

    // 7. Data Core Orbs
    for (let core of s.dataCores) {
      ctx.save();
      ctx.fillStyle = "#00ff66";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#00ff66";
      ctx.beginPath(); ctx.arc(core.x, core.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // 8. Katana Slash Arc
    for (let sl of s.slashEffects) {
      ctx.save();
      ctx.strokeStyle = "#00f2fe";
      ctx.lineWidth = 10;
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#00f2fe";
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, sl.radius, sl.angle - Math.PI * 0.45, sl.angle + Math.PI * 0.45);
      ctx.stroke();
      ctx.restore();
    }

    // 9. Peluru Tracer Menembus Udara
    for (let b of s.bullets) {
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.pierce ? 6 : 3.5;
      ctx.shadowBlur = 12;
      ctx.shadowColor = b.color;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.035, b.y - b.vy * 0.035);
      ctx.stroke();
      ctx.restore();
    }

    // 10. Render Squad Teammates (Prajurit Sekutu)
    for (let sq of s.squad) {
      if (sq.isDead) continue;
      this.drawStickmanSoldier(
        ctx, sq.x, sq.y, sq.angle, true, sq.walkCycle,
        "#1565c0", "#0d47a1", false, 'SQUAD'
      );
      // HP Bar Teammate (Biru/Hijau)
      const pct = Math.max(0, sq.hp / sq.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(sq.x - 18, sq.y - sq.radius - 12, 36, 4);
      ctx.fillStyle = "#00e676";
      ctx.fillRect(sq.x - 18, sq.y - sq.radius - 12, 36 * pct, 4);
    }

    // 11. Render Musuh
    for (let e of s.enemies) {
      if (e.isDead) continue;
      const vest = e.type === 'BRUTE' ? "#3e2723" : "#4e342e";
      const helm = e.type === 'BRUTE' ? "#212121" : "#b71c1c";
      this.drawStickmanSoldier(ctx, e.x, e.y, e.angle, true, 0, vest, helm, false, 'ENEMY');

      // HP Bar Musuh
      const pct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(e.x - 18, e.y - e.radius - 12, 36, 4);
      ctx.fillStyle = "#ff1744";
      ctx.fillRect(e.x - 18, e.y - e.radius - 12, 36 * pct, 4);
    }

    // 12. Render Pemain (Spec-Ops Commando) + Volumetric Tactical Flashlight
    if (!p.isDead) {
      // A. Tactical Vision Cone (Flashlight Menyala ke Arah Pandang)
      ctx.save();
      const lightGrad = ctx.createRadialGradient(p.x, p.y, 20, p.x + Math.cos(p.angle) * 450, p.y + Math.sin(p.angle) * 450, 480);
      lightGrad.addColorStop(0, "rgba(0, 242, 254, 0.22)");
      lightGrad.addColorStop(1, "rgba(0, 242, 254, 0)");

      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.arc(p.x, p.y, 480, p.angle - Math.PI * 0.22, p.angle + Math.PI * 0.22);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // B. Render Prajurit Pemain
      this.drawStickmanSoldier(
        ctx, p.x, p.y, p.angle, (p.vx !== 0 || p.vy !== 0), p.walkCycle,
        "#2e7d32", "#1b5e20", true, 'COMMANDER'
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
      ctx.fillText(`Kills: ${p.kills} | Tekan ESC untuk kembali ke Lobby`, canvas.width / 2 - 180, canvas.height / 2 + 40);
    }
  }
};

registerScene('brawl', BrawlGame);