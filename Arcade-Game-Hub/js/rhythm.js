// =================================================================
// ⚡ CYBER BEAT DASH (Rhythm Music Engine)
// Controls: D, F, J, K or Direct Lane Touch
// =================================================================

const RhythmGame = {
  instruction: "Ketuk Jalur Sesuai Not: <b>D - F - J - K</b> atau <b>Sentuh Layar</b>",
  state: {},
  laneKeys: ["KeyD", "KeyF", "KeyJ", "KeyK"],
  laneColors: ["#00f2fe", "#ff007f", "#ffea00", "#00e676"],

  init() {
    const savedHighScore = localStorage.getItem("rhythm_high_score") || 0;
    this.state = {
      lanes: 4,
      notes: [],
      score: 0,
      highScore: parseInt(savedHighScore),
      combo: 0,
      multiplier: 1,
      speed: 680, // Kecepatan meluncur not
      spawnTimer: 0,
      spawnInterval: 0.45,
      hitZoneY: canvas.height - 180,
      hitZoneHeight: 60,
      isStarted: false,
      isGameOver: false,
      health: 100
    };
  },

  update(dt) {
    const s = this.state;
    if (!s.isStarted || s.isGameOver) return;

    // Drain darah perlahan jika tidak ada aksi
    s.health = Math.max(0, s.health - 2.5 * dt);
    if (s.health <= 0) {
      this.gameOver();
      return;
    }

    // Spawn Not Dinamis Berpola
    s.spawnTimer += dt;
    if (s.spawnTimer >= s.spawnInterval) {
      s.spawnTimer = 0;
      const randomLane = Math.floor(Math.random() * s.lanes);
      s.notes.push({
        lane: randomLane,
        y: -40,
        hit: false
      });
      // Sedikit variasikan interval agar tidak monoton
      s.spawnInterval = Math.max(0.25, 0.45 - Math.floor(s.score / 200) * 0.03);
    }

    // Update Gerakan Not
    for (let i = s.notes.length - 1; i >= 0; i--) {
      const n = s.notes[i];
      n.y += s.speed * dt;

      // Terlewat (MISS)
      if (n.y > s.hitZoneY + s.hitZoneHeight + 20 && !n.hit) {
        s.notes.splice(i, 1);
        s.combo = 0;
        s.multiplier = 1;
        s.health = Math.max(0, s.health - 12);
        AudioEngine.play('hit');
        FX.triggerShake(8, 6);
        FX.spawnText(canvas.width / 2 - 40, s.hitZoneY, "MISS", "#ff1744");
      }
    }
  },

  hitLane(laneIndex) {
    const s = this.state;
    if (!s.isStarted) {
      s.isStarted = true;
      return;
    }
    if (s.isGameOver) {
      this.init();
      return;
    }

    const hitWindow = 70;
    let hitFound = false;

    for (let i = 0; i < s.notes.length; i++) {
      const n = s.notes[i];
      if (n.lane === laneIndex && !n.hit) {
        const diff = Math.abs(n.y - s.hitZoneY);
        if (diff < hitWindow) {
          n.hit = true;
          hitFound = true;
          s.notes.splice(i, 1);

          s.combo++;
          if (s.combo % 10 === 0 && s.multiplier < 8) s.multiplier++;

          const isPerfect = diff < 28;
          const points = (isPerfect ? 50 : 25) * s.multiplier;
          s.score += points;
          s.health = Math.min(100, s.health + 8);

          AudioEngine.playArpeggio(laneIndex + s.combo);
          FX.spawnParticles(
            (laneIndex + 0.5) * (canvas.width / s.lanes),
            s.hitZoneY,
            this.laneColors[laneIndex], 16, 7
          );
          FX.spawnText(
            (laneIndex + 0.2) * (canvas.width / s.lanes),
            s.hitZoneY - 30,
            isPerfect ? "PERFECT!" : "GREAT!",
            isPerfect ? "#ffea00" : "#00f2fe"
          );

          if (s.score > s.highScore) {
            s.highScore = s.score;
            localStorage.setItem("rhythm_high_score", s.highScore);
          }
          break;
        }
      }
    }

    if (!hitFound) {
      // Menekan saat tidak ada not
      s.health = Math.max(0, s.health - 4);
      AudioEngine.playTone(180, 'sine', 0.05, 0.1);
    }
  },

  gameOver() {
    this.state.isGameOver = true;
    AudioEngine.play('hit');
    FX.triggerShake(20, 15);
  },

  onKeyDown(e) {
    if (e.code === "Space") {
      if (!this.state.isStarted) this.state.isStarted = true;
      else if (this.state.isGameOver) this.init();
      return;
    }
    const idx = this.laneKeys.indexOf(e.code);
    if (idx !== -1) {
      this.hitLane(idx);
    }
  },

  onPointerDown(x, y) {
    if (!this.state.isStarted) {
      this.state.isStarted = true;
      return;
    }
    if (this.state.isGameOver) {
      this.init();
      return;
    }
    const laneWidth = canvas.width / this.state.lanes;
    const clickedLane = Math.floor(x / laneWidth);
    if (clickedLane >= 0 && clickedLane < this.state.lanes) {
      this.hitLane(clickedLane);
    }
  },

  render(ctx) {
    const s = this.state;
    const laneWidth = canvas.width / s.lanes;

    // Background Cyber Grid
    ctx.fillStyle = "#05040d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Garis Pemisah Jalur (Lanes)
    for (let i = 0; i <= s.lanes; i++) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(i * laneWidth, 0);
      ctx.lineTo(i * laneWidth, canvas.height);
      ctx.stroke();
    }

    // Target Hit Zone (Garis Penerima Not)
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(0, s.hitZoneY - 25, canvas.width, s.hitZoneHeight + 50);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00f2fe";
    ctx.strokeRect(0, s.hitZoneY, canvas.width, s.hitZoneHeight);

    // Huruf Panduan Jalur (D, F, J, K)
    const labels = ["D", "F", "J", "K"];
    for (let i = 0; i < s.lanes; i++) {
      ctx.fillStyle = this.laneColors[i];
      ctx.font = "bold 32px 'Orbitron', monospace";
      ctx.fillText(labels[i], i * laneWidth + laneWidth / 2 - 12, s.hitZoneY + 42);
    }
    ctx.restore();

    // Render Not-Not Meluncur
    for (let n of s.notes) {
      ctx.save();
      const color = this.laneColors[n.lane];
      ctx.shadowBlur = 20;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.fillRect(n.lane * laneWidth + 12, n.y, laneWidth - 24, 28);
      ctx.restore();
    }

    // Health Bar (Stamina Ritme)
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(35, 140, canvas.width - 70, 12);
    ctx.fillStyle = s.health > 30 ? "#00e676" : "#ff1744";
    ctx.fillRect(35, 140, (canvas.width - 70) * (s.health / 100), 12);

    // Skor & Combo HUD
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 40px 'Orbitron', monospace";
    ctx.fillText("Skor: " + s.score, 35, 65);

    ctx.fillStyle = "#ffea00";
    ctx.font = "bold 22px 'Rajdhani', sans-serif";
    ctx.fillText(`COMBO: ${s.combo}x (${s.multiplier}x BOOST) | REKOR: ${s.highScore}`, 35, 105);

    if (!s.isStarted) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00f2fe";
      ctx.font = "bold 48px 'Orbitron', monospace";
      ctx.fillText("BEAT DASH", 195, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText("Tekan D - F - J - K / Ketuk Jalur", 185, 540);
    } else if (s.isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff1744";
      ctx.font = "bold 56px 'Orbitron', monospace";
      ctx.fillText("BEAT FAILED", 165, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px 'Rajdhani', sans-serif";
      ctx.fillText("Skor Akhir: " + s.score, 260, 540);
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText("Tekan SPASI untuk Restart", 210, 600);
    }
  }
};
