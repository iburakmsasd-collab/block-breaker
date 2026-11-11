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
After rounds 1–9, choose Sniper (which adds 1–3 one-shot ammo bricks to each
later round) or Paddle (a 50% wider paddle for the next round); the next round
starts immediately. Each collected Sniper ammo brick gives one shot. Losing
all lives clears these run power-ups. Completing round 10 wins the game and
awards an additional 1000 credits.

The shop has separate Bricks and Powerups tabs, each with a 250-credit chest.
Chest unlocks, credits, and equipment are saved in this browser. Equip an
unlocked brick to add its pickup to future rounds. The Bricks chest contains
Multiball, Explosive, and Pentaball Bricks; the Powerups chest contains Sniper
and Paddle upgrades, which are chosen after a round; only the selected Sniper
upgrade adds ammo bricks. Heal Bricks are no longer sold and instead appear in rounds
starting at level 2. Levels 2–4 have one, levels 5–8 and 10 have two, and level
9 has two or four. The four-second chest reel shows the item and its odds.

Level 1 keeps its original layout. Later levels add spikes and rows: levels
2–10 have 1–4, 2–5, 2–6, 2–6, 3–7, 4–7, 5–8, exactly 5, and exactly 10 spikes,
respectively. Levels 4–6 have five rows, levels 7–9 have six, and level 10 has
seven.

Sound effects and background music are off by default. Turn Sound on in
Settings to enable both. Audio starts after a user interaction, as required by
browsers.