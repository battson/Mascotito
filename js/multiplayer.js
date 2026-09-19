/**
 * v3.9.7 — Presencia, movimiento, acciones, chat de sala y mensajes privados.
 *
 * Firestore sigue guardando la mascota. Este módulo sólo administra datos
 * efímeros: qué navegador está conectado y en qué casa se encuentra. Cada
 * pestaña usa un clientId propio, por lo que cerrar una de dos pestañas no
 * desconecta falsamente a la otra. onDisconnect elimina automáticamente
 * las entradas si se corta Internet o se cierra la app sin despedirse.
 */

const FIREBASE_SDK_VERSION = "10.14.1";
const FIREBASE_CDN = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;

let db = null;
let dbFns = null;
let initError = null;
let connected = false;
let presenceReady = false;
let serverTimeOffset = 0;
let session = null;
let connectionUnsubscribe = null;
const connectionListeners = new Set();
let clientId = null;
let presenceDisconnect = null;
let roomDisconnect = null;
let movementDisconnect = null;
let typingDisconnect = null;
let presencePublishPromise = Promise.resolve(false);
let movementTimer = null;
let pendingMovement = null;
let lastMovementSent = null;
let movementSequence = 0;
const MOVEMENT_SEND_INTERVAL_MS = 100;
const ACTION_TTL_MS = 60000;
const ACTION_MAX_AGE_MS = 8000;
const ACTION_FUTURE_TOLERANCE_MS = 5000;
const CHAT_MAX_TEXT = 180;
const CHAT_HISTORY_LIMIT = 40;
const CHAT_STORAGE_LIMIT = 60;
const CHAT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const CHAT_SEND_INTERVAL_MS = 800;
let lastChatSentAt = 0;
const DIRECT_CHAT_HISTORY_LIMIT = 100;
const directChatLastSentAt = new Map();
const ACTION_TYPES = new Set([
  "eat", "drink", "bathe", "sleep", "wake", "pet", "talk",
  "play", "play_end", "medicine", "poop", "clean",
]);

function safeKey(value) {
  return typeof value === "string" && /^[a-z][a-z0-9_]{2,15}$/.test(value) ? value : null;
}

