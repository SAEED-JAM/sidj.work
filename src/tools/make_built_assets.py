"""Copies and shrinks the pictures for the four "Built on my own" pages into assets/img/built/<slug>/.

    python3 make_built_assets.py ~/Documents

Reads each product's own repo (LuysMap, DikteGoo, HaftKhan, SafheGardan). Still images become WebP
at a sensible width; Haft Khan's animated character sprites and medals are copied as they are.
Needs Pillow.
"""
import os
import shutil
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "..", "assets", "img", "built"))


def still(src, slug, name, w):
    os.makedirs(os.path.join(OUT, slug), exist_ok=True)
    im = Image.open(src)
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") and "transparency" in im.info or im.mode == "RGBA" else "RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, slug, name + ".webp"), "WEBP", quality=84, method=6)


def copy(src, slug, name):
    os.makedirs(os.path.join(OUT, slug), exist_ok=True)
    shutil.copyfile(src, os.path.join(OUT, slug, name))


def main(root):
    lm, em, hk, sg = (os.path.join(root, d) for d in ("LuysMap", "DikteGoo", "HaftKhan", "SafheGardan"))
    for n in ("home", "detail", "insights"):
        still(f"{lm}/design/shots/{n}-en.png", "luys-map", n, 600)
    for lang in ("hy", "ru", "fa"):
        still(f"{lm}/design/shots/home-{lang}.png", "luys-map", f"home-{lang}", 480)
    still(f"{lm}/design/heat-tour/city-en.png", "luys-map", "heat-city", 1100)
    still(f"{lm}/design/heat-tour/street-en.png", "luys-map", "heat-street", 800)

    for n in ("01-welcome", "02-lessons", "03-setup", "04-dictate", "05-word-tap", "07-done"):
        still(f"{em}/design/assets/store/screens-raw/{n}.jpg", "emlagoo", n, 600)
    still(f"{em}/design/assets/store/icon-512.png", "emlagoo", "icon", 256)

    a = f"{hk}/site/assets"
    still(f"{a}/keyart.webp", "haftkhan", "keyart", 1600)
    still(f"{a}/map_journey.webp", "haftkhan", "journey", 2200)
    still(f"{a}/island_hero.webp", "haftkhan", "island", 1600)
    for n in ("0_title", "0_dialogue0", "00_menu", "13_play", "60_play"):
        still(f"{hk}/Screenshots/{n}.png", "haftkhan", n.lstrip("0_") or n, 1400)
    copy(f"{a}/logo_en.webp", "haftkhan", "logo.webp")
    for n in ("rostam", "rakhsh", "lion", "dragon", "witch", "olad", "arzhang", "whitediv", "kavus"):
        copy(f"{a}/anim/{n}.webp", "haftkhan", f"anim-{n}.webp")
    for f in sorted(os.listdir(a)):
        if f.startswith("ach_"):
            copy(f"{a}/{f}", "haftkhan", f.replace("_", "-"))

    o = f"{sg}/tools/out"
    for n in ("landscape-04-deck", "landscape-02-crates-canvas-only", "landscape-05-studio", "landscape-06-shop"):
        still(f"{o}/{n}.png", "safhegardan", n.replace("landscape-", "l-"), 1400)
    for n in ("portrait-01-crates", "portrait-04-deck", "portrait-05-studio", "android-04-deck"):
        still(f"{o}/{n}.png", "safhegardan", n.replace("portrait-", "p-").replace("android-", "dark-"), 560)
    print("done:", OUT)


if __name__ == "__main__":
    main(os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else "~/Documents"))
