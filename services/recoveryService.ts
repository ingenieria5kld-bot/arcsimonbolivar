
import { RoundData, EquipmentType } from '../types';
import { PARAM_CONFIG, EQUIPMENT_LABELS, EQUIPMENT_UNITS_MAP, LOCAL_STORAGE_KEY } from '../constants';
import { saveToStorage, loadFromStorage } from './storageService';

// Helper: Inverse Mapping (Label "V-L1" -> key "vol_mg_linea_a")
const getReverseParamMap = () => {
  const map: Record<string, string> = {};
  Object.entries(PARAM_CONFIG).forEach(([key, config]) => {
    // Map "LABEL (UNIT)" -> key, but also just "LABEL" to be safe
    // The CSV header format is: LABEL_(UNIT)
    // We will clean the header to match
    map[config.label.toUpperCase()] = key;
  });
  return map;
};

const REVERSE_PARAM_MAP = getReverseParamMap();

export const parseAndRecoverCSV = async (csvContent: string): Promise<{ success: number, failed: number, total: number }> => {
  try {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) throw new Error("Archivo CSV inválido o vacío.");

    // Remove BOM if present
    const headerLine = lines[0].replace(/^\uFEFF/, '');
    const headers = headerLine.split(';').map(h => h.trim());

    // EXPECTED STANDARD HEADERS:
    // FOLIO_GUARDIA, HORA_RONDA, SISTEMA, UNIDAD, PERSONAL_SG, HOROMETRO, ...PARAMS..., OBSERVACIONES, REGISTRO_HORA_REAL

    // Build Index Map
    const indices: Record<string, number> = {};
    headers.forEach((h, i) => {
        // Remove units from header for mapping: "V-L1_(V)" -> "V-L1"
        const cleanHeader = h.split('_(')[0]; 
        indices[cleanHeader] = i;
        indices[h] = i; // Keep original too just in case
    });

    const dataRows = lines.slice(1);
    const recoveredRounds: RoundData[] = [];

    // Load existing rounds to check duplicates
    const existingRounds = await loadFromStorage<RoundData[]>(LOCAL_STORAGE_KEY) || [];
    
    // Create a set of signatures for existing rounds to avoid duplicates
    // Signature = Date + Time + Equipment + Unit
    // IMPORTANT: Only check against ACTIVE (not isDeleted) rounds. 
    // This allows recovering data that was accidentally deleted or lost via sync.
    const existingSignatures = new Set(existingRounds
        .filter(r => !r.isDeleted)
        .map(r => `${r.fecha}_${r.ronda_de_inspeccion}_${r.equipo_principal}_${r.UNIDAD_ACTIVA}`)
    );

    let successCount = 0;
    let failedCount = 0;

    // Helper to find equipment type key by Label
    // "Motores Generadores" -> "generadores"
    const reverseEquipmentMap: Record<string, string> = {};
    Object.entries(EQUIPMENT_LABELS).forEach(([key, label]) => {
        reverseEquipmentMap[label] = key;
        reverseEquipmentMap[label.toUpperCase()] = key;
    });

    for (const rowStr of dataRows) {
        const cols = rowStr.split(';');
        
        // Basic fields
        const folioGuardia = cols[indices['FOLIO_GUARDIA']];
        const horaRonda = cols[indices['HORA_RONDA']];
        const sistemaLabel = cols[indices['SISTEMA']];
        const unidad = cols[indices['UNIDAD']];
        const personal = cols[indices['PERSONAL_SG']];
        const horometro = cols[indices['HOROMETRO']];
        const observaciones = cols[indices['OBSERVACIONES']];
        // REGISTRO_HORA_REAL is optional/fallback
        const timeLog = indices['REGISTRO_HORA_REAL'] !== undefined ? cols[indices['REGISTRO_HORA_REAL']] : new Date().toLocaleString();

        if (!folioGuardia || !horaRonda || !sistemaLabel || !unidad) {
            failedCount++;
            continue;
        }

        const equipoKey = reverseEquipmentMap[sistemaLabel] || reverseEquipmentMap[sistemaLabel.toUpperCase()];
        
        if (!equipoKey) {
             console.warn("Unknown equipment system:", sistemaLabel);
             failedCount++;
             continue;
        }

        // SMART MERGE LOGIC
        const signature = `${folioGuardia}_${horaRonda}_${equipoKey}_${unidad}`;
        
        // Find if this round already exists (including isDeleted ones if we want to revive them, 
        // but primarily to merge data into active ones)
        const existingIndex = existingRounds.findIndex(r => 
            `${r.fecha}_${r.ronda_de_inspeccion}_${r.equipo_principal}_${r.UNIDAD_ACTIVA}` === signature
        );

        if (existingIndex >= 0) {
            // Round exists! Let's try to ENRICH it if the CSV has data that is missing locally.
            const existingRound = existingRounds[existingIndex];
            let enriched = false;

            // Map standard fields if missing locally
            if (!existingRound.observaciones && observaciones) {
                existingRound.observaciones = observaciones;
                enriched = true;
            }
            if ((!existingRound.horometro || existingRound.horometro === 0) && horometro && horometro !== '0') {
                existingRound.horometro = parseFloat(horometro);
                enriched = true;
            }
            // If it was deleted but we have data in CSV, maybe we revive it? 
            // Let's assume if the user is importing, they want this data visible.
            if (existingRound.isDeleted) {
                existingRound.isDeleted = false;
                enriched = true;
            }

            // Map Dynamic Params
            headers.forEach((h, i) => {
                const cleanH = h.split('_(')[0];
                
                // Try 1: Lookup by LABEL
                let paramKey = REVERSE_PARAM_MAP[cleanH] || REVERSE_PARAM_MAP[cleanH.toUpperCase()];
                
                // Try 2: Lookup by KEY name directly
                if (!paramKey) {
                    const lowerKey = cleanH.toLowerCase();
                    if (PARAM_CONFIG[lowerKey]) {
                        paramKey = lowerKey;
                    }
                }
                
                if (paramKey) {
                    const val = cols[i];
                    // If CSV has value AND (Local is missing OR Local is empty)
                    if (val && val !== '-' && val.trim() !== '') {
                        if (existingRound[paramKey] === undefined || existingRound[paramKey] === '' || existingRound[paramKey] === null) {
                            existingRound[paramKey] = val;
                            enriched = true;
                        }
                    }
                } else if (cleanH === 'TRIM' || cleanH === 'TRIM_(L)') {
                    const val = cols[i];
                    if (val && val !== '-' && val.trim() !== '') {
                        if (!existingRound.trim) {
                            existingRound.trim = parseFloat(val);
                            enriched = true;
                        }
                    }
                }
            });

            if (enriched) {
                existingRound.lastUpdated = Date.now();
                existingRounds[existingIndex] = existingRound; // Update in place
                successCount++; // Count as success since we improved data
            } else {
                // Duplicate with no new info
            }
            continue; // Move to next row, do not create double
        }

        // ... New Round Creation Logic (only if it didn't exist) ...
        // Build Round Object
        const newRound: RoundData = {
            UNIQUE_KEY: `RECOV_${folioGuardia}_${horaRonda.replace(':','')}_${equipoKey}_${Math.random().toString(36).substr(2, 5)}`,
            fecha: folioGuardia,
            ronda_de_inspeccion: horaRonda,
            on_off: 'y', 
            condicion: 'Recuperado CSV',
            sg: personal,
            equipo_principal: equipoKey,
            EQUIPO_ACTIVO: sistemaLabel,
            UNIDAD_ACTIVA: unidad,
            TIMESTAMP_GUARDADO: timeLog,
            horometro: (horometro && horometro !== '0') ? parseFloat(horometro) : undefined,
            observaciones: observaciones,
            isDeleted: false,
            lastUpdated: Date.now()
        };

        // Map Dynamic Params for new round
        headers.forEach((h, i) => {
            const cleanH = h.split('_(')[0];
            
            // Try 1: Lookup by LABEL
            let paramKey = REVERSE_PARAM_MAP[cleanH] || REVERSE_PARAM_MAP[cleanH.toUpperCase()];
            
            // Try 2: Lookup by KEY name directly
            if (!paramKey) {
                const lowerKey = cleanH.toLowerCase();
                if (PARAM_CONFIG[lowerKey]) {
                    paramKey = lowerKey;
                }
            }
            
            if (paramKey) {
                const val = cols[i];
                if (val && val !== '-' && val.trim() !== '') {
                    newRound[paramKey] = val;
                }
            } else if (cleanH === 'TRIM' || cleanH === 'TRIM_(L)') {
                 const val = cols[i];
                 if (val && val !== '-' && val.trim() !== '') {
                    newRound.trim = parseFloat(val); 
                 }
            }
        });

        recoveredRounds.push(newRound);
        successCount++;
    }

    if (recoveredRounds.length > 0) {
        const finalSet = [...existingRounds, ...recoveredRounds];
        await saveToStorage(LOCAL_STORAGE_KEY, finalSet);
    }

    return { success: successCount, failed: failedCount, total: dataRows.length };

  } catch (e) {
      console.error("CSV Recovery Error:", e);
      throw e;
  }
};
