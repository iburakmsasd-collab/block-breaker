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
const resetCreditsButton = document.getElementById("reset-credits");
const openChestButton = document.getElementById("open-chest");
const shopMenu = document.getElementById("shop-menu");
const settingsMenu = document.getElementById("settings-menu");
const shopList = document.getElementById("shop-list");
const chestReveal = document.getElementById("chest-reveal");
const chestRevealCanvas = document.getElementById("chest-reveal-canvas");
const creditBalance = document.getElementById("credit-balance");
const gameTitle = document.getElementById("game-title");
const menuCanvas = document.getElementById("menu-canvas");
const menuCtx = menuCanvas.getContext("2d");

const WIDTH = canvas.width;   // 600
const HEIGHT = canvas.height; // 450
const PADDLE_TRAIL_LENGTH = 10;
const PADDLE_TRAIL_LIFE = 12;
const CHEST_COST = 250;
const SHOP_STORAGE_KEY = "block-breaker-shop";
const ITEM_ORDER = ["heart", "multiball", "snipe", "explosive", "pentaball"];
const ITEM_DEFS = Object.freeze({
  pentaball: {
    name: "Pentaball Brick",
    previewClass: "pentaball-brick-preview",
    previewText: "PENTA",
    description: "Launches 10 extra balls from the paddle.",
    rarity: 1,
    dropChance: 1,
    sellPrice: 1200
  },
  explosive: {
    name: "Explosive Brick",
    previewClass: "explosive-brick-preview",
    previewText: "",
    description: "Explodes when broken, destroying 4-6 nearby bricks.",
    rarity: 2,
    dropChance: 5,
    sellPrice: 600
  },
  snipe: {
    name: "Sniper Brick",
    previewClass: "sniper-brick-preview",
    previewText: "SNIPE",
    description: "Collect it for 1 sniper shot. Press X to break a column of blocks.",
    rarity: 3,
    dropChance: 19,
    sellPrice: 500
  },
  multiball: {
    name: "Multiball Brick",
    previewClass: "multiball-brick-preview",
    previewText: "●",
    description: "Shoots 2 extra balls from the paddle.",
    rarity: 4,
    dropChance: 30,
    sellPrice: 200
  },
  heart: {
    name: "Heal Brick",
    previewClass: "heart-brick-preview",
    previewText: "",
    description: "Adds 1 extra life when collected.",
    rarity: 5,
    dropChance: 45,
    sellPrice: 100
  }
});
const CHEST_DROP_WEIGHTS = Object.freeze({
  pentaball: 1,
  explosive: 5,
  snipe: 19,
  multiball: 30,
  heart: 45
});

function rollChestItem() {
  const totalWeight = Object.values(CHEST_DROP_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
  const roll = Math.random() * totalWeight;
  let runningTotal = 0;

  for (const itemKey of ITEM_ORDER) {
    runningTotal += CHEST_DROP_WEIGHTS[itemKey];
    if (roll < runningTotal) {
      return itemKey;
    }
  }

  return ITEM_ORDER[ITEM_ORDER.length - 1];
}

const GameState = {
  lives: 3,
  blocksBroken: 0,
  credits: 0
};

function createDefaultItemInventory() {
  return Object.fromEntries(ITEM_ORDER.map((itemKey) => [itemKey, { count: 0, equipped: false }]));
}

let itemInventory = createDefaultItemInventory();
let shopStorageError = false;
const savedShopProgress = loadShopProgress();
GameState.credits = savedShopProgress.credits;
itemInventory = savedShopProgress.itemInventory;
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
const PADDLE_BOOST_MULTIPLIER = 2;
const PADDLE_BOOST_DURATION = 100;
const PADDLE_BOOST_COOLDOWN = 7000;
const BALL_SQUISH_FRAMES = 18;
const BALL_TRAIL_LENGTH = 10;

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
    vy: 0,
    squish: 0
  }];
  ballLaunched = false;
  updateBallTrail(balls[0]);
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
let paddleTrail = [];


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
let comboTexts = [];
let comboRewards = [];
let brickCombo = 0;
let lastComboDisplayValue = 0;
let shakeFrames = 0;
let shakeStrength = 0;
let gameStarted = false;
let level = 1;
let creditsEarnedThisLevel = 0;
let levelTransition = false;
let levelTransitionFrame = 0;
let levelComplete = false;
let paddleSlowed = false;
let paddleSlowUntil = 0;
let paddleBoostUntil = 0;
let paddleBoostCooldownUntil = 0;
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
  if ((event.code === "ShiftLeft" || event.code === "ShiftRight") && !event.repeat) {
    activatePaddleBoost();
  }
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
openChestButton.addEventListener("click", openChest);
resetCreditsButton.addEventListener("click", resetCredits);

