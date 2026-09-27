/* ==========================================================================
   Beta v4.6 — Jugar (Pesca rehecha en v4.6.1, viajes y Penales en v4.6.2)
   Selector de juegos, viaje al juego, Pesca, Penales y pantalla de resultado.
   Todo lo de Jugar vive acá (antes estaba dentro de app.js). Usa funciones
   globales de app.js (state, el, gainFelicidad, addBond, trySave, …) sólo
   dentro de funciones, así que este archivo puede cargarse antes.
   ========================================================================== */

// Partida en curso. La leen app.js (no cambiar de lugar durante un juego)
// y game-interactions.js (Enter no abre el chat mientras se juega).
let minigame = null;

// v4.6.2: «viaje» a un juego. Mientras dura, el juego ocupa todo el
// escenario, la mascota desaparece de la casa (también para los demás
// jugadores de la sala) y al salir se vuelve con pantalla de carga.
let gameTrip = null;

const GAME_LIMITS = { pescaPorDia: 3 };

const GAMES = {
  pesca: {
    id: "pesca",
    title: "Pesca",
    travel: "Viajando a pescar...",
    casts: 3,
    goal: 2,
    fishChance: .8,
  },
  penales: {
    id: "penales",
    title: "Penales",
    travel: "Viajando a la cancha...",
    shots: 5,
    goal: 3,
  },
  // v4.6.4: ruleta diaria. No se viaja: se abre encima de la casa, como el
  // inventario (ver js/roulette.js).
  ruleta: {
    id: "ruleta",
    title: "Ruleta diaria",
    overlay: true,
  },
};

const GAME_ICON = {
  coin: "assets/shop/moneda.svg",
  fish: "assets/ui/inventory/cofre/pescado.svg",
  can: liteArt("assets/games/fishing/can.svg"),
  energy: liteArt("assets/ui/ficha/energia.svg"),
  ball: liteArt("assets/games/penalty/ball.svg"),
};

// Beta v4.6.1: arte de Pesca (vectorizado con scripts/vectorize-fishing-assets.py).
const FISHING_ART = {
  lake: liteArt("assets/games/fishing/lake.svg"),
  rod: liteArt("assets/games/fishing/rod.svg"),
  icon: liteArt("assets/games/fishing/rod-icon.svg"),
  bobber: "assets/games/fishing/bobber.svg",
};
// Beta v4.6.2: arte de Penales (scripts/vectorize-games-v462.py).
const PENALTY_ART = {
  field: liteArt("assets/games/penalty/field.svg"),
  ball: liteArt("assets/games/penalty/ball.svg"),
  gloveL: liteArt("assets/games/penalty/glove-left.svg"),
  gloveR: liteArt("assets/games/penalty/glove-right.svg"),
};
const GAME_PANEL_ICON = { pesca: FISHING_ART.icon, penales: PENALTY_ART.ball, ruleta: liteArt("assets/games/roulette/icon.svg") };
const GAME_PRELOAD = {
  pesca: [FISHING_ART.lake, FISHING_ART.rod, FISHING_ART.bobber],
  penales: [PENALTY_ART.field, PENALTY_ART.ball, PENALTY_ART.gloveL, PENALTY_ART.gloveR],
};

const SVG_HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 3 4.5 6.6 4.5c2.2 0 3.6 1.3 5.4 3.3 1.8-2 3.2-3.3 5.4-3.3 3.6 0 5.8 3.7 4.2 7.3C19.5 16.4 12 21 12 21z" fill="#f06a8a" stroke="#5a3a22" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const SVG_STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="#ffd34d" stroke="#5a3a22" stroke-width="1.8" stroke-linejoin="round"/></svg>';

const $g = (id) => document.getElementById(id);

// ---------------------------------------------------------------- Escenas

let gamesSceneId = 0;

// Geometría de la escena de Pesca, en unidades del lago (1672 × 941).
const FISHING_SCENE = {
  w: 1672,
  h: 941,
  // La bocha cae en esta zona del agua, a la derecha del barco.
  target: { x0: 1180, x1: 1440, y0: 690, y1: 790 },
  hang: 88,      // largo del hilo con la bocha colgando de la punta
  bobberW: 58,   // ancho de la bocha dibujada
};

/*
 * Capas, de atrás hacia adelante:
 *  1. el lago completo (con el barco);
 *  2. la mascota sosteniendo la caña (base de la caña; el hilo y la bocha
 *     van aparte para poder animarlos);
 *     (hotfix v4.6.3: la mascota se recorta en el borde rojo del barco con
 *     clip-path, así queda «adentro»; antes lo hacía una segunda copia del
 *     lago y dejaba una línea fina en el agua);
 *  3. hilo, ondas, bocha y lo que se pesca.
 */
function fishingSceneHtml() {
  const u = ++gamesSceneId;
  const S = FISHING_SCENE;
  const bw = S.bobberW, bh = bw * 393 / 400;
  // La caña (1000 × 750) se toma de la empuñadura (170, 590); la punta,
  // donde sale el hilo, queda en (935, 95). Escala dentro del lienzo 400 × 400 de la mascota.
  const k = .33, hx = 298, hy = 204;
  return `<div class="fishing-scene" aria-hidden="true">
  <img class="fs-lake" src="${FISHING_ART.lake}" alt="" draggable="false" />
  <div class="fs-pet">
    <div class="fs-pet-body">
      <div class="pet-stage fs-pet-stage"></div>
      <svg class="fs-rod-layer" viewBox="0 0 400 400">
        <g class="fs-rod-arm">
          <g class="fs-rod-flex" style="transform-origin: ${hx}px ${hy}px">
            <image href="${FISHING_ART.rod}" x="${hx - 170 * k}" y="${hy - 590 * k}" width="${1000 * k}" height="${750 * k}"/>
            <circle class="fs-rod-tip" cx="${hx + 765 * k}" cy="${hy - 495 * k}" r="1" fill="none"/>
          </g>
          <circle class="fs-paw" cx="${hx}" cy="${hy}" r="9.5"/>
        </g>
      </svg>
    </div>
  </div>
  <svg class="fs-fx" viewBox="0 0 ${S.w} ${S.h}">
    <defs>
      <clipPath id="fs-waterline-${u}" clipPathUnits="userSpaceOnUse"><rect class="fs-waterline" x="-200" y="-400" width="400" height="800"/></clipPath>
    </defs>
    <g class="fs-ripples" transform="translate(-999 -999)">
      <ellipse class="fs-ripple" rx="34" ry="9"/><ellipse class="fs-ripple" rx="34" ry="9"/><ellipse class="fs-ripple" rx="34" ry="9"/>
    </g>
    <path class="fs-line-shadow" d=""/>
    <path class="fs-line" d=""/>
    <g class="fs-bobber" transform="translate(-999 -999)">
      <g class="fs-catch"><image class="fs-catch-img" href="${GAME_ICON.fish}" x="-58" y="34" width="104" height="82"/></g>
      <g clip-path="url(#fs-waterline-${u})">
        <g class="fs-bobber-bob">
          <image href="${FISHING_ART.bobber}" x="${-bw * .62}" y="${-bh * .02}" width="${bw}" height="${bh}"/>
        </g>
      </g>
    </g>
  </svg>
</div>`;
}

// Penales (v4.6.2): cancha ilustrada, pelota y arquero hecho sólo de
// guantes. Todo en unidades de la cancha (1254 × 706), igual que la Pesca
// usa las del lago. El SVG se apoya abajo y recorta cielo si sobra alto.
const PENALTY_SCENE = {
  w: 1254,
  h: 706,
  // Arco (bordes internos de los palos y del travesaño; piso en y = 412).
  goal: { left: 296, right: 957, top: 168, bottom: 410 },
  posts: [
    { x0: 273, x1: 296, y0: 145, y1: 414 },
    { x0: 957, x1: 980, y0: 145, y1: 414 },
    { x0: 273, x1: 980, y0: 145, y1: 168 },
  ],
  spot: { x: 627, y: 604 },
  ballSize: 78,      // diámetro de la pelota en el punto penal
  ballFar: .44,      // escala al llegar al arco (perspectiva)
  keeperHome: { x: 627, y: 300 },
  gloveH: 104,
  gloveGap: 62,      // distancia del centro del arquero a cada guante
};

