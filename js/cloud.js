/**
 * v3.3 — Capa de nube (Firebase): cuenta por nombre de usuario + PIN de 4
 * dígitos (o, opcionalmente, "Iniciar sesión con Google"), guardado de la
 * mascota en Firestore, y sistema de amigos (solicitud/aceptar/rechazar/
 * eliminar). Todo lo que habla con Firebase vive en este único archivo —
 * el resto de la app (js/app.js) sólo llama a las funciones de
 * `window.Cloud`, sin importar si hay nube o no.
 *
 * Se carga como módulo ES (type="module") para poder usar el SDK modular
 * de Firebase desde su CDN oficial (no hace falta instalar nada ni tener
 * un paso de build). Como los módulos se ejecutan después que los
 * scripts clásicos, `window.Cloud` se crea ACÁ MISMO de forma síncrona
 * (con todos sus métodos) antes de que termine de cargar el SDK — cada
 * método espera internamente a `ready` antes de usar Firestore/Auth, así
 * que js/app.js puede engancharse en cuanto `window.Cloud` exista, sin
 * carreras entre scripts.
 *
 * MODELO DE SEGURIDAD (léase antes de asumir que esto es "a prueba de
 * todo" — está documentado también en README.md):
 * Hay DOS formas de entrar, con dos niveles de protección distintos:
 *
 * 1) Usuario + PIN de 4 dígitos, sin cuenta de verdad detrás (sin mail,
 *    sin recuperación) — pensado para jugar entre amigos de confianza,
 *    no para datos sensibles. El PIN se guarda hasheado (SHA-256), nunca
 *    en texto plano, y las reglas de Firestore exigen que cualquier
 *    actualización mantenga ese hash sin cambios. Eso evita que alguien
 *    entre "sin querer" a la cuenta de otro sólo tipeando su nombre de
 *    usuario. NO es autenticación real: como no hay backend propio, una
 *    persona con conocimientos técnicos que inspeccione las peticiones
 *    de red podría leer el hash guardado (la lectura está abierta, hace
 *    falta para poder buscar amigos por nombre) y reenviarlo sin conocer
 *    el PIN real.
 *
 * 2) "Iniciar sesión con Google": acá SÍ hay autenticación real de
 *    Firebase de por medio. La cuenta guarda un `ownerUid` (el uid que
 *    Firebase verifica en cada pedido, no algo que viaje como dato) y las
 *    reglas de Firestore sólo dejan escribir la mascota/los datos de la
 *    cuenta a ese uid exacto — nadie puede "copiar y reenviar" nada para
 *    saltárselo, a diferencia del PIN.
 *
 * En ambos casos, el sistema de AMIGOS (enviar/aceptar solicitudes) sigue
 * el mismo modelo liviano: como no hay backend propio que arbitre esos
 * mensajes, cualquier usuario autenticado puede escribir en el buzón de
 * solicitudes de cualquier otro (nunca en su mascota ni en los datos de
 * su cuenta). Para el uso previsto (mascota virtual entre compañeros/
 * amigos) es un techo de protección razonable — no lo uses para nada que
 * necesite seguridad de verdad.
 */

const FIREBASE_SDK_VERSION = "10.14.1";
const FIREBASE_CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

function normalizeUsername(raw) {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]{2,15}$/.test(v)) return null;
  return v;
}

