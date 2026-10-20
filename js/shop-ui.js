/* Pantalla de tienda (Beta v4.6.23: puesto de feria con subcategorías y canasto) y controles de catálogo. */
let shopCart = [];
let shopConfirm = false;
const shopSubMemory = {};

function openShop() {
  if (!state) return;
  shopGroup = "Casa";
  shopSubcategory = null;
  shopCart = [];
  shopConfirm = false;
  el.shopStatus.textContent = "";
  renderShop();
  el.shopOverlay.hidden = false;
  document.getElementById("shop-close")?.focus();
}

function closeShop() { el.shopOverlay.hidden = true; }

function shopTag(price) {
  const tag = document.createElement("span");
  tag.className = "shop-tag";
  if (price == null) { tag.textContent = "Sin precio"; return tag; }
  const coin = document.createElement("img");
  coin.src = "assets/shop/moneda.svg";
  coin.alt = "";
  tag.append(coin, document.createTextNode(String(price)));
  return tag;
}

function shopCardArt(item) {
  const art = document.createElement("span");
  art.className = "shop-art";
  if (item.asset) {
    const img = document.createElement("img");
    img.src = item.asset;
    img.alt = "";
    // Paredes y pisos son texturas: se muestran enmarcadas como muestras.
    if (item.subcategory === "Paredes" || item.subcategory === "Pisos") img.className = "is-tile";
    art.appendChild(img);
  } else {
    const swatch = document.createElement("span");
    swatch.className = "shop-swatch";
    swatch.style.background = item.swatch;
    art.appendChild(swatch);
  }
  return art;
}

function shopAdminControls(item, setting) {
  const controls = document.createElement("div");
  controls.className = "shop-admin-controls";
  const priceInput = document.createElement("input");
  priceInput.type = "number";
  priceInput.min = "0";
  priceInput.max = "1000000";
  priceInput.step = "1";
  priceInput.placeholder = "Precio";
  priceInput.value = setting.price ?? "";
  priceInput.setAttribute("aria-label", `Precio de ${item.label}`);
  const enabledLabel = document.createElement("label");
  enabledLabel.className = "shop-enable-label";
  enabledLabel.textContent = "Mostrar";
  const enabled = document.createElement("input");
  enabled.type = "checkbox";
  enabled.checked = setting.enabled;
  enabled.setAttribute("aria-label", `Mostrar ${item.label} en la tienda`);
  enabledLabel.prepend(enabled);
  const save = document.createElement("button");
  save.type = "button";
  save.className = "secondary-btn";
  save.textContent = "Guardar";
  save.dataset.adminSave = item.id;
  save.disabled = shopBusy;
  controls.append(priceInput, enabledLabel, save);
  return controls;
}

function renderShopCard(item) {
  const setting = shopSetting(shopCatalog, item);
  const owned = shopOwns(state, item);
  const inCart = shopCart.includes(item.id);
  const card = document.createElement("article");
  card.className = "shop-card" + (inCart ? " is-selected" : "") + (owned ? " is-owned" : "");
  const pick = document.createElement("button");
  pick.type = "button";
  pick.className = "shop-pick";
  pick.dataset.pick = item.id;
  pick.setAttribute("aria-pressed", String(inCart));
  const status = owned ? "ya lo tenés" : setting.price == null ? "sin precio" : `${setting.price} monedas`;
  pick.setAttribute("aria-label", `${item.label}, ${status}${inCart ? ", en el canasto" : ""}`);
  pick.disabled = shopBusy || owned || !setting.enabled || setting.price == null;
  const name = document.createElement("span");
  name.className = "shop-name";
  name.textContent = item.label;
  pick.append(shopCardArt(item), name, owned ? Object.assign(document.createElement("span"), { className: "shop-tag is-owned", textContent: "Ya lo tenés" }) : shopTag(setting.price));
  card.appendChild(pick);
  if (owned) {
    const badge = document.createElement("span");
    badge.className = "shop-own";
    badge.textContent = "Tuyo";
    card.appendChild(badge);
  }
  if (isAdmin()) card.appendChild(shopAdminControls(item, setting));
  return card;
}

