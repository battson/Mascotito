"""Export Illustrator artboards (PDF-compatible .ai files) for housing."""

from pathlib import Path

import pypdfium2


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parents[1] / "assets" / "escenarios"
DEST = ROOT / "assets" / "housing"

MODELS = {
    "decoraciones/alfombra_huesitos.ai": "alfombra_huesitos",
    "decoraciones/puerta_madera_1.ai": "puerta_madera_1",
    "decoraciones/repisa_madera.ai": "repisa_madera",
    "decoraciones/ventana_madera_1.ai": "ventana_madera_1",
    "paredes/pared_basica.ai": "pared_basica",
    "paredes/pared_huesitos.ai": "pared_huesitos",
    "pisos/piso_basico.ai": "piso_basico",
    "pisos/piso_madera.ai": "piso_madera",
}


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for relative_path, stem in MODELS.items():
        document = pypdfium2.PdfDocument(SOURCE / relative_path)
        for index, page in enumerate(document, start=1):
            image = page.render(scale=1, fill_color=(0, 0, 0, 0)).to_pil()
            if relative_path.startswith("decoraciones/"):
                bounds = image.getchannel("A").getbbox()
                if bounds:
                    image = image.crop(bounds)
            target = DEST / f"{stem}_{index}.png"
            image.save(target, optimize=True)
            print(f"{target.relative_to(ROOT)}: {image.width}x{image.height}")


if __name__ == "__main__":
    main()
