// ============================================================
// BLOCK BREAKER (base game)
//
// game.js  = the canvas, the ball, the paddle, and the game loop
// bricks.js     = where the bricks are and how they are drawn
// collisions.js = what happens when the ball touches things
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;   // 600
const HEIGHT = canvas.height; // 450


// ------------------------------------------------------------
// THE BALL
// x and y are the top-left corner. vx and vy are how many pixels
// the ball moves each update (vx = sideways, vy = up/down).
// A positive vy means the ball is moving DOWN the screen.
// ------------------------------------------------------------
const BALL_SPEED = 6;
let BALL_GRAVITY = 0.01;
const PADDLE_SPEED = 8;

let balls = [];
let ballLaunched = false;

// Put the ball above the paddle and wait for the player to launch it.
function resetBall() {
  balls = [{
    x: paddle.x + paddle.width / 2 - 7.5,
    y: paddle.y - 15,
    width: 15,
    height: 15,
    vx: 0,
    vy: 0
  }];
  ballLaunched = false;
}


// ------------------------------------------------------------
// THE PADDLE
// ------------------------------------------------------------
const paddle = {
  x: WIDTH / 2 - 45,
  y: HEIGHT - 30,
  width: 90,
  height: 8,
  speed: PADDLE_SPEED
};


// ------------------------------------------------------------
// THE BRICKS (the list is filled in by makeBricks() in bricks.js)
// ------------------------------------------------------------
let bricks = [];
let particles = [];
let blocksBroken = 0;
let lives = 3;
let deathScreen = false;
let fallingHearts = [];
let fallingPowerups = [];
let fallingSpikes = [];
let level = 1;
let levelTransition = false;
let levelTransitionFrame = 0;
let levelComplete = false;
let paddleSlowFrames = 0;


// ------------------------------------------------------------
// KEYBOARD
// keys["arrowleft"] is true while the left arrow is held down.
// ------------------------------------------------------------
const keys = {};

document.addEventListener("keydown", function (event) {
  keys[event.key.toLowerCase()] = true;
  if (event.code === "Enter" && deathScreen) {
    event.preventDefault();
    if (lives === 0) {
      resetGame();
    }
    deathScreen = false;
  }
  if (event.code === "Enter" && levelComplete) {
    event.preventDefault();
    resetGame();
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (!ballLaunched && !deathScreen && !levelTransition && !levelComplete) {
      ballLaunched = true;
      for (const ball of balls) {
        ball.vx = 0;
        ball.vy = -BALL_SPEED;
      }
    }
  }
  // Stop the arrow keys from scrolling the page.
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
});

document.addEventListener("keyup", function (event) {
  keys[event.key.toLowerCase()] = false;
});


// ------------------------------------------------------------
// UPDATE: runs 60 times every second. Move things, then check
// what they touched.
// ------------------------------------------------------------
function update() {
  updateFallingHearts();

  if (deathScreen || levelComplete) {
    return;
  }
  if (levelTransition) {
    updateLevelTransition();
    return;
  }

  updatePaddleSlow();
  updateFallingPowerups();
  updateFallingSpikes();
  movePaddle();
  for (const ball of balls) {
    moveBall(ball);
    bounceOffWalls(ball);   // collisions.js
    bounceOffPaddle(ball);  // collisions.js
    bounceOffBricks(ball);  // collisions.js
  }

  // Losing the ball costs a life and pauses until the player continues.
  balls = balls.filter((ball) => ball.y <= HEIGHT);
  if (balls.length === 0) {
    const lostHeartIndex = lives - 1;
    if (lives > 0) {
      fallingHearts.push({
        x: WIDTH - 16 - 18 - lostHeartIndex * 26,
        y: HEIGHT - 55,
        vx: 1.2,
        vy: -2.5,
        rotation: 0,
        spin: 0.08,
        age: 0
      });
    }
    lives = Math.max(0, lives - 1);
    resetBall();
    deathScreen = true;
  }

  updateParticles();
  if (!deathScreen && bricks.length === 0) {
    if (level === 1) {
      beginLevelTwo();
    } else {
      lives += 1;
      levelComplete = true;
      resetBall();
    }
  }
}

function resetGame() {
  level = 1;
  bricks = makeBricks(level);
  particles = [];
  fallingHearts = [];
  fallingPowerups = [];
  fallingSpikes = [];
  blocksBroken = 0;
  lives = 3;
  deathScreen = false;
  levelTransition = false;
  levelComplete = false;
  paddleSlowFrames = 0;
  paddle.speed = PADDLE_SPEED;
  paddle.x = WIDTH / 2 - paddle.width / 2;
  resetBall();
}

