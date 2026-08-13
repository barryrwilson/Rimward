"""Harvest freely licensed imagery of imagined spacecraft.

Two sources:
  1. Wikimedia Commons - category members and searches for fictional spacecraft,
     studio models, museum props, retro space art, and pulp magazine covers.
  2. Openverse - CC-licensed photographs and artwork, with AI-slop titles filtered out.

Images land in ../source-images/fiction. Metadata lands in manifest-fiction.json.
"""
import json
import os
import re
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
IMG = os.path.join(BASE, "source-images")
OUT = os.path.join(IMG, "fiction")
os.makedirs(OUT, exist_ok=True)

UA = {"User-Agent": "RIMWARD-design-research/1.0 (art reference study)"}
COMMONS = "https://commons.wikimedia.org/w/api.php?"

BAD_TITLE = re.compile(
    r"(logo|signature|stamp|flag|coat of arms|portrait|patch|emblem|insignia|"
    r"cosplay|costume|convention|autograph|book cover|dvd|poster for|"
    r"midjourney|ai[ -]generated|stable diffusion|--ar |dall.?e)", re.I)

CATEGORIES = [
    ("Category:Fictional spacecraft", "fiction"),
    ("Category:Star Trek spacecraft", "fiction"),
    ("Category:Star Wars spacecraft", "fiction"),
    ("Category:Spacecraft in art", "space-art"),
    ("Category:Space colonization art", "space-art"),
    ("Category:Science fiction magazine covers", "pulp"),
    ("Category:Amazing Stories", "pulp"),
    ("Category:Frank R. Paul", "pulp"),
    ("Category:Space art", "space-art"),
    ("Category:Models of spacecraft", "model"),
    ("Category:Spacecraft models in museums", "model"),
    ("Category:Rocket models", "model"),
]

SEARCHES = [
    ("fictional spaceship model museum", "model"),
    ("science fiction film prop spaceship", "model"),
    ("starship model kit", "model"),
    ("retro futurism rocket", "space-art"),
    ("space settlement artwork NASA Ames", "space-art"),
    ("Bonestell painting", "space-art"),
    ("Sokolov space painting", "space-art"),
    ("interstellar spacecraft concept", "concept"),
    ("generation ship concept", "concept"),
    ("nuclear pulse propulsion spacecraft", "concept"),
    ("space habitat artwork", "space-art"),
    ("Buran orbiter", "real-exotic"),
    ("N1 moon rocket", "real-exotic"),
    ("Salyut station model", "real-exotic"),
    ("Tiangong space station", "real-exotic"),
    ("SpaceX Starship vehicle", "real-exotic"),
    ("space tug docking concept", "concept"),
    ("asteroid mining spacecraft", "concept"),
]


