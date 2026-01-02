
import { RoundData, EquipmentType } from '../types';
import { EQUIPMENT_LABELS, ROUND_TIMES } from '../constants';

declare const jspdf: any;

const PARAM_CONFIG: Record<string, { label: string, unit: string }> = {
  // Generales / Compartidos
  frecuencia: { label: "FREC", unit: "Hz" },
  potencia: { label: "POT", unit: "kW" },
  carga: { label: "CARGA", unit: "%" },
  rpm: { label: "RPM", unit: "-" },
  trim: { label: "TRIM", unit: "L" },
  consumo: { label: "CONS", unit: "L/h" },
  horometro: { label: "HOROM", unit: "Hrs" },
  
  // Motores Generadores (MG) específicos
  vol_mg_linea_a: { label: "V-L1", unit: "V" },
  vol_mg_linea_b: { label: "V-L2", unit: "V" },
  vol_mg_linea_c: { label: "V-L3", unit: "V" },
  amp_mg_linea_a: { label: "A-L1", unit: "A" },
  amp_mg_linea_b: { label: "A-L2", unit: "A" },
  amp_mg_linea_c: { label: "A-L3", unit: "A" },
  temp_mg_exhosto: { label: "T-EXH", unit: "°C" },
  temp_mg_refrigerante: { label: "T-REFR", unit: "°C" },
  pres_mg_lubricante: { label: "P-LUBR", unit: "kPa" },
  pres_mg_refrigerante: { label: "P-REFR", unit: "kPa" },
  temp_mg_lubricante: { label: "T-LUBR", unit: "°C" },
  temp_mg_combustibe: { label: "T-COMB", unit: "°C" },
  pres_mg_combustible: { label: "P-COMB", unit: "kPa" },
  vol_mg_bateria: { label: "V-BAT", unit: "V" },
  temp_mg_entrada: { label: "T-ENT AG", unit: "°C" },
  pres_mg_entrada_ag: { label: "P-ENT AG", unit: "-" },
  temp_mg_salida: { label: "T-SAL AG", unit: "°C" },
  pres_mg_salida_ag_1: { label: "P-SAL AG", unit: "-" },

  // Propulsores
  consumo_p: { label: "CONS-P", unit: "L/h" },
  rpm_p: { label: "RPM-P", unit: "RPM" },
  pres_agua_camisas_p: { label: "P-CAMI", unit: "kPa" },
  temp_refrigerante_lt_p: { label: "T-REFR-LT", unit: "°C" },
  pres_entrada_motor_p: { label: "P-COMB", unit: "kPa" },
  pres_dif_filtro_p: { label: "P-DIF-C", unit: "kPa" },
  pres_aceite_p: { label: "P-ACEI", unit: "kPa" },
  temp_aceite_p: { label: "T-ACEI", unit: "°C" },
  pres_carter_p: { label: "P-CART", unit: "kPa" },
  temp_cojinete_p: { label: "T-COJI", unit: "°C" },
  voltaje_bateria_p: { label: "V-BAT", unit: "V" },
  lado_izquierdo_p: { label: "T-EXH-IZ", unit: "°C" },
  lado_derecho_p: { label: "T-EXH-DE", unit: "°C" },
  temp_entrada_mar_p: { label: "T-ENT-M", unit: "°C" },
  temp_salida_mar_p: { label: "T-SAL-M", unit: "°C" },
  pres_entrada_p: { label: "P-ENT-M", unit: "psi" },
  pres_salida_p: { label: "P-SAL-M", unit: "psi" },

  // PAA (Aire Acondicionado)
  paa_prioridad: { label: "PRIOR", unit: "-" },
  paa_etapa: { label: "ETAPA", unit: "%" },
  paa_slide_valve: { label: "SLIDE", unit: "%" },
  paa_amperaje: { label: "AMP", unit: "A" },
  paa_t_ret_evap: { label: "T-RET-EV", unit: "°C" },
  paa_p_succion: { label: "P-SUCC", unit: "Bar" },
  paa_p_descarga: { label: "P-DESC", unit: "Bar" },
  paa_t_sum_evap: { label: "T-SUM-EV", unit: "°C" },
  paa_p_ent_cond: { label: "P-ENT-CO", unit: "Bar" },
  paa_p_sal_cond: { label: "P-SAL-CO", unit: "Bar" },
  paa_t_ent_cond: { label: "T-ENT-CO", unit: "°C" },
  paa_t_sal_cond: { label: "T-SAL-CO", unit: "°C" },
  paa_niv_aceite_comp: { label: "N-ACEI", unit: "-" },
  paa_niv_ref_comp: { label: "N-REFR", unit: "-" },
  paa_niv_aceite_cond: { label: "MIRILLA", unit: "-" },

  // Frigoríficos
  p_succion_c1: { label: "P-SUC", unit: "bar" },
  p_descarga_c1: { label: "P-DES", unit: "bar" },
  amperaje_c1: { label: "AMP", unit: "A" },
  frecuencia_c: { label: "FREC", unit: "Hz" },
  rpm_motor_c: { label: "RPM-M", unit: "RPM" },
  pres_succion_comun_c: { label: "P-SUC-B", unit: "bar" },
  pres_descarga_comun_c: { label: "P-DES-B", unit: "bar" },
  temp_motor_c: { label: "T-MOT", unit: "°C" },
  nivel_aceite_c1: { label: "N-ACEI", unit: "-" },
  nivel_refrigerante_c1: { label: "N-REFR", unit: "-" },
  nivel_aceite_cond_1: { label: "MIRILLA", unit: "-" },
  pres_entrada_cond_c: { label: "P-ENT-CO", unit: "bar" },
  pres_salida_cond_c: { label: "P-SAL-CO", unit: "bar" },
  temp_succion_c: { label: "T-SUC", unit: "°C" },
  temp_descarga_c: { label: "T-DES", unit: "°C" },
  temp_plantas_v: { label: "T-PL-VEG", unit: "°C" },
  temp_plantas_c: { label: "T-PL-CAR", unit: "°C" },
  temp_locales_v: { label: "T-LO-VEG", unit: "°C" },
  temp_locales_c: { label: "T-LO-CAR", unit: "°C" },

  // Purificador
  presion_entrega_pur: { label: "P-ENT", unit: "kPa" },
  presion_succion_pur: { label: "P-SUC", unit: "kPa" },
  presion_descarga_pur: { label: "P-DES", unit: "kPa" },
  flujo_combustible_pur: { label: "FLUJO", unit: "L/h" },
  nivel_aceite_pur: { label: "N-ACEI", unit: "-" },
  amperaje_pur: { label: "AMP", unit: "A" },

  // Deoiler
  ppm_deoiler: { label: "PPM", unit: "PPM" },
  flujo_deoiler: { label: "FLUJO", unit: "L/h" },
  presion_sentina_deoiler: { label: "P-SENT", unit: "kPa" },
  presion_cebado_deoiler: { label: "P-CEBA", unit: "kPa" },

  // Manejadoras
  temp_salida_ma: { label: "T-SAL", unit: "°C" },
  temp_retorno_ma: { label: "T-RET", unit: "°C" },
  amperaje_ma: { label: "AMP", unit: "A" },
  frecuencia_ma: { label: "FREC", unit: "Hz" },
  heather_ma: { label: "HEATER", unit: "O/F" },

  // Bow Thruster
  velocidad_motor_bt: { label: "RPM-BT", unit: "RPM" },
  corriente_motor_bt: { label: "AMP-BT", unit: "A" },
  torque_motor_bt: { label: "TORQUE", unit: "%" },
  presion_bt: { label: "PRES", unit: "kPa" },
  temperatura_bt: { label: "TEMP", unit: "°C" },
  horas_bomba_1_bt: { label: "H-B1", unit: "Hrs" },
  horas_bomba_2_bt: { label: "H-B2", unit: "Hrs" },

  // Engranajes
  rpm_engranaje: { label: "RPM-EJE", unit: "RPM" },
  paso_engranaje: { label: "PASO", unit: "%" },
  temp_aceite_cpp: { label: "T-CPP", unit: "°C" },
  presion_aceite_cpp: { label: "P-CPP", unit: "Bar" },
  presion_aceite_engranaje: { label: "P-REDU", unit: "Bar" },
  temp_aceite_engranaje: { label: "T-REDU", unit: "°C" },
  presion_entrada_engranaje: { label: "P-ENT-A", unit: "Bar" },
  temp_entrada_engranaje: { label: "T-ENT-A", unit: "°C" },
  presion_salida_engranaje: { label: "P-SAL-A", unit: "Bar" },
  temp_salida_engranaje: { label: "T-SAL-A", unit: "°C" },
  temp_servomotor_engranaje: { label: "T-SERVO", unit: "°C" },

  // Desalinizadoras
  presion_entrada_des: { label: "P-ENT", unit: "kPa" },
  presion_salida_des: { label: "P-SAL", unit: "kPa" },
  consumo_des: { label: "CONS", unit: "L/h" },
  temp_entrada_agua_des: { label: "T-AGUA", unit: "°C" },
  presion_general_des: { label: "PRES", unit: "kPa" },
  presion_filtro_mic_des: { label: "P-FILT", unit: "kPa" },
  presion_membrana_des: { label: "P-MEMB", unit: "kPa" },
  producido_des: { label: "PROD", unit: "L/h" },
  conductividad_des: { label: "COND", unit: "PPM" },
  profundidad_des: { label: "PROF", unit: "m" },
  concentracion_cloro_des: { label: "CLORO", unit: "PPM" },

  // Aire Comprimido
  p_digital_ac: { label: "P-DIG", unit: "bar" },
  p_botella_ac: { label: "P-BOT", unit: "bar" },
  t_compresor_ac: { label: "T-COMP", unit: "°C" },
  amperaje_ac: { label: "AMP", unit: "A" }
};

