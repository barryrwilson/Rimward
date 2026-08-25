# UI Audit: HUD-02 remaining TARGET class silhouettes (Wave 115)

### Summary

No product chrome ships this wave. Spec picture is a **22×10 facing hint on the existing target rail**, keyed off **visible lock class**, not a new HUD widget, not a hub pip, not a steal of WAVE113/114 player glyphs. Hub stays empty 80 px. FORE/AFT stay. Digit 0/8/9 stay. KeyT/V/K/X stay. `reducedMotion` forbids new facing loops. Fail closed is generic **family** facing on the **target** row.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\ui-audit.md` myself. Did **not** spawn `[designer]`. Spec audit, not a running page. Did **not** start Vite or Chrome.

### What's done well

- Empty hub freeze: no class pip on `.rw-reticle` (`hud.css` 184–193; RANGE `hud.js` 726–729).
- FORE/AFT words + fill vs hollow stay the data (`hud.js` 353–361, 1407–1426).
- Digit 0/8/9 stay shipyard / launch / Standing.
- Target rail already exists (`hud.js` 873–875). Leftover does not invent a second glance row.
- Player tokens stay on the self row after PR1 (scope to `.rw-combat-self`). Lock tokens stay on `.rw-combat-target`.
- Zoo law: cite WAVE113/114 metrics; no new Earth toys.
- `reducedMotion` kill-all (`hud.css` 1183–1188). No new facing `@keyframes`.
- Cover identity: unrevealed Q-ship glyph matches the hull you see, not hidden cutter stats.
- Scanner law (Wave 112 §3): no lock box / PPI on the hub.

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟠 Major (closed in freeze): Unscoped player class CSS lies on the target row

**Location:** `hud.css` 1286–1336 and 1590–1669; `makeFacing` 864 and 875.

**Issue:** Live `#hud[data-class-key] .rw-facing-*` restyles **tgtFacing** from the **player** class. A player heavy locking an ace currently shows two heavy glyphs. Treating that as CONSUME would ship a lying target silhouette.

**Fix landed (markdown):** leftover is **real**. PR1 must (1) narrow player selectors to `.rw-combat-self`, (2) put lock class on `.rw-combat-target` only. Fail closed omit → generic family facing on the target row, **not** the player class leak.

**Status:** closed in contract §0.1 / §0.13. Do not reopen as CONSUME.

#### 🟠 Major (closed in freeze): Hub pip / RANGE class word

**Location:** `hud.css` 184–193; `hud.js` 726–729; contract §0.2.

**Issue:** A 22 px class hint is easy to “clarify” with a hub pip or RANGE rewrite.

**Fix landed:** no new DOM on `.rw-reticle`. RANGE stays TGT-01.

**Status:** closed.

#### 🟠 Major (closed in freeze): Q-ship cover vs Mk II name

**Location:** rail name `hud.js` 2068–2071 vs mesh `npc.js` 276–277.

**Issue:** Mk II already unmasks **name**. If the glyph followed name-pierce, the sil would show cutter while the 3D hull is still a cover freighter.

**Fix landed:** glyph follows visual / cover class. Name pierce does not unmask the sil.

**Status:** closed in contract §0.12.

#### 🟡 Minor: Light lock and omitted key look the same

**Location:** contract §0.1 light keep-generic.

**Status:** accepted. Same as player light tokens. Do not put HEAVY/ACE words on the rail.

#### 🟡 Minor: Family language follows the player, not the lock hullKind

**Location:** contract §0.14; `#hud[data-family]` from player `hud.js` 81–89.

**Issue:** Bio player vs plated lock still sees organism language on the target row.

**Status:** accepted. Class is inside **player** family. Lock-family would be a third family.

#### 🟡 Minor: Color must not become the class cue

**Location:** WAVE114 uniqueness (geometry only); WAVE113 clip-path.

**Status:** cite live metrics. Keep existing cyan / `--rw-accent`. Colorblind / contrast body classes stay.

#### 💡 Suggestion: Do not reuse RANGE, MATCH lamp, or contacts pips for lock class

**Location:** `hud.js` 729; contacts 820–849.

**Status:** frozen in contract §0.2. Contacts stay scanner-gated Wave 112 §3.

### Accessibility / theming / layout

- No new controls or hit targets. KeyT / KeyV / KeyK / KeyX stay.
- Geometry / clip-path only; do not make color the class cue.
- Unknown key = generic family facing on the target row (correct empty/error state).
- Vestibular: no new facing loops.
- Responsive: sil px-frozen; XL text scale must not clip FORE/AFT.
- Target rail reverse meters stay (`hud.css` 905–907). Class hint does not flip the row.
- When the rail is hidden (`is-hidden`), no class chrome remains in the glance set.

### Digit / hub freeze table

| Surface | Freeze |
|---|---|
| `.rw-reticle` 80×80 | empty; RANGE in-range only |
| Digit 0 | shipyard |
| Digit 8 | launch (dock root) / launcher papers (outfitting) |
| Digit 9 | Standing (dock root) / turret papers (outfitting) |
| KeyT | cycle stay |
| KeyV | reticle lock stay |
| KeyK | engine part stay |
| KeyX | match stay |

### Re-review

Designer-shaped Majors (lying tgt glyph, hub pip, Q-ship mismatch) are **closed in the freeze**. No open Blocker/Major. Did not spawn `[designer]`. Did not start a browser.
