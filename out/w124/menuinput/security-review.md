# Security Review: CTL-04 remaining station-menu input scoping (Wave 124)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze skips Digit1–5 → `input.weaponGroup` while docked menus and other play surfaces own those digits. No new persist key, no Digit remap, no `innerHTML`, no bind-settings store. Skip uses authored `e.code` literals and `=== true` flag reads. Hostile saves cannot remap keys. Overlay typing / title / models skip so a focused field cannot change WPN. No CRITICAL or HIGH. No new trust boundary this wave.

Persona: orchestrator `security-review.md` plus `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`. Self-applied. No `src/` edits. Did not spawn `[security-auditor]`.

Mode: Deep audit of trust boundaries in the **later** serial. This wave ships no JS.

---

## Security Audit: CTL-04 menu-input leftover (Wave 124)

### Summary

Overall risk assessment: **low risk**. Design-only. Later serial trust boundary is a boolean skip in front of an existing integer assign (`weaponGroup` 1–5). Prototype-safe: no `for-in` on save blobs, no HTML parse, no new storage key.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟡 MEDIUM: Later impl could still write `weaponGroup` while a text field is focused

- **Severity**: medium
- **Category**: Input validation / unexpected privileged action
- **Location:** `controls.js` **329–344** (no typing guard on Digit); `modelsbrowser.js` **704–719** (filter INPUT: non-nav keys return **without** `stopImmediatePropagation`); `overlay-policy.js` **72–81** `isTypingFocus`; contract §0.12
- **Description:** Live Digit1–5 set WPN even if an INPUT is focused, unless a capture listener swallowed the event. Models filter is the live hole. A player typing a catalog query could also arm missiles / psionic.
- **Impact:** Unintended weapon-group change while the player believes they are filtering a list.
- **Reproduction:** Open models. Focus filter. Press Digit4. Live: `weaponGroup` becomes 4.
- **Remediation:** Frozen: `shouldSkipWeaponGroupDigits` includes `playSurfaceBlocked` / `shouldSkipDockPulse` (typing, title, models). Authored check; never throw.
- **Status:** mitigated in contract; not live. Must land **with** the docked skip.

#### 🟡 MEDIUM: Station `stopImmediatePropagation` would fight capture-phase title / models

- **Severity**: medium (prevented by deputize)
- **Category**: Event-order / overlay hijack
- **Location:** `station.js` **6157** bubble no-stop; `title.js` **239** capture + stopImmediate; `hail.js` **433** bubble after controls; contract §0.7
- **Description:** Inventory does **not** prove listener order is the only fix. A later “fix” that stops the event on station digits can strand hail/title/origins or hide Digit0 shipyard from a future listener.
- **Impact:** Lost hail resolve, lost title Digit entries, or missed station Digit0.
- **Reproduction:** Add `e.stopImmediatePropagation()` in station Digit handler; press Digit1 on a hail that somehow stacked (CTL-02 mutex forbids stack, residual still exists if mutex skipped).
- **Remediation:** Frozen default: controls.js **does not write** `weaponGroup`. Station does not stop the event.
- **Status:** mitigated in contract.

#### 🟢 LOW (closed in pack): settings skip must not depend on hail helper alone

- **Severity**: low
- **Category**: Overlay / unexpected control surface
- **Location:** `overlay-policy.js` **49–70**, **175–179**; first formula used `hailDigitsAllowed` only
- **Description:** Settings is not `ctx.flags`. If `hailDigitsAllowed` were missing, KeyO could still change WPN.
- **Impact:** Silent WPN change behind the Settings dialog.
- **Reproduction:** Open KeyO; press Digit5. Live: group becomes 5. Later PR1 with helper present skips. Helper-miss fallback must call `settingsOwnsScreen()`.
- **Remediation:** Contract formula now reads `settingsOwnsScreen()` after helper miss.
- **Status:** mitigated in `shared-contract.md` formulas / §0.12.

