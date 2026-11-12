# Super-Basic-Brick-Bounce-Game

## Run locally

Requires Node.js. From this folder, run:

```sh
npm run dev
```

Open http://localhost:8000 to play. The server serves the files directly from
this folder, so game changes are available as soon as you refresh the page.
Press Ctrl+C in the terminal to stop it. Set `PORT` to use a different port.

Earn 100 credits for each completed round, plus 30 for every life above three.
After rounds 1–9, choose one of your equipped power-ups: Sniper adds 1–3
one-shot ammo bricks, Paddle makes your paddle 50% wider, Time Machine slows
time for five seconds when P is pressed, Magnet pulls the ball toward the
paddle, Machine Gun fires ball-shaped bullets for three seconds when F is
pressed, and Double Paddle adds a separate blue paddle beside yours. If only
one power-up is equipped, “YOU WON!” appears on the game canvas; press Enter
to use it and start the next round. The chosen power-up expires when that
round ends. Paddle is available to every player; the other power-ups are
found in the Powerups chest. Each collected Sniper ammo brick gives one shot.
Losing all lives clears the current run power-up. Completing round 10 wins the
game and awards an additional 1000 credits.

The shop has separate Bricks and Powerups tabs, each with a 250-credit chest.
Chest unlocks, credits, and equipment are saved in this browser. Equip an
unlocked brick to add its pickup to future rounds. The Bricks chest contains
Multiball, Explosive, Pentaball, Laser, and Debris Bricks. Laser Bricks fire
four-direction beams when broken; Debris Bricks also break bricks below them.
The Powerups chest contains the six run power-ups. Heal Bricks are no longer
sold and instead appear in rounds starting at level 2. Gravity Breaker and
Teleporter negative bricks also appear in later rounds: Gravity Breakers send
the ball downward at double speed, piercing bricks until it reaches a paddle;
Teleporter Bricks have a 50% chance to move to an unoccupied brick spot when
hit. Levels 2–4 have one, levels 5–8 and 10 have two, and level 9 has two or
four Heal Bricks. The four-second chest reel shows the item and its odds.

Level 1 keeps its original layout. Later levels add spikes and rows: levels
2–10 have 1–4, 2–5, 2–6, 2–6, 3–7, 4–7, 5–8, exactly 5, and exactly 10 spikes,
respectively. Levels 4–6 have five rows, levels 7–9 have six, and level 10 has
seven.

Sound effects and background music are off by default. Turn Sound on in
Settings to enable both. Audio starts after a user interaction, as required by
browsers.