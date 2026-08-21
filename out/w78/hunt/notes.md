# Wave 78 hunt notes

## Third boot-test (after offered-bank tick fix)

WAVE71 / WAVE72 / WAVE74 / WAVE76 / WAVE78 pins all true. WAVE76 `completePay` was false on the second full run and true on the first and third runs. That pin is a live dest-dock credit check and can flake with boot time. Hunt pins stayed true on all three runs.

Known FAILs still printed: WAVE4 fence, WAVE26 ferry/haul, WAVE35 haul delivery.

## First boot-test (pre offered-bank tick fix)

WAVE78 pins all true:

```
wave78 msn: {"uniqueFour":true,"keepMineFh":true,"keepTradeFh":true,"keepHuntFh":true,"dropProto":true,"dropShortId":true,"dropNeed2":true,"dropBadSys":true,"dropAceRecord":true,"dropCommodity":true,"capFormula":true,"capFits":true,"floodHeal":true,"fieldsJobs":true,"fillTwo":true,"needOne":true,"recordBind":true,"noAsteroidId":true,"titlesHideRec":true,"stuffedTargetIgnored":true,"stuffedRestoreKept":true,"completeReplace":true,"completePay":true,"overlaySkip":true,"overlayCap":true,"expireNoPay":true,"noInnerHtml":true,"noFullSafeId":true,"haulDestBind":true,"uniqueHaulIds":true,"replaceHelper":true}
```

WAVE71 / WAVE72 / WAVE74 / WAVE76 stayed true.

Known FAILs still printed: WAVE4 fence, WAVE26 ferry/haul quote+delivery+save, WAVE35 haul gate delivery. Not treated as hunt bugs.

## Fix after first run

Offered hunt quarry-gone on tick now requires `huntBank(ctx, origin)` so an unvisited origin bank does not splice a grammar-valid offered hunt.

## Contract vs product-beat fallback 400

Contract §3.4 wins: hunt fill requires `r.bounty > 0`. Accept refuses if bounty is not finite `> 0`. Overlay keeps `PIRATE_BOUNTY_FALLBACK` 400. Hunt does not stamp 400.

## Overlay skip

Existence check in overlay pirate branch before `credits +=`. Hunt pay also silences matching accepted overlay to `done` (no fence favor) and records `huntPaidNames` so reverse-walk order cannot pay overlay after hunt splices.
