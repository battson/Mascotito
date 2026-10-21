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
    asset: item.icon || item.asset, group: "Ropa", subcategory: { superior: "Superiores", inferior: "Inferiores", calzado: "Calzado", accesorios: "Accesorios" }[slot],
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

/* Beta v4.6.23: orden de las subcategorías y ayudas del canasto (sin DOM, para poder probarlas). */
const SHOP_SUB_ORDER = ["Paredes", "Pisos", "Puertas", "Ventanas", "Repisas", "Alfombras", "Superiores", "Inferiores", "Calzado", "Accesorios", "Cuerpo"];

function shopVisible(catalog, item, admin) {
  return !!admin || shopSetting(catalog, item).enabled;
}

/* Sólo las subcategorías con artículos a la vista, así ninguna abre vacía. */
function shopSubcategories(catalog, group, admin) {
  const found = new Set(SHOP_ITEMS.filter((item) => item.group === group && shopVisible(catalog, item, admin)).map((item) => item.subcategory));
  const rank = (name) => { const i = SHOP_SUB_ORDER.indexOf(name); return i < 0 ? SHOP_SUB_ORDER.length : i; };
  return [...found].sort((a, b) => rank(a) - rank(b));
}

/* Un artículo sigue en el canasto sólo si existe, está a la venta con precio y todavía no es del jugador. */
function shopPruneCart(catalog, pet, ids) {
  const seen = new Set();
  return ids.filter((id) => {
    const item = SHOP_BY_ID[id];
    if (!item || seen.has(id)) return false;
    seen.add(id);
    const setting = shopSetting(catalog, item);
    return setting.enabled && setting.price != null && !shopOwns(pet, item);
  });
}

function shopCartTotal(catalog, ids) {
  return ids.reduce((sum, id) => sum + (shopSetting(catalog, SHOP_BY_ID[id]).price || 0), 0);
}
