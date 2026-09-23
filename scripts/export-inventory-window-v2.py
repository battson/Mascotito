"""Export the clean panel from PDF-compatible windowsv2.ai at 2x resolution."""
import argparse
from pathlib import Path
import pypdfium2
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
args = parser.parse_args()
document = pypdfium2.PdfDocument(args.source)
# Crop the panel itself, excluding Illustrator's exterior shadow artifacts.
image = document[0].render(scale=2, fill_color=(0, 0, 0, 0)).to_pil()
image = image.crop((72, 1166, 2084, 2470))
mask = Image.new("L", image.size)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, image.width - 1, image.height - 1), radius=72, fill=255)
image.putalpha(mask)
image.save(Path(__file__).resolve().parents[1] / "assets/ui/inventory/window-v2.png", optimize=True)
