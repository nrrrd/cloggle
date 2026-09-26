# cloggle
a simple word game for your phone

## Files

| file | what it is |
| --- | --- |
| `index.html` | the whole game — markup, styles, script, and the bundled ENABLE word list |
| `sw.js` | service worker: precaches the app so it runs with no network |
| `manifest.json` | web app manifest (installs to the home screen, standalone, no browser chrome) |
| `icon-192.png`, `icon-512.png` | manifest icons (`any maskable`) |
| `apple-touch-icon.png` | iOS home-screen icon |
| `vendor/qrcode.min.js` | QR encoder ([qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator), MIT) |
| `vendor/jsqr.min.js` | QR decoder ([jsQR](https://github.com/cozmo/jsQR), Apache-2.0, see `vendor/jsqr.LICENSE`); loaded only when scanning |

## Playing with friends

There's still no server: a game travels as a link. The URL hash carries the board
(`b`, 16 or 25 letters, `Q` meaning Qu), the min-length rule (`m`), a random game id
(`g`), the sender's device id and name (`p`, `n`) and, once they've played, their
words (`w`). Whoever opens it gets that exact board with the tiles face down until they
Shake. Their device re-solves the board and rescores the sender's words, so a link
can't claim points the board doesn't contain.

- **Challenge a friend** appears after every round and sends that board plus your words.
- **Friends → Send a new board** sends an unplayed board so you can both play side by side
  (tap Shake together; each round is its own 3-minute timer).
- When the other person finishes, they tap **Send my result** — the same kind of link.
  Opening a link for a board you've already played merges their result into your log and
  shows the head-to-head (raw score, and classic Boggle score where shared words cancel).
- **Friends** shows your won–lost–tied record per person; logged games against friends
  are tappable in both Friends and Stats.

**Sitting together:** every "send" shows a QR code first (with "Send as a link instead" for
remote friends). The other phone taps **Scan** (after a round) or **Friends → Scan a code**
and reads it with the in-app camera — no network needed. To compare at the end, each of you
shows your result code and scans the other's, so both phones log the full head-to-head.

Every logged game keeps its board. Tap a row in Stats or Friends to see the board, everyone's
words, and the words nobody found; tap a word to light up its path.

On iPhone, links open in Safari rather than the installed home-screen app, and the two have
separate `localStorage`. Paste the link into **Friends → Open a link** to keep everything in
the app.

## Offline

The game is entirely local — no accounts, no server, no network calls — so once the
service worker has cached it, everything works in airplane mode: the board, the
171k-word dictionary, the solver, and the stats (which live in `localStorage`).

The fetch handler is **network-first** for same-origin requests, falling back to the
cache when the network fails. That keeps you on the freshest deploy whenever you have
a connection, at the cost of re-downloading `index.html` (~1.7 MB) on each online
launch. Requests to other origins are never intercepted, and Firebase/gstatic/
googleapis hosts are additionally bypassed by name.

A small `offline` badge appears in the header when the browser reports no connection.
Nothing in solo play degrades; the badge exists so that anything online (multiplayer,
if it ever lands) can report itself as unavailable instead of throwing. The hook for
that is `window.cloggleNet.reportNetworkFailure()` — call it when a backend connection
fails and the UI drops into its offline state.

Service workers only run over `https://` (or `localhost`). Opening `index.html` as a
`file://` URL still plays fine, it just won't install or cache.

## Deploying

1. Bump `CACHE_VERSION` in [`sw.js`](sw.js) — `"v1"` → `"v2"`, and so on.
2. Push.

**The phone needs one online launch to pick up the new version.** The already-installed
worker serves the old cache until it can reach the network, notice the changed `sw.js`,
install the new cache, and delete the old one. If a device has been offline since before
the deploy, it keeps playing the previous version until it next opens the app with a
connection — and, because the new worker activates immediately on install, it may take
that one launch plus a reload to see the change. Forgetting to bump `CACHE_VERSION` means
the old cache is never cleared and the update can go unnoticed for much longer.
