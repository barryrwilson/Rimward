# Gilded faction surface-skin data.
# Hull: clean black ceramic.
# Panel: ivory margins on scale courses.
# Accent: limited old-gold articulation at command and weapon structures.
# Emissive: cold turquoise sealed galleries.
# Compatible with Blender bundled Python (no imports, no annotations).

SKIN = {
    'id': 'gilded',

    # Near-black ceramic — the base mass of every scale, course and shell body.
    # Was #191B1D, which the wave-7 render could not carry: at 10 % luminance
    # the stepped scale courses, the collar ribs and the vault seams all
    # collapsed into one black mass and the sculpt read as a smooth lozenge.
    # #23272A is still near-black (14 %) and still refuses the Ledger's dirt,
    # but the lamellar steps and the recess wells now separate under the
    # engine's lighting. Judged from ship-render.mjs and the Models Browser,
    # never from the hex.
    'base': '#23272A',

    # Ivory — the large forward-flank two-tone region and the leading edges.
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

    # Accent density: 1.0, and that is deliberate. This number thins the ACCENT
    # POOL by count — an unselected accent part is repainted with `base` — so any
    # value below 1.0 silently blanks whole gold hairlines at random. Wave 7
    # authors gold as ROLE_ACCENT hairline struts, rings and ribs, ~0.022 units
    # thick, so the 3-8 % accent-area cap (cross-cutting rule 8) and bible §4.5's
    # ban on gaudy gold coverage are delivered by GEOMETRY, not by thinning.
    'accent_density': 1.0,

    # Minimal wear: meticulously maintained surfaces.
    'wear': 0.10,

    # Cold gallery glow reads across distance; moderately strong.
    'emissive_strength': 1.6,

    # ROLE_TRIM multiplier on `panel`. The default 1.12 lifted the gallery
    # lips, deck edging and bay rims to #F9F0D2, and in the Models Browser
    # those hairline strips blew out to pure white against a near-black shell —
    # they read as painted highlights, not as the polished edge of a ceramic
    # plate. 0.94 puts trim a shade UNDER the ivory region so the big two-tone
    # stays the brightest thing on the hull, which is what bible §4.5 asks for.
    'trim_mult': 0.94,

    # No substring part pools. Every part the gilded pilot modules emit carries
    # an explicit skin_role (hull / armour / accent / trim / recess, plus glow),
    # and paint_parts_vc only consults secondary_parts / accent_parts for
    # UNTAGGED parts. The old ('course',) / ('weapon', 'citadel') pools were
    # written for the retired procedural sculpt and matched nothing in this
    # fleet, so they are gone rather than left as decoration.
}
