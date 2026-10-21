"""Edge Lab v4 build: 3D lobby + full-screen tables + Daily Gauntlet + leaderboard + PWA + 4 languages.
Usage:  python3 build.py            build everything into the repo
        python3 build.py catalog    also (re)write i18n/catalog.txt (English strings to translate)"""
import re, os, sys, html, json, hashlib, glob, shutil
from bs4 import BeautifulSoup, NavigableString, Tag
sys.path.insert(0, os.path.dirname(__file__))
from app_i18n import apply as i18n_app

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(ROOT)
SITE_URL = "https://edgelab-games.vercel.app"
e = html.escape
LANGS = [("en", "en", "EN"), ("zh", "zh-Hans", "中文"), ("ja", "ja", "日本語"), ("es", "es", "ES")]

# ---------------------------------------------------------------- catalogue of tables
FLOOR = [
  ("trade", "Trading floor", [
    ("g-card",  "Card Game",            "Price a random contract. Buy, sell or pass.", "deal"),
    ("g-dice",  "Market Making Dice",   "Quote three dice and survive informed flow.", "dice"),
    ("g-trade", "Trading Game",         "Five hidden cards. Re-price as each one turns.", "trade"),
    ("g-etf",   "ETF Arbitrage",        "NAV against price, on a 15-second clock.", "chips"),
    ("g-fermi", "Fermi Estimation",     "90% ranges for questions you can't look up.", "bell"),
    ("g-event", "Event Contracts",      "Update with Bayes, then make a yes/no market.", "chips"),
    ("g-hilo",  "Higher or Lower",      "Count the deck and size each bet with Kelly.", "hilo"),
    ("g-board", "Betting Board",        "Spot mispriced odds and lock in arbitrage.", "dice"),
  ]),
  ("poker", "Poker room", [
    ("p-odds",   "Pot Odds",            "Call or fold: your equity against the price.", "poker"),
    ("p-equity", "Equity Calculator",   "Any hand against any hand, 20,000 runouts.", "poker"),
    ("p-bluff",  "Bluff Maths",         "How often a bluff must work, and how often to defend.", "poker"),
    ("p-rules",  "Rules & Hand Ranks",  "Reference: how Hold'em works.", "poker"),
    ("p-sites",  "Where to Practise",   "Reference: solvers, sims and play-money tables.", "deck"),
  ]),
  ("study", "Study hall", [
    ("ev",       "Expected Value",      "Price any bet and watch the variance.", "dice"),
    ("linear",   "Linearity & Spread",  "Why risk grows with the square root of n.", "bell"),
    ("stopping", "Stop or Continue",    "Optimal stopping with a die.", "dice"),
    ("bayes",    "Bayes in Odds Form",  "Prior odds × likelihood ratio = posterior.", "chips"),
    ("kelly",    "Kelly Sizing",        "How much to bet when you have an edge.", "chips"),
    ("bridge",   "Finance & Econometrics", "t-stats: how many hands prove you have skill.", "bell"),
  ]),
]
ORDER = [g for _, _, gs in FLOOR for g in gs]
GROUP_OF = {g[0]: (gk, gn, i + 1, len(gs)) for gk, gn, gs in FLOOR for i, g in enumerate(gs)}
REFERENCE = {"p-rules", "p-sites"}

# ---------------------------------------------------------------- content sections (from the casino build)
soup = BeautifulSoup(open(ROOT + "/site/index.html").read(), "html.parser")
sections = {}
for sec in soup.select("section.mod"):
    sid = sec["id"]
    tags = [t.get_text() for t in sec.select(".meta .tag")]
    desks, prose = [], []
    nested = [d.extract() for d in sec.select(".desk") if d.parent is not sec]
    for ch in list(sec.children):
        if getattr(ch, "name", None) is None:
            if str(ch).strip(): prose.append(str(ch))
            continue
        if ch.name == "h3" and not prose and not desks: continue
        if "meta" in (ch.get("class") or []): continue
        if ch.name == "details": ch.attrs.pop("open", None)
        if "desk" in (ch.get("class") or []): desks.append(str(ch))
        else: prose.append(str(ch))
    desks += [str(d) for d in nested]
    sections[sid] = dict(tags=tags, desks=desks, prose="\n".join(prose))

# ---------------------------------------------------------------- page chrome
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
 '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@300;500;700;800&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap">')
LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js']

def head(title, desc, site, page, lang, hl):
    pre = "{PRE}"
    alts = "\n".join(f'<link rel="alternate" hreflang="{h}" href="{SITE_URL}/{"" if l=="en" else l+"/"}{page}">' for l, h, _ in LANGS)
    man = "{PRE}manifest.webmanifest"
    return f"""<!doctype html>
<html lang="{hl}" data-lang="{lang}" data-site="{site}" data-root="{site}{pre}" data-page="{page}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<meta name="theme-color" content="#050a08">
<link rel="canonical" href="{SITE_URL}/{pre}{page}">
{alts}
<link rel="alternate" hreflang="x-default" href="{SITE_URL}/{page}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Edge Lab">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{SITE_URL}/{pre}{page}">
<meta property="og:image" content="{SITE_URL}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="manifest" href="{site}{man}">
<link rel="icon" type="image/png" sizes="192x192" href="{site}icons/icon-192.png">
<link rel="apple-touch-icon" href="{site}icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Edge Lab">
{FONTS}
<link rel="stylesheet" href="{site}styles.css">
<script>window.va=window.va||function(){{(window.vaq=window.vaq||[]).push(arguments)}};</script>
<script defer src="/_vercel/insights/script.js"></script>
</head>"""

