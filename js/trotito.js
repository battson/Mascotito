/* ==========================================================================
   Beta v4.6.12 — Trotito: carreras de conejos con apuestas
   Los «trotitos» son los corredores (hacen de caballo). Se elige uno de los
   4, se apuesta 10, 25, 50 o 100 monedas y, si sale 1º, se cobra la apuesta
   por su cuota (×2, ×3, ×4 o ×6). Hasta 5 carreras por día. El botón
   «¡Alentar!» es sólo festejo: no cambia el resultado.

   Justicia de la apuesta: el resultado se sortea y se paga en el mismo
   momento en que se larga (como la ruleta), así salir a mitad de carrera
   o recargar la página no cambia nada. La carrera que se ve sólo muestra
   ese resultado, con adelantos y remontadas para que tenga suspenso.

   Arte (ver scripts/export-trotito-v4612.py):
   - assets/games/trotito/run.svg — los 6 cuadros de la carrera (sprite
     vectorizado) como <symbol> trot-f1…trot-f6, más trot-sad (el cuadro 4
     con cara triste, para el 3º del podio). La manta usa var(--manta).
   - escenario.svg (pista) y podio.svg (el podio sin estadio ni confeti).
   - icon.svg (Trotito_icon.ai) para el recuadro de Minijuegos.
   ========================================================================== */

const TROTITO_ART = {
  track: liteArt("assets/games/trotito/escenario.svg"),
  podium: liteArt("assets/games/trotito/podio.svg"),
  icon: "assets/games/trotito/icon.svg",
  sprites: "assets/games/trotito/run.svg",
};

// Corredores: color de manta, nombre, cuota y probabilidad real de ganar
// (suman 1). Todo acá para ajustarlo con la economía de v4.7.
const TROTITO_RUNNERS = [
  { n: 1, name: "Pompón", color: "#2f8fe0", odds: 2, chance: .42 },
  { n: 2, name: "Rayo", color: "#e2463c", odds: 3, chance: .28 },
  { n: 3, name: "Trébol", color: "#3cae4a", odds: 4, chance: .20 },
  { n: 4, name: "Canela", color: "#f2b92c", odds: 6, chance: .10 },
];
const TROTITO_BETS = [10, 25, 50, 100];
const TROTITO_LIMITS = { carrerasPorDia: 5 };
const TROTITO_REWARDS = { xp: 2, felicidadGana: 3, felicidadPierde: 1 };

// Geometría de la pista, en unidades del escenario (1672 × 941).
const TROTITO_TRACK = {
  w: 1672,
  h: 941,
  startX: 205,     // línea de salida (donde queda la nariz al largar)
  finishX: 1478,   // meta a cuadros
  // Por carril: dónde pisan y qué tamaño tienen (un poco más grandes
  // adelante, como la pista).
  lanes: [
    { feet: 612, scale: .21 },
    { feet: 700, scale: .23 },
    { feet: 800, scale: .25 },
    { feet: 878, scale: .27 },
  ],
};
// Cuadro del sprite: 472 × 385; la nariz queda en x 468 en todos los
// cuadros (se alinearon por la nariz). Centro de la manta por cuadro, para
// el número.
const TROTITO_SPRITE = { w: 472, h: 385, nose: 468, feet: 380 };
const TROTITO_MANTA = [[198.5, 237.5], [201.5, 228.5], [195.5, 225.5], [195.5, 225.5], [212.5, 222.5], [197, 227.5]];

let trotitoSpritesReady = null;
/** Mete los <symbol> de los cuadros una sola vez en la página. */
function trotitoLoadSprites() {
  if (!trotitoSpritesReady) {
    trotitoSpritesReady = fetch(TROTITO_ART.sprites)
      .then((r) => (r.ok ? r.text() : ""))
      .then((text) => {
        if (!text || document.getElementById("trot-f1")) return;
        const holder = document.createElement("div");
        holder.id = "trotito-sprites";
        holder.setAttribute("aria-hidden", "true");
        holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
        holder.innerHTML = text;
        document.body.appendChild(holder);
      })
      .catch(() => { trotitoSpritesReady = null; });
  }
  return trotitoSpritesReady;
}

// ------------------------------------------------------------ Reglas

function trotitoRacesLeft() {
  ensureDailyProgress();
  return Math.max(0, TROTITO_LIMITS.carrerasPorDia - (state.daily.trotitoRaces || 0));
}

