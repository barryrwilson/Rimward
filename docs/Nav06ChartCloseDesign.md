# RIMWARD NAV-06 remaining close-chart-on-AP

| Field | Value |
|---|---|
| **Title** | RIMWARD NAV-06 remaining close-chart-on-AP |
| **Author** | Wave 118 chart-close leftover integrator |
| **Date** | 2026-08-25 |
| **Status** | Wave 120 PR1 **landed**. |
| **Wave** | 120 — **PR1 chart-close-on-AP**. Merge law stays Wave 118. |
| **Owner request** | Inbox P2 NAV leftover: Starting Autopilot from the Galaxy Chart begins moving the ship behind the still-open full-screen map. Census live chart-on-AP-engage. If the player still flies behind an open map, leftover is **REAL**. Freeze later serial **PR1 chart-close-on-AP**. Do **not** freeze CONSUME just because NAV-05 chose chart-open-on-engage — that freeze is a sibling constraint, not a product close of this inbox item. If a live path already closes the chart on successful engage, leftover may be CONSUME — only if census proves it. |
| **Merge law** | [`out/w118/chartclose/shared-contract.md`](../out/w118/chartclose/shared-contract.md). If this document and that file conflict, the contract wins. |
| **Honor** | HUD-01 empty hub. Digit 0 shipyard. Digit 8/9 stay. KeyM stays. CTL-01 KeyJ — cite, do not remap. Do not edit `controls.js`. NAV-05: later write-set must **not** rewrite `showApLive` / `#rw-galaxy-ap-live`. May **call** `setOpen(false)` on successful engage in a later serial. Do not steal `autopilot.js` jump emit. `gate.js` stays sole `jumpRequested` writer. Overlay sibling this wave writes `galaxychart.js` **open-gate mutex only** and is **forbidden** to close the chart on engage. Later PR1 must not fight mutex: closing the chart is a real close (`setOpen(false)`), which should flush deferred hail. P1 toast-flood is a sibling census — do not steal toasts. P2 chart-label a11y is a **different** inbox item — call out, do not make labels into hit targets here. `state.js` READ-ONLY later. No persist key. No UU. No SKU. No new Digit. `innerHTML` forbidden later. Kit mutate omit. Aim-glass gauges stay off. Do **not** edit the wishlist, `PROGRESS.md`, `docs/Ctl02*`, `docs/Ctl01*`, `docs/Nav05HandoffDesign.md`, `docs/Hud*`, or `docs/OwnerDecisions*`. Do **not** write `docs/OwnerDecisionsWave118.md`. Do **not** steal `out/w118/overlay/**`, `out/w118/toast/**`, `out/w117/**`, `out/w116/**`. |

**Verifier record:**

| Note | Path |
|---|---|
| Merge law (wins on conflict) | [`out/w118/chartclose/shared-contract.md`](../out/w118/chartclose/shared-contract.md) |
| Wave 120 PR1 notes | [`out/w120/chartclose/notes.md`](../out/w120/chartclose/notes.md) |
| Wave 120 PR1 security review | [`out/w120/chartclose/security-review.md`](../out/w120/chartclose/security-review.md) |
| Wave 120 PR1 code review | [`out/w120/chartclose/code-review.md`](../out/w120/chartclose/code-review.md) |
| Wave 120 PR1 UI audit | [`out/w120/chartclose/ui-audit.md`](../out/w120/chartclose/ui-audit.md) |
| Inventory (code wins; Wave 118 census) | [`out/w118/chartclose/current-chartclose-inventory.md`](../out/w118/chartclose/current-chartclose-inventory.md) |
| Wave 118 security review | [`out/w118/chartclose/security-review.md`](../out/w118/chartclose/security-review.md) |
| Wave 118 design-doc review | [`out/w118/chartclose/code-review.md`](../out/w118/chartclose/code-review.md) |
| Wave 118 UI audit | [`out/w118/chartclose/ui-audit.md`](../out/w118/chartclose/ui-audit.md) |
| Wave 118 notes | [`out/w118/chartclose/notes.md`](../out/w118/chartclose/notes.md) |

