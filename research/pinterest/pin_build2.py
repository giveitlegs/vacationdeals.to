"""Build an animated Pinterest offer pin (v2) with layered, climate-aware motion.

Usage: python -I pin_build2.py <base.png> <out_frames_dir> <theme>
  theme = neon | fire | snow

Nuance layers (all subtle, all local/free — PIL only, GIF assembled by ffmpeg):
  - ROTATING SUN           a soft radial sun-burst behind the headline slowly rotates
  - CLIMATE TEXT TREATMENT  headline styled per location:
        neon  -> cyan/magenta glow that breathes
        fire  -> warm ember gradient with a flicker + rising heat shimmer
        snow  -> frosted blue text with gentle falling snow over the whole pin
  - LOVEMARKS              a few small heart/sparkle accents drift up and twinkle
  - PULSING CTA            the proven "SEE THE DEAL ->" pill (scale + glow pulse)

Offer text (headline / nights / price / cta) is passed via env so one script
serves every destination. Outputs PNG frames; ffmpeg makes the optimized GIF.
"""
import sys, os, math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

base_p, outdir, theme = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(outdir, exist_ok=True)
random.seed(7)

HEAD  = os.environ.get("PIN_HEAD", "CANCUN")
SUB   = os.environ.get("PIN_SUB",  "5 NIGHTS - ALL-INCLUSIVE")
PRICE = os.environ.get("PIN_PRICE", "$799")
CTA_T = os.environ.get("PIN_CTA",  "SEE THE DEAL  \u2192")

