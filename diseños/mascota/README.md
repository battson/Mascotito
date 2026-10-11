# Mascotas estilo Pet Society / Pet Pals

11 de octubre de 2026. Demo animada: https://claude.ai/artifact/DUuPBwqmvR4hB1riFoRmLr

Esta guía reemplaza las reglas de luz de la guía de brillos anterior. La anatomía de la guía de anatomía se mantiene: cuerpo frijol, articulaciones redondas en los mismos puntos de giro.

**Cambio del 11/10/2026 (v4.6.20), a pedido de Jony: contorno del tono de cada pieza y sombra leve.** Debajo de cada forma base va un trazo del color del cuerpo (clase `borde-color`) con negro al 30 % encima, así el contorno es el mismo color más oscuro; brazos y piernas lo tienen abierto en la unión. Encima va una media luna plana abajo a la derecha, negra al 12 %, recortada a la forma. Sigue sin degradados ni brillos.

**Cambio del 11/10/2026 (v4.6.16), a pedido de Jony: personajes planos, como en Pet Society.** Cada pieza es un solo color, sin degradado, sin brillo en la frente, sin panza clara y sin sombra de la cabeza sobre el cuerpo. Tampoco hay contornos. Los brazos cuelgan un poco hacia afuera para que se distingan del torso por la silueta. Esto reemplaza todo lo de volumen de esta guía.

**Cambio anterior (v4.6.15):** sin contornos, sin hocico blanco ni cachetes rosados, y brillos más suaves: el blanco del degradado baja a **16 %** (antes 34 %), el brillo de la frente a **18 %** (antes 38 %) y la panza a **16 %** (antes 30 %). Donde la tabla de abajo dice otra cosa, vale esto.

## Qué cambia respecto de la guía anterior

| Tema | Antes (guía de brillos) | Ahora (Pet Society / Pet Pals) |
|---|---|---|
| Volumen | Medialunas planas de sombra y de luz | **Degradado radial suave** encima de cada forma: blanco al 34 % arriba a la izquierda que se apaga al 32 %, transparente en el medio y negro al 20 % en el borde. Un solo degradado, sin malla ni forma libre. |
| Contorno | Negro al 24 %, grosor 3 | Negro al **30 %**, grosor 3 a 3,6. Sobre el pelaje queda un tono más oscuro del mismo color, como en Pet Society. |
| Hocico | No existía | Óvalo blanco al **45 %** alrededor de la nariz y la boca. |
| Panza | Blanco al 8 % | Blanco al **30 %**, más grande. |
| Cachetes | No existían | Dos óvalos rosa (#FF6F91) al **32 %**. |
| Brillo de la cabeza | Blanco al 38 % | Igual, más chico. |
| Ojos | Un reflejo extra | Igual: un punto blanco puro extra dentro de la pupila. |
| Sombra de la cabeza sobre el cuerpo | Negro al 18 % | Negro al 14 % (con el degradado ya hay bastante volumen). |

Todo sigue siendo blanco o negro con transparencia, salvo el rosa de los cachetes, que es igual para todos los colores. Así sirve para los 13 colores sin redibujar nada.

**En Illustrator:** el degradado radial se arma con 4 paradas (blanco 34 % → blanco 0 % → negro 0 % → negro 20 %), aplicado a una copia de la forma encima de la capa "-base". Nombre de capa: cabeza-volumen, oreja-volumen, cuerpo-volumen, brazo-volumen, pierna-volumen. No uses modos de fusión: solo la opacidad de las paradas.

## Perspectiva: tres cuartos (decidido por Jony el 11/10/2026)

- **De frente:** la cara queda centrada, como hoy. Es lo más simple, y todas las partes de cara que ya existen sirven tal cual.
- **Tres cuartos:** la cara (ojos, cejas, nariz, boca y hocico) se corre unas 9 unidades hacia un lado, la oreja de atrás queda un 12 % más chica y el brillo se corre con la luz. Se parece más a Pet Society y Pet Pals. Además, cuando camina, el juego ya da vuelta a la mascota hacia donde va, así que siempre mira para adelante. A cambio, todas las caras y orejas se dibujan corridas.

## Animación por piezas (lo que hay que programar)

Lo saqué de las imágenes y de los tramos jugables del video (la carrera y las casas). El video es de baja resolución y casi todo es comentario, así que los tiempos son estimados.

| Animación | Hoy | Propuesta |
|---|---|---|
| Quieta | El cuerpo se balancea ±0,9° y los brazos ±3° | Respira solo el cuerpo (alto +3 %, ancho +1,5 %). La cabeza flota ±1,5° con 0,15 s de retraso, las orejas siguen ±4° con 0,35 s de retraso y los brazos se mueven ±3°. Parpadeo cada 3,6 s. |
| Caminar | Piernas ±28°, brazos ±7°, rebote del 3 % | **Saltito** cada 0,28 s: aplaste al apoyar (ancho 105 %, alto 93 %) y estirón arriba (subida del 5 %). Piernas ±24° y brazos ±20°. La cabeza llega tarde y las orejas todavía más (±7°). La sombra del piso se achica cuando sube. |
| Contenta | No existe | Se agacha (anticipación), salta un 8 % estirada, cae aplastada y rebota. Brazos arriba a 105°, ojos ^^ y orejas que se sacuden. Necesita arte nuevo: ojos cerrados contentos. |
| Saludar | El brazo sube a 80–92° y la mano queda tapada por la cabeza | El brazo sale al costado: 50–72° con sacudones. Cabeza −7° y cuerpo −4°. |

**Para el código:** las orejas tienen que poder girar solas. Ya vienen en grupos oreja-izq y oreja-der: solo falta ponerles el punto de giro en la base y animarlas. Para la cabeza y las orejas con retraso alcanza con animation-delay en CSS. El rebote se aplica al conjunto (como la v4.7 hace con el balanceo), con origen en los pies.

## Arte nuevo que hace falta

1. Torso, brazos y piernas nuevos, con volumen y contorno.
2. Capa de volumen y contorno para las 7 cabezas y las 6 orejas.
3. Hocico y cachetes: una sola pieza para todas las caras, en su propia capa.
4. Ojos contentos (^^) y, más adelante, ojos cerrados para dormir.
5. Si elegís tres cuartos: las caras y orejas corridas.