function isValidPin(pin) {
  return typeof pin === "string" && /^[0-9]{4}$/.test(pin);
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hashPin(usernameLower, pin) {
  // El nombre de usuario entra en el hash para que dos personas con el
  // mismo PIN (ej. "1234") no terminen con el mismo hash guardado.
  return sha256Hex(`mascotito:${usernameLower}:${pin}`);
}

// ---------------------------------------------------------------------
// Estado interno del módulo — se completa cuando termina de cargar el
// SDK (o queda null para siempre si CLOUD_ENABLED es false o falla la
// carga: todos los métodos devuelven un error prolijo en ese caso).
// ---------------------------------------------------------------------
let db = null;
let authReady = false;
let initError = null;
let auth = null;
let authModRef = null;

const readyPromise = (async () => {
  if (typeof CLOUD_ENABLED === "undefined" || !CLOUD_ENABLED) return;
  try {
    const [{ initializeApp }, authMod, storeMod] = await Promise.all([
      import(`${FIREBASE_CDN}/firebase-app.js`),
      import(`${FIREBASE_CDN}/firebase-auth.js`),
      import(`${FIREBASE_CDN}/firebase-firestore.js`),
    ]);
    const app = initializeApp(FIREBASE_CONFIG);
    auth = authMod.getAuth(app);
    authModRef = authMod;
    db = storeMod.getFirestore(app);
    window.__cloudFns = storeMod; // usado por los métodos de más abajo
    // Si ya había una sesión guardada por el navegador (Google, o una
    // anónima de una visita anterior), Firebase Auth la restaura solo.
    // Esperamos UNA vez a onAuthStateChanged para enterarnos: si ya hay
    // alguien, la dejamos como está (no le "robamos" la sesión de Google
    // a nadie iniciando sesión anónima encima); si no hay nadie, recién
    // ahí entramos como anónimo, como antes.
    const existingUser = await new Promise((resolve) => {
      const unsub = authMod.onAuthStateChanged(auth, (user) => {
        unsub();
        resolve(user);
      });
    });
    if (!existingUser) {
      await authMod.signInAnonymously(auth);
    }
    authReady = true;
  } catch (err) {
    console.warn("[Mascotito] No se pudo inicializar Firebase — se sigue en modo sin nube.", err);
    initError = err;
    db = null;
  }
})();

function playerRef(usernameLower) {
  const { doc } = window.__cloudFns;
  return doc(db, "players", usernameLower);
}

function googleLinkRef(uid) {
  const { doc } = window.__cloudFns;
  return doc(db, "googleLinks", uid);
}

/** Todo método de nube pasa por acá primero: espera la inicialización y
 * devuelve un motivo claro si no hay nube disponible (sin configurar, o
 * falló la conexión) en vez de tirar una excepción rara. */
async function ensureReady() {
  await readyPromise;
  if (typeof CLOUD_ENABLED === "undefined" || !CLOUD_ENABLED) {
    return { ok: false, error: "disabled" };
  }
  if (!db || !authReady) {
    return { ok: false, error: "network" };
  }
  return { ok: true };
}

async function register(usernameRaw, pin, initialPetState) {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  const usernameLower = normalizeUsername(usernameRaw);
  if (!usernameLower) return { ok: false, error: "invalid_username" };
  if (!isValidPin(pin)) return { ok: false, error: "invalid_pin" };
  const { getDoc, setDoc } = window.__cloudFns;
  const ref = playerRef(usernameLower);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) return { ok: false, error: "taken" };
    const pinHash = await hashPin(usernameLower, pin);
    const now = Date.now();
    await setDoc(ref, {
      usernameLower,
      username: usernameRaw.trim(),
      pinHash,
      createdAt: now,
      lastActive: now,
      petState: initialPetState || null,
      friends: {},
      friendRequests: { incoming: {}, outgoing: {} },
    });
    return { ok: true, usernameLower, username: usernameRaw.trim() };
  } catch (err) {
    console.warn("[Mascotito] Error al crear la cuenta en la nube.", err);
    return { ok: false, error: "network" };
  }
}

async function login(usernameRaw, pin) {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  const usernameLower = normalizeUsername(usernameRaw);
  if (!usernameLower) return { ok: false, error: "invalid_username" };
  if (!isValidPin(pin)) return { ok: false, error: "invalid_pin" };
  const { getDoc } = window.__cloudFns;
  try {
    const snap = await getDoc(playerRef(usernameLower));
    if (!snap.exists()) return { ok: false, error: "not_found" };
    const data = snap.data();
    const pinHash = await hashPin(usernameLower, pin);
    if (pinHash !== data.pinHash) return { ok: false, error: "wrong_pin" };
    return { ok: true, usernameLower, username: data.username, data };
  } catch (err) {
    console.warn("[Mascotito] Error al iniciar sesión en la nube.", err);
    return { ok: false, error: "network" };
  }
}

