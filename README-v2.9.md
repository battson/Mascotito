# Mascotito Alpha v2.9

Partiendo de mascotitov2.8-redesign.zip, conserva los recursos gráficos, mecánicas y formato de guardado anteriores.

## Abrir
Descomprimir y abrir index.html en un navegador moderno. También se puede servir la carpeta con cualquier servidor estático. El progreso se guarda localmente por navegador/origen: mantener el mismo origen para conservar la partida.

## Cambios
- Objetivos alineados con Estado y reloj debajo, con 12 px de separación que se recalculan según el tamaño real del panel.
- Botón con icono y texto «Editar mascota».
- Modo prueba como overlay global fijo a pantalla completa, fuera del footer, con foco contenido y cierre por botón/Escape. Las simulaciones no se guardan y al salir se restaura estado y escenario.
- Corregido el acceso a un elemento nulo en el refresco de cooldowns que interrumpía las acciones de hablar, jugar y acariciar.
- Globo de diálogo con altura natural, padding inferior y cola de cómic. Hablar cambia la frase en cada pulsación; conserva la espera de 9 segundos para recibir XP/ánimo, evitando premios duplicados.
- Minijuegos funcionales con apertura, objetivos, tiempos, victoria/derrota, cancelación, recompensas y limpieza de temporizadores. Se mantiene la espera de 25 segundos entre partidas, indicada en el botón. Editar cancela un minijuego activo.
- Acariciar admite click, toque, Enter y espacio, con corazones y ánimo/XP. Durante la espera hay feedback sin duplicar recompensas.
- Creador/editor con vista amplia, controles planos crema/naranja/azul, todas las categorías, aleatorio, validación de nombre, guardar y cancelar.
- Mascota más grande en Casa, Jardín y editor, con proporción cuadrada y capas SVG. Reajuste de su posición al redimensionar.
- En pantallas de poca altura se permite desplazamiento vertical para conservar espacio para HUD, mascota y controles. El dock conserva su desplazamiento horizontal en móviles.

## Validación realizada
Pruebas automatizadas sobre Microsoft Edge/Chromium real, con clicks/toques y comprobaciones del estado resultante; revisión visual de capturas.
- Creación con validación de nombre; siete categorías de apariencia; edición, cancelación, guardado y recarga.
- Hablar: frase visible y diferente, XP y objetivo diario, sin duplicar XP en pulsaciones consecutivas.
- Acariciar: detección de click/toque, corazones, ánimo y XP.
- Pelota y luciérnagas: victorias completas; derrota por tiempo; cancelación por botón y Escape; premios y objetivo diario; temporizadores eliminados al terminar.
- Recompensa diaria de 50 monedas y 100 XP entregada una sola vez.
- Modo prueba: enfermedad, simulación de tiempo, cambio de lugar, aislamiento del guardado y restauración completa al salir.
- Casa → Jardín → Casa; descanso/despertar; mensajes por energía insuficiente o enfermedad; edición durante minijuego.
- Resoluciones: 1440×1000, 1366×768, 768×844, 390×844 y 320×844. Toque emulado, alineación del HUD y ausencia de desbordamiento horizontal de página.
- Sin excepciones JavaScript en los flujos probados. Sintaxis de todos los archivos JS validada.

La fuente web opcional de Google no estuvo disponible en el entorno de pruebas; se validó el funcionamiento con la tipografía de respaldo. No se realizaron pruebas en dispositivos físicos ni Safari.
