/**
 * Mascotito v3.3 - Fase 1: mundo/objetos de habitación.
 *
 * Este archivo describe contenido, no lógica: habitaciones, objetos,
 * posiciones relativas y metadatos de interacción. La lógica vive en
 * js/app.js para que los objetos reutilicen exactamente las mismas acciones
 * del HUD. En una fase futura estas coordenadas pueden salir del save para
 * habilitar modo decoración sin cambiar el formato base de los objetos.
 */

const PET_ROOMS = {
  casa: { id: "casa", futureId: "home_living", label: "Living", kind: "home" },
  jardin: { id: "jardin", futureId: "home_garden", label: "Jardín", kind: "home" },
};

/* v3.5: pedido explícito — "quitar los items interactivos: lampara/cama/
 * sillón de la casa". Los placeholders de v3.4 (nunca llegaron a tener
 * arte definitivo) se sacan del todo. Ya no queda nada en js/app.js que
 * llame a getRoomObjects()/getRoomDef() (quedan definidas, sin uso, por si
 * una fase futura reintroduce objetos de habitación). Dormir sigue
 * disponible desde el botón "Dormir" del dock de acciones (toggleSueño en
 * js/app.js), que nunca dependió de la cama. */
const WORLD_OBJECTS = [];

function getRoomDef(id) {
  return PET_ROOMS[id] || PET_ROOMS.casa;
}

function getRoomObjects(roomId) {
  return WORLD_OBJECTS.filter((obj) => obj.room === roomId);
}