Siblings overlay-priority / NAV-05 / CTL-01 / toast-flood / chart-label a11y, wishlist, `PROGRESS.md`, `docs/Ctl02*`, `docs/Ctl01*`, `docs/Nav05HandoffDesign.md`, `docs/Hud*`, and `docs/OwnerDecisions*` are **other workers**. **Do not edit** those paths. **Do not write** `src/`. **Do not steal** sibling Wave 118 overlay/toast paths or `out/w117/**` / `out/w116/**`.

**This is not CTL-01 KeyJ.** **This is not overlay mutex.** **This is not NAV-05 `showApLive` rewrite.** **This is not P1 toast-flood.** **This is not P2 chart-label a11y.** Wishlist close-chart-on-AP is **INBOX**. Census still finds **chart stays open on successful engage**.

---

## Overview

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Idea inbox — **cite, do not edit**):

> IDEA (P2, NAV): Starting Autopilot from the Galaxy Chart begins moving the ship behind the still-open full-screen map; close the chart automatically on successful engagement, or present an explicit state that requires closing the chart before flight resumes.

Wave 118 this worker lands markdown only. Bindings do not change here.

Census (code wins; re-census after overlay): Galaxy Chart AP button (`galaxychart.js` 625–642) calls `tryEngage`. On success the token is `''`. The handler paints `showApLive('')` and **does not** call `setOpen(false)`. `setOpen(false)` exists only on Close, KeyM-while-open, Escape, and docked auto-close (644, 680, 687, 700). Overlay open-gate is live (`canOpenPlayCard` / `playSurfaceBlocked`). Hail flush is `takeDeferredHail` in `hail.js` update. Autopilot `tryEngage` (`autopilot.js` 209–222) sets `nav.autopilot` and freezes steer while `chartOpen` (220). Chart is full-screen z 30 (`hud.css` 1898–1916). WAVE117 pins `chartStayOpen` / `chartEngageStay` (`scripts/boot-test.mjs` 23550, 23624–23627) require the chart to stay open after `tryEngage`. Overlay this wave **must keep those pins true** and is **forbidden** to close the chart on engage. The player still flies behind an open map. Leftover is **REAL**. Not CONSUME.

This leftover is **close the chart on successful Autopilot engage only** (`setOpen(false)`). It is not a pause. It is not a teleport. It is not a jump emit. It is not a toast. It is not overlay mutex. It is not a rewrite of `showApLive`.

This document is the integrator for a **later** implementation wave.

HUD-01 empty aim glass stays empty. `state.js` stays READ-ONLY. No new persist key. Digit 0 stays shipyard. Digit 8/9 stay. KeyM stays. Do not invent UU. Do not steal Digit 0/8/9. Do not remap KeyJ.

Wave 118 deputize (recorded here and in the contract; owner may override after playtest): on **successful** chart Autopilot engage (`tryEngage` returns `''`), call real `setOpen(false)`, then blur any focused control inside the chart root; prefer the already-named HUD `#hud .rw-autopilot-cancel` when that chip is visible. Do **not** close on refuse or cancel. Keep `showApLive` for cancel/disengage **while the chart is open**. Do not pause the sim. Do not teleport. Do not skip zone/charge. Do not add a KeyM listener. Do not start a close animation. Do not emit a toast. Later WAVE pin retune must drive the **Autopilot button** for stay/close, because today’s WAVE117 engage pins call `tryEngage` directly and would not see a button-only close. Later PR1 **must re-census** `galaxychart.js` lines (overlay already landed).

