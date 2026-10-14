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

// Builds the list of bricks. Each brick is an object with an
// x, y, width, and height.
function makeBricks(level = 1) {
  const list = [];
  const specialIndexes = new Map();
  if (level === 2) {
    while (specialIndexes.size < 6) {
      const index = Math.floor(Math.random() * BRICK_COLUMNS * BRICK_ROWS);
      if (!specialIndexes.has(index)) {
        specialIndexes.set(index, specialIndexes.size < 3 ? "multiball" : "spike");
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
      const needsTwoHits = !special && twoHitIndexes.has(index);
      const y = BRICKS_TOP + row * (BRICK_HEIGHT + BRICK_GAP);
      list.push({
        x: left + col * (BRICK_WIDTH + BRICK_GAP),
        y,
        targetY: y,
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        hitstillbroken: needsTwoHits ? hitstillbroken : 1,
        color: special === "multiball" ? "#35d06f" : special === "spike" ? "#ef4545" : `hsl(${hue}, 75%, 55%)`,
        darkerColor: needsTwoHits ? `hsl(${hue}, 75%, 25%)` : null,
        special
      });
    }
  }

  return list;
}

// Draws every brick in the list.
function drawBricks() {
  for (const brick of bricks) {
    if (!brick.darkerColor) {
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    } else {
      const tileWidth = brick.width / BRICK_CHECKER_COLUMNS;
      const tileHeight = brick.height / BRICK_CHECKER_ROWS;
      for (let row = 0; row < BRICK_CHECKER_ROWS; row++) {
        for (let column = 0; column < BRICK_CHECKER_COLUMNS; column++) {
          const isDarkerTile = (row + column) % 2 === 1;
          if (brick.hitstillbroken === 1 && !isDarkerTile) {
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
      const symbol = brick.special === "multiball" ? "+" : "!";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "black";
      ctx.fillStyle = "white";
      ctx.strokeText(symbol, brick.x + brick.width / 2, brick.y + brick.height / 2);
      ctx.fillText(symbol, brick.x + brick.width / 2, brick.y + brick.height / 2);
    }
  }
}