function penaltySceneHtml() {
  const S = PENALTY_SCENE;
  const gh = S.gloveH, gwL = gh * 227 / 360, gwR = gh * 211 / 360;
  const b = S.ballSize;
  return `<div class="penalty-scene">
  <svg class="pk-svg" viewBox="0 0 ${S.w} ${S.h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <image href="${PENALTY_ART.field}" x="0" y="0" width="${S.w}" height="${S.h}" preserveAspectRatio="none"/>
    <ellipse class="pk-ball-shadow" cx="0" cy="0" rx="${b * .5}" ry="${b * .14}" transform="translate(${S.spot.x} ${S.spot.y + b * .46})"/>
    <g class="pk-keeper" transform="translate(${S.keeperHome.x} ${S.keeperHome.y})">
      <g class="pk-keeper-tilt">
        <g class="pk-glove pk-glove-l" transform="translate(${-S.gloveGap} 0)"><image href="${PENALTY_ART.gloveL}" x="${-gwL / 2}" y="${-gh / 2}" width="${gwL}" height="${gh}"/></g>
        <g class="pk-glove pk-glove-r" transform="translate(${S.gloveGap} 0)"><image href="${PENALTY_ART.gloveR}" x="${-gwR / 2}" y="${-gh / 2}" width="${gwR}" height="${gh}"/></g>
      </g>
    </g>
    <g class="pk-aim" transform="translate(-999 -999)">
      <circle r="30" class="pk-aim-ring"/>
      <circle r="12" class="pk-aim-ring pk-aim-inner"/>
      <path d="M-44 0H-20M20 0H44M0 -44V-20M0 20V44" class="pk-aim-cross"/>
    </g>
    <g class="pk-ball" transform="translate(${S.spot.x} ${S.spot.y})">
      <g class="pk-ball-spin"><image href="${PENALTY_ART.ball}" x="${-b / 2}" y="${-b / 2}" width="${b}" height="${b}"/></g>
    </g>
  </svg>
  <div class="pk-power" hidden>
    <span class="pk-power-label">Potencia</span>
    <div class="pk-power-track"><span class="pk-power-sweet"></span><span class="pk-power-needle"></span></div>
  </div>
</div>`;
}

// --------------------------------------------------------------- Helpers

function gamesTimer(fn, ms) {
  const id = setTimeout(() => { if (minigame) minigame.timers.delete(id); fn(); }, ms);
  if (minigame) minigame.timers.add(id);
  return id;
}
function gamesFrame(fn) {
  if (!minigame) return;
  const run = (t) => { if (!minigame) return; if (fn(t) !== false) minigame.raf = requestAnimationFrame(run); };
  cancelAnimationFrame(minigame.raf);
  minigame.raf = requestAnimationFrame(run);
}
function gamesStopFrame() { if (minigame) cancelAnimationFrame(minigame.raf); }
function gamesClearAll() {
  if (!minigame) return;
  minigame.timers.forEach(clearTimeout);
  minigame.timers.clear();
  clearInterval(minigame.clock);
  cancelAnimationFrame(minigame.raf);
}
function gamesHint(text) {
  const h = $g("minigame-instructions");
  if (!h || h.textContent === text) return;
  h.textContent = text;
  // v4.6.8: cada indicación nueva aparece con un pequeño salto, para que se note.
  h.classList.remove("is-new");
  void h.offsetWidth;
  if (text) h.classList.add("is-new");
}
function gamesQ(sel) { return $g("minigame-arena")?.querySelector(sel); }
function gamesWait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function gamesPreload(sources) {
  return Promise.all(sources.map((src) => new Promise((resolve) => {
    const image = new Image();
    image.onload = image.onerror = resolve;
    image.src = src;
    if (image.complete) resolve();
  })));
}

// v4.6.2 — Modo prueba (sólo la cuenta admin): minijuegos sin límite de
// partidas diarias ni espera. Queda en este navegador, fuera del guardado,
// así no viaja a la nube ni le cambia nada a nadie más.
const GAMES_UNLIMITED_KEY = "mascotito.adminMinijuegosSinLimite";
function gamesUnlimited() {
  if (typeof isAdmin !== "function" || !isAdmin()) return false;
  try { return localStorage.getItem(GAMES_UNLIMITED_KEY) === "1"; } catch (e) { return false; }
}
function setGamesUnlimited(on) {
  try { if (on) localStorage.setItem(GAMES_UNLIMITED_KEY, "1"); else localStorage.removeItem(GAMES_UNLIMITED_KEY); } catch (e) { /* sin almacenamiento: queda apagado */ }
}
/** Reinicia las partidas de pesca de hoy y la espera de Penales. */
function resetMinigameCounters(target = state) {
  if (!target) return;
  target.daily = target.daily || {};
  target.daily.fishingPlays = 0;
  target.daily.rouletteSpun = false;
  if (target.cooldowns) target.cooldowns.jugar = 0;
}

function fishingPlaysRemaining() {
  ensureDailyProgress();
  return Math.max(0, GAME_LIMITS.pescaPorDia - (state.daily.fishingPlays || 0));
}

/** ¿Se puede empezar este juego ahora? Devuelve el motivo si no. */
function gameBlockReason(id) {
  if (id === "ruleta") {
    ensureDailyProgress();
    return !gamesUnlimited() && state.daily.rouletteSpun ? "Ya giraste la ruleta hoy. Volvé mañana." : "";
  }
  if (state.sleep.dormida) return "Despertá a tu mascota para jugar.";
  if (gamesUnlimited()) return "";
  if (state.stats.energia < PET_CONFIG.play.energiaMinimaParaJugar) return "Está muy cansada: necesita descansar antes de jugar.";
  if (id === "pesca" && !fishingPlaysRemaining()) return "Ya usaste las 3 partidas de pesca de hoy. Volvé mañana.";
  if (id === "penales" && isOnCooldown("jugar")) return `Podés patear de nuevo en ${formatCooldownPhrase(state.cooldowns.jugar - Date.now())}.`;
  return "";
}

function gameStatusText(id) {
  if (gamesUnlimited()) return "Sin límite (modo prueba)";
  if (id === "ruleta") return "Una tirada por día: disponible";
  if (id === "pesca") {
    const left = fishingPlaysRemaining();
    return left ? `Te quedan ${left} de ${GAME_LIMITS.pescaPorDia} partidas hoy` : "Sin partidas hasta mañana";
  }
  if (isOnCooldown("jugar")) return `Otra vez en ${formatCooldownPhrase(state.cooldowns.jugar - Date.now())}`;
  return "Disponible";
}

// --------------------------------------------------------------- Selector
// v4.6.2: ventana sin título con dos paneles que se tocan enteros para
// jugar. v4.6.3: ventana-tablet (minijuegos_v2.ai) y sólo el ícono de cada
// juego, sin nombre visible (queda para lectores de pantalla). El
// estado (partidas que quedan o espera) va en el título emergente y en el
// nombre accesible; si no se puede jugar, el panel se apaga y al tocarlo
// explica por qué abajo.

let gameSelectorTick = null;

function renderGameCards() {
  const box = $g("game-choices");
  if (!box) return;
  box.innerHTML = Object.values(GAMES).map((g) => `
    <button type="button" class="game-panel" data-play="${g.id}">
      <img class="game-panel-icon" src="${GAME_PANEL_ICON[g.id]}" alt="" draggable="false" />
      <span class="sr-only">${g.title}</span>
    </button>`).join("");
  box.querySelectorAll("[data-play]").forEach((btn) => btn.addEventListener("click", () => launchGame(btn.dataset.play)));
}

