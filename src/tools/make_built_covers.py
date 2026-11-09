"""Covers for the "Built on my own" cards (assets/img/cover-luys|emlagoo|haftkhan|safhegardan.webp).

Each cover is designed in HTML in covers/ (800 x 600, real screens from assets/img/built/) and rendered
at 2x with WebKit by snap.swift, then saved as WebP.

    swiftc -O snap.swift -o /tmp/snap
    python3 make_built_assets.py ~/Documents      # the screens the covers use
    python3 make_built_covers.py /tmp/snap
"""
import os
import subprocess
import sys
import tempfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.abspath(os.path.join(HERE, "..", "..", "assets", "img"))

if __name__ == "__main__":
    snap = sys.argv[1] if len(sys.argv) > 1 else "/tmp/snap"
    for name in ("luys", "emlagoo", "haftkhan", "safhegardan"):
        with tempfile.TemporaryDirectory() as tmp:
            png = os.path.join(tmp, name + ".png")
            subprocess.run([snap, os.path.join(HERE, "covers", name + ".html"), png, "800", "600", "2"], check=True,
                           stdout=subprocess.DEVNULL)
            Image.open(png).convert("RGB").save(os.path.join(IMG, f"cover-{name}.webp"), "WEBP", quality=86, method=6)
        print(f"cover-{name}.webp")
