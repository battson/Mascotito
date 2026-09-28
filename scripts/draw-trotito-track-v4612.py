"""Beta v4.6.12 hotfix 1 — pista de Trotito dibujada a mano en vectores.

Reemplaza a la versión trazada automáticamente desde escenario_carreras.png
(se veía manchada). Misma composición (tribuna de techos celestes, pasto,
pista naranja de 4 carriles, salida blanca y meta a cuadros), sin los
carteles de SALIDA y META, con más detalle: público de conejitos en la
tribuna, banderines con huellita, árboles de fondo, cerca, arbustos y
flores. Mismo lienzo (1672 × 941) y mismos carriles que usa js/trotito.js
(TROTITO_TRACK).

Uso: python scripts/draw-trotito-track-v4612.py  →  assets/games/trotito/escenario.svg
"""
import math
import os
import random

W, H = 1672, 941
rnd = random.Random(4612)
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "games", "trotito", "escenario.svg")

# Pista: bordes de carril (arriba de todo → abajo). Las patas pisan en
# TROTITO_TRACK.lanes[i].feet (612 / 700 / 800 / 878).
TRACK_TOP, TRACK_BOTTOM = 540, 892
LANE_LINES = [548, 628, 716, 806]
START_X, FINISH_X = 196, 1478

parts = []
add = parts.append


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def cloud(cx, cy, s, op=1):
    bumps = [(-60, 10, 34), (-25, -12, 42), (18, -20, 48), (58, -2, 38), (88, 14, 26), (-88, 18, 22)]
    circ = "".join(f'<circle cx="{f(cx + dx * s)}" cy="{f(cy + dy * s)}" r="{f(r * s)}"/>' for dx, dy, r in bumps)
    add(f'<g opacity="{op}"><g fill="#ffffff">{circ}<rect x="{f(cx - 95 * s)}" y="{f(cy + 8 * s)}" width="{f(200 * s)}" height="{f(32 * s)}" rx="{f(16 * s)}"/></g>'
        f'<path d="M{f(cx - 92 * s)} {f(cy + 30 * s)} h{f(190 * s)}" stroke="#d6ecfb" stroke-width="{f(8 * s)}" stroke-linecap="round"/></g>')


def tree(x, base, s, c1="#57b44a", c2="#76cc5c", trunk="#8a5a36"):
    add(f'<rect x="{f(x - 7 * s)}" y="{f(base - 60 * s)}" width="{f(14 * s)}" height="{f(60 * s)}" rx="{f(5 * s)}" fill="{trunk}"/>')
    add(f'<g fill="{c1}"><circle cx="{f(x)}" cy="{f(base - 92 * s)}" r="{f(46 * s)}"/><circle cx="{f(x - 38 * s)}" cy="{f(base - 70 * s)}" r="{f(34 * s)}"/>'
        f'<circle cx="{f(x + 38 * s)}" cy="{f(base - 72 * s)}" r="{f(36 * s)}"/></g>')
    add(f'<g fill="{c2}"><circle cx="{f(x - 10 * s)}" cy="{f(base - 104 * s)}" r="{f(26 * s)}"/><circle cx="{f(x - 40 * s)}" cy="{f(base - 80 * s)}" r="{f(16 * s)}"/>'
        f'<circle cx="{f(x + 26 * s)}" cy="{f(base - 88 * s)}" r="{f(18 * s)}"/></g>')


def bush(x, base, s, dark="#3f9a3a", light="#5dbb4c", hi="#86d465"):
    add(f'<g><path d="M{f(x - 60 * s)} {f(base)} q{f(-4 * s)} {f(-34 * s)} {f(26 * s)} {f(-40 * s)} q{f(10 * s)} {f(-30 * s)} {f(40 * s)} {f(-22 * s)} q{f(26 * s)} {f(-18 * s)} {f(44 * s)} {f(6 * s)} q{f(30 * s)} {f(0)} {f(24 * s)} {f(56 * s)}z" fill="{dark}"/>'
        f'<path d="M{f(x - 44 * s)} {f(base - 6 * s)} q{f(0)} {f(-26 * s)} {f(22 * s)} {f(-30 * s)} q{f(10 * s)} {f(-22 * s)} {f(34 * s)} {f(-14 * s)} q{f(22 * s)} {f(-10 * s)} {f(32 * s)} {f(10 * s)} q{f(18 * s)} {f(8 * s)} {f(8 * s)} {f(34 * s)}z" fill="{light}"/>'
        f'<path d="M{f(x - 26 * s)} {f(base - 34 * s)} q{f(12 * s)} {f(-16 * s)} {f(28 * s)} {f(-10 * s)}" stroke="{hi}" stroke-width="{f(5 * s)}" fill="none" stroke-linecap="round"/></g>')