export const generateFormalPDF = (rounds: RoundData[], date: string, equipmentType: EquipmentType | string, shouldDownload = true): any => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const LITERS_TO_GALLONS = 0.264172;
  
  // Date es el identificador YYYY-MM-DD del inicio de la guardia
  const d = new Date(date + 'T12:00:00');
  const dNext = new Date(d);
  dNext.setDate(dNext.getDate() + 1);
  const nextDateLabel = dNext.toISOString().split('T')[0];

  // Filtramos todas las rondas que pertenezcan a este inicio de guardia y sistema
  const equipmentRounds = rounds.filter(r => 
    r.equipo_principal === equipmentType && r.fecha === date
  );

  const equipmentLabel = EQUIPMENT_LABELS[equipmentType] || equipmentType;
  const uniqueUnits = Array.from(new Set(equipmentRounds.map(r => r.UNIDAD_ACTIVA)));

  if (uniqueUnits.length === 0) {
    alert(`No se encontraron registros para el equipo "${equipmentLabel}" en la guardia que inició el ${date}. Verifique la fecha.`);
    return;
  }

  const drawPageHeader = () => {
    doc.setDrawColor(80);
    doc.setLineWidth(0.4);
    doc.rect(10, 10, 277, 25);
    doc.line(75, 10, 75, 35);
    doc.line(210, 10, 210, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("FORMATO", 15, 15);
    doc.setFontSize(10);
    doc.text("REGISTRO DE OPERACIÓN Y", 15, 22);
    doc.text("PARÁMETROS TÉCNICOS", 15, 27);
    doc.setFontSize(7);
    doc.text("A4-FOR-044 v3", 15, 32);
    doc.setFontSize(11);
    doc.text("ARMADA DE COLOMBIA", 142, 18, { align: "center" });
    doc.setFontSize(9);
    doc.text("ARC SIMÓN BOLÍVAR - DEPARTAMENTO DE INGENIERÍA", 142, 24, { align: "center" });
    doc.setFontSize(8);
    doc.text("UNIDAD: ARC SIMON BOLIVAR", 215, 18);
    doc.text(`GUARDIA: ${date} AL ${nextDateLabel}`, 215, 26);
    doc.text(`SISTEMA: ${equipmentLabel.toUpperCase()}`, 215, 32);
  };

  drawPageHeader();
  let currentY = 40;

  uniqueUnits.forEach((unitName, index) => {
    const unitRounds = equipmentRounds.filter(r => r.UNIDAD_ACTIVA === unitName);
    doc.setFillColor(230, 235, 245);
    doc.rect(10, currentY, 277, 7, 'F');
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 51, 102);
    doc.text(`DETALLE OPERATIVO - UNIDAD: ${unitName.toUpperCase()}`, 15, currentY + 5);
    doc.setTextColor(0);
    currentY += 10;

    const metadataKeys = ['UNIQUE_KEY', 'TIMESTAMP_GUARDADO', 'fecha', 'ronda_de_inspeccion', 'on_off', 'condicion', 'sg', 'equipo_principal', 'EQUIPO_ACTIVO', 'UNIDAD_ACTIVA', 'signature', 'observaciones', 'horometro', 'trim'];
    const techKeys = Array.from(new Set(unitRounds.flatMap(r => Object.keys(r))))
      .filter(key => !metadataKeys.includes(key))
      .sort((a,b) => {
         const labelA = PARAM_CONFIG[a]?.label || a;
         const labelB = PARAM_CONFIG[b]?.label || b;
         return labelA.localeCompare(labelB);
      });

    const headerRow1 = [
      { content: 'HORA', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
      { content: `PARÁMETROS TÉCNICOS`, colSpan: techKeys.length, styles: { halign: 'center' } },
      { content: 'FIRMA S/G', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } }
    ];

    const headerRow2 = techKeys.map(key => ({
      content: `${PARAM_CONFIG[key]?.label || key}\n(${PARAM_CONFIG[key]?.unit || '-'})`,
      styles: { halign: 'center', fontSize: 4.5 }
    }));

    const tableData = ROUND_TIMES.map(hour => {
      const roundAtHour = unitRounds.find(r => r.ronda_de_inspeccion === hour);
      if (!roundAtHour) return [hour, ...techKeys.map(() => '-'), ''];
      return [
        hour,
        ...techKeys.map(key => roundAtHour[key] !== undefined ? roundAtHour[key] : '-'),
        roundAtHour.sg
      ];
    });

    doc.autoTable({
      startY: currentY,
      head: [headerRow1, headerRow2],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 5.5, cellPadding: 0.6, textColor: 20 },
      headStyles: { fillColor: [0, 51, 102], textColor: 255, fontSize: 4.5 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 10 } },
      margin: { left: 10, right: 10 }
    });

    currentY = doc.lastAutoTable.finalY + 8;
    if (index < uniqueUnits.length - 1 && currentY > 170) {
      doc.addPage();
      drawPageHeader();
      currentY = 40;
    }
  });

  // Espacio para resumen final
  if (currentY > 180) {
     doc.addPage();
     drawPageHeader();
     currentY = 40;
  }

  doc.setDrawColor(0, 51, 102);
  doc.setFillColor(245, 247, 250);
  const summaryBoxHeight = Math.max(24, Math.ceil(uniqueUnits.length / 3) * 12 + 10);
  doc.rect(10, currentY, 277, summaryBoxHeight, 'F');
  doc.rect(10, currentY, 277, summaryBoxHeight);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`CIERRE OPERATIVO DE GUARDIA (${date} 09:00 - ${nextDateLabel} 08:00)`, 15, currentY + 6);
  
  let hX = 15;
  let hY = currentY + 12;
  uniqueUnits.forEach((unit, idx) => {
     const round09 = equipmentRounds.find(r => r.UNIDAD_ACTIVA === unit && r.ronda_de_inspeccion === "09:00");
     const round08 = equipmentRounds.find(r => r.UNIDAD_ACTIVA === unit && r.ronda_de_inspeccion === "08:00");
     const hVal = round08?.horometro || "N/R";
     
     let extraInfo = "";
     if (equipmentType === EquipmentType.GENERADORES || equipmentType === EquipmentType.PROPULSORES) {
        if (round08?.trim !== undefined && round09?.trim !== undefined) {
           const diffLiters = Math.abs(parseFloat(round08.trim) - parseFloat(round09.trim));
           const gallons = diffLiters * LITERS_TO_GALLONS;
           extraInfo = `Consumo: ${gallons.toFixed(1)} Gal.`;
        }
     }
     
     if (idx > 0 && idx % 3 === 0) {
        hX = 15;
        hY += 12;
     }
     doc.setFontSize(7);
     doc.setFont("helvetica", "bold");
     doc.text(`${unit.toUpperCase()}:`, hX, hY);
     doc.setFont("helvetica", "normal");
     doc.text(`Horómetro Final: ${hVal} Hrs. ${extraInfo}`, hX, hY + 4);
     hX += 90;
  });

  currentY += summaryBoxHeight + 8;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("OBSERVACIONES TÉCNICAS Y NOVEDADES:", 10, currentY);
  const allObs = equipmentRounds
    .filter(r => r.observaciones)
    .map(r => `[${r.ronda_de_inspeccion} - ${r.UNIDAD_ACTIVA}]: ${r.observaciones}`)
    .join(" | ");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(doc.splitTextToSize(allObs || "Sin novedades reportadas durante la guardia.", 270), 10, currentY + 4);

  const signY = 185;
  doc.setDrawColor(180);
  doc.line(30, signY, 110, signY);
  doc.line(170, signY, 250, signY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SUBOFICIAL DE GUARDIA INGENIERÍA", 70, signY + 5, { align: "center" });
  doc.text("JEFE DEPARTAMENTO DE INGENIERÍA", 210, signY + 5, { align: "center" });

  if (shouldDownload) {
    doc.save(`REPORTE_${equipmentType.toUpperCase()}_GUARDIA_${date}.pdf`);
  }
  return doc.output('blob');
};

