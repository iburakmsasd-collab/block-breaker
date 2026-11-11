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
function bounceOffWalls(ball) {
  if (ball.x < 0) {
    ball.x = 0;
    ball.vx = -ball.vx;
    GameAudio.play("wall");
  }
  if (ball.x + ball.width > WIDTH) {
    ball.x = WIDTH - ball.width;
    ball.vx = -ball.vx;
    GameAudio.play("wall");
  }
  if (ball.y < 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
    GameAudio.play("wall");
  }
}


// The ball bounces off the top of the paddle.
// ball.vy > 0 means "the ball is moving down", so it only bounces
// when it is falling onto the paddle.
function bounceOffPaddle(ball) {
  if (boxesTouch(ball, paddle) && ball.vy > 0) {
    GameAudio.play("paddle");
    ball.y = paddle.y - ball.height;  // sit on top of the paddle
    ball.squish = BALL_SQUISH_FRAMES;
    paddleHitFlashFrames = 8;
    paddleHitFlashX = Math.max(paddle.x, Math.min(paddle.x + paddle.width, ball.x + ball.width / 2));
    brickCombo = 0;
    lastComboDisplayValue = 0;
    for (let index = 0; index < 12; index++) {
      particles.push({
        x: ball.x + ball.width / 2 + (Math.random() - 0.5) * ball.width,
        y: paddle.y,
        width: 3,
        height: 3,
        vx: (Math.random() - 0.5) * 4,
        vy: -1 - Math.random() * 2.5,
        life: 18,
        maxLife: 18,
        alpha: 1,
        glow: true,
        color: "#fff6a0"
      });
    }
    const impactOffset = (ball.x + ball.width / 2 - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    const clampedOffset = Math.max(-1, Math.min(1, impactOffset));
    const speed = Math.hypot(ball.vx, ball.vy);
    ball.vx = clampedOffset * speed * 0.8;
    ball.vy = -Math.sqrt(speed * speed - ball.vx * ball.vx);
  }
}


function breakBrickIntoParticles(brick) {
  const rows = 6;
  const columnsByRow = [8, 10, 12, 10, 8, 12];
  for (let row = 0; row < rows; row++) {
    const columns = columnsByRow[row];
    const particleWidth = brick.width / columns;
    const particleHeight = brick.height / rows;
    for (let column = 0; column < columns; column++) {
      const particleX = brick.x + column * particleWidth;
      const particleY = brick.y + row * particleHeight;
      const offsetX = particleX + particleWidth / 2 - (brick.x + brick.width / 2);
      const offsetY = particleY + particleHeight / 2 - (brick.y + brick.height / 2);
      const distance = Math.hypot(offsetX, offsetY) || 1;
      const speed = 1 + Math.random() * 2.2;
      const isExplosive = brick.special === "explosive";
      particles.push({
        x: particleX,
        y: particleY,
        width: particleWidth,
        height: particleHeight,
        vx: isExplosive ? 0 : offsetX / distance * speed,
        vy: isExplosive ? 1 + Math.random() * 3 : offsetY / distance * speed,
        life: 28,
        maxLife: 28,
        fadeFrames: 6,
        opaque: true,
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

      const tileX = brick.x + column * tileWidth;
      const tileY = brick.y + row * tileHeight;
      const isExplosive = brick.special === "explosive";
      const offsetX = tileX + tileWidth / 2 - (brick.x + brick.width / 2);
      const offsetY = tileY + tileHeight / 2 - (brick.y + brick.height / 2);
      const distance = Math.hypot(offsetX, offsetY) || 1;
      const speed = 0.8 + Math.random() * 1.8;
      particles.push({
        x: tileX,
        y: tileY,
        width: tileWidth,
        height: tileHeight,
        vx: isExplosive ? (Math.random() - 0.5) * 2 : offsetX / distance * speed,
        vy: isExplosive ? 1 + Math.random() * 2 : offsetY / distance * speed,
        life: 28,
        maxLife: 28,
        fadeFrames: 6,
        opaque: true,
        color: isDarkerTile ? brick.darkerColor : brick.color
      });
    }
  }
}

function damageBrick(brick) {
  if (brick.pendingDestroy) {
    return;
  }

  brick.hitstillbroken -= 1;
  GameAudio.play("brickHit", brick.hitstillbroken);
  brick.hitFlashFrames = BRICK_HIT_FLASH_FRAMES;

  if (brick.hitstillbroken <= 0) {
    brick.pendingDestroy = true;
    brick.pendingDestroyFrames = BRICK_BREAK_DELAY_FRAMES;
    if (brick.darkerColor) {
      breakCheckerTilesIntoParticles(brick, false);
      breakCheckerTilesIntoParticles(brick, true);
    } else {
      breakBrickIntoParticles(brick);
    }
  } else if (brick.darkerColor) {
    breakCheckerTilesIntoParticles(brick, false);
  }
}

function updateBrickEffects() {
  for (const brick of [...bricks]) {
    if (brick.hitFlashFrames > 0) {
      brick.hitFlashFrames -= 1;
    }
    if (brick.pendingDestroy && --brick.pendingDestroyFrames <= 0) {
      destroyBrick(brick, true);
    }
  }
}

function destroyBrick(brick, particlesAlreadyEmitted = false, suppressExplosion = false) {
  const brickIndex = bricks.indexOf(brick);
  if (brickIndex === -1) {
    return;
  }
  if (!particlesAlreadyEmitted) {
    if (brick.darkerColor) {
      breakCheckerTilesIntoParticles(brick, false);
      breakCheckerTilesIntoParticles(brick, true);
    } else {
      breakBrickIntoParticles(brick);
    }
  }
  bricks.splice(brickIndex, 1);
  onBrickDestroyed(brick, suppressExplosion);
}

// The ball bounces off bricks and removes each one after enough hits.
function bounceOffBricks(ball, damage = true) {
  for (const brick of [...bricks]) {
    if (brick.pendingDestroy || !boxesTouch(ball, brick)) {
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

    if (damage) {
      damageBrick(brick);
    }
    break;  // bounce off one brick per update, then stop looking
  }
}
