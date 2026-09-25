/**
 * Manejo de estado del jugador: guardar/cargar de localStorage, validar y
 * reparar ese guardado si algo no cierra, y aplicar el paso del tiempo
 * real (necesidades, sueño, salud, manchas, vínculo) desde la última vez
 * que se guardó.
 */

// v2 agrega necesidades/campos nuevos (Fase 2: Cuidado) — normalizeState
// migra un guardado v1 (hambre/sed/limpieza) a la forma nueva sin perder
// la mascota ni su progreso.
const STATE_VERSION = 9;

let lastStorageNotice = null;
function getStorageNotice() {
  return lastStorageNotice;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function defaultLook() {
  return {
    bodyColor: PET_PARTS_MANIFEST.bodyColor[0].id,
    cabeza: PET_PARTS_MANIFEST.cabeza[0].id,
    orejas: PET_PARTS_MANIFEST.orejas[0].id,
    ojos: PET_PARTS_MANIFEST.ojos[0].id,
    ojosColor: PET_EYE_COLORS[0].id,
    narices: PET_PARTS_MANIFEST.narices[0].id,
    boca: PET_PARTS_MANIFEST.boca[0].id,
    cejas: PET_PARTS_MANIFEST.cejas[0].id,
  };
}

function isCustomHex(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

/* v2.1: Casa y Jardín pasan a ser LUGARES navegables del juego (antes eran
 * "escenarios" elegibles en el creador, guardados en state.scenario). Una
 * mascota nueva arranca en la casa (pedido explícito). defaultLocation()
 * reemplaza a la vieja defaultScenario(). */
function defaultLocation() {
  return "casa";
}

/** Migra state.scenario (v2.0 y anteriores) a state.location: los ids
 * viejos eran "living" (interior) y "jardin" (exterior) — ambos pasan a
 * "casa". v3.5 (pedido explícito): "quitar la escena del jardín" — el
 * Jardín deja de existir como lugar, así que cualquier guardado (viejo o
 * de justo antes de esta versión) que haya quedado con location:"jardin"
 * vuelve a la Casa, que es el único lugar que sigue existiendo. */
function normalizeLocation(rawLocation, legacyScenario) {
  if (rawLocation === "casa") return rawLocation;
  return defaultLocation();
}

function normalizeLook(rawLook) {
  const fallback = defaultLook();
  const look = rawLook && typeof rawLook === "object" ? rawLook : {};
  const result = {};
  Object.keys(fallback).forEach((category) => {
    const value = look[category];
    if (category === "bodyColor" && isCustomHex(value)) {
      result[category] = value.toLowerCase();
      return;
    }
    if (category === "ojosColor") {
      const validColor = PET_EYE_COLORS.some((opt) => opt.id === value);
      result[category] = validColor ? value : fallback[category];
      return;
    }
    const opts = PET_PARTS_MANIFEST[category] || [];
    const valid = opts.some((opt) => opt.id === value);
    result[category] = valid ? value : fallback[category];
  });
  return result;
}

/** Necesidades por defecto (mascota recién creada): todo lleno. */
function defaultStats() {
  return { saciedad: 100, hidratacion: 100, higiene: 100, energia: 100, felicidad: 100 };
}

function defaultCooldowns() {
  // v3.2: "pesca" es el cooldown propio del minijuego de Pesca (antes
  // compartía "jugar" con Pelota/Luciérnagas) — ver cooldownsMs.pesca en
  // js/config.js.
  return { pescado: 0, comidaBasica: 0, snack: 0, golosina: 0, beber: 0, bañar: 0, jugar: 0, pesca: 0, hablar: 0, medicina: 0 };
}

const WARDROBE_SLOTS = ["superior", "inferior", "calzado", "accesorios"];

function defaultWardrobe() {
  return {
    owned: { superior: {}, inferior: {}, calzado: {}, accesorios: {} },
    equipped: { superior: null, inferior: null, calzado: null, accesorios: null },
    betaWelcomeClaimed: false,
    betaWelcomeSet: null,
  };
}

function normalizeWardrobe(raw) {
  const base = defaultWardrobe();
  const source = raw && typeof raw === "object" ? raw : {};
  WARDROBE_SLOTS.forEach((slot) => {
    const owned = source.owned?.[slot];
    if (owned && typeof owned === "object") {
      Object.entries(owned).forEach(([id, value]) => {
        if (value === true && getClothingItem(slot, id)) base.owned[slot][id] = true;
      });
    }
    const equipped = source.equipped?.[slot];
    if (typeof equipped === "string" && base.owned[slot][equipped] && getClothingItem(slot, equipped)) {
      base.equipped[slot] = equipped;
    }
  });
  base.betaWelcomeClaimed = source.betaWelcomeClaimed === true;
  base.betaWelcomeSet = typeof source.betaWelcomeSet === "string" ? source.betaWelcomeSet : null;
  return base;
}

function getClothingItem(slot, id) {
  return (typeof CLOTHING_CATALOG !== "undefined" && CLOTHING_CATALOG[slot] || []).find((item) => item.id === id) || null;
}

/**
 * Repara un `stats` guardado. Migra nombres viejos (v1: hambre/sed/
 * limpieza) a los nuevos (saciedad/hidratacion/higiene) cuando el
 * guardado es de antes de esta etapa y todavía no tiene los campos
 * nuevos. energia/felicidad no existían en v1 — una mascota migrada
 * arranca con esas dos en 100 (valor razonable: no había forma de que
 * estuvieran bajas si el sistema ni existía).
 */
function normalizeStats(rawStats) {
  const stats = rawStats && typeof rawStats === "object" ? rawStats : {};
  const numOr = (value, fallback) => (typeof value === "number" && !Number.isNaN(value) ? value : fallback);
  return {
    saciedad: clamp(numOr(stats.saciedad, numOr(stats.hambre, 100)), 0, 100),
    hidratacion: clamp(numOr(stats.hidratacion, numOr(stats.sed, 100)), 0, 100),
    higiene: clamp(numOr(stats.higiene, numOr(stats.limpieza, 100)), 0, 100),
    energia: clamp(numOr(stats.energia, 100), 0, 100),
    felicidad: clamp(numOr(stats.felicidad, 100), 0, 100),
  };
}

function normalizeCooldowns(rawCooldowns) {
  const c = rawCooldowns && typeof rawCooldowns === "object" ? rawCooldowns : {};
  const numOr = (value, fallback) => (typeof value === "number" && !Number.isNaN(value) ? value : fallback);
  const fallback = defaultCooldowns();
  // v1 tenía un solo cooldown de "hambre" para Alimentar; ahora hay 3
  // comidas separadas. Un guardado viejo con ese cooldown activo lo
  // hereda para las 3 (mejor eso que dejarlas todas gratis de golpe).
  const legacyHambre = numOr(c.hambre, 0);
  return {
    pescado: numOr(c.pescado, legacyHambre),
    comidaBasica: numOr(c.comidaBasica, legacyHambre),
    snack: numOr(c.snack, legacyHambre),
    golosina: numOr(c.golosina, legacyHambre),
    beber: numOr(c.beber, numOr(c.sed, fallback.beber)),
    bañar: numOr(c.bañar, numOr(c.limpieza, fallback.bañar)),
    jugar: numOr(c.jugar, fallback.jugar),
    pesca: numOr(c.pesca, fallback.pesca),
    hablar: numOr(c.hablar, fallback.hablar),
    medicina: numOr(c.medicina, fallback.medicina),
  };
}

function normalizeSleep(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  return {
    dormida: !!s.dormida,
    since: typeof s.since === "number" ? s.since : null,
  };
}

function normalizeHealth(raw) {
  const h = raw && typeof raw === "object" ? raw : {};
  const numOr = (value, fallback) => (typeof value === "number" && !Number.isNaN(value) ? value : fallback);
  const causasValidas = ["golosinas", "higiene", "necesidades"];
  return {
    malestar: clamp(numOr(h.malestar, 0), 0, 100),
    enferma: !!h.enferma,
    causa: causasValidas.includes(h.causa) ? h.causa : null,
  };
}

function normalizeBond(raw) {
  const b = raw && typeof raw === "object" ? raw : {};
  const numOr = (value, fallback) => (typeof value === "number" && !Number.isNaN(value) ? value : fallback);
  return { xp: Math.max(0, numOr(b.xp, 0)) };
}

/** Manchas del entorno: array chico de { id, xPct, yPct, createdAt }.
 * Se cortan a clean.maxDirtItems por las dudas (un guardado corrupto o de
 * una config vieja con el tope más alto no debería dejar más manchas de
 * las que la config actual permite mostrar). */
function normalizeDirtList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((d) => d && typeof d === "object" && typeof d.id === "string")
    .slice(0, PET_CONFIG.clean.maxDirtItems)
    .map((d) => ({
      id: d.id,
      xPct: clamp(typeof d.xPct === "number" ? d.xPct : 50, 5, 95),
      yPct: clamp(typeof d.yPct === "number" ? d.yPct : 70, 40, 90),
      createdAt: typeof d.createdAt === "number" ? d.createdAt : Date.now(),
    }));
}

/** v2.1: la suciedad ahora se guarda POR LUGAR — "cambiar de lugar no debe
 * limpiar automáticamente ni trasladar manchas de uno a otro" (pedido
 * explícito). state.dirt pasa de ser un array plano a { casa: [...],
 * jardin: [...] }. Un guardado v2.0 (array plano, sin distinguir lugar) se
 * migra completo hacia el lugar en el que ya estaba esa mascota — no había
 * forma de saber a qué escenario correspondía cada mancha vieja, así que
 * quedan todas donde la mascota migrada aparece por primera vez. */
function normalizeDirt(raw, location) {
  const result = { casa: [], jardin: [] };
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    result.casa = normalizeDirtList(raw.casa);
    result.jardin = normalizeDirtList(raw.jardin);
  } else if (Array.isArray(raw) && raw.length) {
    result[location] = normalizeDirtList(raw);
  }
  return result;
}

