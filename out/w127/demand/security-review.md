## Security Review: Hail01 pirate demand lifecycle (Wave 127 PR1)

### Risk Level: Low (re-review after boot-pin fix)

### Summary
Demand close and pay paths fail closed. Names and UU go through `textContent` only. No new persist key. No `flags.paused` write. No new frozen event type. Boot-pin re-dispatch only tightens hailClosed look-ahead and pirate Heave-to suppress; no new sink.

### Findings

None CRITICAL or HIGH.

#### 🟡 MEDIUM: Toast key embeds speaker string
**Location:** `src/systems/hud.js` `toastForEvent` hailOpened / hailClosed
**Issue:** Stable key is `warn|demand|{name}`. A `|` in an authored name could collide with another key.
**Impact:** Linger might hide a later demand toast for that name. Names are roster strings, not free player HTML.
**Fix:** Not required this PR. Authored names do not use `|`.
**Status:** accepted (authored names)

#### 🟢 LOW: Agent observe still strips demand fields
**Location:** `src/game/agent-schema.js` hailOpened fields (cite only; not edited)
**Issue:** `demandHail` / `demandOutcome` / `speaker` are not copied into observe.
**Impact:** Agent cannot cheat-pay. Observe does not grow `hailOpened.ship`.
**Status:** intended

### Passed Checks
- [x] No secrets in hail.js / npc.js / hud.js demand path
- [x] No `innerHTML` / `insertAdjacentHTML` / `document.write` on card or toast
- [x] `payTribute` debit only if `Number.isFinite(credits)` and `Number.isFinite(demand)`; else skip debit and still resolve
- [x] Demand floor: `!Number.isFinite(n)` or `n < demandMin` → `HIDDEN_MOUNTS.demandMin` (50)
- [x] No new `WORLD_FIELDS` / `localStorage` / `state.js` write
- [x] `demandExpiresAt` is session hull only
- [x] Overlay never writes `ctx.flags.paused`
- [x] No new Digit; hail digits stay 1..n
- [x] No new ctx event type (`hailDemand` removed; tagged `hailOpened` / `hailClosed`)
- [x] Emit / close / toast wrapped so demand paths do not throw
- [x] `updateDuel` has no `payTribute`
- [x] Agent API not claimed

### Recommendations
1. Parent verifier: Digit1 pay with finite UU; NaN credits skip debit.
2. Confirm jump/dock named `hailClosed` does not leave `demanding === true`.
