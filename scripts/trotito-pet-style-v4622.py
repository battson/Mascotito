"""Beta v4.6.22 — trotitos con el estilo de las mascotas.

Parte de los 6 cuadros de assets/games/trotito/run.svg (los conejos que se
trazaron con vtracer) y los vuelve a dibujar más prolijos, como la mascota:
- colores planos (el pelaje deja de tener manchas de sombreado),
- un contorno parejo del mismo tono del pelaje, más oscuro (como la clase
  borde-color de la mascota: el color con negro encima),
- la sombra del dibujo (patas de atrás, panza, debajo de la cabeza) pasa a
  ser una sola forma plana, negra al 12 %, como en la mascota y la ropa.
Las poses, la anatomía y el lugar de la nariz no cambian, así que la
geometría de js/trotito.js (TROTITO_SPRITE, TROTITO_MANTA) sigue igual.

Uso: python scripts/trotito-pet-style-v4622.py <run.svg viejo> [salida.svg]
     (el viejo sale de git: git show e75513f:assets/games/trotito/run.svg)
Requiere: pip install vtracer opencv-python-headless numpy pillow playwright
"""
import colorsys
import os
import re
import sys
import tempfile

import cv2
import numpy as np
import vtracer
from PIL import Image

K = 3                      # los PNG están a 3 × el tamaño del cuadro (472 × 385)
W, H = 472, 385
LINE_W = 6.5               # contorno de afuera, en unidades del cuadro
SHADOW = "0.12"            # sombra plana, como la mascota (v4.6.20)

FUR = "#f6f4ef"
# --fur tiñe el pelaje; --fur-mix dice cuánto queda del blanco (72 % = un
# tinte suave, como Rayo; Canela usa poco blanco para ser color canela).
FUR_FILL = f"color-mix(in srgb, {FUR} var(--fur-mix, 72%), var(--fur, {FUR}))"
LINE_FILL = f"color-mix(in srgb, {FUR_FILL} 68%, #000)"
PINK = "#fb7593"
TRIM = "#f8f2cf"
DARK = "#1c1b1f"
MANTA = "var(--manta, #15a0db)"

# clases de pixel
BG, C_FUR, C_LINE, C_PINK, C_MANTA, C_TRIM, C_DARK, C_SHADE = range(8)


def classify(rgba):
    a = rgba[:, :, 3] > 128
    rgb = rgba[:, :, :3].astype(np.float32) / 255
    mx, mn = rgb.max(2), rgb.min(2)
    l = (mx + mn) / 2
    d = mx - mn
    s = np.where(d == 0, 0, d / (1 - np.abs(2 * l - 1) + 1e-6))
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    hue = np.zeros_like(l)
    m = d > 0
    hr = ((g - b) / (d + 1e-6)) % 6
    hg = (b - r) / (d + 1e-6) + 2
    hb = (r - g) / (d + 1e-6) + 4
    hue = np.where(mx == r, hr, np.where(mx == g, hg, hb)) / 6
    hue = np.where(m, hue, 0)

    cls = np.full(l.shape, C_FUR, np.uint8)
    cls[(l < .9) & (s < .4)] = C_SHADE
    cls[(l < .78) & (s < .35)] = C_LINE
    cls[l < .3] = C_DARK
    cls[((hue > .88) | (hue < .02)) & (s > .55) & (l > .45) & (l < .85)] = C_PINK
    cls[(hue > .5) & (hue < .62) & (s > .45) & (l < .8)] = C_MANTA
    cls[(hue > .12) & (hue < .2) & (s > .4) & (l > .8)] = C_TRIM
    cls[~a] = BG
    return cls, a


def smooth(cls, sigma=2.2):
    """Voto por mayoría suavizado: borra las manchitas del trazado."""
    votes = np.stack([cv2.GaussianBlur((cls == c).astype(np.float32), (0, 0), sigma) for c in range(8)])
    out = votes.argmax(0).astype(np.uint8)
    # manchas chicas de cualquier clase (menos los rasgos negros) → vecino
    for c, area in ((C_LINE, 700), (C_SHADE, 1800), (C_PINK, 250), (C_MANTA, 250), (C_TRIM, 250), (C_FUR, 250)):
        n, lab, st, _ = cv2.connectedComponentsWithStats((out == c).astype(np.uint8), 8)
        small = np.isin(lab, [i for i in range(1, n) if st[i, 4] < area])
        if small.any():
            votes[c][small] = -1
            out[small] = votes[:, small].argmax(0)
    return out


