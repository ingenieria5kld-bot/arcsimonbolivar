
import { DRIVE_ROOT_FOLDER_ID } from '../constants';

/**
 * CONFIGURACIÓN PARA AI STUDIO PREVIEW:
 * 1. Ve a la vista de "Sincronizar" en la app para ver tu origen actual.
 * 2. Agrégalo a la consola de Google Cloud -> Orígenes de JavaScript.
 * 3. Asegúrate de que el usuario ingenieria5kld@gmail.com sea 'Test User'.
 */
const CLIENT_ID = '845893054252-vs6n2iejudnhn7oekd1it901aqpv8ppn.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let accessToken: string | null = null;

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log(`[DriveService] Solicitando carga de: ${src}`);
    if (document.querySelector(`script[src="${src}"]`)) {
      console.log(`[DriveService] Script ya presente: ${src}`);
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      console.log(`[DriveService] ONLOAD disparado para: ${src}`);
      resolve();
    };
    script.onerror = (e) => {
      console.error(`[DriveService] ONERROR disparado para: ${src}`, e);
      // Attempt fallback if gsi fails
      if (src.includes('gsi/client')) {
        console.log("[DriveService] Intentando fallback de GSI a gstatic...");
        const fallback = document.createElement('script');
        fallback.src = "https://www.gstatic.com/identity/gsi/lib/client.js";
        fallback.onload = () => resolve();
        fallback.onerror = () => reject(new Error(`Fallback failed`));
        document.head.appendChild(fallback);
      } else {
        reject(new Error(`Failed to load ${src}`));
      }
    };
    document.head.appendChild(script);
  });
};

const waitForGoogleLibs = (retries = 20): Promise<boolean> => {
  return new Promise((resolve) => {
    const check = (attempt: number) => {
      // @ts-ignore
      const hasGapi = typeof gapi !== 'undefined';
      // @ts-ignore
      const hasGoogle = typeof google !== 'undefined' && typeof google.accounts !== 'undefined';

      console.log(`[DriveService] Verificando libs (intento ${21 - attempt}): gapi=${hasGapi}, google=${hasGoogle}`);

      if (hasGapi && hasGoogle) {
        resolve(true);
      } else if (attempt > 0) {
        setTimeout(() => check(attempt - 1), 500);
      } else {
        resolve(false);
      }
    };
    check(retries);
  });
};

export const initDriveApi = () => {
  return new Promise<void>(async (resolve) => {
    let libsLoaded = await waitForGoogleLibs(5); // Wait 2.5s first

    if (!libsLoaded) {
      console.log("Libs missing. Attempting Manual Injection...");
      try {
        await Promise.all([
          loadScript('https://accounts.google.com/gsi/client'),
          loadScript('https://apis.google.com/js/api.js')
        ]);
        libsLoaded = await waitForGoogleLibs(10); // Wait another 5s
      } catch (e) {
        console.error("Manual Injection Failed:", e);
      }
    }

    if (!libsLoaded) {
      // Check connectivity
      const online = navigator.onLine;
      // @ts-ignore
      const missing = [];
      // @ts-ignore
      if (typeof gapi === 'undefined') missing.push("gapi");
      // @ts-ignore
      if (typeof google === 'undefined') missing.push("google");

      console.error(`Google Libs Failed. Online: ${online}. Missing: ${missing.join(', ')}`);
      return resolve();
    }

    // @ts-ignore
    gapi.load('client', async () => {
      try {
        // @ts-ignore
        await gapi.client.init({
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });

        // Inicializar GIS
        // @ts-ignore
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          ux_mode: 'popup',
          callback: (response: any) => {
            if (response.error !== undefined) {
              console.error("Detalle del Error Google:", response);
              alert(`Error: ${response.error}\nDetalle: ${response.error_description || 'Verifique el origen en la consola de Google'}\n\nOrigen actual: ${window.location.origin}`);
              return;
            }
            accessToken = response.access_token;
            console.log("Drive: Acceso concedido.");
          },
        });

        console.log("Drive Service Initialized Successfully");
        resolve();
      } catch (err) {
        console.error("GAPI Init Error:", err);
        resolve();
      }
    });
  });
};

