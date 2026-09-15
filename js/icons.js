/**
 * v2.1: conjunto de iconos SVG propios (sección 5 del pedido: "crear un
 * conjunto coherente de iconos SVG... consistentes en tamaño/trazo...
 * controles principales con icono+texto, sin depender de emojis"). Antes
 * cada botón usaba un emoji suelto (🍽️, 💧, 😴...) — el problema con eso,
 * más allá del look, es que el renderizado de emoji varía de fuente/SO en
 * SO (pedido explícito de evitarlo). Estos son ilustrativos simples pero
 * 100% propios: un solo estilo de trazo (viewBox 24x24, stroke-width 1.8,
 * puntas redondeadas, sin relleno salvo los puntitos del dado) para que se
 * sientan de la misma familia en toda la interfaz.
 *
 * Uso: iconSvg("comer") devuelve el <svg> completo listo para insertar
 * (innerHTML/insertAdjacentHTML) — usa fill="currentColor"/stroke=
 * "currentColor", así hereda el color de texto de donde se lo ponga sin
 * necesitar tocar el SVG por fuera.
 */
const PET_ICONS = {
  // Alimentación: un bowl con un poco de vapor arriba.
  comer: '<path fill="currentColor" stroke="none" d="M4.2 10.2h15.6c-.4 5.2-3.5 8.3-7.8 8.3s-7.4-3.1-7.8-8.3Zm3.2-3.4c.8-1.9 2.2-3 4.6-3s3.8 1.1 4.6 3H7.4Z"/>',
  // Bebida: una gota.
  beber: '<path fill="currentColor" stroke="none" d="M12 2.8c-2.2 3.2-6.3 7.6-6.3 12a6.3 6.3 0 1 0 12.6 0c0-4.4-4.1-8.8-6.3-12Zm-2.8 12c0 1.7 1.1 3 2.6 3.5-2.7.4-4.5-1.2-4.5-3.5 0-1.5.8-3 2.1-4.8-.2 1.6-.2 3.2-.2 4.8Z"/>',
  // Limpieza (baño + entorno): gota + un brillito, para diferenciarla de "beber".
  limpiar: '<path fill="currentColor" stroke="none" d="M9.5 4.3c-2 2.9-4.7 6.1-4.7 9.1a4.8 4.8 0 0 0 9.6 0c0-3-2.8-6.2-4.9-9.1Zm8.2-.6.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Zm1 8.4.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6.6-1.5Z"/>',
  // Sueño: luna.
  dormir: '<path fill="currentColor" stroke="none" d="M19.9 14.1A8.6 8.6 0 0 1 9.8 3.5 8.7 8.7 0 1 0 20.5 14c-.2.1-.4.1-.6.1Z"/>',
  // Despertar: sol.
  despertar: '<path fill="currentColor" stroke="none" d="M12 6.8A5.2 5.2 0 1 0 12 17.2 5.2 5.2 0 0 0 12 6.8Zm0-4.8 1.1 2.7h-2.2L12 2Zm0 20-1.1-2.7h2.2L12 22ZM2 12l2.7-1.1v2.2L2 12Zm20 0-2.7 1.1v-2.2L22 12ZM4.9 4.9l2.7 1.1L6 7.6 4.9 4.9Zm14.2 14.2-2.7-1.1 1.6-1.6 1.1 2.7Zm0-14.2L18 7.6 16.4 6l2.7-1.1ZM4.9 19.1 6 16.4 7.6 18l-2.7 1.1Z"/>',
  // Jugar: pelota con costuras curvas.
  jugar: '<path fill="currentColor" stroke="none" d="M12 3.2a8.8 8.8 0 1 0 0 17.6 8.8 8.8 0 0 0 0-17.6Zm0 2c1.2 0 2.4.3 3.4.9l-2.1 2.8H10.7L8.6 6.1A6.7 6.7 0 0 1 12 5.2Zm-5.8 4.1 3.2 1.1.8 2.5-2 2.8a6.8 6.8 0 0 1-2-6.4Zm5.8 9.5c-.9 0-1.8-.2-2.6-.5l1.8-2.9h1.6l1.8 2.9c-.8.3-1.7.5-2.6.5Zm3.8-3.1-2-2.8.8-2.5 3.2-1.1a6.8 6.8 0 0 1-2 6.4Z"/>',
  // Afecto / acariciar: corazón.
  afecto: '<path d="M12 20.3s-7.3-4.5-9.8-9C.8 7.7 2.6 4 6.3 4c2.1 0 3.6 1.2 4.7 2.8C12.1 5.2 13.6 4 15.7 4c3.7 0 5.5 3.7 4.1 7.3-2.5 4.5-9.8 9-9.8 9Z"/>',
  // Hablar: globo de diálogo.
  hablar: '<path fill="currentColor" stroke="none" d="M4 4.5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9.6L5 20.1v-3.6H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Zm4.2 5.3a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm3.8 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm3.8 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z"/>',
  // Salud: cruz médica en círculo.
  salud: '<circle cx="12" cy="12" r="9"/><path d="M12 7.8v8.4M7.8 12h8.4"/>',
  // Medicina: cápsula.
  medicina: '<path fill="currentColor" stroke="none" d="M7 18a5 5 0 0 1 0-7.1l4-4a5 5 0 0 1 7.1 7.1l-4 4A5 5 0 0 1 7 18Zm1.4-1.4a3 3 0 0 0 4.2 0l1.6-1.6L9 9.8l-1.6 1.6a3 3 0 0 0 1 5.2Z"/>',
  // Navegación: puerta con picaporte.
  puerta: '<rect x="6" y="2.8" width="12" height="18.4" rx="1.2"/><circle cx="14.6" cy="12" r="1" fill="currentColor" stroke="none"/>',
  // Ubicación (etiqueta "Estás en: ...").
  ubicacion: '<path d="M12 21s7-7.6 7-12.3A7 7 0 1 0 5 8.7C5 13.4 12 21 12 21Z"/><circle cx="12" cy="8.7" r="2.3"/>',
  // Opciones: control deslizante (equivalente a "ajustes").
  opciones: '<path d="M9.6 3.7 10.2 2h3.6l.6 1.7 1.8.8 1.6-.8 2.5 2.5-.8 1.6.8 1.8 1.7.6v3.6l-1.7.6-.8 1.8.8 1.6-2.5 2.5-1.6-.8-1.8.8-.6 1.7h-3.6l-.6-1.7-1.8-.8-1.6.8-2.5-2.5.8-1.6-.8-1.8-1.7-.6v-3.6l1.7-.6.8-1.8-.8-1.6 2.5-2.5 1.6.8 1.8-.8Z"/><circle cx="12" cy="12" r="3"/>',
  // Editar: lápiz.
  editar: '<path d="M4 20l.9-4.3L15.4 5.2l3.4 3.4L8.3 19.1 4 20Z"/><path d="M13.2 7.3l3.5 3.5"/>',
  // Cerrar: X.
  cerrar: '<path d="M6 6l12 12M18 6 6 18"/>',
  // Confirmar: check.
  check: '<path d="M4.2 12.6l4.8 4.8L19.8 6.6"/>',
  // Aleatorio: dado.
  dado: '<rect x="4" y="4" width="16" height="16" rx="3.2"/><circle cx="8.6" cy="8.6" r="1.15" fill="currentColor" stroke="none"/><circle cx="15.4" cy="8.6" r="1.15" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="8.6" cy="15.4" r="1.15" fill="currentColor" stroke="none"/><circle cx="15.4" cy="15.4" r="1.15" fill="currentColor" stroke="none"/>',
  // Reiniciar: flecha circular.
  reiniciar: '<path d="M4 12a8 8 0 1 1 2.6 5.9"/><path d="M4 17.5V13h4.5"/>',
  // Energía: rayo (necesidad de la barra "Energía", distinto de "dormir").
  energia: '<path d="M12.8 3 6 13.2h4.6L10.2 21 18 10h-4.8L12.8 3Z"/>',
  // Felicidad: carita sonriente.
  felicidad: '<circle cx="12" cy="12" r="9"/><path d="M8.3 14.2c1 1.2 2.3 1.8 3.7 1.8s2.7-.6 3.7-1.8"/><path d="M9 9.5h.01M15 9.5h.01"/>',
  // Reloj (v2.2, encabezado): círculo con agujas.
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  // Flecha simple (una sola punta). v2.5: se usó para el acordeón del
  // panel de bienestar; v2.6: ese acordeón se sacó (el panel queda
  // siempre visible, pedido explícito) así que este ícono quedó sin uso
  // por ahora — se deja definido por si hace falta en otro lado.
  flecha: '<path d="M9 5.5 15.5 12 9 18.5"/>',
};

/** Devuelve el <svg> completo de un icono. `cls` son clases extra (además
 * de "icon", que ya trae el tamaño/alineación base — ver css/style.css). */
function iconSvg(name, cls) {
  const inner = PET_ICONS[name];
  if (!inner) return "";
  return `<svg class="icon${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
}
