# Wave 124 remaining CTL-03 Berth Freeze — verifier report (re-dispatch after designer Major)

**Domain:** data (markdown freeze). No Vite. No Chrome. No `npm run test:boot`. No `src/` edit.  
**Graph:** `graph-engineering__graph_resolve` (`r-mt98hb9o-fe653881`) `execute_workflows` bound `codex/workflow-activar-knowledge-capture` on trigger terms `not` / `save`. Coverage 0.06. Parent task is markdown vs live `src/`. No Activar PR notes. Did not `graph_approve` / `graph_propose`. Did not call CRM / Open Knowledge / Projects. Spreadsheet tools were not used.  
**Verdict:** **CLEAN**

## Status

CLEAN

## What I tested

1. Leftover still **REAL** vs live `save.js` (hint still lies until PR1).
2. No `src/` in this worker pack.
3. Contract forbids resume-only remainder / hide SAVE/LOAD.
4. LOAD vs `flags.paused` still frozen (must not set paused).
5. Later write-set still does not claim `controls.js` / npc.
6. Designer Major from `out/w124/designer/berthfreeze-ui-audit.md` is closed in the freeze (panel stays).
7. Git status on scoped paths. Grep `berthHold` in `src/` (none). Grep remaining “or shrinks to a resume dialog” allowance (none; history cites only).

Did not start Vite or Chrome. Did not run formatters, linters, or `npm run test:boot`.

## Bugs found

None.

Shrink/resume-only language in the freeze pack is **forbid + history**, not an allowed remainder. SAVE/LOAD stay visible and clickable on interrupt.

## Environmental issues

None for this data-domain pass. Graph Activar-PR workflow was a false bind; verification used live files and git only.

Graph id: `r-mt98hb9o-fe653881` (`execute_workflows`, false Activar knowledge-capture primary).

`docs/PLAYER-EXPERIENCE-WISHLIST.md` and `PROGRESS.md` are modified in the working tree (Wave 123 leftover census + 2026-08-25 playtest INBOX). Those paths are **not** this worker’s files. Pack cites wishlist INBOX and does not CONSUME it.

Sibling `out/w124/menuinput/**` + `docs/Ctl04MenuInputDesign.md` and `out/w124/startergrace/**` + `docs/Ai05StarterGraceDesign.md` exist as other Wave 124 leftover packs. This pack cites them as **do not steal**.

Designer file `out/w124/designer/berthfreeze-ui-audit.md` still records the Major as **open**. That file is a prior independent audit, not this worker’s freeze. Freeze now locks panel stays. Do not treat the stale designer Status line as a remaining freeze hole.

## Evidence

### 1. Write-set

`git status --short` on scoped paths:

- Worker pack: `docs/Ctl03BerthFreezeDesign.md` (untracked) + `out/w124/berthfreeze/**` (untracked).
- `git status --short -- src` empty. No `src/` change. No `scripts/` change. No `index.html` / `package.json` change.
- Honor docs `docs/Ctl01DockBindDesign.md`, `docs/Ctl02OverlayDesign.md`, `docs/Nav*.md`, `docs/OwnerDecisions*.md`: no diff. `docs/OwnerDecisionsWave124.md` is absent.

### 2. Leftover REAL vs live `save.js`

| Surface | Leftover | Named serial | Name |
|---|---|---|---|
| Contract header **Leftover** | **REAL.** Not CONSUME. Serial is **not** none | **PR1** | berth-open hold + explicit resume |
| Design Status | leftover **REAL** | **PR1** | — |
| Inventory §0 | **REAL.** Do not freeze CONSUME | **PR1** | — |
| Notes | leftover **REAL** | **PR1** | berth-open hold + explicit resume |

| Claim | Live |
|---|---|
| Hint “records hold while you fly” `save.js` **1377** | `berthHint.textContent = 'L or ESC to close — records hold while you fly'` |
| Header “game keeps running underneath” **38–42** | match |
| `setBerthOpen` never writes `flags.paused` **1385–1406** | sets local `berthOpen` + `ctx.flags.berthOpen` only |
| LOAD pause refuse `save.js` **1420** | `if (ctx.flags.paused) return;` plus Wave 28 comment **1416–1419** |
| KeyL / Escape close only **1503–1516** | always `setBerthOpen(false)`; no resume control |
| `berthHold` in `src/` | **0** matches |
| Pause-only skip `main.js` **149–152** | `if (!ctx.flags.paused) { world.time += dt; system.update }` |
| Overlay never writes paused `overlay-policy.js` **4** | header; grep `flags.paused =` in that file: **0** |
| Hail defer vs berth **111** | `overlayIsOpen(..., 'berth')` → `'defer'` |
| `WORLD_FIELDS` **77–102** | allowlist through `'nav'`; no `berthOpen` / `berthHold` |
| `innerHTML` in `save.js` | **0** |
| `jumpRequested` `gate.js` **678** | `ctx.emit('jumpRequested', { to: near.to })` |

