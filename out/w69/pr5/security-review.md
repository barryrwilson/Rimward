## Security Review: wave69 AST harness pins (`scripts/boot-test.mjs`, `out/w69/pr5/probe.mjs`)

### Risk Level: Low

### Summary
PR5 adds boot-harness pins only. No game persist path, no DOM sinks, no eval. Temporary `SYSTEMS.freehold.field.count` write is restored in `finally`. Overlay uses a literal `'0'` index, not user keys.

### Findings

No critical, high, or medium issues.

#### 🟢 LOW: Temporary mutation of shared `SYSTEMS.freehold.field.count`
**Location:** `scripts/boot-test.mjs:14232-14242`, `out/w69/pr5/probe.mjs` cap160 block
**Issue:** The cap pin writes `field.count = 200` on the live `SYSTEMS` object, then restores 130. A throw outside `try` before restore would leak count 200 into later readers. The restore sits in `finally`.
**Impact:** Harness-only. If restore failed, a later live rebuild could spawn 160 rocks instead of 130.
**Fix:** Keep the `finally`. Do not leave count at 200. Prefer a scoped clone if a later wave adds pins after this block.
**Status:** accepted (finally restores; probe asserts `field.count === 130`)

### Passed Checks
- [x] No `eval` in the new block
- [x] No `innerHTML` in the new block (existing stub at boot-test ~175 is unchanged)
- [x] Source pins are `String.includes` on local `src/` files, not remote URLs
- [x] `fieldOre` test bag uses `{ freehold: { '0': 0 } }` — no `__proto__` / `constructor` keys
- [x] No new `localStorage` key
- [x] Pin object is booleans only; log is `JSON.stringify(w69)` with no secrets
- [x] WAVE51 first-8 tuples are copied as equality targets, not loosened
- [x] Overlay refill uses `delete` + `update`; does not parse untrusted JSON
- [x] `WORLD_FIELDS.includes('fieldOre')` is a whitelist read

### Recommendations
1. Keep cap160 restore in `finally`.
2. Do not feed save blobs from the probe into `localStorage`.

---

## Re-dispatch: WAVE51 held-fire re-aim

### Risk Level: Low

`w51step` optional `track { id, gap }` re-parks camera on `list[id]` each frame. `id` is an integer list index from the scoped field, not user input. No `eval`, no `innerHTML`, no persist. Extract/hardness asserts are unchanged.

### Passed Checks
- [x] Track id is `Number.isInteger`; missing track is a no-op
- [x] `world.time` still advances by `dt` each frame
- [x] G1 still asserts `oreUntouched` on hardness block
- [x] No `src/` edit
