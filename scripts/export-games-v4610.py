"""Beta v4.6.10 — ventana de Minijuegos con páginas.

Uso: python scripts/export-games-v4610.py minijuegos_v2.ai
Requiere pdftocairo (poppler).

- assets/ui/games/window-v4.svg: la ventana-tablet de minijuegos_v2.ai sin
  recuadros (sólo la tablet; la ✕ sigue aparte en close.svg).
- assets/ui/games/slot.svg: el recuadro original del .ai, solo. Cada juego
  lo usa de fondo; la grilla (4 × 2 por página) la arma css/games.css.
El .ai es vectorial: se pasa a SVG sin calcar.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AI = Path(sys.argv[1])

with tempfile.TemporaryDirectory() as tmp:
    raw = Path(tmp) / "raw.svg"
    subprocess.run(["pdftocairo", "-svg", str(AI), str(raw)], check=True)
    paths = re.findall(r"<path[^>]*/>", raw.read_text())
assert len(paths) == 97, len(paths)


def small(svg):
    return re.sub(r"(\d+\.\d{2})\d+", r"\1", svg)


frame = paths[:85]                     # tablet (sin la ✕ ni los recuadros)
box = paths[93:95]                     # relleno + borde del recuadro 1
out = ROOT / "assets/ui/games/window-v4.svg"
out.write_text(small('<svg xmlns="http://www.w3.org/2000/svg" viewBox="28 22 1396 1038">\n' + "\n".join(frame) + "\n</svg>\n"))
print(out.relative_to(ROOT), out.stat().st_size)
slot = ROOT / "assets/ui/games/slot.svg"
slot.write_text(small('<svg xmlns="http://www.w3.org/2000/svg" viewBox="277.2 348.6 381.4 397.4" preserveAspectRatio="none">\n' + "\n".join(box) + "\n</svg>\n"))
print(slot.relative_to(ROOT), slot.stat().st_size)
