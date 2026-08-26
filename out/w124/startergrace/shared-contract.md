# AI-05 starter grace / hostility pacing shared contract

**Wave:** 124. Design only. No `src/` ships in this wave.  
**Status:** MERGE LAW for `docs/Ai05StarterGraceDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Ctl*.md`, `docs/Nav*.md`, `docs/OwnerDecisions*.md`. Do not write `docs/OwnerDecisionsWave124.md`. Do not write sibling Wave 124 paths (`out/w124/berthfreeze/**`, `out/w124/menuinput/**`).  
**Locked sources:** wishlist INBOX (P0, ONBOARDING/AI) starter grace (**cite, do not edit**); Initiative AI-04 who-is-hostile first pass DONE Wave 56 (**cite, do not edit**); live inventory `out/w124/startergrace/current-ai05-starter-grace-inventory.md` (code wins).

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over stale copy.

**This leftover is hostility pacing (when / how often / how close to home) in the starter system.** It is **not** a new who-is-hostile table. It is **not** a hail card. It is **not** PHY-02. It is **not** an onboarding encyclopedia.

**Live hop grace:** `JUMP.graceSeconds` **60** via `world.jumpGraceUntil`. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. No grace pip on the aim glass. **Do not** steal Digit 0/8/9. **No new Digit.** No new key.
3. AI-04 **who** stays: traders never hunt; patrols need scratch or standing ≤ −10; pirates keep the wave-32 interest **roll**. Grace **gates or delays** acquire / demand / duel. Grace does **not** make pirates peaceful forever. Grace does **not** change `playerInterestChance` weights as the fix.
4. Named guns stay: Sister Vane, Carver Illyx, Collector Dresk `alwaysHuntsPlayer`. Grace may delay first contact in the starter system. Grace **must not** delete ace arcs or Dresk.
5. `innerHTML` forbidden later. Toasts stay `textContent`. **No** `insertAdjacentHTML` / `document.write`.
6. `src/game/state.js` is READ-ONLY later. **No** HUD fields on `state.js`. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Do **not** change `JUMP.graceSeconds` (hop length stays **60**).
7. Persist: **no** new `WORLD_FIELDS` key. **No** new `localStorage` key. Death cooldown is **session** + `world.time`. Starter extra window reads existing `world.origin` + `world.time` + `currentSystem`. Do **not** persist `calmUntil`.
8. Later write-set **must** claim `src/systems/npc.js` first (acquire, duel grace, death calm, clamps). `src/game/world.js` only if spawn-injection timing needs a stamp. **Default PR1: no world.js write.**
9. Later write-set **must not** claim `controls.js`, `save.js` (berth or recover overlay), `overlay-policy.js`, `station.js` menus, `hail.js` cards, `origins.js`, `jump.js` hop length, `traffic.js` mix cap, `traffic-feel.js`, `physics.js`.
10. Do not steal P2 onboarding encyclopedia. Do not steal P1 hail-demand lifecycle (toast without card). Call the sibling hail hole out. Do not design hail cards.
11. Do not steal CTL-03 berth hold or CTL-04 menu digits. Do not steal `out/w124/berthfreeze/**` or `out/w124/menuinput/**`.
12. Do not retune PHY avoid, AI-01 spawn clearance, or `PIRATE_LIVE_SHARE` as the fix.
13. Fail closed. Never throw. Never freeze the sim.
    - Missing `world.origin` → **no** extra starter window (hop grace only).
    - Unknown origin id → **no** extra window.
    - Non-finite `world.time` / `jumpGraceUntil` / session death-until → treat as **no extra grace** (hostile pacing resumes).
    - `jumpGraceUntil` or session death-until **> now + 180** → clamp to `now + 180`. Do **not** grant god-mode from a corrupted timer.
    - Title / models / typing: no new input. Grace is AI-side.
