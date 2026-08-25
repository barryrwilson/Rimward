# NAV-05 remaining autopilot gate handoff shared contract

**Wave:** 116. Design only. No handoff feature ships in this wave.  
**Status:** MERGE LAW for `docs/Nav05HandoffDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Nav01RouteDesign.md`, `docs/Nav02GuidanceDesign.md`, `docs/Nav03AutopilotDesign.md`, `docs/Nav04HoverDesign.md`, `out/w84/nav03/**`, `docs/Hud*.md`, `docs/Ctl*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave116.md`. Do not write sibling Wave 116 paths (`out/w116/hud02tgt/**`, `out/w116/ctl01/**`).  
**Locked sources:** wishlist Idea inbox P0 NAV (cite only); live inventory `out/w116/nav05/current-nav05-handoff-inventory.md` (code wins); NAV-01/02/03/04 briefs (cite only); WAVE85 / WAVE88 boot pins; Wave 87 frozen `out/w87/ap-path/**` (no WAVE87 string in `boot-test.mjs`).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale Wave 84 “no autopilot in src” comments.

**This leftover is gate handoff reliability + distinct cancel/refuse English + a live `systemLoaded` route pin.** It is **not** a planner. It is **not** MATCH. It is **not** PHY-02. It is **not** CTL-01 KeyD. It is **not** HUD-02 chrome.

NAV-01 persist, NAV-02 guidance, NAV-03 engage/cancel/chip/sole emit, NAV-04 hover, MATCH refuse, PHY-02 `applyAvoidBias` are **LIVE**. **Consume.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. `src/systems/gate.js` remains the **only** `jumpRequested` writer. Payload `to` is always live `near.to`. No teleport. No skip `JUMP.zone`. No skip `JUMP.chargeTime`. AP must not emit `jumpRequested`. AP must not write `world.currentSystem`.
3. Digit 0–9 stay (`station.js` `DOCK_KEY_SERVICES` 188). KeyM stays (chart). KeyV stays (`controls.js` 44, 283–284). HUD-01 empty 80 px hub. **Do not steal Digit 0/8/9.** No new Digit. First remaining serial must not steal Digit 0/8/9.
4. `innerHTML` forbidden later. `textContent` / `h()` / `el()` / `createTextNode` only. No `insertAdjacentHTML` / `document.write`.
5. `src/game/state.js` is READ-ONLY later. **No** new persist key. `world.nav` stays **one** record `{ dest, path, remaining, status, autopilot }`. Next hop stays **`path[1]`**. Restore still forces `autopilot: false`. Do **not** persist `wantJump`, `cycleHub`, wrap counters, or meshes.
6. MATCH refuse is **consume**. Do not clear MATCH. Do not fight `ship.js` `matchSpeedPressed && !apOn`.
7. PHY-02 `applyAvoidBias` is **consume**. This leftover is **not** a planner. Do not import `planApPath` into NPC. Do not add a navmesh or A*.
8. Prototype-safe later helpers: never `for-in` merge a save blob onto `ctx.autopilot` or `world.nav`. Dest / hop ids: `sanitizeSystemId` / `RESERVED_IDS` / `Object.hasOwn(SYSTEMS, id)`. `jumpRequested.to` stays `near.to`.
9. WAVE85 / WAVE88 boot pins **stay**. Later serial **must add** a live plotted multi-hop pin that asserts `systemLoaded` `to` and `world.currentSystem` sequence (not only `ctx.autopilot.yaw/throttle`). Do not invert existing greps. Do not “fix” known boot FAILs.
10. Fail closed: missing / reserved / proto hop → **no emit**, keep route, distinct token, **never freeze** the sim, **never throw**, **never teleport**.
11. AP jump stays independent of the D key (`apJump` OR `dockPressed`). Do not require `dockPressed` for AP. Do not fight later CTL-01.
12. Later impl write-set **must not claim** `src/systems/hud.js`, `src/ui/hud.css`, or `src/systems/controls.js` (HUD-02 sibling / CTL-01 sibling). Chip dest/next/rem stays. Do **not** put a reason paragraph on the chip. Failure English lives in `AP_LINES` + `commLine` + existing chart `apLine` / `#rw-galaxy-ap-live`.
13. Do not edit sibling Bio/Hud/Ctl/Msn/Rep/Shp/Tgt/Owner docs, wishlist, `PROGRESS.md`, NAV-01..04 briefs, `out/w84/nav03/**`. Do not write `docs/OwnerDecisionsWave116.md`. Deputize defaults live in **this** contract.
14. Do not reopen HUD-03, kit mutate, aim-glass, UU, SKU.
15. Chart-open fly-cancel paint (designer Major leftover). Later PR1 write-set **includes** `src/systems/galaxychart.js` **only** so existing `#rw-galaxy-ap-live` also `showApLive(apLine(reason))` on fly `disengage` while `ctx.flags.chartOpen === true`, including chart Cancel. Do **not** close the chart on engage (P2 inbox “close chart on AP” waits; do not steal it). HUD toast-under-overlay is **not** NAV-03 law for this leftover. Do **not** raise toast or chip z-index via `hud.js` / `hud.css`. Do **not** rewrite chart layout.

