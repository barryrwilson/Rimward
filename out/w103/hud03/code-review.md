## Code Review: HUD-03 remaining optional audio-alerts (Wave 103)

### Summary
PR1–PR4 land as one serial. Settings own the bool. Song owns the gate. Incoming toast copy is frozen. WAVE103 pins cover restore, mute, subset, hub, and digits.

### What's done well
- Default `hudAlerts: false` on `ctx.settings` next to mute/volume.
- `FIELDS` validator matches `muted` (`typeof v === 'boolean'`).
- CHECKBOXES row sits after Reduced motion and before Mute all audio.
- Playback skip is `HUD_ALERT_TYPES.has(typ) && hudAlerts !== true` via `alertOk`. Combat `npcFire` / `playerHit` and whalesong stay mute-only.
- `FAMILY_CUES` family check still runs.
- Load is own-key only. Corrupt JSON still fail-closed.
- No `hud.js` edit. CLOS sibling stays clear.
- Boot WAVE103 is append-only.

### Findings

#### 🟡 Minor: Persist still dumps the full settings object
**Location:** `src/systems/settings.js` persist
**Issue:** `JSON.stringify(s)` rather than a FIELDS pick.
**Fix:** Optional later. Observable keys today match FIELDS plus the new bool.
**Status:** open (accepted)

#### 💡 Suggestion: `HUD_ALERT_TYPES` is exported
**Location:** `src/systems/song.js` `export const HUD_ALERT_TYPES`
**Issue:** Extra export so WAVE103 / probe can import the subset table.
**Fix:** Keep. Authored identifiers only; not blob names.
**Status:** open (accepted)

### Passed contract
- `state.js` unread-for-write.
- Frozen event list unchanged.
- No new Digit, Key, WORLD_FIELDS, or emit type.
- Incoming strings stay `Incoming fire.` / `Incoming dart.`.
- No `incomingFire` / `incomingDart` CUES keys.

### Verdict
Ready. No blocker or major.
