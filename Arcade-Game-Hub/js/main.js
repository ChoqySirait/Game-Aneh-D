const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gameInfo = document.getElementById("gameInfo");

let currentGame = 'flappy';

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

function mainLoop() {
  if (currentGame === 'flappy') {
    updateFlappy();
    renderFlappy();
  } else if (currentGame === 'snake') {
    updateSnake();
    renderSnake();
  } else if (currentGame === 'memory') {
    updateMemory();
    renderMemory();
  }
  requestAnimationFrame(mainLoop);
}

function switchGame(gameName, evt) {
  currentGame = gameName;
  document.querySelectorAll('.game-btn').forEach(btn => btn.classList.remove('active'));
  if (evt && evt.target) evt.target.classList.add('active');

  if (gameName === 'flappy') {
    initFlappy();
    gameInfo.innerHTML = "Gunakan <b>SPASI</b> untuk melompat & <b>SHIFT</b> untuk Perisai.";
  } else if (gameName === 'snake') {
    initSnake();
    gameInfo.innerHTML = "Gunakan <b>Tombol Panah</b> untuk mengontrol arah Ular.";
  } else if (gameName === 'memory') {
    initMemory();
    gameInfo.innerHTML = "Klik ubin yang menyala menggunakan <b>Klik Mouse</b>!";
  }
}

canvas.addEventListener("click", function(e) {
  let rect = canvas.getBoundingClientRect();
  let scaleX = canvas.width / rect.width;
  let scaleY = canvas.height / rect.height;
  let clickX = (e.clientX - rect.left) * scaleX;
  let clickY = (e.clientY - rect.top) * scaleY;

  if (currentGame === 'memory') handleMemoryClick(clickX, clickY);
});

document.addEventListener("keydown", function(e) {
  if (currentGame === 'flappy') {
    if (e.code === "Space") {
      if (!flappyState.isStarted) {
        flappyState.isStarted = true;
        flappyState.velocity = flappyState.jump;
      } else if (flappyState.isGameOver) {
        initFlappy();
      } else {
        flappyState.velocity = flappyState.jump;
      }
    }
    if ((e.code === "ShiftLeft" || e.code === "ShiftRight") && flappyState.isStarted && !flappyState.isGameOver && !flappyState.isShieldActive && flappyState.shieldCooldownLeft <= 0) {
      flappyState.isShieldActive = true;
      flappyState.shieldTimeLeft = flappyState.shieldDuration;
      flappyState.shieldCooldownLeft = flappyState.shieldCooldown;
    }
  } else if (currentGame === 'snake') {
    let s = snakeState;
    if (e.code === "Space") {
      if (!s.isStarted) s.isStarted = true;
      else if (s.isGameOver) initSnake();
    }
    if (e.code === "ArrowUp" && s.dy === 0) { s.nextDx = 0; s.nextDy = -1; if (!s.isStarted) s.isStarted = true; }
    if (e.code === "ArrowDown" && s.dy === 0) { s.nextDx = 0; s.nextDy = 1; if (!s.isStarted) s.isStarted = true; }
    if (e.code === "ArrowLeft" && s.dx === 0) { s.nextDx = -1; s.nextDy = 0; if (!s.isStarted) s.isStarted = true; }
    if (e.code === "ArrowRight" && s.dx === 0) { s.nextDx = 1; s.nextDy = 0; if (!s.isStarted) s.isStarted = true; }
  } else if (currentGame === 'memory') {
    if (e.code === "Space" && memoryState.phase === 'GAMEOVER') initMemory();
  }
});

// JALANKAN PERTAMA KALI
initFlappy();
mainLoop();