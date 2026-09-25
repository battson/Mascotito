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
 * Uso: iconSvg("dado") devuelve el <svg> completo listo para insertar
 * (innerHTML/insertAdjacentHTML) — usa fill="currentColor"/stroke=
 * "currentColor", así hereda el color de texto de donde se lo ponga sin
 * necesitar tocar el SVG por fuera.
 */
const PET_ICONS = {
  // Aleatorio: dado (botón del creador). Beta v4.6.1: se quitaron los
  // íconos que ya no usaba ninguna pantalla (las acciones usan assets/ui/).
  dado: '<rect x="4" y="4" width="16" height="16" rx="3.2"/><circle cx="8.6" cy="8.6" r="1.15" fill="currentColor" stroke="none"/><circle cx="15.4" cy="8.6" r="1.15" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none"/><circle cx="8.6" cy="15.4" r="1.15" fill="currentColor" stroke="none"/><circle cx="15.4" cy="15.4" r="1.15" fill="currentColor" stroke="none"/>',
};

/** Devuelve el <svg> completo de un icono. `cls` son clases extra (además
 * de "icon", que ya trae el tamaño/alineación base — ver css/style.css). */
function iconSvg(name, cls) {
  const inner = PET_ICONS[name];
  if (!inner) return "";
  return `<svg class="icon${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
}
