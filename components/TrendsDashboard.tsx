
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
      const params = Object.keys(sample).filter(key => 
        typeof sample[key] === 'number' || 
        (!isNaN(parseFloat(sample[key])) && !['UNIQUE_KEY', 'TIMESTAMP_GUARDADO'].includes(key))
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

    const sortedData = [...equipmentRounds].sort((a, b) => 
      new Date(a.TIMESTAMP_GUARDADO).getTime() - new Date(b.TIMESTAMP_GUARDADO).getTime()
    );

    const labels = sortedData.map(d => `${d.fecha} ${d.ronda_de_inspeccion}`);
    
    // Group by UNIDAD_ACTIVA for multi-line comparison
    const units = Array.from(new Set(sortedData.map(d => d.UNIDAD_ACTIVA)));
    
    const datasets = units.map((unit, index) => {
      const colors = ['#003366', '#0066cc', '#3399ff', '#99ccff', '#cc0000'];
      return {
        label: unit,
        data: sortedData.map(d => d.UNIDAD_ACTIVA === unit ? parseFloat(d[selectedParam]) : null),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        borderWidth: 3,
        tension: 0.3,
        spanGaps: true,
        fill: false,
      };
    });

    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new (window as any).Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top' as const, labels: { font: { weight: 'bold' } } },
            title: { display: true, text: `Evolución de ${selectedParam}` }
          },
          scales: {
            y: { beginAtZero: false, grid: { color: '#e2e8f0' } },
            x: { grid: { display: false } }
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
      valor: r[selectedParam]
    })).slice(-10); // Últimos 10 registros para no saturar

    const analysis = await analyzeTrends(selectedEquipment, historySummary);
    setAiInsight(analysis);
    setLoadingAi(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-blue-900 uppercase tracking-tighter">Tablero de Tendencias</h2>
          <p className="text-slate-500 font-medium">Análisis de comportamiento y predicción IA</p>
        </div>
        <button onClick={onBack} className="text-slate-400 hover:text-slate-700 font-bold uppercase text-xs">← Volver</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Equipo</label>
            <select 
              value={selectedEquipment} 
              onChange={(e) => setSelectedEquipment(e.target.value as EquipmentType)}
              className="w-full border-2 border-slate-100 rounded-xl px-4 py-2 font-bold"
            >
              {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Parámetro a Comparar</label>
            <select 
              value={selectedParam} 
              onChange={(e) => setSelectedParam(e.target.value)}
              className="w-full border-2 border-slate-100 rounded-xl px-4 py-2 font-bold"
            >
              {availableParams.length > 0 ? (
                availableParams.map(p => <option key={p} value={p}>{p}</option>)
              ) : (
                <option value="">Sin datos numéricos</option>
              )}
            </select>
          </div>

          <div className="pt-4">
            <button 
              onClick={fetchTrendAnalysis}
              disabled={loadingAi || equipmentRounds.length === 0}
              className="w-full bg-blue-900 text-white py-4 rounded-xl font-black shadow-lg disabled:opacity-50 hover:bg-blue-800 transition-all flex items-center justify-center gap-2"
            >
              {loadingAi ? 'Procesando...' : 'Generar Análisis IA'}
              {!loadingAi && <span className="text-xl">✨</span>}
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="text-xs font-black text-slate-400 uppercase mb-2">Resumen de Datos</h4>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Registros:</span>
              <span className="text-lg font-black text-blue-900">{equipmentRounds.length}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 h-[400px]">
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
                   <span className="text-[10px] font-black text-slate-400 uppercase">Nivel Crítico</span>
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
                  <h4 className="text-xs font-black text-blue-400 uppercase mb-3 tracking-widest">Puntos Clave</h4>
                  <ul className="space-y-2">
                    {aiInsight.insights.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-bold text-slate-600">
                        <span className="text-blue-500 mt-1">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-900 rounded-2xl p-5 text-white">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase mb-2 tracking-widest">Predicción de Falla</h4>
                  <p className="text-sm font-medium opacity-90">{aiInsight.prediction}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
