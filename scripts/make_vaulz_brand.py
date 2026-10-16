"""Render Vaulz zk brand assets (wordmark lockups + favicons) with DM Sans + Instrument Serif."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

F_SANS = "/tmp/fonts/DMSans.ttf"
F_SERIF = "/tmp/fonts/ISerifI.ttf"
BRAND = Path("/app/backend/brand")
PUB = Path("/app/frontend/public")
INK = (227, 232, 232, 255)      # --fg
BG = (9, 13, 16, 255)           # --bg
PANEL = (16, 23, 28, 255)


def sans(size, wght=500):
    f = ImageFont.truetype(F_SANS, size)
    try:
        f.set_variation_by_axes([14, wght])
    except Exception:
        try:
            f.set_variation_by_axes([wght])
        except Exception:
            pass
    return f


MARK_SRC = Path("/app/scripts/blindspot-mark-src.png")


def _mark_img(size, ink=None):
    m = Image.open(MARK_SRC).convert("RGBA").resize((size, size), Image.LANCZOS)
    if ink:
        r, g, b, a = m.split()
        m = Image.merge("RGBA", (Image.new("L", m.size, ink[0]), Image.new("L", m.size, ink[1]), Image.new("L", m.size, ink[2]), a))
    return m


def lockup(color, path, h=256):
    s = sans(int(h * 0.50), 500)
    mk = _mark_img(int(h * 0.86), None if color[0] > 128 else (20, 24, 27))
    tmp = Image.new("RGBA", (h * 8, h), (0, 0, 0, 0))
    tmp.paste(mk, (0, (h - mk.size[1]) // 2), mk)
    d = ImageDraw.Draw(tmp)
    x = int(h * 1.0)
    base = int(h * 0.68)
    for ch in "BlindSpot":
        d.text((x, base), ch, font=s, fill=color, anchor="ls")
        x += int(d.textlength(ch, font=s) - h * 0.012)
    bbox = tmp.getbbox()
    tmp.crop((0, 0, bbox[2] + 8, h)).save(path)


def mark(size, path, maskable=False, bg=(0, 0, 0, 255), transparent=False):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0) if (transparent or not maskable) else bg)
    if not transparent and not maskable:
        ImageDraw.Draw(im).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.22), fill=bg)
    k = 1.0 if transparent else (0.62 if maskable else 0.78)
    mk = _mark_img(max(1, int(size * k)))
    im.paste(mk, ((size - mk.size[0]) // 2, (size - mk.size[1]) // 2), mk)
    im.save(path)
    return im


if __name__ == "__main__":
    lockup(INK, BRAND / "vz-lockup-light-ink.png")
    lockup((20, 24, 27, 255), BRAND / "vz-lockup-dark-ink.png")
    mark(512, BRAND / "mark-256.png", transparent=True)
    mark(256, BRAND / "mark-white-256.png", transparent=True)
    mark(256, BRAND / "mark-black-256.png")
    mark(512, PUB / "brand" / "blindspot-mark.png", transparent=True)
    for sz, name in ((32, "favicon-32.png"), (64, "favicon-64.png"), (192, "favicon-192.png"), (512, "favicon-512.png")):
        mark(sz, BRAND / name)
    mark(180, BRAND / "apple-touch-icon.png", maskable=True)
    mark(512, BRAND / "maskable-512.png", maskable=True)
    ico = mark(256, Path("/tmp/ico.png"))
    ico.save(BRAND / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    # frontend public copies
    (PUB / "brand").mkdir(exist_ok=True)
    for sz, name in ((32, "favicon-32.png"), (192, "favicon-192.png"), (512, "favicon-512.png")):
        mark(sz, PUB / "brand" / name)
    mark(16, PUB / "favicon-16x16.png"); mark(32, PUB / "favicon-32x32.png")
    mark(192, PUB / "android-chrome-192x192.png"); mark(512, PUB / "android-chrome-512x512.png")
    for n in ("apple-touch-icon.png", "apple-touch-icon-precomposed.png", "apple-touch-icon-180x180.png"):
        mark(180, PUB / n, maskable=True)
    mark(152, PUB / "apple-touch-icon-152x152.png", maskable=True)
    mark(120, PUB / "apple-touch-icon-120x120.png", maskable=True)
    ico.save(PUB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("ok")
