"""Ropa plana para el cuerpo nuevo de la mascota (v4.6.17, catálogo en v4.6.18).

Dibuja todas las prendas (superior, inferior y calzado) sobre las medidas de
scripts/pet-volume-v470.py: colores planos, sin contorno ni volumen, como la
mascota. Cada prenda se describe en CATALOG con sus rasgos (mangas, rayas,
lunares, bolsillo, pollera, botas...). Escribe:
- superior, inferior y calzado de CLOTHING_CATALOG en js/clothing-manifest.js;
- assets/clothes/<prenda>.svg (lienzo de 400), assets/clothes/previews/<prenda>.svg
  (recortado a la prenda, es el ícono de la tienda y el vestidor) y
  assets/clothes/<conjunto>-preview.svg (los dos conjuntos de bienvenida).

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



def band(a, ra, b, rb):
    """Franja recta entre dos cortes perpendiculares al eje (puños, ruedos)."""
    ang = math.atan2(b[1] - a[1], b[0] - a[0]) + math.pi / 2
    c, s_ = math.cos(ang), math.sin(ang)
    pts = [(a[0] + ra * c, a[1] + ra * s_), (b[0] + rb * c, b[1] + rb * s_),
           (b[0] - rb * c, b[1] - rb * s_), (a[0] - ra * c, a[1] - ra * s_)]
    return poly(pts)


def heart(cx, cy, r, color):
    return (f'<path d="M{f(cx)},{f(cy + r)} C{f(cx - 1.6 * r)},{f(cy)} {f(cx - 1.1 * r)},{f(cy - 1.1 * r)} {f(cx)},{f(cy - 0.45 * r)} '
            f'C{f(cx + 1.1 * r)},{f(cy - 1.1 * r)} {f(cx + 1.6 * r)},{f(cy)} {f(cx)},{f(cy + r)} Z" fill="{color}"/>')


def group(gid, cls, pivot, inner, scale, game):
    return (f'<g id="{gid}" class="{cls}" style="transform-origin:{pivot[0]}px {pivot[1]}px">'
            + undo_scale(inner, pivot, scale, game) + "</g>")


def sides():
    hand_l = (HAND_X, HAND_Y)
    return (("izq", SH_L, hand_l, HIP_L, foot_l()), ("der", SH_R, mirror(hand_l), HIP_R, mirror(foot_l())))


def body_shape(cfg):
    """Contorno del cuerpo de la prenda: remera recta o vestido acampanado."""
    if not cfg.get("flare"):
        return shirt_path(cfg["hem_y"])
    top = 258
    pts = cut(grow(torso_points(), 1.8), top, keep_above=True)
    i = next(k for k, p in enumerate(pts) if abs(p[1] - top) < 1e-6)
    j = next(k for k, p in enumerate(pts) if k != i and abs(p[1] - top) < 1e-6)
    a, b = pts[i], pts[j]
    if a[0] < b[0]:
        a, b = b, a
    half, hem = S["wb"] + cfg["flare"], cfg["hem_y"]
    seq = pts[j:] + pts[:i + 1] if pts[j][0] < pts[i][0] else pts[i:] + pts[:j + 1]
    d = (poly(seq, close=False) + f" L{f(200 + half)},{f(hem)} Q200,{f(hem + 8)} {f(200 - half)},{f(hem)} Z")
    return d, (200 + half, hem), (200 - half, hem)


def superior(cfg, game, uid):
    d, a, b = body_shape(cfg)
    hem_y = cfg["hem_y"]
    clip = f"{uid}-forma"
    inner = [f'<path d="{d}" fill="{cfg["body"]}"/>']
    deco = []
    if cfg.get("stripes"):
        color, gap = cfg["stripes"]
        y = 200
        while y < hem_y + 10:
            deco.append(f'<rect x="150" y="{f(y)}" width="100" height="{f(gap / 2)}" fill="{color}"/>')
            y += gap
    if cfg.get("dots"):
        for row, y in enumerate(range(204, int(hem_y) + 12, 11)):
            for x in range(158 + (row % 2) * 6, 246, 12):
                deco.append(f'<circle cx="{x}" cy="{y}" r="2.4" fill="{cfg["dots"]}"/>')
    if cfg.get("opening"):
        deco.append(f'<path d="M193,186 L207,186 L211,{f(hem_y + 8)} L189,{f(hem_y + 8)} Z" fill="{cfg["opening"]}"/>')
    if cfg.get("hem"):
        mid = (a[0] + b[0]) / 2
        deco.append(f'<path d="M{f(b[0])},{f(hem_y)} Q{f(mid)},{f(hem_y + 8)} {f(a[0])},{f(hem_y)} '
                    f'L{f(a[0] - 0.4)},{f(hem_y - 4)} Q{f(mid)},{f(hem_y + 4)} {f(b[0] + 0.4)},{f(hem_y - 4)} Z" fill="{cfg["hem"]}"/>')
    if cfg.get("pocket"):
        deco.append(f'<path d="M185,{f(hem_y - 17)} L215,{f(hem_y - 17)} L220,{f(hem_y - 3)} L180,{f(hem_y - 3)} Z" fill="{cfg["pocket"]}"/>')
    if cfg.get("heart"):
        deco.append(heart(206, 236, 8, cfg["heart"]))
    if cfg.get("buttons"):
        for y in (222, 236, 250):
            deco.append(f'<circle cx="{"212" if cfg.get("opening") else "200"}" cy="{y}" r="1.8" fill="{cfg["buttons"]}"/>')
    if deco:
        inner.append(f'<defs><clipPath id="{clip}"><path d="{d}"/></clipPath></defs>'
                     f'<g clip-path="url(#{clip})">' + "".join(deco) + "</g>")
    parts = ['<g id="ropa-cuerpo" class="ropa-cuerpo">' + "".join(inner) + "</g>"]
    if cfg.get("sleeve"):
        n = cfg["sleeve_len"]
        for side, sh, hand, _, _ in sides():
            end = lerp(sh, hand, n)
            r_end = ARM_R + (HAND_R - ARM_R) * n + 2.2
            piece = f'<path d="{tube(sh, ARM_R, end, r_end)}" fill="{cfg["sleeve"]}"/>'
            if cfg.get("sleeve_stripes"):
                for t in (0.3, 0.5):
                    c0, c1 = lerp(sh, hand, t), lerp(sh, hand, t + 0.07)
                    r0 = ARM_R + (HAND_R - ARM_R) * t + 2
                    piece += f'<path d="{band(c0, r0, c1, r0 + 0.2)}" fill="{cfg["sleeve_stripes"]}"/>'
            if cfg.get("cuff"):
                c0 = lerp(sh, hand, n - 0.1)
                piece += f'<path d="{band(c0, r_end - 0.3, end, r_end)}" fill="{cfg["cuff"]}"/>'
            parts.append(group(f"ropa-brazo-{side}", f"ropa-brazo ropa-brazo-{side}", sh, piece, SCALE["brazo"], game))
    return "".join(parts)


def inferior(cfg, game, uid):
    color = cfg["color"]
    waist = cut(grow(torso_points(), 1.8), 252, keep_above=False)
    hip = [f'<path d="{poly(waist)}" fill="{color}"/>']
    if cfg.get("skirt"):
        xl = min(x for x, y in waist if abs(y - 252) < 1e-6)
        xr = max(x for x, y in waist if abs(y - 252) < 1e-6)
        half, hem = S["wb"] + 10, cfg["skirt"]
        hip = [f'<path d="M{f(xl)},252 L{f(xr)},252 L{f(200 + half)},{f(hem)} Q200,{f(hem + 6)} {f(200 - half)},{f(hem)} Z" fill="{color}"/>']
        for k in (-2, -1, 0, 1, 2):
            x0, x1 = 200 + k * 9, 200 + k * 15
            hip.append(f'<path d="M{f(x0 - 0.9)},258 L{f(x0 + 0.9)},258 L{f(x1 + 1.3)},{f(hem + 2)} L{f(x1 - 1.3)},{f(hem + 2)} Z" fill="{cfg["pleats"]}"/>')
        if cfg.get("waistband"):
            hip.append(f'<path d="M{f(xl)},252 L{f(xr)},252 L{f(xr + 0.6)},257 L{f(xl - 0.6)},257 Z" fill="{cfg["waistband"]}"/>')
        return '<g class="ropa-cadera">' + "".join(hip) + "</g>"
    if cfg.get("drawstring"):
        hip.append(f'<path d="M197,254 L198.6,254 L197.6,263 L196,263 Z M201.4,254 L203,254 L204,263 L202.4,263 Z" fill="{cfg["drawstring"]}"/>')
    parts = ['<g class="ropa-cadera">' + "".join(hip) + "</g>"]
    n = cfg["length"]
    for side, _, _, hip_c, foot in sides():
        end = lerp(hip_c, foot, n)
        r_end = LEG_R + (FOOT_R - LEG_R) * n + 1.8
        piece = f'<path d="{tube(hip_c, LEG_R + 1.8, end, r_end)}" fill="{color}"/>'
        if cfg.get("cuff"):
            c0 = lerp(hip_c, foot, n - 0.09)
            piece += f'<path d="{band(c0, r_end - 0.2, end, r_end)}" fill="{cfg["cuff"]}"/>'
        if cfg.get("pocket"):
            out = -1 if side == "izq" else 1
            px, py = lerp(hip_c, foot, 0.3)
            px += out * 5
            piece += f'<rect x="{f(px - 3.5)}" y="{f(py - 3)}" width="7" height="8" rx="1.5" fill="{cfg["pocket"]}"/>'
        if cfg.get("stripe"):
            out = -1 if side == "izq" else 1
            a, b = lerp(hip_c, foot, 0.15), lerp(hip_c, foot, n - (0.1 if cfg.get("cuff") else 0))
            ra = LEG_R + 1.8
            piece += (f'<path d="M{f(a[0] + out * (ra - 2.6))},{f(a[1])} L{f(a[0] + out * (ra - 0.4))},{f(a[1])} '
                      f'L{f(b[0] + out * (r_end - 0.4))},{f(b[1])} L{f(b[0] + out * (r_end - 2.6))},{f(b[1])} Z" fill="{cfg["stripe"]}"/>')
        parts.append(group(f"ropa-pierna-{side}", f"ropa-pierna ropa-pierna-{side}", hip_c, piece, SCALE["pierna"], game))
    return "".join(parts)


def calzado(cfg, game, uid):
    kind = cfg.get("kind", "zapatilla")
    parts = []
    for side, _, _, hip, foot in sides():
        bottom = foot[1] + FOOT_R
        rx, ry = FOOT_R + 3.5, FOOT_R - 0.5
        if kind == "pantufla":
            rx, ry = FOOT_R + 4.5, FOOT_R + 0.5
        cx, cy = foot[0], bottom - ry
        piece = ""
        if kind == "bota":
            top = lerp(hip, foot, cfg["shaft"])
            r_top = LEG_R + (FOOT_R - LEG_R) * cfg["shaft"] + 2.2
            piece += f'<path d="{band(top, r_top, (cx, cy), FOOT_R + 2.2)}" fill="{cfg["color"]}"/>'
            if cfg.get("rim"):
                piece += f'<path d="{band(top, r_top + 0.6, lerp(top, (cx, cy), 0.22), r_top + 0.8)}" fill="{cfg["rim"]}"/>'
        if kind == "sandalia":
            piece += f'<ellipse cx="{f(cx)}" cy="{f(bottom - 2.5)}" rx="{f(rx)}" ry="2.5" fill="{cfg["sole"]}"/>'
            for y0 in (cy - 2, cy + 4):
                piece += f'<path d="{band((cx - 9.5, y0), 1.9, (cx + 10.5, y0), 1.9)}" fill="{cfg["color"]}"/>'
            parts.append(group(f"ropa-calzado-{side}", f"ropa-calzado ropa-calzado-{side}", hip, piece, SCALE["calzado"], game))
            continue
        if kind == "pantufla" and cfg.get("ears"):
            for ex in (-5, 4):
                piece += (f'<ellipse cx="{f(cx + ex)}" cy="{f(cy - ry - 2)}" rx="2.6" ry="6" '
                          f'transform="rotate({ex * 3} {f(cx + ex)} {f(cy - ry + 3)})" fill="{cfg["color"]}"/>')
                piece += (f'<ellipse cx="{f(cx + ex)}" cy="{f(cy - ry - 1.5)}" rx="1.2" ry="3.8" '
                          f'transform="rotate({ex * 3} {f(cx + ex)} {f(cy - ry + 3)})" fill="{cfg["ears"]}"/>')
        piece += f'<ellipse cx="{f(cx)}" cy="{f(cy)}" rx="{f(rx)}" ry="{f(ry)}" fill="{cfg["color"]}"/>'
        if cfg.get("toe"):
            piece += f'<ellipse cx="{f(cx + rx * 0.55)}" cy="{f(cy + 1)}" rx="{f(rx * 0.42)}" ry="{f(ry * 0.72)}" fill="{cfg["toe"]}"/>'
        if cfg.get("laces"):
            for k in (-1, 1):
                piece += f'<path d="{band((cx - 4, cy - 3 + 2.6 * k), 0.8, (cx + 3, cy - 3 + 2.6 * k), 0.8)}" fill="{cfg["laces"]}"/>'
        if cfg.get("pompom"):
            piece += f'<circle cx="{f(cx + rx * 0.45)}" cy="{f(cy - ry * 0.35)}" r="3.6" fill="{cfg["pompom"]}"/>'
        if cfg.get("sole"):
            ys = cy + ry * 0.45
            dx = rx * math.sqrt(1 - 0.45 ** 2)
            piece += f'<path d="M{f(cx - dx)},{f(ys)} A{f(rx)},{f(ry)} 0 0,0 {f(cx + dx)},{f(ys)} Z" fill="{cfg["sole"]}"/>'
        parts.append(group(f"ropa-calzado-{side}", f"ropa-calzado ropa-calzado-{side}", hip, piece, SCALE["calzado"], game))
    return "".join(parts)


DRAW = {"superior": superior, "inferior": inferior, "calzado": calzado}

# id, conjunto, nombre, precio, rasgos. Los dos primeros de cada tipo son los
# conjuntos de bienvenida (no cambiar sus ids: están en las partidas guardadas).
CATALOG = {
    "superior": [
        ("conjunto1_superior", "conjunto1", "Remera blanca y negra", 200,
         dict(body="#efefec", sleeve="#302e33", hem="#302e33", hem_y=262, sleeve_len=0.62)),
        ("conjunto2_superior", "conjunto2", "Blusa crema", 200, dict(body="#f2f2e7", hem_y=268)),
        ("marinera_superior", "marinera", "Remera marinera", 220,
         dict(body="#f7f5ee", stripes=("#2f4f86", 8), sleeve="#2f4f86", sleeve_len=0.55, hem_y=263)),
        ("corazon_superior", "corazon", "Remera con corazón", 210,
         dict(body="#b9a3dd", heart="#f27ea0", sleeve="#b9a3dd", sleeve_len=0.55, hem_y=262)),
        ("buzo_superior", "buzo", "Buzo mostaza", 260,
         dict(body="#e9b44c", pocket="#d49c35", hem="#d49c35", sleeve="#e9b44c", cuff="#d49c35", sleeve_len=0.9, hem_y=266)),
        ("vestido_superior", "vestido", "Vestido de lunares", 280,
         dict(body="#e2574c", dots="#fbeee6", flare=6, hem_y=290, sleeve="#e2574c", sleeve_len=0.4)),
        ("campera_superior", "campera", "Campera de jean", 300,
         dict(body="#5b84bd", opening="#f4f2ec", buttons="#d9b45a", sleeve="#5b84bd", cuff="#476d9f", sleeve_len=0.9, hem_y=266)),
        ("rayas_superior", "rayas", "Remera rayada verde", 210,
         dict(body="#e9f3df", stripes=("#7bbf8a", 10), sleeve="#7bbf8a", sleeve_len=0.55, hem_y=262)),
    ],
    "inferior": [
        ("conjunto1_inferior", "conjunto1", "Short celeste", 175, dict(color="#5abce2", length=0.5)),
        ("conjunto2_inferior", "conjunto2", "Pantalón rosa", 175, dict(color="#dd9999", length=0.82)),
        ("jean_inferior", "jean", "Jean azul", 220, dict(color="#3f5f93", length=0.86, cuff="#5e80b6")),
        ("jogging_inferior", "jogging", "Jogging gris", 200,
         dict(color="#9aa1a8", length=0.86, cuff="#737a82", stripe="#f2f2f2", drawstring="#f2f2f2")),
        ("bermuda_inferior", "bermuda", "Bermuda cargo", 190, dict(color="#c4ab7c", length=0.56, pocket="#a98f60")),
        ("pollera_inferior", "pollera", "Pollera tableada", 210,
         dict(color="#4f7d6a", skirt=288, pleats="#41695a", waistband="#41695a")),
        ("pollera2_inferior", "pollera2", "Pollera rosa", 210,
         dict(color="#f2a7c3", skirt=284, pleats="#e48fb0", waistband="#fbd9e6")),
    ],
    "calzado": [
        ("conjunto1_calzado", "conjunto1", "Zapatillas beige", 150, dict(color="#b3a47a", sole="#f4f1e8")),
        ("conjunto2_calzado", "conjunto2", "Zapatillas grises", 150, dict(color="#bab6ae", sole="#8f8b84")),
        ("rojas_calzado", "rojas", "Zapatillas rojas", 180,
         dict(color="#e0524d", sole="#f7f4ee", toe="#f7f4ee", laces="#f7f4ee")),
        ("lluvia_calzado", "lluvia", "Botas de lluvia", 200,
         dict(kind="bota", color="#f2c230", sole="#c99a1c", shaft=0.62, rim="#ffd85c")),
        ("botitas_calzado", "botitas", "Botitas marrones", 200,
         dict(kind="bota", color="#8a5a3c", sole="#4e3426", shaft=0.8, laces="#d9b98f")),
        ("sandalias_calzado", "sandalias", "Sandalias", 160, dict(kind="sandalia", color="#b97a45", sole="#e3b47c")),
        ("pantuflas_calzado", "pantuflas", "Pantuflas de conejo", 190,
         dict(kind="pantufla", color="#f8c9d8", ears="#f39ab8", sole="#f2a9c1")),
    ],
}
BOX = {"superior": (146, 183, 108, 116), "inferior": (152, 248, 96, 62), "calzado": (150, 278, 100, 40)}


def svg(markup, view="0 0 400 400", size=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}"{size} aria-hidden="true">'
            + markup + "</svg>\n")


def main():
    manifest = ROOT / "js" / "clothing-manifest.js"
    src = manifest.read_text(encoding="utf-8")
    out = ROOT / "assets" / "clothes"
    blocks, plain_by_id = [], {}
    for slot, items in CATALOG.items():
        entries = []
        for item_id, set_id, label, price, cfg in items:
            plain = DRAW[slot](cfg, False, item_id)
            plain_by_id[item_id] = plain
            name = item_id.replace("_", "-") + ".svg"
            (out / name).write_text(svg(plain, size=' width="1600" height="1600"'), encoding="utf-8")
            x, y, w, h = BOX[slot]
            (out / "previews" / name).write_text(svg(plain, f"{x} {y} {w} {h}"), encoding="utf-8")
            entries.append({"id": item_id, "setId": set_id, "label": label, "price": price,
                            "asset": f"assets/clothes/{name}", "icon": f"assets/clothes/previews/{name}",
                            "inline": DRAW[slot](cfg, True, item_id)})
        body = json.dumps(entries, ensure_ascii=False, indent=2).replace("\n", "\n  ")
        blocks.append(f'  "{slot}": {body}')
    start = src.index('  "superior": [')
    end = src.index("\n};", start)
    src = src[:start] + ",\n".join(blocks) + src[end:]
    manifest.write_text(src, encoding="utf-8")
    for set_id in ("conjunto1", "conjunto2"):
        whole = "".join(plain_by_id[f"{set_id}_{slot}"] for slot in ("calzado", "inferior", "superior"))
        (out / f"{set_id}-preview.svg").write_text(svg(whole, size=' width="1600" height="1600"'), encoding="utf-8")
    total = sum(len(v) for v in CATALOG.values())
    print(f"{total} prendas planas escritas en js/clothing-manifest.js y assets/clothes/.")


if __name__ == "__main__":
    main()
