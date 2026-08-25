# RIMWARD CTL-02 remaining overlay-priority

| Field | Value |
|---|---|
| **Title** | RIMWARD CTL-02 remaining overlay-priority |
| **Author** | Wave 117 overlay leftover integrator |
| **Date** | 2026-08-24 |
| **Status** | Wave 118 PR1 overlay-priority **landed**. Merge law remains [`out/w117/overlay/shared-contract.md`](../out/w117/overlay/shared-contract.md) — that file still wins on conflict. |
| **Wave** | 118 — PR1 helper + hail/chart/berth mutex, hail defer, salvage calm. |
| **Owner request** | Inbox P1 OVERLAYS leftover: Hail, Galaxy Chart, and Berth Records can stack while the simulation continues, and a resolved "Let them go" hail can return. Census whether stacking and hail-reopen are still live. If real, freeze a later serial that establishes one overlay-priority / pause policy, defers incompatible cards, and blocks hail reopen during calm. If already gone, freeze CONSUME and name serial **none**. |
| **Merge law** | [`out/w117/overlay/shared-contract.md`](../out/w117/overlay/shared-contract.md). If this document and that file conflict, the contract wins. |
| **Honor** | HUD-01 empty hub. Digit 0 shipyard. Digit 8/9 stay. KeyH hail, KeyM chart, KeyL berth stay. CTL-01 KeyJ is a sibling — cite, do not remap. NAV-05 chart-open-on-engage stays — do **not** steal P2 close-chart-on-AP. P1 toast-flood is a **different** inbox item — call it out, do not solve. P2 chart-label a11y — do not solve. `state.js` READ-ONLY later. No new persist key (calm is session). `innerHTML` forbidden later. Do **not** edit the wishlist, `PROGRESS.md`, `docs/Ctl01DockBindDesign.md`, `docs/Nav05HandoffDesign.md`, `docs/Hud*.md`, or `docs/OwnerDecisions*.md`. Do **not** write `docs/OwnerDecisionsWave117.md`. Do **not** steal sibling `out/w117/nav05/**`, `out/w117/ctl01/**`, or `out/w116/**`. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins; Wave 117 census) | [`out/w117/overlay/current-overlay-inventory.md`](../out/w117/overlay/current-overlay-inventory.md) |
| Merge law | [`out/w117/overlay/shared-contract.md`](../out/w117/overlay/shared-contract.md) |
| Wave 117 security review | [`out/w117/overlay/security-review.md`](../out/w117/overlay/security-review.md) |
| Wave 117 design-doc review | [`out/w117/overlay/code-review.md`](../out/w117/overlay/code-review.md) |
| Wave 117 UI audit | [`out/w117/overlay/ui-audit.md`](../out/w117/overlay/ui-audit.md) |
| Wave 117 notes | [`out/w117/overlay/notes.md`](../out/w117/overlay/notes.md) |

Siblings HUD-02 / NAV-05 / CTL-01, wishlist, `PROGRESS.md`, `docs/Nav*.md`, `docs/Hud*.md`, `docs/Ctl01DockBindDesign.md`, and `docs/OwnerDecisions*.md` are **other workers**. **Do not edit** those paths. Do **not** write `src/`. Do **not** steal sibling Wave 117 paths (`out/w117/nav05/**`, `out/w117/ctl01/**`).

**This is not CTL-01 KeyJ.** **This is not NAV-05 `showApLive`.** **This is not HUD-02 combat rails.** **This is not P1 toast-flood.** Wishlist overlay stacking is **INBOX**. Census still finds **stack + hail-reopen live**.

---

## Overview

Inbox source (`docs/PLAYER-EXPERIENCE-WISHLIST.md` Idea inbox — **cite, do not edit**):

> Hail, Galaxy Chart, and Berth Records can stack while the simulation continues, and a resolved "Let them go" hail can return; establish one overlay-priority/pause policy, defer incompatible cards, and ensure a resolved hail cannot reopen during its calm period.

Wave 118 PR1 landed the helper and the three open gates. Bindings for KeyH/M/L and Digit 0/8/9 do not change.

