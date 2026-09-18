# Mascotito Alpha

## v3.7

- Mascota grande y centrada verticalmente en la escena de creación/modificación, con proporciones cuadradas y tamaño adaptable a la ventana.
- Barra `.stage-actions-row` centrada con `width: 80%` únicamente durante la creación/modificación.
- Indicador de versión actualizado a Alpha v3.7.


Descomprimí y abrí index.html, o serví esta carpeta con un servidor estático. Conservá el mismo navegador y origen para mantener tu partida. Migra automáticamente el guardado anterior (versión interna 5), sin borrar pescado, monedas ni apariencia.

**Desde v3.3**, si configurás un proyecto de Firebase (ver la sección "v3.3" más abajo), el progreso deja de depender del navegador: se guarda en una cuenta (usuario + PIN) que podés abrir desde cualquier compu, y además se habilita un sistema de amigos. Si NO configurás nada, la app sigue funcionando exactamente igual que antes (guardado sólo en este navegador, sin login).

## v3.1

## Cambios
- Pesca animada: boya flotante, tanza, ondas, pez nadando, agitación al picar y salto del pescado al capturarlo. Respeta la preferencia de movimiento reducido.
- Selector «Juegos» con tarjetas verticales grandes, icono central y franja inferior con nombre. Al pasar por el nombre se despliegan instrucciones y Play hacia arriba. También funciona mediante foco de teclado y toque. Cerrar está abajo; en móvil las tarjetas se recorren horizontalmente.
- Modo prueba incorpora «Guardar cambios» y «Cancelar». Guardar conserva los parámetros y los persiste; cerrar o cancelar sin guardar restaura la partida. El texto del submenú explica ambas opciones.
- Nuevo SVG de pescado y cantidad directamente en Alimentar. El inventario queda por encima del dock, con separación medida de 12 px. El texto en negrita y subrayado «Conseguí más pescado» abre la tarjeta Pesca.
- Nuevo SVG de heces. Cada pescado consumido agrega una digestión pendiente: primera deposición a los 2 minutos, con al menos 1 minuto entre comidas adicionales. Se procesa en el siguiente tick del juego (hasta 15 segundos adicionales). No se generan nuevas heces sin comida pendiente.
- Cada deposición queda en la posición de la mascota, reduce 8 puntos de higiene y se guarda por lugar. Click o toque sobre las heces las retira. Se conserva la suciedad de Casa al visitar Jardín y viceversa.
- Cada resto sin limpiar acelera la pérdida de higiene y ánimo; la acumulación también acelera el malestar y puede enfermar a la mascota. Límite de 20 restos por lugar; las digestiones restantes esperan hasta que haya espacio. Limpiar elimina el deterioro adicional de ese resto.
- Al dormir, no acepta caricias, no habla ni mantiene el globo anterior. Los intentos de hablar, acariciar o salir muestran un aviso del sistema.
- Con ánimo al máximo dice «No quiero más caricias», sin otorgar recompensas.
- Notificaciones debajo del reloj: hambre, sed, higiene, energía y ánimo inferiores al 20%, además de enfermedad. Desaparecen al recuperarse la necesidad.
- Los resultados de minijuegos, premios, falta de stock, restricciones de acciones y demás mensajes del sistema van a notificaciones. Los saludos, pedidos y frases propias de la mascota permanecen en el globo. Los avisos temporales duran 12 segundos y tienen prioridad sobre la lista de necesidades.

## Validación
Pruebas de interfaz en Edge/Chromium con clicks y toque emulado, y comprobaciones de estado:
- Guardar hambre al 50%, cerrar y recargar; cancelar cambios y restaurar valores.
- Selector con hover y toque; Play de Pesca, Pelota y Luciérnagas, victoria y limpieza de temporizadores.
- Capturas de pesca sumadas al inventario; SVG y cantidad; consumo de alimento y posición del inventario respecto del dock.
- Alimentación → digestión → deposición → limpieza; ninguna deposición sin comida; conservación por lugar y tras recarga; efectos de acumulación sobre necesidades y enfermedad.
- Sueño: sin XP de caricias/charla ni globo; bloqueo de salida como notificación.
- Frase exacta con ánimo máximo; avisos de las cinco barras bajas y retiro al recuperarse.
- Revisión visual en escritorio, 390 y 320 px; sin desbordamiento horizontal de página.

La fuente web opcional no estuvo disponible durante las pruebas, que utilizaron la tipografía de respaldo. No se probaron dispositivos físicos ni Safari.

