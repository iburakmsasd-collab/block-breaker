// ============================================================
// BLOCK BREAKER (base game)
//
// game.js  = the canvas, the ball, the paddle, and the game loop
// bricks.js     = where the bricks are and how they are drawn
// collisions.js = what happens when the ball touches things
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const levelCodeForm = document.getElementById("level-code-form");
const levelCodeInput = document.getElementById("level-code");
const startMenu = document.getElementById("start-menu");
const startGameButton = document.getElementById("start-game");
const gameBoard = document.querySelector(".game-board");
const openShopButton = document.getElementById("open-shop");
const openSettingsButton = document.getElementById("open-settings");
const closeShopButton = document.getElementById("close-shop");
const closeSettingsButton = document.getElementById("close-settings");
const buySniperButton = document.getElementById("buy-sniper");
const buyMultiballButton = document.getElementById("buy-multiball");
const buyExplosiveButton = document.getElementById("buy-explosive");
const resetCreditsButton = document.getElementById("reset-credits");
const shopMenu = document.getElementById("shop-menu");
const settingsMenu = document.getElementById("settings-menu");
const shopStatus = document.getElementById("shop-status");
const purchaseFeedbackTimers = new WeakMap();
const creditBalance = document.getElementById("credit-balance");
const gameTitle = document.getElementById("game-title");
const menuCanvas = document.getElementById("menu-canvas");
const menuCtx = menuCanvas.getContext("2d");

const WIDTH = canvas.width;   // 600
const HEIGHT = canvas.height; // 450
const SNIPER_UPGRADE_COST = 500;
const MULTIBALL_UPGRADE_COST = 200;
const EXPLOSIVE_UPGRADE_COST = 600;
const SHOP_STORAGE_KEY = "block-breaker-shop";

const GameState = {
  lives: 3,
  blocksBroken: 0,
  credits: 0
};

let shopStorageError = false;
const savedShopProgress = loadShopProgress();
GameState.credits = savedShopProgress.credits;
let sniperUpgradeOwned = savedShopProgress.sniperUpgradeOwned;
let sniperUpgradeEquipped = savedShopProgress.sniperUpgradeEquipped;
let multiballUpgradeOwned = savedShopProgress.multiballUpgradeOwned;
let multiballUpgradeEquipped = savedShopProgress.multiballUpgradeEquipped;
let explosiveUpgradeOwned = savedShopProgress.explosiveUpgradeOwned;
let explosiveUpgradeEquipped = savedShopProgress.explosiveUpgradeEquipped;
updateShopDisplay();


// ------------------------------------------------------------
// THE BALL
// x and y are the top-left corner. vx and vy are how many pixels
// the ball moves each update (vx = sideways, vy = up/down).
// A positive vy means the ball is moving DOWN the screen.
// ------------------------------------------------------------
const BALL_SPEED = 6;
let BALL_GRAVITY = 0.01;
const PADDLE_SPEED = 8;
const PADDLE_SLOW_DURATION = 15000;

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

function launchBall() {
  if (ballLaunched || deathScreen || levelTransition || levelComplete) {
    return;
  }

  ballLaunched = true;
  for (const ball of balls) {
    ball.vx = 0;
    ball.vy = -BALL_SPEED;
  }
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
let explosions = [];
let deathScreen = false;
let fallingHearts = [];
let fallingPowerups = [];
let fallingSpikes = [];
let snipeBeams = [];
let snipeAmmo = 0;
let paddleHitTexts = [];
let gameStarted = false;
let level = 1;
let creditsEarnedThisLevel = 0;
let levelTransition = false;
let levelTransitionFrame = 0;
let levelComplete = false;
let paddleSlowed = false;
let paddleSlowUntil = 0;
let shopOpen = false;
let settingsOpen = false;
let equippedBrickOriginals = new Map();


// ------------------------------------------------------------
// KEYBOARD
// keys["arrowleft"] is true while the left arrow is held down.
// ------------------------------------------------------------
const keys = {};

document.addEventListener("keydown", function (event) {
  if ((shopOpen || settingsOpen) && event.key === "Escape") {
    event.preventDefault();
    exitMenu();
    return;
  }
  if (shopOpen || settingsOpen) {
    return;
  }
  if (levelCodeForm.contains(event.target)) {
    return;
  }
  if (!gameStarted) {
    if (event.key.startsWith("Arrow")) {
      event.preventDefault();
    }
    return;
  }
  keys[event.key.toLowerCase()] = true;
  if (event.code === "Enter" && deathScreen) {
    event.preventDefault();
    if (GameState.lives === 0) {
      resetGame();
    }
    deathScreen = false;
  }
  if (event.code === "Enter" && levelComplete) {
    event.preventDefault();
    nextRound();
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (!event.repeat) {
      if (ballLaunched) {
        fireSniper();
      } else {
        launchBall();
      }
    }
  }
  // Stop the arrow keys from scrolling the page.
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }
});