function beginLevelTwo() {
  level = 2;
  bricks = makeBricks(level);
  for (const brick of bricks) {
    brick.targetY = brick.y;
    brick.y -= HEIGHT;
  }
  levelTransition = true;
  levelTransitionFrame = 0;
  fallingPowerups = [];
  fallingSpikes = [];
  resetBall();
}

function updateLevelTransition() {
  const dropFrames = 45;
  const riseFrames = 24;
  const overshoot = 36;
  levelTransitionFrame += 1;

  for (const brick of bricks) {
    if (levelTransitionFrame <= dropFrames) {
      const progress = levelTransitionFrame / dropFrames;
      brick.y = brick.targetY - HEIGHT + (HEIGHT + overshoot) * progress;
    } else {
      const progress = Math.min(1, (levelTransitionFrame - dropFrames) / riseFrames);
      brick.y = brick.targetY + overshoot * (1 - progress);
    }
  }

  if (levelTransitionFrame >= dropFrames + riseFrames) {
    levelTransition = false;
    for (const brick of bricks) {
      brick.y = brick.targetY;
    }
    resetBall();
  }
}

function updateParticles() {
  for (let index = particles.length - 1; index >= 0; index--) {
    const particle = particles[index];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.15;
    particle.life -= 1;

    if (particle.life <= 0) {
      particles.splice(index, 1);
    }
  }
}

function updateFallingHearts() {
  for (let index = fallingHearts.length - 1; index >= 0; index--) {
    const heart = fallingHearts[index];
    heart.x += heart.vx;
    heart.y += heart.vy;
    heart.vy += 0.18;
    heart.rotation += heart.spin;
    heart.age += 1;

    if (heart.y > HEIGHT || heart.age > 90) {
      fallingHearts.splice(index, 1);
    }
  }
}

function updatePaddleSlow() {
  if (paddleSlowFrames > 0) {
    paddleSlowFrames -= 1;
    if (paddleSlowFrames === 0) {
      paddle.speed = PADDLE_SPEED;
    }
  }
}

function updateFallingPowerups() {
  for (let index = fallingPowerups.length - 1; index >= 0; index--) {
    const powerup = fallingPowerups[index];
    powerup.y += powerup.vy;
    if (boxesTouch(powerup, paddle)) {
      const sourceBall = balls[0];
      const speed = Math.hypot(sourceBall.vx, sourceBall.vy) || BALL_SPEED;
      for (const direction of [-1, 1]) {
        const horizontalSpeed = speed * 0.55 * direction;
        balls.push({
          ...sourceBall,
          x: sourceBall.x + direction * 8,
          vx: horizontalSpeed,
          vy: -Math.sqrt(speed * speed - horizontalSpeed * horizontalSpeed)
        });
      }
      fallingPowerups.splice(index, 1);
    } else if (powerup.y > HEIGHT) {
      fallingPowerups.splice(index, 1);
    }
  }
}

function updateFallingSpikes() {
  for (let index = fallingSpikes.length - 1; index >= 0; index--) {
    const spike = fallingSpikes[index];
    spike.y += spike.vy;
    for (const brick of [...bricks]) {
      if (!spike.hitBricks.has(brick) && boxesTouch(spike, brick)) {
        spike.hitBricks.add(brick);
        damageBrick(brick);
      }
    }

    if (boxesTouch(spike, paddle)) {
      paddleSlowFrames = 10 * 60;
      paddle.speed = PADDLE_SPEED * 0.75;
      fallingSpikes.splice(index, 1);
    } else if (spike.y > HEIGHT) {
      fallingSpikes.splice(index, 1);
    }
  }
}

function onBrickDestroyed(brick) {
  blocksBroken += 1;
  if (brick.special === "multiball") {
    fallingPowerups.push({
      x: brick.x + brick.width / 2 - 10,
      y: brick.y + brick.height / 2 - 10,
      width: 20,
      height: 20,
      vy: 2.5
    });
  } else if (brick.special === "spike") {
    fallingSpikes.push({
      x: brick.x + brick.width / 2 - 7,
      y: brick.y + brick.height / 2,
      width: 14,
      height: 22,
      vy: 4,
      hitBricks: new Set()
    });
  }
}

function movePaddle() {
  if (keys["arrowleft"] || keys["a"]) {
    paddle.x = paddle.x - paddle.speed;
  }
  if (keys["arrowright"] || keys["d"]) {
    paddle.x = paddle.x + paddle.speed;
  }

  // Keep the paddle on the screen.
  if (paddle.x < 0) {
    paddle.x = 0;
  }
  if (paddle.x + paddle.width > WIDTH) {
    paddle.x = WIDTH - paddle.width;
  }
}

function moveBall(ball) {
  if (ballLaunched) {
    ball.vy = ball.vy + BALL_GRAVITY;
    ball.x = ball.x + ball.vx;
    ball.y = ball.y + ball.vy;
  } else {
    ball.x = paddle.x + paddle.width / 2 - ball.width / 2;
    ball.y = paddle.y - ball.height;
  }
}


