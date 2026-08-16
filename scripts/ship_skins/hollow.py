# Hollow — surface skin data for vertex-color paint and PBR atlas.
# Deep-rim unclaimed: dark sealed metal hull, dusk-mauve wrap panels,
# desaturated-blue sensor dish treatment, low-intensity buried lantern.
# Object name substrings match built mesh names from build-ship-assets.py.

SKIN = {
    'id': 'hollow',

    # Primary structure — dark sealed hull metal (hull in faction-style).
    # Purple-gray; suggests an environment too cold for bare iron.
    'base': '#4a4054',

    # Secondary / wrap surfaces — dusk-mauve. ROLE_ARMOUR wrap-panel
    # plates carry this (wave-46: trim/wrap must hold the value contrast;
    # dark hull + dark hullDark alone disappear in a band-3 sun).
    'panel': '#7a6a8a',

    # Faction identity — desaturated blue-gray sensor treatment.
    # ROLE_ACCENT listening-dish faces. Colder than the mauve wrap.
    'accent': '#5a6878',

    # Emissive — dim mauve lantern buried inside the superstructure.
    # Very low strength; the Hollow do not advertise their presence.
    'emissive': '#b09ac0',

    # Procedural surface pattern — quiet repeating shutter / louvre motif.
    'pattern': 'shutter',

    # PBR roughness per layer: (base, panel, accent).
    # Sealed hull is rough, wrap panels slightly smoother, sensor face polished.
    'roughness': (0.65, 0.62, 0.55),

    # Panel seam density — moderate; sealed construction minimises visible joints.
    'panel_density': 0.45,

    # Accent coverage — dish-ear family. MUST stay 1.0: values below 1.0
    # blank accent parts at random. Control coverage with geometry count.
    'accent_density': 1.0,

    # Operational wear — sealed and maintained; not pristine but not neglected.
    'wear': 0.30,

    # Lantern output — dim and buried; deliberate concealment aesthetic.
    'emissive_strength': 0.7,

    # Parts receiving panel (dusk-mauve) color — ROLE_ARMOUR wrap-panel
    # plates that drape the watch-hull flanks. Keep the wrap-panel matcher.
    'secondary_parts': ('wrap-panel',),

    # Parts receiving accent (desaturated blue) color — ROLE_ACCENT
    # listening-dish ears. Keep the listening-dish matcher.
    'accent_parts': ('listening-dish',),
}
