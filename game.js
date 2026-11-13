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
const codeStatus = document.getElementById("code-status");
const levelCodeBar = document.querySelector(".level-code");
const startMenu = document.getElementById("start-menu");
const startGameButton = document.getElementById("start-game");
const gameModeSelection = document.getElementById("game-mode-selection");
const backToMainMenuButton = document.getElementById("back-to-main-menu");
const openMainMenuButton = document.getElementById("open-main-menu");
const skipLevelButton = document.getElementById("skip-level");
const gameBoard = document.querySelector(".game-board");
const equipmentNotice = document.getElementById("equipment-notice");
const openShopButton = document.getElementById("open-shop");
const openSettingsButton = document.getElementById("open-settings");
const openStatsButton = document.getElementById("open-stats");
const closeShopButton = document.getElementById("close-shop");
const closeSettingsButton = document.getElementById("close-settings");
const closeStatsButton = document.getElementById("close-stats");
const resetCreditsButton = document.getElementById("reset-credits");
const soundToggle = document.getElementById("sound-toggle");
const openChestButton = document.getElementById("open-chest");
const bricksShopTab = document.getElementById("bricks-shop-tab");
const powerupsShopTab = document.getElementById("powerups-shop-tab");
const shopMenu = document.getElementById("shop-menu");
const settingsMenu = document.getElementById("settings-menu");
const statsMenu = document.getElementById("stats-menu");
const adminTools = document.getElementById("admin-tools");
const adminMoneyForm = document.getElementById("admin-money-form");
const adminMoneyInput = document.getElementById("admin-money");
const adminBrickForm = document.getElementById("admin-brick-form");
const adminBrickSelect = document.getElementById("admin-brick");
const adminPowerupForm = document.getElementById("admin-powerup-form");
const adminPowerupSelect = document.getElementById("admin-powerup");
const adminStatus = document.getElementById("admin-status");
const shopList = document.getElementById("shop-list");
const chestReveal = document.getElementById("chest-reveal");
const chestRevealCanvas = document.getElementById("chest-reveal-canvas");
let activeChestReveal = null;
let chestRevealAnimationFrame = 0;
let equipmentNoticeTimeout = null;
const creditBalance = document.getElementById("credit-balance");
const statHighestCombo = document.getElementById("stat-highest-combo");
const statMostMoney = document.getElementById("stat-most-money");
const statTotalMoney = document.getElementById("stat-total-money");
const statChestsOpened = document.getElementById("stat-chests-opened");
const statHighestLevel = document.getElementById("stat-highest-level");
const statImpossibleSquaredWins = document.getElementById("stat-impossible-squared-wins");
const gameTitle = document.getElementById("game-title");
const menuCanvas = document.getElementById("menu-canvas");
const menuCtx = menuCanvas.getContext("2d");
const roundReward = document.getElementById("round-reward");
const roundRewardRoundTitle = document.getElementById("round-complete-title");
const roundRewardTitle = document.getElementById("round-reward-title");
const roundRewardDetails = document.getElementById("round-reward-details");
const roundRewardShopHint = document.getElementById("round-reward-shop-hint");
const roundRewardOptions = document.getElementById("round-reward-options");
const finishRunButton = document.getElementById("finish-run");
const returnToMenuButton = document.getElementById("return-to-menu");
const roundRewardActions = document.querySelector(".round-reward-actions");
const tryImpossibleButton = document.getElementById("try-impossible");
const tryImpossibleSquaredButton = document.getElementById("try-impossible-squared");
const tryImpossibleOption = document.getElementById("try-impossible-option");
const tryImpossibleSquaredOption = document.getElementById("try-impossible-squared-option");
const modePowerupSelect = document.getElementById("mode-powerup-select");
const modePowerupOptions = document.getElementById("mode-powerup-options");
const modePowerupStatus = document.getElementById("mode-powerup-status");
const beginImpossibleButton = document.getElementById("begin-impossible");
const cancelImpossibleButton = document.getElementById("cancel-impossible");
const openGuideButton = document.getElementById("open-guide");
const closeGuideButton = document.getElementById("close-guide");
const guideRecommended = document.getElementById("guide-recommended");
const guideMenu = document.getElementById("guide-menu");
const guideItems = document.getElementById("guide-items");

const WIDTH = 600;
const HEIGHT = 450;
ctx.scale(canvas.width / WIDTH, canvas.height / HEIGHT);
const PADDLE_TRAIL_LENGTH = 10;
const PADDLE_TRAIL_LIFE = 12;
const CHEST_COST = 100;
const CHEST_ROLL_DURATION = 4000;
const ROUND_REWARD_REVEAL_DELAY = 500;
const LEVEL_COMPLETE_FADE_FRAMES = 18;
const TIME_MACHINE_DURATION = 5000;
const PADDLE_BASE_WIDTH = 90;
const PADDLE_WIDE_WIDTH = 135;
const PADDLE_RESIZE_RATE = 0.18;
const SHOP_STORAGE_KEY = "block-breaker-shop";
const IMPOSSIBLE_2_WINS_STORAGE_KEY = "block-breaker-impossible-squared-wins";
const HOW_TO_PLAY_STORAGE_KEY = "block-breaker-how-to-play-seen";
let impossibleSquaredWins = 0;
let hasSeenHowToPlay = false;
const ITEM_ORDER = [
  "multiball", "snipe", "explosive", "pentaball", "laser", "debris",
  "paddle", "timeMachine", "magnet", "machineGun", "doublePaddle"
];
const BRICK_ITEM_ORDER = ["multiball", "explosive", "pentaball", "laser", "debris"];
const SHOP_ITEM_ORDER = {
  bricks: ["multiball", "debris", "pentaball", "laser", "explosive"],
  powerups: ["paddle", "timeMachine", "magnet", "snipe", "doublePaddle", "machineGun"]
};
const CHEST_DROP_WEIGHTS = {
  bricks: { pentaball: 17, explosive: 1, multiball: 40, laser: 2, debris: 40 },
  powerups: { snipe: 10, paddle: 50, timeMachine: 20, magnet: 15, machineGun: 1, doublePaddle: 4 }
};
let activeShopTab = "bricks";
const ITEM_DEFS = Object.freeze({
  pentaball: {
    name: "Pentaball Brick",
    previewClass: "pentaball-brick-preview",
    previewText: "PENTA",
    description: "Launches 10 extra balls from the paddle.",
    rarity: 3,
    sellPrice: 1200
  },
  explosive: {
    name: "Explosive Brick",
    previewClass: "explosive-brick-preview",
    previewText: "",
    description: "Explodes when broken, destroying 4-6 nearby bricks.",
    rarity: 5,
    sellPrice: 600
  },
  laser: {
    name: "Laser Brick",
    previewClass: "laser-brick-preview",
    previewText: "",
    description: "When broken, fires lasers up, down, left, and right to clear brick lines.",
    rarity: 4,
    sellPrice: 650
  },
  debris: {
    name: "Debris Brick",
    previewClass: "debris-brick-preview",
    previewText: "",
    description: "When broken, drops block fragments that destroy bricks in their path.",
    rarity: 2,
    sellPrice: 500
  },
  snipe: {
    name: "Sniper Powerup",
    previewClass: "sniper-brick-preview",
    previewText: "AMMO",
    description: "Adds 1–2 sniper shots. Press Space to break a column of blocks.",
    rarity: 3,
    sellPrice: 500
  },
  multiball: {
    name: "Multiball Brick",
    previewClass: "multiball-brick-preview",
    previewText: "",
    description: "Shoots 2 extra balls from the paddle.",
    rarity: 2,
    sellPrice: 200
  },
  paddle: {
    name: "Paddle Powerup",
    previewClass: "paddle-brick-preview",
    previewText: "",
    description: "Makes your paddle 50% longer for the next round.",
    rarity: 0,
    sellPrice: 400
  },
  timeMachine: {
    name: "Time Machine",
    previewClass: "time-machine-brick-preview",
    previewText: "",
    description: "Press P to slow everything except the paddle for 5 seconds.",
    rarity: 1,
    sellPrice: 1500
  },
  magnet: {
    name: "Magnet Powerup",
    previewClass: "magnet-powerup-preview",
    previewText: "",
    description: "Pulls the ball toward the paddle during the next round.",
    rarity: 2,
    sellPrice: 550
  },
  machineGun: {
    name: "Machine Gun",
    previewClass: "machine-gun-powerup-preview",
    previewText: "",
    description: "Press F to fire ball bullets for 1 second during the next round.",
    rarity: 5,
    sellPrice: 700
  },
  doublePaddle: {
    name: "Double Paddle",
    previewClass: "double-paddle-powerup-preview",
    previewText: "",
    description: "Adds a blue paddle below yours for the next round.",
    rarity: 4,
    sellPrice: 900
  }
});
const TIME_MACHINE_ICON_MARKUP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12c0-2 3-2 3 0 0 4-6 4-6 0 0-5 9-7 12-2 3 6-1 13-7 14" fill="none" stroke="#5b2677" stroke-linecap="round" stroke-width="2.5"/></svg>';
const RUN_POWERUP_CHOICES = ["snipe", "paddle", "timeMachine", "magnet", "machineGun", "doublePaddle"];
let activeRunPowerups = Object.fromEntries(RUN_POWERUP_CHOICES.map((powerup) => [powerup, false]));

function getShopItemOrder(category = activeShopTab) {
  return [...SHOP_ITEM_ORDER[category]].sort((first, second) => (
    ITEM_DEFS[first].rarity - ITEM_DEFS[second].rarity ||
    CHEST_DROP_WEIGHTS[category][second] - CHEST_DROP_WEIGHTS[category][first]
  ));
}

function getChestDropChance(itemKey, category = activeShopTab) {
  const weights = CHEST_DROP_WEIGHTS[category];
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  return Math.round(weights[itemKey] / totalWeight * 100);
}

function rollChestItem(category = activeShopTab) {
  const weights = CHEST_DROP_WEIGHTS[category];
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const roll = Math.random() * totalWeight;
  let runningTotal = 0;

  for (const itemKey of getShopItemOrder(category)) {
    runningTotal += weights[itemKey];
    if (roll < runningTotal) {
      return itemKey;
    }
  }

  const orderedItems = getShopItemOrder(category);
  return orderedItems[orderedItems.length - 1];
}

const GameState = {
  lives: 3,
  blocksBroken: 0,
  credits: 0
};

function createDefaultStats(initialCredits = 500) {
  return {
    highestCombo: 0,
    mostMoney: initialCredits,
    totalMoney: initialCredits,
    chestsOpened: 0,
    highestLevel: 1,
    normalGameCompleted: false,
    rainbowUnlocked: false
  };
}

function createDefaultItemInventory() {
  return Object.fromEntries(ITEM_ORDER.map((itemKey) => [
    itemKey,
    itemKey === "multiball" ? { count: 1, equipped: true }
      : itemKey === "paddle" ? { count: 1, equipped: true }
        : { count: 0, equipped: false }
  ]));
}