function updateGameCards() {
  const panel = $g("game-selector");
  if (!panel || panel.hidden || !state) return;
  panel.querySelectorAll("[data-play]").forEach((btn) => {
    const id = btn.dataset.play;
    const why = gameBlockReason(id);
    const status = why || gameStatusText(id);
    btn.classList.toggle("is-blocked", !!why);
    btn.setAttribute("aria-disabled", String(!!why));
    btn.title = status;
    btn.setAttribute("aria-label", `${GAMES[id].title}. ${status}`);
  });
  const note = $g("game-selector-note");
  const general = state.sleep.dormida || (!gamesUnlimited() && state.stats.energia < PET_CONFIG.play.energiaMinimaParaJugar) ? gameBlockReason("pesca") : "";
  if (note && !note.dataset.sticky) note.textContent = general;
}

function openGameSelector() {
  if (minigame || gameTrip || navLock) return;
  closeAllMenus();
  closeGamePanel();
  const panel = $g("game-selector");
  panel.hidden = false;
  delete $g("game-selector-note").dataset.sticky;
  updateGameCards();
  clearInterval(gameSelectorTick);
  gameSelectorTick = setInterval(updateGameCards, 1000);
  panel.querySelector(".game-panel:not(.is-blocked)")?.focus();
}

function closeGameSelector(returnFocus = true) {
  const panel = $g("game-selector");
  if (!panel || panel.hidden) return;
  panel.hidden = true;
  clearInterval(gameSelectorTick);
  if (returnFocus) document.getElementById("btn-jugar")?.focus();
}

function doJugar() { openGameSelector(); }

// ------------------------------------------------------------- Viaje
// Ir: pantalla de carga «Viajando a …» → el juego ocupa todo el escenario.
// Volver: pantalla de carga «Volviendo a casa...» → la casa como estaba.

function setTripVisuals(on) {
  el.stageFloor?.classList.toggle("is-minigame", on);
  // La mascota deja la casa: también para quienes estén en la sala.
  if (typeof setRealtimeAway === "function") setRealtimeAway(on);
}

async function travelToGame(id) {
  const game = GAMES[id];
  if (activeVisit) closeVisit({ skipTransition: true });
  gameTrip = { id };
  const seq = beginStageTransition(game.travel);
  setTripVisuals(true);
  startMinigame(id);
  await Promise.race([gamesPreload(GAME_PRELOAD[id] || []), gamesWait(4000)]);
  await endStageTransition(seq);
  if (minigame && gameTrip?.id === id) gamesQ(minigame.type.id === "pesca" ? ".games-action" : ".penalty-scene")?.focus();
}

/** Sale del juego (si hay partida, se cancela) y vuelve a casa. */
async function returnHome() {
  if (!gameTrip && $g("minigame-panel")?.hidden) return;
  const seq = beginStageTransition("Volviendo a casa...");
  await nextStagePaint();
  if (minigame) finishMinigame(true, { quiet: true });
  closeGamePanel();
  if (typeof refreshUI === "function" && state) { refreshUI(); updateCooldownButtons(); }
  if (typeof computeWalkBounds === "function") computeWalkBounds();
  await endStageTransition(seq, state?.location === "casa" ? state.housing : null);
  document.getElementById("btn-jugar")?.focus();
}

// ------------------------------------------------------------ Partida

function launchGame(id) {
  const game = GAMES[id];
  if (!game || minigame || !state) return;
  const reason = gameBlockReason(id);
  if (reason) {
    const note = $g("game-selector-note");
    if (note && !$g("game-selector").hidden) { note.textContent = reason; note.dataset.sticky = "1"; }
    else notifySystem(reason);
    return;
  }
  if (game.overlay) {
    // La ruleta no viaja: se abre encima, como el inventario.
    closeGameSelector(false);
    openRoulette();
    return;
  }
  if (!gamesUnlimited()) {
    if (id === "pesca") {
      // Cada inicio cuenta (aunque se cancele); se guarda enseguida.
      state.daily.fishingPlays = (state.daily.fishingPlays || 0) + 1;
      trySave(state);
    } else {
      startCooldown("jugar");
    }
  }
  registerInteraction();
  updateCooldownButtons();
  closeGameSelector(false);
  closeAllMenus();
  if (gameTrip?.id === id) {
    // «Otra vez» desde el resultado: ya estamos ahí, sin viajar de nuevo.
    startMinigame(id);
    gamesQ(id === "pesca" ? ".games-action" : ".penalty-scene")?.focus();
  } else {
    travelToGame(id);
  }
}

function startMinigame(id) {
  const game = GAMES[id];
  minigame = { type: game, score: 0, timers: new Set(), raf: 0, clock: 0, phase: "" };
  emitRealtimeAction("play", { game: id });

  const panel = $g("minigame-panel");
  panel.dataset.game = id;
  $g("minigame-title").textContent = game.title;
  $g("minigame-result").hidden = true;
  $g("minigame-result").innerHTML = "";
  const arena = $g("minigame-arena");
  arena.hidden = false;
  arena.dataset.game = id;
  delete arena.dataset.phase;
  delete arena.dataset.catch;
  delete arena.dataset.result;
  arena.innerHTML = id === "pesca"
    ? fishingSceneHtml() + `
    <div class="games-controls">
      <button type="button" class="games-btn games-action"></button>
    </div>`
    : penaltySceneHtml();
  panel.hidden = false;
  const action = arena.querySelector(".games-action");
  action?.addEventListener("click", (ev) => { ev.stopPropagation(); gameAction(); });
  if (id === "pesca") startFishing(); else startPenalties();
}

function gameAction() {
  if (!minigame) return;
  if (minigame.type.id === "pesca") fishingAction();
}

function updateGameChips() {
  if (!minigame) return;
  const g = minigame.type;
  const score = $g("minigame-score");
  const time = $g("minigame-time");
  if (g.id === "pesca") {
    score.innerHTML = `<img src="${GAME_ICON.fish}" alt="Pescados" /> ${minigame.score} <img src="${GAME_ICON.can}" alt="Latas" /> ${minigame.cans}`;
    time.textContent = `Lanzamiento ${Math.min(minigame.cast + 1, g.casts)}/${g.casts}`;
  } else {
    score.innerHTML = `<img src="${GAME_ICON.ball}" alt="" /> ${minigame.score} ${minigame.score === 1 ? "gol" : "goles"}`;
    time.textContent = `Tiro ${Math.min(minigame.shot + 1, g.shots)}/${g.shots}`;
  }
}

function setAction(label, { disabled = false, hot = false } = {}) {
  const btn = gamesQ(".games-action");
  if (!btn) return;
  btn.textContent = label;
  btn.classList.toggle("is-waiting", disabled);
  btn.classList.toggle("is-hot", hot);
  btn.setAttribute("aria-disabled", String(disabled));
}

// ---------------------------------------------------------------- Pesca
// Tres lanzamientos por partida: Lanzar → la bocha cae al agua → los peces
// la tantean → pica y hay que tocar Pescar a tiempo. Si se toca antes o se
// deja pasar, el tiro se pierde. Lo que sale: 80 % pescado, 20 % lata.
// La mascota tiene una animación por fase (ver data-phase en games.css):
// idle, cast (lanza), wait/nibble/bite (espera) y reel (recoge).