function trotitoCoins() {
  return Math.max(0, state?.economy?.coins || 0);
}

function trotitoBlockReason() {
  if (gamesUnlimited()) return "";
  if (!trotitoRacesLeft()) return `Ya corriste las ${TROTITO_LIMITS.carrerasPorDia} carreras de hoy. Volvé mañana.`;
  if (trotitoCoins() < TROTITO_BETS[0]) return `Necesitás al menos ${TROTITO_BETS[0]} monedas para apostar.`;
  return "";
}

function trotitoStatusText() {
  if (gamesUnlimited()) return "Sin límite (modo prueba)";
  const left = trotitoRacesLeft();
  return left ? `Te quedan ${left} de ${TROTITO_LIMITS.carrerasPorDia} carreras hoy` : "Sin carreras hasta mañana";
}

/** Orden de llegada: se sortea el 1º según la probabilidad de cada uno y
 *  después, con el mismo criterio, el 2º entre los que quedan, etc. */
function trotitoDrawOrder(runners = TROTITO_RUNNERS, rnd = Math.random) {
  const pool = runners.slice();
  const order = [];
  while (pool.length) {
    const total = pool.reduce((s, r) => s + r.chance, 0);
    let roll = rnd() * total;
    let idx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      roll -= pool[i].chance;
      if (roll < 0) { idx = i; break; }
    }
    order.push(pool.splice(idx, 1)[0].n);
  }
  return order;
}

/** Lo que cobra una apuesta: la apuesta × cuota si ganó, si no nada. */
function trotitoPayout(pick, bet, winner) {
  const r = TROTITO_RUNNERS.find((x) => x.n === pick);
  return r && pick === winner ? bet * r.odds : 0;
}

/** Recorrido de cada corredor (0 → 1) en función del tiempo, de modo que
 *  lleguen en el orden sorteado pero con adelantos y remontadas. */
function trotitoPlan(order, rnd = Math.random) {
  const base = 7.6 + rnd() * .8;          // segundos del ganador
  const plan = {};
  let t = base;
  order.forEach((n, place) => {
    if (place) t += .18 + rnd() * .38;
    const waves = [0, 1].map(() => ({ a: .025 + rnd() * .03, f: 1 + rnd() * 1.6, p: rnd() * Math.PI * 2 }));
    plan[n] = { T: t, waves };
  });
  return plan;
}

function trotitoProgress(p, tSec) {
  if (tSec <= 0) return 0;
  if (tSec >= p.T) return 1;
  const u = tSec / p.T;
  // Arranque suave (acelera en el primer 12 %) y ondas que se anulan en la
  // salida y en la llegada.
  const ease = u < .12 ? (u * u) / (2 * .12) / (1 - .06) : (u - .06) / (1 - .06);
  let wob = 0;
  p.waves.forEach((w) => { wob += w.a * Math.sin(Math.PI * u) * Math.sin(w.f * Math.PI * 2 * u + w.p); });
  return Math.min(1, Math.max(0, ease + wob));
}

// ------------------------------------------------------------ Escena

function trotitoRunnerSvg(r, lane) {
  const L = TROTITO_TRACK.lanes[lane];
  return `<g class="trot-runner" data-n="${r.n}" style="--manta:${r.color}">
      <g class="trot-runner-pos">
        <g class="trot-runner-body" transform="scale(${L.scale})">
          <ellipse class="trot-shadow" cx="250" cy="382" rx="170" ry="16"/>
          <use class="trot-frame" href="#trot-f1" width="472" height="385"/>
          <text class="trot-num" x="${TROTITO_MANTA[0][0]}" y="${TROTITO_MANTA[0][1] + 15}">${r.n}</text>
          <g class="trot-you" transform="translate(300 -30) scale(1.7)">
            <path d="M-40 -58 h80 a16 16 0 0 1 16 16 v28 a16 16 0 0 1 -16 16 h-26 l-14 18 l-14 -18 h-26 a16 16 0 0 1 -16 -16 v-28 a16 16 0 0 1 16 -16z"/>
            <text y="-18">VOS</text>
          </g>
          <g class="trot-cheer-fx"></g>
        </g>
      </g>
    </g>`;
}

