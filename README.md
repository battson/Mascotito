# Mascotito Alpha

Descomprimí y abrí index.html, o serví esta carpeta con un servidor estático. Conservá el mismo navegador y origen para mantener tu partida. Migra automáticamente el guardado anterior (versión interna 5), sin borrar pescado, monedas ni apariencia.

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
