"""Beta v4.5: vectoriza la ficha del personaje, sus íconos y los de la notificación de sueño.

Genera SVG sólo con trazados en assets/ui/ficha/. Requiere vtracer, Pillow,
numpy y opencv-python.

Uso:
  python scripts/vectorize-ficha-assets.py ficha=ficha.png hambre=comedero.png \
      sed=gota.png higiene=esponja.png energia=rayo.png luna=luna.png zzz=zzz.png

En ficha.png se borran antes los rellenos de muestra (pastillas grises del
nombre y el XP, cuadrados y pastillas de las celdas) para que el nombre, el
nivel, los íconos, los % y las barras los dibuje la página.
"""
import re, sys, tempfile
from pathlib import Path
import cv2, numpy as np, vtracer
from PIL import Image, ImageFilter

DEST = Path(__file__).resolve().parents[1] / "assets/ui/ficha"
# nombre: (lado al trazar, speckle, capas de color, precisión, filtro de mediana)
PARAMS = {"ficha": (1100, 6, 8, 2, False), "sed": (256, 10, 14, 1, True), "energia": (256, 10, 14, 1, True), "luna": (256, 10, 14, 1, True), "zzz": (256, 10, 14, 1, True)}
ICON = (256, 10, 16, 1, True)

def clean_placeholders(im):
    a = np.array(im)
    r, g, b = (a[:, :, i].astype(int) for i in range(3))
    grey = ((r >= 212) & (r <= 242) & (g >= 212) & (g <= 242) & (abs(r - g) < 7) & (b >= 180) & (b <= 214) & (a[:, :, 3] > 200)).astype(np.uint8)
    n, _, st, _ = cv2.connectedComponentsWithStats(grey)
    mask = np.zeros_like(grey)
    for i in range(1, n):
        x, y, w, h, area = st[i]
        if area > 2000 and area / (w * h) > 0.5:
            mask[max(y - 6, 0):y + h + 6, max(x - 6, 0):x + w + 6] = 1
    bgr = cv2.cvtColor(a[:, :, :3], cv2.COLOR_RGB2BGR)
    a[:, :, :3] = cv2.cvtColor(cv2.inpaint(bgr, mask * 255, 12, cv2.INPAINT_TELEA), cv2.COLOR_BGR2RGB)
    return Image.fromarray(a)

DEST.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    for arg in sys.argv[1:]:
        name, src = arg.split("=", 1)
        side, speckle, layers, precision, median = PARAMS.get(name, ICON)
        im = Image.open(src).convert("RGBA")
        if name == "ficha":
            im = clean_placeholders(im)
        alpha = np.array(im)[:, :, 3]
        ys, xs = np.nonzero(alpha > 40)
        im = im.crop((max(xs.min() - 4, 0), max(ys.min() - 4, 0), min(xs.max() + 5, im.width), min(ys.max() + 5, im.height)))
        im.thumbnail((side, side), Image.Resampling.LANCZOS)
        if median:
            rgb = im.convert("RGB").filter(ImageFilter.MedianFilter(3)); rgb.putalpha(im.getchannel("A")); im = rgb
        arr = np.array(im); arr[:, :, 3] = np.where(arr[:, :, 3] > 110, 255, 0); im = Image.fromarray(arr)
        prepared = Path(tmp) / f"{name}.png"; im.save(prepared)
        out = DEST / f"{name}.svg"
        vtracer.convert_image_to_svg_py(str(prepared), str(out), colormode="color", hierarchical="stacked", mode="spline",
            filter_speckle=speckle, color_precision=7, layer_difference=layers, corner_threshold=60,
            length_threshold=4, max_iterations=10, splice_threshold=45, path_precision=precision)
        svg = re.sub(r"<\?xml[^>]*>\s*", "", out.read_text())
        svg = re.sub(r"<svg [^>]*>", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {im.width} {im.height}" width="{im.width}" height="{im.height}">', svg, count=1)
        assert "<image" not in svg and "base64" not in svg
        out.write_text(svg)
        print(name, im.size, out.stat().st_size)
