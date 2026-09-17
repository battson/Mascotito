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

/* v3.4: pedido explícito — "sacar los mobiliarios de la casa (menos la
 * lámpara)... por ahora no los usaremos" + "crear placeholders de items
 * para poner en la casa... Cama, Sofá, Lámpara. Los tres interactivos".
 * Plato/bebedero/pelota se sacaron de la habitación (feed/drink/play
 * siguen disponibles igual desde el dock de acciones, así que no se
 * pierde nada jugable) y cama/sillón vuelven como placeholders (arte
 * nuevo en worldObjectArt(), js/app.js — SVG simple, no CSS-shapes como
 * antes) a la espera de los .ai definitivos que va a mandar el usuario.
 * La lámpara se reubicó arriba de la mesita redonda de la nueva escena
 * (home-scenev2.0.ai, ver HOME_SCENE_INLINE en js/manifest.js) — mesa
 * centrada en x≈41.75%, borde superior del mantel en y≈64% de la escena;
 * x/y de la lámpara se calcularon para que su base (siempre anclada cerca
 * del final de su propio dibujo, igual que antes) quede apoyada ahí. */
const WORLD_OBJECTS = [
  {
    id: "bed_01", name: "Cama", type: "bed", room: "casa",
    x: 83, y: 63, width: 19, depth: 3, interactive: true, action: "sleep",
    art: "bed", tooltip: "Dormir / despertar",
    phrases: ["Creo que una siestita no estaría mal...", "Mi cama se ve muy cómoda."]
  },
  {
    id: "sofa_01", name: "Sillón", type: "sofa", room: "casa",
    x: 61, y: 68, width: 19, depth: 3, interactive: true, action: "sofa",
    art: "sofa", tooltip: "Descansar un rato",
    phrases: ["Este lugar es bastante cómodo.", "Me quedaría acá un ratito.", "Ah... qué cómodo."]
  },
  {
    id: "lamp_01", name: "Lámpara", type: "lamp", room: "casa",
    x: 41.5, y: 57, width: 6.5, depth: 2, interactive: true, action: "lamp",
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
