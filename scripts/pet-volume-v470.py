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
LIGHT = "0.16"   # blanco del degradado (antes 0.34)
GLOSS = "0.18"   # brillo de la frente (antes 0.38)
BELLY = "0.16"   # panza (antes 0.3)


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
            f'    <path d="{d}" class="{cls}-base" fill="#6fb8e0"/>\n'
            f'    <path d="{d}" fill="url(#{grad})"/>\n'
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
             arm=(7, (167, 236), 8.5), leg=(9, (174, 302), 10.5))


def body(shape):
    top, bottom, wt, wb = shape["top"], shape["bottom"], shape["wt"], shape["wb"]
    d = pear(top, bottom, wt, wb)
    torso = f"""
  <defs>{gradient("vol-cuerpo")}<clipPath id="clip-cuerpo"><path d="{d}"/></clipPath></defs>
  <path d="{d}" class="cuerpo-base" fill="#6fb8e0"/>
  <path d="{d}" fill="url(#vol-cuerpo)"/>
  <ellipse clip-path="url(#clip-cuerpo)" cx="203" cy="{f((top + bottom) / 2 + 12)}" rx="{f(wb * 0.58)}" ry="{f((bottom - top) * 0.27)}" fill="#ffffff" fill-opacity="{BELLY}"/>
  <ellipse clip-path="url(#clip-cuerpo)" cx="202" cy="{f(top + 9)}" rx="{f(wt + 14)}" ry="14" fill="#000000" fill-opacity="0.14"/>
{f'{chr(10)}  <path d="{d}" {LINE} stroke-width="3.4"/>' if OUTLINES else ""}"""
    ar, (hx, hy), hr = shape["arm"]
    lr, (fx, fy), fr = shape["leg"]
    arms = "\n" + f"  <defs>{gradient('vol-brazo')}</defs>\n" + "\n".join([
        limb("brazo-izq", "brazo", (178.1, 198.8, round(ar, 2)), (hx, hy, hr), "vol-brazo"),
        limb("brazo-der", "brazo", (221.2, 198.8, round(ar, 2)), (round(399.3 - hx, 2), hy, hr), "vol-brazo"),
    ])
    legs = "\n" + f"  <defs>{gradient('vol-pierna')}</defs>\n" + "\n".join([
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
    return src


def main():
    src = MANIFEST.read_text(encoding="utf-8")
    torso, arms, legs = body(SHAPE)
    src = replace_const(src, "PET_TORSO_INLINE", torso)
    src = replace_const(src, "PET_ARMS_INLINE", arms)
    src = replace_const(src, "PET_LEGS_INLINE", legs)
    if "vol-cabeza" in src:
        src = restyle(src)
        MANIFEST.write_text(src, encoding="utf-8")
        print("manifest.js: cuerpo actualizado (cabezas y orejas ya tenían volumen).")
        return 0
    src = shade_heads(src)
    src = shade_ears(src)
    MANIFEST.write_text(src, encoding="utf-8")
    print("manifest.js actualizado: cuerpo nuevo, volumen en cabezas y orejas, hocico en tres cuartos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