function normalizeGolosinaLog(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t) => typeof t === "number").slice(-20);
}

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultDailyProgress() {
  return { date: localDateKey(), feed: false, play: false, talk: false, rewarded: false, fishingPlays: 0 };
}

function normalizeDailyProgress(raw) {
  const today = localDateKey();
  if (!raw || typeof raw !== "object" || raw.date !== today) return defaultDailyProgress();
  return {
    date: today,
    feed: !!raw.feed,
    play: !!raw.play,
    talk: !!raw.talk,
    rewarded: !!raw.rewarded,
    fishingPlays: Number.isFinite(raw.fishingPlays) ? Math.max(0, Math.min(3, Math.floor(raw.fishingPlays))) : 0,
  };
}


function normalizeWorld(raw) {
  const w = raw && typeof raw === "object" ? raw : {};
  return {
    objects: {
      lamp_01: { on: !!w.objects?.lamp_01?.on },
      sofa_01: { lastRewardAt: Number.isFinite(w.objects?.sofa_01?.lastRewardAt) ? w.objects.sofa_01.lastRewardAt : 0 },
    },
  };
}

function normalizeEconomy(raw) {
  if (!raw || typeof raw !== "object") return { coins: 0 };
  const coins = Number.isFinite(raw.coins) ? Math.max(0, Math.floor(raw.coins)) : 0;
  return { coins };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== "object") return null;
  const now = Date.now();
  const numOr = (value, fallback) => (typeof value === "number" && !Number.isNaN(value) ? value : fallback);
  const location = normalizeLocation(raw.location, raw.scenario);
  return {
    version: STATE_VERSION,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Mi mascota",
    createdAt: numOr(raw.createdAt, now),
    lastUpdate: numOr(raw.lastUpdate, now),
    stats: normalizeStats(raw.stats),
    cooldowns: normalizeCooldowns(raw.cooldowns),
    look: normalizeLook(raw.look),
    location: location,
    sleep: normalizeSleep(raw.sleep),
    // Beta v1.0: enfermedad queda desactivada hasta su futuro rediseño.
    // Se conserva el campo para poder migrar guardados viejos sin perder
    // compatibilidad, pero ninguna mascota entra enferma en esta versión.
    health: { malestar: 0, enferma: false, causa: null },
    bond: normalizeBond(raw.bond),
    economy: normalizeEconomy(raw.economy),
    unlockedColors: Object.fromEntries(PET_PARTS_MANIFEST.bodyColor.filter((item) => item.locked && raw.unlockedColors?.[item.id] === true).map((item) => [item.id, true])),
    world: normalizeWorld(raw.world),
    digestion: { pending: Array.isArray(raw.digestion?.pending) ? raw.digestion.pending.filter(Number.isFinite).slice(0,40).sort((a,b)=>a-b) : [] },
    petPosition: { xPct: clamp(raw.petPosition?.xPct || 50, 8,92), yPct: clamp(raw.petPosition?.yPct || 75,40,88) },
    inventory: {
      pescado: Number.isFinite(raw.inventory?.pescado) ? Math.max(0, Math.floor(raw.inventory.pescado)) : 0,
      // Beta v4.6.1: chatarra de Pesca; más adelante se podrá vender.
      lata: Number.isFinite(raw.inventory?.lata) ? Math.max(0, Math.floor(raw.inventory.lata)) : 0,
    },
    wardrobe: normalizeWardrobe(raw.wardrobe),
    housing: normalizeHousing(raw.housing, !raw.housing),
    daily: normalizeDailyProgress(raw.daily),
    dirt: normalizeDirt(raw.dirt, location),
    golosinaLog: normalizeGolosinaLog(raw.golosinaLog),
    lastRequestAt: numOr(raw.lastRequestAt, 0),
  };
}

