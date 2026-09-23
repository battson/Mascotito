# Pendientes de rediseño UI

## Alcance actual

- Cada actualización debe entregarse con capturas de pantalla que muestren los cambios solicitados.

- Botones de cierre: usar fondo circular del mismo color que la ventana que cierran y sombra `#000000 0 0 2px 0px`. En Inventario el fondo es `#f7e0cb`; reutilizar esta regla al crear o rediseñar cierres.

- Priorizar escritorio. No dedicar trabajo a adaptación o revisión móvil por ahora.
- La experiencia móvil se definirá en una versión específica futura. El usuario contempla un juego principalmente de escritorio y funciones limitadas en celular; esas funciones todavía no están decididas.
- La barra de acciones de v4.1 queda aprobada con el diseño actual. El usuario se encarga de subir esta versión.

Recordar al usuario el pendiente correspondiente al comenzar el rediseño de cada sección. Preferencia acordada: eliminar subrayados y guiones inferiores como recurso visual. Las alternativas siguientes son propuestas, todavía no decisiones aprobadas.

- [ ] Editor de mascota: reemplazar los guiones de hover y selección en partes y colores. Propuesta: aumento suave en hover y borde completo para selección.
- [ ] Inventario, Ropa y Tienda: reemplazar el subrayado naranja de las pestañas y subcategorías activas. Propuesta: fondo de color suave.
- [ ] Inventario v4.2: revisar el marco integrado de windows.ai y después diseñar las categorías. El acceso Decorar casa fue retirado por pedido del usuario; su nueva ubicación o funcionamiento queda por definir con su propuesta.
- [ ] Formularios: reemplazar la línea inferior de los campos de nombre, usuario, PIN y búsqueda de amigos. Propuesta: borde completo con esquinas redondeadas.
- [x] Barra de acciones: resplandor para panel abierto aprobado por ahora con la intensidad actual. Sombra inferior descartada. Sin subrayado ni fondo; se conserva el estado accesible.

## Para cerrar la barra de acciones de Beta v4.1

- v4.2.3: tamaño de los íconos duplicado por pedido del usuario; botones ampliados para contenerlos. Se conservan los dos grupos y su separación.
- Resplandor aprobado por ahora; mantener los iconos sin sombra inferior.
- Ya implementado: SVG sin nombres ni fondos, dos grupos (Inventario/Ropa/Tienda y Dormir/Jugar/Limpiar), hover, luna/sol y cooldown con icono atenuado y contador superpuesto.
