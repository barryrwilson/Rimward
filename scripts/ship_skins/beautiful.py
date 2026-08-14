# Beautiful faction surface-skin data.
# Hull: pearl-indigo living tissue.
# Panel: subsurface bio-luminescent membrane (lighter indigo, pearlescent).
# Accent: deep violet nerve channels running through fins and sensory crown.
# Emissive: restrained cyan bioluminescent pulse along nerve line.
# Compatible with Blender bundled Python (no imports, no annotations).
# No manufactured-panel or metal semantics in part selectors.

SKIN = {
    'id': 'beautiful',

    # Deep indigo — primary living tissue surface, the outer dermal layer.
    'base': '#6B617B',

    # Pearl indigo — subsurface membrane visible at fin edges and body transitions.
    # Biological layering; not a manufactured panel.
    'panel': '#B0A8BE',

    # Violet — nerve channel pigmentation in fins and sensory structures.
    'accent': '#7850D4',

    # Bioluminescent cyan — the restrained pulse carried by the nerve line.
    'emissive': '#69D8E2',

    # Pattern slug: branching anatomical growth topology.
    'pattern': 'growth',

    # Roughness per channel: (base, panel, accent).
    # Outer tissue organically textured; subsurface membrane slightly rougher;
    # nerve channels smooth.
    'roughness': (0.38, 0.44, 0.26),

    # Panel density: anatomical layering is rich and continuous.
    'panel_density': 0.60,

    # Accent density: 1.0 — values below 1.0 blank accent runs at random
    # (pipeline §6); nerve coverage is controlled with geometry instead.
    'accent_density': 1.0,

    # Near-zero wear: biological self-repair; surfaces appear freshly grown.
    'wear': 0.06,

    # Bioluminescent pulse: present and alive, not engineered light.
    'emissive_strength': 2.0,

    # Parts receiving panel (subsurface membrane) treatment.
    # Matches: living-body, manta-fin.
    # These organic volumes reveal the pearlescent underlayer at transitions.
    'secondary_parts': ('living', 'fin'),

    # Parts receiving accent (violet nerve channel) treatment.
    # Matches: nerve-line, sensory-crown.
    # Biological nerve paths only; no manufactured geometry selectors.
    'accent_parts': ('nerve', 'sensory', 'crown'),
}
