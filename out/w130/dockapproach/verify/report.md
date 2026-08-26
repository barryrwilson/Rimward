## Status
CLEAN

## What I tested
- Domain **data**. Round **2** designer re-dispatch: freeze distinct `.rw-slow-lamp` on **self** SPD only; MATCH copy stays `MATCH`; do not pass SLOW into `tgtSpeed.set`. Static review vs live `src/`. `[NO BROWSER COVERAGE]` (expected).
- Did **not** start Vite, Chrome, Playwright, or CDP. Did **not** claim ports. Did **not** run formatters, linters, or `npm run test:boot`. Did **not** edit `src/`.
- Contract merge law: `out/w130/dockapproach/shared-contract.md` **wins**. Leftover **REAL**. Named serial **PR1**. Not CONSUME.
- Contract **§0.23** + fail-closed **§0.14** + playable policy **§0.1** + partial-merge **§2**: MATCH reuse forbidden; target-rail SLOW forbidden; SLOW is a second node on self only.
- `docs/Nav10DockApproachDesign.md` agrees with that freeze (census, deputize, PR1, alternatives, acceptance 3/11). Contract wins on conflict.
- Live `makeSpeed()` census: one factory `hud.js` **379–403** (comment **378**). MATCH node `textContent` **`MATCH`** at **386**. `selfSpeed = makeSpeed(selfRail)` **1089**. `tgtSpeed = makeSpeed(tgtRail)` **1101**. `selfSpeed.set(ctx.ship.speed, matchOn)` **2244**. `tgtSpeed.set(targetSpeedNow)` **2524** (no match arg). CSS `.rw-match-lamp` `hud.css` **222–229**. Hub 80×80 **184–193**. Cite band **378–401** still names the factory.
- Leftover **REAL** still true: in-zone prompt is `'Dock'` only (`hud.js` **2535–2536**). No `SLOW` / `rw-slow-lamp` / `approach under` under `src/`. Dock path has **no** speed gate (`station.js` **6321–6330**). PHY bounce still runs (`ship.js` **907–939**).
- Pack markdown (design, contract, inventory, notes, code-review, ui-audit, security-review) records the designer Major as **resolved in freeze**. Worker v1 “MATCH sibling” language is gone as a live allowance.
- `git status --short`: this pack is untracked markdown. Dirty `src/` is sibling / other-wave. Grep: no SLOW cue in live JS/CSS.
- Graph this check: `graph_resolve` `r-mta79lgj-41a6fd2e` decision **`blocked_ambiguous`**. Candidates are Activar training / Drive publish / presentation (coverage ~0.1). False bind. Owner assigned local leftover verify. Did not run CRM / Drive / projects / open-knowledge. Did not `graph_propose`. Did not follow those workflows.

## Bugs found
None that fail leftover REAL, MATCH-reuse freeze, target-rail SLOW freeze, merge law, or CONSUME honesty.

Residual cite tightness (does not change verdict):
- `makeSpeed` function is `hud.js` **379–403**. Pack cites **378–401** (doc comment through `set` close). Self vs tgt rails **1089** / **1101** / **2244** / **2524** are exact.
- KeyD live strafe write is `controls.js` **496**. Inventory cites **23–24** and **397**. Bind is still D = strafe, J = dock (`ctx.js` **90**).
- Contract §0.1 allows an **opt-in** extra node inside shared `makeSpeed` if used **only by self**. §2 says stuffing SLOW into shared `makeSpeed` / `tgtSpeed` **fails**. Together they still forbid MATCH reuse and a SLOW node on `tgtSpeed`. Prefer append-on-self or opt-in-self-only.

## Environmental issues
- Graph primary match is `blocked_ambiguous` (false Activar/Drive/slides bind). Verify used the owner local markdown path. Not an ENV_ISSUE for leftover census.
- Dirty `src/` exists from other waves. Not this pack. No `SLOW` / `approach under 20` in live JS/CSS.

## Evidence

### Round 2 freeze (designer Major)

Contract **§0.23** (`out/w130/dockapproach/shared-contract.md`): live `makeSpeed()` is a **shared** factory; one node is `.rw-match-lamp` with copy **`MATCH`**. PR1 must **not** reuse that node, must **not** change MATCH copy, must **not** pass SLOW into `tgtSpeed.set`, must **not** grow the 80 px hub. SLOW is a **second** node on **self** SPD only. Independent `is-hidden`.

