/* ==========================================================================
   Beta v4.6.4 — Ruleta diaria
   Una tirada gratis por día (state.daily.rouletteSpun, se reinicia con la
   fecha); v4.6.11: las siguientes cuestan ROULETTE_EXTRA_COST monedas.
   No se viaja: se abre encima de la casa, como el inventario. Se entra
   desde el tercer recuadro de Minijuegos.

   Arte (v4.6.9): assets/games/roulette/wheel-v2.svg (ruleta.ai) y
   pointer.svg (puntero_ruleta.ai), ver scripts/export-roulette-v469.py.
   Los gajos del dibujo vienen de
   distinto ancho; cada premio va en el suyo, del más ancho al más angosto
   según la probabilidad. La probabilidad real es la de `weight` (el sorteo
   no depende del ancho dibujado).
   ========================================================================== */

// v4.6.9: ruleta nueva (ruleta.ai y puntero_ruleta.ai, vectoriales; ver
// scripts/export-roulette-v469.py). La misma ruleta se usa en tres capas:
// entera y quieta abajo, el disco (recortado en círculo) que gira, y el
// botón central quieto encima; la flecha es su propio dibujo.
const ROULETTE_ART = {
  wheel: liteArt("assets/games/roulette/wheel-v2.svg"),
  pointer: liteArt("assets/games/roulette/pointer.svg"),
};
const ROULETTE_ICON = {
  coin: "assets/shop/moneda.svg",
  fish: "assets/ui/inventory/cofre/pescado.svg",
  energy: liteArt("assets/ui/inventory/cofre/energizante.svg"),
  can: liteArt("assets/games/fishing/can.svg"),
  crown: "assets/clothes/corona-preview.png",
};
const ROULETTE_STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="#ffd34d" stroke="#5a3a22" stroke-width="1.8" stroke-linejoin="round"/></svg>';

// Centro y radio del disco en % del dibujo (medidos sobre ruleta.ai, 1254 px).
const ROULETTE_GEOM = { cx: 50, cy: 49.88, r: 38.84 };

// Gajos en grados, en sentido horario desde arriba (0° = donde apunta el
// puntero con la ruleta quieta). weight = probabilidad en %.
const ROULETTE_PRIZES = [
  // v4.6.9: gajos medidos sobre la ruleta nueva (líneas en 0, 73.5, 133.5,
  // 191.5, 234, 274, 310, 344 y 359°), con 1,5° de margen a cada lado.
  { id: "coins10", weight: 30, from: 1.5, to: 72, label: "10 monedas", icon: "coin", tag: "10" },
  { id: "fish2", weight: 16, from: 75, to: 132, label: "2 pescados", icon: "fish", tag: "×2" },
  { id: "coins25", weight: 12, from: 135, to: 190, label: "25 monedas", icon: "coin", tag: "25" },
  { id: "energizante", weight: 11, from: 193, to: 232.5, label: "1 lata energizante", icon: "energy", tag: "" },
  { id: "xp30", weight: 11, from: 235.5, to: 272.5, label: "30 de experiencia", icon: "star", tag: "+30" },
  { id: "lata", weight: 9, from: 275.5, to: 308.5, label: "1 lata (chatarra)", icon: "can", tag: "" },
  { id: "coins100", weight: 8, from: 311.5, to: 342.5, label: "100 monedas", icon: "coin", tag: "100" },
  { id: "corona", weight: 3, from: 345.5, to: 357.5, label: "la Corona", icon: "crown", tag: "", small: true },
];

let rouletteAngle = 0;
let rouletteSpinning = false;

function rouletteIconHtml(prize) {
  const img = prize.icon === "star" ? ROULETTE_STAR : `<img src="${ROULETTE_ICON[prize.icon]}" alt="" draggable="false" />`;
  return `${img}${prize.tag ? `<b>${prize.tag}</b>` : ""}`;
}

function buildRoulette() {
  const wheel = document.getElementById("roulette-wheel");
  if (!wheel || wheel.dataset.ready) return;
  const G = ROULETTE_GEOM;
  const icons = ROULETTE_PRIZES.map((p) => {
    const mid = (p.from + p.to) / 2;
    const rad = mid * Math.PI / 180;
    const dist = G.r * (p.small ? .8 : .62);
    const x = G.cx + dist * Math.sin(rad);
    const y = G.cy - dist * Math.cos(rad);
    return `<span class="rw-prize${p.small ? " is-small" : ""}" data-prize="${p.id}" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;--a:${mid}deg">${rouletteIconHtml(p)}</span>`;
  }).join("");
  wheel.innerHTML = `
    <img class="rw-layer rw-base" src="${ROULETTE_ART.wheel}" alt="" draggable="false" />
    <div class="rw-layer rw-disc" id="roulette-disc">
      <img class="rw-layer rw-disc-art" src="${ROULETTE_ART.wheel}" alt="" draggable="false" />
      ${icons}
    </div>
    <span class="rw-hub-ring"></span>
    <img class="rw-layer rw-hub" src="${ROULETTE_ART.wheel}" alt="" draggable="false" />
    <img class="rw-pointer" src="${ROULETTE_ART.pointer}" alt="" draggable="false" />`;
  wheel.dataset.ready = "1";
}

