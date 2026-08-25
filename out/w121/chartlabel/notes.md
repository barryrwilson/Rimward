# Wave 121 PR1 chart-label notes

Landed label activate + dest `<select id="rw-galaxy-dest">` + existing KeyM `isTypingFocus` skip.

Write-set:

- `src/systems/galaxychart.js`
- `src/ui/hud.css`
- `docs/Nav07ChartLabelDesign.md` (status + verifier paths)
- `out/w121/chartlabel/**`

Did not write: `overlay-policy.js`, `controls.js`, `hail.js`, `hud.js`, `autopilot.js`, `gate.js`, `state.js`, `scripts/boot-test.mjs`, wishlist, `PROGRESS.md`.

Probe PASS:

```
node --import ./scripts/with-css-stub.mjs out/w121/chartlabel/probe.mjs
```

No Vite. No CDP. Ports 5173 / 9421 not claimed.

`showApLive` body unchanged. Autopilot success `setOpen(false)` unchanged. HIT discs stay 24 CSS px.
