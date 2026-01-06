import { RoundData, EquipmentType } from '../types';
import { EQUIPMENT_LABELS, ROUND_TIMES } from '../constants';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]); // remove data:application/pdf;base64,
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const saveAndShareFile = async (blob: Blob, fileName: string) => {
  if (Capacitor.isNativePlatform()) {
    try {
      if (blob.size === 0) {
        alert("Error: El archivo generado está vacío.");
        return;
      }

      console.log('Iniciando proceso de guardado nativo:', fileName);
      const base64Data = await blobToBase64(blob);
      
      // Intentamos escribir en Cache
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Verificamos si podemos compartir
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: 'Compartir Reporte',
          text: `Reporte generado: ${fileName}`,
          url: savedFile.uri,
          dialogTitle: `Guardar/Enviar ${fileName}`,
        });
      } else {
        alert("El sistema no permite compartir archivos directamente.");
      }
    } catch (error: any) {
      console.error('Error detallado:', error);
      alert(`ERROR CRÍTICO: ${error.message || JSON.stringify(error)}`);
    }
  } else {
    // Fallback for web
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

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

import JSZip from 'jszip';

// Helper interno para generar un solo PDF y retornarlo (blob) sin guardar si se solicita
const createAndSavePDF = async (rounds: RoundData[], date: string, equipmentType: string, shouldDownload: boolean) => {
    // ... (Keep existing generation logic)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const LITERS_TO_GALLONS = 0.264172;
    
    const d = new Date(date + 'T12:00:00');
    const dNext = new Date(d);
    dNext.setDate(dNext.getDate() + 1);
    const nextDateLabel = dNext.toISOString().split('T')[0];

    // Filter rounds for this specific equipment and date
    const equipmentRounds = rounds.filter(r => 
        r.equipo_principal === equipmentType && r.fecha === date
    );

    if (equipmentRounds.length === 0) return null; // No data

    const equipmentLabel = EQUIPMENT_LABELS[equipmentType as EquipmentType] || equipmentType;
    const uniqueUnits = Array.from(new Set(equipmentRounds.map(r => r.UNIDAD_ACTIVA))).sort();

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

    const drawPageFooter = (pageNumber: number, totalPages: number) => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Página ${pageNumber} de ${totalPages}`, 277, 200, { align: 'right' });
    };

    const totalPagesCount = uniqueUnits.length;

    uniqueUnits.forEach((unitName, index) => {
        if (index > 0) doc.addPage();
        drawPageHeader();
        
        let currentY = 40;
        const unitRounds = equipmentRounds.filter(r => r.UNIDAD_ACTIVA === unitName);
        
        doc.setFillColor(230, 235, 245);
        doc.rect(10, currentY, 277, 7, 'F');
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 51, 102);
        doc.text(`DETALLE OPERATIVO - UNIDAD: ${unitName.toUpperCase()}`, 15, currentY + 5);
        doc.setTextColor(0);
        currentY += 10;

        // --- FILTERING OUT TECHNICAL COLUMNS ---
        const metadataKeys = [
            'UNIQUE_KEY', 'TIMESTAMP_GUARDADO', 'fecha', 'ronda_de_inspeccion', 
            'on_off', 'condicion', 'sg', 'equipo_principal', 'EQUIPO_ACTIVO', 
            'UNIDAD_ACTIVA', 'signature', 'observaciones', 'horometro', 'trim',
            'isDeleted', 'lastUpdated', 'audit_trail', 'version' // Excluded
        ];

        const techKeys = Array.from(new Set(unitRounds.flatMap(r => Object.keys(r))))
        .filter(key => !metadataKeys.includes(key))
        .sort((a,b) => {
            const labelA = PARAM_CONFIG[a]?.label || a;
            const labelB = PARAM_CONFIG[b]?.label || b;
            return labelA.localeCompare(labelB);
        });

        const headerRow1 = [
        { content: 'HORA', rowSpan: 2, styles: { halign: 'center' as any, valign: 'middle' as any } },
        { content: `PARÁMETROS TÉCNICOS`, colSpan: techKeys.length, styles: { halign: 'center' as any } },
        { content: 'FIRMA S/G', rowSpan: 2, styles: { halign: 'center' as any, valign: 'middle' as any } }
        ];

        const headerRow2 = techKeys.map(key => ({
        content: `${PARAM_CONFIG[key]?.label || key}\n(${PARAM_CONFIG[key]?.unit || '-'})`,
        styles: { halign: 'center' as any, fontSize: 4.5 }
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

        autoTable(doc, {
        startY: currentY,
        head: [headerRow1, headerRow2],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 5.5, cellPadding: 0.6, textColor: 20 },
        headStyles: { fillColor: [0, 51, 102], textColor: 255, fontSize: 4.5 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 10 } },
        margin: { left: 10, right: 10 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;

        // --- SUMMARY ---
        doc.setDrawColor(0, 51, 102);
        doc.setFillColor(245, 247, 250);
        const summaryBoxHeight = 25;
        
        doc.rect(10, currentY, 277, summaryBoxHeight, 'F');
        doc.rect(10, currentY, 277, summaryBoxHeight);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(`CIERRE OPERATIVO DE GUARDIA (${date} 09:00 - ${nextDateLabel} 08:00)`, 15, currentY + 6);

        const round09 = unitRounds.find(r => r.ronda_de_inspeccion === "09:00");
        const round08 = unitRounds.find(r => r.ronda_de_inspeccion === "08:00");
        
        const hIni = round09?.horometro || "N/R";
        const hFin = round08?.horometro || "N/R";
        
        let extraInfo = "";
        if (equipmentType === EquipmentType.GENERADORES || equipmentType === EquipmentType.PROPULSORES) {
        if (round08?.trim !== undefined && round09?.trim !== undefined) {
            const diffLiters = Math.abs(Number(round08.trim) - Number(round09.trim));
            const gallons = diffLiters * LITERS_TO_GALLONS;
            extraInfo = `| Consumo: ${gallons.toFixed(1)} Gal.`;
        }
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(`H. Inicial (09:00): ${hIni} Hrs`, 15, currentY + 12);
        doc.text(`H. Final (08:00): ${hFin} Hrs ${extraInfo}`, 15, currentY + 18);

        currentY += summaryBoxHeight + 5;
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.text("OBSERVACIONES TÉCNICAS Y NOVEDADES REPORTADAS:", 10, currentY);
        
        const unitObs = unitRounds
        .filter(r => r.observaciones)
        .map(r => `[${r.ronda_de_inspeccion}]: ${r.observaciones}`)
        .join(" | ");
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        const splitObs = doc.splitTextToSize(unitObs || "Sin novedades reportadas para esta unidad durante la guardia.", 270);
        doc.text(splitObs, 10, currentY + 5);

        // --- SIGNATURES ---
        const signY = 185;
        doc.setDrawColor(180);
        doc.setLineWidth(0.2);
        
        doc.line(20, signY, 90, signY);       // Suboficial
        doc.line(113.5, signY, 183.5, signY); // Oficial
        doc.line(207, signY, 277, signY);     // Jefe
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        
        doc.text("SUBOFICIAL DE GUARDIA INGENIERÍA", 55, signY + 5, { align: "center" });
        doc.text("OFICIAL DE GUARDIA INGENIERÍA", 148.5, signY + 5, { align: "center" });
        doc.text("JEFE DEPARTAMENTO DE INGENIERÍA", 242, signY + 5, { align: "center" });

        drawPageFooter(index + 1, totalPagesCount);
    });

    const fileName = `REPORTE_${equipmentType.toUpperCase()}_GUARDIA_${date}.pdf`;
    const blob = doc.output('blob');

    if (shouldDownload) {
        await saveAndShareFile(blob, fileName);
    }
    return blob;
};

export const generateFormalPDF = async (rounds: RoundData[], date: string, equipmentType: EquipmentType | string | string[], shouldDownload = true): Promise<any> => {
  try {
    alert("Iniciando generación de reportes...");

    let typesToProcess: string[] = [];
    
    if (Array.isArray(equipmentType)) {
        typesToProcess = equipmentType;
    } else if (equipmentType === 'ALL') {
         // Get all types that actually have data
         const availableTypes = new Set(rounds.map(r => r.equipo_principal));
         typesToProcess = Array.from(availableTypes).sort();
    } else {
         typesToProcess = [equipmentType as string];
    }

    if (typesToProcess.length === 0) {
        alert("No hay datos para generar reporte.");
        return;
    }

    // Process each type sequentially
    const generatedBlobs: Blob[] = [];
    const generatedFiles: { name: string, blob: Blob }[] = [];

    // NOTE: If more than 1 file is generated, we switch to Batch mode (ZIP)
    const isBatchMode = typesToProcess.length > 1;

    for (const type of typesToProcess) {
        // Only trigger individual download if NOT in batch mode AND shouldDownload is true
        const individualDownload = !isBatchMode && shouldDownload;
        const blob = await createAndSavePDF(rounds, date, type, individualDownload);
        
        if (blob) {
            generatedBlobs.push(blob);
            generatedFiles.push({
                name: `REPORTE_${type.toUpperCase()}_GUARDIA_${date}.pdf`,
                blob: blob
            });
        }
        
        // Small delay to ensure UI responsiveness or share dialog handling if needed
        await new Promise(resolve => setTimeout(resolve, isBatchMode ? 50 : 800));
    }

    if (isBatchMode && generatedFiles.length > 0 && shouldDownload) {
        // Zip implementation
        try {
            alert("Empaquetando reportes en archivo ZIP...");
            const zip = new JSZip();
            generatedFiles.forEach(file => {
                zip.file(file.name, file.blob);
            });
            
            const zipContent = await zip.generateAsync({ type: 'blob' });
            const zipName = `REPORTES_GUARDIA_INGENIERIA_${date}.zip`;
            
            await saveAndShareFile(zipContent, zipName);

        } catch (zipError) {
            console.error("Error zipping:", zipError);
            alert("Error al comprimir archivos. Se intentarán descargar individualmente.");
            // Fallback: download individually? No, users asked not to prompt multiple times.
        }
    }
    
    alert("Proceso finalizado. Revise las descargas/compartir.");
    return generatedBlobs.length === 1 ? generatedBlobs[0] : generatedBlobs;

  } catch (error: any) {
    console.error('Error en generateFormalPDF:', error);
    alert(`Error constructivo PDF: ${error.message || JSON.stringify(error)}`);
  }
};

export const exportDetailedCSV = async (rounds: RoundData[]) => {
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
  const fileName = `BASE_DATOS_INGENIERIA_ARC_SIMBOL_${new Date().toISOString().split('T')[0]}.csv`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  await saveAndShareFile(blob, fileName);
};
