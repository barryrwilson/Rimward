## Code Review: TGT-05 remaining lock categories design (Wave 81)

### Summary

Markdown-only integrator set. Live `src/` cites match Wave 81 code (Wave 73 line numbers are correctly treated as stale). Brief, contract, and inventory agree on KeyV keep, `lockKind` wrappers, fail-closed rails, no cone number, and serial PR order. First-pass Major (wrapper assign vs `dropStaleRockLock`) is closed in the contract.

Persona: reviewer (`C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`) plus checklist (`C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`). Design audit: not applicable (no UI shipped).

### What's done well

- Inventory greps live `src/` (`lockKind` 0 matches; KeyV + `pickReticleLock` + `'reticleLock' { hit }` already ship).
- Digit 0 cite moved from stale `station.js` 132 / 2963 to `152` + `5175–5177`.
- Rock-steal hole is named with the actual helpers (`controls.js` 85–87; `ship.js` 653; `combat.js` 1266; `hud.js` 1564).
- Pick radii are live envelope/bore/pod/mesh bounds, not glow 96 / dock 45 / jump 60 / discovery 100.
- Feedback reuses the existing frozen event; no new `ctx.js` vocabulary.
- Sibling MSN-03 / BIO-03 paths are not touched; no sibling numbers invented.

### Findings

#### 🔴 Blocker: (none after fix)

#### 🟠 Major (resolved): PR2 write would lose the lock the same frame

**Location:** `controls.js` 85–94 `dropStaleRockLock`; contract §9 (first draft)  
**Issue:** Wrappers `{ lockKind, position }` still match today’s `isRockLock` (`position && !object && !state`). `dropStaleRockLock` then `list.indexOf(wrapper) < 0` and nulls `current`.  
**Fix applied:** PR2 may return hits from `pickReticleLock` but must not assign new kinds. PR3 tightens rock tests **first**, then writes wrappers. Brief §8 restates the order.

#### 🟠 Major (resolved): Live pod stamp vs `podCollected`

**Location:** `pods.js` 613; `ctx.js` 230–231  
**Issue:** Stamping `lockKind` on the scoopable object would ride `podCollected`.  
**Fix applied:** Contract §3.2 / §4 wrappers `{ lockKind, position, pod }` with `indexOf(ref.pod)`.

#### 🟡 Minor: HUD `isRockTarget` is a weaker test than `isRockLock`

**Location:** `hud.js` 345–347 (`position && !state`, no `!object`) vs 350–352  
**Issue:** Impl must tighten **both** helpers plus `ship.js` 653 and `combat.js` 1266, or a wrapper without `state` still skips the mine prompt / looks rock-like in one path.  
**Fix:** Contract §4 already says “shape-only tests that remain in live code must be tightened.” Call out `isRockTarget` in PR3 pins. Not a brief contradiction.

#### 🟡 Minor: `ctx.targets.current` comment will go stale on impl

**Location:** `ctx.js` 170 “live ship object from ctx.ships, or asteroid ref”  
**Issue:** A later impl should extend that comment in the `ctx.js` header serial (ownership stays controls + npc). Not this wave.

#### 💡 Suggestion: Gate overlay copy vs lock bracket

**Location:** `gate.js` 578 `JUMP — ` + dest name; contract §6.1 gate bracket uses `SYSTEMS[to].name`  
**Issue:** Consistent allowlisted display names. Impl should not print raw `to` when `SYSTEMS[to].name` exists. Already in contract.

### Cite audit (inventory vs live)

| Claim | Live | Verdict |
|---|---|---|
| KeyT `cycleTarget` | `controls.js` 54–82 | OK |
| KeyV `tryReticleLock` / `TRACKED` | `controls.js` 40, 114–127, 190–191, 313 | OK |
| `pickReticleLock` disc, no cone | `reticle-aim.js` 91–144 | OK |
| FP zero + edge 44 | `reticle-aim.js` 33–39; `hud.js` 1000–1004 | OK |
| `reticleLock { hit }` frozen + cue | `ctx.js` 227; `song.js` 119 | OK |
| `emit` spread | `ctx.js` 230–231 | OK |
| Digit 0 shipyard | `station.js` 152, 5175–5177 | OK |
| Dock 45 / envelope 32 | `state.js` 28; `station.js` 389–390, 5276–5281 | OK |
| Bore 30 / glow 96 / zone 60 | `gate-scale.js` 14, 61; `gate.js` 78; `state.js` 542–543 | OK |
| Pod 0.9 / scoop 10 | `pods.js` 35, 603–616; `state.js` 29 | OK |
| Landmark 100 / clue 35 / chart HUD | `mystery.js` 37–38; `hud.js` 1332–1372 | OK |
| `lockKind` in `src/` | grep 0 | OK |
| MATCH / seeker / mining / hail | `ship.js` 650–703; `combat.js` 1146–1152, 1264–1274; `hail.js` 75–81 | OK |
| AST `id: i` | `asteroids.js` 1878 | OK |
| Aftermath `wreckMeshes` | `world.js` 1240 | OK |
| `innerHTML` only models-browser | grep `src/**/*.js` | OK |
| `WORLD_FIELDS` has no `targets` | `save.js` 75–90 | OK |

### Contract vs brief vs inventory

| Freeze | Inventory | Contract | Brief |
|---|---|---|---|
| KeyT keep, KeyV keep, no new bind | yes | §0.2 / §1 | Goals + §1 |
| Cone: no number; direct-hit | yes §4 | §0.4 / §2.5 | Open Q1 |
| Four kinds in; wreck/salvage out | §12 | §0.3 / §3 | §5 |
| `lockKind` wrappers | hole named | §4 | §5.2 |
| MATCH/mining/hail/combat refuse | hole named | §5 | §6 |
| Dock/jump stay zone | §7–§8 | §5 | §2 |
| Landmark authored id; chart inert | §10 | §0.9 / §6.4 | §5 / risks |
| Reuse `reticleLock`; no new event | §4 | §0.10 | §7 |
| `state.js` RO; Digit 0; HUD-02 | §5.2 / §14 | §0.12 / §8 | non-goals |

No remaining disagreement. Merge law: contract wins if any later drift.

### Second pass (after Major fixes)

PR2-no-assign + wrapper identity are in contract §9 / §3.2 / §4 and brief §8. No remaining Blocker/Major.

### Test coverage note (later impl)

Do not run full `npm run test:boot` in this markdown wave. Later PR5 should pin the contract §11 list. Known boot FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul) stay; do not “fix” them here.
