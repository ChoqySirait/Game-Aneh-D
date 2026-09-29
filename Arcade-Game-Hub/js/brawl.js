// =================================================================
// ⚔️ CYBERBRAWL 2D: MOBA BATTLEGROUND (Fixed Module)
// =================================================================

const BrawlGame = {
  instruction: "Gerak: <b>WASD</b> | Bidik: <b>Mouse</b> | Tembak: <b>Klik Kiri</b> | Dash: <b>SPASI</b>",
  state: {},

  init() {
    this.state = {
      worldWidth: 2400,
      worldHeight: 2400,
      gridSize: 80,
      camX: 1200,
      camY: 1200,

      player: {
        x: 1200, y: 1200, radius: 20, speed: 380,
        angle: 0, hp: 100, maxHp: 100, level: 1, exp: 0, expNeeded: 100,
        dashCooldown: 0
      },

      mouseWorldX: 1200,
      mouseWorldY: 1200,
      bullets: [],
      shootCooldown: 0,

      // Peti Data (Loot Crates)
      crates: [
        { x: 950, y: 950, hp: 60, size: 38 },
        { x: 1450, y: 950, hp: 60, size: 38 },
        { x: 950, y: 1450, hp: 60, size: 38 },
        { x: 1450, y: 1450, hp: 60, size: 38 },
        { x: 1200, y: 1000, hp: 80, size: 40 },
        { x: 1200, y: 1400, hp: 80, size: 40 }
      ],

      // Semak Taktis (Stealth Bushes)
      bushes: [
        { x: 700, y: 700, radius: 95 },
        { x: 1700, y: 700, radius: 95 },
        { x: 700, y: 1700, radius: 95 },
        { x: 1700, y: 1700, radius: 95 },
        { x: 1200, y: 1200, radius: 120 }
      ],

      keys: {},
      isStarted: true
    };
  },

  onResize(w, h) {},

  onKeyDown(e) {
    this.state.keys[e.code] = true;
    if (e.code === "Space" && this.state.player.dashCooldown <= 0) {
      this.triggerDash();
    }
  },

  onMouseMove(mouseX, mouseY) {
    const s = this.state;
    s.mouseWorldX = mouseX - canvas.width / 2 + s.camX;
    s.mouseWorldY = mouseY - canvas.height / 2 + s.camY;
  },

  onPointerDown(x, y) {
    this.shootBullet();
  },

  triggerDash() {
    const p = this.state.player;
    p.dashCooldown = 3.5;
    p.x += Math.cos(p.angle) * 160;
    p.y += Math.sin(p.angle) * 160;
    AudioEngine.playTone(550, 'sawtooth', 0.15, 0.2);
    FX.triggerShake(8, 6);
    FX.spawnParticles(p.x, p.y, "#00f2fe", 20, 6);
  },

  shootBullet() {
    const p = this.state.player;
    if (this.state.shootCooldown > 0) return;
    this.state.shootCooldown = 0.2;

    this.state.bullets.push({
      x: p.x + Math.cos(p.angle) * 25,
      y: p.y + Math.sin(p.angle) * 25,
      vx: Math.cos(p.angle) * 850,
      vy: Math.sin(p.angle) * 850,
      life: 1.2
    });

    AudioEngine.playTone(450, 'triangle', 0.06, 0.1);
    FX.spawnParticles(p.x + Math.cos(p.angle) * 20, p.y + Math.sin(p.angle) * 20, "#00f2fe", 4, 3);
  },

  update(dt) {
    const s = this.state;
    const p = s.player;

    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (s.shootCooldown > 0) s.shootCooldown -= dt;

    // Gerak Pemain 8-Arah
    let mx = 0, my = 0;
    if (s.keys["KeyW"] || s.keys["ArrowUp"]) my -= 1;
    if (s.keys["KeyS"] || s.keys["ArrowDown"]) my += 1;
    if (s.keys["KeyA"] || s.keys["ArrowLeft"]) mx -= 1;
    if (s.keys["KeyD"] || s.keys["ArrowRight"]) mx += 1;

    if (mx !== 0 && my !== 0) { mx *= 0.7071; my *= 0.7071; }
    p.x += mx * p.speed * dt;
    p.y += my * p.speed * dt;

    p.x = Math.max(p.radius, Math.min(s.worldWidth - p.radius, p.x));
    p.y = Math.max(p.radius, Math.min(s.worldHeight - p.radius, p.y));

    // Rotasi Hadap Bidikan
    p.angle = Math.atan2(s.mouseWorldY - p.y, s.mouseWorldX - p.x);

    // Smooth Camera Follow
    s.camX += (p.x - s.camX) * 8 * dt;
    s.camY += (p.y - s.camY) * 8 * dt;

    // Update Peluru
    for (let i = s.bullets.length - 1; i >= 0; i--) {
      const b = s.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Tabrak Peti
      for (let j = s.crates.length - 1; j >= 0; j--) {
        const c = s.crates[j];
        if (Math.hypot(b.x - c.x, b.y - c.y) < c.size / 2 + 8) {
          c.hp -= 30;
          b.life = 0;
          AudioEngine.play('hit');
          FX.spawnParticles(c.x, c.y, "#ffea00", 8, 4);

          if (c.hp <= 0) {
            FX.triggerShake(10, 8);
            FX.spawnParticles(c.x, c.y, "#ffea00", 25, 7);
            FX.spawnText(c.x, c.y, "+50 EXP", "#00ff66");
            s.crates.splice(j, 1);
            p.exp += 50;
            if (p.exp >= p.expNeeded) {
              p.level++;
              p.exp -= p.expNeeded;
              p.expNeeded = Math.floor(p.expNeeded * 1.4);
              p.maxHp += 20;
              p.hp = p.maxHp;
              FX.spawnText(p.x, p.y - 40, `LEVEL UP! LV.${p.level}`, "#00f2fe");
            }
          }
          break;
        }
      }

      if (b.life <= 0) s.bullets.splice(i, 1);
    }

    // Update Elemen HUD DOM
    const hpBar = document.getElementById("brawlHpBar");
    const hpText = document.getElementById("brawlHpText");
    const lvlText = document.getElementById("brawlLevel");
    if (hpBar) hpBar.style.width = (p.hp / p.maxHp * 100) + "%";
    if (hpText) hpText.innerText = `${p.hp} / ${p.maxHp}`;
    if (lvlText) lvlText.innerText = `LV. ${p.level}`;
  },

  render(ctx) {
    const s = this.state;
    const p = s.player;

    ctx.fillStyle = "#020408";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Offset Transformasi Kamera
    ctx.translate(canvas.width / 2 - s.camX, canvas.height / 2 - s.camY);

    // Grid Dunia
    ctx.strokeStyle = "rgba(0, 242, 254, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= s.worldWidth; x += s.gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s.worldHeight); ctx.stroke();
    }
    for (let y = 0; y <= s.worldHeight; y += s.gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s.worldWidth, y); ctx.stroke();
    }

    // Batas Luar Peta
    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 6;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff0055";
    ctx.strokeRect(0, 0, s.worldWidth, s.worldHeight);
    ctx.shadowBlur = 0;

    // Peti Data
    for (let c of s.crates) {
      ctx.save();
      ctx.fillStyle = "#101826";
      ctx.strokeStyle = "#ffea00";
      ctx.lineWidth = 2;
      ctx.fillRect(c.x - c.size / 2, c.y - c.size / 2, c.size, c.size);
      ctx.strokeRect(c.x - c.size / 2, c.y - c.size / 2, c.size, c.size);
      ctx.restore();
    }

    // Peluru
    for (let b of s.bullets) {
      ctx.save();
      ctx.fillStyle = "#00f2fe";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#00f2fe";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Karakter Pemain
    const inBush = s.bushes.some(bush => Math.hypot(p.x - bush.x, p.y - bush.y) < bush.radius);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.globalAlpha = inBush ? 0.45 : 1.0;

    // Senjata
    ctx.fillStyle = "#00f2fe";
    ctx.fillRect(10, -4, 16, 8);

    // Tubuh
    ctx.fillStyle = "#00ff66";
    ctx.shadowBlur = inBush ? 0 : 20;
    ctx.shadowColor = "#00ff66";
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Semak Stealth
    for (let bush of s.bushes) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 255, 102, 0.15)";
      ctx.strokeStyle = "rgba(0, 255, 102, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bush.x, bush.y, bush.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Render Minimap Radar
    const mini = document.getElementById("minimapCanvas");
    if (mini) {
      const mctx = mini.getContext("2d");
      mctx.clearRect(0, 0, 140, 140);
      const scale = 140 / s.worldWidth;
      mctx.fillStyle = "#00ff66";
      mctx.beginPath();
      mctx.arc(p.x * scale, p.y * scale, 3, 0, Math.PI * 2);
      mctx.fill();
    }
  }
};

registerScene('brawl', BrawlGame);