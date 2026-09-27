"""Beta v4.6.12 — arte de Trotito (carreras).

Uso: python scripts/export-trotito-v4612.py <carpeta con sprites_trotito.png,
     escenario_carreras.png, endscreen_trotito.png y Trotito_icon.ai>

Genera en assets/games/trotito/:
  run.svg        6 cuadros de la carrera (sprite vectorizado con vtracer),
                 alineados por la nariz, como <symbol id="trot-f1…f6">, más
                 "trot-sad" (el cuadro 4 con cara triste: sin sonrisa, boca
                 hacia abajo, ceja caída y una lágrima) para el 3º del podio.
                 La manta azul pasa a var(--manta) para recolorearla por
                 corredor.
  escenario.svg  la pista (vtracer), con las banderas a cuadros de la meta
                 trazadas aparte con más detalle.
  podio.svg      sólo el podio de endscreen_trotito.png (sin estadio, pista,
                 pasto ni confeti estático; recorte con GrabCut + retoques).
  icon.svg       Trotito_icon.ai pasado directo (es vectorial), recortado.
Las copias WebP del modo liviano se sacan con una captura del SVG.
Requiere: pip install vtracer opencv-python pillow numpy (y pdftocairo).
"""
import colorsys, os, re, subprocess, sys
import cv2, numpy as np, vtracer
from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "games", "trotito")
TMP = os.path.join(OUT, "_tmp")
os.makedirs(TMP, exist_ok=True)
TRACE = dict(colormode="color", hierarchical="stacked", mode="spline", corner_threshold=60,
             length_threshold=4.0, splice_threshold=45, path_precision=1)


