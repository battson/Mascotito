# Mascotito Alpha v3.3 — Fase 1: Casa interactiva

Esta versión parte de la v3.2 y convierte la Casa en un espacio con objetos interactivos, sin reemplazar las acciones existentes del HUD.

## Qué se agregó

- **Cama interactiva**: reutiliza `toggleSueño()`; sirve tanto para dormir como para despertar.
- **Plato de comida**: abre el mismo menú de alimentación del HUD y conserva inventario, cooldowns, progreso diario y recompensas.
- **Bebedero**: reutiliza `doBeber()` y por lo tanto conserva exactamente las mismas reglas y estadísticas.
- **Pelota/juguete**: abre el selector existente mediante `doJugar()`.
- **Sillón**: la mascota camina hacia su zona, muestra frases contextuales y puede recibir una mejora pequeña de felicidad/vínculo con un cooldown interno de 30 segundos.
- **Lámpara**: alterna encendida/apagada, modifica sutilmente la iluminación de la Casa y conserva su estado en el guardado.
- Feedback de hover, foco y click para objetos interactivos.
- Tooltips discretos, sin etiquetas permanentes sobre el escenario.
- Posicionamiento relativo en porcentajes para soportar distintos tamaños del escenario.
- Campo de `depth` por objeto para preparar superposición delante/detrás de la mascota.
- Compatibilidad con `prefers-reduced-motion`.

## Arquitectura nueva

### `js/world.js`

Contiene datos de habitaciones y objetos. La lógica de las acciones no está duplicada ahí.

Cada objeto tiene una estructura equivalente a:

```js
{
  id: "bed_01",
  name: "Cama",
  type: "bed",
  room: "casa",
  x: 78,
  y: 64,
  width: 23,
  depth: 3,
  interactive: true,
  action: "sleep"
}
```

`x`, `y` y `width` son valores relativos al escenario. Esto deja preparado el sistema para que una futura versión pueda guardar coordenadas editadas por el jugador.

### `#world-layer`

Nueva capa dentro de `#stage-floor` donde se renderizan los objetos correspondientes al lugar actual.

### Estado persistente

`STATE_VERSION` sube de 5 a 6. Se incorpora:

```js
world: {
  objects: {
    lamp_01: { on: false },
    sofa_01: { lastRewardAt: 0 }
  }
}
```

Los guardados de v3.2 que no tengan `world` se normalizan automáticamente con valores por defecto. No requieren reiniciar el progreso.

Además, al recargar ya se respeta `state.location` en lugar de forzar siempre la Casa.

## Reutilización de lógica existente

Los objetos no tienen sistemas paralelos:

- Cama → `toggleSueño()`
- Plato → `toggleFeedMenu()` / `doComer()` existente
- Bebedero → `doBeber()`
- Pelota → `doJugar()`

Los botones del HUD siguen disponibles y usan exactamente las mismas funciones.

## Cómo agregar un objeto

1. Agregar una entrada a `WORLD_OBJECTS` en `js/world.js`.
2. Definir `room`, posición porcentual y `action`.
3. Si usa arte nuevo, agregar el tipo visual en `worldObjectArt()` y su CSS.
4. Si introduce una mecánica realmente nueva, agregar un caso en `interactWithWorldObject()`; si corresponde a una acción existente, reutilizar esa función.

## Cómo agregar una habitación en el futuro

1. Agregarla a `PET_ROOMS` en `js/world.js`.
2. Agregar su definición de navegación a `PET_LOCATIONS` si debe ser navegable.
3. Agregar el escenario visual correspondiente.
4. Asignar objetos mediante su propiedad `room`.
5. Extender la normalización de datos por lugar sólo si ese nuevo lugar necesita datos persistentes propios (por ejemplo suciedad).

`PET_ROOMS` ya incluye `futureId` para documentar la evolución prevista:

- `casa` → `home_living`
- `jardin` → `home_garden`

No se cambiaron todavía los IDs actuales para evitar romper guardados y lógica existente.

## Archivos modificados

- `index.html`
- `css/style.css`
- `js/app.js`
- `js/state.js`

## Archivos agregados

- `js/world.js`
- `CHANGELOG-v3.3.md`

## Deliberadamente pendiente

No se implementó todavía:

- modo decoración;
- drag & drop;
- compra/venta de muebles;
- inventario generalizado de muebles;
- rotación o escalado de objetos por el jugador;
- dormitorio/baño separados;
- tiendas;
- vestuario;
- multiplayer.

Esas funciones quedan fuera de la Fase 1 y ahora pueden construirse sobre el sistema de objetos sin convertir cada mueble en lógica hardcodeada independiente.