async function getPlayerData(usernameLower) {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  const { getDoc } = window.__cloudFns;
  try {
    const snap = await getDoc(playerRef(usernameLower));
    if (!snap.exists()) return { ok: false, error: "not_found" };
    return { ok: true, data: snap.data() };
  } catch (err) {
    return { ok: false, error: "network" };
  }
}

async function savePetState(usernameLower, petState) {
  const gate = await ensureReady();
  if (!gate.ok) return false;
  const { updateDoc } = window.__cloudFns;
  try {
    await updateDoc(playerRef(usernameLower), { petState, lastActive: Date.now() });
    return true;
  } catch (err) {
    console.warn("[Mascotito] No se pudo guardar en la nube (se sigue guardando local).", err);
    return false;
  }
}

/** Sólo confirma si existe y devuelve su nombre "de verdad" (con
 * mayúsculas originales) — no expone nada más al resto de la app. */
async function searchUser(usernameRaw) {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  const usernameLower = normalizeUsername(usernameRaw);
  if (!usernameLower) return { ok: false, error: "invalid_username" };
  const { getDoc } = window.__cloudFns;
  try {
    const snap = await getDoc(playerRef(usernameLower));
    if (!snap.exists()) return { ok: true, exists: false };
    return { ok: true, exists: true, usernameLower, username: snap.data().username };
  } catch (err) {
    return { ok: false, error: "network" };
  }
}

async function sendFriendRequest(meLower, meDisplay, targetRaw) {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  const targetLower = normalizeUsername(targetRaw);
  if (!targetLower) return { ok: false, error: "invalid_username" };
  if (targetLower === meLower) return { ok: false, error: "self" };
  const { runTransaction } = window.__cloudFns;
  try {
    return await runTransaction(db, async (tx) => {
      const meRef = playerRef(meLower);
      const targetRef = playerRef(targetLower);
      const [meSnap, targetSnap] = await Promise.all([tx.get(meRef), tx.get(targetRef)]);
      if (!targetSnap.exists()) return { ok: false, error: "not_found" };
      const meData = meSnap.data();
      if (meData.friends && meData.friends[targetLower]) return { ok: false, error: "already_friends" };
      if (meData.friendRequests?.outgoing?.[targetLower]) return { ok: false, error: "already_pending" };
      if (meData.friendRequests?.incoming?.[targetLower]) return { ok: false, error: "incoming_pending" };
      const now = Date.now();
      tx.update(meRef, { [`friendRequests.outgoing.${targetLower}`]: { at: now } });
      tx.update(targetRef, {
        [`friendRequests.incoming.${meLower}`]: { at: now, fromDisplay: meDisplay },
      });
      return { ok: true };
    });
  } catch (err) {
    console.warn("[Mascotito] Error al enviar solicitud de amistad.", err);
    return { ok: false, error: "network" };
  }
}

async function acceptFriendRequest(meLower, meDisplay, fromLower) {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  const { runTransaction, deleteField } = window.__cloudFns;
  try {
    return await runTransaction(db, async (tx) => {
      const meRef = playerRef(meLower);
      const fromRef = playerRef(fromLower);
      const [meSnap, fromSnap] = await Promise.all([tx.get(meRef), tx.get(fromRef)]);
      const meData = meSnap.data();
      if (!meData.friendRequests?.incoming?.[fromLower]) return { ok: false, error: "not_found" };
      const now = Date.now();
      const fromDisplay = fromSnap.exists() ? fromSnap.data().username : fromLower;
      tx.update(meRef, {
        [`friends.${fromLower}`]: { since: now, displayName: fromDisplay },
        [`friendRequests.incoming.${fromLower}`]: deleteField(),
      });
      if (fromSnap.exists()) {
        tx.update(fromRef, {
          [`friends.${meLower}`]: { since: now, displayName: meDisplay },
          [`friendRequests.outgoing.${meLower}`]: deleteField(),
        });
      }
      return { ok: true };
    });
  } catch (err) {
    console.warn("[Mascotito] Error al aceptar solicitud de amistad.", err);
    return { ok: false, error: "network" };
  }
}