startGameButton.addEventListener("click", function () {
  startGameButton.disabled = true;
  gameBoard.classList.add("menu-dismissing");
  startMenu.classList.add("is-starting");
  gameTitle.classList.add("is-started");
});

openShopButton.addEventListener("click", openShop);
openSettingsButton.addEventListener("click", openSettings);
closeShopButton.addEventListener("click", closeShop);
closeSettingsButton.addEventListener("click", closeSettings);
buySniperButton.addEventListener("click", purchaseSniperUpgrade);
buyMultiballButton.addEventListener("click", purchaseMultiballUpgrade);
buyExplosiveButton.addEventListener("click", purchaseExplosiveUpgrade);
resetCreditsButton.addEventListener("click", resetCredits);

startMenu.addEventListener("animationend", function (event) {
  if (event.target !== startMenu) {
    return;
  }
  gameStarted = true;
  levelCodeInput.disabled = false;
  startMenu.remove();
  gameBoard.classList.remove("menu-dismissing");
});

document.addEventListener("keyup", function (event) {
  keys[event.key.toLowerCase()] = false;
});

levelCodeInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    levelCodeForm.requestSubmit();
  }
});

levelCodeForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (gameStarted && levelCodeInput.value === "47") {
    const amountText = window.prompt("Enter credit amount");
    if (amountText !== null && /^\d+$/.test(amountText.trim())) {
      const amount = Number(amountText);
      if (Number.isSafeInteger(amount) && amount > 0 && GameState.credits <= Number.MAX_SAFE_INTEGER - amount) {
        GameState.credits += amount;
        updateShopDisplay();
        persistShopProgress();
      }
    }
  } else if (gameStarted && levelCodeInput.value === "2442" && !deathScreen && !levelTransition && !levelComplete) {
    levelComplete = false;
    beginLevel(level + 1);
  }
  levelCodeInput.value = "";
});


// ------------------------------------------------------------
// UPDATE: runs 60 times every second. Move things, then check
// what they touched.
// ------------------------------------------------------------
function update() {
  if (shopOpen || settingsOpen) {
    return;
  }
  if (paddleSlowed && performance.now() >= paddleSlowUntil) {
    resetPaddleSlow();
  }
  updateFallingHearts();
  updateParticles();
  updateExplosions();
  updatePaddleHitTexts();

  if (!gameStarted || deathScreen || levelComplete) {
    return;
  }
  if (levelTransition) {
    updateLevelTransition();
    return;
  }

  updateFallingPowerups();
  updateFallingSpikes();
  updateSnipeBeams();
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
    const lostHeartIndex = GameState.lives - 1;
    if (GameState.lives > 0) {
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
    GameState.lives = Math.max(0, GameState.lives - 1);
    resetBall();
    deathScreen = true;
  }

  if (!deathScreen && bricks.length === 0) {
    if (level === 2) {
      GameState.lives += 1;
    }
    creditsEarnedThisLevel = awardRoundCredits();
    resetPaddleSlow();
    levelComplete = true;
    resetBall();
  }
}

function resetGame() {
  level = 1;
  bricks = makeBricksForRound(level);
  particles = [];
  explosions = [];
  fallingHearts = [];
  fallingPowerups = [];
  fallingSpikes = [];
  GameState.blocksBroken = 0;
  GameState.lives = 3;
  creditsEarnedThisLevel = 0;
  snipeBeams = [];
  snipeAmmo = 0;
  paddleHitTexts = [];
  deathScreen = false;
  levelTransition = false;
  levelComplete = false;
  resetPaddleSlow();
  paddle.x = WIDTH / 2 - paddle.width / 2;
  resetBall();
}

