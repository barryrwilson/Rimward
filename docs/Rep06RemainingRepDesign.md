# RIMWARD REP remaining leftover after named slices

| Field | Value |
|---|---|
| **Title** | RIMWARD remaining REP leftover after named REP slices |
| **Author** | Wave 122 remaining-REP leftover integrator |
| **Date** | 2026-08-25 |
| **Status** | leftover **CONSUME**. Wave 122 markdown only. Named serial: **none**. Name: **no remaining REP leftover.** |
| **Wave** | 122 — no `src/`. Bindings do not change here. |
| **Owner request** | Census **remaining REP leftover after named REP slices shipped**, from live code. Live already: Digit 9 Standing explain (Wave 74); kill victim −5 (Wave 82/83); restitution 1200 Digit 9 (Wave 83); police leave `Leave this space.` (Wave 95); covering + inbound `No passage.` (Wave 104); Digit 9 copy of those lines (Wave 107 copy); REP-03 climb copy (Wave 111); spy/war dest −2 (Wave 83). Frozen later serial still **named** in [`docs/RepStandingDesign.md`](./RepStandingDesign.md): “Patrol remains Freehold until a named serial” / optional `patrol-employer-faction`. Wishlist REP-02 wants standing to affect local police. **Code wins.** If leftover is already gone (those slices live; patrol-employer live **or** owner-frozen as skippable), freeze **CONSUME** and named serial **none**. If census finds a **real** remaining player-facing hole (example: patrol still hard-coded Freehold in another faction’s space), freeze **REAL** and name later serial **PR1** (named only). Do **not** implement `src/`. Do not invent a wanted score, a new Digit, a new persist key, invented UU, kit mutate, aim-glass gauges, or a new penance family unless inventory proves a real hole. |
| **Merge law** | [`out/w122/represt/shared-contract.md`](../out/w122/represt/shared-contract.md). If this brief and that file conflict, **the contract wins**. |
| **Honor** | HUD-01 empty 80 px hub. Aim-glass gauges stay off. Kit mutate omit. Digit 0 shipyard. Digit 8 launch. Digit 9 Standing. `RANK_LADDER` stays. `RESTITUTION_UU` 1200 stays. Kill −5 stays. Police leave band stays. `state.js` READ-ONLY later. No new persist key. `innerHTML` forbidden later. BIO graft Beautiful cap −10 while grafted: cite, do not retune. POD rescue +4/+1 and Digit 7 160/240: cite, do not retune. Do not “fix” known boot FAILs (REDMARCH `castMatches` flake). Fail-closed later: never freeze the sim. Cite, do **not** edit: wishlist, `PROGRESS.md`, `docs/RepStandingDesign.md`, `docs/Rep03RemedialDesign.md`, `docs/Rep04AttributionDesign.md`, `docs/Rep05ConsequencesDesign.md`, `docs/OwnerDecisionsWave82.md`, `docs/OwnerDecisionsWave93.md`, `docs/OwnerDecisionsWave112.md`. Do **not** write `docs/OwnerDecisionsWave122.md`. Do **not** steal `out/w122/navrest/**`, `out/w122/tgtrest/**`, `out/w111/**`, `out/w107/**`, `out/w104/**`, `out/w74/**` (read ok). Do **not** steal `src/**`. |

**Verifier record:**

| Note | Path |
|---|---|
| Inventory (code wins; Wave 122 census) | [`out/w122/represt/current-rep-remaining-inventory.md`](../out/w122/represt/current-rep-remaining-inventory.md) |
| Merge law | [`out/w122/represt/shared-contract.md`](../out/w122/represt/shared-contract.md) |
| Wave 122 security review | [`out/w122/represt/security-review.md`](../out/w122/represt/security-review.md) |
| Wave 122 design-doc review | [`out/w122/represt/code-review.md`](../out/w122/represt/code-review.md) |
| Wave 122 UI audit | [`out/w122/represt/ui-audit.md`](../out/w122/represt/ui-audit.md) |
| Wave 122 notes | [`out/w122/represt/notes.md`](../out/w122/represt/notes.md) |

Siblings NAV rest / TGT rest, named REP briefs, wishlist, `PROGRESS.md`, and Wave 82/93/112 owner files are **other workers**. **Do not edit** those paths. **Do not write** `src/`.

**This is not HUD.** **This is not NAV.** **This is not a new Digit.** **This is not `patrol-employer-faction`.** Wishlist “local police behavior” is **stale vs code**. Named slices **already live**. NPC patrols **already** fly the system flag.

---

## Overview

