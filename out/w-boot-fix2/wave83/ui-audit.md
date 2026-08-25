## UI Audit: WAVE83 Incoming dart toast contract (harness-only)

### Summary
Product HUD toast UI is unchanged. Five synthetic darts still show one `Incoming dart.` warn toast on the existing `rw-toast` slots. Live region and copy stay as HUD-01. Later NPC live ticks may recycle the slot; that is not a new overlay.

### What's done well
- Copy stays `Incoming dart.` (`INCOMING_DART_TOAST` in `hud.js`)
- Toasts still use `textContent`, not `innerHTML`
- Container still `role="status"` and `aria-live="polite"` (`src/systems/hud.js` toast root)
- No new HUD node (`rw-incoming` / inbound gauge / lock box still absent)
- Cannon vs player still must not grow dart toasts (`toastThrottle`)
- Digit 2 Jobs / Digit 0 Shipyard / Digit 8/9 / empty hub untouched

### Findings

None. Harness snapshots capture copy; it does not change toast lifetime, slot count, or announce path.

### WAVE83 toast UI checklist

| Check | Result |
|---|---|
| Literal `Incoming dart.` | Pass — HUD const + capture pin |
| One visible dart toast after five emits | Pass — `dartToasts.length === 1` |
| Cannon does not grow dart toasts | Pass — `toastThrottle` |
| Live region | Pass — `role="status"` `aria-live="polite"` |
| No `innerHTML` | Pass |
| No new HUD node | Pass |
| Digit 2/0/8/9 | Pass — not in this block |
| HUD-01 empty hub | Pass — not in this block |

### Severity mapping
- No Blocker/Major UI issues
