# Security Review: NAV-05 remaining autopilot gate handoff (Wave 116)

### Risk Level: Low

### Summary

Markdown-only pack. Freeze keeps `gate.js` as the only `jumpRequested` writer with `to: near.to`, forbids teleport and charge skip, splits reason tokens into frozen literals (not save strings), and keeps `world.nav` one record with restore `autopilot: false`. Re-dispatch adds later `galaxychart.js` **only** to paint existing `#rw-galaxy-ap-live` via `textContent` / `apLine(reason)` while the chart is open. No CRITICAL or HIGH. No new trust boundary this wave.

Persona: orchestrator `security-review.md` plus `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md`. Self-applied. No `src/` edits.

Mode: Deep audit of trust boundaries in the **later** serial. This wave ships no JS.

### Re-dispatch (chart-open fly cancel)

Contract §0.15 / brief: later PR1 may write `src/systems/galaxychart.js` so `#rw-galaxy-ap-live` `showApLive(apLine(reason))` on fly `disengage` while `chartOpen`, including chart Cancel. Paint is frozen `AP_LINES` / `BREAK_LINE` literals. Raw `reason` token, dest id, and hop id must not become `textContent`. `innerHTML` still forbidden. `restore` stays silent. Unknown tokens stay blank. No overlay CSS write. No `hud.js` z-index raise. No chart close-on-engage.

No new 🔴/🟠 from this paint path.

---

## Security Audit: NAV-05 autopilot gate handoff leftover (Wave 116)

### Summary

Overall risk assessment: **low risk**. Design-only. Later serial trust boundary is hop ids + live `near.to` into an existing frozen event, plus `commLine` literals. Jump stuffing, proto ids, teleport, and persist tamper of `world.nav` are contract-frozen.

### Findings

No 🔴 CRITICAL or 🟠 HIGH.

#### 🟡 MEDIUM: Later impl could emit `jumpRequested` with stuffed `path[1]` / dest

- **Severity**: medium
- **Category**: Event injection / world-state hijack
- **Location:** live emit `gate.js` 648–649 `{ to: near.to }`; AP header `autopilot.js` 1–4 no emit; WAVE85 `jumpOnlyGate` ~19560–19564. Contract `out/w116/nav05/shared-contract.md` §0.2, §0.1 emit law.
- **Description:** A later PR that did `ctx.emit('jumpRequested', { to: nav.path[1] })` from `autopilot.js` would jump a dest the ship is not zoned for, skip nearest-spoke identity, and double-emit if gate also fires.
- **Impact:** Wrong-system swap; skip zone; possible double charge start.
- **Reproduction:** Hostile or buggy AP tick while `wantJump` true and `near.to` is a different spoke (not live).
- **Remediation:** Frozen: sole writer `gate.js`; `to` is `near.to`; `apJump` also requires `near.to === nextHop`. AP grep must stay clean.
- **Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Later impl could teleport or skip `JUMP.chargeTime`

- **Severity**: medium
- **Category**: Integrity / skip-gate
- **Location:** `jump.js` 120–165 midpoint; `state.js` 585 `zone: 60`; WAVE85 `chargeStay` ~19587. Contract §0.2.
- **Description:** Writing `ship.object.position` or `world.currentSystem` from AP, or setting `gate.jumping` without charge, would skip the living-world jump.
- **Impact:** Teleport; skip overlay; skip despawn/lock-null sequence.
- **Reproduction:** Naive “handoff fix” (not live).
- **Remediation:** Frozen: no teleport; no skip zone; no skip charge. AP does not write `currentSystem`.
- **Status:** mitigated in contract; not live.

#### 🟡 MEDIUM: Proto / reserved hop ids on lookup or emit

- **Severity**: medium
- **Category**: Prototype pollution / unexpected keys
- **Location:** `nav-guidance.js` 17–30 `RESERVED_IDS`; `gate.js` 419–432; `nav.js` `sanitizeSystemId`; `bindChannel` `autopilot.js` 80–84 deletes unknown channel keys. Contract §0.8, §2.
- **Description:** `for-in` merge of a save blob onto `ctx.autopilot` or treating `__proto__` as `path[1]` could pollute or fail open.
- **Impact:** Channel pollution; lookup of reserved ids.
- **Reproduction:** Stuffed save `nav.path[1] = '__proto__'` — live `sanitizeNav` already drops invalid path ids; reserved lookup returns null.
- **Remediation:** Frozen: reserved → `missingLookup` / `lookupFail`; no emit; no `for-in` merge. `to` stays `near.to` from live assemblies.
- **Status:** mitigated in contract; live sanitize already drops reserved dest.

