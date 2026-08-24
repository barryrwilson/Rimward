# Wave 102 CLOS notes

- Merge law: `out/w101/closure/shared-contract.md` wins.
- Helper: `src/game/los-close.js` `losCloseRate(fromPos, targetPos, relVel)`.
- Picture: `.rw-combat-clos` after DIST on `.rw-combat-target`.
- First frame: `0 u/s` until a vel sample exists (`haveTargetVel`).
- Boot: `wave102 clos:` JSON; no `WAVE102 CLOS FAIL`.
- Pre-existing `WAVE92 BIO-02 FAIL` left untouched.
- WAVE98 / WAVE99 / WAVE100 pins stayed true on the last full `npm run test:boot`.
- Vite / Chrome not started.
