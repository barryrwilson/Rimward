import ast
import pathlib

p = pathlib.Path(r"scripts/ship_builders/beautiful/heavy.py")
src = p.read_text(encoding="utf-8")
tree = ast.parse(src)
calls = []
for n in ast.walk(tree):
    if not isinstance(n, ast.Call):
        continue
    f = n.func
    if isinstance(f, ast.Attribute):
        owner = f.value.id if isinstance(f.value, ast.Name) else None
        calls.append((n.lineno, owner, f.attr, n))
    elif isinstance(f, ast.Name):
        calls.append((n.lineno, None, f.id, n))

must = [
    "whale_fluke",
    "whale_pectoral",
    "dorsal_ridge",
    "blowhole",
    "dorsal_mantles",
]
forbid = [
    "shark_dorsal",
    "shark_caudal",
    "shark_pectoral",
    "squid_arm",
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
print("WHALE_PECTORAL KW")
for c in calls:
    if c[2] != "whale_pectoral":
        continue
    n = c[3]
    kws = {}
    for k in n.keywords:
        if k.arg is None:
            continue
        if isinstance(k.value, ast.Constant):
            kws[k.arg] = k.value.value
        else:
            kws[k.arg] = ast.dump(k.value)
    print("  L%s %s" % (c[0], kws))

l = 17.0
b = l * 0.52
h = l * 0.34
print("ENVELOPE", l, b, h)
print("PECTORAL_TIP_X", l * 0.372)
print("PECTORAL_BOTH_SPAN", 2 * l * 0.372)
print("PECTORAL_SPAN_OVER_L", (2 * l * 0.372) / l)
print("MIN_15PCT", 0.15 * l)
print("FLUKE_SPAN", l * 0.34)
print("ROOT_CHORD", l * 0.095)
print("TIP_CHORD", l * 0.022)
print("THICK", l * 0.012)
print("DROOP", l * 0.095)
print("AFT", l * 0.255)
root_x = b * 0.440 - 0.38
dx = l * 0.372 - root_x
dy = l * 0.095
dz = l * 0.255
print("FLIPPER_LEN_EST", (dx * dx + dy * dy + dz * dz) ** 0.5)
