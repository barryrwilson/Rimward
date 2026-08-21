## Code Review: TGT-05 reticle-lock design (Wave 73)

### Summary

The brief matches live cycle-T, `reticleScreen`, `reticleAimPoint`, MATCH-on-rock, seeker-null-on-rock, and `TRACKED` keys. First-pass holes (KeyT overload, `CONVERGE_DOT` as pick cone, station-as-rock, LMB fire steal, invented `U.*`, innerHTML, new persist, HUD-02 reopen) are closed in merge law. Remaining notes are implementation cautions and owner questions, not design blockers. Self-applied; designer agent skipped.

### What's done well

- Inventory cites `file:line` and states code wins, including the untagged ship/rock discriminator hole.
- KeyT cycle is preserved; reticle-lock is a new edge, not `targetPressed`.
- Binding freeze lists live `TRACKED` plus Digit 0, G, M, L, P, O, LMB. KeyV is marked **proposed, needs owner** because peers exist.
- Pick ray is the visible reticle (`reticle-aim.js` FP zero + `RETICLE_EDGE` 44), not a raw mouse-behind-camera miss.
- Categories split live selectable (ships, group-3 rocks) vs deferred meshes (station/gate/pod/landmark). Salvage is a ship, not a new kind.
- AST `id === index` is explicit. No rock UUID.
- Fail-closed matrix keeps rock MATCH and group-3 mining, and refuses MATCH/seeker/hail on later kinds.
- Lead/RANGE stay selected-weapon (TGT-01). Turret pick stays independent (TGT-04).
- Serial PRs are named only; Wave 73 does not schedule `src/` landing.
- `state.js` READ-ONLY; no HUD-03 checkbox; no new persist key.

### Findings

#### 🔴 Blocker (resolved): Overload KeyT or LMB

**Location:** wishlist TGT-05 “one command”; live `controls.js` 139–141, 188–193  
**Issue:** Binding reticle-lock to T would destroy cycle-in-density (the problem TGT-05 exists to solve). Binding to LMB would fire the gun on select.  
**Fix applied:** Contract §0.2 / §1. New edge. LMB stays `fireHeld`.

#### 🔴 Blocker (resolved): `CONVERGE_DOT` 0.72 as pick cone

**Location:** `combat.js` 174; wishlist “small forgiving cone” vs “surprise distant lock”  
**Issue:** ~44° frontal gun cone would lock unrelated distant objects. No live pick-pixel constant exists.  
**Fix applied:** Do not invent degrees. Cone **proposed, needs owner**. PR2 fail-closed = direct disc hit only (contract §2.4).

#### 🔴 Blocker (resolved): Station/pod `{position}` is a rock

**Location:** inventory §2; `ship.js` 653; `combat.js` 1265–1266  
**Issue:** Later station lock without `lockKind` would MATCH in the rock rest frame and pull the mining beam.  
**Fix applied:** Stations deferred; `lockKind` required later; unknown fails closed (contract §4–§5). Security review HIGH closed.

#### 🟠 Major (resolved): Reticle vs camera ray

**Location:** `hud.js` 998–1009 vs `reticle-aim.js` 29–35; wishlist regression  
**Issue:** A pick from `mousemove` client coords without FP recenter / hub clamp would disagree with the visible pip in first-person and at the hub edge.  
**Fix applied:** Contract §2.1: same path as `reticleAimPoint`.

#### 🟠 Major (resolved): Full-scene `Raycaster` / glow steal

**Location:** `gate-scale.js` glow `RING_RADIUS * 3.2`; station running lights; instanced rocks  
**Issue:** Three.js scene rays hit decorative children. Large gate glow would steal nearby ships (named wishlist regression).  
**Fix applied:** Owner spheres only (list `radius` / `state.radius ?? 4`). No scene `Raycaster`. Station/gate deferred; if in, pick radius **proposed, needs owner**, not glow / `U.DOCK_RANGE`.

#### 🟠 Major (resolved): New `U.*` or persist of lock

**Location:** `state.js` 7–9 READ-ONLY; `targets` not on `WORLD_FIELDS`  
**Issue:** A feature PR adding `U.RETICLE_LOCK_CONE` or saving `current` would fight data-owner law and restore phantom refs after `id === index` rebuilds.  
**Fix applied:** Range = live `TARGET_RANGE` 600. Lock not persisted. Jump already nulls.

#### 🟠 Major (resolved): HUD-02 / Digit 0 / AST UUID reopen

**Location:** task freeze 15; `station.js` 2963–2965  
**Issue:** Easy to “help” by restyling the bracket, stealing Digit 0, or giving rocks UUIDs for lock stability.  
**Fix applied:** Contract §8 / §0.14. Digit 0 stays shipyard. AST index stays.

#### 🟡 Minor: Live `isRockTarget` is weaker than `isRockLock`

**Location:** `hud.js` 344–347 vs 349–352  
**Issue:** Group-3 mine cue uses `!state` only. A ship always has `state`, so live play is fine. Later kinds must not rely on the weak test.  
**Fix:** Contract §4 uses the strict rock test. Implementation should not copy `isRockTarget` for MATCH.

#### 🟡 Minor: Wave 61 MATCH lamp text is stale vs Wave 71

**Location:** `out/w61/shared-contract.md` §1.1 MATCH “live ship lock”; live `hud.js` 1467  
**Issue:** A worker who reads HUD-02 contract only would hide the MATCH lamp on rock lock.  
**Fix:** Inventory §6 and TGT-05 contract §8 cite live Wave 71 behavior. Do not edit HUD-02 docs this wave.

#### 🟡 Minor: PR1–PR4 serial window has no reticle-lock key until owner picks

**Location:** contract §1.3 / §10  
**Issue:** PR2–PR3 can land pick math behind a test hook, but player-facing command waits on Q1.  
**Fix:** Default KeyV stands unless owner overrides. Do not ship a stolen key while waiting.

#### 💡 Suggestion: Share one `isRockLock` helper later

**Location:** duplicated in `controls.js` 82–85, `hud.js` 349–352, `ship.js` 653  
**Issue:** Three copies will drift when `lockKind` lands.  
**Fix:** Optional PR3 helper. Not a Wave 73 deliverable.

### Verifier notes (design)

- Brief merge table matches contract defaults (KeyV proposed; rocks outside group 3 **yes**; station/gate **defer**).
- Non-goals include no `src/` this wave.
- Wishlist regressions (occlusion, distant lock, proxy steal, reticle/camera, fire-key) each have a freeze row in the brief.

No remaining 🔴/🟠 design blockers after the contract patches (miss line = module literal; `reticleLock` payload = `{ hit }` only).