def scripts(site, lang, extra=()):
    s = [f'<script src="{site}i18n/{lang}.js"></script>'] if lang != "en" else []
    s += [f'<script src="{site}i18n.js"></script>'] + [f'<script src="{u}"></script>' for u in LIBS]
    s += [f'<script src="{site}{f}"></script>' for f in ("auth.js", "app.js", "scene.js", "shell.js") + tuple(extra)]
    return "\n".join(s)

def langsel():
    opts = "".join(f'<option value="{l}">{n}</option>' for l, _, n in LANGS)
    return f'<label class="langsel"><span class="sr">Language</span><select id="langSel" aria-label="Language">{opts}</select></label>'

def topbar_game(gn_line, title, extra_btns):
    return f"""<header class="topbar">
  <a class="back tb-btn" href="../index.html" data-nav aria-label="Back to all tables">← Tables</a>
  <div class="gtitle"><small>{gn_line}</small><b>{e(title)}</b></div>
  <div class="tb-r">{extra_btns}<button id="sndBtn" class="tb-btn" aria-pressed="false">Sound off</button><button class="tb-btn" id="fsBtn" hidden>Full screen</button>{langsel()}</div>
</header>"""

BODY_OPEN = '<canvas id="stage" aria-hidden="true"></canvas>\n<div class="veil {v}" aria-hidden="true"></div>\n<div class="curtain in" aria-hidden="true"></div>'

