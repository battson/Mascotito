/**
 * Lógica principal de la app: onboarding/personalización, pantalla de
 * juego, loop de necesidades y acciones de cuidado. Beta v2 incorpora
 * housing con decoración, inventario de casa y regalos de migración.
 */

let state = null;
let pendingHousingGiftForAccount = false;
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
// Beta v4.3.3: pantalla visible del celular: contacts | chat | search | requests.
let phoneView = "contacts";
let wardrobeSlotActive = "superior";
let wardrobeDraft = null;
let wardrobePage = 0;
let shopGroup = "Casa";
let shopSubcategory = null;
let shopCatalog = {};
let shopBusy = false;
const friendPresence = new Map();
// Beta v4.3.2: mascotas de los contactos (una lectura por apertura del celular) y emojis del chat.
const friendPetCache = new Map();
const friendPetPending = new Set();
const friendPresenceUnsubscribers = new Map();
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
  // v3.6.2: la vieja pantalla #onboarding, separada del juego, desaparece
  // — la creación/edición vive ahora DENTRO de #stage-floor (ver
  // setStageEditing() más abajo y el comentario grande en index.html).
  game: document.getElementById("game"),
  appHeader: document.getElementById("app-header"),
  brandEmblem: document.getElementById("brand-emblem"),
  editorWelcome: document.getElementById("editor-welcome"),
  editorNameCard: document.getElementById("editor-name-card"),
  nameInput: document.getElementById("name-input"),
  nameError: document.getElementById("name-error"),
  onboardingTitle: document.getElementById("onboarding-title"),
  onboardingSubmit: document.getElementById("onboarding-submit"),
  onboardingCancel: document.getElementById("onboarding-cancel"),
  creatorTabsRow: document.getElementById("creator-tabs-row"),
  creatorTabs: document.getElementById("creator-tabs"),
  creatorPartIcons: document.getElementById("creator-part-icons"),
  creatorColorIcons: document.getElementById("creator-color-icons"),
  previewStagePos: document.getElementById("preview-stage-pos"),
  previewStage: document.getElementById("preview-stage"),
  gameStage: document.getElementById("game-stage"),
  stageFloor: document.getElementById("stage-floor"),
  stageTransition: document.getElementById("stage-transition"),
  stageTransitionLabel: document.getElementById("stage-transition-label"),
  stageTransitionBack: document.getElementById("stage-transition-back"),
  walker: document.getElementById("walker"),
  petName: document.getElementById("pet-name"),
  statusLine: document.getElementById("status-line"),
  hudStatusDot: document.querySelector(".hud-status-dot"),
  wellbeingWidget: document.getElementById("wellbeing-widget"),
  wellbeingHud: document.getElementById("wellbeing-hud"),
  wellbeingAvatar: document.getElementById("wellbeing-avatar"),
  wellbeingBars: document.getElementById("wellbeing-bars"),
  wellbeingAvatarStage: document.getElementById("wellbeing-avatar-stage"),
  coinCount: document.getElementById("coin-count"),
  shopOverlay: document.getElementById("shop-overlay"),
  shopGrid: document.getElementById("shop-grid"),
  shopTabs: document.getElementById("shop-tabs"),
  shopSubtabs: document.getElementById("shop-subtabs"),
  shopCoins: document.getElementById("shop-coins"),
  shopStatus: document.getElementById("shop-status"),
  headerLevelText: document.getElementById("header-level-text"),
  headerXpText: document.getElementById("header-xp-text"),
  headerLevelFill: document.getElementById("header-level-fill"),
  btnEditPet: document.getElementById("btn-edit-pet"),
  dailyCard: document.getElementById("daily-card"),
  dailyCount: document.getElementById("daily-count"),
  dailyFeed: document.getElementById("daily-feed"),
  dailyPlay: document.getElementById("daily-play"),
  dailyTalk: document.getElementById("daily-talk"),
  dailyReward: document.querySelector(".daily-reward"),
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
  optEliminarCuenta: document.getElementById("opt-eliminar-cuenta"),
  deleteAccountOverlay: document.getElementById("delete-account-overlay"),
  deleteAccountForm: document.getElementById("delete-account-form"),
  deleteAccountInput: document.getElementById("delete-account-input"),
  deleteAccountError: document.getElementById("delete-account-error"),
  deleteAccountSubmit: document.getElementById("delete-account-submit"),
  deleteAccountCancel: document.getElementById("delete-account-cancel"),
  deleteAccountClose: document.getElementById("delete-account-close"),
  deleteAccountUsernameHint: document.getElementById("delete-account-username-hint"),
  requestsIncomingList: document.getElementById("requests-incoming-list"),
  requestsIncomingEmpty: document.getElementById("requests-incoming-empty"),
  addFriendForm: document.getElementById("add-friend-form"),
  addFriendInput: document.getElementById("add-friend-input"),
  addFriendResult: document.getElementById("add-friend-result"),
  // v3.8: la visita vive dentro del escenario principal. Sólo se agrega
  // una segunda mascota y una barra de contexto; ya no existe overlay.
  visitContext: document.getElementById("visit-context"),
  visitClose: document.getElementById("visit-close"),
  visitTitle: document.getElementById("visit-title"),
  visitStatusLine: document.getElementById("visit-status-line"),
  visitRoomCount: document.getElementById("visit-room-count"),
  visitWalkerHost: document.getElementById("visit-walker-host"),
  visitPetStageHost: document.getElementById("visit-pet-stage-host"),
  visitHostName: document.getElementById("visit-host-name"),
  visitHostPresence: document.getElementById("visit-host-presence"),
  remotePlayersLayer: document.getElementById("remote-players-layer"),
  roomChatToggle: document.getElementById("room-chat-toggle"),
  roomChatContactLabel: document.getElementById("room-chat-contact-label"),
  roomChatContactStatus: document.getElementById("room-chat-contact-status"),
  roomChatBadge: document.getElementById("room-chat-badge"),
  roomChatPanel: document.getElementById("room-chat-panel"),
  roomChatBack: document.getElementById("room-chat-back"),
  roomChatClose: document.getElementById("room-chat-close"),
  roomChatAvatar: document.getElementById("room-chat-avatar"),
  roomChatMenuBtn: document.getElementById("room-chat-menu-btn"),
  roomChatMenu: document.getElementById("room-chat-menu"),
  phoneHome: document.getElementById("phone-home"),
  phoneSearchOpen: document.getElementById("phone-search-open"),
  phoneSearch: document.getElementById("phone-search"),
  phoneRequests: document.getElementById("phone-requests"),
  phoneConfirm: document.getElementById("phone-confirm"),
  phoneConfirmText: document.getElementById("phone-confirm-text"),
  phoneConfirmYes: document.getElementById("phone-confirm-yes"),
  phoneConfirmNo: document.getElementById("phone-confirm-no"),
  roomChatTitle: document.getElementById("room-chat-title"),
  roomChatParticipants: document.getElementById("room-chat-participants"),
  roomChatContacts: document.getElementById("room-chat-contacts"),
  roomChatContactList: document.getElementById("room-chat-contact-list"),
  roomChatContactsEmpty: document.getElementById("room-chat-contacts-empty"),
  roomChatConversation: document.getElementById("room-chat-conversation"),
  roomChatStatus: document.getElementById("room-chat-status"),
  roomChatTyping: document.getElementById("room-chat-typing"),
  roomChatMessages: document.getElementById("room-chat-messages"),
  roomChatEmpty: document.getElementById("room-chat-empty"),
  roomChatForm: document.getElementById("room-chat-form"),
  roomChatInput: document.getElementById("room-chat-input"),
  roomChatSend: document.getElementById("room-chat-send"),
  roomQuickChat: document.getElementById("room-quick-chat"),
  roomQuickChatInput: document.getElementById("room-quick-chat-input"),
  roomQuickChatSend: document.getElementById("room-quick-chat-send"),
  friendsManageAdd: document.getElementById("friends-manage-add"),
  friendsManageBadge: document.getElementById("friends-manage-badge"),
  inventoryOverlay: document.getElementById("inventory-overlay"),
  inventoryClose: document.getElementById("inventory-close"),
  inventoryFish: document.getElementById("inventory-fish"),
  inventoryFishCooldown: document.getElementById("inventory-fish-cooldown"),
  inventoryFishCatch: document.getElementById("inventory-fish-catch"),
  inventoryWater: document.getElementById("inventory-water"),
  inventoryWaterCooldown: document.getElementById("inventory-water-cooldown"),
  inventoryFishCount: document.getElementById("inventory-fish-count"),
  inventoryStatus: document.getElementById("inventory-status"),
  inventoryFoodGrid: document.getElementById("inventory-food-grid"),
  housingEditorPanel: document.getElementById("housing-editor-panel"),
  housingEditorHeading: document.getElementById("housing-editor-heading"),
  housingEditorToggle: document.getElementById("housing-editor-toggle"),
  housingEditorClose: document.getElementById("housing-editor-close"),
  housingEditorHint: document.getElementById("housing-editor-hint"),
  housingEditorItems: document.getElementById("housing-editor-items"),
  housingEditorRemove: document.getElementById("housing-editor-remove"),
  housingGiftOverlay: document.getElementById("housing-gift-overlay"),
  housingGiftGroups: document.getElementById("housing-gift-groups"),
  housingGiftStatus: document.getElementById("housing-gift-status"),
  housingGiftClaim: document.getElementById("housing-gift-claim"),
  wardrobeOverlay: document.getElementById("wardrobe-overlay"),
  wardrobeClose: document.getElementById("wardrobe-close"),
  wardrobeCloseAction: document.getElementById("wardrobe-close-action"),
  wardrobeTabs: document.getElementById("wardrobe-tabs"),
  wardrobeGrid: document.getElementById("wardrobe-grid"),
  wardrobeEmpty: document.getElementById("wardrobe-empty"),
  betaWelcomeOverlay: document.getElementById("beta-welcome-overlay"),
  betaWelcomeOptions: document.getElementById("beta-welcome-options"),
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

// v3.6 (pedido explícito): filtro de imagen para ojos-5/ojos-6 (ver el
// comentario largo junto a PET_EYE_COLORS en js/manifest.js) — se aplica
// sobre .ojo-tintable vía --eye-tint-filter, en paralelo a --eye-color.
function getEyeTintFilter(ojosColorValue) {
  const opt = PET_EYE_COLORS.find((o) => o.id === ojosColorValue);
  return (opt && opt.tint) || "none";
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

let stageTransitionSequence = 0;
let stageTransitionStartedAt = 0;

function beginStageTransition(label) {
  const sequence = ++stageTransitionSequence;
  stageTransitionStartedAt = performance.now();
  el.stageTransitionLabel.textContent = label;
  el.stageTransitionBack.hidden = true;
  el.stageTransition.classList.remove("is-leaving");
  el.stageTransition.hidden = false;
  return sequence;
}

function stageTransitionError(sequence, message) {
  if (sequence !== stageTransitionSequence) return;
  el.stageTransitionLabel.textContent = message;
  el.stageTransitionBack.hidden = false;
}

function nextStagePaint() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function preloadHousingAssets(housing) {
  if (!housing) return Promise.resolve();
  const ids = [housing.wall, housing.floor, ...(housing.placed || []).map((entry) => entry.id)];
  const sources = [...new Set(ids.map((id) => HOUSING_ITEMS[id]?.asset).filter(Boolean))];
  return Promise.all(sources.map((src) => new Promise((resolve) => {
    const image = new Image();
    image.onload = image.onerror = resolve;
    image.src = src;
    if (image.complete) resolve();
  }))).then(() => {});
}

async function endStageTransition(sequence, assets = null) {
  if (assets) await Promise.race([preloadHousingAssets(assets), wait(4000)]);
  await nextStagePaint();
  const remaining = 650 - (performance.now() - stageTransitionStartedAt);
  if (remaining > 0) await wait(remaining);
  if (sequence !== stageTransitionSequence) return;
  el.stageTransition.classList.add("is-leaving");
  if (!prefersReducedMotion()) await wait(180);
  if (sequence !== stageTransitionSequence) return;
  el.stageTransition.hidden = true;
  el.stageTransition.classList.remove("is-leaving");
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
let cloudSavePaused = false;
let cloudSaveInFlight = Promise.resolve(true);

function enqueueCloudSave(snapshot) {
  // Serializa guardados para que una escritura vieja no pise una compra.
  cloudSaveInFlight = cloudSaveInFlight.then(() => window.Cloud.savePetState(currentUsername, snapshot));
  return cloudSaveInFlight;
}

function scheduleCloudSave(s) {
  if (!window.Cloud || !window.Cloud.enabled || !currentUsername) return;
  cloudSavePending = true;
  if (cloudSavePaused) return;
  if (cloudSaveTimer) return;
  cloudSaveTimer = setTimeout(() => {
    cloudSaveTimer = null;
    if (!cloudSavePending || !currentUsername || cloudSavePaused) return;
    cloudSavePending = false;
    enqueueCloudSave(structuredClone(s));
  }, CLOUD_SAVE_DEBOUNCE_MS);
}

function flushCloudSaveNow() {
  if (!window.Cloud || !window.Cloud.enabled || !currentUsername || !state) return Promise.resolve(false);
  if (cloudSaveTimer) {
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = null;
  }
  cloudSavePending = false;
  return enqueueCloudSave(structuredClone(state));
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") flushCloudSaveNow();
});
window.addEventListener("pagehide", flushCloudSaveNow);

// v3.5 (pedido explícito): "agregar estado de conectado/desconectado" —
// el puntito de .hud-status-dot (al lado del nombre, en el cartel de
// ESTADO). "Conectado" acá significa: hay sesión de nube activa (se están
// guardando/sincronizando los cambios en Firestore, currentUsername +
// window.Cloud.enabled) Y el navegador tiene internet en este momento
// (navigator.onLine). Jugando en modo local (sin cuenta, beginLocalOnlySession)
// o sin internet ahora mismo → "desconectado". No afecta en nada al juego
// en sí (las necesidades siguen bajando igual, ver applyDecay), es sólo
// indicador visual.
function isCloudConnected() {
  return !!(window.Cloud && window.Cloud.enabled && currentUsername && navigator.onLine);
}

function updateConnectionIndicator() {
  if (!el.hudStatusDot) return;
  el.hudStatusDot.classList.toggle("is-offline", !isCloudConnected());
}

window.addEventListener("online", updateConnectionIndicator);
window.addEventListener("offline", updateConnectionIndicator);

function makeInlineLayer(innerMarkup, extraClass) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 400 400");
  svg.classList.add("pet-layer");
  String(extraClass || "").split(/\s+/).filter(Boolean).forEach((cls) => svg.classList.add(cls));
  svg.innerHTML = innerMarkup;
  return svg;
}

let clothingRenderId = 0;
function makeClothingLayer(slot, itemId, extraClass) {
  const item = getClothingItem(slot, itemId);
  if (!item?.inline) return null;
  // Cada vista usa su propio degradado, incluso si otra mascota lleva la misma prenda.
  const markup = item.starter ? item.inline.replaceAll(`${item.id}-color`, `${item.id}-color-${++clothingRenderId}`) : item.inline;
  return makeInlineLayer(markup, `pet-layer-clothing pet-layer-clothing-${slot} ${extraClass || ""}`);
}

function alignClothingPart(stageEl, bodySelector, clothingSelector, edge, scale, alignAtJoint = false) {
  const body = stageEl.querySelector(bodySelector);
  const clothing = stageEl.querySelector(clothingSelector);
  if (!body || !clothing || clothing.dataset.aligned === "true") return;
  let bodyBox, clothingBox;
  try {
    bodyBox = body.getBBox();
    clothingBox = clothing.getBBox();
  } catch (_) {
    return;
  }
  if (!bodyBox.width || !clothingBox.width) return;
  const origin = clothing.style.transformOrigin.match(/(-?[\d.]+)px\s+(-?[\d.]+)px/);
  if (!origin) return;
  const originX = Number(origin[1]);
  const originY = Number(origin[2]);
  const bodyCenter = bodyBox.x + bodyBox.width / 2;
  const clothingCenter = clothingBox.x + clothingBox.width / 2;
  const bodyEdge = edge === "top" ? bodyBox.y : bodyBox.y + bodyBox.height;
  const clothingEdge = edge === "top" ? clothingBox.y : clothingBox.y + clothingBox.height;
  // La traslación va dentro del grupo que gira: la manga/calzado conserva
  // exactamente el mismo pivote que el brazo/pierna durante la animación.
  // En brazos diagonales, el centro de la caja completa cae lejos del
  // hombro. La manga comparte el pivote del brazo: alineamos esa unión.
  const bodyOrigin = body.style.transformOrigin.match(/(-?[\d.]+)px\s+(-?[\d.]+)px/);
  const dx = alignAtJoint && bodyOrigin
    ? (Number(bodyOrigin[1]) - originX) / scale
    : (bodyCenter - originX) / scale - (clothingCenter - originX);
  const dy = (bodyEdge - originY) / scale - (clothingEdge - originY);
  const content = document.createElementNS(SVG_NS, "g");
  content.setAttribute("transform", `translate(${dx.toFixed(3)} ${dy.toFixed(3)})`);
  while (clothing.firstChild) content.appendChild(clothing.firstChild);
  clothing.appendChild(content);
  clothing.dataset.aligned = "true";
}

function alignClothingLayers(stageEl) {
  for (const side of ["izq", "der"]) {
    alignClothingPart(stageEl, `#brazo-${side}`, `.pet-layer-clothing-upper-sleeves #ropa-brazo-${side}`, "top", 1.14, true);
    alignClothingPart(stageEl, `#pierna-${side}`, `.pet-layer-clothing-shoes #ropa-calzado-${side}`, "bottom", 1.08);
  }
}

function renderPetLayers(stageEl, look, wardrobe = null) {
  const equipped = wardrobe?.equipped || {};
  const lookKey = JSON.stringify({ look, equipped });
  stageEl.style.setProperty("--pet-body-color", getBodyColorHex(look.bodyColor));
  stageEl.style.setProperty("--eye-color", getEyeColorHex(look.ojosColor));
  stageEl.style.setProperty("--eye-tint-filter", getEyeTintFilter(look.ojosColor));
  if (stageEl.dataset.lookKey === lookKey) {
    alignClothingLayers(stageEl);
    return;
  }
  stageEl.dataset.lookKey = lookKey;

  stageEl.innerHTML = "";

  stageEl.appendChild(makeInlineLayer(PET_LEGS_INLINE, "pet-layer-legs"));
  stageEl.appendChild(makeInlineLayer(PET_TORSO_INLINE, "pet-layer-torso"));

  const shoesLayer = makeClothingLayer("calzado", equipped.calzado, "pet-layer-clothing-shoes");
  if (shoesLayer) stageEl.appendChild(shoesLayer);
  const lowerLayer = makeClothingLayer("inferior", equipped.inferior, "pet-layer-clothing-lower");
  if (lowerLayer) stageEl.appendChild(lowerLayer);

  const orejasOpt = findOption("orejas", look.orejas);
  if (orejasOpt && orejasOpt.inline) {
    stageEl.appendChild(makeInlineLayer(orejasOpt.inline, "pet-layer-orejas"));
  }

  // Beta v1.1: la remera/cuerpo va debajo de los brazos de la mascota.
  // Las mangas se renderizan en una segunda copia, encima de esos brazos.
  const upperBodyLayer = makeClothingLayer("superior", equipped.superior, "pet-layer-clothing-upper pet-layer-clothing-upper-body");
  if (upperBodyLayer) stageEl.appendChild(upperBodyLayer);

  stageEl.appendChild(makeInlineLayer(PET_ARMS_INLINE, "pet-layer-arms"));

  const upperSleevesLayer = makeClothingLayer("superior", equipped.superior, "pet-layer-clothing-upper pet-layer-clothing-upper-sleeves");
  if (upperSleevesLayer) stageEl.appendChild(upperSleevesLayer);

  const cabezaOpt = findOption("cabeza", look.cabeza);
  if (cabezaOpt && cabezaOpt.inline) {
    stageEl.appendChild(makeInlineLayer(cabezaOpt.inline, "pet-layer-cabeza"));
  }
  const accessoryLayer = makeClothingLayer("accesorios", equipped.accesorios, "pet-layer-clothing-accessory");
  if (accessoryLayer && !getClothingItem("accesorios", equipped.accesorios)?.front) stageEl.appendChild(accessoryLayer);

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
  if (accessoryLayer && getClothingItem("accesorios", equipped.accesorios)?.front) stageEl.appendChild(accessoryLayer);
  alignClothingLayers(stageEl);
  requestAnimationFrame(() => {
    if (stageEl.isConnected) alignClothingLayers(stageEl);
  });
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
    const activeStage = el.stageFloor.classList.contains("is-editing")
      ? el.previewStage
      : !el.game.hidden ? el.gameStage : null;
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
let walkDirection = "right";
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
  el.gameStage.querySelectorAll("#pierna-izq, .ropa-pierna-izq, .ropa-calzado-izq").forEach((node) => {
    const scale = node.classList.contains("ropa-calzado") ? 1.08 : node.classList.contains("ropa-pierna") ? 1.07 : 1;
    node.style.transform = `rotate(0deg) scale(${scale})`;
  });
  el.gameStage.querySelectorAll("#pierna-der, .ropa-pierna-der, .ropa-calzado-der").forEach((node) => {
    const scale = node.classList.contains("ropa-calzado") ? 1.08 : node.classList.contains("ropa-pierna") ? 1.07 : 1;
    node.style.transform = `rotate(0deg) scale(${scale})`;
  });
}

