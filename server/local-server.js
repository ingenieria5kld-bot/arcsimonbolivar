import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Configuración
app.use(cors());
const MAX_JSON_SIZE = '50mb'; 
app.use(bodyParser.json({ limit: MAX_JSON_SIZE }));
app.use(bodyParser.urlencoded({ limit: MAX_JSON_SIZE, extended: true }));

const SECRETO = 'ARC_SIMBOL_2024';

// === DB PATH SETUP ===
let DB_PATH = path.join(__dirname, 'database', 'MASTER_DB.json');
let LOG_DIR = path.join(__dirname, 'logs');
let LOG_FILE = path.join(LOG_DIR, 'debug.log');

// Function to initialize paths (called by startServer)
function initPaths(customDbPath) {
    if (customDbPath) {
        // If custom path provided (e.g. Electron userData), use it
        const dir = path.dirname(customDbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        DB_PATH = customDbPath;
        LOG_DIR = path.join(dir, 'logs');
        LOG_FILE = path.join(LOG_DIR, 'debug.log');
    }
    
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    // Initialize Uploads Directory (Dynamic based on DB_PATH)
    // DB_PATH is .../database/MASTER_DB.json
    // We want .../database/files
    const dbDir = path.dirname(DB_PATH);
    const uploadsDir = path.join(dbDir, 'files');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
}

// ... Helper Functions (loadDB, saveDB, logToFile) remain essentially the same 
// but use the dynamic DB_PATH/LOG_FILE variables

const UPLOADS_DIR = path.join(__dirname, 'database', 'files');

// === HELPER FUNCTIONS ===
function loadDB() {
    if (!fs.existsSync(DB_PATH)) {
        return { rounds: [], staff: [] };
    }
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        // SAFE MODE CHECK (Like V18 Script)
        // If file exists but is empty or invalid JSON, DO NOT RETURN EMPTY OBJECT immediately if we suspect corruption.
        // However, readFileSync throws on corruption usually.
        // If empty string, JSON.parse throws.
        if (!data || data.trim() === '') {
             console.error("FATAL: DB File exists but is empty. Returning EMPTY to avoid crash, but check backup!");
             return { rounds: [], staff: [] };
        }
        
        const parsed = JSON.parse(data);
        if (!parsed || typeof parsed !== 'object') {
             throw new Error("Invalid JSON structure");
        }
        return parsed;

    } catch (e) {
        console.error("❌ CRITICAL ERROR READING DB:", e);
        // V18 Logic: If error reading, DO NOT return empty array that triggers overwrite.
        // We throw error or return null to signal "Service Unavailable" if desired, 
        // but existing sync logic expects object. 
        // BETTER: Return a flag or keep old memory? 
        // Since this is a cold start or request-based, we can't keep memory easily without global var.
        // Let's Log heavily. For sync, if we fail to read, we should probably output 500.
        // But the current usage defines it returns empty.
        
        // MODIFICATION: If it's a specific 'ENOENT' (Not Found), it's safe to start new.
        // If it's SyntaxError (Corrupted), we should probably BACKUP the file strings and start new or fail.
        if (e.code !== 'ENOENT') {
             // Backup corrupted file
             const backupPath = `${DB_PATH}.corrupted.${Date.now()}`;
             try {
                fs.copyFileSync(DB_PATH, backupPath);
                console.warn(`⚠️ Corrupted DB backed up to: ${backupPath}`);
             } catch(bkErr) { console.error("Failed to backup corrupted DB"); }
        }
        
        return { rounds: [], staff: [] };
    }
}

// ... loadDB is above ...

function saveDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error("Error guardando DB local:", e);
        return false;
    }
}

function logToFile(msg) {
    const timestamp = new Date().toLocaleString();
    const logLine = `[${timestamp}] ${msg}\n`;
    try {
        fs.appendFileSync(LOG_FILE, logLine);
    } catch (e) {
        // Use original error to avoid recursion loop if console.error is hooked
        if (typeof originalError === 'function') {
            originalError("Error writing log:", e);
        }
    }
}

// Interceptor de Logs para Consola
const originalLog = console.log;
console.log = (...args) => {
    originalLog(...args);
    logToFile(args.join(' '));
};

const originalError = console.error;
console.error = (...args) => {
    originalError(...args);
    logToFile(`[ERROR] ${args.join(' ')}`);
};

// Middleware de Logging
app.use((req, res, next) => {
    logToFile(`[REQUEST] ${req.method} ${req.url} from ${req.ip}`);
    next();
});

// === ROUTES ===

