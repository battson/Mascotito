// v4.6.12: Trotito — sorteo del orden, pagos de la apuesta y carrera.
// Hotfix 2: anuncio del ganador con cortes de animación y fin del bucle.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const context = vm.createContext({ liteArt: (src) => src, console, Math, fetch: () => Promise.resolve({ ok: false }) });
vm.runInContext(`${read("js/trotito.js")}\nthis.api = { TROTITO_RUNNERS, TROTITO_BETS, TROTITO_LIMITS, trotitoDrawOrder, trotitoPayout, trotitoPlan, trotitoProgress, trotitoFrame };`, context);
const { TROTITO_RUNNERS, TROTITO_BETS, TROTITO_LIMITS, trotitoDrawOrder, trotitoPayout, trotitoPlan, trotitoProgress, trotitoFrame } = context.api;

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

// Hotfix 2: si se cortan los cuadros a mitad de carrera (pestaña o app en
// segundo plano), la carrera sigue donde estaba, el cartel anuncia al
// ganador sorteado (antes podía decir «¡Ganó Pompón!») y el bucle se
// detiene apenas llegan los cuatro.
const banners = [];
Object.assign(context, {
  $g: () => ({ querySelector: () => null }),
  fsReduceMotion: () => true,
  gamesTimer: () => {},
  gamesHint: () => {},
  showPenaltyBanner: (text) => banners.push(text),
});
for (const order of [[3, 1, 2, 4], [4, 3, 2, 1], [2, 4, 1, 3]]) {
  banners.length = 0;
  const trot = { phase: "race", pick: order[0], order, plan: trotitoPlan(order), time: 0, last: 0, finished: [], anim: {} };
  order.forEach((n) => { trot.anim[n] = { frame: 0, acc: 0, prev: 0 }; });
  context.minigame = { type: { id: "trotito" }, trot };
  let now = 0;
  let running = true;
  let frames = 0;
  while (running && frames < 5000) {
    now += frames === 200 ? 20000 : 16; // a los ~3 s se pierden 20 s de cuadros
    running = trotitoFrame(now);
    frames++;
  }
  const winner = TROTITO_RUNNERS.find((r) => r.n === order[0]);
  assert.equal(banners.join("|"), `¡Ganó ${winner.name}!`);
  assert.equal(trot.finished.join(","), order.join(","));
  assert.equal(running, false);
  // Terminó apenas llegó el último: el corte no adelantó la carrera.
  assert.ok(trot.time < trot.plan[order[3]].T + .1, `tiempo de carrera ${trot.time}`);
}

console.log("Trotito: probabilidades, pagos, orden de llegada y anuncio del ganador correctos.");
