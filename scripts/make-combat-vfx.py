"""Original 32 px combat effect artwork; deterministic 6-frame transparent sheets."""
from pathlib import Path
from PIL import Image, ImageDraw
import math

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'vfx'
OUT.mkdir(exist_ok=True)
PALETTES = {
    'basic': ('#263a39', '#90d8bf', '#f4ffe0'),
    'warrior': ('#803b39', '#f39060', '#fff0ba'),
    'mage': ('#2d5f83', '#6fd2e9', '#efffff'),
    'archer': ('#35684d', '#a9dc74', '#f6ffca'),
    'rogue': ('#624479', '#bf88dd', '#f4ddff'),
    'paladin': ('#856342', '#f4c66c', '#fff5cd'),
}

def pixel_line(draw, xy, fill, width=1):
    draw.line(xy, fill=fill, width=width, joint='curve')

def render(kind, frame):
    im = Image.new('RGBA', (64, 64))
    d = ImageDraw.Draw(im)
    edge, mid, light = PALETTES[kind]
    p = frame / 5
    fade = max(0.17, 1-p*.78)
    def color(hexcode, alpha=1):
        return tuple(bytes.fromhex(hexcode.lstrip('#'))) + (round(255*alpha*fade),)
    r = 9 + frame*5
    cx, cy = 32, 32
    if kind in ('basic', 'warrior', 'rogue'):
        # Silhouette is drawn first, then the inset highlight and small detached sparks.
        for layer, width, radius, c in [(0, 7, r+3, edge), (1, 4, r, mid), (2, 2, r-2, light)]:
            points = []
            start = -2.6 if kind != 'rogue' else -1.7
            span = 2.4 if kind != 'rogue' else 2.1
            for i in range(16):
                a = start + span*i/15
                points.append((round(cx + radius*math.cos(a)), round(cy + radius*math.sin(a)*.75)))
            pixel_line(d, points, color(c), width)
        if kind in ('warrior', 'rogue'):
            a = .8 if kind == 'warrior' else 2.6
            for layer, width, c in [(0,6,edge),(1,3,mid),(2,1,light)]:
                pts = [(round(cx+math.cos(a+i*2.3/15)*(r+2-layer*2)), round(cy+math.sin(a+i*2.3/15)*(r+2-layer*2)*.72)) for i in range(16)]
                pixel_line(d,pts,color(c),width)
    elif kind == 'mage':
        # Square runes echo the artwork's stepped edges.
        for offset, c in [(0,edge),(2,mid),(5,light)]:
            rr = min(27,r)-offset
            d.rectangle((cx-rr,cy-rr,cx+rr,cy+rr),outline=color(c),width=2)
        d.rectangle((cx-5,cy-5,cx+5,cy+5),fill=color(mid,.45))
        d.rectangle((cx-2,cy-2,cx+2,cy+2),fill=color(light))
    elif kind == 'archer':
        for j in range(3):
            yy=cy-13+j*12
            x=4+frame*7-j*4
            d.polygon([(x,yy),(x+27,yy),(x+34,yy+2),(x+27,yy+5),(x,yy+5)],fill=color(edge))
            d.rectangle((x+3,yy+1,x+27,yy+2),fill=color(light))
            d.polygon([(x+27,yy-3),(x+39,yy+2),(x+27,yy+8)],fill=color(mid))
    elif kind == 'paladin':
        rr = min(28,r)
        d.rectangle((cx-rr,cy-rr,cx+rr,cy+rr),outline=color(edge),width=3)
        d.rectangle((cx-rr+2,cy-rr+2,cx+rr-2,cy+rr-2),outline=color(mid),width=2)
        d.rectangle((cx-4,cy-rr+4,cx+4,cy+rr-4),fill=color(mid,.8))
        d.rectangle((cx-rr+4,cy-4,cx+rr-4,cy+4),fill=color(mid,.8))
        d.rectangle((cx-2,cy-rr+5,cx+1,cy+rr-5),fill=color(light))
        d.rectangle((cx-rr+5,cy-2,cx+rr-5,cy+1),fill=color(light))
    for j in range(9 if kind != 'basic' else 5):
        a=j*2.4+frame*.23
        dist=11+frame*5+(j%3)*3
        x=round(cx+math.cos(a)*dist)
        y=round(cy+math.sin(a)*dist*.75)
        if 2<x<60 and 2<y<60:
            size=2+(j%4==0)
            d.rectangle((x,y,x+size,y+size),fill=color(light if j%3==0 else mid))
    return im

for kind in PALETTES:
    sheet=Image.new('RGBA',(64*6,64))
    for frame in range(6):
        sheet.alpha_composite(render(kind,frame),(64*frame,0))
    sheet.save(OUT/f'{kind}.png',optimize=True)
print('Created six original combat effect sheets in vfx/')
