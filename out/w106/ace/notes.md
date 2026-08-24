# Beautiful Ones ace — hunting squid (wave 106)

Full rewrite of `scripts/ship_builders/beautiful/ace.py`. Old dart-manta
body plan (forward wing pair, S-curve folds, flipper membranes) is gone.

## Body plan

- Fusiform **mantle** loft, pointed toward -Z, peak girth in the forward
  third, collar kept open at the head. `sf.grown_loft` + `an.fusiform_stations`.
- Rhomboid **mantle fins** at the aft mantle (`an.squid_mantle_fins`), not
  mid-body, not manta wings.
- **8 arms** (`an.squid_arm`) in a tight ventral oval at the head, trailing
  toward +Z. Not a radial sunburst.
- **2 feeding tentacles** (`an.feeding_tentacle`) tucked along the bundle.
  Clubs reach the driver glow at `z = +l*0.47`.
- Ventral **siphon** (`an.siphon`).
- Concentrated **nerve fans** (`an.vein_fan`) and flank **flow lines**.
- Low **sensory crown** on the head (`org.sensory_crown`, 6 filaments, small arc).
- One injury: shortened/healed **port tentacle** plus a port-mantle welt
  (`an.healed_scar`).

Thumbnail: tubular mantle + rear diamond fins + arm bundle. Not a manta
(no forward wings). Not an octopus (rear fins present; arms do not splay).

## Envelope

Driver class ace: `l = 7.2`, `b = l*0.40`, `h = l*0.20`. Span band
[4.32, 10.08]. Authored spanZ ≈ nose to club (~6.8); spanX from fin tips
(~4.8). Longer than wide.

## LOD

| detail | contents |
|--------|----------|
| 3 | full arms, suckers, vein nodes, crown, scar |
| 2 | fewer suckers and vein branches |
| 1 | mantle + fins + arm masses; organ hints |
| 0 | mantle + fins + arm tubes (silhouette never trimmed) |

## Paint

Dual rule: hull indigo `ace.hull`; pearl `living-…` / `fin-…`; nerve
`nerve-…`; trim flow/scar; glow on the glow list.

## Not called

`shark_dorsal`, `shark_caudal`, `octopus_arm`, `fin_membrane`, `fold_crease`.
No `kit.box`, windows, nozzles, turrets, teeth.

## Verify

`python -m py_compile scripts/ship_builders/beautiful/ace.py`

Bake is out of scope for this worker.

## Re-dispatch — class order + fin span (2026-08-24)

Previous authored envelope (~7.0 max) sat 17.6% under light(8.5). Mantle
nose and feeding-tentacle clubs were too short. Fins at span=2.42 read as
a planar cross.

Fix in `ace.py` only (no shared modules, no bake):

- Mantle nose `z_nose = -l * 0.642` = **-4.622** (was `-l * 0.468` = -3.370).
- Stbd feeding-tentacle tip `z_glow + 0.585` = **+3.969**; club half-Z
  `club_r * 1.15` = **+0.230** → club face **+4.199**.
- Authored spanZ = 4.199 − (−4.622) = **8.821**. Target band 8.6–9.2.
  spanX from reduced fins `span=1.54` → ~3.08. spanZ > spanX.
- Port tentacle stays short (`z_glow - 0.82`) for the healed injury.
- Arms trail to `z_glow - 0.18` (shy of the clubs).
- Fins: span 2.42→**1.54**, chord 1.36→**1.14**, still `an.squid_mantle_fins`
  at aft mantle. No manta wings.

Verify: `python -m py_compile scripts/ship_builders/beautiful/ace.py`.
Bake is still out of scope for this worker.