startMenu.addEventListener("animationend", function (event) {
  if (event.target !== startMenu) {
    return;
  }
  gameStarted = true;
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
  if (levelCodeInput.value === "47") {
    const amountText = window.prompt("Enter credit amount");
    if (amountText !== null && /^\d+$/.test(amountText.trim())) {
      const amount = Number(amountText);
      if (Number.isSafeInteger(amount) && amount > 0 && GameState.credits <= Number.MAX_SAFE_INTEGER - amount) {
        GameState.credits += amount;
        updateShopDisplay();
        persistShopProgress();
      }
    }
  } else if (levelCodeInput.value === "2442" && !deathScreen && !levelTransition && !levelComplete) {
    levelComplete = false;
    beginLevel(level + 1);
  }
  levelCodeInput.value = "";
});


// ------------------------------------------------------------
// UPDATE: runs 60 times every second. Move things, then check
// what they touched.
// ------------------------------------------------------------
function triggerShake(strength) {
  shakeStrength = Math.max(shakeStrength, strength);
  shakeFrames = 16;
}

function update() {
  if (shopOpen || settingsOpen) {
    return;
  }
  if (paddleSlowed && performance.now() >= paddleSlowUntil) {
    resetPaddleSlow();
  }
  updateFallingHearts();
  updateParticles();
  updateBrickEffects();
  updateExplosions();
  updatePaddleHitTexts();
  updateComboTexts();
  updateComboRewards();
  updatePaddleTrail();
  if (shakeFrames > 0) {
    shakeFrames -= 1;
    if (shakeFrames === 0) {
      shakeStrength = 0;
    }
  }

  if (!gameStarted) {
    return;
  }
  if (deathScreen || levelComplete) {
    updateBackgroundHazards();
    return;
  }
  if (levelTransition) {
    updateLevelTransition();
    return;
  }

  updateFallingPowerups();
  updateFallingSpikes();
  updateSnipeBeams();
  for (const brick of bricks) {
    brick.move(brick);
  }
  movePaddle();
  for (const ball of balls) {
    ball.squish = Math.max(0, ball.squish - 1);
    moveBall(ball);
    bounceOffWalls(ball);   // collisions.js
    bounceOffPaddle(ball);  // collisions.js
    bounceOffBricks(ball);  // collisions.js
    updateBallTrail(ball);
  }

  // Losing the ball costs a life and pauses until the player continues.
  if (balls.some((ball) => ball.y > HEIGHT)) {
    brickCombo = 0;
    lastComboDisplayValue = 0;
    shakeFrames = 0;
    shakeStrength = 0;
  }
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
    creditsEarnedThisLevel = awardRoundCredits();
    resetPaddleSlow();
    levelComplete = true;
    resetBall();
  }
}

function updateBackgroundHazards() {
  for (let index = fallingPowerups.length - 1; index >= 0; index--) {
    const powerup = fallingPowerups[index];
    powerup.y += powerup.vy;
    if (powerup.y > HEIGHT) {
      fallingPowerups.splice(index, 1);
    }
  }
  for (let index = fallingSpikes.length - 1; index >= 0; index--) {
    const spike = fallingSpikes[index];
    spike.y += spike.vy;
    if (spike.y > HEIGHT) {
      fallingSpikes.splice(index, 1);
    }
  }
  updateSnipeBeams();
}

function updateBackgroundMotion() {
  for (const ball of balls) {
    if (ball.vx === 0 && ball.vy === 0) {
      ball.vx = (Math.random() < 0.5 ? -1 : 1) * BALL_SPEED * 0.55;
      ball.vy = -BALL_SPEED * 0.8;
    }

    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vy += BALL_GRAVITY;
    ball.squish = Math.max(0, ball.squish - 1);
    bounceOffWalls(ball);
    bounceOffBricks(ball, false);
    if (ball.y + ball.height > HEIGHT) {
      ball.y = HEIGHT - ball.height;
      ball.vy = -Math.abs(ball.vy);
    }
    updateBallTrail(ball, true);
  }
}