function applyLegSwing(stridePhase, intensity) {
  const swing = Math.sin(stridePhase) * LEG_SWING_MAX_DEG * intensity;
  el.gameStage.querySelectorAll("#pierna-izq, .ropa-pierna-izq, .ropa-calzado-izq").forEach((node) => {
    const scale = node.classList.contains("ropa-calzado") ? 1.08 : node.classList.contains("ropa-pierna") ? 1.07 : 1;
    node.style.transform = `rotate(${swing.toFixed(1)}deg) scale(${scale})`;
  });
  el.gameStage.querySelectorAll("#pierna-der, .ropa-pierna-der, .ropa-calzado-der").forEach((node) => {
    const scale = node.classList.contains("ropa-calzado") ? 1.08 : node.classList.contains("ropa-pierna") ? 1.07 : 1;
    node.style.transform = `rotate(${(-swing).toFixed(1)}deg) scale(${scale})`;
  });
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
  return canWalk() && state.stats.energia > PET_CONFIG.energiaMuyCansadaUmbral;
}

function pickNewWalkTarget() {
  walkTarget = Math.random() * walkMax;
  walkSpeed = WALK_SPEED_MIN + Math.random() * (WALK_SPEED_MAX - WALK_SPEED_MIN);
}

function publishLocalMovement(animationOverride) {
  const Multiplayer = window.Multiplayer;
  if (activeVisit && !activeVisit.entranceReady) return;
  if (!Multiplayer || !Multiplayer.enabled || !Multiplayer.connected || !state || el.game.hidden) return;
  const expectedRoom = activeVisit?.usernameLower || currentUsername;
  if (!expectedRoom || Multiplayer.currentRoom !== expectedRoom) return;
  const floorWidth = el.stageFloor.clientWidth;
  const walkerWidth = el.walker.offsetWidth || 200;
  if (!floorWidth) return;
  const centerX = walkX + WALK_PAD + walkerWidth / 2;
  const xPct = clamp(centerX / floorWidth * 100, 4, 96);
  const animation = animationOverride || (state.sleep.dormida
    ? "sleeping"
    : walkState === "walking"
      ? (isRunning ? "running" : "walking")
      : "idle");
  Multiplayer.publishMovement({ xPct, direction: walkDirection, animation });
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
    publishLocalMovement();
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
    if (Math.abs(dist) > 0.1) walkDirection = dist < 0 ? "left" : "right";
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
  publishLocalMovement();
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
    } else if (document.visibilityState === "hidden" && state) {
      publishLocalMovement("idle");
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
    if (event.target.closest(".dirt-item") || event.target.closest("#toy-ball") || event.target.closest("#game-stage")) return;
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

let housingEditing = false;
let housingSelected = null;
let housingDrag = null;
let housingPanelDrag = null;

let inventoryPage = 0;
const INVENTORY_PAGE_SIZE = 8;
const housingGiftSelections = {};

function housingSceneElement(tag, attributes = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attributes).forEach(([name, value]) => {
    if (value !== undefined && value !== null) node.setAttribute(name, String(value));
  });
  return node;
}

function appendWindowWeather(svg, entry, index) {
  const clipId = `housing-window-pane-${index}`;
  const defs = housingSceneElement("defs");
  const clip = housingSceneElement("clipPath", { id: clipId });
  clip.appendChild(housingSceneElement("rect", {
    x: entry.x + 75, y: entry.y + 135, width: 286, height: 238,
  }));
  defs.appendChild(clip);
  svg.appendChild(defs);
  const weather = housingSceneElement("g", {
    class: "housing-window-weather", "clip-path": `url(#${clipId})`, "pointer-events": "none",
  });
  weather.appendChild(housingSceneElement("rect", {
    class: "housing-window-sky", x: entry.x + 75, y: entry.y + 135, width: 286, height: 238,
  }));
  weather.appendChild(housingSceneElement("path", {
    class: "housing-window-horizon",
    d: `M ${entry.x + 75} ${entry.y + 248} L ${entry.x + 361} ${entry.y + 286} L ${entry.x + 361} ${entry.y + 373} L ${entry.x + 75} ${entry.y + 373} Z`,
  }));
  const positioned = housingSceneElement("g", { transform: `translate(${entry.x} ${entry.y})` });
  const first = housingSceneElement("g", { class: "housing-window-cloud cloud-one" });
  first.appendChild(housingSceneElement("path", {
    d: "M 93 194 C 89 186 95 177 105 177 C 109 161 130 155 141 169 C 151 163 164 170 164 181 C 178 181 180 196 167 201 L 103 201 C 98 201 95 198 93 194 Z",
  }));
  const second = housingSceneElement("g", { class: "housing-window-cloud cloud-two" });
  second.appendChild(housingSceneElement("path", {
    d: "M 222 226 C 210 211 219 190 237 190 C 244 169 270 164 283 181 C 299 174 315 184 318 199 C 339 201 346 225 329 236 L 238 238 C 231 238 225 233 222 226 Z",
  }));
  positioned.append(first, second);
  weather.appendChild(positioned);
  svg.appendChild(weather);
}

function renderHousingScene() {
  if (!el.locationDeco) return;
  const housing = activeVisit
    ? normalizeHousing(activeVisit.data?.petState?.housing)
    : state?.housing || defaultHousing();
  const svg = housingSceneElement("svg", {
    id: "housing-scene", viewBox: `0 0 ${HOUSING_WIDTH} ${HOUSING_HEIGHT}`,
    preserveAspectRatio: "xMidYMid slice", width: "100%", height: "100%",
    "aria-hidden": "true",
  });
  const image = (item, x, y, width, height, extra = {}) => {
    const node = housingSceneElement("image", { href: item.asset, x, y, width, height, ...extra });
    svg.appendChild(node);
    return node;
  };
  image(HOUSING_ITEMS[housing.wall] || HOUSING_ITEMS.pared_basica_1, 0, 0, HOUSING_WIDTH, HOUSING_HEIGHT);
  image(HOUSING_ITEMS[housing.floor] || HOUSING_ITEMS.piso_basico_1, 0, HOUSING_FLOOR_Y, HOUSING_WIDTH, HOUSING_HEIGHT - HOUSING_FLOOR_Y);
  let windowIndex = 0;
  housing.placed.forEach((entry) => {
    const item = HOUSING_ITEMS[entry.id];
    if (!item) return;
    image(item, entry.x, entry.y, item.width, item.height, {
      id: item.placement === "wallDoor" ? "scene-puerta" : undefined,
      class: `housing-object${housingSelected?.uid === entry.uid && housingEditing ? " is-selected" : ""}`,
      "data-uid": entry.uid,
    });
    if (item.id === "ventana_madera_1_1") appendWindowWeather(svg, entry, windowIndex++);
  });
  svg.appendChild(housingSceneElement("rect", {
    id: "scene-noche-overlay", x: 0, y: 0, width: HOUSING_WIDTH, height: HOUSING_HEIGHT,
    fill: "#111c39", "pointer-events": "none",
  }));
  el.locationDeco.replaceChildren(svg);
}

function housingPointerPosition(event, svg) {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(svg.getScreenCTM().inverse());
}

/** Aplica la ilustración/etiquetas de un lugar — SIN moverse (eso lo hace
 * goToLocation). Se llama una sola vez al entrar a un lugar (arranque del
 * juego o al terminar una transición), no en cada refreshUI(), para no
 * reiniciar las animaciones de fondo (nubes) a cada rato. */
