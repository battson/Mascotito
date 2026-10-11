"""Íconos planos de la barra de acciones (v4.6.19).

Mismo estilo que la mascota y la ropa: colores planos, sin contorno, sin
degradado ni brillo. Cada ícono es un SVG chico (viewBox 0 0 100 100) que
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
    return f'<path d="{" ".join(parts)}" fill="{color}" stroke="{color}" stroke-width="5" stroke-linejoin="round"/>'


def pentagon(cx, cy, r, rot=0):
    pts = [(cx + r * math.cos(rot + 2 * math.pi * k / 5 - math.pi / 2),
            cy + r * math.sin(rot + 2 * math.pi * k / 5 - math.pi / 2)) for k in range(5)]
    return "M" + " L".join(f"{f(x)},{f(y)}" for x, y in pts) + " Z"


ICONS = {
    "05-chest.svg": svg("Inventario", (
        # tapa (media luna), cuerpo, herrajes y cerradura
        '<path d="M14,44 L14,36 C14,22 26,16 50,16 C74,16 86,22 86,36 L86,44 Z" fill="#c07a45"/>'
        '<rect x="12" y="42" width="76" height="42" rx="7" fill="#a5643a"/>'
        '<rect x="12" y="42" width="76" height="8" fill="#8a5130"/>'
        '<rect x="22" y="17" width="9" height="67" fill="#f2c230"/>'
        '<rect x="69" y="17" width="9" height="67" fill="#f2c230"/>'
        '<rect x="10" y="40" width="80" height="6" rx="3" fill="#f2c230"/>'
        '<rect x="41" y="38" width="18" height="22" rx="4" fill="#f7d65c"/>'
        '<circle cx="50" cy="47" r="3.6" fill="#6b3f22"/>'
        '<path d="M48.2,48 L51.8,48 L52.8,55 L47.2,55 Z" fill="#6b3f22"/>'
    )),
    "01-remera.svg": svg("Ropa", (
        '<path d="M34,14 L18,21 L6,40 L19,48 L26,38 L26,86 L74,86 L74,38 L81,48 L94,40 L82,21 L66,14 '
        'C62,22 38,22 34,14 Z" fill="#5ab8e8"/>'
        '<path d="M18,21 L6,40 L19,48 L27,35 Z" fill="#f4f3ee"/>'
        '<path d="M82,21 L94,40 L81,48 L73,35 Z" fill="#f4f3ee"/>'
        '<path d="M34,14 C38,22 62,22 66,14 L61,12 C58,17 42,17 39,12 Z" fill="#f4f3ee"/>'
        '<rect x="26" y="78" width="48" height="8" fill="#47a2d2"/>'
    )),
    "05-bolsa.svg": svg("Tienda", (
        '<path d="M36,34 L36,24 C36,13 64,13 64,24 L64,34" fill="none" stroke="#8a5a3c" stroke-width="6" stroke-linecap="round"/>'
        '<path d="M20,32 L80,32 L86,88 L14,88 Z" fill="#f2b632"/>'
        '<path d="M66,32 L80,32 L86,88 L70,88 Z" fill="#e09a22"/>'
        '<rect x="20" y="32" width="60" height="7" fill="#e09a22"/>'
        '<circle cx="36" cy="38" r="3.8" fill="#8a5a3c"/><circle cx="64" cy="38" r="3.8" fill="#8a5a3c"/>'
        '<path d="M50,52 l3.5,7 7.7,1.1 -5.6,5.4 1.3,7.7 -6.9,-3.6 -6.9,3.6 1.3,-7.7 -5.6,-5.4 7.7,-1.1 Z" fill="#fff4cf"/>'
    )),
    "02-luna.svg": svg("Dormir", (
        '<path d="M42.7,16.1 A38,38 0 1,0 81.9,66.5 A32,32 0 1,1 42.7,16.1 Z" fill="#f6c945"/>'
        '<circle cx="34" cy="60" r="5" fill="#e8b02e"/><circle cx="48" cy="77" r="3.6" fill="#e8b02e"/>'
        '<circle cx="31" cy="40" r="3" fill="#e8b02e"/>'
        '<path d="M80,18 l2.4,5 5.4,.8 -3.9,3.8 .9,5.4 -4.8,-2.5 -4.8,2.5 .9,-5.4 -3.9,-3.8 5.4,-.8 Z" fill="#fff1b8"/>'
    )),
    "03-sol.svg": svg("Despertar", (
        star_rays(50, 50, 30, 45, 10, 0.32, "#f6d04d")
        + '<circle cx="50" cy="50" r="28" fill="#f7a928"/>'
        + '<circle cx="50" cy="50" r="21" fill="#f9bb34"/>'
    )),
    "04-pelota.svg": svg("Jugar", (
        '<defs><clipPath id="pelota-borde"><circle cx="50" cy="50" r="40"/></clipPath></defs>'
        '<circle cx="50" cy="50" r="40" fill="#f4f3ee"/>'
        '<g clip-path="url(#pelota-borde)" fill="#2f2e33">'
        f'<path d="{pentagon(50, 50, 13)}"/>'
        + "".join(
            f'<path d="{pentagon(50 + 36 * math.cos(a), 50 + 36 * math.sin(a), 11, math.pi / 5)}"/>'
            for a in [2 * math.pi * k / 5 - math.pi / 2 + math.pi / 5 for k in range(5)])
        + "</g>"
    )),
    "06-jabon.svg": svg("Limpiar", (
        '<rect x="10" y="40" width="72" height="38" rx="16" fill="#ee86aa"/>'
        '<rect x="10" y="34" width="72" height="34" rx="16" fill="#f6a3c0"/>'
        '<rect x="22" y="42" width="48" height="18" rx="9" fill="#f9bdd2"/>'
        '<circle cx="80" cy="26" r="9" fill="#cfeefa"/><circle cx="67" cy="16" r="5" fill="#cfeefa"/>'
        '<circle cx="88" cy="12" r="4" fill="#cfeefa"/>'
    )),
}


def main():
    for name, markup in ICONS.items():
        (OUT / name).write_text(markup, encoding="utf-8")
    print(f"{len(ICONS)} íconos planos escritos en assets/ui/actions/.")


if __name__ == "__main__":
    main()
