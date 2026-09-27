"""Beta v4.6.4 — exporta los cursores (cursor_default.ai, cursor_pointer.ai,
cursor_not-allowed.ai) a PNG de 1x y 2x con el mismo tamaño visual.

Uso: python scripts/export-cursors-v464.py CARPETA_CON_LOS_AI
Requiere pdftocairo (poppler) y Pillow.

- La flecha de «default» y la de «not-allowed» salen con la MISMA escala
  (son la misma flecha; la de prohibido suma el cartelito rojo).
- La mano de «pointer» se escala para que mida lo mismo de alto que la flecha.
- Imprime el punto activo (hotspot) de cada uno: la punta de la flecha y la
  punta del dedo. Esos números van en las variables --cursor-* de style.css.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(sys.argv[1])
OUT = ROOT / "assets/ui/cursors"
OUT.mkdir(parents=True, exist_ok=True)
ARROW_H = 28          # alto de la flecha / la mano en píxeles (1x)
RENDER_DPI = 900


def render(name):
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp) / "r"
        subprocess.run(["pdftocairo", "-png", "-r", str(RENDER_DPI), "-singlefile", "-transp",
                        str(SRC / f"{name}.ai"), str(base)], check=True)
        im = Image.open(str(base) + ".png").convert("RGBA")
    return im.crop(im.getbbox())


arts = {n: render(n) for n in ("cursor_default", "cursor_pointer", "cursor_not-allowed")}
arrow_scale = ARROW_H / arts["cursor_default"].height
scales = {
    "cursor_default": arrow_scale,
    "cursor_not-allowed": arrow_scale,
    "cursor_pointer": ARROW_H / arts["cursor_pointer"].height,
}
PAD = 1
for name, art in arts.items():
    for mult in (1, 2):
        s = scales[name] * mult
        w, h = round(art.width * s), round(art.height * s)
        small = art.resize((w, h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (w + 2 * PAD * mult, h + 2 * PAD * mult), (0, 0, 0, 0))
        canvas.alpha_composite(small, (PAD * mult, PAD * mult))
        suffix = "" if mult == 1 else "@2x"
        canvas.save(OUT / f"{name.replace('cursor_', '')}{suffix}.png")
        if mult == 1:
            a = canvas.getchannel("A").load()
            # Punto activo: el primer píxel opaco desde arriba (punta de la
            # flecha / del dedo). En la flecha se corre al borde izquierdo.
            hot = next((x, y) for y in range(canvas.height) for x in range(canvas.width) if a[x, y] > 128)
            print(name, canvas.size, "hotspot", hot)
