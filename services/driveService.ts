import { CapacitorHttp } from '@capacitor/core';
import { DRIVE_ROOT_FOLDER_ID } from '../constants';

/**
 * CONFIGURACIÓN SIMPLIFICADA (GAS Bridge):
 * Para que esto funcione, debes subir el código de 'implementation_plan.md' a script.google.com
 * y pegar aquí la URL de implementación (Web App).
 */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWB0crkyKgFWTIsFkEtg3nvOxyhM2OIWuFm2ctYm6gOfJ70QPkECl4_RLairxZxLN3/exec';
const SECRETO = 'ARC_SIMBOL_2024';

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
    console.log("[DriveService] Modo GAS Bridge activado.");
    return Promise.resolve();
};

export const authenticateDrive = () => {
    alert("Este método usa sincronización directa. Solo pulsa 'Sincronizar' para subir archivos.");
};

export const uploadToDrive = async (blob: Blob, fileName: string, equipmentType: string) => {
  if (SCRIPT_URL.includes('ESCRIBE_AQUI')) {
      alert("⚠️ ERROR: No se ha configurado la URL en driveService.ts");
      return false;
  }

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

    console.log(`[DriveService] Intentando subir a GAS: ${fileName}`);

    // Usamos CapacitorHttp para evitar problemas de CORS en Android nativo
    const options = {
      url: SCRIPT_URL,
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    };

    const response = await CapacitorHttp.post(options);

    console.log("[DriveService] Respuesta recibida:", response.data);

    if (response.data === "Success" || (typeof response.data === 'string' && response.data.includes("Success"))) {
      console.log("[DriveService] Sincronización exitosa.");
      return true;
    } else {
      const errorMsg = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      alert(`⚠️ Error en Servidor Cloud:\n${errorMsg}\n\nStatus: ${response.status}`);
      return false;
    }
  } catch (error: any) {
    console.error("Error subiendo archivo via GAS:", error);
    alert(`❌ Fallo Fatal en Conexión:\n${error.message || 'Error de Red'}\n\nNota: Verifique que el dispositivo tenga acceso a Internet.`);
    return false;
  }
};

export const performMasterSync = async (rounds: any[], staff: any[]) => {
  if (SCRIPT_URL.includes('ESCRIBE_AQUI')) return null;

  try {
    const payload = {
      type: 'MASTER_SYNC',
      rounds,
      staff,
      secret: SECRETO
    };

    const jsonPayload = JSON.stringify(payload);
    console.log(`[DriveService] Enviando datos a Master DB... Tamaño: ${(jsonPayload.length / 1024).toFixed(2)} KB`);

    const options = {
      url: SCRIPT_URL,
      data: payload, // CapacitorHttp stringifica el objeto automáticamente
      headers: { 'Content-Type': 'application/json' },
    };

    const response = await CapacitorHttp.post(options);
    
    // Si la respuesta es JSON (el objeto masterData), lo devolvemos
    if (response.data && (response.data.rounds || response.data.staff || response.data.status === 'Success')) {
        const version = response.data.version || "V_SIN_ID";
        console.log(`[DriveService] Sincronización Master exitosa. Versión Servidor: ${version}`);
        return response.data;
    }

    // Si recibimos un string pero es un error
    if (typeof response.data === 'string' && response.data.includes("Error")) {
        console.error("[DriveService] Error en servidor:", response.data);
        alert(`❌ Error del Servidor Cloud:\n${response.data}`);
        return null;
    }

    if (response.status !== 200) {
        alert(`⚠️ El servidor respondió con error ${response.status}. Verifique que el script esté publicado correctamente.`);
    }

    return null;
  } catch (error: any) {
    console.error("[DriveService] Error fatal en Sincronización Master:", error);
    alert(`❌ Error de conexión con la Nube:\n${error.message || 'Fallo de red'}`);
    return null;
  }
};

// En este modo, siempre consideramos que está "vinculado" ya que no hay login previo
export const isDriveLinked = () => true;