export const authenticateDrive = () => {
  if (tokenClient) {
    try {
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      console.error("Error al disparar autenticación:", err);
      alert(`No se pudo abrir el selector de Google. Origen: ${window.location.origin}`);
    }
  } else {
    initDriveApi().then(() => {
      // @ts-ignore
      const missing = [];
      // @ts-ignore
      if (typeof gapi === 'undefined') missing.push("GAPI (API Client)");
      // @ts-ignore
      if (typeof google === 'undefined') {
        missing.push("google (Lib Principal)");
      } else if (typeof google.accounts === 'undefined') {
        missing.push("google.accounts (Auth Identity)");
      }

      const online = navigator.onLine ? "SÍ" : "NO";
      const origin = window.location.origin;
      const ua = navigator.userAgent;

      if (missing.length > 0) {
        alert(`Fallo en Carga de Google:\n\nFalta: ${missing.join(', ')}.\n\nInternet: ${online}\nOrigen: ${origin}\n\nDetalle UA: ${ua.substring(0, 80)}...\n\nRecomendación: Intente de nuevo en 5 seg.`);
      } else {
        alert("Servicio reiniciado correctamente. Intente vincular nuevamente.");
      }
    });
  }
};

async function getOrCreateFolder(folderName: string, parentId: string): Promise<string> {
  try {
    // @ts-ignore
    const response = await gapi.client.drive.files.list({
      q: `name = '${folderName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)',
    });

    const files = response.result.files;
    if (files && files.length > 0) return files[0].id;

    // @ts-ignore
    const createResponse = await gapi.client.drive.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
    });
    return createResponse.result.id;
  } catch (e) {
    console.error("Error getOrCreateFolder", e);
    return parentId;
  }
}

export const uploadToDrive = async (blob: Blob, fileName: string, equipmentType: string) => {
  if (!accessToken) return false;

  try {
    const equipmentFolderId = await getOrCreateFolder(equipmentType.toUpperCase(), DRIVE_ROOT_FOLDER_ID);

    const metadata = {
      name: fileName,
      mimeType: 'application/pdf',
      parents: [equipmentFolderId],
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    return response.ok;
  } catch (error) {
    console.error("Error subiendo archivo:", error);
    return false;
  }
};

// --- SYNC LOGIC ---

export const getDBFolderId = async () => {
  return await getOrCreateFolder("DB_Sincronizada", DRIVE_ROOT_FOLDER_ID);
};

export const uploadUserState = async (rounds: any[], staff: any, userInfo: { grade: string, name: string, role: string }) => {
  if (!accessToken) return false;
  try {
    const dbFolderId = await getDBFolderId();
    const fileName = `status_${userInfo.role}_${userInfo.grade}_${userInfo.name}.json`.replace(/\s+/g, '_');

    // Check if file exists to update it
    // @ts-ignore
    const listRes = await gapi.client.drive.files.list({
      q: `name = '${fileName}' and '${dbFolderId}' in parents and trashed = false`,
      fields: 'files(id)',
    });

    const existingFileId = listRes.result.files?.[0]?.id;

    const fileContent = JSON.stringify({ rounds, staff, lastUpdated: new Date().toISOString() });
    const blob = new Blob([fileContent], { type: 'application/json' });

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      parents: existingFileId ? [] : [dbFolderId], // Only set parent on create
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);

    const method = existingFileId ? 'PATCH' : 'POST';
    const endpoint = existingFileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const response = await fetch(endpoint, {
      method: method,
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    return response.ok;
  } catch (e) {
    console.error("Error uploading user state", e);
    return false;
  }
};

export const fetchTeamData = async () => {
  if (!accessToken) return [];
  try {
    const dbFolderId = await getDBFolderId();

    // @ts-ignore
    const listRes = await gapi.client.drive.files.list({
      q: `'${dbFolderId}' in parents and mimeType = 'application/json' and trashed = false`,
      fields: 'files(id, name)',
    });

    const files = listRes.result.files || [];
    const teamData: any[] = [];

    for (const file of files) {
      if (!file.id) continue;
      try {
        // @ts-ignore
        const fileRes = await gapi.client.drive.files.get({
          fileId: file.id,
          alt: 'media'
        });
        // fileRes.body is the string content
        teamData.push(JSON.parse(fileRes.body));
      } catch (err) {
        console.warn(`Failed to read file ${file.name}`, err);
      }
    }
    return teamData;
  } catch (e) {
    console.error("Error fetching team data", e);
    return [];
  }
};

export const isDriveLinked = () => !!accessToken;
