# Gilded faction surface-skin data.
# Hull: clean black ceramic.
# Panel: ivory margins on scale courses.
# Accent: limited old-gold articulation at command and weapon structures.
# Emissive: cold turquoise sealed galleries.
# Compatible with Blender bundled Python (no imports, no annotations).

SKIN = {
    'id': 'gilded',

    # Near-black ceramic — the base mass of each overlapping scale body and course.
    'base': '#191B1D',

    # Ivory — exposed margins at the trailing edge of each scale course.
    'panel': '#DED6BC',

    # Old gold — limited articulation: weapon blocks, command citadel.
    'accent': '#C8A444',

    # Cold turquoise — sealed gallery strips and navigation lights.
    'emissive': '#5AB6BB',

    # Pattern slug: overlapping lamellar scale plates.
    'pattern': 'scale',

    # Roughness per channel: (base, panel, accent).
    # Ceramic very smooth; ivory slightly matte; old gold lightly burnished.
    'roughness': (0.20, 0.45, 0.28),

    # Panel density: ivory margins are present but not dominant; clean constraint.
    'panel_density': 0.28,

    # Accent density: gold is sparse and deliberate.
    'accent_density': 0.16,

    # Minimal wear: meticulously maintained surfaces.
    'wear': 0.10,

    # Cold gallery glow reads across distance; moderately strong.
    'emissive_strength': 1.6,

    # Parts receiving panel (ivory) treatment.
    # Matches: ceramic-scale-course.
    # The stacked course boxes expose ivory at their trailing margins.
    'secondary_parts': ('course',),

    # Parts receiving accent (old gold) treatment.
    # Matches: weapon-block, command-citadel.
    # Articulated hard points carry old-gold finish; all other geometry stays black ceramic.
    'accent_parts': ('weapon', 'citadel'),
}
