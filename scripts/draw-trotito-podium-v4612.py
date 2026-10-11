"""Beta v4.6.12 hotfix 2 — podio de Trotito dibujado a mano en vectores.

Reemplaza al podio trazado automáticamente desde endscreen_trotito.png:
ahí los rellenos no coincidían con los bordes ni con las sombras (un borde
oscuro de más a la izquierda del #2, una muesca arriba del #1, una mancha
naranja en la esquina del #3, restos de pasto en la base). Misma
composición y mismo lienzo (1400 × 343): #2 plateado, #1 dorado con
laureles y #3 bronce, sobre una base crema. Cada bloque tiene tapa (cara
de arriba + canto), cuerpo con biseles, zócalo y el número en Baloo 2
ExtraBold (la letra del juego), pasado a trazos para que se vea igual
dentro de un <img>.

Los corredores se paran en la cara de arriba de cada tapa: FEET dice en
qué y pisan; css/games.css (.trot-podium-runner) usa esas medidas.

Uso: python scripts/draw-trotito-podium-v4612.py <Baloo2[wght].ttf>
     →  assets/games/trotito/podio.svg
Requiere: pip install fonttools
"""
import math
import os
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

W, H = 1400, 343
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "games", "trotito", "podio.svg")
FLOOR = 312          # donde apoya el zócalo de cada bloque (sobre la base)
LID_H, SURF_H, PLINTH_H = 54, 34, 30
LINE = 5             # grosor del contorno

# Bloques: centro, ancho del cuerpo y altura de la tapa. El #1 va último
# (encima de los otros dos, como en el dibujo original).
BLOCKS = [
    dict(label="2", cx=286, w=380, top=70, size=138, pal=dict(
        line="#6b7084", top="#eef0f5", lid="#cfd2dd", body="#b9bcca", bevel="#cdd0db",
        shade="#9a9eb1", plinth="#a9adbe", light="#ffffff", num="#575a6a", num_hi="#dcdfe7")),
    dict(label="3", cx=1110, w=380, top=132, size=110, pal=dict(
        line="#94532f", top="#f7c6a4", lid="#e6a37a", body="#d38c62", bevel="#e2a079",
        shade="#b8714a", plinth="#c98157", light="#ffe3cf", num="#7a3e1d", num_hi="#ecb592")),
    dict(label="1", cx=698, w=436, top=6, size=168, laurels=True, pal=dict(
        line="#b07214", top="#ffe89e", lid="#f9cd59", body="#f0b941", bevel="#f8cf63",
        shade="#dc9d2c", plinth="#e8ac38", light="#fff4c8", num="#8a5512", num_hi="#fbd97c",
        laurel="#c78722")),
]
# Altura (y) donde pisan los corredores: un poco delante del medio de la
# cara de arriba de cada tapa.
FEET = {b["label"]: b["top"] + 24 for b in BLOCKS}

parts = []
add = parts.append


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def rrect(x, y, w, h, r, **attrs):
    extra = "".join(f' {k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    return f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{f(r)}"{extra}/>'


# ------------------------------------------------------------ Números

def load_font(path):
    font = TTFont(path)
    if "fvar" in font:
        font = instantiateVariableFont(font, {"wght": 800})
    return font


def glyphs_path(font, chars):
    """Trazos de los caracteres (tamaño 1 em = 1, y hacia abajo) y su caja."""
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    pen, bounds = SVGPathPen(gs, ntos=lambda v: f"{v:.4f}".rstrip("0").rstrip(".")), BoundsPen(gs)
    x = 0.0
    for ch, scale, gap in chars:
        name = cmap[ord(ch)]
        k = scale / upm
        for p in (pen, bounds):
            gs[name].draw(TransformPen(p, (k, 0, 0, -k, x, 0)))
        x += font["hmtx"][name][0] * k + gap
    return pen.getCommands(), bounds.bounds


def number(font, label, cx, cy, size, pal):
    # «#» un poco más chico que el número, como en el dibujo original.
    d, (x0, y0, x1, y1) = glyphs_path(font, [("#", .74, -.02), (label, 1, 0)])
    k = size
    tx, ty = cx - (x0 + x1) / 2 * k, cy - (y0 + y1) / 2 * k
    # Grabado: una copia clara corrida hacia abajo hace de canto iluminado.
    add(f'<path d="{d}" transform="translate({f(tx)} {f(ty + size * .035)}) scale({f(k)})" fill="{pal["num_hi"]}"/>')
    add(f'<path d="{d}" transform="translate({f(tx)} {f(ty)}) scale({f(k)})" fill="{pal["num"]}"/>')
    return (x1 - x0) * k


# ------------------------------------------------------------ Laureles

def leaf(x, y, ang, length, width):
    return (f'<path d="M0 0Q{f(length * .45)} {f(-width)} {f(length)} 0Q{f(length * .45)} {f(width)} 0 0Z" '
            f'transform="translate({f(x)} {f(y)}) rotate({f(ang)})"/>')


def laurel_branch(x_bottom, y_bottom, height, color):
    """Rama izquierda: un tallo curvo hacia afuera con hojas alternadas."""
    p0 = (x_bottom, y_bottom)
    p1 = (x_bottom - height * .42, y_bottom - height * .5)
    p2 = (x_bottom - height * .06, y_bottom - height)

    def at(t):
        u = 1 - t
        x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0]
        y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
        dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0])
        dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1])
        return x, y, math.degrees(math.atan2(dy, dx))

    out = [f'<path d="M{f(p0[0])} {f(p0[1])}Q{f(p1[0])} {f(p1[1])} {f(p2[0])} {f(p2[1])}" '
           f'fill="none" stroke="{color}" stroke-width="7" stroke-linecap="round"/>', f'<g fill="{color}">']
    n = 6
    for i in range(n):
        t = .16 + i * (.8 / (n - 1))
        x, y, a = at(t)
        size = height * (.27 - i * .02)
        out.append(leaf(x, y, a - 42, size, size * .42))   # hacia afuera
        out.append(leaf(x, y, a + 34, size * .88, size * .4))  # hacia adentro
    x, y, a = at(1)
    out.append(leaf(x, y, a, height * .2, height * .085))   # punta
    out.append("</g>")
    return "".join(out)


