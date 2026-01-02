
import { EquipmentType } from './types';

export const LOCAL_STORAGE_KEY = 'saved_rounds_v2';
export const STAFF_LISTS_KEY = 'staff_lists_v2';
export const LOGGED_USER_KEY = 'logged_sg_user_v2';

// Google Drive Config
export const DRIVE_ROOT_FOLDER_ID = '1faP5o3_uQWXFW9xSO95DmTLZ7RiwwsTU';

// Ciclo de Guardia Naval: inicia 09:00 (Relevo) hasta 08:00 (Entrega)
export const ROUND_TIMES = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00",
  "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00"
];

export const EQUIPMENT_LABELS: Record<string, string> = {
  [EquipmentType.GENERADORES]: 'Motores Generadores',
  [EquipmentType.PROPULSORES]: 'Motores Propulsores',
  [EquipmentType.FRIGORIFICOS]: 'Compresores Frigoríficos',
  [EquipmentType.PAA]: 'Planta Aire Acondicionado',
  [EquipmentType.PURIFICADOR]: 'Purificador',
  [EquipmentType.DEOILER]: 'Deoiler',
  [EquipmentType.MANEJADORAS]: 'Manejadoras de Aire',
  [EquipmentType.BOW_THRUSTER]: 'Bow Thruster',
  [EquipmentType.ENGRANAJES]: 'Engranajes Reductores',
  [EquipmentType.DESALINIZADORAS]: 'Desalinizadoras',
  [EquipmentType.AIRE_COMPRIMIDO]: 'Compresor de Aire Comprimido'
};

export const EQUIPMENT_UNITS_MAP: Record<string, string[]> = {
  [EquipmentType.GENERADORES]: ['Generador 1 (Babor)', 'Generador 2 (Centro)', 'Generador 3 (Estribor)'],
  [EquipmentType.PROPULSORES]: ['Propulsor 1 (Babor)', 'Propulsor 2 (Estribor)'],
  [EquipmentType.FRIGORIFICOS]: ['Compresor #1', 'Compresor #2'],
  [EquipmentType.PAA]: ["Compresor #1", "Compresor #2"],
  [EquipmentType.PURIFICADOR]: ['Unidad Única'],
  [EquipmentType.DEOILER]: ['Deoiler Principal'],
  [EquipmentType.MANEJADORAS]: ['Manejadora #1', 'Manejadora #2', 'Manejadora #3', 'Manejadora #4', 'Cassete'],
  [EquipmentType.BOW_THRUSTER]: ['1', '2'],
  [EquipmentType.ENGRANAJES]: ['Babor', 'Estribor'],
  [EquipmentType.DESALINIZADORAS]: ['Proa', 'Popa'],
  [EquipmentType.AIRE_COMPRIMIDO]: ['Compresor #1', 'Compresor #2'],
};