function setLocationVisuals(locationId) {
  const def = getLocationDef(locationId);
  el.stageFloor.classList.remove(...PET_LOCATIONS.map((l) => "location-" + l.id));
  el.stageFloor.classList.add("location-" + def.id);
  if (el.locationDeco) renderHousingScene();
  if (el.navBtnLabel) el.navBtnLabel.textContent = def.exitLabel;
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
  if (!state || navLock || el.game.hidden || activeVisit) return;
  if (targetId === state.location || minigame) return;
  if (debugSnapshot) {
    const transition = beginStageTransition("Preparando el escenario...");
    state.location = targetId;
    setLocationVisuals(targetId);
    refreshUI();
    computeWalkBounds();
    endStageTransition(transition, targetId === "casa" ? state.housing : null);
    return;
  }
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

  const fromDef = getLocationDef(state.location);
  computeWalkBounds();
  const exitX = fromDef.side === "left" ? 0 : walkMax;
  await animateWalkTo(exitX, walkMs);

  const transition = beginStageTransition(targetId === "casa" ? "Entrando a casa..." : "Saliendo al jardín...");

  state.location = targetId;
  trySave(state);
  setLocationVisuals(targetId);
  computeWalkBounds();
  const toDef = getLocationDef(targetId);
  walkX = clamp(toDef.side === "left" ? 20 : walkMax - 20, 0, walkMax);
  el.walker.style.transform = `translateX(${(walkX + WALK_PAD).toFixed(1)}px)`;
  refreshUI();

  await endStageTransition(transition, targetId === "casa" ? state.housing : null);

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

/* La puerta colocada conserva el aviso de destino futuro. El SVG de la
 * casa se reconstruye al decorarla, por eso se delega el click. */
function setupSceneDoor() {
  if (!el.locationDeco) return;
  el.locationDeco.addEventListener("click", (ev) => {
    const puerta = ev.target.closest("#scene-puerta");
    if (!puerta) return;
    ev.stopPropagation();
    if (housingEditing) return;
    if (!state) return;
    notifySystem("Muy pronto vas a poder elegir a dónde ir desde acá.");
    announce("La puerta todavía no lleva a ningún lado — muy pronto vas a poder elegir a dónde ir.");
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

// v2.4: 7 pestañas de categoría en vez de la grilla de tarjetas de siempre
// (todas las categorías visibles a la vez).
// v3.6.2 (pedido explícito): "arriba del selector de partes deberían estar
// las pestañas (Color, Cabeza, Orejas, Ojos, etc)". "Ojos" ya no abre una
// sub-pestaña aparte para elegir por separado forma/color (como en v3.6):
// ahora conviven a la vez en la misma fila, partes 80% + color 20% — ver
// renderCreatorRow().
const CREATOR_TABS = ["bodyColor", "cabeza", "orejas", "ojos", "narices", "boca", "cejas"];
let activeCreatorTab = "bodyColor";
// true mientras se edita una mascota YA CREADA (no al crearla por primera
// vez) — distinto de "el editor está abierto" (eso es
// #stage-floor.is-editing, ver setStageEditing()). Sólo afecta detalles
// menores que ya existían antes de v3.6.2: título, colores bloqueados de
// bodyColor, emblema/encabezado.
let editingExistingPet = false;

function buildCreatorTabs() {
  if (!el.creatorTabs) return;
  el.creatorTabs.innerHTML = "";
  CREATOR_TABS.forEach((category) => {
    const label = CATEGORY_LABELS[category] || category;
    const btn = document.createElement("button");
    btn.type = "button";
    // v3.6.2: clase nueva ("editor-tab", no "creator-tab") — "creator-tab"
    // sigue en uso, sin tocar, para las pestañas del panel de Amigos (ver
    // #friends-tabs en index.html), que no tienen nada que ver con esto.
    btn.className = "editor-tab";
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

/** v3.6.2 (pedido explícito): tile de una parte/color dentro del selector,
 * con la MISMA estructura que createActionButton() (dock de acciones) —
 * .action-circle-wrap > .cooldown-ring > .action-circle — así el selector
 * queda pixel-igual al dock sin duplicar ningún estilo (ver
 * .stage-actions-row .action-circle-wrap en css/style.css). Sin caption ni
 * cooldown-label, que no aplican acá. */
function createEditorTile({ selected, title, ariaLabel }) {
  const wrap = document.createElement("div");
  wrap.className = "action-circle-wrap";
  const ring = document.createElement("div");
  ring.className = "cooldown-ring";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "action-circle";
  btn.classList.toggle("selected", !!selected);
  btn.title = title;
  btn.setAttribute("aria-label", ariaLabel);
  btn.setAttribute("aria-pressed", selected ? "true" : "false");
  ring.appendChild(btn);
  wrap.appendChild(ring);
  return { wrap, ring, btn };
}

/** v3.6.2 (pedido explícito): reemplaza a renderCreatorSwatchRow()/
 * buildOjosSubtabs(). Decide qué mostrar en el selector según la pestaña
 * activa: "Color" (bodyColor) sólo tiene colores → ocupan el 100% de
 * #creator-color-icons (#creator-part-icons queda vacío/oculto). El resto
 * de las categorías sin color propio (Cabeza/Orejas/Narices/Boca/Cejas)
 * sólo tienen partes → ocupan el 100% de #creator-part-icons, "como
 * ahora" (pedido explícito). "Ojos" es la única categoría con partes Y
 * color a la vez → conviven, partes 80% a la izquierda + color de iris
 * 20% chiquito a la derecha (ver CSS, ambos contenedores son flex-child
 * del mismo #stage-actions-row con flex-grow 4:1). */
function renderCreatorRow() {
  const category = activeCreatorTab;
  const label = CATEGORY_LABELS[category] || category;
  const showParts = category !== "bodyColor";
  const showColors = category === "bodyColor" || category === "ojos";

  if (el.creatorPartIcons) el.creatorPartIcons.hidden = !showParts;
  if (el.creatorColorIcons) el.creatorColorIcons.hidden = !showColors;

  if (showParts) {
    renderCreatorPartIcons(category, label, PET_PARTS_MANIFEST[category]);
  } else if (el.creatorPartIcons) {
    el.creatorPartIcons.innerHTML = "";
  }

  if (showColors) {
    const colorCategory = category === "bodyColor" ? "bodyColor" : "ojosColor";
    const colorLabel = category === "bodyColor" ? "Color" : "Color de ojos";
    const colorOptions = category === "bodyColor" ? PET_PARTS_MANIFEST.bodyColor : PET_EYE_COLORS;
    renderCreatorColorIcons(colorCategory, colorLabel, colorOptions);
  } else if (el.creatorColorIcons) {
    el.creatorColorIcons.innerHTML = "";
  }
}

/** v3.6.2: columna de colores — 100% de ancho cuando es la única fila
 * (bodyColor) o 20% chiquita cuando convive con partes (ojos, ver
 * renderCreatorRow). Mismos tiles que el dock (createEditorTile), más
 * chicos por CSS (#creator-color-icons .action-circle-wrap), con el color
 * de fondo del propio botón en vez de un ícono. Conserva la lógica de
 * colores bloqueados de bodyColor (🔒 "Próximamente") que ya existía en
 * renderCreatorSwatchRow: visibles recién al editar una mascota ya creada,
 * salvo para el Administrador, que los ve desbloqueados desde el
 * principio (creación incluida). */
function renderCreatorColorIcons(category, label, options) {
  if (!el.creatorColorIcons) return;
  el.creatorColorIcons.innerHTML = "";
  el.creatorColorIcons.setAttribute("aria-label", label);

  const admin = typeof isAdmin === "function" && isAdmin();
  const showLocked = category === "bodyColor" ? admin || editingExistingPet : true;

  options.forEach((opt) => {
    if (category === "bodyColor" && opt.locked && !showLocked) return; // ni siquiera se muestra al crear
    const isLocked = category === "bodyColor" && opt.locked && !admin && !state?.unlockedColors?.[opt.id];
    const selected = !isLocked && selectedLook[category] === opt.id;
    const { wrap, btn } = createEditorTile({
      selected,
      title: isLocked ? `${opt.label} (desbloqueable en la tienda)` : opt.label,
      ariaLabel: isLocked ? `${label}: ${opt.label}, en la tienda` : `${label}: ${opt.label}`,
    });
    btn.classList.add("editor-color-swatch");
    btn.style.background = opt.swatch;

    if (isLocked) {
      btn.disabled = true;
      btn.classList.add("editor-color-locked");
      const lock = document.createElement("span");
      lock.className = "swatch-lock-icon";
      lock.setAttribute("aria-hidden", "true");
      lock.textContent = "🔒";
      btn.appendChild(lock);
      el.creatorColorIcons.appendChild(wrap);
      return;
    }

    btn.addEventListener("click", () => {
      selectedLook[category] = opt.id;
      renderPetLayers(el.previewStage, selectedLook);
      renderCreatorColorIcons(category, label, options);
      announce(`${label}: ${opt.label}`);
    });
    el.creatorColorIcons.appendChild(wrap);
  });
}

/* v3.6 (pedido explícito): recorte de encuadre para la miniatura de cada
 * categoría "numerada". "ojos"/"orejas"/"cejas" recortan sólo el lado
 * derecho (pedido explícito: "si es un ojo usar sólo un ojo derecho, lo
 * mismo con las orejas y las cejas") apuntando el viewBox al grupo
 * "*-der" únicamente — como el lado izquierdo queda fuera del recorte, ni
 * hace falta sacarlo del dibujo, alcanza con no mostrarlo.
 *
 * El recorte de cada opción se calcula EN VIVO (getBBox) en vez de tener
 * coordenadas fijas a mano: las orejas en particular varían muchísimo de
 * tamaño entre diseños (una oreja corta y una larga y caída no entran
 * cómodas en un mismo recorte fijo sin que la corta quede minúscula), así
 * que cada miniatura usa el encuadre más ajustado a SU propio dibujo, no
 * uno compartido por categoría — ver iconViewBoxFor().
 *
 * "narices" es la única categoría con arte en archivo aparte (<img>, no
 * inline) — no se puede medir/recortar igual, así que usa un rectángulo
 * fijo (medido a mano una vez sobre los 10 diseños existentes) aplicado
 * por transform en vez de viewBox (ver renderNaricesIcon). */
const ICON_RIGHT_SIDE_ID = { ojos: "ojo-der", orejas: "oreja-der", cejas: "ceja-der" };
const NARICES_ICON_CROP = { x: 180, y: 160, w: 40, h: 35 };

/** Mide (getBBox) la parte que va a mostrar la miniatura — sólo el grupo
 * "*-der" para ojos/orejas/cejas (ver ICON_RIGHT_SIDE_ID), el dibujo
 * entero para cabeza/boca — y devuelve un viewBox ajustado a ese tamaño
 * más un margen, para que cada opción se vea lo más grande y legible
 * posible dentro de su tile sin quedar cortada. */
function iconViewBoxFor(category, inlineMarkup) {
  const probe = document.createElementNS(SVG_NS, "svg");
  probe.setAttribute("viewBox", "0 0 400 400");
  probe.style.position = "absolute";
  probe.style.left = "-9999px";
  probe.style.width = "400px";
  probe.style.height = "400px";
  probe.innerHTML = inlineMarkup;
  document.body.appendChild(probe);
  const rightId = ICON_RIGHT_SIDE_ID[category];
  const target = (rightId && probe.querySelector("#" + rightId)) || probe;
  const bbox = target.getBBox();
  document.body.removeChild(probe);
  if (!bbox.width || !bbox.height) return "0 0 400 400";
  const padX = bbox.width * 0.16 + 3;
  const padY = bbox.height * 0.16 + 3;
  return `${bbox.x - padX} ${bbox.y - padY} ${bbox.width + padX * 2} ${bbox.height + padY * 2}`;
}

/** Miniatura de una opción de "narices" (arte en <img>, no inline como el
 * resto) — ver comentario de CREATOR_ICON_CROPS. Como no se puede recortar
 * un <img> con viewBox, se lo agranda y se lo desplaza con transform
 * (mismo resultado que un viewBox recortado, pero en porcentaje del
 * tamaño del tile así queda bien en cualquier tamaño de pantalla) dentro
 * de un contenedor con overflow:hidden. */
function renderNaricesIcon(fileUrl, altText) {
  const crop = NARICES_ICON_CROP;
  const limiting = Math.max(crop.w, crop.h);
  const sizePct = (400 / limiting) * 100;
  const xPct = -(crop.x / limiting) * 100;
  const displayedHPct = (crop.h / limiting) * 100;
  const displayedWPct = (crop.w / limiting) * 100;
  const yPct = -(crop.y / limiting) * 100 + Math.max(0, (100 - displayedHPct) / 2);
  const xOffsetPct = Math.max(0, (100 - displayedWPct) / 2);
  const holder = document.createElement("span");
  holder.className = "creator-icon-crop";
  const img = document.createElement("img");
  img.src = fileUrl;
  img.alt = altText;
  img.style.width = sizePct + "%";
  img.style.height = sizePct + "%";
  img.style.left = xPct + xOffsetPct + "%";
  img.style.top = yPct + "%";
  holder.appendChild(img);
  return holder;
}

/** Rectángulo horizontal DENTRO de la escena (pedido explícito, ver
 * comentario de renderCreatorRow) para las categorías con partes. Cada
 * opción tiene una miniatura SVG real (no un número) — para ojos/orejas/
 * cejas, sólo el lado derecho (ver ICON_RIGHT_SIDE_ID) — y todas se pintan
 * con el color por defecto.
 * v3.6.2 (pedido explícito): "las partes deberían tener de color
 * predeterminado el azul (así se ve mejor), sería el mismo azul que tiene
 * el color azul del selector de partes" — antes bodyColor[0] (Blanco
 * cálido), ahora bodyColor[1] (Azul cielo, #6CB9DD, el mismo tono que ya
 * se ve en el selector de colores). Los tiles ahora son
 * .action-circle-wrap/.cooldown-ring/.action-circle (ver createEditorTile)
 * en vez de .creator-icon-tile, para quedar pixel-igual al dock de
 * acciones — pedido explícito. */
function renderCreatorPartIcons(category, label, options) {
  if (!el.creatorPartIcons) return;
  el.creatorPartIcons.innerHTML = "";
  el.creatorPartIcons.setAttribute("aria-label", label);

  const defaultBodyColor = PET_PARTS_MANIFEST.bodyColor[1].swatch;
  const defaultEyeColor = PET_EYE_COLORS[0].swatch;
  const defaultEyeTint = PET_EYE_COLORS[0].tint || "none";

  options.forEach((opt) => {
    const selected = selectedLook[category] === opt.id;
    const { wrap, btn } = createEditorTile({
      selected,
      title: opt.label,
      ariaLabel: `${label}: ${opt.label}`,
    });
    btn.classList.add("editor-part-tile");

    if (category === "narices" && opt.file) {
      btn.appendChild(renderNaricesIcon(opt.file, label));
    } else if (opt.inline) {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("viewBox", iconViewBoxFor(category, opt.inline));
      svg.classList.add("creator-icon-svg");
      svg.style.setProperty("--pet-body-color", defaultBodyColor);
      svg.style.setProperty("--eye-color", defaultEyeColor);
      svg.style.setProperty("--eye-tint-filter", defaultEyeTint);
      svg.innerHTML = opt.inline;
      btn.appendChild(svg);
    }

    btn.addEventListener("click", () => {
      selectedLook[category] = opt.id;
      renderPetLayers(el.previewStage, selectedLook);
      renderCreatorPartIcons(category, label, options);
      announce(`${label}: ${opt.label}`);
    });
    el.creatorPartIcons.appendChild(wrap);
  });
}

function renderCreatorPanel() {
  if (el.creatorTabs) {
    CREATOR_TABS.forEach((category) => {
      const btn = document.getElementById("creator-tab-" + category);
      if (btn) btn.setAttribute("aria-selected", category === activeCreatorTab ? "true" : "false");
    });
  }
  renderCreatorRow();
}

function randomizeLook() {
  const admin = typeof isAdmin === "function" && isAdmin();
  Object.keys(PET_PARTS_MANIFEST).forEach((category) => {
    // v3.4: "Aleatorio" nunca sortea un color todavía bloqueado para
    // alguien que no sea el Administrador (serían colores "próximamente").
    const allOpts = PET_PARTS_MANIFEST[category];
    const opts = admin ? allOpts : allOpts.filter((o) => !o.locked || state?.unlockedColors?.[o.id]);
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

// v3.6.2 (pedido explícito): "hacer que #stage-floor sea multiuso... así
// juntamos todo en una sola ventana de juego" — reemplaza al viejo par de
// <main> #onboarding/#game (mutuamente excluyentes) por una sola clase de
// estado en #stage-floor. Todos los elementos de juego llevan la clase
// "play-only" y todos los del editor "editor-only" (ver index.html); el
// CSS se encarga de mostrar unos u otros según esta clase (ver
// #stage-floor.is-editing en css/style.css) — acá sólo hace falta
// prender/apagar la clase, cada elemento sigue manejando su propio
// hidden/lógica interna (p.ej. #creator-color-icons según la categoría,
// ver renderCreatorRow) sin que este toggle se las pise.
// Elementos "de editor" de nivel superior que antes vivían todos juntos
// bajo el mismo <main id="onboarding"> y se mostraban/ocultaban con un
// solo hidden — ahora que cada uno es su propio hijo directo de
// #stage-floor (ver index.html), hace falta prender/apagar el hidden de
// cada uno acá. #editor-welcome es aparte (depende de si se está editando
// una mascota YA CREADA, no sólo de si el editor está abierto — ver
// openOnboarding) y #creator-part-icons/#creator-color-icons son aparte
// también (dependen de la categoría activa, ver renderCreatorRow) — el
// CSS (#stage-floor:not(.is-editing) .editor-only) los sigue ocultando a
// todos igual apenas se cierra el editor, así que no hace falta forzarlos
// acá para el caso "cerrar".
const EDITOR_TOP_LEVEL_IDS = ["editor-name-card", "btn-aleatorio", "preview-stage-pos", "creator-tabs-row"];

function setStageEditing(active) {
  if (active && housingEditing) stopHousingEdit();
  if (el.stageFloor) el.stageFloor.classList.toggle("is-editing", active);
  EDITOR_TOP_LEVEL_IDS.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.hidden = !active;
  });
  if (!active && el.editorWelcome) el.editorWelcome.hidden = true;
  // Recalcula la posición de #creator-tabs-row/#feed-menu apenas cambia
  // qué se ve dentro de #stage-actions-row — no siempre dispara al
  // ResizeObserver que ya observa ese elemento (ver más abajo) si el alto
  // del dock no cambia de un frame al otro.
  if (typeof syncHudLayout === "function") syncHudLayout();
}

function openOnboarding(existingState) {
  if (activeVisit) closeVisit({ skipTransition: true });
  document.getElementById("game-selector").hidden = true;
  if (navLock) return;
  finishMinigame(true);
  closeAllMenus();
  const transition = beginStageTransition(existingState ? "Abriendo el editor..." : "Preparando tu mascota...");
  editingExistingPet = !!existingState;
  selectedLook = existingState ? { ...defaultLook(), ...existingState.look } : defaultLook();
  el.nameInput.value = existingState ? existingState.name : "";
  clearNameError();
  el.onboardingTitle.textContent = existingState ? "Editá tu mascota" : "Creá tu mascota";
  el.onboardingSubmit.textContent = existingState ? "Guardar cambios" : "Crear mascota";
  if (el.onboardingCancel) el.onboardingCancel.hidden = !existingState;
  // v2.6: pedido explícito — el emblema+título grandes (#editor-welcome)
  // sólo se ven al CREAR (no al editar), y el encabezado entero desaparece
  // sólo mientras se crea una mascota por primera vez (durante la edición
  // se mantiene, con el menú de Opciones disponible como siempre).
  if (el.editorWelcome) el.editorWelcome.hidden = editingExistingPet;
  if (el.appHeader) el.appHeader.hidden = !existingState;
  activeCreatorTab = "bodyColor";
  buildCreatorTabs();
  renderCreatorPanel();
  renderPetLayers(el.previewStage, selectedLook);
  setStageEditing(true);
  el.game.hidden = false;
  endStageTransition(transition);
}

function cancelOnboarding() {
  const transition = beginStageTransition("Volviendo al juego...");
  setStageEditing(false);
  editingExistingPet = false;
  if (el.appHeader) el.appHeader.hidden = false;
  endStageTransition(transition, state?.location === "casa" ? state.housing : null);
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
  const transition = beginStageTransition("Guardando tu mascota...");
  const name = rawName.trim();
  const cleanLook = normalizeLook(selectedLook);
  if (state) {
    // Editar la apariencia NO cambia el lugar actual (pedido explícito,
    // sección 4) — state.location queda tal cual estaba.
    state.name = name;
    state.look = cleanLook;
    trySave(state);
  } else {
    state = createNewState(name, cleanLook, pendingHousingGiftForAccount ? "pending" : "none");
    trySave(state);
  }
  setStageEditing(false);
  editingExistingPet = false;
  if (el.appHeader) el.appHeader.hidden = false;
  startGame(transition);
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
  if (el.wellbeingAvatarStage) renderPetLayers(el.wellbeingAvatarStage, state.look, state.wardrobe);
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
  el.wellbeingAvatar.classList.add("avatar-border-" + tier);

  const stage = el.wellbeingAvatarStage;
  stage.classList.remove("mood-feliz", "mood-normal", "mood-triste", "mood-critico");
  const mood = moodFromStats(state.stats);
  stage.classList.add("mood-" + mood);
  stage.classList.remove("sick");
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
  // v3.5: pedido explícito — "el cartel de objetivos que se cierre cuando
  // ya se completaron todos". ensureDailyProgress() ya resetea
  // state.daily (y por lo tanto `done`) al cambiar de día, así que el
  // cartel vuelve a aparecer solo al otro día sin que haga falta ningún
  // botón para reabrirlo.
  if (el.dailyCard) el.dailyCard.hidden = done >= 3;
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
function computeEyeScale(stats) {
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
  const mood = moodFromStats(state.stats);
  stage.classList.add("mood-" + mood);
  stage.classList.toggle("sleeping", state.sleep.dormida);
  stage.classList.remove("sick");
  // Respaldo para navegadores sin :has().
  el.walker.classList.toggle("is-sleeping", state.sleep.dormida);
  stage.style.setProperty("--eye-scale", state.sleep.dormida ? 0.04 : computeEyeScale(state.stats));
  stage.setAttribute("aria-label", `${state.name}, tu mascota: ${describeMoodForAria(mood)}`);
  if (mood === "critico" && !wasUrgent) {
    announce(`${state.name} necesita atención urgente.`);
  }
}

function describeMoodForAria(mood) {
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
    const editing = el.stageFloor && el.stageFloor.classList.contains("is-editing");
    if (!el.game.hidden && !editing) blinkStage(el.gameStage);
    if (editing) blinkStage(el.previewStage);
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
  // v3.5: pedido explícito — se sacó el cartel de reloj (#time-card, con
  // hora + Mañana/Tarde/Noche); sólo queda el cálculo de día/noche para
  // la escena (.is-night sobre #stage-floor sigue vivo).
  if (el.stageFloor) el.stageFloor.classList.toggle("is-night", isNightNow(now));
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
  const visibleDirt = activeVisit
    ? activeVisit.data?.petState?.dirt?.casa || []
    : state.dirt[state.location];
  visibleDirt.forEach((d) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dirt-item";
    btn.style.left = d.xPct + "%";
    btn.style.top = d.yPct + "%";
    btn.setAttribute("aria-label", activeVisit ? "Suciedad de la casa anfitriona" : "Retirar suciedad del escenario");
    btn.innerHTML = '<img src="assets/items/poop.svg" alt="" />';
    if (activeVisit || state.sleep.dormida) {
      btn.disabled = true;
      btn.tabIndex = -1;
    } else {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        removeDirt(d.id);
      });
    }
    el.dirtLayer.appendChild(btn);
  });
}

function removeDirt(id) {
  if (!state || state.sleep.dormida || activeVisit) return;
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
  emitRealtimeAction("clean");
}

// ---------- Refresco general ----------

function refreshUI() {
  el.petName.textContent = state.name;
  renderPetLayers(el.gameStage, state.look, state.wardrobe);
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
  updateSleepToggle();
  updateActionsAvailability();
  updateConnectionIndicator();
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
    emitRealtimeAction("poop");
  }
  trySave(state);
  refreshUI();
  updateCooldownButtons();
  maybeShowRequest();
  return info;
}

function startGame(transition = null) {
  const transitionId = transition || beginStageTransition("Preparando tu casa...");
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
  endStageTransition(transitionId, state.location === "casa" ? state.housing : null).then(() => {
    if (transitionId !== stageTransitionSequence) return;
    maybeShowBetaWelcomeGift();
    maybeShowHousingGift();
  });
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
      showBubble(chooseRequestPhrase("feliz"), cfg.burbujaVisibleMs);
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

  const frase = chooseRequestPhrase(pick.categoria);
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

// v3.4: bug reportado — el cooldown mostraba siempre segundos crudos (ej.
// "873s" para la pesca, que tiene 15 minutos de espera), sin convertir a
// minutos. formatCooldownLabel() es para el numerito corto sobre el botón
// (mm:ss una vez pasa el minuto); formatCooldownPhrase() es para las
// frases tipo "Podés volver a alimentar en ___." (minutos redondeados
// hacia arriba, más fácil de leer que "873 s").
function formatCooldownLabel(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatCooldownPhrase(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  if (totalSeconds < 60) return `${totalSeconds} s`;
  return `${Math.ceil(totalSeconds / 60)} min`;
}

// Registro de botones de acción con cooldown (se llena en buildActionsDock).
const actionRegistry = {};

function updateCooldownButtons() {
  if (!state) return;
  Object.keys(actionRegistry).forEach((key) => {
    const { btnEl, ringEl, labelEl, isFull } = actionRegistry[key];
    const until = (state.cooldowns && state.cooldowns[key]) || 0;
    const remainingMs = until - Date.now();
    ringEl?.classList.toggle("is-cooling-down", remainingMs > 0 && key !== "hablar" && key !== "jugar");
    // Los paneles siguen disponibles durante el sueño; el jabón queda bloqueado.
    const blockedByState = state.sleep.dormida && key === "bañar";
    if (key === "hablar" || key === "jugar") { btnEl.disabled = key === "jugar" && state.sleep.dormida; if (labelEl) labelEl.textContent = ""; return; }
    if (remainingMs > 0) {
      btnEl.disabled = true;
      const total = PET_CONFIG.cooldownsMs[key] || PET_CONFIG.cooldownMs;
      const pct = clamp(((total - remainingMs) / total) * 100, 0, 100);
      if (ringEl) ringEl.style.setProperty("--pct", pct.toFixed(1));
      if (ringEl) ringEl.style.setProperty("--pct-css", pct.toFixed(1) + "%");
      if (labelEl) labelEl.textContent = formatCooldownLabel(remainingMs);
    } else {
      btnEl.disabled = blockedByState || (isFull ? isFull() : false);
      if (ringEl) ringEl.style.setProperty("--pct", 0);
      if (ringEl) ringEl.style.setProperty("--pct-css", "0%");
      if (labelEl) labelEl.textContent = "";
    }
  });
  updateActionsAvailability();
  if (!el.feedMenu.hidden) refreshFeedMenuState();
  if (el.inventoryOverlay && !el.inventoryOverlay.hidden) refreshInventory();
}

/** Cosas que no dependen de cooldown: mostrar/ocultar el botón de
 * Medicina (sólo si está enferma) y el tooltip de Jugar. */
function updateActionsAvailability() {
  const decorate = document.getElementById("housing-edit-open");
  if (decorate) decorate.hidden = !state || !!activeVisit || el.game.hidden;
  const jugarWrap = document.getElementById("action-wrap-jugar");
  if (jugarWrap) jugarWrap.title = state.stats.energia < PET_CONFIG.play.energiaMinimaParaJugar ? "Está muy cansada para jugar" : "";
  const attention = {
    inventario: state.stats.saciedad < PET_CONFIG.mood.normal || state.stats.hidratacion < PET_CONFIG.mood.normal,
    bañar: state.stats.higiene < PET_CONFIG.mood.normal,
    dormir: state.stats.energia < PET_CONFIG.mood.normal,
    jugar: state.stats.felicidad < PET_CONFIG.mood.normal,
  };
  Object.entries(attention).forEach(([key, on]) => {
    document.getElementById("action-wrap-" + key)?.classList.toggle("needs-attention", !!on);
  });
}

const lastRequestPhrase = {};
function chooseRequestPhrase(category) {
  const options = PET_REQUEST_PHRASES[category] || PET_REQUEST_PHRASES.feliz;
  const pool = options.length > 1 ? options.filter((phrase) => phrase !== lastRequestPhrase[category]) : options;
  const phrase = pool[Math.floor(Math.random() * pool.length)];
  lastRequestPhrase[category] = phrase;
  return phrase;
}

// ---------- Construcción del dock de acciones ----------

const ACTION_ICON_FILES = {
  inventario: "05-chest.svg", ropa: "01-remera.svg", dormir: "02-luna.svg",
  despertar: "03-sol.svg", jugar: "04-pelota.svg", tienda: "05-bolsa.svg", limpiar: "06-jabon.svg",
};

function actionIconMarkup(icon) {
  return `<img class="action-art" src="assets/ui/actions/${ACTION_ICON_FILES[icon]}" alt="" draggable="false" />`;
}

function syncActionPanels() {
  for (const [key, overlay] of [["inventario", el.inventoryOverlay], ["ropa", el.wardrobeOverlay], ["tienda", el.shopOverlay]]) {
    document.getElementById("btn-" + key)?.setAttribute("aria-expanded", String(!overlay.hidden));
  }
}

const actionPanelObserver = new MutationObserver(syncActionPanels);

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
  btn.innerHTML = actionIconMarkup(icon);
  ring.appendChild(btn);
  wrap.appendChild(ring);
  const caption = document.createElement("span");
  caption.className = "action-circle-caption";
  caption.textContent = label;
  // Keep the accessible name on the button; the dock has no visible captions.
  const cd = document.createElement("span");
  cd.className = "cooldown-label";
  cd.id = id + "-cooldown";
  btn.setAttribute("aria-describedby", cd.id);
  ring.appendChild(cd);
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
    { key: "inventario", icon: "inventario", label: "Inventario", handler: openInventory, noCooldown: true },
    { key: "ropa", icon: "ropa", label: "Ropa", handler: openWardrobe, noCooldown: true },
    { key: "tienda", icon: "tienda", label: "Tienda", handler: openShop, noCooldown: true },
    { key: "dormir", icon: "dormir", label: "Dormir", handler: toggleSueño, noCooldown: true },
    { key: "jugar", icon: "jugar", label: "Jugar", handler: doJugar },
    { key: "bañar", icon: "limpiar", label: "Limpiar", visualClass: "limpiar", handler: doBañar, isFull: () => state.stats.higiene >= PET_CONFIG.llenaUmbral },
  ];

  const groups = ["Objetos y personalización", "Cuidado y juego"].map((label) => {
    const group = document.createElement("div");
    group.className = "action-group";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", label);
    el.actionsDock.appendChild(group);
    return group;
  });
  defs.forEach((def, index) => {
    const { wrap, ring, btn, cd, caption } = createActionButton({ key: def.key, icon: def.icon, label: def.label, id: "btn-" + def.key, visualClass: def.visualClass });
    btn.addEventListener("click", def.handler);
    btn.disabled = !!def.disabled;
    if (def.disabled) wrap.classList.add("is-disabled");
    groups[index < 3 ? 0 : 1].appendChild(wrap);
    if (!def.noCooldown) {
      actionRegistry[def.key] = { btnEl: btn, ringEl: ring, labelEl: cd, captionEl: caption, isFull: def.isFull };
    } else {
      actionRegistry[def.key] = { btnEl: btn, ringEl: null, labelEl: null, captionEl: caption, isFull: def.isFull };
    }
  });
  // El tile de "dormir" arranca mostrando su ícono/etiqueta correctos
  // (refreshUI() lo vuelve a ajustar en cada refresco, ver
  // updateSleepToggle() más abajo).
  updateSleepToggle();
  for (const [key, overlay] of [["inventario", el.inventoryOverlay], ["ropa", el.wardrobeOverlay], ["tienda", el.shopOverlay]]) {
    const button = document.getElementById("btn-" + key);
    button.setAttribute("aria-controls", overlay.id);
    button.setAttribute("aria-haspopup", "dialog");
    actionPanelObserver.observe(overlay, { attributes: true, attributeFilter: ["hidden"] });
  }
  syncActionPanels();
}

// ---------- Beta v1.2: inventario, vestidor y regalo de bienvenida ----------

function refreshInventory() {
  if (!state) return;
  if (el.inventoryFishCount) el.inventoryFishCount.textContent = String(Math.max(0, Number(state.inventory?.pescado) || 0));
  const sleeping = !!state.sleep?.dormida;
  const fishCooldown = isOnCooldown("pescado");
  const waterCooldown = isOnCooldown("beber");
  const fishStock = Math.max(0, Number(state.inventory?.pescado) || 0);
  el.inventoryFish?.classList.toggle("is-cooling-down", fishCooldown && fishStock > 0);
  el.inventoryWater?.classList.toggle("is-cooling-down", waterCooldown);
  if (el.inventoryFish) {
    // Sin stock, el mismo recuadro se transforma en acceso a Pesca.
    el.inventoryFish.disabled = fishStock > 0 && (sleeping || fishCooldown || state.stats.saciedad >= PET_CONFIG.llenaUmbral);
    el.inventoryFish.setAttribute("aria-label", fishStock > 0 ? "Dar pescado" : "Pescar para conseguir comida");
  }
  if (el.inventoryFishCooldown) {
    const remaining = Math.max(0, (state.cooldowns?.pescado || 0) - Date.now());
    el.inventoryFishCooldown.hidden = !fishCooldown || fishStock === 0;
    el.inventoryFishCooldown.textContent = fishCooldown ? formatCooldownLabel(remaining) : "";
  }
  if (el.inventoryFishCatch) el.inventoryFishCatch.hidden = fishStock > 0;
  if (el.inventoryWater) el.inventoryWater.disabled = sleeping || waterCooldown || state.stats.hidratacion >= PET_CONFIG.llenaUmbral;
  if (el.inventoryWaterCooldown) {
    const remaining = Math.max(0, (state.cooldowns?.beber || 0) - Date.now());
    el.inventoryWaterCooldown.hidden = !waterCooldown;
    el.inventoryWaterCooldown.textContent = waterCooldown ? formatCooldownLabel(remaining) : "";
  }
  if (el.inventoryStatus) {
    el.inventoryStatus.textContent = sleeping ? "" : "Elegí un objeto para usarlo. La botella de agua es infinita.";
  }
}

function openInventory() {
  refreshInventory();
  inventoryPage = 0;
  renderInventoryPage();
  el.inventoryOverlay.hidden = false;
  el.inventoryFish?.focus();
}

function closeInventory() {
  if (el.inventoryOverlay) el.inventoryOverlay.hidden = true;
}

function renderWardrobe() {
  if (!state || !el.wardrobeGrid || !wardrobeDraft) return;
  const slot = wardrobeSlotActive;
  const equipped = wardrobeDraft[slot];
  const items = (CLOTHING_CATALOG[slot] || []).filter(item => state.wardrobe.owned[slot]?.[item.id]);
  const pages = Math.max(1, Math.ceil(items.length / 6));
  wardrobePage = Math.min(wardrobePage, pages - 1);
  el.wardrobeGrid.replaceChildren();
  items.slice(wardrobePage * 6, wardrobePage * 6 + 6).forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wardrobe-item" + (equipped === item.id ? " is-selected" : "");
    button.dataset.itemId = item.id;
    button.setAttribute("aria-label", item.label || `Prenda ${item.setId}`);
    button.setAttribute("aria-pressed", String(equipped === item.id));
    button.title = item.label || `Prenda ${item.setId}`;
    const image = document.createElement("img"); image.src = /^conjunto[12]_(superior|inferior|calzado)$/.test(item.id) ? item.asset.replace("assets/clothes/", "assets/clothes/previews/") : item.asset; image.alt = "";
    button.append(image); el.wardrobeGrid.append(button);
  });
  el.wardrobeTabs.querySelectorAll('[data-slot]').forEach(button => {
    const active = button.dataset.slot === slot;
    button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active));
  });
  el.wardrobeEmpty.hidden = items.length > 0;
  document.getElementById('wardrobe-prev').hidden = wardrobePage === 0;
  document.getElementById('wardrobe-next').hidden = wardrobePage === pages - 1;
  document.getElementById('wardrobe-page').textContent = `${wardrobePage + 1} / ${pages}`;
  const preview = document.getElementById('wardrobe-preview');
  renderPetLayers(preview, state.look, { equipped: wardrobeDraft });
  // El personaje y la tarima comparten coordenadas: los pies apoyan en y=318.
  preview.querySelectorAll('svg.pet-layer').forEach(layer => layer.setAttribute('viewBox', '75 0 250 385'));
  if (!preview.querySelector('.dressing-platform')) {
    const platform = document.createElement('img');
    platform.src = 'assets/ui/wardrobe/tarima.svg'; platform.alt = '';
    platform.className = 'pet-layer dressing-platform';
    preview.prepend(platform);
  }
}

function openWardrobe() {
  if (!state?.wardrobe) return;
  state.wardrobe = normalizeWardrobe(state.wardrobe);
  wardrobeDraft = { ...state.wardrobe.equipped };
  wardrobeSlotActive = "superior"; wardrobePage = 0;
  el.wardrobeOverlay.hidden = false;
  renderWardrobe();
  el.wardrobeClose?.focus();
}

function closeWardrobe() {
  wardrobeDraft = null;
  if (el.wardrobeOverlay) el.wardrobeOverlay.hidden = true;
}

function saveWardrobe() {
  if (!wardrobeDraft || !state?.wardrobe) return;
  for (const slot of WARDROBE_SLOTS) {
    const id = wardrobeDraft[slot];
    state.wardrobe.equipped[slot] = id && state.wardrobe.owned[slot]?.[id] && getClothingItem(slot, id) ? id : null;
  }
  trySave(state); refreshUI(); flushCloudSaveNow(); closeWardrobe();
}

function renderBetaWelcomeOptions() {
  if (!el.betaWelcomeOptions) return;
  el.betaWelcomeOptions.innerHTML = "";
  BETA_WELCOME_SETS.forEach((set, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "beta-welcome-choice";
    button.dataset.setId = set.id;
    button.setAttribute("aria-label", `Opción ${index + 1}`);
    const image = document.createElement("img");
    image.src = set.preview;
    image.alt = `Ilustración del conjunto ${index + 1}`;
    const label = document.createElement("strong");
    label.textContent = `Opción ${index + 1}`;
    button.append(image, label);
    el.betaWelcomeOptions.appendChild(button);
  });
}

function maybeShowBetaWelcomeGift() {
  if (!state?.wardrobe || state.wardrobe.betaWelcomeClaimed || el.game.hidden || el.stageFloor?.classList.contains("is-editing")) return;
  renderBetaWelcomeOptions();
  el.betaWelcomeOverlay.hidden = false;
  requestAnimationFrame(() => el.betaWelcomeOptions?.querySelector("button")?.focus());
}

function claimBetaWelcomeSet(setId) {
  if (!state?.wardrobe || state.wardrobe.betaWelcomeClaimed) return;
  const set = BETA_WELCOME_SETS.find((entry) => entry.id === setId);
  if (!set) return;
  Object.entries(set.items).forEach(([slot, itemId]) => {
    state.wardrobe.owned[slot][itemId] = true;
    state.wardrobe.equipped[slot] = itemId;
  });
  state.wardrobe.betaWelcomeClaimed = true;
  state.wardrobe.betaWelcomeSet = set.id;
  el.betaWelcomeOverlay.hidden = true;
  trySave(state);
  flushCloudSaveNow();
  refreshUI();
  notifySystem("¡Regalo recibido! Ya podés combinar las tres prendas desde Ropa.");
  requestAnimationFrame(maybeShowHousingGift);
}

function maybeShowHousingGift() {
  if (!state?.housing || state.housing.giftStatus !== "pending" || !state.wardrobe?.betaWelcomeClaimed
    || el.game.hidden || el.stageFloor?.classList.contains("is-editing")) return;
  renderHousingGift();
  el.housingGiftOverlay.hidden = false;
  requestAnimationFrame(() => el.housingGiftGroups?.querySelector("button")?.focus());
}

function renderHousingGift() {
  el.housingGiftGroups.replaceChildren();
  HOUSING_GIFT_MODELS.forEach((model) => {
    const variants = Object.values(HOUSING_ITEMS).filter((item) => item.model === model);
    const group = document.createElement("section");
    group.className = "housing-gift-group";
    const heading = document.createElement("h3");
    heading.textContent = variants[0]?.label.split(" · ")[0] || model;
    group.appendChild(heading);
    const choices = document.createElement("div");
    choices.className = "housing-gift-choices";
    variants.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "housing-gift-choice" + (housingGiftSelections[model] === item.id ? " is-selected" : "");
      button.dataset.giftId = item.id;
      button.setAttribute("aria-pressed", String(housingGiftSelections[model] === item.id));
      const preview = document.createElement("img");
      preview.src = item.asset;
      preview.alt = "";
      const label = document.createElement("span");
      label.textContent = variants.length === 1 ? "Elegir" : `Opción ${index + 1}`;
      button.append(preview, label);
      choices.appendChild(button);
    });
    group.appendChild(choices);
    el.housingGiftGroups.appendChild(group);
  });
  el.housingGiftClaim.disabled = !HOUSING_GIFT_MODELS.every((model) => housingGiftSelections[model]);
  const selectedCount = HOUSING_GIFT_MODELS.filter((model) => housingGiftSelections[model]).length;
  el.housingGiftStatus.textContent = `${selectedCount} de 4 regalos elegidos`;
}

