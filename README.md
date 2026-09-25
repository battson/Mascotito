# Mascotito Beta

## Beta v4.6 — Jugar

- **Ventana de juegos nueva**, con el estilo de la ficha: crema con borde verde, título tipo moneda, tarjetas ilustradas y botones amarillos «Jugar». Cada tarjeta muestra si está disponible (partidas de pesca que quedan hoy o espera de Penales).
- **Pesca rehecha:** laguna ilustrada. Esperás a que pique, tocás ¡Tirar! y después frenás la aguja en la zona verde para sacar el pescado; la zona se achica con cada pescado. Hasta 3 pescados en 30 s y 3 partidas por día (cada inicio cuenta, aunque se cancele). Los pescados van al inventario.
- **Penales (nuevo):** cinco tiros. La mira se frena primero a lo ancho y después a lo alto; el arquero se tira a un lado. Puede ser gol, atajada, palo o afuera. Se gana con 3 goles. Comparte la espera de Jugar (25 s).
- **Se retira Caza de luciérnagas.**
- **Pantalla de resultado:** puntaje y lo ganado (monedas, pescados, felicidad, experiencia y energía gastada), con «Otra vez» y «Salir». Las recompensas usan el mismo cálculo de antes hasta definir la economía en v4.7.
- Escape cancela la partida o cierra el resultado/selector. Enter no abre el chat mientras la ventana de juegos está abierta.
- Código: todo Jugar vive en `js/games.js` y `css/games.css`; se quitaron de `app.js` y `style.css` las reglas y funciones de los minijuegos anteriores.

## Preparación de la v4.6 (teclado, selección de texto y acariciar)

- Roadmap hasta la última Beta (v4.9) en [PENDIENTES.md](PENDIENTES.md).
- Enter durante el juego dirige al chat disponible y no vuelve a pulsar el último botón enfocado. Los campos de formularios mantienen su funcionamiento nativo.
- No se selecciona texto accidentalmente en el escenario; el historial del chat del celular y los campos de entrada permiten seleccionar/copiar texto.
- Se retira acariciar, incluyendo sus recompensas de felicidad/XP y cooldown. El ánimo, sus expresiones y las recompensas de otras actividades se conservan.
- Inicio de consolidación gradual: reglas de interacción en `js/game-interactions.js` y `css/game-interactions.css`.

## Beta v4.5.4 — Barra de chat y ficha sin hojas

- **Globo de charla** con borde marrón de 2px; la colita también lleva borde.
- **Barra del chat de la sala (casa)** nueva, vectorizada del arte sin el ícono de la izquierda ni las hojas: `assets/ui/chat/barra.svg` (marco que se estira), `campo.svg` (campo de texto) y `enviar.svg` (botón con hover y efecto al presionar). Se ve siempre; sin activar muestra «Presioná Enter para hablar…» dentro del campo. Las medidas salen del arte (`--u = alto / 314`). El chat del celular queda como estaba.
- **Ficha del personaje** sin las hojas de arriba a la izquierda; el contorno se completó donde estaban. Mismo tamaño y recortes, así que todo lo demás queda igual.

## Beta v4.5.3 — Ropa, placas y globos

- **Vestimenta alineada otra vez:** el arreglo del trazo negro (v4.5.2) renombraba todos los ids de las prendas, incluidos los que usa la alineación (`#ropa-brazo-*`, `#ropa-calzado-*`). Ahora sólo se renombran los ids referenciados (recortes, máscaras, filtros, degradados): mangas centradas y la base del calzado coincide con la de las piernas, sin volver el trazo negro.
- **Placa de nombre de las otras mascotas** justo debajo de su calzado (en %, acompaña cualquier tamaño).
- **Globo de charla más redondo:** `border-radius: 50%` y `padding: 8% 8%`, también en los globos de las mascotas visitantes.

## Beta v4.5.2 — Visitas y armario

- **Sin la ventana «De visita»:** al visitar, arriba al centro aparece el nombre del lugar («Casa de …») con el mismo estilo que el contador de monedas y, debajo, la **puerta abierta** (`assets/ui/puerta.svg`) para volver a casa: poca opacidad en reposo, 100 % al pasar el mouse y se achica un poco al presionarla. El estado de conexión queda para lectores de pantalla.
- **Placa del jugador** (`assets/ui/placa_player.svg`, exportada del .ai) para el dueño de la casa visitada y los demás jugadores de la sala: nombre y punto a la derecha (verde en línea, gris si no). Se estira con nombres largos sin deformarse (extremos con orejitas fijos, tramo del medio elástico).
- **Armario nuevo** (`assets/ui/wardrobe/armario.svg`, exportado del .ai): la mascota apoya en la tarima pintada del arco y las prendas caen en las 6 celdas del dibujo. Misma lógica de prueba, Guardar y Cancelar.
- **Arreglo del trazo negro** en pantalones y zapatos de otras mascotas: cada copia de una prenda usa ids propios para sus recortes, máscaras y filtros. Antes, si la primera copia del documento estaba oculta (por ejemplo, la mascota del amigo en la lista del celular cerrado), las demás copias se dibujaban rotas hasta abrir el celular.

## Beta v4.5.1 — Ajustes de la ficha

- Se quitó el sistema de **Objetivos** (tarjeta y premios). `state.daily` se conserva sólo para las 3 partidas diarias de Pesca.
- **Tienda deshabilitada** hasta su rediseño: el botón queda atenuado («Tienda (próximamente)») y el vestidor ya no ofrece «Ir a la tienda».
- La flecha de plegar la ficha y la × de las notificaciones quedan centradas en su círculo y su pastilla (el mínimo táctil de 44 px las estiraba hacia abajo). La × ahora es un SVG.
- Vestidor: íconos nuevos para Piernas (pantalón), Calzado (zapatos) y Accesorios (anteojos), vectorizados desde los PNG (fondo negro quitado) en `assets/ui/wardrobe/`.

