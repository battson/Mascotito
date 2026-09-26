"""Beta v4.6.2 — vectoriza el arte nuevo de Jugar (Pillow + numpy + vtracer).

Uso: python scripts/vectorize-games-v462.py CARPETA_CON_LOS_PNG
Espera: pelota.png, guantes.png, penales.png, minijuegos.png.
Genera SVG con trazados reales (nunca PNG incrustados).

- pelota.png   -> assets/games/penalty/ball.svg
- guantes.png  -> assets/games/penalty/glove-left.svg y glove-right.svg
                  (se separan para que cada guante se mueva por su cuenta)
- penales.png  -> assets/games/penalty/field.svg (trazada a 1254 × 706, que es
                  el lienzo que usa el juego)
- minijuegos.png -> assets/ui/games/window.svg: la misma ventana de feria,
  pero con DOS paneles anchos en vez de cuatro. Se rearma antes de
  vectorizar: cada panel ancho es un "9-slice" de un panel original
  (esquinas con remaches intactas, bordes y relleno estirados); el
  izquierdo sale del panel azul y el derecho del verde. El fondo crema
  de la imagen se vuelve transparente.

La mosca (assets/ui/fx/fly.svg) NO sale de acá: se redibujó a mano sobre
mosca.png con las alas en grupos separados para poder animar el aleteo.
"""
import re
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tmp-fishing-tools'))
import vtracer  # noqa: E402

SRC = Path(sys.argv[1])


def trace(im, out, **opts):
    params = dict(colormode='color', hierarchical='stacked', mode='spline', filter_speckle=5,
                  color_precision=7, layer_difference=12, corner_threshold=60, length_threshold=4,
                  max_iterations=10, splice_threshold=45, path_precision=2)
    params.update(opts)
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        prepared = Path(tmp) / 'input.png'
        im.save(prepared)
        vtracer.convert_image_to_svg_py(str(prepared), str(out), **params)
    svg = re.sub(r'<\?xml[^>]*>\s*', '', out.read_text())
    svg = re.sub(r'<svg [^>]*>', f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {im.width} {im.height}">', svg, count=1)
    assert '<image' not in svg and 'base64' not in svg
    out.write_text(svg)
    print(out.relative_to(ROOT), im.size, out.stat().st_size)


def hard_alpha(im, cut=110):
    im.putalpha(im.getchannel('A').point(lambda x: 255 if x > cut else 0))
    return im


def sprite(name, side):
    im = Image.open(SRC / name).convert('RGBA')
    im = im.crop(im.getbbox())
    im.thumbnail((side, side), Image.Resampling.LANCZOS)
    return hard_alpha(im)


# ---------------------------------------------------------------- Pelota
trace(sprite('pelota.png', 360), ROOT / 'assets/games/penalty/ball.svg')

# ---------------------------------------------------------------- Guantes
gloves = Image.open(SRC / 'guantes.png').convert('RGBA')
alpha = np.array(gloves.getchannel('A'))
cols = alpha.sum(axis=0)
mid = gloves.width // 2
split = mid - 120 + int(np.argmin(cols[mid - 120: mid + 120]))
for side, box in (('left', (0, 0, split, gloves.height)), ('right', (split, 0, gloves.width, gloves.height))):
    part = gloves.crop(box)
    part = part.crop(part.getbbox())
    part.thumbnail((360, 360), Image.Resampling.LANCZOS)
    trace(hard_alpha(part), ROOT / f'assets/games/penalty/glove-{side}.svg')

# ---------------------------------------------------------------- Cancha
field = Image.open(SRC / 'penales.png').convert('RGBA')
# Se traza a 1254 px de ancho para que el SVG no pese de más; el juego
# usa ese mismo lienzo de 1254 × 706 (PENALTY_SCENE en js/games.js).
small = field.resize((1254, round(941 * 1254 / 1672)), Image.Resampling.LANCZOS)
trace(small, ROOT / 'assets/games/penalty/field.svg', filter_speckle=8, layer_difference=16, color_precision=6)

# ------------------------------------------------- Ventana de minijuegos
win = np.array(Image.open(SRC / 'minijuegos.png').convert('RGBA'))
H, W = win.shape[:2]
# Paneles originales (bordes dorados externos, en px de la imagen 1672 × 941).
TOP, BOT = 314, 729
P_BLUE = (152, 510)
P_GREEN = (522, 885)
GAP_WOOD = (511, 521)          # franja de madera oscura entre paneles
LEFT_NEW = (152, 848)
RIGHT_NEW = (858, 1555)
C = 46                          # esquina con remache que no se estira


def nine_slice(src_x, dst_w):
    """Estira un panel a lo ancho sin deformar las esquinas."""
    x0, x1 = src_x
    band = win[TOP:BOT, x0:x1]
    left, mid, right = band[:, :C], band[:, C:-C], band[:, -C:]
    mid_w = dst_w - 2 * C
    mid_img = Image.fromarray(mid).resize((mid_w, band.shape[0]), Image.Resampling.BICUBIC)
    return np.concatenate([left, np.array(mid_img), right], axis=1)


out = win.copy()
out[TOP:BOT, LEFT_NEW[0]:LEFT_NEW[1]] = nine_slice(P_BLUE, LEFT_NEW[1] - LEFT_NEW[0])
out[TOP:BOT, RIGHT_NEW[0]:RIGHT_NEW[1]] = nine_slice(P_GREEN, RIGHT_NEW[1] - RIGHT_NEW[0])
wood = win[TOP:BOT, GAP_WOOD[0]:GAP_WOOD[1]]
wood = np.array(Image.fromarray(wood).resize((RIGHT_NEW[0] - LEFT_NEW[1], BOT - TOP), Image.Resampling.BICUBIC))
out[TOP:BOT, LEFT_NEW[1]:RIGHT_NEW[0]] = wood

# Fondo crema -> transparente (relleno por inundación desde los bordes).
rgb = out[:, :, :3].astype(int)
# Crema del fondo y la sombra gris de abajo: poco saturados y claros.
near = ((rgb.max(axis=2) - rgb.min(axis=2)) < 34) & (rgb.mean(axis=2) > 150)
from collections import deque  # noqa: E402
seen = np.zeros((H, W), bool)
q = deque([(y, x) for x in range(W) for y in (0, H - 1)] + [(y, x) for y in range(H) for x in (0, W - 1)])
while q:
    y, x = q.popleft()
    if y < 0 or x < 0 or y >= H or x >= W or seen[y, x] or not near[y, x]:
        continue
    seen[y, x] = True
    q.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
out[:, :, 3] = np.where(seen, 0, 255)
window = Image.fromarray(out.astype(np.uint8))
window = window.crop(window.getbbox())
window.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
hard_alpha(window, 128)
print('ventana', window.size)
trace(window, ROOT / "assets/ui/games/window.svg", filter_speckle=10, layer_difference=20, color_precision=6, path_precision=1)
