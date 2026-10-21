const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = ['config.js', 'icons.js', 'manifest.js', 'clothing-manifest.js', 'housing.js', 'state.js', 'shop.js']
  .map((file) => fs.readFileSync(path.join(root, 'js', file), 'utf8')).join('\n');
const ctx = { window: {}, document: { getElementById: () => null }, localStorage: { getItem: () => null, setItem() {} }, console };
const api = vm.runInNewContext(source + '\n({SHOP_ITEMS, SHOP_BY_ID, shopSubcategories, shopPruneCart, shopCartTotal, shopGrant, defaultState: typeof defaultState === "function" ? defaultState : null, normalizeState})', ctx);

const priced = api.SHOP_ITEMS.find((i) => i.type === 'clothing' && i.defaultPrice != null);
const other = api.SHOP_ITEMS.find((i) => i.type === 'clothing' && i.defaultPrice != null && i.id !== priced.id);
const pet = api.normalizeState({});
const free = api.SHOP_ITEMS.find((i) => i.type === 'housing' && !(pet.housing.owned[i.id] > 0));

// Sin catálogo de nube, sólo se ven las prendas con precio por defecto, y sus subcategorías salen en orden.
const subs = api.shopSubcategories({}, 'Ropa', false);
assert(subs.length > 1);
assert.deepEqual(Array.from(subs), ['Superiores', 'Inferiores', 'Calzado', 'Accesorios'].filter((s) => subs.includes(s)));
assert(!subs.includes('Prendas superiores'));
assert.equal(api.shopSubcategories({}, 'Casa', false).length, 0);
// El admin ve todo, también lo que no tiene precio.
assert(api.shopSubcategories({}, 'Casa', true).includes('Paredes'));
assert.deepEqual(Array.from(api.shopSubcategories({}, 'Casa', true)).slice(0, 2), ['Paredes', 'Pisos']);

// El canasto descarta repetidos, inexistentes, sin precio y ya comprados.
const catalog = { [free.id]: { price: 100, enabled: true } };
assert.deepEqual(Array.from(api.shopPruneCart({}, pet, [priced.id, priced.id, 'no_existe', free.id])), [priced.id]);
assert.deepEqual(Array.from(api.shopPruneCart(catalog, pet, [priced.id, free.id])), [priced.id, free.id]);
api.shopGrant(pet, priced);
assert.deepEqual(Array.from(api.shopPruneCart(catalog, pet, [priced.id, free.id])), [free.id]);
assert.deepEqual(Array.from(api.shopPruneCart({ [other.id]: { price: 5, enabled: false } }, pet, [other.id])), []);

// El total suma los precios del catálogo y no cuenta lo que no tiene precio.
assert.equal(api.shopCartTotal(catalog, [other.id, free.id]), other.defaultPrice + 100);
assert.equal(api.shopCartTotal({}, []), 0);
console.log('Tienda: subcategorías visibles, orden y canasto.');
