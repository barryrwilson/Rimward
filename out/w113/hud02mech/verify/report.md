# HUD-02 remaining plated / mech class silhouettes — verifier report (iteration 3)

**Status:** CLEAN  
**Domain:** data (static). No Vite. No Chrome. No ports. No new processes.  
**Wave:** 113. Pack is markdown only.  
**Census of this verify:** 2026-08-24 (re-check after iteration 3 split heavy vs freighter).  
**Graph:** `graph_resolve` → `execute_workflows` (`codex/workflow-data-analysis-reporting`, coverage 0.08). Followed with static git + grep + file reads. Did **not** start Vite or Chrome (owner forbid). Did **not** write the graph. Did **not** edit product `src/`.

## Pack files (this worker)

Untracked markdown only (`git status --short`):

- `docs/Hud02RemainingMechSilhouettesDesign.md`
- `out/w113/hud02mech/current-hud02-mech-silhouette-inventory.md`
- `out/w113/hud02mech/shared-contract.md`
- `out/w113/hud02mech/security-review.md`
- `out/w113/hud02mech/code-review.md`
- `out/w113/hud02mech/ui-audit.md`
- `out/w113/hud02mech/notes.md`
- `out/w113/hud02mech/verify/report.md` (this file; overwrite)

No `.js` / `.css` / `.mjs` under `out/w113/hud02mech/`. This pack does not write `src/` or `scripts/`.

## What I tested

Static git + grep + file reads. No Vite. No Chrome. No boot-test run (out of domain).

1. Pack write-set vs live `src/` / `scripts/` dirty tree. Confirm **no** pack `src/` writes.
2. Leftover honesty: grep `#hud[data-family="mech"][data-class-key]` in `src/`. Confirm **zero**.
3. Heavy vs freighter uniqueness **in markdown** (not only claimed): heavy tall-only `16×8`; freighter realloc `18×8`; tuples differ; `left+width ≤ 21`; `top+height ≤ 10`.
4. Prior overflow Major stays closed: cutter/frigate realloc; sil frozen.
5. Prior sibling-steal Major stays closed: fail-closed is live **family** facing.
6. Contract still forbids hub pip, Digit steal, `state.js` write, `innerHTML`, new persist.
7. Integrator says contract wins. Serial PR1 named only.
8. Stale copy hunt: “slightly longer wedge”, “longer thinner capital”, “generic plate when not mech” as current law, collide-heavy-freighter as current table.

## Checklist

| Gate | Result |
|---|---|
| No `src/` / `scripts/` in pack | PASS |
| Leftover still real (no mech `[data-class-key]` CSS) | PASS |
| Heavy ≠ freighter inside 22×10; heavy 16×8; freighter 18×8; `left+width ≤ 21`; `top+height ≤ 10` | PASS |
| Cutter/frigate realloc; sil frozen (overflow stays closed) | PASS |
| Fail-closed live **family** facing; no bio attribute delete; no mech plate on bio | PASS |
| Contract forbids hub / Digit / `state.js` write / `innerHTML` / new persist | PASS |
| Integrator vs contract | PASS — contract wins |
| PR1 named only | PASS |
| Majors closed in source markdown (integrator + contract), not claim-only | PASS |

## 1. Pack still has no `src/` writes

`git status --short` for this pack: untracked markdown listed above.

Dirty tracked tree (other workers; **not this pack**):

- `M src/systems/hud.js` (+24) — sibling living PR1: `SHIP_CLASSES` import, `classKeyToken` **bio-only**, `applyClassKeyAttr`.
- `M src/ui/hud.css` (+81) — sibling comment `HUD-02 PR1: living class hint`; selectors are `#hud[data-family="bio"][data-class-key=…]` only.
- `M scripts/boot-test.mjs` — sibling living pin. This pack did not own it.
- `M PROGRESS.md`, `M docs/PLAYER-EXPERIENCE-WISHLIST.md` — grep finds **no** `hud02mech` / RemainingMechSilhouette strings.
- `?? docs/Hud02RemainingSilhouettesDesign.md` — living leftover sibling. This pack did not own it.

Grep live `src/` for `#hud[data-family="mech"][data-class-key]`: **zero matches**.

