# Lamplighter Guild — surface skin data for vertex-color paint and PBR atlas.
# Infrastructure guild: soot-dark service frame, utility-yellow access modules,
# cobalt diagnostic relay surfaces, practical warm work lamps.
# Object name substrings match built mesh names from build-ship-assets.py.

SKIN = {
    'id': 'lamplighter',

    # Primary structure — soot-dark industrial frame.
    'base': '#24211c',

    # Secondary / diagnostic surfaces — cobalt blue (patch[1] in faction-style).
    # Painted onto relay masts to read as functional diagnostic hardware.
    'panel': '#5a8ae0',

    # Faction identity — utility yellow (trim in faction-style).
    # Applied to access and utility modules flanking the service frame.
    'accent': '#d8a83a',

    # Emissive — warm amber work-lamp glow (glow/beacon in faction-style).
    'emissive': '#ffc06a',

    # Procedural surface pattern — repeating utility grid suits infrastructure work.
    'pattern': 'utility-grid',

    # PBR roughness per layer: (base, panel, accent).
    # Gritty frame, smooth diagnostic plating, matte utility paint.
    'roughness': (0.60, 0.52, 0.58),

    # Panel seam density — moderate; working ships show structure but not chaos.
    'panel_density': 0.55,

    # Accent coverage — yellow is identity; control it with geometry count,
    # never by random thinning.
    'accent_density': 1.0,

    # Operational wear — field-deployed guild ships carry honest service marks.
    'wear': 0.42,

    # Lamp output — practical warm brightness, not decorative.
    'emissive_strength': 1.4,

    # Parts receiving panel (cobalt) color — diagnostic interiors and columns.
    'secondary_parts': (
        'relay-mast', 'diag-panel', 'workshop-core', 'beacon-rack',
    ),

    # Parts receiving accent (utility yellow) color — access and service gear.
    'accent_parts': (
        'utility-module', 'work-lamp', 'lamp-bar', 'clamp-jaw', 'gantry-deck',
    ),
}
