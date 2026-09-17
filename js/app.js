/**
 * Lógica principal de la app: onboarding/personalización, pantalla de
 * juego, loop de necesidades y todas las acciones de cuidado (Alimentar
 * con menú, Beber, Limpiar, Jugar, Dormir, Medicina, Afecto: Acariciar +
 * Hablar) más el sistema de salud, vínculo, pedidos espontáneos, y la
 * navegación entre Casa y Jardín (v2.1).
 */

let state = null;
let selectedLook = null;
let tickTimer = null;
let cooldownTimer = null;
let requestsTimer = null;

// ---------- v3.3: sesión en la nube (cuenta + amigos) ----------
let currentUsername = null; // usernameLower, o null en modo sin nube/sin login
let currentDisplayName = null;
let cloudUnsub = null; // desuscribe el onSnapshot de amigos/solicitudes de la cuenta actual
let myCloudData = { friends: {}, friendRequests: { incoming: {}, outgoing: {} } };
let pendingGoogleUid = null; // uid de Google mientras se muestra el paso de "elegí tu usuario"
let friendsTabActive = "lista";
const SESSION_KEY = PET_CONFIG.storageKey + ".session";

function getRememberedUsername() {
  try {
    return localStorage.getItem(SESSION_KEY) || null;
  } catch (e) {
    return null;
  }
}
function rememberUsername(usernameLower) {
  try {
    if (usernameLower) localStorage.setItem(SESSION_KEY, usernameLower);
    else localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    // si no se puede guardar la sesión recordada, no es grave: la próxima
    // vez simplemente vuelve a pedir el login.
  }
}

const el = {
  onboarding: document.getElementById("onboarding"),
  game: document.getElementById("game"),
  appHeader: document.getElementById("app-header"),
  brandEmblem: document.getElementById("brand-emblem"),
  nameInput: document.getElementById("name-input"),
  nameError: document.getElementById("name-error"),
  onboardingTitle: document.getElementById("onboarding-title"),
  onboardingSubmit: document.getElementById("onboarding-submit"),
  onboardingCancel: document.getElementById("onboarding-cancel"),
  creatorTabs: document.getElementById("creator-tabs"),
  creatorSubtabs: document.getElementById("creator-subtabs"),
  creatorSwatchRow: document.getElementById("creator-swatch-row"),
  previewStage: document.getElementById("preview-stage"),
  gameStage: document.getElementById("game-stage"),
  stageFloor: document.getElementById("stage-floor"),
  walker: document.getElementById("walker"),
  petName: document.getElementById("pet-name"),
  statusLine: document.getElementById("status-line"),
  wellbeingWidget: document.getElementById("wellbeing-widget"),
  wellbeingHud: document.getElementById("wellbeing-hud"),
  wellbeingAvatar: document.getElementById("wellbeing-avatar"),
  wellbeingBars: document.getElementById("wellbeing-bars"),
  wellbeingAvatarStage: document.getElementById("wellbeing-avatar-stage"),
  coinCount: document.getElementById("coin-count"),
  headerLevelText: document.getElementById("header-level-text"),
  headerXpText: document.getElementById("header-xp-text"),
  headerLevelFill: document.getElementById("header-level-fill"),
  btnEditPet: document.getElementById("btn-edit-pet"),
  dailyCount: document.getElementById("daily-count"),
  dailyFeed: document.getElementById("daily-feed"),
  dailyPlay: document.getElementById("daily-play"),
  dailyTalk: document.getElementById("daily-talk"),
  dailyReward: document.querySelector(".daily-reward"),
  timeCardClock: document.getElementById("time-card-clock"),
  timeCardLabel: document.getElementById("time-card-label"),
  timeCardIcon: document.getElementById("time-card-icon"),
  navHome: document.getElementById("nav-home"),
  navGarden: document.getElementById("nav-garden"),
  actionsDock: document.getElementById("actions-dock"),
  feedMenu: document.getElementById("feed-menu"),
  dirtLayer: document.getElementById("dirt-layer"),
  toyBall: document.getElementById("toy-ball"),
  speechBubble: document.getElementById("speech-bubble"),
  minigamePanel: document.getElementById("minigame-panel"),
  minigameTitle: document.getElementById("minigame-title"),
  minigameScore: document.getElementById("minigame-score"),
  minigameTime: document.getElementById("minigame-time"),
  minigameInstructions: document.getElementById("minigame-instructions"),
  minigameArena: document.getElementById("minigame-arena"),
  minigameTarget: document.getElementById("minigame-target"),
  minigameClose: document.getElementById("minigame-close"),
  bathFx: document.getElementById("bath-fx"),
  zzzFx: document.getElementById("zzz-fx"),
  liveStatus: document.getElementById("live-status"),
  storageNotice: document.getElementById("storage-notice"),
  flies: document.getElementById("flies"),
  debugPanel: document.getElementById("debug-panel"),
  btnOpciones: document.getElementById("btn-opciones"),
  optionsMenu: document.getElementById("options-menu"),
  optDebug: document.getElementById("opt-debug"),
  optReiniciar: document.getElementById("opt-reiniciar"),
  btnAleatorio: document.getElementById("btn-aleatorio"),
  locationDeco: document.getElementById("location-deco"),
  worldLayer: document.getElementById("world-layer"),
  navBtn: document.getElementById("btn-nav"),
  navBtnLabel: document.getElementById("nav-btn-label"),
  headerClock: document.getElementById("header-clock"),
  footerText: document.getElementById("footer-text"),
  // v3.3: cuenta en la nube + amigos.
  loginScreen: document.getElementById("login-screen"),
  loginForm: document.getElementById("login-form"),
  loginUsername: document.getElementById("login-username"),
  loginPin: document.getElementById("login-pin"),
  loginError: document.getElementById("login-error"),
  loginSubmit: document.getElementById("login-submit"),
  loginOffline: document.getElementById("login-offline"),
  loginDivider: document.getElementById("login-divider"),
  loginGoogle: document.getElementById("login-google"),
  loginGoogleError: document.getElementById("login-google-error"),
  googleUsernameForm: document.getElementById("google-username-form"),
  googleUsername: document.getElementById("google-username"),
  googleUsernameError: document.getElementById("google-username-error"),
  googleUsernameSubmit: document.getElementById("google-username-submit"),
  googleUsernameCancel: document.getElementById("google-username-cancel"),
  optCambiarUsuario: document.getElementById("opt-cambiar-usuario"),
  btnAmigos: document.getElementById("btn-amigos"),
  friendsBadge: document.getElementById("friends-badge"),
  friendsOverlay: document.getElementById("friends-overlay"),
  friendsPanel: document.getElementById("friends-panel"),
  friendsClose: document.getElementById("friends-close"),
  friendsTabs: document.getElementById("friends-tabs"),
  requestsTabBadge: document.getElementById("requests-tab-badge"),
  friendsTabLista: document.getElementById("friends-tab-lista"),
  friendsTabSolicitudes: document.getElementById("friends-tab-solicitudes"),
  friendsTabAgregar: document.getElementById("friends-tab-agregar"),
  friendsList: document.getElementById("friends-list"),
  friendsEmpty: document.getElementById("friends-empty"),
  requestsIncomingList: document.getElementById("requests-incoming-list"),
  requestsIncomingEmpty: document.getElementById("requests-incoming-empty"),
  requestsOutgoingList: document.getElementById("requests-outgoing-list"),
  requestsOutgoingEmpty: document.getElementById("requests-outgoing-empty"),
  addFriendForm: document.getElementById("add-friend-form"),
  addFriendInput: document.getElementById("add-friend-input"),
  addFriendResult: document.getElementById("add-friend-result"),
};

// ---------- Render de la mascota (capas de SVG apiladas) ----------
// (sin cambios respecto a etapas anteriores — cabeza/orejas/ojos/cejas/
// boca inline, nariz <img>, color por CSS variables.)

const SVG_NS = "http://www.w3.org/2000/svg";

function findOption(category, id) {
  return PET_PARTS_MANIFEST[category].find((opt) => opt.id === id);
}

function getBodyColorHex(bodyColorValue) {
  if (isCustomHex(bodyColorValue)) return bodyColorValue;
  const opt = findOption("bodyColor", bodyColorValue);
  return (opt && opt.swatch) || "#6cb9dd";
}

function getEyeColorHex(ojosColorValue) {
  const opt = PET_EYE_COLORS.find((o) => o.id === ojosColorValue);
  return (opt && opt.swatch) || PET_EYE_COLORS[0].swatch;
}

function announce(message) {
  if (el.liveStatus) el.liveStatus.textContent = message;
}

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let saveFailureNotified = false;
function trySave(s) {
  if (debugSnapshot) return true;
  const ok = saveState(s);
  if (!ok && !saveFailureNotified) {
    saveFailureNotified = true;
    if (el.storageNotice) {
      el.storageNotice.textContent = "⚠️ " + getStorageNotice();
      el.storageNotice.hidden = false;
    }
    announce(getStorageNotice());
  } else if (ok && saveFailureNotified) {
    saveFailureNotified = false;
    if (el.storageNotice) el.storageNotice.hidden = true;
    announce("El guardado se restableció, tu mascota se está guardando de nuevo.");
  }
  scheduleCloudSave(s);
  return ok;
}

// ---------- v3.3: guardado en la nube (Firestore), con demora ----------
// El guardado local (arriba) pasa muchas veces por minuto (cada tick,
// cada acción). Empujar eso mismo a la nube en cada llamada gastaría
// escrituras de Firestore sin necesidad — así que acá se junta en una
// sola escritura cada CLOUD_SAVE_DEBOUNCE_MS como máximo, y se fuerza un
// envío inmediato al cambiar de pestaña/cerrar (flushCloudSaveNow) para
// no perder los últimos segundos de progreso.
const CLOUD_SAVE_DEBOUNCE_MS = 20000;
let cloudSaveTimer = null;
let cloudSavePending = false;

function scheduleCloudSave(s) {
  if (!window.Cloud || !window.Cloud.enabled || !currentUsername) return;
  cloudSavePending = true;
  if (cloudSaveTimer) return;
  cloudSaveTimer = setTimeout(() => {
    cloudSaveTimer = null;
    if (!cloudSavePending || !currentUsername) return;
    cloudSavePending = false;
    window.Cloud.savePetState(currentUsername, s);
  }, CLOUD_SAVE_DEBOUNCE_MS);
}

function flushCloudSaveNow() {
  if (!window.Cloud || !window.Cloud.enabled || !currentUsername || !state) return;
  if (cloudSaveTimer) {
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = null;
  }
  cloudSavePending = false;
  window.Cloud.savePetState(currentUsername, state);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushCloudSaveNow();
});
window.addEventListener("pagehide", flushCloudSaveNow);

function makeInlineLayer(innerMarkup, extraClass) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 400 400");
  svg.classList.add("pet-layer", extraClass);
  svg.innerHTML = innerMarkup;
  return svg;
}

function renderPetLayers(stageEl, look) {
  const lookKey = JSON.stringify(look);
  stageEl.style.setProperty("--pet-body-color", getBodyColorHex(look.bodyColor));
  stageEl.style.setProperty("--eye-color", getEyeColorHex(look.ojosColor));
  if (stageEl.dataset.lookKey === lookKey) return;
  stageEl.dataset.lookKey = lookKey;

  stageEl.innerHTML = "";

  stageEl.appendChild(makeInlineLayer(PET_LEGS_INLINE, "pet-layer-legs"));
  stageEl.appendChild(makeInlineLayer(PET_TORSO_INLINE, "pet-layer-torso"));

  const orejasOpt = findOption("orejas", look.orejas);
  if (orejasOpt && orejasOpt.inline) {
    stageEl.appendChild(makeInlineLayer(orejasOpt.inline, "pet-layer-orejas"));
  }

  stageEl.appendChild(makeInlineLayer(PET_ARMS_INLINE, "pet-layer-arms"));

  const cabezaOpt = findOption("cabeza", look.cabeza);
  if (cabezaOpt && cabezaOpt.inline) {
    stageEl.appendChild(makeInlineLayer(cabezaOpt.inline, "pet-layer-cabeza"));
  }

  const cejasOpt = findOption("cejas", look.cejas);
  if (cejasOpt && cejasOpt.inline) {
    stageEl.appendChild(makeInlineLayer(cejasOpt.inline, "pet-layer-cejas"));
  }

  const ojosOpt = findOption("ojos", look.ojos);
  if (ojosOpt && ojosOpt.inline) {
    stageEl.appendChild(makeInlineLayer(ojosOpt.inline, "pet-layer-ojos"));
  }
  stageEl.dataset.ojosId = look.ojos || "";

  const bocaOpt = findOption("boca", look.boca);
  if (bocaOpt && bocaOpt.inline) {
    stageEl.appendChild(makeInlineLayer(bocaOpt.inline, "pet-layer-boca"));
  }
  appendImgLayer(stageEl, "narices", look.narices, "nariz");
}

function appendImgLayer(stageEl, category, optionId, altText) {
  const opt = findOption(category, optionId);
  if (!opt || !opt.file) return;
  const img = document.createElement("img");
  img.src = opt.file;
  img.alt = altText;
  img.className = `pet-layer pet-layer-${category}`;
  stageEl.appendChild(img);
}

// ---------- Ojos: siguen el cursor (salvo dormida / mouse sobre la mascota) ----------
// v2.4: pedido explícito — "que la misma función del seguimiento de ojos
// funcione para el juego, no sólo para la creación" (evitar que se ponga
// bizca). Antes, en el juego, el seguimiento se pausaba al entrar el mouse
// a TODO #stage-floor (el escenario completo); ahora se pausa sólo al
// pasar el mouse por encima de la mascota misma (#game-stage/#preview-stage),
// igual criterio en las dos pantallas — mouseOverPet/mouseOverPreviewPet
// más abajo. Esto además evita que los controles nuevos dentro del
// escenario (panel de bienestar, acciones, salir/entrar) corten el
// seguimiento sólo por estar dentro de #stage-floor.
let mouseOverPet = false;
let mouseOverPreviewPet = false;
let glanceTimer = null;
let glanceReturnTimer = null;

function setPupilOffset(stageEl, side, dx, dy) {
  const pupil = stageEl.querySelector("#pupila-" + side);
  if (pupil) pupil.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
}

function clampToEyeEllipse(dx, dy, rx, ry) {
  if (!rx || !ry) return { dx: 0, dy: 0 };
  const k = Math.hypot(dx / rx, dy / ry);
  if (k > 1) {
    dx /= k;
    dy /= k;
  }
  return { dx, dy };
}

function updatePupils(stageEl, mx, my) {
  const centers = PET_EYE_CENTERS_BY_OJOS[stageEl.dataset.ojosId];
  if (!centers) return;
  ["izq", "der"].forEach((side) => {
    const center = centers[side];
    const clamped = clampToEyeEllipse(mx - center.x, my - center.y, centers.rx, centers.ry);
    setPupilOffset(stageEl, side, clamped.dx, clamped.dy);
  });
}

function resetPupils(stageEl) {
  setPupilOffset(stageEl, "izq", 0, 0);
  setPupilOffset(stageEl, "der", 0, 0);
}

function scheduleGlance() {
  clearTimeout(glanceTimer);
  const delay = 2200 + Math.random() * 2600;
  glanceTimer = setTimeout(() => {
    if (!mouseOverPet || (state && state.sleep.dormida)) return;
    const centers = PET_EYE_CENTERS_BY_OJOS[el.gameStage.dataset.ojosId];
    if (!centers) { scheduleGlance(); return; }
    const angle = Math.random() * Math.PI * 2;
    const k = 0.5 + Math.random() * 0.5;
    const dx = Math.cos(angle) * centers.rx * k;
    const dy = Math.sin(angle) * centers.ry * k;
    setPupilOffset(el.gameStage, "izq", dx, dy);
    setPupilOffset(el.gameStage, "der", dx, dy);
    clearTimeout(glanceReturnTimer);
    glanceReturnTimer = setTimeout(() => {
      if (mouseOverPet) resetPupils(el.gameStage);
    }, 650 + Math.random() * 500);
    scheduleGlance();
  }, delay);
}

/** Pausa el seguimiento de mouse mientras el cursor está literalmente
 * arriba de la mascota del juego (ya no arriba de todo el escenario, ver
 * comentario más arriba) — evita que se ponga bizca al acercar el mouse, y
 * mientras tanto hace "glances" (miradas cortas al azar) para que no quede
 * clavada mirando al frente. */
function setupStageHover() {
  el.gameStage.addEventListener("pointerenter", () => {
    mouseOverPet = true;
    resetPupils(el.gameStage);
    scheduleGlance();
  });
  el.gameStage.addEventListener("pointerleave", () => {
    mouseOverPet = false;
    clearTimeout(glanceTimer);
    clearTimeout(glanceReturnTimer);
  });
}

/** Misma protección que setupStageHover, aplicada a la mascota del
 * creador/editor (#preview-stage) — pedido explícito v2.4: "que la mascota
 * siga al mouse con los ojos, menos cuando le pasás el mouse por encima de
 * su cara". Acá no hace falta "glance" (no hay caminata ni ánimo en el
 * creador): alcanza con centrar las pupilas mientras el cursor está
 * encima. */
function setupPreviewStageHover() {
  if (!el.previewStage) return;
  el.previewStage.addEventListener("pointerenter", () => {
    mouseOverPreviewPet = true;
    resetPupils(el.previewStage);
  });
  el.previewStage.addEventListener("pointerleave", () => {
    mouseOverPreviewPet = false;
  });
}

function setupEyeTracking() {
  document.addEventListener("mousemove", (event) => {
    if (state && state.sleep.dormida) return; // dormida: ojos cerrados, no sigue nada
    const activeStage = !el.game.hidden ? el.gameStage : !el.onboarding.hidden ? el.previewStage : null;
    if (!activeStage) return;
    if (activeStage === el.gameStage && mouseOverPet) return;
    if (activeStage === el.previewStage && mouseOverPreviewPet) return;
    const rect = activeStage.getBoundingClientRect();
    if (!rect.width) return;
    const scale = rect.width / 400;
    const mx = (event.clientX - rect.left) / scale;
    const my = (event.clientY - rect.top) / scale;
    updatePupils(activeStage, mx, my);
  });
}

