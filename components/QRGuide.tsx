
import React from 'react';
import { EQUIPMENT_LABELS, EQUIPMENT_UNITS_MAP } from '../constants';

interface QRGuideProps {
  onBack: () => void;
}

export const QRGuide: React.FC<QRGuideProps> = ({ onBack }) => {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 animate-in fade-in zoom-in duration-300 border border-slate-100">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Guía de Marcaje QR</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Configuración para Identificación de Equipos</p>
        </div>
        <button onClick={onBack} className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Volver</button>
      </div>

      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 mb-8">
        <h4 className="text-xs font-black text-blue-900 uppercase mb-2">Instrucciones de Uso</h4>
        <p className="text-xs text-blue-700 font-medium leading-relaxed">
          Para que el escáner de la aplicación reconozca el equipo automáticamente, genere un código QR con el texto exacto que aparece en la columna <strong>"Texto QR"</strong>. Al escanearlo, el sistema abrirá instantáneamente el formulario correspondiente.
        </p>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-3xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
              <th className="py-4 px-6">Sistema Técnico</th>
              <th className="py-4 px-6">Unidad Específica</th>
              <th className="py-4 px-6">Texto para el Código QR</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(EQUIPMENT_UNITS_MAP).map(([type, units]) => (
              units.map((unit, idx) => (
                <tr key={`${type}-${idx}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6 text-[11px] font-bold text-slate-500 uppercase">{EQUIPMENT_LABELS[type]}</td>
                  <td className="py-3 px-6 text-[11px] font-black text-navy uppercase">{unit}</td>
                  <td className="py-3 px-6">
                    <code className="bg-navy text-white px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold shadow-sm">
                      {`${type}:${unit.split(' ')[0].replace(/#/g, '')}`}
                    </code>
                  </td>
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
          Nota: El sistema utiliza una búsqueda por coincidencia parcial para el nombre de la unidad.
        </p>
      </div>
    </div>
  );
};
