// =================================================================
// 🤖 AUTONOMOUS AI BOTS (FSM: LOOT, PATROL, AGGRO, FLEE)
// =================================================================

class Bot {
  constructor(id, name, x, y) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.speed = 280 + Math.random() * 40;
    this.angle = Math.random() * Math.PI * 2;

    this.hp = 90;
    this.maxHp = 90;
    this.level = 1;
    this.isDead = false;

    this.state = 'LOOT'; // 'LOOT', 'PATROL', 'AGGRO', 'FLEE'
    this.shootTimer = Math.random() * 1.5;
    this.targetEntity = null;
  }

  update(dt, player, allBots, crates, zone, map, bullets) {
    if (this.isDead) return;

    this.shootTimer -= dt;

    // 1. Evaluasi Status HP & Zona (FLEE jika sekarat atau di luar Firewall)
    const insideZone = zone.isInside(this.x, this.y);
    if (!insideZone || this.hp < this.maxHp * 0.28) {
      this.state = 'FLEE';
    } else {
      // Cari lawan terdekat (bisa Pemain atau Bot lain)
      let nearestTarget = null;
      let minDistance = 420;

      // Cek Pemain
      if (!player.isDead && !map.isInBush(player.x, player.y)) {
        const d = Math.hypot(player.x - this.x, player.y - this.y);
        if (d < minDistance) {
          minDistance = d;
          nearestTarget = player;
        }
      }

      // Cek Bot Lain
      for (let other of allBots) {
        if (other !== this && !other.isDead && !map.isInBush(other.x, other.y)) {
          const d = Math.hypot(other.x - this.x, other.y - this.y);
          if (d < minDistance) {
            minDistance = d;
            nearestTarget = other;
          }
        }
      }

      if (nearestTarget) {
        this.state = 'AGGRO';
        this.targetEntity = nearestTarget;
      } else {
        // Jika tidak ada musuh, cari Peti Loot terdekat
        let nearestCrate = null;
        let minCrateDist = 550;
        for (let c of crates) {
          if (!c.isDead) {
            const cd = Math.hypot(c.x - this.x, c.y - this.y);
            if (cd < minCrateDist) {
              minCrateDist = cd;
              nearestCrate = c;
            }
          }
        }
        if (nearestCrate) {
          this.state = 'LOOT';
          this.targetEntity = nearestCrate;
        } else {
          this.state = 'PATROL';
        }
      }
    }

    // 2. Eksekusi Gerak Berdasarkan State
    let targetX = zone.currentX;
    let targetY = zone.currentY;

    if (this.state === 'FLEE') {
      // Berlari menuju titik tengah zona aman
      targetX = zone.currentX;
      targetY = zone.currentY;
    } else if (this.state === 'AGGRO' && this.targetEntity) {
      targetX = this.targetEntity.x;
      targetY = this.targetEntity.y;
      this.angle = Math.atan2(targetY - this.y, targetX - this.x);

      // Tembak musuh jika cooldown siap
      if (this.shootTimer <= 0) {
        this.shootTimer = 0.45;
        bullets.push(new Bullet(this.x, this.y, this.angle, 750, 18, this.id, "#ff0055"));
      }
    } else if (this.state === 'LOOT' && this.targetEntity) {
      targetX = this.targetEntity.x;
      targetY = this.targetEntity.y;
      this.angle = Math.atan2(targetY - this.y, targetX - this.x);

      if (Math.hypot(targetX - this.x, targetY - this.y) < 180 && this.shootTimer <= 0) {
        this.shootTimer = 0.55;
        bullets.push(new Bullet(this.x, this.y, this.angle, 700, 15, this.id, "#ff7700"));
      }
    }

    // Navigasi perpindahan posisi
    const moveAngle = Math.atan2(targetY - this.y, targetX - this.x);
    this.x += Math.cos(moveAngle) * this.speed * dt;
    this.y += Math.sin(moveAngle) * this.speed * dt;

    this.x = Math.max(this.radius, Math.min(map.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(map.height - this.radius, this.y));
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }

  render(ctx, camera, map) {
    if (this.isDead) return;
    // Fog of war: jika bot ada di semak dan pemain di luar semak, jangan render bot
    if (map.isInBush(this.x, this.y) && !map.isInBush(camera.x, camera.y)) return;
    if (!camera.isVisible(this.x, this.y, this.radius)) return;

    const s = camera.toScreen(this.x, this.y);

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(this.angle);

    // Moncong Senjata Bot
    ctx.fillStyle = "#ff0055";
    ctx.fillRect(8, -4, 14, 8);

    // Badan Bot Merah
    ctx.fillStyle = "#ff1744";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff1744";
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // HP Bar Mini di atas kepala bot
    ctx.rotate(-this.angle); // Reset rotasi untuk render HP bar horizontal
    const pct = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(-18, -this.radius - 10, 36, 4);
    ctx.fillStyle = "#ff0055";
    ctx.fillRect(-18, -this.radius - 10, 36 * pct, 4);
    ctx.restore();
  }
}