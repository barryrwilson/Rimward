# TGT-07 combat cycle shared contract

**Wave:** 130. Design only. No combat-cycle ships in this wave.  
**Status:** MERGE LAW for `docs/Tgt07CombatCycleDesign.md`. If that document and this file ever disagree, **this file wins**.  
**Leftover:** **REAL.** Not CONSUME. Serial is **not** none. Named later serial: **PR1** (KeyT hostiles-first then range while a hostile is in the target envelope).  
**Name:** combat cycle hostiles-first.  
**One law:** (a) combat-hostiles-first then range on **KeyT**. **Not** (b) a new “target my attacker” key. Do **not** ship both in PR1.  
**Not this wave:** any edit under `src/`, `scripts/`, `public/`, `index.html`, `package.json`. Do not edit `docs/PLAYER-EXPERIENCE-WISHLIST.md`, `PROGRESS.md`, `docs/Tgt03*.md`, `docs/Tgt05*.md`, `docs/Tgt06RemainingTgtDesign.md`, `docs/Hud0*.md`, `docs/Nav*.md`, `docs/Ctl*.md`, `docs/AgentApiDesign.md`, `docs/Hail0*.md`, `docs/OwnerDecisions*.md`. Do not steal sibling Wave 130 packs (`out/w130/nav10/**`, `out/w130/msn04/**` if present). Do not steal optional PR2s (Agent API, Hail01, HUD-06, Hail02, HUD-07, NAV-09, CTL-03, AI-05, CTL-04). Do not write `out/w130/tgtcycle/verify/**`.

**Locked sources:** wishlist INBOX (P2, TGT) Playtest capture 2026-08-25 second pass lines **180–183** (cite, do not edit); live inventory `out/w130/tgtcycle/current-tgt07-combat-cycle-inventory.md` (code wins); TGT-03 awareness live (`docs/Tgt03AwarenessDesign.md`); TGT-05 KeyV live; TGT-06 remaining leftover **CONSUME** (this hole is **new** after that census); AI-04 live `ai.intent` / `flags.combat` / `mayHuntPlayer`.

Integrator rule: a **later** implementation wave obeys this file. Inventory cites live code. Code wins over `ctx.js` **88** “cycle nearest hostiles”.

**This leftover is KeyT cycle order.** It is **not** TGT-03 Incoming fire. It is **not** a hub PPI. It is **not** KeyV. It is **not** Agent cheat lock.

**Live hole:** `cycleTarget` sorts by `d2` only (`controls.js` **139**). No attacker-lock key. **Leftover is real. Not CONSUME. Serial is not none.**

---

## 0. Orchestrator merge law (do not weaken)

1. This worker is **markdown only**. No `src/`. Later impl is **serial**. Serial PR plan is **named only**. Do **not** land these PRs in `src/` in this worker.
2. HUD-01 empty **80 px hub**. Aim-glass gauges stay off. Kit mutate omit. **No** PPI. **No** incoming gauge. **No** lock box on the hub.
3. Digit 0/8/9 stay. **No new Digit.** KeyH/J/L/M/P stay. KeyT stays the **cycle** key. **Do not remap KeyV / KeyX / KeyK.** Do not add a new TRACKED code for attacker-lock in PR1.
4. `innerHTML` forbidden later. Help / HUD copy uses `textContent` / `createTextNode` / `el()` only.
5. `src/game/state.js` is READ-ONLY. Persist: **none**. Do **not** invent UU. Do **not** invent SKU. Do **not** invent Digit. Do **not** add WORLD_FIELDS. Do **not** persist cycle mode / god-mode auto-lock.
6. One law: **(a)** hostiles-first then range. **Not both** with (b) attacker-lock key in PR1. Owner may later pick (b) **instead** of (a) after playtest — that would be a **different** serial, not a second PR1 feature.
7. Define “hostile” from **live AI/resolve (AI-04)**: `live.ai && live.ai.intent === true`. Same bit as HUD contacts (`hud.js` **1734**). **Do not** invent a faction table. **Do not** use `save.js` `ai.hostile`. **Do not** use `role === 'pirate'|'ace'` without intent. **Do not** use standing ≤ −10 as the cycle bit (`mayHuntPlayer` is eligibility, not fire).
8. Gate: hostiles-first **only when at least one in-envelope cycle candidate is hostile**. Envelope = live KeyT envelope (`U.TARGET_RANGE` **600**). If no in-range hostile, keep live **d2-only** sort. Do **not** require `flags.combat` alone (`ENCOUNTER_BUBBLE` is **800**).
9. Rocks stay **group-3 only**. Rocks are **never** hostile for this sort (no `ai.intent`). Station / gate / pod / landmark KeyV locks stay TGT-05 — **not** in `cycleTarget`.
10. Q-ship cover class stays HUD-02. Cycle **must not** unmask `classKey` / cover name. Intent still ranks a hunting Q-ship as hostile.
11. TGT-03 Incoming fire. / Incoming dart. / contacts arc / edge-arrow stay. **Do not** steal. **Do not** add a second incoming live region. **Do not** make Incoming toast select a lock.
12. TGT-06 remaining-TGT CONSUME stays for **named-slice leftovers**. This pack is **TGT-07**, a **new** inbox hole. Do **not** invent a hub PPI as TGT-06 revival.
13. Fail closed:
    - Never throw from `cycleTarget`.
    - Missing `ai` / unknown / destroyed / disabled → **not hostile** (destroyed already skipped). Do not throw.
    - Q-ship cover: treat as any other ship (intent bit only).
    - Missing `object` / non-finite `d2` → skip candidate.
    - `findIndex` miss (`idx === -1`) → first of the **sorted** list (nearest hostile when the gate is on).
    - Reserved proto ids on kind locks stay TGT-05 drop — cycle does not grow kinds.
    - Never freeze the sim. Never write `flags.paused`.
