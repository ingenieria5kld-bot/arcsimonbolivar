
import React, { useState } from 'react';
import { RoundData, EquipmentType } from '../types';
import { ROUND_TIMES, EQUIPMENT_LABELS, EQUIPMENT_UNITS_MAP } from '../constants';

interface GuardStatusProps {
  rounds: RoundData[];
  guardStart: string; // ISO string YYYY-MM-DDTHH:mm
  guardEnd: string;   // ISO string YYYY-MM-DDTHH:mm
  activeHour: string;
  onSelectRound: (hour: string, equipment: string, unit: string) => void;
  onBack: () => void;
}

export const GuardStatus: React.FC<GuardStatusProps> = ({ rounds, guardStart, guardEnd, activeHour, onSelectRound, onBack }) => {
  const [selectedSystem, setSelectedSystem] = useState<EquipmentType>(EquipmentType.GENERADORES);
  
  const getCellStatus = (hourRonda: string, equipment: string, unit: string) => {
    const gStart = new Date(guardStart);
    const gEnd = new Date(guardEnd);
    
    // Determinar la fecha/hora absoluta de esta celda
    const [h] = hourRonda.split(':').map(Number);
    const rDate = new Date(gStart.getFullYear(), gStart.getMonth(), gStart.getDate(), h, 0, 0);
    
    // Lógica Naval: Si la hora es menor a la hora de inicio (ej: 09:00), es del día siguiente
    if (h < gStart.getHours()) {
      rDate.setDate(rDate.getDate() + 1);
    }

    // Regla 1: ¿Está dentro del rango de la guardia definida?
    const isInRange = rDate >= gStart && rDate <= gEnd;
    
    // Regla 2: ¿Es el futuro real?
    const now = new Date();
    const margin = now.getTime() + (70 * 60 * 1000); // 70 min margen
    const isFutureReal = rDate.getTime() > margin;

    // Regla 3: ¿Ya fue completado?
    // Usamos el prefijo de la fecha de inicio de guardia como identificador
    const guardDay = guardStart.split('T')[0];
    const isCompleted = rounds.some(r => 
      r.fecha === guardDay && 
      r.ronda_de_inspeccion === hourRonda && 
      r.equipo_principal === equipment &&
      r.UNIDAD_ACTIVA === unit
    );

    return { 
      isEnabled: isInRange && !isFutureReal, 
      isCompleted, 
      isOutOfGuard: !isInRange,
      isFuture: isFutureReal && isInRange
    };
  };

  const units = EQUIPMENT_UNITS_MAP[selectedSystem] || [];

  return (
    <div className="bg-white rounded-[2rem] shadow-2xl p-6 md:p-10 animate-in fade-in zoom-in duration-300 border border-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Matriz de Inspección</h2>
          <div className="flex flex-col text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 gap-1">
             <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Guardia: {new Date(guardStart).toLocaleString()} → {new Date(guardEnd).toLocaleString()}
             </span>
             <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Turno Actual: {activeHour} HS
             </span>
          </div>
        </div>
        <button onClick={onBack} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all">
          Volver
        </button>
      </div>

      <div className="space-y-8">
        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 block">Filtrar Sistema Técnico</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {Object.entries(EQUIPMENT_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedSystem(key as EquipmentType)}
                className={`text-[9px] font-black px-4 py-3 rounded-xl border-2 transition-all uppercase leading-tight ${
                  selectedSystem === key 
                  ? 'bg-navy border-navy text-white shadow-lg' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto bg-slate-50 rounded-[2rem] border border-slate-200 p-2 shadow-inner">
          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 p-4 text-left text-[10px] font-black text-slate-400 uppercase min-w-[160px]">Unidad / Horario</th>
                {ROUND_TIMES.map(h => (
                  <th key={h} className={`p-4 text-[10px] font-black uppercase tracking-tighter ${h === activeHour ? 'text-blue-600' : 'text-slate-400'}`}>
                    {h}
                    {h === activeHour && <div className="h-1 w-full bg-blue-600 rounded-full mt-2"></div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {units.map(unit => (
                <tr key={unit}>
                  <td className="sticky left-0 z-10 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-[11px] font-black text-navy uppercase">{unit}</td>
                  {ROUND_TIMES.map(hour => {
                    const { isEnabled, isCompleted, isOutOfGuard, isFuture } = getCellStatus(hour, selectedSystem, unit);
                    const isSessionHour = hour === activeHour;
                    
                    let bg = "bg-white border-slate-100 opacity-20 grayscale cursor-not-allowed";
                    let icon = "🔒";
                    let action = () => {};

                    if (isCompleted) {
                      bg = "bg-emerald-500 border-emerald-600 shadow-emerald-200 cursor-pointer text-white";
                      icon = "✓";
                      action = () => onSelectRound(hour, selectedSystem, unit);
                    } else if (isOutOfGuard) {
                      bg = "bg-slate-200 border-slate-300 opacity-30 cursor-not-allowed";
                      icon = "∅";
                    } else if (isFuture) {
                      bg = "bg-white border-slate-200 opacity-50 cursor-not-allowed";
                      icon = "⏳";
                    } else if (isEnabled) {
                      bg = isSessionHour 
                        ? "bg-blue-600 border-blue-700 shadow-lg text-white animate-pulse cursor-pointer" 
                        : "bg-blue-100 border-blue-200 text-blue-900 cursor-pointer hover:bg-blue-200";
                      icon = isSessionHour ? "📝" : "➕";
                      action = () => onSelectRound(hour, selectedSystem, unit);
                    }

                    return (
                      <td key={hour} className="p-1">
                        <button
                          onClick={action}
                          disabled={!isEnabled && !isCompleted}
                          className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center text-sm font-black transition-all ${bg}`}
                        >
                          {icon}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-6 pt-10 border-t border-slate-50">
        <Legend color="bg-blue-600 border-blue-700" label="Seleccionada" />
        <Legend color="bg-emerald-500" label="Completada" />
        <Legend color="bg-blue-100" label="Habilitada (En Rango)" />
        <Legend color="bg-slate-200 opacity-30" label="Fuera de Guardia" />
        <Legend color="bg-white border-slate-100 opacity-20" label="Futuro / Bloqueado" />
      </div>
    </div>
  );
};

const Legend = ({ color, label }: any) => (
  <div className="flex items-center gap-3">
    <div className={`w-6 h-6 rounded-xl border-2 ${color}`}></div>
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
  </div>
);
