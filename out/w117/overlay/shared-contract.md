# CTL-02 remaining overlay-priority shared contract

**Wave:** 117. Design only. No overlay mutex ships in this wave.  
**Status:** MERGE LAW for `docs/Ctl02OverlayDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1 overlay-priority** (named only).  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Ctl01DockBindDesign.md`, `docs/Nav05HandoffDesign.md`, `docs/Nav*.md`, `docs/Hud*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave117.md`. Do not write sibling Wave 117 paths (`out/w117/nav05/**`, `out/w117/ctl01/**`). Do not steal `out/w116/**`.  
**Locked sources:** wishlist IDEA (P1, OVERLAYS) hail/chart/berth stack + "Let them go" reopen (**cite, do not edit**); live inventory `out/w117/overlay/current-overlay-inventory.md` (code wins); Wave 40 title = `systems[0]` capture + z-index ladder; CTL-01 KeyJ (**cite, do not remap**); NAV-05 `showApLive` / chart-open-on-engage (**cite, do not steal**).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale Wave 40 “banners 30” copy (live galaxy chart is z-index 30).

**This leftover is one overlay-priority + pause policy for Hail, Galaxy Chart, and Berth Records, plus a fail-closed hail calm gate.** It is **not** CTL-01 KeyJ. It is **not** NAV-05 AP handoff. It is **not** P2 close-chart-on-AP. It is **not** P1 toast-flood. It is **not** P2 chart-label a11y. It is **not** HUD-02 combat rails.

**Live stack:** hail z 40 + chart z 30 + berth z 60 can all be open while `world.time` advances. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No overlay pip on the aim glass. **Do not** steal Digit 0/8/9. **No new Digit.** Digit 0 stays shipyard (`station.js` 188, 6100–6102). Digit 8 dock root stays launch. Digit 9 dock root stays epics. Hail Digit **1–n** stay as hail shortcuts **only while hail is the exclusive top play card**.
3. KeyH stays hail. KeyM stays chart. KeyL stays berth. KeyP stays pause. KeyO stays settings. **Do not remap those keys.** CTL-01 **KeyJ** is a sibling dock/jump bind — **cite, do not remap**.
4. `innerHTML` forbidden later. Overlay copy / buttons / meta use `textContent` / `createTextNode` / `h()` / `el()` only. Live hail already uses `textContent` (`hail.js` 343, 348–354, 391). **No** `insertAdjacentHTML` / `document.write`.
5. `src/game/state.js` is READ-ONLY later. **No** HUD fields on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit.
6. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Calm is **session** (`ai.calmUntil` already instance-only). Overlay open flags are **session** (mirror `flags.chartOpen`). Autosave stays `rimward-save-v1`. Settings stay `rimward-settings-v1`.
7. Fail closed:
    - Never freeze the sim forever. Hail / chart / berth **must not** set `ctx.flags.paused`. Title / origins / models / KeyP already pause — **keep**.
    - Never throw. Unknown overlay → do not invent flags beyond the deputized session booleans. Skip the open. Keep flying.
    - Title open (`#rw-title`), models open, or typing in INPUT/TEXTAREA/SELECT/contentEditable → do not toggle hail/chart/berth from keys. Never throw.
    - Deferred hail whose ship is gone, destroyed, or still in calm → **drop**. Do not open a ghost card.
    - If the helper is missing, live openers keep today’s behavior. **Never stop** the loop.