# ---------------------------------------------------------------- English pages (dict: relative path -> html)
def build_en(site_root_for):
    pages = {}
    # lobby
    tabs, panels = [], []
    for gk, gn, gs in FLOOR:
        tabs.append(f'<button class="tab" role="tab" id="tab-{gk}" aria-controls="floor-{gk}" data-tab="{gk}">{e(gn)} <span>{len(gs)}</span></button>')
        rows = "".join(
            f'<li><a href="play/{gid}.html" data-preview="{sc}"><span class="no">{i+1:02d}</span>'
            f'<span class="nm">{e(nm)}</span><span class="tick" data-for="{gid}"></span>'
            f'<span class="ds">{e(ds)}</span><span class="go" aria-hidden="true">Play →</span></a></li>'
            for i, (gid, nm, ds, sc) in enumerate(gs))
        panels.append(f'<ul class="floor" role="tabpanel" id="floor-{gk}" aria-labelledby="tab-{gk}" hidden>{rows}</ul>')
    site = "{SITE}"
    pages["index.html"] = head("Edge Lab · Trading-interview games", "A 3D casino for trading-interview prep. Market making, ETF arbitrage, Bayes, Kelly sizing and poker maths, plus a Daily Gauntlet with a leaderboard.", site, "index.html", "{LANG}", "{HL}") + f"""
<body class="lobby-page">
{BODY_OPEN.format(v="veil-lobby")}
<header class="topbar">
  <a class="brand" href="index.html"><i aria-hidden="true"></i>Edge Lab</a>
  <div class="tb-r"><span class="tb-prog" id="progTxt"></span><button class="tb-btn gold" id="installBtn" hidden>Install app</button>{langsel()}<button id="sndBtn" class="tb-btn" aria-pressed="false">Sound off</button></div>
</header>
<main class="lobby" data-scene="fan">
  <div class="lobby-l">
    <div class="kicker">Trading-interview prep · after hours</div>
    <h1>The house knows the odds. <b>Now you do.</b></h1>
    <p class="lede">Pick a table. Every game opens full-screen, with a one-time briefing.</p>
    <div class="daily-row"><a class="daily-cta" href="play/daily.html" data-nav><span class="k">Daily Gauntlet <b id="dailyNo"></b></span><span class="t">Ten questions. Same for everyone. One ranked try a day.</span><span class="go" aria-hidden="true">Play today →</span></a>
      <a class="lb-link" href="play/leaderboard.html" data-nav><span class="k">Leaderboard</span><span class="t">Today and all time</span></a></div>
    <div class="tabs" role="tablist" aria-label="Rooms">{''.join(tabs)}</div>
    {''.join(panels)}
    <p class="foot">Modelled on the <a href="https://www.tradermath.org/market-games" target="_blank" rel="noopener">Tradermath market games</a>. Probabilities exact where stated; equity by simulation. <a href="https://github.com/geraldchen56-droid/edge-lab" target="_blank" rel="noopener">Source on GitHub</a>.</p>
  </div>
  <div class="stagehud" data-hud aria-live="polite"></div>
</main>
<dialog class="tut sm" id="installHelp" aria-labelledby="ihTitle"><div class="tut-in">
  <div class="tut-h"><small>Install</small><h2 id="ihTitle">Edge Lab as an app</h2></div>
  <div class="tut-b"><p><b>iPhone or iPad (Safari):</b> tap Share, then <b>Add to Home Screen</b>.</p><p><b>Android (Chrome):</b> tap the ⋮ menu, then <b>Install app</b>.</p><p><b>Computer (Chrome or Edge):</b> click the install icon at the right of the address bar.</p><p>It opens full-screen with its own icon, and the games keep working offline.</p></div>
  <div class="tut-f"><span></span><button class="chip-btn" data-close>Got it</button></div>
</div></dialog>
{{SCRIPTS}}
</body>
</html>
"""
    # game pages
    for idx, (gid, nm, ds, sc) in enumerate(ORDER):
        s = sections[gid]; gk, gn, pos, tot = GROUP_OF[gid]
        prev_ = ORDER[idx - 1] if idx > 0 else None
        next_ = ORDER[idx + 1] if idx + 1 < len(ORDER) else None
        ref = gid in REFERENCE
        tags = "".join(f'<span class="tag">{e(t)}</span>' for t in s["tags"])
        if ref:
            body = f'<article class="desk ref">{s["prose"]}</article>'; tut = ""; tutbtn = ""
        else:
            body = "\n".join(s["desks"])
            tutbtn = '<button class="tb-btn gold" id="tutBtn" aria-haspopup="dialog">How to play</button>'
            tut = f"""<dialog class="tut" id="tut" aria-labelledby="tutTitle">
  <div class="tut-in">
    <div class="tut-h"><small>Briefing · {e(gn)}</small><h2 id="tutTitle">{e(nm)}</h2>{('<div class="tags">'+tags+'</div>') if tags else ''}</div>
    <div class="tut-b">{s["prose"]}</div>
    <div class="tut-f"><span class="hint">Reopen any time with <b>How to play</b>.</span><button class="chip-btn" id="tutGo" autofocus>Deal me in</button></div>
  </div>
</dialog>"""
        pager = ('<nav class="pager" aria-label="More tables">'
                 + (f'<a href="{prev_[0]}.html" data-nav>← {e(prev_[1])}</a>' if prev_ else '<span></span>')
                 + '<a href="../index.html" data-nav class="lob">All tables</a>'
                 + (f'<a href="{next_[0]}.html" data-nav>{e(next_[1])} →</a>' if next_ else '<span></span>') + '</nav>')
        btns = tutbtn + f'<button class="tb-btn" data-done="{gid}" aria-pressed="false">Mark done</button>'
        pages[f"play/{gid}.html"] = head(f"{nm} · Edge Lab", f"{nm}: {ds}", site, f"play/{gid}.html", "{LANG}", "{HL}") + f"""
<body class="game-page{' ref-page' if ref else ''}" data-scene3d="{sc}" data-game="{gid}">
{BODY_OPEN.format(v="veil-game")}
{topbar_game(f'{e(gn)} · {pos}/{tot}', nm, btns)}
<main class="gstage">
  <div class="game" id="game">
{body}
{pager}
  </div>
</main>
{tut}
{{SCRIPTS}}
</body>
</html>
"""
    # daily gauntlet
    li = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>'
    pages["play/daily.html"] = head("Daily Gauntlet · Edge Lab", "Ten trading-interview questions, the same for everyone each day: fair value, pot odds, ETF arbitrage, Bayes and Kelly. Score, streak and leaderboard.", site, "play/daily.html", "{LANG}", "{HL}") + f"""
<body class="game-page daily-page" data-scene3d="chips">
{BODY_OPEN.format(v="veil-game")}
{topbar_game('Edge Lab · <span id="gxNoTop">Daily</span>', 'Daily Gauntlet', '')}
<main class="gstage">
  <div class="game gx" id="game">
  <section class="desk gx-card" id="gxIntro">
    <div class="desk-h">Daily Gauntlet <span class="hud"><span class="pill" id="gxNo"></span><span class="pill" id="gxDate"></span></span></div>
    <h2 class="gx-title">Ten questions. <b>Same for everyone.</b></h2>
    <ul class="gx-rules">
      <li>One question each on fair value, pot odds, ETF arbitrage, Bayes, Kelly, bluffing and more.</li>
      <li>30 seconds per question. Press 1–4 to answer from the keyboard.</li>
      <li>80 points per correct answer, plus up to 200 for speed. The maximum is 1,000.</li>
      <li>One ranked attempt a day. The gauntlet resets at 00:00 UTC.</li>
    </ul>
    <p class="gx-status" id="gxStatus"></p>
    <p class="gx-streak" id="gxStreak"></p>
    <div class="row"><button class="chip-btn" id="gxStart">Start</button><a class="tb-btn" href="leaderboard.html" data-nav>Leaderboard</a></div>
  </section>
  <section class="desk gx-card" id="gxPlay" hidden>
    <div class="gx-top"><span id="gxIdx"></span><span class="gx-dots" id="gxDots"></span><span class="gx-clock" id="gxClock">0.0s</span></div>
    <div class="timer gx-timer"><i id="gxBar"></i></div>
    <span class="gx-tag" id="gxTag"></span>
    <p class="gx-q" id="gxQ" aria-live="polite"></p>
    <div class="gx-vis" id="gxVis"></div>
    <div class="gx-opts" id="gxOpts"></div>
  </section>
  <section class="desk gx-card" id="gxDone" hidden>
    <div class="desk-h">Result <span class="hud"><span class="pill" id="gxNext"></span></span></div>
    <div class="gx-res"><div><div class="gx-score" id="gxScore"></div><div class="gx-of" id="gxOf"></div></div><div class="gx-grid" id="gxGrid"></div></div>
    <p id="gxNote" class="gx-note"></p>
    <p id="gxStreakEnd" class="gx-streak"></p>
    <div class="gx-share"><button class="li" id="gxLinkedIn">{li}<span>Share on LinkedIn</span></button><button id="gxImg">Save result image</button><button id="gxCopy">Copy text</button><span id="gxShareMsg" class="dim small" aria-live="polite"></span></div>
    <div class="gx-cols">
      <div><h3>Today's top 10</h3><div id="gxTop"></div><a href="leaderboard.html" data-nav class="more">Full leaderboard →</a></div>
      <div id="gxReviewWrap"><h3>Review</h3><ol class="gx-review" id="gxReview"></ol></div>
    </div>
    <div class="row"><button id="gxAgain">Replay for practice</button><a class="tb-btn" href="../index.html" data-nav>All tables</a></div>
  </section>
  </div>
</main>
{{SCRIPTS}}
</body>
</html>
"""
    pages["play/leaderboard.html"] = head("Leaderboard · Edge Lab", "Daily Gauntlet leaderboard: today's top scores and all-time totals with streaks.", site, "play/leaderboard.html", "{LANG}", "{HL}") + f"""
<body class="game-page board-page" data-scene3d="chips">
{BODY_OPEN.format(v="veil-game")}
{topbar_game('Edge Lab · Daily Gauntlet', 'Leaderboard', '')}
<main class="gstage">
  <div class="game">
  <section class="desk lbx">
    <div class="desk-h">Leaderboard <span class="hud"><a class="pill" href="daily.html" data-nav>Play today's gauntlet →</a></span></div>
    <div class="tabs" role="tablist" aria-label="Period"><button class="tab" role="tab" data-lb="day" aria-selected="true">Today</button><button class="tab" role="tab" data-lb="all" aria-selected="false">All time</button></div>
    <p id="lbYou" class="lb-you"></p>
    <div class="tbl"><table class="lbt"><thead id="lbHead"></thead><tbody id="lbBody"></tbody></table></div>
    <p class="small dim">Scores come from the Daily Gauntlet. Sign in with Google to appear here; guests can play but aren't ranked.</p>
  </section>
  </div>
</main>
{{SCRIPTS}}
</body>
</html>
"""
    return pages

