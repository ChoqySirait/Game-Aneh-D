const eagleImg = new Image();
eagleImg.src = "data:image/svg+xml;utf8," + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">
    <path d="M 40 40 Q 20 10 5 25 Q 25 45 45 45 Z" fill="#5d4037" />
    <ellipse cx="45" cy="45" rx="25" ry="18" fill="#795548" />
    <polygon points="15,45 5,40 5,50" fill="#ffffff" />
    <path d="M 55 32 C 55 22, 75 22, 80 35 C 80 48, 60 52, 55 45 Z" fill="#ffffff" />
    <path d="M 78 33 Q 95 35 90 45 Q 80 43 78 38 Z" fill="#ffc107" />
    <circle cx="70" cy="33" r="3" fill="#000000" />
    <path d="M 45 42 Q 30 5 10 12 Q 25 38 50 48 Z" fill="#8d6e63" />
  </svg>
`);

const pipeImg = new Image();
pipeImg.src = "data:image/svg+xml;utf8," + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 500" preserveAspectRatio="none">
    <defs>
      <linearGradient id="pipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#1b5e20" />
        <stop offset="40%" stop-color="#4caf50" />
        <stop offset="70%" stop-color="#81c784" />
        <stop offset="100%" stop-color="#1b5e20" />
      </linearGradient>
    </defs>
    <rect x="5" y="0" width="90" height="500" fill="url(#pipeGrad)" stroke="#0d3c10" stroke-width="4"/>
    <rect x="0" y="0" width="100" height="30" fill="url(#pipeGrad)" stroke="#0d3c10" stroke-width="4" rx="6"/>
  </svg>
`);

let flappyState = {};

function initFlappy() {
  let savedHighScore = localStorage.getItem("flappy_high_score") || 0;
  flappyState = {
    birdX: 100, birdY: 300, birdWidth: 80, birdHeight: 64,
    gravity: 0.5, velocity: 0, jump: -9.5,
    isShieldActive: false, shieldDuration: 300, shieldTimeLeft: 0,
    shieldCooldown: 600, shieldCooldownLeft: 0,
    pipes: [], pipeWidth: 110, baseGap: 280, baseSpeed: 4,
    frameCount: 0, score: 0, highScore: parseInt(savedHighScore),
    isGameOver: false, isStarted: false
  };
}

function updateFlappy() {
  let s = flappyState;
  if (!s.isStarted || s.isGameOver) return;

  // Tingkat Kesulitan Dinamis berdasarkan Skor
  let speedMultiplier = Math.min(2.0, 1 + Math.floor(s.score / 5) * 0.1);
  let currentSpeed = s.baseSpeed * speedMultiplier;
  let currentGap = Math.max(200, s.baseGap - Math.floor(s.score / 5) * 10);

  s.velocity += s.gravity;
  s.birdY += s.velocity;

  if (s.isShieldActive) {
    s.shieldTimeLeft--;
    if (s.shieldTimeLeft <= 0) s.isShieldActive = false;
  } else if (s.shieldCooldownLeft > 0) {
    s.shieldCooldownLeft--;
  }

  s.frameCount++;
  let spawnInterval = Math.max(60, Math.floor(100 / speedMultiplier));
  if (s.frameCount % spawnInterval === 0) {
    let topPipe = Math.floor(Math.random() * (canvas.height - currentGap - 200)) + 100;
    s.pipes.push({ x: canvas.width, top: topPipe, gap: currentGap, passed: false });
  }

  for (let i = 0; i < s.pipes.length; i++) {
    let p = s.pipes[i];
    p.x -= currentSpeed;

    if (!p.passed && p.x + s.pipeWidth < s.birdX) {
      s.score++;
      p.passed = true;
      if (s.score > s.highScore) {
        s.highScore = s.score;
        localStorage.setItem("flappy_high_score", s.highScore);
      }
    }

    if (
      s.birdX + s.birdWidth - 10 > p.x &&
      s.birdX + 10 < p.x + s.pipeWidth &&
      (s.birdY + 10 < p.top || s.birdY + s.birdHeight - 10 > p.top + p.gap)
    ) {
      if (s.isShieldActive) p.x = -s.pipeWidth * 2;
      else s.isGameOver = true;
    }
  }

  if (s.birdY + s.birdHeight > canvas.height || s.birdY < 0) s.isGameOver = true;
  if (s.pipes.length > 0 && s.pipes[0].x < -s.pipeWidth) s.pipes.shift();
}

function renderFlappy() {
  let s = flappyState;

  let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, "#0b132b"); bgGrad.addColorStop(0.5, "#1c2541"); bgGrad.addColorStop(1, "#3a506b");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < s.pipes.length; i++) {
    let p = s.pipes[i];
    ctx.save();
    ctx.translate(p.x + s.pipeWidth / 2, p.top / 2);
    ctx.scale(1, -1);
    ctx.drawImage(pipeImg, -s.pipeWidth / 2, -p.top / 2, s.pipeWidth, p.top);
    ctx.restore();
    ctx.drawImage(pipeImg, p.x, p.top + p.gap, s.pipeWidth, canvas.height - (p.top + p.gap));
  }

  ctx.save();
  ctx.translate(s.birdX + s.birdWidth / 2, s.birdY + s.birdHeight / 2);
  ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (s.velocity / 12))));
  if (s.isShieldActive) { ctx.shadowBlur = 35; ctx.shadowColor = "#ff1744"; }
  ctx.drawImage(eagleImg, -s.birdWidth / 2, -s.birdHeight / 2, s.birdWidth, s.birdHeight);
  ctx.restore();

  // Score & High Score
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText("Skor: " + s.score, 35, 65);
  ctx.fillStyle = "#ffc107";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("High Score: " + s.highScore, 35, 105);

  ctx.font = "bold 24px sans-serif";
  if (s.isShieldActive) { ctx.fillStyle = "#ff1744"; ctx.fillText("PERISAI AKTIF: " + Math.ceil(s.shieldTimeLeft / 60) + "s", 35, 145); }
  else if (s.shieldCooldownLeft > 0) { ctx.fillStyle = "#ffeb3b"; ctx.fillText("Cooldown: " + Math.ceil(s.shieldCooldownLeft / 60) + "s", 35, 145); }
  else { ctx.fillStyle = "#00e676"; ctx.fillText("Perisai READY (Shift)", 35, 145); }

  // Start Screen Overlay
  if (!s.isStarted) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00f2fe";
    ctx.font = "bold 50px sans-serif";
    ctx.fillText("FLAPPY EAGLE", 180, 480);
    ctx.fillStyle = "#ffffff";
    ctx.font = "28px sans-serif";
    ctx.fillText("Tekan SPASI Untuk Mulai", 190, 550);
  }

  // Game Over Overlay
  if (s.isGameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px sans-serif"; ctx.fillText("GAME OVER", 180, 480);
    ctx.font = "28px sans-serif"; ctx.fillText("Skor Akhir: " + s.score, 250, 540);
    ctx.fillStyle = "#ffeb3b";
    ctx.fillText("Tekan SPASI untuk main lagi", 170, 600);
  }
}