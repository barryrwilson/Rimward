"""Read-only AST scan of beautiful/cutter.py. Not a bake."""
import ast
import pathlib

p = pathlib.Path(r"scripts/ship_builders/beautiful/cutter.py")
src = p.read_text(encoding="utf-8")
tree = ast.parse(src)
calls = []
for n in ast.walk(tree):
    if not isinstance(n, ast.Call):
        continue
    f = n.func
    if isinstance(f, ast.Attribute):
        owner = f.value.id if isinstance(f.value, ast.Name) else None
        calls.append((n.lineno, owner, f.attr))
    elif isinstance(f, ast.Name):
        calls.append((n.lineno, None, f.id))

must = [
    "shark_dorsal",
    "shark_caudal",
    "shark_pectoral",
    "gill_slits",
    "belly_chamber",
]
forbid = [
    "squid_mantle_fins",
    "octopus_arm",
    "whale_fluke",
    "fin_membrane",
    "box",
]
print("MUST CALLS")
for m in must:
    hits = [(c[0], c[1], c[2]) for c in calls if c[2] == m]
    print("  %s: %s" % (m, hits if hits else "MISSING"))
print("FORBIDDEN CALLS")
for m in forbid:
    hits = [(c[0], c[1], c[2]) for c in calls if c[2] == m]
    print("  %s: %s" % (m, hits if hits else "none"))
print("ATTRIBUTE CALLS")
for c in sorted(calls, key=lambda x: x[0]):
    if c[1] in ("an", "org", "sf", "kit"):
        print("  L%s %s.%s" % (c[0], c[1], c[2]))

l = 11.0
b = l * 0.48
h = l * 0.30
foil_hw = b * 0.520
thorax_hw = b * 0.298
neck_hw = b * 0.228
foil_hh = h * 0.100
thorax_hh = h * 0.286
extra_brow = 2.0 * (foil_hw - thorax_hw)
print("ENVELOPE", l, b, h)
print("FOIL_Z", l * -0.418)
print("FOIL_HALF_W", foil_hw)
print("FOIL_BEAM", foil_hw * 2.0)
print("FOIL_HALF_H", foil_hh)
print("NECK_HALF_W", neck_hw)
print("THORAX_HALF_W", thorax_hw)
print("THORAX_BEAM", thorax_hw * 2.0)
print("THORAX_HALF_H", thorax_hh)
print("EXTRA_BROW_BEAM", extra_brow)
print("EXTRA_OVER_L", extra_brow / l)
print("MIN_15PCT", 0.15 * l)
print("FOIL_Z_SPAN", l * (-0.352 - -0.478))
print("HULL_Z_SPAN", l * (0.462 - -0.478))
print("FOIL_FRAC_OF_HULL_Z", (-0.352 - -0.478) / (0.462 - -0.478))