If census had proved a live path already closed the chart on successful engage, this pack would freeze **CONSUME** and name serial **none**. Census did not.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w118/chartclose/current-chartclose-inventory.md`](../out/w118/chartclose/current-chartclose-inventory.md). Code wins.

| Surface | Today | Cite |
|---|---|---|
| Chart open flag | `flags.chartOpen`; session | `galaxychart.js` 421–433; `ctx.js` 208 |
| Chart z / pause | z 30; `inset:0`; **does not** pause | `hud.css` 1898–1916; header 24–27; `aria-modal=false` 113 |
| KeyM | close always; open if !docked && !paused && !`playSurfaceBlocked` | 674–688 |
| Escape / × | `setOpen(false)` | 686–687, 644 |
| Docked | auto-close | 700 |
| AP button | Autopilot / Cancel autopilot | 147–153, 596–642 |
| Engage | `tryEngage`; on `token` refuse live line; on success `showApLive('')`; **chart stays** | 633–641 |
| Cancel while open | `disengage` + `showApLive(apLine('cancel'))` | 627–631 |
| Fly disengage while open | `showApLive(apLine(reason))` | 719–730 |
| `showApLive` | `textContent` only; `#rw-galaxy-ap-live` | 137–142, 578–582 |
| HUD AP cancel chip | named Cancel; hidden until AP frame | `hud.js` 1033–1041, 1717; `hud.css` 691–714 |
| Steer while chart open | `steerArmed = false` | `autopilot.js` 155–156, 220 |
| Jump emit | `gate.js` only | `gate.js` 678; WAVE117 `jumpOnlyGate` |
| WAVE117 stay pins | `chartStayOpen`, `chartEngageStay` **true** required | `boot-test.mjs` 23550, 23624–23627 |
| Overlay helper | **PRESENT** | `overlay-policy.js`; chart 5, 422–425, 681–684 |
| Hail flush | `takeDeferredHail` in hail update | `overlay-policy.js` 158–172; `hail.js` 512–516 |
| Overlay mutex | Wave 118 sibling **landed**; open-gate only; **must not** close on engage | `galaxychart.js` `canOpenPlayCard` / `playSurfaceBlocked` |

The player who plots on KeyM and clicks Autopilot sees the map stay. Autopilot throttle and yaw still run. Steer is frozen while `chartOpen`. The ship moves behind a full-screen dim (`background: rgba(2, 6, 13, 0.82)`).

### Pain points

- Inbox P2: flight resumes under a still-open map. The player cannot see the approach.
- NAV-05 **intentionally** kept the chart open so cancel/disengage can paint `#rw-galaxy-ap-live`. That is a sibling constraint. It is **not** a product close of this inbox.
- Overlay PR1 this wave mutexes hail/chart/berth and is **forbidden** to close the chart on engage. Mutex does not solve this leftover.
- WAVE117 `chartStayOpen` / `chartEngageStay` pin the sibling choice. This wave overlay **must keep them true**. A later serial **retunes** those pins. It does not “fix” known boot FAILs.
- A naive later PR that rewrites `showApLive` **steals NAV-05**.
- A naive later PR that emits `jumpRequested` from the chart **steals `gate.js`**.
- A naive later PR that remaps KeyJ **steals CTL-01**.
- A naive later PR that pauses under the chart **freezes the sim** and drops events.
- A naive later PR that closes on refuse/cancel hides the live refuse line.
- A naive later PR that enlarges labels **steals P2 chart-label a11y**.
- A naive later PR that toasts engage **steals P1 toast-flood**.
- A naive later PR that wraps close in overlay-policy **fights** the overlay sibling unless the helper already owns one-line close-flush.

### Why now (design) / why not now (code)

The owner asked for the chart-close leftover integrator so a later serial can close the map on **successful** engage **after** overlay mutex and NAV-05 live-line land. Inventory shows no live close-on-engage path. Merge law can exist without touching `src/`. Implementation waits so overlay open-gate, `showApLive`, jump emit, KeyJ, toast-flood, label a11y, persist, and freeze-the-sim stay frozen. Wave 118 this worker does not ship `src/`.

If census had proved close-on-engage already live, this pack would freeze **CONSUME** and name serial **none**. Census did not.