8. NAV-05: later write-set **must not** claim `galaxychart.js` `showApLive` / `#rw-galaxy-ap-live` AP live line. Chart-open-on-engage **stays** (do **not** steal P2 close-chart-on-AP). `autopilot.js` is **forbidden**.
9. Later write-set **must not** claim HUD-02 combat rails in `src/systems/hud.js`. **Must not** claim `src/systems/controls.js` KeyJ remap (CTL-01). Fire-suppress-while-`chartOpen` (`controls.js` 465) is **not** this leftover.
10. P1 toast-flood is a **different** inbox item. Do **not** dedupe toasts. Do **not** raise `.rw-toasts` z-index. P2 chart-label a11y — do **not** make labels into hit targets here.
11. Wave 40: `initTitle` stays `systems[0]`. Settings stays able to open over title (z 80). Do **not** invert title capture. Do **not** put play overlays above `#fatal` (99).
12. Prototype-safe later helpers: authored overlay ids only (`hail` / `chart` / `berth`). Never `for-in` a save blob into policy. Never parse untrusted HTML into cards.
13. CPU: **no** per-frame DOM alloc for the mutex. Hail already rebuilds **on open only**. Helper is boolean reads.
14. Do not edit sibling Bio/Nav/Msn/Rep/Shp/Tgt/Hud leftover docs, wishlist, `PROGRESS.md`, `docs/Ctl01DockBindDesign.md`, `docs/Nav05HandoffDesign.md`. Do not write `docs/OwnerDecisionsWave117.md`. Deputize defaults live in **this** contract.
15. Do not steal `out/w117/nav05/**`, `out/w117/ctl01/**`, `out/w116/**`.
16. Do not “fix” known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul).
17. `reducedMotion`: do **not** invent overlay animation. Existing chart/hail have no required new motion.
18. Accessibility: mutex must not strand a player with **no named close**. Chart and berth already name L/M/Escape. Hail close stays **numbered intents** (live). Do **not** add Escape-dismiss-hail as required PR1 (that would alias `keepFiring`). Color is not the only cue: keep `[n]` + verb text on hail buttons.

---

## 0.1 Wave 117 deputize (owner may override after playtest)

Pick a playable **overlay-priority / pause / hail-calm** default. Inventory proves **stacking is LIVE** and **hail reopen is LIVE**. Do not park. Do not invent UU / SKU / Digit / persist key.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| Hail z | 40; sim live | `hail.js` 8–9, 108 |
| Chart z | 30; sim live; `chartOpen` | `hud.css` 1908; `galaxychart.js` 422 |
| Berth z | 60; sim live; local `berthOpen` | `save.js` 1352, 1382–1388 |
| Pause z | 50; freezes `system.update` | `main.js` 149–176 |
| Settings z | 80; KeyO; no pause | `settings.js` 93, 228–234 |
| Title z | 70; capture; `systems[0]` | `screens.css` 507; `main.js` 105 |
| `letGo` live calm | `world.time + 30` | `hail.js` 192 |
| `letGo` salvage calm | **none** | `hail.js` 185–186 |
| `openCard` calm check | **none** | `hail.js` 326–403, 421 |
| `ai.hailed` reset | never on instance | `npc.js` 227, 1415 |

Do **not** “fix” stacking by pausing the world under hail/chart/berth. Inbox asked for **priority + defer + calm**, not a stuck pause.

### Playable policy (smallest additive)

**Name:** one exclusive play card among hail / chart / berth. Incoming hail **defers**. Calm **gates** reopen. Sim **stays live**.

| Piece | Freeze |
|---|---|
| Exclusive set | Hail, Galaxy Chart, Berth Records. **At most one** of these three `open` at a time. |
| Already-open player card | Chart or berth **stays**. Incoming `hailOpened` **defers** (one session slot). Do not yank the chart mid-plot. |
| Player KeyM / KeyL while hail open | **Refuse.** Hail stays until an intent, ship death, or `hailClosed`. |
| Player KeyH while chart/berth open | **Refuse.** Do not steal KeyH. |
| Settings / title / models / pause | **Not** in the exclusive set. Wave 40 settings-over-title stays. KeyP still pauses. Models still pause. |
| Pause policy | Hail / chart / berth **never** write `flags.paused`. Combat hail stays live. Chart `aria-modal=false` stays. Berth “records hold while you fly” stays. |
| Defer flush | When the blocking card closes, open deferred hail **iff** ship still in `ctx.ships`, not destroyed, and `now >= ai.calmUntil`. Else drop. |
| Defer is DOM-only | Do **not** suppress `hailOpened` / `hailClosed` world events (`npc.js` demand hold, `song.js` cues). Skip **`openCard` only**. Do **not** add a toast (P1 toast-flood is another inbox). |
| Hail calm gate | `openCard` / KeyH salvage **must not** open when `live.ai.calmUntil` is in the future vs `ctx.world.time`. |
| Salvage `letGo` | Set `ai.calmUntil = world.time + 30` (same as live "Let them go"). Session only. |
| Persist | **none**. |
| Helper | New `src/systems/overlay-policy.js` (name only). Booleans + defer slot. |
| Session flags | May add `ctx.flags.hailOpen` / `ctx.flags.berthOpen` (writers: hail.js / save.js), mirroring `chartOpen`. **Not** `WORLD_FIELDS`. |
| Fail-closed | Title / models / typing → no toggle. Missing ship → drop defer. Never throw. Never freeze. |
| Z-index | Prefer **no** `hud.css` change if mutex holds. If required, only play-card comments/ladder; **never** raise play cards over settings (80) or fatal (99). |
| Home | hail.js + save.js berth + helper + chart `setOpen`/KeyM **mutex only**. |

