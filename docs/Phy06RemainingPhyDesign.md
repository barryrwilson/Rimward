# RIMWARD remaining PHY leftover after PHY-05

| Field | Value |
|---|---|
| **Title** | RIMWARD remaining PHY leftover after named PHY slices |
| **Author** | Wave 123 remaining-PHY leftover integrator |
| **Date** | 2026-08-25 |
| **Status** | leftover **CONSUME**. Wave 123 markdown only. Named serial: **none**. Name: **no remaining PHY leftover.** |
| **Wave** | 123 — no `src/`. Bindings do not change here. |
| **Owner request** | Census **remaining PHY leftover after named PHY slices shipped**, from live code. Live PHY already shipped PHY-01 solid bounce/slide; PHY-02 NPC avoid (Wave 58 station/gate keep-out; PHY-04 two-sample 20 u mid + frame hold, no navmesh); PHY-03 sun heat/kill; PHY-05 pad-home persist heal + patrol heavy hold outside D5. PHY-04 PR3 far 80 u is skippable. Wishlist PHY still wants solid bodies, NPC avoid, lethal suns, traffic that does not tunnel stations. **Code wins.** If remaining leftover is already gone (named slices live; remaining wishlist bullets live or owner-omitted/skippable), freeze leftover **CONSUME** and named serial **none**. Name: **no remaining PHY leftover.** If census finds a real remaining player-facing hole that is not a named skippable omit (example: a role still homes to pad-center after save, or sun lethal missing), freeze leftover **REAL** and name later serial **PR1** (named only). Do **not** implement `src/`. Do not invent a navmesh, a new Digit, a new persist key, UU, SKU, kit mutate, aim-glass gauges, or a hub collision pip unless inventory proves a real hole. |
| **Merge law** | [`out/w123/phyrest/shared-contract.md`](../out/w123/phyrest/shared-contract.md). If this brief and that file conflict, **the contract wins**. |
| **Honor** | HUD-01 empty 80 px hub. Aim-glass gauges stay off. Kit mutate omit. Digit 0 shipyard. Digit 8/9 stay. No new Digit. `state.js` READ-ONLY. No new persist key. `innerHTML` forbidden later. PHY-04 80 u skippable. Power ledger out. Do not “fix” known boot FAILs (REDMARCH `castMatches` flake; WAVE26 closed Wave 119). Do **not** write `docs/OwnerDecisionsWave123.md`. Do **not** edit wishlist, `PROGRESS.md`, `docs/Phy04AvoidDesign.md`, `docs/Phy05PadHomeDesign.md`, `docs/OwnerDecisions*`, Nav/Tgt/Rep leftover docs, sibling Wave 123 packs. Do **not** steal `out/w123/astrest/**`, `out/w123/fxrest/**` (read ok). |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins; Wave 123 census) | [`out/w123/phyrest/current-phy-remaining-inventory.md`](../out/w123/phyrest/current-phy-remaining-inventory.md) |
| Merge law | [`out/w123/phyrest/shared-contract.md`](../out/w123/phyrest/shared-contract.md) |
| Wave 123 security review | [`out/w123/phyrest/security-review.md`](../out/w123/phyrest/security-review.md) |
| Wave 123 design-doc review | [`out/w123/phyrest/code-review.md`](../out/w123/phyrest/code-review.md) |
| Wave 123 UI audit | [`out/w123/phyrest/ui-audit.md`](../out/w123/phyrest/ui-audit.md) |
| Wave 123 notes | [`out/w123/phyrest/notes.md`](../out/w123/phyrest/notes.md) |

Siblings AST rest / FX rest, named PHY briefs, wishlist, `PROGRESS.md`, and Wave 112 owner collision-curve notes are **other workers**. **Do not edit** those paths. **Do not write** `src/`.

**This is not NAV.** **This is not TGT.** **This is not FX.** **This is not AST belts.** **This is not autopilot.** **This is not MATCH.** Wishlist PHY bullets are **stale vs code** when they still read as undone. Named slices **already live**.

---

## Overview

