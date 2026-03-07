from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

OUT = Path('/home/user/atlas-pathway-website/images')
OUT.mkdir(parents=True, exist_ok=True)

W = H = 1024
bg = Image.new('RGBA', (W, H), (0,0,0,0))
d = ImageDraw.Draw(bg)

# Palette (Atlas-inspired)
DEEP_GREEN = (10, 54, 42, 255)     # #0A362A
DEEP_GREEN_2 = (6, 40, 31, 255)
SAND = (217, 178, 124, 255)        # #D9B27C
SKY = (72, 150, 220, 255)          # #4896DC
SUN = (245, 137, 62, 255)          # #F5893E

# Soft sky arc (subtle)
sky = Image.new('RGBA', (W, H), (0,0,0,0))
sd = ImageDraw.Draw(sky)
# arc-ish gradient via blurred ellipse
sd.ellipse((90, 130, 934, 974), fill=(72,150,220,110))
sky = sky.filter(ImageFilter.GaussianBlur(26))
bg.alpha_composite(sky)

# Sun (top-right)
sun = Image.new('RGBA', (W, H), (0,0,0,0))
ssd = ImageDraw.Draw(sun)
ssd.ellipse((650, 170, 860, 380), fill=(245,137,62,210))
ssd.ellipse((640, 160, 870, 390), outline=(245,137,62,140), width=14)
sun = sun.filter(ImageFilter.GaussianBlur(1.2))
bg.alpha_composite(sun)

# Mountains (two layers)
mount = Image.new('RGBA', (W, H), (0,0,0,0))
md = ImageDraw.Draw(mount)

# Back ridge
md.polygon(
    [
        (120, 720),
        (320, 520),
        (430, 600),
        (560, 420),
        (690, 560),
        (820, 460),
        (940, 620),
        (940, 820),
        (120, 820),
    ],
    fill=(10,54,42,210)
)

# Front ridge
md.polygon(
    [
        (80, 820),
        (280, 610),
        (400, 760),
        (520, 560),
        (650, 760),
        (780, 610),
        (980, 820),
        (980, 950),
        (80, 950),
    ],
    fill=DEEP_GREEN
)

# Snow accents (small, minimal)
md.polygon([(505, 565), (520, 545), (540, 570), (522, 590)], fill=(255,255,255,185))
md.polygon([(770, 625), (785, 605), (805, 632), (788, 652)], fill=(255,255,255,165))

mount = mount.filter(ImageFilter.GaussianBlur(0.4))
bg.alpha_composite(mount)

# Path (stylized winding line)
path = Image.new('RGBA', (W, H), (0,0,0,0))
pd = ImageDraw.Draw(path)
# Draw a thick sand path with a darker edge for depth
pts = [(510, 940), (520, 860), (500, 800), (540, 730), (520, 680), (560, 610)]

# simple curve approximation: draw successive segments with rounded joints
for w in (46, 34):
    color = SAND if w == 46 else (160, 120, 75, 80)
    pd.line(pts, fill=color, width=w, joint='curve')

path = path.filter(ImageFilter.GaussianBlur(0.6))
bg.alpha_composite(path)

# Subtle shadow at bottom
shadow = Image.new('RGBA', (W, H), (0,0,0,0))
shd = ImageDraw.Draw(shadow)
shd.ellipse((120, 860, 904, 1010), fill=(0,0,0,55))
shadow = shadow.filter(ImageFilter.GaussianBlur(24))
bg.alpha_composite(shadow)

# Export logo.png (transparent)
logo_path = OUT/'logo.png'
bg.save(logo_path, 'PNG', optimize=True)

# Export favicon.ico (multi-size)
# Flatten onto white for tiny sizes to preserve readability
sizes = [16, 32, 48, 64, 128, 256]
base = Image.new('RGBA', (W, H), (0,0,0,0))
base.alpha_composite(bg)

ico_imgs = []
for s in sizes:
    im = base.copy().resize((s, s), Image.Resampling.LANCZOS)
    # slight sharpening
    im = im.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=3))
    # flatten to opaque for favicon
    flat = Image.new('RGBA', (s, s), (255,255,255,255))
    flat.alpha_composite(im)
    ico_imgs.append(flat)

favicon_path = OUT/'favicon.ico'
ico_imgs[0].save(favicon_path, format='ICO', sizes=[(s, s) for s in sizes])

# Apple touch icon and PWA icons
sizes_png = [180, 192, 512]
for s in sizes_png:
    im = base.copy().resize((s, s), Image.Resampling.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=3))
    # Keep transparency for PWA icons
    im.save(OUT/f'icon-{s}.png', 'PNG', optimize=True)

# Apple touch icon should be opaque for iOS
apple = base.copy().resize((180, 180), Image.Resampling.LANCZOS)
apple = apple.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=3))
apple_flat = Image.new('RGBA', (180, 180), (255,255,255,255))
apple_flat.alpha_composite(apple)
apple_flat.save(OUT/'apple-touch-icon.png', 'PNG', optimize=True)

print('Wrote', logo_path, 'and', favicon_path)