W, H = 1000, 1500
base = Image.open(base_p).convert("RGB")
s = max(W / base.width, H / base.height)
base = base.resize((round(base.width * s), round(base.height * s)), Image.LANCZOS)
base = base.crop(((base.width - W) // 2, (base.height - H) // 2,
                  (base.width - W) // 2 + W, (base.height - H) // 2 + H))


def font(path, sz):
    for p in [path, r"C:\Windows\Fonts\\" + path]:
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


f_head  = font(r"C:\Windows\Fonts\impact.ttf", 140)
f_sub   = font(r"C:\Windows\Fonts\arialbd.ttf", 44)
f_price = font(r"C:\Windows\Fonts\impact.ttf", 118)
f_cta   = font(r"C:\Windows\Fonts\arialbd.ttf", 48)

WHITE = (255, 255, 255)

# Per-theme palette for headline + sun tint
THEMES = {
    "neon": dict(sun=(255, 90, 180), glow1=(0, 229, 255), glow2=(255, 40, 200),
                 head=(255, 255, 255), accent=(0, 229, 255)),
    "fire": dict(sun=(255, 140, 30), glow1=(255, 170, 40), glow2=(255, 70, 20),
                 head=(255, 240, 210), accent=(255, 150, 40)),
    "snow": dict(sun=(180, 220, 255), glow1=(200, 235, 255), glow2=(120, 180, 240),
                 head=(238, 248, 255), accent=(170, 215, 255)),
}
T = THEMES[theme]


def center(d, cx, y, txt, fnt, fill, shadow=None):
    bb = d.textbbox((0, 0), txt, font=fnt)
    w = bb[2] - bb[0]
    x = cx - w // 2 - bb[0]
    if shadow:
        d.text((x + 3, y + 3), txt, font=fnt, fill=shadow)
    d.text((x, y), txt, font=fnt, fill=fill)


# ---- rotating sun burst (pre-rendered rays, rotated per frame) ----------
SUN = 520
sun = Image.new("RGBA", (SUN, SUN), (0, 0, 0, 0))
sd = ImageDraw.Draw(sun)
cx = cy = SUN // 2
for k in range(16):
    a = math.radians(k * (360 / 16))
    x2 = cx + math.cos(a) * SUN
    y2 = cy + math.sin(a) * SUN
    sd.line([(cx, cy), (x2, y2)], fill=T["sun"] + (60,), width=26)
sun = sun.filter(ImageFilter.GaussianBlur(10))
# soft core
core = Image.new("RGBA", (SUN, SUN), (0, 0, 0, 0))
cd = ImageDraw.Draw(core)
cd.ellipse([cx - 120, cy - 120, cx + 120, cy + 120], fill=T["sun"] + (70,))
core = core.filter(ImageFilter.GaussianBlur(40))
sun = Image.alpha_composite(sun, core)

SUN_CX, SUN_CY = W // 2, H - 470   # behind headline

# ---- static legibility scrim + offer text (drawn once) ------------------
static = Image.new("RGBA", (W, H), (0, 0, 0, 0))
scrim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sc = ImageDraw.Draw(scrim)
sc.rectangle([0, H - 600, W, H], fill=(10, 12, 28, 150))
scrim = scrim.filter(ImageFilter.GaussianBlur(45))
static = Image.alpha_composite(static, scrim)
ds = ImageDraw.Draw(static)
center(ds, W // 2, H - 360, SUB, f_sub, T["accent"])
center(ds, W // 2, H - 300, "FROM", f_sub, WHITE)
center(ds, W // 2, H - 278, PRICE, f_price, WHITE, shadow=(0, 0, 0))

# CTA geometry
bb = ImageDraw.Draw(static).textbbox((0, 0), CTA_T, font=f_cta)
ctw = bb[2] - bb[0]
pw, ph = ctw + 92, 94
py0 = H - 150

# ---- lovemarks: drifting heart/sparkle accents --------------------------
def heart(size, col, alpha):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = size // 4
    d.ellipse([size*0.12, size*0.15, size*0.12+2*r, size*0.15+2*r], fill=col + (alpha,))
    d.ellipse([size*0.5-0.12*size, size*0.15, size*0.5-0.12*size+2*r, size*0.15+2*r], fill=col + (alpha,))
    d.polygon([(size*0.12, size*0.42), (size*0.88, size*0.42), (size*0.5, size*0.9)], fill=col + (alpha,))
    return im

MARKS = []
for _ in range(7):
    MARKS.append(dict(x=random.uniform(80, W - 80), y=random.uniform(250, H - 650),
                      sz=random.randint(22, 40), ph=random.uniform(0, 1),
                      sp=random.uniform(0.4, 0.9), kind=random.choice(["heart", "spark"])))


def draw_spark(d, x, y, r, col, a):
    d.line([(x - r, y), (x + r, y)], fill=col + (a,), width=3)
    d.line([(x, y - r), (x, y + r)], fill=col + (a,), width=3)


# ---- snow (theme=snow only) --------------------------------------------
SNOW = []
if theme == "snow":
    for _ in range(90):
        SNOW.append(dict(x=random.uniform(0, W), y=random.uniform(0, H),
                         r=random.uniform(1.5, 4.5), sp=random.uniform(6, 16),
                         drift=random.uniform(-6, 6)))

NF = 24
frames = []
for i in range(NF):
    t = i / NF
    tri = 1 - abs((i / (NF - 1)) * 2 - 1)   # 0..1..0
    fr = base.convert("RGBA")

    # rotating sun behind headline
    ang = (t * 360) / 6                      # slow
    rs = sun.rotate(ang, resample=Image.BICUBIC, center=(cx, cy))
    breathe = int(28 * tri)
    rs = Image.eval(rs, lambda v: v)
    fr.alpha_composite(rs, (SUN_CX - cx, SUN_CY - cy))

    fr = Image.alpha_composite(fr, static)
    d = ImageDraw.Draw(fr)

    # climate headline treatment
    hy = H - 520
    if theme == "neon":
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        gcol = T["glow1"] if i % 2 == 0 else T["glow2"]
        center(gd, W // 2, hy, HEAD, f_head, gcol)
        glow = glow.filter(ImageFilter.GaussianBlur(14 - int(6 * tri)))
        fr = Image.alpha_composite(fr, glow)
        d = ImageDraw.Draw(fr)
        center(d, W // 2, hy, HEAD, f_head, T["head"])
    elif theme == "fire":
        # ember gradient + flicker glow + slight vertical heat shimmer
        flick = 0.6 + 0.4 * (0.5 + 0.5 * math.sin(i * 1.7))
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        center(gd, W // 2, hy - int(2 * tri), HEAD, f_head, (255, int(90 + 60 * flick), 20))
        glow = glow.filter(ImageFilter.GaussianBlur(16))
        glow.putalpha(glow.getchannel("A").point(lambda v: int(v * flick)))
        fr = Image.alpha_composite(fr, glow)
        d = ImageDraw.Draw(fr)
        center(d, W // 2, hy, HEAD, f_head, (255, 225, 190))
    else:  # snow
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow)
        center(gd, W // 2, hy, HEAD, f_head, T["glow1"])
        glow = glow.filter(ImageFilter.GaussianBlur(10))
        fr = Image.alpha_composite(fr, glow)
        d = ImageDraw.Draw(fr)
        center(d, W // 2, hy, HEAD, f_head, T["head"])

    # lovemarks drifting upward + twinkle
    for m in MARKS:
        yy = m["y"] - (t * 60 * m["sp"]) % 120
        a = int(120 + 120 * (0.5 + 0.5 * math.sin((t + m["ph"]) * 2 * math.pi)))
        a = max(40, min(220, a))
        if m["kind"] == "heart":
            hm = heart(m["sz"], T["accent"], a)
            fr.alpha_composite(hm, (int(m["x"]), int(yy)))
        else:
            draw_spark(ImageDraw.Draw(fr), int(m["x"]), int(yy), m["sz"] // 2, (255, 255, 255), a)

    # falling snow over everything
    if theme == "snow":
        sd2 = ImageDraw.Draw(fr)
        for fl in SNOW:
            yy = (fl["y"] + t * fl["sp"] * NF) % H
            xx = (fl["x"] + math.sin((t * 2 * math.pi) + fl["y"]) * fl["drift"]) % W
            sd2.ellipse([xx - fl["r"], yy - fl["r"], xx + fl["r"], yy + fl["r"]],
                        fill=(255, 255, 255, 200))

    # pulsing CTA pill (scale + glow)
    scale = 1.0 + 0.06 * tri
    cw, ch = int(pw * scale), int(ph * scale)
    cta = Image.new("RGBA", (cw + 70, ch + 70), (0, 0, 0, 0))
    glow = Image.new("RGBA", cta.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.rounded_rectangle([35, 35, 35 + cw, 35 + ch], radius=ch // 2,
                         fill=T["accent"] + (int(130 * tri),))
    glow = glow.filter(ImageFilter.GaussianBlur(20))
    cta = Image.alpha_composite(cta, glow)
    cd = ImageDraw.Draw(cta)
    cd.rounded_rectangle([35, 35, 35 + cw, 35 + ch], radius=ch // 2, fill=(236, 64, 122, 255))
    cd.rounded_rectangle([35, 35, 35 + cw, 35 + ch // 2], radius=ch // 2, fill=T["accent"] + (90,))
    tb = cd.textbbox((0, 0), CTA_T, font=f_cta)
    cd.text((35 + (cw - (tb[2] - tb[0])) // 2 - tb[0],
             35 + (ch - (tb[3] - tb[1])) // 2 - tb[1]), CTA_T, font=f_cta, fill=WHITE)
    fr.alpha_composite(cta, ((W - cta.width) // 2, py0 - (ch - ph) // 2 - 35))

    frames.append(fr.convert("RGB"))

for i, fr in enumerate(frames):
    fr.save(os.path.join(outdir, f"f{i:02d}.png"))
print(f"frames {NF} {W}x{H} theme={theme} -> {outdir}")