def flower(x, y, s=1, petal="#ffffff", center="#ffcf3f"):
    pet = "".join(f'<circle cx="{f(x + math.cos(a) * 5 * s)}" cy="{f(y + math.sin(a) * 5 * s)}" r="{f(3.6 * s)}"/>' for a in [i * math.pi * 2 / 5 - math.pi / 2 for i in range(5)])
    add(f'<g fill="{petal}">{pet}</g><circle cx="{f(x)}" cy="{f(y)}" r="{f(2.6 * s)}" fill="{center}"/>')


def grass_tufts(y0, y1, n, color):
    d = []
    for _ in range(n):
        x = rnd.uniform(0, W)
        y = rnd.uniform(y0, y1)
        h = rnd.uniform(6, 12)
        d.append(f"M{f(x)} {f(y)} l{f(-3)} {f(-h)} M{f(x)} {f(y)} l{f(2)} {f(-h * 1.1)} M{f(x)} {f(y)} l{f(5)} {f(-h * .8)}")
    add(f'<path d="{" ".join(d)}" stroke="{color}" stroke-width="2.4" stroke-linecap="round" fill="none"/>')


def spectator(x, y, s, body, ear_in="#f7a8bb"):
    # Conejito del público: cabeza con orejas, visto de frente.
    add(f'<g transform="translate({f(x)} {f(y)}) scale({f(s)})">'
        f'<ellipse cx="-7" cy="-26" rx="5" ry="14" fill="{body}"/><ellipse cx="7" cy="-26" rx="5" ry="14" fill="{body}"/>'
        f'<ellipse cx="-7" cy="-25" rx="2.3" ry="9" fill="{ear_in}"/><ellipse cx="7" cy="-25" rx="2.3" ry="9" fill="{ear_in}"/>'
        f'<circle cx="0" cy="0" r="14" fill="{body}"/>'
        f'<circle cx="-5" cy="-1" r="1.9" fill="#2d2a2e"/><circle cx="5" cy="-1" r="1.9" fill="#2d2a2e"/>'
        f'<ellipse cx="0" cy="4" rx="2.4" ry="1.7" fill="#e7849a"/></g>')


# ------------------------------------------------------------------ Cielo
add('<defs>'
    '<linearGradient id="tt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb4f0"/><stop offset=".6" stop-color="#a9dcfb"/><stop offset="1" stop-color="#d9f1ff"/></linearGradient>'
    '<linearGradient id="tt-roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ccaf5"/><stop offset=".55" stop-color="#5aa7e6"/><stop offset="1" stop-color="#3f8ad0"/></linearGradient>'
    '<linearGradient id="tt-track" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3a86c"/><stop offset="1" stop-color="#eb955a"/></linearGradient>'
    '<linearGradient id="tt-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd461"/><stop offset="1" stop-color="#6ebf49"/></linearGradient>'
    '<linearGradient id="tt-grass2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc955"/><stop offset="1" stop-color="#5fae3f"/></linearGradient>'
    '<pattern id="tt-check" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#fbfbf7"/><rect width="12" height="12" fill="#2b2b30"/><rect x="12" y="12" width="12" height="12" fill="#2b2b30"/></pattern>'
    '<pattern id="tt-flagcheck" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#fbfbf7"/><rect width="8" height="8" fill="#2b2b30"/><rect x="8" y="8" width="8" height="8" fill="#2b2b30"/></pattern>'
    '</defs>')
