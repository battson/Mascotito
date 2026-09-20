/* Catálogo y reglas del housing. Coordenadas sobre el arte 1920×1080. */
const HOUSING_WIDTH = 1920;
const HOUSING_HEIGHT = 1080;
const HOUSING_FLOOR_Y = 811;
const HOUSING_ITEMS = {};

function addHousingModel(model, count, category, label, placement, width = 0, height = 0) {
  for (let index = 1; index <= count; index++) {
    const id = `${model}_${index}`;
    HOUSING_ITEMS[id] = {
      id, model, category, label: count > 1 ? `${label} · opción ${index}` : label,
      placement, width, height, asset: `assets/housing/${id}.png`,
    };
  }
}

addHousingModel("pared_basica", 6, "wall", "Pared básica", "wallpaper");
addHousingModel("pared_huesitos", 4, "wall", "Pared de huesitos", "wallpaper");
addHousingModel("piso_basico", 1, "floor", "Piso básico", "flooring");
addHousingModel("piso_madera", 2, "floor", "Piso de madera", "flooring");
addHousingModel("puerta_madera_1", 1, "decor", "Puerta de madera", "wallDoor", 312, 524);
addHousingModel("ventana_madera_1", 1, "decor", "Ventana de madera", "wallFree", 435, 464);
addHousingModel("repisa_madera", 1, "decor", "Repisa de madera", "wallFree", 404, 80);
addHousingModel("alfombra_huesitos", 2, "decor", "Alfombra de huesitos", "floorFree", 310, 122);

const HOUSING_GIFT_MODELS = ["pared_huesitos", "piso_madera", "repisa_madera", "alfombra_huesitos"];
const HOUSING_BASIC_ITEMS = ["pared_basica_1", "piso_basico_1", "puerta_madera_1_1", "ventana_madera_1_1"];

function defaultHousing(giftStatus = "none") {
  return {
    version: 1,
    giftStatus,
    owned: Object.fromEntries(HOUSING_BASIC_ITEMS.map((id) => [id, 1])),
    wall: "pared_basica_1",
    floor: "piso_basico_1",
    placed: [
      { uid: "basic-door", id: "puerta_madera_1_1", x: 180, y: HOUSING_FLOOR_Y - HOUSING_ITEMS.puerta_madera_1_1.height },
      { uid: "basic-window", id: "ventana_madera_1_1", x: 1280, y: 170 },
    ],
  };
}

function clampHousing(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

const HOUSING_PLACEMENT_RULES = {
  wallDoor(item, x) {
    return { x: clampHousing(x, 0, HOUSING_WIDTH - item.width), y: HOUSING_FLOOR_Y - item.height };
  },
  wallFree(item, x, y) {
    return {
      x: clampHousing(x, 0, HOUSING_WIDTH - item.width),
      y: clampHousing(y, 0, HOUSING_FLOOR_Y - item.height),
    };
  },
  floorFree(item, x, y) {
    return {
      x: clampHousing(x, 0, HOUSING_WIDTH - item.width),
      y: clampHousing(y, HOUSING_FLOOR_Y, HOUSING_HEIGHT - item.height),
    };
  },
};

function housingPosition(item, x, y) {
  return HOUSING_PLACEMENT_RULES[item.placement]?.(item, x, y) || null;
}

function housingOverlaps(item, position, placed, exceptUid = null) {
  return placed.some((entry) => {
    if (entry.uid === exceptUid) return false;
    const other = HOUSING_ITEMS[entry.id];
    if (!other || other.category !== "decor") return false;
    return position.x < entry.x + other.width && position.x + item.width > entry.x
      && position.y < entry.y + other.height && position.y + item.height > entry.y;
  });
}

function canPlaceHousing(item, position, placed, exceptUid = null) {
  return !!position && !housingOverlaps(item, position, placed, exceptUid);
}

function normalizeHousing(raw, legacyAccount = false) {
  const result = defaultHousing(legacyAccount ? "pending" : "none");
  if (!raw || typeof raw !== "object") return result;
  result.giftStatus = ["none", "pending", "claimed"].includes(raw.giftStatus) ? raw.giftStatus : result.giftStatus;
  if (raw.owned && typeof raw.owned === "object") {
    Object.entries(raw.owned).forEach(([id, quantity]) => {
      if (HOUSING_ITEMS[id] && Number.isInteger(quantity) && quantity > 0) result.owned[id] = Math.min(quantity, 99);
    });
  }
  if (HOUSING_ITEMS[raw.wall]?.category === "wall" && result.owned[raw.wall]) result.wall = raw.wall;
  if (HOUSING_ITEMS[raw.floor]?.category === "floor" && result.owned[raw.floor]) result.floor = raw.floor;
  if (Array.isArray(raw.placed)) {
    const accepted = [];
    const used = {};
    raw.placed.slice(0, 100).forEach((entry) => {
      const item = HOUSING_ITEMS[entry?.id];
      if (!item || item.category !== "decor" || !result.owned[item.id]) return;
      const uid = typeof entry.uid === "string" ? entry.uid.slice(0, 64) : "";
      if (!uid || accepted.some((other) => other.uid === uid)) return;
      const position = housingPosition(item, Number(entry.x), Number(entry.y));
      if (!Number.isFinite(position?.x) || !Number.isFinite(position?.y)) return;
      if (!canPlaceHousing(item, position, accepted)) return;
      if ((used[item.id] || 0) >= result.owned[item.id]) return;
      used[item.id] = (used[item.id] || 0) + 1;
      accepted.push({ uid, id: item.id, ...position });
    });
    result.placed = accepted;
  }
  return result;
}
