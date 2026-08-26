## Status
CLEAN

## What I tested
Live browser on Vite **5173** only (`npx vite --port 5173 --strictPort --host 127.0.0.1`). Playwright drove http://127.0.0.1:5173. New Game → origin Freehold Greenhand. Inspected `window.__ctx` (lock, fear, flags, events). Hooked `ctx.emit` for `hailMiss` / `fearChanged` / `hailOpened` only. Did not grant credits. Did not teleport as a cheat hail. Did not start CDP 9410. Did not steal Vite 5174 (NAV-09 tab left running).

Player flows:
1. KeyH, no lock → toast `No lock — hail`, class `warn`. Fear 0→0. Hail card `display:none`. `flags.paused` false. Event `{ name: 'No lock', verb: 'hail', reason: 'none' }` (no `ship`).
2. KeyT lock live friendly Hauler Mink → KeyH → `Hauler Mink — no hail`. Fear 0. No card. `paused` false. Event `no-hail` with integer `dist` on the event, **not** in the toast or linger key.
3. Galaxy Chart KeyM → KeyH no lock → `No lock — hail blocked (chart)`. Chart stayed. `paused` false.
4. Lock Watchful Apt + chart → `Watchful Apt — hail blocked (chart)`. Chart stayed. `paused` false.
5. Far from pad and gate (865 u station / 2146 u gate) → KeyJ → `Freehold Landing — dock out of range (865 u)`. No dock. No jump. `paused` false. Toast `innerHTML` was the same text (no markup). Repeat KeyJ coalesced to **one** `warn` slot (HUD-04 linger; distance not a second stack).
6. Nearer gate than station but outside zone (123 u) → KeyJ → `Veridian Reach — jump not in zone`. No jump. `sys` stayed `freehold`.
7. Disabled hull >600 u (Red Marlow 1295 u) → KeyH → `Red Marlow — salvage out of range (1295 u)`. Integer `u`. No card. Fear 0. `paused` false.
8. Disabled hull ≤600 u (Carver Illyx ~50 u) → KeyH → salvage card opened (`hailOpened`, card `display:block`). **No** `hailMiss` that press. Second KeyH while card open: **no** `hailMiss` (no dual-stack). `paused` false. Fear 0.
9. Berth KeyL → KeyH → `Carver Illyx — hail blocked (berth)`. Berth stayed. `paused` false. Esc closed berth.

Static:
- `src/systems/hail.js` exports `emitHailMiss`; KeyH/KeyJ leftover `dockPressed` miss emit; `bumpFear` only on hail-card resolve (capitulation / ransom / Q-ship), **not** the miss path; no `flags.paused` write (comment only).
- `src/systems/hud.js` `toastForEvent` `case 'hailMiss'` → `hailMissToast`; linger key ``warn|hailmiss|{verb}|{reason}|{keyName}`` with no distance; `pushToast` uses `textContent`; `hud.js` has **zero** `innerHTML`.
- `src/core/ctx.js` frozen comment `'hailMiss' { name, verb, reason, dist }`.

Console: Playwright `error`/`warning` all-session: **0** errors. No hailMiss-related errors.

## Bugs found
None that fail Hail02 PR1 miss-feedback (named miss toast, primitive event, no pause, no Fear, no fake card, no dual-stack on an open hail card, linger key without distance).

Coverage gaps (not failures): live `calm` miss not reached; NPC demand Hail01 card not opened as a demand (salvage card used for dual-stack). In-range / out-of-range salvage used an existing hull with `state.disabled = true` after no disabled hull was in the cast; player was not teleported for those presses.

## Environmental issues
- `[ENV]` Playwright later had a second tab on **5174** (NAV-09). One KeyJ/dock probe ran against 5174 and is **discarded**. All accepted evidence is 5173. 5174 was not stopped. 5173 tab closed. Vite PID 50848 killed. Ports: **5173 not LISTENING**, **9410 not LISTENING** (TIME_WAIT leftovers only).
- `[ENV]` Graph resolve: `execute_workflows` → `codex/workflow-browser-assisted-work`. Local report only; no external send.

## Evidence
Stills under `out/w129/hailmiss/verify/`:

| File | State |
|---|---|
| `01-no-lock-hail.png` | `No lock — hail` |
| `02-friendly-no-hail.png` | `Hauler Mink — no hail` |
| `03-chart-no-lock-blocked.png` | `No lock — hail blocked (chart)` |
| `04-chart-named-blocked.png` | `Watchful Apt — hail blocked (chart)` |
| `05-dock-out-of-range.png` | `Freehold Landing — dock out of range (865 u)` |
| `06-jump-not-in-zone.png` | `Veridian Reach — jump not in zone` |
| `07-salvage-out-of-range.png` | `Red Marlow — salvage out of range (1295 u)` |
| `08-salvage-card-no-miss.png` | Salvage card open; no miss toast that frame |
| `09-berth-blocked.png` | `Carver Illyx — hail blocked (berth)` |

Linger key (no dist):

```791:791:src/systems/hud.js
    return { text, cls: 'warn', key: `warn|hailmiss|${verb}|${reason}|${keyName}` };
```

Emit helper (primitives, optional integer `dist`):

```188:205:src/systems/hail.js
export function emitHailMiss(ctx, raw) {
  try {
    if (!ctx || typeof ctx.emit !== 'function') return;
    const verb = raw && typeof raw.verb === 'string' ? raw.verb : '';
    const reason = raw && typeof raw.reason === 'string' ? raw.reason : '';
    if (HAIL_MISS_VERBS.indexOf(verb) < 0) return;
    if (HAIL_MISS_REASONS.indexOf(reason) < 0) return;
    let name = raw && typeof raw.name === 'string' ? raw.name : '';
    if (!name) {
      if (reason === 'none') name = 'No lock';
      else if (verb === 'dock') name = 'Station';
      else if (verb === 'jump') name = 'Gate';
      else name = 'No lock';
    }
    const payload = { name, verb, reason };
    const dist = raw && typeof raw.dist === 'number' ? raw.dist : NaN;
    if (Number.isFinite(dist)) payload.dist = Math.round(dist);
    ctx.emit('hailMiss', payload);
```