## Beta v4.5 — Ficha del personaje

- **Ficha nueva** según `Referencia_ficha.png`: marco vectorial (`assets/ui/ficha/ficha.svg`, convertido de `ficha.png` sin los rellenos de muestra), mini-foto con el aro de ánimo, nombre, **«Nv. X» y barra de XP** (se mudaron desde el encabezado) y cuatro celdas con ícono, nombre, % y barra.
- **Íconos nuevos** en SVG: comedero (Hambre), gota (Sed), esponja con burbujas (Higiene) y rayo (Energía).
- **Plegable:** la flecha del círculo de la derecha oculta y muestra las necesidades con una transición; la flecha gira y las notificaciones acompañan. Se recuerda en el navegador. El marco se arma con tres cortes del mismo SVG (cabecera, necesidades y base), así se pliega sin deformarse.
- **Notificaciones en burbuja** (forma de `notificaciones.png` redibujada en SVG limpio, con el fondo editable): alertas de necesidad con su ícono; «… está durmiendo» con luna y «zzz» sobre #eef1f6; avisos del sistema con un ícono de información y la × para cerrar.
- El encabezado ya no muestra nivel ni XP.
- Pantalla del celular con sombra interna (`box-shadow: inset #0000005c -1px -8px 9px`).
- El punto de conexión (v3.5) sigue al lado del nombre.
- Assets reproducibles con `scripts/vectorize-ficha-assets.py`.

## Beta v4.4.6 — Ajustes del celular

- El marco del celular (`.phone-frame-art`) va con `z-index: 10`, siempre por encima de la pantalla.
- La pantalla (`.phone-screen`) ya no fija su propio `top`/`bottom` (usa los de la base) y suma `padding-top: 2%`.
- El «•••» del chat sólo cambia el color de los tres puntos al pasar el mouse o con el menú abierto; el botón ya no cambia de fondo.

## Beta v4.4.5 — Marco vectorial del celular

- Nuevo `phone.svg` exportado desde Illustrator (pantalla transparente, 27 KB) con sus proporciones (798,1 × 1149,7) y la pantalla reubicada.

## Beta v4.4.4 — Vista previa apoyada

- Armario sin puertas ni bisagras.
- Tilde de aceptar sin relleno negro accidental.
- Tarima SVG alineada con los pies de la mascota y retirada la sombra flotante.

## Beta v4.4.3 — Armario celeste

- Marco de armario abierto y botones Quitar todo, Cancelar y Aceptar en SVG.
- Sin adorno de conejo ni título de vista previa.
- Mascota del vestidor sin animaciones, manteniendo las del juego.

## Beta v4.4.2 — Categorías por íconos

- Pestañas del vestidor sin texto visible, fondo ni marco; nombres accesibles y ayuda al pasar el cursor.
- Anteojos SVG sólo como ícono de Accesorios, sin añadir una prenda.

## Beta v4.4.1 — Ajustes del vestidor

- Retirada la colección de seis torsos y anteojos de v4.4; los guardados eliminan esas referencias y conservan las prendas anteriores.
- Marco sin letrero ni perchero.
- Vistas previas recortadas de las prendas originales para aprovechar el botón sin alterar su tamaño al equiparlas.

## Beta v4.4 — Vestidor

- Ventana SVG de madera y dorado, vista previa y categorías con seis prendas por página.
- Probar o quitar prendas no modifica el conjunto hasta pulsar Guardar. Cancelar, cerrar y Escape descartan la prueba.
- Colección inicial gratuita: remera celeste, buzo coral, remera a rayas, campera amarilla, sweater violeta, remera con corazón y anteojos redondos. Arte vectorial tanto en catálogo como equipado.
- Conserva las prendas anteriores y migra los guardados existentes sin reemplazar el conjunto equipado.
- Comprobación de migración y catálogo: `node tests/wardrobe.test.js`.

## Beta v4.3.5 — Cierre de v4.3

- Monedas dentro del juego, arriba a la derecha, con moneda SVG y contador dorado delineado.
- Inventario sin huella decorativa y cierre desplazado hacia el interior.

## Inventario cofre

- Ventana, pescado, botella y cierre circular en SVG independientes.
- Stock e infinito dentro de medallones dorados. Cooldowns con el mismo acabado, en su posición habitual.

## Beta v4.3.4 — Navegación del celular

- Contactos centrado y sin subtítulo.
- Flecha pequeña amarilla, basada en la flecha del inventario.
- Transiciones suaves entre pantallas, respetando la preferencia de movimiento reducido.
- Confirmación antes de viajar desde Contactos o desde el menú del chat.
- Confirmaciones de solicitudes y cruz roja para cancelar o rechazar.

## Beta v4.3.3 — Todo lo de amigos dentro del celular

- **Se eliminó la ventana vieja de Amigos** (pestañas Mis amigos / Agregar / Eliminar) y el botón oculto de Amigos del encabezado. Todo vive en el celular.
- **Pantalla Contactos:** arriba, la **lupa** (siempre) y el **+** amarillo, que aparece sólo cuando hay solicitudes pendientes y muestra cuántas. Se quitó el −.
- **Lupa → pantalla Buscar amigos**, dentro del celular: campo de usuario + lupa, y el resultado con «Enviar solicitud».
- **+ → pantalla Solicitudes**, dentro del celular: cada solicitud con ✓ y −. Al aceptar o rechazar la última, el + desaparece.
- **Eliminar amigo** queda sólo en el «•••» del chat de cada contacto, con **confirmación dentro del celular** (✓ / −).
- El número rojo del globo de Contactos suma mensajes sin leer y solicitudes pendientes.
- **Marco en la capa superior:** `phone.svg` ahora tiene la pantalla transparente y el contenido va por debajo, extendido unos píxeles detrás del borde; el marco recorta las esquinas.
- Se quitó el botón de emojis (la huellita del campo de texto) y su función.
- La huella del marco vuelve a Contactos desde cualquier pantalla (chat, Buscar, Solicitudes o la confirmación) y en Contactos cierra el celular.

