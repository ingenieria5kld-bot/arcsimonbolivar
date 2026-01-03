import React, { useState, useEffect, useRef } from 'react';
import { RoundData, EquipmentType } from '../types';
import { EQUIPMENT_LABELS } from '../constants';
import { analyzeTrends } from '../services/geminiService';

interface TrendsDashboardProps {
  rounds: RoundData[];
  onBack: () => void;
}

export const TrendsDashboard: React.FC<TrendsDashboardProps> = ({ rounds, onBack }) => {
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType>(EquipmentType.GENERADORES);
  const [availableParams, setAvailableParams] = useState<string[]>([]);
  const [selectedParam, setSelectedParam] = useState<string>('');
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

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
      if (params.length > 0 && !params.includes(selectedParam)) {
        setSelectedParam(params[0]);
      }
    } else {
      setAvailableParams([]);
    }
  }, [selectedEquipment, equipmentRounds]);

  const generateChart = () => {
    if (!chartRef.current || equipmentRounds.length === 0 || !selectedParam) return;

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
    
    // 3. Crear datasets mapeando cada unidad a los puntos de tiempo únicos
    const datasets = units.map((unit, index) => {
      const colors = [
        '#003366', // Navy
        '#cc0000', // Red
        '#008000', // Green
        '#ff8c00', // Orange
        '#800080'  // Purple
      ];

      const data = timePoints.map(timeLabel => {
        const match = equipmentRounds.find(r => 
          r.UNIDAD_ACTIVA === unit && 
          `${r.fecha} ${r.ronda_de_inspeccion}` === timeLabel
        );
        // Cast to any for dynamic parameter access
        return match ? parseFloat((match as any)[selectedParam]) : null;
      });

      return {
        label: unit,
        data: data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        spanGaps: true, // Une los puntos aunque falten datos intermedios
        fill: false,
      };
    });

    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new (window as any).Chart(ctx, {
        type: 'line',
        data: { 
          // Use explicit typing to ensure string methods like split are available
          labels: timePoints.map((tp: string) => tp.split(' ')[1]), // Mostrar solo la hora en el eje X para limpieza
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
              text: `Tendencia: ${selectedParam.toUpperCase()}`,
              font: { size: 14, weight: 'bold' }
            }
          },
          scales: {
            y: { 
              beginAtZero: false, 
              grid: { color: '#f1f5f9' },
              ticks: { font: { size: 10 } }
            },
            x: { 
              grid: { display: false },
              ticks: { 
                font: { size: 9 },
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      });
    }
  };

  useEffect(() => {
    generateChart();
  }, [selectedParam, equipmentRounds]);

  const fetchTrendAnalysis = async () => {
    setLoadingAi(true);
    const historySummary = equipmentRounds.map(r => ({
      fecha: r.fecha,
      ronda: r.ronda_de_inspeccion,
      unidad: r.UNIDAD_ACTIVA,
      param: selectedParam,
      valor: (r as any)[selectedParam]
    })).slice(-15);

    const analysis = await analyzeTrends(selectedEquipment, historySummary);
    setAiInsight(analysis);
    setLoadingAi(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">Tablero de Tendencias</h2>
          <p className="text-slate-500 font-medium">Análisis comparativo de unidades e IA Predictiva</p>
        </div>
        <button onClick={onBack} className="text-slate-400 hover:text-slate-700 font-bold uppercase text-xs">← Volver</button>
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
              {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Parámetro Técnico</label>
            <select 
              value={selectedParam} 
              onChange={(e) => setSelectedParam(e.target.value)}
              className="w-full border-2 border-slate-100 rounded-xl px-4 py-2 font-bold text-sm"
            >
              {availableParams.length > 0 ? (
                availableParams.map(p => <option key={p} value={p}>{p.replace(/_/g, ' ').toUpperCase()}</option>)
              ) : (
                <option value="">Sin parámetros numéricos</option>
              )}
            </select>
          </div>

          <div className="pt-4">
            <button 
              onClick={fetchTrendAnalysis}
              disabled={loadingAi || equipmentRounds.length === 0}
              className="w-full bg-blue-900 text-white py-4 rounded-xl font-black shadow-lg disabled:opacity-50 hover:bg-blue-800 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
            >
              {loadingAi ? 'Procesando...' : 'Analizar con IA'}
              {!loadingAi && <span className="text-xl">✨</span>}
            </button>
          </div>

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

          {aiInsight && (
            <div className="bg-white rounded-2xl border-2 border-blue-100 p-6 shadow-sm animate-in slide-in-from-right-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-black text-blue-900 flex items-center gap-2">
                   <span className="bg-blue-100 p-2 rounded-lg text-lg">🤖</span>
                   {aiInsight.title}
                </h3>
                <div className="flex flex-col items-end">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Estado de Alerta</span>
                   <div className="flex gap-1 mt-1">
                     {[...Array(10)].map((_, i) => (
                       <div key={i} className={`w-3 h-1.5 rounded-full ${i < aiInsight.criticalLevel ? (aiInsight.criticalLevel > 7 ? 'bg-red-500' : 'bg-blue-500') : 'bg-slate-200'}`}></div>
                     ))}
                   </div>
                </div>
              </div>
              
              <p className="text-slate-700 font-medium mb-6 leading-relaxed bg-blue-50 p-4 rounded-xl border border-blue-100 italic">
                "{aiInsight.summary}"
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-black text-blue-400 uppercase mb-3 tracking-widest">Hallazgos Clave</h4>
                  <ul className="space-y-2">
                    {aiInsight.insights.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-bold text-slate-600">
                        <span className="text-blue-500 mt-1">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase mb-2 tracking-widest">Diagnóstico de Ingeniería</h4>
                  <p className="text-sm font-medium opacity-90 leading-relaxed">{aiInsight.prediction}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};