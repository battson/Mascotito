# Actualización: usuarios locales

## Comportamiento
- Al entrar por primera vez en esta actualización, se solicita un nombre de usuario antes de iniciar el juego o crear una mascota.
- El nombre admite de 1 a 24 letras, números, guiones y guiones bajos. Se quitan espacios de los extremos y se unifican mayúsculas/minúsculas.
- Si había una partida sin usuario, se copia completa al primer nombre ingresado. El guardado original y su respaldo se conservan intactos.
- El navegador recuerda el usuario. Opciones > Cambiar usuario permite abrir otro perfil; un nombre nuevo comienza una partida independiente.
- Reiniciar progreso solo borra la partida y la copia de recuperación del usuario actual.
- Sigue siendo almacenamiento local, sin contraseña, servidor ni base de datos. Los nombres no se reservan globalmente.

## Instalación
Reemplazar los archivos de la versión anterior por el contenido de esta carpeta. Mantener la misma dirección del sitio (protocolo, dominio y puerto) para que el navegador pueda acceder al localStorage anterior. No borrar los datos del sitio. Si se usa index.html directamente como archivo local, el acceso al guardado puede variar según el navegador y la ruta del archivo.

## Archivos modificados
- index.html: formulario inicial, nombre actual y cambio de usuario.
- css/style.css: estilos del formulario.
- js/users.js (nuevo): selección y persistencia del usuario, claves por perfil y migración.
- js/state.js: carga, guardado, recuperación y reinicio vinculados al perfil activo.
- js/app.js: espera la selección del usuario antes de iniciar y permite cambiar de perfil.

## Estructura para la próxima actualización
Las claves derivan de PET_CONFIG.storageKey:
- .activeUser: nombre recordado por el navegador.
- .user.<nombre codificado>: partida del usuario, con el formato existente.
- .user.<nombre codificado>.recovery: copia automática por usuario.
- .legacyOwner: nombre al que se asignó la partida antigua, para no volver a importarla.

La identidad activa queda en memoria por pestaña: cambiar de usuario en otra pestaña no redirige los guardados de una partida abierta.

## Verificación
Pasaron 10 pruebas automatizadas de lógica: validación del nombre, regreso al perfil, migración completa, aislamiento de usuarios, reinicio sin reimportación, recuperación del guardado antiguo corrupto, respaldo sin principal, fallo de escritura y reintento, aislamiento entre pestañas y recuperación por perfil. Se verificó la sintaxis de JavaScript. No se realizó una prueba visual en navegador.
