"""Build labelled contact sheets from the harvested reference images.

Each sheet holds 9 tiles in a 3x3 grid. Each tile shows a burned-in index label
(for example `N-012`) so that written observations can point at one exact image.
An index CSV maps every label to its file name, title, and source page.
"""
import csv
import json
import os
import re

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.dirname(HERE)
IMG = os.path.join(BASE, "source-images")
OUT = os.path.join(BASE, "contact-sheets")
os.makedirs(OUT, exist_ok=True)

TILE = 640
COLS, ROWS = 3, 3
PER = COLS * ROWS
BAR = 34


def load_font(size):
    for name in ("arialbd.ttf", "arial.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


FONT = load_font(26)


def manifest(name):
    path = os.path.join(IMG, name)
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def build(prefix, folder, records):
    by_file = {r["file"].split("/")[-1]: r for r in records if r.get("file")}
    files = sorted(f for f in os.listdir(os.path.join(IMG, folder))
                   if f.lower().endswith((".jpg", ".jpeg", ".png")))
    rows = []
    sheet = None
    draw = None
    sheet_no = 0
    for i, fn in enumerate(files):
        slot = i % PER
        if slot == 0:
            sheet_no += 1
            sheet = Image.new("RGB", (COLS * TILE, ROWS * (TILE + BAR)), (16, 16, 18))
            draw = ImageDraw.Draw(sheet)
        label = f"{prefix}-{i + 1:03d}"
        try:
            im = Image.open(os.path.join(IMG, folder, fn)).convert("RGB")
        except Exception:  # noqa: BLE001
            continue
        im.thumbnail((TILE, TILE), Image.LANCZOS)
        cx, cy = slot % COLS, slot // COLS
        ox = cx * TILE + (TILE - im.width) // 2
        oy = cy * (TILE + BAR) + BAR + (TILE - im.height) // 2
        sheet.paste(im, (ox, oy))
        draw.rectangle([cx * TILE, cy * (TILE + BAR), (cx + 1) * TILE - 1,
                        cy * (TILE + BAR) + BAR], fill=(230, 230, 40))
        draw.text((cx * TILE + 8, cy * (TILE + BAR) + 3), label, font=FONT, fill=(10, 10, 10))
        rec = by_file.get(fn, {})
        title = re.sub(r"^File:", "", rec.get("title", "") or os.path.splitext(fn)[0])
        rows.append({"label": label, "sheet": f"{prefix.lower()}-sheet-{sheet_no:02d}.jpg",
                     "file": f"{folder}/{fn}", "title": title[:160],
                     "tag": rec.get("tag", ""), "date": (rec.get("date", "") or "")[:24],
                     "license": rec.get("license", ""), "page": rec.get("page", "")})
        if slot == PER - 1 or i == len(files) - 1:
            sheet.save(os.path.join(OUT, f"{prefix.lower()}-sheet-{sheet_no:02d}.jpg"),
                       quality=86, optimize=True)
    return rows


if __name__ == "__main__":
    meta = (manifest("manifest-nasa.json") + manifest("manifest-commons.json")
            + manifest("manifest-fiction.json") + manifest("manifest-ships.json"))
    rows = build("N", "nasa", meta)
    if os.path.isdir(os.path.join(IMG, "commons")):
        rows += build("C", "commons", meta)
    if os.path.isdir(os.path.join(IMG, "fiction")):
        rows += build("F", "fiction", meta)
    with open(os.path.join(BASE, "source-images", "image-index.csv"), "w",
              newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=["label", "sheet", "file", "title", "tag",
                                           "date", "license", "page"])
        w.writeheader()
        w.writerows(rows)
    print(f"{len(rows)} tiles, {len(set(r['sheet'] for r in rows))} sheets")