Owner freeze (do not invert):

- Stacking of hail + chart + berth is a **bug**, not a feature. Not CONSUME.
- Do **not** pause the sim to fake exclusivity.
- Do **not** persist calm or overlay flags.
- Do **not** steal KeyJ, Digit 0/8/9, NAV-05 `showApLive`, or close-chart-on-AP.
- If allowlist skip fires, flight still works. **Never stop.**

### Formulas (later impl; named only — **do not implement**)

```
// MUTEX — at most one of hail | chart | berth
// already-open chart/berth wins vs incoming hailOpened → defer
// hail already open → refuse KeyM / KeyL open

function canShowHail(ctx, ship) {
  if (!ship || !ship.state || ship.state.destroyed) return false
  if (now < (ship.ai && ship.ai.calmUntil || 0)) return false
  if (chartOpen || berthOpen) return 'defer'
  return true
}

// LIVE letGo — keep 30s; ALSO write on salvage letGo
ai.calmUntil = ctx.world.time + 30

// NEVER
ctx.flags.paused = true   // from hail/chart/berth
WORLD_FIELDS.push('hailCalm')
```

Do **not** persist the defer slot. Do **not** write `showApLive` from the helper. Do **not** close the chart on AP engage.

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / serial **none** | **Forbidden** — stack + reopen live |
| Pause sim under hail/chart/berth | **Forbidden** §0.7 |
| Swallow `hailOpened` to fake defer | **Forbidden** — skip `openCard` only; keep world events / song |
| Persist calm / overlay flags | **Forbidden** §0.6 |
| Steal Digit 0/8/9 / hub pip | **Forbidden** §0.2 |
| Remap KeyH/M/L or KeyJ | **Forbidden** §0.3 |
| Claim `autopilot.js` | **Forbidden** §0.8 |
| Claim `galaxychart.js` `showApLive` | **Forbidden** §0.8 |
| Close chart on AP engage | **Forbidden** — P2 inbox §0.8 |
| Toast-flood dedupe / toast z-index | **Forbidden** §0.10 |
| Chart-label a11y | **Forbidden** §0.10 |
| HUD-02 combat rails / `hud.js` | **Forbidden** §0.9 |
| CTL-01 `controls.js` KeyJ | **Forbidden** §0.9 |
| `innerHTML` hail lines | **Forbidden** §0.4 |
| `state.js` write | **Forbidden** §0.5 |
| Escape = dismiss hail as required PR1 | **Forbidden** §0.18 |
| New Digit / UU / SKU | **Forbidden** |
| Aim-glass gauges | **Forbidden** §0.2 |
| Freeze the sim on helper miss | **Forbidden** §0.7 |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| Hail DOM `open` + `openCard` calm gate | PR1 `hail.js` | Digit shortcuts; HUD none |
| `ctx.flags.hailOpen` (optional session) | PR1 `hail.js` | helper; chart/berth openers |
| `ctx.flags.berthOpen` (optional session) | PR1 `save.js` berth only | helper; hail defer |
| `ctx.flags.chartOpen` | **live** `galaxychart.js` `setOpen` | AP/AM; controls fireHeld; PR1 mutex |
| Chart KeyM / `setOpen` mutex | PR1 `galaxychart.js` **open gate only** | — |
| `showApLive` | **none** (NAV-05) | chart AP line |
| Overlay helper | PR1 `src/systems/overlay-policy.js` | hail / berth / chart openers |
| `ai.calmUntil` on salvage `letGo` | PR1 `hail.js` | hail.js gate; npc `updateResolve` |
| Defer slot | helper session | hail flush |
| `flags.paused` | **none** from this leftover | main loop |
| `state.js` / WORLD_FIELDS | **none** | — |
| Digit 0/8/9 / KeyJ / KeyT/V/K/X | **none** | consume |
| `hud.js` combat rails | **none** | — |
| `autopilot.js` | **none** | — |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| `#rw-title` present | no KeyM/KeyL/KeyH overlay toggle (title already capture-swallows most keys; KeyO still settings) |
| `ctx.models.isOpen()` | no play-card toggle |
| Focused INPUT / TEXTAREA / SELECT / contentEditable | no play-card toggle |
| Chart open, `hailOpened` | defer; do not `openCard`; sim live |
| Berth open, `hailOpened` | defer |
| Hail open, KeyM / KeyL | ignore open |
| `now < ai.calmUntil` | no `openCard`; no KeyH salvage reopen |
| Deferred ship despawned / destroyed | drop defer |
| Pause KeyP | freeze loop as live; do **not** open chart/berth (live); do **not** add pause from hail |
| Docked | chart/berth already close (live). Keep. Hail in space only |
| `reducedMotion` | n/a new motion |
| Helper import missing | skip mutex; **never throw**; never pause |
| Settings open | may cover play cards (Wave 40). Hail digits: later PR1 **must not** resolve hail while settings/title/models own the screen |
| Partial merge (calm gate without mutex) | calm still helps; stack may remain until mutex lands — PR1 must land **both** |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 overlay-priority** | Mutex hail/chart/berth; defer incoming hail; `openCard`/KeyH calm gate; salvage `letGo` +30s calm; optional session flags; helper; chart KeyM/`setOpen` **mutex only**; hail Digit skip while covered by settings/title | `state.js`; Digit remap; persist; `autopilot.js`; `showApLive`; close-chart-on-AP; toast-flood; chart-label a11y; KeyJ; HUD-02 rails; `innerHTML`; pause-the-sim |
| **PR2 stills (optional)** | Playtest stills of mutex + let-go calm | Required if PR1 code is enough; toast-flood; known FAILs |
| **PR3 census (optional skip)** | Re-grep: no hail+chart+berth triple open; `openCard` reads `calmUntil`; salvage `letGo` writes calm | New world field |

