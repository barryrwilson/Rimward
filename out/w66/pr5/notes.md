# Wave 66 PR5 notes

## Verify
`npm run test:boot`

- `wave66 save pins` all-true (block unchanged).
- `wave66 desk` all-true.
- Process exits 1 on the known 8 FAILs (WAVE4 fence, WAVE26 ferry/haul cluster, WAVE30 payTribute, WAVE35 haul gate). WAVE66 does not add a FAIL.

Live Gilded dock: `travelTo('gc_auction', 'wave66')` then `dockAtCurrentStation`. Faction is `gilded`.

## Harness note
WAVE64 remount can leave `ctx.flags.docked === true` with station `ui.open === false`. `undockStation()` then no-ops. Digit 7 never opens People. WAVE66 DESK clears `flags.docked` and docks again so `dock()` opens the overlay.

## Src
No product file changed. Pins failed first on the stale-dock harness, not on trafficking/station.

## Docs
- `PROGRESS.md` Wave 66 history (2026-08-19).
- Wishlist: Wave 66 POD-02 impl landed; missiles/turrets/frigate later.
- `docs/Pod02TraffickingDesign.md` Status = Implemented / Wave 66.
