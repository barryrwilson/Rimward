"""Harvest public-domain / free-licence spaceship reference images.

Sources: NASA Image and Video Library API, Wikimedia Commons API.
Writes images to ../source-images/{nasa,commons} and manifests to ../source-images/*.json.
Re-running is cheap: existing files and manifest entries are reused.
"""
import collections
import json
import os
import re
import ssl
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
IMG = os.path.join(BASE, "source-images")
NASA_DIR = os.path.join(IMG, "nasa")
COMMONS_DIR = os.path.join(IMG, "commons")
for d in (IMG, NASA_DIR, COMMONS_DIR):
    os.makedirs(d, exist_ok=True)

UA = {"User-Agent": "RIMWARD-design-research/1.0 (offline art reference collection)"}
CTX = ssl.create_default_context()


def get(url, timeout=90, retries=4):
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
                return r.read()
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(3 * (i + 1))
    raise last


def getj(url):
    return json.loads(get(url))


def slug(s, n=54):
    s = re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()
    return (s[:n].strip("-") or "img")


# --------------------------------------------------------------------------- NASA
NASA_QUERIES = [
    ("artist concept spacecraft", "concept"), ("spacecraft concept", "concept"),
    ("space station concept", "station"), ("nuclear thermal propulsion", "propulsion"),
    ("nuclear electric propulsion", "propulsion"), ("solar sail", "propulsion"),
    ("ion propulsion", "propulsion"), ("Von Braun space station", "retro"),
    ("space colony art", "habitat"), ("Stanford torus", "habitat"),
    ("Mars transfer vehicle", "interplanetary"), ("crewed Mars mission concept", "interplanetary"),
    ("nuclear rocket engine", "propulsion"), ("orbital transfer vehicle", "tug"),
    ("space tug concept", "tug"), ("lunar lander concept", "lander"),
    ("Skylab", "station"), ("Mir space station", "station"),
    ("International Space Station truss", "station"), ("space shuttle orbiter", "launch"),
    ("Apollo command service module", "capsule"), ("Gateway lunar outpost", "station"),
    ("space telescope deployment", "structure"), ("inflatable habitat", "habitat"),
    ("docking adapter", "docking"), ("radiator panel spacecraft", "thermal"),
    ("solar array deployment", "power"), ("robotic servicing spacecraft", "robotic"),
    ("interstellar probe concept", "deep-space"), ("Dawn spacecraft", "probe"),
    ("Cassini spacecraft", "probe"), ("Juno spacecraft", "probe"),
    ("New Horizons", "probe"), ("Orion spacecraft concept", "capsule"),
    ("space launch system", "launch"), ("space plane concept", "spaceplane"),
]
QUOTA = {"concept": 16, "station": 18, "propulsion": 18, "habitat": 8, "interplanetary": 12,
         "tug": 12, "lander": 8, "retro": 2, "launch": 8, "capsule": 8, "structure": 6,
         "docking": 8, "thermal": 8, "power": 6, "robotic": 8, "deep-space": 3,
         "probe": 14, "spaceplane": 6}


def nasa_score(v):
    t = (v["title"] + " " + v["desc"]).lower()
    s = 0
    for k, w in (("artist", 5), ("concept", 4), ("illustration", 3), ("rendering", 3),
                 ("cutaway", 3), ("mockup", 2), ("design", 1)):
        if k in t:
            s += w
    return s


def harvest_nasa():
    items = {}
    for q, tag in NASA_QUERIES:
        url = "https://images-api.nasa.gov/search?" + urllib.parse.urlencode(
            {"q": q, "media_type": "image"})
        try:
            d = getj(url)
        except Exception as exc:  # noqa: BLE001
            print("  ERR", q, exc, flush=True)
            continue
        for it in d["collection"]["items"][:14]:
            dd = it["data"][0]
            nid = dd["nasa_id"]
            if nid in items:
                continue
            items[nid] = {"source": "nasa", "nasa_id": nid, "title": dd.get("title", ""),
                          "desc": (dd.get("description") or "")[:700],
                          "date": dd.get("date_created", ""), "center": dd.get("center", ""),
                          "keywords": dd.get("keywords", []), "collection": it["href"],
                          "query": q, "tag": tag,
                          "page": f"https://images.nasa.gov/details/{urllib.parse.quote(nid)}",
                          "license": "NASA media usage guidelines (generally public domain)"}
        print(f"  nasa {q:36s} pool={len(items)}", flush=True)
        time.sleep(0.4)

    by_tag = collections.defaultdict(list)
    for v in items.values():
        by_tag[v["tag"]].append(v)
    sel = []
    for tag, lst in by_tag.items():
        lst.sort(key=lambda v: -nasa_score(v))
        sel += lst[:QUOTA.get(tag, 6)]

    def resolve(v):
        try:
            files = getj(v["collection"])
            cand = [f for f in files if re.search(r"\.(jpg|jpeg|png)$", f, re.I)]
            pick = None
            for suf in ("~medium", "~large", "~orig"):
                m = [f for f in cand if suf in f]
                if m:
                    pick = m[0]
                    break
            v["asset"] = pick or (cand[0] if cand else None)
        except Exception as exc:  # noqa: BLE001
            v["asset"] = None
            v["err"] = str(exc)
        return v

    with ThreadPoolExecutor(10) as ex:
        list(ex.map(resolve, sel))

    def dl(v):
        if not v.get("asset"):
            return v
        ext = os.path.splitext(urllib.parse.urlparse(v["asset"]).path)[1].lower() or ".jpg"
        fn = re.sub(r"[^A-Za-z0-9._-]", "-",
                    f"{v['tag']}_{slug(v['title'])}_{v['nasa_id'][:24]}{ext}")
        p = os.path.join(NASA_DIR, fn)
        if os.path.exists(p) and os.path.getsize(p) > 10000:
            v["file"] = "nasa/" + fn
            return v
        try:
            b = get(v["asset"], timeout=120)
            if len(b) > 8000:
                with open(p, "wb") as fh:
                    fh.write(b)
                v["file"] = "nasa/" + fn
        except Exception as exc:  # noqa: BLE001
            v["err"] = str(exc)
        return v

    with ThreadPoolExecutor(8) as ex:
        out = list(ex.map(dl, sel))
    out = [v for v in out if v.get("file")]
    print(f"  nasa downloaded {len(out)}", flush=True)
    return out