function makeClientId() {
  if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

const readyPromise = (async () => {
  if (typeof MULTIPLAYER_ENABLED === "undefined" || !MULTIPLAYER_ENABLED) return false;
  try {
    const [appMod, databaseMod] = await Promise.all([
      import(`${FIREBASE_CDN}/firebase-app.js`),
      import(`${FIREBASE_CDN}/firebase-database.js`),
    ]);
    const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(FIREBASE_CONFIG);
    db = databaseMod.getDatabase(app, FIREBASE_CONFIG.databaseURL);
    dbFns = databaseMod;
    connectionUnsubscribe = databaseMod.onValue(databaseMod.ref(db, ".info/connected"), (snap) => {
      const wasConnected = connected;
      connected = snap.val() === true;
      if (connected && !wasConnected) lastMovementSent = null;
      if (connected && session) {
        presenceReady = false;
        connectionListeners.forEach((callback) => callback(false));
        publishPresence().then((published) => {
          if (connected) connectionListeners.forEach((callback) => callback(!!published && presenceReady));
        }).catch(() => connectionListeners.forEach((callback) => callback(false)));
      } else {
        if (!connected) presenceReady = false;
        connectionListeners.forEach((callback) => callback(connected));
      }
    });
    databaseMod.onValue(databaseMod.ref(db, ".info/serverTimeOffset"), (snap) => {
      serverTimeOffset = Number(snap.val()) || 0;
    });
    return true;
  } catch (err) {
    initError = err;
    console.warn("[Mascotito] No se pudo iniciar la presencia en tiempo real; se usa el estado aproximado.", err);
    return false;
  }
})();

function presenceRef(username, id = clientId) {
  return dbFns.ref(db, `presence/${username}/connections/${id}`);
}

function roomMemberRef(room, username, id = clientId) {
  return dbFns.ref(db, `rooms/${room}/members/${username}/${id}`);
}

function movementRef(room, username, id = clientId) {
  return dbFns.ref(db, `rooms/${room}/players/${username}/${id}`);
}

function actionsRef(room) {
  return dbFns.ref(db, `rooms/${room}/events`);
}

function chatRef(room) {
  return dbFns.ref(db, `rooms/${room}/chat`);
}

function directConversationKey(firstRaw, secondRaw) {
  const first = safeKey(firstRaw);
  const second = safeKey(secondRaw);
  if (!first || !second || first === second) return null;
  return [first, second].sort().join("~");
}

function directMessagesRef(conversationId) {
  return dbFns.ref(db, `directChats/${conversationId}/messages`);
}

function typingRef(room, username, id = clientId) {
  return dbFns.ref(db, `rooms/${room}/typing/${username}/${id}`);
}

async function cancelDisconnects() {
  const jobs = [];
  if (presenceDisconnect) jobs.push(presenceDisconnect.cancel().catch(() => {}));
  if (roomDisconnect) jobs.push(roomDisconnect.cancel().catch(() => {}));
  if (movementDisconnect) jobs.push(movementDisconnect.cancel().catch(() => {}));
  if (typingDisconnect) jobs.push(typingDisconnect.cancel().catch(() => {}));
  presenceDisconnect = null;
  roomDisconnect = null;
  movementDisconnect = null;
  typingDisconnect = null;
  await Promise.all(jobs);
}

async function publishPresenceNow() {
  if (!db || !dbFns || !session || !connected) return false;
  presenceReady = false;
  const { username, displayName, currentRoom } = session;
  const pRef = presenceRef(username);
  const rRef = roomMemberRef(currentRoom, username);
  const mRef = movementRef(currentRoom, username);
  const tRef = typingRef(currentRoom, username);
  await cancelDisconnects();
  presenceDisconnect = dbFns.onDisconnect(pRef);
  roomDisconnect = dbFns.onDisconnect(rRef);
  movementDisconnect = dbFns.onDisconnect(mRef);
  typingDisconnect = dbFns.onDisconnect(tRef);
  await Promise.all([presenceDisconnect.remove(), roomDisconnect.remove(), movementDisconnect.remove(), typingDisconnect.remove()]);
  const payload = {
    displayName,
    currentRoom,
    connectedAt: dbFns.serverTimestamp(),
    updatedAt: dbFns.serverTimestamp(),
  };
  await Promise.all([
    dbFns.set(pRef, payload),
    dbFns.set(rRef, { displayName, role: currentRoom === username ? "owner" : "visitor", joinedAt: dbFns.serverTimestamp() }),
  ]);
  presenceReady = true;
  return true;
}

function publishPresence() {
  presencePublishPromise = presencePublishPromise
    .catch(() => false)
    .then(() => publishPresenceNow());
  return presencePublishPromise;
}

async function startSession(usernameRaw, displayNameRaw) {
  if (!(await readyPromise)) return false;
  const username = safeKey(usernameRaw);
  if (!username) return false;
  if (session) await stopSession();
  clientId = makeClientId();
  session = {
    username,
    displayName: String(displayNameRaw || username).slice(0, 32),
    currentRoom: username,
  };
  if (connected) await publishPresence();
  return true;
}

async function enterRoom(roomRaw) {
  if (!(await readyPromise) || !session) return false;
  await presencePublishPromise.catch(() => false);
  if (!session) return false;
  const room = safeKey(roomRaw);
  if (!room) return false;
  const previousRoom = session.currentRoom;
  if (previousRoom === room) {
    if (connected) await publishPresence();
    return true;
  }
  if (db && clientId) await dbFns.remove(roomMemberRef(previousRoom, session.username)).catch(() => {});
  if (db && clientId) await dbFns.remove(movementRef(previousRoom, session.username)).catch(() => {});
  if (db && clientId) await dbFns.remove(typingRef(previousRoom, session.username)).catch(() => {});
  session.currentRoom = room;
  presenceReady = false;
  lastMovementSent = null;
  if (connected) await publishPresence();
  return true;
}

async function stopSession() {
  if (!(await readyPromise) || !session) return false;
  await presencePublishPromise.catch(() => false);
  if (!session) return false;
  const old = session;
  session = null;
  presenceReady = false;
  clearTimeout(movementTimer);
  movementTimer = null;
  pendingMovement = null;
  await cancelDisconnects();
  await Promise.all([
    dbFns.remove(presenceRef(old.username)).catch(() => {}),
    dbFns.remove(roomMemberRef(old.currentRoom, old.username)).catch(() => {}),
    dbFns.remove(movementRef(old.currentRoom, old.username)).catch(() => {}),
    dbFns.remove(typingRef(old.currentRoom, old.username)).catch(() => {}),
  ]);
  clientId = null;
  return true;
}

function normalizeMovement(raw) {
  const xPct = Math.max(4, Math.min(96, Number(raw?.xPct) || 50));
  const direction = raw?.direction === "left" ? "left" : "right";
  const allowed = new Set(["idle", "walking", "running", "sleeping"]);
  const animation = allowed.has(raw?.animation) ? raw.animation : "idle";
  return { xPct: Math.round(xPct * 100) / 100, direction, animation };
}

async function sendMovementNow() {
  movementTimer = null;
  if (!pendingMovement || !db || !dbFns || !session || !connected) return false;
  const movement = pendingMovement;
  pendingMovement = null;
  const unchanged = lastMovementSent
    && Math.abs(lastMovementSent.xPct - movement.xPct) < 0.12
    && lastMovementSent.direction === movement.direction
    && lastMovementSent.animation === movement.animation;
  if (unchanged) return true;
  movementSequence += 1;
  const payload = {
    ...movement,
    displayName: session.displayName,
    sequence: movementSequence,
    updatedAt: dbFns.serverTimestamp(),
  };
  await dbFns.set(movementRef(session.currentRoom, session.username), payload);
  lastMovementSent = movement;
  return true;
}

function publishMovement(raw) {
  if (!session || !connected) return false;
  const next = normalizeMovement(raw);
  const unchanged = !pendingMovement && lastMovementSent
    && Math.abs(lastMovementSent.xPct - next.xPct) < 0.12
    && lastMovementSent.direction === next.direction
    && lastMovementSent.animation === next.animation;
  if (unchanged) return true;
  pendingMovement = next;
  if (!movementTimer) {
    movementTimer = setTimeout(() => sendMovementNow().catch(() => {}), MOVEMENT_SEND_INTERVAL_MS);
  }
  return true;
}

function normalizeActionData(raw) {
  const data = {};
  if (!raw || typeof raw !== "object") return data;
  if (typeof raw.text === "string") data.text = raw.text.trim().slice(0, 180);
  ["item", "game", "result"].forEach((key) => {
    if (typeof raw[key] === "string") data[key] = raw[key].trim().slice(0, 32);
  });
  return data;
}

async function emitAction(typeRaw, dataRaw = {}) {
  const type = String(typeRaw || "").trim();
  if (!ACTION_TYPES.has(type) || !session || !connected || !db || !dbFns) return false;
  const eventRef = dbFns.push(actionsRef(session.currentRoom));
  await dbFns.set(eventRef, {
    actor: session.username,
    displayName: session.displayName,
    type,
    data: normalizeActionData(dataRaw),
    createdAt: dbFns.serverTimestamp(),
  });
  setTimeout(() => dbFns.remove(eventRef).catch(() => {}), ACTION_TTL_MS);
  return true;
}

function normalizeChatText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, CHAT_MAX_TEXT);
}

