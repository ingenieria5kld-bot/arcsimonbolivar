
import { EquipmentType, UserSpecialty } from './types';

export const LOCAL_STORAGE_KEY = 'saved_rounds_v3';
export const STAFF_LISTS_KEY = 'staff_lists_v3';
export const LOGGED_USER_KEY = 'logged_sg_user_v3';

export const DRIVE_ROOT_FOLDER_ID = '1aT7AtfipoDxZ4Yk4QLUWO0Do31jK6mX_';

export const ROUND_TIMES = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00",
  "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00"
];

export const SPECIALTY_EQUIPMENT: Record<UserSpecialty, EquipmentType[]> = {
  [UserSpecialty.PROPULSION]: [
    EquipmentType.GENERADORES,
    EquipmentType.PROPULSORES,
    EquipmentType.ENGRANAJES,
    EquipmentType.PURIFICADOR,
    EquipmentType.DEOILER,
    EquipmentType.BOW_THRUSTER
  ],
  [UserSpecialty.ELECTRICITY]: [
    EquipmentType.PAA,
    EquipmentType.FRIGORIFICOS,
    EquipmentType.DESALINIZADORAS,
    EquipmentType.MANEJADORAS,
    EquipmentType.AIRE_COMPRIMIDO
  ],
  [UserSpecialty.ALL]: Object.values(EquipmentType)
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  [EquipmentType.GENERADORES]: 'Motores Generadores',
  [EquipmentType.PROPULSORES]: 'Motores Propulsores',
  [EquipmentType.FRIGORIFICOS]: 'Compresores Frigoríficos',
  [EquipmentType.PAA]: 'Planta Aire Acondicionado',
  [EquipmentType.PURIFICADOR]: 'Purificador',
  [EquipmentType.DEOILER]: 'Deoiler',
  [EquipmentType.MANEJADORAS]: 'Manejadoras de Aire',
  [EquipmentType.BOW_THRUSTER]: 'Bow Thruster / Timones',
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
  [EquipmentType.BOW_THRUSTER]: ['Bow Thruster 1', 'Bow Thruster 2', 'Bomba Timón 1', 'Bomba Timón 2'],
  [EquipmentType.ENGRANAJES]: ['Babor', 'Estribor'],
  [EquipmentType.DESALINIZADORAS]: ['Proa', 'Popa'],
  [EquipmentType.AIRE_COMPRIMIDO]: ['Compresor #1', 'Compresor #2'],
};
