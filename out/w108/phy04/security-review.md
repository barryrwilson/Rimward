# Security Review: PHY-04 remaining NPC avoid brief (Wave 108)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is live lookahead fail-closed, a two-sample lateral bias, no DOM, no persist, no Digit, no `state.js` write, no navmesh. XSS, proto-from-save, persist-world, and Digit theft stay contract-frozen. No CRITICAL or HIGH. Re-review after mermaid fix: jump still fail-closes to dest (`!_phyOn`); hulls still never freeze. Spec picture now matches live `_phyOn`. No new trust boundary.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` + orchestrator `security-review.md`. Self-applied (no spawn tool in this worker). No `src/` edits.

Mode: Deep audit of trust boundaries in the **later** serial (save `WORLD_FIELDS`, bag `kind` strings, HUD/Digit). This wave ships no JS.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could persist detours onto `record.route` / `WORLD_FIELDS`

**Location:** live `save.js` 76–101 `WORLD_FIELDS`; `world.js` 19–23 routes JSON-plain; contract `out/w108/phy04/shared-contract.md` §0.6, §2.

**Issue:** This wave does not ship JS. A later PR that writes mid-sample holds into `record.route` would ride `recordBanks` into `rimward-save-v1`. A later PR that adds `world.avoid` would be a new persist key. Proto/`__proto__` keys in a blob merge are the classic smash; avoid must not grow a blob.

**Impact:** Save bloat; pad-heal fights; possible prototype pollution if a future merge uses `for-in` on untrusted route objects. Not RCE in current engine. Not live.

**Fix (frozen):** Avoid is live steering. PR2 frame-only hold aim. Never persist `avoidHits` or detours. No new `WORLD_FIELDS`. No `for-in` merge from save into avoid state.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could dispatch `body.kind` from a user string

**Location:** live `collision.js` 50, 56–65 slot shape; `npc.js` 630–648 kind branches; contract §4.

**Issue:** Kinds today are engine-authored (`station|gate|asteroid|ship|player|sun`). A later “plugin” `handlers[body.kind]()` that reads a save-injected kind would be a proto/dispatch footgun.

**Impact:** Unexpected function call / inherited Object methods. Practical RCE is low (no `eval`). Freeze still required.

**Fix (frozen):** Unknown kind → skip or sphere if `r` finite. Never `obj[kind]()` from a save string. Never userString index as existence.

**Status:** mitigated in contract.

#### 🟢 LOW: Digit / SKU / hub theft if later serial ignores MERGE LAW

**Location:** contract §0.2–0.3; `station.js` 188, 6041–6046; `hud.js` 709–712.

**Status:** accepted residual; design-only wave.

#### 🟢 LOW: No secrets in the write-set

**Location:** `docs/Phy04AvoidDesign.md`; `out/w108/phy04/**`.

**Issue:** None. No API keys, no tokens.

**Status:** pass.

---

### Passed Checks

- [x] No secrets in the write-set
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; no new DOM
- [x] No new `WORLD_FIELDS` key; no avoid persist; no localStorage avoid key
- [x] Digit 0/8/9 steal forbidden
- [x] No `SHIP_CLASSES` avoid fields; `state.js` READ-ONLY
- [x] No persist blob → no proto-from-save for this feature
- [x] No new `ctx.emit` type (default none)
- [x] No UU / SKU
- [x] Fail closed never freeze hulls (availability, not a crash)
- [x] Player AP gate skip stays (bore lane, not a security hole)
- [x] Bag kinds engine-authored; unknown skip/sphere

### Recommendations

1. Later PR1: keep `applyAvoidBias` export; no persist writes in the same commit.
2. Later PR2: call hold helpers; do not assign `record.route[0]`.
3. Later PR4: grep `WORLD_FIELDS` for avoid, `state.js` diff empty, `innerHTML` 0 on touched files, no Digit bind, no `.rw-reticle` child.
4. Do not log player names beside `avoidHits`.