function createNewState(name, look, housingGiftStatus = "none") {
  const now = Date.now();
  return {
    version: STATE_VERSION,
    name: name || "Mi mascota",
    createdAt: now,
    lastUpdate: now,
    stats: defaultStats(),
    cooldowns: defaultCooldowns(),
    look: look || defaultLook(),
    location: defaultLocation(),
    sleep: { dormida: false, since: null },
    health: { malestar: 0, enferma: false, causa: null },
    bond: { xp: 0 },
    economy: { coins: 0 },
    unlockedColors: {},
    world: normalizeWorld(null),
    inventory: { pescado: 0, lata: 0 },
    wardrobe: defaultWardrobe(),
    housing: defaultHousing(housingGiftStatus),
    digestion: { pending: [] },
    petPosition: { xPct: 50, yPct: 75 },
    daily: defaultDailyProgress(),
    dirt: { casa: [], jardin: [] },
    golosinaLog: [],
    lastRequestAt: now,
  };
}

function recoveryKey() {
  return PET_CONFIG.storageKey + ".recovery";
}

function loadState() {
  let raw;
  try {
    raw = localStorage.getItem(PET_CONFIG.storageKey);
  } catch (e) {
    lastStorageNotice = "No se pudo acceder al guardado del navegador, así que el progreso no se va a guardar en esta sesión.";
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const normalized = normalizeState(parsed);
    if (normalized) return normalized;
    throw new Error("estado con forma inválida");
  } catch (e) {
    try {
      const backupRaw = localStorage.getItem(recoveryKey());
      if (backupRaw) {
        const backupParsed = JSON.parse(backupRaw);
        const normalizedBackup = normalizeState(backupParsed);
        if (normalizedBackup) {
          lastStorageNotice = "Tu guardado principal estaba dañado; se restauró tu mascota desde la última copia de seguridad automática.";
          return normalizedBackup;
        }
      }
    } catch (e2) {
      // la copia de seguridad también está rota; no hay nada más para intentar
    }
    lastStorageNotice = "Tu mascota guardada no se pudo leer (guardado dañado) y no había copia de seguridad utilizable. Se empieza de nuevo.";
    console.warn("No se pudo leer el estado guardado, se reinicia.", e);
    return null;
  }
}

