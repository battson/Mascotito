"""Vectorize the supplied v4.6.1 artwork (Pillow + vtracer required).
Usage: python scripts/vectorize-fishing-assets.py SOURCE_DIRECTORY
Outputs real SVG paths, never embedded PNG images.
"""
import re
import sys
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tmp-fishing-tools'))
import vtracer

source = Path(sys.argv[1])
dest = ROOT / 'assets/games/fishing'
dest.mkdir(parents=True, exist_ok=True)
for name, original, side in [('lake', 'lago_pesca', 1672), ('rod-icon', 'caña_icono', 600),
                              ('rod', 'caña_juego', 1000), ('bobber', 'bocha', 400), ('can', 'lata', 500)]:
    im = Image.open(source / (original + '.png')).convert('RGBA')
    if name == 'rod':
        # Keep the rod/reel and the line threaded through its guides;
        # the hanging line and original float are replaced by animated layers.
        mask = Image.new('L', im.size, 255)
        ImageDraw.Draw(mask).polygon([(1380, 155), (1462, 155), (1462, 1084), (1270, 1084), (1270, 260), (1340, 175)], fill=0)
        from PIL import ImageChops
        im.putalpha(ImageChops.multiply(im.getchannel('A'), mask))
    if name in ('bobber', 'can', 'rod-icon'):
        im = im.crop(im.getbbox())
    im.thumbnail((side, side), Image.Resampling.LANCZOS)
    im.putalpha(im.getchannel('A').point(lambda x: 255 if x > 110 else 0))
    with tempfile.TemporaryDirectory(dir=ROOT) as tmp:
        prepared = Path(tmp) / 'input.png'
        im.save(prepared)
        out = dest / (name + '.svg')
        vtracer.convert_image_to_svg_py(str(prepared), str(out), colormode='color', hierarchical='stacked', mode='spline',
            filter_speckle=5, color_precision=7, layer_difference=12, corner_threshold=60,
            length_threshold=4, max_iterations=10, splice_threshold=45, path_precision=2)
    svg = re.sub(r'<\?xml[^>]*>\s*', '', out.read_text())
    svg = re.sub(r'<svg [^>]*>', f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {im.width} {im.height}">', svg, count=1)
    assert '<image' not in svg and 'base64' not in svg
    out.write_text(svg)
    print(name, im.size, out.stat().st_size)