14. `reducedMotion` **n/a** for this leftover. Do not invent a settings checkbox. Do not add grace animation.
15. Accessibility: PR1 adds **no** chrome. If a later optional collector toast ships in another pack, the **text** must name the collector; color is not the only cue. **Not this pack.**
16. CPU freeze: **no** per-frame DOM alloc. Grace is scalar compares on the existing hunt/duel path.
17. Prototype-safe later helpers: authored origin id literals / `Object.hasOwn` maps only. Never `for-in` a save blob into grace tables.
18. Do not edit sibling leftover docs, wishlist, `PROGRESS.md`. Do not write `docs/OwnerDecisionsWave124.md`. Deputize defaults live in **this** contract.
19. Fire-first / hail-into-fight **breaks grace for that hull only**. Existing scratch override (`npc.js` **1736–1761**) stays legal during starter/death windows. Do not add jump-grace to that block.
20. `alwaysHuntsPlayer` (Dresk) **bypasses the extra starter window**. He still honors **hop** `jumpGraceUntil` (live today) and **session death calm**. Delay is not cancel.

---

## 0.1 Wave 124 deputize (owner may override after playtest)

Pick a playable first minute that still has a living rim. Inventory proves hop grace **60 s** is LIVE and **too short**, death does **not** cool interest, law zone **300 u** is not a mining bubble. Do not park. Do not invent UU / SKU / Digit.

### Origin windows (seconds of `world.time` since unpause after origin; extra on top of hop grace)

Hop grace stays `JUMP.graceSeconds` **60** for every origin pick and every gate arrival.

| Origin | Extra starter window | Start system | Why |
|---|---|---|---|
| `greenhand` | **180** | `freehold` | Playtest case. 60 s failed. See §0.1 numbers |
| `beautiful` | **180** | `freehold` | Same berth; does not sell danger |
| `marked` | **0** extra | `freehold` | Origin sells danger (`setFear: 15`) |
| `ledgerDebt` | **0** extra | `freehold` | Origin sells danger; Dresk bypasses extra |
| `drifter` | **0** extra | `redmarch` | Chose the Redmarch; not a Freehold aquarium |
| missing / unknown | **0** extra | — | Fail closed |

**Active when:** `Number.isFinite(world.time)` AND `world.time < extra` AND `currentSystem === startSystem` AND extra > 0.

**Not active after:** the player jumps out (arrival uses hop 60 s only). Not active on a mid-career load with `world.time >= extra`.

Greenhand **180 s** why:

- Playtest died at ~60 s (exactly hop expiry).
- Station→field ≈ 1041 u ≈ **9 s** at cruise 120. Rocks sit ≈ **796 u** from Illyx’s gate (inside `ENCOUNTER_BUBBLE` 800). Lane pirates sit ≈ **526 u** from the field.
- 180 s is ~3 short mine-or-market loops, not a tutorial aquarium. 300+ s would freeze Fear. 90 s still leaves Illyx on the first rock.

Owner may override 180 after playtest. Do not park.

### Post-death interest cooldown (pick one — frozen)

**Pick: session `calmUntil` + re-roll cold.** Do not persist.

On `playerDestroyed` (npc.js listener; **do not** claim `save.js`):

1. Stamp module-scope `deathCalmUntil = now + 90`, clamped (`now` finite else skip).
2. For each **live** pirate/ace in `ctx.ships`: `ai.calmUntil = max(calmUntil, deathCalmUntil)`; `breakOff` if `target === 'player'`.
3. If `record.alwaysHuntsPlayer !== true`: `playerRolled = false`, `playerInterested = false` (re-roll cold on next acquire).
4. Dresk keeps `alwaysHuntsPlayer`. He still sits in `calmUntil` for **90 s** (delay, not cancel).

**90 s why:** playtest demand returned inside ~60 s. 90 s is longer than the failed hop, shorter than Greenhand 180, and covers overlay 2.5 s + a limp to the pad. Owner may override.

Do **not** persist a death key. `freshStart` / F5 reinstantiates AI (`playerRolled` false). Same-session recover is the hole.

### Home-berth bubble

**PR2 optional.** Not required in PR1 if (1)+(2) close the playtest. If included: distance keep-out for **unsolicited** pirate/ace acquire near the station dock envelope (reuse `LAW_ZONE_RADIUS` 300 or a slightly larger acquire-only radius). **Not** a god-mode shield. **Not** a PHY-02 rewrite. Scratch still works.

### Smallest additive PR1