// ---------- La mascota deambula sola por el escenario ----------

let walkX = 0;
let walkMax = 0;
let walkTarget = 0;
let walkSpeed = 0;
let walkState = "idle";
let walkStateUntil = 0;
let walkStridePhase = 0;
let walkLastTs = null;
const WALK_PAD = 16;
const WALK_SPEED_MIN = 38;
const WALK_SPEED_MAX = 82;
const RUN_SPEED_MIN = 130;
const RUN_SPEED_MAX = 170;
const RUN_HOLD_MS = 180;
const LEG_SWING_MAX_DEG = 16;

const AUTONOMOUS_IDLE_DELAY_MS = 10000;
let lastInteractionTs = 0;
function registerInteraction() {
  lastInteractionTs = performance.now();
}

function computeWalkBounds() {
  const floorWidth = el.stageFloor.clientWidth;
  const walkerWidth = el.walker.offsetWidth || 200;
  walkMax = Math.max(0, floorWidth - walkerWidth - WALK_PAD * 2);
  if (walkX > walkMax) walkX = walkMax;
  if (walkTarget > walkMax) walkTarget = walkMax;
}

function restLegs() {
  const legIzq = el.gameStage.querySelector("#pierna-izq");
  const legDer = el.gameStage.querySelector("#pierna-der");
  if (legIzq) legIzq.style.transform = "rotate(0deg)";
  if (legDer) legDer.style.transform = "rotate(0deg)";
}

function applyLegSwing(stridePhase, intensity) {
  const legIzq = el.gameStage.querySelector("#pierna-izq");
  const legDer = el.gameStage.querySelector("#pierna-der");
  const swing = Math.sin(stridePhase) * LEG_SWING_MAX_DEG * intensity;
  if (legIzq) legIzq.style.transform = `rotate(${swing.toFixed(1)}deg)`;
  if (legDer) legDer.style.transform = `rotate(${(-swing).toFixed(1)}deg)`;
}

function startIdle(minMs, maxMs) {
  walkState = "idle";
  walkStateUntil = performance.now() + minMs + Math.random() * (maxMs - minMs);
  restLegs();
}

/** ¿Puede caminar sola / responder al click-to-walk ahora mismo? No,
 * mientras duerme, ni mientras está en medio de un cambio de lugar
 * (navLock — ver goToLocation). Tampoco corre si está muy cansada o
 * enferma — sigue pudiendo caminar despacio, pero no acelerar. */
function canWalk() {
  return !!state && !state.sleep.dormida && !navLock;
}
function canRun() {
  return canWalk() && !state.health.enferma && state.stats.energia > PET_CONFIG.energiaMuyCansadaUmbral;
}

function pickNewWalkTarget() {
  walkTarget = Math.random() * walkMax;
  walkSpeed = WALK_SPEED_MIN + Math.random() * (WALK_SPEED_MAX - WALK_SPEED_MIN);
}

function walkFrame(ts) {
  if (walkLastTs == null) walkLastTs = ts;
  const dt = Math.min((ts - walkLastTs) / 1000, 0.1);
  walkLastTs = ts;

  // Mientras dura un cambio de lugar, goToLocation()/animateWalkTo() tienen
  // el control total de walkX/el.walker — este loop se queda en pausa (pero
  // se sigue re-agendando solo) para no pelear por la posición.
  if (navLock) {
    requestAnimationFrame(walkFrame);
    return;
  }

  if (walkMax <= 0 || !canWalk()) {
    if (state && state.sleep.dormida && walkState !== "idle") startIdle(200, 400);
    requestAnimationFrame(walkFrame);
    return;
  }

  if (walkState === "idle") {
    if (ts >= walkStateUntil) {
      if (ts - lastInteractionTs < AUTONOMOUS_IDLE_DELAY_MS) {
        walkStateUntil = ts + 500;
      } else {
        pickNewWalkTarget();
        if (Math.random() < 0.25) {
          walkTarget = clamp(walkX + (Math.random() < 0.5 ? -1 : 1) * (20 + Math.random() * 40), 0, walkMax);
        }
        walkState = "walking";
      }
    }
  } else {
    const dist = walkTarget - walkX;
    const step = walkSpeed * dt;
    if (Math.abs(dist) <= step) {
      walkX = walkTarget;
      startIdle(700, 3200);
    } else {
      walkX += Math.sign(dist) * step;
      walkStridePhase += dt * (walkSpeed / 12);
      applyLegSwing(walkStridePhase, Math.min(1, walkSpeed / WALK_SPEED_MAX));
      if (Math.random() < 0.003) {
        startIdle(400, 1400);
      }
    }
  }

  el.walker.style.transform = `translateX(${(walkX + WALK_PAD).toFixed(1)}px)`;
  requestAnimationFrame(walkFrame);
}

function setupVisibilityRecalc() {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state) {
      const info = applyDecay(state);
      trySave(state);
      refreshUI();
      updateCooldownButtons();
      maybeGreet(info);
    }
  });
}

function setPointerWalkTarget(clientX) {
  if (walkMax <= 0) return;
  const rect = el.stageFloor.getBoundingClientRect();
  const walkerWidth = el.walker.offsetWidth || 200;
  const x = clientX - rect.left;
  const desired = x - walkerWidth / 2 - WALK_PAD;
  walkTarget = clamp(desired, 0, walkMax);
}

let isRunning = false;
let runHoldTimer = null;

function setupClickToWalk() {
  el.stageFloor.addEventListener("pointerdown", (event) => {
    // Un click sobre una mancha/el juguete/el personaje no debe además
    // mover a la mascota hacia ahí — esos elementos ya manejan su propio
    // click (pedido explícito, sección 10: "menús/manchas/botones no
    // deben activar accidentalmente el movimiento de fondo"; el personaje
    // se suma en v2.2, porque clickearlo ahora acaricia en vez de mover).
    if (event.target.closest(".dirt-item") || event.target.closest("#toy-ball") || event.target.closest("#game-stage") || event.target.closest(".world-object")) return;
    registerInteraction();
    if (walkMax <= 0 || !canWalk()) return;
    setPointerWalkTarget(event.clientX);
    walkSpeed = WALK_SPEED_MIN + Math.random() * (WALK_SPEED_MAX - WALK_SPEED_MIN);
    walkState = "walking";
    isRunning = false;
    clearTimeout(runHoldTimer);
    runHoldTimer = setTimeout(() => {
      if (!canRun()) return;
      isRunning = true;
      walkSpeed = RUN_SPEED_MIN + Math.random() * (RUN_SPEED_MAX - RUN_SPEED_MIN);
    }, RUN_HOLD_MS);
  });

  el.stageFloor.addEventListener("pointermove", (event) => {
    if (!isRunning) return;
    setPointerWalkTarget(event.clientX);
  });

  function endHold() {
    clearTimeout(runHoldTimer);
    isRunning = false;
  }
  el.stageFloor.addEventListener("pointerup", endHold);
  el.stageFloor.addEventListener("pointercancel", endHold);
  el.stageFloor.addEventListener("pointerleave", endHold);
}

function setupWalking() {
  computeWalkBounds();
  registerInteraction();
  startIdle(300, 1200);
  requestAnimationFrame(walkFrame);
  window.addEventListener("resize", computeWalkBounds);
  setupClickToWalk();
}

// ---------- Casa / Jardín: navegación entre lugares (sección 4, v2.1) ----------

/** Contenido decorativo de cada lugar — se arma sólo cuando ese lugar está
 * activo (en vez de tener los 8 elementos siempre en el DOM y ocultar/
 * mostrar con CSS), así no hay que sincronizar visibilidad por clase en
 * dos lugares distintos y las animaciones (nubes) arrancan limpias cada
 * vez que se entra al Jardín. */
const LOCATION_DECO_HTML = {
  // v2.5: fondo ilustrado (antes un div con gradiente CSS) — ver
  // HOME_SCENE_INLINE en js/manifest.js para la extracción/organización
  // de capas (suelo/pared/ventana/puerta/alfombra) a partir de
  // home-scene.ai. #scene-puerta dentro de este markup tiene su propio
  // click handler (ver setupSceneDoor más abajo) que sale al Jardín.
  casa: HOME_SCENE_INLINE,
  // v2.2: Jardín vuelve al diseño simple de antes de v2.1 (cielo + pasto +
  // sol + nubes, ver css/style.css) — se sacaron la cerca/arbustos/flores/
  // fachada de casa. Se agrega sol/luna/estrellas (nuevo, no existía
  // antes): updateClock() alterna la clase .is-night sobre #stage-floor
  // según la hora real de la PC, y el CSS decide cuál se ve.
  jardin:
    '<span class="cloud cloud-1"></span><span class="cloud cloud-2"></span><span class="cloud cloud-3"></span>' +
    '<span class="sun"></span><span class="moon"></span>' +
    '<span class="star star-1"></span><span class="star star-2"></span><span class="star star-3"></span><span class="star star-4"></span>',
};

/** Aplica la ilustración/etiquetas de un lugar — SIN moverse (eso lo hace
 * goToLocation). Se llama una sola vez al entrar a un lugar (arranque del
 * juego o al terminar una transición), no en cada refreshUI(), para no
 * reiniciar las animaciones de fondo (nubes) a cada rato. */
function setLocationVisuals(locationId) {
  const def = getLocationDef(locationId);
  el.stageFloor.classList.remove(...PET_LOCATIONS.map((l) => "location-" + l.id));
  el.stageFloor.classList.add("location-" + def.id);
  if (el.locationDeco) el.locationDeco.innerHTML = LOCATION_DECO_HTML[def.id] || "";
  if (el.navBtnLabel) el.navBtnLabel.textContent = def.exitLabel;
  if (state) renderWorldObjects();
}

// ---------- Fase 1: objetos interactivos de la Casa ----------

function worldObjectArt(kind) {
  const art = {
    bed: '<span class="wo-bed"><i class="wo-bed-head"></i><i class="wo-bed-pillow"></i><i class="wo-bed-blanket"></i></span>',
    sofa: '<span class="wo-sofa"><i class="wo-sofa-back"></i><i class="wo-sofa-seat"></i><i class="wo-sofa-arm wo-left"></i><i class="wo-sofa-arm wo-right"></i></span>',
    "food-bowl": '<span class="wo-bowl wo-food"><i></i></span>',
    "water-bowl": '<span class="wo-bowl wo-water"><i></i></span>',
    toy: '<span class="wo-toy"><i></i></span>',
    lamp: '<span class="wo-lamp"><i class="wo-lamp-shade"></i><i class="wo-lamp-stem"></i><i class="wo-lamp-base"></i><i class="wo-lamp-glow"></i></span>',
  };
  return art[kind] || '<span class="wo-placeholder"></span>';
}

function randomWorldPhrase(obj) {
  const list = Array.isArray(obj.phrases) ? obj.phrases.filter(Boolean) : [];
  return list.length ? list[Math.floor(Math.random() * list.length)] : obj.name;
}

function updateWorldLighting() {
  if (!state || !el.stageFloor) return;
  const lampOn = !!state.world?.objects?.lamp_01?.on;
  el.stageFloor.classList.toggle("room-lamp-on", state.location === "casa" && lampOn);
  const lamp = el.worldLayer?.querySelector('[data-world-id="lamp_01"]');
  if (lamp) {
    lamp.classList.toggle("is-on", lampOn);
    lamp.setAttribute("aria-pressed", String(lampOn));
  }
}

function movePetNearWorldObject(obj) {
  if (!obj || !canWalk()) return;
  computeWalkBounds();
  const walkerWidth = el.walker.offsetWidth || 200;
  const stageX = (obj.x / 100) * el.stageFloor.clientWidth;
  walkTarget = clamp(stageX - walkerWidth / 2 - WALK_PAD, 0, walkMax);
  walkSpeed = WALK_SPEED_MAX;
  walkState = "walking";
}

function interactWithWorldObject(obj) {
  if (!state || !obj || navLock || state.location !== obj.room) return;
  registerInteraction();
  const node = el.worldLayer?.querySelector(`[data-world-id="${obj.id}"]`);
  if (node) {
    node.classList.remove("world-object-pulse");
    void node.offsetWidth;
    node.classList.add("world-object-pulse");
  }

  switch (obj.action) {
    case "sleep":
      toggleSueño();
      break;
    case "feed":
      if (state.sleep.dormida) { notifySystem(`${state.name} está durmiendo.`); return; }
      if (el.feedMenu.hidden) toggleFeedMenu();
      else refreshFeedMenuState();
      if (el.feedMenu.hidden === false) showBubble(randomWorldPhrase(obj), 2400);
      break;
    case "drink":
      doBeber();
      break;
    case "play":
      showBubble(randomWorldPhrase(obj), 1800);
      doJugar();
      break;
    case "sofa": {
      if (state.sleep.dormida) { notifySystem(`${state.name} está durmiendo.`); return; }
      movePetNearWorldObject(obj);
      const now = Date.now();
      const sofaState = state.world.objects.sofa_01;
      if (now - sofaState.lastRewardAt >= 30000) {
        gainFelicidad(2);
        addBond(1);
        sofaState.lastRewardAt = now;
        trySave(state);
        refreshUI();
      }
      setTimeout(() => { if (state && state.location === obj.room && !state.sleep.dormida) showBubble(randomWorldPhrase(obj), 3000); }, prefersReducedMotion() ? 50 : 650);
      break;
    }
    case "lamp":
      state.world.objects.lamp_01.on = !state.world.objects.lamp_01.on;
      trySave(state);
      updateWorldLighting();
      showBubble(state.world.objects.lamp_01.on ? "Qué linda luz." : "Apaguemos la luz un rato.", 2400);
      break;
  }
}

function renderWorldObjects() {
  if (!el.worldLayer || !state) return;
  el.worldLayer.innerHTML = "";
  const objects = getRoomObjects(state.location);
  objects.forEach((obj) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `world-object world-object-${obj.type}`;
    button.dataset.worldId = obj.id;
    button.dataset.tooltip = obj.tooltip || obj.name;
    button.setAttribute("aria-label", `${obj.name}: ${obj.tooltip || "interactuar"}`);
    if (obj.action === "lamp") button.setAttribute("aria-pressed", "false");
    button.style.left = `${obj.x}%`;
    button.style.top = `${obj.y}%`;
    button.style.width = `${obj.width}%`;
    button.style.zIndex = String(obj.depth || 1);
    button.innerHTML = worldObjectArt(obj.art);
    button.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    button.addEventListener("click", (ev) => { ev.stopPropagation(); interactWithWorldObject(obj); });
    el.worldLayer.appendChild(button);
  });
  updateWorldLighting();
}

/** Mueve a la mascota (walkX) hasta targetX en `ms` milisegundos, con el
 * mismo swing de piernas que la caminata normal. Se usa sólo durante un
 * cambio de lugar (ver walkFrame: se pausa solo mientras navLock es
 * true, así no compite por el control de la posición). */
