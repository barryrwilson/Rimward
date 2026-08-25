# PHY-04 Wave 108 leftover recheck notes

Verifier recheck after worker mermaid fix. Markdown only. No `src/` edit. No Vite. No Chrome. Did not stop 5173/9222.

Graph: `graph_resolve` agent `claude/agent-claude` → execute `claude/workflow-research-and-briefing`. Local code wins. No PHY-04 mermaid in Open Knowledge / Projects / web.

Census date: 2026-08-24. Code wins.

---

## 1. Mermaid vs live vs contract §2

Current brief (`docs/Phy04AvoidDesign.md` 164–171):

```
Live: `_phyOn = !ctx.gate.jumping` (`npc.js` 2261). `steerLive` calls `applyAvoidBias` only when `_phyOn` is true (`npc.js` 749). Jump / `!_phyOn` keeps dest.

flowchart TD
  dest --> phyOn{"_phyOn? not jumping"}
  phyOn -->|yes| bias[applyAvoidBias]
  phyOn -->|no jumping| destOnly[aim = dest]
```

| Path | Picture | Live | Contract §2 |
|---|---|---|---|
| not jumping / `_phyOn` | yes → `applyAvoidBias` | `npc.js` 749 ternary true | bias path (not the dest-only row) |
| jumping / `!_phyOn` | no jumping → dest | `_phyOn = !ctx.gate.jumping` 2261; dest when false | dest unchanged; no bounce |
| bag miss | `bias -->|bag miss| destOnly` | `applyAvoidBias` copies dest then may return (609–613) | dest unchanged |

Old bug: edge `|no jump|` to dest while the diamond did not name “not jumping”, so a reader could skip bias in normal flight. That inversion is gone.

`|no jumping|` is shorthand for “no, jumping” on diamond `_phyOn? not jumping`. Topology is not inverted.

Contract §2 was **not** rewritten to match the old picture. Jumping still dest-only.

---

## 2. Freeze holds (brief ≡ contract ≡ live)

| Freeze | Brief | Contract | Live |
|---|---|---|---|
| Digit 0/8/9 | no steal; PR1 must not steal | §0.3, §3 | `station.js` 188 last = shipyard; Digit 0 6041–6043; 8 = launch; 9 = epics |
| Hub | 80 px; RANGE; no avoid pip | §0.2 | `hud.css` 184–193; `hud.js` 709–712 |
| `state.js` | READ-ONLY | §0.5 | grep `applyAvoidBias` = 0 |
| Persist | no new `WORLD_FIELDS` | §0.6 | 76–101; key `rimward-save-v1` 66 |
| Navmesh | forbidden | §0.15 | grep navmesh / A* in `npc.js` = 0 |
| Fail-closed live bias | text + mermaid | §0.16, §2 | 2261 + 749 |

---

## 3. `src/` write-set (leftover vs sibling)

`git diff --name-only -- src`:

- `src/systems/ship.js` — BIO-08 gait
- `src/systems/ship-assets.js` — BIO-08 gait
- untracked `src/game/living-gait.js` — BIO-08
- `scripts/boot-test.mjs` — WAVE108 BIO-08 pins (not PHY)

PHY-04 paths: untracked markdown (`docs/Phy04AvoidDesign.md`, `out/w108/phy04/**`). This recheck did not edit `src/`.
