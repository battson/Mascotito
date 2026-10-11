"""Mascota estilo Pet Society (v4.7): cuerpo nuevo + volumen y contorno.

Reescribe js/manifest.js. El cuerpo se rehace siempre (medidas en SHAPE); las
cabezas y orejas, solo si todavía no tienen "vol-cabeza":
- Torso pera, brazos y piernas cápsula con la articulación centrada en los
  mismos puntos de giro que usa el juego (hombros 178.1/221.2,198.8 y caderas
  175.3/224.0,264.1), con contorno abierto que no marca la unión al cuerpo.
- Cabezas y orejas: se saca la capa negra al 6 % y se agrega encima de la
  forma base un degradado radial (blanco arriba a la izquierda, negro en el
  borde), un contorno negro al 30 % y, en la cabeza, un brillo y el hocico con
  cachetes (corrido 9 unidades: vista en tres cuartos).
Todo es blanco o negro con transparencia, así sirve para cualquier color.
Guía: diseños/mascota/README.md.
"""
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "js" / "manifest.js"

LINE = 'fill="none" stroke="#000000" stroke-opacity="0.3" stroke-linecap="round" stroke-linejoin="round"'
# v4.6.15: Jony pidió sin contornos, sin hocico ni cachetes y brillos más suaves.
OUTLINES = False
# v4.6.16: Jony pidió personajes planos como en Pet Society: sin degradado,
# sin brillo, sin panza ni sombra de la cabeza.
VOLUME = False
LIGHT = "0.16"   # blanco del degradado (antes 0.34)
GLOSS = "0.18"   # brillo de la frente (antes 0.38)
BELLY = "0.16"   # panza (antes 0.3)
# v4.6.20: Jony pidió una sombra leve y un contorno del mismo tono que cada
# pieza. El contorno va DEBAJO de la forma (solo se ve la mitad de afuera):
# un trazo del color del cuerpo (CSS .borde-color) y encima negro al 30 %, o
# sea, el mismo color más oscuro. La sombra es una media luna plana abajo a la
# derecha (luz arriba a la izquierda), negra al 12 %, recortada a la forma.
BORDER = True
SHADOW = "0.12"


def border(d, w):
    """Contorno del tono de la pieza: va antes (debajo) de la forma base."""
    j = 'fill="none" stroke-linecap="round" stroke-linejoin="round"'
    return (f'<path d="{d}" class="borde-color" {j} stroke="#6fb8e0" stroke-width="{w}"/>'
            f'<path d="{d}" class="borde-sombra" {j} stroke="#000000" stroke-opacity="0.3" stroke-width="{w}"/>')


