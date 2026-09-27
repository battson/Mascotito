"""Beta v4.6.9 — ruleta nueva a partir de los .ai (son vectoriales).

Uso: python scripts/export-roulette-v469.py ruleta.ai puntero_ruleta.ai
Necesita pdftocairo (poppler). Genera:
- assets/games/roulette/wheel-v2.svg   (la ruleta entera: aro, gajos y botón)
- assets/games/roulette/pointer.svg    (la flechita, recortada a su tamaño)

Los .ai traen además una imagen PNG «colgada» achicada a 1 px dentro de
una máscara (restos del archivo, no se ve); se quita. También se redondean
las coordenadas a 2 decimales para que pesen menos.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/games/roulette"


def ai_to_svg(src):
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "out.svg"
        subprocess.run(["pdftocairo", "-svg", str(src), str(out)], check=True)
        return out.read_text()


def clean(svg):
    svg = re.sub(r"<\?xml[^>]*>\s*", "", svg)
    # Restos: imágenes embebidas, sus máscaras y filtros, y el grupo que las usa.
    svg = re.sub(r"<image[^>]*?/>", "", svg, flags=re.S)
    svg = re.sub(r"<filter\b.*?</filter>", "", svg, flags=re.S)
    svg = re.sub(r"<mask\b.*?</mask>", "", svg, flags=re.S)
    svg = re.sub(r'<g clip-path="url\(#clip-\d+\)">\s*<g mask="url\(#mask-\d+\)">.*?</g>\s*</g>', "", svg, flags=re.S)
    assert "<image" not in svg and "base64" not in svg and "mask=" not in svg
    svg = re.sub(r"(\d+\.\d{2})\d+", r"\1", svg)
    svg = re.sub(r"\n\s*\n", "\n", svg)
    return svg


def main(ruleta, puntero):
    wheel = clean(ai_to_svg(ruleta))
    (OUT / "wheel-v2.svg").write_text(wheel)
    pointer = clean(ai_to_svg(puntero))
    # Recorte al dibujo de la flecha (medido sobre el render, 1254 × 1254).
    x, y, w, h = POINTER_BOX
    pointer = re.sub(r'width="1254" height="1254" viewBox="0 0 1254 1254"',
                     f'width="{w}" height="{h}" viewBox="{x} {y} {w} {h}"', pointer, count=1)
    (OUT / "pointer.svg").write_text(pointer)
    # Ícono de Minijuegos: ruleta + flecha en un solo SVG (los id de la
    # flecha se renombran para que no choquen con los de la ruleta).
    inner_w = re.search(r"<svg[^>]*>(.*)</svg>", wheel, re.S).group(1)
    inner_p = re.search(r"<svg[^>]*>(.*)</svg>", pointer, re.S).group(1)
    inner_p = re.sub(r'id="([^"]+)"', r'id="p-\1"', inner_p)
    inner_p = re.sub(r"url\(#([^)]+)\)", r"url(#p-\1)", inner_p)
    inner_p = re.sub(r'href="#([^"]+)"', r'href="#p-\1"', inner_p)
    x, y, w, h = POINTER_BOX
    pw = 1254 * POINTER_PLACE["width"] / 100
    ph = pw * h / w
    icon = (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1254 1254">'
            f'{inner_w}<svg x="{1254 * POINTER_PLACE["left"] / 100:.1f}" y="{1254 * POINTER_PLACE["top"] / 100:.1f}" '
            f'width="{pw:.1f}" height="{ph:.1f}" viewBox="{x} {y} {w} {h}">{inner_p}</svg></svg>')
    (OUT / "icon.svg").write_text(icon)
    for name in ("wheel-v2.svg", "pointer.svg", "icon.svg"):
        print(name, (OUT / name).stat().st_size // 1024, "KB")


POINTER_BOX = (88, 205, 1078, 895)
# Ubicación de la flecha sobre la ruleta (en % del dibujo de la ruleta),
# la misma que usa css/games.css (.rw-pointer).
POINTER_PLACE = {"left": 41.0, "top": 0.5, "width": 18.0}

if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