---

## 0.1 Wave 116 deputize (owner may override after playtest)

Pick playable **handoff + reason** defaults. Inventory proves **handoff is not proven** and **lines are not distinct**. Do not park. Do not invent UU / SKU / Digit. Do not invent a second jump path.

### Live knobs (do not retune as the fix)

| Knob | Live | Cite |
|---|---|---|
| Next hop | `path[1]` | `autopilot.js` 101–106; `gate.js` 642 |
| `wantJump` | `inZone && !docked && nearTo === hop` | `autopilot.js` 317 |
| `apJump` | `autopilot && wantJump && near.to === nextHop` | `gate.js` 643–649 |
| Sole emit | `gate.js` `{ to: near.to }` | 649 |
| Charge / midpoint | `jump.js` `JUMP.chargeTime`; `systemLoaded` 165 | consume |
| Lookup | `resolveNavGatePos` → `lookupLiveNavGate` | `nav-guidance.js` 89–97; `gate.js` 459–476 |
| Path math | `planApPath` `ok: false` only non-finite | `ap-path.js` 360–369 |
| MATCH | refuse engage | `autopilot.js` 174 |
| PHY-02 | `applyAvoidBias` | `autopilot.js` 275 |
| Restore | `autopilot: false` | `nav.js` 48–55 |
| `JUMP.zone` | 60 | `state.js` 585 |
| Tick order | gate → AP → jump → nav | `main.js` 111–123 |

Do **not** “fix” handoff by teleporting, skipping charge, or emitting from `autopilot.js`. That reopens NAV-03 §4.

### Smallest additive handoff (keep sole emit)

**Name:** **PR1 autopilot gate handoff** — stop cancelling a valid routed zone; split reason tokens; keep `gate.js` as the only emitter.

| Piece | Freeze |
|---|---|
| Emit law | Unchanged spirit: `inZone && !docked && !jumping && (dockPressed \|\| (nav.autopilot && wantJump && near.to === nextHop))` → `emit('jumpRequested', { to: near.to })`. |
| `wantJump` | Still true only when **this-frame** `inZone && !docked && nearTo === hop`. Do **not** set `wantJump` from distance-to-hop alone (that would fight nearest-spoke emit). One-frame publish lag stays (gate runs first). |
| Routed aim | Keep `resolveNavGatePos` (live ring wins over hub). |
| **Do not cancel on a wrong nearest hub** | If `nearHub && nearTo !== hop` and the **live routed assembly is a physical ring** (`lookupLiveNavGate` returned a non-hub origin, i.e. `a.to === hop` existed), **do not** `disengage`. **Do not** `cycleHub` on that hub. Keep steering at the ring. |
| Hub cycle | Only when the **routed** hop is a hub route (no physical ring for hop in this system) **and** `nearHub && nearTo !== hop` **and** that hub lists the hop. Same KeyG modulo. Wrap cap = `nearRouteCount`. |
| Hub wrap | `hubWrap > cap` → token **`hubWrap`**, keep route, no emit. Count wraps only on the routed hub. |
| Hub not listed (routed hub) | Token **`missingHub`**. Keep route. No emit. |
| Lookup fail at fly | Token **`lookupFail`**. Not `missingGate`. |
| `planApPath` `!ok` / non-finite aim | Token **`missingPath`**. Not `missingGate`. Not a new planner. |
| Missing `path[1]` while dest ≠ here | Fly: **`missingGate`**. Engage: **`missingHop`**. |
| Lookup fail at engage | **`missingLookup`** (not `missingHop`). |
| Arrive | Keep **`arrive`**. `systemLoaded` + `currentSystem === dest`. |
| `nearTo` lag | Do **not** cancel because `nearTo` is empty/wrong for **one** frame while `inZone` stays true and live lookup still resolves the hop. Do **not** emit unless `near.to === nextHop`. |
| Persist | **none** new. |
| Alloc | no per-frame object for ids; reuse live channel. |
| Chart-open fly cancel | Existing `#rw-galaxy-ap-live` `showApLive(apLine(reason))` while `chartOpen`. Includes chart Cancel. Chart stays open on engage. |

