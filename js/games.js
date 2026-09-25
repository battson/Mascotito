/* ==========================================================================
   Beta v4.6 — Jugar (Pesca rehecha en v4.6.1)
   Selector de juegos, Pesca, Penales y pantalla de resultado.
   Todo lo de Jugar vive acá (antes estaba dentro de app.js). Usa funciones
   globales de app.js (state, el, gainFelicidad, addBond, trySave, …) sólo
   dentro de funciones, así que este archivo puede cargarse antes.
   ========================================================================== */

// Partida en curso. La leen app.js (no cambiar de lugar durante un juego)
// y game-interactions.js (Enter no abre el chat mientras se juega).
let minigame = null;

const GAME_LIMITS = { pescaPorDia: 3 };

const GAMES = {
  pesca: {
    id: "pesca",
    title: "Pesca",
    blurb: "Lanzá la bocha, esperá a que pique y tocá Pescar justo a tiempo. A veces sale una lata…",
    casts: 3,
    goal: 2,
    fishChance: .8,
  },
  penales: {
    id: "penales",
    title: "Penales",
    blurb: "Cinco tiros. Frená la mira a lo ancho y después a lo alto, y patealo lejos del arquero.",
    shots: 5,
    goal: 3,
  },
};

const GAME_ICON = {
  coin: "assets/shop/moneda.svg",
  fish: "assets/ui/inventory/cofre/pescado.svg",
  can: "assets/games/fishing/can.svg",
  energy: "assets/ui/ficha/energia.svg",
  ball: "assets/ui/actions/04-pelota.svg",
};

// Beta v4.6.1: arte de Pesca (vectorizado con scripts/vectorize-fishing-assets.py).
const FISHING_ART = {
  lake: "assets/games/fishing/lake.svg",
  rod: "assets/games/fishing/rod.svg",
  icon: "assets/games/fishing/rod-icon.svg",
  bobber: "assets/games/fishing/bobber.svg",
};
const SVG_HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 3 4.5 6.6 4.5c2.2 0 3.6 1.3 5.4 3.3 1.8-2 3.2-3.3 5.4-3.3 3.6 0 5.8 3.7 4.2 7.3C19.5 16.4 12 21 12 21z" fill="#f06a8a" stroke="#5a3a22" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const SVG_STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="#ffd34d" stroke="#5a3a22" stroke-width="1.8" stroke-linejoin="round"/></svg>';

const $g = (id) => document.getElementById(id);

// ---------------------------------------------------------------- Escenas

let gamesSceneId = 0;
// Tarjeta del selector: sólo la caña sobre fondo liso.
function fishingCardArt() {
  return `<div class="game-card-icon"><img src="${FISHING_ART.icon}" alt="" draggable="false" /></div>`;
}

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
 *  3. otra vez el lago, recortado al casco del barco: tapa la mitad de
 *     abajo de la mascota y la deja «adentro» del barco;
 *  4. hilo, ondas, bocha y lo que se pesca.
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
  <img class="fs-hull" src="${FISHING_ART.lake}" alt="" draggable="false" />
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