function beginLevel(nextLevel) {
  level = nextLevel;
  snipeAmmo = 0;
  resetPaddleSlow();
  bricks = makeBricksForRound(level);
  explosions = [];
  for (const brick of bricks) {
    brick.targetY = brick.y;
    brick.y -= HEIGHT;
  }
  levelTransition = true;
  levelTransitionFrame = 0;
  fallingPowerups = [];
  fallingSpikes = [];
  snipeBeams = [];
  resetBall();
}

function nextRound() {
  levelComplete = false;
  beginLevel(level + 1);
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

function resetPaddleSlow() {
  paddleSlowed = false;
  paddle.speed = PADDLE_SPEED;
  paddleSlowUntil = 0;
}

function updatePaddleHitTexts() {
  for (let index = paddleHitTexts.length - 1; index >= 0; index--) {
    const text = paddleHitTexts[index];
    text.y -= 0.8;
    text.life -= 1;
    if (text.life <= 0) {
      paddleHitTexts.splice(index, 1);
    }
  }
}

function updateFallingPowerups() {
  for (let index = fallingPowerups.length - 1; index >= 0; index--) {
    const powerup = fallingPowerups[index];
    powerup.y += powerup.vy;
    if (boxesTouch(powerup, paddle)) {
      if (powerup.type === "multiball") {
        const sourceBall = balls[0];
        const speed = Math.hypot(sourceBall.vx, sourceBall.vy) || BALL_SPEED;
        for (const direction of [-1, 1]) {
          const horizontalSpeed = speed * 0.55 * direction;
          balls.push({
            x: paddle.x + paddle.width / 2 - sourceBall.width / 2 + direction * 8,
            y: paddle.y - sourceBall.height,
            width: sourceBall.width,
            height: sourceBall.height,
            vx: horizontalSpeed,
            vy: -Math.sqrt(speed * speed - horizontalSpeed * horizontalSpeed)
          });
        }
      } else if (powerup.type === "snipe") {
        snipeAmmo += 1;
      }
      fallingPowerups.splice(index, 1);
    } else if (powerup.y > HEIGHT) {
      fallingPowerups.splice(index, 1);
    }
  }
}

function fireSniper() {
  if (snipeAmmo <= 0 || deathScreen || levelTransition || levelComplete) {
    return;
  }
  snipeAmmo -= 1;
  const x = paddle.x + paddle.width / 2;
  const beamHalfWidth = 6;
  snipeBeams.push({ x, frames: 8 });
  for (const brick of [...bricks]) {
    if (x + beamHalfWidth >= brick.x && x - beamHalfWidth <= brick.x + brick.width) {
      destroyBrick(brick);
    }
  }
}

function updateSnipeBeams() {
  for (const beam of snipeBeams) {
    beam.frames -= 1;
  }
  snipeBeams = snipeBeams.filter((beam) => beam.frames > 0);
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
      paddleSlowed = true;
      paddle.speed = PADDLE_SPEED * 0.75;
      paddleSlowUntil = performance.now() + PADDLE_SLOW_DURATION;
      paddleHitTexts.push({
        x: paddle.x + paddle.width / 2,
        y: paddle.y - 6,
        life: 60,
        maxLife: 60
      });
      fallingSpikes.splice(index, 1);
    } else if (spike.y > HEIGHT) {
      fallingSpikes.splice(index, 1);
    }
  }
}