export const exportDetailedCSV = (rounds: RoundData[]) => {
  if (rounds.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  const metadataKeys = [
    'UNIQUE_KEY', 'TIMESTAMP_GUARDADO', 'fecha', 'ronda_de_inspeccion', 
    'on_off', 'condicion', 'sg', 'equipo_principal', 'EQUIPO_ACTIVO', 
    'UNIDAD_ACTIVA', 'signature', 'observaciones', 'horometro', 'trim'
  ];

  const allTechKeys = Array.from(new Set(rounds.flatMap(r => Object.keys(r))))
    .filter(key => !metadataKeys.includes(key))
    .sort();

  const headers = [
    "FOLIO_GUARDIA",
    "HORA_RONDA",
    "SISTEMA",
    "UNIDAD",
    "PERSONAL_SG",
    "HOROMETRO",
    ...allTechKeys.map(key => `${key.toUpperCase()}${PARAM_CONFIG[key] ? `_(${PARAM_CONFIG[key].unit})` : ''}`),
    "OBSERVACIONES",
    "REGISTRO_HORA_REAL"
  ];

  const rows = rounds.map(r => {
    const rowData = [
      r.fecha,
      r.ronda_de_inspeccion,
      r.EQUIPO_ACTIVO || r.equipo_principal,
      r.UNIDAD_ACTIVA,
      r.sg,
      r.horometro || '0',
      ...allTechKeys.map(key => r[key] !== undefined ? r[key] : ''),
      (r.observaciones || '').replace(/;/g, ",").replace(/\n/g, " "),
      r.TIMESTAMP_GUARDADO
    ];
    return rowData.join(";");
  });

  const csvContent = "\uFEFF" + headers.join(";") + "\n" + rows.join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `BASE_DATOS_INGENIERIA_ARC_SIMBOL_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