function animateWalkTo(targetX, ms) {
  return new Promise((resolve) => {
    const startX = walkX;
    const startTs = performance.now();
    if (ms <= 0) {
      walkX = targetX;
      el.walker.style.transform = `translateX(${(walkX + WALK_PAD).toFixed(1)}px)`;
      restLegs();
      resolve();
      return;
    }
    function step(ts) {
      const t = Math.min(1, (ts - startTs) / ms);
      walkX = startX + (targetX - startX) * t;
      walkStridePhase += 0.32;
      applyLegSwing(walkStridePhase, 0.85);
      el.walker.style.transform = `translateX(${(walkX + WALK_PAD).toFixed(1)}px)`;
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        restLegs();
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

function setNavControlsDisabled(disabled) {
  if (el.navBtn) el.navBtn.disabled = disabled;
}

let navLock = false;

/** Cambia de lugar (Casa <-> Jardín): la mascota primero camina hacia la
 * salida y RECIÉN DESPUÉS cambia de escenario con una transición breve
 * (pedido explícito, sección 4). navLock evita activaciones duplicadas
 * mientras dura (puerta + botón accesible quedan deshabilitados). No
 * cancela enfermedades, no rellena necesidades, no reinicia esperas — sólo
 * toca state.location y la posición de #walker; todo lo demás del estado
 * sigue su curso normal (el tick de necesidades no se detiene). */
async function goToLocation(targetId) {
  if (!state || navLock || el.game.hidden) return;
  if (targetId === state.location || minigame) return;
  if (debugSnapshot) { state.location = targetId; setLocationVisuals(targetId); refreshUI(); computeWalkBounds(); return; }
  if (state.sleep.dormida) {
    notifySystem(`${state.name} está durmiendo — no puede salir hasta que despierte.`);
    announce(`${state.name} está durmiendo, no puede cambiar de lugar ahora.`);
    return;
  }
  if (!el.toyBall.hidden) {
    notifySystem(`Esperá a que termine con el juguete.`);
    return;
  }

  navLock = true;
  registerInteraction();
  setNavControlsDisabled(true);

  const reduced = prefersReducedMotion();
  const cfg = PET_CONFIG.navigation;
  const walkMs = reduced ? cfg.walkToExitMsReducedMotion : cfg.walkToExitMs;
  const halfTransitionMs = (reduced ? cfg.transitionMsReducedMotion : cfg.transitionMs) / 2;

  const fromDef = getLocationDef(state.location);
  computeWalkBounds();
  const exitX = fromDef.side === "left" ? 0 : walkMax;
  await animateWalkTo(exitX, walkMs);

  el.stageFloor.classList.add("location-fading");
  await wait(halfTransitionMs);

  state.location = targetId;
  trySave(state);
  setLocationVisuals(targetId);
  computeWalkBounds();
  const toDef = getLocationDef(targetId);
  walkX = clamp(toDef.side === "left" ? 20 : walkMax - 20, 0, walkMax);
  el.walker.style.transform = `translateX(${(walkX + WALK_PAD).toFixed(1)}px)`;
  refreshUI();

  await wait(halfTransitionMs);
  el.stageFloor.classList.remove("location-fading");

  startIdle(400, 1200);
  navLock = false;
  setNavControlsDisabled(false);
  announce(`Ahora estás en: ${toDef.label}.`);
}

function setupNavigation() {
  const go = () => goToLocation(getLocationDef(state.location).to);
  if (el.navBtn) el.navBtn.addEventListener("click", go);
}

function setupHeaderNavigation() {
  if (el.navHome) el.navHome.addEventListener("click", () => goToLocation("casa"));
  if (el.navGarden) el.navGarden.addEventListener("click", () => goToLocation("jardin"));
}

/* v2.5: pedido explícito — "al hacerle click a la puerta de la escena que
 * funcione como hacerle click al botón SALIR AL JARDÍN". La puerta
 * (#scene-puerta) sólo existe dentro del fondo de la Casa (HOME_SCENE_INLINE,
 * inyectado en #location-deco por setLocationVisuals) — se delega el click
 * en #location-deco en vez de buscar #scene-puerta directo, porque ese
 * markup se reconstruye entero cada vez que cambia de lugar. stopPropagation
 * evita que el mismo click además dispare el click-to-walk del fondo. */
function setupSceneDoor() {
  if (!el.locationDeco) return;
  el.locationDeco.addEventListener("click", (ev) => {
    const puerta = ev.target.closest("#scene-puerta");
    if (!puerta) return;
    ev.stopPropagation();
    if (!state) return;
    goToLocation(getLocationDef(state.location).to);
  });
}

// v2.6: pedido explícito — se saca el acordeón de .wellbeing-bars (antes
// setupWellbeingAccordion(), botón #wellbeing-toggle con el ícono
// "flecha" de icons.js): el panel de necesidades queda siempre visible,
// ya no hace falta abrirlo/cerrarlo a mano.

// ---------- Onboarding / personalización ----------

const CATEGORY_LABELS = {
  bodyColor: "Color",
  cabeza: "Cabeza",
  orejas: "Orejas",
  ojos: "Ojos",
  narices: "Nariz",
  boca: "Boca",
  cejas: "Cejas",
};

// v2.4: rediseño pedido explícito — 7 pestañas de categoría en vez de la
// grilla de tarjetas de siempre (todas las categorías visibles a la vez).
// "ojos" además abre una sub-pestaña para elegir por separado la FORMA
// (las mismas opciones numeradas de antes) del COLOR (lo que antes era
// buildEyeColorRow, ahora "ojos-color" como sub-pestaña en vez de una fila
// pegada abajo de las opciones de forma).
const CREATOR_TABS = ["bodyColor", "cabeza", "orejas", "ojos", "narices", "boca", "cejas"];
let activeCreatorTab = "bodyColor";
let activeOjosSubtab = "forma"; // "forma" | "color"

function buildCreatorTabs() {
  if (!el.creatorTabs) return;
  el.creatorTabs.innerHTML = "";
  CREATOR_TABS.forEach((category) => {
    const label = CATEGORY_LABELS[category] || category;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "creator-tab";
    btn.id = "creator-tab-" + category;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", category === activeCreatorTab ? "true" : "false");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      if (activeCreatorTab === category) return;
      activeCreatorTab = category;
      renderCreatorPanel();
      announce(`Categoría: ${label}`);
    });
    el.creatorTabs.appendChild(btn);
  });
}

function buildOjosSubtabs() {
  if (!el.creatorSubtabs) return;
  el.creatorSubtabs.innerHTML = "";
  el.creatorSubtabs.hidden = activeCreatorTab !== "ojos";
  if (activeCreatorTab !== "ojos") return;
  [
    { id: "forma", label: "Selección" },
    { id: "color", label: "Color" },
  ].forEach((sub) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "creator-subtab";
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", sub.id === activeOjosSubtab ? "true" : "false");
    btn.textContent = sub.label;
    btn.addEventListener("click", () => {
      if (activeOjosSubtab === sub.id) return;
      activeOjosSubtab = sub.id;
      renderCreatorSwatchRow();
      buildOjosSubtabs();
      announce(`Ojos: ${sub.label}`);
    });
    el.creatorSubtabs.appendChild(btn);
  });
}

/** Fila de swatches de la pestaña activa. Para "ojos" depende además de la
 * sub-pestaña (forma numerada vs. color de iris, ver buildOjosSubtabs). */
function renderCreatorSwatchRow() {
  if (!el.creatorSwatchRow) return;
  el.creatorSwatchRow.innerHTML = "";

  const showingEyeColor = activeCreatorTab === "ojos" && activeOjosSubtab === "color";
  const category = showingEyeColor ? "ojosColor" : activeCreatorTab;
  const label = showingEyeColor ? "Color de ojos" : (CATEGORY_LABELS[activeCreatorTab] || activeCreatorTab);
  const options = showingEyeColor ? PET_EYE_COLORS : PET_PARTS_MANIFEST[activeCreatorTab];
  const isNumbered = !showingEyeColor && activeCreatorTab !== "bodyColor";

  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = isNumbered ? "swatch swatch-number" : "swatch";
    btn.title = opt.label;
    btn.setAttribute("aria-label", `${label}: ${opt.label}`);
    if (isNumbered) {
      btn.textContent = opt.label;
    } else {
      btn.style.background = opt.swatch;
    }
    const selected = selectedLook[category] === opt.id;
    btn.classList.toggle("selected", selected);
    btn.setAttribute("aria-pressed", selected ? "true" : "false");
    btn.addEventListener("click", () => {
      selectedLook[category] = opt.id;
      renderPetLayers(el.previewStage, selectedLook);
      renderCreatorSwatchRow();
      announce(`${label}: ${opt.label}`);
    });
    el.creatorSwatchRow.appendChild(btn);
  });
}

function renderCreatorPanel() {
  if (el.creatorTabs) {
    CREATOR_TABS.forEach((category) => {
      const btn = document.getElementById("creator-tab-" + category);
      if (btn) btn.setAttribute("aria-selected", category === activeCreatorTab ? "true" : "false");
    });
  }
  buildOjosSubtabs();
  renderCreatorSwatchRow();
}

function randomizeLook() {
  Object.keys(PET_PARTS_MANIFEST).forEach((category) => {
    const opts = PET_PARTS_MANIFEST[category];
    selectedLook[category] = opts[Math.floor(Math.random() * opts.length)].id;
  });
  selectedLook.ojosColor = PET_EYE_COLORS[Math.floor(Math.random() * PET_EYE_COLORS.length)].id;
  renderCreatorPanel();
  renderPetLayers(el.previewStage, selectedLook);
}

/** Nombre válido — pedido explícito v2.6: "que sea obligatorio un nombre
 * de al menos dos carácteres" (antes un nombre vacío simplemente caía a
 * "Mi mascota" por defecto, sin avisar nada). */
function isValidPetName(value) {
  return value.trim().length >= 2;
}

function clearNameError() {
  if (el.nameError) el.nameError.hidden = true;
  if (el.nameInput) el.nameInput.classList.remove("input-error");
}

function openOnboarding(existingState) {
  document.getElementById("game-selector").hidden = true;
  if (navLock) return;
  finishMinigame(true);
  closeAllMenus();
  selectedLook = existingState ? { ...defaultLook(), ...existingState.look } : defaultLook();
  el.nameInput.value = existingState ? existingState.name : "";
  clearNameError();
  el.onboardingTitle.textContent = existingState ? "Editá tu mascota" : "Creá tu mascota";
  el.onboarding.classList.toggle("is-editing", !!existingState);
  el.onboardingSubmit.textContent = existingState ? "Guardar cambios" : "Crear mascota";
  if (el.onboardingCancel) el.onboardingCancel.hidden = !existingState;
  // v2.6: pedido explícito — el emblema grande sólo se ve al CREAR (no al
  // editar), y el encabezado entero desaparece sólo mientras se crea una
  // mascota por primera vez (durante la edición se mantiene, con el menú
  // de Opciones disponible como siempre).
  if (el.brandEmblem) el.brandEmblem.hidden = !!existingState;
  if (el.appHeader) el.appHeader.hidden = !existingState;
  activeCreatorTab = "bodyColor";
  activeOjosSubtab = "forma";
  buildCreatorTabs();
  renderCreatorPanel();
  renderPetLayers(el.previewStage, selectedLook);
  el.onboarding.hidden = false;
  el.game.hidden = true;
}

function cancelOnboarding() {
  el.onboarding.hidden = true;
  el.onboarding.classList.remove("is-editing");
  el.game.hidden = false;
  if (el.appHeader) el.appHeader.hidden = false;
}

function submitOnboarding() {
  const rawName = el.nameInput.value;
  if (!isValidPetName(rawName)) {
    if (el.nameError) el.nameError.hidden = false;
    el.nameInput.classList.add("input-error");
    el.nameInput.focus();
    announce("El nombre debe tener al menos 2 caracteres.");
    return;
  }
  clearNameError();
  const name = rawName.trim();
  const cleanLook = normalizeLook(selectedLook);
  if (state) {
    // Editar la apariencia NO cambia el lugar actual (pedido explícito,
    // sección 4) — state.location queda tal cual estaba.
    state.name = name;
    state.look = cleanLook;
    trySave(state);
  } else {
    state = createNewState(name, cleanLook);
    trySave(state);
  }
  el.onboarding.hidden = true;
  el.game.hidden = false;
  if (el.appHeader) el.appHeader.hidden = false;
  startGame();
}

// ---------- Pantalla de juego: necesidades (barras + panel secundario) ----------

// v2.4: orden pedido explícito para el panel de bienestar DENTRO del
// escenario — Agua (hidratación), Hambre (saciedad), Higiene, Energía, en
// ese orden (antes: saciedad/hidratacion/higiene/energia). El ícono de
// "comer" (un bowl) hace las veces del "platito" que pidió para el hambre;
// el resto reusa los mismos íconos de siempre.
// v3.2, pedido explícito: "que la barra de ánimo no esté más, esto uno lo
// debería saber con el color de borde del círculo del #wellbeing-avatar
// que cambia de verde a amarillo y rojo" — se saca la fila de Ánimo/
// felicidad de esta placa (vuelve a ser sólo las 4 necesidades físicas,
// como en v2.4/v2.5); el ánimo sigue existiendo como stat interno, sólo
// que ahora se ve EXCLUSIVAMENTE en updateWellbeingAvatar() (el borde del
// círculo) y en las frases espontáneas, no en una barra propia.
const NEED_DEFS = [
  { key: "saciedad", label: "Hambre", icon: "comer" },
  { key: "hidratacion", label: "Sed", icon: "beber" },
  { key: "higiene", label: "Higiene", icon: "limpiar" },
  { key: "energia", label: "Energía", icon: "energia" },
];

/** Arma las 4 filas compactas ícono+barra del panel de bienestar (ahora
 * dentro del escenario, ver #wellbeing-bars en index.html) una sola vez —
 * se guardan referencias para actualizarlas rápido sin reconstruir el DOM
 * en cada refresco. */
const needMeterEls = {};
function buildPrimaryMeters() {
  if (!el.wellbeingBars) return;
  el.wellbeingBars.innerHTML = "";
  NEED_DEFS.forEach(({ key, label, icon }) => {
    const row = document.createElement("div");
    row.className = "wellbeing-row";
    const labelId = "wellbeing-label-" + key;
    row.innerHTML = `
      ${iconSvg(icon)}
      <span id="${labelId}" class="wellbeing-label">${label}</span>
      <div class="wellbeing-track" role="meter" aria-labelledby="${labelId}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">
        <div class="wellbeing-fill meter-${key}"></div>
      </div>
      <strong class="wellbeing-value">100%</strong>`;
    el.wellbeingBars.appendChild(row);
    needMeterEls[key] = {
      track: row.querySelector(".wellbeing-track"),
      fill: row.querySelector(".wellbeing-fill"),
      value: row.querySelector(".wellbeing-value"),
    };
  });
}

function updateMeters() {
  const s = state.stats;
  if (el.wellbeingAvatarStage) renderPetLayers(el.wellbeingAvatarStage, state.look);
  NEED_DEFS.forEach(({ key }) => {
    const refs = needMeterEls[key];
    if (!refs) return;
    const v = Math.round(s[key]);
    refs.fill.style.width = s[key] + "%";
    refs.track.setAttribute("aria-valuenow", v);
    if (refs.value) refs.value.textContent = v + "%";
    refs.track.classList.toggle("meter-low", s[key] < PET_CONFIG.mood.critico);
    refs.track.closest(".wellbeing-row")?.classList.toggle("is-warning", s[key] < PET_CONFIG.mood.normal);
  });
}

/* v2.5: pedido explícito — sacar la fila de Felicidad/Salud (antes
 * buildSecondaryIndicators/updateSecondaryIndicators, dos chips de texto
 * en .side-col) y en su lugar PROYECTAR esas dos cosas sobre la
 * mini-foto de la mascota (.wellbeing-avatar, arriba a la izquierda):
 * - Felicidad: color del borde (verde/amarillo/rojo) Y la misma expresión
 *   de cara (mood-feliz/normal/triste) que usa la mascota grande — se
 *   aplican las clases sobre #wellbeing-avatar-stage, que ya recibe su
 *   propio renderPetLayers() en updateMeters().
 * - Enfermedad: mismo filtro visual ".sick" que la mascota del juego.
 *
 * v2.6: pedido explícito — el color del borde ya no es un valor fijo por
 * tramo, va DE LA MANO con el mismo estado de ánimo de siempre: verde en
 * el estado neutral/feliz (felicidad > FELICIDAD_BORDE.feliz), amarillo
 * al "enojarse" (felicidad entre los dos umbrales) y, en el tramo más
 * bajo (felicidad < FELICIDAD_BORDE.enojo, el mismo tramo que ya hacía
 * temblar más las frases espontáneas), una animación que va alternando
 * amarillo-rojo-amarillo-rojo sin parar hasta que la felicidad suba de
 * nuevo a amarillo o verde (ver @keyframes avatar-border-critico en
 * css/style.css). Enferma pisa todo lo anterior con su propia animación
 * verde-azul, también en loop hasta que se cure. Las clases (no un color
 * fijo por JS) son las que permiten que sea una animación CSS en vez de
 * un valor estático. */
function updateWellbeingAvatar() {
  if (!el.wellbeingAvatar || !el.wellbeingAvatarStage) return;
  const fel = state.stats.felicidad;
  const tier = fel > FELICIDAD_BORDE.feliz ? "feliz" : fel >= FELICIDAD_BORDE.enojo ? "enojo" : "critico";

  el.wellbeingAvatar.classList.remove("avatar-border-feliz", "avatar-border-enojo", "avatar-border-critico", "avatar-border-enferma");
  el.wellbeingAvatar.classList.add(state.health.enferma ? "avatar-border-enferma" : "avatar-border-" + tier);

  const stage = el.wellbeingAvatarStage;
  stage.classList.remove("mood-feliz", "mood-normal", "mood-triste", "mood-critico");
  let mood = moodFromStats(state.stats);
  if (state.health.enferma) mood = "triste";
  stage.classList.add("mood-" + mood);
  stage.classList.toggle("sick", state.health.enferma);
}

function updateBondChip() {
  const { nivel, progreso } = bondLevel(state.bond.xp);
  const per = PET_CONFIG.bond.xpPorNivel;
  const current = Math.round(state.bond.xp % per);
  if (el.headerLevelText) el.headerLevelText.textContent = "Nivel " + nivel;
  if (el.headerXpText) el.headerXpText.textContent = `${current} / ${per} XP`;
  if (el.headerLevelFill) el.headerLevelFill.style.width = Math.round(progreso * 100) + "%";
}

function ensureDailyProgress() {
  if (!state) return;
  const today = localDateKey();
  if (!state.daily || state.daily.date !== today) {
    state.daily = defaultDailyProgress();
  }
  if (!state.economy) state.economy = { coins: 0 };
}

function updateDailyGoals() {
  if (!state) return;
  ensureDailyProgress();
  const goals = [
    ["feed", el.dailyFeed],
    ["play", el.dailyPlay],
    ["talk", el.dailyTalk],
  ];
  let done = 0;
  goals.forEach(([key, node]) => {
    const complete = !!state.daily[key];
    if (complete) done += 1;
    if (node) node.classList.toggle("is-done", complete);
  });
  if (el.dailyCount) el.dailyCount.textContent = `${done} / 3`;
  if (el.coinCount) el.coinCount.textContent = String(state.economy.coins || 0);
  // v3.2, pedido explícito: "que el texto de los objetivos se tachen...
  // y también el de recompensas" — cada objetivo ya se tachaba a medias
  // (li.is-done existía, pero con text-decoration:none, ver css/
  // style.css); acá se agrega el tachado de la recompensa una vez que ya
  // se cobró (state.daily.rewarded), con su propia clase para no
  // confundirla con "objetivo individual cumplido".
  if (el.dailyReward) el.dailyReward.classList.toggle("is-claimed", !!state.daily.rewarded);
}

function recordDailyGoal(key) {
  if (!state) return false;
  ensureDailyProgress();
  if (state.daily[key]) return false;
  state.daily[key] = true;
  const complete = state.daily.feed && state.daily.play && state.daily.talk;
  let rewardedNow = false;
  if (complete && !state.daily.rewarded) {
    state.daily.rewarded = true;
    state.economy.coins = (state.economy.coins || 0) + 50;
    addBond(100);
    rewardedNow = true;
  }
  trySave(state);
  updateDailyGoals();
  return rewardedNow;
}

function addBond(amount) {
  state.bond.xp = Math.max(0, state.bond.xp + amount);
}

// ---------- Estado de ánimo / expresión / mensaje único de prioridad ----------

