"""Beta v4.6.6 — versiones livianas (WebP) de los dibujos más pesados, sólo
para celulares y tablets (ver LITE_ART en js/config.js).

Un SVG vectorizado de 100 KB–1 MB se vuelve a rasterizar cada vez que el
navegador repinta su zona; en la compu no se nota, en el celular sí. Estas
copias salen del mismo SVG, dibujado por Chromium a ~2x del tamaño en que
se ve, así que se ven iguales.

Uso: python scripts/export-lite-v466.py [ruta.svg ...]   (necesita playwright + Pillow;
     sin rutas exporta todos)
Genera assets/lite/<misma ruta>.webp
"""
import asyncio
import io
import json
import sys
import re
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
ICON = 256
# ruta del SVG -> ancho en px de la copia liviana
LITE = {
    "assets/ui/inventory/title-tab.svg": 1136,
    "assets/ui/ficha/ficha.svg": 1100,
    "assets/ui/wardrobe/armario.svg": 1032,
    "assets/games/penalty/field.svg": 1600,
    "assets/games/fishing/lake.svg": 1672,
    "assets/games/roulette/wheel-v2.svg": 1000,  # v4.6.9: ruleta nueva
    "assets/games/roulette/pointer.svg": 400,
    "assets/games/roulette/icon.svg": 256,
    "assets/games/fishing/rod.svg": 700,
    "assets/brand/logo-full.svg": 320,
    **{p: ICON for p in [
        "assets/ui/phone/room.svg", "assets/ui/phone/add.svg", "assets/ui/phone/send.svg",
        "assets/ui/phone/search.svg", "assets/ui/phone/visit.svg", "assets/ui/phone/remove.svg",
        "assets/ui/phone/check.svg", "assets/ui/actions/cerrar.svg", "assets/ui/actions/05-bolsa.svg",
        "assets/ui/actions/01-remera.svg", "assets/ui/actions/06-jabon.svg", "assets/ui/actions/04-pelota.svg",
        "assets/ui/actions/03-sol.svg", "assets/ui/inventory/cofre/energizante.svg",
        "assets/games/fishing/rod-icon.svg", "assets/games/fishing/can.svg",
        "assets/games/penalty/glove-left.svg", "assets/games/penalty/glove-right.svg",
        "assets/games/penalty/ball.svg", "assets/ui/ficha/luna.svg", "assets/ui/ficha/higiene.svg",
        "assets/ui/ficha/hambre.svg", "assets/ui/ficha/energia.svg", "assets/ui/ficha/sed.svg",
        "assets/ui/ficha/zzz.svg", "assets/ui/puerta.svg", "assets/ui/wardrobe/piernas.svg",
    ]},
}


def view_box(svg):
    head = (ROOT / svg).read_text(errors="ignore")[:4000]
    vb = re.search(r'viewBox="([^"]+)"', head)
    if vb:
        x, y, w, h = (float(v) for v in re.split(r"[\s,]+", vb.group(1).strip()))
        return w, h
    svg_tag = re.search(r"<svg[^>]*>", head).group(0)
    return (float(re.search(r'width="([\d.]+)', svg_tag).group(1)),
            float(re.search(r'height="([\d.]+)', svg_tag).group(1)))


def lite_path(svg):
    return "assets/lite/" + svg[len("assets/"):-len(".svg")] + ".webp"


async def main():
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}/"
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(device_scale_factor=1)
        only = sys.argv[1:]  # opcional: exportar sólo estos SVG
        for svg, width in LITE.items():
            if only and svg not in only:
                continue
            vw, vh = view_box(svg)
            height = round(width * vh / vw)
            await page.set_viewport_size({"width": width, "height": height})
            await page.goto(base + "__lite_export__", wait_until="commit")
            await page.set_content(f'<html><body style="margin:0;background:transparent"><img id="i" src="{base}{svg}" style="display:block;width:{width}px;height:{height}px"></body></html>')
            await page.wait_for_function("(() => { const i = document.getElementById('i'); return i.complete && i.naturalWidth > 0; })()")
            png = await page.screenshot(omit_background=True, clip={"x": 0, "y": 0, "width": width, "height": height})
            im = Image.open(io.BytesIO(png)).convert("RGBA")
            out = ROOT / lite_path(svg)
            out.parent.mkdir(parents=True, exist_ok=True)
            im.save(out, "WEBP", quality=88, method=6)
            print(f"{svg}  {(ROOT / svg).stat().st_size // 1024} KB -> {out.relative_to(ROOT)} {im.size} {out.stat().st_size // 1024} KB")
        await browser.close()
    server.shutdown()
    (ROOT / "assets/lite/manifest.json").write_text(json.dumps(sorted(LITE), indent=1))


asyncio.run(main())
