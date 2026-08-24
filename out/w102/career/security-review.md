## Security Audit: BIO-02 PR1 career labels (`shipyard-desk.js`)

### Summary
Low risk. Copy-only change. Dest stays a live `SHIP_CLASSES` key. Offer **button** is `Offer ${classLabel(dest)}` (WAVE92 exact). Career word rides the name line only. No persist, Digit, emit, or `innerHTML`. Reserved dest strings fail closed.

Persona: `C:\Users\barry\.grok\bundled\skills\shared\personas\security-auditor.md` plus `C:\Users\barry\.grok\skills\orchestrator\references\security-review.md`.

### Finding 1: None at critical or high

No critical, high, blocker, or major findings.

### Positive Observations
- `CAREER_WORD` is a frozen null-prototype map. Lookup uses `Object.prototype.hasOwnProperty.call`.
- `RESERVED_DEST` rejects `__proto__`, `constructor`, and `prototype` before table read.
- Offer click still passes `offer.destClass` from `livingTrainDests`. `setTrainPending` / `confirmTrain` still pass that key to `trainMounted(ctx, dest)`.
- Confirm hop still paints `classLabel` keys. Career words are not dests.
- Offer button is exact `Offer heavy` (class key). WAVE92 `findOverlayButton92b('Offer heavy')` can match.
- `h()` / `btn()` `textContent` path. No `innerHTML`. No `row.name` on Offer or Confirm.
- Yard buy names stay `classLabel` only.
- Digit 0 stays last `DOCK_KEY_SERVICES` key `shipyard`.

### Passed Checks
- [x] No secrets in code
- [x] No `innerHTML` in `shipyard-desk.js`
- [x] Proto dest fail-closed
- [x] Dest is the class key, not the career word
- [x] Offer button is not parsed as dest
- [x] No new persist / Digit / emit / kit mutate
