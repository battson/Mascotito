"""Mascota estilo Pet Society (v4.7): cuerpo nuevo + volumen y contorno.

Reescribe js/manifest.js una sola vez (si ya tiene "vol-cabeza", no hace nada):
- Torso frijol, brazos y piernas cápsula con la articulación centrada en los
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
FACE_SHIFT = 9  # tres cuartos: la cara se corre hacia la derecha (unidades del lienzo de 400)


def gradient(gid, cx=0.3):
    return (f'<radialGradient id="{gid}" cx="{cx}" cy="0.28" r="0.85">'
            '<stop offset="0" stop-color="#ffffff" stop-opacity="0.34"/>'
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
            f'    <path d="{capsule(a, b, True)}" {LINE} stroke-width="3.2"/>\n'
            '  </g>')


BODY = ("M200,184 C226,184 238,198 245,222 C253,249 257,271 241,281 "
        "C226,290 174,290 159,281 C143,271 147,249 155,222 C162,198 174,184 200,184 Z")

TORSO = f"""
  <defs>{gradient("vol-cuerpo")}<clipPath id="clip-cuerpo"><path d="{BODY}"/></clipPath></defs>
  <path d="{BODY}" class="cuerpo-base" fill="#6fb8e0"/>
  <path d="{BODY}" fill="url(#vol-cuerpo)"/>
  <ellipse clip-path="url(#clip-cuerpo)" cx="205" cy="252" rx="27" ry="27" fill="#ffffff" fill-opacity="0.3"/>
  <ellipse clip-path="url(#clip-cuerpo)" cx="202" cy="194" rx="50" ry="15" fill="#000000" fill-opacity="0.14"/>
  <path d="{BODY}" {LINE} stroke-width="3.6"/>"""

ARMS = "\n" + f"  <defs>{gradient('vol-brazo')}</defs>\n" + "\n".join([
    limb("brazo-izq", "brazo", (178.1, 198.8, 10), (153, 245, 12), "vol-brazo"),
    limb("brazo-der", "brazo", (221.2, 198.8, 10), (247.2, 245, 12), "vol-brazo"),
])

LEGS = "\n" + f"  <defs>{gradient('vol-pierna')}</defs>\n" + "\n".join([
    limb("pierna-izq", "pierna", (175.3, 264.1, 13), (172, 300, 15), "vol-pierna"),
    limb("pierna-der", "pierna", (224.0, 264.1, 13), (227.4, 300, 15), "vol-pierna"),
])

MUZZLE = (f'<g class="hocico" transform="translate({FACE_SHIFT} 0)">'
          '<ellipse cx="200" cy="185" rx="28" ry="15.5" fill="#ffffff" fill-opacity="0.45"/>'
          '<ellipse cx="157" cy="181" rx="11" ry="6" fill="#ff6f91" fill-opacity="0.32"/>'
          '<ellipse cx="243" cy="181" rx="11" ry="6" fill="#ff6f91" fill-opacity="0.32"/></g>')


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
                         f'transform="rotate(-25 {f(gx)} {f(gy)})" fill="#ffffff" fill-opacity="0.38"/>')
                first[0] = False
            return (pm.group(0) + f'<path d="{d}" fill="url(#vol-cabeza)"/>' + gloss
                    + f'<path d="{d}" {LINE} stroke-width="3"/>')

        inner = re.sub(r'<path d="([^"]*)" class="cabeza-base" fill="[^"]*"/>', overlay, inner)
        return m.group(1) + f"\n    <defs>{gradient('vol-cabeza')}</defs>" + inner.rstrip() + f"\n    {MUZZLE}" + m.group(3)

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
            + f'<path d="{pm.group(1)}" {LINE} stroke-width="3"/>',
            inner)
        return m.group(1) + f"\n    <defs>{gradient('vol-oreja')}</defs>" + inner + m.group(3)

    block = re.sub(r"(inline: `)(.*?)(`)", per_inline, block, flags=re.S)
    return src[:start] + block + src[end:]


def main():
    src = MANIFEST.read_text(encoding="utf-8")
    if "vol-cabeza" in src:
        print("manifest.js ya tiene el volumen nuevo; no se toca.")
        return 0
    src = replace_const(src, "PET_TORSO_INLINE", TORSO)
    src = replace_const(src, "PET_ARMS_INLINE", ARMS)
    src = replace_const(src, "PET_LEGS_INLINE", LEGS)
    src = shade_heads(src)
    src = shade_ears(src)
    MANIFEST.write_text(src, encoding="utf-8")
    print("manifest.js actualizado: cuerpo nuevo, volumen en cabezas y orejas, hocico en tres cuartos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
