"""Ropa plana para el cuerpo nuevo de la mascota (v4.6.17).

Redibuja los dos conjuntos (superior, inferior y calzado) sobre las medidas de
scripts/pet-volume-v470.py: colores planos, sin contorno ni volumen, como la
mascota. Escribe:
- el "inline" de cada prenda en js/clothing-manifest.js;
- assets/clothes/<prenda>.svg (lienzo de 400), assets/clothes/previews/<prenda>.svg
  (recortado a la prenda) y assets/clothes/<conjunto>-preview.svg (las tres juntas).

Mangas, piernas y calzado se dibujan en su lugar exacto. El juego las agranda
(scale 1.14 las mangas, 1.07 las piernas y 1.08 el calzado, en css/style.css y
gaitNodes); por eso, dentro del juego, cada pieza va envuelta en un grupo que
deshace esa escala desde el mismo punto de giro.
"""
import importlib.util
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("pet", ROOT / "scripts" / "pet-volume-v470.py")
pet = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pet)

S = pet.SHAPE
SH_L, SH_R = (178.1, 198.8), (221.2, 198.8)
HIP_L, HIP_R = (175.3, 264.1), (224.0, 264.1)
ARM_R, (HAND_X, HAND_Y), HAND_R = S["arm"]
LEG_R, (FOOT_X, FOOT_Y), FOOT_R = S["leg"]
SCALE = {"brazo": 1.14, "pierna": 1.07, "calzado": 1.08}

SETS = {
    "conjunto1": {
        "superior": dict(body="#efefec", sleeve="#302e33", hem="#302e33", hem_y=262, sleeve_len=0.62),
        "inferior": dict(color="#5abce2", length=0.5),
        "calzado": dict(color="#b3a47a", sole="#f4f1e8"),
    },
    "conjunto2": {
        "superior": dict(body="#f2f2e7", sleeve=None, hem=None, hem_y=268, sleeve_len=0),
        "inferior": dict(color="#dd9999", length=0.82),
        "calzado": dict(color="#bab6ae", sole="#8f8b84"),
    },
}


def f(n):
    return f"{n:.2f}"