## Beta v4.3.2 — Contactos dentro del celular

- **Contactos y el chat viven dentro del celular ilustrado** (`assets/ui/phone/phone.svg`), abajo a la derecha, sobre el globo de Contactos. Diseño de pantalla según `referencia.png`: encabezado con avatar redondo y nombre, globos crema para los mensajes recibidos (izquierda) y verde menta para los propios (derecha), y abajo huellita + campo + Enviar.
- **Mascota de cada contacto** a la izquierda, recortada a la cabeza como en la placa de bienestar, con **aro verde si está conectado y gris si no**. Se lee una vez por cada apertura del celular; mientras carga (o si la cuenta no tiene mascota) se ve una huellita.
- **Chat de la sala** con el ícono de la casita (`room.svg`).
- **Huellita del campo de texto:** abre un panel de emojis que se insertan en el mensaje.
- **«•••» del encabezado** (sólo en chats privados): Visitar y Eliminar amigo, con confirmación.
- **Huella del marco:** botón de inicio. Desde un chat vuelve a Contactos; en Contactos cierra el celular. También se cierra con Esc o con el globo de Contactos.
- **Aceptar** una solicitud ahora es el **✓ verde** (`check.svg`) y **Buscar** es la **lupa** (`search.svg`), al lado del campo de usuario.
- `accept.svg` (el + verde de la v4.3.1) ya no se usa y se puede borrar.

## Beta v4.3.1 — Contactos: íconos de acciones

- La pantalla «Chat» pasa a llamarse **Contactos**, con las mismas opciones de antes.
- Solicitudes recibidas: **Aceptar** es un + verde (el mismo + de Agregar, recoloreado al verde del viejo botón Aceptar, en `assets/ui/phone/accept.svg`) y **Rechazar** es el − rojo de Eliminar.
- **Visitar** usa `visit.svg` y **Chat** usa `message.svg`, tanto en la lista de Contactos como en «Mis amigos». Los mensajes sin leer se muestran como contador sobre el globo de Chat.
- **Enviar**, dentro de una conversación, usa `send.svg`.
- Todos los íconos nuevos tienen el mismo hover y pulsación que la barra de acciones y conservan su nombre accesible y la ayuda al pasar el cursor.

## Beta v4.3 — Contactos, primer paso: íconos

- El botón Amigos pasa a ser **Contactos**: ícono del globo de chat recoloreado al amarillo del marco del celular, sin texto visible. Mantiene el contador de mensajes sin leer, el resplandor con el panel abierto y un punto rojo sólo cuando no hay conexión.
- Agregar y Eliminar pasan a ser los íconos **+** y **−**, con el mismo hover y pulsación que la barra de acciones. El + muestra el contador de solicitudes pendientes.
- **Solicitudes se une a Agregar**: en la ventana de amigos desaparece la pestaña Solicitudes; en Agregar queda la búsqueda arriba y «Solicitudes recibidas» abajo.
- Los PNG del celular y sus íconos quedan vectorizados en `assets/ui/phone/` (sólo trazados, sin imágenes incrustadas), reproducibles con `scripts/vectorize-phone-assets.py`. El marco del celular, Visitar, Chat y Enviar todavía no se usan: llegan en los próximos pasos de la v4.3.

## Beta v4.2.9 — Cierre de la serie v4.2

- Inventario exclusivo para comida y bebida, con la ventana simplificada de `windowsv2.ai`, sin pestañas ni casilleros vacíos dibujados.
- Stock, infinito y cooldowns conservados; páginas de hasta ocho consumibles, con flechas sólo cuando hacen falta.
- Acceso «Decorar casa» en el encabezado de la casa propia. Paredes, pisos y decoraciones se eligen y usan desde ese panel; conservan su posesión y guardado.
- Exportación reproducible del panel con `scripts/export-inventory-window-v2.py`. La siguiente etapa de versiones será v4.3.

## Beta v4.2.8

- Cooldown de comida y agua como el jabón: icono atenuado y contador pequeño superpuesto, sin cubrir toda la imagen.
- Pesca sin cooldown, con tres partidas por día local. Cada inicio consume una partida, incluso si se cancela; el contador se guarda con el progreso y se renueva al cambiar el día.
- Encabezado sin fondo, sombra ni borde.
- Opciones muestra el nombre de usuario (Invitado en modo local) con ▴ al estar cerrado y ▾ al abrirse.

## Beta v4.2.7

- Infinito del agua con el mismo estilo y posición que el stock de comida.
- Flecha anterior en la esquina inferior izquierda; siguiente en la derecha.
- Cierre desplazado a la izquierda para igualar su margen derecho al margen izquierdo del primer botón de categorías.
- Hover de cierre y flechas reducido a un aumento del 2 %, sin desplazamiento.
- Se conserva la pelota redondeada del SVG actualizado manualmente.

## Beta v4.2.6