let itemInventory = createDefaultItemInventory();
let shopStorageError = false;
let adminUnlocked = false;
const savedShopProgress = loadShopProgress();
GameState.credits = savedShopProgress.credits;
itemInventory = savedShopProgress.itemInventory;
adminUnlocked = savedShopProgress.adminUnlocked;
const GameStats = savedShopProgress.stats;
adminBrickSelect.innerHTML = BRICK_ITEM_ORDER.map((itemKey) => (
  `<option value="${itemKey}">${ITEM_DEFS[itemKey].name}</option>`
)).join("");
adminPowerupSelect.innerHTML = SHOP_ITEM_ORDER.powerups.map((itemKey) => (
  `<option value="${itemKey}">${ITEM_DEFS[itemKey].name}</option>`
)).join("");
updateShopDisplay();
updateStatsDisplay();
try {
  hasSeenHowToPlay = window.localStorage.getItem(HOW_TO_PLAY_STORAGE_KEY) === "true";
  const savedWins = Number(window.localStorage.getItem(IMPOSSIBLE_2_WINS_STORAGE_KEY));
  impossibleSquaredWins = Number.isSafeInteger(savedWins) && savedWins >= 0 ? savedWins : 0;
} catch (error) {
  console.error("Could not load local game counters.", error);
}
updateStatsDisplay();
updateGuideRecommendation();


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
const DOUBLE_PADDLE_GAP = 4;
const MACHINE_GUN_DURATION = 1000;
const MACHINE_GUN_FIRE_INTERVAL = 160;
const MACHINE_GUN_BULLET_SPEED = 10;
const MAGNET_RANGE = 190;
const MAGNET_STRENGTH = 0.05;

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
    ball.vy = -BALL_SPEED * (currentGameMode === "impossibleSquared" ? 0.5 : 1);
  }
}


// ------------------------------------------------------------
// THE PADDLE
// ------------------------------------------------------------
const paddle = {
  x: WIDTH / 2 - 45,
  y: HEIGHT - 30,
  width: PADDLE_BASE_WIDTH,
  height: 8,
  speed: PADDLE_SPEED
};
let paddleTrail = [];
let targetPaddleWidth = PADDLE_BASE_WIDTH;
let doublePaddle = null;


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
let laserBeams = [];
let machineGunBullets = [];
let snipeAmmo = 0;
let machineGunUntil = 0;
let machineGunNextShot = 0;
let machineGunUsed = false;
let paddleHitTexts = [];
let comboTexts = [];
let comboRewards = [];
let brickCombo = 0;
let lastComboDisplayValue = 0;
let shakeFrames = 0;
let shakeStrength = 0;
let gameStarted = false;
let level = 1;
let currentGameMode = "normal";
let modePowerupChoices = [];
let modeSelectionFromVictory = false;
let teleportBricksAtStart = 0;
let teleportBricksBroken = 0;
let debrisParticles = [];
let creditsEarnedThisLevel = 0;
let levelTransition = false;
let levelTransitionFrame = 0;
let levelComplete = false;
let levelCompleteFadeFrame = 0;
let gameWon = false;
let roundRewardPowerupChoices = [];
let roundRewardRevealTimeout = null;
let timeMachineSlowUntil = 0;
let timeMachineSlowTick = false;
let paddleSlowed = false;
let paddleSlowUntil = 0;
let paddleSlowStacks = 0;
let paddleBoostUntil = 0;
let paddleBoostCooldownUntil = 0;
let paddleHitFlashFrames = 0;
let paddleHitFlashX = 0;
let shopOpen = false;
let settingsOpen = false;
let statsOpen = false;
let equippedBrickOriginals = new Map();
updateAdminVisibility();


// ------------------------------------------------------------
// KEYBOARD
// keys["arrowleft"] is true while the left arrow is held down.
// ------------------------------------------------------------
const keys = {};

document.addEventListener("keydown", function (event) {
  if (!guideMenu.hidden && event.key === "Escape") {
    event.preventDefault();
    closeGuide();
    return;
  }
  if ((shopOpen || settingsOpen || statsOpen) && event.key === "Escape") {
    event.preventDefault();
    exitMenu();
    return;
  }
  if (shopOpen || settingsOpen || statsOpen || !guideMenu.hidden) {
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
  if (event.key.toLowerCase() === "p" && !event.repeat && activeRunPowerups.timeMachine && !deathScreen && !levelComplete && !levelTransition) {
    event.preventDefault();
    timeMachineSlowUntil = performance.now() + TIME_MACHINE_DURATION;
    timeMachineSlowTick = false;
  }
  if (event.key.toLowerCase() === "f" && !event.repeat && activeRunPowerups.machineGun && ballLaunched && !deathScreen && !levelComplete && !levelTransition) {
    event.preventDefault();
    startMachineGun();
  }
  if (event.code === "Enter" && deathScreen) {
    event.preventDefault();
    if (GameState.lives === 0) {
      resetGame();
    } else {
      resetBall();
    }
    deathScreen = false;
    updateAdminVisibility();
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
  gameModeSelection.hidden = false;
  startMenu.classList.add("is-selecting-mode");
  gameModeSelection.querySelector('[data-game-mode="normal"]').focus();
});

backToMainMenuButton.addEventListener("click", function () {
  gameModeSelection.hidden = true;
  startMenu.classList.remove("is-selecting-mode");
  startGameButton.focus();
});

gameModeSelection.querySelectorAll("[data-game-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.gameMode;
    if (mode === "normal") {
      startNormalGame();
    } else {
      openModePowerupSelect(mode === "impossible" ? 11 : 12, false);
    }
  });
});

tryImpossibleButton.addEventListener("click", () => openModePowerupSelect(11, true));
tryImpossibleSquaredButton.addEventListener("click", () => openModePowerupSelect(12, true));
beginImpossibleButton.addEventListener("click", beginSelectedImpossibleLevel);
cancelImpossibleButton.addEventListener("click", cancelModePowerupSelect);
modePowerupOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode-powerup]");
  if (!button) {
    return;
  }
  const powerup = button.dataset.modePowerup;
  if (modePowerupChoices.includes(powerup)) {
    modePowerupChoices = modePowerupChoices.filter((choice) => choice !== powerup);
  } else if (modePowerupChoices.length < 2) {
    modePowerupChoices.push(powerup);
  }
  updateModePowerupSelection();
});

openGuideButton.addEventListener("click", openGuide);
closeGuideButton.addEventListener("click", closeGuide);

openMainMenuButton.addEventListener("click", openMainMenu);
skipLevelButton.addEventListener("click", function () {
  if (!adminUnlocked || !gameStarted || deathScreen || levelTransition || levelComplete || level >= 10) {
    return;
  }
  levelComplete = true;
  levelCompleteFadeFrame = 0;
  resetPaddleSlow();
  clearRunPowerups();
  resetBall();
  updateAdminVisibility();
  showRoundReward();
});
openShopButton.addEventListener("click", openShop);
openSettingsButton.addEventListener("click", openSettings);
openStatsButton.addEventListener("click", openStats);
closeShopButton.addEventListener("click", closeShop);
closeSettingsButton.addEventListener("click", closeSettings);
closeStatsButton.addEventListener("click", closeStats);
openChestButton.addEventListener("click", openChest);
resetCreditsButton.addEventListener("click", resetCredits);
document.querySelectorAll("[data-shop-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    activeShopTab = button.dataset.shopTab;
    updateShopDisplay();
  });
});
shopList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-item-key]");
  if (button) {
    toggleItemEquipment(button.dataset.itemKey);
  }
});
roundRewardOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-run-powerup]");
  if (button) {
    chooseRunPowerup(button.dataset.runPowerup);
  }
});
roundRewardOptions.addEventListener("pointermove", () => {
  roundRewardOptions.classList.remove("ignore-hover");
});
finishRunButton.addEventListener("click", function () {
  roundReward.hidden = true;
  gameWon = false;
  resetGame();
  deathScreen = false;
});
returnToMenuButton.addEventListener("click", openMainMenu);
soundToggle.addEventListener("click", function () {
  const enabled = soundToggle.getAttribute("aria-pressed") !== "true";
  soundToggle.setAttribute("aria-pressed", String(enabled));
  soundToggle.textContent = enabled ? "On" : "Off";
  GameAudio.setSoundEnabled(enabled);
});

startMenu.addEventListener("animationend", function (event) {
  if (event.target !== startMenu) {
    return;
  }
  if (event.animationName === "menu-appear") {
    startMenu.classList.remove("is-opening");
    gameBoard.classList.remove("menu-dismissing");
    return;
  }
  if (event.animationName !== "menu-dismiss") {
    return;
  }
  gameStarted = true;
  updateAdminVisibility();
  levelCodeBar.classList.add("is-playing");
  startMenu.hidden = true;
  startMenu.classList.remove("is-starting");
  gameBoard.classList.remove("menu-dismissing");
});

function startNormalGame() {
  currentGameMode = "normal";
  resetGame();
  startMenu.classList.remove("is-selecting-mode");
  gameModeSelection.hidden = true;
  startGameButton.disabled = true;
  startMenu.classList.remove("is-opening");
  gameBoard.classList.add("menu-dismissing");
  startMenu.classList.add("is-starting");
  gameTitle.classList.add("is-started");
}

function openModePowerupSelect(targetLevel, fromVictory) {
  modeSelectionFromVictory = fromVictory;
  modePowerupChoices = [];
  modePowerupSelect.dataset.level = String(targetLevel);
  modePowerupOptions.innerHTML = RUN_POWERUP_CHOICES.map((powerup) => {
    const item = ITEM_DEFS[powerup];
    const preview = powerup === "timeMachine" ? TIME_MACHINE_ICON_MARKUP : item.previewText;
    return `<button class="powerup-choice" type="button" data-mode-powerup="${powerup}" aria-pressed="false">
      <span class="powerup-choice-icon ${item.previewClass}" aria-hidden="true">${preview}</span>
      <span class="powerup-choice-name">${item.name.replace(/ Powerup$/, "")}</span>
      <span class="powerup-choice-description">${item.description}</span>
    </button>`;
  }).join("");
  modePowerupSelect.hidden = false;
  if (!fromVictory) {
    gameModeSelection.hidden = true;
  } else {
    roundReward.hidden = true;
  }
  modePowerupOptions.querySelector("button")?.focus();
  updateModePowerupSelection();
}

function updateModePowerupSelection() {
  for (const button of modePowerupOptions.querySelectorAll("[data-mode-powerup]")) {
    const selected = modePowerupChoices.includes(button.dataset.modePowerup);
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.disabled = !selected && modePowerupChoices.length === 2;
  }
  beginImpossibleButton.disabled = modePowerupChoices.length !== 2;
  modePowerupStatus.textContent = `Choose two different powerups (${modePowerupChoices.length}/2 selected).`;
  beginImpossibleButton.textContent = Number(modePowerupSelect.dataset.level) === 11
    ? "Start Level 11 (Impossible)"
    : "Start Level 12 (Impossible²)";
}

function beginSelectedImpossibleLevel() {
  if (modePowerupChoices.length !== 2) {
    return;
  }
  currentGameMode = Number(modePowerupSelect.dataset.level) === 11 ? "impossible" : "impossibleSquared";
  const targetLevel = currentGameMode === "impossible" ? 11 : 12;
  clearRunPowerups();
  for (const powerup of modePowerupChoices) {
    activeRunPowerups[powerup] = true;
  }
  if (activeRunPowerups.snipe && roundLevel < 11) {
    snipeAmmo = 1;
  }
  GameState.lives = targetLevel === 11 ? 5 : 3;
  modePowerupSelect.hidden = true;
  roundReward.hidden = true;
  gameWon = false;
  levelComplete = false;
  deathScreen = false;
  gameStarted = true;
  startMenu.hidden = true;
  startMenu.classList.remove("is-selecting-mode", "is-starting");
  levelCodeBar.classList.add("is-playing");
  gameTitle.classList.add("is-started");
  beginLevel(targetLevel);
  canvas.focus({ preventScroll: true });
}

