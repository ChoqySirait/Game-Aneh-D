// =================================================================
// 🎮 CYBERBRAWL 2D: MAIN BOOTSTRAP (Sprint 1 Verification)
// =================================================================

const engine = new Engine("gameCanvas");
const camera = new Camera(2400, 2400);
const gameMap = new CyberMap(2400, 2400);

const minimapCanvas = document.getElementById("minimapCanvas");
const minimapCtx = minimapCanvas.getContext("2d");

// Karakter Uji Coba Sementara (Sprint 1)
const playerMock = {
  x: 1200,
  y: 1200,
  radius: 20,
  speed: 380,
  angle: 0
};

engine.onResize = (w, h) => {
  camera.resize(w, h);
};

// --- GAME LOOP UPDATE ---
function update(dt) {
  // Input Pergerakan 8 Arah (WASD)
  let moveX = 0;
  let moveY = 0;

  if (engine.keys["KeyW"] || engine.keys["ArrowUp"]) moveY -= 1;
  if (engine.keys["KeyS"] || engine.keys["ArrowDown"]) moveY += 1;
  if (engine.keys["KeyA"] || engine.keys["ArrowLeft"]) moveX -= 1;
  if (engine.keys["KeyD"] || engine.keys["ArrowRight"]) moveX += 1;

  if (moveX !== 0 && moveY !== 0) {
    moveX *= 0.7071;
    moveY *= 0.7071;
  }

  playerMock.x += moveX * playerMock.speed * dt;
  playerMock.y += moveY * playerMock.speed * dt;

  // Batasi agar karakter tidak keluar dari batas dunia (2400 x 2400)
  playerMock.x = Math.max(playerMock.radius, Math.min(gameMap.width - playerMock.radius, playerMock.x));
  playerMock.y = Math.max(playerMock.radius, Math.min(gameMap.height - playerMock.radius, playerMock.y));

  // Rotasi Karakter Menghadap Titik Kursor Mouse
  const worldMouse = camera.toWorld(engine.mouse.x, engine.mouse.y);
  playerMock.angle = Math.atan2(worldMouse.y - playerMock.y, worldMouse.x - playerMock.x);

  // Kamera Mengikuti Pemain Secara Halus
  camera.follow(playerMock.x, playerMock.y);
  camera.update(dt);
}

// --- GAME LOOP RENDER ---
function render(ctx) {
  // 1. Render Peta Dunia & Semak-Semak
  gameMap.render(ctx, camera);

  // 2. Render Karakter Pemain
  const screenPos = camera.toScreen(playerMock.x, playerMock.y);
  const inBush = gameMap.isInBush(playerMock.x, playerMock.y);

  ctx.save();
  ctx.translate(screenPos.x, screenPos.y);
  ctx.rotate(playerMock.angle);

  // Jika di dalam semak: karakter semi-transparan (Stealth Mode)
  ctx.globalAlpha = inBush ? 0.45 : 1.0;

  // Moncong Senjata Blaster
  ctx.fillStyle = "#00f2fe";
  ctx.fillRect(10, -4, 18, 8);

  // Tubuh Hero
  ctx.fillStyle = "#00ff66";
  ctx.shadowBlur = inBush ? 0 : 20;
  ctx.shadowColor = "#00ff66";
  ctx.beginPath();
  ctx.arc(0, 0, playerMock.radius, 0, Math.PI * 2);
  ctx.fill();

  // Visor Helm Siber
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(4, -5, 6, 10);
  ctx.restore();

  // 3. Render Radar Minimap (Pojok Kanan Atas)
  gameMap.renderMinimap(minimapCtx, 160, playerMock, []);
}

// Jalankan Engine
engine.start(update, render);