def torso_points(n=24):
    """Contorno del torso muestreado de la curva pera (sentido horario)."""
    d = pet.pear(S["top"], S["bottom"], S["wt"], S["wb"])
    nums = [float(v) for v in re.findall(r"-?\d+(?:\.\d+)?", d)]
    start, rest = nums[:2], nums[2:]
    pts, cur = [], tuple(start)
    for i in range(0, len(rest), 6):
        c1, c2, end = rest[i:i + 2], rest[i + 2:i + 4], rest[i + 4:i + 6]
        for k in range(n):
            t = k / n
            mt = 1 - t
            pts.append((mt ** 3 * cur[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * end[0],
                        mt ** 3 * cur[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * end[1]))
        cur = tuple(end)
    return pts


def grow(pts, by):
    """Agranda el contorno unas unidades hacia afuera (para que tape el cuerpo)."""
    cx = 200
    cy = (S["top"] + S["bottom"]) / 2
    out = []
    for x, y in pts:
        dx, dy = x - cx, (y - cy) * 0.6
        dist = math.hypot(dx, dy) or 1
        out.append((x + by * dx / dist, y + by * dy / dist))
    return out


def cut(pts, y0, keep_above):
    """Recorta el polígono con la recta horizontal y = y0."""
    res = []
    inside = (lambda p: p[1] <= y0) if keep_above else (lambda p: p[1] >= y0)
    for i, p in enumerate(pts):
        q = pts[(i + 1) % len(pts)]
        if inside(p):
            res.append(p)
        if inside(p) != inside(q):
            t = (y0 - p[1]) / (q[1] - p[1])
            res.append((p[0] + t * (q[0] - p[0]), y0))
    return res


def poly(pts, close=True):
    s = "M" + " L".join(f"{f(x)},{f(y)}" for x, y in pts)
    return s + (" Z" if close else "")


def shirt_path(hem_y, by=1.8, sag=4):
    """Torso de la prenda con el ruedo apenas curvo hacia abajo."""
    pts = cut(grow(torso_points(), by), hem_y, keep_above=True)
    # el ruedo es el tramo recto entre los dos puntos sobre y = hem_y
    i = next(k for k, p in enumerate(pts) if abs(p[1] - hem_y) < 1e-6)
    j = next(k for k, p in enumerate(pts) if k != i and abs(p[1] - hem_y) < 1e-6)
    a, b = pts[i], pts[j]
    seq = pts[j:] + pts[:i + 1]  # de b, por arriba, hasta a
    s = poly(seq, close=False)
    return s + f" Q{f((a[0] + b[0]) / 2)},{f(hem_y + 2 * sag)} {f(b[0])},{f(b[1])} Z", a, b


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def tube(a, ra, b, rb):
    """Forma redonda en a y cortada recta en b (manga, pierna del pantalón)."""
    d = pet.capsule((b[0], b[1], rb), (a[0], a[1], ra), open_=True)
    return d + " Z"


def foot_l():
    return (FOOT_X, FOOT_Y)


def mirror(p):
    return (round(399.3 - p[0], 2), p[1])


def undo_scale(markup, pivot, s, game):
    if not game or s == 1:
        return markup
    px, py = pivot
    return (f'<g transform="translate({f(px)} {f(py)}) scale({1 / s:.4f}) translate({f(-px)} {f(-py)})">'
            + markup + "</g>")


def superior(cfg, game):
    body, a, b = shirt_path(cfg["hem_y"])
    parts = [f'<g id="ropa-cuerpo" class="ropa-cuerpo"><path d="{body}" fill="{cfg["body"]}"/>']
    if cfg["hem"]:
        band = cut(grow(torso_points(), 1.9), cfg["hem_y"] - 4, keep_above=False)
        band = cut(band, cfg["hem_y"], keep_above=True)
        mid = (a[0] + b[0]) / 2
        parts.append(f'<path d="M{f(b[0])},{f(cfg["hem_y"])} Q{f(mid)},{f(cfg["hem_y"] + 8)} {f(a[0])},{f(cfg["hem_y"])} '
                     f'L{f(a[0] - 0.4)},{f(cfg["hem_y"] - 4)} Q{f(mid)},{f(cfg["hem_y"] + 4)} {f(b[0] + 0.4)},{f(cfg["hem_y"] - 4)} Z" '
                     f'fill="{cfg["hem"]}"/>')
    parts.append("</g>")
    if cfg["sleeve"]:
        for side, sh, hand in (("izq", SH_L, (HAND_X, HAND_Y)), ("der", SH_R, mirror((HAND_X, HAND_Y)))):
            end = lerp(sh, hand, cfg["sleeve_len"])
            r_end = ARM_R + (HAND_R - ARM_R) * cfg["sleeve_len"] + 2.2
            d = tube(sh, ARM_R, end, r_end)
            inner = f'<path d="{d}" fill="{cfg["sleeve"]}"/>'
            parts.append(f'<g id="ropa-brazo-{side}" class="ropa-brazo ropa-brazo-{side}" '
                         f'style="transform-origin:{sh[0]}px {sh[1]}px">'
                         + undo_scale(inner, sh, SCALE["brazo"], game) + "</g>")
    return "".join(parts)


def inferior(cfg, game):
    parts = []
    waist = cut(grow(torso_points(), 1.8), 252, keep_above=False)
    parts.append(f'<g class="ropa-cadera"><path d="{poly(waist)}" fill="{cfg["color"]}"/></g>')
    for side, hip, foot in (("izq", HIP_L, foot_l()), ("der", HIP_R, mirror(foot_l()))):
        end = lerp(hip, foot, cfg["length"])
        r_end = LEG_R + (FOOT_R - LEG_R) * cfg["length"] + 1.8
        d = tube(hip, LEG_R + 1.8, end, r_end)
        inner = f'<path d="{d}" fill="{cfg["color"]}"/>'
        parts.append(f'<g id="ropa-pierna-{side}" class="ropa-pierna ropa-pierna-{side}" '
                     f'style="transform-origin:{hip[0]}px {hip[1]}px">'
                     + undo_scale(inner, hip, SCALE["pierna"], game) + "</g>")
    return "".join(parts)


def calzado(cfg, game):
    parts = []
    for side, hip, foot in (("izq", HIP_L, foot_l()), ("der", HIP_R, mirror(foot_l()))):
        rx, ry = FOOT_R + 3.5, FOOT_R - 0.5
        bottom = foot[1] + FOOT_R
        cx, cy = foot[0], bottom - ry
        shoe = f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}" fill="{cfg["color"]}"/>'
        ys = cy + ry * 0.45  # suela: el tramo de abajo del óvalo
        dx = rx * math.sqrt(1 - 0.45 ** 2)
        sole = (f'<path d="M{f(cx - dx)},{f(ys)} A{f(rx)},{f(ry)} 0 0,0 {f(cx + dx)},{f(ys)} Z" '
                f'fill="{cfg["sole"]}"/>')
        parts.append(f'<g id="ropa-calzado-{side}" class="ropa-calzado ropa-calzado-{side}" '
                     f'style="transform-origin:{hip[0]}px {hip[1]}px">'
                     + undo_scale(shoe + sole, hip, SCALE["calzado"], game) + "</g>")
    return "".join(parts)


DRAW = {"superior": superior, "inferior": inferior, "calzado": calzado}
BOX = {"superior": (155, 183, 90, 92), "inferior": (158, 249, 84, 50), "calzado": (157, 289, 86, 26)}


def svg(markup, view="0 0 400 400", size=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}"{size} aria-hidden="true">'
            + markup + "</svg>\n")


def main():
    manifest = ROOT / "js" / "clothing-manifest.js"
    src = manifest.read_text(encoding="utf-8")
    for set_id, slots in SETS.items():
        whole = []
        for slot, cfg in slots.items():
            item = f"{set_id}_{slot}"
            game = DRAW[slot](cfg, True)
            pattern = re.compile(r'("id": "' + item + r'",.*?"inline": )"(?:[^"\\]|\\.)*"', re.S)
            assert pattern.search(src), item
            src = pattern.sub(lambda m: m.group(1) + json.dumps(game, ensure_ascii=False), src, count=1)
            plain = DRAW[slot](cfg, False)
            whole.append(plain)
            name = f"{set_id}-{slot}.svg"
            (ROOT / "assets" / "clothes" / name).write_text(svg(plain, size=' width="1600" height="1600"'), encoding="utf-8")
            x, y, w, h = BOX[slot]
            (ROOT / "assets" / "clothes" / "previews" / name).write_text(svg(plain, f"{x} {y} {w} {h}"), encoding="utf-8")
        # orden del juego: calzado, pantalón, remera
        (ROOT / "assets" / "clothes" / f"{set_id}-preview.svg").write_text(
            svg(whole[2] + whole[1] + whole[0], size=' width="1600" height="1600"'), encoding="utf-8")
    manifest.write_text(src, encoding="utf-8")
    print("Ropa plana escrita en js/clothing-manifest.js y assets/clothes/.")


if __name__ == "__main__":
    main()
