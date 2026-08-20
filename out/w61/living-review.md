## Code Review: HUD-02 living family brief (`out/w61/living-family.md`)

### Summary

Re-apply after verifier HIGH on Bio / contacts. Root cause: §3.4 treated bottom hosts as off-glass. Legal `H` can sit on them. First wave now ships zero extra length there. Rails keep the hide. Facing stays clip-path only.

### What's done well

- Retracts “Bio / contacts stay off the aim glass” (`:124-135`).
- Gives numeric 1600×900 examples: contacts ends (710, 785) / (890, 785); Bio `H` (1556, 856).
- Contacts identity is `stroke-linecap: round` only — no 8–12 px tangent (`:87`).
- Bio extra corners / nacre edge = 0 (`:86`, bond row).
- Later extra px on those hosts must use the same hit test and fail closed (`:135`).
- §11 no longer claims those hosts are automatically safe (`:358`, `:374`).
- Rail `rw-hair-off`, 52 px inset, and wound cites are unchanged.

### Findings

#### 🔴 Blocker: Bio / contacts extra strokes unclipped (resolved)

**Location:** `out/w61/living-family.md:86-87`, `:124-135`
**Issue:** Extra 8–16 px family ink on hosts that legal `H` can cover.
**Fix:** Extra length = 0. Hide required if extras return.
**Status:** resolved

#### 🟠 Major: §11 “attach sites stay on … Bio, and contacts ends” (resolved)

**Location:** `out/w61/living-family.md:374`
**Issue:** Read as “those ends are safe.”
**Fix:** First wave: no extra Bio/contacts length. Position is not a keep-out.
**Status:** resolved

#### 💡 Suggestion: `--rw-bio-period` write-on-mood only

**Location:** mood-period note in §10.2
**Status:** open — implementation note

### Re-apply

| Check | Result |
|---|---|
| Rail hide still specified | Pass — §3.4 rails row |
| Bio / contacts extra length 0 or hide | Pass — 0 extra + hide if later |
| Facing no extra strokes | Pass |
| Geographic safety not claimed | Pass — §3.4 / §11 |
| No new bio stats | Pass |
| Same HUD-01 instruments | Pass |
| No Alt B first wave | Pass |
| Closed items not reopened | Pass (rail hide, 52 px inset, wound cites) |

Open after re-apply: one suggestion. No blockers. No majors.

### Persona notes (reviewer)

Verdict: **approve**. Extra family ink must hide or not ship. Bottom placement is not AGEZ.
