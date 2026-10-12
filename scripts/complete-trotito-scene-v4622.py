"""Beta v4.6.22 — completa el escenario de Trotito de Jony (diseños/trotito/run-scene.ai) con lo que falta
respecto a la referencia: pasto, cercas, banderines, pista con carriles,
salida, meta a cuadros y arbustos con flores (sin carteles ni banderas).

Uso: pdftocairo -svg diseños/trotito/run-scene.ai /tmp/scene.svg
     python scripts/complete-trotito-scene-v4622.py /tmp/scene.svg assets/games/trotito/escenario.svg
La copia WebP del modo liviano sale con una captura del SVG a 1672 × 941.
Geometría igual a js/trotito.js (TROTITO_TRACK): lienzo 1672 × 941,
salida x 196, meta x 1478, carriles con patas en 616 / 704 / 794 / 878.
"""
import random
import re
import sys

W, H = 1672, 941
TRACK_TOP, TRACK_BOTTOM = 548, 892
LANE_LINES = [628, 716, 806]
START_X, FINISH_X = 196, 1478
rnd = random.Random(4613)


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


# ---------------------------------------------------------------- tu dibujo
src = open(sys.argv[1]).read()
defs = src[src.index("<defs>") + 6:src.index("</defs>")]
body = src[src.index("</defs>") + 7:src.rindex("</svg>")]


