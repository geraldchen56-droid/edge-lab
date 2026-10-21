# Edge Lab

**The house knows the odds. Now you do.**

Edge Lab is a 3D casino for trading-interview prep. You start in a lobby with a live WebGL card table. Pick a table and the game opens full-screen on its own page. The first visit shows a short briefing, and **How to play** brings it back whenever you need it.

Live at **https://edgelab-games.vercel.app**. It is available in English, 简体中文, 日本語 and Español.

## What's inside

| Room | Tables |
|---|---|
| Trading floor | Card Game · Market Making Dice · Trading Game · ETF Arbitrage · Fermi Estimation · Event Contracts · Higher or Lower · Betting Board |
| Poker room | Pot Odds · Equity Calculator (Monte Carlo) · Bluff Maths · Rules & Hand Ranks · Where to Practise |
| Study hall | Expected Value · Linearity & Spread · Stop or Continue · Bayes in Odds Form · Kelly Sizing · Finance & Econometrics |

- **Daily Gauntlet:** ten timed questions a day, the same for everyone. The day's questions come from a seed based on the UTC date. Scoring is 80 points per correct answer plus up to 200 for speed.
- **Leaderboard:** today and all time, with streaks. To get on it, you sign in with Google. Guests can play everything, but their scores aren't saved.
- **LinkedIn sharing:** a pre-filled post, a downloadable result card, and a link preview image (`og.png`).
- **Installable app:** a web app manifest and a service worker, so you can add it to your home screen and play offline.
- **Four languages:** every page, briefing and in-game message is translated.

The games are modelled on the [Tradermath market games](https://www.tradermath.org/market-games).

## How it's built

There is no framework and no build step at deploy time: the site is plain HTML, CSS and JavaScript.

| File | Role |
|---|---|
| `index.html`, `play/*.html` | English pages (`zh/`, `ja/`, `es/` hold the translated copies) |
| `scene.js` | The 3D table (three.js r128 and GSAP). The felt reacts to wins and losses |
| `app.js` | Game logic. Every player-facing string goes through `T()` |
| `gauntlet.js`, `board.js` | Daily Gauntlet and the leaderboard |
| `auth.js` | Optional Google sign-in via Supabase |
| `shell.js` | Lobby, page transitions, briefings, full screen, languages, install prompt |
| `i18n.js`, `i18n/*.js` | Translation runtime and dictionaries |
| `sw.js`, `manifest.webmanifest` | Offline support and install |

### Backend (Supabase)

There are two tables:

- `profiles`: the display name is your first name plus last initial, and you can rename it.
- `gauntlet_runs`: one row per player per UTC day.

Row-level security stops direct writes. Scores can only be written through `start_gauntlet()` and `submit_gauntlet()`, and the server times the run and computes the score. The leaderboards are read through `leaderboard_day()` and `leaderboard_all()`.

### Rebuilding

The page generator and the translation files live in `build-src/`:

```bash
cd build-src
python3 build.py catalog   # writes i18n/catalog.txt with every English string
python3 check_tr.py        # checks the zh/ja/es files against the catalog
python3 build.py           # regenerates every page and language
```

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```
