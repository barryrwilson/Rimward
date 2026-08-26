# Security Review: Hail01 pirate demand lifecycle (Wave 126 markdown)

### Risk Level: Medium (design); no live `src/` change this wave

### Summary

Markdown-only leftover pack. Census proves incoming pirate demand has no timer, jump silent-close, nameless HEAVE-TO toast, and a NaN demand → NaN credits path. Contract forbids pause impersonation, persist clocks, `innerHTML`, Agent off-card tribute, and NaN debit. No secrets.

Review mode: **Deep Audit** on credits + overlay flags (trust boundary = session hail payload + `world.credits` + optional later toast copy). Applied `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md` and persona `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`.

---

## Security Audit: hail demand emit / payTribute / overlay / toast

### Summary

Overall risk if PR1 follows the contract: **low**. Overall risk if PR1 maps demand exclusivity → `flags.paused`, persists demanding, `innerHTML`s `{name}`, or adds Agent `payTribute`: **high**. Those paths are **forbidden** in merge law (fixed before DONE).

### Finding 1: NaN demand debit can NaN the wallet

- **Severity**: high (live; **resolved** in later freeze)
- **Category**: Input validation / economy integrity
- **Location**: `src/systems/npc.js:2032-2035`; `src/game/state.js:1134-1136`; `src/systems/hail.js:253`
- **Description**: `cargoValue` multiplies raw `c.units`. Non-finite units yield NaN. `Math.max(HIDDEN_MOUNTS.demandMin, NaN)` is NaN. `payTribute` does `Math.max(0, credits - (h.demand ?? 0))`. NaN demand or NaN credits writes **NaN** into `ctx.world.credits`.
- **Impact**: Markets, berth meta, and later pays break for the rest of the session. A stuffed hail payload `{ demand: NaN }` or `{ demand: '1e999' }` is the same if PR1 trusts `ev.demand` without a finite clamp.
- **Reproduction**: Demand emit with a cargo row `units: NaN`, then Digit 1 on the card.
- **Remediation**: Emit and pay: if `!Number.isFinite(n)` or `n < demandMin`, use `demandMin` (50). Debit only when both credits and demand are finite. Else skip debit, still close the card.
- **Status**: **resolved** — contract §0.14, §0.1 Credits row.

### Finding 2: Demand hold must not impersonate `flags.paused`

- **Severity**: high (design; **resolved** in contract)
- **Category**: Availability / overlay integrity
- **Location**: `src/systems/overlay-policy.js:4`; `src/systems/hail.js:18-20`; `src/main.js` pause skip
- **Description**: Hail/chart/berth never write `paused` (CTL-02). Pause skips every `system.update` (Wave 28 LOAD hazard). Using pause as demand exclusivity would freeze combat, drop `systemLoaded`, and steal CTL-02.
- **Impact**: Soft-lock; LOAD refuse; events rotate unseen.
- **Reproduction**: Hypothetical PR sets `flags.paused` when `demanding`.
- **Remediation**: Session demanding + hail card only. Overlay-policy still never writes `paused`.
- **Status**: **resolved** — contract §0.7, §0.14.

### Finding 3: Persisted demand clock / `demanding` is god-mode mute or forever parley

- **Severity**: high (design; **resolved** in contract)
- **Category**: Persistence / cheat
- **Location**: `npc.js:249-252` instance fields; `record.demandedAt` already JSON; `state.js` WORLD_FIELDS
- **Description**: `demanding` holds weapons cold. A new WORLD_FIELDS key (or stuffing `demanding: true` + huge `demandPeaceAt`) could mute pirates after load or freeze a parley forever.
- **Impact**: Combat god-mode or unfinishable demand.
- **Reproduction**: Hand-edit `rimward-save-v1` if PR1 persisted those fields.
- **Remediation**: No new persist key. Timer is session. `demandedAt` stays the 300 s cooldown only.
- **Status**: **resolved** — contract §0.5–0.6.

### Finding 4: XSS via demand copy (`{name}` / UU / timer)

- **Severity**: medium (later impl; **locked** forbidden)
- **Category**: Injection (DOM)
- **Location**: `hail.js:369-375`, **412** live `textContent`; `hud.js:1210` toast `textContent`
- **Description**: Speaker comes from `record.pilot ?? state.name` (save-backed). A later `innerHTML` card line or toast built from that string is XSS. Live hail.js has **zero** `innerHTML`.
- **Impact**: Script in hail z 40.
- **Reproduction**: Only if PR1 uses `innerHTML` / `insertAdjacentHTML`.
- **Remediation**: `textContent` / `el()` only. Contract §0.4.
- **Status**: **resolved** (lock).

### Finding 5: Agent off-card `payTribute` is a credit cheat

- **Severity**: high (design; **resolved** in contract)
- **Category**: Authorization / economy
- **Location**: sibling `docs/AgentApiDesign.md:344` `hailResolve`; contract forbids claiming `agent-api.js`
- **Description**: Observe already must strip `hailOpened.ship`. An `act({ name:'payTribute', args:{ amount } })` that writes `world.credits` bypasses the card, `hailDigitsAllowed`, and the rolled demand.
- **Impact**: Free calm + arbitrary debit/credit if amount is attacker-chosen.
- **Reproduction**: Hypothetical Agent command with stuffed amount.
- **Remediation**: This pack does **not** write Agent. Human-equivalent resolve only on an **open** card with **live** finite demand. No new debit writer in `agent-api.js`.
- **Status**: **resolved** — contract §0.10, write-set does not claim Agent.

### Finding 6: Fail-open Digit helper catch

- **Severity**: low (cite; do not reopen CTL-04)
- **Category**: Fail closed
- **Location**: `hail.js:437-442` — helper throw → `digitsOk = true`
- **Description**: Overlay helper miss lets Digit 1..n resolve while chart/berth/pause might be up. Live CTL-02 intent is skip. This leftover must not widen that catch to pause the sim.
- **Impact**: Hail resolve under a covering overlay (existing).
- **Remediation**: Out of scope. Do not “fix” by writing `paused`. Impl wave must not copy fail-open for **demand emit**.
- **Status**: accepted — not this leftover; cited.

### Finding 7: Prototype pollution into hail / ai

- **Severity**: low
- **Location**: `overlay-policy.js:136-142` copies `ev.demand`; `npc.js` ai object
- **Description**: `for-in` merge from a hail blob into `ai` could set `__proto__`. Live code assigns authored fields.
- **Impact**: Shared-object pollution.
- **Remediation**: Authored outcome strings only. Contract §0.18.
- **Status**: **resolved** (lock).

### Passed Checks

- [x] No secrets in this pack
- [x] No `innerHTML` in live `hail.js`
- [x] Overlay never writes `paused` (live header `overlay-policy.js:4`)
- [x] Toasts `textContent`
- [x] No new persist key
- [x] Agent cheat path forbidden
- [x] DemandMin floor named (50 UU, not invented)
- [x] `state.js` READ-ONLY later

### Recommendations

1. PR1 clamp demand + credits with `Number.isFinite` at emit and at `payTribute`.
2. Jump/despawn must not leave `flags.hailOpen` true without a named close.
3. Do not land Agent tribute in this serial.
