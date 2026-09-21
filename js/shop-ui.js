/* Pantalla de tienda y controles de catálogo de Beta v3.0. */
function openShop() {
  if (!state) return;
  shopGroup = "Casa";
  shopSubcategory = null;
  el.shopStatus.textContent = "";
  renderShop();
  el.shopOverlay.hidden = false;
  document.getElementById("shop-close")?.focus();
}

function closeShop() { el.shopOverlay.hidden = true; }

function renderShop() {
  if (!state) return;
  el.shopCoins.textContent = state.economy.coins;
  el.shopTabs.querySelectorAll("[data-group]").forEach((btn) => btn.classList.toggle("is-active", btn.dataset.group === shopGroup));
  const subcategories = [...new Set(SHOP_ITEMS.filter((item) => item.group === shopGroup).map((item) => item.subcategory))];
  if (!subcategories.includes(shopSubcategory)) shopSubcategory = subcategories[0];
  el.shopSubtabs.replaceChildren();
  subcategories.forEach((name) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "inventory-tab" + (name === shopSubcategory ? " is-active" : "");
    btn.dataset.subcategory = name;
    btn.textContent = name;
    el.shopSubtabs.appendChild(btn);
  });
  el.shopGrid.replaceChildren();
  const items = SHOP_ITEMS.filter((item) => item.group === shopGroup
    && item.subcategory === shopSubcategory
    && (isAdmin() || shopSetting(shopCatalog, item).enabled));
  if (!items.length) {
    el.shopGrid.textContent = "Todavía no hay artículos disponibles en esta categoría.";
    return;
  }
  items.forEach((item) => {
    const setting = shopSetting(shopCatalog, item);
    const owned = shopOwns(state, item);
    const card = document.createElement("article");
    card.className = "shop-card";
    card.title = item.label;
    if (item.asset) {
      const img = document.createElement("img");
      img.src = item.asset;
      img.alt = item.label;
      card.appendChild(img);
    } else {
      const swatch = document.createElement("span");
      swatch.className = "shop-swatch";
      swatch.setAttribute("role", "img");
      swatch.setAttribute("aria-label", item.label);
      swatch.style.background = item.swatch;
      card.appendChild(swatch);
    }
    const price = document.createElement("span");
    price.className = "shop-price";
    price.textContent = setting.price == null ? "Sin precio" : `${setting.price} monedas`;
    card.appendChild(price);
    const buy = document.createElement("button");
    buy.type = "button";
    buy.className = "primary-btn";
    buy.dataset.buy = item.id;
    buy.setAttribute("aria-label", `${owned ? "Ya tenés" : "Comprar"} ${item.label}`);
    buy.textContent = owned ? "Ya lo tenés" : setting.price != null && state.economy.coins < setting.price ? "Faltan monedas" : "Comprar";
    buy.disabled = shopBusy || owned || !setting.enabled || setting.price == null || state.economy.coins < setting.price;
    card.appendChild(buy);
    if (isAdmin()) {
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
      card.appendChild(controls);
    }
    el.shopGrid.appendChild(card);
  });
}

async function handleShopClick(event) {
  if (shopBusy) return;
  const save = event.target.closest("[data-admin-save]");
  const buy = event.target.closest("[data-buy]");
  if (!save && !buy) return;
  const item = SHOP_BY_ID[(save || buy).dataset[save ? "adminSave" : "buy"]];
  if (!item) return;
  if (save) {
    if (!isAdmin()) return;
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
    return;
  }
  const setting = shopSetting(shopCatalog, item);
  if (!setting.enabled || setting.price == null || shopOwns(state, item) || state.economy.coins < setting.price) return;
  shopBusy = true;
  renderShop();
  let result;
  if (window.Cloud?.enabled && currentUsername) {
    cloudSavePaused = true;
    const saved = await flushCloudSaveNow();
    result = saved ? await window.Cloud.purchaseShopItem(currentUsername, item.id) : { ok: false, error: "network" };
    if (result.ok) {
      state = normalizeState(result.petState);
      saveState(state);
    }
    cloudSavePaused = false;
    if (cloudSavePending) scheduleCloudSave(state);
  } else {
    state.economy.coins -= setting.price;
    shopGrant(state, item);
    trySave(state);
    result = { ok: true };
  }
  shopBusy = false;
  el.shopStatus.textContent = result.ok ? `Compraste ${item.label}.` : ({ owned: "Ya tenés ese artículo.", coins: "No alcanzan las monedas.", unavailable: "El artículo ya no está disponible." }[result.error] || "No se pudo completar la compra. Reintentá.");
  if (result.ok) refreshUI();
  renderShop();
}

function setupShopUI() {
  document.getElementById("shop-close")?.addEventListener("click", closeShop);
  document.getElementById("shop-close-action")?.addEventListener("click", closeShop);
  el.shopOverlay?.addEventListener("click", (ev) => { if (ev.target === el.shopOverlay) closeShop(); });
  el.shopTabs?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-group]");
    if (!btn) return;
    shopGroup = btn.dataset.group;
    shopSubcategory = null;
    el.shopStatus.textContent = "";
    renderShop();
  });
  el.shopSubtabs?.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-subcategory]");
    if (!btn) return;
    shopSubcategory = btn.dataset.subcategory;
    el.shopStatus.textContent = "";
    renderShop();
  });
  el.shopGrid?.addEventListener("click", handleShopClick);
  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !el.shopOverlay?.hidden) closeShop(); });
  waitForCloud(10000).then((cloud) => {
    if (!cloud?.enabled) return;
    cloud.subscribeShopCatalog((items) => {
      shopCatalog = items;
      if (!el.shopOverlay.hidden) renderShop();
    });
  });
}