- Chat rápido alineado a la izquierda de Amigos con 16 px de separación.
- Inventario sin fondos ni bordes en los ítems, sin líneas inferiores ni scroll en las categorías. Cierre sin fondo ni sombra, alineado con las pestañas.
- Stock arriba a la derecha, en Baloo 2 amarillo con contorno ocre. Pisos, paredes y decoraciones no muestran cantidad.
- Botella recreada como SVG e inclinada 12 grados a la izquierda.
- Pisos, paredes y decoraciones se muestran en páginas de ocho objetos (dos filas de cuatro), sin scroll. Flechas SVG recreadas desde la referencia; sólo aparecen cuando hay una página anterior o siguiente.

## Beta v4.2.5

- Bordes de los ítems del inventario en `#ddc9a875`.
- Se elimina el aviso de sueño dentro de Comida y bebida.
- Chat rápido a la derecha: cerrado muestra un texto de ayuda; se abre con Enter o al pulsar ese texto, sin activarse al pasar el cursor.
- Las actualizaciones se acompañan de capturas de pantalla de los cambios.

## Beta v4.2.4

- Pescado del inventario recreado en SVG a partir de la imagen de referencia.
- Ítems del inventario sin nombres visibles y con fondo `#ffffff1a`; se conservan cantidades y nombres accesibles.
- La pelota queda deshabilitada durante el sueño y vuelve a habilitarse al despertar.
- Cierre del inventario con fondo `#f7e0cb` y sombra `#000000 0 0 2px 0px`. El criterio de cierres queda registrado en los pendientes de UI.

Los acuerdos por retomar al rediseñar cada sección están en [Pendientes de UI](PENDIENTES.md).

## Beta v4.2.3

- Se retira el cartel ilustrado de Inventario y se conserva el nombre accesible del panel.
- El cierre ilustrado tiene un fondo circular crema.
- Inventario, Ropa y Tienda se pueden abrir durante el sueño; el jabón y retirar suciedad quedan bloqueados.
- Los íconos SVG de la barra de acciones duplican su tamaño, con espacio suficiente en sus botones.

## Beta v4.2

- Inventario usa el marco original de windows.ai, con título en la pestaña superior y formato horizontal de 680 × 400 px. El marco se adapta por secciones para preservar las esquinas.
- El SVG original de cierre queda arriba a la derecha, sin fondo y con hover y pulsación como los iconos de acciones.
- Se retiran los botones inferiores Cerrar y Decorar casa. Las categorías conservan su diseño hasta la siguiente etapa.
- Los recursos del marco se exportan con `scripts/export-inventory-window.py`, pasando la ruta del Illustrator compatible con PDF.
- El título usa el arte vectorizado de inv_windows.svg, con su vista recortada a la pestaña superior en assets/ui/inventory/title-tab.svg. Se conserva el encabezado accesible sin texto visible duplicado.

## Beta v4.1

- Barra de acciones con los SVG originales: cofre para Inventario, remera para Ropa, luna/sol para Dormir/Despertar, pelota para Jugar, bolsa para Tienda y jabón para Limpiar.
- Sin nombres visibles debajo de los iconos; se conservan los nombres accesibles y las ayudas al pasar el cursor.
- Inventario, Ropa y Tienda muestran un resplandor mientras su panel está abierto y conservan el estado accesible. Los iconos no tienen sombra debajo. Las acciones conservan hover, bloqueo y cooldown, sin selección persistente.
- Ajuste de tamaño y separación de los iconos para pantallas pequeñas.
- Iconos sin fondo ni subrayado, con elevación suave al pasar el cursor. Dos grupos separados: Inventario/Ropa/Tienda y Dormir/Jugar/Limpiar.
- Al mantener presionado un icono habilitado, baja ligeramente y reduce su tamaño; al soltar vuelve al estado de hover.
- Durante el cooldown, el icono se atenúa y muestra un contador superpuesto que desaparece al terminar; no se dibujan barras de espera.

## Beta v3.2.2

- La transición usa azul sólido y dorado pleno para ocultar por completo el armado del escenario.

## Beta v3.2.1

- La transición permanece visible al menos 650 ms, incluso si la escena carga rápido.
- El símbolo central se reemplazó por el arte de `logo_load.ai`, exportado con transparencia.

## Beta v3.2

- Una transición dentro del escenario cubre la carga inicial, los cambios entre casa y jardín, la edición de mascota y las visitas. Se retira cuando la escena está dibujada y sus imágenes están listas, con espera acotada si una imagen falla.
- Al visitar a un amigo, la mascota aparece junto a la puerta de su casa. La posición se mide sobre la puerta dibujada para respetar el tamaño actual del escenario; si no hay puerta, usa una entrada de respaldo.
- Si la casa anfitriona no llega a cargar, la transición muestra un aviso y permite volver.

## Beta v3.1.4

- La corona se muestra un 35 % más grande y más arriba, centrada sobre la cabeza.

## Beta v3.1.3

- El chat rápido queda centrado horizontalmente respecto del escenario en todos los tamaños de pantalla.

## Beta v3.1.2

- El pantalón se dibuja encima del calzado.
- Las pestañas de la tienda permanecen visibles mientras se desplazan los artículos. Cada sección entra directamente en una subcategoría, sin «Todas», y las tarjetas muestran la imagen y el precio sin el nombre visible.
- El chat rápido ocupa menos ancho dentro del escenario.

## Beta v3.1

- Las mangas se alinean con la unión del hombro y con el borde superior del brazo.
- La tienda distingue paredes, pisos, puertas, ventanas, repisas y alfombras; y separa prendas superiores, inferiores, calzado y accesorios. Las prendas con precio previo vuelven a aparecer aunque un catálogo anterior sólo guardara el precio.
- Los paneles de Amigos, Inventario, Ropa y Tienda se abren dentro del escenario.
- Durante una visita la casa se construye con los datos del anfitrión, incluso si su guardado todavía no tenía vivienda propia.