function cancelModePowerupSelect() {
  modePowerupSelect.hidden = true;
  if (modeSelectionFromVictory) {
    roundReward.hidden = false;
  } else {
    gameModeSelection.hidden = false;
  }
}

function openGuide() {
  hasSeenHowToPlay = true;
  try {
    window.localStorage.setItem(HOW_TO_PLAY_STORAGE_KEY, "true");
  } catch (error) {
    console.error("Could not save guide status.", error);
  }
  updateGuideRecommendation();
  renderGuideItems();
  guideMenu.hidden = false;
  closeGuideButton.focus();
}

function closeGuide() {
  guideMenu.hidden = true;
  openGuideButton.focus();
}

function updateGuideRecommendation() {
  const recommended = !hasSeenHowToPlay && !GameStats.normalGameCompleted;
  guideRecommended.hidden = !recommended;
  openGuideButton.classList.toggle("is-recommended", recommended);
}

function renderGuideItems() {
  const entries = [
    { key: "regular", name: "Regular brick", icon: "BLOCK", description: "Breaks with one hit.", unlocked: true },
    { key: "strong", name: "Strong brick", icon: "2 HITS", description: "Takes two hits to break.", unlocked: true },
    { key: "spike", name: "Spike brick (negative)", icon: "SPIKE", description: "Drops a spike that slows the paddle (10% in Level 11; otherwise 25%, stacking).", unlocked: GameStats.highestLevel >= 2 },
    { key: "speedBrick", name: "Speed brick (negative)", icon: "SPEED", description: "Doubles the ball speed and sends it downward through bricks; the boost wears off after 5 seconds.", unlocked: GameStats.highestLevel >= 4 },
    { key: "teleporter", name: "TP brick (negative)", icon: "TP", description: "Has a chance to teleport when hit; Level 12 teleporting stops after half are broken.", unlocked: GameStats.highestLevel >= 5 },
    { key: "snipe-brick", name: "Sniper Ammo brick", icon: "AMMO", description: "Collect it for one Sniper shot. Activation: Space.", unlocked: itemInventory.snipe.count > 0 },
    ...BRICK_ITEM_ORDER.map((key) => ({
      key,
      name: ITEM_DEFS[key].name,
      icon: key === "multiball" ? "● ● ●" : ITEM_DEFS[key].previewText || key.toUpperCase(),
      description: ITEM_DEFS[key].description,
      unlocked: itemInventory[key].count > 0
    })),
    ...RUN_POWERUP_CHOICES.map((key) => ({
      key,
      name: ITEM_DEFS[key].name,
      icon: ITEM_DEFS[key].previewText || key.toUpperCase(),
      description: `${ITEM_DEFS[key].description}${key === "snipe" ? " Activation: Space." : key === "timeMachine" ? " Activation: P." : key === "machineGun" ? " Activation: F." : ""}`,
      unlocked: itemInventory[key].count > 0
    })),
    { key: "extra-life", name: "Extra Life", icon: "+1", description: "Choose it after a level to gain one life.", unlocked: true }
  ];
  const icons = {
    regular: "■",
    strong: "▤",
    spike: "▲",
    speedBrick: "⇩",
    teleporter: "TP",
    "snipe-brick": "AMMO",
    multiball: "●●●",
    pentaball: "10●",
    explosive: "✹",
    laser: "✳",
    debris: "▦",
    snipe: "AMMO",
    paddle: "↔",
    timeMachine: TIME_MACHINE_ICON_MARKUP,
    magnet: "∩",
    machineGun: "•••",
    doublePaddle: "▁▁",
    "extra-life": "+1"
  };
  guideItems.innerHTML = entries.filter((entry) => entry.unlocked).map((entry) => {
    const style = POWERUP_STYLES[entry.key === "snipe-brick" ? "snipe" : entry.key]
      || (entry.key === "strong"
        ? { color: "#b8b8b8", darkerColor: "#333" }
        : entry.key === "regular"
          ? { color: "#fff", darkerColor: "#111" }
          : { color: "#f05a70", darkerColor: "#8d1c30" });
    return `<div class="guide-item"><span class="guide-icon" style="background:${style.color};color:${style.darkerColor}" aria-hidden="true">${icons[entry.key] || entry.icon}</span><p><strong>${entry.name}:</strong> ${entry.description}</p></div>`;
  }).join("");
}

document.addEventListener("keyup", function (event) {
  keys[event.key.toLowerCase()] = false;
});

levelCodeInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    levelCodeForm.requestSubmit();
  }
});

levelCodeInput.addEventListener("copy", function (event) {
  event.preventDefault();
});

levelCodeInput.addEventListener("cut", function (event) {
  event.preventDefault();
});

function updateAdminVisibility() {
  adminTools.hidden = !adminUnlocked;
  skipLevelButton.hidden = !adminUnlocked;
  skipLevelButton.disabled = !gameStarted || deathScreen || levelTransition || levelComplete || level >= 10;
}

levelCodeForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (levelCodeInput.value.trim().toLowerCase() === "sticky") {
    adminUnlocked = true;
    updateAdminVisibility();
    persistShopProgress();
    codeStatus.textContent = "Admin panel unlocked.";
  } else {
    codeStatus.textContent = "Invalid code.";
  }
  levelCodeInput.value = "";
});

adminMoneyForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const amountText = adminMoneyInput.value.trim();
  const amount = Number(amountText);
  if (!adminUnlocked || amountText === "" || !Number.isSafeInteger(amount) || amount < 0) {
    adminStatus.textContent = "Enter a whole amount from 0 to 9007199254740991.";
    return;
  }
  GameState.credits = amount;
  GameStats.mostMoney = Math.max(GameStats.mostMoney, amount);
  updateShopDisplay();
  updateStatsDisplay();
  persistShopProgress();
  adminStatus.textContent = `Money set to ${formatCredits(amount)}.`;
});

adminBrickForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const itemKey = adminBrickSelect.value;
  if (!adminUnlocked || !BRICK_ITEM_ORDER.includes(itemKey)) {
    adminStatus.textContent = "Choose a valid brick.";
    return;
  }
  if (itemInventory[itemKey].count > 0) {
    adminStatus.textContent = `You already have the ${ITEM_DEFS[itemKey].name}.`;
    return;
  }
  itemInventory[itemKey].count = 1;
  itemInventory[itemKey].equipped = false;
  updateShopDisplay();
  persistShopProgress();
  adminStatus.textContent = `${ITEM_DEFS[itemKey].name} added for free.`;
});

adminPowerupForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const itemKey = adminPowerupSelect.value;
  if (!adminUnlocked || !SHOP_ITEM_ORDER.powerups.includes(itemKey)) {
    adminStatus.textContent = "Choose a valid power-up.";
    return;
  }
  if (itemInventory[itemKey].count > 0) {
    adminStatus.textContent = `You already have the ${ITEM_DEFS[itemKey].name}.`;
    return;
  }
  itemInventory[itemKey].count = 1;
  itemInventory[itemKey].equipped = false;
  updateShopDisplay();
  persistShopProgress();
  adminStatus.textContent = `${ITEM_DEFS[itemKey].name} added for free.`;
});


// ------------------------------------------------------------
// UPDATE: runs 60 times every second. Move things, then check
// what they touched.
// ------------------------------------------------------------
function triggerShake(strength) {
  shakeStrength = Math.max(shakeStrength, strength);
  if (shakeFrames <= 1) {
    shakeFrames = 16;
  }
}

function update() {
  if (shopOpen || settingsOpen || statsOpen || !guideMenu.hidden) {
    return;
  }
  if (performance.now() < timeMachineSlowUntil) {
    timeMachineSlowTick = !timeMachineSlowTick;
    if (timeMachineSlowTick) {
      if (gameStarted) {
        updatePaddleResize();
        if (!deathScreen && !levelComplete && !levelTransition) {
          movePaddle();
        }
        updatePaddleTrail();
      }
      return;
    }
  } else {
    timeMachineSlowTick = false;
  }
  if (paddleSlowed && performance.now() >= paddleSlowUntil) {
    resetPaddleSlow();
  }
  updateFallingHearts();
  updateParticles();
  updateBrickEffects();
  updateExplosions();
  updateLaserBeams();
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
  if (paddleHitFlashFrames > 0) {
    paddleHitFlashFrames -= 1;
  }

  if (!gameStarted) {
    return;
  }
  updatePaddleResize();
  if (deathScreen || levelComplete) {
    if (levelComplete) {
      levelCompleteFadeFrame = Math.min(LEVEL_COMPLETE_FADE_FRAMES, levelCompleteFadeFrame + 1);
    }
    updateBackgroundHazards();
    return;
  }
  if (levelTransition) {
    updateLevelTransition();
    return;
  }

  updateMachineGun();
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
  }
  const fallenBalls = balls.filter((ball) => ball.y > HEIGHT);
  balls = balls.filter((ball) => ball.y <= HEIGHT);
  if (balls.length === 0) {
    const lastFallenBall = fallenBalls[fallenBalls.length - 1];
    if (lastFallenBall) {
      lastFallenBall.y = HEIGHT - lastFallenBall.height;
      balls.push(lastFallenBall);
    }
    if (GameState.lives > 0) {
      const position = getLifeHeartPosition(GameState.lives - 1);
      fallingHearts.push({
        ...position,
        vx: 1.2,
        vy: -2.5,
        rotation: 0,
        spin: 0.08,
        age: 0,
        reverse: false,
        gravity: 0.18
      });
    }
    GameState.lives = Math.max(0, GameState.lives - 1);
    fallingHearts = fallingHearts.filter((heart) => (
      !heart.reverse || heart.targetIndex < GameState.lives
    ));
    if (GameState.lives === 0) {
      clearRunPowerups();
    }
    ballLaunched = false;
    deathScreen = true;
    updateAdminVisibility();
  }

  if (!deathScreen && bricks.length === 0) {
    creditsEarnedThisLevel = awardRoundCredits();
    levelComplete = true;
    levelCompleteFadeFrame = 0;
    resetPaddleSlow();
    clearRunPowerups();
    updateAdminVisibility();
    showRoundReward();
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
  clearTimeout(roundRewardRevealTimeout);
  roundRewardRevealTimeout = null;
  clearRunPowerups();
  level = 1;
  currentGameMode = "normal";
  teleportBricksAtStart = 0;
  teleportBricksBroken = 0;
  bricks = makeBricksForRound(level);
  particles = [];
  explosions = [];
  fallingHearts = [];
  fallingPowerups = [];
  fallingSpikes = [];
  laserBeams = [];
  machineGunBullets = [];
  machineGunUntil = 0;
  machineGunNextShot = 0;
  machineGunUsed = false;
  for (const reward of comboRewards) {
    reward.element.remove();
  }
  comboRewards = [];
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
  paddleHitFlashFrames = 0;
  paddleHitFlashX = 0;
  deathScreen = false;
  levelTransition = false;
  levelComplete = false;
  levelCompleteFadeFrame = 0;
  gameWon = false;
  updateAdminVisibility();
  roundReward.hidden = true;
  paddleBoostUntil = 0;
  paddleBoostCooldownUntil = 0;
  resetPaddleSlow();
  targetPaddleWidth = PADDLE_BASE_WIDTH;
  paddle.width = PADDLE_BASE_WIDTH;
  paddle.x = WIDTH / 2 - paddle.width / 2;
  doublePaddle = null;
  machineGunBullets = [];
  machineGunUntil = 0;
  machineGunNextShot = 0;
  machineGunUsed = false;
  resetBall();
}

