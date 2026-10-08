// ============================================================
// collisions.js: what happens when the ball touches something
//
// To "bounce", we flip the ball's speed:
//   hit something sideways -> vx = -vx
//   hit something above or below -> vy = -vy
// ============================================================

// Returns true if two rectangles (like the ball and a brick) overlap.
function boxesTouch(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}


// The ball bounces off the left, right, and top walls.
// (The bottom is not a wall: falling off the bottom resets the ball.)
function bounceOffWalls() {
  if (ball.x < 0) {
    ball.x = 0;
    ball.vx = -ball.vx;
  }
  if (ball.x + ball.width > WIDTH) {
    ball.x = WIDTH - ball.width;
    ball.vx = -ball.vx;
  }
  if (ball.y < 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
  }
}


// The ball bounces off the top of the paddle.
// ball.vy > 0 means "the ball is moving down", so it only bounces
// when it is falling onto the paddle.
function bounceOffPaddle() {
  if (boxesTouch(ball, paddle) && ball.vy > 0) {
    ball.y = paddle.y - ball.height;  // sit on top of the paddle
    const impactOffset = (ball.x + ball.width / 2 - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    const clampedOffset = Math.max(-1, Math.min(1, impactOffset));
    const speed = Math.hypot(ball.vx, ball.vy);
    ball.vx = clampedOffset * speed * 0.8;
    ball.vy = -Math.sqrt(speed * speed - ball.vx * ball.vx);
  }
}


function breakBrickIntoParticles(brick) {
  const columns = 5;
  const rows = 4;
  const particleSize = Math.min(brick.width / columns, brick.height / rows);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      particles.push({
        x: brick.x + (column + 0.5) * brick.width / columns - particleSize / 2,
        y: brick.y + (row + 0.5) * brick.height / rows - particleSize / 2,
        width: particleSize,
        height: particleSize,
        vx: 0,
        vy: 1 + Math.random() * 3,
        life: 45,
        maxLife: 45,
        color: brick.color
      });
    }
  }
}

function breakCheckerTilesIntoParticles(brick, darkerTiles) {
  const tileWidth = brick.width / BRICK_CHECKER_COLUMNS;
  const tileHeight = brick.height / BRICK_CHECKER_ROWS;
  for (let row = 0; row < BRICK_CHECKER_ROWS; row++) {
    for (let column = 0; column < BRICK_CHECKER_COLUMNS; column++) {
      const isDarkerTile = (row + column) % 2 === 1;
      if (isDarkerTile !== darkerTiles) {
        continue;
      }

      particles.push({
        x: brick.x + column * tileWidth,
        y: brick.y + row * tileHeight,
        width: tileWidth,
        height: tileHeight,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 2,
        life: 45,
        maxLife: 45,
        color: isDarkerTile ? brick.darkerColor : brick.color
      });
    }
  }
}

// The ball bounces off bricks and removes each one after enough hits.
function bounceOffBricks() {
  for (const brick of bricks) {
    if (!boxesTouch(ball, brick)) {
      continue;  // not touching this brick, check the next one
    }

    // How far has the ball pushed into the brick on each side?
    const overlapX = Math.min(ball.x + ball.width, brick.x + brick.width) - Math.max(ball.x, brick.x);
    const overlapY = Math.min(ball.y + ball.height, brick.y + brick.height) - Math.max(ball.y, brick.y);

    if (overlapX < overlapY) {
      // The ball hit the brick's left or right side.
      ball.vx = -ball.vx;
      if (ball.x < brick.x) {
        ball.x = brick.x - ball.width;     // left of the brick
      } else {
        ball.x = brick.x + brick.width;    // right of the brick
      }
    } else {
      // The ball hit the brick's top or bottom.
      ball.vy = -ball.vy;
      if (ball.y < brick.y) {
        ball.y = brick.y - ball.height;    // above the brick
      } else {
        ball.y = brick.y + brick.height;   // below the brick
      }
    }

    brick.hitstillbroken -= 1;
    if (brick.darkerColor) {
      breakCheckerTilesIntoParticles(brick, brick.hitstillbroken <= 0);
      if (brick.hitstillbroken <= 0) {
        blocksBroken += 1;
        bricks.splice(bricks.indexOf(brick), 1);
      }
    } else if (brick.hitstillbroken <= 0) {
      breakBrickIntoParticles(brick);
      blocksBroken += 1;
      bricks.splice(bricks.indexOf(brick), 1);
    }
    break;  // bounce off one brick per update, then stop looking
  }
}
