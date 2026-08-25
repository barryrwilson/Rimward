# REP-03 remaining remedial missions — live inventory

**Wave:** 110. Markdown only. Code wins over wishlist / PROGRESS comments.  
**Census date:** 2026-08-24.  
**Scope:** leftover REP-03 after police leave, risky dock, restitution-to-0, and POD-01 survivor return. Wishlist: *Remedial missions can then rebuild genuine standing.*  
**Not this leftover:** REP-04 kill attribution. REP-05 covering / inbound jump / Digit 9 live-consequence copy (sibling `docs/Rep05ConsequencesDesign.md` — **do not edit**). Jobs board Digit 2 family caps, unique four, MSN-03 chains (**do not reopen**). BIO/MSN unique SKU / PHY-05 siblings.

Line numbers are 1-based from live `src/` at census. If a later serial moved a symbol, **re-census**; do not trust this file over `src/`.

---

## 0. Wishlist / PROGRESS (status only; code still wins)

| Claim | Source | Live verdict |
|---|---|---|
| Hostile space: police can order leave before fire | wishlist REP-03 757–759 | **LIVE.** Wave 95 `POLICE_LEAVE_LINE` = `Leave this space.` Band standing `< 0` and `> −10`, 300 u, once per `systemLoaded` visit (`police-leave.js` 5–8, 99–125) |
| Deeply hostile player can still attempt a risky run to a station | wishlist 760–761 | **LIVE.** Dock is range 45; **no** standing check (`state.js` 30 `U.DOCK_RANGE`; `station.js` 6222–6233). Jump refuse locks **inbound dest** `< −25`; dock stays open (`jump.js` 9–10, 104–111; Digit 9 copy `station.js` 1191) |
| Paying restitution can restore the player to **neutral** | wishlist 761–762 | **LIVE.** Wave 83 Digit 9 desk. `RESTITUTION_UU` **1200**. `applyRestitution` sets that `FACTIONS` key to **0** (`restitution.js` 5, 45–66) |
| **Remedial missions can then rebuild genuine standing** | wishlist 762–763 | **NOT shipped as named copy / loop.** Job **writers already add +2** to the dock flag with **no standing gate**. Digit 9 does **not** name the restitution → Jobs board path. This leftover is **copy / framing**, not a new `kind` |
| Returning that faction's escape-pod survivors also improves standing | wishlist 763–764 | **LIVE POD-01.** `applySurvivorRescue` (`station.js` 2003–2029). Digit 1 People / dock-root `renderRescue` (`station.js` 5590–5602). `RESCUE.otherRep` **4**, `playerKillRep` **1** (`state.js` 331–336) |

---

## 1. Restitution (consume; do not retune)

`src/game/restitution.js`.

| Symbol | Live | Cite |
|---|---|---|
| `RESTITUTION_UU` | **1200** | 5 |
| `offendedFaction(systemId)` | `Object.hasOwn(SYSTEMS)` then `FACTIONS` key | 7–12 |
| `restitutionStanding` | `standingRead` of offended key | 14–18 |
| `restitutionOffered` | docked, standing `< 0`, credits ≥ 1200 | 25–31 |
| `restitutionShort` | docked, standing `< 0`, credits `< 1200` | 33–38 |
| `applyRestitution` | dock + currentSystem match; standing `< 0`; debit 1200; **`bag[faction] = 0`**; `applyAbominationStanding`; `commLine` | 45–66 |
| Fail closed | `{ ok: false, reason }` `dock` / `faction` / `standing` / `short` | 46–60 |

**Graft after pay:** `applyAbominationStanding` (`hangar.js` 152–167) caps **Beautiful** at `min(current, −10)` while any grafted row remains. Restitution may set Beautiful to 0, then graft pulls it to **−10**. Digit 9 already names the graft cap (`station.js` 1159, 1188). **Do not retune graft as this leftover.**

Digit 9 desk (`station.js` 5776–5842):