# ------------------------------------------------------------ Bloques

def block(font, b):
    pal = b["pal"]
    cx, w, top = b["cx"], b["w"], b["top"]
    x0, x1 = cx - w / 2, cx + w / 2
    body_top = top + LID_H - 8
    body_bot = FLOOR - PLINTH_H + 6
    bh = body_bot - body_top

    # Sombra de apoyo sobre la base.
    add(f'<ellipse cx="{f(cx)}" cy="{f(FLOOR - 2)}" rx="{f(w / 2 + 26)}" ry="9" fill="#8a5a2a" opacity=".16"/>')

    # Cuerpo: frente, bisel claro a la izquierda, lado en sombra a la
    # derecha, sombra de la tapa arriba y un brillo vertical.
    add(rrect(x0, body_top, w, bh, 4, fill=pal["body"]))
    add(rrect(x0, body_top, 26, bh, 4, fill=pal["bevel"]))
    add(rrect(x1 - 30, body_top, 30, bh, 4, fill=pal["shade"]))
    add(f'<path d="M{f(x1 - 30)} {f(body_top)}v{f(bh)}" stroke="{pal["line"]}" stroke-width="2.5" opacity=".35"/>')
    add(f'<path d="M{f(x0 + 26)} {f(body_top)}v{f(bh)}" stroke="{pal["light"]}" stroke-width="2.5" opacity=".6"/>')
    add(f'<path d="M{f(x0 + 40)} {f(body_top + 26)}V{f(body_bot - 22)}" stroke="{pal["light"]}" stroke-width="7" stroke-linecap="round" opacity=".5"/>')
    add(rrect(x0, body_top, w, 14, 0, fill=pal["shade"], opacity=".55"))
    add(rrect(x0, body_top, w, bh, 4, fill="none", stroke=pal["line"], stroke_width=LINE))

    # Número (y laureles en el #1), centrado en el frente sin biseles.
    face_cx = (x0 + 26 + x1 - 30) / 2
    num_cy = body_top + 14 + (bh - 14) / 2 + (6 if b["label"] != "1" else 0)
    num_w = number(font, b["label"], face_cx, num_cy, b["size"], pal)
    if b.get("laurels"):
        gap = num_w / 2 + 40
        branch = laurel_branch(face_cx - gap, num_cy + b["size"] * .5, b["size"] * 1.05, pal["laurel"])
        add(branch)
        add(f'<g transform="translate({f(2 * face_cx)} 0) scale(-1 1)">{branch}</g>')

    # Zócalo.
    py = FLOOR - PLINTH_H
    add(rrect(x0 - 9, py, w + 18, PLINTH_H, 12, fill=pal["plinth"]))
    add(rrect(x0 - 9, py + PLINTH_H * .55, w + 18, PLINTH_H * .45, 10, fill=pal["shade"], opacity=".45"))
    add(f'<path d="M{f(x0 + 6)} {f(py + 8)}H{f(x1 - 6)}" stroke="{pal["light"]}" stroke-width="4" stroke-linecap="round" opacity=".6"/>')
    add(rrect(x0 - 9, py, w + 18, PLINTH_H, 12, fill="none", stroke=pal["line"], stroke_width=LINE))

    # Tapa: canto (frente) y cara de arriba más clara, con un brillo.
    lx0, lw = x0 - 12, w + 24
    add(rrect(lx0, top, lw, LID_H, 20, fill=pal["lid"]))
    add(rrect(lx0 + 6, top + 5, lw - 12, SURF_H, 14, fill=pal["top"]))
    add(f'<path d="M{f(lx0 + 26)} {f(top + 12)}H{f(lx0 + lw * .42)}" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".7"/>')
    add(f'<path d="M{f(lx0 + 10)} {f(top + LID_H - 9)}H{f(lx0 + lw - 10)}" stroke="{pal["shade"]}" stroke-width="5" stroke-linecap="round" opacity=".55"/>')
    add(rrect(lx0, top, lw, LID_H, 20, fill="none", stroke=pal["line"], stroke_width=LINE))


def base():
    # Base crema: cara de arriba y canto, con contorno suave.
    add(rrect(10, 288, W - 20, 48, 22, fill="#ebd5a8"))
    add(rrect(16, 292, W - 32, 24, 14, fill="#f8ecd3"))
    add(f'<path d="M40 297H{W - 40}" stroke="#fffaf0" stroke-width="4" stroke-linecap="round" opacity=".8"/>')
    add(rrect(10, 288, W - 20, 48, 22, fill="none", stroke="#c9a46a", stroke_width=4))


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    font = load_font(sys.argv[1])
    base()
    for b in BLOCKS:
        block(font, b)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
           f'<g stroke-linejoin="round">{"".join(parts)}</g></svg>\n')
    open(OUT, "w").write(svg)
    print(f"Listo: {OUT} ({len(svg) // 1024} KB). Pisan en y = {FEET}")


if __name__ == "__main__":
    main()