Named PHY slices already shipped. PHY-01 bounce/slide. PHY-02 Wave 58 station/gate keep-out plus PHY-04 two-sample 20 u mid and frame hold (no navmesh). PHY-03 sun heat/kill. PHY-05 patrol heavy hold + persist heal on existing `record.route`. PHY-04 PR3 far 80 u is skippable.

Census (code wins): remaining player-facing PHY leftover after those slices is **not** missing. Stations, gates, rocks, and ships bounce. NPCs steer with 40 u + 20 u mid. Suns heat then kill. Patrols do **not** persist-home to pad-center. Traffic holds sit outside D5. Collision stays the safety net.

This leftover is **CONSUME**. Name: **no remaining PHY leftover.** Do **not** freeze a remaining-PHY serial.

This brief is the integrator document. Wave 123 this worker lands markdown only. Bindings do not change here.

HUD-01 empty aim glass stays empty. `state.js` stays READ-ONLY. No new persist key. Digit 0 stays shipyard. Digit 8/9 stay. Do not invent UU. Do not invent a navmesh. Do not steal AST/FX. Aim-glass gauges stay off.

Wave 123 deputize (recorded here and in the contract; owner may override after playtest): **do not invent remaining PHY work**. Fail closed to today’s bounce / avoid / sun / pad-home. Never freeze the sim.

