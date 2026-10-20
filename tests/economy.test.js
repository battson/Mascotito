// v4.6.23: tope diario de monedas ganadas (el mismo que exige firestore.rules).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = ['clothing-manifest.js', 'state.js'].map(file => fs.readFileSync(path.join(root, 'js', file), 'utf8')).join('\n');
const notices = [];
const api = vm.runInNewContext(source + '\n({grantCoins, normalizeEconomy, coinDayNumber, COIN_DAILY_CAP})', { notifySystem: (text) => notices.push(text) });
const today = api.coinDayNumber();

// Guardados viejos sólo tenían { coins }: se completan sin tocar el saldo.
assert.deepEqual({ ...api.normalizeEconomy({ coins: 75.6 }) }, { coins: 75, day: 0, earned: 0 });
assert.deepEqual({ ...api.normalizeEconomy(null) }, { coins: 0, day: 0, earned: 0 });

// La primera ganancia del día arranca la cuenta del día.
const pet = { economy: { coins: 50 } };
assert.equal(api.grantCoins(pet, 100), 100);
assert.deepEqual({ ...pet.economy }, { coins: 150, day: today, earned: 100 });

// Al llegar al tope se suma sólo lo que falta, y después nada (con aviso).
pet.economy.earned = api.COIN_DAILY_CAP - 30;
assert.equal(api.grantCoins(pet, 100), 30);
assert.equal(pet.economy.coins, 180);
assert.equal(api.grantCoins(pet, 10), 0);
assert.equal(pet.economy.coins, 180);
assert.equal(notices.length, 2);

// Al otro día se vuelve a poder ganar.
pet.economy.day = today - 1;
assert.equal(api.grantCoins(pet, 40), 40);
assert.deepEqual({ ...pet.economy }, { coins: 220, day: today, earned: 40 });

// Si otro dispositivo ya anotó un día más adelante (reloj adelantado), no se vuelve atrás.
pet.economy.day = today + 1;
pet.economy.earned = 10;
api.grantCoins(pet, 5);
assert.equal(pet.economy.day, today + 1);
assert.equal(pet.economy.earned, 15);

// El día cambia a la medianoche de Argentina (UTC-3).
assert.equal(api.coinDayNumber(Date.UTC(2026, 9, 20, 2, 59)), api.coinDayNumber(Date.UTC(2026, 9, 19, 12)));
assert.equal(api.coinDayNumber(Date.UTC(2026, 9, 20, 3, 0)), api.coinDayNumber(Date.UTC(2026, 9, 19, 12)) + 1);

// El número del tope tiene que ser el mismo en las reglas.
const rules = fs.readFileSync(path.join(root, 'firestore.rules'), 'utf8');
assert.ok(rules.includes(`earned <= ${api.COIN_DAILY_CAP}`), 'firestore.rules usa otro tope');
console.log('Monedas: tope diario, cambio de día y mismo número que las reglas.');
