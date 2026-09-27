// v4.6.12: Trotito — sorteo del orden, pagos de la apuesta y carrera.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const context = vm.createContext({ liteArt: (src) => src, console, Math, fetch: () => Promise.resolve({ ok: false }) });
vm.runInContext(`${read("js/trotito.js")}\nthis.api = { TROTITO_RUNNERS, TROTITO_BETS, TROTITO_LIMITS, trotitoDrawOrder, trotitoPayout, trotitoPlan, trotitoProgress };`, context);
const { TROTITO_RUNNERS, TROTITO_BETS, TROTITO_LIMITS, trotitoDrawOrder, trotitoPayout, trotitoPlan, trotitoProgress } = context.api;

// 4 corredores, cuotas ×2/×3/×4/×6, probabilidades que suman 1.
assert.equal(TROTITO_RUNNERS.length, 4);
assert.equal(TROTITO_RUNNERS.map((r) => r.odds).join(","), "2,3,4,6");
assert.ok(Math.abs(TROTITO_RUNNERS.reduce((s, r) => s + r.chance, 0) - 1) < 1e-9);
assert.equal(TROTITO_BETS.join(","), "10,25,50,100");
assert.equal(TROTITO_LIMITS.carrerasPorDia, 5);

// El ganador sale según su probabilidad (±0,7 %) y el orden trae a los 4.
const wins = {};
const N = 100000;
for (let i = 0; i < N; i++) {
  const order = trotitoDrawOrder();
  assert.equal([...order].sort().join(","), "1,2,3,4");
  wins[order[0]] = (wins[order[0]] || 0) + 1;
}
for (const r of TROTITO_RUNNERS) assert.ok(Math.abs(wins[r.n] / N - r.chance) < .007, `${r.name}: ${wins[r.n] / N}`);

// Pago: sólo si gana el elegido, apuesta × cuota.
assert.equal(trotitoPayout(2, 25, 2), 75);
assert.equal(trotitoPayout(4, 100, 4), 600);
assert.equal(trotitoPayout(1, 50, 3), 0);

// La carrera respeta el orden sorteado: cada uno llega a la meta en su
// momento, en orden, y nadie se sale de la pista (que no retrocedan lo
// asegura trotitoFrame).
for (let k = 0; k < 300; k++) {
  const order = trotitoDrawOrder();
  const plan = trotitoPlan(order);
  const times = order.map((n) => plan[n].T);
  for (let i = 1; i < times.length; i++) assert.ok(times[i] > times[i - 1]);
  for (const n of order) {
    assert.equal(trotitoProgress(plan[n], 0), 0);
    assert.equal(trotitoProgress(plan[n], plan[n].T), 1);
    for (let t = 0; t < plan[n].T; t += .05) {
      const p = trotitoProgress(plan[n], t);
      assert.ok(p >= 0 && p <= 1);
    }
  }
}

console.log("Trotito: probabilidades, pagos y orden de llegada correctos.");