const fsLerp = (a, b, p) => a + (b - a) * p;
const fsEaseInOut = (p) => (p < .5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

/* v4.6.6 (rendimiento en celular): la pose de la mascota que pesca (brazo
   con la caña, flexión de la caña y cuerpo) ya no la anima CSS con
   propiedades heredadas (--fs-arm/--fs-flex obligaban a recalcular los
   estilos de toda la mascota en cada cuadro) ni se mide la punta de la caña
   con getBoundingClientRect (forzaba el recálculo). Ahora se calcula acá,
   con las mismas curvas y tiempos que tenían las animaciones CSS, se
   escribe directo en los 4 nodos que se mueven y la punta sale por cuenta. */
function fsBezier(x1, y1, x2, y2) {
  const bx = (t) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3;
  const dbx = (t) => 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = bx(t) - x;
      if (Math.abs(err) < 1e-4) break;
      const d = dbx(t);
      if (Math.abs(d) < 1e-6) break;
      t = Math.min(1, Math.max(0, t - err / d));
    }
    return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
  };
}
const FS_EASE = {
  inOut: fsBezier(.42, 0, .58, 1),
  ease: fsBezier(.25, .1, .25, 1),
  out: fsBezier(0, 0, .58, 1),
  cast: fsBezier(.3, .7, .3, 1),
};
// a = brazo (grados), f = flexión de la caña; cuerpo: r = giro, x/y = % de la caja.
// "from" = arranca desde la pose en la que estaba (sin saltos).
const FS_POSES = {
  idle: {
    arm: { dur: 2400, ease: "inOut", loop: true, frames: [[0, { a: -4, f: 0 }], [.5, { a: 3, f: -2 }], [1, { a: -4, f: 0 }]] },
    body: { dur: 2400, ease: "inOut", loop: true, frames: [[0, {}], [.5, { r: -1, y: -1.2 }], [1, {}]] },
    still: { a: 0 },
  },
  cast: {
    arm: { dur: 1040, ease: "cast", frames: [[0, { a: 0, f: 0 }], [.32, { a: -50, f: -8 }], [.48, { a: 26, f: 10 }], [.66, { a: 5, f: -4 }], [1, { a: 8, f: 0 }]] },
    body: { dur: 1040, ease: "ease", frames: [[0, "from"], [.32, { r: -6, x: -2 }], [.48, { r: 6, x: 2 }], [1, { r: 2 }]] },
    still: { a: 0 },
  },
  wait: {
    arm: { dur: 3000, ease: "inOut", loop: true, frames: [[0, { a: 8 }], [.5, { a: 5, f: 1.5 }], [1, { a: 8 }]] },
    body: { dur: 3000, ease: "inOut", loop: true, clock: "wait", frames: [[0, { r: 2 }], [.5, { r: 3, y: .8 }], [1, { r: 2 }]] },
    still: { a: 8 },
  },
  nibble: {
    arm: { dur: 650, ease: "inOut", frames: [[0, { a: 8 }], [.25, { a: 11, f: 5 }], [.5, { a: 7, f: -1 }], [.75, { a: 10, f: 3 }], [1, { a: 8 }]] },
    body: { dur: 3000, ease: "inOut", loop: true, clock: "wait", frames: [[0, { r: 2 }], [.5, { r: 3, y: .8 }], [1, { r: 2 }]] },
    still: { a: 8 },
  },
  bite: {
    arm: { dur: 260, ease: "inOut", loop: true, alternate: true, frames: [[0, { a: 9, f: 4 }], [1, { a: 15, f: 11 }]] },
    body: { dur: 200, ease: "ease", frames: [[0, "from"], [1, { r: 5, x: 1.5 }]] },
    still: { a: 8 }, stillBody: { r: 5, x: 1.5 },
  },
  reel: {
    arm: { dur: 900, ease: "out", frames: [[0, { a: 10, f: 6 }], [.25, { a: -30, f: -10 }], [.4, { a: -22, f: -4 }], [.55, { a: -32, f: -9 }], [.7, { a: -24, f: -3 }], [1, { a: -12, f: 0 }]] },
    body: { dur: 900, ease: "out", frames: [[0, "from"], [.25, { r: -6, x: -2 }], [.4, { r: -4, x: -1.5 }], [.55, { r: -6, x: -2 }], [1, { r: -1 }]] },
    still: { a: -12 },
  },
};
// Geometría de la caña dentro del lienzo 400 × 400 de la mascota (ver fishingSceneHtml).
const FS_ROD = { shoulder: { x: 221.2, y: 198.8 }, grip: { x: 298, y: 204 }, tip: { x: 298 + 765 * .33, y: 204 - 495 * .33 } };
// Caja de la mascota en el lago (left 29.3 %, top 27.5 %, ancho 27.5 %) y
// origen del giro del cuerpo (50 % 66 %).
const FS_PET_BOX = { x: .293 * 1672, y: .275 * 941, size: .275 * 1672, origin: { x: 200, y: 264 } };

function fsSample(anim, elapsed, from) {
  let p = elapsed / anim.dur;
  if (anim.loop) {
    const cycle = Math.floor(p);
    p -= cycle;
    if (anim.alternate && cycle % 2) p = 1 - p;
  } else p = Math.min(1, Math.max(0, p));
  const frames = anim.frames;
  let i = 0;
  while (i < frames.length - 2 && p > frames[i + 1][0]) i++;
  const [o0, v0raw] = frames[i];
  const [o1, v1raw] = frames[i + 1];
  const v0 = v0raw === "from" ? from || {} : v0raw;
  const v1 = v1raw === "from" ? from || {} : v1raw;
  const e = FS_EASE[anim.ease]((p - o0) / (o1 - o0 || 1));
  const out = {};
  new Set([...Object.keys(v0), ...Object.keys(v1)]).forEach((k) => { out[k] = fsLerp(v0[k] || 0, v1[k] || 0, e); });
  return out;
}

const FS_REDUCED_MOTION = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
function fsReduceMotion() {
  return !!FS_REDUCED_MOTION?.matches;
}

/** Pose actual { a, f, r, x, y } según la fase y el tiempo. */
function fishingPose(t) {
  const m = minigame;
  const spec = FS_POSES[m?.phase] || FS_POSES.idle;
  const P = m.pose || (m.pose = { t0: t, waitT0: t, body: {} });
  // Hotfix v4.6.8: con «movimiento reducido» faltaban r/x/y y fallaba cada
  // cuadro (no se dibujaban ni el hilo ni la bocha).
  if (fsReduceMotion()) return { a: spec.still.a, f: 0, r: 0, x: 0, y: 0, ...(spec.stillBody || {}) };
  const arm = fsSample(spec.arm, t - P.t0);
  const bodyClock = spec.body.clock === "wait" ? P.waitT0 : P.t0;
  const body = fsSample(spec.body, t - bodyClock, P.fromBody);
  return { a: arm.a || 0, f: arm.f || 0, r: body.r || 0, x: body.x || 0, y: body.y || 0 };
}

/** Escribe la pose en los nodos (sólo si cambió) y la guarda. */
function fishingApplyPose(pose) {
  const m = minigame;
  const els = fishingEls();
  if (!els) return;
  const bodyT = `rotate(${pose.r.toFixed(2)}deg) translate(${pose.x.toFixed(2)}%, ${pose.y.toFixed(2)}%)`;
  const armT = `rotate(${pose.a.toFixed(2)}deg)`;
  const flexT = `rotate(${pose.f.toFixed(2)}deg)`;
  const petArm = `rotate(${(-55 + pose.a).toFixed(2)}deg)`;
  const key = `${bodyT}|${armT}|${flexT}`;
  if (m.poseKey !== key) {
    m.poseKey = key;
    els.body.style.transform = bodyT;
    els.rodArm.style.transform = armT;
    els.rodFlex.style.transform = flexT;
    els.petArms.forEach((node) => {
      node.style.transform = node.classList.contains("ropa-brazo") ? `${petArm} scale(1.14)` : petArm;
    });
  }
  if (m.pose) m.pose.body = { r: pose.r, x: pose.x, y: pose.y };
}

