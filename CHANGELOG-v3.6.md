# Mascotito Alpha v3.6

Esta versión parte de la v3.5.5 y resuelve un pedido puntual de 6 arreglos.

## Qué se agregó/arregló

- **Color de ojos (ojos-4/5/6)**: en ojos-4, un trazo de brillo decorativo tenía su color escrito fijo en el SVG (no derivaba de `--eye-color` como el resto del iris), así que se quedaba trabado en un marrón claro sin importar el color elegido — se le agregó la misma clase de recolor que ya usa el resto del brillo del iris. Ojos-5 y ojos-6 son ilustraciones de ~20 tonos cada una, dibujadas en violeta, que no se pueden recolorear parche por parche de forma económica — se resolvió con un filtro CSS (`hue-rotate/saturate/brightness`) calculado por color a partir de la relación tonal del violeta original, así se conservan las luces y sombras del dibujo en vez de aplanarlo a un tono plano.
- **Selectores de partes en la escena**: se reemplazó el slider ‹ › con números por un rectángulo horizontal DENTRO de la escena del creador/editor, abajo, con una miniatura SVG real de cada opción (recorte del lado derecho para ojos/orejas/cejas, coloreada con el color por defecto de esa categoría). Cada miniatura se recorta a su propio contorno real (no un recorte único por categoría) para que las opciones de tamaños muy distintos entre sí (por ejemplo orejas) no queden minúsculas dentro de su tile.
- **Posición de la caminata en Casa**: la mascota camina un poco más abajo que antes (ancla vertical bajada), sin llegar a superponerse con `.stage-actions-row`.
- **Número de versión**: quedaba escrito a mano en varios lugares (título de la pestaña, badge del encabezado, pie de página) y no se había actualizado desde v3.3. Ahora hay una sola constante (`APP_VERSION`, en `js/config.js`) de la que salen los tres — alcanza con cambiar ese valor en la próxima versión.
- **Superposición de notificaciones con el cuadro de Estado**: bug real encontrado — cuando la tarjeta de alertas de bienestar estaba oculta (sin necesidades bajas) pero sí había un aviso de "durmiendo" o del sistema, ese aviso se posicionaba pegado contra el cuadro de Estado en vez de ir debajo, porque el cálculo anterior leía la posición de la tarjeta anterior en la cadena aunque estuviera oculta (un elemento con `display:none` no tiene esa posición, vuelve a 0). Se corrigió llevando un cursor propio en JS que sólo avanza con la altura real de una tarjeta cuando esa tarjeta está visible.
- **Minijuego "Pelota traviesa"**: se sacó del selector de minijuegos. Quedan Pesca y Caza de luciérnagas.

## Archivos modificados

- `index.html`
- `css/style.css`
- `js/app.js`
- `js/config.js`
- `js/manifest.js`

## Validación realizada

Verificado con navegador automatizado (Playwright), sin errores de consola:
- Las 6x6 combinaciones de forma/color de ojos, con foco en ojos-4/5/6.
- Las 6 categorías de partes (Cabeza/Orejas/Ojos/Nariz/Boca/Cejas) en el nuevo selector de miniaturas, incluyendo el caso de orejas con tamaños muy dispares entre opciones.
- Posición de la mascota en Casa contra la barra de acciones, en escritorio y mobile.
- Título de pestaña, badge y pie de página mostrando "v3.6" tras el login.
- El caso puntual del bug de notificaciones (durmiendo sin alertas de bienestar activas, y aviso de sistema sin alertas ni sueño activos) en escritorio.
- Selector de minijuegos sin "Pelota traviesa"; partida completa de Caza de luciérnagas para confirmar que el motor genérico (compartido con Pesca) no se rompió al sacar esa entrada.
