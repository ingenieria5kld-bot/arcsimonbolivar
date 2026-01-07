
import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onCancel: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Resize logic with Persistence (Prevents clearing on rotation)
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent) {
      // 1. Save current drawing
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (canvas.width > 0 && canvas.height > 0) {
        tempCanvas.width = canvas.width; 
        tempCanvas.height = canvas.height;
        tempCtx?.drawImage(canvas, 0, 0);
      }

      // 2. Resize to fit new parent dimensions
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      
      // 3. Restore Context Styles (Lost on resize)
      ctx.strokeStyle = '#003366';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      // 4. Restore Drawing
      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
          ctx.drawImage(tempCanvas, 0, 0);
      }
    }
  };

  useEffect(() => {
    // Initial resize
    const timer = setTimeout(resizeCanvas, 50);
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearTimeout(timer);
    };
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
    // Prevent default to stop scrolling interaction
    if (e.cancelable) e.preventDefault();
    
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
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
    <div className="fixed inset-0 z-[110] bg-slate-900/95 flex items-center justify-center backdrop-blur-sm sm:p-4">
      {/* 
         Responsive Container with SAFE AREA support for Notch
      */}
      <div 
        className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300"
        style={{ paddingTop: 'env(safe-area-inset-top)' }} 
      >
        
        {/* Header */}
        <div className="p-4 md:p-6 bg-slate-50 border-b flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg md:text-xl font-black text-blue-900 uppercase leading-none">Certificación</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Firma del Suboficial de Guardia</p>
          </div>
          <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:text-slate-800 text-2xl active:scale-95 transition-all">&times;</button>
        </div>
        
        {/* Canvas Sandbox - Flexible Height */}
        <div className="flex-1 bg-white relative group cursor-crosshair m-4 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden touch-none">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
            className="w-full h-full block"
          />
          <div className="absolute bottom-4 right-4 pointer-events-none opacity-20 text-blue-900 font-black text-2xl md:text-4xl uppercase select-none">
            ARC SIMBOL
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 bg-slate-50 border-t flex flex-col sm:flex-row gap-3 shrink-0">
          <button 
            onClick={clear}
            className="w-full sm:w-auto px-6 py-4 rounded-xl font-black text-slate-500 uppercase text-xs hover:bg-slate-200 transition-colors border-2 border-slate-200 sm:border-transparent"
          >
            Limpiar
          </button>
          <div className="flex-1 flex gap-3">
            <button 
              onClick={onCancel}
              className="hidden sm:block flex-1 px-4 py-4 rounded-xl font-black text-slate-400 uppercase text-xs hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button 
              onClick={save}
              className="flex-1 bg-blue-900 text-white px-8 py-4 rounded-xl font-black uppercase text-xs shadow-lg hover:shadow-blue-900/20 active:scale-95 transition-all"
            >
              Confirmar Firma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