## Beta v3.0 — Tienda

- El botón **Tienda** abre Casa, Ropa y Colores. Cada variante se compra una sola vez por cuenta; las prendas y decoraciones regaladas ya cuentan como propias.
- Jony puede escribir un precio entero y marcar **Mostrar en la tienda** para cada artículo, luego pulsar **Guardar**. Las prendas con precio previo aparecen inicialmente; las decoraciones, la corona y los colores esperan precio y activación de Jony. Los cambios se comparten mediante Firestore; el panel de administración requiere entrar con la cuenta Jony en la nube.
- Las compras en nube comprueban el precio vigente, las monedas y la posesión dentro de una transacción. Para activar el catálogo compartido, hay que publicar la versión actualizada de `firestore.rules` en Firebase Console → Firestore Database → Reglas antes de usar la tienda.
- La corona usa la mesa de trabajo de `corona.ai` como primer accesorio. La moneda nueva procede de `moneda.ai`; los precios usan Baloo 2 y dorado.
- El rol de Jony es una comodidad del juego entre amigos: las reglas del catálogo admiten escrituras de cuentas autenticadas y no constituyen protección de administrador contra usuarios técnicos.

## Beta v2.1

- Mangas centradas en los brazos y alineadas con su borde superior; calzado centrado en las piernas y alineado con su borde inferior. Se mantienen tamaños y pivotes de animación.
- El panel **Decorar casa** se puede arrastrar desde el encabezado y contraer para descubrir la zona que cubría.
- Las nubes de la ventana se mueven suavemente; el cielo cambia entre día y noche según la hora local del dispositivo.

## Beta v2 — Housing

- Cada casa nueva empieza con la primera pared básica, el piso básico, una puerta a la izquierda y una ventana a la derecha.
- Las cuentas creadas antes de incorporar housing eligen una variante de pared de huesitos, piso de madera, repisa y alfombra. Reciben una unidad de cada una en el inventario; nada del regalo se coloca automáticamente.
- El inventario permite ver pisos, paredes y decoraciones. Desde **Decorar casa** se cambian las superficies y se colocan, mueven o retiran las decoraciones propias.
- La puerta se mueve sólo en horizontal y siempre queda apoyada en el límite del piso. La ventana y la repisa se mueven dentro de la pared; la alfombra, dentro del piso. Las decoraciones no pueden superponerse.
- Las visitas muestran la casa guardada del anfitrión sin permitir editarla. El diseño se guarda junto al estado de la mascota y se sincroniza con Firestore.
- Los recursos de `assets/housing/` se generan desde los Illustrator con `scripts/export-housing-assets.py`. Los números de variante siguen el orden de las mesas de trabajo de cada archivo. El script recorta los márgenes transparentes de las decoraciones para que sus límites de colocación coincidan con el dibujo visible.

## Beta v1.2.1

- Mangas ensanchadas específicamente en la unión con los brazos para ocultar los bordes que sobresalían durante la animación.
- Botella restaurada a una escala proporcionada dentro del inventario, conservando el cooldown superpuesto.

## Beta v1.2

- La botella de agua muestra su cooldown directamente sobre la ilustración, igual que el pescado.
- Mangas, pantalones y calzado se ampliaron un poco más para cubrir mejor las partes animadas de la mascota.
- El distintivo de versión Beta ahora usa el color `#6bafd7`.

## Beta v1.1

- Orden de vestuario corregido: torso de la prenda, brazos de la mascota y mangas por encima.
- Mangas, pantalones y calzado ampliados levemente para ocultar desajustes durante las animaciones.
- Elección inicial renombrada como Opción 1 y Opción 2.
- Barra de sala y botón de Amigos alineados con la barra inferior de acciones en escritorio.
- Inventario con cierre visible, cooldown sobre la imagen del pescado y acceso directo a Pesca al quedarse sin stock.
- Vestidor sin nombres bajo las prendas y con botón de cierre visible.
- Herramientas de amigos centradas y título redundante de la lista eliminado.

## Beta v1.0

- Ropa por capas con tres ranuras combinables: prenda superior, prenda inferior y calzado.
- Regalo único para toda cuenta al entrar por primera vez a la Beta: elección visual entre dos conjuntos, cada uno con tres piezas independientes.
- Inventario con pescado de stock y botella de agua infinita; decoración, muebles, pisos y paredes quedan visibles pero deshabilitados.
- Barra compacta inferior izquierda: Inventario, Ropa, Dormir/Despertar, Jugar, Tienda (próximamente) y Limpiar.
- Sistema de enfermedad y medicina desactivado en esta versión.
- Diálogos espontáneos según hambre, sed, higiene, energía y ánimo; se quitó la acción manual de hablar.
- Panel de sala y amigos con presencia, Visitar, Chat, solicitudes recibidas y eliminación con confirmación. Las solicitudes enviadas quedan ocultas.
- Catálogo y precios de prendas preparados para la futura tienda, que todavía permanece deshabilitada.

La Beta parte de la v3.9.7 y conserva las visitas, el movimiento, las acciones y el chat de sala en tiempo real.

## v3.9.7

### Barra rápida y globos del chat de sala

- Se agregó una barra de escritura discreta inmediatamente arriba de las acciones. Gana opacidad al hacer clic o al presionar `Enter` mientras se juega.
- Con la barra activa, `Enter` envía el mensaje a la sala actual; al enviarlo, la barra vuelve a su estado tenue.
- La barra rápida y la conversación **Tu casa / Casa de [anfitrión]** usan el mismo historial de Realtime Database.
- Todo mensaje de sala enviado desde cualquiera de los dos lugares aparece también en un globo sobre la mascota del autor y activa su animación de hablar.
- Los demás jugadores presentes ven el globo sobre la mascota remota correspondiente. Los mensajes antiguos se cargan en el historial sin volver a reproducirse como globos.
- Los mensajes privados continúan siendo privados y no producen globos dentro de la casa.
- No se agregaron rutas nuevas a Firebase: si ya estaban publicadas las reglas de v3.9.6, esta actualización no exige volver a publicarlas.
- Indicador de versión actualizado a Alpha v3.9.7.