/* v2.1: la escala vertical de los ojos dependía del "ánimo" general
 * (promedio de las 5 necesidades) — eso incluía un scaleY(0.72) para el
 * ánimo "feliz", que es el estado MÁS común del juego (mascota bien
 * cuidada), así que en la práctica los ojos casi siempre se veían más
 * achicados que en el creador (que nunca aplica --eye-scale, siempre
 * proporción 1). Corregido: ahora la escala sale directo de las causas
 * puntuales que sí ameritan una expresión intencional (cansancio real,
 * malestar) en vez de salir del ánimo general — despierta/sana/con
 * energía siempre es 1, igual que el creador, como pediste. */
function computeEyeScale(stats, health) {
  if (health.enferma) return 0.60; // malestar: ojos entrecerrados, expresión intencional pero acotada
  if (stats.energia < PET_CONFIG.energiaMuyCansadaUmbral) return 0.68; // muy cansada: ojos de sueño
  if (stats.energia < PET_CONFIG.energiaCansadaUmbral) return 0.85; // cansada: apenas entrecerrados
  return 1; // despierta, sana, con energía: proporción original del creador
}

const SICK_CAUSE_LABEL = {
  higiene: "la higiene muy baja por mucho tiempo",
  necesidades: "hambre o sed desatendidas por mucho tiempo",
  golosinas: "un exceso reciente de golosinas",
};

/** Un solo estado de prioridad a la vez: enferma > dormida > necesidad
 * crítica > felicidad crítica > muy cansada > necesidad baja > sucia >
 * todo bien (sin mensaje). La suciedad ahora se mira SÓLO en el lugar
 * actual (state.dirt[state.location], v2.1). */
function getPriorityStatus() {
  const s = state;
  const name = s.name;
  if (s.health.enferma) {
    const causa = SICK_CAUSE_LABEL[s.health.causa] || "algo que no le cayó bien";
    return { text: `${name} no se siente bien (posible causa: ${causa}). Dale su medicina y dejala descansar.`, cls: "status-enferma" };
  }
  if (s.sleep.dormida) {
    return { text: `${name} está durmiendo — tocá "Despertar" cuando quieras que se levante.`, cls: "status-dormida" };
  }
  const needs = [
    ["saciedad", s.stats.saciedad, "tiene mucha hambre"],
    ["hidratacion", s.stats.hidratacion, "tiene mucha sed"],
    ["higiene", s.stats.higiene, "está muy sucia"],
    ["energia", s.stats.energia, "está agotada"],
  ];
  const lowest = needs.reduce((a, b) => (b[1] < a[1] ? b : a));
  if (lowest[1] < PET_CONFIG.mood.critico) {
    return { text: `${name} ${lowest[2]}.`, cls: "status-critico" };
  }
  if (s.stats.felicidad < PET_CONFIG.mood.critico) {
    return { text: `${name} está muy triste, necesita mimos y compañía.`, cls: "status-critico" };
  }
  if (s.stats.energia < PET_CONFIG.energiaMuyCansadaUmbral) {
    return { text: `${name} está muy cansada, quizás sea hora de dormir.`, cls: "status-aviso" };
  }
  if (lowest[1] < PET_CONFIG.mood.normal) {
    return { text: `${name} ${lowest[2]}.`, cls: "status-aviso" };
  }
  if (s.dirt[s.location].length > 0) {
    return { text: `Hay algo para limpiar acá.`, cls: "status-aviso" };
  }
  if (s.stats.felicidad < PET_CONFIG.mood.normal) {
    return { text: `${name} está un poco aburrida.`, cls: "status-aviso" };
  }
  return null;
}

// v2.4: pedido explícito — "desactivar las notificaciones que aparecen
// cuando duerme o tiene una necesidad". Eso era este cartel visual
// (#status-line, calculado por getPriorityStatus): un solo mensaje de
// prioridad como "está durmiendo" o "tiene mucha hambre" que aparecía
// arriba del escenario. Se desactiva quedando siempre oculto — se deja la
// función en pie (en vez de sacarla del todo) por si en algún momento se
// pide reactivarla, así no hay que rearmar la lógica de prioridad.
function updateStatusLine() {
  el.statusLine.hidden = true;
  return;
  // eslint-disable-next-line no-unreachable
  const status = getPriorityStatus();
  if (!status) {
    el.statusLine.hidden = true;
    return;
  }
  el.statusLine.hidden = false;
  el.statusLine.textContent = status.text;
  el.statusLine.className = "status-line " + status.cls;
}

// v2.5: getMoodCaption() (el "estado breve" de #mood-caption) se sacó —
// pedido explícito: "el mood-caption que desaparezca, las necesidades se
// transmiten en frases que va diciendo la mascota" (ver maybeShowRequest/
// pickRequestCategory/PET_REQUEST_PHRASES más abajo, que ahora es el único
// canal para comunicar esos estados).

function updateMood() {
  const stage = el.gameStage;
  const wasUrgent = stage.classList.contains("mood-critico");
  stage.classList.remove("mood-feliz", "mood-normal", "mood-triste", "mood-critico");
  let mood = moodFromStats(state.stats);
  if (state.health.enferma) mood = "triste";
  stage.classList.add("mood-" + mood);
  stage.classList.toggle("sleeping", state.sleep.dormida);
  stage.classList.toggle("sick", state.health.enferma);
  // Respaldo para navegadores sin :has().
  el.walker.classList.toggle("is-sleeping", state.sleep.dormida);
  stage.style.setProperty("--eye-scale", state.sleep.dormida ? 0.04 : computeEyeScale(state.stats, state.health));
  stage.setAttribute("aria-label", `${state.name}, tu mascota: ${describeMoodForAria(mood)}`);
  if (mood === "critico" && !wasUrgent) {
    announce(`${state.name} necesita atención urgente.`);
  }
}

function describeMoodForAria(mood) {
  if (state.health.enferma) return "no se siente bien";
  if (state.sleep.dormida) return "durmiendo";
  return { feliz: "feliz", normal: "bien", triste: "triste", critico: "necesita atención urgente" }[mood];
}

const BLINK_INTERVAL_MS = 3000;
const BLINK_CLOSE_MS = 90;

function blinkStage(stageEl) {
  if (state && state.sleep.dormida && stageEl === el.gameStage) return; // ya están cerrados
  const eyes = stageEl.querySelectorAll(".ojo");
  if (!eyes.length) return;
  eyes.forEach((eye) => {
    eye.style.transform = "scaleY(0.04)";
  });
  setTimeout(() => {
    eyes.forEach((eye) => {
      eye.style.transform = "";
    });
  }, BLINK_CLOSE_MS);
}

function setupAutoBlink() {
  setInterval(() => {
    if (!el.game.hidden) blinkStage(el.gameStage);
    if (!el.onboarding.hidden) blinkStage(el.previewStage);
  }, BLINK_INTERVAL_MS);
}

// ---------- Reloj del encabezado + día/noche del Jardín (v2.2) ----------
// Pedido explícito: "agregarle un reloj al juego que sea igual a la hora
// local de la pc". Se lee directo de `new Date()` (hora/huso del sistema
// operativo del compañero, no una hora del servidor ni guardada en
// state), así que cada quien ve su propia hora local. La misma hora
// decide, de paso, si el Jardín se ve de día o de noche (sección del
// pedido de escenario) — un solo lugar de cálculo para las dos cosas.
const NIGHT_START_HOUR = 20; // 20:00
const NIGHT_END_HOUR = 7; // 07:00

function isNightNow(date) {
  const h = date.getHours();
  return h >= NIGHT_START_HOUR || h < NIGHT_END_HOUR;
}

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  if (el.headerClock) el.headerClock.innerHTML = `${iconSvg("reloj")}<span>${hh}:${mm}</span>`;
  const night = isNightNow(now);
  if (el.timeCardClock) el.timeCardClock.textContent = `${hh}:${mm}`;
  if (el.timeCardLabel) el.timeCardLabel.textContent = night ? "Noche" : (now.getHours() < 12 ? "Mañana" : "Tarde");
  if (el.timeCardIcon) el.timeCardIcon.textContent = night ? "☾" : "☀";
  if (el.stageFloor) el.stageFloor.classList.toggle("is-night", night);
}

function setupClock() {
  updateClock();
  setInterval(updateClock, 15000);
}

let wasDirtyPersonal = false;
function updateFlies() {
  if (!el.flies) return;
  const dirty = state.stats.higiene < PET_CONFIG.moscas.higieneUmbral;
  el.flies.classList.toggle("visible", dirty);
  if (dirty && !wasDirtyPersonal) announce(`${state.name} está sucia.`);
  wasDirtyPersonal = dirty;
}

// ---------- Manchas del entorno (independientes por lugar, v2.1) ----------

function renderDirt() {
  el.dirtLayer.removeAttribute("aria-hidden");
  el.dirtLayer.innerHTML = "";
  state.dirt[state.location].forEach((d) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dirt-item";
    btn.style.left = d.xPct + "%";
    btn.style.top = d.yPct + "%";
    btn.setAttribute("aria-label", "Retirar suciedad del escenario");
    btn.innerHTML = '<img src="assets/items/poop.svg" alt="" />';
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      removeDirt(d.id);
    });
    el.dirtLayer.appendChild(btn);
  });
}

function removeDirt(id) {
  const list = state.dirt[state.location];
  const idx = list.findIndex((d) => d.id === id);
  if (idx === -1) return;
  list.splice(idx, 1);
  state.stats.higiene = clamp(state.stats.higiene + PET_CONFIG.clean.higienePorRetiro, 0, 100);
  gainFelicidad(PET_CONFIG.clean.felicidadPorRetiro);
  registerInteraction();
  trySave(state);
  refreshUI();
  showBubble("¡Gracias por limpiar!");
}

// ---------- Refresco general ----------

function refreshUI() {
  el.petName.textContent = state.name;
  renderPetLayers(el.gameStage, state.look);
  updateMeters();
  updateWellbeingAvatar();
  updateBondChip();
  updateDailyGoals();
  refreshFeedMenuState();
  renderNotifications();
  if (el.navHome) el.navHome.classList.toggle("is-active", state.location === "casa");
  if (el.navGarden) el.navGarden.classList.toggle("is-active", state.location === "jardin");
  updateMood();
  updateStatusLine();
  updateFlies();
  renderDirt();
  updateWorldLighting();
  updateSleepToggle();
  updateActionsAvailability();
  el.gameStage.setAttribute("aria-disabled", String(Math.round(state.stats.felicidad) >= 100 || state.sleep.dormida));
}

function capturePetPosition() {
  if (!state || el.game.hidden) return;
  const floor = el.stageFloor.getBoundingClientRect(), pet = el.gameStage.getBoundingClientRect();
  if (floor.width && floor.height) state.petPosition = { xPct: clamp((pet.x + pet.width*.5 - floor.x) / floor.width*100,8,92), yPct: clamp((pet.y+pet.height*.83-floor.y)/floor.height*100,40,88) };
}
function tick() {
  if (!state) return;
  capturePetPosition();
  const beforeDirt = state.dirt[state.location].length;
  const info = applyDecay(state);
  if (state.dirt[state.location].length > beforeDirt) {
    el.gameStage.classList.add("is-pooping");
    setTimeout(() => el.gameStage.classList.remove("is-pooping"), 1000);
    notifySystem(`${state.name} hizo caca. Limpiá el piso para cuidar su bienestar.`);
  }
  trySave(state);
  refreshUI();
  updateCooldownButtons();
  maybeShowRequest();
  return info;
}

function startGame() {
  setLocationVisuals(state.location);
  const info = applyDecay(state);
  trySave(state);
  refreshUI();
  updateCooldownButtons();
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(tick, PET_CONFIG.tickIntervalMs);
  if (cooldownTimer) clearInterval(cooldownTimer);
  cooldownTimer = setInterval(updateCooldownButtons, 1000);
  if (requestsTimer) clearInterval(requestsTimer);
  requestsTimer = setInterval(maybeShowRequest, PET_CONFIG.requests.checkIntervalMs);
  computeWalkBounds();
  maybeGreet(info);
}

// ---------- Animación de boca (v2.3, pedido explícito) ----------
// Sólo se dispara desde acciones puntuales (Comer/Beber/Hablar/Acariciar,
// esta última como reacción de alegría) — nunca queda en bucle permanente
// ni se inventó ninguna acción nueva para lucirla. Cada clase mueve
// #boca-anim, un grupo NUEVO adentro de #boca-shape que envuelve el path
// de la boca (ver js/manifest.js): el ánimo (mood-*) sigue rotando/
// escalando #boca-shape como siempre, y esta animación sólo escala
// #boca-anim por dentro de eso — se combinan solas sin pisarse, así que la
// boca abre/cierra respetando el mismo pivote y la expresión de ánimo
// actual. Al terminar (por tiempo o por una acción nueva que la
// interrumpe) se saca la clase y el elemento vuelve solo al estado normal
// de esa boca + ánimo, sin nada que restablecer a mano.
const MOUTH_ANIM_CLASSES = ["mouth-anim-comer", "mouth-anim-beber", "mouth-anim-hablar", "mouth-anim-feliz"];
function playMouthAnim(stageEl, name, durationMs) {
  if (!stageEl) return;
  const cls = "mouth-anim-" + name;
  stageEl.classList.remove(...MOUTH_ANIM_CLASSES);
  // Fuerza reflow para poder re-disparar la misma animación si se pide de
  // nuevo antes de que termine la anterior (si no, el navegador la ve
  // "igual que ya estaba" y no la reinicia).
  void stageEl.offsetWidth;
  stageEl.classList.add(cls);
  clearTimeout(stageEl._mouthAnimTimer);
  stageEl._mouthAnimTimer = setTimeout(() => {
    stageEl.classList.remove(cls);
  }, durationMs);
}
function stopMouthAnim(stageEl) {
  if (!stageEl) return;
  clearTimeout(stageEl._mouthAnimTimer);
  stageEl.classList.remove(...MOUTH_ANIM_CLASSES);
}

// ---------- Globo de diálogo (Hablar / pedidos / saludo / reacciones) ----------

// v2.6: pedido explícito — el globo aparece con fade in (ya lo hacía,
// @keyframes bubble-in en css/style.css, se re-dispara solo cada vez que
// deja de estar "hidden") y ahora además DESAPARECE con un fade out
// flotando hacia arriba desde la cabeza, en vez de cortarse en seco con
// hidden=true. BUBBLE_FADE_OUT_MS tiene que coincidir con la duración de
// @keyframes bubble-out en el CSS — se espera a que termine esa animación
// (con la clase "speech-bubble-hide" puesta) recién ahí se oculta de
// verdad, para no cortar la animación a mitad de camino.
const BUBBLE_FADE_OUT_MS = 420;
let bubbleHideTimer = null;
let bubbleRemoveTimer = null;
function showBubble(text, ms) {
  if (state?.sleep.dormida) return;
  if (!el.speechBubble) return;
  clearTimeout(bubbleHideTimer);
  clearTimeout(bubbleRemoveTimer);
  el.speechBubble.textContent = text;
  el.speechBubble.classList.remove("speech-bubble-hide");
  el.speechBubble.hidden = false;
  // Fuerza reflow: si el globo ya estaba visible (una frase interrumpe a
  // otra), esto asegura que la animación de entrada se re-dispare desde
  // cero en vez de "no notarse" por ya estar en su estado final.
  void el.speechBubble.offsetWidth;
  bubbleHideTimer = setTimeout(() => {
    el.speechBubble.classList.add("speech-bubble-hide");
    // Con movimiento reducido el CSS apaga la animación del todo (ver la
    // lista de prefers-reduced-motion más arriba en el archivo) — no tiene
    // sentido esperar la duración completa de un fade que no se ve.
    bubbleRemoveTimer = setTimeout(() => {
      el.speechBubble.hidden = true;
      el.speechBubble.classList.remove("speech-bubble-hide");
    }, prefersReducedMotion() ? 0 : BUBBLE_FADE_OUT_MS);
  }, ms || 2600);
}

function maybeGreet(info) {
  if (info && info.extraño) {
    const phrase = PET_GREETING_PHRASES[Math.floor(Math.random() * PET_GREETING_PHRASES.length)];
    showBubble(phrase, 4000);
    announce(phrase);
  }
}

/* v2.5: umbrales de felicidad que definen el color del borde del
 * avatar de bienestar (pedido explícito: >50% verde/"feliz", 25%-50%
 * amarillo/"enojo", <25% rojo/"triste") — se reutilizan acá para elegir
 * qué categoría de frase espontánea decir, así ambas cosas (borde y
 * frase) cuentan la misma historia. */
const FELICIDAD_BORDE = { feliz: 50, enojo: 25 };

/** v3.2, pedido explícito: "que cueste subir el ánimo si estas [las
 * demás necesidades] siguen bajas" — centraliza acá TODA ganancia de
 * ánimo (jugar, acariciar, hablar, comer, limpiar una mancha, medicina)
 * en vez de tocar cada punto por separado; el multiplicador real sale de
 * moodCouplingFactors() en js/state.js (mismo mecanismo que acelera el
 * decaimiento en applyDecay). */
function gainFelicidad(amount) {
  if (!amount) return;
  const { gainMult } = moodCouplingFactors(state.stats);
  state.stats.felicidad = clamp(state.stats.felicidad + amount * gainMult, 0, 100);
}

/** Urgencia 0-100 de una necesidad, sólo si ya cruzó el umbral de "empezar
 * a mencionarla" (si no lo cruzó, null = no hay nada que decir de ella).
 * 0 = recién cruzó el umbral (casi no dice nada), 100 = en el fondo (lo
 * repite seguido) — ver PET_CONFIG.requests para cómo se usa. */
function statUrgency(value, umbral) {
  if (value >= umbral) return null;
  return clamp(((umbral - value) / umbral) * 100, 0, 100);
}

/** Elige, entre todas las necesidades/estados que ameriten decir algo en
 * este momento, el más urgente (un solo mensaje a la vez, mismo criterio
 * que ya usaba getPriorityStatus para el cartel visual — sólo que ahora
 * ESTA es la única forma de enterarse, ver nota en PET_REQUEST_PHRASES).
 * Devuelve { categoria, urgencia } o null si no hay nada que decir. */