add(f'<rect width="{W}" height="{H}" fill="url(#tt-sky)"/>')
cloud(210, 90, 1.05)
cloud(620, 70, .7, .95)
cloud(1320, 80, .95)
cloud(1560, 150, .6, .9)
cloud(930, 150, .5, .8)

# ------------------------------------------------------- Árboles de fondo
for x in range(-20, W + 80, 95):
    tree(x + rnd.uniform(-20, 20), 360, rnd.uniform(.8, 1.05), c1="#62b556", c2="#86cd6c")
add(f'<rect x="0" y="330" width="{W}" height="40" fill="#78c35e"/>')

# ------------------------------------------------------------ Tribuna
TL, TR = 140, 1532
roof_y, roof_h = 128, 64
cols = [TL + 30 + i * (TR - TL - 60) / 7 for i in range(8)]
# Columnas del techo
for x in cols:
    add(f'<rect x="{f(x - 7)}" y="{roof_y + 50}" width="14" height="{300 - roof_y}" fill="#eef2f4"/><rect x="{f(x + 2)}" y="{roof_y + 50}" width="5" height="{300 - roof_y}" fill="#c9d3da"/>')
# Techos: 7 lonas curvas
for i in range(7):
    x0, x1 = cols[i] - 10, cols[i + 1] + 10
    mid = (x0 + x1) / 2
    add(f'<path d="M{f(x0)} {roof_y + 34} Q{f(mid)} {roof_y - 18} {f(x1)} {roof_y + 34} L{f(x1)} {roof_y + 58} Q{f(mid)} {roof_y + 22} {f(x0)} {roof_y + 58}z" fill="url(#tt-roof)" stroke="#2f73b5" stroke-width="3" stroke-linejoin="round"/>')
    add(f'<path d="M{f(x0 + 18)} {roof_y + 30} Q{f(mid)} {roof_y - 6} {f(x1 - 18)} {roof_y + 30}" stroke="#c3e5fb" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>')
    # borde festoneado
    def edge(t):  # punto del borde de abajo de la lona (curva cuadrática)
        return (1 - t) ** 2 * x0 + 2 * t * (1 - t) * mid + t * t * x1, roof_y + (1 - t) ** 2 * 58 + 2 * t * (1 - t) * 22 + t * t * 58
    scal = "".join(f'<circle cx="{f(edge(t)[0])}" cy="{f(edge(t)[1] - 1)}" r="7"/>' for t in [(k + .5) / 7 for k in range(7)])
    add(f'<g fill="#3f8ad0">{scal}</g>')
# Gradas: filas escalonadas
rows = 6
stand_top, stand_bottom = 262, 420
row_h = (stand_bottom - stand_top) / rows
for r in range(rows):
    y = stand_top + r * row_h
    inset = (rows - r) * 6
    add(f'<rect x="{TL + 40 - inset}" y="{f(y)}" width="{TR - TL - 80 + inset * 2}" height="{f(row_h)}" fill="{"#f4efe3" if r % 2 == 0 else "#e8e0cf"}"/>')
    add(f'<rect x="{TL + 40 - inset}" y="{f(y + row_h - 7)}" width="{TR - TL - 80 + inset * 2}" height="7" fill="{"#b9dccb" if r % 2 == 0 else "#a6d1bc"}"/>')
# Escaleras
for sx in (TL + 120, (TL + TR) / 2 - 26, TR - 172):
    add(f'<rect x="{f(sx)}" y="{stand_top}" width="52" height="{stand_bottom - stand_top}" fill="#d7cbbb"/>')
    for r in range(rows * 2):
        add(f'<rect x="{f(sx)}" y="{f(stand_top + r * row_h / 2 + row_h / 2 - 3)}" width="52" height="3" fill="#b8a994"/>')