// ------------------------------------------------------------
// DRAW: paints everything on the canvas. Black background,
// white shapes.
// ------------------------------------------------------------
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "white";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  for (const ball of balls) {
    ctx.beginPath();
    ctx.arc(ball.x + ball.width / 2, ball.y + ball.height / 2, ball.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBricks();  // bricks.js
  drawParticles();
  drawFallingPowerups();
  drawFallingSpikes();

  if (deathScreen) {
    drawDeathScreen();
  }
  if (levelComplete) {
    drawLevelComplete();
  }
  drawHud();
}

function drawHud() {
  ctx.fillStyle = "white";
  ctx.font = "18px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Blocks broken: ${blocksBroken}`, 16, 14);
  ctx.textAlign = "right";
  ctx.fillText(`Level: ${level}`, WIDTH - 16, 14);

  const heartWidth = 22;
  const heartHeight = 20;
  for (let index = 0; index < lives; index++) {
    const x = WIDTH - 16 - heartWidth - index * 28;
    drawHeart(x, HEIGHT - 55, heartWidth, heartHeight);
  }

  for (const heart of fallingHearts) {
    ctx.save();
    ctx.translate(heart.x + heartWidth / 2, heart.y + heartHeight / 2);
    ctx.rotate(heart.rotation);
    ctx.globalAlpha = Math.max(0, 1 - heart.age / 90);
    drawHeart(-heartWidth / 2, -heartHeight / 2, heartWidth, heartHeight);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawHeart(x, y, width, height) {
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y + height);
  ctx.bezierCurveTo(x + width * 0.32, y + height * 0.82, x, y + height * 0.56, x, y + height * 0.31);
  ctx.bezierCurveTo(x, y + height * 0.02, x + width * 0.38, y - height * 0.06, x + width / 2, y + height * 0.22);
  ctx.bezierCurveTo(x + width * 0.62, y - height * 0.06, x + width, y + height * 0.02, x + width, y + height * 0.31);
  ctx.bezierCurveTo(x + width, y + height * 0.56, x + width * 0.68, y + height * 0.82, x + width / 2, y + height);
  ctx.fill();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawFallingPowerups() {
  for (const powerup of fallingPowerups) {
    ctx.fillStyle = "#35d06f";
    ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
    ctx.fillStyle = "black";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", powerup.x + powerup.width / 2, powerup.y + powerup.height / 2);
  }
}

function drawFallingSpikes() {
  for (const spike of fallingSpikes) {
    ctx.fillStyle = "#ef4545";
    ctx.beginPath();
    ctx.moveTo(spike.x, spike.y);
    ctx.lineTo(spike.x + spike.width, spike.y);
    ctx.lineTo(spike.x + spike.width / 2, spike.y + spike.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawDeathScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 34px sans-serif";
  ctx.fillText("You died!", WIDTH / 2, HEIGHT / 2 - 42);
  ctx.font = "20px sans-serif";
  ctx.fillText(`Blocks broken: ${blocksBroken}`, WIDTH / 2, HEIGHT / 2 + 2);
  ctx.font = "16px sans-serif";
  ctx.fillText(lives > 0 ? "Press Enter to continue" : "Press Enter to restart", WIDTH / 2, HEIGHT / 2 + 42);
}

function drawLevelComplete() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 30px sans-serif";
  ctx.fillText("Level 2 complete!", WIDTH / 2, HEIGHT / 2 - 32);
  ctx.font = "18px sans-serif";
  ctx.fillText("Extra heart earned", WIDTH / 2, HEIGHT / 2 + 4);
  ctx.fillText("Press Enter to restart", WIDTH / 2, HEIGHT / 2 + 38);
}

function drawParticles() {
  for (const particle of particles) {
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.width, particle.height);
  }
  ctx.globalAlpha = 1;
}


// ------------------------------------------------------------
// THE GAME LOOP
// The browser calls frame() every time it is ready to draw.
// Some screens are faster than others, so we make sure update()
// always runs exactly 60 times per second on every computer.
// ------------------------------------------------------------
const STEP = 1000 / 60;
let lastTime = 0;
let leftover = 0;

function frame(now) {
  leftover = leftover + (now - lastTime);
  lastTime = now;

  // If the tab was hidden for a while, don't try to catch up.
  if (leftover > 250) {
    leftover = 250;
  }

  while (leftover >= STEP) {
    update();
    leftover = leftover - STEP;
  }

  draw();
  requestAnimationFrame(frame);
}

function start() {
  bricks = makeBricks(level);  // bricks.js
  resetBall();
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

// Wait until all three script files have loaded, then start.
window.addEventListener("load", start);
