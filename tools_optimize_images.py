from PIL import Image, ImageOps
from pathlib import Path

RAW = Path('/home/user/atlas-pathway-website/raw')
OUT = Path('/home/user/atlas-pathway-website')

hero_src = RAW/'valley-panorama-1.jpg'
portrait_src = RAW/'camel-selfie-desert-1.jpg'

# Helpers

def save_webp(im: Image.Image, out_path: Path, quality=82):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    im.save(out_path, 'WEBP', quality=quality, method=6)


def save_jpg(im: Image.Image, out_path: Path, quality=85):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if im.mode in ('RGBA', 'LA'):
        bg = Image.new('RGB', im.size, (255,255,255))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert('RGB')
    im.save(out_path, 'JPEG', quality=quality, optimize=True, progressive=True)


def resize_to_width(im: Image.Image, target_w: int):
    w, h = im.size
    if w <= target_w:
        return im
    target_h = int(h * (target_w / w))
    return im.resize((target_w, target_h), Image.Resampling.LANCZOS)


def center_square(im: Image.Image, size: int):
    im = ImageOps.exif_transpose(im)
    w, h = im.size
    side = min(w, h)
    left = (w - side)//2
    top = (h - side)//2
    im = im.crop((left, top, left+side, top+side))
    if side != size:
        im = im.resize((size, size), Image.Resampling.LANCZOS)
    return im


# HERO
hero = Image.open(hero_src)
hero = ImageOps.exif_transpose(hero)
hero_1920 = resize_to_width(hero, 1920)
hero_1440 = resize_to_width(hero, 1440)

save_webp(hero_1920, OUT/'images/hero/hero-1920.webp')
save_webp(hero_1440, OUT/'images/hero/hero-1440.webp')

# OpenGraph share image (1200x630)
og = hero_1920.copy()
og = ImageOps.fit(og, (1200, 630), method=Image.Resampling.LANCZOS, centering=(0.5,0.45))
save_jpg(og, OUT/'images/hero/og.jpg', quality=88)

# GUIDE PORTRAIT (square)
portrait = Image.open(portrait_src)
portrait = center_square(portrait, 900)
save_webp(portrait, OUT/'images/guide.webp', quality=84)

# GALLERY
# Create 1600px webp + 480px thumb webp
gallery_items = [
    'hike-forest-crowd-1.jpg',
    'hike-forest-trail-1.jpg',
    'waterfall-trail-1.jpg',
    'sunset-lake-1.jpg',
    'village-hillside-1.jpg',
    'mountain-road-hike-1.jpg',
    'hike-ridge-line-1.jpg',
    'mountain-hut-view-1.jpg',
    'waterfall-group-wide-1.jpg',
    'waterfall-group-portrait-1.jpg',
    'tagine-lunch-1.jpg',
    'tea-house-interior-1.jpg',
    'valley-smoke-1.jpg',
    'group-wave-1.jpg',
    'selfie-guide-group-1.jpg',
    'village-alley-hike-1.jpg',
    'camel-ride-1.jpg',
    'camel-ride-line-1.jpg',
    'camels-resting-1.jpg',
    'camel-selfie-desert-1.jpg',
    'cafe-stop-1.jpg',
]

manifest = []
for name in gallery_items:
    src = RAW/name
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)

    large = resize_to_width(im, 1600)
    thumb = resize_to_width(im, 480)

    stem = Path(name).stem
    large_out = OUT/f'images/gallery/{stem}.webp'
    thumb_out = OUT/f'images/thumbs/{stem}.webp'

    save_webp(large, large_out, quality=82)
    save_webp(thumb, thumb_out, quality=78)

    manifest.append({
        'id': stem,
        'large': f'images/gallery/{stem}.webp',
        'thumb': f'images/thumbs/{stem}.webp',
        'alt': stem.replace('-', ' ').replace(' 1', '').title(),
    })

# Write manifest JSON for script
import json
(OUT/'assets').mkdir(parents=True, exist_ok=True)
with open(OUT/'assets/gallery.json', 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print('Done. Images processed:', len(manifest))