Live hole: Berth Records still runs the sim under the modal. There is no `berthHold` and no resume-on-close. Hint still lies. Leftover is **REAL**. Hint rewrite is named for later PR1, not this wave.

### 3. Contract forbids resume-only remainder / hide SAVE/LOAD

Designer Major (2026-08-25) cited contract §0.1 “Panel stays **(or shrinks to a resume dialog)**” and worker audit “or a resume-only remainder”. That **allowance is gone**.

Contract now:

- §0.1 When keep: **Panel stays.** Do **not** shrink to a resume-only remainder. Do **not** replace the desk with a resume-only card. Title + SAVE/LOAD rows stay **visible and clickable**. RESUME **below** the slots. L / Escape **keep the desk**.
- Owner freeze: Do **not** shrink the interrupt panel to a resume-only remainder. SAVE/LOAD stay on the desk.
- Non-pick: Resume-only remainder / hide SAVE/LOAD = **Forbidden**.
- PR1 does not land: resume-only remainder.
- Hint remainder literal: `Ship holds. RESUME continues the interrupted leg. This is not Pause (P).`

Design matches: deputize Close interrupt, Picture, Player outcome, Acceptance 3/5, Alternatives “Resume-only remainder (hide SAVE/LOAD)”, Regression “Interrupt card hides LOAD”.

Grep `or shrinks to a resume dialog` in the freeze pack: only **prior-clause cites** in `notes.md`, `ui-audit.md`, `code-review.md` (dropped / resolved). Shared contract **does not** keep that phrase as an option.

### 4. LOAD vs `flags.paused`

Frozen in contract §0.7–0.8, inventory §1, design Acceptance 2–3:

- Hold **must not** set `flags.paused` (LOAD would refuse).
- LOAD while hold and not KeyP stays allowed.
- LOAD clears hold in the same click as restore / `setBerthOpen(false)`.
- LOAD same-click also clears interrupt snapshot. No AP RESUME after LOAD.

Live `loadFromSlot` still refuses **only** `flags.paused` (and mid-jump / save-block). Pack does not propose mapping hold onto pause.

### 5. Later write-set does not claim `controls.js` / npc

Contract §0.13:

- **Writers:** `src/game/save.js`; optional helper on `src/systems/overlay-policy.js`. Prefer session `ctx.flags.berthHold`.
- **Readers:** `ship.js`, `combat.js`, `gate.js`, `jump.js`, `autopilot.js` one early-return. `main.js` must **not** map hold → pause.
- **Does not claim** `src/systems/controls.js` (CTL-04).
- **Does not claim** npc interest/spawn (AI-05).

Ownership table and PR1 “does not land” rows match. No new `WORLD_FIELDS`. `innerHTML` forbidden. No Digit steal.

### 6. Designer Major closed in the freeze

`out/w124/designer/berthfreeze-ui-audit.md` Major: resume-only remainder can hide LOAD while hold is on. Close condition there: drop “or shrinks to a resume dialog” **or** keep SAVE/LOAD on remainder.

Freeze now does **both**: drop the shrink option; lock panel stays + SAVE/LOAD visible/clickable; RESUME below slots; remainder hint does not dump L/ESC to live charge.

Worker `ui-audit.md` Re-review: “Designer Major (resume-only remainder hides LOAD) is **closed**.” Code-review and security-review re-review after remainder lock agree.

Live hint/resume holes stay leftover for **PR1**. Freeze does not claim they are gone from `src/`.

### 7. Flag-rule check

| Flag if | Result |
|---|---|
| leftover frozen CONSUME | **no** — REAL / PR1 |
| claims `src/` this wave | **no** |
| uses `flags.paused` for hold | **forbidden**, not proposed |
| shrink / resume-only remainder allowed | **no** — forbidden |
| SAVE/LOAD can hide on interrupt | **no** — panel stays |
| steals CTL-04 / AI-05 files | **no** |
| `innerHTML` | **forbidden**; live `save.js` clean |
| new `WORLD_FIELDS` | **forbidden** |
| Digit steal | **no** |

## Evidence paths

- `C:\Projects\WebSim\out\w124\berthfreeze\verify\report.md`
- `C:\Projects\WebSim\out\w124\berthfreeze\verify\write-set.txt`
- `C:\Projects\WebSim\out\w124\berthfreeze\shared-contract.md`
- `C:\Projects\WebSim\docs\Ctl03BerthFreezeDesign.md`
- `C:\Projects\WebSim\out\w124\designer\berthfreeze-ui-audit.md` (stale open Major; freeze closed it)
- `C:\Projects\WebSim\src\game\save.js` **1377**, **1420**, **1503–1516**
