
import React, { useState } from 'react';
import { EQUIPMENT_LABELS, EQUIPMENT_UNITS_MAP } from '../constants';

interface AppGuideProps {
  onBack: () => void;
}

export const AppGuide: React.FC<AppGuideProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('rondas');

  const tabs = [
    { id: 'rondas', label: 'Rondas', icon: '📋' },
    { id: 'horas', label: 'Horas', icon: '⏱️' },
    { id: 'qr', label: 'QR', icon: '📷' },
    { id: 'sync', label: 'Sincro', icon: '☁️' },
    { id: 'ia', label: 'IA', icon: '✨' },
    { id: 'personal', label: 'Admin', icon: '👤' }
  ];

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 animate-in fade-in zoom-in duration-300 border border-slate-100 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Manual de Operación</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sistema de Ingeniería ARC Simón Bolívar</p>
        </div>
        <button onClick={onBack} className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
          Cerrar Manual
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border-2 ${
              activeTab === tab.id 
              ? 'bg-navy border-navy text-white shadow-xl scale-105' 
              : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'rondas' && (
          <section className="animate-in slide-in-from-right-4">
            <h3 className="text-xl font-black text-navy uppercase mb-4">Matriz de Inspección</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  El sistema gestiona ciclos de 24 horas, iniciando a las <span className="text-blue-600 font-bold">09:00 AM</span> y finalizando a las <span className="text-blue-600 font-bold">08:00 AM</span> del día siguiente.
                </p>
                <div className="space-y-3">
                  <StatusItem color="bg-blue-600" label="Azul Brillante" desc="Ronda actual del turno. Es la prioridad de registro." />
                  <StatusItem color="bg-emerald-500" label="Verde" desc="Ronda completada y certificada con firma." />
                  <StatusItem color="bg-blue-100" label="Celeste" desc="Ronda habilitada para registro previo." />
                  <StatusItem color="bg-slate-200" label="Gris/🔒" desc="Ronda bloqueada (futura o fuera de guardia)." />
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Procedimiento Sugerido</h4>
                <ol className="space-y-3">
                  <li className="flex gap-3 text-xs font-bold text-slate-600">
                    <span className="w-5 h-5 bg-navy text-white rounded-full flex items-center justify-center text-[10px] flex-shrink-0">1</span>
                    Identificar el equipo físicamente.
                  </li>
                  <li className="flex gap-3 text-xs font-bold text-slate-600">
                    <span className="w-5 h-5 bg-navy text-white rounded-full flex items-center justify-center text-[10px] flex-shrink-0">2</span>
                    Tomar lecturas en tiempo real de los manómetros y sensores.
                  </li>
                  <li className="flex gap-3 text-xs font-bold text-slate-600">
                    <span className="w-5 h-5 bg-navy text-white rounded-full flex items-center justify-center text-[10px] flex-shrink-0">3</span>
                    Ingresar los datos en el formulario móvil y firmar la certificación.
                  </li>
                </ol>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'horas' && (
          <section className="animate-in slide-in-from-right-4">
            <h3 className="text-xl font-black text-navy uppercase mb-4">Reporte de Horas Diarias</h3>
            
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 mb-8">
               <h4 className="text-sm font-black text-navy uppercase mb-3">Ejemplo Práctico de Cálculo</h4>
               <div className="space-y-4 text-xs text-slate-700 font-medium leading-relaxed">
                  <div className="flex gap-3">
                     <span className="font-bold text-blue-600">Paso 1:</span>
                     <p>
                       <strong>Ronda de Inicio (09:00 AM)</strong>. Haces tu primera ronda del día a las 9 de la mañana. Vas al Generador 1 y miras el horómetro.
                       <br/><span className="italic opacity-80">👀 Lectura: 4,164.0 h | 📲 App: Ingresas 4,164.0 en la ronda 09:00.</span>
                     </p>
                  </div>
                  <div className="flex gap-3">
                     <span className="font-bold text-blue-600">Paso 2:</span>
                     <p>
                       <strong>Operación Normal</strong>. El generador se queda prendido todo el día y toda la noche generando energía.
                     </p>
                  </div>
                  <div className="flex gap-3">
                     <span className="font-bold text-blue-600">Paso 3:</span>
                     <p>
                       <strong>Ronda de Cierre (08:00 AM - Día Siguiente)</strong>. Al día siguiente (ej. 7 Enero), antes de entregar guardia, haces la última ronda a las 8 AM.
                       <br/><span className="italic opacity-80">👀 Lectura: 4,188.0 h | 📲 App: Ingresas 4,188.0 en la ronda 08:00.</span>
                     </p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-blue-200 mt-2">
                     <p className="font-black text-navy uppercase text-[10px] mb-1">🧮 Cálculo Automático del Sistema</p>
                     <p className="font-mono text-blue-800">
                       4,188.0 (Final) - 4,164.0 (Inicial) = <span className="font-bold bg-yellow-100 px-1">24.0 Horas Trabajadas</span>
                     </p>
                     <p className="mt-2 text-[10px] opacity-70">
                       Nota: Si apagas el equipo 2 horas (ej. 20:00 a 22:00), el horómetro se detendrá. La resta final será: 4,186.0 - 4,164.0 = 22.0 Horas. El sistema es exacto porque usa la acumulación real del reloj.
                     </p>
                  </div>
               </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl mb-8 flex items-start gap-4">
               <span className="text-3xl">⚠️</span>
               <div>
                  <h4 className="text-sm font-black text-amber-900 uppercase">Bloqueo Operativo</h4>
                  <p className="text-xs text-amber-800 font-bold mt-1">
                    Es obligatorio cerrar y confirmar el reporte de horas a las 09:00 AM para habilitar la guardia del día.
                  </p>
               </div>
            </div>
          </section>
        )}

        {activeTab === 'qr' && (
          <section className="animate-in slide-in-from-right-4">
            <h3 className="text-xl font-black text-navy uppercase mb-4">Escáner e Identificación QR</h3>
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 mb-6">
              <p className="text-xs text-blue-800 font-bold leading-relaxed">
                Cada equipo en la unidad debe tener un código QR con el texto específico. Al escanearlo, el sistema omite la navegación manual y abre el formulario exacto del equipo.
              </p>
            </div>
            <div className="overflow-hidden border border-slate-200 rounded-3xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                  <tr>
                    <th className="py-3 px-6">Equipo</th>
                    <th className="py-3 px-6">Texto Código QR</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(EQUIPMENT_UNITS_MAP).slice(0, 6).map(([type, units]) => (
                    <tr key={type} className="border-b border-slate-50">
                      <td className="py-3 px-6 text-[10px] font-black text-navy uppercase">{EQUIPMENT_LABELS[type]}</td>
                      <td className="py-3 px-6">
                        <code className="bg-slate-100 text-blue-600 px-2 py-1 rounded text-[9px] font-mono font-bold">
                          {`${type}:${units[0].split(' ')[0]}`}
                        </code>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50">
                    <td colSpan={2} className="py-3 px-6 text-center text-[9px] font-bold text-slate-400 uppercase italic">Ver catálogo completo en oficina de ingeniería</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'sync' && (
          <section className="animate-in slide-in-from-right-4">
            <h3 className="text-xl font-black text-navy uppercase mb-4">Reportes y Nube</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-4 text-xl">📄</div>
                  <h4 className="text-sm font-black text-navy uppercase mb-2">Folios PDF</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Genera el reporte oficial de guardia listo para imprimir o anexar al Libro de Bitácora. Incluye firmas y parámetros organizados cronológicamente.
                  </p>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-4 text-xl">📊</div>
                  <h4 className="text-sm font-black text-navy uppercase mb-2">Base de Datos CSV</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Exporta la guardia completa en formato Excel (.csv) para análisis estadístico avanzado o auditorías técnicas.
                  </p>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm md:col-span-2 flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">☁️</div>
                  <div>
                    <h4 className="text-sm font-black text-navy uppercase mb-1">Google Drive Sync</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Sincronización automática con la carpeta compartida de Ingeniería. Requiere autenticación con la cuenta oficial de la unidad.
                    </p>
                  </div>
               </div>
            </div>
          </section>
        )}

        {activeTab === 'ia' && (
          <section className="animate-in slide-in-from-right-4">
            <h3 className="text-xl font-black text-navy uppercase mb-4">Análisis IA y Tendencias</h3>
            <div className="bg-gradient-to-br from-navy to-blue-800 text-white p-8 rounded-[2rem] shadow-xl mb-8 relative overflow-hidden">
               <div className="relative z-10">
                  <h4 className="text-lg font-black uppercase mb-4">Mantenimiento Predictivo</h4>
                  <p className="text-sm font-medium opacity-90 leading-relaxed max-w-2xl">
                    Utilice el botón "Analizar con IA" en la vista de Tendencias para que el modelo Gemini procese los últimos 15 registros. La IA detectará ruidos en los datos, desviaciones térmicas o desgastes prematuros en cojinetes antes de que ocurra la falla.
                  </p>
               </div>
               <span className="absolute -right-10 -bottom-10 text-[12rem] opacity-10">✨</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Gráficos Comparativos</h5>
                  <p className="text-xs text-slate-600 font-bold italic">Permiten visualizar la disparidad de carga entre los Generadores o Propulsores en un solo vistazo.</p>
               </div>
               <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Nivel Crítico</h5>
                  <p className="text-xs text-slate-600 font-bold italic">La IA asigna un valor de 0 a 10. Si el nivel supera 7, se debe notificar inmediatamente al Oficial de Guardia.</p>
               </div>
            </div>
          </section>
        )}

        {activeTab === 'personal' && (
          <section className="animate-in slide-in-from-right-4">
            <h3 className="text-xl font-black text-navy uppercase mb-4">Roles y Seguridad</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">
                    <th className="py-3 px-6">Rol de Usuario</th>
                    <th className="py-3 px-6">Capacidades</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50">
                    <td className="py-3 px-6 font-black text-blue-600 text-[10px] uppercase tracking-tight">Ingeniero Jefe</td>
                    <td className="py-3 px-6 text-xs text-slate-600 font-medium">Acceso total, gestión de personal, configuración de sistemas.</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-3 px-6 font-black text-amber-600 text-[10px] uppercase tracking-tight">Oficial de Guardia (Jefe de Guardia)</td>
                    <td className="py-3 px-6 text-xs text-slate-600 font-medium">Supervisión de todas las divisiones (Motor/Ele), revisión de reportes.</td>
                  </tr>
                  <tr className="border-b border-slate-50">
                    <td className="py-3 px-6 font-black text-navy text-[10px] uppercase tracking-tight">Operador (SG)</td>
                    <td className="py-3 px-6 text-xs text-slate-600 font-medium">Registro de parámetros en equipos de su división específica.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-8 p-6 bg-slate-100 rounded-2xl text-center">
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Cambio de Contraseña</p>
               <p className="text-xs text-slate-600 font-bold mt-2 leading-relaxed">
                 Si olvida su contraseña, únicamente el <span className="text-navy">Ingeniero Jefe</span> o el <span className="text-navy">Oficial de Guardia</span> pueden resetearla desde la sección "Personal" del Dashboard principal.
               </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const StatusItem = ({ color, label, desc }: any) => (
  <div className="flex items-center gap-4 group">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white font-black shadow-sm group-hover:scale-110 transition-transform`}>
      {label.charAt(0)}
    </div>
    <div>
      <h5 className="text-[10px] font-black text-navy uppercase tracking-tight">{label}</h5>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{desc}</p>
    </div>
  </div>
);