## v3.9.6

### Bandeja de conversaciones y mensajes privados persistentes

- El azul del chat fue reemplazado por `rgba(255,249,236,.94)` en el acceso, el encabezado y el botón de envío.
- Se ajustaron bordes, textos, foco y estados interactivos a tonos marrón y naranja para mantener contraste sobre el fondo crema.
- Se eliminó el emoji del botón de chat.
- El panel funciona en una sola columna: primero muestra las conversaciones y, al seleccionar una, esa misma superficie presenta el historial.
- La casa donde está la mascota aparece como un contacto especial: **Tu casa** o **Casa de [anfitrión]**. Al cambiar de casa, el contacto cambia automáticamente.
- Todos los amigos aceptados aparecen como contactos. Al seleccionarlos se abre un chat privado independiente de la casa visitada.
- Los mensajes privados se conservan en Realtime Database y cada conversación recupera hasta los 100 mensajes más recientes, sin el vencimiento de 24 horas del chat de sala.
- `directInbox` conserva el último mensaje y la cantidad no leída por conversación. Así el botón muestra una alerta aunque el mensaje haya llegado con el juego cerrado o el panel oculto.
- Al abrir una conversación privada, su contador se marca como leído. Los demás contadores se mantienen.
- Se eliminó el texto **“0 mensajes recientes”** y se reemplazó el mensaje vacío anterior por una única indicación dentro del historial, sin dividir el panel.
- `database.rules.json` incorpora `directChats` y `directInbox`, necesarios para historial, bandeja y alertas persistentes.
- Indicador de versión actualizado a Alpha v3.9.6.

Para activar esta versión es obligatorio volver a publicar `database.rules.json` en Firebase Realtime Database. Sin esas reglas nuevas, la lista de contactos se verá pero los mensajes privados no podrán guardarse ni recuperar historial.

## v3.9.5

### Reactivación del chat y explicación de la presencia estimada

- Se corrigió `databaseURL`, que había quedado vacío en la v3.9.4 y desactivaba por completo la capa multijugador.
- El chat, la presencia, el movimiento y las acciones vuelven a inicializarse mediante Firebase Realtime Database.
- La inicialización ahora comprueba que Realtime Database haya arrancado realmente antes de abrir suscripciones de sala.
- El antiguo mensaje técnico **“Presencia aproximada · activá Realtime Database…”** fue reemplazado por un estado más claro y discreto: **“Estado estimado · tiempo real no disponible”**.
- Ese estado significa que la app calcula si el anfitrión estuvo activo recientemente usando `lastActive` de Firestore; no representa una conexión en vivo.
- El estado incorpora una explicación al pasar el cursor y desaparece automáticamente cuando la presencia real está disponible.
- Indicador de versión actualizado a Alpha v3.9.5.

Para que el chat pueda leer y escribir, publicá en Firebase Realtime Database el contenido de `database.rules.json`. La entrega usa la URL estándar `https://mascotito-84b36-default-rtdb.firebaseio.com`; si la consola de Firebase muestra una URL regional diferente, esa dirección exacta debe reemplazarla en `js/firebase-config.js`.

## v3.9.4

### Selector de piezas/colores centrado en Crear/Editar

- Corregido: en la pantalla de personalización, el recuadro donde aparecen las piezas y los colores para elegir (debajo de la fila de pestañas Color/Cabeza/Orejas/Ojos/Nariz/Boca/Cejas) quedaba corrido bien a la izquierda, sin alinear con esa fila de pestañas, que sí estaba centrada.
- Causa real: ese recuadro reutiliza el mismo contenedor que la barra de acciones del juego (`.stage-actions-row`), y la regla que lo reposiciona para Crear/Editar (`left`/`width`) no anulaba una propiedad `transform` heredada de esa barra, pensada para otro tipo de centrado. Esa propiedad sumaba un corrimiento extra hacia la izquierda por encima del `left`/`width` ya definidos, sacando el recuadro de su posición centrada (en casos extremos, arrancando fuera de la pantalla por la izquierda).
- Verificado en escritorio (1536×960, el caso del reporte) y mobile (390×844): el recuadro de piezas/colores queda alineado borde a borde con la fila de pestañas de arriba en ambos anchos.
- Indicador de versión actualizado a Alpha v3.9.4.

## v3.9.2.2

### Chat ampliado con estética de mensajería clásica

- La ventana de chat ahora es más ancha y alta, con mayor superficie útil para leer conversaciones.
- Se adoptó una estética inspirada en el Facebook clásico: cabecera azul, estructura rectangular, lista de mensajes blanca y controles compactos.
- Se eliminaron los bordes redondeados del panel, el botón de acceso, los mensajes, el campo de texto, el botón de envío y el contador.
- Los mensajes dejaron de mostrarse como burbujas: cada intervención ocupa una fila clara, con autor, hora y texto legible.
- La caja de escritura permanece fija en la zona inferior mientras el historial se desplaza de manera independiente.
- Se mantuvieron sin cambios la sincronización en tiempo real, los mensajes no leídos, la presencia y el indicador de escritura.
- Indicador de versión actualizado a Alpha v3.9.2.2.

## v3.9.2.1

### Corrección visual para notebooks 1920×1200