function saveState(state) {
  try {
    const previousRaw = localStorage.getItem(PET_CONFIG.storageKey);
    if (previousRaw) {
      try {
        if (normalizeState(JSON.parse(previousRaw))) {
          localStorage.setItem(recoveryKey(), previousRaw);
        }
      } catch (e) {
        // el guardado anterior ya estaba roto: no lo usamos como respaldo
      }
    }
    localStorage.setItem(PET_CONFIG.storageKey, JSON.stringify(state));
    return true;
  } catch (e) {
    lastStorageNotice = "No se pudo guardar tu mascota en este navegador (¿modo privado, o sin espacio?). Los cambios de esta sesión pueden perderse.";
    console.warn("No se pudo guardar el estado.", e);
    return false;
  }
}

function clearState() {
  try {
    localStorage.removeItem(PET_CONFIG.storageKey);
    localStorage.removeItem(recoveryKey());
  } catch (e) {
    // si ni esto se puede, no hay mucho más para hacer
  }
}

/** ¿Cuántas de las causas de malestar (higiene/necesidades) están activas
 * ahora mismo, dado un `stats`? Se usa tanto en el tick en vivo como en
 * el cálculo de tiempo offline, así que queda en una sola función. */
function activeSicknessCauses(stats) {
  const causas = [];
  if (stats.higiene < PET_CONFIG.health.higieneEnfermaUmbral) causas.push("higiene");
  if (stats.saciedad < PET_CONFIG.health.necesidadEnfermaUmbral || stats.hidratacion < PET_CONFIG.health.necesidadEnfermaUmbral) {
    causas.push("necesidades");
  }
  return causas;
}