---

## Goals & Non-Goals

### Goals

1. Document live chart-on-AP-engage, `setOpen`, `showApLive`, WAVE117 stay pins, and overlay coupling from **live code**.
2. Freeze leftover = **close chart on successful AP engage only**. Not CONSUME. Serial is **not** none.
3. Freeze deputize **real `setOpen(false)` after empty `tryEngage` token**, then blur chart focus / prefer visible HUD `#hud .rw-autopilot-cancel`. Owner may override after playtest. Do not park.
4. Freeze: do **not** close on refuse/cancel. Keep `showApLive` cancel/disengage **while the chart is open**.
5. Freeze persist: **none** new. `state.js` READ-ONLY. No UU. No SKU. No new Digit.
6. Freeze HUD-01 empty hub. Digit 0/8/9 stay. KeyM stays. KeyJ stays CTL-01.
7. Freeze later copy via `textContent`. `innerHTML` forbidden.
8. Freeze jump: `gate.js` sole `jumpRequested` writer. Do not skip zone/charge. Do not teleport.
9. Freeze overlay coupling: later close is a **real** `setOpen(false)`. Hail flush is live `takeDeferredHail` in `hail.js` update. Do not skip flush. Do not invent a second overlay-policy.
10. Freeze a11y: no focused control inside `aria-hidden` chart after success. No new KeyM listener. No close animation. No toast. Later PR1 **re-census** `galaxychart.js` lines.
11. Freeze a serial PR plan. This wave writes the document. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in this worker.
- No pause-the-sim. No teleport. No skip zone/charge.
- No NAV-05 `showApLive` rewrite. No `#rw-galaxy-ap-live` node rewrite.
- No `autopilot.js` `jumpRequested`. No steal of `tryEngage` emit.
- No CTL-01 KeyJ remap. No `controls.js` edit.
- No overlay mutex rewrite. No `out/w118/overlay/**` steal. No `overlay-policy.js` write (helper **already present**). No `hail.js` write.
- No HUD-02 combat rails. No HUD-01 hub child. No new Digit.
- No `state.js` write. No WORLD_FIELDS.
- No P1 toast-flood. No P2 chart-label a11y (labels stay labels).
- Do not edit the wishlist, `PROGRESS.md`, `docs/Ctl02*`, `docs/Ctl01*`, `docs/Nav05HandoffDesign.md`, `docs/Hud*`, Bio*, Msn*, Rep*, Tgt*, OwnerDecisions*.
- Do not write `docs/OwnerDecisionsWave118.md`.
- Do not fix known boot FAILs.
- Do not steal `out/w118/overlay/**`, `out/w118/toast/**`, `out/w117/**`, `out/w116/**`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Leftover real? | **Yes** — chart stays open on successful engage | Inventory §3 |
| CONSUME? | **No**. Serial is **not** none. NAV-05 stay-open is a **sibling constraint**, not a product close | Owner request |
| New persist key? | **No** | Contract §0.6 |
| `state.js` write? | **No** | Contract §0.5 |
| Pause under chart? | **No** | Freeze-the-sim; events drop |
| Close on success? | **Yes** — `setOpen(false)` after empty token | Inbox auto-close deputize |
| Close on refuse/cancel? | **No** | Keep live refuse / cancel line |
| `showApLive` rewrite? | **No** | NAV-05 |
| Jump emit from chart? | **No** | `gate.js` sole writer |
| Overlay mutex fight? | **No** — real close; flush hail | Overlay sibling |
| Toast / labels? | Call out only | Other inbox |
| Named PR1? | **PR1 chart-close-on-AP** | REAL leftover |

### 2. Current chart-on-AP motion (do not break NAV-05 / overlay / Wave 40)