/** Nodos de la escena que se mueven (se vuelven a buscar si la mascota se redibujó). */
function fishingEls() {
  const m = minigame;
  let els = m.fsEls;
  const stale = !els || !els.body.isConnected || els.petArms.some((node) => !node.isConnected)
    || (els.stage && els.stage.firstChild !== els.stageFirst);
  if (stale) {
    const body = gamesQ(".fs-pet-body");
    if (!body) return null;
    const stage = gamesQ(".fs-pet-stage");
    els = m.fsEls = {
      body,
      rodArm: gamesQ(".fs-rod-arm"),
      rodFlex: gamesQ(".fs-rod-flex"),
      bobber: gamesQ(".fs-bobber"),
      waterline: gamesQ(".fs-waterline"),
      line: gamesQ(".fs-line"),
      lineShadow: gamesQ(".fs-line-shadow"),
      stage,
      stageFirst: stage?.firstChild || null,
      petArms: stage ? [...stage.querySelectorAll("#brazo-der, .ropa-brazo-der")] : [],
    };
    m.poseKey = "";
  }
  return els;
}

function startFishing() {
  const m = minigame;
  m.cast = 0;
  m.cans = 0;
  m.castId = 0;
  m.bob = { mode: "hang" };
  const stage = gamesQ(".fs-pet-stage");
  if (stage) {
    renderPetLayers(stage, state.look, state.wardrobe);
    // La mano que tapa la caña usa el mismo color de cuerpo.
    gamesQ(".fs-pet")?.style.setProperty("--pet-body-color", stage.style.getPropertyValue("--pet-body-color"));
  }
  gamesFrame(fishingDraw);
  fishingReady();
}

function fishingPhase(phase) {
  const m = minigame;
  const prev = m.phase;
  m.phase = phase;
  $g("minigame-arena").dataset.phase = phase;
  // La pose arranca de nuevo con cada fase; el cuerpo sigue su ciclo entre
  // «espera» y «tantean» (en CSS era la misma animación).
  const now = performance.now();
  const P = m.pose || (m.pose = { body: {} });
  P.t0 = now;
  P.fromBody = { ...(P.body || {}) };
  const waiting = (p) => p === "wait" || p === "nibble";
  if (!(waiting(phase) && waiting(prev)) || P.waitT0 == null) P.waitT0 = now;
}

function fishingReady() {
  const m = minigame;
  if (!m) return;
  if (m.cast >= m.type.casts) { finishMinigame(false); return; }
  fishingPhase("idle");
  fishingRipples("off");
  hidePenaltyBanner();
  delete $g("minigame-arena").dataset.catch;
  m.bob = { mode: "hang" };
  updateGameChips();
  setAction("Lanzar", { hot: true });
  gamesHint(m.cast ? "¡Otra vez! Tocá Lanzar." : "Tocá Lanzar para tirar la bocha al agua.");
}

function fishingAction() {
  const m = minigame;
  if (m.phase === "idle") fishingCast();
  else if (m.phase === "bite") fishingReel(true);
  else if (m.phase === "wait" || m.phase === "nibble") fishingReel(false, "early");
}

function fishingCast() {
  const m = minigame;
  const T = FISHING_SCENE.target;
  const id = ++m.castId;
  fishingPhase("cast");
  setAction("Pescar", { disabled: true });
  gamesHint("¡Allá va!");
  m.target = { x: fsLerp(T.x0, T.x1, Math.random()), y: fsLerp(T.y0, T.y1, Math.random()) };
  // La bocha se suelta cuando la caña pasa hacia adelante (ver fsCast).
  gamesTimer(() => { if (m.castId === id) m.bob = { mode: "fly", from: fishingHangPoint(performance.now()), t0: performance.now(), dur: 620 }; }, 420);
  gamesTimer(() => fishingLanded(id), 420 + 620);
}

function fishingLanded(id) {
  const m = minigame;
  if (!m || m.castId !== id) return;
  m.bob = { mode: "water" };
  fishingRipples("splash");
  fishingPhase("wait");
  setAction("Pescar");
  gamesHint("Esperá a que pique…");
  // Primero la tantean (de 1 a 3 veces) y después pican de verdad.
  let at = 1000 + Math.random() * 1300;
  const nibbles = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < nibbles; i++) {
    gamesTimer(() => fishingNibble(id), at);
    at += 850 + Math.random() * 900;
  }
  gamesTimer(() => fishingBite(id), at);
}

function fishingNibble(id) {
  const m = minigame;
  if (!m || m.castId !== id || (m.phase !== "wait" && m.phase !== "nibble")) return;
  fishingPhase("nibble");
  fishingRipples("nibble");
  gamesHint("Algo está tanteando la bocha… ¡todavía no!");
  gamesTimer(() => {
    if (minigame !== m || m.castId !== id || m.phase !== "nibble") return;
    fishingPhase("wait");
    gamesHint("Esperá a que pique…");
  }, 650);
}

function fishingBite(id) {
  const m = minigame;
  if (!m || m.castId !== id || (m.phase !== "wait" && m.phase !== "nibble")) return;
  fishingPhase("bite");
  fishingRipples("bite");
  setAction("¡Pescar!", { hot: true });
  gamesHint("¡Picó! ¡Tocá Pescar!");
  gamesTimer(() => { if (minigame === m && m.castId === id && m.phase === "bite") fishingReel(false, "late"); }, 1400);
}

function fishingReel(hooked, why = "") {
  const m = minigame;
  const id = ++m.castId;
  const item = hooked ? (Math.random() < m.type.fishChance ? "fish" : "can") : null;
  fishingPhase("reel");
  setAction("Pescar", { disabled: true });
  fishingRipples(hooked ? "splash" : "off");
  const arena = $g("minigame-arena");
  if (item) {
    arena.dataset.catch = item;
    gamesQ(".fs-catch-img")?.setAttribute("href", item === "fish" ? GAME_ICON.fish : GAME_ICON.can);
  }
  m.bob = { mode: "reel", from: { ...m.target }, t0: performance.now(), dur: 900 };
  gamesHint(item ? "¡Recogé, recogé!" : why === "early" ? "¡Muy pronto! El pez se asustó." : "Se escapó… Había que tocar más rápido.");
  gamesTimer(() => {
    if (minigame !== m || m.castId !== id) return;
    m.cast += 1;
    const stage = gamesQ(".fs-pet-stage");
    if (item === "fish") {
      m.score += 1;
      popHearts();
      playMouthAnim(stage, "feliz", 900);
      showPenaltyBanner("¡Un pescado!", "gol", GAME_ICON.fish);
      gamesHint("¡Lo sacaste!");
    } else if (item === "can") {
      m.cans += 1;
      playMouthAnim(stage, "hablar", 700);
      showPenaltyBanner("Una lata…", "lata", GAME_ICON.can);
      gamesHint("Bueno, algo es algo. Queda en el inventario.");
    }
    updateGameChips();
    gamesTimer(fishingReady, item ? 1500 : 700);
  }, 900);
}

/** Punta de la caña, en unidades del lago, calculada con la pose (sin medir el DOM). */
function fsRotateAround(p, c, deg) {
  const rad = deg * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
  const dx = p.x - c.x, dy = p.y - c.y;
  return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
}
function fishingTip(pose = minigame?.pose?.last) {
  if (!pose) return null;
  let p = fsRotateAround(FS_ROD.tip, FS_ROD.grip, pose.f);
  p = fsRotateAround(p, FS_ROD.shoulder, pose.a);
  // Cuerpo: rotate(r) translate(x %, y %) desde el origen 50 % 66 %.
  const o = FS_PET_BOX.origin;
  p = fsRotateAround({ x: p.x + pose.x * 4, y: p.y + pose.y * 4 }, o, pose.r);
  const k = FS_PET_BOX.size / 400;
  return { x: FS_PET_BOX.x + p.x * k, y: FS_PET_BOX.y + p.y * k };
}

function fishingHangPoint(t, tip = fishingTip()) {
  if (!tip) return { x: 0, y: 0 };
  return { x: tip.x + Math.sin(t / 520) * 5, y: tip.y + FISHING_SCENE.hang };
}

