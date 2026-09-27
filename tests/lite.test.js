// v4.6.6: modo liviano (celulares/tablets) — copias WebP de los dibujos pesados.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "js/config.js"), "utf8");

function load({ touch, search = "" }) {
  const classes = new Set();
  const context = vm.createContext({
    window: { matchMedia: () => ({ matches: touch }), location: { search } },
    document: { documentElement: { classList: { add: (c) => classes.add(c) } } },
    URLSearchParams,
  });
  vm.runInContext(`${source}\nthis.api = { LITE_GFX, LITE_ART, liteArt };`, context);
  return { ...context.api, classes };
}

// En la compu (con mouse) no cambia nada.
const desk = load({ touch: false });
assert.equal(desk.LITE_GFX, false);
assert.equal(desk.classes.has("is-lite"), false);
assert.equal(desk.liteArt("assets/games/fishing/lake.svg"), "assets/games/fishing/lake.svg");

// En el celular: WebP para los dibujos de la lista, el resto igual.
const phone = load({ touch: true });
assert.equal(phone.LITE_GFX, true);
assert.ok(phone.classes.has("is-lite"));
assert.equal(phone.liteArt("assets/games/fishing/lake.svg"), "assets/lite/games/fishing/lake.webp");
assert.equal(phone.liteArt("../assets/ui/ficha/ficha.svg"), "assets/lite/ui/ficha/ficha.webp");
assert.equal(phone.liteArt("assets/shop/moneda.svg"), "assets/shop/moneda.svg");

// Se puede forzar con ?lite=1 / ?lite=0.
assert.equal(load({ touch: false, search: "?lite=1" }).LITE_GFX, true);
assert.equal(load({ touch: true, search: "?lite=0" }).LITE_GFX, false);

// Cada dibujo de la lista tiene su SVG original y su copia liviana.
for (const svg of phone.LITE_ART) {
  assert.ok(fs.existsSync(path.join(root, svg)), svg);
  const webp = path.join(root, phone.liteArt(svg));
  assert.ok(fs.existsSync(webp), webp);
  assert.ok(fs.statSync(webp).size < fs.statSync(path.join(root, svg)).size, `${svg} debería pesar menos`);
}
console.log("lite ok");
