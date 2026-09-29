// =================================================================
// 🛡️ CYBER OPERATOR (PLAYER HERO)
// =================================================================

class Player {
  constructor(x = 1200, y = 1200) {
    this.id = 'player';
    this.name = 'CYBER_OPERATOR';
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.speed = 380;
    this.angle = 0;

    this.hp = 120;
    this.maxHp = 120;
    this.level = 1;
    this.exp = 0;
    this.expNeeded = 80;
    this.kills = 0;

    this.shootCooldown = 0;
    this.dashCooldown = 0;
    this.isDead = false;
  }

  update(dt, keys, mouseWorld, map) {
    if (this.isDead) return;

    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;

    // Gerak 8-Arah (WASD / Panah)
    let mx = 0, my = 0;
    if (keys["KeyW"] || keys["ArrowUp"]) my -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) my += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) mx -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) mx += 1;

    if (mx !== 0 && my !== 0) {
      mx *= 0.7071;
      my *= 0.7071;
    }

    const nextX = this.x + mx * this.speed * dt;
    const nextY = this.y + my * this.speed * dt;

    // Resolusi Tabrakan Dinding Luar & Rintangan
    if (!this.checkBarrierCollision(nextX, this.y, map)) this.x = nextX;
    if (!this.checkBarrierCollision(this.x, nextY, map)) this.y = nextY;

    this.x = Math.max(this.radius, Math.min(map.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(map.height - this.radius, this.y));

    // Arah Hadap Senjata ke Kursor Mouse
    this.angle = Math.atan2(mouseWorld.y - this.y, mouseWorld.x - this.x);
  }

  checkBarrierCollision(x, y, map) {
    for (let bar of map.barriers) {
      if (
        x + this.radius > bar.x &&
        x - this.radius < bar.x + bar.w &&
        y + this.radius > bar.y &&
        y - this.radius < bar.y + bar.h
      ) {
        return true;
      }
    }
    return false;
  }

  dash(FX, AudioEngine) {
    if (this.dashCooldown > 0 || this.isDead) return;
    this.dashCooldown = 4.0;
    this.x += Math.cos(this.angle) * 160;
    this.y += Math.sin(this.angle) * 160;

    AudioEngine.playTone(550, 'sawtooth', 0.15, 0.2);
    FX.triggerShake(8, 6);
    FX.spawnParticles(this.x, this.y, "#00f2fe", 20, 6);
  }

  gainExp(amount, FX) {
    this.exp += amount;
    if (this.exp >= this.expNeeded) {
      this.level++;
      this.exp -= this.expNeeded;
      this.expNeeded = Math.floor(this.expNeeded * 1.45);
      this.maxHp += 25;
      this.hp = this.maxHp;
      this.speed += 8;
      FX.spawnText(this.x, this.y - 45, `LEVEL UP! LV.${this.level}`, "#00ff66");
      FX.triggerShake(8, 6);
    }
  }

  takeDamage(amount, FX, AudioEngine) {
    if (this.isDead) return;
    this.hp -= amount;
    FX.triggerShake(12, 8);
    FX.spawnParticles(this.x, this.y, "#ff0055", 14, 5);
    AudioEngine.play('hit');

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }

  render(ctx, camera, map) {
    if (this.isDead) return;
    const s = camera.toScreen(this.x, this.y);
    const inBush = map.isInBush(this.x, this.y);

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = inBush ? 0.45 : 1.0;

    // Moncong Senjata Blaster
    ctx.fillStyle = "#00f2fe";
    ctx.fillRect(10, -4, 18, 8);

    // Tubuh Operator Pemain
    ctx.fillStyle = "#00ff66";
    ctx.shadowBlur = inBush ? 0 : 20;
    ctx.shadowColor = "#00ff66";
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Visor Helm Siber
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(5, -5, 6, 10);
    ctx.restore();
  }
}