This pack did not land plated class CSS or mech attribute writes.

## 2. Leftover still real

Live mech facing is **one** generic plate:

| Surface | Live | Cite |
|---|---|---|
| Sil box | 22×10 | `hud.css` 239–244, 1262–1265 |
| Nose | `border-right: 5px` | 1267–1272 |
| Body | `left: 5; top: 2; width: 16; height: 6` | 1274–1280 |
| Fill | 5 + 16 = **21 of 22 px** | same |
| Bio class tokens | LIVE sibling | 1538–1617 (bio only) |
| `classKeyToken` | `if (family !== 'bio') return ''` | `hud.js` 101–102 |
| `hudFamily` | `'mech' \| 'bio'`; no `classKey` switch | 81–89 |

Inventory §11, contract §0.1 / non-picks, integrator §1 all freeze leftover **real**. **Not CONSUME.** Bio `[data-class-key]` is sibling, not this leftover.

## 3. Major closed: heavy vs freighter split inside 22×10

Designer Major (iter 2): authored `heavy` and `freighter` shared nose 5 / body `5,1,16×8`.

**Source markdown now (iteration 3):**

Contract §0.14 playable defaults (`out/w113/hud02mech/shared-contract.md`):

| `classKey` | Nose | Body `left` | `top` | `width` | `height` | `left+width` | `top+height` | Tuple |
|---|---|---|---|---|---|---|---|---|
| `light` | 5 | 5 | 2 | 16 | 6 | 21 | 8 | (5,5,2,16,6) |
| `heavy` | 5 | 5 | 1 | 16 | 8 | **21** | **9** | (5,5,1,16,8) tall-only |
| `ace` | 4 | 4 | 3 | 14 | 4 | 18 | 7 | (4,4,3,14,4) |
| `cutter` | 4 | 4 | 2 | 17 | 6 | **21** | 8 | (4,4,2,17,6) |
| `frigate` | 3 | 3 | 3 | 18 | 4 | **21** | 7 | (3,3,3,18,4) |
| `freighter` | 3 | 3 | 1 | 18 | 8 | **21** | **9** | (3,3,1,18,8) realloc |

Verify arithmetic:

- Heavy: `5+16=21`; `1+8=9`. Width stays **16**. Nose stays **5**.
- Freighter: `3+18=21`; `1+8=9`. Nose **3**, left **3**, width **18**.
- Tuples `(5,5,1,16,8)` ≠ `(3,3,1,18,8)`.
- All six authored tuples unique. Color is not the cue.
- Every playable `left+width` is **≤ 21**. Every `top+height` is **≤ 10**.

Integrator hint table (`docs/Hud02RemainingMechSilhouettesDesign.md` 217–223) matches: heavy `5,1,16×8` **no extra width**; freighter `3,1,18×8`; `left+width=21`; `top+height=9`.

Player outcome (266–268): heavy taller 16×8; freighter tall **and** realloc 18×8 nose 3; “It does not match heavy. Color does not carry the class.”

Uniqueness invariant (contract §0.14): two authored keys must not share one nose/left/top/width/height tuple. Non-pick “Collide `heavy` and `freighter` metrics” is **Forbidden**.

**Verdict:** Major **closed in markdown**.

## 4. Prior overflow still closed

Cutter: nose 4 / body 4,2,17×6; `4+17=21`. Frigate: nose 3 / body 3,3,18×4; `3+18=21`. Sil `width`/`height`/`flex-basis` never change. Unreadable key omits CSS.

Stale grow language (“slightly longer”, “longer thinner capital”) is **gone** from integrator/contract.

**Verdict:** overflow Major stays **closed**.

## 5. Prior sibling-steal still closed

Contract §0.12 / §2:

- Unknown / non-allowlisted key → omit attribute → live **family** facing (mech generic plate **or** bio organism + sibling tokens).
- Family is **not** mech → **do not apply** mech class CSS. **Do not paint** the mechanical plate. **Do not delete** an allowlisted `data-class-key` solely because family is not mech.