function activatePaddleBoost() {
  const now = performance.now();
  if (
    !gameStarted ||
    deathScreen ||
    levelTransition ||
    levelComplete ||
    now < paddleBoostCooldownUntil
  ) {
    return;
  }
  paddleBoostUntil = now + PADDLE_BOOST_DURATION;
  paddleBoostCooldownUntil = now + PADDLE_BOOST_COOLDOWN;
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
  paddleTrail = [];
  paddleHitTexts = [];
  comboTexts = [];
  brickCombo = 0;
  lastComboDisplayValue = 0;
  shakeFrames = 0;
  shakeStrength = 0;
  deathScreen = false;
  levelTransition = false;
  levelComplete = false;
  paddleBoostUntil = 0;
  paddleBoostCooldownUntil = 0;
  resetPaddleSlow();
  paddle.x = WIDTH / 2 - paddle.width / 2;
  resetBall();
}

function beginLevel(nextLevel) {
  level = nextLevel;
  brickCombo = 0;
  lastComboDisplayValue = 0;
  snipeAmmo = 0;
  resetPaddleSlow();
  bricks = makeBricksForRound(level);
  explosions = [];
  for (const brick of bricks) {
    brick.targetY = brick.y;
    brick.y = brick.targetY - BRICKS_TOP - BRICK_HEIGHT;
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
  const dropFrames = 20;
  const riseFrames = 8;
  const overshoot = 12;
  levelTransitionFrame += 1;

  for (const brick of bricks) {
    if (levelTransitionFrame <= dropFrames) {
      const progress = levelTransitionFrame / dropFrames;
      const startY = brick.targetY - BRICKS_TOP - BRICK_HEIGHT;
      brick.y = startY + (brick.targetY + overshoot - startY) * progress;
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
    particle.x += particle.vx * 0.8;
    particle.y += particle.vy * 0.8;
    particle.vy += 0.08;
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

function updateComboTexts() {
  for (let index = comboTexts.length - 1; index >= 0; index--) {
    const text = comboTexts[index];
    if (text.rainbow && text.holdFrames > 0) {
      text.holdFrames -= 1;
      continue;
    }
    text.y -= text.rainbow ? 1.1 : 0.7;
    text.life -= 1;
    if (text.life <= 0) {
      comboTexts.splice(index, 1);
    }
  }
}

function updateComboRewards() {
  for (let index = comboRewards.length - 1; index >= 0; index--) {
    const reward = comboRewards[index];
    if (reward.arrived) {
      reward.element.remove();
      comboRewards.splice(index, 1);
      const newBalance = GameState.credits + reward.amount;
      if (Number.isSafeInteger(newBalance)) {
        GameState.credits = newBalance;
        updateShopDisplay();
        persistShopProgress();
      }
      continue;
    }

    if (reward.waitFrames > 0) {
      reward.waitFrames -= 1;
      continue;
    }

    reward.travelFrames += 1;
    const progress = Math.min(1, reward.travelFrames / 30);
    const easedProgress = 1 - (1 - progress) ** 3;
    const balanceBounds = creditBalance.getBoundingClientRect();
    const targetX = balanceBounds.left + balanceBounds.width / 2;
    const targetY = balanceBounds.top + balanceBounds.height / 2;
    reward.element.style.left = `${reward.startX + (targetX - reward.startX) * easedProgress}px`;
    reward.element.style.top = `${reward.startY + (targetY - reward.startY) * easedProgress}px`;
    if (progress === 1) {
      reward.element.remove();
      reward.arrived = true;
    }
  }
}

function startComboReward(amount) {
  const canvasBounds = canvas.getBoundingClientRect();
  const startX = canvasBounds.left + canvasBounds.width / 2;
  const startY = canvasBounds.top + canvasBounds.height / 2;
  const element = document.createElement("span");
  element.className = "combo-reward rainbow";
  element.textContent = `+${amount.toLocaleString()}`;
  element.setAttribute("aria-hidden", "true");
  element.style.left = `${startX}px`;
  element.style.top = `${startY}px`;
  document.body.append(element);
  comboRewards.push({
    element,
    amount,
    startX,
    startY,
    waitFrames: 30,
    travelFrames: 0,
    arrived: false
  });
}

function updateFallingPowerups() {
  for (let index = fallingPowerups.length - 1; index >= 0; index--) {
    const powerup = fallingPowerups[index];
    powerup.y += powerup.vy;
    if (boxesTouch(powerup, paddle)) {
      if (powerup.type === "multiball") {
        const sourceBall = balls[0];
        const speed = Math.hypot(sourceBall.vx, sourceBall.vy) || BALL_SPEED;
        for (let ballIndex = 0; ballIndex < 2; ballIndex++) {
          const velocity = randomUpwardVelocity(speed);
          balls.push({
            x: paddle.x + paddle.width / 2 - sourceBall.width / 2 + (Math.random() - 0.5) * 16,
            y: paddle.y - sourceBall.height,
            width: sourceBall.width,
            height: sourceBall.height,
            vx: velocity.vx,
            vy: velocity.vy
          });
        }
      } else if (powerup.type === "pentaball") {
        const sourceBall = balls[0];
        const speed = Math.hypot(sourceBall.vx, sourceBall.vy) || BALL_SPEED;
        const ballCount = 10;
        for (let ballIndex = 0; ballIndex < ballCount; ballIndex++) {
          const velocity = randomUpwardVelocity(speed);
          balls.push({
            x: paddle.x + (paddle.width - sourceBall.width) * Math.random(),
            y: paddle.y - sourceBall.height,
            width: sourceBall.width,
            height: sourceBall.height,
            vx: velocity.vx,
            vy: velocity.vy
          });
        }
      } else if (powerup.type === "heart") {
        GameState.lives += 1;
      } else if (powerup.type === "snipe") {
        snipeAmmo += 1;
      }
      fallingPowerups.splice(index, 1);
    } else if (powerup.y > HEIGHT) {
      fallingPowerups.splice(index, 1);
    }
  }
}

function randomUpwardVelocity(speed) {
  const angleFromUp = (Math.random() - 0.5) * (Math.PI * 2 / 3);
  return {
    vx: speed * Math.sin(angleFromUp),
    vy: -speed * Math.cos(angleFromUp)
  };
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
  triggerShake(7.5);
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
  brickCombo += 1;
  if (brickCombo > 1) {
    triggerShake(Math.min(12, 1.5 + (brickCombo - 2) * 1.5));
  }
  if (brickCombo > 1) {
    const reward = brickCombo === 10 ? 100 : brickCombo === 20 ? 200 : brickCombo === 30 ? 1000 : 0;
    const alreadyShowingThisCombo = comboTexts.some((text) => text.value === brickCombo && text.life > 0);
    if (!alreadyShowingThisCombo && brickCombo !== lastComboDisplayValue) {
      comboTexts.push({
        x: brickCombo >= 10 ? WIDTH / 2 : brick.x + brick.width / 2,
        y: brickCombo >= 10 ? HEIGHT / 2 : brick.y + brick.height / 2,
        value: brickCombo,
        life: brickCombo >= 10 ? 30 : 60,
        maxLife: brickCombo >= 10 ? 30 : 60,
        holdFrames: brickCombo >= 10 ? 30 : 0,
        rainbow: brickCombo >= 10
      });
      lastComboDisplayValue = brickCombo;
    }
    if (reward > 0) {
      startComboReward(reward);
    }
  }
  if (brick.special === "multiball" || brick.special === "pentaball" || brick.special === "heart") {
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
  triggerShake(7.5);
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

function movePaddleLeft(speed = paddle.speed) {
  paddle.x -= speed;
}

function movePaddle() {
  const previousX = paddle.x;
  const speed = paddle.speed * (performance.now() < paddleBoostUntil ? PADDLE_BOOST_MULTIPLIER : 1);
  if (keys["arrowleft"] || keys["a"]) {
    movePaddleLeft(speed);
  }
  if (keys["arrowright"] || keys["d"]) {
    paddle.x += speed;
  }

  // Keep the paddle on the screen.
  if (paddle.x < 0) {
    paddle.x = 0;
  }
  if (paddle.x + paddle.width > WIDTH) {
    paddle.x = WIDTH - paddle.width;
  }

  if (paddleSlowed) {
    paddleTrail = [];
  } else if (paddle.x !== previousX) {
    paddleTrail.unshift({ x: previousX, life: PADDLE_TRAIL_LIFE });
    if (paddleTrail.length > PADDLE_TRAIL_LENGTH) {
      paddleTrail.pop();
    }
  }
}

function updatePaddleTrail() {
  for (let index = paddleTrail.length - 1; index >= 0; index--) {
    paddleTrail[index].life -= 1;
    if (paddleTrail[index].life <= 0) {
      paddleTrail.splice(index, 1);
    }
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

function updateBallTrail(ball, moving = ballLaunched) {
  const centerX = ball.x + ball.width / 2;
  const centerY = ball.y + ball.height / 2;
  if (!moving) {
    ball.trail = Array.from({ length: BALL_TRAIL_LENGTH }, (_, index) => ({
      x: centerX,
      y: centerY + (index + 1) * 2.5
    }));
    return;
  }

  if (!ball.trail) {
    ball.trail = [];
  }
  ball.trail.unshift({
    x: centerX,
    y: centerY
  });
  if (ball.trail.length > BALL_TRAIL_LENGTH) {
    ball.trail.pop();
  }
}


// ------------------------------------------------------------
// DRAW: paints everything on the canvas. Black background,
// white shapes.
// ------------------------------------------------------------
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  if (shakeFrames > 0 && shakeStrength > 0) {
    const fade = shakeFrames / 16;
    ctx.translate(
      (Math.random() * 2 - 1) * shakeStrength * fade,
      (Math.random() * 2 - 1) * shakeStrength * fade
    );
  }

  drawPaddleTrail();
  ctx.fillStyle = paddleSlowed ? "#ef4545" : "white";
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  if (!deathScreen && !levelComplete) {
    for (const ball of balls) {
      drawBallTrail(ball);
      const squishProgress = (ball.squish || 0) / BALL_SQUISH_FRAMES;
      const squish = squishProgress * squishProgress * (3 - 2 * squishProgress);
      ctx.fillStyle = paddleSlowed ? "#ef4545" : "white";
      ctx.beginPath();
      ctx.ellipse(
        ball.x + ball.width / 2,
        ball.y + ball.height / 2,
        ball.width / 2 * (1 + 0.18 * squish),
        ball.height / 2 * (1 - 0.18 * squish),
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  drawBricks();  // bricks.js
  drawExplosions();
  drawSnipeBeams();
  drawParticles();
  drawFallingPowerups();
  drawFallingSpikes();
  drawPaddleHitTexts();
  drawComboTexts();

  if (deathScreen) {
    drawDeathScreen();
  }
  if (levelComplete) {
    drawLevelComplete();
  }
  ctx.restore();
  drawHud();
}

function drawPaddleTrail() {
  if (paddleSlowed) {
    return;
  }
  ctx.save();
  ctx.fillStyle = paddleSlowed ? "#ff7777" : "#b8e9ff";
  for (const point of paddleTrail) {
    ctx.globalAlpha = point.life / PADDLE_TRAIL_LIFE * 0.3;
    ctx.fillRect(point.x, paddle.y, paddle.width, paddle.height);
  }
  ctx.restore();
}

function drawBallTrail(ball) {
  if (!ball.trail || ball.trail.length === 0) {
    return;
  }

  ctx.save();
  ctx.fillStyle = paddleSlowed ? "#ef4545" : "#b8e9ff";
  for (let index = ball.trail.length - 1; index >= 0; index--) {
    const point = ball.trail[index];
    const fade = 1 - index / ball.trail.length;
    ctx.globalAlpha = fade * 0.28;
    ctx.beginPath();
    ctx.arc(point.x, point.y, ball.width / 2 * fade, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawComboTexts() {
  ctx.save();
  ctx.font = "18px 'Fredoka One', cursive";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const text of comboTexts) {
    ctx.globalAlpha = text.life / text.maxLife;
    ctx.fillStyle = text.rainbow
      ? `hsl(${(performance.now() / 3 + text.value * 17) % 360}, 100%, 60%)`
      : "#fff0a0";
    if (text.rainbow) {
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
    }
    ctx.fillText(`COMBO ${text.value}!`, text.x, text.y);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
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
  ctx.font = "18px 'Fredoka One', cursive";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Blocks broken: ${GameState.blocksBroken}`, 16, 14);
  if (snipeAmmo > 0) {
    ctx.textAlign = "center";
    ctx.font = "14px 'Fredoka One', cursive";
    ctx.fillText(`SNIPE AMMO ${snipeAmmo} | X TO FIRE`, WIDTH / 2, 14);
    ctx.font = "18px 'Fredoka One', cursive";
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
  ctx.strokeStyle = "#555";
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
      ctx.font = "18px 'Fredoka One', cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+", centerX, centerY);
    } else if (powerup.type === "pentaball") {
      ctx.fillStyle = "#25c6b7";
      ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
      ctx.fillStyle = "#11665f";
      ctx.font = "12px 'Fredoka One', cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("10", centerX, centerY);
    } else if (powerup.type === "heart") {
      ctx.fillStyle = "#f05a70";
      ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
      ctx.fillStyle = "white";
      ctx.font = "18px 'Fredoka One', cursive";
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
  ctx.font = "16px 'Fredoka One', cursive";
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
  ctx.font = "34px 'Fredoka One', cursive";
  ctx.fillText("You died!", WIDTH / 2, HEIGHT / 2 - 42);
  ctx.font = "20px 'Fredoka One', cursive";
  ctx.fillText(`Blocks broken: ${GameState.blocksBroken}`, WIDTH / 2, HEIGHT / 2 + 2);
  ctx.font = "16px 'Fredoka One', cursive";
  ctx.fillText(GameState.lives > 0 ? "Press Enter to continue" : "Press Enter to restart", WIDTH / 2, HEIGHT / 2 + 42);
}

function drawLevelComplete() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "30px 'Fredoka One', cursive";
  ctx.fillText(`Level ${level} complete!`, WIDTH / 2, HEIGHT / 2 - 58);
  ctx.font = "18px 'Fredoka One', cursive";
  ctx.fillText(`Credits earned: +${creditsEarnedThisLevel}`, WIDTH / 2, HEIGHT / 2 - 18);
  ctx.font = "16px 'Fredoka One', cursive";
  ctx.fillText("Press Enter to continue", WIDTH / 2, HEIGHT / 2 + 48);
}

function drawParticles() {
  for (const particle of particles) {
    ctx.globalAlpha = particle.opaque
      ? 1
      : particle.life / particle.maxLife * (particle.alpha ?? 1);
    ctx.fillStyle = particle.color;
    if (particle.glow) {
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
    }
    ctx.fillRect(particle.x, particle.y, particle.width, particle.height);
    if (particle.glow) {
      ctx.shadowBlur = 0;
    }
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
    const itemInventoryState = createDefaultItemInventory();
    const savedItems = saved.itemInventory && typeof saved.itemInventory === "object" ? saved.itemInventory : {};

    for (const itemKey of ITEM_ORDER) {
      const savedItem = savedItems[itemKey] && typeof savedItems[itemKey] === "object" ? savedItems[itemKey] : {};
      const legacyKey = itemKey === "snipe" ? "sniper" : itemKey;
      const legacyOwned = saved[`${legacyKey}UpgradeOwned`];
      const legacyEquipped = saved[`${legacyKey}UpgradeEquipped`];
      const savedCount = Number.isInteger(savedItem.count) ? savedItem.count : 0;
      const savedOwned = savedItem.owned === true || legacyOwned === true;

      itemInventoryState[itemKey].count = Math.max(0, savedCount || (savedOwned ? 1 : 0));
      itemInventoryState[itemKey].equipped = (savedItem.equipped === true || legacyEquipped === true) && itemInventoryState[itemKey].count > 0;
    }

    return {
      credits: Number.isSafeInteger(saved.credits) && saved.credits >= 0 ? saved.credits : 0,
      itemInventory: itemInventoryState
    };
  } catch (error) {
    console.error("Could not load saved shop progress.", error);
    shopStorageError = true;
    return {
      credits: 0,
      itemInventory: createDefaultItemInventory()
    };
  }
}

function persistShopProgress() {
  try {
    window.localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify({
      credits: GameState.credits,
      itemInventory
    }));
    shopStorageError = false;
    return true;
  } catch (error) {
    console.error("Could not save shop progress.", error);
    shopStorageError = true;
    return false;
  }
}

function updateShopDisplay() {
  const balanceText = `Credits: ${formatCredits(GameState.credits)}`;
  creditBalance.textContent = balanceText;
  openChestButton.disabled = GameState.credits < CHEST_COST;
  openChestButton.textContent = `Open chest · ${CHEST_COST}`;

  shopList.innerHTML = ITEM_ORDER.map((itemKey) => {
    const item = ITEM_DEFS[itemKey];
    const itemState = itemInventory[itemKey];
    const owned = itemState.count > 0;
    const equipped = itemState.equipped;
    const previewText = owned ? item.previewText : "?";
    const rarityLabel = `${item.dropChance}%`;
    const nameLabel = owned ? item.name : "???";
    const descriptionText = owned ? item.description : "???";
    const actionLabel = owned ? (equipped ? "Unequip" : "Equip") : "Not found";

    return `
      <div class="shop-item ${owned ? "" : "mystery-item"}">
        <h3>${nameLabel}</h3>
        <div class="shop-item-content">
          <span class="${owned ? item.previewClass : "mystery-preview"}" aria-label="${owned ? item.name : "Mystery item"} preview">${previewText}</span>
          <div class="shop-copy">
            <span class="rarity-pill rarity-${item.rarity}">${rarityLabel}</span>
            <p>${descriptionText}</p>
          </div>
          <div class="shop-actions">
            <button type="button" data-item-key="${itemKey}" data-action="equip" ${owned ? "" : "disabled"}>${actionLabel}</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  shopList.querySelectorAll("[data-item-key]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleItemEquipment(button.dataset.itemKey);
    });
  });
}

function formatCredits(credits) {
  const units = [
    { value: 1_000_000_000, suffix: "b" },
    { value: 1_000_000, suffix: "m" },
    { value: 1_000, suffix: "k" }
  ];
  const unit = units.find(({ value }) => credits >= value);
  if (!unit) {
    return String(credits);
  }
  let roundedValue = Math.round(credits / unit.value * 10) / 10;
  let suffix = unit.suffix;
  if (roundedValue >= 1_000 && unit.suffix !== "b") {
    const nextUnit = units[units.indexOf(unit) - 1];
    roundedValue = Math.round(credits / nextUnit.value * 10) / 10;
    suffix = nextUnit.suffix;
  }
  return `${roundedValue.toFixed(1).replace(/\.0$/, "")}${suffix}`;
}

function makeBricksForRound(roundLevel) {
  const roundBricks = makeBricks(roundLevel);
  equippedBrickOriginals = new Map();
  if (itemInventory.snipe.equipped) {
    addEquippedBricks(roundBricks, "snipe");
  }
  if (itemInventory.multiball.equipped) {
    const multiballBrickCount = Math.floor(Math.random() * 4) + 1;
    addEquippedBricks(roundBricks, "multiball", multiballBrickCount);
  }
  if (itemInventory.pentaball.equipped) {
    addEquippedBricks(roundBricks, "pentaball");
  }
  if (itemInventory.explosive.equipped) {
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
  const earned = 100 + Math.max(0, GameState.lives - 3) * 30;
  GameState.credits += earned;
  updateShopDisplay();
  persistShopProgress();
  return earned;
}

function openChest() {
  if (GameState.credits < CHEST_COST) {
    showInsufficientFunds(openChestButton);
    return;
  }

  GameState.credits -= CHEST_COST;
  const itemKey = rollChestItem();
  const item = ITEM_DEFS[itemKey];

  if (itemInventory[itemKey].count > 0) {
    const duplicateValue = Math.round(item.sellPrice / 10);
    GameState.credits += duplicateValue;
    revealChestItem(item, item.dropChance, duplicateValue, itemKey);
    updateShopDisplay();
    persistShopProgress();
    return;
  }

  itemInventory[itemKey].count = 1;
  itemInventory[itemKey].equipped = false;
  revealChestItem(item, item.dropChance, null, itemKey);
  updateShopDisplay();
  persistShopProgress();
}

function drawChestRevealCanvas(item, dropChance, duplicateValue = null, itemKey) {
  const revealCtx = chestRevealCanvas.getContext("2d");
  const width = chestRevealCanvas.width;
  const height = chestRevealCanvas.height;

  revealCtx.clearRect(0, 0, width, height);
  revealCtx.fillStyle = "rgba(14, 14, 18, 0.96)";
  revealCtx.fillRect(0, 0, width, height);

  revealCtx.strokeStyle = "#f4f4f4";
  revealCtx.lineWidth = 2;
  revealCtx.strokeRect(10, 10, width - 20, height - 20);

  revealCtx.fillStyle = "#d7d7d7";
  revealCtx.font = "12px 'Fredoka One', cursive";
  revealCtx.textAlign = "center";
  revealCtx.fillText("LOOT FOUND", width / 2, 32);

  const iconBoxX = width / 2 - 42;
  const iconBoxY = 48;
  const iconBoxSize = 84;

  revealCtx.fillStyle = "rgba(255, 255, 255, 0.08)";
  revealCtx.fillRect(iconBoxX, iconBoxY, iconBoxSize, iconBoxSize);
  revealCtx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  revealCtx.strokeRect(iconBoxX, iconBoxY, iconBoxSize, iconBoxSize);

  drawChestBrickIcon(revealCtx, itemKey, width / 2 - 34, 73, 68, 34);

  revealCtx.textBaseline = "alphabetic";
  revealCtx.font = "22px 'Fredoka One', cursive";
  revealCtx.fillText(item.name, width / 2, 158);

  revealCtx.font = "14px 'Fredoka One', cursive";
  revealCtx.fillStyle = "#d7d7d7";
  revealCtx.fillText(`${dropChance}% drop`, width / 2, 180);

  revealCtx.font = "18px 'Fredoka One', cursive";
  revealCtx.fillStyle = duplicateValue !== null ? "#ffd36b" : "#b7f0c1";
  revealCtx.fillText(
    duplicateValue !== null ? `Dupe: sold for ${duplicateValue}` : "New item found!",
    width / 2,
    203
  );
}

function drawChestBrickIcon(revealCtx, itemKey, x, y, width, height) {
  const style = POWERUP_STYLES[itemKey];
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  revealCtx.fillStyle = style.color;
  revealCtx.fillRect(x, y, width, height);
  revealCtx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  revealCtx.lineWidth = 1;
  revealCtx.strokeRect(x, y, width, height);
  revealCtx.fillStyle = style.darkerColor;

  if (itemKey === "multiball") {
    revealCtx.beginPath();
    revealCtx.arc(centerX, centerY, height * 0.2, 0, Math.PI * 2);
    revealCtx.fill();
  } else if (itemKey === "pentaball") {
    revealCtx.font = "11px 'Fredoka One', cursive";
    revealCtx.textAlign = "center";
    revealCtx.textBaseline = "middle";
    revealCtx.fillText("PENTA", centerX, centerY);
  } else if (itemKey === "heart") {
    revealCtx.font = "22px 'Fredoka One', cursive";
    revealCtx.textAlign = "center";
    revealCtx.textBaseline = "middle";
    revealCtx.fillText("+", centerX, centerY);
  } else if (itemKey === "spike") {
    revealCtx.beginPath();
    revealCtx.moveTo(centerX, centerY - height * 0.3);
    revealCtx.lineTo(centerX + width * 0.12, centerY + height * 0.27);
    revealCtx.lineTo(centerX - width * 0.12, centerY + height * 0.27);
    revealCtx.closePath();
    revealCtx.fill();
  } else if (itemKey === "explosive") {
    revealCtx.beginPath();
    for (let point = 0; point < 12; point++) {
      const angle = point / 12 * Math.PI * 2 - Math.PI / 2;
      const radius = point % 2 === 0 ? height * 0.38 : height * 0.17;
      const pointX = centerX + Math.cos(angle) * radius;
      const pointY = centerY + Math.sin(angle) * radius;
      if (point === 0) {
        revealCtx.moveTo(pointX, pointY);
      } else {
        revealCtx.lineTo(pointX, pointY);
      }
    }
    revealCtx.closePath();
    revealCtx.fill();
    revealCtx.fillStyle = "#fff0a0";
    revealCtx.beginPath();
    revealCtx.arc(centerX, centerY, 2, 0, Math.PI * 2);
    revealCtx.fill();
  } else {
    revealCtx.font = "13px 'Fredoka One', cursive";
    revealCtx.textAlign = "center";
    revealCtx.textBaseline = "middle";
    revealCtx.fillText("SNIPE", centerX, centerY);
  }
}

function closeChestReveal() {
  chestReveal.hidden = true;
  chestReveal.onclick = null;
}

function revealChestItem(item, dropChance, duplicateValue = null, itemKey) {
  chestReveal.hidden = false;
  chestReveal.onclick = closeChestReveal;
  drawChestRevealCanvas(item, dropChance, duplicateValue, itemKey);
}

function openShop() {
  shopOpen = true;
  shopMenu.hidden = false;
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
  itemInventory = createDefaultItemInventory();
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

function toggleItemEquipment(itemKey) {
  const itemState = itemInventory[itemKey];
  if (!itemState || itemState.count <= 0) {
    return;
  }

  const nextEquipped = !itemState.equipped;
  itemState.equipped = nextEquipped;

  if (nextEquipped) {
    const count = itemKey === "multiball" ? Math.floor(Math.random() * 4) + 1 : 1;
    addEquippedBricks(bricks, itemKey, count);
  } else {
    removeEquippedBrick(itemKey);
  }

  updateShopDisplay();
}


function showInsufficientFunds(button) {
  const previousTimer = purchaseFeedbackTimers.get(button);
  if (previousTimer !== undefined) {
    window.clearTimeout(previousTimer);
  }

  button.textContent = "Not enough credits";
  button.classList.remove("insufficient-funds");
  void button.offsetWidth;
  button.classList.add("insufficient-funds");

  const timer = window.setTimeout(() => {
    button.textContent = button.dataset.defaultLabel || `Open chest · ${CHEST_COST}`;
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
