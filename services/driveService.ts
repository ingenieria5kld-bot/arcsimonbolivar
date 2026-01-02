
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

export const initDriveApi = () => {
  return new Promise<void>((resolve) => {
    // @ts-ignore
    if (typeof gapi === 'undefined' || typeof google === 'undefined') {
        console.warn("Librerías de Google no cargadas.");
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
              // Si falla con Error 400, mostrar información sobre el origen actual
              alert(`Error: ${response.error}\nDetalle: ${response.error_description || 'Verifique el origen en la consola de Google'}\n\nOrigen actual: ${window.location.origin}`);
              return;
            }
            accessToken = response.access_token;
            console.log("Drive: Acceso concedido.");
          },
        });
        
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
        alert("Servicio reiniciado. Intente vincular nuevamente.");
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

export const isDriveLinked = () => !!accessToken;
