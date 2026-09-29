// =================================================================
// 📦 DATA CRATE & LOOT ORBS
// =================================================================

class Crate {
  constructor(x, y, size = 38, hp = 60) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.hp = hp;
    this.maxHp = hp;
    this.isDead = false;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.isDead = true;
    }
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.x, this.y, this.size)) return;
    const s = camera.toScreen(this.x, this.y);

    ctx.save();
    ctx.fillStyle = "#0c1524";
    ctx.strokeStyle = "#ffea00";
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ffea00";

    ctx.fillRect(s.x - this.size / 2, s.y - this.size / 2, this.size, this.size);
    ctx.strokeRect(s.x - this.size / 2, s.y - this.size / 2, this.size, this.size);

    // HP Bar Mini di atas peti jika sudah kena hit
    if (this.hp < this.maxHp) {
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(s.x - this.size / 2, s.y - this.size / 2 - 8, this.size, 4);
      ctx.fillStyle = "#ffea00";
      ctx.fillRect(s.x - this.size / 2, s.y - this.size / 2 - 8, this.size * pct, 4);
    }
    ctx.restore();
  }
}

// Orbs yang keluar saat peti hancur
class LootOrb {
  constructor(x, y, type = 'EXP') {
    this.x = x;
    this.y = y;
    this.type = type; // 'EXP' atau 'HEALTH'
    this.radius = 6;
    this.isDead = false;
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.x, this.y, this.radius)) return;
    const s = camera.toScreen(this.x, this.y);
    const color = this.type === 'HEALTH' ? "#00ff66" : "#00f2fe";

    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}