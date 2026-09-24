# Pendientes de rediseño UI

## Alcance actual

- v4.4 cerrada (celular de Contactos, inventario cofre, vestidor). v4.5: rediseño de la ficha del personaje (plegable, nivel y XP adentro) y notificaciones en burbuja.
- Beta v4.3 en curso, de a un paso por entrega. Hecho: ícono de Contactos, + (con Solicitudes adentro) y − (v4.3); Aceptar/Rechazar, Visitar, Chat, Enviar como íconos y pantalla renombrada a Contactos (v4.3.1). Hecho en v4.3.2: celular con Contactos y chat según referencia.png, mascota de cada contacto con aro de conexión, casita para la sala, emojis en la huellita, menú «•••» (Visitar/Eliminar), huella del marco como inicio, ✓ para Aceptar y lupa para Buscar. v4.3.3: ventana vieja de Amigos integrada al celular (lupa = Buscar, + = Solicitudes sólo con pendientes, Eliminar en «•••» con confirmación), marco arriba con pantalla transparente, sin emojis. Limpieza pendiente: borrar assets/ui/phone/accept.svg (sin uso) y las reglas CSS de la ventana vieja de Amigos (#friends-panel, .friends-tabpanel), que ya no tienen HTML.
- Cada actualización debe entregarse con capturas de pantalla que muestren los cambios solicitados.

- Inventario v4.2.9: ventana simplificada de windowsv2.ai, sólo consumibles, cierre discreto en la esquina superior derecha; no tiene categorías.

- Priorizar escritorio. No dedicar trabajo a adaptación o revisión móvil por ahora.
- La experiencia móvil se definirá en una versión específica futura. El usuario contempla un juego principalmente de escritorio y funciones limitadas en celular; esas funciones todavía no están decididas.
- La barra de acciones de v4.1 queda aprobada con el diseño actual. El usuario se encarga de subir esta versión.

Recordar al usuario el pendiente correspondiente al comenzar el rediseño de cada sección. Preferencia acordada: eliminar subrayados y guiones inferiores como recurso visual. Las alternativas siguientes son propuestas, todavía no decisiones aprobadas.

- [ ] Editor de mascota: reemplazar los guiones de hover y selección en partes y colores. Propuesta: aumento suave en hover y borde completo para selección.
- [ ] Ropa y Tienda: reemplazar el subrayado naranja de las pestañas y subcategorías activas. Inventario ya no tiene subrayados (v4.2.6).
- [x] Inventario v4.2.9: marco simplificado integrado y objetos de vivienda reunidos en Decorar casa, accesible desde el encabezado. Cierra la serie v4.2; la siguiente etapa es v4.3.
- [ ] Formularios: reemplazar la línea inferior de los campos de nombre, usuario, PIN y búsqueda de amigos. Propuesta: borde completo con esquinas redondeadas.
- [x] Barra de acciones: resplandor para panel abierto aprobado por ahora con la intensidad actual. Sombra inferior descartada. Sin subrayado ni fondo; se conserva el estado accesible.

## Para cerrar la barra de acciones de Beta v4.1

- v4.2.3: tamaño de los íconos duplicado por pedido del usuario; botones ampliados para contenerlos. Se conservan los dos grupos y su separación.
- Resplandor aprobado por ahora; mantener los iconos sin sombra inferior.
- Ya implementado: SVG sin nombres ni fondos, dos grupos (Inventario/Ropa/Tienda y Dormir/Jugar/Limpiar), hover, luna/sol y cooldown con icono atenuado y contador superpuesto.
