/* ==========================================================================
   Beta v4.6 — Jugar
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
    blurb: "Esperá a que pique, tirá y frená la aguja en la zona verde para sacar el pescado.",
    duration: 30,
    goal: 2,
    maxScore: 3,
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
  fish: "assets/items/fish-item.svg",
  energy: "assets/ui/ficha/energia.svg",
  ball: "assets/ui/actions/04-pelota.svg",
};
const SVG_HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.8 8.2 3 4.5 6.6 4.5c2.2 0 3.6 1.3 5.4 3.3 1.8-2 3.2-3.3 5.4-3.3 3.6 0 5.8 3.7 4.2 7.3C19.5 16.4 12 21 12 21z" fill="#f06a8a" stroke="#5a3a22" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const SVG_STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="#ffd34d" stroke="#5a3a22" stroke-width="1.8" stroke-linejoin="round"/></svg>';

const $g = (id) => document.getElementById(id);

// ---------------------------------------------------------------- Escenas

let gamesSceneId = 0;
function fishingSceneSvg() {
  const u = ++gamesSceneId;
  return `<svg class="games-scene" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="gw-agua-${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fdcf0"/><stop offset="1" stop-color="#3f9fc7"/></linearGradient>
    <linearGradient id="gw-pasto-${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b6e07c"/><stop offset="1" stop-color="#8cc55a"/></linearGradient>
  </defs>
  <rect width="800" height="400" fill="url(#gw-agua-${u})"/>
  <g class="gw-brillos" fill="#ffffff" opacity=".35">
    <rect x="90" y="150" width="70" height="6" rx="3"/><rect x="560" y="300" width="90" height="6" rx="3"/>
    <rect x="620" y="170" width="46" height="6" rx="3"/><rect x="170" y="330" width="54" height="6" rx="3"/>
  </g>
  <path d="M0 0H800V58C730 74 690 52 620 64S520 84 440 70 330 52 250 68 110 80 0 62Z" fill="url(#gw-pasto-${u})" stroke="#5a3a22" stroke-width="4"/>
  <g stroke="#5a3a22" stroke-width="3" stroke-linecap="round" fill="none">
    <path d="M70 66C66 40 72 22 80 8M86 68C88 44 96 30 108 20M100 66C104 50 114 42 126 38"/>
    <path d="M700 64C696 40 700 24 708 10M716 66C720 46 728 34 740 28"/>
  </g>
  <g fill="#7fbf4f" stroke="#5a3a22" stroke-width="3.5" stroke-linejoin="round">
    <path d="M150 300a46 26 0 1 0 60 -20l-28 16z"/>
    <path d="M640 110a38 22 0 1 0 48 -18l-22 14z"/>
    <path d="M700 330a30 17 0 1 0 38 -12l-18 10z"/>
  </g>
  <circle cx="194" cy="283" r="9" fill="#ff9fc0" stroke="#5a3a22" stroke-width="3"/>
  <g class="gw-sombras" fill="#1f5f7d" opacity=".32">
    <ellipse class="gw-sombra gw-sombra-a" cx="0" cy="0" rx="34" ry="12"/>
    <ellipse class="gw-sombra gw-sombra-b" cx="0" cy="0" rx="26" ry="9"/>
  </g>
  <line class="gw-linea" x1="400" y1="-10" x2="400" y2="206" stroke="#fdfdf6" stroke-width="3"/>
  <g class="gw-ondas" fill="none" stroke="#ffffff" stroke-width="3">
    <ellipse class="gw-onda gw-onda-1" cx="400" cy="226" rx="30" ry="9"/>
    <ellipse class="gw-onda gw-onda-2" cx="400" cy="226" rx="30" ry="9"/>
  </g>
  <g class="gw-boya">
    <path d="M384 220a16 16 0 0 1 32 0z" fill="#ffffff" stroke="#5a3a22" stroke-width="4"/>
    <path d="M384 220a16 16 0 0 0 32 0z" fill="#f2663f" stroke="#5a3a22" stroke-width="4"/>
    <rect x="397" y="190" width="6" height="16" rx="3" fill="#f2663f" stroke="#5a3a22" stroke-width="3"/>
  </g>
  <image class="gw-pez-salta" href="assets/items/fish.svg" x="350" y="150" width="100" height="70" opacity="0"/>
</svg>`;
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
      <div class="game-card-art">${g.id === "pesca" ? fishingSceneSvg() : penaltySceneSvg()}</div>
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
  arena.innerHTML = (id === "pesca" ? fishingSceneSvg() : penaltySceneSvg()) + `
    <div class="games-controls">
      <div class="games-meter" hidden><span class="games-meter-zone"></span><span class="games-meter-needle"></span></div>
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
    score.innerHTML = `<img src="${GAME_ICON.fish}" alt="" /> ${minigame.score}/${g.maxScore}`;
    time.textContent = `${Math.max(0, minigame.remaining)} s`;
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

function startFishing() {
  minigame.remaining = minigame.type.duration;
  updateGameChips();
  minigame.clock = setInterval(() => {
    if (!minigame) return;
    minigame.remaining -= 1;
    updateGameChips();
    if (minigame.remaining <= 0 && minigame.phase !== "reel") finishMinigame(false);
  }, 1000);
  fishingWait();
}

function fishingWait() {
  if (!minigame) return;
  if (minigame.remaining <= 0) { finishMinigame(false); return; }
  minigame.phase = "wait";
  const arena = $g("minigame-arena");
  arena.dataset.phase = "wait";
  gamesQ(".games-meter").hidden = true;
  setAction("Esperando…", { disabled: true });
  gamesHint("Esperá a que pique…");
  gamesTimer(() => {
    if (!minigame || minigame.phase !== "wait") return;
    minigame.phase = "bite";
    arena.dataset.phase = "bite";
    setAction("¡Tirar!", { hot: true });
    gamesHint("¡Picó! Tocá ¡Tirar!");
    gamesTimer(() => {
      if (!minigame || minigame.phase !== "bite") return;
      gamesHint("Se escapó… Esperá el próximo.");
      gamesTimer(fishingWait, 700);
      minigame.phase = "lost";
      arena.dataset.phase = "wait";
      setAction("Esperando…", { disabled: true });
    }, 1500);
  }, 1100 + Math.random() * 2200);
}

function fishingAction() {
  const m = minigame;
  if (m.phase === "wait") { gamesHint("Todavía no picó. Esperá la señal."); return; }
  if (m.phase === "bite") { fishingReel(); return; }
  if (m.phase === "reel") fishingStopNeedle();
}

function fishingReel() {
  const m = minigame;
  m.phase = "reel";
  $g("minigame-arena").dataset.phase = "reel";
  const meter = gamesQ(".games-meter");
  meter.hidden = false;
  // La zona verde se achica un poco con cada pescado.
  m.zoneW = Math.max(16, 28 - m.score * 5);
  m.zoneX = 8 + Math.random() * (84 - m.zoneW);
  const zone = meter.querySelector(".games-meter-zone");
  zone.style.left = m.zoneX + "%";
  zone.style.width = m.zoneW + "%";
  const needle = meter.querySelector(".games-meter-needle");
  const period = 1300 - m.score * 180;
  const t0 = performance.now();
  setAction("¡Recoger!", { hot: true });
  gamesHint("¡Frená la aguja en la zona verde!");
  gamesFrame((t) => {
    const p = ((t - t0) % (period * 2)) / period;
    m.needle = (p <= 1 ? p : 2 - p) * 100;
    needle.style.left = m.needle + "%";
  });
}

function fishingStopNeedle() {
  const m = minigame;
  gamesStopFrame();
  const inZone = m.needle >= m.zoneX - 1 && m.needle <= m.zoneX + m.zoneW + 1;
  m.phase = "result";
  if (inZone) {
    m.score += 1;
    updateGameChips();
    popHearts();
    const fish = gamesQ(".gw-pez-salta");
    fish?.classList.remove("is-jumping"); void fish?.getBBox?.(); fish?.classList.add("is-jumping");
    gamesHint(m.score >= m.type.maxScore ? "¡Tres pescados! Buena pesca." : "¡Lo sacaste!");
    setAction("¡Bien!", { disabled: true });
    if (m.score >= m.type.maxScore) { gamesTimer(() => finishMinigame(false), 1100); return; }
  } else {
    gamesHint("¡Se soltó! Probá de nuevo.");
    setAction("Uy…", { disabled: true });
  }
  gamesTimer(fishingWait, 1100);
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

function showPenaltyBanner(text, result) {
  const arena = $g("minigame-arena");
  let b = arena.querySelector(".games-banner");
  if (!b) { b = document.createElement("div"); b.className = "games-banner"; arena.appendChild(b); }
  b.textContent = text;
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
  state.inventory.pescado += fishCaught;
  const happiness = success ? PET_CONFIG.play.felicidad : Math.max(2, Math.round(PET_CONFIG.play.felicidad * .45));
  const energyCost = success ? PET_CONFIG.play.energiaCosto : Math.max(1, Math.round(PET_CONFIG.play.energiaCosto * .6));
  const xp = success ? PET_CONFIG.play.vinculo : Math.max(1, Math.round(PET_CONFIG.play.vinculo * .5));
  const coins = success ? Math.max(5, finished.score * 2) : Math.max(1, finished.score);

  gainFelicidad(happiness);
  state.stats.energia = clamp(state.stats.energia - energyCost, 0, 100);
  addBond(xp);
  state.economy = state.economy || { coins: 0 };
  state.economy.coins = Math.max(0, (state.economy.coins || 0) + coins);
  if (success || fishCaught > 0) recordDailyGoal("play");
  trySave(state);
  refreshUI();
  updateCooldownButtons();
  refreshFeedMenuState();
  playMouthAnim(el.gameStage, success ? "feliz" : "hablar", 900);

  const title = g.id === "pesca"
    ? (success ? "¡Buena pesca!" : fishCaught ? "¡Algo sacamos!" : "Hoy no picaron")
    : (success ? "¡Golazo de partido!" : "¡Buen intento!");
  const scoreLine = g.id === "pesca"
    ? `${fishCaught} ${fishCaught === 1 ? "pescado" : "pescados"}`
    : `${finished.score} de ${g.shots} goles`;
  const rows = [
    `<li><img src="${GAME_ICON.coin}" alt="" /><span>Monedas</span><b>+${coins}</b></li>`,
    fishCaught ? `<li><img src="${GAME_ICON.fish}" alt="" /><span>Pescados al inventario</span><b>+${fishCaught}</b></li>` : "",
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
