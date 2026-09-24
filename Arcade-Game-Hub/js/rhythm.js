const RhythmGame = {
  instruction: "Tekan Sesuai Irama: <b>D - F - J - K</b> atau <b>Sentuh Tombol Bawah</b>",
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
      maxCombo: 0,
      multiplier: 1,
      health: 100,

      vanishingY: 140,
      hitY: canvas.height - 180,
      topWidth: 260,
      bottomWidth: canvas.width - 40,

      bpm: 128,
      beatTimer: 0,
      songTime: 0,
      keyGlow: [0, 0, 0, 0],

      isStarted: false,
      isGameOver: false
    };
  },

  getLaneX(laneIndex, y) {
    const s = this.state;
    const progress = (y - s.vanishingY) / (s.hitY - s.vanishingY);
    const currentTrackWidth = s.topWidth + (s.bottomWidth - s.topWidth) * Math.max(0, progress);
    const startX = (canvas.width - currentTrackWidth) / 2;
    const laneWidth = currentTrackWidth / s.lanes;
    return startX + (laneIndex + 0.5) * laneWidth;
  },

  getLaneWidth(y) {
    const s = this.state;
    const progress = (y - s.vanishingY) / (s.hitY - s.vanishingY);
    const currentTrackWidth = s.topWidth + (s.bottomWidth - s.topWidth) * Math.max(0, progress);
    return currentTrackWidth / s.lanes;
  },

  update(dt) {
    const s = this.state;
    if (!s.isStarted || s.isGameOver) return;

    s.songTime += dt;
    s.beatTimer += dt;
    const beatInterval = 60 / s.bpm;

    for (let i = 0; i < s.lanes; i++) {
      if (s.keyGlow[i] > 0) s.keyGlow[i] -= 5 * dt;
    }

    s.health = Math.max(0, s.health - 1.5 * dt);
    if (s.health <= 0) {
      this.gameOver();
      return;
    }

    if (s.beatTimer >= beatInterval) {
      s.beatTimer -= beatInterval;
      
      const patternChoice = Math.floor(s.songTime * 2) % 4;
      const targetLanes = patternChoice === 3 ? [0, 3] : [Math.floor(Math.random() * s.lanes)];

      for (let lane of targetLanes) {
        s.notes.push({
          lane: lane,
          y: s.vanishingY,
          speed: 480 + Math.min(240, Math.floor(s.score / 300) * 20),
          hit: false
        });
      }
    }

    for (let i = s.notes.length - 1; i >= 0; i--) {
      const n = s.notes[i];
      n.y += n.speed * dt;

      if (n.y > s.hitY + 45 && !n.hit) {
        s.notes.splice(i, 1);
        s.combo = 0;
        s.multiplier = 1;
        s.health = Math.max(0, s.health - 8);
        AudioEngine.play('hit');
        FX.triggerShake(6, 5);
        FX.spawnText(this.getLaneX(n.lane, s.hitY) - 30, s.hitY, "MISS", "#ff1744");
      }
    }
  },

  hitLane(laneIndex) {
    const s = this.state;
    if (!s.isStarted) { s.isStarted = true; return; }
    if (s.isGameOver) { this.init(); s.isStarted = true; return; }

    s.keyGlow[laneIndex] = 1.0;
    const hitTolerance = 75;
    let hitFound = false;

    for (let i = 0; i < s.notes.length; i++) {
      const n = s.notes[i];
      if (n.lane === laneIndex && !n.hit) {
        const delta = Math.abs(n.y - s.hitY);
        if (delta < hitTolerance) {
          n.hit = true;
          hitFound = true;
          s.notes.splice(i, 1);

          s.combo++;
          if (s.combo > s.maxCombo) s.maxCombo = s.combo;
          if (s.combo % 6 === 0 && s.multiplier < 5) s.multiplier++;

          const isPerfect = delta < 26;
          const points = (isPerfect ? 60 : 30) * s.multiplier;
          s.score += points;
          s.health = Math.min(100, s.health + 6);

          AudioEngine.playArpeggio(laneIndex + s.combo);
          const hitX = this.getLaneX(laneIndex, s.hitY);
          FX.spawnParticles(hitX, s.hitY, this.laneColors[laneIndex], isPerfect ? 20 : 12, 6);
          FX.spawnText(hitX - 35, s.hitY - 35, isPerfect ? "PERFECT!" : "GREAT!", isPerfect ? "#ffea00" : "#00f2fe");

          if (s.score > s.highScore) {
            s.highScore = s.score;
            localStorage.setItem("rhythm_high_score", s.highScore);
          }
          break;
        }
      }
    }

    if (!hitFound) {
      s.health = Math.max(0, s.health - 2);
      AudioEngine.playTone(160, 'sine', 0.04, 0.08);
    }
  },

  gameOver() {
    this.state.isGameOver = true;
    AudioEngine.play('hit');
    FX.triggerShake(22, 14);
  },

  onKeyDown(e) {
    if (e.code === "Space") {
      if (!this.state.isStarted) this.state.isStarted = true;
      else if (this.state.isGameOver) { this.init(); this.state.isStarted = true; }
      e.preventDefault();
      return;
    }
    const idx = this.laneKeys.indexOf(e.code);
    if (idx !== -1) {
      this.hitLane(idx);
      e.preventDefault();
    }
  },

  onPointerDown(x, y) {
    if (!this.state.isStarted) { this.state.isStarted = true; return; }
    if (this.state.isGameOver) { this.init(); this.state.isStarted = true; return; }

    const s = this.state;
    for (let i = 0; i < s.lanes; i++) {
      const lx = this.getLaneX(i, s.hitY);
      const kw = this.getLaneWidth(s.hitY);
      if (x >= lx - kw / 2 && x <= lx + kw / 2) {
        this.hitLane(i);
        break;
      }
    }
  },

  render(ctx) {
    const s = this.state;

    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#030208");
    bg.addColorStop(0.5, "#0b0416");
    bg.addColorStop(1, "#180629");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const trackGrad = ctx.createLinearGradient(0, s.vanishingY, 0, canvas.height);
    trackGrad.addColorStop(0, "rgba(0, 242, 254, 0.05)");
    trackGrad.addColorStop(1, "rgba(255, 0, 127, 0.12)");

    ctx.fillStyle = trackGrad;
    ctx.beginPath();
    ctx.moveTo((canvas.width - s.topWidth) / 2, s.vanishingY);
    ctx.lineTo((canvas.width + s.topWidth) / 2, s.vanishingY);
    ctx.lineTo((canvas.width + s.bottomWidth) / 2, canvas.height);
    ctx.lineTo((canvas.width - s.bottomWidth) / 2, canvas.height);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i <= s.lanes; i++) {
      const topX = (canvas.width - s.topWidth) / 2 + i * (s.topWidth / s.lanes);
      const botX = (canvas.width - s.bottomWidth) / 2 + i * (s.bottomWidth / s.lanes);

      ctx.strokeStyle = i === 0 || i === s.lanes ? "#00f2fe" : "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = i === 0 || i === s.lanes ? 3 : 1;
      ctx.shadowBlur = i === 0 || i === s.lanes ? 10 : 0;
      ctx.shadowColor = "#00f2fe";
      ctx.beginPath();
      ctx.moveTo(topX, s.vanishingY);
      ctx.lineTo(botX, canvas.height);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#00f2fe";
    ctx.beginPath();
    ctx.moveTo((canvas.width - s.bottomWidth) / 2, s.hitY);
    ctx.lineTo((canvas.width + s.bottomWidth) / 2, s.hitY);
    ctx.stroke();
    ctx.restore();

    for (let n of s.notes) {
      if (n.y < s.vanishingY) continue;
      const nx = this.getLaneX(n.lane, n.y);
      const nw = this.getLaneWidth(n.y) * 0.76;
      const progress = (n.y - s.vanishingY) / (s.hitY - s.vanishingY);
      const nh = 12 + progress * 24;

      ctx.save();
      ctx.fillStyle = this.laneColors[n.lane];
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.laneColors[n.lane];
      ctx.fillRect(nx - nw / 2, n.y - nh / 2, nw, nh);
      ctx.restore();
    }

    const labels = ["D", "F", "J", "K"];
    for (let i = 0; i < s.lanes; i++) {
      const kx = this.getLaneX(i, s.hitY);
      const kw = this.getLaneWidth(s.hitY) * 0.8;

      ctx.save();
      const glow = s.keyGlow[i];
      ctx.fillStyle = glow > 0.1 ? this.laneColors[i] : "rgba(255, 255, 255, 0.08)";
      ctx.strokeStyle = this.laneColors[i];
      ctx.lineWidth = 2;
      ctx.shadowBlur = glow > 0.1 ? 25 : 8;
      ctx.shadowColor = this.laneColors[i];
      ctx.strokeRect(kx - kw / 2, s.hitY + 12, kw, 50);
      ctx.fillRect(kx - kw / 2, s.hitY + 12, kw, 50);

      ctx.fillStyle = glow > 0.1 ? "#000000" : "#ffffff";
      ctx.font = "bold 26px 'Orbitron', monospace";
      ctx.fillText(labels[i], kx - 10, s.hitY + 47);
      ctx.restore();
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(35, 120, canvas.width - 70, 10);
    ctx.fillStyle = s.health > 30 ? "#00e676" : "#ff0055";
    ctx.fillRect(35, 120, (canvas.width - 70) * (s.health / 100), 10);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px 'Orbitron', monospace";
    ctx.fillText("Skor: " + s.score, 35, 65);

    ctx.fillStyle = "#ffea00";
    ctx.font = "bold 20px 'Rajdhani', sans-serif";
    ctx.fillText(`COMBO: ${s.combo}x (${s.multiplier}x BOOST) | REKOR: ${s.highScore}`, 35, 95);

    if (!s.isStarted) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#00f2fe";
      ctx.font = "bold 46px 'Orbitron', monospace";
      ctx.fillText("BEAT DASH", 185, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "24px 'Rajdhani', sans-serif";
      ctx.fillText("Tekan SPASI / Ketuk Layar", 200, 540);
    } else if (s.isGameOver) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ff1744";
      ctx.font = "bold 54px 'Orbitron', monospace";
      ctx.fillText("SONG FAILED", 165, 480);
      ctx.fillStyle = "#ffffff";
      ctx.font = "26px 'Rajdhani', sans-serif";
      ctx.fillText("Skor Akhir: " + s.score, 260, 540);
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText("Tekan SPASI untuk Restart", 210, 600);
    }
  }
};

registerScene('rhythm', RhythmGame);