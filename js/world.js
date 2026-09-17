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

const WORLD_OBJECTS = [
  {
    id: "bed_01", name: "Cama", type: "bed", room: "casa",
    x: 78, y: 64, width: 23, depth: 3, interactive: true, action: "sleep",
    art: "bed", tooltip: "Dormir / despertar",
    phrases: ["Creo que una siestita no estaría mal...", "Mi cama se ve muy cómoda."]
  },
  {
    id: "sofa_01", name: "Sillón", type: "sofa", room: "casa",
    x: 46, y: 57, width: 22, depth: 3, interactive: true, action: "sofa",
    art: "sofa", tooltip: "Descansar un rato",
    phrases: ["Este lugar es bastante cómodo.", "Me quedaría acá un ratito.", "Ah... qué cómodo."]
  },
  {
    id: "food_bowl_01", name: "Plato", type: "food_bowl", room: "casa",
    x: 64, y: 76, width: 8, depth: 5, interactive: true, action: "feed",
    art: "food-bowl", tooltip: "Alimentar",
    phrases: ["¿Hay algo rico para comer?", "Creo que podría comer algo..."]
  },
  {
    id: "water_bowl_01", name: "Bebedero", type: "water_bowl", room: "casa",
    x: 71, y: 77, width: 8, depth: 5, interactive: true, action: "drink",
    art: "water-bowl", tooltip: "Beber",
    phrases: ["¡Justo tenía sed!", "Un poco de agua me vendría bien."]
  },
  {
    id: "toy_01", name: "Pelota", type: "toy", room: "casa",
    x: 35, y: 76, width: 6, depth: 5, interactive: true, action: "play",
    art: "toy", tooltip: "Jugar",
    phrases: ["¡Vamos a jugar!", "¿Jugamos un rato?", "¡Esa pelota es mía!"]
  },
  {
    id: "lamp_01", name: "Lámpara", type: "lamp", room: "casa",
    x: 18, y: 53, width: 9, depth: 2, interactive: true, action: "lamp",
    art: "lamp", tooltip: "Prender / apagar",
    phrases: ["Mucho mejor así.", "Qué linda luz."]
  },
];

function getRoomDef(id) {
  return PET_ROOMS[id] || PET_ROOMS.casa;
}

function getRoomObjects(roomId) {
  return WORLD_OBJECTS.filter((obj) => obj.room === roomId);
}