EXTRA_JS = {"play/daily.html": ("gauntlet.js",), "play/leaderboard.html": ("board.js",)}

# ---------------------------------------------------------------- translation machinery
INLINE = {'b','i','em','strong','code','sup','sub','br','a','span','small','kbd','u','s','svg','path'}
SKIP = {'script','style','canvas','svg','select','option','title'}
norm = lambda s: re.sub(r"\s+", " ", s).strip()
key_id = lambda s: hashlib.sha1(s.encode()).hexdigest()[:8]
has_words = lambda t: re.search(r"[A-Za-z]{2}", t) is not None

KEEP = {'p','li','h1','h2','h3','h4','td','th','summary','dt','dd','b','strong','em','i','code','small','kbd','title'}
def is_leaf(el):
    tags = [d for d in el.descendants if isinstance(d, Tag)]
    for d in tags:
        if d.name not in INLINE or d.name == 'svg': return False
        if d.get('id'): return False
    loose = any(type(c) is NavigableString and c.strip() for c in el.children)
    if not loose and any(d.name == 'span' and d.get('class') for d in tags): return False
    if el.name not in KEEP and not loose and len([c for c in el.children if isinstance(c, Tag)]) >= 2: return False
    return True

DERIVE = [(re.compile(r"^(.+) · Edge Lab$"), "{0} · Edge Lab"), (re.compile(r"^(.+) · (\d+/\d+)$"), "{0} · {1}"),
          (re.compile(r"^← (.+)$"), "← {0}"), (re.compile(r"^(.+) →$"), "{0} →"), (re.compile(r"^Briefing · (.+)$"), None),
          (re.compile(r"^([^:]{2,40}): (.+)$"), "{0}: {1}")]