- Shows **RESTITUTION** only when `offendedFaction` exists **and** dock standing `< 0` (5820–5821).
- Two-step: **Pay restitution** → **Confirm restitution**. Esc cancels (`cancelRestitutionPending` 5777–5781; level-2 Esc 6090).
- Copy: `Pay ${RESTITUTION_UU} UU to return this dock's standing to 0.` (5833–5834).
- Short: `Restitution ${RESTITUTION_UU} UU. Not enough UU.` No button (5840–5841).
- Success notice is `result.line` from the helper (64): `Restitution posted — 1200 UU. Standing with the dock flag returns to 0.`
- `ui.restitutionBusy` blocks double-pay (5785–5800). Autosave on ok (5793).
- After pay, standing is 0 so this **RESTITUTION** subhead **does not render**. Climb copy that lives only here would vanish. Later notes must sit in **HOW STANDING MOVES** (5844–5846), which always renders.

**Do not retune `RESTITUTION_UU`.** **Do not invent a second UU that is 1200.**

---

## 2. Standing ranks (honor; sibling REP-05 copy already landed)

`RANK_LADDER` `state.js` 714–721. First rung whose `min <= rep` wins (best-to-worst).

| min | name | tier |
|---|---|---|
| 50 | Sworn | 3 |
| 25 | Trusted | 2 |
| **10** | **Known** | **1** |
| **−10** | **Stranger** | **0** |
| −25 | Suspect | −1 |
| −1000 | Marked | −2 |

`rankFor` 722–724. Standing **0** after restitution is **Stranger, tier 0**.

`standingRead` `data-trade.js` 73–80: miss / reserved / non-faction / non-finite → **0**.

Digit 9 Standing copy (Wave 107 PR3 — **consume**):

| Helper | Role | Cite |
|---|---|---|
| `writeFactionStanding` | `Object.hasOwn(FACTIONS)` + finite delta; creates bag; `standingRead + delta` | `station.js` 1110–1121 |
| `standingLadderLines` | `Name min` rows | 1132–1139 |
| `nextStandingRung` | next `min > n` | 1142–1148 |
| `standingMoveNotes` | how standing **moves** | 1151–1160 |
| `standingLiveNotes` | hunt, leave, yards, covering, jump, restitution | 1163–1192 |
| `renderEpics` | Digit 9 panel | 5805–5888 |

**Live `standingMoveNotes` (1154–1159):** mining +`MINING_REP` dock flag; patrol +`PATROL_REP` Freehold; rescue `RESCUE`; People-desk sale; graft Beautiful cap. **No restitution→jobs rebuild sentence.**

**Live `standingLiveNotes` (1179–1191):** hunt at −10; leave band + `Leave this space.`; yards `< 0`; ace Known 10 / frigate Trusted 25; covering Known 10; yard discount; market +2%/tier; locker fear / Freehold `< −25`; graft; mining +2 / patrol +5; restitution 1200 when `< 0`; inbound jump `< −25` + skip names + dock open + `No passage.`

**Gap:** Digit 9 never says that **after 0**, existing Digit 2 renewable families are the path **above** Stranger. Mining +2 is listed as a generic mover, not as the redemption loop.

---

## 3. Jobs board (Digit 2 — do not reopen)

Dock root Digit 2 is **Jobs** (`DOCK_KEY_SERVICES[1] === 'jobs'`; labels `Jobs board` `station.js` 188, 5938). Level-2 Digit 1–n **accept** the nth card (`station.js` 6134–6136). **Do not steal Digit 2. Do not add a second board.**

### 3.1 Family caps (frozen)

`station.js` 225–232 and `save.js` 118–124:

| Family | Slots / system | Success standing | Writer cite |
|---|---|---|---|
| mining | 2 | **+`MINING_REP` (2)** origin/dock faction | `station.js` 3900–3903 |
| trade | 2 | **+2** origin faction | 3950–3953 |
| hunt | 2 | **+2** origin faction | 3617–3620 |
| passenger | 2 | **+2** origin faction | 3998–4001 |
| explore | 2 | **+2** origin faction | 4063–4066 |
| espionage | 2 | **+2** employer via `writeFactionStanding` | 4138–4139 |
| war | 2 | **+2** origin; target **`WAR_TARGET_DELTA` −2** | 3553–3559 |
| chain | MSN-03 | **+2** employer; step-1 gate **Known** | 3523–3526; `jobs-chains.js` 84–86 |

`MINING_REP = 2` (`station.js` 232). **Do not retune.** Spy expose −2 and war target −2 are **not** this leftover (`station.js` 233–234). **Do not impersonate kill −5.**