Sin excepciones JavaScript en los flujos probados. Sintaxis de todos los scripts validada.

## v3.2: notificaciones en 3 ventanas, ajustes de pesca/objetivos y ánimo acoplado a las demás necesidades

Esta ronda partió de un ZIP que mandaste con una actualización que no habías mostrado antes (v3.1 — pesca, minijuegos, inventario, notificaciones, objetivos diarios y economía, todo construido sobre lo entregado en v2.6). Pediste 5 arreglos puntuales sobre ese ZIP. Van todos, con dónde quedó cada uno.

**Notificaciones separadas en 3 ventanas.** Antes todo compartía una sola tarjeta debajo del reloj (#notification-card): las alertas de bienestar (necesidades bajo 20%, enfermedad) y los avisos puntuales del sistema (resultados de minijuegos, premios, sin stock, etc.) se mezclaban en la misma lista, sin forma de cerrarlos a mano. Ahora son 3 tarjetas apiladas verticalmente, cada una debajo de la anterior (se recalcula solo con `syncHudLayout()`, así una tarjeta vacía/oculta no deja un hueco): 1) las alertas de bienestar, igual que antes, sin botón de cerrar porque reflejan el estado actual, no un evento; 2) una tarjeta nueva y estática para "está durmiendo" (`#sleep-notice-card`), sin botón de cerrar ni temporizador — aparece sola al dormirse y desaparece sola al despertar; 3) una tarjeta nueva para el resto de los avisos puntuales (`#system-notice-card`), con un botón × para cerrarla a mano además de su desaparición automática de siempre a los 12 segundos.

**"No quedan pescados" → "No te queda más comida", sin botón de pesca.** Se sacó el botón "Conseguí más pescado" (`#feed-go-fishing`) del menú de Alimentar. Cuando no queda stock, `#food-stock` ahora muestra sólo texto (nada clickeable): "No te queda más comida. Jugá con &lt;nombre&gt; para conseguir más comida."

**Cooldowns de pesca aumentados.** Comer pescado no tenía cooldown propio (caía al genérico de 18s) — ahora tiene el suyo, 18s + 7min = 7m18s. Jugar a Pesca compartía el cooldown de 25s de todos los minijuegos ("jugar") — ahora tiene el suyo propio, 25s + 15min = 15m25s, sin tocar el cooldown de Pelota/Luciérnagas (siguen en 25s).

**Objetivos y recompensa tachados al cumplirse.** Cada objetivo del día ya se marcaba con un ✓ verde al completarse, pero el texto quedaba igual (`text-decoration:none`, aparentemente a propósito en algún momento). Ahora el texto de cada objetivo cumplido se tacha, y lo mismo la línea de "Recompensa" una vez que ya la cobraste (los 3 objetivos completos) — con su propia clase (`is-claimed`) para no confundirla con un objetivo individual.

**Se sacó la barra de Ánimo; el ánimo ahora depende del resto de las necesidades.** La placa de bienestar volvió a las 4 barras físicas de siempre (Hambre/Sed/Higiene/Energía) — el ánimo (felicidad, internamente) se sigue viendo, como pediste, sólo en el color del borde del círculo de `#wellbeing-avatar` (verde/amarillo/rojo, con la animación de pulso que ya tenía en estado crítico). Además, ahora el ánimo está acoplado al resto: se calcula el promedio de las 4 necesidades físicas y, por debajo de un umbral (60), el ánimo decae bastante más rápido con el tiempo cuanto peor esté ese promedio (hasta 3.5× más rápido con las 4 por el piso) y cualquier ganancia de ánimo (jugar, acariciar, hablar, comer, limpiar una mancha, medicina) rinde bastante menos (hasta un 25% de lo normal en el peor caso, nunca 0) — por encima de ese umbral el ánimo se comporta exactamente como antes. Centralicé toda ganancia de ánimo en una función (`gainFelicidad()`) para que el acoplamiento se aplique parejo en todos los puntos donde sumaba felicidad, en vez de tocar cada uno por separado.

**Verificado con navegador automatizado**: los 5 pedidos, confirmados tanto por lectura directa de estado/config como visualmente (capturas en escritorio y en mobile a 390px) — las 3 tarjetas de notificación apiladas sin huecos, con la tarjeta de "durmiendo" sin botón de cerrar y la del sistema con su × funcionando (cerrarla no afecta a las otras dos); menú de Alimentar sin el botón de pesca y con el texto nuevo cuando el stock es 0; cooldown real de 438000ms al comer pescado y de 924666ms al jugar a Pesca por la UI real (Pelota, jugado inmediatamente después, quedó con su cooldown de 25s de siempre, sin tocar el de Pesca); objetivos y recompensa con `text-decoration: line-through` confirmado por estilo computado al completarlos; placa de bienestar con las 4 barras de siempre y sin ninguna fila de Ánimo; `moodCouplingFactors()` devolviendo multiplicador 1 con las necesidades altas y 3.5/0.25 con las necesidades en 0, y una ganancia de +10 de ánimo rindiendo 10 completos con necesidades altas contra sólo ~3 puntos reales con necesidades bajas. Además, una prueba de extremo a extremo completa (crear mascota, comer, beber, limpiar, hablar, acariciar, dormir/despertar, navegar Casa↔Jardín, editar y cancelar) sin errores de consola, sobre el ZIP final ya empaquetado y servido desde cero.

## v3.3: cuenta en la nube (Firebase) + sistema de amigos, sobre la Casa interactiva

Pediste dos cosas para esta versión: una base de datos con Firebase que guarde todo, con login de sólo usuario + PIN (sin contraseña real, "es entre amigos"), y un sistema de amigos con solicitud de amistad. El ZIP de partida (`v3.2.1`) ya traía armada, con otra herramienta, una "Fase 1: Casa interactiva" (cama/plato/bebedero/sillón/pelota/lámpara clickeables dentro de la Casa, ver `CHANGELOG-v3.3.md`) — la revisé y la dejé como base de esta entrega tal como pediste, sin tocar su lógica; la sumé a un smoke test automatizado (los 6 objetos existen, la lámpara prende/apaga, el plato abre el menú de Alimentar, la pelota abre el selector de minijuegos, sin errores de consola) antes de construir la nube encima. Después, cuando habilitaste el proveedor de Google en tu proyecto de Firebase, agregué "Iniciar sesión con Google" como una segunda forma de entrar, a elección de cada uno — las dos conviven, nadie está obligado a usar una en particular.

### Qué hace

- **Dos formas de entrar, a elección.** Al abrir la app (con la nube configurada) aparece una pantalla con el login de siempre (usuario + PIN de 4 dígitos) y, debajo, el botón **"Iniciar sesión con Google"** como alternativa. Cada quien elige la que prefiera; ambas guardan la mascota en la misma nube y funcionan igual de bien con el sistema de amigos.
- **Cuenta por usuario + PIN de 4 dígitos.** Si el usuario no existe todavía, se crea ahí mismo con ese PIN — no hay un paso de "registro" separado, tal como pediste ("el login sería solo el nombre de usuario, no hace falta contraseña"). Elegiste que además pida un PIN de 4 dígitos (no sólo el nombre) para que nadie entre por error o a propósito a la cuenta de otro con sólo saber su nombre de usuario.
- **Cuenta con Google.** Al tocar "Iniciar sesión con Google" se abre el selector de cuenta de Google de siempre; la primera vez te pide elegir un nombre de usuario para Mascotito (sin PIN — tu cuenta de Google ya te identifica de verdad) y de ahí en más entra directo con sólo un click. A diferencia del PIN, acá Firestore verifica de verdad que sos vos (ver la nota de seguridad más abajo).
- **Guardado en la nube.** Tu mascota (apariencia, necesidades, inventario, monedas, digestión, objetos de la Casa, todo el mismo `state` de siempre) se guarda en Firestore además de en este navegador. Iniciar sesión con tu usuario desde otra compu trae tu mascota tal como quedó. El guardado a la nube se junta cada ~20 segundos como máximo (para no generar una escritura por cada tick) y se fuerza al instante al cambiar de pestaña o cerrar.
- **Sesión recordada.** Una vez que iniciás sesión en un navegador, se recuerda: no hace falta escribir el PIN de nuevo cada vez que abrís la app ahí. "Cambiar de usuario" (menú de Opciones, sólo visible con nube activada) cierra esa sesión y vuelve a pedir usuario+PIN.
- **Amigos.** Botón nuevo en el encabezado (ícono de personas, con un numerito rojo si tenés solicitudes sin ver). Tres pestañas: *Mis amigos* (con botón para quitar), *Solicitudes* (las que te mandaron, con Aceptar/Rechazar, y las que vos mandaste, con Cancelar) y *Agregar* (buscás por nombre de usuario exacto y mandás la solicitud). Se actualiza solo, sin recargar la página, apenas la otra persona responde.
- **Sin nube configurada, la app es idéntica a la v3.2.** Mientras no completes tu proyecto de Firebase (paso a paso abajo), no aparece ninguna pantalla de login ni el botón de Amigos — se sigue guardando sólo en este navegador, como siempre. Podés repartir esta carpeta así y activar la nube más adelante sin que nadie pierda su mascota local: la primera vez que alguien inicia sesión en una cuenta nueva, si esa compu ya tenía una mascota guardada localmente, se toma como punto de partida en vez de perderla.
- **"Reiniciar progreso"** ahora también borra la mascota guardada en tu cuenta de la nube (no sólo la local), para que no vuelva a aparecer al iniciar sesión de nuevo.

### Cómo crear tu proyecto de Firebase (una sola vez)

No hace falta saber nada de Firebase de antemano — son estos pasos, todos dentro de la consola web de Firebase con tu cuenta de Google:

1. Entrá a **console.firebase.google.com**, iniciá sesión con tu cuenta de Google y hacé click en **"Agregar proyecto"**. Ponele un nombre (por ejemplo `mascotito`) y seguí el asistente (podés desactivar Google Analytics, no hace falta para esto).
2. Dentro del proyecto, en el menú de la izquierda andá a **Compilación → Firestore Database** y hacé click en **"Crear base de datos"**. Elegí una ubicación (cualquiera cercana, ej. `southamerica-east1`) y arrancá en **modo producción** (no "modo de prueba" — las reglas de seguridad del paso 5 son las que van a proteger los datos igual).
3. Andá a **Compilación → Authentication**, hacé click en **"Comenzar"** y, en la lista de proveedores, activá **"Anónimo"** (Anonymous) — hace falta siempre, incluso si tus amigos sólo van a usar Google, porque es lo que deja a la pantalla de login "hablar" con la base de datos antes de que alguien se identifique. Si además querés ofrecer "Iniciar sesión con Google" (opcional), activá también el proveedor **"Google"** en esa misma lista — sólo tenés que elegir un mail de soporte del proyecto, Firebase se encarga del resto.
4. Andá a **Configuración del proyecto** (el ⚙️ junto a "Descripción general del proyecto") → pestaña **General** → sección **"Tus apps"** → ícono `</>` (Web) → registrá una app (el nombre que quieras, no hace falta el Hosting de Firebase). Te va a mostrar un objeto `firebaseConfig` con `apiKey`, `authDomain`, `projectId`, etc.
5. Abrí `js/firebase-config.js` en esta carpeta y reemplazá los 6 valores de ejemplo (`TU_API_KEY`, `TU_PROYECTO`, etc.) por los que te mostró Firebase en el paso anterior. Guardá el archivo.
6. Volvé a **Firestore Database → Reglas** en la consola de Firebase, borrá lo que haya y pegá el contenido completo de `firestore.rules` (está en esta misma carpeta) y hacé click en **"Publicar"**.
7. Listo — recargá `index.html` (o volvé a abrirlo) y ya debería aparecer la pantalla de usuario/PIN.

### Sobre la seguridad de este login (leer antes de usarlo con gente que no sea de confianza)

Las dos formas de entrar tienen niveles de protección distintos:

- **Usuario + PIN**: **no es autenticación real** — no hay backend propio de por medio, así que no hay forma de verificar el PIN sin que quien lo revise (las reglas de Firestore) pueda ser esquivado por alguien con conocimientos técnicos que inspeccione las peticiones de red del navegador. Lo que sí evita: que alguien entre "sin querer" a la cuenta de otra persona con sólo escribir su nombre de usuario en la app, y que un script simple escriba datos a ciegas sin conocer el PIN. El PIN se guarda siempre hasheado (SHA-256), nunca en texto plano.
- **Google**: acá sí hay autenticación real de Firebase — la cuenta guarda el `uid` que Google/Firebase verifica en cada pedido (no un valor que viaja en la petición y se pueda copiar), así que sólo esa persona puede modificar su mascota o los datos de su cuenta, sin el punto débil de arriba.

En ambos casos, el sistema de **amigos** (mandar/aceptar solicitudes) usa el mismo nivel liviano de protección: como no hay backend propio que arbitre esos mensajes, cualquier usuario autenticado puede escribir en el buzón de solicitudes de cualquier otro (nunca en su mascota ni en los demás datos de su cuenta), sea cuenta con PIN o con Google. Para un juego para jugar entre amigos de confianza es un techo de protección razonable — no sería bueno para nada que necesite guardar información sensible de verdad. El detalle completo está comentado al principio de `js/cloud.js` y en `firestore.rules`.

### Archivos nuevos de esta entrega

- `js/firebase-config.js`: dónde pegás las credenciales de tu proyecto de Firebase (con los 6 valores de ejemplo, la app arranca en modo sin nube).
- `js/cloud.js`: toda la lógica de nube (login/registro, guardado de la mascota, sistema de amigos) en un solo módulo — el resto de la app sólo llama a `window.Cloud.*`.
- `firestore.rules`: las reglas de seguridad para pegar en la consola de Firebase (paso 6 de la guía de arriba).

### Archivos modificados

- `index.html`: pantalla de login (usuario+PIN y "Iniciar sesión con Google", con el paso extra de elegir usuario la primera vez con Google), panel de Amigos, botón de Amigos en el encabezado, ítem "Cambiar de usuario" en Opciones.
- `js/app.js`: arranque de sesión (nube o local), guardado a la nube con demora (`scheduleCloudSave`/`flushCloudSaveNow`), toda la lógica de la pantalla de login (usuario+PIN y Google) y del panel de Amigos.
- `js/icons.js`: dos íconos nuevos (amigos, candado).
- `css/style.css`: estilos de la pantalla de login y del panel de Amigos, sobre la paleta ya existente.

### Validación realizada

Como no tenía un proyecto de Firebase real para probar (recién se crea siguiendo la guía de arriba), armé dos maneras de verificar esto de punta a punta sin inventar resultados:

- **Con la nube realmente inalcanzable** (el CDN de Firebase bloqueado de verdad en el entorno donde armé esto): confirmé que la pantalla de login igual aparece rápido, que un intento de login muestra "no se pudo conectar con la nube" con la opción de "seguir sin conexión", y que se puede seguir jugando en modo local sin errores — el camino real de manejo de errores de `js/cloud.js`, no un simulacro.
- **Con un "Firestore falso" (servidor propio + réplica exacta de la API de `window.Cloud`, sólo para probar, no se entrega)**, usando navegadores realmente separados (como dos compus distintas) contra el `index.html`/`js/app.js` reales: registro de usuario nuevo, PIN de 4 dígitos inválido rechazado, PIN incorrecto rechazado, recuperar la mascota guardada al volver a loguearse, sesión recordada tras F5 sin pedir login de nuevo, inicio de sesión desde una "compu" que nunca había jugado y trae la mascota guardada en la cuenta, "Reiniciar progreso" borrando también la mascota de la cuenta, y el flujo completo de amigos entre dos cuentas (buscar por usuario, enviar solicitud, verla aparecer en vivo del otro lado con el numerito de aviso sin recargar, aceptar, verse como amigos ambos lados, quitar amistad, y enviar+rechazar una segunda solicitud) — sin errores de consola en ninguno de los dos navegadores. También revisión visual en escritorio y en 390px (login, panel de Amigos con sus 3 pestañas, búsqueda sin resultados).
- La Casa interactiva del ZIP de partida se sometió a un smoke test aparte (los 6 objetos se renderizan, lámpara prende/apaga, plato abre Alimentar, pelota abre el selector de minijuegos) para confirmar que seguía sana antes de construir la nube encima — no se tocó su código.

No se probó contra un proyecto de Firebase real (no tengo una cuenta de Google para crear uno) ni en dispositivos físicos o Safari — si algo no coincide exactamente una vez que crees tu proyecto siguiendo la guía de arriba, avisame con el mensaje de error que te aparezca.

**Sobre "Iniciar sesión con Google" en particular**: esto lo agregué después, cuando me contaste que ya habías activado ese proveedor en tu proyecto. No hay forma de probar el popup real de Google desde acá (necesita una cuenta de Google de verdad haciendo click en un diálogo del navegador, algo que no puedo automatizar), así que esta parte se armó con más cuidado en el diseño de las reglas de `firestore.rules` (revisadas a mano más de una vez, incluyendo el caso de "cómo le mando una solicitud de amistad a alguien que entró con Google si yo no soy el dueño de esa cuenta") pero sin una prueba de punta a punta como la de arriba. Si al probarlo te aparece algún error al tocar el botón de Google, mandame el mensaje exacto (o lo que diga la consola del navegador, F12 → Consola) y lo reviso.
