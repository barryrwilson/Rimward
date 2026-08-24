## Security Review: BIO-02 growth-and-training design freeze (Wave 86)

### Risk Level: Medium (design-only; residual after freeze)

### Summary

Wave 86 adds no `src/` surface. The freeze covers proto dest keys, `innerHTML`, `ctx.emit` type smash, credit NaN, HUD `hullKind` write, persist-key sprawl, and a living-frigate SKU sneak via training. Residual risk is impl-wave discipline plus owner UU (blocked until confirmed).

Checklist applied: `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` (deep audit stance on credits + persist + XSS). Mode: design freeze, not live code.

### Findings

#### 🔴 CRITICAL

None remaining.

#### 🟠 HIGH (fixed in freeze)

##### H1: `bio.growth` as a silent remount

**Location:** `bio.js` 156–161; first-draft temptation to “just evolve at 1.0.”  
**Issue:** A growth tick that wrote `classKey` would skip papers, debit, and envelope, and could smash `config.ship`.  
**Impact:** Unpaid class change; possible 240× afterburner if someone also set `multiplier = burn`.  
**Fix applied:** Contract §0.2 / §2.1. Growth is visual only. Training is a Beautiful Hangar confirm.

##### H2: `SAFE_ID` matches `__proto__`; dest class from a pending blob

**Location:** `save.js` 104–110; `hangar.js` 38–40; `ctx.js` 248–249.  
**Issue:** Pending `{ destClass: '__proto__' }` or a career string could become a key or fall through. `emit('train', row)` would smash `type`.  
**Impact:** Prototype pollution on naive maps; event-graph confusion.  
**Fix applied:** First-impl dest is the literal `'heavy'` after `hasOwn(SHIP_CLASSES)`. No new event. Never spread a hangar row. `classKeyOf` already fails closed to `light` on unknown tokens — training must **not** treat that fallback as success.

##### H3: `innerHTML` papers / ship names

**Location:** live desk uses `textContent` (`station.js` 4230–4235).  
**Issue:** A later train pane that concatenated `row.name` into HTML would XSS from a save-smuggled name.  
**Impact:** Script in the dock overlay.  
**Fix applied:** Contract §0.12 / §7.3. `h()` / `btn()` / `textContent` only. Names through `sanitizeName`.

##### H4: Invented UU / standing write

**Location:** `docs/OwnerDecisionsWave82.md` 13, 87–99 — no train UU.  
**Issue:** Shipping `20000` or `standing += 5` in a feature PR would invent economy.  
**Impact:** Unauthored economy; standing exploits.  
**Fix applied:** Owner-open. Fail-closed candidate `yardPrice('heavy')` still needs check-off. Success standing write **forbidden**. Hostile gate reuses live `rep < 0`.

##### H5: Training dest `frigate` as SKU sneak

**Location:** `shipyard.js` 29, 41; Wave 82 living frigate buy omit.  
**Issue:** Evolve-to-frigate without a buy row still produces a living frigate the yard will not sell.  
**Impact:** Catalog bypass.  
**Fix applied:** First impl dest `heavy` only. `LIVING_STOCK` unchanged. Frigate evolve owner-open, fail closed off.

##### H6: HUD / desk writing `hullKind`

**Location:** `hud.js` 72–80 read-only; `ctx.js` 20.  
**Issue:** A train success that set `'living'` from HUD or flipped built→living would reopen HUD-02 and launder grafts.  
**Impact:** Family swap; Abomination escape.  
**Fix applied:** HUD never writes. Grafted built refuse. Keep `'living'` on eligible rows only.

#### 🟡 MEDIUM

##### M1: Credit debit without integer / finite checks

**Location:** live `purchaseYardHull` / `graftMounted` already check `Number.isFinite` and clamp `>= 0`.  
**Issue:** A train helper that did `credits -= price` on NaN would corrupt the wallet.  
**Fix deferred to impl:** copy the live yard debit guards (contract §9.3).  
**Why not HIGH:** Pattern exists; contract requires it.

##### M2: `cargo` / `classKey` smuggle on sanitize

**Location:** `sanitizeHangarRecord` 211–241.  
**Issue:** Extra keys on a mutated row must not ride park.  
**Why not HIGH:** Allowlist already drops unknown fields. Contract forbids a nested `loadout` / train flag.

##### M3: In-flight double confirm

**Location:** `buyInFlight` (`shipyard.js` 54, 225–232).  
**Issue:** Double-click papers could debit twice or mutate twice.  
**Why not HIGH:** Contract §5 step 1 requires the same lock family.

#### 🟢 LOW

##### L1: Desk notice reflecting `classKey` tokens

Trusted catalog keys (`heavy`) only in copy. Do not interpolate raw save strings into sentences beyond `sanitizeName`.

##### L2: No new localStorage key

Autosave already covers hangar. A debug `localStorage.train` would be a second store. Forbidden.

### Passed Checks

- [x] No secrets in this markdown
- [x] No `src/` bindings this wave
- [x] XSS path named (`innerHTML` banned)
- [x] Prototype dest / emit smash named
- [x] Credits / persist / HUD write fenced
- [x] Frigate SKU sneak fail-closed
- [x] Unknowables dock not invented

### Recommendations

1. Impl: copy `graftMounted` / `purchaseYardHull` refuse + debit guards; do not invent a third credits helper.
2. Owner: confirm or reject `yardPrice('heavy')` reuse before PR4.
3. Verifier: grep `innerHTML` on the later desk diff; grep `SHIP_CLASSES` mutations; grep `multiplier = cls.burn`.

---

## Recheck (designer majors, Wave 86 patch)

Checklist re-applied to the delta: hangar matrix + `trainPending` chrome. No `src/`. No new persist key. No invented UU.

### 🟠 HIGH

None new.

Hostile `No sale.` is `textContent` catalog copy, not HTML. Pending `fromClass` / `destClass` still must be `hasOwn(SHIP_CLASSES)` before paint (`light`/`cutter` → `heavy`). Confirm `mountedId` mismatch refuses debit (closes a stale-papers money bug). Spreading `trainPending` into `emit` stays forbidden.

### 🟡 MEDIUM

##### M-recheck: `trainPending` on `ui` is session-only

Must not ride `WORLD_FIELDS` or `localStorage`. Contract §8 already: session `ui` only. PR2 must not autosave pending papers.

### Passed (delta)

- [x] Stale Confirm after B-launch named and fail-closed (null on `undock`)
- [x] Hostile desk does not hide the reason
- [x] Short credits still go through papers (no silent debit)
- [x] Confirm hop uses class tokens, not raw hull ids as HTML

Residual: owner UU still blocks a priced Offer (omit). Not a security defect.