function pickRequestCategory() {
  const s = state.stats;
  const candidatos = [];
  if (state.health.enferma) candidatos.push({ categoria: "enferma", urgencia: PET_CONFIG.requests.urgenciaEnferma });
  const hambre = statUrgency(s.saciedad, PET_CONFIG.mood.normal);
  if (hambre !== null) candidatos.push({ categoria: "hambre", urgencia: hambre });
  const sed = statUrgency(s.hidratacion, PET_CONFIG.mood.normal);
  if (sed !== null) candidatos.push({ categoria: "sed", urgencia: sed });
  const higiene = statUrgency(s.higiene, PET_CONFIG.moscas.higieneUmbral);
  if (higiene !== null) candidatos.push({ categoria: "higiene", urgencia: higiene });
  const sueño = statUrgency(s.energia, PET_CONFIG.energiaCansadaUmbral);
  if (sueño !== null) candidatos.push({ categoria: "sueño", urgencia: sueño });

  if (s.felicidad < FELICIDAD_BORDE.enojo) {
    candidatos.push({ categoria: "triste", urgencia: statUrgency(s.felicidad, FELICIDAD_BORDE.enojo) ?? 100 });
  } else if (s.felicidad < FELICIDAD_BORDE.feliz) {
    // Tono más liviano — alterna entre "enojo" y los pedidos de siempre
    // (jugar/mimo), todos válidos para esta franja de felicidad.
    const liviana = ["enojo", "jugar", "mimo"];
    candidatos.push({
      categoria: liviana[Math.floor(Math.random() * liviana.length)],
      urgencia: statUrgency(s.felicidad, FELICIDAD_BORDE.feliz) ?? 0,
    });
  }

  if (!candidatos.length) return null;
  return candidatos.reduce((a, b) => (b.urgencia > a.urgencia ? b : a));
}

/** Pedido espontáneo — v2.5: ahora es el único canal para enterarse de
 * una necesidad floja (el cartel visual #status-line se desactivó en
 * v2.4), así que ya no se calla sólo porque haya "algo más urgente": al
 * contrario, cuanto más urgente, más seguido lo repite (probabilidad y
 * espacio mínimo entre pedidos interpolan entre los pares mild/urgente de
 * PET_CONFIG.requests según la urgencia elegida). Sigue en silencio
 * mientras duerme (no tiene sentido que hable dormida). */
function maybeShowRequest() {
  if (!state || el.game.hidden || state.sleep.dormida) return;
  const cfg = PET_CONFIG.requests;
  const now = Date.now();

  const pick = pickRequestCategory();
  if (!pick) {
    // Nada urgente que decir — de vez en cuando, si está muy feliz, un
    // comentario positivo (no escala por urgencia, es sólo refuerzo).
    if (state.stats.felicidad > FELICIDAD_BORDE.feliz && now - state.lastRequestAt >= cfg.minGapMs && Math.random() < cfg.probabilidadPorChequeo) {
      const opciones = PET_REQUEST_PHRASES.feliz;
      showBubble(opciones[Math.floor(Math.random() * opciones.length)], cfg.burbujaVisibleMs);
      state.lastRequestAt = now;
      trySave(state);
    }
    return;
  }

  const t = pick.urgencia / 100;
  const minGap = cfg.minGapMs + (cfg.minGapMsUrgente - cfg.minGapMs) * t;
  const probabilidad = cfg.probabilidadPorChequeo + (cfg.probabilidadPorChequeoUrgente - cfg.probabilidadPorChequeo) * t;

  if (now - state.lastRequestAt < minGap) return;
  if (Math.random() >= probabilidad) return;

  const opciones = PET_REQUEST_PHRASES[pick.categoria];
  const frase = opciones[Math.floor(Math.random() * opciones.length)];
  showBubble(frase, cfg.burbujaVisibleMs);
  state.lastRequestAt = now;
  trySave(state);
}

// ---------- Cooldowns / disponibilidad de acciones ----------

function isOnCooldown(key) {
  const until = (state.cooldowns && state.cooldowns[key]) || 0;
  return Date.now() < until;
}

function startCooldown(key) {
  state.cooldowns[key] = Date.now() + (PET_CONFIG.cooldownsMs[key] || PET_CONFIG.cooldownMs);
}

// Registro de botones de acción con cooldown (se llena en buildActionsDock).
const actionRegistry = {};

function updateCooldownButtons() {
  if (!state) return;
  Object.keys(actionRegistry).forEach((key) => {
    const { btnEl, ringEl, labelEl, isFull } = actionRegistry[key];
    const until = (state.cooldowns && state.cooldowns[key]) || 0;
    const remainingMs = until - Date.now();
    // v2.4: el tile "dormir" es ahora el mismo botón que "Despertar"
    // (toggle, ver updateSleepToggle) — antes esta condición comparaba
    // contra la clave "despertar", que nunca existía como key real, así
    // que el tile de dormir quedaba deshabilitado mientras dormía y hacía
    // falta un botón aparte para poder despertar. Ahora se excluye "dormir"
    // en sí: todo lo demás se bloquea mientras duerme, el toggle no.
    const blockedByState = state.sleep.dormida && key !== "dormir";
    if (key === "hablar" || key === "jugar") { btnEl.disabled = false; if (labelEl) labelEl.textContent = ""; return; }
    if (remainingMs > 0) {
      btnEl.disabled = true;
      const total = PET_CONFIG.cooldownsMs[key] || PET_CONFIG.cooldownMs;
      const pct = clamp(((total - remainingMs) / total) * 100, 0, 100);
      if (ringEl) ringEl.style.setProperty("--pct", pct.toFixed(1));
      if (ringEl) ringEl.style.setProperty("--pct-css", pct.toFixed(1) + "%");
      if (labelEl) labelEl.textContent = `${Math.ceil(remainingMs / 1000)}s`;
    } else {
      btnEl.disabled = blockedByState || (isFull ? isFull() : false);
      if (ringEl) ringEl.style.setProperty("--pct", 0);
      if (ringEl) ringEl.style.setProperty("--pct-css", "0%");
      if (labelEl) labelEl.textContent = "";
    }
  });
  updateActionsAvailability();
  if (!el.feedMenu.hidden) refreshFeedMenuState();
}

/** Cosas que no dependen de cooldown: mostrar/ocultar el botón de
 * Medicina (sólo si está enferma) y el tooltip de Jugar. */
function updateActionsAvailability() {
  const medicinaWrap = document.getElementById("action-wrap-medicina");
  if (medicinaWrap) medicinaWrap.hidden = !state.health.enferma;
  const jugarWrap = document.getElementById("action-wrap-jugar");
  if (jugarWrap) jugarWrap.title = state.stats.energia < PET_CONFIG.play.energiaMinimaParaJugar ? "Está muy cansada para jugar" : "";
  const attention = {
    comer: state.stats.saciedad < PET_CONFIG.mood.normal,
    beber: state.stats.hidratacion < PET_CONFIG.mood.normal,
    bañar: state.stats.higiene < PET_CONFIG.mood.normal,
    dormir: state.stats.energia < PET_CONFIG.mood.normal,
    jugar: state.stats.felicidad < PET_CONFIG.mood.normal,
    hablar: state.stats.felicidad < PET_CONFIG.mood.normal,
  };
  Object.entries(attention).forEach(([key, on]) => {
    document.getElementById("action-wrap-" + key)?.classList.toggle("needs-attention", !!on);
  });
}

// ---------- Construcción del dock de acciones ----------

function createActionButton({ key, icon, label, id, visualClass }) {
  const wrap = document.createElement("div");
  wrap.className = "action-circle-wrap";
  wrap.id = "action-wrap-" + key;
  const ring = document.createElement("div");
  ring.className = "cooldown-ring";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "action-circle action-circle-" + (visualClass || key);
  btn.id = id;
  btn.setAttribute("aria-label", label);
  btn.title = label;
  btn.innerHTML = iconSvg(icon);
  ring.appendChild(btn);
  wrap.appendChild(ring);
  const caption = document.createElement("span");
  caption.className = "action-circle-caption";
  caption.textContent = label;
  wrap.appendChild(caption);
  const cd = document.createElement("span");
  cd.className = "cooldown-label";
  cd.setAttribute("aria-hidden", "true");
  wrap.appendChild(cd);
  return { wrap, ring, btn, cd, caption };
}

function buildActionsDock() {
  el.actionsDock.innerHTML = "";

  // Orden pedido (sección 6): Alimentar, Beber, Limpiar, Dormir, Jugar,
  // Hablar. Medicina queda condicional (sólo visible si está enferma) al
  // final, "en un lugar claro" pero sin ocupar espacio de siempre.
  // "Limpiar" reutiliza la acción de bañar (misma key/cooldown de
  // siempre, PET_CONFIG.cooldownsMs.bañar) — sólo cambian el ícono/label
  // visibles. v2.2: "Afecto" (menú Acariciar+Hablar) se separó — Acariciar
  // ahora es un click directo sobre el personaje (ver doAcariciar/
  // setupPetClick) y Hablar quedó como una acción normal del dock, con su
  // propio cooldown, igual que Beber/Bañar.
  const defs = [
    { key: "comer", icon: "comer", label: "Alimentar", handler: toggleFeedMenu, noCooldown: true },
    { key: "beber", icon: "beber", label: "Beber", handler: doBeber, isFull: () => state.stats.hidratacion >= PET_CONFIG.llenaUmbral },
    { key: "bañar", icon: "limpiar", label: "Limpiar", visualClass: "limpiar", handler: doBañar, isFull: () => state.stats.higiene >= PET_CONFIG.llenaUmbral },
    { key: "dormir", icon: "dormir", label: "Dormir", handler: toggleSueño, noCooldown: true },
    { key: "jugar", icon: "jugar", label: "Jugar", handler: doJugar },
    { key: "hablar", icon: "hablar", label: "Hablar", visualClass: "afecto", handler: doHablar },
    { key: "medicina", icon: "medicina", label: "Medicina", handler: doMedicina },
  ];

  defs.forEach((def) => {
    const { wrap, ring, btn, cd, caption } = createActionButton({ key: def.key, icon: def.icon, label: def.label, id: "btn-" + def.key, visualClass: def.visualClass });
    btn.addEventListener("click", def.handler);
    el.actionsDock.appendChild(wrap);
    if (!def.noCooldown) {
      actionRegistry[def.key] = { btnEl: btn, ringEl: ring, labelEl: cd, captionEl: caption, isFull: def.isFull };
    } else {
      actionRegistry[def.key] = { btnEl: btn, ringEl: null, labelEl: null, captionEl: caption, isFull: def.isFull };
    }
  });
  document.getElementById("action-wrap-medicina").hidden = true;
  // El tile de "dormir" arranca mostrando su ícono/etiqueta correctos
  // (refreshUI() lo vuelve a ajustar en cada refresco, ver
  // updateSleepToggle() más abajo).
  updateSleepToggle();
}

/** v2.4: pedido explícito — "el botón de despertar debería ser el mismo
 * que dormir, sólo que alternar". Antes había un botón de Despertar aparte
 * (#btn-despertar/.wake-btn) que aparecía sólo mientras dormía, y el tile
 * de "Dormir" del dock quedaba deshabilitado (sin uso real) en ese
 * momento. Ahora es un solo tile: mismo handler de siempre (toggleSueño),
 * sólo cambia ícono/etiqueta según el estado. */
function updateSleepToggle() {
  const reg = actionRegistry.dormir;
  if (!reg || !state) return;
  const dormida = state.sleep.dormida;
  reg.btnEl.innerHTML = iconSvg(dormida ? "despertar" : "dormir");
  const label = dormida ? "Despertar" : "Dormir";
  reg.btnEl.setAttribute("aria-label", label);
  reg.btnEl.title = label;
  if (reg.captionEl) reg.captionEl.textContent = label;
}

// ---------- Alimentar: menú con 3 opciones ----------

const FOOD_DESCRIPTIONS = {
  pescado: "Recupera 30 de hambre y 6 de energía. Consumís 1 pescado.",
  snack: "Recuperación moderada + un poco de ánimo.",
  golosina: "La que más le gusta, pero en exceso puede caerle mal.",
};

function buildFeedMenu() {
  el.feedMenu.innerHTML = "";
  Object.keys(PET_CONFIG.feeding).forEach((key) => {
    const food = PET_CONFIG.feeding[key];
    const item = document.createElement("button");
    item.type = "button";
    item.className = "feed-item";
    item.id = "feed-item-" + key;
    item.setAttribute("role", "menuitem");
    item.innerHTML = `<span class="feed-item-icon"><img src="assets/items/fish.svg" alt="" /></span><span>${food.label} <strong id="fish-quantity">×0</strong></span><span class="feed-item-desc">${FOOD_DESCRIPTIONS[key] || ""}</span>`;
    item.addEventListener("click", () => doComer(key));
    el.feedMenu.appendChild(item);
  });
  const note = document.createElement("p");
  note.className = "feed-menu-note";
  note.id = "food-stock";
  note.textContent = "";
  el.feedMenu.appendChild(note);
  // v3.2, pedido explícito: se saca el botón "Conseguí más pescado"
  // (#feed-go-fishing) — cuando no queda stock, la sugerencia de ir a
  // pescar pasa a ser sólo texto DENTRO de #food-stock (ver
  // refreshFeedMenuState), no clickeable.
}

function toggleFeedMenu() {
  const wasHidden = el.feedMenu.hidden;
  closeAllMenus();
  el.feedMenu.hidden = !wasHidden;
  if (!el.feedMenu.hidden) refreshFeedMenuState();
}

function refreshFeedMenuState() {
  if (!state) return;
  document.getElementById("fish-quantity").textContent = `×${state.inventory.pescado}`;
  // v3.2, pedido explícito: "No quedan pescados" -> "No te queda más
  // comida", y agrega (sólo texto, sin el botón de antes) la sugerencia
  // de ir a pescar cuando no hay stock.
  document.getElementById("food-stock").textContent = state.inventory.pescado === 0 ? `No te queda más comida. Jugá con ${state.name} para conseguir más comida.` : state.stats.saciedad >= PET_CONFIG.llenaUmbral ? `${state.name} no tiene hambre.` : state.sleep.dormida ? `${state.name} está durmiendo.` : isOnCooldown("pescado") ? `Podés volver a alimentar en ${Math.ceil((state.cooldowns.pescado-Date.now())/1000)} s.` : "Elegí el pescado para alimentar.";
  Object.keys(PET_CONFIG.feeding).forEach((key) => {
    const item = document.getElementById("feed-item-" + key);
    if (!item) return;
    item.disabled = !state.inventory[key] || isOnCooldown(key) || state.stats.saciedad >= PET_CONFIG.llenaUmbral || state.sleep.dormida;
  });
}

function pruneGolosinaLog(now) {
  const windowMs = PET_CONFIG.golosinaExceso.windowMs;
  state.golosinaLog = state.golosinaLog.filter((t) => now - t < windowMs);
}

function doComer(key) {
  if (state.sleep.dormida || isOnCooldown(key)) return;
  const food = PET_CONFIG.feeding[key];
  if (!food) return;
  if (!state.inventory[key]) { notifySystem(`No te queda más comida. Jugá con ${state.name} para conseguir más comida.`); refreshFeedMenuState(); return; }
  if (state.stats.saciedad >= PET_CONFIG.llenaUmbral) {
    notifySystem(`${state.name} ya no tiene hambre.`);
    return;
  }
  registerInteraction();
  state.inventory[key] -= 1;
  const lastMeal = state.digestion.pending.at(-1) || 0;
  state.digestion.pending.push(Math.max(Date.now() + 120000, lastMeal + 60000));
  playMouthAnim(el.gameStage, "comer", 900);
  if (food.saciedad) state.stats.saciedad = clamp(state.stats.saciedad + food.saciedad, 0, 100);
  if (food.energia) state.stats.energia = clamp(state.stats.energia + food.energia, 0, 100);
  if (food.felicidad) gainFelicidad(food.felicidad);
  addBond(2);
  startCooldown(key);

  if (key === "golosina") {
    const now = Date.now();
    state.golosinaLog.push(now);
    pruneGolosinaLog(now);
    const count = state.golosinaLog.length;
    const cfg = PET_CONFIG.golosinaExceso;
    if (count === cfg.avisoEn) {
      notifySystem("Con tantas golosinas seguidas capaz que le cae mal...", 3400);
    } else if (count === cfg.malestarEn) {
      state.health.malestar = clamp(state.health.malestar + PET_CONFIG.health.golosinaExcesoGolpe, 0, 100);
      if (!state.health.enferma && state.health.malestar >= 100) {
        state.health.enferma = true;
        state.health.causa = "golosinas";
      }
      notifySystem("Comió demasiadas golosinas seguidas y le cayó mal.", 3400);
    } else {
      showBubble("¡Ñam! Me encantó.");
    }
  } else {
    showBubble(key === "comidaBasica" ? "¡Qué rico!" : "Mmm, gracias.");
  }

  const dailyReward = recordDailyGoal("feed");
  trySave(state);
  refreshUI();
  updateCooldownButtons();
  refreshFeedMenuState();
  if (dailyReward) notifySystem("¡Objetivos del día completos! +50 monedas +100 XP", 3800);
}

// ---------- Beber / Limpiar (bañar) ----------

function doBeber() {
  if (state.sleep.dormida || isOnCooldown("beber")) return;
  if (state.stats.hidratacion >= PET_CONFIG.llenaUmbral) {
    notifySystem(`${state.name} ya no tiene sed.`);
    return;
  }
  registerInteraction();
  playMouthAnim(el.gameStage, "beber", 550);
  state.stats.hidratacion = clamp(state.stats.hidratacion + PET_CONFIG.actionGain.beber.hidratacion, 0, 100);
  addBond(2);
  startCooldown("beber");
  trySave(state);
  refreshUI();
  updateCooldownButtons();
  showBubble("¡Glup, glup! Gracias.");
}

