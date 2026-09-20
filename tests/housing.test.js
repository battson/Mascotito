const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../js/housing.js"), "utf8");
const housing = vm.runInNewContext(`${source}\n({
  HOUSING_ITEMS, HOUSING_FLOOR_Y, HOUSING_GIFT_MODELS,
  defaultHousing, normalizeHousing, housingPosition, canPlaceHousing
})`);

for (const item of Object.values(housing.HOUSING_ITEMS)) {
  const image = fs.readFileSync(path.join(__dirname, "..", item.asset));
  assert.equal(image.subarray(1, 4).toString(), "PNG");
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  assert.equal(width, item.width || 1920, `${item.id}: ancho de imagen`);
  assert.equal(height, item.height || (item.category === "wall" ? 1080 : 269), `${item.id}: alto de imagen`);
}

const original = housing.defaultHousing();
assert.equal(original.giftStatus, "none");
assert.equal(original.wall, "pared_basica_1");
assert.equal(original.floor, "piso_basico_1");
assert.equal(original.placed.length, 2);
assert.equal(housing.normalizeHousing(undefined, true).giftStatus, "pending");
assert.equal(housing.normalizeHousing({ giftStatus: "claimed", owned: { pared_huesitos_2: 1 } }, true).giftStatus, "claimed");
assert.equal(housing.HOUSING_GIFT_MODELS.length, 4);

const door = housing.HOUSING_ITEMS.puerta_madera_1_1;
const shelf = housing.HOUSING_ITEMS.repisa_madera_1;
const rug = housing.HOUSING_ITEMS.alfombra_huesitos_1;
assert.equal(housing.housingPosition(door, 100, -999).y + door.height, housing.HOUSING_FLOOR_Y);
assert.equal(housing.housingPosition(door, 99999, 99999).x + door.width, 1920);
assert.equal(housing.housingPosition(shelf, 100, 99999).y + shelf.height, housing.HOUSING_FLOOR_Y);
assert.equal(housing.housingPosition(rug, 100, -999).y, housing.HOUSING_FLOOR_Y);
assert.equal(housing.canPlaceHousing(shelf, { x: 150, y: 300 }, original.placed), false);
assert.equal(housing.canPlaceHousing(rug, { x: 150, y: 820 }, original.placed), true);

const invalid = housing.normalizeHousing({
  giftStatus: "claimed",
  owned: { repisa_madera_1: 1 },
  placed: [
    { uid: "one", id: "repisa_madera_1", x: 1300, y: 9999 },
    { uid: "two", id: "repisa_madera_1", x: 0, y: 0 },
  ],
});
assert.equal(invalid.placed.length, 1);
assert.equal(invalid.placed[0].y + shelf.height, housing.HOUSING_FLOOR_Y);
console.log("Housing: migración, límites, colisiones y cantidades correctos.");