async function pruneRoomChat(room) {
  if (!db || !dbFns || !room) return;
  const snap = await dbFns.get(chatRef(room));
  const now = Date.now() + serverTimeOffset;
  const entries = Object.entries(snap.val() || {}).sort((a, b) => (Number(a[1]?.createdAt) || 0) - (Number(b[1]?.createdAt) || 0));
  const overflow = Math.max(0, entries.length - CHAT_STORAGE_LIMIT);
  const staleIds = entries
    .filter(([, value], index) => index < overflow || (Number(value?.createdAt) || 0) < now - CHAT_MAX_AGE_MS)
    .map(([id]) => id);
  await Promise.all(staleIds.map((id) => dbFns.remove(dbFns.ref(db, `rooms/${room}/chat/${id}`)).catch(() => {})));
}

async function sendChatMessage(textRaw) {
  const text = normalizeChatText(textRaw);
  const now = Date.now();
  if (!text || !session || !connected || !db || !dbFns) return { ok: false, reason: "offline" };
  if (now - lastChatSentAt < CHAT_SEND_INTERVAL_MS) return { ok: false, reason: "rate_limit" };
  lastChatSentAt = now;
  const room = session.currentRoom;
  const messageRef = dbFns.push(chatRef(room));
  try {
    await dbFns.set(messageRef, {
      actor: session.username,
      displayName: session.displayName,
      text,
      createdAt: dbFns.serverTimestamp(),
    });
    pruneRoomChat(room).catch(() => {});
    return { ok: true, id: messageRef.key };
  } catch (err) {
    lastChatSentAt = 0;
    return { ok: false, reason: "write_failed" };
  }
}

