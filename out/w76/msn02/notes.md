# Wave 76 MSN-02 probe notes

## Sanitize probe

```
node --import ./scripts/with-css-stub.mjs out/w76/msn02/probe.mjs
```

Result: `WAVE76 PROBE PASS`. Cap 420 at 100 systems. Unique four + `mine-freehold-0` + `trade-freehold-0` kept. `trade-__proto__-0` dropped. Need 1 / livingRock / survivor / dataCrystal / restricted dropped. Honest 4+200+200 kept. Flood 10k heals ≤420. Stuffed dest kept as a SYSTEMS key; `payQuoted` 1e12 clamps to 20000.

## Boot pins

`npm run test:boot` — `wave76 msn` all true. `wave71 msn` all true. WAVE72/WAVE74 all true.

Known suite FAILs (WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul) are pre-existing. Do not treat as trade bugs.

## Live path (verifier)

1. `npm run dev` — typically http://localhost:5173/
2. Dock Freehold. Digit 2.
3. Two trade cards plus unique/overlay/mining.
4. Accept at origin. Hold 5 bulk units. Dock dest from `otherSystemId` (Freehold → Veridian Spire).
5. Card gone, credits up, new trade card on origin board.
6. Complete again still yields a trade card.
7. Ignore an accepted card for 600 s: no pay, card replaced, not DONE.

## Reviews

- Security: `out/w76/msn02/security-review.md` (pass 1 + pass 2). No HIGH/CRITICAL.
- Code: `out/w76/msn02/code-review.md` (pass 1 + pass 2). No blocker/major.