Title stays `systems[0]` capture. Settings KeyO stays z 80. Pause KeyP stays. Chart still sets `flags.chartOpen` so AP/AM freeze steer **while open**. Sibling NAV-05 already paints `showApLive` on chart Cancel and fly disengage (`galaxychart.js` 623, 709–718). Later PR1 **calls** `setOpen(false)` on success only. It does **not** rewrite `showApLive`. Overlay sibling this wave may gate **open** if hail/berth own the card. Overlay **must not** block **close**. Overlay **must not** close on engage this wave. WAVE117 `chartStayOpen` / `chartEngageStay` stay true **this wave**.

### 3. Smallest additive punch (later)

See contract §0.1 / §0.19. One real `setOpen(false)` after successful chart Autopilot click, then blur chart focus (prefer visible HUD AP Cancel). No new key bind. No pause. No overlay-policy write. Hail update already calls `takeDeferredHail`.

### 4. Neighbours

| Module | This leftover does | This leftover does not |
|---|---|---|
| `galaxychart.js` | later PR1: after empty `tryEngage` token, real `setOpen(false)` + blur / prefer HUD cancel; **re-census lines at impl** | rewrite `showApLive`; AP live node; hover; labels; hit discs; overlay open-gate |
| `scripts/boot-test.mjs` | later wave: retune `chartStayOpen` / `chartEngageStay` to **button** success → chart closed | invert WAVE85/WAVE88; “fix” known FAILs |
| Overlay mutex (sibling) | consume real close (flush deferred hail) | close on engage this wave |
| `overlay-policy.js` | none (already present) | rewrite; second helper; pause |
| `autopilot.js` | none | `jumpRequested`; `tryEngage` emit steal |
| `gate.js` | none (sole jump writer) | — |
| `controls.js` | none | KeyJ; KeyM remap |
| `hail.js` / `hud.js` | none | toasts; Digit; combat rails |
| `state.js` | none | write |
| Title / origins / settings | honor capture | steal Enter; steal KeyO |

### 5. Serial PR plan

Matches contract §3. **Named only. Do not implement in Wave 118.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 chart-close-on-AP** | real `setOpen(false)` on successful chart AP engage; blur chart focus / prefer visible `#hud .rw-autopilot-cancel`; later WAVE pin retune via Autopilot **button**; **re-census** `galaxychart.js` | persist; pause-the-sim; KeyJ; `showApLive` rewrite; jump emit; toast-flood; chart-label a11y; Digit steal; `innerHTML`; overlay mutex rewrite; `overlay-policy.js`; `hail.js`; new KeyM listener; close animation |
| **PR2 stills (optional)** | Playtest stills: map gone after Autopilot click; refuse keeps map; cancel-while-open still paints live line | Required with PR1; toast-flood; known FAILs |
| **PR3 census (optional skip)** | Re-grep: success branch calls `setOpen(false)`; refuse/cancel do not; `showApLive(apLine('cancel'))` still present | New world field |

First remaining serial is **PR1 chart-close-on-AP**. It must not steal Digit 0/8/9. It must not write `state.js`. It must not claim `src/game/autopilot.js` `jumpRequested`. It must not rewrite `showApLive`. It must not land in this worker.

### 6. Picture

Reuse live chart dialog, live Autopilot button, and live HUD `#hud .rw-autopilot-cancel`. No new chrome in PR1. Player plots, clicks Autopilot, map **closes**, keyboard focus leaves the hidden chart (HUD Cancel if that chip is visible), flight is visible. Refuse keeps the map and the live line. Cancel while the map is open still paints `#rw-galaxy-ap-live`. Deferred hail may appear after this real close (`takeDeferredHail` in hail update).

No hub pip. Digit 0 stays shipyard. KeyM stays. KeyJ stays CTL-01.

---

## Player outcome (later serial; freeze here)

Fly. Open Galaxy Chart with M. Plot a hop. Click Autopilot. Engage **succeeds**. The chart **closes**. Keyboard focus does **not** stay on the hidden Autopilot control. If the HUD Cancel chip is visible, that named control takes focus. The ship is already under autopilot. The player sees space, not the map. Steer unfreezes when `chartOpen` is false (`autopilot.js` 155–161, 220). Zone and charge still run. Jump still comes from `gate.js`.

