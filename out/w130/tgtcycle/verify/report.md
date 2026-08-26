## Status
CLEAN

## What I tested
- Domain: data (design-doc vs live code). `[NO BROWSER COVERAGE]`. Did not start Vite, Chrome, Playwright, or CDP.
- Graph: `graph_resolve` bound `omp/workflow-research-and-briefing` (`r-mta6n4vy-7730c071`, terms `brief`/`project`/`report`). That stack is CRM / Open Knowledge / Projects / web research. This pass is local leftover census. Token-called those tools. Did not publish Drive. Did not edit the graph. Draft calendar/project-upkeep/shareable-doc workflows stay non-binding.
- Re-read live `src/systems/controls.js` `cycleTarget` (**114–142**). Sort is still `cands.sort((a, b) => a.d2 - b.d2)` at **139**. No `ai.intent` / `flags.combat` gate. Wrap is still `(idx + 1) % n`.
- KeyT still pulses `pendingTarget` → `input.targetPressed` (**324–325**, **424**, **457**). TRACKED (**46–53**) has KeyT/V/X/K/N/J/H. No attacker-lock code. Help is `'T — cycle target'` (**406**).
- Envelope still `U.TARGET_RANGE` **600** (`src/game/state.js` **32**). Encounter bubble still **800** (`state.js` **27**; `npc.js` **2680–2684**).
- Hostile live bit: `makeAi` `intent: false` (`npc.js` **247**); HUD contacts `row.hostile = !!(live.ai && live.ai.intent)` (`hud.js` **1734**) then lock → hostile → dist (**1738–1751**). `mayHuntPlayer` is eligibility (`npc.js` **1256–1264**), not the cycle bit. `src/game/save.js` **1025–1028** uses role pirate/ace or `ai.hostile` for berth block only. No `hostile:` field in `npc.js`.
- Attacker key still absent: `playerHit` emit omits shooter (`combat.js` **1797–1799**). Incoming toast is copy only (`npc-fire-toast.js` **8–64**). KeyV is `tryReticleLock` (**258–274**); cone `LOCK_CONE_PX = 12` (`reticle-aim.js` **15**). Agent `act` live names ping/disable/pause/held/unknown (`agent-api.js` **129–150**). Observe reads `targets.current` (`agent-observe.js` **306**) and `flags.combat` (**339**).
- Inbox cite: `docs/PLAYER-EXPERIENCE-WISHLIST.md` **180–183** matches the quoted INBOX (P2, TGT) block. TGT-06 leftover is **CONSUME** (`docs/Tgt06RemainingTgtDesign.md`).
- Pack law: leftover **REAL**, serial **PR1**, one law (a) hostiles-first then range on KeyT, gate = in-envelope cycle candidate with `ai.intent === true`, not law (b) new key, not a new Digit. Contract is merge law and wins.
- Required artifacts exist. Worker write-set is markdown under `docs/Tgt07CombatCycleDesign.md` and `out/w130/tgtcycle/` (no `verify/` from the worker). Sibling `out/w130/dockapproach/` and `out/w130/jobdedup/` exist as other packs. Git status: this pack is untracked markdown. Dirty `src/` (including `controls.js` overlay-digit helpers) is other in-tree work; `cycleTarget` body is still d2-only.

## Bugs found
None.

## Environmental issues
None that blocked this census. `[NO BROWSER COVERAGE]` is expected for this markdown pack.

## Evidence
- Screenshots: none (no browser).
- Logs: none.
- Test output: static read of live files vs pack.

Live `cycleTarget` sort (d2 only, no hostile bucket):

```113:142:src/systems/controls.js
/** Cycle ctx.targets.current through in-range candidates, nearest first. */
function cycleTarget(ctx) {
  const shipObj = ctx.ship.object;
  if (!shipObj) {
    ctx.targets.current = null;
    return;
  }
  const p = shipObj.position;
  const range2 = U.TARGET_RANGE * U.TARGET_RANGE;
  const cands = [];
  for (const s of ctx.ships) {
    if (!s?.object || s.state?.destroyed) continue;
    const d2 = s.object.position.distanceToSquared(p);
    if (d2 <= range2) cands.push({ ref: s, d2 });
  }
  // Mining group (3) may also target asteroids (§6.2 mining beam).
  if (ctx.input.weaponGroup === 3 && ctx.asteroids?.list) {
    for (const a of ctx.asteroids.list) {
      const d2 = a.position.distanceToSquared(p);
      if (d2 <= range2) cands.push({ ref: a, d2 });
    }
  }
  if (!cands.length) {
    ctx.targets.current = null;
    return;
  }
  cands.sort((a, b) => a.d2 - b.d2);
  const idx = cands.findIndex((c) => c.ref === ctx.targets.current);
  ctx.targets.current = cands[(idx + 1) % cands.length].ref;
}
```

TRACKED (no extra attacker key):

```46:53:src/systems/controls.js
const TRACKED = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyF',
  'KeyQ', 'KeyE',
  'KeyT', 'KeyH', 'KeyC', 'KeyX', 'KeyV', 'KeyN', 'KeyK', 'KeyJ',
  'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5',
  'ShiftLeft', 'ShiftRight',
  'Space',
]);
```

Hostile bit HUD contacts (same `ai.intent` the contract reuses):

```1734:1734:src/systems/hud.js
              row.hostile = !!(live.ai && live.ai.intent);
```

`playerHit` has no shooter id:

```1797:1799:src/systems/combat.js
    const events = applyHit(player, { damage: p.damage, family: p.wkey, facet: fromAft ? 'aft' : 'fore', now });
    // HUD owns all pixels (incl. subtle screen-edge flash on shield hits) — emit only.
    ctx.emit('playerHit', { damage: p.damage, family: p.family, fromAft, shielded });
```

Contract freeze (one law, REAL, PR1, intent, no steal): `out/w130/tgtcycle/shared-contract.md` header + §0.6–0.12.

Checks:
- Leftover REAL + named serial PR1: yes. Not CONSUME. Serial is not none.
- One law: (a) hostiles-first then range on KeyT. Not (b) attacker-lock key. Not both in PR1. No new Digit/TRACKED code frozen as required PR1.
- Hostile = live `ai.intent === true`. Not a new faction table. Not `save.js` `ai.hostile`. Not pirate/ace role without intent. Gate = in-envelope (600 u) cycle candidate, not 800 u bubble alone.
- Does not steal TGT-03 Incoming toast/gauge, TGT-05 KeyV/kinds, TGT-06 CONSUME, HUD-07 layout, NAV-10, MSN-04.
- Worker did not write `src/`. Later write-set names `controls.js` `cycleTarget` (+ optional help / ctx comment) only.
- `ctx.js` **88** still says “cycle nearest hostiles”; code does not. Pack treats that as a lie to fix in PR1 comment, not as live hostiles-first.

Nits (not bugs):
- Pack cites `save.js` **1025–1028**; live path is `src/game/save.js`. Line numbers match.
- Design overview once says contacts rank “intent then dist”; live + inventory add lock-first. Contract/inventory win.
- Dirty `PROGRESS.md` / wishlist / `src/` in the tree belong to other waves, not this worker’s file list.

Stopped processes: none started.
