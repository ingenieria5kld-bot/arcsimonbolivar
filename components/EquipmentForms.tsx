
import React from 'react';
import { EquipmentType, RoundData } from '../types';

interface FormProps {
  data: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  showHorometro?: boolean;
  showTrim?: boolean;
  previousRound?: RoundData | null;
  previousTime?: string;
}

const Field: React.FC<{ 
  label: string; 
  name: string; 
  type?: string; 
  step?: string; 
  min?: string; 
  max?: string; 
  minOpt?: number;
  maxOpt?: number;
  value: any; 
  onChange: any; 
  required?: boolean;
  previousValue?: any;
  previousTime?: string;
  placeholder?: string;
  disabled?: boolean;
}> = ({ label, name, type = "number", step = "0.01", min, max, minOpt, maxOpt, value, onChange, required, previousValue, previousTime, placeholder, disabled }) => {
  
  const numValue = parseFloat(value);
  const numPrev = parseFloat(previousValue);

  const getStatusClasses = () => {
    if (disabled) return "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed";
    if (isNaN(numValue) || type !== "number") return "border-slate-200 focus:border-blue-500";
    
    const minCrit = min ? parseFloat(min) : -Infinity;
    const maxCrit = max ? parseFloat(max) : Infinity;

    if (numValue < minCrit || numValue > maxCrit) {
      return "bg-rose-50 border-rose-500 text-rose-900 focus:ring-rose-200";
    }

    if (minOpt !== undefined && maxOpt !== undefined && numValue >= minOpt && numValue <= maxOpt) {
      return "bg-emerald-50 border-emerald-500 text-emerald-900 focus:ring-emerald-200";
    }

    return "border-slate-200 bg-white focus:border-blue-500";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (type === "number" && !isNaN(numValue) && !isNaN(numPrev) && numPrev !== 0) {
      const diff = Math.abs((numValue - numPrev) / numPrev);
      if (diff > 0.30) {
        window.confirm(`Este valor (${numValue}) difiere significativamente (>30%) de la lectura anterior (${numPrev}). ¿Es correcto?`);
      }
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{label}{required && '*'}</label>
        {!isNaN(numPrev) && (
          <span className="text-[9px] text-slate-400 font-medium">
            Ant: <span className="text-blue-600 font-bold">{numPrev}</span> {previousTime && <span className="opacity-60">({previousTime} HS)</span>}
          </span>
        )}
      </div>
      <input 
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        value={value || ''}
        onChange={onChange}
        onBlur={handleBlur}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={`border rounded-lg px-3 py-1.5 text-sm outline-none transition-all ${getStatusClasses()}`}
      />
    </div>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="col-span-full border-b border-slate-100 pb-1 mt-4 mb-2">
    <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest">{title}</h4>
  </div>
);

const ObservationsField: React.FC<{ value: string; onChange: any }> = ({ value, onChange }) => (
  <div className="flex flex-col gap-1 mt-6">
    <label className="text-sm font-semibold text-slate-700">Observaciones Técnicas</label>
    <textarea 
      name="observaciones"
      value={value || ''}
      onChange={onChange}
      className="border rounded-xl px-4 py-3 h-24 focus:ring-2 focus:ring-blue-500 outline-none transition-all border-slate-200 text-sm"
      placeholder="Reporte novedades, ruidos extraños o fugas detectadas..."
    />
  </div>
);

const SpecialFieldsInput: React.FC<FormProps> = ({ data, onChange, previousRound, previousTime, showHorometro, showTrim }) => (
  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 shadow-inner space-y-4">
    {showHorometro && (
      <Field 
        label="Horas de Operación (Horómetro)" 
        name="horometro" 
        type="number" 
        step="0.1" 
        value={data.horometro} 
        onChange={onChange} 
        previousValue={previousRound?.horometro}
        previousTime={previousTime}
        required 
      />
    )}
    {showTrim && (
      <Field 
        label="TRIM (L)" 
        name="trim" 
        type="number" 
        step="1" 
        value={data.trim} 
        onChange={onChange} 
        previousValue={previousRound?.trim}
        previousTime={previousTime}
        required 
        placeholder="Nivel de Tanque para cálculo de consumo"
      />
    )}
  </div>
);

export const GeneradoresForm: React.FC<FormProps> = ({ data, onChange, showHorometro, showTrim, previousRound, previousTime }) => (
  <div className="space-y-4">
    {(showHorometro || showTrim) && <SpecialFieldsInput data={data} onChange={onChange} previousRound={previousRound} previousTime={previousTime} showHorometro={showHorometro} showTrim={showTrim} />}
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Unidad de Generación*</label>
        <select name="UNIDAD_ACTIVA" value={data.UNIDAD_ACTIVA || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="Generador 1 (Babor)">Generador 1 (Babor)</option>
          <option value="Generador 2 (Centro)">Generador 2 (Centro)</option>
          <option value="Generador 3 (Estribor)">Generador 3 (Estribor)</option>
        </select>
      </div>
      <Field label="Frecuencia (Hz)" name="frecuencia" min="55" max="65" value={data.frecuencia} previousValue={previousRound?.frecuencia} previousTime={previousTime} onChange={onChange} required />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <Field label="Potencia (kW)" name="potencia" step="0.01" value={data.potencia} previousValue={previousRound?.potencia} previousTime={previousTime} onChange={onChange} />
      <Field label="Carga (%)" name="carga" min="0" max="100" step="0.01" value={data.carga} previousValue={previousRound?.carga} previousTime={previousTime} onChange={onChange} required />
    </div>

    <SectionHeader title="Voltajes y Amperajes" />
    <div className="grid grid-cols-3 gap-3">
      <Field label="V Línea A" name="vol_mg_linea_a" min="150" max="300" value={data.vol_mg_linea_a} previousValue={previousRound?.vol_mg_linea_a} previousTime={previousTime} onChange={onChange} required />
      <Field label="V Línea B" name="vol_mg_linea_b" min="150" max="300" value={data.vol_mg_linea_b} previousValue={previousRound?.vol_mg_linea_b} previousTime={previousTime} onChange={onChange} required />
      <Field label="V Línea C" name="vol_mg_linea_c" min="150" max="300" value={data.vol_mg_linea_c} previousValue={previousRound?.vol_mg_linea_c} previousTime={previousTime} onChange={onChange} required />
      <Field label="A Línea A" name="amp_mg_linea_a" min="50" max="500" value={data.amp_mg_linea_a} previousValue={previousRound?.amp_mg_linea_a} previousTime={previousTime} onChange={onChange} required />
      <Field label="A Línea B" name="amp_mg_linea_b" min="50" max="500" value={data.amp_mg_linea_b} previousValue={previousRound?.amp_mg_linea_b} previousTime={previousTime} onChange={onChange} required />
      <Field label="A Línea C" name="amp_mg_linea_c" min="50" max="500" value={data.amp_mg_linea_c} previousValue={previousRound?.amp_mg_linea_c} previousTime={previousTime} onChange={onChange} required />
    </div>

    <SectionHeader title="Temperaturas y Presiones" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Field label="RPM" name="rpm" min="0" max="2400" step="1" value={data.rpm} previousValue={previousRound?.rpm} previousTime={previousTime} onChange={onChange} required />
      <Field label="Consumo (L/h)" name="consumo" min="0" max="180" value={data.consumo} previousValue={previousRound?.consumo} previousTime={previousTime} onChange={onChange} required />
      <Field label="Exhosto (°C)" name="temp_mg_exhosto" min="0" max="800" step="0.1" value={data.temp_mg_exhosto} previousValue={previousRound?.temp_mg_exhosto} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Refrig. (°C)" name="temp_mg_refrigerante" min="0" max="120" value={data.temp_mg_refrigerante} previousValue={previousRound?.temp_mg_refrigerante} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Lubric. (kPa)" name="pres_mg_lubricante" min="0" max="900" value={data.pres_mg_lubricante} previousValue={previousRound?.pres_mg_lubricante} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Refrig. (kPa)" name="pres_mg_refrigerante" min="0" max="250" value={data.pres_mg_refrigerante} previousValue={previousRound?.pres_mg_refrigerante} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Lubric. (°C)" name="temp_mg_lubricante" min="0" max="120" value={data.temp_mg_lubricante} previousValue={previousRound?.temp_mg_lubricante} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Combust. (°C)" name="temp_mg_combustibe" min="0" max="120" value={data.temp_mg_combustibe} previousValue={previousRound?.temp_mg_combustibe} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Combust. (kPa)" name="pres_mg_combustible" min="0" max="1000" value={data.pres_mg_combustible} previousValue={previousRound?.pres_mg_combustible} previousTime={previousTime} onChange={onChange} required />
      <Field label="V Batería (V)" name="vol_mg_bateria" min="0" max="30" value={data.vol_mg_bateria} previousValue={previousRound?.vol_mg_bateria} previousTime={previousTime} onChange={onChange} required />
    </div>

    <SectionHeader title="Agua de Mar" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Field label="T. Ent. Mar (°C)" name="temp_mg_entrada" min="-5" max="100" value={data.temp_mg_entrada} previousValue={previousRound?.temp_mg_entrada} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Ent. Mar" name="pres_mg_entrada_ag" min="-3" max="2" value={data.pres_mg_entrada_ag} previousValue={previousRound?.pres_mg_entrada_ag} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Sal. Mar (°C)" name="temp_mg_salida" min="0" max="100" value={data.temp_mg_salida} previousValue={previousRound?.temp_mg_salida} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Sal. Mar" name="pres_mg_salida_ag_1" min="0" max="20" value={data.pres_mg_salida_ag_1} previousValue={previousRound?.pres_mg_salida_ag_1} previousTime={previousTime} onChange={onChange} required />
    </div>

    <ObservationsField value={data.observaciones} onChange={onChange} />
  </div>
);

export const PropulsoresForm: React.FC<FormProps> = ({ data, onChange, showHorometro, showTrim, previousRound, previousTime }) => (
  <div className="space-y-4">
    {(showHorometro || showTrim) && <SpecialFieldsInput data={data} onChange={onChange} previousRound={previousRound} previousTime={previousTime} showHorometro={showHorometro} showTrim={showTrim} />}
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Motor Propulsor*</label>
        <select name="UNIDAD_ACTIVA" value={data.UNIDAD_ACTIVA || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="Propulsor 1 (Babor)">Propulsor 1 (Babor)</option>
          <option value="Propulsor 2 (Estribor)">Propulsor 2 (Estribor)</option>
        </select>
      </div>
      <Field label="RPM (0-2500)" name="rpm_p" min="0" max="2500" step="1" value={data.rpm_p} previousValue={previousRound?.rpm_p} previousTime={previousTime} onChange={onChange} required />
    </div>

    <SectionHeader title="Parámetros Motor Propulsor" />
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <Field label="Consumo (L/h)" name="consumo_p" min="0" max="1000" value={data.consumo_p} previousValue={previousRound?.consumo_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Agua Camisas (kPa)" name="pres_agua_camisas_p" min="0" max="300" value={data.pres_agua_camisas_p} previousValue={previousRound?.pres_agua_camisas_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Refrig. LT (°C)" name="temp_refrigerante_lt_p" min="0" max="120" value={data.temp_refrigerante_lt_p} previousValue={previousRound?.temp_refrigerante_lt_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Combustible (kPa)" name="pres_entrada_motor_p" min="0" max="1000" value={data.pres_entrada_motor_p} previousValue={previousRound?.pres_entrada_motor_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Dif. Filtro (kPa)" name="pres_dif_filtro_p" min="0" max="200" value={data.pres_dif_filtro_p} previousValue={previousRound?.pres_dif_filtro_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Aceite (kPa)" name="pres_aceite_p" min="0" max="900" value={data.pres_aceite_p} previousValue={previousRound?.pres_aceite_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Aceite (°C)" name="temp_aceite_p" min="0" max="120" value={data.temp_aceite_p} previousValue={previousRound?.temp_aceite_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Carter (kPa)" name="pres_carter_p" min="-2" max="2" value={data.pres_carter_p} previousValue={previousRound?.pres_carter_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Aceite Cojinete (°C)" name="temp_cojinete_p" min="0" max="120" value={data.temp_cojinete_p} previousValue={previousRound?.temp_cojinete_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="Voltaje Batería (V)" name="voltaje_bateria_p" min="0" max="30" value={data.voltaje_bateria_p} previousValue={previousRound?.voltaje_bateria_p} previousTime={previousTime} onChange={onChange} required />
    </div>

    <SectionHeader title="Lado Motor (Exhosto)" />
    <div className="grid grid-cols-2 gap-3">
      <Field label="Lado Izquierdo (°C)" name="lado_izquierdo_p" min="0" max="800" value={data.lado_izquierdo_p} previousValue={previousRound?.lado_izquierdo_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="Lado Derecho (°C)" name="lado_derecho_p" min="0" max="800" value={data.lado_derecho_p} previousValue={previousRound?.lado_derecho_p} previousTime={previousTime} onChange={onChange} required />
    </div>

    <SectionHeader title="Agua de Mar" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Field label="T. Ent. Mar (°C)" name="temp_entrada_mar_p" min="-10" max="100" value={data.temp_entrada_mar_p} previousValue={previousRound?.temp_entrada_mar_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Sal. Mar (°C)" name="temp_salida_mar_p" min="0" max="100" value={data.temp_salida_mar_p} previousValue={previousRound?.temp_salida_mar_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Entrada (psi)" name="pres_entrada_p" min="-10" max="20" value={data.pres_entrada_p} previousValue={previousRound?.pres_entrada_p} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Salida (psi)" name="pres_salida_p" min="0" max="20" value={data.pres_salida_p} previousValue={previousRound?.pres_salida_p} previousTime={previousTime} onChange={onChange} required />
    </div>

    <ObservationsField value={data.observaciones} onChange={onChange} />
  </div>
);

export const PAAForm: React.FC<FormProps> = ({ data, onChange, showHorometro, previousRound, previousTime }) => (
  <div className="space-y-4">
    {showHorometro && <SpecialFieldsInput data={data} onChange={onChange} previousRound={previousRound} previousTime={previousTime} showHorometro={showHorometro} />}
    
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Compresor*</label>
        <select name="UNIDAD_ACTIVA" value={data.UNIDAD_ACTIVA || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="Compresor #1">Compresor #1</option>
          <option value="Compresor #2">Compresor #2</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Prioridad*</label>
        <select name="paa_prioridad" value={data.paa_prioridad || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="">--</option>
          <option value="1">1</option>
          <option value="2">2</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Etapa Compresor*</label>
        <select name="paa_etapa" value={data.paa_etapa || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="">--</option>
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
        </select>
      </div>
      <Field label="Slide Valve (%)" name="paa_slide_valve" min="0" max="100" value={data.paa_slide_valve} previousValue={previousRound?.paa_slide_valve} previousTime={previousTime} onChange={onChange} required />
      <Field label="Amperaje (A)" name="paa_amperaje" min="0" max="150" value={data.paa_amperaje} previousValue={previousRound?.paa_amperaje} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Ret. Evap (°C)" name="paa_t_ret_evap" min="0" max="50" value={data.paa_t_ret_evap} previousValue={previousRound?.paa_t_ret_evap} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Succión (Bar)" name="paa_p_succion" min="1" max="5" value={data.paa_p_succion} previousValue={previousRound?.paa_p_succion} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Descarga (Bar)" name="paa_p_descarga" min="5" max="20" value={data.paa_p_descarga} previousValue={previousRound?.paa_p_descarga} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Sum. Evap (°C)" name="paa_t_sum_evap" value={data.paa_t_sum_evap} previousValue={previousRound?.paa_t_sum_evap} previousTime={previousTime} onChange={onChange} required />
    </div>

    <SectionHeader title="Condensador" />
    <div className="grid grid-cols-2 gap-3">
      <Field label="P. Ent. Cond (Bar)" name="paa_p_ent_cond" value={data.paa_p_ent_cond} previousValue={previousRound?.paa_p_ent_cond} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Sal. Cond (Bar)" name="paa_p_sal_cond" value={data.paa_p_sal_cond} previousValue={previousRound?.paa_p_sal_cond} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Ent. Cond (°C)" name="paa_t_ent_cond" value={data.paa_t_ent_cond} previousValue={previousRound?.paa_t_ent_cond} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Sal. Cond (°C)" name="paa_t_sal_cond" value={data.paa_t_sal_cond} previousValue={previousRound?.paa_t_sal_cond} previousTime={previousTime} onChange={onChange} required />
    </div>

    <SectionHeader title="Niveles y Mirillas" />
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Nivel Aceite</label>
        <select name="paa_niv_aceite_comp" value={data.paa_niv_aceite_comp || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="OK">OK</option>
          <option value="BAJO">BAJO</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Nivel Refrig.</label>
        <select name="paa_niv_ref_comp" value={data.paa_niv_ref_comp || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="OK">OK</option>
          <option value="BAJO">BAJO</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Mirilla Líquido</label>
        <select name="paa_niv_aceite_cond" value={data.paa_niv_aceite_cond || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="">--</option>
          <option value="Liquido">Líquido</option>
          <option value="Vapor - Liquido">Vapor - Líquido</option>
          <option value="Vapor">Vapor</option>
        </select>
      </div>
    </div>

    <ObservationsField value={data.observaciones} onChange={onChange} />
  </div>
);

export const FrigorificosForm: React.FC<FormProps> = ({ data, onChange, showHorometro, previousRound, previousTime }) => (
  <div className="space-y-4">
    {showHorometro && <SpecialFieldsInput data={data} onChange={onChange} previousRound={previousRound} previousTime={previousTime} showHorometro={showHorometro} />}
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Compresor Frigorífico*</label>
        <select name="UNIDAD_ACTIVA" value={data.UNIDAD_ACTIVA || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="Compresor #1">Compresor #1</option>
          <option value="Compresor #2">Compresor #2</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-3">
      <Field label="P. Succión (bar)" name="p_succion_c1" min="-5" max="10" value={data.p_succion_c1} previousValue={previousRound?.p_succion_c1} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Descarga (bar)" name="p_descarga_c1" min="8" max="23" value={data.p_descarga_c1} previousValue={previousRound?.p_descarga_c1} previousTime={previousTime} onChange={onChange} required />
      <Field label="Amperaje (A)" name="amperaje_c1" min="0" max="25" value={data.amperaje_c1} previousValue={previousRound?.amperaje_c1} previousTime={previousTime} onChange={onChange} required />
    </div>

    <SectionHeader title="Parámetros Sistema" />
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Field label="Frecuencia (Hz)" name="frecuencia_c" min="0" max="61" value={data.frecuencia_c} previousValue={previousRound?.frecuencia_c} previousTime={previousTime} onChange={onChange} required />
      <Field label="RPM Motor" name="rpm_motor_c" min="0" max="1850" value={data.rpm_motor_c} previousValue={previousRound?.rpm_motor_c} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Suc. Bomba" name="pres_succion_comun_c" min="-0.6" max="2" value={data.pres_succion_comun_c} previousValue={previousRound?.pres_succion_comun_c} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Des. Bomba" name="pres_descarga_comun_c" min="0.5" max="2" value={data.pres_descarga_comun_c} previousValue={previousRound?.pres_descarga_comun_c} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Motor (°C)" name="temp_motor_c" min="0" max="120" value={data.temp_motor_c} previousValue={previousRound?.temp_motor_c} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Ent. Cond (bar)" name="pres_entrada_cond_c" min="0" value={data.pres_entrada_cond_c} previousValue={previousRound?.pres_entrada_cond_c} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Sal. Cond (bar)" name="pres_salida_cond_c" min="0" value={data.pres_salida_cond_c} previousValue={previousRound?.pres_salida_cond_c} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Succión (°C)" name="temp_succion_c" min="-10" max="50" value={data.temp_succion_c} previousValue={previousRound?.temp_succion_c} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Descarga (°C)" name="temp_descarga_c" min="-5" max="150" value={data.temp_descarga_c} previousValue={previousRound?.temp_descarga_c} previousTime={previousTime} onChange={onChange} required />
    </div>

    <SectionHeader title="Niveles" />
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <select name="nivel_aceite_c1" value={data.nivel_aceite_c1 || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white">
        <option value="">Nivel Aceite</option>
        <option value="Normal">Normal (1/4 - 3/4)</option>
        <option value="Bajo">Bajo</option>
        <option value="Alto">Alto</option>
      </select>
      <select name="nivel_refrigerante_c1" value={data.nivel_refrigerante_c1 || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white">
        <option value="">Nivel Refrigerante</option>
        <option value="Normal">Normal</option>
        <option value="Bajo">Bajo</option>
        <option value="Alto">Alto</option>
      </select>
      <select name="nivel_aceite_cond_1" value={data.nivel_aceite_cond_1 || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white">
        <option value="">Mirilla Líquido</option>
        <option value="Liquido">Líquido</option>
        <option value="Vapor - Liquido">Vapor - Líquido</option>
        <option value="Vapor">Vapor</option>
      </select>
    </div>

    <SectionHeader title="Cuartos Fríos" />
    <div className="grid grid-cols-2 gap-3">
      <Field label="T. Planta Veg (°C)" name="temp_plantas_v" min="0.1" max="40" value={data.temp_plantas_v} previousValue={previousRound?.temp_plantas_v} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Planta Carnes (°C)" name="temp_plantas_c" min="-20" max="40" value={data.temp_plantas_c} previousValue={previousRound?.temp_plantas_c} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Local Veg (°C)" name="temp_locales_v" min="0.1" max="40" value={data.temp_locales_v} previousValue={previousRound?.temp_locales_v} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Local Carnes (°C)" name="temp_locales_c" min="-20" max="40" value={data.temp_locales_c} previousValue={previousRound?.temp_locales_c} previousTime={previousTime} onChange={onChange} required />
    </div>

    <ObservationsField value={data.observaciones} onChange={onChange} />
  </div>
);

export const PurificadorForm: React.FC<FormProps> = ({ data, onChange, showHorometro, previousRound, previousTime }) => (
  <div className="space-y-4">
    {showHorometro && <SpecialFieldsInput data={data} onChange={onChange} previousRound={previousRound} previousTime={previousTime} showHorometro={showHorometro} />}
    
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <Field label="P. Entrega (kPa)" name="presion_entrega_pur" min="0" value={data.presion_entrega_pur} previousValue={previousRound?.presion_entrega_pur} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Succión (kPa)" name="presion_succion_pur" min="-10" max="2" value={data.presion_succion_pur} previousValue={previousRound?.presion_succion_pur} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Descarga (kPa)" name="presion_descarga_pur" min="0" max="2" value={data.presion_descarga_pur} previousValue={previousRound?.presion_descarga_pur} previousTime={previousTime} onChange={onChange} required />
      <Field label="Flujo Comb. (L/h)" name="flujo_combustible_pur" min="0" value={data.flujo_combustible_pur} previousValue={previousRound?.flujo_combustible_pur} previousTime={previousTime} onChange={onChange} required />
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Nivel Aceite</label>
        <select name="nivel_aceite_pur" value={data.nivel_aceite_pur || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white">
          <option value="">--</option>
          <option value="Normal">Normal</option>
          <option value="Bajo">Bajo</option>
          <option value="Alto">Alto</option>
        </select>
      </div>
      <Field label="Amperaje (A)" name="amperaje_pur" value={data.amperaje_pur} previousValue={previousRound?.amperaje_pur} previousTime={previousTime} onChange={onChange} required />
    </div>
    <ObservationsField value={data.observaciones} onChange={onChange} />
  </div>
);

export const DeoilerForm: React.FC<FormProps> = ({ data, onChange, showHorometro, previousRound, previousTime }) => (
  <div className="space-y-4">
    {showHorometro && <SpecialFieldsInput data={data} onChange={onChange} previousRound={previousRound} previousTime={previousTime} showHorometro={showHorometro} />}
    
    <div className="grid grid-cols-2 gap-3">
      <select name="ruido_separadora_deoiler" value={data.ruido_separadora_deoiler || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white">
        <option value="">Ruido Separadora</option>
        <option value="Normal">Normal</option>
        <option value="Anormal">Anormal</option>
      </select>
      <select name="ruido_electrico_deoiler" value={data.ruido_electrico_deoiler || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white">
        <option value="">Ruido Eléctrico</option>
        <option value="Normal">Normal</option>
        <option value="Anormal">Anormal</option>
      </select>
    </div>
    
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Field label="PPM (0-15)" name="ppm_deoiler" min="0" max="15" value={data.ppm_deoiler} previousValue={previousRound?.ppm_deoiler} previousTime={previousTime} onChange={onChange} required />
      <Field label="Flujo (L/h)" name="flujo_deoiler" min="0" value={data.flujo_deoiler} previousValue={previousRound?.flujo_deoiler} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Sentina (kPa)" name="presion_sentina_deoiler" min="0" value={data.presion_sentina_deoiler} previousValue={previousRound?.presion_sentina_deoiler} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Cebado (kPa)" name="presion_cebado_deoiler" min="0" value={data.presion_cebado_deoiler} previousValue={previousRound?.presion_cebado_deoiler} previousTime={previousTime} onChange={onChange} required />
    </div>
    <ObservationsField value={data.observaciones} onChange={onChange} />
  </div>
);

export const ManejadorasForm: React.FC<FormProps> = ({ data, onChange, showHorometro, previousRound, previousTime }) => (
  <div className="space-y-4">
    {showHorometro && <SpecialFieldsInput data={data} onChange={onChange} previousRound={previousRound} previousTime={previousTime} showHorometro={showHorometro} />}
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Manejadora*</label>
        <select name="UNIDAD_ACTIVA" value={data.UNIDAD_ACTIVA || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="Manejadora #1">Manejadora #1</option>
          <option value="Manejadora #2">Manejadora #2</option>
          <option value="Manejadora #3">Manejadora #3</option>
          <option value="Manejadora #4">Manejadora #4</option>
          <option value="Cassete">Cassete</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <Field label="T. Salida (°C)" name="temp_salida_ma" min="0" max="40" value={data.temp_salida_ma} previousValue={previousRound?.temp_salida_ma} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Retorno (°C)" name="temp_retorno_ma" min="-10" max="40" value={data.temp_retorno_ma} previousValue={previousRound?.temp_retorno_ma} previousTime={previousTime} onChange={onChange} />
      <Field label="Amperaje (A)" name="amperaje_ma" min="0" max="20" value={data.amperaje_ma} previousValue={previousRound?.amperaje_ma} previousTime={previousTime} onChange={onChange} />
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Heater (On/Off)</label>
        <select name="heather_ma" value={data.heather_ma || 'off'} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="off">OFF</option>
          <option value="on">ON</option>
        </select>
      </div>
      <Field label="Frecuencia (Hz)" name="frecuencia_ma" min="0" max="75" value={data.frecuencia_ma} previousValue={previousRound?.frecuencia_ma} previousTime={previousTime} onChange={onChange} />
    </div>
    <ObservationsField value={data.observaciones} onChange={onChange} />
  </div>
);

export const BowThrusterForm: React.FC<FormProps> = ({ data, onChange, showHorometro, previousRound, previousTime }) => (
  <div className="space-y-4">
    {showHorometro && <SpecialFieldsInput data={data} onChange={onChange} previousRound={previousRound} previousTime={previousTime} showHorometro={showHorometro} />}
    
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <Field label="Vel. Motor (RPM)" name="velocidad_motor_bt" min="0" max="3600" step="1" value={data.velocidad_motor_bt} previousValue={previousRound?.velocidad_motor_bt} previousTime={previousTime} onChange={onChange} required />
      <Field label="Corriente (A)" name="corriente_motor_bt" value={data.corriente_motor_bt} previousValue={previousRound?.corriente_motor_bt} previousTime={previousTime} onChange={onChange} required />
      <Field label="Torque Motor" name="torque_motor_bt" value={data.torque_motor_bt} previousValue={previousRound?.torque_motor_bt} previousTime={previousTime} onChange={onChange} required />
      <select name="nivel_tanque_bt" value={data.nivel_tanque_bt || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white">
        <option value="">Nivel Tanque</option>
        <option value="Normal">Normal</option>
        <option value="Bajo">Bajo</option>
        <option value="Alto">Alto</option>
      </select>
      <Field label="Presión (kPa)" name="presion_bt" min="0" max="30000" value={data.presion_bt} previousValue={previousRound?.presion_bt} previousTime={previousTime} onChange={onChange} required />
      <Field label="Temp (°C)" name="temperatura_bt" min="0" max="120" value={data.temperatura_bt} previousValue={previousRound?.temperatura_bt} previousTime={previousTime} onChange={onChange} required />
    </div>

    <SectionHeader title="Bombas Hidráulicas" />
    <div className="grid grid-cols-2 gap-3">
      <select name="bomba_hidraulica_bt" value={data.bomba_hidraulica_bt || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white">
        <option value="1">Bomba #1</option>
        <option value="2">Bomba #2</option>
        <option value="ambas">Ambas</option>
      </select>
      <Field label="Horas B1" name="horas_bomba_1_bt" value={data.horas_bomba_1_bt} previousValue={previousRound?.horas_bomba_1_bt} previousTime={previousTime} onChange={onChange} required />
      <Field label="Horas B2" name="horas_bomba_2_bt" value={data.horas_bomba_2_bt} previousValue={previousRound?.horas_bomba_2_bt} previousTime={previousTime} onChange={onChange} />
    </div>
    <ObservationsField value={data.observaciones} onChange={onChange} />
  </div>
);

export const EngranajesForm: React.FC<FormProps> = ({ data, onChange, showHorometro, previousRound, previousTime }) => (
  <div className="space-y-4">
    {showHorometro && <SpecialFieldsInput data={data} onChange={onChange} previousRound={previousRound} previousTime={previousTime} showHorometro={showHorometro} />}
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Engranaje*</label>
        <select name="UNIDAD_ACTIVA" value={data.UNIDAD_ACTIVA || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="Babor">Babor</option>
          <option value="Estribor">Estribor</option>
        </select>
      </div>
      <Field label="RPM Eje" name="rpm_engranaje" min="0" max="250" step="1" value={data.rpm_engranaje} previousValue={previousRound?.rpm_engranaje} previousTime={previousTime} onChange={onChange} required />
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Field label="Paso (-100 a 100%)" name="paso_engranaje" min="-100" max="100" value={data.paso_engranaje} previousValue={previousRound?.paso_engranaje} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Aceite CPP (°C)" name="temp_aceite_cpp" min="0" max="120" value={data.temp_aceite_cpp} previousValue={previousRound?.temp_aceite_cpp} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Aceite CPP (Bar)" name="presion_aceite_cpp" min="0" max="60" value={data.presion_aceite_cpp} previousValue={previousRound?.presion_aceite_cpp} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Aceite Reductor (Bar)" name="presion_aceite_engranaje" min="0" max="30" value={data.presion_aceite_engranaje} previousValue={previousRound?.presion_aceite_engranaje} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Aceite Reductor (°C)" name="temp_aceite_engranaje" min="0" max="120" value={data.temp_aceite_engranaje} previousValue={previousRound?.temp_aceite_engranaje} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Ent. Agua (Bar)" name="presion_entrada_engranaje" min="0" max="4" value={data.presion_entrada_engranaje} previousValue={previousRound?.presion_entrada_engranaje} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Ent. Agua (°C)" name="temp_entrada_engranaje" min="0" max="120" value={data.temp_entrada_engranaje} previousValue={previousRound?.temp_entrada_engranaje} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Sal. Agua (Bar)" name="presion_salida_engranaje" min="0" value={data.presion_salida_engranaje} previousValue={previousRound?.presion_salida_engranaje} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Sal. Agua (°C)" name="temp_salida_engranaje" min="0" max="120" value={data.temp_salida_engranaje} previousValue={previousRound?.temp_salida_engranaje} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Servomotor (°C)" name="temp_servomotor_engranaje" min="0" max="120" value={data.temp_servomotor_engranaje} previousValue={previousRound?.temp_servomotor_engranaje} previousTime={previousTime} onChange={onChange} required />
      <select name="nivel_tanque_babor_eng" value={data.nivel_tanque_babor_eng || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white">
        <option value="">Nivel T. Expansión</option>
        <option value="Normal">Normal</option>
        <option value="Bajo">Bajo</option>
        <option value="Alto">Alto</option>
      </select>
    </div>
    <ObservationsField value={data.observaciones} onChange={onChange} />
  </div>
);

export const DesalinizadorasForm: React.FC<FormProps> = ({ data, onChange, showHorometro, previousRound, previousTime }) => (
  <div className="space-y-4">
    {showHorometro && <SpecialFieldsInput data={data} onChange={onChange} previousRound={previousRound} previousTime={previousTime} showHorometro={showHorometro} />}
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-600 uppercase">Planta*</label>
        <select name="UNIDAD_ACTIVA" value={data.UNIDAD_ACTIVA || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
          <option value="Proa">Proa</option>
          <option value="Popa">Popa</option>
        </select>
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Field label="P. Entrada (kPa)" name="presion_entrada_des" min="0" value={data.presion_entrada_des} previousValue={previousRound?.presion_entrada_des} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Salida (kPa)" name="presion_salida_des" min="0" value={data.presion_salida_des} previousValue={previousRound?.presion_salida_des} previousTime={previousTime} onChange={onChange} required />
      <Field label="Consumo (L/h)" name="consumo_des" min="0" value={data.consumo_des} previousValue={previousRound?.consumo_des} previousTime={previousTime} onChange={onChange} required />
      <select name="automatico_des" value={data.automatico_des || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white">
        <option value="off">Automático: OFF</option>
        <option value="on">Automático: ON</option>
      </select>
      <Field label="T. Ent. Agua (°C)" name="temp_entrada_agua_des" min="0" max="50" value={data.temp_entrada_agua_des} previousValue={previousRound?.temp_entrada_agua_des} previousTime={previousTime} onChange={onChange} required />
      <Field label="Presión (kPa)" name="presion_general_des" min="0" value={data.presion_general_des} previousValue={previousRound?.presion_general_des} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Filtro Mic." name="presion_filtro_mic_des" min="0" value={data.presion_filtro_mic_des} previousValue={previousRound?.presion_filtro_mic_des} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Membrana" name="presion_membrana_des" min="0" value={data.presion_membrana_des} previousValue={previousRound?.presion_membrana_des} previousTime={previousTime} onChange={onChange} required />
      <Field label="Producido (L/h)" name="producido_des" min="0" value={data.producido_des} previousValue={previousRound?.producido_des} previousTime={previousTime} onChange={onChange} required />
      <Field label="Conductividad (PPM)" name="conductividad_des" min="0" max="1000" value={data.conductividad_des} previousValue={previousRound?.conductividad_des} previousTime={previousTime} onChange={onChange} required />
      <Field label="Profundidad (m)" name="profundidad_des" min="0" value={data.profundidad_des} previousValue={previousRound?.profundidad_des} previousTime={previousTime} onChange={onChange} required />
      <Field label="Cloro (PPM)" name="concentracion_cloro_des" min="0" value={data.concentracion_cloro_des} previousValue={previousRound?.concentracion_cloro_des} previousTime={previousTime} onChange={onChange} required />
      <select name="posicion_valvula_3_des" value={data.posicion_valvula_3_des || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
        <option value="">Válvula 3</option>
        <option value="(⊤) -- TK Agua Potable">TK Agua Potable</option>
        <option value="(⊢) -- Al Mar">Al Mar</option>
        <option value="(⊥) -- 50/50">50/50</option>
      </select>
    </div>
    <ObservationsField value={data.observaciones} onChange={onChange} />
  </div>
);

export const AireComprimidoForm: React.FC<FormProps> = ({ data, onChange, showHorometro, previousRound, previousTime }) => (
  <div className="space-y-4">
    {showHorometro && <SpecialFieldsInput data={data} onChange={onChange} previousRound={previousRound} previousTime={previousTime} showHorometro={showHorometro} />}
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <select name="UNIDAD_ACTIVA" value={data.UNIDAD_ACTIVA || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white" required>
        <option value="Compresor #1">Compresor #1</option>
        <option value="Compresor #2">Compresor #2</option>
      </select>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <Field label="P. Digital (bar)" name="p_digital_ac" min="0" max="20" value={data.p_digital_ac} previousValue={previousRound?.p_digital_ac} previousTime={previousTime} onChange={onChange} required />
      <Field label="P. Botella (bar)" name="p_botella_ac" min="0" max="20" value={data.p_botella_ac} previousValue={previousRound?.p_botella_ac} previousTime={previousTime} onChange={onChange} required />
      <Field label="T. Compresor (°C)" name="t_compresor_ac" min="0" max="150" value={data.t_compresor_ac} previousValue={previousRound?.t_compresor_ac} previousTime={previousTime} onChange={onChange} required />
      <Field label="Amperaje (A)" name="amperaje_ac" min="0" max="40" value={data.amperaje_ac} previousValue={previousRound?.amperaje_ac} previousTime={previousTime} onChange={onChange} required />
      <select name="nivel_aceite_ac" value={data.nivel_aceite_ac || ''} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white">
        <option value="">Nivel Aceite</option>
        <option value="Normal">Normal</option>
        <option value="Bajo">Bajo</option>
        <option value="Alto">Alto</option>
      </select>
      <select name="estado_ac" value={data.estado_ac || 'standby'} onChange={onChange} className="border rounded-lg px-3 py-1.5 text-sm border-slate-200 bg-white">
        <option value="standby">Stand-by</option>
        <option value="operando">Operando</option>
      </select>
    </div>
    <ObservationsField value={data.observaciones} onChange={onChange} />
  </div>
);

export const GenericEquipmentForm: React.FC<FormProps & { type: EquipmentType }> = ({ data, onChange, type, showHorometro, previousRound, previousTime }) => (
  <div className="space-y-4">
    {showHorometro && <SpecialFieldsInput data={data} onChange={onChange} previousRound={previousRound} previousTime={previousTime} showHorometro={showHorometro} />}
    <p className="text-sm text-slate-500 italic">Ingrese parámetros para {type}.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
       <Field label="Parámetro Principal" name="p1" value={data.p1} previousValue={previousRound?.p1} previousTime={previousTime} onChange={onChange} required />
       <Field label="Parámetro Secundario" name="p2" value={data.p2} previousValue={previousRound?.p2} previousTime={previousTime} onChange={onChange} required />
    </div>
    <ObservationsField value={data.observaciones} onChange={onChange} />
  </div>
);