def derive(k, lookup):
    """Translate composites like 'Card Game · Edge Lab' from their parts. Returns None if not derivable."""
    for rx, fmt in DERIVE:
        m = rx.match(k)
        if not m: continue
        if fmt is None:
            b = lookup.get("Briefing") if isinstance(lookup, dict) else ("Briefing" in lookup)
            part = m.group(1)
            if isinstance(lookup, dict):
                if "Briefing" in lookup and part in lookup: return lookup["Briefing"] + " · " + lookup[part]
                return None
            return "ok" if part in lookup else None
        parts = [g for g in m.groups()]
        tparts = []
        for g in parts:
            if re.fullmatch(r"\d+/\d+", g): tparts.append(g); continue
            ge = html.escape(g, quote=False)
            if isinstance(lookup, dict):
                if g in lookup: tparts.append(lookup[g])
                elif ge in lookup: tparts.append(html.unescape(lookup[ge]))
                else: break
            else:
                if g not in lookup and ge not in lookup: break
                tparts.append(g)
        else:
            if not isinstance(lookup, dict): return "ok"
            out = fmt.format(*tparts)
            if fmt == "{0}: {1}" and lookup.get("__cjk__"): out = out.replace(": ", "：", 1)
            return out
    return None

def walk_blocks(doc):
    """Yield ('block', el) for leaf blocks and ('text', node) for loose text nodes in mixed containers."""
    for el in doc.find_all(True):
        if el.name in SKIP or any(p.name in SKIP for p in el.parents if p.name): continue
        if not el.get_text(strip=True): continue
        if is_leaf(el):
            par = el.parent
            if par is not None and par.name not in (None, '[document]') and is_leaf(par) and par.get_text(strip=True): continue
            if has_words(el.get_text()): yield ('block', el)
        else:
            for ch in el.children:
                if type(ch) is NavigableString and has_words(str(ch)): yield ('text', ch)

ATTRS = ("aria-label", "title", "placeholder")

def collect(pages):
    keys = {}
    for path, h in pages.items():
        d = BeautifulSoup(h, "html.parser")
        for kind, x in walk_blocks(d):
            k = norm(x.decode_contents()) if kind == 'block' else norm(str(x))
            if k: keys.setdefault(k, path)
        for el in d.find_all(True):
            for a in ATTRS:
                v = el.get(a)
                if v and has_words(v): keys.setdefault(norm(v), path)
        t = d.find("title"); keys.setdefault(norm(t.get_text()), path)
        for m in d.find_all("meta"):
            if m.get("name") == "description" or m.get("property") in ("og:title", "og:description"):
                keys.setdefault(norm(m["content"]), path)
    keys = {k: v for k, v in keys.items() if "{SCRIPTS}" not in k}
    keys.setdefault("Briefing", "play")
    base = set(keys)
    return {k: v for k, v in keys.items() if not derive(k, base - {k})}

def translate_page(h, tr):
    d = BeautifulSoup(h, "html.parser")
    def get(k):
        v = tr.get(k)
        return v if v is not None else derive(k, tr)
    miss = 0
    for kind, x in list(walk_blocks(d)):
        if kind == 'block':
            k = norm(x.decode_contents()); v = get(k)
            if v is None: miss += 1; continue
            x.clear(); x.append(BeautifulSoup(v, "html.parser"))
        else:
            raw = str(x); k = norm(raw); v = get(k)
            if v is None: miss += 1; continue
            lead = raw[:len(raw) - len(raw.lstrip())]; trail = raw[len(raw.rstrip()):]
            x.replace_with(lead + v + trail)
    for el in d.find_all(True):
        for a in ATTRS:
            v = el.get(a)
            if v and has_words(v):
                t = get(norm(v))
                if t is not None: el[a] = t
                else: miss += 1
    t = d.find("title")
    if t and get(norm(t.get_text())): t.string = get(norm(t.get_text()))
    for m in d.find_all("meta"):
        if m.get("name") == "description" or m.get("property") in ("og:title", "og:description"):
            v = get(norm(m["content"]))
            if v: m["content"] = v
    return str(d), miss

def js_keys(src):
    """Every string literal passed (directly or via a ternary) to T(...)."""
    keys = []
    for m in re.finditer(r'(?<![\w$.])T\(', src):
        i = m.end(); depth = 0
        while i < len(src):
            c = src[i]
            if c in '"\'':
                q = c; j = i + 1; buf = []
                while src[j] != q:
                    if src[j] == '\\': buf.append(src[j+1]); j += 2; continue
                    buf.append(src[j]); j += 1
                keys.append(''.join(buf))
                i = j + 1; continue
            if c == '`':
                j = i + 1
                while src[j] != '`':
                    j += 2 if src[j] == '\\' else 1
                i = j + 1; continue
            if c in '([{': depth += 1
            elif c in ')]}':
                if depth == 0: break
                depth -= 1
            elif c == ',' and depth == 0: break
            i += 1
    return [k for k in keys if has_words(k)]

def data_keys(app, gx):
    ks = []
    ks += re.findall(r'\bq:"([^"]+)"', app) + re.findall(r'\bw:"([^"]+)"', app) + re.findall(r'\bname:"([^"]+)"', app)
    for a, b in re.findall(r'\["([^"]+)",[\d.e]+,"([^"]*)"\]', app): ks += [a, b]
    ks += re.findall(r'\["([^"]+)",0\.\d+,[\d.]+\]', app)
    ks += re.findall(r'\["([^"]+)",\d+,\(a,b\)', app)
    m = re.search(r'const CATN=\[(.*?)\];', app); ks += re.findall(r'"([^"]+)"', m.group(1))
    ks += re.findall(r'\["([^"]+)",[\d/.]+,"[^"]*"\]', gx)
    ks += re.findall(r'\["([^"]+)",[\d/.]+,\[', gx)
    ks += re.findall(r'\["([^"]+)",\d+\]', gx)
    ks += ["buy", "sell", "pass", "call", "fold"]
    return [k for k in ks if has_words(k)]