Fail-closed **§0.14**: never toggle `.rw-match-lamp` for SLOW. Target SPD never a SLOW node; `set(targetSpeedNow)` stays speed-only.

Playable policy: distinct `.rw-slow-lamp` on `.rw-combat-self .rw-speed`. MATCH stays `MATCH`.

Partial merge **§2**: swapping MATCH text, or stuffing SLOW into shared `makeSpeed()` / `tgtSpeed`, **fails** this pack.

Design doc agrees: Overview deputize; Goals 3; mermaid forbidden `MATCH text swap / tgtSpeed SLOW`; §3 Target SPD `set(speed)` only; PR1 “MATCH reuse”; alternatives “Swap MATCH text” / “SLOW on target SPD”; acceptance 3 and 11. Merge law: contract wins.

UI audit Major “Do not reuse MATCH or target SPD” and code-review Major “MATCH lamp / target SPD reuse” are **resolved in freeze**.

### Live `makeSpeed` census (still accurate)

One factory. Self and target both call it. MATCH copy is `MATCH`. Target `set` is speed-only.

```378:403:src/systems/hud.js
/** SPD readout; write-on-change. Optional MATCH lamp (Wave D). */
function makeSpeed(parent) {
  const row = el('div', 'rw-meter rw-speed', parent);
  el('div', 'rw-label', row, 'SPD');
  const value = el('div', 'rw-value', row);
  const text = document.createTextNode('0');
  value.appendChild(text);
  el('span', 'rw-unit', value, 'u/s');
  const lamp = el('span', 'rw-match-lamp is-hidden', value, 'MATCH');
  let last = -1;
  let lastMatch = null;
  return {
    set(spd, matching) {
      const n = Math.round(spd);
      if (n !== last) {
        last = n;
        text.nodeValue = String(n);
      }
      const on = !!matching;
      if (on !== lastMatch) {
        lastMatch = on;
        lamp.classList.toggle('is-hidden', !on);
      }
    },
  };
}
```

```1084:1101:src/systems/hud.js
  const selfRail = el('section', 'rw-combat-rail rw-combat-self rw-hair-off', root);
  // ...
  const selfSpeed = makeSpeed(selfRail);
  // ...
  const tgtRail = el('section', 'rw-combat-rail rw-combat-target is-hidden rw-hair-off', root);
  // ...
  const tgtSpeed = makeSpeed(tgtRail);
```

```2243:2244:src/systems/hud.js
      const matchOn = !!(ctx.flags.matchSpeed && (shipTgt || isRockLock(ctx, target)));
      selfSpeed.set(ctx.ship.speed, matchOn);
```

```2524:2524:src/systems/hud.js
        tgtSpeed.set(targetSpeedNow);
```

Grep: **one** `function makeSpeed`. No `.rw-slow-lamp` in `src/`. `.rw-match-lamp` CSS `hud.css` **222–229**. Hub `hud.css` **184–193**.

### Leftover REAL (still true)

```2532:2536:src/systems/hud.js
      // context prompt (§13.4): one verb, explicit focus, priority order.
      // Gate sits below dock (zones never overlap in practice).
      let pKey = '', pVerb = '';
      if (ctx.station?.inZone && !ctx.flags.docked) {
        pKey = 'J'; pVerb = 'Dock';
```

Dock range **45**; light cruise **120** / creep **30** / `stopTime` **2.0** (`state.js` **30**, **38**). In-zone dock has **no** speed gate (`station.js` **6321–6330**). PHY bounce unless docked / jumping / `dockPressed` (`ship.js` **907–939**). Wishlist inbox **175–179** still names the hole. CONSUME would be dishonest.

Write-set this wave: designer markdown under `docs/Nav10DockApproachDesign.md` + `out/w130/dockapproach/*.md` (not `verify/**` as worker). Later PR1 names `hud.js` + `hud.css` only. No `src/` in this pack.

Graph: `resolution_id` `r-mta79lgj-41a6fd2e`. Did not start a process. No leftover ports.
