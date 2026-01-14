import React, { useMemo } from 'react';
import { RoundData, UserRole, UserSG } from '../types';

interface QRRoundSelectionProps {
  equipmentType: string;
  unit: string;
  rounds: RoundData[];
  currentRoundTime: string; // "19:00" from session
  guardStart: string; // ISO date string
  onSelect: (time: string, isPreview: boolean) => void;
  onCancel: () => void;
}

export const QRRoundSelection: React.FC<QRRoundSelectionProps> = ({
  equipmentType,
  unit,
  rounds,
  currentRoundTime,
  guardStart,
  onSelect,
  onCancel
}) => {
  
  // Clean Equipment Name for Title
  const equipmentTitle = equipmentType.replace(/_/g, ' ').toUpperCase();
  const unitTitle = unit.toUpperCase();

  // Generate 24h ordered list starting from 09:00
  const hours = useMemo(() => {
    const list = [];
    let startHour = 9; // Guard starts at 09:00
    for (let i = 0; i < 24; i++) {
        let h = (startHour + i) % 24;
        list.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return list;
  }, []);

  // Determine actual time to lock future rounds (simple logic)
  const realNow = new Date();
  const currentHourInt = realNow.getHours();
  // We can also rely on currentRoundTime passed from App which follows guard logic

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="bg-white pt-8 pb-4 px-6 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">EQUIPO IDENTIFICADO</p>
            <h2 className="text-2xl font-black text-navy uppercase leading-none tracking-tight mb-2">
                {equipmentTitle}
            </h2>
            <div className="inline-block bg-blue-50 px-4 py-1.5 rounded-full">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-tight">{unitTitle}</span>
            </div>
        </div>

        <div className="px-6 py-2 text-center">
            <p className="text-slate-500 font-bold text-sm">Seleccione el HORARIO para este reporte:</p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">📅 Guardia: {guardStart.split('T')[0]}</p>
        </div>

        {/* Grid */}
        <div className="p-6 grid grid-cols-4 gap-3">
            {hours.map((time) => {
                // Logic per item
                // Search if this round data exists for this specific equipment & unit
                // Logic note: rounds prop contains ALL rounds of the day. Filter primarily by equ&unit.
                // Harden filtering: Get ALL matches, then pick the best one (most recently updated)
                const candidates = rounds.filter(r => 
                    r.equipo_principal === equipmentType && 
                    r.UNIDAD_ACTIVA === unit && 
                    r.ronda_de_inspeccion === time &&
                    r.fecha === guardStart.split('T')[0] && 
                    !r.isDeleted
                );
                
                // If duplicates exist, take the one with the latest lastUpdated timestamp
                candidates.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
                const existingData = candidates[0];

                const isCompleted = !!existingData;
                const isCurrent = time === currentRoundTime;
                
                // Lock Logic: 
                // We lock future rounds. But how to determine future easily?
                // The list is ordered 09 -> 08.
                // Anything after "currentRoundTime" index in this ordered list could be considered future? 
                // However, user can manually set currentRoundTime in Dashboard. Let's rely on that or real time?
                // Visual consistency: If it's NOT Completed and NOT Current, is it locked? 
                // Or simply: If it's done -> Check. If it's current -> Blue. Else -> Gray/Lock.
                
                // Let's assume we allow clicking ANY past round (to fill if missed) or Future (if preemptive? usually no).
                // The image shows locks. Let's assume non-current, non-filled are locked IF they are strictly in the future.
                // For simplicity/safety, let's just highlight Done and Current.
                
                const timeInt = parseInt(time.split(':')[0]);
                const currentInt = parseInt(currentRoundTime.split(':')[0]);
                // Dealing with 24h cycle crossing midnight is tricky with simple ints.
                // Let's use the index in the ordered list.
                const myIndex = hours.indexOf(time);
                const currentIndex = hours.indexOf(currentRoundTime);
                
                const isFuture = myIndex > currentIndex;
                const isLocked = isFuture && !isCompleted; 

                // Styling
                let bgClass = "bg-slate-50 text-slate-300 border-slate-100";
                let content = <span className="">{time}</span>;

                if (isCurrent) {
                    bgClass = "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 border-blue-600 z-10 ring-4 ring-blue-500/10";
                    content = (
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-sm font-bold">{time}</span>
                            <span className="text-[8px] font-black uppercase mt-1 opacity-80">ACTUAL</span>
                        </div>
                    );
                } else if (isCompleted) {
                    bgClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
                     content = (
                         <div className="relative w-full h-full flex items-center justify-center">
                            <span className="font-bold text-sm">{time}</span>
                            <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></div>
                        </div>
                     );
                } 

                if (isLocked) {
                    content = (
                        <div className="flex items-center justify-center gap-1 opacity-50">
                             <span className="text-xs">{time}</span>
                             <span className="text-[8px]">🔒</span>
                        </div>
                    );
                }

                return (
                    <button
                        key={time}
                        onClick={() => {
                            if (isLocked) return;
                            // If it's completed, it's a Preview. 
                            // If it's current (even if completed?), usually current is Edit mode.
                            // If it's past and completed: Preview.
                            // If it's past and NOT completed: Edit (Filling late report).
                            
                            const isPreview = isCompleted; // Generally if data exists, we enter preview (which might allow edit if permissions ok)
                            onSelect(time, isPreview);
                        }}
                        disabled={isLocked}
                        className={`
                            aspect-square rounded-2xl flex items-center justify-center transition-all border-2
                            ${bgClass}
                            ${!isLocked && !isCurrent ? 'hover:bg-white hover:border-slate-300 hover:text-navy hover:shadow-md' : ''}
                        `}
                    >
                        {content}
                    </button>
                )
            })}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50">
             <button 
                onClick={onCancel}
                className="w-full py-4 text-xs font-black text-slate-400 hover:text-navy uppercase tracking-[0.2em] transition-colors"
            >
                Cancelar Operación
             </button>
        </div>

      </div>
    </div>
  );
};
