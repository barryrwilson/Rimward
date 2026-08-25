# PHY-04 Wave 108 notes

Worker: markdown only. No `src/` edits. No Vite. No Chrome. No blender.

## Delivered

| Path | Role |
|---|---|
| `out/w108/phy04/current-phy04-inventory.md` | Live census; code wins |
| `out/w108/phy04/shared-contract.md` | MERGE LAW (wins) |
| `docs/Phy04AvoidDesign.md` | Integrator brief |
| `out/w108/phy04/security-review.md` | Self-applied auditor |
| `out/w108/phy04/code-review.md` | Self-applied reviewer |
| `out/w108/phy04/ui-audit.md` | Self-applied spec audit |
| `out/w108/phy04/notes.md` | This file |

## Deputize (owner may override)

- Fail closed: live `applyAvoidBias` (40 u, gain 1.4).
- Smallest additive: mid sample 20 u for non-station kinds.
- PR2: frame hold retarget if dest punches D5. No persist.
- PR3 optional 80 u far sample after playtest.
- First serial **PR1**. No Digit 0/8/9 steal. No `state.js` write.

## Re-dispatch (mermaid)

Verifier HIGH: brief mermaid sent `_phyOn?` `no jump` to dest-only. Live is `_phyOn = !ctx.gate.jumping` (`npc.js` 2261); `steerLive` biases only when `_phyOn` (`npc.js` 749). Contract §2 already matched live. Brief picture now: **yes** → `applyAvoidBias`; **no jumping** → dest. No `src/` edit. No contract freeze invert.

## Reviews

Re-applied security / code-review / ui-audit. No open CRITICAL / HIGH / Blocker / Major. Mermaid inversion recorded as **fixed** in `code-review.md`. Medium/minor persist-dispatch and heading-vs-chord notes remain documented, not blocking.

## Agents

No `[security-auditor]` / `[reviewer]` spawn tool in this worker. Checklists applied in-process.

## Processes

This worker started none. Host already listens on `127.0.0.1:5173` (pid 6364). That process is not from this worker.

## src/

This worker did not edit `src/`. `git diff -- src` is not empty on the host because sibling BIO-08 already changed `src/systems/ship.js` and `src/systems/ship-assets.js`. PHY-04 write-set is `docs/Phy04AvoidDesign.md` and `out/w108/phy04/**` only.