function penaltySceneSvg() {
  const u = ++gamesSceneId;
  let net = "";
  for (let x = 210; x < 600; x += 26) net += `<line x1="${x}" y1="80" x2="${x}" y2="280"/>`;
  for (let y = 100; y < 280; y += 24) net += `<line x1="200" y1="${y}" x2="600" y2="${y}"/>`;
  let stripes = "";
  for (let i = 0; i < 8; i += 2) stripes += `<rect x="${i * 100}" y="232" width="100" height="168" fill="#8fcf5c"/>`;
  return `<svg class="games-scene" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="gp-cielo-${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe8f7"/><stop offset="1" stop-color="#e8f7fb"/></linearGradient>
  </defs>
  <rect width="800" height="400" fill="url(#gp-cielo-${u})"/>
  <g fill="#ffffff" stroke="#5a3a22" stroke-width="3" opacity=".95">
    <path d="M86 70a22 22 0 0 1 40-12 18 18 0 0 1 30 14h-70z"/>
    <path d="M640 52a20 20 0 0 1 36-10 16 16 0 0 1 28 12h-64z"/>
  </g>
  <path d="M0 150C60 132 110 146 170 136S290 120 360 134 520 124 600 136 740 128 800 140V232H0Z" fill="#6fb04a" stroke="#5a3a22" stroke-width="4"/>
  <rect y="232" width="800" height="168" fill="#9ed96a"/>
  ${stripes}
  <line x1="0" y1="232" x2="800" y2="232" stroke="#5a3a22" stroke-width="4"/>
  <path d="M120 400L230 300H570L680 400" fill="none" stroke="#ffffff" stroke-width="5" opacity=".9"/>
  <ellipse cx="400" cy="372" rx="10" ry="4" fill="#ffffff"/>
  <g stroke="#ffffff" stroke-width="2" opacity=".75">${net}</g>
  <rect x="200" y="80" width="400" height="200" fill="#ffffff" opacity=".12"/>
  <path d="M190 284V70H610V284" fill="none" stroke="#5a3a22" stroke-width="18" stroke-linejoin="round"/>
  <path d="M190 284V70H610V284" fill="none" stroke="#ffffff" stroke-width="10" stroke-linejoin="round"/>
  <g class="gp-arquero" style="transform: translate(400px, 282px)">
    <ellipse cx="0" cy="2" rx="46" ry="8" fill="#3e7a2c" opacity=".35"/>
    <rect x="-24" y="-44" width="16" height="44" rx="7" fill="#2f4f7a" stroke="#5a3a22" stroke-width="3.5"/>
    <rect x="8" y="-44" width="16" height="44" rx="7" fill="#2f4f7a" stroke="#5a3a22" stroke-width="3.5"/>
    <path d="M-40 -60C-70 -78 -84 -104 -86 -120" fill="none" stroke="#5a3a22" stroke-width="18" stroke-linecap="round"/>
    <path d="M-40 -60C-70 -78 -84 -104 -86 -120" fill="none" stroke="#ffb13b" stroke-width="11" stroke-linecap="round"/>
    <path d="M40 -60C70 -78 84 -104 86 -120" fill="none" stroke="#5a3a22" stroke-width="18" stroke-linecap="round"/>
    <path d="M40 -60C70 -78 84 -104 86 -120" fill="none" stroke="#ffb13b" stroke-width="11" stroke-linecap="round"/>
    <rect x="-42" y="-112" width="84" height="76" rx="30" fill="#ffb13b" stroke="#5a3a22" stroke-width="4"/>
    <text x="0" y="-62" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="30" fill="#ffffff" stroke="#5a3a22" stroke-width="1.5">1</text>
    <circle cx="-88" cy="-126" r="15" fill="#ffffff" stroke="#5a3a22" stroke-width="4"/>
    <circle cx="88" cy="-126" r="15" fill="#ffffff" stroke="#5a3a22" stroke-width="4"/>
    <circle cx="0" cy="-138" r="32" fill="#f3d9b8" stroke="#5a3a22" stroke-width="4"/>
    <path d="M-30 -150C-24 -178 24 -178 30 -150C14 -160 -14 -160 -30 -150Z" fill="#6b4526" stroke="#5a3a22" stroke-width="3"/>
    <circle cx="-11" cy="-138" r="4.5" fill="#3b2412"/><circle cx="11" cy="-138" r="4.5" fill="#3b2412"/>
    <path d="M-9 -122Q0 -116 9 -122" fill="none" stroke="#3b2412" stroke-width="3" stroke-linecap="round"/>
  </g>
  <g class="gp-mira" opacity="0">
    <line class="gp-mira-x" x1="0" y1="62" x2="0" y2="292" stroke="#f2663f" stroke-width="4" stroke-dasharray="10 8"/>
    <line class="gp-mira-y" x1="160" y1="0" x2="640" y2="0" stroke="#f2663f" stroke-width="4" stroke-dasharray="10 8" opacity="0"/>
    <circle class="gp-mira-punto" cx="0" cy="0" r="16" fill="none" stroke="#f2663f" stroke-width="5" opacity="0"/>
  </g>
  <image class="gp-pelota" href="${GAME_ICON.ball}" x="-26" y="-26" width="52" height="52" style="transform: translate(400px, 350px)"/>
</svg>`;
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
function gamesHint(text) { const h = $g("minigame-instructions"); if (h) h.textContent = text; }
function gamesQ(sel) { return $g("minigame-arena")?.querySelector(sel); }

function fishingPlaysRemaining() {
  ensureDailyProgress();
  return Math.max(0, GAME_LIMITS.pescaPorDia - (state.daily.fishingPlays || 0));
}

/** ¿Se puede empezar este juego ahora? Devuelve el motivo si no. */
function gameBlockReason(id) {
  if (state.sleep.dormida) return "Despertá a tu mascota para jugar.";
  if (state.stats.energia < PET_CONFIG.play.energiaMinimaParaJugar) return "Está muy cansada: necesita descansar antes de jugar.";
  if (id === "pesca" && !fishingPlaysRemaining()) return "Ya usaste las 3 partidas de pesca de hoy. Volvé mañana.";
  if (id === "penales" && isOnCooldown("jugar")) return `Podés patear de nuevo en ${formatCooldownPhrase(state.cooldowns.jugar - Date.now())}.`;
  return "";
}

function gameStatusText(id) {
  if (id === "pesca") {
    const left = fishingPlaysRemaining();
    return left ? `Hoy: ${left} de ${GAME_LIMITS.pescaPorDia} partidas` : "Sin partidas hasta mañana";
  }
  if (isOnCooldown("jugar")) return `Otra vez en ${formatCooldownPhrase(state.cooldowns.jugar - Date.now())}`;
  return "Disponible";
}

// --------------------------------------------------------------- Selector

let gameSelectorTick = null;

function renderGameCards() {
  const box = $g("game-choices");
  if (!box) return;
  box.innerHTML = Object.values(GAMES).map((g) => `
    <article class="game-card" data-game="${g.id}">
      <div class="game-card-art" data-art="${g.id}">${g.id === "pesca" ? fishingCardArt() : penaltySceneSvg()}</div>
      <div class="game-card-body">
        <h3>${g.title}</h3>
        <p>${g.blurb}</p>
        <div class="game-card-foot">
          <span class="game-card-status" data-status="${g.id}"></span>
          <button type="button" class="games-btn" data-play="${g.id}">Jugar</button>
        </div>
      </div>
    </article>`).join("");
  box.querySelectorAll("[data-play]").forEach((btn) => btn.addEventListener("click", () => launchGame(btn.dataset.play)));
}

function updateGameCards() {
  const panel = $g("game-selector");
  if (!panel || panel.hidden || !state) return;
  panel.querySelectorAll("[data-status]").forEach((chip) => {
    const id = chip.dataset.status;
    chip.textContent = gameStatusText(id);
    const blocked = !!gameBlockReason(id);
    chip.classList.toggle("is-blocked", blocked);
    const btn = panel.querySelector(`[data-play="${id}"]`);
    if (btn) { btn.disabled = blocked; btn.title = gameBlockReason(id); }
  });
  const note = $g("game-selector-note");
  const general = state.sleep.dormida || state.stats.energia < PET_CONFIG.play.energiaMinimaParaJugar ? gameBlockReason("pesca") : "";
  if (note && !note.dataset.sticky) note.textContent = general;
}

function openGameSelector() {
  if (minigame || navLock) return;
  closeAllMenus();
  closeGamePanel();
  const panel = $g("game-selector");
  panel.hidden = false;
  delete $g("game-selector-note").dataset.sticky;
  updateGameCards();
  clearInterval(gameSelectorTick);
  gameSelectorTick = setInterval(updateGameCards, 1000);
  panel.querySelector(".games-btn:not(:disabled)")?.focus();
}

function closeGameSelector(returnFocus = true) {
  const panel = $g("game-selector");
  if (!panel || panel.hidden) return;
  panel.hidden = true;
  clearInterval(gameSelectorTick);
  if (returnFocus) document.getElementById("btn-jugar")?.focus();
}

function doJugar() { openGameSelector(); }

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
  if (id === "pesca") {
    // Cada inicio cuenta (aunque se cancele); se guarda enseguida.
    state.daily.fishingPlays = (state.daily.fishingPlays || 0) + 1;
    trySave(state);
  } else {
    startCooldown("jugar");
  }
  registerInteraction();
  updateCooldownButtons();
  closeGameSelector(false);
  closeAllMenus();
  startIdle(15000, 16000);

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
  arena.innerHTML = (id === "pesca" ? fishingSceneHtml() : penaltySceneSvg()) + `
    <div class="games-controls">
      <button type="button" class="games-btn games-action"></button>
    </div>`;
  panel.hidden = false;
  const action = arena.querySelector(".games-action");
  action.addEventListener("click", (ev) => { ev.stopPropagation(); gameAction(); });
  arena.addEventListener("pointerdown", (ev) => {
    // En Penales también se puede patear tocando la cancha.
    if (minigame?.type.id === "penales" && !ev.target.closest(".games-action")) { ev.preventDefault(); gameAction(); }
  });

  if (id === "pesca") startFishing(); else startPenalties();
  action.focus();
}