def thin_gradient(m):
    """pdftocairo parte cada degradado en ~65 paradas; con 9 alcanza."""
    stops = re.findall(r"<stop [^>]*/>", m.group(2))
    keep = stops[::max(1, len(stops) // 8)]
    if keep[-1] != stops[-1]:
        keep.append(stops[-1])
    return m.group(1) + "\n".join(keep) + m.group(3)


defs = re.sub(r"(<linearGradient[^>]*>)(.*?)(</linearGradient>)", thin_gradient, defs, flags=re.S)
defs = re.sub(r"(\d+\.\d{2})\d+", r"\1", defs)
body = re.sub(r"(\d+\.\d{2})\d+", r"\1", body)
# La mesa de trabajo del .ai mide 1670 × 940,17: el recorte pasa a 1672 × 941.
defs = defs.replace("M 0 0 L 1670 0 L 1670 940.16 L 0 940.16 Z M 0 0", f"M 0 0 L {W} 0 L {W} {H} L 0 {H} Z")

# ---------------------------------------------------------------- piezas
GROUND = (f'<g id="pasto-fondo"><rect x="0" y="330" width="{W}" height="{H - 330}" fill="url(#g-lawn)"/></g>')

# Verdes de arbusto: oscuro (borde), base, luz y brillitos. Tres familias
# para que no salgan todos iguales.
BUSH_PALETTES = [
    ("#2e863d", "#43a34a", "#5fbd55", "#93d66b"),
    ("#33803a", "#4c9f43", "#6bba4e", "#a2d86a"),
    ("#2a7c44", "#3e9a54", "#57b468", "#8fd28a"),
]


def bush(cx, ground, w, h, pal=None):
    """Arbusto de lóbulos redondos, con borde oscuro, luz arriba a la
    izquierda, brillitos y sombra en el piso. Cada uno sale distinto."""
    dark, base, light, speck = pal or rnd.choice(BUSH_PALETTES)
    n = max(3, int(w / 24) + rnd.randint(0, 2))
    lobes = []
    for i in range(n):
        t = (i + .5) / n * 2 - 1                         # -1 … 1
        r = h * rnd.uniform(.32, .46) * (1 - .35 * abs(t))
        x = cx + t * (w / 2 - r * .8) + rnd.uniform(-4, 4)
        y = ground - r * .9 - h * .55 * (1 - t * t) * rnd.uniform(.75, 1)
        lobes.append((x, y, r))
    top = sorted(lobes, key=lambda l: l[1])[:max(2, n // 2)]
    for _ in range(rnd.randint(1, 2)):                   # algún lóbulo de arriba extra
        x, y, r = rnd.choice(top)
        lobes.append((x + rnd.uniform(-r, r) * .5, y - r * .35, r * .8))
    # fila de lóbulos chicos en la base: el borde de abajo queda ondulado
    k = max(4, int(w / 13))
    for i in range(k):
        rr = h * rnd.uniform(.2, .27)
        x = cx - w / 2 + rr + (w - 2 * rr) * i / (k - 1)
        lobes.append((x, ground - rr * .85, rr))
    lobes.sort(key=lambda l: -l[1])                      # los de abajo primero
    out = [f'<ellipse cx="{f(cx + 6)}" cy="{f(ground - 1)}" rx="{f(w * .58)}" ry="{f(4 + h * .07)}" fill="#256b2c" opacity=".3"/>']
    # relleno del cuerpo, para que no queden huecos entre lóbulos
    bx0, bx1 = cx - w / 2 + h * .25, cx + w / 2 - h * .25
    body_dark = f'<rect x="{f(bx0)}" y="{f(ground - h * .62)}" width="{f(bx1 - bx0)}" height="{f(h * .5)}" rx="{f(h * .2)}"/>'
    body_base = f'<rect x="{f(bx0)}" y="{f(ground - h * .6)}" width="{f(bx1 - bx0)}" height="{f(h * .46)}" rx="{f(h * .2)}"/>'
    out.append(f'<g fill="{dark}">' + "".join(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r + 2.5)}"/>' for x, y, r in lobes) + body_dark + "</g>")
    out.append(f'<g fill="{base}">' + "".join(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r)}"/>' for x, y, r in lobes) + body_base + "</g>")
    out.append(f'<g fill="{light}">' + "".join(
        f'<circle cx="{f(x - r * .2)}" cy="{f(y - r * .24)}" r="{f(r * .6)}"/>' for x, y, r in lobes if y < ground - h * .45) + "</g>")
    sp = []
    for x, y, r in rnd.sample(lobes, min(len(lobes), rnd.randint(2, 4))):
        sp.append(f'<ellipse cx="{f(x - r * .35)}" cy="{f(y - r * .45)}" rx="{f(r * .16)}" ry="{f(r * .11)}"/>')
    out.append(f'<g fill="{speck}" opacity=".9">{"".join(sp)}</g>')
    return "<g>" + "".join(out) + "</g>"


def flower(cx, cy, r=3.6):
    petals = "".join(
        f'<circle cx="{f(cx + r * 1.15 * dx)}" cy="{f(cy + r * 1.15 * dy)}" r="{f(r)}"/>'
        for dx, dy in ((0, -1), (.95, -.31), (.59, .81), (-.59, .81), (-.95, -.31)))
    return (f'<g><path d="M{f(cx)} {f(cy + r)} v{f(r * 2.2)}" stroke="#4d9a3a" stroke-width="1.6"/>'
            f'<g fill="#ffffff">{petals}</g><circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r * .8)}" fill="#f6c843"/></g>')


def tuft(x, y, s=1, col="#6db43e"):
    """Matita de pasto (hojitas en punta)."""
    return (f'<path d="M{f(x)} {f(y)} l{f(2 * s)} {f(-9 * s)} l{f(2 * s)} {f(7 * s)} l{f(3 * s)} {f(-12 * s)} '
            f'l{f(2 * s)} {f(11 * s)} l{f(3 * s)} {f(-8 * s)} l{f(2 * s)} {f(9 * s)}z" fill="{col}"/>')


def wood_fence(x0, x1, y):
    """Cerca de madera clarita a los costados, con sombra en el pasto."""
    out = [f'<rect x="{f(x0)}" y="{y + 54}" width="{f(x1 - x0)}" height="8" fill="#2f7a34" opacity=".25"/>']
    for ry in (y + 10, y + 32):
        out.append(f'<rect x="{f(x0)}" y="{ry}" width="{f(x1 - x0)}" height="10" rx="3" fill="#d9b07a"/>'
                   f'<rect x="{f(x0)}" y="{ry + 7}" width="{f(x1 - x0)}" height="3" fill="#b0834f"/>'
                   f'<rect x="{f(x0)}" y="{ry + 1}" width="{f(x1 - x0)}" height="2" fill="#eccb9c"/>')
    x = x0 + 14
    while x < x1 - 4:
        out.append(f'<path d="M{f(x)} {y + 56} v-50 q0 -8 7 -8 q7 0 7 8 v50 z" fill="#e2bb86"/>'
                   f'<rect x="{f(x + 9)}" y="{y + 2}" width="5" height="54" fill="#bf9160"/>'
                   f'<rect x="{f(x + 2)}" y="{y + 4}" width="2.5" height="50" fill="#f2d6aa"/>')
        x += 46
    return "".join(out)


def front_rail():
    """Baranda delante de la tribuna, como la referencia: pasamanos crema
    grueso, postes celestes y tablas abajo, con sombra en el pasto."""
    out = [f'<rect x="0" y="452" width="{W}" height="12" fill="url(#g-railshadow)"/>']
    # tablas de abajo
    out.append(f'<rect x="0" y="428" width="{W}" height="24" fill="#f0e3cd"/>'
               f'<rect x="0" y="428" width="{W}" height="3" fill="#fbf4e6"/>'
               f'<rect x="0" y="446" width="{W}" height="6" fill="#d8c5a8"/>')
    x = 30
    while x < W:
        out.append(f'<rect x="{x - 1}" y="431" width="2" height="15" fill="#e2d2b8"/>')
        x += 60
    # postes
    x = 0
    while x < W + 10:
        out.append(f'<rect x="{x}" y="402" width="11" height="50" rx="2" fill="#7fb7d8"/>'
                   f'<rect x="{x + 2}" y="404" width="3" height="46" fill="#b2d8ec"/>'
                   f'<rect x="{x + 8}" y="404" width="3" height="46" fill="#5f97ba"/>')
        x += 120
    # pasamanos
    out.append(f'<rect x="0" y="400" width="{W}" height="12" rx="3" fill="#efe6d8"/>'
               f'<rect x="0" y="401" width="{W}" height="3" fill="#fdf9f2"/>'
               f'<rect x="0" y="409" width="{W}" height="3" fill="#c7b6a1"/>'
               f'<rect x="0" y="412" width="{W}" height="4" fill="#5a7f8f" opacity=".18"/>')
    return "".join(out)


def track():
    out = [f'<rect x="0" y="536" width="{W}" height="{TRACK_TOP - 536 + 4}" fill="#c87e41"/>',
           f'<rect x="0" y="{TRACK_TOP}" width="{W}" height="{TRACK_BOTTOM - TRACK_TOP}" fill="url(#g-track)"/>']
    dots = []
    for _ in range(260):
        x, y = rnd.uniform(0, W), rnd.uniform(TRACK_TOP + 8, TRACK_BOTTOM - 8)
        dots.append(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(rnd.uniform(5, 16))}" ry="{f(rnd.uniform(1.2, 2.6))}"/>')
    out.append(f'<g fill="#e8955a" opacity=".35">{"".join(dots)}</g>')
    light = []
    for _ in range(120):
        x, y = rnd.uniform(0, W), rnd.uniform(TRACK_TOP + 8, TRACK_BOTTOM - 8)
        light.append(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{f(rnd.uniform(4, 12))}" ry="{f(rnd.uniform(1, 2))}"/>')
    out.append(f'<g fill="#ffd2a2" opacity=".45">{"".join(light)}</g>')
    # sombra suave del pasto sobre la pista
    out.append(f'<rect x="0" y="{TRACK_TOP + 8}" width="{W}" height="14" fill="url(#g-trackshadow)"/>')
    out.append(f'<rect x="0" y="{TRACK_TOP + 2}" width="{W}" height="6" fill="#fdf6ee"/>')
    for y in LANE_LINES:
        out.append(f'<rect x="0" y="{y - 2.5}" width="{W}" height="5" fill="#fdf6ee"/>'
                   f'<rect x="0" y="{y + 2.5}" width="{W}" height="2" fill="#e39758" opacity=".5"/>')
    out.append(f'<rect x="0" y="{TRACK_BOTTOM - 5}" width="{W}" height="5" fill="#e0904f"/>')
    return "".join(out)


def start_finish():
    out = [f'<rect x="{START_X - 6}" y="{TRACK_TOP + 2}" width="12" height="{TRACK_BOTTOM - TRACK_TOP - 2}" fill="#fdf9f3"/>']
    sq, cols = 18.5, 2
    x0 = FINISH_X - sq
    out.append(f'<rect x="{f(x0 - 2)}" y="{TRACK_TOP + 2}" width="{f(sq * cols + 4)}" height="{TRACK_BOTTOM - TRACK_TOP - 2}" fill="#ffffff"/>')
    blacks = []
    y, r = TRACK_TOP + 2, 0
    while y < TRACK_BOTTOM:
        h = min(sq, TRACK_BOTTOM - y)
        for c in range(cols):
            if (r + c) % 2 == 0:
                blacks.append(f'<rect x="{f(x0 + c * sq)}" y="{f(y)}" width="{f(sq)}" height="{f(h)}"/>')
        y += sq
        r += 1
    out.append(f'<g fill="#262626">{"".join(blacks)}</g>')
    return "".join(out)


def spread(x0, x1, n, jitter):
    """n posiciones repartidas entre x0 y x1, corridas al azar."""
    step = (x1 - x0) / n
    return [x0 + step * (i + .5) + rnd.uniform(-jitter, jitter) * step for i in range(n)]


def upper_grass():
    """Franja de pasto entre la baranda y la pista: más oscura arriba (la
    sombra de la baranda) y clara abajo, con arbustos sueltos y flores."""
    out = [f'<rect x="0" y="452" width="{W}" height="86" fill="url(#g-grass)"/>',
           f'<rect x="0" y="452" width="{W}" height="10" fill="url(#g-railshadow)"/>']
    for x in spread(10, W - 10, 8, .35):
        w = rnd.uniform(55, 115)
        out.append(bush(x, rnd.uniform(498, 512), w, w * rnd.uniform(.45, .6)))
        if rnd.random() < .4:                             # a veces uno chiquito al lado
            w2 = rnd.uniform(34, 50)
            out.append(bush(x + rnd.choice((-1, 1)) * (w / 2 + w2 * .3), rnd.uniform(506, 516), w2, w2 * .6))
    for _ in range(22):
        out.append(tuft(rnd.uniform(0, W), rnd.uniform(505, 534), rnd.uniform(.7, 1.1), "#86c545"))
    for x in spread(20, W - 20, 13, .45):
        out.append(flower(x, rnd.uniform(514, 530), rnd.uniform(3.2, 4)))
    return "".join(out)


def side_bits():
    out = [wood_fence(0, 150, 346), wood_fence(1528, W, 346)]
    out.append(bush(30, 406, 80, 34) + bush(122, 404, 46, 26))
    out.append(bush(1640, 406, 84, 36) + bush(1560, 404, 50, 28))
    return "".join(out)


def bottom_grass():
    out = [f'<rect x="0" y="{TRACK_BOTTOM}" width="{W}" height="{H - TRACK_BOTTOM}" fill="url(#g-bottom)"/>',
           f'<rect x="0" y="{TRACK_BOTTOM}" width="{W}" height="4" fill="#6aac3b"/>']
    x = 0
    while x < W:                                          # pasto que asoma sobre la pista
        out.append(tuft(x, TRACK_BOTTOM + 3, rnd.uniform(.6, 1), "#7cbd42"))
        x += rnd.uniform(40, 130)
    for x in spread(-20, W + 20, 6, .3):
        w = rnd.uniform(90, 170)
        out.append(bush(x, H + rnd.uniform(6, 14), w, min(56, w * rnd.uniform(.4, .52))))
    for x in spread(20, W - 20, 9, .4):
        out.append(flower(x, rnd.uniform(912, 930), rnd.uniform(3.4, 4.2)))
    return "".join(out)


GRADS = f"""
<linearGradient id="g-lawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ccf52"/><stop offset=".3" stop-color="#6dbb45"/><stop offset="1" stop-color="#5aa83f"/></linearGradient>
<linearGradient id="g-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5da43b"/><stop offset=".35" stop-color="#72b941"/><stop offset=".55" stop-color="#93cd4a"/><stop offset="1" stop-color="#9fd34c"/></linearGradient>
<linearGradient id="g-railshadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d6f2e" stop-opacity=".45"/><stop offset="1" stop-color="#2d6f2e" stop-opacity="0"/></linearGradient>
<linearGradient id="g-trackshadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9773d" stop-opacity=".35"/><stop offset="1" stop-color="#c9773d" stop-opacity="0"/></linearGradient>
<linearGradient id="g-track" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f9b06e"/><stop offset=".6" stop-color="#f9ad6b"/><stop offset="1" stop-color="#f6a865"/></linearGradient>
<linearGradient id="g-bottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ac442"/><stop offset="1" stop-color="#6aae3f"/></linearGradient>
"""

# El pasto va justo detrás de la tribuna y los árboles (después del cielo).
first_end = body.index("/>", body.index("<path")) + 2
body = body[:first_end] + GROUND + body[first_end:]

layers = [
    ("costados", side_bits()),
    ("baranda", front_rail()),
    ("pasto-y-arbustos", upper_grass()),
    ("pista", track()),
    ("salida-y-meta", start_finish()),
    ("pasto-de-adelante", bottom_grass()),
]

out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice">',
       f'<defs>{defs}{GRADS}</defs>',
       f'<g id="tu-dibujo">{body}</g>']
out += [f'<g id="{name}">{svg}</g>' for name, svg in layers]
out.append("</svg>")
open(sys.argv[2], "w").write("\n".join(out))
