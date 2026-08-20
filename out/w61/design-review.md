## Design Document Review: RIMWARD HUD-02 identities

### Summary
Approve with 0 open issues. The writer closed the two remaining minor items. The brief is complete enough to implement in a later wave. Wave 61 stays design-only.

### Strengths
- AGEZ cache is now `{ width, height }` from one `initHud` layout read. Resize lives in `initHud`. The brief forbids a `main.js` edit and a per-frame `getBoundingClientRect`. A 5 Hz remasure is legal when text-scale or target name changes.
- Both rails start with `rw-hair-off`. The class stays on until the first transform-path AGEZ clear. A 5 Hz flip to `bio` does not paint hairlines on that tick.
- Prior review rounds stay closed: mood period ≥ 1.2 s, reduced-motion hairlines hidden, 5 Hz `hudFamily` reread, PR4 write-set, 2 hairlines per rail, serial PR plan, Key Decisions, `src/game/bio.js` cites, Open Questions 1–3 undecided.
- Claims still match the tree (`hud.js`, `hud.css`, `save.js`, `organic.js`, `settings.js`, `bio.js`). No skins ship in Wave 61.
