"""Íconos planos de la barra de acciones (v4.6.19).

Mismo estilo que la mascota y la ropa: colores planos, sin degradado ni
brillo; desde v4.6.20, con un contorno del mismo color más oscuro y una sombra
plana abajo a la derecha. Cada ícono es un SVG chico (viewBox 0 0 100 100) que
reemplaza al trazado con vtracer en assets/ui/actions/. Como pesan poco, ya no
necesitan la copia WebP del modo liviano (LITE_ART en js/config.js).
"""
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "ui" / "actions"


def f(n):
    return f"{n:.1f}".rstrip("0").rstrip(".")


def svg(title, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">'
            f"<title>{title}</title>{body}</svg>\n")


def star_rays(cx, cy, r_in, r_out, n, width, color):
    parts = []
    for k in range(n):
        a = 2 * math.pi * k / n - math.pi / 2
        da = width / 2
        p1 = (cx + r_in * math.cos(a - da), cy + r_in * math.sin(a - da))
        p2 = (cx + r_out * math.cos(a), cy + r_out * math.sin(a))
        p3 = (cx + r_in * math.cos(a + da), cy + r_in * math.sin(a + da))
        parts.append(f"M{f(p1[0])},{f(p1[1])} L{f(p2[0])},{f(p2[1])} L{f(p3[0])},{f(p3[1])} Z")
    d = " ".join(parts)
    return (f'<path d="{d}" fill="none" stroke="{darker(color)}" stroke-width="7.6" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="{color}" stroke="{color}" stroke-width="5" stroke-linejoin="round"/>')


def pentagon(cx, cy, r, rot=0):
    pts = [(cx + r * math.cos(rot + 2 * math.pi * k / 5 - math.pi / 2),
            cy + r * math.sin(rot + 2 * math.pi * k / 5 - math.pi / 2)) for k in range(5)]
    return "M" + " L".join(f"{f(x)},{f(y)}" for x, y in pts) + " Z"


def darker(color, k=0.72):
    r, g, b = (int(color[i:i + 2], 16) for i in (1, 3, 5))
    return "#" + "".join(f"{round(v * k):02x}" for v in (r, g, b))


def o(color, w=3.4):
    """Relleno con contorno del mismo color más oscuro (el trazo queda debajo)."""
    return (f'fill="{color}" stroke="{darker(color)}" stroke-width="{w}" '
            'stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"')


def shadow(d, cid, dx=3, dy=4):
    """Sombra plana abajo a la derecha, recortada a la forma (como la mascota)."""
    return (f'<defs><clipPath id="{cid}"><path d="{d}"/></clipPath></defs>'
            f'<g clip-path="url(#{cid})"><path d="M-50,-50 H150 V150 H-50 Z {d}" fill-rule="evenodd" '
            f'fill="#000000" fill-opacity="0.12" transform="translate({-dx} {-dy})"/></g>')


def circle_d(cx, cy, r):
    return f"M{f(cx - r)},{f(cy)} A{f(r)},{f(r)} 0 1,0 {f(cx + r)},{f(cy)} A{f(r)},{f(r)} 0 1,0 {f(cx - r)},{f(cy)} Z"


def rrect_d(x, y, w, h, r):
    return (f"M{f(x + r)},{f(y)} H{f(x + w - r)} A{f(r)},{f(r)} 0 0,1 {f(x + w)},{f(y + r)} V{f(y + h - r)} "
            f"A{f(r)},{f(r)} 0 0,1 {f(x + w - r)},{f(y + h)} H{f(x + r)} A{f(r)},{f(r)} 0 0,1 {f(x)},{f(y + h - r)} "
            f"V{f(y + r)} A{f(r)},{f(r)} 0 0,1 {f(x + r)},{f(y)} Z")


LID = "M14,44 L14,36 C14,22 26,16 50,16 C74,16 86,22 86,36 L86,44 Z"
CHEST = rrect_d(12, 42, 76, 42, 7)
SHIRT = ("M34,14 L18,21 L6,40 L19,48 L26,38 L26,86 L74,86 L74,38 L81,48 L94,40 L82,21 L66,14 "
         "C62,22 38,22 34,14 Z")
BAG = "M20,32 L80,32 L86,88 L14,88 Z"
MOON = "M42.7,16.1 A38,38 0 1,0 81.9,66.5 A32,32 0 1,1 42.7,16.1 Z"
SUN = circle_d(50, 50, 28)
BALL = circle_d(50, 50, 40)
SOAP = rrect_d(10, 34, 72, 44, 16)