`syncMiningJobs` 2282–2303 fills two slots whenever the system exists. **No standing gate.** `acceptJob` mining 4752–4761: dock + origin; **no standing gate.** Same for trade/hunt/passenger/explore/spy/war accept paths — chain step 1 is the **only** family with `chainStandingGate`.

**Inventory proof:** existing renewable kinds **already write positive standing after 0**. **No new `kind`.** Prefer reuse.

### 3.2 Unique four (frozen — do not reopen)

`save.js` `UNIQUE_JOB_KIND` 152–157:

| id | kind | Offended-faction +standing? |
|---|---|---|
| `bounty-ace` | bounty | **No** dock-flag +2 (bounty payout path) |
| `patrol-lane` | patrol | **+`PATROL_REP` 5 Freehold only** (`station.js` 3784, 206) |
| `haul-provisions` | haul | **No** dock-flag +2 |
| `ferry-consignment` | ferry | **No** dock-flag +2 |

Patrol is **not** a generic offended-faction rebuild unless the dock flag **is** Freehold. Digit 9 already says patrol credits Freehold. **Do not lie.**

### 3.3 MSN-03 chains (frozen — do not reopen)

`jobs-chains.js` 84–86: `chainStandingGate` = `rankFor(...).tier >= 1` → **Known 10**. At standing **0**, chains **do not** post / accept step 1 (`station.js` 3482, 3655–3660, 4989–4994). After five +2 dock-flag jobs, standing 10 opens chains. **Do not lower the gate as this leftover.**

### 3.4 Jobs persist (consume)

`WORLD_FIELDS` includes `'jobs'` and `'reputation'` (`save.js` 76–78). `sanitizeOneJob` + family drop-until-cap (`save.js` 298+, 764–846). `JOB_KINDS` 150 includes mining/trade/hunt/passenger/explore/espionage/war/chain. **No remedial key.** **No new `WORLD_FIELDS`.** Inventory: standing bag + jobs array already persist. Restitution-to-0 **does not** remove job sources.

`JOBS_SANITIZE_MAX` 129–138 = unique 4 + per-system family slots + overlay 16 + `CHAIN_ROOM` 7. **Do not reset caps.**

---

## 4. Police leave / covering / jump refuse (consume)

| Surface | Live | Cite |
|---|---|---|
| Leave line | `Leave this space.` | `police-leave.js` 5 |
| Leave radius | **300** (`LAW_ZONE_RADIUS`) | 8; `npc.js` 97 |
| Leave band | standing `< 0` **and** `> −10` | `police-leave.js` 117 |
| Leave blocked flags | `beautiful`, `unknowables` | 10 |
| Leave latch | once per `systemLoaded`; docked/jump skip | 104–109 |
| Hunt player | patrols ≤ **−10** or scratched | `npc.js` 98, 1162–1167 |
| Covering | Known **10**; `Patrol covering.` | `police-cover.js` 6–9, 91–99 |
| Covering blocked | beautiful, unknowables, independent, hollow | 15 |
| Jump refuse | dest standing **`< −25`**; `No passage.` | `jump.js` 7–10, 25–33, 104–111 |
| Jump skip | unknowables, hollow, independent | 13 |
| Kill delta | **−5** victim faction | `kill-standing.js` 6 |

After restitution **0**: leave **off** (band needs `< 0`); hunt **off** unless scratched; covering **off** until Known 10; jump **open** (0 is not `< −25`). **Do not impersonate** kill −5, covering Known 10, or jump −25 as remedial knobs.

---

## 5. Persist

`save.js` `WORLD_FIELDS` 76–101. Reputation + jobs already ride `rimward-save-v1`.

`sanitizeReputation` 918–938: reserved / non-faction / non-finite keys **drop**. Missing stays missing (read as 0).

Autosave key stays `rimward-save-v1` (existing). **No** `world.remedial`. **No** wanted meter. **No** new localStorage key.

`state.js` holds `RANK_LADDER` / `RESCUE` / `FACTIONS` / `SHIP_CLASSES`. **READ-ONLY later.** Do not add `REMEDIAL_*` constants there.

---

## 6. HUD-01 / Digit freeze

