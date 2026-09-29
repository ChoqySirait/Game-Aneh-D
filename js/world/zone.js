// =================================================================
// ⭕ THE FIREWALL RING (Shrinking Circle Mechanism)
// =================================================================

class FirewallZone {
  constructor(mapWidth = 2400, mapHeight = 2400) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    this.currentX = mapWidth / 2;
    this.currentY = mapHeight / 2;
    this.currentRadius = 1400; // Radius awal menutupi hampir seluruh arena

    this.targetX = mapWidth / 2;
    this.targetY = mapHeight / 2;
    this.targetRadius = 1400;

    this.phase = 1;
    this.timer = 20; // 20 detik waktu tunggu sebelum menyusut
    this.isShrinking = false;
    this.shrinkSpeed = 35; // Kecepatan radius berkurang per detik
    this.dps = 4; // Damage per detik jika berada di luar zona
  }

  update(dt, onZoneShrinkStart) {
    if (!this.isShrinking) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.isShrinking = true;
        this.advancePhase();
        if (onZoneShrinkStart) onZoneShrinkStart(this.phase);
      }
    } else {
      // Proses penyusutan radius dan pergeseran titik tengah
      if (this.currentRadius > this.targetRadius) {
        this.currentRadius = Math.max(this.targetRadius, this.currentRadius - this.shrinkSpeed * dt);
        this.currentX += (this.targetX - this.currentX) * 0.5 * dt;
        this.currentY += (this.targetY - this.currentY) * 0.5 * dt;
      } else {
        // Selesai menyusut, masuk waktu tunggu fase berikutnya
        this.isShrinking = false;
        this.timer = 15;
      }
    }
  }

  advancePhase() {
    this.phase++;
    this.dps += 3; // Damage luar zona makin sakit di fase akhir
    const phases = [
      { r: 950, speed: 40 },
      { r: 550, speed: 30 },
      { r: 250, speed: 25 },
      { r: 80, speed: 15 } // Fase Final Showdown
    ];

    const next = phases[Math.min(this.phase - 2, phases.length - 1)];
    this.targetRadius = next.r;
    this.shrinkSpeed = next.speed;

    // Titik pusat lingkaran bergeser acak agar tidak selalu di tengah
    const maxOffset = (this.currentRadius - this.targetRadius) * 0.45;
    this.targetX = Math.max(next.r + 100, Math.min(this.mapWidth - next.r - 100, this.currentX + (Math.random() - 0.5) * maxOffset));
    this.targetY = Math.max(next.r + 100, Math.min(this.mapHeight - next.r - 100, this.currentY + (Math.random() - 0.5) * maxOffset));
  }

  isInside(x, y) {
    return Math.hypot(x - this.currentX, y - this.currentY) <= this.currentRadius;
  }

  render(ctx, camera) {
    const s = camera.toScreen(this.currentX, this.currentY);

    ctx.save();
    // Efek Garis Cincin Laser Pembatas
    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 6;
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#ff0055";
    ctx.beginPath();
    ctx.arc(s.x, s.y, this.currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Lapisan Berbahaya di Luar Ring (Dark Red Tint)
    ctx.fillStyle = "rgba(255, 0, 85, 0.08)";
    ctx.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);
    ctx.restore();
  }
}