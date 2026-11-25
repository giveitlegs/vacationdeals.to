"""Auto-pick hero + gallery from candidate images, grade (locked 'vivid' recipe), WebP.
Usage: python -I grade_pick.py <candidates_dir> <out_dir>
No upscale (rollout speed) — sources are display-adequate; just grade + size + compress.
Picks hero = largest landscape-ish image; gallery = next distinct ones. Writes hero.webp,
gallery-1..N.webp + _contact.jpg. Prints 'OK <n>' or 'SKIP <reason>'."""
import sys, os, glob
from PIL import Image, ImageEnhance, ImageFilter

cdir, outdir = sys.argv[1], sys.argv[2]
os.makedirs(outdir, exist_ok=True)
HERO_W, GAL_W = 1280, 1024

def grade(img):
    r, g, b = img.split()
    r = r.point(lambda v: min(255, int(v*1.045 + 2)))
    b = b.point(lambda v: int(v*0.962))
    im = Image.merge("RGB", (r, g, b))
    im = ImageEnhance.Contrast(im).enhance(1.085)
    im = ImageEnhance.Brightness(im).enhance(1.015)
    im = ImageEnhance.Color(im).enhance(1.14)
    return im.filter(ImageFilter.UnsharpMask(radius=2.0, percent=80, threshold=2))

def fit_w(img, w):
    w = min(w, img.width)  # never upsize
    return img.resize((w, round(img.height*w/img.width)), Image.LANCZOS)

cands = []
for p in sorted(glob.glob(os.path.join(cdir, "cand_*.*"))):
    try:
        im = Image.open(p).convert("RGB")
    except Exception:
        continue
    w, h = im.size
    if w < 500 and h < 500:
        continue
    ratio = w / h if h else 99
    cands.append({"p": p, "im": im, "area": w*h, "ratio": ratio, "w": w, "h": h})

if not cands:
    print("SKIP no-candidates"); sys.exit(0)

def ahash(im):
    g = im.convert("L").resize((8, 8), Image.LANCZOS)
    px = list(g.getdata()); avg = sum(px) / len(px)
    return [1 if p > avg else 0 for p in px]

def ham(a, b):
    return sum(1 for x, y in zip(a, b) if x != y)

for c in cands:
    c["ah"] = ahash(c["im"])

# hero: landscape-ish (0.9–2.4), largest area; fallback to largest overall
land = [c for c in cands if 0.9 <= c["ratio"] <= 2.4]
hero = max(land or cands, key=lambda c: c["area"])
# gallery: the rest, by area desc, skip only true near-duplicates (perceptual aHash), cap 4
rest = sorted([c for c in cands if c["p"] != hero["p"]], key=lambda c: -c["area"])
gallery, kept_hashes = [], [hero["ah"]]
for c in rest:
    if any(ham(c["ah"], h) <= 6 for h in kept_hashes):
        continue  # too similar to something already picked
    kept_hashes.append(c["ah"]); gallery.append(c)
    if len(gallery) >= 4:
        break

out_imgs = [("hero", hero, HERO_W)] + [(f"gallery-{i+1}", c, GAL_W) for i, c in enumerate(gallery)]
thumbs = []
for name, c, w in out_imgs:
    g = fit_w(grade(c["im"]), w)
    pth = os.path.join(outdir, f"{name}.webp")
    g.save(pth, "WEBP", quality=85, method=6)
    tw = 300; thumbs.append(g.resize((tw, round(g.height*tw/g.width)), Image.LANCZOS))

# contact sheet (row) for a quick QA glance
if thumbs:
    H = max(t.height for t in thumbs); W = sum(t.width+6 for t in thumbs)
    sheet = Image.new("RGB", (W, H), (18, 18, 18)); x = 0
    for t in thumbs:
        sheet.paste(t, (x, 0)); x += t.width+6
    sheet.save(os.path.join(outdir, "_contact.jpg"), "JPEG", quality=85)

print(f"OK {len(out_imgs)}")
