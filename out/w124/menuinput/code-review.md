# Code Review: CTL-04 remaining station-menu input design pack (Wave 124)

### Summary

Design-doc review (no `src/`). Contract, inventory, and brief agree: leftover is **REAL** — Digit1–5 still write `input.weaponGroup` while docked menus are open. Named serial is **PR1 station-menu Digit skip**. Cites match today’s controls switch, station Digit map, overlay helpers, hail overlap comment, and WPN rail. Hard freezes (Digit 0/8/9, KeyJ, overlay mutex, `state.js`, persist, `innerHTML`, write-set = `controls.js` only) are in merge law.

Applied `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md` and `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md`. Did **not** spawn `[reviewer]` as a code-edit pass. Spec review only.

### What's done well

- Verdict is first: inventory §12, contract header, brief Status row all say REAL / not CONSUME / PR1.
- CONSUME is explicitly forbidden unless census had proved a docked skip (it did not).
- Later write-set is one file: `src/systems/controls.js` (+ named boot pins).
- Digit 0/8/9 stay station; Digit1–5 stay flight WPN in open space.
- Listener-order census is specific: station bubble before controls bubble, **no** stop on station digits. Default fix is skip-in-switch, not event wars.
- CTL-02 `hailDigitsAllowed` is named as hail **resolution**, not WPN write. Hail.js **431–432** is cited.
- CTL-03 `save.js` and AI-05 `npc.js` are explicit non-claims.
- `fireHeld` is inventoried (`controls.js` **476**; combat **1825–1828** cold) and parked as **PR2**, not stuffed into the Digit switch.
- Fail-closed formula uses `=== true` and try/catch. Missing flags = not-docked.
- Line cites use today’s files (`controls.js` **329–344**, `station.js` **188** / **6034** / **6156–6177**, `overlay-policy.js` **83–91** / **175–185**, `hail.js` **431–432**, `hud.js` **255–273**).

### Findings

No 🔴 Blocker or 🟠 Major (open).

#### 🟡 Minor: `hail.js` fail-open vs `overlay-policy` fail-closed

**Location:** `hail.js` **440–442** catch `digitsOk = true`; `overlay-policy.js` **182–184** catch return `false`

**Issue:** Hail resolve fail-opens if the helper throws. Controls skip must not copy that fail-open (would keep the WPN leak). Contract formula catch-skips docked-only and treats helper throw as “continue flag reads”.

**Fix:** Already frozen in contract §0.12 / formulas. Do not teach hail.js in this leftover.

**Status:** accepted — hail fail-open is out of write-set; PR1 skip is fail-closed on helper throw for **WPN only**.

#### 🟡 Minor: HUD already writes `weaponGroup` on automine click miss

**Location:** `hud.js` **807**; `ctx.js` **15** “input written ONLY by controls.js”

**Issue:** Existing writer exception. A later worker could “fix” the law by claiming `hud.js` in this leftover.

**Fix:** Contract §0.10 / neighbours: do not claim `hud.js`. Automine fallback is not station-menu digits.

**Status:** accepted — cite only.

#### 🟡 Minor: Wishlist still INBOX after this pack

**Location:** `docs/PLAYER-EXPERIENCE-WISHLIST.md` **148–153**

**Issue:** Inbox stays open. A later worker could treat the wishlist as unscoped and remap digits.

**Fix:** This pack already says code wins and does **not** edit the wishlist (owner freeze). Contract §0.16.

**Status:** accepted — wishlist edit is other worker.

#### 🟡 Minor (closed in pack): settings skip if `hailDigitsAllowed` is missing

**Location:** `overlay-policy.js` **175–179** (`settingsOwnsScreen` only inside `hailDigitsAllowed`); first formula draft omitted a fallback

**Issue:** Settings is not a `ctx.flags` bit. `playSurfaceBlocked` does not include settings. If the hail helper were missing, Digit1–5 could still write WPN behind KeyO.

**Fix:** Contract formula now also reads `settingsOwnsScreen()` in the helper-miss fallback. PR1 imports existing helpers as READ.

**Status:** closed in `shared-contract.md` formulas / §0.12.

#### 💡 Suggestion: Origins Digit1–5 also dual-bind until pause skip

**Location:** `origins.js` **92** paused, **143–149** Digit pick; controls Digit write still live

**Issue:** Origins does not stop the event. Pause skip via `hailDigitsAllowed === false` closes the WPN side without touching origin pick.

**Fix:** PR1 includes `hailDigitsAllowed === false` / `flags.paused === true`. Do not claim `origins.js`.

**Status:** accepted — covered by pause / hailDigitsAllowed skip.

### Maintainability

Inventory, contract, and brief use the same verdict string. Digit 0/8/9 / KeyJ / mutex freezes repeat on purpose (merge law). Serial name is **PR1**, not none. Formula is copy-pasteable into `controls.js` without new Digit codes.

### Test coverage

Later pins named only: dock then Digit4/5, `weaponGroup` unchanged; open-space Digit1 still sets 1; Digit0 shipyard pins stay. This wave did not add `boot-test.mjs` and did not create `out/w124/menuinput/verify/**`.
