## Security Review: HUD-03 remaining optional audio-alerts (Wave 103)

### Risk Level: Low

### Summary
First impl adds a boolean `hudAlerts` on the existing `rimward-settings-v1` blob and a playback skip in `song.js`. Load walks `Object.keys(FIELDS)` and copies only own keys. Mute still zeros master. Cue names stay authored. Digit map is untouched.

### Findings

No critical or high findings after the own-key load harden.

#### 🟢 LOW: Settings persist still stringifies the whole `ctx.settings` object
**Location:** `src/systems/settings.js` persist (`localStorage.setItem` + `JSON.stringify(s)`)
**Issue:** Persist writes every own enumerable key on `ctx.settings`, not a FIELDS-only record.
**Impact:** An extra key on the settings object would ride the client blob. Only `settings.js` writes `ctx.settings`. Unknown keys still drop on load.
**Fix:** Optional: persist `Object.keys(FIELDS)` only. Not required for this serial.
**Status:** open (accepted)

### Passed Checks
- [x] Persist proto: load uses `Object.keys(FIELDS)` + `Object.prototype.hasOwnProperty.call(data, key)`. JSON `__proto__` blob does not set `hudAlerts`. Inherited `{ hudAlerts: true }` does not set it. Reserved ids `__proto__` / `constructor` / `prototype` are not FIELDS keys.
- [x] innerHTML: `settings.js` and `song.js` have zero `innerHTML`. Checkbox label is `createTextNode('HUD audio alerts')`.
- [x] Mute bypass: `hudAlerts === true` does not change `master.gain`. Mute / `masterVolume === 0` still multiply master to 0. Toggle cannot force HUD-alert sound while muted.
- [x] Cue-key from blob: settings JSON does not index `CUES` / `FAMILY_CUES`. `HUD_ALERT_TYPES` is an authored `Set`. Event `type` comes from live emitters.
- [x] Digit theft: no edit to `station.js`. Digit 0 remains shipyard. Digit 8/9 remain launch/epics at dock and launcher/turret papers in outfitting.
- [x] No new `ctx.emit` type. No new `WORLD_FIELDS`. No new `localStorage` key. No `state.js` write.
- [x] No secrets, no credit logs, no ship-name interpolation on the checkbox.

### Recommendations
1. Keep persist on `rimward-settings-v1` only.
2. Do not later index `CUES[blob.cue]`.