async function sendDirectMessage(otherUsernameRaw, otherDisplayNameRaw, textRaw) {
  const otherUsername = safeKey(otherUsernameRaw);
  const text = normalizeChatText(textRaw);
  if (!otherUsername || !text || !session || !connected || !db || !dbFns) return { ok: false, reason: "offline" };
  const conversationId = directConversationKey(session.username, otherUsername);
  if (!conversationId) return { ok: false, reason: "invalid_recipient" };
  const now = Date.now();
  const previousSentAt = directChatLastSentAt.get(conversationId) || 0;
  if (now - previousSentAt < CHAT_SEND_INTERVAL_MS) return { ok: false, reason: "rate_limit" };
  directChatLastSentAt.set(conversationId, now);
  const messageRef = dbFns.push(directMessagesRef(conversationId));
  const createdAt = dbFns.serverTimestamp();
  const otherDisplayName = String(otherDisplayNameRaw || otherUsername).slice(0, 32);
  const updates = {
    [`directChats/${conversationId}/messages/${messageRef.key}`]: {
      actor: session.username,
      recipient: otherUsername,
      displayName: session.displayName,
      text,
      createdAt,
    },
    [`directInbox/${session.username}/${conversationId}/otherUsername`]: otherUsername,
    [`directInbox/${session.username}/${conversationId}/otherDisplayName`]: otherDisplayName,
    [`directInbox/${session.username}/${conversationId}/lastText`]: text,
    [`directInbox/${session.username}/${conversationId}/lastActor`]: session.username,
    [`directInbox/${session.username}/${conversationId}/updatedAt`]: createdAt,
    [`directInbox/${session.username}/${conversationId}/unreadCount`]: 0,
    [`directInbox/${otherUsername}/${conversationId}/otherUsername`]: session.username,
    [`directInbox/${otherUsername}/${conversationId}/otherDisplayName`]: session.displayName,
    [`directInbox/${otherUsername}/${conversationId}/lastText`]: text,
    [`directInbox/${otherUsername}/${conversationId}/lastActor`]: session.username,
    [`directInbox/${otherUsername}/${conversationId}/updatedAt`]: createdAt,
    [`directInbox/${otherUsername}/${conversationId}/unreadCount`]: dbFns.increment(1),
  };
  try {
    await dbFns.update(dbFns.ref(db), updates);
    return { ok: true, id: messageRef.key, conversationId };
  } catch (err) {
    directChatLastSentAt.delete(conversationId);
    return { ok: false, reason: "write_failed" };
  }
}

async function markDirectChatRead(otherUsernameRaw) {
  if (!session || !db || !dbFns) return false;
  const conversationId = directConversationKey(session.username, otherUsernameRaw);
  if (!conversationId) return false;
  await dbFns.set(dbFns.ref(db, `directInbox/${session.username}/${conversationId}/unreadCount`), 0);
  return true;
}

function subscribeDirectInbox(callback) {
  if (typeof callback !== "function") return () => {};
  let unsubscribe = () => {};
  let cancelled = false;
  readyPromise.then((ok) => {
    if (!ok || cancelled || !session) return;
    unsubscribe = dbFns.onValue(dbFns.ref(db, `directInbox/${session.username}`), (snap) => {
      callback(snap.val() || {});
    }, () => callback(null));
  });
  return () => { cancelled = true; unsubscribe(); };
}

function subscribeDirectChat(otherUsernameRaw, callback) {
  const otherUsername = safeKey(otherUsernameRaw);
  if (!otherUsername || typeof callback !== "function") return () => {};
  let unsubscribe = () => {};
  let cancelled = false;
  readyPromise.then((ok) => {
    if (!ok || cancelled || !session) return;
    const conversationId = directConversationKey(session.username, otherUsername);
    if (!conversationId) return;
    const recent = dbFns.query(directMessagesRef(conversationId), dbFns.orderByChild("createdAt"), dbFns.limitToLast(DIRECT_CHAT_HISTORY_LIMIT));
    unsubscribe = dbFns.onValue(recent, (snap) => {
      const raw = snap.val() || {};
      const messages = Object.entries(raw).flatMap(([id, value]) => {
        const actor = safeKey(value?.actor);
        const recipient = safeKey(value?.recipient);
        const text = normalizeChatText(value?.text);
        const createdAt = Number(value?.createdAt) || 0;
        const belongsToConversation = (actor === session.username && recipient === otherUsername)
          || (actor === otherUsername && recipient === session.username);
        if (!belongsToConversation || !text || !createdAt) return [];
        return [{
          id,
          actor,
          recipient,
          displayName: String(value.displayName || actor).slice(0, 32),
          text,
          createdAt,
        }];
      }).sort((a, b) => a.createdAt - b.createdAt);
      callback(messages);
    }, () => callback(null));
  });
  return () => { cancelled = true; unsubscribe(); };
}

