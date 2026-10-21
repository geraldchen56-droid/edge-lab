# Edge Lab

**The house knows the odds. Now you do.**

Edge Lab is a 3D casino for trading-interview prep. You start in a lobby with a live WebGL card table. Pick a table and the game opens full-screen on its own page. The first visit shows a short briefing, and **How to play** brings it back whenever you need it.

## Tables

| Room | Tables |
|---|---|
| Trading floor | Card Game · Market Making Dice · Trading Game · ETF Arbitrage · Fermi Estimation · Event Contracts · Higher or Lower · Betting Board |
| Poker room | Pot Odds · Equity Calculator (Monte Carlo) · Bluff Maths · Rules & Hand Ranks · Where to Practise |
| Study hall | Expected Value · Linearity & Spread · Stop or Continue · Bayes in Odds Form · Kelly Sizing · Finance & Econometrics |

The games are modelled on the [Tradermath market games](https://www.tradermath.org/market-games). Probabilities are exact where stated, and poker equity comes from simulation.

## How it's built

There is no build step: plain HTML, CSS and JavaScript.

- `index.html` is the lobby. Hover a table to preview it on the 3D felt, and click the fanned cards to draw one.
- `play/*.html` holds one page per game.
- `scene.js` draws the casino table (three.js r128 and GSAP): cards, dice and chips are drawn on canvas textures, and the table reacts to wins and losses.
- `app.js` holds the game logic. Each game only starts if its table is on the page.
- `shell.js` runs the lobby tabs, page transitions, the one-time briefings and full screen.
- Progress ("Mark done") and settings are saved in your browser's `localStorage`.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

This is a static site. To publish it, either:

- import the repo into Vercel with the framework set to **Other** and no build command, or
- turn on GitHub Pages: Settings → Pages → deploy from the `main` branch, `/ (root)`.
