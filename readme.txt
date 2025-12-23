========================================================================
                           PROYECTO: LAIN PAGE V2
========================================================================

DESCRIPCIÓN:
Este proyecto es una página web interactiva que simula la interfaz del sistema 
operativo "Copland OS Enterprise", inspirado en la franquicia japonesa
"Serial Experiments Lain".

El objetivo es recrear la estética "Cyberpunk/Retro" de finales de los 90, 
utilizando tecnologías web modernas para simular un entorno de escritorio 
funcional, dinámico y conectado a un servidor local.

CARACTERÍSTICAS PRINCIPALES:

1. Interfaz de Ventanas (GUI):
   - Sistema de ventanas arrastrables y flotantes.
   - Funcionalidad de minimizar: Las ventanas se colapsan en la barra de tareas superior.
   - Gestión de capas (Z-index): La ventana activa siempre se trae al frente al hacer clic.
   - Animaciones de apertura ("Pop") y minimizado fluido.

2. Aplicaciones Simuladas:
   - [ Home ]: Explorador de archivos dinámico. Carga la lista de archivos reales desde el servidor.
   - [ Chat ]: Simulación de terminal de chat con scroll automático y respuestas programadas.
   - [ Video ]: Reproductor con botón de Mute flotante e inicio automático silencioso.
   - [ Console ]: Visualizador de audio (Spectrum Analyzer) usando Canvas API y Web Audio API.
   - [ Terminal ]: Intérprete de comandos con funcionalidades ocultas (Easter Eggs).
   - [ Notepad ]: Editor de texto funcional con capacidad de guardar cambios en el servidor (/api/save).
   - [ Image ]: Visor de imágenes dinámico.

3. Barra de Tareas y Menús Inteligentes:
   - Menú "AI lain Pass": Lógica inteligente que detecta si una ventana está cerrada, 
     minimizada o abierta para actuar en consecuencia (abrir, restaurar o enfocar).
   - Reloj en tiempo real: Situado en la barra inferior, sincronizado con la hora local.
   - Barra de tareas superior: Muestra las aplicaciones activas minimizadas.

4. Estética Visual Avanzada:
   - Efecto "Scanlines" con animación de desplazamiento vertical (scrolling).
   - Efecto "Glitch" aleatorio en textos y títulos.
   - Paleta de colores fiel a la serie (Lain Cyan).
   - Tipografía retro (VT323).

REQUISITOS:
Para ejecutar este proyecto localmente, necesitas tener instalado:
- Node.js.

INSTALACIÓN Y EJECUCIÓN:
Este proyecto utiliza un backend con Express para servir los archivos dinámicamente 
y gestionar la persistencia de datos.

1. Abre la terminal en la carpeta del proyecto.
2. Instala las dependencias necesarias:
   npm install
3. Inicia el servidor local:
   node server.js
4. Abre tu navegador y visita:
   http://localhost:3000

NOTAS DE USO:

* CONTROLES:
  - Arrastrar: Clic y mantener sobre la barra de título de cualquier ventana.
  - Minimizar: Botón [_]. La ventana irá a la barra superior.
  - Restaurar: Clic en el ítem de la barra superior o desde el menú "AI lain Pass".
  - Mute Video: Botón flotante [🔇] sobre el video.

* COMANDOS DE TERMINAL:
  Escribe 'help' para ver la lista.

TECNOLOGÍAS:
- Frontend: HTML5, CSS3, JavaScript "Vanilla".
- Multimedia: Canvas API, Web Audio API.
- Backend: Node.js + Express.