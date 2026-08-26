# Wave 126 HUD-06 home-station marker — verifier report (data domain)

**Domain:** data (markdown freeze). No Vite. No Chrome. No `npm run test:boot`. No `src/` edit.  
**Graph:** `graph-engineering__graph_resolve` (`r-mt9ha7ew-1a73f044`) `execute_workflows` bound `omp/workflow-software-delivery`. Parent expected `proceed_unmodeled`. Bind is **not** calendar / CRM / Activar. Did **not** `graph_approve` / `graph_propose`. Domain **data**: no Vite, no Chrome, no Playwright, no boot-test. Proportionate gates = grep, read, scoped `git status`.  
**Verdict:** **CLEAN**

## Status

CLEAN

## What I tested

1. Leftover **REAL** vs live `src/systems/hud.js`: TGT `rw-edge-arrow` exists; station/home marker absent; POS is XYZ; dock `J` is `inZone` only (`U.DOCK_RANGE` 45).
2. No `src/` in this pack. `out/w126/homemarker/` is markdown only. Scoped `git status --short` on worker paths, honor docs, `src/systems/hud.js`, `src/ui/hud.css`.
3. Contract keeps HUD-01 80 px hub empty. Does not steal NAV-02 GATE cue, TGT edge arrows, or Agent API badge.
4. This worker did not edit `docs/AgentApiDesign.md`. Sibling exists (untracked). `docs/Hail01DemandLifecycleDesign.md` also exists (untracked sibling).
5. Merge law: `out/w126/homemarker/shared-contract.md` wins. Cross-read vs `docs/Hud06HomeMarkerDesign.md`.
6. Leftover is not CONSUME. Named serial is **PR1**, not none.
7. Later write-set documented as `src/systems/hud.js` + `src/ui/hud.css` only.
8. No Vite. No Chrome. No boot-test. Started no processes.

## Bugs found

None.

Leftover is **REAL**. Named serial is **PR1** (persistent current-system station marker + distance). Not CONSUME. Not serial none.

Live HUD still has one TGT `rw-edge-arrow` for `ctx.targets.current` (`hud.js` **816**, **1415–1433**). Grep `HOME` / `rw-home` / `home-mark` in `hud.js` + `hud.css` = **0**. POS writes `X n  Y n  Z n` only (**1974–1986**). Dock prompt `J` / `Dock` only when `ctx.station?.inZone && !ctx.flags.docked` (**2169–2170**); `U.DOCK_RANGE = 45` (`state.js` **30**). Chartmarks are mystery landmarks. NAV-02 `rw-nav-gate-cue` + GATE row is the plotted hop. Hole matches inbox 8,900 u.

Pack has no `src/`. `git status --short -- src/systems/hud.js src/ui/hud.css` is empty. Dirty `src/` in the tree is Wave 125 (not this leftover). `PROGRESS.md` and `docs/PLAYER-EXPERIENCE-WISHLIST.md` are modified; grep Hud06/homemarker in those files = **0**. Not this pack.

HUD-01 empty hub stays frozen (no `.rw-reticle` child). NAV-02 `gateCue` / GATE row / `world.nav` unclaimed. TGT `edgeArrow` / `.rw-edge-arrow` reuse forbidden. Agent API watch badge (PR5 in this contract) unclaimed. Hail copy unclaimed.

`docs/AgentApiDesign.md` is a sibling Agent API leftover (merge law `out/w126/agentapi/shared-contract.md`). Honor line cites Hud06 as do-not-steal. This worker write-set does not include it.

Merge law: if design and contract disagree, **`out/w126/homemarker/shared-contract.md` wins**. No material conflict found (REAL / PR1 / not CONSUME / hub empty / no TGT-NAV-badge steal / write-set `hud.js`+`hud.css` / POI omit / persist none / `innerHTML` forbidden). Internal wording `allowedLockKind === 'station'` vs `lockKind === 'station'` is the same hide rule.

## Environmental issues

None that block this data verify.

`graph_resolve` returned `execute_workflows` / software-delivery instead of `proceed_unmodeled`. Not calendar/CRM/Activar. Parent domain forbids Vite/Chrome/boot; those workflow tools were **not** used. Started **no** processes.

## Evidence

### 1. Write-set

`git status --short` on scoped paths:

- Worker pack (untracked): `docs/Hud06HomeMarkerDesign.md`, `out/w126/homemarker/**` (six markdown files; no `src/`).
- Verifier-only this pass: `out/w126/homemarker/verify/report.md`, `out/w126/homemarker/verify/write-set.txt`.
- `src/systems/hud.js` / `src/ui/hud.css`: clean.
- `docs/AgentApiDesign.md`, `docs/Hail01DemandLifecycleDesign.md`: untracked siblings; not this write-set.
- `PROGRESS.md`, `docs/PLAYER-EXPERIENCE-WISHLIST.md`: modified; not this pack.

### 2. Leftover REAL vs live HUD

| Surface | Live | Cite |
|---|---|---|
| TGT edge arrow | `rw-edge-arrow`; lock only; inset 84 | `hud.js` **70**, **816–817**, **1415–1433**; `hud.css` **576–594** |
| Behind-camera flip | `if (behind) { ndcX = -ndcX; ndcY = -ndcY; }` | **1373–1374** |
| POS | system name + `X n  Y n  Z n` | **1028–1031**, **1974–1986** |
| POS HOME / `rw-home-mark` | **absent** | grep 0 in `hud.js` + `hud.css` |
| Dock prompt | `J` / `Dock` in zone | **2169–2170**; `U.DOCK_RANGE` 45 `state.js` **30** |
| Station pose | stable Vector3; per-frame copy | `station.js` **4394–4421**, **6304–6319** |
| NAV-02 cue | `rw-nav-gate-cue` + GATE dist | `hud.js` **818–822**, **1008–1026**, **1718–1752**, **2033–2034** |
| Chartmarks | mystery landmarks, not pad | **824–841**, **1648–1688**, **1847–1858** |
| Scanner arc | ships | **876–910**, **1494–1520** |
| Hub | 80 px `.rw-reticle`; RANGE | `hud.css` **184–218**; `hud.js` **1293** |
| `innerHTML` in `hud.js` | **none** | grep 0 |
| `el()` / `stripHudText` | `textContent`; drop C0 | **283–288**, **421–428** |
| Station lock meta | name + `dist u` | **2073–2075**; `reticle-aim.js` **283–286** |

| Flag if | Result |
|---|---|
| leftover frozen CONSUME | **no** — REAL / PR1 |
| named serial none | **no** |
| claims `src/` this wave | **no** |
| hub child / new Digit | **forbidden** |
| steal `gateCue` / GATE / `edgeArrow` / Agent badge | **forbidden** |
| later writers beyond `hud.js` + `hud.css` | **no** |
| new `WORLD_FIELDS` / `state.js` write | **forbidden** |
| `innerHTML` | **forbidden**; live `hud.js` clean |

### 3. Honor / siblings

- HUD-01 empty 80 px hub: contract §0.2; design Honor + Goals; live RANGE-only hub.
- NAV-02: contract §0.7; live `gateCue` + GATE row stay unclaimed.
- TGT: contract §0.8; live amber triangle stays lock chrome.
- Agent API badge: contract §0.9; sibling `docs/AgentApiDesign.md` exists; this pack does not edit it.
- Hail01: `docs/Hail01DemandLifecycleDesign.md` present; pack cites do-not-edit.

### 4. Later write-set freeze

Contract §0.6 / §5 and design serial PR1: **writers** `src/systems/hud.js` + `src/ui/hud.css` only. Reads of `ctx.station`, flags, `U.DOCK_RANGE`. Does not claim `galaxychart.js`, `nav.js`, `station.js` writes, `controls.js`, `agent-api.js`, `hail.js`, `overlay-policy.js`, `state.js`. Optional `formatNavDist` **call** only (`nav-guidance.js` **50–54**). Named only. Not implemented this wave.

### 5. Graph / processes

- Graph: `r-mt9ha7ew-1a73f044` `execute_workflows` `omp/workflow-software-delivery`.
- Processes started: **none**.

## Evidence paths

- `C:\Projects\WebSim\out\w126\homemarker\verify\report.md`
- `C:\Projects\WebSim\out\w126\homemarker\verify\write-set.txt`
- `C:\Projects\WebSim\out\w126\homemarker\shared-contract.md`
- `C:\Projects\WebSim\out\w126\homemarker\current-hud06-home-marker-inventory.md`
- `C:\Projects\WebSim\docs\Hud06HomeMarkerDesign.md`
- `C:\Projects\WebSim\src\systems\hud.js` **816**, **1028–1031**, **1415–1433**, **1974–1986**, **2169–2170**
- `C:\Projects\WebSim\src\ui\hud.css` **184–218**, **576–594**
- `C:\Projects\WebSim\src\game\state.js` **30**
- `C:\Projects\WebSim\src\systems\station.js` **4394–4421**, **6304–6319**
