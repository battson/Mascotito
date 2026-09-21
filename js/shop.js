/* Beta v3.0: catálogo compartido. Cada variante tiene una sola unidad por cuenta. */
const SHOP_ITEMS = [
  ...Object.values(HOUSING_ITEMS).map((item) => ({
    id: item.id, type: "housing", label: item.label, asset: item.asset, group: "Casa",
    subcategory: item.category === "wall" ? "Paredes" : item.category === "floor" ? "Pisos"
      : item.placement === "wallDoor" ? "Puertas" : item.model.startsWith("ventana") ? "Ventanas"
      : item.model.startsWith("repisa") ? "Repisas" : "Alfombras",
  })),
  ...Object.entries(CLOTHING_CATALOG).flatMap(([slot, items]) => items.map((item) => ({
    id: item.id, type: "clothing", slot, label: item.label || (slot === "accesorios" ? "Corona" : `Ropa · ${item.setId} · ${slot}`),
    asset: item.asset, group: "Ropa", subcategory: { superior: "Prendas superiores", inferior: "Prendas inferiores", calzado: "Calzado", accesorios: "Accesorios" }[slot],
    defaultPrice: Number.isInteger(item.price) ? item.price : null,
  }))),
  ...PET_PARTS_MANIFEST.bodyColor.filter((item) => item.locked).map((item) => ({
    id: `color_${item.id}`, colorId: item.id, type: "color", label: item.label, swatch: item.swatch, group: "Colores", subcategory: "Cuerpo",
  })),
];
const SHOP_BY_ID = Object.fromEntries(SHOP_ITEMS.map((item) => [item.id, item]));

function shopSetting(catalog, item) {
  const raw = catalog?.[item.id];
  const price = Number.isSafeInteger(raw?.price) && raw.price >= 0 ? raw.price : item.defaultPrice;
  return { price, enabled: raw?.enabled === false ? false : raw?.enabled === true || item.defaultPrice != null };
}

function shopOwns(pet, item) {
  if (item.type === "housing") return (pet.housing?.owned?.[item.id] || 0) > 0;
  if (item.type === "clothing") return pet.wardrobe?.owned?.[item.slot]?.[item.id] === true;
  return pet.unlockedColors?.[item.colorId] === true;
}

function shopGrant(pet, item) {
  if (item.type === "housing") pet.housing.owned[item.id] = 1;
  else if (item.type === "clothing") pet.wardrobe.owned[item.slot][item.id] = true;
  else pet.unlockedColors[item.colorId] = true;
}
