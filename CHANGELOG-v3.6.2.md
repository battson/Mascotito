# Mascotito Alpha v3.6.2

Esta versión parte de la v3.6 y resuelve un pedido puntual: unificar la
pantalla de Creación/Edición de mascota con la pantalla de juego, y
rediseñar por completo el selector de partes/colores de esa pantalla.

## Qué se pidió

1. Que `#stage-floor` sea multiuso (Casa, otras localizaciones y también
   la edición de la mascota), todo en una sola ventana de juego.
2. Rediseñar la pantalla de Creación/Edición:
   - El selector de partes, igual a la ventana de acciones cuando jugás
     (`.stage-actions-row`).
   - Las partes con color por defecto azul (el mismo azul del selector de
     colores).
   - Pestañas de categoría (Color, Cabeza, Orejas, Ojos, etc.) arriba del
     selector.
   - Dentro de cada pestaña, si esa categoría tiene color propio (hoy sólo
     Ojos), las partes van a la izquierda (80%) y los colores en cuadrados
     chiquitos a la derecha (20%). Las categorías sin color propio siguen
     mostrando sólo partes, como antes.
   - El nombre también dentro de la ventana de la mascota — nada afuera
     salvo el encabezado (nav).

## Qué se hizo

- **Una sola ventana de juego**: la vieja pantalla `#onboarding` (un
  `<main>` aparte, separado del juego) desaparece. Todo lo que antes vivía
  ahí — emblema/título, nombre, mascota en vista previa, pestañas de
  categoría, Aleatorio, Guardar/Cancelar — pasa a vivir dentro de
  `#stage-floor`, la misma ventana donde se juega en Casa. Los elementos
  "de juego" (dock de acciones, tarjetas de Estado/Objetivos, notificaciones,
  minijuegos, etc.) se marcaron con una clase `play-only`, y los nuevos "del
  editor" con `editor-only`; una sola clase de estado
  (`#stage-floor.is-editing`) decide cuáles se ven, sin tocar la lógica
  propia de cada uno. El encabezado (nav) sigue siendo lo único que queda
  afuera, y sólo se oculta mientras se crea una mascota por primera vez —
  igual que siempre.
- **Selector de partes/colores igual al dock de acciones**: en vez de
  reconstruir ese look aparte, se reutiliza el mismo contenedor
  `#stage-actions-row` para el modo edición, y cada opción (parte o color)
  se arma con la misma estructura que los botones de Alimentar/Beber/etc.
  (`.action-circle-wrap` > `.cooldown-ring` > `.action-circle`). Así el
  selector queda pixel-igual al dock, incluidos sus mismos breakpoints
  responsive, sin duplicar ningún estilo.
- **Color por defecto azul en las miniaturas de partes**: antes usaban el
  primer color de la lista (Blanco cálido), ahora usan el segundo (Azul
  cielo, `#6CB9DD`) — el mismo tono que ya se ve en la pestaña Color.
- **Pestañas arriba del selector**: nueva fila (`#creator-tabs-row`) con
  las 7 categorías, que flota justo arriba del selector de partes/colores
  (mismo criterio que ya usaba el menú de Alimentar para flotar arriba del
  dock) y lleva ahí mismo los botones de Guardar/Cancelar.
- **Partes 80% / colores 20%**: cuando la categoría activa tiene partes Y
  color (hoy sólo Ojos), ambas conviven a la vez en la misma fila con esa
  proporción; ya no hace falta elegir entre una sub-pestaña "Selección" o
  "Color" como en la v3.6. Las categorías sin color propio (Cabeza,
  Orejas, Nariz, Boca, Cejas) siguen mostrando sólo partes al 100%, como
  pedía el punto "como ahora". La pestaña "Color" (color de todo el
  cuerpo) muestra sólo cuadraditos de color al 100%, sin fila de partes.
- **Nombre dentro de la ventana**: el campo Nombre pasa a una tarjeta
  propia (`#editor-name-card`), arriba a la izquierda de `#stage-floor`,
  visible durante toda la creación/edición.

## Dos bugs reales encontrados y arreglados verificando con Playwright

- El contenedor de partes (80%) no respetaba su ancho asignado cuando
  tenía más opciones de las que entraban (con scroll horizontal propio):
  como todo flex-item con `overflow-x:auto` necesita `min-width:0` para
  no crecer más allá de su `flex-basis`, sin ese ajuste invadía el lado de
  los colores y tapaba sus clics.
- El primer cuadradito de color de cada fila quedaba, en ciertos casos,
  dibujado fuera de su propio contenedor (encima del selector de partes,
  sin poder hacerle clic): con `overflow-x:auto` y `justify-content:center`
  heredado, cuando el contenido es más ancho que la caja el navegador
  arranca a dibujar antes del borde izquierdo, en una zona de scroll
  negativo inalcanzable. Se corrigió con `justify-content: safe center`
  (con `flex-start` como respaldo), el mismo patrón que ya usaba el viejo
  selector de partes de la v3.6 para este problema.

## Decisiones tomadas sin pedido explícito (para que las revises)

- La indicación de "seleccionado" en los tiles de partes/colores reutiliza
  el mismo lenguaje visual del dock (el subrayado naranja que aparece al
  pasar el mouse), ahora dejado prendido de forma permanente en la opción
  elegida, en vez del recuadro/fondo que tenía el selector viejo.
- Los cuadraditos de color miden 40px (34px en mobile) — bien más chicos
  que los tiles de partes (92px, como el dock), buscando el efecto
  "cuadrados chiquitos" pedido.
- La mascota en vista previa (`#preview-stage`) se mantuvo como elemento
  aparte de la mascota del juego (`#game-stage`/`#walker`) en vez de
  fusionar ambas — mismo criterio que ya usaba la app antes — para no
  arriesgar la animación de caminata/idle ya afinada.
- El emblema/título grande sólo aparece al crear una mascota por primera
  vez (no al editar una ya creada) y el botón Cancelar sólo aparece al
  editar — se mantuvo el mismo criterio que ya existía antes de esta
  versión.
- La clase `creator-tab`/`creator-tabs` (compartida con las pestañas del
  panel de Amigos) no se tocó ni se reutilizó — las pestañas nuevas usan
  una clase propia (`editor-tab`/`editor-tabs`) para no arriesgar ese otro
  panel, que no tiene nada que ver con este pedido.

## Archivos modificados

- `index.html`
- `css/style.css`
- `js/app.js`
- `js/config.js` (número de versión: 3.6 → 3.6.2)

## Validación realizada

Verificado con navegador automatizado (Playwright), sin errores de
consola, en escritorio (1400×900) y mobile (390×844):

- Creación de una mascota desde cero: las 7 pestañas, el split 80/20 en
  Ojos (con clic real en una parte y en un color), Aleatorio, validación
  de nombre, y Crear mascota.
- Edición de una mascota ya creada: encabezado visible, título "Editá tu
  mascota", botón Cancelar visible, cambiar una parte y Cancelar (se
  descarta el cambio, se vuelve al juego normal sin nada del editor
  colgado), volver a editar y Guardar cambios (el cambio persiste).
- Juego normal después de crear/editar: dock de acciones, tarjetas de
  Estado/Objetivos y la mascota en Casa, sin ningún resabio del editor.
- Los dos bugs de layout de arriba, confirmados con las coordenadas reales
  de los elementos antes y después del arreglo.