Integrator mermaid: `cssGate -->|no| bioFace[bio organism plus sibling tokens]`. Overview names sibling `classKeyToken` bio-only. PR1 extends the **one** writer. No second writer. No bio clip-path in this leftover (§0.21).

“generic plate when not mech” is not current law (historical closed titles only).

**Verdict:** sibling-steal Major stays **closed**.

## 6. Contract still forbids hub / Digit / `state.js` write / `innerHTML` / new persist

`out/w113/hud02mech/shared-contract.md` MERGE LAW:

- §0.2 hub pip / class chrome on `.rw-reticle` **forbidden**. RANGE stays TGT-01. Live hub 80×80 (`hud.css` 184–193).
- §0.3 Digit 0/8/9 steal **forbidden**. No new Digit.
- §0.4 `innerHTML` / SVG from `classKey` **forbidden**. Live `hud.js`: **zero** `innerHTML`.
- §0.5 `state.js` READ-ONLY. No write. HUD may **read** `SHIP_CLASSES` (`state.js` 37–44).
- §0.6 no new persist key. Hangar already has `classKey`.
- §0.8 no `hudFamily` rewrite. No HUD-03 `hudSkin`.
- §0.21 no bio clip-path in this leftover.

## 7. Integrator says contract wins. PR1 named only

`docs/Hud02RemainingMechSilhouettesDesign.md` line 11:

> If this document and that file conflict, the contract wins.

Same in §1 heading “Merge resolutions (contract wins)”. Contract header: “If that document and this file ever disagree, **this file wins**.”

Contract §3 and integrator §5:

| PR | Status in this wave |
|---|---|
| PR1 plated facing class tokens | Named only. Do not implement in Wave 113. |
| PR2 plated class stills | Optional / skippable. Named only. |
| PR3 census | Optional skip. Named only. |

No mech PR1 CSS/JS in this pack.

## Residual nits (not bugs)

- `out/w113/hud02mech/security-review.md` title still says “iteration 2”. Body already names the iter 3 geometry split. Not a product bug.
- Inventory line 139 “HUD **does not**” (station papers context) is still easy to misread after sibling `classKeyToken`. Sibling note at inventory line 10 is current. Mech leftover remains real.
- Contract box invariant is `left+width ≤ 22`. Verify brief used `≤ 21`. Playable rows sum to **21** (ace **18**), so the brief check passes. A later PR that used 22 would still be in-box per contract.
- Parent designer file `out/w113/designer/hud02mech-ui-audit.md` is a sibling snapshot (now iteration 3, Majors closed). Pack notes freeze that path (do not overwrite). Current law is integrator + contract.

## Bugs found

None.

## Environmental issues

- Software-delivery / data-analysis workflow asked for smoke / artifact-runtime tools. Owner domain is data; no Vite; no Chrome. Those MCP tools are not in this session. Smoke = git + grep + arithmetic on the budget table.
- Working tree contains sibling Wave 113 living HUD-02 PR1 and other dirty files. Those are out of this pack.
- No processes started. No teardown required.

## Evidence

- Pack paths: `C:\Projects\WebSim\out\w113\hud02mech\*.md`, `C:\Projects\WebSim\docs\Hud02RemainingMechSilhouettesDesign.md`.
- Live mech plate: `src/ui/hud.css` 1262–1284 (22×10; nose 5; body 5,2,16×6).
- Live family switch: `src/systems/hud.js` 81–89.
- Live sibling writer: `classKeyToken` 101–102 bio-only; `applyClassKeyAttr` 110–115; init 1101; 5 Hz 1758.
- Live bio sibling CSS (do not treat as this leftover): `hud.css` 1538–1617.
- Zero `#hud[data-family="mech"][data-class-key]` in `src/`.
- Zero `innerHTML` in `hud.js`.
- Heavy/freighter numeric freeze: contract §0.14 table (heavy 16×8 nose 5; freighter 18×8 nose 3 / left 3); integrator 219, 223, 266–268.
- Overflow: cutter `4+17=21`; frigate `3+18=21`.
- Fail-closed: contract §0.12 / §2; integrator deputize + mermaid `bioFace`.
- `git diff --stat` `src/systems/hud.js` + `src/ui/hud.css` is sibling bio PR1; pack files are `??` markdown.
