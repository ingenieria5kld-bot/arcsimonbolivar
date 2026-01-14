
import { EquipmentType, UserSpecialty } from './types';

export const LOCAL_STORAGE_KEY = 'saved_rounds_v3';
export const STAFF_LISTS_KEY = 'staff_lists_v3';
export const LOGGED_USER_KEY = 'logged_sg_user_v3';

export const APP_VERSION = '1.2.3 beta';
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

export const PARAM_CONFIG: Record<string, { label: string, unit: string }> = {
  // Generales / Compartidos
  frecuencia: { label: "FREC", unit: "Hz" },
  potencia: { label: "POT", unit: "kW" },
  carga: { label: "CARGA", unit: "%" },
  rpm: { label: "RPM", unit: "-" },
  trim: { label: "TRIM", unit: "L" },
  consumo: { label: "CONS", unit: "L/h" },
  horometro: { label: "HOROM", unit: "Hrs" },
  
  // Motores Generadores (MG) específicos
  vol_mg_linea_a: { label: "V-L1", unit: "V" },
  vol_mg_linea_b: { label: "V-L2", unit: "V" },
  vol_mg_linea_c: { label: "V-L3", unit: "V" },
  amp_mg_linea_a: { label: "A-L1", unit: "A" },
  amp_mg_linea_b: { label: "A-L2", unit: "A" },
  amp_mg_linea_c: { label: "A-L3", unit: "A" },
  temp_mg_exhosto: { label: "T-EXH", unit: "°C" },
  temp_mg_refrigerante: { label: "T-REFR", unit: "°C" },
  pres_mg_lubricante: { label: "P-LUBR", unit: "kPa" },
  pres_mg_refrigerante: { label: "P-REFR", unit: "kPa" },
  temp_mg_lubricante: { label: "T-LUBR", unit: "°C" },
  temp_mg_combustibe: { label: "T-COMB", unit: "°C" },
  pres_mg_combustible: { label: "P-COMB", unit: "kPa" },
  vol_mg_bateria: { label: "V-BAT", unit: "V" },
  temp_mg_entrada: { label: "T-ENT AG", unit: "°C" },
  pres_mg_entrada_ag: { label: "P-ENT AG", unit: "-" },
  temp_mg_salida: { label: "T-SAL AG", unit: "°C" },
  pres_mg_salida_ag_1: { label: "P-SAL AG", unit: "-" },

  // Propulsores
  consumo_p: { label: "CONS-P", unit: "L/h" },
  rpm_p: { label: "RPM-P", unit: "RPM" },
  pres_agua_camisas_p: { label: "P-CAMI", unit: "kPa" },
  temp_refrigerante_lt_p: { label: "T-REFR-LT", unit: "°C" },
  pres_entrada_motor_p: { label: "P-COMB", unit: "kPa" },
  pres_dif_filtro_p: { label: "P-DIF-C", unit: "kPa" },
  pres_aceite_p: { label: "P-ACEI", unit: "kPa" },
  temp_aceite_p: { label: "T-ACEI", unit: "°C" },
  pres_carter_p: { label: "P-CART", unit: "kPa" },
  temp_cojinete_p: { label: "T-COJI", unit: "°C" },
  voltaje_bateria_p: { label: "V-BAT", unit: "V" },
  lado_izquierdo_p: { label: "T-EXH-IZ", unit: "°C" },
  lado_derecho_p: { label: "T-EXH-DE", unit: "°C" },
  temp_entrada_mar_p: { label: "T-ENT-M", unit: "°C" },
  temp_salida_mar_p: { label: "T-SAL-M", unit: "°C" },
  pres_entrada_p: { label: "P-ENT-M", unit: "psi" },
  pres_salida_p: { label: "P-SAL-M", unit: "psi" },

  // PAA (Aire Acondicionado)
  paa_prioridad: { label: "PRIOR", unit: "-" },
  paa_etapa: { label: "ETAPA", unit: "%" },
  paa_slide_valve: { label: "SLIDE", unit: "%" },
  paa_amperaje: { label: "AMP", unit: "A" },
  paa_t_ret_evap: { label: "T-RET-EV", unit: "°C" },
  paa_p_succion: { label: "P-SUCC", unit: "Bar" },
  paa_p_descarga: { label: "P-DESC", unit: "Bar" },
  paa_t_sum_evap: { label: "T-SUM-EV", unit: "°C" },
  paa_p_ent_cond: { label: "P-ENT-CO", unit: "Bar" },
  paa_p_sal_cond: { label: "P-SAL-CO", unit: "Bar" },
  paa_t_ent_cond: { label: "T-ENT-CO", unit: "°C" },
  paa_t_sal_cond: { label: "T-SAL-CO", unit: "°C" },
  paa_niv_aceite_comp: { label: "N-ACEI", unit: "-" },
  paa_niv_ref_comp: { label: "N-REFR", unit: "-" },
  paa_niv_aceite_cond: { label: "MIRILLA", unit: "-" },

  // Frigoríficos
  p_succion_c1: { label: "P-SUC", unit: "bar" },
  p_descarga_c1: { label: "P-DES", unit: "bar" },
  amperaje_c1: { label: "AMP", unit: "A" },
  frecuencia_c: { label: "FREC", unit: "Hz" },
  rpm_motor_c: { label: "RPM-M", unit: "RPM" },
  pres_succion_comun_c: { label: "P-SUC-B", unit: "bar" },
  pres_descarga_comun_c: { label: "P-DES-B", unit: "bar" },
  temp_motor_c: { label: "T-MOT", unit: "°C" },
  nivel_aceite_c1: { label: "N-ACEI", unit: "-" },
  nivel_refrigerante_c1: { label: "N-REFR", unit: "-" },
  nivel_aceite_cond_1: { label: "MIRILLA", unit: "-" },
  pres_entrada_cond_c: { label: "P-ENT-CO", unit: "bar" },
  pres_salida_cond_c: { label: "P-SAL-CO", unit: "bar" },
  temp_succion_c: { label: "T-SUC", unit: "°C" },
  temp_descarga_c: { label: "T-DES", unit: "°C" },
  temp_plantas_v: { label: "T-PL-VEG", unit: "°C" },
  temp_plantas_c: { label: "T-PL-CAR", unit: "°C" },
  temp_locales_v: { label: "T-LO-VEG", unit: "°C" },
  temp_locales_c: { label: "T-LO-CAR", unit: "°C" },

  // Purificador
  presion_entrega_pur: { label: "P-ENT", unit: "kPa" },
  presion_succion_pur: { label: "P-SUC", unit: "kPa" },
  presion_descarga_pur: { label: "P-DES", unit: "kPa" },
  flujo_combustible_pur: { label: "FLUJO", unit: "L/h" },
  nivel_aceite_pur: { label: "N-ACEI", unit: "-" },
  amperaje_pur: { label: "AMP", unit: "A" },

  // Deoiler
  ppm_deoiler: { label: "PPM", unit: "PPM" },
  flujo_deoiler: { label: "FLUJO", unit: "L/h" },
  presion_sentina_deoiler: { label: "P-SENT", unit: "kPa" },
  presion_cebado_deoiler: { label: "P-CEBA", unit: "kPa" },

  // Manejadoras
  temp_salida_ma: { label: "T-SAL", unit: "°C" },
  temp_retorno_ma: { label: "T-RET", unit: "°C" },
  amperaje_ma: { label: "AMP", unit: "A" },
  frecuencia_ma: { label: "FREC", unit: "Hz" },
  heather_ma: { label: "HEATER", unit: "O/F" },

  // Bow Thruster
  velocidad_motor_bt: { label: "RPM-BT", unit: "RPM" },
  corriente_motor_bt: { label: "AMP-BT", unit: "A" },
  torque_motor_bt: { label: "TORQUE", unit: "%" },
  presion_bt: { label: "PRES", unit: "kPa" },
  temperatura_bt: { label: "TEMP", unit: "°C" },
  horas_bomba_1_bt: { label: "H-B1", unit: "Hrs" },
  horas_bomba_2_bt: { label: "H-B2", unit: "Hrs" },

  // Engranajes
  rpm_engranaje: { label: "RPM-EJE", unit: "RPM" },
  paso_engranaje: { label: "PASO", unit: "%" },
  temp_aceite_cpp: { label: "T-CPP", unit: "°C" },
  presion_aceite_cpp: { label: "P-CPP", unit: "Bar" },
  presion_aceite_engranaje: { label: "P-REDU", unit: "Bar" },
  temp_aceite_engranaje: { label: "T-REDU", unit: "°C" },
  presion_entrada_engranaje: { label: "P-ENT-A", unit: "Bar" },
  temp_entrada_engranaje: { label: "T-ENT-A", unit: "°C" },
  presion_salida_engranaje: { label: "P-SAL-A", unit: "Bar" },
  temp_salida_engranaje: { label: "T-SAL-A", unit: "°C" },
  temp_servomotor_engranaje: { label: "T-SERVO", unit: "°C" },

  // Desalinizadoras
  presion_entrada_des: { label: "P-ENT", unit: "kPa" },
  presion_salida_des: { label: "P-SAL", unit: "kPa" },
  consumo_des: { label: "CONS", unit: "L/h" },
  temp_entrada_agua_des: { label: "T-AGUA", unit: "°C" },
  presion_general_des: { label: "PRES", unit: "kPa" },
  presion_filtro_mic_des: { label: "P-FILT", unit: "kPa" },
  presion_membrana_des: { label: "P-MEMB", unit: "kPa" },
  producido_des: { label: "PROD", unit: "L/h" },
  conductividad_des: { label: "COND", unit: "PPM" },
  profundidad_des: { label: "PROF", unit: "m" },
  concentracion_cloro_des: { label: "CLORO", unit: "PPM" },

  // Aire Comprimido
  p_digital_ac: { label: "P-DIG", unit: "bar" },
  p_botella_ac: { label: "P-BOT", unit: "bar" },
  t_compresor_ac: { label: "T-COMP", unit: "°C" },
  amperaje_ac: { label: "AMP", unit: "A" }
};
