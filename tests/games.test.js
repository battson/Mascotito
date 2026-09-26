// v4.6.2: Penales (puntería/potencia e IA fácil) y tramos de moscas.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const context = vm.createContext({
  window: { addEventListener() {} },
  document: { getElementById: () => null },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  clamp: (v, a, b) => Math.min(b, Math.max(a, v)),
  console,
});
vm.runInContext(`${read("js/config.js")}\n${read("js/games.js")}\nthis.api = { PET_CONFIG, PENALTY_SCENE, PK_POWER, penaltyTarget, keeperPlan, resetMinigameCounters, gamesUnlimited };`, context);
const { PET_CONFIG, PENALTY_SCENE: S, PK_POWER, penaltyTarget, keeperPlan, resetMinigameCounters, gamesUnlimited } = context.api;

// Moscas: 4 / 3 / 2 / 1 / 0 según la higiene.
const flies = (h) => { for (const t of PET_CONFIG.moscas.tramos) if (h < t.hasta) return t.moscas; return 0; };
assert.equal([0, 14, 15, 34, 35, 49, 50, 64, 65, 100].map(flies).join(","), "4,4,3,3,2,2,1,1,0,0");

// Potencia justa: la pelota cae cerca del punto elegido.
const aim = { x: 450, y: 260 };
for (let i = 0; i < 200; i++) {
  const t = penaltyTarget(aim, (PK_POWER.sweet0 + PK_POWER.sweet1) / 2);
  assert.ok(Math.hypot(t.x - aim.x, t.y - aim.y) <= 12, "potencia justa demasiado desviada");
}
// Floja: más abajo; muy fuerte: más arriba.
const avgY = (p) => { let y = 0; for (let i = 0; i < 300; i++) y += penaltyTarget(aim, p).y; return y / 300; };
assert.ok(avgY(.1) > aim.y + 60, "la patada floja debería caer más abajo");
assert.ok(avgY(1) < aim.y - 80, "la patada muy fuerte debería levantarse");
// Nunca se va por debajo del piso del arco.
for (let i = 0; i < 200; i++) assert.ok(penaltyTarget({ x: 600, y: 400 }, 0).y <= S.goal.bottom);

// IA: arranca en el centro, espera su reacción y nunca sale del arco.
for (let i = 0; i < 200; i++) {
  const plan = keeperPlan({ x: 320, y: 200 });
  assert.equal(plan.at(0).x, S.keeperHome.x);
  assert.equal(plan.at(0).y, S.keeperHome.y);
  const end = plan.at(5000);
  assert.ok(end.x >= S.goal.left && end.x <= S.goal.right && end.y >= S.goal.top && end.y <= S.goal.bottom);
}

// Modo prueba: reiniciar deja la pesca en 0 y sin espera; sin admin no hay «sin límite».
const fake = { daily: { fishingPlays: 3 }, cooldowns: { jugar: Date.now() + 9e5 } };
resetMinigameCounters(fake);
assert.equal(fake.daily.fishingPlays, 0);
assert.equal(fake.cooldowns.jugar, 0);
assert.equal(gamesUnlimited(), false);

console.log("Juegos: moscas por higiene, puntería/potencia de Penales, IA fácil y modo prueba correctos.");
