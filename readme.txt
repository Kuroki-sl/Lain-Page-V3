=========================================================================================================================
                                                 PROYECTO: LAIN PAGE V3
=========================================================================================================================

DESCRIPCIÓN:
Este proyecto es una página web interactiva que simula la interfaz del sistema 
operativo "Copland OS Enterprise", inspirado en la franquicia japonesa
"Serial Experiments Lain".

El objetivo es recrear la estética "Cyberpunk/Retro" de finales de los 90, 
utilizando tecnologías web modernas para simular un entorno de escritorio 
funcional, dinámico y conectado a un servidor en tiempo real.

CARACTERÍSTICAS PRINCIPALES:

1. Interfaz de Ventanas (GUI):
   - Sistema de ventanas arrastrables y flotantes.
   - Funcionalidad de minimizar: Las ventanas se colapsan en la barra de tareas superior.
   - Gestión de capas (Z-index): La ventana activa siempre se trae al frente al hacer clic.
   - Animaciones de apertura ("Pop") y minimizado fluido.

2. Aplicaciones y Protocolos de "The Wired":
   - [ Home ]: Explorador de archivos que carga la lista en tiempo real desde el servidor.
   - [ Wired Chat ]: Chat real mediante Socket.io con asignación de color única por usuario.
   - [ Video Player ]: Reproductor con botón de Mute flotante e inicio automático.
   - [ Console ]: Visualizador de audio (Spectrum Analyzer) usando Canvas API.
   - [ Terminal ]: Intérprete de comandos (help, setuser, whoami, lain, etc.) con prefijo de usuario dinámico.
   - [ Wired Signal ]: Widget de monitoreo de red que visualiza la señal de la red mediante Canvas.
   - [ Notepad ]: Editor de texto con capacidad de guardado persistente en el servidor.

3. Sistema de Identidad:
   - Persistencia de usuario: El sistema recuerda tu nombre mediante localStorage.
   - Sincronización global: El nombre de usuario se actualiza en tiempo real en la terminal, el chat y la barra inferior.

4. Estética Visual Avanzada:
   - Simulación de encendido CRT: Efecto de línea blanca al cargar el sistema.
   - Efecto "Scanlines" y "Glitch" aleatorio en elementos de la interfaz.
   - Reloj digital en formato de 24 horas.
   - Tipografía retro (VT323) y paleta de colores "Lain Cyan".

REQUISITOS:
Para ejecutar este proyecto localmente, necesitas:
- Node.js instalado.

INSTALACIÓN Y EJECUCIÓN:
1. Abre la terminal en la carpeta del proyecto.
2. Instala las dependencias (Express y Socket.io):
   npm install
3. Inicia el servidor de "The Wired":
   node server.js
4. Accede vía:
   http://localhost:3000 

NOTAS DE USO:
- Escribe 'setuser [tu_nombre]' en la terminal para cambiar tu identidad en la red.
- Escribe 'close the world' en la terminal para ejecutar el Protocolo de Capa 07 (Easter Egg).

TECNOLOGÍAS:
- Frontend: HTML5, CSS3, JavaScript "Vanilla".
- Tiempo Real: Socket.io.
- Multimedia: Canvas API, Web Audio API.
- Backend: Node.js + Express.