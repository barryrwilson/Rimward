## Security Review: Wave 117 CTL-01 PR1 dock/jump bind

### Risk Level: Low

### Summary
KeyJ sets `pendingDock` with a fail-closed title/models/typing skip. No persist remap store. No Enter hijack. No `innerHTML`. Key codes are authored literals.

### Findings

None at CRITICAL or HIGH.

#### 🟢 LOW: Skip fail-closed on any exception
**Location:** `src/systems/controls.js:58-71`
**Issue:** `shouldSkipDockPulse` returns true on any thrown error. A broken `models.isOpen` would skip dock/jump until reload.
**Impact:** Player cannot dock/jump from KeyJ. Strafe and AP `wantJump` still run. Sim does not freeze.
**Fix:** Keep. Contract requires never throw and never freeze. Documented residual.

### Passed Checks
- [x] Title `#rw-title`: skip `pendingDock` (mirror `main.js` 170–174). Title also capture-swallows KeyJ. `closeTitle()` removes the node.
- [x] `ctx.models.isOpen()` skip. Optional call. Throw → skip.
- [x] Typing INPUT / TEXTAREA / SELECT / `isContentEditable` skip.
- [x] Enter not bound. Digit 0/8/9 not added. KeyZ not stolen.
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` in this write-set.
- [x] Help via `el(..., String(line))` (`hud.js` 1019–1023, `textContent`).
- [x] Prompt via `promptKey.textContent` / `promptVerb.textContent`.
- [x] Onboarding via `el.textContent = hint.text`.
- [x] No new `localStorage` / `WORLD_FIELDS` / bind-remap schema.
- [x] Authored `case 'KeyJ'` only. No `for-in` of a save blob into bindings.
- [x] No new `ctx.input` field. AP does not write `dockPressed`.
- [x] No secrets in changed files.

### Recommendations
1. Boot pins applied. Keep KeyZ unbound dismiss. Do not add a persist rebind store later without a proto-safe allowlist.

## Append: boot-test.mjs pin apply

### Summary
WAVE21 `dispatchKey('KeyJ')` twice. WAVE6 `hintCardVisible('J — dock')`. No new persist. No Enter. No innerHTML. Authored key literals only.

### Passed (boot-test diff)
- [x] No `dispatchKey('KeyD')` left.
- [x] `ctx.input.dockPressed = true` helpers kept (~1137, ~4460).
- [x] KeyZ dismiss kept (~1723).
- [x] WAVE117 NAV-05 still `dispatchKey('KeyM')` for chart. Not inverted.
- [x] WAVE85 / WAVE88 banners untouched.
- [x] No secrets. Harness-only synthetic key objects.

No CRITICAL / HIGH on the boot-test diff.

## Append: title skip attach (WAVE21 harness)

### Summary
Skip still covers title/models/typing. Title skip now requires overlay attach (`isConnected` / `parentNode` / `parent`). Truthy `getElementById('rw-title')` alone is not open. Live `closeTitle()` still removes the node. Fail-closed catch kept. No persist. No Enter.

### Passed
- [x] Title skip does not treat a create-on-miss stub as open.
- [x] Models + typing skip unchanged.
- [x] Never throw.

No CRITICAL / HIGH.
