
import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onCancel: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#003366';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Ajustar tamaño del canvas al contenedor
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = 300;
        // Reiniciar estilos tras resize
        ctx.strokeStyle = '#003366';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-blue-900 uppercase">Certificación de Ronda</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Firma táctil del Suboficial de Guardia</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-3xl">&times;</button>
        </div>
        
        <div className="flex-1 bg-white relative group cursor-crosshair m-6 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
            className="w-full h-[300px] touch-none"
          />
          <div className="absolute bottom-4 right-4 pointer-events-none opacity-20 text-blue-900 font-black text-4xl uppercase select-none">
            ARC SIMBOL
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t flex gap-4">
          <button 
            onClick={clear}
            className="px-6 py-4 rounded-xl font-black text-slate-500 uppercase text-xs hover:bg-slate-200 transition-colors"
          >
            Limpiar
          </button>
          <div className="flex-1 flex gap-3">
            <button 
              onClick={onCancel}
              className="flex-1 px-4 py-4 rounded-xl font-black text-slate-400 uppercase text-xs"
            >
              Cancelar
            </button>
            <button 
              onClick={save}
              className="flex-1 bg-blue-900 text-white px-8 py-4 rounded-xl font-black uppercase text-xs shadow-lg hover:shadow-blue-900/20 transition-all"
            >
              Confirmar y Firmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