Named REP slices already shipped. Digit 9 explains standing. Kill writes victim −5. Restitution posts 1200 UU to 0. Local patrols order `Leave this space.` in the hostile band. Known standing covers with `Patrol covering.` Marked inbound jumps hear `No passage.` Digit 9 copies those lines. After restitution-to-0, Digit 9 names the live +2 climb. Spy lapse dest −2. War success dest −2.

Census (code wins): remaining player-facing REP leftover after those slices is **not** missing. `world.js` patrol spawn uses `def.faction` (system flag), not a Freehold constant. Leave and covering require a **local-system** patrol. Hunt reads that hull’s faction. The patrol **job** still credits Freehold Compact +5; Digit 9 and WAVE111 **name that as Compact-only**. That is unique-four honesty, not police-in-Gilded-space.

`docs/RepStandingDesign.md` still says “Patrol remains Freehold until a named serial.” Freeze from **code**, not that prose. The example REAL hole (patrol hard-coded Freehold in another faction’s space) is **false vs spawn/leave/covering/hunt**.

This leftover is **CONSUME**. Name: **no remaining REP leftover.** Do **not** freeze a remaining-REP serial.

This brief is the integrator document. Wave 122 this worker lands markdown only. Bindings do not change here.

HUD-01 empty aim glass stays empty. `state.js` stays READ-ONLY. No new persist key. Digit 0 stays shipyard. Digit 8/9 stay. Do not invent UU. Do not steal NAV/TGT. Aim-glass gauges stay off.

Wave 122 deputize (recorded here and in the contract; owner may override after playtest): **do not invent remaining REP work**. Fail closed to today’s Standing / leave / covering / jump refuse / kill / restitution / spy-war. Never freeze the sim.

If census had proved NPC patrols forced Freehold, leave/covering missing, inbound refuse missing, or Digit 9 mute on those laws, this pack would freeze **REAL** and name serial **PR1**. Census did not.

---

## Background & Motivation

### Current state (inventory)

Source of truth: [`out/w122/represt/current-rep-remaining-inventory.md`](../out/w122/represt/current-rep-remaining-inventory.md). Code wins.

| Surface | Today | Cite |
|---|---|---|
| Ladder | Sworn 50 … Marked −1000 | `state.js` **714–721** |
| `standingRead` | miss / reserved / non-finite → 0 | `data-trade.js` **73–81** |
| Persist | `'reputation'` + `sanitizeReputation` | `save.js` **77–78**, **919–940** |
| Digit 9 | Standing: ladder, moves, climb, live consequences, restitution | `station.js` **188**, **5887–5945** |
| Kill | victim −5 | `kill-standing.js` **6**; `npc.js` **2326** |
| Restitution | 1200 UU → 0 | `restitution.js` **5**, **62** |
| Leave | `Leave this space.` band `< 0` `> −10`, 300 u, once/visit | `police-leave.js` **5–8**, **117**; `npc.js` **2484** |
| Hail leave card | **none** | `hail.js` **58** |
| Covering | Known 10, `Patrol covering.` | `police-cover.js` **6–9**; `npc.js` **1372**, **1827**, **2485** |
| Jump refuse | dest `< −25`, `No passage.`; dock open | `jump.js` **7–10**, **104–111**; `station.js` `dock()` **6100** |
| Patrol spawn | `def.faction` / neighbor | `world.js` **374–385** |
| Patrol job | Freehold Compact +5; Digit 9 names it | `station.js` **3852**, **1156**, **1202** |
| Spy / war dest | −2 expose / −2 success | `station.js` **233–234**, **3583**, **4168** |
| Wanted | **absent** | `WORLD_FIELDS` **77–101** |
| Empty hub | 80 px | `hud.css` **184–189** |

The player who is Known already hears **Patrol covering.** The player in the hostile band already hears **Leave this space.** The player who is Marked already hears **No passage.** inbound and still **docks**. The player in Gilded space already meets **Gilded** patrols. Digit 9 already lists those laws. A Compact patrol **job** still thanks the Compact; the pane says so.

### Pain points

- A naive later PR that “adds police leave” would double Wave 95.
- A naive later PR that “adds covering / No passage.” would double Wave 104.
- A naive later PR that retargets patrol jobs to dock flag would **lie** vs Digit 9 and **break** WAVE111 Compact-only honesty.
- A naive later PR that “fixes” spawn to Freehold would **create** the hole this census closed.
- A naive later PR that adds a hail leave card fights Wave 93 commLine freeze.
- A naive later PR that adds `world.wanted` smashes REP-04.
- Putting a wanted pip on the 80 px hub reopens HUD-01.
- Stealing Digit 0/8/9 smashes shipyard, launch, or Standing.
- Inventing a penance `kind` reopens REP-03 “no new kind.”
- Inventing “CONSUME is boring, ship patrol-employer” invents work the owner forbade.

