
import { GoogleGenAI, Type } from "@google/genai";

export const analyzeParameters = async (equipmentType: string, parameters: any) => {
  // Inicializar justo antes de usar
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza los siguientes parámetros técnicos para el equipo ${equipmentType}: ${JSON.stringify(parameters)}. 
      Determina si hay anomalías, riesgos o sugerencias de mantenimiento basadas en estándares navales generales.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: 'Estado general (Normal, Advertencia, Crítico)' },
            analysis: { type: Type.STRING, description: 'Análisis detallado de los parámetros' },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de alertas específicas' },
            recommendations: { type: Type.STRING, description: 'Recomendaciones de acción' }
          },
          required: ["status", "analysis", "warnings", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      status: "Error",
      analysis: "No se pudo realizar el análisis por IA en este momento.",
      warnings: [],
      recommendations: "Verifique los parámetros manualmente."
    };
  }
};

export const analyzeTrends = async (equipmentType: string, history: any[]) => {
  // Inicializar justo antes de usar
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Eres un experto en ingeniería naval de la Armada. Analiza el comportamiento histórico de los parámetros del equipo "${equipmentType}" en las últimas guardias. 
      Datos: ${JSON.stringify(history)}.
      Identifica:
      1. Tendencias de desgaste o fallas inminentes.
      2. Comparativa entre unidades si aplica.
      3. Recomendaciones de mantenimiento preventivo basado en datos reales.
      Responde de forma técnica, concisa y profesional.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            prediction: { type: Type.STRING },
            criticalLevel: { type: Type.NUMBER, description: '0 a 10' }
          },
          required: ["title", "summary", "insights", "prediction", "criticalLevel"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Trend Analysis Error:", error);
    return {
      title: "Error de Análisis",
      summary: "No se pudo generar el análisis de tendencias.",
      insights: ["Verifique la conexión a internet", "Asegúrese de tener suficientes registros históricos"],
      prediction: "N/A",
      criticalLevel: 0
    };
  }
};
