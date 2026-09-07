const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameInfo = document.getElementById("gameInfo");

let currentGame = 'flappy';

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

// Game Loop Utama
function mainLoop() {
  if (currentGame === 'flappy') {
    updateFlappy(canvas);
    renderFlappy(ctx, canvas);
  } else if (currentGame === 'snake') {
    updateSnake(canvas);
    renderSnake(ctx, canvas);
  } else if (currentGame === 'memory') {
    updateMemory(canvas);
    renderMemory(ctx, canvas);
  }
  requestAnimationFrame(mainLoop);
}

// Fungsi Berganti Game
function switchGame(gameName) {
  currentGame = gameName;

  document.querySelectorAll('.game-btn').forEach(btn => btn.classList.remove('active'));
  if (window.event && window.event.target) {
    window.event.target.classList.add('active');
  }

  if (gameName === 'flappy') {
    initFlappy(canvas);
    gameInfo.innerHTML = "Gunakan <b>SPASI</b> untuk melompat & <b>SHIFT</b> untuk Perisai.";
  } else if (gameName === 'snake') {
    initSnake(canvas);
    gameInfo.innerHTML = "Gunakan <b>Tombol Panah</b> untuk mengontrol arah Ular.";
  } else if (gameName === 'memory') {
    initMemory(canvas);
    gameInfo.innerHTML = "Klik ubin yang menyala menggunakan <b>Klik Mouse</b>!";
  }
}

// Event Listener Klik Mouse (Memory Game)
canvas.addEventListener("click", function(e) {
  let rect = canvas.getBoundingClientRect();
  let scaleX = canvas.width / rect.width;
  let scaleY = canvas.height / rect.height;

  let clickX = (e.clientX - rect.left) * scaleX;
  let clickY = (e.clientY - rect.top) * scaleY;

  if (currentGame === 'memory') {
    handleMemoryClick(clickX, clickY, canvas);
  }
});

// Event Listener Keyboard Global
document.addEventListener("keydown", function(e) {
  if (currentGame === 'flappy') {
    if (e.code === "Space") {
      if (flappyState.isGameOver) initFlappy(canvas);
      else flappyState.velocity = flappyState.jump;
    }
    if ((e.code === "ShiftLeft" || e.code === "ShiftRight") && !flappyState.isGameOver && !flappyState.isShieldActive && flappyState.shieldCooldownLeft <= 0) {
      flappyState.isShieldActive = true;
      flappyState.shieldTimeLeft = flappyState.shieldDuration;
      flappyState.shieldCooldownLeft = flappyState.shieldCooldown;
    }
  } else if (currentGame === 'snake') {
    let s = snakeState;
    if (e.code === "Space" && s.isGameOver) initSnake(canvas);
    if (e.code === "ArrowUp" && s.dy === 0) { s.nextDx = 0; s.nextDy = -1; }
    if (e.code === "ArrowDown" && s.dy === 0) { s.nextDx = 0; s.nextDy = 1; }
    if (e.code === "ArrowLeft" && s.dx === 0) { s.nextDx = -1; s.nextDy = 0; }
    if (e.code === "ArrowRight" && s.dx === 0) { s.nextDx = 1; s.nextDy = 0; }
  } else if (currentGame === 'memory') {
    if (e.code === "Space" && memoryState.phase === 'GAMEOVER') initMemory(canvas);
  }
});

// Langsung Jalankan Game Pertama (Tanpa Menunggu Promise Asset yang Berisiko Stalled)
initFlappy(canvas);
mainLoop();