def frames():
    im = np.array(Image.open(os.path.join(SRC, "sprites_trotito.png")).convert("RGBA"))
    n, lab, stats, _ = cv2.connectedComponentsWithStats((im[:, :, 3] > 20).astype("uint8"), 8)
    comps = sorted([(i, stats[i]) for i in range(1, n) if stats[i][4] > 5000], key=lambda c: (c[1][1] // 300, c[1][0]))
    out = []
    for i, (x, y, w, h, _) in comps:
        sub = im[y:y + h, x:x + w].copy()
        sub[lab[y:y + h, x:x + w] != i] = 0
        dark = (sub[:, :, :3].astype(int).sum(2) < 150) & (sub[:, :, 3] > 200)
        ys, xs = np.nonzero(dark)
        nx = xs.max(); ny = int(ys[xs >= nx - 8].mean())      # punta de la nariz
        out.append((sub, nx, ny))
    L = max(f[1] for f in out); R = max(f[0].shape[1] - f[1] for f in out)
    T = max(f[2] for f in out); B = max(f[0].shape[0] - f[2] for f in out)
    W, H = L + R + 8, T + B + 8                                   # 472 × 385
    paths = []
    for k, (sub, nx, ny) in enumerate(out):
        c = np.zeros((H, W, 4), "uint8")
        c[4 + T - ny:4 + T - ny + sub.shape[0], 4 + L - nx:4 + L - nx + sub.shape[1]] = sub
        png = os.path.join(TMP, f"frame{k + 1}.png"); Image.fromarray(c).save(png)
        svg = png[:-4] + ".svg"
        vtracer.convert_image_to_svg_py(png, svg, filter_speckle=6, color_precision=7, layer_difference=12, max_iterations=10, **TRACE)
        paths.append(re.findall(r"<path[^>]*/>", open(svg).read()))
    return paths, W, H


def manta(tag):
    m = re.search(r'fill="#([0-9A-Fa-f]{6})"', tag)
    r, g, b = [int(m.group(1)[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if not (0.50 < h < 0.62 and s > 0.45 and l < 0.8):
        return tag
    base = 0.47
    if l < base - .03: val = f"color-mix(in srgb, var(--manta, #15a0db) {round(100 - (base - l) * 180)}%, #000)"
    elif l > base + .03: val = f"color-mix(in srgb, var(--manta, #15a0db) {max(20, round(100 - (l - base) * 180))}%, #fff)"
    else: val = "var(--manta, #15a0db)"
    return tag.replace(m.group(0), f'style="fill:{val}"')


def run_svg():
    paths, W, H = frames()
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>']
    for i, ps in enumerate(paths, 1):
        ps = [manta(p) for p in ps]
        parts.append(f'<symbol id="trot-f{i}" viewBox="0 0 {W} {H}">{"".join(ps)}</symbol>')
        if i == 4:
            # Índices medidos con getBBox sobre el cuadro 4 del trazado:
            # 34/62/68 = sonrisa, 19 = ceja.
            sad = list(ps)
            for k in (34, 62, 68): sad[k] = ""
            sad[19] = f'<g transform="rotate(-11 383 127)">{sad[19]}</g>'
            extra = ('<path d="M421 212 Q437 199 455 207" fill="none" stroke="#1b1b1e" stroke-width="6" stroke-linecap="round"/>'
                     '<path d="M370 176 q-7 12 0 17 q7-5 0-17z" fill="#7fc8f0" stroke="#4a9fd6" stroke-width="1.5"/>')
            parts.append(f'<symbol id="trot-sad" viewBox="0 0 {W} {H}">{"".join(sad)}{extra}</symbol>')
    parts.append("</defs></svg>")
    open(os.path.join(OUT, "run.svg"), "w").write("".join(parts))


def escenario():
    src = os.path.join(SRC, "escenario_carreras.png")
    main = os.path.join(TMP, "esc.svg")
    vtracer.convert_image_to_svg_py(src, main, filter_speckle=10, color_precision=6, layer_difference=14, **TRACE)
    x0, y0, x1, y1 = 1335, 425, 1615, 505                       # banderas de la meta
    Image.open(src).convert("RGBA").crop((x0, y0, x1, y1)).save(os.path.join(TMP, "flags.png"))
    vtracer.convert_image_to_svg_py(os.path.join(TMP, "flags.png"), os.path.join(TMP, "flags.svg"),
                                    filter_speckle=2, color_precision=7, layer_difference=8, **{**TRACE, "length_threshold": 3.0})
    flags = "".join(re.findall(r"<path[^>]*/>", open(os.path.join(TMP, "flags.svg")).read()))
    s = open(main).read().replace("</svg>", f'<g transform="translate({x0} {y0})">{flags}</g></svg>')
    s = s.replace('width="1672" height="941"', 'width="1672" height="941" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMax slice"', 1)
    open(os.path.join(OUT, "escenario.svg"), "w").write(s)


def podio():
    img = cv2.imread(os.path.join(SRC, "endscreen_trotito.png"))
    mask = np.zeros(img.shape[:2], np.uint8)
    bgd = np.zeros((1, 65), np.float64); fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(img, mask, (130, 480, 1420, 370), bgd, fgd, 8, cv2.GC_INIT_WITH_RECT)
    m = np.where((mask == 1) | (mask == 3), 255, 0).astype("uint8")
    n, lab, st, _ = cv2.connectedComponentsWithStats(m)
    m = ((lab == np.argmax(st[1:, 4]) + 1) * 255).astype("uint8")
    inv = 255 - m; n2, l2, s2, _ = cv2.connectedComponentsWithStats(inv)
    for i in range(1, n2):
        if s2[i][4] < 20000: m[l2 == i] = 255
    # Fuera la pista que asomaba a los costados y arriba del 3º.
    m[:785, :218] = 0; m[:785, 1460:] = 0
    reg = img[:785, :400].astype(int); m[:785, :400][(reg[:, :, 2] - reg[:, :, 0]) > 45] = 0
    rr = np.zeros_like(m); x0, y0, x1, y1, r = 1053, 614, 1451, 800, 40
    cv2.rectangle(rr, (x0 + r, y0), (x1 - r, y1), 255, -1); cv2.rectangle(rr, (x0, y0 + r), (x1, y1), 255, -1)
    cv2.circle(rr, (x0 + r, y0 + r), r, 255, -1); cv2.circle(rr, (x1 - r, y0 + r), r, 255, -1)
    zone = np.zeros_like(m); zone[:790, 1058:] = 255; m[(zone > 0) & (rr == 0)] = 0
    band = m[780:840]; m[780:840] = cv2.morphologyEx(band, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (25, 1)))
    m[829:] = 0
    out = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA); out[:, :, 3] = m
    ys, xs = np.nonzero(m); out = out[ys.min() - 2:ys.max() + 3, xs.min() - 2:xs.max() + 3]
    png = os.path.join(TMP, "podio.png"); cv2.imwrite(png, out)
    svg = os.path.join(OUT, "podio.svg")
    vtracer.convert_image_to_svg_py(png, svg, filter_speckle=8, color_precision=6, layer_difference=10, **TRACE)
    s = open(svg).read(); w, h = re.search(r'width="(\d+)" height="(\d+)"', s).groups()
    open(svg, "w").write(s.replace(f'width="{w}" height="{h}"', f'width="{w}" height="{h}" viewBox="0 0 {w} {h}"', 1))


def icono():
    raw = os.path.join(TMP, "icon.svg")
    subprocess.run(["pdftocairo", "-svg", os.path.join(SRC, "Trotito_icon.ai"), raw], check=True)
    s = open(raw).read()
    x0, y0, x1, y1 = 310, 149, 1110, 891                         # contenido + 8 px
    s = s.replace('width="1536" height="1024" viewBox="0 0 1536 1024"', f'width="{x1 - x0}" height="{y1 - y0}" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}"')
    s = re.sub(r"(\d+\.\d{2})\d+", r"\1", s).replace('fill-rule="nonzero" ', "").replace(' fill-opacity="1"', "")
    open(os.path.join(OUT, "icon.svg"), "w").write(s)


if __name__ == "__main__":
    run_svg(); escenario(); podio(); icono()
    print("Listo:", OUT)