If census had proved a role still homes to pad-center after save, sun lethal missing, bounce gone, or NPC avoid gone, this pack would freeze **REAL** and name serial **PR1**. Census did not.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w123/phyrest/current-phy-remaining-inventory.md`](../out/w123/phyrest/current-phy-remaining-inventory.md). Code wins.

| Surface | Today | Cite |
|---|---|---|
| PHY table | bounce, sun, avoid, gate torus knobs | `physics.js` **6–23** |
| Bounce | `resolveMover` + `bounceLive` + player integrate | `collision.js` **457**; `npc.js` **730**, **2434**; `ship.js` **905–937** |
| Gate volume | torus; bore empty; tube solid | `collision.js` **102**, **504–505**; WAVE58 **11783–11835** |
| NPC avoid | 40 u + mid 20 u; station path keep-out | `npc.js` **643–703**, **557**, **605** |
| Frame hold | dest in D5 → hold this frame; no `record.route` | `npc.js` **781–817**, **835–839** |
| Far 80 u | **absent** (PHY-04 PR3 skippable) | `npc.js` grep `look * 2` = 0 |
| Sun heat/kill | zone 1 DPS; zone 2 packet + `sunKill` | `collision.js` **318–342**; `combat.js` **1873–1898** |
| Pad-home | patrol `writeStationHold` heavy; `healPadHome` patrol | `world.js` **381**, **669–735**, **457**, **846** |
| `station.clone()` in `src/` | **none** | grep 0 |
| Persist PHY extra | **none** | `save.js` **77–102** |
| `state.js` PHY | **none** | grep 0 |
| Empty hub | 80 px | `hud.css` **184–193** |
| Digit 0 / 8 / 9 | shipyard / launch / epics | `station.js` **188**, **6171–6176** |

The player who rams a station already slides. The player who flies a sun already heats then dies. The player who watches traders already sees holds outside D5. The player who saves a patrol already restores a heavy hold, not the pad. Wishlist “solid bodies / avoid / lethal suns / no tunnel” is **stale vs code**.

### Pain points

- A naive later PR that “adds remaining PHY” would **double-ship** bounce, avoid, or pad-home.
- A naive later PR that builds a navmesh would smash CPU and AP ownership.
- A naive later PR that ships PHY-04 PR3 80 u as leftover would ignore the owner skip.
- A naive later PR that “fixes” patrol pad-home would double Wave 110.
- A naive later PR that retunes sun radii would reopen PHY-03.
- A naive later PR that retunes `IMPACT_MIN_SPEED` would fight Wave 112 linear curve.
- A naive later PR that puts a collision pip on the 80 px hub reopens HUD-01.
- A naive later PR that adds `world.avoid` or `world.padHome` invents a persist key.
- A naive later PR that writes PHY keys on `state.js` fights READ-ONLY.
- Inventing “CONSUME is boring, add 80 u / navmesh” invents work the owner forbade.

### Why now (design) / why not now (code)

The owner asked for a leftover census so later serials do **not** invent a navmesh, 80 u sample, or hub pip while chasing holes named slices already closed. Inventory shows PHY-01..05 **LIVE** and **no** second unnamed PHY hole. Merge law can exist without touching `src/`. Implementation does **not** wait — it **does not ship**. Wave 123 this worker does not write `src/`.

---

## Goals & Non-Goals

### Goals

1. Document live bounce, avoid, sun, pad-home, Digit, persist from **live code**.
2. Freeze leftover as **CONSUME** (not REAL). Name **no remaining PHY leftover.** Serial **none**.
3. Freeze **reuse** of live PHY-01..05. No navmesh. No new persist key.
4. Freeze PHY-04 PR3 80 u as **skippable**. Do not ship it as leftover.
5. Freeze Wave 112 impact curve as **cite-only**. Do not retune.
6. Freeze NAV / TGT / FX / AST / AP / MATCH as **sibling — do not steal**.
7. Freeze a serial PR plan with **no implementation PR1**.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in this worker.
- No navmesh / A* / `planApPath` in NPC.
- No PHY-04 PR3 80 u leftover serial.
- No PHY-01 bounce replace. No PHY-03 radius retune. No PHY-04 `applyAvoidBias` retune.
- No PHY-05 second heal helper. No pirate/ace pad rewrite.
- No player FLT lookahead leftover (player station/gate is collision).
- No hub collision pip. No aim-glass gauge. No kit mutate.
- No new Digit. No `state.js` write. No new persist key.
- No invented UU / SKU.
- No AST belts. No FX punch. No autopilot. No MATCH.
- Do not pause the sim.
- Do not edit the wishlist, `PROGRESS.md`, sibling Phy/Nav/Tgt/Rep/Owner docs.
- Do not write `docs/OwnerDecisionsWave123.md`.
- Do not steal `out/w123/astrest/**`, `out/w123/fxrest/**`.
- Do not fix known boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Leftover real? | **No. CONSUME.** | Inventory §0: named slices LIVE; 80 u skippable; navmesh omit |
| Named PR1? | **None** | CONSUME |
| New persist key? | **No** | `record.route` already; no `padHome` / `avoid` |
| `state.js` write? | **No** | Contract §0.5 |
| Navmesh / A*? | **No** | Owner freeze; PHY-04 no-navmesh |
| PHY-04 80 u? | **Skippable; not leftover** | Owner omit |
| Hub collision pip? | **No** | HUD-01 |
| New Digit? | **No** | Digit 0/8/9 live |
| Fail closed? | skip missing bag; never pause | Live bounce/avoid/heal |
| Wishlist “not full path planning”? | Stale vs leftover; code wins | Two-sample LIVE; planner omit |

### 2. Current PHY motion (do not break named slices)

Player flies. Integrate then `resolveMover` (sun stripped). Bounce/slide. Fast scrape peels screens on the linear curve. Near a sun: heat toast then lethal packet.

NPC ticks collect the bag + sun heat radius. `steerLive` may frame-hold dest outside D5, then two-sample bias. Bounce is the net. Patrol `route[0]` authors and heals as a heavy hold. Spawn uses `recordPosition`.

Do not add a planner. Do not add a third sample as leftover.

### 3. Serial plan

**PR1 remaining PHY does not exist.** Do not invent work.

Optional later census (named only): re-grep `resolveMover`, `addMidChordHit`, `sunKill`, `healPadHome` patrol, `writeStationHold(..., 'heavy'`. If still live → keep CONSUME.

---

## Player outcome

The player already cannot pass through major objects at cruise. Low-speed contact slides. NPC traffic homes outside D5 and steers around stations/gates. Suns heat then kill. There is **no** remaining unnamed PHY leftover to ship.

---

## Open owner questions

None for this leftover. CONSUME. Owner may override after playtest.