function rouletteBlockReason() {
  return typeof gameBlockReason === "function" ? gameBlockReason("ruleta") : "";
}

const ROULETTE_COIN_IMG = '<img class="roulette-coin" src="assets/shop/moneda.svg" alt="" draggable="false" />';

/** v4.6.11: precio de la próxima tirada (0 = la gratis del día). */
function rouletteNextCost() {
  return typeof rouletteFreeAvailable === "function" && rouletteFreeAvailable() ? 0 : ROULETTE_EXTRA_COST;
}

function rouletteCoins() {
  return Math.max(0, state?.economy?.coins || 0);
}

function updateRouletteUI() {
  const btn = document.getElementById("roulette-spin");
  const status = document.getElementById("roulette-status");
  if (!btn || !state) return;
  const why = rouletteBlockReason();
  const cost = rouletteNextCost();
  const short = cost > 0 && rouletteCoins() < cost;
  const confirming = !document.getElementById("roulette-confirm")?.hidden;
  btn.disabled = rouletteSpinning || confirming || !!why || short;
  btn.classList.toggle("is-paid", cost > 0);
  btn.innerHTML = cost > 0
    ? `<span>Girar</span><span class="roulette-price">${ROULETTE_COIN_IMG}<b>${cost}</b></span>`
    : "<span>¡Girar gratis!</span>";
  btn.setAttribute("aria-label", cost > 0 ? `Girar la ruleta por ${cost} monedas` : "Girar la ruleta gratis");
  if (status && !rouletteSpinning) {
    if (why) status.textContent = why;
    else if (cost === 0) status.textContent = "La primera tirada del día es gratis. ¡Suerte!";
    else if (short) status.textContent = `Te faltan ${cost - rouletteCoins()} monedas para otra tirada (cuesta ${cost}).`;
    else status.textContent = `Ya usaste la tirada gratis de hoy. Cada tirada extra cuesta ${cost} monedas.`;
  }
}

function openRoulette() {
  if (!state) return;
  buildRoulette();
  closeAllMenus?.();
  const overlay = document.getElementById("roulette-overlay");
  document.getElementById("roulette-result").hidden = true;
  hideRouletteConfirm(false);
  overlay.hidden = false;
  updateRouletteUI();
  (document.getElementById("roulette-spin").disabled ? document.getElementById("roulette-close") : document.getElementById("roulette-spin")).focus();
}

function closeRoulette() {
  if (rouletteSpinning) return;          // que termine de girar
  const overlay = document.getElementById("roulette-overlay");
  if (!overlay || overlay.hidden) return;
  if (!document.getElementById("roulette-confirm")?.hidden) { hideRouletteConfirm(); return; }
  overlay.hidden = true;
  document.getElementById("btn-jugar")?.focus();
}

function pickRoulettePrize() {
  const total = ROULETTE_PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  for (const p of ROULETTE_PRIZES) {
    roll -= p.weight;
    if (roll < 0) return p;
  }
  return ROULETTE_PRIZES[0];
}

/** Aplica el premio al guardado y devuelve el texto a mostrar. */
function applyRoulettePrize(prize) {
  state.economy = state.economy || { coins: 0 };
  const addCoins = (n) => { state.economy.coins = Math.max(0, (state.economy.coins || 0) + n); };
  switch (prize.id) {
    case "coins10": addCoins(10); break;
    case "coins25": addCoins(25); break;
    case "coins100": addCoins(100); break;
    case "fish2": state.inventory.pescado = (state.inventory.pescado || 0) + 2; break;
    case "energizante": state.inventory.energizante = (state.inventory.energizante || 0) + 1; break;
    case "lata": state.inventory.lata = (state.inventory.lata || 0) + 1; break;
    case "xp30": addBond(30); break;
    case "corona": {
      const owned = state.wardrobe?.owned?.accesorios;
      if (owned?.corona_1) {
        // Pedido: si ya la tiene, se cambia por 100 monedas.
        addCoins(100);
        return { title: "¡Salió la Corona!", text: "Ya la tenías, así que te llevás 100 monedas." };
      }
      if (owned) owned.corona_1 = true;
      return { title: "¡Ganaste la Corona!", text: "Ya está en tu ropero, en Accesorios." };
    }
    default: break;
  }
  return { title: `¡Ganaste ${prize.label}!`, text: prize.id === "lata" ? "Chatarra… pero algún día se va a poder vender." : "" };
}

/* v4.6.11: tiradas pagas. El botón muestra el precio; antes de cobrar se
   pide confirmación dentro de la misma ventana, y si no alcanzan las
   monedas el botón queda bloqueado (ver updateRouletteUI). */