async function setTyping(active) {
  if (!session || !db || !dbFns) return false;
  const ref = typingRef(session.currentRoom, session.username);
  if (!active) {
    await dbFns.remove(ref).catch(() => {});
    return true;
  }
  if (!connected || !presenceReady) return false;
  await dbFns.set(ref, {
    displayName: session.displayName,
    updatedAt: dbFns.serverTimestamp(),
  });
  return true;
}

function subscribeUserPresence(usernameRaw, callback) {
  const username = safeKey(usernameRaw);
  if (!username || typeof callback !== "function") return () => {};
  let unsubscribe = () => {};
  let cancelled = false;
  readyPromise.then((ok) => {
    if (!ok || cancelled) return;
    unsubscribe = dbFns.onValue(dbFns.ref(db, `presence/${username}/connections`), (snap) => {
      const connections = snap.val() || {};
      const values = Object.values(connections).filter(Boolean);
      callback({
        online: values.length > 0,
        currentRooms: [...new Set(values.map((v) => v.currentRoom).filter(Boolean))],
        connections: values.length,
      });
    }, () => callback(null));
  });
  return () => { cancelled = true; unsubscribe(); };
}

function subscribeConnection(callback) {
  if (typeof callback !== "function") return () => {};
  connectionListeners.add(callback);
  callback(connected && (!session || presenceReady));
  return () => connectionListeners.delete(callback);
}

function subscribeRoom(roomRaw, callback) {
  const room = safeKey(roomRaw);
  if (!room || typeof callback !== "function") return () => {};
  let unsubscribe = () => {};
  let cancelled = false;
  readyPromise.then((ok) => {
    if (!ok || cancelled) return;
    const membersRef = dbFns.ref(db, `rooms/${room}/members`);
    unsubscribe = dbFns.onValue(membersRef, (snap) => {
      const raw = snap.val() || {};
      const members = Object.entries(raw).flatMap(([username, connections]) => {
        const first = Object.values(connections || {}).find(Boolean);
        return first ? [{ username, displayName: first.displayName || username, role: first.role || "visitor" }] : [];
      });
      callback({ count: members.length, members });
    }, () => callback(null));
  });
  return () => { cancelled = true; unsubscribe(); };
}

function subscribeRoomPlayers(roomRaw, callback) {
  const room = safeKey(roomRaw);
  if (!room || typeof callback !== "function") return () => {};
  let unsubscribe = () => {};
  let cancelled = false;
  readyPromise.then((ok) => {
    if (!ok || cancelled) return;
    unsubscribe = dbFns.onValue(dbFns.ref(db, `rooms/${room}/players`), (snap) => {
      const raw = snap.val() || {};
      const players = Object.entries(raw).flatMap(([username, connections]) => {
        const states = Object.values(connections || {}).filter(Boolean);
        if (!states.length) return [];
        states.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
        const newest = states[0];
        return [{
          username,
          displayName: newest.displayName || username,
          xPct: Math.max(4, Math.min(96, Number(newest.xPct) || 50)),
          direction: newest.direction === "left" ? "left" : "right",
          animation: ["idle", "walking", "running", "sleeping"].includes(newest.animation) ? newest.animation : "idle",
          sequence: Number(newest.sequence) || 0,
        }];
      });
      callback(players);
    }, () => callback([]));
  });
  return () => { cancelled = true; unsubscribe(); };
}

