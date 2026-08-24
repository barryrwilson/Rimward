## Status
CLEAN

## What I tested
- Domain: data (source only). Did not bake.
- `python -m py_compile scripts/ship_builders/beautiful/heavy.py` (exit 0).
- Grep MUST tokens in `scripts/ship_builders/beautiful/heavy.py`: `whale_fluke`, `whale_pectoral`, `dorsal_ridge`, `blowhole`, `dorsal_mantles`, `style='humpback'`.
- AST walk of the same file for real Call nodes (not comments): `out/w106/heavy/verify/ast_scan.py`.
- Grep MUST NOT as primary: `shark_dorsal`, `shark_caudal`, `shark_pectoral`, `squid_arm`, `fin_membrane`.
- Confirm no `kit.box` Call (docstring prose only).
- Read `anatomy.whale_fluke` / `anatomy.whale_pectoral` to confirm horizontal fluke and humpback paddle.
- Authored geometry: pectoral tip X, both-side span vs 15% of length, fluke span, droop, chord.

## Bugs found

## Environmental issues
- Graph resolve returned `omp/workflow-activar-proposal-scope-builder` (coverage 0.13, Activar PR SOW). Trigger does not apply. Followed the owner verify brief instead.

## Evidence
- Compile: `python -m py_compile scripts/ship_builders/beautiful/heavy.py` → exit 0.
- MUST as live calls (`heavy.py`):
  - `an.whale_pectoral` L160, keyword `style='humpback'` L162, both flanks, before the `detail < 1` return.
  - `an.whale_fluke` L168, always.
  - `an.dorsal_ridge` L173, always.
  - `org.dorsal_mantles` L183, `detail >= 1`.
  - `an.blowhole` L200, `detail >= 1`.
- MUST NOT: AST Call scan found none of `shark_dorsal`, `shark_caudal`, `shark_pectoral`, `squid_arm`, `fin_membrane`, `box`. Grep hits for those names are only the module docstring line 32 (`No kit.box, ...`).
- No manta shield fins: no `fin_membrane`, no second wing pair. Comments only: “not a manta” (L7, L149).
- Fluke horizontal: `anatomy.py` L850–864. Lobes in XZ. Tip Y equals peduncle Y. `chord_dir = (0, 0, 1)`. Not `shark_caudal` (vertical lobes).
- Pectorals long (outline-breaker), `l = 17.0`:
  - Tip X = `l * 0.372` = 6.324 (both-side span 12.648, 74.4% of length).
  - Min 15% of length = 2.55. Span is above that band floor; envelope span band is [10.20, 23.80].
  - Flipper length estimate ≈ 5.41 (`~0.32 * l`). Root chord 1.615, tip chord 0.374, thick 0.204, droop `l * 0.095`, aft `l * 0.255`.
  - `whale_pectoral(..., style='humpback')` uses paddle profile, not blue-whale triangle.
- Scan dump: `out/w106/heavy/verify/ast_scan.py` stdout captured in this session (MUST all present, FORBIDDEN all none).
- Bake: not run (out of scope).