# Público: conejitos de colores, sentados en las gradas (menos en las escaleras)
coats = ["#fbf8f2", "#f1d9b5", "#d9c3a9", "#bfb3a8", "#f6e6c9", "#e9d4c6", "#c8a07c", "#9f8a7a"]
shirts = ["#f25c7a", "#4fb4ec", "#ffd34d", "#6cc56b", "#b98cf0", "#ff9f43"]
stairs = [(TL + 110, TL + 182), ((TL + TR) / 2 - 36, (TL + TR) / 2 + 36), (TR - 182, TR - 110)]
for r in range(rows - 1):
    y = stand_top + (r + 1) * row_h - 6
    x = TL + 70 + (r % 2) * 22
    while x < TR - 70:
        if not any(a < x < b for a, b in stairs) and rnd.random() < .6:
            s = .92 + r * .03
            add(f'<rect x="{f(x - 12 * s)}" y="{f(y - 4 * s)}" width="{f(24 * s)}" height="{f(12 * s)}" rx="{f(6 * s)}" fill="{rnd.choice(shirts)}"/>')
            spectator(x, y - 14 * s, s * .82, rnd.choice(coats))
        x += rnd.uniform(44, 64)
# Barandas laterales y frente de la tribuna
add(f'<path d="M{TL + 20} {stand_bottom} L{TL + 58} {stand_top - 4}" stroke="#7ab6dc" stroke-width="7" stroke-linecap="round"/>'
    f'<path d="M{TR - 20} {stand_bottom} L{TR - 58} {stand_top - 4}" stroke="#7ab6dc" stroke-width="7" stroke-linecap="round"/>')
add(f'<rect x="{TL}" y="{stand_bottom}" width="{TR - TL}" height="26" fill="#e3d8c6"/><rect x="{TL}" y="{stand_bottom}" width="{TR - TL}" height="5" fill="#f6f0e4"/>')

# Banderines con huellita en los costados
for bx in (48, W - 48):
    add(f'<rect x="{bx - 4}" y="236" width="8" height="200" rx="4" fill="#d9a441"/><circle cx="{bx}" cy="234" r="9" fill="#f2c24f" stroke="#b9862c" stroke-width="3"/>')
    fx = bx + (8 if bx < W / 2 else -8)
    sign = 1 if bx < W / 2 else -1
    add(f'<path d="M{fx} 252 h{sign * 58} v84 l{-sign * 29} -18 l{-sign * 29} 18z" fill="#6aa9e3" stroke="#3f7fc0" stroke-width="3" stroke-linejoin="round"/>')
    px = fx + sign * 29
    add(f'<g fill="#ffffff"><ellipse cx="{px}" cy="298" rx="12" ry="10"/><circle cx="{px - 12}" cy="282" r="5"/><circle cx="{px - 4}" cy="276" r="5"/><circle cx="{px + 5}" cy="276" r="5"/><circle cx="{px + 13}" cy="282" r="5"/></g>')

# Cerca del frente (tablas crema + postes celestes)
add(f'<rect x="0" y="440" width="{W}" height="12" fill="#e9dfcd"/><rect x="0" y="440" width="{W}" height="4" fill="#fbf6ec"/>')
add(f'<rect x="0" y="470" width="{W}" height="10" fill="#e9dfcd"/>')
for x in range(10, W, 92):
    add(f'<rect x="{x}" y="432" width="11" height="58" rx="3" fill="#8fc4e6"/><rect x="{x}" y="432" width="4" height="58" rx="2" fill="#bfe0f4"/>')

# ------------------------------------------------ Pasto de atrás
add(f'<rect x="0" y="486" width="{W}" height="{TRACK_TOP - 486 + 6}" fill="url(#tt-grass)"/>')
grass_tufts(496, 534, 120, "#6cb846")
for x in [60, 330, 640, 900, 1180, 1440, 1640]:
    bush(x + rnd.uniform(-30, 30), 520, rnd.uniform(.55, .75))
for _ in range(40):
    flower(rnd.uniform(0, W), rnd.uniform(500, 534), rnd.uniform(.7, 1), rnd.choice(["#ffffff", "#ffe0ec", "#fff4c2"]))