def load_tr(lang):
    tr = {}
    for f in sorted(glob.glob(f"{ROOT}/i18n/{lang}*.txt")):
        for line in open(f, encoding="utf-8"):
            line = line.rstrip("\n")
            if "|||" not in line or line.startswith("#"): continue
            k, v = line.split("|||", 1)
            tr[k.strip()] = v
    return tr

# ---------------------------------------------------------------- JS sources
def build_js():
    src = open(ROOT + "/site/app.js").read()
    src = i18n_app(src)
    parts = re.split(r"\n(?=/\* ---------- )", src)
    GUARD = {"F1 EV table": "evTable", "F2 linearity": "ldCanvas", "F3 stopping": "stTable", "F4 Bayes": "byCanvas",
     "F5 Kelly": "kCanvas", "G1 Card game": "cgQ", "G2 Dice market making": "mdDice", "G3 Trading game": "tgCards",
     "G4 ETF arbitrage": "etTable", "G5 Fermi": "fmQ", "G6 Event contracts": "evcQ", "G7 Higher or lower": "hlCard",
     "G8 Betting board": "bbTable", "Poker: pot odds at the table": "poVill", "Poker: evaluator + equity": "eqH",
     "Poker: bluff calc": "blP", "Bridge": "brM"}
    PROGRESS = r'''/* ---------- progress ---------- */
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
let done={};try{done=JSON.parse(store.get("pitbook-done")||"{}")}catch(e){done={}}
const TOTAL=%d;
function renderProg(){
  document.querySelectorAll("[data-done]").forEach(b=>{const on=!!done[b.dataset.done];b.setAttribute("aria-pressed",on);b.textContent=on?T("Done ✓"):T("Mark done")});
  document.querySelectorAll(".tick").forEach(t=>t.textContent=done[t.dataset.for]?"✓":"");
  const n=Object.keys(done).filter(k=>done[k]).length,p=$("progTxt");if(p)p.textContent=T("{0}/{1} done",Math.min(n,TOTAL),TOTAL)}
document.querySelectorAll("[data-done]").forEach(b=>b.addEventListener("click",()=>{done[b.dataset.done]=!done[b.dataset.done];store.set("pitbook-done",JSON.stringify(done));renderProg()}));
renderProg();
''' % len(ORDER)
    out, eqscene = [], None
    for p in parts:
        m = re.match(r"/\* ---------- (.*?) ---------- \*/", p); name = m.group(1) if m else None
        if name is None: out.append(p); continue
        if name == "progress": out.append(PROGRESS); continue
        if name == "right-hand progress rail": continue
        if name.startswith("smooth scroll"): out.append("})();\n"); continue
        if name.startswith("game kit"):
            p = p.replace('function sfx(t){if(!soundOn)return;', 'function sfx(t){try{window.EL3D&&window.EL3D.react(t)}catch(e){}if(!soundOn)return;')
            p = p.replace('const b=$("sndBtn");', 'const b=$("sndBtn");if(!b)return;')
            p = p.replace('$("sndBtn").onclick=', 'if($("sndBtn"))$("sndBtn").onclick=')
            assert "EL3D" in p and "if(!b)return" in p and "ELkit" in p
        if name == "Poker: pot odds at the table":
            i = p.index("function eqScene(){"); eqscene = p[i:].rstrip() + "\n"; p = p[:i]
        if name == "Poker: evaluator + equity": p = p.replace("\n", "\n" + eqscene, 1)
        if name in GUARD:
            hdr, body = p.split("\n", 1); p = f'{hdr}\nif($("{GUARD[name]}")){{\n{body.rstrip()}\n}}\n'
        out.append(p)
    app = "\n".join(out)

    sc = open(ROOT + "/scene.js").read()
    a = sc.index("/* ---------- scroll zones ---------- */"); b = sc.index("/* ---------- loop ---------- */")
    sc = sc[:a] + r'''/* ---------- presets, page mode, reactions ---------- */
const PAGE=document.body.dataset.scene3d||"";
const lobbyHud=document.querySelector("[data-hud]");
let current=null;
function go(name){if(!S[name]||name===current)return;current=name;hud=name==="fan"?lobbyHud:null;S[name]()}
const GOLD=new THREE.Color(0xdcb65e),TEAL=new THREE.Color(0x2ad1a0),GREEN=new THREE.Color(0x4fe0a2),RED=new THREE.Color(0xff4b3e);
function flash(col){if(reduce)return;kill(rimG);kill(rimT);rimG.color.copy(col);rimT.color.copy(col);rimG.intensity=3.2;rimT.intensity=2.2;
  to(rimG,{intensity:.9,duration:1.2,ease:"power2.out",onComplete:()=>rimG.color.copy(GOLD)});to(rimT,{intensity:.45,duration:1.2,ease:"power2.out",onComplete:()=>rimT.color.copy(TEAL)})}
function react(t){if(t==="good")flash(GREEN);else if(t==="bad")flash(RED);else if(t==="roll"&&current==="dice")roll()}
function dive(){camTo(cam.px,2.3,6.4,cam.lx,.5,cam.lz,cam.sx,.6)}

/* ---------- pointer ---------- */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(-9,-9),mouse={x:0,y:0,sx:0,sy:0};let over=false,hovered=-1;
addEventListener("pointermove",e=>{mouse.x=e.clientX/innerWidth*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;ndc.set(mouse.x,mouse.y);over=e.target===stage},{passive:true});
stage.addEventListener("click",()=>{
  if(current==="fan"){if(hovered>=0)heroDraw(hovered);return}
  if(current==="dice")roll();else if(current==="deal")dealRow(false);else if(current==="trade")dealRow(true);else if(current==="poker")pokerRun();
  else if(current==="bell")bellDrop(true);else if(current==="chips")book();else if(current==="hilo")hiloDeal()});

''' + sc[b:]
    rep = [("const shift=isSmall()?0:cam.sx", "const shift=(isSmall()||PAGE)?0:cam.sx,yo=(isSmall()&&!PAGE)?-.65:0"),
      ("camera.position.set(cam.px+shift+mx*.55,cam.py-my*.3,cam.pz);camera.lookAt(cam.lx+shift,cam.ly,cam.lz);",
       "camera.position.set(cam.px+shift+mx*.55,cam.py-my*.3+yo,cam.pz);camera.lookAt(cam.lx+shift,cam.ly+yo,cam.lz);"),
      ('stage.style.cursor=(hovered>=0||(over&&active&&active.classList.contains("slide")&&current!=="fan"))?"pointer":"";', 'stage.style.cursor=(hovered>=0||(over&&current!=="fan"))?"pointer":"";'),
      ('pick();if(!current){active=zones[0]||null;apply("fan",zones[0]||document.body)}', 'go(PAGE||"fan");'),
      ("window.EL3D={S,roll,heroDraw,get current(){return current}};", "window.EL3D={S,go,dive,react,roll,heroDraw,get current(){return current}};"),
      ('const sfx=t=>{', 'const T=window.T||(s=>s);\nconst sfx=t=>{'),
      ('''say("Pick any card from the fan. I'll tell you the odds that the <b>next</b> card is higher.")''', '''say(T("Pick any card from the fan. I'll tell you the odds that the <b>next</b> card is higher."))'''),
      ('''say("Card returned. Pick another.")''', '''say(T("Card returned. Pick another."))'''),
      ('''later(()=>say(`You drew ${nm(r,s)}. Of the ${n} cards left, ${hi} are higher, ${lo} lower and ${eq} tie.<br>P(${side}) = ${Math.max(hi,lo)}/${n} = <b>${(p*100).toFixed(1)}%</b>. At even money, Kelly stakes 2p − 1 = <b>${(k*100).toFixed(0)}%</b> on ${side}.${k===0?" No edge: don't bet.":""}`),500)''',
       '''later(()=>say(T("You drew {0}. Of the {1} cards left, {2} are higher, {3} lower and {4} tie.",nm(r,s),n,hi,lo,eq)+"<br>"+T(hi>=lo?"P(higher) = {0}/{1} = {2}. At even money, Kelly stakes 2p − 1 = {3} on higher.":"P(lower) = {0}/{1} = {2}. At even money, Kelly stakes 2p − 1 = {3} on lower.",Math.max(hi,lo),n,`<b>${(p*100).toFixed(1)}%</b>`,`<b>${(k*100).toFixed(0)}%</b>`)+(k===0?" "+T("No edge: don't bet."):"")),500)''')]
    for x, y in rep:
        assert sc.count(x) == 1, x[:60]; sc = sc.replace(x, y)
    return app, sc

