# Unknowables faction surface-skin data.
# Hull: sparse dark matter of the energy cells.
# Panel: dark glossy cell body (pearls of matter).
# Accent: white-gold sync motes.
# Emissive: cyan lace, loops and the travel tip.
# Compatible with Blender bundled Python (no imports, no annotations).
# Name prefixes match the foundation emits: cell, mote, loop, lace, tip, arc.

SKIN = {
    'id': 'unknowables',

    # Sparse dark field-matter — the void the lace sits in.
    'base': '#1e2024',

    # Dark glossy cell body — pearls of matter on the centreline.
    'panel': '#272436',

    # White-gold — sync motes only.
    'accent': '#EEE0A8',

    # Electric cyan — filaments aft, loops, lensing arcs, travel tip.
    'emissive': '#81DDF2',

    # Pattern slug: ordered lace, not plated courses.
    'pattern': 'ordered_field',

    # Roughness per channel: (base, panel, accent).
    # Field-matter and cells are glossy; white-gold motes are smoother still.
    'roughness': (0.14, 0.12, 0.10),

    # Panel density: cells are sparse knots, not a plated hull.
    'panel_density': 0.18,

    # Accent density: 1.0 — values below 1.0 blank accent runs at random
    # (pipeline §6); mote coverage is controlled with geometry instead.
    'accent_density': 1.0,

    # Near-zero wear: an energy configuration does not weather.
    'wear': 0.04,

    # Field glow must read at range.
    'emissive_strength': 2.5,

    # Parts receiving panel (dark glossy cell) treatment.
    # Matches: cell, cell-0, cell-link-0.
    'secondary_parts': ('cell',),

    # Parts receiving accent (white-gold mote) treatment.
    # Matches: mote, mote-sync.
    'accent_parts': ('mote',),
}