def path_bbox(d):
    """Caja exacta de un trazado SVG (M L H V C Q A Z, absolutos o relativos)."""
    toks = re.findall(r"[MLHVCSQTAZmlhvcsqtaz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?", d)
    pts, i, cmd = [], 0, None
    x = y = sx = sy = 0.0
    nargs = dict(M=2, L=2, H=1, V=1, C=6, S=4, Q=4, T=2, A=7, Z=0)

    def bez(p0, *cs, n=24):
        for k in range(n + 1):
            t = k / n
            if len(cs) == 2:
                (x1, y1), (x2, y2) = cs
                mt = 1 - t
                pts.append((mt * mt * p0[0] + 2 * mt * t * x1 + t * t * x2, mt * mt * p0[1] + 2 * mt * t * y1 + t * t * y2))
            else:
                (x1, y1), (x2, y2), (x3, y3) = cs
                mt = 1 - t
                pts.append((mt ** 3 * p0[0] + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t ** 3 * x3,
                            mt ** 3 * p0[1] + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t ** 3 * y3))

    def arc(x1, y1, rx, ry, phi, fa, fs, x2, y2, n=48):
        rx, ry = abs(rx), abs(ry)
        if not rx or not ry:
            pts.append((x2, y2))
            return
        c, s_ = math.cos(math.radians(phi)), math.sin(math.radians(phi))
        dx2, dy2 = (x1 - x2) / 2, (y1 - y2) / 2
        x1p, y1p = c * dx2 + s_ * dy2, -s_ * dx2 + c * dy2
        lam = x1p ** 2 / rx ** 2 + y1p ** 2 / ry ** 2
        if lam > 1:
            rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
        num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
        coef = math.sqrt(max(0, num / (rx * rx * y1p * y1p + ry * ry * x1p * x1p)))
        if fa == fs:
            coef = -coef
        cxp, cyp = coef * rx * y1p / ry, -coef * ry * x1p / rx
        cx, cy = c * cxp - s_ * cyp + (x1 + x2) / 2, s_ * cxp + c * cyp + (y1 + y2) / 2
        ang = lambda ux, uy, vx, vy: math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
        t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
        dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
        if not fs and dt > 0:
            dt -= 2 * math.pi
        elif fs and dt < 0:
            dt += 2 * math.pi
        for k in range(n + 1):
            t = t1 + dt * k / n
            pts.append((cx + rx * math.cos(t) * c - ry * math.sin(t) * s_,
                        cy + rx * math.cos(t) * s_ + ry * math.sin(t) * c))

    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]
            i += 1
            if cmd in "Zz":
                x, y = sx, sy
                continue
        up, rel = cmd.upper(), cmd.islower()
        a = [float(v) for v in toks[i:i + nargs[up]]]
        i += nargs[up]
        ox, oy = (x, y) if rel else (0, 0)
        if up in "ML":
            x, y = a[0] + ox, a[1] + oy
            pts.append((x, y))
            if up == "M":
                sx, sy = x, y
                cmd = "l" if rel else "L"
        elif up == "H":
            x = a[0] + ox
            pts.append((x, y))
        elif up == "V":
            y = a[0] + oy
            pts.append((x, y))
        elif up == "C":
            bez((x, y), (a[0] + ox, a[1] + oy), (a[2] + ox, a[3] + oy), (a[4] + ox, a[5] + oy))
            x, y = a[4] + ox, a[5] + oy
        elif up == "Q":
            bez((x, y), (a[0] + ox, a[1] + oy), (a[2] + ox, a[3] + oy))
            x, y = a[2] + ox, a[3] + oy
        elif up == "A":
            arc(x, y, a[0], a[1], a[2], int(a[3]), int(a[4]), a[5] + ox, a[6] + oy)
            x, y = a[5] + ox, a[6] + oy
        else:
            raise ValueError(f"comando {cmd} no soportado")
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def shadow(d, cid, dx, dy):
    """Media luna plana: la forma menos la misma forma corrida arriba a la izquierda.

    Va con máscara (no con recorte de un rectángulo grande) para que la caja de
    la pieza (getBBox, transform-box: fill-box) sea la de la forma: con el
    rectángulo, las orejas giraban desde un punto lejano y salían volando.
    """
    x0, y0, x1, y1 = path_bbox(d)
    return (f'<g class="sombra"><defs><mask id="{cid}" maskUnits="userSpaceOnUse" '
            f'x="{f(x0 - 2)}" y="{f(y0 - 2)}" width="{f(x1 - x0 + 4)}" height="{f(y1 - y0 + 4)}">'
            f'<rect x="{f(x0 - 2)}" y="{f(y0 - 2)}" width="{f(x1 - x0 + 4)}" height="{f(y1 - y0 + 4)}" fill="#ffffff"/>'
            f'<path d="{d}" fill="#000000" transform="translate({-dx} {-dy})"/></mask></defs>'
            f'<path d="{d}" fill="#000000" fill-opacity="{SHADOW}" mask="url(#{cid})"/></g>')


def gradient(gid, cx=0.3):
    return (f'<radialGradient id="{gid}" cx="{cx}" cy="0.28" r="0.85">'
            f'<stop offset="0" stop-color="#ffffff" stop-opacity="{LIGHT}"/>'
            '<stop offset="0.32" stop-color="#ffffff" stop-opacity="0"/>'
            '<stop offset="0.62" stop-color="#000000" stop-opacity="0"/>'
            '<stop offset="1" stop-color="#000000" stop-opacity="0.2"/></radialGradient>')