### English lines (deputize exact strings)

Owner may override after playtest. **Do not park.** Chart already paints engage-refuse `apLine(token)` via `showApLive` (`galaxychart.js` 627–630). Fly `disengage` today paints only `BREAK_LINE` via `commLine` (`autopilot.js` 192–196) and **does not** write `#rw-galaxy-ap-live`. Chart Cancel (`galaxychart.js` 621–624) calls `disengage('cancel')` and **does not** `showApLive`. Add tokens to **both** `AP_LINES` and `BREAK_LINE` (cancel family) or `AP_LINES` only (refuse family). Keep the prefix split for `missingLookup` / `lookupFail`. Keep sentence-case `AP_LINES` (do not author ALL CAPS; do not retune `.rw-toast`). Do not flip chart Autopilot dim to `disabled`.

| Token | When | Deputize English |
|---|---|---|
| `missingHop` | Engage: dest ≠ here and `path[1]` missing / not a string | `Autopilot refused — next hop is not on the route.` |
| `missingLookup` | Engage: hop present, `resolveNavGatePos` null / reserved | `Autopilot refused — next gate is not in this system.` |
| `lookupFail` | Fly: `resolveNavGatePos` null or non-finite pose | `Autopilot cancelled — next gate is not in this system.` |
| `missingPath` | Fly: `planApPath` `!ok` or aim not finite | `Autopilot cancelled — approach path failed.` |
| `missingHub` | Fly: **routed** hub does not list hop | `Autopilot cancelled — hub does not list the next hop.` |
| `hubWrap` | Fly: routed hub spoke cycle exceeded cap | `Autopilot cancelled — hub spoke cycle failed.` |
| `missingGate` | Fly: dest ≠ here and `path[1]` missing | `Autopilot cancelled — next gate is missing.` |
| `arrive` | Fly: `currentSystem === dest` (incl. `systemLoaded`) | `Arrived — autopilot off.` (keep live) |

Refuse tokens already live (`match`, `noDest`, `here`, `docked`, `jumping`, `paused`) stay. Cancel `cancel` / `input` stay.

**Forbidden collapse:** do not map lookup / path / hub / wrap onto `missingGate` or `missingHop`.

### Formulas (later impl)

```
// LIVE emit — gate.js only. Do not copy into autopilot.js.
if (inZone && !docked && !jumping && (dockPressed || apJump)) {
  ctx.emit('jumpRequested', { to: near.to })
}
// apJump = nav.autopilot && wantJump && near.to === nextHop
// nextHop = path[1]

// LIVE wantJump — keep nearest-spoke identity for emit.
ap.wantJump = !!(inZone && !docked && nearTo === hop)

// NEW: hub cancel / cycle only if hop has no physical ring.
const live = resolveNavGatePos(ctx, hop)
const routedIsHubOnly = /* lookupLiveNavGate found hubListsHop and no a.to === hop */
if (inZone && nearHub && nearTo !== hop) {
  if (!routedIsHubOnly) { ap.cycleHub = false; /* keep flying; no disengage */ }
  else if (!hubListsHop) disengage(ctx, 'missingHub')
  else if (hubWrap > cap) disengage(ctx, 'hubWrap')
  else { ap.cycleHub = true; hubWrap += 1 }
}
```

Do **not** persist wrap. Do **not** write `assembly.to` from AP.

### Chart-open fly cancel (allowed paint path)

Live stack: `.rw-galaxy-chart` is `position:fixed; inset:0; z-index:30` with `background: rgba(2, 6, 13, 0.82)` (`hud.css` 1898–1912). `#hud` is `z-index:10` (`style.css` 24–28). `#hud .rw-toasts` and `#hud .rw-autopilot` sit under that scrim while KeyM stays open after Autopilot click. Engage refuse already paints `#rw-galaxy-ap-live` (`role="status"` `aria-live="polite"`, `galaxychart.js` 137–141, 572–576). Fly cancel does not.

Later PR1 (named only; **this is the leftover paint path**):

