## Code Review: BIO-02 PR1 career labels (WAVE92 button restore)

### Summary
Career word stays on the Offer **name** line. Offer **button** is `Offer ${classLabel(dest)}` (`Offer heavy`). Confirm hop and dest keys stay live class keys. Probe `out/w102/career/probe.mjs` PASS.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\reviewer.md` plus `C:\Users\barry\.grok\skills\orchestrator\references\code-review.md`.

### What's done well
- Frozen `CAREER_WORD` plus `careerWordFor` / `careerOfferLabel` keep paint off dest mutation.
- Cutter name stays `light → cutter`. Button stays `Offer cutter`.
- `btn(trainCard, \`Offer ${classLabel(offer.destClass)}\`)` matches WAVE92 exact `Offer heavy`.
- `setTrainPending(ui, ctx, offer.destClass)` and `trainMounted(ctx, dest)` unchanged in dest shape.
- Yard pane still uses `classLabel` only.

### Findings

None at 🔴 Blocker or 🟠 Major.

#### 💡 Suggestion: Exported helper sits among private desk helpers
**Location:** `src/systems/shipyard-desk.js` `careerOfferLabel` after `classLabel`
**Issue:** The export lives next to private `classLabel` so it can call that helper. Fine at runtime.
**Fix:** Optional later: keep paint helpers in one export block. Not required for PR1.

### Verdict
Approve. WAVE92 BIO-02 Offer click should pass after this restore. Kit mutate still omit.
