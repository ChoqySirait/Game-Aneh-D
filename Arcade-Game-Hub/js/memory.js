let memoryState = {};

function initMemory() {
  memoryState = {
    gridSize: 4, activeTiles: [], selectedTiles: [],
    phase: 'SHOW', showTimer: 0, showDuration: 90, level: 1, lives: 3, score: 0
  };
  startMemoryLevel();
}

function startMemoryLevel() {
  let s = memoryState;
  s.phase = 'SHOW';
  s.showTimer = s.showDuration;
  s.activeTiles = [];
  s.selectedTiles = [];
  let totalTiles = s.gridSize * s.gridSize;
  let targetCount = Math.min(3 + s.level, 10);
  while (s.activeTiles.length < targetCount) {
    let rand = Math.floor(Math.random() * totalTiles);
    if (!s.activeTiles.includes(rand)) s.activeTiles.push(rand);
  }
}

function updateMemory() {
  let s = memoryState;
  if (s.phase === 'SHOW') {
    s.showTimer--;
    if (s.showTimer <= 0) s.phase = 'GUESS';
  }
}

function renderMemory() {
  let s = memoryState;
  let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, "#12002b"); bgGrad.addColorStop(1, "#290054");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let padding = 40;
  let boardSize = canvas.width - (padding * 2);
  let tileSize = boardSize / s.gridSize;
  let startY = (canvas.height - boardSize) / 2;

  for (let r = 0; r < s.gridSize; r++) {
    for (let c = 0; c < s.gridSize; c++) {
      let index = r * s.gridSize + c;
      let x = padding + c * tileSize;
      let y = startY + r * tileSize;

      ctx.save();
      let isActive = s.activeTiles.includes(index);
      let isSelected = s.selectedTiles.includes(index);

      if (s.phase === 'SHOW' && isActive) {
        ctx.shadowBlur = 30; ctx.shadowColor = "#00f2fe"; ctx.fillStyle = "#00f2fe";
      } else if (s.phase === 'GUESS' && isSelected) {
        if (isActive) { ctx.shadowBlur = 30; ctx.shadowColor = "#00e676"; ctx.fillStyle = "#00e676"; }
        else { ctx.shadowBlur = 30; ctx.shadowColor = "#ff1744"; ctx.fillStyle = "#ff1744"; }
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      }
      ctx.fillRect(x + 6, y + 6, tileSize - 12, tileSize - 12);
      ctx.restore();
    }
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText("Level: " + s.level, 40, 80);
  ctx.fillText("Skor: " + s.score, 40, 130);
  ctx.fillStyle = "#ff1744";
  ctx.fillText("❤️ ".repeat(s.lives), canvas.width - 200, 80);

  ctx.fillStyle = s.phase === 'SHOW' ? "#00f2fe" : "#ffeb3b";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(s.phase === 'SHOW' ? "HAFALKAN UBIN!" : "PILIH UBIN KEMBALI!", 40, startY - 30);

  if (s.phase === 'GAMEOVER') {
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px sans-serif"; ctx.fillText("GAME OVER", 180, 500);
    ctx.font = "30px sans-serif"; ctx.fillText("Tekan SPASI untuk main lagi", 170, 570);
  }
}

function handleMemoryClick(x, y) {
  let s = memoryState;
  if (s.phase !== 'GUESS') return;

  let padding = 40;
  let boardSize = canvas.width - (padding * 2);
  let tileSize = boardSize / s.gridSize;
  let startY = (canvas.height - boardSize) / 2;

  let c = Math.floor((x - padding) / tileSize);
  let r = Math.floor((y - startY) / tileSize);

  if (c >= 0 && c < s.gridSize && r >= 0 && r < s.gridSize) {
    let index = r * s.gridSize + c;
    if (!s.selectedTiles.includes(index)) {
      s.selectedTiles.push(index);
      playSound('tile');
      createParticles(x, y, "#00f2fe", 10);

      if (!s.activeTiles.includes(index)) {
        s.lives--;
        if (s.lives <= 0) {
          playSound('hit');
          s.phase = 'GAMEOVER';
        }
      } else {
        let correctCount = s.selectedTiles.filter(t => s.activeTiles.includes(t)).length;
        if (correctCount === s.activeTiles.length) {
          s.score += 50;
          s.level++;
          setTimeout(() => startMemoryLevel(), 800);
        }
      }
    }
  }
}