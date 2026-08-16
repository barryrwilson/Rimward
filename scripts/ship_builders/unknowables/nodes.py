"""Unknowables physical knots — energy cells and sync motes (hull channel).

The plate carries a procession of dark glossy ENERGY CELLS along the
centreline: pearls of matter inside the field. Those knots, and the small
white-gold sync motes, are the only solid bodies this faction owns. They
go on the hull list. The field language (filaments, loops, arcs, tip)
lives in field.py.

THE ANCHOR RULE: this module NEVER queries the envelope. Locations and the
procession span arrive from the class file.

PAINT (dual rule — kit role tags AND skin name selectors must agree):
    energy cell   kit.ROLE_ARMOUR  names 'cell-…'     dark glossy #272436
    cell link     kit.ROLE_ARMOUR  names 'cell-link-…' (only if pitch gaps)
    sync mote     kit.ROLE_ACCENT  names 'mote-…'     white-gold #EEE0A8

Size conventions (verified against the ship_kit.py source):
    kit.sphere  scale is RADII per axis
    kit.strut   real radius between two ship-space points
Cells stay CELL_R. A larger field carries MORE cells via CELL_PITCH, never
bigger cells. Consecutive centres stay under 2*CELL_R - CELL_OVERLAP so
the island probe reads one body.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import ship_kit as kit

from . import surface as sf


def procession_zs(z0, z1):
    """Return cell-centre z values from z0 to z1 at overlap-safe pitch.

    Uses the tighter of CELL_PITCH and 2*CELL_R - CELL_OVERLAP - 0.02 so
    consecutive centres stay strictly below 2*CELL_R - 0.10.
    """
    lo, hi = (z0, z1) if z0 <= z1 else (z1, z0)
    span = hi - lo
    if span < 1e-6:
        return [lo]
    pitch = sf.cell_link_pitch()
    if pitch <= 1e-6:
        return [lo, hi]
    gaps = int(math.ceil(span / pitch))
    if gaps < 1:
        gaps = 1
    n = gaps + 1
    return [lo + span * float(i) / float(n - 1) for i in range(n)]


def energy_cell(parts, name, hull_mat, loc, detail=3):
    """One dark glossy sphere of radius CELL_R at ``loc``."""
    if detail >= 2:
        segs = 16
    else:
        segs = 10
    obj = kit.sphere(
        parts, name, kit.ROLE_ARMOUR, loc,
        (sf.CELL_R, sf.CELL_R, sf.CELL_R), hull_mat, segments=segs,
    )
    if obj is None:
        return []
    return [obj]


def cell_procession(parts, name, hull_mat, z0, z1, x, y, detail=3):
    """A line of CELL_R spheres from z0 to z1. More cells, never bigger.

    Pitch is reduced until consecutive cells overlap by more than 0.10.
    If a residual gap still appears, a thin matter thread joins the pair
    (a filament on the hull list, not a keel box).
    """
    zs = procession_zs(z0, z1)
    objs = []
    centres = []
    for i, z in enumerate(zs):
        loc = (x, y, z)
        centres.append(loc)
        objs.extend(
            energy_cell(parts, '%s-%d' % (name, i), hull_mat, loc, detail)
        )
    limit = 2.0 * sf.CELL_R - sf.CELL_OVERLAP
    for i in range(len(centres) - 1):
        a = centres[i]
        b = centres[i + 1]
        dx = b[0] - a[0]
        dy = b[1] - a[1]
        dz = b[2] - a[2]
        dist = math.sqrt(dx * dx + dy * dy + dz * dz)
        if dist < limit:
            continue
        link = kit.strut(
            parts, '%s-link-%d' % (name, i), kit.ROLE_ARMOUR,
            a, b, hull_mat, 0.08, vertices=6,
        )
        if link is not None:
            objs.append(link)
    return objs


def sync_mote(parts, name, hull_mat, loc, detail=3):
    """Small white-gold knot. ROLE_ACCENT. Name prefix ``mote``."""
    if detail >= 2:
        segs = 12
    else:
        segs = 8
    obj = kit.sphere(
        parts, name, kit.ROLE_ACCENT, loc,
        (sf.MOTE_R, sf.MOTE_R, sf.MOTE_R), hull_mat, segments=segs,
    )
    if obj is None:
        return []
    return [obj]
