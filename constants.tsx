
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
    EquipmentType.TIMONES
  ],
  [UserSpecialty.ELECTRICITY]: [
    EquipmentType.PAA,
    EquipmentType.FRIGORIFICOS,
    EquipmentType.DESALINIZADORAS,
    EquipmentType.MANEJADORAS,
    EquipmentType.AIRE_COMPRIMIDO,
    EquipmentType.BOW_THRUSTER
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
  [EquipmentType.BOW_THRUSTER]: 'Bow Thruster',
  [EquipmentType.TIMONES]: 'Timones (Bomba Timón)',
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
  [EquipmentType.BOW_THRUSTER]: ['Bow Thruster 1', 'Bow Thruster 2'],
  [EquipmentType.TIMONES]: ['Bomba Timón 1', 'Bomba Timón 2'],
  [EquipmentType.ENGRANAJES]: ['Babor', 'Estribor'],
  [EquipmentType.DESALINIZADORAS]: ['Proa', 'Popa'],
  [EquipmentType.AIRE_COMPRIMIDO]: ['Compresor #1', 'Compresor #2'],
};

export const DATA_LIMITS: Record<string, { min?: number, max?: number }> = {
  // Generadores
  frecuencia: { min: 55, max: 65 },
  carga: { min: 0, max: 100 },
  vol_mg_linea_a: { min: 150, max: 300 },
  vol_mg_linea_b: { min: 150, max: 300 },
  vol_mg_linea_c: { min: 150, max: 300 },
  amp_mg_linea_a: { min: 50, max: 500 },
  amp_mg_linea_b: { min: 50, max: 500 },
  amp_mg_linea_c: { min: 50, max: 500 },
  rpm: { min: 0, max: 2400 },
  consumo: { min: 0, max: 180 },
  temp_mg_exhosto: { min: 0, max: 800 },
  temp_mg_refrigerante: { min: 0, max: 120 },
  pres_mg_lubricante: { min: 0, max: 900 },
  pres_mg_refrigerante: { min: 0, max: 250 },
  temp_mg_lubricante: { min: 0, max: 120 },
  temp_mg_combustibe: { min: 0, max: 120 },
  pres_mg_combustible: { min: 0, max: 1000 },
  vol_mg_bateria: { min: 0, max: 30 },
  temp_mg_entrada: { min: -5, max: 100 },
  pres_mg_entrada_ag: { min: -3, max: 2 },
  temp_mg_salida: { min: 0, max: 100 },
  pres_mg_salida_ag_1: { min: 0, max: 20 },

  // Propulsores
  rpm_p: { min: 0, max: 2500 },
  consumo_p: { min: 0, max: 1000 },
  pres_agua_camisas_p: { min: 0, max: 300 },
  temp_refrigerante_lt_p: { min: 0, max: 120 },
  pres_entrada_motor_p: { min: 0, max: 1000 },
  pres_dif_filtro_p: { min: 0, max: 200 },
  pres_aceite_p: { min: 0, max: 900 },
  temp_aceite_p: { min: 0, max: 120 },
  pres_carter_p: { min: -2, max: 2 },
  temp_cojinete_p: { min: 0, max: 120 },
  voltaje_bateria_p: { min: 0, max: 30 },
  lado_izquierdo_p: { min: 0, max: 800 },
  lado_derecho_p: { min: 0, max: 800 },
  temp_entrada_mar_p: { min: -10, max: 100 },
  temp_salida_mar_p: { min: 0, max: 100 },
  pres_entrada_p: { min: -10, max: 20 },
  pres_salida_p: { min: 0, max: 20 },

  // PAA
  paa_slide_valve: { min: 0, max: 100 },
  paa_amperaje: { min: 0, max: 150 },
  paa_t_ret_evap: { min: 0, max: 50 },
  paa_p_succion: { min: 1, max: 5 },
  paa_p_descarga: { min: 5, max: 20 },
  
  // Frigorificos
  p_succion_c1: { min: -5, max: 10 },
  p_descarga_c1: { min: 8, max: 23 },
  amperaje_c1: { min: 0, max: 25 },
  frecuencia_c: { min: 0, max: 61 },
  rpm_motor_c: { min: 0, max: 1850 },
  pres_succion_comun_c: { min: -0.6, max: 2 },
  pres_descarga_comun_c: { min: 0.5, max: 2 },
  temp_motor_c: { min: 0, max: 120 },
  temp_succion_c: { min: -10, max: 50 },
  temp_descarga_c: { min: -5, max: 150 },
  temp_plantas_v: { min: 0.1, max: 40 },
  temp_plantas_c: { min: -20, max: 40 },
  temp_locales_v: { min: 0.1, max: 40 },
  temp_locales_c: { min: -20, max: 40 },

  // Purificador
  presion_succion_pur: { min: -10, max: 2 },
  presion_descarga_pur: { min: 0, max: 2 },

  // Deoiler
  ppm_deoiler: { min: 0, max: 15 },
  
  // Manejadoras
  temp_salida_ma: { min: 0, max: 40 },
  temp_retorno_ma: { min: -10, max: 40 },
  amperaje_ma: { min: 0, max: 20 },
  frecuencia_ma: { min: 0, max: 75 },

  // Bow Thruster
  velocidad_motor_bt: { min: 0, max: 3600 },
  presion_bt: { min: 0, max: 30000 },
  temperatura_bt: { min: 0, max: 120 },

  // Engranajes
  rpm_engranaje: { min: 0, max: 250 },
  paso_engranaje: { min: -100, max: 100 },
  temp_aceite_cpp: { min: 0, max: 120 },
  presion_aceite_cpp: { min: 0, max: 60 },
  presion_aceite_engranaje: { min: 0, max: 30 },
  temp_aceite_engranaje: { min: 0, max: 120 },
  presion_entrada_engranaje: { min: 0, max: 4 },
  temp_entrada_engranaje: { min: 0, max: 120 },
  temp_salida_engranaje: { min: 0, max: 120 },
  temp_servomotor_engranaje: { min: 0, max: 120 },

  // Desalinizadoras
  temp_entrada_agua_des: { min: 0, max: 50 },
  conductividad_des: { min: 0, max: 1000 },

  // Aire Comprimido
  p_digital_ac: { min: 0, max: 20 },
  p_botella_ac: { min: 0, max: 20 },
  t_compresor_ac: { min: 0, max: 150 },
  amperaje_ac: { min: 0, max: 40 }
};
