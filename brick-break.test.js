const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadGame() {
  const canvas = {
    width: 600,
    height: 450,
    getContext() {
      return { fillStyle: '', fillRect() {} };
    },
  };

  const context = {
    console,
    document: {
      addEventListener() {},
      getElementById(id) {
        if (id === 'game') {
          return canvas;
        }
        return null;
      },
    },
    window: {
      addEventListener() {},
      requestAnimationFrame() {},
    },
    performance: { now: () => 0 },
    requestAnimationFrame() {},
    setTimeout,
    clearTimeout,
  };

  vm.createContext(context);

  for (const filename of ['bricks.js', 'game.js', 'collisions.js']) {
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, filename), 'utf8'),
      context,
      { filename }
    );
  }

  return context;
}

test('ball removes a brick that it collides with', () => {
  const context = loadGame();

  vm.runInContext(
    `
      bricks = [{ x: 10, y: 10, width: 12, height: 12 }];
      ball.x = 10;
      ball.y = 10;
      ball.width = 12;
      ball.height = 12;
      ball.vx = 2;
      ball.vy = 2;
    `,
    context
  );

  vm.runInContext('bounceOffBricks();', context);

  assert.equal(vm.runInContext('bricks.length', context), 0);
});