| Piece | Freeze |
|---|---|
| Fail-closed | Clamps in §0.13. Never throw. |
| Additive PR1 | 1) npc.js header maps `STARTER_GRACE_SECONDS` / `STARTER_SYSTEM`. 2) Helper `starterGraceBlocksAcquire(ctx, live, now)` used by hunt acquire, demand, and `updateDuel` jump-grace site. 3) Scratch path unchanged. 4) `playerDestroyed` death calm + re-roll. 5) Clamp hop `jumpGraceUntil` at those read sites. |
| Not PR1 | `state.js`; Digit; persist; hail cards; hub pip; PHY; mix cap; collector inbound toast; encyclopedia; berth; menu digits |
| Home | `npc.js` header + acquire/duel. |
| Persist | **none** new. |

Owner freeze (do not invert):

- Who-is-hostile stays AI-04.
- Dresk is not cancelled.
- Greenhand is the playtest case; do not silently nerf Marked / ledgerDebt to Greenhand numbers.
- Census leftover is **real**. Not CONSUME. Serial is **not** none.
- If helper miss / NaN: hop grace still uses live `?? 0` then clamp; extra window off. **Never stop.**

### Formulas (later impl)

```
// LIVE hop — keep 60 s; clamp tamper
const hopUntil = Number.isFinite(ctx.world.jumpGraceUntil) ? ctx.world.jumpGraceUntil : 0
const hopBlock = now < Math.min(hopUntil, now + 180)

// NEW extra starter — origin map in npc.js; missing origin = 0
// blocks unsolicited acquire/demand/duel only when in start system
// alwaysHuntsPlayer skips THIS extra (not hop, not death calm)

// NEW death — module deathCalmUntil; NaN → 0
const deathBlock = Number.isFinite(deathCalmUntil) && now < Math.min(deathCalmUntil, now + 180)
```

Unsolicited acquire is blocked when `hopBlock || starterExtraBlock || deathBlock`, except scratch/hail-into-fight for that hull.

---

## 1. Leftover identity

| Field | Freeze |
|---|---|
| Real? | **Yes** |
| CONSUME? | **No** |
| Named serial | **PR1 starter-grace** |
| Optional | **PR2 home-berth acquire bubble**; **PR3 stills/census** |
| Who | AI-04 (done) |
| When | this leftover |

---

## 2. Neighbours (do not steal)

| Module | This leftover | Not this leftover |
|---|---|---|
| `npc.js` | PR1 grace helper, acquire/duel gate, death calm | Interest weights; PHY avoid; turrets |
| `world.js` | none in PR1 | Illyx/Vane/Dresk spawn tables |
| `origins.js` | none (existing 60 s stamp stays) | Overlay; Digit1–5 |
| `jump.js` | none | Hop 60 s |
| `save.js` | none | Berth CTL-03; recover overlay |
| `hail.js` | none | P1 demand lifecycle |
| `state.js` | none | `JUMP.graceSeconds` |
| `hud.js` | none | Hub; toast flood |
| `controls.js` | none | Keys |
| `station.js` | none | CTL-04 digits |

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1 starter-grace** | npc.js extra window + death calm/re-roll + clamps | persist; hail cards; hub pip; PHY; mix cap; Digit; `state.js`; Dresk delete |
| **PR2 home-berth bubble (optional)** | acquire keep-out near dock envelope | god-mode; PHY-02 rewrite; law-zone mining shield |
| **PR3 stills (optional skip)** | playtest Greenhand first 3 min; death recover | known boot FAILs |

---

## 4. Tradeoffs (must stay visible)

- Too long a grace makes Freehold a tutorial aquarium and weakens Fear.
- Too short keeps the playtest failure (60 s).
- Aces that wait forever feel broken; aces that spawn-duel at 60 s on Greenhand fail mining/trade careers.
- `alwaysHuntsPlayer` Dresk is origin-authored danger — extra starter must not cancel him.
- Docked shopping **burns** `world.time` (sim not paused in station). 180 s still covers a first market.
- A demand toast during grace is a **sibling** hail hole if acquire is not gated.

---

## 5. Verification (later impl; not this worker)

Domain **data**. No Vite/Chrome in Wave 124.

Later: grep helper + origin map in `npc.js`; Greenhand acquire blocked at `world.time` 10 in `freehold`; Marked extra off; Dresk extra off; hop 60 unchanged; death re-roll + calm; scratch still acquires; no new `WORLD_FIELDS`; no hub child; Digit 0/8/9 unchanged.
