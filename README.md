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