14. `reducedMotion`: **no** new animation. Cycle is input order, not a HUD tween.
15. Accessibility: KeyT remains the cycle key. If help copy changes, it stays **text** (`config.controls` strings). Color is not a cycle cue.
16. CPU: same candidate walk as live (ships in 600; rocks if group 3). **No** second all-ships scan. Sort stays in-place on the small cand list. **No** per-frame DOM alloc.
17. Prototype-safe: do **not** `for-in` `ctx.ships`. Keep `for…of` / index walk. Do not merge raw lock blobs.
18. Agent API must **not** become a cheat lock. Do **not** claim `agent-api.js`. Do **not** add `act({name:'target'})` that bypasses envelope / intent / wrap. Observe may keep reading `targets.current`.
19. Do not “fix” known REDMARCH `castMatches` flake.
20. Do not steal sibling Wave 130 packs (NAV-10 dock approach, MSN-04 job dedup). Do not steal optional PR2s listed in the header.
21. Do not edit sibling honor docs, the wishlist, or `PROGRESS.md`. Deputize defaults live in **this** contract.
22. Do **not** invent a hub PPI. Do **not** invent aim-glass gauges. Incoming fire toast/gauge: cite TGT-03; do not steal.

---

## 0.1 Wave 130 deputize (owner may override after playtest)

Pick playable **KeyT hostiles-first then range**. Inventory proves the hole is **live**. Do not park. Do not invent a new key unless the owner **replaces** law (a) with law (b) after playtest.

### Live knobs (do not retune as the “fix”)

| Knob | Live | Cite |
|---|---|---|
| Cycle envelope | 600 u | `state.js` **32**; `controls.js` **121** |
| Encounter bubble | 800 u | `state.js` **27**; `npc.js` **2680** |
| Sort | `d2` only | `controls.js` **139** |
| Hostile bit | `ai.intent` | `npc.js` **247**; `hud.js` **1734** |
| Combat flag | intent in 800 u | `npc.js` **2684** |
| Contacts HUD sort | lock → hostile → dist | `hud.js` **1738–1751** |
| Incoming copy | `Incoming fire.` / `Incoming dart.` | `npc-fire-toast.js` **8–9** |
| KeyV cone | 12 px | `reticle-aim.js` **15** |
| Agent `target` act | **not live** | `agent-api.js` **150** |

Do **not** “fix” the hole with Incoming toast lock, KeyV remap, or Agent lock.

### Playable policy (smallest additive)

**Name:** when KeyT fires `cycleTarget`, if any in-envelope **ship** candidate has `ai.intent === true`, sort **hostile ships first by `d2`**, then non-hostiles (other ships + group-3 rocks) by `d2`. Then wrap as live.

| Piece | Freeze |
|---|---|
| **Who** | Player KeyT / `input.targetPressed` only. Not KeyV. Not Agent. |
| **Gate** | ≥1 in-envelope cycle candidate with `ai.intent === true`. Else live d2-only. |
| **Hostile** | `ref.ai && ref.ai.intent === true` and the ref is a live ship (`object`, not destroyed, not a rock, no `lockKind`). Missing `ai` → false. |
| **Order** | hostiles by `d2` ascending, then others by `d2` ascending. Stable enough: equal `d2` keep scan order (JS sort not required to be stable — do not add a tie-break id). |
| **Wrap** | live `(idx + 1) % n`. Current friendly stays in the non-hostile bucket; next T follows the sorted list (may pass other non-hostiles before wrap to hostiles). **Not** skip-to-attacker (that is law (b)). |
| **Empty / not in list** | first of sorted list = nearest hostile when gated. |
| **Rocks** | group 3 only; always non-hostile bucket. |
| **Kinds** | not in cycle. |
| **Q-ship** | intent only; no class pierce. |
| **Help** | KeyT stays cycle. Optional PR1 textContent: `'T — cycle target (hostiles first in combat)'`. Do not add a second help key. |
| **HUD contacts** | **read** the same intent bit. Do **not** rewrite the contacts sorter as this leftover (HUD-07 / layout). Display already ranks hostiles. |
| **Incoming** | untouched. |
| **Persist** | **none**. |
| **Fail-closed** | never throw; never pause; never innerHTML; never new key. |

