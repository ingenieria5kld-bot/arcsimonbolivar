import React, { useState, useEffect } from 'react';
import { getSyncMode, setSyncMode, getServerIP, setServerIP, SyncMode } from '../services/driveService';

interface SettingsPageProps {
  onBackendChange: () => void; // Callback to notify parent (optional)
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBackendChange }) => {
  const [mode, setMode] = useState<SyncMode>('CLOUD');
  const [ip, setIp] = useState('');
  const [detectedIp, setDetectedIp] = useState('');

  useEffect(() => {
    setMode(getSyncMode());
    setIp(getServerIP());

    // Electron Auto-Detect
    if (window.require) {
        try {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.invoke('get-server-ip').then((serverIp: string) => {
                setDetectedIp(serverIp);
                if (!getServerIP() && serverIp && serverIp !== 'Buscando...') {
                    setIp(serverIp); // Auto-fill if empty
                }
            });
        } catch (e) {
            console.warn("Electron IPC not available");
        }
    }
  }, []);

  const handleModeChange = (newMode: SyncMode) => {
    setMode(newMode);
    setSyncMode(newMode);
    onBackendChange();
  };

  const handleIpSave = () => {
    setServerIP(ip);
    alert('IP Guardada correctamente');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-navy uppercase tracking-tight mb-6 flex items-center gap-2">
          ⚙️ Configuración de Sincronización
        </h2>

        <div className="space-y-6">
          {/* SELECCION DE MODO */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Modo de Operación
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleModeChange('CLOUD')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  mode === 'CLOUD'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                }`}
              >
                <span className="text-3xl mb-2">☁️</span>
                <span className="text-sm">Internet (Nube)</span>
                <span className="text-[10px] opacity-70 mt-1">Sincroniza con Google Drive</span>
              </button>
              
              <button
                onClick={() => handleModeChange('LOCAL')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  mode === 'LOCAL'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                }`}
              >
                <span className="text-3xl mb-2">🚢</span>
                <span className="text-sm">Intranet (Local)</span>
                <span className="text-[10px] opacity-70 mt-1">Sincroniza con PC del Buque</span>
              </button>
            </div>
          </div>

          {/* CONFIGURACION IP LOCAL */}
          {mode === 'LOCAL' && (
            <div className="animate-in slide-in-from-top-4 duration-300">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                Dirección IP del Servidor PC
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="Ej: 192.168.1.10"
                  className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 font-mono text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                />
                <button 
                  onClick={handleIpSave}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-xl font-bold text-sm uppercase tracking-wide transition-colors"
                >
                  Guardar
                </button>
              </div>
              
              {detectedIp && (
                <div className="mt-3 bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center gap-2 animate-pulse">
                    <span className="text-xl">📡</span>
                    <div>
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">IP Detectada Automáticamente:</p>
                        <p className="text-lg font-black text-emerald-800 tracking-tight">{detectedIp}:3000</p>
                    </div>
                    <button 
                        onClick={() => { setIp(detectedIp); }}
                        className="ml-auto text-xs bg-white border border-emerald-200 text-emerald-600 px-3 py-1 rounded-md font-bold uppercase shadow-sm hover:bg-emerald-100"
                    >
                        Usar
                    </button>
                </div>
              )}

              <p className="text-[10px] text-slate-400 mt-2 ml-1">
                * Encuentra la IP en el PC ejecutando <code>ipconfig</code> en la terminal. El puerto es <strong>3000</strong>.
              </p>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-500 leading-relaxed">
            <p className="font-bold mb-1">ℹ️ Nota Importante:</p>
            <p>
              En <strong>Modo Local</strong>, asegúrese de que el dispositivo esté conectado a la misma red Wi-Fi que el PC Servidor.
              La sincronización no funcionará si no hay conexión de red local.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
