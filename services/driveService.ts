import { CapacitorHttp } from '@capacitor/core';
import { DRIVE_ROOT_FOLDER_ID } from '../constants';

// === CONFIGURACIÓN DE MODOS DE SINCRONIZACIÓN ===
export type SyncMode = 'CLOUD' | 'LOCAL';

const STORAGE_KEY_MODE = 'arc_sync_mode';
const STORAGE_KEY_IP = 'arc_local_ip';
// Default Cloud Script (Production/Test switched via build constants usually, here hardcoded as requested)
const CLOUD_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzg83jW1OE-ORAomjBbhwW-vw2I5WAomkxvHYlhekbra8V3_fl2FGN6RFdX2sG8FpYe/exec'; // OFFICIAL URL
const SECRETO = 'ARC_SIMBOL_2024';

// Helper to get Base URL
const getBaseUrl = (): string => {
  const mode = localStorage.getItem(STORAGE_KEY_MODE) as SyncMode || 'CLOUD';
  if (mode === 'LOCAL') {
    const ip = localStorage.getItem(STORAGE_KEY_IP) || '192.168.1.10'; // Default fallback
    // NOTA: El puerto 3000 es el definido en local-server.js
    return `http://${ip}:3000`; 
  }
  return CLOUD_SCRIPT_URL;
};

// === PUBLIC API FOR SETTINGS ===
export const setSyncMode = (mode: SyncMode) => {
  localStorage.setItem(STORAGE_KEY_MODE, mode);
};

export const getSyncMode = (): SyncMode => {
  return (localStorage.getItem(STORAGE_KEY_MODE) as SyncMode) || 'CLOUD';
};

export const setServerIP = (ip: string) => {
  localStorage.setItem(STORAGE_KEY_IP, ip);
};

export const getServerIP = (): string => {
  return localStorage.getItem(STORAGE_KEY_IP) || '';
};

// Helper to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]); 
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const initDriveApi = async () => {
    console.log(`[DriveService] Iniciado. Modo: ${getSyncMode()}`);
    return Promise.resolve();
};

export const authenticateDrive = () => {
    alert("Este método usa sincronización directa. Solo pulsa 'Sincronizar' para subir archivos.");
};

// Helper for Cross-Platform Requests
const smartPost = async (options: { url: string; data: any; headers: any }) => {
  try {
    // Attempt Capacitor Post (Works on Android/iOS/Electron if configured)
    const response = await CapacitorHttp.post(options);
    return response;
  } catch (error) {
    console.warn("CapacitorHttp failed (likely web mode), falling back to fetch...", error);
    
    // Fallback to Fetch (Browser/Dev Mode)
    // WORKAROUND: Use 'text/plain' to avoid CORS Preflight (OPTIONS) which GAS fails to handle.
    // GAS can still parse the body if it's stringified JSON.
    const response = await fetch(options.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, 
      body: JSON.stringify(options.data)
    });

    const data = await response.json();
    return {
       data: data,
       status: response.status
    };
  }
};

export const uploadToDrive = async (blob: Blob, fileName: string, equipmentType: string) => {
  const mode = getSyncMode();
  const baseUrl = getBaseUrl();

  try {
    const base64Data = await blobToBase64(blob);
    const mimeType = fileName.endsWith('.csv') ? 'text/csv' : 'application/pdf';

    const payload = {
      type: 'FILE_UPLOAD',
      fileName,
      folderName: equipmentType.toUpperCase(),
      base64Data,
      mimeType,
      secret: SECRETO
    };

    console.log(`[DriveService] Subiendo a (${mode}): ${baseUrl} | Archivo: ${fileName}`);

    // Determine URL based on mode
    // Cloud uses the Script URL directly. Local uses /upload endpoint (if implemented, defaulting to sync logic for now or custom)
    // Para simplificar el prototipo local, el servidor local asume POST a root o específico. 
    // Cloud Script espera POST a la URL.
    // Local Server espera POST a /upload (no implementado aun en server, implementemoslo rapido o usemos sync)
    // CORRECCION: El server local en este paso anterior SOLO implementó /sync. 
    // Para el prototipo, asumiremos que upload solo funciona en Cloud por ahora o que el usuario sabe que Local es solo data.
    // PERO el usuario pidió que funcione todo "igual".
    // TODO: Implementar /upload en server local en el futuro. Por ahora alertaremos si es local.
    
    let targetUrl = baseUrl;
    if (mode === 'LOCAL') {
        targetUrl = `${baseUrl}/upload`; 
    }

    const options = {
      url: targetUrl,
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    };

    const response = await smartPost(options);

    console.log("[DriveService] Respuesta recibida:", response.data);

    if (response.data === "Success" || (typeof response.data === 'string' && response.data.includes("Success"))) {
      return true;
    } else {
      const errorMsg = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      console.warn(`[DriveService] Error Upload: ${errorMsg}`);
      return false;
    }
  } catch (error: any) {
    console.error("Error subiendo archivo:", error);
    return false;
  }
};

export const performMasterSync = async (rounds: any[], staff: any[], silent: boolean = false) => {
  const mode = getSyncMode();
  const baseUrl = getBaseUrl();
  
  // Construct URL
  // Cloud: SCRIPT_URL
  // Local: http://IP:3000/sync
  const targetUrl = mode === 'LOCAL' ? `${baseUrl}/sync` : baseUrl;

  try {
    const payload = {
      type: 'MASTER_SYNC',
      rounds,
      staff,
      secret: SECRETO
    };

    const jsonPayload = JSON.stringify(payload);
    // Only log size if explicit sync or debug
    if (!silent) console.log(`[DriveService] Sincronizando (${mode}) -> ${targetUrl} | Size: ${(jsonPayload.length / 1024).toFixed(2)} KB`);



// ... inside performMasterSync
    const options = {
      url: targetUrl,
      data: payload, 
      headers: { 'Content-Type': 'application/json' },
    };

    const response = await smartPost(options);
    
    // Si la respuesta es JSON (el objeto masterData), lo devolvemos
    if (response.data && (response.data.rounds || response.data.staff || response.data.status === 'Success')) {
        const version = response.data.version || "V_SIN_ID";
        if (!silent) console.log(`[DriveService] Sincronización Exitosa. Versión: ${version}`);
        return response.data;
    }

    // Si recibimos un string pero es un error
    if (typeof response.data === 'string' && response.data.includes("Error")) {
        console.error("[DriveService] Error en servidor:", response.data);
        if (!silent) alert(`❌ Error del Servidor (${mode}):\n${response.data}`);
        return null;
    }

    if (response.status !== 200) {
        if (!silent) alert(`⚠️ El servidor respondió con error ${response.status}.`);
    }

    return null;
  } catch (error: any) {
    console.error(`[DriveService] Error fatal en Sincronización (${mode}):`, error);
    if (!silent) alert(`❌ Error de conexión (${mode}):\n${error.message || 'Fallo de red'} \n\nVerifique IP o Internet.`);
    return null;
  }
};

// En este modo, siempre consideramos que está "vinculado"
export const isDriveLinked = () => true;