- La interfaz conserva a zoom 100% las proporciones que antes sólo se obtenían reduciendo Chrome a 75% en pantallas 1920×1200 con escalado del sistema.
- Se ajustaron de forma coordinada el encabezado, la casa, las tarjetas de estado y objetivos, la mascota, el dock de acciones, las notificaciones, la visita y el chat.
- El ajuste se activa únicamente en el rango de viewport y densidad correspondiente a notebooks con escalado alto, sin modificar el diseño móvil ni reducir nuevamente la interfaz cuando el navegador ya está a 75%.
- No se usa `zoom` global: los tamaños y áreas interactivas siguen alineados.
- Indicador de versión actualizado a Alpha v3.9.2.1.

## v3.9.2

### Cierre y pulido de la etapa online

- El chat muestra cuántos usuarios están presentes en la casa y una vista breve de sus nombres.
- Se agregó el indicador **“está escribiendo…”**, sincronizado por sala y compatible con varias pestañas del mismo usuario.
- La escritura se detiene al enviar, borrar el texto, dejar de escribir, cerrar el chat, ocultar la pestaña, cambiar de casa o cerrar sesión.
- Cada pestaña registra su propio estado temporal y `onDisconnect` lo elimina automáticamente ante un cierre o una pérdida abrupta de conexión.
- Los indicadores de escritura caducan visualmente después de ocho segundos aunque un cliente remoto no alcance a limpiar su estado.
- Movimiento, acciones, chat y escritura permanecen bloqueados durante la recuperación de presencia después de una reconexión; vuelven a habilitarse cuando la membresía de la sala está publicada.
- La lista de participantes reutiliza una única suscripción de sala. Se eliminó la lectura duplicada que antes se abría únicamente durante las visitas.
- Todas las suscripciones y temporizadores del chat se cancelan juntos al cambiar de casa o terminar la sesión.
- `database.rules.json` incorpora la ruta temporal `rooms/{room}/typing` y exige membresía activa para publicar el estado.
- Indicador de versión actualizado a Alpha v3.9.2.

Esta entrega cierra el bloque iniciado en v3.8: casa unificada, presencia real, movimiento, anfitrión desconectado, acciones y chat. Para activar las últimas validaciones, publicá nuevamente `database.rules.json` en Firebase Realtime Database.

## v3.9.1

### Chat por casa y acciones online reforzadas

- Cada casa incorpora un chat instantáneo asociado a su sala de Realtime Database. Al visitar a otra mascota, la conversación cambia automáticamente; al volver, se recupera la de la casa propia.
- El botón flotante muestra mensajes no leídos y el panel distingue visualmente los mensajes propios de los ajenos.
- Se muestran los 40 mensajes más recientes de las últimas 24 horas. Cada sala conserva como máximo 60 mensajes y depura los más antiguos al enviar uno nuevo.
- Los mensajes admiten hasta 180 caracteres, se normalizan antes de enviarse y tienen una espera mínima de 800 ms para reducir spam accidental.
- La interfaz informa envío, reconexión, límite de frecuencia y errores de reglas/conexión sin inventar mensajes locales que nunca llegaron a Firebase.
- Los mensajes se construyen con nodos de texto, sin insertar HTML recibido desde la red.
- Las reglas nuevas validan usuario, nombre, contenido y longitud; además exigen que el actor figure como miembro actual de la sala para publicar mensajes o acciones.
- Las acciones remotas ahora rechazan eventos demasiado antiguos o con fechas futuras anómalas, tanto al recibirlos como al vaciar la cola de una mascota que todavía no apareció.
- Los efectos repetidos reinician correctamente sus animaciones y temporizadores. Juego tiene un cierre de seguridad si se pierde el evento final; baño, medicina y deposición ya no acumulan temporizadores visuales.
- Las suscripciones a movimiento, acciones, chat y conexión se cancelan juntas al cambiar de casa o cerrar sesión.
- Indicador de versión actualizado a Alpha v3.9.1.

Para usar chat y acciones con estas validaciones, reemplazá y publicá nuevamente `database.rules.json` en Firebase Realtime Database.

## v3.9

### Acciones en tiempo real

- Comer, beber, bañarse, dormir, despertar, acariciar, hablar, jugar, terminar un juego, tomar medicina, hacer caca y limpiar se publican como eventos efímeros de la sala.
- Cada evento incluye un identificador único y la hora del servidor. Al entrar a una casa se descartan acciones anteriores y cada evento se reproduce una sola vez.
- Las mascotas remotas reutilizan las animaciones existentes: boca, globo de diálogo, corazones, burbujas de baño, sueño, juego, medicina y deposición.
- Las frases de **Hablar** se muestran en vivo a todos los presentes, con un máximo de 180 caracteres validado tanto en el cliente como en las reglas.
- Las acciones remotas son exclusivamente visuales: no cambian estadísticas, inventario, monedas ni progreso de otra cuenta.
- Durante una visita se habilitan las acciones de la mascota propia. Los muebles, la suciedad y las pertenencias del anfitrión continúan siendo de sólo lectura.
- Si un evento llega antes que el movimiento/perfil de una mascota remota, queda en una cola breve y se reproduce apenas aparece su representación.
- Los eventos se eliminan automáticamente del Realtime Database después de aproximadamente un minuto y la suscripción sólo conserva los 40 más recientes.
- `database.rules.json` agrega la ruta `rooms/{room}/events` con una lista cerrada de tipos y límites para cada campo.
- Indicador de versión actualizado a Alpha v3.9.

Para activar esta versión, además de configurar `databaseURL`, reemplazá nuevamente las reglas de Realtime Database por el contenido actualizado de `database.rules.json` y publicalas.

