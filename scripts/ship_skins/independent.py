# Independent (Drifters) — surface skin data for vertex-color paint and PBR atlas.
# Neutral commercial gray hull, controlled secondhand panel families,
# one small owner accent piece, warm amber navigation lamp.
# Object name substrings match built mesh names from build-ship-assets.py.

SKIN = {
    'id': 'independent',

    # Primary structure — neutral commercial gray; anonymous, unremarkable.
    'base': '#6a7076',

    # Secondary / panel family — deeper charcoal-gray for recessed secondhand plates.
    # The density is high to reflect a patchwork of sourced components.
    'panel': '#3a3f45',

    # Faction identity — muted slate-blue owner accent (accent in faction-style).
    # Applied to a single secondhand module; keeps personal expression minimal.
    'accent': '#9aa7b8',

    # Emissive — warm amber navigation lamp (glow in faction-style).
    'emissive': '#ffa54a',

    # Procedural surface pattern — mismatched panel seams from different sources.
    'pattern': 'panel-patch',

    # PBR roughness per layer: (base, panel, accent).
    # Even surface across all layers — everything is worn to a similar finish.
    'roughness': (0.60, 0.68, 0.58),

    # Panel seam density — high; secondhand ships show every joint and plate edge.
    'panel_density': 0.65,

    # Accent coverage — one owner mark. Must stay 1.0: values below 1.0
    # blank accent parts at random. Control coverage with geometry count.
    'accent_density': 1.0,

    # Operational wear — independent haulers are well-used; wear is visible.
    'wear': 0.55,

    # Nav lamp output — warm but unassuming; compliant running light, nothing more.
    'emissive_strength': 1.2,

    # Parts receiving panel (dark charcoal) color — secondhand plates and
    # standardized crates. Roles are also set via skin_role.
    'secondary_parts': (
        'patch-plate', 'iso-crate', 'crate-rack', 'civilian-cabin',
        'tug-core', 'mission-pod', 'tug-vent',
    ),

    # Parts receiving accent (slate-blue) color — the single owner-marked
    # secondhand module. One shape family.
    'accent_parts': ('owner-module',),
}
