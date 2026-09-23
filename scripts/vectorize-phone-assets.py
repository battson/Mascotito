"""Trace the supplied UI artwork into path-only SVG assets (requires vtracer, Pillow)."""
import argparse
import colorsys
from pathlib import Path
import re
import tempfile
import sys

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
parser.add_argument("--modules", type=Path)
args = parser.parse_args()
if args.modules:
    sys.path.insert(0, str(args.modules))
import vtracer
from PIL import Image

destination = Path(__file__).resolve().parents[1] / "assets/ui/phone"
destination.mkdir(parents=True, exist_ok=True)
sources = {
    "phone": "chat.png",
    "contacts": "Imagen de Codex 23 sept 2026, 12_39_59.png",
    "add": "Imagen de Codex 23 sept 2026, 12_51_05.png",
    "remove": "Imagen de Codex 23 sept 2026, 12_51_12.png",
    "message": "Imagen de Codex 23 sept 2026, 12_51_17.png",
    "visit": "Imagen de Codex 23 sept 2026, 12_51_21.png",
    "send": "Imagen de Codex 23 sept 2026, 12_51_25.png",
}
with tempfile.TemporaryDirectory() as temporary:
    for name, filename in sources.items():
        image = Image.open(args.source / filename).convert("RGBA")
        image = image.crop(image.getchannel("A").getbbox())
        if name == "contacts":
            pixels = []
            for r, g, b, a in image.getdata():
                h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
                if .48 < h < .72 and s > .12:
                    r, g, b = (round(c * 255) for c in colorsys.hsv_to_rgb(.125, s, v))
                pixels.append((r, g, b, a))
            image.putdata(pixels)
        image.thumbnail((1100, 1500) if name == "phone" else (700, 700), Image.Resampling.LANCZOS)
        prepared = Path(temporary) / f"{name}.png"
        image.save(prepared)
        output = destination / f"{name}.svg"
        vtracer.convert_image_to_svg_py(str(prepared), str(output), colormode="color", hierarchical="stacked", mode="spline", filter_speckle=8, color_precision=5, layer_difference=24, corner_threshold=60, length_threshold=4, max_iterations=10, splice_threshold=45, path_precision=2)
        svg = output.read_text()
        svg = svg.replace('<svg ', f'<svg viewBox="0 0 {image.width} {image.height}" ', 1)
        assert "<image" not in svg and "base64" not in svg
        output.write_text(svg)
        print(name, image.size, output.stat().st_size)
