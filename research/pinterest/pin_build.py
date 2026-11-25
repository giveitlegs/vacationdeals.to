"""Build an animated Pinterest offer pin from a retro base image.
Usage: python -I pin_build.py <base.png> <out.gif>
Retro base + sample offer text in the lower negative space + a PULSING CTA pill.
Outputs PNG frames; ffmpeg assembles the optimized GIF (separate step)."""
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

base_p, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
W, H = 1000, 1500
base = Image.open(base_p).convert("RGB")
# cover-fit to 1000x1500
s = max(W/base.width, H/base.height)
base = base.resize((round(base.width*s), round(base.height*s)), Image.LANCZOS)
base = base.crop(((base.width-W)//2, (base.height-H)//2, (base.width-W)//2+W, (base.height-H)//2+H))

def font(path, sz):
    for p in [path, r"C:\Windows\Fonts\\"+path]:
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

f_head = font(r"C:\Windows\Fonts\impact.ttf", 150)
f_sub  = font(r"C:\Windows\Fonts\arialbd.ttf", 46)
f_price= font(r"C:\Windows\Fonts\impact.ttf", 120)
f_cta  = font(r"C:\Windows\Fonts\arialbd.ttf", 48)

NAVY=(26,32,74); ORANGE=(255,120,20); PINK=(236,64,122); WHITE=(255,255,255); CREAM=(255,247,235)

def center_text(d, cx, y, txt, fnt, fill, shadow=None):
    bb=d.textbbox((0,0),txt,font=fnt); w=bb[2]-bb[0]; h=bb[3]-bb[1]
    x=cx-w//2
    if shadow:
        d.text((x+3,y+3),txt,font=fnt,fill=shadow)
    d.text((x,y),txt,font=fnt,fill=fill); return h

# static overlay layer (text), drawn once
static = Image.new("RGBA", (W,H), (0,0,0,0))
d = ImageDraw.Draw(static)
# soft cream scrim behind the text block for legibility on the sand
scrim = Image.new("RGBA",(W,H),(0,0,0,0)); sd=ImageDraw.Draw(scrim)
sd.rectangle([0, H-560, W, H], fill=(255,248,238,120))
scrim = scrim.filter(ImageFilter.GaussianBlur(40))
static = Image.alpha_composite(static, scrim); d = ImageDraw.Draw(static)
center_text(d, W//2, H-540, "CANCÚN", f_head, NAVY, shadow=(255,255,255))
center_text(d, W//2, H-375, "5 NIGHTS · ALL-INCLUSIVE", f_sub, ORANGE)
# price row
center_text(d, W//2, H-310, "FROM", f_sub, NAVY)
center_text(d, W//2, H-290, "$799", f_price, PINK, shadow=(255,255,255))

cta_text="SEE THE DEAL  →"
bb=ImageDraw.Draw(static).textbbox((0,0),cta_text,font=f_cta); ctw=bb[2]-bb[0]
pw, ph = ctw+90, 92
px0, py0 = (W-pw)//2, H-150

NF=14; frames=[]
for i in range(NF):
    t=i/NF
    fr = base.convert("RGBA")
    fr = Image.alpha_composite(fr, static)
    # pulsing CTA (scale + glow)
    pulse = 0.5+0.5* (1 - abs((i/(NF-1))*2-1))  # 0..1..0 triangle
    scale = 1.0 + 0.06*pulse
    cw, ch = int(pw*scale), int(ph*scale)
    cta = Image.new("RGBA",(cw+60,ch+60),(0,0,0,0)); cd=ImageDraw.Draw(cta)
    # glow
    glow=Image.new("RGBA",cta.size,(0,0,0,0)); gd=ImageDraw.Draw(glow)
    gd.rounded_rectangle([30,30,30+cw,30+ch],radius=ch//2,fill=(255,120,20,int(120*pulse)))
    glow=glow.filter(ImageFilter.GaussianBlur(18)); cta=Image.alpha_composite(cta,glow)
    # pill gradient (pink->orange) faked with two rects
    cd=ImageDraw.Draw(cta)
    cd.rounded_rectangle([30,30,30+cw,30+ch],radius=ch//2,fill=PINK+(255,))
    cd.rounded_rectangle([30,30,30+cw,30+ch//2],radius=ch//2,fill=ORANGE+(90,))
    tb=cd.textbbox((0,0),cta_text,font=f_cta)
    cd.text((30+(cw-(tb[2]-tb[0]))//2, 30+(ch-(tb[3]-tb[1]))//2-tb[1]), cta_text, font=f_cta, fill=WHITE)
    cx=(W-cta.width)//2; cy=py0-(ch-ph)//2-30
    fr.alpha_composite(cta,(cx,cy))
    frames.append(fr.convert("RGB"))

for i,fr in enumerate(frames):
    fr.save(os.path.join(outdir,f"f{i:02d}.png"))
print(f"frames {NF} {W}x{H} -> {outdir}")
