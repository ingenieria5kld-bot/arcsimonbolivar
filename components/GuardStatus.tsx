
import React, { useState } from 'react';
import { RoundData, EquipmentType, UserSpecialty, UserSG, UserRole } from '../types';
import { ROUND_TIMES, EQUIPMENT_LABELS, EQUIPMENT_UNITS_MAP, SPECIALTY_EQUIPMENT } from '../constants';

interface GuardStatusProps {
  rounds: RoundData[];
  guardStart: string; 
  guardEnd: string;   
  activeHour: string;
  user: UserSG;
  onSelectRound: (hour: string, equipment: string, unit: string, existingRound?: RoundData) => void;
  onBack: () => void;
}

export const GuardStatus: React.FC<GuardStatusProps> = ({ rounds, guardStart, guardEnd, activeHour, user, onSelectRound, onBack }) => {
  const allowedEquipments = SPECIALTY_EQUIPMENT[user.specialty] || Object.values(EquipmentType);
  const [selectedSystem, setSelectedSystem] = useState<EquipmentType>(allowedEquipments[0]);
  
  const isHighRank = user.role === UserRole.CHIEF_ENGINEER || user.role === UserRole.CHIEF_GUARD;

  const getCellStatus = (hourRonda: string, equipment: string, unit: string) => {
    const gStart = new Date(guardStart);
    const gEnd = new Date(guardEnd);
    
    const [h] = hourRonda.split(':').map(Number);
    const rDate = new Date(gStart.getFullYear(), gStart.getMonth(), gStart.getDate(), h, 0, 0);
    
    if (h < gStart.getHours()) {
      rDate.setDate(rDate.getDate() + 1);
    }

    const isInRange = rDate >= gStart && rDate <= gEnd;
    const now = new Date();
    const margin = now.getTime() + (70 * 60 * 1000); 
    const isFutureReal = rDate.getTime() > margin;

    const guardDay = guardStart.split('T')[0];
    const existingRound = rounds.find(r => 
      r.fecha === guardDay && 
      r.ronda_de_inspeccion === hourRonda && 
      r.equipo_principal === equipment &&
      r.UNIDAD_ACTIVA === unit
    );

    return { 
      isEnabled: isInRange && !isFutureReal, 
      existingRound, 
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
                Guardia: {new Date(guardStart).toLocaleString()}
             </span>
             {isHighRank && (
               <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase mt-1">
                 Modo Auditoría Habilitado
               </span>
             )}
          </div>
        </div>
        <button onClick={onBack} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase transition-all">
          Volver
        </button>
      </div>

      <div className="space-y-8">
        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 block">
            Filtrar Sistema Técnico ({user.specialty === UserSpecialty.PROPULSION ? 'Propulsión' : user.specialty === UserSpecialty.ELECTRICITY ? 'Electricidad' : 'Global'})
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {allowedEquipments.map((key) => (
              <button
                key={key}
                onClick={() => setSelectedSystem(key)}
                className={`text-[9px] font-black px-4 py-3 rounded-xl border-2 transition-all uppercase leading-tight ${
                  selectedSystem === key 
                  ? 'bg-navy border-navy text-white shadow-lg' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                }`}
              >
                {EQUIPMENT_LABELS[key]}
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
                    const { isEnabled, existingRound, isOutOfGuard, isFuture } = getCellStatus(hour, selectedSystem, unit);
                    const isSessionHour = hour === activeHour;
                    
                    let bg = "bg-white border-slate-100 opacity-20 grayscale cursor-not-allowed";
                    let icon = "🔒";
                    let action = () => {};

                    if (existingRound) {
                      bg = "bg-emerald-500 border-emerald-600 shadow-emerald-200 cursor-pointer text-white";
                      icon = existingRound.audit_trail ? "⚠️" : "✓";
                      // Solo oficiales/jefes pueden hacer clic para editar una ronda ya completada
                      if (isHighRank) {
                        action = () => {
                           if (window.confirm(`¿Desea entrar en Modo Corrección para el equipo ${unit} a las ${hour} HS? (Se generará rastro de auditoría)`)) {
                              onSelectRound(hour, selectedSystem, unit, existingRound);
                           }
                        };
                      }
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
                          disabled={!isEnabled && !existingRound}
                          title={existingRound && !isHighRank ? "Completado (Solo editables por Oficial/Jefe)" : ""}
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
    </div>
  );
};
