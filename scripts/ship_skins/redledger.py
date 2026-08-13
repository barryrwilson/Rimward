# Red Ledger faction surface-skin data.
# Hull: dark iron captured hardware.
# Panel: tarnished-copper transfer interfaces.
# Accent: organized dried-red tally marks.
# Emissive: amber work lights.
# Compatible with Blender bundled Python (no imports, no annotations).

SKIN = {
    'id': 'redledger',

    # Dark iron — base hull plates welded from seized hardware.
    'base': '#242226',

    # Tarnished copper — transfer collars, grapple mechanisms, adapted interfaces.
    'panel': '#7B5C3A',

    # Dried red — scored tally marks, boarding spike, prize-count scratches.
    'accent': '#8C2E22',

    # Amber — functional work lights, no decorative intent.
    'emissive': '#C47828',

    # Pattern slug: repeating short-stroke tally runs.
    'pattern': 'tally',

    # Roughness per channel: (base, panel, accent).
    # Iron hull very rough; tarnished copper moderately rough; scored accent slightly rough.
    'roughness': (0.76, 0.62, 0.70),

    # Panel density: organized copper runs at seams and transfer points, not saturating.
    'panel_density': 0.50,

    # Accent density: tally marks discrete, confined to prize-logging surfaces.
    'accent_density': 0.30,

    # Heavy wear: captured and re-welded hardware shows its full service history.
    'wear': 0.74,

    # Amber work lights are functional; moderate output.
    'emissive_strength': 1.1,

    # Parts receiving panel (tarnished copper) treatment.
    # Matches: transfer-collar, transfer-bay, grapple-arm.
    # These are the adaptation interfaces and captured appendages.
    'secondary_parts': ('transfer', 'grapple'),

    # Parts receiving accent (dried red) treatment.
    # Matches: boarding-spike.
    # The forward spike carries the tally scoring of successful boardings.
    'accent_parts': ('boarding', 'spike'),
}