def trace(mask, tmpdir, name):
    """Traza una máscara binaria y devuelve los <path> en unidades del cuadro."""
    if not mask.any():
        return ""
    png = os.path.join(tmpdir, name + ".png")
    svg = os.path.join(tmpdir, name + ".svg")
    Image.fromarray(np.where(mask, 0, 255).astype(np.uint8)).save(png)
    vtracer.convert_image_to_svg_py(png, svg, colormode="binary", mode="spline", filter_speckle=8,
                                    corner_threshold=70, length_threshold=6.0, splice_threshold=45, path_precision=1)
    paths = []
    for d, tx, ty in re.findall(r'<path d="([^"]+)" fill="#000000" transform="translate\(([-\d.]+),([-\d.]+)\)"/>', open(svg).read()):
        paths.append((d, float(tx), float(ty)))
    out = []
    for d, tx, ty in paths:
        out.append(f'<path d="{d}" transform="translate({tx / K:.2f} {ty / K:.2f}) scale({1 / K:.4f})"/>')
    return "".join(out)


def frame(src, tmpdir, i):
    rgba = np.array(Image.open(src).convert("RGBA"))
    cls, alpha = classify(rgba)
    cls = smooth(cls)
    alpha = cv2.morphologyEx(alpha.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
    cls[~alpha] = BG
    cls[alpha & (cls == BG)] = C_FUR

    # contorno: el de adentro (trazado) + uno parejo por todo el borde de afuera
    r = int(LINE_W * K / 2)
    inner = cv2.erode(alpha.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))).astype(bool)
    line = (cls == C_LINE) | (alpha & ~inner)
    line = cv2.morphologyEx(line.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)).astype(bool) & alpha

    # sombra: la del dibujo original (patas de atrás, panza, debajo de la
    # cabeza), ahora plana y prolija, negra al 12 % como la mascota
    shade = cv2.morphologyEx((cls == C_SHADE).astype(np.uint8), cv2.MORPH_OPEN,
                             cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))).astype(bool)
    shade = cv2.GaussianBlur(shade.astype(np.float32), (0, 0), 3) > .5
    shade &= alpha & ~line & (cls != C_DARK)

    layers = [
        ("silueta", alpha, FUR_FILL),
        ("rosa", cls == C_PINK, PINK),
        ("manchas", None, None),
        ("ribete", cls == C_TRIM, TRIM),
        ("manta", cls == C_MANTA, MANTA),
        ("sombra", shade, None),
        ("contorno", line & (cls != C_DARK), LINE_FILL),
        ("rasgos", cls == C_DARK, DARK),
    ]
    out, silhouette = [], ""
    for name, mask, fill in layers:
        if name == "manchas":
            out.append(spots(i, silhouette))
            continue
        paths = trace(mask, tmpdir, f"f{i}-{name}")
        if name == "silueta":
            silhouette = paths
        if name == "sombra":
            out.append(f'<g fill="#000" fill-opacity="{SHADOW}">{paths}</g>')
        else:
            out.append(f'<g style="fill:{fill}">{paths}</g>')
    return "".join(out)


# Manchas de Trébol (igual que en el hotfix 1 de v4.6.12): se ven sólo si el
# corredor define --spots; van recortadas a la silueta.
MANTA_CENTERS = [(198.5, 237.5), (201.5, 228.5), (195.5, 225.5), (195.5, 225.5), (212.5, 222.5), (197, 227.5)]


def spots(i, silhouette):
    mx, my = MANTA_CENTERS[i - 1]
    return (f'<clipPath id="trot-clip-f{i}">{silhouette}</clipPath>'
            f'<g clip-path="url(#trot-clip-f{i})" style="display:var(--spots, none)" fill="var(--spot-color, #9a6a45)">'
            f'<ellipse cx="318" cy="118" rx="40" ry="28" transform="rotate(-18 318 118)"/>'
            f'<ellipse cx="292" cy="228" rx="30" ry="22"/>'
            f'<ellipse cx="{mx - 78:.1f}" cy="{my + 4:.1f}" rx="30" ry="22"/>'
            f'<ellipse cx="{mx + 70:.1f}" cy="{my + 40:.1f}" rx="20" ry="14"/></g>')


def render(old_svg, tmp):
    """Dibuja cada cuadro del run.svg viejo a 3 × con fondo transparente."""
    from playwright.sync_api import sync_playwright
    sprite = open(old_svg).read()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get("CHROMIUM") or None)
        pg = b.new_page(viewport={"width": W * K, "height": H * K})
        for i in range(1, 7):
            pg.set_content(f'<body style="margin:0;background:transparent">{sprite}'
                           f'<svg width="{W * K}" height="{H * K}" viewBox="0 0 {W} {H}" style="display:block">'
                           f'<use href="#trot-f{i}"/></svg></body>')
            pg.screenshot(path=os.path.join(tmp, f"src{i}.png"), omit_background=True,
                          clip={"x": 0, "y": 0, "width": W * K, "height": H * K})
        b.close()


def main():
    old = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "..", "assets", "games", "trotito", "run.svg")
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>']
    with tempfile.TemporaryDirectory() as tmp:
        src = tmp
        render(old, tmp)
        for i in range(1, 7):
            parts.append(f'<symbol id="trot-f{i}" viewBox="0 0 {W} {H}">{frame(os.path.join(src, f"src{i}.png"), tmp, i)}</symbol>')
    parts.append("</defs></svg>")
    open(out, "w").write("".join(parts))


if __name__ == "__main__":
    main()
