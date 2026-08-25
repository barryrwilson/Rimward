# WAVE116 HUD-02 PR1 target facing class tokens

- Scope player `#hud[data-class-key]` facing CSS to `.rw-combat-self`.
- New rail writer: `lockClassToken` + `applyTgtClassKeyAttr` on `.rw-combat-target` only.
- Visible lock class: `hasOwn` `SHIP_CLASSES`. Q-ship unrevealed uses `coverClass` (default freighter). Mk II name pierce does not unmask the glyph.
- Hide rail omits `data-class-key` immediately. Unknown / proto omit. Generic family facing stays on the target row.
- Target CSS cites WAVE113 bio clips and WAVE114 mech plates inside 22×10. Light keeps generic.
- Family remains player `hudFamily`. One writer on `#hud.dataset.classKey`.
- WAVE113/WAVE114 boot greps now expect `.rw-combat-self`. WAVE116 pin lives before `if (errors === 0)`.
