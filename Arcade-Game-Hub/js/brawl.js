// =================================================================
// ⚔️ CYBERBRAWL 2D: TACTICAL SPEC-OPS (AIRDROP & MINIGUN EDITION)
// Features: Dynamic Supply Airdrop, Exotic Minigun, Edge Indicators,
//           Floating Numbers, White Hit-Flash, Squad AI & Decals
// =================================================================

const BrawlGame = {
  instruction: "Gerak: <b>WASD</b> | Tembak: <b>Klik Kiri</b> | Katana: <b>Klik Kanan</b> | Ganti Senjata: <b>1 - 2 - 3 - 4 / Q</b> | Dash: <b>SPASI</b>",
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
        level: 1, exp: 0, expNeeded: 80, credits: 0,
        shootCooldown: 0, swordCooldown: 0, dashCooldown: 0,
        isDashing: false, dashTimer: 0, kills: 0, isDead: false,
        hitFlash: 0, walkCycle: 0,
        activeWeaponIdx: 0,
        weapons: [
          { name: "M4-CARBINE", rate: 0.12, damage: 28, speed: 1200, count: 1, spread: 0.08, color: "#00f2fe", ammo: Infinity },
          { name: "SPAS-SHOTGUN", rate: 0.55, damage: 22, speed: 1050, count: 6, spread: 0.32, color: "#ffea00", ammo: Infinity },
          { name: "RAILGUN-SNIPER", rate: 0.85, damage: 160, speed: 2200, count: 1, spread: 0.01, color: "#e040fb", ammo: Infinity, pierce: true },
          { name: "TITAN-MINIGUN", rate: 0.065, damage: 32, speed: 1350, count: 1, spread: 0.18, color: "#ff3d00", ammo: 0 } // Senjata Eksotis Airdrop
        ]
      },

      // --- DYNAMIC SUPPLY AIRDROP EVENT ---
      airdropTimer: 18, // Airdrop pertama tiba di detik ke-18
      airdrop: null, // { x, y, altitude, landed, opened, flareTime }

      // --- COMBAT JUICE & ECONOMY ---
      damageNumbers: [],
      killstreak: 0,
      killstreakTimer: 0,
      announcerBanner: { text: "", color: "#ffea00", alpha: 0, scale: 1 },
      creditCoins: [],

      // --- SQUAD SYSTEM ---
      squad: [],
      rescuePods: [
        { x: 1050, y: 1100, rescued: false, label: "MEDIC_OPERATOR" },
        { x: 1750, y: 1100, rescued: false, label: "GUNNER_OPERATOR" },
        { x: 1400, y: 1750, rescued: false, label: "SCOUT_SNIPER" }
      ],

      enemies: [],
      bullets: [],
      slashEffects: [],
      dataCores: [],
      decals: [],
      barrels: [],

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

  triggerAirdropCall() {
    const s = this.state;
    // Tentukan titik pendaratan acak di sekitar pemain
    const dropAngle = Math.random() * Math.PI * 2;
    const dropDist = 450 + Math.random() * 350;
    const targetX = Math.max(200, Math.min(s.worldWidth - 200, s.player.x + Math.cos(dropAngle) * dropDist));
    const targetY = Math.max(200, Math.min(s.worldHeight - 200, s.player.y + Math.sin(dropAngle) * dropDist));

    s.airdrop = {
      x: targetX,
      y: targetY,
      altitude: 600, // Ketinggian jatuh dari langit
      landed: false,
      opened: false,
      flareTime: 25 // Durasi asap suar menyala
    };

    AudioEngine.playTone(200, 'sawtooth', 0.5, 0.3);
    FX.triggerShake(12, 10);
    this.spawnDamageNumber(s.player.x, s.player.y - 60, "⚠️ INCOMING AIRDROP!", "#ff9800", true);
  },

  spawnDamageNumber(x, y, amount, color = "#ffffff", isCrit = false) {
    this.state.damageNumbers.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - 10,
      text: isCrit ? `CRIT ${amount}!` : `${amount}`,
      color: color,
      scale: isCrit ? 1.5 : 1.0,
      vy: -2.2,
      alpha: 1.0,
      life: 0.75
    });
  },

  triggerKillstreak(x, y) {
    const s = this.state;
    s.killstreak++;
    s.killstreakTimer = 4.0;

    let bannerText = "";
    let bannerColor = "#00f2fe";

    if (s.killstreak === 2) { bannerText = "DOUBLE KILL!"; bannerColor = "#00f2fe"; }
    else if (s.killstreak === 3) { bannerText = "TRIPLE KILL!"; bannerColor = "#ffea00"; }
    else if (s.killstreak === 4) { bannerText = "MEGA KILL!"; bannerColor = "#ff007f"; }
    else if (s.killstreak >= 5) { bannerText = `RAMPAGE x${s.killstreak}!`; bannerColor = "#ff1744"; }

    if (bannerText) {
      s.announcerBanner = { text: bannerText, color: bannerColor, alpha: 1.0, scale: 1.5 };
      AudioEngine.playArpeggio(s.killstreak + 3);
      FX.triggerShake(8, 6);
    }
  },

  onResize(w, h) {},

  onKeyDown(e) {
    this.state.keys[e.code] = true;
    if (e.code === "Space") this.triggerDash();
    if (e.code === "Digit1") this.setWeapon(0);
    if (e.code === "Digit2") this.setWeapon(1);
    if (e.code === "Digit3") this.setWeapon(2);
    if (e.code === "Digit4" && this.state.player.weapons[3].ammo > 0) this.setWeapon(3);
    if (e.code === "KeyQ") {
      let nextIdx = (this.state.player.activeWeaponIdx + 1) % this.state.player.weapons.length;
      if (nextIdx === 3 && this.state.player.weapons[3].ammo <= 0) nextIdx = 0;
      this.setWeapon(nextIdx);
    }
  },

  onKeyUp(e) {
    this.state.keys[e.code] = false;
  },

  setWeapon(idx) {
    const p = this.state.player;
    if (idx === 3 && p.weapons[3].ammo <= 0) return; // Minigun butuh amunisi
    p.activeWeaponIdx = idx;
    AudioEngine.playTone(600 + idx * 140, 'sine', 0.08, 0.2);
    FX.spawnText(p.x, p.y - 45, p.weapons[idx].name, p.weapons[idx].color);

    for (let i = 0; i < 3; i++) {
      const slot = document.getElementById(`wepSlot${i}`);
      if (slot) slot.classList.toggle("active", i === idx);
    }
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

    for (let b of s.bullets) {
      if (b.owner !== 'player' && b.owner !== 'squad' && Math.hypot(b.x - p.x, b.y - p.y) < arc.radius + 15) {
        b.owner = 'player';
        b.color = "#00f2fe";
        b.vx = Math.cos(p.angle) * 1300;
        b.vy = Math.sin(p.angle) * 1300;
        b.damage *= 2.5;
        AudioEngine.playTone(1350, 'sine', 0.08, 0.2);
        this.spawnDamageNumber(b.x, b.y, "DEFLECT!", "#00e676", true);
      }
    }

    for (let e of s.enemies) {
      if (!e.isDead && Math.hypot(e.x - p.x, e.y - p.y) < arc.radius + e.radius) {
        e.hp -= 110;
        e.hitFlash = 0.08;
        this.spawnDamageNumber(e.x, e.y, 110, "#00f2fe", true);
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
    if (curWep.ammo <= 0 && curWep.ammo !== Infinity) {
      this.setWeapon(0); // Habis amunisi minigun, kembali ke Karbin
      return;
    }

    p.shootCooldown = curWep.rate;
    if (curWep.ammo !== Infinity) curWep.ammo--;

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
        color: curWep.color, pierce: curWep.pierce || false,
        isCrit: p.activeWeaponIdx === 2
      });
    }

    if (p.activeWeaponIdx === 3) { // Minigun
      AudioEngine.playTone(190, 'square', 0.03, 0.12);
      FX.triggerShake(4, 2);
    } else if (p.activeWeaponIdx === 1) {
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

    // Jatuhkan Koin Credits Emas
    this.state.creditCoins.push({ x: enemy.x, y: enemy.y, value: 15 });
    this.state.dataCores.push({ x: enemy.x, y: enemy.y, value: 30 });
    this.state.decals.push({
      x: enemy.x, y: enemy.y,
      radius: Math.random() * 16 + 12,
      color: "rgba(160, 0, 45, 0.26)"
    });

    this.triggerKillstreak(enemy.x, enemy.y);
    FX.triggerShake(6, 5);
    FX.spawnParticles(enemy.x, enemy.y, "#ff0055", 20, 6);
  },

  update(dt) {
    const s = this.state;
    const p = s.player;

    // --- AIRDROP EVENT LOOP ---
    if (!s.airdrop) {
      s.airdropTimer -= dt;
      if (s.airdropTimer <= 0) {
        s.airdropTimer = 45; // Muncul tiap 45 detik
        this.triggerAirdropCall();
      }
    } else {
      const drop = s.airdrop;
      if (!drop.landed) {
        drop.altitude -= 140 * dt; // Melayang turun dengan parasut
        // Asap suar di tanah
        if (Math.random() < 0.35) FX.spawnParticles(drop.x, drop.y, "#ff9800", 2, 2);

        if (drop.altitude <= 0) {
          drop.altitude = 0;
          drop.landed = true;
          AudioEngine.playTone(150, 'sawtooth', 0.4, 0.35);
          FX.triggerShake(16, 12);
          FX.spawnParticles(drop.x, drop.y, "#ff9800", 35, 8);
        }
      } else if (!drop.opened) {
        drop.flareTime -= dt;
        if (Math.random() < 0.2) FX.spawnParticles(drop.x, drop.y, "#ff9800", 1, 1);

        // Buka Airdrop jika pemain mendekat
        if (Math.hypot(p.x - drop.x, p.y - drop.y) < 55) {
          drop.opened = true;
          p.weapons[3].ammo += 150; // Berikan 150 peluru Minigun
          this.setWeapon(3);
          AudioEngine.playTone(900, 'triangle', 0.5, 0.3);
          FX.triggerShake(14, 10);
          FX.spawnParticles(drop.x, drop.y, "#ff3d00", 40, 10);
          this.spawnDamageNumber(drop.x, drop.y - 40, "EXOTIC MINIGUN UNLOCKED!", "#ff3d00", true);
        }
      }
    }

    if (s.killstreakTimer > 0) {
      s.killstreakTimer -= dt;
      if (s.killstreakTimer <= 0) s.killstreak = 0;
    }

    if (s.announcerBanner.alpha > 0) {
      s.announcerBanner.alpha -= 0.6 * dt;
      s.announcerBanner.scale += 0.3 * dt;
    }

    for (let i = s.damageNumbers.length - 1; i >= 0; i--) {
      const dn = s.damageNumbers[i];
      dn.y += dn.vy;
      dn.life -= dt;
      dn.alpha = Math.max(0, dn.life / 0.75);
      if (dn.life <= 0) s.damageNumbers.splice(i, 1);
    }

    if (!p.isDead) {
      if (p.shootCooldown > 0) p.shootCooldown -= dt;
      if (p.swordCooldown > 0) p.swordCooldown -= dt;
      if (p.dashCooldown > 0) p.dashCooldown -= dt;
      if (p.hitFlash > 0) p.hitFlash -= dt;

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

      s.camX += (p.x - s.camX) * 9 * dt;
      s.camY += (p.y - s.camY) * 9 * dt;

      // Rescue Pods
      for (let pod of s.rescuePods) {
        if (!pod.rescued && Math.hypot(p.x - pod.x, p.y - pod.y) < 60) {
          pod.rescued = true;
          s.squad.push({
            id: `squad_${s.squad.length}`,
            name: pod.label,
            x: pod.x, y: pod.y,
            vx: 0, vy: 0, radius: 19, speed: 340, angle: 0,
            hp: 120, maxHp: 120,
            shootTimer: 0, walkCycle: 0, isDead: false, hitFlash: 0
          });
          AudioEngine.playTone(700, 'triangle', 0.4, 0.25);
          FX.triggerShake(10, 8);
          this.spawnDamageNumber(pod.x, pod.y - 40, `SQUAD JOINED!`, "#00f2fe", true);
          FX.spawnParticles(pod.x, pod.y, "#00f2fe", 35, 8);
        }
      }
    }

    // Squad Companions
    for (let i = 0; i < s.squad.length; i++) {
      const sq = s.squad[i];
      if (sq.isDead) continue;
      if (sq.hitFlash > 0) sq.hitFlash -= dt;

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

      if (sq.name.includes("MEDIC") && distToPlayer < 90 && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + 6 * dt);
      }
    }

    // Spawn Musuh Bereskalasi
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
        isFrozen: 0, isDead: false, hitFlash: 0
      });
    }

    // Update Musuh
    for (let e of s.enemies) {
      if (e.isDead) continue;
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.isFrozen > 0) { e.isFrozen -= dt; continue; }

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

    // Tabrakan Peluru
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      for (let br of s.barrels) {
        if (!br.isDead && Math.hypot(b.x - br.x, b.y - br.y) < br.radius + 6) {
          if (!b.pierce) b.life = 0;
          br.hp -= b.damage;
          if (br.hp <= 0) { br.isDead = true; this.explodeBarrel(br); }
          break;
        }
      }

      if (b.owner === 'player' || b.owner === 'squad') {
        for (let e of s.enemies) {
          if (!e.isDead && Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 6) {
            e.hp -= b.damage;
            e.hitFlash = 0.08;
            this.spawnDamageNumber(e.x, e.y, b.damage, b.color, b.isCrit);
            FX.spawnParticles(e.x, e.y, b.color, 5, 3);
            if (!b.pierce) b.life = 0;
            if (e.hp <= 0) this.killEnemy(e);
            break;
          }
        }
      }

      if (b.owner === 'enemy') {
        if (!p.isDead && Math.hypot(b.x - p.x, b.y - p.y) < p.radius + 5) {
          b.life = 0;
          p.hp -= b.damage;
          p.hitFlash = 0.08;
          this.spawnDamageNumber(p.x, p.y, b.damage, "#ff1744", true);
          AudioEngine.play('hit');
          FX.triggerShake(9, 7);
          FX.spawnParticles(p.x, p.y, "#ff0055", 14, 5);
          if (p.hp <= 0) p.isDead = true;
        }
        for (let sq of s.squad) {
          if (!sq.isDead && Math.hypot(b.x - sq.x, b.y - sq.y) < sq.radius + 5) {
            b.life = 0;
            sq.hp -= b.damage;
            sq.hitFlash = 0.08;
            this.spawnDamageNumber(sq.x, sq.y, b.damage, "#ff1744");
            FX.spawnParticles(sq.x, sq.y, "#ff0055", 8, 4);
            if (sq.hp <= 0) sq.isDead = true;
            break;
          }
        }
      }

      if (b.life <= 0) s.bullets.splice(i, 1);
    }

    // Magnet Koin Credits & EXP
    for (let i = s.creditCoins.length - 1; i >= 0; i--) {
      const coin = s.creditCoins[i];
      const d = Math.hypot(p.x - coin.x, p.y - coin.y);
      if (d < 190) {
        coin.x += (p.x - coin.x) * 12 * dt;
        coin.y += (p.y - coin.y) * 12 * dt;
      }
      if (d < 24) {
        p.credits += coin.value;
        s.creditCoins.splice(i, 1);
        AudioEngine.playTone(1050, 'sine', 0.03, 0.05);
        this.spawnDamageNumber(p.x, p.y - 20, `+${coin.value} CR`, "#ffd700");
      }
    }

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
          this.spawnDamageNumber(p.x, p.y - 45, `LEVEL UP!`, "#00ff66", true);
        }
      }
    }

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
    
    const curWep = p.weapons[p.activeWeaponIdx];
    const ammoDisplay = curWep.ammo === Infinity ? "∞" : curWep.ammo;
    if (lvlText) lvlText.innerText = `[${curWep.name}: ${ammoDisplay}] CR: ${p.credits}`;
    if (killsEl) killsEl.innerText = p.kills;
    if (aliveEl) aliveEl.innerText = s.enemies.filter(e => !e.isDead).length + 1;
  },

  explodeBarrel(br) {
    AudioEngine.playTone(130, 'sawtooth', 0.35, 0.3);
    FX.triggerShake(16, 12);
    const col = br.type === 'CRYO' ? "#00f2fe" : "#ff3d00";
    FX.spawnParticles(br.x, br.y, col, 35, 9);
    this.spawnDamageNumber(br.x, br.y, br.type === 'CRYO' ? "CRYO NOVA!" : "EXPLOSION!", col, true);

    for (let e of this.state.enemies) {
      if (!e.isDead && Math.hypot(e.x - br.x, e.y - br.y) < 200) {
        if (br.type === 'CRYO') e.isFrozen = 3.5;
        else {
          e.hp -= 140;
          e.hitFlash = 0.08;
          this.spawnDamageNumber(e.x, e.y, 140, "#ff3d00", true);
          if (e.hp <= 0) this.killEnemy(e, "BLOWN UP!");
        }
      }
    }
  },

  drawStickmanSoldier(ctx, x, y, angle, isMoving, walkCycle, vestCol, helmCol, isPlayer, role = 'OPERATOR', hitFlash = 0) {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 9, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(x, y);
    ctx.rotate(angle);

    const isFlashing = hitFlash > 0;
    const currentVest = isFlashing ? "#ffffff" : vestCol;
    const currentHelm = isFlashing ? "#ffffff" : helmCol;

    const leg = isMoving ? Math.sin(walkCycle) * 8 : 0;
    ctx.fillStyle = isFlashing ? "#ffffff" : "#121417";
    ctx.fillRect(-13 + leg, -14, 10, 7);
    ctx.fillRect(-13 - leg, 8, 10, 7);

    ctx.fillStyle = currentVest;
    ctx.fillRect(-12, -12, 24, 24);
    ctx.strokeStyle = isFlashing ? "#ffffff" : "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-12, -12, 24, 24);

    ctx.strokeStyle = isFlashing ? "#ffffff" : "#e8dcd0";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2, -9); ctx.lineTo(14, -7); ctx.lineTo(26, -2);
    ctx.moveTo(-2, 9); ctx.lineTo(12, 7); ctx.lineTo(18, 2);
    ctx.stroke();

    const wepIdx = isPlayer ? this.state.player.activeWeaponIdx : 0;
    if (wepIdx === 3 && isPlayer) {
      // Minigun Barrel Raksasa
      ctx.fillStyle = isFlashing ? "#ffffff" : "#ff3d00";
      ctx.fillRect(8, -6, 32, 12);
      ctx.fillStyle = "#212121";
      ctx.fillRect(20, -5, 22, 10);
    } else if (wepIdx === 1 && isPlayer) {
      ctx.fillStyle = isFlashing ? "#ffffff" : "#212121";
      ctx.fillRect(8, -4, 22, 8);
    } else if (wepIdx === 2 && isPlayer) {
      ctx.fillStyle = isFlashing ? "#ffffff" : "#1a0033";
      ctx.fillRect(8, -3, 34, 6);
    } else {
      ctx.fillStyle = isFlashing ? "#ffffff" : "#1e1e1e";
      ctx.fillRect(8, -2.5, 26, 5);
    }

    ctx.fillStyle = isFlashing ? "#ffffff" : "#e8dcd0";
    ctx.beginPath();
    ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = currentHelm;
    ctx.beginPath();
    ctx.arc(-1, 0, 10, -Math.PI / 2, Math.PI / 2, true);
    ctx.fill();

    ctx.fillStyle = isPlayer ? "#00f2fe" : (role === 'SQUAD' ? "#00e676" : "#ff1744");
    ctx.fillRect(5, -5, 3.5, 10);
    ctx.restore();
  },

  render(ctx) {
    const s = this.state;
    const p = s.player;

    ctx.fillStyle = "#03060c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2 - s.camX, canvas.height / 2 - s.camY);

    // Grid Lantai
    ctx.strokeStyle = "rgba(0, 242, 254, 0.035)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= s.worldWidth; x += 120) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s.worldHeight); ctx.stroke();
    }
    for (let y = 0; y <= s.worldHeight; y += 120) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s.worldWidth, y); ctx.stroke();
    }

    // Decals
    for (let d of s.decals) {
      ctx.save();
      ctx.fillStyle = d.color;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Batas Luar Peta
    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 8;
    ctx.strokeRect(0, 0, s.worldWidth, s.worldHeight);

    // Bunker 2.5D
    for (let bk of s.bunkers) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(bk.x + 8, bk.y + bk.h, bk.w, bk.depth);
      ctx.fillStyle = "#0c1524";
      ctx.fillRect(bk.x, bk.y + bk.h, bk.w, bk.depth);
      ctx.fillStyle = "#1b2c45";
      ctx.strokeStyle = "#00f2fe";
      ctx.lineWidth = 2;
      ctx.fillRect(bk.x, bk.y, bk.w, bk.h);
      ctx.strokeRect(bk.x, bk.y, bk.w, bk.h);
      ctx.restore();
    }

    // Kapsul Rescue
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

    // Tong Barrels
    for (let br of s.barrels) {
      if (br.isDead) continue;
      ctx.save();
      const col = br.type === 'CRYO' ? "#00f2fe" : "#ff3d00";
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath(); ctx.ellipse(br.x + 3, br.y + 6, br.radius, br.radius * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#101622";
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(br.x, br.y, br.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = col; ctx.fillRect(br.x - 5, br.y - 5, 10, 10);
      ctx.restore();
    }

    // Koin Credits Emas (CR)
    for (let coin of s.creditCoins) {
      ctx.save();
      ctx.fillStyle = "#ffd700";
      ctx.shadowBlur = 10; ctx.shadowColor = "#ffd700";
      ctx.beginPath(); ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Data Core Orbs (EXP)
    for (let core of s.dataCores) {
      ctx.save();
      ctx.fillStyle = "#00ff66";
      ctx.shadowBlur = 12; ctx.shadowColor = "#00ff66";
      ctx.beginPath(); ctx.arc(core.x, core.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Katana Slash Arc
    for (let sl of s.slashEffects) {
      ctx.save();
      ctx.strokeStyle = "#00f2fe";
      ctx.lineWidth = 10; ctx.shadowBlur = 30; ctx.shadowColor = "#00f2fe";
      ctx.beginPath();
      ctx.arc(sl.x, sl.y, sl.radius, sl.angle - Math.PI * 0.45, sl.angle + Math.PI * 0.45);
      ctx.stroke();
      ctx.restore();
    }

    // Peluru Tracer
    for (let b of s.bullets) {
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.pierce ? 6 : 3.5;
      ctx.shadowBlur = 12; ctx.shadowColor = b.color;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.035, b.y - b.vy * 0.035);
      ctx.stroke();
      ctx.restore();
    }

    // --- RENDER DYNAMIC AIRDROP CRATE & PARASUT ---
    if (s.airdrop) {
      const drop = s.airdrop;
      ctx.save();
      // Asap Suar Oranye di Tanah
      if (drop.flareTime > 0) {
        ctx.fillStyle = "rgba(255, 152, 0, 0.25)";
        ctx.beginPath(); ctx.arc(drop.x, drop.y, 65, 0, Math.PI * 2); ctx.fill();
      }

      if (!drop.landed) {
        // Peti sedang melayang turun
        const curY = drop.y - drop.altitude;
        // Parasut
        ctx.fillStyle = "#ff5722";
        ctx.beginPath();
        ctx.arc(drop.x, curY - 35, 30, Math.PI, 0);
        ctx.fill();
        // Tali Parasut
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(drop.x - 28, curY - 35); ctx.lineTo(drop.x - 12, curY);
        ctx.moveTo(drop.x + 28, curY - 35); ctx.lineTo(drop.x + 12, curY);
        ctx.stroke();

        // Kargo Peti Kayu Militer
        ctx.fillStyle = "#3e2723";
        ctx.fillRect(drop.x - 16, curY, 32, 26);
      } else if (!drop.opened) {
        // Peti di tanah bercahaya kuning menyala
        ctx.fillStyle = "#ff6f00";
        ctx.strokeStyle = "#ffea00";
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20; ctx.shadowColor = "#ffea00";
        ctx.fillRect(drop.x - 20, drop.y - 18, 40, 36);
        ctx.strokeRect(drop.x - 20, drop.y - 18, 40, 36);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px 'Orbitron', monospace";
        ctx.fillText("CRATE", drop.x - 18, drop.y + 4);
      }
      ctx.restore();
    }

    // Squad Teammates
    for (let sq of s.squad) {
      if (sq.isDead) continue;
      this.drawStickmanSoldier(
        ctx, sq.x, sq.y, sq.angle, true, sq.walkCycle,
        "#1565c0", "#0d47a1", false, 'SQUAD', sq.hitFlash
      );
      const pct = Math.max(0, sq.hp / sq.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(sq.x - 18, sq.y - sq.radius - 12, 36, 4);
      ctx.fillStyle = "#00e676";
      ctx.fillRect(sq.x - 18, sq.y - sq.radius - 12, 36 * pct, 4);
    }

    // Musuh
    for (let e of s.enemies) {
      if (e.isDead) continue;
      const vest = e.type === 'BRUTE' ? "#3e2723" : "#4e342e";
      const helm = e.type === 'BRUTE' ? "#212121" : "#b71c1c";
      this.drawStickmanSoldier(ctx, e.x, e.y, e.angle, true, 0, vest, helm, false, 'ENEMY', e.hitFlash);

      const pct = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(e.x - 18, e.y - e.radius - 12, 36, 4);
      ctx.fillStyle = "#ff1744";
      ctx.fillRect(e.x - 18, e.y - e.radius - 12, 36 * pct, 4);
    }

    // Pemain & Senter Taktis
    if (!p.isDead) {
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

      this.drawStickmanSoldier(
        ctx, p.x, p.y, p.angle, (p.vx !== 0 || p.vy !== 0), p.walkCycle,
        "#2e7d32", "#1b5e20", true, 'COMMANDER', p.hitFlash
      );
    }

    // Floating Numbers
    for (let dn of s.damageNumbers) {
      ctx.save();
      ctx.globalAlpha = dn.alpha;
      ctx.font = `bold ${Math.round(16 * dn.scale)}px 'Orbitron', monospace`;
      ctx.fillStyle = dn.color;
      ctx.shadowBlur = 8; ctx.shadowColor = dn.color;
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.restore();
    }

    ctx.restore();

    // --- OFF-SCREEN THREAT & AIRDROP INDICATORS (PANAH TEPI LAYAR) ---
    if (s.airdrop && !s.airdrop.opened) {
      const dropScreenX = s.airdrop.x - s.camX + canvas.width / 2;
      const dropScreenY = s.airdrop.y - s.camY + canvas.height / 2;
      const isOffScreen = dropScreenX < 40 || dropScreenX > canvas.width - 40 || dropScreenY < 40 || dropScreenY > canvas.height - 40;

      if (isOffScreen) {
        const edgeAngle = Math.atan2(s.airdrop.y - p.y, s.airdrop.x - p.x);
        const edgeX = Math.max(50, Math.min(canvas.width - 50, canvas.width / 2 + Math.cos(edgeAngle) * (canvas.width / 2 - 60)));
        const edgeY = Math.max(50, Math.min(canvas.height - 50, canvas.height / 2 + Math.sin(edgeAngle) * (canvas.height / 2 - 60)));

        ctx.save();
        ctx.translate(edgeX, edgeY);
        ctx.rotate(edgeAngle);
        ctx.fillStyle = "#ff9800";
        ctx.shadowBlur = 15; ctx.shadowColor = "#ff9800";
        ctx.beginPath();
        ctx.moveTo(14, 0); ctx.lineTo(-10, -8); ctx.lineTo(-10, 8);
        ctx.fill();
        ctx.restore();
      }
    }

    // Announcer Banner
    if (s.announcerBanner.alpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, s.announcerBanner.alpha);
      ctx.font = `900 ${Math.round(36 * s.announcerBanner.scale)}px 'Orbitron', monospace`;
      ctx.fillStyle = s.announcerBanner.color;
      ctx.shadowBlur = 25; ctx.shadowColor = s.announcerBanner.color;
      ctx.textAlign = "center";
      ctx.fillText(s.announcerBanner.text, canvas.width / 2, 140);
      ctx.restore();
    }

    // Game Over
    if (p.isDead) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff1744";
      ctx.font = "bold 52px 'Orbitron', monospace";
      ctx.fillText("OPERATOR KIA", canvas.width / 2 - 200, canvas.height / 2 - 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText(`Total Eliminasi: ${p.kills} | Koin Didapat: ${p.credits} CR | Tekan ESC untuk kembali`, canvas.width / 2 - 270, canvas.height / 2 + 40);
    }
  }
};

registerScene('brawl', BrawlGame);