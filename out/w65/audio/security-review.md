## Security Review: HUD-02 PR4 family audio

### Risk Level: Low

### Summary
Client-only WebAudio ticks keyed off `ctx.emit`. No new persist fields, no secrets, no DOM sinks, no settings writes. No critical or high findings. Open items are fail-closed audio skips and in-memory event ids.

### Findings

#### 🟡 MEDIUM: `document.getElementById` assumes a browser `document`
**Location:** `src/systems/song.js:423`
**Issue:** Family-cue playback reads `document.getElementById('hud')?.dataset.family` with no `typeof document` guard. A headless `initSong` consumer without `document` would throw inside `update()`.
**Impact:** Cue loop abort for that frame if `document` is missing. Not reachable in the shipped Vite browser path (`initSong` already uses `AudioContext` / gesture unlock).
**Fix:** Not applied. Justification: song.js is browser-only; the contract asked for this exact read; fail-closed skip already covers a missing `#hud`.
**Status:** open (accepted)

#### 🟢 LOW: Hostile id rides the in-memory event queue
**Location:** `src/systems/hud.js:1214-1217`
**Issue:** `ctx.emit('hudMechContact' | 'hostileEnter', { id })` copies `live.id` / `live.record.id` onto `ctx.events`.
**Impact:** None today. `toastForEvent` default-returns null for these types; `song.js` keys only on `type`. Payload is JSON-plain (string/number), not a DOM node.
**Fix:** Not applied. Justification: ids are session ship keys, not secrets; stripping id would hide a useful emit-site payload.
**Status:** open (accepted)

### Passed Checks
- [x] No secrets in changed files
- [x] No `innerHTML` / template injection
- [x] No persist / WORLD_FIELDS / family-swap event
- [x] `ctx.emit` payloads are JSON-plain
- [x] `muted` / `masterVolume` still applied in existing `song.js` master gain
- [x] New types do not toast (default `null` in `toastForEvent`)
- [x] Reduced-motion gates emit at the HUD site
- [x] Family gate at emit site plus fail-closed `#hud[data-family]` check in `song.js`
- [x] FX-02 rows (`playerFire`, `playerHit`, `npcHit`, combat bed) unchanged
- [x] No `playCue` export; no second AudioContext; no new music bed

### Recommendations
1. Keep family audio off the toast switch.
2. If song.js is ever imported under Node without a DOM, wrap the family read.

### Positive Observations
- Rising-edge / `seenHostiles` / 0.5 s / 2 s throttles prevent event-queue floods.
- `hudFamily(ctx)` is the real gate; dataset read is extra fail-closed.
- Frozen comment in `ctx.js` lists the five types; no persist event added.
