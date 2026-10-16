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


def lockup(color, path, h=256):
    s = sans(int(h * 0.62), 500)
    z = ImageFont.truetype(F_SERIF, int(h * 0.74))
    tmp = Image.new("RGBA", (h * 6, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(tmp)
    x = 8
    base = int(h * 0.80)
    # tight tracking for the sans part
    for ch in "vaulz":
        d.text((x, base), ch, font=s, fill=color, anchor="ls")
        x += int(d.textlength(ch, font=s) - h * 0.03)
    x += int(h * 0.12)
    d.text((x, base), "zk", font=z, fill=color, anchor="ls")
    x += int(d.textlength("zk", font=z))
    bbox = tmp.getbbox()
    out = tmp.crop((0, 0, bbox[2] + 8, h))
    out.save(path)
    return out


def mark(size, path, maskable=False, bg=PANEL):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0) if not maskable else bg)
    d = ImageDraw.Draw(im)
    r = int(size * 0.24)
    if not maskable:
        d.rounded_rectangle((0, 0, size - 1, size - 1), radius=r, fill=bg)
    f = sans(int(size * (0.62 if not maskable else 0.48)), 500)
    cx, cy = size / 2, size / 2
    d.text((cx - size * 0.05, cy + size * 0.02), "v", font=f, fill=INK, anchor="mm")
    # the omni-like full stop
    dr = size * 0.055
    dx, dy = cx + size * 0.19, cy + size * 0.16
    d.ellipse((dx - dr, dy - dr, dx + dr, dy + dr), fill=INK)
    im.save(path)
    return im


if __name__ == "__main__":
    lockup(INK, BRAND / "vz-lockup-light-ink.png")          # light text (for dark UI)
    lockup((20, 24, 27, 255), BRAND / "vz-lockup-dark-ink.png")
    m = mark(512, BRAND / "mark-256.png")
    for name, sz in (("mark-white-256.png", 256), ("mark-black-256.png", 256)):
        mark(sz, BRAND / name)
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
