from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / "android/app/src/main/res"
base = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
d = ImageDraw.Draw(base)
d.rounded_rectangle((2, 2, 61, 61), radius=12, fill="#112c22", outline="#79cf83", width=3)
d.rectangle((7, 43, 56, 55), fill="#2f5640")
d.polygon([(13, 43), (32, 51), (51, 43), (51, 47), (32, 56), (13, 47)], fill="#71522f")
# A small sword behind an original sprout silhouette.
d.polygon([(44, 14), (47, 11), (50, 14), (36, 37), (32, 34)], fill="#d7e9da")
d.line((30, 36, 39, 40), fill="#e7c975", width=4)
d.rectangle((27, 37, 31, 43), fill="#ae7b46")
d.line((31, 42, 32, 29), fill="#a7ef8c", width=4)
d.polygon([(31, 28), (18, 19), (14, 23), (20, 30), (31, 31)], fill="#70d778")
d.polygon([(32, 28), (42, 18), (50, 21), (43, 29), (32, 32)], fill="#a5ed78")
d.polygon([(20, 25), (29, 29), (22, 29)], fill="#c9ff91")
d.polygon([(43, 23), (35, 29), (43, 27)], fill="#d5ff9b")
d.rectangle((29, 30, 34, 34), fill="#d1ed91")
d.point((24, 14), fill="#ffdb7b")
d.point((52, 35), fill="#ffdb7b")

def scaled(size):
    return base.resize((size, size), Image.Resampling.NEAREST)

(ROOT / "assets").mkdir(exist_ok=True)
scaled(512).save(ROOT / "assets/app-icon-512.png")
for density, size in {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}.items():
    folder = RES / f"mipmap-{density}"
    folder.mkdir(parents=True, exist_ok=True)
    icon = scaled(size)
    icon.save(folder / "ic_launcher.png")
    icon.save(folder / "ic_launcher_round.png")
    icon.save(folder / "ic_launcher_foreground.png")

for folder in RES.glob("drawable-*/"):
    splash = folder / "splash.png"
    if splash.exists():
        with Image.open(splash) as original:
            canvas = Image.new("RGBA", original.size, "#112c22")
        size = min(canvas.size) // 3
        art = scaled(size)
        canvas.alpha_composite(art, ((canvas.width-size)//2, (canvas.height-size)//2))
        canvas.save(splash)
plain = RES / "drawable/splash.png"
if plain.exists():
    canvas = Image.new("RGBA", (512, 512), "#112c22")
    art = scaled(180)
    canvas.alpha_composite(art, (166, 166))
    canvas.save(plain)