function trotitoSceneHtml() {
  const S = TROTITO_TRACK;
  const runners = TROTITO_RUNNERS.map((r, i) => trotitoRunnerSvg(r, i)).join("");
  return `<div class="trot-scene">
    <img class="trot-track" src="${TROTITO_ART.track}" alt="" draggable="false" />
    <svg class="trot-runners" viewBox="0 0 ${S.w} ${S.h}" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${runners}</svg>
    <div class="trot-countdown" aria-hidden="true"></div>
    <section class="trot-bet" aria-labelledby="trot-bet-title">
      <h3 id="trot-bet-title">¿A qué trotito le apostás?</h3>
      <div class="trot-picks" role="radiogroup" aria-label="Corredor">
        ${TROTITO_RUNNERS.map((r) => `
        <button type="button" class="trot-pick" role="radio" aria-checked="false" data-pick="${r.n}" style="--manta:${r.color}"
          aria-label="Número ${r.n}, ${r.name}. Paga por ${r.odds}.">
          <svg viewBox="0 0 472 385" aria-hidden="true"><use href="#trot-f4"/><text class="trot-num" x="${TROTITO_MANTA[3][0]}" y="${TROTITO_MANTA[3][1] + 15}">${r.n}</text></svg>
          <span class="trot-pick-name">${r.name}</span>
          <span class="trot-pick-odds">×${r.odds}</span>
        </button>`).join("")}
      </div>
      <div class="trot-amounts" role="radiogroup" aria-label="Apuesta">
        ${TROTITO_BETS.map((b) => `<button type="button" class="trot-amount" role="radio" aria-checked="false" data-bet="${b}"><img src="${GAME_ICON.coin}" alt="" />${b}</button>`).join("")}
      </div>
      <p class="trot-bet-summary" aria-live="polite"></p>
      <button type="button" class="games-btn trot-go" disabled>¡Largar!</button>
    </section>
    <div class="games-controls trot-controls" hidden>
      <button type="button" class="games-btn trot-cheer">¡Alentar!</button>
    </div>
    <div class="trot-podium" hidden>
      <div class="trot-confetti" aria-hidden="true"></div>
      <div class="trot-podium-card" role="status"></div>
      <div class="trot-podium-stage" aria-hidden="true">
        <img class="trot-podium-art" src="${TROTITO_ART.podium}" alt="" draggable="false" />
      </div>
    </div>
  </div>`;
}

// ------------------------------------------------------------ Partida

function startTrotito() {
  const m = minigame;
  m.score = 0;
  m.trot = { phase: "bet", pick: 0, bet: 0, frame: 0 };
  trotitoLoadSprites();
  const arena = $g("minigame-arena");
  arena.dataset.phase = "bet";
  arena.querySelectorAll(".trot-pick").forEach((btn) => btn.addEventListener("click", () => trotitoChoose("pick", Number(btn.dataset.pick))));
  arena.querySelectorAll(".trot-amount").forEach((btn) => btn.addEventListener("click", () => trotitoChoose("bet", Number(btn.dataset.bet))));
  arena.querySelector(".trot-go").addEventListener("click", trotitoGo);
  arena.querySelector(".trot-cheer").addEventListener("click", trotitoCheer);
  trotitoPlaceRunners(0);
  trotitoUpdateBet();
  updateGameChips();
  gamesHint("Elegí un trotito y cuánto apostás.");
}

function trotitoChoose(kind, value) {
  const t = minigame?.trot;
  if (!t || t.phase !== "bet") return;
  if (kind === "bet" && value > trotitoCoins() && !gamesUnlimited()) return;
  t[kind] = value;
  trotitoUpdateBet();
}

function trotitoUpdateBet() {
  const t = minigame?.trot;
  const arena = $g("minigame-arena");
  if (!t || !arena) return;
  const coins = trotitoCoins();
  arena.querySelectorAll(".trot-pick").forEach((btn) => {
    const on = Number(btn.dataset.pick) === t.pick;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-checked", String(on));
  });
  arena.querySelectorAll(".trot-amount").forEach((btn) => {
    const b = Number(btn.dataset.bet);
    const on = b === t.bet;
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-checked", String(on));
    btn.disabled = b > coins && !gamesUnlimited();
  });
  if (t.bet > coins && !gamesUnlimited()) t.bet = 0;
  const runner = TROTITO_RUNNERS.find((r) => r.n === t.pick);
  const summary = arena.querySelector(".trot-bet-summary");
  const why = trotitoBlockReason();
  if (why) summary.textContent = why;
  else if (runner && t.bet) summary.innerHTML = `Si gana <b>${runner.name}</b> cobrás <img src="${GAME_ICON.coin}" alt="" /><b>${t.bet * runner.odds}</b>`;
  else summary.textContent = `Tenés ${coins} monedas. Cobrás sólo si tu trotito sale 1º.`;
  arena.querySelector(".trot-go").disabled = !runner || !t.bet || !!why;
  // Marca «VOS» sobre el elegido, ya en la línea de salida.
  arena.querySelectorAll(".trot-runner").forEach((g) => g.classList.toggle("is-mine", Number(g.dataset.n) === t.pick));
}