### Why now (design) / why not now (code)

The owner asked for a leftover census so later serials do **not** invent `patrol-employer-faction` or a wanted meter while chasing a hole named slices already closed. Inventory shows those slices **LIVE** and NPC police **not** Freehold-hard-coded. Merge law can exist without touching `src/`. Implementation does **not** wait — it **does not ship**. Wave 122 this worker does not write `src/`.

---

## Goals & Non-Goals

### Goals

1. Document live Standing, kill −5, restitution 1200, leave, covering, inbound refuse, Digit 9 copy, climb copy, spy/war −2, patrol spawn vs patrol job from **live code**.
2. Freeze leftover as **CONSUME** (not REAL). Name **no remaining REP leftover.** Serial **none**.
3. Freeze **reuse** of live law + Digit 9. No hail leave card. No wanted key. No new persist key.
4. Freeze patrol Compact +5 job as **cite-only consume**. Do not retarget.
5. Freeze BIO graft −10, POD 4/1, RANK_LADDER, Digit 0/8/9 as **honor**.
6. Freeze NAV/TGT leftover as **sibling — do not steal**.
7. Freeze a serial PR plan with **no implementation PR1**.

### Non-goals (locked — do not reopen)

- No `src/` or live bindings in this worker.
- No `patrol-employer-faction` PR1.
- No hail leave card. No wanted / crimeScore.
- No new Digit. No `state.js` write. No new persist key.
- No restitution UU retune. No kill −5 retune. No covering 10 retune. No jump −25 retune.
- No new penance `kind`. No kit mutate. No aim-glass gauges.
- No BIO / POD retune.
- No HUD / NAV / TGT steal.
- No rewrite of `docs/RepStandingDesign.md` or sibling REP briefs.
- No wishlist or `PROGRESS.md` edit.
- Do not write `docs/OwnerDecisionsWave122.md`.
- Do not steal `out/w122/navrest/**`, `out/w122/tgtrest/**`, `out/w111/**`, `out/w107/**`, `out/w104/**`, `out/w74/**`.
- Do not fix known boot FAILs.

---

## Proposed Design

### 1. Merge resolutions (contract wins)

| Question | Integrator freeze | Why |
|---|---|---|
| Leftover real? | **No. CONSUME.** | Inventory §0: named slices LIVE; NPC patrols not Freehold-only |
| Named PR1? | **None** | CONSUME |
| New persist key? | **No** | `'reputation'` already; no wanted |
| `state.js` write? | **No** | Contract §0.5 |
| `patrol-employer-faction`? | **No** | Compact job + Digit 9 honesty; spawn already local |
| Hail leave card? | **No** | Wave 93 commLine |
| Wanted / crimeScore? | **Forbidden** | REP-04; WAVE74 pin |
| New Digit / penance kind? | **No** | Honor |
| Retune 1200 / −5 / 10 / −25? | **No** | Landed knobs |
| Fail closed? | skip unknown; never pause | Live leave/covering/jump |
| Named serial? | **none** | CONSUME |

### 2. Current REP motion (do not break named slices)

Leave, covering, and jump refuse already run. Digit 9 already copies them. Restitution already sets 0. Climb copy already names +2 families. Patrol spawn already uses `def.faction`. Do not add a second law channel.

### 3. Patrol Compact job (not leftover)

Unique `patrol-lane` still writes `reputation.freehold += 5`. Job copy says Compact thanks. Digit 9 says Freehold Compact only. WAVE111 pins that sentence. Owner Wave 73: do not silently retarget. This leftover **consumes** that freeze. A later owner file may reopen patrol-employer; this pack must not.

### 4. Later UI (CONSUME)

Specified later Digit 9 / hail / patrol UI = **none**. Live Standing pane, live `commLine` leave/covering/jump, live patrol hulls already paint. CONSUME adds **no chrome**.

If an owner re-opens after a true missing-law census, PR1 (named only then) must keep Digit 9 `textContent`, polite notice, no hub pip, no hail leave card unless the owner names it, no `innerHTML`.

---

## Serial PR plan

Matches contract §3.

| PR | Lands | Does not land |
|---|---|---|
| **PR1 remaining REP** | **Does not exist.** | patrol-employer; hail leave; wanted; Digit; persist; penance `kind` |
| **PR-census (optional skip)** | Re-grep leave / covering / jump / spawn `def.faction` | `state.js`; Digit steal |

---

## Player outcome

The player already sees how standing moves, what it changes, how to recover to 0, and how local police behave. There is **no** remaining unnamed REP leftover to ship.

---

## Open owner questions

None for this leftover. CONSUME. Owner may override after playtest.