/** Cada cuadro: posición de la bocha, línea de agua y curva del hilo. */
function fishingDraw(t) {
  const m = minigame;
  if (!m || m.type.id !== "pesca") return false;
  const pose = fishingPose(t);
  fishingApplyPose(pose);
  m.pose.last = pose;
  const els = fishingEls();
  const tip = fishingTip(pose);
  const bobber = els?.bobber;
  if (!tip || !bobber) return;
  const b = m.bob;
  const hang = fishingHangPoint(t, tip);
  let x = hang.x, y = hang.y, sag = 0, inWater = false;
  if (b.mode === "fly") {
    const p = Math.min(1, (t - b.t0) / b.dur);
    x = fsLerp(b.from.x, m.target.x, p);
    y = fsLerp(b.from.y, m.target.y, p) - 300 * 4 * p * (1 - p);
    sag = 30 * p;
  } else if (b.mode === "water") {
    x = m.target.x;
    y = m.target.y;
    inWater = true;
    sag = m.phase === "bite" ? 6 : m.phase === "nibble" ? 36 : 70;
  } else if (b.mode === "reel") {
    const p = Math.min(1, (t - b.t0) / b.dur);
    const e = fsEaseInOut(p);
    x = fsLerp(b.from.x, hang.x, e);
    y = fsLerp(b.from.y, hang.y, e) - 150 * 4 * e * (1 - e);
    inWater = p < .12;
    sag = 4;
  }
  bobber.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  // En el agua se esconde la parte de abajo de la bocha (flota a medias).
  const bh = FISHING_SCENE.bobberW * 393 / 400;
  els.waterline?.setAttribute("height", inWater ? String(400 + bh * .64) : "800");
  const mx = (tip.x + x) / 2, my = (tip.y + y) / 2 + sag;
  const d = `M${tip.x.toFixed(1)} ${tip.y.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  els.line?.setAttribute("d", d);
  els.lineShadow?.setAttribute("d", d);
}

/** Ondas alrededor de la bocha: splash, nibble, bite u off (calma). */
function fishingRipples(kind) {
  const g = gamesQ(".fs-ripples");
  const m = minigame;
  if (!g || !m) return;
  if (m.target) {
    const bh = FISHING_SCENE.bobberW * 393 / 400;
    g.setAttribute("transform", `translate(${m.target.x.toFixed(1)} ${(m.target.y + bh * .6).toFixed(1)})`);
  }
  // Reinicia la animación aunque se repita el mismo tipo.
  g.setAttribute("class", "fs-ripples");
  void g.getBoundingClientRect();
  g.setAttribute("class", `fs-ripples is-${kind}`);
}

// -------------------------------------------------------------- Penales
// v4.6.2, rediseño: 1) se hace click donde se quiere patear (la mira sigue
// al mouse); 2) se frena la barra de potencia. Con el punto elegido y la
// potencia se calcula adónde va la pelota: en la zona verde va casi
// adonde apuntaste; floja cae más abajo, sale lenta y se desvía un poco;
// muy fuerte se levanta (puede irse por arriba) y se abre más. El arquero
// son sólo los guantes, con una IA «fácil»: reacciona tarde, se mueve
// lento, adivina el lado pocas veces y tiene poco alcance.

const PK_AI = {
  reactionMs: 230,        // tarda en reaccionar después de la patada
  speed: .5,              // unidades de cancha por ms
  readChance: .38,        // chance de leer bien el tiro
  stayChance: .22,        // chance de quedarse en el medio
  reachX: 96,             // alcance (elipse alrededor del centro de los guantes)
  reachY: 78,
};
const PK_POWER = { sweet0: .55, sweet1: .8, periodMs: 1150 };

function pkBall(x, y, scale, spin = 0) {
  const b = gamesQ(".pk-ball");
  if (b) b.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(3)})`);
  gamesQ(".pk-ball-spin")?.setAttribute("transform", `rotate(${spin.toFixed(1)})`);
}
function pkShadow(x, y, scale, opacity = .32) {
  const s = gamesQ(".pk-ball-shadow");
  if (!s) return;
  s.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${scale.toFixed(3)})`);
  s.style.opacity = String(opacity);
}
function pkKeeper(x, y, tilt = 0, spread = 1) {
  const k = gamesQ(".pk-keeper");
  if (!k) return;
  k.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
  gamesQ(".pk-keeper-tilt")?.setAttribute("transform", `rotate(${tilt.toFixed(1)})`);
  const gap = PENALTY_SCENE.gloveGap * spread;
  gamesQ(".pk-glove-l")?.setAttribute("transform", `translate(${(-gap).toFixed(1)} 0) rotate(${(-8 * spread + 8).toFixed(1)})`);
  gamesQ(".pk-glove-r")?.setAttribute("transform", `translate(${gap.toFixed(1)} 0) rotate(${(8 * spread - 8).toFixed(1)})`);
}
function pkAim(x, y, show = true) {
  const a = gamesQ(".pk-aim");
  if (!a) return;
  a.setAttribute("transform", show ? `translate(${x.toFixed(1)} ${y.toFixed(1)})` : "translate(-999 -999)");
}

/** Pasa coordenadas de pantalla a unidades de la cancha. */
function pkPoint(ev) {
  const svg = gamesQ(".pk-svg");
  const m = svg?.getScreenCTM();
  if (!m) return null;
  const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse());
  return pkClampAim(p.x, p.y);
}
function pkClampAim(x, y) {
  return { x: clamp(x, 170, 1084), y: clamp(y, 80, 470) };
}

function startPenalties() {
  const m = minigame;
  m.shot = 0;
  m.results = [];
  m.aim = { x: PENALTY_SCENE.spot.x, y: 290 };
  const scene = gamesQ(".penalty-scene");
  scene.tabIndex = 0;
  scene.setAttribute("aria-label", "Cancha de penales: mové la mira y hacé click para patear");
  scene.addEventListener("pointermove", (ev) => {
    if (minigame !== m || m.phase !== "aim") return;
    const p = pkPoint(ev);
    if (p) { m.aim = p; pkAim(p.x, p.y); }
  });
  scene.addEventListener("pointerdown", (ev) => {
    if (minigame !== m || ev.button > 0) return;
    ev.preventDefault();
    if (m.phase === "aim") {
      const p = pkPoint(ev);
      if (p) m.aim = p;
      penaltyLockAim();
    } else if (m.phase === "power") penaltyShoot();
  });
  // Teclado: flechas mueven la mira y Espacio confirma (Enter queda
  // reservado al chat, ver game-interactions.js).
  scene.addEventListener("keydown", (ev) => {
    if (minigame !== m) return;
    const step = ev.shiftKey ? 50 : 22;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (m.phase === "aim" && moves[ev.key]) {
      ev.preventDefault();
      m.aim = pkClampAim(m.aim.x + moves[ev.key][0], m.aim.y + moves[ev.key][1]);
      pkAim(m.aim.x, m.aim.y);
    } else if (ev.key === " " || ev.code === "Space") {
      ev.preventDefault();
      if (m.phase === "aim") penaltyLockAim();
      else if (m.phase === "power") penaltyShoot();
    }
  });
  pkFit();
  updateGameChips();
  penaltyAim();
}

/** Escenario ancho: la cancha llena todo (recorta cielo). Escenario alto
 *  (celular): entra entera, centrada, sin cortar los palos. */
function pkFit() {
  const svg = gamesQ(".pk-svg"), arena = $g("minigame-arena");
  if (!svg || !arena) return;
  const wide = arena.clientWidth / Math.max(1, arena.clientHeight) >= PENALTY_SCENE.w / PENALTY_SCENE.h;
  svg.setAttribute("preserveAspectRatio", wide ? "xMidYMax slice" : "xMidYMid meet");
}
window.addEventListener("resize", () => { if (minigame?.type.id === "penales") pkFit(); });

function penaltyAim() {
  const m = minigame;
  if (!m) return;
  if (m.shot >= m.type.shots) { finishMinigame(false); return; }
  const S = PENALTY_SCENE;
  m.phase = "aim";
  $g("minigame-arena").dataset.phase = "aim";
  delete $g("minigame-arena").dataset.result;
  updateGameChips();
  hidePenaltyBanner();
  gamesQ(".pk-ball")?.style.removeProperty("opacity");
  pkBall(S.spot.x, S.spot.y, 1);
  pkShadow(S.spot.x, S.spot.y + S.ballSize * .46, 1);
  pkAim(m.aim.x, m.aim.y);
  const power = gamesQ(".pk-power");
  if (power) power.hidden = true;
  gamesHint(m.shot ? "Elegí otro rincón: hacé click donde querés patear." : "Hacé click en el arco, donde querés patear.");
  // Arquero en espera: se balancea de lado a lado, atento.
  const t0 = performance.now();
  gamesFrame((t) => {
    if (m.phase !== "aim" && m.phase !== "power") return false;
    const k = (t - t0) / 1000;
    pkKeeper(S.keeperHome.x + Math.sin(k * 2.1) * 26, S.keeperHome.y + Math.sin(k * 4.2) * 5, Math.sin(k * 2.1) * 3, 1);
    if (m.phase === "power") {
      const p = ((t - m.powerT0) % (PK_POWER.periodMs * 2)) / PK_POWER.periodMs;
      m.power = p <= 1 ? p : 2 - p;
      const needle = gamesQ(".pk-power-needle");
      if (needle) needle.style.left = `${(m.power * 100).toFixed(1)}%`;
    }
  });
}

function penaltyLockAim() {
  const m = minigame;
  m.phase = "power";
  m.powerT0 = performance.now();
  m.power = 0;
  $g("minigame-arena").dataset.phase = "power";
  pkAim(m.aim.x, m.aim.y);
  const power = gamesQ(".pk-power");
  if (power) power.hidden = false;
  gamesHint("¡Ahora la potencia! Frená la barra en lo verde.");
}

/** Adónde va la pelota según el punto elegido y la potencia. */
function penaltyTarget(aim, power) {
  const { sweet0, sweet1 } = PK_POWER;
  let dy = 0, spread = 10;
  if (power < sweet0) {
    const f = (sweet0 - power) / sweet0;          // 0..1: cuánto le faltó
    dy = f * 150;
    spread = 14 + f * 40;
  } else if (power > sweet1) {
    const f = (power - sweet1) / (1 - sweet1);    // 0..1: cuánto se pasó
    dy = -f * 150;
    spread = 18 + f * 90;
  }
  const r = Math.random() * spread, a = Math.random() * Math.PI * 2;
  let x = aim.x + Math.cos(a) * r;
  let y = aim.y + dy + Math.sin(a) * r * .7;
  const low = y > PENALTY_SCENE.goal.bottom - 6;
  if (low) y = PENALTY_SCENE.goal.bottom - 6;     // va a ras del piso
  return { x, y, low };
}

/** IA fácil: posición de los guantes t ms después de la patada. */
function keeperPlan(target) {
  const S = PENALTY_SCENE, G = S.goal;
  const r = Math.random();
  let dive;
  if (r < PK_AI.stayChance) dive = { x: S.keeperHome.x + (Math.random() - .5) * 60, y: S.keeperHome.y + (Math.random() - .5) * 40 };
  else if (r < PK_AI.stayChance + PK_AI.readChance) dive = { x: target.x + (Math.random() - .5) * 90, y: target.y + (Math.random() - .5) * 70 };
  else dive = { x: G.left + 40 + Math.random() * (G.right - G.left - 80), y: G.top + 40 + Math.random() * (G.bottom - G.top - 70) };
  dive.x = clamp(dive.x, G.left + 30, G.right - 30);
  dive.y = clamp(dive.y, G.top + 36, G.bottom - 30);
  const from = { x: S.keeperHome.x, y: S.keeperHome.y };
  const dist = Math.hypot(dive.x - from.x, dive.y - from.y);
  return {
    from, dive,
    at(t) {
      const tt = Math.max(0, t - PK_AI.reactionMs);
      const p = dist ? Math.min(1, (tt * PK_AI.speed) / dist) : 1;
      const e = 1 - (1 - p) ** 2;
      return { x: from.x + (dive.x - from.x) * e, y: from.y + (dive.y - from.y) * e, p: e };
    },
  };
}

function penaltyShoot() {
  const m = minigame;
  const S = PENALTY_SCENE, G = S.goal;
  m.phase = "shot";
  gamesStopFrame();
  $g("minigame-arena").dataset.phase = "shot";
  const power = gamesQ(".pk-power");
  if (power) power.hidden = true;
  pkAim(0, 0, false);
  const p = m.power ?? .6;
  const target = penaltyTarget(m.aim, p);
  const dur = 980 - p * 520;                     // floja: lenta; fuerte: rápida
  const plan = keeperPlan(target);
  const keeperAtArrival = plan.at(dur);
  const ballR = S.ballSize * S.ballFar / 2;

  const hitsPost = S.posts.some((r) => target.x > r.x0 - ballR && target.x < r.x1 + ballR && target.y > r.y0 - ballR && target.y < r.y1 + ballR)
    && !(target.x > G.left + ballR && target.x < G.right - ballR && target.y > G.top + ballR);
  const out = !hitsPost && (target.x < G.left || target.x > G.right || target.y < G.top);
  const kdx = (target.x - keeperAtArrival.x) / PK_AI.reachX, kdy = (target.y - keeperAtArrival.y) / PK_AI.reachY;
  const saved = !hitsPost && !out && kdx * kdx + kdy * kdy <= 1;
  let result, text;
  if (hitsPost) { result = "palo"; text = "¡Palo!"; }
  else if (out) { result = "afuera"; text = "¡Afuera!"; }
  else if (saved) { result = "atajada"; text = "¡Atajó el arquero!"; }
  else { result = "gol"; text = "¡GOOOL!"; }
  gamesHint(p >= PK_POWER.sweet0 && p <= PK_POWER.sweet1 ? "¡Buena potencia!" : p < PK_POWER.sweet0 ? "Salió flojita…" : "¡Le pegaste muy fuerte!");

  const t0 = performance.now();
  const lift = target.low ? 0 : 40 + p * 50;      // arco de la pelota en el aire
  const dir = Math.sign(plan.dive.x - plan.from.x) || 1;
  gamesFrame((t) => {
    const dt = t - t0;
    const k = Math.min(1, dt / dur);
    const e = 1 - (1 - k) ** 1.6;
    const x = S.spot.x + (target.x - S.spot.x) * e;
    const y = S.spot.y + (target.y - S.spot.y) * e - lift * 4 * e * (1 - e);
    const sc = 1 + (S.ballFar - 1) * e;
    pkBall(x, y, sc, dt * .9 * (target.x < S.spot.x ? -1 : 1));
    const groundY = S.spot.y + S.ballSize * .46 + (G.bottom + 6 - S.spot.y - S.ballSize * .46) * e;
    pkShadow(x, groundY, sc, .32 - .12 * e);
    const kp = plan.at(dt);
    pkKeeper(kp.x, kp.y, dir * 28 * kp.p, 1 - .35 * kp.p);
    if (k >= 1) return false;
  });

  gamesTimer(() => {
    if (minigame !== m) return;
    m.results.push(result);
    if (result === "gol") { m.score += 1; popHearts(); }
    const arena = $g("minigame-arena");
    arena.dataset.result = result;
    showPenaltyBanner(text, result);
    gamesHint(text);
    updateGameChips();
    penaltyAfterShot(result, target, keeperAtArrival);
    m.shot += 1;
    gamesTimer(() => { if (minigame === m) penaltyAim(); }, 1600);
  }, dur + 30);
}

/** Lo que pasa con la pelota después de llegar al arco. */
function penaltyAfterShot(result, target, keeper) {
  const S = PENALTY_SCENE;
  const from = { ...target };
  let to, endScale = S.ballFar, drop = false;
  if (result === "gol") { to = { x: target.x + (target.x - S.spot.x) * .06, y: Math.min(target.y + 12, S.goal.bottom - 4) }; endScale = S.ballFar * .92; }
  else if (result === "atajada") { const side = target.x < keeper.x ? -1 : 1; to = { x: target.x + side * 140, y: S.goal.bottom + 70 }; endScale = .58; drop = true; }
  else if (result === "palo") { const side = target.x < S.spot.x ? -1 : 1; to = { x: target.x + side * 170, y: target.y + 150 }; endScale = .55; drop = true; }
  else { to = { x: target.x + (target.x - S.spot.x) * .25, y: target.y - 60 }; endScale = S.ballFar * .8; }
  const t0 = performance.now(), dur = 520;
  gamesFrame((t) => {
    const k = Math.min(1, (t - t0) / dur);
    const e = drop ? k * k : 1 - (1 - k) ** 2;
    const x = from.x + (to.x - from.x) * e;
    const y = from.y + (to.y - from.y) * e - (drop ? 60 * 4 * k * (1 - k) : 0);
    pkBall(x, y, S.ballFar + (endScale - S.ballFar) * k, (t - t0) * .7);
    if (result === "afuera") gamesQ(".pk-ball")?.style.setProperty("opacity", String(1 - k));
    if (k >= 1) { gamesQ(".pk-ball")?.style.removeProperty("opacity"); return false; }
  });
}

function showPenaltyBanner(text, result, icon = "") {
  const arena = $g("minigame-arena");
  let b = arena.querySelector(".games-banner");
  if (!b) { b = document.createElement("div"); b.className = "games-banner"; arena.appendChild(b); }
  b.textContent = text;
  if (icon) b.insertAdjacentHTML("afterbegin", `<img src="${icon}" alt="" />`);
  b.dataset.result = result;
  b.classList.remove("is-on"); void b.offsetWidth; b.classList.add("is-on");
}
function hidePenaltyBanner() { $g("minigame-arena")?.querySelector(".games-banner")?.classList.remove("is-on"); }


// ------------------------------------------------------------ Resultado

function finishMinigame(cancelled = false, { quiet = false } = {}) {
  if (!minigame) return;
  const finished = minigame;
  gamesClearAll();
  minigame = null;

  if (cancelled) {
    emitRealtimeAction("play_end", { game: finished.type.id, result: "cancel" });
    if (!quiet) { closeGamePanel(); notifySystem("Partida cancelada.", 2200); }
    return;
  }

  const g = finished.type;
  const success = finished.score >= g.goal;
  emitRealtimeAction("play_end", { game: g.id, result: success ? "win" : "finish" });
  const fishCaught = g.id === "pesca" ? finished.score : 0;
  const cansCaught = g.id === "pesca" ? finished.cans || 0 : 0;
  state.inventory.pescado += fishCaught;
  state.inventory.lata = (state.inventory.lata || 0) + cansCaught;
  const happiness = success ? PET_CONFIG.play.felicidad : Math.max(2, Math.round(PET_CONFIG.play.felicidad * .45));
  const energyCost = success ? PET_CONFIG.play.energiaCosto : Math.max(1, Math.round(PET_CONFIG.play.energiaCosto * .6));
  const xp = success ? PET_CONFIG.play.vinculo : Math.max(1, Math.round(PET_CONFIG.play.vinculo * .5));
  const coins = success ? Math.max(5, finished.score * 2) : Math.max(1, finished.score);

  gainFelicidad(happiness);
  state.stats.energia = clamp(state.stats.energia - energyCost, 0, 100);
  addBond(xp);
  state.economy = state.economy || { coins: 0 };
  state.economy.coins = Math.max(0, (state.economy.coins || 0) + coins);
  trySave(state);
  refreshUI();
  updateCooldownButtons();

  const title = g.id === "pesca"
    ? (success ? "¡Buena pesca!" : fishCaught ? "¡Algo sacamos!" : cansCaught ? "Sólo salieron latas" : "Hoy no picaron")
    : (success ? "¡Golazo de partido!" : "¡Buen intento!");
  const scoreLine = g.id === "pesca"
    ? `${fishCaught} ${fishCaught === 1 ? "pescado" : "pescados"}${cansCaught ? ` y ${cansCaught} ${cansCaught === 1 ? "lata" : "latas"}` : ""}`
    : `${finished.score} de ${g.shots} goles`;
  const rows = [
    `<li><img src="${GAME_ICON.coin}" alt="" /><span>Monedas</span><b>+${coins}</b></li>`,
    fishCaught ? `<li><img src="${GAME_ICON.fish}" alt="" /><span>Pescados al inventario</span><b>+${fishCaught}</b></li>` : "",
    cansCaught ? `<li><img src="${GAME_ICON.can}" alt="" /><span>Latas al inventario</span><b>+${cansCaught}</b></li>` : "",
    `<li>${SVG_HEART}<span>Felicidad</span><b>+${happiness}</b></li>`,
    `<li>${SVG_STAR}<span>Experiencia</span><b>+${xp}</b></li>`,
    `<li><img src="${GAME_ICON.energy}" alt="" /><span>Energía</span><b class="is-cost">−${energyCost}</b></li>`,
  ].join("");
  const again = gameBlockReason(g.id);
  const left = gamesUnlimited() ? "Modo prueba: sin límite de partidas." : g.id === "pesca" ? `Te quedan ${fishingPlaysRemaining()} de ${GAME_LIMITS.pescaPorDia} partidas de pesca hoy.` : "";
  const res = $g("minigame-result");
  res.innerHTML = `
    <div class="games-result-card" role="status">
      <h3>${title}</h3>
      <p class="games-result-score">${scoreLine}</p>
      <ul class="games-rewards">${rows}</ul>
      <p class="games-result-note">${again || left}</p>
      <div class="games-result-actions">
        <button type="button" class="games-btn" data-again ${again ? "disabled" : ""}>Otra vez</button>
        <button type="button" class="games-btn games-btn-soft" data-exit>Volver a casa</button>
      </div>
    </div>`;
  res.hidden = false;
  gamesHint("");
  const againBtn = res.querySelector("[data-again]");
  againBtn.addEventListener("click", () => launchGame(g.id));
  res.querySelector("[data-exit]").addEventListener("click", () => returnHome());
  (again ? res.querySelector("[data-exit]") : againBtn).focus();
  // Si hay que esperar para Penales, el botón se habilita solo.
  if (again && g.id === "penales" && isOnCooldown("jugar")) {
    const tick = setInterval(() => {
      if (res.hidden || !res.contains(againBtn)) { clearInterval(tick); return; }
      const why = gameBlockReason(g.id);
      res.querySelector(".games-result-note").textContent = why;
      if (!why) { againBtn.disabled = false; clearInterval(tick); }
    }, 1000);
  }
}

/** Cierra la pantalla del juego. Si estábamos «de viaje», la mascota
 *  vuelve a la casa (sin pantalla de carga: para eso está returnHome). */
function closeGamePanel() {
  const panel = $g("minigame-panel");
  if (!panel) return;
  panel.hidden = true;
  $g("minigame-result").hidden = true;
  const arena = $g("minigame-arena");
  if (arena) arena.innerHTML = "";
  gamesHint("");
  if (gameTrip) {
    gameTrip = null;
    setTripVisuals(false);
  }
}

/** Escape: cierra el selector o sale del juego y vuelve a casa. */
function gamesHandleEscape() {
  if (gameTrip || minigame || !$g("minigame-panel")?.hidden) { returnHome(); return true; }
  if (!$g("game-selector")?.hidden) { closeGameSelector(); return true; }
  return false;
}

// Compatibilidad con llamadas anteriores de app.js.
function setupMinigames() {
  $g("minigame-close")?.addEventListener("click", () => returnHome());
}
function setupGameSelector() {
  renderGameCards();
  $g("game-selector-close")?.addEventListener("click", () => closeGameSelector());
}
