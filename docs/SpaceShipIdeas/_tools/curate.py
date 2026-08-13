"""Curate the harvested reference images.

Removes three classes of noise:
  1. Press and event photography (people, podiums, forklifts, cleanroom crews).
  2. Near-duplicate frames (perceptual hash distance <= 6).
  3. Very small or very low-contrast files.

Rejected files move to ../source-images/_rejected so nothing is lost.
"""
import json
import os
import re
import shutil

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
IMG = os.path.join(BASE, "source-images")
REJECT = os.path.join(IMG, "_rejected")
os.makedirs(REJECT, exist_ok=True)

PEOPLE = re.compile(
    r"(administrator|deputy|speaks|panel|forum|briefing|news conference|press conference|"
    r"ceremony|award|audience|podium|attendees|visitors|students|interview|"
    r"technicians|engineers work|workers|employees|team members|crew members pose|"
    r"forklift|unload|arrives at|is offloaded|delivered to|media day|"
    r"scitech|symposium|meeting|signing|tour of|visit to|graduat|"
    r"portrait|headshot|group photo|ribbon)", re.I)

TOPIC_OK = re.compile(
    r"(concept|illustration|artist|render|cutaway|diagram|configuration|"
    r"spacecraft|vehicle|station|module|lander|orbiter|probe|rocket|engine|"
    r"habitat|truss|solar array|radiator|docking|tug|sail|shuttle|capsule|"
    r"rover|satellite|telescope|ship|starship|colony|torus)", re.I)


def ahash(path, size=10):
    im = Image.open(path).convert("L").resize((size, size), Image.LANCZOS)
    px = list(im.getdata())
    avg = sum(px) / len(px)
    bits = 0
    for i, p in enumerate(px):
        if p >= avg:
            bits |= 1 << i
    return bits


def popcount(x):
    return bin(x).count("1")


def load_manifests():
    meta = {}
    for name in ("manifest-nasa.json", "manifest-commons.json", "manifest-fiction.json",
                 "manifest-ships.json"):
        p = os.path.join(IMG, name)
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8") as fh:
            for r in json.load(fh):
                if r.get("file"):
                    meta[r["file"].split("/")[-1]] = r
    return meta


def main():
    meta = load_manifests()
    kept, dropped = [], []
    hashes = []
    for folder in ("nasa", "commons", "fiction"):
        d = os.path.join(IMG, folder)
        if not os.path.isdir(d):
            continue
        for fn in sorted(os.listdir(d)):
            if not fn.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            path = os.path.join(d, fn)
            rec = meta.get(fn, {})
            text = " ".join([rec.get("title", ""), rec.get("desc", ""), fn])
            reason = None
            if PEOPLE.search(text):
                reason = "press/people"
            elif folder != "fiction" and not TOPIC_OK.search(text):
                reason = "off-topic"
            if reason is None:
                try:
                    h = ahash(path)
                    w, ht = Image.open(path).size
                except Exception:  # noqa: BLE001
                    reason = "unreadable"
                    h = None
                if reason is None:
                    if w < 400 or ht < 300:
                        reason = "too small"
                    else:
                        for prev, pf in hashes:
                            if popcount(prev ^ h) <= 6:
                                reason = f"duplicate of {pf}"
                                break
                    if reason is None:
                        hashes.append((h, fn))
            if reason:
                dropped.append((f"{folder}/{fn}", reason))
                shutil.move(path, os.path.join(REJECT, fn))
            else:
                kept.append(f"{folder}/{fn}")
    print(f"kept {len(kept)}  dropped {len(dropped)}")
    with open(os.path.join(IMG, "curation-log.txt"), "w", encoding="utf-8") as fh:
        for f, r in dropped:
            fh.write(f"{f}\t{r}\n")


if __name__ == "__main__":
    main()