Fly. Open the chart. Click Autopilot while MATCH is on (or no dest, docked, paused, jumping, missing hop). Engage **refuses**. The chart **stays open**. `#rw-galaxy-ap-live` still shows the refuse line. No toast flood.

Fly. Open the chart while autopilot is already on. Click Cancel autopilot. The chart **stays open**. Live line shows cancel. Fly `autopilotDisengaged` while the chart is open still paints the live line.

Fly. Overlay has deferred a hail behind the chart. Successful AP close is a **real** `setOpen(false)`. Overlay flush may open that hail after the map goes. Do not skip that flush. Do not yank hail during overlay mutex while the chart is still the blocker.

Pause is still P. Settings is still O. Title still captures. KeyM still toggles the chart. Digit 0/8/9 stay.

`reducedMotion` is unchanged. No new motion.

**Overlay mutex** is **not** this work. **NAV-05 AP live line** is **not** this work (call only). **CTL-01 KeyJ** is **not** this work. **P1 toast-flood** is **not** this work. **P2 chart-label a11y** is **not** this work.

---

## Security

See [`out/w118/chartclose/security-review.md`](../out/w118/chartclose/security-review.md).

- Title capture already swallows most keys. Do not break `systems[0]`. Later PR1 must not add a capture listener or a new KeyM listener.
- After success close, do not leave `document.activeElement` inside `aria-hidden` chart. Blur, then prefer visible `#hud .rw-autopilot-cancel`. Authored selector only.
- XSS: no `innerHTML` for live lines. `showApLive` stays `textContent`. Later close must not switch to `innerHTML`.
- Proto: no persist merge of `chartOpen`. Session flag already.
- Persist: no new key.
- Fail-closed never freeze the sim. Never throw from the click handler. Never set `flags.paused`.
- Overlay: real close may flush hail. That is overlay policy, not a new trust boundary in this leftover.

---

## Acceptance direction (implementation wave)

1. Chart Autopilot click, `tryEngage` returns `''`: `chartOpen` becomes false in the same handler (real `setOpen(false)`). Then blur any focused node inside the chart root. Prefer `#hud .rw-autopilot-cancel` when that chip is visible. Boot or playtest cannot leave the full-screen map over a successful engage, and cannot leave keyboard focus inside `aria-hidden`.
2. Refuse token: chart stays open. Live refuse line still paints.
3. Cancel / fly disengage while `chartOpen`: `showApLive` still paints. Function body not rewritten.
4. Hail/chart/berth never set `flags.paused` from this leftover.
5. KeyM still the chart. KeyJ untouched. Digit 0/8/9 untouched.
6. `gate.js` still the only `jumpRequested` writer. Zone 60 unchanged. No teleport.
7. Overlay mutex still owns open-gate. This PR does not retune hail/berth and does not write `overlay-policy.js`. Close is real `setOpen(false)` so `hail.js` update can `takeDeferredHail`. Do not skip that flush.
8. WAVE117 `chartStayOpen` / `chartEngageStay` retuned in a **later** boot-test: Autopilot **button** success → chart closed. Overlay **this wave** keeps the old pins true.
9. No new `WORLD_FIELDS`. No `innerHTML`.
10. Known boot FAILs untouched.

---

## Alternatives considered

