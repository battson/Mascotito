# Roadmap de Mascotito — cierre de la Beta

## Estado y forma de trabajo

- Base actual: Beta v4.6. Barra de acciones, inventario cofre, vestidor, Contactos en el celular, ficha plegable y chat de sala ya rediseñados.
- Trabajar por etapas, revisando con el usuario cada cambio de diseño. Entregar capturas cuando se cambie la interfaz.
- Priorizar escritorio. La experiencia móvil y sus funciones limitadas se decidirán en una versión dedicada; no ampliar ese alcance ahora.
- Mantener el ánimo, las expresiones y el aro de color. Se retira acariciar y sus recompensas de felicidad/XP, no el sistema general de felicidad.
- Los subrayados y guiones inferiores no se usarán como indicadores de selección. Recordar los pendientes de cada sección al comenzar su rediseño.

## Beta v4.6 — Jugar

- [x] Rediseñar la interfaz de Jugar y la selección de juegos.
- [x] Revisar el sistema de juego: acceso, instrucciones, interacción y pantalla de resultado. Las recompensas mantienen el cálculo anterior hasta la economía de v4.7.
- [x] Definir con el usuario qué juegos se mantienen, cambian o incorporan: Pesca (rehecha) y Penales (nuevo); se retiró Caza de luciérnagas.

## Beta v4.7 — Tienda y economía

- [ ] Rediseñar la Tienda y sus categorías sin subrayados.
- [ ] Definir precios, formas de obtener y gastar monedas, y progresión.
- [ ] Revisar compras, artículos propios, saldo insuficiente y confirmaciones.
- [ ] Reactivar la Tienda cuando se validen su interfaz y economía; hoy está deshabilitada deliberadamente.

## Beta v4.8 — Casas y preparación de nuevos lugares

- [ ] Rediseñar las casas y la experiencia de Decorar casa.
- [ ] Consolidar la colocación, guardado y presentación de los objetos de vivienda.
- [ ] Preparar una estructura de escenarios que distinga casas privadas y espacios públicos.
- [ ] Definir navegación, entradas/salidas y permisos para esos nuevos escenarios, conservando las visitas a casas.

## Beta v4.9 — Salas públicas y última actualización de la Beta

- [ ] Implementar salas públicas para encuentros, juegos y otras actividades por definir.
- [ ] Integrar presencia, chat y entrada/salida de jugadores en esos escenarios.
- [ ] Diseñar e implementar el sistema definitivo de objetivos; el anterior se retiró y no debe reactivarse por accidente.
- [ ] Revisar progresión, recompensas, nuevos usuarios y mensajes del juego antes de la salida oficial.
- [ ] Pulir interacción, rendimiento, guardado y reconexión con pruebas de varias cuentas.
- [ ] Validar permisos de cuentas, mensajes privados y catálogo antes de ampliar el público.
- [ ] Cerrar los pendientes de la Beta y preparar la salida oficial. v4.9 será la última actualización de la Beta.

## Consolidación técnica gradual

- [x] Separar la política de teclado y selección de texto en `js/game-interactions.js` y `css/game-interactions.css`.
- [x] Retirar la acción de acariciar, su configuración y cooldown; mantener las recompensas de las demás actividades.
- [x] Jugar extraído a `js/games.js` y `css/games.css` (v4.6).
- [ ] Extraer de `app.js` responsabilidades completas por etapa: economía/Tienda en v4.7, vivienda/escenarios en v4.8 y salas en v4.9.
- [ ] Consolidar el CSS de cada componente al rediseñarlo: reemplazar reglas obsoletas y duplicadas en lugar de seguir acumulando sobrescrituras.
- [ ] Limpiar el código retirado de Objetivos, preservando el contador diario de Pesca y preparando el sistema nuevo de v4.9.
- [ ] Revisar y retirar estilos/recursos sin uso del antiguo panel de Amigos y versiones anteriores de las ventanas.
- [ ] Agregar verificaciones de regresión a medida que se separen componentes; conservar las pruebas de vivienda y vestuario.

## Pulido de interacción pendiente

- [x] Enter no vuelve a activar el último botón pulsado durante el juego: se reserva al chat disponible. Los formularios conservan su edición nativa.
- [x] Evitar selección accidental de texto en el juego. Permitir copiar conversaciones del celular y editar/seleccionar texto en los campos de entrada.
- [ ] Centralizar Escape: cerrar primero el panel superior sin terminar también una visita.
- [ ] Mantener el foco del teclado dentro de las ventanas y devolverlo al control que las abrió al cerrar.
- [ ] Evitar que la ficha de la mascota tape los globos de diálogo, especialmente en escritorios de 1366 × 768.

## Recordatorios de diseño por sección

- [ ] Editor de mascota: reemplazar guiones de hover/selección en partes y colores. Propuesta pendiente: aumento suave y borde completo.
- [ ] Formularios: reemplazar la línea inferior de nombre, usuario, PIN y búsqueda por un tratamiento a definir.
- [ ] Encabezado: unificar Editar mascota, Decorar casa y opciones con el lenguaje ilustrado del juego.
- [x] Barra de acciones: dos grupos, iconos sin nombres/fondos/sombra inferior, hover, pulsación y resplandor activo. Tamaño ampliado desde v4.2.3 aprobado; cooldown con icono atenuado y contador.
- [x] Inventario: sólo consumibles, cofre ilustrado y cierre discreto; sin categorías. Los objetos de vivienda están en Decorar casa.
- [x] Vestidor: categorías por iconos, vista previa y Guardar/Cancelar.