**Landed (Wave 118 PR1):** `src/systems/overlay-policy.js` mutex + one session defer slot; hail/chart/berth at most one open; incoming `hailOpened` defers while chart/berth open (skip `openCard` only); salvage `letGo` writes `ai.calmUntil = time + 30`; `openCard` / KeyH read calm; hail/chart/berth never write `flags.paused`; Digit1–9 skip when settings/title/models own the screen, and when `ctx.flags.paused` is true (pause banner z 50 over hail z 40). Probe/pins: `scripts/boot-test.mjs` WAVE118 (`wave118 overlay-priority`, including `digitSkipUnderPause`); reviews in `out/w118/overlay/`. Chart `showApLive` / chart-open-on-engage unchanged (WAVE117 `chartStayOpen` / `chartEngageStay`).

Census (code wins): hail (`z-index:40`) does not pause and does not read `chartOpen` or berth. Chart (`z-index:30`, `flags.chartOpen`) does not pause and opens on KeyM unless docked/paused. Berth (`z-index:60`, local `berthOpen`) does not pause and opens on KeyL unless docked/paused/dead. All three can be open at once. Hail Digit1–9 still resolve while berth covers the card. Live "Let them go" writes `ai.calmUntil = time + 30`, but `openCard` never reads it; salvage `letGo` writes **no** calm; a respawned AI starts `calmUntil: 0`. Stacking and hail-reopen are **LIVE**. Leftover is **real**.

This leftover is **one exclusive play card** among hail / chart / berth, a **defer** of incoming hail, a **session calm gate** on reopen, and a **do-not-pause** rule for those three. It is not a new Digit. It is not KeyJ. It is not toast dedupe.

This document is the integrator for a **later** implementation wave.

HUD-01 empty aim glass stays empty. `state.js` stays READ-ONLY. No new persist key. Digit 0 stays shipyard. Digit 8/9 stay. KeyH/M/L stay. Do not invent UU. Do not steal Digit 0/8/9. Do not remap KeyJ.

Wave 117 deputize (recorded here and in the contract; owner may override after playtest): **mutex** hail/chart/berth. **Defer** incoming hail if chart or berth is already open (**skip `openCard` only**; do not swallow `hailOpened`). **Refuse** KeyM/KeyL while hail is open. Hail/chart/berth **never** set `flags.paused`. `openCard` and KeyH **refuse** while `now < ai.calmUntil`. Salvage `letGo` also writes **+30 s** session calm. Helper `src/systems/overlay-policy.js`. Optional session flags `hailOpen` / `berthOpen` (not persist).

If census had proved stacking and hail-reopen were gone, this pack would freeze **CONSUME** and name serial **none**. Census did not.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w117/overlay/current-overlay-inventory.md`](../out/w117/overlay/current-overlay-inventory.md). Code wins.

| Surface | Today | Cite |
|---|---|---|
| Hail open | module `open`; no `flags.hailOpen` | `hail.js` 122 |
| Hail z / pause | 40; does **not** pause | 108; 8–9 |
| Hail Digit | 1–9 resolve while `open` | 407–415 |
| `letGo` live | flee + `calmUntil + 30` | 184–192 |
| `letGo` salvage | no calm | 185–186 |
| `openCard` | no calm / overlay check | 326–403, 421 |
| Chart open | `flags.chartOpen` | `galaxychart.js` 420–427 |
| Chart z / pause | 30; does **not** pause | `hud.css` 1908; header 24–27 |
| Chart KeyM | close always; open if !docked && !paused | 669–674 |
| Chart on AP engage | stays open; `showApLive` | 627–636; cancel 623; fly 709–718 |
| Berth open | local `berthOpen` | `save.js` 1382–1388 |
| Berth z / pause | 60; fly continues | 1352, 1376 |
| Berth KeyL | open if !docked && !paused && !dead | 1488–1493 |
| Pause | KeyP; z 50; skips `system.update` | `main.js` 149–176 |
| Title | `systems[0]`; z 70; capture | `main.js` 105; `title.js` 190–227 |
| Settings | KeyO; z 80; no pause | `settings.js` 13–15, 228–234 |
| Origins | pause; z 60 | `origins.js` 92, 98 |
| Models | pause save/restore; z 80 | `modelsbrowser.js` 8, 639–640 |
| `#fatal` | z 99 | `index.html` 13 |
| `WORLD_FIELDS` | no overlay / calm key | `save.js` 76–101 |
| Overlay helper | **absent** | grep none |