async function rejectFriendRequest(meLower, fromLower) {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  const { updateDoc, deleteField } = window.__cloudFns;
  try {
    await updateDoc(playerRef(meLower), {
      [`friendRequests.incoming.${fromLower}`]: deleteField(),
    });
    try {
      await updateDoc(playerRef(fromLower), {
        [`friendRequests.outgoing.${meLower}`]: deleteField(),
      });
    } catch (e) {
      // la otra cuenta puede no existir más — no es grave
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "network" };
  }
}

async function cancelFriendRequest(meLower, targetLower) {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  const { updateDoc, deleteField } = window.__cloudFns;
  try {
    await updateDoc(playerRef(meLower), {
      [`friendRequests.outgoing.${targetLower}`]: deleteField(),
    });
    try {
      await updateDoc(playerRef(targetLower), {
        [`friendRequests.incoming.${meLower}`]: deleteField(),
      });
    } catch (e) {
      // ok si ya no existe
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "network" };
  }
}

async function removeFriend(meLower, otherLower) {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  const { updateDoc, deleteField } = window.__cloudFns;
  try {
    await updateDoc(playerRef(meLower), { [`friends.${otherLower}`]: deleteField() });
    try {
      await updateDoc(playerRef(otherLower), { [`friends.${meLower}`]: deleteField() });
    } catch (e) {
      // ok si ya no existe
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "network" };
  }
}

/** v3.4: eliminar la cuenta actual para siempre. Antes de borrar el
 * documento propio, intenta limpiar las referencias en las cuentas de
 * amigos/solicitudes (mismo "escritura social" que ya usan sendFriend-
 * Request/acceptFriendRequest — cualquier autenticado puede tocar esos dos
 * campos en la cuenta de cualquier otro). Cada limpieza es best-effort: si
 * una falla (la otra cuenta ya no existe, red caída puntual) no aborta el
 * borrado de la cuenta propia, que es la operación que de verdad importa
 * acá — un amigo con una referencia vieja a un usuario borrado ya se
 * maneja hoy en la UI (mismo caso que "la otra cuenta puede no existir
 * más" en rejectFriendRequest/cancelFriendRequest/removeFriend). */
async function deleteAccount(usernameLower) {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  const { getDoc, updateDoc, deleteDoc, deleteField } = window.__cloudFns;
  const meRef = playerRef(usernameLower);
  let data = null;
  try {
    const snap = await getDoc(meRef);
    if (!snap.exists()) return { ok: false, error: "not_found" };
    data = snap.data();
  } catch (err) {
    return { ok: false, error: "network" };
  }

  const friendKeys = Object.keys(data.friends || {});
  const incomingKeys = Object.keys(data.friendRequests?.incoming || {});
  const outgoingKeys = Object.keys(data.friendRequests?.outgoing || {});
  await Promise.all([
    ...friendKeys.map((k) =>
      updateDoc(playerRef(k), { [`friends.${usernameLower}`]: deleteField() }).catch(() => {})
    ),
    ...incomingKeys.map((k) =>
      // Alguien me mandó una solicitud a mí: para esa persona, yo soy su
      // "outgoing".
      updateDoc(playerRef(k), { [`friendRequests.outgoing.${usernameLower}`]: deleteField() }).catch(() => {})
    ),
    ...outgoingKeys.map((k) =>
      // Yo le mandé una solicitud a esa persona: para ella, yo soy su
      // "incoming".
      updateDoc(playerRef(k), { [`friendRequests.incoming.${usernameLower}`]: deleteField() }).catch(() => {})
    ),
  ]);

  if (data.ownerUid) {
    try {
      await deleteDoc(googleLinkRef(data.ownerUid));
    } catch (e) {
      // no es grave si falla — el vínculo huérfano ya se maneja en
      // loginWithGoogle() (needsUsername: true si el doc no existe más)
    }
  }

  try {
    await deleteDoc(meRef);
    return { ok: true };
  } catch (err) {
    console.warn("[Mascotito] Error al eliminar la cuenta.", err);
    return { ok: false, error: "network" };
  }
}

/** Dispara el popup de Google y devuelve o bien la cuenta ya vinculada a
 * ese usuario de Google, o `needsUsername: true` si es la primera vez que
 * esa cuenta de Google entra a Mascotito (todavía no eligió nombre). */
