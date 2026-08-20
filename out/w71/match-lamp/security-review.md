## Security Review: src/systems/hud.js MATCH lamp (rock lock)

### Risk Level: Low

### Summary
HUD-only visibility change: MATCH lamp now also lights when `ctx.flags.matchSpeed` is true and the current target is a rock lock. No new network, persist, eval, or DOM HTML injection. Deep audit of the diff found no exploitable issues.

### Findings

None.

### Passed Checks
- [x] No secrets, API keys, or credentials in the diff
- [x] No `innerHTML` / `insertAdjacentHTML` / `eval` / `new Function` / `document.write`
- [x] Lamp text still created once via `el()` (`textContent` only)
- [x] No new persist (`localStorage` / `sessionStorage` / save.js)
- [x] No import of `controls.js`; rock-lock predicate is a local duplicate
- [x] `flags.matchSpeed` is read-only in hud.js (ship.js remains owner)
- [x] No `hullKind` writes; HUD-02 skins untouched
- [x] Family tick stays `emitFamilyTick('mech', 'hudMechMatch', {})` — no new HUD family
- [x] Combat rail still gated on `shipTgt` only (live ship with `state`)
- [x] No SQL, auth, crypto, or admin-path changes

### Data flow
1. Input: `ctx.flags.matchSpeed` (boolean, written by ship.js) and `ctx.targets.current`.
2. Rock predicate: `!!(t && t.position && !t.object && !t.state)` — structural shape check, not user-string interpolation.
3. Output: toggle `.rw-match-lamp.is-hidden`; optional existing mech family tick on rising edge.

### Recommendations
1. None for this diff. Keep MATCH physics ownership in ship.js.

---

## Security Audit: MATCH lamp rock lock (hud.js)

### Summary
Overall risk assessment: clean. Visibility-only HUD change; no injection, persist, or privileged-path issues.

### Positive Observations
- Existing `el()` helper uses `textContent`, not HTML parse.
- Combat vitals rail remains ship-only, so a rock lock cannot surface hull/shield numbers.
- Local predicate does not import controls (avoids a new cycle).