function gameAction() {
  if (!minigame) return;
  if (minigame.type.id === "pesca") fishingAction(); else penaltyAction();
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
  minigame.phase = phase;
  $g("minigame-arena").dataset.phase = phase;
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

/** Punta de la caña, en unidades del lago (sigue a las animaciones CSS). */
function fishingTip() {
  const tip = gamesQ(".fs-rod-tip");
  const fx = gamesQ(".fs-fx");
  if (!tip || !fx) return null;
  const a = tip.getBoundingClientRect();
  const r = fx.getBoundingClientRect();
  if (!r.width) return null;
  return {
    x: (a.left + a.width / 2 - r.left) * FISHING_SCENE.w / r.width,
    y: (a.top + a.height / 2 - r.top) * FISHING_SCENE.h / r.height,
  };
}

function fishingHangPoint(t, tip = fishingTip()) {
  if (!tip) return { x: 0, y: 0 };
  return { x: tip.x + Math.sin(t / 520) * 5, y: tip.y + FISHING_SCENE.hang };
}

/** Cada cuadro: posición de la bocha, línea de agua y curva del hilo. */
function fishingDraw(t) {
  const m = minigame;
  if (!m || m.type.id !== "pesca") return false;
  const tip = fishingTip();
  const bobber = gamesQ(".fs-bobber");
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
  gamesQ(".fs-waterline")?.setAttribute("height", inWater ? String(400 + bh * .64) : "800");
  const mx = (tip.x + x) / 2, my = (tip.y + y) / 2 + sag;
  const d = `M${tip.x.toFixed(1)} ${tip.y.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  gamesQ(".fs-line")?.setAttribute("d", d);
  gamesQ(".fs-line-shadow")?.setAttribute("d", d);
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

const GOAL = { left: 190, right: 610, top: 70, bottom: 284 };

function startPenalties() {
  minigame.shot = 0;
  minigame.results = [];
  updateGameChips();
  penaltyAim();
}

function setKeeper(tx, ty, rot, ms = 0) {
  const k = gamesQ(".gp-arquero");
  if (!k) return;
  k.style.transition = ms ? `transform ${ms}ms cubic-bezier(.2,.8,.3,1)` : "none";
  k.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`;
}
function setBall(x, y, scale, ms = 0) {
  const b = gamesQ(".gp-pelota");
  if (!b) return;
  b.style.transition = ms ? `transform ${ms}ms cubic-bezier(.25,.7,.35,1)` : "none";
  b.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
}

function penaltyAim() {
  const m = minigame;
  if (!m) return;
  if (m.shot >= m.type.shots) { finishMinigame(false); return; }
  updateGameChips();
  setKeeper(400, 282, 0);
  setBall(400, 350, 1);
  const mira = gamesQ(".gp-mira");
  const lx = gamesQ(".gp-mira-x"), ly = gamesQ(".gp-mira-y"), dot = gamesQ(".gp-mira-punto");
  mira.setAttribute("opacity", "1");
  gamesQ(".games-action")?.classList.remove("is-hidden");
  lx.setAttribute("opacity", "1"); ly.setAttribute("opacity", "0"); dot.setAttribute("opacity", "0");
  m.phase = "aimX";
  setAction("¡Frenar!", { hot: true });
  gamesHint("Frená la mira a lo ancho.");
  const period = Math.max(800, 1250 - m.shot * 90);
  const t0 = performance.now();
  gamesFrame((t) => {
    const p = ((t - t0) % (period * 2)) / period;
    const k = p <= 1 ? p : 2 - p;
    if (m.phase === "aimX") {
      m.aimX = 150 + k * 500;
      lx.setAttribute("x1", m.aimX); lx.setAttribute("x2", m.aimX);
    } else if (m.phase === "aimY") {
      m.aimY = 44 + k * 244;
      ly.setAttribute("y1", m.aimY); ly.setAttribute("y2", m.aimY);
      dot.setAttribute("cx", m.aimX); dot.setAttribute("cy", m.aimY);
    } else return false;
  });
}

function penaltyAction() {
  const m = minigame;
  if (m.phase === "aimX") {
    m.phase = "aimY";
    gamesQ(".gp-mira-y").setAttribute("opacity", "1");
    gamesQ(".gp-mira-punto").setAttribute("opacity", "1");
    setAction("¡Patear!", { hot: true });
    gamesHint("Ahora frená la mira a lo alto… ¡y pateá!");
    return;
  }
  if (m.phase === "aimY") penaltyShoot();
}

function penaltyShoot() {
  const m = minigame;
  m.phase = "shot";
  gamesStopFrame();
  const x = m.aimX, y = m.aimY;
  gamesQ(".gp-mira-x").setAttribute("opacity", "0");
  gamesQ(".gp-mira-y").setAttribute("opacity", "0");
  setAction("¡Patear!", { disabled: true });
  gamesQ(".games-action")?.classList.add("is-hidden");

  // El arquero elige un lado (más seguido las esquinas) y un alto.
  const r = Math.random();
  const col = r < .38 ? 0 : r < .62 ? 1 : 2;
  const row = Math.random() < .5 ? 0 : 1;
  const reach = [
    [GOAL.left - 6, 336], [314, 486], [464, GOAL.right + 6],
  ][col];
  const reachY = row === 0 ? [GOAL.top - 6, 196] : [160, GOAL.bottom + 6];
  const dive = [
    { tx: 282, ty: row ? 276 : 250, rot: row ? -60 : -38 },
    { tx: 400, ty: row ? 284 : 240, rot: 0 },
    { tx: 518, ty: row ? 276 : 250, rot: row ? 60 : 38 },
  ][col];

  const post = (Math.abs(x - GOAL.left) < 10 || Math.abs(x - GOAL.right) < 10) && y > GOAL.top - 10 && y < GOAL.bottom
    || (Math.abs(y - GOAL.top) < 10 && x > GOAL.left - 10 && x < GOAL.right + 10);
  const out = !post && (x < GOAL.left || x > GOAL.right || y < GOAL.top);
  const saved = !post && !out && x >= reach[0] && x <= reach[1] && y >= reachY[0] && y <= reachY[1];

  setBall(x, y, .62, 520);
  gamesTimer(() => setKeeper(dive.tx, dive.ty, dive.rot, 360), 90);

  let result, text;
  if (post) { result = "palo"; text = "¡Palo!"; }
  else if (out) { result = "afuera"; text = "¡Afuera!"; }
  else if (saved) { result = "atajada"; text = "¡Atajó el arquero!"; }
  else { result = "gol"; text = "¡GOOOL!"; }

  gamesTimer(() => {
    if (!minigame) return;
    m.results.push(result);
    if (result === "gol") { m.score += 1; popHearts(); }
    if (result === "atajada") setBall(dive.tx + (col === 1 ? 0 : col === 0 ? -30 : 30), 330, .8, 380);
    if (result === "palo" || result === "afuera") setBall(x < 400 ? x - 60 : x + 60, Math.max(20, y - 40), .5, 380);
    const arena = $g("minigame-arena");
    gamesQ(".gp-mira")?.setAttribute("opacity", "0");
    arena.dataset.result = result;
    gamesHint(text);
    showPenaltyBanner(text, result);
    updateGameChips();
    m.shot += 1;
    gamesTimer(() => {
      if (!minigame) return;
      delete arena.dataset.result;
      hidePenaltyBanner();
      penaltyAim();
    }, 1400);
  }, 560);
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

function finishMinigame(cancelled = false) {
  if (!minigame) return;
  const finished = minigame;
  gamesClearAll();
  minigame = null;

  if (cancelled) {
    closeGamePanel();
    emitRealtimeAction("play_end", { game: finished.type.id, result: "cancel" });
    notifySystem("Partida cancelada.", 2200);
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
  playMouthAnim(el.gameStage, success ? "feliz" : "hablar", 900);

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
  const res = $g("minigame-result");
  res.innerHTML = `
    <div class="games-result-card" role="status">
      <h3>${title}</h3>
      <p class="games-result-score">${scoreLine}</p>
      <ul class="games-rewards">${rows}</ul>
      <p class="games-result-note">${again || (g.id === "pesca" ? `Te quedan ${fishingPlaysRemaining()} de ${GAME_LIMITS.pescaPorDia} partidas de pesca hoy.` : "")}</p>
      <div class="games-result-actions">
        <button type="button" class="games-btn" data-again ${again ? "disabled" : ""}>Otra vez</button>
        <button type="button" class="games-btn games-btn-soft" data-exit>Salir</button>
      </div>
    </div>`;
  res.hidden = false;
  $g("minigame-title").textContent = g.title;
  gamesHint("");
  const againBtn = res.querySelector("[data-again]");
  againBtn.addEventListener("click", () => launchGame(g.id));
  res.querySelector("[data-exit]").addEventListener("click", () => { closeGamePanel(); document.getElementById("btn-jugar")?.focus(); });
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

function closeGamePanel() {
  const panel = $g("minigame-panel");
  if (!panel) return;
  panel.hidden = true;
  $g("minigame-result").hidden = true;
  const arena = $g("minigame-arena");
  if (arena) arena.innerHTML = "";
}

/** Escape: cancela la partida, cierra el resultado o el selector. */
function gamesHandleEscape() {
  if (minigame) { finishMinigame(true); return true; }
  const panel = $g("minigame-panel");
  if (panel && !panel.hidden) { closeGamePanel(); document.getElementById("btn-jugar")?.focus(); return true; }
  if (!$g("game-selector")?.hidden) { closeGameSelector(); return true; }
  return false;
}

// Compatibilidad con llamadas anteriores de app.js.
function setupMinigames() {
  $g("minigame-close")?.addEventListener("click", () => {
    if (minigame) finishMinigame(true); else { closeGamePanel(); document.getElementById("btn-jugar")?.focus(); }
  });
}
function setupGameSelector() {
  renderGameCards();
  $g("game-selector-close")?.addEventListener("click", () => closeGameSelector());
}