function subscribeRoomActions(roomRaw, callback) {
  const room = safeKey(roomRaw);
  if (!room || typeof callback !== "function") return () => {};
  let unsubscribe = () => {};
  let cancelled = false;
  const subscribedAt = Date.now() + serverTimeOffset;
  const seen = new Set();
  readyPromise.then((ok) => {
    if (!ok || cancelled) return;
    const recent = dbFns.query(actionsRef(room), dbFns.limitToLast(40));
    unsubscribe = dbFns.onChildAdded(recent, (snap) => {
      if (cancelled || seen.has(snap.key)) return;
      seen.add(snap.key);
      const raw = snap.val() || {};
      const createdAt = Number(raw.createdAt) || 0;
      const now = Date.now() + serverTimeOffset;
      if (createdAt < subscribedAt - 2500 || createdAt < now - ACTION_MAX_AGE_MS || createdAt > now + ACTION_FUTURE_TOLERANCE_MS || !ACTION_TYPES.has(raw.type)) return;
      const actor = safeKey(raw.actor);
      if (!actor) return;
      callback({
        id: snap.key,
        actor,
        displayName: String(raw.displayName || actor).slice(0, 32),
        type: raw.type,
        data: normalizeActionData(raw.data),
        createdAt,
      });
    }, () => callback(null));
  });
  return () => { cancelled = true; unsubscribe(); seen.clear(); };
}

function subscribeRoomChat(roomRaw, callback) {
  const room = safeKey(roomRaw);
  if (!room || typeof callback !== "function") return () => {};
  let unsubscribe = () => {};
  let cancelled = false;
  readyPromise.then((ok) => {
    if (!ok || cancelled) return;
    const recent = dbFns.query(chatRef(room), dbFns.orderByChild("createdAt"), dbFns.limitToLast(CHAT_HISTORY_LIMIT));
    unsubscribe = dbFns.onValue(recent, (snap) => {
      const now = Date.now() + serverTimeOffset;
      const raw = snap.val() || {};
      const messages = Object.entries(raw).flatMap(([id, value]) => {
        const actor = safeKey(value?.actor);
        const text = normalizeChatText(value?.text);
        const createdAt = Number(value?.createdAt) || 0;
        if (!actor || !text || createdAt < now - CHAT_MAX_AGE_MS || createdAt > now + ACTION_FUTURE_TOLERANCE_MS) return [];
        return [{
          id,
          actor,
          displayName: String(value.displayName || actor).slice(0, 32),
          text,
          createdAt,
        }];
      }).sort((a, b) => a.createdAt - b.createdAt);
      callback(messages);
    }, () => callback(null));
  });
  return () => { cancelled = true; unsubscribe(); };
}

function subscribeRoomTyping(roomRaw, callback) {
  const room = safeKey(roomRaw);
  if (!room || typeof callback !== "function") return () => {};
  let unsubscribe = () => {};
  let expiryTimer = null;
  let cancelled = false;
  let cached = {};
  const emit = () => {
    if (cancelled) return;
    const now = Date.now() + serverTimeOffset;
    const users = Object.entries(cached).flatMap(([username, connections]) => {
      const actor = safeKey(username);
      const states = Object.values(connections || {}).filter(Boolean);
      if (!actor || !states.length) return [];
      states.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
      const newest = states[0];
      const updatedAt = Number(newest.updatedAt) || 0;
      if (updatedAt < now - 8000 || updatedAt > now + ACTION_FUTURE_TOLERANCE_MS) return [];
      return [{ username: actor, displayName: String(newest.displayName || actor).slice(0, 32), updatedAt }];
    });
    callback(users);
    clearTimeout(expiryTimer);
    if (users.length) {
      const nextExpiry = Math.min(...users.map((user) => user.updatedAt + 8050 - now));
      expiryTimer = setTimeout(emit, Math.max(100, nextExpiry));
    }
  };
  readyPromise.then((ok) => {
    if (!ok || cancelled) return;
    unsubscribe = dbFns.onValue(dbFns.ref(db, `rooms/${room}/typing`), (snap) => {
      cached = snap.val() || {};
      emit();
    }, () => callback(null));
  });
  return () => { cancelled = true; clearTimeout(expiryTimer); unsubscribe(); };
}

window.Multiplayer = {
  enabled: typeof MULTIPLAYER_ENABLED !== "undefined" && MULTIPLAYER_ENABLED,
  ready: readyPromise,
  startSession,
  enterRoom,
  stopSession,
  subscribeUserPresence,
  subscribeConnection,
  subscribeRoom,
  subscribeRoomPlayers,
  subscribeRoomActions,
  subscribeRoomChat,
  subscribeRoomTyping,
  subscribeDirectInbox,
  subscribeDirectChat,
  publishMovement,
  emitAction,
  sendChatMessage,
  sendDirectMessage,
  markDirectChatRead,
  setTyping,
  get connected() { return connected && (!session || presenceReady); },
  get currentRoom() { return session ? session.currentRoom : null; },
  get serverNow() { return Date.now() + serverTimeOffset; },
  get lastInitError() { return initError; },
};
