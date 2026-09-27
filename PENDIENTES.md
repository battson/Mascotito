# Roadmap de Mascotito — cierre de la Beta

## Estado y forma de trabajo

- Base actual: Beta v4.6.11. Barra de acciones, inventario cofre, vestidor, Contactos en el celular, ficha plegable y chat de sala ya rediseñados.
- Trabajar por etapas, revisando con el usuario cada cambio de diseño. Entregar capturas cuando se cambie la interfaz.
- Priorizar escritorio. v4.6.5: el celular apaisado (ref. iPhone 11) ya se ve entero escalando el escenario de escritorio; el vertical pide girar el teléfono. v4.6.6: en celulares y tablets se aliviana lo que se dibuja (modo liviano, `?lite=1` para probarlo en la compu); si al agregar arte nuevo pesado (SVG de más de ~40 KB) se nota lento en el celular, sumarlo a `scripts/export-lite-v466.py` y a `LITE_ART`. Una versión móvil dedicada (controles táctiles propios, textos más grandes) queda para más adelante.
- Mantener el ánimo, las expresiones y el aro de color. Se retira acariciar y sus recompensas de felicidad/XP, no el sistema general de felicidad.
- Los subrayados y guiones inferiores no se usarán como indicadores de selección. Recordar los pendientes de cada sección al comenzar su rediseño.

## Beta v4.6 — Jugar

- [x] Rediseñar la interfaz de Jugar y la selección de juegos.
- [x] Revisar el sistema de juego: acceso, instrucciones, interacción y pantalla de resultado. Las recompensas mantienen el cálculo anterior hasta la economía de v4.7.
- [x] Definir con el usuario qué juegos se mantienen, cambian o incorporan: Pesca (rehecha) y Penales (nuevo); se retiró Caza de luciérnagas.
- [x] v4.6.2: ventana de juegos de feria con dos paneles, viaje a cada juego con pantalla de carga (la mascota sale de la sala), Penales rediseñado (click + potencia, arquero de guantes con IA fácil), botones de minijuegos en el modo prueba, moscas según higiene y arreglos de bañar y dormir.
- [x] v4.6.4: ruleta diaria (tercer recuadro de Minijuegos), lata energizante, cursores propios, transición de dormir/despertar y seguimiento de ojos.
- [x] v4.6.11: Ruleta con costo — la primera tirada del día sigue gratis; las siguientes cuestan 25 monedas (precio en el botón, confirmación y bloqueo si no alcanza el saldo). Aviso de «¡Giro diario!» debajo de las monedas mientras quede la tirada gratis.
- [x] v4.6.11: Pesca — la mascota vuelve a moverse al pescar (también con «movimiento reducido»), botón distinto para esperar / tantean / picó (+ «!» sobre la bocha) y chance chica (5 %) de pescar una lata energizante. La lata energizante tomada queda como lata vacía (chatarra).
- [x] v4.6.11: Caminar — se quitó correr; caminar va a la velocidad que tenía correr y pata, pantalón y calzado se mueven sincronizados.
- [x] v4.6.11: nombres sobre los íconos al pasar el mouse (Inventario, Ropa, Tienda, Dormir/Despertar, Jugar, Limpiar, Contactos), círculo central de la ruleta rehecho y globo de charla rediseñado (dura según el largo del texto).
- [ ] **v4.6.12: minijuego de carreras** (próxima entrega).
- [ ] Minijuegos de apuestas con monedas: carrera de caballos (elegir caballo y apostar) y blackjack (contra la banca). Definir apuesta mínima/máxima, pagos y un límite diario.
- [ ] Juego de reflejos inspirado en Splat A Sloth (tocar rápido lo que aparece antes de que se esconda, sin tocar lo que no hay que tocar). Mecánica propia, con arte y nombre propios (no copiar personajes, dibujos ni marca del original).
- [ ] Kass Basher (estilo Neopets): golpear con un mazo en el momento justo para lanzar a un personaje lo más lejos posible; puntaje por distancia.
- [ ] Test Your Strength (martillo de feria): cargar la fuerza y golpear para que la pesa suba y toque la campana; premio según la altura.
- [ ] Tómbola: sacar un número al azar por día y ganar el premio que le toque (o nada), como la tómbola de feria.
- [ ] Para estos tres, igual que con el juego de reflejos: mecánica tomada como idea, con personajes, arte y nombres propios (no copiar los de Neopets).
- [x] v4.6.10: ventana de Minijuegos con páginas de 8 recuadros (4 × 2), flechas y puntitos cuando hay más de 8.
- [ ] Revisar en v4.7 (economía) los montos de monedas de la ruleta junto con los precios de la Tienda.
- [ ] Hotfix final de la versión: optimizar el código antes de la próxima actualización grande (ver «Consolidación técnica gradual»).