async function loginWithGoogle() {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  const { getDoc } = window.__cloudFns;
  try {
    const provider = new authModRef.GoogleAuthProvider();
    const result = await authModRef.signInWithPopup(auth, provider);
    const googleUid = result.user.uid;
    const linkSnap = await getDoc(googleLinkRef(googleUid));
    if (!linkSnap.exists()) {
      const suggestedName = (result.user.displayName || "")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 16);
      return { ok: true, needsUsername: true, googleUid, suggestedName };
    }
    const usernameLower = linkSnap.data().usernameLower;
    const playerSnap = await getDoc(playerRef(usernameLower));
    if (!playerSnap.exists()) {
      // Vínculo huérfano (raro, ej. se borró el documento a mano) — se
      // trata igual que la primera vez, dejando elegir nombre de nuevo.
      return { ok: true, needsUsername: true, googleUid, suggestedName: usernameLower };
    }
    const data = playerSnap.data();
    return { ok: true, needsUsername: false, usernameLower, username: data.username, data };
  } catch (err) {
    if (err && (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request")) {
      return { ok: false, error: "popup_closed" };
    }
    console.warn("[Mascotito] Error al iniciar sesión con Google.", err);
    return { ok: false, error: "network" };
  }
}

/** Crea la cuenta de Mascotito para una cuenta de Google que entró por
 * primera vez (loginWithGoogle devolvió needsUsername: true). */
async function completeGoogleSignup(usernameRaw, googleUid) {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  const usernameLower = normalizeUsername(usernameRaw);
  if (!usernameLower) return { ok: false, error: "invalid_username" };
  const { getDoc, setDoc } = window.__cloudFns;
  try {
    const ref = playerRef(usernameLower);
    const snap = await getDoc(ref);
    if (snap.exists()) return { ok: false, error: "taken" };
    const now = Date.now();
    await setDoc(ref, {
      usernameLower,
      username: usernameRaw.trim(),
      ownerUid: googleUid,
      createdAt: now,
      lastActive: now,
      petState: null,
      friends: {},
      friendRequests: { incoming: {}, outgoing: {} },
    });
    await setDoc(googleLinkRef(googleUid), { usernameLower, createdAt: now });
    return { ok: true, usernameLower, username: usernameRaw.trim() };
  } catch (err) {
    console.warn("[Mascotito] Error al crear la cuenta de Google en la nube.", err);
    return { ok: false, error: "network" };
  }
}

/** Cierra la sesión de Google y vuelve a entrar como anónimo, para que la
 * pantalla de login pueda seguir buscando/entrando cuentas con PIN sin
 * quedarse sin `request.auth` (las reglas de Firestore lo exigen). */
async function signOutCloud() {
  const gate = await ensureReady();
  if (!gate.ok) return gate;
  try {
    await authModRef.signOut(auth);
    await authModRef.signInAnonymously(auth);
    return { ok: true };
  } catch (err) {
    console.warn("[Mascotito] Error al cerrar la sesión de nube.", err);
    return { ok: false, error: "network" };
  }
}

function subscribeToPlayer(usernameLower, callback) {
  if (typeof CLOUD_ENABLED === "undefined" || !CLOUD_ENABLED) return () => {};
  let unsub = () => {};
  let cancelled = false;
  readyPromise.then(() => {
    if (cancelled || !db) return;
    const { onSnapshot } = window.__cloudFns;
    unsub = onSnapshot(
      playerRef(usernameLower),
      (snap) => callback(snap.exists() ? snap.data() : null),
      (err) => console.warn("[Mascotito] Se cortó la actualización en vivo de amigos.", err)
    );
  });
  return () => {
    cancelled = true;
    unsub();
  };
}

window.Cloud = {
  enabled: typeof CLOUD_ENABLED !== "undefined" && CLOUD_ENABLED,
  ready: readyPromise,
  normalizeUsername,
  isValidPin,
  register,
  login,
  loginWithGoogle,
  completeGoogleSignup,
  signOutCloud,
  getPlayerData,
  savePetState,
  searchUser,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  deleteAccount,
  subscribeToPlayer,
  get lastInitError() {
    return initError;
  },
};
