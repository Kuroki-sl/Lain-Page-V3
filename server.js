const express = require('express');
const app = express();
const http = require('http'); // Necesario para Socket.io
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');
const fs = require('fs');

const PORT = 3000;
const HOME_DIR = path.join(__dirname, 'home');

// Middleware
app.use(express.json());
app.use(express.static(__dirname));
app.use('/home', express.static(HOME_DIR));

// === SOCKET.IO (CHAT "THE WIRED") ===
io.on('connection', (socket) => {
    console.log('[WIRED] A soul has connected');

    // Escuchar mensajes del cliente
    socket.on('chat message', (msg) => {
        // Retransmitir a TODOS los conectados (incluyendo al que envió)
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('[WIRED] Connection lost');
    });
});

// === RUTAS EXISTENTES ===
if (!fs.existsSync(HOME_DIR)) {
    fs.mkdirSync(HOME_DIR, { recursive: true });
}

app.get('/api/files', (req, res) => {
    fs.readdir(HOME_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'System error' });
        res.json(files);
    });
});

app.post('/api/save', (req, res) => {
    const { filename, content } = req.body;
    if (!filename || typeof content !== 'string') return res.status(400).send('Error');
    const safeFilename = path.basename(filename);
    const filePath = path.join(HOME_DIR, safeFilename);
    fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) return res.status(500).send('Write failed');
        res.send('Saved.');
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Nota: Cambiamos app.listen por server.listen
server.listen(PORT, () => {
    console.log(`> Wired Protocol Initiated: http://localhost:${PORT}`);
});