function doBañar() {
  if (state.sleep.dormida || isOnCooldown("bañar")) return;
  if (state.stats.higiene >= PET_CONFIG.llenaUmbral) {
    notifySystem(`${state.name} ya está limpita.`);
    return;
  }
  registerInteraction();
  state.stats.higiene = clamp(state.stats.higiene + PET_CONFIG.actionGain.bañar.higiene, 0, 100);
  addBond(3);
  startCooldown("bañar");
  trySave(state);
  refreshUI();
  updateCooldownButtons();
  // Secuencia breve de agua/burbujas.
  el.bathFx.classList.add("bathing");
  setTimeout(() => el.bathFx.classList.remove("bathing"), 1300);
  showBubble("¡Qué bien me siento!");
}

// ---------- Jugar / minijuegos ----------

let minigame = null;
let minigameInterval = null;
let minigameSpawnTimer = null;

const MINIGAMES = [
  { id: "pesca", title: "Pesca", instructions: "Esperá a que pique y tocá ¡Tirar! Cada captura suma un pescado al terminar. Hasta 3 por partida.", symbol: "🎣", duration: 20, goal: 3, targetLife: 0 },
  {
    id: "pelota",
    title: "Pelota traviesa",
    instructions: "Atrapá la pelota 6 veces antes de que termine el tiempo.",
    symbol: "●",
    duration: 15,
    goal: 6,
    targetLife: 0,
  },
  {
    id: "luciernagas",
    title: "Caza de luciérnagas",
    instructions: "Tocá todas las luces que puedas. Cada una desaparece rápido.",
    symbol: "✦",
    duration: 12,
    goal: 8,
    targetLife: 1150,
  },
];

function clearMinigameTimers() {
  if (minigameInterval) clearInterval(minigameInterval);
  if (minigameSpawnTimer) clearTimeout(minigameSpawnTimer);
  minigameInterval = null;
  minigameSpawnTimer = null;
}

function positionMinigameTarget() {
  if (!minigame || !el.minigameArena || !el.minigameTarget || minigame.type.id === "pesca") return;
  const rect = el.minigameArena.getBoundingClientRect();
  const size = minigame.type.id === "luciernagas" ? 54 : 68;
  const x = 10 + Math.random() * Math.max(8, rect.width - size - 20);
  const y = 10 + Math.random() * Math.max(8, rect.height - size - 20);
  el.minigameTarget.style.left = x + "px";
  el.minigameTarget.style.top = y + "px";
  el.minigameTarget.textContent = minigame.type.symbol;
  el.minigameTarget.setAttribute("aria-label", "Atrapar " + minigame.type.title);
  el.minigameTarget.dataset.game = minigame.type.id;
  el.minigameTarget.classList.remove("target-pop");
  void el.minigameTarget.offsetWidth;
  el.minigameTarget.classList.add("target-pop");
  if (minigame.type.targetLife) {
    clearTimeout(minigameSpawnTimer);
    minigameSpawnTimer = setTimeout(() => {
      if (!minigame) return;
      positionMinigameTarget();
    }, minigame.type.targetLife);
  }
}

function updateMinigameHUD() {
  if (!minigame) return;
  el.minigameScore.textContent = `${minigame.score} ${minigame.type.id === "pesca" ? "🐟" : "pts"}`;
  el.minigameTime.textContent = `${Math.max(0, minigame.remaining)}s`;
}

function finishMinigame(cancelled = false) {
  if (!minigame) return;
  const finished = minigame;
  clearMinigameTimers();
  minigame = null;
  el.minigamePanel.hidden = true;
  el.minigameTarget.classList.remove("target-pop");
  document.getElementById("btn-jugar").focus();
  if (cancelled) {
    notifySystem("Minijuego cancelado.", 2200);
    return;
  }

  const success = finished.score >= finished.type.goal;
  const fishCaught = finished.type.id === "pesca" ? finished.score : 0;
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
  const dailyReward = (success || fishCaught > 0) ? recordDailyGoal("play") : false;
  trySave(state);
  refreshUI();
  updateCooldownButtons();
  playMouthAnim(el.gameStage, success ? "feliz" : "hablar", 900);
  refreshFeedMenuState();
  notifySystem(
    finished.type.id === "pesca" ? `¡Pesca terminada! +${fishCaught} pescado(s). Stock: ${state.inventory.pescado}${dailyReward ? " · ¡Objetivos completos! +50 monedas +100 XP" : ""}` : dailyReward
      ? `¡Objetivos completos! +50 monedas +100 XP`
      : success
        ? `¡Ganamos! +${coins} monedas`
        : `¡Buen intento! Sumamos ${coins} monedas.`,
    3200
  );
}

function launchMinigame(type) {
  clearMinigameTimers();
  closeAllMenus();
  startIdle(15000, 16000);
  document.getElementById("game-selector").hidden = true;
  minigame = { type, score: 0, remaining: type.duration };
  el.minigameArena.dataset.game = type.id;
  el.minigameArena.dataset.phase = "waiting";
  delete el.minigameTarget.dataset.phase;
  el.minigameTitle.textContent = type.title;
  el.minigameInstructions.textContent = type.instructions;
  el.minigamePanel.hidden = false;
  updateMinigameHUD();
  positionMinigameTarget();
  if (type.id === "pesca") scheduleFishingCast();
  el.minigameTarget.focus();
  minigameInterval = setInterval(() => {
    if (!minigame) return;
    minigame.remaining -= 1;
    updateMinigameHUD();
    if (minigame.remaining <= 0) finishMinigame(false);
  }, 1000);
}

function setupMinigames() {
  if (!el.minigameTarget) return;
  el.minigameTarget.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (!minigame) return;
    if (minigame.type.id === "pesca") {
      if (minigame.phase !== "bite") { el.minigameInstructions.textContent = "Todavía no picó. Esperá la señal ¡Tirar!"; return; }
      minigame.phase = "caught";
      const jump=document.createElement("img"); jump.src="assets/items/fish.svg";jump.alt="";jump.className="caught-fish";el.minigameArena.appendChild(jump);setTimeout(()=>jump.remove(),1000);
      clearTimeout(minigameSpawnTimer);
    }
    minigame.score += 1;
    updateMinigameHUD();
    popHearts();
    if (minigame.type.id !== "luciernagas" && minigame.score >= minigame.type.goal) {
      finishMinigame(false);
      return;
    }
    if (minigame.type.id === "pesca") scheduleFishingCast();
    else positionMinigameTarget();
  });
  if (el.minigameClose) el.minigameClose.addEventListener("click", () => finishMinigame(true));
}

function scheduleFishingCast() {
  if (!minigame || minigame.type.id !== "pesca") return;
  clearTimeout(minigameSpawnTimer);
  minigame.phase = "waiting";
  el.minigameArena.dataset.phase="waiting";
  el.minigameTarget.dataset.game = "pesca";
  el.minigameTarget.dataset.phase = "waiting";
  el.minigameTarget.textContent = "🎣 Esperando…";
  el.minigameTarget.setAttribute("aria-label", "Esperando que pique");
  el.minigameInstructions.textContent = "Esperá la señal. Tocá ¡Tirar! cuando pique.";
  minigameSpawnTimer = setTimeout(() => {
    if (!minigame) return;
    minigame.phase = "bite";
    el.minigameArena.dataset.phase="bite";
    el.minigameInstructions.textContent = "¡Picó! Tocá ¡Tirar! antes de que se escape.";
    el.minigameTarget.dataset.phase = "bite";
    el.minigameTarget.textContent = "🐟 ¡Tirar!";
    el.minigameTarget.setAttribute("aria-label", "¡Tirar!");
    minigameSpawnTimer = setTimeout(scheduleFishingCast, 1600);
  }, 900 + Math.random() * 1300);
}

let selectedMinigame = "pesca";
function openGameSelector(selected = null) {
  if (minigame || navLock) return;
  closeAllMenus();
  selectedMinigame = selected || selectedMinigame;
  const panel = document.getElementById("game-selector");
  panel.hidden = false;
  panel.querySelectorAll(".game-choice").forEach(card => { card.classList.toggle("is-open", card.dataset.game === selected); card.querySelector(".game-title").setAttribute("aria-expanded", String(card.dataset.game === selected)); });
  document.getElementById("game-selector-note").textContent = "Elegí un minijuego y pulsá Play para empezar.";
  panel.setAttribute("tabindex","-1");
  panel.focus();
  if(selected) panel.querySelector(`[data-game="${selected}"]`).scrollIntoView({block:"nearest",inline:"center"});
}
function closeGameSelector() {
  document.getElementById("game-selector").hidden = true;
  document.getElementById("btn-jugar").focus();
}
function setupGameSelector() {
  const panel = document.getElementById("game-selector");
  document.getElementById("game-choices").innerHTML = MINIGAMES.map(game => `<article class="game-choice" data-game="${game.id}"><div class="game-art">${game.id === "pesca" ? '<img src="assets/items/fish.svg" alt="" />' : '<span>'+game.symbol+'</span>'}</div><div class="game-details" id="details-${game.id}"><p>${game.instructions}</p><button type="button" class="card-play" data-play="${game.id}">▶ Play</button></div><button type="button" class="game-title" aria-expanded="false" aria-controls="details-${game.id}">${game.title}</button></article>`).join("");
  panel.querySelectorAll(".game-title").forEach(btn => btn.addEventListener("click", () => {
    const card=btn.closest(".game-choice"); const open=!card.classList.contains("is-open");
    panel.querySelectorAll(".game-choice").forEach(c=>{c.classList.remove("is-open");c.querySelector(".game-title").setAttribute("aria-expanded","false")});
    card.classList.toggle("is-open",open); btn.setAttribute("aria-expanded",String(open)); selectedMinigame=card.dataset.game;
  }));
  panel.querySelectorAll(".card-play").forEach(btn => btn.addEventListener("click", () => {selectedMinigame=btn.dataset.play;document.getElementById("game-play").click()}));
  document.getElementById("game-selector-close").addEventListener("click", closeGameSelector);
  document.getElementById("game-play").addEventListener("click", () => {
    const note = document.getElementById("game-selector-note");
    if (state.sleep.dormida) { note.textContent = "Despertá a tu mascota para jugar."; return; }
    if (state.health.enferma) { note.textContent = "Tu mascota necesita curarse antes de jugar."; return; }
    if (state.stats.energia < PET_CONFIG.play.energiaMinimaParaJugar) { note.textContent = "Necesita descansar: no tiene suficiente energía."; return; }
    // v3.2, pedido explícito: la Pesca tiene su PROPIO cooldown ("pesca",
    // 15min más largo — ver cooldownsMs.pesca en js/config.js), separado
    // del cooldown genérico "jugar" que siguen usando Pelota/Luciérnagas.
    const cooldownKey = selectedMinigame === "pesca" ? "pesca" : "jugar";
    if (isOnCooldown(cooldownKey)) { note.textContent = `Podés jugar de nuevo en ${Math.ceil((state.cooldowns[cooldownKey]-Date.now())/1000)} s.`; return; }
    registerInteraction(); startCooldown(cooldownKey); updateCooldownButtons();
    launchMinigame(MINIGAMES.find(game => game.id === selectedMinigame));
  });
}
function doJugar() { openGameSelector(); }

// ---------- Dormir / despertar ----------

function toggleSueño() {
  if (navLock) return;
  registerInteraction();
  if (state.sleep.dormida) {
    state.sleep.dormida = false;
    state.sleep.since = null;
    showBubble("¡Buenos días!");
  } else {
    state.sleep.dormida = true;
    state.sleep.since = Date.now();
    startIdle(200, 400);
    resetPupils(el.gameStage);
    stopMouthAnim(el.gameStage);
    el.feedMenu.hidden = true;
    el.speechBubble.hidden = true;
    clearTimeout(bubbleHideTimer);
    clearTimeout(bubbleRemoveTimer);
    // v3.2, pedido explícito: "durmiendo" ya no es un aviso puntual de
    // 12s — es la tarjeta estática #sleep-notice-card (ver
    // renderNotifications), que se actualiza sola en el refreshUI() de
    // más abajo mientras dure state.sleep.dormida.
  }
  trySave(state);
  refreshUI();
  updateCooldownButtons();
}

// ---------- Medicina / salud ----------

function doMedicina() {
  if (!state.health.enferma || isOnCooldown("medicina")) return;
  registerInteraction();
  state.health.malestar = clamp(state.health.malestar - PET_CONFIG.health.medicinaAlivio, 0, 100);
  gainFelicidad(2);
  startCooldown("medicina");
  if (state.health.malestar <= PET_CONFIG.health.curadaUmbral) {
    state.health.enferma = false;
    state.health.causa = null;
    showBubble("¡Ya me siento mucho mejor!");
  } else {
    notifySystem(`${state.name} está un poco mejor, pero todavía necesita descanso.`);
  }
  trySave(state);
  refreshUI();
  updateCooldownButtons();
}

// ---------- Afecto: acariciar (click directo al personaje) / hablar ----------
// v2.2: "acariciar" dejó de vivir en un menú — pedido explícito: "que la
// opción de acariciar sea sólo haciendo click al personaje". Ahora
// doAcariciar() se dispara clickeando #game-stage directo (setupPetClick,
// más abajo); "Hablar" pasó a ser un botón normal del dock de acciones
// (con su propio cooldown, ver buildActionsDock) en vez de compartir un
// menú con Acariciar.

const PET_REACTIONS = ["💕", "✨", "💫"];
function popHearts() {
  const n = 3;
  for (let i = 0; i < n; i++) {
    const span = document.createElement("span");
    span.className = "heart-pop";
    span.textContent = PET_REACTIONS[Math.floor(Math.random() * PET_REACTIONS.length)];
    span.style.left = 42 + Math.random() * 16 + "%";
    span.style.animationDelay = i * 90 + "ms";
    el.walker.appendChild(span);
    setTimeout(() => span.remove(), 1400);
  }
}

function doAcariciar() {
  if (state.sleep.dormida) { notifySystem(`${state.name} está durmiendo. No se puede acariciar mientras descansa.`); return; }
  if (Math.round(state.stats.felicidad) >= 100) { showBubble("No quiero más caricias"); return; }
  if (isOnCooldown("acariciar")) { popHearts(); return; }
  registerInteraction();
  startIdle(1000, 1500);
  gainFelicidad(PET_CONFIG.affection.acariciar.felicidad);
  addBond(PET_CONFIG.affection.acariciar.vinculo);
  startCooldown("acariciar");
  trySave(state);
  refreshUI();
  updateCooldownButtons();
  popHearts();
  playMouthAnim(el.gameStage, "feliz", 480);
}

/** Click directo sobre el personaje (juego) = acariciar. Ver también la
 * exclusión agregada en setupClickToWalk (#game-stage no debe además
 * mover a la mascota hacia donde se clickeó). No se agrega en el
 * escenario de personalización (#preview-stage) — ahí no hay stats. */
function setupPetClick() {
  if (!el.gameStage) return;
  el.gameStage.setAttribute("role", "button");
  el.gameStage.setAttribute("tabindex", "0");
  el.gameStage.setAttribute("aria-label", "Acariciar mascota");
  el.gameStage.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); el.gameStage.click(); } });
  el.gameStage.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (!state || el.game.hidden) return;
    doAcariciar();
  });
}

let lastTalkPhrase = "";
function doHablar() {
  if (state.sleep.dormida) { notifySystem(`${state.name} está durmiendo. Podrás hablar cuando despierte.`); return; }
  const rewardReady = !isOnCooldown("hablar");
  registerInteraction();
  if (rewardReady) {
  gainFelicidad(PET_CONFIG.affection.hablar.felicidad);
  addBond(PET_CONFIG.affection.hablar.vinculo);
  startCooldown("hablar");
  }
  const dailyReward = rewardReady ? recordDailyGoal("talk") : false;
  trySave(state);
  refreshUI();
  updateCooldownButtons();
  const phrases = PET_TALK_PHRASES.filter(p => typeof p === "string" && p.trim() && p !== lastTalkPhrase);
  const frase = phrases[Math.floor(Math.random() * phrases.length)] || "¡Me encanta estar con vos!";
  lastTalkPhrase = frase;
  if (dailyReward) notifySystem("¡Objetivos del día completos! +50 monedas +100 XP");
  showBubble(frase, 3200);
  playMouthAnim(el.gameStage, "hablar", dailyReward ? 3800 : 3200);
}

// ---------- Menú de Opciones (Editar / Modo prueba / Reiniciar) ----------

let debugSnapshot = null;
function openDebugMode() {
  if (!state || !el.debugPanel) return;
  if (debugSnapshot || navLock) return;
  finishMinigame(true);
  document.getElementById("game-selector").hidden = true;
  el.feedMenu.hidden = true;
  debugSnapshot = JSON.parse(JSON.stringify(state));
  el.optDebug.setAttribute("aria-expanded", "true");
  el.debugPanel.hidden = false;
  refreshDebugValues();
  el.debugPanel.querySelector(".debug-close").focus();
  announce("Modo prueba. Guardá los cambios para conservarlos o cancelá para restaurar la partida.");
}
function closeDebugMode() {
  if (!el.debugPanel) return;
  el.debugPanel.hidden = true;
  el.optDebug.setAttribute("aria-expanded", "false");
  if (debugSnapshot) {
    state = normalizeState(debugSnapshot);
    setLocationVisuals(state.location);
    computeWalkBounds();
    debugSnapshot = null;
    trySave(state);
    refreshUI();
    updateCooldownButtons();
    refreshFeedMenuState();
  }
  el.optDebug.focus();
  announce("Modo prueba cerrado.");
}

function closeAllMenus() {
  if (el.feedMenu) el.feedMenu.hidden = true;
  closeOptionsMenu();
}

function openOptionsMenu() {
  closeAllMenus();
  el.optionsMenu.hidden = false;
  el.btnOpciones.setAttribute("aria-expanded", "true");
}