## v3.8.3

### Anfitrión desconectado como NPC compartido

- La mascota anfitriona permanece visible cuando su dueño está desconectado o visitando otra casa.
- Su recorrido se calcula de forma determinista utilizando el nombre de la sala y el reloj del servidor de Firebase; todos los visitantes observan la misma posición y conducta sin guardar movimientos artificiales.
- El NPC alterna entre caminar, permanecer quieto y descansos ocasionales. Su dirección y animación coinciden con el recorrido calculado.
- El comportamiento automático no modifica estadísticas, posición persistente, sueño real, monedas ni progreso del anfitrión.
- Si el dueño se conecta mientras alguien está de visita, el NPC entrega el control a la posición multijugador real mediante una transición suave.
- Si el dueño sale o pierde la conexión, la mascota vuelve automáticamente al recorrido NPC compartido.
- Cuando el anfitrión está conectado pero en otra casa, su mascota local también queda representada por el NPC automático.
- Realtime Database aporta `serverTimeOffset`; si no está disponible se utiliza el reloj local como respaldo.
- Al cerrar la visita se detiene completamente la simulación y se limpia cualquier transición pendiente.
- Indicador de versión actualizado a Alpha v3.8.3.

Esta versión utiliza la misma `databaseURL` y las mismas reglas publicadas para v3.8.2; no agrega nuevas rutas persistentes a la base.

## v3.8.2

### Movimiento sincronizado

- Cada jugador publica en Realtime Database la posición horizontal normalizada de su mascota, dirección y animación actual (`idle`, `walking`, `running` o `sleeping`).
- Los envíos se limitan a un máximo aproximado de 10 actualizaciones por segundo y los estados idénticos no generan escrituras repetidas.
- Las mascotas remotas interpolan su posición entre actualizaciones para que el movimiento se vea continuo aun con pequeñas variaciones de latencia.
- El visitante ve el movimiento real del anfitrión cuando está presente. Si está desconectado o en otra casa, se conserva el comportamiento NPC de la v3.8.1.
- El anfitrión ahora también ve a los visitantes que entran en su casa, y los visitantes pueden verse entre ellos.
- Cada mascota remota carga su apariencia, nombre, ánimo y enfermedad desde Firestore, mientras su movimiento temporal llega desde Realtime Database.
- Al cambiar de casa, cerrar sesión, perder conexión o cerrar la pestaña se eliminan automáticamente los datos temporales de movimiento.
- Se admiten varias pestañas por cuenta: para cada usuario se utiliza la conexión que tenga la actualización de movimiento más reciente.
- Las reglas de `database.rules.json` incorporan validación de posición, dirección, animación y secuencia.
- Indicador de versión actualizado a Alpha v3.8.2.

Esta versión requiere la misma configuración de Realtime Database explicada en v3.8.1. Todavía no incorpora chat ni sincronización de acciones como comer, beber o hablar.

## v3.8.1

### Presencia real en las casas

- Se agregó `js/multiplayer.js`, una capa independiente para presencia efímera con Firebase Realtime Database.
- Cada pestaña registra una conexión propia y Firebase la elimina automáticamente con `onDisconnect` si se cierra, pierde Internet o termina de forma inesperada.
- Cada jugador informa en qué casa se encuentra. Al visitar a un amigo, abandona temporalmente su sala propia y aparece en la sala del anfitrión; al volver, regresa a su casa.
- La visita distingue tres estados reales del anfitrión: **en su casa**, **conectado pero visitando otra casa** y **desconectado**.
- La barra de visita muestra cuántas mascotas están presentes en esa casa.
- Abrir varias pestañas no genera una desconexión falsa al cerrar solamente una: cada pestaña tiene un identificador de conexión independiente.
- Firestore conserva progreso, apariencia y heces; Realtime Database guarda únicamente presencia temporal.
- Si Realtime Database no está configurada o falla, la app vuelve automáticamente al cálculo aproximado de v3.8 mediante `lastActive`.
- Indicador de versión actualizado a Alpha v3.8.1.

### Activar Realtime Database

1. En Firebase Console abrí **Compilación → Realtime Database** y creá la base de datos.
2. Copiá la URL exacta que aparece en la parte superior de la sección **Datos**.
3. Pegala en `databaseURL` dentro de `js/firebase-config.js`.
4. Abrí la pestaña **Reglas**, reemplazá su contenido por `database.rules.json` y publicalo.
5. Reabrí Mascotito. No hace falta cambiar la configuración de Firestore ni las cuentas existentes.

Mientras `databaseURL` permanezca vacía, el juego funciona normalmente pero muestra presencia aproximada. No conviene inventar la URL: algunas regiones usan `firebaseio.com` y otras `firebasedatabase.app`.

## v3.8

### Casa y visita unificadas

- Visitar a un amigo ya no abre un escenario de pantalla completa separado: la casa visitada se carga en el mismo `#stage-floor` usado por la partida normal.
- La mascota propia conserva su movimiento normal dentro de la casa visitada y la mascota anfitriona aparece como una segunda entidad.
- Se muestran las heces persistentes guardadas en la casa del anfitrión, pero no se pueden limpiar ni modificar.
- Una barra dentro del escenario indica de quién es la casa, el estado reciente del anfitrión y ofrece **Volver a casa**.
- Mientras se visita, las acciones de cuidado, los muebles, la mascota anfitriona y las pertenencias ajenas son de sólo lectura.
- La suscripción existente a Firestore sigue actualizando apariencia, ánimo, sueño, enfermedad, presencia aproximada y suciedad del anfitrión. El movimiento multijugador real no forma parte todavía de esta versión.
- Indicador de versión actualizado a Alpha v3.8.

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
