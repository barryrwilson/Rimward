# Security Review: MSN-03 remaining unique SKU (Wave 108 brief)

### Risk Level: Low (design-only; residual later-impl)

### Summary
This wave writes markdown only. No `src/` grant path changes. Later seating is allowlisted ids through live `writeMountedGear`. One design gap (fail UU inside the grant helper) is closed in merge law after this review. No secrets. No Digit theft in the spec.

## Security Audit: MSN-03 remaining unique SKU brief

### Summary
Overall risk assessment: low risk for this markdown wave. Later impl is medium if it ignores `canSeat`, stuffed patch keys, or proto employer strings. Contract now fail-closes those.

### Finding 1: Fail UU must not live inside `grantChainSku`
- **Severity**: medium (later impl) — mapped Major for lifecycle; **fixed in contract §1**
- **Category**: Authorization / unexpected credit write
- **Location**: `docs/Msn03UniqueSkuDesign.md` §4; `out/w108/msn03sku/shared-contract.md` §1
- **Description:** If later code adds `ctx.world.credits += 2` inside `grantChainSku`, any caller can mint 2 UU without a parsed last-step.
- **Impact:** Small credit mint from a stuffed helper call.
- **Reproduction:** Call `grantChainSku(ctx, '__proto__')` or `grantChainSku(ctx, 'gilded')` if credits write is in the helper.
- **Remediation:** `grantChainSku` returns boolean only. `finishChainStep` last-step (parsed step 3 only) adds integer 2 when false. Unknown employer never reaches `finishChainStep` (`station.js` 4197–4201 splice).
- **Status:** mitigated in merge law

### Finding 2: Stuffed launcher / turret fields on the job blob
- **Severity**: informational (live already safe)
- **Category**: Injection
- **Location:** live `station.js` 3494–3503; `hangar.js` 489–525
- **Description:** A save blob cannot pass `job.launcher` into the grant today. Later impl must keep spec ids from `CHAIN_GRANT`, not `job`.
- **Impact:** If later reads `job.sku`, a player could request scanner/graft keys. `writeMountedGear` would honor `scanner` / `miningLaser` if passed.
- **Reproduction:** Hypothetical `writeMountedGear(ctx, job)` with `{ scanner: 2, miningLaser: 3 }`.
- **Remediation:** Patch may contain only `{ launcher: 'dart' }` or `{ turret: 'auto' }`. Contract §0.10, §1.
- **Status:** mitigated in merge law

### Finding 3: Proto employer / reserved SKU ids
- **Severity**: informational (live already safe)
- **Category**: Prototype pollution
- **Location:** `jobs-chains.js` 44–57, 79–82; `save.js` 176–181, 345–349; `weapon-fit.js` 12–31
- **Description:** `chain-__proto__-1` is not in `CHAIN_IDS`. `Object.hasOwn(CHAIN_GRANT, key)` refuses prototype keys. `isOwnSku` drops reserved ids.
- **Impact:** None if later keeps hasOwn.
- **Reproduction:** Restore a jobs row `id: "chain-__proto__-1"` — sanitize returns null.
- **Remediation:** Keep `Object.hasOwn`. Never `in`. Never `LAUNCHER_IDS[userString]` without `isLauncherId`.
- **Status:** open as later pin (PR4)

### Findings (orchestrator format)

#### 🟡 MEDIUM: Fail UU only in `finishChainStep` step 3
**Location:** contract §1 (after fix)
**Issue:** Credits write in the helper would mint UU without a chain complete.
**Impact:** 2 UU unauthorized.
**Fix:** Boolean helper; step-3 caller only. Applied in merge law.

### Passed Checks
- [x] No secrets in this worker’s files
- [x] No `src/` edits (SKU injection cannot land this wave)
- [x] No new persist key / localStorage grant bag
- [x] Digit 0/8/9 steal forbidden in contract
- [x] `innerHTML` forbidden
- [x] Hangar unknown keys ignored (`hangar.js` 489–525)
- [x] Unique four still must not call `grantChainSku`
- [x] Shop costs not used as mission debit
- [x] No hull mint
- [x] HUD does not write `hullKind`

### Recommendations
1. Later PR2: verify `writeMountedGear` seated id before `Gear seated.`
2. Later PR4: pin `chain-__proto__-1` drop and unique-four no-grant.
3. Do not pass a job object into `writeMountedGear`.
