document.addEventListener("DOMContentLoaded", () => {
    let socket;
    try {
        socket = io();
    } catch (e) {
        console.warn("Modo Offline: Socket.io no encontrado");
    }

    //Efecto de encendido
    const crtOverlay = document.getElementById('crt-overlay');
    if (crtOverlay) {
        setTimeout(() => {
            crtOverlay.style.display = 'none';
        }, 700);
    }

    //Usuario local
    let userName = localStorage.getItem('wired_user'); 
    //Primera vez asignado por defecto
    if (!userName) {
        userName = "User_" + Math.floor(Math.random() * 1000);
        localStorage.setItem('wired_user', userName);
    }

    const userColor = `hsl(${userName.length * 40 % 360}, 70%, 60%)`;

    //Variables de estado globales
    const taskbarArea = document.getElementById('taskbar-area');
    const bootScreen = document.getElementById('boot-screen');
    const audioPlayer = document.getElementById('audio-player');
    const termLog = document.querySelector('.term-log');

    let highestZ = 100;
    let currentEditingFile = "";

    //Flags de estado
    let isSystemStarted = false;
    let hasAutoStartRun = false;
    let foundMusic = null;
    let foundVideo = null;

    //Variables de audio
    let audioCtx, analyser, source;

    //Definiciones de funciones
    
    let netData = new Array(50).fill(50);
    let canvasCtx = null;

    function initNetGraph() {
        const canvas = document.getElementById('net-canvas');
        if (canvas) {
            canvasCtx = canvas.getContext('2d');
            requestAnimationFrame(drawNetGraph);
        }
    }

    function drawNetGraph() {
        if (!document.getElementById('win-sysmon')) return;
        let lastVal = netData[netData.length - 1];
        let change = (Math.random() * 20) - 10;
        let newVal = Math.max(10, Math.min(90, lastVal + change));
        netData.shift();
        netData.push(newVal);

        const valIn = document.getElementById('val-in');
        const valOut = document.getElementById('val-out');
        const sigText = document.getElementById('signal-text');
        
        if(valIn) valIn.innerText = Math.floor(newVal * 12);
        if(valOut) valOut.innerText = Math.floor(newVal * 8);
        if(sigText) {
            if(newVal > 80) sigText.innerText = "SURGE";
            else if(newVal < 20) sigText.innerText = "WEAK";
            else sigText.innerText = "STABLE";
        }

        if (canvasCtx) {
            const width = 280; // Ancho interno definido en HTML
            const height = 100;
            

            canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            canvasCtx.fillRect(0, 0, width, height);
            
            canvasCtx.strokeStyle = '#003f5c';
            canvasCtx.lineWidth = 0.5;
            canvasCtx.beginPath();
            for(let i=0; i<width; i+=20) { canvasCtx.moveTo(i,0); canvasCtx.lineTo(i,height); }
            for(let i=0; i<height; i+=20) { canvasCtx.moveTo(0,i); canvasCtx.lineTo(width,i); }
            canvasCtx.stroke();

            canvasCtx.strokeStyle = 'var(--lain-cyan)';
            canvasCtx.strokeStyle = '#009fe9'; 
            canvasCtx.lineWidth = 2;
            canvasCtx.beginPath();
            
            const step = width / (netData.length - 1);
            
            for (let i = 0; i < netData.length; i++) {
                const x = i * step;
                const y = height - netData[i];
                if (i === 0) canvasCtx.moveTo(x, y);
                else canvasCtx.lineTo(x, y);
            }
            canvasCtx.stroke();
        }
        requestAnimationFrame(drawNetGraph);
    }

    //Gestion de ventanas
    function bringToFront(win) {
        highestZ++;
        win.style.zIndex = highestZ;
    }

    //Window como global
    window.openWindow = function (windowId) {
        const win = document.getElementById(windowId);
        if (!win) return;

        //traer al frente
        win.style.display = 'flex';
        win.classList.remove('minimizing');
        bringToFront(win);

        const existingTaskItem = document.querySelector(`.taskbar-item[data-win-id="${windowId}"]`);
        if (existingTaskItem) existingTaskItem.remove();

        //Reanudar reproduccion
        const media = win.querySelectorAll('video, audio');
        media.forEach(m => {
            if (m.getAttribute('src') || m.src) {
                m.play().catch(e => { });
            }
        });

        //Visual
        win.style.transform = "scale(1.02)";
        setTimeout(() => win.style.transform = "scale(1)", 150);
        document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    };

    function minimizeWindow(win) {
        win.classList.add('minimizing');

        //Pausar
        const media = win.querySelectorAll('video, audio');
        media.forEach(m => m.pause());

        //Mandar a la barra de tareas
        const titleEl = win.querySelector('.title');
        const winTitle = titleEl.getAttribute('data-text') || titleEl.innerText;

        const taskItem = document.createElement('div');
        taskItem.className = 'taskbar-item';
        taskItem.innerText = winTitle;
        taskItem.setAttribute('data-win-id', win.id);

        taskItem.onclick = () => {
            window.openWindow(win.id);
        };

        taskbarArea.appendChild(taskItem);
        setTimeout(() => win.style.display = 'none', 300);
    }

    function closeWindow(win) {
        win.style.display = 'none';
        const media = win.querySelectorAll('video, audio');
        media.forEach(m => {
            m.pause();
            m.currentTime = 0;
        });
    }

    //Arrastre
    function dragElement(elmnt, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        handle.onmousedown = dragMouseDown;
        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
            bringToFront(elmnt);
        }
        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    function toggleVideoMute(win, btn) {
        const vid = win.querySelector('video');
        if (vid) {
            vid.muted = !vid.muted;
            btn.innerText = vid.muted ? '🔇' : '🔊';
        }
    }

    //Archivos
    
    //Manejo de diferentes tipos de archivos
    const fileHandlers = {
        mp4: (path) => {
            openWindow('win-video');
            const video = document.querySelector('#win-video video');
            const muteBtn = document.getElementById('video-overlay-mute');
            video.src = path;
            video.currentTime = 0;
            video.muted = true;
            if (muteBtn) muteBtn.innerText = '🔇';
            video.play().catch(e => { });
        },
        mp3: (path) => {
            openWindow('win-console');
            audioPlayer.src = path;
            audioPlayer.play().then(() => initAudioSystem()).catch(e => { });
        },
        txt: (path, filename) => {
            openWindow('win-notepad');
            currentEditingFile = filename;
            document.getElementById('notepad-title').innerText = `[ ${filename} ]`;
            fetch(path)
                .then(res => res.text())
                .then(text => document.getElementById('notepad-content').value = text);
        },
        img: (path, filename) => {
            openWindow('win-image');
            const imgDisplay = document.getElementById('image-display');
            const imgTitle = document.getElementById('image-title');
            imgDisplay.src = path;
            const label = `[ ${filename} ]`;
            imgTitle.setAttribute('data-text', label);
            imgTitle.innerText = label;
        }
    };

    function openFile(filename, timeStamp = "") {
        const ext = filename.split('.').pop().toLowerCase();
        const path = `/home/${filename}${timeStamp}`;
        const type = ['jpg', 'jpeg', 'png', 'gif'].includes(ext) ? 'img' : ext;

        if (fileHandlers[type]) fileHandlers[type](path, filename);
        else alert("System Error: Unknown format protocol.");
    }

    //Coneccion con HOME
    window.loadFiles = function () {
        fetch('/api/files?t=' + new Date().getTime())
            .then(res => res.json())
            .then(files => {
                const container = document.getElementById('file-list');
                container.innerHTML = "";
                const timeStamp = "?t=" + new Date().getTime();

                //Clasificacion
                if (files.includes('fondo.jpg')) {
                    document.querySelector('.desktop-background').style.backgroundImage = `url('/home/fondo.jpg${timeStamp}')`;
                }
                if (files.includes('musica.mp3')) {
                    foundMusic = `/home/musica.mp3${timeStamp}`;
                }
                if (files.includes('video.mp4')) {
                    foundVideo = `/home/video.mp4${timeStamp}`;
                }

                if (isSystemStarted) tryAutoStart();

                if (files.length === 0) {
                    container.innerHTML = "<p style='width:100%'>Directory empty.</p>";
                    return;
                }

                //Generar iconos
                files.forEach(file => {
                    const div = document.createElement('div');
                    div.className = 'file-item';
                    let icon = "📄";
                    const ext = file.split('.').pop().toLowerCase();
                    if (ext === 'mp3') icon = "🎵";
                    else if (ext === 'mp4') icon = "🎞️";
                    else if (['jpg', 'png', 'gif', 'jpeg'].includes(ext)) icon = "🖼️";

                    div.innerHTML = `<span class="file-icon">${icon}</span><span class="file-name">${file}</span>`;
                    div.onclick = () => openFile(file, timeStamp);
                    container.appendChild(div);
                });
            })
            .catch(err => console.error(err));
    };

    //Audio

    function initAudioSystem() {
        if (audioCtx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaElementSource(audioPlayer);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 256;
        visualizeAudio();
    }

    //Animacion del audio
    function visualizeAudio() {
        if (!analyser) return;
        requestAnimationFrame(visualizeAudio);
        const canvas = document.getElementById('audio-visualizer');
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            let barHeight = dataArray[i] / 2;
            ctx.fillStyle = '#009fe9b4';
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }

    function tryAutoStart() {
        if (!isSystemStarted || hasAutoStartRun) return;

        if (foundMusic) {
            audioPlayer.src = foundMusic;
            audioPlayer.volume = 0.3;
            audioPlayer.play()
                .then(() => initAudioSystem())
                .catch(e => { console.log("Audio autoplay prevented"); });
        }

        if (foundVideo) {
            const vid = document.querySelector('.video-player');
            const muteBtn = document.getElementById('video-overlay-mute');

            if (vid) {
                vid.src = foundVideo;
                openWindow('win-video');
                vid.muted = true;
                if (muteBtn) muteBtn.innerText = '🔇';
                vid.play().catch(e => { console.log("Video autoplay blocked", e) });
            }
        }
        hasAutoStartRun = true;
    }

    //Efectos y Detalles

    function triggerRandomGlitch() {
        const glitchElements = document.querySelectorAll('.glitch');
        if (glitchElements.length > 0) {
            const randomEl = glitchElements[Math.floor(Math.random() * glitchElements.length)];
            randomEl.classList.add('glitch-active');
            setTimeout(() => randomEl.classList.remove('glitch-active'), 300 + Math.random() * 500);
        }
        setTimeout(triggerRandomGlitch, 2000 + Math.random() * 4000);
    }

    function updateClock() {
        const now = new Date();
        const clockEl = document.getElementById('clock');
        if (clockEl) {
            clockEl.innerText = now.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit', 
                hour12: false 
            });
        }
    }

    function printToTerminal(text, withUser = false) {
        const p = document.createElement('p');
        if (withUser) {
            const current = localStorage.getItem('wired_user') || userName;
            p.innerHTML = `<span>${current}@wired:~$</span> ${text}`;
        } else {
            p.innerText = text;
        }
        termLog.appendChild(p);
        termLog.scrollTop = termLog.scrollHeight; // 
    }

    function triggerEasterEgg() {
        printToTerminal("INITIATING PROTOCOL...");
        setTimeout(() => {
            document.body.style.transition = "filter 3s, transform 3s";
            document.body.style.filter = "invert(1) hue-rotate(180deg) contrast(1.5)";
            document.body.style.transform = "scale(1.1)";

            document.querySelectorAll('div, p, span').forEach(el => {
                if (el.children.length === 0 && el.innerText.trim().length > 0)
                    el.innerText = "NO MATTER WHERE YOU ARE, EVERYONE IS ALWAYS CONNECTED";
            });

            setTimeout(() => {
                document.body.style.transform = "scale(1)";
            }, 2000);
        }, 1500);
    }

    //Barra de las ventanas

    window.openDefaultVideo = function () {
        const winId = 'win-video';
        const win = document.getElementById(winId);
        const isVisible = win.style.display !== 'none' && !win.classList.contains('minimizing');
        const isMinimized = document.querySelector(`.taskbar-item[data-win-id="${winId}"]`);

        openWindow(winId);

        if (!isVisible && !isMinimized) {
            const video = document.querySelector('#win-video video');
            const muteBtn = document.getElementById('video-overlay-mute');
            if (foundVideo) {
                video.src = foundVideo;
                video.currentTime = 0;
                video.muted = true;
                if (muteBtn) muteBtn.innerText = '🔇';
                video.play().catch(e => { });
            }
        }
    };

    window.openDefaultAudio = function () {
        const winId = 'win-console';
        const win = document.getElementById(winId);
        const isVisible = win.style.display !== 'none' && !win.classList.contains('minimizing');
        const isMinimized = document.querySelector(`.taskbar-item[data-win-id="${winId}"]`);

        openWindow(winId);

        if (!isVisible && !isMinimized) {
            if (foundMusic) {
                audioPlayer.src = foundMusic;
                audioPlayer.currentTime = 0;
                audioPlayer.play().then(() => initAudioSystem()).catch(e => { });
            }
        }
    };


    //Eventos

    //Pantalla de inicio
    bootScreen.addEventListener('click', () => {
        bootScreen.style.opacity = '0';
        setTimeout(() => bootScreen.style.display = 'none', 1000);
        triggerRandomGlitch();
        initAudioSystem();
    
        isSystemStarted = true;
        tryAutoStart();
        initNetGraph();
    });

    //Eventos de ventana
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-btn')) {
            closeWindow(e.target.closest('.draggable-window'));
        }
        else if (e.target.classList.contains('minimize-btn')) {
            minimizeWindow(e.target.closest('.draggable-window'));
        }
        else if (e.target.classList.contains('video-overlay-mute')) {
            toggleVideoMute(e.target.closest('.draggable-window'), e.target);
        }
    });

    //Traer al frente
    document.addEventListener('mousedown', (e) => {
        const win = e.target.closest('.draggable-window');
        if (win) bringToFront(win);
    });

    //Iniciar arraste
    document.querySelectorAll('.draggable-window').forEach(win => {
        const titleBar = win.querySelector('.title-bar');
        if (titleBar) dragElement(win, titleBar);
    });

    //txt
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const content = document.getElementById('notepad-content').value;
            if (!currentEditingFile) return;
            fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: currentEditingFile, content: content })
            })
                .then(res => res.text())
                .then(msg => alert(msg))
                .catch(() => alert("Error saving data."));
        });
    }

    //Chat
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    if(socket) {
        socket.on('chat message', (msgData) => {
             addChatMsg(msgData.user, msgData.text, msgData.color);
        });
    }
    if (document.querySelector('.send-btn')) {
        document.querySelector('.send-btn').addEventListener('click', sendMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    }

    function sendMessage() {
        if (chatInput.value.trim() === "") return;
        const msg = chatInput.value;
        
        if(socket) {
            socket.emit('chat message', {
                user: `[ ${userName} ]`, 
                text: msg,
                color: userColor 
            });
        } else {
            addChatMsg(`[ ${userName} ]`, msg, "gray");
        }
        
        chatInput.value = "";
    }

    function addChatMsg(user, text, color) {
        const p = document.createElement('p');
        p.innerHTML = `<span style="color: ${color}; font-weight: bold;">${user}</span> ${text}`;
        chatHistory.appendChild(p);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    //Comandos de Terminal
    const termInput = document.getElementById('term-input');
    const termWindow = document.getElementById('win-terminal');
    if (termWindow && termInput) {
        termWindow.addEventListener('click', () => {
            termInput.focus();
        });
    }
    const termCommands = {
        help: () => printToTerminal("COMMANDS: help, clear, setuser, whoami, lain, date, exit, close the world"),
        clear: () => termLog.innerHTML = "",
        setuser: (newName) => {
            if (!newName) {
                printToTerminal("Usage: setuser [name]");
            } else {
                localStorage.setItem('wired_user', newName);
                userName = newName;
                updateUIIdentity();
                printToTerminal(`System identity updated to: ${newName}`);
            }
        },
        whoami: () => {printToTerminal(`User: ${userName} / Protocol: 7 / Layer: Physical`);},
        lain: () => printToTerminal("Let's all love Lain."),
        date: () => printToTerminal(new Date().toString()),
        exit: () => { 
            if (termWindow) termWindow.style.display = 'none'; 
        },
        close: (arg) => {
            if (arg === "the world") {
                triggerEasterEgg();
            } else {
                printToTerminal("Usage: close [target]");
            }
        }
    };

    if (termInput) {
        termInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const fullInput = this.value.trim();
                this.value = ""; 
                e.preventDefault();
                if (fullInput === "") return;
                const parts = fullInput.split(" ");
                const command = parts[0].toLowerCase();
                const argument = parts.slice(1).join(" "); 
                printToTerminal(fullInput, true);
                if (termCommands[command]) {
                    termCommands[command](argument); 
                } else {
                    printToTerminal(`Command '${command}' not found.`);
                }
                if(termLog) termLog.scrollTop = termLog.scrollHeight;
            }
        });
    }

    //Inicializacion
    
    setInterval(updateClock, 1000);
    updateClock();
    loadFiles();
    updateUIIdentity();

    function updateUIIdentity() {
        const currentName = localStorage.getItem('wired_user') || userName;
        const bottomUserEl = document.getElementById('bottom-bar-user');
        if (bottomUserEl) {
            bottomUserEl.innerText = currentName;
            bottomUserEl.style.color = "inherit"; 
        }
        const termPrefixEl = document.getElementById('term-user-prefix');
        if (termPrefixEl) termPrefixEl.innerText = `${currentName}@wired:~$`;
    }
});

//Funciones globales

function toggleMenu(id) {
    const menu = document.getElementById(id);
    const isVisible = menu.style.display === 'block';
    document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    if (!isVisible) menu.style.display = 'block';
}

window.onclick = function (event) {
    if (!event.target.matches('.nav-item') && !event.target.matches('.menu-opt')) {
        document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
    }
};

function toggleMute() {
    const audio = document.getElementById('audio-player');
    const btn = document.getElementById('mute-btn');
    audio.muted = !audio.muted;
    btn.innerText = audio.muted ? '🔇' : '🔊';
}