/**
 * Aplica el paso del tiempo real (minutos transcurridos desde
 * lastUpdate) a TODO el estado: necesidades (con ritmo reducido si está
 * durmiendo), salud/malestar (según causas activas), felicidad con piso
 * de ausencia, manchas nuevas con tope, y devuelve info de lo que pasó
 * (para poder mostrar un saludo o un aviso al volver).
 */
function applyDecay(state, now) {
  now = now || Date.now();
  const elapsedMs = Math.max(0, now - state.lastUpdate);
  const elapsedMinutes = elapsedMs / 60000;
  if (elapsedMinutes <= 0) return { elapsedMs: 0 };

  const wasAway = elapsedMs > 90 * 1000; // más que un tick normal: "se fue y volvió"
  const cfg = PET_CONFIG;
  const dormida = state.sleep.dormida;
  const decayMult = dormida ? cfg.sleep.decayMultiplier : 1;

  // Ausencias largas: se limita cuánto puede caer la felicidad SOLO por
  // el paso del tiempo (no por acciones activas) — pedido explícito,
  // "la felicidad debe poder recuperarse con una sesión razonable".
  const felicidadPiso = wasAway ? cfg.absence.felicidadPisoPorAusencia : 0;

  state.stats.saciedad = clamp(state.stats.saciedad - cfg.decayPerMinute.saciedad * decayMult * elapsedMinutes, 0, 100);
  state.stats.hidratacion = clamp(state.stats.hidratacion - cfg.decayPerMinute.hidratacion * decayMult * elapsedMinutes, 0, 100);
  state.stats.higiene = clamp(state.stats.higiene - cfg.decayPerMinute.higiene * decayMult * elapsedMinutes, 0, 100);
  // v3.2, pedido explícito: el ánimo decae más rápido cuando el resto de
  // las necesidades físicas está bajo (ver moodCouplingFactors más abajo).
  const moodCoupling = moodCouplingFactors(state.stats);
  const felicidadBajada = cfg.decayPerMinute.felicidad * decayMult * moodCoupling.decayMult * elapsedMinutes;
  state.stats.felicidad = clamp(Math.max(state.stats.felicidad - felicidadBajada, felicidadPiso), 0, 100);

  if (dormida) {
    state.stats.energia = clamp(state.stats.energia + cfg.sleep.energiaRecuperaPerMinuto * elapsedMinutes, 0, 100);
  } else {
    state.stats.energia = clamp(state.stats.energia - cfg.decayPerMinute.energia * elapsedMinutes, 0, 100);
  }

  // ---- Salud: malestar sube por causas activas, baja solo si no hay
  // ninguna. Para una ausencia larga, el aporte total queda topado
  // (pedido explícito: "aplicá límites configurables al deterioro por
  // ausencias largas") en vez de sumar sin fin minuto a minuto.
  // Each consumed meal is digested once. New waste only affects elapsed time after its creation.
  const dirtHere = state.dirt[state.location];
  let exposure = dirtHere.length * elapsedMinutes;
  while (state.digestion.pending.length && state.digestion.pending[0] <= now && dirtHere.length < cfg.clean.maxDirtItems) {
    const due = state.digestion.pending.shift();
    dirtHere.push({ id: "poop-" + due + "-" + dirtHere.length, xPct: state.petPosition.xPct, yPct: state.petPosition.yPct, createdAt: due });
    state.stats.higiene = clamp(state.stats.higiene - 8, 0, 100);
    exposure += Math.max(0, now - Math.max(state.lastUpdate, due)) / 60000;
  }
  state.stats.higiene = clamp(state.stats.higiene - exposure * .7, 0, 100);
  state.stats.felicidad = clamp(state.stats.felicidad - exposure * .5, 0, 100);
  // Beta v1.0: el sistema de enfermedad queda deliberadamente inactivo.
  // Higiene, necesidades y heces siguen afectando el bienestar, pero no
  // acumulan malestar ni generan una enfermedad imposible de tratar.
  state.health = { malestar: 0, enferma: false, causa: null };

  state.lastUpdate = now;
  return { elapsedMs, wasAway, extraño: wasAway && elapsedMs >= cfg.absence.saludoCariñosoDesdeMs };
}