function trotitoGo() {
  const m = minigame;
  const t = m?.trot;
  if (!t || t.phase !== "bet" || !t.pick || !t.bet) return;
  if (trotitoBlockReason()) { trotitoUpdateBet(); return; }
  if (t.bet > trotitoCoins() && !gamesUnlimited()) return;
  // Se cobra la apuesta, se sortea y se paga antes de largar.
  ensureDailyProgress();
  state.economy = state.economy || { coins: 0 };
  t.order = trotitoDrawOrder();
  t.winner = t.order[0];
  t.payout = trotitoPayout(t.pick, t.bet, t.winner);
  state.economy.coins = Math.max(0, trotitoCoins() - t.bet + t.payout);
  if (!gamesUnlimited()) state.daily.trotitoRaces = (state.daily.trotitoRaces || 0) + 1;
  const won = t.payout > 0;
  addBond(TROTITO_REWARDS.xp);
  gainFelicidad(won ? TROTITO_REWARDS.felicidadGana : TROTITO_REWARDS.felicidadPierde);
  trySave(state);
  registerInteraction();
  updateCoinCount?.();

  t.phase = "countdown";
  t.plan = trotitoPlan(t.order);
  const arena = $g("minigame-arena");
  arena.dataset.phase = "race";
  arena.querySelector(".trot-bet").hidden = true;
  const controls = arena.querySelector(".trot-controls");
  controls.hidden = false;
  const runner = TROTITO_RUNNERS.find((r) => r.n === t.pick);
  const cheer = arena.querySelector(".trot-cheer");
  cheer.textContent = `¡Vamos, ${runner.name}!`;
  cheer.style.setProperty("--manta", runner.color);
  cheer.disabled = true;
  updateGameChips();
  gamesHint("¡En sus marcas!");
  const cd = arena.querySelector(".trot-countdown");
  const steps = ["3", "2", "1", "¡YA!"];
  steps.forEach((txt, i) => gamesTimer(() => {
    if (minigame !== m) return;
    cd.textContent = txt;
    cd.classList.remove("is-on"); void cd.offsetWidth; cd.classList.add("is-on");
    if (i === steps.length - 1) trotitoStartRace();
  }, 250 + i * 750));
}

function trotitoStartRace() {
  const m = minigame;
  const t = m.trot;
  t.phase = "race";
  t.t0 = performance.now();
  t.last = t.t0;
  t.finished = [];
  t.anim = {};
  TROTITO_RUNNERS.forEach((r) => { t.anim[r.n] = { frame: Math.floor(Math.random() * 6), acc: 0, prev: 0 }; });
  const cheer = $g("minigame-arena").querySelector(".trot-cheer");
  cheer.disabled = false;
  cheer.focus();
  gamesHint("¡Largaron!");
  gamesFrame(trotitoFrame);
}

function trotitoFrame(now) {
  const m = minigame;
  const t = m?.trot;
  if (!t || m.type.id !== "trotito") return false;
  const dt = Math.min(.1, (now - t.last) / 1000);
  t.last = now;
  const tSec = (now - t.t0) / 1000;
  const reduce = fsReduceMotion();
  TROTITO_RUNNERS.forEach((r) => {
    const a = t.anim[r.n];
    // Nunca para atrás (las ondas de adelanto/remontada podrían frenarlo).
    const p = Math.max(a.prev, trotitoProgress(t.plan[r.n], tSec));
    const speed = Math.max(0, (p - a.prev) / Math.max(dt, 1e-3)); // recorrido por segundo
    a.prev = p;
    if (p < 1) {
      // ~13 cuadros por segundo a velocidad normal (≈ 1/8 del recorrido por s).
      a.acc += dt * (6 + speed * 60);
      while (a.acc >= 1) { a.acc -= 1; a.frame = (a.frame + 1) % 6; }
    } else if (!t.finished.includes(r.n)) {
      t.finished.push(r.n);
      a.frame = 3;
      if (t.finished.length === 1) trotitoWinnerCrossed(r.n);
    }
    trotitoPlaceRunner(r.n, p, reduce || p >= 1 ? 0 : Math.abs(Math.sin(a.frame / 6 * Math.PI)) * 14, a.frame);
  });
  if (t.finished.length === TROTITO_RUNNERS.length && !t.ending) {
    t.ending = true;
    gamesTimer(() => { if (minigame === m) trotitoShowPodium(); }, 1300);
  }
  return !t.ending || tSec < 30;
}

