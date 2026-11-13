// ============================================================
// bricks.js: where the bricks are, and how they are drawn
// ============================================================

const BRICK_COLUMNS = 8;
const BRICK_ROWS = 4;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 30;
const BRICK_GAP = 6;     // empty space between bricks
const BRICKS_TOP = 50;   // how far down the first row starts
const BRICK_CHECKER_COLUMNS = 12;
const BRICK_CHECKER_ROWS = 6;
const BRICK_HIT_FLASH_FRAMES = 6;
const BRICK_BREAK_DELAY_FRAMES = 5;
const POWERUP_STYLES = {
  multiball: { color: "#35d06f", darkerColor: "#176b3a" },
  pentaball: { color: "#25c6b7", darkerColor: "#11665f" },
  spike: { color: "#ef4545", darkerColor: "#842626" },
  snipe: { color: "#46b5dc", darkerColor: "#245d78" },
  explosive: { color: "#ffad33", darkerColor: "#a82f0d" },
  laser: { color: "#ff5f87", darkerColor: "#821f45" },
  debris: { color: "#b7834b", darkerColor: "#56381f" },
  paddle: { color: "#a66bff", darkerColor: "#57318c" },
  timeMachine: { color: "#bd68ed", darkerColor: "#5b2677" },
  magnet: { color: "#f04bce", darkerColor: "#701a62" },
  machineGun: { color: "#e5d04c", darkerColor: "#665719" },
  doublePaddle: { color: "#5bbaff", darkerColor: "#164c78" },
  speedBrick: { color: "#d74747", darkerColor: "#741d1d" },
  teleporter: { color: "#d066ff", darkerColor: "#572477" }
};

function stayStill() {}

function getLevelBrickLayout(level) {
  const rows = level === 1 ? 2 : level === 2 ? 3 : level >= 11 ? 7
    : level <= 3 ? BRICK_ROWS : level <= 6 ? BRICK_ROWS + 1
      : level <= 9 ? BRICK_ROWS + 2 : BRICK_ROWS + 3;
  const spikeRanges = {
    2: [1, 4],
    3: [2, 5],
    4: [2, 6],
    5: [2, 6],
    6: [3, 7],
    7: [4, 7],
    8: [5, 8],
    9: [5, 5],
    10: [10, 10]
  };
  const [minimumSpikes, maximumSpikes] = spikeRanges[level] || [0, 0];
  const spikeCount = level < 11
    ? minimumSpikes + Math.floor(Math.random() * (maximumSpikes - minimumSpikes + 1))
    : 0;
  const speedBrickCount = level === 11 ? 4 : level === 12 ? 28 : level >= 4 ? Math.ceil((level - 3) / 2) : 0;
  const teleporterCount = level === 11 ? 0 : level === 12 ? 28 : level >= 5 ? 1 : 0;
  return { rows, spikeCount, speedBrickCount, teleporterCount };
}

// Builds the list of bricks. Each brick is an object with an
// x, y, width, and height.
function makeBricks(level = 1) {
  const list = [];
  const specialIndexes = new Map();
  const layout = getLevelBrickLayout(level);
  const totalBricks = BRICK_COLUMNS * layout.rows;
  if (level === 11 || level === 12) {
    const shuffledIndexes = Array.from({ length: totalBricks }, (_, index) => index);
    for (let index = shuffledIndexes.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffledIndexes[index], shuffledIndexes[swapIndex]] = [shuffledIndexes[swapIndex], shuffledIndexes[index]];
    }
    if (level === 11) {
      for (const index of shuffledIndexes.slice(0, 26)) {
        specialIndexes.set(index, "spike");
      }
      for (const index of shuffledIndexes.slice(26, 30)) {
        specialIndexes.set(index, "speedBrick");
      }
    } else {
      for (const index of shuffledIndexes.slice(0, 28)) {
        specialIndexes.set(index, "speedBrick");
      }
      for (const index of shuffledIndexes.slice(28)) {
        specialIndexes.set(index, "teleporter");
      }
    }
  } else {
    while ([...specialIndexes.values()].filter((special) => special === "spike").length < layout.spikeCount) {
      const index = Math.floor(Math.random() * totalBricks);
      if (!specialIndexes.has(index)) {
        specialIndexes.set(index, "spike");
      }
    }
  }
  for (const [special, count] of [
    ["speedBrick", layout.speedBrickCount],
    ["teleporter", layout.teleporterCount]
  ]) {
    while ([...specialIndexes.values()].filter((value) => value === special).length < count) {
      const index = Math.floor(Math.random() * totalBricks);
      if (!specialIndexes.has(index)) {
        specialIndexes.set(index, special);
      }
    }
  }
  const twoHitIndexes = new Set();
  const twoHitCount = level === 11
    ? totalBricks - specialIndexes.size
    : level === 12 || level === 1 ? 0 : 8;
  while (twoHitIndexes.size < twoHitCount) {
    const index = Math.floor(Math.random() * totalBricks);
    if (!specialIndexes.has(index)) {
      twoHitIndexes.add(index);
    }
  }

  // Center the whole block of bricks on the screen.
  const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
  const left = (WIDTH - totalWidth) / 2;

  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < BRICK_COLUMNS; col++) {
      const hue = Math.floor(Math.random() * 360);
      const index = row * BRICK_COLUMNS + col;
      const special = specialIndexes.get(index) || null;
      const powerupStyle = special ? POWERUP_STYLES[special] : null;
      const needsTwoHits = !special && twoHitIndexes.has(index);
      const y = BRICKS_TOP + row * (BRICK_HEIGHT + BRICK_GAP);
      const x = left + col * (BRICK_WIDTH + BRICK_GAP);
      list.push({
        x,
        startX: x,
        move: stayStill,
        speed: 0,
        y,
        targetY: y,
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        gridRow: row,
        gridColumn: col,
        gridRowCount: layout.rows,
        hitstillbroken: needsTwoHits ? hitstillbroken : 1,
        color: powerupStyle ? powerupStyle.color : `hsl(${hue}, 75%, 55%)`,
        darkerColor: powerupStyle ? powerupStyle.darkerColor : needsTwoHits ? `hsl(${hue}, 75%, 25%)` : null,
        special
      });
    }
  }

  return list;
}

