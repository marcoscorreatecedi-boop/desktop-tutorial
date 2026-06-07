"""
Remove marca d'água FOTOP + nitidez. v14 – versão definitiva
Diagnóstico confirmou: orange tudo de uma vez (r=50) = sem artefatos.
"""
import cv2
import numpy as np
from PIL import Image, ImageEnhance

INPUT  = "/root/.claude/uploads/0fda7db3-0cc1-5836-bb35-6c6fdacfbf13/bde63dc3-IMG_5990.png"
OUTPUT = "/home/user/desktop-tutorial/foto_sem_marca.png"

img_full = cv2.imread(INPUT)
h_full, w_full = img_full.shape[:2]
TOP, BOT = 110, h_full - 90
photo = img_full[TOP:BOT, :].copy()
ph, pw = photo.shape[:2]

gray = cv2.cvtColor(photo, cv2.COLOR_BGR2GRAY).astype(np.float32)
hsv  = cv2.cvtColor(photo, cv2.COLOR_BGR2HSV)
S    = hsv[:, :, 1].astype(np.float32)
V    = hsv[:, :, 2].astype(np.float32)

def dilate(m, r, itr=1):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (r, r))
    return cv2.dilate(m, k, iterations=itr)

def close_mask(m, r):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (r, r))
    return cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)

def filter_ccl(m, min_a=0, max_a=9e9):
    _, lbl, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    out = np.zeros_like(m)
    for i in range(1, len(st)):
        if min_a <= st[i, cv2.CC_STAT_AREA] <= max_a:
            out[lbl == i] = 255
    return out

SKY_BOT = int(ph * 0.19)
sky_z = np.zeros((ph, pw), np.uint8); sky_z[:SKY_BOT, :] = 255

# ── A. LARANJAS – tudo em um passe (evita artefatos de sequência) ─────────────
raw_org  = cv2.inRange(hsv, np.array([5, 180, 60]), np.array([22, 255, 255]))
raw_org  = close_mask(raw_org, 25)
mask_org = filter_ccl(raw_org, min_a=2_000)
mask_org = dilate(mask_org, 8, 2)

# ── B. LOGOS FOTOP NO CÉU ────────────────────────────────────────────────────
bg   = cv2.GaussianBlur(gray, (0, 0), sigmaX=100)
exc  = (gray - bg).clip(0).astype(np.uint8)
sky_logos = cv2.bitwise_and(
    ((exc > 12) & (S < 10) & (V > 185)).astype(np.uint8) * 255,
    sky_z)
sky_logos = filter_ccl(sky_logos, min_a=80, max_a=300_000)
sky_logos = close_mask(sky_logos, 7)
sky_logos = dilate(sky_logos, 4, 2)

# ── C. XADREZ NO CÉU ─────────────────────────────────────────────────────────
adapt   = cv2.adaptiveThreshold(gray.astype(np.uint8), 255,
                                 cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 41, -22)
adapt_w = cv2.bitwise_and(adapt, (S < 65).astype(np.uint8) * 255)
se1 = np.eye(11, dtype=np.uint8); se2 = np.fliplr(se1)
lines_sky = cv2.bitwise_and(
    cv2.bitwise_or(cv2.morphologyEx(adapt_w, cv2.MORPH_OPEN, se1),
                   cv2.morphologyEx(adapt_w, cv2.MORPH_OPEN, se2)),
    sky_z)
lines_sky = filter_ccl(lines_sky, min_a=30, max_a=6_000)
lines_sky = dilate(lines_sky, 3, 1)

mask_sky = cv2.bitwise_or(sky_logos, lines_sky)

# ── D. Máscara total ─────────────────────────────────────────────────────────
mask_total = cv2.bitwise_or(mask_org, mask_sky)
pct = 100.0 * int(mask_total.sum()) // 255 / (ph * pw)
print(f"Pixels mascarados: {pct:.1f}%")
cv2.imwrite("/home/user/desktop-tutorial/mascara_debug.png", mask_total)

# ── E. Inpainting: laranja primeiro (r=50) depois logos do céu (r=22) ─────────
print("Inpainting 1: banners+texto laranjos (r=50)…")
res = cv2.inpaint(photo, mask_org, inpaintRadius=50, flags=cv2.INPAINT_TELEA)

print("Inpainting 2: logos+xadrez no céu (r=22)…")
res = cv2.inpaint(res, mask_sky, inpaintRadius=22, flags=cv2.INPAINT_TELEA)

# ── F. Nitidez ────────────────────────────────────────────────────────────────
blur  = cv2.GaussianBlur(res, (0, 0), sigmaX=1.8)
sharp = cv2.addWeighted(res, 1.55, blur, -0.55, 0)
sharp = np.clip(sharp, 0, 255).astype(np.uint8)

pil = Image.fromarray(cv2.cvtColor(sharp, cv2.COLOR_BGR2RGB))
pil = ImageEnhance.Color(pil).enhance(1.2)
pil = ImageEnhance.Contrast(pil).enhance(1.1)
pil = ImageEnhance.Sharpness(pil).enhance(1.4)
pil.save(OUTPUT, format="PNG", optimize=True)
print(f"Salvo: {OUTPUT}")