## Beta v4.7 — Tienda y economía

- [ ] Rediseñar la Tienda y sus categorías sin subrayados.
- [ ] Definir precios, formas de obtener y gastar monedas, y progresión.
- [ ] Revisar compras, artículos propios, saldo insuficiente y confirmaciones.
- [ ] Comidas y bebidas: frutas y más latas con efectos.
- [ ] Reactivar la Tienda cuando se validen su interfaz y economía; hoy está deshabilitada deliberadamente.
- [ ] Formularios: reemplazar la línea inferior de nombre, usuario, PIN y búsqueda por un tratamiento a definir (se hace junto con la Tienda, que suma búsqueda, cantidades y confirmaciones: así todos los campos quedan con el mismo estilo).
- [ ] Hotfix de teclado: centralizar Escape (cerrar primero el panel de arriba sin terminar también una visita) y mantener el foco dentro de las ventanas, devolviéndolo al control que las abrió al cerrar.
- [ ] Hotfix final de la versión: optimizar el código antes de la próxima actualización grande (ver «Consolidación técnica gradual»).

## Beta v4.8 — Casas y preparación de nuevos lugares

- [ ] Rediseñar las casas y la experiencia de Decorar casa.
- [ ] Consolidar la colocación, guardado y presentación de los objetos de vivienda.
- [ ] Preparar una estructura de escenarios que distinga casas privadas y espacios públicos.
- [ ] Definir navegación, entradas/salidas y permisos para esos nuevos escenarios, conservando las visitas a casas.
- [ ] Editor de mascota: reemplazar los guiones de hover/selección en partes y colores (propuesta: aumento suave y borde completo). Va con Decorar casa porque las dos son pantallas de personalizar: comparten el mismo estilo de selección.
- [ ] Encabezado: unificar Editar mascota, Decorar casa y opciones con el lenguaje ilustrado del juego (va con el editor y Decorar casa, que son las pantallas que abren esos botones).
- [ ] Hotfix final de la versión: optimizar el código antes de la próxima actualización grande (ver «Consolidación técnica gradual»).

## Beta v4.9 — Salas públicas y última actualización de la Beta

- [ ] Implementar salas públicas para encuentros, juegos y otras actividades por definir.
- [ ] Integrar presencia, chat y entrada/salida de jugadores en esos escenarios.
- [ ] Diseñar e implementar el sistema definitivo de objetivos; el anterior se retiró y no debe reactivarse por accidente.
- [ ] Revisar progresión, recompensas, nuevos usuarios y mensajes del juego antes de la salida oficial.
- [ ] Pulir interacción, rendimiento, guardado y reconexión con pruebas de varias cuentas.
- [ ] Validar permisos de cuentas, mensajes privados y catálogo antes de ampliar el público.
- [ ] Pulidos finales: evitar que la ficha de la mascota tape los globos de diálogo, especialmente en escritorios de 1366 × 768.
- [ ] Cerrar los pendientes de la Beta y preparar la salida oficial. v4.9 será la última actualización de la Beta.
- [ ] Hotfix final de la versión: optimizar el código antes de la próxima actualización grande (ver «Consolidación técnica gradual»).

## Consolidación técnica gradual

Se hace en el hotfix final de cada versión, para dejar el código optimizado de cara a la próxima actualización grande.

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
- Escape y foco del teclado: pasaron al hotfix de teclado de v4.7. La ficha que tapa los globos: pulidos finales de v4.9.

## Recordatorios de diseño por sección

- Editor de mascota: pasó a v4.8. Formularios: pasaron a v4.7.
- Encabezado: pasó a v4.8.
- [x] Barra de acciones: dos grupos, iconos sin nombres/fondos/sombra inferior, hover, pulsación y resplandor activo. Tamaño ampliado desde v4.2.3 aprobado; cooldown con icono atenuado y contador.
- [x] Inventario: sólo consumibles, cofre ilustrado y cierre discreto; sin categorías. Los objetos de vivienda están en Decorar casa.
- [x] Vestidor: categorías por iconos, vista previa y Guardar/Cancelar.
