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
const BALL_SPEED = 4;
let BALL_GRAVITY = 0.01;

const ball = {
  x: 0,
  y: 0,
  width: 15,
  height: 15,
  vx: 0,
  vy: 0
};

let ballLaunched = false;

// Put the ball above the paddle and wait for the player to launch it.
function resetBall() {
  ball.x = paddle.x + paddle.width / 2 - ball.width / 2;
  ball.y = paddle.y - ball.height;
  ball.vx = 0;
  ball.vy = 0;
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
  speed: 6
};


// ------------------------------------------------------------
// THE BRICKS (the list is filled in by makeBricks() in bricks.js)
// ------------------------------------------------------------
let bricks = [];
let particles = [];
let blocksBroken = 0;
let lives = 3;
let deathScreen = false;


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
      bricks = makeBricks();
      particles = [];
      blocksBroken = 0;
      lives = 3;
      paddle.x = WIDTH / 2 - paddle.width / 2;
      resetBall();
    }
    deathScreen = false;
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (!ballLaunched && !deathScreen) {
      ballLaunched = true;
      ball.vx = 0;
      ball.vy = -BALL_SPEED;
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
  if (deathScreen) {
    return;
  }

  movePaddle();
  moveBall();

  bounceOffWalls();   // collisions.js
  bounceOffPaddle();  // collisions.js
  bounceOffBricks();  // collisions.js

  // Losing the ball costs a life and pauses until the player continues.
  if (ball.y > HEIGHT) {
    lives = Math.max(0, lives - 1);
    resetBall();
    deathScreen = true;
  }

  updateParticles();
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

function moveBall() {
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
  ctx.beginPath();
  ctx.arc(ball.x + ball.width / 2, ball.y + ball.height / 2, ball.width / 2, 0, Math.PI * 2);
  ctx.fill();

  drawBricks();  // bricks.js
  drawParticles();

  if (deathScreen) {
    drawDeathScreen();
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
  ctx.textBaseline = "bottom";
  ctx.fillText(`Lives: ${lives}`, WIDTH - 16, HEIGHT - 14);
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
  bricks = makeBricks();  // bricks.js
  resetBall();
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

// Wait until all three script files have loaded, then start.
window.addEventListener("load", start);