function claimHousingGift() {
  if (state?.housing?.giftStatus !== "pending") return;
  if (!HOUSING_GIFT_MODELS.every((model) => HOUSING_ITEMS[housingGiftSelections[model]]?.model === model)) return;
  HOUSING_GIFT_MODELS.forEach((model) => {
    const id = housingGiftSelections[model];
    state.housing.owned[id] = (state.housing.owned[id] || 0) + 1;
  });
  state.housing.giftStatus = "claimed";
  el.housingGiftOverlay.hidden = true;
  trySave(state);
  flushCloudSaveNow();
  notifySystem("¡Tus cuatro regalos para la casa están en el inventario!");
}

function renderInventoryPage() {
  const items = [...el.inventoryFoodGrid.querySelectorAll('.inventory-item')];
  const pageCount = Math.max(1, Math.ceil(items.length / INVENTORY_PAGE_SIZE));
  inventoryPage = Math.max(0, Math.min(inventoryPage, pageCount - 1));
  items.forEach((item, index) => { item.hidden = Math.floor(index / INVENTORY_PAGE_SIZE) !== inventoryPage; });
  document.getElementById('inventory-pages').hidden = pageCount <= 1;
  document.getElementById('inventory-prev').hidden = inventoryPage === 0;
  document.getElementById('inventory-next').hidden = inventoryPage === pageCount - 1;
  document.getElementById('inventory-page-status').textContent = `Página ${inventoryPage + 1} de ${pageCount}`;
}
function renderHousingEditorItems() {
  if (!state?.housing || !el.housingEditorItems) return;
  el.housingEditorItems.replaceChildren();
  Object.values(HOUSING_ITEMS).filter((item) => state.housing.owned[item.id]).forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.housingId = item.id;
    button.className = "housing-editor-item";
    if (housingSelected?.id === item.id) button.classList.add("is-selected");
    if (state.housing.wall === item.id || state.housing.floor === item.id) button.classList.add("is-equipped");
    const image = document.createElement("img");
    image.src = item.asset;
    image.alt = "";
    const label = document.createElement("span");
    label.textContent = item.label;
    button.append(image, label);
    el.housingEditorItems.appendChild(button);
  });
  el.housingEditorRemove.hidden = !housingSelected?.uid;
}

function startHousingEdit() {
  if (!state?.housing || activeVisit || el.game.hidden) return;
  closeInventory();
  closeAllMenus();
  housingEditing = true;
  housingSelected = null;
  el.stageFloor.classList.add("is-decorating");
  el.housingEditorPanel.hidden = false;
  clampHousingEditorPanel();
  renderHousingEditorItems();
  renderHousingScene();
}

function stopHousingEdit() {
  housingEditing = false;
  housingSelected = null;
  housingDrag = null;
  housingPanelDrag = null;
  el.stageFloor.classList.remove("is-decorating");
  el.housingEditorPanel.hidden = true;
  renderHousingScene();
}

function selectHousingItem(id) {
  const item = HOUSING_ITEMS[id];
  if (!item || !state.housing.owned[id]) return;
  if (item.category === "wall" || item.category === "floor") {
    state.housing[item.category] = id;
    housingSelected = null;
    trySave(state);
    renderHousingScene();
  } else {
    const placed = state.housing.placed.find((entry) => entry.id === id);
    housingSelected = { id, uid: placed?.uid || null };
    el.housingEditorHint.textContent = placed
      ? "Arrastrá el objeto o tocá otra posición válida para moverlo."
      : "Tocá una posición válida en la casa para colocar el objeto.";
    renderHousingScene();
  }
  renderHousingEditorItems();
}