# ---------------------------------------------------------------- write everything
def main():
    catalog_mode = len(sys.argv) > 1 and sys.argv[1] == "catalog"
    app, scene = build_js()
    files = {"app.js": app, "scene.js": scene}
    for f in ("i18n.js", "auth.js", "gauntlet.js", "board.js"):
        files[f] = open(f"{ROOT}/src/{f}").read()
    shell = open(ROOT + "/shell.js").read()
    shell = shell.replace('const tabs=[...document.querySelectorAll(".tab")];', 'const tabs=[...document.querySelectorAll(".tab[data-tab]")];')
    shell = shell.replace("/* ---------- full screen ---------- */", '''/* ---------- daily number in the lobby ---------- */
const dn=$("dailyNo");if(dn){const d=new Date();dn.textContent=T("No. {0}",Math.floor((Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())-Date.UTC(2026,9,21))/864e5)+1)}

/* ---------- full screen ---------- */''')
    assert 'tab[data-tab]' in shell and 'dailyNo' in shell
    files["shell.js"] = shell
    base = open(ROOT + "/site/styles.css").read().split("/* ================= After Hours")[0]
    base = re.sub(r"^/\* Edge Lab · After Hours\. Layout:.*?\*/\n\n/\* Layout:.*?\*/", "/* Edge Lab · After Hours. Base components: desks, cards, dice, chips, screens. */", base, flags=re.S)
    files["styles.css"] = base + open(ROOT + "/layer.css").read() + open(ROOT + "/src/v4.css").read()

    en = build_en(None)
    # English strings for translation
    keys = collect(en)
    jsk = []
    for f in ("app.js", "scene.js", "shell.js", "auth.js", "gauntlet.js", "board.js"):
        jsk += js_keys(files[f])
    jsk += data_keys(files["app.js"], files["gauntlet.js"])
    jsk = list(dict.fromkeys(jsk))
    if catalog_mode:
        os.makedirs(ROOT + "/i18n", exist_ok=True)
        with open(ROOT + "/i18n/catalog.txt", "w", encoding="utf-8") as fh:
            fh.write("# PAGE strings (HTML allowed, keep tags)\n")
            for k in keys: fh.write(f"{key_id(k)}|||{k}\n")
            fh.write("# JS strings ({0} placeholders, keep them)\n")
            for k in jsk:
                if k not in keys: fh.write(f"{key_id(k)}|||{k}\n")
        print("catalog:", len(keys), "page strings,", len(jsk), "js strings")

    # clean old outputs
    for l, _, _ in LANGS:
        if l != "en" and os.path.isdir(f"{OUT}/{l}"): shutil.rmtree(f"{OUT}/{l}")
    report = {}
    for lang, hl, _ in LANGS:
        tr_id = load_tr(lang) if lang != "en" else {}
        allk = list(keys) + [k for k in jsk if k not in keys]
        tr = {k: tr_id[key_id(k)] for k in allk if key_id(k) in tr_id}
        tr["__cjk__"] = lang in ("zh", "ja")
        pre = "" if lang == "en" else lang + "/"
        miss_total = 0
        for path, h in en.items():
            depth = path.count("/") + (0 if lang == "en" else 1)
            site = "../" * depth
            h2 = h.replace("{SITE}", site).replace("{LANG}", lang).replace("{HL}", hl).replace("{PRE}", pre)
            h2 = h2.replace("{SCRIPTS}", scripts(site, lang, EXTRA_JS.get(path, ())))
            if lang != "en":
                h2, miss = translate_page(h2, tr); miss_total += miss
            os.makedirs(os.path.dirname(f"{OUT}/{pre}{path}") or ".", exist_ok=True)
            open(f"{OUT}/{pre}{path}", "w", encoding="utf-8").write(h2)
        if lang != "en":
            d = {k: tr[k] for k in jsk if k in tr}
            os.makedirs(f"{OUT}/i18n", exist_ok=True)
            open(f"{OUT}/i18n/{lang}.js", "w", encoding="utf-8").write("window.EL_DICT=" + json.dumps(d, ensure_ascii=False, separators=(",", ":")) + ";\n")
            report[lang] = (miss_total, len([k for k in jsk if k not in tr]))
        # per-language manifest
        man = {"name": "Edge Lab", "short_name": "Edge Lab", "lang": hl,
               "description": "Trading-interview games: market making, ETF arbitrage, Bayes, Kelly sizing and poker maths.",
               "start_url": "./index.html", "scope": "./" if lang == "en" else "../", "display": "standalone",
               "background_color": "#050a08", "theme_color": "#050a08", "orientation": "any",
               "icons": [{"src": f"{'' if lang=='en' else '../'}icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
                         {"src": f"{'' if lang=='en' else '../'}icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
                         {"src": f"{'' if lang=='en' else '../'}icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}],
               "shortcuts": [{"name": "Daily Gauntlet", "url": "./play/daily.html"}, {"name": "Leaderboard", "url": "./play/leaderboard.html"}]}
        if lang != "en":
            md = tr.get(norm(man["description"]))
            if md: man["description"] = md
        open(f"{OUT}/{pre}manifest.webmanifest", "w", encoding="utf-8").write(json.dumps(man, ensure_ascii=False, indent=1))
    for f, s in files.items():
        open(f"{OUT}/{f}", "w", encoding="utf-8").write(s)
    # service worker
    core = ["index.html", "styles.css", "i18n.js", "auth.js", "app.js", "scene.js", "shell.js", "gauntlet.js", "board.js",
            "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "play/daily.html"] + \
           [f"{l}/index.html" for l, _, _ in LANGS if l != "en"] + [f"i18n/{l}.js" for l, _, _ in LANGS if l != "en"] + LIBS + \
           ["https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@300;500;700;800&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap"]
    ver = hashlib.sha1("".join(files.values()).encode() + json.dumps(report).encode()).hexdigest()[:10]
    sw = open(ROOT + "/src/sw.js").read().replace("__VERSION__", ver).replace("__CORE__", json.dumps(core, indent=0))
    open(f"{OUT}/sw.js", "w").write(sw)
    print("built", len(en), "pages x", len(LANGS), "langs; sw", ver)
    for l, (m, j) in report.items(): print(f"  {l}: {m} page strings untranslated, {j} js strings untranslated")

if __name__ == "__main__":
    main()
