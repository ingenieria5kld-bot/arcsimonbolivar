
import React, { useEffect, useRef } from 'react';

declare const Html5QrcodeScanner: any;

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    // Pequeño retardo para asegurar que el DOM está listo
    const timer = setTimeout(() => {
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 15, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true
          },
          /* verbose= */ false
        );

        const onScanSuccess = (decodedText: string) => {
          if (scannerRef.current) {
            scannerRef.current.clear().then(() => {
              onScan(decodedText);
            }).catch((err: any) => {
              console.error(err);
              onScan(decodedText);
            });
          }
        };

        scannerRef.current.render(onScanSuccess, () => {});
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err: any) => console.error(err));
      }
    };
  }, [onScan]);

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
        <div className="bg-slate-100 p-2">
          <div id="qr-reader" className="w-full overflow-hidden rounded-2xl"></div>
        </div>
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
            <span className="animate-pulse">●</span> Sensor Activo
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
            Apunta la cámara al código QR pegado en la unidad para cargar los parámetros técnicos.
          </p>
        </div>
      </div>
      <button onClick={onClose} className="mt-8 text-white/50 font-black uppercase text-xs tracking-[0.2em] hover:text-white transition-colors">Cerrar Escáner</button>
    </div>
  );
};