#### 🟢 LOW: Hail Digit1–3 overlap is a live dual-bind until PR1

- **Severity**: low (player-facing leftover, not a privilege gain)
- **Category**: Control-plane mix
- **Location:** `hail.js` **431–432**, **433–448**; `controls.js` **329–336**; `hailDigitsAllowed` is resolve-only
- **Description:** Hail resolve and WPN write both see Digit1–3. Wave 118 gated **resolve**. WPN still writes. Contract requires `flags.hailOpen === true` skip.
- **Impact:** Silent WPN change during a pay-or-fight card.
- **Reproduction:** Open hail; press Digit1; intent resolves **and** group becomes 1.
- **Remediation:** PR1 skip on `hailOpen` without stopping hail’s listener.
- **Status:** leftover; frozen in PR1. Hail-demand lifecycle out of scope.

#### 🟢 LOW: Later impl could `innerHTML` WPN copy

- **Severity**: low
- **Category**: Injection / XSS
- **Location:** live `weaponHudLabel` string concat `hud.js` **255–273**; `el()` textContent path; contract §0.9
- **Description:** A later PR that did `weaponName.innerHTML = weaponHudLabel(ctx)` would be XSS if labels ever became save-driven. Live names are authored catalogs.
- **Impact:** Overlay script only if copy becomes untrusted.
- **Remediation:** Frozen: `textContent` / `el()`. No “not available” injection surface.
- **Status:** mitigated in contract.

#### 🟢 LOW: Persist bind-remap schema

- **Severity**: low
- **Category**: Persistence / unexpected control surface
- **Location:** contract §0.8; P2 Settings inbox
- **Description:** A later “rebind 1–5 in settings” would add a storage key and let tampered JSON steal station Digit 0/8/9.
- **Remediation:** No settings schema this serial. Authored Digit1–5 only.
- **Status:** mitigated in contract.

#### 🟢 LOW: Missing-flag throw could freeze the sim

- **Severity**: low
- **Category**: Fail closed / availability
- **Location:** contract §0.12; `hailDigitsAllowed` catch already returns false (`overlay-policy.js` **182–184**); hail.js listener catch **fail-open** `digitsOk = true` **440–442**
- **Description:** Controls skip must **never throw**. Missing `flags` = not-docked. Helper throw must not abort keydown.
- **Remediation:** Formula wraps try/catch; outer catch returns docked-only skip.
- **Status:** mitigated in contract.

#### 🟢 LOW: `for-in` on a save blob into bindings

- **Severity**: low
- **Category**: Prototype pollution / unexpected keys
- **Location:** contract §0.18
- **Description:** No remap store exists. A later generic binder that `for-in`s settings JSON could pick up `__proto__`.
- **Remediation:** Authored `e.code` literals only. Live `controls.js` **116–118** already has `reservedToken`.
- **Status:** mitigated in contract.

### Passed Checks

- [x] No secrets in this pack or in the later skip surface
- [x] No new `localStorage` / `WORLD_FIELDS` key
- [x] No `innerHTML` / `insertAdjacentHTML` proposed
- [x] No HTML parse of overlay copy
- [x] Authored `e.code` literals Digit1–5 only
- [x] `state.js` READ-ONLY
- [x] Fail-closed never throw / never freeze
- [x] Digit 0/8/9 not stolen
- [x] Overlay mutex not reopened
- [x] `save.js` / `npc.js` not claimed
- [x] Title capture / models capture left intact
- [x] No admin / network / auth surface (client sim only)

### Recommendations

1. Later PR1 must skip typing/title/models **with** docked, not docked-only.
2. Later PR1 must **read** `hailDigitsAllowed`, not rewrite hail cards.
3. Keep station digits bubbling so hail/title/origins stay independent.

Checklist from `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` plus persona `security-auditor.md`. Mode: deep audit of Digit / overlay / persist data flow. Re-read after pack write.
