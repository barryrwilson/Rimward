## Security Review: REP-05 remaining consequences brief (Wave 103)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is Known+ patrol covering and inbound Marked jump refuse on live `'reputation'`, `standingRead`, authored `commLine` strings, no new `WORLD_FIELDS`, no dock reverse, no wanted field. XSS, proto faction keys, Digit theft, and persist smash stay contract-frozen. No CRITICAL or HIGH.

Persona: security-auditor (`C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`) + orchestrator `security-review.md`. Self-applied. No `src/` edits.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could XSS if it interpolates `record.name` or dest id into toast HTML

**Location:** `shared-contract.md` §4, §5; live `hud.js` 1130 `slot.el.textContent = text`; `police-leave.js` 123 authored `POLICE_LEAVE_LINE`.

**Issue:** This wave does not ship DOM. A later PR that does `toast.innerHTML = FACTIONS[to].name + ' locked'` or concatenates `e.to` into HTML would XSS the toast stack.

**Impact:** HTML injection on HUD toasts.

**Fix (frozen):** authored lines `Patrol covering.` and `No passage.` only; `innerHTML` forbidden; faction names only via `FACTIONS[key].name` after `Object.hasOwn` if a later copy PR names a flag (Digit 9 uses `factionDisplayName` `station.js` 1100–1105). Jump dest still `Object.hasOwn(SYSTEMS, to)` (`jump.js` 71).

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later covering could proto-index standing if it copies `npc.standingOf`

**Location:** live `npc.js` 1044–1048 `table[fac]` without `hasOwn`; contract §1.2.

**Issue:** `standingOf` is live hunt code. A covering helper that copies it could read `__proto__` if a hull faction string were reserved.

**Impact:** unexpected standing 0 vs polluted object; not RCE in this client, but persist pollution if a write copied the key.

**Fix (frozen):** covering and jump refuse **must** use `standingRead` (`data-trade.js` 73–81). Do not use `standingOf` for new gates. Do not write covering into the bag.

**Status:** contract §1.2, §0.8; PR4 pin proto bag.

#### 🟢 LOW: Persist / Digit / wanted theft if later serial ignores MERGE LAW

**Location:** `shared-contract.md` §0.3, §0.7; `save.js` 76–101; `station.js` 185, 6023–6025.

**Status:** accepted residual; design-only wave.

#### 🟢 LOW: Autopilot `jumpRequested` spam if refuse does not throttle copy

**Location:** `gate.js` 643–649 `apJump`; contract §2.3 once per dest per visit.

**Issue:** Autopilot can emit `jumpRequested` every frame in-zone. Unthrottled `commLine` would flood toasts. Unthrottled is not a wanted flag, but it is a client DoS of the toast slots.

**Fix (frozen):** latch once per destination per `systemLoaded`. Do not persist the latch. Do not set `world.nav` blocked.

**Status:** contract §2.3.

---

### Passed Checks

- [x] No secrets in this pack
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; live station `h()` / HUD `el()` / toast `textContent`
- [x] Covering / jump copy is authored English — not blob names
- [x] No new `WORLD_FIELDS`; no `wanted` / `crimeScore`
- [x] `standingRead` required for new gates (not open `reputation[user]`)
- [x] Jump dest still requires `SYSTEMS[to]`
- [x] Police leave not redesigned (live trust boundary unchanged)
- [x] Dock not standing-gated (no new authz that traps)
- [x] HUD never writes `hullKind`
- [x] Digit 0/8/9 freeze
- [x] Prototype-safe persist: no new key; sanitize already heals the bag (`save.js` 919–938)

### Recommendations

1. Later PR1/PR2: copy `police-leave.js` allowlist + `standingRead` + `Object.hasOwn`; do not copy `standingOf`.
2. Later PR4: pin no `wanted` key, independent dest still jumps at −1000, covering never targets `'player'`.
