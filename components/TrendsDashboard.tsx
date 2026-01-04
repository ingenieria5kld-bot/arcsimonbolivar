import React, { useState, useEffect, useRef } from 'react';
import { RoundData, EquipmentType, UserSG, UserSpecialty } from '../types';
import { EQUIPMENT_LABELS, SPECIALTY_EQUIPMENT } from '../constants';
import Chart from 'chart.js/auto';

interface TrendsDashboardProps {
  rounds: RoundData[];
  user: UserSG;
  onBack: () => void;
}

export const TrendsDashboard: React.FC<TrendsDashboardProps> = ({ rounds, user, onBack }) => {
  const [viewMode, setViewMode] = useState<'simple' | 'multi' | 'presets'>('simple');
  
  const allowedEquip = SPECIALTY_EQUIPMENT[user.specialty as UserSpecialty] || Object.values(EquipmentType);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType>(allowedEquip[0]);
  const [availableParams, setAvailableParams] = useState<string[]>([]);
  const [selectedParams, setSelectedParams] = useState<string[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const PRESETS_CONFIG: Record<string, { title: string, params: string[], icon: string, description: string }> = {
    eficiencia: { 
      title: 'Eficiencia Energética', 
      params: ['carga', 'consumo', 'consumo_p'], 
      icon: '⚓', 
      description: 'Relación entre carga (%) y consumo (L/h).' 
    },
    termico: { 
      title: 'Perfil Térmico Exhosto', 
      params: ['temp_mg_exhosto', 'lado_izquierdo_p', 'lado_derecho_p'], 
      icon: '🔥', 
      description: 'Balance de temperaturas de salida de gases.' 
    },
    electrico: { 
      title: 'Balance de Fases', 
      params: ['amp_mg_linea_a', 'amp_mg_linea_b', 'amp_mg_linea_c', 'vol_mg_linea_a', 'vol_mg_linea_b', 'vol_mg_linea_c'], 
      icon: '⚡', 
      description: 'Comparativa de carga por fase (A/V).' 
    },
    lubricacion: { 
      title: 'Salud de Lubricación', 
      params: ['pres_mg_lubricante', 'temp_mg_lubricante', 'pres_aceite_p', 'temp_aceite_p', 'presion_aceite_engranaje', 'temp_aceite_engranaje'], 
      icon: '🛢️', 
      description: 'Relación Presión vs Temperatura de aceite.' 
    },
    enfriamiento: { 
      title: 'Delta Intercambiadores', 
      params: ['temp_mg_entrada', 'temp_mg_salida', 'temp_entrada_mar_p', 'temp_salida_mar_p', 'temp_entrada_engranaje', 'temp_salida_engranaje'], 
      icon: '❄️', 
      description: 'Diferencial de T° Entrada vs Salida Agua Mar.' 
    },
    calidad_agua: { 
      title: 'Rendimiento de Planta', 
      params: ['conductividad_des', 'producido_des', 'consumo_des'], 
      icon: '💧', 
      description: 'Calidad (PPM) vs Producción (L/h).' 
    }
  };

  const equipmentRounds = rounds.filter(r => r.equipo_principal === selectedEquipment);

  useEffect(() => {
    if (equipmentRounds.length > 0) {
      // Identificar campos numéricos (excluyendo metadata)
      const sample = equipmentRounds[0];
      // Use any cast for sample key access to avoid potential unknown type issues during filtering
      const params = Object.keys(sample).filter(key => 
        typeof (sample as any)[key] === 'number' || 
        (!isNaN(parseFloat((sample as any)[key])) && !['UNIQUE_KEY', 'TIMESTAMP_GUARDADO', 'horometro', 'trim'].includes(key))
      );
      setAvailableParams(params);
      
      if (viewMode === 'simple') {
        if (params.length > 0 && (selectedParams.length === 0 || !params.includes(selectedParams[0]))) {
          setSelectedParams([params[0]]);
        }
      }
    } else {
      setAvailableParams([]);
    }
  }, [selectedEquipment, equipmentRounds, viewMode]);

  const toggleParam = (param: string) => {
    setSelectedParams(prev => 
      prev.includes(param) ? prev.filter(p => p !== param) : [...prev, param]
    );
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS_CONFIG[presetKey];
    // Filter parameters that actually exist for the current equipment
    const validParams = preset.params.filter(p => availableParams.includes(p));
    if (validParams.length > 0) {
      setSelectedParams(validParams);
      setActivePreset(presetKey);
    } else {
      alert("Este diagnóstico no aplica para el equipo seleccionado (faltan parámetros).");
    }
  };

  const generateChart = () => {
    if (!chartRef.current || equipmentRounds.length === 0 || selectedParams.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // 1. Obtener todos los puntos de tiempo únicos (Fecha + Hora) y ordenarlos
    // FIX: Added explicit <string> generic to Array.from to prevent unknown[] inference error (Line 49 fix)
    const timePoints: string[] = Array.from<string>(new Set(
      equipmentRounds.map(d => `${d.fecha} ${d.ronda_de_inspeccion}`)
    )).sort((a: string, b: string) => {
      // Ordenamiento cronológico simple basado en string ISO-ish
      return a.localeCompare(b);
    });

    // 2. Identificar las unidades presentes
    const units = Array.from(new Set(equipmentRounds.map(d => d.UNIDAD_ACTIVA)));
    
    // 3. Crear datasets para cada combinación de Unidad + Parámetro
    const colors = [
      '#003366', '#cc0000', '#008000', '#ff8c00', '#800080', 
      '#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'
    ];

    let colorIdx = 0;
    const datasets: any[] = [];

    selectedParams.forEach(param => {
      units.forEach(unit => {
        const data = timePoints.map(timeLabel => {
          const match = equipmentRounds.find(r => 
            r.UNIDAD_ACTIVA === unit && 
            `${r.fecha} ${r.ronda_de_inspeccion}` === timeLabel
          );
          return match ? parseFloat((match as any)[param]) : null;
        });

        const label = selectedParams.length > 1 ? `${unit} - ${param.replace(/_/g, ' ').toUpperCase()}` : unit as string;

        datasets.push({
          label: label,
          data: data,
          borderColor: colors[colorIdx % colors.length],
          backgroundColor: colors[colorIdx % colors.length] + '15',
          borderWidth: selectedParams.length > 2 ? 1.5 : 2.5,
          pointRadius: selectedParams.length > 5 ? 2 : 4,
          pointHoverRadius: 6,
          tension: 0.3,
          spanGaps: true,
          fill: false,
        });
        colorIdx++;
      });
    });

    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      try {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: { 
            labels: timePoints.map((tp: string) => tp.split(' ')[1]),
            datasets 
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: { 
                position: 'top' as const, 
                labels: { 
                  font: { size: 10, weight: 'bold' },
                  usePointStyle: true,
                  boxWidth: 6
                } 
              },
              tooltip: {
                callbacks: {
                  title: (items: any) => {
                    const index = items[0].dataIndex;
                    return `Fecha: ${timePoints[index]}`;
                  }
                }
              },
              title: { 
                display: true, 
                text: viewMode === 'presets' && activePreset ? PRESETS_CONFIG[activePreset].title : 'Análisis de Tendencias',
                font: { size: 14, weight: 'bold' }
              }
            },
            scales: {
              y: { 
                beginAtZero: false, 
                grid: { color: '#f1f5f9' },
                ticks: { 
                  font: { size: 10, weight: 'bold' },
                  color: '#64748b'
                }
              },
              x: { 
                grid: { display: false },
                ticks: { 
                  font: { size: 9, weight: 'bold' },
                  color: '#64748b',
                  maxRotation: 45,
                  minRotation: 45
                }
              }
            }
          }
        });
      } catch (error) {
        console.error("Error al generar el gráfico:", error);
      }
    }
  };

  useEffect(() => {
    generateChart();
  }, [selectedParams, equipmentRounds]);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">Tablero de Tendencias</h2>
          <div className="flex gap-4 mt-2">
            <button 
              onClick={() => setViewMode('simple')}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${viewMode === 'simple' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-400'}`}
            >
              Simple
            </button>
            <button 
              onClick={() => { setViewMode('multi'); setSelectedParams([]); }}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${viewMode === 'multi' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-400'}`}
            >
              Comparativa
            </button>
            <button 
              onClick={() => { setViewMode('presets'); setSelectedParams([]); setActivePreset(null); }}
              className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${viewMode === 'presets' ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-400'}`}
            >
              Ingeniería
            </button>
          </div>
        </div>
        <button onClick={onBack} className="bg-slate-100 text-slate-500 hover:bg-slate-200 px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all">← Cerrar</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Sistema</label>
            <select 
              value={selectedEquipment} 
              onChange={(e) => setSelectedEquipment(e.target.value as EquipmentType)}
              className="w-full border-2 border-slate-100 rounded-xl px-4 py-2 font-bold text-sm"
            >
              {allowedEquip.map(type => (
                <option key={type} value={type}>{EQUIPMENT_LABELS[type]}</option>
              ))}
            </select>
          </div>

          {viewMode === 'simple' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Parámetro</label>
              <select 
                value={selectedParams[0] || ''} 
                onChange={(e) => setSelectedParams([e.target.value])}
                className="w-full border-2 border-slate-100 rounded-xl px-4 py-2 font-bold text-sm bg-slate-50"
              >
                {availableParams.length > 0 ? (
                  availableParams.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ').toUpperCase()}</option>)
                ) : (
                  <option value="">Sin datos numéricos</option>
                )}
              </select>
            </div>
          )}

          {viewMode === 'multi' && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Selección Múltiple ({selectedParams.length})</label>
              <div className="border-2 border-slate-100 rounded-xl p-3 bg-slate-50 max-h-[300px] overflow-y-auto space-y-2">
                {availableParams.map(p => (
                  <label key={p} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedParams.includes(p)}
                      onChange={() => toggleParam(p)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-900"
                    />
                    <span className={`text-xs font-bold uppercase transition-colors ${selectedParams.includes(p) ? 'text-blue-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                      {p.replace(/_/g, ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'presets' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Diagnósticos Predefinidos</label>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(PRESETS_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key)}
                    className={`flex flex-col items-start p-3 rounded-xl border-2 transition-all ${activePreset === key ? 'border-blue-900 bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{config.icon}</span>
                      <span className="text-[11px] font-black uppercase text-blue-900 tracking-tight">{config.title}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-medium text-left leading-tight">{config.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}


          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Base de Datos</h4>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600">Registros Totales:</span>
              <span className="text-base font-black text-blue-900">{equipmentRounds.length}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 h-[450px]">
            {equipmentRounds.length > 0 ? (
              <canvas ref={chartRef}></canvas>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic font-medium">
                No hay registros suficientes para este equipo.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};