The player who opens M then takes a hail sees both. The player who opens L over a hail still fires hail Digit keys. The player who "Lets them go" on a hulk can H-hail the same wreck immediately.

### Pain points

- Three full-screen-ish cards with no mutex. Priority is **z-index accident**, not policy.
- Berth (60) **hides** hail (40) but does not close it. Hidden Digit shortcuts still resolve.
- Chart (30) sits **under** hail (40). Combat verbs paint on the map. Sim and AP continue.
- Pause (50) sits **under** berth (60). A paused load is already refused; the stack is still confusing.
- `openCard` ignores `calmUntil`. Salvage `letGo` never writes it. Respawn resets it.
- A naive later PR that **pauses** the sim under the chart would freeze combat hail and drop `hailOpened` events (`main.js` 149–156).
- A naive later PR that closes the chart on AP engage **steals P2**.
- A naive later PR that edits `showApLive` **steals NAV-05**.
- A naive later PR that remaps KeyJ **steals CTL-01**.
- A naive later PR that raises toasts **steals P1 toast-flood**.
- A naive later PR that persists calm into `WORLD_FIELDS` lies after jump / despawn.
- Putting a new Digit or hub pip impersonates the owner.

### Why now (design) / why not now (code)

The owner asked for the overlay leftover integrator so later serials can mutex play cards **before** the first helper. Inventory shows three independent openers, a live sim, and a calm gate that NPC resolve honors but hail DOM does not. Merge law can exist without touching `src/`. Implementation waits so Digit theft, KeyJ steal, NAV-05 `showApLive` steal, toast-flood steal, persist, and freeze-the-sim are frozen before the first `canShowHail`. Wave 117 this worker does not ship `src/`.

If census had proved stacking and hail-reopen were gone, this pack would freeze **CONSUME** and name serial **none**. Census did not.

---

## Goals & Non-Goals

### Goals

1. Document live hail / chart / berth open flags, z-index ladder, pause policy, and hail calm from **live code**.
2. Freeze leftover = **one overlay-priority + defer + session calm gate**. Not a new key. Not AP emit.
3. Freeze deputize **mutex** of hail/chart/berth; **defer** incoming hail; **never pause** those three. Owner may override after playtest. Do not park.
4. Freeze hail reopen: `openCard` / KeyH read `ai.calmUntil`. Salvage `letGo` writes +30 s.
5. Freeze persist: **none** new. `state.js` READ-ONLY. No UU. No SKU. No new Digit.
6. Freeze HUD-01 empty hub. Digit 0/8/9 stay. KeyH/M/L stay. KeyJ stays CTL-01.
7. Freeze later copy via `textContent`. `innerHTML` forbidden.
8. Freeze accessibility: hail buttons keep `[n]` + verb. Chart/berth keep named close. Color is not the only cue.
9. Freeze a serial PR plan. This wave writes the document. A later wave ships serially.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in this worker.
- No pause-the-sim under hail/chart/berth.
- No NAV-05 `showApLive` rewrite. No close-chart-on-AP.
- No CTL-01 KeyJ remap. No `controls.js` TRACKED change.
- No HUD-02 combat rails. No HUD-01 hub child. No new Digit.
- No `state.js` write. No WORLD_FIELDS. No settings overlay-policy UI.
- No P1 toast-flood. No P2 chart-label a11y.
- Do not edit the wishlist, `PROGRESS.md`, `docs/Ctl01DockBindDesign.md`, `docs/Nav*.md`, `docs/Hud*.md`, Bio*, Msn*, Rep*, Tgt*, OwnerDecisions*.
- Do not write `docs/OwnerDecisionsWave117.md`.
- Do not fix known boot FAILs.
- Do not steal `out/w117/nav05/**`, `out/w117/ctl01/**`, `out/w116/**`.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Leftover real? | **Yes** — stack + reopen live | Inventory §7, §2 |
| CONSUME? | **No**. Serial is **not** none | Census |
| New persist key? | **No** | Contract §0.6 |
| `state.js` write? | **No** | Contract §0.5 |
| Pause hail/chart/berth? | **No** | Events drop; combat hail; freeze-the-sim |
| Mutex set | hail / chart / berth only | Inbox |
| Incoming hail vs open chart | **Defer hail** | Do not yank plot |
| KeyM/L while hail open | **Refuse** | Hail has no Escape close |
| Calm gate | `openCard` + KeyH + salvage `letGo` +30 s | Inbox "Let them go" |
| Settings / title | Stay above; capture stays | Wave 40 |
| NAV-05 `showApLive` | Do not claim | Sibling |
| Close chart on AP | Do not steal | P2 inbox |
| Toast-flood | Call out only | Other P1 |
| Named PR1? | **PR1 overlay-priority** | REAL leftover |