| Alternative | Why not |
|---|---|
| Freeze CONSUME / serial none | Census: chart stays open; NAV-05 stay-open is sibling law, not inbox close |
| Explicit “close the chart before flight resumes” lock | Inbox allowed it; deputize **auto-close** as smallest additive. A lock still hides space until the player closes. Owner may override after playtest |
| Close on refuse/cancel | Hides the live line NAV-05 just painted |
| Rewrite `showApLive` to a HUD toast | Steals NAV-05 and P1 toast-flood |
| Pause sim while chart open | Drops events; freeze-the-sim |
| Close from `autopilot.js` `tryEngage` | Steals NAV-05 steer contract; WAVE117 pins call `tryEngage` directly; chart-only leftover belongs on the button path |
| Emit `jumpRequested` from the chart | `gate.js` sole writer |
| Overlay PR1 closes on engage | Forbidden this wave; fights WAVE117 stay pins |
| Skip hail flush on AP close | Fights overlay mutex (close must be real; flush is `takeDeferredHail`) |
| Leave focus in `aria-hidden` chart | Contract §0.19 blur / prefer HUD Cancel |
| New KeyM listener / close animation / toast | Forbidden |
| Make labels hit targets | Other P2 inbox |
| `innerHTML` live line | XSS |
| Digit / hub pip | HUD-01 / station |

---

## Regression risks

| Risk | Mitigation |
|---|---|
| Overlay open-gate blocks `setOpen(false)` | Live mutex gates **open** only (`canOpenPlayCard` when `next` is true). Close always runs |
| Deferred hail forgotten or yanked mid-plot | Overlay flush on **real** close. This PR does not open hail itself |
| NAV-05 `showApLive` steal | Write-set = engage-success close + focus only. Do not rewrite `showApLive` (re-census lines at impl) |
| WAVE117 stay pins fail this wave | Overlay sibling keeps them true. Later serial retunes **button** path |
| Direct `tryEngage()` in boot still leaves chart open | Later pin **must** click `.rw-galaxy-ap` for the close assertion |
| CTL-01 KeyJ steal | `controls.js` forbidden |
| Pause under chart dropping hails | **Forbidden** to pause |
| Title capture broken | No new key listener. KeyM stays in chart |
| Freeze the sim on helper miss | Overlay helper already present; still never throw; never pause |
| Stale line numbers | Later PR1 **re-census** `galaxychart.js` (overlay already shifted engage/close) |
| Digit 0/8/9 | Untouched |
| Toast-flood confusion | Call out; do not emit extra `commLine` on success (live already `showApLive('')`) |
| Label a11y steal | Do not touch hit discs / labels |

---

## Ownership

| Object | Writer | Reader |
|---|---|---|
| Chart `setOpen(false)` on AP **success** + blur / prefer HUD cancel | later PR1 `galaxychart.js` engage branch | player; overlay flush; a11y |
| Chart `setOpen` open-gate mutex | **overlay sibling** (this wave) | KeyM |
| `flags.chartOpen` | live + later close | AP steer; fireHeld; overlay |
| `showApLive` / `#rw-galaxy-ap-live` | **none** (NAV-05) | chart AP line |
| WAVE117 stay pins retune | later wave boot-test | CI |
| `jumpRequested` | **none** (`gate.js` live) | jump.js |
| Overlay helper | **none** (already present) | `takeDeferredHail` via hail update |
| `pendingDock` / KeyJ | **none** (CTL-01) | — |
| `state.js` | **none** | — |
| Digit / station / toasts | **none** | — |

---

## Open owner questions

**Deputized this wave** (contract §0.1). Owner may override after playtest. Do not park.

1. Smallest additive = close chart on **successful** Autopilot engage only (real `setOpen(false)` + blur / prefer visible HUD Cancel). Do not pause. Do not teleport.
2. Do not close on refuse/cancel. Keep `showApLive` while the chart is open.
3. Explicit lock-until-close is **not** required PR1.
4. No new persist key.
5. Home: `galaxychart.js` engage-success close + focus + later WAVE pin retune. Not `autopilot.js`. Not `showApLive` rewrite. Not KeyJ. Not `overlay-policy.js`. Not `hail.js`.
6. Overlay coupling: real close lets `hail.js` `takeDeferredHail`. Later PR1 must not special-case skip flush.
7. Later PR1 **re-census** `galaxychart.js` lines before edit.
8. Optional PR2 stills are skippable after playtest.
