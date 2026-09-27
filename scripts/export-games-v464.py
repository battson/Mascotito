"""Beta v4.6.4 — arte nuevo de Jugar.

Uso: python scripts/export-games-v464.py minijuegos_v2.ai ruleta.png
Requiere pdftocairo (poppler), Pillow y vtracer.

- assets/ui/games/window-v3.svg: la misma ventana-tablet de minijuegos_v2.ai
  pero con TRES recuadros (Pesca, Penales, Ruleta). El .ai es vectorial: se
  pasa a SVG con pdftocairo (sin calcar), se saca la ✕ (va aparte en
  close.svg) y el recuadro original se repite tres veces, achicado al 80 %.
- assets/games/roulette/wheel.svg: la ruleta de ruleta.png, vectorizada.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".tmp-fishing-tools"))
import vtracer  # noqa: E402

AI, WHEEL = Path(sys.argv[1]), Path(sys.argv[2])

# ------------------------------------------------ Ventana con 3 recuadros
with tempfile.TemporaryDirectory() as tmp:
    raw = Path(tmp) / "raw.svg"
    subprocess.run(["pdftocairo", "-svg", str(AI), str(raw)], check=True)
    paths = re.findall(r"<path[^>]*/>", raw.read_text())
assert len(paths) == 97, len(paths)
frame = [p for i, p in enumerate(paths) if i < 85]          # tablet
box = paths[93:95]                                          # relleno + borde del recuadro 1
BOX_C = (467.85, 547.3)                                     # centro del recuadro original
SCALE = .8
CENTERS = (347.5, 722.5, 1097.5)
boxes = [f'<g transform="translate({cx} {BOX_C[1]}) scale({SCALE}) translate({-BOX_C[0]} {-BOX_C[1]})">{"".join(box)}</g>'
         for cx in CENTERS]
out = ROOT / "assets/ui/games/window-v3.svg"
out.write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="28 22 1396 1038">\n'
               + "\n".join(frame + boxes) + "\n</svg>\n")
print(out.relative_to(ROOT), out.stat().st_size)

# ----------------------------------------------------------------- Ruleta
im = Image.open(WHEEL).convert("RGBA")          # 1254 × 1254, se conserva el lienzo
im = im.resize((900, 900), Image.Resampling.LANCZOS)
im.putalpha(im.getchannel("A").point(lambda x: 255 if x > 110 else 0))
dest = ROOT / "assets/games/roulette/wheel.svg"
dest.parent.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    prepared = Path(tmp) / "input.png"
    im.save(prepared)
    vtracer.convert_image_to_svg_py(str(prepared), str(dest), colormode="color", hierarchical="stacked",
                                    mode="spline", filter_speckle=6, color_precision=6, layer_difference=16,
                                    corner_threshold=60, length_threshold=4, max_iterations=10,
                                    splice_threshold=45, path_precision=1)
svg = re.sub(r"<\?xml[^>]*>\s*", "", dest.read_text())
svg = re.sub(r"<svg [^>]*>", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">', svg, count=1)
assert "<image" not in svg and "base64" not in svg
dest.write_text(svg)
print(dest.relative_to(ROOT), dest.stat().st_size)

# ------------------------------------------- Disco giratorio de la ruleta
# El disco de colores gira; aro, puntero y botón central quedan quietos.
# Para que la copia que gira no arrastre la punta del puntero, esa zona se
# rellena copiando el mismo gajo a igual radio desde un ángulo que el
# puntero no tapa (la línea separadora sigue de largo desde adentro y el
# aro oscuro del borde se copia de otro ángulo). Mismo lienzo que wheel.svg (900 × 900) para que calcen.
import math  # noqa: E402
import numpy as np  # noqa: E402

src = np.array(Image.open(WHEEL).convert("RGBA")).astype(np.uint8)
H, W = src.shape[:2]
CX, CY, R_DISC = 625.5, 639.0, 494.0
POINTER = [(505, 20), (750, 20), (760, 70), (640, 238), (612, 238), (495, 70)]
from PIL import ImageDraw  # noqa: E402
mask_img = Image.new("L", (W, H), 0)
ImageDraw.Draw(mask_img).polygon(POINTER, fill=255)
mask = np.array(mask_img) > 0
yy, xx = np.mgrid[0:H, 0:W]
dx, dy = xx - CX, yy - CY
rr = np.hypot(dx, dy)
th = np.arctan2(dy, dx)
disc = src.copy()
fix = mask & (rr < R_DISC)
def at(r, a_deg):
    """Píxel a radio r y ángulo a (grados, horario desde arriba)."""
    a = math.radians(a_deg)
    return src[int(round(CY - r * math.cos(a))), int(round(CX + r * math.sin(a)))]


for y, x in zip(*np.nonzero(fix)):
    r = rr[y, x]
    a = math.degrees(math.atan2(x - CX, CY - y)) % 360
    if r >= 486:                       # aro oscuro del borde: igual en todo el círculo
        disc[y, x] = at(r, a + 25)
    elif 343.5 <= a < 356:             # gajo violeta angosto: mismo radio, parte que se ve
        disc[y, x] = at(r, 347)
    elif 356 <= a < 358:               # línea separadora: sigue de largo desde adentro
        disc[y, x] = at(385, a)
    else:                              # gajo amarillo: mismo radio, más a la derecha (sin el brillo)
        disc[y, x] = at(r, a + 55)
disc[rr >= R_DISC] = 0                # sólo el disco
disc_img = Image.fromarray(disc).resize((900, 900), Image.Resampling.LANCZOS)
disc_img.putalpha(disc_img.getchannel("A").point(lambda v: 255 if v > 110 else 0))
dest = ROOT / "assets/games/roulette/disc.svg"
with tempfile.TemporaryDirectory() as tmp:
    prepared = Path(tmp) / "disc.png"
    disc_img.save(prepared)
    vtracer.convert_image_to_svg_py(str(prepared), str(dest), colormode="color", hierarchical="stacked",
                                    mode="spline", filter_speckle=6, color_precision=6, layer_difference=16,
                                    corner_threshold=60, length_threshold=4, max_iterations=10,
                                    splice_threshold=45, path_precision=1)
svg = re.sub(r"<\?xml[^>]*>\s*", "", dest.read_text())
svg = re.sub(r"<svg [^>]*>", '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900">', svg, count=1)
assert "<image" not in svg
dest.write_text(svg)
print(dest.relative_to(ROOT), dest.stat().st_size)