function trotitoPlaceRunners(p) {
  TROTITO_RUNNERS.forEach((r) => trotitoPlaceRunner(r.n, p, 0, 3));
}

function trotitoPlaceRunner(n, p, bob, frame) {
  const arena = $g("minigame-arena");
  const g = arena?.querySelector(`.trot-runner[data-n="${n}"]`);
  if (!g) return;
  const S = TROTITO_TRACK;
  const L = S.lanes[n - 1];
  const noseX = S.startX + (S.finishX - S.startX) * p;
  const x = noseX - TROTITO_SPRITE.nose * L.scale;
  const y = L.feet - TROTITO_SPRITE.feet * L.scale - bob * L.scale;
  const pos = g.firstElementChild;
  const tr = `translate(${x.toFixed(1)} ${y.toFixed(1)})`;
  if (pos._tr !== tr) { pos._tr = tr; pos.setAttribute("transform", tr); }
  if (g._frame !== frame) {
    g._frame = frame;
    g.querySelector(".trot-frame").setAttribute("href", `#trot-f${frame + 1}`);
    const [cx, cy] = TROTITO_MANTA[frame];
    const num = g.querySelector(".trot-num");
    num.setAttribute("x", cx);
    num.setAttribute("y", cy + 15);
  }
}

function trotitoWinnerCrossed(n) {
  const r = TROTITO_RUNNERS.find((x) => x.n === n);
  const t = minigame.trot;
  showPenaltyBanner(`¡Ganó ${r.name}!`, n === t.pick ? "gol" : "lata");
  gamesHint(`¡Ganó ${r.name}!`);
  const cheer = $g("minigame-arena").querySelector(".trot-cheer");
  if (cheer) cheer.disabled = true;
}

/** ¡Alentar!: sólo festejo — el trotito elegido da un saltito y salen
 *  corazones y un «¡Vamos!». No cambia la carrera. */
function trotitoCheer() {
  const t = minigame?.trot;
  if (!t || t.phase !== "race") return;
  const now = performance.now();
  if (now - (t.lastCheer || 0) < 350) return;
  t.lastCheer = now;
  const arena = $g("minigame-arena");
  const g = arena.querySelector(`.trot-runner[data-n="${t.pick}"]`);
  if (!g) return;
  const body = g.querySelector(".trot-runner-body");
  body.classList.remove("is-cheered"); void body.getBoundingClientRect(); body.classList.add("is-cheered");
  const fx = g.querySelector(".trot-cheer-fx");
  const words = ["¡Vamos!", "¡Dale!", "¡Corré!", "¡Vos podés!"];
  const bits = [
    `<text class="trot-cheer-word" x="${170 + Math.random() * 120}" y="-150">${words[Math.floor(Math.random() * words.length)]}</text>`,
    ...[0, 1, 2].map((i) => `<path class="trot-cheer-heart" style="animation-delay:${i * 90}ms" transform="translate(${100 + i * 110 + Math.random() * 30} ${-40 - Math.random() * 40}) scale(4.2)" d="M0 7 C-9 1 -8 -6 -3.5 -6 C-1.5 -6 -.5 -4.5 0 -3.5 C.5 -4.5 1.5 -6 3.5 -6 C8 -6 9 1 0 7z"/>`),
  ].join("");
  const holder = document.createElementNS("http://www.w3.org/2000/svg", "g");
  holder.innerHTML = bits;
  fx.appendChild(holder);
  setTimeout(() => holder.remove(), 1200);
  const btn = arena.querySelector(".trot-cheer");
  btn.classList.remove("is-pop"); void btn.offsetWidth; btn.classList.add("is-pop");
}

// ------------------------------------------------------------ Podio