function showRouletteConfirm(cost) {
  const box = document.getElementById("roulette-confirm");
  if (!box) return;
  box.innerHTML = `
    <div class="roulette-confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="roulette-confirm-title" aria-describedby="roulette-confirm-text">
      <h3 id="roulette-confirm-title">¿Otra tirada?</h3>
      <p id="roulette-confirm-text">Cuesta <span class="roulette-price">${ROULETTE_COIN_IMG}<b>${cost}</b></span> monedas. Te quedarían ${rouletteCoins() - cost}.</p>
      <div class="roulette-confirm-actions">
        <button type="button" class="games-btn roulette-confirm-no" data-roulette-no>No, gracias</button>
        <button type="button" class="games-btn roulette-confirm-yes" data-roulette-yes>¡Sí, girar!</button>
      </div>
    </div>`;
  box.hidden = false;
  box.querySelector("[data-roulette-no]").addEventListener("click", () => hideRouletteConfirm());
  box.querySelector("[data-roulette-yes]").addEventListener("click", () => { hideRouletteConfirm(false); spinRoulette(true); });
  updateRouletteUI();
  box.querySelector("[data-roulette-yes]").focus();
}

function hideRouletteConfirm(refocus = true) {
  const box = document.getElementById("roulette-confirm");
  if (!box || box.hidden) return;
  box.hidden = true;
  box.innerHTML = "";
  updateRouletteUI();
  if (refocus) {
    const spin = document.getElementById("roulette-spin");
    (spin && !spin.disabled ? spin : document.getElementById("roulette-close"))?.focus();
  }
}

function spinRoulette(confirmed = false) {
  if (rouletteSpinning || !state) return;
  const why = rouletteBlockReason();
  if (why) { updateRouletteUI(); return; }
  ensureDailyProgress();
  const cost = rouletteNextCost();
  if (cost > 0) {
    if (rouletteCoins() < cost) { updateRouletteUI(); return; }
    if (confirmed !== true) { showRouletteConfirm(cost); return; }
    state.economy.coins = rouletteCoins() - cost;
  }
  const prize = pickRoulettePrize();
  // La tirada gratis del día (o las monedas) se gastan y el premio se
  // guarda al girar (así no se puede repetir recargando a mitad de la
  // animación).
  if (!gamesUnlimited()) state.daily.rouletteSpun = true;
  updateCoinCount?.();
  const result = applyRoulettePrize(prize);
  trySave(state);
  registerInteraction?.();

  const span = prize.to - prize.from;
  const target = prize.from + span * (.2 + Math.random() * .6);   // lejos de las líneas
  const base = rouletteAngle;
  const needed = ((-target - base) % 360 + 360) % 360;
  rouletteAngle = base + 360 * 6 + needed;
  rouletteSpinning = true;
  updateRouletteUI();
  document.getElementById("roulette-status").textContent = "Girando…";
  const disc = document.getElementById("roulette-disc");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ms = reduce ? 1200 : 5200;
  disc.style.transition = `transform ${ms}ms cubic-bezier(.12, .7, .12, 1)`;
  disc.style.transform = `rotate(${rouletteAngle}deg)`;
  setTimeout(() => finishRouletteSpin(prize, result), ms + 120);
}

function finishRouletteSpin(prize, result) {
  rouletteSpinning = false;
  refreshUI?.();
  refreshInventory?.();
  updateCooldownButtons?.();
  if (prize.id === "corona" || prize.id === "coins100") popHearts?.();
  const box = document.getElementById("roulette-result");
  box.innerHTML = `
    <div class="roulette-result-card" role="status">
      <span class="roulette-result-icon">${rouletteIconHtml(prize)}</span>
      <h3>${result.title}</h3>
      ${result.text ? `<p>${result.text}</p>` : ""}
      <button type="button" class="games-btn" data-roulette-ok>¡Genial!</button>
    </div>`;
  box.hidden = false;
  box.querySelector("[data-roulette-ok]").addEventListener("click", () => { box.hidden = true; updateRouletteUI(); document.getElementById("roulette-close")?.focus(); });
  box.querySelector("[data-roulette-ok]").focus();
  updateRouletteUI();
}

function setupRoulette() {
  document.getElementById("roulette-spin")?.addEventListener("click", () => spinRoulette());
  document.getElementById("roulette-close")?.addEventListener("click", closeRoulette);
  const reminderIcon = document.querySelector("#roulette-reminder .roulette-reminder-icon");
  if (reminderIcon) reminderIcon.src = liteArt("assets/games/roulette/icon.svg");
  document.getElementById("roulette-reminder")?.addEventListener("click", () => {
    if (typeof minigame !== "undefined" && minigame) return;
    if (typeof gameTrip !== "undefined" && gameTrip) return;
    openRoulette();
  });
  const overlay = document.getElementById("roulette-overlay");
  overlay?.addEventListener("click", (ev) => { if (ev.target === overlay) closeRoulette(); });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && overlay && !overlay.hidden) { ev.preventDefault(); closeRoulette(); }
  });
}
