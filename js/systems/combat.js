// =================================================================
// ⚔️ COMBAT SYSTEM (10-PLAYER BATTLEGROUND ADAPTER)
// =================================================================

const CombatScene = {
  instruction: "Gerak: <b>WASD</b> | Tembak: <b>Klik Kiri</b> | Dash: <b>SPASI</b> | Kembali: <b>ESC</b>",

  init() {
    this.map = new CyberMap(2400, 2400);
    this.zone = new FirewallZone(2400, 2400);
    this.camera = new Camera(2400, 2400);

    this.player = new Player(1200, 1200);
    this.bots = [];
    this.bullets = [];
    this.crates = [];
    this.lootOrbs = [];

    this.keys = {};
    this.mouseWorld = { x: 1200, y: 1200 };
    this.aliveCount = 10;
    this.isVictory = false;

    // Spawn 9 Bot AI di penjuru arena
    const botNames = ["VIPER_AI", "GHOST_BOT", "NEXUS_9", "CYBER_WOLF", "ZERO_COOL", "KAGE", "TITAN_V", "SPECTRE", "RAZOR"];
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const dist = 700 + Math.random() * 350;
      this.bots.push(new Bot(
        `bot_${i}`,
        botNames[i],
        1200 + Math.cos(angle) * dist,
        1200 + Math.sin(angle) * dist
      ));
    }

    // Spawn 14 Peti Data di sekitar arena
    for (let i = 0; i < 14; i++) {
      this.crates.push(new Crate(
        350 + Math.random() * 1700,
        350 + Math.random() * 1700
      ));
    }
  },

  onResize(w, h) {
    this.camera.resize(w, h);
  },

  onKeyDown(e) {
    this.keys[e.code] = true;
    if (e.code === "Space") {
      this.player.dash(FX, AudioEngine);
    }
  },

  onMouseMove(mouseX, mouseY) {
    this.mouseWorld = this.camera.toWorld(mouseX, mouseY);
  },

  onPointerDown(x, y) {
    if (this.player.isDead || this.player.shootCooldown > 0) return;
    this.player.shootCooldown = 0.22;
    this.bullets.push(new Bullet(
      this.player.x,
      this.player.y,
      this.player.angle,
      850,
      25 + this.player.level * 4,
      'player',
      "#00f2fe"
    ));
    AudioEngine.playTone(480, 'triangle', 0.05, 0.1);
  },

  update(dt) {
    if (this.player.isDead) return;

    // 1. Update Zona Api (Firewall)
    this.zone.update(dt, (phase) => {
      FX.triggerShake(14, 10);
      FX.spawnText(this.player.x - 70, this.player.y - 70, `ZONE RESTRICTION PHASE ${phase}!`, "#ff0055");
    });

    // Cek Damage Luar Zona untuk Pemain
    if (!this.zone.isInside(this.player.x, this.player.y)) {
      this.player.takeDamage(this.zone.dps * dt, FX, AudioEngine);
    }

    // 2. Update Pemain
    this.player.update(dt, this.keys, this.mouseWorld, this.map);
    this.camera.follow(this.player.x, this.player.y);
    this.camera.update(dt);

    // 3. Update Bot AI
    for (let bot of this.bots) {
      if (!bot.isDead) {
        bot.update(dt, this.player, this.bots, this.crates, this.zone, this.map, this.bullets);
        if (!this.zone.isInside(bot.x, bot.y)) {
          bot.takeDamage(this.zone.dps * dt);
        }
      }
    }

    // 4. Update Peluru & Deteksi Tabrakan
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt, this.map);

      // Tabrak Peti
      for (let c of this.crates) {
        if (!c.isDead && Math.hypot(b.x - c.x, b.y - c.y) < c.size / 2 + b.radius) {
          c.takeDamage(b.damage);
          b.isDead = true;
          FX.spawnParticles(c.x, c.y, "#ffea00", 6, 3);
          if (c.isDead) {
            FX.triggerShake(6, 6);
            FX.spawnParticles(c.x, c.y, "#ffea00", 20, 6);
            this.lootOrbs.push(new LootOrb(c.x, c.y, Math.random() < 0.3 ? 'HEALTH' : 'EXP'));
          }
          break;
        }
      }

      // Tabrak Pemain (Jika peluru milik bot)
      if (b.ownerId !== 'player' && !this.player.isDead) {
        if (Math.hypot(b.x - this.player.x, b.y - this.player.y) < this.player.radius + b.radius) {
          this.player.takeDamage(b.damage, FX, AudioEngine);
          b.isDead = true;
        }
      }

      // Tabrak Bot (Jika peluru milik pemain atau bot lain)
      for (let bot of this.bots) {
        if (!bot.isDead && b.ownerId !== bot.id) {
          if (Math.hypot(b.x - bot.x, b.y - bot.y) < bot.radius + b.radius) {
            bot.takeDamage(b.damage);
            b.isDead = true;
            FX.spawnParticles(bot.x, bot.y, "#ff0055", 8, 4);

            if (bot.isDead) {
              if (b.ownerId === 'player') {
                this.player.kills++;
                this.player.gainExp(100, FX);
                AudioEngine.playArpeggio(this.player.kills);
                FX.spawnText(bot.x, bot.y, `OPERATOR ELIMINATED!`, "#00ff66");
              }
              this.lootOrbs.push(new LootOrb(bot.x, bot.y, 'EXP'));
            }
            break;
          }
        }
      }

      if (b.isDead) this.bullets.splice(i, 1);
    }

    // 5. Magnet Pengambilan Loot Orbs
    for (let i = this.lootOrbs.length - 1; i >= 0; i--) {
      const orb = this.lootOrbs[i];
      const d = Math.hypot(this.player.x - orb.x, this.player.y - orb.y);
      if (d < 160) {
        orb.x += (this.player.x - orb.x) * 10 * dt;
        orb.y += (this.player.y - orb.y) * 10 * dt;
      }
      if (d < 24) {
        if (orb.type === 'HEALTH') {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + 35);
          FX.spawnText(this.player.x, this.player.y - 20, "+35 HP", "#00ff66");
        } else {
          this.player.gainExp(40, FX);
        }
        this.lootOrbs.splice(i, 1);
      }
    }

    // Hitung Sisa Operator Hidup
    const aliveBots = this.bots.filter(b => !b.isDead).length;
    this.aliveCount = (this.player.isDead ? 0 : 1) + aliveBots;

    if (this.aliveCount === 1 && !this.player.isDead && !this.isVictory) {
      this.isVictory = true;
      AudioEngine.playTone(659.25, 'triangle', 0.6, 0.3);
      FX.spawnText(this.player.x - 120, this.player.y - 60, "VICTORY! LAST OPERATOR STANDING", "#ffea00");
    }

    // Update Elemen HUD DOM
    const hpBar = document.getElementById("brawlHpBar");
    const hpText = document.getElementById("brawlHpText");
    const lvlText = document.getElementById("brawlLevel");
    const aliveEl = document.getElementById("brawlAlive");
    const killsEl = document.getElementById("brawlKills");

    if (hpBar) hpBar.style.width = (this.player.hp / this.player.maxHp * 100) + "%";
    if (hpText) hpText.innerText = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
    if (lvlText) lvlText.innerText = `LV. ${this.player.level}`;
    if (aliveEl) aliveEl.innerText = this.aliveCount;
    if (killsEl) killsEl.innerText = this.player.kills;
  },

  render(ctx) {
    // 1. Render Peta Dunia
    this.map.render(ctx, this.camera);

    // 2. Render Peti & Loot Orbs
    for (let c of this.crates) if (!c.isDead) c.render(ctx, this.camera);
    for (let o of this.lootOrbs) o.render(ctx, this.camera);

    // 3. Render Peluru
    for (let b of this.bullets) b.render(ctx, this.camera);

    // 4. Render Bot Musuh
    for (let bot of this.bots) bot.render(ctx, this.camera, this.map);

    // 5. Render Pemain
    this.player.render(ctx, this.camera, this.map);

    // 6. Render Lingkaran Firewall Zone
    this.zone.render(ctx, this.camera);

    // 7. Render Minimap Radar (Pojok Kanan Atas)
    const mini = document.getElementById("minimapCanvas");
    if (mini) {
      const mctx = mini.getContext("2d");
      this.map.renderMinimap(mctx, 140, this.player, this.bots);
    }

    // Layar Game Over / Victory
    if (this.player.isDead) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff0055";
      ctx.font = "bold 56px 'Orbitron', monospace";
      ctx.fillText("OPERATOR DOWN", canvas.width / 2 - 240, canvas.height / 2 - 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText("Tekan ESC untuk kembali ke Lobby", canvas.width / 2 - 160, canvas.height / 2 + 40);
    }
  }
};

// Daftarkan scene ke engine utama
registerScene('brawl', CombatScene);