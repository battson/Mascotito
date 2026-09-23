"""Vectoriza los PNG del celular de Contactos y sus íconos (Beta v4.3).

Genera SVG sólo con trazados (sin imágenes incrustadas) en assets/ui/phone/.
Requiere vtracer, Pillow y numpy.

Uso:
  python scripts/vectorize-phone-assets.py phone=marco.png contacts=globo-azul.png \
      add=mas.png remove=menos.png message=globo-blanco.png visit=flechas.png send=enviar.png \
      room=casita.png search=lupa.png check=tilde.png

"contacts" se recolorea del azul original al amarillo del marco del celular (#FEC935),
conservando luces, sombras y el contorno marrón.
"""
import colorsys, re, sys, tempfile
from pathlib import Path
import numpy as np
import vtracer
from PIL import Image, ImageFilter

DEST = Path(__file__).resolve().parents[1] / "assets/ui/phone"
FRAME_HUE = 0.1227  # tono del amarillo principal del marco (#FEC935)
SIDE = {"phone": 1100}  # lado mayor al trazar; los íconos van a 640
# v4.3.2: íconos con textura o degradés fuertes (casita, lupa, ✓): se trazan
# más chicos, con un filtro de mediana y capas de color más gruesas, para
# que cada SVG pese decenas de KB en vez de cientos. (lado, speckle, capas)
HEAVY = {"room": (400, 12, 18), "search": (400, 12, 16), "check": (400, 10, 16)}

def recolor_to_frame(im):
    arr = np.array(im).astype(float) / 255
    for y, x in zip(*np.nonzero(arr[:, :, 3] > 0)):
        h, s, v = colorsys.rgb_to_hsv(*arr[y, x, :3])
        if 0.45 < h < 0.75 and s > 0.08:
            arr[y, x, :3] = colorsys.hsv_to_rgb(FRAME_HUE, s, v)
    return Image.fromarray((arr * 255).round().astype("uint8"), "RGBA")

DEST.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory() as tmp:
    for arg in sys.argv[1:]:
        name, src = arg.split("=", 1)
        im = Image.open(src).convert("RGBA")
        a = np.array(im)[:, :, 3]
        ys, xs = np.nonzero(a > 24)
        im = im.crop((max(xs.min() - 6, 0), max(ys.min() - 6, 0), min(xs.max() + 7, im.width), min(ys.max() + 7, im.height)))
        if name == "contacts":
            im = recolor_to_frame(im)
        side = HEAVY[name][0] if name in HEAVY else SIDE.get(name, 640)
        im.thumbnail((side, side), Image.Resampling.LANCZOS)
        if name in HEAVY:
            rgb = im.convert("RGB").filter(ImageFilter.MedianFilter(3)); rgb.putalpha(im.getchannel("A")); im = rgb
        arr = np.array(im); arr[:, :, 3] = np.where(arr[:, :, 3] > 110, 255, 0); im = Image.fromarray(arr)
        prepared = Path(tmp) / f"{name}.png"; im.save(prepared)
        out = DEST / f"{name}.svg"
        vtracer.convert_image_to_svg_py(str(prepared), str(out), colormode="color", hierarchical="stacked",
            mode="spline", filter_speckle=HEAVY[name][1] if name in HEAVY else 6, color_precision=7,
            layer_difference=HEAVY[name][2] if name in HEAVY else 10, corner_threshold=60,
            length_threshold=4, max_iterations=10, splice_threshold=45, path_precision=1 if name in HEAVY else 2)
        svg = out.read_text()
        svg = re.sub(r'<\?xml[^>]*>\s*', '', svg)
        svg = re.sub(r'<svg [^>]*>', f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {im.width} {im.height}" width="{im.width}" height="{im.height}">', svg, count=1)
        assert "<image" not in svg and "base64" not in svg
        out.write_text(svg)
        print(name, im.size, out.stat().st_size)
