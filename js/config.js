/**
 * v3.6 (pedido explícito): "esta versión sería la v3.6... cambiar eso en
 * los códigos ya que sigue marcando v3.3 (tener en cuenta para versiones
 * futuras también)". Antes el número de versión estaba escrito a mano en
 * varios lugares (título de la pestaña, el badge del encabezado y el pie
 * de página) y ninguno se había actualizado desde v3.3 — de ahí el bug.
 * Ahora es UNA sola constante acá: para la próxima versión sólo hace
 * falta cambiar este string, todo lo demás (título, badge, pie de
 * página) se pinta solo desde acá (ver applyAppVersion() en js/app.js).
 */
const APP_CHANNEL = "Beta";
const APP_VERSION = "4.2.6";

/**
 * Configuración de la jugabilidad. TODO lo que se puede ajustar para
 * balancear la Fase 2 (Cuidado — ALPHA v2 · Tamagotchi) vive acá: cuánto
 * baja cada necesidad, cuánto suma cada acción, ventanas de tiempo,
 * umbrales de enfermedad, tiempos de sueño, vínculo, etc. Nada de esto
 * está desparramado en app.js — si algo se siente muy rápido/lento/
 * generoso/tacaño, este es el archivo a tocar.
 */
const PET_CONFIG = {
  storageKey: "petLaburoAlphaState",

  // Cada cuántos milisegundos se recalculan las necesidades mientras la
  // app está abierta en la pestaña (además, al volver de segundo plano o
  // de estar cerrada, se recalcula todo de una según el tiempo real que
  // pasó — ver applyDecay en js/state.js).
  tickIntervalMs: 15000,

  // ---------- Necesidades principales (0-100, bajan solas con el tiempo) ----------
  // "saciedad"/"hidratacion"/"higiene" son las mismas 3 necesidades de la
  // etapa anterior (hambre/sed/limpieza), sólo que ahora se muestran con
  // esta terminología (pedido explícito: "una barra llena de 'Saciedad'
  // significa que está alimentada"). "energia" es nueva de esta etapa.
  // Los números de decaimiento son los mismos de siempre para las tres
  // viejas (hambre ~30hs, sed ~24hs, limpieza ~48hs de 100 a 0);
  // "energia" decae parecido a la hidratación mientras está despierta,
  // pero se RECUPERA en vez de decaer mientras duerme (ver sleep.* abajo).
  // v3.5 (pedido explícito): "aumentar bajada de necesidades: el hambre
  // debería bajar un 200% más rápido que lo de ahora, la sed un 400%, la
  // higiene 100%, y la energía 150%." Es decir, multiplicadores ×3/×5/×2/
  // ×2.5 respectivamente sobre los valores base de siempre (felicidad NO
  // se toca, no la menciona el pedido). Esto solo cambia la TASA — el
  // "tiempo tiene que seguir corriendo estando offline" ya lo hacía
  // applyDecay() desde siempre (usa el tiempo real transcurrido desde
  // state.lastUpdate, no ticks fijos), así que no hace falta tocar esa
  // lógica para que el descuento offline sea igual que estando online sin
  // hacer nada.
  decayPerMinute: {
    saciedad: 0.0556 * 3, // hambre 200% más rápido → ×3
    hidratacion: 0.0694 * 5, // sed 400% más rápido → ×5
    higiene: 0.0347 * 2, // higiene 100% más rápido → ×2
    energia: 0.0556 * 2.5, // energía 150% más rápido → ×2.5
    // Felicidad no es "una necesidad que se atiende con una acción única"
    // como las de arriba — sube con cuidados variados (jugar, golosinas,
    // caricias, hablar) y baja sola despacio si hay abandono/aburrimiento/
    // suciedad/enfermedad. Decae lento a propósito: no queremos que sea
    // una barra más para perseguir todo el tiempo.
    felicidad: 0.0231, // 100/(72*60), ~3 días de 100 a 0 sin ningún cuidado
  },

  // Mientras duerme, las necesidades siguen evolucionando pero más
  // despacio (pedido explícito: "las demás necesidades continúan
  // evolucionando a ritmos apropiados") — este multiplicador se aplica
  // sobre decayPerMinute de arriba para saciedad/hidratacion/higiene/
  // felicidad. La energía usa su propia tasa de RECUPERACIÓN (ver abajo),
  // no este multiplicador.
  sleep: {
    decayMultiplier: 0.35,
    energiaRecuperaPerMinuto: 0.5556, // 100/(3*60): llena en ~3hs durmiendo
    // Con esto lleno no hace falta seguir "durmiendo" — igual el jugador
    // decide cuándo despertarla (no hay despertar automático obligatorio,
    // pedido explícito), esto es sólo para que updateMood sepa que ya
    // descansó del todo si quiere mostrar algo distinto.
    energiaLlenaUmbral: 97,
  },

  // ---------- Alimentar: 3 tipos, gratis, sin inventario ----------
  // Cada uno pega distinto (pedido explícito): comida básica llena sobre
  // todo saciedad y algo de energía; snack es un recuperación moderada +
  // ánimo; golosina mejora más la felicidad pero alimenta poco, y su
  // ABUSO (ver golosinaExceso abajo) puede traer malestar.
  feeding: {
    pescado: { label: "Pescado", emoji: "🐟", saciedad: 30, energia: 6 },
  },
  // Si ya está prácticamente llena (saciedad por encima de esto), comer
  // no hace nada — pedido explícito: "mostrá una reacción o mensaje
  // comprensible cuando no necesite más comida" en vez de dejar que sume
  // sin límite. beber/bañar usan el mismo criterio contra sus propias
  // necesidades (ver llenaUmbral más abajo, es el mismo valor para todas).
  llenaUmbral: 97,

  // Ventana de tiempo (no un contador que se acumula para siempre) para
  // detectar abuso de golosinas: si en los últimos windowMs comiste
  // avisoEn golosinas, se muestra una advertencia; si llegás a
  // malestarEn, además de la advertencia se dispara un golpe de malestar
  // (ver health.golosinaExcesoGolpe) y se explica la causa.
  golosinaExceso: {
    windowMs: 30 * 60 * 1000, // 30 minutos
    avisoEn: 3,
    malestarEn: 5,
  },

  // ---------- Beber / Bañar: siguen siendo una sola acción cada una ----------
  actionGain: {
    beber: { hidratacion: 32 },
    bañar: { higiene: 40 },
  },

  // ---------- Limpiar el espacio (retirar manchas/desechos) ----------
  clean: {
    maxDirtItems: 20,
    // Probabilidad por tick (cada tickIntervalMs) de que aparezca una
    // mancha nueva, si todavía no se llegó a maxDirtItems — sólo si la
    // higiene ya está resentida (no aparecen de la nada con la mascota
    // recién bañada). Gradual y con techo, pedido explícito.
    spawnChancePorTickBajo: 0.05, // higiene < 55
    spawnChancePorTickMuyBajo: 0.16, // higiene < 25
    higieneUmbralBajo: 55,
    higieneUmbralMuyBajo: 25,
    // Retirar una mancha con un click da un empujoncito chico — no
    // reemplaza al baño (que limpia a la mascota, no el espacio).
    higienePorRetiro: 4,
    felicidadPorRetiro: 2,
  },

  // ---------- Jugar (actividad de "atrapar el juguete") ----------
  play: {
    energiaCosto: 12,
    felicidad: 14,
    vinculo: 6,
    // Si la energía está por debajo de esto, ni arranca el juego — avisa
    // en vez de dejar jugar igual (pedido explícito, sección 4 y 6).
    energiaMinimaParaJugar: 18,
    // Cuánto tiempo (ms) queda visible el juguete antes de irse solo si
    // no lo tocás — repetible, cooldown propio como las demás acciones.
    juguetesVisibleMs: 2600,
  },

  // ---------- Afecto: acariciar / hablar ----------
  affection: {
    acariciar: { felicidad: 4, vinculo: 5 },
    hablar: { felicidad: 2, vinculo: 3 },
  },

  // ---------- Salud / enfermedad leve ----------
  // No hay enfermedades random: "malestarProgress" (0-100, interno, no se
  // muestra como número crudo) sube sólo mientras una causa sostenida
  // sigue activa, y baja solo con el tiempo si las causas se resuelven.
  // Llega a 100 -> "enferma". Con tratamiento (medicina) + descanso +
  // necesidades atendidas, vuelve a bajar hasta curarse.
  health: {
    higieneEnfermaUmbral: 20, // higiene sostenida por debajo de esto suma malestar
    necesidadEnfermaUmbral: 15, // saciedad/hidratación sostenidas por debajo de esto suman malestar
    // Puntos de malestar por MINUTO mientras una causa está activa —
    // calculado para que haga falta más de 2 horas de UNA sola causa
    // sostenida (no un bajón momentáneo) para enfermarse.
    malestarPorMinutoPorCausa: 100 / 150,
    // Golpe puntual (no goteo) cuando se cruza el umbral de abuso de
    // golosinas (ver golosinaExceso arriba) — se suma una sola vez por
    // "racha", no una vez por golosina.
    golosinaExcesoGolpe: 25,
    // Recuperación natural (sin hacer nada, sin estar enferma) — muy
    // lenta, así una bajada momentánea no se "cura sola" al toque pero
    // tampoco queda pegada para siempre si nunca se repite.
    recuperacionNaturalPorMinuto: 100 / 600, // ~10hs para bajar 100 puntos solo
    // Umbral por debajo del cual, si estaba enferma, se considera curada.
    curadaUmbral: 12,
    // Cuánto malestar saca cada uso de la medicina (con cooldown propio,
    // ver cooldownsMs.medicina) — no cura instantáneo ni llena otras
    // barras, y repetirla no acelera la cura más de lo que ya hace un uso.
    medicinaAlivio: 35,
  },

  // ---------- Vínculo ----------
  // Crece con cuidados variados (cada acción de cuidado/afecto suma un
  // poco, ver los bloques de arriba) y NO decae por ausencia. El "nivel"
  // es sólo una forma linda de mostrarlo (como en las referencias que
  // mandaste) — cada nivel pide un poco más que el anterior.
  bond: {
    xpPorNivel: 50,
  },

  // ---------- Sueño / ánimo / urgencia ----------
  // Umbrales para el estado de ánimo general, calculado como promedio de
  // las 4 necesidades físicas (saciedad/hidratación/higiene/energía) —
  // igual criterio que antes, ahora con una necesidad más. "Crítico" se
  // dispara si CUALQUIERA de esas 4 (o la felicidad) está muy baja, no
  // sólo por el promedio (mismo criterio que ya existía, extendido).
  mood: {
    feliz: 70,
    normal: 35,
    critico: 15,
  },

  // ---------- Acoplamiento del ánimo con las demás necesidades ----------
  // v3.2, pedido explícito: "que el ánimo baje mucho más rápido cuando
  // las barras de las demás necesidades están bajas y cueste subir el
  // ánimo si estas siguen bajas". Se mide el promedio de las 4
  // necesidades físicas (saciedad/hidratación/higiene/energía) y, por
  // debajo de umbralNecesidades, se interpola entre "sin efecto" (esas 4
  // están bien) y "efecto máximo" (las 4 por el piso) — ver
  // moodCouplingFactors() en js/state.js, usada tanto en el decaimiento
  // por tiempo (applyDecay) como en cada ganancia de ánimo (gainFelicidad
  // en js/app.js).
  moodCoupling: {
    // Por encima de este promedio, el ánimo se comporta como siempre
    // (multiplicador 1 en ambos sentidos) — el efecto sólo se nota
    // cuando el resto la está pasando mal de verdad.
    umbralNecesidades: 60,
    // Con el promedio en 0, el decaimiento del ánimo por minuto llega a
    // multiplicarse hasta por esto (bastante más rápido que el ritmo
    // normal de decayPerMinute.felicidad).
    decayMultiplierMax: 3.5,
    // Con el promedio en 0, cualquier ganancia de ánimo (jugar, acariciar,
    // hablar, comer, limpiar una mancha, medicina) rinde sólo esta
    // fracción de lo normal — nunca llega a 0, siempre entra algo.
    gainMultiplierMin: 0.25,
  },

  // Umbral de energía por debajo del cual se considera "muy cansada"
  // (dejar de correr, pedir dormir — pedido explícito sección 9).
  energiaCansadaUmbral: 35,
  energiaMuyCansadaUmbral: 15,

  // ---------- Pedidos espontáneos ("¿Jugamos?", "Necesito un mimo") ----------
  // v2.5: pedido explícito — "el tiempo de repetición va acortándose
  // dependiendo de qué tan baja esté esa necesidad". Ya no es una sola
  // probabilidad/espera fija: cada necesidad floja tiene una "urgencia"
  // de 0 (recién cruzó el umbral de mencionarse) a 100 (en cero), y esa
  // urgencia interpola entre el par "mild" (necesidad apenas floja, casi
  // no dice nada) y el par "urgente" (necesidad en el fondo, lo repite
  // seguido) — ver requestUrgencyFor()/maybeShowRequest en js/app.js.
  requests: {
    // Cada cuánto (ms) se evalúa si corresponde mostrar un pedido —
    // no es que aparezca cada vez que se cumple esta demora, es sólo
    // cada cuánto se vuelve a tirar la moneda (probabilidad, ver abajo).
    checkIntervalMs: 15000,
    // Probabilidad por chequeo, en el extremo MENOS urgente de la escala
    // (la necesidad recién empezó a estar floja).
    probabilidadPorChequeo: 0.12,
    // Probabilidad por chequeo en el extremo MÁS urgente (necesidad en 0,
    // o mientras está enferma).
    probabilidadPorChequeoUrgente: 0.85,
    // No pedir de nuevo antes de que pase este tiempo desde el último
    // pedido (mostrado o no) — extremo menos urgente: se siente espaciado,
    // no insistente.
    minGapMs: 90 * 1000,
    // Extremo más urgente: casi no espera, lo repite seguido.
    minGapMsUrgente: 18 * 1000,
    // Urgencia fija asignada a "está enferma" (no es un stat de 0-100,
    // así que no escala solo — un valor fijo, bastante alto).
    urgenciaEnferma: 85,
    burbujaVisibleMs: 5000,
  },

  // ---------- Ausencia / tiempo real ----------
  // Si volvés después de mucho tiempo, estos límites evitan que la
  // ausencia "explote" el estado: no se acumula suciedad ni malestar sin
  // techo, y la felicidad no cae del todo sólo por no haber entrado.
  absence: {
    saludoCariñosoDesdeMs: 2 * 60 * 60 * 1000, // 2hs
    maxManchasNuevasPorRegreso: 2,
    maxMalestarPorRegreso: 40,
    felicidadPisoPorAusencia: 35,
  },

  // ---------- Cooldowns por acción (ms) ----------
  // Después de usar una acción, ese control queda deshabilitado este
  // tiempo — evita clics repetidos para sacar beneficio ilimitado
  // (pedido explícito en varias secciones).
  cooldownsMs: {
    comidaBasica: 18000,
    snack: 18000,
    golosina: 18000,
    // v3.2, pedido explícito ("aumentar el cooldown de comer pescado por
    // 7m"): antes no tenía cooldown propio, caía al genérico de 18s
    // (cooldownMs, más abajo) — ahora 18s + 7min = 438000ms.
    pescado: 438000,
    beber: 18000,
    bañar: 20000,
    jugar: 25000,
    // v3.2, pedido explícito ("el de jugar a pescar por 15m"): antes la
    // Pesca compartía el cooldown genérico de minijuegos (jugar, 25s) con
    // Pelota/Luciérnagas — ahora tiene el suyo propio, sumando 15min a
    // esos mismos 25s (25s + 15min = 925000ms). Pelota/Luciérnagas siguen
    // usando "jugar" (25s) sin cambios. Ver el handler de #game-play en
    // setupGameSelector() (js/app.js), que elige la clave según el
    // minijuego seleccionado.
    pesca: 925000,
    acariciar: 9000,
    hablar: 9000,
    medicina: 60000,
  },
  // Alias retro-compatible: el cooldown "clásico" de las 3 acciones de
  // El Edén (usado también como referencia visual del anillo).
  cooldownMs: 18000,

  // Pedido explícito: moscas alrededor de la mascota cuando está sucia
  // (higiene personal baja — no confundir con las manchas del entorno,
  // que son otra cosa, ver clean.* arriba).
  moscas: {
    higieneUmbral: 35,
  },

  // ---------- Navegación Casa/Jardín (sección 4, v2.1) ----------
  // Al usar la puerta (o el botón equivalente), la mascota primero CAMINA
  // hacia la salida y recién después cambia de escenario con una
  // transición breve — pedido explícito, para que se sienta como "salir
  // por la puerta" en vez de un corte seco. reduced-motion usa la
  // alternativa reducida (walkMs en 0, sólo queda el fade).
  navigation: {
    walkToExitMs: 550, // cuánto tarda en caminar hasta la puerta antes de cambiar de lugar
    walkToExitMsReducedMotion: 0,
    transitionMs: 320, // fade de cambio de escenario (dentro del rango 250-400ms pedido)
    transitionMsReducedMotion: 120,
  },
};
