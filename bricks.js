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
const POWERUP_STYLES = {
  multiball: { color: "#35d06f", darkerColor: "#176b3a" },
  spike: { color: "#ef4545", darkerColor: "#842626" },
  snipe: { color: "#46b5dc", darkerColor: "#245d78" }
};

// Builds the list of bricks. Each brick is an object with an
// x, y, width, and height.
function makeBricks(level = 1) {
  const list = [];
  const specialIndexes = new Map();
  if (level >= 2) {
    const specialTypes = ["spike"];
    const specialCount = level === 2 ? 6 : 8;
    while (specialIndexes.size < specialCount) {
      const index = Math.floor(Math.random() * BRICK_COLUMNS * BRICK_ROWS);
      if (!specialIndexes.has(index)) {
        specialIndexes.set(index, specialTypes[specialIndexes.size % specialTypes.length]);
      }
    }
  }
  const twoHitIndexes = new Set();
  while (twoHitIndexes.size < 8) {
    const index = Math.floor(Math.random() * BRICK_COLUMNS * BRICK_ROWS);
    if (!specialIndexes.has(index)) {
      twoHitIndexes.add(index);
    }
  }

  // Center the whole block of bricks on the screen.
  const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
  const left = (WIDTH - totalWidth) / 2;

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLUMNS; col++) {
      const hue = Math.floor(Math.random() * 360);
      const index = row * BRICK_COLUMNS + col;
      const special = specialIndexes.get(index) || null;
      const powerupStyle = special ? POWERUP_STYLES[special] : null;
      const needsTwoHits = !special && twoHitIndexes.has(index);
      const y = BRICKS_TOP + row * (BRICK_HEIGHT + BRICK_GAP);
      list.push({
        x: left + col * (BRICK_WIDTH + BRICK_GAP),
        y,
        targetY: y,
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
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
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (brick.special === "spike") {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 9);
        ctx.lineTo(centerX + 7, centerY + 8);
        ctx.lineTo(centerX - 7, centerY + 8);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("SNIPE", centerX, centerY);
      }
    }
  }
}
