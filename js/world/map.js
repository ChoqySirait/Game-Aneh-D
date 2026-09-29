// =================================================================
// 🗺️ CYBER ARENA MAP GENERATOR (2400 x 2400 px)
// Features: Grid Matrix, Boundary Walls, Neon Circuit Tracks, Stealth Bushes
// =================================================================

class CyberMap {
  constructor(width = 2400, height = 2400) {
    this.width = width;
    this.height = height;
    this.gridSize = 80;

    // Semak-Semak Neon (Stealth Bushes)
    this.bushes = [
      { x: 600, y: 600, radius: 90 },
      { x: 1800, y: 600, radius: 90 },
      { x: 600, y: 1800, radius: 90 },
      { x: 1800, y: 1800, radius: 90 },
      { x: 1200, y: 800, radius: 110 },
      { x: 1200, y: 1600, radius: 110 },
      { x: 800, y: 1200, radius: 110 },
      { x: 1600, y: 1200, radius: 110 },
      { x: 1200, y: 1200, radius: 130 } // Semak Inti Tengah
    ];

    // Dinding Rintangan Pelindung (Cover Barriers)
    this.barriers = [
      { x: 900, y: 900, w: 120, h: 40 },
      { x: 1380, y: 900, w: 120, h: 40 },
      { x: 900, y: 1460, w: 120, h: 40 },
      { x: 1380, y: 1460, w: 120, h: 40 },
      { x: 500, y: 1160, w: 40, h: 120 },
      { x: 1860, y: 1160, w: 40, h: 120 }
    ];
  }

  // Cek apakah entitas berada di dalam semak taktis
  isInBush(entityX, entityY) {
    for (let bush of this.bushes) {
      if (Math.hypot(entityX - bush.x, entityY - bush.y) < bush.radius) {
        return true;
      }
    }
    return false;
  }

  render(ctx, camera) {
    // 1. Gambar Latar Gelap Dunia
    ctx.fillStyle = "#02050b";
    ctx.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);

    // 2. Render Garis Grid Sirkuit Neon
    ctx.save();
    ctx.strokeStyle = "rgba(0, 242, 254, 0.04)";
    ctx.lineWidth = 1;

    // Batasi rendering grid hanya pada area yang tampak di layar (Optimasi)
    const startCol = Math.floor(Math.max(0, camera.x - camera.viewportWidth / 2) / this.gridSize);
    const endCol = Math.ceil(Math.min(this.width, camera.x + camera.viewportWidth / 2) / this.gridSize);
    const startRow = Math.floor(Math.max(0, camera.y - camera.viewportHeight / 2) / this.gridSize);
    const endRow = Math.ceil(Math.min(this.height, camera.y + camera.viewportHeight / 2) / this.gridSize);

    for (let c = startCol; c <= endCol; c++) {
      const wx = c * this.gridSize;
      const s = camera.toScreen(wx, 0);
      ctx.beginPath();
      ctx.moveTo(s.x, 0);
      ctx.lineTo(s.x, camera.viewportHeight);
      ctx.stroke();
    }

    for (let r = startRow; r <= endRow; r++) {
      const wy = r * this.gridSize;
      const s = camera.toScreen(0, wy);
      ctx.beginPath();
      ctx.moveTo(0, s.y);
      ctx.lineTo(camera.viewportWidth, s.y);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Render Batas Luar Peta (World Boundaries)
    ctx.save();
    const mapTopLeft = camera.toScreen(0, 0);
    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 6;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#ff0055";
    ctx.strokeRect(mapTopLeft.x, mapTopLeft.y, this.width, this.height);
    ctx.restore();

    // 4. Render Dinding Pelindung (Barriers)
    ctx.save();
    ctx.fillStyle = "#0e1a2e";
    ctx.strokeStyle = "#00f2fe";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00f2fe";

    for (let bar of this.barriers) {
      if (camera.isVisible(bar.x + bar.w / 2, bar.y + bar.h / 2, Math.max(bar.w, bar.h))) {
        const s = camera.toScreen(bar.x, bar.y);
        ctx.fillRect(s.x, s.y, bar.w, bar.h);
        ctx.strokeRect(s.x, s.y, bar.w, bar.h);
      }
    }
    ctx.restore();

    // 5. Render Semak Neon (Stealth Bushes)
    for (let bush of this.bushes) {
      if (camera.isVisible(bush.x, bush.y, bush.radius)) {
        const s = camera.toScreen(bush.x, bush.y);
        ctx.save();
        ctx.fillStyle = "rgba(0, 255, 102, 0.12)";
        ctx.strokeStyle = "rgba(0, 255, 102, 0.4)";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00ff66";
        ctx.beginPath();
        ctx.arc(s.x, s.y, bush.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Render Peta Versi Mini pada Canvas Radar (Pojok Kanan Atas)
  renderMinimap(ctx, minimapSize, player, bots = []) {
    ctx.clearRect(0, 0, minimapSize, minimapSize);
    const scale = minimapSize / this.width;

    // Batas Map
    ctx.strokeStyle = "rgba(0, 242, 254, 0.3)";
    ctx.strokeRect(0, 0, minimapSize, minimapSize);

    // Titik Semak
    ctx.fillStyle = "rgba(0, 255, 102, 0.3)";
    for (let b of this.bushes) {
      ctx.beginPath();
      ctx.arc(b.x * scale, b.y * scale, b.radius * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // Titik Bot Musuh (Merah)
    ctx.fillStyle = "#ff0055";
    for (let bot of bots) {
      if (!bot.isDead && !this.isInBush(bot.x, bot.y)) {
        ctx.beginPath();
        ctx.arc(bot.x * scale, bot.y * scale, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Titik Pemain (Hijau Neon Terang)
    if (player) {
      ctx.fillStyle = "#00ff66";
      ctx.beginPath();
      ctx.arc(player.x * scale, player.y * scale, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}