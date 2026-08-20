# Wave 66 PR4 notes

## Landed
- `src/core/ctx.js` — frozen comment next to `survivorRescued` (comment only; emit unchanged)
- `src/systems/hud.js` — `survivorSold` toast (`warn`); `Number.isFinite` on count; `frameLines` dedupe
- Headless probe `out/w66/pr4/probe.mjs` — all keys true, exit 0

## Intentional non-edits
- `station.js`, `trafficking.js`, `save.js`, `state.js`, `pods.js`, `npc.js`, `scripts/boot-test.mjs`, wishlist, `PROGRESS.md`
- No HUD-02. No new settings key. No family audio.
- HUD does not emit `survivorSold`. Station / trafficking already emit.

## PR5 handoff
- Browser: after Confirm transfer, toast `■ The Chain took N.` with class `warn`.
- Same-frame station `commLine` must not double-toast (HUD records `payload.line` on `frameLines`).
- Do not print `row.name` on the toast.

## Probe
```
node --import ./scripts/with-css-stub.mjs out/w66/pr4/probe.mjs
```
CSS stub is required if the probe imports `hud.js` (`hud.css`). Toast mapping is not exported; the probe also reads source text and runs the extracted `survivorSold` case.
