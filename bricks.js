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
function makeBricks() {
  const list = [];
  const twoHitIndexes = new Set();
  while (twoHitIndexes.size < 8) {
    twoHitIndexes.add(Math.floor(Math.random() * BRICK_COLUMNS * BRICK_ROWS));
  }

  // Center the whole block of bricks on the screen.
  const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
  const left = (WIDTH - totalWidth) / 2;

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLUMNS; col++) {
      const hue = Math.floor(Math.random() * 360);
      const needsTwoHits = twoHitIndexes.has(row * BRICK_COLUMNS + col);
      list.push({
        x: left + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICKS_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        hitstillbroken: needsTwoHits ? hitstillbroken : 1,
        color: `hsl(${hue}, 75%, 55%)`,
        darkerColor: needsTwoHits ? `hsl(${hue}, 75%, 25%)` : null
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
      continue;
    }

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
}
