## Security Review: Wave 82 kill standing recap (re-dispatch)

### Risk Level: Low

### Summary
Kill standing still writes victim −5 and Destroy-Abomination Beautiful +5. After those writes, `applyAbominationStanding(ctx)` recaps Beautiful at −10 when the player hangar still owns `grafted: true`. No grafted row → +5 lands. Credits debit and proto-key rules are unchanged.

Audit method: self-applied `security-auditor` persona plus `security-review.md` checklist. Focus: standing lift vs ownership invariant, `graftedOwnTrue`, `Object.hasOwn` / `canWriteRep`.

### Findings

No open CRITICAL or HIGH items.

#### 🟢 LOW: kill-standing now imports hangar
**Location:** `src/game/kill-standing.js:3`
**Issue:** The recap uses the live hangar helper. Hangar already imports `save.js` (CSS). There is no hangar → kill-standing cycle.
**Impact:** Isolated kill-standing imports need the CSS stub. The game already loads hangar/save before NPC death.
**Fix:** Keep the one helper call. Do not duplicate the cap unless a cycle appears.
**Status:** accepted

### Passed Checks
- [x] Recap only while `anyGrafted` (hangar own `grafted === true`)
- [x] No recap / no clamp when the player hangar has no graft — +5 from 0 lands
- [x] Player graft + victim graft: `beautiful` stays −10 (no hunt-window leak)
- [x] Beautiful victim still skip bonus (kill −5 only)
- [x] Inherited proto `grafted` still does not bonus
- [x] `canWriteRep` + `Object.hasOwn(FACTIONS)` for bag writes
- [x] Beautiful key created only via allowlisted write, then recap may clamp it
- [x] No `crimeScore` / `wanted` / `world.crimes`
- [x] No `innerHTML`; `commLine` still allowlisted names
- [x] Credits debit path unchanged (fail-closed short/NaN/missing)
- [x] No remount on graft
- [x] `state.js` read-only

### Recommendations
1. Keep Digit 9 copy on the station worker.
2. Do not recap when `anyGrafted` is false.
