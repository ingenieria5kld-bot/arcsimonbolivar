import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess = null;
let detectedIp = null;

// === SERVER MANAGEMENT ===
// Import server logic directly
// Note: In production, this file is bundled, so it includes 'express' and dependencies.
import { startServer } from '../server/local-server.js';

async function startIntegratedServer() {
    try {
        const userDataPath = app.getPath('userData');
        const dbPath = path.join(userDataPath, 'MASTER_DB.json');
        console.log("Initializing Integrated Server with DB:", dbPath);
        
        await startServer(dbPath);
    } catch (e) {
        console.error("Failed to start integrated server:", e);
    }
}

function detectLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal and non-IPv4
            if (iface.family === 'IPv4' && !iface.internal) {
                // Prefer 192.168.x.x (Typical Home/Hotspot)
                if (iface.address.startsWith('192.168')) {
                    detectedIp = iface.address;
                    return;
                }
                detectedIp = iface.address; // Fallback to any other
            }
        }
    }
}

// === WINDOW MANAGEMENT ===
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
      webSecurity: false 
    },
    icon: path.join(__dirname, '../ARCico.png') 
  });

  Menu.setApplicationMenu(null); // Remove default menu (File, Edit, etc.)
  win.maximize(); // Ensure full screen for better UX

  const devUrl = 'http://localhost:5173';
  
  win.loadURL(devUrl).catch(() => {
      console.log("Dev server not found, loading build...");
      win.loadFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.whenReady().then(() => {
  startIntegratedServer();
  // Wait a bit for IP detection
  detectLocalIp();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
      console.log("Killing Local Server...");
      serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// === IPC HANDLERS ===
ipcMain.handle('get-server-ip', async () => {
    return detectedIp || 'Buscando...';
});