ICONS = {
    "05-chest.svg": svg("Inventario", (
        # tapa (media luna), cuerpo, herrajes y cerradura
        f'<path d="{LID}" {o("#c07a45")}/>'
        + shadow(LID, "sombra-tapa", 3, 4)
        + f'<path d="{CHEST}" {o("#a5643a")}/>'
        '<rect x="12" y="42" width="76" height="8" fill="#8a5130"/>'
        + shadow(CHEST, "sombra-cofre")
        + f'<rect x="22" y="17" width="9" height="67" {o("#f2c230", 2.4)}/>'
        f'<rect x="69" y="17" width="9" height="67" {o("#f2c230", 2.4)}/>'
        f'<rect x="10" y="40" width="80" height="6" rx="3" {o("#f2c230", 2.4)}/>'
        f'<rect x="41" y="38" width="18" height="22" rx="4" {o("#f7d65c", 2.4)}/>'
        '<circle cx="50" cy="47" r="3.6" fill="#6b3f22"/>'
        '<path d="M48.2,48 L51.8,48 L52.8,55 L47.2,55 Z" fill="#6b3f22"/>'
    )),
    "01-remera.svg": svg("Ropa", (
        f'<path d="{SHIRT}" {o("#5ab8e8")}/>'
        '<path d="M18,21 L6,40 L19,48 L27,35 Z" fill="#f4f3ee"/>'
        '<path d="M82,21 L94,40 L81,48 L73,35 Z" fill="#f4f3ee"/>'
        '<path d="M34,14 C38,22 62,22 66,14 L61,12 C58,17 42,17 39,12 Z" fill="#f4f3ee"/>'
        '<rect x="26" y="78" width="48" height="8" fill="#47a2d2"/>'
        + shadow(SHIRT, "sombra-remera")
        # contorno de las mangas blancas por encima (si no, se pierden contra el fondo claro)
        + f'<path d="M18,21 L6,40 L19,48" fill="none" stroke="{darker("#5ab8e8")}" stroke-width="1.7" stroke-linejoin="round"/>'
        f'<path d="M82,21 L94,40 L81,48" fill="none" stroke="{darker("#5ab8e8")}" stroke-width="1.7" stroke-linejoin="round"/>'
    )),
    "05-bolsa.svg": svg("Tienda", (
        f'<path d="M36,34 L36,24 C36,13 64,13 64,24 L64,34" fill="none" stroke="#8a5a3c" stroke-width="6" stroke-linecap="round"/>'
        f'<path d="{BAG}" {o("#f2b632")}/>'
        '<path d="M66,32 L80,32 L86,88 L70,88 Z" fill="#e09a22"/>'
        '<rect x="20" y="32" width="60" height="7" fill="#e09a22"/>'
        + shadow(BAG, "sombra-bolsa")
        + '<circle cx="36" cy="38" r="3.8" fill="#8a5a3c"/><circle cx="64" cy="38" r="3.8" fill="#8a5a3c"/>'
        '<path d="M50,52 l3.5,7 7.7,1.1 -5.6,5.4 1.3,7.7 -6.9,-3.6 -6.9,3.6 1.3,-7.7 -5.6,-5.4 7.7,-1.1 Z" fill="#fff4cf"/>'
    )),
    "02-luna.svg": svg("Dormir", (
        f'<path d="{MOON}" {o("#f6c945")}/>'
        '<circle cx="34" cy="60" r="5" fill="#e8b02e"/><circle cx="48" cy="77" r="3.6" fill="#e8b02e"/>'
        '<circle cx="31" cy="40" r="3" fill="#e8b02e"/>'
        + shadow(MOON, "sombra-luna")
        + f'<path d="M80,18 l2.4,5 5.4,.8 -3.9,3.8 .9,5.4 -4.8,-2.5 -4.8,2.5 .9,-5.4 -3.9,-3.8 5.4,-.8 Z" {o("#fff1b8", 2.2)}/>'
    )),
    "03-sol.svg": svg("Despertar", (
        star_rays(50, 50, 30, 43, 10, 0.32, "#f6d04d")
        + f'<path d="{SUN}" {o("#f7a928")}/>'
        + '<circle cx="50" cy="50" r="21" fill="#f9bb34"/>'
        + shadow(SUN, "sombra-sol")
    )),
    "04-pelota.svg": svg("Jugar", (
        f'<defs><clipPath id="pelota-borde"><path d="{BALL}"/></clipPath></defs>'
        f'<path d="{BALL}" {o("#f4f3ee")}/>'
        '<g clip-path="url(#pelota-borde)" fill="#2f2e33">'
        f'<path d="{pentagon(50, 50, 13)}"/>'
        + "".join(
            f'<path d="{pentagon(50 + 36 * math.cos(a), 50 + 36 * math.sin(a), 11, math.pi / 5)}"/>'
            for a in [2 * math.pi * k / 5 - math.pi / 2 + math.pi / 5 for k in range(5)])
        + "</g>"
        + shadow(BALL, "sombra-pelota")
    )),
    "06-jabon.svg": svg("Limpiar", (
        f'<path d="{SOAP}" {o("#f6a3c0")}/>'
        '<rect x="10" y="40" width="72" height="38" rx="16" fill="#ee86aa"/>'
        '<rect x="10" y="34" width="72" height="34" rx="16" fill="#f6a3c0"/>'
        '<rect x="22" y="42" width="48" height="18" rx="9" fill="#f9bdd2"/>'
        f'<circle cx="80" cy="26" r="9" {o("#cfeefa", 2.4)}/><circle cx="67" cy="16" r="5" {o("#cfeefa", 2.4)}/>'
        f'<circle cx="88" cy="12" r="4" {o("#cfeefa", 2.4)}/>'
    )),
}


def main():
    for name, markup in ICONS.items():
        (OUT / name).write_text(markup, encoding="utf-8")
    print(f"{len(ICONS)} íconos planos escritos en assets/ui/actions/.")


if __name__ == "__main__":
    main()
