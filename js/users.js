// Perfiles locales. La identidad se mantiene fija durante cada sesión/pestaña.
// La partida original se conserva intacta como respaldo de la migración.
const USER_KEY = PET_CONFIG.storageKey + ".activeUser";
const LEGACY_OWNER_KEY = PET_CONFIG.storageKey + ".legacyOwner";
let activeUsername = null;

function normalizeUsername(value) {
  const name = typeof value === "string" ? value.normalize("NFKC").trim().toLowerCase() : "";
  if (!/^[\p{L}\p{N}_-]{1,24}$/u.test(name)) {
    throw new Error("Usá entre 1 y 24 letras, números, guiones o guiones bajos, sin espacios.");
  }
  return name;
}

function userStateKey(name) {
  return PET_CONFIG.storageKey + ".user." + encodeURIComponent(name);
}

function currentStateKey() {
  if (!activeUsername) throw new Error("Primero ingresá tu nombre de usuario.");
  return userStateKey(activeUsername);
}

function selectUsername(value) {
  const name = normalizeUsername(value);
  const target = userStateKey(name);
  const owner = localStorage.getItem(LEGACY_OWNER_KEY);
  const legacy = localStorage.getItem(PET_CONFIG.storageKey);
  const recovery = localStorage.getItem(PET_CONFIG.storageKey + ".recovery");
  if (!owner && (legacy || recovery)) {
    // Copiar antes de marcar como migrado: si falla el almacenamiento,
    // el original sigue disponible para reintentar, incluso tras recargar.
    if (localStorage.getItem(target) === null) {
      if (recovery) localStorage.setItem(target + ".recovery", recovery);
      localStorage.setItem(target, legacy || recovery);
    }
    localStorage.setItem(LEGACY_OWNER_KEY, name);
  }
  localStorage.setItem(USER_KEY, name);
  activeUsername = name;
  return name;
}

function restoreUsername() {
  try {
    const name = localStorage.getItem(USER_KEY);
    if (name) return selectUsername(name);
  } catch (error) {
    // El formulario permite reintentar sin arrancar ni sobrescribir partidas.
  }
  return null;
}

function requestUsername() {
  const panel = document.getElementById("user-entry");
  const input = document.getElementById("username-input");
  const error = document.getElementById("username-error");
  panel.hidden = false;
  input.focus();
  return new Promise((resolve) => {
    document.getElementById("username-form").addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        const name = selectUsername(input.value);
        panel.hidden = true;
        resolve(name);
      } catch (failure) {
        error.textContent = failure.name === "Error" ? failure.message :
          "No se pudo guardar el usuario. Habilitá el almacenamiento del navegador o liberá espacio y volvé a intentar. Tu partida anterior se conserva.";
        input.setAttribute("aria-invalid", "true");
        input.focus();
      }
    });
    input.addEventListener("input", () => {
      error.textContent = "";
      input.removeAttribute("aria-invalid");
    });
  });
}
