import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Helper to estimate string size in bytes (UTF-16)
const getSizeInBytes = (str: string) => str.length * 2;

// Helper to get filename from key
const getFilename = (key: string) => `${key}.json`;

export const saveToStorage = async (key: string, data: any): Promise<boolean> => {
  const tagName = '[ARC_STORAGE]';
  const fileName = getFilename(key);
  
  try {
    const serialized = JSON.stringify(data);
    const dataSize = getSizeInBytes(serialized);
    
    console.log(`${tagName} Attempting to save '${fileName}' to Filesystem. Payload: ${(dataSize / 1024).toFixed(2)} KB`);

    await Filesystem.writeFile({
      path: fileName,
      data: serialized,
      directory: Directory.Data,
      encoding: Encoding.UTF8
    });
    
    console.log(`${tagName} ✅ Filesystem Save Success: '${fileName}'.`);
    return true;
  } catch (e: any) {
    console.error(`${tagName} ❌ Filesystem Save FAILED for '${fileName}'`, e);
    // Fallback or Alert? 
    // Usually Filesystem shouldn't quota error like LocalStorage, but let's log it.
    return false;
  }
};

export const loadFromStorage = async <T>(key: string): Promise<T | null> => {
  const tagName = '[ARC_STORAGE]';
  const fileName = getFilename(key);

  try {
    // 1. Try reading from Filesystem
    try {
        const result = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Data,
        encoding: Encoding.UTF8
        });
        
        const content = result.data as string;
        const size = getSizeInBytes(content);
        console.log(`${tagName} Loaded '${fileName}' from Filesystem. Size: ${(size / 1024).toFixed(2)} KB`);
        
        return JSON.parse(content);
    } catch (fsError) {
        // File might not exist yet. 
        // 2. MIGRATION: Check LocalStorage if Filesystem failed (first run after update)
        console.log(`${tagName} File '${fileName}' not found in Filesystem. Checking LocalStorage for migration...`);
        
        const item = localStorage.getItem(key);
        if (item) {
            console.log(`${tagName} FOUND data in LocalStorage. Migrating to Filesystem...`);
            const parsed = JSON.parse(item);
            // Async Save to complete migration
            await saveToStorage(key, parsed);
            // Optional: localStorage.removeItem(key); // Keep it as backup for now? Or clear to save space?
            // Let's clear it to fix the "Quota Exceeded" alerts from other parts of the app if any
            // localStorage.removeItem(key); 
            return parsed;
        }
        
        console.log(`${tagName} Key '${key}' not found in any storage.`);
        return null;
    }
  } catch (e) {
    console.error(`${tagName} ❌ Load Error for '${key}':`, e);
    return null;
  }
};

export const removeFromStorage = async (key: string) => {
    try {
        console.log(`[ARC_STORAGE] Removing '${key}'`);
        await Filesystem.deleteFile({
            path: getFilename(key),
            directory: Directory.Data
        }).catch(() => {}); // Ignore if file not found
        
        localStorage.removeItem(key); // Also clean LS
    } catch(e) {
        console.error(`[ARC_STORAGE] Remove Error:`, e);
    }
}