- Keep chip dest / next / rem / Cancel. **No** reason paragraph on the chip.
- Do **not** claim `hud.js` / `hud.css` / `controls.js`.
- **Allowed extra file:** `src/systems/galaxychart.js` **only**. Existing `#rw-galaxy-ap-live` must `showApLive(apLine(reason))` when fly `disengage` runs and `ctx.flags.chartOpen === true`.
- Chart Cancel must paint that live region (live click does not). Fly `disengage` already emits `autopilotDisengaged` `{ reason }` (`autopilot.js` 193) when it was flying and `reason !== 'restore'`. Later impl may consume that event on the chart **or** paint from `ctx.autopilot.reason` while open — same visible result.
- Paint `apLine(reason)` / `BREAK_LINE` literals only. Never `textContent` the raw token, dest id, or hop id. `innerHTML` still forbidden. Unknown tokens stay blank (live `BREAK_LINE` miss emits no toast). `restore` stays silent. Existing `AP_LIVE_LIFE` timer may stay.
- Do **not** close the chart on successful engage. P2 inbox “close chart on AP” waits. Do not steal it.
- Chart-closed fly cancel still uses `commLine` → `#hud .rw-toasts` (visible). Chart-open: the sighted player reads `#rw-galaxy-ap-live`. HUD toast-under-overlay is **not** leftover law and is **not** NAV-03 consume for this English table.
- Do **not** restyle overlay z-index. Do **not** rewrite chart layout. Do **not** flip Autopilot dim to `disabled` (would swallow refuse `apLive`).

### Explicit non-picks

| Temptation | Verdict |
|---|---|
| CONSUME / serial **none** | **Forbidden** — census: collapsed English; no live `systemLoaded` multi-hop pin; hub-nearest cancel |
| Second `jumpRequested` emitter | **Forbidden** §0.2 |
| Teleport / skip zone / skip charge | **Forbidden** §0.2 |
| `wantJump` from distance only | **Forbidden** — false jump at wrong spoke |
| Emit `to: path[1]` instead of `near.to` | **Forbidden** — dest stuffing |
| New persist key / `hopIndex` | **Forbidden** §0.5 |
| `state.js` write | **Forbidden** §0.5 |
| `innerHTML` | **Forbidden** §0.4 |
| MATCH change | **Forbidden** §0.6 |
| New planner / navmesh / NPC `planApPath` | **Forbidden** §0.7 |
| Steal Digit 0/8/9 / KeyM / KeyV | **Forbidden** §0.3 |
| Claim `hud.js` / `hud.css` / `controls.js` | **Forbidden** §0.12 |
| Chip reason paragraph | **Forbidden** PR1 — chip stays dest/next/rem |
| Close chart on successful engage | **Forbidden** this leftover — P2 inbox “close chart on AP” waits; do not steal |
| HUD toast-under-overlay as NAV-03 leftover law | **Forbidden** — leftover English must paint `#rw-galaxy-ap-live` while the chart is open |
| Raise toast / chip z-index via `hud.js` / `hud.css` | **Forbidden** §0.12 |
| Chart layout / overlay restyle | **Forbidden** — `galaxychart.js` is live-region paint only |
| Fight CTL-01 (`dockPressed` required) | **Forbidden** §0.11 |
| Restore auto-resume | **Forbidden** — NAV-01/03 consume |
| HUD-03 / kit mutate / aim-glass / UU / SKU | **Forbidden** §0.14 |
| Invert WAVE85 / WAVE88 pins | **Forbidden** §0.9 |
| Verify only steer commands | **Forbidden** §0.9 |
| Collapse all failures to one toast | **Forbidden** §0.1 English table |

---

## 1. Ownership later

| Object | Writer (later serial) | Reader |
|---|---|---|
| `jumpRequested` | **none new** — `gate.js` only | `jump.js` |
| `ctx.autopilot.wantJump` / `cycleHub` | PR1 `autopilot.js` | `gate.js` |
| `ctx.autopilot.reason` | PR1 tokens | HUD/chart existing readers; `commLine`; chart `apLive` |
| `AP_LINES` / `BREAK_LINE` | PR1 split strings | `apLine`; chart live; disengage toast |
| `#rw-galaxy-ap-live` fly cancel | PR1 `galaxychart.js` `showApLive(apLine(reason))` while `chartOpen` (incl. chart Cancel) | sighted player; `aria-live` |
| `world.nav.autopilot` | **none new** (engage/disengage live) | everyone |
| `world.nav` dest/path/remaining/status | **none** | NAV-01 consume |
| `world.currentSystem` | **none** — `jump.js` midpoint | AP arrive |
| `applyAvoidBias` | **none** | consume PHY-02 |
| `planApPath` | **none** (math consume; map `!ok` to `missingPath`) | AP |
| `state.js` | **none** | `JUMP.zone` read |
| `WORLD_FIELDS` | **none** | — |
| Digit / KeyM / KeyV | **none** | consume |
| `hud.js` / `hud.css` / `controls.js` | **none** this leftover | chip dest/next/rem / D key stay |
| Chart overlay close-on-engage | **none** this leftover | P2 inbox waits |
| MATCH | **none** | consume refuse |

---

## 2. Fail closed (normative)

