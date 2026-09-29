// =================================================================
// 📷 2D SMOOTH FOLLOW CAMERA SYSTEM
// Coordinates Conversion: World (2400x2400) -> Viewport (Dynamic)
// =================================================================

class Camera {
  constructor(worldWidth = 2400, worldHeight = 2400) {
    this.x = worldWidth / 2;
    this.y = worldHeight / 2;
    this.targetX = this.x;
    this.targetY = this.y;

    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;

    this.lerpSpeed = 0.08; // Kecepatan kamera mengikuti karakter
  }

  resize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  follow(targetX, targetY) {
    this.targetX = targetX;
    this.targetY = targetY;
  }

  update(dt) {
    // Interpolasi Lerp Mulus
    this.x += (this.targetX - this.x) * (1 - Math.pow(1 - this.lerpSpeed, dt * 60));
    this.y += (this.targetY - this.y) * (1 - Math.pow(1 - this.lerpSpeed, dt * 60));

    // Kunci kamera agar tidak menampilkan area di luar batas peta dunia
    const halfW = this.viewportWidth / 2;
    const halfH = this.viewportHeight / 2;

    if (this.worldWidth > this.viewportWidth) {
      this.x = Math.max(halfW, Math.min(this.worldWidth - halfW, this.x));
    } else {
      this.x = this.worldWidth / 2;
    }

    if (this.worldHeight > this.viewportHeight) {
      this.y = Math.max(halfH, Math.min(this.worldHeight - halfH, this.y));
    } else {
      this.y = this.worldHeight / 2;
    }
  }

  // Konversi Posisi Dunia ke Posisi Layar
  toScreen(worldX, worldY) {
    return {
      x: worldX - this.x + this.viewportWidth / 2,
      y: worldY - this.y + this.viewportHeight / 2
    };
  }

  // Konversi Posisi Kursor Layar ke Titik Koordinat Dunia
  toWorld(screenX, screenY) {
    return {
      x: screenX - this.viewportWidth / 2 + this.x,
      y: screenY - this.viewportHeight / 2 + this.y
    };
  }

  // Frustum Culling: Cek apakah objek terlihat di layar sebelum dirender
  isVisible(worldX, worldY, radius = 50) {
    const screen = this.toScreen(worldX, worldY);
    return (
      screen.x + radius >= 0 &&
      screen.x - radius <= this.viewportWidth &&
      screen.y + radius >= 0 &&
      screen.y - radius <= this.viewportHeight
    );
  }
}