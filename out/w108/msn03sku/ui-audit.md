# UI Audit: MSN-03 remaining unique SKU spec (Wave 108)

## UI Audit: Digit 2 Jobs last-step grant copy (spec only)

### Summary
No live UI this wave. Checklist applied to `docs/Msn03UniqueSkuDesign.md` §6 and contract §0.1 copy. Spec keeps the 80 px hub empty, Digit 2 Jobs, and no memorial pane. No Digit steal.

### What's done well
- Grant UX stays inside `renderJobs` (`station.js` 5106–5215 path).
- Extra line is `textContent` / existing `h()`. `innerHTML` forbidden.
- Catalog **name** (`Dart rack` / `Auto turret`) — not shop integers 6500/4200.
- Hint includes refuse: `if this hull has a hardpoint.`
- `commLine` reuses live `Gear seated.` plus a short fail suffix.
- Digit 0 shipyard, Digit 8 launch, Digit 9 Standing stay. Outfitting 8/9 papers stay papers.
- Unique DONE hide already live; spec does not add a memorial list.

### Findings

#### 🔴 Blocker
None.

#### 🟠 Major
None.

#### 🟡 Minor: Last-step card may grow a second reward line
**Location:** brief §6; live `station.js` 5213–5215 already one UU line
**Issue:** A second SKU hint on a dense Jobs card can wrap on small overlays.
**Fix:** One extra `h('div', 'job-reward', …)` or append to the existing reward string. Do not add a new pane, Digit, or icon column.
**Status:** spec already says one extra `textContent` line. Later PR3: keep one line. No brief rewrite required.

#### 💡 Suggestion: Do not show SKU hint on steps 1–2
**Location:** contract §0.1 copy
**Issue:** Hint on step 1 would promise kit three docks early.
**Fix:** Gate the hint on `parsed.step === 3` (or last-step copy only). Spec “Last-step SKU hint” already last-step. Later PR3 must not paint it on step 1/2.
**Status:** implied; acceptable.

### Hub / Digit / memorial (required checks)

| Check | Result |
|---|---|
| No hub child / quest widget | **Pass** — contract §0.2; `.rw-reticle` RANGE only (`hud.js` 709–712) |
| Digit 2 Jobs | **Pass** — `DOCK_KEY_SERVICES[1]` |
| No memorial pane | **Pass** — no Digit, no Digit 9 log |
| No Digit 0/8/9 steal | **Pass** — PR1 is `jobs-chains.js`; UI PR3 is Jobs copy only |
| `reducedMotion` | **Pass** — no extra animation |
| Contrast / tokens | N/A this wave (no new CSS) |
| Hit targets | Mouse Accept unchanged; Digit 1–9 offered-only unchanged |

### Method
Self-applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md`. Did not spawn `[designer]`. No live Chrome. No Vite.