app.post('/upload', (req, res) => {
    const { type, fileName, folderName, base64Data, secret } = req.body;

    if (secret !== SECRETO) {
        return res.status(401).json({ status: "Error", message: "Acceso Denegado" });
    }

    if (!base64Data || !fileName) {
        return res.status(400).json({ status: "Error", message: "Faltan datos (base64 o nombre)" });
    }

    try {
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Structure: database/files/[FOLDER_NAME]/[FILENAME]
        // E.g. database/files/GENERADORES/REPORTE_GEN_...pdf
        const dbDir = path.dirname(DB_PATH);
        const dynamicUploadsDir = path.join(dbDir, 'files');

        const targetDir = path.join(dynamicUploadsDir, folderName || 'UNCATEGORIZED');
        
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const filePath = path.join(targetDir, fileName);
        fs.writeFileSync(filePath, buffer);

        console.log(`[UPLOAD] Archivo guardado: ${filePath}`);
        
        res.json({
            status: "Success",
            message: "Archivo guardado localmente",
            path: filePath
        });

    } catch (e) {
        console.error("Error guardando archivo:", e);
        res.status(500).json({ status: "Error", message: e.message });
    }
});

app.post('/sync', (req, res) => {
    // ... existing sync logic ...
    const { secret, type, rounds: clientRounds, staff: clientStaff } = req.body;

    if (secret !== SECRETO) {
        return res.status(401).json({ status: "Error", message: "Acceso Denegado" });
    }

    console.log(`[SYNC] Recibida solicitud de sincronización. Rondas Cliente: ${clientRounds?.length || 0}`);

    let serverData;
    try {
        serverData = loadDB();
    } catch (err) {
        // If loadDB fails critically (logic above handles some, but let's be safe)
        return res.status(500).json({ status: "Error", message: "Database Integrity Error" });
    }

    if (!serverData.rounds) serverData.rounds = [];
    if (!serverData.staff) serverData.staff = [];

    const roundsMap = new Map();
    
    serverData.rounds.forEach(r => {
        if (r.UNIQUE_KEY) roundsMap.set(r.UNIQUE_KEY, r);
    });

    if (Array.isArray(clientRounds)) {
        clientRounds.forEach(clientRound => {
            if (!clientRound.UNIQUE_KEY) return;
            const serverRound = roundsMap.get(clientRound.UNIQUE_KEY);

            if (!serverRound) {
                roundsMap.set(clientRound.UNIQUE_KEY, clientRound);
            } else {
                const clientTs = clientRound.lastUpdated || 0;
                const serverTs = serverRound.lastUpdated || 0;
                if (clientTs > serverTs) {
                    roundsMap.set(clientRound.UNIQUE_KEY, clientRound);
                }
            }
        });
    }

    const mergedRounds = Array.from(roundsMap.values());
    
    // --- STAFF MERGING LOGIC ---
    const staffMap = new Map();
    // Helper for Unique ID: GRADE_NAME
    const getStaffId = (s) => (s.grade && s.name) ? `${s.grade.trim().toUpperCase()}_${s.name.trim().toUpperCase()}` : `UNKNOWN_${Math.random()}`;

    // 1. Load Server Staff
    serverData.staff.forEach(s => {
        const id = getStaffId(s);
        staffMap.set(id, s);
    });

    // 2. Merge Client Staff
    if (Array.isArray(clientStaff)) {
        clientStaff.forEach(clientUser => {
            const id = getStaffId(clientUser);
            const serverUser = staffMap.get(id);

            if (!serverUser) {
                // New User
                staffMap.set(id, clientUser);
            } else {
                // Update if Client is newer
                const clientTs = clientUser.lastUpdated || 0;
                const serverTs = serverUser.lastUpdated || 0;
                if (clientTs > serverTs) {
                    staffMap.set(id, clientUser);
                }
            }
        });
    }

    const mergedStaff = Array.from(staffMap.values());

    const finalDB = {
        rounds: mergedRounds,
        staff: mergedStaff, 
        last_sync: new Date().toISOString()
    };

    saveDB(finalDB);

    console.log(`[SYNC] Sincronización completada. Total Rondas: ${mergedRounds.length}`);

    res.json({
        status: "Success",
        version: "LOCAL_SERVER_V2",
        rounds: mergedRounds,
        staff: finalDB.staff
    });
});


// Exported Start Function
export async function startServer(customDbPath) {
    initPaths(customDbPath);
    
    return new Promise((resolve) => {
        const server = app.listen(PORT, '0.0.0.0', () => {
            const msg = `
            ===================================================
            🚀 ARC LOCAL SERVER INICIADO (Embedded)
            ===================================================
            📡 Escuchando en puerto: ${PORT}
            📂 Base de Datos: ${DB_PATH}
            📂 Logs: ${LOG_FILE}
            ===================================================
            `;
            console.log(msg);
            logToFile("SERVER STARTED");
            resolve(server);
        });
    });
}

// Auto-start if running directly (Development / Standalone Node)
import { pathToFileURL } from 'url';

// Safety check: process.argv[1] can be undefined in Electron packaged apps
if (process.argv[1]) {
    try {
        if (import.meta.url === pathToFileURL(process.argv[1]).href) {
            startServer(); 
        }
    } catch (e) {
        // Ignore errors checking entry point (e.g. if inside asar)
    }
}
