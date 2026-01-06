
export enum View {
  LOGIN = 'LOGIN',
  REGISTER_SG = 'REGISTER_SG',
  DASHBOARD = 'DASHBOARD',
  GENERAL_DATA = 'GENERAL_DATA',
  EQUIPMENT_LOGGING = 'EQUIPMENT_LOGGING',
  ANALYSIS = 'ANALYSIS',
  REPORTS = 'REPORTS',
  HOUR_VERIFICATION = 'HOUR_VERIFICATION',
  SYNC = 'SYNC',
  ADMIN_LISTS = 'ADMIN_LISTS',
  QR_SCAN = 'QR_SCAN',
  TENDENCIES = 'TENDENCIES',
  ALARM_CONFIG = 'ALARM_CONFIG',
  SIGNATURE = 'SIGNATURE',
  GUARD_STATUS = 'GUARD_STATUS',
  EQUIPMENT_HOURS = 'EQUIPMENT_HOURS',
  APP_GUIDE = 'APP_GUIDE'
}

export enum UserRole {
  OPERATOR = 'OPERATOR', // Suboficial Guardia - Operador
  SG_ENGINEERING = 'SG_ENGINEERING', // Suboficial Guardia Ingenieria
  CHIEF_GUARD = 'CHIEF_GUARD', // Jefe de Guardia (Oficial)
  CHIEF_ENGINEER = 'CHIEF_ENGINEER' // Ingeniero Jefe
}

export enum UserSpecialty {
  PROPULSION = 'PROPULSION', // Motorista
  ELECTRICITY = 'ELECTRICITY', // Electricista
  ALL = 'ALL' // Solo para Ingeniero Jefe / Admin
}

export interface UserSG {
  grade: string;
  name: string;
  password?: string;
  role: UserRole;
  specialty: UserSpecialty;
  isDeleted?: boolean;
  lastUpdated?: number;
}

export interface AuditLog {
  edited_by: string;
  edited_at: string;
  previous_values: Partial<RoundData>;
  reason?: string;
}

export interface RoundData {
  UNIQUE_KEY: string;
  fecha: string;
  ronda_de_inspeccion: string;
  on_off: 'y' | 's' | 'n';
  condicion: string;
  sg: string;
  sgi?: string;
  ogi?: string;
  equipo_principal: string;
  EQUIPO_ACTIVO: string;
  UNIDAD_ACTIVA: string;
  TIMESTAMP_GUARDADO: string;
  horometro?: number;
  trim?: number;
  signature?: string; 
  audit_trail?: AuditLog[];
  lastUpdated?: number;
  isDeleted?: boolean;
  [key: string]: any;
}

export interface StaffLists {
  sg: UserSG[];
  sgi: string[];
  ogi: string[];
}

export enum EquipmentType {
  GENERADORES = 'generadores',
  PROPULSORES = 'propulsores',
  FRIGORIFICOS = 'frigorificos',
  PAA = 'planta_aire_acondicionado',
  PURIFICADOR = 'purificador',
  DEOILER = 'deoiler',
  MANEJADORAS = 'manejadoras_aire',
  BOW_THRUSTER = 'bow_thruster',
  ENGRANAJES = 'engranajes',
  DESALINIZADORAS = 'desalinizadoras',
  AIRE_COMPRIMIDO = 'aire_comprimido',
  TIMONES = 'timones'
}
