# Security Review: HUD-02 conventional family brief

**Scope:** `out/w61/conventional-family.md` (design only). No `src/` change in this wave.  
**Persona:** security-auditor + orchestrator `security-review.md`.  
**Mode:** Quick scan (markdown spec; no auth, payments, crypto, or live DOM writes).  
**Date:** 2026-08-18.

## Security Review: conventional-family.md

### Risk Level: Low

### Summary

The brief is a skin spec. It does not ship code. It tells a later implementer to restyle existing HUD nodes and to keep `textContent` for names. No HIGH or CRITICAL issue remains after the emit-table note.

### Findings

#### 🟢 LOW: Later event names must stay literals

**Location:** `out/w61/conventional-family.md` §8.3  
**Issue:** A later wave may `ctx.emit('hudMechRange')` (and Match / Contact). If an implementer interpolates hull or ship names into `type` or into a CSS class, that becomes a DOM / log injection footgun.  
**Impact:** Low today (no code). Residual if a later wave concatenates `player.name` into `dataset` or `className`.  
**Fix:** Emit only the three literal type strings. Set `dataset.family` to `'mech'` or `'live'` only. Do not put ship names in attributes.  
**Status:** documented in the brief (§6 hook, §10.4). No brief change required beyond the existing `textContent` law.

### Passed Checks

- [x] No secrets, API keys, or credentials in the brief
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` proposed for names
- [x] Existing name path cited: `el()` uses `textContent` (`src/systems/hud.js` 93–98); rail / toast / banner / weapon / DIST writes are `textContent` (1315, 1342, 695, 738, 1220, 1347)
- [x] Family attribute is a two-value enum, not free text from the net
- [x] No new `settings.js` / `localStorage` key (HUD-03 lock also avoids settings injection surface)
- [x] No `eval`, dynamic `<script>`, or CSS `url()` user content
- [x] Audio later uses existing `CUES[typ]` + `ctx.emit`; no new network
- [x] `song.js` already fails closed if audio is blocked
- [x] Mute / masterVolume remain the volume gates
- [x] Contacts / chart marks stay `aria-hidden` as today; brief does not add interactive hit targets
- [x] `#hud` stays `pointer-events: none` except the existing Controls toggle
- [x] No server, auth, IDOR, SQL, or crypto surface

### XSS note (required)

If a later wave writes lock names, toast lines, banner system names, or weapon labels, use `textContent` (or `createTextNode`), never `innerHTML`. The current HUD already does this. The brief forbids a change.

### Recommendations

1. Keep the later audio types in the frozen `ctx.js` event comment (already in the brief).
2. Do not put `ctx.player.name` or lock names into `data-*` attributes.

### Severity counts

| critical | high | medium | low | informational |
|---:|---:|---:|---:|---:|
| 0 | 0 | 0 | 1 | 0 |

Worker mapping: no 🔴/🟠. 🟢 documented, not blocking.

## Re-apply (after brief fix)

Re-read `conventional-family.md` §8.3 / §10.4 / §12.

- Still no `innerHTML` path.
- Event types stay string literals; `ctx.js` comment is required in the later audio wave.
- No new HIGH / CRITICAL.
- Risk level remains Low.
