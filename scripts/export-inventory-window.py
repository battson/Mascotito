"""Export the frame and title tab from the PDF-compatible windows.ai artwork."""
import argparse
from pathlib import Path
import pypdfium2

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path)
args = parser.parse_args()
destination = Path(__file__).resolve().parents[1] / "assets" / "ui" / "inventory"
destination.mkdir(parents=True, exist_ok=True)
document = pypdfium2.PdfDocument(args.source)
image = document[0].render(scale=2, fill_color=(0, 0, 0, 0)).to_pil()
for name, bounds in {
    "frame": (20, 564, 1058, 1255),
    "title-tab": (258, 488, 826, 564),
}.items():
    image.crop(tuple(value * 2 for value in bounds)).save(destination / f"{name}.png", optimize=True)