// Draws every brick in the list.
function drawBricks() {
  for (const brick of bricks) {
    if (brick.special) {
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    } else if (!brick.darkerColor) {
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    } else {
      const tileWidth = brick.width / BRICK_CHECKER_COLUMNS;
      const tileHeight = brick.height / BRICK_CHECKER_ROWS;
      for (let row = 0; row < BRICK_CHECKER_ROWS; row++) {
        for (let column = 0; column < BRICK_CHECKER_COLUMNS; column++) {
          const isDarkerTile = (row + column) % 2 === 1;
          if (!brick.special && brick.hitstillbroken === 1 && !isDarkerTile) {
            continue;
          }

          ctx.fillStyle = isDarkerTile ? brick.darkerColor : brick.color;
          ctx.fillRect(
            brick.x + column * tileWidth,
            brick.y + row * tileHeight,
            tileWidth,
            tileHeight
          );
        }
      }
    }

    if (brick.special) {
      const centerX = brick.x + brick.width / 2;
      const centerY = brick.y + brick.height / 2;
      ctx.fillStyle = brick.darkerColor;
      if (brick.special === "multiball") {
        drawMultiballIcon(ctx, centerX, centerY, 5);
      } else if (brick.special === "pentaball") {
        ctx.font = "11px 'Fredoka One', cursive";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("PENTA", centerX, centerY);
      } else if (brick.special === "spike") {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 9);
        ctx.lineTo(centerX + 7, centerY + 8);
        ctx.lineTo(centerX - 7, centerY + 8);
        ctx.closePath();
        ctx.fill();
      } else if (brick.special === "explosive") {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.beginPath();
        for (let point = 0; point < 12; point++) {
          const angle = point / 12 * Math.PI * 2 - Math.PI / 2;
          const radius = point % 2 === 0 ? 11 : 5;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (point === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#fff0a0";
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (brick.special === "paddle") {
        drawPaddleArrowIcon(ctx, centerX, centerY, 46, 24, brick.darkerColor);
      } else if (brick.special === "laser") {
        ctx.strokeStyle = brick.darkerColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - 18, centerY);
        ctx.lineTo(centerX + 18, centerY);
        ctx.moveTo(centerX, centerY - 9);
        ctx.lineTo(centerX, centerY + 9);
        ctx.stroke();
      } else if (brick.special === "debris") {
        ctx.fillRect(centerX - 17, centerY - 8, 8, 7);
        ctx.fillRect(centerX - 3, centerY - 2, 9, 8);
        ctx.fillRect(centerX + 10, centerY - 10, 7, 7);
      } else if (brick.special === "speedBrick") {
        ctx.font = "11px 'Fredoka One', cursive";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("SPEED", centerX, centerY);
      } else if (brick.special === "teleporter") {
        ctx.font = "14px 'Fredoka One', cursive";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("TP", centerX, centerY);
      } else {
        ctx.font = "12px 'Fredoka One', cursive";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("AMMO", centerX, centerY);
      }
    }

    if (brick.hitFlashFrames > 0) {
      ctx.save();
      ctx.fillStyle = "white";
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      ctx.restore();
    }
  }
}
