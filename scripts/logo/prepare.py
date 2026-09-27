"""Rebuild brand assets: DATABASE_URL= python3 scripts/logo/prepare.py (Pillow)."""
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
PAPER = "#F4F1E8"

def remove_background(image, tolerance=32):
    """Remove only edge-connected near-white pixels; preserve enclosed whites.

    The supplied PNG already has alpha. This also supports an opaque replacement.
    """
    image = image.convert("RGBA")
    pixels = image.load()
    w, h = image.size
    seen = set()
    queue = deque([(x, y) for x in range(w) for y in (0, h-1)] +
                  [(x, y) for y in range(h) for x in (0, w-1)])
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen:
            continue
        seen.add((x, y))
        r, g, b, a = pixels[x, y]
        if a and min(r, g, b) < 255-tolerance:
            continue
        pixels[x, y] = (r, g, b, 0)
        for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen:
                queue.append((nx, ny))
    return image

def trim(image):
    # Ignore stray near-transparent source pixels when finding the artwork bounds.
    bounds = image.getchannel("A").point(lambda a: 255 if a > 128 else 0).getbbox()
    return image.crop(bounds)

def resize(image, width):
    return image.resize((width, round(image.height*width/image.width)), Image.Resampling.LANCZOS)

def square(image, size, padding=0, background=(0,0,0,0)):
    canvas = Image.new("RGBA", (size,size), background)
    image = image.copy()
    image.thumbnail((size-2*padding,size-2*padding), Image.Resampling.LANCZOS)
    canvas.alpha_composite(image, ((size-image.width)//2,(size-image.height)//2))
    return canvas

def prepare_horizontal():
    """Compose existing approved crops without extracting the source again."""
    brand = ROOT / "public/brand"
    emblem = trim(Image.open(brand / "alunsina-emblem@2x.png").convert("RGBA"))
    wordmark = trim(Image.open(brand / "alunsina-wordmark@2x.png").convert("RGBA"))
    emblem = emblem.resize((round(emblem.width * 104 / emblem.height), 104), Image.Resampling.LANCZOS)
    wordmark = resize(wordmark, 400)
    canvas = Image.new("RGBA", (emblem.width + 14 + wordmark.width, 104))
    canvas.alpha_composite(emblem, (0, 0))
    canvas.alpha_composite(wordmark, (emblem.width + 14, (104 - wordmark.height) // 2))
    canvas.save(brand / "alunsina-logo-horizontal@2x.png")
    resize(canvas, round(canvas.width / 2)).save(brand / "alunsina-logo-horizontal.png")
    print("Horizontal:", canvas.size)


def main():
    image = remove_background(Image.open(ROOT / "docs/reference/logo-source.png"))
    full = trim(image)
    emblem = trim(image.crop((0,0,image.width,990)))
    wordmark = trim(image.crop((0,990,image.width,image.height)))
    brand = ROOT / "public/brand"
    brand.mkdir(parents=True, exist_ok=True)
    for name, artwork in (("full",full),("wordmark",wordmark)):
        for suffix,width in (("",480),("@2x",960)):
            resize(artwork,width).save(brand / f"alunsina-logo-{name}{suffix}.png" if name == "full" else brand / f"alunsina-wordmark{suffix}.png")
    for suffix,size in (("",512),("@2x",1024)):
        square(emblem,size).save(brand / f"alunsina-emblem{suffix}.png")
    square(emblem,512,24).save(ROOT / "app/icon.png")
    square(emblem,180,20,PAPER).save(ROOT / "app/apple-icon.png")
    square(emblem,256,8).save(ROOT / "app/favicon.ico", sizes=[(16,16),(32,32),(48,48)])
    og = Image.new("RGBA",(1200,630),PAPER)
    lockup = resize(full,440)
    og.alpha_composite(lockup,((1200-lockup.width)//2,45))
    font_path = Path("/System/Library/Fonts/Supplemental/Times New Roman.ttf")
    if font_path.exists():
        draw = ImageDraw.Draw(og)
        draw.text((600,550),"Truth has more than one source.",font=ImageFont.truetype(str(font_path),32),fill="#092D27",anchor="mt")
    og.convert("RGB").save(ROOT / "app/opengraph-image.png")
    print("Full:", resize(full,480).size, "Wordmark:",resize(wordmark,480).size)

if __name__ == "__main__":
    import sys
    if "--horizontal-only" in sys.argv:
        prepare_horizontal()
    else:
        main()
        prepare_horizontal()
