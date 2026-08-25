# Security Review: SHP remaining catalog leftover (Wave 115)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is **CONSUME** live yards / hangar / six-key catalogs, named remaining serial **none**, no DOM, no new persist key, no Digit, no `state.js` write, no user catalog JSON from save. XSS, proto-from-save, persist-world, Digit theft, and SKU-injection stay contract-frozen. No CRITICAL or HIGH. No new trust boundary.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` + orchestrator `security-review.md`. Self-applied (no spawn tool in this worker). No `src/` edits.

Mode: Deep audit of trust boundaries in the **live** catalog (save `hangar`, Digit desk, `YARD_LIST_UU` authored prices) plus what a naive later serial could break. This wave ships no JS.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could merge a save blob into authored price tables

**Location:** live `YARD_LIST_UU` `shipyard.js` 16–23; `sanitizeHangarRecord` / hangar rows `hangar.js`; contract `out/w115/shp/shared-contract.md` §0.6–0.7.

**Issue:** This wave does not ship JS. A later PR that stored yard prices on the save blob and `Object.assign`ed them onto `YARD_LIST_UU` would let a hand-edited save mint UU, bypass rank gates, or inject `__proto__` keys. Inventory proves catalogs are **authored module constants**. Hangar already persists hull rows, not price tables.

**Impact:** Not live. Prototype would be a new persist trust boundary and an economy cheat.

**Fix (frozen):** No `world.yardCatalog`. Prices stay in `shipyard.js`. `hasOwn` only. Never merge save keys into catalog objects.

**Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could `innerHTML` faction / class strings from hangar rows

**Location:** live `h()` `textContent` `station.js` 4398–4402; desk labels `shipyard-desk.js` 156–161, 374–375; contract §0.4.

**Issue:** Hull `name` and faction ids ride the save. Live desk uses `textContent` / `h()`. A later catalog PR that built HTML from `row.name` would be a stored-XSS surface in a file:// or hosted client.

**Impact:** Not live. Grep `innerHTML` in `station.js` / `shipyard-desk.js` / `hangar.js` / `shipyard.js`: none.

**Fix (frozen):** `innerHTML` forbidden later. Keep `textContent`.

**Status:** mitigated in contract; not live.

#### 🟢 LOW: Digit / SKU / hub theft if later serial ignores MERGE LAW

**Location:** contract §0.2–0.3, §0.5; `station.js` 188, 1644–1712, 6100–6102; `hud.css` 184–189.

**Issue:** Remaining serial is **none**. Residual risk is a future worker that “fixes” stale wishlist SHP-01 with a new Digit or a seventh `WEAPONS` id.

**Status:** accepted residual; design-only wave. Contract names remaining serial **none**.

#### 🟢 LOW: Buy double-debit if later serial drops `buyInFlight`

**Location:** `purchaseYardHull` `shipyard.js` 249–258.

**Issue:** Live lock already fails closed `'busy'`. Not a leftover hole. Contract forbids re-authoring buy as the catalog fix.

**Status:** live mitigated; not this leftover.

#### 🟢 LOW: Prototype keys on class / faction strings

**Location:** `hasOwn` `shipyard.js` 75–77, 85–88; `RESERVED_IDS` `hangar.js` 30–34; `SAFE_ID` `save.js` 104.

**Issue:** Live buy / sanitize already reject reserved ids. Contract §0.7 repeats `hasOwn`. No new parser in this pack.

**Status:** pass.

#### 🟢 LOW: No secrets in the write-set

**Location:** `docs/ShpRemainingCatalogDesign.md`; `out/w115/shp/**`.

**Issue:** None. No API keys, no tokens, no credentials.

**Status:** pass.

---

### Passed Checks

- [x] No secrets in the write-set
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; live desk is `textContent`
- [x] No new `WORLD_FIELDS` key; hangar already listed
- [x] Digit 0/8/9 steal forbidden
- [x] No new `WEAPONS` ids; `state.js` READ-ONLY
- [x] No user catalog JSON / UU from save
- [x] `hasOwn` / reserved-id pattern frozen
- [x] No invented UU / SKU / seventh class
- [x] Fail closed never freeze sim
- [x] Independent / Hollow empty is omit, not a fill-from-save dump
- [x] Named remaining serial **none** (no new attack surface scheduled)

### Recommendations

1. Keep consume freeze. Do not queue a catalog PR that reads prices from `localStorage`.
2. If a successor owner file ever opens one integer, keep it authored in `shipyard.js`, not on the hangar row.