| Surface | Live | Cite |
|---|---|---|
| Empty hub | `.rw-reticle` **80×80** | `src/ui/hud.css` 184–193 |
| RANGE | TGT-01 label | `hud.js` 709–712 |
| Digit 0 | shipyard (`DOCK_KEY_SERVICES` last) | `station.js` 188, 5938, 6075–6077 |
| Digit 2 | Jobs | 188, 5938, 6134–6136 |
| Digit 8 dock root | **Launch** | 188 index 7, 5938, 5891–5895 |
| Digit 9 dock root | **Standing** (`epics`) | 188 index 8, 5938, 5805 |
| Outfitting Digit 8/9 | launcher / turret **papers** | 6152–6154 |
| Dock overlay `h()` | `textContent` only | 4387–4392 |
| `innerHTML` in `station.js` | **none** | grep |

**No wanted pip. No aim-glass chrome. No new Digit.**

---

## 7. POD-01 survivor return (LIVE; consume)

| Piece | Live | Cite |
|---|---|---|
| Deltas | other **+4**, playerKill **+1** | `state.js` 331–336 |
| Apply | bag[faction] += `repDelta`; `survivorRescued` + `commLine` | `station.js` 2003–2029 |
| UI | dock-root + People `Return survivors` | 5590–5602 |

This is **not** the leftover. Copy may **name** it (already in `standingMoveNotes` 1157). Do not retune `RESCUE`.

---

## 8. What is actually missing

Writers for **positive dock-flag standing after 0** exist: mining / trade / hunt / passenger / explore / spy / war each +2 with **no** standing gate.

**Missing:**

1. Digit 9 never frames those families as the **post-restitution genuine climb** (0 → Known).
2. No fail-closed copy helper: a later PR that throws if a new module is absent would blank Standing. Live `renderEpics` must keep Pay restitution / ladder / live notes if a remedial helper is missing.
3. No named serial freeze, so a naive impl could invent a `kind: 'remedial'`, a wanted meter, a Digit, a `WORLD_FIELDS` key, or steal Digit 2.

**Not missing:** job kinds, persist keys, restitution desk, police leave, dock-open, POD-01, REP-05 covering/jump copy.

---

## 9. Digit map (do not steal)

`DOCK_KEY_SERVICES` `station.js` 188:

| Digit | Index | key | Label (`station.js` 5938) |
|---|---|---|---|
| 1 | 0 | market | Market |
| **2** | 1 | **jobs** | **Jobs board** |
| 3 | 2 | bar | Bar |
| 4 | 3 | feed | Feed & tend |
| 5 | 4 | repair | Repair |
| 6 | 5 | outfitting | Outfitting |
| 7 | 6 | people | People |
| **8** | 7 | **launch** | **Launch** |
| **9** | 8 | **epics** | **Standing** |
| **0** | 9 | **shipyard** | **Shipyard** |

First remaining serial **must not steal Digit 0/8/9**. It **must not steal Digit 2**. Remedial copy lives on **Digit 9**. Jobs stay Digit 2.

---

## 10. Fail-closed live behavior (honor)

| Condition | Today |
|---|---|
| Restitution helper missing | Digit 9 would fail import (module is live). Later extra **notes** helper must be optional |
| Standing ≥ 0 | RESTITUTION block hidden (5821). Jobs still post |
| Standing 0 after pay | Stranger; leave off; hunt off; covering off; chains off; mining +2 still works |
| Credits short | Note only; no debit |
| Beautiful graft | Cap −10 after pay; restitution may remain offered |
| `standingRead` miss | 0 — restitution not offered; jobs still +2 from 0 |
| Hunt/trade/passenger bag += | assumes `world.reputation` exists; `writeFactionStanding` creates bag. **Do not “fix” as this leftover** |
| Missing hold / PHY / BIO | other workers |

---

## 11. Grep pins (later PR2)

| Probe | Expected now |
|---|---|
| `RESTITUTION_UU` | 1200 only in `restitution.js` / Digit 9 strings |
| `kind: 'remedial'` / `'penance'` | **absent** |
| `WORLD_FIELDS` wanted / remedial | **absent** |
| Digit 9 `standingMoveNotes` rebuild-after-0 sentence | **absent** (this leftover) |
| `innerHTML` `station.js` | **absent** |
| `Leave this space.` | live |
| `Patrol covering.` | live |
| `No passage.` | live |
