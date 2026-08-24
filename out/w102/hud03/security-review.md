## Security Review: HUD-03 remaining optional audio-alerts brief (Wave 102)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze is a boolean on the existing `rimward-settings-v1` blob, `Object.keys(FIELDS)` load, `createTextNode` checkbox, song playback AND mute, no new emit, no Incoming copy change. XSS, persist-world, Digit, and SKU theft stay contract-frozen. No CRITICAL or HIGH.

Persona: security-auditor + orchestrator `security-review.md`. Self-applied. No `src/` edits.

---

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could still XSS if it interpolates `record.name` into the checkbox or a cue key

**Location:** `shared-contract.md` §1.1, §5; live `settings.js` 135 `createTextNode(label)`; `song.js` 423 `CUES[typ]`.

**Issue:** This wave does not ship DOM. A later PR that does `row.innerHTML = shipName + ' alerts'` or `CUES[blob.cue]` would XSS or proto-index.

**Impact:** HTML injection on z-index 80 settings, or unexpected `CUES['__proto__']` lookup.

**Fix (frozen):** authored label `HUD audio alerts`; `innerHTML` forbidden; load walks `Object.keys(FIELDS)` (`settings.js` 55–56); event `type` stays live-emitted, not settings JSON.

**Status:** mitigated in contract; not live.

#### 🟢 LOW: Persist / Digit / SKU theft if later serial ignores MERGE LAW

**Location:** `shared-contract.md` §0.5–0.6; `save.js` 76–101; `station.js` 185, 6023–6025, 6100–6102.

**Status:** accepted residual; design-only wave.

#### 🟢 LOW: `JSON.stringify(s)` already writes the whole settings object

**Location:** `settings.js` 75.

**Issue:** Extra enumerable keys on `ctx.settings` would enter localStorage. Live already does this for the known record. Later must not hang functions or player blobs on `ctx.settings`.

**Status:** contract: bool only; `FIELDS` whitelist on load.

---

### Passed Checks

- [x] No secrets
- [x] No `src/` edits this pack
- [x] `innerHTML` freeze; settings `createElement` / `createTextNode`; HUD `el()` / `textContent`
- [x] Checkbox copy is authored English — not blob names
- [x] Cue keys are authored `CUES` identifiers
- [x] No new `WORLD_FIELDS` key; HUD must not write `ctx.world.contacts` (`ctx.js` 163)
- [x] No new `localStorage` key; keep `rimward-settings-v1` (`settings.js` 23)
- [x] Digit 0/8/9 steal forbidden
- [x] No `WEAPONS` / `CUES` index from a settings string
- [x] Prototype-safe persist law copied (`Object.keys(FIELDS)`, no `for-in` blob merge)
- [x] No new `ctx.emit` type
- [x] HUD never writes `hullKind`
- [x] Mute fail-closed (`song.js` 451–453) cannot be bypassed by `hudAlerts`
- [x] Incoming toast strings frozen (`npc-fire-toast.js` 8–9)

### Recommendations

1. Later PR1: add `hudAlerts` to `FIELDS` in the same commit as the checkbox, or restore will drop it.
2. Later PR2: gate by `ctx.settings?.hudAlerts !== true` (default-off fail-closed), never by a string from storage besides the boolean validator.
3. Later PR4: grep `innerHTML` in `settings.js` / `song.js` / `hud.js` = 0; grep `WORLD_FIELDS` for `hudAlerts` = fail; grep toast strings unchanged.
4. Do not log ship names beside cue playback.