#### 🟢 LOW: Persist tamper of `world.nav.autopilot: true`

- **Severity**: low
- **Category**: Save integrity
- **Location:** `nav.js` 48–55 `writeNav` always `autopilot: false`; WAVE85 `stuffedFalse` ~19665–19666; `save.js` 99–100 `'nav'`.
- **Description:** A stuffed snapshot cannot keep flying after restore. Later PR must not add a second key or persist `wantJump`.
- **Impact:** Auto-resume after load (if healer inverted).
- **Remediation:** Frozen: no new `WORLD_FIELDS` key; restore false. Consume WAVE85.
- **Status:** mitigated in contract.

#### 🟢 LOW: XSS via reason / hop name in HUD / chart live

- **Severity**: low
- **Category**: Injection
- **Location:** `AP_LINES` frozen literals `autopilot.js` 20–32; `sayLine` emit `commLine` `{ text }`; chart `apLine` + `textContent` `galaxychart.js` 572–575, 628–629; chip `textContent` `hud.js` 1958–1960. Contract §0.4 / §0.15.
- **Description:** Interpolating raw `path[1]` or the raw `reason` token into `innerHTML` (or into `apLive.textContent` without `apLine`) would leak proto/hop ids or enable XSS if a later PR used `innerHTML`. Deputized lines are literals. Chip names go through `navSystemName` (reserved strip). Later fly-cancel paint must call `showApLive(apLine(reason))`, not `showApLive(reason)`.
- **Remediation:** Frozen: no `innerHTML`; literals only for failure English; this leftover does not claim `hud.js`. Chart live-region paint is `textContent` of `apLine`.
- **Status:** mitigated in contract.

#### 🟢 LOW: Distance-only `wantJump` (false jump / wrong spoke)

- **Severity**: low (product + integrity)
- **Location:** live `wantJump` `autopilot.js` 317; emit `gate.js` 643–646. Contract §0.1 non-pick.
- **Description:** Setting `wantJump` from `dist(ship, hopPos) <= JUMP.zone` while nearest `near.to !== hop` still fails emit today — unless a later PR also drops the `near.to === nextHop` conjunct.
- **Remediation:** Both conjuncts stay. Distance-only `wantJump` forbidden.
- **Status:** mitigated in contract.

#### 🟢 LOW: Digit / SKU / hub theft if later serial ignores MERGE LAW

- **Severity**: low
- **Category**: Product-control impersonation
- **Location:** contract §0.3; `station.js` 188; `controls.js` 44, 283–284.
- **Status:** accepted residual; design-only wave.

### Passed Checks

- [x] No secrets in this markdown pack
- [x] No `src/` writes this worker
- [x] Sole emit freeze documented
- [x] Teleport / skip charge forbidden
- [x] Proto / reserved fail closed
- [x] No new persist key
- [x] `innerHTML` forbidden later
- [x] Restore `autopilot: false` consume
- [x] AP jump independent of KeyD (no dock stuffing required)
- [x] Chart fly-cancel paint is `apLine` literals, not hop-id concat
- [x] `galaxychart.js` write-set is live-region only (no layout / close-on-engage steal)

### Positive Observations

- Live `bindChannel` already strips unknown keys (no save merge onto the channel).
- Live `lookupLiveNavGate` refuses reserved ids and mismatched `_builtSystem`.
- Live emit payload cannot be a dest string from the bag; it is `near.to`.
- WAVE85 already pins stuffed `autopilot: true` → false and no out-of-zone jump.

### Recommendations

1. PR1 keep `jumpOnlyGate` / `predicate` greps green.
2. PR1 do not persist wrap counters.
3. PR3 pin must not `emit('jumpRequested')` from the harness as the only “success” if the claim is AP handoff — drive `wantJump` + zone or the real charge after AP latch.
4. PR1 `showApLive` must use `apLine(reason)` / `BREAK_LINE`, never raw token or dest id.

### Status

No 🔴/🟠 open. Wave 116 pack may report DONE on security.
