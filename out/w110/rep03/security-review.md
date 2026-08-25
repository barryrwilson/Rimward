# Security Review: REP-03 remaining remedial-missions brief (Wave 110)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is Digit 9 `textContent` copy that names live +2 job writers after restitution-to-0. No new persist key, no new DOM on the hub, no Digit steal, no `state.js` write, no new job `kind`, no wanted meter. XSS, proto-from-save, persist-world, Digit theft, and UU impersonation stay contract-frozen. No CRITICAL or HIGH.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` + orchestrator `security-review.md`. Self-applied (no spawn tool in this worker). No `src/` edits.

Mode: Deep audit of trust boundaries in the **later** serial (Digit 9 strings, `world.reputation` / `world.jobs` from `localStorage`, HUD/Digit). This wave ships no JS.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could `innerHTML` job titles or faction names

**Location:** live `station.js` `h()` 4387–4392 `textContent`; `renderEpics` 5805–5848; contract `out/w110/rep03/shared-contract.md` §0.4, §4.

**Issue:** This wave does not ship JS. A later PR that prints `job.title` or raw `FACTIONS[key].name` through `innerHTML` would turn a tampered save string into HTML. Live Digit 9 already uses `h(..., textContent)` and `factionDisplayName` (`station.js` 1103–1107) which drops unknown keys.

**Impact:** Stored XSS on the dock overlay if a later serial forks `h()`. Not live.

**Fix (frozen):** Keep `textContent`. Frozen copy uses integers (`MINING_REP`) and `factionDisplayName` / `ladderNameAt`. Do not interpolate save job titles into the remedial note.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could add `world.wanted` / `world.remedial` as a persist blob

**Location:** `save.js` 76–101; contract §0.6.

**Issue:** Inventory proves climb lives on existing `reputation` + `jobs`. A new `WORLD_FIELDS` object keyed by faction would be a proto-merge surface if restored with `for-in`.

**Impact:** Save bloat; proto smash if merged unsafely; galaxy “wanted” smash of REP-04. Not required.

**Fix (frozen):** No new key. PR2 grep `WORLD_FIELDS`.

**Status:** mitigated in contract.

#### 🟢 LOW: Digit / hub / UU theft if later serial ignores MERGE LAW

**Location:** contract §0.2–0.5; `station.js` 188, 5938, 6075–6077; `hud.js` 709–712; `restitution.js` 5.

**Issue:** A naive PR could steal Digit 9 for a new pane, steal Digit 2, paint a wanted pip, or mint a second 1200 UU constant.

**Status:** accepted residual; design-only wave. Contract forbids.

#### 🟢 LOW: Blank Digit 9 would hide Pay restitution (availability)

**Location:** contract §0.16, §2; `station.js` 5820–5842.

**Issue:** A later “require helper or return” in `renderEpics` would drop the restitution desk.

**Fix (frozen):** Fail closed: omit extra notes only.

**Status:** mitigated in contract.

#### 🟢 LOW: No secrets in the write-set

**Location:** `docs/Rep03RemedialDesign.md`; `out/w110/rep03/**`.

**Issue:** None. No API keys, no tokens.

**Status:** pass.

#### 🟢 LOW: Double-pay / UU impersonation

**Location:** live `ui.restitutionBusy` `station.js` 5785–5800; `RESTITUTION_UU` 1200.

**Issue:** Copy PR must not debit credits. Must not add a constant equal to 1200. Live busy-flag already serializes confirm.

**Status:** copy-only freeze; debit stays in `applyRestitution`.

---

### Passed Checks

- [x] No secrets in the write-set
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; Digit 9 `textContent`
- [x] No new `WORLD_FIELDS` key; persist already `reputation` + `jobs`
- [x] Digit 0/8/9 steal forbidden; Digit 2 steal forbidden
- [x] `state.js` READ-ONLY; no `REMEDIAL_*`
- [x] `Object.hasOwn(FACTIONS)` / `standingRead` honor
- [x] No UU retune; do not impersonate 1200 / −5 / 10 / −25
- [x] Fail closed never blank Standing
- [x] No wanted meter
- [x] Prototype: copy-only helper; no `for-in` save bag

### Recommendations

1. Later PR1: append frozen `screen-note` strings via live `h()`. Do not build HTML.
2. Later PR2: grep `WORLD_FIELDS`, `innerHTML`, `kind: 'remedial'`, Digit map, `RESTITUTION_UU`.
3. Do not debit UU in the copy PR.