function beginLevel(nextLevel) {
  level = nextLevel;
  targetPaddleWidth = activeRunPowerups.paddle ? PADDLE_WIDE_WIDTH : PADDLE_BASE_WIDTH;
  doublePaddle = activeRunPowerups.doublePaddle
    ? { x: 0, y: paddle.y, width: PADDLE_BASE_WIDTH, height: paddle.height }
    : null;
  if (doublePaddle) {
    paddle.x = (WIDTH - paddle.width) / 2;
    syncDoublePaddle();
  }
  if (level > GameStats.highestLevel) {
    GameStats.highestLevel = level;
    updateStatsDisplay();
    persistShopProgress();
  }
  brickCombo = 0;
  lastComboDisplayValue = 0;
  resetPaddleSlow();
  bricks = makeBricksForRound(level);
  teleportBricksAtStart = bricks.filter((brick) => brick.special === "teleporter").length;
  teleportBricksBroken = 0;
  explosions = [];
  for (const brick of bricks) {
    brick.targetY = brick.y;
    brick.y = brick.targetY - BRICKS_TOP - BRICK_HEIGHT;
  }
  levelTransition = true;
  levelTransitionFrame = 0;
  updateAdminVisibility();
  fallingPowerups = [];
  fallingSpikes = [];
  snipeBeams = [];
  laserBeams = [];
  machineGunBullets = [];
  machineGunUntil = 0;
  machineGunNextShot = 0;
  machineGunUsed = false;
  resetBall();
}

function nextRound() {
  levelComplete = false;
  roundReward.hidden = true;
  beginLevel(level + 1);
}

function chooseRunPowerup(powerup) {
  if (
    !levelComplete ||
    gameWon ||
    (powerup !== "heart" && !RUN_POWERUP_CHOICES.includes(powerup)) ||
    !roundRewardPowerupChoices.includes(powerup)
  ) {
    return;
  }
  clearRunPowerups();
  if (powerup === "heart") {
    GameState.lives += 1;
    spawnLifeGainAnimation();
  } else {
    activeRunPowerups[powerup] = true;
  }
  if (powerup === "snipe") {
    snipeAmmo += 1;
  }
  nextRound();
}

function getLifeHeartPosition(index) {
  return {
    x: WIDTH - 16 - 22 - index * 28,
    y: HEIGHT - 55
  };
}

function spawnLifeGainAnimation() {
  const duration = 90;
  const initialXVelocity = 1.2;
  const initialYVelocity = -2.5;
  const gravity = 0.18;
  const position = getLifeHeartPosition(GameState.lives - 1);
  fallingHearts.push({
    x: position.x + initialXVelocity * duration,
    y: position.y + initialYVelocity * duration + gravity * duration * (duration - 1) / 2,
    vx: -initialXVelocity,
    vy: -(initialYVelocity + gravity * (duration - 1)),
    rotation: 0.08 * duration,
    spin: -0.08,
    age: 0,
    reverse: true,
    targetIndex: GameState.lives - 1,
    gravity
  });
}

function clearRunPowerups() {
  const hadDoublePaddle = Boolean(doublePaddle);
  activeRunPowerups = Object.fromEntries(RUN_POWERUP_CHOICES.map((powerup) => [powerup, false]));
  snipeAmmo = 0;
  timeMachineSlowUntil = 0;
  timeMachineSlowTick = false;
  machineGunUntil = 0;
  machineGunNextShot = 0;
  machineGunUsed = false;
  machineGunBullets = [];
  doublePaddle = null;
  laserBeams = [];
  roundRewardPowerupChoices = [];
  targetPaddleWidth = PADDLE_BASE_WIDTH;
  if (typeof paddle !== "undefined") {
    paddle.width = PADDLE_BASE_WIDTH;
    paddle.x = hadDoublePaddle
      ? (WIDTH - paddle.width) / 2
      : Math.min(paddle.x, WIDTH - paddle.width);
  }
}

function showRoundReward() {
  clearTimeout(roundRewardRevealTimeout);
  roundRewardRevealTimeout = null;
  roundRewardPowerupChoices = [];
  roundReward.classList.remove("is-revealing");
  roundReward.hidden = true;
  roundRewardRoundTitle.hidden = false;
  roundRewardOptions.hidden = gameWon;
  roundRewardActions.hidden = !gameWon;
  roundRewardShopHint.hidden = gameWon;
  finishRunButton.hidden = !gameWon;
  returnToMenuButton.hidden = !gameWon;
  tryImpossibleOption.hidden = true;
  tryImpossibleSquaredOption.hidden = true;

  if (level === 10 && currentGameMode === "normal") {
    gameWon = true;
    roundRewardRoundTitle.hidden = true;
    roundRewardShopHint.hidden = true;
    const finalReward = 1000;
    addCredits(finalReward);
    creditsEarnedThisLevel += finalReward;
    updateShopDisplay();
    persistShopProgress();
    roundRewardTitle.textContent = "You beat the game!";
    roundRewardDetails.textContent = `Level 10 complete! +${creditsEarnedThisLevel} credits total, including the +${finalReward} bonus.`;
    roundRewardOptions.hidden = true;
    roundRewardActions.hidden = false;
    tryImpossibleOption.hidden = false;
    tryImpossibleSquaredOption.hidden = false;
    GameStats.normalGameCompleted = true;
    persistShopProgress();
    updateGuideRecommendation();
    scheduleRoundRewardReveal();
    return;
  }

  if (level === 11 || level === 12) {
    gameWon = true;
    roundRewardRoundTitle.hidden = true;
    roundRewardShopHint.hidden = true;
    roundRewardTitle.textContent = level === 11 ? "Impossible beaten!" : "Impossible² beaten!";
    const reward = level === 11 ? 5000 : 100000;
    addCredits(reward);
    creditsEarnedThisLevel += reward;
    if (level === 12) {
      GameStats.rainbowUnlocked = true;
      incrementImpossibleSquaredWins();
    }
    roundRewardDetails.textContent = `Level ${level} complete! +${reward.toLocaleString()} credits${level === 12 ? " and permanent Rainbow Paddle & Ball unlocked." : "."}`;
    roundRewardOptions.hidden = true;
    roundRewardActions.hidden = false;
    updateShopDisplay();
    persistShopProgress();
    scheduleRoundRewardReveal();
    return;
  }

  roundRewardRoundTitle.hidden = false;
  roundRewardRoundTitle.textContent = `Round ${level} completed`;
  updateRoundRewardChoices();
  roundRewardDetails.textContent = `Credits: +${creditsEarnedThisLevel}`;
  roundRewardTitle.textContent = "Pick a power up";
  roundRewardOptions.hidden = false;
  roundRewardActions.hidden = true;
  scheduleRoundRewardReveal();
}

function scheduleRoundRewardReveal() {
  roundRewardRevealTimeout = setTimeout(() => {
    roundRewardRevealTimeout = null;
    if (!levelComplete) {
      return;
    }
    if (!gameWon) {
      roundRewardOptions.classList.add("ignore-hover");
    }
    roundReward.hidden = false;
    roundReward.classList.add("is-revealing");
    if (gameWon) {
      finishRunButton.focus();
    } else {
      roundRewardOptions.querySelector("[data-run-powerup]:not([hidden])").focus();
    }
  }, ROUND_REWARD_REVEAL_DELAY);
}

function updateRoundRewardChoices() {
  const buttons = [...roundRewardOptions.querySelectorAll("[data-run-powerup]")];
  const ownedPowerups = [];
  for (const button of buttons) {
    const powerup = button.dataset.runPowerup;
    button.hidden = powerup === "heart"
      ? false
      : itemInventory[powerup].count === 0 || !itemInventory[powerup].equipped;
    if (!button.hidden) {
      if (powerup !== "heart") {
        ownedPowerups.push(powerup);
      }
    }
  }
  for (let index = ownedPowerups.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [ownedPowerups[index], ownedPowerups[swapIndex]] = [
      ownedPowerups[swapIndex],
      ownedPowerups[index]
    ];
  }
  roundRewardPowerupChoices = [...ownedPowerups.slice(0, 2), "heart"];
  const availablePowerups = new Set(roundRewardPowerupChoices);
  for (const button of buttons) {
    button.hidden = !availablePowerups.has(button.dataset.runPowerup);
  }
  return roundRewardPowerupChoices;
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
    updateAdminVisibility();
    for (const brick of bricks) {
      brick.y = brick.targetY;
    }
    resetBall();
  }
}

function updateParticles() {
  for (let index = particles.length - 1; index >= 0; index--) {
    const particle = particles[index];
    if (particle.debris) {
      particle.y += particle.vy;
      for (const brick of [...bricks]) {
        if (!brick.pendingDestroy && boxesTouch(particle, brick)) {
          destroyBrick(brick, false, true);
        }
      }
    } else {
      particle.x += particle.vx * 0.8;
      particle.y += particle.vy * 0.8;
      particle.vy += 0.08;
    }
    particle.life -= 1;

    if (particle.life <= 0 || (particle.debris && particle.y > HEIGHT)) {
      particles.splice(index, 1);
    }
  }
}

function updateFallingHearts() {
  for (let index = fallingHearts.length - 1; index >= 0; index--) {
    const heart = fallingHearts[index];
    heart.x += heart.vx;
    heart.y += heart.vy;
    heart.vy += heart.gravity;
    heart.rotation += heart.spin;
    heart.age += 1;

    if ((!heart.reverse && heart.y > HEIGHT) || heart.age > 90) {
      fallingHearts.splice(index, 1);
    }
  }
}

function resetPaddleSlow() {
  paddleSlowed = false;
  paddle.speed = PADDLE_SPEED;
  paddleSlowUntil = 0;
  paddleSlowStacks = 0;
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
      if (addCredits(reward.amount)) {
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
    waitFrames: 60,
    travelFrames: 0,
    arrived: false
  });
}

function incrementImpossibleSquaredWins() {
  impossibleSquaredWins = Math.min(Number.MAX_SAFE_INTEGER, impossibleSquaredWins + 1);
  try {
    window.localStorage.setItem(IMPOSSIBLE_2_WINS_STORAGE_KEY, String(impossibleSquaredWins));
  } catch (error) {
    console.error("Could not save the Impossible² win counter.", error);
  }
  updateStatsDisplay();
}