### 2. Current overlay motion (do not break Wave 40 / NAV-05)

Title stays `systems[0]` capture. Settings KeyO stays z 80 over title. Models z 80 pause save/restore. Pause KeyP stays. Chart still sets `flags.chartOpen` so AP/AM freeze steer (`autopilot.js` 155–156, 220) **without** closing the chart. Sibling NAV-05 already paints `showApLive` on chart Cancel and fly disengage (`galaxychart.js` 623, 709–718). Do not touch those paths. Hail still uses Digit 1–n **only as the exclusive top play card**. Station Digit 0/8/9 stay docked services.

### 3. Smallest additive punch (later)

See contract §0.1. Helper + three open gates + calm read/write. No new key bind. No pause.

### 4. Neighbours

| Module | This leftover does | This leftover does not |
|---|---|---|
| `hail.js` | later PR1: mutex, defer flush, calm gate, salvage calm, optional `hailOpen` | pause; Escape-dismiss required; Digit 0 |
| `save.js` berth | later PR1: mutex KeyL / `setBerthOpen`; optional `berthOpen` | WORLD_FIELDS; death overlay; autosave math |
| `galaxychart.js` | later PR1: KeyM / `setOpen` **refuse if hail/berth** | `showApLive`; close on AP; label a11y |
| `overlay-policy.js` | later **new** helper | persist; pause |
| `ctx.js` | optional session flags | WORLD_FIELDS |
| `hud.css` | only if mutex still needs z comment | toast z; hub |
| `autopilot.js` | none | NAV-05 |
| `controls.js` | none | KeyJ; KeyH remap |
| `hud.js` | none | combat rails; toasts |
| `state.js` | none | write |
| Title / origins / settings | honor ladder | steal Enter; steal KeyO |

### 5. Serial PR plan

Matches contract §3. **Named only. Do not implement in Wave 117.**

| PR | Lands | Does not land |
|---|---|---|
| **PR1 overlay-priority** | **Landed Wave 118.** Mutex; defer hail; calm gate; salvage +30 s; helper; chart open-gate only | persist; pause-the-sim; KeyJ; `showApLive`; close-chart-on-AP; toast-flood; Digit steal; `innerHTML` |
| **PR2 stills (optional)** | Playtest mutex + let-go calm | Required with PR1; toast-flood; known FAILs |
| **PR3 census (optional skip)** | Re-grep triple-open gone; calm read on `openCard` | New world field |

First remaining serial is **PR1 overlay-priority**. It must not steal Digit 0/8/9. It must not write `state.js`. It must not claim `src/game/autopilot.js`. It must not claim `showApLive`.

### 6. Picture

Reuse live hail card, live chart dialog, live berth panel. No new chrome required in PR1. Player sees **one** of those three. Incoming hail waits. "Let them go" stays quiet for 30 s of **world time**. The sim keeps running.

No hub pip. Digit 0 stays shipyard. KeyH/M/L stay. KeyJ stays CTL-01.

---

## Player outcome (later serial; freeze here)

Fly. Open Galaxy Chart with M. A pirate breaks. The chart **stays**. The hail card does **not** paint over the map. Close the chart (M or Escape). If the pirate still lives and calm is over, the hail card appears.

Fly. A hail card is open. Tap M or L. Chart and berth **do not** open. Resolve `[n] Let them go`. For 30 s that hull does not hail again. A disabled hulk "Leave the hulk" uses the **same** 30 s session calm. KeyH does not reopen it during calm.

Open Berth Records with L while flying. The world still moves. Hail does not appear under the panel. Digit 1 does **not** secretly accept tribute. Close with L or Escape.

Pause is still P. Settings is still O. Title still captures. Autopilot from the chart still **does not** close the chart.

`reducedMotion` is unchanged.

**NAV-05 AP handoff** is **not** this work. **CTL-01 KeyJ** is **not** this work. **HUD-02 target silhouettes** are **not** this work. **P1 toast-flood** is **not** this work.

