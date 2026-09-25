from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "release/feature-graphic-1024x500.png"
canvas = Image.new("RGB", (1024, 500), "#0e241b")
d = ImageDraw.Draw(canvas)
for y in range(0, 500, 16):
    shade = (14 + y // 110, 36 + y // 45, 27 + y // 75)
    d.rectangle((0, y, 1023, y + 15), fill=shade)
for x in range(0, 1024, 88):
    height = 75 + ((x * 17) % 95)
    d.rectangle((x + 28, 500 - height, x + 48, 500), fill="#183b2c")
    d.polygon([(x - 18, 500 - height + 30), (x + 38, 500 - height - 40), (x + 94, 500 - height + 30)], fill="#205239")
    d.polygon([(x - 9, 500 - height + 3), (x + 38, 500 - height - 60), (x + 84, 500 - height + 3)], fill="#276b45")
for x, y in [(80, 80), (900, 70), (780, 190), (170, 230), (730, 60), (940, 270)]:
    d.rectangle((x, y, x + 7, y + 7), fill="#b9eb83")
    d.rectangle((x + 2, y + 2, x + 5, y + 5), fill="#fff1a3")
icon = Image.open(ROOT / "assets/app-icon-512.png").convert("RGBA").resize((260, 260), Image.Resampling.NEAREST)
canvas.paste(icon, (684, 118), icon)
font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
large = ImageFont.truetype(font, 60)
small = ImageFont.truetype(font, 26)
d.text((65, 150), "SPROUT", font=large, fill="#b9fa8f", stroke_width=1, stroke_fill="#10251b")
d.text((65, 225), "EXPEDITION", font=large, fill="#f1f9e9", stroke_width=1, stroke_fill="#10251b")
d.rounded_rectangle((58, 318, 681, 373), radius=8, fill="#102d22", outline="#376e4b", width=2)
d.text((69, 330), "PIXEL RPG  |  GROW BEYOND THE FOREST", font=small, fill="#b5d8bd")
OUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUT)
