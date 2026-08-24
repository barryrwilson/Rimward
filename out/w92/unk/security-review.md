## Security Review: Wave 92 Unknowables dock brief (markdown only)

### Risk Level: Low

### Summary

Wave 92 ships no `src/`. The freeze blocks the high-impact cheats a later dock could introduce: invented UU, a third data SKU, placeholder Archive, Digit steal, `innerHTML`, proto system ids, and a new persist key. No CRITICAL/HIGH remain after the integrator freeze. Residual risk is later-impl XSS/economy if a serial ignores MERGE LAW.

### Findings

#### 🟡 MEDIUM: Later Archive copy interpolates UU constants

**Location:** `out/w92/unk/shared-contract.md` §5.3; live `station.js` 1350–1353

**Issue:** Planned later copy embeds `ARCHIVE_OWN_UU` / `ARCHIVE_RIVAL_UU` in `textContent` strings. That is safe if the constants stay numbers authored in `data-trade.js`. A later worker who concatenates `row.name` or save-backed labels into the same node would XSS.

**Impact:** Stored XSS on dock overlay if a later PR regresses to `innerHTML` or unsanitized names.

**Fix (later impl):** Keep `h(..., authoredLabel)` `textContent`. Data rows have no persist `name`. Re-check in the dock serial security pass.

**Wave 92:** Documented. No `src/` to patch.

#### 🟢 LOW: Landmark `line` is player-visible Echo

**Location:** contract §1.2; live `mystery.js` landmarkFound

**Issue:** A later authored `line` is toasted. If someone later loads landmark lines from save JSON without the existing authored table, copy becomes attacker-controlled.

**Impact:** XSS/toast injection only after a persist redesign.

**Fix:** Landmark rows stay in `authored-systems.js`. `mystery.visited` stores ids only.

#### 🟢 LOW: Proposed id `th_veil` is a literal

**Location:** contract §1.2

**Issue:** Fine if kept literal. Dangerous if a later PR takes the id from URL, comms, or `Object.keys` of a player blob.

**Fix:** Authored constant. `RESERVED_IDS` reject. `Object.hasOwn` on `SYSTEMS` host.

### Passed Checks

- [x] No secrets in this wave’s markdown
- [x] No new `localStorage` / `WORLD_FIELDS` key
- [x] Economy integers copied from `docs/OwnerDecisionsWave82.md` (0.20 / 400 / 900 / 250) — not invented
- [x] No third SKU
- [x] Placeholder origin desk forbidden
- [x] Proto/reserved ids called out
- [x] `innerHTML` forbidden; `textContent` / `h()` required later
- [x] UI hide is not authorization (later desk helper re-checks)
- [x] No admin/client privileged path added
- [x] Digit 0 not stolen (dock service list frozen)
- [x] Spy/trafficking already skip Unknowables; brief does not reopen them as a cheat desk
- [x] No `src/` diff from this worker

Automated greps on **this wave’s write-set** (`docs/UnknowablesDockDesign.md`, `out/w92/unk/**`): no API keys, no `innerHTML` instruction, no invented rival price other than 900.

### Recommendations

1. Later PR2: landmark id/line literals only; pin proto id reject in boot.
2. Later PR5 (Wait): copy Assembly Archive confirm + `authoredUu`; never `innerHTML`; never placeholder.
3. Do not land economy numbers anywhere except existing `data-trade.js` constants.