---

## 4. Later write-set (named files; do not write this wave)

**Allowed (narrow):**

- `src/systems/hail.js` — mutex consumer; calm gate; salvage `letGo` calm; optional `flags.hailOpen`; Digit skip when not exclusive top / when title-settings-models
- `src/game/save.js` — **berth overlay only** (`setBerthOpen` / KeyL / update close). Not WORLD_FIELDS. Not death recover. Not autosave math
- `src/systems/overlay-policy.js` — **new** helper (mutex + defer slot)
- `src/systems/galaxychart.js` — **`setOpen` / KeyM open gate only**. Forbidden: `showApLive`, AP button, hover, labels, hit discs
- `src/core/ctx.js` — optional `flags.hailOpen` / `flags.berthOpen` defaults + comments only
- `src/ui/hud.css` — **only if required** after mutex; z-index comments for play cards. Prefer **none**

**Forbidden:**

- `src/game/autopilot.js`
- `src/systems/controls.js` (KeyJ remap / TRACKED / help — CTL-01)
- `src/systems/galaxychart.js` `showApLive` / `#rw-galaxy-ap-live`
- `src/systems/hud.js` combat rails / toasts
- `src/game/state.js`
- `src/systems/station.js` Digit map
- `public/**`, `package.json`, wishlist, `PROGRESS.md`