function renderShopCart() {
  const total = shopCartTotal(shopCatalog, shopCart);
  const short = total > state.economy.coins;
  document.getElementById("shop-cart-count").textContent = `${shopCart.length} ${shopCart.length === 1 ? "artículo" : "artículos"}`;
  const lines = document.getElementById("shop-cart-lines");
  lines.replaceChildren();
  if (!shopCart.length) {
    const none = document.createElement("li");
    none.className = "is-empty";
    none.textContent = "Elegí un artículo y aparece acá.";
    lines.appendChild(none);
  }
  shopCart.forEach((id) => {
    const item = SHOP_BY_ID[id];
    const li = document.createElement("li");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "shop-remove";
    remove.dataset.remove = id;
    remove.setAttribute("aria-label", `Sacar ${item.label} del canasto`);
    remove.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
    const label = document.createElement("span");
    label.className = "shop-line-name";
    label.textContent = item.label;
    li.append(remove, label, shopTag(shopSetting(shopCatalog, item).price));
    lines.appendChild(li);
  });
  document.getElementById("shop-cart-clear").hidden = shopCart.length < 2;
  const totalEl = document.getElementById("shop-cart-total");
  totalEl.replaceChildren(...shopTag(total).childNodes);
  const miss = document.getElementById("shop-cart-miss");
  miss.hidden = !short;
  miss.textContent = short ? `Te faltan ${total - state.economy.coins} monedas. Sacá algo del canasto.` : "";
  const pay = document.getElementById("shop-cart-pay");
  pay.replaceChildren();
  if (shopConfirm && shopCart.length && !short) {
    const box = document.createElement("div");
    box.className = "shop-confirm";
    const ask = document.createElement("p");
    ask.append("¿Pagar ", shopTag(total), `? Te van a quedar ${state.economy.coins - total} monedas.`);
    const row = document.createElement("div");
    row.className = "shop-confirm-row";
    const yes = document.createElement("button");
    yes.type = "button";
    yes.className = "shop-btn is-go";
    yes.dataset.payYes = "";
    yes.textContent = "Sí";
    const no = document.createElement("button");
    no.type = "button";
    no.className = "shop-btn is-ghost";
    no.dataset.payNo = "";
    no.textContent = "No";
    row.append(yes, no);
    box.append(ask, row);
    pay.appendChild(box);
    yes.focus();
  } else {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shop-btn is-go";
    btn.dataset.pay = "";
    btn.textContent = "Pagar";
    btn.disabled = shopBusy || !shopCart.length || short;
    pay.appendChild(btn);
  }
}

function renderShop() {
  if (!state) return;
  const admin = isAdmin();
  shopCart = shopPruneCart(shopCatalog, state, shopCart);
  if (!shopCart.length) shopConfirm = false;
  el.shopCoins.textContent = state.economy.coins;
  el.shopTabs.querySelectorAll("[data-group]").forEach((btn) => {
    const active = btn.dataset.group === shopGroup;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-selected", String(active));
  });
  const subcategories = shopSubcategories(shopCatalog, shopGroup, admin);
  if (!subcategories.includes(shopSubcategory)) shopSubcategory = subcategories.includes(shopSubMemory[shopGroup]) ? shopSubMemory[shopGroup] : subcategories[0];
  shopSubMemory[shopGroup] = shopSubcategory;
  // Con una sola subcategoría (Colores) la fila sobra.
  el.shopSubtabs.hidden = subcategories.length < 2;
  el.shopSubtabs.replaceChildren();
  subcategories.forEach((name) => {
    const count = SHOP_ITEMS.filter((item) => item.group === shopGroup && item.subcategory === name && shopVisible(shopCatalog, item, admin)).length;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "shop-sub" + (name === shopSubcategory ? " is-active" : "");
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", String(name === shopSubcategory));
    btn.dataset.subcategory = name;
    btn.append(name, Object.assign(document.createElement("i"), { textContent: String(count) }));
    el.shopSubtabs.appendChild(btn);
  });
  el.shopGrid.replaceChildren();
  const items = SHOP_ITEMS.filter((item) => item.group === shopGroup
    && item.subcategory === shopSubcategory
    && shopVisible(shopCatalog, item, admin));
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "shop-empty";
    empty.textContent = "Todavía no hay artículos disponibles en esta categoría.";
    el.shopGrid.appendChild(empty);
  }
  items.forEach((item) => el.shopGrid.appendChild(renderShopCard(item)));
  renderShopCart();
}

const SHOP_ERRORS = { owned: "Ya tenés ese artículo.", coins: "No alcanzan las monedas.", unavailable: "El artículo ya no está disponible." };

