// v4.6.4: ruleta diaria — probabilidades, gajos y premios.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const bond = { xp: 0 };
const context = vm.createContext({
  window: { addEventListener() {}, matchMedia: () => ({ matches: false }) },
  document: { getElementById: () => null, addEventListener() {} },
  addBond: (n) => { bond.xp += n; },
  liteArt: (src) => src,
  ROULETTE_EXTRA_COST: 25,
  freeLeft: true,
  console, Math,
});
vm.runInContext(`${read("js/roulette.js")}\nfunction rouletteFreeAvailable() { return freeLeft; }\nthis.api = { ROULETTE_PRIZES, pickRoulettePrize, applyRoulettePrize, rouletteNextCost, setState: (s) => { state = s; } };`.replace("const ROULETTE_ART", "var state;\nconst ROULETTE_ART"), context);
const { ROULETTE_PRIZES, pickRoulettePrize, applyRoulettePrize, rouletteNextCost, setState } = context.api;

// Probabilidades pedidas: suman 100 y respetan el orden de la tabla.
assert.equal(ROULETTE_PRIZES.reduce((s, p) => s + p.weight, 0), 100);
assert.equal(ROULETTE_PRIZES.map((p) => `${p.id}:${p.weight}`).join(","),
  "coins10:30,fish2:16,coins25:12,energizante:11,xp30:11,lata:9,coins100:8,corona:3");
// Los gajos no se pisan y cada premio queda en el suyo.
for (let i = 1; i < ROULETTE_PRIZES.length; i++) assert.ok(ROULETTE_PRIZES[i].from > ROULETTE_PRIZES[i - 1].to);

// Sorteo: 200 000 tiradas, cada premio cerca de su porcentaje (±0,6 %).
const counts = {};
const N = 200000;
for (let i = 0; i < N; i++) { const p = pickRoulettePrize(); counts[p.id] = (counts[p.id] || 0) + 1; }
for (const p of ROULETTE_PRIZES) assert.ok(Math.abs(counts[p.id] / N * 100 - p.weight) < 0.6, `${p.id}: ${counts[p.id] / N * 100}`);

// Premios.
const st = () => ({ economy: { coins: 0 }, inventory: { pescado: 0, lata: 0, energizante: 0 }, wardrobe: { owned: { accesorios: {} } } });
const byId = (id) => ROULETTE_PRIZES.find((p) => p.id === id);
let s = st(); setState(s);
applyRoulettePrize(byId("coins100")); assert.equal(s.economy.coins, 100);
applyRoulettePrize(byId("fish2")); assert.equal(s.inventory.pescado, 2);
applyRoulettePrize(byId("energizante")); assert.equal(s.inventory.energizante, 1);
applyRoulettePrize(byId("lata")); assert.equal(s.inventory.lata, 1);
applyRoulettePrize(byId("xp30")); assert.equal(bond.xp, 30);
// Corona: la primera vez va al ropero; repetida se cambia por 100 monedas.
applyRoulettePrize(byId("corona")); assert.equal(s.wardrobe.owned.accesorios.corona_1, true); assert.equal(s.economy.coins, 100);
applyRoulettePrize(byId("corona")); assert.equal(s.economy.coins, 200);

// v4.6.11: la primera tirada del día es gratis; las siguientes cuestan 25.
context.freeLeft = true; assert.equal(rouletteNextCost(), 0);
context.freeLeft = false; assert.equal(rouletteNextCost(), 25);

console.log("Ruleta: probabilidades, gajos, premios (incluida la corona repetida) y precio de las tiradas extra correctos.");
