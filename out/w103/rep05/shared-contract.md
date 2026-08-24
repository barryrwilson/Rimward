# REP-05 remaining consequences shared contract

**Wave:** 103. Design only. No allies or jump-lock feature ships in this wave.  
**Status:** MERGE LAW for `docs/Rep05ConsequencesDesign.md`. If that brief and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/RepStandingDesign.md`, `docs/Rep04AttributionDesign.md`, `docs/Hud03AlertsDesign.md`, `docs/Msn03*.md`, `docs/Tgt03*.md`, `docs/Bio*.md`, `docs/Nav*.md`, `docs/Shp*.md`, `docs/Hud02*.md`, `docs/Npc*.md`, `docs/Pod*.md`, `docs/Exp*.md`, or `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave103.md`.  
**Locked sources:** wishlist REP-02 (`docs/PLAYER-EXPERIENCE-WISHLIST.md` 672–681); live inventory `out/w103/rep05/current-rep05-inventory.md` (code wins); Wave 82 kill −5 / restitution 1200; Wave 93/95 police leave **LIVE**; Wave 100 standing deputize (pick, note, keep going).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale “police not live” comments in `docs/RepStandingDesign.md`.

---

## 0. Orchestrator merge law (do not weaken)

1. Wave 103 REP-05 worker is **markdown only**. Later impl is **serial**. Do **not** schedule or land these PRs in `src/` in this worker. Serial PR plan is **named only**.
2. HUD-01 empty **80 px hub**. No ally pip, cover pip, lock box, or “restricted system” disc on the aim glass. RANGE stays TGT-01 (`hud.js` 709–712; `hud.css` 184–191). **Do not** put allies inside `.rw-reticle`.
3. Digit 0 stays **shipyard** (`station.js` 185, 6023–6025). Digit 8 dock root stays **launch**. Digit 9 dock root stays **epics** / Standing. Outfitting Digit 8/9 stay launcher / turret papers (`station.js` 6100–6102). First remaining serial **must not steal** Digit 0/8/9. Digit 9 Standing **copy** may be a **later** named serial (PR3).
4. `innerHTML` forbidden. `textContent` / `h()` / `el()` / `createTextNode` only.
5. HUD-02 identities closed. HUD **never** writes `hullKind`. HUD may **read** `player.hullKind` as today (`hud.js` 80–87).
6. `src/game/state.js` is READ-ONLY this wave. Later impl **defaults to no `state.js` write**. Copy live numbers. Do **not** invent UU. Do **not** invent standing deltas. Do **not** impersonate `RANK_LADDER`.
7. Persist: **no** new `WORLD_FIELDS` key. Inventory does **not** prove persist is a lie. Autosave stays `rimward-save-v1`. Allies / locks **must not** invent a galaxy wanted number. Reuse `'reputation'` + live `sanitizeReputation` (`save.js` 76–101, 919–938). No `crimeScore` / `wanted` / `world.crimes` / `world.allies` / `world.locks`.
8. Prototype-safe: later helpers walk `Object.hasOwn(FACTIONS, key)` and `standingRead`. Never `reputation[userString]`. Never `for-in` merge from a blob. Reserved ids (`__proto__`, `constructor`, `prototype`, …) stay invalid as faction keys.
9. Police leave is **LIVE**. Do **not** redesign it. Copy: `Leave this space.` Who / when / 300 u / once per visit / no persist stay `police-leave.js`. Hail card stays absent.
10. Restitution stays Wave 82 **1200**. Do **not** reopen. Digit 9 desk stays live (`restitution.js`; `station.js` 5768–5790).
11. Kill standing stays **−5** victim-faction (`kill-standing.js` 6). Do **not** reopen. No system-owner extra stamp.
12. Risky run: **docking is not standing-gated** (`station.js` 5951–5978, 6181). Do **not** silently reverse. If a later serial ever docks-gates, it must name that reversal in its own owner line. This contract **forbids** dock refuse.
13. Fail-closed: missing lock/ally numbers → the deputize defaults in §1–§2. Missing / reserved / non-finite standing → `standingRead` **0** → **no** covering, **no** inbound jump refuse.
14. Unknowables / hollow / independent: **no** inbound jump lock. **No** covering. Copy police-leave `BLOCKED_FACTIONS` for covering: also skip **beautiful** and **unknowables**.
15. Do not edit sibling Tgt/Nav/Shp/Bio/Hud/Npc/Pod/Exp/Msn03 docs, the wishlist, `PROGRESS.md`, or `docs/OwnerDecisions*.md`. Do not impersonate the owner. Do not write `docs/OwnerDecisionsWave103.md`. Deputize defaults are recorded **here**.
16. Do not “fix” WAVE4 fence, WAVE26 ferry/haul, or WAVE35 haul boot FAILs.
17. Do not steal NAV-02 `.rw-nav-gate-cue`, TGT-03 `.rw-contacts`, or chart `blocked` for standing locks. Chart hover already shows rank (`chart-hover.js` 28–66).
18. Live patrol **pirate-work hunt** (`tickPatrolJob` + `findPirateWork`) stays **ungated law**. Allies serial **adds** Known+ covering. It does **not** retcon pirate-work hunt as a reputation perk.
19. New `ctx.emit` type: **default no**. Covering and jump refuse use `'commLine'`. Do not add `'allyAssist'` or `'systemLocked'`.
20. Standing deputize (Wave 100): pick playable defaults, note them in **this file**, do not park. Owner may override after playtest.

---

## 1. Deputize — allies assisting in space

Owner may override after playtest. Do not park.

### 1.1 Who

Local-system-faction **`patrol`** NPCs only.

Copy police-leave allowlist (`police-leave.js` 46–56):

- `role === 'patrol'`
- hull active (not destroyed / disabled / surrendered)
- record/state faction must match `SYSTEMS[current].faction`
- skip if neither record nor state has a faction string

**Never:** pirate, ace, trader, miner, Unknowable hull, Beautiful-as-faction patrol, player wing spawn, extra ship grant.

**Fail-closed flags:** `beautiful`, `unknowables` (copy `BLOCKED_FACTIONS` `police-leave.js` 10). Independent / hollow system flags: **no covering**.

Do **not** mint a new NPC role. Do **not** persist an ally list.

### 1.2 When (standing gate)

`standingRead(ctx.world.reputation, systemFaction) >= 10`

Copy live **Known** min (`RANK_LADDER` 10; ace `MIN_REP` 10; `chainStandingGate` `tier >= 1`).

| Band | Covering |
|---|---|
| Missing / NaN / reserved → read 0 | **No** |
| Marked / Suspect / hunt ≤ −10 | **No** (hunt already owns patrol vs player) |
| Leave band `< 0` and `> −10` | **No** (police leave owns that band) |
| Stranger `>= 0` and `< 10` | **No** (live pirate-work hunt still runs) |
| Known+ `>= 10` | **Yes**, if §1.3 target exists |

Do **not** use `npc.js` `standingOf` (no `hasOwn`). Use `standingRead`.

### 1.3 What

**Fire** (existing patrol `mode = 'hunt'`). Not escort formation. Not hail card.

**Target:** already-hostile **pirate** or **ace** that the player is fighting:

- `lastAttackerOf(hostile) === 'player'`, **or**
- `ctx.targets.current === hostile`

**vsPlayer:** **never.** Covering must not lock the player.

**vsAlready-hostile:** pirate/ace only. Never trader, miner, patrol, Unknowable.

**Law zone:** keep `LAW_ZONE_RADIUS` **300**. Covering does **not** start hostile intent inside the zone. Copy `hunterHasWork` station skip (`npc.js` 1157).

**Live pirate-work hunt:** keep `findPirateWork` ungated (`npc.js` 1274–1280). Covering is **additive** for Known+ player fights that pirate-work does not already pick.

### 1.4 Channel / HUD

- Reuse `'commLine'`. HUD already toasts (`hud.js` 494–502).
- New authored line **`Patrol covering.`** (no live string means covering; do not reuse `Leave this space.`).
- Once per `systemLoaded` visit (copy police-leave latch shape; **separate** latch; do not share `firedThisVisit` with leave).
- No hail card. No song sting required. No aim-glass gauge. No ally pip.
- Digit 9 copy of this line waits for **PR3**.

### 1.5 Persist

**None.** Live latch only.

---

## 2. Deputize — locked systems / station access

Owner may override after playtest. Do not park.

### 2.1 What is locked (XOR)

| Surface | This serial | Why |
|---|---|---|
| **Inbound jump** | **Yes.** Dest system faction standing `< −25` | Copy locker Marked exclusive (`RESTRICTED_REP_GATE` −25; `station.js` 187, 2058). Rank name Marked. −25 Suspect does **not** lock |
| Outbound jump | **No.** Always leave | Do not trap |
| **Dock** | **No** | Risky run (`station.js` 6181). Named freeze |
| Yard sale | **Already live** `rep < 0` | Do not double-gate |
| Locker | **Already live** fear 40 or Freehold `< −25` | Do not retune |
| Archive | **Already live** `< 0` → `No sale.` | Do not retune |
| Unique chains | **Already live** Known | MSN-03 owns it |
| Repair / market / people | **No** extra standing lock | Risky run still uses the dock |
| Chart lock box / hub disc | **No** | HUD-01 / NAV freeze |

### 2.2 Fail-closed dest flags

If dest `SYSTEMS[to].faction` is **`unknowables`**, **`hollow`**, or **`independent`**: **do not** inbound-lock.

If dest faction missing / reserved / not in `FACTIONS`: **do not** lock (`standingRead` 0 would otherwise never hit `< −25`; still skip explicit).

Beautiful dest **may** lock at `< −25` (not in the Unknowables/hollow/independent skip set). Covering still skips beautiful (`§1.1`).

### 2.3 Jump bind

Later PR2: refuse **before** `beginJump` succeeds.

Preferred site: `jump.js` `beginJump` (single consume of `jumpRequested` from gate **and** autopilot). `gate.js` may keep emitting; jump no-ops.

If refused:

- do **not** set `ctx.gate.jumping`
- emit `'commLine'` `{ text: 'No passage.' }`
- throttle: once per destination per `systemLoaded` visit (do not spam KeyG)
- `textContent` toast path only

Do **not** reuse `Leave this space.`

Do **not** write `world.nav` blocked for standing. NAV `blocked` stays plot-unreachable (`galaxychart.js` 537).

### 2.4 Persist

**None.** Recompute from `'reputation'` + dest `SYSTEMS` faction each request.

---

## 3. Picture — surfaces stay distinct

| Job | Owner | This remaining REP-02 |
|---|---|---|
| Hunt player ≤ −10 | `npc.js` `mayHuntPlayer` | **Untouched** |
| Leave band | `police-leave.js` **LIVE** | **Untouched** |
| Pirate-work hunt | `tickPatrolJob` + `findPirateWork` | **Untouched** (ungated law) |
| Known+ covering | later PR1 | **New** hunt target = player’s pirate/ace fight |
| Inbound Marked jump | later PR2 | **New** refuse + `No passage.` |
| Dock | `station.js` `dock()` | **Untouched** (open) |
| Yard / locker / archive / restitution | live | **Untouched** |
| Digit 9 copy | later PR3 | two authored consequence lines after sim exists |
| 80 px hub | HUD-01 | **Untouched** |
| Shipyard Digit 0 | `station.js` | **Untouched** |

Do not merge covering with police leave. Do not merge jump refuse with chart `blocked`.

---

## 4. Copy (authored; XSS-safe)

| Line | Use | Reuse? |
|---|---|---|
| `Leave this space.` | Police leave **only** | Live. Do not reuse |
| `Patrol covering.` | Known+ covering start | **New.** `commLine` |
| `No passage.` | Inbound jump refuse | **New.** `commLine` |
| `No sale.` | Yard / archive | Live. Do not steal for jump |

Faction display names: `FACTIONS[key].name` after `Object.hasOwn` only. Never `innerHTML`.

---

## 5. Security / emit / persist

- No new world field. No ally id list in the save blob.
- Jump dest `to` already comes from gate route / `SYSTEMS`. Still sanitize: `Object.hasOwn(SYSTEMS, to)` before read (`jump.js` 71 already).
- Do not index `SYSTEMS[userString]` or `FACTIONS[blobFaction]` without `hasOwn`.
- Do not assign `innerHTML` on toasts, Standing notes, jump HUD, or chart.
- Do not log credits next to covering.
- Covering latch and jump-refuse latch are **module memory**, reset on `systemLoaded`, same pattern as `firedThisVisit` (`police-leave.js` 12–16). Do not persist them.

---

## 6. Closed HUD / keys / digits / SKU

- 80 px hub stays empty of new children. RANGE stays TGT-01.
- Do not set `ctx.targets.current` except via existing KeyT/KeyV.
- Digit 0 shipyard. Digits 1–9 stay. Weapon groups 1–5 stay.
- No extra Digit. No `TRACKED` key. No SKU. No UU.
- KeyG stays jump. Do not steal KeyT / KeyV / KeyK / KeyX / KeyO / Digit 8/9.
- HUD never writes `hullKind`.

---

## 7. Ownership (later impl)

| Object | Writer | Reader |
|---|---|---|
| `ctx.world.reputation` | existing writers only | covering gate; jump refuse; Digit 9 |
| Covering latch | later helper (live) | later helper |
| Jump refuse latch | later `jump.js` (live) | later `jump.js` |
| Patrol `ai.mode` | `npc.js` | combat |
| `'commLine'` | later helper / jump | `hud.js` toast |
| `state.js` | **nobody** in these serials | RANK_LADDER / FACTIONS / SYSTEMS read |
| Digit 9 notes | PR3 `standingLiveNotes` | Standing pane |

---

## 8. Serial PR plan (named only — not this wave)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 allies covering** | helper; Known 10; patrol-only; vs pirate/ace player fight; law zone skip; `Patrol covering.` once/visit; `standingRead` | escort AI; vsPlayer; Digit 0/8/9; hail; persist; `standingOf` |
| **PR2 inbound jump** | `beginJump` refuse dest standing `< −25`; skip unknowables/hollow/independent; `No passage.` once/dest/visit | dock refuse; outbound lock; chart lock box; `world.nav` standing blocked; Digit steal |
| **PR3 Digit 9 copy** | `standingLiveNotes` lines for **live** police leave + covering + `No passage.` (only after PR1/PR2 exist) | new Digit; false claims before sim |
| **PR4 boot pins** | no `wanted`; covering skip vsPlayer; jump dest independent not locked; proto bag; Digit 0 still shipyard; police leave still `Leave this space.` | wishlist / PROGRESS rewrite |

`state.js` untouched. Boot pins belong in `scripts/boot-test.mjs` in the implementation wave (not this worker).

---

## 9. Numbers (copy live; do not invent)

| Token | Value | Source |
|---|---|---|
| Known gate | **10** | `RANK_LADDER` / `MIN_REP.ace` / `chainStandingGate` |
| Marked inbound | **< −25** | `RESTRICTED_REP_GATE` |
| Hunt | **≤ −10** | `HOSTILE_STANDING` |
| Leave band | **< 0** and **> −10** | `police-leave.js` |
| Law / leave range | **300** | `LAW_ZONE_RADIUS` / `POLICE_LEAVE_RADIUS` |
| Dock range | **45** | `U.DOCK_RANGE` |
| Restitution | **1200** | `RESTITUTION_UU` — do not reopen |
| Kill delta | **−5** | `KILL_STANDING_DELTA` — do not reopen |
| Locker fear | **40** | `tributeOpensAt` — do not retune |
| Ace / frigate min-rep | **10 / 25** | `MIN_REP` — do not retune |

No new UU. No new standing delta.
