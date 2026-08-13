# SpaceShipIdeas — spaceship design reference corpus

Purpose: understand how people imagine spaceships, so that RIMWARD can build better original
models. This is not a copy library. Every entry answers one question: *why does this shape
read as a spaceship, and as this kind of spaceship?*

Accessed and assembled: 2026-08-12

---

## Corpus size

| Part | Count | Kind |
|---|---:|---|
| Local reference images (downloaded, free licence) | 238 | NASA artist concepts, 1970s Marshall Space Flight Center paintings, station and probe hardware, pulp magazine covers, Soviet space art, museum models |
| Fictional ship renders viewed by URL | 97 | Star Wars, Star Trek, The Expanse, Battlestar Galactica, Halo, Mass Effect, Elite Dangerous, EVE Online, Homeworld, Star Citizen, Babylon 5, Stargate, Firefly, Alien, Warhammer 40 000, Gundam, Macross, Cowboy Bebop, Farscape, Dune, No Man's Sky, Starfield and more |
| Lead-pass ship studies (viewed full size, one by one) | 16 | The strongest role references |
| Sourced link surveys | 5 files, 174 verified links | Film and TV, games, illustration, engineering, non-Western and organic traditions |
| Local disk use | 80 MB | `source-images/` |

Every image in `source-images/` is NASA public domain or a free Wikimedia Commons licence.
Fictional ships are referenced by URL only and are never copied into the repository.

## Where to start

1. `synthesis/20-cross-cutting-design-rules.md` — the distilled rules. Read this first.
2. `synthesis/21-rimward-gap-analysis.md` — what the current faction art misses, and the build order.
3. `catalog/16-visual-catalog-supplement.md` — sixteen deep ship studies with numbers.

## Layout

```
SpaceShipIdeas/
  README.md                  this file
  synthesis/                 distilled rules and the RIMWARD build plan
    20-cross-cutting-design-rules.md
    21-rimward-gap-analysis.md
  catalog/                   per-image visual analysis (what we saw)
    01-local-nasa-sheets-1-7.md          NASA sheets, labels N-001..N-063
    02-local-nasa-sheets-8-13.md         NASA sheets, labels N-064..N-116
    03-local-pulp-and-fiction-sheets.md  pulp covers, Soviet art, museum models
    10..15-visual-catalog-a..f.md        97 fictional ships, indices 0-96
    16-visual-catalog-supplement.md      16 lead-pass studies
  research/                  sourced link surveys with design analysis
    01-film-tv-lineages.md
    02-game-ship-design.md
    03-illustration-and-concept-artists.md
    04-engineering-plausibility.md
    05-anime-organic-and-outsider-traditions.md
  contact-sheets/            3x3 labelled grids of every local image
  source-images/             the images, manifests, and the index
    nasa/ commons/ fiction/ _rejected/
    image-index.csv          label -> file, title, licence, source page
    fiction-urls.json        97 fictional ship image URLs with source pages
    manifest-*.json          harvest metadata
    curation-log.txt         what was rejected and why
  _tools/                    the scripts that built the corpus
    harvest.py               NASA and Wikimedia Commons harvest
    harvest_fiction.py       Commons categories for fictional and model imagery
    curate.py                removes press photos, duplicates, and off-topic files
    contact_sheets.py        builds the labelled contact sheets and the index
```

## How to read a catalog entry

Each entry records what the image shows, in this order: silhouette family, proportion ratio,
volume breakdown by percentage, detail hierarchy, surface and colour, light language,
function reads, scale cues, and one transferable modelling instruction tagged with a
RIMWARD class key or faction key.

Labels such as `N-105`, `C-018`, or `F-024` point at one tile on one contact sheet.
Look the label up in `source-images/image-index.csv` to get the file, the title, the licence,
and the source page.

## Reproduce or extend

```
cd _tools
python harvest.py all        # refresh NASA and Commons images
python harvest_fiction.py    # refresh fictional and model imagery
python curate.py             # drop press photos, duplicates, off-topic files
python contact_sheets.py     # rebuild sheets and image-index.csv
```

The harvest scripts request standard Wikimedia thumbnail widths. Do not raise the width above
the original size, because Wikimedia rate-limits unscaled originals.

## Licence and use

- NASA images: NASA media usage guidelines, generally public domain.
- Wikimedia Commons images: the licence for each file is recorded in `image-index.csv`.
- Fictional ships: studied by link only. Do not copy those images into the repository, and do not
  copy those designs into RIMWARD models. Use the extracted rules, not the shapes.