function onBrickDestroyed(brick, suppressExplosion = false) {
  GameState.blocksBroken += 1;
  if (brick.special === "multiball") {
    fallingPowerups.push({
      type: brick.special,
      x: brick.x + brick.width / 2 - 10,
      y: brick.y + brick.height / 2 - 10,
      width: 20,
      height: 20,
      vy: 2.5
    });
  } else if (brick.special === "snipe") {
    fallingPowerups.push({
      type: brick.special,
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

  if (brick.special === "explosive" && !suppressExplosion) {
    explodeBricksAround(brick);
  }
}

function explodeBricksAround(sourceBrick) {
  const targetCount = Math.random() < 0.1 ? 8 : Math.floor(Math.random() * 3) + 4;
  const centerX = sourceBrick.x + sourceBrick.width / 2;
  const centerY = sourceBrick.y + sourceBrick.height / 2;
  const nearbyBricks = bricks
    .filter((brick) => brick !== sourceBrick)
    .map((brick) => ({
      brick,
      distance: Math.hypot(
        brick.x + brick.width / 2 - centerX,
        brick.y + brick.height / 2 - centerY
      )
    }))
    .sort((first, second) => {
      return first.distance - second.distance;
    })
    .slice(0, targetCount);

  const maxRadius = nearbyBricks.length > 0
    ? nearbyBricks[nearbyBricks.length - 1].distance
    : 24;
  for (const target of nearbyBricks) {
    destroyBrick(target.brick, false, true);
  }

  explosions.push({
    x: centerX,
    y: centerY,
    age: 0,
    duration: 30,
    radius: 0,
    maxRadius,
    targets: nearbyBricks
  });
}

function updateExplosions() {
  for (let index = explosions.length - 1; index >= 0; index--) {
    const explosion = explosions[index];
    explosion.age += 1;
    const progress = Math.min(1, explosion.age / explosion.duration);
    explosion.radius = explosion.maxRadius * progress;

    if (explosion.age >= explosion.duration) {
      explosions.splice(index, 1);
    }
  }
}

function movePaddleLeft() {
  paddle.x = paddle.x - paddle.speed;
}

function movePaddle() {
  if (keys["arrowleft"] || keys["a"]) {
    movePaddleLeft();
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

  ctx.fillStyle = paddleSlowed ? "#ef4545" : "white";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  for (const ball of balls) {
    ctx.beginPath();
    ctx.arc(ball.x + ball.width / 2, ball.y + ball.height / 2, ball.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBricks();  // bricks.js
  drawExplosions();
  drawSnipeBeams();
  drawParticles();
  drawFallingPowerups();
  drawFallingSpikes();
  drawPaddleHitTexts();

  if (deathScreen) {
    drawDeathScreen();
  }
  if (levelComplete) {
    drawLevelComplete();
  }
  drawHud();
}

function drawExplosions() {
  for (const explosion of explosions) {
    const progress = Math.min(1, explosion.age / explosion.duration);
    const radius = Math.max(5, explosion.radius);
    ctx.save();
    ctx.globalAlpha = 1 - progress;

    const glow = ctx.createRadialGradient(explosion.x, explosion.y, 0, explosion.x, explosion.y, radius);
    glow.addColorStop(0, "rgba(255, 255, 220, 0.95)");
    glow.addColorStop(0.28, "rgba(255, 173, 51, 0.75)");
    glow.addColorStop(1, "rgba(239, 69, 69, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 3 * (1 - progress) + 1;
    ctx.strokeStyle = "#fff0a0";
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ef4545";
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, radius * 0.68, 0, Math.PI * 2);
    ctx.stroke();

    for (const target of explosion.targets) {
      const burstStart = Math.max(1, Math.round(target.distance / explosion.maxRadius * explosion.duration));
      const burstAge = explosion.age - burstStart;
      if (burstAge < 0 || burstAge > 8) {
        continue;
      }

      const burstProgress = burstAge / 9;
      const targetX = target.brick.x + target.brick.width / 2;
      const targetY = target.brick.y + target.brick.height / 2;
      ctx.globalAlpha = 1 - burstProgress;
      ctx.fillStyle = "#fff0a0";
      ctx.beginPath();
      ctx.arc(targetX, targetY, 3 + burstAge * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffad33";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(targetX, targetY, 5 + burstAge * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawHud() {
  ctx.fillStyle = "white";
  ctx.font = "18px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Blocks broken: ${GameState.blocksBroken}`, 16, 14);
  if (snipeAmmo > 0) {
    ctx.textAlign = "center";
    ctx.font = "14px sans-serif";
    ctx.fillText(`SNIPE AMMO ${snipeAmmo} | X TO FIRE`, WIDTH / 2, 14);
    ctx.font = "18px sans-serif";
  }
  ctx.textAlign = "right";
  ctx.fillText(`Level: ${level}`, WIDTH - 16, 14);

  const heartWidth = 22;
  const heartHeight = 20;
  for (let index = 0; index < GameState.lives; index++) {
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
  ctx.strokeStyle = "grey";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawFallingPowerups() {
  for (const powerup of fallingPowerups) {
    const centerX = powerup.x + powerup.width / 2;
    const centerY = powerup.y + powerup.height / 2;
    if (powerup.type === "multiball") {
      ctx.fillStyle = "#35d06f";
      ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
      ctx.fillStyle = "black";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", centerX, centerY);
    } else {
      ctx.fillStyle = "#46b5dc";
      ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
      ctx.fillStyle = "white";
      ctx.fillRect(centerX - 2, centerY - 5, 4, 11);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 9);
      ctx.lineTo(centerX + 5, centerY - 3);
      ctx.lineTo(centerX - 5, centerY - 3);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawSnipeBeams() {
  ctx.save();
  ctx.strokeStyle = "#8beaff";
  ctx.lineWidth = 12;
  for (const beam of snipeBeams) {
    ctx.beginPath();
    ctx.moveTo(beam.x, 0);
    ctx.lineTo(beam.x, paddle.y);
    ctx.stroke();
  }
  ctx.restore();
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

function drawPaddleHitTexts() {
  ctx.save();
  ctx.fillStyle = "#ef4545";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  for (const text of paddleHitTexts) {
    ctx.globalAlpha = text.life / text.maxLife;
    ctx.fillText("-25% speed", text.x, text.y);
  }
  ctx.restore();
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
  ctx.fillText(`Blocks broken: ${GameState.blocksBroken}`, WIDTH / 2, HEIGHT / 2 + 2);
  ctx.font = "16px sans-serif";
  ctx.fillText(GameState.lives > 0 ? "Press Enter to continue" : "Press Enter to restart", WIDTH / 2, HEIGHT / 2 + 42);
}

function drawLevelComplete() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 30px sans-serif";
  ctx.fillText(`Level ${level} complete!`, WIDTH / 2, HEIGHT / 2 - 58);
  ctx.font = "18px sans-serif";
  ctx.fillText(`Credits earned: +${creditsEarnedThisLevel}`, WIDTH / 2, HEIGHT / 2 - 18);
  if (level === 2) {
    ctx.fillText("Extra heart earned", WIDTH / 2, HEIGHT / 2 + 12);
  }
  ctx.font = "16px sans-serif";
  ctx.fillText("Press Enter to continue", WIDTH / 2, HEIGHT / 2 + 48);
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
  if (!gameStarted) {
    drawMenuCanvas();
  }
  requestAnimationFrame(frame);
}

function start() {
  bricks = makeBricksForRound(level);  // bricks.js
  resetBall();
  lastTime = performance.now();
  requestAnimationFrame(frame);
}

function loadShopProgress() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SHOP_STORAGE_KEY) || "{}");
    const sniperOwned = saved.sniperUpgradeOwned === true;
    const multiballOwned = saved.multiballUpgradeOwned === true;
    return {
      credits: Number.isSafeInteger(saved.credits) && saved.credits >= 0 ? saved.credits : 0,
      sniperUpgradeOwned: sniperOwned,
      sniperUpgradeEquipped: sniperOwned && (
        typeof saved.sniperUpgradeEquipped === "boolean"
          ? saved.sniperUpgradeEquipped
          : sniperOwned
      ),
      multiballUpgradeOwned: multiballOwned,
      multiballUpgradeEquipped: multiballOwned && saved.multiballUpgradeEquipped === true,
      explosiveUpgradeOwned: saved.explosiveUpgradeOwned === true,
      explosiveUpgradeEquipped: saved.explosiveUpgradeOwned === true && saved.explosiveUpgradeEquipped === true
    };
  } catch (error) {
    console.error("Could not load saved shop progress.", error);
    shopStorageError = true;
    shopStatus.textContent = "Saved shop progress could not be loaded.";
    return {
      credits: 0,
      sniperUpgradeOwned: false,
      sniperUpgradeEquipped: false,
      multiballUpgradeOwned: false,
      multiballUpgradeEquipped: false,
      explosiveUpgradeOwned: false,
      explosiveUpgradeEquipped: false
    };
  }
}

function persistShopProgress() {
  try {
    window.localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify({
      credits: GameState.credits,
      sniperUpgradeOwned,
      sniperUpgradeEquipped,
      multiballUpgradeOwned,
      multiballUpgradeEquipped,
      explosiveUpgradeOwned,
      explosiveUpgradeEquipped
    }));
    shopStorageError = false;
    return true;
  } catch (error) {
    console.error("Could not save shop progress.", error);
    shopStorageError = true;
    shopStatus.textContent = "Could not save shop progress; it will be lost when you leave.";
    return false;
  }
}

function updateShopDisplay() {
  const balanceText = `Credits: ${GameState.credits}`;
  creditBalance.textContent = balanceText;
  buySniperButton.setAttribute("aria-pressed", String(sniperUpgradeOwned && sniperUpgradeEquipped));
  buySniperButton.textContent = sniperUpgradeOwned
    ? (sniperUpgradeEquipped ? "Equipped" : "Equip")
    : `Buy for ${SNIPER_UPGRADE_COST}`;
  buySniperButton.dataset.defaultLabel = buySniperButton.textContent;
  buyMultiballButton.setAttribute("aria-pressed", String(multiballUpgradeOwned && multiballUpgradeEquipped));
  buyMultiballButton.textContent = multiballUpgradeOwned
    ? (multiballUpgradeEquipped ? "Equipped" : "Equip")
    : `Buy for ${MULTIBALL_UPGRADE_COST}`;
  buyMultiballButton.dataset.defaultLabel = buyMultiballButton.textContent;
  buyExplosiveButton.setAttribute("aria-pressed", String(explosiveUpgradeOwned && explosiveUpgradeEquipped));
  buyExplosiveButton.textContent = explosiveUpgradeOwned
    ? (explosiveUpgradeEquipped ? "Equipped" : "Equip")
    : `Buy for ${EXPLOSIVE_UPGRADE_COST}`;
  buyExplosiveButton.dataset.defaultLabel = buyExplosiveButton.textContent;
}

function makeBricksForRound(roundLevel) {
  const roundBricks = makeBricks(roundLevel);
  equippedBrickOriginals = new Map();
  if (sniperUpgradeEquipped) {
    addEquippedBricks(roundBricks, "snipe");
  }
  if (multiballUpgradeEquipped) {
    const multiballBrickCount = Math.floor(Math.random() * 4) + 1;
    addEquippedBricks(roundBricks, "multiball", multiballBrickCount);
  }
  if (explosiveUpgradeEquipped) {
    const explosiveBrickCount = Math.floor(Math.random() * 2) + 1;
    addEquippedBricks(roundBricks, "explosive", explosiveBrickCount);
  }
  return roundBricks;
}

function addEquippedBricks(roundBricks, special, count = 1) {
  const style = POWERUP_STYLES[special];
  const availableBricks = roundBricks.filter((brick) => !brick.special);
  const originals = equippedBrickOriginals.get(special) || [];
  const addCount = Math.min(count, availableBricks.length);

  for (let index = 0; index < addCount; index++) {
    const availableIndex = Math.floor(Math.random() * availableBricks.length);
    const [brick] = availableBricks.splice(availableIndex, 1);
    originals.push({
      brick,
      color: brick.color,
      darkerColor: brick.darkerColor,
      hitstillbroken: brick.hitstillbroken
    });
    brick.special = special;
    brick.color = style.color;
    brick.darkerColor = style.darkerColor;
    brick.hitstillbroken = 1;
  }

  equippedBrickOriginals.set(special, originals);
  return addCount;
}

function removeEquippedBrick(special) {
  const originals = equippedBrickOriginals.get(special);
  if (!originals) {
    return;
  }

  for (const { brick, color, darkerColor, hitstillbroken } of originals) {
    brick.special = null;
    brick.color = color;
    brick.darkerColor = darkerColor;
    brick.hitstillbroken = hitstillbroken;
  }
  equippedBrickOriginals.delete(special);
}

function awardRoundCredits() {
  const creditsByLives = [0, 30, 60, 100];
  const earned = creditsByLives[Math.min(GameState.lives, 3)] + Math.max(0, GameState.lives - 3) * 30;
  GameState.credits += earned;
  updateShopDisplay();
  persistShopProgress();
  return earned;
}

function openShop() {
  shopOpen = true;
  shopMenu.hidden = false;
  if (shopStorageError) {
    shopStatus.textContent = "Shop progress could not be saved; changes may be lost when you leave.";
  } else {
    shopStatus.textContent = "";
  }
  closeShopButton.focus();
}

function openSettings() {
  settingsOpen = true;
  settingsMenu.hidden = false;
  closeSettingsButton.focus();
}

function resetCredits() {
  if (!window.confirm("Are you sure? This will reset your credits.")) {
    return;
  }

  GameState.credits = 0;
  updateShopDisplay();
  persistShopProgress();
}

function closeShop() {
  shopOpen = false;
  shopMenu.hidden = true;
  if (gameStarted) {
    canvas.focus();
  } else {
    openShopButton.focus();
  }
}

function closeSettings() {
  settingsOpen = false;
  settingsMenu.hidden = true;
  if (gameStarted) {
    canvas.focus();
  } else {
    openSettingsButton.focus();
  }
}

function exitMenu() {
  if (shopOpen) {
    closeShop();
  } else if (settingsOpen) {
    closeSettings();
  }
}

function purchaseSniperUpgrade() {
  purchaseOrToggleShopItem({
    owned: sniperUpgradeOwned,
    equipped: sniperUpgradeEquipped,
    cost: SNIPER_UPGRADE_COST,
    special: "snipe",
    button: buySniperButton,
    onPurchase: () => {
      sniperUpgradeOwned = true;
    },
    onEquip: (equipped) => {
      sniperUpgradeEquipped = equipped;
    }
  });
}

function purchaseMultiballUpgrade() {
  purchaseOrToggleShopItem({
    owned: multiballUpgradeOwned,
    equipped: multiballUpgradeEquipped,
    cost: MULTIBALL_UPGRADE_COST,
    special: "multiball",
    button: buyMultiballButton,
    onPurchase: () => {
      multiballUpgradeOwned = true;
    },
    onEquip: (equipped) => {
      multiballUpgradeEquipped = equipped;
    }
  });
}

function purchaseExplosiveUpgrade() {
  purchaseOrToggleShopItem({
    owned: explosiveUpgradeOwned,
    equipped: explosiveUpgradeEquipped,
    cost: EXPLOSIVE_UPGRADE_COST,
    special: "explosive",
    button: buyExplosiveButton,
    onPurchase: () => {
      explosiveUpgradeOwned = true;
    },
    onEquip: (equipped) => {
      explosiveUpgradeEquipped = equipped;
    }
  });
}

function purchaseOrToggleShopItem(item) {
  if (!item.owned) {
    if (GameState.credits < item.cost) {
      showInsufficientFunds(item.button);
      return;
    }

    GameState.credits -= item.cost;
    item.onPurchase();
  } else {
    const equipped = !item.equipped;
    item.onEquip(equipped);
    if (equipped) {
      const count = item.special === "multiball"
        ? Math.floor(Math.random() * 4) + 1
        : 1;
      addEquippedBricks(bricks, item.special, count);
    } else {
      removeEquippedBrick(item.special);
    }
  }

  updateShopDisplay();
  shopStatus.textContent = persistShopProgress()
    ? ""
    : "Shop progress could not be saved; changes may be lost when you leave.";
}

function showInsufficientFunds(button) {
  const previousTimer = purchaseFeedbackTimers.get(button);
  if (previousTimer !== undefined) {
    window.clearTimeout(previousTimer);
  }

  button.textContent = "Not enough money";
  button.classList.remove("insufficient-funds");
  void button.offsetWidth;
  button.classList.add("insufficient-funds");

  const timer = window.setTimeout(() => {
    button.textContent = button.dataset.defaultLabel;
    button.classList.remove("insufficient-funds");
    purchaseFeedbackTimers.delete(button);
  }, 1200);
  purchaseFeedbackTimers.set(button, timer);
}

function drawMenuCanvas() {
  menuCtx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
  menuCtx.fillStyle = "black";
  menuCtx.fillRect(48, 58.5, 504, 333);
  menuCtx.strokeStyle = "white";
  menuCtx.lineWidth = 2;
  menuCtx.strokeRect(48, 58.5, 504, 333);
}

// Wait until all three script files have loaded, then start.
window.addEventListener("load", start);
