let snakeState = {};
const snakeGridSize = 45;

function initSnake(canvas) {
  snakeState = {
    snake: [{x: 8, y: 12}, {x: 7, y: 12}, {x: 6, y: 12}],
    dx: 1, dy: 0, nextDx: 1, nextDy: 0,
    food: {x: 12, y: 12},
    score: 0, isGameOver: false, speedCounter: 0
  };
  generateSnakeFood(canvas);
}

function generateSnakeFood(canvas) {
  let cols = canvas.width / snakeGridSize;
  let rows = canvas.height / snakeGridSize;
  snakeState.food = {
    x: Math.floor(Math.random() * cols),
    y: Math.floor(Math.random() * rows)
  };
}

function updateSnake(canvas) {
  let s = snakeState;
  if (s.isGameOver) return;

  s.speedCounter++;
  if (s.speedCounter % 8 !== 0) return;

  s.dx = s.nextDx; s.dy = s.nextDy;
  let head = { x: s.snake[0].x + s.dx, y: s.snake[0].y + s.dy };

  let cols = canvas.width / snakeGridSize;
  let rows = canvas.height / snakeGridSize;
  if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
    s.isGameOver = true; return;
  }

  for (let part of s.snake) {
    if (part.x === head.x && part.y === head.y) { s.isGameOver = true; return; }
  }

  s.snake.unshift(head);

  if (head.x === s.food.x && head.y === s.food.y) {
    s.score += 10;
    generateSnakeFood(canvas);
  } else {
    s.snake.pop();
  }
}

function renderSnake(ctx, canvas) {
  let s = snakeState;
  
  ctx.fillStyle = "#050811";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(0, 242, 254, 0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += snakeGridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += snakeGridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Makanan Orb Neon
  ctx.save();
  ctx.shadowBlur = 25;
  ctx.shadowColor = "#ff007f";
  ctx.fillStyle = "#ff007f";
  ctx.beginPath();
  ctx.arc(
    s.food.x * snakeGridSize + snakeGridSize / 2,
    s.food.y * snakeGridSize + snakeGridSize / 2,
    snakeGridSize / 2.5, 0, Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  // Ular (Menggunakan fillRect Standar yang Aman)
  for (let i = 0; i < s.snake.length; i++) {
    let part = s.snake[i];
    ctx.save();
    if (i === 0) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#00f2fe";
      ctx.fillStyle = "#00f2fe";
    } else {
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#0072ff";
      ctx.fillStyle = "#0072ff";
    }
    
    ctx.fillRect(
      part.x * snakeGridSize + 3, part.y * snakeGridSize + 3,
      snakeGridSize - 6, snakeGridSize - 6
    );
    ctx.restore();
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 42px sans-serif";
  ctx.fillText("Skor: " + s.score, 35, 75);

  if (s.isGameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px sans-serif"; ctx.fillText("GAME OVER", 180, 500);
    ctx.font = "30px sans-serif"; ctx.fillText("Tekan SPASI untuk restart", 180, 570);
  }
}