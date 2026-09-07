let snakeState = {};
const snakeGridSize = 45;

function initSnake() {
  let savedHighScore = localStorage.getItem("snake_high_score") || 0;
  snakeState = {
    snake: [{x: 8, y: 12}, {x: 7, y: 12}, {x: 6, y: 12}],
    dx: 1, dy: 0, nextDx: 1, nextDy: 0,
    food: {x: 12, y: 12}, score: 0, highScore: parseInt(savedHighScore),
    isGameOver: false, isStarted: false, speedCounter: 0
  };
  generateSnakeFood();
}

function generateSnakeFood() {
  let cols = canvas.width / snakeGridSize;
  let rows = canvas.height / snakeGridSize;
  snakeState.food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
}

function updateSnake() {
  let s = snakeState;
  if (!s.isStarted || s.isGameOver) return;

  let delay = Math.max(3, 8 - Math.floor(s.score / 50));
  s.speedCounter++;
  if (s.speedCounter % delay !== 0) return;

  s.dx = s.nextDx; s.dy = s.nextDy;
  let head = { x: s.snake[0].x + s.dx, y: s.snake[0].y + s.dy };
  let cols = canvas.width / snakeGridSize;
  let rows = canvas.height / snakeGridSize;

  if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
    playSound('hit');
    s.isGameOver = true;
    return;
  }

  for (let part of s.snake) {
    if (part.x === head.x && part.y === head.y) {
      playSound('hit');
      s.isGameOver = true;
      return;
    }
  }

  s.snake.unshift(head);
  if (head.x === s.food.x && head.y === s.food.y) {
    s.score += 10;
    playSound('eat');
    createParticles(
      s.food.x * snakeGridSize + snakeGridSize / 2,
      s.food.y * snakeGridSize + snakeGridSize / 2,
      "#ff007f", 15
    );
    if (s.score > s.highScore) {
      s.highScore = s.score;
      localStorage.setItem("snake_high_score", s.highScore);
    }
    generateSnakeFood();
  } else {
    s.snake.pop();
  }
}

function renderSnake() {
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

  ctx.save();
  ctx.shadowBlur = 25; ctx.shadowColor = "#ff007f";
  ctx.fillStyle = "#ff007f";
  ctx.beginPath();
  ctx.arc(s.food.x * snakeGridSize + snakeGridSize / 2, s.food.y * snakeGridSize + snakeGridSize / 2, snakeGridSize / 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < s.snake.length; i++) {
    let part = s.snake[i];
    ctx.save();
    if (i === 0) { ctx.shadowBlur = 20; ctx.shadowColor = "#00f2fe"; ctx.fillStyle = "#00f2fe"; }
    else { ctx.shadowBlur = 10; ctx.shadowColor = "#0072ff"; ctx.fillStyle = "#0072ff"; }
    ctx.fillRect(part.x * snakeGridSize + 3, part.y * snakeGridSize + 3, snakeGridSize - 6, snakeGridSize - 6);
    ctx.restore();
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText("Skor: " + s.score, 35, 65);
  ctx.fillStyle = "#ffc107";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("High Score: " + s.highScore, 35, 105);

  if (!s.isStarted) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00f2fe";
    ctx.font = "bold 50px sans-serif"; ctx.fillText("CYBER SNAKE", 185, 480);
    ctx.fillStyle = "#ffffff";
    ctx.font = "28px sans-serif"; ctx.fillText("Tekan SPASI Untuk Mulai", 190, 550);
  }

  if (s.isGameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px sans-serif"; ctx.fillText("GAME OVER", 180, 480);
    ctx.font = "28px sans-serif"; ctx.fillText("Skor Akhir: " + s.score, 250, 540);
    ctx.fillStyle = "#ffeb3b";
    ctx.fillText("Tekan SPASI untuk restart", 180, 600);
  }
}