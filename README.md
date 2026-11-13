# Super-Basic-Brick-Bounce-Game

## Run locally

Requires Node.js. From this folder, run:

```sh
npm run dev
```

Open http://localhost:8000 to play. New players start with 500 credits. The
server serves the files directly from this folder, so game changes are
available as soon as you refresh the page. Press Ctrl+C in the terminal to
stop it. Set `PORT` to use a different port.

Earn 100 credits for each completed round, plus 30 for every life above three.
After rounds 1–9, choose from up to two randomly selected equipped power-ups,
alongside the always-available free Extra Life choice. Sniper adds 1–2 one-shot
ammo bricks, Paddle makes your paddle 50% wider, Time Machine slows time for
five seconds when P is pressed, Magnet pulls the downward-moving ball toward
the paddle without reducing its speed, Machine Gun fires
ball-shaped bullets for one second when F is pressed after the ball is
launched, and Double Paddle adds a blue paddle below the white paddle. The
chosen power-up expires when that round ends. Extra Life
immediately grants one additional life. Paddle is available
to every player; the other power-ups are found in the Powerups chest. Each
collected Sniper ammo brick gives one shot. Losing all lives clears the current
run power-up. Completing round 10 wins the game and awards an additional 1000
credits.

The labeled Speed Brick doubles the ball's speed and sends it straight down
through bricks; its speed boost wears off after five seconds. Spike bricks
drop spikes that slow the paddle by 25% per hit, and those slowdowns stack
(10% per hit on Level 11).

The shop has separate Bricks and Powerups tabs, each with a 100-credit chest.
Chest unlocks, credits, and equipment are saved in this browser. Equip an
up to three unlocked bricks to add their pickups to future rounds, and equip
any number of powerups. The Bricks chest contains
Multiball, Explosive, Pentaball, Laser, and Debris Bricks. Laser Bricks fire
four-direction beams when broken; Debris Bricks drop block fragments that fall
through and destroy bricks in their path.
The Powerups chest contains the six run power-ups. Shop items are ordered from
common to rare: Paddle has a 50% drop chance, Time Machine 20%, Magnet 15%,
Sniper 10%, Double Paddle 4%, and Machine Gun 1%. Multiball and Debris Bricks
each have a 40% drop chance, Pentaball 17%, Laser 2%, and Explosive 1%. Heal
Bricks have been removed; choose
Extra Life after a round to gain a life. Speed and TP negative bricks also appear in later rounds. TP bricks have a 50%
chance to move to an unoccupied brick spot when hit. They teleport two-thirds
of the time in Level 12, then stop teleporting after half are broken. Debris
brick fragments fall through and destroy bricks in their path. The four-second
chest reel shows each item's odds.

Level 1 keeps its original layout. Later levels add spikes and rows: levels
2–10 have 1–4, 2–5, 2–6, 2–6, 3–7, 4–7, 5–8, exactly 5, and exactly 10 spikes,
respectively. Levels 4–6 have five rows, levels 7–9 have six, and level 10 has
seven.

Play offers Normal (10 levels), Impossible (Level 11), and Impossible²
(Level 12) to every player. The two Impossible modes begin with a choice of two
different powerups. Level 11 has five hearts and awards 5,000 credits. Level
12 begins with a slower ball, awards 100,000 credits, and permanently unlocks
the rainbow paddle and ball. The Impossible² win counter is stored in this
browser when no shared counter service is connected.

Sound effects and background music are off by default. Turn Sound on in
Settings to enable both. Audio starts after a user interaction, as required by
browsers.