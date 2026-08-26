# Security Review: AI-05 starter grace pack (Wave 124)

### Risk Level: Low

### Summary

Markdown-only REAL leftover pack. No `src/` ships. Contract forbids later XSS (`innerHTML`), new persist keys, Digit theft, hub pip, and god-mode from a corrupted timer. Live `jumpGraceUntil` already persists; PR1 must **clamp on read** rather than add a second persist clock. No secrets in this pack.

Applied `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` and `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`. Did **not** spawn `[security-auditor]`. Scope is the Wave 124 markdown pack plus live NPC / save / origin surfaces it cites. Review mode: deep enough for persist-tamper economy (forever-safe vs forever-mute) plus fail-closed timers.

## Security Audit: `docs/Ai05StarterGraceDesign.md` + `out/w124/startergrace/**`

### Summary

Overall risk: **low / clean** for this markdown wave. Later PR1 is attackable only if it ignores clamp / persist freezes. Those freezes are in merge law.

### Findings

No 🔴 CRITICAL or 🟠 HIGH (open).

#### 🟡 MEDIUM: Live `jumpGraceUntil` persist is already an unbounded hop-grace clock

- **Severity**: medium (live; not introduced by this pack)
- **Category**: persist tamper / client-side state
- **Location:** `save.js` **81** (`WORLD_FIELDS`); `sanitizeRestored` **1087–1137** (no clamp); `npc.js` **1838**, **1893**, **1929** (`now >= jumpGraceUntil ?? 0`)
- **Description:** A hand-edited save may set `jumpGraceUntil` to `1e20`. Hunt acquire and ace duel then never start. This is **live today**. PR1 extra window must not copy that pattern into a new field. Contract §0.13 clamps hop + death clocks to `now + 180`. Non-finite → no extra grace.
- **Impact:** God-mode safe lane if later impl trusts the raw persist value. Economy: mining/trade with no Fear pressure.
- **Reproduction:** Edit autosave `world.jumpGraceUntil` to `1e20`; load; fly into Illyx bubble after 60 s — live code will not acquire.
- **Remediation:** Later PR1 clamp at npc read sites. Do **not** add `WORLD_FIELDS.starterGraceUntil`. Do **not** claim `save.js` sanitize unless a later census requires it (default: npc clamp is enough).
- **Status:** accepted — freeze in contract §0.7 / §0.13; not a Wave 124 `src/` fix

#### 🟢 LOW: `world.time` rewind re-opens Greenhand extra window

- **Severity**: informational
- **Category**: persist tamper
- **Location:** `save.js` **1133**; deputize extra = `world.time < 180`
- **Description:** Extra starter is keyed off existing `world.time` + `world.origin`. Setting time to 0 in a snapshot rewinds the **whole** career (credits, fear, banks). It is not a grace-only exploit.
- **Impact:** None beyond existing full-snapshot edit.
- **Reproduction:** N/A as a grace-only attack.
- **Remediation:** Keep “no new persist key.” Do not add a second clock that can be Infinity while `world.time` is honest.
- **Status:** accepted — documented tradeoff

#### 🟢 LOW: Death `calmUntil` if persisted would mute hunters forever

- **Severity**: informational (prevented)
- **Category**: persist tamper
- **Location:** `npc.js` **250**; contract §0.7
- **Description:** Instance `calmUntil` is already session. Persisting it (or a huge death-until) could mute Dresk/Illyx after load.
- **Impact:** None this wave; forbidden later.
- **Reproduction:** N/A (no `src/` from this pack).
- **Remediation:** Session module flag only. Clamp `now + 180`. NaN → 0 (no extra).
- **Status:** accepted — contract forbids persist

### Positive Observations

- `innerHTML` forbidden later (contract §0.5). Live telegraph uses `say` → `commLine` → HUD `textContent` path (`npc.js` **335–337**; `hud.js` **560–568**).
- No new `WORLD_FIELDS` key (contract §0.7). Death restore already heals hull; session cooldown is enough.
- Proto: origin maps are authored literals / `Object.hasOwn` (contract §0.17). Never `for-in` a save blob into grace tables.
- Dresk flag stays name-heal + inject (`npc.js` **314**; `world.js` **957**). Grace does not delete it.
- Fail-closed: missing origin → no extra; helper catch must not throw (contract §0.13).
- No Digit / invented UU / SKU / `state.js` write (contract §0.2 / §0.6).
- No secrets, tokens, or credentials in this pack.
- Scratch path stays legal so grace is not an invuln shield vs a player who opens fire.

### Passed Checks

- [x] No secrets in pack markdown
- [x] No new DOM / `innerHTML` proposed
- [x] No new persist key / no `world.starterGraceUntil`
- [x] Timer clamp + NaN fail-closed specified
- [x] No proto merge recipe
- [x] No Digit theft
- [x] No invented UU
- [x] Fail-closed helper / never freeze sim
- [x] Dresk not cancellable via grace
- [x] Prototype-safe origin maps specified

### Recommendations

1. Later PR1: clamp hop + death clocks at npc read sites. Do not persist death calm.
2. Do not implement in Wave 124.

## Security Audit: later helpers (named freeze; not implemented)

### Finding 1: none open after lock

No critical or high in the freeze. Live unbounded `jumpGraceUntil` is pre-existing; PR1 is required to clamp it at the same call sites it already reads.

**Re-review after markdown lock:** still no CRITICAL/HIGH. REAL leftover + clamp freeze stand.