function closeOptionsMenu(returnFocus) {
  if (el.optionsMenu.hidden) return;
  if (!el.debugPanel.hidden) closeDebugMode();
  el.optionsMenu.hidden = true;
  el.btnOpciones.setAttribute("aria-expanded", "false");
  if (returnFocus) el.btnOpciones.focus();
}

function doReiniciar() {
  if (confirm("¿Reiniciar y borrar tu mascota actual? Esta acción no se puede deshacer.")) {
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }
    if (requestsTimer) { clearInterval(requestsTimer); requestsTimer = null; }
    clearState();
    state = null;
    if (currentUsername) window.Cloud.savePetState(currentUsername, null);
    openOnboarding(null);
  }
}

// v3.3: "Cambiar de usuario" cierra la sesión de nube actual (la mascota
// queda guardada tal cual en la cuenta) y vuelve a la pantalla de login —
// sólo aparece en el menú cuando hay nube configurada y sesión iniciada
// (ver updateOptCambiarUsuario).
async function doCambiarUsuario() {
  if (!confirm("¿Cambiar de usuario? Tu mascota queda guardada en la nube en tu cuenta actual.")) return;
  flushCloudSaveNow();
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }
  if (requestsTimer) { clearInterval(requestsTimer); requestsTimer = null; }
  if (cloudUnsub) { cloudUnsub(); cloudUnsub = null; }
  currentUsername = null;
  currentDisplayName = null;
  myCloudData = { friends: {}, friendRequests: { incoming: {}, outgoing: {} } };
  rememberUsername(null);
  state = null;
  closeFriendsPanel();
  if (el.btnAmigos) el.btnAmigos.hidden = true;
  el.game.hidden = true;
  el.onboarding.hidden = true;
  updateFooterText();
  updateOptCambiarUsuario();
  // Si la sesión actual era de Google, hay que cerrarla de verdad (si no,
  // Firebase Auth la restauraría sola en el próximo boot() y saltearía la
  // pantalla de login). Vuelve a entrar anónimo para que el login de
  // usuario+PIN siga funcionando.
  if (window.Cloud && window.Cloud.enabled && typeof window.Cloud.signOutCloud === "function") {
    try { await window.Cloud.signOutCloud(); } catch (e) { /* no es grave */ }
  }
  showLoginScreen();
}

function updateOptCambiarUsuario() {
  if (el.optCambiarUsuario) {
    el.optCambiarUsuario.hidden = !(window.Cloud && window.Cloud.enabled && currentUsername);
  }
}

function updateFooterText() {
  if (!el.footerText) return;
  if (window.Cloud && window.Cloud.enabled && currentUsername) {
    el.footerText.textContent = `Hecho por Jony · Mascotito Alpha v3.3 · sesión: ${currentDisplayName} · guardado en la nube y en este navegador`;
  } else {
    el.footerText.textContent = "Hecho por Jony · Mascotito Alpha v3.3 · guardado localmente en este navegador";
  }
}

function setupOptionsMenu() {
  if (el.btnEditPet) el.btnEditPet.addEventListener("click", () => openOnboarding(state));
  el.btnOpciones.addEventListener("click", () => {
    if (el.optionsMenu.hidden) openOptionsMenu();
    else closeOptionsMenu();
  });
  el.optDebug.addEventListener("click", () => {
    if (el.debugPanel.hidden) openDebugMode();
    else closeDebugMode();
  });
  if (el.optCambiarUsuario) {
    el.optCambiarUsuario.addEventListener("click", () => {
      closeOptionsMenu();
      doCambiarUsuario();
    });
  }
  el.optReiniciar.addEventListener("click", () => {
    closeOptionsMenu();
    doReiniciar();
  });
  // Cerrar con click afuera.
  document.addEventListener("click", (ev) => {
    if (el.optionsMenu.hidden) return;
    if (ev.target.closest("#options-menu") || ev.target.closest("#btn-opciones")) return;
    closeOptionsMenu();
  });
  // Cerrar con Escape y devolver el foco al botón que abrió el menú
  // (pedido de accesibilidad, sección 9) — mismo criterio para el menú de
  // comida, que también ancla a su propio botón (Afecto dejó de ser un
  // menú en v2.2).
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (!el.debugPanel.hidden) { closeDebugMode(); ev.preventDefault(); return; }
    if (!el.optionsMenu.hidden) { closeOptionsMenu(true); return; }
    if (!el.feedMenu.hidden) { el.feedMenu.hidden = true; document.getElementById("btn-comer")?.focus(); return; }
  });
}

// ---------- Herramienta de prueba — oculta por defecto, fuera del flujo normal ----------

function buildDebugPanel() {
  el.optDebug.after(el.debugPanel);
  el.debugPanel.setAttribute("role", "region");
  el.optDebug.setAttribute("aria-expanded", "false");
  el.optDebug.setAttribute("aria-controls", "debug-panel");
  el.debugPanel.setAttribute("aria-label", "Modo prueba");
  el.debugPanel.innerHTML = '<div class="debug-window"></div>';
  const p = el.debugPanel.firstElementChild;
  const title = document.createElement("p");
  title.className = "debug-title";
  title.textContent = "Modo prueba";
  p.appendChild(title);
  const close = document.createElement("button");
  close.type = "button";
  close.className = "debug-close";
  close.setAttribute("aria-label", "Cerrar modo prueba");
  close.textContent = "×";
  close.addEventListener("click", closeDebugMode);
  p.appendChild(close);
  const help = document.createElement("p"); help.className="debug-help"; help.textContent="Guardá para conservar los parámetros. Cerrar sin guardar descarta las pruebas."; p.appendChild(help);
  const save = document.createElement("button"); save.id="debug-save"; save.type="button"; save.textContent="Guardar cambios";
  save.addEventListener("click", () => { state.lastUpdate=Date.now(); debugSnapshot=null; trySave(state); closeDebugMode(); closeOptionsMenu(); notifySystem("Cambios del modo prueba guardados."); });
  const cancel = document.createElement("button"); cancel.type="button"; cancel.textContent="Cancelar"; cancel.addEventListener("click", closeDebugMode);
  const actions = document.createElement("div"); actions.className="debug-save-actions"; actions.append(save,cancel); p.appendChild(actions);

  NEED_DEFS.forEach(({ key, label }) => {
    const row = document.createElement("label");
    row.className = "debug-row";
    row.innerHTML = `<span>${label}</span> <input type="range" min="0" max="100" step="1" data-need="${key}" /> <span class="debug-val" data-need-val="${key}"></span>`;
    p.appendChild(row);
    const input = row.querySelector("input");
    input.addEventListener("input", () => {
      state.stats[key] = Number(input.value);
      refreshDebugValues();
      refreshUI();
      updateCooldownButtons();
      refreshFeedMenuState();
    });
  });

  const simRow = document.createElement("div");
  simRow.className = "debug-row";
  simRow.innerHTML = `
    <span>Simular tiempo</span>
    <button type="button" data-sim="60">+1h</button>
    <button type="button" data-sim="360">+6h</button>
    <button type="button" data-sim="1440">+24h</button>
    <button type="button" data-sim="4320">+3 días</button>`;
  simRow.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const minutes = Number(btn.dataset.sim);
      state.lastUpdate -= minutes * 60000;
      state.digestion.pending = state.digestion.pending.map(due => due - minutes * 60000);
      capturePetPosition();
      const info = applyDecay(state);
      refreshUI();
      updateCooldownButtons();
      refreshDebugValues();
      maybeGreet(info);
      announce(`Simulados ${minutes} minutos.`);
    });
  });
  p.appendChild(simRow);

  const toggleSickRow = document.createElement("div");
  toggleSickRow.className = "debug-row";
  toggleSickRow.innerHTML = `<button type="button" id="debug-force-sick">Forzar enferma</button> <button type="button" id="debug-force-well">Curar del todo</button>`;
  p.appendChild(toggleSickRow);
  toggleSickRow.querySelector("#debug-force-sick").addEventListener("click", () => {
    state.health.enferma = true;
    state.health.malestar = 100;
    state.health.causa = "necesidades";
    refreshUI();
    updateCooldownButtons();
  });
  toggleSickRow.querySelector("#debug-force-well").addEventListener("click", () => {
    state.health.enferma = false;
    state.health.malestar = 0;
    state.health.causa = null;
    refreshUI();
    updateCooldownButtons();
  });

  const locRow = document.createElement("div");
  locRow.className = "debug-row";
  locRow.innerHTML = `<span>Lugar</span> <button type="button" id="debug-go-casa">Ir a Casa</button> <button type="button" id="debug-go-jardin">Ir a Jardín</button>`;
  p.appendChild(locRow);
  locRow.querySelector("#debug-go-casa").addEventListener("click", () => goToLocation("casa"));
  locRow.querySelector("#debug-go-jardin").addEventListener("click", () => goToLocation("jardin"));
}

function refreshDebugValues() {
  if (!state) return;
  el.debugPanel.querySelectorAll("input[data-need]").forEach((input) => {
    const key = input.dataset.need;
    input.value = Math.round(state.stats[key]);
    const out = el.debugPanel.querySelector(`[data-need-val="${key}"]`);
    if (out) out.textContent = Math.round(state.stats[key]);
  });
}

// ---------- Eventos ----------

el.onboardingSubmit.addEventListener("click", submitOnboarding);
if (el.onboardingCancel) el.onboardingCancel.addEventListener("click", cancelOnboarding);
if (el.btnAleatorio) el.btnAleatorio.addEventListener("click", randomizeLook);
// Saca el aviso de "nombre inválido" en cuanto empieza a corregirlo, en vez
// de dejarlo pegado hasta el próximo intento de guardar.
if (el.nameInput) el.nameInput.addEventListener("input", clearNameError);

// Cerrar el menú de comida si se clickea afuera (el de Opciones tiene su
// propio listener en setupOptionsMenu; Afecto/Acariciar dejó de ser un
// menú en v2.2 — ver doAcariciar/setupPetClick).
document.addEventListener("click", (ev) => {
  if (el.feedMenu && !el.feedMenu.hidden && !ev.target.closest("#feed-menu") && !ev.target.closest("#btn-comer")) {
    el.feedMenu.hidden = true;
  }
});

// Only game/system notices enter this channel; pet speech stays in showBubble.
let systemNotice = "", systemNoticeTimer = null;
function notifySystem(text) {
  systemNotice=text; clearTimeout(systemNoticeTimer); renderNotifications(); announce(text);
  systemNoticeTimer=setTimeout(()=>{systemNotice="";renderNotifications()},12000);
}
// v3.2, pedido explícito: el aviso del sistema ahora se puede cerrar a
// mano (además de desaparecer solo a los 12s de siempre).
const systemNoticeCloseBtn = document.getElementById("system-notice-close");
if (systemNoticeCloseBtn) systemNoticeCloseBtn.addEventListener("click", () => {
  systemNotice=""; clearTimeout(systemNoticeTimer); renderNotifications();
});
/* v3.2, pedido explícito: separar en 3 ventanas lo que antes vivía junto
 * acá adentro (alertas de bienestar + el aviso puntual del sistema, todo
 * mezclado en #notification-card):
 * 1) Alertas de bienestar (necesidades <20% + enferma) — sin cambios de
 *    comportamiento, sólo quedaron solas en #notification-card.
 * 2) #sleep-notice-card — ESTÁTICA: visible sólo mientras
 *    state.sleep.dormida, sin botón de cerrar ni temporizador propio (no
 *    es un evento puntual, es el estado actual).
 * 3) #system-notice-card — el resto de los avisos puntuales (ver
 *    notifySystem), ahora con botón para cerrarlos a mano (además de la
 *    desaparición automática de siempre a los 12s).
 * Las 3 se encadenan en vertical en syncHudLayout(), así que cualquier
 * cambio de alto/visibilidad acá necesita volver a llamarla. */
function renderNotifications() {
  if (!state) return;
  const messages=[];
  for(const [key,phrase] of [["saciedad","tiene hambre"],["hidratacion","tiene sed"],["higiene","necesita un baño"],["energia","necesita descansar"],["felicidad","quiere jugar"]]) {
    if(state.stats[key]<20) messages.push(state.name+" "+phrase);
  }
  if(state.health.enferma) messages.push(state.name+" está enferma y necesita cuidados");

  const card=document.getElementById("notification-card"); card.hidden=!messages.length;
  const list=card.querySelector("ul");const content=messages.join("\n");
  if(list.dataset.content!==content){
    list.dataset.content=content;
    list.replaceChildren(...messages.map(msg=>{const li=document.createElement("li");li.textContent=msg;return li}));
  }

  const sleepCard=document.getElementById("sleep-notice-card");
  if(sleepCard){
    sleepCard.hidden=!state.sleep.dormida;
    const p=sleepCard.querySelector("p");
    if(p) p.textContent=`${state.name} está durmiendo.`;
  }

  const sysCard=document.getElementById("system-notice-card");
  if(sysCard){
    sysCard.hidden=!systemNotice;
    const p=sysCard.querySelector("p");
    if(p) p.textContent=systemNotice;
  }

  syncHudLayout();
}

// Global overlays and responsive HUD measurement.
function syncHudLayout() {
  const hud = document.getElementById("wellbeing-widget");
  document.getElementById("time-card").style.top = (hud.offsetTop + hud.offsetHeight + 12) + "px";
  const clock=document.getElementById("time-card");
  const notif=document.getElementById("notification-card");
  notif.style.top=(clock.offsetTop+clock.offsetHeight+12)+"px";
  // v3.2: #sleep-notice-card y #system-notice-card se encadenan debajo de
  // las alertas de bienestar, en ese orden — cuando alguna está hidden
  // (display:none) su offsetHeight da 0 y la siguiente sube sola a
  // ocupar su lugar, sin dejar huecos.
  const sleepCard=document.getElementById("sleep-notice-card");
  sleepCard.style.top=(notif.offsetTop+notif.offsetHeight+12)+"px";
  const sysCard=document.getElementById("system-notice-card");
  sysCard.style.top=(sleepCard.offsetTop+sleepCard.offsetHeight+12)+"px";
  const dock=document.getElementById("stage-actions-row");
  el.feedMenu.style.bottom=(el.stageFloor.clientHeight-dock.offsetTop+12)+"px";
  computeWalkBounds();
  el.walker.style.transform = `translateX(${walkX + WALK_PAD}px)`;
  if (minigame) positionMinigameTarget();
}
for (const id of ["wellbeing-widget","time-card","stage-actions-row"]) new ResizeObserver(syncHudLayout).observe(document.getElementById(id));
window.addEventListener("resize", syncHudLayout);
document.addEventListener("keydown", ev => {
  if (ev.defaultPrevented || ev.key !== "Escape") return;
  if (minigame) finishMinigame(true);
  else if (!document.getElementById("game-selector").hidden) closeGameSelector();
});
// ---------- Arranque ----------

(function init() {
  // Iconos estáticos que no cambian durante la sesión (los que sí cambian
  // — puerta/etiqueta de lugar — se resuelven en setLocationVisuals).
  el.btnAleatorio.innerHTML = iconSvg("dado") + "<span>Aleatorio</span>";
  el.navBtn.querySelector(".nav-btn-icon").innerHTML = iconSvg("puerta");
  buildPrimaryMeters();
  buildActionsDock();
  buildFeedMenu();
  buildDebugPanel();
  setupOptionsMenu();
  setupNavigation();
  setupHeaderNavigation();
  setupSceneDoor();
  setupEyeTracking();
  setupStageHover();
  setupPreviewStageHover();
  setupWalking();
  setupPetClick();
  setupMinigames();
  setupGameSelector();
  setupVisibilityRecalc();
  setupAutoBlink();
  setupClock();
  setupLoginUI();
  setupFriendsUI();
  boot();
})();

/**
 * v3.3 — Arranque de sesión (nube o local). Reemplaza el "cargar y
 * mostrar" directo de v3.2: ahora primero hay que saber si hay un
 * proyecto de Firebase configurado (window.Cloud.enabled) y, si lo hay,
 * quién está jugando.
 *
 * - Sin nube configurada (CLOUD_ENABLED=false en js/firebase-config.js,
 *   el valor por defecto): comportamiento IDÉNTICO a v3.2, sin pantalla
 *   de login — se sigue guardando sólo en este navegador.
 * - Con nube configurada: se intenta retomar la sesión recordada en este
 *   navegador (mismo usuario de la última vez); si no hay ninguna, o la
 *   cuenta recordada ya no responde, se pide usuario+PIN.
 */
async function waitForCloud(timeoutMs) {
  const start = Date.now();
  while (!window.Cloud) {
    if (Date.now() - start > timeoutMs) return null;
    await wait(50);
  }
  return window.Cloud;
}

async function boot() {
  const notice = getStorageNotice();
  if (notice && el.storageNotice) {
    el.storageNotice.textContent = "⚠️ " + notice;
    el.storageNotice.hidden = false;
    announce(notice);
  }
  const Cloud = await waitForCloud(4000);
  if (!Cloud || !Cloud.enabled) {
    beginLocalOnlySession();
    return;
  }
  await Cloud.ready;
  if (!Cloud.enabled) {
    // enabled puede haber quedado en true por config pero falló la
    // conexión real (ver window.Cloud.lastInitError) — se sigue jugando
    // localmente en vez de trabar la app.
    beginLocalOnlySession();
    return;
  }
  const remembered = getRememberedUsername();
  if (remembered) {
    const result = await Cloud.getPlayerData(remembered);
    if (result.ok) {
      currentUsername = remembered;
      currentDisplayName = result.data.username;
      startSessionWithData(result.data);
      return;
    }
    if (result.error === "not_found") rememberUsername(null);
    // Si fue error de red, se deja la sesión recordada guardada (se
    // reintenta sola la próxima vez) y se pide login igual por ahora.
  }
  showLoginScreen();
}

function beginLocalOnlySession() {
  const saved = loadState();
  if (saved) {
    state = saved;
    el.onboarding.hidden = true;
    el.game.hidden = false;
    startGame();
  } else {
    openOnboarding(null);
  }
}

