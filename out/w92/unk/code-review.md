## Code Review: Wave 92 Unknowables design docs

### Summary

Markdown-only integrator pack. The pick (wreck/beacon/anomaly presence, not a generated dock) matches D3, Wave 82 Wait, and live `DETAIL_STATIONS` (no `unknowables`). Inventory correctly replaces stale Wave 42 table counts with live `GATE_BUILDERS` (12) and `NPC_FACTIONS` (12). No Blocker/Major remain after the lockstep table was added to the brief.

### What's done well

- MERGE LAW file exists; brief points at it.
- Code-wins inventory cites `DETAIL_STATIONS` 10 keys, not the stale “8”.
- Maps task names `OVERLAY_FACTIONS` / `DETAIL_SHIPS` to live `GATE_BUILDERS` / `NPC_FACTIONS`.
- EXP numbers copied from Wave 82; own-crystal-400 is origin-desk, not Assembly.
- PR plan is named PR1–PR5 and explicitly **not** this wave; PR5 is Wait/skip.
- Hangar living force, Digit 0, no train desk, no third SKU, no BIO/NAV/power/police/frigate/aim-glass.

### Findings

#### 🟡 Minor: Default landmark id is flavor, not live

**Location:** `shared-contract.md` §1.2; `docs/UnknowablesDockDesign.md` key decisions

**Issue:** `th_veil` / `The Veil` is an integrator default. It is not in `authored-systems.js`. A later worker might treat it as already shipped.

**Fix:** Contract already says idle presence is **absence** today and Wave 92 does not ship it. Keep PR2 gated. No doc change required beyond this note.

#### 🟡 Minor: Boot-test still names `OVERLAY_FACTIONS`

**Location:** inventory §5; `scripts/boot-test.mjs` 1447–1448

**Issue:** Live overlay set is `GATE_BUILDERS` (includes independent/hollow). The boot comment is stale. This wave must **not** “fix” it (no `src/`).

**Fix:** Later PR1 may pin `GATE_BUILDERS` keys without rewriting unrelated hollow live pins. Out of Wave 92 write-set.

#### 💡 Suggestion: PR1 pins could be listed as exact boolean names

**Location:** contract §9

**Issue:** Later implementers will invent pin names.

**Fix:** Optional in the impl wave. Not required for MERGE LAW.

### Passed (design-doc)

- [x] One first-site pick (presence)
- [x] Lockstep tables named (DETAIL_STATIONS, ships, overlay, FACTIONS, generate-galaxy, contacts, epics, market)
- [x] Wave 82 UU copied, not invented
- [x] No `src/` scheduled in Wave 92
- [x] Brief ↔ contract aligned (contract wins on own-crystal Assembly wording)
- [x] D3: no Unknowables station sculpt this serial