function updateFallingPowerups() {
  for (let index = fallingPowerups.length - 1; index >= 0; index--) {
    const powerup = fallingPowerups[index];
    powerup.y += powerup.vy;
    if (boxesTouch(powerup, paddle) || (doublePaddle && boxesTouch(powerup, doublePaddle))) {
      GameAudio.play("pickup");
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
  GameAudio.play("snipe");
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

function startMachineGun() {
  if (machineGunUsed || !ballLaunched) {
    return;
  }
  machineGunUsed = true;
  machineGunUntil = performance.now() + MACHINE_GUN_DURATION;
  machineGunNextShot = 0;
}

function updateMachineGun() {
  const now = performance.now();
  if (now < machineGunUntil && now >= machineGunNextShot) {
    const bulletSize = 15;
    machineGunBullets.push({
      x: paddle.x + paddle.width / 2 - bulletSize / 2,
      y: paddle.y - bulletSize,
      width: bulletSize,
      height: bulletSize,
      vy: -MACHINE_GUN_BULLET_SPEED,
      trail: []
    });
    machineGunNextShot = now + MACHINE_GUN_FIRE_INTERVAL;
  } else if (now >= machineGunUntil) {
    machineGunUntil = 0;
  }

  for (let index = machineGunBullets.length - 1; index >= 0; index--) {
    const bullet = machineGunBullets[index];
    bullet.trail.unshift({ x: bullet.x + bullet.width / 2, y: bullet.y + bullet.height / 2 });
    if (bullet.trail.length > BALL_TRAIL_LENGTH) {
      bullet.trail.pop();
    }
    bullet.y += bullet.vy;
    const target = bricks.find((brick) => !brick.pendingDestroy && boxesTouch(bullet, brick));
    if (target) {
      destroyBrick(target);
      machineGunBullets.splice(index, 1);
    } else if (bullet.y + bullet.height < 0) {
      machineGunBullets.splice(index, 1);
    }
  }
}

function updateLaserBeams() {
  for (const beam of laserBeams) {
    beam.frames -= 1;
  }
  laserBeams = laserBeams.filter((beam) => beam.frames > 0);
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

    if (boxesTouch(spike, paddle) || (doublePaddle && boxesTouch(spike, doublePaddle))) {
      paddleSlowed = true;
      paddleSlowStacks += 1;
      const slowMultiplier = level === 11 ? 0.9 : 0.75;
      paddle.speed = PADDLE_SPEED * slowMultiplier ** paddleSlowStacks;
      paddleSlowUntil = performance.now() + PADDLE_SLOW_DURATION;
      paddleHitTexts.push({
        x: paddle.x + paddle.width / 2,
        y: paddle.y - 6,
        life: 60,
        maxLife: 60,
        slowPercent: level === 11 ? 10 : 25
      });
      fallingSpikes.splice(index, 1);
    } else if (spike.y > HEIGHT) {
      fallingSpikes.splice(index, 1);
    }
  }
}

function onBrickDestroyed(brick, suppressSpecialEffects = false) {
  GameAudio.play("brickBreak");
  GameState.blocksBroken += 1;
  brickCombo += 1;
  if (brickCombo > GameStats.highestCombo) {
    GameStats.highestCombo = brickCombo;
    updateStatsDisplay();
    persistShopProgress();
  }
  triggerShake(brickCombo === 1 ? 1.5 : 2.5);
  if (brickCombo > 1) {
    triggerShake(Math.min(12, 1.5 + (brickCombo - 2) * 1.5));
  }
  if (brickCombo > 1) {
    GameAudio.play("combo", brickCombo);
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
  if (
    brick.special === "multiball" ||
    brick.special === "pentaball" ||
    brick.special === "snipe"
  ) {
    const powerupWidth = brick.special === "snipe" ? 34 : 20;
    fallingPowerups.push({
      type: brick.special,
      x: brick.x + brick.width / 2 - powerupWidth / 2,
      y: brick.y + brick.height / 2 - 10,
      width: powerupWidth,
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
  } else if (brick.special === "teleporter" && currentGameMode === "impossibleSquared") {
    teleportBricksBroken += 1;
  }

  if (!suppressSpecialEffects) {
    if (brick.special === "explosive") {
      explodeBricksAround(brick);
    } else if (brick.special === "laser") {
      fireLaserBrick(brick);
    }
  }
}

function fireLaserBrick(sourceBrick) {
  const centerX = sourceBrick.x + sourceBrick.width / 2;
  const centerY = sourceBrick.y + sourceBrick.height / 2;
  laserBeams.push(
    { x1: centerX, y1: centerY, x2: centerX, y2: 0, frames: 10 },
    { x1: centerX, y1: centerY, x2: centerX, y2: HEIGHT, frames: 10 },
    { x1: centerX, y1: centerY, x2: 0, y2: centerY, frames: 10 },
    { x1: centerX, y1: centerY, x2: WIDTH, y2: centerY, frames: 10 }
  );
  const targets = bricks.filter((brick) => (
    brick.gridRow === sourceBrick.gridRow ||
    brick.gridColumn === sourceBrick.gridColumn
  ));
  for (const target of targets) {
    destroyBrick(target, false, true);
  }
}

function breakBricksBelow(sourceBrick) {
  const targets = bricks.filter((brick) => (
    brick.gridColumn === sourceBrick.gridColumn &&
    brick.gridRow > sourceBrick.gridRow
  ));
  for (const target of targets) {
    destroyBrick(target, false, true);
  }
}

function tryTeleportBrick(brick) {
  if (currentGameMode === "impossibleSquared") {
    if (teleportBricksBroken * 2 >= teleportBricksAtStart || Math.random() >= 2 / 3) {
      return false;
    }
  } else if (Math.random() >= 0.5) {
    return false;
  }
  const rows = brick.gridRowCount;
  const occupiedSlots = new Set(bricks.map((candidate) => `${candidate.gridRow}:${candidate.gridColumn}`));
  const openSlots = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < BRICK_COLUMNS; column++) {
      if (!occupiedSlots.has(`${row}:${column}`)) {
        openSlots.push({ row, column });
      }
    }
  }
  if (openSlots.length === 0) {
    return false;
  }

  const slot = openSlots[Math.floor(Math.random() * openSlots.length)];
  const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
  brick.x = (WIDTH - totalWidth) / 2 + slot.column * (BRICK_WIDTH + BRICK_GAP);
  brick.startX = brick.x;
  brick.y = BRICKS_TOP + slot.row * (BRICK_HEIGHT + BRICK_GAP);
  brick.targetY = brick.y;
  brick.gridRow = slot.row;
  brick.gridColumn = slot.column;
  return true;
}

function explodeBricksAround(sourceBrick) {
  GameAudio.play("explosion");
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

function updatePaddleResize() {
  const widthChange = targetPaddleWidth - paddle.width;
  const nextWidth = Math.abs(widthChange) < 0.1
    ? targetPaddleWidth
    : paddle.width + widthChange * PADDLE_RESIZE_RATE;
  const centerX = paddle.x + paddle.width / 2;
  paddle.width = nextWidth;
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, centerX - paddle.width / 2));
  syncDoublePaddle();
}

function syncDoublePaddle() {
  if (!doublePaddle) {
    return;
  }
  doublePaddle.x = paddle.x + (paddle.width - doublePaddle.width) / 2;
  doublePaddle.y = paddle.y + paddle.height + DOUBLE_PADDLE_GAP;
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
  syncDoublePaddle();

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
  if (ball.speedBrickBoostUntil && performance.now() >= ball.speedBrickBoostUntil) {
    const speed = Math.hypot(ball.vx, ball.vy);
    const baseSpeed = ball.speedBrickBaseSpeed || BALL_SPEED;
    if (speed > 0) {
      ball.vx *= baseSpeed / speed;
      ball.vy *= baseSpeed / speed;
    }
    ball.speedBrickBoostUntil = 0;
    ball.speedBrickBaseSpeed = 0;
    ball.piercingDownUntilPaddle = false;
  }
  if (ballLaunched) {
    applyMagnetToBall(ball);
    ball.vy = ball.vy + BALL_GRAVITY;
    ball.x = ball.x + ball.vx;
    ball.y = ball.y + ball.vy;
  } else {
    ball.x = paddle.x + paddle.width / 2 - ball.width / 2;
    ball.y = paddle.y - ball.height;
  }
}

function applyMagnetToBall(ball) {
  if (!activeRunPowerups.magnet) {
    return;
  }
  const ballCenterX = ball.x + ball.width / 2;
  const ballCenterY = ball.y + ball.height / 2;
  if (ballCenterY <= HEIGHT / 2) {
    return;
  }
  const targets = doublePaddle ? [paddle, doublePaddle] : [paddle];
  const target = targets.reduce((nearest, candidate) => (
    Math.abs(candidate.x + candidate.width / 2 - ballCenterX) <
      Math.abs(nearest.x + nearest.width / 2 - ballCenterX)
      ? candidate
      : nearest
  ));
  const dx = target.x + target.width / 2 - ballCenterX;
  const dy = target.y - ballCenterY;
  if (ball.vy <= 0 || dy <= 0 || Math.abs(dx) > MAGNET_RANGE || dx === 0) {
    return;
  }

  const speed = Math.hypot(ball.vx, ball.vy) || BALL_SPEED;
  const pullStrength = Math.min(1, (ballCenterY - HEIGHT / 2) / (target.y - HEIGHT / 2));
  ball.vx += Math.sign(dx) * speed * MAGNET_STRENGTH * pullStrength;
  const pulledSpeed = Math.hypot(ball.vx, ball.vy);
  if (pulledSpeed > 0) {
    ball.vx *= speed / pulledSpeed;
    ball.vy *= speed / pulledSpeed;
  }
}

function updateBallTrail(ball, moving = ballLaunched) {
  const centerX = ball.x + ball.width / 2;
  const centerY = ball.y + ball.height / 2;
  if (!moving) {
    ball.trail = [];
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
  if (shakeFrames > 0 && shakeStrength > 0 && !deathScreen && !levelComplete) {
    const progress = (16 - shakeFrames) / 16;
    const fade = Math.sin(progress * Math.PI);
    const phase = progress * Math.PI * 4;
    ctx.translate(
      Math.sin(phase) * shakeStrength * fade,
      Math.sin(phase + Math.PI / 2) * shakeStrength * fade
    );
  }

  drawPaddleTrail();
  if (doublePaddle) {
    ctx.fillStyle = "#46b5dc";
    ctx.fillRect(doublePaddle.x, doublePaddle.y, doublePaddle.width, doublePaddle.height);
  }
  ctx.fillStyle = GameStats.rainbowUnlocked
    ? `hsl(${(performance.now() / 3) % 360}, 100%, 60%)`
    : paddleSlowed ? "#ef4545" : "white";
  if (doublePaddle) {
    ctx.shadowColor = "#8beaff";
    ctx.shadowBlur = 12 + Math.sin(performance.now() / 100) * 4;
  }
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.shadowBlur = 0;
  if (paddleHitFlashFrames > 0) {
    const progress = 1 - paddleHitFlashFrames / 8;
    const radius = 8 + progress * 24;
    const centerY = paddle.y + paddle.height / 2;
    const glow = ctx.createRadialGradient(paddleHitFlashX, centerY, 0, paddleHitFlashX, centerY, radius);
    glow.addColorStop(0, `rgba(255, 235, 59, ${0.8 * (1 - progress)})`);
    glow.addColorStop(0.45, `rgba(255, 235, 59, ${0.4 * (1 - progress)})`);
    glow.addColorStop(1, "rgba(255, 235, 59, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(paddleHitFlashX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const ball of balls) {
    drawBallTrail(ball);
    const squishProgress = (ball.squish || 0) / BALL_SQUISH_FRAMES;
    const squish = squishProgress * squishProgress * (3 - 2 * squishProgress);
    ctx.fillStyle = GameStats.rainbowUnlocked
      ? `hsl(${(performance.now() / 3 + ball.x) % 360}, 100%, 60%)`
      : paddleSlowed ? "#ef4545" : "white";
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

  drawBricks();  // bricks.js
  drawExplosions();
  drawSnipeBeams();
  drawLaserBeams();
  drawMachineGunBullets();
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
  ctx.fillStyle = GameStats.rainbowUnlocked
    ? `hsl(${(performance.now() / 3) % 360}, 100%, 60%)`
    : paddleSlowed ? "#ff7777" : "#b8e9ff";
  for (const point of paddleTrail) {
    ctx.globalAlpha = point.life / PADDLE_TRAIL_LIFE * 0.3;
    ctx.fillRect(point.x, paddle.y, paddle.width, paddle.height);
  }
  ctx.restore();
}
if (activeRunPowerups.machineGun && ballLaunched && !machineGunUsed && !levelComplete && !deathScreen) {
  ctx.save();
  ctx.fillStyle = "#fff2a1";
  ctx.font = "14px 'Fredoka One', cursive";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("PRESS F TO FIRE", WIDTH / 2, paddle.y - 5);
  ctx.restore();
} else if (machineGunUntil > performance.now()) {
  ctx.save();
  ctx.fillStyle = "#fff2a1";
  ctx.font = "14px 'Fredoka One', cursive";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(`MACHINE GUN · ${((machineGunUntil - performance.now()) / 1000).toFixed(1)}s`, WIDTH / 2, paddle.y - 5);
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
  const blocksLabel = `Blocks broken: ${GameState.blocksBroken}`;
  ctx.fillText(blocksLabel, 16, 14);

  const difficulty = level <= 2 ? "Easy"
    : level <= 6 ? "Medium"
      : level <= 10 ? "Hard"
        : level === 11 ? "Impossible" : "Impossible²";
  const levelLabel = `Level: ${level}/${level === 11 ? 11 : level === 12 ? 12 : 10} (${difficulty})`;
  const ammoLabel = `Ammo: ${snipeAmmo}`;
  ctx.font = "18px 'Fredoka One', cursive";
  const levelWidth = ctx.measureText(levelLabel).width;
  ctx.font = "11px 'Fredoka One', cursive";
  const ammoWidth = snipeAmmo > 0 ? ctx.measureText(ammoLabel).width : 0;
  const ammoBox = {
    x: WIDTH - Math.max(levelWidth, ammoWidth) - 24,
    y: 6,
    width: Math.max(levelWidth, ammoWidth) + 16,
    height: snipeAmmo > 0 ? 38 : 24
  };
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(ammoBox.x, ammoBox.y, ammoBox.width, ammoBox.height);
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  ctx.strokeRect(ammoBox.x, ammoBox.y, ammoBox.width, ammoBox.height);
  ctx.fillStyle = "white";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.font = "18px 'Fredoka One', cursive";
  ctx.fillText(levelLabel, ammoBox.x + ammoBox.width - 8, ammoBox.y + 2);
  if (snipeAmmo > 0) {
    ctx.font = "11px 'Fredoka One', cursive";
    ctx.fillText(ammoLabel, ammoBox.x + ammoBox.width - 8, ammoBox.y + 25);
  }

  const now = performance.now();
  if (gameStarted && activeRunPowerups.timeMachine) {
    const timeMachineLabel = now < timeMachineSlowUntil
      ? `TIME SLOWED · ${Math.ceil((timeMachineSlowUntil - now) / 1000)}s`
      : "PRESS P TO SLOW TIME";
    ctx.save();
    ctx.fillStyle = now < timeMachineSlowUntil ? POWERUP_STYLES.timeMachine.color : "white";
    ctx.font = "14px 'Fredoka One', cursive";
    ctx.textBaseline = "top";
    const timeMachineLabelWidth = ctx.measureText(timeMachineLabel).width;
    ctx.font = "18px 'Fredoka One', cursive";
    const leftEdge = 16 + ctx.measureText(blocksLabel).width + 12;
    const rightEdge = ammoBox.x - 12;
    const availableWidth = Math.max(0, rightEdge - leftEdge);
    ctx.font = availableWidth >= timeMachineLabelWidth ? "14px 'Fredoka One', cursive" : "11px 'Fredoka One', cursive";
    ctx.textAlign = "center";
    ctx.fillText(timeMachineLabel, (leftEdge + rightEdge) / 2, 14, availableWidth);
    ctx.restore();
  }

  if (snipeAmmo > 0) {
    const glow = (Math.sin(performance.now() / 250) + 1) / 2;
    ctx.save();
    ctx.font = "15px 'Fredoka One', cursive";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = "white";
    ctx.shadowBlur = 3 + glow * 14;
    ctx.fillText("SPACE TO FIRE", WIDTH / 2, paddle.y - 5);
    ctx.restore();
  }

  ctx.font = "18px 'Fredoka One', cursive";
  ctx.textBaseline = "top";
  const heartWidth = 22;
  const heartHeight = 20;
  for (let index = 0; index < GameState.lives; index++) {
    if (fallingHearts.some((heart) => heart.reverse && heart.targetIndex === index)) {
      continue;
    }
    const position = getLifeHeartPosition(index);
    drawHeart(position.x, position.y, heartWidth, heartHeight);
  }

  for (const heart of fallingHearts) {
    ctx.save();
    ctx.translate(heart.x + heartWidth / 2, heart.y + heartHeight / 2);
    ctx.rotate(heart.rotation);
    ctx.globalAlpha = Math.max(0, heart.reverse ? heart.age / 90 : 1 - heart.age / 90);
    ctx.shadowColor = "#ff2c55";
    ctx.shadowBlur = 12;
    drawHeart(-heartWidth / 2, -heartHeight / 2, heartWidth, heartHeight, false);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawHeart(x, y, width, height, outline = true) {
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y + height);
  ctx.bezierCurveTo(x + width * 0.32, y + height * 0.82, x, y + height * 0.56, x, y + height * 0.31);
  ctx.bezierCurveTo(x, y + height * 0.02, x + width * 0.38, y - height * 0.06, x + width / 2, y + height * 0.22);
  ctx.bezierCurveTo(x + width * 0.62, y - height * 0.06, x + width, y + height * 0.02, x + width, y + height * 0.31);
  ctx.bezierCurveTo(x + width, y + height * 0.56, x + width * 0.68, y + height * 0.82, x + width / 2, y + height);
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawFallingPowerups() {
  for (const powerup of fallingPowerups) {
    const centerX = powerup.x + powerup.width / 2;
    const centerY = powerup.y + powerup.height / 2;
    ctx.save();
    ctx.shadowColor = POWERUP_STYLES[powerup.type].color;
    ctx.shadowBlur = 12;
    if (powerup.type === "multiball") {
      ctx.fillStyle = "#35d06f";
      ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
      drawMultiballIcon(ctx, centerX, centerY, 3, "#176b3a");
    } else if (powerup.type === "pentaball") {
      ctx.fillStyle = "#25c6b7";
      ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
      ctx.fillStyle = "#11665f";
      ctx.font = "12px 'Fredoka One', cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("10", centerX, centerY);
    } else if (powerup.type === "paddle") {
      ctx.fillStyle = "#a66bff";
      ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
      drawPaddleArrowIcon(ctx, centerX, centerY, powerup.width * 0.84, powerup.height * 0.78, "white");
    } else if (powerup.type === "snipe") {
      ctx.fillStyle = "#46b5dc";
      ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
      ctx.fillStyle = "white";
      ctx.font = "9px 'Fredoka One', cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("AMMO", centerX, centerY);
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
    ctx.restore();
  }
}

function drawMultiballIcon(drawContext, centerX, centerY, radius, color) {
  drawContext.save();
  drawContext.fillStyle = color;
  for (const [offsetX, offsetY] of [
    [0, -radius],
    [-radius, radius * 0.75],
    [radius, radius * 0.75]
  ]) {
    drawContext.beginPath();
    drawContext.arc(centerX + offsetX, centerY + offsetY, radius * 0.65, 0, Math.PI * 2);
    drawContext.fill();
  }
  drawContext.restore();
}

function drawTimeMachineSpiral(drawContext, centerX, centerY, radius, color) {
  drawContext.save();
  drawContext.strokeStyle = color;
  drawContext.lineWidth = Math.max(1.25, radius * 0.22);
  drawContext.lineCap = "round";
  drawContext.beginPath();
  for (let point = 0; point <= 48; point++) {
    const progress = point / 48;
    const angle = progress * Math.PI * 4;
    const pointRadius = progress * radius;
    const x = centerX + Math.cos(angle) * pointRadius;
    const y = centerY + Math.sin(angle) * pointRadius;
    if (point === 0) {
      drawContext.moveTo(x, y);
    } else {
      drawContext.lineTo(x, y);
    }
  }
  drawContext.stroke();
  drawContext.restore();
}

function drawPaddleArrowIcon(drawContext, centerX, centerY, width, height, color) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const shaftHalfWidth = width * 0.24;
  const shaftHalfHeight = height * 0.2;

  drawContext.save();
  drawContext.fillStyle = color;
  drawContext.beginPath();
  drawContext.moveTo(centerX - halfWidth, centerY);
  drawContext.lineTo(centerX - shaftHalfWidth, centerY - halfHeight);
  drawContext.lineTo(centerX - shaftHalfWidth, centerY - shaftHalfHeight);
  drawContext.lineTo(centerX + shaftHalfWidth, centerY - shaftHalfHeight);
  drawContext.lineTo(centerX + shaftHalfWidth, centerY - halfHeight);
  drawContext.lineTo(centerX + halfWidth, centerY);
  drawContext.lineTo(centerX + shaftHalfWidth, centerY + halfHeight);
  drawContext.lineTo(centerX + shaftHalfWidth, centerY + shaftHalfHeight);
  drawContext.lineTo(centerX - shaftHalfWidth, centerY + shaftHalfHeight);
  drawContext.lineTo(centerX - shaftHalfWidth, centerY + halfHeight);
  drawContext.closePath();
  drawContext.fill();
  drawContext.restore();
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

function drawLaserBeams() {
  ctx.save();
  ctx.strokeStyle = "#ffb5d1";
  ctx.shadowColor = "#ff3975";
  ctx.shadowBlur = 12;
  for (const beam of laserBeams) {
    ctx.globalAlpha = beam.frames / 10;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(beam.x1, beam.y1);
    ctx.lineTo(beam.x2, beam.y2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMachineGunBullets() {
  for (const bullet of machineGunBullets) {
    ctx.save();
    ctx.fillStyle = "#8beaff";
    for (let index = bullet.trail.length - 1; index >= 0; index--) {
      const point = bullet.trail[index];
      ctx.globalAlpha = 0.3 * (1 - index / bullet.trail.length);
      ctx.beginPath();
      ctx.arc(point.x, point.y, bullet.width / 2 * (1 - index / bullet.trail.length), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowColor = "#8beaff";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFallingSpikes() {
  for (const spike of fallingSpikes) {
    ctx.save();
    ctx.fillStyle = "#ef4545";
    ctx.shadowColor = "#ef4545";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(spike.x, spike.y);
    ctx.lineTo(spike.x + spike.width, spike.y);
    ctx.lineTo(spike.x + spike.width / 2, spike.y + spike.height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
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
    ctx.fillText(`-${text.slowPercent ?? (level === 11 ? 10 : 25)}% speed`, text.x, text.y);
  }
  ctx.restore();
}

function drawDeathScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "68px 'Fredoka One', cursive";
  ctx.fillText("You died!", WIDTH / 2, HEIGHT / 2 - 42);
  ctx.font = "20px 'Fredoka One', cursive";
  ctx.fillText(`Blocks broken: ${GameState.blocksBroken}`, WIDTH / 2, HEIGHT / 2 + 2);
  ctx.font = "16px 'Fredoka One', cursive";
  ctx.fillText(GameState.lives > 0 ? "Press Enter to continue" : "Press Enter to restart", WIDTH / 2, HEIGHT / 2 + 42);
}

function drawLevelComplete() {
  ctx.fillStyle = `rgba(0, 0, 0, ${0.75 * levelCompleteFadeFrame / LEVEL_COMPLETE_FADE_FRAMES})`;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawParticles() {
  for (const particle of particles) {
    ctx.globalAlpha = particle.opaque
      ? Math.min(1, particle.life / (particle.fadeFrames ?? particle.maxLife))
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
    const savedStats = saved.stats && typeof saved.stats === "object" ? saved.stats : {};
    const credits = Number.isSafeInteger(saved.credits) && saved.credits >= 0 ? saved.credits : 500;
    const stats = createDefaultStats(credits);

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
    let equippedBrickCount = 0;
    for (const itemKey of BRICK_ITEM_ORDER) {
      if (itemInventoryState[itemKey].equipped && ++equippedBrickCount > 3) {
        itemInventoryState[itemKey].equipped = false;
      }
    }
    if (itemInventoryState.multiball.count === 0) {
      itemInventoryState.multiball.count = 1;
      itemInventoryState.multiball.equipped = true;
    }
    if (itemInventoryState.paddle.count === 0) {
      itemInventoryState.paddle.count = 1;
      itemInventoryState.paddle.equipped = true;
    }
    for (const key of ["highestCombo", "mostMoney", "totalMoney", "chestsOpened", "highestLevel"]) {
      if (Number.isSafeInteger(savedStats[key]) && savedStats[key] >= (key === "highestLevel" ? 1 : 0)) {
        stats[key] = savedStats[key];
      }
    }
    stats.normalGameCompleted = savedStats.normalGameCompleted === true;
    stats.rainbowUnlocked = savedStats.rainbowUnlocked === true;
    stats.mostMoney = Math.max(stats.mostMoney, credits);

    return {
      credits,
      itemInventory: itemInventoryState,
      stats,
      adminUnlocked: saved.adminUnlocked === true
    };
  } catch (error) {
    console.error("Could not load saved shop progress.", error);
    shopStorageError = true;
    return {
      credits: 500,
      itemInventory: createDefaultItemInventory(),
      stats: createDefaultStats(500),
      adminUnlocked: false
    };
  }
}

function persistShopProgress() {
  try {
    window.localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify({
      credits: GameState.credits,
      itemInventory,
      stats: GameStats,
      adminUnlocked
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
  bricksShopTab.classList.toggle("is-active", activeShopTab === "bricks");
  bricksShopTab.setAttribute("aria-selected", String(activeShopTab === "bricks"));
  powerupsShopTab.classList.toggle("is-active", activeShopTab === "powerups");
  powerupsShopTab.setAttribute("aria-selected", String(activeShopTab === "powerups"));

  shopList.innerHTML = getShopItemOrder().map((itemKey) => {
    const item = ITEM_DEFS[itemKey];
    const itemState = itemInventory[itemKey];
    const owned = itemState.count > 0;
    const equipped = itemState.equipped;
    const previewText = owned ? item.previewText : "?";
    const previewContent = owned && itemKey === "timeMachine" ? TIME_MACHINE_ICON_MARKUP : previewText;
    const rarityLabel = `${getChestDropChance(itemKey)}%`;
    const nameLabel = owned ? item.name : "???";
    const descriptionText = owned ? item.description : "???";
    const actionLabel = owned ? (equipped ? "Unequip" : "Equip") : "Not found";

    return `
      <div class="shop-item ${owned ? "" : "mystery-item"}">
        <h3>${nameLabel}</h3>
        <div class="shop-item-content">
          <span class="${owned ? item.previewClass : "mystery-preview"}" aria-label="${owned ? item.name : "Mystery item"} preview">${previewContent}</span>
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
}

function updateStatsDisplay() {
  statHighestCombo.textContent = GameStats.highestCombo.toLocaleString();
  statMostMoney.textContent = formatCredits(GameStats.mostMoney);
  statTotalMoney.textContent = formatCredits(GameStats.totalMoney);
  statChestsOpened.textContent = GameStats.chestsOpened.toLocaleString();
  statHighestLevel.textContent = GameStats.highestLevel.toLocaleString();
  statImpossibleSquaredWins.textContent = impossibleSquaredWins.toLocaleString();
}

function addCredits(amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || GameState.credits > Number.MAX_SAFE_INTEGER - amount) {
    return false;
  }

  GameState.credits += amount;
  GameStats.totalMoney = Math.min(Number.MAX_SAFE_INTEGER, GameStats.totalMoney + amount);
  GameStats.mostMoney = Math.max(GameStats.mostMoney, GameState.credits);
  updateStatsDisplay();
  return true;
}

function formatCredits(credits) {
  const units = [
    { value: 1_000_000_000_000_000, suffix: "Q" },
    { value: 1_000_000_000_000, suffix: "t" },
    { value: 1_000_000_000, suffix: "b" },
    { value: 1_000_000, suffix: "m" },
    { value: 1_000, suffix: "k" }
  ];
  let unitIndex = units.findIndex(({ value }) => credits >= value);
  if (unitIndex === -1) {
    return String(credits);
  }
  let unit = units[unitIndex];
  let roundedValue = Math.round(credits / unit.value * 10) / 10;
  if (roundedValue >= 1_000 && unitIndex > 0) {
    unit = units[unitIndex - 1];
    roundedValue = Math.round(credits / unit.value * 10) / 10;
  }
  return `${roundedValue.toFixed(1).replace(/\.0$/, "")}${unit.suffix}`;
}

function makeBricksForRound(roundLevel) {
  const roundBricks = makeBricks(roundLevel);
  equippedBrickOriginals = new Map();
  if (activeRunPowerups.snipe) {
    const sniperAmmoBrickCount = Math.floor(Math.random() * 2) + 1;
    addEquippedBricks(roundBricks, "snipe", sniperAmmoBrickCount);
  }
  const replaceExistingSpecials = roundLevel >= 11;
  if (itemInventory.multiball.equipped) {
    const multiballBrickCount = Math.floor(Math.random() * 4) + 1;
    addEquippedBricks(roundBricks, "multiball", multiballBrickCount, replaceExistingSpecials);
  }
  if (itemInventory.pentaball.equipped) {
    addEquippedBricks(roundBricks, "pentaball", 1, replaceExistingSpecials);
  }
  if (itemInventory.explosive.equipped) {
    const explosiveBrickCount = Math.floor(Math.random() * 2) + 1;
    addEquippedBricks(roundBricks, "explosive", explosiveBrickCount, replaceExistingSpecials);
  }
  if (itemInventory.laser.equipped) {
    addEquippedBricks(roundBricks, "laser", 1, replaceExistingSpecials);
  }
  if (itemInventory.debris.equipped) {
    addEquippedBricks(roundBricks, "debris", 1, replaceExistingSpecials);
  }
  return roundBricks;
}

function addEquippedBricks(roundBricks, special, count = 1, replaceSpecials = false) {
  const style = POWERUP_STYLES[special];
  const alreadyEquipped = new Set(
    [...equippedBrickOriginals.values()].flat().map((entry) => entry.brick)
  );
  const availableBricks = roundBricks.filter((brick) => (
    !alreadyEquipped.has(brick) && (replaceSpecials || !brick.special)
  ));
  const originals = equippedBrickOriginals.get(special) || [];
  const addCount = Math.min(count, availableBricks.length);

  for (let index = 0; index < addCount; index++) {
    const availableIndex = Math.floor(Math.random() * availableBricks.length);
    const [brick] = availableBricks.splice(availableIndex, 1);
    originals.push({
      brick,
      color: brick.color,
      darkerColor: brick.darkerColor,
      hitstillbroken: brick.hitstillbroken,
      special: brick.special
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

  for (const { brick, color, darkerColor, hitstillbroken, special: originalSpecial } of originals) {
    brick.special = originalSpecial;
    brick.color = color;
    brick.darkerColor = darkerColor;
    brick.hitstillbroken = hitstillbroken;
  }
  equippedBrickOriginals.delete(special);
}

function awardRoundCredits() {
  const earned = 100 + Math.max(0, GameState.lives - 3) * 30;
  addCredits(earned);
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
  GameStats.chestsOpened = Math.min(Number.MAX_SAFE_INTEGER, GameStats.chestsOpened + 1);
  const category = activeShopTab;
  const itemKey = rollChestItem(category);
  const item = ITEM_DEFS[itemKey];
  const dropChance = getChestDropChance(itemKey, category);

  if (itemInventory[itemKey].count > 0) {
    const duplicateValue = Math.round(item.sellPrice / 10);
    addCredits(duplicateValue);
    revealChestItem(item, dropChance, duplicateValue, itemKey, category);
    updateShopDisplay();
    persistShopProgress();
    return;
  }

  itemInventory[itemKey].count = 1;
  itemInventory[itemKey].equipped = false;
  revealChestItem(item, dropChance, null, itemKey, category);
  updateShopDisplay();
  persistShopProgress();
}

function createChestTrack(winningItemKey, category) {
  const track = [];
  const weights = CHEST_DROP_WEIGHTS[category];

  for (const itemKey of getShopItemOrder(category)) {
    for (let count = 0; count < weights[itemKey]; count++) {
      track.push(itemKey);
    }
  }

  for (let index = track.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [track[index], track[swapIndex]] = [track[swapIndex], track[index]];
  }

  const matchingIndexes = track
    .map((itemKey, index) => itemKey === winningItemKey ? index : -1)
    .filter((index) => index >= 0);
  const originalWinningIndex = matchingIndexes[Math.floor(Math.random() * matchingIndexes.length)];
  const winningIndex = Math.floor(track.length * 0.4) + Math.floor(Math.random() * track.length * 0.25);
  const rotation = (originalWinningIndex - winningIndex + track.length) % track.length;
  const rotatedTrack = track.slice(rotation).concat(track.slice(0, rotation));

  return {
    items: rotatedTrack,
    winningIndex
  };
}

function drawChestRevealCanvas(reveal, offset) {
  const revealCtx = chestRevealCanvas.getContext("2d");
  const width = chestRevealCanvas.width;
  const height = chestRevealCanvas.height;
  revealCtx.clearRect(0, 0, width, height);
  revealCtx.fillStyle = "rgba(14, 14, 18, 0.98)";
  revealCtx.fillRect(0, 0, width, height);

  revealCtx.fillStyle = "#f4f4f4";
  revealCtx.font = "18px 'Fredoka One', cursive";
  revealCtx.textAlign = "center";
  revealCtx.fillText("OPENING CHEST", width / 2, 25);

  const cardWidth = 82;
  const cardHeight = 108;
  const cardGap = 12;
  const cardStep = cardWidth + cardGap;
  const trackStartX = 25;
  const cardY = 50;
  const markerX = width / 2;
  const viewportX = 18;
  const viewportY = 42;
  const viewportWidth = width - viewportX * 2;
  const viewportHeight = 124;

  revealCtx.fillStyle = "#09090d";
  revealCtx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);
  revealCtx.save();
  revealCtx.beginPath();
  revealCtx.rect(viewportX, viewportY, viewportWidth, viewportHeight);
  revealCtx.clip();

  const firstIndex = Math.max(0, Math.floor((offset - trackStartX) / cardStep) - 1);
  const lastIndex = Math.min(
    reveal.items.length - 1,
    Math.ceil((offset + width - trackStartX) / cardStep) + 1
  );

  for (let index = firstIndex; index <= lastIndex; index++) {
    const itemKey = reveal.items[index];
    const item = ITEM_DEFS[itemKey];
    const cardX = trackStartX + index * cardStep - offset;
    const selected = reveal.complete && index === reveal.winningIndex;
    const style = POWERUP_STYLES[itemKey];

    revealCtx.fillStyle = "#191920";
    revealCtx.fillRect(cardX, cardY, cardWidth, cardHeight);
    revealCtx.strokeStyle = selected ? "#ffd34e" : style.color;
    revealCtx.lineWidth = selected ? 3 : 1.5;
    revealCtx.strokeRect(cardX + 1, cardY + 1, cardWidth - 2, cardHeight - 2);

    drawChestBrickIcon(revealCtx, itemKey, cardX + 13, cardY + 15, cardWidth - 26, 30);

    revealCtx.fillStyle = "#fff";
    revealCtx.font = "10px 'Fredoka One', cursive";
    revealCtx.textBaseline = "middle";
    revealCtx.fillText(item.name, cardX + cardWidth / 2, cardY + 62, cardWidth - 6);
    revealCtx.fillStyle = "#c8c8d0";
    revealCtx.font = "9px 'Fredoka One', cursive";
    revealCtx.fillText(`${getChestDropChance(itemKey, reveal.category)}% chance`, cardX + cardWidth / 2, cardY + 84);
  }
  revealCtx.restore();

  revealCtx.fillStyle = "#ffd34e";
  revealCtx.shadowColor = "#ffd34e";
  revealCtx.shadowBlur = 12;
  revealCtx.fillRect(markerX - 2, viewportY + 5, 4, viewportHeight - 10);
  revealCtx.beginPath();
  revealCtx.moveTo(markerX - 9, viewportY);
  revealCtx.lineTo(markerX + 9, viewportY);
  revealCtx.lineTo(markerX, viewportY + 12);
  revealCtx.closePath();
  revealCtx.fill();
  revealCtx.shadowBlur = 0;

  revealCtx.textBaseline = "alphabetic";
  if (reveal.complete) {
    revealCtx.fillStyle = reveal.duplicateValue !== null ? "#ffd36b" : "#b7f0c1";
    revealCtx.font = "15px 'Fredoka One', cursive";
    revealCtx.fillText(
      reveal.duplicateValue !== null
        ? `Duplicate sold for ${reveal.duplicateValue} credits`
        : "New item found!",
      width / 2,
      214
    );
    revealCtx.fillStyle = "#d7d7d7";
    revealCtx.font = "11px 'Fredoka One', cursive";
    revealCtx.fillText("Click to continue", width / 2, 243);
  }
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
    drawMultiballIcon(revealCtx, centerX, centerY, height * 0.4, style.darkerColor);
  } else if (itemKey === "pentaball") {
    revealCtx.font = "11px 'Fredoka One', cursive";
    revealCtx.textAlign = "center";
    revealCtx.textBaseline = "middle";
    revealCtx.fillText("PENTA", centerX, centerY);
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
  } else if (itemKey === "laser") {
    revealCtx.strokeStyle = style.darkerColor;
    revealCtx.lineWidth = 3;
    revealCtx.beginPath();
    revealCtx.moveTo(centerX - width * 0.3, centerY);
    revealCtx.lineTo(centerX + width * 0.3, centerY);
    revealCtx.moveTo(centerX, centerY - height * 0.3);
    revealCtx.lineTo(centerX, centerY + height * 0.3);
    revealCtx.stroke();
  } else if (itemKey === "debris") {
    revealCtx.fillRect(centerX - 16, centerY - 7, 9, 7);
    revealCtx.fillRect(centerX - 3, centerY - 1, 10, 8);
    revealCtx.fillRect(centerX + 10, centerY - 9, 7, 7);
  } else if (itemKey === "magnet") {
    revealCtx.lineWidth = 4;
    revealCtx.beginPath();
    revealCtx.arc(centerX, centerY, height * 0.32, -Math.PI * 0.8, Math.PI * 0.8);
    revealCtx.stroke();
  } else if (itemKey === "machineGun") {
    revealCtx.fillRect(centerX - 15, centerY - 2, 30, 4);
    for (const offset of [-12, 0, 12]) {
      revealCtx.beginPath();
      revealCtx.arc(centerX + offset, centerY + 9, 3, 0, Math.PI * 2);
      revealCtx.fill();
    }
  } else if (itemKey === "doublePaddle") {
    revealCtx.fillRect(centerX - 18, centerY - 5, 14, 5);
    revealCtx.fillRect(centerX + 4, centerY - 5, 14, 5);
  } else if (itemKey === "paddle") {
    drawPaddleArrowIcon(revealCtx, centerX, centerY, width * 0.84, height * 0.8, style.darkerColor);
  } else if (itemKey === "timeMachine") {
    drawTimeMachineSpiral(revealCtx, centerX, centerY, height * 0.36, style.darkerColor);
  } else if (itemKey === "snipe") {
    revealCtx.font = "13px 'Fredoka One', cursive";
    revealCtx.textAlign = "center";
    revealCtx.textBaseline = "middle";
    revealCtx.fillText("AMMO", centerX, centerY);
  }
}

function closeChestReveal() {
  GameAudio.stopChestRoll();
  if (chestRevealAnimationFrame) {
    cancelAnimationFrame(chestRevealAnimationFrame);
    chestRevealAnimationFrame = 0;
  }
  activeChestReveal = null;
  chestReveal.classList.remove("is-spinning");
  chestReveal.hidden = true;
  chestReveal.onclick = null;
}

function revealChestItem(item, dropChance, duplicateValue = null, itemKey, category = activeShopTab) {
  const track = createChestTrack(itemKey, category);
  activeChestReveal = {
    item,
    itemKey,
    category,
    dropChance,
    duplicateValue,
    items: track.items,
    winningIndex: track.winningIndex,
    startedAt: null,
    complete: false
  };
  chestReveal.hidden = false;
  chestReveal.classList.add("is-spinning");
  chestReveal.onclick = null;
  chestRevealCanvas.setAttribute("aria-label", "Chest reel spinning");
  GameAudio.startChestRoll();
  chestRevealAnimationFrame = requestAnimationFrame(animateChestReveal);
}

function animateChestReveal(timestamp) {
  const reveal = activeChestReveal;
  if (!reveal) {
    return;
  }

  const cardWidth = 82;
  const cardStep = cardWidth + 12;
  const trackStartX = 25;
  const markerX = chestRevealCanvas.width / 2;
  const winningCardCenter = trackStartX + reveal.winningIndex * cardStep + cardWidth / 2;
  const targetOffset = winningCardCenter - markerX;

  if (reveal.startedAt === null) {
    reveal.startedAt = timestamp;
  }

  const progress = Math.min((timestamp - reveal.startedAt) / CHEST_ROLL_DURATION, 1);
  const easedProgress = 1 - Math.pow(1 - progress, 4);
  const offset = targetOffset * easedProgress;
  reveal.complete = progress === 1;
  drawChestRevealCanvas(reveal, offset);

  if (reveal.complete) {
    chestRevealAnimationFrame = 0;
    GameAudio.stopChestRoll();
    GameAudio.play("chestReward");
    chestReveal.classList.remove("is-spinning");
    chestReveal.onclick = closeChestReveal;
    chestRevealCanvas.setAttribute(
      "aria-label",
      `Won ${reveal.item.name}. ${reveal.dropChance} percent drop chance. Click to continue.`
    );
    return;
  }

  chestRevealAnimationFrame = requestAnimationFrame(animateChestReveal);
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

function openStats() {
  statsOpen = true;
  statsMenu.hidden = false;
  updateStatsDisplay();
  closeStatsButton.focus();
}

function resetCredits() {
  if (!window.confirm("Are you sure? This will reset all stats, credits, items, and admin access.")) {
    return;
  }

  GameState.credits = 0;
  itemInventory = createDefaultItemInventory();
  Object.assign(GameStats, createDefaultStats());
  adminUnlocked = false;
  updateAdminVisibility();
  updateShopDisplay();
  updateStatsDisplay();
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

function closeStats() {
  statsOpen = false;
  statsMenu.hidden = true;
  if (gameStarted) {
    canvas.focus();
  } else {
    openStatsButton.focus();
  }
}

function openMainMenu() {
  resetGame();
  shopOpen = false;
  settingsOpen = false;
  statsOpen = false;
  shopMenu.hidden = true;
  settingsMenu.hidden = true;
  statsMenu.hidden = true;
  guideMenu.hidden = true;
  modePowerupSelect.hidden = true;
  gameModeSelection.hidden = true;
  startMenu.classList.remove("is-selecting-mode");
  closeChestReveal();
  gameStarted = false;
  levelCodeBar.classList.remove("is-playing");
  startGameButton.disabled = false;
  startMenu.hidden = false;
  startMenu.classList.remove("is-starting");
  startMenu.classList.add("is-opening");
  gameBoard.classList.add("menu-dismissing");
  gameTitle.classList.remove("is-started");
  updateAdminVisibility();
  startGameButton.focus({ preventScroll: true });
}

function exitMenu() {
  if (shopOpen) {
    closeShop();
  } else if (settingsOpen) {
    closeSettings();
  } else if (statsOpen) {
    closeStats();
  }
}

function toggleItemEquipment(itemKey) {
  const itemState = itemInventory[itemKey];
  if (!itemState || itemState.count <= 0) {
    return;
  }

  const nextEquipped = !itemState.equipped;
  if (nextEquipped && BRICK_ITEM_ORDER.includes(itemKey)) {
    const equippedBrickCount = BRICK_ITEM_ORDER.filter((brickKey) => itemInventory[brickKey].equipped).length;
    if (equippedBrickCount >= 3) {
      equipmentNotice.textContent = "You can equip up to 3 bricks.";
      equipmentNotice.hidden = false;
      window.clearTimeout(equipmentNoticeTimeout);
      equipmentNoticeTimeout = window.setTimeout(() => {
        equipmentNotice.hidden = true;
        equipmentNoticeTimeout = null;
      }, 2500);
      return;
    }
  }
  if (SHOP_ITEM_ORDER.powerups.includes(itemKey)) {
    itemState.equipped = nextEquipped;
    updateShopDisplay();
    persistShopProgress();
    return;
  }
  itemState.equipped = nextEquipped;

  if (nextEquipped) {
    const count = itemKey === "multiball" ? Math.floor(Math.random() * 4) + 1 : 1;
    addEquippedBricks(bricks, itemKey, count);
  } else {
    removeEquippedBrick(itemKey);
  }

  updateShopDisplay();
  persistShopProgress();
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
  const frameWidth = menuCanvas.width * 0.84;
  const frameHeight = menuCanvas.height * 0.74;
  const frameX = (menuCanvas.width - frameWidth) / 2;
  const frameY = menuCanvas.height * 0.13;
  menuCtx.fillRect(frameX, frameY, frameWidth, frameHeight);
  menuCtx.strokeStyle = "white";
  menuCtx.lineWidth = 2;
  menuCtx.strokeRect(frameX, frameY, frameWidth, frameHeight);
}

// Wait until all three script files have loaded, then start.
window.addEventListener("load", start);