### Later copy (authored `textContent` literals)

Optional help line only. Default if the owner wants a visible cue:

`T — cycle target (hostiles first in combat)`

If the owner wants silent behavior, keep `'T — cycle target'`. Deputize: **update the help line** so the playtest hole is named. Owner may override after playtest.

Do **not** toast on each T. Do **not** name the selected hull in a new live region (HUD-04 / TGT-03). Existing tgt rail already names the lock.

---

## 1. Later write-set (document now; do not edit those files this wave)

**This pack owns later:**

- **Writer:** `src/systems/controls.js` — `cycleTarget` sort only; optional `config.controls` help string for KeyT; optional one-line JSDoc / `ctx.js` **88** comment so “nearest hostiles” matches code.

**Do not claim:**

- `src/systems/hud.js` layout / contacts sorter / toast / hub / gauges / context prompt (HUD-07 / HUD-06 / TGT-03).
- `src/systems/npc.js` intent / hunt / resolve (AI-04 / AI-05).
- `src/systems/combat.js` `playerHit` shooter field (would enable law (b) by stealth).
- `src/game/npc-fire-toast.js` Incoming copy.
- `src/systems/agent-api.js` / `act({name:'target'})`.
- `src/game/state.js` / WORLD_FIELDS / `U.TARGET_RANGE` retune.
- `src/game/reticle-aim.js` KeyV cone.
- NAV-10 `station.js` approach. MSN-04 board. Hail01/Hail02.

Optional comment-only: `src/core/ctx.js` **88** so the lie dies with PR1. That is still this pack if the later wave already edits `controls.js` and the owner allows a one-line ctx comment. Default: **include** the ctx comment in PR1 (docs, not behavior).

---

## 2. Partial merge forbidden

PR1 must land **together**: gated hostiles-first sort + unchanged wrap + unchanged envelope + unchanged rock/kind rules. Shipping a new key **and** the sort is forbidden. Shipping Incoming-toast lock is forbidden. Shipping Agent `act target` is forbidden.

Help-line update **may** land in the same PR1. Default: include.

---

## 3. Serial PR plan (named only)

| PR | Lands | Does not land |
|---|---|---|
| **PR1** combat cycle | `cycleTarget` hostiles-first then range when an in-envelope hostile exists; wrap live; rocks group 3; optional help + ctx comment | new key; KeyV/X/K remap; Incoming toast lock; Agent `act target`; HUD layout; PPI; persist; Digit; `innerHTML`; npc/combat rewrite |
| **PR2 stills (optional)** | playtest stills of T picking the 59 u ace first from empty | required with PR1 |
| **PR3 census (optional skip)** | re-grep `cands.sort((a, b) => a.d2 - b.d2)` gone as the **only** sort | new world field |

First remaining serial is **PR1**.

---

## 4. Formulas (later impl; named only — do not implement this wave)

```
isCycleHostile(ref):
  if !ref or !ref.object or ref.lockKind or !ref.state or ref.state.destroyed: false
  if !ref.ai: false
  return ref.ai.intent === true

cycleTarget(ctx):  // same gather as live
  gather ships in TARGET_RANGE, skip destroyed / missing object
  if weaponGroup === 3: gather rocks in TARGET_RANGE
  if cands empty: current = null; return
  gated = any cand isCycleHostile
  if gated:
    sort: hostile flag 0 before 1, then d2 ascending
  else:
    sort: d2 ascending   // live
  idx = findIndex ref === current
  current = cands[(idx + 1) % n].ref
  never throw
```

Playtest (ace 59 u, hauler nearer, freighter nearer, from **empty** lock): gated true → first T = ace. That is the inbox hole.

---

## 5. Later tests (named only — do not add this wave)

If a later wave adds tests, defend:

1. Empty lock + in-range hostile + nearer friendly → first T is the hostile.
2. No in-range hostile → order equals live d2 wrap.
3. Group 3 rocks never sort as hostile.
4. Destroyed / missing `ai` never throw; not hostile.
5. Unrevealed Q-ship with intent true ranks hostile **without** class pierce.
6. KeyV kinds still absent from the T list.
7. `act({name:'target'})` still unknown.

Do **not** add tests that “fix” REDMARCH `castMatches`.