function trotitoConfetti(box) {
  if (!box || fsReduceMotion()) return;
  const colors = ["#f25c7a", "#ffd34d", "#4fb4ec", "#6cc56b", "#b98cf0", "#ff9f43"];
  box.innerHTML = Array.from({ length: 46 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = -Math.random() * 4;
    const dur = 3.2 + Math.random() * 2.6;
    const w = 7 + Math.random() * 7;
    const drift = (Math.random() * 2 - 1) * 60;
    const spin = (Math.random() < .5 ? -1 : 1) * (360 + Math.random() * 540);
    return `<i style="left:${left.toFixed(1)}%;width:${w.toFixed(1)}px;height:${(w * (.45 + Math.random() * .5)).toFixed(1)}px;background:${colors[i % colors.length]};animation-duration:${dur.toFixed(2)}s;animation-delay:${delay.toFixed(2)}s;--drift:${drift.toFixed(0)}px;--spin:${spin.toFixed(0)}deg"></i>`;
  }).join("");
}

function trotitoPodiumRunner(n, place) {
  const r = TROTITO_RUNNERS.find((x) => x.n === n);
  const sad = place === 3;
  const [cx, cy] = TROTITO_MANTA[3];
  return `<div class="trot-podium-runner" data-place="${place}" style="--manta:${r.color}">
    <svg viewBox="0 0 472 385" aria-hidden="true"><use href="#${sad ? "trot-sad" : "trot-f4"}"/><text class="trot-num" x="${cx}" y="${cy + 15}">${r.n}</text></svg>
    <span class="trot-podium-name">${r.name}</span>
  </div>`;
}

function trotitoShowPodium() {
  const m = minigame;
  const t = m.trot;
  t.phase = "podium";
  updateGameChips();
  const arena = $g("minigame-arena");
  arena.dataset.phase = "podium";
  hidePenaltyBanner();
  arena.querySelector(".trot-controls").hidden = true;
  const podium = arena.querySelector(".trot-podium");
  const stage = podium.querySelector(".trot-podium-stage");
  stage.querySelectorAll(".trot-podium-runner").forEach((n) => n.remove());
  stage.insertAdjacentHTML("beforeend", [1, 2, 3].map((place) => trotitoPodiumRunner(t.order[place - 1], place)).join(""));
  const winner = TROTITO_RUNNERS.find((r) => r.n === t.winner);
  const mine = TROTITO_RUNNERS.find((r) => r.n === t.pick);
  const place = t.order.indexOf(t.pick) + 1;
  const won = t.payout > 0;
  const left = gamesUnlimited() ? "Modo prueba: sin límite de carreras." : trotitoStatusText() + ".";
  const again = trotitoBlockReason();
  podium.querySelector(".trot-podium-card").innerHTML = `
    <h3>${won ? `¡Ganó ${mine.name}!` : `Ganó ${winner.name}`}</h3>
    <p class="trot-podium-line">${won
      ? `Apostaste ${t.bet} y cobrás <b>${t.payout}</b> (×${mine.odds}).`
      : `${mine.name} llegó ${place}º. Esta vez no se cobra.`}</p>
    <ul class="games-rewards">
      <li><img src="${GAME_ICON.coin}" alt="" /><span>${won ? "Premio" : "Apuesta"}</span><b class="${won ? "" : "is-cost"}">${won ? "+" + (t.payout - t.bet) : "−" + t.bet}</b></li>
      <li>${SVG_STAR}<span>Experiencia</span><b>+${TROTITO_REWARDS.xp}</b></li>
    </ul>
    <p class="games-result-note">${again || left}</p>
    <div class="games-result-actions">
      <button type="button" class="games-btn" data-again ${again ? "disabled" : ""}>Otra carrera</button>
      <button type="button" class="games-btn games-btn-soft" data-exit>Volver a casa</button>
    </div>`;
  trotitoConfetti(podium.querySelector(".trot-confetti"));
  podium.hidden = false;
  gamesHint("");
  const againBtn = podium.querySelector("[data-again]");
  againBtn.addEventListener("click", () => { trotitoEnd(); launchGame("trotito"); });
  podium.querySelector("[data-exit]").addEventListener("click", () => returnHome());
  (again ? podium.querySelector("[data-exit]") : againBtn).focus();
  refreshUI?.();
  updateCooldownButtons?.();
  if (won) popHearts?.();
}

/** Termina la partida sin la pantalla de resultado general (el podio ya
 *  la reemplaza); la apuesta ya se resolvió al largar. */
function trotitoEnd() {
  if (!minigame || minigame.type.id !== "trotito") return;
  const t = minigame.trot;
  emitRealtimeAction("play_end", { game: "trotito", result: t?.payout > 0 ? "win" : "finish" });
  gamesClearAll();
  minigame = null;
}
