# Wave 120 PR1 chart-close-on-AP — notes

## Verdict

**Landed.** Autopilot **button** success closes the Galaxy Chart with real `setOpen(false)`. Direct `tryEngage` does **not** close. Overlay hail flush is unchanged (`takeDeferredHail` in hail update).

## Re-census (`src/systems/galaxychart.js`)

| Site | Live |
|---|---|
| `setOpen` | 421–441. Open gated by `canOpenPlayCard`. Close always writes `flags.chartOpen` and blurs `activeElement` inside `root`. No pause. |
| AP click | 633–666. Flying → `disengage` + `showApLive(apLine('cancel'))` if `chartOpen`; chart **stays**. Not-flying → `tryEngage`. Token → refuse live line + `commLine`; chart **stays**. Token `''` → `showApLive('')`, **`setOpen(false)`**, blur if focus still in chart root, prefer visible `#hud .rw-autopilot-cancel`. |
| Close elsewhere | × 668; KeyM-while-open 704; Escape 711; docked 724. |
| `showApLive` | 586–590 `textContent` only. Fly disengage 742–752 **not rewritten**. |
| Overlay open-gate | 422–425, 704–708 **not rewritten**. |

## WAVE pins

Command: `npm run test:boot` (`node --import ./scripts/with-css-stub.mjs scripts/boot-test.mjs`).

Must stay **true**:

- WAVE117 `chartStayOpen` — direct `e117(ctx)` / `tryEngage` while chart open
- WAVE117 `chartEngageStay` — Autopilot **button** success: `chartOpen === false` **and** `nav.autopilot === true`
- WAVE117 `chartCancelLive` — cancel-while-open still paints live line
- WAVE118 `chartStayOpenSrc118` — `showApLive` helpers still present (not inverted)
- WAVE118 overlay pins including `hailFlushed` / `noPauseAssign` / `noPersist118`

This worker run: WAVE117 and WAVE118 objects all `true`. Full harness printed `BOOT TEST PASS`.

## Coupling

- Close is real `setOpen(false)` → `flags.chartOpen` false → `hail.js` update `takeDeferredHail`. **Do not skip.**
- HUD Cancel chip may still have ancestor `.rw-autopilot.is-hidden` until `hud.js` 1717. Contract: blur is enough that frame.
- `gate.js` still sole `jumpRequested` writer. `jumpOnlyGate` true.
- P1 toast-flood sibling: success still `showApLive('')` only. No extra toast.
- P2 chart-label a11y: labels / hit discs untouched.

## Ports

No Vite. No Chrome CDP. 5174 / 9434 were not started.

## Graph

`graph_resolve` returned `blocked_ambiguous` with unrelated Hermes / code-review / catalog hits (coverage 0.07). No WebSim workflow. Owner-scoped write-set used.