---

## Security

See [`out/w117/overlay/security-review.md`](../out/w117/overlay/security-review.md).

- Title capture already swallows M/L/H. Do not break `systems[0]`.
- Hail Digit1–n must **not** fire while settings/title/models own the screen (hidden-card privileged action).
- XSS: no `innerHTML` for hail lines / berth meta. `textContent` only. Portrait `src` stays `portraitFor`.
- Proto: no persist merge of overlay flags. Authored overlay ids only.
- Persist: no new key. Calm session-only so a hostile save cannot freeze hail forever.
- Fail-closed never freeze the sim.

---

## Acceptance direction (implementation wave)

1. Hail + chart + berth: at most one open. Boot or playtest cannot paint all three.
2. Incoming `hailOpened` while chart/berth open: no `openCard` until the blocker closes (or drop).
3. `openCard` / KeyH: no open when `world.time < ai.calmUntil`.
4. Salvage `letGo` writes `calmUntil = time + 30`.
5. Hail/chart/berth never set `flags.paused`.
6. KeyH/M/L still those cards. KeyJ untouched. Digit 0/8/9 untouched.
7. `showApLive` text path unchanged. Chart still open after AP engage.
8. No new `WORLD_FIELDS`. No `innerHTML`.
9. Known boot FAILs untouched.

---

## Alternatives considered

| Alternative | Why not |
|---|---|
| Freeze CONSUME / serial none | Census: stack + reopen still live |
| Pause sim under all three | Drops events; freezes combat; inbox asked priority, not pause |
| Always yank chart for incoming hail | Steals NAV plot; deputize **defer** instead |
| Persist `calmUntil` on records | Survives despawn as a forever mute if clocks lie; default session |
| Close chart on AP engage | P2 inbox; NAV-05 chart-open-on-engage stays |
| Raise hail z over berth | Hidden Digit bug remains unless mutex; z-fight is not policy |
| Escape dismisses hail | Aliases `keepFiring`; not required PR1 |
| Remap overlay keys | Inbox is priority, not new binds |
| Toast z-index / dedupe | Other P1 |
| `innerHTML` hail | XSS |
| Digit / hub pip | HUD-01 / station |

---

## Regression risks

| Risk | Mitigation |
|---|---|
| Deferred hail forgotten after chart close | Flush on close; drop if ship gone / calm |
| Pause under chart dropping hails | **Forbidden** to pause play cards |
| NAV-05 `showApLive` steal | Chart write-set = open gate only |
| CTL-01 KeyJ steal | `controls.js` forbidden |
| Hail Digit while berth/settings open | Mutex + skip Digit unless hail exclusive and no title/settings/models |
| Calm persist freezing hail after load | No persist; instance `calmUntil` |
| Title capture broken | `initTitle` stays systems[0] |
| Freeze the sim on helper miss | Skip mutex; never throw |
| Digit 0/8/9 | Hail never uses Digit 0; docked station owns 8/9 |
| Toast-flood confusion | Call out; do not raise toast z |

---

## Ownership

| Object | Writer | Reader |
|---|---|---|
| Hail card / calm gate | later PR1 `hail.js` | Digit; player |
| Berth `setBerthOpen` | later PR1 `save.js` berth only | KeyL |
| Chart `setOpen` mutex | later PR1 `galaxychart.js` open gate | KeyM |
| `flags.chartOpen` | live chart | AP/AM; fireHeld; mutex |
| Helper + defer | later PR1 `overlay-policy.js` | three openers |
| `showApLive` | **none** (NAV-05) | chart |
| `pendingDock` / KeyJ | **none** (CTL-01) | — |
| `state.js` | **none** | — |
| Digit / station | **none** | — |

---

## Open owner questions

**Deputized this wave** (contract §0.1). Owner may override after playtest. Do not park.

1. Smallest additive = mutex hail/chart/berth + defer incoming hail + session calm gate. Do not pause.
2. Already-open chart/berth wins vs incoming hail (defer). Hail open blocks KeyM/L.
3. Salvage "Leave the hulk" shares the 30 s calm with "Let them go".
4. No new persist key.
5. Home: `hail.js` + berth `save.js` + helper + chart open-gate. Not `state.js`. Not `autopilot.js`. Not `showApLive`. Not KeyJ.
6. Optional PR2 stills are skippable after playtest.
