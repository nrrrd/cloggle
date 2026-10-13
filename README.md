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
| `vendor/firebase.min.js` | Firebase JS SDK (app, auth, database; Apache-2.0), bundled with esbuild; loaded only for online play |
| `database.rules.json` | security rules for the Realtime Database (paste into the console's Rules tab) |
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

**Results** (after any round, or tap any logged game) work for any number of players:
the headline is the share of the board's words each player found (flip to points with the
toggle), then a side-by-side table — words, points, score with shared words cancelled, best
word, words only that player found, words in common with you — and every word the board
holds, highest-scoring first (or A–Z), with a ✓ under each player who found it and ★ where
only one did. Tap a word to light up its path. **Play this board again** and **Challenge with
this board** are at the bottom.

**Pause** (❚❚ next to the clock) stops the timer and hides the letters; the app also pauses
itself when it goes to the background. Paused rounds are marked in results and the leaderboard.

**Stats → Leaderboard** ranks every result on this device (yours and friends') for one
size/min-length; **Stats → Boards** lists each distinct board with its plays and best result.

On iPhone, links open in Safari rather than the installed home-screen app, and the two have
separate `localStorage`. Paste the link into **Friends → Open a link** to keep everything in
the app.

## Online play

Optional, and off until `FIREBASE_CONFIG` near the bottom of `index.html` is filled in with a
Firebase project's web config (free Spark plan: Anonymous sign-in, a Realtime Database, the
GitHub Pages host under Authentication → Settings → Authorized domains, and the contents of
`database.rules.json` pasted into Realtime Database → Rules). Each phone signs in anonymously.

Invites are still the QR code / link (with an extra `o=` flag); the server carries who joined,
the start time, live word counts, and finished words. Everyone's phone rescores every word.

- **Live game** (Friends → Live group): a lobby with ready buttons. When everyone is ready, the
  host's phone sets a start time five seconds out and every phone counts down on the server's
  clock, so the round starts and ends together. No pausing. Others' live word counts are shown
  unless you hide them (lobby or Friends), a per-person setting.
- **Live 1-on-1** (Friends → Live 1-on-1): a waiting room with no ready buttons; the countdown
  starts the moment the second person joins.
- **No link needed after the first game:** everyone you've played online is listed under
  Friends → Play online. **Play live** puts you in a waiting room and pops an invite up in their
  app (Join / No); **Send a board** offers them a play-when-you-can game the same way. Tick two or more people for a **live group** game (ready buttons) or to send them all a board.
  **⋯ → Remove** takes someone off your list (they can still invite you); **⋯ → Block** also makes
  the server refuse their invites (undo under the list). Their
  app has to be open to see it — there are no push notifications. Live invites expire after
  15 minutes, play-when-you-can invites after a week.
- **Play-when-you-can** (Friends → Play-when-you-can): play any time; you see who has
  played but not what they got until you've posted your own result. That's enforced by the
  database rules, not just hidden in the app.
- Results arrive by themselves and merge into your log; games are followed for a month, and a
  result posted while offline is retried on the next online launch. If the server can't be
  reached, an online invite opens as an ordinary offline board.

Local testing: run `firebase emulators:start --only database,auth --project demo-cloggle` with
this `database.rules.json` and open `index.html?emu`.

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
