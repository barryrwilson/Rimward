## Security Review: BIO PR3 Abomination desk

**Scope:** `src/game/hangar.js` graft/standing; `src/systems/shipyard-desk.js` two-step desk; `src/systems/station.js` Esc/pending; `out/w72/pr3/probe.mjs`.
**Mode:** Deep audit (save-tamper standing skip, proto keys, XSS, double-confirm, debit, reputation write).
**Pass:** initial + post-probe (no HIGH/CRITICAL code change).

### Risk Level: Low

### Summary

Gilded two-step graft writes `grafted: true` on the mounted built row and player. Hostility caps `reputation.beautiful` at −10 while any sanitized hangar row still owns `grafted === true`. Tamper cannot skip the cap. Cancel does not debit, graft, or change standing. No 🔴 CRITICAL or 🟠 HIGH findings.

### Findings

#### 🟡 MEDIUM: unsanitized living `grafted: true` would cap if standing ran first

- **Severity**: medium
- **Category**: input validation / call order
- **Location**: `src/game/hangar.js:129-154`
- **Description**: `anyGrafted` does not sanitize. `applyAbominationStanding` caps on own-key `grafted === true` even if a later sanitize would drop living/Unknowables flags. Live callers sanitize first (`sanitizeHangar`, `graftMounted`, `switchTo`). Restore runs `sanitizeHangar` before `applyMountedFlight`.
- **Impact**: A future caller that applies standing before hangar heal could cap Beautiful standing from a living-dropped flag. Restore and desk paths do not.
- **Reproduction**: Call `applyAbominationStanding` on `{ hulls: [{ id:'x', hullKind:'living', grafted:true }] }` without `sanitizeHangar`.
- **Remediation**: Keep the sanitize-then-stand order. Do not add a second sanitize inside `applyMountedFlight` (that path must not rebuild a starter).
- **Status**: open (documented; current callers sanitize first)

#### 🟢 LOW: invalid reputation bag is replaced, not merged

- **Severity**: low
- **Category**: persist boundary
- **Location**: `src/game/hangar.js:144-147`
- **Description**: If `world.reputation` is missing, an array, or a non-object, the write builds a fresh `{}` and assigns `beautiful` only. It does not `for…in` the bad blob.
- **Impact**: Other faction keys on a corrupted bag are already unusable. Hostility still lands.
- **Status**: open (accepted; contract forbids `for…in` from save input)

#### 🟢 LOW: `graftMounted` is a logic API without the warning pane

- **Severity**: informational
- **Category**: UX gate
- **Location**: `src/game/hangar.js:731-752`; `src/systems/shipyard-desk.js:156-178`
- **Description**: Console or a later caller can invoke `graftMounted` without arming `graftPending`. The desk has no one-click digit that confirms. Second `graftMounted` refuses `already`.
- **Impact**: None for the shipped desk. Hostility and persist still match the ownership invariant.
- **Status**: open (accepted)

### Passed Checks

- [x] No secrets in code
- [x] Save tamper `grafted: true` on a built row caps Beautiful standing on `sanitizeHangar`
- [x] Living-only `grafted: true` drops the flag and does not cap from that row
- [x] Mixed hangar (parked built grafted + living mounted) still caps
- [x] `graftedOwnTrue` / `own()` / `RESERVED_IDS` fail closed
- [x] Standing write is direct `bag.beautiful` after FACTIONS + RESERVED_IDS checks; no `for…in` of reputation
- [x] Missing `beautiful` key is created; worse than −10 is kept
- [x] Removing grafts is not in this PR; standing is not auto-healed when `anyGrafted` is false
- [x] No `innerHTML` in shipyard-desk graft copy; `h()` uses `textContent`
- [x] No new frozen `ctx.js` event (`grafted` / `abomination` / `hullKindChanged` / `bioSeed`)
- [x] Two-step arm + Confirm; Esc / Cancel clears pending; no digit confirms the graft
- [x] Double confirm: `already` refuse; `graftBusy`; digits swallowed while pending
- [x] Credits unchanged on confirm; no `HIDDEN_MOUNTS` 900; no yard 8000; no `requestAutosave` from hangar.js
- [x] Fail closed: not Gilded (including Beautiful), gilded `rep < 0`, living, Unknowables, already grafted, dock/combat/jump/paused
- [x] `applyMountedFlight` Unknowables deletes `player.grafted`
- [x] HUD family for built+grafted remains `mech` (hud.js unread-write)
- [x] N/A: auth, sessions, SQL, RLS, CSP, wallet, admin endpoints (local sim)

### Recommendations

1. Keep sanitize-then-stand on every new hangar verb.
2. Do not add a graft digit that confirms without the armed pane.
3. Later strip PR must not auto-heal Beautiful standing.

### Positive Observations

- Hostility is an ownership invariant on sanitize, not only a purchase side effect.
- Desk matches Confirm papers / Confirm transfer (`textContent`, Esc cancel, no silent debit).
- Hangar stays THREE-free and does not import `npc.js`.
