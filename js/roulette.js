/* ==========================================================================
   Beta v4.6.4 — Ruleta diaria
   Una tirada por día (state.daily.rouletteSpun, se reinicia con la fecha).
   No se viaja: se abre encima de la casa, como el inventario. Se entra
   desde el tercer recuadro de Minijuegos.

   Arte: assets/games/roulette/wheel.svg (la ruleta completa, quieta: aro,
   puntero y botón central) + disc.svg (sólo el disco de colores, que gira).
   Ver scripts/export-games-v464.py. Los gajos del dibujo ya vienen de
   distinto ancho; cada premio va en el suyo, del más ancho al más angosto
   según la probabilidad. La probabilidad real es la de `weight` (el sorteo
   no depende del ancho dibujado).
   ========================================================================== */

const ROULETTE_ART = {
  wheel: liteArt("assets/games/roulette/wheel.svg"),
  disc: liteArt("assets/games/roulette/disc.svg"),
};
const ROULETTE_ICON = {
  coin: "assets/shop/moneda.svg",
  fish: "assets/ui/inventory/cofre/pescado.svg",
  energy: liteArt("assets/ui/inventory/cofre/energizante.svg"),
  can: liteArt("assets/games/fishing/can.svg"),
  crown: "assets/clothes/corona-preview.png",
};
const ROULETTE_STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="#ffd34d" stroke="#5a3a22" stroke-width="1.8" stroke-linejoin="round"/></svg>';

// Centro y radio del disco en % del dibujo (medidos sobre ruleta.png, 1254 px).
const ROULETTE_GEOM = { cx: 49.88, cy: 50.96, r: 39.39 };

// Gajos en grados, en sentido horario desde arriba (0° = donde apunta el
// puntero con la ruleta quieta). weight = probabilidad en %.
const ROULETTE_PRIZES = [
  { id: "coins10", weight: 30, from: -2, to: 73.5, label: "10 monedas", icon: "coin", tag: "10" },
  { id: "fish2", weight: 16, from: 75, to: 132.5, label: "2 pescados", icon: "fish", tag: "×2" },
  { id: "coins25", weight: 12, from: 134, to: 191, label: "25 monedas", icon: "coin", tag: "25" },
  { id: "energizante", weight: 11, from: 193, to: 234, label: "1 lata energizante", icon: "energy", tag: "" },
  { id: "xp30", weight: 11, from: 235.5, to: 273, label: "30 de experiencia", icon: "star", tag: "+30" },
  { id: "lata", weight: 9, from: 275, to: 309, label: "1 lata (chatarra)", icon: "can", tag: "" },
  { id: "coins100", weight: 8, from: 311, to: 342, label: "100 monedas", icon: "coin", tag: "100" },
  { id: "corona", weight: 3, from: 343.5, to: 356, label: "la Corona", icon: "crown", tag: "", small: true },
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
      <img class="rw-layer" src="${ROULETTE_ART.disc}" alt="" draggable="false" />
      ${icons}
    </div>
    <img class="rw-layer rw-pointer" src="${ROULETTE_ART.wheel}" alt="" draggable="false" />
    <img class="rw-layer rw-hub" src="${ROULETTE_ART.wheel}" alt="" draggable="false" />`;
  wheel.dataset.ready = "1";
}

function rouletteBlockReason() {
  return typeof gameBlockReason === "function" ? gameBlockReason("ruleta") : "";
}

function updateRouletteUI() {
  const btn = document.getElementById("roulette-spin");
  const status = document.getElementById("roulette-status");
  if (!btn || !state) return;
  const why = rouletteBlockReason();
  btn.disabled = rouletteSpinning || !!why;
  if (status && !rouletteSpinning) status.textContent = why || "Una tirada gratis por día. ¡Suerte!";
}

function openRoulette() {
  if (!state) return;
  buildRoulette();
  closeAllMenus?.();
  const overlay = document.getElementById("roulette-overlay");
  document.getElementById("roulette-result").hidden = true;
  overlay.hidden = false;
  updateRouletteUI();
  (document.getElementById("roulette-spin").disabled ? document.getElementById("roulette-close") : document.getElementById("roulette-spin")).focus();
}

function closeRoulette() {
  if (rouletteSpinning) return;          // que termine de girar
  const overlay = document.getElementById("roulette-overlay");
  if (!overlay || overlay.hidden) return;
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

function spinRoulette() {
  if (rouletteSpinning || !state) return;
  const why = rouletteBlockReason();
  if (why) { updateRouletteUI(); return; }
  const prize = pickRoulettePrize();
  // La tirada del día se gasta y el premio se guarda al girar (así no se
  // puede repetir recargando la página a mitad de la animación).
  ensureDailyProgress();
  if (!gamesUnlimited()) state.daily.rouletteSpun = true;
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
  document.getElementById("roulette-spin")?.addEventListener("click", spinRoulette);
  document.getElementById("roulette-close")?.addEventListener("click", closeRoulette);
  const overlay = document.getElementById("roulette-overlay");
  overlay?.addEventListener("click", (ev) => { if (ev.target === overlay) closeRoulette(); });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && overlay && !overlay.hidden) { ev.preventDefault(); closeRoulette(); }
  });
}