function placeHousingAt(event, svg) {
  if (!housingSelected) return;
  const item = HOUSING_ITEMS[housingSelected.id];
  const pointer = housingPointerPosition(event, svg);
  const position = housingPosition(item, pointer.x - item.width / 2, pointer.y - item.height / 2);
  if (!canPlaceHousing(item, position, state.housing.placed, housingSelected.uid)) {
    el.housingEditorHint.textContent = "Esa posición se superpone con otro objeto. Elegí un espacio libre.";
    return;
  }
  if (housingSelected.uid) {
    const entry = state.housing.placed.find((placed) => placed.uid === housingSelected.uid);
    if (!entry) return;
    Object.assign(entry, position);
  } else {
    const placedCount = state.housing.placed.filter((entry) => entry.id === item.id).length;
    if (placedCount >= state.housing.owned[item.id]) return;
    const uid = `housing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    state.housing.placed.push({ uid, id: item.id, ...position });
    housingSelected.uid = uid;
  }
  trySave(state);
  renderHousingScene();
  renderHousingEditorItems();
}

function clampHousingEditorPanel() {
  const panel = el.housingEditorPanel;
  const floor = el.stageFloor;
  if (!panel || !floor || panel.hidden || !panel.style.left) return;
  const left = clampHousing(panel.offsetLeft, 0, Math.max(0, floor.clientWidth - panel.offsetWidth));
  const top = clampHousing(panel.offsetTop, 0, Math.max(0, floor.clientHeight - panel.offsetHeight));
  panel.style.left = `${left}px`;
  panel.style.top = `${top}px`;
}

function setupHousingUI() {
  el.housingEditorHeading?.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    event.preventDefault();
    event.stopPropagation();
    const panel = el.housingEditorPanel;
    housingPanelDrag = { x: event.clientX, y: event.clientY, left: panel.offsetLeft, top: panel.offsetTop };
    panel.style.left = `${housingPanelDrag.left}px`;
    panel.style.right = "auto";
    el.housingEditorHeading.setPointerCapture(event.pointerId);
  });
  el.housingEditorHeading?.addEventListener("pointermove", (event) => {
    if (!housingPanelDrag) return;
    const panel = el.housingEditorPanel;
    const floor = el.stageFloor;
    panel.style.left = `${clampHousing(housingPanelDrag.left + event.clientX - housingPanelDrag.x, 0, Math.max(0, floor.clientWidth - panel.offsetWidth))}px`;
    panel.style.top = `${clampHousing(housingPanelDrag.top + event.clientY - housingPanelDrag.y, 0, Math.max(0, floor.clientHeight - panel.offsetHeight))}px`;
  });
  const stopPanelDrag = () => { housingPanelDrag = null; };
  el.housingEditorHeading?.addEventListener("pointerup", stopPanelDrag);
  el.housingEditorHeading?.addEventListener("pointercancel", stopPanelDrag);
  el.housingEditorToggle?.addEventListener("click", () => {
    const collapsed = el.housingEditorPanel.classList.toggle("is-collapsed");
    el.housingEditorToggle.textContent = collapsed ? "Expandir" : "Contraer";
    el.housingEditorToggle.setAttribute("aria-expanded", String(!collapsed));
    clampHousingEditorPanel();
  });
  window.addEventListener("resize", clampHousingEditorPanel);
  document.getElementById("housing-edit-open")?.addEventListener("click", startHousingEdit);
  document.getElementById("inventory-prev")?.addEventListener("click", () => {
    inventoryPage = Math.max(0, inventoryPage - 1);
    renderInventoryPage();
    if (document.activeElement.hidden) document.getElementById("inventory-next").focus();
  });
  document.getElementById("inventory-next")?.addEventListener("click", () => {
    inventoryPage++;
    renderInventoryPage();
    if (document.activeElement.hidden) document.getElementById("inventory-prev").focus();
  });
  el.housingEditorClose?.addEventListener("click", stopHousingEdit);
  el.housingEditorItems?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-housing-id]");
    if (button) selectHousingItem(button.dataset.housingId);
  });
  el.housingEditorRemove?.addEventListener("click", () => {
    if (!housingSelected?.uid) return;
    state.housing.placed = state.housing.placed.filter((entry) => entry.uid !== housingSelected.uid);
    housingSelected = null;
    trySave(state);
    renderHousingScene();
    renderHousingEditorItems();
  });
  el.housingGiftGroups?.addEventListener("click", (event) => {
    const choice = event.target.closest("button[data-gift-id]");
    const item = HOUSING_ITEMS[choice?.dataset.giftId];
    if (!item) return;
    housingGiftSelections[item.model] = item.id;
    renderHousingGift();
    el.housingGiftGroups.querySelector(`[data-gift-id="${item.id}"]`)?.focus();
  });
  el.housingGiftClaim?.addEventListener("click", claimHousingGift);
  el.locationDeco?.addEventListener("pointerdown", (event) => {
    if (!housingEditing) return;
    event.stopPropagation();
    const svg = event.target.closest("#housing-scene");
    if (!svg) return;
    const object = event.target.closest(".housing-object");
    if (object) {
      const entry = state.housing.placed.find((placed) => placed.uid === object.dataset.uid);
      if (!entry) return;
      housingSelected = { id: entry.id, uid: entry.uid };
      const point = housingPointerPosition(event, svg);
      housingDrag = { uid: entry.uid, startX: entry.x, startY: entry.y,
        offsetX: point.x - entry.x, offsetY: point.y - entry.y, moved: false };
      svg.setPointerCapture(event.pointerId);
      renderHousingEditorItems();
    } else {
      placeHousingAt(event, svg);
    }
  });
  el.locationDeco?.addEventListener("pointermove", (event) => {
    if (!housingEditing || !housingDrag) return;
    event.stopPropagation();
    const svg = el.locationDeco.querySelector("#housing-scene");
    const entry = state.housing.placed.find((placed) => placed.uid === housingDrag.uid);
    const item = HOUSING_ITEMS[entry?.id];
    if (!svg || !item) return;
    const point = housingPointerPosition(event, svg);
    const position = housingPosition(item, point.x - housingDrag.offsetX, point.y - housingDrag.offsetY);
    if (!canPlaceHousing(item, position, state.housing.placed, entry.uid)) return;
    housingDrag.moved = true;
    Object.assign(entry, position);
    const image = Array.from(svg.querySelectorAll(".housing-object")).find((node) => node.dataset.uid === entry.uid);
    image?.setAttribute("x", position.x);
    image?.setAttribute("y", position.y);
  });
  const endDrag = (event) => {
    if (!housingDrag) return;
    event.stopPropagation();
    if (housingDrag.moved) trySave(state);
    housingDrag = null;
    renderHousingScene();
  };
  el.locationDeco?.addEventListener("pointerup", endDrag);
  el.locationDeco?.addEventListener("pointercancel", endDrag);
}

function setupBetaInventoryUI() {
  el.inventoryClose?.addEventListener("click", closeInventory);
  el.inventoryOverlay?.addEventListener("click", (ev) => { if (ev.target === el.inventoryOverlay) closeInventory(); });
  el.inventoryFish?.addEventListener("click", () => {
    if ((Number(state.inventory?.pescado) || 0) <= 0) {
      closeInventory();
      openGameSelector("pesca");
      return;
    }
    doComer("pescado");
    refreshInventory();
  });
  el.inventoryWater?.addEventListener("click", () => { doBeber(); refreshInventory(); });
  document.getElementById("wardrobe-save")?.addEventListener("click", saveWardrobe);
  document.getElementById("wardrobe-clear")?.addEventListener("click", () => { if (!wardrobeDraft) return; WARDROBE_SLOTS.forEach(slot => wardrobeDraft[slot] = null); renderWardrobe(); });
  document.getElementById("wardrobe-prev")?.addEventListener("click", () => { wardrobePage = Math.max(0, wardrobePage - 1); renderWardrobe(); });
  document.getElementById("wardrobe-next")?.addEventListener("click", () => { wardrobePage++; renderWardrobe(); });
  document.getElementById("wardrobe-shop")?.addEventListener("click", () => { closeWardrobe(); openShop(); });
  el.wardrobeClose?.addEventListener("click", closeWardrobe);
  el.wardrobeCloseAction?.addEventListener("click", closeWardrobe);
  el.wardrobeOverlay?.addEventListener("click", (ev) => { if (ev.target === el.wardrobeOverlay) closeWardrobe(); });
  el.wardrobeTabs?.addEventListener("click", (ev) => {
    const button = ev.target.closest("button[data-slot]:not(:disabled)");
    if (!button) return;
    wardrobeSlotActive = button.dataset.slot;
    wardrobePage = 0;
    el.wardrobeTabs.querySelectorAll("[data-slot]").forEach((tab) => tab.classList.toggle("is-active", tab === button));
    renderWardrobe();
  });
  el.wardrobeGrid?.addEventListener("click", (ev) => {
    const button = ev.target.closest("button[data-item-id]");
    if (!button) return;
    const itemId = button.dataset.itemId || null;
    if (itemId && !state.wardrobe.owned[wardrobeSlotActive][itemId]) return;
    if (!wardrobeDraft) return;
    wardrobeDraft[wardrobeSlotActive] = wardrobeDraft[wardrobeSlotActive] === itemId ? null : itemId;
    renderWardrobe();
  });
  el.betaWelcomeOptions?.addEventListener("click", (ev) => {
    const button = ev.target.closest("button[data-set-id]");
    if (button) claimBetaWelcomeSet(button.dataset.setId);
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape" || !el.betaWelcomeOverlay?.hidden) return;
    if (!el.inventoryOverlay?.hidden) closeInventory();
    if (!el.wardrobeOverlay?.hidden) closeWardrobe();
  });
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
  const icon = dormida ? "despertar" : "dormir";
  if (reg.btnEl.dataset.sleepIcon !== icon) {
    reg.btnEl.innerHTML = actionIconMarkup(icon);
    reg.btnEl.dataset.sleepIcon = icon;
  }
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
    // v3.5: pedido explícito — "sacar la leyenda 'Pescado' y que el
    // número de stock sea mucho más chico, el svg un poco más chico y el
    // número de stock esté debajo del svg, todo centrado" (ver
    // .feed-item/#fish-quantity en css/style.css para el layout en
    // columna centrada que arma esto).
    item.innerHTML = `<span class="feed-item-icon"><img src="assets/items/fish-item.svg" alt="${food.label}" /></span><strong id="fish-quantity">×0</strong><span class="feed-item-desc">${FOOD_DESCRIPTIONS[key] || ""}</span>`;
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
  document.getElementById("food-stock").textContent = state.inventory.pescado === 0 ? `No te queda más comida. Jugá con ${state.name} para conseguir más comida.` : state.stats.saciedad >= PET_CONFIG.llenaUmbral ? `${state.name} no tiene hambre.` : state.sleep.dormida ? `${state.name} está durmiendo.` : isOnCooldown("pescado") ? `Podés volver a alimentar en ${formatCooldownPhrase(state.cooldowns.pescado-Date.now())}.` : "Elegí el pescado para alimentar.";
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
  emitRealtimeAction("eat", { item: key });

  if (key === "golosina") {
    const now = Date.now();
    state.golosinaLog.push(now);
    pruneGolosinaLog(now);
    showBubble("¡Ñam! Me encantó.");
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
  emitRealtimeAction("drink");
  const dailyReward = recordDailyGoal("talk");
  trySave(state);
  refreshUI();
  updateCooldownButtons();
  showBubble("¡Glup, glup! Gracias.");
  if (dailyReward) notifySystem("¡Objetivos del día completos! +50 monedas +100 XP", 3800);
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
  emitRealtimeAction("bathe");
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

// v3.6, pedido explícito: "quitar juego de pelota traviesa" — se saca su
// entrada de este array (de acá sale sola la tarjeta del selector, ver
// setupGameSelector() más abajo, que arma #game-choices recorriendo
// MINIGAMES). Pesca y Luciérnagas quedan sin cambios; son genéricas
// (parametrizadas por game.id) así que no dependían de la de Pelota.
const MINIGAMES = [
  { id: "pesca", title: "Pesca", instructions: "Esperá a que pique y tocá ¡Tirar! Hasta 3 pescados por partida y 3 partidas por día, sin espera. Cada inicio cuenta, aunque canceles.", symbol: "🎣", duration: 20, goal: 3, targetLife: 0 },
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
  emitRealtimeAction("play_end", { game: finished.type.id, result: success ? "win" : "finish" });
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
  emitRealtimeAction("play", { game: type.id });
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
function fishingPlaysRemaining() {
  ensureDailyProgress();
  return Math.max(0, 3 - (state.daily.fishingPlays || 0));
}
function fishingLimitMessage() {
  const remaining = fishingPlaysRemaining();
  return remaining ? `Pesca: ${remaining} de 3 partidas disponibles hoy. Sin tiempo de espera.` : "Ya jugaste las 3 partidas de pesca de hoy. Volvé mañana.";
}
function openGameSelector(selected = null) {
  if (minigame || navLock) return;
  closeAllMenus();
  selectedMinigame = selected || selectedMinigame;
  const panel = document.getElementById("game-selector");
  panel.hidden = false;
  panel.querySelectorAll(".game-choice").forEach(card => { card.classList.toggle("is-open", card.dataset.game === selected); card.querySelector(".game-title").setAttribute("aria-expanded", String(card.dataset.game === selected)); });
  document.getElementById("game-selector-note").textContent = fishingLimitMessage();
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
  document.getElementById("game-choices").innerHTML = MINIGAMES.map(game => `<article class="game-choice" data-game="${game.id}"><div class="game-art">${game.id === "pesca" ? '<img src="assets/items/fish-item.svg" alt="" />' : '<span>'+game.symbol+'</span>'}</div><div class="game-details" id="details-${game.id}"><p>${game.instructions}</p><button type="button" class="card-play" data-play="${game.id}">▶ Play</button></div><button type="button" class="game-title" aria-expanded="false" aria-controls="details-${game.id}">${game.title}</button></article>`).join("");
  panel.querySelectorAll(".game-title").forEach(btn => btn.addEventListener("click", () => {
    const card=btn.closest(".game-choice"); const open=!card.classList.contains("is-open");
    panel.querySelectorAll(".game-choice").forEach(c=>{c.classList.remove("is-open");c.querySelector(".game-title").setAttribute("aria-expanded","false")});
    card.classList.toggle("is-open",open); btn.setAttribute("aria-expanded",String(open)); selectedMinigame=card.dataset.game;
  }));
  panel.querySelectorAll(".card-play").forEach(btn => btn.addEventListener("click", () => {selectedMinigame=btn.dataset.play;document.getElementById("game-play").click()}));
  document.getElementById("game-selector-close").addEventListener("click", closeGameSelector);
  document.getElementById("game-play").addEventListener("click", () => {
    const note = document.getElementById("game-selector-note");
    if (minigame) return;
    if (state.sleep.dormida) { note.textContent = "Despertá a tu mascota para jugar."; return; }
    if (state.stats.energia < PET_CONFIG.play.energiaMinimaParaJugar) { note.textContent = "Necesita descansar: no tiene suficiente energía."; return; }
    if (selectedMinigame === "pesca") {
      if (!fishingPlaysRemaining()) { note.textContent = fishingLimitMessage(); return; }
      state.daily.fishingPlays = (state.daily.fishingPlays || 0) + 1;
      state.cooldowns.pesca = 0;
      // Guardar al iniciar evita recuperar una partida al cancelar o recargar.
      trySave(state);
    } else {
      if (isOnCooldown("jugar")) { note.textContent = `Podés jugar de nuevo en ${formatCooldownPhrase(state.cooldowns.jugar-Date.now())}.`; return; }
      startCooldown("jugar");
    }
    registerInteraction(); updateCooldownButtons();
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
    emitRealtimeAction("wake");
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
    emitRealtimeAction("sleep");
    // v3.2, pedido explícito: "durmiendo" ya no es un aviso puntual de
    // 12s — es la tarjeta estática #sleep-notice-card (ver
    // renderNotifications), que se actualiza sola en el refreshUI() de
    // más abajo mientras dure state.sleep.dormida.
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
  emitRealtimeAction("pet");
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
    if (housingEditing) return;
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
  emitRealtimeAction("talk", { text: frase });
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
  document.getElementById("options-arrow").textContent = "▾";
}

function closeOptionsMenu(returnFocus) {
  if (el.optionsMenu.hidden) return;
  if (!el.debugPanel.hidden) closeDebugMode();
  el.optionsMenu.hidden = true;
  el.btnOpciones.setAttribute("aria-expanded", "false");
  document.getElementById("options-arrow").textContent = "▴";
  if (returnFocus) el.btnOpciones.focus();
}

function doReiniciar() {
  if (confirm("¿Reiniciar y borrar tu mascota actual? Esta acción no se puede deshacer.")) {
    closeVisit();
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
  closeVisit();
  if (window.Multiplayer && typeof window.Multiplayer.stopSession === "function") {
    try { await window.Multiplayer.stopSession(); } catch (e) { /* onDisconnect completa la limpieza */ }
  }
  stopRoomPlayerWatch();
  stopDirectChatWatch();
  stopDirectInboxWatch();
  flushCloudSaveNow();
  if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }
  if (requestsTimer) { clearInterval(requestsTimer); requestsTimer = null; }
  if (cloudUnsub) { cloudUnsub(); cloudUnsub = null; }
  friendPresenceUnsubscribers.forEach((unsubscribe) => unsubscribe());
  friendPresenceUnsubscribers.clear();
  friendPresence.clear();
  currentUsername = null;
  currentDisplayName = null;
  myCloudData = { friends: {}, friendRequests: { incoming: {}, outgoing: {} } };
  rememberUsername(null);
  state = null;
  setRoomChatOpen(false);
  el.game.hidden = true;
  setStageEditing(false);
  updateFooterText();
  updateOptCambiarUsuario();
  updateAdminUI();
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
  const showCloudAccountOptions = !!(window.Cloud && window.Cloud.enabled && currentUsername);
  if (el.optCambiarUsuario) {
    el.optCambiarUsuario.hidden = !showCloudAccountOptions;
  }
  // v3.4: "Eliminar cuenta" sigue la misma condición que "Cambiar de
  // usuario" — sólo tiene sentido con una cuenta de nube real detrás.
  if (el.optEliminarCuenta) {
    el.optEliminarCuenta.hidden = !showCloudAccountOptions;
  }
}

// v3.4: pedido explícito — "jony" es el único usuario Administrador, con
// opciones extra dentro de ese rol (por ahora: ver "Modo prueba", y tener
// todos los colores de personalización desbloqueados desde el principio,
// ver PET_PARTS_MANIFEST.bodyColor / creator). Sin cuenta en la nube (modo
// local) nunca hay Administrador — currentUsername queda null.
function isAdmin() {
  return !!(currentUsername && currentUsername === "jony");
}

function updateAdminUI() {
  if (el.optDebug) el.optDebug.hidden = !isAdmin();
}

// ---------- v3.4: eliminar cuenta ----------

function openDeleteAccountModal() {
  if (!el.deleteAccountOverlay || !currentUsername) return;
  if (el.deleteAccountUsernameHint) el.deleteAccountUsernameHint.textContent = currentDisplayName || currentUsername;
  if (el.deleteAccountInput) el.deleteAccountInput.value = "";
  if (el.deleteAccountError) el.deleteAccountError.hidden = true;
  el.deleteAccountOverlay.hidden = false;
  setTimeout(() => el.deleteAccountInput && el.deleteAccountInput.focus(), 50);
}

function closeDeleteAccountModal() {
  if (el.deleteAccountOverlay) el.deleteAccountOverlay.hidden = true;
}

function showDeleteAccountError(msg) {
  if (!el.deleteAccountError) return;
  el.deleteAccountError.textContent = msg;
  el.deleteAccountError.hidden = false;
}

async function handleDeleteAccountSubmit() {
  if (!window.Cloud || !currentUsername) return;
  const typed = (el.deleteAccountInput && el.deleteAccountInput.value.trim().toLowerCase()) || "";
  if (typed !== currentUsername) {
    showDeleteAccountError("Ese no es tu nombre de usuario — escribilo tal cual para confirmar.");
    return;
  }
  el.deleteAccountSubmit.disabled = true;
  const originalLabel = el.deleteAccountSubmit.textContent;
  el.deleteAccountSubmit.textContent = "Eliminando...";
  try {
    const result = await window.Cloud.deleteAccount(currentUsername);
    if (!result.ok) {
      showDeleteAccountError(
        result.error === "network" || result.error === "disabled"
          ? "No se pudo conectar con la nube ahora mismo. Probá de nuevo en un momento."
          : "No se pudo eliminar la cuenta."
      );
      return;
    }
    closeDeleteAccountModal();
    // Misma limpieza de sesión que "Cambiar de usuario" (doCambiarUsuario)
    // pero sin la sesión de nube que borrar — la cuenta ya no existe.
    closeVisit();
    if (window.Multiplayer && typeof window.Multiplayer.stopSession === "function") {
      try { await window.Multiplayer.stopSession(); } catch (e) { /* onDisconnect completa la limpieza */ }
    }
    stopRoomPlayerWatch();
    stopDirectChatWatch();
    stopDirectInboxWatch();
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }
    if (requestsTimer) { clearInterval(requestsTimer); requestsTimer = null; }
    if (cloudUnsub) { cloudUnsub(); cloudUnsub = null; }
    currentUsername = null;
    currentDisplayName = null;
    myCloudData = { friends: {}, friendRequests: { incoming: {}, outgoing: {} } };
    rememberUsername(null);
    state = null;
    setRoomChatOpen(false);
    el.game.hidden = true;
    setStageEditing(false);
    updateFooterText();
    updateOptCambiarUsuario();
    updateAdminUI();
    if (window.Cloud.enabled && typeof window.Cloud.signOutCloud === "function") {
      try { await window.Cloud.signOutCloud(); } catch (e) { /* no es grave */ }
    }
    showLoginScreen();
    showLoginError("Tu cuenta se eliminó. Podés crear una nueva cuando quieras.");
  } finally {
    el.deleteAccountSubmit.disabled = false;
    el.deleteAccountSubmit.textContent = originalLabel;
  }
}

function setupDeleteAccountUI() {
  if (!el.deleteAccountForm) return;
  el.deleteAccountForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    handleDeleteAccountSubmit();
  });
  if (el.deleteAccountCancel) el.deleteAccountCancel.addEventListener("click", closeDeleteAccountModal);
  if (el.deleteAccountClose) el.deleteAccountClose.addEventListener("click", closeDeleteAccountModal);
  if (el.deleteAccountOverlay) {
    el.deleteAccountOverlay.addEventListener("click", (ev) => {
      if (ev.target === el.deleteAccountOverlay) closeDeleteAccountModal();
    });
  }
}

function updateFooterText() {
  document.getElementById("options-username").textContent = currentDisplayName || currentUsername || "Invitado";
  if (!el.footerText) return;
  if (window.Cloud && window.Cloud.enabled && currentUsername) {
    el.footerText.textContent = `Hecho por Jony · Mascotito ${APP_CHANNEL} v${APP_VERSION} · sesión: ${currentDisplayName} · guardado en la nube y en este navegador`;
  } else {
    el.footerText.textContent = `Hecho por Jony · Mascotito ${APP_CHANNEL} v${APP_VERSION} · guardado localmente en este navegador`;
  }
}

/** v3.6: pinta el número de versión (APP_CONFIG.js → APP_VERSION, fuente
 * única) en el título de la pestaña y en el badge del encabezado — el HTML
 * trae un valor "de arranque" hardcodeado (por si este script tarda en
 * correr), pero esta función lo deja siempre sincronizado con la
 * constante real, así alcanza con cambiar APP_VERSION en config.js para
 * la próxima versión sin tener que buscar cada lugar donde se mostraba. */
function applyAppVersion() {
  document.title = `Mascotito — ${APP_CHANNEL} v${APP_VERSION}`;
  const badge = document.getElementById("app-version-badge");
  if (badge) badge.textContent = `${APP_CHANNEL} v${APP_VERSION}`;
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
  if (el.optEliminarCuenta) {
    el.optEliminarCuenta.addEventListener("click", () => {
      closeOptionsMenu();
      openDeleteAccountModal();
    });
  }
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

  // v3.5: el Jardín se saca del todo (pedido explícito) — sólo queda
  // "Casa" como lugar, así que el botón de debug para ir al Jardín
  // también se saca (ya no hay a dónde ir).
  const locRow = document.createElement("div");
  locRow.className = "debug-row";
  locRow.innerHTML = `<span>Lugar</span> <button type="button" id="debug-go-casa">Ir a Casa</button>`;
  p.appendChild(locRow);
  locRow.querySelector("#debug-go-casa").addEventListener("click", () => goToLocation("casa"));
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
  // v3.5: pedido explícito — sin #time-card, #notification-card pasa a
  // colgar directo de #wellbeing-widget (el cartel de "Estado"), en el
  // lugar que ocupaba el reloj. Antes colgaba de #time-card, así que si
  // esa tarjeta estaba oculta en alguna resolución (offsetTop/offsetHeight
  // en 0) las notificaciones terminaban pegadas contra "Estado" en vez de
  // debajo — este es justamente el bug que se pidió arreglar.
  const notif=document.getElementById("notification-card");
  const sleepCard=document.getElementById("sleep-notice-card");
  const sysCard=document.getElementById("system-notice-card");
  // v3.6 — fix real del reporte "las notificaciones se siguen
  // superponiendo en el cuadro de estado": el encadenado usaba
  // notif.offsetTop/sleepCard.offsetTop (la posición YA aplicada de la
  // tarjeta anterior) para ubicar a la siguiente. Eso funciona si esa
  // tarjeta anterior está VISIBLE, pero un elemento con `hidden`
  // (display:none) no tiene caja — su offsetTop vuelve a 0 (no "donde
  // estaba"), no sólo su offsetHeight. Entonces, cada vez que
  // #notification-card estaba oculta (sin alertas de bienestar activas)
  // pero #sleep-notice-card o #system-notice-card sí tenían algo para
  // mostrar, esa siguiente tarjeta se pegaba contra top:12px — adentro
  // del propio #wellbeing-widget — en vez de debajo. Ahora se lleva un
  // cursor propio en JS (nextTop) que sólo avanza con la altura real de
  // una tarjeta cuando esa tarjeta está VISIBLE, sin depender de leer la
  // posición de vuelta desde una caja que puede no existir.
  let nextTop = hud.offsetTop + hud.offsetHeight + 12;
  notif.style.top = nextTop + "px";
  if (!notif.hidden) nextTop += notif.offsetHeight + 12;
  sleepCard.style.top = nextTop + "px";
  if (!sleepCard.hidden) nextTop += sleepCard.offsetHeight + 12;
  sysCard.style.top = nextTop + "px";
  const dock=document.getElementById("stage-actions-row");
  el.feedMenu.style.bottom=(el.stageFloor.clientHeight-dock.offsetTop+12)+"px";
  // v3.6.2: #creator-tabs-row (pestañas Color/Cabeza/Orejas/... + Guardar/
  // Cancelar del editor) flota justo arriba del selector de partes/colores
  // — mismo cálculo que ya usa #feed-menu para flotar arriba de este mismo
  // dock, reutilizado tal cual (ver comentario ahí arriba).
  if (el.creatorTabsRow) el.creatorTabsRow.style.bottom=(el.stageFloor.clientHeight-dock.offsetTop+12)+"px";
  // Beta v1.1: compositor, dock y botón de amigos comparten la misma
  // línea inferior. En pantallas angostas el CSS lo sube para evitar
  // superposiciones.
  if (el.roomQuickChat && el.roomChatToggle) {
    const friends = el.roomChatToggle;
    const right = el.stageFloor.clientWidth - friends.offsetLeft + 16;
    el.roomQuickChat.style.right = right + "px";
    el.roomQuickChat.style.left = "auto";
    el.roomQuickChat.style.transform = "none";
    el.roomQuickChat.style.bottom = (el.stageFloor.clientHeight - friends.offsetTop - friends.offsetHeight) + "px";
  }
  computeWalkBounds();
  el.walker.style.transform = `translateX(${walkX + WALK_PAD}px)`;
  if (minigame) positionMinigameTarget();
}
for (const id of ["wellbeing-widget","stage-actions-row","room-chat-toggle"]) new ResizeObserver(syncHudLayout).observe(document.getElementById(id));
window.addEventListener("resize", syncHudLayout);
document.addEventListener("keydown", ev => {
  if (ev.defaultPrevented || ev.key !== "Escape") return;
  if (minigame) finishMinigame(true);
  else if (!document.getElementById("game-selector").hidden) closeGameSelector();
});
// ---------- Arranque ----------

function setupStageModals() {
  ["friends-overlay", "inventory-overlay", "wardrobe-overlay", "shop-overlay"].forEach((id) => {
    const modal = document.getElementById(id);
    if (modal) el.stageFloor.appendChild(modal);
  });
}

(function init() {
  applyAppVersion();
  setupStageModals();
  // Iconos estáticos que no cambian durante la sesión.
  // v3.5: el botón "Salir al jardín" (#btn-nav, antes con el ícono de
  // puerta acá) se sacó del todo — ya no hay nada que inicializar acá.
  el.btnAleatorio.innerHTML = iconSvg("dado") + "<span>Aleatorio</span>";
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
  setupVisitUI();
  setupRoomChatUI();
  setupBetaInventoryUI();
  setupHousingUI();
  setupShopUI();
  setupDeleteAccountUI();
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

async function waitForMultiplayer(timeoutMs) {
  const start = Date.now();
  while (!window.Multiplayer) {
    if (Date.now() - start > timeoutMs) return null;
    await wait(50);
  }
  return window.Multiplayer;
}

let realtimePresencePromise = Promise.resolve(false);
let realtimeRoomSwitchPromise = Promise.resolve(false);

function switchRealtimeRoom(room) {
  const Multiplayer = window.Multiplayer;
  if (!Multiplayer || !room) return Promise.resolve(false);
  realtimeRoomSwitchPromise = realtimeRoomSwitchPromise
    .catch(() => false)
    .then(() => Multiplayer.enterRoom(room));
  return realtimeRoomSwitchPromise;
}

async function startRealtimePresence() {
  if (!currentUsername) return false;
  const Multiplayer = await waitForMultiplayer(4000);
  if (!Multiplayer || !Multiplayer.enabled) return false;
  try {
    const ready = await Multiplayer.ready;
    if (!ready) return false;
    const started = await Multiplayer.startSession(currentUsername, currentDisplayName || currentUsername);
    if (started) {
      watchRoomPlayers(currentUsername);
      startDirectInboxWatch();
      subscribeFriendsPresence();
    }
    return started;
  } catch (err) {
    console.warn("[Mascotito] La sesión continúa sin presencia en tiempo real.", err);
    return false;
  }
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
    setStageEditing(false);
    el.game.hidden = false;
    startGame();
  } else {
    openOnboarding(null);
  }
}

function startSessionWithData(data) {
  pendingHousingGiftForAccount = !!data && !Object.prototype.hasOwnProperty.call(data, "housingGiftStatus");
  el.loginScreen.hidden = true;
  el.appHeader.hidden = false;
  updateFooterText();
  updateOptCambiarUsuario();
  updateAdminUI();
  subscribeFriendsLive();
  realtimePresencePromise = startRealtimePresence();
  const cloudPet = data && data.petState ? normalizeState(data.petState) : null;
  if (cloudPet) {
    state = cloudPet;
    setStageEditing(false);
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
    setStageEditing(false);
    el.game.hidden = false;
    startGame();
  } else {
    openOnboarding(null);
  }
}

// ---------- v3.3: pantalla de login (usuario + PIN) ----------

function showLoginScreen() {
  if (housingEditing) stopHousingEdit();
  el.loginScreen.hidden = false;
  el.game.hidden = true;
  setStageEditing(false);
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
    subscribeFriendsPresence();
    renderFriendsBadge();
    refreshChatUnreadBadge();
    if (phoneView === "requests") renderRequestsList();
    if (el.roomChatPanel && !el.roomChatPanel.hidden && activeChatKind === null) renderChatContacts();
  });
}

function subscribeFriendsPresence() {
  const friends = myCloudData.friends || {};
  friendPresenceUnsubscribers.forEach((unsubscribe, username) => {
    if (!friends[username]) {
      unsubscribe();
      friendPresenceUnsubscribers.delete(username);
      friendPresence.delete(username);
    }
  });
  if (!window.Multiplayer?.enabled || typeof window.Multiplayer.subscribeUserPresence !== "function") return;
  Object.keys(friends).forEach((username) => {
    if (friendPresenceUnsubscribers.has(username)) return;
    const unsubscribe = window.Multiplayer.subscribeUserPresence(username, (presence) => {
      friendPresence.set(username, presence || { online: false, currentRooms: [] });
      if (!el.roomChatPanel?.hidden && activeChatKind === null) renderChatContacts();
      if (activeChatKind === "direct" && activeDirectUsername === username) {
        const online = !!presence?.online;
        el.roomChatAvatar?.querySelector(".contact-avatar")?.classList.toggle("is-online", online);
        el.roomChatAvatar?.querySelector(".contact-avatar")?.classList.toggle("is-offline", !online);
      }
    });
    friendPresenceUnsubscribers.set(username, unsubscribe);
  });
}

function renderFriendsBadge() {
  const incoming = (myCloudData.friendRequests && myCloudData.friendRequests.incoming) || {};
  const count = Object.keys(incoming).length;
  if (el.friendsManageBadge) {
    el.friendsManageBadge.hidden = count === 0;
    el.friendsManageBadge.textContent = String(count);
  }
  // Beta v4.3.3: el + de Contactos sólo aparece con solicitudes pendientes.
  if (el.friendsManageAdd) el.friendsManageAdd.hidden = count === 0;
}

// Beta v4.3.1: botones de amigos como íconos SVG (sin texto visible; el
// nombre queda en aria-label y en la ayuda al pasar el cursor).
const FRIEND_ICON = {
  visit: "assets/ui/phone/visit.svg",
  chat: "assets/ui/phone/message.svg",
  accept: "assets/ui/phone/check.svg",
  reject: "assets/ui/actions/cerrar.svg",
};
function friendIconHtml(kind, label) {
  return `<img class="friend-icon-art" src="${FRIEND_ICON[kind]}" alt="" draggable="false" /><span class="sr-only">${label}</span>`;
}

function friendRow(displayName, actionsHtml, online = null) {
  const li = document.createElement("li");
  li.className = "friend-item";
  const nameSpan = document.createElement("span");
  nameSpan.className = "friend-item-name";
  if (online === null) {
    nameSpan.textContent = displayName;
  } else {
    const dot = document.createElement("i");
    dot.className = "friend-presence-dot" + (online ? "" : " is-offline");
    dot.setAttribute("aria-label", online ? "Conectado" : "Desconectado");
    nameSpan.append(dot, document.createTextNode(displayName));
  }
  const actionsSpan = document.createElement("span");
  actionsSpan.className = "friend-item-actions";
  actionsSpan.innerHTML = actionsHtml;
  li.appendChild(nameSpan);
  li.appendChild(actionsSpan);
  return li;
}

// Beta v4.3.3: la ventana vieja de Amigos se integró al celular. Las
// solicitudes recibidas se ven en su propia pantalla (botón + de Contactos).
function renderRequestsList() {
  if (!el.requestsIncomingList) return;
  const incoming = (myCloudData.friendRequests && myCloudData.friendRequests.incoming) || {};
  el.requestsIncomingList.innerHTML = "";
  const inKeys = Object.keys(incoming);
  if (el.requestsIncomingEmpty) el.requestsIncomingEmpty.hidden = inKeys.length > 0;
  inKeys.forEach((k) => {
    const display = (incoming[k] && incoming[k].fromDisplay) || k;
    el.requestsIncomingList.appendChild(
      friendRow(
        display,
        `<button type="button" class="friend-btn-accept friend-icon-btn" title="Aceptar" data-user="${k}">${friendIconHtml("accept", "Aceptar")}</button><button type="button" class="friend-btn-reject friend-icon-btn" title="Rechazar" data-user="${k}">${friendIconHtml("reject", "Rechazar")}</button>`
      )
    );
  });
  renderFriendsBadge();
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
    resultBox.textContent = `${result.username} ya te envió una solicitud — la tenés en Solicitudes (el + de Contactos).`;
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
  el.requestsIncomingList?.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button[data-user]");
    if (!btn || !window.Cloud) return;
    const target = btn.dataset.user;
    const accepting = btn.classList.contains("friend-btn-accept");
    const display = myCloudData.friendRequests?.incoming?.[target]?.fromDisplay || target;
    openPhoneConfirm(accepting ? `¿Aceptar la solicitud de ${display}?` : `¿Rechazar la solicitud de ${display}?`, async () => {
      const res = accepting
        ? await window.Cloud.acceptFriendRequest(currentUsername, currentDisplayName, target)
        : await window.Cloud.rejectFriendRequest(currentUsername, target);
      if (res?.ok === false) throw new Error("request_failed");
      if (accepting) notifySystem("Ahora son amigos.");
    });
  });
  el.addFriendForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    handleAddFriendSearch();
  });
}

// ---------- v3.9.2: visita unificada y capa online completa ----------
// La visita ya no crea una segunda pantalla. #stage-floor conserva el HUD,
// el tamaño y la caminata de la partida normal; temporalmente muestra la
// casa/heces del anfitrión y suma su mascota como una segunda entidad. Las
// pertenencias ajenas son de sólo lectura. Firestore conserva el progreso;
// Realtime Database administra presencia, movimiento, acciones, chat y el
// indicador efímero de escritura de la sala actual.
const VISIT_ACTIVE_THRESHOLD_MS = 45000;

let visitUnsubscribe = null;
let activeVisit = null;
let roomPlayersUnsubscribe = null;
let roomActionsUnsubscribe = null;
let roomChatUnsubscribe = null;
let roomConnectionUnsubscribe = null;
let roomMembersUnsubscribe = null;
let roomTypingUnsubscribe = null;
let directInboxUnsubscribe = null;
let directChatUnsubscribe = null;
let watchedRoom = null;
const remoteProfileCache = new Map();
const pendingRemoteActions = new Map();
const REMOTE_ACTION_QUEUE_MAX_AGE_MS = 7000;
let roomChatInitialized = false;
const knownRoomChatIds = new Set();
let roomChatMessagesCache = [];
let roomMembersLabel = "0 presentes";
let roomUnreadCount = 0;
let directInbox = {};
let activeChatKind = null;
let activeDirectUsername = null;
let activeDirectDisplayName = null;
let localChatTyping = false;
let lastTypingPublishAt = 0;
let localChatTypingTimer = null;
let offlineHostRaf = null;
let offlineHostRunning = false;
let npcTransitionTimer = null;

function roomChatLabel(room) {
  if (activeVisit?.usernameLower === room) return `Chat · Casa de ${activeVisit.displayName}`;
  return "Chat · Tu casa";
}

function roomChatContactLabel(room) {
  if (activeVisit?.usernameLower === room) return `Casa de ${activeVisit.displayName}`;
  return "Tu casa";
}

function directUnreadTotal() {
  const friends = myCloudData.friends || {};
  return Object.values(directInbox || {}).reduce((total, item) => {
    if (!item?.otherUsername || !friends[item.otherUsername]) return total;
    return total + Math.max(0, Number(item.unreadCount) || 0);
  }, 0);
}

function refreshChatUnreadBadge() {
  if (!el.roomChatBadge) return;
  const requests = Object.keys(myCloudData.friendRequests?.incoming || {}).length;
  const total = Math.max(0, Math.min(999, roomUnreadCount + directUnreadTotal() + requests));
  el.roomChatBadge.textContent = total >= 99 ? "99+" : String(total);
  el.roomChatBadge.hidden = total === 0;
  el.roomChatToggle.dataset.unread = String(total);
  el.roomChatToggle.classList.toggle("has-unread", total > 0);
}

function updateRoomChatBadge(count = 0) {
  roomUnreadCount = Math.max(0, Number(count) || 0);
  refreshChatUnreadBadge();
}

function setChatStatus(text = "") {
  if (!el.roomChatStatus) return;
  el.roomChatStatus.textContent = text;
  el.roomChatStatus.hidden = !text;
}

function stopDirectChatWatch() {
  if (directChatUnsubscribe) directChatUnsubscribe();
  directChatUnsubscribe = null;
  activeDirectUsername = null;
  activeDirectDisplayName = null;
}

function showChatContacts() {
  stopLocalChatTyping();
  stopDirectChatWatch();
  activeChatKind = null;
  if (el.roomChatTitle) el.roomChatTitle.textContent = "Contactos";
  if (el.roomChatParticipants) el.roomChatParticipants.textContent = "";
  setPhoneHeaderAvatar(null);
  setPhoneMenuVisible(false);
  setPhoneView("contacts");
  setChatStatus("");
  renderChatContacts();
}

function setRoomChatOpen(open) {
  if (!el.roomChatPanel || !el.roomChatToggle) return;
  el.roomChatPanel.hidden = !open;
  el.roomChatToggle.setAttribute("aria-expanded", String(open));
  el.roomChatToggle.classList.toggle("is-selected", open);
  closePhoneMenu();
  closePhoneConfirm();
  if (open) {
    friendPetCache.clear();
    showChatContacts();
  } else {
    stopLocalChatTyping();
    stopDirectChatWatch();
    activeChatKind = null;
  }
}

function stopLocalChatTyping() {
  clearTimeout(localChatTypingTimer);
  localChatTypingTimer = null;
  if (localChatTyping && typeof window.Multiplayer?.setTyping === "function") {
    window.Multiplayer.setTyping(false).catch(() => {});
  }
  localChatTyping = false;
  lastTypingPublishAt = 0;
}

function updateLocalChatTyping(source = el.roomChatInput) {
  const input = source?.target || source;
  const hasText = !!input?.value.trim();
  const isRoomComposer = input === el.roomQuickChatInput || activeChatKind === "room";
  if (!isRoomComposer || !hasText || !window.Multiplayer?.connected || typeof window.Multiplayer?.setTyping !== "function") {
    stopLocalChatTyping();
    return;
  }
  const now = Date.now();
  if (!localChatTyping || now - lastTypingPublishAt >= 3000) {
    window.Multiplayer.setTyping(true).catch(() => {});
    localChatTyping = true;
    lastTypingPublishAt = now;
  }
  clearTimeout(localChatTypingTimer);
  localChatTypingTimer = setTimeout(stopLocalChatTyping, 1600);
}

function renderChatMessages(messages, emptyText = "No hay mensajes todavía.") {
  if (!el.roomChatMessages) return;
  el.roomChatMessages.innerHTML = "";
  (messages || []).forEach((message) => {
    const item = document.createElement("li");
    item.className = "room-chat-message" + (message.actor === currentUsername ? " is-own" : "");
    const meta = document.createElement("span");
    meta.className = "room-chat-message-meta";
    const sameDay = new Date(message.createdAt).toDateString() === new Date().toDateString();
    const time = new Date(message.createdAt).toLocaleString("es-AR", sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    meta.textContent = `${message.displayName} · ${time}`;
    const body = document.createElement("span");
    body.className = "room-chat-message-body";
    body.textContent = message.text;
    item.append(meta, body);
    el.roomChatMessages.appendChild(item);
  });
  el.roomChatEmpty.textContent = emptyText;
  el.roomChatEmpty.hidden = !!messages?.length;
  requestAnimationFrame(() => { el.roomChatMessages.scrollTop = el.roomChatMessages.scrollHeight; });
}

function renderRoomChat(messages) {
  if (messages === null) {
    if (activeChatKind === "room") setChatStatus("No se pudo cargar el chat. Revisá la conexión o las reglas de Firebase.");
    return;
  }
  const incomingIds = new Set(messages.map((message) => message.id));
  const newRemoteMessages = roomChatInitialized
    ? messages.filter((message) => !knownRoomChatIds.has(message.id) && message.actor !== currentUsername)
    : [];
  const roomConversationVisible = !el.roomChatPanel.hidden && activeChatKind === "room";
  if (roomChatInitialized && !roomConversationVisible) {
    const unread = messages.filter((message) => !knownRoomChatIds.has(message.id) && message.actor !== currentUsername).length;
    if (unread) updateRoomChatBadge(roomUnreadCount + unread);
  }
  knownRoomChatIds.clear();
  incomingIds.forEach((id) => knownRoomChatIds.add(id));
  roomChatInitialized = true;
  roomChatMessagesCache = messages;
  // Los mensajes previos sólo construyen el historial. A partir de la
  // primera carga, cada mensaje nuevo habla también desde la mascota que
  // realmente lo envió, tanto en casa propia como durante una visita.
  newRemoteMessages.forEach((message) => {
    const target = remoteActionTarget(message.actor);
    if (!target) return;
    showRemoteBubble(target.walker, message.text, 3400);
    playMouthAnim(target.stage, "hablar", 3400);
  });
  if (roomConversationVisible) {
    setChatStatus(window.Multiplayer?.connected ? "" : "Reconectando...");
    renderChatMessages(messages, "Todavía no hay mensajes en esta casa.");
  }
  if (!el.roomChatPanel.hidden && activeChatKind === null) renderChatContacts();
}

function resetRoomChat(room) {
  roomChatInitialized = false;
  knownRoomChatIds.clear();
  roomChatMessagesCache = [];
  roomMembersLabel = "0 presentes";
  updateRoomChatBadge(0);
  // Beta v4.3.1: con la lista de contactos a la vista, el título sigue siendo «Contactos».
  if (el.roomChatTitle && activeChatKind === "room") el.roomChatTitle.textContent = roomChatLabel(room);
  if (el.roomChatContactLabel) el.roomChatContactLabel.textContent = "Contactos";
  if (el.roomChatToggle) {
    const contactName = roomChatContactLabel(room);
    el.roomChatToggle.setAttribute("aria-label", `Abrir contactos, mensajes y sala: ${contactName}`);
    el.roomChatToggle.title = "Contactos";
  }
  if (el.roomChatMessages) el.roomChatMessages.innerHTML = "";
  if (el.roomChatEmpty) { el.roomChatEmpty.textContent = "Todavía no hay mensajes en esta casa."; el.roomChatEmpty.hidden = false; }
  setChatStatus("");
  if (el.roomChatParticipants) el.roomChatParticipants.textContent = "0 presentes";
  if (el.roomChatTyping) { el.roomChatTyping.hidden = true; el.roomChatTyping.textContent = ""; }
}

function renderRoomMembers(room) {
  if (!el.roomChatParticipants) return;
  if (!room) {
    roomMembersLabel = "Presencia no disponible";
    if (activeChatKind === "room") el.roomChatParticipants.textContent = roomMembersLabel;
    if (activeVisit) {
      el.visitRoomCount.textContent = "Estado estimado · tiempo real no disponible";
      el.visitRoomCount.title = "La app usa la última actividad guardada porque no pudo conectarse a Realtime Database.";
    }
    return;
  }
  const names = room.members.map((member) => member.displayName || member.username);
  const preview = names.slice(0, 2).join(" · ");
  const extra = names.length > 2 ? ` +${names.length - 2}` : "";
  roomMembersLabel = `${room.count} ${room.count === 1 ? "presente" : "presentes"}${preview ? ` · ${preview}${extra}` : ""}`;
  if (activeChatKind === "room") el.roomChatParticipants.textContent = roomMembersLabel;
  el.roomChatParticipants.title = names.join(", ");
  if (!el.roomChatPanel.hidden && activeChatKind === null) renderChatContacts();
  if (activeVisit) {
    el.visitRoomCount.textContent = `${room.count} ${room.count === 1 ? "mascota presente" : "mascotas presentes"}`;
    el.visitRoomCount.removeAttribute("title");
  }
}

function renderRoomTyping(users) {
  if (!el.roomChatTyping) return;
  if (activeChatKind !== "room") {
    el.roomChatTyping.hidden = true;
    el.roomChatTyping.textContent = "";
    return;
  }
  const others = Array.isArray(users) ? users.filter((user) => user.username !== currentUsername) : [];
  if (!others.length) {
    el.roomChatTyping.hidden = true;
    el.roomChatTyping.textContent = "";
    return;
  }
  const first = others[0].displayName || others[0].username;
  el.roomChatTyping.textContent = others.length === 1
    ? `${first} está escribiendo…`
    : `${first} y ${others.length - 1} más están escribiendo…`;
  el.roomChatTyping.hidden = false;
}

function updateRoomRealtimeConnection(online) {
  if (!online) stopLocalChatTyping();
  el.roomChatToggle?.classList.toggle("is-offline", !online);
  if (el.roomChatContactStatus) el.roomChatContactStatus.textContent = online ? "Chat en vivo" : "Sin conexión";
  if (el.roomChatSend) el.roomChatSend.disabled = !online;
  if (el.roomQuickChatSend) el.roomQuickChatSend.disabled = !online;
  if (el.roomQuickChatInput) el.roomQuickChatInput.disabled = !online;
  if (activeChatKind) setChatStatus(online ? "" : "Reconectando...");
  if (!el.roomChatPanel.hidden && activeChatKind === null) renderChatContacts();
}

// ---------- Beta v4.3.2: celular de Contactos ----------
// Mascota de cada contacto: se lee una vez por apertura del celular
// (Cloud.getPlayerData) y se dibuja recortada a la cabeza, igual que la
// placa de bienestar. El aro indica si está conectado.

function contactAvatarEl(username, online) {
  const wrap = document.createElement("span");
  wrap.className = "contact-avatar " + (online ? "is-online" : "is-offline");
  wrap.dataset.avatarUser = username;
  wrap.title = online ? "Conectado" : "Desconectado";
  fillContactAvatar(wrap, username);
  return wrap;
}

function fillContactAvatar(wrap, username) {
  const pet = friendPetCache.get(username);
  wrap.innerHTML = "";
  if (pet && pet.look) {
    const stage = document.createElement("span");
    stage.className = "pet-stage contact-avatar-stage";
    stage.setAttribute("aria-hidden", "true");
    wrap.appendChild(stage);
    try { renderPetLayers(stage, pet.look, pet.wardrobe); } catch (_) { stage.remove(); }
  }
  if (!wrap.firstChild) wrap.classList.add("is-empty");
  else wrap.classList.remove("is-empty");
  if (!friendPetCache.has(username)) loadFriendPet(username);
}

function roomAvatarEl() {
  const wrap = document.createElement("span");
  wrap.className = "contact-avatar is-room";
  wrap.innerHTML = '<img src="assets/ui/phone/room.svg" alt="" draggable="false" />';
  return wrap;
}

async function loadFriendPet(username) {
  const Cloud = window.Cloud;
  if (!username || friendPetPending.has(username) || !Cloud?.enabled || typeof Cloud.getPlayerData !== "function") return;
  friendPetPending.add(username);
  try {
    const result = await Cloud.getPlayerData(username);
    const pet = result?.ok && result.data?.petState ? normalizeState(result.data.petState) : null;
    friendPetCache.set(username, pet);
  } catch (_) {
    friendPetCache.set(username, null);
  } finally {
    friendPetPending.delete(username);
  }
  document.querySelectorAll(`.contact-avatar[data-avatar-user="${CSS.escape(username)}"]`).forEach((wrap) => fillContactAvatar(wrap, username));
}

function setPhoneHeaderAvatar(node) {
  if (!el.roomChatAvatar) return;
  el.roomChatAvatar.innerHTML = "";
  if (node) el.roomChatAvatar.appendChild(node);
  el.roomChatAvatar.hidden = !node;
}

function setPhoneMenuVisible(visible) {
  if (el.roomChatMenuBtn) el.roomChatMenuBtn.hidden = !visible;
  closePhoneMenu();
}

function closePhoneMenu() {
  if (el.roomChatMenu) el.roomChatMenu.hidden = true;
  el.roomChatMenuBtn?.setAttribute("aria-expanded", "false");
}


let phoneConfirmAction = null;

function openPhoneConfirm(text, action) {
  if (!el.phoneConfirm) return;
  phoneConfirmAction = action;
  el.phoneConfirmText.textContent = text;
  el.phoneConfirm.hidden = false;
  el.phoneConfirmNo?.focus();
}

function closePhoneConfirm() {
  phoneConfirmAction = null;
  if (el.phoneConfirm) el.phoneConfirm.hidden = true;
}

function confirmPhoneVisit(username, display) {
  openPhoneConfirm(`¿Viajar a la casa de ${display}?`, () => {
    setRoomChatOpen(false);
    return openVisit(username, display);
  });
}

// Muestra una sola pantalla del celular a la vez.
function setPhoneView(view) {
  phoneView = view;
  el.roomChatPanel.dataset.phoneView = view;
  if (el.roomChatContacts) el.roomChatContacts.hidden = view !== "contacts";
  if (el.roomChatConversation) el.roomChatConversation.hidden = view !== "chat";
  if (el.phoneSearch) el.phoneSearch.hidden = view !== "search";
  if (el.phoneRequests) el.phoneRequests.hidden = view !== "requests";
  if (el.roomChatBack) el.roomChatBack.hidden = view === "contacts";
  const views = { contacts: el.roomChatContacts, chat: el.roomChatConversation, search: el.phoneSearch, requests: el.phoneRequests };
  Object.values(views).forEach(node => node?.getAnimations().forEach(animation => animation.cancel()));
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    views[view]?.animate([{ opacity: 0, transform: "translateY(7px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 200, easing: "ease-out" });
  }
}

function openPhoneSubview(view) {
  stopLocalChatTyping();
  stopDirectChatWatch();
  activeChatKind = null;
  closePhoneMenu();
  setPhoneHeaderAvatar(null);
  setPhoneMenuVisible(false);
  setChatStatus("");
  setPhoneView(view);
  if (view === "search") {
    el.roomChatTitle.textContent = "Buscar amigos";
    el.roomChatParticipants.textContent = "Escribí su nombre de usuario";
    if (el.addFriendResult) { el.addFriendResult.hidden = true; el.addFriendResult.textContent = ""; }
    el.addFriendInput?.focus();
  } else {
    el.roomChatTitle.textContent = "Solicitudes";
    el.roomChatParticipants.textContent = "Te quieren agregar";
    renderRequestsList();
  }
}

function setupPhoneUI() {
  el.roomChatMenuBtn?.addEventListener("click", () => {
    const open = el.roomChatMenu.hidden;
    el.roomChatMenu.hidden = !open;
    el.roomChatMenuBtn.setAttribute("aria-expanded", String(open));
    if (open) el.roomChatMenu.querySelector("button")?.focus();
  });
  el.roomChatMenu?.addEventListener("click", async (ev) => {
    const b = ev.target.closest("button[data-phone-menu]");
    if (!b || activeChatKind !== "direct" || !activeDirectUsername) return;
    const username = activeDirectUsername;
    const display = activeDirectDisplayName || username;
    closePhoneMenu();
    if (b.dataset.phoneMenu === "visit") {
      confirmPhoneVisit(username, display);
      return;
    }
    openPhoneConfirm(`¿Eliminar a ${display} de tus amigos?`, async () => {
      const res = await window.Cloud?.removeFriend?.(currentUsername, username);
      if (res && res.ok === false) { setChatStatus("No se pudo eliminar ahora. Probá de nuevo."); return; }
      showChatContacts();
    });
  });
  el.phoneHome?.addEventListener("click", () => {
    if (el.phoneConfirm && !el.phoneConfirm.hidden) { closePhoneConfirm(); return; }
    if (phoneView !== "contacts") showChatContacts();
    else setRoomChatOpen(false);
  });
  el.phoneSearchOpen?.addEventListener("click", () => openPhoneSubview("search"));
  el.friendsManageAdd?.addEventListener("click", () => openPhoneSubview("requests"));
  el.phoneConfirmNo?.addEventListener("click", closePhoneConfirm);
  el.phoneConfirmYes?.addEventListener("click", async () => {
    const action = phoneConfirmAction;
    el.phoneConfirmYes.disabled = true;
    try {
      if (action) await action();
      closePhoneConfirm();
    } catch {
      el.phoneConfirmText.textContent = "No se pudo completar. Probá de nuevo.";
    } finally { el.phoneConfirmYes.disabled = false; }
  });
  document.addEventListener("click", (ev) => {
    if (el.roomChatMenu && !el.roomChatMenu.hidden && !ev.target.closest(".phone-menu-wrap")) closePhoneMenu();
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape" || !el.roomChatPanel || el.roomChatPanel.hidden) return;
    if (el.roomChatMenu && !el.roomChatMenu.hidden) { closePhoneMenu(); el.roomChatMenuBtn?.focus(); return; }
    if (el.phoneConfirm && !el.phoneConfirm.hidden) { closePhoneConfirm(); return; }
    setRoomChatOpen(false);
    el.roomChatToggle?.focus();
  }, true);
}

function chatContactButton({ kind, username = "", label, preview, unread = 0, online = true }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "room-chat-contact-item";
  button.dataset.chatKind = kind;
  if (username) button.dataset.username = username;
  const dot = kind === "room" ? roomAvatarEl() : contactAvatarEl(username, online);
  const copy = document.createElement("span");
  copy.className = "room-chat-list-copy";
  const name = document.createElement("strong");
  name.textContent = label;
  const detail = document.createElement("small");
  detail.textContent = preview || "Abrir conversación";
  copy.append(name, detail);
  button.append(dot, copy);
  if (unread > 0) {
    const badge = document.createElement("b");
    badge.className = "room-chat-list-badge";
    badge.textContent = unread >= 99 ? "99+" : String(unread);
    button.appendChild(badge);
  }
  return button;
}

function friendChatContact(username, label, preview, unread) {
  const row = document.createElement("div");
  row.className = "room-chat-contact-item room-chat-friend-item";
  const online = !!friendPresence.get(username)?.online;
  const dot = contactAvatarEl(username, online);
  const copy = document.createElement("span");
  copy.className = "room-chat-list-copy";
  const name = document.createElement("strong");
  name.textContent = label;
  const detail = document.createElement("small");
  detail.textContent = preview || "Mensaje privado";
  copy.append(name, detail);
  const actions = document.createElement("span");
  actions.className = "room-chat-friend-actions";
  const visit = document.createElement("button");
  visit.type = "button";
  visit.dataset.friendAction = "visit";
  visit.dataset.username = username;
  visit.dataset.display = label;
  visit.className = "friend-icon-btn";
  visit.title = "Visitar";
  visit.setAttribute("aria-label", `Visitar a ${label}`);
  visit.innerHTML = friendIconHtml("visit", "Visitar");
  const chat = document.createElement("button");
  chat.type = "button";
  chat.dataset.friendAction = "chat";
  chat.dataset.username = username;
  chat.dataset.display = label;
  chat.className = "friend-icon-btn";
  chat.title = "Chat";
  chat.setAttribute("aria-label", unread > 0 ? `Chat con ${label}, ${unread} sin leer` : `Chat con ${label}`);
  chat.innerHTML = friendIconHtml("chat", "Chat");
  if (unread > 0) {
    const count = document.createElement("b");
    count.className = "friend-icon-badge";
    count.textContent = unread >= 99 ? "99+" : String(unread);
    chat.appendChild(count);
  }
  actions.append(visit, chat);
  row.append(dot, copy, actions);
  return row;
}

function directInboxFor(username) {
  return Object.values(directInbox || {})
    .filter((item) => item?.otherUsername === username)
    .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))[0] || null;
}

function renderChatContacts() {
  if (!el.roomChatContactList) return;
  el.roomChatContactList.innerHTML = "";
  el.roomChatContactList.appendChild(chatContactButton({
    kind: "room",
    label: roomChatContactLabel(watchedRoom),
    preview: roomMembersLabel,
    unread: roomUnreadCount,
    online: !!window.Multiplayer?.connected,
  }));
  const friends = myCloudData.friends || {};
  const friendKeys = Object.keys(friends).sort((a, b) => {
    const unreadA = Number(directInboxFor(a)?.unreadCount) || 0;
    const unreadB = Number(directInboxFor(b)?.unreadCount) || 0;
    if (unreadA !== unreadB) return unreadB - unreadA;
    return String(friends[a]?.displayName || a).localeCompare(String(friends[b]?.displayName || b), "es");
  });
  friendKeys.forEach((username) => {
    const summary = directInboxFor(username);
    el.roomChatContactList.appendChild(friendChatContact(
      username,
      friends[username]?.displayName || summary?.otherDisplayName || username,
      summary?.lastText || "Mensaje privado",
      Number(summary?.unreadCount) || 0
    ));
  });
  if (el.roomChatContactsEmpty) el.roomChatContactsEmpty.hidden = friendKeys.length > 0;
}

function showConversationShell() {
  setPhoneView("chat");
  if (el.roomChatTyping) { el.roomChatTyping.hidden = true; el.roomChatTyping.textContent = ""; }
  setChatStatus("");
}

function openRoomChatConversation() {
  stopDirectChatWatch();
  activeChatKind = "room";
  showConversationShell();
  updateRoomChatBadge(0);
  el.roomChatTitle.textContent = roomChatLabel(watchedRoom);
  el.roomChatParticipants.textContent = roomMembersLabel;
  setPhoneHeaderAvatar(roomAvatarEl());
  setPhoneMenuVisible(false);
  el.roomChatInput.placeholder = "Escribí en el chat de la casa...";
  renderChatMessages(roomChatMessagesCache, "Todavía no hay mensajes en esta casa.");
  el.roomChatInput.focus();
}

function renderDirectChat(messages) {
  if (activeChatKind !== "direct") return;
  if (messages === null) {
    setChatStatus("No se pudo cargar la conversación. Revisá la conexión o las reglas de Firebase.");
    return;
  }
  setChatStatus("");
  renderChatMessages(messages, `Todavía no hay mensajes con ${activeDirectDisplayName}.`);
  window.Multiplayer?.markDirectChatRead?.(activeDirectUsername).catch(() => {});
}

function openDirectChatConversation(username, displayName) {
  stopLocalChatTyping();
  stopDirectChatWatch();
  activeChatKind = "direct";
  activeDirectUsername = username;
  activeDirectDisplayName = displayName || username;
  showConversationShell();
  el.roomChatTitle.textContent = activeDirectDisplayName;
  el.roomChatParticipants.textContent = "Mensaje privado";
  setPhoneHeaderAvatar(contactAvatarEl(username, !!friendPresence.get(username)?.online));
  setPhoneMenuVisible(!!myCloudData.friends?.[username]);
  el.roomChatInput.placeholder = `Escribile a ${activeDirectDisplayName}...`;
  renderChatMessages([], `Cargando conversación con ${activeDirectDisplayName}...`);
  directChatUnsubscribe = window.Multiplayer.subscribeDirectChat(username, renderDirectChat);
  window.Multiplayer.markDirectChatRead(username).catch(() => {});
  el.roomChatInput.focus();
}

function stopDirectInboxWatch() {
  if (directInboxUnsubscribe) directInboxUnsubscribe();
  directInboxUnsubscribe = null;
  directInbox = {};
  refreshChatUnreadBadge();
}

function startDirectInboxWatch() {
  stopDirectInboxWatch();
  const Multiplayer = window.Multiplayer;
  if (!Multiplayer?.enabled || typeof Multiplayer.subscribeDirectInbox !== "function") return;
  directInboxUnsubscribe = Multiplayer.subscribeDirectInbox((inbox) => {
    if (inbox === null) return;
    directInbox = inbox;
    if (!el.roomChatPanel.hidden && activeChatKind === "direct" && activeDirectUsername) {
      const summary = directInboxFor(activeDirectUsername);
      if ((Number(summary?.unreadCount) || 0) > 0) Multiplayer.markDirectChatRead(activeDirectUsername).catch(() => {});
    }
    refreshChatUnreadBadge();
    if (!el.roomChatPanel.hidden && activeChatKind === null) renderChatContacts();
  });
}

function showOwnRoomChatBubble(text) {
  if (!text || state?.sleep?.dormida) return;
  showBubble(text, 3400);
  playMouthAnim(el.gameStage, "hablar", 3400);
}

async function sendCurrentRoomMessage(text) {
  const Multiplayer = window.Multiplayer;
  if (!Multiplayer?.connected) return { ok: false, reason: "offline" };
  const result = await Multiplayer.sendChatMessage(text).catch(() => ({ ok: false, reason: "write_failed" }));
  if (result.ok) showOwnRoomChatBubble(text);
  return result;
}

function setQuickChatActive(active) {
  if (!el.roomQuickChat) return;
  el.roomQuickChat.classList.toggle("is-active", active);
  if (active && !el.roomQuickChatInput?.disabled) el.roomQuickChatInput.focus();
}

function reportQuickChatError(reason) {
  if (!el.roomQuickChatInput) return;
  const message = reason === "rate_limit"
    ? "Esperá un instante antes de enviar otro mensaje."
    : reason === "offline"
      ? "Sin conexión. El mensaje no fue enviado."
      : "No se pudo enviar el mensaje.";
  el.roomQuickChat.classList.add("has-error");
  el.roomQuickChatInput.placeholder = message;
  clearTimeout(el.roomQuickChat._errorTimer);
  el.roomQuickChat._errorTimer = setTimeout(() => {
    el.roomQuickChat?.classList.remove("has-error");
    if (el.roomQuickChatInput) el.roomQuickChatInput.placeholder = "Presioná Enter para hablar en la sala...";
  }, 2800);
}

function setupRoomChatUI() {
  if (!el.roomChatToggle || !el.roomChatPanel || !el.roomChatForm) return;
  el.roomChatToggle.addEventListener("click", () => setRoomChatOpen(el.roomChatPanel.hidden));
  setupPhoneUI();
  el.roomChatClose.addEventListener("click", () => setRoomChatOpen(false));
  el.roomChatBack?.addEventListener("click", showChatContacts);
  el.roomChatContactList?.addEventListener("click", (ev) => {
    const friendAction = ev.target.closest("button[data-friend-action]");
    if (friendAction) {
      const username = friendAction.dataset.username;
      const display = friendAction.dataset.display || username;
      if (friendAction.dataset.friendAction === "visit") {
        confirmPhoneVisit(username, display);
      } else {
        openDirectChatConversation(username, display);
      }
      return;
    }
    const button = ev.target.closest("button[data-chat-kind]");
    if (!button) return;
    if (button.dataset.chatKind === "room") {
      openRoomChatConversation();
      return;
    }
    const username = button.dataset.username;
    const displayName = myCloudData.friends?.[username]?.displayName || directInboxFor(username)?.otherDisplayName || username;
    if (username) openDirectChatConversation(username, displayName);
  });
  el.roomChatInput.addEventListener("input", updateLocalChatTyping);
  el.roomQuickChatInput?.addEventListener("input", updateLocalChatTyping);
  document.getElementById("room-quick-chat-help")?.addEventListener("click", () => setQuickChatActive(true));
  el.roomQuickChatInput?.addEventListener("focus", () => setQuickChatActive(true));
  el.roomQuickChatInput?.addEventListener("blur", () => {
    setTimeout(() => {
      if (!el.roomQuickChat?.contains(document.activeElement) && !el.roomQuickChatInput?.value.trim()) setQuickChatActive(false);
    }, 0);
  });
  el.roomQuickChat?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const text = el.roomQuickChatInput.value.replace(/\s+/g, " ").trim().slice(0, 180);
    if (!text) return;
    el.roomQuickChatSend.disabled = true;
    const result = await sendCurrentRoomMessage(text);
    el.roomQuickChatSend.disabled = !window.Multiplayer?.connected;
    if (result.ok) {
      el.roomQuickChatInput.value = "";
      stopLocalChatTyping();
      setQuickChatActive(false);
      el.roomQuickChatInput.blur();
    } else {
      reportQuickChatError(result.reason);
      el.roomQuickChatInput.focus();
    }
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.defaultPrevented || ev.key !== "Enter" || ev.repeat || ev.ctrlKey || ev.metaKey || ev.altKey || ev.shiftKey) return;
    if (!el.roomQuickChat || el.roomQuickChat.hidden || el.game?.hidden || el.stageFloor?.classList.contains("is-editing") || minigame) return;
    if (!el.roomChatPanel?.hidden || document.querySelector(".modal-overlay:not([hidden])") || !document.getElementById("game-selector")?.hidden) return;
    const target = ev.target;
    if (target instanceof Element && target.closest("input, textarea, select, button, a, [contenteditable='true']")) return;
    ev.preventDefault();
    setQuickChatActive(true);
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stopLocalChatTyping(); });
  window.addEventListener("pagehide", stopLocalChatTyping);
  el.roomChatForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const text = el.roomChatInput.value.replace(/\s+/g, " ").trim().slice(0, 180);
    if (!text || !activeChatKind) return;
    const Multiplayer = window.Multiplayer;
    if (!Multiplayer?.connected) {
      setChatStatus("Sin conexión. El mensaje no fue enviado.");
      return;
    }
    el.roomChatSend.disabled = true;
    const sendingDirect = activeChatKind === "direct";
    const result = sendingDirect
      ? await Multiplayer.sendDirectMessage(activeDirectUsername, activeDirectDisplayName, text).catch(() => ({ ok: false, reason: "write_failed" }))
      : await sendCurrentRoomMessage(text);
    el.roomChatSend.disabled = false;
    if (result.ok) {
      el.roomChatInput.value = "";
      stopLocalChatTyping();
      setChatStatus("");
    } else if (result.reason === "rate_limit") {
      setChatStatus("Esperá un instante antes de enviar otro mensaje.");
    } else {
      setChatStatus("No se pudo enviar. Revisá la conexión o las reglas de Firebase.");
    }
    el.roomChatInput.focus();
  });
}

function emitRealtimeAction(type, data = {}) {
  const Multiplayer = window.Multiplayer;
  if (!Multiplayer?.enabled || typeof Multiplayer.emitAction !== "function") return false;
  const expectedRoom = activeVisit?.usernameLower || currentUsername;
  if (!expectedRoom || Multiplayer.currentRoom !== expectedRoom) return false;
  Multiplayer.emitAction(type, data).catch(() => {});
  return true;
}

function remoteActionTarget(username) {
  if (activeVisit?.usernameLower === username && el.visitWalkerHost && !el.visitWalkerHost.hidden) {
    return { walker: el.visitWalkerHost, stage: el.visitPetStageHost };
  }
  const walker = el.remotePlayersLayer?.querySelector(`.remote-player-walker[data-username="${username}"]`);
  return walker ? { walker, stage: walker.querySelector(".remote-player-stage") } : null;
}

function showRemoteBubble(walker, text, ms = 2200) {
  const bubble = walker?.querySelector(".remote-action-bubble");
  if (!bubble || !text) return;
  clearTimeout(bubble._hideTimer);
  clearTimeout(bubble._removeTimer);
  bubble.textContent = String(text).slice(0, 180);
  bubble.classList.remove("speech-bubble-hide");
  bubble.hidden = false;
  void bubble.offsetWidth;
  bubble._hideTimer = setTimeout(() => {
    bubble.classList.add("speech-bubble-hide");
    bubble._removeTimer = setTimeout(() => {
      bubble.hidden = true;
      bubble.classList.remove("speech-bubble-hide");
    }, prefersReducedMotion() ? 0 : BUBBLE_FADE_OUT_MS);
  }, ms);
}

function popRemoteHearts(walker) {
  for (let i = 0; i < 3; i += 1) {
    const heart = document.createElement("span");
    heart.className = "heart-pop";
    heart.textContent = PET_REACTIONS[Math.floor(Math.random() * PET_REACTIONS.length)];
    heart.style.left = `${42 + Math.random() * 16}%`;
    heart.style.animationDelay = `${i * 90}ms`;
    walker.appendChild(heart);
    setTimeout(() => heart.remove(), 1400);
  }
}

function scheduleRemoteEffect(walker, key, callback, delay) {
  walker._remoteEffectTimers = walker._remoteEffectTimers || {};
  clearTimeout(walker._remoteEffectTimers[key]);
  walker._remoteEffectTimers[key] = setTimeout(() => {
    delete walker._remoteEffectTimers[key];
    if (walker.isConnected) callback();
  }, delay);
}

function replayRemoteAction(event, allowQueue = true) {
  if (!event || event.actor === currentUsername) return;
  const target = remoteActionTarget(event.actor);
  if (!target) {
    const eventAge = (window.Multiplayer?.serverNow || Date.now()) - (Number(event.createdAt) || 0);
    if (allowQueue && eventAge >= -5000 && eventAge <= REMOTE_ACTION_QUEUE_MAX_AGE_MS) {
      const queue = pendingRemoteActions.get(event.actor) || [];
      queue.push(event);
      pendingRemoteActions.set(event.actor, queue.slice(-4));
    }
    return;
  }
  const { walker, stage } = target;
  const fx = walker.querySelector(".remote-bath-fx");
  const gameNames = { pesca: "la pesca", luciernagas: "las luciérnagas" };
  switch (event.type) {
    case "eat":
      playMouthAnim(stage, "comer", 900);
      showRemoteBubble(walker, "¡Ñam!");
      break;
    case "drink":
      playMouthAnim(stage, "beber", 650);
      showRemoteBubble(walker, "¡Glup!");
      break;
    case "talk":
      playMouthAnim(stage, "hablar", 3200);
      showRemoteBubble(walker, event.data?.text || "¡Hola!", 3200);
      break;
    case "pet":
      popRemoteHearts(walker);
      playMouthAnim(stage, "feliz", 520);
      break;
    case "bathe":
      fx?.classList.remove("bathing");
      void fx?.offsetWidth;
      fx?.classList.add("bathing");
      scheduleRemoteEffect(walker, "bathe", () => fx?.classList.remove("bathing"), 1300);
      showRemoteBubble(walker, "¡Qué fresquito!");
      break;
    case "sleep":
      walker.classList.add("is-sleeping");
      stage?.classList.add("sleeping");
      stage?.style.setProperty("--eye-scale", 0.04);
      break;
    case "wake":
      walker.classList.remove("is-sleeping");
      stage?.classList.remove("sleeping");
      stage?.style.setProperty("--eye-scale", 1);
      showRemoteBubble(walker, "¡Buenos días!");
      break;
    case "play":
      walker.classList.add("remote-action-playing");
      scheduleRemoteEffect(walker, "play", () => walker.classList.remove("remote-action-playing"), 30000);
      showRemoteBubble(walker, `¡A jugar ${gameNames[event.data?.game] || ""}!`.trim());
      break;
    case "play_end":
      clearTimeout(walker._remoteEffectTimers?.play);
      walker.classList.remove("remote-action-playing");
      playMouthAnim(stage, "feliz", 900);
      showRemoteBubble(walker, event.data?.result === "win" ? "¡Ganamos!" : "¡Buen juego!");
      break;
    case "medicine":
      walker.classList.remove("remote-action-medicine");
      void walker.offsetWidth;
      walker.classList.add("remote-action-medicine");
      scheduleRemoteEffect(walker, "medicine", () => walker.classList.remove("remote-action-medicine"), 1000);
      showRemoteBubble(walker, "¡Ya me siento mejor!");
      break;
    case "poop":
      stage?.classList.remove("is-pooping");
      void stage?.offsetWidth;
      stage?.classList.add("is-pooping");
      scheduleRemoteEffect(walker, "poop", () => stage?.classList.remove("is-pooping"), 1000);
      break;
    case "clean":
      showRemoteBubble(walker, "¡Gracias por limpiar!");
      break;
    default:
      break;
  }
}

function drainRemoteActions(username) {
  const now = window.Multiplayer?.serverNow || Date.now();
  const queue = (pendingRemoteActions.get(username) || []).filter((event) => now - (Number(event.createdAt) || 0) <= REMOTE_ACTION_QUEUE_MAX_AGE_MS);
  pendingRemoteActions.delete(username);
  queue.forEach((event) => replayRemoteAction(event, false));
}

function stableStringHash(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicWaypoint(username, index) {
  let x = (stableStringHash(username) ^ Math.imul(index + 1, 2654435761)) >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return 18 + (x >>> 0) % 65;
}

function smoothStep(t) {
  const n = clamp(t, 0, 1);
  return n * n * (3 - 2 * n);
}

function offlineHostFrame() {
  if (!offlineHostRunning || !activeVisit || !el.visitWalkerHost) return;
  const username = activeVisit.usernameLower;
  const now = window.Multiplayer?.serverNow || Date.now();
  const cycleMs = 18000;
  const cycle = Math.floor(now / cycleMs);
  const phase = (now % cycleMs) / cycleMs;
  const from = deterministicWaypoint(username, cycle);
  const to = deterministicWaypoint(username, cycle + 1);
  let xPct = from;
  let animation = "idle";
  if (phase >= 0.16 && phase < 0.78) {
    xPct = from + (to - from) * smoothStep((phase - 0.16) / 0.62);
    animation = "walking";
  } else if (phase >= 0.78) {
    xPct = to;
    if ((stableStringHash(username) + cycle) % 6 === 0 && phase > 0.84) animation = "sleeping";
  }

  el.visitWalkerHost.style.left = `${xPct.toFixed(2)}%`;
  el.visitWalkerHost.classList.toggle("is-facing-left", to < from);
  el.visitWalkerHost.classList.toggle("is-moving", animation === "walking");
  el.visitWalkerHost.classList.remove("is-running");
  el.visitWalkerHost.classList.toggle("is-sleeping", animation === "sleeping");
  el.visitPetStageHost.classList.toggle("sleeping", animation === "sleeping");
  if (animation === "sleeping") {
    el.visitPetStageHost.style.setProperty("--eye-scale", 0.04);
  } else {
    const petState = activeVisit.data?.petState;
    el.visitPetStageHost.style.setProperty("--eye-scale", computeEyeScale(petState?.stats || {}, petState?.health || {}));
  }
  activeVisit.npcAction = animation;
  el.visitHostPresence.title = animation === "walking" ? "Anfitrión ausente · NPC caminando" : animation === "sleeping" ? "Anfitrión ausente · NPC durmiendo" : "Anfitrión ausente · NPC descansando";
  offlineHostRaf = requestAnimationFrame(offlineHostFrame);
}

function startOfflineHostNpc() {
  if (!activeVisit || offlineHostRunning) return;
  clearTimeout(npcTransitionTimer);
  el.visitWalkerHost.classList.remove("npc-to-live");
  el.visitWalkerHost.classList.add("is-npc");
  offlineHostRunning = true;
  offlineHostFrame();
}

function stopOfflineHostNpc(transitionToLive) {
  const wasRunning = offlineHostRunning;
  offlineHostRunning = false;
  if (offlineHostRaf) cancelAnimationFrame(offlineHostRaf);
  offlineHostRaf = null;
  if (!el.visitWalkerHost) return;
  el.visitWalkerHost.classList.remove("is-npc");
  if (wasRunning && transitionToLive) {
    el.visitWalkerHost.classList.add("npc-to-live");
    clearTimeout(npcTransitionTimer);
    npcTransitionTimer = setTimeout(() => el.visitWalkerHost?.classList.remove("npc-to-live"), 850);
  } else if (!transitionToLive) {
    el.visitWalkerHost.classList.remove("npc-to-live");
  }
}

function stopRoomPlayerWatch() {
  stopLocalChatTyping();
  if (roomPlayersUnsubscribe) roomPlayersUnsubscribe();
  if (roomActionsUnsubscribe) roomActionsUnsubscribe();
  if (roomChatUnsubscribe) roomChatUnsubscribe();
  if (roomConnectionUnsubscribe) roomConnectionUnsubscribe();
  if (roomMembersUnsubscribe) roomMembersUnsubscribe();
  if (roomTypingUnsubscribe) roomTypingUnsubscribe();
  roomPlayersUnsubscribe = null;
  roomActionsUnsubscribe = null;
  roomChatUnsubscribe = null;
  roomConnectionUnsubscribe = null;
  roomMembersUnsubscribe = null;
  roomTypingUnsubscribe = null;
  watchedRoom = null;
  pendingRemoteActions.clear();
  if (el.remotePlayersLayer) el.remotePlayersLayer.innerHTML = "";
  if (el.roomChatToggle) el.roomChatToggle.hidden = true;
  if (el.roomQuickChat) {
    el.roomQuickChat.hidden = true;
    el.roomQuickChat.classList.remove("is-active", "has-error");
  }
  if (el.roomQuickChatInput) {
    el.roomQuickChatInput.value = "";
    el.roomQuickChatInput.blur();
  }
  setRoomChatOpen(false);
}

function applyRemoteMovement(node, movement) {
  node.style.left = `${movement.xPct}%`;
  node.classList.toggle("is-facing-left", movement.direction === "left");
  node.classList.toggle("is-moving", movement.animation === "walking" || movement.animation === "running");
  node.classList.toggle("is-running", movement.animation === "running");
  node.classList.toggle("is-sleeping", movement.animation === "sleeping");
}

async function loadRemoteProfile(username, node) {
  if (!window.Cloud || !node) return;
  let request = remoteProfileCache.get(username);
  if (!request) {
    request = window.Cloud.getPlayerData(username);
    remoteProfileCache.set(username, request);
  }
  const result = await request.catch(() => null);
  if (!result?.ok || !result.data?.petState || !node.isConnected) return;
  const petState = result.data.petState;
  const stage = node.querySelector(".remote-player-stage");
  const label = node.querySelector(".remote-player-name");
  if (!stage) return;
  renderPetLayers(stage, petState.look || defaultLook(), petState.wardrobe);
  const mood = petState.health?.enferma ? "triste" : moodFromStats(petState.stats || {});
  stage.classList.remove("mood-feliz", "mood-normal", "mood-triste", "mood-critico");
  stage.classList.add("mood-" + mood);
  stage.classList.toggle("sick", !!petState.health?.enferma);
  stage.style.setProperty("--eye-scale", computeEyeScale(petState.stats || {}, petState.health || {}));
  if (label) label.textContent = petState.name || result.data.username || username;
}

function createRemotePlayerNode(player) {
  const node = document.createElement("div");
  node.className = "walker remote-player-walker";
  node.dataset.username = player.username;
  node.innerHTML = '<div class="pet-shadow" aria-hidden="true"></div><div class="pet-stage remote-player-stage" role="img"></div><div class="speech-bubble remote-action-bubble" hidden></div><div class="bath-fx remote-bath-fx" aria-hidden="true"></div><div class="remote-player-tag"><span class="remote-player-name"></span><span class="remote-live-dot" title="En línea"></span></div><div class="zzz-fx" aria-hidden="true"><span>z</span><span>Z</span><span>Z</span></div>';
  node.querySelector(".remote-player-name").textContent = player.displayName || player.username;
  node.querySelector(".remote-player-stage").setAttribute("aria-label", `Mascota de ${player.displayName || player.username}`);
  renderPetLayers(node.querySelector(".remote-player-stage"), defaultLook());
  el.remotePlayersLayer.appendChild(node);
  loadRemoteProfile(player.username, node);
  drainRemoteActions(player.username);
  return node;
}

function renderRoomPlayers(players) {
  if (!el.remotePlayersLayer) return;
  const remotePlayers = players.filter((player) => player.username !== currentUsername);
  const hostUsername = activeVisit?.usernameLower || null;
  const hostMovement = hostUsername ? remotePlayers.find((player) => player.username === hostUsername) || null : null;
  if (activeVisit) {
    activeVisit.hostMovement = hostMovement;
    if (hostMovement) {
      stopOfflineHostNpc(true);
      applyRemoteMovement(el.visitWalkerHost, hostMovement);
    } else {
      el.visitWalkerHost.classList.remove("is-facing-left", "is-moving", "is-running");
    }
    if (activeVisit.data) renderVisit(activeVisit.displayName, activeVisit.data);
  }

  const visible = remotePlayers.filter((player) => player.username !== hostUsername);
  const wanted = new Set(visible.map((player) => player.username));
  el.remotePlayersLayer.querySelectorAll(".remote-player-walker").forEach((node) => {
    if (!wanted.has(node.dataset.username)) node.remove();
  });
  visible.forEach((player) => {
    let node = el.remotePlayersLayer.querySelector(`.remote-player-walker[data-username="${player.username}"]`);
    if (!node) node = createRemotePlayerNode(player);
    applyRemoteMovement(node, player);
  });
}

function watchRoomPlayers(room) {
  const Multiplayer = window.Multiplayer;
  if (!Multiplayer || !Multiplayer.enabled || !room) return;
  if (watchedRoom === room && roomPlayersUnsubscribe && roomActionsUnsubscribe && roomChatUnsubscribe && roomMembersUnsubscribe && roomTypingUnsubscribe) return;
  stopRoomPlayerWatch();
  watchedRoom = room;
  resetRoomChat(room);
  if (el.roomChatToggle) el.roomChatToggle.hidden = false;
  if (el.roomQuickChat) el.roomQuickChat.hidden = false;
  syncHudLayout();
  roomPlayersUnsubscribe = Multiplayer.subscribeRoomPlayers(room, renderRoomPlayers);
  roomActionsUnsubscribe = Multiplayer.subscribeRoomActions(room, replayRemoteAction);
  roomChatUnsubscribe = Multiplayer.subscribeRoomChat(room, renderRoomChat);
  roomMembersUnsubscribe = Multiplayer.subscribeRoom(room, renderRoomMembers);
  roomTypingUnsubscribe = Multiplayer.subscribeRoomTyping(room, renderRoomTyping);
  roomConnectionUnsubscribe = Multiplayer.subscribeConnection(updateRoomRealtimeConnection);
}

function renderVisit(displayName, data) {
  if (!activeVisit || !el.stageFloor.classList.contains("is-visiting")) return;
  activeVisit.data = data || null;
  renderHousingScene();
  if (!data || !data.petState) {
    el.visitStatusLine.textContent = `No se pudo cargar la casa de ${displayName} ahora mismo.`;
    stageTransitionError(activeVisit.transitionId, "No se pudo cargar esta casa.");
    delete el.visitPetStageHost.dataset.lookKey;
    el.visitPetStageHost.innerHTML = "";
    el.visitWalkerHost.hidden = true;
    renderDirt();
    return;
  }
  const petState = data.petState;
  const petName = petState.name || displayName;
  const estimatedActive = typeof data.lastActive === "number" && Date.now() - data.lastActive < VISIT_ACTIVE_THRESHOLD_MS;
  const hasRealtimePresence = activeVisit.presenceKnown;
  const online = hasRealtimePresence ? !!activeVisit.presence?.online || !!activeVisit.hostMovement : estimatedActive;
  const atHome = hasRealtimePresence
    ? !!activeVisit.hostMovement || (online && activeVisit.presence.currentRooms.includes(activeVisit.usernameLower))
    : estimatedActive;
  const hasLiveMovement = atHome && !!activeVisit.hostMovement;
  const asleep = hasLiveMovement && (activeVisit.hostMovement.animation === "sleeping" || !!(petState.sleep && petState.sleep.dormida));

  el.visitWalkerHost.hidden = false;
  drainRemoteActions(activeVisit.usernameLower);
  renderPetLayers(el.visitPetStageHost, petState.look || defaultLook(), petState.wardrobe);
  const mood = moodFromStats(petState.stats || {});
  el.visitPetStageHost.classList.remove("mood-feliz", "mood-normal", "mood-triste", "mood-critico");
  el.visitPetStageHost.classList.add("mood-" + mood);
  el.visitPetStageHost.classList.toggle("sleeping", asleep);
  el.visitPetStageHost.classList.remove("sick");
  el.visitPetStageHost.style.setProperty(
    "--eye-scale",
    asleep ? 0.04 : computeEyeScale(petState.stats || {})
  );
  el.visitWalkerHost.classList.toggle("is-sleeping", asleep);
  el.visitWalkerHost.classList.remove("is-wandering");
  el.visitWalkerHost.classList.toggle("is-moving", hasLiveMovement && ["walking", "running"].includes(activeVisit.hostMovement?.animation));
  el.visitWalkerHost.classList.toggle("is-running", hasLiveMovement && activeVisit.hostMovement?.animation === "running");
  el.visitWalkerHost.classList.toggle("is-online", online);
  el.visitHostName.textContent = petName;
  el.visitHostPresence.title = online ? "Conectado" : "Desconectado";
  renderDirt();

  if (hasLiveMovement) {
    if (offlineHostRunning) stopOfflineHostNpc(true);
  } else {
    startOfflineHostNpc();
  }

  if (hasRealtimePresence && online && !atHome) {
    el.visitStatusLine.textContent = `${displayName} está conectado, pero visitando otra casa · ${petName} queda al cuidado automático de la casa.`;
  } else if (!online) {
    el.visitStatusLine.textContent = `${displayName} está desconectado · ${petName} está activo como NPC compartido.`;
  } else if (!hasLiveMovement) {
    el.visitStatusLine.textContent = `${displayName} está conectado · sincronizando su movimiento...`;
  } else if (asleep) {
    el.visitStatusLine.textContent = `${displayName} está conectado · ${petName} está durmiendo.`;
  } else {
    el.visitStatusLine.textContent = `${displayName} está conectado · estado actualizado desde la nube.`;
  }
  if (!activeVisit.entrancePromise) {
    const visit = activeVisit;
    visit.entrancePromise = prepareVisitEntrance(visit);
  }
}

function placeVisitorAtDoor() {
  computeWalkBounds();
  const door = el.locationDeco.querySelector("#scene-puerta");
  const stageBounds = el.stageFloor.getBoundingClientRect();
  const doorBounds = door?.getBoundingClientRect();
  const walkerWidth = el.walker.offsetWidth || 200;
  const doorCenter = doorBounds && doorBounds.width
    ? doorBounds.left + doorBounds.width / 2 - stageBounds.left
    : WALK_PAD + walkerWidth / 2 + 20;
  walkX = clamp(doorCenter - walkerWidth / 2 - WALK_PAD, 0, walkMax);
  walkTarget = walkX;
  walkState = "idle";
  walkStateUntil = performance.now() + 1000;
  el.walker.style.transform = `translateX(${(walkX + WALK_PAD).toFixed(1)}px)`;
  restLegs();
}

async function prepareVisitEntrance(visit) {
  const housing = normalizeHousing(visit.data?.petState?.housing);
  await Promise.race([preloadHousingAssets(housing), wait(4000)]);
  await nextStagePaint();
  if (activeVisit !== visit || !visit.data?.petState) {
    if (activeVisit === visit) visit.entrancePromise = null;
    return;
  }
  placeVisitorAtDoor();
  visit.entranceReady = true;
  clearTimeout(visit.loadTimeout);
  connectVisitPresence(visit);
  await endStageTransition(visit.transitionId);
  if (activeVisit === visit) announce(`Entraste a la casa de ${visit.displayName}.`);
}

async function connectVisitPresence(visit) {
  const Multiplayer = await waitForMultiplayer(4000);
  if (!activeVisit || activeVisit !== visit) return;
  if (!Multiplayer || !Multiplayer.enabled) {
    el.visitRoomCount.textContent = "Estado estimado · tiempo real no configurado";
    el.visitRoomCount.title = "La app usa la última actividad guardada; el chat y la presencia en vivo requieren Realtime Database.";
    return;
  }
  try {
    const ready = await Multiplayer.ready;
    if (!ready) {
      el.visitRoomCount.textContent = "Estado estimado · tiempo real no disponible";
      el.visitRoomCount.title = "No se pudo abrir Realtime Database. Revisá su URL, las reglas publicadas y la conexión.";
      return;
    }
    await realtimePresencePromise;
    if (!activeVisit || activeVisit !== visit) return;
    await switchRealtimeRoom(visit.usernameLower);
    if (!activeVisit || activeVisit !== visit) return;
    watchRoomPlayers(visit.usernameLower);
    visit.presenceUnsubscribe = Multiplayer.subscribeUserPresence(visit.usernameLower, (presence) => {
      if (!activeVisit || activeVisit !== visit) return;
      visit.presenceKnown = true;
      visit.presence = presence || { online: false, currentRooms: [], connections: 0 };
      renderVisit(visit.displayName, visit.data);
    });
  } catch (err) {
    if (activeVisit === visit) {
      el.visitRoomCount.textContent = "Estado estimado · tiempo real no disponible";
      el.visitRoomCount.title = "No se pudo abrir Realtime Database. Revisá su URL, las reglas publicadas y la conexión.";
    }
  }
}

function openVisit(usernameLower, displayName) {
  if (!window.Cloud || !window.Cloud.enabled || !usernameLower) return;
  if (housingEditing) stopHousingEdit();
  closeVisit({ skipTransition: true, enteringAnotherVisit: true });
  const transitionId = beginStageTransition(`Viajando a la casa de ${displayName}...`);
  activeVisit = {
    usernameLower,
    displayName,
    data: null,
    presence: null,
    presenceKnown: false,
    presenceUnsubscribe: null,
    hostMovement: null,
    transitionId,
    entrancePromise: null,
    entranceReady: false,
    loadTimeout: null,
  };
  // La interfaz deja de escuchar la sala anterior de inmediato; durante
  // el breve cambio de sala no se envían chat, movimiento ni acciones al
  // destino equivocado.
  stopRoomPlayerWatch();
  const visit = activeVisit;
  el.visitTitle.textContent = `Casa de ${displayName}`;
  el.visitStatusLine.textContent = "Conectando...";
  el.visitRoomCount.textContent = "Comprobando presencia...";
  delete el.visitPetStageHost.dataset.lookKey;
  el.visitPetStageHost.innerHTML = "";
  el.visitPetStageHost.className = "pet-stage game-stage";
  el.visitWalkerHost.classList.remove("is-sleeping", "is-wandering", "is-online");
  el.visitWalkerHost.hidden = true;
  el.visitContext.hidden = false;
  el.stageFloor.classList.add("is-visiting");
  setLocationVisuals("casa");
  renderDirt();
  updateActionsAvailability();
  computeWalkBounds();
  activeVisit.loadTimeout = setTimeout(() => {
    if (activeVisit === visit && !visit.entranceReady) stageTransitionError(transitionId, "La casa tarda demasiado en cargar.");
  }, 8000);
  visitUnsubscribe = window.Cloud.subscribeToPlayer(usernameLower, (data) => {
    if (activeVisit === visit) renderVisit(displayName, data);
  });
}

function closeVisit({ skipTransition = false, enteringAnotherVisit = false } = {}) {
  const transitionId = activeVisit && !skipTransition ? beginStageTransition("Volviendo a tu casa...") : null;
  if (visitUnsubscribe) {
    visitUnsubscribe();
    visitUnsubscribe = null;
  }
  const previousVisit = activeVisit;
  const wasVisiting = !!previousVisit;
  if (previousVisit?.loadTimeout) clearTimeout(previousVisit.loadTimeout);
  if (previousVisit?.presenceUnsubscribe) previousVisit.presenceUnsubscribe();
  if (wasVisiting) stopRoomPlayerWatch();
  stopOfflineHostNpc(false);
  activeVisit = null;
  if (wasVisiting && !enteringAnotherVisit && window.Multiplayer && window.Multiplayer.enabled && currentUsername) {
    switchRealtimeRoom(currentUsername).then(() => {
      if (!activeVisit) watchRoomPlayers(currentUsername);
    }).catch(() => {});
  }
  if (el.visitContext) el.visitContext.hidden = true;
  if (el.visitWalkerHost) {
    el.visitWalkerHost.hidden = true;
    el.visitWalkerHost.style.removeProperty("left");
    el.visitWalkerHost.classList.remove("is-sleeping", "is-wandering", "is-online", "is-facing-left", "is-moving", "is-running", "is-npc", "npc-to-live");
  }
  if (el.stageFloor) el.stageFloor.classList.remove("is-visiting");
  if (wasVisiting && state) {
    setLocationVisuals(state.location);
    refreshUI();
    updateCooldownButtons();
    computeWalkBounds();
    announce("Volviste a tu casa.");
  }
  if (transitionId) endStageTransition(transitionId, state?.location === "casa" ? state.housing : null);
}

function setupVisitUI() {
  if (!el.visitContext || !el.visitClose) return;
  el.visitClose.addEventListener("click", () => closeVisit());
  el.stageTransitionBack?.addEventListener("click", () => closeVisit());
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Escape") return;
    if (el.roomChatPanel && !el.roomChatPanel.hidden) {
      setRoomChatOpen(false);
      return;
    }
    if (activeVisit) closeVisit();
  });
}
