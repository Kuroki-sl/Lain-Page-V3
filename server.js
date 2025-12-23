const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

const PORT = 3000;
const HOME_DIR = path.join(__dirname, 'home');

// Middleware
app.use(express.json());
app.use(express.static(__dirname));
app.use('/home', express.static(HOME_DIR));

// === INICIALIZACIÓN ===
// Verificamos y creamos la carpeta 'home' UNA sola vez al arrancar el servidor
if (!fs.existsSync(HOME_DIR)) {
    fs.mkdirSync(HOME_DIR, { recursive: true });
    console.log(`[SYSTEM] Directorio creado: ${HOME_DIR}`);
}

// === RUTAS ===

// Listar archivos
app.get('/api/files', (req, res) => {
    fs.readdir(HOME_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'System error: Cannot read directory.' });
        res.json(files);
    });
});

// Guardar archivo (Notepad)
app.post('/api/save', (req, res) => {
    const { filename, content } = req.body;

    // Validación básica de seguridad
    if (!filename || typeof content !== 'string') {
        return res.status(400).send('Error: Invalid data.');
    }

    // path.basename evita que alguien guarde archivos fuera de 'home' (seguridad)
    const safeFilename = path.basename(filename);
    const filePath = path.join(HOME_DIR, safeFilename);

    fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) return res.status(500).send('System Error: Write failed.');
        console.log(`> File saved: ${safeFilename}`);
        res.send('System: Data Saved Successfully.');
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`> Wired Protocol Initiated: http://localhost:${PORT}`);
});