/* Compra el canasto de a un artículo (cada compra es una transacción en la nube). Si una falla, quedan en el canasto los que no se compraron. */
async function payShopCart() {
  const items = shopCart.map((id) => SHOP_BY_ID[id]).filter(Boolean);
  if (!items.length) return;
  shopBusy = true;
  shopConfirm = false;
  renderShop();
  const online = !!(window.Cloud?.enabled && currentUsername);
  const bought = [];
  let error = null;
  if (online) {
    cloudSavePaused = true;
    if (!(await flushCloudSaveNow())) error = "network";
  }
  for (const item of items) {
    if (error) break;
    if (online) {
      const result = await window.Cloud.purchaseShopItem(currentUsername, item.id);
      if (!result.ok) { error = result.error || "network"; break; }
      state = normalizeState(result.petState);
      saveState(state);
    } else {
      const price = shopSetting(shopCatalog, item).price;
      if (shopOwns(state, item) || price == null || state.economy.coins < price) { error = "coins"; break; }
      state.economy.coins -= price;
      shopGrant(state, item);
    }
    bought.push(item);
  }
  if (online) {
    cloudSavePaused = false;
    if (cloudSavePending) scheduleCloudSave(state);
  } else if (bought.length) {
    trySave(state);
  }
  shopCart = shopCart.filter((id) => !bought.some((item) => item.id === id));
  shopBusy = false;
  const done = bought.length === 1 ? `Compraste ${bought[0].label}.` : `Compraste ${bought.length} artículos.`;
  if (!error) el.shopStatus.textContent = done;
  else el.shopStatus.textContent = `${bought.length ? done + " " : ""}${SHOP_ERRORS[error] || "No se pudo completar la compra. Reintentá."}`;
  if (bought.length) refreshUI();
  renderShop();
}

async function saveShopAdmin(save) {
  const item = SHOP_BY_ID[save.dataset.adminSave];
  if (!item || !isAdmin()) return;
  const card = save.closest(".shop-card");
  const input = card.querySelector('input[type="number"]');
  const price = Number(input.value);
  const enabled = card.querySelector('input[type="checkbox"]').checked;
  if (!Number.isSafeInteger(price) || price < 0 || price > 1000000 || input.value === "") {
    el.shopStatus.textContent = "Ingresá un precio entero entre 0 y 1.000.000.";
    return;
  }
  shopBusy = true;
  const result = window.Cloud?.enabled ? await window.Cloud.saveShopItem(item.id, { price, enabled }) : { ok: true };
  if (result.ok) shopCatalog[item.id] = { price, enabled };
  shopBusy = false;
  el.shopStatus.textContent = result.ok ? "Cambios guardados." : "No se pudo guardar el catálogo. Reintentá.";
  renderShop();
}

function handleShopClick(event) {
  if (shopBusy) return;
  const target = event.target;
  const save = target.closest("[data-admin-save]");
  const pick = target.closest("[data-pick]");
  const remove = target.closest("[data-remove]");
  if (save) { saveShopAdmin(save); return; }
  if (pick) {
    const id = pick.dataset.pick;
    shopCart = shopCart.includes(id) ? shopCart.filter((other) => other !== id) : [...shopCart, id];
  } else if (remove) {
    shopCart = shopCart.filter((id) => id !== remove.dataset.remove);
  } else if (target.closest("[data-clear]")) {
    shopCart = [];
  } else if (target.closest("[data-pay]")) {
    shopConfirm = true;
  } else if (target.closest("[data-pay-no]")) {
    shopConfirm = false;
  } else if (target.closest("[data-pay-yes]")) {
    payShopCart();
    return;
  } else {
    return;
  }
  if (!target.closest("[data-pay]")) shopConfirm = false;
  el.shopStatus.textContent = "";
  renderShop();
}

function setupShopUI() {
  document.getElementById("shop-close")?.addEventListener("click", closeShop);
  el.shopOverlay?.addEventListener("click", (ev) => { if (ev.target === el.shopOverlay) closeShop(); });
  el.shopTabs?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-group]");
    if (!btn) return;
    shopGroup = btn.dataset.group;
    shopSubcategory = null;
    shopConfirm = false;
    el.shopStatus.textContent = "";
    renderShop();
  });
  el.shopSubtabs?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-subcategory]");
    if (!btn) return;
    shopSubcategory = btn.dataset.subcategory;
    shopConfirm = false;
    el.shopStatus.textContent = "";
    renderShop();
  });
  el.shopOverlay?.addEventListener("click", handleShopClick);
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !el.shopOverlay?.hidden) closeShop(); });
  waitForCloud(10000).then((cloud) => {
    if (!cloud?.enabled) return;
    cloud.subscribeShopCatalog((items) => {
      shopCatalog = items;
      if (!el.shopOverlay.hidden) renderShop();
    });
  });
}
