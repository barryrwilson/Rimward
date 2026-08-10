# RIMWARD Faction Visual Examples

These images are exploratory concept examples derived from `rimward-faction-lore-omp.md` and `rimward-game-elements-omp.md`.

The faction names and collective title are provisional in the source lore. The source also states that faction flags, heraldry, uniforms, and finalized visual designs are not established canon. Accordingly, these images are visual-development references rather than canonical designs.

Each faction has five 1672×941 concepts:

- `NN-faction-station.png`
- `NN-faction-ship.png`
- `NN-faction-jump-gate.png`
- `NN-faction-male.png`
- `NN-faction-female.png`

The male and female images are representative character studies, not named
rulers or finalized uniform designs. For the nonhuman Unknowables and Assembly,
the labels describe human-readable presentation: temporary energy-field
silhouettes and humanoid contact chassis, respectively. They do not establish
biological sex or gender as faction canon.

The folder also contains three labeled overview sheets for quick comparison:

- `overview-stations.jpg`
- `overview-ships.jpg`
- `overview-jump-gates.jpg`

All images were generated with the built-in OpenAI image-generation tool. The per-image prompt summaries are recorded in `PROMPTS.md`.

## Implementation status

The game implements these references. `src/game/faction-style.js` holds the
per-faction palette sampled from the station/ship/jump-gate images, and
`src/systems/npc.js`, `src/systems/station.js`, `src/systems/gate.js`, and
`src/systems/solarsystem.js` build ships, stations, gates, and planet grading
from it (waves 37-39; plan: `docs/FactionVisualUpdatePlan.md`). The images stay
visual-development references, not canon — the in-game look is the shipped
design, and these sheets are the style target it was matched against.

### Character portraits (wave 41)

The male/female studies are the only images the game ships derivatives of. Each
one is cropped square and re-encoded to a 384x384 WebP (quality 0.82, 15-35 kB;
485 kB for all twenty) at `public/assets/portraits/<faction>-<a|b>.webp`, where
`a` comes from the `-male.png` source and `b` from `-female.png`. The variant
key is deliberately neutral: `src/game/portraits.js` picks it with a hash of a
stable person id, so no game data carries a gender semantic. The station PEOPLE
card and the combat HAIL card render them; `hollow` and `independent` have no
study and stay text-only.

The crops were baked once through a headless-Chrome canvas pass (the project has
no image dependency and gains none for this). The rectangles below are in source
pixels — `x y side` against the 1672x941 original — and reproduce the shipped
files exactly:

| faction | a (male source) | b (female source) |
|---|---|---|
| veridian | 589 58 560 | 456 58 560 |
| ferrous | 305 30 560 | 389 58 560 |
| freehold | 456 124 560 | 482 124 560 |
| redledger | 573 147 560 | 456 124 560 |
| gilded | 439 67 560 | 305 44 560 |
| beautiful | 411 0 800 | 453 42 800 |
| unknowables | 411 115 800 | 340 0 941 |
| assembly | 285 166 700 | 319 166 700 |
| congregation | 330 38 620 | 399 28 620 |
| lamplighter | 255 227 560 | 389 280 560 |

Sides differ on purpose: a head-and-shoulders box for the human studies, a wider
box for the full-figure Beautiful Ones and Unknowables compositions, which read
as noise when cropped tight.