function startSessionWithData(data) {
  el.loginScreen.hidden = true;
  el.appHeader.hidden = false;
  if (el.btnAmigos) el.btnAmigos.hidden = false;
  updateFooterText();
  updateOptCambiarUsuario();
  subscribeFriendsLive();
  const cloudPet = data && data.petState ? normalizeState(data.petState) : null;
  if (cloudPet) {
    state = cloudPet;
    el.onboarding.hidden = true;
    el.game.hidden = false;
    startGame();
    return;
  }
  // Cuenta sin mascota guardada en la nube todavía (recién creada, o
  // creada desde otro navegador sin haber llegado a crear mascota). Si
  // este navegador ya tenía una mascota guardada de forma local, se
  // toma como punto de partida en vez de perderla — trySave() dentro de
  // startGame() ya programa subirla a la nube sola.
  const local = loadState();
  if (local) {
    state = local;
    el.onboarding.hidden = true;
    el.game.hidden = false;
    startGame();
  } else {
    openOnboarding(null);
  }
}

// ---------- v3.3: pantalla de login (usuario + PIN) ----------

function showLoginScreen() {
  el.loginScreen.hidden = false;
  el.game.hidden = true;
  el.onboarding.hidden = true;
  el.appHeader.hidden = true;
  if (el.loginError) el.loginError.hidden = true;
  if (el.loginOffline) el.loginOffline.hidden = true;
  if (el.loginGoogleError) el.loginGoogleError.hidden = true;
  pendingGoogleUid = null;
  if (el.googleUsernameForm) el.googleUsernameForm.hidden = true;
  if (el.loginForm) el.loginForm.hidden = false;
  // El botón de Google sólo tiene sentido si hay nube configurada — si no
  // hay Firebase de por medio, no ofrecemos algo que no puede funcionar.
  const showGoogle = !!(window.Cloud && window.Cloud.enabled);
  if (el.loginDivider) el.loginDivider.hidden = !showGoogle;
  if (el.loginGoogle) el.loginGoogle.hidden = !showGoogle;
  setTimeout(() => el.loginUsername && el.loginUsername.focus(), 50);
}

/** Guarda la sesión y arranca el juego — comparte el mismo final tanto
 * para el login de usuario+PIN como para el de Google. */
function completeCloudLogin(usernameLower, username, data) {
  currentUsername = usernameLower;
  currentDisplayName = username;
  rememberUsername(currentUsername);
  startSessionWithData(data);
}

function showLoginError(msg) {
  if (!el.loginError) return;
  el.loginError.textContent = msg;
  el.loginError.hidden = false;
}

const LOGIN_ERROR_MESSAGES = {
  wrong_pin: "Ese PIN no es correcto para ese usuario.",
  invalid_username: "El usuario debe tener 3 a 16 letras/números, empezando con una letra (sin espacios ni símbolos).",
  invalid_pin: "El PIN tiene que ser de 4 números.",
  taken: "Ese usuario ya existe — si es tuyo, escribí el PIN con el que lo creaste.",
};

async function handleLoginSubmit() {
  if (el.loginError) el.loginError.hidden = true;
  if (el.loginOffline) el.loginOffline.hidden = true;
  const Cloud = window.Cloud;
  if (!Cloud) return;
  const usernameRaw = el.loginUsername.value;
  const pin = el.loginPin.value;
  const usernameLower = Cloud.normalizeUsername(usernameRaw);
  if (!usernameLower) {
    showLoginError(LOGIN_ERROR_MESSAGES.invalid_username);
    el.loginUsername.focus();
    return;
  }
  if (!Cloud.isValidPin(pin)) {
    showLoginError(LOGIN_ERROR_MESSAGES.invalid_pin);
    el.loginPin.focus();
    return;
  }
  el.loginSubmit.disabled = true;
  const originalLabel = el.loginSubmit.textContent;
  el.loginSubmit.textContent = "Entrando...";
  try {
    let result = await Cloud.login(usernameRaw, pin);
    if (!result.ok && result.error === "not_found") {
      // Usuario nuevo para la nube: se crea la cuenta en el momento con
      // ese mismo PIN (pedido explícito: "no hace falta contraseña,
      // entre amigos" — el login sigue siendo instantáneo).
      result = await Cloud.register(usernameRaw, pin, null);
      if (!result.ok && result.error === "taken") {
        // carrera rara (alguien lo registró en el medio) — se reintenta como login.
        result = await Cloud.login(usernameRaw, pin);
      }
      if (result.ok) {
        completeCloudLogin(result.usernameLower, result.username, {
          username: result.username,
          petState: null,
          friends: {},
          friendRequests: { incoming: {}, outgoing: {} },
        });
        return;
      }
    }
    if (!result.ok) {
      if (result.error === "network" || result.error === "disabled") {
        showLoginError("No se pudo conectar con la nube ahora mismo. Podés seguir jugando en este navegador mientras tanto.");
        if (el.loginOffline) el.loginOffline.hidden = false;
      } else {
        showLoginError(LOGIN_ERROR_MESSAGES[result.error] || "No se pudo iniciar sesión.");
      }
      return;
    }
    completeCloudLogin(result.usernameLower, result.username, result.data);
  } finally {
    el.loginSubmit.disabled = false;
    el.loginSubmit.textContent = originalLabel;
  }
}

/** "Iniciar sesión con Google": abre el popup y, según lo que devuelva
 * cloud.js, o entra directo (cuenta de Google ya vinculada a un usuario
 * de Mascotito) o muestra el paso de elegir nombre (primera vez). */
async function handleGoogleLogin() {
  const Cloud = window.Cloud;
  if (!Cloud || !el.loginGoogle) return;
  if (el.loginError) el.loginError.hidden = true;
  if (el.loginGoogleError) el.loginGoogleError.hidden = true;
  if (el.loginOffline) el.loginOffline.hidden = true;
  el.loginGoogle.disabled = true;
  try {
    const result = await Cloud.loginWithGoogle();
    if (!result.ok) {
      if (result.error === "popup_closed") return; // el usuario canceló, no es un error
      if (result.error === "network" || result.error === "disabled") {
        el.loginGoogleError.textContent = "No se pudo conectar con la nube ahora mismo. Podés seguir jugando en este navegador mientras tanto.";
        el.loginGoogleError.hidden = false;
        if (el.loginOffline) el.loginOffline.hidden = false;
      } else {
        el.loginGoogleError.textContent = "No se pudo iniciar sesión con Google.";
        el.loginGoogleError.hidden = false;
      }
      return;
    }
    if (result.needsUsername) {
      pendingGoogleUid = result.googleUid;
      if (el.loginForm) el.loginForm.hidden = true;
      if (el.loginDivider) el.loginDivider.hidden = true;
      el.loginGoogle.hidden = true;
      if (el.googleUsernameForm) {
        el.googleUsernameForm.hidden = false;
        if (el.googleUsername) {
          el.googleUsername.value = result.suggestedName || "";
          setTimeout(() => el.googleUsername.focus(), 50);
        }
      }
      return;
    }
    completeCloudLogin(result.usernameLower, result.username, result.data);
  } finally {
    el.loginGoogle.disabled = false;
  }
}

/** Segundo paso de "Iniciar sesión con Google" para una cuenta nueva:
 * crea el usuario de Mascotito vinculado al uid de Google ya autenticado. */
async function handleGoogleUsernameSubmit() {
  const Cloud = window.Cloud;
  if (!Cloud || !pendingGoogleUid) return;
  if (el.googleUsernameError) el.googleUsernameError.hidden = true;
  const usernameRaw = el.googleUsername.value;
  const usernameLower = Cloud.normalizeUsername(usernameRaw);
  if (!usernameLower) {
    el.googleUsernameError.textContent = LOGIN_ERROR_MESSAGES.invalid_username;
    el.googleUsernameError.hidden = false;
    el.googleUsername.focus();
    return;
  }
  el.googleUsernameSubmit.disabled = true;
  const originalLabel = el.googleUsernameSubmit.textContent;
  el.googleUsernameSubmit.textContent = "Creando...";
  try {
    const result = await Cloud.completeGoogleSignup(usernameRaw, pendingGoogleUid);
    if (!result.ok) {
      if (result.error === "taken") {
        el.googleUsernameError.textContent = "Ese usuario ya existe — probá con otro nombre.";
      } else if (result.error === "network" || result.error === "disabled") {
        el.googleUsernameError.textContent = "No se pudo conectar con la nube ahora mismo. Probá de nuevo en un momento.";
      } else {
        el.googleUsernameError.textContent = LOGIN_ERROR_MESSAGES[result.error] || "No se pudo crear la cuenta.";
      }
      el.googleUsernameError.hidden = false;
      return;
    }
    pendingGoogleUid = null;
    completeCloudLogin(result.usernameLower, result.username, {
      username: result.username,
      petState: null,
      friends: {},
      friendRequests: { incoming: {}, outgoing: {} },
    });
  } finally {
    el.googleUsernameSubmit.disabled = false;
    el.googleUsernameSubmit.textContent = originalLabel;
  }
}

function setupLoginUI() {
  if (!el.loginForm) return;
  el.loginForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    handleLoginSubmit();
  });
  if (el.loginOffline) {
    el.loginOffline.addEventListener("click", () => {
      el.loginScreen.hidden = true;
      beginLocalOnlySession();
    });
  }
  if (el.loginGoogle) {
    el.loginGoogle.addEventListener("click", () => handleGoogleLogin());
  }
  if (el.googleUsernameForm) {
    el.googleUsernameForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      handleGoogleUsernameSubmit();
    });
  }
  if (el.googleUsernameCancel) {
    el.googleUsernameCancel.addEventListener("click", () => {
      pendingGoogleUid = null;
      if (el.googleUsernameForm) el.googleUsernameForm.hidden = true;
      if (el.loginForm) el.loginForm.hidden = false;
      const showGoogle = !!(window.Cloud && window.Cloud.enabled);
      if (el.loginDivider) el.loginDivider.hidden = !showGoogle;
      if (el.loginGoogle) el.loginGoogle.hidden = !showGoogle;
      // La sesión de Google sigue autenticada en Firebase Auth aunque se
      // cancele acá — la próxima vez que se apriete "Iniciar sesión con
      // Google" vuelve a pedir el usuario (no quedó ningún vínculo creado).
    });
  }
}

// ---------- v3.3: panel de Amigos ----------

function subscribeFriendsLive() {
  if (cloudUnsub) {
    cloudUnsub();
    cloudUnsub = null;
  }
  if (!window.Cloud || !window.Cloud.enabled || !currentUsername) return;
  cloudUnsub = window.Cloud.subscribeToPlayer(currentUsername, (data) => {
    myCloudData = data || { friends: {}, friendRequests: { incoming: {}, outgoing: {} } };
    renderFriendsBadge();
    if (el.friendsOverlay && !el.friendsOverlay.hidden) renderFriendsPanel();
  });
}

function renderFriendsBadge() {
  const incoming = (myCloudData.friendRequests && myCloudData.friendRequests.incoming) || {};
  const count = Object.keys(incoming).length;
  if (el.friendsBadge) {
    el.friendsBadge.hidden = count === 0;
    el.friendsBadge.textContent = String(count);
  }
  if (el.requestsTabBadge) {
    el.requestsTabBadge.hidden = count === 0;
    el.requestsTabBadge.textContent = String(count);
  }
}

function friendRow(displayName, actionsHtml) {
  const li = document.createElement("li");
  li.className = "friend-item";
  const nameSpan = document.createElement("span");
  nameSpan.className = "friend-item-name";
  nameSpan.textContent = displayName;
  const actionsSpan = document.createElement("span");
  actionsSpan.className = "friend-item-actions";
  actionsSpan.innerHTML = actionsHtml;
  li.appendChild(nameSpan);
  li.appendChild(actionsSpan);
  return li;
}

function renderFriendsPanel() {
  const friends = myCloudData.friends || {};
  const incoming = (myCloudData.friendRequests && myCloudData.friendRequests.incoming) || {};
  const outgoing = (myCloudData.friendRequests && myCloudData.friendRequests.outgoing) || {};

  el.friendsList.innerHTML = "";
  const friendKeys = Object.keys(friends);
  el.friendsEmpty.hidden = friendKeys.length > 0;
  friendKeys.forEach((k) => {
    const display = (friends[k] && friends[k].displayName) || k;
    el.friendsList.appendChild(
      friendRow(display, `<button type="button" class="friend-btn-remove" data-user="${k}">Quitar</button>`)
    );
  });

  el.requestsIncomingList.innerHTML = "";
  const inKeys = Object.keys(incoming);
  el.requestsIncomingEmpty.hidden = inKeys.length > 0;
  inKeys.forEach((k) => {
    const display = (incoming[k] && incoming[k].fromDisplay) || k;
    el.requestsIncomingList.appendChild(
      friendRow(
        display,
        `<button type="button" class="friend-btn-accept" data-user="${k}">Aceptar</button><button type="button" class="friend-btn-reject" data-user="${k}">Rechazar</button>`
      )
    );
  });

  el.requestsOutgoingList.innerHTML = "";
  const outKeys = Object.keys(outgoing);
  el.requestsOutgoingEmpty.hidden = outKeys.length > 0;
  outKeys.forEach((k) => {
    el.requestsOutgoingList.appendChild(
      friendRow(k, `<button type="button" class="friend-btn-cancel" data-user="${k}">Cancelar</button>`)
    );
  });

  renderFriendsBadge();
}

function openFriendsPanel() {
  el.friendsOverlay.hidden = false;
  renderFriendsPanel();
  switchFriendsTab(friendsTabActive);
}

function closeFriendsPanel() {
  if (el.friendsOverlay) el.friendsOverlay.hidden = true;
}

function switchFriendsTab(tab) {
  friendsTabActive = tab;
  const panels = { lista: el.friendsTabLista, solicitudes: el.friendsTabSolicitudes, agregar: el.friendsTabAgregar };
  Object.keys(panels).forEach((key) => {
    if (panels[key]) panels[key].hidden = key !== tab;
  });
  el.friendsTabs.querySelectorAll(".creator-tab").forEach((btn) => {
    btn.setAttribute("aria-selected", String(btn.dataset.tab === tab));
  });
}

async function handleAddFriendSearch() {
  const Cloud = window.Cloud;
  const resultBox = el.addFriendResult;
  if (!Cloud || !resultBox) return;
  const raw = el.addFriendInput.value;
  resultBox.hidden = false;
  resultBox.textContent = "Buscando...";
  const result = await Cloud.searchUser(raw);
  if (!result.ok) {
    resultBox.textContent = result.error === "invalid_username"
      ? LOGIN_ERROR_MESSAGES.invalid_username
      : "No se pudo buscar ahora mismo (revisá tu conexión).";
    return;
  }
  if (!result.exists) {
    resultBox.textContent = "No existe ningún usuario con ese nombre.";
    return;
  }
  if (result.usernameLower === currentUsername) {
    resultBox.textContent = "Ese sos vos.";
    return;
  }
  if (myCloudData.friends && myCloudData.friends[result.usernameLower]) {
    resultBox.textContent = `Ya son amigos con ${result.username}.`;
    return;
  }
  if (myCloudData.friendRequests && myCloudData.friendRequests.outgoing && myCloudData.friendRequests.outgoing[result.usernameLower]) {
    resultBox.textContent = `Ya le enviaste una solicitud a ${result.username}.`;
    return;
  }
  if (myCloudData.friendRequests && myCloudData.friendRequests.incoming && myCloudData.friendRequests.incoming[result.usernameLower]) {
    resultBox.textContent = `${result.username} ya te envió una solicitud — buscala en la pestaña Solicitudes.`;
    return;
  }
  resultBox.textContent = "";
  resultBox.appendChild(document.createTextNode(`Encontrado: ${result.username}. `));
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "secondary-btn";
  btn.textContent = "Enviar solicitud";
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const send = await Cloud.sendFriendRequest(currentUsername, currentDisplayName, result.usernameLower);
    if (send.ok) {
      resultBox.textContent = `Solicitud enviada a ${result.username}.`;
      el.addFriendInput.value = "";
    } else {
      resultBox.textContent = "No se pudo enviar la solicitud (¿ya son amigos, o ya hay una solicitud pendiente?).";
      btn.disabled = false;
    }
  });
  resultBox.appendChild(btn);
}

function setupFriendsUI() {
  if (!el.btnAmigos || !el.friendsOverlay) return;
  el.btnAmigos.addEventListener("click", openFriendsPanel);
  el.friendsClose.addEventListener("click", closeFriendsPanel);
  el.friendsOverlay.addEventListener("click", (ev) => {
    if (ev.target === el.friendsOverlay) closeFriendsPanel();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !el.friendsOverlay.hidden) closeFriendsPanel();
  });
  el.friendsTabs.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".creator-tab");
    if (!btn) return;
    switchFriendsTab(btn.dataset.tab);
  });
  el.friendsList.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button[data-user]");
    if (!btn || !btn.classList.contains("friend-btn-remove")) return;
    btn.disabled = true;
    await window.Cloud.removeFriend(currentUsername, btn.dataset.user);
  });
  el.requestsIncomingList.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button[data-user]");
    if (!btn) return;
    const target = btn.dataset.user;
    btn.disabled = true;
    if (btn.classList.contains("friend-btn-accept")) {
      const res = await window.Cloud.acceptFriendRequest(currentUsername, currentDisplayName, target);
      if (res.ok) notifySystem("Ahora son amigos.");
    } else if (btn.classList.contains("friend-btn-reject")) {
      await window.Cloud.rejectFriendRequest(currentUsername, target);
    }
  });
  el.requestsOutgoingList.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button[data-user]");
    if (!btn || !btn.classList.contains("friend-btn-cancel")) return;
    btn.disabled = true;
    await window.Cloud.cancelFriendRequest(currentUsername, btn.dataset.user);
  });
  el.addFriendForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    handleAddFriendSearch();
  });
}