def f(n):
    return f"{n:.2f}"


def capsule(a, b, open_=False):
    """Contorno de dos círculos (x, y, r) unidos por sus tangentes externas."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    d = math.hypot(dx, dy)
    ang = math.atan2(dy, dx)
    t = math.acos((a[2] - b[2]) / d)
    p = lambda c, th: (c[0] + c[2] * math.cos(th), c[1] + c[2] * math.sin(th))
    a1, b1, b2, a2 = p(a, ang + t), p(b, ang + t), p(b, ang - t), p(a, ang - t)
    s = (f"M{f(a1[0])},{f(a1[1])} L{f(b1[0])},{f(b1[1])} "
         f"A{b[2]},{b[2]} 0 1,0 {f(b2[0])},{f(b2[1])} L{f(a2[0])},{f(a2[1])}")
    return s if open_ else s + f" A{a[2]},{a[2]} 0 0,0 {f(a1[0])},{f(a1[1])} Z"


def limb(gid, cls, a, b, grad):
    d = capsule(a, b)
    return (f'  <g id="{gid}" class="{cls}" style="transform-origin: {a[0]}px {a[1]}px;">\n'
            # contorno abierto: no marca la unión con el cuerpo
            + (f'    {border(capsule(a, b, True), 5)}\n' if BORDER else "")
            + f'    <path d="{d}" class="{cls}-base" fill="#6fb8e0"/>\n'
            + (f'    {shadow(d, "sombra-" + gid, 2.5, 3)}\n' if BORDER else "")
            + (f'    <path d="{d}" fill="url(#{grad})"/>\n' if VOLUME else "")
            + (f'    <path d="{capsule(a, b, True)}" {LINE} stroke-width="3.2"/>\n' if OUTLINES else "")
            + '  </g>')


def pear(top, bottom, wt, wb, cx=200):
    """Torso pera: wt = medio ancho en los hombros, wb = medio ancho abajo."""
    T, B = top, bottom
    sh = (cx + wt + 0.15 * (wb - wt), T + 28)
    hip = (cx + wb - 6, B - 6)
    r = lambda x, y: f"{f(x)},{f(y)}"
    m = lambda x: 2 * cx - x
    return (f"M{r(cx, T)} C{r(cx + 0.62 * wt, T)} {r(cx + wt, T + 10)} {r(*sh)} "
            f"C{r(cx + wt + 0.5 * (wb - wt), T + 52)} {r(cx + wb + 2, B - 18)} {r(*hip)} "
            f"C{r(hip[0] - 10, B + 2)} {r(m(hip[0] - 10), B + 2)} {r(m(hip[0]), hip[1])} "
            f"C{r(m(cx + wb + 2), B - 18)} {r(m(cx + wt + 0.5 * (wb - wt)), T + 52)} {r(m(sh[0]), sh[1])} "
            f"C{r(m(cx + wt), T + 10)} {r(m(cx + 0.62 * wt), T)} {r(cx, T)} Z")


# Proporciones tipo Pet Society (v4.6.14): cabeza grande y cuerpo chico y angosto,
# brazos y piernas finitos. Los puntos de giro no cambian.
SHAPE = dict(top=188, bottom=280, wt=27, wb=40,
             arm=(7, (152, 233), 8.5), leg=(9, (174, 302), 10.5))


def body(shape):
    top, bottom, wt, wb = shape["top"], shape["bottom"], shape["wt"], shape["wb"]
    d = pear(top, bottom, wt, wb)
    if VOLUME:
        torso = f"""
  <defs>{gradient("vol-cuerpo")}<clipPath id="clip-cuerpo"><path d="{d}"/></clipPath></defs>
  <path d="{d}" class="cuerpo-base" fill="#6fb8e0"/>
  <path d="{d}" fill="url(#vol-cuerpo)"/>
  <ellipse clip-path="url(#clip-cuerpo)" cx="203" cy="{f((top + bottom) / 2 + 12)}" rx="{f(wb * 0.58)}" ry="{f((bottom - top) * 0.27)}" fill="#ffffff" fill-opacity="{BELLY}"/>
  <ellipse clip-path="url(#clip-cuerpo)" cx="202" cy="{f(top + 9)}" rx="{f(wt + 14)}" ry="14" fill="#000000" fill-opacity="0.14"/>"""
    else:
        torso = f"""
  <path d="{d}" class="cuerpo-base" fill="#6fb8e0"/>"""
    if BORDER:
        torso = (f"\n  {border(d, 5.5)}" + torso
                 + f"\n  {shadow(d, 'sombra-cuerpo', 4, 5)}")
    if OUTLINES:
        torso += f'\n  <path d="{d}" {LINE} stroke-width="3.4"/>'
    ar, (hx, hy), hr = shape["arm"]
    lr, (fx, fy), fr = shape["leg"]
    arms = "\n" + (f"  <defs>{gradient('vol-brazo')}</defs>\n" if VOLUME else "") + "\n".join([
        limb("brazo-izq", "brazo", (178.1, 198.8, round(ar, 2)), (hx, hy, hr), "vol-brazo"),
        limb("brazo-der", "brazo", (221.2, 198.8, round(ar, 2)), (round(399.3 - hx, 2), hy, hr), "vol-brazo"),
    ])
    legs = "\n" + (f"  <defs>{gradient('vol-pierna')}</defs>\n" if VOLUME else "") + "\n".join([
        limb("pierna-izq", "pierna", (175.3, 264.1, lr), (fx, fy, fr), "vol-pierna"),
        limb("pierna-der", "pierna", (224.0, 264.1, lr), (round(399.3 - fx, 2), fy, fr), "vol-pierna"),
    ])
    return torso, arms, legs


def bbox(d):
    nums = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", d)]
    xs, ys = nums[0::2], nums[1::2]
    return min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)


def replace_const(src, name, markup):
    pattern = re.compile(r"(const " + name + r" = `)(.*?)(`;)", re.S)
    assert pattern.search(src), name
    return pattern.sub(lambda m: m.group(1) + markup + m.group(3), src, count=1)


def shade_heads(src):
    start = src.index("  cabeza: [")
    end = src.index("  orejas: [")
    block = src[start:end]

    def per_inline(m):
        inner = m.group(2)
        inner = re.sub(r'\n?\s*<path d="[^"]*" fill="#000000" fill-opacity="0\.06"/>', "", inner)
        first = [True]

        def overlay(pm):
            d = pm.group(1)
            x, y, w, h = bbox(d)
            gloss = ""
            if first[0]:
                gx, gy = x + w * 0.29, y + h * 0.22
                gloss = (f'<ellipse cx="{f(gx)}" cy="{f(gy)}" rx="{f(w * 0.1)}" ry="{f(h * 0.06)}" '
                         f'transform="rotate(-25 {f(gx)} {f(gy)})" fill="#ffffff" fill-opacity="{GLOSS}"/>')
                first[0] = False
            return (pm.group(0) + f'<path d="{d}" fill="url(#vol-cabeza)"/>' + gloss
                    + (f'<path d="{d}" {LINE} stroke-width="3"/>' if OUTLINES else ""))

        inner = re.sub(r'<path d="([^"]*)" class="cabeza-base" fill="[^"]*"/>', overlay, inner)
        return m.group(1) + f"\n    <defs>{gradient('vol-cabeza')}</defs>" + inner.rstrip() + m.group(3)

    block = re.sub(r"(inline: `)(.*?)(`)", per_inline, block, flags=re.S)
    return src[:start] + block + src[end:]


def shade_ears(src):
    start = src.index("  orejas: [")
    end = src.index("  ojos: [")
    block = src[start:end]

    def per_inline(m):
        inner = re.sub(r'<path d="[^"]*" fill="#000000" fill-opacity="0\.06"/>', "", m.group(2))
        inner = re.sub(
            r'<path d="([^"]*)" class="oreja-base" fill="[^"]*"/>',
            lambda pm: pm.group(0) + f'<path d="{pm.group(1)}" fill="url(#vol-oreja)"/>'
            + (f'<path d="{pm.group(1)}" {LINE} stroke-width="3"/>' if OUTLINES else ""),
            inner)
        return m.group(1) + f"\n    <defs>{gradient('vol-oreja')}</defs>" + inner + m.group(3)

    block = re.sub(r"(inline: `)(.*?)(`)", per_inline, block, flags=re.S)
    return src[:start] + block + src[end:]


def restyle(src):
    """Pasa cabezas y orejas ya sombreadas al estilo actual (contornos, hocico, brillos)."""
    if not OUTLINES:
        src = re.sub(r'<path d="[^"]*" ' + re.escape(LINE) + r' stroke-width="[\d.]+"/>', "", src)
    src = re.sub(r'\n?\s*<g class="hocico"[^>]*>.*?</g>', "", src, flags=re.S)
    src = src.replace('stop-color="#ffffff" stop-opacity="0.34"', f'stop-color="#ffffff" stop-opacity="{LIGHT}"')
    src = re.sub(r'(transform="rotate\(-25 [^"]*\)" fill="#ffffff" fill-opacity=")0\.38"', r'\g<1>' + GLOSS + '"', src)
    if not VOLUME:
        src = re.sub(r'\n?\s*<defs><radialGradient id="vol-[a-z]+".*?</radialGradient></defs>', "", src, flags=re.S)
        src = re.sub(r'<path d="[^"]*" fill="url\(#vol-[a-z]+\)"/>', "", src)
        src = re.sub(r'<ellipse [^>]*transform="rotate\(-25 [^"]*\)" fill="#ffffff" fill-opacity="[\d.]+"/>', "", src)
    return src


def outline_parts(src):
    """Cabezas y orejas: contorno debajo y sombra encima de cada forma base."""
    a, b = src.index("  cabeza: ["), src.index("  ojos: [")
    part = re.sub(r'<path d="[^"]*" class="borde-(?:color|sombra)"[^>]*/>', "", src[a:b])
    src = src[:a] + re.sub(
        r'<g class="sombra"><defs>(?:<clipPath[^>]*>.*?</clipPath></defs><g clip-path="[^"]*"><path[^>]*/></g>'
        r'|<mask[^>]*>.*?</mask></defs><path[^>]*/>)</g>', "", part, flags=re.S) + src[b:]
    if not BORDER:
        return src
    for key, nxt, cls, w, dx, dy in (("cabeza", "orejas", "cabeza-base", 6, 6, 8),
                                    ("orejas", "ojos", "oreja-base", 5, 3, 4)):
        start = src.index(f"  {key}: [")
        end = src.index(f"  {nxt}: [")
        block = src[start:end]
        n = [0]

        def add(pm):
            n[0] += 1
            d = pm.group(1)
            return border(d, w) + pm.group(0) + shadow(d, f"sombra-{key}-{n[0]}", dx, dy)

        block = re.sub(r'<path d="([^"]*)" class="' + cls + r'" fill="[^"]*"/>', add, block)
        src = src[:start] + block + src[end:]
    return src


def main():
    src = MANIFEST.read_text(encoding="utf-8")
    torso, arms, legs = body(SHAPE)
    src = replace_const(src, "PET_TORSO_INLINE", torso)
    src = replace_const(src, "PET_ARMS_INLINE", arms)
    src = replace_const(src, "PET_LEGS_INLINE", legs)
    # Cabezas y orejas originales: todavía tienen la capa negra al 6 %.
    parts = src[src.index("  cabeza: ["):src.index("  ojos: [")]
    if 'fill="#000000" fill-opacity="0.06"' in parts:
        src = shade_heads(src)
        src = shade_ears(src)
    src = restyle(src)
    src = outline_parts(src)
    MANIFEST.write_text(src, encoding="utf-8")
    print("manifest.js actualizado: cuerpo, cabezas y orejas con el estilo actual.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
