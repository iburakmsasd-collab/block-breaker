# Super-Basic-Brick-Bounce-Game

## Run locally

Requires Node.js. From this folder, run:

```sh
npm run dev
```

Open http://localhost:8000 to play. The server serves the files directly from
this folder, so game changes are available as soon as you refresh the page.
Press Ctrl+C in the terminal to stop it. Set `PORT` to use a different port.

Earn 100 credits at the end of each completed round, regardless of lost lives.
Each life above three adds another 30 credits. Losing all three lives before
completing a round earns no credits. Open the Shop from the start menu to unlock the Sniper Brick
for 500 credits or the Multiball Brick for 200 credits. Equip or unequip each
item to control whether its pickup appears in a round. The Pentaball Brick costs
10000 credits and launches 10 extra balls when collected. Credits, ownership,
and equipment are saved in this browser. Starting in round two, one Heart Brick
appears per round; collect its pickup for an extra life.