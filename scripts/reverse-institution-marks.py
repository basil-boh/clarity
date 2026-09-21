#!/usr/bin/env python3
"""
Rebuild the reversed SGH and SingHealth marks in `assets/brand/`.

    python3 scripts/reverse-institution-marks.py     # needs rsvg-convert + Pillow

These are DERIVED from the official colour artwork, not artwork issued by either
brand team. Replace them with official reversed lockups when those are
available; see `assets/brand/README.md`.

**Symbols keep their brand colour; only the type reverses to white.** SGH's
green and SingHealth's orange are untouched — what changes is the near-black
wordmark under each, which is what disappears against `palette.night`.

SingHealth's logo is raster, so it is separated by saturation: chromatic pixels
(the swoosh) keep their colour, achromatic ones (the wordmark and tagline) go
white, alpha untouched so the anti-aliasing survives.

The SGH lockup is layered rather than flat, and that is the whole difficulty:

    1. a solid green rounded square
    2. a solid WHITE square on top, leaving the green showing only as a frame
    3. the "sgh" monogram, in green, over that
    4. the wordmark, in near-black

Recolouring fills in place cannot make layer 2 transparent: drop it and layer 1
becomes a solid green blob that swallows the monogram. So the layers are
rendered separately and recombined —

    frame = outer square - inner square,  then monogram and wordmark over it

— which turns what was white-on-green into genuine transparency, so the mark
sits on any ground rather than only on the one it was composited against.

Set FAITHFUL = True to keep that inner square white instead, which reproduces
the symbol exactly as drawn, at the cost of a small white chip on the panel.
"""

import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "assets" / "brand"

# English Wikipedia hosts both as non-free files. See the README on permission.
SOURCES = {
    "sgh.svg": "https://upload.wikimedia.org/wikipedia/en/7/7e/Logo_of_Singapore_General_Hospital.svg",
    "singhealth.png": "https://upload.wikimedia.org/wikipedia/en/7/78/SingHealth_Logo.png",
}

GREEN, BLACK, WHITE = "#00a760", "#231f20", "#ffffff"
PATH = re.compile(r'<path\b[^>]*?style="fill:(#[0-9a-fA-F]{6})"[^>]*?/>', re.S)

FAITHFUL = False
# Chroma below this counts as "type" rather than "symbol". SingHealth's black is
# about 4; its orange is about 200, so the threshold is nowhere near either.
CHROMA_FLOOR = 40

# 3x the boxes in `institution.tsx`, so neither asset is ever upscaled.
SGH_OUT = (294, 88)
SINGHEALTH_OUT = (180, 139)


def fetch(work: Path) -> None:
    for name, url in SOURCES.items():
        request = urllib.request.Request(url, headers={"User-Agent": "colonaid-brand-assets/1.0"})
        with urllib.request.urlopen(request, timeout=30) as response:
            (work / name).write_bytes(response.read())
        print(f"fetched {name}")


def reverse_sgh(work: Path) -> Image.Image:
    raw = (work / "sgh.svg").read_text()
    hits = [(m.start(), m.end(), m.group(1).lower()) for m in PATH.finditer(raw)]
    if not hits:
        sys.exit("No styled paths found — the upstream SVG changed; look at it before trusting this.")
    white_at = next(i for i, h in enumerate(hits) if h[2] == WHITE)
    groups = {
        "outer": [i for i, h in enumerate(hits) if h[2] == GREEN and i < white_at],
        "inner": [white_at],
        "mono": [i for i, h in enumerate(hits) if h[2] == GREEN and i > white_at],
        "word": [i for i, h in enumerate(hits) if h[2] == BLACK],
    }
    print("  layers:", {k: len(v) for k, v in groups.items()})

    def render(colours: dict[str, str | None], name: str, width: int = 1600) -> Image.Image:
        lookup = {i: colours.get(grp) for grp, idxs in groups.items() for i in idxs}
        out, last = [], 0
        for i, (a, b, _) in enumerate(hits):
            out.append(raw[last:a])
            fill = lookup.get(i)
            out.append(re.sub(r'style="fill:#[0-9a-fA-F]{6}"',
                              f'style="fill:{fill}"' if fill else 'style="fill:none"', raw[a:b]))
            last = b
        out.append(raw[last:])
        svg, png = work / f"{name}.svg", work / f"{name}.png"
        svg.write_text("".join(out))
        subprocess.run(["rsvg-convert", "-w", str(width), "-o", png, svg], check=True)
        return Image.open(png).convert("RGBA")

    if FAITHFUL:
        return render({"outer": GREEN, "inner": WHITE, "mono": GREEN, "word": WHITE}, "faithful")

    outer = render({"outer": GREEN}, "outer")
    inner = render({"inner": WHITE}, "inner").split()[3]
    frame = Image.merge("RGBA", outer.split()[:3] + (ImageChops.subtract(outer.split()[3], inner),))
    over = Image.alpha_composite(render({"mono": GREEN}, "mono"), render({"word": WHITE}, "word"))
    return Image.alpha_composite(frame, over)


def reverse_singhealth(work: Path) -> Image.Image:
    img = Image.open(work / "singhealth.png").convert("RGBA")
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a and max(r, g, b) - min(r, g, b) < CHROMA_FLOOR:
                px[x, y] = (255, 255, 255, a)
    return img


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        fetch(work)
        reverse_sgh(work).resize(SGH_OUT, Image.LANCZOS).save(DEST / "sgh.png")
        reverse_singhealth(work).resize(SINGHEALTH_OUT, Image.LANCZOS).save(DEST / "singhealth.png")
    for name in ("sgh.png", "singhealth.png"):
        print(f"{name:<16} {Image.open(DEST / name).size}")


if __name__ == "__main__":
    main()
