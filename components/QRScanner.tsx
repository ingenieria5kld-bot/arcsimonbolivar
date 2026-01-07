import React, { useEffect, useState } from 'react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string>('');

  const startScan = async () => {
    try {
      // 1. Check permissions
      const status = await BarcodeScanner.checkPermissions();

      let granted = status.camera === 'granted';

      // 2. Request if not granted
      if (!granted) {
        const response = await BarcodeScanner.requestPermissions();
        granted = response.camera === 'granted';
      }

      if (!granted) {
        setError('Permiso de cámara denegado. Por favor, habilítelo en la configuración.');
        return;
      }

      // 3. Install module (optional but recommended for Google Barcode Scanner)
      try {
        await BarcodeScanner.installGoogleBarcodeScannerModule();
      } catch (installErr: any) {
        // This is expected if the module is already downloaded. Silent ignore.
        // We log it as info for debugging but it is NOT a critical error.
        const msg = installErr?.message || JSON.stringify(installErr);
        if (!msg.includes('already installed')) {
             console.warn("[QRScanner] Module install warning (non-fatal):", installErr);
        }
      }

      // 4. Start Scan (Google Code Scanner UI)
      // NOTE: This will pause the App (Activity) as it opens a Google Play Services overlay.
      // "App paused" / "App stopped" logs are NORMAL.
      const result = await BarcodeScanner.scan({
        formats: [], // All formats
      });

      if (result.barcodes.length > 0) {
        onScan(result.barcodes[0].rawValue);
      } else {
        // User cancelled or no code found
        onClose();
      }

    } catch (err: any) {
      // Handle known harmless errors
      const msg = err?.message || '';
      if (msg.includes('canceled') || msg.includes('cancelled')) {
        onClose();
        return;
      }
      
      console.error("[QRScanner] Fatal Error:", err);
      setError('Error al iniciar: ' + (msg || 'Error desconocido'));
    }
  };

  useEffect(() => {
    // Launch scan immediately on mount
    startScan();
    // Cleanup not strictly needed for this method as it's a promise-based activity
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 flex flex-col items-center justify-center p-4 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-black text-navy uppercase text-sm tracking-tight">Escáner de Equipos</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Identificación por Código QR</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors text-2xl">&times;</button>
        </div>

        <div className="p-8 text-center min-h-[300px] flex flex-col items-center justify-center">
          {error ? (
            <div className="text-red-500 font-bold mb-4 px-4 py-3 bg-red-50 rounded-xl">
              {error}
            </div>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mb-6 animate-pulse">
                📷
              </div>
              <p className="text-slate-600 font-bold uppercase text-xs tracking-widest mb-2">Abriendo cámara nativa...</p>
              <p className="text-slate-400 text-[10px] mb-6 max-w-[200px] mx-auto">Si no abre automáticamente, usa el botón de abajo.</p>
            </>
          )}

          <button
            onClick={startScan}
            className="bg-navy text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-blue-900 transition-all active:scale-95"
          >
            {error ? 'Reintentar' : 'Activar Cámara'}
          </button>
        </div>

        <div className="bg-slate-100 p-4 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Powered by Google MLKit</p>
        </div>
      </div>
      <button onClick={onClose} className="mt-8 text-white/50 font-black uppercase text-xs tracking-[0.2em] hover:text-white transition-colors">Cancelar</button>
    </div>
  );
};