| Condition | Result |
|---|---|
| Proto / reserved hop or current system | lookup null; refuse `missingLookup` or cancel `lookupFail`; no emit |
| Unknown `SYSTEMS` dest on emit | `jump.js` `beginJump` already ignores; do not bypass |
| `wantJump` stuck true, `near.to !== nextHop` | no emit |
| `wantJump` true, not `inZone` | no emit |
| Wrong nearest hub, physical hop ring exists | keep flying; no `cycleHub`; no cancel |
| Routed hub wrap > cap | `hubWrap`; keep route |
| `planApPath` NaN | `missingPath`; keep route |
| `path[1]` missing, dest ≠ here | engage `missingHop` / fly `missingGate`; keep route (NAV-01 bag stays) |
| Arrive | `arrive`; `autopilot` false; route may stay arrived bag (NAV-01) |
| MATCH on | refuse `match`; do not engage |
| Restore blob `autopilot: true` | healer false |
| `#hud` missing | live disable; no throw |
| `#rw-galaxy-ap-live` missing | no throw; chart-closed `commLine` still may fire |
| Partial PR (lines without handoff) | still no teleport; still sole emit |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 autopilot gate handoff** | Wrong-hub no-cancel; hub cycle only when routed hop is hub-only; split `AP_LINES` / `BREAK_LINE` / `apRefuseToken` / `disengage` tokens; keep sole emit; keep `wantJump` = nearest `nearTo === hop`; WAVE85/88 still pass; `galaxychart.js` existing `#rw-galaxy-ap-live` `showApLive(apLine(reason))` on fly `disengage` while `chartOpen` (incl. chart Cancel) | `state.js`; Digit; new persist; teleport; second emitter; MATCH; planner; `hud.js`/`hud.css`/`controls.js`; Key remap; CTL-01; close-chart-on-engage; chart layout rewrite |
| **PR2 reason lines (optional)** | Playtest retune of deputized English only (still `AP_LINES`). Skip if PR1 copy reads enough. Hub jargon (`hubWrap` “spoke cycle”) may stay | Chart layout; chip rewrite; HUD-03; close-chart-on-engage |
| **PR3 live route pin** | `scripts/boot-test.mjs` (or later harness): plot multi-hop, drive charge through `jump.js`, assert `systemLoaded` `to` + `currentSystem` sequence. **Required to close leftover** unless PR1 already lands that pin | Known boot FAIL fixes; steer-only asserts as the only proof |

First remaining serial is **PR1 autopilot gate handoff**. It must not steal Digit 0/8/9. It must not write `state.js`. It must not claim `hud.js` / `hud.css` / `controls.js`. It **may write** `src/systems/galaxychart.js` **only** for `#rw-galaxy-ap-live` fly-cancel paint while the chart is open. **Named only. Do not implement in Wave 116.**

Serial name is **PR1 autopilot gate handoff**. Serial is **not** none. Leftover is **not** CONSUME.

If a later census proves (a) distinct English live, (b) no zone-cancel on a routed ring, (c) a live multi-hop `systemLoaded` pin green, (d) chart-open fly cancel visible on `#rw-galaxy-ap-live` — then CONSUME and serial **none**. Wave 116 census did not.

---

## 4. Persist / proto

`world.nav` already saved. PR1 writes live channel fields, `commLine` literals, and chart `#rw-galaxy-ap-live` `textContent` from `apLine(reason)` only. No `for-in` on records. No `WORLD_FIELDS` growth. Restore `autopilot: false`. Reserved ids never become `jumpRequested.to` because `to` is `near.to` from live assemblies (authored `to` still passes `beginJump` `Object.hasOwn(SYSTEMS)`).

---

## 5. Verification (later)

Must include **all**:

1. Source: sole `jumpRequested` still `gate.js`; AP still has no emit.
2. Distinct `AP_LINES` strings (table §0.1).
3. Wrong-hub overlap: ship in `JUMP.zone` of both hub and hop ring → **no** `missingGate`/`missingHub` cancel; eventually `near.to === hop` + `jumpRequested`.
4. **Live plotted multi-hop:** e.g. freehold → `vd_survey` (`path[1] === 'veridian'`). After charge/midpoint, `systemLoaded` `to` is `veridian` then dest; `world.currentSystem` matches. **Not** only `ctx.autopilot.yaw/throttle`.
5. WAVE85 / WAVE88 pins still pass.
6. MATCH still refuses. D key still not required for AP jump.
7. Chart-open fly cancel (incl. chart Cancel) paints `#rw-galaxy-ap-live` via `showApLive(apLine(reason))`. Chart stays open on engage. Chip dest/next/rem unchanged.