# ------------------------------------------------------------------------ COMMONS
COMMONS_TERMS = [
    ("Amazing Stories cover", "pulp"), ("Frank R. Paul", "pulp"),
    ("Wonder Stories cover", "pulp"), ("rocket ship illustration", "pulp"),
    ("Soviet space art", "retro-art"), ("Chesley Bonestell", "retro-art"),
    ("space station 1950s concept", "retro-art"),
    ("Buran spacecraft", "real"), ("N1 rocket", "real"), ("Salyut", "real"),
    ("Almaz", "real"), ("Soyuz spacecraft", "real"), ("Progress spacecraft", "real"),
    ("Shenzhou spacecraft", "real"), ("Tiangong space station", "real"),
    ("Automated Transfer Vehicle", "real"), ("Dragon spacecraft", "real"),
    ("Starship SpaceX", "real"), ("Cygnus spacecraft", "real"),
    ("multi-layer insulation spacecraft", "detail"), ("whipple shield", "detail"),
    ("spacecraft thermal radiator", "detail"), ("space station module cutaway", "detail"),
    ("Project Orion nuclear pulse propulsion", "propulsion"), ("NERVA", "propulsion"),
    ("Bernal sphere", "habitat"), ("O'Neill cylinder", "habitat"), ("Stanford torus", "habitat"),
    ("space elevator concept", "structure"), ("Project Daedalus", "interstellar"),
    ("Bussard ramjet", "interstellar"), ("science fiction spacecraft model", "model"),
    ("spaceship concept art", "concept"), ("space habitat concept art", "concept"),
    ("Kalpana One space settlement", "habitat"), ("nuclear pulse rocket", "propulsion"),
]
PER_TERM = 30
KEEP_PER_TERM = 8
BAD = re.compile(r"(logo|map|graph|chart|diagram of the|signature|stamp|flag|portrait of|"
                 r"patch|emblem|insignia|commemorative)", re.I)


def commons_search(term, limit=PER_TERM):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
        {"action": "query", "format": "json", "generator": "search",
         "gsrsearch": f"filetype:bitmap {term}", "gsrnamespace": "6",
         "gsrlimit": limit, "prop": "imageinfo",
         "iiprop": "url|extmetadata|size", "iiurlwidth": "1400"})
    try:
        d = getj(url)
    except Exception as exc:  # noqa: BLE001
        print("  ERR", term, exc, flush=True)
        return []
    return list((d.get("query") or {}).get("pages", {}).values())


def harvest_commons():
    seen = {}
    out = []
    for term, tag in COMMONS_TERMS:
        rows = commons_search(term)
        kept = 0
        for p in rows:
            if kept >= KEEP_PER_TERM:
                break
            title = p["title"]
            if title in seen or BAD.search(title):
                continue
            ii = (p.get("imageinfo") or [{}])[0]
            em = ii.get("extmetadata", {})
            lic = (em.get("LicenseShortName", {}) or {}).get("value", "")
            if not lic or "fair" in lic.lower() or "non-free" in lic.lower():
                continue
            url = ii.get("thumburl") or ii.get("url")
            if not url:
                continue
            rec = {"source": "commons", "title": title, "tag": tag, "query": term,
                   "url": url, "page": ii.get("descriptionurl"), "license": lic,
                   "artist": re.sub("<[^>]+>", "", (em.get("Artist", {}) or {}).get("value", "") or "")[:120],
                   "date": ((em.get("DateTimeOriginal", {}) or {}).get("value", "") or "")[:40],
                   "desc": re.sub(r"<[^>]+>", " ", (em.get("ImageDescription", {}) or {}).get("value", "") or "")[:400]}
            seen[title] = rec
            fn = re.sub(r"[^A-Za-z0-9._-]", "-", f"{tag}_{slug(title[5:])}")
            ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower()
            if ext not in (".jpg", ".jpeg", ".png"):
                ext = ".jpg"
            fn += ext
            path = os.path.join(COMMONS_DIR, fn)
            if os.path.exists(path) and os.path.getsize(path) > 10000:
                rec["file"] = "commons/" + fn
                out.append(rec)
                kept += 1
                continue
            try:
                b = get(url, timeout=120)
            except Exception as exc:  # noqa: BLE001
                rec["err"] = str(exc)
                continue
            if len(b) < 8000:
                continue
            with open(path, "wb") as fh:
                fh.write(b)
            rec["file"] = "commons/" + fn
            out.append(rec)
            kept += 1
        print(f"  commons {term:36s} +{kept} total={len(out)}", flush=True)
        time.sleep(2.0)
    return out


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    manifest = []
    if which in ("all", "nasa"):
        manifest += harvest_nasa()
        with open(os.path.join(IMG, "manifest-nasa.json"), "w", encoding="utf-8") as fh:
            json.dump(manifest, fh, indent=1)
    if which in ("all", "commons"):
        c = harvest_commons()
        with open(os.path.join(IMG, "manifest-commons.json"), "w", encoding="utf-8") as fh:
            json.dump(c, fh, indent=1)
    print("done")
