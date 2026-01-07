
import React, { useState, useEffect } from 'react';
import { UserSpecialty, UserSG, UserRole, RoundData, EquipmentType } from '../types';
import { saveToStorage, loadFromStorage } from '../services/storageService';

interface EquipmentHourRow {
  id: string;
  name: string;
  horasAnt: number; 
  horasAct: number; 
  horasDia: number;
  isWorkedEditable: boolean; 
  specialty: UserSpecialty;
}

interface EquipmentHoursViewProps {
  onBack: () => void;
  isReliefContext?: boolean; 
  onConfirmed?: () => void;   
  user: UserSG | null;
  rounds: RoundData[];
  guardDate: string;
}

interface RowProps {
  row: EquipmentHourRow;
  section: 'main' | 'aux';
  isEditMode: boolean;
  isReliefContext?: boolean;
  onUpdate: (section: 'main' | 'aux', id: string, field: 'horasDia' | 'horasAct' | 'horasAnt', value: string) => void;
}

const RowComponent: React.FC<RowProps> = ({ row, section, isEditMode, isReliefContext, onUpdate }) => {
  const isError = row.horasDia < 0 || row.horasDia > 24.5;
  const canEditRow = isEditMode || !isReliefContext; 

  return (
    <tr className={`border-b border-slate-100 transition-colors ${isError ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
      <td className="py-3 px-4 text-[11px] font-black text-navy uppercase leading-tight">{row.name}</td>
      
      <td className="py-2 px-2 text-center">
        <input 
          type="number" 
          step="0.1"
          value={row.horasAnt} 
          disabled={!canEditRow}
          onChange={(e) => onUpdate(section, row.id, 'horasAnt', e.target.value)}
          className={`w-24 border-2 border-slate-100 rounded-lg px-2 py-1 text-xs font-bold text-center outline-none ${!canEditRow ? 'bg-slate-50 text-slate-400' : 'focus:border-navy'}`}
        />
      </td>

      <td className="py-2 px-2 text-center">
        <input 
          type="number" 
          step="0.1"
          value={row.horasAct} 
          disabled={!canEditRow}
          onChange={(e) => onUpdate(section, row.id, 'horasAct', e.target.value)}
          className={`w-24 border-2 border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center outline-none ${!canEditRow ? 'bg-slate-50 text-slate-400' : 'focus:border-navy'}`}
        />
      </td>

      <td className="py-2 px-2 text-center">
        <span className={`text-xs font-black ${isError ? 'text-red-600' : 'text-blue-600'}`}>
          {row.horasDia.toFixed(1)}
        </span>
      </td>
    </tr>
  );
};

export const EquipmentHoursView: React.FC<EquipmentHoursViewProps> = ({ onBack, isReliefContext, onConfirmed, user, rounds, guardDate }) => {
  const STORAGE_KEY = 'equipment_hours_state_v3';
  const userSpecialty = user?.specialty || UserSpecialty.PROPULSION;
  const isHighRank = user?.role === UserRole.CHIEF_ENGINEER || user?.role === UserRole.CHIEF_GUARD;

  const INITIAL_DATA: { main: EquipmentHourRow[], aux: EquipmentHourRow[] } = {
    main: [
      { id: 'mp1', name: 'MOTOR PROPULSOR No.1', horasAnt: 5990, horasAct: 6014, horasDia: 24, isWorkedEditable: false, specialty: UserSpecialty.PROPULSION },
      { id: 'mp2', name: 'MOTOR PROPULSOR No.2', horasAnt: 6005, horasAct: 6029, horasDia: 24, isWorkedEditable: false, specialty: UserSpecialty.PROPULSION },
      { id: 'cr1', name: 'CAJA REDUCTORA No.1', horasAnt: 5990, horasAct: 6014, horasDia: 24, isWorkedEditable: false, specialty: UserSpecialty.PROPULSION },
      { id: 'cr2', name: 'CAJA REDUCTORA No.2', horasAnt: 6005, horasAct: 6029, horasDia: 24, isWorkedEditable: false, specialty: UserSpecialty.PROPULSION },
      { id: 'mg1', name: 'MOTOR GENERADOR No.1 BBR', horasAnt: 4164, horasAct: 4188, horasDia: 24, isWorkedEditable: false, specialty: UserSpecialty.PROPULSION },
      { id: 'mg2', name: 'MOTOR GENERADOR No.2 CENTRO', horasAnt: 6020, horasAct: 6020, horasDia: 0, isWorkedEditable: false, specialty: UserSpecialty.PROPULSION },
      { id: 'mg3', name: 'MOTOR GENERADOR No.3 EBR', horasAnt: 3412, horasAct: 3412, horasDia: 0, isWorkedEditable: false, specialty: UserSpecialty.PROPULSION },
      { id: 'mge', name: 'MOTOR GENERADOR EMERGENCIA', horasAnt: 16, horasAct: 16, horasDia: 0, isWorkedEditable: false, specialty: UserSpecialty.PROPULSION },
      { id: 'paa1', name: 'PLANTA DE A/A COMPRESOR No. 1', horasAnt: 12074, horasAct: 12074, horasDia: 0, isWorkedEditable: false, specialty: UserSpecialty.ELECTRICITY },
      { id: 'paa2', name: 'PLANTA DE A/A COMPRESOR No. 2', horasAnt: 13721, horasAct: 13732, horasDia: 11, isWorkedEditable: false, specialty: UserSpecialty.ELECTRICITY },
      { id: 'pf1', name: 'PLANTA FRIG. COMPRESOR No.1', horasAnt: 11354, horasAct: 11354, horasDia: 0, isWorkedEditable: true, specialty: UserSpecialty.ELECTRICITY },
      { id: 'pf2', name: 'PLANTA FRIG. COMPRESOR No.2', horasAnt: 459, horasAct: 477, horasDia: 18, isWorkedEditable: true, specialty: UserSpecialty.ELECTRICITY },
      { id: 'ac1', name: 'COMPRESOR DE AIRE COMP. No.1', horasAnt: 4510, horasAct: 4510, horasDia: 0, isWorkedEditable: false, specialty: UserSpecialty.ELECTRICITY },
      { id: 'ac2', name: 'COMPRESOR DE AIRE COMP. No.2', horasAnt: 10540, horasAct: 10552, horasDia: 12, isWorkedEditable: false, specialty: UserSpecialty.ELECTRICITY },
      { id: 'pur', name: 'PURIFICADOR DE COMBUSTIBLE', horasAnt: 1317, horasAct: 1327, horasDia: 10, isWorkedEditable: false, specialty: UserSpecialty.PROPULSION },
    ],
    aux: [
      { id: 'm1', name: 'MANEJADORA #1', horasAnt: 27262, horasAct: 27286, horasDia: 24, isWorkedEditable: true, specialty: UserSpecialty.ELECTRICITY },
      { id: 'm2', name: 'MANEJADORA #2', horasAnt: 27290, horasAct: 27314, horasDia: 24, isWorkedEditable: true, specialty: UserSpecialty.ELECTRICITY },
      { id: 'm3', name: 'MANEJADORA #3', horasAnt: 27476, horasAct: 27500, horasDia: 24, isWorkedEditable: true, specialty: UserSpecialty.ELECTRICITY },
      { id: 'm4', name: 'MANEJADORA #4', horasAnt: 27302, horasAct: 27326, horasDia: 24, isWorkedEditable: true, specialty: UserSpecialty.ELECTRICITY },
      { id: 'mc', name: 'MANEJADORA CASETTE', horasAnt: 28147, horasAct: 28171, horasDia: 24, isWorkedEditable: true, specialty: UserSpecialty.ELECTRICITY },
      { id: 'dp', name: 'DESALINIZADORA PROA', horasAnt: 2000, horasAct: 2024, horasDia: 24, isWorkedEditable: false, specialty: UserSpecialty.ELECTRICITY },
      { id: 'do', name: 'DESALINIZADORA POPA', horasAnt: 2478, horasAct: 2502, horasDia: 24, isWorkedEditable: false, specialty: UserSpecialty.ELECTRICITY },
      { id: 'de', name: 'DEOILER', horasAnt: 0, horasAct: 0, horasDia: 0, isWorkedEditable: false, specialty: UserSpecialty.PROPULSION },
      { id: 'bt1', name: 'BOMBA 1 BOW THRUSTER', horasAnt: 553, horasAct: 553, horasDia: 0, isWorkedEditable: false, specialty: UserSpecialty.ELECTRICITY },
      { id: 'bt2', name: 'BOMBA 2 BOW THRUSTER', horasAnt: 547, horasAct: 547, horasDia: 0, isWorkedEditable: false, specialty: UserSpecialty.ELECTRICITY },
      { id: 'bt1t', name: 'BOMBA DE TIMÓN #1', horasAnt: 5108, horasAct: 5108, horasDia: 0, isWorkedEditable: false, specialty: UserSpecialty.PROPULSION },
      { id: 'bt2t', name: 'BOMBA DE TIMÓN #2', horasAnt: 2240, horasAct: 2240, horasDia: 0, isWorkedEditable: false, specialty: UserSpecialty.PROPULSION },
    ]
  };

  const EQUIPMENT_DATA_MAP: Record<string, { type: EquipmentType, unit: string }> = {
    mp1: { type: EquipmentType.PROPULSORES, unit: 'Propulsor 1 (Babor)' },
    mp2: { type: EquipmentType.PROPULSORES, unit: 'Propulsor 2 (Estribor)' },
    cr1: { type: EquipmentType.ENGRANAJES, unit: 'Babor' },
    cr2: { type: EquipmentType.ENGRANAJES, unit: 'Estribor' },
    mg1: { type: EquipmentType.GENERADORES, unit: 'Generador 1 (Babor)' },
    mg2: { type: EquipmentType.GENERADORES, unit: 'Generador 2 (Centro)' },
    mg3: { type: EquipmentType.GENERADORES, unit: 'Generador 3 (Estribor)' },
    paa1: { type: EquipmentType.PAA, unit: 'Compresor #1' },
    paa2: { type: EquipmentType.PAA, unit: 'Compresor #2' },
    pf1: { type: EquipmentType.FRIGORIFICOS, unit: 'Compresor #1' },
    pf2: { type: EquipmentType.FRIGORIFICOS, unit: 'Compresor #2' },
    ac1: { type: EquipmentType.AIRE_COMPRIMIDO, unit: 'Compresor #1' },
    ac2: { type: EquipmentType.AIRE_COMPRIMIDO, unit: 'Compresor #2' },
    pur: { type: EquipmentType.PURIFICADOR, unit: 'Unidad Única' },
    m1: { type: EquipmentType.MANEJADORAS, unit: 'Manejadora #1' },
    m2: { type: EquipmentType.MANEJADORAS, unit: 'Manejadora #2' },
    m3: { type: EquipmentType.MANEJADORAS, unit: 'Manejadora #3' },
    m4: { type: EquipmentType.MANEJADORAS, unit: 'Manejadora #4' },
    mc: { type: EquipmentType.MANEJADORAS, unit: 'Cassete' },
    dp: { type: EquipmentType.DESALINIZADORAS, unit: 'Proa' },
    do: { type: EquipmentType.DESALINIZADORAS, unit: 'Popa' },
    de: { type: EquipmentType.DEOILER, unit: 'Deoiler Principal' },
    bt1: { type: EquipmentType.BOW_THRUSTER, unit: 'Bow Thruster 1' },
    bt2: { type: EquipmentType.BOW_THRUSTER, unit: 'Bow Thruster 2' },
    bt1t: { type: EquipmentType.TIMONES, unit: 'Bomba Timón 1' },
    bt2t: { type: EquipmentType.TIMONES, unit: 'Bomba Timón 2' },
  };

  const [data, setData] = useState(INITIAL_DATA);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const saved = await loadFromStorage<typeof INITIAL_DATA>(STORAGE_KEY);
      let currentData = INITIAL_DATA;

      if (saved) {
        currentData = saved;
        // Sincronizar especialidades por si cambiaron en el código
        ['main', 'aux'].forEach((section) => {
          (currentData as any)[section] = (currentData as any)[section].map((row: any) => {
          const initialRow = (INITIAL_DATA as any)[section].find((r: any) => r.id === row.id);
          if (initialRow) {
            return { ...row, specialty: initialRow.specialty };
          }
          return row;
        });
      });
    }

    // SINCRONIZACIÓN CON RONDAS REALES
    const syncWithRounds = (dataObj: typeof INITIAL_DATA) => {
      const updated = { ...dataObj };

      // Calcular fecha del día siguiente para la ronda de las 08:00
      const d = new Date(guardDate + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      const nextDay = d.toISOString().split('T')[0];

      ['main', 'aux'].forEach((section) => {
        updated[section as 'main' | 'aux'] = updated[section as 'main' | 'aux'].map(row => {
          const mapping = EQUIPMENT_DATA_MAP[row.id];
          if (!mapping) return row;

          // Buscar Horómetro Anterior (09:00 AM del día de inicio de guardia)
          const roundAnt = rounds.find(r => 
            !r.isDeleted &&
            r.fecha === guardDate && 
            r.ronda_de_inspeccion === '09:00' && 
            r.equipo_principal === mapping.type && 
            r.UNIDAD_ACTIVA === mapping.unit
          );

          // Buscar Horómetro Actual (08:00 AM del día siguiente / Fin de guardia)
          const roundAct = rounds.find(r => 
            !r.isDeleted &&
            (r.fecha === nextDay || r.fecha === guardDate) && // Algunos pueden loguear 08:00 con fecha del día anterior
            r.ronda_de_inspeccion === '08:00' && 
            r.equipo_principal === mapping.type && 
            r.UNIDAD_ACTIVA === mapping.unit
          );

          const hAct = roundAct ? parseFloat(roundAct.horometro as any) : row.horasAct;
          const hAnt = roundAnt ? parseFloat(roundAnt.horometro as any) : row.horasAnt;

          return {
            ...row,
            horasAct: isNaN(hAct) ? row.horasAct : hAct,
            horasAnt: isNaN(hAnt) ? row.horasAnt : hAnt,
            horasDia: !isNaN(hAct) && !isNaN(hAnt) ? Math.max(0, hAct - hAnt) : row.horasDia
          };
        });
      });
      return updated;
    };

      const syncedData = syncWithRounds(currentData);
      setData(syncedData);
      saveToStorage(STORAGE_KEY, syncedData);
    };
    
    loadData();
  }, [rounds, guardDate]);

  const handleUpdate = (section: 'main' | 'aux', id: string, field: 'horasDia' | 'horasAct' | 'horasAnt', value: string) => {
    const numValue = parseFloat(value) || 0;
    const newData = { ...data };
    const row = newData[section].find(r => r.id === id);
    
    if (row) {
      if (field === 'horasDia') {
        if (numValue < 0 || numValue > 24.5) return;
        row.horasDia = numValue;
        row.horasAct = row.horasAnt + numValue;
      } else if (field === 'horasAnt') {
        row.horasAnt = numValue;
        row.horasDia = row.horasAct - numValue;
      } else {
        row.horasAct = numValue;
        row.horasDia = numValue - row.horasAnt;
      }
      
      setData(newData);
      saveToStorage(STORAGE_KEY, newData);
    }
  };

  const validateAndConfirm = () => {
    // Validate on ALL data, no filtering
    const allRows = [...data.main, ...data.aux];

    const hasInvalid = allRows.some(r => r.horasDia < 0 || r.horasDia > 24.5);
    
    if (hasInvalid) {
      alert("ERROR CRÍTICO: No se puede proceder. Hay equipos con horas de operación fuera de rango (0-24.5h).");
      return;
    }

    if (isEditMode) {
      alert("Corrección de horómetros guardada por Oficial/Jefe.");
      setIsEditMode(false);
    }

    if (onConfirmed) {
      onConfirmed();
    }
  };

  // Removed filteredMain/filteredAux to show everything to everyone
  
  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 border border-slate-100 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-navy uppercase tracking-tighter leading-none">Reporte de Horas Diarias</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
            Control de Horómetros: 09:00 AM → 08:00 AM
          </p>
        </div>
        <div className="flex gap-2">
          {isHighRank && isReliefContext && (
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isEditMode ? 'bg-amber-500 text-white shadow-lg' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}
            >
              {isEditMode ? 'Desactivar Corrección' : 'Modo Corrección (Oficial)'}
            </button>
          )}
          {!isReliefContext && (
            <button onClick={onBack} className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Volver</button>
          )}
        </div>
      </div>

      <div className="space-y-12">
        {data.main.length > 0 && (
          <div>
            <div className="bg-navy text-white rounded-t-2xl px-6 py-3 flex justify-between items-center">
               <span className="text-[10px] font-black uppercase tracking-widest">Sistemas Principales</span>
               {isEditMode && <span className="text-[9px] font-black text-amber-300 uppercase animate-pulse">EDITANDO HORÓMETROS</span>}
            </div>
            <div className="overflow-x-auto border-x border-b border-slate-200 rounded-b-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-6">Equipos bajo su Cargo</th>
                    <th className="py-4 px-4 text-center">09:00 AM (Ant)</th>
                    <th className="py-4 px-4 text-center">08:00 AM (Act)</th>
                    <th className="py-4 px-4 text-center">Hrs Trabajadas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.main.map(row => <RowComponent key={row.id} row={row} section="main" isEditMode={isEditMode} isReliefContext={isReliefContext} onUpdate={handleUpdate} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.aux.length > 0 && (
          <div>
            <div className="bg-blue-600 text-white rounded-t-2xl px-6 py-3 flex justify-between items-center">
               <span className="text-[10px] font-black uppercase tracking-widest">Sistemas Auxiliares</span>
            </div>
            <div className="overflow-x-auto border-x border-b border-slate-200 rounded-b-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 px-6">Equipos Auxiliares</th>
                    <th className="py-4 px-4 text-center">09:00 AM (Ant)</th>
                    <th className="py-4 px-4 text-center">08:00 AM (Act)</th>
                    <th className="py-4 px-4 text-center">Hrs Trabajadas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.aux.map(row => <RowComponent key={row.id} row={row} section="aux" isEditMode={isEditMode} isReliefContext={isReliefContext} onUpdate={handleUpdate} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 p-6 bg-blue-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <span className="text-3xl">⚓</span>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">Confirmación Técnica y Auditoría</h4>
            <p className="text-[10px] opacity-80 font-bold leading-tight max-w-md">
              Al confirmar, los datos se compararán automáticamente con el <strong>Parte Diario</strong> y quedarán certificados en el historial de la guardia.
            </p>
          </div>
        </div>
        <button onClick={validateAndConfirm} className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 px-10 py-5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 border-b-4 border-emerald-700">
          {isEditMode ? 'Confirmar Corrección' : 'Confirmar y Habilitar Guardia'}
        </button>
      </div>
    </div>
  );
};
