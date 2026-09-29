// =================================================================
// 💥 PLASMA PROJECTILE SYSTEM
// =================================================================

class Bullet {
  constructor(x, y, angle, speed = 850, damage = 25, ownerId = 'player', color = "#00f2fe") {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 4;
    this.damage = damage;
    this.ownerId = ownerId;
    this.color = color;
    this.life = 1.3; // Rentang waktu aktif peluru
    this.isDead = false;
  }

  update(dt, map) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;

    if (this.life <= 0 || this.x < 0 || this.x > map.width || this.y < 0 || this.y > map.height) {
      this.isDead = true;
    }

    // Deteksi tabrakan peluru dengan dinding penghalang
    for (let bar of map.barriers) {
      if (this.x > bar.x && this.x < bar.x + bar.w && this.y > bar.y && this.y < bar.y + bar.h) {
        this.isDead = true;
        break;
      }
    }
  }

  render(ctx, camera) {
    if (!camera.isVisible(this.x, this.y, this.radius)) return;
    const s = camera.toScreen(this.x, this.y);

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}