def get(url, timeout=45, retries=1, sleep=2):
    last = None
    for i in range(retries + 1):
        try:
            with urllib.request.urlopen(
                    urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return r.read()
        except Exception as exc:  # noqa: BLE001
            last = exc
            time.sleep(sleep * (i + 1))
    raise last


def getj(url):
    return json.loads(get(url))


def slug(s, n=56):
    return (re.sub(r"[^A-Za-z0-9]+", "-", s).strip("-").lower()[:n] or "img")


def imageinfo(titles):
    """Fetch imageinfo for up to 30 file titles."""
    url = COMMONS + urllib.parse.urlencode(
        {"action": "query", "format": "json", "titles": "|".join(titles),
         "prop": "imageinfo", "iiprop": "url|extmetadata|size", "iiurlwidth": "640"})
    d = getj(url)
    return list((d.get("query") or {}).get("pages", {}).values())


def cat_members(cat, limit=60):
    url = COMMONS + urllib.parse.urlencode(
        {"action": "query", "format": "json", "list": "categorymembers",
         "cmtitle": cat, "cmtype": "file", "cmlimit": limit})
    try:
        d = getj(url)
    except Exception as exc:  # noqa: BLE001
        print("  ERR cat", cat, exc, flush=True)
        return []
    return [m["title"] for m in (d.get("query") or {}).get("categorymembers", [])]


def search_titles(term, limit=40):
    url = COMMONS + urllib.parse.urlencode(
        {"action": "query", "format": "json", "list": "search",
         "srsearch": f"filetype:bitmap {term}", "srnamespace": "6", "srlimit": limit})
    try:
        d = getj(url)
    except Exception as exc:  # noqa: BLE001
        print("  ERR search", term, exc, flush=True)
        return []
    return [m["title"] for m in (d.get("query") or {}).get("search", [])]


def take(titles, tag, source_label, keep, records, seen):
    kept = 0
    batch = [t for t in titles if t not in seen and not BAD_TITLE.search(t)]
    for i in range(0, len(batch), 25):
        if kept >= keep:
            break
        try:
            pages = imageinfo(batch[i:i + 25])
        except Exception as exc:  # noqa: BLE001
            print("  ERR info", exc, flush=True)
            continue
        for p in pages:
            if kept >= keep:
                break
            title = p.get("title", "")
            if title in seen:
                continue
            ii = (p.get("imageinfo") or [{}])[0]
            em = ii.get("extmetadata", {})
            lic = (em.get("LicenseShortName", {}) or {}).get("value", "")
            if not lic or "fair" in lic.lower() or "non-free" in lic.lower():
                continue
            url = (ii.get("thumburl") or "").split("?")[0]
            if "/thumb/" not in url:
                continue  # unscaled originals are rate-limited by Wikimedia
            ext = os.path.splitext(urllib.parse.urlparse(url).path)[1].lower()
            if ext not in (".jpg", ".jpeg", ".png"):
                ext = ".jpg"
            fn = re.sub(r"[^A-Za-z0-9._-]", "-", f"{tag}_{slug(title[5:])}{ext}")
            path = os.path.join(OUT, fn)
            seen.add(title)
            if not (os.path.exists(path) and os.path.getsize(path) > 10000):
                try:
                    b = get(url, timeout=90)
                except Exception:  # noqa: BLE001
                    continue
                if len(b) < 12000:
                    continue
                with open(path, "wb") as fh:
                    fh.write(b)
            records.append({
                "source": "commons", "origin": source_label, "title": title, "tag": tag,
                "file": "fiction/" + fn, "url": url, "page": ii.get("descriptionurl"),
                "license": lic,
                "artist": re.sub("<[^>]+>", "", (em.get("Artist", {}) or {}).get("value", "") or "")[:120],
                "date": ((em.get("DateTimeOriginal", {}) or {}).get("value", "") or "")[:32],
                "desc": re.sub(r"<[^>]+>", " ", (em.get("ImageDescription", {}) or {}).get("value", "") or "")[:300]})
            kept += 1
        time.sleep(1.2)
    return kept


def openverse(records, seen):
    kept = 0
    for term in ("spaceship concept art", "starship illustration", "space opera artwork",
                 "retro rocket illustration", "spacecraft painting"):
        url = ("https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(
            {"q": term, "page_size": 20, "license_type": "all-cc", "mature": "false"}))
        try:
            d = getj(url)
        except Exception as exc:  # noqa: BLE001
            print("  ERR openverse", term, exc, flush=True)
            continue
        n = 0
        for r in d.get("results", []):
            if n >= 6:
                break
            title = r.get("title") or ""
            if BAD_TITLE.search(title) or r["url"] in seen:
                continue
            seen.add(r["url"])
            fn = re.sub(r"[^A-Za-z0-9._-]", "-", f"ov_{slug(title)}_{r['id'][:8]}.jpg")
            path = os.path.join(OUT, fn)
            if not (os.path.exists(path) and os.path.getsize(path) > 10000):
                try:
                    b = get(r["url"], timeout=90)
                except Exception:  # noqa: BLE001
                    continue
                if len(b) < 12000:
                    continue
                with open(path, "wb") as fh:
                    fh.write(b)
            records.append({"source": "openverse", "origin": term, "title": title[:160],
                            "tag": "cc-art", "file": "fiction/" + fn, "url": r["url"],
                            "page": r.get("foreign_landing_url"),
                            "license": f"{r.get('license', '')} {r.get('license_version', '')}".strip(),
                            "artist": (r.get("creator") or "")[:120], "date": "", "desc": ""})
            n += 1
            kept += 1
        print(f"  openverse {term:34s} +{n}", flush=True)
        time.sleep(1.5)
    return kept


if __name__ == "__main__":
    records, seen = [], set()
    path = os.path.join(IMG, "manifest-fiction.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            records = json.load(fh)
        seen = {r["title"] for r in records}
    for cat, tag in CATEGORIES:
        k = take(cat_members(cat), tag, cat, 14, records, seen)
        print(f"  {cat:44s} +{k} total={len(records)}", flush=True)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(records, fh, indent=1)
    for term, tag in SEARCHES:
        k = take(search_titles(term), tag, f"search:{term}", 8, records, seen)
        print(f"  search {term:38s} +{k} total={len(records)}", flush=True)
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(records, fh, indent=1)
    openverse(records, seen)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(records, fh, indent=1)
    print("total", len(records))