/**
 * Estado de ánimo "de base" (el mismo mecanismo visual que ya existía:
 * maneja --eye-scale y las expresiones de cejas/boca por CSS) — calculado
 * sobre las 4 necesidades físicas. Los estados especiales (dormida,
 * enferma) se resuelven aparte en getPriorityStatus (js/app.js), que es
 * quien decide qué mostrar cuando hay varias cosas urgentes a la vez.
 */
/**
 * v3.2, pedido explícito: "que el ánimo baje mucho más rápido cuando las
 * barras de las demás necesidades están bajas y cueste subir el ánimo si
 * estas siguen bajas". Calcula, a partir del promedio de las 4
 * necesidades físicas (saciedad/hidratación/higiene/energía — la
 * felicidad NO se cuenta a sí misma acá), cuánto se acelera el
 * decaimiento del ánimo (decayMult) y cuánto se atenúa cualquier
 * ganancia de ánimo (gainMult). Por encima de moodCoupling.umbralNecesidades
 * el efecto es nulo (multiplicador 1); por debajo, interpola linealmente
 * hasta el máximo/mínimo configurado en PET_CONFIG.moodCoupling. Usada
 * tanto en applyDecay (acá mismo) como en gainFelicidad() (js/app.js).
 */
function moodCouplingFactors(stats) {
  const cfg = PET_CONFIG.moodCoupling;
  const otherAvg = (stats.saciedad + stats.hidratacion + stats.higiene + stats.energia) / 4;
  const t = clamp(1 - otherAvg / cfg.umbralNecesidades, 0, 1); // 0 = están bien, 1 = las 4 por el piso
  return {
    decayMult: 1 + t * (cfg.decayMultiplierMax - 1),
    gainMult: 1 - t * (1 - cfg.gainMultiplierMin),
  };
}

function moodFromStats(stats) {
  const values = [stats.saciedad, stats.hidratacion, stats.higiene, stats.energia, stats.felicidad];
  if (Math.min(...values) < PET_CONFIG.mood.critico) return "critico";
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg < PET_CONFIG.mood.normal) return "triste";
  if (avg < PET_CONFIG.mood.feliz) return "normal";
  return "feliz";
}

/** Nivel de vínculo a partir del xp acumulado — sólo una forma linda de
 * mostrarlo (no decae nunca, ver bond.xpPorNivel en config). */
function bondLevel(xp) {
  const per = PET_CONFIG.bond.xpPorNivel;
  const nivel = 1 + Math.floor(xp / per);
  const progreso = (xp % per) / per;
  return { nivel, progreso };
}
