const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = ['clothing-manifest.js', 'clothing-v44.js', 'state.js'].map(file => fs.readFileSync(path.join(root, 'js', file), 'utf8')).join('\n');
const api = vm.runInNewContext(source + '\n({defaultWardrobe, normalizeWardrobe, CLOTHING_CATALOG})');
const fresh = api.defaultWardrobe();
assert.equal(Object.keys(fresh.owned.superior).length, 6);
assert.equal(fresh.owned.accesorios.anteojos_redondos, true);
const legacy = {owned: {superior: {conjunto1_superior: true}}, equipped: {superior: 'conjunto1_superior'}, betaWelcomeClaimed: true};
const migrated = api.normalizeWardrobe(legacy);
assert.equal(migrated.equipped.superior, 'conjunto1_superior');
assert.equal(migrated.owned.superior.remera_celeste, true);
assert.equal(migrated.betaWelcomeClaimed, true);
assert.equal(legacy.owned.superior.remera_celeste, undefined);
const saved = api.normalizeWardrobe({ ...fresh, equipped: {superior: 'buzo_coral', accesorios: 'anteojos_redondos', inferior: 'invalid'} });
assert.equal(saved.equipped.superior, 'buzo_coral');
assert.equal(saved.equipped.accesorios, 'anteojos_redondos');
assert.equal(saved.equipped.inferior, null);
for (const item of Object.values(api.CLOTHING_CATALOG).flat().filter(item => item.starter)) {
 const svg = fs.readFileSync(path.join(root, item.asset), 'utf8');
 assert(!/<image\b|data:image/.test(svg), item.id + ' debe ser vectorial');
 assert(!/<image\b|data:image/.test(item.inline), item.id + ' equipado debe ser vectorial');
}
console.log('Vestidor: migración, colección inicial, persistencia y SVG correctos.');