# ------------------------------------------------------------- Pista
add(f'<rect x="0" y="{TRACK_TOP}" width="{W}" height="{TRACK_BOTTOM - TRACK_TOP}" fill="url(#tt-track)"/>')
add(f'<rect x="0" y="{TRACK_TOP}" width="{W}" height="6" fill="#d9844d"/>')
# textura: puntitos de tierra
dots = "".join(f'<ellipse cx="{f(rnd.uniform(0, W))}" cy="{f(rnd.uniform(TRACK_TOP + 10, TRACK_BOTTOM - 6))}" rx="{f(rnd.uniform(2, 5))}" ry="{f(rnd.uniform(1, 2))}"/>' for _ in range(220))
add(f'<g fill="#e08a50" opacity=".55">{dots}</g>')
dots2 = "".join(f'<ellipse cx="{f(rnd.uniform(0, W))}" cy="{f(rnd.uniform(TRACK_TOP + 10, TRACK_BOTTOM - 6))}" rx="{f(rnd.uniform(1.5, 3.5))}" ry="{f(rnd.uniform(.8, 1.5))}"/>' for _ in range(160))
add(f'<g fill="#f8bf8b" opacity=".7">{dots2}</g>')
# líneas de carril
for y in LANE_LINES + [TRACK_BOTTOM - 4]:
    add(f'<rect x="0" y="{y - 3}" width="{W}" height="6" fill="#fffaf0"/><rect x="0" y="{y + 2}" width="{W}" height="2" fill="#d98a52" opacity=".5"/>')
# números de carril pintados antes de la salida
for i, (a, b) in enumerate(zip(LANE_LINES, LANE_LINES[1:] + [TRACK_BOTTOM - 4])):
    cy = (a + b) / 2
    add(f'<text x="{START_X - 88}" y="{f(cy + 15)}" font-family="Baloo 2, Arial Rounded MT Bold, sans-serif" font-weight="900" font-size="{f(34 + i * 3)}" text-anchor="middle" fill="#fff6ea" opacity=".85">{i + 1}</text>')
# salida: línea blanca doble
add(f'<rect x="{START_X - 7}" y="{LANE_LINES[0] - 3}" width="14" height="{TRACK_BOTTOM - LANE_LINES[0]}" fill="#fffaf0"/>')
add(f'<rect x="{START_X + 12}" y="{LANE_LINES[0] - 3}" width="4" height="{TRACK_BOTTOM - LANE_LINES[0]}" fill="#fffaf0" opacity=".8"/>')
# meta: franja a cuadros
add(f'<rect x="{FINISH_X - 18}" y="{LANE_LINES[0] - 3}" width="36" height="{TRACK_BOTTOM - LANE_LINES[0] + 1}" fill="url(#tt-check)" stroke="#2b2b30" stroke-width="2"/>')

# Postes de meta con banderas a cuadros (sin cartel)
for side, top in ((-1, 470), (1, 470)):
    px = FINISH_X + side * 34
    add(f'<rect x="{px - 4}" y="{top - 40}" width="8" height="{TRACK_TOP - top + 50}" rx="4" fill="#caa15a"/><circle cx="{px}" cy="{top - 42}" r="8" fill="#f2c24f" stroke="#b9862c" stroke-width="3"/>')
    d = side * 70
    add(f'<path d="M{px} {top - 34} q{f(d * .5)} -14 {d} 4 v44 q{f(-d * .5)} -18 {-d} -4z" fill="url(#tt-flagcheck)" stroke="#2b2b30" stroke-width="3" stroke-linejoin="round"/>')

# ------------------------------------------------ Pasto de adelante
add(f'<path d="M0 {TRACK_BOTTOM} H{W} V{H} H0z" fill="url(#tt-grass2)"/>')
add(f'<rect x="0" y="{TRACK_BOTTOM}" width="{W}" height="5" fill="#4f9a36" opacity=".6"/>')
grass_tufts(TRACK_BOTTOM + 12, H - 4, 160, "#4f9c37")
for x in [70, 420, 800, 1150, 1600]:
    bush(x + rnd.uniform(-40, 40), H + 8, rnd.uniform(.9, 1.2))
for _ in range(34):
    flower(rnd.uniform(0, W), rnd.uniform(TRACK_BOTTOM + 14, H - 8), rnd.uniform(.9, 1.3), rnd.choice(["#ffffff", "#ffd6e6", "#fff1b8"]))

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMax slice">'
       + "".join(parts) + "</svg>")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(svg)
print(OUT, len(svg))
